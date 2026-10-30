"""
VITSpace Backend — Database Connection Layer
Supports local SQLite database (default) and Oracle Database.
"""

import os
import re
import sqlite3
from contextlib import contextmanager
from typing import Generator, Any
from pathlib import Path
from app.core.config import get_settings

try:
    import oracledb
    oracledb.init_oracle_client = None  # Thin mode
except ImportError:
    oracledb = None


class SQLiteCursorWrapper:
    """
    Wraps an sqlite3.Cursor to provide compatibility with Oracle-style parameter
    bindings (:1, :2), pagination (OFFSET x ROWS FETCH NEXT y ROWS ONLY),
    and ensures column names in description are uppercase.
    """

    def __init__(self, cursor: sqlite3.Cursor):
        self._cur = cursor

    def execute(self, sql: str, params: Any = None):
        # Convert Oracle pagination: OFFSET <p1> ROWS FETCH NEXT <p2> ROWS ONLY -> LIMIT <p2> OFFSET <p1>
        sql = re.sub(
            r"OFFSET\s+(\S+)\s+ROWS\s+FETCH\s+NEXT\s+(\S+)\s+ROWS\s+ONLY",
            r"LIMIT \2 OFFSET \1",
            sql,
            flags=re.IGNORECASE,
        )

        if params is not None and isinstance(params, (list, tuple)):
            # Convert positional :1, :2 bindings to ?
            sql = re.sub(r":\d+", "?", sql)
            return self._cur.execute(sql, params)
        elif params is not None:
            return self._cur.execute(sql, params)
        else:
            return self._cur.execute(sql)

    def executemany(self, sql: str, seq_of_params: Any):
        if seq_of_params and isinstance(seq_of_params[0], (list, tuple)):
            sql = re.sub(r":\d+", "?", sql)
        return self._cur.executemany(sql, seq_of_params)

    @property
    def description(self):
        if not self._cur.description:
            return None
        # Normalize column names to uppercase to match Oracle conventions expected by routers
        return tuple((col[0].upper(), *col[1:]) for col in self._cur.description)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def fetchmany(self, size: int = 1):
        return self._cur.fetchmany(size)

    @property
    def rowcount(self):
        return self._cur.rowcount

    @property
    def lastrowid(self):
        return self._cur.lastrowid

    def close(self):
        return self._cur.close()


def _get_sqlite_path() -> Path:
    s = get_settings()
    p = Path(s.sqlite_db_path)
    if not p.is_absolute():
        # Place next to backend/ directory if relative
        backend_dir = Path(__file__).resolve().parent.parent.parent
        p = backend_dir / s.sqlite_db_path
    return p


_sqlite_initialized = False


def init_sqlite_db(force: bool = False):
    """Create SQLite tables and seed data if not already initialized."""
    global _sqlite_initialized
    if _sqlite_initialized and not force:
        return

    db_path = _get_sqlite_path()
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        cur = conn.cursor()

        # Create schema
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS ROOM (
                RoomID INTEGER PRIMARY KEY AUTOINCREMENT,
                RoomNumber TEXT NOT NULL UNIQUE,
                Block TEXT DEFAULT 'PRP' NOT NULL,
                Floor INTEGER NOT NULL CHECK (Floor BETWEEN 1 AND 7),
                RoomType TEXT NOT NULL CHECK (RoomType IN ('Classroom', 'Lab')),
                Capacity INTEGER NOT NULL CHECK (Capacity > 0)
            );

            CREATE TABLE IF NOT EXISTS STUDENTS (
                RegNo TEXT PRIMARY KEY,
                Name TEXT NOT NULL,
                Mail TEXT NOT NULL,
                Dept TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ROOM_SCHEDULE (
                ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT,
                RoomID INTEGER NOT NULL REFERENCES ROOM(RoomID) ON DELETE CASCADE,
                DayOfWeek TEXT NOT NULL CHECK (DayOfWeek IN ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
                SlotNumber INTEGER NOT NULL,
                StartTime TEXT NOT NULL,
                EndTime TEXT NOT NULL,
                CONSTRAINT UQ_ROOM_DAY_SLOT UNIQUE (RoomID, DayOfWeek, SlotNumber)
            );

            CREATE TABLE IF NOT EXISTS AUTH (
                UserID INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT NOT NULL UNIQUE,
                PasswordHash TEXT NOT NULL,
                Role TEXT DEFAULT 'student' NOT NULL CHECK (Role IN ('student', 'admin')),
                RegNo TEXT REFERENCES STUDENTS(RegNo) ON DELETE SET NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Check if rooms exist, if not, seed default data
        cur.execute("SELECT COUNT(*) FROM ROOM")
        if cur.fetchone()[0] == 0:
            try:
                from app.database.seed_data import SEED_DATA

                for r in SEED_DATA.get("ROOM", []):
                    cur.execute(
                        "INSERT OR IGNORE INTO ROOM (RoomID, RoomNumber, Block, Floor, RoomType, Capacity) VALUES (?, ?, ?, ?, ?, ?)",
                        (int(r["ROOMID"]), r["ROOMNUMBER"], r.get("BLOCK", "PRP"), int(r["FLOOR"]), r["ROOMTYPE"], int(r["CAPACITY"])),
                    )

                for s in SEED_DATA.get("STUDENTS", []):
                    cur.execute(
                        "INSERT OR IGNORE INTO STUDENTS (RegNo, Name, Mail, Dept) VALUES (?, ?, ?, ?)",
                        (s["REGNO"], s["NAME"], s["MAIL"], s["DEPT"]),
                    )

                for sch in SEED_DATA.get("ROOM_SCHEDULE", []):
                    cur.execute(
                        "INSERT OR IGNORE INTO ROOM_SCHEDULE (ScheduleID, RoomID, DayOfWeek, SlotNumber, StartTime, EndTime) VALUES (?, ?, ?, ?, ?, ?)",
                        (int(sch["SCHEDULEID"]), int(sch["ROOMID"]), sch["DAYOFWEEK"], int(sch["SLOTNUMBER"]), sch["STARTTIME"], sch["ENDTIME"]),
                    )

                for a in SEED_DATA.get("AUTH", []):
                    cur.execute(
                        "INSERT OR IGNORE INTO AUTH (UserID, Username, PasswordHash, Role, RegNo, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)",
                        (int(a["USERID"]), a["USERNAME"], a["PASSWORDHASH"], a["ROLE"], a["REGNO"], a["CREATEDAT"]),
                    )
            except Exception as e:
                print(f"[WARN] Error seeding local database: {e}")

        conn.commit()
        _sqlite_initialized = True
    finally:
        conn.close()


def get_connection():
    """Create a new database connection according to config."""
    s = get_settings()
    if s.db_type == "sqlite":
        init_sqlite_db()
        conn = sqlite3.connect(_get_sqlite_path(), check_same_thread=False)
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn
    elif s.db_type == "oracle":
        if oracledb is None:
            raise RuntimeError("oracledb package is required for Oracle database connection.")
        return oracledb.connect(user=s.oracle_user, password=s.oracle_password, dsn=s.oracle_dsn)
    else:
        raise ValueError(f"Unsupported db_type: {s.db_type}")


@contextmanager
def get_db() -> Generator[Any, None, None]:
    """Context manager for database connections with auto-commit on success."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def get_cursor(conn: Any) -> Generator[Any, None, None]:
    """Context manager for cursors with SQLite compatibility wrapping."""
    s = get_settings()
    cur = conn.cursor()
    try:
        if s.db_type == "sqlite":
            yield SQLiteCursorWrapper(cur)
        else:
            yield cur
    finally:
        cur.close()


def check_connection() -> dict[str, Any]:
    """Verify database connectivity and check required tables exist."""
    s = get_settings()
    try:
        with get_db() as conn:
            with get_cursor(conn) as cur:
                if s.db_type == "sqlite":
                    cur.execute("SELECT sqlite_version()")
                    row = cur.fetchone()
                    db_version = f"SQLite {row[0]} (Local)"

                    cur.execute(
                        """SELECT name FROM sqlite_master
                           WHERE type IN ('table', 'view')
                             AND name IN ('ROOM', 'ROOM_SCHEDULE', 'STUDENTS', 'STUDENT', 'AUTH')"""
                    )
                    found = {r[0] for r in cur.fetchall()}
                else:
                    cur.execute("SELECT banner FROM v$version WHERE ROWNUM = 1")
                    row = cur.fetchone()
                    db_version = row[0] if row else "Unknown"

                    cur.execute(
                        """SELECT object_name FROM user_objects
                           WHERE object_name IN ('ROOM', 'ROOM_SCHEDULE', 'STUDENTS', 'STUDENT', 'AUTH')
                             AND object_type IN ('TABLE', 'VIEW')"""
                    )
                    found = {r[0] for r in cur.fetchall()}

                has_student = "STUDENTS" in found or "STUDENT" in found
                missing = []
                if "ROOM" not in found:
                    missing.append("ROOM")
                if "ROOM_SCHEDULE" not in found:
                    missing.append("ROOM_SCHEDULE")
                if not has_student:
                    missing.append("STUDENT/STUDENTS")

                return {
                    "status": "connected",
                    "mode": "local_sqlite" if s.db_type == "sqlite" else "remote_oracle",
                    "version": db_version,
                    "tables_found": list(found),
                    "tables_missing": missing,
                    "auth_table_exists": "AUTH" in found,
                }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def get_table_columns(table_name: str) -> list[dict]:
    """Inspect column metadata for a given table."""
    s = get_settings()
    with get_db() as conn:
        with get_cursor(conn) as cur:
            if s.db_type == "sqlite":
                cur.execute(f"PRAGMA table_info({table_name})")
                return [
                    {
                        "column": r[1].upper(),
                        "type": r[2],
                        "length": None,
                        "nullable": not r[3],
                    }
                    for r in cur.fetchall()
                ]
            else:
                cur.execute(
                    """
                    SELECT column_name, data_type, data_length, nullable
                    FROM user_tab_columns
                    WHERE table_name = :1
                    ORDER BY column_id
                    """,
                    [table_name.upper()],
                )
                return [
                    {
                        "column": r[0],
                        "type": r[1],
                        "length": r[2],
                        "nullable": r[3] == "Y",
                    }
                    for r in cur.fetchall()
                ]

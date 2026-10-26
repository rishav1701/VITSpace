"""
VITSpace Backend — Oracle Database Connection Layer
Uses python-oracledb in thin mode (no Oracle Client needed).
"""

import oracledb
from contextlib import contextmanager
from typing import Generator, Any
from app.core.config import get_settings

# Use thin mode — no Oracle Instant Client required
oracledb.init_oracle_client = None  # ensure thin mode


def _get_connection_params() -> dict:
    s = get_settings()
    return {"user": s.oracle_user, "password": s.oracle_password, "dsn": s.oracle_dsn}


def get_connection() -> oracledb.Connection:
    """Create a new Oracle connection."""
    return oracledb.connect(**_get_connection_params())


@contextmanager
def get_db() -> Generator[oracledb.Connection, None, None]:
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
def get_cursor(conn: oracledb.Connection) -> Generator[oracledb.Cursor, None, None]:
    """Context manager for cursors."""
    cursor = conn.cursor()
    try:
        yield cursor
    finally:
        cursor.close()


def check_connection() -> dict[str, Any]:
    """Verify Oracle connectivity and check required tables exist."""
    try:
        with get_db() as conn:
            with get_cursor(conn) as cur:
                # Check database version
                cur.execute("SELECT banner FROM v$version WHERE ROWNUM = 1")
                row = cur.fetchone()
                db_version = row[0] if row else "Unknown"

                # Check required tables & views (STUDENT or STUDENTS)
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
                    "version": db_version,
                    "tables_found": list(found),
                    "tables_missing": missing,
                    "auth_table_exists": "AUTH" in found,
                }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def get_table_columns(table_name: str) -> list[dict]:
    """Inspect column metadata for a given table."""
    with get_db() as conn:
        with get_cursor(conn) as cur:
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

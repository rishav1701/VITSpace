"""
VITSpace — Auth Repository (Oracle)
"""

from app.database.connection import get_db, get_cursor
from typing import Optional


def get_user_by_username(username: str) -> Optional[dict]:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """SELECT UserID, Username, PasswordHash, Role, RegNo
                   FROM AUTH WHERE Username = :1""",
                [username],
            )
            row = cur.fetchone()
            if not row:
                return None
            columns = [c[0] for c in cur.description]
            return dict(zip(columns, row))


def create_user(username: str, password_hash: str, role: str, reg_no: Optional[str] = None) -> dict:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO AUTH (Username, PasswordHash, Role, RegNo)
                   VALUES (:1, :2, :3, :4)""",
                [username, password_hash, role, reg_no],
            )
    return get_user_by_username(username)


def user_exists(username: str) -> bool:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) FROM AUTH WHERE Username = :1", [username])
            return cur.fetchone()[0] > 0


def get_admin_count() -> int:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) FROM AUTH WHERE Role = 'admin'")
            return cur.fetchone()[0]

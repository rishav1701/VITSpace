"""
VITSpace — Student Repository (Oracle)
"""

from app.database.connection import get_db, get_cursor
from typing import Optional


def get_all_students(
    search: Optional[str] = None,
    dept: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    conditions = []
    params = {}
    idx = 1

    if search:
        conditions.append(
            f"(UPPER(RegNo) LIKE UPPER(:p{idx}) OR UPPER(Name) LIKE UPPER(:p{idx}) OR UPPER(Mail) LIKE UPPER(:p{idx}))"
        )
        params[f"p{idx}"] = f"%{search}%"
        idx += 1
    if dept:
        conditions.append(f"Dept = :p{idx}")
        params[f"p{idx}"] = dept
        idx += 1

    where = " WHERE " + " AND ".join(conditions) if conditions else ""

    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(f"SELECT COUNT(*) FROM STUDENTS{where}", params)
            total = cur.fetchone()[0]

            params[f"p{idx}"] = limit
            params[f"p{idx+1}"] = offset
            cur.execute(
                f"""SELECT RegNo, Name, Mail, Dept FROM STUDENTS{where}
                    ORDER BY RegNo
                    OFFSET :p{idx+1} ROWS FETCH NEXT :p{idx} ROWS ONLY""",
                params,
            )
            columns = [c[0] for c in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    return rows, total


def get_student_by_regno(reg_no: str) -> Optional[dict]:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT RegNo, Name, Mail, Dept FROM STUDENTS WHERE RegNo = :1",
                [reg_no],
            )
            row = cur.fetchone()
            if not row:
                return None
            columns = [c[0] for c in cur.description]
            return dict(zip(columns, row))


def create_student(data: dict) -> dict:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO STUDENTS (RegNo, Name, Mail, Dept)
                   VALUES (:1, :2, :3, :4)""",
                [data["reg_no"], data["name"], data["mail"], data["dept"]],
            )
    return get_student_by_regno(data["reg_no"])


def update_student(reg_no: str, data: dict) -> Optional[dict]:
    updates = []
    params = {}
    idx = 1

    field_map = {"name": "Name", "mail": "Mail", "dept": "Dept"}

    for key, col in field_map.items():
        if key in data and data[key] is not None:
            updates.append(f"{col} = :p{idx}")
            params[f"p{idx}"] = data[key]
            idx += 1

    if not updates:
        return get_student_by_regno(reg_no)

    params[f"p{idx}"] = reg_no

    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                f"UPDATE STUDENTS SET {', '.join(updates)} WHERE RegNo = :p{idx}",
                params,
            )
            if cur.rowcount == 0:
                return None

    return get_student_by_regno(reg_no)


def delete_student(reg_no: str) -> bool:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Check if student has an auth record
            cur.execute("SELECT UserID FROM AUTH WHERE RegNo = :1", [reg_no])
            if cur.fetchone():
                cur.execute("DELETE FROM AUTH WHERE RegNo = :1", [reg_no])
            cur.execute("DELETE FROM STUDENTS WHERE RegNo = :1", [reg_no])
            return cur.rowcount > 0


def get_departments() -> list[str]:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT DISTINCT Dept FROM STUDENTS ORDER BY Dept")
            return [r[0] for r in cur.fetchall()]


def get_student_count() -> int:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) FROM STUDENTS")
            return cur.fetchone()[0]

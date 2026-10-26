"""
VITSpace — Room Repository (Oracle CRUD)
"""

from app.database.connection import get_db, get_cursor
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from typing import Optional


def get_all_rooms(
    block: Optional[str] = None,
    floor: Optional[int] = None,
    room_type: Optional[str] = None,
    search: Optional[str] = None,
    min_capacity: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Fetch rooms with optional filters. Returns (rows, total_count)."""
    conditions = []
    params = {}
    idx = 1

    if block:
        conditions.append(f"Block = :p{idx}")
        params[f"p{idx}"] = block
        idx += 1
    if floor is not None:
        conditions.append(f"Floor = :p{idx}")
        params[f"p{idx}"] = floor
        idx += 1
    if room_type:
        conditions.append(f"RoomType = :p{idx}")
        params[f"p{idx}"] = room_type
        idx += 1
    if search:
        conditions.append(f"UPPER(RoomNumber) LIKE UPPER(:p{idx})")
        params[f"p{idx}"] = f"%{search}%"
        idx += 1
    if min_capacity is not None:
        conditions.append(f"Capacity >= :p{idx}")
        params[f"p{idx}"] = min_capacity
        idx += 1

    where = " WHERE " + " AND ".join(conditions) if conditions else ""

    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Count
            cur.execute(f"SELECT COUNT(*) FROM ROOM{where}", params)
            total = cur.fetchone()[0]

            # Data with pagination
            params[f"p{idx}"] = limit
            params[f"p{idx+1}"] = offset
            cur.execute(
                f"""SELECT RoomID, RoomNumber, Block, Floor, RoomType, Capacity
                    FROM ROOM{where}
                    ORDER BY Floor, RoomNumber
                    OFFSET :p{idx+1} ROWS FETCH NEXT :p{idx} ROWS ONLY""",
                params,
            )
            columns = [c[0] for c in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    return rows, total


def get_room_by_id(room_id: int) -> Optional[dict]:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT RoomID, RoomNumber, Block, Floor, RoomType, Capacity FROM ROOM WHERE RoomID = :1",
                [room_id],
            )
            row = cur.fetchone()
            if not row:
                return None
            columns = [c[0] for c in cur.description]
            return dict(zip(columns, row))


def create_room(data: RoomCreate) -> dict:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Let the trigger/sequence handle RoomID
            cur.execute(
                """INSERT INTO ROOM (RoomNumber, Block, Floor, RoomType, Capacity)
                   VALUES (:1, :2, :3, :4, :5)""",
                [data.room_number, data.block, data.floor, data.room_type, data.capacity],
            )
            # Get the inserted ID
            cur.execute(
                "SELECT RoomID, RoomNumber, Block, Floor, RoomType, Capacity FROM ROOM WHERE RoomNumber = :1",
                [data.room_number],
            )
            row = cur.fetchone()
            columns = [c[0] for c in cur.description]
            return dict(zip(columns, row))


def update_room(room_id: int, data: RoomUpdate) -> Optional[dict]:
    updates = []
    params = {}
    idx = 1

    if data.room_number is not None:
        updates.append(f"RoomNumber = :p{idx}")
        params[f"p{idx}"] = data.room_number
        idx += 1
    if data.block is not None:
        updates.append(f"Block = :p{idx}")
        params[f"p{idx}"] = data.block
        idx += 1
    if data.floor is not None:
        updates.append(f"Floor = :p{idx}")
        params[f"p{idx}"] = data.floor
        idx += 1
    if data.room_type is not None:
        updates.append(f"RoomType = :p{idx}")
        params[f"p{idx}"] = data.room_type
        idx += 1
    if data.capacity is not None:
        updates.append(f"Capacity = :p{idx}")
        params[f"p{idx}"] = data.capacity
        idx += 1

    if not updates:
        return get_room_by_id(room_id)

    params[f"p{idx}"] = room_id

    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                f"UPDATE ROOM SET {', '.join(updates)} WHERE RoomID = :p{idx}",
                params,
            )
            if cur.rowcount == 0:
                return None

    return get_room_by_id(room_id)


def delete_room(room_id: int) -> bool:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Check for schedule dependencies
            cur.execute(
                "SELECT COUNT(*) FROM ROOM_SCHEDULE WHERE RoomID = :1", [room_id]
            )
            dep_count = cur.fetchone()[0]
            if dep_count > 0:
                raise ValueError(
                    f"Cannot delete room: {dep_count} schedule(s) reference this room. "
                    "Delete the schedules first."
                )
            cur.execute("DELETE FROM ROOM WHERE RoomID = :1", [room_id])
            return cur.rowcount > 0


def get_room_stats() -> dict:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) FROM ROOM")
            total = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM ROOM WHERE RoomType = 'Classroom'")
            classrooms = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM ROOM WHERE RoomType = 'Lab'")
            labs = cur.fetchone()[0]

            cur.execute("SELECT COUNT(DISTINCT Floor) FROM ROOM")
            floors = cur.fetchone()[0]

            return {
                "total_rooms": total,
                "classroom_count": classrooms,
                "lab_count": labs,
                "total_floors": floors,
            }


def get_floor_summary() -> list[dict]:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """SELECT Floor,
                          SUM(CASE WHEN RoomType = 'Classroom' THEN 1 ELSE 0 END) AS classroom_count,
                          SUM(CASE WHEN RoomType = 'Lab' THEN 1 ELSE 0 END) AS lab_count,
                          COUNT(*) AS total_rooms,
                          SUM(Capacity) AS total_capacity
                   FROM ROOM
                   GROUP BY Floor
                   ORDER BY Floor"""
            )
            return [
                {
                    "floor": r[0],
                    "classroom_count": r[1],
                    "lab_count": r[2],
                    "total_rooms": r[3],
                    "total_capacity": r[4],
                }
                for r in cur.fetchall()
            ]

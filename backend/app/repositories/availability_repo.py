"""
VITSpace — Availability Repository (Oracle)
Determines room availability by checking ROOM vs ROOM_SCHEDULE.
"""

from app.database.connection import get_db, get_cursor
from typing import Optional


def find_available_rooms(
    block: str = "PRP",
    floor: Optional[int] = None,
    room_type: Optional[str] = None,
    day_of_week: Optional[str] = None,
    slot_number: Optional[int] = None,
    min_capacity: Optional[int] = None,
) -> list[dict]:
    """
    Find rooms and their availability status.

    A room is 'available' for a given day+slot if there is NO schedule entry
    for that room on that day+slot in ROOM_SCHEDULE.

    If day_of_week and slot_number are not provided, returns all rooms
    without availability status (is_available = None).
    """
    conditions = []
    params = {}
    idx = 1

    # Always filter by block
    conditions.append(f"r.Block = :p{idx}")
    params[f"p{idx}"] = block
    idx += 1

    if floor is not None:
        conditions.append(f"r.Floor = :p{idx}")
        params[f"p{idx}"] = floor
        idx += 1
    if room_type:
        conditions.append(f"r.RoomType = :p{idx}")
        params[f"p{idx}"] = room_type
        idx += 1
    if min_capacity is not None:
        conditions.append(f"r.Capacity >= :p{idx}")
        params[f"p{idx}"] = min_capacity
        idx += 1

    where = " AND ".join(conditions)

    if day_of_week and slot_number is not None:
        # Query with availability check
        params[f"p{idx}"] = f"{day_of_week[:3].upper()}%"
        params[f"p{idx+1}"] = slot_number

        query = f"""
            SELECT r.RoomID, r.RoomNumber, r.Block, r.Floor, r.RoomType, r.Capacity,
                   CASE WHEN s.ScheduleID IS NULL THEN 1 ELSE 0 END AS is_available
            FROM ROOM r
            LEFT JOIN ROOM_SCHEDULE s
                ON r.RoomID = s.RoomID
                AND UPPER(s.DayOfWeek) LIKE :p{idx}
                AND s.SlotNumber = :p{idx+1}
            WHERE {where}
            ORDER BY r.Floor, r.RoomNumber
        """
    else:
        # No specific time slot — return all rooms, availability unknown
        query = f"""
            SELECT r.RoomID, r.RoomNumber, r.Block, r.Floor, r.RoomType, r.Capacity,
                   NULL AS is_available
            FROM ROOM r
            WHERE {where}
            ORDER BY r.Floor, r.RoomNumber
        """

    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(query, params)
            columns = [c[0] for c in cur.description]
            rows = []
            for row in cur.fetchall():
                d = dict(zip(columns, row))
                # Convert Oracle numeric boolean
                if d["IS_AVAILABLE"] is not None:
                    d["IS_AVAILABLE"] = bool(d["IS_AVAILABLE"])
                rows.append(d)
            return rows

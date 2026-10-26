"""
VITSpace — Schedule Repository (Oracle CRUD)
"""

from app.database.connection import get_db, get_cursor
from typing import Optional


def get_all_schedules(
    room_id: Optional[int] = None,
    floor: Optional[int] = None,
    day_of_week: Optional[str] = None,
    slot_number: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    conditions = []
    params = {}
    idx = 1

    if room_id is not None:
        conditions.append(f"s.RoomID = :p{idx}")
        params[f"p{idx}"] = room_id
        idx += 1
    if floor is not None:
        conditions.append(f"r.Floor = :p{idx}")
        params[f"p{idx}"] = floor
        idx += 1
    if day_of_week:
        conditions.append(f"UPPER(s.DayOfWeek) LIKE :p{idx}")
        params[f"p{idx}"] = f"{day_of_week[:3].upper()}%"
        idx += 1
    if slot_number is not None:
        conditions.append(f"s.SlotNumber = :p{idx}")
        params[f"p{idx}"] = slot_number
        idx += 1

    where = " WHERE " + " AND ".join(conditions) if conditions else ""

    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                f"""SELECT COUNT(*) FROM ROOM_SCHEDULE s
                    JOIN ROOM r ON s.RoomID = r.RoomID{where}""",
                params,
            )
            total = cur.fetchone()[0]

            params[f"p{idx}"] = limit
            params[f"p{idx+1}"] = offset
            cur.execute(
                f"""SELECT s.ScheduleID, s.RoomID, s.DayOfWeek, s.SlotNumber,
                           s.StartTime, s.EndTime, r.RoomNumber, r.Floor, r.RoomType
                    FROM ROOM_SCHEDULE s
                    JOIN ROOM r ON s.RoomID = r.RoomID
                    {where}
                    ORDER BY r.Floor, r.RoomNumber, s.DayOfWeek, s.SlotNumber
                    OFFSET :p{idx+1} ROWS FETCH NEXT :p{idx} ROWS ONLY""",
                params,
            )
            columns = [c[0] for c in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    return rows, total


def get_schedule_by_id(schedule_id: int) -> Optional[dict]:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """SELECT s.ScheduleID, s.RoomID, s.DayOfWeek, s.SlotNumber,
                          s.StartTime, s.EndTime, r.RoomNumber, r.Floor, r.RoomType
                   FROM ROOM_SCHEDULE s
                   JOIN ROOM r ON s.RoomID = r.RoomID
                   WHERE s.ScheduleID = :1""",
                [schedule_id],
            )
            row = cur.fetchone()
            if not row:
                return None
            columns = [c[0] for c in cur.description]
            return dict(zip(columns, row))


def create_schedule(data: dict) -> dict:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Validate room exists
            cur.execute("SELECT RoomID FROM ROOM WHERE RoomID = :1", [data["room_id"]])
            if not cur.fetchone():
                raise ValueError(f"Room with ID {data['room_id']} does not exist")

            # Check for conflicts (same room, day, slot)
            cur.execute(
                """SELECT ScheduleID FROM ROOM_SCHEDULE
                   WHERE RoomID = :1 AND DayOfWeek = :2 AND SlotNumber = :3""",
                [data["room_id"], data["day_of_week"], data["slot_number"]],
            )
            if cur.fetchone():
                raise ValueError(
                    f"Schedule conflict: Room is already booked for "
                    f"{data['day_of_week']} slot {data['slot_number']}"
                )

            cur.execute(
                """INSERT INTO ROOM_SCHEDULE (RoomID, DayOfWeek, SlotNumber, StartTime, EndTime)
                   VALUES (:1, :2, :3, :4, :5)""",
                [
                    data["room_id"],
                    data["day_of_week"],
                    data["slot_number"],
                    data["start_time"],
                    data["end_time"],
                ],
            )

            # Retrieve the inserted record
            cur.execute(
                """SELECT s.ScheduleID, s.RoomID, s.DayOfWeek, s.SlotNumber,
                          s.StartTime, s.EndTime, r.RoomNumber, r.Floor, r.RoomType
                   FROM ROOM_SCHEDULE s
                   JOIN ROOM r ON s.RoomID = r.RoomID
                   WHERE s.RoomID = :1 AND s.DayOfWeek = :2 AND s.SlotNumber = :3""",
                [data["room_id"], data["day_of_week"], data["slot_number"]],
            )
            row = cur.fetchone()
            columns = [c[0] for c in cur.description]
            return dict(zip(columns, row))


def update_schedule(schedule_id: int, data: dict) -> Optional[dict]:
    updates = []
    params = {}
    idx = 1

    field_map = {
        "room_id": "RoomID",
        "day_of_week": "DayOfWeek",
        "slot_number": "SlotNumber",
        "start_time": "StartTime",
        "end_time": "EndTime",
    }

    for key, col in field_map.items():
        if key in data and data[key] is not None:
            updates.append(f"{col} = :p{idx}")
            params[f"p{idx}"] = data[key]
            idx += 1

    if not updates:
        return get_schedule_by_id(schedule_id)

    params[f"p{idx}"] = schedule_id

    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                f"UPDATE ROOM_SCHEDULE SET {', '.join(updates)} WHERE ScheduleID = :p{idx}",
                params,
            )
            if cur.rowcount == 0:
                return None

    return get_schedule_by_id(schedule_id)


def delete_schedule(schedule_id: int) -> bool:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "DELETE FROM ROOM_SCHEDULE WHERE ScheduleID = :1", [schedule_id]
            )
            return cur.rowcount > 0


def get_schedule_count() -> int:
    with get_db() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) FROM ROOM_SCHEDULE")
            return cur.fetchone()[0]

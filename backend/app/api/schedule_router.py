"""
VITSpace — Schedule API Router
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleResponse, ScheduleListResponse,
)
from app.repositories import schedule_repo
from app.security.auth import get_current_user, require_admin
from typing import Optional

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])

# Slot time mappings for the PRP block
SLOT_TIMES = {
    1: ("08:00", "08:50"),
    2: ("09:00", "09:50"),
    3: ("10:00", "10:50"),
    4: ("11:00", "11:50"),
    5: ("12:00", "12:50"),
    6: ("14:00", "14:50"),
    7: ("15:00", "15:50"),
    8: ("16:00", "16:50"),
}


DAY_TO_CODE = {
    "MONDAY": "MON",
    "TUESDAY": "TUE",
    "WEDNESDAY": "WED",
    "THURSDAY": "THU",
    "FRIDAY": "FRI",
    "SATURDAY": "SAT",
}


def _row_to_response(r: dict) -> ScheduleResponse:
    day_raw = str(r["DAYOFWEEK"]).strip()
    day_code = DAY_TO_CODE.get(day_raw.upper(), day_raw[:3].upper())

    st = r["STARTTIME"]
    et = r["ENDTIME"]
    start_str = st.strftime("%H:%M") if hasattr(st, "strftime") else str(st)
    end_str = et.strftime("%H:%M") if hasattr(et, "strftime") else str(et)

    return ScheduleResponse(
        schedule_id=r["SCHEDULEID"],
        room_id=r["ROOMID"],
        day_of_week=day_code,
        slot_number=r.get("SLOTNUMBER", 1) or 1,
        start_time=start_str,
        end_time=end_str,
        room_number=r.get("ROOMNUMBER"),
        floor=r.get("FLOOR"),
        room_type=r.get("ROOMTYPE"),
    )


@router.get("", response_model=ScheduleListResponse)
async def list_schedules(
    room_id: Optional[int] = None,
    floor: Optional[int] = None,
    day_of_week: Optional[str] = None,
    slot_number: Optional[int] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List schedules with filters. Accessible to all authenticated users."""
    rows, total = schedule_repo.get_all_schedules(
        room_id=room_id,
        floor=floor,
        day_of_week=day_of_week,
        slot_number=slot_number,
        limit=limit,
        offset=offset,
    )
    schedules = [_row_to_response(r) for r in rows]
    return ScheduleListResponse(schedules=schedules, total=total)


@router.get("/slots", response_model=dict)
async def get_slot_times(current_user: dict = Depends(get_current_user)):
    """Return the PRP block slot time mappings."""
    return {
        "slots": {
            str(k): {"start": v[0], "end": v[1]} for k, v in SLOT_TIMES.items()
        }
    }


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int, current_user: dict = Depends(get_current_user)
):
    r = schedule_repo.get_schedule_by_id(schedule_id)
    if not r:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return _row_to_response(r)


@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(body: ScheduleCreate, admin: dict = Depends(require_admin)):
    """Create a schedule entry. Admin only."""
    try:
        data = body.model_dump()
        # Auto-fill times from slot if not provided correctly
        if body.slot_number in SLOT_TIMES:
            expected_start, expected_end = SLOT_TIMES[body.slot_number]
            if data["start_time"] != expected_start or data["end_time"] != expected_end:
                data["start_time"] = expected_start
                data["end_time"] = expected_end

        r = schedule_repo.create_schedule(data)
        return _row_to_response(r)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "unique" in error_msg.lower() or "ORA-00001" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="A schedule already exists for this room, day, and slot",
            )
        raise HTTPException(status_code=500, detail="Failed to create schedule")


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int, body: ScheduleUpdate, admin: dict = Depends(require_admin)
):
    try:
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        r = schedule_repo.update_schedule(schedule_id, data)
        if not r:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return _row_to_response(r)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update schedule")


@router.delete("/{schedule_id}", response_model=dict)
async def delete_schedule(
    schedule_id: int, admin: dict = Depends(require_admin)
):
    success = schedule_repo.delete_schedule(schedule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}

"""
VITSpace — Availability API Router
"""

from fastapi import APIRouter, Depends, Query
from app.schemas.dashboard import AvailabilityResponse, AvailableRoom
from app.repositories import availability_repo
from app.security.auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/api/availability", tags=["Availability"])


@router.get("", response_model=AvailabilityResponse)
async def find_available_rooms(
    block: str = Query("PRP"),
    floor: Optional[int] = Query(None, ge=1, le=7),
    room_type: Optional[str] = Query(None),
    day_of_week: Optional[str] = Query(None),
    slot_number: Optional[int] = Query(None, ge=1, le=9),
    min_capacity: Optional[int] = Query(None, gt=0),
    current_user: dict = Depends(get_current_user),
):
    """
    Find available rooms in the PRP block.

    If day_of_week and slot_number are provided, returns availability status.
    Otherwise returns all matching rooms without availability info.
    """
    rows = availability_repo.find_available_rooms(
        block=block,
        floor=floor,
        room_type=room_type,
        day_of_week=day_of_week,
        slot_number=slot_number,
        min_capacity=min_capacity,
    )

    rooms = [
        AvailableRoom(
            room_id=r["ROOMID"],
            room_number=r["ROOMNUMBER"],
            block=r["BLOCK"],
            floor=r["FLOOR"],
            room_type=r["ROOMTYPE"],
            capacity=r["CAPACITY"],
            is_available=r["IS_AVAILABLE"] if r["IS_AVAILABLE"] is not None else True,
        )
        for r in rows
    ]

    return AvailabilityResponse(
        rooms=rooms,
        total=len(rooms),
        query={
            "block": block,
            "floor": floor,
            "room_type": room_type,
            "day_of_week": day_of_week,
            "slot_number": slot_number,
            "min_capacity": min_capacity,
        },
    )

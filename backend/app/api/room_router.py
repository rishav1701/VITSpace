"""
VITSpace — Room API Router
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse, RoomListResponse
from app.repositories import room_repo
from app.security.auth import get_current_user, require_admin
from typing import Optional

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


@router.get("", response_model=RoomListResponse)
async def list_rooms(
    block: Optional[str] = None,
    floor: Optional[int] = None,
    room_type: Optional[str] = None,
    search: Optional[str] = None,
    min_capacity: Optional[int] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List rooms with optional filters. Accessible to all authenticated users."""
    rows, total = room_repo.get_all_rooms(
        block=block,
        floor=floor,
        room_type=room_type,
        search=search,
        min_capacity=min_capacity,
        limit=limit,
        offset=offset,
    )
    rooms = [
        RoomResponse(
            room_id=r["ROOMID"],
            room_number=r["ROOMNUMBER"],
            block=r["BLOCK"],
            floor=r["FLOOR"],
            room_type=r["ROOMTYPE"],
            capacity=r["CAPACITY"],
        )
        for r in rows
    ]
    return RoomListResponse(rooms=rooms, total=total)


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(room_id: int, current_user: dict = Depends(get_current_user)):
    """Get a single room by ID."""
    r = room_repo.get_room_by_id(room_id)
    if not r:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomResponse(
        room_id=r["ROOMID"],
        room_number=r["ROOMNUMBER"],
        block=r["BLOCK"],
        floor=r["FLOOR"],
        room_type=r["ROOMTYPE"],
        capacity=r["CAPACITY"],
    )


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(body: RoomCreate, admin: dict = Depends(require_admin)):
    """Create a new room. Admin only."""
    try:
        r = room_repo.create_room(body)
        return RoomResponse(
            room_id=r["ROOMID"],
            room_number=r["ROOMNUMBER"],
            block=r["BLOCK"],
            floor=r["FLOOR"],
            room_type=r["ROOMTYPE"],
            capacity=r["CAPACITY"],
        )
    except Exception as e:
        error_msg = str(e)
        if "unique" in error_msg.lower() or "ORA-00001" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="A room with this number already exists",
            )
        raise HTTPException(status_code=500, detail="Failed to create room")


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: int, body: RoomUpdate, admin: dict = Depends(require_admin)
):
    """Update a room. Admin only."""
    try:
        r = room_repo.update_room(room_id, body)
        if not r:
            raise HTTPException(status_code=404, detail="Room not found")
        return RoomResponse(
            room_id=r["ROOMID"],
            room_number=r["ROOMNUMBER"],
            block=r["BLOCK"],
            floor=r["FLOOR"],
            room_type=r["ROOMTYPE"],
            capacity=r["CAPACITY"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "unique" in error_msg.lower() or "ORA-00001" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="A room with this number already exists",
            )
        raise HTTPException(status_code=500, detail="Failed to update room")


@router.delete("/{room_id}", response_model=dict)
async def delete_room(room_id: int, admin: dict = Depends(require_admin)):
    """Delete a room. Admin only. Checks for schedule dependencies."""
    try:
        success = room_repo.delete_room(room_id)
        if not success:
            raise HTTPException(status_code=404, detail="Room not found")
        return {"message": "Room deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete room")

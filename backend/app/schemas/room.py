"""
VITSpace — Pydantic Schemas for Rooms
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal


class RoomBase(BaseModel):
    room_number: str = Field(..., min_length=1, max_length=20)
    block: str = Field(default="PRP", max_length=10)
    floor: int = Field(..., ge=1, le=7)
    room_type: Literal["Classroom", "Lab"]
    capacity: int = Field(..., gt=0)


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_number: Optional[str] = Field(None, min_length=1, max_length=20)
    block: Optional[str] = Field(None, max_length=10)
    floor: Optional[int] = Field(None, ge=1, le=7)
    room_type: Optional[Literal["Classroom", "Lab"]] = None
    capacity: Optional[int] = Field(None, gt=0)


class RoomResponse(RoomBase):
    room_id: int


class RoomListResponse(BaseModel):
    rooms: list[RoomResponse]
    total: int

"""
VITSpace — Pydantic Schemas for Schedules
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal

DAY_CHOICES = Literal["MON", "TUE", "WED", "THU", "FRI", "SAT"]


class ScheduleBase(BaseModel):
    room_id: int = Field(..., gt=0)
    day_of_week: DAY_CHOICES
    slot_number: int = Field(..., ge=1, le=9)
    start_time: str = Field(..., max_length=10)
    end_time: str = Field(..., max_length=10)


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    room_id: Optional[int] = Field(None, gt=0)
    day_of_week: Optional[DAY_CHOICES] = None
    slot_number: Optional[int] = Field(None, ge=1, le=9)
    start_time: Optional[str] = Field(None, max_length=10)
    end_time: Optional[str] = Field(None, max_length=10)


class ScheduleResponse(ScheduleBase):
    schedule_id: int
    room_number: Optional[str] = None
    floor: Optional[int] = None
    room_type: Optional[str] = None


class ScheduleListResponse(BaseModel):
    schedules: list[ScheduleResponse]
    total: int

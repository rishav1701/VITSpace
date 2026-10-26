"""
VITSpace — Pydantic Schemas for Dashboard
"""

from pydantic import BaseModel
from typing import Optional


class AdminDashboard(BaseModel):
    total_rooms: int
    classroom_count: int
    lab_count: int
    total_floors: int
    total_schedules: int
    total_students: int
    floors: list["FloorSummary"]


class FloorSummary(BaseModel):
    floor: int
    classroom_count: int
    lab_count: int
    total_rooms: int
    total_capacity: int


class StudentDashboard(BaseModel):
    student_name: str
    student_dept: str
    total_rooms: int
    classroom_count: int
    lab_count: int
    total_floors: int


class AvailabilityQuery(BaseModel):
    block: str = "PRP"
    floor: Optional[int] = None
    room_type: Optional[str] = None
    day_of_week: Optional[str] = None
    slot_number: Optional[int] = None
    min_capacity: Optional[int] = None


class AvailableRoom(BaseModel):
    room_id: int
    room_number: str
    block: str
    floor: int
    room_type: str
    capacity: int
    is_available: bool


class AvailabilityResponse(BaseModel):
    rooms: list[AvailableRoom]
    total: int
    query: dict

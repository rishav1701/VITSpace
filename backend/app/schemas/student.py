"""
VITSpace — Pydantic Schemas for Students
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class StudentResponse(BaseModel):
    reg_no: str
    name: str
    mail: str
    dept: str


class StudentListResponse(BaseModel):
    students: list[StudentResponse]
    total: int


class StudentCreate(BaseModel):
    reg_no: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    mail: str = Field(..., min_length=1, max_length=100)
    dept: str = Field(..., min_length=1, max_length=50)


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    mail: Optional[str] = Field(None, min_length=1, max_length=100)
    dept: Optional[str] = Field(None, min_length=1, max_length=50)

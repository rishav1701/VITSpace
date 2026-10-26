"""
VITSpace — Pydantic Schemas for Authentication
"""

from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50, description="Registration number or admin username")
    password: str = Field(..., min_length=1, max_length=128)


class LoginResponse(BaseModel):
    message: str
    user: "UserInfo"


class UserInfo(BaseModel):
    user_id: int
    username: str
    role: str
    reg_no: Optional[str] = None
    name: Optional[str] = None
    mail: Optional[str] = None
    dept: Optional[str] = None


class MessageResponse(BaseModel):
    message: str

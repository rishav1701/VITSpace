"""
VITSpace — Dashboard API Router
"""

from fastapi import APIRouter, Depends, HTTPException
from app.schemas.dashboard import (
    AdminDashboard, StudentDashboard, FloorSummary,
)
from app.repositories import room_repo, schedule_repo, student_repo
from app.security.auth import get_current_user, require_admin, require_student

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/admin", response_model=AdminDashboard)
async def admin_dashboard(admin: dict = Depends(require_admin)):
    """Get admin dashboard data from Oracle."""
    stats = room_repo.get_room_stats()
    floors = room_repo.get_floor_summary()
    sched_count = schedule_repo.get_schedule_count()
    student_count = student_repo.get_student_count()

    return AdminDashboard(
        total_rooms=stats["total_rooms"],
        classroom_count=stats["classroom_count"],
        lab_count=stats["lab_count"],
        total_floors=stats["total_floors"],
        total_schedules=sched_count,
        total_students=student_count,
        floors=[FloorSummary(**f) for f in floors],
    )


@router.get("/student", response_model=StudentDashboard)
async def student_dashboard(current_user: dict = Depends(require_student)):
    """Get student dashboard data."""
    stats = room_repo.get_room_stats()

    # Get student info
    student = student_repo.get_student_by_regno(current_user.get("reg_no", ""))

    return StudentDashboard(
        student_name=student["NAME"] if student else current_user["username"],
        student_dept=student["DEPT"] if student else "Unknown",
        total_rooms=stats["total_rooms"],
        classroom_count=stats["classroom_count"],
        lab_count=stats["lab_count"],
        total_floors=stats["total_floors"],
    )


@router.get("/floors", response_model=list[FloorSummary])
async def floor_overview(current_user: dict = Depends(get_current_user)):
    """Get floor-by-floor room breakdown."""
    floors = room_repo.get_floor_summary()
    return [FloorSummary(**f) for f in floors]

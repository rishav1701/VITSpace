"""
VITSpace — Student API Router
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.schemas.student import (
    StudentResponse, StudentListResponse, StudentCreate, StudentUpdate,
)
from app.repositories import student_repo
from app.security.auth import get_current_user, require_admin, require_student
from typing import Optional

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/me", response_model=StudentResponse)
async def my_profile(current_user: dict = Depends(require_student)):
    """Get the authenticated student's profile."""
    student = student_repo.get_student_by_regno(current_user.get("reg_no", ""))
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return StudentResponse(
        reg_no=student["REGNO"],
        name=student["NAME"],
        mail=student["MAIL"],
        dept=student["DEPT"],
    )


@router.get("/departments", response_model=list[str])
async def list_departments(admin: dict = Depends(require_admin)):
    """List all distinct departments."""
    return student_repo.get_departments()


@router.get("", response_model=StudentListResponse)
async def list_students(
    search: Optional[str] = None,
    dept: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin: dict = Depends(require_admin),
):
    """List students. Admin only."""
    rows, total = student_repo.get_all_students(
        search=search, dept=dept, limit=limit, offset=offset,
    )
    students = [
        StudentResponse(
            reg_no=r["REGNO"],
            name=r["NAME"],
            mail=r["MAIL"],
            dept=r["DEPT"],
        )
        for r in rows
    ]
    return StudentListResponse(students=students, total=total)


@router.get("/{reg_no}", response_model=StudentResponse)
async def get_student(reg_no: str, admin: dict = Depends(require_admin)):
    """Get a student by registration number. Admin only."""
    student = student_repo.get_student_by_regno(reg_no)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse(
        reg_no=student["REGNO"],
        name=student["NAME"],
        mail=student["MAIL"],
        dept=student["DEPT"],
    )


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(body: StudentCreate, admin: dict = Depends(require_admin)):
    """Create a student record. Admin only."""
    try:
        r = student_repo.create_student(body.model_dump())
        return StudentResponse(
            reg_no=r["REGNO"],
            name=r["NAME"],
            mail=r["MAIL"],
            dept=r["DEPT"],
        )
    except Exception as e:
        error_msg = str(e)
        if "unique" in error_msg.lower() or "ORA-00001" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="A student with this registration number already exists",
            )
        raise HTTPException(status_code=500, detail="Failed to create student")


@router.put("/{reg_no}", response_model=StudentResponse)
async def update_student(
    reg_no: str, body: StudentUpdate, admin: dict = Depends(require_admin)
):
    """Update a student record. Admin only."""
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    r = student_repo.update_student(reg_no, data)
    if not r:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse(
        reg_no=r["REGNO"],
        name=r["NAME"],
        mail=r["MAIL"],
        dept=r["DEPT"],
    )


@router.delete("/{reg_no}", response_model=dict)
async def delete_student(reg_no: str, admin: dict = Depends(require_admin)):
    """Delete a student. Admin only."""
    success = student_repo.delete_student(reg_no)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

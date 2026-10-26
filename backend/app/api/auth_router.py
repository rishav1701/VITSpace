"""
VITSpace — Auth API Router
"""

from fastapi import APIRouter, HTTPException, Response, Depends, Request, status
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo, MessageResponse
from app.repositories import auth_repo, student_repo
from app.security.auth import (
    verify_password,
    create_access_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, response: Response):
    """Authenticate a student or admin."""
    user = auth_repo.get_user_by_username(body.username)
    if not user or not verify_password(body.password, user["PASSWORDHASH"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Build JWT payload
    token_data = {
        "sub": user["USERNAME"],
        "role": user["ROLE"],
        "user_id": user["USERID"],
        "reg_no": user["REGNO"],
    }

    token = create_access_token(token_data)
    set_auth_cookie(response, token)

    # Get student details if applicable
    student = None
    if user["ROLE"] == "student" and user["REGNO"]:
        student = student_repo.get_student_by_regno(user["REGNO"])

    return LoginResponse(
        message="Login successful",
        user=UserInfo(
            user_id=user["USERID"],
            username=user["USERNAME"],
            role=user["ROLE"],
            reg_no=user["REGNO"],
            name=student["NAME"] if student else None,
            mail=student["MAIL"] if student else None,
            dept=student["DEPT"] if student else None,
        ),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Clear the auth cookie."""
    clear_auth_cookie(response)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserInfo)
async def me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's info."""
    student = None
    if current_user["role"] == "student" and current_user.get("reg_no"):
        student = student_repo.get_student_by_regno(current_user["reg_no"])

    return UserInfo(
        user_id=current_user["user_id"],
        username=current_user["username"],
        role=current_user["role"],
        reg_no=current_user.get("reg_no"),
        name=student["NAME"] if student else None,
        mail=student["MAIL"] if student else None,
        dept=student["DEPT"] if student else None,
    )

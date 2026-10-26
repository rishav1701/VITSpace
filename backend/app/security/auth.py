"""
VITSpace Backend — Security: JWT, Password Hashing, Auth Dependencies
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt
from app.core.config import get_settings

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    s = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=s.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, s.auth_secret, algorithm=s.auth_algorithm)


def decode_access_token(token: str) -> dict:
    s = get_settings()
    return jwt.decode(token, s.auth_secret, algorithms=[s.auth_algorithm])


def _extract_token(request: Request) -> Optional[str]:
    """Extract JWT from cookie first, then Authorization header."""
    # Try cookie
    token = request.cookies.get("access_token")
    if token:
        return token
    # Try header
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth[7:]
    return None


async def get_current_user(request: Request) -> dict:
    """Dependency: extract and validate the current user from JWT."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        reg_no: Optional[str] = payload.get("reg_no")
        if username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return {
            "username": username,
            "role": role,
            "user_id": user_id,
            "reg_no": reg_no,
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired or invalid",
        )


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: ensure the user is an admin."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def require_student(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: ensure the user is a student."""
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return current_user


def set_auth_cookie(response: Response, token: str) -> None:
    """Set JWT as HttpOnly cookie."""
    s = get_settings()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in production with HTTPS
        max_age=s.access_token_expire_minutes * 60,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie."""
    response.delete_cookie(key="access_token", path="/")

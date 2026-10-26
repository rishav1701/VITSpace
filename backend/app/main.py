"""
VITSpace Backend — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import get_settings
from app.api import (
    auth_router,
    room_router,
    schedule_router,
    dashboard_router,
    availability_router,
    student_router,
)
from app.database.connection import check_connection

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="VITSpace API",
    description="PRP Block Classroom Availability Management System — VIT Vellore",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(room_router.router)
app.include_router(schedule_router.router)
app.include_router(dashboard_router.router)
app.include_router(availability_router.router)
app.include_router(student_router.router)


@app.get("/api/health")
async def health_check():
    """Check backend health and Oracle connectivity."""
    db_status = check_connection()
    return {
        "status": "ok",
        "database": db_status,
    }


@app.get("/")
async def root():
    return {
        "app": "VITSpace API",
        "version": "1.0.0",
        "docs": "/docs",
    }

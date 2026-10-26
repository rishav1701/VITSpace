"""
VITSpace Backend — Application Settings
Loads configuration from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Oracle
    oracle_user: str = "system"
    oracle_password: str = ""
    oracle_dsn: str = "localhost:1521/XEPDB1"

    # JWT
    auth_secret: str = "change-this-to-a-random-64-char-string"
    auth_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # Admin setup
    admin_username: str = "admin"
    admin_password: str = "change-this-admin-password"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

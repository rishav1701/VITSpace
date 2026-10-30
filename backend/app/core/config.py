"""
VITSpace Backend — Application Settings
Loads configuration from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database selection: "sqlite" (local) or "oracle" (remote/cloud)
    db_type: str = "sqlite"
    sqlite_db_path: str = "vitspace.db"

    # Oracle settings (used when db_type == "oracle")
    oracle_user: str = "system"
    oracle_password: str = ""
    oracle_dsn: str = "localhost:1521/XEPDB1"

    # JWT Settings
    auth_secret: str = "vitspace_prp_block_vellore_jwt_secret_key_2026_9941"
    auth_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # Admin setup
    admin_username: str = "admin"
    admin_password: str = "admin123"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

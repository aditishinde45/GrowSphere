"""
GrowSphere backend configuration.
Loads from environment variables / .env file.
Configured for PostgreSQL production with SQLite development fallback.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

# Portable base directories
BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_RAW_DATA = PROJECT_ROOT / "_raw_data"


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "GrowSphere"
    APP_ENV: str = "development"  # development / staging / production
    DEBUG: bool = True

    # --- Production Database (PostgreSQL) ---
    POSTGRES_USER: str = "growsphere"
    POSTGRES_PASSWORD: str = "growsphere_secure_pass"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "growsphere_prod"

    # Primary Database URL — defaults to SQLite for local development
    DATABASE_URL: str = "sqlite:///./growsphere_dev.db"

    # --- Auth ---
    SECRET_KEY: str = "growsphere_jwt_secret_key_development_32bytes_long_min!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # --- Portable Data Directories ---
    RAW_DATA_PATH: str = str(DEFAULT_RAW_DATA)

    # --- Provider Modes (Sandbox / Live) ---
    EMAIL_PROVIDER: str = "sandbox"  # sandbox / smtp
    PAYMENT_PROVIDER: str = "sandbox"  # sandbox / stripe / razorpay
    AI_PROVIDER: str = "gemini"  # gemini / openai / sandbox
    AI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.8-flash"
    CALENDAR_PROVIDER: str = "sandbox"  # sandbox / google

    # --- Neon Serverless Postgres & Neon Auth ---
    DATABASE_URL_UNPOOLED: Optional[str] = None
    NEON_BRANCH: Optional[str] = None
    NEON_AUTH_BASE_URL: Optional[str] = None
    NEON_AUTH_JWKS_URL: Optional[str] = None

    @property
    def is_neon(self) -> bool:
        return bool(self.NEON_BRANCH or "neon.tech" in self.DATABASE_URL)

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def postgres_url(self) -> str:
        """Construct PostgreSQL connection URI for production."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    def validate_production_settings(self) -> None:
        """Validate that production environment refuses development secrets and unsafe settings."""
        if self.APP_ENV == "production":
            if "development" in self.SECRET_KEY.lower() or len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    "FATAL: Production mode refuses default or weak development SECRET_KEY. "
                    "Set a secure 32+ character SECRET_KEY in the environment."
                )
            if self.DEBUG:
                raise RuntimeError("FATAL: DEBUG mode must be disabled (DEBUG=False) in production.")
            if "sqlite" in self.DATABASE_URL.lower():
                raise RuntimeError(
                    "FATAL: Production environment requires PostgreSQL. "
                    "SQLite DATABASE_URL is not permitted in production."
                )

    model_config = {
        "env_file": (
            str(PROJECT_ROOT / ".env"),
            str(BACKEND_DIR / ".env"),
            ".env",
            str(PROJECT_ROOT / ".env.local"),
            str(BACKEND_DIR / ".env.local"),
            ".env.local",
        ),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
settings.validate_production_settings()

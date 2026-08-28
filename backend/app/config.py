import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CleanSheet AI API"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: Optional[str] = "gemini-1.5-flash"
    PORT: int = 8000

    # Migration Phase 1: Storage Infrastructure
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="Neon PostgreSQL connection string (postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require)"
    )
    BLOB_READ_WRITE_TOKEN: Optional[str] = Field(
        default=None,
        description="Vercel Blob Read/Write token (vercel_blob_rw_...)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def validate_infrastructure_credentials(self) -> dict[str, bool]:
        """Check availability of phase 1 storage credentials without raising exception."""
        has_db = bool(self.DATABASE_URL and self.DATABASE_URL.strip())
        has_blob = bool(self.BLOB_READ_WRITE_TOKEN and self.BLOB_READ_WRITE_TOKEN.strip())
        return {
            "database_url_configured": has_db,
            "blob_token_configured": has_blob,
            "fully_configured": has_db and has_blob
        }


settings = Settings()

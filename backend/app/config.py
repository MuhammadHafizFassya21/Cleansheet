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

    # Cloudflare R2 Persistent Storage (Phase 2.14+)
    R2_ACCOUNT_ID: Optional[str] = Field(
        default=None,
        description="Cloudflare Account ID for R2 storage"
    )
    R2_ACCESS_KEY_ID: Optional[str] = Field(
        default=None,
        description="Cloudflare R2 API Access Key ID"
    )
    R2_SECRET_ACCESS_KEY: Optional[str] = Field(
        default=None,
        description="Cloudflare R2 API Secret Access Key"
    )
    R2_BUCKET_NAME: Optional[str] = Field(
        default=None,
        description="Cloudflare R2 Bucket Name (e.g. cleansheet-datasets)"
    )
    R2_ENDPOINT_URL: Optional[str] = Field(
        default=None,
        description="Cloudflare R2 S3 Endpoint URL (https://<ACCOUNT_ID>.r2.cloudflarestorage.com)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def r2_endpoint(self) -> Optional[str]:
        """Returns explicitly set R2_ENDPOINT_URL or constructs it from R2_ACCOUNT_ID."""
        if self.R2_ENDPOINT_URL and self.R2_ENDPOINT_URL.strip():
            return self.R2_ENDPOINT_URL.strip()
        if self.R2_ACCOUNT_ID and self.R2_ACCOUNT_ID.strip():
            return f"https://{self.R2_ACCOUNT_ID.strip()}.r2.cloudflarestorage.com"
        return None

    def validate_r2_credentials(self) -> dict[str, bool]:
        """Check availability of Cloudflare R2 credentials without raising exception."""
        has_keys = bool(
            self.R2_ACCESS_KEY_ID and self.R2_ACCESS_KEY_ID.strip() and
            self.R2_SECRET_ACCESS_KEY and self.R2_SECRET_ACCESS_KEY.strip()
        )
        has_bucket = bool(self.R2_BUCKET_NAME and self.R2_BUCKET_NAME.strip())
        has_endpoint = bool(self.r2_endpoint)

        return {
            "r2_keys_configured": has_keys,
            "r2_bucket_configured": has_bucket,
            "r2_endpoint_configured": has_endpoint,
            "r2_fully_configured": has_keys and has_bucket and has_endpoint
        }

    def validate_infrastructure_credentials(self) -> dict[str, bool]:
        """Check availability of phase 1 storage credentials without raising exception."""
        has_db = bool(self.DATABASE_URL and self.DATABASE_URL.strip())
        has_blob = bool(self.BLOB_READ_WRITE_TOKEN and self.BLOB_READ_WRITE_TOKEN.strip())
        r2_status = self.validate_r2_credentials()
        return {
            "database_url_configured": has_db,
            "blob_token_configured": has_blob,
            "r2_configured": r2_status["r2_fully_configured"],
            "fully_configured": has_db and (has_blob or r2_status["r2_fully_configured"])
        }



settings = Settings()

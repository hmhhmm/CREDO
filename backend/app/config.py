from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://localhost/credo"
    TEST_DATABASE_URL: str = ""

    # Redis / ARQ
    REDIS_URL: str = "redis://localhost:6379"

    # Auth
    SECRET_KEY: str = "dev-insecure-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Fernet encryption for GitHub OAuth tokens at rest
    FERNET_KEY: str = ""

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/auth/github/callback"

    # AI APIs (Week 2+)
    GROQ_API_KEY: str = ""       # Document Agent AI detection + Whisper transcription
    ANTHROPIC_API_KEY: str = ""  # SimuHire agents (claude-sonnet-4-6)

    # App
    FRONTEND_URL: str = "http://localhost:5173"
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()

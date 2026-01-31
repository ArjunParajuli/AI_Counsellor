import os
from functools import lru_cache

from pydantic import BaseModel
from dotenv import load_dotenv


load_dotenv()
class Settings(BaseModel):
    database_url: str
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 60 * 24
    openrouter_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    """
    Load settings from environment variables.

    IMPORTANT: Set DATABASE_URL to your Avian PostgreSQL URL, e.g.
    DATABASE_URL=postgresql+psycopg2://user:pass@host:port/dbname
    """

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Fix Aiven/Heroku-style deprecated scheme (postgres:// → postgresql://)
        if database_url.startswith("postgres://"):
            database_url = "postgresql" + database_url[8:]  # replace prefix safely
            # print("Fixed DATABASE_URL scheme: now using", database_url)
    else:
        # Fallback for local dev (only used if no env var is set)
        print("No DATABASE_URL in env → using local fallback")
        database_url = "postgresql+psycopg2://postgres:postgres@localhost:5432/ai_counsellor"

    return Settings(
        database_url=database_url,
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", "dev-secret-change-me"),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        jwt_access_token_expires_minutes=int(
            os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "1440")
        ),
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
    )


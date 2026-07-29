from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nune Express TMS Backend API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-nune-express-tms-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Defaults to SQLite for local development without requiring a running Postgres container
    DATABASE_URL: str = "sqlite:///./nune_express_tms.db"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

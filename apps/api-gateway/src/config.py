"""Gateway configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

APP_PORT = int(os.getenv("APP_PORT", "4000"))
NOTES_SERVICE_URL = os.getenv("NOTES_SERVICE_URL", "http://notes-service:4001")
PROGRESS_SERVICE_URL = os.getenv("PROGRESS_SERVICE_URL", "http://progress-service:4002")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://snapstudy:snapstudy@postgres:5432/snapstudy"
)

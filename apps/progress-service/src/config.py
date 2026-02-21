"""Configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

PROGRESS_SERVICE_PORT = int(os.getenv("PROGRESS_SERVICE_PORT", "4002"))
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://snapstudy:snapstudy@localhost:5432/snapstudy"
)

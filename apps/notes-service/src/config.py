"""Configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

APP_PORT = int(os.getenv("APP_PORT", "4001"))
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://snapstudy:snapstudy@localhost:5432/snapstudy"
)

# Standard DigitalOcean Spaces / Storage (Replaces Azure)
DO_SPACES_ENDPOINT = os.getenv("DO_SPACES_ENDPOINT", "")
DO_SPACES_KEY = os.getenv("DO_SPACES_KEY", "")
DO_SPACES_SECRET = os.getenv("DO_SPACES_SECRET", "")

# Ollama (Hybrid Cloud-to-Local AI Setup)
OLLAMA_EXTERNAL_URL = os.getenv("OLLAMA_EXTERNAL_URL", "") # Cloudflare Tunnel URL
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

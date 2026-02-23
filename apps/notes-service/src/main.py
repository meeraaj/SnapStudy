"""SnapStudy Notes Service — entry point."""

import pathlib
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.database import init_db
from src.routes.notes import router as notes_router

UPLOADS_DIR = pathlib.Path("/app/uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="SnapStudy Notes Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(notes_router)

# Ensure uploads dir exists before mounting as static files
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "notes-service"}


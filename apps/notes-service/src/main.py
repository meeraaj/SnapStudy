"""SnapStudy Notes Service — entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.database import init_db
from src.routes.notes import router as notes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SnapStudy Notes Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(notes_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "notes-service"}

"""SnapStudy Progress Service — entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.database import init_db
from src.routes.subjects import router as subjects_router
from src.routes.chapters import router as chapters_router
from src.routes.progress import router as progress_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SnapStudy Progress Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(subjects_router)
app.include_router(chapters_router)
app.include_router(progress_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "progress-service"}

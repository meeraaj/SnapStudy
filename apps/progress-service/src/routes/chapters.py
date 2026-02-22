"""Chapters CRUD routes."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from src.database import get_session
from src.models.chapter import Chapter

router = APIRouter(prefix="/chapters", tags=["chapters"])


# ── Schemas ──────────────────────────────────────────────────

from pydantic import BaseModel, Field


class ChapterCreate(BaseModel):
    subject_id: uuid.UUID
    name: str = Field(max_length=255)
    description: str | None = None
    weight: int = Field(default=1, ge=1, le=10)
    display_order: int = 0


class ChapterUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    weight: int | None = Field(default=None, ge=1, le=10)
    display_order: int | None = None
    is_completed: bool | None = None


class ChapterResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    name: str
    description: str | None
    weight: int
    display_order: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────


@router.get("/", response_model=list[ChapterResponse])
def list_chapters(
    subject_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
):
    chapters = session.exec(
        select(Chapter)
        .where(Chapter.subject_id == subject_id)
        .order_by(Chapter.display_order)
    ).all()
    return chapters


@router.post("/", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(
    body: ChapterCreate,
    session: Session = Depends(get_session),
):
    chapter = Chapter(**body.model_dump())
    session.add(chapter)
    session.commit()
    session.refresh(chapter)
    return chapter


@router.get("/{chapter_id}", response_model=ChapterResponse)
def get_chapter(
    chapter_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    chapter = session.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


@router.put("/{chapter_id}", response_model=ChapterResponse)
def update_chapter(
    chapter_id: uuid.UUID,
    body: ChapterUpdate,
    session: Session = Depends(get_session),
):
    chapter = session.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chapter, key, value)
    chapter.updated_at = datetime.now()

    session.add(chapter)
    session.commit()
    session.refresh(chapter)
    return chapter


@router.delete("/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(
    chapter_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    chapter = session.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    session.delete(chapter)
    session.commit()

"""Subjects CRUD routes."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from src.database import get_session
from src.models.subject import Subject

router = APIRouter(prefix="/subjects", tags=["subjects"])


# ── Schemas ──────────────────────────────────────────────────

from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    name: str = Field(max_length=255)
    description: str | None = None
    color_hex: str | None = Field(default=None, max_length=7)
    display_order: int = 0


class SubjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color_hex: str | None = None
    display_order: int | None = None


class SubjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None
    color_hex: str | None
    display_order: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────


@router.get("/", response_model=list[SubjectResponse])
def list_subjects(
    user_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
):
    subjects = session.exec(
        select(Subject)
        .where(Subject.user_id == user_id)
        .order_by(Subject.display_order)
    ).all()
    return subjects


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    body: SubjectCreate,
    user_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
):
    subject = Subject(user_id=user_id, **body.model_dump())
    session.add(subject)
    session.commit()
    session.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: uuid.UUID,
    body: SubjectUpdate,
    session: Session = Depends(get_session),
):
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(subject, key, value)
    subject.updated_at = datetime.now()

    session.add(subject)
    session.commit()
    session.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    session.delete(subject)
    session.commit()

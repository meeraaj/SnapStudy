"""Notes CRUD routes — upload, list, get, delete photo-notes."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlmodel import Session, select

from src.database import get_session
from src.models.note import PhotoNote
from src.services.blob_storage import delete_blob, upload_blob
from src.services.ocr import extract_text_from_image

from pydantic import BaseModel

router = APIRouter(prefix="/notes", tags=["notes"])


# ── Schemas ──────────────────────────────────────────────────


class NoteResponse(BaseModel):
    id: uuid.UUID
    topic_id: uuid.UUID
    user_id: uuid.UUID
    blob_url: str
    file_name: str
    file_size_kb: int | None
    mime_type: str
    caption: str | None
    ocr_text: str | None
    page_number: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(
    file: UploadFile = File(...),
    topic_id: uuid.UUID = Form(...),
    caption: str | None = Form(None),
    page_number: int = Form(1),
    user_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
):
    """Upload a photo-note, run OCR, and save to DB."""
    data = await file.read()
    file_size_kb = len(data) // 1024

    # Generate a unique blob key
    blob_key = f"{user_id}/{topic_id}/{uuid.uuid4()}/{file.filename}"

    # Upload to Azure Blob Storage
    blob_url = upload_blob(blob_key, data, content_type=file.content_type or "image/jpeg")

    # Run OCR to extract handwritten text
    ocr_text: str | None = None
    try:
        ocr_text = extract_text_from_image(data)
    except Exception:
        # OCR is best-effort — don't fail the upload if it errors
        pass

    note = PhotoNote(
        topic_id=topic_id,
        user_id=user_id,
        blob_url=blob_url,
        blob_key=blob_key,
        file_name=file.filename or "untitled",
        file_size_kb=file_size_kb,
        mime_type=file.content_type or "image/jpeg",
        caption=caption,
        ocr_text=ocr_text,
        page_number=page_number,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


@router.get("/", response_model=list[NoteResponse])
def list_notes(
    user_id: uuid.UUID = Query(...),
    topic_id: uuid.UUID | None = Query(None),
    session: Session = Depends(get_session),
):
    """List notes for a user, optionally filtered by topic."""
    stmt = select(PhotoNote).where(PhotoNote.user_id == user_id)
    if topic_id:
        stmt = stmt.where(PhotoNote.topic_id == topic_id)
    stmt = stmt.order_by(PhotoNote.created_at.desc())
    return session.exec(stmt).all()


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    note = session.get(PhotoNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    note = session.get(PhotoNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Delete blob from Azure
    try:
        delete_blob(note.blob_key)
    except Exception:
        pass  # Best-effort cleanup

    session.delete(note)
    session.commit()

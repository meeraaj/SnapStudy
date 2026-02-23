"""SQLModel — User table + auth request schemas."""

import uuid as _uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field as PydanticField
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """A registered SnapStudy user."""

    __tablename__ = "users"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    email: str = Field(max_length=320, unique=True, index=True)
    display_name: str = Field(max_length=100)
    avatar_url: str | None = None
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


# ── Request schemas ──────────────────────────────────────────


class UserRegister(BaseModel):
    """POST /auth/register request body."""

    email: str = PydanticField(max_length=320)
    display_name: str
    password: str


class UserLogin(BaseModel):
    """POST /auth/login request body."""

    email: str
    password: str


# ── Response schemas ─────────────────────────────────────────


class UserResponse(BaseModel):
    """Public user info returned by the API."""

    id: _uuid.UUID
    email: str
    display_name: str
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Token response after register/login."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

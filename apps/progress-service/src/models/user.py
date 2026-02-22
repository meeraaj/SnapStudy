"""Minimal User reference for FK resolution — actual table managed by api-gateway + Alembic."""

import uuid as _uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """Stub so SQLModel can resolve foreign_key='users.id' references."""

    __tablename__ = "users"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    email: str = Field(max_length=320)
    display_name: str = Field(max_length=100)
    password_hash: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

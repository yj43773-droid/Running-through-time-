from __future__ import annotations

from datetime import datetime
from typing import Optional

from .db import db


class User(db.Model):
    __tablename__ = "users"

    id: str = db.Column(db.String, primary_key=True)
    email: str = db.Column(db.String, unique=True, nullable=False)
    display_name: Optional[str] = db.Column("displayName", db.String, nullable=True)
    password_hash: Optional[str] = db.Column("passwordHash", db.String(255), nullable=True)
    created_at: datetime = db.Column(
        "createdAt",
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )

    diaries = db.relationship(
        "Diary",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    memory_orbs = db.relationship(
        "MemoryOrb",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<User {self.id}>"


class Diary(db.Model):
    __tablename__ = "diaries"
    __table_args__ = (
        db.Index("idx_diaries_createdAt", "createdAt"),
        db.Index("idx_diaries_userId", "userId"),
    )

    id: str = db.Column(db.String, primary_key=True)
    user_id: str = db.Column(
        "userId",
        db.String,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    text: str = db.Column(db.Text, nullable=False)
    created_at: datetime = db.Column(
        "createdAt",
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )

    emotion: str = db.Column(db.String, nullable=False)
    ai_character: str = db.Column("aiCharacter", db.String, nullable=False)
    ai_response: str = db.Column("aiResponse", db.Text, nullable=False)

    is_evolved: bool = db.Column(
        "isEvolved", db.Boolean, nullable=False, server_default=db.text("0")
    )
    reinterpretation: Optional[str] = db.Column(db.Text, nullable=True)
    evolved_emotion: Optional[str] = db.Column("evolvedEmotion", db.String, nullable=True)
    ai_persona_responses = db.Column("aiPersonaResponses", db.JSON, nullable=True)
    similar_diary_refs = db.Column("similarDiaryRefs", db.JSON, nullable=True)
    emotion_color: Optional[str] = db.Column("emotionColor", db.String, nullable=True)
    evolved_emotion_color: Optional[str] = db.Column(
        "evolvedEmotionColor", db.String, nullable=True
    )
    linked_past_diary_id: Optional[str] = db.Column(
        "linkedPastDiaryId",
        db.String,
        db.ForeignKey("diaries.id", ondelete="SET NULL"),
        nullable=True,
    )

    user = db.relationship("User", back_populates="diaries", passive_deletes=True)
    linked_past_diary = db.relationship(
        "Diary",
        remote_side="Diary.id",
        passive_deletes=True,
    )
    memory_orbs = db.relationship(
        "MemoryOrb",
        back_populates="diary",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Diary {self.id}>"


class MemoryOrb(db.Model):
    __tablename__ = "memory_orbs"

    id: str = db.Column(db.String, primary_key=True)
    user_id: str = db.Column(
        "userId",
        db.String,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    diary_id: str = db.Column(
        "diaryId",
        db.String,
        db.ForeignKey("diaries.id", ondelete="CASCADE"),
        nullable=False,
    )
    emotion: str = db.Column(db.String, nullable=False)
    date: datetime = db.Column(db.DateTime, nullable=False)
    is_reinterpreted: bool = db.Column(
        "isReinterpreted", db.Boolean, nullable=False, server_default=db.text("0")
    )
    reinterpretation_note: Optional[str] = db.Column(
        "reinterpretationNote", db.Text, nullable=True
    )
    reinterpretation_replies = db.Column(
        "reinterpretationReplies",
        db.JSON,
        nullable=True,
    )
    created_at: datetime = db.Column(
        "createdAt",
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )
    updated_at: datetime = db.Column(
        "updatedAt",
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    user = db.relationship("User", back_populates="memory_orbs", passive_deletes=True)
    diary = db.relationship("Diary", back_populates="memory_orbs", passive_deletes=True)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<MemoryOrb {self.id}>"

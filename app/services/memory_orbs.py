from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy.exc import IntegrityError

from ..db import db
from ..models import Diary, MemoryOrb


class MemoryOrbServiceError(RuntimeError):
    pass


def serialize_memory_orb(orb: MemoryOrb) -> Dict[str, Any]:
    return {
        "id": orb.id,
        "userId": orb.user_id,
        "diaryId": orb.diary_id,
        "emotion": orb.emotion,
        "date": orb.date.isoformat() if orb.date else None,
        "isReinterpreted": bool(orb.is_reinterpreted),
        "reinterpretationNote": orb.reinterpretation_note,
        "reinterpretationReplies": orb.reinterpretation_replies or [],
        "createdAt": orb.created_at.isoformat() if orb.created_at else None,
        "updatedAt": orb.updated_at.isoformat() if orb.updated_at else None,
    }


def list_memory_orbs_for_user(user_id: str) -> List[MemoryOrb]:
    query = MemoryOrb.query.filter_by(user_id=user_id).order_by(MemoryOrb.date.desc())
    return list(query)


def create_memory_orb(
    user_id: str,
    diary_id: str,
    emotion: str,
    date_str: str,
    reinterpretation_note: Optional[str] = None,
) -> MemoryOrb:
    diary = Diary.query.filter_by(id=diary_id, user_id=user_id).first()
    if diary is None:
        raise MemoryOrbServiceError("Diary not found or does not belong to user.")

    try:
        date = _parse_iso_datetime(date_str)
    except (ValueError, TypeError) as exc:
        raise MemoryOrbServiceError("Invalid date format.") from exc

    orb = MemoryOrb(
        id=str(uuid4()),
        user_id=user_id,
        diary_id=diary_id,
        emotion=emotion,
        date=date,
        reinterpretation_note=reinterpretation_note,
    )
    db.session.add(orb)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise MemoryOrbServiceError("Could not create memory orb.") from exc

    return orb


def mark_memory_orb_reinterpreted(
    orb_id: str,
    user_id: Optional[str] = None,
    reinterpretation_note: Optional[str] = None,
    reinterpretation_replies: Optional[List[Dict[str, Any]]] = None,
) -> MemoryOrb:
    orb = MemoryOrb.query.get(orb_id)
    if orb is None:
        raise MemoryOrbServiceError("Memory orb not found.")
    if user_id and orb.user_id != user_id:
        raise MemoryOrbServiceError("Memory orb not found.")

    orb.is_reinterpreted = True
    if reinterpretation_note is not None:
        orb.reinterpretation_note = reinterpretation_note
    if reinterpretation_replies is not None:
        orb.reinterpretation_replies = reinterpretation_replies

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise MemoryOrbServiceError("Failed to update memory orb.") from exc

    db.session.refresh(orb)
    return orb


def _parse_iso_datetime(raw: str) -> datetime:
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    return datetime.fromisoformat(raw)

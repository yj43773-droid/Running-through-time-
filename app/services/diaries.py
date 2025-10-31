from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from ..db import db
from ..models import Diary, User
from ..vector_store import delete_diary_document, upsert_diary_document
from .ai import generate_diary_ai_bundle
from .emotions import emotion_to_color


class DiaryServiceError(RuntimeError):
    pass


REQUIRED_FIELDS = {"userId", "emotion"}


def serialize_diary(diary: Diary) -> Dict[str, Any]:
    return {
        "id": diary.id,
        "userId": diary.user_id,
        "text": diary.text,
        "content": diary.text,
        "createdAt": diary.created_at.isoformat() if diary.created_at else None,
        "updatedAt": diary.created_at.isoformat() if diary.created_at else None,
        "date": diary.created_at.isoformat() if diary.created_at else None,
        "emotion": diary.emotion,
        "aiCharacter": diary.ai_character,
        "aiResponse": diary.ai_response,
        "isEvolved": bool(diary.is_evolved),
        "reinterpretation": diary.reinterpretation,
        "evolvedEmotion": diary.evolved_emotion,
        "emotionColor": diary.emotion_color,
        "evolvedEmotionColor": diary.evolved_emotion_color,
        "linkedPastDiaryId": diary.linked_past_diary_id,
        "aiPersonaResponses": diary.ai_persona_responses,
        "similarDiaries": diary.similar_diary_refs,
    }


def create_diary(payload: Dict[str, Any]) -> Diary:
    missing = REQUIRED_FIELDS - payload.keys()
    if missing:
        raise DiaryServiceError(f"Missing required fields: {', '.join(sorted(missing))}")

    user_id = payload["userId"]
    text = payload.get("text") or payload.get("content")
    if not text:
        raise DiaryServiceError("Diary text is required.")

    payload = dict(payload)
    payload["text"] = text
    user = User.query.get(user_id)
    if user is None:
        raise DiaryServiceError("User does not exist.")

    diary = Diary(
        id=payload.get("id") or str(uuid4()),
        user_id=user_id,
        text=text,
        emotion=payload["emotion"],
        ai_character=payload.get("aiCharacter", "HeartOrb Companion"),
        ai_response=payload.get("aiResponse", ""),
        is_evolved=_coerce_bool(payload.get("isEvolved", False)),
        reinterpretation=payload.get("reinterpretation"),
        evolved_emotion=payload.get("evolvedEmotion"),
        linked_past_diary_id=payload.get("linkedPastDiaryId"),
    )

    db.session.add(diary)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise DiaryServiceError("Diary ID already exists or invalid foreign key.") from exc

    _sync_diary_to_vector_store(diary)
    _enrich_diary(diary, refresh_ai=True)
    db.session.refresh(diary)

    return diary


def update_diary(diary_id: str, payload: Dict[str, Any]) -> Diary:
    diary = Diary.query.options(joinedload(Diary.user)).get(diary_id)
    if diary is None:
        raise DiaryServiceError("Diary not found.")

    mutable_fields = {
        "text": "text",
        "content": "text",
        "emotion": "emotion",
        "aiCharacter": "ai_character",
        "aiResponse": "ai_response",
        "isEvolved": "is_evolved",
        "reinterpretation": "reinterpretation",
        "evolvedEmotion": "evolved_emotion",
        "linkedPastDiaryId": "linked_past_diary_id",
    }

    refresh_vector = False
    refresh_ai = False

    vector_sensitive = {
        "text",
        "content",
        "emotion",
        "aiCharacter",
        "aiResponse",
        "isEvolved",
        "reinterpretation",
        "evolvedEmotion",
        "linkedPastDiaryId",
    }
    ai_sensitive = {
        "text",
        "content",
        "emotion",
        "aiCharacter",
        "aiResponse",
        "reinterpretation",
        "isEvolved",
        "evolvedEmotion",
    }

    for incoming_key, model_attr in mutable_fields.items():
        if incoming_key in payload:
            value = payload[incoming_key]
            if incoming_key == "isEvolved":
                value = _coerce_bool(value)
            current_value = getattr(diary, model_attr)
            if current_value == value:
                continue
            setattr(diary, model_attr, value)
            if incoming_key in vector_sensitive:
                refresh_vector = True
            if incoming_key in ai_sensitive:
                refresh_ai = True

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise DiaryServiceError("Update violates a constraint.") from exc

    if refresh_vector:
        _sync_diary_to_vector_store(diary)
    _enrich_diary(diary, refresh_ai=refresh_ai or refresh_vector)
    db.session.refresh(diary)

    return diary


def get_diary(diary_id: str) -> Optional[Diary]:
    return (
        Diary.query.options(joinedload(Diary.user), joinedload(Diary.linked_past_diary))
        .filter_by(id=diary_id)
        .first()
    )


def list_diaries_for_user(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    emotion: Optional[str] = None,
    is_evolved: Optional[bool] = None,
) -> List[Diary]:
    query = Diary.query.filter_by(user_id=user_id)
    if emotion:
        query = query.filter_by(emotion=emotion)
    if is_evolved is not None:
        query = query.filter_by(is_evolved=is_evolved)
    query = query.order_by(Diary.created_at.desc()).limit(limit).offset(offset)
    return list(query)


def delete_diary(diary_id: str) -> None:
    diary = Diary.query.get(diary_id)
    if diary is None:
        return
    db.session.delete(diary)
    db.session.commit()
    _remove_diary_from_vector_store(diary_id)


def regenerate_diary_ai(diary_id: str) -> Diary:
    diary = Diary.query.get(diary_id)
    if diary is None:
        raise DiaryServiceError("Diary not found.")
    _sync_diary_to_vector_store(diary)
    _enrich_diary(diary, refresh_ai=True)
    db.session.refresh(diary)
    return diary


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.lower() in {"1", "true", "yes", "y", "t"}
    return False


def _sync_diary_to_vector_store(diary: Diary) -> None:
    try:
        upsert_diary_document(diary)
    except Exception as exc:  # pragma: no cover - best effort sync
        current_app.logger.warning(
            "Failed to upsert diary %s into vector store: %s", diary.id, exc
        )


def _remove_diary_from_vector_store(diary_id: str) -> None:
    try:
        delete_diary_document(diary_id)
    except Exception as exc:  # pragma: no cover - best effort sync
        current_app.logger.warning(
            "Failed to delete diary %s from vector store: %s", diary_id, exc
        )


def _enrich_diary(diary: Diary, refresh_ai: bool) -> None:
    changed = False

    color = emotion_to_color(diary.emotion)
    if diary.emotion_color != color:
        diary.emotion_color = color
        changed = True

    evolved_color = emotion_to_color(diary.evolved_emotion)
    if diary.evolved_emotion_color != evolved_color:
        diary.evolved_emotion_color = evolved_color
        changed = True

    if refresh_ai:
        try:
            bundle = generate_diary_ai_bundle(diary)
        except Exception as exc:  # pragma: no cover - best effort sync
            current_app.logger.warning(
                "Failed to generate AI bundle for diary %s: %s", diary.id, exc
            )
        else:
            responses = bundle.get("responses")
            similar = bundle.get("similarDiaries")
            if responses is not None and diary.ai_persona_responses != responses:
                diary.ai_persona_responses = responses
                changed = True
            if similar is not None and diary.similar_diary_refs != similar:
                diary.similar_diary_refs = similar
                changed = True

    if changed:
        try:
            db.session.commit()
        except Exception as exc:  # pragma: no cover - best effort sync
            db.session.rollback()
            current_app.logger.error(
                "Failed to persist AI enrichment for diary %s: %s", diary.id, exc
            )

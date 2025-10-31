from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    current_user,
    get_jwt_identity,
    jwt_required,
)

from .extensions import jwt
from .models import User
from .services.auth import (
    AuthServiceError,
    authenticate_user,
    register_user,
    serialize_auth_user,
)
from .services.diaries import (
    DiaryServiceError,
    create_diary,
    delete_diary,
    get_diary,
    list_diaries_for_user,
    regenerate_diary_ai,
    serialize_diary,
    update_diary,
)
from .services.memory_orbs import (
    MemoryOrbServiceError,
    create_memory_orb,
    list_memory_orbs_for_user,
    mark_memory_orb_reinterpreted,
    serialize_memory_orb,
)

api_blueprint = Blueprint("api", __name__)


@jwt.user_lookup_loader
def load_user_from_jwt(_jwt_header: Dict[str, Any], jwt_data: Dict[str, Any]) -> Optional[User]:
    identity = jwt_data.get("sub")
    if identity is None:
        return None
    return User.query.get(identity)


@api_blueprint.get("/health")
def healthcheck():
    return jsonify({"status": "ok"})


@api_blueprint.post("/auth/register")
def auth_register():
    payload = request.get_json(silent=True) or {}
    display_name = payload.get("name") or payload.get("displayName")
    try:
        user = register_user(payload.get("email"), payload.get("password"), display_name)
    except AuthServiceError as exc:
        return jsonify({"error": str(exc)}), 400

    tokens = _issue_tokens(user)
    response = {
        "user": serialize_auth_user(user),
        **tokens,
    }
    return jsonify(response), 201


@api_blueprint.post("/auth/login")
def auth_login():
    payload = request.get_json(silent=True) or {}
    try:
        user = authenticate_user(payload.get("email"), payload.get("password"))
    except AuthServiceError as exc:
        return jsonify({"error": str(exc)}), 401

    tokens = _issue_tokens(user)
    response = {
        "user": serialize_auth_user(user),
        **tokens,
    }
    return jsonify(response)


@api_blueprint.post("/auth/refresh")
@jwt_required(refresh=True)
def auth_refresh():
    identity = get_jwt_identity()
    if identity is None:
        return jsonify({"error": "Invalid refresh token."}), 401

    user = User.query.get(identity)
    if user is None:
        return jsonify({"error": "User not found."}), 404

    access_token = create_access_token(
        identity=user.id,
        additional_claims={"email": user.email},
    )
    return jsonify({"accessToken": access_token})


@api_blueprint.get("/auth/me")
@jwt_required()
def auth_me():
    user = current_user
    if user is None:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": serialize_auth_user(user)})


@api_blueprint.get("/diaries")
@jwt_required()
def list_diaries_endpoint():
    limit = _coerce_positive_int(request.args.get("limit"), default=20, max_value=100)
    offset = _coerce_positive_int(request.args.get("offset"), default=0)
    emotion = request.args.get("emotion") or None
    is_evolved_param = request.args.get("isEvolved")
    is_evolved = _coerce_optional_bool(is_evolved_param)

    fetch_limit = min(limit + 1, 201)
    diaries = list_diaries_for_user(
        current_user.id,
        limit=fetch_limit,
        offset=offset,
        emotion=emotion,
        is_evolved=is_evolved,
    )
    has_more = len(diaries) > limit
    items = diaries[:limit]

    return jsonify(
        {
            "items": [serialize_diary(item) for item in items],
            "limit": limit,
            "offset": offset,
            "hasMore": has_more,
            "nextOffset": (offset + limit) if has_more else None,
        }
    )


@api_blueprint.post("/diaries")
@jwt_required()
def create_diary_endpoint():
    payload = request.get_json(silent=True) or {}
    payload["userId"] = current_user.id

    try:
        diary = create_diary(payload)
    except DiaryServiceError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(serialize_diary(diary)), 201


@api_blueprint.get("/diaries/<diary_id>")
@jwt_required()
def fetch_diary_endpoint(diary_id: str):
    diary = get_diary(diary_id)
    if diary is None or diary.user_id != current_user.id:
        return jsonify({"error": "Diary not found."}), 404
    return jsonify(serialize_diary(diary))


@api_blueprint.put("/diaries/<diary_id>")
@api_blueprint.patch("/diaries/<diary_id>")
@jwt_required()
def update_diary_endpoint(diary_id: str):
    diary = get_diary(diary_id)
    if diary is None or diary.user_id != current_user.id:
        return jsonify({"error": "Diary not found."}), 404

    payload = request.get_json(silent=True) or {}

    try:
        updated = update_diary(diary_id, payload)
    except DiaryServiceError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(serialize_diary(updated))


@api_blueprint.delete("/diaries/<diary_id>")
@jwt_required()
def delete_diary_endpoint(diary_id: str):
    diary = get_diary(diary_id)
    if diary is None or diary.user_id != current_user.id:
        return jsonify({"error": "Diary not found."}), 404

    delete_diary(diary_id)
    return "", 204


@api_blueprint.post("/diaries/<diary_id>/refresh-ai")
@jwt_required()
def refresh_diary_ai_endpoint(diary_id: str):
    diary = get_diary(diary_id)
    if diary is None or diary.user_id != current_user.id:
        return jsonify({"error": "Diary not found."}), 404

    try:
        refreshed = regenerate_diary_ai(diary_id)
    except DiaryServiceError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(serialize_diary(refreshed))


@api_blueprint.get("/orbs")
@jwt_required()
def list_memory_orbs_endpoint():
    orbs = list_memory_orbs_for_user(current_user.id)
    return jsonify(
        {
            "items": [serialize_memory_orb(orb) for orb in orbs],
            "count": len(orbs),
        }
    )


@api_blueprint.post("/orbs")
@jwt_required()
def create_memory_orb_endpoint():
    payload = request.get_json(silent=True) or {}
    diary_id = payload.get("diaryId")
    emotion = payload.get("emotion")
    date_value = payload.get("date")
    reinterpretation_note = payload.get("reinterpretationNote")

    if not diary_id or not emotion:
        return jsonify({"error": "Both 'diaryId' and 'emotion' are required."}), 400

    if not date_value:
        date_value = datetime.now(timezone.utc).isoformat()

    try:
        orb = create_memory_orb(
            user_id=current_user.id,
            diary_id=diary_id,
            emotion=emotion,
            date_str=date_value,
            reinterpretation_note=reinterpretation_note,
        )
    except MemoryOrbServiceError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(serialize_memory_orb(orb)), 201


@api_blueprint.post("/orbs/<orb_id>/reinterpret")
@jwt_required()
def reinterpret_memory_orb_endpoint(orb_id: str):
    payload = request.get_json(silent=True) or {}
    note = payload.get("reinterpretationNote")
    replies = payload.get("reinterpretationReplies")

    try:
        orb = mark_memory_orb_reinterpreted(
            orb_id,
            user_id=current_user.id,
            reinterpretation_note=note,
            reinterpretation_replies=replies,
        )
    except MemoryOrbServiceError as exc:
        return jsonify({"error": str(exc)}), 404

    return jsonify(serialize_memory_orb(orb))


def _issue_tokens(user: User) -> Dict[str, str]:
    claims = {"email": user.email}
    return {
        "accessToken": create_access_token(identity=user.id, additional_claims=claims),
        "refreshToken": create_refresh_token(identity=user.id),
    }


def _coerce_positive_int(
    value: Any,
    default: int,
    max_value: Optional[int] = None,
) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if parsed < 0:
        return default
    if max_value is not None and parsed > max_value:
        return max_value
    return parsed


def _coerce_optional_bool(value: Any) -> Optional[bool]:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.lower()
        if lowered in {"true", "1", "yes", "y"}:
            return True
        if lowered in {"false", "0", "no", "n"}:
            return False
    return None

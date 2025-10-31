from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.exc import IntegrityError

from ..db import db
from ..models import User


class UserServiceError(RuntimeError):
    pass


def serialize_user(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "name": user.display_name,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


def upsert_user(payload: Dict[str, Any]) -> tuple[User, bool]:
    user_id = payload.get("id")
    email = payload.get("email")
    if not user_id or not email:
        raise UserServiceError("Both 'id' and 'email' are required.")

    user = User.query.get(user_id)
    display_name = payload.get("displayName")
    created = False

    if user is None:
        user = User(id=user_id, email=email, display_name=display_name)
        db.session.add(user)
        created = True
    else:
        user.email = email
        user.display_name = display_name

    try:
        db.session.commit()
    except IntegrityError as exc:  # rethrow with cleaner message
        db.session.rollback()
        raise UserServiceError("Email already exists for another user.") from exc

    return user, created


def delete_user(user_id: str) -> None:
    user = User.query.get(user_id)
    if user is None:
        return
    db.session.delete(user)
    db.session.commit()

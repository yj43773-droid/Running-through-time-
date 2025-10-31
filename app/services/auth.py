from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..db import db
from ..extensions import bcrypt
from ..models import User


class AuthServiceError(RuntimeError):
    pass


def _normalize_email(email: str | None) -> str:
    if not email:
        return ""
    return email.strip().lower()


def register_user(email: str, password: str, display_name: Optional[str]) -> User:
    normalized_email = _normalize_email(email)
    if not normalized_email:
        raise AuthServiceError("Email is required.")
    if not password:
        raise AuthServiceError("Password is required.")

    existing = (
        User.query.filter(func.lower(User.email) == normalized_email)
        .with_entities(User.id)
        .first()
    )
    if existing:
        raise AuthServiceError("Email is already registered.")

    user = User(
        id=str(uuid4()),
        email=normalized_email,
        display_name=display_name,
        password_hash=_hash_password(password),
    )
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise AuthServiceError("Failed to register user.") from exc

    return user


def authenticate_user(email: str, password: str) -> User:
    normalized_email = _normalize_email(email)
    if not normalized_email or not password:
        raise AuthServiceError("Email and password are required.")

    user = User.query.filter(func.lower(User.email) == normalized_email).first()
    if user is None or not user.password_hash:
        raise AuthServiceError("Invalid email or password.")

    if not bcrypt.check_password_hash(user.password_hash, password):
        raise AuthServiceError("Invalid email or password.")

    return user


def set_user_password(user: User, password: str) -> None:
    if not password:
        raise AuthServiceError("Password is required.")
    user.password_hash = _hash_password(password)


def serialize_auth_user(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "name": user.display_name,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


def _hash_password(password: str) -> str:
    # bcrypt returns bytes; decode to str for storage.
    return bcrypt.generate_password_hash(password).decode("utf-8")

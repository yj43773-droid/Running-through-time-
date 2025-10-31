from __future__ import annotations

from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

bcrypt = Bcrypt()
jwt = JWTManager()

__all__ = ["bcrypt", "jwt"]

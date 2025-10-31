from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config import get_config
from .db import init_db
from .extensions import bcrypt, jwt
from .routes import api_blueprint
from .vector_store import init_vector_store


def create_app(config_name: str | None = None) -> Flask:
    """Application factory so tests and scripts can create isolated instances."""
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    bcrypt.init_app(app)
    jwt.init_app(app)

    cors_origins = app.config.get("CORS_ORIGINS")
    origins = (
        [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
        if cors_origins
        else "*"
    )
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        supports_credentials=True,
    )

    init_db(app)
    init_vector_store(app)

    app.register_blueprint(api_blueprint, url_prefix="/api")

    return app

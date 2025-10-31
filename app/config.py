from __future__ import annotations

import os
from pathlib import Path
from typing import Type
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_MINUTES", "30"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_DAYS", "7"))
    )
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
    DEBUG = False
    DATABASE_URI = os.environ.get(
        "DATABASE_URI",
        f"sqlite:///{(BASE_DIR / 'instance' / 'app.db').as_posix()}",
    )
    CHROMA_PERSIST_DIR = os.environ.get(
        "CHROMA_PERSIST_DIR",
        (BASE_DIR / "vector_store").as_posix(),
    )
    AI_RESPONSE_MODE = os.environ.get("AI_RESPONSE_MODE", "mock")
    AI_SIMILAR_RESULTS = int(os.environ.get("AI_SIMILAR_RESULTS", "3"))
    AI_LLM_MODEL = os.environ.get("AI_LLM_MODEL", "gpt-3.5-turbo")
    AI_LLM_TEMPERATURE = float(os.environ.get("AI_LLM_TEMPERATURE", "0.3"))


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class TestingConfig(BaseConfig):
    TESTING = True
    DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(BaseConfig):
    DEBUG = False


CONFIG_MAP: dict[str, Type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(name: str | None) -> Type[BaseConfig]:
    env_name = name or os.environ.get("FLASK_ENV") or os.environ.get("ENV")
    return CONFIG_MAP.get(env_name, CONFIG_MAP["default"])

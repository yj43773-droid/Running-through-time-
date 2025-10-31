from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

import pytest

from app import create_app
from app.db import db


@pytest.fixture(scope="session")
def app(tmp_path_factory: pytest.TempPathFactory):
    persist_dir = tmp_path_factory.mktemp("vector_store")
    database = tmp_path_factory.mktemp("db") / "test.db"

    os.environ["CHROMA_PERSIST_DIR"] = str(persist_dir)
    os.environ["DATABASE_URI"] = f"sqlite:///{database}"
    os.environ.setdefault("SECRET_KEY", "test-secret-key")
    os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")

    application = create_app("testing")
    yield application


@pytest.fixture()
def app_context(app) -> Generator[None, None, None]:
    with app.app_context():
        yield
        db.session.remove()

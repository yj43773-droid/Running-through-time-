from __future__ import annotations

import os
from pathlib import Path
from sqlite3 import Connection as SQLite3Connection

from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event

db = SQLAlchemy()


def init_db(app) -> None:
    """Configure SQLAlchemy and ensure the SQLite database file exists."""
    app.config.setdefault("SQLALCHEMY_DATABASE_URI", app.config["DATABASE_URI"])
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    db.init_app(app)

    with app.app_context():
        _ensure_instance_folder(app.config["SQLALCHEMY_DATABASE_URI"])
        _attach_sqlite_foreign_keys_listener()

        # Creating tables on startup keeps the skeleton usable out of the box.
        current_app.logger.debug("Ensuring database tables exist")
        db.create_all()


def _attach_sqlite_foreign_keys_listener() -> None:
    engine = db.get_engine()

    if engine.dialect.name != "sqlite":
        return

    @event.listens_for(engine, "connect")
    def enable_sqlite_fk(
        dbapi_connection: SQLite3Connection, _connection_record
    ) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


def _ensure_instance_folder(database_uri: str) -> None:
    if not database_uri.startswith("sqlite"):
        return

    # sqlite:///relative/path.db -> relative path
    # sqlite:////absolute/path.db -> absolute path
    path_part = database_uri.split("sqlite:///", 1)[-1]
    if not path_part:
        return

    db_path = Path(path_part)
    if not db_path.is_absolute():
        db_path = Path(current_app.instance_path) / db_path

    os.makedirs(db_path.parent, exist_ok=True)

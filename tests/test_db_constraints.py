from __future__ import annotations

from sqlalchemy import text

from app.db import db
from app.models import Diary, User


def test_sqlite_foreign_keys_enabled(app_context):
    engine = db.get_engine()
    with engine.connect() as connection:
        result = connection.execute(text("PRAGMA foreign_keys;"))
        assert result.scalar() == 1


def test_user_delete_cascades_diaries(app_context):
    user = User(id="user-1", email="user@example.com")
    diary = Diary(
        id="diary-1",
        user_id="user-1",
        text="hello",
        emotion="Joy",
        ai_character="루미",
        ai_response="안녕!",
    )
    db.session.add_all([user, diary])
    db.session.commit()

    db.session.delete(user)
    db.session.commit()

    assert Diary.query.count() == 0


def test_linked_past_diary_set_null(app_context):
    user = User(id="user-2", email="user2@example.com")
    past = Diary(
        id="past-1",
        user_id="user-2",
        text="past diary",
        emotion="Sadness",
        ai_character="루미",
        ai_response="위로",
    )
    evolved = Diary(
        id="diary-2",
        user_id="user-2",
        text="new diary",
        emotion="Joy",
        ai_character="제트",
        ai_response="축하해",
        linked_past_diary_id="past-1",
    )

    db.session.add_all([user, past, evolved])
    db.session.commit()

    db.session.delete(past)
    db.session.commit()

    refreshed = Diary.query.get("diary-2")
    assert refreshed is not None
    assert refreshed.linked_past_diary_id is None

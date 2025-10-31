from flask import current_app

from app.db import db
from app.models import Diary, User
from app.services.ai import generate_diary_ai_bundle


def test_generate_diary_ai_bundle_mock(monkeypatch, app_context):
    current_app.config["AI_RESPONSE_MODE"] = "mock"

    user = User(id="user-mock", email="mock@example.com")
    diary = Diary(
        id="diary-mock",
        user_id="user-mock",
        text="오늘은 조금 지쳤지만 그래도 해냈어",
        emotion="Joy",
        ai_character="루미",
        ai_response="잘했어!",
    )
    db.session.add_all([user, diary])
    db.session.commit()

    monkeypatch.setattr(
        "app.services.ai.query_similar_diary_documents",
        lambda *args, **kwargs: [],
    )

    bundle = generate_diary_ai_bundle(diary)

    assert len(bundle["responses"]) == 3
    assert bundle["similarDiaries"] == []
    assert all("message" in r for r in bundle["responses"])

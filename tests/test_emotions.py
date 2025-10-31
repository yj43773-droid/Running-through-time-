from app.services.emotions import emotion_to_color


def test_emotion_to_color_matches_case_insensitive():
    assert emotion_to_color("Joy") == "#FFD166"
    assert emotion_to_color("joy") == "#FFD166"


def test_emotion_to_color_handles_korean_label():
    assert emotion_to_color("슬픔") == "#118AB2"


def test_emotion_to_color_unknown_returns_none():
    assert emotion_to_color("???") is None

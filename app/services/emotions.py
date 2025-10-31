from __future__ import annotations

from typing import Optional

EMOTION_COLOR_MAP = {
    # English labels
    "joy": "#FFD166",
    "happiness": "#FFD166",
    "sadness": "#118AB2",
    "sorrow": "#118AB2",
    "anger": "#EF476F",
    "rage": "#EF476F",
    "fear": "#06D6A0",
    "anxiety": "#073B4C",
    "surprise": "#8338EC",
    "love": "#FF758F",
    "calm": "#9BC53D",
    "serenity": "#9BC53D",
    # Korean labels
    "기쁨": "#FFD166",
    "행복": "#FFD166",
    "슬픔": "#118AB2",
    "우울": "#118AB2",
    "분노": "#EF476F",
    "화남": "#EF476F",
    "두려움": "#06D6A0",
    "불안": "#073B4C",
    "놀람": "#8338EC",
    "사랑": "#FF758F",
    "평온": "#9BC53D",
    "차분": "#9BC53D",
}


def emotion_to_color(emotion: Optional[str]) -> Optional[str]:
    if not emotion:
        return None

    normalized = emotion.strip()
    if not normalized:
        return None

    lower = normalized.lower()
    if lower in EMOTION_COLOR_MAP:
        return EMOTION_COLOR_MAP[lower]
    if normalized in EMOTION_COLOR_MAP:
        return EMOTION_COLOR_MAP[normalized]

    return None

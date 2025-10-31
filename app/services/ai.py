from __future__ import annotations

from typing import Any, Dict, List

from flask import current_app

from ..models import Diary
from ..vector_store import query_similar_diary_documents
from .emotions import emotion_to_color

PERSONAS: List[Dict[str, str]] = [
    {
        "key": "gentle",
        "label": "상냥한 공감러",
        "style": "따뜻하고 포용적인 말투로 위로와 공감을 전합니다.",
        "instruction": "사용자의 감정을 수용하고 편안함을 줄 수 있는 부드러운 말투로 짧은 답장을 작성하세요.",
    },
    {
        "key": "pragmatic",
        "label": "현실적인 조언자",
        "style": "현실적이고 명확한 조언을 제공합니다.",
        "instruction": "문제 해결에 도움이 되는 구체적인 조언을 2~3문장으로 제시하세요.",
    },
    {
        "key": "humorous",
        "label": "유머러스한 친구",
        "style": "가볍고 재치있는 농담으로 분위기를 전환합니다.",
        "instruction": "상황을 가볍게 풀어 주되, 공감을 잃지 않는 선에서 재치 있게 답변하세요.",
    },
]


def generate_diary_ai_bundle(diary: Diary) -> Dict[str, Any]:
    limit = current_app.config.get("AI_SIMILAR_RESULTS", 3)
    similar_diaries = _retrieve_similar_diaries(diary, limit=limit)
    responses = _generate_persona_responses(diary, similar_diaries)
    return {
        "responses": responses,
        "similarDiaries": similar_diaries,
    }


def _retrieve_similar_diaries(diary: Diary, limit: int) -> List[Dict[str, Any]]:
    if limit <= 0:
        return []

    excludes = {diary.id}
    results: List[Dict[str, Any]] = []

    # Step 1: try to find within the same user
    user_where = {"userId": diary.user_id} if diary.user_id else None
    user_candidates = query_similar_diary_documents(
        text=diary.text,
        limit=limit + 1,
        where=user_where,
    )
    results.extend(_filter_similar_entries(user_candidates, excludes))

    # Step 2: fallback to global pool if not enough
    if len(results) < limit:
        global_candidates = query_similar_diary_documents(
            text=diary.text,
            limit=limit + len(excludes),
            where=None,
        )
        results.extend(_filter_similar_entries(global_candidates, excludes))

    # Trim and enrich with DB data if possible
    trimmed = results[:limit]
    enriched = _hydrate_similar_diaries(trimmed)
    return enriched


def _filter_similar_entries(
    entries: List[Dict[str, Any]],
    excludes: set[str],
) -> List[Dict[str, Any]]:
    filtered: List[Dict[str, Any]] = []
    for entry in entries:
        diary_id = entry.get("id")
        if not diary_id or diary_id in excludes:
            continue
        excludes.add(diary_id)
        filtered.append(entry)
    return filtered


def _hydrate_similar_diaries(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not entries:
        return []

    diary_map = {
        diary.id: diary
        for diary in Diary.query.filter(Diary.id.in_([e["id"] for e in entries])).all()
    }

    hydrated: List[Dict[str, Any]] = []
    for entry in entries:
        diary_id = entry["id"]
        meta = entry.get("metadata") or {}
        matched = diary_map.get(diary_id)
        emotion = (matched.emotion if matched else meta.get("emotion")) or ""
        hydrated.append(
            {
                "id": diary_id,
                "excerpt": _clip_text(entry.get("document") or (matched.text if matched else "")),
                "distance": entry.get("distance"),
                "emotion": emotion,
                "emotionColor": emotion_to_color(emotion),
                "userId": (matched.user_id if matched else meta.get("userId")),
                "createdAt": (
                    matched.created_at.isoformat() if matched and matched.created_at else None
                ),
            }
        )
    return hydrated


def _generate_persona_responses(
    diary: Diary,
    similar_diaries: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    mode = current_app.config.get("AI_RESPONSE_MODE", "mock").lower()
    if mode == "mock":
        return _mock_persona_responses(diary, similar_diaries)
    return _llm_persona_responses(diary, similar_diaries)


def _mock_persona_responses(
    diary: Diary,
    similar_diaries: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    top_reference = similar_diaries[0] if similar_diaries else None
    ref_text = (
        f" 비슷한 과거 일기({top_reference['id']})가 있어 함께 떠올려 봤어요."
        if top_reference
        else ""
    )

    responses: List[Dict[str, Any]] = []
    for persona in PERSONAS:
        if persona["key"] == "gentle":
            message = f"너무 수고했어요. 지금 느끼는 감정을 충분히 느껴도 괜찮아요.{ref_text}"
        elif persona["key"] == "pragmatic":
            message = "지금 상황을 한 걸음 떨어져서 바라보면 도움이 될 수 있어요. 작은 행동부터 시작해 볼까요?" + ref_text
        else:
            message = "이럴 땐 스스로를 위해 초콜릿 하나쯤은 괜찮지 않을까요? 😉" + ref_text
        responses.append(
            {
                "persona": persona["key"],
                "label": persona["label"],
                "style": persona["style"],
                "message": message,
            }
        )
    return responses


def _llm_persona_responses(
    diary: Diary,
    similar_diaries: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    try:
        llm = _get_llm()
    except Exception as exc:  # pragma: no cover - mode fallback
        current_app.logger.warning("Falling back to mock persona responses: %s", exc)
        return _mock_persona_responses(diary, similar_diaries)

    context_lines = [
        f"현재 일기:\n{diary.text}",
    ]
    if similar_diaries:
        context_lines.append("\n과거 유사 일기 요약:")
        for item in similar_diaries:
            excerpt = item.get("excerpt") or ""
            context_lines.append(
                f"- ID {item['id']} (감정: {item.get('emotion') or '미상'}): {excerpt}"
            )

    context = "\n".join(context_lines)

    responses: List[Dict[str, Any]] = []
    for persona in PERSONAS:
        prompt = (
            f"{persona['instruction']}\n\n"
            f"말투 가이드: {persona['style']}\n\n"
            f"{context}\n\n"
            "답변:"
        )
        try:
            completion = llm.complete(prompt)
            message = completion.text.strip()
        except Exception as exc:  # pragma: no cover - LLM failure fallback
            current_app.logger.warning(
                "Persona response generation failed (%s), using mock: %s",
                persona["key"],
                exc,
            )
            message = _mock_persona_responses(diary, similar_diaries)[
                PERSONAS.index(persona)
            ]["message"]

        responses.append(
            {
                "persona": persona["key"],
                "label": persona["label"],
                "style": persona["style"],
                "message": message,
            }
        )

    return responses


def _get_llm():
    from llama_index.llms.openai import OpenAI  # Lazy import

    model = (
        current_app.config.get("AI_LLM_MODEL")
        or current_app.config.get("LLM_MODEL")
        or "gpt-3.5-turbo"
    )
    temperature = current_app.config.get("AI_LLM_TEMPERATURE", 0.3)
    return OpenAI(model=model, temperature=temperature)


def _clip_text(text: str, limit: int = 120) -> str:
    if not text:
        return ""
    clipped = text.strip().replace("\n", " ")
    if len(clipped) <= limit:
        return clipped
    return clipped[: limit - 1].rstrip() + "…"

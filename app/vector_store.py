from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import chromadb
from flask import current_app, g
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.schema import Document
from llama_index.vector_stores.chromadb import ChromaVectorStore

from .models import Diary

def init_vector_store(app) -> None:
    """Register teardown so the Chromadb client is cleaned up with the request context."""

    @app.teardown_appcontext
    def close_vector_store(exception: Exception | None) -> None:  # noqa: ARG001
        g.pop("chroma_client", None)
        g.pop("vector_index", None)


def get_chroma_client() -> chromadb.PersistentClient:
    if "chroma_client" not in g:
        persist_dir = current_app.config["CHROMA_PERSIST_DIR"]
        os.makedirs(persist_dir, exist_ok=True)
        g.chroma_client = chromadb.PersistentClient(path=persist_dir)
    return g.chroma_client


def get_vector_index() -> VectorStoreIndex:
    if "vector_index" not in g:
        client = get_chroma_client()
        collection = client.get_or_create_collection("diaries")
        vector_store = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        g.vector_index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
            storage_context=storage_context,
        )
    return g.vector_index


def add_document(content: Any) -> None:
    """Example helper illustrating how to add data to the vector index."""
    index = get_vector_index()
    document = _coerce_document(content)
    index.insert(document)


def upsert_diary_document(diary: Diary) -> None:
    """Store or update a diary entry inside the vector database."""
    collection = _get_collection()
    payload = _serialize_diary_for_embedding(diary)
    collection.upsert(
        ids=[payload["id"]],
        documents=[payload["document"]],
        metadatas=[payload["metadata"]],
    )


def delete_diary_document(diary_id: str) -> None:
    collection = _get_collection()
    try:
        collection.delete(ids=[diary_id])
    except ValueError:
        # Chroma raises ValueError if the id is missing; ignore for idempotence
        pass


def query_similar_diary_documents(
    text: str,
    limit: int,
    where: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    collection = _get_collection()
    try:
        result = collection.query(
            query_texts=[text],
            n_results=limit,
            where=where,
        )
    except ValueError:
        return []

    ids = (result.get("ids") or [[]])[0]
    documents = (result.get("documents") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]

    entries: List[Dict[str, Any]] = []
    for idx, doc_id in enumerate(ids):
        if doc_id is None:
            continue
        entry = {
            "id": doc_id,
            "document": documents[idx] if idx < len(documents) else None,
            "distance": distances[idx] if idx < len(distances) else None,
            "metadata": metadatas[idx] if idx < len(metadatas) else {},
        }
        entries.append(entry)
    return entries


def _coerce_document(content: Any) -> Document:
    if isinstance(content, Document):
        return content
    if isinstance(content, dict):
        text = content.get("text") or content.get("body") or str(content)
        metadata = {k: v for k, v in content.items() if k not in {"text", "body"}}
        return Document(text=text, metadata=metadata)
    return Document(text=str(content))


def _get_collection():
    client = get_chroma_client()
    return client.get_or_create_collection("diaries")


def _serialize_diary_for_embedding(diary: Diary) -> Dict[str, Any]:
    metadata: Dict[str, Any] = {
        "userId": diary.user_id,
        "emotion": diary.emotion,
        "aiCharacter": diary.ai_character,
        "isEvolved": bool(diary.is_evolved),
    }
    if diary.evolved_emotion:
        metadata["evolvedEmotion"] = diary.evolved_emotion
    if diary.reinterpretation:
        metadata["reinterpretation"] = diary.reinterpretation
    if diary.linked_past_diary_id:
        metadata["linkedPastDiaryId"] = diary.linked_past_diary_id

    return {
        "id": diary.id,
        "document": diary.text,
        "metadata": metadata,
    }

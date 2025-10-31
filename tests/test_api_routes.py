from __future__ import annotations

import uuid
from typing import Dict

from flask import Flask


def _unique_email() -> str:
    return f"user_{uuid.uuid4().hex}@example.com"


def _auth_headers(access_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def test_auth_register_login_and_me(app: Flask):
    client = app.test_client()
    email = _unique_email()
    password = "Secret123!"

    register_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "Test User"},
    )
    assert register_response.status_code == 201
    register_data = register_response.get_json()
    assert register_data["user"]["email"] == email
    assert "accessToken" in register_data
    assert "refreshToken" in register_data

    duplicate_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "Test User"},
    )
    assert duplicate_response.status_code == 400

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    login_data = login_response.get_json()
    assert login_data["user"]["id"] == register_data["user"]["id"]
    access_token = login_data["accessToken"]

    bad_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "wrong"},
    )
    assert bad_login.status_code == 401

    me_response = client.get("/api/auth/me", headers=_auth_headers(access_token))
    assert me_response.status_code == 200
    me_data = me_response.get_json()
    assert me_data["user"]["email"] == email

    refresh_response = client.post(
        "/api/auth/refresh",
        headers=_auth_headers(login_data["refreshToken"]),
    )
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.get_json()
    assert "accessToken" in refresh_data


def test_diary_crud_flow(app: Flask):
    client = app.test_client()
    email = _unique_email()
    password = "DiaryPass123!"

    register_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "Diary User"},
    )
    tokens = register_response.get_json()
    headers = _auth_headers(tokens["accessToken"])

    create_response = client.post(
        "/api/diaries",
        json={"content": "오늘의 일기 내용", "emotion": "happy"},
        headers=headers,
    )
    assert create_response.status_code == 201
    diary = create_response.get_json()
    diary_id = diary["id"]
    assert diary["emotion"] == "happy"
    assert diary["content"] == "오늘의 일기 내용"

    list_response = client.get("/api/diaries?limit=1", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.get_json()
    assert len(list_data["items"]) == 1
    assert list_data["items"][0]["id"] == diary_id
    assert list_data["limit"] == 1

    fetch_response = client.get(f"/api/diaries/{diary_id}", headers=headers)
    assert fetch_response.status_code == 200

    update_response = client.patch(
        f"/api/diaries/{diary_id}",
        json={"emotion": "sad", "isEvolved": True},
        headers=headers,
    )
    assert update_response.status_code == 200
    updated = update_response.get_json()
    assert updated["emotion"] == "sad"
    assert updated["isEvolved"] is True

    delete_response = client.delete(f"/api/diaries/{diary_id}", headers=headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/diaries/{diary_id}", headers=headers)
    assert missing_response.status_code == 404


def test_memory_orb_endpoints(app: Flask):
    client = app.test_client()
    email = _unique_email()
    password = "OrbPass123!"

    register_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "Orb User"},
    )
    tokens = register_response.get_json()
    headers = _auth_headers(tokens["accessToken"])

    diary_response = client.post(
        "/api/diaries",
        json={"content": "오브를 위한 일기", "emotion": "excited"},
        headers=headers,
    )
    diary = diary_response.get_json()

    create_orb_response = client.post(
        "/api/orbs",
        json={"diaryId": diary["id"], "emotion": "excited"},
        headers=headers,
    )
    assert create_orb_response.status_code == 201
    orb_data = create_orb_response.get_json()
    assert orb_data["diaryId"] == diary["id"]
    assert orb_data["isReinterpreted"] is False

    list_orbs_response = client.get("/api/orbs", headers=headers)
    assert list_orbs_response.status_code == 200
    list_orbs_data = list_orbs_response.get_json()
    assert list_orbs_data["count"] == 1
    assert list_orbs_data["items"][0]["id"] == orb_data["id"]

    reinterpret_response = client.post(
        f"/api/orbs/{orb_data['id']}/reinterpret",
        json={"reinterpretationNote": "새로운 관점"},
        headers=headers,
    )
    assert reinterpret_response.status_code == 200
    reinterpret_data = reinterpret_response.get_json()
    assert reinterpret_data["isReinterpreted"] is True
    assert reinterpret_data["reinterpretationNote"] == "새로운 관점"

    other_email = _unique_email()
    register_other = client.post(
        "/api/auth/register",
        json={"email": other_email, "password": password, "name": "Other User"},
    )
    other_tokens = register_other.get_json()
    other_headers = _auth_headers(other_tokens["accessToken"])

    unauthorized_response = client.post(
        f"/api/orbs/{orb_data['id']}/reinterpret",
        json={"reinterpretationNote": "허용되지 않음"},
        headers=other_headers,
    )
    assert unauthorized_response.status_code == 404

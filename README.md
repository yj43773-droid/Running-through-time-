## Backend Setup

1. **Create the virtual environment**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies**

   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with values that suit your environment:

   ```dotenv
   FLASK_ENV=development
   SECRET_KEY=dev-secret-key
   JWT_SECRET_KEY=dev-jwt-secret
   DATABASE_URI=sqlite:///instance/app.db
   CORS_ORIGINS=http://localhost:5173
   ```

4. **Optional: install dev dependencies**

   ```bash
   pip install -r requirements-dev.txt
   ```

5. **Run the dev server**

   ```bash
   flask --app app run --debug
   ```

### Highlights

- Flask app factory lives in `app/__init__.py`.
- SQLite database managed through SQLAlchemy; default file path is `instance/app.db`.
- User & diary models implement the foreign-key behaviour described in the schema design (`app/models.py`).
- Auth, diary, and memory-orb endpoints live under `/api` inside `app/routes.py`.
- RAG pipeline keeps Chroma vector indexes in sync and enriches diaries with AI persona replies & similar-entry search (`app/services/diaries.py`, `app/services/ai.py`).

### Run tests

```bash
pytest
```

### AI & RAG configuration

- `AI_RESPONSE_MODE`: set to `mock` for deterministic demo messages (default) or `llm` to call the configured LLM via LlamaIndex.
- `AI_SIMILAR_RESULTS`: number of similar diaries to surface from Chroma (defaults to `3`).
- `AI_LLM_MODEL` / `AI_LLM_TEMPERATURE`: forwarded to `llama_index` LLM client when `AI_RESPONSE_MODE=llm`.

API additions:

- `POST /api/auth/register` — create a user account and receive access/refresh tokens.
- `POST /api/auth/login` — authenticate and receive fresh tokens.
- `GET /api/auth/me` — fetch the currently authenticated user profile.
- `POST /api/auth/refresh` — exchange a refresh token for a new access token.
- `GET /api/diaries` — list diaries for the authenticated user (supports limit/offset filters).
- `POST /api/diaries` — stores diary, triggers persona replies & similar diary lookup automatically.
- `GET /api/diaries/<diary_id>` — fetch a single diary.
- `PUT/PATCH /api/diaries/<diary_id>` — update diary contents or evolution fields.
- `DELETE /api/diaries/<diary_id>` — remove a diary entry.
- `POST /api/diaries/<diary_id>/refresh-ai` — re-run persona generation and similarity search on demand.
- `GET /api/orbs` — list memory orbs for the authenticated user.
- `POST /api/orbs` — create a memory orb associated with a diary.
- `POST /api/orbs/<orb_id>/reinterpret` — mark an orb as reinterpreted and optionally store notes/responses.

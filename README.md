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

3. **Seed environment variables (optional)**

   ```bash
   cp .env.example .env
   ```

4. **Optional: install dev dependencies**

   ```bash
   pip install -r requirements-dev.txt
   ```

5. **Run the dev server**

   ```bash
   flask --app wsgi run
   ```

### Highlights

- Flask app factory lives in `app/__init__.py`.
- SQLite database managed through SQLAlchemy; default file path is `instance/app.db`.
- User & diary models implement the foreign-key behaviour described in the schema design (`app/models.py`).
- CRUD + evolution endpoints live under `/api` inside `app/routes.py`.
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

- `POST /api/diaries` — stores diary, triggers persona replies & similar diary lookup automatically.
- `POST /api/diaries/<diary_id>/refresh-ai` — re-run persona generation and similarity search on demand.

from __future__ import annotations

from app import create_app

app = create_app()


if __name__ == "__main__":
    # Allow `python wsgi.py` for quick local smoke tests.
    app.run(host="0.0.0.0", port=5000, debug=True)

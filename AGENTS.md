# AGENTS.md — Resilient Essential Goods Coordinator

## Project structure

- **Root**: FastAPI backend (Python 3.11, SQLAlchemy, SQLite)
- `frontend/`: Admin dashboard — React 18 + Vite (port 5173)
- `driver-app-main/`: Driver mobile app — React 18 + Vite (port 5174)
- `services/`, `routes/`, `schemas/`, `models.py` — backend layers
- `services/simulation/` — simulation engine sub-package (engine, decision_engine, connection_manager)
- `app_state.py` — singleton instances for engine, planner, AI services (not a FastAPI dependency)
- `config.py` — all env vars with defaults via `python-dotenv`; `load_settings()` returns frozen `Settings`
- `database.py` — SQLite with WAL mode + `QueuePool`; `init_db()` creates tables; `get_session()` yields `SessionLocal`

## Development commands

```bash
# Backend
python -m venv .venv && source .venv/bin/activate  # Linux/Mac
# or: .\.venv\Scripts\Activate.ps1                   # Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload                   # http://localhost:8000

# Admin frontend (separate terminal)
cd frontend && npm install --legacy-peer-deps && npm run dev  # http://localhost:5173

# Driver app (separate terminal)
cd driver-app-main && npm install --legacy-peer-deps && npm run dev  # http://localhost:5174
```

One-click `.bat` files exist for Windows: `start-backend.bat`, `start-admin-frontend.bat`, `start-driver-app.bat`.

## Testing

```bash
# Backend (all)
python -m pytest tests/ -v

# Backend (single file)
python -m pytest tests/test_simulation.py -v --cov=

# Frontend
cd frontend && npm test

# Driver app
cd driver-app-main && npm test

# CI order (build.sh): backend tests → frontend tests → frontend build → driver build
```

CI runs 3 parallel jobs: backend (pytest + coverage + codecov), frontend (vitest + build), driver-app (vitest + build).

## Vite proxy (both frontends)

Both `vite.config.js` files proxy `/api` → `http://127.0.0.1:8000` and `/ws` → `ws://127.0.0.1:8000`. No remote targets configured.

## Static serving (production)

FastAPI serves `frontend/dist/` at `/` and `driver-app-main/dist/` at `/driver` when those dirs exist. Build with `cd frontend && npm run build` (and/or `driver-app-main`), then open `http://localhost:8000`.

## GSD workflow system

Do not touch `get-shit-done/`, `agents/`, `.planning/`, or `.clinerules` unless the user explicitly invokes a `/gsd-*` command. The `.clinerules` file governs those interactions.

## Key quirks

- `npm install` requires `--legacy-peer-deps` (see `build.sh`)
- Backend auto-seeds facilities, drivers, vehicles, objectives on startup when `ALLOW_DEMO_SEED=true` and DB is empty
- DB access uses `get_session()` generator (`with SessionLocal() as session:`) — no FastAPI `Depends` pattern
- No linter or formatter configured in the repo — skip those steps
- Firebase auth is optional (gracefully degrades when `firebase-service-account.json` is missing)
- Gemini/Groq AI features require `GEMINI_API_KEY` or `GROQ_API_KEY` set in environment or `.env`
- Rate limiting via `slowapi` (10 req/min for AI endpoints, configurable via `AI_RATE_LIMIT_PER_MIN`)
- `opencode.json` has a hardcoded Windows path for the SQLite MCP tool — update it if working on a different machine
- WebSocket live stream at `/ws/operations`; CORS is open (`allow_origins=["*"]`) unless `CORS_ORIGINS` env is set
- Frontend tests use Vitest (configured in `frontend/vite.config.js` with `globals: true`)

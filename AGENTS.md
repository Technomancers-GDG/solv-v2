# AGENTS.md — solv-v2

## Architecture

Monorepo with three sub-projects:
- **Backend**: FastAPI + SQLAlchemy, entrypoint `main:app`, served via uvicorn
- **Admin frontend**: `frontend/` — Vite + React (JSX, no TypeScript)
- **Driver mobile app**: `driver-app-main/` — Vite + React (JSX, standalone build)

Business logic lives in `services/`. DB models in `models.py`, Pydantic schemas in `schemas.py`.

## Getting started

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload          # http://127.0.0.1:8000

# Admin frontend (separate terminal)
cd frontend && npm install && npm run dev    # http://localhost:5173

# Driver mobile app
cd driver-app-main && npm install && npm run dev
```

## Key commands

| What | Command |
|---|---|
| Backend tests | `python -m pytest tests/test_simulation.py -q` |
| Build all (Render) | `./build.sh` — pip install + npm install (with `--legacy-peer-deps`) for both frontends + build |
| Gemini integration test | `python test_gemini_integration.py` |
| One-click judge demo | `POST /api/demo/judge-mode` — scales fleet to 60, starts sim at 180x, triggers highest severity scenario |

## Critical quirks

- **Vite dev proxy defaults to localhost** via `VITE_API_TARGET` env var. Set `VITE_API_TARGET=https://your-gcp-url.run.app` to target remote. Both `frontend/vite.config.js` and `driver-app-main/vite.config.js` use the same env var.
- **DEMO_MODE=true** (default) auto-starts simulation on backend startup. Set `DEMO_MODE=false` to prevent.
- **GEMINI_API_KEY is hardcoded** in `config.py:92`. Do not commit changes to this value.
- **No linter, formatter, or typechecker** is configured anywhere in the repo.
- **Frontend has no test infrastructure** — `package.json` has no `test` script and no test framework installed.

## Database

Default: SQLite (`supply_chain.db`). Tables auto-created and demo data auto-seeded on startup when DB is empty. Uses `StaticPool` for performance. Change via `DATABASE_URL` env var.

## Feature flags (all env vars, see `config.py`)

| Flag | Default | Effect |
|---|---|---|
| `ROUTE_USE_OSRM` | false | Use live OSRM routing vs estimated routes |
| `USE_RL_ENGINE` | true | RL-based decision engine |
| `USE_NSGA2_OPTIMIZER` | true | Multi-objective optimizer |
| `FIREBASE_ENABLED` | false | Firebase auth + services |
| `ALLOW_DEMO_SEED` | true | Seed demo data on startup |

## Deployment

- Render: `render.yaml` blueprint, `./build.sh` builds, then `uvicorn main:app --host 0.0.0.0 --port 10000`
- Docker: `Dockerfile` (python:3.11-slim, port 8000)
- GCP deployment guide: `DEPLOY_GCP_FREE.md`
- Build requires Node.js (for frontend builds via `build.sh`)

## GSD workflow

Loaded from `get-shit-done/workflows/` via `.clinerules`. Agents in `agents/`, tools in `get-shit-done/bin/gsd-tools.cjs`. Do not apply GSD workflows unless explicitly asked.

## WebSocket

Realtime operations stream at `ws://<host>/ws/operations`.

## API docs

Auto-generated Swagger UI at `http://127.0.0.1:8000/docs` when backend is running.

## Notable files

| File | Role |
|---|---|
| `main.py` | FastAPI app + all route handlers |
| `services/simulation.py` | Simulation engine + decision engine |
| `services/route_planner.py` | OSRM client + estimated route fallback |
| `services/event_ingestion.py` | Weather/news Excel workbook import |
| `seed_data.py` | Initial demo data (86 facilities, 6 drivers, 12 vehicles, 44 objectives, 3 scenarios) |
| `backend/utils/gemini_client.py` | Gemini AI integration (5 functions) |
| `config.py` | All env config + hardcoded Gemini API key |
| `database.py` | SQLAlchemy engine + `StaticPool` SQLite setup |

## Gemini integration

5 functions in `backend/utils/gemini_client.py`. Test suite: `test_gemini_integration.py`. Docs in `GEMINI_*.md` files. API key in `config.py:92`.

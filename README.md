# Resilient Essential Goods Coordination MVP

FastAPI + React prototype for disruption-aware routing of medicines, vaccines, food grain, and relief kits with SDG-linked impact metrics.

## What is included

- Admin-editable warehouses, ports, port linkages, vehicles, drivers, and objectives
- Discrete-event simulation with accelerated time and endless lane cycles
- Explainable reroute engine with `continue`, `wait`, `reroute`, and `defer dispatch` actions
- OSRM-backed route caching with estimated-route fallback when OSRM is unavailable
- Historical news and weather replay from the provided Excel datasets
- Lightweight news relevance classifier for route-impacting articles
- Driver override scoring and recommendation history
- Impact metrics for `stockouts prevented`, `critical deliveries saved`, `beneficiary locations served`, `spoilage or wastage prevented`, plus operations KPIs
- WebSocket-powered live operations dashboard

## Run the backend

```bash
python -m uvicorn main:app --reload
```

The backend defaults to `sqlite:///./supply_chain.db`. Set `DATABASE_URL` if you want PostgreSQL.

## Run the frontend in development

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies API and WebSocket traffic to `http://127.0.0.1:8000`.

## Build the frontend for FastAPI to serve

```bash
cd frontend
npm run build
```

After the build, the FastAPI app serves the compiled UI from `frontend/dist`.

## Tests

```bash
python -m pytest tests/test_simulation.py -q
```

## Notes

- On first startup, the app seeds essential-goods facilities, vehicles, drivers, and objectives, including a stockout-risk medicine corridor.
- The app also imports weather history and a sampled news replay automatically if the event tables are empty.
- If OSRM is unreachable, route templates fall back to estimated road-distance calculations so the simulation still runs.

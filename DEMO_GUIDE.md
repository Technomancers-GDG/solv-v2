# Demo Script for Judges — Resilient Essential Goods Coordinator

> **Goal:** Show a live logistics simulation where AI reroutes vehicles around real-world disruptions (weather, news, driver incidents).

---

## Pre-Demo Setup (2 min)

Run these in **3 separate terminals**:

```bash
# Terminal 1: Backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload

# Terminal 2: Admin Frontend
cd frontend
npm run dev

# Terminal 3: Driver App
cd driver-app-main
npm run dev
```

Open:
- **Admin Dashboard** → http://localhost:5173
- **Driver Mobile** → http://localhost:5174
- **Swagger API** → http://127.0.0.1:8000/docs

---

## Demo Flow (~5–7 minutes)

### 1. The World (30 sec)
**Tab:** `Map View`
- Point to the **India map** with facilities (warehouses, ports, hospitals).
- Mention: pre-seeded network of ~20+ nodes, vehicles, and active drivers.

### 2. Start the Simulation (30 sec)
**Tab:** `Live Ops` → click **Start Simulation**
- Watch vehicles move along routes in real-time on the map.
- Mention: OSRM routing with auto-fallback to estimated routes.

### 3. Inject a Disruption (1 min)
**Tab:** `Events` → **"Inject Manual Event"**
- Pick a vehicle, set type = `weather` or `accident`, severity = `high`.
- Click **Inject**.

**Tab:** `Live Ops`
- Watch the AI Decision Engine trigger:
  - Action: `reroute_to_warehouse` or `wait`
  - Justification appears in the ops log

### 4. Driver Responds (1 min)
**Screen:** Driver Mobile (localhost:5174)
- Show the pending instruction card the driver received.
- Driver taps **Accept** — the vehicle executes the AI decision.
- Driver can also **Report Incident** manually.

### 5. Compare Scenarios (1 min)
**Tab:** `Scenarios`
- Select a preset (e.g., *Cyclone on East Coast*).
- Click **Run Baseline** → see unoptimized chaos.
- Click **Run AI-Optimized** → see disruption-aware routing.
- Highlight the delta in delivery times.

### 6. Impact Dashboard (30 sec)
**Tab:** `Impact`
- Show SDG-style metrics:
  - Stockouts Prevented
  - Critical Deliveries Saved
  - Avg Response Time
- Tie it back to real-world essential-goods resilience.

---

## One-Liner Pitch

> "A disruption-aware logistics brain for India. We simulate real supply chains, ingest live weather/news data, and use an AI decision engine to reroute vehicles before stockouts happen — all visible on a live map with a driver mobile loop."

---

## Fallbacks

| If this breaks… | Do this instead |
|----------------|-----------------|
| OSRM offline | App auto-falls back to estimated routes — mention it |
| Driver app won't load | Show driver actions via Swagger `/driver/{id}/instructions` |
| Simulation stutters | Pause → Reset → Start again with speed = 1x |
| No data visible | Run `python seed_data.py` then restart backend |

# Multi-Tenant Client Portal — Implementation Plan

## Goal

Give each registered client their own **truly isolated** logistics operations dashboard — a real SaaS product experience where a logistics company signs up, uploads their fleet data, and sees THEIR specific results live, with full crash recovery and persistence.

---

## Architecture

```
SimulationManager (singleton, auto-healing, auto-saving)
├── engine[0]       → global demo (admin dashboard), filtered by client_id IS NULL
├── engine[7]       → Acme Logistics,         filtered by client_id = 7
├── engine[12]      → BigMover Logistics,     filtered by client_id = 12
└── ...
```

Each `SimulationEngine` instance:
- Loads **only** its own facilities/vehicles/drivers/objectives from DB
- Runs its **own** asyncio event loop task
- Broadcasts to its **own** WebSocket channel
- Saves state to DB every 50 ticks (~10s wall time) for crash recovery

---

## Terminology

The word "simulation" is **never exposed to the client**. The engine runs invisibly. The client portal uses:
- "Live Operations"
- "Fleet Tracking"
- "Your Operations Hub"
- "Active Fleet"
- **No** Start / Stop / Pause / Reset buttons

The client registers, uploads data, and the system **silently starts running**. On subsequent logins the dashboard **auto-resumes** without any user action.

---

## 1. Data Model Changes

### 1.1 Add `client_id` to 5 tables (nullable FK → `integration_clients.id`)

| Model | Role |
|---|---|
| `Facility` | Client's warehouses and ports |
| `Vehicle` | Client's trucks/vehicles |
| `DriverProfile` | Client's drivers |
| `Objective` | Client's shipping routes |
| `Shipment` | Client's shipments in transit |

Existing demo data keeps `client_id = NULL` (fully backward compatible).

### 1.2 Add `password_hash` to `IntegrationClient`

```python
password_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
```

Stores `pbkdf2_hmac` hash for client portal login. `NULL` for demo/API-key-only clients.

### 1.3 New table: `ClientSimulation`

```python
class ClientSimulation(Base):
    __tablename__ = "client_simulations"

    id: int                     # PK
    client_id: int              # FK → integration_clients.id, unique, indexed
    status: str                 # "idle" | "running" | "paused" | "error"
    simulation_time: datetime   # the engine's current simulation clock
    speed_multiplier: float     # default: 120
    total_ticks: int            # monotonic tick counter
    last_save_at: datetime | None
    event_queue_json: str | None      # serialized list[ScheduledEvent]
    live_states_json: str | None      # serialized dict[int, LiveVehicleState]
    created_at: datetime
    updated_at: datetime
```

---

## 2. Backend — Routes

All client portal routes live under `/api/v1/client/` with **self-contained JWT auth** (no Firebase). Uses `python-jose` (already installed) + `hashlib.pbkdf2_hmac` for password hashing (built-in, no new deps).

The existing `/api/v1/integration/` router (API-key auth) stays untouched for B2B use.

### 2.1 Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/client/register` | Public (rate-limited 5/h/IP) | Create account, return JWT + API key |
| POST | `/api/v1/client/login` | Public | Email + password → JWT |
| GET | `/api/v1/client/me` | JWT | Return client profile |

`/register` also creates the `IntegrationClient` row + generates API key + returns JWT immediately so the user can proceed to upload.

### 2.2 Data Upload

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/client/upload/facilities` | JWT | Upload facilities CSV or JSON |
| POST | `/api/v1/client/upload/vehicles` | JWT | Upload vehicles CSV or JSON |
| POST | `/api/v1/client/upload/drivers` | JWT | Upload drivers CSV or JSON |
| POST | `/api/v1/client/upload/objectives` | JWT | Upload objectives CSV or JSON |

- Accepts `Content-Type: application/json` or `Content-Type: text/csv`
- CSV is parsed, validated column-by-column, returns row-level errors
- Creates entities tagged with `client_id`
- **Auto-start trigger**: after every upload, check if all 4 categories have ≥1 record — if yes, create `ClientSimulation` and start the engine silently

### 2.3 Dashboard

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/client/dashboard` | JWT | Live dashboard data |
| GET | `/api/v1/client/key` | JWT | Return API key prefix |
| POST | `/api/v1/client/key/regenerate` | JWT | Regenerate API key (old one invalidated) |
| GET | `/ws/client` | JWT (query param) | WebSocket for live dashboard updates |

Dashboard response shape:

```json
{
  "client": { "name": "Acme Logistics", "api_key_prefix": "regc_abc" },
  "status": { "facilities": 6, "vehicles": 12, "drivers": 8, "objectives": 4 },
  "fleet": [
    { "id": 1, "identifier": "ACM-001", "status": "in_transit",
      "eta": "14:30", "current_location": "Mumbai-Pune Highway" }
  ],
  "facilities": [
    { "id": 1, "name": "Mumbai WH", "city": "Mumbai",
      "utilization_pct": 75, "inventory": 12000, "capacity": 16000 }
  ],
  "metrics": {
    "active_shipments": 3, "completed_shipments": 12,
    "on_time_delivery_pct": 87.5, "co2_saved_kg": 142.3,
    "total_api_calls": 458
  },
  "recent_decisions": [
    { "id": 1, "vehicle": "ACM-001", "action": "reroute_warehouse",
      "explanation": "Avoided port delay at Mumbai", "time": "14:05" }
  ],
  "webhook_deliveries": [
    { "id": 1, "event_type": "vehicle.status_changed",
      "status": "delivered", "attempted_at": "14:02" }
  ]
}
```

### 2.4 Admin Management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/integration/manage/clients` | Session | List all clients with counts and status |
| GET | `/api/v1/integration/manage/client/{id}` | Session | Single client detail |

Existing management router (Firebase/session auth), extended with client list.

---

## 3. SimulationManager + Multi-Tenant Engine

### 3.1 `services/simulation_manager.py`

```python
class SimulationManager:
    _engines: dict[str, SimulationEngine] = {}
    _save_task: asyncio.Task | None = None
    _lock: asyncio.Lock

    def get_or_create(self, client_id: int | None, session: Session) -> SimulationEngine
    async def start_client(self, client_id: int, session: Session)
    async def stop_client(self, client_id: int)
    async def start_all(self, session: Session)       # called on server boot
    async def stop_all(self)                           # called on shutdown
    async def save_all(self, session: Session)         # called on shutdown
    async def periodic_save_loop(self)                 # background task, sleeps 30s

simulation_manager = SimulationManager()  # singleton
```

### 3.2 Changes to `SimulationEngine`

| Aspect | Current | New |
|---|---|---|
| Constructor | No params | `__init__(self, route_planner, client_id: int, channel: str)` |
| `load_state()` | `select(Facility).all()` | `select(Facility).where(Facility.client_id.is_(client_id))` |
| Connection manager | Single global instance | Channel-aware manager, broadcasts on `channel` name |
| `start()` | Resets sim time, no save check | Loads from saved `ClientSimulation` if exists |
| `stop()` / `pause()` | Cancel task | Cancel task + `save_state()` |
| New method | — | `save_state(session)` — serialize queue + live states |
| New method | — | `restore_state(session)` — deserialize from DB |
| Metrics | Flat global counters | Per-vehicle, aggregated per-client |

### 3.3 Channel-aware ConnectionManager

```python
class ConnectionManager:
    _channels: dict[str, set[WebSocket]]

    async def connect(self, websocket: WebSocket, channel: str = "global")
    def disconnect(self, websocket: WebSocket, channel: str = "global")
    async def broadcast(self, payload: dict, channel: str = "global")
```

Global demo → channel `"global"`. Client engines → channel `"client_{id}"`.

The existing admin WebSocket endpoint `/ws/operations` connects to channel `"global"`.
New endpoint `/ws/client?token=JWT` resolves the client_id and connects to channel `"client_{id}"`.

---

## 4. State Persistence & Crash Recovery

### 4.1 Periodic saves (background)

Every 50 engine ticks (~10s real time), `_run_loop()` calls `save_state()` via `run_in_executor` (non-blocking):

```python
async def save_state(self):
    async with SessionLocal() as session:
        row = session.scalar(
            select(ClientSimulation).where(ClientSimulation.client_id == self.client_id)
        )
        if row is None:
            row = ClientSimulation(client_id=self.client_id)
            session.add(row)
        row.status = self.status
        row.simulation_time = self.simulation_time
        row.speed_multiplier = self.speed_multiplier
        row.total_ticks = self._tick_counter
        row.event_queue_json = json.dumps(
            [asdict(e) for e in self.event_queue], default=str
        )
        row.live_states_json = json.dumps(
            {k: asdict(v) for k, v in self.live_vehicle_states.items()}, default=str
        )
        row.last_save_at = datetime.now(timezone.utc)
        session.commit()
```

### 4.2 Graceful shutdown (`lifespan` yield)

```python
@asynccontextmanager
async def lifespan(app):
    _init_services()
    yield
    async with SessionLocal() as session:
        await simulation_manager.save_all(session)
    await simulation_manager.stop_all()
```

### 4.3 Server boot recovery (lifespan startup)

```python
async with SessionLocal() as session:
    for row in session.scalars(
        select(ClientSimulation).where(ClientSimulation.status.in_(["running", "paused"]))
    ):
        engine = simulation_manager.get_or_create(row.client_id, session)
        engine.restore_state(row, session)   # deserialize queue + live states
        engine.load_state(session)           # load fresh ORM entities
        if row.status == "running":
            engine._task = asyncio.create_task(engine._run_loop())
```

### 4.4 Crash recovery fallback (no saved state, e.g. hard kill)

1. Load the client's facilities / vehicles / drivers / objectives from DB (by `client_id`)
2. Build fresh state: all vehicles idle at home facilities
3. Seed dispatch queue from objectives
4. Set `simulation_time` to last known metrics snapshot time, or default start
5. Start running — client loses at most ~10s of event queue history

---

## 5. Upload Data Format (CSV & JSON)

Downloadable templates at:
- `GET /api/v1/client/templates/facilities.csv`
- `GET /api/v1/client/templates/vehicles.csv`
- `GET /api/v1/client/templates/drivers.csv`
- `GET /api/v1/client/templates/objectives.csv`

### Facilities

```
name,city,facility_type,latitude,longitude,base_capacity_units
```

| Column | Required | Notes |
|---|---|---|
| `name` | Yes | Unique per client |
| `city` | Yes | City name |
| `facility_type` | Yes | `warehouse` or `port` |
| `latitude` | Yes | Decimal degrees |
| `longitude` | Yes | Decimal degrees |
| `base_capacity_units` | No | Defaults to 10000 |

### Vehicles

```
identifier,vehicle_type,payload_capacity_units,home_facility_name,average_speed_kmph
```

| Column | Required | Notes |
|---|---|---|
| `identifier` | Yes | Unique per client, e.g. `ACM-001` |
| `vehicle_type` | No | Default `truck` |
| `payload_capacity_units` | Yes | Max cargo units |
| `home_facility_name` | Yes | Must match a facility name in this client's upload |
| `average_speed_kmph` | No | Default 48 |

### Drivers

```
name,active
```

| Column | Required | Notes |
|---|---|---|
| `name` | Yes | Unique per client |
| `active` | No | Default `true` |

### Objectives

```
name,commodity,origin_facility_name,destination_facility_name,dispatch_interval_minutes,sla_minutes,priority
```

| Column | Required | Notes |
|---|---|---|
| `name` | Yes | Unique per client |
| `commodity` | No | Default `General` |
| `origin_facility_name` | Yes | Must match a facility name |
| `destination_facility_name` | Yes | Must match a facility name |
| `dispatch_interval_minutes` | No | Default 120 |
| `sla_minutes` | No | Default 720 |
| `priority` | No | Default 1 (1-10) |

### Auto-start logic

After every upload call, the server checks:

```python
has_facilities = session.scalar(select(func.count(Facility.id)).where(Facility.client_id == cid)) > 0
has_vehicles   = session.scalar(select(func.count(Vehicle.id)).where(Vehicle.client_id == cid)) > 0
has_drivers    = session.scalar(select(func.count(DriverProfile.id)).where(DriverProfile.client_id == cid)) > 0
has_objectives = session.scalar(select(func.count(Objective.id)).where(Objective.client_id == cid)) > 0

if all([has_facilities, has_vehicles, has_drivers, has_objectives]):
    engine = simulation_manager.get_or_create(cid, session)
    if engine.status == "idle":
        await engine.start()
```

If any category is missing, the dashboard shows: `"Upload X more data categories to activate your operations."`

---

## 6. Frontend — Client Portal

### 6.1 New React files

| File | Purpose |
|---|---|
| `views/ClientPortalView.jsx` | Master route handler |
| `views/ClientRegister.jsx` | Registration form |
| `views/ClientLogin.jsx` | Login form |
| `views/ClientUploadWizard.jsx` | 4-step upload wizard |
| `views/ClientDashboard.jsx` | Live dashboard |
| `views/ClientMiniMap.jsx` | Mini leaflet map |
| `common/ClientAuthGuard.jsx` | JWT check + redirect |
| `common/clientApi.js` | Wrapper: adds `Authorization: Bearer` to all calls |

### 6.2 Routing in `App.jsx`

| Path | Component | Auth |
|---|---|---|
| `/client` | Redirect → `/client/login` | None |
| `/client/login` | `ClientLogin` | None |
| `/client/register` | `ClientRegister` | None |
| `/client/upload` | `ClientUploadWizard` | JWT required |
| `/client/dashboard` | `ClientDashboard` | JWT required |

### 6.3 Client Register (`/client/register`)

```
┌──────────────────────────────────────┐
│     Logisight — Partner Integration  │
│                                      │
│  Company Name *  [________________]  │
│  Email *         [________________]  │
│  Password *      [________________]  │
│  Company         [________________]  │
│                                      │
│  [  Get API Access & Start  ]        │
│                                      │
│  Already registered?  Log in →       │
└──────────────────────────────────────┘
```

After submit: success page showing the API key in a green banner with copy button + "Your key will not be shown again — save it now." Then auto-redirect to `/client/upload`.

### 6.4 Client Login (`/client/login`)

Email + password. On success stores JWT in localStorage, redirects to `/client/dashboard` (or `/client/upload` if data incomplete).

### 6.5 Upload Wizard (`/client/upload`)

Shows 4 upload tiles in a grid, each with:
- Title + icon
- Download template link
- Drag-and-drop zone (CSV) or paste JSON area
- Preview table after parsing
- Row-level validation errors
- Import button → calls backend → shows success count
- Green checkmark when done

Progress bar at top: `[✓ Facilities] [─ Vehicles] [─ Drivers] [─ Objectives]`

After all 4 are complete: auto-redirect to `/client/dashboard` with a toast: "Your operations are now live!"

### 6.6 Dashboard (`/client/dashboard`)

```
┌──────────────────────────────────────────────────────────┐
│ 🔌 Logisight — Acme Logistics                   [Logout] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌──────────────┐│
│  │ 📦 6 │ │ 🚛 12│ │ 👤 8 │ │ 📋 4   │ │ ✅ 87% on-   ││
│  │Fac.  │ │Veh.  │ │Driv. │ │Routes  │ │time delivery ││
│  └──────┘ └──────┘ └──────┘ └────────┘ └──────────────┘│
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │  🗺️  Live Fleet Map                                 ││
│  │                                                       ││
│  │  ┌───────────────────────────────────────────────┐   ││
│  │  │  [Mumbai WH]━ ━ ━[ACM-001]━ ━ ━[Delhi CS]   │   ││
│  │  │        ●━━━━━━━━━●━━━━━━━━━━━━━━━●           │   ││
│  │  │    ● Pune    ● Nashik       ● Delhi            │   ││
│  │  └───────────────────────────────────────────────┘   ││
│  └──────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─ Fleet Status ────────────────────────────────────┐   │
│  │ ID       │ Status       │ From → To       │ ETA   │   │
│  ├─────────┼──────────────┼─────────────────┼───────┤   │
│  │ ACM-001  │ 🟢 In Transit│ Mumbai→Delhi    │ 14:30 │   │
│  │ ACM-002  │ 🟡 Loading    │ Mumbai WH      │ —     │   │
│  │ ACM-003  │ ⚪ Idle       │ Delhi CS       │ —     │   │
│  └──────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─ Recent Activity ─────────────────────────────────┐   │
│  │ 🚛 ACM-001 dispatched → Delhi Cold Storage  14:05 │   │
│  │ 📦 ACM-002 loaded at Mumbai Warehouse        13:45 │   │
│  │ ⚠️ Inventory: Delhi CS below 20%            13:30 │   │
│  │ 🔄 ACM-001 rerouted (avoided port delay)    13:15 │   │
│  └──────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─ Integration Settings ────────────────────────────┐   │
│  │ API Key:  regc_a9f3...                [Regenerate] │   │
│  │ Webhooks: 2 active                     [+ New]     │   │
│  │ Delivery Log: last 20 deliveries                  │   │
│  │                                                     │   │
│  │ Quick Test:                                         │   │
│  │ curl -H "X-API-Key: regc_..." https://.../status   │   │
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 6.7 Mini-map details

- Client's facilities as colored markers (warehouse = blue, port = teal)
- Client's vehicles as moving markers with status icons:
  - 🟢 Green arrow = in_transit
  - 🟡 Yellow = loading
  - ⚪ Gray = idle
- Route lines between origin→destination facilities
- City labels for cities in the client's operations
- Grayed-out context markers for nearby major cities/ports that provide geographic reference
- Tooltip on hover: facility name + inventory, or vehicle identifier + ETA

Uses same `react-leaflet` stack as the admin `MapView`. Extracted into its own simplified component.

### 6.8 WebSocket for live updates

```javascript
const wsBase = import.meta.env.VITE_WS_BASE_URL || `ws://${location.host}`;
function connectDashboardWs(token, clientId) {
  const socket = new WebSocket(`${wsBase}/ws/client?token=${token}`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "simulation_snapshot") {  // internal name, not shown to user
      updateDashboard(data.payload);
    }
  };

  socket.onclose = () => setTimeout(() => connectDashboardWs(token, clientId), 3000);
}
```

Same auto-reconnect pattern as the admin dashboard.

---

## 7. Admin Developer Page Enhancement

The existing `IntegrationView.jsx` (the "Developer" page) adds:

- **Client List** table:

| Name | API Key Prefix | Status | Facilities | Vehicles | Drivers | Objectives | Created |
|---|---|---|---|---|---|---|---|
| Acme Logistics | `regc_a9f` | 🟢 Active | 6 | 12 | 8 | 4 | 2026-06-14 |
| Demo Client | `regc_126` | 🟢 Active | 78 | 260 | 160 | 34 | 2026-06-01 |

- **"Open Portal"** button → opens `/client/login` in a new tab
- **"Register New Client"** button → opens `/client/register` in a new tab

---

## 8. Landing Page CTA

The existing `LandingView.jsx` gets a new section:
- **"For Logistics Partners"** with "Integrate Your Fleet" button
- Links to `/client/register`
- Brief bullet points:
  - Upload your facilities and fleet
  - Track your operations in real-time
  - Integrate via REST API + Webhooks
  - AI-powered route optimization

---

## Implementation Order

| # | Step | Files | Est. Time |
|---|---|---|---|
| 1 | Add `client_id` columns to 5 models | `models.py` | 30 min |
| 2 | Add `password_hash` + `ClientSimulation` table | `models.py` | 15 min |
| 3 | Registration + login endpoints + JWT middleware | `routes/client.py`, `schemas/client.py`, `middleware/client_auth.py` | 1.5 hr |
| 4 | Upload endpoints (CSV + JSON) | `routes/client.py`, `services/client_upload.py` | 2 hr |
| 5 | `SimulationManager` + multi-tenant engine refactor | `services/simulation_manager.py`, changes to `engine.py`, `app_state.py` | 3 hr |
| 6 | Channel-aware ConnectionManager | `services/simulation/connection_manager.py` | 30 min |
| 7 | Client dashboard endpoint + WebSocket | `routes/client.py` | 1 hr |
| 8 | State persistence (periodic save + boot restore + shutdown) | `engine.py`, `simulation_manager.py`, `main.py` | 2 hr |
| 9 | Frontend: ClientLogin + ClientRegister | `ClientLogin.jsx`, `ClientRegister.jsx`, `clientApi.js` | 1.5 hr |
| 10 | Frontend: ClientUploadWizard | `ClientUploadWizard.jsx` | 2 hr |
| 11 | Frontend: ClientDashboard + ClientMiniMap | `ClientDashboard.jsx`, `ClientMiniMap.jsx` | 3 hr |
| 12 | Admin Developer page client list | `IntegrationView.jsx` | 30 min |
| 13 | Landing page "For Partners" CTA | `LandingView.jsx` | 30 min |
| 14 | End-to-end testing + polish | — | 2 hr |
| | **Total** | | **~20 hrs** |

---

## Edge Cases & Assumptions

| Concern | Solution |
|---|---|
| Upload validation errors | Return per-row/column errors, nothing committed |
| No webhooks configured | Show "No webhooks — create one to receive event notifications" |
| Engine crashes | `_run_loop` catches exceptions, sets `status = "error"`, logs error. Background health-check restarts errored engines. |
| Duplicate facility/vehicle names | Per-client uniqueness check; reject with clear error |
| Demo data vs client data isolation | Fully isolated by `client_id` — demo has `NULL`, client has their own ID |
| Password reset | Not MVP — admin can reset from Developer page if needed |
| Client logs in, uploads, comes back later | Dashboard live with their data — engine auto-resumed |
| WebSocket reconnection | Exponential backoff, same pattern as admin dashboard |
| Server hard kill (no graceful save) | Vehicle/facility status from DB (committed each tick). Rebuild event queue from objectives. ~10s of state loss max. |

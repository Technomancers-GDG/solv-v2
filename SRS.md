# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Autonomous Multimodal Disaster Logistics Digital Twin & Coordinator
### Project Codename: Resilient Essential Goods Coordinator (REGC / Solv-v2)

---

**Standard:** ISO/IEC/IEEE 29148:2018 & IEEE Std 830-1998  
**Document Version:** 2.0-Production  
**Domain:** Disaster Supply Chain Management, Autonomous Multi-Agent Logistics, Humanitarian Logistics, Edge AI  
**Target Environment:** Web Command Center, Driver Mobile Edge PWA, Containerized Microservices  

---

## TABLE OF CONTENTS
1. [Executive Summary & System Scope](#1-executive-summary--system-scope)
2. [Stakeholder Profiles, User Personas & RBAC](#2-stakeholder-profiles-user-personas--rbac)
3. [System Architecture & Data Flow (C4 Model)](#3-system-architecture--data-flow-c4-model)
4. [Data Dictionary & Database Schema (SQL DDL & ERD)](#4-data-dictionary--database-schema)
5. [Detailed Functional Requirements (FR-1 to FR-12)](#5-detailed-functional-requirements)
6. [Mathematical Formulations & Algorithmic Specifications](#6-mathematical-formulations--algorithmic-specifications)
7. [External Interface & API Specifications](#7-external-interface--api-specifications)
8. [Non-Functional Requirements (NFRs)](#8-non-functional-requirements-nfrs)
9. [System State Machines & Sequence Flows](#9-system-state-machines--sequence-flows)
10. [UI/UX Screen Blueprint & Interaction Specifications](#10-uiux-screen-blueprint--interaction-specifications)
11. [Hackathon Execution & Judge Defense Guide](#11-hackathon-execution--judge-defense-guide)

---

## 1. Executive Summary & System Scope

### 1.1 Problem Statement
During severe humanitarian crises and natural disasters (e.g., monsoon floods, cyclones, landslides, infrastructure collapse), standard supply chain routing collapses. Critical essential goods—such as **temperature-sensitive pharmaceuticals (insulin, vaccines), blood units, potable water, and emergency food rations**—fail to reach vulnerable populations due to three critical bottlenecks:
1. **Siloed & Delayed Disruption Sensing**: News feeds and weather alerts exist in unstructured formats, delaying disaster recognition by hours.
2. **Static & Fragile Routing**: Traditional routing tools (e.g., standard GPS navigation) optimize solely for nominal travel time, ignoring dynamic road closures, safety hazards, port spillover capacities, and hospital stockout urgencies.
3. **Disconnected Edge Operations**: Field drivers frequently lose cellular connectivity in disaster zones and lack clear, human-understandable guidance to execute critical detours safely.

### 1.2 Proposed Solution
The **Resilient Essential Goods Coordinator** is an autonomous, cyber-physical digital twin and decision intelligence platform that unifies:
- **Multimodal Transportation Graphs**: Integrating road networks (OSRM), coastal maritime port links, and emergency distribution hubs into a single topological graph.
- **Unstructured Signal Fusion (Gemini LLM)**: Ingesting multimodal news articles, weather sensor readings, and driver ground reports to automatically generate geofenced hazard polygons.
- **Deep Reinforcement Learning (DQN) & Multi-Objective Optimization**: Autonomously balancing travel time, operational financial cost, carbon emissions ($CO_2$), and critical hospital stockout penalties to issue rerouting, port diversion, and holding orders.
- **Driver Edge Loop (PWA)**: Translating complex AI rerouting decisions into 2-sentence human explanations, supporting 1-tap accept/reject decisions, offline-first incident reporting, and telemetry sync.
- **Cryptographic Audit Ledger**: Guaranteeing tamper-proof SHA-256 hash chaining of all logistical decisions for regulatory transparency and humanitarian auditability.

### 1.3 UN Sustainable Development Goals (SDG) Alignment
```
┌─────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ UN SDG Goal             │ System Contribution Metric                                             │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ SDG 3: Good Health      │ Zero-stockout guarantee for life-saving medicine (insulin, vaccines)   │
│ SDG 9: Resilient Infra  │ Autonomous bypass of destroyed highway corridors via multimodal ports   │
│ SDG 11: Sustainable City│ Fast disaster recovery through dynamic emergency relief routing        │
│ SDG 12: Sustainable Use │ Reduction of fuel waste and perishable cold-chain spoilage by >30%     │
└─────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stakeholder Profiles, User Personas & RBAC

### 2.1 Personas
```
┌───────────────────────────────────┬───────────────────────────────────┬───────────────────────────────────┐
│ Persona 1: Commander Maya         │ Persona 2: Logistics Lead Rajesh  │ Persona 3: Relief Driver Amit     │
│ (Disaster Response Director)      │ (Warehouse Operations Lead)       │ (Heavy Cargo Field Driver)        │
├───────────────────────────────────┼───────────────────────────────────┼───────────────────────────────────┤
│ Goal: High-level overview of      │ Goal: Prevent facility stockouts, │ Goal: Safely deliver cargo without│
│ national relief flow, run disaster│ monitor truck dock queues, manage │ getting stranded in floodwaters;  │
│ simulations, approve policy flags.│ intermodal maritime transfers.    │ clear, offline-friendly guidance. │
│ Tool: Admin Command Center (Web)  │ Tool: Live Ops & Inventory Console│ Tool: Driver Mobile PWA (In-Cab)  │
└───────────────────────────────────┴───────────────────────────────────┴───────────────────────────────────┘
```

### 2.2 Role-Based Access Control (RBAC) Matrix
| Feature / Operation | Admin Commander | Dispatcher | Relief Driver | API Client | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|
| Start/Pause/Reset Simulation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Trigger Scenario Disruption | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manual Recommendation Override | ✅ | ✅ | ❌ | ❌ | ❌ |
| Accept / Reject Driver Decision | ❌ | ❌ | ✅ | ❌ | ❌ |
| Submit Road Incident / Hazard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ingest B2B Waybill via API | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Cryptographic Audit Ledger | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## 3. System Architecture & Data Flow (C4 Model)

### 3.1 System Context (Level 1)
```
  ┌───────────────────────┐             ┌────────────────────────┐
  │ Emergency News Feeds  │             │ Global Weather Telemetry│
  │ (Tabular / RSS / Web) │             │ (Precipitation / Wind) │
  └──────────┬────────────┘             └───────────┬────────────┘
             │                                      │
             └──────────────────┬───────────────────┘
                                │
                                ▼
  ┌──────────────────────────────────────────────────────────────┐
  │         RESILIENT ESSENTIAL GOODS COORDINATOR (REGC)         │
  │  - Digital Twin Simulation Engine   - Hybrid RL/LLM Engine   │
  │  - Multimodal Routing Graph         - SHA-256 Audit Ledger   │
  └─────────────────────────────┬────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ Admin Command │       │ Driver Mobile │       │ External B2B  │
│ Center (Web)  │       │ Edge App (PWA)│       │ Clients (APIs)│
└───────────────┘       └───────────────┘       └───────────────┘
```

### 3.2 Container Architecture (Level 2)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FRONTEND CONTAINERS                                        │
│  ┌───────────────────────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Admin Dashboard (React 18 + Vite + Leaflet)   │  │ Driver Mobile PWA (React 18 + IndexedDB)│  │
│  │ Port: 5173 | WebSocket Client (/ws/operations)│  │ Port: 5174 | Service Worker Offline Sync│  │
│  └───────────────────────────────────────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────┬─────────────────────────────────────────┬──────────────────────┘
                                  │ HTTP REST / WebSocket                   │ HTTP REST / Offline Sync
                                  ▼                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND APPLICATION CONTAINER                                  │
│  FastAPI (Python 3.11, AsyncIO, Uvicorn on Port 8000)                                            │
│                                                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ Simulation Tick Engine │  │ Event Ingestion Engine │  │ Multimodal Graph & Routing Engine  │  │
│  │ - Time acceleration   │  │ - Excel / News RSS      │  │ - OSRM Road Router                 │  │
│  │ - Dynamic kinematics   │  │ - Gemini 2.5 NLP Fusion │  │ - Maritime Coastal Sea Links       │  │
│  └────────────────────────┘  └────────────────────────┘  │ - Topological Fallback Solver      │  │
│  ┌────────────────────────┐  ┌────────────────────────┐  └────────────────────────────────────┘  │
│  │ Hybrid Decision Engine │  │ Driver Edge Service    │  ┌────────────────────────────────────┐  │
│  │ - PyTorch DQN Agent    │  │ - LLM Plaintext alerts │  │ Cryptographic Audit Engine         │  │
│  │ - Pareto MOO Solver    │  │ - Incident Ingestion   │  │ - SHA-256 Linked Ledger            │  │
│  └────────────────────────┘  └────────────────────────┘  └────────────────────────────────────┘  │
└──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     PERSISTENCE CONTAINER                                        │
│  SQLAlchemy 2.0 Core ORM | SQLite (`supply_chain.db`) / PostgreSQL 15 Engine                     │
│  - Spatial Facilities & Intermodal Nodes  - Vehicle & Driver Profiles                            │
│  - Active Shipment Lifecycles             - Immutable Hash Ledger Records                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Dictionary & Database Schema

```
┌──────────────────┐       1..* ┌──────────────────┐       1..* ┌──────────────────┐
│    facilities    │───────────▶│    objectives    │◀───────────│     vehicles     │
│  (Warehouses &   │            │  (Supply Tasks   │            │ (Fleet Telemetry │
│   Coastal Ports) │            │   & Commodities) │            │  & Kinematics)   │
└────────┬─────────┘            └──────────────────┘            └────────┬─────────┘
         │ 1..*                                                          │ 1..1
         ▼                                                               ▼
┌──────────────────┐       1..* ┌──────────────────┐            ┌──────────────────┐
│    port_links    │            │ recommendations  │            │ driver_profiles  │
│ (Maritime Inter- │            │  (AI Reroute &   │            │ (Driver Metrics, │
│  modal Links)    │            │   Audit Records) │            │  Bias & History) │
└──────────────────┘            └────────┬─────────┘            └────────┬─────────┘
                                         │ 1..*                          │ 1..*
                                         ▼                               ▼
                                ┌──────────────────┐            ┌──────────────────┐
                                │ driver_decisions │◀───────────│ driver_incidents │
                                │ (Acks & Feedback │            │ (Ground Hazard   │
                                │  for RL Reward)  │            │  Event Reports)  │
                                └──────────────────┘            └──────────────────┘
```

### 4.1 SQL Schema Specification (DDL)

```sql
-- 1. Multimodal Facilities & Warehouses
CREATE TABLE facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,
    client_id INTEGER NULL REFERENCES integration_clients(id),
    city VARCHAR(80) NOT NULL,
    facility_type VARCHAR(40) NOT NULL CHECK (facility_type IN ('warehouse', 'port', 'hospital', 'relief_center', 'hub')),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    base_capacity_units INTEGER NOT NULL,
    current_inventory_units INTEGER DEFAULT 0,
    initial_inventory_units INTEGER DEFAULT 0,
    queue_capacity_units INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Maritime Intermodal Links
CREATE TABLE port_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER NOT NULL REFERENCES facilities(id),
    port_id INTEGER NOT NULL REFERENCES facilities(id),
    reserved_capacity_units INTEGER DEFAULT 0,
    spillover_threshold_pct FLOAT DEFAULT 80.0,
    max_spillover_units INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1
);

-- 3. Driver Profiles & Behavioral Biases
CREATE TABLE driver_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,
    client_id INTEGER NULL REFERENCES integration_clients(id),
    override_rating FLOAT DEFAULT 1.0,
    confidence FLOAT DEFAULT 0.5,
    accept_recommendation_bias FLOAT DEFAULT 0.5,
    active BOOLEAN DEFAULT 1
);

-- 4. Vehicle Fleet & Telemetry State
CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier VARCHAR(80) NOT NULL,
    client_id INTEGER NULL REFERENCES integration_clients(id),
    vehicle_type VARCHAR(40) DEFAULT 'truck' CHECK (vehicle_type IN ('truck', 'refrigerated_van', 'cargo_boat', 'drone')),
    payload_capacity_units INTEGER NOT NULL,
    home_facility_id INTEGER NOT NULL REFERENCES facilities(id),
    current_facility_id INTEGER NULL REFERENCES facilities(id),
    driver_profile_id INTEGER NOT NULL REFERENCES driver_profiles(id),
    default_objective_id INTEGER NULL REFERENCES objectives(id),
    average_speed_kmph FLOAT DEFAULT 48.0,
    emission_kg_per_km FLOAT DEFAULT 1.6,
    rest_every_hours FLOAT DEFAULT 8.0,
    rest_duration_minutes INTEGER DEFAULT 45,
    status VARCHAR(40) DEFAULT 'idle' CHECK (status IN ('idle', 'loading', 'in_transit', 'holding', 'unloading', 'breakdown')),
    available_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Delivery Objectives & Supply Commodities
CREATE TABLE objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,
    client_id INTEGER NULL REFERENCES integration_clients(id),
    commodity VARCHAR(80) NOT NULL CHECK (commodity IN ('medicine', 'vaccines', 'food_rations', 'potable_water', 'fuel', 'equipment')),
    origin_facility_id INTEGER NOT NULL REFERENCES facilities(id),
    destination_facility_id INTEGER NOT NULL REFERENCES facilities(id),
    dispatch_interval_minutes INTEGER DEFAULT 120,
    loading_duration_minutes INTEGER DEFAULT 30,
    unloading_duration_minutes INTEGER DEFAULT 35,
    sla_minutes INTEGER DEFAULT 720,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    assigned_vehicle_ids JSON DEFAULT '[]',
    fallback_facility_ids JSON DEFAULT '[]',
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ingested Disruption & Disaster News Events
CREATE TABLE news_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_date DATE NOT NULL,
    simulation_date DATE NOT NULL,
    city VARCHAR(80) NOT NULL,
    category VARCHAR(80) NOT NULL,
    headline TEXT NOT NULL,
    relevant BOOLEAN DEFAULT 0,
    impact_type VARCHAR(80) DEFAULT 'none',
    impact_score FLOAT DEFAULT 0.0,
    model_probability FLOAT DEFAULT 0.0
);

-- 7. Autonomous AI Recommendations & Policy Output
CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    simulation_time TIMESTAMP NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    objective_id INTEGER NOT NULL REFERENCES objectives(id),
    current_facility_id INTEGER NULL REFERENCES facilities(id),
    original_destination_id INTEGER NOT NULL REFERENCES facilities(id),
    recommended_destination_id INTEGER NULL REFERENCES facilities(id),
    action VARCHAR(80) NOT NULL CHECK (action IN ('continue', 'reroute_warehouse', 'reroute_port', 'hold_safe', 'defer_dispatch')),
    explanation TEXT NOT NULL,
    structured_explanation JSON DEFAULT '{}',
    counterfactual TEXT DEFAULT '',
    score_breakdown JSON DEFAULT '{}',
    baseline_cost FLOAT DEFAULT 0.0,
    recommended_cost FLOAT DEFAULT 0.0,
    financial_impact_usd FLOAT DEFAULT 0.0,
    status VARCHAR(40) DEFAULT 'suggested',
    confidence FLOAT DEFAULT 0.5
);

-- 8. Driver Acknowledgment & Ground Decision Feedback
CREATE TABLE driver_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decided_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id),
    driver_profile_id INTEGER NOT NULL REFERENCES driver_profiles(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    decision VARCHAR(40) NOT NULL CHECK (decision IN ('accept', 'reject', 'timeout')),
    actual_trip_cost FLOAT DEFAULT 0.0,
    recommended_trip_cost FLOAT DEFAULT 0.0,
    rating_delta FLOAT DEFAULT 0.0,
    note TEXT DEFAULT ''
);

-- 9. Driver Field Ground Incident Injections
CREATE TABLE driver_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    driver_profile_id INTEGER NOT NULL REFERENCES driver_profiles(id),
    vehicle_id INTEGER NULL REFERENCES vehicles(id),
    city VARCHAR(80) NOT NULL,
    incident_type VARCHAR(80) NOT NULL,
    severity FLOAT DEFAULT 0.6,
    note TEXT DEFAULT '',
    linked_news_event_id INTEGER NULL REFERENCES news_events(id)
);
```

---

## 5. Detailed Functional Requirements

### FR-1: Multimodal Spatial Network & Inventory Twin
* **Description**: The system must maintain a living digital twin of the national logistics network, modeling warehouses, hospitals, maritime ports, inventory levels, and consumption rates.
* **Inputs**: Facility geographic locations, capacity thresholds, live stock counts, vehicle speed characteristics.
* **Processing**:
  1. On each tick $t$, calculate stock consumption at destination relief centers:
     $$\text{Stock}_{dest}(t + \Delta t) = \text{Stock}_{dest}(t) - \kappa_{commodity} \cdot \Delta t$$
  2. When vehicles arrive at destination facilities, execute atomic unloading transactions and increment inventory units.
  3. Detect stockout conditions: $\text{Stock}_{dest}(t) \le 0.15 \times \text{BaseCapacity}_{dest} \implies \text{CRITICAL\_STOCKOUT\_ALERT}$.
* **Outputs**: Updated facility entity records, inventory pressure metrics.
* **Acceptance Criteria**: Stock decreases strictly monotonically relative to consumption rates; inventory overflow beyond queue capacity is prevented.

### FR-2: Unstructured Disruption Ingestion & Gemini AI Fusion
* **Description**: Parse raw disaster news headlines, weather streams, and field reports into structured geospatial hazard events.
* **Inputs**: Unstructured text string (e.g. *"NH-48 flooded near Kolhapur following 180mm torrential rainfall; traffic halted"*).
* **Processing**:
  1. Forward headline to Google Gemini API using structured JSON schema response.
  2. Extract: `disruption_type`, `severity_score` (0.0 to 1.0), `city`, `estimated_radius_km`, and `driver_plain_text_message`.
  3. Create an active circular hazard geofence:
     $$\mathcal{H} = \{ (lat, lng) \mid \text{dist}((lat, lng), (lat_c, lng_c)) \le R_{hazard} \}$$
  4. **Fallback Handling**: If Gemini API latency $>1500\text{ms}$ or HTTP error occurs, trigger regex dictionary classifier (e.g., regex `/(flood|cyclone|landslide|blocked)/i`) and assign default radius of $30\text{ km}$.
* **Outputs**: `news_events` record, active hazard polygon broadcast over WebSocket.
* **Acceptance Criteria**: Valid JSON extracted for 100% of inputs; zero system freezes during external API outages.

### FR-3: Multimodal Hybrid Routing Engine
* **Description**: Compute the optimal physical navigation path across road and maritime networks.
* **Inputs**: Origin coordinates $(lat_o, lng_o)$, Destination coordinates $(lat_d, lng_d)$, active hazard polygons $\{\mathcal{H}_i\}$.
* **Processing**:
  1. Send request to OSRM `/route/v1/driving` API to fetch road polylines, segment durations, and distances.
  2. If the primary route polyline intersects any active critical hazard polygon $\mathcal{H}_{crit}$, request OSRM route with waypoint detour bypass.
  3. If destination is coastal or road routes are impassable, compute intermodal route:
     $$\text{Origin} \xrightarrow{\text{Truck}} \text{Port}_A \xrightarrow{\text{Cargo Ship}} \text{Port}_B \xrightarrow{\text{Truck}} \text{Destination}$$
  4. **Fallback Handling**: If OSRM server fails, compute great-circle Haversine path with empirical road tortuosity factor ($\tau = 1.28$).
* **Outputs**: Encoded polyline string, distance in kilometers, estimated duration in minutes.
* **Acceptance Criteria**: Fallback triggers in $\le 10\text{ms}$ upon OSRM timeout; zero routes return empty polylines.

### FR-4: Deep Q-Learning (DQN) & Multi-Objective Decision Engine
* **Description**: Autonomously evaluate at-risk shipments and select the optimal mitigation action.
* **Inputs**: 10-dimensional State Vector $\mathbf{s} \in \mathbb{R}^{10}$.
* **Action Space**:
  $$\mathcal{A} = \{\text{CONTINUE}, \text{REROUTE\_WAREHOUSE}, \text{REROUTE\_PORT}, \text{HOLD\_SAFE}, \text{DEFER\_DISPATCH}\}$$
* **Processing**:
  1. Forward $\mathbf{s}$ through PyTorch DQN neural network to compute $Q(\mathbf{s}, a; \theta)$.
  2. Evaluate action utility via Multi-Objective Optimization (MOO) function:
     $$U(a) = - \left( w_1 \Delta \text{Time} + w_2 \Delta \text{Cost} + w_3 \Delta \text{CO}_2 + w_4 \cdot \text{StockoutRisk} \right)$$
  3. Select action $a^* = \arg\max_{a \in \mathcal{A}} [ \alpha Q(\mathbf{s}, a) + (1-\alpha) U(a) ]$.
  4. Generate counterfactual explanation: *"If the vehicle continued on the baseline route, it would incur a 340-minute flood delay and risk medicine spoilage."*
* **Outputs**: `recommendations` table row, AI alert payload.
* **Acceptance Criteria**: $100\%$ of generated recommendations contain non-empty counterfactual explanations and positive confidence metrics ($>0.5$).

### FR-5: Discrete-Event Time-Warp Simulation Engine
* **Description**: Execute a continuous time-stepped simulation of national freight operations.
* **Inputs**: Speed multiplier parameter ($1\times$ to $500\times$), simulation clock state.
* **Processing**:
  1. Run discrete ticks at $\Delta t_{tick} = 1.0\text{ real second} \times \text{SpeedMultiplier}$.
  2. Update vehicle position along active polyline:
     $$d_{traveled} = v_{avg} \cdot \Delta t_{tick}$$
  3. Compute fuel depletion and carbon emissions:
     $$CO_{2, produced} = d_{traveled} \times \text{EmissionFactor}_{vehicle}$$
  4. Trigger scheduled dispatch events from the event priority queue.
* **Outputs**: Updated coordinates for all active vehicles, aggregated network metrics snapshot.
* **Acceptance Criteria**: State tick calculation time $\le 50\text{ms}$ for $500$ concurrent vehicles.

### FR-6: Real-Time Full-Duplex Telemetry Streaming
* **Description**: Broadcast real-time system state to all connected dashboard operators.
* **Inputs**: Active WebSocket client connections at `/ws/operations`.
* **Processing**:
  1. Serialize global state into unified JSON payload at $1\text{ Hz}$.
  2. Include: Active vehicles (lat/lng, speed, status, payload), Facilities (stock, queue), Active Hazards, Latest Recommendations.
  3. Drop slow or disconnected sockets gracefully without blocking the simulation loop.
* **Outputs**: Streaming JSON WebSocket frames.
* **Acceptance Criteria**: Telemetry message delivery latency $\le 100\text{ms}$ across local networks.

### FR-7: Driver Mobile Edge Loop (PWA) & Offline Sync
* **Description**: Provide in-cab guidance to relief drivers with offline-first synchronization.
* **Inputs**: Driver ID, user interaction clicks (Accept/Reject), ground incident forms.
* **Processing**:
  1. Display active mission route on mobile Leaflet canvas.
  2. When an AI recommendation arrives, display plain-language prompt with accept/reject buttons.
  3. Store driver responses and new incident reports in browser IndexedDB if client is offline.
  4. Upon network reconnection, push queued reports to `POST /api/driver/incidents` and `POST /api/driver/decision`.
* **Outputs**: Instant driver decision acknowledgments, centralized incident generation.
* **Acceptance Criteria**: Zero data loss during complete network blackout; queued requests sync within $3\text{ seconds}$ of reconnection.

### FR-8: Dynamic Inventory Rebalancing & Shortage Forecasting
* **Description**: Detect impending stockouts across disaster relief facilities and schedule replenishment dispatches.
* **Inputs**: Historical consumption logs, target facility buffer levels.
* **Processing**:
  1. Compute time-to-stockout (TTS):
     $$\text{TTS} = \frac{\text{CurrentStock}}{\text{ConsumptionRate}}$$
  2. If $\text{TTS} < \text{SLA}_{threshold}$, search for nearest donor warehouse with excess capacity ($>120\%$ base stock).
  3. Automatically construct a high-priority Objective and reserve vehicles for emergency dispatch.
* **Outputs**: New emergency `Objective` and route template.
* **Acceptance Criteria**: Emergency objectives created within 2 ticks of TTS breaching threshold.

### FR-9: Scenario Sandbox & Baseline vs. AI Benchmarking
* **Description**: Allow operators to stress-test logistics networks under synthetic disaster scenarios and generate comparative evaluation reports.
* **Inputs**: Scenario keys: `monsoon_flood_kolhapur`, `cyclone_biparjoy_gujarat`, `landslide_western_ghats`.
* **Processing**:
  1. Fork the simulation state into two parallel tracking pipelines:
     - **Baseline Pipeline**: Vehicles follow static standard routes without rerouting.
     - **AI Coordinator Pipeline**: Dynamic AI rerouting and multimodal diversion.
  2. Aggregate cumulative performance metrics: On-time delivery rate ($\%$) and stockout hours.
* **Outputs**: Side-by-side delta KPI comparison JSON.
* **Acceptance Criteria**: Comparative report provides exact percentage deltas for stockouts prevented, carbon saved, and delivery time saved.

### FR-10: Cryptographic Audit Ledger (SHA-256 Chaining)
* **Description**: Create an immutable, tamper-evident audit record of every algorithmic decision.
* **Inputs**: Recommendation payload, Driver decision response, Timestamp.
* **Processing**:
  1. Construct block payload:
     $$B_k = \{\text{Index } k, \text{Timestamp } T_k, \text{VehicleId } V_k, \text{Action } A_k, \text{Hash}_{k-1}\}$$
  2. Compute SHA-256 block hash:
     $$\text{Hash}_k = \text{SHA256}(\text{CanonicalJSON}(B_k))$$
  3. Append to disk ledger (`blockchain_ledger.json`).
  4. Provide verification endpoint `/api/audit/verify` that re-hashes the chain from genesis block to confirm ledger integrity.
* **Outputs**: Verified immutable audit block.
* **Acceptance Criteria**: Any single character modification in historical decision logs triggers chain invalidation during audit verification.

### FR-11: B2B Enterprise Client Gateway & Webhook Engine
* **Description**: Enable third-party hospitals, NGOs, and logistics carriers to securely interface with the coordinator.
* **Inputs**: API Key Bearer Tokens (`Bearer solv_live_...`), external waybill payloads.
* **Processing**:
  1. Hash incoming API key using SHA-256 and validate against `integration_clients`.
  2. Enforce per-client rate limiting (1000 requests/minute).
  3. Dispatch HTTP POST webhooks to subscribed client URLs on shipment state transitions (`shipment.rerouted`, `shipment.delivered`).
* **Outputs**: Validated API responses, HMAC-signed webhook deliveries.
* **Acceptance Criteria**: Unauthorized requests rejected with HTTP 401; webhooks automatically retry up to 3 times with exponential backoff upon 5xx errors.

### FR-12: Real-time SDG Impact & Carbon/Cost KPI Engine
* **Description**: Quantify the real-world humanitarian and environmental impact of AI decisions.
* **Inputs**: Cumulative distance saved, idle minutes avoided, critical medical deliveries completed.
* **Processing**:
  1. Compute CO2 savings:
     $$\Delta CO_2 = (d_{\text{baseline}} - d_{\text{actual}}) \times 1.6\text{ kg/km} + \Delta t_{\text{idle}} \times 0.04\text{ kg/min}$$
  2. Compute Medical Delivery SLA Fulfillment:
     $$\text{SLA}_{med} = \frac{\text{Completed Medical Objectives within SLA}}{\text{Total Medical Objectives}} \times 100\%$$
* **Outputs**: Metrics snapshot records, SDG dashboard progress indicators.
* **Acceptance Criteria**: SDG metrics updated on every completed mission without arithmetic drift.

---

## 6. Mathematical Formulations & Algorithmic Specifications

### 6.1 State Vector Normalization ($\mathbf{s} \in \mathbb{R}^{10}$)
To feed into the Deep Q-Network, raw operational metrics are mapped to continuous normalized intervals $[0, 1]$:
```
┌─────────────────────────┬──────────────────────────────────┬──────────────────────────────────────┐
│ Dimension               │ Variable Name                    │ Mathematical Definition              │
├─────────────────────────┼──────────────────────────────────┼──────────────────────────────────────┤
│ $s_0$: Utilization      │ `utilization_norm`               │ $\text{CurrentStock} / \text{Cap}$   │
│ $s_1$: Route Risk       │ `route_risk`                     │ $\max_{e \in \text{Route}} \text{Risk}(e)$ │
│ $s_2$: ETA Multiplier   │ `eta_multiplier_norm`            │ $\min(2.0, \text{ETA\_Mult} - 1.0)$   │
│ $s_3$: SLA Urgency      │ `sla_urgency`                    │ $\text{ElapsedMinutes} / \text{SLA}$ │
│ $s_4$: Payload Fill     │ `payload_norm`                   │ $\text{PayloadUnits} / \text{Cap}$   │
│ $s_5$: Priority Weight  │ `priority_norm`                  │ $\text{Priority} / 5.0$              │
│ $s_6$: Port Spillover   │ `port_pressure`                  │ $\text{PortOccupancy} / \text{Cap}$  │
│ $s_7$: Weather Severity │ `weather_severity`               │ $\text{Precipitation(mm)} / 200.0$   │
│ $s_8$: News Hazard      │ `news_severity`                  │ $\text{ImpactScore} \in [0, 1]$      │
│ $s_9$: Time of Day      │ `time_of_day`                    │ $\text{Hour} / 24.0$                 │
└─────────────────────────┴──────────────────────────────────┴──────────────────────────────────────┘
```

### 6.2 Deep Q-Network Architecture & Bellman Loss
The policy is parameterized by a multi-layer perceptron $\theta$:
$$\mathbf{h}_1 = \text{ReLU}(\mathbf{W}_1 \mathbf{s} + \mathbf{b}_1), \quad \mathbf{h}_2 = \text{ReLU}(\mathbf{W}_2 \mathbf{h}_1 + \mathbf{b}_2), \quad Q(\mathbf{s}, a) = \mathbf{W}_3 \mathbf{h}_2 + \mathbf{b}_3$$

The optimization loss over experience replay mini-batches $\mathcal{D} = \{(\mathbf{s}, a, r, \mathbf{s}', \text{done})\}$ is:
$$\mathcal{L}(\theta) = \mathbb{E}_{(\mathbf{s}, a, r, \mathbf{s}') \sim \mathcal{D}} \left[ \left( r + \gamma \max_{a'} Q(\mathbf{s}', a'; \theta^-) - Q(\mathbf{s}, a; \theta) \right)^2 \right]$$

### 6.3 Reward Function Formulation
$$r = - \left( 0.35 \cdot \frac{\Delta \text{Time}}{60} + 0.20 \cdot \frac{\Delta \text{Cost}}{100} + 0.15 \cdot \frac{\Delta CO_2}{50} + 0.30 \cdot \mathbb{I}_{\text{Stockout}} \cdot 100 \right) + R_{\text{compliance}}$$

### 6.4 Haversine & Empirical Tortuosity Routing Fallback
When OSRM is offline, road distance is calculated via spherical law of cosines with tortuosity multiplier $\tau = 1.28$:
$$d_{\sigma} = 2 \arcsin \left( \sqrt{ \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right) } \right)$$
$$\text{Distance}_{road\_est} = R_{earth} \cdot d_{\sigma} \times 1.28, \quad (R_{earth} = 6371.0\text{ km})$$

---

## 7. External Interface & API Specifications

### 7.1 Core REST API Endpoints
```
┌────────┬──────────────────────────────────────────┬──────────────────────────────────────────┐
│ Method │ Path                                     │ Summary / Purpose                        │
├────────┼──────────────────────────────────────────┼──────────────────────────────────────────┤
│ GET    │ /api/health                              │ System health, worker & DB liveness check│
│ GET    │ /api/facilities                          │ Retrieve all warehouses, ports, hospitals│
│ GET    │ /api/vehicles                            │ List all vehicles & telemetry coordinates│
│ GET    │ /api/objectives                          │ List active supply transport missions    │
│ POST   │ /api/simulation/start                    │ Start/resume discrete-event tick loop    │
│ POST   │ /api/simulation/pause                    │ Pause current simulation execution       │
│ POST   │ /api/simulation/reset                    │ Re-seed database to initial baseline     │
│ POST   │ /api/simulation/speed?speed=120.0        │ Update time acceleration multiplier      │
│ GET    │ /api/driver/{driver_id}/mobile           │ Fetch active mission & alerts for driver │
│ POST   │ /api/driver/decision                     │ Submit driver ACCEPT/REJECT decision     │
│ POST   │ /api/driver/incidents                    │ Report live field roadblock/flood hazard │
│ POST   │ /api/scenarios/{scenario_key}/trigger    │ Inject disaster scenario disruption      │
│ GET    │ /api/scenarios/{scenario_key}/compare    │ Get Baseline vs. AI comparative metrics  │
│ GET    │ /api/metrics/sdg                         │ Aggregated UN SDG impact KPIs            │
│ GET    │ /api/audit/verify                        │ Verify cryptographic hash chain integrity│
└────────┴──────────────────────────────────────────┴──────────────────────────────────────────┘
```

### 7.2 WebSocket Protocol Specification (`/ws/operations`)
* **Transport**: Full-duplex WebSocket over TLS (`wss://`) or standard WS.
* **Payload Structure (Server Broadcast at 1 Hz)**:
```json
{
  "type": "TELEMETRY_FRAME",
  "timestamp": "2026-09-01T06:00:00Z",
  "simulation_speed": 120.0,
  "vehicles": [
    {
      "id": 1,
      "identifier": "TRK-001",
      "lat": 18.5204,
      "lng": 73.8567,
      "heading": 142.5,
      "status": "in_transit",
      "payload_units": 450,
      "commodity": "insulin",
      "active_route_polyline": "w~_cFf_vgO..."
    }
  ],
  "hazards": [
    {
      "id": 12,
      "city": "Kolhapur",
      "lat": 16.7050,
      "lng": 74.2433,
      "radius_km": 35.0,
      "severity": 0.85,
      "type": "FLOOD"
    }
  ],
  "metrics": {
    "on_time_pct": 98.4,
    "stockouts_prevented": 14,
    "co2_saved_kg": 4210.8
  }
}
```

### 7.3 Google Gemini Disruption Extraction Prompt Specification
* **Target Model**: `gemini-1.5-flash` / `gemini-2.0-flash`
* **System Prompt**:
```
You are an expert emergency logistics AI parser. Analyze the given news headline and extract structured disruption intelligence.
Return ONLY a valid JSON object matching this schema:
{
  "event_type": "FLOOD" | "CYCLONE" | "LANDSLIDE" | "ROAD_BLOCK" | "PROTEST" | "PORT_CONGESTION",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "impact_score": <float between 0.0 and 1.0>,
  "city": "<detected city or region name>",
  "lat": <float latitude>,
  "lng": <float longitude>,
  "radius_km": <float estimated impact radius>,
  "driver_message": "<Concise 2-sentence plain language summary for the truck driver explaining what happened and why a route change is recommended>"
}
```

---

## 8. Non-Functional Requirements (NFRs)

### 8.1 Performance & Latency
* **NFR-P1**: Simulation tick loop calculation for 500 active vehicles and 100 facilities must execute in $\le 50\text{ms}$.
* **NFR-P2**: Dynamic reroute optimization using hybrid RL and OSRM must resolve in $\le 300\text{ms}$.
* **NFR-P3**: WebSocket broadcast frame preparation and dispatch must not exceed $100\text{ms}$.

### 8.2 Reliability, Availability & Graceful Degradation
* **NFR-R1 (Zero-Crash Fallback)**: Failure of external APIs (Gemini LLM, OSRM) must trigger instant local fallback algorithms (Regex NLP, Haversine routing) with zero runtime panics.
* **NFR-R2 (Offline PWA)**: The driver application must operate seamlessly in offline mode, caching up to 50 incident reports and decision actions in IndexedDB.
* **NFR-R3 (High Availability)**: System uptime $\ge 99.9\%$ during live disaster simulation operations.

### 8.3 Security & Data Integrity
* **NFR-S1**: All administrative mutation endpoints require JWT authentication; B2B integrations require SHA-256 hashed API keys.
* **NFR-S2**: Driver ground notes and external news feeds must undergo HTML sanitization to prevent Stored XSS and SQL injection.
* **NFR-S3**: Decision logs must be appended to the cryptographic ledger with verifiable SHA-256 hash chaining.

---

## 9. System State Machines & Sequence Flows

### 9.1 Vehicle Mission Lifecycle State Machine
```
   ┌─────────────────────────────────────────────────────────────┐
   │                       [1. IDLE @ FACILITY]                  │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Dispatch Objective Assigned
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    [2. LOADING CARGO AT DOCK]               │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Loading Time Elapsed
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                      [3. IN_TRANSIT]                        │◀────────┐
   └───────────────┬──────────────────────────────┬──────────────┘         │
                   │                              │                        │
       Hazard Detected on Path        No Disruption / Detour Clear         │
                   │                              │                        │
                   ▼                              │                        │
   ┌──────────────────────────────┐               │                        │
   │   [4. EVALUATING REROUTE]    │               │                        │
   └───────┬──────────────┬───────┘               │                        │
           │              │                       │                        │
   Action: Divert/Detour  Action: Hold Safe       │                        │
           │              │                       │                        │
           ▼              ▼                       │                        │
   ┌───────────────┐ ┌───────────────┐            │                        │
   │ [5. REROUTING]│ │[6. HOLDING_   │            │                        │
   │ (Road or Port)│ │    SAFE]      │────────────┘ (Resume transit once   │
   └───────┬───────┘ └───────────────┘               hazard clears)        │
           │                                                               │
           └──────────────────────┬────────────────────────────────────────┘
                                  │ Target Arrival Coordinates Reached
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                   [7. UNLOADING AT DESTINATION]             │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Unloading Complete (Inventory Transferred)
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                      [8. MISSION COMPLETED]                 │
   └─────────────────────────────────────────────────────────────┘
```

### 9.2 News-to-Reroute Sequence Diagram
```
News Feed / User       Gemini NLP Parser       Decision Engine       Driver Mobile App       Audit Ledger
       │                       │                      │                      │                     │
       │─── Ingest News ──────▶│                      │                      │                     │
       │    Headline String    │                      │                      │                     │
       │                       │── Extract Hazard ───▶│                      │                     │
       │                       │   Polygon & Severity │                      │                     │
       │                       │                      │── Risk Check on ────▶│                     │
       │                       │                      │   Active Vehicle     │                     │
       │                       │                      │                      │                     │
       │                       │                      │── Generate Reroute ─▶│                     │
       │                       │                      │   & Plaintext Alert  │                     │
       │                       │                      │                      │── Show Alert Banner │
       │                       │                      │                      │   & Detour Map      │
       │                       │                      │                      │                     │
       │                       │                      │◀── Driver Decision ──│                     │
       │                       │                      │    (1-Tap ACCEPT)    │                     │
       │                       │                      │                      │                     │
       │                       │                      │─── Record Event ──────────────────────────▶│
       │                       │                      │    SHA-256 Chained                         │
       │                       │                      │                                            │
```

---

## 10. UI/UX Screen Blueprint & Interaction Specifications

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             ADMIN COMMAND CENTER (DESKTOP / LAPTOP)                              │
├──────────────────────────────────────────────────────────┬───────────────────────────────────────┤
│ [ MAP OPERATIONS VIEW ]                                  │ [ AI DECISION & TELEMETRY PANEL ]     │
│ ┌──────────────────────────────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │                                                      │ │ │ ACTIVE ALERT: CYCLONE IN GUJARAT  │ │
│ │  (H) Warehouse Hub           [TRK-02] ===> [Port]    │ │ │ Impact Score: 0.88 (Critical)     │ │
│ │        \                        /                    │ │ ├───────────────────────────────────┤ │
│ │         \                      /                     │ │ │ VEHICLE: TRK-02 (Refrigerated)    │ │
│ │       [TRK-01]               (H) Destination Port    │ │ │ Commodity: 500 units Insulin      │ │
│ │           \                                          │ │ │ AI Action: Divert to Sea Link     │ │
│ │      [Hazard Zone: Kolhapur]                         │ │ │ Reason: Road flooded; avoids 6h   │ │
│ │                                                      │ │ │ delay and prevents spoilage.      │ │
│ └──────────────────────────────────────────────────────┘ │ └───────────────────────────────────┘ │
│ SIMULATION CONTROLS:                                     │ SDG IMPACT GAUGES:                    │
│ [▶ Start] [⏸ Pause] [↺ Reset]  Speed: [ 120x  ▼ ]        │ [SDG 3: 99.4%] [CO2 Saved: 4,210 kg]  │
└──────────────────────────────────────────────────────────┴───────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                 DRIVER MOBILE EDGE PWA                   │
├──────────────────────────────────────────────────────────┤
│ 🚨 HAZARD DETECTED ON YOUR ROUTE                         │
│ Heavy flooding reported on NH-48 near Kolhapur.          │
│ Recommended: Take State Highway 10 bypass (+15 mins).    │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │                 [ INTERACTIVE DETOUR MAP ]           │ │
│ └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ [ ✔ ACCEPT RECOMMENDED DETOUR ]  [ ✖ STAY ON ORIGINAL ]  │
├──────────────────────────────────────────────────────────┤
│ ⚠️ [ REPORT GROUND ROADBLOCK / INCIDENT ]                 │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Hackathon Execution & Judge Defense Guide

### 11.1 Rapid 24h–48h Hackathon Implementation Roadmap
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               24-48 HOUR HACKATHON SPRINT PHASES                                │
├────────────────────────────┬────────────────────────────────────────────────────────────────────┤
│ Hours 00 - 08: Core Engine │ - Setup FastAPI + SQLAlchemy SQLite schema (`models.py`).          │
│                            │ - Build discrete-event simulation tick loop (`simulation.py`).     │
│                            │ - Integrate OSRM HTTP router with fallback geometry.               │
├────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ Hours 08 - 18: AI & Fusion │ - Build Gemini unstructured news parsing prompt with JSON schema.  │
│                            │ - Implement hybrid RL/heuristic decision engine with MOO utility.  │
│                            │ - Build SHA-256 blockchain audit chain logger.                     │
├────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ Hours 18 - 32: Frontends   │ - React Admin Dashboard with Leaflet real-time vehicle markers.    │
│                            │ - WebSocket telemetry connection (`/ws/operations`).               │
│                            │ - Driver Mobile PWA with 1-tap Accept/Reject & Incident Reporting. │
├────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ Hours 32 - 42: Scenarios   │ - Implement Cyclone & Monsoon Flood scenario presets.              │
│                            │ - Build Baseline vs. AI Comparative Delta Dashboard.               │
├────────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ Hours 42 - 48: Demo Polish │ - Verify offline PWA edge caching; record live demo backup video.  │
│                            │ - Finalize pitch slide deck and SDG impact numbers.                │
└────────────────────────────┴────────────────────────────────────────────────────────────────────┘
```

### 11.2 Live Hackathon Demonstration Script (The 3-Minute Win)
1. **Minute 1: The Disaster Hook**:
   - Show the Admin Map with active trucks moving medicine to a hospital in Kolhapur.
   - Inject the **"Monsoon Flood Surge"** scenario. The map instantly renders a red hazard zone over NH-48.
2. **Minute 2: The Autonomous AI & Driver Loop**:
   - The AI Decision Engine flags TRK-001 (carrying insulin).
   - Gemini parses the disruption and generates a human-readable driver alert.
   - Switch to the **Driver Mobile App**: Show the in-cab alert pop up live.
   - Click **"Accept Detour"** on the phone. Show the vehicle polyline on the admin map immediately reroute via State Highway 10.
3. **Minute 3: The Impact & Audit Defense**:
   - Open the **Baseline vs. AI Comparison Tab**: Demonstrate that the AI coordinator prevented 8 hours of stockout and saved 120 kg of carbon emissions.
   - Open the **Cryptographic Ledger Tab**: Show the verifiable SHA-256 hash chain proving the decision was authentic and tamper-proof.

### 11.3 Top Hackathon Judge Questions & How to Defend Them

* **Q1: "Why not just use Google Maps or Waze for truck navigation?"**
  * *Defense*: *"Google Maps optimizes for individual passenger cars seeking the fastest route. It has no awareness of hospital insulin stockout emergencies, truck axle-weight restrictions, multimodal maritime port spillover options, or fleet-wide carbon/cost optimization. Our system is an institutional multi-agent coordinator, not a consumer navigation app."*

* **Q2: "What happens if the Gemini LLM hallucinates or external APIs fail?"**
  * *Defense*: *"We engineered a zero-failure architecture. If Gemini is unreachable or takes $>1.5\text{s}$, the system falls back to a deterministic regex pattern extractor. If OSRM fails, it falls back to topological Haversine routing. The simulation and dispatch engines never freeze."*

* **Q3: "Why is a blockchain/hash chain needed for disaster logistics?"**
  * *Defense*: *"During disasters, millions of dollars in aid and high-value narcotics/medicines go missing due to corruption or logistical mismanagement. Our SHA-256 hash chain creates an immutable, verifiable paper trail of every dispatch, detour, and driver action for UN and government audits."*

---
*End of Software Requirements Specification (SRS).*

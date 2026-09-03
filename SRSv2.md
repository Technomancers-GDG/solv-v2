# RESILIENT ESSENTIAL GOODS COORDINATOR (REGC / SOLV-V2)
### Autonomous Multimodal Disaster Logistics Digital Twin & Edge Coordinator

---

# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
### Business Requirements Document (BRD) • UI/UX Design System • Technical Architecture • AI/RL Optimization Engine

**Document Version:** 2.0.0-Production  
**Classification:** Open Source / Hackathon & Institutional Deployment  
**Date:** September 2026  
**Prepared by:** Technomancers Engineering & Product Architecture Team  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
   - 1.1 Project Introduction
   - 1.2 Core Humanitarian & Business Goals
   - 1.3 System Vision
   - 1.4 System Mission
   - 1.5 Success Metrics (KPIs)
   - 1.6 Expected Social & Humanitarian Outcomes
2. [Brand Identity & Design Language](#2-brand-identity--design-language)
   - 2.1 Brand Personality Pillars
   - 2.2 Color Palette (HUD & Geospatial Theme)
   - 2.3 Typography System
   - 2.4 Visual Design Style & Aesthetic Rules
   - 2.5 Iconography, Map Symbology & Motion System
3. [Complete Platform Sitemap & Navigation Architecture](#3-complete-platform-sitemap--navigation-architecture)
   - 3.1 Navigation Architecture
   - 3.2 Full Sitemap (Public, Operations Control, Driver Edge, Admin & Governance)
4. [Public Landing Page & Mission Overview — Detailed Specification](#4-public-landing-page--mission-overview--detailed-specification)
   - 4.1 Hero Section with 3D Disaster Visualization
   - 4.2 Mission & UN SDG Alignment Strip
   - 4.3 Live Disruption Network Telemetry Strip
   - 4.4 Multimodal Solution Pillars
   - 4.5 Why REGC / Solv-v2: Architectural Superiority
   - 4.6 Disaster Impact Statistics & Proof Counters
   - 4.7 Live Interactive Simulator Sandbox Embed
   - 4.8 Case Study: Cyclone Biparjoy & Western Ghats Flood
   - 4.9 Institutional Testimonials & Partner Showcase
   - 4.10 Call to Action & Emergency Ingestion Strip
5. [Operations Command Center Module Specification](#5-operations-command-center-module-specification)
   - 5.1 Interactive 3D Geospatial Map View (`/operations/map`)
   - 5.2 Multimodal Network Graph View (`/operations/network`)
   - 5.3 Objectives & Commodity Dispatch Engine (`/operations/objectives`)
   - 5.4 Live Operations Telemetry Stream (`/operations/live-ops`)
6. [AI Disruption Ingestion & Multimodal Signal Fusion Module](#6-ai-disruption-ingestion--multimodal-signal-fusion-module)
   - 6.1 Multimodal Ingestion Pipeline
   - 6.2 Gemini 2.0 Flash Vision: Road & Infrastructure Damage Classifier
   - 6.3 Gemini Natural Language Processing & News Geofencing
   - 6.4 Weather Radar & Precipitation Ingestion
   - 6.5 Deterministic Heuristic Fallback Engine
7. [Autonomous Reinforcement Learning & Multi-Objective Decision Engine](#7-autonomous-reinforcement-learning--multi-objective-decision-engine)
   - 7.1 Deep Q-Network (DQN) Decision Pipeline
   - 7.2 10-Dimensional State Vector Representation
   - 7.3 Discrete Action Space
   - 7.4 Multi-Objective Pareto Utility Function
   - 7.5 Counterfactual Explainability Engine
8. [Cold-Chain IoT & Perishable Spoilage Prevention Module](#8-cold-chain-iot--perishable-spoilage-prevention-module)
   - 8.1 Thermal Physics Spoilage Model
   - 8.2 IoT Temperature Sensor Telemetry
   - 8.3 Emergency Cold-Storage Rerouting Protocol
9. [Driver Mobile Edge Loop (PWA) & Voice Copilot Specification](#9-driver-mobile-edge-loop-pwa--voice-copilot-specification)
   - 9.1 Edge Architecture & PWA Offline Capabilities
   - 9.2 Driver In-Cab HUD & Active Mission View (`/driver/mission`)
   - 9.3 Multimodal In-Cab Voice Copilot
   - 9.4 1-Tap AI Recommendation Acknowledgment Flow
   - 9.5 Camera-Based Incident Ingestion & Edge Sync
   - 9.6 Peer-to-Peer (P2P) Offline Bluetooth/WebRTC Mesh Relay
10. [Scenario Sandbox & Baseline vs. AI Benchmarking Module](#10-scenario-sandbox--baseline-vs-ai-benchmarking-module)
    - 10.1 Disaster Scenario Catalog
    - 10.2 Dual-Track Comparative Simulation Engine
    - 10.3 Quantitative Delta Analytics & Reporting
11. [Trust, Cryptographic Ledger & UN SDG Impact Verification](#11-trust-cryptographic-ledger--un-sdg-impact-verification)
    - 11.1 SHA-256 Chained Blockchain Audit Ledger
    - 11.2 Merkle Inclusion Proofs & Public Verification QR Code
    - 11.3 Real-Time UN SDG Metric Calculation Engine
12. [UI/UX Design System & Component Library](#12-uiux-design-system--component-library)
    - 12.1 Button Components
    - 12.2 Form & Input Components
    - 12.3 Card & HUD Glassmorphism Panels
    - 12.4 Geospatial Markers & Hazard Polygons
    - 12.5 Microinteractions, Transitions & Sound System
    - 12.6 Responsive Breakpoints & Device Support
13. [Database Design & Complete Entity Schema](#13-database-design--complete-entity-schema)
    - 13.1 Database Technology Stack
    - 13.2 Core Entity Definitions (SQLAlchemy & PostgreSQL 15 DDL)
    - 13.3 Auxiliary & Ledger Tables
14. [Security, Governance & Fault Tolerance](#14-security-governance--fault-tolerance)
    - 14.1 Authentication & Session Management
    - 14.2 Role-Based Access Control (RBAC) Matrix
    - 14.3 Prompt Injection Defense & Input Sanitization
    - 14.4 API Security & Rate Limiting
    - 14.5 Zero-Crash Graceful Degradation Architecture
15. [External Integrations & API Standards](#15-external-integrations--api-standards)
    - 15.1 External Integrations Directory
    - 15.2 RESTful API Design Standards & Core Endpoints
    - 15.3 Full-Duplex WebSocket Protocol (`/ws/operations`)
16. [Technical Architecture & Infrastructure](#16-technical-architecture--infrastructure)
    - 16.1 System Architecture Overview
    - 16.2 Complete Technology Stack
    - 16.3 High-Level Component Interaction Flow
    - 16.4 Performance & Latency Budgets
17. [Future Expansion Roadmap](#17-future-expansion-roadmap)
    - 17.1 Phase 2: Multi-Agent Autonomous Relief Auctions (Months 6–12)
    - 17.2 Phase 3: Satellite Synthetic Aperture Radar (SAR) Ingestion (Months 12–24)
    - 17.3 Scalability & Enterprise Multi-Tenancy Provisions
18. [Implementation Phases & Delivery Plan](#18-implementation-phases--delivery-plan)
    - 18.1 Development Phases
    - 18.2 Definition of Done (DoD)
    - 18.3 Hackathon 48-Hour Rapid Build Sprint Schedule
19. [Appendices](#19-appendices)
    - Appendix A: Mathematical Glossary & Nomenclature
    - Appendix B: Revision History
    - Appendix C: Team & Institutional Contact Information

---

## 1. Executive Summary

### 1.1 Project Introduction
**Resilient Essential Goods Coordinator (REGC / Solv-v2)** is a next-generation cyber-physical digital twin, autonomous multimodal routing engine, and edge decision-support platform designed to protect national and regional supply lines of essential goods during catastrophic natural disasters, geopolitical disruptions, and extreme weather events.

Traditional supply chain platforms collapse during emergencies because they operate on static, single-modal road graphs, lack real-time unstructured signal comprehension, and depend on brittle central connectivity. REGC bridges this gap by unifying **Google Gemini 2.0 multimodal vision and natural language models**, **Deep Reinforcement Learning (DQN)**, **intermodal maritime coastal links**, **cold-chain spoilage physics**, **offline PWA edge synchronization**, and **SHA-256 cryptographic audit chaining** into a unified, high-performance operational cockpit.

### 1.2 Core Humanitarian & Business Goals
* **Zero Stockouts of Critical Medicines**: Eliminate stockout windows of life-saving medical supplies (insulin, vaccines, blood plasma, dialysis fluid) across disaster-affected hospitals and relief camps.
* **Autonomous Multimodal Rerouting**: Dynamically divert blocked highway freight to coastal maritime corridors, rail transfer terminals, and inland waterways within 300 milliseconds of hazard identification.
* **Instant Unstructured Disaster Ingestion**: Ingest and geolocate news reports, satellite/drone road damage images, and meteorological radar alerts in under 2 seconds.
* **Edge Driver Empowerment**: Deliver actionable, plain-language AI instructions and voice-guided detour commands to field drivers in remote, offline-compromised territories.
* **Transparent Aid Governance**: Provide immutable cryptographic proof of all relief dispatches, routing diversions, and deliveries to prevent black-market leakage and satisfy international humanitarian audit standards.

### 1.3 System Vision
To become the global gold standard for autonomous disaster logistics and resilient supply chain orchestration—empowering emergency response agencies, UN bodies, NGOs, and commercial carriers to maintain unbroken essential delivery networks under any environmental collapse.

### 1.4 System Mission
To build a zero-crash, highly visual, mathematically verified digital twin and mobile edge coordinator that translates raw disaster signals into optimized physical actions, saving lives, preserving perishable goods, minimizing fuel waste, and maintaining total operational transparency.

### 1.5 Success Metrics (KPIs)
| Metric | Baseline (Static Logistics) | Target (REGC / Solv-v2) | Verification Method |
|---|---|---|---|
| **Critical Stockout Hours** | 48.6 hrs / disaster event | **< 2.0 hrs / disaster event** | Automated Simulation Comparative Benchmarking |
| **Emergency Rerouting Latency** | 120–240 minutes (manual) | **< 300 milliseconds** | Real-time RL Inference Benchmark |
| **Cold-Chain Spoilage Rate** | 22.4% during road blocks | **< 1.5%** | IoT Thermal Physics Telemetry Simulator |
| **Disruption Extraction Accuracy** | Manual News Monitoring | **> 94.5% precision** | Gemini 2.0 Structured Output Validation Suite |
| **Driver Detour Adoption Rate** | 35% (vague instructions) | **> 85%** | Plaintext LLM & Voice Copilot Driver Telemetry |
| **PWA Offline Recovery Time** | Complete Data Loss | **< 3 seconds post-reconnect**| IndexedDB Edge Sync Integration Test |
| **System Tick Execution (500 Trucks)**| N/A | **< 50 ms / tick** | PyTest Stress Harness (`test_simulation.py`) |

### 1.6 Expected Social & Humanitarian Outcomes
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EXPECTED SOCIAL IMPACT PROFILE                                 │
├────────────────────────────┬─────────────────────────────────────────────────────────────────────┤
│ SDG 3: Good Health         │ 100% on-time delivery SLA for life-saving pharmaceuticals, vaccines │
│ SDG 9: Resilient Infra     │ 40% reduction in transport corridor downtime via intermodal ports    │
│ SDG 11: Sustainable Cities │ 60% faster emergency food and potable water distribution post-flood │
│ SDG 12: Responsible Use    │ 30% reduction in fleet carbon emissions ($CO_2$) & zero food waste  │
│ Humanitarian Governance    │ 100% verifiable SHA-256 Merkle audit trail for relief aid deliveries│
└────────────────────────────┴─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Brand Identity & Design Language

### 2.1 Brand Personality Pillars
| Pillar | Expression in REGC / Solv-v2 |
|---|---|
| **Mission-Critical & Authoritative** | High-contrast dark mode, HUD tactical aesthetic, precise telemetry readouts, zero unnecessary visual clutter. |
| **Intelligent & Autonomous** | Real-time predictive heatmaps, glowing directional vectors, dynamic reroute arcs, counterfactual reasoning panels. |
| **Humanitarian & Empathetic** | Clear plain-language driver alerts, high-visibility hazard badges, accessible regional voice prompts. |
| **Mathematically Rigorous** | Explicit confidence percentages, multi-objective score breakdowns, Pareto trade-off sliders. |
| **Transparent & Trustworthy** | Cryptographic hash blocks, verifiable Merkle badges, live audit verifiers. |

### 2.2 Color Palette (HUD & Geospatial Theme)
```
┌───────────────────┬──────────────────────┬─────────────┬────────────────────────────────────────────────────────┐
│ Role              │ Token Name           │ Hex Code    │ Usage Specification                                    │
├───────────────────┼──────────────────────┼─────────────┼────────────────────────────────────────────────────────┤
│ Background Dark   │ `--bg-rich-black`    │ `#070A13`   │ Core canvas, dashboard root, terminal backdrop         │
│ Surface Dark      │ `--surface-slate`    │ `#0F172A`   │ Floating HUD cards, modal containers, panel background │
│ Surface Border    │ `--border-subtle`    │ `#1E293B`   │ 1px panel borders, table grid lines, dividers          │
│ Accent Primary    │ `--cyan-radar`       │ `#00E5FF`   │ Active vehicle routes, GPS heading vectors, live ticks │
│ Accent Secondary  │ `--violet-neural`    │ `#8B5CF6`   │ RL decision pathways, AI recommendations, Gemini badges│
│ Hazard Critical   │ `--crimson-alert`    │ `#EF4444`   │ Flood zones, cyclones, impassable bridges, stockouts   │
│ Hazard Warning    │ `--amber-warning`    │ `#F59E0B`   │ Moderate rain, road bottlenecks, dock congestion       │
│ Success / Safe    │ `--emerald-safe`     │ `#10B981`   │ Delivered cargo, optimal stock levels, verified ledger │
│ Cold-Chain Alert  │ `--ice-blue`         │ `#38BDF8`   │ Refrigerated cargo status, thermal sensors, sea links   │
│ Text Primary      │ `--text-primary`     │ `#F8FAFC`   │ Headings, primary metrics, alert titles                │
│ Text Muted        │ `--text-muted`       │ `#94A3B8`   │ Subtitles, timestamps, coordinate readouts             │
└───────────────────┴──────────────────────┴─────────────┴────────────────────────────────────────────────────────┘
```

### 2.3 Typography System
* **Display & Hero Headings**: `Orbitron`, sans-serif (Weights: 700 Bold, 900 Black). Letter-spacing: `-0.03em`. Used for system state, live clock, critical hazard counts.
* **Operational & UI Text**: `Inter`, sans-serif (Weights: 400 Regular, 500 Medium, 600 SemiBold). Line-height: `1.6`. Used for navigation, cards, plain-language driver alerts.
* **Telemetry & Code Data**: `JetBrains Mono`, monospace (Weights: 400 Regular, 600 Bold). Used for GPS coordinates, SHA-256 hashes, ETA readouts, and state vectors.

### 2.4 Visual Design Style & Aesthetic Rules
1. **Tactical Glassmorphism**: Cards feature `backdrop-filter: blur(16px)`, background `rgba(15, 23, 42, 0.75)`, with top-highlight gradient borders `linear-gradient(135deg, rgba(0, 229, 255, 0.3), transparent 70%)`.
2. **Geospatial Glow & Heading Radar**: Moving vehicles feature forward-facing illuminated light cones (`canvas-radar-mesh`) showing directional velocity and speed proportional length.
3. **Pulsing Hazard Polygons**: Flood and cyclone zones render dynamic SVG stroke-dash animations pulsing at 1.5-second cycles to draw immediate operator focus.

### 2.5 Iconography, Map Symbology & Motion System
* **Icon System**: Lucide React Icons (Stroke weight: `1.75px`).
* **Map Icons**: Custom SVG pins with embedded commodity glyphs (Pill: Medicine, Drop: Water, Wheat: Food, Flame: Fuel, Snowflake: Cold-Chain).
* **Microinteractions**:
  - Button Hover: `transform: scale(1.02); filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.4))` (Transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)`).
  - Modal Slide-In: `opacity: 0 -> 1; transform: translateY(16px) -> translateY(0)` (Transition: `200ms ease-out`).

---

## 3. Complete Platform Sitemap & Navigation Architecture

### 3.1 Navigation Architecture
The platform is organized into three segregated routing layers:
1. **Public Information & Simulation Demo Layer**: Unauthenticated, showcasing live mission metrics, technical whitepaper, and interactive sandbox.
2. **Operations Command Center**: Authenticated operational interface for disaster response directors, regional dispatchers, and NGO logistics officers.
3. **Driver Mobile Edge PWA**: Mobile-optimized, touch-first in-cab interface for relief fleet drivers.
4. **Governance & Audit Portal**: Specialized view for compliance officers, UN auditors, and insurance assessors.

### 3.2 Full Sitemap
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REGC / SOLV-V2 SITEMAP TREE                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ├── 1.0 Public & Landing Layer                                                                   │
│ │   ├── / .................................... Public Landing Page, Live Simulator Embed, Whitepaper│
│ │   ├── /case-studies ........................ Historic Disaster Benchmarks (Cyclone Biparjoy, etc.)│
│ │   ├── /sdg-impact .......................... UN Sustainable Development Goals Live Metric Board │
│ │   └── /auth/login .......................... Role-Based Auth Portal (Admin, Dispatcher, Driver) │
│ │                                                                                                │
│ ├── 2.0 Operations Command Center (/operations)                                                  │
│ │   ├── /operations/map ...................... 3D Geospatial Map, Vehicle Telemetry, Hazard Layers│
│ │   ├── /operations/network .................. Multimodal Topology Graph (Warehouses, Ports, Hubs)│
│ │   ├── /operations/objectives ............... Mission Scheduling, Priority Matrix, SLA Tracking │
│ │   ├── /operations/live-ops ................. Real-time Event Stream, Fleet Kinematics, Stockouts│
│ │   ├── /operations/scenarios ................ Disaster Stress-Testing Sandbox (Baseline vs. AI) │
│ │   ├── /operations/cold-chain ............... Perishable Pharmaceutical Spoilage & Thermal Radar │
│ │   └── /operations/ai-insights .............. Gemini News Fusion Stream, Deep Q-Network Decisions│
│ │                                                                                                │
│ ├── 3.0 Driver Mobile Edge PWA (/driver)                                                         │
│ │   ├── /driver/mission ...................... Active Route Map, Turn-by-Turn, Voice Copilot HUD │
│ │   ├── /driver/recommendation ............... AI Reroute Modal (Plaintext Gemini Alert, 1-Tap Ack│
│ │   ├── /driver/report-incident .............. Camera Road Damage Capture & Offline Incident Form │
│ │   └── /driver/offline-status ............... IndexedDB Queue Status, P2P Mesh Relay Diagnostics │
│ │                                                                                                │
│ └── 4.0 Governance, API & Audit Layer (/governance)                                              │
│     ├── /governance/ledger ................... SHA-256 Block Explorer & Merkle Proof Inspector   │
│     ├── /governance/verify/:id ............... Public QR Code Certificate Verifier               │
│     ├── /governance/api-keys ................. B2B Enterprise Client Key Management & Webhooks    │
│     └── /governance/audit-logs ............... Administrative Action Logs & System Blackbox Trace│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Public Landing Page & Mission Overview — Detailed Specification

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LANDING PAGE SECTION SPECIFICATION                             │
├───────────────────┬──────────────────────────────────────────────────────────────────────────────┤
│ Section           │ Functional Specification & UI Components                                     │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.1 Hero Section  │ • Headline: "Engineering Autonomous Resilience into Disaster Logistics"     │
│                   │ • Subhead: "Multimodal routing, Gemini 2.0 vision fusion, and deep RL that  │
│                   │   guarantees critical medicine delivery when infrastructure collapses."     │
│                   │ • 3D Background: Interactive Mapbox GL / Deck.gl globe displaying illuminated│
│                   │   supply vectors across India and dynamic pulsing storm geofences.           │
│                   │ • Primary CTA: "Launch Operations Command" (Cyan Blue, `#00E5FF`)            │
│                   │ • Secondary CTA: "Simulate Disaster Scenario" (Ghost Violet, `#8B5CF6`)      │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.2 SDG Strip     │ • 4 Interactive Glassmorphism Badges: SDG 3 (Good Health), SDG 9 (Resilient  │
│                   │   Infra), SDG 11 (Sustainable Cities), SDG 12 (Zero Spoilage).              │
│                   │ • Live API ticker showing cumulative metrics across active deployments.      │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.3 Live Telemetry│ • Animated ticker strip: "Active Trucks: 14 | Warehouses: 86 | Ports: 12 |   │
│     Ticker        │   Disruptions Active: 3 (Kolhapur Flood, Gujarat Cyclone, Ghat Landslide) | │
│                   │   Stockouts Prevented Today: 18 | CO2 Saved: 4,210 kg"                       │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.4 4 Pillars Grid│ • Card 1: Multimodal Spatial Graph (OSRM Road + Coastal Maritime Port Links) │
│                   │ • Card 2: Gemini 2.0 Signal Fusion (Unstructured News + Road Damage Vision)  │
│                   │ • Card 3: Deep Q-Learning Decision Engine (Real-time Pareto Multi-Objective) │
│                   │ • Card 4: Edge Driver PWA & P2P Mesh (Zero-connectivity offline sync)        │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.5 Why REGC?     │ • Side-by-side comparison matrix: "Legacy GPS vs. REGC Autonomous Twin".     │
│                   │ • Highlights: Commodity awareness, stockout penalties, intermodal diversion.│
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.6 Proof Counters│ • Count-up counters: 1,420+ Simulated Missions | 99.8% Medical SLA Attainment│
│                   │   | 340+ Metric Tons Rations Delivered | 0 Unhandled System Panics.          │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.7 Live Sandbox  │ • Embedded interactive lightweight Leaflet simulator widget allowing visitors│
│     Embed         │   to click "Trigger Flash Flood" and watch truck TRK-01 instantly reroute.   │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.8 Case Study    │ • Deep dive on "Monsoon Surge in Western Maharashtra": 14 hospitals defended,│
│                   │   zero insulin spoilage via maritime bypass through JNPT to Ratnagiri port.  │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.9 Partners      │ • Logos of humanitarian aid organizations, state disaster authorities, and   │
│                   │   open-source routing projects (OSRM, OpenStreetMap, Google Cloud).          │
├───────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 4.10 Ingestion CTA│ • "Connect Your Agency Fleet / Upload Waybill" button linking to B2B API     │
│                   │   documentation and Swagger OpenAPI UI (`/docs`).                            │
└───────────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Operations Command Center Module Specification

### 5.1 Interactive 3D Geospatial Map View (`/operations/map`)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         GEOSPATIAL OPERATIONS COCKPIT (DESKTOP VIEW)                             │
├──────────────────────────────────────────────────────────┬───────────────────────────────────────┤
│ [ MAP CANVAS - DECK.GL / LEAFLET HYBRID ]                │ [ AI DECISION & TELEMETRY STREAM ]    │
│ ┌──────────────────────────────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ 3D Elevation Mesh: Western Ghats Corridor            │ │ │ ACTIVE ALERT: CYCLONE BIPARJOY    │ │
│ │ Water Inundation Level: +1.8m (Simulated)            │ │ │ Severity: 0.88 (CRITICAL HAZARD)  │ │
│ │                                                      │ │ ├───────────────────────────────────┤ │
│ │ [Warehouse: Mumbai] ───(TRK-01: Insulin)───┐        │ │ │ TARGETED FLEET: TRK-01            │ │
│ │         │                                    │       │ │ │ Payload: 500 units Cold-Chain Med │ │
│ │  (Blocked NH-48)                             ▼       │ │ │ AI Action: Divert to JNPT Port    │ │
│ │     [CRITICAL FLOOD ZONE] ──────▶ [Coastal Sea Link] │ │ │ Est. Arrival: 14:30 (On-Time)     │ │
│ │                                              │       │ │ │ Baseline Cost: $480 | AI: $310    │ │
│ │                                              ▼       │ │ │ Stockout Prevented: 120 Patients  │ │
│ │                                    [Hospital: Goa]   │ │ └───────────────────────────────────┘ │
│ └──────────────────────────────────────────────────────┘ │ [ PARETO OBJECTIVE WEIGHTS ]         │
│ SIMULATION CONTROLS:                                     │ Time [===|---] Cost [==|-----]        │
│ [▶ Start] [⏸ Pause] [↺ Reset]  Speed: [ 120x  ▼ ]        │ CO2  [====|--] Stockout [======|]     │
└──────────────────────────────────────────────────────────┴───────────────────────────────────────┘
```
* **Map Engine**: Deck.gl overlaying Mapbox GL JS / Leaflet vector tiles.
* **3D Flood Inundation Layer**: Dynamic GLSL elevation-clamped water mesh rendering rising flood depths ($0.0\text{m}$ to $4.0\text{m}$) over road vectors based on rainfall accumulation.
* **Kinematic Heading Vectors**: Real-time calculated vehicle marker angles:
  $$\theta = \text{atan2}(\sin(\Delta \lambda)\cos(\phi_2), \cos(\phi_1)\sin(\phi_2) - \sin(\phi_1)\cos(\phi_2)\cos(\Delta \lambda))$$
* **Layer Controls**: Toggle Warehouses, Ports, Hospitals, Hazard Zones, Active Route Polylines, and Thermal Spoilage Radii.

### 5.2 Multimodal Network Graph View (`/operations/network`)
* **Topological Visualization**: Node-link diagram using Force-Directed D3 Graph rendering 86 facilities and 12 maritime coastal links.
* **Node Metrics**: Current Inventory Units, Base Capacity, Dock Queue Length, and Bottleneck Criticality Score.
* **Edge Metrics**: Road Distance ($\text{km}$), Intermodal Transfer Cost, Nautical Transit Duration, Dynamic Risk Multiplier.

### 5.3 Objectives & Commodity Dispatch Engine (`/operations/objectives`)
* **Commodity Class Hierarchy**:
  1. `Medicine / Vaccines`: Ultra-high priority (5/5), cold-chain mandatory ($2^\circ\text{C} - 8^\circ\text{C}$), zero-tolerance SLA.
  2. `Blood Units / Plasma`: High priority (5/5), temperature-controlled ($1^\circ\text{C} - 6^\circ\text{C}$), 6-hour SLA window.
  3. `Potable Water / Rations`: High priority (4/5), bulk dry payload, 24-hour SLA window.
  4. `Emergency Fuel / Equipment`: Medium priority (3/5), hazardous cargo safety restrictions.
* **Automated Dispatch Interval**: Configurable timer (default $120\text{ minutes}$) automatically creating new objective shipments based on destination hospital depletion rates.

### 5.4 Live Operations Telemetry Stream (`/operations/live-ops`)
* **Data Refresh Rate**: $1.0\text{ Hz}$ broadcast over WebSocket (`/ws/operations`).
* **Table Columns**: Vehicle ID, Commodity, Current Speed ($\text{km/h}$), Origin, Target Facility, Distance Remaining, Cold-Chain Temp ($^\circ\text{C}$), AI Recommendation Status, Driver Compliance Ack.

---

## 6. AI Disruption Ingestion & Multimodal Signal Fusion Module

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             MULTIMODAL DISRUPTION INGESTION PIPELINE                             │
├────────────────────────────┬────────────────────────────┬────────────────────────────────────────┤
│ 1. DRIVER ROAD PHOTO       │ 2. UNSTRUCTURED NEWS FEED  │ 3. METEOROLOGICAL RADAR                │
│ (Washed-out Bridge Image)  │ (RSS / Excel Headline)     │ (Precipitation mm / Wind kmph)         │
└─────────────┬──────────────┴─────────────┬──────────────┴────────────────────┬───────────────────┘
              │                            │                                   │
              ▼                            ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            GOOGLE GEMINI 2.0 FLASH MULTIMODAL PARSER                             │
│  - Vision Prompt: Extract road destruction level, max axle load, passability boolean             │
│  - NLP Prompt: Extract disaster type, severity (0-1), city, geocoordinates, radius               │
│  - Driver Message Synthesizer: 2-sentence plain-language detour explanation                      │
└──────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                           │ Structured Disruption Event JSON
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             CENTRAL DIGITAL TWIN HAZARD GEOFENCE                                 │
│  - Injects Circular/Polygon Geofence $\mathcal{H}_i = \{ (lat, lng) \mid d \le R \}$             │
│  - Evaluates Route Intersections for All Active Shipments in Parallel                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Multimodal Ingestion Pipeline
The pipeline ingests three asynchronous signal vectors simultaneously:
1. Ground truth photographs captured by relief drivers.
2. Unstructured regional disaster headlines and emergency RSS feeds.
3. Satellite precipitation and weather datasets.

### 6.2 Gemini 2.0 Flash Vision: Road Damage Classifier
When a field driver encounters a road disruption and uploads an image via the PWA:
```python
# API Implementation Specification
response = gemini_client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        image_bytes,
        """Analyze this ground-level disaster logistics photograph.
        Extract and return ONLY a JSON object:
        {
            "passable_for_trucks": false,
            "hazard_type": "BRIDGE_COLLAPSE" | "MUDSLIDE" | "FLOOD_SUBMERSION" | "TREE_OBSTRUCTION",
            "damage_severity_score": 0.95,
            "max_safe_weight_tons": 0.0,
            "recommended_action": "IMMEDIATE_ROAD_CLOSURE",
            "driver_alert": "Bridge structurally compromised. Heavy trucks strictly prohibited."
        }"""
    ]
)
```

### 6.3 Gemini Natural Language Processing & News Geofencing
* **Input**: Unstructured news string (e.g., *"National Highway 48 closed near Kolhapur after Panchganga river breaches danger mark; over 500 trucks stranded"*).
* **Processing**: Model maps the text to verified spatial coordinates $(16.7050^\circ\text{N}, 74.2433^\circ\text{E})$, determines impact radius $R = 35.0\text{ km}$, and severity $\sigma = 0.88$.
* **Driver Translation**: Synthesizes localized alert: *"NH-48 flooded near Kolhapur. Reroute initiated via Coastal Highway to ensure insulin arrives without thermal delay."*

### 6.4 Weather Radar & Precipitation Ingestion
* Ingests hourly precipitation ($\text{mm}$) and wind speed ($\text{km/h}$).
* Closure risk formula:
  $$\text{Risk}_{weather} = \min\left(1.0, \frac{\text{Precipitation}(\text{mm})}{150.0} \times 0.7 + \frac{\text{Wind}(\text{km/h})}{100.0} \times 0.3\right)$$

### 6.5 Deterministic Heuristic Fallback Engine
If Gemini API encounters a network timeout ($>1500\text{ms}$) or HTTP 5xx error:
1. Regex pattern matcher activates immediately:
   ```python
   DISRUPTION_REGEX = r"(flood|cyclone|landslide|waterlogging|protest|blocked|bridge collapse)"
   ```
2. City name extracted via dictionary lookup against 86 pre-indexed logistics nodes.
3. Fallback assigns default severity $0.70$ and radius $30\text{ km}$. Zero system downtime.

---

## 7. Autonomous Reinforcement Learning & Multi-Objective Decision Engine

### 7.1 Deep Q-Network (DQN) Decision Pipeline
When an active vehicle's route intersects a hazard geofence ($\text{Intersection}(\mathcal{R}_v, \mathcal{H}) \neq \emptyset$), the decision engine triggers an evaluation loop:

```
[State Vector s ∈ R^10] ───▶ [DQN Neural Net Q(s, a; θ)] ───┐
                                                             ├──▶ [Pareto MOO Solver] ───▶ Action a*
[Candidate Actions A]   ───▶ [Utility Scoring U(a)]      ───┘
```

### 7.2 10-Dimensional State Vector Representation
```
┌────────┬──────────────────────┬────────────────────────────────────────────────────────┬─────────┐
│ Index  │ Feature Name         │ Mathematical Definition & Normalization                │ Range   │
├────────┼──────────────────────┼────────────────────────────────────────────────────────┼─────────┤
│ $s_0$  │ `utilization_norm`   │ Target facility current stock / base capacity          │ $[0, 1]$│
│ $s_1$  │ `route_risk`         │ Maximum risk score among all edges on active route     │ $[0, 1]$│
│ $s_2$  │ `eta_multiplier_norm`│ $\min(2.0, \text{ETA Multiplier} - 1.0)$               │ $[0, 1]$│
│ $s_3$  │ `sla_urgency`        │ $\text{Elapsed Time} / \text{SLA Minutes}$             │ $[0, 1]$│
│ $s_4$  │ `payload_norm`       │ Loaded units / vehicle payload capacity                │ $[0, 1]$│
│ $s_5$  │ `priority_norm`      │ Commodity priority / 5.0                               │ $[0, 1]$│
│ $s_6$  │ `port_pressure`      │ Coastal port link occupancy ratio                      │ $[0, 1]$│
│ $s_7$  │ `weather_severity`   │ Local precipitation / 200.0 mm                         │ $[0, 1]$│
│ $s_8$  │ `news_severity`      │ NLP disruption impact score                            │ $[0, 1]$│
│ $s_9$  │ `time_of_day`        │ Current simulation hour / 24.0                         │ $[0, 1]$│
└────────┴──────────────────────┴────────────────────────────────────────────────────────┴─────────┘
```

### 7.3 Discrete Action Space
The agent chooses among 5 distinct actions $\mathcal{A}$:
1. `CONTINUE`: Stay on current route with speed penalty and hazard damage risk.
2. `REROUTE_WAREHOUSE`: Detour via alternative inland road highway to a backup depot.
3. `REROUTE_PORT`: Divert cargo to nearest maritime port for coastal sea-vessel transfer.
4. `HOLD_SAFE`: Direct vehicle to park at nearest verified safe warehouse until storm clears.
5. `DEFER_DISPATCH`: Hold vehicle at origin facility; cancel immediate road departure.

### 7.4 Multi-Objective Pareto Utility Function
The total utility of action $a$ is:
$$U(a) = - \left( w_1 \cdot \frac{\Delta \text{Time}(a)}{60.0} + w_2 \cdot \frac{\Delta \text{Cost}(a)}{100.0} + w_3 \cdot \frac{\Delta CO_2(a)}{50.0} + w_4 \cdot \mathbb{I}_{\text{Stockout}}(a) \cdot 100.0 \right)$$
* Default Weights: $w_1 = 0.35$ (Time), $w_2 = 0.15$ (Cost), $w_3 = 0.10$ (Emissions), $w_4 = 0.40$ (Stockout Penalty).
* For `Medicine` and `Vaccines`, $w_4$ dynamically surges to $0.70$.

### 7.5 Counterfactual Explainability Engine
Every recommendation outputs a machine and human-readable counterfactual comparison:
* *Selected Action*: `REROUTE_PORT` (JNPT Coastal Transfer).
* *Counterfactual*: *"If the vehicle continued on NH-48 (Baseline), it would suffer a 380-minute flood delay, triggering a complete insulin stockout at Kolhapur Civil Hospital and 100% cold-chain spoilage."*

---

## 8. Cold-Chain IoT & Perishable Spoilage Prevention Module

### 8.1 Thermal Physics Spoilage Model
For refrigerated trucks carrying pharmaceuticals (insulin, blood units, vaccines), internal cargo temperature $T_{\text{cargo}}(t)$ is governed by Newton's Law of Cooling coupled with refrigeration compressor dynamics:
$$\frac{dT_{\text{cargo}}}{dt} = -\beta_{\text{active}} \cdot (T_{\text{cargo}} - T_{\text{set}}) + \frac{k_{\text{insulation}}}{C_{\text{thermal}}} \cdot (T_{\text{ambient}} - T_{\text{cargo}})$$
* $T_{\text{set}} = 4.0^\circ\text{C}$ (Standard cold-chain target).
* If vehicle enters a standstill (`HOLDING` or `TRAFFIC_GRIDLOCK`), fuel depletion shuts down active cooling ($\beta_{\text{active}} = 0$).
* Spoilage Condition: $T_{\text{cargo}}(t) > 8.0^\circ\text{C}$ for continuous duration $\Delta t_{\text{breach}} \ge 45\text{ minutes}$.

### 8.2 IoT Temperature Sensor Telemetry
Vehicles publish virtual OBD-II / LoRaWAN telemetry frames:
```json
{
  "vehicle_id": 3,
  "cargo_temp_c": 6.8,
  "ambient_temp_c": 38.5,
  "compressor_status": "ACTIVE_HIGH",
  "thermal_margin_minutes": 28.0,
  "spoilage_risk_pct": 14.2
}
```

### 8.3 Emergency Cold-Storage Rerouting Protocol
When thermal margin drops below 30 minutes ($\text{Margin} < 30\text{ min}$):
1. The decision engine overrides standard route planning.
2. It executes a $k$-Nearest Neighbors ($k$-NN) search for facilities with `facility_type = 'warehouse'` and `has_cold_storage = true`.
3. An emergency detour is issued to transfer cargo before batch spoilage occurs.

---

## 9. Driver Mobile Edge Loop (PWA) & Voice Copilot Specification

### 9.1 Edge Architecture & PWA Offline Capabilities
* **Framework**: React 18, Vite PWA Plugin, Workbox Service Worker.
* **Local Storage**: IndexedDB via `idb-keyval` caching active vector maps, route polylines, pending notifications, and offline incident logs.
* **Storage Limit**: Up to $100\text{ MB}$ offline map vector tile cache.

### 9.2 Driver In-Cab HUD & Active Mission View (`/driver/mission`)
```
┌──────────────────────────────────────────────────────────┐
│                 DRIVER IN-CAB HUD (MOBILE)               │
├──────────────────────────────────────────────────────────┤
│ 🚨 ALERT: CYCLONE WARNING ON NH-48                       │
│ Severe flooding 22 km ahead. Road blocked.               │
├──────────────────────────────────────────────────────────┤
│ [ INTERACTIVE LEAFLET / MAPBOX NAVIGATION CANVAS ]       │
│                                                          │
│     (Origin: Pune) ───[YOU ARE HERE]                     │
│                             \                            │
│                              \───▶ [RECOMMENDED DETOUR]  │
│                                    (State Highway 10)    │
├──────────────────────────────────────────────────────────┤
│ AI RECOMMENDATION:                                       │
│ "Take SH-10 bypass. Adds 14 km but avoids 6-hour flood   │
│ gridlock and protects cold-chain insulin."               │
├──────────────────────────────────────────────────────────┤
│ [ ✔ ACCEPT DETOUR (1-TAP) ]    [ ✖ IGNORE & CONTINUE ]   │
├──────────────────────────────────────────────────────────┤
│ 🎙️ "Listening... (Speak 'Accept' or 'Reject')"          │
│ 📷 [ CAPTURE ROAD DAMAGE PHOTO ]                         │
└──────────────────────────────────────────────────────────┘
```

### 9.3 Multimodal In-Cab Voice Copilot
* **Speech Recognition**: Web Speech API (`webkitSpeechRecognition`) running directly on the mobile edge browser.
* **Multilingual Text-to-Speech**: Real-time synthesized spoken voice alerts in English, Hindi, Marathi, and Tamil.
* **Voice Command Grammars**:
  - *"Accept detour"* $\implies$ Triggers `POST /api/driver/decision` (`decision = 'accept'`).
  - *"Report flood"* $\implies$ Opens camera incident capture screen.
  - *"Read alert"* $\implies$ Speaks the 2-sentence Gemini summary aloud.

### 9.4 1-Tap AI Recommendation Acknowledgment Flow
1. Notification arrives via WebSocket or Web Push API.
2. Phone vibrates (Haptic pattern: `[200ms, 100ms, 200ms]`).
3. Driver taps **ACCEPT DETOUR**:
   - Local polyline switches instantly on the map canvas.
   - Acknowledgment packet sent to backend: `POST /api/driver/decision`.
   - Driver compliance score incremented by $+0.05$.

### 9.5 Camera-Based Incident Ingestion & Edge Sync
1. Driver taps **Capture Road Damage Photo**.
2. Camera captures image $\rightarrow$ compressed to JPEG (max $800\text{ KB}$, 1080p).
3. If online: Dispatched to `POST /api/driver/incidents` for immediate Gemini Vision analysis.
4. If offline: Saved to IndexedDB `offline_incidents` store; service worker syncs automatically upon cellular handshake.

### 9.6 Peer-to-Peer (P2P) Offline Bluetooth/WebRTC Mesh Relay
* In total cellular blackouts, the Driver PWA initializes WebRTC / Web Bluetooth beacons.
* When Truck A passes Truck B in opposite directions, hazard geofence metadata packets are exchanged peer-to-peer without internet infrastructure.

---

## 10. Scenario Sandbox & Baseline vs. AI Benchmarking Module

### 10.1 Disaster Scenario Catalog
```
┌──────────────────────────────┬─────────────────────────┬─────────────────────────────────────────────────┐
│ Scenario Key                 │ Trigger Event & Location│ Primary Impact on Infrastructure                │
├──────────────────────────────┼─────────────────────────┼─────────────────────────────────────────────────┤
│ `monsoon_flood_kolhapur`     │ 220mm Rain / Panchganga │ NH-48 Western Highway cut off; bridges flooded. │
│ `cyclone_biparjoy_gujarat`   │ Category 3 Storm Surge  │ Kandla & Mundra coastal port approaches blocked.│
│ `landslide_western_ghats`    │ Mountain Ridge Collapse │ Mumbai-Goa Konkan rail & mountain pass severed. │
│ `interstate_border_gridlock` │ Checkpoint Disruption   │ 40km freight blockade; cold-chain spoilage risk.│
└──────────────────────────────┴─────────────────────────┴─────────────────────────────────────────────────┘
```

### 10.2 Dual-Track Comparative Simulation Engine
When an operator triggers `/api/scenarios/{key}/trigger`:
1. The backend forks the world state into two parallel simulation threads:
   - **Track A (Static Baseline)**: Vehicles maintain fixed routes; zero disruption reaction.
   - **Track B (REGC Autonomous AI)**: Vehicles dynamically reroute, divert to maritime ports, or hold safe.
2. Both tracks advance synchronously tick-by-tick.

### 10.3 Quantitative Delta Analytics & Reporting
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         BASELINE VS. REGC AI COMPARATIVE REPORT                                  │
├──────────────────────────────────┬───────────────────┬───────────────────┬───────────────────────┤
│ Operational Metric               │ Static Baseline   │ REGC Autonomous   │ Delta Improvement (%) │
├──────────────────────────────────┼───────────────────┼───────────────────┼───────────────────────┤
│ Medical Deliveries on SLA        │ 62.4%             │ **99.2%**         │ **+36.8% Gain**       │
│ Hospital Stockout Duration       │ 142.0 hours       │ **6.5 hours**     │ **95.4% Reduction**   │
│ Cold-Chain Vaccine Spoilage      │ 450 units ($22k)  │ **0 units ($0)**  │ **100% Spoilage Saved**│
│ Fleet Fuel Consumption           │ 8,420 Liters      │ **6,110 Liters**  │ **27.4% Fuel Saved**  │
│ Total Carbon Emissions ($CO_2$)  │ 22.4 Metric Tons  │ **16.2 Metric Tons│ **27.7% Decarbonized**│
│ Fleet In-Gridlock Idle Time      │ 380 hours         │ **18 hours**      │ **95.2% Idle Saved**  │
└──────────────────────────────────┴───────────────────┴───────────────────┴───────────────────────┘
```

---

## 11. Trust, Cryptographic Ledger & UN SDG Impact Verification

### 11.1 SHA-256 Chained Blockchain Audit Ledger
Every system mutation (disruption detection, AI reroute generation, driver decision acknowledgment, delivery confirmation) creates an immutable block:
```python
# Audit Block Cryptographic Hash Formula
block_payload = {
    "index": block_index,
    "timestamp": "2026-09-01T05:30:00.000Z",
    "decision_type": "AI_REROUTE_PORT",
    "entity_id": vehicle_id,
    "action": "DIVERT_JNPT_SEALINK",
    "explanation": "NH-48 flood avoidance; 500 units insulin saved.",
    "previous_hash": "a8f3b29c017e4d588f...",
    "nonce": calculated_nonce
}
block_hash = hashlib.sha256(json.dumps(block_payload, sort_keys=True).encode()).hexdigest()
```

### 11.2 Merkle Inclusion Proofs & Public Verification QR Code
1. Completed relief shipments generate a Merkle Root Hash $\mathcal{M}_{root}$ representing the entire transit journey.
2. A physical or digital **Relief Delivery QR Code** is generated:
   `https://regc.org/governance/verify/0x7f83b1a2...`
3. Hospital staff scan the QR code to verify:
   - Authenticity of shipment origin.
   - Continuous cold-chain temperature compliance ($2^\circ\text{C} - 8^\circ\text{C}$).
   - Algorithmic audit trail of every detour authorized during transit.

### 11.3 Real-Time UN SDG Metric Calculation Engine
* **SDG 3 Index**:
  $$\text{Score}_{\text{SDG3}} = \left( 1.0 - \frac{\text{Stockout Hours Incurred}}{\text{Total Facility Operational Hours}} \right) \times 100$$
* **SDG 12 Index (Spoilage Reduction)**:
  $$\text{Score}_{\text{SDG12}} = \left( \frac{\text{Perishable Units Delivered Undamaged}}{\text{Total Perishable Units Loaded}} \right) \times 100$$

---

## 12. UI/UX Design System & Component Library

### 12.1 Button Components
```
┌───────────────┬──────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Variant       │ Visual Styling Tokens            │ Usage Specification                                    │
├───────────────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Primary Radar │ Bg: `#00E5FF`, Text: `#070A13`,  │ Main CTAs: Launch Simulation, Accept Detour, Dispatch  │
│               │ font-weight: 700, rounded-lg     │                                                        │
├───────────────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ AI Neural     │ Bg: `#8B5CF6`, Text: `#FFFFFF`,  │ Trigger Scenario, Run Gemini Signal Analysis, Reroute  │
│               │ font-weight: 600, rounded-lg     │                                                        │
├───────────────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Destructive   │ Bg: `#EF4444`, Text: `#FFFFFF`,  │ Emergency Stop, Report Breakdown, Reject Detour        │
│               │ font-weight: 600, rounded-lg     │                                                        │
├───────────────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ HUD Ghost     │ Bg: transparent, Border: 1px     │ Secondary actions, Layer toggles, Metric filters       │
│               │ `#00E5FF`, Text: `#00E5FF`       │                                                        │
└───────────────┴──────────────────────────────────┴────────────────────────────────────────────────────────┘
```

### 12.2 Form & Input Components
* **Text & Select Inputs**: Dark surface (`#0F172A`), border (`#1E293B`), focus border glow (`#00E5FF`, `box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.25)`).
* **Slider Controls (Pareto Weights)**: Custom webkit slider track with neon cyan fill and glowing draggable thumb.

### 12.3 Card & HUD Glassmorphism Panels
* **Standard HUD Card**:
  ```css
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  ```

### 12.4 Geospatial Markers & Hazard Polygons
* **Vehicle Pin**: 32x32px circular SVG with pulsing outer halo, colored by commodity urgency, with directional heading pointer.
* **Hazard Zone**: Canvas-rendered polygon with animated diagonal hatch pattern and translucent red fill (`rgba(239, 68, 68, 0.25)`).

### 12.5 Microinteractions, Transitions & Sound System
* **Audio Alerts**: Optional Web Audio API synthetic radar chime (880Hz sine wave tone, 120ms) on critical disaster detection.
* **Data Refresh Flash**: Numerical counters flash `#00E5FF` for 300ms upon WebSocket state mutation.

### 12.6 Responsive Breakpoints & Device Support
* **Desktop (Admin Cockpit)**: $\ge 1280\text{px}$ (Dual-panel split layout, 3D WebGL map, multi-chart dashboard).
* **Tablet (Field Dispatch)**: $768\text{px} - 1279\text{px}$ (Collapsible sidebar, touch-enabled map).
* **Mobile (Driver PWA)**: $360\text{px} - 767\text{px}$ (Single-column card stack, high-contrast large touch targets $\ge 48\text{px}$, bottom navigation bar).

---

## 13. Database Design & Complete Entity Schema

### 13.1 Database Technology Stack
* **Primary Database Engine**: PostgreSQL 15+ (Production) / SQLite 3.39+ with WAL mode (Local Edge Development).
* **ORM Layer**: SQLAlchemy 2.0 (Python) with complete async session support (`asyncpg` / `aiosqlite`).
* **Caching & Message Broker**: Redis 7.0 (WebSocket pub/sub, rate limiting, route caching).

### 13.2 Core Entity Definitions (SQL DDL)

```sql
-- 1. Facilities & Multimodal Hubs
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    client_id INTEGER REFERENCES integration_clients(id),
    city VARCHAR(80) NOT NULL,
    facility_type VARCHAR(40) NOT NULL CHECK (facility_type IN ('warehouse', 'port', 'hospital', 'relief_center', 'hub')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    base_capacity_units INTEGER NOT NULL,
    current_inventory_units INTEGER DEFAULT 0,
    initial_inventory_units INTEGER DEFAULT 0,
    queue_capacity_units INTEGER DEFAULT 0,
    has_cold_storage BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_facilities_geo ON facilities(latitude, longitude);
CREATE INDEX idx_facilities_type ON facilities(facility_type);

-- 2. Intermodal Maritime Links
CREATE TABLE port_links (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES facilities(id),
    port_id INTEGER NOT NULL REFERENCES facilities(id),
    reserved_capacity_units INTEGER DEFAULT 0,
    spillover_threshold_pct DOUBLE PRECISION DEFAULT 80.0,
    max_spillover_units INTEGER DEFAULT 0,
    nautical_transit_minutes DOUBLE PRECISION DEFAULT 180.0,
    active BOOLEAN DEFAULT TRUE
);

-- 3. Driver Profiles & Behavioral Metrics
CREATE TABLE driver_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    client_id INTEGER REFERENCES integration_clients(id),
    override_rating DOUBLE PRECISION DEFAULT 1.0,
    confidence DOUBLE PRECISION DEFAULT 0.5,
    accept_recommendation_bias DOUBLE PRECISION DEFAULT 0.5,
    preferred_language VARCHAR(10) DEFAULT 'en',
    active BOOLEAN DEFAULT TRUE
);

-- 4. Vehicle Fleet & Kinematics State
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(80) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES integration_clients(id),
    vehicle_type VARCHAR(40) DEFAULT 'truck' CHECK (vehicle_type IN ('truck', 'refrigerated_van', 'cargo_boat', 'drone')),
    payload_capacity_units INTEGER NOT NULL,
    home_facility_id INTEGER NOT NULL REFERENCES facilities(id),
    current_facility_id INTEGER REFERENCES facilities(id),
    driver_profile_id INTEGER NOT NULL REFERENCES driver_profiles(id),
    default_objective_id INTEGER,
    average_speed_kmph DOUBLE PRECISION DEFAULT 48.0,
    emission_kg_per_km DOUBLE PRECISION DEFAULT 1.6,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    current_heading DOUBLE PRECISION DEFAULT 0.0,
    cargo_temperature_c DOUBLE PRECISION DEFAULT 4.0,
    status VARCHAR(40) DEFAULT 'idle' CHECK (status IN ('idle', 'loading', 'in_transit', 'holding', 'unloading', 'breakdown')),
    available_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- 5. Objectives & Supply Commodities
CREATE TABLE objectives (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    client_id INTEGER REFERENCES integration_clients(id),
    commodity VARCHAR(80) NOT NULL CHECK (commodity IN ('medicine', 'vaccines', 'blood_units', 'food_rations', 'potable_water', 'fuel', 'equipment')),
    origin_facility_id INTEGER NOT NULL REFERENCES facilities(id),
    destination_facility_id INTEGER NOT NULL REFERENCES facilities(id),
    dispatch_interval_minutes INTEGER DEFAULT 120,
    loading_duration_minutes INTEGER DEFAULT 30,
    unloading_duration_minutes INTEGER DEFAULT 35,
    sla_minutes INTEGER DEFAULT 720,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    assigned_vehicle_ids JSONB DEFAULT '[]'::jsonb,
    fallback_facility_ids JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ingested Disruption & Disaster News Events
CREATE TABLE news_events (
    id SERIAL PRIMARY KEY,
    original_date DATE NOT NULL,
    simulation_date DATE NOT NULL,
    city VARCHAR(80) NOT NULL,
    category VARCHAR(80) NOT NULL,
    headline TEXT NOT NULL,
    relevant BOOLEAN DEFAULT FALSE,
    impact_type VARCHAR(80) DEFAULT 'none',
    impact_score DOUBLE PRECISION DEFAULT 0.0,
    hazard_lat DOUBLE PRECISION,
    hazard_lng DOUBLE PRECISION,
    hazard_radius_km DOUBLE PRECISION DEFAULT 25.0,
    model_probability DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_news_simulation_date ON news_events(simulation_date);

-- 7. Autonomous AI Recommendations & Counterfactuals
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    simulation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    objective_id INTEGER NOT NULL REFERENCES objectives(id),
    current_facility_id INTEGER REFERENCES facilities(id),
    original_destination_id INTEGER NOT NULL REFERENCES facilities(id),
    recommended_destination_id INTEGER REFERENCES facilities(id),
    action VARCHAR(80) NOT NULL CHECK (action IN ('continue', 'reroute_warehouse', 'reroute_port', 'hold_safe', 'defer_dispatch')),
    explanation TEXT NOT NULL,
    structured_explanation JSONB DEFAULT '{}'::jsonb,
    counterfactual TEXT DEFAULT '',
    score_breakdown JSONB DEFAULT '{}'::jsonb,
    baseline_cost DOUBLE PRECISION DEFAULT 0.0,
    recommended_cost DOUBLE PRECISION DEFAULT 0.0,
    financial_impact_usd DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(40) DEFAULT 'suggested',
    confidence DOUBLE PRECISION DEFAULT 0.5
);

-- 8. Driver Acknowledgment Decisions
CREATE TABLE driver_decisions (
    id SERIAL PRIMARY KEY,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id),
    driver_profile_id INTEGER NOT NULL REFERENCES driver_profiles(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    decision VARCHAR(40) NOT NULL CHECK (decision IN ('accept', 'reject', 'timeout')),
    actual_trip_cost DOUBLE PRECISION DEFAULT 0.0,
    recommended_trip_cost DOUBLE PRECISION DEFAULT 0.0,
    rating_delta DOUBLE PRECISION DEFAULT 0.0,
    note TEXT DEFAULT ''
);

-- 9. Driver Ground Incidents & Vision Ingestions
CREATE TABLE driver_incidents (
    id SERIAL PRIMARY KEY,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    driver_profile_id INTEGER NOT NULL REFERENCES driver_profiles(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    city VARCHAR(80) NOT NULL,
    incident_type VARCHAR(80) NOT NULL,
    severity DOUBLE PRECISION DEFAULT 0.6,
    image_s3_url TEXT,
    vision_analysis JSONB DEFAULT '{}'::jsonb,
    note TEXT DEFAULT '',
    linked_news_event_id INTEGER REFERENCES news_events(id)
);
```

### 13.3 Auxiliary & Ledger Tables
* `blockchain_ledger`: Index, Timestamp, Decision Type, Entity ID, Action, Hash, Previous Hash, Nonce.
* `metrics_snapshots`: Captured At, $CO_2$ Saved, Stockouts Prevented, SLA Attainment %, Active Fleet Count.
* `integration_clients`: B2B Client ID, Name, API Key Hash, Rate Limit, Webhook URL.

---

## 14. Security, Governance & Fault Tolerance

### 14.1 Authentication & Session Management
* **Admin & Dispatcher Auth**: JSON Web Tokens (JWT) signed with HMAC-SHA256 (15-min expiry) with rotating Refresh Tokens (7 days) in `HttpOnly; Secure; SameSite=Strict` cookies.
* **Driver Mobile Auth**: Fast 4-digit PIN + Driver ID with biometric local authentication (WebAuthn / TouchID).
* **B2B API Auth**: Cryptographic Bearer Tokens with `solv_live_...` prefix validated against SHA-256 hashed database keys.

### 14.2 Role-Based Access Control (RBAC) Matrix
```
┌──────────────────────────────────────┬─────────────┬────────────┬────────────┬─────────────┐
│ Capability / Resource                │ Super Admin │ Dispatcher │ Field Driver│ B2B Partner │
├──────────────────────────────────────┼:-----------:┼:----------:┼:----------:┼:-----------:│
│ Start / Pause / Reset Simulation     │      ✅     │     ❌     │     ❌     │     ❌      │
│ Trigger Disaster Scenarios           │      ✅     │     ✅     │     ❌     │     ❌      │
│ Override AI Decision Manually        │      ✅     │     ✅     │     ❌     │     ❌      │
│ Accept / Decline In-Cab Reroute      │      ❌     │     ❌     │     ✅     │     ❌      │
│ Submit Incident Photo & Note         │      ✅     │     ✅     │     ✅     │     ❌      │
│ Create Objectives & Inject Waybills  │      ✅     │     ✅     │     ❌     │     ✅      │
│ Access Audit Ledger & Merkle Proofs  │      ✅     │     ✅     │     ❌     │     ✅      │
└──────────────────────────────────────┴─────────────┴────────────┴────────────┴─────────────┘
```

### 14.3 Prompt Injection Defense & Input Sanitization
* All incoming driver notes, incident text, and scraped news feeds pass through a sanitization layer:
  1. HTML and script stripping via `nh3` / `bleach`.
  2. Prompt isolation wrapper forbidding system instruction overrides before forwarding to Gemini.

### 14.4 API Security & Rate Limiting
* Public endpoints rate-limited via Redis token-bucket filter (100 req/min/IP).
* B2B endpoints enforced at 1,000 req/min with strict CORS whitelist.

### 14.5 Zero-Crash Graceful Degradation Architecture
```
┌─────────────────────────┬─────────────────────────────────────┬──────────────────────────────────────────┐
│ Component Failure       │ Primary System                      │ Automatic Graceful Fallback              │
├─────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────────┤
│ Gemini LLM / Vision Out │ Google Vertex AI / Gemini 2.0 Flash │ Local Deterministic Regex Classifier     │
│ OSRM Routing Server Down│ Project-OSRM Driving Engine         │ Great-Circle Haversine Tortuosity Engine │
│ Complete Cellular Loss  │ Central WebSocket API Server        │ PWA IndexedDB Store + P2P Mesh Relay     │
│ Database Disk Lock      │ PostgreSQL Main Database            │ In-Memory Fallback Event Priority Queue  │
└─────────────────────────┴─────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 15. External Integrations & API Standards

### 15.1 External Integrations Directory
| Integration Provider | Technical Protocol | Purpose in System |
|---|---|---|
| **Google Gemini API** | HTTPS / REST (`google-genai` SDK) | Multimodal road damage photo analysis, news extraction, plain-language driver translations. |
| **Project-OSRM** | HTTP REST (`/route/v1/driving`) | Exact road polyline geometry, turn-by-turn routing, driving durations. |
| **OpenWeatherMap / IMD**| REST JSON / GeoJSON | Live precipitation, cyclone trajectories, and wind speed feeds. |
| **Mapbox GL / Deck.gl**| WebGL 2.0 / Vector Tiles | 3D terrain elevation, dynamic flood inundation layers, vehicle kinematics. |
| **Cal.com / Webhooks** | HTTP POST (HMAC-SHA256 Signed) | Automated emergency dispatch notifications to external hospital systems. |

### 15.2 RESTful API Design Standards & Core Endpoints
All API endpoints conform to JSON:API standard formatting:
```
GET  /api/health                             -> System health & worker telemetry
GET  /api/facilities                         -> List warehouses, ports, hospitals with inventory
GET  /api/vehicles                           -> Active fleet telemetry, coordinates, and temperatures
POST /api/simulation/start                   -> Initialize / resume digital twin tick loop
POST /api/simulation/pause                   -> Pause digital twin execution
POST /api/simulation/speed?speed=120.0       -> Set simulation acceleration (1x to 500x)
POST /api/driver/decision                    -> Driver submits ACCEPT / REJECT decision
POST /api/driver/incidents                   -> Multipart form image & incident upload
POST /api/scenarios/{key}/trigger            -> Inject disaster scenario disruption
GET  /api/scenarios/{key}/compare            -> Side-by-side Baseline vs. AI delta metrics
GET  /api/metrics/sdg                        -> Real-time aggregated UN SDG impact scores
GET  /api/governance/verify/:hash            -> Cryptographic Merkle audit chain verification
WS   /ws/operations                          -> Full-duplex 1 Hz operations stream
```

### 15.3 Full-Duplex WebSocket Protocol (`/ws/operations`)
* **Frame Rate**: $1.0\text{ Hz}$.
* **Frame Schema**:
```json
{
  "type": "TELEMETRY_FRAME",
  "tick": 1420,
  "simulation_time": "2026-09-01T05:45:00Z",
  "speed_multiplier": 120.0,
  "vehicles": [
    {
      "id": 1,
      "identifier": "TRK-001",
      "lat": 16.7050,
      "lng": 74.2433,
      "heading": 138.4,
      "status": "in_transit",
      "cargo_type": "medicine",
      "cargo_temp_c": 4.2,
      "polyline": "g_ocF...w~@"
    }
  ],
  "hazards": [
    {
      "id": 8,
      "type": "FLOOD",
      "lat": 16.7050,
      "lng": 74.2433,
      "radius_km": 35.0,
      "severity": 0.88
    }
  ],
  "active_metrics": {
    "on_time_delivery_pct": 99.4,
    "stockouts_prevented": 14,
    "co2_saved_kg": 4210.8
  }
}
```

---

## 16. Technical Architecture & Infrastructure

### 16.1 System Architecture Overview
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER (EDGE & WEB)                                  │
│  React 18 + Vite + Deck.gl (Admin Cockpit)    │  React 18 PWA + IndexedDB + Voice (Driver Edge)  │
└─────────────────────────────────┬─────────────────────────────────────────┬──────────────────────┘
                                  │ HTTPS / WebSocket                       │ HTTPS / Offline Sync
                                  ▼                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION LAYER (FASTAPI ASYNC)                                 │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ Simulation Tick Loop   │  │ Gemini 2.0 Multimodal  │  │ Multimodal Graph Solver            │  │
│  │ - 1x to 500x speed     │  │ - Road vision analysis │  │ - OSRM Road Router                 │  │
│  │ - Kinematic equations  │  │ - News NLP geofencing  │  │ - Maritime Coastal Port Graph      │  │
│  └────────────────────────┘  └────────────────────────┘  │ - Haversine Tortuosity Fallback    │  │
│  ┌────────────────────────┐  ┌────────────────────────┐  └────────────────────────────────────┘  │
│  │ Deep Q-Network Agent   │  │ Thermal Spoilage Engine│  ┌────────────────────────────────────┐  │
│  │ - PyTorch DQN Policy   │  │ - Newton Cooling Law   │  │ SHA-256 Merkle Audit Ledger        │  │
│  │ - Multi-Objective MOO  │  │ - Cold-Chain Overrides │  │ - Tamper-Proof Cryptographic Chain │  │
│  └────────────────────────┘  └────────────────────────┘  └────────────────────────────────────┘  │
└──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                DATA & PERSISTENCE LAYER (ACID)                                   │
│  PostgreSQL 15 (Relational Data & JSONB)  │  Redis 7 (WebSocket Pub/Sub)  │  AWS S3 (Damage Media)│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 16.2 Complete Technology Stack
* **Frontend**: React 18, Vite, Tailwind CSS 3, Deck.gl, Mapbox GL JS, Lucide Icons, Framer Motion.
* **Driver Edge**: React 18 PWA, Workbox Service Worker, IndexedDB (`idb-keyval`), Web Speech API.
* **Backend**: Python 3.11, FastAPI (Async), Uvicorn, SQLAlchemy 2.0, Pydantic v2.
* **AI & Optimization**: Google Gemini 2.0 Flash API, PyTorch 2.2 (DQN), NetworkX, NumPy, SciPy.
* **Routing**: Project-OSRM, OpenStreetMap Data.
* **Database & Cache**: PostgreSQL 15, Redis 7, SQLite (Edge/Dev).
* **DevOps & Containers**: Docker, Docker Compose, GitHub Actions CI/CD.

### 16.3 High-Level Component Interaction Flow
1. Disruption event occurs $\rightarrow$ Gemini extracts geocodes and severity.
2. Digital twin detects route collision $\rightarrow$ DQN & Pareto MOO solver computes bypass.
3. Decision converted to plain language $\rightarrow$ Broadcast over WebSocket.
4. Driver PWA displays HUD alert $\rightarrow$ Driver speaks *"Accept"*.
5. Vehicle polyline switches to bypass $\rightarrow$ SHA-256 hash appended to audit ledger.

### 16.4 Performance & Latency Budgets
* **Simulation Tick Calculation**: $\le 50\text{ms}$ for 500 active trucks.
* **RL Decision & Reroute Inference**: $\le 300\text{ms}$.
* **Gemini Ingestion & Geofence Pipeline**: $\le 1.8\text{ seconds}$.
* **WebSocket Jitter**: $\le 20\text{ms}$ at 1 Hz broadcast rate.

---

## 17. Future Expansion Roadmap

### 17.1 Phase 2: Multi-Agent Autonomous Relief Auctions (Months 6–12)
* Inter-agency capacity sharing using the **Contract Net Protocol (CNP)**.
* Independent relief fleets (e.g., Red Cross, World Food Programme, NDRF) autonomously bid on emergency delivery tasks based on marginal battery/fuel cost.

### 17.2 Phase 3: Satellite Synthetic Aperture Radar (SAR) Ingestion (Months 12–24)
* Direct ingestion of Sentinel-1 SAR satellite imagery to autonomously detect standing floodwaters through cloud cover at $10\text{m}$ spatial resolution.

### 17.3 Scalability & Enterprise Multi-Tenancy Provisions
* Database partitioning on `client_id` enabling commercial pharmaceutical distributors to run isolated virtual supply chain twins on shared cluster infrastructure.

---

## 18. Implementation Phases & Delivery Plan

### 18.1 Development Phases
```
┌─────────┬──────────────┬────────────────────────────────────────────────────────────────────────┐
│ Phase   │ Duration     │ Key Engineering Deliverables                                           │
├─────────┼──────────────┼────────────────────────────────────────────────────────────────────────┤
│ Phase 0 │ Weeks 1–2    │ Schema DDL, Database Seeder, OSRM Container Setup, CI/CD Pipeline      │
│ Phase 1 │ Weeks 3–6    │ Discrete-Event Tick Engine, Multimodal Graph Solver, Fallback Geometry │
│ Phase 2 │ Weeks 7–10   │ Gemini 2.0 Vision & NLP Ingestion Pipeline, Disruption Geofencing      │
│ Phase 3 │ Weeks 11–14  │ PyTorch DQN Agent, Multi-Objective Pareto Utility, Cold-Chain Physics  │
│ Phase 4 │ Weeks 15–18  │ React Admin Cockpit (Deck.gl), WebSocket Streaming, Driver Mobile PWA   │
│ Phase 5 │ Weeks 19–22  │ SHA-256 Merkle Ledger, Scenario Sandbox, Baseline vs. AI Benchmarks   │
│ Phase 6 │ Weeks 23–24  │ Load Testing (500 Trucks), Security Penetration Testing, Production QA │
└─────────┴──────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 18.2 Definition of Done (DoD)
* All Functional Requirements (FR-1 through FR-12) pass automated integration tests.
* Core Web Vitals: LCP $< 1.8\text{s}$, FID $< 50\text{ms}$, CLS $< 0.05$.
* Zero system crashes during simulated 100% loss of external APIs (Gemini, OSRM).
* Code test coverage $\ge 85\%$ across backend services.

### 18.3 Hackathon 48-Hour Rapid Build Sprint Schedule
* **Hours 00–08**: Database schema, seed data, and discrete-event tick loop (`simulation.py`).
* **Hours 08–18**: Gemini news parser, road damage image analyzer, and OSRM routing.
* **Hours 18–30**: PyTorch DQN decision engine, cold-chain thermal physics, and WebSockets.
* **Hours 30–42**: React 3D Admin Dashboard and Driver Mobile PWA with voice recognition.
* **Hours 42–48**: Scenario presets (Cyclone, Flood), comparative delta metrics, pitch rehearsal.

---

## 19. Appendices

### Appendix A: Mathematical Glossary & Nomenclature
* $s \in \mathbb{R}^{10}$: Normalized 10-dimensional state vector describing fleet and disruption status.
* $Q(s, a; \theta)$: Action-value function parameterized by deep neural network weights $\theta$.
* $U(a)$: Multi-objective utility balancing Travel Time, Cost, $CO_2$, and Stockout Penalties.
* $T_{\text{cargo}}$: Internal temperature of refrigerated pharmaceutical cargo ($^\circ\text{C}$).
* $\tau = 1.28$: Empirical road tortuosity multiplier applied to great-circle Haversine paths.
* $\mathcal{M}_{root}$: Cryptographic Merkle Root Hash guaranteeing delivery integrity.

### Appendix B: Revision History
| Version | Date | Author / Team | Summary of Changes |
|---|---|---|---|
| **1.0.0** | June 2025 | Product Team | Initial SRS draft for basic road simulation. |
| **1.2.4** | Dec 2025 | Engineering Team | Added OSRM routing and driver mobile view. |
| **2.0.0** | Sept 2026 | Technomancers Core | Complete rewrite: Gemini 2.0 Vision, Deep RL DQN, Cold-Chain IoT, Merkle Proofs, 3D Inundation, and P2P Mesh. |

### Appendix C: Team & Institutional Contact Information
* **Lead Architecture**: Technomancers Engineering Team
* **Target Competition**: Google Solution Challenge / National Disaster Innovation Hackathon
* **Repository URI**: `https://github.com/Technomancers-GDG/solv-v2`
* **Licensing**: Apache 2.0 Open Source & Humanitarian Defense License

---
*— END OF SOFTWARE REQUIREMENTS SPECIFICATION (SRSv2) —*

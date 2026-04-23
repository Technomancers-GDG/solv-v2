# Frontend Implementation Plan

## Overview

The frontend is a React + Vite SPA that serves as the admin and dispatcher control center for the Resilient Essential Goods Coordination platform. Currently, the backend is fully implemented with simulation, rerouting, event ingestion, and metrics. The frontend exists as a skeleton (`App.jsx`) with tab navigation but needs substantial build-out across multiple feature areas.

**Current State:**
- Basic tab-based navigation (Network, Objectives, Live Ops, Scenarios, Driver Mobile, Events, Impact)
- WebSocket connection for live simulation updates
- REST API calls for data fetching and submission
- Seed forms for facilities, vehicles, objectives, port links, and driver incidents
- Minimal styling

**Target State:**
- Polished, production-ready multi-view dashboard
- Real-time operational visibility with clear decision support
- Explainable AI recommendations with driver feedback loops
- Scenario replay and baseline comparison
- Impact reporting with SDG metrics and beneficiary focus
- Mobile-friendly driver interface

---

## Phase 1: Foundation & Layout (Week 1)

### 1.1 Establish Component Architecture

**Files to Create:**
- `src/components/` - Component directory structure
- `src/components/common/Header.jsx` - Hero, title, simulation controls
- `src/components/common/TabNavigation.jsx` - Tab switcher
- `src/components/common/StatusPill.jsx` - Metric display (already in App, extract)
- `src/components/common/Banner.jsx` - Error/success messages
- `src/components/common/LoadingSpinner.jsx` - Loading state

**Key Updates:**
- Move tab content into separate view components instead of inline JSX
- Extract form components into dedicated files
- Create shared UI component library for consistent styling

### 1.2 Improve Styling & Visual Design

**Files to Update:**
- `src/styles.css` - Comprehensive stylesheet rewrite

**Goals:**
- Define color palette (dark mode or light mode based on preference)
- Implement responsive grid layout for dashboard
- Create utility classes for common patterns (cards, buttons, inputs, badges)
- Add animations for state transitions
- Ensure mobile responsiveness (375px to 1920px breakpoints)
- Add accessibility (ARIA labels, focus states, high contrast)

**Key Styles:**
- Hero section with controls
- Tab bar with active state
- Card-based layouts for data display
- Real-time metric tiles with alert colors
- Status badges (green/yellow/red for utilization, delays, etc.)
- Modal and form overlays

### 1.3 Set Up State Management & Hooks

**Files to Create:**
- `src/hooks/useApi.js` - Centralized API call hook with error handling
- `src/hooks/useWebSocket.js` - WebSocket connection management
- `src/hooks/useLocalStorage.js` - Persist user preferences
- `src/hooks/usePagination.js` - Handle long lists with pagination
- `src/context/DataContext.jsx` - Optional: centralized data context (alternative to prop drilling)

**Goals:**
- Replace ad-hoc `apiFetch` with reusable hook
- Better error boundaries
- Automatic retry logic for failed requests
- WebSocket reconnection logic

---

## Phase 2: Network Setup View (Week 2)

### 2.1 Facilities Management

**File:** `src/components/views/NetworkSetupView.jsx`

**Features:**
- **Facility List Table:**
  - Display all facilities (warehouses & ports) with columns: Name, City, Type, Capacity, Current Inventory, Utilization %, Status
  - Sortable columns
  - Filterable by city, type, and status
  - Inline quick edit (double-click to edit a field)
  - Delete button with confirmation dialog
  - Color-code utilization (green <70%, yellow 70-90%, red >90%)

- **Facility Form Modal:**
  - Create new facility form in modal
  - Fields: name, city (dropdown), type (warehouse/port), latitude, longitude, base capacity, initial inventory, queue capacity
  - Validation: required fields, unique name, valid coordinates
  - Pre-fill latitude/longitude for major Indian cities
  - Toggle between advanced/simple mode

### 2.2 Port Links Management

**Features:**
- **Port Link Table:**
  - Columns: Warehouse, Port, Reserved Capacity, Spillover Threshold %, Max Spillover, Status
  - Show linked warehouse-port pairs
  - Highlight port links with active spillover
  - Quick delete and edit buttons

- **Port Link Form:**
  - Dropdowns for source warehouse and destination port
  - Capacity and threshold inputs
  - Visual indication of how spillover affects effective warehouse capacity

### 2.3 Network Visualization (Optional, Phase 2.5)

**Features:**
- Simple force-directed graph showing facilities as nodes and port links as edges
- Color nodes by type and utilization
- Click node to view/edit facility
- Show active incident count on nodes
- Use a library like `react-force-graph` or `d3-react`

---

## Phase 3: Fleet & Objectives View (Week 3)

### 3.1 Vehicle (Truck) Management

**File:** `src/components/views/FleetView.jsx`

**Features:**
- **Vehicle List:**
  - Table with columns: Identifier, Type, Capacity, Home Facility, Current Facility, Driver, Status, Available At
  - Filter by status (idle, loading, unloading, in_transit, resting, waiting, offline)
  - Sortable columns
  - Inline edit for current facility, status, objective

- **Vehicle Form Modal:**
  - Create new vehicle
  - Fields: identifier, type, payload capacity, home facility, driver profile, speed, emissions, rest config
  - Auto-suggest identifier based on vehicle type and number
  - Visual preview of driver rating and confidence

- **Bulk Actions:**
  - Assign multiple vehicles to objective
  - Retire/activate vehicles
  - Reset all idle vehicles to home facility

### 3.2 Driver Profiles Management

**File:** `src/components/views/DriversView.jsx`

**Features:**
- **Driver List:**
  - Table: Name, Override Rating, Confidence, Accept Bias, Active Status, # of Vehicles
  - Color-code override rating (red <0.7, yellow 0.7-1.0, green >1.0 means driver is outperforming)
  - Click to expand and see vehicle assignments and decision history

- **Driver Decision History:**
  - When expanding a driver, show recent recommendations they accepted/ignored
  - Show recommendation text, why they decided yes/no, and the outcome (was the decision better or worse)

- **Driver Bias Tuning (Advanced):**
  - Sliders for override_rating, confidence, accept_recommendation_bias
  - Visual preview of how changes affect future decisions

### 3.3 Objectives (Delivery Routes) Management

**File:** `src/components/views/ObjectivesView.jsx`

**Features:**
- **Objective List:**
  - Table: Name, Commodity, Origin → Destination, Dispatch Interval, SLA (mins), Priority, Assigned Vehicles, Status
  - Show recent dispatch count and on-time %, missed SLA count
  - Color-code priority (critical, high, normal)
  - Edit and delete buttons

- **Objective Detail Card:**
  - Click to expand and see:
    - Full configuration (loading/unloading times, fallback facilities)
    - Assigned vehicle IDs and current vehicle state
    - Dispatch history (last 20 dispatches with times and outcomes)
    - On-time vs late shipment chart
    - Stockout risk indicator if destination is critical

- **Objective Form Modal:**
  - Create/edit objective
  - Origin and destination facility dropdowns
  - Commodity type (Medicine, Vaccine, Food Grain, Relief Kit, etc.)
  - Timing fields (dispatch interval, loading, unloading, SLA)
  - Multi-select for assigned vehicles and fallback facilities
  - Priority selector

---

## Phase 4: Live Operations Dashboard (Week 4)

### 4.1 Main Dashboard View

**File:** `src/components/views/LiveOpsView.jsx`

**Key Sections:**

#### 4.1.1 Simulation Status Bar
- Simulation state (running, paused, idle)
- Simulation clock (with real-time updates)
- Playback speed multiplier
- Queued events count
- Elapsed sim time vs real time ratio

#### 4.1.2 Key Metrics Row
- Display SDG metrics:
  - **On-Time Delivery %** (green >95%, yellow 85-95%, red <85%)
  - **Stockouts Prevented** (absolute count)
  - **CO2 Saved (kg)** vs baseline
  - **Idle Time Prevented (hrs)**
  - **Average Utilization %** (network-wide)
  - **Critical Deliveries Saved**
  
- Each metric as a card with:
  - Large number
  - Trend indicator (↑ up, ↓ down, → flat)
  - Comparison to baseline if available
  - Mini sparkline chart (optional)

#### 4.1.3 Facility Load Summary
- **Warehouse Utilization Heatmap:**
  - Show 6-8 critical facilities (highest utilization)
  - Color-coded bars: green <70%, yellow 70-90%, red >90%
  - Bar length = utilization %
  - Current units / max capacity text inside bar
  - Click to open facility detail modal

- **Port Congestion Indicator:**
  - For each linked port, show spillover status
  - Alert if spillover is active or forecast

#### 4.1.4 Vehicle Status Overview
- **Status Distribution Chart:**
  - Donut chart: count of vehicles by status (idle, loading, in_transit, unloading, waiting, resting)
  - Click slice to filter table below

- **Vehicle List Table:**
  - Columns: ID, Driver, Current Facility, Next Facility, Status, ETA, Progress %, Payload, Last Action
  - Sortable, filterable
  - Color-code status (green=on-time track, yellow=delay risk, red=delayed)
  - Click row to expand vehicle detail panel

#### 4.1.5 Vehicle Detail Panel
- When a vehicle is selected, show:
  - Full state snapshot (current facility, objective, payload, progress)
  - Route progress (if in_transit): show origin → destination with progress bar
  - Next 3 scheduled stops
  - Recent recommendations (accept/ignore with outcome)
  - Driver profile quick view
  - Last 3 major events (dispatched, delayed, rerouted, etc.)

#### 4.1.6 Critical Alerts Section
- **Real-Time Alerts:**
  - Facility approaching capacity (>80%)
  - Vehicle delayed vs SLA
  - Port spillover active
  - Stock-out risk (destination critical + high ETA)
  - Driver rest override due
  - Each alert as a card with:
    - Alert type icon & severity (critical/warning/info)
    - Description
    - Affected facility/vehicle/objective
    - Time since alert
    - Dismiss button

#### 4.1.7 Recommendations & Decisions Log
- **Recommendation Cards:**
  - Show recent AI reroute recommendations (last 20)
  - Card includes:
    - Recommendation ID
    - Vehicle identifier
    - Current status (pending, accepted, ignored)
    - Recommended action (reroute to X, wait Y mins, defer dispatch)
    - Confidence score
    - Reason summary (e.g., "Port spillover: Hosur at 1800/1500 units")
    - Decision outcome if already acted upon (was it better or worse than alternative?)
    - Driver name and override rating
    - Timestamp

### 4.2 WebSocket Integration

**Goals:**
- Receive live `simulation_snapshot` payloads every 2-5 seconds (during active simulation)
- Update dashboard data without full refresh
- Show "live" badge when WebSocket is connected
- Show stale data warning if WebSocket disconnects for >30 seconds

**Implementation:**
- Use `useWebSocket` hook to manage connection
- Debounce updates to avoid re-rendering on every message
- Store last update time and show freshness indicator

### 4.3 Simulation Controls

**Controls:**
- Start, Pause, Resume, Reset buttons (already exist, refactor styling)
- Speed multiplier slider (1x to 360x)
- Jump-to-time picker (optional: jump to specific sim time)
- Show confirmation before Reset

---

## Phase 5: Scenarios & Baseline Comparison (Week 5)

### 5.1 Scenario Presets View

**File:** `src/components/views/ScenariosView.jsx`

**Features:**
- **Scenario List:**
  - Cards or table showing available scenario presets
  - For each scenario:
    - Name (e.g., "Heavy Rainfall in Coastal Corridor", "Medicine Shortage in Mumbai")
    - Description (what disruption occurs, where, when)
    - Difficulty/Impact severity badge
    - Last run timestamp
    - Buttons: "Start", "Compare", "View Results"

### 5.2 Scenario Replay Flow

**Features:**
1. **Start Scenario:**
   - Click "Start" on a scenario
   - Automatically reset simulation to seed state
   - Start simulation at 180x speed
   - Trigger the scenario disruption event (e.g., road blockage in city, severe weather, port congestion)
   - Show status: "Scenario in progress..."

2. **Monitor Scenario:**
   - Dashboard remains visible and updates live
   - Show disruption event details in a banner or modal
   - Highlight affected facilities/routes

3. **Compare Results:**
   - After scenario completes (or manually trigger comparison):
   - Display "Baseline vs AI" comparison side-by-side

### 5.3 Baseline Comparison View

**File:** `src/components/views/ScenarioComparisonView.jsx`

**Layout:**
- **Header:**
  - Scenario name and description
  - Timestamp of comparison run
  - Button to re-run comparison

- **Metrics Comparison Table:**
  - Two columns: "Baseline (No AI)" | "With AI Rerouting"
  - Rows for each metric:
    - On-Time Delivery % (with delta and % improvement)
    - Average Delay (minutes)
    - Overflow Events Count
    - Reroute Count
    - Idle Time Prevented (hours)
    - CO2 Saved (kg)
    - Stockouts Prevented (count)
    - Critical Deliveries Saved (count)
  - Highlight differences in green (improvement) or red (regression)
  - Show % improvement for each metric

- **Outcome Cards:**
  - "Impact Summary" card with brief narrative (e.g., "AI prevented 3 stockouts and saved 120 kg CO2 by rerouting 8 vehicles around the port congestion")
  - "Beneficiary Locations Served" card (regions/facilities where rerouting enabled critical delivery)

- **Decision Tree (Optional):**
  - Timeline of major decisions in AI vs baseline scenario
  - Show when reroutes happened, why, and outcome

### 5.4 Scenario History

**Features:**
- View past scenario runs with results
- Sort by scenario, date, or improvement score
- Export comparison as PDF or CSV

---

## Phase 6: Driver Mobile Interface (Week 6)

### 6.1 Driver Mobile View

**File:** `src/components/views/DriverMobileView.jsx`

**Context:**
- This view simulates a mobile interface that a real driver would see
- Shows pending instructions, current objective, next destinations
- Allows driver to accept/ignore recommendations and report incidents

**Layout (Mobile-First, 375px width):**

#### 6.1.1 Driver Header
- Driver name and vehicle ID
- Current status (in transit, at facility, resting, etc.)
- Quick status: "2 pending instructions"

#### 6.1.2 Current Objective Card
- **Current Assignment:**
  - Origin facility name + city
  - Destination facility name + city
  - Commodity type (Medicine, Food Grain, etc.)
  - Payload (units and % of capacity)
  - SLA: "Due by HH:MM"
  - Status: "On time" or "Risk" (red) or "Late" (red)

#### 6.1.3 Route Display
- **Route Summary:**
  - Step-by-step instructions (text-based, no map in MVP)
  - Example: "1. Load at Delhi National Medical Reserve → 2. Drive to Jaipur Relief Consolidation Hub (280 km, 5h 30m)"
  - Current progress indicator

#### 6.1.4 Pending Instructions
- **Instruction Card (if recommendation pending):**
  - Status badge: "Recommendation Pending"
  - Recommendation type: "Reroute", "Wait", "Defer", "Continue"
  - Description: "Reroute to Bengaluru Emergency Distribution Campus due to port spillover at Hosur"
  - Confidence score: "85% confidence"
  - Why: Show top factors (e.g., "Port utilization: 95%", "Hosur capacity: 1800/1500 units")
  - Two buttons: "Accept" (green) and "Ignore" (gray)
  - Optional: "Ask dispatcher" button (opens chat/call)

#### 6.1.5 Recent Status Updates
- Show last 5 status updates:
  - Loaded X units at facility Y at HH:MM
  - Arrived at Z at HH:MM (late/on-time)
  - Resting until HH:MM
  - Recommendation: Reroute to W - Accepted/Ignored

#### 6.1.6 Incident Reporting
- **Report Issue Button:**
  - Opens modal/form with:
    - Issue type dropdown: Road Blockage, Strike, Weather, Delay, Port Congestion, Other
    - City (auto-filled from current location, editable)
    - Severity slider (1-10)
    - Photo upload (optional)
    - Note text area
    - Submit button
  - On submit: incident added to live events feed and integrated into reroute engine

#### 6.1.7 Connectivity & Notifications
- Show "Synced" / "Syncing..." / "Offline" status
- If offline, show queue of pending actions to sync
- Push notification-style alerts (if viewing on mobile) for urgent reroutes

### 6.2 Driver Selection

**Driver Dropdown:**
- Dropdown to select which driver's mobile view to display
- Auto-select first driver on page load
- Show driver name + # of vehicles assigned

---

## Phase 7: Events & Recommendations Log (Week 7)

### 7.1 Events Log View

**File:** `src/components/views/EventsLogView.jsx`

**Features:**
- **Event Timeline:**
  - Chronological list of all events: news, weather, driver incidents, system alerts
  - Filterable by:
    - Event type (news, weather, incident, system)
    - City
    - Severity
    - Status (unresolved, resolved)
    - Date range

- **Event Card:**
  - Type icon (news article, weather warning, incident report, reroute)
  - Title/Summary
  - Timestamp (relative, e.g., "2 minutes ago")
  - City (for geo-relevant events)
  - Content snippet (first 100 chars of news text, incident note, etc.)
  - Severity badge (color-coded)
  - Status badge (if relevant)
  - Affected facilities/vehicles (linked)
  - Click to expand modal with full details

- **News Event Modal:**
  - Full article text
  - Source (if available)
  - Impact type (route_disruption, capacity_constraint, etc.)
  - Impact score (0-1)
  - Relevance classifier output (is it route-impacting?)
  - List of affected facilities/routes

- **Weather Event Modal:**
  - Precipitation, temperature, wind speed (if available)
  - Affected cities
  - Forecast duration
  - Impact on ETA (e.g., "+15% on routes through Chennai")

- **Driver Incident Modal:**
  - Reporter name and vehicle ID
  - Incident type and severity
  - Full note
  - Photos (if uploaded)
  - Created at timestamp

### 7.2 Recommendations Log

**File:** `src/components/views/RecommendationsLogView.jsx`

**Features:**
- **Recommendation List:**
  - Table or timeline of all recommendations made by the reroute engine
  - Columns: ID, Timestamp, Vehicle, Current State, Recommendation, Confidence, Accepted?, Outcome, Improvement?
  - Filter by:
    - Status (pending, accepted, ignored)
    - Vehicle or driver
    - Recommendation type (reroute, wait, defer, continue)
    - Date range
  - Sort by timestamp, confidence, or outcome value

- **Recommendation Detail Card:**
  - Full recommendation data:
    - Vehicle identifier and driver name
    - Current facility and objective
    - Recommended action and destination
    - Confidence score
    - Explanation breakdown:
      - Factor 1: Port spillover at Hosur, effective capacity reduced 1800 → 1200 units (score: +0.25)
      - Factor 2: Destination Bengaluru utilization 87% vs original Hosur 96% (score: +0.15)
      - Factor 3: Added 45 km travel time (score: -0.10)
      - Factor 4: Precipitation risk reduced from 0.6 → 0.3 (score: +0.20)
      - Final Score: 0.75 (recommend)
    - Driver decision (accepted/ignored/pending)
    - Actual outcome if decision already made:
      - "Trip completed on time with recommendation" (green)
      - "Trip was delayed despite following recommendation" (yellow)
      - "Trip was faster by ignoring recommendation" (orange)
  - Link to affected vehicle current state

---

## Phase 8: Impact & SDG Metrics (Week 8)

### 8.1 Impact Dashboard View

**File:** `src/components/views/ImpactView.jsx`

**Purpose:**
- Tell the story of resilience and public good
- Focus on beneficiaries, not operations only
- Align with SDG 3 (Health), 9 (Infrastructure), 11 (Sustainable Cities), 12 (Responsible Consumption), 13 (Climate Action)

**Layout:**

#### 8.1.1 Executive Summary Card
- Headline: "Resilient Delivery Outcomes During Disruptions"
- Subheading: "Powered by AI-assisted rerouting across India"
- Key stat: "X critical deliveries enabled despite Y disruptions"

#### 8.1.2 SDG Alignment Grid
- 4-5 SDG cards showing alignment:
  - **SDG 3: Good Health & Well-being**
    - Medicines delivered on time (% of objectives)
    - Stockouts prevented (count)
    - Beneficiary health centers served (count)
  - **SDG 9: Industry, Innovation, Infrastructure**
    - Smart routing network coverage (# of facilities)
    - Technology adoption (simulation + AI)
    - Infrastructure resilience: operational uptime %
  - **SDG 11: Sustainable Cities**
    - Delivery nodes in vulnerable districts (count)
    - Urban congestion avoided by smart routing (km/day)
    - Relief goods delivered post-disruption (units)
  - **SDG 12: Responsible Consumption**
    - Spoilage prevented (units or %)
    - Food grain utilization (% reaching beneficiaries)
    - Waste reduction vs baseline
  - **SDG 13: Climate Action**
    - CO2 emissions avoided (kg)
    - Fuel consumption reduction (liters)
    - Green route adoption (% of vehicles)

#### 8.1.3 Impact Metrics Breakdown
- **Absolute Impact Section:**
  - Stockouts prevented: X locations, affecting Y beneficiaries, Z units of critical goods
  - Critical deliveries saved: X hospitals, Y clinics, Z health centers
  - CO2 emissions avoided: X kg (equivalent to Y km driven in average truck, Z trees planted)
  - Idle time prevented: X hours = Y truck-days saved = Z operational cost reduction
  - Beneficiary regions served: List top 5 districts/cities with impact
  - Perishable goods spoilage prevented: X units, worth ₹Y

- **Comparative Impact (vs Baseline):**
  - On-time delivery improvement: X% baseline → Y% with AI (Z percentage points)
  - Average delay reduction: X mins baseline → Y mins with AI (Z mins saved per shipment)
  - Overflow event reduction: X events baseline → Y events with AI
  - Driver override learning: "Drivers now accept Y% of recommendations (up from Z%)" indicating trust

#### 8.1.4 Beneficiary Map (Optional)
- If geography data available, show:
  - Indian map with critical facilities and impact zones highlighted
  - Size of marker = # of beneficiaries served at that location
  - Color = severity of disruptions handled
  - Hover to see facility name and impact stats

#### 8.1.5 Resilience Story
- **Timeline or narrative of how the system handled disruptions:**
  - Example: "During June 2026 monsoon, the system prevented 12 stockouts at 8 health centers in coastal districts by proactively rerouting 45 vaccine shipments through inland warehouses."
  - Include:
    - Disruption type and severity
    - Number of objectives affected
    - Number of vehicles rerouted
    - Outcomes without vs with AI
    - Beneficiary impact

#### 8.1.6 Stakeholder Feedback (Phase 8.5)
- Quotes from:
  - Fleet manager: "The reroute recommendations are clear and reduce our decision time by 50%"
  - Hospital supply coordinator: "We haven't missed a critical delivery since using this system"
  - Driver: "The mobile app makes it easy to report issues on the road"
  - NGO partner: "This enables us to scale relief delivery without hiring more dispatchers"

---

## Phase 9: Advanced Features (Week 9+)

### 9.1 Map Integration (Optional, Requires Google Maps API)

**File:** `src/components/views/MapView.jsx`

**Features:**
- **Interactive Route Map:**
  - Show India map with facility locations as pins
  - Draw current vehicle routes (origin → destination)
  - Alternative route visualization for reroute recommendations
  - Disruption overlays (affected regions shaded)
  - Zoom and pan controls
  - Click facility to view state
  - Click vehicle to view detail

### 9.2 Analytics & Charting

**Files:**
- `src/components/views/AnalyticsView.jsx`
- `src/components/charts/TimeSeriesChart.jsx`
- `src/components/charts/ComparisonChart.jsx`

**Features:**
- **Historical Metrics Charts:**
  - On-time delivery % over time (line chart)
  - Warehouse utilization trends (area chart)
  - CO2 saved cumulative (bar chart)
  - Vehicle status distribution (stacked bar)
  - Recommendation acceptance rate (line chart)

### 9.3 Multi-Language Support (Phase 9.5)

**Files:**
- `src/i18n/en.json` - English translations
- `src/i18n/hi.json` - Hindi translations
- `src/hooks/useLanguage.js` - Language context

**Implementation:**
- Use `i18next` or similar library
- Prioritize: Network, Live Ops, Driver Mobile
- Support for:
  - English (en)
  - Hindi (hi)
  - Optional: Tamil (ta), Kannada (kn)

---

## Phase 10: Deployment & Polish (Week 10)

### 10.1 Build & Deployment

**Steps:**
1. Run `npm run build` to create optimized production bundle
2. Serve from `frontend/dist` via FastAPI static files
3. Set up environment variables for production API base

### 10.2 Performance Optimization

- Code splitting by route
- Lazy load heavy components (Map, Analytics)
- Memoize expensive computations
- Minimize WebSocket message frequency
- Cache facility/vehicle lists locally

### 10.3 Testing

- Unit tests for key hooks (useApi, useWebSocket)
- Component tests for critical views (Dashboard, Scenarios)
- E2E tests for main workflows (Create facility → Assign to objective → Run scenario)

### 10.4 Accessibility & Mobile

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Mobile responsive design
- Test on iOS Safari and Android Chrome

---

## File Structure (Target)

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                        # Main app router/shell
│   ├── styles.css                     # Global styles
│   ├── assets/
│   │   ├── logo.svg
│   │   └── icons/                     # Icon assets
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── TabNavigation.jsx
│   │   │   ├── StatusPill.jsx
│   │   │   ├── Banner.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Button.jsx
│   │   ├── forms/
│   │   │   ├── FacilityForm.jsx
│   │   │   ├── VehicleForm.jsx
│   │   │   ├── ObjectiveForm.jsx
│   │   │   ├── PortLinkForm.jsx
│   │   │   └── DriverIncidentForm.jsx
│   │   ├── views/
│   │   │   ├── NetworkSetupView.jsx
│   │   │   ├── FleetView.jsx
│   │   │   ├── DriversView.jsx
│   │   │   ├── ObjectivesView.jsx
│   │   │   ├── LiveOpsView.jsx
│   │   │   ├── ScenariosView.jsx
│   │   │   ├── ScenarioComparisonView.jsx
│   │   │   ├── DriverMobileView.jsx
│   │   │   ├── EventsLogView.jsx
│   │   │   ├── RecommendationsLogView.jsx
│   │   │   ├── ImpactView.jsx
│   │   │   ├── MapView.jsx            # Phase 9
│   │   │   └── AnalyticsView.jsx      # Phase 9
│   │   ├── charts/
│   │   │   ├── TimeSeriesChart.jsx
│   │   │   ├── ComparisonChart.jsx
│   │   │   └── DoughnutChart.jsx
│   │   └── panels/
│   │       ├── VehicleDetailPanel.jsx
│   │       ├── FacilityDetailPanel.jsx
│   │       └── RecommendationDetailPanel.jsx
│   ├── hooks/
│   │   ├── useApi.js
│   │   ├── useWebSocket.js
│   │   ├── useLocalStorage.js
│   │   └── usePagination.js
│   ├── context/
│   │   └── DataContext.jsx
│   ├── utils/
│   │   ├── formatters.js              # Format numbers, dates, etc.
│   │   ├── validators.js              # Input validation
│   │   └── colors.js                  # Color scheme constants
│   └── i18n/                          # Phase 9.5
│       ├── en.json
│       └── hi.json
```

---

## Technology Decisions

### Libraries to Add

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "vite": "^6.3.5",
    "@vitejs/plugin-react": "^4.5.0"
  },
  "optional": {
    "recharts": "^2.x",              # For charts (Phase 9)
    "react-force-graph": "^1.x",     # For network viz (Phase 2.5)
    "react-leaflet": "^4.x",         # For map (Phase 9)
    "i18next": "^23.x",              # For i18n (Phase 9.5)
    "@testing-library/react": "^14.x",  # For tests (Phase 10)
    "@testing-library/jest-dom": "^6.x"
  }
}
```

**Justification:**
- **Recharts**: Battle-tested, lightweight charting library, React-native integration
- **React-Force-Graph**: Simple network visualization, no heavy dependencies
- **React-Leaflet**: Map library integration, OpenStreetMap or Google Maps support
- **i18next**: Standard i18n solution, wide community support
- **Testing Library**: Industry standard for React testing

### State Management

- **Phase 1-4:** Lift state to `App.jsx` with `useState` (keep simple)
- **Phase 5+:** Optionally introduce `useContext` for global data (DataContext.jsx) to reduce prop drilling
- **Avoid Redux** for now unless app becomes significantly more complex

---

## Design Principles

1. **Mobile-First:** Ensure driver mobile view works at 375px width
2. **Real-Time:** Show live updates via WebSocket; disable polling where possible
3. **Explainability:** Every recommendation includes "Why?" explanation
4. **Accessibility:** WCAG 2.1 AA, keyboard navigation, high contrast
5. **Performance:** <3s page load, <100ms interaction latency
6. **Consistency:** Unified color scheme, button styles, card layouts
7. **Data Integrity:** Confirm before destructive actions (delete, reset)

---

## Testing Strategy

### Unit Tests (Phase 10)
- `useApi.js` - fetch, error handling, retry logic
- `useWebSocket.js` - connect, disconnect, reconnect
- Formatter functions (formatDate, formatNumber)

### Component Tests (Phase 10)
- FacilityForm validation
- VehicleTable sorting and filtering
- RecommendationCard decision submission
- DriverMobileView incident submission

### E2E Tests (Phase 10)
1. Create facility, vehicle, objective; run scenario
2. Accept a recommendation in live ops
3. Report incident on driver mobile
4. View scenario comparison results

---

## Success Criteria

✅ **Phase 1:** Responsive layout, all tabs render, no console errors  
✅ **Phase 2:** Create/edit/delete facilities and port links, see live utilization updates  
✅ **Phase 3:** Full fleet and objectives management  
✅ **Phase 4:** Live ops dashboard with real-time metrics and vehicle tracking  
✅ **Phase 5:** Run scenario, compare baseline vs AI, show improvement  
✅ **Phase 6:** Driver mobile works on mobile browser, accepts/ignores recommendations  
✅ **Phase 7:** Search events, drill into recommendation details and outcomes  
✅ **Phase 8:** Impact dashboard tells coherent SDG story  
✅ **Phase 9:** Optional: Map and analytics views enhance storytelling  
✅ **Phase 10:** App is production-ready, tested, accessible, performant  

---

## Estimated Timeline

- **Week 1:** Phase 1 (Foundation)
- **Week 2:** Phase 2 (Network Setup)
- **Week 3:** Phase 3 (Fleet & Objectives)
- **Week 4:** Phase 4 (Live Ops Dashboard)
- **Week 5:** Phase 5 (Scenarios & Comparison)
- **Week 6:** Phase 6 (Driver Mobile)
- **Week 7:** Phase 7 (Events & Logs)
- **Week 8:** Phase 8 (Impact & SDG)
- **Week 9:** Phase 9 (Advanced Features) - *Optional/Parallel*
- **Week 10:** Phase 10 (Deployment & Polish)

**Total: 10 weeks for MVP + 2-3 weeks for Phase 9 (optional)**

---

## Notes & Dependencies

- Backend APIs are already implemented; frontend only needs to consume endpoints
- WebSocket connection works; frontend needs to handle disconnections gracefully
- No authentication in Phase 1; add Firebase Auth if time permits (Phase 3 of main plan)
- Database is SQLite for dev; PostgreSQL supported for production
- Consider using `environment variables` for API_BASE to support different deployments


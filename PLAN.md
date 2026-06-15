# Intelligent Supply Chain Optimization MVP

## Summary
- Build this as a greenfield `FastAPI + React` system with one API service, one dedicated simulation worker, and `PostgreSQL` for config, event history, and aggregated metrics.
- Scope for v1: admin-editable warehouses/ports/trucks/objectives, accelerated endless simulation, deterministic reroute engine, OSRM-backed real-road routing without a map UI, historical weather/news replay, driver override simulation, and SDG impact metrics.
- Keep the reroute engine rule-based and explainable. Train a separate news relevance model that decides which articles are route-impacting before they reach the simulation.

## Implementation Changes
- Model the network around `Facility` nodes of type `warehouse` or `port`. Ports are independent facilities, and `PortLink` records let port congestion reduce effective warehouse capacity.
- Define objectives as recurring lanes, not free roaming. Each `Objective` must store origin, destination, commodity, assigned vehicle pool, dispatch cadence, loading/unloading times, SLA window, priority, and allowed fallback facilities.
- Use a discrete-event simulation worker with an accelerated clock. Trucks advance by next state change (`dispatch`, `arrive`, `load`, `unload`, `rest`, `wait`, `reroute`) rather than per-second polling, which is what makes 10,000+ trucks practical.
- Precompute and cache OSRM route templates for every active facility pair and objective lane. Store `distance`, `duration`, `encoded_polyline`, and step metadata; trucks track `progress_meters` on those templates so they follow real roads even though the UI has no map.
- Implement the reroute engine as candidate scoring with hard constraints. Candidate actions are `continue`, `wait`, `reroute to alternate warehouse`, `reroute to port`, and `defer future dispatch`. Hard constraints: capacity, route closure risk, vehicle compatibility, objective compatibility, and driver rest compliance.
- Score candidates with weighted costs for overload risk, added travel time, predicted idle time, CO2 impact, missed objective SLA, event severity, and downstream congestion. Persist both the chosen action and its explanation so the admin panel can show why a reroute was suggested.
- Make port pressure explicit. Each `PortLink` stores `reserved_capacity_units`, `spillover_threshold_pct`, and `max_spillover_units`; warehouse effective capacity becomes `base_capacity - current_inventory - reserved_capacity - dynamic_spillover`.
- Add a driver override flow in simulation only. When a truck ignores a reroute, compare actual trip cost against recommended trip cost after completion; raise `driver_override_rating` if the ignore was better within tolerance, lower it if worse, and keep a transparent history in the admin panel.
- Ingest the Excel files into normalized `news_events` and `weather_events` tables. Because the news data is `2020-2023` and the weather data is `2024-2026`, normalize both onto a synthetic simulation calendar by preserving city + month/day patterns and remapping year into the active sim window.
- Build a separate `news_relevance_model` service/module using a lightweight text classifier for `relevant / not relevant`, plus `impact_type` and `impact_score`. Use the existing category field for weak labels and add a small reviewed validation set; only relevant events feed the reroute engine.
- Convert weather into route risk using deterministic thresholds on precipitation and temperature, applied at key cities only. Route risk should affect ETA multipliers and closure probability, not direct GPS-like per-truck weather lookup.
- Keep storage bounded for the endless sim: persist state transitions, decision logs, and hourly rollups; do not write per-second truck telemetry. The worker holds current live state in memory and publishes aggregated dashboard snapshots over WebSocket.

## Public APIs / Types
- Introduce REST endpoints for `facilities`, `port-links`, `vehicles`, `objectives`, `events/import`, `simulation/start|pause|resume|reset`, `recommendations`, `driver-decisions`, and `metrics/sdg`.
- Introduce a WebSocket stream for `simulation_snapshot`, `facility_load_update`, `truck_state_update`, `recommendation_created`, and `alert_event`.
- Core types should include `Facility`, `PortLink`, `Vehicle`, `DriverProfile`, `Objective`, `RouteTemplate`, `SimEvent`, `Recommendation`, `DriverDecision`, and `MetricsSnapshot`.
- `MetricsSnapshot` must at minimum expose `co2_saved_kg`, `idle_minutes_prevented`, `on_time_delivery_pct`, `warehouse_utilization_pct`, and `reroute_count`.
- The admin UI should have five views: network setup, objectives, live operations dashboard, events/recommendations log, and SDG metrics. Since there is no map, represent route progress with lane cards, ETA, step list, utilization bars, queue counts, and timeline charts.

## Test Plan
- Capacity overflow case: 10 trucks fill a 10,000-unit warehouse and the 11th truck is correctly assigned to `wait` or `reroute` based on configured alternates.
- Port congestion case: increasing linked port backlog lowers effective warehouse capacity and changes the chosen action before hard overflow occurs.
- Objective fidelity case: trucks only move on active objectives and return to the correct cycle after loading, unloading, and mandated rest.
- Routing case: OSRM route templates are reused from cache and truck progress advances on real-road durations without repeated route fetches.
- Event case: a `Road Blockages` news event or severe precipitation event increases route risk and changes ETA / recommendation output.
- Driver override case: ignoring a reroute can both improve and worsen the trip, and rating updates correctly in both directions.
- Performance case: simulate at least `10,000` trucks with aggregated UI updates and confirm stable memory growth over an extended accelerated run.
- Metrics case: `co2_saved_kg` and `idle_minutes_prevented` are computed against a defined baseline of “continue to original destination or wait at current destination”.

## Assumptions
- There is no existing saved app code in the workspace, so this plan assumes a greenfield implementation.
- v1 is admin-only; there is no separate driver app, only simulated driver decisions inside the admin experience.
- Facilities, ports, trucks, and objectives are database-backed and editable from the UI; any demo seed network is just bootstrap data, not a hard-coded constraint.
- OSRM is the routing backend for v1, and facility coordinates are stored explicitly so routing does not depend on runtime geocoding.
- UN SDG alignment is reported primarily through SDG 9, 11, 12, and 13 style metrics, with `CO2 emissions saved` and `idle time prevented` as the headline demo KPIs.

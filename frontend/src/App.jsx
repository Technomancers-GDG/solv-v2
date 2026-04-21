import { startTransition, useDeferredValue, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const tabs = ["Network", "Objectives", "Live Ops", "Events", "Impact"];

const initialFacilityForm = {
  name: "",
  city: "Delhi",
  facility_type: "warehouse",
  latitude: "28.6139",
  longitude: "77.2090",
  base_capacity_units: "10000",
  current_inventory_units: "1500",
  initial_inventory_units: "1500",
  queue_capacity_units: "1200",
  active: true,
};

const initialVehicleForm = {
  identifier: "",
  payload_capacity_units: "1000",
  home_facility_id: "",
  current_facility_id: "",
  driver_profile_id: "",
  average_speed_kmph: "48",
  emission_kg_per_km: "1.6",
  rest_every_hours: "8",
  rest_duration_minutes: "45",
  status: "idle",
};

const initialObjectiveForm = {
  name: "",
  commodity: "Iron Ore",
  origin_facility_id: "",
  destination_facility_id: "",
  dispatch_interval_minutes: "120",
  loading_duration_minutes: "30",
  unloading_duration_minutes: "35",
  sla_minutes: "900",
  priority: "2",
  assigned_vehicle_ids: [],
  fallback_facility_ids: [],
  active: true,
};

const initialPortLinkForm = {
  warehouse_id: "",
  port_id: "",
  reserved_capacity_units: "1200",
  spillover_threshold_pct: "78",
  max_spillover_units: "1500",
  active: true,
};

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function App() {
  const [activeTab, setActiveTab] = useState("Live Ops");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [portLinks, setPortLinks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [facilityForm, setFacilityForm] = useState(initialFacilityForm);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [objectiveForm, setObjectiveForm] = useState(initialObjectiveForm);
  const [portLinkForm, setPortLinkForm] = useState(initialPortLinkForm);

  const deferredVehicles = useDeferredValue(dashboard?.vehicles ?? []);

  async function refreshAll(showSpinner = false) {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const [
        facilityData,
        portLinkData,
        vehicleData,
        driverData,
        objectiveData,
        recommendationData,
        decisionData,
        metricData,
        dashboardData,
      ] = await Promise.all([
        apiFetch("/api/facilities"),
        apiFetch("/api/port-links"),
        apiFetch("/api/vehicles"),
        apiFetch("/api/drivers"),
        apiFetch("/api/objectives"),
        apiFetch("/api/recommendations"),
        apiFetch("/api/driver-decisions"),
        apiFetch("/api/metrics/sdg"),
        apiFetch("/api/dashboard"),
      ]);
      startTransition(() => {
        setFacilities(facilityData);
        setPortLinks(portLinkData);
        setVehicles(vehicleData);
        setDrivers(driverData);
        setObjectives(objectiveData);
        setRecommendations(recommendationData);
        setDecisions(decisionData);
        setMetrics(metricData);
        setDashboard(dashboardData);
        setError("");
      });
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll(true);
    const intervalId = window.setInterval(() => {
      refreshAll(false);
    }, 12000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/operations`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "simulation_snapshot") {
          startTransition(() => {
            setDashboard(payload.payload);
            setMetrics(payload.payload.metrics);
            setRecommendations(payload.payload.alerts);
          });
        }
      } catch {
        setError("Live feed payload could not be parsed.");
      }
    };
    socket.onerror = () => {
      setError("Live operations socket is unavailable. REST polling is still active.");
    };
    const pingId = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 15000);
    return () => {
      window.clearInterval(pingId);
      socket.close();
    };
  }, []);

  function resetBanner(nextMessage = "") {
    setMessage(nextMessage);
    setError("");
  }

  async function submitJson(path, payload, successMessage, options = {}) {
    try {
      await apiFetch(path, {
        method: options.method ?? "POST",
        body: JSON.stringify(payload),
      });
      resetBanner(successMessage);
      await refreshAll(false);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleFacilitySubmit(event) {
    event.preventDefault();
    const payload = {
      ...facilityForm,
      latitude: Number(facilityForm.latitude),
      longitude: Number(facilityForm.longitude),
      base_capacity_units: Number(facilityForm.base_capacity_units),
      current_inventory_units: Number(facilityForm.current_inventory_units),
      initial_inventory_units: Number(facilityForm.initial_inventory_units),
      queue_capacity_units: Number(facilityForm.queue_capacity_units),
    };
    await submitJson("/api/facilities", payload, "Facility added to the network.");
    setFacilityForm(initialFacilityForm);
  }

  async function handleVehicleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...vehicleForm,
      payload_capacity_units: Number(vehicleForm.payload_capacity_units),
      home_facility_id: Number(vehicleForm.home_facility_id),
      current_facility_id: Number(vehicleForm.current_facility_id || vehicleForm.home_facility_id),
      driver_profile_id: Number(vehicleForm.driver_profile_id),
      average_speed_kmph: Number(vehicleForm.average_speed_kmph),
      emission_kg_per_km: Number(vehicleForm.emission_kg_per_km),
      rest_every_hours: Number(vehicleForm.rest_every_hours),
      rest_duration_minutes: Number(vehicleForm.rest_duration_minutes),
    };
    await submitJson("/api/vehicles", payload, "Vehicle added to the fleet.");
    setVehicleForm(initialVehicleForm);
  }

  async function handleObjectiveSubmit(event) {
    event.preventDefault();
    const payload = {
      ...objectiveForm,
      origin_facility_id: Number(objectiveForm.origin_facility_id),
      destination_facility_id: Number(objectiveForm.destination_facility_id),
      dispatch_interval_minutes: Number(objectiveForm.dispatch_interval_minutes),
      loading_duration_minutes: Number(objectiveForm.loading_duration_minutes),
      unloading_duration_minutes: Number(objectiveForm.unloading_duration_minutes),
      sla_minutes: Number(objectiveForm.sla_minutes),
      priority: Number(objectiveForm.priority),
      assigned_vehicle_ids: objectiveForm.assigned_vehicle_ids.map(Number),
      fallback_facility_ids: objectiveForm.fallback_facility_ids.map(Number),
    };
    await submitJson("/api/objectives", payload, "Objective created.");
    setObjectiveForm(initialObjectiveForm);
  }

  async function handlePortLinkSubmit(event) {
    event.preventDefault();
    const payload = {
      ...portLinkForm,
      warehouse_id: Number(portLinkForm.warehouse_id),
      port_id: Number(portLinkForm.port_id),
      reserved_capacity_units: Number(portLinkForm.reserved_capacity_units),
      spillover_threshold_pct: Number(portLinkForm.spillover_threshold_pct),
      max_spillover_units: Number(portLinkForm.max_spillover_units),
    };
    await submitJson("/api/port-links", payload, "Port linkage saved.");
    setPortLinkForm(initialPortLinkForm);
  }

  async function runSimulationAction(path, payload = null, successMessage = "") {
    try {
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      });
      if (successMessage) {
        resetBanner(successMessage);
      }
      await refreshAll(false);
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function importEvents(fullNewsImport) {
    try {
      const result = await apiFetch(`/api/events/import?full_news_import=${fullNewsImport}`, {
        method: "POST",
      });
      resetBanner(
        `Imported ${result.news_imported} news rows and ${result.weather_imported} weather rows.`,
      );
      await refreshAll(false);
    } catch (importError) {
      setError(importError.message);
    }
  }

  function updateMultiSelect(event, setter, field) {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setter((current) => ({ ...current, [field]: values }));
  }

  const facilityLookup = Object.fromEntries(facilities.map((facility) => [facility.id, facility]));
  const driverLookup = Object.fromEntries(drivers.map((driver) => [driver.id, driver]));
  const objectiveLookup = Object.fromEntries(objectives.map((objective) => [objective.id, objective]));
  const criticalFacilities = (dashboard?.facilities ?? [])
    .filter((facility) => facility.utilization_pct >= 70)
    .slice(0, 6);

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <header className="hero">
        <div>
          <p className="eyebrow">Google Solution Challenge 2026</p>
          <h1>Intelligent Supply Chain Optimization</h1>
          <p className="hero-copy">
            Endless lane-based simulation for rerouting, congestion control, event-aware dispatch,
            and SDG-linked operations metrics without relying on a map-heavy interface.
          </p>
        </div>
        <div className="hero-controls">
          <button onClick={() => runSimulationAction("/api/simulation/start", { speed_multiplier: 180 }, "Simulation started at 180x.")}>
            Start
          </button>
          <button onClick={() => runSimulationAction("/api/simulation/pause", {}, "Simulation paused.")}>
            Pause
          </button>
          <button onClick={() => runSimulationAction("/api/simulation/resume", {}, "Simulation resumed.")}>
            Resume
          </button>
          <button className="danger" onClick={() => runSimulationAction("/api/simulation/reset", {}, "Simulation reset to seed state.")}>
            Reset
          </button>
        </div>
      </header>

      <section className="topline">
        <StatusPill label="Simulation" value={dashboard?.simulation?.status ?? "idle"} />
        <StatusPill label="Sim Clock" value={dashboard?.simulation?.simulation_time?.slice(0, 19).replace("T", " ") ?? "loading"} />
        <StatusPill label="Speed" value={`${dashboard?.simulation?.speed_multiplier ?? 0}x`} />
        <StatusPill label="Queued Events" value={dashboard?.simulation?.queued_events ?? 0} />
      </section>

      {message ? <div className="banner success">{message}</div> : null}
      {error ? <div className="banner error">{error}</div> : null}

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {loading && !dashboard ? <div className="loading">Loading command center...</div> : null}

      <main className="view-stack">
        {activeTab === "Network" ? (
          <section className="grid-two">
            <Panel title="Facilities">
              <form className="form-grid" onSubmit={handleFacilitySubmit}>
                <Input label="Name" value={facilityForm.name} onChange={(value) => setFacilityForm({ ...facilityForm, name: value })} />
                <Input label="City" value={facilityForm.city} onChange={(value) => setFacilityForm({ ...facilityForm, city: value })} />
                <Select
                  label="Type"
                  value={facilityForm.facility_type}
                  options={[
                    ["warehouse", "Warehouse"],
                    ["port", "Port"],
                  ]}
                  onChange={(value) => setFacilityForm({ ...facilityForm, facility_type: value })}
                />
                <Input label="Latitude" value={facilityForm.latitude} onChange={(value) => setFacilityForm({ ...facilityForm, latitude: value })} />
                <Input label="Longitude" value={facilityForm.longitude} onChange={(value) => setFacilityForm({ ...facilityForm, longitude: value })} />
                <Input label="Capacity" value={facilityForm.base_capacity_units} onChange={(value) => setFacilityForm({ ...facilityForm, base_capacity_units: value })} />
                <Input label="Current Inventory" value={facilityForm.current_inventory_units} onChange={(value) => setFacilityForm({ ...facilityForm, current_inventory_units: value })} />
                <Input label="Initial Inventory" value={facilityForm.initial_inventory_units} onChange={(value) => setFacilityForm({ ...facilityForm, initial_inventory_units: value })} />
                <Input label="Queue Capacity" value={facilityForm.queue_capacity_units} onChange={(value) => setFacilityForm({ ...facilityForm, queue_capacity_units: value })} />
                <button type="submit">Add Facility</button>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Inventory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((facility) => (
                      <tr key={facility.id}>
                        <td>{facility.name}</td>
                        <td>{facility.city}</td>
                        <td>{facility.facility_type}</td>
                        <td>{facility.base_capacity_units.toLocaleString()}</td>
                        <td>{facility.current_inventory_units.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Fleet & Port Pressure">
              <form className="form-grid" onSubmit={handleVehicleSubmit}>
                <Input label="Vehicle ID" value={vehicleForm.identifier} onChange={(value) => setVehicleForm({ ...vehicleForm, identifier: value })} />
                <Input label="Payload Units" value={vehicleForm.payload_capacity_units} onChange={(value) => setVehicleForm({ ...vehicleForm, payload_capacity_units: value })} />
                <Select
                  label="Home Facility"
                  value={vehicleForm.home_facility_id}
                  options={facilities.map((facility) => [String(facility.id), facility.name])}
                  onChange={(value) => setVehicleForm({ ...vehicleForm, home_facility_id: value, current_facility_id: value })}
                />
                <Select
                  label="Driver"
                  value={vehicleForm.driver_profile_id}
                  options={drivers.map((driver) => [String(driver.id), `${driver.name} (${driver.override_rating.toFixed(2)})`])}
                  onChange={(value) => setVehicleForm({ ...vehicleForm, driver_profile_id: value })}
                />
                <Input label="Avg Speed" value={vehicleForm.average_speed_kmph} onChange={(value) => setVehicleForm({ ...vehicleForm, average_speed_kmph: value })} />
                <Input label="Emission kg/km" value={vehicleForm.emission_kg_per_km} onChange={(value) => setVehicleForm({ ...vehicleForm, emission_kg_per_km: value })} />
                <Input label="Rest Every Hours" value={vehicleForm.rest_every_hours} onChange={(value) => setVehicleForm({ ...vehicleForm, rest_every_hours: value })} />
                <Input label="Rest Minutes" value={vehicleForm.rest_duration_minutes} onChange={(value) => setVehicleForm({ ...vehicleForm, rest_duration_minutes: value })} />
                <button type="submit">Add Vehicle</button>
              </form>

              <form className="form-grid section-divider" onSubmit={handlePortLinkSubmit}>
                <Select
                  label="Warehouse"
                  value={portLinkForm.warehouse_id}
                  options={facilities.filter((facility) => facility.facility_type === "warehouse").map((facility) => [String(facility.id), facility.name])}
                  onChange={(value) => setPortLinkForm({ ...portLinkForm, warehouse_id: value })}
                />
                <Select
                  label="Linked Port"
                  value={portLinkForm.port_id}
                  options={facilities.filter((facility) => facility.facility_type === "port").map((facility) => [String(facility.id), facility.name])}
                  onChange={(value) => setPortLinkForm({ ...portLinkForm, port_id: value })}
                />
                <Input label="Reserved Capacity" value={portLinkForm.reserved_capacity_units} onChange={(value) => setPortLinkForm({ ...portLinkForm, reserved_capacity_units: value })} />
                <Input label="Spillover %" value={portLinkForm.spillover_threshold_pct} onChange={(value) => setPortLinkForm({ ...portLinkForm, spillover_threshold_pct: value })} />
                <Input label="Max Spillover" value={portLinkForm.max_spillover_units} onChange={(value) => setPortLinkForm({ ...portLinkForm, max_spillover_units: value })} />
                <button type="submit">Link Port</button>
              </form>

              <div className="pill-list">
                {portLinks.map((link) => (
                  <div className="pill-card" key={link.id}>
                    <strong>{facilityLookup[link.warehouse_id]?.name}</strong>
                    <span>linked to {facilityLookup[link.port_id]?.name}</span>
                    <span>reserved {link.reserved_capacity_units} units</span>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === "Objectives" ? (
          <section className="grid-two">
            <Panel title="Create Objective">
              <form className="form-grid" onSubmit={handleObjectiveSubmit}>
                <Input label="Objective Name" value={objectiveForm.name} onChange={(value) => setObjectiveForm({ ...objectiveForm, name: value })} />
                <Input label="Commodity" value={objectiveForm.commodity} onChange={(value) => setObjectiveForm({ ...objectiveForm, commodity: value })} />
                <Select
                  label="Origin"
                  value={objectiveForm.origin_facility_id}
                  options={facilities.map((facility) => [String(facility.id), `${facility.name} (${facility.city})`])}
                  onChange={(value) => setObjectiveForm({ ...objectiveForm, origin_facility_id: value })}
                />
                <Select
                  label="Destination"
                  value={objectiveForm.destination_facility_id}
                  options={facilities.map((facility) => [String(facility.id), `${facility.name} (${facility.city})`])}
                  onChange={(value) => setObjectiveForm({ ...objectiveForm, destination_facility_id: value })}
                />
                <Input label="Dispatch Interval" value={objectiveForm.dispatch_interval_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, dispatch_interval_minutes: value })} />
                <Input label="Load Minutes" value={objectiveForm.loading_duration_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, loading_duration_minutes: value })} />
                <Input label="Unload Minutes" value={objectiveForm.unloading_duration_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, unloading_duration_minutes: value })} />
                <Input label="SLA Minutes" value={objectiveForm.sla_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, sla_minutes: value })} />
                <Input label="Priority" value={objectiveForm.priority} onChange={(value) => setObjectiveForm({ ...objectiveForm, priority: value })} />
                <label className="field full">
                  <span>Assigned Vehicle Pool</span>
                  <select multiple value={objectiveForm.assigned_vehicle_ids} onChange={(event) => updateMultiSelect(event, setObjectiveForm, "assigned_vehicle_ids")}>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.identifier} • {facilityLookup[vehicle.home_facility_id]?.city}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field full">
                  <span>Fallback Facilities</span>
                  <select multiple value={objectiveForm.fallback_facility_ids} onChange={(event) => updateMultiSelect(event, setObjectiveForm, "fallback_facility_ids")}>
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name} • {facility.facility_type}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Create Objective</button>
              </form>
            </Panel>

            <Panel title="Lane Cycles">
              <div className="lane-stack">
                {objectives.map((objective) => (
                  <div className="lane-card" key={objective.id}>
                    <div className="lane-head">
                      <h3>{objective.name}</h3>
                      <span className="priority">P{objective.priority}</span>
                    </div>
                    <p>
                      {facilityLookup[objective.origin_facility_id]?.city} to{" "}
                      {facilityLookup[objective.destination_facility_id]?.city}
                    </p>
                    <div className="lane-meta">
                      <span>{objective.commodity}</span>
                      <span>{objective.dispatch_interval_minutes} min cadence</span>
                      <span>{objective.assigned_vehicle_ids.length} assigned vehicles</span>
                      <span>{objective.fallback_facility_ids.length} fallback nodes</span>
                    </div>
                    <div className="chip-row">
                      {objective.assigned_vehicle_ids.map((vehicleId) => (
                        <span className="chip" key={vehicleId}>
                          {vehicles.find((vehicle) => vehicle.id === vehicleId)?.identifier ?? `Vehicle ${vehicleId}`}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === "Live Ops" ? (
          <section className="ops-layout">
            <div className="metrics-row">
              <MetricCard label="CO2 Saved" value={`${Number(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg`} tone="teal" />
              <MetricCard label="Idle Time Prevented" value={`${Number(metrics?.idle_minutes_prevented ?? 0).toFixed(0)} min`} tone="amber" />
              <MetricCard label="On-Time Delivery" value={`${Number(metrics?.on_time_delivery_pct ?? 0).toFixed(1)}%`} tone="steel" />
              <MetricCard label="Reroutes" value={metrics?.reroute_count ?? 0} tone="coral" />
            </div>

            <div className="grid-two">
              <Panel title="Critical Capacity Watch">
                {criticalFacilities.length === 0 ? (
                  <div className="empty">No facility is above 70% utilization right now.</div>
                ) : (
                  criticalFacilities.map((facility) => (
                    <div className="util-card" key={facility.facility_id}>
                      <div className="util-head">
                        <strong>{facility.facility_name}</strong>
                        <span>{facility.utilization_pct.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={facility.utilization_pct} />
                      <div className="util-foot">
                        <span>{facility.city}</span>
                        <span>{facility.effective_available_units} units free</span>
                      </div>
                    </div>
                  ))
                )}
              </Panel>

              <Panel title="Active Event Feed">
                <div className="event-stack">
                  {(dashboard?.active_events ?? []).map((event) => (
                    <div className="event-card" key={`${event.city}-${event.kind}-${event.headline}`}>
                      <div className="event-top">
                        <strong>{event.city}</strong>
                        <span>{event.kind}</span>
                      </div>
                      <p>{event.headline}</p>
                      <small>
                        {event.impact_type} • impact {Number(event.impact_score).toFixed(2)}
                      </small>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="Vehicle Progress">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Status</th>
                      <th>Objective</th>
                      <th>Progress</th>
                      <th>Payload</th>
                      <th>Next ETA</th>
                      <th>AI Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deferredVehicles.slice(0, 30).map((vehicle) => (
                      <tr key={vehicle.vehicle_id}>
                        <td>{vehicle.identifier}</td>
                        <td>{vehicle.status}</td>
                        <td>{objectiveLookup[vehicle.objective_id]?.name ?? "Unassigned"}</td>
                        <td>
                          <ProgressBar value={vehicle.progress_pct} compact />
                        </td>
                        <td>{vehicle.payload_units}</td>
                        <td>{vehicle.eta ? vehicle.eta.slice(0, 19).replace("T", " ") : "-"}</td>
                        <td>{vehicle.recommendation_action ?? "continue"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === "Events" ? (
          <section className="grid-two">
            <Panel title="Import & Recommendations">
              <div className="action-row">
                <button onClick={() => importEvents(false)}>Import Event Replay</button>
                <button onClick={() => importEvents(true)}>Full News Import</button>
              </div>
              <div className="lane-stack">
                {recommendations.map((recommendation) => (
                  <div className="lane-card" key={recommendation.id}>
                    <div className="lane-head">
                      <h3>{recommendation.action.replaceAll("_", " ")}</h3>
                      <span className="priority">{recommendation.status}</span>
                    </div>
                    <p>{recommendation.explanation}</p>
                    <div className="lane-meta">
                      <span>Vehicle {vehicles.find((vehicle) => vehicle.id === recommendation.vehicle_id)?.identifier}</span>
                      <span>Baseline {recommendation.baseline_cost.toFixed(1)}</span>
                      <span>Recommended {recommendation.recommended_cost.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Driver Overrides">
              <div className="lane-stack">
                {decisions.map((decision) => (
                  <div className="event-card" key={decision.id}>
                    <div className="event-top">
                      <strong>{vehicles.find((vehicle) => vehicle.id === decision.vehicle_id)?.identifier}</strong>
                      <span>{decision.decision}</span>
                    </div>
                    <p>{decision.note}</p>
                    <small>
                      Driver {driverLookup[decision.driver_profile_id]?.name} • delta {decision.rating_delta.toFixed(2)}
                    </small>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === "Impact" ? (
          <section className="grid-two">
            <Panel title="SDG Alignment">
              <div className="impact-copy">
                <p>
                  The simulator ties operational efficiency to SDG 9, 11, 12, and 13 by
                  quantifying cleaner routing, lower idle time, and fewer congestion-driven delays.
                </p>
                <ul className="impact-list">
                  <li>SDG 9: more resilient logistics infrastructure through event-aware rerouting.</li>
                  <li>SDG 11: reduced urban congestion via load balancing across warehouses and ports.</li>
                  <li>SDG 12: smarter use of storage and dispatch windows to avoid wasteful dwell time.</li>
                  <li>SDG 13: lower emissions through fewer dead-end trips and less waiting.</li>
                </ul>
              </div>
              <div className="metrics-row single-column">
                <MetricCard label="Warehouse Utilization" value={`${Number(metrics?.warehouse_utilization_pct ?? 0).toFixed(1)}%`} tone="steel" />
                <MetricCard label="Active Trucks" value={metrics?.active_trucks ?? 0} tone="teal" />
                <MetricCard label="Queued Trucks" value={metrics?.queued_trucks ?? 0} tone="coral" />
              </div>
            </Panel>

            <Panel title="Fleet Confidence">
              <div className="lane-stack">
                {drivers.map((driver) => (
                  <div className="util-card" key={driver.id}>
                    <div className="util-head">
                      <strong>{driver.name}</strong>
                      <span>override rating {driver.override_rating.toFixed(2)}</span>
                    </div>
                    <ProgressBar value={driver.confidence * 100} />
                    <div className="util-foot">
                      <span>confidence {Math.round(driver.confidence * 100)}%</span>
                      <span>accept bias {Math.round(driver.accept_recommendation_bias * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ value, compact = false }) {
  return (
    <div className={compact ? "progress compact" : "progress"}>
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function StatusPill({ label, value }) {
  return (
    <div className="status-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export default App;

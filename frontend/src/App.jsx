import { startTransition, useDeferredValue, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const tabs = ["Network", "Objectives", "Live Ops", "Scenarios", "Driver Mobile", "Events", "Impact"];

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
  commodity: "Emergency Medicines",
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

const initialDriverIncidentForm = {
  driver_profile_id: "",
  vehicle_id: "",
  city: "Chennai",
  incident_type: "road_blockage",
  severity: "0.7",
  note: "",
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
  const [scenarios, setScenarios] = useState([]);
  const [scenarioComparison, setScenarioComparison] = useState(null);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverMobile, setDriverMobile] = useState(null);
  const [facilityForm, setFacilityForm] = useState(initialFacilityForm);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [objectiveForm, setObjectiveForm] = useState(initialObjectiveForm);
  const [portLinkForm, setPortLinkForm] = useState(initialPortLinkForm);
  const [driverIncidentForm, setDriverIncidentForm] = useState(initialDriverIncidentForm);

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
        scenarioData,
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
        apiFetch("/api/scenarios"),
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
        setScenarios(scenarioData);
        setRecommendations(recommendationData);
        setDecisions(decisionData);
        setMetrics(metricData);
        setDashboard(dashboardData);
        if (!selectedScenarioKey && scenarioData.length > 0) {
          setSelectedScenarioKey(scenarioData[0].scenario_key);
        }
        if (!selectedDriverId && driverData.length > 0) {
          const firstDriverId = String(driverData[0].id);
          setSelectedDriverId(firstDriverId);
          setDriverIncidentForm((current) => ({ ...current, driver_profile_id: firstDriverId }));
        }
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

  useEffect(() => {
    if (!selectedDriverId) {
      setDriverMobile(null);
      return;
    }
    loadDriverMobile(selectedDriverId);
  }, [selectedDriverId]);

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

  async function compareScenario(scenarioKey) {
    if (!scenarioKey) {
      return;
    }
    try {
      const comparison = await apiFetch(`/api/scenarios/${scenarioKey}/compare`);
      setScenarioComparison(comparison);
      resetBanner(`Compared baseline vs AI for ${comparison.scenario_name}.`);
    } catch (compareError) {
      setError(compareError.message);
    }
  }

  async function triggerScenarioDisruption(scenarioKey) {
    if (!scenarioKey) {
      return;
    }
    try {
      const result = await apiFetch(`/api/scenarios/${scenarioKey}/trigger`, {
        method: "POST",
      });
      resetBanner(`Triggered ${result.scenario_key} in ${result.event_city}.`);
      await refreshAll(false);
    } catch (triggerError) {
      setError(triggerError.message);
    }
  }

  async function startScenarioFlow(scenarioKey) {
    if (!scenarioKey) {
      return;
    }
    try {
      await apiFetch("/api/simulation/reset", {
        method: "POST",
        body: JSON.stringify({}),
      });
      await apiFetch("/api/simulation/start", {
        method: "POST",
        body: JSON.stringify({ speed_multiplier: 180 }),
      });
      await apiFetch(`/api/scenarios/${scenarioKey}/trigger`, {
        method: "POST",
      });
      const comparison = await apiFetch(`/api/scenarios/${scenarioKey}/compare`);
      setScenarioComparison(comparison);
      resetBanner(`Scenario started and compared: ${comparison.scenario_name}.`);
      await refreshAll(false);
    } catch (scenarioError) {
      setError(scenarioError.message);
    }
  }

  async function loadDriverMobile(driverId) {
    try {
      const snapshot = await apiFetch(`/api/driver/${driverId}/mobile`);
      setDriverMobile(snapshot);
      setDriverIncidentForm((current) => ({
        ...current,
        driver_profile_id: String(driverId),
      }));
    } catch (mobileError) {
      setError(mobileError.message);
    }
  }

  async function submitDriverMobileDecision(recommendationId, decision) {
    try {
      await apiFetch("/api/driver/decision", {
        method: "POST",
        body: JSON.stringify({ recommendation_id: recommendationId, decision, note: "" }),
      });
      resetBanner(`Driver decision recorded: ${decision}.`);
      await refreshAll(false);
      if (selectedDriverId) {
        await loadDriverMobile(selectedDriverId);
      }
    } catch (decisionError) {
      setError(decisionError.message);
    }
  }

  async function handleDriverIncidentSubmit(event) {
    event.preventDefault();
    const driverId = Number(driverIncidentForm.driver_profile_id || selectedDriverId);
    if (!driverId) {
      setError("Choose a driver before reporting an incident.");
      return;
    }
    const payload = {
      driver_profile_id: driverId,
      vehicle_id: driverIncidentForm.vehicle_id ? Number(driverIncidentForm.vehicle_id) : null,
      city: driverIncidentForm.city,
      incident_type: driverIncidentForm.incident_type,
      severity: Number(driverIncidentForm.severity),
      note: driverIncidentForm.note,
    };
    try {
      await apiFetch("/api/driver/incidents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      resetBanner("Driver incident sent and added to disruption feed.");
      setDriverIncidentForm((current) => ({ ...current, vehicle_id: "", note: "" }));
      await refreshAll(false);
      await loadDriverMobile(String(driverId));
    } catch (incidentError) {
      setError(incidentError.message);
    }
  }

  function updateMultiSelect(event, setter, field) {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setter((current) => ({ ...current, [field]: values }));
  }

  const facilityLookup = Object.fromEntries(facilities.map((facility) => [facility.id, facility]));
  const driverLookup = Object.fromEntries(drivers.map((driver) => [driver.id, driver]));
  const objectiveLookup = Object.fromEntries(objectives.map((objective) => [objective.id, objective]));
  const selectedScenario = scenarios.find((scenario) => scenario.scenario_key === selectedScenarioKey) ?? null;
  const selectedDriverVehicles = vehicles.filter(
    (vehicle) => String(vehicle.driver_profile_id) === String(selectedDriverId),
  );
  const criticalFacilities = (dashboard?.facilities ?? [])
    .filter((facility) => facility.utilization_pct >= 70)
    .slice(0, 6);

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <header className="hero">
        <div>
          <p className="eyebrow">Google Solution Challenge 2026</p>
          <h1>Resilient Essential Goods Coordination</h1>
          <p className="hero-copy">
            AI-assisted operations for medicines, vaccines, and relief materials during disruptions
            across India, with explainable reroutes and beneficiary-focused impact tracking.
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
              <MetricCard label="Critical Deliveries Saved" value={metrics?.critical_deliveries_saved ?? 0} tone="teal" />
              <MetricCard label="Stockouts Prevented" value={metrics?.stockouts_prevented ?? 0} tone="amber" />
              <MetricCard label="Beneficiary Locations Served" value={metrics?.beneficiary_locations_served ?? 0} tone="steel" />
              <MetricCard
                label="Spoilage/Wastage Prevented"
                value={`${Number(metrics?.spoilage_or_wastage_prevented ?? 0).toFixed(0)} units`}
                tone="coral"
              />
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

        {activeTab === "Scenarios" ? (
          <section className="grid-two">
            <Panel title="Scenario Replay">
              <div className="form-grid">
                <Select
                  label="Scenario"
                  value={selectedScenarioKey}
                  options={scenarios.map((scenario) => [scenario.scenario_key, scenario.name])}
                  onChange={(value) => setSelectedScenarioKey(value)}
                />
              </div>
              {selectedScenario ? (
                <div className="lane-card">
                  <div className="lane-head">
                    <h3>{selectedScenario.name}</h3>
                    <span className="priority">{selectedScenario.event_type}</span>
                  </div>
                  <p>{selectedScenario.description}</p>
                  <div className="lane-meta">
                    <span>{selectedScenario.event_city}</span>
                    <span>severity {selectedScenario.severity.toFixed(2)}</span>
                    <span>ETA x{selectedScenario.eta_multiplier.toFixed(2)}</span>
                  </div>
                </div>
              ) : null}
              <div className="action-row section-divider">
                <button onClick={() => startScenarioFlow(selectedScenarioKey)}>Start Scenario</button>
                <button onClick={() => triggerScenarioDisruption(selectedScenarioKey)}>Trigger Disruption</button>
                <button onClick={() => compareScenario(selectedScenarioKey)}>Compare With Baseline</button>
              </div>
            </Panel>

            <Panel title="Baseline Vs AI Outcomes">
              {!scenarioComparison ? (
                <div className="empty">Run Compare With Baseline to view scenario deltas.</div>
              ) : (
                <div className="lane-stack">
                  <div className="lane-card">
                    <div className="lane-head">
                      <h3>{scenarioComparison.scenario_name}</h3>
                      <span className="priority">Comparison</span>
                    </div>
                    <div className="comparison-grid">
                      <div>
                        <strong>Baseline On-Time</strong>
                        <p>{scenarioComparison.baseline.on_time_delivery_pct.toFixed(1)}%</p>
                      </div>
                      <div>
                        <strong>AI On-Time</strong>
                        <p>{scenarioComparison.ai.on_time_delivery_pct.toFixed(1)}%</p>
                      </div>
                      <div>
                        <strong>Baseline Avg Delay</strong>
                        <p>{scenarioComparison.baseline.average_delay_minutes.toFixed(1)} min</p>
                      </div>
                      <div>
                        <strong>AI Avg Delay</strong>
                        <p>{scenarioComparison.ai.average_delay_minutes.toFixed(1)} min</p>
                      </div>
                    </div>
                    <div className="lane-meta">
                      <span>Overflow reduction {scenarioComparison.improvement_summary.overflow_reduction.toFixed(1)}</span>
                      <span>Delay reduction {scenarioComparison.improvement_summary.delay_reduction_minutes.toFixed(1)} min</span>
                      <span>Stockouts prevented {scenarioComparison.ai.stockouts_prevented}</span>
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          </section>
        ) : null}

        {activeTab === "Driver Mobile" ? (
          <section className="grid-two">
            <Panel title="Driver Instructions">
              <div className="form-grid">
                <Select
                  label="Driver"
                  value={selectedDriverId}
                  options={drivers.map((driver) => [String(driver.id), `${driver.name} (${driver.override_rating.toFixed(2)})`])}
                  onChange={(value) => setSelectedDriverId(value)}
                />
              </div>
              {driverMobile ? (
                <div className="lane-stack">
                  <div className="lane-card">
                    <div className="lane-head">
                      <h3>{driverMobile.driver_name}</h3>
                      <span className="priority">confidence {Math.round(driverMobile.confidence * 100)}%</span>
                    </div>
                    <div className="lane-meta">
                      <span>override rating {driverMobile.override_rating.toFixed(2)}</span>
                      <span>{driverMobile.pending_instructions.length} pending actions</span>
                    </div>
                  </div>
                  {driverMobile.pending_instructions.length === 0 ? (
                    <div className="empty">No pending instructions for this driver.</div>
                  ) : (
                    driverMobile.pending_instructions.map((instruction) => (
                      <div className="event-card" key={instruction.recommendation_id}>
                        <div className="event-top">
                          <strong>{instruction.vehicle_identifier}</strong>
                          <span>{instruction.action.replaceAll("_", " ")}</span>
                        </div>
                        <p>{instruction.explanation}</p>
                        <small>{instruction.objective_name}</small>
                        <div className="action-row">
                          <button onClick={() => submitDriverMobileDecision(instruction.recommendation_id, "accepted")}>Accept</button>
                          <button className="danger" onClick={() => submitDriverMobileDecision(instruction.recommendation_id, "ignored")}>Ignore</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="empty">Select a driver to load mobile instructions.</div>
              )}
            </Panel>

            <Panel title="Incident Reporting">
              <form className="form-grid" onSubmit={handleDriverIncidentSubmit}>
                <Select
                  label="Driver"
                  value={driverIncidentForm.driver_profile_id || selectedDriverId}
                  options={drivers.map((driver) => [String(driver.id), driver.name])}
                  onChange={(value) => setDriverIncidentForm({ ...driverIncidentForm, driver_profile_id: value })}
                />
                <Select
                  label="Vehicle"
                  value={driverIncidentForm.vehicle_id}
                  options={selectedDriverVehicles.map((vehicle) => [String(vehicle.id), vehicle.identifier])}
                  onChange={(value) => setDriverIncidentForm({ ...driverIncidentForm, vehicle_id: value })}
                  required={false}
                />
                <Input label="City" value={driverIncidentForm.city} onChange={(value) => setDriverIncidentForm({ ...driverIncidentForm, city: value })} />
                <Select
                  label="Incident Type"
                  value={driverIncidentForm.incident_type}
                  options={[
                    ["road_blockage", "Road Blockage"],
                    ["strike", "Strike"],
                    ["delay", "Delay"],
                    ["port_congestion", "Port Congestion"],
                    ["weather", "Weather"],
                  ]}
                  onChange={(value) => setDriverIncidentForm({ ...driverIncidentForm, incident_type: value })}
                />
                <Input label="Severity (0-1)" value={driverIncidentForm.severity} onChange={(value) => setDriverIncidentForm({ ...driverIncidentForm, severity: value })} />
                <Input label="Note" value={driverIncidentForm.note} onChange={(value) => setDriverIncidentForm({ ...driverIncidentForm, note: value })} required={false} />
                <button type="submit">Report Incident</button>
              </form>
              <div className="lane-stack section-divider">
                {(driverMobile?.recent_incidents ?? []).slice(0, 8).map((incident) => (
                  <div className="event-card" key={incident.id}>
                    <div className="event-top">
                      <strong>{incident.city}</strong>
                      <span>{incident.incident_type}</span>
                    </div>
                    <p>{incident.note || "No extra note"}</p>
                    <small>severity {Number(incident.severity).toFixed(2)}</small>
                  </div>
                ))}
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
                  The platform connects operational decisions to health and resilience outcomes,
                  helping essential goods reach communities during disruption events.
                </p>
                <ul className="impact-list">
                  <li>SDG 3: improved continuity of medicine, vaccine, and emergency health supply delivery.</li>
                  <li>SDG 9: stronger logistics resilience through disruption-aware rerouting decisions.</li>
                  <li>SDG 11: reduced service disruption risk in high-demand urban beneficiary regions.</li>
                  <li>SDG 12 and 13: lower waste and emissions through fewer delayed or failed dispatches.</li>
                </ul>
              </div>
              <div className="metrics-row single-column">
                <MetricCard label="Warehouse Utilization" value={`${Number(metrics?.warehouse_utilization_pct ?? 0).toFixed(1)}%`} tone="steel" />
                <MetricCard label="On-Time Delivery" value={`${Number(metrics?.on_time_delivery_pct ?? 0).toFixed(1)}%`} tone="teal" />
                <MetricCard label="CO2 Saved" value={`${Number(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg`} tone="coral" />
                <MetricCard label="Idle Time Prevented" value={`${Number(metrics?.idle_minutes_prevented ?? 0).toFixed(0)} min`} tone="amber" />
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

function Input({ label, value, onChange, required = true }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function Select({ label, value, options, onChange, required = true }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
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

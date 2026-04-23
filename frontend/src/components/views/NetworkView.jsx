import { useMemo, useState } from "react";
import { Input, Panel, Select } from "../common/UiPrimitives";

const cityCoordinates = {
  Delhi: { latitude: "28.6139", longitude: "77.2090" },
  Mumbai: { latitude: "19.0760", longitude: "72.8777" },
  Chennai: { latitude: "13.0827", longitude: "80.2707" },
  Bengaluru: { latitude: "12.9716", longitude: "77.5946" },
  Hyderabad: { latitude: "17.3850", longitude: "78.4867" },
  Kolkata: { latitude: "22.5726", longitude: "88.3639" },
  Pune: { latitude: "18.5204", longitude: "73.8567" },
  Jaipur: { latitude: "26.9124", longitude: "75.7873" },
  Ahmedabad: { latitude: "23.0225", longitude: "72.5714" },
  Kochi: { latitude: "9.9312", longitude: "76.2673" },
};

const editableFacilityFields = ["name", "city", "base_capacity_units", "current_inventory_units"];

function getFacilityUtilization(facility) {
  if (!facility || !facility.base_capacity_units) {
    return 0;
  }
  return (facility.current_inventory_units / facility.base_capacity_units) * 100;
}

function getUtilizationStatus(utilizationPct) {
  if (utilizationPct >= 90) {
    return { label: "critical", tone: "danger" };
  }
  if (utilizationPct >= 70) {
    return { label: "warning", tone: "warning" };
  }
  return { label: "healthy", tone: "good" };
}

function coerceFacilityFieldValue(field, value) {
  if (["base_capacity_units", "current_inventory_units"].includes(field)) {
    return Number(value);
  }
  return value;
}

export function NetworkView({
  facilities,
  drivers,
  portLinks,
  facilityLookup,
  facilityForm,
  setFacilityForm,
  handleFacilitySubmit,
  vehicleForm,
  setVehicleForm,
  handleVehicleSubmit,
  portLinkForm,
  setPortLinkForm,
  handlePortLinkSubmit,
  handleFacilityQuickUpdate,
  handleFacilityDelete,
  handlePortLinkQuickUpdate,
  handlePortLinkDelete,
}) {
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [facilityValidationError, setFacilityValidationError] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [editingFacility, setEditingFacility] = useState(null);
  const [editingPortLinkId, setEditingPortLinkId] = useState(null);
  const [editingPortLinkForm, setEditingPortLinkForm] = useState({
    warehouse_id: "",
    port_id: "",
    reserved_capacity_units: "0",
    spillover_threshold_pct: "80",
    max_spillover_units: "0",
    active: true,
  });

  const cityOptions = useMemo(() => {
    const combined = new Set([...Object.keys(cityCoordinates), ...facilities.map((facility) => facility.city)]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [facilities]);

  const sortedFilteredFacilities = useMemo(() => {
    const filtered = facilities.filter((facility) => {
      const utilization = getFacilityUtilization(facility);
      const status = getUtilizationStatus(utilization).label;
      const passesCity = cityFilter === "all" || facility.city === cityFilter;
      const passesType = typeFilter === "all" || facility.facility_type === typeFilter;
      const passesStatus = statusFilter === "all" || status === statusFilter;
      return passesCity && passesType && passesStatus;
    });

    return filtered.sort((left, right) => {
      const leftUtilization = getFacilityUtilization(left);
      const rightUtilization = getFacilityUtilization(right);
      const key = sortConfig.key;
      const leftValue = key === "utilization" ? leftUtilization : left[key];
      const rightValue = key === "utilization" ? rightUtilization : right[key];
      const directionFactor = sortConfig.direction === "asc" ? 1 : -1;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * directionFactor;
      }

      return String(leftValue).localeCompare(String(rightValue)) * directionFactor;
    });
  }, [cityFilter, facilities, sortConfig.direction, sortConfig.key, statusFilter, typeFilter]);

  const selectedWarehouse = facilityLookup[Number(portLinkForm.warehouse_id)] ?? null;
  const selectedWarehouseThresholdUnits = selectedWarehouse
    ? Math.round((selectedWarehouse.base_capacity_units * Number(portLinkForm.spillover_threshold_pct || 0)) / 100)
    : null;

  const projectedEffectiveCapacity = selectedWarehouse
    ? Math.max(
        0,
        selectedWarehouse.base_capacity_units - Number(portLinkForm.reserved_capacity_units || 0) + Number(portLinkForm.max_spillover_units || 0),
      )
    : null;

  function toggleSort(column) {
    setSortConfig((current) => {
      if (current.key !== column) {
        return { key: column, direction: "asc" };
      }
      return {
        key: column,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  }

  function formatSortIndicator(column) {
    if (sortConfig.key !== column) {
      return "↕";
    }
    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  function startFacilityEdit(facility, field) {
    if (!editableFacilityFields.includes(field)) {
      return;
    }
    setEditingFacility({
      id: facility.id,
      field,
      value: String(facility[field] ?? ""),
    });
  }

  function cancelFacilityEdit() {
    setEditingFacility(null);
  }

  async function saveFacilityInlineEdit() {
    if (!editingFacility) {
      return;
    }

    const facility = facilities.find((item) => item.id === editingFacility.id);
    if (!facility) {
      cancelFacilityEdit();
      return;
    }

    const nextValue = coerceFacilityFieldValue(editingFacility.field, editingFacility.value);
    if (facility[editingFacility.field] === nextValue) {
      cancelFacilityEdit();
      return;
    }

    await handleFacilityQuickUpdate(editingFacility.id, {
      [editingFacility.field]: nextValue,
    });
    cancelFacilityEdit();
  }

  function onFacilityCellKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveFacilityInlineEdit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelFacilityEdit();
    }
  }

  async function onFacilityCreateSubmit(event) {
    event.preventDefault();
    setFacilityValidationError("");

    const normalizedName = facilityForm.name.trim().toLowerCase();
    const duplicateName = facilities.some(
      (facility) => facility.name.trim().toLowerCase() === normalizedName,
    );

    if (!normalizedName) {
      setFacilityValidationError("Facility name is required.");
      return;
    }

    if (duplicateName) {
      setFacilityValidationError("Facility name must be unique.");
      return;
    }

    const latitude = Number(facilityForm.latitude);
    const longitude = Number(facilityForm.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setFacilityValidationError("Latitude/Longitude must be valid coordinates.");
      return;
    }

    await handleFacilitySubmit(event);
    setShowFacilityModal(false);
  }

  function onFacilityCityChange(nextCity) {
    const coordinates = cityCoordinates[nextCity];
    if (coordinates) {
      setFacilityForm({
        ...facilityForm,
        city: nextCity,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      return;
    }

    setFacilityForm({ ...facilityForm, city: nextCity });
  }

  async function onDeleteFacilityClicked(facility) {
    const confirmed = window.confirm(`Delete ${facility.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }
    await handleFacilityDelete(facility.id);
  }

  function beginPortLinkEdit(portLink) {
    setEditingPortLinkId(portLink.id);
    setEditingPortLinkForm({
      warehouse_id: String(portLink.warehouse_id),
      port_id: String(portLink.port_id),
      reserved_capacity_units: String(portLink.reserved_capacity_units),
      spillover_threshold_pct: String(portLink.spillover_threshold_pct),
      max_spillover_units: String(portLink.max_spillover_units),
      active: Boolean(portLink.active),
    });
  }

  function cancelPortLinkEdit() {
    setEditingPortLinkId(null);
  }

  async function savePortLinkEdit(portLinkId) {
    await handlePortLinkQuickUpdate(portLinkId, {
      warehouse_id: Number(editingPortLinkForm.warehouse_id),
      port_id: Number(editingPortLinkForm.port_id),
      reserved_capacity_units: Number(editingPortLinkForm.reserved_capacity_units),
      spillover_threshold_pct: Number(editingPortLinkForm.spillover_threshold_pct),
      max_spillover_units: Number(editingPortLinkForm.max_spillover_units),
      active: Boolean(editingPortLinkForm.active),
    });
    cancelPortLinkEdit();
  }

  async function onDeletePortLinkClicked(link) {
    const confirmed = window.confirm(
      `Remove link ${facilityLookup[link.warehouse_id]?.name ?? link.warehouse_id} → ${facilityLookup[link.port_id]?.name ?? link.port_id}?`,
    );
    if (!confirmed) {
      return;
    }
    await handlePortLinkDelete(link.id);
  }

  return (
    <section className="grid-two">
      <Panel title="Facilities Management">
        <div className="action-row">
          <button type="button" onClick={() => setShowFacilityModal(true)}>
            Add Facility
          </button>
          <small className="hint-text">Double-click Name/City/Capacity/Inventory cells to quick edit.</small>
        </div>

        <div className="filter-row section-divider">
          <Select
            label="City"
            value={cityFilter}
            options={[["all", "All Cities"], ...cityOptions.map((city) => [city, city])]}
            onChange={setCityFilter}
          />
          <Select
            label="Type"
            value={typeFilter}
            options={[
              ["all", "All Types"],
              ["warehouse", "Warehouse"],
              ["port", "Port"],
            ]}
            onChange={setTypeFilter}
          />
          <Select
            label="Status"
            value={statusFilter}
            options={[
              ["all", "All Status"],
              ["healthy", "Healthy (<70%)"],
              ["warning", "Warning (70-90%)"],
              ["critical", "Critical (>90%)"],
            ]}
            onChange={setStatusFilter}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort("name")}>Name {formatSortIndicator("name")}</button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort("city")}>City {formatSortIndicator("city")}</button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort("facility_type")}>Type {formatSortIndicator("facility_type")}</button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort("base_capacity_units")}>Capacity {formatSortIndicator("base_capacity_units")}</button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort("current_inventory_units")}>Current Inventory {formatSortIndicator("current_inventory_units")}</button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort("utilization")}>Utilization % {formatSortIndicator("utilization")}</button>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredFacilities.map((facility) => {
                const utilization = getFacilityUtilization(facility);
                const status = getUtilizationStatus(utilization);

                return (
                  <tr key={facility.id}>
                    {editableFacilityFields.map((field) => (
                      <td key={`${facility.id}-${field}`} onDoubleClick={() => startFacilityEdit(facility, field)}>
                        {editingFacility?.id === facility.id && editingFacility?.field === field ? (
                          <input
                            autoFocus
                            value={editingFacility.value}
                            onChange={(event) => setEditingFacility({ ...editingFacility, value: event.target.value })}
                            onBlur={saveFacilityInlineEdit}
                            onKeyDown={onFacilityCellKeyDown}
                          />
                        ) : field.includes("units") ? (
                          Number(facility[field]).toLocaleString()
                        ) : (
                          facility[field]
                        )}
                      </td>
                    ))}
                    <td>{utilization.toFixed(1)}%</td>
                    <td>
                      <span className={`status-badge ${status.tone}`}>{status.label}</span>
                    </td>
                    <td>
                      <button type="button" className="small danger" onClick={() => onDeleteFacilityClicked(facility)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Port Links Management">
        <form className="form-grid" onSubmit={handlePortLinkSubmit}>
          <Select
            label="Warehouse"
            value={portLinkForm.warehouse_id}
            options={facilities
              .filter((facility) => facility.facility_type === "warehouse")
              .map((facility) => [String(facility.id), `${facility.name} (${facility.city})`])}
            onChange={(value) => setPortLinkForm({ ...portLinkForm, warehouse_id: value })}
          />
          <Select
            label="Linked Port"
            value={portLinkForm.port_id}
            options={facilities
              .filter((facility) => facility.facility_type === "port")
              .map((facility) => [String(facility.id), `${facility.name} (${facility.city})`])}
            onChange={(value) => setPortLinkForm({ ...portLinkForm, port_id: value })}
          />
          <Input
            label="Reserved Capacity"
            value={portLinkForm.reserved_capacity_units}
            onChange={(value) => setPortLinkForm({ ...portLinkForm, reserved_capacity_units: value })}
          />
          <Input
            label="Spillover Threshold %"
            value={portLinkForm.spillover_threshold_pct}
            onChange={(value) => setPortLinkForm({ ...portLinkForm, spillover_threshold_pct: value })}
          />
          <Input
            label="Max Spillover"
            value={portLinkForm.max_spillover_units}
            onChange={(value) => setPortLinkForm({ ...portLinkForm, max_spillover_units: value })}
          />
          <button type="submit">Create Port Link</button>
        </form>

        {selectedWarehouse ? (
          <div className="info-card section-divider">
            <strong>Spillover impact preview</strong>
            <p>
              For <b>{selectedWarehouse.name}</b>, spillover starts near <b>{selectedWarehouseThresholdUnits?.toLocaleString()} units</b> and projected effective capacity can reach <b>{projectedEffectiveCapacity?.toLocaleString()} units</b> when spillover engages.
            </p>
          </div>
        ) : null}

        <div className="table-wrap section-divider">
          <table>
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Port</th>
                <th>Reserved Capacity</th>
                <th>Spillover Threshold %</th>
                <th>Max Spillover</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portLinks.map((link) => {
                const warehouse = facilityLookup[link.warehouse_id];
                const utilization = getFacilityUtilization(warehouse);
                const isSpilloverActive = Boolean(link.active) && utilization >= Number(link.spillover_threshold_pct);

                if (editingPortLinkId === link.id) {
                  return (
                    <tr key={link.id} className="port-link-row editing">
                      <td>
                        <select
                          value={editingPortLinkForm.warehouse_id}
                          onChange={(event) => setEditingPortLinkForm({ ...editingPortLinkForm, warehouse_id: event.target.value })}
                        >
                          {facilities
                            .filter((facility) => facility.facility_type === "warehouse")
                            .map((facility) => (
                              <option key={facility.id} value={facility.id}>
                                {facility.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={editingPortLinkForm.port_id}
                          onChange={(event) => setEditingPortLinkForm({ ...editingPortLinkForm, port_id: event.target.value })}
                        >
                          {facilities
                            .filter((facility) => facility.facility_type === "port")
                            .map((facility) => (
                              <option key={facility.id} value={facility.id}>
                                {facility.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <input
                          value={editingPortLinkForm.reserved_capacity_units}
                          onChange={(event) => setEditingPortLinkForm({ ...editingPortLinkForm, reserved_capacity_units: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={editingPortLinkForm.spillover_threshold_pct}
                          onChange={(event) => setEditingPortLinkForm({ ...editingPortLinkForm, spillover_threshold_pct: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={editingPortLinkForm.max_spillover_units}
                          onChange={(event) => setEditingPortLinkForm({ ...editingPortLinkForm, max_spillover_units: event.target.value })}
                        />
                      </td>
                      <td>
                        <label className="inline-check">
                          <input
                            type="checkbox"
                            checked={editingPortLinkForm.active}
                            onChange={(event) => setEditingPortLinkForm({ ...editingPortLinkForm, active: event.target.checked })}
                          />
                          active
                        </label>
                      </td>
                      <td className="table-actions">
                        <button type="button" className="small" onClick={() => savePortLinkEdit(link.id)}>
                          Save
                        </button>
                        <button type="button" className="small" onClick={cancelPortLinkEdit}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={link.id} className={isSpilloverActive ? "port-link-row spillover-active" : "port-link-row"}>
                    <td>{facilityLookup[link.warehouse_id]?.name ?? `Facility ${link.warehouse_id}`}</td>
                    <td>{facilityLookup[link.port_id]?.name ?? `Facility ${link.port_id}`}</td>
                    <td>{Number(link.reserved_capacity_units).toLocaleString()}</td>
                    <td>{Number(link.spillover_threshold_pct).toFixed(1)}%</td>
                    <td>{Number(link.max_spillover_units).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${isSpilloverActive ? "danger" : "good"}`}>
                        {isSpilloverActive ? "spillover active" : "normal"}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button type="button" className="small" onClick={() => beginPortLinkEdit(link)}>
                        Edit
                      </button>
                      <button type="button" className="small danger" onClick={() => onDeletePortLinkClicked(link)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form className="form-grid section-divider" onSubmit={handleVehicleSubmit}>
          <Input
            label="Quick Add Vehicle ID"
            value={vehicleForm.identifier}
            onChange={(value) => setVehicleForm({ ...vehicleForm, identifier: value })}
          />
          <Input
            label="Payload Units"
            value={vehicleForm.payload_capacity_units}
            onChange={(value) => setVehicleForm({ ...vehicleForm, payload_capacity_units: value })}
          />
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
          <button type="submit">Add Vehicle</button>
        </form>
      </Panel>

      {showFacilityModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFacilityModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <h2>Create Facility</h2>
              <button type="button" className="small" onClick={() => setShowFacilityModal(false)}>
                Close
              </button>
            </div>

            {facilityValidationError ? <div className="banner error">{facilityValidationError}</div> : null}

            <form className="form-grid" onSubmit={onFacilityCreateSubmit}>
              <Input
                label="Name"
                value={facilityForm.name}
                onChange={(value) => setFacilityForm({ ...facilityForm, name: value })}
              />
              <Select
                label="City"
                value={facilityForm.city}
                options={cityOptions.map((city) => [city, city])}
                onChange={onFacilityCityChange}
              />
              <Select
                label="Type"
                value={facilityForm.facility_type}
                options={[
                  ["warehouse", "Warehouse"],
                  ["port", "Port"],
                ]}
                onChange={(value) => setFacilityForm({ ...facilityForm, facility_type: value })}
              />
              <Input
                label="Base Capacity"
                value={facilityForm.base_capacity_units}
                onChange={(value) => setFacilityForm({ ...facilityForm, base_capacity_units: value })}
              />
              <Input
                label="Initial Inventory"
                value={facilityForm.initial_inventory_units}
                onChange={(value) =>
                  setFacilityForm({
                    ...facilityForm,
                    initial_inventory_units: value,
                    current_inventory_units: value,
                  })
                }
              />

              <label className="inline-check field full">
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(event) => setAdvancedMode(event.target.checked)}
                />
                <span>Advanced mode</span>
              </label>

              {advancedMode ? (
                <>
                  <Input
                    label="Latitude"
                    value={facilityForm.latitude}
                    onChange={(value) => setFacilityForm({ ...facilityForm, latitude: value })}
                  />
                  <Input
                    label="Longitude"
                    value={facilityForm.longitude}
                    onChange={(value) => setFacilityForm({ ...facilityForm, longitude: value })}
                  />
                  <Input
                    label="Current Inventory"
                    value={facilityForm.current_inventory_units}
                    onChange={(value) => setFacilityForm({ ...facilityForm, current_inventory_units: value })}
                  />
                  <Input
                    label="Queue Capacity"
                    value={facilityForm.queue_capacity_units}
                    onChange={(value) => setFacilityForm({ ...facilityForm, queue_capacity_units: value })}
                  />
                </>
              ) : null}

              <div className="action-row field full">
                <button type="submit">Create Facility</button>
                <button type="button" className="small" onClick={() => setShowFacilityModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

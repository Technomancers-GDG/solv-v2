import { useState, useMemo } from "react";
import { Panel } from "../common/UiPrimitives";

export function NetworkView({ facilities, vehicles }) {
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState("all");
  const [fleetSearch, setFleetSearch] = useState("");
  const [fleetStatusFilter, setFleetStatusFilter] = useState("all");

  const facilityTypes = useMemo(() => {
    const types = new Set(facilities.map((f) => f.facility_type));
    return ["all", ...types];
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        !facilitySearch ||
        f.name?.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.city?.toLowerCase().includes(facilitySearch.toLowerCase());
      const matchesType =
        facilityTypeFilter === "all" || f.facility_type === facilityTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [facilities, facilitySearch, facilityTypeFilter]);

  const vehicleStatuses = useMemo(() => {
    const statuses = new Set(vehicles.map((v) => v.status));
    return ["all", ...statuses];
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        !fleetSearch ||
        v.identifier?.toLowerCase().includes(fleetSearch.toLowerCase()) ||
        v.vehicle_type?.toLowerCase().includes(fleetSearch.toLowerCase());
      const matchesStatus =
        fleetStatusFilter === "all" || v.status === fleetStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, fleetSearch, fleetStatusFilter]);

  return (
    <div className="view-network">
      <div className="grid-two">
        <Panel title={`Facilities (${filteredFacilities.length})`}>
          <div className="search-controls">
            <div className="search-input-wrap">
              <span className="search-input-icon">&#x1F50D;</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search by name or city..."
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={facilityTypeFilter}
              onChange={(e) => setFacilityTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {facilityTypes.filter((t) => t !== "all").map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">Name</th><th scope="col">City</th><th scope="col">Type</th><th scope="col">Capacity</th><th scope="col">Inventory</th></tr></thead>
              <tbody>{filteredFacilities.length === 0 ? (
                <tr><td colSpan="5" className="empty">No facilities match your search.</td></tr>
              ) : filteredFacilities.map((f) => (
                <tr key={f.id}><td>{f.name}</td><td>{f.city}</td><td>{f.facility_type}</td><td>{f.base_capacity_units.toLocaleString()}</td><td>{f.current_inventory_units.toLocaleString()}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title={`Fleet (${filteredVehicles.length})`}>
          <div className="search-controls">
            <div className="search-input-wrap">
              <span className="search-input-icon">&#x1F50D;</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search by ID or type..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={fleetStatusFilter}
              onChange={(e) => setFleetStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {vehicleStatuses.filter((s) => s !== "all").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">ID</th><th scope="col">Type</th><th scope="col">Payload</th><th scope="col">Speed</th><th scope="col">Emission</th><th scope="col">Status</th></tr></thead>
              <tbody>{filteredVehicles.length === 0 ? (
                <tr><td colSpan="6" className="empty">No vehicles match your search.</td></tr>
              ) : filteredVehicles.map((v) => (
                <tr key={v.id}><td>{v.identifier}</td><td>{v.vehicle_type}</td><td>{v.payload_capacity_units}</td><td>{v.average_speed_kmph}</td><td>{v.emission_kg_per_km}</td><td>{v.status}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

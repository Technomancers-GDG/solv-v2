import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { Panel, Select } from "../common/UiPrimitives";
export function MapView({ facilities = [], vehicles = [], objectives = [], recommendations = [] }) {
  const [filterVehicleId, setFilterVehicleId] = useState("");
  const [filterObjectiveId, setFilterObjectiveId] = useState("");
  const [showDisruptions, setShowDisruptions] = useState(true);
  const [showAlternateRoutes, setShowAlternateRoutes] = useState(true);

  // Calculate statistics for the map
  const mapStats = useMemo(() => {
    const facilityLocations = facilities.filter((f) => f.latitude && f.longitude).length;
    const activeVehicles = vehicles.filter((v) => v.status !== "idle").length;
    const pendingReroutes = recommendations.filter((r) => r.action === "reroute").length;

    return {
      facilitiesOnMap: facilityLocations,
      activeVehicles,
      pendingReroutes,
      totalDistance: vehicles.reduce((sum, v) => sum + (v.estimated_distance_km || 0), 0),
    };
  }, [facilities, vehicles, recommendations]);

  // Mock route data for visualization
  const mockRoutes = useMemo(() => {
    return vehicles
      .filter((v) => !filterVehicleId || v.id === parseInt(filterVehicleId))
      .slice(0, 10)
      .map((vehicle) => {
        const objective = objectives.find((o) => o.id === vehicle.current_objective_id);
        return {
          vehicleId: vehicle.id,
          identifier: vehicle.identifier,
          status: vehicle.status,
          currentLat: vehicle.current_latitude || 28.6139,
          currentLon: vehicle.current_longitude || 77.209,
          originLat: objective?.origin_facility_id ? 28.7041 : 28.6139,
          originLon: objective?.origin_facility_id ? 77.1025 : 77.209,
          destLat: objective?.destination_facility_id ? 12.9716 : 13.1939,
          destLon: objective?.destination_facility_id ? 77.5946 : 80.1398,
          objectiveName: objective?.name || "No objective",
          progress: vehicle.current_progress_pct || 0,
        };
      });
  }, [vehicles, objectives, filterVehicleId]);

  // Group facilities by city for density visualization
  const facilitiesByCity = useMemo(() => {
    const grouped = {};
    facilities.forEach((f) => {
      if (!grouped[f.city]) {
        grouped[f.city] = [];
      }
      grouped[f.city].push(f);
    });
    return grouped;
  }, [facilities]);

  return (
    <section className="map-layout">
      {/* Map Controls & Info */}
      <Panel title="Route & Facility Map">
        <div className="map-controls">
          <div className="control-row">
            <Select
              label="Filter Vehicle"
              value={filterVehicleId}
              options={[
                ["", "All Vehicles"],
                ...vehicles.map((v) => [String(v.id), v.identifier]),
              ]}
              onChange={setFilterVehicleId}
            />

            <Select
              label="Filter Objective"
              value={filterObjectiveId}
              options={[
                ["", "All Objectives"],
                ...objectives.map((o) => [String(o.id), o.name]),
              ]}
              onChange={setFilterObjectiveId}
            />
          </div>

          <div className="control-row checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showDisruptions}
                onChange={(e) => setShowDisruptions(e.target.checked)}
              />
              <span>Show Disruption Zones</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showAlternateRoutes}
                onChange={(e) => setShowAlternateRoutes(e.target.checked)}
              />
              <span>Show Alternative Routes</span>
            </label>
          </div>
        </div>

        {/* Real Leaflet Map */}
        <div className="map-container" style={{ height: "500px", width: "100%", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border)" }}>
          <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%", background: "#e5e5e5" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {facilities.map((f, i) => f.latitude && f.longitude && (
              <Marker 
                key={`fac-${i}`} 
                position={[Number(f.latitude), Number(f.longitude)]}
                icon={L.divIcon({ html: `<div style="font-size: 20px; transform: translate(-50%, -50%);">${f.facility_type === 'port' ? '🚢' : '🏢'}</div>`, className: 'facility-marker', iconSize: [0,0] })}
              >
                <Popup>
                  <strong>{f.name}</strong><br/>
                  {f.city} • {f.facility_type}<br/>
                  Inventory: {f.current_inventory_units}/{f.base_capacity_units}
                </Popup>
              </Marker>
            ))}
            {mockRoutes.map((route, i) => (
              <React.Fragment key={`rt-${i}`}>
                <Polyline 
                  positions={[
                    [Number(route.originLat), Number(route.originLon)], 
                    [Number(route.destLat), Number(route.destLon)]
                  ]} 
                  pathOptions={{ color: '#191a23', weight: 2, opacity: 0.3, dashArray: '5, 5' }} 
                />
                <Marker 
                  position={[Number(route.currentLat), Number(route.currentLon)]}
                  icon={L.divIcon({ html: `<div style="font-size: 24px; transform: translate(-50%, -50%); transition: all 1s linear;">🚛</div>`, className: 'truck-marker', iconSize: [0,0] })}
                >
                  <Popup>
                    <strong>ID: {route.identifier}</strong><br/>
                    Status: {route.status}<br/>
                    {route.objectiveName}<br/>
                    Progress: {route.progress.toFixed(1)}%
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

          {/* Map Info Card */}
          <div className="map-info-card">
            <h4>Map Overview</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Facilities Mapped</span>
                <span className="value">{mapStats.facilitiesOnMap}</span>
              </div>
              <div className="info-item">
                <span className="label">Active Vehicles</span>
                <span className="value">{mapStats.activeVehicles}</span>
              </div>
              <div className="info-item">
                <span className="label">Reroute Recommendations</span>
                <span className="value">{mapStats.pendingReroutes}</span>
              </div>
              <div className="info-item">
                <span className="label">Total Distance</span>
                <span className="value">{mapStats.totalDistance.toFixed(0)} km</span>
              </div>
            </div>
          </div>
      </Panel>

      {/* Current Routes Summary */}
      <Panel title="Active Routes">
        {mockRoutes.length === 0 ? (
          <div className="empty">No active routes to display.</div>
        ) : (
          <div className="routes-list">
            {mockRoutes.map((route) => (
              <div key={route.vehicleId} className="route-card">
                <div className="route-header">
                  <strong>{route.identifier}</strong>
                  <span className={`route-status ${route.status}`}>{route.status.toUpperCase()}</span>
                </div>
                <div className="route-details">
                  <span className="route-objective">📦 {route.objectiveName}</span>
                </div>
                <div className="route-progress">
                  <div className="progress-bar-mini">
                    <div className="progress-fill-mini" style={{ width: `${route.progress}%` }} />
                  </div>
                  <span className="progress-label">{route.progress.toFixed(0)}% complete</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Facility Network Summary */}
      <Panel title="Facility Network">
        <div className="facility-summary">
          <h4>Facilities by City</h4>
          <div className="cities-grid">
            {Object.entries(facilitiesByCity).map(([city, cityfacilities]) => (
              <div key={city} className="city-card">
                <div className="city-header">
                  <span className="city-name">{city}</span>
                  <span className="facility-count">{cityfacilities.length}</span>
                </div>
                <div className="facility-types">
                  {cityfacilities.map((f, idx) => (
                    <span key={idx} className={`type-badge ${f.facility_type}`} title={f.name}>
                      {f.facility_type === "warehouse" && "🏢"}
                      {f.facility_type === "port" && "🚢"}
                      {f.facility_type === "distribution" && "📦"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Disruption Zones (if visible) */}
      {showDisruptions && (
        <Panel title="Active Disruption Zones">
          <div className="disruption-zones">
            <div className="disruption-card">
              <div className="disruption-header">
                <span className="disruption-icon">🌧️</span>
                <h5>Coastal Region - Heavy Monsoon</h5>
                <span className="disruption-severity high">High Impact</span>
              </div>
              <p className="disruption-desc">
                Affecting routes through Tamil Nadu and Andhra Pradesh. 3 major ports impacted, 12 shipments rerouted.
              </p>
              <div className="affected-facilities">
                <strong>Affected:</strong> Chennai Port, Visakhapatnam Port, Kochi Warehouse
              </div>
            </div>

            <div className="disruption-card">
              <div className="disruption-header">
                <span className="disruption-icon">🚧</span>
                <h5>National Highway 16 - Road Closure</h5>
                <span className="disruption-severity medium">Medium Impact</span>
              </div>
              <p className="disruption-desc">
                Affecting northbound routes. Recommended alternatives available through inland highways. +2 hours estimated delay.
              </p>
              <div className="affected-facilities">
                <strong>Affected:</strong> Delhi-Bengaluru corridor (NH16 section 80km)
              </div>
            </div>
          </div>
        </Panel>
      )}
    </section>
  );
}

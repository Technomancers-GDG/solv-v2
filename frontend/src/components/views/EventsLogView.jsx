import { useMemo, useState } from "react";
import { Input, Panel, Select } from "../common/UiPrimitives";
import "./EventsLogView.css";


function getEventIcon(eventType) {
  const iconMap = {
    news: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M2 19h10"/></svg>,
    weather: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M12 12v9"/><path d="M8 17l4-4 4 4"/></svg>,
    incident: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    system: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    delay: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    strike: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    blockage: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  };
  return iconMap[eventType] || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}

function getEventTone(severity) {
  if (severity >= 0.7) return "danger";
  if (severity >= 0.4) return "warning";
  return "neutral";
}

function formatRelativeTime(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  } catch {
    return "-";
  }
}

export function EventsLogView({ importEvents, events = [] }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [filterEventType, setFilterEventType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");

  // Extract unique cities from events
  const uniqueCities = useMemo(() => {
    const cities = new Set();
    events.forEach((event) => {
      if (event.city) cities.add(event.city);
    });
    return Array.from(cities).sort();
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Type filter
    if (filterEventType !== "all") {
      filtered = filtered.filter((e) => e.event_type === filterEventType);
    }

    // Severity filter
    if (filterSeverity !== "all") {
      const severityNum = parseFloat(filterSeverity);
      filtered = filtered.filter((e) => {
        const eventSeverity = e.severity ?? 0.5;
        return eventSeverity >= severityNum && eventSeverity < severityNum + 0.3;
      });
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((e) => (e.status || "unresolved") === filterStatus);
    }

    // City filter
    if (filterCity) {
      filtered = filtered.filter((e) => e.city && e.city.toLowerCase().includes(filterCity.toLowerCase()));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "timestamp") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "severity") {
        return (b.severity ?? 0.5) - (a.severity ?? 0.5);
      }
      return 0;
    });

    return filtered;
  }, [events, filterEventType, filterSeverity, filterStatus, filterCity, sortBy]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <section className="events-log-layout" aria-label="Events Log">
      {/* Header with Import Controls */}
      <section className="dashboard-panel" aria-label="Events Log">
        <h2 className="dashboard-panel-title">{"Events Log"}</h2>
        <div className="import-controls" role="group" aria-label="Import tools">
          <button className="primary-btn" onClick={() => importEvents(false)}>
            Import Event Replay
          </button>
          <button className="secondary-btn" onClick={() => importEvents(true)}>
            Full News Import
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="dashboard-panel" aria-label="Filters">
        <h2 className="dashboard-panel-title">{"Filters"}</h2>
        <div className="filter-row" role="search" aria-label="Filter events">
          <Select
            label="Event Type"
            value={filterEventType}
            options={[
              ["all", "All Events"],
              ["news", "News"],
              ["weather", "Weather"],
              ["incident", "Incident"],
              ["system", "System"],
            ]}
            onChange={setFilterEventType}
          />

          <Select
            label="Severity"
            value={filterSeverity}
            options={[
              ["all", "All Severities"],
              ["0.7", "Critical (0.7+)"],
              ["0.4", "High (0.4-0.7)"],
              ["0", "Low (0-0.4)"],
            ]}
            onChange={setFilterSeverity}
          />

          <Select
            label="Status"
            value={filterStatus}
            options={[
              ["all", "All Statuses"],
              ["unresolved", "Unresolved"],
              ["resolved", "Resolved"],
            ]}
            onChange={setFilterStatus}
          />

          <Input
            label="City"
            value={filterCity}
            onChange={setFilterCity}
            placeholder="Filter by city..."
          />

          <Select
            label="Sort By"
            value={sortBy}
            options={[
              ["timestamp", "Latest First"],
              ["severity", "Highest Severity"],
            ]}
            onChange={setSortBy}
          />
        </div>

        <div className="filter-info" role="status" aria-live="polite">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </section>

      {/* Events Timeline */}
      <div className="events-container">
        <section className="dashboard-panel" aria-label={`Events (${filteredEvents.length})`}>
        <h2 className="dashboard-panel-title">{{`Events (${filteredEvents.length}}</h2>
          {filteredEvents.length === 0 ? (
            <p className="empty" role="status">No events match your filters.</p>
          ) : (
            <ul className="events-timeline" aria-label="Timeline of events">
              {filteredEvents.map((event) => {
                const isSelected = event.id === selectedEventId;
                const tone = getEventTone(event.severity ?? 0.5);

                return (
                  <li key={event.id}>
                    <article
                      className={`event-item ${tone} ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedEventId(isSelected ? null : event.id); } }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isSelected}
                    >
                      <div className="event-marker" aria-hidden="true" />
                      <div className="event-content">
                        <header className="event-header">
                          <span className="event-icon" aria-hidden="true">{getEventIcon(event.event_type)}</span>
                          <div className="event-title-section">
                            <h4 className="event-title">{event.title || event.event_type}</h4>
                            <div className="event-meta">
                              <time className="event-time" dateTime={event.created_at}>{formatRelativeTime(event.created_at)}</time>
                              {event.city && <span className="event-city">{event.city}</span>}
                              {event.status && (
                                <span className={`event-status ${event.status}`}>
                                  {event.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="event-severity" aria-label={`Severity: ${Math.round((event.severity ?? 0.5) * 100)}`}>
                            <div className={`severity-dot ${tone}`} aria-hidden="true" />
                            <span>{Math.round((event.severity ?? 0.5) * 100)}</span>
                          </div>
                        </header>

                      <p className="event-summary">{event.summary || event.note || event.description}</p>

                      {isSelected && (
                        <div className="event-expanded">
                          {event.event_type === "news" && (
                            <div className="event-details">
                              <div className="detail-section">
                                <h5>Full Content</h5>
                                <p>{event.content || event.text || "No content available"}</p>
                              </div>
                              {event.source && (
                                <div className="detail-section">
                                  <h5>Source</h5>
                                  <p>{event.source}</p>
                                </div>
                              )}
                              {event.impact_type && (
                                <div className="detail-section">
                                  <h5>Impact Type</h5>
                                  <p>{event.impact_type.replaceAll("_", " ")}</p>
                                </div>
                              )}
                              {event.relevance_classifier && (
                                <div className="detail-section">
                                  <h5>Route Impact Classification</h5>
                                  <p className="classifier">
                                    {event.relevance_classifier === true || event.relevance_classifier === "true"
                                      ? "Route-impacting"
                                      : "Not route-impacting"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {event.event_type === "weather" && (
                            <div className="event-details">
                              <div className="weather-grid">
                                {event.precipitation && (
                                  <div className="weather-item">
                                    <span className="label">Precipitation</span>
                                    <span className="value">{event.precipitation}mm</span>
                                  </div>
                                )}
                                {event.temperature && (
                                  <div className="weather-item">
                                    <span className="label">Temperature</span>
                                    <span className="value">{event.temperature}°C</span>
                                  </div>
                                )}
                                {event.wind_speed && (
                                  <div className="weather-item">
                                    <span className="label">Wind Speed</span>
                                    <span className="value">{event.wind_speed} km/h</span>
                                  </div>
                                )}
                              </div>
                              {event.affected_cities && (
                                <div className="detail-section">
                                  <h5>Affected Cities</h5>
                                  <div className="city-tags">
                                    {event.affected_cities.map((city) => (
                                      <span key={city} className="city-tag">
                                        {city}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {event.forecast_duration && (
                                <div className="detail-section">
                                  <h5>Duration</h5>
                                  <p>{event.forecast_duration}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {event.event_type === "incident" && (
                            <div className="event-details">
                              <div className="detail-section">
                                <h5>Reporter</h5>
                                <p>{event.reporter_name || "Unknown"}</p>
                              </div>
                              {event.vehicle_id && (
                                <div className="detail-section">
                                  <h5>Vehicle</h5>
                                  <p className="vehicle-id">{event.vehicle_identifier}</p>
                                </div>
                              )}
                              <div className="detail-section">
                                <h5>Incident Type</h5>
                                <p>{event.incident_type?.replaceAll("_", " ") || "Unknown"}</p>
                              </div>
                              <div className="detail-section">
                                <h5>Details</h5>
                                <p>{event.full_note || event.note || "No details"}</p>
                              </div>
                              {event.created_at && (
                                <div className="detail-section">
                                  <h5>Reported At</h5>
                                  <p>{new Date(event.created_at).toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {event.affected_facilities && event.affected_facilities.length > 0 && (
                            <div className="detail-section">
                              <h5>Affected Facilities</h5>
                              <div className="facility-list">
                                {event.affected_facilities.map((facility, idx) => (
                                  <span key={idx} className="facility-tag">
                                    {facility}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

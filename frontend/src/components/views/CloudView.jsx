import { Panel } from "../common/UiPrimitives";

/**
 * CloudView — Google Cloud integration health dashboard.
 */
export function CloudView({ cloudHealth }) {
  return (
    <section className="view-cloud" aria-label="Cloud Integration Health">
      <Panel title="Google Cloud Integration Health">
        {cloudHealth ? (
          <div className="cloud-grid" role="list" aria-label="Cloud service statuses">
            {Object.entries(cloudHealth).filter(([k]) => k !== "overall").map(([service, info]) => (
              <article className={`cloud-card ${info.enabled ? "enabled" : "disabled"}`} key={service} aria-label={`${service}: ${info.enabled ? "Enabled" : "Disabled"}`}>
                <strong>{service.replace("_", " ").toUpperCase()}</strong>
                <span>{info.enabled ? "\u2713 Enabled" : "\u25CB Disabled"}</span>
                {info.project && <div className="cloud-meta">Project: {info.project}</div>}
                {info.region && <div className="cloud-meta">Region: {info.region}</div>}
                {info.dataset && <div className="cloud-meta">Dataset: {info.dataset}</div>}
              </article>
            ))}
            <div className={`cloud-overall ${cloudHealth.overall === "healthy" ? "healthy" : "stub"}`} role="status">
              Overall: {cloudHealth.overall}
            </div>
          </div>
        ) : <p className="empty">Cloud health unavailable.</p>}
      </Panel>
    </section>
  );
}

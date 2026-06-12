export function TabNavigation({ tabs, activeTab, onSelect, isLive }) {
  return (
    <div className="tab-nav-shell">
      <nav className="tabs" role="tablist" aria-label="Primary sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            className={tab === activeTab ? "tab active" : "tab"}
            onClick={() => onSelect(tab)}
            aria-selected={tab === activeTab}
            tabIndex={tab === activeTab ? 0 : -1}
          >
            {tab}
          </button>
        ))}
      </nav>
      <span className={isLive ? "live-indicator connected" : "live-indicator"}>
        {isLive ? "Live" : "Offline"}
      </span>
    </div>
  );
}

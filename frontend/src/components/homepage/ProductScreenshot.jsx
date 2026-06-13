import React, { useState } from "react";

export default function ProductScreenshot({ screenshotUrl, chromeTitle, badges = [] }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="hp-browser-frame">
      {/* Top Browser Chrome Bar */}
      <div className="hp-browser-chrome">
        <div className="hp-chrome-dots">
          <span className="hp-chrome-dot red"></span>
          <span className="hp-chrome-dot yellow"></span>
          <span className="hp-chrome-dot green"></span>
        </div>
        <div className="hp-chrome-title">{chromeTitle}</div>
      </div>

      {/* Main Image Viewport Area */}
      <div className="hp-screenshot-container">
        {/* Loading state visual indicator */}
        {!imgLoaded && (
          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--color-charcoal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)"
            }}
          >
            <span>Loading interface layer...</span>
          </div>
        )}

        <img
          src={screenshotUrl}
          alt={chromeTitle}
          className="hp-screenshot-image"
          onLoad={() => setImgLoaded(true)}
          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 300ms ease-out" }}
        />

        {/* Floating Context Badges (bottom-left corner) */}
        {badges.length > 0 && (
          <div className="hp-screenshot-badges">
            {badges.map((badge, idx) => (
              <span key={idx} className="hp-screenshot-badge">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

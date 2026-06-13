import React from "react";
import { ARCHITECTURE_LAYERS } from "../../utils/homepage-constants";

export default function ArchitectureDiagram() {
  return (
    <div className="hp-arch-container reveal-fade-left">
      <div className="hp-arch-header">
        LogiSight Platform Architecture
      </div>
      
      {/* Dynamic Architecture Layers (top-to-bottom) */}
      {ARCHITECTURE_LAYERS.map((layer) => (
        <div 
          key={layer.name} 
          className={`hp-arch-layer ${layer.className}`}
        >
          <div className="hp-arch-layer-title">
            {layer.name}
          </div>
          <div className="hp-arch-layer-items">
            {layer.items.join("  ·  ")}
          </div>
        </div>
      ))}
    </div>
  );
}

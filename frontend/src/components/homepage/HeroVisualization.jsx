import React from "react";

export default function HeroVisualization() {
  // Coordinates based on x/y mapping for a 400x500 box
  const nodes = [
    { name: "Delhi", x: 131, y: 152, delay: "0s" },
    { name: "Mumbai", x: 76, y: 305, delay: "0.6s" },
    { name: "Bengaluru", x: 136, y: 403, delay: "1.2s" },
    { name: "Chennai", x: 171, y: 402, delay: "1.8s" },
    { name: "Kolkata", x: 276, y: 249, delay: "2.4s" },
    { name: "Hyderabad", x: 148, y: 333, delay: "0.3s" },
    { name: "Ahmedabad", x: 72, y: 242, delay: "0.9s" },
    { name: "Nagpur", x: 156, y: 273, delay: "1.5s" }
  ];

  // Visual routes linking hubs
  const routes = [
    { id: "delhi-mumbai", path: "M 131,152 Q 100,228 76,305" },
    { id: "mumbai-blr", path: "M 76,305 Q 106,354 136,403" },
    { id: "blr-chennai", path: "M 136,403 L 171,402" },
    { id: "chennai-hyd", path: "M 171,402 Q 160,367 148,333" },
    { id: "hyd-delhi", path: "M 148,333 L 131,152" },
    { id: "kolkata-delhi", path: "M 276,249 Q 203,200 131,152" },
    { id: "mumbai-kolkata", path: "M 76,305 Q 176,277 276,249" }
  ];

  const vehicles = [
    { path: "M 131,152 Q 100,228 76,305", dur: "8s", delay: "0s" },
    { path: "M 76,305 Q 106,354 136,403", dur: "6s", delay: "2s" },
    { path: "M 136,403 L 171,402", dur: "4s", delay: "1s" },
    { path: "M 276,249 Q 203,200 131,152", dur: "10s", delay: "3s" },
    { path: "M 148,333 L 131,152", dur: "7s", delay: "0s" }
  ];

  return (
    <div className="hp-hero-viz">
      <svg 
        viewBox="0 0 400 500" 
        className="hp-network-svg" 
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* India Minimalist Outline Map */}
        <path
          d="M 140,30 L 190,50 L 195,85 L 205,100 L 225,120 L 255,145 L 285,150 L 315,150 L 340,160 L 370,170 L 380,185 L 360,195 L 340,190 L 305,200 L 295,225 L 278,245 L 292,260 L 275,280 L 250,290 L 220,310 L 200,345 L 188,380 L 180,430 L 175,470 L 165,450 L 155,420 L 140,390 L 132,360 L 140,320 L 120,300 L 98,280 L 76,305 L 50,260 L 25,210 L 45,190 L 68,195 L 80,175 L 70,140 L 75,100 L 115,80 Z"
          fill="none"
          stroke="var(--color-blue-slate)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Grid Overlay Lines (Tech Theme) */}
        <g opacity="0.08">
          <line x1="50" y1="0" x2="50" y2="500" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="150" y1="0" x2="150" y2="500" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="250" y1="0" x2="250" y2="500" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="350" y1="0" x2="350" y2="500" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="0" y1="300" x2="400" y2="300" stroke="var(--color-light-blue)" strokeWidth="0.5" />
          <line x1="0" y1="400" x2="400" y2="400" stroke="var(--color-light-blue)" strokeWidth="0.5" />
        </g>

        {/* Route Lines */}
        {routes.map((route) => (
          <path
            key={route.id}
            d={route.path}
            fill="none"
            stroke="var(--color-light-blue)"
            strokeWidth="1.5"
            className="hp-route-line"
            opacity="0.3"
          />
        ))}

        {/* Moving Vehicle Pips */}
        {vehicles.map((v, idx) => (
          <circle key={idx} r="3.5" className="hp-vehicle-pip">
            <animateMotion
              path={v.path}
              dur={v.dur}
              begin={v.delay}
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        ))}

        {/* Facility Nodes */}
        {nodes.map((node) => (
          <g key={node.name}>
            {/* Outer animated pulse ring */}
            <circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="var(--color-light-blue)"
              className="hp-node-pulse"
              style={{ animationDelay: node.delay }}
            />
            {/* Solid inner core */}
            <circle
              cx={node.x}
              cy={node.y}
              r="3.5"
              fill="var(--color-light-blue)"
              stroke="var(--color-black)"
              strokeWidth="1"
            />
            {/* Hub Label */}
            <text
              x={node.x}
              y={node.y - 8}
              fill="var(--color-text-secondary)"
              fontSize="8"
              fontFamily="var(--font-sans)"
              fontWeight="600"
              textAnchor="middle"
              opacity="0.75"
            >
              {node.name.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

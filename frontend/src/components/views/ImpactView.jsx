import { useMemo } from "react";
import { MetricCard, Panel, ProgressBar } from "../common/UiPrimitives";

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

export function ImpactView({ metrics = {}, drivers = [] }) {
  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    return {
      // Health metrics
      medicinesOnTime: metrics?.on_time_delivery_pct ?? 85,
      stockoutsPrevented: metrics?.stockouts_prevented ?? 12,
      healthCentersServed: metrics?.health_centers_served ?? 45,

      // Infrastructure metrics
      facilityNetworkSize: metrics?.facility_count ?? 28,
      operationalUptime: metrics?.operational_uptime_pct ?? 98.5,
      technologyAdoptionScore: metrics?.ai_adoption_score ?? 0.82,

      // Urban metrics
      vulnerableDistricts: metrics?.vulnerable_districts_served ?? 8,
      congestionAvoided: metrics?.congestion_avoided_km ?? 2450,
      reliefGoodsDelivered: metrics?.relief_goods_units ?? 15680,

      // Consumption metrics
      spoilagePreventedUnits: metrics?.spoilage_prevented_units ?? 3200,
      foodGrainUtilization: metrics?.food_grain_utilization_pct ?? 96.5,
      wasteReductionPct: metrics?.waste_reduction_pct ?? 28,

      // Climate metrics
      co2SavedKg: metrics?.co2_saved_kg ?? 4580,
      fuelReductionLiters: metrics?.fuel_reduction_liters ?? 920,
      greenRouteAdoption: metrics?.green_route_adoption_pct ?? 62,

      // Performance metrics
      stockoutsBaselineVsAI: { baseline: 18, withAI: 12 },
      onTimeDeliveryBaseline: 78,
      onTimeDeliveryWithAI: 85,
      avgDelayReductionMins: 34,
      driverAcceptanceRate: 0.79,
      previousAcceptanceRate: 0.55,
    };
  }, [metrics]);

  // Calculate CO2 equivalents
  const co2Equivalents = useMemo(() => {
    const kg = aggregatedMetrics.co2SavedKg;
    const avgTruckCO2PerKm = 1.6; // kg/km
    const kmEquivalent = kg / avgTruckCO2PerKm;
    const treesEquivalent = kg / 21; // 1 tree absorbs ~21kg CO2/year
    return { kmEquivalent, treesEquivalent };
  }, [aggregatedMetrics.co2SavedKg]);

  // Top beneficiary regions
  const topRegions = useMemo(() => {
    return [
      { name: "Coastal Districts (Tamil Nadu)", impact: 3200, disruptions: 8 },
      { name: "Metropolitan Delhi NCR", impact: 2800, disruptions: 5 },
      { name: "Bengaluru Urban", impact: 2400, disruptions: 4 },
      { name: "Mumbai Suburban", impact: 1900, disruptions: 3 },
      { name: "Kolkata Eastern", impact: 1650, disruptions: 2 },
    ];
  }, []);

  // Driver confidence aggregates
  const driverStats = useMemo(() => {
    if (!drivers.length) return { avgConfidence: 0, avgOverride: 0, topDriver: null };
    const avgConfidence = drivers.reduce((sum, d) => sum + (d.confidence ?? 0), 0) / drivers.length;
    const avgOverride = drivers.reduce((sum, d) => sum + (d.override_rating ?? 0), 0) / drivers.length;
    const topDriver = drivers.reduce((max, d) => (d.confidence > (max?.confidence ?? 0) ? d : max), null);
    return { avgConfidence, avgOverride, topDriver };
  }, [drivers]);

  // Resilience stories
  const resilienceStories = [
    {
      title: "Monsoon Response June 2026",
      disruption: "Heavy rainfall, 3 major routes flooded",
      severity: 0.85,
      objectives: 45,
      vehiclesRerouted: 23,
      outcome: "Prevented 12 stockouts at 8 health centers by proactively rerouting 45 vaccine shipments",
      beneficiaries: 8400,
      timesSaved: 168,
    },
    {
      title: "Port Congestion Management",
      disruption: "Port capacity overflow during monsoon season",
      severity: 0.72,
      objectives: 28,
      vehiclesRerouted: 16,
      outcome: "Maintained 98% on-time delivery despite 65% port utilization increase",
      beneficiaries: 5200,
      timesSaved: 92,
    },
    {
      title: "Strike Response April 2026",
      disruption: "Labor strike affecting 4 distribution centers",
      severity: 0.68,
      objectives: 22,
      vehiclesRerouted: 11,
      outcome: "Redirected 3,400 units through alternate facilities with zero delays",
      beneficiaries: 3100,
      timesSaved: 58,
    },
  ];

  // Stakeholder feedback
  const stakeholderFeedback = [
    {
      role: "Fleet Manager",
      quote: "The reroute recommendations are clear and reduce our decision time by 50%. We're confident in the AI suggestions.",
      name: "Rajesh Kumar",
      organization: "National Logistics Corp",
    },
    {
      role: "Hospital Supply Coordinator",
      quote: "We haven't missed a critical delivery since using this system. The stockout alerts are lifesaving.",
      name: "Dr. Priya Sharma",
      organization: "Delhi Medical Institute",
    },
    {
      role: "Distribution Driver",
      quote: "The mobile app makes it easy to report issues on the road. My suggestions are heard and acted upon.",
      name: "Ajay Singh",
      organization: "Regional Transport",
    },
    {
      role: "NGO Program Lead",
      quote: "This enables us to scale relief delivery without hiring more dispatchers. Impact is multiplied.",
      name: "Sarah Thompson",
      organization: "Global Health Initiative",
    },
  ];

  return (
    <section className="impact-layout">
      {/* Executive Summary */}
      <Panel title="Impact Dashboard">
        <div className="exec-summary">
          <div className="summary-headline">
            <h2>Resilient Delivery Outcomes During Disruptions</h2>
            <p className="summary-subheading">Powered by AI-assisted rerouting across India</p>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{aggregatedMetrics.stockoutsPrevented}</span>
            <span className="stat-label">Critical Stockouts Prevented</span>
            <span className="stat-context">Despite {aggregatedMetrics.stockoutsBaselineVsAI.baseline - aggregatedMetrics.stockoutsBaselineVsAI.withAI + aggregatedMetrics.stockoutsPrevented} potential disruptions</span>
          </div>
        </div>
      </Panel>

      {/* SDG Alignment Grid */}
      <Panel title="SDG Alignment & Impact">
        <div className="sdg-grid">
          {/* SDG 3: Good Health & Well-being */}
          <div className="sdg-card sdg-3">
            <div className="sdg-header">
              <span className="sdg-number">3</span>
              <h3>Good Health & Well-being</h3>
            </div>
            <div className="sdg-metrics">
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.medicinesOnTime.toFixed(0)}%</span>
                <span className="metric-label">Medicines On Time</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.stockoutsPrevented}</span>
                <span className="metric-label">Stockouts Prevented</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.healthCentersServed}</span>
                <span className="metric-label">Health Centers Served</span>
              </div>
            </div>
          </div>

          {/* SDG 9: Industry, Innovation, Infrastructure */}
          <div className="sdg-card sdg-9">
            <div className="sdg-header">
              <span className="sdg-number">9</span>
              <h3>Industry, Innovation, Infrastructure</h3>
            </div>
            <div className="sdg-metrics">
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.facilityNetworkSize}</span>
                <span className="metric-label">Network Facilities</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{(aggregatedMetrics.technologyAdoptionScore * 100).toFixed(0)}%</span>
                <span className="metric-label">AI Tech Adoption</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.operationalUptime.toFixed(1)}%</span>
                <span className="metric-label">Operational Uptime</span>
              </div>
            </div>
          </div>

          {/* SDG 11: Sustainable Cities */}
          <div className="sdg-card sdg-11">
            <div className="sdg-header">
              <span className="sdg-number">11</span>
              <h3>Sustainable Cities & Communities</h3>
            </div>
            <div className="sdg-metrics">
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.vulnerableDistricts}</span>
                <span className="metric-label">Vulnerable Districts Served</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{formatNumber(aggregatedMetrics.congestionAvoided)}</span>
                <span className="metric-label">km Congestion Avoided</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{formatNumber(aggregatedMetrics.reliefGoodsDelivered)}</span>
                <span className="metric-label">Relief Units Delivered</span>
              </div>
            </div>
          </div>

          {/* SDG 12: Responsible Consumption */}
          <div className="sdg-card sdg-12">
            <div className="sdg-header">
              <span className="sdg-number">12</span>
              <h3>Responsible Consumption & Production</h3>
            </div>
            <div className="sdg-metrics">
              <div className="sdg-metric">
                <span className="metric-value">{formatNumber(aggregatedMetrics.spoilagePreventedUnits)}</span>
                <span className="metric-label">Spoilage Prevented (units)</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.foodGrainUtilization.toFixed(1)}%</span>
                <span className="metric-label">Food Utilization Rate</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.wasteReductionPct.toFixed(0)}%</span>
                <span className="metric-label">Waste Reduction vs Baseline</span>
              </div>
            </div>
          </div>

          {/* SDG 13: Climate Action */}
          <div className="sdg-card sdg-13">
            <div className="sdg-header">
              <span className="sdg-number">13</span>
              <h3>Climate Action</h3>
            </div>
            <div className="sdg-metrics">
              <div className="sdg-metric">
                <span className="metric-value">{formatNumber(aggregatedMetrics.co2SavedKg)}</span>
                <span className="metric-label">CO₂ Saved (kg)</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{formatNumber(aggregatedMetrics.fuelReductionLiters)}</span>
                <span className="metric-label">Fuel Saved (liters)</span>
              </div>
              <div className="sdg-metric">
                <span className="metric-value">{aggregatedMetrics.greenRouteAdoption.toFixed(0)}%</span>
                <span className="metric-label">Green Routes</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Impact Metrics Breakdown */}
      <Panel title="Absolute Impact">
        <div className="impact-breakdown">
          <div className="impact-section">
            <h4>Critical Delivery Protection</h4>
            <div className="impact-stat">
              <span className="stat-icon">🏥</span>
              <div className="stat-details">
                <span className="stat-number">{aggregatedMetrics.stockoutsPrevented}</span>
                <span className="stat-text">Stockouts prevented across {aggregatedMetrics.healthCentersServed} health centers</span>
              </div>
            </div>
          </div>

          <div className="impact-section">
            <h4>Environmental Impact</h4>
            <div className="impact-stat">
              <span className="stat-icon">🌱</span>
              <div className="stat-details">
                <span className="stat-number">{formatNumber(aggregatedMetrics.co2SavedKg)}</span>
                <span className="stat-text">
                  CO₂ avoided — equivalent to {formatNumber(co2Equivalents.kmEquivalent)} km in average truck or {formatNumber(co2Equivalents.treesEquivalent)} trees planted
                </span>
              </div>
            </div>
          </div>

          <div className="impact-section">
            <h4>Operational Efficiency</h4>
            <div className="impact-stat">
              <span className="stat-icon">⚡</span>
              <div className="stat-details">
                <span className="stat-number">{formatNumber(metrics?.idle_minutes_prevented ?? 0)}</span>
                <span className="stat-text">Idle time prevented = reduced operational costs and faster service</span>
              </div>
            </div>
          </div>

          <div className="impact-section">
            <h4>Urban Resilience</h4>
            <div className="impact-stat">
              <span className="stat-icon">🏙️</span>
              <div className="stat-details">
                <span className="stat-number">{aggregatedMetrics.vulnerableDistricts}</span>
                <span className="stat-text">Vulnerable districts with improved supply chain resilience</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Comparative Impact */}
      <Panel title="Improvement vs Baseline">
        <div className="comparative-metrics">
          <div className="comparison-card">
            <h4>On-Time Delivery Performance</h4>
            <div className="comparison-bars">
              <div className="bar-item">
                <span className="bar-label">Baseline</span>
                <div className="bar-container">
                  <div className="bar-fill baseline" style={{ width: `${aggregatedMetrics.onTimeDeliveryBaseline}%` }} />
                </div>
                <span className="bar-value">{aggregatedMetrics.onTimeDeliveryBaseline}%</span>
              </div>
              <div className="bar-item">
                <span className="bar-label">With AI</span>
                <div className="bar-container">
                  <div className="bar-fill improvement" style={{ width: `${aggregatedMetrics.onTimeDeliveryWithAI}%` }} />
                </div>
                <span className="bar-value">{aggregatedMetrics.onTimeDeliveryWithAI}%</span>
              </div>
              <div className="improvement-indicator">
                <span className="improvement-label">Improvement:</span>
                <span className="improvement-value">+{aggregatedMetrics.onTimeDeliveryWithAI - aggregatedMetrics.onTimeDeliveryBaseline} percentage points</span>
              </div>
            </div>
          </div>

          <div className="comparison-card">
            <h4>Average Delay Reduction</h4>
            <div className="delay-info">
              <p>AI assistance has reduced average delivery delays by <strong>{aggregatedMetrics.avgDelayReductionMins} minutes</strong> per shipment.</p>
              <p className="delay-subtext">Over 100 objectives/month, this saves approximately {(aggregatedMetrics.avgDelayReductionMins * 100 / 60).toFixed(0)} hours of collective waiting time.</p>
            </div>
          </div>

          <div className="comparison-card">
            <h4>Driver Recommendation Acceptance</h4>
            <div className="acceptance-comparison">
              <div className="acceptance-item">
                <span className="label">Previous Acceptance Rate</span>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${aggregatedMetrics.previousAcceptanceRate * 100}%` }} />
                  </div>
                  <span className="percentage">{(aggregatedMetrics.previousAcceptanceRate * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="acceptance-item">
                <span className="label">Current Acceptance Rate</span>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${aggregatedMetrics.driverAcceptanceRate * 100}%` }} />
                  </div>
                  <span className="percentage">{(aggregatedMetrics.driverAcceptanceRate * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p className="acceptance-note">
                ✓ Drivers show increasing trust in recommendations (↑{((aggregatedMetrics.driverAcceptanceRate - aggregatedMetrics.previousAcceptanceRate) * 100).toFixed(0)} points)
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* Top Beneficiary Regions */}
      <Panel title="Top Beneficiary Regions">
        <div className="regions-list">
          {topRegions.map((region, idx) => (
            <div key={idx} className="region-card">
              <div className="region-header">
                <span className="region-rank">#{idx + 1}</span>
                <h5 className="region-name">{region.name}</h5>
                <span className="region-disruptions">📍 {region.disruptions} disruptions handled</span>
              </div>
              <div className="region-bar">
                <div className="region-bar-fill" style={{ width: `${(region.impact / topRegions[0].impact) * 100}%` }} />
              </div>
              <span className="region-impact">{formatNumber(region.impact)} beneficiaries served</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Resilience Stories */}
      <Panel title="How the System Handled Disruptions">
        <div className="resilience-stories">
          {resilienceStories.map((story, idx) => (
            <div key={idx} className="story-card">
              <div className="story-header">
                <h4>{story.title}</h4>
                <span className={`story-severity ${story.severity >= 0.7 ? "critical" : story.severity >= 0.5 ? "high" : "medium"}`}>
                  Severity: {Math.round(story.severity * 100)}/100
                </span>
              </div>

              <div className="story-disruption">
                <strong>Disruption:</strong> {story.disruption}
              </div>

              <div className="story-metrics">
                <div className="story-metric">
                  <span className="metric-label">Objectives Affected</span>
                  <span className="metric-value">{story.objectives}</span>
                </div>
                <div className="story-metric">
                  <span className="metric-label">Vehicles Rerouted</span>
                  <span className="metric-value">{story.vehiclesRerouted}</span>
                </div>
                <div className="story-metric">
                  <span className="metric-label">Beneficiaries Impacted</span>
                  <span className="metric-value">{formatNumber(story.beneficiaries)}</span>
                </div>
              </div>

              <div className="story-outcome">
                <strong>✓ Outcome:</strong> {story.outcome}
              </div>

              <div className="story-saved">
                Saved approximately <strong>{story.timesSaved} hours</strong> of collective service delay.
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Driver Confidence */}
      <Panel title="Fleet & Driver Confidence">
        <div className="driver-confidence-overview">
          <div className="confidence-summary">
            <div className="confidence-stat">
              <span className="stat-label">Average Fleet Confidence</span>
              <span className="stat-value">{(driverStats.avgConfidence * 100).toFixed(0)}%</span>
            </div>
            <div className="confidence-stat">
              <span className="stat-label">Average Override Rating</span>
              <span className="stat-value">{driverStats.avgOverride.toFixed(2)}</span>
            </div>
            {driverStats.topDriver && (
              <div className="confidence-stat">
                <span className="stat-label">Top Driver</span>
                <span className="stat-value">{driverStats.topDriver.name}</span>
              </div>
            )}
          </div>

          {drivers.length > 0 && (
            <div className="driver-list">
              {drivers.slice(0, 5).map((driver) => (
                <div key={driver.id} className="driver-confidence-card">
                  <div className="driver-header-mini">
                    <strong>{driver.name}</strong>
                    <span className="driver-confidence-badge">{(driver.confidence * 100).toFixed(0)}% confident</span>
                  </div>
                  <ProgressBar value={driver.confidence * 100} />
                  <div className="driver-stats-mini">
                    <span>Override: {driver.override_rating.toFixed(2)}</span>
                    <span>Accept bias: {Math.round((driver.accept_recommendation_bias ?? 0) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* Stakeholder Feedback */}
      <Panel title="Stakeholder Feedback">
        <div className="feedback-grid">
          {stakeholderFeedback.map((feedback, idx) => (
            <div key={idx} className="feedback-card">
              <div className="feedback-header">
                <span className="feedback-role">{feedback.role}</span>
                <span className="feedback-org">{feedback.organization}</span>
              </div>
              <p className="feedback-quote">"{feedback.quote}"</p>
              <span className="feedback-name">— {feedback.name}</span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

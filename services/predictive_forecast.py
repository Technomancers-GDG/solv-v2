"""
Predictive Disruption Forecasting using time-series analysis of weather and news patterns.
Forecasts route risk 6-24 hours ahead per city.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import NewsEvent, WeatherEvent


@dataclass(slots=True)
class RiskForecast:
    city: str
    forecast_time: datetime
    predicted_route_risk: float
    predicted_eta_multiplier: float
    predicted_closure_risk: float
    confidence: float
    contributing_factors: list[str]


class PredictiveForecastService:
    """
    Lightweight forecasting using exponential smoothing + trend detection
    on historical weather/news patterns per city.
    """

    def __init__(self, history_window_days: int = 14) -> None:
        self.history_window_days = history_window_days
        self._cache: dict[tuple[str, date], RiskForecast] = {}
        self._cache_time: datetime | None = None

    def _invalidate_cache(self) -> None:
        self._cache.clear()
        self._cache_time = None

    def get_city_history(self, session: Session, city: str, end_date: date) -> list[dict[str, Any]]:
        start_date = end_date - timedelta(days=self.history_window_days)
        weather_rows = session.scalars(
            select(WeatherEvent).where(
                WeatherEvent.city == city,
                WeatherEvent.simulation_date >= start_date,
                WeatherEvent.simulation_date <= end_date,
            ).order_by(WeatherEvent.simulation_date)
        ).all()
        news_rows = session.scalars(
            select(NewsEvent).where(
                NewsEvent.city == city,
                NewsEvent.simulation_date >= start_date,
                NewsEvent.simulation_date <= end_date,
                NewsEvent.relevant.is_(True),
            ).order_by(NewsEvent.simulation_date)
        ).all()

        daily: dict[date, dict[str, Any]] = defaultdict(
            lambda: {"closure_risk": 0.0, "eta_multiplier": 1.0, "impact_score": 0.0, "precip": 0.0}
        )
        for w in weather_rows:
            d = daily[w.simulation_date]
            d["closure_risk"] = max(d["closure_risk"], w.closure_risk)
            d["eta_multiplier"] = max(d["eta_multiplier"], w.eta_multiplier)
            d["precip"] = max(d["precip"], w.precipitation_mm)
        for n in news_rows:
            d = daily[n.simulation_date]
            d["impact_score"] = max(d["impact_score"], n.impact_score)

        result = []
        for sim_date in sorted(daily.keys()):
            d = daily[sim_date]
            combined_risk = min(1.0, max(d["closure_risk"], d["impact_score"]) + d["precip"] * 0.01)
            result.append({
                "date": sim_date,
                "combined_risk": combined_risk,
                "eta_multiplier": d["eta_multiplier"],
                "precip": d["precip"],
                "impact_score": d["impact_score"],
            })
        return result

    def _exponential_smooth(self, values: list[float], alpha: float = 0.3) -> list[float]:
        if not values:
            return []
        smoothed = [values[0]]
        for v in values[1:]:
            smoothed.append(alpha * v + (1 - alpha) * smoothed[-1])
        return smoothed

    def _linear_trend(self, values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        y = np.array(values)
        slope = np.polyfit(x, y, 1)[0]
        return float(slope)

    def forecast_city(self, session: Session, city: str, forecast_hours: int = 12) -> RiskForecast | None:
        now = datetime.utcnow()
        history = self.get_city_history(session, city, now.date())
        if len(history) < 3:
            return None

        risks = [h["combined_risk"] for h in history]
        etas = [h["eta_multiplier"] for h in history]
        smoothed_risks = self._exponential_smooth(risks)
        smoothed_etas = self._exponential_smooth(etas)

        risk_trend = self._linear_trend(smoothed_risks[-7:] if len(smoothed_risks) >= 7 else smoothed_risks)
        eta_trend = self._linear_trend(smoothed_etas[-7:] if len(smoothed_etas) >= 7 else smoothed_etas)

        steps = forecast_hours / 24.0
        predicted_risk = min(1.0, max(0.0, smoothed_risks[-1] + risk_trend * steps))
        predicted_eta = max(1.0, smoothed_etas[-1] + eta_trend * steps)
        predicted_closure = predicted_risk * 0.9

        # Confidence based on data volume
        confidence = min(0.95, 0.4 + len(history) * 0.03)

        factors = []
        if risk_trend > 0.02:
            factors.append("rising risk trend")
        elif risk_trend < -0.02:
            factors.append("declining risk trend")
        if history[-1].get("precip", 0) > 20:
            factors.append("heavy precipitation")
        if history[-1].get("impact_score", 0) > 0.5:
            factors.append("recent high-impact event")

        return RiskForecast(
            city=city,
            forecast_time=now + timedelta(hours=forecast_hours),
            predicted_route_risk=round(predicted_risk, 3),
            predicted_eta_multiplier=round(predicted_eta, 3),
            predicted_closure_risk=round(predicted_closure, 3),
            confidence=round(confidence, 3),
            contributing_factors=factors or ["stable conditions"],
        )

    def forecast_all_cities(self, session: Session, cities: set[str], forecast_hours: int = 12) -> list[RiskForecast]:
        forecasts = []
        for city in cities:
            fc = self.forecast_city(session, city, forecast_hours)
            if fc:
                forecasts.append(fc)
        forecasts.sort(key=lambda f: f.predicted_route_risk, reverse=True)
        return forecasts

    def get_heatmap_data(self, session: Session, cities: set[str], forecast_hours: int = 12) -> list[dict[str, Any]]:
        forecasts = self.forecast_all_cities(session, cities, forecast_hours)
        return [
            {
                "city": f.city,
                "risk": f.predicted_route_risk,
                "eta_multiplier": f.predicted_eta_multiplier,
                "closure_risk": f.predicted_closure_risk,
                "confidence": f.confidence,
                "factors": f.contributing_factors,
                "forecast_time": f.forecast_time.isoformat(),
            }
            for f in forecasts
        ]

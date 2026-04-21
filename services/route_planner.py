from __future__ import annotations

from datetime import datetime
from math import asin, cos, radians, sin, sqrt

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import Facility, RouteTemplate


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lon / 2) ** 2
    )
    return 2 * radius_km * asin(sqrt(a))


class RoutePlanner:
    def __init__(self, osrm_base_url: str | None = None) -> None:
        self.osrm_base_url = (osrm_base_url or settings.osrm_base_url).rstrip("/")

    def route_key(self, origin_id: int, destination_id: int) -> str:
        return f"{origin_id}:{destination_id}"

    def get_or_create_template(
        self, session: Session, origin: Facility, destination: Facility
    ) -> RouteTemplate:
        key = self.route_key(origin.id, destination.id)
        existing = session.scalar(select(RouteTemplate).where(RouteTemplate.route_key == key))
        if existing is not None:
            return existing

        route_data = self._fetch_osrm_route(origin, destination)
        if route_data is None:
            route_data = self._estimated_route(origin, destination)

        route = RouteTemplate(
            route_key=key,
            origin_facility_id=origin.id,
            destination_facility_id=destination.id,
            distance_km=route_data["distance_km"],
            duration_minutes=route_data["duration_minutes"],
            encoded_polyline=route_data["encoded_polyline"],
            steps=route_data["steps"],
            source=route_data["source"],
            refreshed_at=datetime.utcnow(),
        )
        session.add(route)
        session.flush()
        return route

    def prewarm_objective_routes(
        self,
        session: Session,
        facilities: dict[int, Facility],
        objective_destinations: list[tuple[int, list[int]]],
    ) -> None:
        for origin_id, destinations in objective_destinations:
            origin = facilities[origin_id]
            for destination_id in destinations:
                destination = facilities[destination_id]
                self.get_or_create_template(session, origin, destination)

    def _fetch_osrm_route(
        self, origin: Facility, destination: Facility
    ) -> dict[str, object] | None:
        coordinates = (
            f"{origin.longitude},{origin.latitude};"
            f"{destination.longitude},{destination.latitude}"
        )
        url = (
            f"{self.osrm_base_url}/route/v1/driving/{coordinates}"
            "?overview=full&steps=true&geometries=polyline"
        )
        try:
            with httpx.Client(timeout=3.5) as client:
                response = client.get(url)
            response.raise_for_status()
            payload = response.json()
            routes = payload.get("routes", [])
            if not routes:
                return None
            route = routes[0]
            leg = route["legs"][0]
            steps = [
                {
                    "name": step.get("name") or step.get("ref") or "Unnamed segment",
                    "distance_km": round(step.get("distance", 0.0) / 1000, 2),
                    "duration_minutes": round(step.get("duration", 0.0) / 60, 2),
                }
                for step in leg.get("steps", [])[:12]
            ]
            return {
                "distance_km": round(route.get("distance", 0.0) / 1000, 2),
                "duration_minutes": round(route.get("duration", 0.0) / 60, 2),
                "encoded_polyline": route.get("geometry", ""),
                "steps": steps,
                "source": "osrm",
            }
        except Exception:
            return None

    def _estimated_route(self, origin: Facility, destination: Facility) -> dict[str, object]:
        straight_line = haversine_km(
            origin.latitude, origin.longitude, destination.latitude, destination.longitude
        )
        road_distance = max(12.0, straight_line * 1.22)
        average_speed_kmph = 48.0
        duration_minutes = road_distance / average_speed_kmph * 60
        steps = [
            {
                "name": f"Depart {origin.city}",
                "distance_km": round(road_distance * 0.2, 2),
                "duration_minutes": round(duration_minutes * 0.22, 2),
            },
            {
                "name": "National highway corridor",
                "distance_km": round(road_distance * 0.6, 2),
                "duration_minutes": round(duration_minutes * 0.56, 2),
            },
            {
                "name": f"Approach {destination.city}",
                "distance_km": round(road_distance * 0.2, 2),
                "duration_minutes": round(duration_minutes * 0.22, 2),
            },
        ]
        return {
            "distance_km": round(road_distance, 2),
            "duration_minutes": round(duration_minutes, 2),
            "encoded_polyline": "",
            "steps": steps,
            "source": "estimated",
        }

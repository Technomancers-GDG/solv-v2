"""Client portal — dashboard endpoint and live data."""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app_state import simulation_manager
from database import SessionLocal, get_session
from middleware.client_jwt import get_current_client, resolve_client_from_token
from models import (
    ClientSimulation,
    DriverProfile,
    Facility,
    IntegrationClient,
    Objective,
    Recommendation,
    SimEvent,
    Vehicle,
    WebhookDelivery,
    WebhookSubscription,
)
from schemas.client import DashboardResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/client", tags=["Client Portal Dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def client_dashboard(
    client: IntegrationClient = Depends(get_current_client),
    session: Session = Depends(get_session),
):
    cid = client.id

    facilities = session.scalars(
        select(Facility).where(Facility.client_id == cid)
    ).all()
    vehicles = session.scalars(
        select(Vehicle).where(Vehicle.client_id == cid)
    ).all()
    drivers = session.scalars(
        select(DriverProfile).where(DriverProfile.client_id == cid)
    ).all()
    objectives = session.scalars(
        select(Objective).where(Objective.client_id == cid)
    ).all()

    # Fleet list
    fleet = []
    for v in vehicles:
        home = session.get(Facility, v.home_facility_id) if v.home_facility_id else None
        current = session.get(Facility, v.current_facility_id) if v.current_facility_id else None
        obj = session.get(Objective, v.default_objective_id) if v.default_objective_id else None
        fleet.append({
            "id": v.id,
            "identifier": v.identifier,
            "status": v.status,
            "home_facility": home.name if home else None,
            "current_facility": current.name if current else None,
            "eta": str(v.available_at) if v.available_at else None,
            "payload_capacity": v.payload_capacity_units,
        })

    # Metrics
    recent_events = session.scalars(
        select(SimEvent).where(SimEvent.client_id == cid)
        .order_by(SimEvent.processed_time.desc()).limit(50)
    ).all()

    sim = session.scalar(
        select(ClientSimulation).where(ClientSimulation.client_id == cid)
    )

    # Recent decisions
    vehicle_ids = [v.id for v in vehicles]
    recent_decisions = []
    if vehicle_ids:
        decisions = session.scalars(
            select(Recommendation).where(Recommendation.vehicle_id.in_(vehicle_ids))
            .order_by(Recommendation.created_at.desc()).limit(10)
        ).all()
        for d in decisions:
            v = session.get(Vehicle, d.vehicle_id)
            recent_decisions.append({
                "id": d.id,
                "vehicle": v.identifier if v else f"Vehicle #{d.vehicle_id}",
                "action": d.action,
                "explanation": d.explanation,
                "time": str(d.created_at),
            })

    # Webhook deliveries
    subs = session.scalars(
        select(WebhookSubscription).where(WebhookSubscription.client_id == cid)
    ).all()
    sub_ids = [s.id for s in subs]
    webhook_deliveries = []
    if sub_ids:
        deliveries = session.scalars(
            select(WebhookDelivery).where(WebhookDelivery.subscription_id.in_(sub_ids))
            .order_by(WebhookDelivery.attempted_at.desc()).limit(20)
        ).all()
        webhook_deliveries = [
            {
                "id": d.id,
                "event_type": d.event_type,
                "status": "delivered" if d.success else "failed",
                "attempted_at": str(d.attempted_at),
            }
            for d in deliveries
        ]

    # Compute metrics
    active_shipments = sum(1 for v in vehicles if v.status in ("in_transit", "loading", "unloading"))
    completed_shipments = sum(1 for e in recent_events if e.event_type == "unload_complete")

    # Simple on-time estimation
    on_time_events = [e for e in recent_events if e.event_type in ("arrive",)]
    on_time_count = len(on_time_events)

    return DashboardResponse(
        client={
            "name": client.company_name or client.name,
            "api_key_prefix": client.api_key_prefix,
        },
        status={
            "facilities": len(facilities),
            "vehicles": len(vehicles),
            "drivers": len(drivers),
            "objectives": len(objectives),
        },
        fleet=fleet,
        facilities=[
            {
                "id": f.id,
                "name": f.name,
                "city": f.city,
                "utilization_pct": round(f.current_inventory_units / max(f.base_capacity_units, 1) * 100, 1),
                "inventory": f.current_inventory_units,
                "capacity": f.base_capacity_units,
            }
            for f in facilities
        ],
        metrics={
            "active_shipments": active_shipments,
            "completed_shipments": completed_shipments,
            "on_time_delivery_pct": round(on_time_count / max(completed_shipments, 1) * 100, 1),
            "co2_saved_kg": 0.0,
            "total_api_calls": client.monthly_api_calls,
        },
        recent_decisions=recent_decisions,
        webhook_deliveries=webhook_deliveries,
    )


@router.get("/upload-status")
def upload_status(
    client: IntegrationClient = Depends(get_current_client),
    session: Session = Depends(get_session),
):
    cid = client.id
    has_facilities = session.scalar(
        select(func.count(Facility.id)).where(Facility.client_id == cid)
    ) > 0
    has_vehicles = session.scalar(
        select(func.count(Vehicle.id)).where(Vehicle.client_id == cid)
    ) > 0
    has_drivers = session.scalar(
        select(func.count(DriverProfile.id)).where(DriverProfile.client_id == cid)
    ) > 0
    has_objectives = session.scalar(
        select(func.count(Objective.id)).where(Objective.client_id == cid)
    ) > 0

    sim = session.scalar(
        select(ClientSimulation).where(ClientSimulation.client_id == cid)
    )

    return {
        "facilities": has_facilities,
        "vehicles": has_vehicles,
        "drivers": has_drivers,
        "objectives": has_objectives,
        "all_complete": all([has_facilities, has_vehicles, has_drivers, has_objectives]),
        "simulation_status": sim.status if sim else None,
    }

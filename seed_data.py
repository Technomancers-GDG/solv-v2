from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import DriverProfile, Facility, Objective, PortLink, Vehicle


FACILITY_SEEDS = [
    {
        "name": "Delhi Inland Hub",
        "city": "Delhi",
        "facility_type": "warehouse",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "base_capacity_units": 10000,
        "initial_inventory_units": 4200,
        "current_inventory_units": 4200,
        "queue_capacity_units": 1800,
    },
    {
        "name": "Jaipur Aggregation Hub",
        "city": "Jaipur",
        "facility_type": "warehouse",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "base_capacity_units": 9000,
        "initial_inventory_units": 3100,
        "current_inventory_units": 3100,
        "queue_capacity_units": 1200,
    },
    {
        "name": "Ahmedabad Metals Hub",
        "city": "Ahmedabad",
        "facility_type": "warehouse",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "base_capacity_units": 9500,
        "initial_inventory_units": 3300,
        "current_inventory_units": 3300,
        "queue_capacity_units": 1500,
    },
    {
        "name": "Mumbai Coastal Warehouse",
        "city": "Mumbai",
        "facility_type": "warehouse",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "base_capacity_units": 12000,
        "initial_inventory_units": 7200,
        "current_inventory_units": 7200,
        "queue_capacity_units": 2000,
    },
    {
        "name": "Pune Manufacturing Buffer",
        "city": "Pune",
        "facility_type": "warehouse",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "base_capacity_units": 8600,
        "initial_inventory_units": 2800,
        "current_inventory_units": 2800,
        "queue_capacity_units": 1100,
    },
    {
        "name": "Nagpur Central Node",
        "city": "Nagpur",
        "facility_type": "warehouse",
        "latitude": 21.1458,
        "longitude": 79.0882,
        "base_capacity_units": 8300,
        "initial_inventory_units": 2900,
        "current_inventory_units": 2900,
        "queue_capacity_units": 1400,
    },
    {
        "name": "Hyderabad South Connector",
        "city": "Hyderabad",
        "facility_type": "warehouse",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "base_capacity_units": 9300,
        "initial_inventory_units": 3600,
        "current_inventory_units": 3600,
        "queue_capacity_units": 1500,
    },
    {
        "name": "Hosur Auto Cluster",
        "city": "Hosur",
        "facility_type": "warehouse",
        "latitude": 12.7409,
        "longitude": 77.8253,
        "base_capacity_units": 7400,
        "initial_inventory_units": 2500,
        "current_inventory_units": 2500,
        "queue_capacity_units": 900,
    },
    {
        "name": "Bengaluru Distribution Campus",
        "city": "Bengaluru",
        "facility_type": "warehouse",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "base_capacity_units": 11000,
        "initial_inventory_units": 4300,
        "current_inventory_units": 4300,
        "queue_capacity_units": 1900,
    },
    {
        "name": "Chennai Port Warehouse",
        "city": "Chennai",
        "facility_type": "warehouse",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "base_capacity_units": 12500,
        "initial_inventory_units": 8100,
        "current_inventory_units": 8100,
        "queue_capacity_units": 2200,
    },
    {
        "name": "Coimbatore Agro Terminal",
        "city": "Coimbatore",
        "facility_type": "warehouse",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "base_capacity_units": 7200,
        "initial_inventory_units": 2200,
        "current_inventory_units": 2200,
        "queue_capacity_units": 900,
    },
    {
        "name": "Kolkata Eastern Gateway",
        "city": "Kolkata",
        "facility_type": "warehouse",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "base_capacity_units": 9800,
        "initial_inventory_units": 3400,
        "current_inventory_units": 3400,
        "queue_capacity_units": 1600,
    },
    {
        "name": "Surat Textiles Reserve",
        "city": "Surat",
        "facility_type": "warehouse",
        "latitude": 21.1702,
        "longitude": 72.8311,
        "base_capacity_units": 7600,
        "initial_inventory_units": 2600,
        "current_inventory_units": 2600,
        "queue_capacity_units": 1000,
    },
    {
        "name": "Indore Minerals Yard",
        "city": "Indore",
        "facility_type": "warehouse",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "base_capacity_units": 8200,
        "initial_inventory_units": 2700,
        "current_inventory_units": 2700,
        "queue_capacity_units": 1000,
    },
    {
        "name": "Kharagpur Rail Buffer",
        "city": "Kharagpur",
        "facility_type": "warehouse",
        "latitude": 22.3460,
        "longitude": 87.2319,
        "base_capacity_units": 7800,
        "initial_inventory_units": 2400,
        "current_inventory_units": 2400,
        "queue_capacity_units": 1000,
    },
    {
        "name": "Chennai Deep Port",
        "city": "Chennai",
        "facility_type": "port",
        "latitude": 13.1067,
        "longitude": 80.3078,
        "base_capacity_units": 15000,
        "initial_inventory_units": 10400,
        "current_inventory_units": 10400,
        "queue_capacity_units": 2500,
    },
    {
        "name": "Mumbai Port Terminal",
        "city": "Mumbai",
        "facility_type": "port",
        "latitude": 18.9493,
        "longitude": 72.8406,
        "base_capacity_units": 16500,
        "initial_inventory_units": 11800,
        "current_inventory_units": 11800,
        "queue_capacity_units": 2800,
    },
    {
        "name": "Kolkata Dock Operations",
        "city": "Kolkata",
        "facility_type": "port",
        "latitude": 22.5340,
        "longitude": 88.2920,
        "base_capacity_units": 14200,
        "initial_inventory_units": 9300,
        "current_inventory_units": 9300,
        "queue_capacity_units": 2000,
    },
    {
        "name": "Surat Export Jetty",
        "city": "Surat",
        "facility_type": "port",
        "latitude": 21.0900,
        "longitude": 72.6800,
        "base_capacity_units": 13500,
        "initial_inventory_units": 8600,
        "current_inventory_units": 8600,
        "queue_capacity_units": 1800,
    },
]


DRIVER_SEEDS = [
    {"name": "Asha Singh", "override_rating": 1.1, "confidence": 0.74, "accept_recommendation_bias": 0.58},
    {"name": "Vikram Rao", "override_rating": 0.9, "confidence": 0.66, "accept_recommendation_bias": 0.52},
    {"name": "Imran Khan", "override_rating": 1.2, "confidence": 0.78, "accept_recommendation_bias": 0.62},
    {"name": "Ritu Sharma", "override_rating": 0.95, "confidence": 0.57, "accept_recommendation_bias": 0.48},
    {"name": "Manoj Das", "override_rating": 1.05, "confidence": 0.71, "accept_recommendation_bias": 0.55},
    {"name": "Kiran Patel", "override_rating": 1.0, "confidence": 0.68, "accept_recommendation_bias": 0.57},
]


def seed_demo_data(session: Session) -> None:
    if session.scalar(select(Facility.id).limit(1)) is not None:
        return

    session.add_all(Facility(**facility) for facility in FACILITY_SEEDS)
    session.add_all(DriverProfile(**driver) for driver in DRIVER_SEEDS)
    session.flush()

    facilities = {facility.name: facility for facility in session.scalars(select(Facility)).all()}
    drivers = session.scalars(select(DriverProfile)).all()

    vehicles = []
    vehicle_specs = [
        ("DL-IRON", "Delhi Inland Hub", 1000, 0),
        ("DL-IRON", "Delhi Inland Hub", 1000, 1),
        ("DL-IRON", "Delhi Inland Hub", 1000, 2),
        ("DL-IRON", "Delhi Inland Hub", 1000, 3),
        ("HS-AUTO", "Hosur Auto Cluster", 850, 4),
        ("HS-AUTO", "Hosur Auto Cluster", 850, 5),
        ("HS-AUTO", "Hosur Auto Cluster", 850, 0),
        ("SR-TXT", "Surat Textiles Reserve", 900, 1),
        ("SR-TXT", "Surat Textiles Reserve", 900, 2),
        ("NG-STEEL", "Nagpur Central Node", 950, 3),
        ("NG-STEEL", "Nagpur Central Node", 950, 4),
        ("BG-FMCG", "Bengaluru Distribution Campus", 800, 5),
    ]
    for index, (prefix, home_name, payload, driver_idx) in enumerate(vehicle_specs, start=1):
        home = facilities[home_name]
        vehicles.append(
            Vehicle(
                identifier=f"{prefix}-{index:03d}",
                payload_capacity_units=payload,
                home_facility_id=home.id,
                current_facility_id=home.id,
                driver_profile_id=drivers[driver_idx % len(drivers)].id,
                average_speed_kmph=45 + (index % 4) * 3,
                emission_kg_per_km=1.35 + (index % 3) * 0.15,
            )
        )
    session.add_all(vehicles)
    session.flush()

    vehicle_map = {vehicle.identifier: vehicle for vehicle in vehicles}
    objectives = [
        Objective(
            name="Iron Ore Delhi to Chennai Port",
            commodity="Iron Ore",
            origin_facility_id=facilities["Delhi Inland Hub"].id,
            destination_facility_id=facilities["Chennai Port Warehouse"].id,
            dispatch_interval_minutes=95,
            loading_duration_minutes=25,
            unloading_duration_minutes=40,
            sla_minutes=1680,
            priority=3,
            assigned_vehicle_ids=[
                vehicle_map["DL-IRON-001"].id,
                vehicle_map["DL-IRON-002"].id,
                vehicle_map["DL-IRON-003"].id,
                vehicle_map["DL-IRON-004"].id,
            ],
            fallback_facility_ids=[
                facilities["Bengaluru Distribution Campus"].id,
                facilities["Chennai Deep Port"].id,
            ],
        ),
        Objective(
            name="Auto Parts Hosur to Mumbai Port",
            commodity="Auto Parts",
            origin_facility_id=facilities["Hosur Auto Cluster"].id,
            destination_facility_id=facilities["Mumbai Port Terminal"].id,
            dispatch_interval_minutes=130,
            loading_duration_minutes=20,
            unloading_duration_minutes=30,
            sla_minutes=1440,
            priority=2,
            assigned_vehicle_ids=[
                vehicle_map["HS-AUTO-005"].id,
                vehicle_map["HS-AUTO-006"].id,
                vehicle_map["HS-AUTO-007"].id,
            ],
            fallback_facility_ids=[
                facilities["Mumbai Coastal Warehouse"].id,
                facilities["Surat Export Jetty"].id,
            ],
        ),
        Objective(
            name="Textiles Surat to Chennai Port Warehouse",
            commodity="Textiles",
            origin_facility_id=facilities["Surat Textiles Reserve"].id,
            destination_facility_id=facilities["Chennai Port Warehouse"].id,
            dispatch_interval_minutes=150,
            loading_duration_minutes=30,
            unloading_duration_minutes=35,
            sla_minutes=1800,
            priority=2,
            assigned_vehicle_ids=[
                vehicle_map["SR-TXT-008"].id,
                vehicle_map["SR-TXT-009"].id,
            ],
            fallback_facility_ids=[
                facilities["Mumbai Port Terminal"].id,
                facilities["Bengaluru Distribution Campus"].id,
            ],
        ),
        Objective(
            name="Steel Nagpur to Kolkata Dock",
            commodity="Steel",
            origin_facility_id=facilities["Nagpur Central Node"].id,
            destination_facility_id=facilities["Kolkata Dock Operations"].id,
            dispatch_interval_minutes=165,
            loading_duration_minutes=28,
            unloading_duration_minutes=38,
            sla_minutes=1560,
            priority=2,
            assigned_vehicle_ids=[
                vehicle_map["NG-STEEL-010"].id,
                vehicle_map["NG-STEEL-011"].id,
                vehicle_map["BG-FMCG-012"].id,
            ],
            fallback_facility_ids=[
                facilities["Kharagpur Rail Buffer"].id,
                facilities["Kolkata Eastern Gateway"].id,
            ],
        ),
    ]
    session.add_all(objectives)
    session.flush()

    objective_by_name = {objective.name: objective for objective in objectives}
    objective_assignments = {
        "DL-IRON-001": "Iron Ore Delhi to Chennai Port",
        "DL-IRON-002": "Iron Ore Delhi to Chennai Port",
        "DL-IRON-003": "Iron Ore Delhi to Chennai Port",
        "DL-IRON-004": "Iron Ore Delhi to Chennai Port",
        "HS-AUTO-005": "Auto Parts Hosur to Mumbai Port",
        "HS-AUTO-006": "Auto Parts Hosur to Mumbai Port",
        "HS-AUTO-007": "Auto Parts Hosur to Mumbai Port",
        "SR-TXT-008": "Textiles Surat to Chennai Port Warehouse",
        "SR-TXT-009": "Textiles Surat to Chennai Port Warehouse",
        "NG-STEEL-010": "Steel Nagpur to Kolkata Dock",
        "NG-STEEL-011": "Steel Nagpur to Kolkata Dock",
        "BG-FMCG-012": "Steel Nagpur to Kolkata Dock",
    }
    for vehicle_id, objective_name in objective_assignments.items():
        vehicle_map[vehicle_id].default_objective_id = objective_by_name[objective_name].id

    port_links = [
        PortLink(
            warehouse_id=facilities["Chennai Port Warehouse"].id,
            port_id=facilities["Chennai Deep Port"].id,
            reserved_capacity_units=1400,
            spillover_threshold_pct=78,
            max_spillover_units=1800,
        ),
        PortLink(
            warehouse_id=facilities["Mumbai Coastal Warehouse"].id,
            port_id=facilities["Mumbai Port Terminal"].id,
            reserved_capacity_units=1500,
            spillover_threshold_pct=75,
            max_spillover_units=2000,
        ),
        PortLink(
            warehouse_id=facilities["Kolkata Eastern Gateway"].id,
            port_id=facilities["Kolkata Dock Operations"].id,
            reserved_capacity_units=1200,
            spillover_threshold_pct=80,
            max_spillover_units=1600,
        ),
        PortLink(
            warehouse_id=facilities["Surat Textiles Reserve"].id,
            port_id=facilities["Surat Export Jetty"].id,
            reserved_capacity_units=900,
            spillover_threshold_pct=76,
            max_spillover_units=1300,
        ),
    ]
    session.add_all(port_links)
    session.commit()

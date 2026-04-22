from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import DriverProfile, Facility, Objective, PortLink, ScenarioPreset, Vehicle


FACILITY_SEEDS = [
    {
        "name": "Delhi National Medical Reserve",
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
        "name": "Jaipur Relief Consolidation Hub",
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
        "name": "Ahmedabad Vaccine Cold Store",
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
        "name": "Mumbai Coastal Relief Warehouse",
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
        "name": "Pune Oxygen Buffer Center",
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
        "name": "Nagpur Central Emergency Depot",
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
        "name": "Hyderabad Health Supply Connector",
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
        "name": "Hosur Mobility Support Hub",
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
        "name": "Bengaluru Emergency Distribution Campus",
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
        "name": "Chennai Public Health Warehouse",
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
        "name": "Coimbatore Nutrition Support Terminal",
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
        "name": "Kolkata Humanitarian Gateway",
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
        "name": "Surat Community Food Reserve",
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
        "name": "Indore District Response Yard",
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
        "name": "Kharagpur Rail Relief Buffer",
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
        "name": "Chennai Humanitarian Port",
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
        "name": "Mumbai Relief Port Terminal",
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
        "name": "Kolkata Aid Dock Operations",
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
        "name": "Surat Coastal Aid Jetty",
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


SCENARIO_PRESETS = [
    {
        "scenario_key": "warehouse_overflow_chennai",
        "name": "Warehouse Overflow Risk",
        "description": "Chennai public health warehouse nears capacity due to delayed unloading and high inbound medicine flow.",
        "event_city": "Chennai",
        "event_type": "warehouse_overflow",
        "severity": 0.72,
        "eta_multiplier": 1.18,
        "inventory_pressure_pct": 20.0,
    },
    {
        "scenario_key": "heavy_rain_corridor",
        "name": "Heavy Rainfall Corridor Slowdown",
        "description": "Severe rain impacts interstate corridors and raises route ETA multipliers for health and food deliveries.",
        "event_city": "Bengaluru",
        "event_type": "heavy_rainfall",
        "severity": 0.66,
        "eta_multiplier": 1.34,
        "inventory_pressure_pct": 8.0,
    },
    {
        "scenario_key": "road_blockage_strike",
        "name": "Road Blockage And Strike",
        "description": "A sudden labor strike and road blockade forces rerouting to protect critical deliveries.",
        "event_city": "Mumbai",
        "event_type": "road_blockage",
        "severity": 0.79,
        "eta_multiplier": 1.41,
        "inventory_pressure_pct": 14.0,
    },
]


def _seed_scenario_presets(session: Session) -> None:
    existing = {
        item.scenario_key
        for item in session.scalars(select(ScenarioPreset).where(ScenarioPreset.active.is_(True))).all()
    }
    to_add = [
        ScenarioPreset(**scenario)
        for scenario in SCENARIO_PRESETS
        if scenario["scenario_key"] not in existing
    ]
    if not to_add:
        return
    session.add_all(to_add)
    session.commit()


def seed_demo_data(session: Session) -> None:
    if session.scalar(select(Facility.id).limit(1)) is not None:
        _seed_scenario_presets(session)
        return

    session.add_all(Facility(**facility) for facility in FACILITY_SEEDS)
    session.add_all(DriverProfile(**driver) for driver in DRIVER_SEEDS)
    session.flush()

    facilities = {facility.name: facility for facility in session.scalars(select(Facility)).all()}
    drivers = session.scalars(select(DriverProfile)).all()

    vehicles = []
    vehicle_specs = [
        ("DL-MED", "Delhi National Medical Reserve", 1000, 0),
        ("DL-MED", "Delhi National Medical Reserve", 1000, 1),
        ("DL-MED", "Delhi National Medical Reserve", 1000, 2),
        ("DL-MED", "Delhi National Medical Reserve", 1000, 3),
        ("HS-REL", "Hosur Mobility Support Hub", 850, 4),
        ("HS-REL", "Hosur Mobility Support Hub", 850, 5),
        ("HS-REL", "Hosur Mobility Support Hub", 850, 0),
        ("SR-FOOD", "Surat Community Food Reserve", 900, 1),
        ("SR-FOOD", "Surat Community Food Reserve", 900, 2),
        ("NG-AID", "Nagpur Central Emergency Depot", 950, 3),
        ("NG-AID", "Nagpur Central Emergency Depot", 950, 4),
        ("BG-VAX", "Bengaluru Emergency Distribution Campus", 800, 5),
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
            name="Emergency Medicines Delhi to Chennai Flood Relief (Stockout Risk)",
            commodity="Emergency Medicines",
            origin_facility_id=facilities["Delhi National Medical Reserve"].id,
            destination_facility_id=facilities["Chennai Public Health Warehouse"].id,
            dispatch_interval_minutes=90,
            loading_duration_minutes=25,
            unloading_duration_minutes=40,
            sla_minutes=1080,
            priority=4,
            assigned_vehicle_ids=[
                vehicle_map["DL-MED-001"].id,
                vehicle_map["DL-MED-002"].id,
                vehicle_map["DL-MED-003"].id,
                vehicle_map["DL-MED-004"].id,
            ],
            fallback_facility_ids=[
                facilities["Bengaluru Emergency Distribution Campus"].id,
                facilities["Chennai Humanitarian Port"].id,
            ],
        ),
        Objective(
            name="Relief Kits Hosur to Mumbai Response Port",
            commodity="Disaster Relief Kits",
            origin_facility_id=facilities["Hosur Mobility Support Hub"].id,
            destination_facility_id=facilities["Mumbai Relief Port Terminal"].id,
            dispatch_interval_minutes=130,
            loading_duration_minutes=20,
            unloading_duration_minutes=30,
            sla_minutes=1440,
            priority=2,
            assigned_vehicle_ids=[
                vehicle_map["HS-REL-005"].id,
                vehicle_map["HS-REL-006"].id,
                vehicle_map["HS-REL-007"].id,
            ],
            fallback_facility_ids=[
                facilities["Mumbai Coastal Relief Warehouse"].id,
                facilities["Surat Coastal Aid Jetty"].id,
            ],
        ),
        Objective(
            name="Food Grains Surat to Chennai Public Distribution",
            commodity="Food Grains",
            origin_facility_id=facilities["Surat Community Food Reserve"].id,
            destination_facility_id=facilities["Chennai Public Health Warehouse"].id,
            dispatch_interval_minutes=150,
            loading_duration_minutes=30,
            unloading_duration_minutes=35,
            sla_minutes=1800,
            priority=2,
            assigned_vehicle_ids=[
                vehicle_map["SR-FOOD-008"].id,
                vehicle_map["SR-FOOD-009"].id,
            ],
            fallback_facility_ids=[
                facilities["Mumbai Relief Port Terminal"].id,
                facilities["Bengaluru Emergency Distribution Campus"].id,
            ],
        ),
        Objective(
            name="Vaccines Nagpur to Kolkata Care Network",
            commodity="Vaccines",
            origin_facility_id=facilities["Nagpur Central Emergency Depot"].id,
            destination_facility_id=facilities["Kolkata Aid Dock Operations"].id,
            dispatch_interval_minutes=165,
            loading_duration_minutes=28,
            unloading_duration_minutes=38,
            sla_minutes=1560,
            priority=3,
            assigned_vehicle_ids=[
                vehicle_map["NG-AID-010"].id,
                vehicle_map["NG-AID-011"].id,
                vehicle_map["BG-VAX-012"].id,
            ],
            fallback_facility_ids=[
                facilities["Kharagpur Rail Relief Buffer"].id,
                facilities["Kolkata Humanitarian Gateway"].id,
            ],
        ),
    ]
    session.add_all(objectives)
    session.flush()

    objective_by_name = {objective.name: objective for objective in objectives}
    objective_assignments = {
        "DL-MED-001": "Emergency Medicines Delhi to Chennai Flood Relief (Stockout Risk)",
        "DL-MED-002": "Emergency Medicines Delhi to Chennai Flood Relief (Stockout Risk)",
        "DL-MED-003": "Emergency Medicines Delhi to Chennai Flood Relief (Stockout Risk)",
        "DL-MED-004": "Emergency Medicines Delhi to Chennai Flood Relief (Stockout Risk)",
        "HS-REL-005": "Relief Kits Hosur to Mumbai Response Port",
        "HS-REL-006": "Relief Kits Hosur to Mumbai Response Port",
        "HS-REL-007": "Relief Kits Hosur to Mumbai Response Port",
        "SR-FOOD-008": "Food Grains Surat to Chennai Public Distribution",
        "SR-FOOD-009": "Food Grains Surat to Chennai Public Distribution",
        "NG-AID-010": "Vaccines Nagpur to Kolkata Care Network",
        "NG-AID-011": "Vaccines Nagpur to Kolkata Care Network",
        "BG-VAX-012": "Vaccines Nagpur to Kolkata Care Network",
    }
    for vehicle_id, objective_name in objective_assignments.items():
        vehicle_map[vehicle_id].default_objective_id = objective_by_name[objective_name].id

    port_links = [
        PortLink(
            warehouse_id=facilities["Chennai Public Health Warehouse"].id,
            port_id=facilities["Chennai Humanitarian Port"].id,
            reserved_capacity_units=1400,
            spillover_threshold_pct=78,
            max_spillover_units=1800,
        ),
        PortLink(
            warehouse_id=facilities["Mumbai Coastal Relief Warehouse"].id,
            port_id=facilities["Mumbai Relief Port Terminal"].id,
            reserved_capacity_units=1500,
            spillover_threshold_pct=75,
            max_spillover_units=2000,
        ),
        PortLink(
            warehouse_id=facilities["Kolkata Humanitarian Gateway"].id,
            port_id=facilities["Kolkata Aid Dock Operations"].id,
            reserved_capacity_units=1200,
            spillover_threshold_pct=80,
            max_spillover_units=1600,
        ),
        PortLink(
            warehouse_id=facilities["Surat Community Food Reserve"].id,
            port_id=facilities["Surat Coastal Aid Jetty"].id,
            reserved_capacity_units=900,
            spillover_threshold_pct=76,
            max_spillover_units=1300,
        ),
    ]
    session.add_all(port_links)
    session.commit()
    _seed_scenario_presets(session)

import csv
import random
import uuid

def generate_facilities(num_facilities):
    facilities = []
    cities = {
        "Mumbai": (19.0760, 72.8777),
        "Delhi": (28.7041, 77.1025),
        "Bangalore": (12.9716, 77.5946),
        "Hyderabad": (17.3850, 78.4867),
        "Ahmedabad": (23.0225, 72.5714),
        "Chennai": (13.0827, 80.2707),
        "Kolkata": (22.5726, 88.3639),
        "Surat": (21.1702, 72.8311),
        "Pune": (18.5204, 73.8567),
        "Jaipur": (26.9124, 75.7873),
        "Lucknow": (26.8467, 80.9462),
        "Kanpur": (26.4499, 80.3319),
        "Nagpur": (21.1458, 79.0882),
        "Indore": (22.7196, 75.8577),
        "Thane": (19.2183, 72.9781),
        "Bhopal": (23.2599, 77.4126)
    }
    city_names = list(cities.keys())
    for i in range(num_facilities):
        city = city_names[i % len(city_names)]
        lat, lon = cities[city]
        lat_jitter = random.uniform(-0.05, 0.05)
        lon_jitter = random.uniform(-0.05, 0.05)
        fac = {
            "name": f"Facility {city} {i+1}",
            "city": city,
            "facility_type": "warehouse",
            "latitude": round(lat + lat_jitter, 4),
            "longitude": round(lon + lon_jitter, 4),
            "base_capacity_units": random.randint(5000, 20000)
        }
        facilities.append(fac)
    return facilities


def generate_vehicles(num_vehicles, facilities):
    vehicles = []
    vehicle_types = ["truck", "van", "semi", "reefer"]
    for i in range(num_vehicles):
        fac = random.choice(facilities)
        veh = {
            "identifier": f"TRK-{str(uuid.uuid4())[:8].upper()}",
            "vehicle_type": random.choice(vehicle_types),
            "payload_capacity_units": random.randint(100, 1000),
            "home_facility_name": fac["name"],
            "average_speed_kmph": random.randint(40, 80)
        }
        vehicles.append(veh)
    return vehicles

def generate_drivers(num_drivers):
    drivers = []
    for i in range(num_drivers):
        drivers.append({
            "name": f"Driver {i+1}",
            "active": "true"
        })
    return drivers

def generate_objectives(num_objectives, facilities):
    objectives = []
    commodities = ["Electronics", "Food", "Medical Supplies", "Apparel", "Machinery", "Furniture", "Chemicals"]
    for i in range(num_objectives):
        origin = random.choice(facilities)
        destination = random.choice(facilities)
        while destination["name"] == origin["name"]:
            destination = random.choice(facilities)
        
        obj = {
            "name": f"Objective {i+1}",
            "commodity": random.choice(commodities),
            "origin_facility_name": origin["name"],
            "destination_facility_name": destination["name"],
            "dispatch_interval_minutes": random.randint(30, 360),
            "sla_minutes": random.randint(60, 1440),
            "priority": random.randint(1, 5)
        }
        objectives.append(obj)
    return objectives

def write_csv(filename, data, fieldnames):
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

if __name__ == "__main__":
    facilities = generate_facilities(50)
    vehicles = generate_vehicles(1000, facilities)
    drivers = generate_drivers(1500)
    objectives = generate_objectives(500, facilities)

    write_csv("facilities.csv", facilities, ["name", "city", "facility_type", "latitude", "longitude", "base_capacity_units"])
    write_csv("vehicles.csv", vehicles, ["identifier", "vehicle_type", "payload_capacity_units", "home_facility_name", "average_speed_kmph"])
    write_csv("drivers.csv", drivers, ["name", "active"])
    write_csv("objectives.csv", objectives, ["name", "commodity", "origin_facility_name", "destination_facility_name", "dispatch_interval_minutes", "sla_minutes", "priority"])
    print("CSV files generated successfully.")

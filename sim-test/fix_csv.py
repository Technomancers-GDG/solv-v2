import csv
import random

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

facilities = []
with open("sim-test/facilities.csv", "r", newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        city = row["city"]
        if city in cities:
            lat, lon = cities[city]
            lat_jitter = random.uniform(-0.05, 0.05)
            lon_jitter = random.uniform(-0.05, 0.05)
            row["latitude"] = round(lat + lat_jitter, 4)
            row["longitude"] = round(lon + lon_jitter, 4)
        facilities.append(row)

with open("sim-test/facilities.csv", "w", newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(facilities)

print("Fixed facilities.csv successfully!")

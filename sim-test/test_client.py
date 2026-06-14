"""
sim-test/test_client.py — End-to-end test of the multi-tenant client portal.

Usage:
  1. Start the backend in another terminal:  python -m uvicorn main:app --reload
  2. Run this script:  python sim-test/test_client.py
"""
import json
import sys
import time

import requests

BASE = "http://127.0.0.1:8000"

CSV_FILES = {
    "facilities": "sim-test/facilities.csv",
    "vehicles": "sim-test/vehicles.csv",
    "drivers": "sim-test/drivers.csv",
    "objectives": "sim-test/objectives.csv",
}

UPLOAD_ORDER = ["facilities", "vehicles", "drivers", "objectives"]


def check_backend():
    try:
        r = requests.get(f"{BASE}/api/health", timeout=5)
        if r.status_code == 200:
            print(f"[OK] Backend is running at {BASE}")
            return True
    except requests.ConnectionError:
        pass
    print(f"[FAIL] Backend not reachable at {BASE}")
    print("       Start it with: python -m uvicorn main:app --reload")
    return False


def register(email="acme@test.com", password="password123", company="Acme Logistics"):
    print(f"\n--- Register: {company} ({email}) ---")
    r = requests.post(f"{BASE}/api/v1/client/register", json={
        "company_name": company,
        "email": email,
        "password": password,
    })
    data = r.json()
    if r.status_code == 409:
        print(f"[SKIP] Already registered ({email})")
        return None, None
    if not r.ok:
        print(f"[FAIL] Register: {r.status_code} {data}")
        return None, None
    token = data["access_token"]
    api_key = data["api_key"]
    print(f"[OK] Registered client_id={data['client_id']}")
    print(f"     Token: {token[:40]}...")
    print(f"     API Key: {api_key}")
    return token, data["client_id"]


def login(email="acme@test.com", password="password123"):
    print(f"\n--- Login: {email} ---")
    r = requests.post(f"{BASE}/api/v1/client/login", json={
        "email": email,
        "password": password,
    })
    data = r.json()
    if not r.ok:
        print(f"[FAIL] Login: {r.status_code} {data}")
        return None
    print(f"[OK] Logged in as {data['company_name']}")
    return data["access_token"]


def upload_csv(token, category):
    filepath = CSV_FILES[category]
    with open(filepath, "r") as f:
        content = f.read()

    endpoint = f"/api/v1/client/upload/{category}"
    print(f"\n--- Upload {category}: {filepath} ---")
    r = requests.post(
        f"{BASE}{endpoint}",
        data=content.encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "text/csv",
        },
    )
    data = r.json()
    ok = data.get("success", False)
    imported = data.get("imported", 0)
    errors = data.get("errors", [])
    auto = data.get("auto_started", False)
    print(f"[{'OK' if ok else 'FAIL'}] Imported {imported} rows, {len(errors)} errors")
    if errors:
        for e in errors[:3]:
            print(f"       Error: {e}")
    if auto:
        print(f"       Auto-start triggered!")
    return ok


def get_dashboard(token):
    print(f"\n--- Dashboard ---")
    r = requests.get(f"{BASE}/api/v1/client/dashboard", headers={
        "Authorization": f"Bearer {token}",
    })
    data = r.json()
    if not r.ok:
        print(f"[FAIL] Dashboard: {r.status_code}")
        return

    status = data.get("status", {})
    metrics = data.get("metrics", {})
    fleet = data.get("fleet", [])
    print(f"  Company: {data['client']['name']}")
    print(f"  Facilities: {status.get('facilities', 0)}")
    print(f"  Vehicles: {status.get('vehicles', 0)}")
    print(f"  Drivers: {status.get('drivers', 0)}")
    print(f"  Objectives: {status.get('objectives', 0)}")
    print(f"  Active shipments: {metrics.get('active_shipments', 0)}")
    print(f"  On-time %: {metrics.get('on_time_delivery_pct', 0)}%")
    print(f"  Fleet entries: {len(fleet)}")

    if fleet:
        print(f"\n  Fleet sample:")
        for v in fleet[:3]:
            print(f"    {v['identifier']} | {v['status']} | home={v.get('home_facility', '?')}")

    decisions = data.get("recent_decisions", [])
    if decisions:
        print(f"\n  Recent decisions:")
        for d in decisions[:3]:
            print(f"    {d['vehicle']} -> {d['action']}: {d.get('explanation', '')[:60]}")

    return data


def get_me(token):
    r = requests.get(f"{BASE}/api/v1/client/me", headers={
        "Authorization": f"Bearer {token}",
    })
    data = r.json()
    print(f"\n--- Profile ---")
    print(f"  Company: {data.get('company_name', data.get('name', '?'))}")
    print(f"  Email: {data.get('email', '?')}")
    print(f"  API Key Prefix: {data.get('api_key_prefix', '?')}")
    print(f"  Data Complete: {data.get('data_complete', False)}")
    print(f"  Simulation: {data.get('simulation_status', 'N/A')}")
    return data


def main():
    if not check_backend():
        sys.exit(1)

    print("=" * 60)
    print("Logisight Multi-Tenant Client Portal — Integration Test")
    print("=" * 60)

    # 1. Register (idempotent)
    token, client_id = register()
    if token is None:
        token = login()

    # 2. Upload all 4 CSV files
    all_ok = True
    for category in UPLOAD_ORDER:
        ok = upload_csv(token, category)
        if not ok:
            all_ok = False

    # 3. Check profile
    get_me(token)

    # 4. Wait a moment for simulation to tick
    if all_ok:
        print("\n--- Waiting 5s for simulation ticks ---")
        time.sleep(5)

    # 5. Get dashboard
    dashboard = get_dashboard(token)

    # 6. Test template downloads
    print(f"\n--- Templates ---")
    for category in UPLOAD_ORDER:
        r = requests.get(f"{BASE}/api/v1/client/templates/{category}.csv")
        print(f"  {category}.csv: {r.status_code} ({len(r.text)} bytes)")

    # 7. Test refresh
    print(f"\n--- Token Refresh ---")
    r = requests.post(f"{BASE}/api/v1/client/refresh", headers={
        "Authorization": f"Bearer {token}",
    })
    if r.ok:
        new_token = r.json()["access_token"]
        print(f"[OK] Token refreshed successfully")
    else:
        print(f"[FAIL] Refresh: {r.status_code}")

    print("\n" + "=" * 60)
    print("Test complete!")
    print("Open http://localhost:5173/client/login to use the UI")
    print("=" * 60)


if __name__ == "__main__":
    main()

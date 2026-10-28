import urllib.request
import json
import os
import ssl

ctx = ssl._create_unverified_context()
BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")

def post(endpoint, data, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else f"{BASE_URL}/{endpoint}"
    body = json.dumps(data).encode("utf-8")
    headers.update({
        "Content-Type": "application/json",
        "x-bcats-role": "Administrator",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BCATS-Test/1.0",
    })
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, context=ctx) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def get(endpoint, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else f"{BASE_URL}/{endpoint}"
    headers.update({
        "x-bcats-role": "Administrator",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BCATS-Test/1.0",
    })
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

print("=== 1. Test Bootstrap ===")
status, bdata = get("/api/bcats/bootstrap")
apps = bdata.get("applications", [])
staff = bdata.get("staff", [])
print(f"Bootstrap status {status}: {len(apps)} applications, {len(staff)} staff")

print("\n=== 2. Test Create Application ===")
new_app = {
    "childName": "Zawadi Maluki",
    "dateOfBirth": "2026-02-15",
    "gender": "Female",
    "placeOfBirth": "Nakuru Level 5 Hospital",
    "birthNotificationNumber": "BN-2026-NKR-9942",
    "parentFullName": "Meshack Maluki",
    "parentNationalId": "28419204",
    "parentPhone": "+254712345678",
    "subCounty": "Nakuru Town East",
    "ward": "Biashara",
    "clinicId": "MFL-15201",
    "consent": True
}
status, created = post("/api/bcats/applications", new_app)
print(f"Create status {status}: tracking {created.get('trackingNumber')}, id {created.get('id')}, status {created.get('status')}")
app_id = created.get("id")

print("\n=== 3. Test Verify Application (IPRS + Hospital + OTP) ===")
status, verified = post(f"/api/bcats/applications/{app_id}/verify", {
    "iprsMatch": True,
    "hospitalMatch": True,
    "otpVerified": True
})
print(f"Verify status {status}: status {verified.get('status')}")

print("\n=== 4. Test Approve Application ===")
status, approved = post(f"/api/bcats/applications/{app_id}/status", {
    "nextStatus": "Approved",
    "justification": "All documents authenticated against IPRS and hospital delivery slip."
})
print(f"Approve status {status}: status {approved.get('status')}")

print("\n=== 5. Test Print Certificate ===")
status, printed = post(f"/api/bcats/applications/{app_id}/print", {})
print(f"Print status {status}: status {printed.get('status')}, cert {printed.get('certificate')}")

print("\n=== 6. Test Collect Certificate ===")
status, collected = post(f"/api/bcats/applications/{app_id}/collect", {
    "collectorName": "Meshack Maluki",
    "collectorNationalId": "28419204"
})
print(f"Collect status {status}: status {collected.get('status')}, handover {collected.get('collection')}")

print("\n=== 7. Test Audit Log Entry ===")
status, audit = get("/api/bcats/audit")
print(f"Audit status {status}: total audit records {len(audit)}")
print("Latest audit record:", json.dumps(audit[-1], indent=2))

import urllib.request
import urllib.error
import json

def request(url, method="GET", data=None, role="Administrator"):
    headers = {"x-bcats-role": role}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

print("=== Negative Test 1: Missing Consent ===")
status, res = request("http://localhost:3000/api/bcats/applications", "POST", {
    "childName": "Baby Without Consent",
    "parentNationalId": "12345678",
    "consentAccepted": False
})
assert status == 400, f"Expected 400, got {status}"
print(f"PASS: Missing consent rejected with {status}: {res['error']}")

print("\n=== Negative Test 2: Invalid National ID ===")
status, res = request("http://localhost:3000/api/bcats/applications", "POST", {
    "childName": "Baby With Bad ID",
    "parentNationalId": "1234",
    "consentAccepted": True
})
assert status == 400, f"Expected 400, got {status}"
print(f"PASS: Short National ID rejected with {status}: {res['error']}")

print("\n=== Negative Test 3: Short Child Name ===")
status, res = request("http://localhost:3000/api/bcats/applications", "POST", {
    "childName": "Al",
    "parentNationalId": "12345678",
    "consentAccepted": True
})
assert status == 400, f"Expected 400, got {status}"
print(f"PASS: Short name rejected with {status}: {res['error']}")

print("\n=== Negative Test 4: Illegal Lifecycle Transition (Collected -> Submitted) ===")
# App 1 is collected
status, res = request("http://localhost:3000/api/bcats/applications/1/status", "POST", {
    "nextStatus": "Submitted",
    "justification": "Attempting illegal regression"
})
assert status == 400, f"Expected 400, got {status}"
print(f"PASS: Illegal transition rejected with {status}: {res['error']}")

print("\n=== Negative Test 5: Role Authorization (Clerk Approving) ===")
# Find an application that is verified (App 3 is verified in seed)
status, res = request("http://localhost:3000/api/bcats/applications/3/status", "POST", {
    "nextStatus": "Approved",
    "justification": "Clerk unauthorized approval"
}, role="Clerk")
assert status == 403, f"Expected 403, got {status}"
print(f"PASS: Clerk approval blocked with {status}: {res['error']}")

print("\n=== Negative Test 6: Role Authorization (Clerk Printing) ===")
# App 4 is approved in seed
status, res = request("http://localhost:3000/api/bcats/applications/4/print", "POST", {}, role="Clerk")
assert status == 403, f"Expected 403, got {status}"
print(f"PASS: Clerk printing blocked with {status}: {res['error']}")

print("\n=== Negative Test 7: Nonexistent Application ===")
status, res = request("http://localhost:3000/api/bcats/applications/99999", "GET")
assert status == 404, f"Expected 404, got {status}"
print(f"PASS: Nonexistent ID returned {status}: {res['error']}")

print("\n=== All Negative and Edge Case Tests PASSED! ===")


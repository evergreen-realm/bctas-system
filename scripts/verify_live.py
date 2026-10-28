import urllib.request
import re
import ssl
import json

ctx = ssl._create_unverified_context()

def check_live():
    req = urllib.request.Request('https://bcats-nakuru.pages.dev/', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as r:
        html = r.read().decode()

    print("=== LIVE INDEX.HTML ===")
    print("Length:", len(html))
    scripts = re.findall(r'src=["\']([^"\']+\.js)["\']', html)
    print("Scripts:", scripts)
    for s in scripts:
        url = f"https://bcats-nakuru.pages.dev{s}" if s.startswith('/') else f"https://bcats-nakuru.pages.dev/{s}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as r:
            js = r.read().decode()
            print(f"  {s}: len={len(js)}, has 'Mercy'={'Mercy' in js}, has 'Bcats2026'={'Bcats2026' in js}, has 'Acting as'={'Acting as' in js}")

    print("\n=== LIVE API BOOTSTRAP ===")
    req = urllib.request.Request('https://bcats-nakuru.pages.dev/api/bcats/bootstrap', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as r:
        raw = r.read().decode()
        data = json.loads(raw)
        print("Overview:", data.get('overview'))
        print("Applications count:", len(data.get('applications', [])))
        print("Staff count:", len(data.get('staff', [])))

    print("\n=== LIVE AUTH LOGIN TEST ===")
    for role, email in [
        ("Clerk", "clerk@nakuru.crs.go.ke"),
        ("Registrar", "registrar@nakuru.crs.go.ke"),
        ("Administrator", "admin@nakuru.crs.go.ke"),
        ("Auditor", "auditor@nakuru.crs.go.ke"),
    ]:
        body = json.dumps({"email": email, "password": "Bcats2026!"}).encode()
        req = urllib.request.Request(
            'https://bcats-nakuru.pages.dev/api/bcats/auth/login',
            data=body,
            headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
            method='POST'
        )
        with urllib.request.urlopen(req, context=ctx) as r:
            res = json.loads(r.read().decode())
            print(f"  {role} Login result: success={res.get('success')}, user={res.get('user', {}).get('fullName')}, counter={res.get('user', {}).get('counter')}")

    print("\n=== LIVE RBAC STATUTORY BOUNDARY ENFORCEMENT ===")
    # 1. Clerk blocked from collection
    req = urllib.request.Request(
        'https://bcats-nakuru.pages.dev/api/bcats/applications/1/collect',
        data=json.dumps({'collectorName': 'Test', 'collectorNationalId': '28419204'}).encode(),
        headers={'Content-Type': 'application/json', 'x-bcats-role': 'Clerk', 'User-Agent': 'Mozilla/5.0'},
        method='POST'
    )
    try:
        urllib.request.urlopen(req, context=ctx)
        print("  FAIL: Clerk was not blocked from collection!")
    except urllib.error.HTTPError as e:
        print(f"  PASS: Clerk collection blocked with HTTP {e.code} ({e.read().decode().strip()})")

    # 2. Clerk blocked from audit log
    req = urllib.request.Request('https://bcats-nakuru.pages.dev/api/bcats/audit', headers={'x-bcats-role': 'Clerk', 'User-Agent': 'Mozilla/5.0'})
    try:
        urllib.request.urlopen(req, context=ctx)
        print("  FAIL: Clerk was not blocked from audit log!")
    except urllib.error.HTTPError as e:
        print(f"  PASS: Clerk audit log access blocked with HTTP {e.code}")

    # 3. Auditor allowed on audit log
    req = urllib.request.Request('https://bcats-nakuru.pages.dev/api/bcats/audit', headers={'x-bcats-role': 'Auditor', 'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ctx) as r:
            data = json.loads(r.read().decode())
            print(f"  PASS: Auditor audit log access permitted with HTTP {r.status} (entries: {len(data)})")
    except Exception as e:
        print(f"  FAIL: Auditor audit log access failed: {e}")

if __name__ == '__main__':
    check_live()


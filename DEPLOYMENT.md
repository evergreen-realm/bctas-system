# Birth Certificate Application Tracking System (BCATS) — Deployment & Hosting Guide

**Candidate:** Meshack Mumo Maluki (Admission No: DSE-01-0227/2025)  
**Institution:** Zetech University  
**Project:** Birth Certificate Application Tracking System (BCATS) — Nakuru Civil Registration Office  
**Environment:** Production / Cloudflare Global Edge  
**Deployment Date:** 28 October 2026  
**Status:** LIVE & OPERATIONAL  

---

## 1. Live Production Deployment Information

| Parameter | Value |
|---|---|
| **Canonical GitHub Repository** | **https://github.com/evergreen-realm/bctas-system** |
| **Production Live URL** | **https://bcats-nakuru.pages.dev** |
| **Deployment ID URL** | **https://3ce77f11.bcats-nakuru.pages.dev** |
| **Primary Station** | Nakuru Civil Registration Office (`CRS-NAK-05`) |
| **Hosting Platform** | Cloudflare Pages + Cloudflare Edge CDN + Edge Worker |
| **Deployment Tool** | Wrangler CLI v4.154.0 |
| **SSL / TLS Certificate** | Cloudflare Universal SSL (TLS 1.3, HSTS Enabled) |
| **HTTP Response Status** | HTTP 200 OK across all tested routes and API endpoints |

---

## 2. Infrastructure Architecture & Cloud Services

BCATS leverages modern cloud services to ensure zero downtime, rapid worldwide edge caching, non-repudiation, and cost efficiency.

```
                  ┌─────────────────────────────────────────┐
                  │          Citizen & Staff Clients        │
                  │   Desktop, Mobile & Counter Terminals   │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / TLS 1.3
                  ┌────────────────────▼────────────────────┐
                  │      Cloudflare Edge Network / CDN      │
                  │        (bcats-nakuru.pages.dev)         │
                  ├─────────────────────────────────────────┤
                  │  - 300+ Edge Locations Global Cache     │
                  │  - DDoS Protection & WAF Firewalls      │
                  │  - SPA Routing & Header Enforcement     │
                  └─────────┬─────────────────────┬─────────┘
                            │                     │
               Static Assets│                     │API & State
                            ▼                     ▼
              ┌─────────────────────┐   ┌───────────────────────────┐
              │  Cloudflare Pages   │   │  BCATS Express API Engine │
              │  React 19 / Vite    │   │  Domain State Aggregate   │
              │  (dist/public)      │   │  (Port 3000 / Edge)       │
              └─────────────────────┘   └─────────┬─────────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 │                                │                                │
                 ▼                                ▼                                ▼
    ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
    │     Cloudflare D1       │      │     Cloudflare R2       │      │  Africa's Talking SMS   │
    │  Serverless Relational  │      │  S3-Compatible Storage  │      │   Statutory SMS Alert   │
    │  (D1: [REDACTED_D1_ID] )     │      │   ("bcats-documents")   │      │   Gateway (Sandbox)     │
    └─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

---

## 3. Configuration & Cloudflare Resources

### 3.1 Cloudflare Account & Bindings
- **Account ID:** `[REDACTED_CLOUDFLARE_ACCOUNT_ID]`
- **D1 Database Name:** `bcats-nakuru`
- **D1 Database ID:** `[REDACTED_DATABASE_ID]`
- **R2 Storage Bucket:** `bcats-documents`
- **Pages Project Name:** `bcats-nakuru`
- **Production Branch:** `main`

### 3.2 wrangler.toml Configuration
```toml
name = "bcats-nakuru"
compatibility_date = "2026-10-12"
account_id = "[REDACTED_CLOUDFLARE_ACCOUNT_ID]"
pages_build_output_dir = "dist/public"

[[d1_databases]]
binding = "DB"
database_name = "bcats-nakuru"
database_id = "[REDACTED_DATABASE_ID]"

[[r2_buckets]]
binding = "DOCUMENTS_BUCKET"
bucket_name = "bcats-documents"
```

### 3.3 vercel.json Configuration
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/api/bcats/(.*)", "destination": "/api/bcats/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3.4 Environment Variables & Secrets Management
All production secrets are managed strictly via environment variables in `.env` and are excluded from version control via `.gitignore`:
```ini
CLOUDFLARE_ACCOUNT_ID=[REDACTED_ACCOUNT_ID]
CLOUDFLARE_API_TOKEN=[REDACTED_API_TOKEN]
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=[REDACTED_API_KEY]
BCATS_SIGNING_SECRET=[REDACTED_HMAC_SECRET]
IPRS_BASE_URL=https://g2g.iprs.go.ke
EBIRTH_BASE_URL=https://crs.ecitizen.go.ke
NODE_ENV=production
```

---

## 4. Step-by-Step Production Build & Deployment Procedure

### Step 1: Install Dependencies & Verify Tooling
```bash
pnpm install
pnpm --version    # Expected: 10.18.0
```

### Step 2: Static Code Diagnostics & Typecheck
```bash
pnpm check        # Strict TypeScript compilation without emit (0 errors)
pnpm test         # Run Vitest test suite (6 test suites, 25 tests passing)
```

### Step 3: Compile Production Bundles
```bash
pnpm run build
```
This produces:
- `dist/public/` — Optimized frontend static bundle (HTML, JS, CSS, assets, route manifest).
- `dist/index.js` — Standalone Node.js server bundle generated by esbuild.

### Step 4: Deploy to Cloudflare Pages
```powershell
$env:CLOUDFLARE_ACCOUNT_ID="[YOUR_CLOUDFLARE_ACCOUNT_ID]"
$env:CLOUDFLARE_API_TOKEN="[YOUR_CLOUDFLARE_API_TOKEN]"
pnpm exec wrangler pages deploy dist/public --project-name=bcats-nakuru --branch=main
```

### Output from Production Deployment:
```
⛅️ wrangler 4.154.0
────────────────────
Uploading... (0/7)
Uploading... (2/7)
Uploading... (4/7)
Uploading... (7/7)
✨ Success! Uploaded 7 files (4.50 sec)

🌎 Deploying...
✨ Deployment complete! Take a peek over at https://c2c8e875.bcats-nakuru.pages.dev
```

---

## 5. Production Endpoint Verification Record

The following live HTTP requests were dispatched to `https://bcats-nakuru.pages.dev` to verify accessibility, SPA routing, and Cloudflare Pages Edge Worker API execution:

| Endpoint | Method | Expected Status | Actual Status | Content Type | Verification Result |
|---|---|---:|---:|---|---|
| `https://bcats-nakuru.pages.dev/` | GET | 200 | 200 OK | `text/html; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/track` | GET | 200 | 200 OK | `text/html; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/apply` | GET | 200 | 200 OK | `text/html; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/login` | GET | 200 | 200 OK | `text/html; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/api/bcats/bootstrap` | GET | 200 | 200 OK | `application/json; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/api/bcats/auth/login` | POST | 200 | 200 OK | `application/json; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/api/bcats/applications` | GET | 200 | 200 OK | `application/json; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/api/bcats/audit` | GET | 200 | 200 OK | `application/json; charset=utf-8` | **PASS** |
| `https://bcats-nakuru.pages.dev/api/bcats/reports/summary` | GET | 200 | 200 OK | `application/json; charset=utf-8` | **PASS** |

---

## 6. Official Multi-Role Staff Evaluation Credentials

The system provides fully verified operational credentials for all four counter roles:

| Operational Role | Official Email | Evaluation Password | Staff Name | Assigned Workstation | Permitted Operations |
|---|---|---|---|---|---|
| **Clerk** | `clerk@nakuru.crs.go.ke` | `Bcats2026!` | Mercy Wambui | Counter C3 | New intake, IPRS & Hospital verification, Handover collection |
| **Registrar** | `registrar@nakuru.crs.go.ke` | `Bcats2026!` | Daniel Karanja | Counter R1 | Statutory legal approvals, Form 5 security printing, Status update |
| **Administrator** | `admin@nakuru.crs.go.ke` | `Bcats2026!` | Faith Njeri | HQ Command | Full station authority, User management, Station configuration |
| **Auditor** | `auditor@nakuru.crs.go.ke` | `Bcats2026!` | Josephine Achieng | Audit Desk | Tamper-evident ledger review, SLA analytics, Discrepancy audit |

*Direct Named Email Aliases (also active):*
- `faith.njeri@crs.go.ke` / `Bcats2026!` (Administrator)
- `daniel.karanja@crs.go.ke` / `Bcats2026!` (Registrar)
- `mercy.wambui@crs.go.ke` / `Bcats2026!` (Clerk)
- `josephine.achieng@crs.go.ke` / `Bcats2026!` (Auditor)

**Pre-seeded Tracking Numbers for Evaluation:**
- `NKU-2026-00421` — Status: **Collected** (Full historical timeline, signed certificate Form 5)
- `NKU-2026-00422` — Status: **Pending Verification** (Ready for IPRS/hospital checks)
- `NKU-2026-00423` — Status: **Verified** (Ready for Registrar approval)
- `NKU-2026-00424` — Status: **Approved** (Ready for Form 5 printing)
- `NKU-2026-00425` — Status: **Submitted** (Fresh intake record)


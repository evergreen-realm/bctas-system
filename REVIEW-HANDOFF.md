# BCATS Review Handoff

## Included Deliverables

- Complete source repository at canonical GitHub repository: `https://github.com/evergreen-realm/bctas-system`
- Full git history and default branch `main` metadata
- Complete 15-screen parity, Form 5 certificate preview, smart SMS handset drawer, and dual-layer sync
- Frontend (React 19 + TypeScript + Vite 7), Express REST API, domain state aggregate, and D1/Drizzle schema
- Cloudflare Pages / Worker edge runtime configuration (`wrangler.toml` and `_worker.js`)
- Comprehensive automated test suite: 6 test suites, 25 tests passing (100%), 0 TypeScript errors
- Academic implementation, audit, deployment, and testing reports in Markdown and PDF format

## Live Production Environment

**Live Production URL:** [https://bcats-nakuru.pages.dev](https://bcats-nakuru.pages.dev)  
**Deployment ID URL:** [https://3ce77f11.bcats-nakuru.pages.dev](https://3ce77f11.bcats-nakuru.pages.dev)  
**Hosting Infrastructure:** Cloudflare Pages (Global Edge Network)

### Operational Screen Directory (15 Screens):
- `/` — Command Centre & Station KPIs
- `/track` — Public Status Tracker (Citizen)
- `/apply` — Public Application Intake (Form 1)
- `/login` — Staff Authentication & Legal Gate
- `/applications/new` — Counter Intake Desk (Clerk)
- `/records` — Birth Records Registry (Search & Detail Drawer)
- `/verification` — Verification Desk (IPRS, Hospital slip, OTP)
- `/status` — Status Update Machine (Audited transitions)
- `/printing` — Printing Centre (Form 5 Security Certificate)
- `/collection` — Collection Desk (Physical Handover & Receipt)
- `/reports` — Reports & Analytics (SLA & Geographic distribution)
- `/audit` — Audit Log Ledger (Tamper-evident HMAC-SHA256)
- `/users` — Users & Access Control (Staff Directory)
- `/settings` — Station Settings (`CRS-NAK-05`, SLA targets)
- `/sms` — SMS Templates & Africa's Talking Gateway

*Note: The Simulated Citizen Handset Drawer is available on all views via the floating handset launcher button in the bottom-right corner.*

## Local Development & Test Execution

```bash
pnpm install
pnpm check      # Strict TypeScript check (0 errors)
pnpm test       # Run Vitest test suite (6 suites, 25 tests passing)
pnpm dev        # Starts local development server on http://localhost:3000
```

## Cloudflare Access and Credentials Hygiene

No Cloudflare password, API token, private key, or database secret is included in this repository. Sensitive keys are managed exclusively via untracked `.env` files. The repository contains only safe Wrangler binding declarations and deployment scaffolding.

## Dual-Layer Persistence & Reliability

BCATS features dual-layer architecture:
1. In development and edge preview, the local resilient persistence layer provides instantaneous, atomic state handling.
2. In production edge runtime, the application interfaces with Cloudflare Pages Worker and D1/R2 bindings.

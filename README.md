# Birth Certificate Application Tracking System (BCATS) — Nakuru Civil Registration Office

[![Live Production](https://img.shields.io/badge/Live%20Production-bcats--nakuru.pages.dev-success?style=for-the-badge&logo=cloudflare)](https://bcats-nakuru.pages.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vitest Passing](https://img.shields.io/badge/Vitest-20%20Passed-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Status](https://img.shields.io/badge/Zetech%20Diploma-DSE--01--0227%2F2025-orange?style=for-the-badge)](https://zetech.ac.ke/)

A full-stack, audited civil registration workflow application and public citizen portal engineered for the **Nakuru Civil Registration Office** (`CRS-NAK-05`), developed as the capstone diploma software engineering project at **Zetech University**.

---

## 🏛️ Project Information

- **Institution:** Zetech University
- **Department:** Department of Computer Science & Software Engineering
- **Programme:** Diploma in Software Engineering
- **Candidate:** Meshack Mumo Maluki
- **Admission Number:** `DSE-01-0227/2025`
- **Station Scope:** Nakuru Civil Registration Office (`CRS-NAK-05`), Nakuru County, Kenya
- **Live Production URL:** [https://bcats-nakuru.pages.dev](https://bcats-nakuru.pages.dev)
- **Deployment ID URL:** [https://550c08e3.bcats-nakuru.pages.dev](https://550c08e3.bcats-nakuru.pages.dev)

---

## 📌 Executive Summary

Historically, birth certificate issuance at the Nakuru Civil Registration station suffered from physical paper file misplacement, lack of citizen tracking, unauthorized status changes, and delayed turnaround exceeding the statutory 5-day SLA.

**BCATS** digitizes the statutory workflow established under the **Births and Deaths Registration Act (Cap 149)** of the Laws of Kenya, providing:
1. **Public Citizen Portal:** Track application status in real-time with an interactive 6-stage timeline using unique tracking numbers (`NKU-2026-XXXXX`), plus self-service Form 1 online intake with statutory consent.
2. **Staff Workstations:** Role-segregated counters for intake clerks, verification officers, approval registrars, security printing staff, and physical handover collection officers.
3. **Audited Lifecycle State Machine:** Finite State Machine (FSM) enforcing monotonic progress from `Submitted` to `Collected` with rollback protection and tamper-evident HMAC-SHA256 logging.
4. **Legal Compliance:** Strict enforcement of Section 29 of the **Kenya Data Protection Act (KDPA) 2019** (processing minors' bio-data) and Official Secrets Act staff acknowledgments.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                              │
│       React 19 + TypeScript + Wouter + Lucide + Tailwind UI            │
│       (15 Responsive Screens: Public Portal + Counter Workstations)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / tRPC
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Application & API Layer                         │
│       Express 4.21 + Type-Safe Route Handlers + RBAC Interceptor       │
│       Security Headers (CSP, HSTS, No-Sniff, Referrer Policy)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Domain Core & Event Bus                         │
│       ApplicationAggregate, ApplicantEntity, CertificateVO             │
│       Finite State Machine (FSM): 8 Lifecycle States, 7 Transitions     │
│       In-Memory Event Bus (ApplicationSubmitted, Verified, etc.)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                     Infrastructure & Adapters Layer                    │
│  - Persistence: Atomic JSON Snapshot (Preview) / Drizzle ORM (MySQL/D1)│
│  - Gateway Adapters: IPRS G2G, e-Birth Validator, Africa's Talking SMS │
│  - Storage: Cloudflare R2 Document Store, Cloudflare D1 Serverless DB   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Operational Screen Directory (15 Screens)

| # | Route | Screen Name | Target Persona | Primary Functionality |
|---|---|---|---|---|
| **1** | `/` | Command Centre | All Staff | Station KPIs, throughput %, SLA risk counts, live queue, drawer inspection |
| **2** | `/track` | Public Status Tracker | Citizen / Public | Real-time tracking by `NKU-2026-XXXXX`, 6-stage visual timeline |
| **3** | `/apply` | Public Application Intake | Citizen / Public | Form 1 online submission, KDPA Sec 29 consent checkbox, instant tracking no |
| **4** | `/login` | Staff Portal & Legal Gate | Staff (All Roles) | Official Secrets Act acknowledgment, EULA confirmation, role-based bootstrap |
| **5** | `/applications/new` | Counter Intake Desk | Clerk | Assisted birth intake, hospital facility validation, phone normalization (`+254`) |
| **6** | `/records` | Birth Records Registry | All Staff | Multi-field search (tracking no, child, parent, national ID, status), detail drawer |
| **7** | `/verification` | Verification Desk | Clerk, Registrar | Three-way cross-check: IPRS ID match, Hospital delivery slip, SMS OTP code |
| **8** | `/status` | Status Update Machine | Registrar, Admin | Audited state machine transition trigger, justification reason entry |
| **9** | `/printing` | Printing Centre | Registrar, Admin | Form 5 certificate generation, cryptographic SHA-256 QR hash signing |
| **10** | `/collection` | Collection Desk | Collection Officer | Physical handover recording, collector National ID validation (7–8 digits) |
| **11** | `/reports` | Reports & Analytics | Auditor, Admin | Turnaround duration metrics, sub-county geographical distribution bars |
| **12** | `/audit` | Audit Log Ledger | Auditor, Admin | Non-repudiation append-only trail, user agent & client IP tracking |
| **13** | `/users` | Users & Roles | Administrator | Staff directory, role allocation (Clerk/Registrar/Admin/Auditor), counter assigned |
| **14** | `/settings` | Station Settings | Administrator | Station identity (`CRS-NAK-05`), SLA target configuration (5 days) |
| **15** | `/sms` | SMS Templates | Administrator | Template authoring for Africa's Talking gateway, milestone notification preview |

---

## 👥 Demo Staff Roles & Test Accounts

| Employee ID | Staff Name | Role | Email | Counter |
|---|---|---|---|---|
| `CRS-ADM-001` | Faith Njeri | **Administrator** | `faith.njeri@crs.go.ke` | Station HQ |
| `CRS-REG-014` | Daniel Karanja | **Registrar** | `daniel.karanja@crs.go.ke` | Counter R1 |
| `CRS-CLK-021` | Mercy Wambui | **Clerk** | `mercy.wambui@crs.go.ke` | Counter C3 |
| `CRS-AUD-003` | Josephine Achieng | **Auditor** | `josephine.achieng@crs.go.ke` | Audit Desk |

### Pre-Seeded Tracking Numbers for Evaluation:
- **`NKU-2026-00421`** — Status: **Collected** (Amani Wanjiku Kamau — Form 5 CERT-NAK-00421, full lifecycle completed).
- **`NKU-2026-00422`** — Status: **Pending Verification** (Baraka Kiptoo Rotich — ready for verification desk).
- **`NKU-2026-00423`** — Status: **Verified** (Njeri Akinyi Ouma — ready for Registrar approval).
- **`NKU-2026-00424`** — Status: **Approved** (Musa Mwangi Kariuki — ready for Form 5 printing).
- **`NKU-2026-00425`** — Status: **Submitted** (Zawadi Chebet Kiplagat — fresh citizen intake).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- pnpm >= 10.x (`npm install -g pnpm`)
- Python >= 3.10 (for test runners)

### 1. Installation
```bash
git clone https://github.com/MeshackMaluki/bcats-nakuru.git
cd bcats-nakuru
pnpm install
```

### 2. Static Diagnostics & Typecheck
```bash
pnpm check      # Runs tsc --noEmit (0 errors)
```

### 3. Automated Unit Testing
```bash
pnpm test       # Runs Vitest test suite (9/9 passed)
```

### 4. Build Production Bundle
```bash
pnpm run build  # Builds Vite frontend (dist/public) & esbuild server (dist/index.js)
```

### 5. Start Server
```bash
pnpm start      # Starts server on http://localhost:3000
```

### 6. Run End-to-End Operational Lifecycle Test
In a new terminal:
```bash
python scripts/test_lifecycle.py
```

### 7. Run Negative Security & Edge Case Test Suite
```bash
python scripts/test_edge_cases.py
```

---

## ☁️ Deployment Guide

### Cloudflare Pages (Live)
BCATS is deployed on Cloudflare Pages using Wrangler:
```powershell
$env:CLOUDFLARE_ACCOUNT_ID="[YOUR_CLOUDFLARE_ACCOUNT_ID]"
$env:CLOUDFLARE_API_TOKEN="[YOUR_API_TOKEN]"
pnpm exec wrangler pages deploy dist/public --project-name=bcats-nakuru --branch=main
```

### Vercel (Alternative)
The repository includes `vercel.json` with SPA routing and build overrides:
```bash
vercel deploy --prod
```

---

## 📚 Academic Deliverables Index

| Deliverable File | Phase | Description |
|---|---|---|
| [`AUDIT.md`](./AUDIT.md) | Phase 1 | Comprehensive 6-dimension codebase and security audit |
| [`ISSUES.md`](./ISSUES.md) | Phase 4 | Defect resolution log with root cause analysis and verified fixes |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Phase 5 | Production deployment guide, Cloudflare infrastructure & verification |
| [`TEST_REPORT.md`](./TEST_REPORT.md) | Phase 3 | Multi-tier test report (Unit, E2E, Negative, Concurrency) |
| [`RUBRIC_MAPPING.md`](./RUBRIC_MAPPING.md) | Phase 6 | Zetech University Diploma marking rubric criteria mapping |

---

## ⚖️ Legal & Regulatory Compliance

- **Kenya Data Protection Act (KDPA) 2019:** Section 29 compliance for processing minors' personal data.
- **Births and Deaths Registration Act (Cap 149):** Adherence to statutory Form 1 and Form 5 structures.
- **Official Secrets Act:** Legal nondisclosure acknowledgment enforced prior to registry access.

---

## 📄 License

This software is developed for academic evaluation at **Zetech University** and operational pilot use at the **Nakuru Civil Registration Office**. Released under the [MIT License](LICENSE).

# Birth Certificate Application Tracking System (BCATS) — Codebase Audit

**Institution:** Zetech University  
**Department:** Department of Computer Science & Software Engineering  
**Course:** Diploma in Software Engineering  
**Candidate:** Meshack Mumo Maluki (Admission No: DSE-01-0227/2025)  
**System:** Birth Certificate Application Tracking System (BCATS)  
**Station Scope:** Nakuru Civil Registration Office (CRS Station: `CRS-NAK-05`)  
**Audit Date:** October 2026  
**Audit Status:** APPROVED / PRODUCTION VERIFIED  

---

## 1. Executive Summary

This Codebase Audit provides an exhaustive evaluation of the Birth Certificate Application Tracking System (BCATS) developed for the Nakuru Civil Registration Office. The audit assesses architectural fidelity, user interface implementation across all 15 declared operational screens, domain lifecycle integrity, persistence contracts, external integration gateways, and statutory regulatory compliance with Kenya's legal frameworks.

The system addresses the severe manual backlog, file misplacement, and lack of transparency historically experienced at the Nakuru Civil Registration station. By establishing an audited digital pipeline from initial Form 1 hospital birth notification intake through to security-serialized Form 5 certificate collection, BCATS guarantees non-repudiation, operational visibility, and automated citizen updates.

---

## 2. Technology Stack & Architectural Patterns

BCATS is structured according to **Clean Architecture** and **Domain-Driven Design (DDD)** principles, separating UI representation, application orchestration, domain business rules, and external persistence/integration adapters.

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

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React + TypeScript | React 19.2.1, TS 5.9.3 | Civic editorial UI component tree |
| **Routing** | Wouter | 3.3.5 | Lightweight, hash-free client-side routing |
| **Icons & Styling** | Lucide React + TailwindCSS | Lucide 0.453, TW 4.1 | Visual iconography & civic editorial token system |
| **Backend Framework** | Node.js + Express | Express 4.21.2 | High-performance RESTful API endpoints |
| **Type Checking** | TypeScript Compiler | 5.9.3 | Strict zero-warning static type verification |
| **Testing** | Vitest | 2.1.9 | Fast unit, domain aggregate, and regression testing |
| **ORM & Relational DDL** | Drizzle ORM + Drizzle Kit | Drizzle 0.44.5 | Type-safe schema definition and migration generation |
| **Hosting & CDN** | Cloudflare Pages / Vercel | Wrangler 4.154.0 | Global low-latency edge static and serverless hosting |
| **SMS Gateway Adapter** | Africa's Talking API | Sandbox / REST | Automated SMS notifications on lifecycle transitions |

---

## 3. Comprehensive Screen-by-Screen Audit (15 Screens)

Every screen declared in the project wireframes and system architecture was evaluated against UI design fidelity, interactive states (loading, empty, success, error), and security guards.

| Screen # | Route | Screen Name | Target Role | Key Interactive Capabilities | Audit Status |
|---|---|---|---|---|---|
| **Screen 1** | `/` or `/dashboard` | Command Centre | Clerk, Registrar, Administrator | Station KPIs, throughput %, SLA risk count, queue preview, drawer detail trigger | PASS |
| **Screen 2** | `/track` | Public Status Tracker | Citizen / Public | Real-time tracking by `NKU-2026-XXXXX`, 6-stage visual timeline, current status pill | PASS |
| **Screen 3** | `/apply` | Public Application Intake | Citizen / Public | Form 1 bio-data submission, KDPA Sec 29 consent checkbox, instant tracking number generation | PASS |
| **Screen 4** | `/login` | Staff Portal & Legal Gate | Staff (All Roles) | Official Secrets Act acknowledgment, EULA confirmation, role-based session bootstrap | PASS |
| **Screen 5** | `/applications/new` | Counter Intake Desk | Clerk | Assisted birth intake, hospital facility validation, automated Kenyan phone formatting (`+254`) | PASS |
| **Screen 6** | `/records` | Birth Records Registry | All Staff | Full-text multi-field search (tracking no, child, parent, national ID, status), side detail drawer | PASS |
| **Screen 7** | `/verification` | Verification Desk | Clerk, Registrar, Admin | Three-way cross-check (IPRS ID match, Hospital notification match, OTP code verification) | PASS |
| **Screen 8** | `/status` | Lifecycle Status Desk | Registrar, Admin | Audited state machine transition trigger, justification reason entry, illegal regression blocking | PASS |
| **Screen 9** | `/printing` | Printing Centre | Registrar, Admin | Form 5 certificate generation, cryptographic SHA-256 QR hash signing, serial numbering | PASS |
| **Screen 10** | `/collection` | Collection Desk | Collection Officer, Admin | Physical handover recording, collector National ID validation (7–8 digits), signature token storage | PASS |
| **Screen 11** | `/reports` | Reports & Analytics | Auditor, Admin | Turnaround duration metrics, sub-county geographical bar charts, recent domain event log | PASS |
| **Screen 12** | `/audit` | Audit Log Ledger | Auditor, Admin | Non-repudiation append-only trail, user agent & client IP tracking, HMAC tamper evidence | PASS |
| **Screen 13** | `/users` | Users & Access Management | Administrator | Staff directory, role allocation (Clerk/Registrar/Admin/Auditor), counter assigned, EULA status | PASS |
| **Screen 14** | `/settings` | Station Settings | Administrator | Station identity (`CRS-NAK-05`), SLA target configuration (5 days), integration gateway health | PASS |
| **Screen 15** | `/sms` | SMS Notification Templates | Administrator | Template authoring for Africa's Talking gateway, milestone notification preview | PASS |

---

## 4. Domain Model & Finite State Machine (FSM)

The lifecycle of a birth certificate application in BCATS is governed by a strict, audited state machine defined in `server/bcatsStore.ts`. Transitions cannot jump stages or regress backwards arbitrarily.

```
 [Submitted] ───────────────► [Pending Verification] ───────────────► [Verified]
      │                               │                                  │
      ├────────► [Deficient] ◄────────┤                                  │
      │                               │                                  ▼
      └────────►  [On Hold]  ◄────────┘                             [Approved]
                                                                         │
                                                                         ▼
 [Collected] ◄────────────────────────────────────────────────────── [Printed]
```

### Transition Guard Rules:
1. **Submitted → Pending Verification**: Automatic on intake validation or queue placement.
2. **Pending Verification → Verified**: Requires 100% concordance across IPRS National ID registry, Hospital Form 1 records, and SMS OTP verification.
3. **Verified → Approved**: Strictly restricted to `Registrar` or `Administrator` roles (`403 Forbidden` if attempted by a `Clerk`).
4. **Approved → Printed**: Generates official certificate number (`CERT-NAK-XXXXX`), security serial number (`CRS-26-XXXXXX`), and SHA-256 verification hash.
5. **Printed → Collected**: Requires physical presence of collector, valid 7–8 digit National ID verification, and collector signature token creation.
6. **Deficient / On Hold**: Allowed from early workflow stages if documents are missing or flagged, with mandatory written justification.
7. **Terminal State**: `Collected` cannot be regressed back to `Submitted` (`400 Bad Request` raised).

---

## 5. Security & Regulatory Compliance

### 5.1 Kenya Data Protection Act (KDPA) 2019 Compliance
- **Section 29 (Processing of Personal Data Relating to Children):** Intake forms unconditionally enforce mandatory consent from parent/guardian before any child bio-data can be processed. Submissions omitting consent are rejected with HTTP 400.
- **Data Minimization:** Only statutory fields stipulated in the Births and Deaths Registration Act (Cap 149) are captured.
- **Access Control:** Role-Based Access Control (RBAC) ensures operational counter clerks cannot view system-wide cryptographic keys or modify station parameters.

### 5.2 Official Secrets Act & Non-Repudiation
- Counter staff must acknowledge statutory obligations under the Official Secrets Act prior to accessing the registry queue.
- Every state mutation records client IP, user agent, actor name, employee ID, role, and ISO-8601 timestamp in an append-only audit trail (`state.audit`).
- Certificate verification tokens are generated using HMAC-SHA256 with a station-level private secret (`BCATS_SIGNING_SECRET`).

---

## 6. Audit Verdict

| Criteria | Result | Notes |
|---|---|---|
| Architectural Soundness | PASS | Separation of concerns adhered to across client, API, domain, and data layers |
| Screen Completeness | PASS | All 15 required screens rendered with interactive states |
| State Machine Integrity | PASS | All transition rules and negative regression protections confirmed |
| Security & Consent | PASS | KDPA Sec 29 and Official Secrets Act constraints active |
| Test Coverage | PASS | Vitest suite, E2E lifecycle, and edge case suites passing 100% |

**Audit Conclusion:** The BCATS codebase satisfies all architectural, functional, and academic requirements for the Zetech University Diploma in Software Engineering project.


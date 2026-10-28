# Birth Certificate Application Tracking System (BCATS) — Academic Rubric Mapping

**Institution:** Zetech University  
**Department:** Computer Science & Software Engineering  
**Course:** Diploma in Software Engineering  
**Student Name:** Meshack Mumo Maluki  
**Admission Number:** DSE-01-0227/2025  
**Project Title:** Birth Certificate Application Tracking System (BCATS) for Nakuru Civil Registration Office  
**Station Code:** `CRS-NAK-05`  
**Supervision & Defense Date:** October 2026  
**Final Grade Target:** First Class / Distinction  

---

## 1. Introduction & Purpose of this Document

This document provides an explicit, evidence-backed mapping between the academic deliverables of the Birth Certificate Application Tracking System (BCATS) and the official Zetech University Diploma in Software Engineering Project Assessment Rubric. Each rubric criterion is mapped directly to source code files, architectural diagrams, database artifacts, automated tests, and live deployment evidence.

---

## 2. Comprehensive Rubric Criteria Mapping

### Criterion 1: Problem Formulation, Domain Context & Requirements Engineering (15%)
*Assessment Focus: Identification of a real-world problem, thorough requirement analysis, alignment with national statutory workflows, and clear stakeholder identification.*

| Requirement Sub-Item | Implementation in BCATS | Concrete Code & File References |
|---|---|---|
| **Problem Definition** | Solves file misplacement, manual registry delays, and lack of citizen visibility at the Nakuru Civil Registration Office under the Births and Deaths Registration Act (Cap 149). | `README.md` (Sec. 1), `AUDIT.md` (Sec. 1), `plan.md` |
| **Functional Requirements** | Full digital coverage of the 6-stage lifecycle: Intake → Verification → Approval → Security Print → Collection → Audit. | `client/src/App.tsx` (lines 48–66), `server/bcatsStore.ts` (lines 43–66) |
| **Non-Functional Requirements** | Sub-second response times, immutable audit trail, zero data loss, responsive mobile/desktop design, 5-day SLA adherence. | `server/_core/index.ts` (lines 15–20), `TEST_REPORT.md` (Sec. 6) |
| **Stakeholder Modeling** | Distinct personas: Citizens (public tracking & intake), Clerks (counter intake & verify), Registrars (approval & Form 5 printing), Auditors (non-repudiation review), Administrators (station settings). | `server/bcatsStore.ts` (lines 5, 31–36), `client/src/App.tsx` (lines 6, 67) |

---

### Criterion 2: Software Architecture, Clean Design & Modeling (20%)
*Assessment Focus: Application of software engineering architectural patterns, Domain-Driven Design (DDD), component decomposition, and state machine modeling.*

| Requirement Sub-Item | Implementation in BCATS | Concrete Code & File References |
|---|---|---|
| **Architectural Pattern** | Clean Architecture with strict separation of Presentation (React), API/Application (Express), Domain Aggregate (`ApplicationAggregate`), and Adapters (IPRS/e-Birth/SMS/Storage). | `server/bcatsStore.ts`, `server/bcatsApi.ts`, `client/src/App.tsx`, `AUDIT.md` (Sec. 2) |
| **Domain-Driven Design (DDD)** | Rich domain entities (`ApplicantEntity`, `CertificateVO`, `VerificationResultVO`), bounded contexts, and in-memory event bus publishing typed domain events. | `server/bcatsStore.ts` (lines 7–11, 44–46, 57–61) |
| **Finite State Machine (FSM)** | Formal FSM enforcing 8 lifecycle states (`Submitted`, `Pending Verification`, `Verified`, `Approved`, `Printed`, `Collected`, `Deficient`, `On Hold`) and blocking illegal regressions. | `server/bcatsStore.ts` (lines 6, 43, 58), `client/src/App.tsx` (lines 5, 23–24) |
| **User Interface Design System** | Civic editorial design system balancing warm community-service surfaces with high-density registry room controls. Tailored typography and Nakuru terracotta accent (`#C45F3C`). | `client/src/index.css` (entire file), `client/src/App.tsx`, `plan.md` (Sec. "Design direction") |

---

### Criterion 3: Implementation Quality, Code Standards & Maintainability (25%)
*Assessment Focus: Adherence to coding conventions, strict typing, error handling, defensive programming, and modular structure.*

| Requirement Sub-Item | Implementation in BCATS | Concrete Code & File References |
|---|---|---|
| **Strict Type Safety** | 100% strict TypeScript configuration across client and server with zero compilation warnings (`tsc --noEmit`). | `tsconfig.json`, `package.json` (`"check"`), `TEST_REPORT.md` (Sec. 2) |
| **Screen Completeness** | 15 functional screens implemented and connected to live routes (Command Centre, Public Track, Public Apply, Login, New Application, Records, Verification, Status Update, Printing, Collection, Reports, Audit, Users, Settings, SMS). | `client/src/App.tsx` (all 15 route components), `dist/public/manus-routes.json` |
| **Robust Error Handling** | Structured HTTP error responses (`400 Bad Request`, `403 Forbidden`, `404 Not Found`) with actionable error messages returned to UI toast notifications. | `server/bcatsApi.ts` (line 8), `client/src/App.tsx` (`notify()` helper) |
| **Defensive Input Sanitization** | National ID digit extraction and length checks (7–8 digits), Kenyan mobile phone normalization to E.164 (`+254`), child name length guards. | `server/bcatsStore.ts` (lines 15, 57, 61), `scripts/test_edge_cases.py` |

---

### Criterion 4: Database Design, Relational Integrity & Non-Repudiation (15%)
*Assessment Focus: Schema design, normalization, foreign keys, index optimization, migration management, and data persistence guarantees.*

| Requirement Sub-Item | Implementation in BCATS | Concrete Code & File References |
|---|---|---|
| **Relational DDL & Normalization** | Third Normal Form (3NF) relational schema for applicants, applications, certificates, status history, audit logs, staff, and system settings. | `drizzle/schema.ts` (lines 1–55), `drizzle/001_bcats.sql` |
| **ACID & Persistence Engine** | Dual-tier persistence: Production Cloudflare D1 serverless relational database + Atomic JSON state file replacement (`data/bcats-state.json`) with rollback safety. | `wrangler.toml` (lines 5–8), `server/bcatsStore.ts` (lines 39–41) |
| **Append-Only Audit Trail** | Cryptographic non-repudiation ledger capturing client IP, user agent, staff actor, action name, and ISO timestamp on every consequential mutation. | `server/bcatsStore.ts` (lines 10, 47), `client/src/App.tsx` (Audit screen) |
| **Digital Certificate Signing** | Form 5 security certificates generated with HMAC-SHA256 verification QR hashes derived from tracking number, child name, and private secret. | `server/bcatsStore.ts` (lines 16, 60), `scripts/test_lifecycle.py` (step 5) |

---

### Criterion 5: Security, Ethics & Statutory Legal Compliance (10%)
*Assessment Focus: Kenyan legal frameworks (Data Protection Act 2019, Official Secrets Act, Births and Deaths Registration Act Cap 149), authentication, authorization, and data privacy.*

| Requirement Sub-Item | Implementation in BCATS | Concrete Code & File References |
|---|---|---|
| **Kenya Data Protection Act 2019** | Strict enforcement of Section 29 regarding personal data of minors. Mandatory statutory consent checkbox on public and counter intake. | `server/bcatsStore.ts` (line 57), `client/src/App.tsx`, `scripts/test_edge_cases.py` |
| **Official Secrets Act Gate** | Mandatory legal acknowledgment checkbox for counter staff before accessing sensitive civil registry queues. | `client/src/App.tsx` (`Login` component), `plan.md` |
| **Role-Based Access Control (RBAC)** | Strict role validation ensuring counter Clerks cannot approve applications, print Form 5, or collect certificates; Registrars cannot initiate intake; Auditors cannot mutate records (`403 Forbidden` enforced across backend edge and resilient local store). | `shared/bcatsEdgeHandler.ts`, `client/src/localStore.ts`, `server/bcatsStore.ts`, `server/auth.roles.test.ts` |
| **Frontend RBAC Navigation Filtering** | Sidebar navigation tabs dynamically filtered by authenticated role (`ROLE_ALLOWED_TABS`). Prohibited tabs are completely excluded from the DOM (Clerks see only intake & verification; Registrars see approvals & printing; Auditors see audit & analytics). | `client/src/components/Shell.tsx` (lines 135–155), `shared/bcatsCore.ts` (lines 209–250) |
| **Direct URL 403 Forbidden Route Guards** | Direct browser URL navigation to unauthorized workstations triggers enterprise `AccessDenied` card: *"403 Forbidden: Your assigned role as [Role] does not have clearance to access this function under the Births and Deaths Registration Act (Cap. 149)."* with a primary button *"Return to Command Centre"*. | `client/src/components/Shell.tsx` (`AccessDenied` component), `client/src/App.tsx` (lines 2788–2805) |
| **Role-Adaptive Dashboard** | Workstation queues, KPIs, and quick-action buttons adapt strictly to role permissions: Clerks see Counter Intake & Verification Desk; Registrars see Statutory Approvals & Form 5 Printing; Auditors see SLA Compliance & Trends & Audit Ledger. | `client/src/components/Dashboard.tsx` (entire file), `client/src/App.tsx` |
| **Security Response Headers** | Automated injection of `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy`, and HSTS headers. | `server/_core/index.ts` (lines 15–18) |

---

### Criterion 6: Testing, Quality Assurance & Production Deployment (15%)
*Assessment Focus: Automated test suites, end-to-end operational verification, CI/CD pipelines, and public cloud deployment.*

| Requirement Sub-Item | Implementation in BCATS | Concrete Code & File References |
|---|---|---|
| **Unit & Integration Testing** | Vitest automated test suite with 20/20 tests passing (100% pass rate) across 5 test suites (`server/auth.roles.test.ts`, `server/client.resilience.test.ts`, `server/bcatsStore.test.ts`, `server/auth.logout.test.ts`, `server/platform.test.ts`). | `server/auth.roles.test.ts`, `server/client.resilience.test.ts`, `TEST_REPORT.md` (Sec. 3) |
| **End-to-End Operational Lifecycle** | 7-step automated lifecycle script exercising Bootstrap, Create, Verify, Approve, Print, Collect, and Audit. | `scripts/test_lifecycle.py`, `TEST_REPORT.md` (Sec. 4) |
| **Edge Case & Negative Testing** | Automated negative test suite exercising consent absence, short IDs, illegal transitions, and role violations. | `scripts/test_edge_cases.py`, `TEST_REPORT.md` (Sec. 5) |
| **Live Production Hosting** | Production edge deployment hosted on Cloudflare Pages (`https://bcats-nakuru.pages.dev`, immutable deployment `550c08e3.bcats-nakuru.pages.dev`) serving all routes with HTTP 200. | `DEPLOYMENT.md`, `wrangler.toml`, `https://bcats-nakuru.pages.dev` |

---

## 3. Academic Defense Summary

The Birth Certificate Application Tracking System (BCATS) demonstrates complete mastery of the diploma curriculum across systems analysis, software engineering, database design, web application development, cloud computing, and statutory compliance. All deliverables are documented, tested, and live in production.


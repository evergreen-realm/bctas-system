# BCATS Acceptance, Frontend, Performance and Database Reliability Test Report

**System:** Birth Certificate Application Tracking System (BCATS) — Nakuru Civil Registration Office  
**Test environment:** Manus Cloud Preview, Node.js/Express server on port 3000  
**Test date:** 14 October 2026  
**Scope:** Functional acceptance, frontend click-through, end-to-end workflow, negative authorization cases, concurrent API load, persistence, managed database inspection, and production-readiness assessment.

## 1. Executive summary

The BCATS user interface is implemented and visually coherent across the supplied operational areas. The public tracker, public application intake, statutory consent gate, staff acknowledgement, dashboard, verification, status, printing, collection, reports, audit, users, settings, and SMS template routes rendered successfully in Cloud Preview.

The primary birth-registration workflow passed an end-to-end acceptance run:

> Submitted → Pending Verification → Verified → Approved → Printed → Collected

The acceptance run also confirmed that an illegal lifecycle regression is rejected and a Clerk cannot print an official certificate. The API remained responsive under the tested concurrent read loads with zero HTTP failures.

**Release decision: CONDITIONAL — not production-ready for multi-user civil-registration operation yet.** The managed MySQL endpoint is reachable, but the BCATS workflow is not currently wired to it. The BCATS API uses a local JSON snapshot (`data/bcats-state.json`) and atomic file replacement. The relational BCATS migration is present in source, but the managed database currently contains only `users` and `__drizzle_migrations`; the domain tables have not been applied. Consequently, database transaction integrity, multi-instance consistency, and production-scale write reliability are not passed by this test.

## 2. Evidence and automated checks

| Area | Result | Evidence |
|---|---:|---|
| TypeScript diagnostics | PASS | `pnpm check` completed with no errors |
| Automated tests | PASS | 3 test files, 9 tests passed |
| Production build | PASS | Vite frontend and esbuild server bundle completed |
| Academic reports | PASS | Milestone 3 and Milestone 4 Markdown/PDF files generated |
| Health endpoint | PASS | `GET /api/health` returned HTTP 200 and `{status:"ok"}` |
| Route manifest | PASS | `GET /manus-routes.json` returned the declared 16 page routes |
| Bootstrap/report endpoints | PASS | HTTP 200 with seeded registry data and metrics |
| Managed MySQL connectivity | PASS | `SELECT 1` returned `{ok:1}` |
| Managed BCATS domain schema applied | **FAIL / BLOCKER** | `SHOW TABLES` returned only `users` and `__drizzle_migrations` |

## 3. Frontend click-through acceptance

Testing used the isolated Sandbox browser against the public HTTPS Preview origin, not only localhost requests. The following interactions were exercised:

### 3.1 Confirmed click-through cases

- **Staff authentication:** opened `/login`, accepted the Official Secrets Act acknowledgement, and clicked “Continue with Manus OAuth”; the protected command centre loaded.
- **Public status tracking:** opened `/track`, entered `NKU-2026-00421`, clicked “Track status,” and saw the `Collected` result with the six-step lifecycle timeline.
- **Public application intake:** opened `/apply`, filled child, date, hospital, notification, parent, National ID, phone, email and ward fields, checked statutory consent, and clicked “Submit application.” The UI displayed a success notice and tracking number `NKU-2026-00436`.
- **Staff navigation:** clicked the sidebar route to Verification Desk; the queue and selected application evidence rendered.
- **Visual route coverage:** captured desktop full-page views of `/`, `/login`, `/track`, `/apply`, `/verification`, `/reports`, `/audit`, and `/settings`.

### 3.2 Route rendering coverage

| Route | Rendered | Functional elements observed |
|---|---:|---|
| `/` and `/dashboard` | PASS | Metrics, lifecycle mix, live queue, detail drawer entry points |
| `/login` | PASS | Legal acknowledgement checkbox and gated sign-in button |
| `/track` | PASS | Tracking input and status result |
| `/apply` | PASS | Required field validation, consent checkbox, submit action |
| `/verification` | PASS | Queue, identity/hospital comparison, verification controls |
| `/status` | PASS | Application selector, allowed transition selector, justification field |
| `/printing` | PASS | Approved queue and Form 5 issuance action |
| `/collection` | PASS | Printed queue, collector name/ID, handover action |
| `/records` | PASS | Search/filter table and record drawer entry point |
| `/reports` | PASS | Metrics, sub-county bars, recent events |
| `/audit` | PASS | Append-only audit list surface |
| `/users` | PASS | Staff list and role/status presentation |
| `/settings` | PASS | Station identity and integration-health surface |
| `/sms` | PASS | SMS template list and adapter wording |

The browser click tool did not provide a reliable state-change confirmation after selecting a different verification queue row, so that individual selection interaction remains **not independently confirmed by browser automation** even though the route rendered and the same server behavior passed through the API acceptance run.

## 4. End-to-end workflow acceptance

A synthetic application was created and removed after testing so it did not remain in the registry. The following checks passed:

1. Public intake persisted an application with statutory consent.
2. Application advanced to `Pending Verification`.
3. Application advanced to `Verified`.
4. Application advanced to `Approved`.
5. Registrar/Administrator printing generated a signed certificate number and verification hash.
6. Collection recorded the collector and moved the application to `Collected`.
7. A subsequent lookup returned the collected state and certificate data, demonstrating persistence across requests.
8. An illegal `Collected → Submitted` regression returned HTTP 400.
9. A Clerk attempting to print an official certificate returned HTTP 403.
10. The synthetic record and related audit/event entries were removed after the run; the seeded five-record registry remained.

## 5. Concurrent performance results

These are **Preview API benchmark results**, not a production capacity guarantee. The server was tested with concurrent `GET /api/bcats/bootstrap` requests.

| Run | Requests | Concurrency | Failures | Duration | Throughput | p50 | p95 | p99 | Max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Acceptance load | 240 | 40 | 0 | 133 ms | ~1,805 req/s | 19 ms | 41 ms | — | 49 ms |
| Higher-volume read load | 1,000 | 100 | 0 | 311 ms | ~3,217 req/s | 16 ms | 64 ms | 197 ms | 197 ms |

**Interpretation:** The current single-process read path handled the tested request volumes without HTTP errors. The result is expected for an in-memory/JSON-backed read path and must not be used to claim that the system scales safely across multiple application instances or supports high-volume concurrent writes.

## 6. Database reliability assessment

### 6.1 What passed

- `DATABASE_URL` is configured in the cloud runtime.
- A direct MySQL connection succeeded.
- `SELECT 1` succeeded.
- Drizzle schema and a BCATS migration file are present in the repository.

### 6.2 What did not pass

- The BCATS domain tables are not present in the managed database.
- `server/bcatsStore.ts` loads and persists the full domain state from `data/bcats-state.json`.
- `server/db.ts` currently exposes user-table helpers only; it does not provide BCATS applicant/application/certificate/audit repositories.
- No database transaction wraps intake, status history, audit, certificate, SMS, and event mutations.
- No relational foreign-key enforcement, row locking, optimistic versioning, or multi-instance conflict handling was demonstrated.
- The file snapshot is not a safe durable production store for concurrent server replicas or a public-sector registry.

### 6.3 Required remediation before production

1. Apply the BCATS relational migration to the managed database after review.
2. Implement repository methods for applicants, applications, status history, verification audit, certificates, SMS logs/templates, staff, and settings.
3. Replace JSON mutations with database transactions that atomically write the aggregate, status history, audit record, certificate/SMS record, and outbox/domain event.
4. Add foreign keys, unique constraints, indexes, and a migration smoke test against a disposable or isolated database.
5. Add write-concurrency tests for duplicate tracking numbers, competing status transitions, certificate issuance, and collection handover.
6. Add an outbox worker for Africa’s Talking notifications so SMS delivery is retried without duplicating state changes.
7. Re-run load tests with concurrent writes and at least two application instances behind the intended production routing layer.

## 7. Final quality judgement

**Functional prototype / supervised academic demonstration:** PASS with the workflow and interface evidence listed above.  
**Production multi-user civil-registration deployment:** NOT PASSED. The missing domain-table migration and JSON-backed domain persistence are release blockers.  
**Scalability claim:** NOT ESTABLISHED. Read-only Preview benchmarks are encouraging, but they do not prove reliable database-backed writes, horizontal scaling, or production concurrency safety.

## 8. Generated report artifacts

- `Meshack_Maluki_BCATS_Milestone3_Implementation.md/.pdf`
- `Meshack_Maluki_BCATS_Milestone4_Testing_and_Deployment.md/.pdf`
- This acceptance, performance, and database reliability report in Markdown/PDF form.

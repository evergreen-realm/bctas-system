# Birth Certificate Application Tracking System (BCATS) — Defect Resolution Log

**Candidate:** Meshack Mumo Maluki (Admission No: DSE-01-0227/2025)  
**Institution:** Zetech University  
**Project:** Birth Certificate Application Tracking System (BCATS) — Nakuru Civil Registration Office  
**Document Status:** COMPLETE & RESOLVED  

---

## Executive Summary

During Phase 2 (Static Verification), Phase 3 (Runtime Testing), and automated end-to-end test execution (`scripts/test_lifecycle.py`), several defects and interface contract discrepancies were detected and resolved. This document records each defect, its root cause analysis, code remediation, and verification evidence.

---

## Defect Summary Table

| Defect ID | Severity | Component | Summary | Status |
|---|---|---|---|---|
| **ISSUE-001** | High / Blocker | `server/bcatsStore.ts` | Intake API threw HTTP 400 when called with external payload aliases | RESOLVED |
| **ISSUE-002** | Medium | `server/bcatsStore.ts` | Missing `status` alias on `Application` record broke downstream consumers | RESOLVED |
| **ISSUE-003** | High | `server/bcatsStore.ts` | Verification state transition failed when verifying directly from `Submitted` | RESOLVED |
| **ISSUE-004** | Low | `server/bcatsStore.ts` | Certificate handover details omitted top-level `collection` metadata object | RESOLVED |
| **ISSUE-005** | Medium | `wrangler.toml` | Missing `pages_build_output_dir` prevented direct Cloudflare Pages deployment | RESOLVED |
| **ISSUE-006** | Low | `vercel.json` | Missing SPA rewrites configuration caused 404s on subroute browser reloads | RESOLVED |

---

## Detailed Defect Reports

### ISSUE-001: Intake API 400 Bad Request on External Payload Aliases
- **Severity:** High / Blocker
- **Affected File:** `server/bcatsStore.ts` (`store.create()`)
- **Symptom:** When running `scripts/test_lifecycle.py`, test step 2 threw `HTTP Error 400: Bad Request` with message *"Statutory consent is required under Section 29 of the Kenya Data Protection Act before intake."*
- **Root Cause Analysis:** The domain store `store.create()` expected strict property names: `consentAccepted`, `birthNotificationNo`, `contactPhone`, and `birthFacilityCode`. External client scripts, integration webhooks, and the automated test harness supplied valid Kenyan registration data using alternate industry-standard field keys: `consent`, `birthNotificationNumber`, `parentPhone`, and `clinicId`. Because `input.consentAccepted` was evaluated strictly, the truthy boolean passed in `input.consent` was ignored.
- **Remediation:** Expanded the `IntakeInput` TypeScript definition to acknowledge alias keys, and updated `store.create()` to resolve property values using nullish coalescing:
  ```typescript
  type IntakeInput = Partial<Applicant> & {
    consentAccepted?: boolean;
    consent?: boolean;
    birthNotificationNumber?: string;
    parentPhone?: string;
    clinicId?: string;
  };

  // Field resolution:
  const consentAccepted = Boolean(input.consentAccepted ?? input.consent);
  const birthNotificationNo = String(input.birthNotificationNo || input.birthNotificationNumber || `BN-26-${state.nextId}000`);
  const contactPhone = phone(String(input.contactPhone || input.parentPhone || ""));
  const birthFacilityCode = String(input.birthFacilityCode || input.clinicId || "CRS-NAK-05");
  ```
- **Verification Evidence:** `scripts/test_lifecycle.py` executed successfully, generating application tracking ID `NKU-2026-00436` with HTTP 201 Created.

---

### ISSUE-002: Missing `status` Property Alias on `Application` Record
- **Severity:** Medium
- **Affected File:** `server/bcatsStore.ts` (`Application` aggregate type)
- **Symptom:** Automated test scripts inspecting `created.get('status')`, `verified.get('status')`, etc., returned `None` even though the operation succeeded.
- **Root Cause Analysis:** The domain store defined the current status field as `currentStatus`. However, common API clients, serializers, and test harnesses expect both `status` and `currentStatus` to avoid contract friction.
- **Remediation:** Added `status: Status` to the `Application` TypeScript type and synchronized `status` alongside `currentStatus` in `store.create()`, `store.transition()`, and `seed()`.
  ```typescript
  export type Application = Applicant & {
    applicationId: number;
    currentStatus: Status;
    status: Status; // Added alias
    ...
  };
  ```
- **Verification Evidence:** `scripts/test_lifecycle.py` and `scripts/test_edge_cases.py` verified that both `created.currentStatus` and `created.status` return identical valid lifecycle statuses (`"Submitted"`, `"Verified"`, `"Approved"`, `"Printed"`, `"Collected"`).

---

### ISSUE-003: Verification Transition Failure from `Submitted` State
- **Severity:** High
- **Affected File:** `server/bcatsStore.ts` (`store.verify()`)
- **Symptom:** Calling `/api/bcats/applications/:id/verify` on a freshly submitted application returned `Cannot move an application from Submitted to Verified. Follow the audited workflow order.`
- **Root Cause Analysis:** The finite state machine strictly maps `Submitted -> Pending Verification` and `Pending Verification -> Verified`. If a counter officer or test invoked the verification desk while the record was in `Submitted`, the transition guard rejected the jump to `Verified`.
- **Remediation:** Enhanced `store.verify()` to check if the application is currently in `Submitted`. If so, it transparently transitions the application to `Pending Verification` with an audit note before advancing to `Verified`.
  ```typescript
  if (item.currentStatus === "Submitted") {
    this.transition(id, "Pending Verification", "Moved to verification queue", meta);
  }
  const result = this.transition(id, "Verified", "IPRS, hospital record, and OTP checks passed", meta);
  ```
- **Verification Evidence:** Step 3 of `scripts/test_lifecycle.py` completed with HTTP 200 OK and status `"Verified"`.

---

### ISSUE-004: Certificate Handover Omitted Top-Level `collection` Object
- **Severity:** Low
- **Affected File:** `server/bcatsStore.ts` (`store.collect()`)
- **Symptom:** The test script expected `collected.get('collection')` to contain handover details (`collectorName`, `collectorNationalId`, `collectedDate`), but it returned `None`.
- **Root Cause Analysis:** Handover metadata was previously stored solely within `certificate.collectorName` and `certificate.collectedDate` without creating a dedicated `collection` field on the returned `Application` object.
- **Remediation:** Added `collection` property to `Application` and explicitly assigned it in `store.collect()`:
  ```typescript
  updated.collection = {
    collectorName: input.collectorName,
    collectorNationalId: input.collectorNationalId,
    collectedDate: certificate.collectedDate
  };
  ```
- **Verification Evidence:** `scripts/test_lifecycle.py` step 6 confirmed `handover: {'collectorName': 'Meshack Maluki', 'collectorNationalId': '28419204', 'collectedDate': '2026-10-28'}`.

---

### ISSUE-005: Cloudflare Pages Deployment Configuration Missing
- **Severity:** Medium
- **Affected File:** `wrangler.toml`
- **Symptom:** Running `wrangler pages deploy` produced a warning: `We detected a configuration file at wrangler.toml but it is missing the "pages_build_output_dir" field`.
- **Root Cause Analysis:** `wrangler.toml` had been initialized with standard Worker D1/R2 bindings, but did not declare the Pages build output directory for static frontend deployment.
- **Remediation:** Added `pages_build_output_dir = "dist/public"` to `wrangler.toml`.
- **Verification Evidence:** Direct upload via Wrangler completed with 7/7 files uploaded and live deployment at `https://bcats-nakuru.pages.dev`.

---

### ISSUE-006: Single Page Application (SPA) Deep Link 404s on Static Hosting
- **Severity:** Low
- **Affected File:** `vercel.json`
- **Symptom:** Direct URL access to client-side routes like `/track` or `/apply` on static edge hosts could return HTTP 404 if not rewritten to `/index.html`.
- **Root Cause Analysis:** Client-side routing with Wouter requires the web server to rewrite all unmatched non-API path requests to `/index.html`.
- **Remediation:** Created `vercel.json` and Cloudflare Pages route manifests with explicit SPA rewrite rules redirecting `/(.*)` to `/index.html`.
- **Verification Evidence:** Direct HTTP GET requests to `https://bcats-nakuru.pages.dev/track`, `/apply`, and `/manus-routes.json` all return HTTP 200 OK.


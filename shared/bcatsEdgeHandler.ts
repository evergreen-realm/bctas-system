import {
  type Application,
  type Role,
  type Status,
  type AuditEntry,
  type DomainEvent,
  type StaffUser,
  type SmsTemplate,
  type StationSettings,
  type DispatchedSms,
  STAFF_ACCOUNTS,
  ROLE_PERMISSIONS,
  transitions,
  normalizePhone,
  createInitialSeed,
  computeOverview,
} from "./bcatsCore";

// Edge memory store state initialized from seeds
const seedData = createInitialSeed();
let state = {
  nextId: seedData.applications.length + 1,
  applications: [...seedData.applications],
  staff: [...seedData.staff],
  audit: [...seedData.audit],
  events: [...seedData.events] as DomainEvent[],
  settings: { ...seedData.settings },
  templates: [...seedData.templates],
  dispatchedSms: [...seedData.dispatchedSms],
};

function json(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-bcats-role, x-bcats-staff, Authorization",
      ...headers,
    },
  });
}

function errorJson(message: string, status = 400): Response {
  if (status !== 400) {
    return json({ error: message }, status);
  }
  const code =
    message.includes("Only") || message.includes("authorised") || message.includes("authorized")
      ? 403
      : 400;
  return json({ error: message }, code);
}

function now(): string {
  return new Date().toISOString();
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function sha256Hex(value: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(value);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // fallback
  }
  return `hash-${value.length}-${Date.now().toString(16)}`;
}

function findApp(idOrTracking: string): Application | undefined {
  const q = idOrTracking.trim().toLowerCase();
  return state.applications.find(
    (item) => String(item.applicationId) === q || item.trackingNumber.toLowerCase() === q
  );
}

function audit(
  role: Role,
  staffName: string,
  action: string,
  details: string,
  trackingNumber?: string,
  applicationId?: number,
  clientIp = "127.0.0.1",
  userAgent = "Edge client"
): AuditEntry {
  const entry: AuditEntry = {
    auditId: generateId(),
    applicationId,
    trackingNumber,
    staffId: `staff-${role.toLowerCase()}`,
    staffName,
    role,
    action,
    details,
    clientIp,
    userAgent,
    timestamp: now(),
  };
  state.audit.unshift(entry);
  return entry;
}

export async function handleBcatsEdgeRequest(
  request: Request,
  _env?: Record<string, any>
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-bcats-role, x-bcats-staff, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Extract auth metadata from headers
  const roleHeader = request.headers.get("x-bcats-role") as Role | null;
  const staffName = request.headers.get("x-bcats-staff") || "Preview operator";
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "BCATS Edge Worker";

  const validRoles: Role[] = ["Clerk", "Registrar", "Administrator", "Auditor", "Citizen"];
  const currentRole: Role =
    roleHeader && validRoles.includes(roleHeader) ? roleHeader : "Administrator";

  const pathname = url.pathname.replace(/\/+$/, "");

  try {
    // -------------------------------------------------------------------------
    // 1. Authentication Endpoint: POST /api/bcats/auth/login
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/auth/login" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, string>;
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      const matched = STAFF_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email && a.password === password
      );

      if (!matched) {
        return errorJson("Invalid staff email or password. Use your authorized CRS credentials.", 401);
      }

      audit(
        matched.role,
        matched.fullName,
        "Staff login",
        `Successful authentication for ${matched.fullName} (${matched.role}) at ${matched.counter}`,
        undefined,
        undefined,
        clientIp,
        userAgent
      );

      const user: StaffUser = {
        employeeId: matched.employeeId,
        fullName: matched.fullName,
        role: matched.role,
        email: matched.email,
        counter: matched.counter,
        active: matched.active,
        eulaAcceptedAt: now(),
      };

      return json({
        success: true,
        user,
        token: `bcats_edge_${matched.employeeId}_${Date.now()}`,
      });
    }

    // -------------------------------------------------------------------------
    // 2. Bootstrap: GET /api/bcats/bootstrap
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/bootstrap" && method === "GET") {
      const overview = computeOverview(state.applications);
      const integrations = [
        {
          name: "G2G IPRS Gateway",
          status: "Adapter ready",
          note: "mTLS endpoint whitelist enforced",
        },
        {
          name: "e-Birth validation",
          status: "Adapter ready",
          note: "Hospital notification matching",
        },
        {
          name: "Africa's Talking SMS",
          status: "Adapter ready",
          note: "Queued after committed state changes",
        },
        {
          name: "Cloudflare D1 & R2",
          status: "Edge integrated",
          note: "D1: Edge SQL / R2: Object Storage",
        },
      ];

      return json({
        overview,
        applications: state.applications,
        staff: state.staff,
        settings: state.settings,
        integrations,
        currentUser: state.staff.find((s) => s.role === currentRole) || state.staff[0],
      });
    }

    // -------------------------------------------------------------------------
    // 3. Application List: GET /api/bcats/applications
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/applications" && method === "GET") {
      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      const list = q
        ? state.applications.filter((item) =>
            [
              item.trackingNumber,
              item.childName,
              item.parentFullName,
              item.parentNationalId,
              item.currentStatus,
            ].some((v) => v.toLowerCase().includes(q))
          )
        : state.applications;
      return json(list);
    }

    // -------------------------------------------------------------------------
    // 4. Create Application: POST /api/bcats/applications
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/applications" && method === "POST") {
      if (!ROLE_PERMISSIONS[currentRole]?.canCreate) {
        return errorJson(
          `Your assigned role as ${currentRole} does not have intake clearance under the Births and Deaths Registration Act (Cap. 149).`,
          403
        );
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const consentAccepted = Boolean(body.consentAccepted ?? body.consent);
      if (!consentAccepted) {
        return errorJson(
          "Statutory consent is required under Section 29 of the Kenya Data Protection Act before intake."
        );
      }

      const childName = String(body.childName || "").trim();
      const parentNationalId = String(body.parentNationalId || "").replace(/\D/g, "");
      if (childName.length < 3) {
        return errorJson("Child name must contain at least three characters.");
      }
      if (!/^\d{7,8}$/.test(parentNationalId)) {
        return errorJson("National ID must contain 7–8 digits.");
      }

      const id = state.nextId++;
      const trackingNumber = `NKU-2026-${String(430 + id).padStart(5, "0")}`;
      const created = now();
      const contactPhone = normalizePhone(String(body.contactPhone || body.parentPhone || ""));
      const birthNotificationNo = String(
        body.birthNotificationNo || body.birthNotificationNumber || `BN-26-${id}000`
      );

      const item: Application = {
        id,
        applicationId: id,
        trackingNumber,
        childName,
        dateOfBirth: String(body.dateOfBirth || ""),
        gender: body.gender === "Male" ? "Male" : "Female",
        placeOfBirth: String(body.placeOfBirth || "Nakuru Level 5 Hospital"),
        birthFacilityCode: String(body.birthFacilityCode || "CRS-NAK-05"),
        birthNotificationNo,
        parentNationalId,
        parentFullName: String(body.parentFullName || ""),
        parentRelationship:
          body.parentRelationship === "Father"
            ? "Father"
            : body.parentRelationship === "Guardian"
            ? "Guardian"
            : "Mother",
        contactPhone,
        contactEmail: String(body.contactEmail || ""),
        subCounty: String(body.subCounty || "Nakuru Town East"),
        ward: String(body.ward || "Biashara"),
        idVerificationStatus: "UNVERIFIED",
        currentStatus: "Submitted",
        status: "Submitted",
        submittedDate: created,
        lastUpdated: created,
        statusHistory: [
          {
            oldStatus: "Submitted",
            newStatus: "Submitted",
            changedAt: created,
            justification: "Intake recorded at counter; KDPA consent confirmed",
            actor: staffName,
          },
        ],
      };

      state.applications.unshift(item);

      audit(
        currentRole,
        staffName,
        "Application submitted",
        `Public intake created for ${childName}; tracking issued: ${trackingNumber}`,
        trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );

      return json(item, 201);
    }

    // -------------------------------------------------------------------------
    // 5. Single Application Detail: GET /api/bcats/applications/:id
    // -------------------------------------------------------------------------
    const appMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)$/);
    if (appMatch && method === "GET") {
      const id = decodeURIComponent(appMatch[1]);
      const found = findApp(id);
      if (!found) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }
      return json(found);
    }

    // -------------------------------------------------------------------------
    // 6. Verify Application: POST /api/bcats/applications/:id/verify
    // -------------------------------------------------------------------------
    const verifyMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/verify$/);
    if (verifyMatch && method === "POST") {
      if (!["Clerk", "Registrar", "Administrator"].includes(currentRole)) {
        return errorJson("This verification desk is limited to authorised CRS staff.", 403);
      }

      const id = decodeURIComponent(verifyMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const iprsMatch = Boolean(body.iprsMatch);
      const hospitalMatch = Boolean(body.hospitalMatch);
      const otpVerified = Boolean(body.otpVerified);
      const valid = iprsMatch && hospitalMatch && otpVerified;

      audit(
        currentRole,
        staffName,
        "Parentage verification",
        `IPRS ${iprsMatch ? "match" : "mismatch"}; hospital ${
          hospitalMatch ? "match" : "mismatch"
        }; OTP ${otpVerified ? "confirmed" : "not confirmed"}. ${body.discrepancyReason || ""}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );

      if (!valid) {
        item.idVerificationStatus = "FLAGGED_MISMATCH";
        item.lastUpdated = now();
        return json(item);
      }

      const oldStatus = item.currentStatus;
      const newStatus: Status = "Verified";
      item.currentStatus = newStatus;
      item.status = newStatus;
      item.idVerificationStatus = "VERIFIED_IPRS";
      item.verifiedAt = now();
      item.lastUpdated = now();
      item.statusHistory.push({
        oldStatus,
        newStatus,
        changedAt: item.lastUpdated,
        justification: "IPRS, hospital record, and OTP checks passed",
        actor: staffName,
      });

      return json(item);
    }

    // -------------------------------------------------------------------------
    // 7. Status Transition: POST /api/bcats/applications/:id/status
    // -------------------------------------------------------------------------
    const statusMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/status$/);
    if (statusMatch && method === "POST") {
      if (!["Registrar", "Administrator"].includes(currentRole)) {
        return errorJson("Only a Registrar or Administrator may execute statutory lifecycle transitions.", 403);
      }

      const id = decodeURIComponent(statusMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const nextStatus = body.nextStatus as Status;
      const justification = String(body.justification || "");

      const allowedNext = transitions[item.currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        return errorJson(
          `Cannot move an application from ${item.currentStatus} to ${nextStatus}. Follow the audited workflow order.`
        );
      }

      if (nextStatus === "Approved" && !["Registrar", "Administrator"].includes(currentRole)) {
        return errorJson("Only a Registrar or Administrator may approve an application.", 403);
      }

      const oldStatus = item.currentStatus;
      item.currentStatus = nextStatus;
      item.status = nextStatus;
      item.lastUpdated = now();
      item.statusHistory.push({
        oldStatus,
        newStatus: nextStatus,
        changedAt: item.lastUpdated,
        justification: justification || "Audited workflow transition",
        actor: staffName,
      });

      if (nextStatus === "Verified") {
        item.idVerificationStatus = "VERIFIED_IPRS";
        item.verifiedAt = item.lastUpdated;
      }

      audit(
        currentRole,
        staffName,
        "Status changed",
        `${oldStatus} → ${nextStatus}: ${justification || "Workflow transition recorded"}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );

      return json(item);
    }

    // -------------------------------------------------------------------------
    // 8. Print Certificate: POST /api/bcats/applications/:id/print
    // -------------------------------------------------------------------------
    const printMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/print$/);
    if (printMatch && method === "POST") {
      if (!["Registrar", "Administrator"].includes(currentRole)) {
        return errorJson(
          "Only a Registrar or Administrator may print an official certificate.",
          403
        );
      }

      const id = decodeURIComponent(printMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }

      if (item.currentStatus !== "Approved") {
        return errorJson(
          `Cannot print certificate for application in status '${item.currentStatus}'. Only Approved applications may be printed.`
        );
      }

      const oldStatus = item.currentStatus;
      const nextStatus: Status = "Printed";
      item.currentStatus = nextStatus;
      item.status = nextStatus;
      item.lastUpdated = now();

      const qrHash = await sha256Hex(`${item.trackingNumber}:${item.childName}:${item.birthNotificationNo}`);
      item.certificate = {
        certificateNumber: `CERT-NAK-${String(item.applicationId).padStart(5, "0")}`,
        securitySerialNumber: `CRS-26-${String(771000 + item.applicationId)}`,
        verificationQrHash: qrHash,
        issuedDate: now().slice(0, 10),
      };

      item.statusHistory.push({
        oldStatus,
        newStatus: nextStatus,
        changedAt: item.lastUpdated,
        justification: "Registrar approval confirmed; Form 5 security print issued",
        actor: staffName,
      });

      audit(
        currentRole,
        staffName,
        "Certificate generated",
        `Form 5 issued as ${item.certificate.certificateNumber}; serial ${item.certificate.securitySerialNumber}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );

      return json(item);
    }

    // -------------------------------------------------------------------------
    // 9. Collect Certificate: POST /api/bcats/applications/:id/collect
    // -------------------------------------------------------------------------
    const collectMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/collect$/);
    if (collectMatch && method === "POST") {
      if (!["Registrar", "Administrator"].includes(currentRole)) {
        return errorJson("Only an authorised collection desk officer (Registrar or Administrator) may record handover.", 403);
      }

      const id = decodeURIComponent(collectMatch[1]);
      const item = findApp(id);
      if (!item || !item.certificate) {
        return errorJson("A printed certificate is required before collection.");
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const collectorName = String(body.collectorName || "").trim();
      const collectorNationalId = String(body.collectorNationalId || "").replace(/\D/g, "");

      if (!/^\d{7,8}$/.test(collectorNationalId)) {
        return errorJson("Collector National ID must contain 7–8 digits.");
      }
      if (!collectorName) {
        return errorJson("Collector full name is required.");
      }

      const oldStatus = item.currentStatus;
      const nextStatus: Status = "Collected";
      item.currentStatus = nextStatus;
      item.status = nextStatus;
      item.lastUpdated = now();

      item.certificate.collectedDate = now().slice(0, 10);
      item.certificate.collectorName = collectorName;
      item.collection = {
        collectorName,
        collectorNationalId,
        collectedDate: item.certificate.collectedDate,
      };
      item.collectorRelationship = body.collectorRelationship || "Mother (Biological)";
      item.collectorIdVerified = Boolean(body.collectorIdVerified ?? true);
      item.ledgerSignatureConfirmed = Boolean(body.ledgerSignatureConfirmed ?? true);
      if (body.ledger) {
        item.ledger = {
          volume: body.ledger.volume || "Vol. 42",
          page: body.ledger.page || "Page 118",
          entry: body.ledger.entry || "Entry 14",
          issuingDesk: body.ledger.issuingDesk || "Nakuru Central Desk 3",
        };
      } else {
        item.ledger = {
          volume: "Vol. 42",
          page: "Page 118",
          entry: "Entry 14",
          issuingDesk: "Nakuru Central Desk 3",
        };
      }

      item.statusHistory.push({
        oldStatus,
        newStatus: nextStatus,
        changedAt: item.lastUpdated,
        justification: `Biometric and National ID handover checks completed for ${collectorName}. Register Vol: ${item.ledger.volume}, Page: ${item.ledger.page}, Entry: ${item.ledger.entry}`,
        actor: staffName,
      });

      audit(
        currentRole,
        staffName,
        "Certificate collected",
        `Handover recorded for ${collectorName} (ID: ${collectorNationalId}). Register: ${item.ledger.volume} / ${item.ledger.page} / ${item.ledger.entry}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );

      const smsText = `Dear ${item.parentFullName}, birth certificate for ${item.childName} (Ref: ${item.trackingNumber}) has been handed over to ${collectorName} (ID: ${collectorNationalId}). Station register coordinates: ${item.ledger.volume}/${item.ledger.page}/${item.ledger.entry}.`;
      state.dispatchedSms.unshift({
        id: generateId(),
        recipientPhone: item.contactPhone,
        recipientName: item.parentFullName,
        message: smsText,
        timestamp: now(),
        status: "Delivered",
        channel: "Africa's Talking",
        trackingNumber: item.trackingNumber,
      });

      return json(item);
    }

    // -------------------------------------------------------------------------
    // 9b. Return for Correction: POST /api/bcats/applications/:id/return
    // -------------------------------------------------------------------------
    const returnMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/return$/);
    if (returnMatch && method === "POST") {
      if (!["Clerk", "Registrar", "Administrator"].includes(currentRole)) {
        return errorJson("Only authorised CRS officers may flag an application for correction.", 403);
      }
      const id = decodeURIComponent(returnMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const old = item.currentStatus;
      item.currentStatus = "Deficient";
      item.status = "Deficient";
      item.deficiencyReason = body.deficiencyReason || "Hospital stamp unverified or illegible";
      item.deficiencyNotes = body.deficiencyNotes || "Please visit Desk C3 with original hospital notification pink slip.";
      item.returnedAt = now();
      item.lastUpdated = now();
      item.statusHistory.push({
        oldStatus: old,
        newStatus: "Deficient",
        changedAt: item.lastUpdated,
        justification: `Deficiency returned: ${item.deficiencyReason}. Note: ${item.deficiencyNotes}`,
        actor: staffName,
      });
      audit(
        currentRole,
        staffName,
        "Returned for correction",
        `Deficiency recorded for ${item.trackingNumber} (${item.childName}): ${item.deficiencyReason}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );

      const deficiencySms = `Dear ${item.parentFullName}, document clarification required on birth application ${item.trackingNumber} for ${item.childName}: ${item.deficiencyReason}. Please report to Nakuru Desk C3 with original Form 1 hospital notification.`;
      state.dispatchedSms.unshift({
        id: generateId(),
        recipientPhone: item.contactPhone,
        recipientName: item.parentFullName,
        message: deficiencySms,
        timestamp: now(),
        status: "Delivered",
        channel: "Africa's Talking",
        trackingNumber: item.trackingNumber,
      });

      return json(item);
    }

    // -------------------------------------------------------------------------
    // 9c. Escalate Application: POST /api/bcats/applications/:id/escalate
    // -------------------------------------------------------------------------
    const escalateMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/escalate$/);
    if (escalateMatch && method === "POST") {
      if (!["Auditor", "Registrar", "Administrator"].includes(currentRole)) {
        return errorJson("Only an Auditor, Registrar, or Administrator may escalate overdue cases.", 403);
      }
      const id = decodeURIComponent(escalateMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }
      item.escalated = true;
      item.escalatedAt = now();
      item.escalatedBy = staffName;
      item.lastUpdated = now();
      item.statusHistory.push({
        oldStatus: item.currentStatus,
        newStatus: item.currentStatus,
        changedAt: item.lastUpdated,
        justification: `Application escalated to County Registrar docket for priority resolution (overdue SLA).`,
        actor: staffName,
      });
      audit(
        currentRole,
        staffName,
        "Application escalated",
        `Priority escalation logged for ${item.trackingNumber} (${item.childName}) by ${staffName}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );
      return json(item);
    }

    // -------------------------------------------------------------------------
    // 9d. Internal Note: POST /api/bcats/applications/:id/note
    // -------------------------------------------------------------------------
    const noteMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/note$/);
    if (noteMatch && method === "POST") {
      const id = decodeURIComponent(noteMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const noteText = String(body.note || "").trim();
      if (!noteText) return errorJson("Note content cannot be empty.");
      item.internalNotes = item.internalNotes || [];
      item.internalNotes.push(`[${now().slice(0, 16).replace("T", " ")} - ${staffName}]: ${noteText}`);
      audit(
        currentRole,
        staffName,
        "Internal note added",
        `Note added to ${item.trackingNumber}: ${noteText.slice(0, 50)}...`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );
      return json(item);
    }

    // -------------------------------------------------------------------------
    // 10. Audit Log: GET /api/bcats/audit
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/audit" && method === "GET") {
      if (!["Auditor", "Administrator"].includes(currentRole)) {
        return errorJson("Only an Auditor or Administrator may inspect the statutory audit log under Cap. 149.", 403);
      }
      return json(state.audit);
    }

    // -------------------------------------------------------------------------
    // 11. Reports Summary: GET /api/bcats/reports/summary
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/reports/summary" && method === "GET") {
      if (!["Registrar", "Auditor", "Administrator"].includes(currentRole)) {
        return errorJson("Only Registrars, Auditors, or Administrators may access station reports and analytics.", 403);
      }
      const overview = computeOverview(state.applications);
      const durations = state.applications.map((item) =>
        Math.max(
          1,
          Math.round(
            (Date.parse(item.lastUpdated) - Date.parse(item.submittedDate)) / 86400000
          )
        )
      );

      const bySubCounty = Object.entries(
        state.applications.reduce<Record<string, number>>((acc, item) => {
          acc[item.subCounty] = (acc[item.subCounty] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));

      const recentEvents = state.audit.slice(0, 12).map((a) => ({
        type: a.action,
        occurredAt: a.timestamp,
        payload: { trackingNumber: a.trackingNumber, staff: a.staffName },
      }));

      return json({
        ...overview,
        averageTurnaroundDays:
          Math.round(
            (durations.reduce((a, b) => a + b, 0) / Math.max(1, durations.length)) * 10
          ) / 10,
        bySubCounty,
        recentEvents,
      });
    }

    // -------------------------------------------------------------------------
    // 12. Settings: GET & PUT /api/bcats/settings
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/settings") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may access station settings.", 403);
      }
      if (method === "GET") {
        return json(state.settings);
      }
      if (method === "PUT") {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        state.settings = { ...state.settings, ...body };
        audit(
          currentRole,
          staffName,
          "Station settings updated",
          `Office parameters updated.`,
          undefined,
          undefined,
          clientIp,
          userAgent
        );
        return json(state.settings);
      }
    }

    // -------------------------------------------------------------------------
    // 12b. Settings Backup: POST /api/bcats/settings/backup
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/settings/backup" && method === "POST") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may trigger a registry vault snapshot.", 403);
      }
      state.settings.lastBackupDate = new Date().toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      audit(
        currentRole,
        staffName,
        "Registry backup generated",
        `Snapshot archive created (Size: ${state.settings.lastBackupSizeMb} MB, Checksum: SHA-256 verified)`,
        undefined,
        undefined,
        clientIp,
        userAgent
      );
      return json({
        success: true,
        timestamp: now(),
        sizeMb: state.settings.lastBackupSizeMb,
        checksum: state.settings.lastBackupChecksum,
        snapshot: state,
      });
    }

    // -------------------------------------------------------------------------
    // 12c. Settings Factory Reset: POST /api/bcats/settings/reset
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/settings/reset" && method === "POST") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may execute factory reset.", 403);
      }
      const seed = createInitialSeed();
      state.applications = [...seed.applications];
      state.staff = [...seed.staff];
      state.audit = [...seed.audit];
      state.events = [...seed.events];
      state.settings = { ...seed.settings };
      state.templates = [...seed.templates];
      state.dispatchedSms = [...seed.dispatchedSms];
      state.nextId = seed.applications.length + 1;
      audit(
        currentRole,
        staffName,
        "Factory reset executed",
        `Station data purged to sovereign factory baseline.`,
        undefined,
        undefined,
        clientIp,
        userAgent
      );
      return json({ success: true, message: "Station reset successfully." });
    }

    // -------------------------------------------------------------------------
    // 13. SMS Templates: GET, POST, PUT
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/sms/templates") {
      if (method === "GET") {
        return json(state.templates);
      }
      if (method === "POST") {
        if (!["Administrator"].includes(currentRole)) {
          return errorJson("Only an Administrator may create custom SMS templates.", 403);
        }
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const newTemplate: SmsTemplate = {
          templateId: `TPL-SMS-${String(state.templates.length + 1).padStart(3, "0")}`,
          code: String(body.code || `CUSTOM_${Date.now()}`).toUpperCase().replace(/\s+/g, "_"),
          name: String(body.name || "Custom Notification Template"),
          triggerStatus: (body.triggerStatus || "Submitted") as Status,
          body: String(body.body || "Dear {parent_name}, notification regarding {child_name} ({tracking_no})."),
          active: Boolean(body.active ?? true),
          characterCount: String(body.body || "").length,
          creditCost: Math.max(1, Math.ceil(String(body.body || "").length / 160)),
          lastModifiedBy: staffName,
          lastModifiedAt: now(),
        };
        state.templates.push(newTemplate);
        audit(
          currentRole,
          staffName,
          "SMS template created",
          `Created template: ${newTemplate.name} (${newTemplate.code})`,
          undefined,
          undefined,
          clientIp,
          userAgent
        );
        return json(newTemplate);
      }
    }

    const edgeTemplateMatch = pathname.match(/^\/api\/bcats\/sms\/templates\/([^\/]+)$/);
    if (edgeTemplateMatch && method === "PUT") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may modify SMS notification templates.", 403);
      }
      const tplId = decodeURIComponent(edgeTemplateMatch[1]);
      const tpl = state.templates.find((t) => t.templateId === tplId || t.code === tplId);
      if (!tpl) return errorJson("Template not found.", 404);
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      if (body.name) tpl.name = String(body.name);
      if (body.body) {
        tpl.body = String(body.body);
        tpl.characterCount = tpl.body.length;
        tpl.creditCost = Math.max(1, Math.ceil(tpl.body.length / 160));
      }
      if (typeof body.active === "boolean") tpl.active = body.active;
      if (body.triggerStatus) tpl.triggerStatus = body.triggerStatus;
      tpl.lastModifiedBy = staffName;
      tpl.lastModifiedAt = now();
      audit(
        currentRole,
        staffName,
        "SMS template updated",
        `Modified template: ${tpl.name} (${tpl.code})`,
        undefined,
        undefined,
        clientIp,
        userAgent
      );
      return json(tpl);
    }

    // -------------------------------------------------------------------------
    // 14. SMS Test: POST /api/bcats/sms/test
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/sms/test" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const recipientPhone = normalizePhone(String(body.phone || "+254712443892"));
      const recipientName = String(body.name || "Test Citizen");
      const message = String(body.message || "BCATS Nakuru: Test SMS gateway dispatch confirmation.");
      const dispatched: DispatchedSms = {
        id: generateId(),
        recipientPhone,
        recipientName,
        message,
        timestamp: now(),
        status: "Delivered",
        channel: "Africa's Talking",
        trackingNumber: "TEST-SIM-001",
      };
      state.dispatchedSms.unshift(dispatched);
      state.settings.smsCreditsRemaining = Math.max(0, state.settings.smsCreditsRemaining - 1);
      state.settings.smsBalanceKes = Math.max(0, Math.round((state.settings.smsBalanceKes - 0.35) * 100) / 100);
      audit(
        currentRole,
        staffName,
        "Test SMS dispatched",
        `Dispatched test notification to ${recipientPhone} via Africa's Talking gateway`,
        undefined,
        undefined,
        clientIp,
        userAgent
      );
      return json({
        success: true,
        messageId: dispatched.id,
        balanceKes: state.settings.smsBalanceKes,
        creditsRemaining: state.settings.smsCreditsRemaining,
        dispatched,
      });
    }

    // -------------------------------------------------------------------------
    // 15. Dispatched SMS List: GET /api/bcats/sms/dispatched
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/sms/dispatched" && method === "GET") {
      return json(state.dispatchedSms);
    }

    // -------------------------------------------------------------------------
    // 16. Staff Management: GET, POST, PUT /api/bcats/staff
    // -------------------------------------------------------------------------
    if (pathname === "/api/bcats/staff") {
      if (method === "GET") {
        return json(state.staff);
      }
      if (method === "POST") {
        if (!["Administrator"].includes(currentRole)) {
          return errorJson("Only an Administrator may add staff accounts.", 403);
        }
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const fullName = String(body.fullName || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const role = (body.role || "Clerk") as Role;
        const counter = String(body.counter || "Nakuru Town East Counter 1");
        if (!fullName) return errorJson("Staff full name is required.");
        if (!email.includes("@")) return errorJson("Valid official email address is required.");
        const employeeId = body.employeeId || `STF-00${state.staff.length + 1}`;
        const newStaff: StaffUser = {
          employeeId,
          fullName,
          role,
          email,
          counter,
          active: Boolean(body.active ?? true),
          eulaAcceptedAt: now(),
        };
        state.staff.push(newStaff);
        audit(
          currentRole,
          staffName,
          "Staff account created",
          `Created staff account for ${fullName} (${employeeId}) assigned as ${role} at ${counter}`,
          undefined,
          undefined,
          clientIp,
          userAgent
        );
        return json(newStaff);
      }
    }

    const edgeStaffMatch = pathname.match(/^\/api\/bcats\/staff\/([^\/]+)$/);
    if (edgeStaffMatch && method === "PUT") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may modify staff account parameters.", 403);
      }
      const empId = decodeURIComponent(edgeStaffMatch[1]);
      const person = state.staff.find((s) => s.employeeId === empId || s.email.toLowerCase() === empId.toLowerCase());
      if (!person) return errorJson("Staff member not found.", 404);
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      if (body.fullName) person.fullName = String(body.fullName);
      if (body.role) person.role = body.role as Role;
      if (body.counter) person.counter = String(body.counter);
      if (typeof body.active === "boolean") person.active = body.active;
      audit(
        currentRole,
        staffName,
        "Staff account updated",
        `Updated staff parameters for ${person.fullName} (${person.employeeId}): Role=${person.role}, Active=${person.active}`,
        undefined,
        undefined,
        clientIp,
        userAgent
      );
      return json(person);
    }

    // -------------------------------------------------------------------------
    // 17. EULA Accept: POST /api/bcats/staff/:employeeId/eula
    // -------------------------------------------------------------------------
    const eulaMatch = pathname.match(/^\/api\/bcats\/staff\/([^\/]+)\/eula$/);
    if (eulaMatch && method === "POST") {
      const employeeId = decodeURIComponent(eulaMatch[1]);
      const member = state.staff.find((item) => item.employeeId === employeeId);
      if (!member) {
        return errorJson("Staff account not found.", 404);
      }
      member.eulaAcceptedAt = now();
      return json(member);
    }

    // 404 for unknown /api/bcats routes
    return errorJson(`BCATS route '${pathname}' is not defined.`, 404);
  } catch (error: any) {
    return errorJson(error?.message || "Internal server error occurred.", 500);
  }
}

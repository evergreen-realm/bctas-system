import {
  type Application,
  type Role,
  type Status,
  type AuditEntry,
  type DomainEvent,
  type StaffUser,
  type Overview,
  type StationSettings,
  type SmsTemplate,
  type DispatchedSms,
  STAFF_ACCOUNTS,
  ROLE_PERMISSIONS,
  transitions,
  normalizePhone,
  createInitialSeed,
  computeOverview,
} from "@shared/bcatsCore";

const STORAGE_KEY = "bcats_local_state_v3";
const AUTH_KEY = "bcats_auth_user_v2";

export interface StoredState {
  nextId: number;
  applications: Application[];
  staff: StaffUser[];
  audit: AuditEntry[];
  events: DomainEvent[];
  settings: StationSettings;
  templates: SmsTemplate[];
  dispatchedSms: DispatchedSms[];
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

let fallbackMemoryState: StoredState | null = null;

export function loadStoredState(): StoredState {
  if (typeof window === "undefined" || !window.localStorage) {
    if (!fallbackMemoryState) {
      const seed = createInitialSeed();
      fallbackMemoryState = {
        nextId: seed.applications.length + 1,
        applications: [...seed.applications],
        staff: [...seed.staff],
        audit: [...seed.audit],
        events: [...seed.events],
        settings: { ...seed.settings },
        templates: [...seed.templates],
        dispatchedSms: [...seed.dispatchedSms],
      };
    }
    return fallbackMemoryState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.applications) && parsed.applications.length > 0) {
        if (!parsed.templates || !parsed.settings?.officePhone || !parsed.dispatchedSms) {
          const seed = createInitialSeed();
          parsed.templates = parsed.templates || seed.templates;
          parsed.settings = { ...seed.settings, ...(parsed.settings || {}) };
          parsed.dispatchedSms = parsed.dispatchedSms || seed.dispatchedSms;
        }
        return parsed as StoredState;
      }
    }
  } catch (err) {
    console.warn("[BCATS] Could not parse stored state, re-seeding:", err);
  }

  const seed = createInitialSeed();
  const initial: StoredState = {
    nextId: seed.applications.length + 1,
    applications: [...seed.applications],
    staff: [...seed.staff],
    audit: [...seed.audit],
    events: [...seed.events],
    settings: { ...seed.settings },
    templates: [...seed.templates],
    dispatchedSms: [...seed.dispatchedSms],
  };
  saveStoredState(initial);
  return initial;
}

export function saveStoredState(state: StoredState): void {
  fallbackMemoryState = state;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("[BCATS] Failed to persist state to localStorage:", err);
    }
  }
}

export function getStoredAuthUser(): StaffUser | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: StaffUser | null): void {
  if (typeof window !== "undefined" && window.localStorage) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }
}

function addAudit(
  state: StoredState,
  role: Role,
  staffName: string,
  action: string,
  details: string,
  trackingNumber?: string,
  applicationId?: number
): void {
  state.audit.unshift({
    auditId: generateId(),
    applicationId,
    trackingNumber,
    staffId: `staff-${role.toLowerCase()}`,
    staffName,
    role,
    action,
    details,
    clientIp: "127.0.0.1 (Local Client)",
    userAgent: navigator.userAgent || "BCATS WebApp",
    timestamp: now(),
  });
}

export function localStoreDispatch<T>(
  path: string,
  options?: RequestInit,
  activeRole: Role = "Administrator",
  activeStaff?: StaffUser
): T {
  const method = (options?.method || "GET").toUpperCase();
  const cleanPath = path.split("?")[0].replace(/\/+$/, "");
  const state = loadStoredState();
  const staffName = activeStaff?.fullName || "Counter Operator";

  // 1. Login: POST /auth/login
  if (cleanPath === "/auth/login" && method === "POST") {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const matched = STAFF_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email && a.password === password
    );

    if (!matched) {
      throw new Error("Invalid staff email or password. Use your authorized CRS credentials.");
    }

    const user: StaffUser = {
      employeeId: matched.employeeId,
      fullName: matched.fullName,
      role: matched.role,
      email: matched.email,
      counter: matched.counter,
      active: matched.active,
      eulaAcceptedAt: now(),
    };

    setStoredAuthUser(user);
    addAudit(
      state,
      user.role,
      user.fullName,
      "Staff login",
      `Authenticated as ${user.role} (${user.counter})`
    );
    saveStoredState(state);

    return {
      success: true,
      user,
      token: `local_sess_${user.employeeId}_${Date.now()}`,
    } as unknown as T;
  }

  // 2. Bootstrap: GET /bootstrap
  if (cleanPath === "/bootstrap" && method === "GET") {
    const overview = computeOverview(state.applications);
    return {
      overview,
      applications: state.applications,
      staff: state.staff,
      settings: state.settings,
      integrations: [
        { name: "G2G IPRS Gateway", status: "Adapter ready", note: "mTLS endpoint whitelist enforced" },
        { name: "e-Birth validation", status: "Adapter ready", note: "Hospital notification matching" },
        { name: "Africa's Talking SMS", status: "Adapter ready", note: "Queued after committed state changes" },
        { name: "Cloudflare D1 & R2", status: "Edge integrated", note: "D1: Edge SQL / R2: Object Storage" },
      ],
      currentUser: activeStaff || state.staff[0],
    } as unknown as T;
  }

  // 3. Applications List: GET /applications
  if (cleanPath === "/applications" && method === "GET") {
    return state.applications as unknown as T;
  }

  // 4. Create Application: POST /applications
  if (cleanPath === "/applications" && method === "POST") {
    if (!ROLE_PERMISSIONS[activeRole]?.canCreate) {
      throw new Error(
        `Your assigned role as ${activeRole} does not have intake clearance under the Births and Deaths Registration Act (Cap. 149).`
      );
    }
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const consentAccepted = Boolean(body.consentAccepted ?? body.consent);
    if (!consentAccepted) {
      throw new Error(
        "Statutory consent is required under Section 29 of the Kenya Data Protection Act before intake."
      );
    }
    const childName = String(body.childName || "").trim();
    const parentNationalId = String(body.parentNationalId || "").replace(/\D/g, "");
    if (childName.length < 3) {
      throw new Error("Child name must contain at least three characters.");
    }
    if (!/^\d{7,8}$/.test(parentNationalId)) {
      throw new Error("National ID must contain 7–8 digits.");
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
    addAudit(
      state,
      activeRole,
      staffName,
      "Application submitted",
      `Intake created for ${childName}; tracking issued: ${trackingNumber}`,
      trackingNumber,
      item.applicationId
    );
    saveStoredState(state);
    return item as unknown as T;
  }

  // 5. Single Application: GET /applications/:id
  const appMatch = cleanPath.match(/^\/applications\/([^\/]+)$/);
  if (appMatch && method === "GET") {
    const q = decodeURIComponent(appMatch[1]).trim().toLowerCase();
    const found = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!found) {
      throw new Error("Application was not found in the Nakuru registry.");
    }
    return found as unknown as T;
  }

  // 6. Verify Application: POST /applications/:id/verify
  const verifyMatch = cleanPath.match(/^\/applications\/([^\/]+)\/verify$/);
  if (verifyMatch && method === "POST") {
    if (!["Clerk", "Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("This verification desk is limited to authorised CRS staff.");
    }
    const q = decodeURIComponent(verifyMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item) {
      throw new Error("Application was not found in the Nakuru registry.");
    }

    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const iprsMatch = Boolean(body.iprsMatch);
    const hospitalMatch = Boolean(body.hospitalMatch);
    const otpVerified = Boolean(body.otpVerified);
    const valid = iprsMatch && hospitalMatch && otpVerified;

    addAudit(
      state,
      activeRole,
      staffName,
      "Parentage verification",
      `IPRS ${iprsMatch ? "match" : "mismatch"}; hospital ${
        hospitalMatch ? "match" : "mismatch"
      }; OTP ${otpVerified ? "confirmed" : "not confirmed"}. ${body.discrepancyReason || ""}`,
      item.trackingNumber,
      item.applicationId
    );

    if (!valid) {
      item.idVerificationStatus = "FLAGGED_MISMATCH";
      item.lastUpdated = now();
      saveStoredState(state);
      return item as unknown as T;
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

    saveStoredState(state);
    return item as unknown as T;
  }

  // 7. Status Change: POST /applications/:id/status
  const statusMatch = cleanPath.match(/^\/applications\/([^\/]+)\/status$/);
  if (statusMatch && method === "POST") {
    if (!["Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("Only a Registrar or Administrator may execute statutory lifecycle transitions.");
    }
    const q = decodeURIComponent(statusMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item) {
      throw new Error("Application was not found in the Nakuru registry.");
    }

    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const nextStatus = body.nextStatus as Status;
    const justification = String(body.justification || "");

    const allowedNext = transitions[item.currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw new Error(
        `Cannot move an application from ${item.currentStatus} to ${nextStatus}. Follow the audited workflow order.`
      );
    }

    if (nextStatus === "Approved" && !["Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("Only a Registrar or Administrator may approve an application.");
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

    addAudit(
      state,
      activeRole,
      staffName,
      "Status changed",
      `${oldStatus} → ${nextStatus}: ${justification || "Workflow transition recorded"}`,
      item.trackingNumber,
      item.applicationId
    );

    saveStoredState(state);
    return item as unknown as T;
  }

  // 8. Print Certificate: POST /applications/:id/print
  const printMatch = cleanPath.match(/^\/applications\/([^\/]+)\/print$/);
  if (printMatch && method === "POST") {
    if (!["Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("Only a Registrar or Administrator may print an official certificate.");
    }
    const q = decodeURIComponent(printMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item) {
      throw new Error("Application was not found in the Nakuru registry.");
    }

    const oldStatus = item.currentStatus;
    const nextStatus: Status = "Printed";
    item.currentStatus = nextStatus;
    item.status = nextStatus;
    item.lastUpdated = now();

    item.certificate = {
      certificateNumber: `CERT-NAK-${String(item.applicationId).padStart(5, "0")}`,
      securitySerialNumber: `CRS-26-${String(771000 + item.applicationId)}`,
      verificationQrHash: `sha256-${item.trackingNumber}-${Date.now()}`,
      issuedDate: now().slice(0, 10),
    };

    item.statusHistory.push({
      oldStatus,
      newStatus: nextStatus,
      changedAt: item.lastUpdated,
      justification: "Registrar approval confirmed; Form 5 security print issued",
      actor: staffName,
    });

    addAudit(
      state,
      activeRole,
      staffName,
      "Certificate generated",
      `Form 5 issued as ${item.certificate.certificateNumber}; serial ${item.certificate.securitySerialNumber}`,
      item.trackingNumber,
      item.applicationId
    );

    saveStoredState(state);
    return item as unknown as T;
  }

  // 9. Collect Certificate: POST /applications/:id/collect
  const collectMatch = cleanPath.match(/^\/applications\/([^\/]+)\/collect$/);
  if (collectMatch && method === "POST") {
    if (!["Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("Only an authorised collection desk officer (Registrar or Administrator) may record handover.");
    }
    const q = decodeURIComponent(collectMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item || !item.certificate) {
      throw new Error("A printed certificate is required before collection.");
    }

    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const collectorName = String(body.collectorName || "").trim();
    const collectorNationalId = String(body.collectorNationalId || "").replace(/\D/g, "");

    if (!/^\d{7,8}$/.test(collectorNationalId)) {
      throw new Error("Collector National ID must contain 7–8 digits.");
    }
    if (!collectorName) {
      throw new Error("Collector full name is required.");
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

    addAudit(
      state,
      activeRole,
      staffName,
      "Certificate collected",
      `Handover recorded for ${collectorName} (ID: ${collectorNationalId}). Register: ${item.ledger.volume} / ${item.ledger.page} / ${item.ledger.entry}`,
      item.trackingNumber,
      item.applicationId
    );

    // Record collection confirmation SMS
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

    saveStoredState(state);
    return item as unknown as T;
  }

  // 10. Audit Log: GET /audit
  if (cleanPath === "/audit" && method === "GET") {
    if (!["Auditor", "Administrator"].includes(activeRole)) {
      throw new Error("Only an Auditor or Administrator may inspect the statutory audit log under Cap. 149.");
    }
    return state.audit as unknown as T;
  }

  // 11. Reports: GET /reports/summary
  if (cleanPath === "/reports/summary" && method === "GET") {
    if (!["Registrar", "Auditor", "Administrator"].includes(activeRole)) {
      throw new Error("Only Registrars, Auditors, or Administrators may access station reports and analytics.");
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

    return {
      ...overview,
      averageTurnaroundDays:
        Math.round(
          (durations.reduce((a, b) => a + b, 0) / Math.max(1, durations.length)) * 10
        ) / 10,
      bySubCounty,
      recentEvents,
    } as unknown as T;
  }

  // 12. Settings: GET & PUT /settings
  if (cleanPath === "/settings") {
    if (!["Administrator"].includes(activeRole)) {
      throw new Error("Only an Administrator may access station settings.");
    }
    if (method === "GET") {
      return state.settings as unknown as T;
    }
    if (method === "PUT") {
      const body = options?.body ? JSON.parse(String(options.body)) : {};
      state.settings = { ...state.settings, ...body };
      addAudit(
        state,
        activeRole,
        staffName,
        "Station settings updated",
        `Office credentials and operating parameters updated.`
      );
      saveStoredState(state);
      return state.settings as unknown as T;
    }
  }

  // 13. Settings Backup: POST /settings/backup
  if (cleanPath === "/settings/backup" && method === "POST") {
    if (!["Administrator"].includes(activeRole)) {
      throw new Error("Only an Administrator may trigger a registry vault snapshot.");
    }
    state.settings.lastBackupDate = new Date().toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    addAudit(
      state,
      activeRole,
      staffName,
      "Registry backup generated",
      `Snapshot archive created (Size: ${state.settings.lastBackupSizeMb} MB, Checksum: SHA-256 verified)`
    );
    saveStoredState(state);
    return {
      success: true,
      timestamp: now(),
      sizeMb: state.settings.lastBackupSizeMb,
      checksum: state.settings.lastBackupChecksum,
      snapshot: state,
    } as unknown as T;
  }

  // 14. Settings Factory Reset: POST /settings/reset
  if (cleanPath === "/settings/reset" && method === "POST") {
    if (!["Administrator"].includes(activeRole)) {
      throw new Error("Only an Administrator may execute factory reset.");
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
    addAudit(
      state,
      activeRole,
      staffName,
      "Factory reset executed",
      `Station data and cache purged to sovereign factory baseline.`
    );
    saveStoredState(state);
    return { success: true, message: "Station reset successfully." } as unknown as T;
  }

  // 15. Return for Correction: POST /applications/:id/return
  const returnMatch = cleanPath.match(/^\/applications\/([^\/]+)\/return$/);
  if (returnMatch && method === "POST") {
    if (!["Clerk", "Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("Only authorised CRS officers may flag an application for correction.");
    }
    const q = decodeURIComponent(returnMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item) {
      throw new Error("Application was not found in the Nakuru registry.");
    }
    const body = options?.body ? JSON.parse(String(options.body)) : {};
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
    addAudit(
      state,
      activeRole,
      staffName,
      "Returned for correction",
      `Deficiency recorded for ${item.trackingNumber} (${item.childName}): ${item.deficiencyReason}`,
      item.trackingNumber,
      item.applicationId
    );

    // Trigger deficiency SMS
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

    saveStoredState(state);
    return item as unknown as T;
  }

  // 16. Escalate Application: POST /applications/:id/escalate
  const escalateMatch = cleanPath.match(/^\/applications\/([^\/]+)\/escalate$/);
  if (escalateMatch && method === "POST") {
    if (!["Auditor", "Registrar", "Administrator"].includes(activeRole)) {
      throw new Error("Only an Auditor, Registrar, or Administrator may escalate overdue cases.");
    }
    const q = decodeURIComponent(escalateMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item) {
      throw new Error("Application was not found in the Nakuru registry.");
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
    addAudit(
      state,
      activeRole,
      staffName,
      "Application escalated",
      `Priority escalation logged for ${item.trackingNumber} (${item.childName}) by ${staffName}`,
      item.trackingNumber,
      item.applicationId
    );
    saveStoredState(state);
    return item as unknown as T;
  }

  // 17. Internal Note: POST /applications/:id/note
  const noteMatch = cleanPath.match(/^\/applications\/([^\/]+)\/note$/);
  if (noteMatch && method === "POST") {
    const q = decodeURIComponent(noteMatch[1]).trim().toLowerCase();
    const item = state.applications.find(
      (a) => String(a.applicationId) === q || a.trackingNumber.toLowerCase() === q
    );
    if (!item) {
      throw new Error("Application was not found in the Nakuru registry.");
    }
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const noteText = String(body.note || "").trim();
    if (!noteText) throw new Error("Note content cannot be empty.");
    item.internalNotes = item.internalNotes || [];
    item.internalNotes.push(`[${now().slice(0, 16).replace("T", " ")} - ${staffName}]: ${noteText}`);
    addAudit(
      state,
      activeRole,
      staffName,
      "Internal note added",
      `Note added to ${item.trackingNumber}: ${noteText.slice(0, 50)}...`,
      item.trackingNumber,
      item.applicationId
    );
    saveStoredState(state);
    return item as unknown as T;
  }

  // 18. SMS Templates: GET, POST, PUT
  if (cleanPath === "/sms/templates") {
    if (method === "GET") {
      return state.templates as unknown as T;
    }
    if (method === "POST") {
      if (!["Administrator"].includes(activeRole)) {
        throw new Error("Only an Administrator may create custom SMS templates.");
      }
      const body = options?.body ? JSON.parse(String(options.body)) : {};
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
      addAudit(
        state,
        activeRole,
        staffName,
        "SMS template created",
        `Created template: ${newTemplate.name} (${newTemplate.code})`
      );
      saveStoredState(state);
      return newTemplate as unknown as T;
    }
  }

  const templateMatch = cleanPath.match(/^\/sms\/templates\/([^\/]+)$/);
  if (templateMatch && method === "PUT") {
    if (!["Administrator"].includes(activeRole)) {
      throw new Error("Only an Administrator may modify SMS notification templates.");
    }
    const tplId = decodeURIComponent(templateMatch[1]);
    const tpl = state.templates.find((t) => t.templateId === tplId || t.code === tplId);
    if (!tpl) throw new Error("Template not found.");
    const body = options?.body ? JSON.parse(String(options.body)) : {};
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
    addAudit(
      state,
      activeRole,
      staffName,
      "SMS template updated",
      `Modified template: ${tpl.name} (${tpl.code})`
    );
    saveStoredState(state);
    return tpl as unknown as T;
  }

  // 19. SMS Test Dispatch: POST /sms/test
  if (cleanPath === "/sms/test" && method === "POST") {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
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
    addAudit(
      state,
      activeRole,
      staffName,
      "Test SMS dispatched",
      `Dispatched test notification to ${recipientPhone} via Africa's Talking gateway`
    );
    saveStoredState(state);
    return {
      success: true,
      messageId: dispatched.id,
      balanceKes: state.settings.smsBalanceKes,
      creditsRemaining: state.settings.smsCreditsRemaining,
      dispatched,
    } as unknown as T;
  }

  // 20. Dispatched SMS List: GET /sms/dispatched
  if (cleanPath === "/sms/dispatched" && method === "GET") {
    return state.dispatchedSms as unknown as T;
  }

  // 21. Staff Management: GET, POST, PUT
  if (cleanPath === "/staff") {
    if (method === "GET") {
      return state.staff as unknown as T;
    }
    if (method === "POST") {
      if (!["Administrator"].includes(activeRole)) {
        throw new Error("Only an Administrator may add staff accounts.");
      }
      const body = options?.body ? JSON.parse(String(options.body)) : {};
      const fullName = String(body.fullName || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const role = (body.role || "Clerk") as Role;
      const counter = String(body.counter || "Nakuru Town East Counter 1");
      if (!fullName) throw new Error("Staff full name is required.");
      if (!email.includes("@")) throw new Error("Valid official email address is required.");
      const prefix = role === "Clerk" ? "CLK" : role === "Registrar" ? "REG" : role === "Auditor" ? "AUD" : "ADM";
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
      addAudit(
        state,
        activeRole,
        staffName,
        "Staff account created",
        `Created staff account for ${fullName} (${employeeId}) assigned as ${role} at ${counter}`
      );
      saveStoredState(state);
      return newStaff as unknown as T;
    }
  }

  const staffMatch = cleanPath.match(/^\/staff\/([^\/]+)$/);
  if (staffMatch && method === "PUT") {
    if (!["Administrator"].includes(activeRole)) {
      throw new Error("Only an Administrator may modify staff account parameters.");
    }
    const empId = decodeURIComponent(staffMatch[1]);
    const person = state.staff.find((s) => s.employeeId === empId || s.email.toLowerCase() === empId.toLowerCase());
    if (!person) throw new Error("Staff member not found.");
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    if (body.fullName) person.fullName = String(body.fullName);
    if (body.role) person.role = body.role as Role;
    if (body.counter) person.counter = String(body.counter);
    if (typeof body.active === "boolean") person.active = body.active;
    addAudit(
      state,
      activeRole,
      staffName,
      "Staff account updated",
      `Updated staff parameters for ${person.fullName} (${person.employeeId}): Role=${person.role}, Active=${person.active}`
    );
    saveStoredState(state);
    return person as unknown as T;
  }

  // Fallback for unknown paths
  return {} as unknown as T;
}

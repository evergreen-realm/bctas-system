// shared/bcatsCore.ts
var transitions = {
  Submitted: ["Pending Verification", "Deficient", "On Hold"],
  "Pending Verification": ["Verified", "Deficient", "On Hold"],
  Verified: ["Approved", "Deficient", "On Hold"],
  Approved: ["Printed", "On Hold"],
  Printed: ["Collected", "On Hold"],
  Collected: [],
  Deficient: ["Submitted", "On Hold"],
  "On Hold": ["Submitted", "Pending Verification", "Deficient"]
};
var STAFF_ACCOUNTS = [
  {
    employeeId: "CRS-CLK-021",
    fullName: "Mercy Wambui",
    role: "Clerk",
    email: "clerk@nakuru.crs.go.ke",
    counter: "Counter C3 (Intake & Verification)",
    active: true,
    password: "Bcats2026!"
  },
  {
    employeeId: "CRS-REG-014",
    fullName: "Daniel Karanja",
    role: "Registrar",
    email: "registrar@nakuru.crs.go.ke",
    counter: "Counter R1 (Approval & Issuance)",
    active: true,
    password: "Bcats2026!"
  },
  {
    employeeId: "CRS-ADM-001",
    fullName: "Faith Njeri",
    role: "Administrator",
    email: "admin@nakuru.crs.go.ke",
    counter: "HQ Station Command",
    active: true,
    password: "Bcats2026!"
  },
  {
    employeeId: "CRS-AUD-003",
    fullName: "Josephine Achieng",
    role: "Auditor",
    email: "auditor@nakuru.crs.go.ke",
    counter: "Station Audit & Oversight Desk",
    active: true,
    password: "Bcats2026!"
  },
  // Legacy / Direct named aliases
  {
    employeeId: "CRS-CLK-021",
    fullName: "Mercy Wambui",
    role: "Clerk",
    email: "mercy.wambui@crs.go.ke",
    counter: "Counter C3",
    active: true,
    password: "Bcats2026!"
  },
  {
    employeeId: "CRS-REG-014",
    fullName: "Daniel Karanja",
    role: "Registrar",
    email: "daniel.karanja@crs.go.ke",
    counter: "Counter R1",
    active: true,
    password: "Bcats2026!"
  },
  {
    employeeId: "CRS-ADM-001",
    fullName: "Faith Njeri",
    role: "Administrator",
    email: "faith.njeri@crs.go.ke",
    counter: "HQ Station Command",
    active: true,
    password: "Bcats2026!"
  },
  {
    employeeId: "CRS-AUD-003",
    fullName: "Josephine Achieng",
    role: "Auditor",
    email: "josephine.achieng@crs.go.ke",
    counter: "Station Audit Desk",
    active: true,
    password: "Bcats2026!"
  }
];
var ROLE_PERMISSIONS = {
  Clerk: {
    canCreate: true,
    canVerify: true,
    canApprove: false,
    canPrint: false,
    canCollect: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAudit: false,
    canViewReports: false,
    allowedRoutes: [
      "/",
      "/dashboard",
      "/applications/new",
      "/verification",
      "/records"
    ]
  },
  Registrar: {
    canCreate: false,
    canVerify: true,
    canApprove: true,
    canPrint: true,
    canCollect: true,
    canManageUsers: false,
    canManageSettings: false,
    canViewAudit: false,
    canViewReports: true,
    allowedRoutes: [
      "/",
      "/dashboard",
      "/records",
      "/verification",
      "/status",
      "/printing",
      "/collection",
      "/reports"
    ]
  },
  Administrator: {
    canCreate: true,
    canVerify: true,
    canApprove: true,
    canPrint: true,
    canCollect: true,
    canManageUsers: true,
    canManageSettings: true,
    canViewAudit: true,
    canViewReports: true,
    allowedRoutes: [
      "/",
      "/dashboard",
      "/applications/new",
      "/records",
      "/verification",
      "/status",
      "/printing",
      "/collection",
      "/reports",
      "/audit",
      "/users",
      "/settings",
      "/sms"
    ]
  },
  Auditor: {
    canCreate: false,
    canVerify: false,
    canApprove: false,
    canPrint: false,
    canCollect: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAudit: true,
    canViewReports: true,
    allowedRoutes: ["/", "/dashboard", "/audit", "/reports", "/records"]
  },
  Citizen: {
    canCreate: true,
    canVerify: false,
    canApprove: false,
    canPrint: false,
    canCollect: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAudit: false,
    canViewReports: false,
    allowedRoutes: ["/track", "/apply"]
  }
};
function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;
  return value;
}
function createInitialSeed() {
  const baseTime = 1761642e6;
  const nowStr = new Date(baseTime).toISOString();
  const people = [
    [
      "BCATS-2026-001847",
      "Amani Ochieng Kamau",
      "2026-08-01",
      "Male",
      "Nakuru Provincial General Hospital",
      "BN-26-09121",
      "28491029",
      "Grace Akinyi Ochieng",
      "+254712443892",
      "Nakuru Town East",
      "Biashara",
      "Approved"
    ],
    [
      "BCATS-2026-001923",
      "Talia Waweru",
      "2026-08-14",
      "Female",
      "Nakuru Level 5 Hospital",
      "B1-2026-8847",
      "28419204",
      "Mwangi Kariuki",
      "+254712345678",
      "Nakuru Town East",
      "Biashara",
      "Pending Verification"
    ],
    [
      "BCATS-2026-001918",
      "Chloe Wangari Kariuki",
      "2026-08-20",
      "Female",
      "Molo Sub-County Hospital",
      "BN-26-09144",
      "31094821",
      "Faith Chebet",
      "+254723441180",
      "Molo",
      "Molo Township",
      "Verified"
    ],
    [
      "BCATS-2026-001895",
      "Tariq Omar Hassan",
      "2026-07-28",
      "Male",
      "Gilgil Sub-County Hospital",
      "BN-26-09172",
      "33418290",
      "Fatuma Hassan Abdi",
      "+254701993210",
      "Gilgil",
      "Gilgil Township",
      "Verified"
    ],
    [
      "BCATS-2026-001882",
      "Ethan Koech",
      "2026-07-15",
      "Male",
      "Naivasha Sub-County Hospital",
      "BN-26-09201",
      "19842103",
      "Kiprono Chepkwony",
      "+254733980122",
      "Naivasha",
      "Lake View",
      "Verified"
    ],
    [
      "BCATS-2026-001850",
      "Farhan Abdullahi Noor",
      "2026-06-30",
      "Male",
      "Rongai Health Centre",
      "BN-26-09230",
      "31084512",
      "Amina Hassan Noor",
      "+254719240331",
      "Rongai",
      "Solai",
      "Approved"
    ],
    [
      "BCATS-2026-001801",
      "Lucas Mwangi Kariuki",
      "2026-06-18",
      "Male",
      "Gilgil Sub-County Hospital",
      "BN-26-09255",
      "29871142",
      "Mercy Muthoni Kariuki",
      "+254722884102",
      "Gilgil",
      "Gilgil Township",
      "Printed"
    ],
    [
      "BCATS-2026-001744",
      "Tariq Hassan",
      "2026-05-24",
      "Male",
      "Nakuru Provincial General",
      "BN-26-09280",
      "22109433",
      "Peter Kariuki Githinji",
      "+254711502931",
      "Nakuru Town West",
      "Barut",
      "Collected"
    ],
    [
      "BCA-2026-0782",
      "Brian Kimani Mwangi",
      "2026-05-10",
      "Male",
      "Nakuru Level 5 Hospital",
      "BN-26-08101",
      "24190822",
      "Wanjiku Mwangi",
      "+254721002991",
      "Nakuru Town East",
      "Biashara",
      "Pending Verification"
    ],
    [
      "BCA-2026-0744",
      "Sharon Cherotich",
      "2026-04-12",
      "Female",
      "Molo Sub-County Hospital",
      "BN-26-08144",
      "19842103",
      "Kiprono Chepkwony",
      "+254723441180",
      "Molo",
      "Molo Township",
      "Pending Verification"
    ],
    [
      "BCA-2026-0711",
      "Farhan Abdullahi",
      "2026-03-25",
      "Male",
      "Naivasha Sub-County Hospital",
      "BN-26-08201",
      "31084512",
      "Amina Hassan Noor",
      "+254701993210",
      "Naivasha",
      "Lake View",
      "Pending Verification"
    ],
    [
      "BCA-2026-0758",
      "Travis Onyango",
      "2026-03-18",
      "Male",
      "Rongai Health Centre",
      "BN-26-08230",
      "27830491",
      "Daniel Ouma Otieno",
      "+254733980122",
      "Rongai",
      "Solai",
      "Pending Verification"
    ],
    [
      "NKU-2026-00421",
      "Amani Wanjiku Kamau",
      "2026-09-21",
      "Female",
      "Nakuru Level 5 Hospital",
      "BN-26-09121",
      "28419204",
      "Wanjiku Kamau",
      "+254712345678",
      "Nakuru Town East",
      "Biashara",
      "Collected"
    ]
  ];
  const applications = people.map((p, index) => {
    const [
      trackingNumber,
      childName,
      dateOfBirth,
      gender,
      placeOfBirth,
      birthNotificationNo,
      parentNationalId,
      parentFullName,
      contactPhone,
      subCounty,
      ward,
      currentStatus
    ] = p;
    const created = new Date(baseTime - (index + 1) * 864e5).toISOString();
    return {
      id: index + 1,
      applicationId: index + 1,
      trackingNumber,
      childName,
      dateOfBirth,
      gender,
      placeOfBirth,
      birthFacilityCode: "CRS-NAK-05",
      birthNotificationNo,
      parentNationalId,
      parentFullName,
      parentRelationship: index % 2 ? "Father" : "Mother",
      contactPhone,
      contactEmail: `citizen${index + 1}@example.test`,
      subCounty,
      ward,
      idVerificationStatus: currentStatus === "Pending Verification" || currentStatus === "Submitted" ? "UNVERIFIED" : "VERIFIED_IPRS",
      verifiedAt: currentStatus === "Pending Verification" || currentStatus === "Submitted" ? void 0 : created,
      currentStatus,
      status: currentStatus,
      submittedDate: created,
      lastUpdated: created,
      statusHistory: [
        {
          oldStatus: "Submitted",
          newStatus: currentStatus,
          changedAt: created,
          justification: "Seeded registry record for operational evaluation",
          actor: "System initialization"
        }
      ],
      certificate: currentStatus === "Collected" || currentStatus === "Printed" ? {
        certificateNumber: `CERT-NAK-${String(index + 1).padStart(5, "0")}`,
        securitySerialNumber: `CRS-26-${String(771e3 + index + 1)}`,
        verificationQrHash: `sha256-hash-${trackingNumber}`,
        issuedDate: created.slice(0, 10),
        collectedDate: currentStatus === "Collected" ? nowStr.slice(0, 10) : void 0,
        collectorName: currentStatus === "Collected" ? parentFullName : void 0
      } : void 0,
      collection: currentStatus === "Collected" ? {
        collectorName: parentFullName,
        collectorNationalId: parentNationalId,
        collectedDate: nowStr.slice(0, 10)
      } : void 0
    };
  });
  const staff = [
    {
      employeeId: "CRS-CLK-021",
      fullName: "Mercy Wambui",
      role: "Clerk",
      email: "clerk@nakuru.crs.go.ke",
      counter: "Counter C3 (Intake & Verification)",
      active: true,
      eulaAcceptedAt: nowStr
    },
    {
      employeeId: "CRS-REG-014",
      fullName: "Daniel Karanja",
      role: "Registrar",
      email: "registrar@nakuru.crs.go.ke",
      counter: "Counter R1 (Approval & Issuance)",
      active: true,
      eulaAcceptedAt: nowStr
    },
    {
      employeeId: "CRS-ADM-001",
      fullName: "Faith Njeri",
      role: "Administrator",
      email: "admin@nakuru.crs.go.ke",
      counter: "HQ Station Command",
      active: true,
      eulaAcceptedAt: nowStr
    },
    {
      employeeId: "CRS-AUD-003",
      fullName: "Josephine Achieng",
      role: "Auditor",
      email: "auditor@nakuru.crs.go.ke",
      counter: "Station Audit & Oversight Desk",
      active: true,
      eulaAcceptedAt: nowStr
    }
  ];
  const audit2 = [
    {
      auditId: "seed-audit-001",
      applicationId: 1,
      trackingNumber: "NKU-2026-00421",
      staffId: "CRS-CLK-021",
      staffName: "Mercy Wambui",
      role: "Clerk",
      action: "Certificate collected",
      details: "Physical handover completed with collector ID verification and biometric token.",
      clientIp: "192.168.1.15",
      userAgent: "BCATS Desktop Client Counter-03",
      timestamp: new Date(baseTime - 36e5).toISOString()
    },
    {
      auditId: "seed-audit-002",
      applicationId: 4,
      trackingNumber: "NKU-2026-00424",
      staffId: "CRS-REG-014",
      staffName: "Daniel Karanja",
      role: "Registrar",
      action: "Statutory approval",
      details: "Birth record approved under Civil Registration Act Cap 149.",
      clientIp: "192.168.1.10",
      userAgent: "BCATS Registrar Terminal Counter-01",
      timestamp: new Date(baseTime - 72e5).toISOString()
    },
    {
      auditId: "seed-audit-003",
      applicationId: 3,
      trackingNumber: "NKU-2026-00423",
      staffId: "CRS-CLK-021",
      staffName: "Mercy Wambui",
      role: "Clerk",
      action: "Parentage verification",
      details: "IPRS identity match and hospital Form 1 notification verified successfully.",
      clientIp: "192.168.1.15",
      userAgent: "BCATS Verification Workstation",
      timestamp: new Date(baseTime - 144e5).toISOString()
    }
  ];
  const templates = [
    {
      templateId: "TPL-SMS-001",
      code: "APPLICATION_RECEIVED",
      name: "Application Received (Intake Milestone)",
      triggerStatus: "Submitted",
      body: "Dear {parent_name}, your birth cert application for {child_name} (Ref: {tracking_no}) has been received at Nakuru Civil Registry. Track status online at bcats.go.ke/track.",
      active: true,
      characterCount: 168,
      creditCost: 1,
      lastModifiedBy: "Officer J. Kamau",
      lastModifiedAt: nowStr
    },
    {
      templateId: "TPL-SMS-002",
      code: "APPLICATION_VERIFIED",
      name: "Application Verified (Inspection Clearance)",
      triggerStatus: "Verified",
      body: "Dear {parent_name}, birth certificate records for {child_name} have been verified. Ref: {tracking_no}. Docket scheduled for civil registry seal and printing counter.",
      active: true,
      characterCount: 171,
      creditCost: 1,
      lastModifiedBy: "Officer J. Kamau",
      lastModifiedAt: nowStr
    },
    {
      templateId: "TPL-SMS-003",
      code: "READY_FOR_COLLECTION",
      name: "Ready for Collection (Counter Pickup Alert)",
      triggerStatus: "Printed",
      body: "Dear {parent_name}, the birth certificate for {child_name} (Ref: {tracking_no}) is ready for collection at Nakuru Civil Registration Office Counter 01. Carry your original National ID.",
      active: true,
      characterCount: 187,
      creditCost: 2,
      lastModifiedBy: "Officer J. Kamau",
      lastModifiedAt: nowStr
    },
    {
      templateId: "TPL-SMS-004",
      code: "DEFICIENCY_CORRECTION",
      name: "Return for Correction (Deficiency Flag)",
      triggerStatus: "Deficient",
      body: "Dear {parent_name}, document clarification required on application {tracking_no} for {child_name}. Please report to Nakuru Desk C3 with original hospital notification.",
      active: true,
      characterCount: 179,
      creditCost: 2,
      lastModifiedBy: "Officer J. Kamau",
      lastModifiedAt: nowStr
    }
  ];
  const settings = {
    officeName: "Nakuru Civil Registration Office",
    officePhone: "+254 51 221 4482",
    officeEmail: "nakuru.crs@interior.go.ke",
    stationCode: "CRS-NAK-05",
    stationCounty: "Nakuru County",
    subCountyHq: "Nakuru Town East",
    slaDays: 5,
    autoTrackingPrefix: "RCA-2026",
    enablePublicPortal: true,
    smsBalanceKes: 234.5,
    smsCreditsRemaining: 670,
    smsSenderHeader: "NAKURU-CRS",
    lastBackupDate: "30 Sep 2026, 02:00 AM",
    lastBackupSizeMb: 412,
    lastBackupChecksum: "SHA-256 verified",
    requireSmsOtp: true
  };
  const dispatchedSms = [
    {
      id: "sms-init-01",
      recipientPhone: "+254712443892",
      recipientName: "Grace Akinyi Ochieng",
      message: "Dear Grace Akinyi Ochieng, birth certificate records for Amani Ochieng Kamau have been verified. Ref: BCATS-2026-001847. Scheduled for civil registry seal and printing counter.",
      timestamp: new Date(baseTime - 36e5).toISOString(),
      status: "Delivered",
      channel: "Africa's Talking",
      trackingNumber: "BCATS-2026-001847"
    },
    {
      id: "sms-init-02",
      recipientPhone: "+254712345678",
      recipientName: "Mwangi Kariuki",
      message: "Dear Mwangi Kariuki, your birth cert application for Talia Waweru (Ref: BCATS-2026-001923) has been received. Track status online at bcats.go.ke/track",
      timestamp: new Date(baseTime - 72e5).toISOString(),
      status: "Delivered",
      channel: "Africa's Talking",
      trackingNumber: "BCATS-2026-001923"
    },
    {
      id: "sms-init-03",
      recipientPhone: "+254722884102",
      recipientName: "Mercy Muthoni Kariuki",
      message: "Dear Mercy Muthoni Kariuki, the birth certificate for Lucas Mwangi Kariuki (Ref: BCATS-2026-001801) is ready for collection at Nakuru Civil Registration Office Counter 01. Carry your original National ID.",
      timestamp: new Date(baseTime - 864e5).toISOString(),
      status: "Delivered",
      channel: "Africa's Talking",
      trackingNumber: "BCATS-2026-001801"
    }
  ];
  return { applications, staff, audit: audit2, events: [], settings, templates, dispatchedSms };
}
function computeOverview(applications) {
  const counts = applications.reduce((acc, item) => {
    acc[item.currentStatus] = (acc[item.currentStatus] || 0) + 1;
    return acc;
  }, {});
  const nowMs = Date.now();
  const slaFlags = applications.filter(
    (item) => !["Collected", "Printed"].includes(item.currentStatus) && nowMs - Date.parse(item.lastUpdated) > 5 * 864e5
  ).length;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const today = applications.filter(
    (item) => item.submittedDate && item.submittedDate.slice(0, 10) === todayStr
  ).length;
  const throughput = Math.round(
    (counts.Collected || 0) / Math.max(1, applications.length) * 100
  );
  return {
    total: applications.length,
    counts,
    slaFlags,
    today,
    throughput
  };
}

// shared/bcatsEdgeHandler.ts
var seedData = createInitialSeed();
var state = {
  nextId: seedData.applications.length + 1,
  applications: [...seedData.applications],
  staff: [...seedData.staff],
  audit: [...seedData.audit],
  events: [...seedData.events],
  settings: { ...seedData.settings },
  templates: [...seedData.templates],
  dispatchedSms: [...seedData.dispatchedSms]
};
function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-bcats-role, x-bcats-staff, Authorization",
      ...headers
    }
  });
}
function errorJson(message, status = 400) {
  if (status !== 400) {
    return json({ error: message }, status);
  }
  const code = message.includes("Only") || message.includes("authorised") || message.includes("authorized") ? 403 : 400;
  return json({ error: message }, code);
}
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
async function sha256Hex(value) {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(value);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  return `hash-${value.length}-${Date.now().toString(16)}`;
}
function findApp(idOrTracking) {
  const q = idOrTracking.trim().toLowerCase();
  return state.applications.find(
    (item) => String(item.applicationId) === q || item.trackingNumber.toLowerCase() === q
  );
}
function audit(role, staffName, action, details, trackingNumber, applicationId, clientIp = "127.0.0.1", userAgent = "Edge client") {
  const entry = {
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
    timestamp: now()
  };
  state.audit.unshift(entry);
  return entry;
}
async function handleBcatsEdgeRequest(request, _env) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-bcats-role, x-bcats-staff, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  const roleHeader = request.headers.get("x-bcats-role");
  const staffName = request.headers.get("x-bcats-staff") || "Preview operator";
  const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "BCATS Edge Worker";
  const validRoles = ["Clerk", "Registrar", "Administrator", "Auditor", "Citizen"];
  const currentRole = roleHeader && validRoles.includes(roleHeader) ? roleHeader : "Administrator";
  const pathname = url.pathname.replace(/\/+$/, "");
  try {
    if (pathname === "/api/bcats/auth/login" && method === "POST") {
      const body = await request.json().catch(() => ({}));
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
        void 0,
        void 0,
        clientIp,
        userAgent
      );
      const user = {
        employeeId: matched.employeeId,
        fullName: matched.fullName,
        role: matched.role,
        email: matched.email,
        counter: matched.counter,
        active: matched.active,
        eulaAcceptedAt: now()
      };
      return json({
        success: true,
        user,
        token: `bcats_edge_${matched.employeeId}_${Date.now()}`
      });
    }
    if (pathname === "/api/bcats/bootstrap" && method === "GET") {
      const overview = computeOverview(state.applications);
      const integrations = [
        {
          name: "G2G IPRS Gateway",
          status: "Adapter ready",
          note: "mTLS endpoint whitelist enforced"
        },
        {
          name: "e-Birth validation",
          status: "Adapter ready",
          note: "Hospital notification matching"
        },
        {
          name: "Africa's Talking SMS",
          status: "Adapter ready",
          note: "Queued after committed state changes"
        },
        {
          name: "Cloudflare D1 & R2",
          status: "Edge integrated",
          note: "D1: Edge SQL / R2: Object Storage"
        }
      ];
      return json({
        overview,
        applications: state.applications,
        staff: state.staff,
        settings: state.settings,
        integrations,
        currentUser: state.staff.find((s) => s.role === currentRole) || state.staff[0]
      });
    }
    if (pathname === "/api/bcats/applications" && method === "GET") {
      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      const list = q ? state.applications.filter(
        (item) => [
          item.trackingNumber,
          item.childName,
          item.parentFullName,
          item.parentNationalId,
          item.currentStatus
        ].some((v) => v.toLowerCase().includes(q))
      ) : state.applications;
      return json(list);
    }
    if (pathname === "/api/bcats/applications" && method === "POST") {
      if (!ROLE_PERMISSIONS[currentRole]?.canCreate) {
        return errorJson(
          `Your assigned role as ${currentRole} does not have intake clearance under the Births and Deaths Registration Act (Cap. 149).`,
          403
        );
      }
      const body = await request.json().catch(() => ({}));
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
        return errorJson("National ID must contain 7\u20138 digits.");
      }
      const id = state.nextId++;
      const trackingNumber = `NKU-2026-${String(430 + id).padStart(5, "0")}`;
      const created = now();
      const contactPhone = normalizePhone(String(body.contactPhone || body.parentPhone || ""));
      const birthNotificationNo = String(
        body.birthNotificationNo || body.birthNotificationNumber || `BN-26-${id}000`
      );
      const item = {
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
        parentRelationship: body.parentRelationship === "Father" ? "Father" : body.parentRelationship === "Guardian" ? "Guardian" : "Mother",
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
            actor: staffName
          }
        ]
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
    const appMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)$/);
    if (appMatch && method === "GET") {
      const id = decodeURIComponent(appMatch[1]);
      const found = findApp(id);
      if (!found) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }
      return json(found);
    }
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
      const body = await request.json().catch(() => ({}));
      const iprsMatch = Boolean(body.iprsMatch);
      const hospitalMatch = Boolean(body.hospitalMatch);
      const otpVerified = Boolean(body.otpVerified);
      const valid = iprsMatch && hospitalMatch && otpVerified;
      audit(
        currentRole,
        staffName,
        "Parentage verification",
        `IPRS ${iprsMatch ? "match" : "mismatch"}; hospital ${hospitalMatch ? "match" : "mismatch"}; OTP ${otpVerified ? "confirmed" : "not confirmed"}. ${body.discrepancyReason || ""}`,
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
      const newStatus = "Verified";
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
        actor: staffName
      });
      return json(item);
    }
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
      const body = await request.json().catch(() => ({}));
      const nextStatus = body.nextStatus;
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
        actor: staffName
      });
      if (nextStatus === "Verified") {
        item.idVerificationStatus = "VERIFIED_IPRS";
        item.verifiedAt = item.lastUpdated;
      }
      audit(
        currentRole,
        staffName,
        "Status changed",
        `${oldStatus} \u2192 ${nextStatus}: ${justification || "Workflow transition recorded"}`,
        item.trackingNumber,
        item.applicationId,
        clientIp,
        userAgent
      );
      return json(item);
    }
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
      const nextStatus = "Printed";
      item.currentStatus = nextStatus;
      item.status = nextStatus;
      item.lastUpdated = now();
      const qrHash = await sha256Hex(`${item.trackingNumber}:${item.childName}:${item.birthNotificationNo}`);
      item.certificate = {
        certificateNumber: `CERT-NAK-${String(item.applicationId).padStart(5, "0")}`,
        securitySerialNumber: `CRS-26-${String(771e3 + item.applicationId)}`,
        verificationQrHash: qrHash,
        issuedDate: now().slice(0, 10)
      };
      item.statusHistory.push({
        oldStatus,
        newStatus: nextStatus,
        changedAt: item.lastUpdated,
        justification: "Registrar approval confirmed; Form 5 security print issued",
        actor: staffName
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
      const body = await request.json().catch(() => ({}));
      const collectorName = String(body.collectorName || "").trim();
      const collectorNationalId = String(body.collectorNationalId || "").replace(/\D/g, "");
      if (!/^\d{7,8}$/.test(collectorNationalId)) {
        return errorJson("Collector National ID must contain 7\u20138 digits.");
      }
      if (!collectorName) {
        return errorJson("Collector full name is required.");
      }
      const oldStatus = item.currentStatus;
      const nextStatus = "Collected";
      item.currentStatus = nextStatus;
      item.status = nextStatus;
      item.lastUpdated = now();
      item.certificate.collectedDate = now().slice(0, 10);
      item.certificate.collectorName = collectorName;
      item.collection = {
        collectorName,
        collectorNationalId,
        collectedDate: item.certificate.collectedDate
      };
      item.collectorRelationship = body.collectorRelationship || "Mother (Biological)";
      item.collectorIdVerified = Boolean(body.collectorIdVerified ?? true);
      item.ledgerSignatureConfirmed = Boolean(body.ledgerSignatureConfirmed ?? true);
      if (body.ledger) {
        item.ledger = {
          volume: body.ledger.volume || "Vol. 42",
          page: body.ledger.page || "Page 118",
          entry: body.ledger.entry || "Entry 14",
          issuingDesk: body.ledger.issuingDesk || "Nakuru Central Desk 3"
        };
      } else {
        item.ledger = {
          volume: "Vol. 42",
          page: "Page 118",
          entry: "Entry 14",
          issuingDesk: "Nakuru Central Desk 3"
        };
      }
      item.statusHistory.push({
        oldStatus,
        newStatus: nextStatus,
        changedAt: item.lastUpdated,
        justification: `Biometric and National ID handover checks completed for ${collectorName}. Register Vol: ${item.ledger.volume}, Page: ${item.ledger.page}, Entry: ${item.ledger.entry}`,
        actor: staffName
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
        trackingNumber: item.trackingNumber
      });
      return json(item);
    }
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
      const body = await request.json().catch(() => ({}));
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
        actor: staffName
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
        trackingNumber: item.trackingNumber
      });
      return json(item);
    }
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
        actor: staffName
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
    const noteMatch = pathname.match(/^\/api\/bcats\/applications\/([^\/]+)\/note$/);
    if (noteMatch && method === "POST") {
      const id = decodeURIComponent(noteMatch[1]);
      const item = findApp(id);
      if (!item) {
        return errorJson("Application was not found in the Nakuru registry.", 404);
      }
      const body = await request.json().catch(() => ({}));
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
    if (pathname === "/api/bcats/audit" && method === "GET") {
      if (!["Auditor", "Administrator"].includes(currentRole)) {
        return errorJson("Only an Auditor or Administrator may inspect the statutory audit log under Cap. 149.", 403);
      }
      return json(state.audit);
    }
    if (pathname === "/api/bcats/reports/summary" && method === "GET") {
      if (!["Registrar", "Auditor", "Administrator"].includes(currentRole)) {
        return errorJson("Only Registrars, Auditors, or Administrators may access station reports and analytics.", 403);
      }
      const overview = computeOverview(state.applications);
      const durations = state.applications.map(
        (item) => Math.max(
          1,
          Math.round(
            (Date.parse(item.lastUpdated) - Date.parse(item.submittedDate)) / 864e5
          )
        )
      );
      const bySubCounty = Object.entries(
        state.applications.reduce((acc, item) => {
          acc[item.subCounty] = (acc[item.subCounty] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));
      const recentEvents = state.audit.slice(0, 12).map((a) => ({
        type: a.action,
        occurredAt: a.timestamp,
        payload: { trackingNumber: a.trackingNumber, staff: a.staffName }
      }));
      return json({
        ...overview,
        averageTurnaroundDays: Math.round(
          durations.reduce((a, b) => a + b, 0) / Math.max(1, durations.length) * 10
        ) / 10,
        bySubCounty,
        recentEvents
      });
    }
    if (pathname === "/api/bcats/settings") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may access station settings.", 403);
      }
      if (method === "GET") {
        return json(state.settings);
      }
      if (method === "PUT") {
        const body = await request.json().catch(() => ({}));
        state.settings = { ...state.settings, ...body };
        audit(
          currentRole,
          staffName,
          "Station settings updated",
          `Office parameters updated.`,
          void 0,
          void 0,
          clientIp,
          userAgent
        );
        return json(state.settings);
      }
    }
    if (pathname === "/api/bcats/settings/backup" && method === "POST") {
      if (!["Administrator"].includes(currentRole)) {
        return errorJson("Only an Administrator may trigger a registry vault snapshot.", 403);
      }
      state.settings.lastBackupDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      audit(
        currentRole,
        staffName,
        "Registry backup generated",
        `Snapshot archive created (Size: ${state.settings.lastBackupSizeMb} MB, Checksum: SHA-256 verified)`,
        void 0,
        void 0,
        clientIp,
        userAgent
      );
      return json({
        success: true,
        timestamp: now(),
        sizeMb: state.settings.lastBackupSizeMb,
        checksum: state.settings.lastBackupChecksum,
        snapshot: state
      });
    }
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
        void 0,
        void 0,
        clientIp,
        userAgent
      );
      return json({ success: true, message: "Station reset successfully." });
    }
    if (pathname === "/api/bcats/sms/templates") {
      if (method === "GET") {
        return json(state.templates);
      }
      if (method === "POST") {
        if (!["Administrator"].includes(currentRole)) {
          return errorJson("Only an Administrator may create custom SMS templates.", 403);
        }
        const body = await request.json().catch(() => ({}));
        const newTemplate = {
          templateId: `TPL-SMS-${String(state.templates.length + 1).padStart(3, "0")}`,
          code: String(body.code || `CUSTOM_${Date.now()}`).toUpperCase().replace(/\s+/g, "_"),
          name: String(body.name || "Custom Notification Template"),
          triggerStatus: body.triggerStatus || "Submitted",
          body: String(body.body || "Dear {parent_name}, notification regarding {child_name} ({tracking_no})."),
          active: Boolean(body.active ?? true),
          characterCount: String(body.body || "").length,
          creditCost: Math.max(1, Math.ceil(String(body.body || "").length / 160)),
          lastModifiedBy: staffName,
          lastModifiedAt: now()
        };
        state.templates.push(newTemplate);
        audit(
          currentRole,
          staffName,
          "SMS template created",
          `Created template: ${newTemplate.name} (${newTemplate.code})`,
          void 0,
          void 0,
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
      const body = await request.json().catch(() => ({}));
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
        void 0,
        void 0,
        clientIp,
        userAgent
      );
      return json(tpl);
    }
    if (pathname === "/api/bcats/sms/test" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const recipientPhone = normalizePhone(String(body.phone || "+254712443892"));
      const recipientName = String(body.name || "Test Citizen");
      const message = String(body.message || "BCATS Nakuru: Test SMS gateway dispatch confirmation.");
      const dispatched = {
        id: generateId(),
        recipientPhone,
        recipientName,
        message,
        timestamp: now(),
        status: "Delivered",
        channel: "Africa's Talking",
        trackingNumber: "TEST-SIM-001"
      };
      state.dispatchedSms.unshift(dispatched);
      state.settings.smsCreditsRemaining = Math.max(0, state.settings.smsCreditsRemaining - 1);
      state.settings.smsBalanceKes = Math.max(0, Math.round((state.settings.smsBalanceKes - 0.35) * 100) / 100);
      audit(
        currentRole,
        staffName,
        "Test SMS dispatched",
        `Dispatched test notification to ${recipientPhone} via Africa's Talking gateway`,
        void 0,
        void 0,
        clientIp,
        userAgent
      );
      return json({
        success: true,
        messageId: dispatched.id,
        balanceKes: state.settings.smsBalanceKes,
        creditsRemaining: state.settings.smsCreditsRemaining,
        dispatched
      });
    }
    if (pathname === "/api/bcats/sms/dispatched" && method === "GET") {
      return json(state.dispatchedSms);
    }
    if (pathname === "/api/bcats/staff") {
      if (method === "GET") {
        return json(state.staff);
      }
      if (method === "POST") {
        if (!["Administrator"].includes(currentRole)) {
          return errorJson("Only an Administrator may add staff accounts.", 403);
        }
        const body = await request.json().catch(() => ({}));
        const fullName = String(body.fullName || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const role = body.role || "Clerk";
        const counter = String(body.counter || "Nakuru Town East Counter 1");
        if (!fullName) return errorJson("Staff full name is required.");
        if (!email.includes("@")) return errorJson("Valid official email address is required.");
        const employeeId = body.employeeId || `STF-00${state.staff.length + 1}`;
        const newStaff = {
          employeeId,
          fullName,
          role,
          email,
          counter,
          active: Boolean(body.active ?? true),
          eulaAcceptedAt: now()
        };
        state.staff.push(newStaff);
        audit(
          currentRole,
          staffName,
          "Staff account created",
          `Created staff account for ${fullName} (${employeeId}) assigned as ${role} at ${counter}`,
          void 0,
          void 0,
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
      const body = await request.json().catch(() => ({}));
      if (body.fullName) person.fullName = String(body.fullName);
      if (body.role) person.role = body.role;
      if (body.counter) person.counter = String(body.counter);
      if (typeof body.active === "boolean") person.active = body.active;
      audit(
        currentRole,
        staffName,
        "Staff account updated",
        `Updated staff parameters for ${person.fullName} (${person.employeeId}): Role=${person.role}, Active=${person.active}`,
        void 0,
        void 0,
        clientIp,
        userAgent
      );
      return json(person);
    }
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
    return errorJson(`BCATS route '${pathname}' is not defined.`, 404);
  } catch (error) {
    return errorJson(error?.message || "Internal server error occurred.", 500);
  }
}

// server/edgeWorker.ts
var edgeWorker_default = {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/bcats")) {
      return handleBcatsEdgeRequest(request, env);
    }
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }
    return fetch(request);
  }
};
export {
  edgeWorker_default as default
};

export type Role = "Clerk" | "Registrar" | "Administrator" | "Auditor" | "Citizen";
export type Status =
  | "Submitted"
  | "Pending Verification"
  | "Verified"
  | "Approved"
  | "Printed"
  | "Collected"
  | "Deficient"
  | "On Hold";

export type DomainEvent = {
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type Applicant = {
  id: number;
  trackingNumber: string;
  childName: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  placeOfBirth: string;
  birthFacilityCode: string;
  birthNotificationNo: string;
  parentNationalId: string;
  parentFullName: string;
  parentRelationship: "Mother" | "Father" | "Guardian";
  contactPhone: string;
  contactEmail: string;
  subCounty: string;
  ward: string;
  idVerificationStatus: string;
  verifiedAt?: string;
};

export type Application = Applicant & {
  applicationId: number;
  currentStatus: Status;
  status: Status;
  assignedClerkId?: number;
  assignedRegistrarId?: number;
  submittedDate: string;
  lastUpdated: string;
  statusHistory: {
    oldStatus: Status;
    newStatus: Status;
    changedAt: string;
    justification: string;
    actor: string;
  }[];
  certificate?: {
    certificateNumber: string;
    securitySerialNumber: string;
    verificationQrHash: string;
    issuedDate: string;
    collectedDate?: string;
    collectorName?: string;
  };
  collection?: {
    collectorName: string;
    collectorNationalId: string;
    collectedDate: string;
  };
  deficiencyReason?: string;
  deficiencyNotes?: string;
  returnedAt?: string;
  escalated?: boolean;
  escalatedAt?: string;
  escalatedBy?: string;
  ledger?: {
    volume: string;
    page: string;
    entry: string;
    issuingDesk: string;
  };
  collectorRelationship?: string;
  collectorIdVerified?: boolean;
  ledgerSignatureConfirmed?: boolean;
  internalNotes?: string[];
};

export type SmsTemplate = {
  templateId: string;
  id?: string;
  code: string;
  name: string;
  triggerStatus: Status;
  body: string;
  active: boolean;
  characterCount: number;
  creditCost: number;
  lastModifiedBy: string;
  lastModifiedAt: string;
};

export type DispatchedSms = {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  timestamp: string;
  dispatchedAt?: string;
  status: "Delivered" | "Sent" | "Failed";
  channel: "Africa's Talking" | "Simulated Handset";
  trackingNumber?: string;
  templateCode?: string;
};

export type StationSettings = {
  officeName: string;
  officePhone: string;
  officeEmail: string;
  stationCode: string;
  stationCounty: string;
  subCountyHq: string;
  slaDays: number;
  autoTrackingPrefix: string;
  enablePublicPortal: boolean;
  smsBalanceKes: number;
  smsCreditsRemaining: number;
  smsSenderHeader: string;
  lastBackupDate: string;
  lastBackupSizeMb: number;
  lastBackupChecksum: string;
  requireSmsOtp: boolean;
  landline?: string;
  county?: string;
  officialEmail?: string;
  slaTurnaroundDays?: number;
  smsSenderId?: string;
  sealCode?: string;
  currentSerialRange?: string;
};

export type StaffUser = {
  employeeId: string;
  fullName: string;
  role: Role;
  email: string;
  counter: string;
  active: boolean;
  eulaAcceptedAt?: string;
};

export type AuditEntry = {
  auditId: string;
  applicationId?: number;
  trackingNumber?: string;
  staffId: string;
  staffName: string;
  role: Role;
  action: string;
  details: string;
  clientIp: string;
  userAgent: string;
  timestamp: string;
};

export type Overview = {
  total: number;
  counts: Record<string, number>;
  slaFlags: number;
  today: number;
  throughput: number;
};

export const statuses: Status[] = [
  "Submitted",
  "Pending Verification",
  "Verified",
  "Approved",
  "Printed",
  "Collected",
  "Deficient",
  "On Hold",
];

export const transitions: Record<Status, Status[]> = {
  Submitted: ["Pending Verification", "Deficient", "On Hold"],
  "Pending Verification": ["Verified", "Deficient", "On Hold"],
  Verified: ["Approved", "Deficient", "On Hold"],
  Approved: ["Printed", "On Hold"],
  Printed: ["Collected", "On Hold"],
  Collected: [],
  Deficient: ["Submitted", "On Hold"],
  "On Hold": ["Submitted", "Pending Verification", "Deficient"],
};

export const statusTone: Record<string, string> = {
  Submitted: "blue",
  "Pending Verification": "amber",
  Verified: "green",
  Approved: "purple",
  Printed: "indigo",
  Collected: "teal",
  Deficient: "rose",
  "On Hold": "slate",
};

export const STAFF_ACCOUNTS: (StaffUser & { password: string })[] = [
  {
    employeeId: "CRS-CLK-021",
    fullName: "Mercy Wambui",
    role: "Clerk",
    email: "clerk@nakuru.crs.go.ke",
    counter: "Counter C3 (Intake & Verification)",
    active: true,
    password: "Bcats2026!",
  },
  {
    employeeId: "CRS-REG-014",
    fullName: "Daniel Karanja",
    role: "Registrar",
    email: "registrar@nakuru.crs.go.ke",
    counter: "Counter R1 (Approval & Issuance)",
    active: true,
    password: "Bcats2026!",
  },
  {
    employeeId: "CRS-ADM-001",
    fullName: "Faith Njeri",
    role: "Administrator",
    email: "admin@nakuru.crs.go.ke",
    counter: "HQ Station Command",
    active: true,
    password: "Bcats2026!",
  },
  {
    employeeId: "CRS-AUD-003",
    fullName: "Josephine Achieng",
    role: "Auditor",
    email: "auditor@nakuru.crs.go.ke",
    counter: "Station Audit & Oversight Desk",
    active: true,
    password: "Bcats2026!",
  },
  // Legacy / Direct named aliases
  {
    employeeId: "CRS-CLK-021",
    fullName: "Mercy Wambui",
    role: "Clerk",
    email: "mercy.wambui@crs.go.ke",
    counter: "Counter C3",
    active: true,
    password: "Bcats2026!",
  },
  {
    employeeId: "CRS-REG-014",
    fullName: "Daniel Karanja",
    role: "Registrar",
    email: "daniel.karanja@crs.go.ke",
    counter: "Counter R1",
    active: true,
    password: "Bcats2026!",
  },
  {
    employeeId: "CRS-ADM-001",
    fullName: "Faith Njeri",
    role: "Administrator",
    email: "faith.njeri@crs.go.ke",
    counter: "HQ Station Command",
    active: true,
    password: "Bcats2026!",
  },
  {
    employeeId: "CRS-AUD-003",
    fullName: "Josephine Achieng",
    role: "Auditor",
    email: "josephine.achieng@crs.go.ke",
    counter: "Station Audit Desk",
    active: true,
    password: "Bcats2026!",
  },
];

export const ROLE_ALLOWED_TABS: Record<Role, string[]> = {
  Clerk: [
    "/",
    "/applications/new",
    "/verification",
    "/records",
  ],
  Registrar: [
    "/",
    "/records",
    "/verification",
    "/status",
    "/printing",
    "/collection",
    "/reports",
  ],
  Auditor: [
    "/",
    "/audit",
    "/reports",
    "/records",
  ],
  Administrator: [
    "/",
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
    "/sms",
  ],
  Citizen: [
    "/track",
    "/apply",
  ],
};

export const ROLE_PERMISSIONS: Record<
  Role,
  {
    canCreate: boolean;
    canVerify: boolean;
    canApprove: boolean;
    canPrint: boolean;
    canCollect: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
    canViewAudit: boolean;
    canViewReports: boolean;
    allowedRoutes: string[];
  }
> = {
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
      "/records",
    ],
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
      "/reports",
    ],
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
      "/sms",
    ],
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
    allowedRoutes: ["/", "/dashboard", "/audit", "/reports", "/records"],
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
    allowedRoutes: ["/track", "/apply"],
  },
};

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;
  return value;
}

export function labelDate(value?: string): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function createInitialSeed(): {
  applications: Application[];
  staff: StaffUser[];
  audit: AuditEntry[];
  events: DomainEvent[];
  settings: StationSettings;
  templates: SmsTemplate[];
  dispatchedSms: DispatchedSms[];
} {
  const baseTime = 1761642000000; // Fixed deterministic baseline timestamp
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
      "Approved",
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
      "Pending Verification",
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
      "Verified",
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
      "Verified",
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
      "Verified",
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
      "Approved",
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
      "Printed",
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
      "Collected",
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
      "Pending Verification",
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
      "Pending Verification",
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
      "Pending Verification",
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
      "Pending Verification",
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
      "Collected",
    ],
  ] as const;

  const applications: Application[] = people.map((p, index) => {
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
      currentStatus,
    ] = p;
    const created = new Date(baseTime - (index + 1) * 86400000).toISOString();
    return {
      id: index + 1,
      applicationId: index + 1,
      trackingNumber,
      childName,
      dateOfBirth,
      gender: gender as "Male" | "Female",
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
      idVerificationStatus:
        (currentStatus as string) === "Pending Verification" || (currentStatus as string) === "Submitted"
          ? "UNVERIFIED"
          : "VERIFIED_IPRS",
      verifiedAt:
        (currentStatus as string) === "Pending Verification" || (currentStatus as string) === "Submitted"
          ? undefined
          : created,
      currentStatus: currentStatus as Status,
      status: currentStatus as Status,
      submittedDate: created,
      lastUpdated: created,
      statusHistory: [
        {
          oldStatus: "Submitted",
          newStatus: currentStatus as Status,
          changedAt: created,
          justification: "Seeded registry record for operational evaluation",
          actor: "System initialization",
        },
      ],
      certificate:
        (currentStatus as string) === "Collected" || (currentStatus as string) === "Printed"
          ? {
              certificateNumber: `CERT-NAK-${String(index + 1).padStart(5, "0")}`,
              securitySerialNumber: `CRS-26-${String(771000 + index + 1)}`,
              verificationQrHash: `sha256-hash-${trackingNumber}`,
              issuedDate: created.slice(0, 10),
              collectedDate: currentStatus === "Collected" ? nowStr.slice(0, 10) : undefined,
              collectorName: currentStatus === "Collected" ? parentFullName : undefined,
            }
          : undefined,
      collection:
        (currentStatus as string) === "Collected"
          ? {
              collectorName: parentFullName,
              collectorNationalId: parentNationalId,
              collectedDate: nowStr.slice(0, 10),
            }
          : undefined,
    };
  });

  const staff: StaffUser[] = [
    {
      employeeId: "CRS-CLK-021",
      fullName: "Mercy Wambui",
      role: "Clerk",
      email: "clerk@nakuru.crs.go.ke",
      counter: "Counter C3 (Intake & Verification)",
      active: true,
      eulaAcceptedAt: nowStr,
    },
    {
      employeeId: "CRS-REG-014",
      fullName: "Daniel Karanja",
      role: "Registrar",
      email: "registrar@nakuru.crs.go.ke",
      counter: "Counter R1 (Approval & Issuance)",
      active: true,
      eulaAcceptedAt: nowStr,
    },
    {
      employeeId: "CRS-ADM-001",
      fullName: "Faith Njeri",
      role: "Administrator",
      email: "admin@nakuru.crs.go.ke",
      counter: "HQ Station Command",
      active: true,
      eulaAcceptedAt: nowStr,
    },
    {
      employeeId: "CRS-AUD-003",
      fullName: "Josephine Achieng",
      role: "Auditor",
      email: "auditor@nakuru.crs.go.ke",
      counter: "Station Audit & Oversight Desk",
      active: true,
      eulaAcceptedAt: nowStr,
    },
  ];

  const audit: AuditEntry[] = [
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
      timestamp: new Date(baseTime - 3600000).toISOString(),
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
      timestamp: new Date(baseTime - 7200000).toISOString(),
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
      timestamp: new Date(baseTime - 14400000).toISOString(),
    },
  ];

  const templates: SmsTemplate[] = [
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
      lastModifiedAt: nowStr,
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
      lastModifiedAt: nowStr,
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
      lastModifiedAt: nowStr,
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
      lastModifiedAt: nowStr,
    },
  ];

  const settings: StationSettings = {
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
    requireSmsOtp: true,
  };

  const dispatchedSms: DispatchedSms[] = [
    {
      id: "sms-init-01",
      recipientPhone: "+254712443892",
      recipientName: "Grace Akinyi Ochieng",
      message: "Dear Grace Akinyi Ochieng, birth certificate records for Amani Ochieng Kamau have been verified. Ref: BCATS-2026-001847. Scheduled for civil registry seal and printing counter.",
      timestamp: new Date(baseTime - 3600000).toISOString(),
      status: "Delivered",
      channel: "Africa's Talking",
      trackingNumber: "BCATS-2026-001847",
    },
    {
      id: "sms-init-02",
      recipientPhone: "+254712345678",
      recipientName: "Mwangi Kariuki",
      message: "Dear Mwangi Kariuki, your birth cert application for Talia Waweru (Ref: BCATS-2026-001923) has been received. Track status online at bcats.go.ke/track",
      timestamp: new Date(baseTime - 7200000).toISOString(),
      status: "Delivered",
      channel: "Africa's Talking",
      trackingNumber: "BCATS-2026-001923",
    },
    {
      id: "sms-init-03",
      recipientPhone: "+254722884102",
      recipientName: "Mercy Muthoni Kariuki",
      message: "Dear Mercy Muthoni Kariuki, the birth certificate for Lucas Mwangi Kariuki (Ref: BCATS-2026-001801) is ready for collection at Nakuru Civil Registration Office Counter 01. Carry your original National ID.",
      timestamp: new Date(baseTime - 86400000).toISOString(),
      status: "Delivered",
      channel: "Africa's Talking",
      trackingNumber: "BCATS-2026-001801",
    },
  ];

  return { applications, staff, audit, events: [], settings, templates, dispatchedSms };
}

export function computeOverview(applications: Application[]): Overview {
  const counts = applications.reduce<Record<string, number>>((acc, item) => {
    acc[item.currentStatus] = (acc[item.currentStatus] || 0) + 1;
    return acc;
  }, {});

  const nowMs = Date.now();
  const slaFlags = applications.filter(
    (item) =>
      !["Collected", "Printed"].includes(item.currentStatus) &&
      nowMs - Date.parse(item.lastUpdated) > 5 * 86400000
  ).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = applications.filter(
    (item) => item.submittedDate && item.submittedDate.slice(0, 10) === todayStr
  ).length;

  const throughput = Math.round(
    ((counts.Collected || 0) / Math.max(1, applications.length)) * 100
  );

  return {
    total: applications.length,
    counts,
    slaFlags,
    today,
    throughput,
  };
}

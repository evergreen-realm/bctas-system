import { describe, expect, it } from "vitest";
import { handleBcatsEdgeRequest } from "../shared/bcatsEdgeHandler";
import { STAFF_ACCOUNTS, ROLE_PERMISSIONS, transitions } from "../shared/bcatsCore";

describe("BCATS multi-role authentication and authorization", () => {
  it("authenticates each designated staff role with official credentials", async () => {
    const rolesToTest = [
      { role: "Clerk", email: "clerk@nakuru.crs.go.ke", password: "Bcats2026!" },
      { role: "Registrar", email: "registrar@nakuru.crs.go.ke", password: "Bcats2026!" },
      { role: "Administrator", email: "admin@nakuru.crs.go.ke", password: "Bcats2026!" },
      { role: "Auditor", email: "auditor@nakuru.crs.go.ke", password: "Bcats2026!" },
    ];

    for (const testCase of rolesToTest) {
      const req = new Request("https://bcats-nakuru.pages.dev/api/bcats/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testCase.email, password: testCase.password }),
      });

      const res = await handleBcatsEdgeRequest(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe(testCase.role);
      expect(data.user.email).toBe(testCase.email);
      expect(data.token).toBeDefined();
    }
  });

  it("rejects unauthorized login attempts with 401", async () => {
    const req = new Request("https://bcats-nakuru.pages.dev/api/bcats/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "clerk@nakuru.crs.go.ke", password: "WrongPassword!" }),
    });

    const res = await handleBcatsEdgeRequest(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Invalid staff email or password");
  });

  it("enforces strict statutory role permissions", () => {
    // Clerk permissions
    expect(ROLE_PERMISSIONS.Clerk.canCreate).toBe(true);
    expect(ROLE_PERMISSIONS.Clerk.canVerify).toBe(true);
    expect(ROLE_PERMISSIONS.Clerk.canApprove).toBe(false);
    expect(ROLE_PERMISSIONS.Clerk.canPrint).toBe(false);
    expect(ROLE_PERMISSIONS.Clerk.allowedRoutes).not.toContain("/printing");

    // Registrar permissions
    expect(ROLE_PERMISSIONS.Registrar.canCreate).toBe(false);
    expect(ROLE_PERMISSIONS.Registrar.canApprove).toBe(true);
    expect(ROLE_PERMISSIONS.Registrar.canPrint).toBe(true);
    expect(ROLE_PERMISSIONS.Registrar.canManageSettings).toBe(false);

    // Auditor permissions
    expect(ROLE_PERMISSIONS.Auditor.canCreate).toBe(false);
    expect(ROLE_PERMISSIONS.Auditor.canApprove).toBe(false);
    expect(ROLE_PERMISSIONS.Auditor.canPrint).toBe(false);
    expect(ROLE_PERMISSIONS.Auditor.canViewAudit).toBe(true);
    expect(ROLE_PERMISSIONS.Auditor.canViewReports).toBe(true);

    // Administrator permissions
    expect(ROLE_PERMISSIONS.Administrator.canCreate).toBe(true);
    expect(ROLE_PERMISSIONS.Administrator.canApprove).toBe(true);
    expect(ROLE_PERMISSIONS.Administrator.canPrint).toBe(true);
    expect(ROLE_PERMISSIONS.Administrator.canManageUsers).toBe(true);
  });

  it("handles edge bootstrap and returns non-empty applications and staff", async () => {
    const req = new Request("https://bcats-nakuru.pages.dev/api/bcats/bootstrap", {
      method: "GET",
      headers: { "x-bcats-role": "Administrator" },
    });

    const res = await handleBcatsEdgeRequest(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.applications.length).toBeGreaterThanOrEqual(5);
    expect(data.overview.total).toBe(data.applications.length);
    expect(data.staff.length).toBeGreaterThanOrEqual(4);
  });

  it("blocks non-Registrar from approving an application", async () => {
    const req = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/3/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Clerk",
        "x-bcats-staff": "Mercy Wambui",
      },
      body: JSON.stringify({ nextStatus: "Approved", justification: "Clerk attempting approval" }),
    });

    const res = await handleBcatsEdgeRequest(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Only a Registrar");
  });

  it("allows Registrar to approve a verified application", async () => {
    const req = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/3/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Registrar",
        "x-bcats-staff": "Daniel Karanja",
      },
      body: JSON.stringify({ nextStatus: "Approved", justification: "Registrar legal clearance" }),
    });

    const res = await handleBcatsEdgeRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.currentStatus).toBe("Approved");
  });

  it("strictly filters frontend navigation tabs and direct URL route clearance per role", async () => {
    const { ROLE_ALLOWED_TABS } = await import("../shared/bcatsCore");
    const { navItems } = await import("../client/src/components/Shell");

    // 1. Clerk Navigation and Route Clearance
    expect(ROLE_ALLOWED_TABS.Clerk).toEqual([
      "/",
      "/applications/new",
      "/verification",
      "/records",
    ]);
    const clerkVisible = ROLE_ALLOWED_TABS.Clerk.map((p) =>
      navItems.find((i) => i.path === p)?.label
    );
    expect(clerkVisible).toEqual([
      "Command centre",
      "New application",
      "Verification desk",
      "Birth records",
    ]);

    // Prohibited tabs must NOT be present in Clerk's allowed routes or tabs
    const clerkProhibited = [
      "/status",
      "/printing",
      "/collection",
      "/reports",
      "/audit",
      "/users",
      "/settings",
      "/sms",
    ];
    for (const route of clerkProhibited) {
      expect(ROLE_ALLOWED_TABS.Clerk).not.toContain(route);
      expect(ROLE_PERMISSIONS.Clerk.allowedRoutes).not.toContain(route);
    }

    // 2. Registrar Navigation and Route Clearance
    expect(ROLE_ALLOWED_TABS.Registrar).toEqual([
      "/",
      "/records",
      "/verification",
      "/status",
      "/printing",
      "/collection",
      "/reports",
    ]);
    const registrarVisible = ROLE_ALLOWED_TABS.Registrar.map((p) =>
      navItems.find((i) => i.path === p)?.label
    );
    expect(registrarVisible).toEqual([
      "Command centre",
      "Birth records",
      "Verification desk",
      "Status update",
      "Printing centre",
      "Collection desk",
      "Reports & analytics",
    ]);

    // Prohibited tabs must NOT be present in Registrar's allowed routes or tabs
    const registrarProhibited = [
      "/applications/new",
      "/users",
      "/settings",
      "/sms",
      "/audit",
    ];
    for (const route of registrarProhibited) {
      expect(ROLE_ALLOWED_TABS.Registrar).not.toContain(route);
      expect(ROLE_PERMISSIONS.Registrar.allowedRoutes).not.toContain(route);
    }

    // 3. Auditor Navigation and Route Clearance
    expect(ROLE_ALLOWED_TABS.Auditor).toEqual([
      "/",
      "/audit",
      "/reports",
      "/records",
    ]);
    const auditorVisible = ROLE_ALLOWED_TABS.Auditor.map((p) =>
      navItems.find((i) => i.path === p)?.label
    );
    expect(auditorVisible).toEqual([
      "Command centre",
      "Audit log",
      "Reports & analytics",
      "Birth records",
    ]);

    // Prohibited tabs must NOT be present in Auditor's allowed routes or tabs
    const auditorProhibited = [
      "/applications/new",
      "/verification",
      "/status",
      "/printing",
      "/collection",
      "/users",
      "/settings",
      "/sms",
    ];
    for (const route of auditorProhibited) {
      expect(ROLE_ALLOWED_TABS.Auditor).not.toContain(route);
      expect(ROLE_PERMISSIONS.Auditor.allowedRoutes).not.toContain(route);
    }

    // 4. Administrator has full clearance
    expect(ROLE_ALLOWED_TABS.Administrator.length).toBe(12);
    expect(ROLE_PERMISSIONS.Administrator.allowedRoutes.length).toBeGreaterThanOrEqual(13);

    // 5. Citizen / Public has track & apply
    expect(ROLE_ALLOWED_TABS.Citizen).toEqual(["/track", "/apply"]);
    expect(ROLE_PERMISSIONS.Citizen.allowedRoutes).toEqual(["/track", "/apply"]);
  });

  it("strictly enforces statutory backend RBAC rejections for unauthorized endpoints", async () => {
    // 1. Clerk blocked from certificate collection handover
    const clerkCollectReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/1/collect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Clerk",
        "x-bcats-staff": "Mercy Wambui",
      },
      body: JSON.stringify({ collectorName: "Parent Name", collectorNationalId: "28419204" }),
    });
    const clerkCollectRes = await handleBcatsEdgeRequest(clerkCollectReq);
    expect(clerkCollectRes.status).toBe(403);
    const clerkCollectData = await clerkCollectRes.json();
    expect(clerkCollectData.error).toContain("authorised collection desk officer");

    // 2. Clerk & Registrar blocked from statutory audit log
    for (const role of ["Clerk", "Registrar"]) {
      const auditReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/audit", {
        method: "GET",
        headers: { "x-bcats-role": role },
      });
      const auditRes = await handleBcatsEdgeRequest(auditReq);
      expect(auditRes.status).toBe(403);
      const auditData = await auditRes.json();
      expect(auditData.error).toContain("Only an Auditor or Administrator");
    }

    // 3. Auditor can view statutory audit log
    const auditorReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/audit", {
      method: "GET",
      headers: { "x-bcats-role": "Auditor" },
    });
    const auditorRes = await handleBcatsEdgeRequest(auditorReq);
    expect(auditorRes.status).toBe(200);
    const auditorData = await auditorRes.json();
    expect(Array.isArray(auditorData)).toBe(true);

    // 4. Registrar and Auditor blocked from creating new applications
    for (const role of ["Registrar", "Auditor"]) {
      const createReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bcats-role": role,
        },
        body: JSON.stringify({
          childName: "Unauthorized Child",
          parentNationalId: "28419204",
          consentAccepted: true,
        }),
      });
      const createRes = await handleBcatsEdgeRequest(createReq);
      expect(createRes.status).toBe(403);
      const createData = await createRes.json();
      expect(createData.error).toContain("does not have intake clearance");
    }

    // 5. Clerk blocked from reports summary; Registrar allowed
    const clerkReportsReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/reports/summary", {
      method: "GET",
      headers: { "x-bcats-role": "Clerk" },
    });
    const clerkReportsRes = await handleBcatsEdgeRequest(clerkReportsReq);
    expect(clerkReportsRes.status).toBe(403);

    const regReportsReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/reports/summary", {
      method: "GET",
      headers: { "x-bcats-role": "Registrar" },
    });
    const regReportsRes = await handleBcatsEdgeRequest(regReportsReq);
    expect(regReportsRes.status).toBe(200);

    // 6. Non-Admin blocked from station settings
    for (const role of ["Clerk", "Registrar", "Auditor"]) {
      const settingsReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/settings", {
        method: "GET",
        headers: { "x-bcats-role": role },
      });
      const settingsRes = await handleBcatsEdgeRequest(settingsReq);
      expect(settingsRes.status).toBe(403);
    }
  });
});

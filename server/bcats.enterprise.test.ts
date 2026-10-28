import { describe, expect, it } from "vitest";
import { handleBcatsEdgeRequest } from "../shared/bcatsEdgeHandler";

describe("BCATS Enterprise 15-Screen API & Workflow Endpoints", () => {
  it("processes physical handover collection with ledger coordinates and SMS trigger", async () => {
    // 1. Issue Form 5 Print as Registrar
    const printReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/1/print", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Registrar",
        "x-bcats-staff": "Daniel Karanja",
      },
    });
    const printRes = await handleBcatsEdgeRequest(printReq);
    expect(printRes.status).toBe(200);

    // 2. Complete Physical Handover as Registrar
    const collectReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/1/collect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Registrar",
        "x-bcats-staff": "Daniel Karanja",
      },
      body: JSON.stringify({
        collectorName: "Grace Akinyi Ochieng",
        collectorNationalId: "28491029",
        collectorRelationship: "Mother (Biological)",
        collectorIdVerified: true,
        ledgerSignatureConfirmed: true,
        ledger: {
          volume: "Vol. 42",
          page: "Page 118",
          entry: "Entry 14",
          issuingDesk: "Nakuru Counter C3",
        },
      }),
    });

    const res = await handleBcatsEdgeRequest(collectReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.currentStatus).toBe("Collected");
    expect(data.certificate.collectorName).toBe("Grace Akinyi Ochieng");
    expect(data.ledger.volume).toBe("Vol. 42");
    expect(data.ledger.entry).toBe("Entry 14");
  });

  it("returns an application for correction with deficiency reason and SMS trigger", async () => {
    const returnReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/2/return", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Clerk",
        "x-bcats-staff": "Mercy Wambui",
      },
      body: JSON.stringify({
        deficiencyReason: "Hospital stamp missing on Form 1",
        deficiencyNotes: "Please obtain official stamp from Nakuru Level 5 records registry.",
      }),
    });

    const res = await handleBcatsEdgeRequest(returnReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.currentStatus).toBe("Deficient");
    expect(data.deficiencyReason).toBe("Hospital stamp missing on Form 1");

    // Check dispatched SMS log for deficiency alert
    const smsReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/sms/dispatched", {
      method: "GET",
      headers: {
        "x-bcats-role": "Administrator",
      },
    });
    const smsRes = await handleBcatsEdgeRequest(smsReq);
    const smsList = await smsRes.json();
    const deficiencySms = smsList.find((s: any) => s.message.includes("document clarification required"));
    expect(deficiencySms).toBeDefined();
  });

  it("escalates an application to County Registrar and logs statutory audit entry", async () => {
    const escalateReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/applications/4/escalate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Auditor",
        "x-bcats-staff": "Josephine Achieng",
      },
      body: JSON.stringify({
        notes: "Complex biological parentage inquiry requiring legal determination.",
      }),
    });

    const res = await handleBcatsEdgeRequest(escalateReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.escalatedBy).toBe("Josephine Achieng");

    // Check audit trail
    const auditReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/audit", {
      method: "GET",
      headers: {
        "x-bcats-role": "Auditor",
      },
    });
    const auditRes = await handleBcatsEdgeRequest(auditReq);
    const auditList = await auditRes.json();
    const escalationAudit = auditList.find((a: any) => a.action.includes("Application escalated"));
    expect(escalationAudit).toBeDefined();
  });

  it("handles Africa's Talking SMS test dispatch", async () => {
    const testReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/sms/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": "Administrator",
        "x-bcats-staff": "Faith Njeri",
      },
      body: JSON.stringify({
        phone: "+254712443892",
        text: "BCATS Nakuru: Africa's Talking gateway connectivity verified nominal.",
      }),
    });

    const res = await handleBcatsEdgeRequest(testReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("exports vault backup JSON and restores via factory reset", async () => {
    // 1. Backup
    const backupReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/settings/backup", {
      method: "POST",
      headers: {
        "x-bcats-role": "Administrator",
        "x-bcats-staff": "Faith Njeri",
      },
    });
    const backupRes = await handleBcatsEdgeRequest(backupReq);
    expect(backupRes.status).toBe(200);
    const backup = await backupRes.json();
    expect(backup.success).toBe(true);
    expect(Array.isArray(backup.snapshot.applications)).toBe(true);
    expect(Array.isArray(backup.snapshot.templates)).toBe(true);

    // 2. Factory Reset
    const resetReq = new Request("https://bcats-nakuru.pages.dev/api/bcats/settings/reset", {
      method: "POST",
      headers: {
        "x-bcats-role": "Administrator",
        "x-bcats-staff": "Faith Njeri",
      },
    });
    const resetRes = await handleBcatsEdgeRequest(resetReq);
    expect(resetRes.status).toBe(200);
    const resetResult = await resetRes.json();
    expect(resetResult.success).toBe(true);
  });
});

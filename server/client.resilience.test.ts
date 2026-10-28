import { describe, expect, it } from "vitest";
import { localStoreDispatch } from "../client/src/localStore";
import type { Application, Overview, StaffUser } from "../shared/bcatsCore";

describe("BCATS client offline store & resilient dispatch", () => {
  const staff: StaffUser = {
    employeeId: "CRS-CLK-021",
    fullName: "Mercy Wambui",
    role: "Clerk",
    email: "clerk@nakuru.crs.go.ke",
    counter: "Counter C3",
    active: true,
  };

  it("handles /bootstrap locally and computes overview correctly", () => {
    const res = localStoreDispatch<{
      overview: Overview;
      applications: Application[];
      staff: StaffUser[];
    }>("/bootstrap", { method: "GET" }, "Clerk", staff);

    expect(res.overview).toBeDefined();
    expect(res.overview.total).toBeGreaterThanOrEqual(5);
    expect(res.applications.length).toBe(res.overview.total);
    expect(res.staff.length).toBeGreaterThanOrEqual(4);
  });

  it("creates application offline with proper normalization and KDPA consent", () => {
    expect(() =>
      localStoreDispatch("/applications", {
        method: "POST",
        body: JSON.stringify({
          childName: "Zawadi Test",
          parentNationalId: "12345678",
          contactPhone: "0712345678",
          consentAccepted: false,
        }),
      }, "Clerk", staff)
    ).toThrow("Statutory consent");

    const created = localStoreDispatch<Application>("/applications", {
      method: "POST",
      body: JSON.stringify({
        childName: "Zawadi Test",
        parentNationalId: "12345678",
        contactPhone: "0712345678",
        consentAccepted: true,
      }),
    }, "Clerk", staff);

    expect(created.trackingNumber).toMatch(/^NKU-2026-\d{5}$/);
    expect(created.contactPhone).toBe("+254712345678");
    expect(created.currentStatus).toBe("Submitted");
  });

  it("verifies and transitions applications through audited lifecycle", () => {
    const created = localStoreDispatch<Application>("/applications", {
      method: "POST",
      body: JSON.stringify({
        childName: "Amani Verification Test",
        parentNationalId: "28419204",
        contactPhone: "0712345678",
        consentAccepted: true,
      }),
    }, "Clerk", staff);

    // Verify
    const verified = localStoreDispatch<Application>(
      `/applications/${created.applicationId}/verify`,
      {
        method: "POST",
        body: JSON.stringify({ iprsMatch: true, hospitalMatch: true, otpVerified: true }),
      },
      "Clerk",
      staff
    );
    expect(verified.currentStatus).toBe("Verified");
    expect(verified.idVerificationStatus).toBe("VERIFIED_IPRS");

    // Approve (requires Registrar)
    const registrarStaff: StaffUser = {
      employeeId: "CRS-REG-014",
      fullName: "Daniel Karanja",
      role: "Registrar",
      email: "registrar@nakuru.crs.go.ke",
      counter: "Counter R1",
      active: true,
    };

    expect(() =>
      localStoreDispatch(
        `/applications/${created.applicationId}/status`,
        {
          method: "POST",
          body: JSON.stringify({ nextStatus: "Approved", justification: "Clerk trying approval" }),
        },
        "Clerk",
        staff
      )
    ).toThrow("Only a Registrar");

    const approved = localStoreDispatch<Application>(
      `/applications/${created.applicationId}/status`,
      {
        method: "POST",
        body: JSON.stringify({ nextStatus: "Approved", justification: "Registrar approval" }),
      },
      "Registrar",
      registrarStaff
    );
    expect(approved.currentStatus).toBe("Approved");

    // Print Form 5
    const printed = localStoreDispatch<Application>(
      `/applications/${created.applicationId}/print`,
      { method: "POST" },
      "Registrar",
      registrarStaff
    );
    expect(printed.currentStatus).toBe("Printed");
    expect(printed.certificate?.certificateNumber).toContain("CERT-NAK");

    // Collect: Clerk is prohibited under Cap. 149; Registrar succeeds
    expect(() =>
      localStoreDispatch<Application>(
        `/applications/${created.applicationId}/collect`,
        {
          method: "POST",
          body: JSON.stringify({ collectorName: "Parent Name", collectorNationalId: "28419204" }),
        },
        "Clerk",
        staff
      )
    ).toThrow("Only an authorised collection desk officer");

    const collected = localStoreDispatch<Application>(
      `/applications/${created.applicationId}/collect`,
      {
        method: "POST",
        body: JSON.stringify({ collectorName: "Parent Name", collectorNationalId: "28419204" }),
      },
      "Registrar",
      registrarStaff
    );
    expect(collected.currentStatus).toBe("Collected");
    expect(collected.certificate?.collectorName).toBe("Parent Name");
  });
});

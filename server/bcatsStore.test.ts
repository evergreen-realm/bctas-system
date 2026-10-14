import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { store } from "./bcatsStore";

const dataPath = join(process.cwd(), "data", "bcats-state.json");
const meta = { role: "Administrator" as const, staffName: "Test administrator", clientIp: "127.0.0.1", userAgent: "vitest" };

describe("BCATS application aggregate", () => {
  afterEach(() => { rmSync(dataPath, { force: true }); });
  it("requires statutory consent and normalizes Kenyan mobile numbers", () => {
    expect(() => store.create({ childName: "A Test Child", parentNationalId: "28419204", contactPhone: "0712345678" }, meta)).toThrow("Statutory consent");
    const created = store.create({ childName: "A Test Child", parentNationalId: "28419204", contactPhone: "0712345678", consentAccepted: true }, meta);
    expect(created.contactPhone).toBe("+254712345678");
    expect(created.currentStatus).toBe("Submitted");
  });
  it("blocks illegal status changes and limits approval to authorised roles", () => {
    const created = store.create({ childName: "A Test Child", parentNationalId: "28419204", consentAccepted: true }, meta);
    expect(() => store.transition(String(created.applicationId), "Collected", "skip", meta)).toThrow("Cannot move");
    store.transition(String(created.applicationId), "Pending Verification", "Queue for checks", meta);
    store.verify(String(created.applicationId), { iprsMatch: true, hospitalMatch: true, otpVerified: true }, meta);
    expect(() => store.transition(String(created.applicationId), "Approved", "Approve", { ...meta, role: "Clerk" })).toThrow("Only a Registrar");
  });
  it("issues a signed certificate only after approval", () => {
    const created = store.create({ childName: "A Test Child", parentNationalId: "28419204", consentAccepted: true }, meta);
    store.transition(String(created.applicationId), "Pending Verification", "Queue for checks", meta);
    store.verify(String(created.applicationId), { iprsMatch: true, hospitalMatch: true, otpVerified: true }, meta);
    store.transition(String(created.applicationId), "Approved", "Registrar approval", meta);
    const printed = store.print(String(created.applicationId), meta);
    expect(printed.currentStatus).toBe("Printed");
    expect(printed.certificate?.certificateNumber).toContain("CERT-NAK");
  });
});

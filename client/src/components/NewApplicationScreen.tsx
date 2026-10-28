import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  Save,
  Baby,
  UserCheck,
  Landmark,
  Fingerprint,
} from "lucide-react";
import { type Application, type Role } from "@shared/bcatsCore";

interface NewApplicationScreenProps {
  role?: Role;
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh?: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function NewApplicationScreen({
  role = "Clerk",
  notify,
  refresh,
  api,
}: NewApplicationScreenProps) {
  const [form, setForm] = useState({
    childName: "",
    dateOfBirth: "",
    gender: "Female",
    placeOfBirth: "Nakuru Level 5 Hospital",
    birthNotificationNo: "",
    parentNationalId: "",
    parentFullName: "",
    parentRelationship: "Mother",
    contactPhone: "",
    contactEmail: "",
    subCounty: "Nakuru Town East",
    ward: "Biashara",
    consentAccepted: true,
  });

  const [busy, setBusy] = useState(false);

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (isDraft = false) => {
    if (!form.childName || !form.parentFullName || !form.parentNationalId || !form.birthNotificationNo) {
      notify("error", "Please fill in all statutory required bio-data fields.");
      return;
    }
    setBusy(true);
    try {
      const created = await api<Application>("/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (isDraft) {
        notify("info", `Intake draft saved for ${created.childName} (${created.trackingNumber}).`);
      } else {
        notify(
          "success",
          `Application ${created.trackingNumber} successfully lodged. Tracking slip issued and SMS dispatched to ${created.contactPhone}.`
        );
      }

      setForm({
        ...form,
        childName: "",
        dateOfBirth: "",
        birthNotificationNo: "",
        parentNationalId: "",
        parentFullName: "",
        contactPhone: "",
        contactEmail: "",
      });
      refresh?.();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card form-card">
      {/* Official IPRS Verification Protocol Banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
        <Fingerprint size={20} style={{ color: "#2563eb", flex: "none" }} />
        <div style={{ fontSize: "11.5px", color: "#1e40af", lineHeight: "1.5" }}>
          <strong>IPRS Identity & Birth Registration Protocol Active:</strong> Every record lodged at this counter is cryptographically hashed, checked against Ministry of Interior e-Birth records, and logged under Section 29 of KDPA 2019.
        </div>
      </div>

      <div className="form-intro">
        <div className="eyebrow">Counter intake · Clerk assisted</div>
        <h2>Record new birth application</h2>
        <p>
          Capture statutory birth registration details in accordance with Kenya Civil Registration Act Cap 149.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        {/* Child Details */}
        <div className="form-section">
          <h3>Child bio-data</h3>
          <div className="form-grid">
            <label>
              Child full name
              <input
                className="field"
                required
                value={form.childName}
                onChange={(e) => update("childName", e.target.value)}
                placeholder="e.g. Amani Wanjiku Kamau"
              />
            </label>

            <label>
              Date of birth
              <input
                className="field"
                required
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
            </label>

            <div>
              <label className="field-label">Sex of child</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {["Female", "Male", "Intersex"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`btn ${form.gender === g ? "primary" : "outline"}`}
                    onClick={() => update("gender", g)}
                    style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Place of birth / Hospital
              <select
                className="field"
                value={form.placeOfBirth}
                onChange={(e) => update("placeOfBirth", e.target.value)}
              >
                <option>Nakuru Level 5 Hospital</option>
                <option>Naivasha Sub-County Hospital</option>
                <option>Gilgil Sub-County Hospital</option>
                <option>Molo Sub-County Hospital</option>
                <option>Mediheal Hospital Nakuru</option>
                <option>Home Birth (Chief Notification Letter)</option>
              </select>
            </label>

            <label>
              Birth notification number (Form 1)
              <input
                className="field"
                required
                value={form.birthNotificationNo}
                onChange={(e) => update("birthNotificationNo", e.target.value)}
                placeholder="BN-26-00000"
              />
            </label>
          </div>
        </div>

        {/* Parent / Guardian Details */}
        <div className="form-section">
          <h3>Parent or guardian</h3>
          <div className="form-grid">
            <label>
              Parent full name
              <input
                className="field"
                required
                value={form.parentFullName}
                onChange={(e) => update("parentFullName", e.target.value)}
                placeholder="Name as on National ID"
              />
            </label>

            <label>
              National ID <span className="hint">7–8 digits</span>
              <input
                className="field"
                required
                inputMode="numeric"
                maxLength={8}
                value={form.parentNationalId}
                onChange={(e) => update("parentNationalId", e.target.value.replace(/\D/g, ""))}
                placeholder="28491023"
              />
            </label>

            <label>
              Relationship
              <select
                className="field"
                value={form.parentRelationship}
                onChange={(e) => update("parentRelationship", e.target.value)}
              >
                <option>Mother</option>
                <option>Father</option>
                <option>Guardian</option>
              </select>
            </label>

            <label>
              Mobile number
              <input
                className="field"
                required
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="0712 345 678"
              />
            </label>

            <label>
              Email address <span className="hint">Optional</span>
              <input
                className="field"
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="parent@gmail.com"
              />
            </label>

            <label>
              Sub-county
              <select
                className="field"
                value={form.subCounty}
                onChange={(e) => update("subCounty", e.target.value)}
              >
                {[
                  "Nakuru Town East",
                  "Nakuru Town West",
                  "Naivasha",
                  "Molo",
                  "Rongai",
                  "Gilgil",
                  "Njoro",
                  "Subukia",
                  "Kuresoi North",
                  "Kuresoi South",
                  "Bahati",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>

            <label>
              Ward
              <input
                className="field"
                required
                value={form.ward}
                onChange={(e) => update("ward", e.target.value)}
                placeholder="Biashara"
              />
            </label>
          </div>
        </div>

        <label className="consent">
          <input
            type="checkbox"
            required
            checked={form.consentAccepted}
            onChange={(e) => update("consentAccepted", e.target.checked)}
          />
          <span>
            <strong>Statutory consent:</strong> I confirm parent/guardian presentation of original Form 1 and National ID at Nakuru CRS counter. All particulars verified for civil registration under Section 29 of the Kenya Data Protection Act 2019.
          </span>
        </label>

        <div className="form-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn quiet"
            onClick={() => handleSubmit(true)}
            disabled={busy}
          >
            <Save size={15} /> Save as Draft
          </button>

          <button type="submit" className="btn primary" disabled={busy}>
            <Send size={15} /> {busy ? "Submitting…" : "Submit & Issue Counter Slip"}
          </button>
        </div>
      </form>
    </section>
  );
}

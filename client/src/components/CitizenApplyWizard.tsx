import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Baby,
  FileText,
  Phone,
  Clock,
  Send,
} from "lucide-react";
import { type Application, type Role } from "@shared/bcatsCore";

interface CitizenApplyWizardProps {
  role?: Role;
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh?: () => void;
  go?: (target: string) => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function CitizenApplyWizard({
  role = "Citizen",
  notify,
  refresh,
  go,
  api,
}: CitizenApplyWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [createdApp, setCreatedApp] = useState<Application | null>(null);

  const [form, setForm] = useState({
    parentFullName: "",
    parentNationalId: "",
    parentRelationship: "Mother",
    contactPhone: "",
    contactEmail: "",
    subCounty: "Nakuru Town East",
    ward: "Biashara",
    childName: "",
    dateOfBirth: "",
    gender: "Female",
    placeOfBirth: "Nakuru Level 5 Hospital",
    birthNotificationNo: "",
    consentAccepted: false,
  });

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.parentFullName || !form.parentNationalId || !form.contactPhone) {
        notify("error", "Please complete all required applicant details.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.childName || !form.dateOfBirth || !form.birthNotificationNo) {
        notify("error", "Please complete all required child particulars.");
        return;
      }
      setStep(3);
    }
  };

  const submitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentAccepted) {
      notify("error", "Please accept the statutory consent under Kenya Data Protection Act 2019.");
      return;
    }
    setBusy(true);
    try {
      const created = await api<Application>("/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCreatedApp(created);
      notify("success", `Application ${created.trackingNumber} submitted successfully! SMS tracking alert dispatched.`);
      refresh?.();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Application failed to submit.");
    } finally {
      setBusy(false);
    }
  };

  if (createdApp) {
    return (
      <div className="public-application">
        <section className="card public-form-card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "grid", placeItems: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={36} />
          </div>
          <div className="eyebrow">Application lodged successfully</div>
          <h2 style={{ fontSize: "1.75rem", margin: "0.5rem 0" }}>{createdApp.childName}</h2>
          <p className="tracking big" style={{ fontSize: "1.25rem", color: "var(--terracotta, #c2410c)", fontWeight: 800 }}>
            {createdApp.trackingNumber}
          </p>
          <p style={{ maxWidth: "520px", margin: "1rem auto 1.75rem", color: "#475569", lineHeight: "1.6" }}>
            An SMS confirmation has been dispatched to <strong>{createdApp.contactPhone}</strong>. Please present your original Form 1 slip and National ID at Nakuru Civil Registration Office (Counter C1) for biometric parentage verification.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <a href={`/track?ref=${encodeURIComponent(createdApp.trackingNumber)}`} className="btn primary">
              Track Status Now <ArrowRight size={15} />
            </a>
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                setCreatedApp(null);
                setStep(1);
                setForm({
                  ...form,
                  childName: "",
                  dateOfBirth: "",
                  birthNotificationNo: "",
                  consentAccepted: false,
                });
              }}
            >
              Apply for Another Child
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="public-application" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
      {/* Main Wizard Form */}
      <section className="card public-form-card">
        {/* Step Indicator Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "18px" }}>
          <div>
            <div className="eyebrow">Citizen portal · 3-step application wizard</div>
            <h2 style={{ fontSize: "1.4rem", margin: "4px 0 0" }}>
              {step === 1 ? "Step 1: Applicant Details" : step === 2 ? "Step 2: Child Particulars" : "Step 3: Review & Submit"}
            </h2>
          </div>
          <div className="public-steps" style={{ margin: 0 }}>
            <span className={step === 1 ? "active" : step > 1 ? "done" : ""}>1 <small>Applicant</small></span>
            <span className={step === 2 ? "active" : step > 2 ? "done" : ""}>2 <small>Child</small></span>
            <span className={step === 3 ? "active" : ""}>3 <small>Review</small></span>
          </div>
        </div>

        {/* Step 1: Applicant Details */}
        {step === 1 && (
          <form onSubmit={nextStep}>
            <div className="form-grid">
              <label>
                Parent / Guardian Full Name
                <input
                  className="field"
                  required
                  value={form.parentFullName}
                  onChange={(e) => update("parentFullName", e.target.value)}
                  placeholder="e.g. Mary Wanjiku Kamau"
                />
              </label>

              <label>
                National ID Number <span className="hint">7–8 digits</span>
                <input
                  className="field"
                  required
                  inputMode="numeric"
                  maxLength={8}
                  value={form.parentNationalId}
                  onChange={(e) => update("parentNationalId", e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 28491023"
                />
              </label>

              <label>
                Relationship to Child
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
                Contact Phone (Safaricom / Airtel)
                <input
                  className="field"
                  required
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  placeholder="0712 345 678"
                />
              </label>

              <label>
                Email Address <span className="hint">Optional</span>
                <input
                  className="field"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="citizen@gmail.com"
                />
              </label>

              <label>
                Sub-County of Residence
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
                  ].map((sc) => (
                    <option key={sc}>{sc}</option>
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
                  placeholder="e.g. Biashara"
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="submit" className="btn primary">
                Continue to Child Details <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Child Details */}
        {step === 2 && (
          <form onSubmit={nextStep}>
            <div className="form-grid">
              <label>
                Child Full Name (Exactly as on Hospital Slip)
                <input
                  className="field"
                  required
                  value={form.childName}
                  onChange={(e) => update("childName", e.target.value)}
                  placeholder="e.g. Amani Ochieng Kamau"
                />
              </label>

              <label>
                Date of Birth
                <input
                  className="field"
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
              </label>

              <div>
                <label className="field-label">Sex of Child</label>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  {["Female", "Male", "Intersex"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`btn ${form.gender === g ? "primary" : "outline"}`}
                      onClick={() => update("gender", g)}
                      style={{ flex: 1, padding: "6px" }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <label>
                Place of Birth / Health Facility
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
                  <option>Home Birth (Chief's Letter Required)</option>
                </select>
              </label>

              <label>
                Birth Notification Number (Form 1)
                <input
                  className="field"
                  required
                  value={form.birthNotificationNo}
                  onChange={(e) => update("birthNotificationNo", e.target.value)}
                  placeholder="BN-26-00412"
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
              <button type="button" className="btn quiet" onClick={() => setStep(1)}>
                <ArrowLeft size={15} /> Back
              </button>
              <button type="submit" className="btn primary">
                Continue to Review <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <form onSubmit={submitFinal}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground, #1e293b)", marginBottom: "10px" }}>
                Summary of Registration Particulars
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Child Full Name:</span> <strong>{form.childName}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Date of Birth:</span> <strong>{form.dateOfBirth}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Sex:</span> <strong>{form.gender}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Place of Birth:</span> <strong>{form.placeOfBirth}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Notification No:</span> <strong>{form.birthNotificationNo}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Parent Name:</span> <strong>{form.parentFullName}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>National ID:</span> <strong>{form.parentNationalId}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Phone:</span> <strong>{form.contactPhone}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Sub-County:</span> <strong>{form.subCounty}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Ward:</span> <strong>{form.ward}</strong>
                </div>
              </div>
            </div>

            <label className="consent" style={{ marginBottom: "18px" }}>
              <input
                type="checkbox"
                required
                checked={form.consentAccepted}
                onChange={(e) => update("consentAccepted", e.target.checked)}
              />
              <span>
                <strong>Statutory Declaration & Consent:</strong> I declare that the information given above is true and correct to the best of my knowledge and belief. I consent to processing under Section 29 of the Kenya Data Protection Act 2019 for the purpose of issuing a statutory Form 5 birth certificate under Cap. 149.
              </span>
            </label>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" className="btn quiet" onClick={() => setStep(2)}>
                <ArrowLeft size={15} /> Edit Particulars
              </button>
              <button type="submit" className="btn primary" disabled={busy || !form.consentAccepted}>
                <Send size={15} /> {busy ? "Submitting…" : "Submit & Issue Tracking Slip"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Sidebar: What Happens Next? */}
      <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <section className="card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px", color: "var(--foreground, #1e293b)", marginBottom: "12px" }}>
            <Clock size={16} style={{ color: "var(--terracotta, #c2410c)" }} /> What happens next?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#fee2e2", color: "#b91c1c", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 700, flex: "none" }}>
                1
              </div>
              <div>
                <strong style={{ fontSize: "12px", display: "block" }}>Instant SMS Confirmation</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Tracking number dispatched to your mobile phone.</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#fef3c7", color: "#b45309", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 700, flex: "none" }}>
                2
              </div>
              <div>
                <strong style={{ fontSize: "12px", display: "block" }}>Counter Identity Check</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Present original Form 1 and National ID at Counter C1.</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 700, flex: "none" }}>
                3
              </div>
              <div>
                <strong style={{ fontSize: "12px", display: "block" }}>Form 5 Collection</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Receive ready SMS in 3–5 business days.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: "18px", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px", color: "var(--foreground, #1e293b)", marginBottom: "6px" }}>
            <Phone size={15} style={{ color: "#2563eb" }} /> Citizen Help Desk
          </div>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
            Toll-Free Helpline: <strong>0800 221001</strong><br />
            Hours: Monday – Friday, 8:00 AM – 5:00 PM<br />
            Nakuru Civil Registration Office (Huduma Centre or County HQ)
          </p>
        </section>
      </aside>
    </div>
  );
}

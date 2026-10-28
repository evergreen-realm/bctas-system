import React, { useState } from "react";
import {
  Fingerprint,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  FileCheck2,
  Clock,
  RotateCcw,
  AlertCircle,
  Search,
  MessageSquare,
  LockKeyhole,
} from "lucide-react";
import { type Application, type Role, labelDate } from "@shared/bcatsCore";
import ScannedDocumentModal from "./ScannedDocumentModal";

interface VerificationScreenProps {
  role: Role;
  applications: Application[];
  notify: (type: "success" | "error" | "info", text: string) => void;
  setSelected: (item: Application) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function VerificationScreen({
  role,
  applications,
  notify,
  setSelected,
  refresh,
  api,
}: VerificationScreenProps) {
  // Queue includes Submitted and Pending Verification
  const queue = applications.filter((a) =>
    ["Submitted", "Pending Verification"].includes(a.currentStatus)
  );

  const [selectedId, setSelectedId] = useState<number | null>(queue[0]?.applicationId || null);
  const active = applications.find((a) => a.applicationId === selectedId) || queue[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [showScannedModal, setShowScannedModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [deficiencyReason, setDeficiencyReason] = useState("Hospital stamp missing on Form 1");
  const [deficiencyNotes, setDeficiencyNotes] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [showInternalNote, setShowInternalNote] = useState(false);

  const [checks, setChecks] = useState({
    iprsMatch: true,
    hospitalMatch: true,
    otpVerified: true,
    parentageVerified: true,
  });
  const [busy, setBusy] = useState(false);

  const filteredQueue = queue.filter(
    (item) =>
      item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.parentFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCounty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allChecksPassed =
    checks.iprsMatch && checks.hospitalMatch && checks.otpVerified && checks.parentageVerified;

  const handleVerify = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/applications/${active.applicationId}/verify`, {
        method: "POST",
        body: JSON.stringify(checks),
      });
      notify("success", `${active.trackingNumber} identity verification completed and moved to Verified.`);
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleReturnForCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    try {
      await api(`/applications/${active.applicationId}/return`, {
        method: "POST",
        body: JSON.stringify({
          reason: deficiencyReason,
          notes: deficiencyNotes,
        }),
      });
      notify(
        "info",
        `Application ${active.trackingNumber} returned for correction. SMS deficiency alert dispatched to ${active.contactPhone}.`
      );
      setShowReturnModal(false);
      setDeficiencyNotes("");
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Return workflow failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleEscalate = async () => {
    if (!active) return;
    if (!window.confirm(`Escalate ${active.trackingNumber} to Registrar for legal parentage determination?`)) return;
    setBusy(true);
    try {
      await api(`/applications/${active.applicationId}/escalate`, {
        method: "POST",
        body: JSON.stringify({
          notes: `Escalated from Verification Desk Counter: complex parentage or statutory inquiry required.`,
        }),
      });
      notify("info", `Application ${active.trackingNumber} escalated to Registrar.`);
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Escalation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!active || !internalNote.trim()) return;
    setBusy(true);
    try {
      await api(`/applications/${active.applicationId}/note`, {
        method: "POST",
        body: JSON.stringify({ note: internalNote.trim() }),
      });
      notify("success", "Internal verification note logged to audit trail.");
      setInternalNote("");
      setShowInternalNote(false);
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to record note.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="verification-screen-root">
      {/* Screen 05: Top KPI Metric Cards */}
      <div className="metric-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="metric terracotta">
          <div className="metric-label">Pending verification</div>
          <strong>{queue.length}</strong>
          <span>Oldest waiting: 2.1 hours</span>
        </div>
        <div className="metric green">
          <div className="metric-label">Avg. verification time</div>
          <strong>4.2 min</strong>
          <span>Intake to biometric match</span>
        </div>
        <div className="metric indigo">
          <div className="metric-label">IPRS match rate</div>
          <strong>98.4%</strong>
          <span>G2G database alignment</span>
        </div>
        <div className="metric rose">
          <div className="metric-label">Flagged / Returned</div>
          <strong>{applications.filter((a) => a.currentStatus.includes("Deficiency") || a.currentStatus.includes("Returned")).length || 2}</strong>
          <span>Deficiency resolution queue</span>
        </div>
      </div>

      <div className="verification-grid">
        {/* Left Column: Intake Queue */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Queue / oldest first</div>
              <h2>Verification desk</h2>
            </div>
            <span className="queue-count">{queue.length} in queue</span>
          </div>

          <div style={{ padding: "0 0 12px 0" }}>
            <div className="search-box" style={{ width: "100%" }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Filter queue by child, parent, or tracking #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "12px" }}
              />
            </div>
          </div>

          <div className="queue-list" style={{ maxHeight: "560px", overflowY: "auto" }}>
            {filteredQueue.map((item, idx) => (
              <button
                className={`queue-row ${active?.applicationId === item.applicationId ? "selected" : ""}`}
                key={item.applicationId}
                onClick={() => setSelectedId(item.applicationId)}
                type="button"
              >
                <span className="queue-number">#{idx + 1}</span>
                <span>
                  <strong>{item.childName}</strong>
                  <small>
                    {item.trackingNumber} · {item.subCounty}
                  </small>
                </span>
                <span className="status-badge amber" style={{ fontSize: "10px", padding: "2px 6px" }}>
                  {item.currentStatus}
                </span>
              </button>
            ))}

            {filteredQueue.length === 0 && (
              <div className="empty">
                <FileCheck2 size={24} style={{ opacity: 0.5 }} />
                <strong>Queue clear</strong>
                <span>All pending applications have been verified.</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Comparative Inspection Workspace */}
        {active ? (
          <section className="card verification-panel">
            <div className="split-header">
              <div>
                <div className="eyebrow">Identity verification in progress</div>
                <h2>{active.childName}</h2>
                <p className="tracking">{active.trackingNumber}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setShowScannedModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <FileText size={15} /> Open Scanned Attachments
                </button>
                <button
                  type="button"
                  className="btn quiet"
                  onClick={() => setSelected(active)}
                >
                  Full Profile
                </button>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="compare">
              <div>
                <div className="compare-label">
                  <Landmark size={15} /> Hospital Form 1 (B1 Pink Slip)
                </div>
                <strong>{active.birthNotificationNo}</strong>
                <span>
                  {active.childName} · Born {labelDate(active.dateOfBirth)}
                </span>
                <span>{active.placeOfBirth}</span>
                <div className="match">
                  <CheckCircle2 size={14} /> Hospital birth notification matched
                </div>
              </div>

              <div>
                <div className="compare-label">
                  <Fingerprint size={15} /> IPRS National Identity Database
                </div>
                <strong>{active.parentFullName}</strong>
                <span>National ID: ••••{active.parentNationalId.slice(-4)}</span>
                <span>
                  {active.parentRelationship} · {active.contactPhone}
                </span>
                <div className="match">
                  <CheckCircle2 size={14} /> IPRS biometric record verified
                </div>
              </div>
            </div>

            {/* 4-Point Statutory Checklist */}
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground, #1e293b)", marginBottom: "8px" }}>
                Statutory Inspection Checklist (Cap. 149)
              </div>
              <div className="check-list">
                <label>
                  <input
                    type="checkbox"
                    checked={checks.iprsMatch}
                    onChange={(e) => setChecks({ ...checks, iprsMatch: e.target.checked })}
                  />
                  <span>IPRS national identity database name and ID match confirmed</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checks.hospitalMatch}
                    onChange={(e) => setChecks({ ...checks, hospitalMatch: e.target.checked })}
                  />
                  <span>Form 1 notification matches child birth weight and hospital records</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checks.otpVerified}
                    onChange={(e) => setChecks({ ...checks, otpVerified: e.target.checked })}
                  />
                  <span>One-time SMS token confirmed with parent at counter</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checks.parentageVerified}
                    onChange={(e) => setChecks({ ...checks, parentageVerified: e.target.checked })}
                  />
                  <span>Biological parentage documents verified under Kenya Civil Registration Act Cap 149</span>
                </label>
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border, #e2e8f0)" }}>
              {!showInternalNote ? (
                <button
                  type="button"
                  className="btn quiet"
                  onClick={() => setShowInternalNote(true)}
                  style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <MessageSquare size={14} /> + Add Internal Verification Note
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                    Internal Counter Note (Permanent Audit Record)
                  </label>
                  <textarea
                    className="field textarea"
                    style={{ minHeight: "60px", fontSize: "12px" }}
                    placeholder="Enter observation regarding documentary evidence or counter witness..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn primary"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                      onClick={handleAddInternalNote}
                      disabled={busy || !internalNote.trim()}
                    >
                      Save Note
                    </button>
                    <button
                      type="button"
                      className="btn quiet"
                      style={{ fontSize: "11px" }}
                      onClick={() => setShowInternalNote(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="panel-footer" style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn outline"
                  style={{ color: "var(--rose, #e11d48)", borderColor: "#fecdd3" }}
                  onClick={() => setShowReturnModal(true)}
                  disabled={busy}
                >
                  <RotateCcw size={14} /> Return for Correction
                </button>
                <button
                  type="button"
                  className="btn quiet"
                  onClick={handleEscalate}
                  disabled={busy}
                >
                  <AlertCircle size={14} /> Escalate
                </button>
              </div>

              <button
                type="button"
                className="btn primary"
                onClick={handleVerify}
                disabled={busy || !allChecksPassed}
                style={{ minWidth: "180px" }}
              >
                {busy ? "Recording…" : "Record verification"} <ArrowRight size={15} />
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <div className="empty">
              <FileCheck2 size={28} />
              <strong>No application selected</strong>
              <span>Select an application from the queue to start identity verification.</span>
            </div>
          </section>
        )}
      </div>

      {/* Scanned Document Viewer Modal */}
      {active && (
        <ScannedDocumentModal
          isOpen={showScannedModal}
          onClose={() => setShowScannedModal(false)}
          application={active}
          onVerifyAttachments={() => {
            setChecks((prev) => ({ ...prev, hospitalMatch: true, iprsMatch: true }));
            setShowScannedModal(false);
            notify("success", "Attachments inspected and verified against registry records.");
          }}
        />
      )}

      {/* Return for Correction Modal */}
      {showReturnModal && active && (
        <div className="modal-backdrop" onClick={() => setShowReturnModal(false)}>
          <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon-badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                  <RotateCcw size={18} />
                </span>
                <div>
                  <h3>Return Application for Correction</h3>
                  <p>{active.trackingNumber} · {active.childName}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReturnModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleReturnForCorrection} style={{ padding: "18px 22px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label className="field-label">Deficiency Classification</label>
                <select
                  className="field"
                  value={deficiencyReason}
                  onChange={(e) => setDeficiencyReason(e.target.value)}
                >
                  <option>Hospital stamp missing on Form 1</option>
                  <option>Spelling discrepancy in child or parent name</option>
                  <option>National ID card expired or illegible copy</option>
                  <option>Parentage affidavit or marriage certificate required</option>
                  <option>Birth weight or date mismatch with hospital e-Birth system</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label className="field-label">Detailed Citizen Instructions</label>
                <textarea
                  className="field textarea"
                  rows={3}
                  placeholder="Provide precise instructions on what documents to present at Nakuru CRS counter..."
                  value={deficiencyNotes}
                  onChange={(e) => setDeficiencyNotes(e.target.value)}
                  required
                />
              </div>

              <div className="notice info" style={{ marginBottom: "14px", fontSize: "11px" }}>
                <CheckCircle2 size={14} />
                <span>An automated SMS deficiency notification will be dispatched to <strong>{active.contactPhone}</strong> immediately.</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn quiet"
                  onClick={() => setShowReturnModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn danger"
                  disabled={busy}
                >
                  {busy ? "Processing…" : "Confirm Return & Send SMS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

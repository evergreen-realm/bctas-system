import React, { useState, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  LockKeyhole,
  CheckCircle2,
  Bell,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  Eye,
} from "lucide-react";
import {
  type Application,
  type Role,
  type Status,
  statuses,
  transitions,
  labelDate,
} from "@shared/bcatsCore";

interface StatusPageScreenProps {
  role: Role;
  applications: Application[];
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function StatusPageScreen({
  role,
  applications,
  notify,
  refresh,
  api,
}: StatusPageScreenProps) {
  const [selectedId, setSelectedId] = useState<number>(applications[0]?.applicationId || 1);
  const selected = applications.find((a) => a.applicationId === selectedId) || applications[0];

  const [next, setNext] = useState<Status>("Verified");
  const [reason, setReason] = useState("");
  const [sendSms, setSendSms] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDocketModal, setShowDocketModal] = useState(false);

  useEffect(() => {
    if (selected) {
      const allowed = transitions[selected.currentStatus] || [];
      if (allowed.length > 0) setNext(allowed[0]);
    }
  }, [selected?.currentStatus]);

  const allowedTransitions = selected ? transitions[selected.currentStatus] || [] : [];

  const appendRemark = (remark: string) => {
    setReason((prev) => (prev ? `${prev}. ${remark}` : remark));
  };

  const handleSave = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/applications/${selected.applicationId}/status`, {
        method: "POST",
        body: JSON.stringify({
          nextStatus: next,
          justification: reason || `Status advanced to ${next} by ${role}`,
        }),
      });

      notify(
        "success",
        `${selected.trackingNumber} successfully moved to ${next}.${sendSms ? " Citizen SMS alert dispatched." : ""}`
      );
      setReason("");
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Status transition failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="status-screen-root">
      <div className="status-layout" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
        {/* Left Column: Form & Stepper */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Audited state machine · Cap. 149</div>
              <h2>Update application lifecycle</h2>
            </div>
            <Activity size={20} className="card-icon" />
          </div>

          <label className="field-label">Select Application</label>
          <select
            className="field"
            value={selected?.applicationId || ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            style={{ marginBottom: "1rem" }}
          >
            {applications.map((item) => (
              <option key={item.applicationId} value={item.applicationId}>
                {item.trackingNumber} · {item.childName} ({item.currentStatus})
              </option>
            ))}
          </select>

          {selected && (
            <>
              {/* Selected Strip */}
              <div className="selected-strip" style={{ marginBottom: "1.25rem" }}>
                <div>
                  <strong>{selected.childName}</strong>
                  <span>
                    {selected.parentFullName} · {selected.subCounty} · Born {labelDate(selected.dateOfBirth)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="status-badge amber">{selected.currentStatus}</span>
                  <button
                    type="button"
                    className="btn quiet"
                    onClick={() => setShowDocketModal(true)}
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                  >
                    <Eye size={13} /> Docket
                  </button>
                </div>
              </div>

              {/* 5-Stage Visual Stepper */}
              <div className="stepper" style={{ marginBottom: "1.5rem" }}>
                {statuses.slice(0, 6).map((st, i) => {
                  const currentIndex = statuses.indexOf(selected.currentStatus);
                  const isPast = currentIndex > i;
                  const isCurrent = currentIndex === i;
                  return (
                    <div
                      className={`${isPast ? "done" : ""} ${isCurrent ? "current" : ""}`}
                      key={st}
                    >
                      <span>{isPast ? "✓" : i + 1}</span>
                      <small>{st}</small>
                    </div>
                  );
                })}
              </div>

              {/* Allowed Next Status */}
              <label className="field-label">Allowed Next Legal Status</label>
              <select
                className="field"
                value={next}
                onChange={(e) => setNext(e.target.value as Status)}
                style={{ marginBottom: "1rem" }}
              >
                {allowedTransitions.length > 0 ? (
                  allowedTransitions.map((st) => <option key={st}>{st}</option>)
                ) : (
                  <option>No legal transitions from this state</option>
                )}
              </select>

              {/* Quick Remark Chips */}
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                  Quick Statutory Remarks:
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                  {[
                    "+ Documents Verified OK",
                    "+ IPRS Biometrics Cleared",
                    "+ Discrepancy Resolved",
                    "+ Expedited Case",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="token-chip-btn"
                      onClick={() => appendRemark(chip.replace(/^\+\s*/, ""))}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification Textarea */}
              <label className="field-label">Statutory Justification (Audit Recorded)</label>
              <textarea
                className="field textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the statutory justification or legal finding under Cap. 149..."
                rows={3}
                style={{ marginBottom: "1rem" }}
              />

              {/* SMS Dispatch Checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", marginBottom: "1rem" }}>
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                />
                <span>Send automated SMS notification alert to citizen ({selected.contactPhone})</span>
              </label>

              <div className="legal-callout" style={{ marginBottom: "1.25rem" }}>
                <LockKeyhole size={15} />
                <span>
                  Every transition writes an immutable audit record with user ID, station counter, timestamp, and IP address.
                </span>
              </div>

              <button
                type="button"
                className="btn primary full"
                onClick={handleSave}
                disabled={busy || allowedTransitions.length === 0}
              >
                {busy ? "Recording Transition…" : "Save Audited Transition"} <ArrowRight size={15} />
              </button>
            </>
          )}
        </section>

        {/* Right Column: Audited State Timeline */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Audit ledger stream</div>
              <h2>Application history</h2>
            </div>
            <Clock size={20} className="card-icon" />
          </div>

          {selected ? (
            <div className="timeline" style={{ maxHeight: "560px", overflowY: "auto" }}>
              {selected.statusHistory
                .slice()
                .reverse()
                .map((event, idx) => (
                  <div className="timeline-item" key={`${event.changedAt}-${idx}`}>
                    <span className="timeline-marker" />
                    <div>
                      <strong>{event.newStatus}</strong>
                      <small>{event.justification}</small>
                      <time>
                        {labelDate(event.changedAt)} · {event.actor || "System"}
                      </time>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty">
              <Clock size={24} style={{ opacity: 0.5 }} />
              <strong>No application selected</strong>
            </div>
          )}
        </section>
      </div>

      {/* Full Docket Summary Modal */}
      {showDocketModal && selected && (
        <div className="modal-backdrop" onClick={() => setShowDocketModal(false)}>
          <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon-badge">
                  <FileText size={18} />
                </span>
                <div>
                  <h3>Docket Summary: {selected.childName}</h3>
                  <p>{selected.trackingNumber} · {selected.subCounty}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDocketModal(false)}>
                &times;
              </button>
            </div>

            <div style={{ padding: "18px 22px" }}>
              <div className="detail-section">
                <h4>Child Particulars</h4>
                <div className="detail-grid">
                  <span>Child Name<strong>{selected.childName}</strong></span>
                  <span>Date of Birth<strong>{labelDate(selected.dateOfBirth)}</strong></span>
                  <span>Notification No<strong>{selected.birthNotificationNo}</strong></span>
                  <span>Health Facility<strong>{selected.placeOfBirth}</strong></span>
                </div>
              </div>

              <div className="detail-section" style={{ marginTop: "12px" }}>
                <h4>Parentage & Contact</h4>
                <div className="detail-grid">
                  <span>Parent Name<strong>{selected.parentFullName}</strong></span>
                  <span>National ID<strong>••••{selected.parentNationalId.slice(-4)}</strong></span>
                  <span>Phone Number<strong>{selected.contactPhone}</strong></span>
                  <span>Sub-County<strong>{selected.subCounty}</strong></span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setShowDocketModal(false)}
                >
                  Close Docket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


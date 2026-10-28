import React, { useState } from "react";
import {
  Printer,
  LockKeyhole,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  Download,
  Search,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { type Application, type Role, labelDate } from "@shared/bcatsCore";
import BirthCertificatePreview from "./BirthCertificatePreview";

interface PrintingScreenProps {
  role: Role;
  applications: Application[];
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function PrintingScreen({
  role,
  applications,
  notify,
  refresh,
  api,
}: PrintingScreenProps) {
  const readyQueue = applications.filter((a) => a.currentStatus === "Approved");
  const printedToday = applications.filter((a) => a.currentStatus === "Printed" || a.currentStatus === "Collected");

  const [selectedId, setSelectedId] = useState<number | null>(readyQueue[0]?.applicationId || null);
  const active = applications.find((a) => a.applicationId === selectedId) || readyQueue[0];

  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredQueue = readyQueue.filter(
    (item) =>
      item.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.childName.toLowerCase().includes(search.toLowerCase()) ||
      item.parentFullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleIssuePrint = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/applications/${active.applicationId}/print`, { method: "POST" });
      notify(
        "success",
        `Form 5 security certificate issued for ${active.childName} (${active.trackingNumber}). Status moved to Printed.`
      );
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Printing failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="printing-screen-root">
      {/* Screen 06 Top KPI Cards */}
      <div className="metric-grid no-print" style={{ marginBottom: "1.5rem" }}>
        <div className="metric terracotta">
          <div className="metric-label">Ready for print</div>
          <strong>{readyQueue.length}</strong>
          <span>Approved by Registrar</span>
        </div>
        <div className="metric green">
          <div className="metric-label">Printed today</div>
          <strong>{printedToday.length || 18}</strong>
          <span>Serial range: NKS-SEC-99200+</span>
        </div>
        <div className="metric indigo">
          <div className="metric-label">Security paper stock</div>
          <strong>248 sheets</strong>
          <span>Batch #SEC-88412</span>
        </div>
        <div className="metric emerald">
          <div className="metric-label">Station seal status</div>
          <strong>Active</strong>
          <span>Seal #NKS-SEC-99214</span>
        </div>
      </div>

      <div className="printing-workspace-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Left Column: Approved Queue */}
        <section className="card no-print" style={{ height: "fit-content" }}>
          <div className="card-head">
            <div>
              <div className="eyebrow">Approved queue / FIFO</div>
              <h2>Printing queue</h2>
            </div>
            <span className="queue-count">{readyQueue.length} ready</span>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div className="search-box" style={{ width: "100%" }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search approved queue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <div className="print-icon" style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#f1f5f9", display: "grid", placeItems: "center", color: "#475569" }}>
                  <Printer size={16} />
                </div>
                <span>
                  <strong>{item.childName}</strong>
                  <small>
                    {item.trackingNumber} · Approved {labelDate(item.lastUpdated)}
                  </small>
                </span>
                <span className="status-badge emerald" style={{ fontSize: "10px", padding: "2px 6px" }}>
                  Approved
                </span>
              </button>
            ))}

            {filteredQueue.length === 0 && (
              <div className="empty">
                <FileCheck2 size={24} style={{ opacity: 0.5 }} />
                <strong>Queue clear</strong>
                <span>All approved certificates have been printed.</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Live Form 5 Certificate Preview */}
        <div className="printing-preview-column">
          {active ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Form 5 Security Preview */}
              <BirthCertificatePreview
                application={active}
                onPrint={() => window.print()}
              />

              {/* Print Confirmation Bar */}
              <section className="card no-print" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground, #1e293b)" }}>
                      Physical Security Instrument Issue Protocol
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted, #64748b)" }}>
                      Issuing assigns serial <code>NKS-SEC-99214</code>, seals digital record, advances state to <strong>Printed</strong>, and triggers collection SMS.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="btn outline"
                      onClick={() => window.print()}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Printer size={15} /> Print Form 5
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={handleIssuePrint}
                      disabled={busy}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {busy ? "Sealing Record…" : "Issue Form 5 & Complete Print"} <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="card">
              <div className="empty">
                <Printer size={32} />
                <strong>No approved application selected</strong>
                <span>Select an approved record from the queue to render the Form 5 security instrument.</span>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState } from "react";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Download,
  Printer,
  ArrowRight,
  ShieldCheck,
  FileText,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { type Application, type Role, labelDate } from "@shared/bcatsCore";
import { ConfirmCollectionModal, ViewReceiptModal } from "./CollectionModal";

interface CollectionScreenProps {
  role: Role;
  applications: Application[];
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function CollectionScreen({
  role,
  applications,
  notify,
  refresh,
  api,
}: CollectionScreenProps) {
  const readyQueue = applications.filter((a) => a.currentStatus === "Printed");
  const collectedToday = applications.filter((a) => a.currentStatus === "Collected");

  const [selectedId, setSelectedId] = useState<number | null>(readyQueue[0]?.applicationId || null);
  const active = applications.find((a) => a.applicationId === selectedId) || readyQueue[0];

  const [search, setSearch] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptApp, setReceiptApp] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  const filteredQueue = readyQueue.filter(
    (item) =>
      item.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.childName.toLowerCase().includes(search.toLowerCase()) ||
      item.parentFullName.toLowerCase().includes(search.toLowerCase()) ||
      (item.certificate?.certificateNumber &&
        item.certificate.certificateNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConfirmCollection = async (data: {
    collectorName: string;
    collectorNationalId: string;
    collectorRelationship: string;
    collectorIdVerified: boolean;
    ledgerSignatureConfirmed: boolean;
    ledger: {
      volume: string;
      page: string;
      entry: string;
      issuingDesk: string;
    };
  }) => {
    if (!active) return;
    setBusy(true);
    try {
      const updated = await api<Application>(`/applications/${active.applicationId}/collect`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      notify(
        "success",
        `Physical handover completed for ${active.childName}. Ledger entry recorded: ${data.ledger.volume}/${data.ledger.page}/${data.ledger.entry}. SMS confirmation dispatched.`
      );
      setShowConfirmModal(false);
      setReceiptApp(updated);
      setShowReceiptModal(true);
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Handover failed.");
    } finally {
      setBusy(false);
    }
  };

  const exportHandoverCsv = () => {
    const rows = [
      ["Tracking Number", "Child Name", "Parent Name", "Parent ID", "Certificate No", "Security Serial", "Status", "Issue Date"],
      ...readyQueue.map((a) => [
        a.trackingNumber,
        a.childName,
        a.parentFullName,
        a.parentNationalId,
        a.certificate?.certificateNumber || "N/A",
        a.certificate?.securitySerialNumber || "N/A",
        a.currentStatus,
        a.certificate?.issuedDate ? labelDate(a.certificate.issuedDate) : "N/A",
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BCATS_Collection_Queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("info", "Collection queue CSV exported.");
  };

  return (
    <div className="collection-screen-root">
      {/* Top KPI Cards */}
      <div className="metric-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="metric terracotta">
          <div className="metric-label">Ready for handover</div>
          <strong>{readyQueue.length}</strong>
          <span>Printed & awaiting parent</span>
        </div>
        <div className="metric green">
          <div className="metric-label">Handed over today</div>
          <strong>{collectedToday.length || 14}</strong>
          <span>Biometric & ID matched</span>
        </div>
        <div className="metric indigo">
          <div className="metric-label">Register ledger active</div>
          <strong>Vol. 42 / Pg 118</strong>
          <span>Entry #14 · Desk 3</span>
        </div>
        <div className="metric rose">
          <div className="metric-label">Overdue &gt; 14 days</div>
          <strong>3</strong>
          <span>Automated SMS reminder sent</span>
        </div>
      </div>

      <div className="collection-workspace-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Left Column: Printed Handover Queue */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Handover queue</div>
              <h2>Ready for collection</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="btn quiet"
                onClick={exportHandoverCsv}
                title="Export CSV"
                style={{ padding: "4px 8px", fontSize: "11px" }}
              >
                <Download size={13} /> Export CSV
              </button>
              <span className="queue-count">{readyQueue.length}</span>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div className="search-box" style={{ width: "100%" }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search collection queue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: "12px" }}
              />
            </div>
          </div>

          <div className="queue-list" style={{ maxHeight: "560px", overflowY: "auto" }}>
            {filteredQueue.map((item) => (
              <button
                className={`queue-row ${active?.applicationId === item.applicationId ? "selected" : ""}`}
                key={item.applicationId}
                onClick={() => setSelectedId(item.applicationId)}
                type="button"
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#f0fdf4", display: "grid", placeItems: "center", color: "#16a34a" }}>
                  <ClipboardCheck size={16} />
                </div>
                <span>
                  <strong>{item.childName}</strong>
                  <small>
                    {item.trackingNumber} · Cert: {item.certificate?.certificateNumber || "BC-2026-..."}
                  </small>
                </span>
                <span className="status-badge green" style={{ fontSize: "10px", padding: "2px 6px" }}>
                  Printed
                </span>
              </button>
            ))}

            {filteredQueue.length === 0 && (
              <div className="empty">
                <FileCheck2 size={24} style={{ opacity: 0.5 }} />
                <strong>No certificates awaiting collection</strong>
                <span>Printed certificates ready for collection will appear here.</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Physical Handover Inspection */}
        {active ? (
          <section className="card">
            <div className="card-head">
              <div>
                <div className="eyebrow">Biometric and identity handover</div>
                <h2>Record certificate delivery</h2>
              </div>
              <ClipboardCheck size={22} className="card-icon" />
            </div>

            <div className="selected-strip">
              <div>
                <strong>{active.childName}</strong>
                <span>
                  Certificate: <code>{active.certificate?.certificateNumber || "BC-2026-004812"}</code> · Security Serial: <code>{active.certificate?.securitySerialNumber || "NKS-SEC-99214"}</code>
                </span>
              </div>
              <span className="status-badge green">Printed & Verified</span>
            </div>

            <div className="detail-section" style={{ marginTop: "1rem" }}>
              <div className="detail-grid">
                <span>
                  Parent / Guardian Full Name
                  <strong>{active.parentFullName}</strong>
                </span>
                <span>
                  Registered National ID
                  <strong>••••{active.parentNationalId.slice(-4)}</strong>
                </span>
                <span>
                  Parent Contact Phone
                  <strong>{active.contactPhone}</strong>
                </span>
                <span>
                  Relationship
                  <strong>{active.parentRelationship}</strong>
                </span>
              </div>
            </div>

            <div className="detail-section" style={{ marginTop: "1rem" }}>
              <div className="detail-grid">
                <span>
                  Certificate Issue Date
                  <strong>{labelDate(active.certificate?.issuedDate || active.lastUpdated)}</strong>
                </span>
                <span>
                  Physical Ledger Coordinates
                  <strong style={{ color: "var(--terracotta, #c2410c)" }}>Vol. 42 / Page 118 / Entry 14</strong>
                </span>
                <span>
                  Issuing Station Desk
                  <strong>Nakuru CRS Counter C3</strong>
                </span>
                <span>
                  Paper Stock Security Mark
                  <strong>Watermark Verified (#SEC-88412)</strong>
                </span>
              </div>
            </div>

            <div className="legal-callout" style={{ marginTop: "1.25rem" }}>
              <Fingerprint size={16} />
              <span>
                <strong>Statutory Handover Mandate (Cap. 149):</strong> Inspect the collector's original physical National ID card and compare photographic likeness. Confirm physical entry in the Nakuru Sub-County Births Register before handover.
              </span>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {active.certificate?.collectorName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--green, #16a34a)", fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Handed over to {active.certificate.collectorName}
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                  Awaiting collector arrival at Counter C3
                </div>
              )}

              <button
                type="button"
                className="btn primary"
                onClick={() => setShowConfirmModal(true)}
                disabled={busy}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <UserCheck size={16} /> Confirm Physical Handover <ArrowRight size={15} />
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <div className="empty">
              <ClipboardCheck size={32} />
              <strong>Select a certificate</strong>
              <span>Choose an application from the handover queue to begin delivery confirmation.</span>
            </div>
          </section>
        )}
      </div>

      {/* Confirm Collection Modal */}
      {showConfirmModal && active && (
        <ConfirmCollectionModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          application={active}
          onConfirm={handleConfirmCollection}
          busy={busy}
        />
      )}

      {/* Handover Voucher Receipt Modal */}
      {showReceiptModal && receiptApp && (
        <ViewReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          application={receiptApp}
        />
      )}
    </div>
  );
}

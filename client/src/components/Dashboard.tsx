import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Fingerprint,
  Gauge,
  MapPin,
  Printer,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import {
  type Application,
  type Role,
  type AuditEntry,
  type Overview,
  type StaffUser,
  statuses,
  statusTone,
  labelDate,
} from "@shared/bcatsCore";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${statusTone[status] || "slate"}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-label">{label}</div>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

function Table({
  items,
  onSelect,
}: {
  items: Application[];
  onSelect?: (item: Application) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentItems = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tracking No</th>
            <th>Applicant Name</th>
            <th>Child Name</th>
            <th>Date Submitted</th>
            <th>Sub-county</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item) => (
            <tr key={item.applicationId} onClick={() => onSelect?.(item)}>
              <td>
                <strong className="tracking">{item.trackingNumber}</strong>
                <small>{item.birthNotificationNo}</small>
              </td>
              <td>
                <strong>{item.parentFullName}</strong>
                <small className="relation-tag">
                  {item.parentRelationship} (ID: {item.parentNationalId})
                </small>
              </td>
              <td>
                <strong>{item.childName}</strong>
                <small>{item.gender} · {labelDate(item.dateOfBirth)}</small>
              </td>
              <td>
                <span className="timestamp-text">
                  {labelDate(item.submittedDate)}, 09:15 AM
                </span>
              </td>
              <td>{item.subCounty}</td>
              <td>
                <StatusBadge status={item.currentStatus} />
              </td>
              <td>
                <span className="action-pill">
                  View <ChevronRight size={14} className="row-arrow" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="empty">
          <strong>No matching records in queue</strong>
          <span>This workstation queue is currently clear.</span>
        </div>
      )}

      {/* Pagination Footer matching Wireframe 08 */}
      <div className="table-pagination-bar">
        <span className="pagination-summary">
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, items.length)} of {items.length} applications registered in Nakuru Central
        </span>

        <div className="pagination-controls">
          <button
            className="pag-btn"
            disabled={page === 1}
            onClick={(e) => {
              e.stopPropagation();
              setPage((p) => Math.max(1, p - 1));
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`pag-num ${num === page ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setPage(num);
              }}
            >
              {num}
            </button>
          ))}
          <button
            className="pag-btn"
            disabled={page === totalPages}
            onClick={(e) => {
              e.stopPropagation();
              setPage((p) => Math.min(totalPages, p + 1));
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  role,
  currentUser,
  overview,
  applications,
  auditEntries,
  go,
  setSelected,
}: {
  role: Role;
  currentUser: StaffUser;
  overview: Overview;
  applications: Application[];
  auditEntries: AuditEntry[];
  go: (path: string) => void;
  setSelected: (item: Application) => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);

  // Role-specific queue filtering
  const queue = useMemo(() => {
    switch (role) {
      case "Clerk":
        return applications.filter((item) =>
          ["Submitted", "Pending Verification"].includes(item.currentStatus)
        );
      case "Registrar":
        return applications.filter((item) =>
          ["Verified", "Approved"].includes(item.currentStatus)
        );
      case "Auditor":
        return applications.filter(
          (item) =>
            item.currentStatus === "Deficient" ||
            item.idVerificationStatus === "FLAGGED_MISMATCH" ||
            item.escalated ||
            Date.now() - Date.parse(item.lastUpdated) > 5 * 86400000
        );
      case "Administrator":
      default:
        return applications;
    }
  }, [applications, role]);

  const queueTitle = useMemo(() => {
    switch (role) {
      case "Clerk":
        return "Intake & Parentage Verification Queue";
      case "Registrar":
        return "Registrar Statutory Approval & Seal Queue";
      case "Auditor":
        return "High-Risk & Discrepancy Oversight Queue";
      case "Administrator":
      default:
        return "Recent Applications";
    }
  }, [role]);

  const queueSubtitle = useMemo(() => {
    switch (role) {
      case "Clerk":
        return "Actionable applications pending IPRS and clinic document audit.";
      case "Registrar":
        return "Verified files requiring statutory registration number assignment and Form 5 seal.";
      case "Auditor":
        return "Audit-flagged exceptions, overdue SLA files, and ID mismatches.";
      case "Administrator":
      default:
        return `Showing ${Math.min(5, applications.length)} of ${applications.length} total applications`;
    }
  }, [role, applications.length]);

  const renderMetrics = () => {
    if (role === "Clerk") {
      return (
        <div className="metric-grid">
          <Metric
            label="Awaiting verification"
            value={overview.counts["Pending Verification"] || 0}
            detail="Requires IPRS & hospital check"
            tone="amber"
          />
          <Metric
            label="Today's counter intakes"
            value={overview.today}
            detail="Applications recorded today"
            tone="green"
          />
          <Metric
            label="Cleared verification"
            value={overview.counts.Verified || 0}
            detail="Forwarded to Registrar"
            tone="teal"
          />
          <Metric
            label="Returned for correction"
            value={overview.counts.Deficient || 0}
            detail="Deficiency SMS sent to parent"
            tone="rose"
          />
        </div>
      );
    }

    if (role === "Registrar") {
      return (
        <div className="metric-grid">
          <Metric
            label="Pending statutory approval"
            value={overview.counts.Verified || 0}
            detail="Verification cleared by clerks"
            tone="purple"
          />
          <Metric
            label="Form 5 printing queue"
            value={overview.counts.Approved || 0}
            detail="Approved; awaiting print"
            tone="indigo"
          />
          <Metric
            label="Completed handovers"
            value={overview.counts.Collected || 0}
            detail="Certificates collected"
            tone="teal"
          />
          <Metric
            label="SLA escalation flags"
            value={overview.slaFlags}
            detail="Beyond 5 business days"
            tone="rose"
          />
        </div>
      );
    }

    if (role === "Auditor") {
      const mismatchCount = applications.filter(
        (a) => a.idVerificationStatus === "FLAGGED_MISMATCH"
      ).length;
      return (
        <div className="metric-grid">
          <Metric
            label="Audited system events"
            value={auditEntries.length || 34}
            detail="Tamper-evident log entries"
            tone="terracotta"
          />
          <Metric
            label="ID mismatch flags"
            value={mismatchCount}
            detail="Parentage lookup discrepancies"
            tone="rose"
          />
          <Metric
            label="SLA compliance flags"
            value={overview.slaFlags}
            detail="Cases beyond statutory SLA"
            tone="amber"
          />
          <Metric
            label="Form 5 certificates tracked"
            value={(overview.counts.Printed || 0) + (overview.counts.Collected || 0)}
            detail="Security serialized instruments"
            tone="indigo"
          />
        </div>
      );
    }

    // Administrator
    return (
      <div className="metric-grid">
        <Metric
          label="Total Applications"
          value={overview.total}
          detail="+14% compared to last month"
          tone="terracotta"
        />
        <Metric
          label="Pending Review"
          value={overview.counts["Pending Verification"] || 34}
          detail="12 require physical verification"
          tone="amber"
        />
        <Metric
          label="Approved Today"
          value={overview.counts.Approved || 12}
          detail="9 issued with secure digital QR"
          tone="indigo"
        />
        <Metric
          label="Ready for Collection"
          value={overview.counts.Printed || 8}
          detail="Pickup desk counter 3 ready"
          tone="green"
        />
      </div>
    );
  };

  return (
    <>
      {/* Role and Counter Context Banner */}
      <div className="station-banner">
        <div>
          <strong>
            {currentUser.counter} · Acting as {currentUser.fullName} ({role})
          </strong>
          <small>
            Authorized access level under Kenya Civil Registration Act Cap 149 & KDPA 2019. Station code: CRS-NAK-05.
          </small>
        </div>
        <div className="quick-actions">
          {role === "Clerk" && (
            <>
              <button
                type="button"
                className="btn outline"
                onClick={() => go("/applications/new")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <FileText size={14} /> Counter Intake
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => go("/verification")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Fingerprint size={14} /> Verification Desk
              </button>
            </>
          )}
          {role === "Registrar" && (
            <>
              <button
                type="button"
                className="btn outline"
                onClick={() => go("/status")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Activity size={14} /> Statutory Approvals
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => go("/printing")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Printer size={14} /> Form 5 Printing
              </button>
            </>
          )}
          {role === "Auditor" && (
            <>
              <button
                type="button"
                className="btn outline"
                onClick={() => go("/reports")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <BarChart3 size={14} /> SLA Compliance & Trends
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => go("/audit")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <ShieldCheck size={14} /> Audit Ledger
              </button>
            </>
          )}
          {role === "Administrator" && (
            <>
              <button
                type="button"
                className="btn outline"
                onClick={() => go("/settings")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Settings2 size={14} /> Station Settings
              </button>
              <button
                type="button"
                className="btn outline"
                onClick={() => go("/users")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Users size={14} /> Users & Roles
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => go("/applications/new")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <FileText size={14} /> Counter Intake
              </button>
            </>
          )}
        </div>
      </div>

      {/* Weekly Registration Drive Banner matching Wireframe 08 */}
      <div className="registration-drive-card">
        <div className="drive-content-left">
          <div className="drive-badge-wrap">
            <span className="live-pulse-dot" />
            <span className="drive-badge-text">CIVIC OUTREACH DRIVE</span>
          </div>
          <div>
            <h3>Weekly Registration Drive: Subukia Sub-County</h3>
            <p>
              Batch synchronization scheduled today at <strong>16:30 EAT</strong>. 48 clinic records awaiting automatic ingest into Nakuru Central registry.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn outline small drive-btn"
          onClick={() => setShowSchedule(true)}
        >
          <Calendar size={14} /> View Schedule
        </button>
      </div>

      {/* Dynamic Role Metrics */}
      {renderMetrics()}

      {/* Role-Specific Work Queue */}
      <div className="dashboard-grid">
        <section className="card wide">
          <div className="card-head">
            <div>
              <SectionEyebrow>Assigned counter stream</SectionEyebrow>
              <h2>{queueTitle}</h2>
              <p>{queueSubtitle}</p>
            </div>
            <button
              type="button"
              className="btn quiet"
              onClick={() => go("/records")}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              View all records <ArrowRight size={15} />
            </button>
          </div>
          <Table items={queue} onSelect={setSelected} />
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <SectionEyebrow>Workflow health</SectionEyebrow>
              <h2>Lifecycle mix</h2>
            </div>
            <Gauge size={20} className="card-icon" />
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <strong>{overview.throughput}%</strong>
              <span>throughput</span>
            </div>
            <div className="legend">
              {statuses.slice(0, 6).map((st) => (
                <div key={st}>
                  <i className={`legend-dot ${statusTone[st]}`} />
                  <span>{st}</span>
                  <strong>{overview.counts[st] || 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Operational Rhythm Grid */}
      <div className="bottom-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <SectionEyebrow>Counter rhythm</SectionEyebrow>
              <h2>Today at a glance</h2>
            </div>
            <Activity size={20} className="card-icon" />
          </div>
          <div className="rhythm">
            <div>
              <strong>{overview.today}</strong>
              <span>New intakes</span>
            </div>
            <div>
              <strong>{overview.counts.Verified || 0}</strong>
              <span>Verified</span>
            </div>
            <div>
              <strong>{overview.counts.Collected || 0}</strong>
              <span>Collected</span>
            </div>
          </div>
          <div className="progress-line">
            <span style={{ width: `${Math.max(8, overview.throughput)}%` }} />
          </div>
          <p className="small-note">
            Throughput is calculated from collected certificates against total registry volume.
          </p>
        </section>

        <section className="card attention">
          <div className="attention-icon">
            <AlertTriangle size={18} />
          </div>
          <div>
            <SectionEyebrow>Statutory SLA Monitoring · Cap 149</SectionEyebrow>
            <h3>Service Level Agreement Status</h3>
            <p>
              Applications in Nakuru County CRS must reach Form 5 issuance within 5 business days
              of verified hospital notification.
            </p>
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              <span className={`status-badge ${overview.slaFlags > 0 ? "rose" : "green"}`}>
                <span className="status-dot" />
                {overview.slaFlags > 0 ? `${overview.slaFlags} SLA escalations` : "All cases within SLA"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Registration Drive Itinerary Modal */}
      {showSchedule && (
        <div className="modal-backdrop" onClick={() => setShowSchedule(false)}>
          <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon-badge">
                  <Calendar size={18} />
                </span>
                <div>
                  <h3>Subukia Sub-County Outreach Schedule</h3>
                  <p>Mobile Biometric Registration & Hospital Ingest Operations</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSchedule(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="schedule-list">
                <div className="schedule-item current">
                  <div className="schedule-time">
                    <Clock size={14} /> 09:00 - 13:00 EAT (Today)
                  </div>
                  <strong>Kabazi Health Centre Outpost</strong>
                  <span>Mobile Kit #B04 · Lead: Mercy Wambui (Clerk)</span>
                  <div className="location-tag">
                    <MapPin size={12} /> Subukia Sub-County · 24 intakes queued
                  </div>
                </div>

                <div className="schedule-item">
                  <div className="schedule-time">
                    <Clock size={14} /> 14:00 - 16:30 EAT (Today)
                  </div>
                  <strong>Waseges Dispensary & Maternity Centre</strong>
                  <span>Mobile Kit #B04 · Hospital notification verification</span>
                  <div className="location-tag">
                    <MapPin size={12} /> Subukia East · 24 clinic B1 slips pending sync
                  </div>
                </div>

                <div className="schedule-item future">
                  <div className="schedule-time">
                    <Clock size={14} /> Tomorrow · 09:00 EAT
                  </div>
                  <strong>Subukia Sub-County Hospital Maternity Ward</strong>
                  <span>Full clinic register audit with Medical Superintendent</span>
                  <div className="location-tag">
                    <MapPin size={12} /> Station NKR-042 Registry Sync Point
                  </div>
                </div>
              </div>

              <div className="legal-callout">
                <ShieldCheck size={16} />
                <span>
                  All records collected in the field are encrypted at rest with hardware AES-256 keys and synchronised via secure APN backhaul directly to Nakuru Central vault.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn primary" onClick={() => setShowSchedule(false)}>
                Acknowledge Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Clock,
  RotateCcw,
} from "lucide-react";
import { type AuditEntry, labelDate } from "@shared/bcatsCore";

interface AuditScreenProps {
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
  notify: (type: "success" | "error" | "info", text: string) => void;
}

export default function AuditScreen({ api, notify }: AuditScreenProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("All Users");
  const [selectedAction, setSelectedAction] = useState("All Actions");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    api<AuditEntry[]>("/audit")
      .then((data) => setEntries(data || []))
      .catch(() => undefined);
  }, []);

  const staffNames = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.staffName) set.add(e.staffName);
    });
    return Array.from(set);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !search ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.details.toLowerCase().includes(search.toLowerCase()) ||
        e.auditId.toLowerCase().includes(search.toLowerCase()) ||
        e.staffName.toLowerCase().includes(search.toLowerCase());

      const matchesStaff = selectedStaff === "All Users" || e.staffName === selectedStaff;
      const matchesAction = selectedAction === "All Actions" || e.action.includes(selectedAction);

      const matchesFrom = !dateFrom || new Date(e.timestamp) >= new Date(dateFrom);
      const matchesTo = !dateTo || new Date(e.timestamp) <= new Date(dateTo);

      return matchesSearch && matchesStaff && matchesAction && matchesFrom && matchesTo;
    });
  }, [entries, search, selectedStaff, selectedAction, dateFrom, dateTo]);

  const exportAuditCsv = () => {
    const rows = [
      ["Audit ID", "Action", "Staff Name", "Role", "Timestamp", "Client IP", "Details"],
      ...filtered.map((e) => [
        e.auditId,
        e.action,
        e.staffName,
        e.role,
        labelDate(e.timestamp),
        e.clientIp,
        `"${e.details.replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BCATS_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("success", "Statutory audit ledger CSV exported.");
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStaff("All Users");
    setSelectedAction("All Actions");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Append-only non-repudiation ledger · Cap. 149</div>
          <h2>Cryptographic audit log</h2>
          <p>
            Every intake, parentage check, status transition, and handover is tamper-evident and attributable.
          </p>
        </div>
        <div className="secure-pill">
          <ShieldCheck size={14} /> Immutable Ledger Active
        </div>
      </div>

      {/* Audit Filter Toolbar */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem", padding: "10px 0", borderTop: "1px solid var(--border, #f1f5f9)", borderBottom: "1px solid var(--border, #f1f5f9)" }}>
        <div className="search-box" style={{ flex: "1 1 240px" }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search audit hash, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "12px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
          <User size={14} style={{ color: "var(--muted, #64748b)" }} />
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border, #cbd5e1)", fontSize: "12px" }}
          >
            <option>All Users</option>
            {staffNames.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
          <Filter size={14} style={{ color: "var(--muted, #64748b)" }} />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border, #cbd5e1)", fontSize: "12px" }}
          >
            <option>All Actions</option>
            <option>Status Transition</option>
            <option>Intake</option>
            <option>Verification</option>
            <option>Print</option>
            <option>Collection</option>
            <option>Escalation</option>
          </select>
        </div>

        <button
          type="button"
          className="btn quiet"
          onClick={clearFilters}
          style={{ fontSize: "11px", padding: "4px 8px" }}
        >
          <RotateCcw size={12} /> Reset
        </button>

        <button
          type="button"
          className="btn outline"
          onClick={exportAuditCsv}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "auto", fontSize: "12px" }}
        >
          <Download size={14} /> Export Audit Log CSV
        </button>
      </div>

      {/* Ledger Table */}
      <div className="audit-list">
        {filtered.map((entry) => (
          <div className="audit-row" key={entry.auditId}>
            <div className="audit-mark">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong>{entry.action}</strong>
                <span className={`role-badge-tag ${entry.role.toLowerCase()}`} style={{ fontSize: "9.5px", padding: "1px 5px" }}>
                  {entry.role}
                </span>
              </div>
              <span style={{ display: "block", margin: "3px 0", fontSize: "12px", color: "#334155" }}>
                {entry.details}
              </span>
              <small>
                {entry.staffName} · {labelDate(entry.timestamp)} · IP: {entry.clientIp}
              </small>
            </div>
            <code style={{ fontSize: "10.5px" }}>{entry.auditId.slice(0, 14)}…</code>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty">
            <ShieldCheck size={24} style={{ opacity: 0.5 }} />
            <strong>No audit records found matching criteria</strong>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  type Application,
  type Role,
  labelDate,
  statusTone,
} from "@shared/bcatsCore";

interface RecordsScreenProps {
  role: Role;
  applications: Application[];
  setSelected: (item: Application) => void;
  go?: (target: string) => void;
}

export default function RecordsScreen({
  role,
  applications,
  setSelected,
  go,
}: RecordsScreenProps) {
  const [search, setSearch] = useState("");
  const [subCounty, setSubCounty] = useState("All Sub-Counties");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("Newest first");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = applications.filter((item) => {
      // Text search
      const matchesText =
        !search ||
        [
          item.trackingNumber,
          item.childName,
          item.parentFullName,
          item.parentNationalId,
          item.birthNotificationNo,
        ].some((v) => v.toLowerCase().includes(search.toLowerCase()));

      // Sub-county filter
      const matchesSubCounty =
        subCounty === "All Sub-Counties" || item.subCounty === subCounty;

      // Status filter
      const matchesStatus =
        statusFilter === "All Statuses" || item.currentStatus === statusFilter;

      // Date Range
      const matchesFrom = !dateFrom || new Date(item.submittedDate) >= new Date(dateFrom);
      const matchesTo = !dateTo || new Date(item.submittedDate) <= new Date(dateTo);

      return matchesText && matchesSubCounty && matchesStatus && matchesFrom && matchesTo;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "Newest first") {
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      }
      if (sortBy === "Oldest first") {
        return new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime();
      }
      if (sortBy === "Child name A-Z") {
        return a.childName.localeCompare(b.childName);
      }
      return 0;
    });

    return result;
  }, [applications, search, subCounty, statusFilter, dateFrom, dateTo, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const clearFilters = () => {
    setSearch("");
    setSubCounty("All Sub-Counties");
    setStatusFilter("All Statuses");
    setDateFrom("");
    setDateTo("");
    setSortBy("Newest first");
    setPage(1);
  };

  const exportCsv = () => {
    const rows = [
      ["Tracking Number", "Child Name", "Date of Birth", "Sex", "Hospital", "Parent Name", "Parent ID", "Phone", "Sub-County", "Status", "Submitted"],
      ...filtered.map((a) => [
        a.trackingNumber,
        a.childName,
        a.dateOfBirth,
        a.gender,
        a.placeOfBirth,
        a.parentFullName,
        a.parentNationalId,
        a.contactPhone,
        a.subCounty,
        a.currentStatus,
        labelDate(a.submittedDate),
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BCATS_Registry_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="card">
      {role === "Auditor" && (
        <div className="notice info" style={{ marginBottom: "1.25rem" }}>
          <ShieldCheck size={16} />
          <span>
            <strong>Statutory Oversight Mode · Cap. 149:</strong> Birth records inspection is strictly read-only for auditors. All view sessions are logged.
          </span>
        </div>
      )}

      {/* Primary Toolbar */}
      <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div className="search-box" style={{ flex: "1 1 320px" }}>
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search tracking number, child, parent ID, or notification slip..."
          />
          <kbd>/</kbd>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn outline"
            onClick={exportCsv}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={15} /> Export CSV
          </button>
          {go && role !== "Auditor" && (
            <button
              type="button"
              className="btn primary"
              onClick={() => go("/applications/new")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={15} /> New Application
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Row */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border, #f1f5f9)", borderBottom: "1px solid var(--border, #f1f5f9)", marginBottom: "12px", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 600, color: "var(--muted, #64748b)" }}>Sub-County:</span>
          <select
            value={subCounty}
            onChange={(e) => { setSubCounty(e.target.value); setPage(1); }}
            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border, #cbd5e1)", fontSize: "12px" }}
          >
            <option>All Sub-Counties</option>
            <option>Nakuru Town East</option>
            <option>Nakuru Town West</option>
            <option>Naivasha</option>
            <option>Molo</option>
            <option>Rongai</option>
            <option>Gilgil</option>
            <option>Njoro</option>
            <option>Subukia</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 600, color: "var(--muted, #64748b)" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border, #cbd5e1)", fontSize: "12px" }}
          >
            <option>All Statuses</option>
            <option>Submitted</option>
            <option>Pending Verification</option>
            <option>Verified</option>
            <option>Approved</option>
            <option>Printed</option>
            <option>Collected</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 600, color: "var(--muted, #64748b)" }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border, #cbd5e1)", fontSize: "12px" }}
          >
            <option>Newest first</option>
            <option>Oldest first</option>
            <option>Child name A-Z</option>
          </select>
        </div>

        <button
          type="button"
          className="btn quiet"
          onClick={clearFilters}
          style={{ fontSize: "11px", padding: "4px 8px", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <RotateCcw size={12} /> Clear Filters
        </button>
      </div>

      {/* Records Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Child / Applicant</th>
              <th>Submitted</th>
              <th>Sub-County</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {paginated.map((item) => (
              <tr key={item.applicationId} onClick={() => setSelected(item)} style={{ cursor: "pointer" }}>
                <td>
                  <strong className="tracking">{item.trackingNumber}</strong>
                  <small>{item.birthNotificationNo}</small>
                </td>
                <td>
                  <strong>{item.childName}</strong>
                  <small>{item.parentFullName} ({item.parentRelationship})</small>
                </td>
                <td>{labelDate(item.submittedDate)}</td>
                <td>{item.subCounty}</td>
                <td>
                  <span className={`status-badge ${statusTone[item.currentStatus] || "slate"}`}>
                    <span className="status-dot" />
                    {item.currentStatus}
                  </span>
                </td>
                <td>
                  <ChevronRight size={16} className="row-arrow" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty">
            <strong>No registry matches</strong>
            <span>Try adjusting your filters or search keywords.</span>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", fontSize: "12px", color: "var(--muted, #64748b)" }}>
          <span>
            Showing <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
            <strong>{Math.min(page * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
          </span>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              type="button"
              className="btn quiet"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "4px 8px" }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontWeight: 700, padding: "0 4px" }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn quiet"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "4px 8px" }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

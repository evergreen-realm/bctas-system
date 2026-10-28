import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Landmark,
  Bell,
  Printer,
  Share2,
  Phone,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { type Application, statuses, labelDate } from "@shared/bcatsCore";

interface TrackerScreenProps {
  notify: (type: "success" | "error" | "info", text: string) => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function TrackerScreen({ notify, api }: TrackerScreenProps) {
  const [q, setQ] = useState("");
  const [item, setItem] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Check if URL has ?ref=... parameter
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setQ(ref);
      lookup(ref);
    }
  }, []);

  const lookup = async (trackingNo: string) => {
    if (!trackingNo.trim()) return;
    setBusy(true);
    try {
      const found = await api<Application>(`/applications/${encodeURIComponent(trackingNo.trim())}`);
      setItem(found);
    } catch {
      setItem(null);
      notify("error", "We could not find that tracking number. Check your Form 1 slip and try again.");
    } finally {
      setBusy(false);
    }
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    lookup(q);
  };

  const handleShare = () => {
    if (!item) return;
    const url = `${window.location.origin}/track?ref=${encodeURIComponent(item.trackingNumber)}`;
    navigator.clipboard.writeText(url).then(
      () => notify("success", "Tracking link copied to clipboard."),
      () => notify("info", `Tracking link: ${url}`)
    );
  };

  return (
    <div className="tracker-page">
      <div className="tracker-hero">
        <div className="eyebrow">Citizen self-service · Nakuru County</div>
        <h1>
          Follow your application
          <br />
          <em>with transparency.</em>
        </h1>
        <p>
          Enter your tracking number (issued upon intake) to see the current stage of your birth
          certificate. No login is required.
        </p>

        <form className="tracker-search" onSubmit={search}>
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. BCATS-2026-001847 or NKU-2026-00421"
          />
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Searching…" : "Track status"} <ArrowRight size={15} />
          </button>
        </form>

        <div className="tracker-help">
          <Phone size={14} style={{ display: "inline", marginRight: "4px" }} />
          <span>Need help? Toll-free helpline <strong>0800 221001</strong> · Counter C3 Nakuru CRS Office</span>
        </div>
      </div>

      {item ? (
        <section className="card tracker-result" style={{ maxWidth: "800px", margin: "2rem auto" }}>
          <div className="result-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div className="eyebrow">Application status</div>
              <h2>{item.childName}</h2>
              <p className="tracking">
                {item.trackingNumber} · Submitted {labelDate(item.submittedDate)} · {item.subCounty}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className={`status-badge ${item.currentStatus === "Collected" ? "green" : "amber"}`}>
                {item.currentStatus}
              </span>
              <button
                type="button"
                className="btn quiet"
                onClick={handleShare}
                title="Share Tracking Link"
                style={{ padding: "6px" }}
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                className="btn quiet"
                onClick={() => window.print()}
                title="Print Status Slip"
                style={{ padding: "6px" }}
              >
                <Printer size={16} />
              </button>
            </div>
          </div>

          {/* 5-Stage Stepper */}
          <div className="stepper" style={{ margin: "1.75rem 0" }}>
            {statuses.slice(0, 6).map((status, i) => {
              const currentIndex = statuses.indexOf(item.currentStatus);
              const isPast = currentIndex > i;
              const isCurrent = currentIndex === i;
              return (
                <div
                  className={`${isPast ? "done" : ""} ${isCurrent ? "current" : ""}`}
                  key={status}
                >
                  <span>{isPast ? "✓" : i + 1}</span>
                  <small>{status}</small>
                </div>
              );
            })}
          </div>

          <div className="result-note" style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <Bell size={18} style={{ color: "var(--terracotta, #c2410c)", flex: "none", marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", fontSize: "13px" }}>Latest status update</strong>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                {item.statusHistory[item.statusHistory.length - 1]?.justification ||
                  "Your application is moving through the registry."}
              </span>
            </div>
          </div>

          {/* Collection Guidelines Card */}
          <div style={{ marginTop: "1.5rem", padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
              <BookOpen size={16} /> What to bring for collection at Nakuru CRS Counter
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#14532d", lineHeight: "1.6" }}>
              <li>Original National ID card of the registered parent or guardian ({item.parentFullName})</li>
              <li>SMS notification confirmation with tracking code <code>{item.trackingNumber}</code></li>
              <li>Original pink Form 1 birth notification slip from {item.placeOfBirth}</li>
              <li>Operating hours: <strong>Monday to Friday, 8:00 AM – 5:00 PM</strong> (Counter C3)</li>
            </ul>
          </div>
        </section>
      ) : (
        <div className="tracker-trust">
          <div>
            <ShieldCheck size={20} />
            <strong>Secure & verified</strong>
            <span>Only statutory status is displayed for public tracking numbers.</span>
          </div>
          <div>
            <BookOpen size={20} />
            <strong>What to bring for collection</strong>
            <span>Present the original national ID of the registered parent or guardian.</span>
          </div>
          <div>
            <Landmark size={20} />
            <strong>Official registration</strong>
            <span>Civil Registration Services · Ministry of Interior.</span>
          </div>
        </div>
      )}
    </div>
  );
}

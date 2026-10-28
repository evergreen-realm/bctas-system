import React, { useState, useEffect } from "react";
import {
  Settings2,
  Activity,
  CheckCircle2,
  Database,
  Download,
  RotateCcw,
  AlertTriangle,
  Phone,
  Mail,
  Shield,
  Save,
  Send,
  LockKeyhole,
} from "lucide-react";
import { type Role, type StationSettings } from "@shared/bcatsCore";

interface SettingsScreenProps {
  role: Role;
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function SettingsScreen({
  role,
  notify,
  refresh,
  api,
}: SettingsScreenProps) {
  const [settings, setSettings] = useState<StationSettings>({
    officeName: "Nakuru Civil Registration Office",
    officePhone: "+254 51 221 4482",
    officeEmail: "nakuru-crs@interior.go.ke",
    stationCode: "CRS-NAK-05",
    stationCounty: "Nakuru County",
    subCountyHq: "Nakuru Town East",
    slaDays: 5,
    autoTrackingPrefix: "BCATS-2026-",
    enablePublicPortal: true,
    smsBalanceKes: 234.5,
    smsCreditsRemaining: 670,
    smsSenderHeader: "NAKURU-CRS",
    lastBackupDate: new Date().toISOString(),
    lastBackupSizeMb: 1.4,
    lastBackupChecksum: "sha256:d8a2...f01",
    requireSmsOtp: true,
    county: "Nakuru County",
    landline: "+254 51 221 4482",
    officialEmail: "nakuru-crs@interior.go.ke",
    slaTurnaroundDays: 5,
    smsSenderId: "NAKURU-CRS",
    sealCode: "NKS-SEC-99214",
    currentSerialRange: "NKS-SEC-99200 - NKS-SEC-99500",
  });

  const [busy, setBusy] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  useEffect(() => {
    api<{ settings?: StationSettings }>("/settings")
      .then((res) => {
        if (res && res.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      notify("success", "Station settings successfully updated in edge and local storage.");
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to save settings.");
    } finally {
      setBusy(false);
    }
  };

  const handleTestSmsConnection = async () => {
    setTestingSms(true);
    try {
      const res = await api<{ success: boolean; message: string }>("/sms/test", {
        method: "POST",
        body: JSON.stringify({
          phone: "+254712443892",
          text: "BCATS Nakuru: Africa's Talking gateway connection test successful. Station CRS-NAK-05 operational.",
        }),
      });
      notify("success", res.message || "Africa's Talking SMS Gateway verified operational.");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Gateway test failed.");
    } finally {
      setTestingSms(false);
    }
  };

  const handleBackupNow = async () => {
    setBusy(true);
    try {
      const backup = await api<any>("/settings/backup", { method: "POST" });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bcats-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify("success", "Vault backup exported to bcats-vault-backup.json.");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Backup failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleFactoryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== "RESET-NAKURU") {
      notify("error", "Confirmation string does not match 'RESET-NAKURU'. Reset aborted.");
      return;
    }
    setBusy(true);
    try {
      await api("/settings/reset", { method: "POST" });
      notify("info", "Station database reset to initial factory seed. All 15 wireframe test records restored.");
      setShowResetModal(false);
      setResetConfirmText("");
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-screen-root">
      <div className="settings-grid">
        {/* General Station Identity */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Station identity</div>
              <h2>General station configuration</h2>
            </div>
            <Settings2 size={20} className="card-icon" />
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label className="field-label">Office Name</label>
                <input
                  className="field"
                  value={settings.officeName}
                  onChange={(e) => setSettings({ ...settings, officeName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field-label">Station Code</label>
                <input
                  className="field"
                  value={settings.stationCode}
                  onChange={(e) => setSettings({ ...settings, stationCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label className="field-label">County Jurisdiction</label>
                <input
                  className="field"
                  value={settings.county}
                  onChange={(e) => setSettings({ ...settings, county: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field-label">SLA Turnaround Limit (Days)</label>
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={30}
                  value={settings.slaTurnaroundDays}
                  onChange={(e) => setSettings({ ...settings, slaTurnaroundDays: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label className="field-label">Station Landline</label>
                <input
                  className="field"
                  value={settings.landline}
                  onChange={(e) => setSettings({ ...settings, landline: e.target.value })}
                  placeholder="+254 51 221 4482"
                  required
                />
              </div>

              <div>
                <label className="field-label">Official Registry Email</label>
                <input
                  className="field"
                  type="email"
                  value={settings.officialEmail}
                  onChange={(e) => setSettings({ ...settings, officialEmail: e.target.value })}
                  placeholder="nakuru-crs@interior.go.ke"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label className="field-label">Official Seal Stamp Code</label>
                <input
                  className="field"
                  value={settings.sealCode}
                  onChange={(e) => setSettings({ ...settings, sealCode: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field-label">Security Paper Serial Range</label>
                <input
                  className="field"
                  value={settings.currentSerialRange}
                  onChange={(e) => setSettings({ ...settings, currentSerialRange: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="field-label">SMS Sender Header (Mask)</label>
              <input
                className="field"
                value={settings.smsSenderId}
                onChange={(e) => setSettings({ ...settings, smsSenderId: e.target.value })}
                placeholder="NAKURU-CRS"
                required
              />
            </div>

            <button
              type="submit"
              className="btn primary"
              disabled={busy}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Save size={15} /> {busy ? "Saving…" : "Update Station Settings"}
            </button>
          </form>
        </section>

        {/* External Adapters & Vault Management */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section className="card">
            <div className="card-head">
              <div>
                <div className="eyebrow">External adapters</div>
                <h2>Integration endpoints</h2>
              </div>
              <Activity size={20} className="card-icon" />
            </div>

            {[
              {
                name: "G2G IPRS Gateway",
                detail: "mTLS identity verification protocol · Cap. 149",
                status: "Operational",
                badgeColor: "#16a34a",
              },
              {
                name: "e-Birth Validation (Hospital)",
                detail: "Ministry of Health Form 1 live sync",
                status: "Operational",
                badgeColor: "#16a34a",
              },
              {
                name: "Africa's Talking SMS Gateway",
                detail: "Sender ID: NAKURU-CRS · Balance: KES 234.50",
                status: "Operational",
                badgeColor: "#16a34a",
                action: (
                  <button
                    type="button"
                    className="btn quiet"
                    onClick={handleTestSmsConnection}
                    disabled={testingSms}
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                  >
                    <Send size={12} /> {testingSms ? "Testing…" : "Test Connection"}
                  </button>
                ),
              },
              {
                name: "Cloudflare D1 & R2 Vault",
                detail: "Edge database & encrypted attachments bucket",
                status: "Operational",
                badgeColor: "#16a34a",
              },
            ].map((row) => (
              <div className="integration-row" key={row.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border, #f1f5f9)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="integration-icon" style={{ color: "#16a34a" }}>
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <strong style={{ display: "block", fontSize: "13px" }}>{row.name}</strong>
                    <small style={{ color: "var(--muted, #64748b)", fontSize: "11px" }}>{row.detail}</small>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {row.action}
                  <span className="adapter-status" style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Backup & Persistence */}
          <section className="card">
            <div className="card-head">
              <div>
                <div className="eyebrow">Data resilience & vault</div>
                <h2>Vault backup & recovery</h2>
              </div>
              <Database size={20} className="card-icon" />
            </div>

            <p style={{ fontSize: "12px", color: "var(--muted, #64748b)", lineHeight: "1.5", marginBottom: "14px" }}>
              BCATS uses a dual-layer auto-sync architecture (Cloudflare edge worker + browser localStorage). Create point-in-time snapshots or reset the testing vault.
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn outline"
                onClick={handleBackupNow}
                disabled={busy}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={14} /> Run Backup Now
              </button>

              <button
                type="button"
                className="btn quiet"
                style={{ color: "var(--rose, #e11d48)" }}
                onClick={() => setShowResetModal(true)}
                disabled={busy}
              >
                <RotateCcw size={14} /> Factory Reset
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Factory Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon-badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <h3>Factory Reset Station Vault</h3>
                  <p>Nakuru Civil Registration Office (CRS-NAK-05)</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowResetModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleFactoryReset} style={{ padding: "18px 22px" }}>
              <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.6", marginBottom: "14px" }}>
                This action will restore the initial station seed data (including all 15 wireframe test applications, SMS templates, and audit entries). All local alterations will be wiped.
              </p>

              <label className="field-label">Type <code>RESET-NAKURU</code> to confirm:</label>
              <input
                className="field"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET-NAKURU"
                required
                style={{ marginBottom: "16px" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn quiet"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn danger"
                  disabled={busy || resetConfirmText !== "RESET-NAKURU"}
                >
                  {busy ? "Resetting…" : "Confirm Factory Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

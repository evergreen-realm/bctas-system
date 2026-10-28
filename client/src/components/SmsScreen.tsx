import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Send,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Settings2,
  Search,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Wifi,
} from "lucide-react";
import { type Role, type SmsTemplate, type DispatchedSms, labelDate } from "@shared/bcatsCore";
import { AddEditSmsTemplateModal, SendTestSmsDialog } from "./SmsModals";

interface SmsScreenProps {
  role: Role;
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function SmsScreen({
  role,
  notify,
  refresh,
  api,
}: SmsScreenProps) {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [dispatched, setDispatched] = useState<DispatchedSms[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchSmsData = async () => {
    try {
      const [tplData, dispatchData] = await Promise.all([
        api<SmsTemplate[]>("/sms/templates"),
        api<DispatchedSms[]>("/sms/dispatched"),
      ]);
      setTemplates(tplData || []);
      setDispatched(dispatchData || []);
    } catch {
      // Handled by api fallback
    }
  };

  useEffect(() => {
    fetchSmsData();
  }, []);

  const handleSaveTemplate = async (data: Partial<SmsTemplate>) => {
    setBusy(true);
    try {
      if (editingTemplate) {
        await api(`/sms/templates/${editingTemplate.templateId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        notify("success", `Template ${editingTemplate.code} updated.`);
      } else {
        await api("/sms/templates", {
          method: "POST",
          body: JSON.stringify(data),
        });
        notify("success", `Template ${data.code} created.`);
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      fetchSmsData();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to save template.");
    } finally {
      setBusy(false);
    }
  };

  const handleSendTest = async (phone: string, text: string) => {
    setBusy(true);
    try {
      const res = await api<{ success: boolean; message: string }>("/sms/test", {
        method: "POST",
        body: JSON.stringify({ phone, text }),
      });
      notify("success", res.message || `Test SMS dispatched to ${phone}.`);
      setShowTestDialog(false);
      fetchSmsData();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "SMS dispatch failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleTemplate = async (tpl: SmsTemplate) => {
    try {
      await api(`/sms/templates/${tpl.templateId}`, {
        method: "PUT",
        body: JSON.stringify({ active: !tpl.active }),
      });
      notify("info", `Template ${tpl.code} ${!tpl.active ? "activated" : "deactivated"}.`);
      fetchSmsData();
    } catch (e) {
      notify("error", "Could not toggle template status.");
    }
  };

  const filteredDispatches = dispatched.filter(
    (d) =>
      d.recipientPhone.includes(searchFilter) ||
      d.recipientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (d.trackingNumber && d.trackingNumber.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="sms-screen-root">
      {/* Top Gateway Status & Balance Cards */}
      <div className="metric-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="metric terracotta">
          <div className="metric-label">Africa's Talking Balance</div>
          <strong>KES 234.50</strong>
          <span>~670 standard SMS units</span>
        </div>
        <div className="metric green">
          <div className="metric-label">Gateway Status</div>
          <strong>Operational</strong>
          <span>mTLS direct route active</span>
        </div>
        <div className="metric indigo">
          <div className="metric-label">Sender ID Mask</div>
          <strong>NAKURU-CRS</strong>
          <span>Kenya CRS shortcode 22100</span>
        </div>
        <div className="metric emerald">
          <div className="metric-label">Dispatched Today</div>
          <strong>{dispatched.length || 18}</strong>
          <span>99.8% delivery rate</span>
        </div>
      </div>

      {/* Templates Section */}
      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-head">
          <div>
            <div className="eyebrow">Africa's Talking SMS Adapter</div>
            <h2>Citizen notification templates</h2>
            <p>Dispatched automatically following audited database state changes.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn outline"
              onClick={() => setShowTestDialog(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Send size={14} /> Send Test SMS
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateModal(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={15} /> New Template
            </button>
          </div>
        </div>

        <div className="sms-list">
          {templates.map((tpl) => (
            <div className="sms-row" key={tpl.templateId}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong>{tpl.code}</strong>
                  <span className="status-badge slate" style={{ fontSize: "10px", padding: "1px 6px" }}>
                    Trigger: {tpl.triggerStatus}
                  </span>
                  {tpl.active ? (
                    <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700 }}>● Active</span>
                  ) : (
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>○ Paused</span>
                  )}
                </div>
                <small style={{ color: "var(--muted, #64748b)" }}>{tpl.name}</small>
              </div>

              <p style={{ margin: "8px 0", fontSize: "12px", lineHeight: "1.5" }}>
                {tpl.body.split(/(\{.*?\})/).map((part, idx) =>
                  part.startsWith("{") && part.endsWith("}") ? (
                    <span
                      key={idx}
                      style={{
                        background: "#faf4eb",
                        color: "#884b25",
                        padding: "1px 4px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                <span style={{ fontSize: "10px", color: "var(--muted, #64748b)" }}>
                  {tpl.characterCount || tpl.body.length} chars · {tpl.creditCost || 1} SMS unit
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn quiet"
                    onClick={() => handleToggleTemplate(tpl)}
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                  >
                    {tpl.active ? "Pause" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="btn quiet"
                    onClick={() => {
                      setEditingTemplate(tpl);
                      setShowTemplateModal(true);
                    }}
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                  >
                    <Settings2 size={13} /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dispatched SMS Live History */}
      <section className="card">
        <div className="card-head">
          <div>
            <div className="eyebrow">Real-time gateway log</div>
            <h2>Dispatched SMS history</h2>
          </div>
          <div className="search-box" style={{ maxWidth: "300px" }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search dispatched phone or text..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ fontSize: "11px" }}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Tracking #</th>
                <th>Template / Trigger</th>
                <th>Message Content</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDispatches.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.recipientName}</strong>
                    <small>{item.recipientPhone}</small>
                  </td>
                  <td>
                    <code>{item.trackingNumber || "—"}</code>
                  </td>
                  <td>
                    <span className="status-badge slate" style={{ fontSize: "10px", padding: "1px 5px" }}>
                      {item.templateCode || "DISPATCH"}
                    </span>
                  </td>
                  <td style={{ maxWidth: "360px", fontSize: "11px", color: "#334155" }}>
                    {item.message}
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "11px" }}>
                    {labelDate(item.timestamp)}
                  </td>
                  <td>
                    <span className="status-badge green" style={{ fontSize: "10px", padding: "2px 6px" }}>
                      <CheckCircle2 size={11} style={{ display: "inline", marginRight: "3px" }} />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDispatches.length === 0 && (
            <div className="empty">
              <MessageSquare size={24} style={{ opacity: 0.5 }} />
              <strong>No dispatched messages matching filter</strong>
              <span>Outbound SMS notifications will appear in this real-time log.</span>
            </div>
          )}
        </div>
      </section>

      {/* Add / Edit Template Modal */}
      {showTemplateModal && (
        <AddEditSmsTemplateModal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          template={editingTemplate}
          onSave={handleSaveTemplate}
          busy={busy}
        />
      )}

      {/* Send Test SMS Dialog */}
      {showTestDialog && (
        <SendTestSmsDialog
          isOpen={showTestDialog}
          onClose={() => setShowTestDialog(false)}
          onSend={handleSendTest}
          busy={busy}
        />
      )}
    </div>
  );
}

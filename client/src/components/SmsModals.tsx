import React, { useState } from "react";
import { X, Smartphone, Plus, Send, RefreshCw, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";
import { type SmsTemplate, type Status } from "@shared/bcatsCore";

export interface AddEditSmsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: SmsTemplate | null;
  onSave: (data: Partial<SmsTemplate>) => Promise<void>;
  busy?: boolean;
}

export function AddEditSmsTemplateModal({
  isOpen,
  onClose,
  template,
  onSave,
  busy = false,
}: AddEditSmsTemplateModalProps) {
  const isEditing = Boolean(template);
  const [name, setName] = useState(template?.name || "");
  const [code, setCode] = useState(template?.code || "");
  const [triggerStatus, setTriggerStatus] = useState<Status>(template?.triggerStatus || "Submitted");
  const [body, setBody] = useState(
    template?.body || "Dear {parent_name}, notification regarding {child_name} (Ref: {tracking_no})."
  );
  const [active, setActive] = useState(template?.active ?? true);

  if (!isOpen) return null;

  const tokens = [
    { label: "+ {parent_name}", value: "{parent_name}" },
    { label: "+ {child_name}", value: "{child_name}" },
    { label: "+ {tracking_no}", value: "{tracking_no}" },
    { label: "+ {sub_county}", value: "{sub_county}" },
    { label: "+ {office_phone}", value: "{office_phone}" },
  ];

  const appendToken = (tok: string) => {
    setBody((prev) => `${prev} ${tok}`);
  };

  const charCount = body.length;
  const credits = Math.max(1, Math.ceil(charCount / 160));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      code: code.toUpperCase().replace(/\s+/g, "_"),
      triggerStatus,
      body,
      active,
      characterCount: charCount,
      creditCost: credits,
    });
    onClose();
  };

  // Preview with dummy data
  const previewText = body
    .replace(/{parent_name}/g, "Grace Akinyi Ochieng")
    .replace(/{child_name}/g, "Amani Ochieng Kamau")
    .replace(/{tracking_no}/g, "BCATS-2026-001847")
    .replace(/{sub_county}/g, "Nakuru Town East")
    .replace(/{office_phone}/g, "+254 51 221 4482");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <Smartphone size={18} />
            </span>
            <div>
              <h3>{isEditing ? `Edit Template: ${template?.name}` : "Create Custom SMS Notification Template"}</h3>
              <p>Africa's Talking Automated Dispatch Trigger under Kenya Data Protection Act 2019</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <label>
                Template Name*
                <input
                  className="field"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Query / Maternal Document Correction"
                />
              </label>

              <label>
                Template Identifier Code*
                <input
                  className="field"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. DEFICIENCY_CORRECTION"
                  disabled={isEditing}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Workflow Trigger Milestone*
                <select
                  className="field"
                  value={triggerStatus}
                  onChange={(e) => setTriggerStatus(e.target.value as Status)}
                >
                  <option value="Submitted">Submitted (Intake Milestone)</option>
                  <option value="Pending Verification">Pending Verification (Desk Queue)</option>
                  <option value="Verified">Verified (Inspection Cleared)</option>
                  <option value="Approved">Approved (Ready for Seal)</option>
                  <option value="Printed">Printed (Ready for Counter Pickup)</option>
                  <option value="Collected">Collected (Handover Recorded)</option>
                  <option value="Deficient">Deficient (Correction Required)</option>
                </select>
              </label>

              <div className="toggle-wrapper-field">
                <span>Active Notification Trigger</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <span className="slider round" />
                </label>
              </div>
            </div>

            {/* Token Chips Inserter */}
            <div className="token-chips-section">
              <span className="token-section-label">INSERT CONTEXTUAL DYNAMIC TOKENS (CLICK TO APPEND):</span>
              <div className="token-chips-list">
                {tokens.map((tok) => (
                  <button
                    type="button"
                    key={tok.value}
                    className="token-chip-btn"
                    onClick={() => appendToken(tok.value)}
                  >
                    {tok.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <label className="field-label-block">
              SMS Message Body (Swahili / English Standard)*
              <textarea
                className="field textarea"
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose notification text with {placeholders}..."
              />
            </label>

            <div className="char-meter-bar">
              <span className={`char-count ${charCount > 160 ? "multi-sms" : ""}`}>
                <strong>{charCount}</strong>/160 characters ({credits} SMS credit{credits > 1 ? "s" : ""})
              </span>
              <span className="encoding-tag">Encoding: GSM 7-bit standard · Official Alphanumeric: NAKURU-CRS</span>
            </div>

            {/* Live Token Visualizer & Dispatch Preview */}
            <div className="preview-bubble-card">
              <div className="preview-bubble-head">
                <span className="preview-label">Live Template Token Visualizer & Dispatch Preview:</span>
                <span className="mapped-badge">
                  <CheckCircle2 size={12} /> All Placeholders Mapped
                </span>
              </div>
              <p className="preview-rendered-text">{previewText}</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn outline" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={busy || !name || !body}>
              {busy ? "Saving Template…" : isEditing ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface SendTestSmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (phone: string, text: string) => Promise<void>;
  defaultPhone?: string;
  busy?: boolean;
}

export function SendTestSmsDialog({
  isOpen,
  onClose,
  onSend,
  defaultPhone = "+254712443892",
}: SendTestSmsDialogProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [text, setText] = useState(
    "BCATS Nakuru: Testing Africa's Talking live gateway connectivity for CRS-NAK-05. Carrier routes nominal."
  );
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend(phone, text);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <Send size={16} />
            </span>
            <div>
              <h3>Send Test SMS Notification</h3>
              <p>Africa's Talking Alphanumeric Gateway</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="field-label-block">
              Recipient Kenyan Mobile (+254...)*
              <input
                className="field"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
              />
            </label>

            <label className="field-label-block">
              Test Message Body*
              <textarea
                className="field textarea"
                rows={3}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>

            {sentSuccess && (
              <div className="notice success">
                <CheckCircle2 size={16} />
                <span>Test message dispatched successfully! Recorded in Simulated Handset.</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn outline" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={sending || !phone || !text}>
              {sending ? "Dispatching…" : "Send Test SMS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

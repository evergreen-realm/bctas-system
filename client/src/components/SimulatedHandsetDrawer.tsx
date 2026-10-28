import React, { useState } from "react";
import { Smartphone, X, Send, Wifi, Battery, Signal, CheckCheck, Search, RefreshCw } from "lucide-react";
import { type DispatchedSms, labelDate } from "@shared/bcatsCore";

export interface SimulatedHandsetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: DispatchedSms[];
  onSendTest?: (phone: string, text: string) => Promise<void>;
  onRefresh?: () => void;
}

export default function SimulatedHandsetDrawer({
  isOpen,
  onClose,
  messages,
  onSendTest,
  onRefresh,
}: SimulatedHandsetDrawerProps) {
  const [filter, setFilter] = useState("");
  const [testPhone, setTestPhone] = useState("+254712443892");
  const [testMessage, setTestMessage] = useState(
    "BCATS Nakuru: Application BCATS-2026-001847 has been verified. Track online at bcats.go.ke/track."
  );
  const [sending, setSending] = useState(false);
  const [showTestComposer, setShowTestComposer] = useState(false);

  if (!isOpen) return null;

  const filtered = messages.filter(
    (m) =>
      m.recipientPhone.includes(filter) ||
      m.recipientName.toLowerCase().includes(filter.toLowerCase()) ||
      m.message.toLowerCase().includes(filter.toLowerCase()) ||
      (m.trackingNumber && m.trackingNumber.toLowerCase().includes(filter.toLowerCase()))
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSendTest || !testPhone.trim() || !testMessage.trim()) return;
    setSending(true);
    try {
      await onSendTest(testPhone, testMessage);
      setShowTestComposer(false);
    } catch (err) {
      console.error("Test SMS failed:", err);
    } finally {
      setSending(false);
    }
  };

  const currentTime = new Date().toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="handset-drawer-backdrop" onClick={onClose}>
      <div className="handset-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="handset-drawer-header">
          <div className="drawer-title-group">
            <span className="handset-icon-pill">
              <Smartphone size={16} />
            </span>
            <div>
              <h3>Simulated Citizen Handset</h3>
              <p>Africa's Talking Live Gateway Receiver · Safaricom / Airtel</p>
            </div>
          </div>
          <button className="handset-close-btn" onClick={onClose} aria-label="Close Handset Drawer">
            <X size={18} />
          </button>
        </div>

        {/* Handset Physical Bezel */}
        <div className="phone-device-chassis">
          {/* Top Notch / Status Bar */}
          <div className="phone-status-bar">
            <span className="phone-time">{currentTime}</span>
            <div className="phone-notch">
              <span className="notch-speaker" />
              <span className="notch-camera" />
            </div>
            <div className="phone-status-icons">
              <span className="carrier-badge">Safaricom 4G</span>
              <Signal size={12} />
              <Wifi size={12} />
              <Battery size={13} />
            </div>
          </div>

          {/* App Titlebar */}
          <div className="phone-app-header">
            <div className="phone-header-info">
              <span className="gov-seal-mini">CRS</span>
              <div>
                <strong>CRS-NAKURU</strong>
                <small>Official Civil Registry Gateway</small>
              </div>
            </div>
            <div className="phone-header-actions">
              {onRefresh && (
                <button className="phone-action-btn" onClick={onRefresh} title="Sync SMS stream">
                  <RefreshCw size={13} />
                </button>
              )}
              <button
                className={`phone-action-btn ${showTestComposer ? "active" : ""}`}
                onClick={() => setShowTestComposer(!showTestComposer)}
                title="Send test citizen SMS"
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="phone-search-bar">
            <Search size={13} />
            <input
              type="text"
              placeholder="Search by phone, child or tracking..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button className="phone-clear-search" onClick={() => setFilter("")}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Test SMS Quick Composer */}
          {showTestComposer && (
            <form className="phone-test-composer" onSubmit={handleSend}>
              <div className="composer-head">
                <span>Dispatch Live / Simulated SMS</span>
                <button type="button" onClick={() => setShowTestComposer(false)}>
                  <X size={12} />
                </button>
              </div>
              <input
                className="composer-input"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+2547XXXXXXXX"
                required
              />
              <textarea
                className="composer-textarea"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="SMS text body..."
                rows={3}
                required
              />
              <div className="composer-actions">
                <span className="char-badge">{testMessage.length}/160 chars</span>
                <button type="submit" className="btn primary small" disabled={sending}>
                  <Send size={12} /> {sending ? "Sending…" : "Dispatch SMS"}
                </button>
              </div>
            </form>
          )}

          {/* Messages Feed */}
          <div className="phone-messages-stream">
            {filtered.map((msg) => (
              <div className="citizen-sms-bubble" key={msg.id}>
                <div className="sms-bubble-head">
                  <div className="sender-tag">
                    <span className="sender-name">CRS-NAKURU</span>
                    {msg.trackingNumber && (
                      <span className="ref-tag">{msg.trackingNumber}</span>
                    )}
                  </div>
                  <span className="sms-time">
                    {new Date(msg.timestamp).toLocaleTimeString("en-KE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="sms-body-text">{msg.message}</p>

                <div className="sms-bubble-footer">
                  <span className="recipient-label">
                    To: <strong>{msg.recipientPhone}</strong> ({msg.recipientName})
                  </span>
                  <span className="delivery-status">
                    <CheckCheck size={13} className="check-delivered" /> {msg.status}
                  </span>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="phone-empty-state">
                <Smartphone size={32} />
                <strong>No messages found</strong>
                <span>Dispatches from verification, approvals, or test triggers will appear here in real time.</span>
              </div>
            )}
          </div>

          {/* Bottom Home Indicator */}
          <div className="phone-home-indicator">
            <span className="home-bar" />
          </div>
        </div>

        <div className="handset-drawer-footer">
          <small>
            Powered by Africa's Talking SMS API gateway adapter. Messages retained in immutable station audit vault.
          </small>
        </div>
      </div>
    </div>
  );
}


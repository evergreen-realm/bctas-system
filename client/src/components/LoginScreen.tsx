import React, { useState } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  X,
  User,
  KeyRound,
} from "lucide-react";
import { type StaffUser, type Role, STAFF_ACCOUNTS } from "@shared/bcatsCore";
import { setStoredAuthUser } from "../localStore";
import { KenyaCoatOfArms } from "./BirthCertificatePreview";

interface LoginScreenProps {
  onLoginSuccess: (user: StaffUser) => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function LoginScreen({ onLoginSuccess, api }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("Clerk");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedRolePill, setSelectedRolePill] = useState<Role | null>(null);

  const demoAccounts = [
    STAFF_ACCOUNTS.find((a) => a.role === "Clerk" && a.email.includes("clerk@"))!,
    STAFF_ACCOUNTS.find((a) => a.role === "Registrar" && a.email.includes("registrar@"))!,
    STAFF_ACCOUNTS.find((a) => a.role === "Administrator" && a.email.includes("admin@"))!,
    STAFF_ACCOUNTS.find((a) => a.role === "Auditor" && a.email.includes("auditor@"))!,
  ];

  const selectQuickRole = (acc: (typeof STAFF_ACCOUNTS)[0]) => {
    setIdentifier(acc.employeeId || acc.email);
    setPassword(acc.password);
    setSelectedRole(acc.role);
    setAccepted(true);
    setErrorMsg(null);
    setSelectedRolePill(acc.role);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setErrorMsg("Please acknowledge the statutory declaration before signing in.");
      return;
    }

    setBusy(true);
    setErrorMsg(null);

    try {
      // Find matching user by email or employeeId
      const matched = STAFF_ACCOUNTS.find(
        (a) =>
          (a.email.toLowerCase() === identifier.trim().toLowerCase() ||
            a.employeeId.toUpperCase() === identifier.trim().toUpperCase()) &&
          a.password === password
      );

      if (matched) {
        const loggedUser: StaffUser = {
          employeeId: matched.employeeId,
          fullName: matched.fullName,
          role: matched.role,
          email: matched.email,
          counter: matched.counter,
          active: true,
          eulaAcceptedAt: new Date().toISOString(),
        };
        setStoredAuthUser(loggedUser);
        onLoginSuccess(loggedUser);
        return;
      }

      // Try edge API
      const res = await api<{ success: boolean; user: StaffUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      if (res && res.user) {
        setStoredAuthUser(res.user);
        onLoginSuccess(res.user);
      } else {
        throw new Error("Invalid staff credentials or unauthorized counter role.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed. Check credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      {/* Brand Left Column */}
      <div className="login-art">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <KenyaCoatOfArms size={40} />
          <div>
            <strong style={{ fontSize: "1.1rem", letterSpacing: "0.04em", display: "block" }}>BCATS</strong>
            <small style={{ color: "rgba(255,255,255,0.7)" }}>Nakuru Civil Registration</small>
          </div>
        </div>

        <div style={{ margin: "auto 0" }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.8)" }}>
            Nakuru County · CRS operational portal
          </div>
          <h1 style={{ fontSize: "2.4rem", color: "#fff", lineHeight: "1.2", margin: "0.75rem 0 1rem" }}>
            Every birth record
            <br />
            <em style={{ color: "#fed7aa" }}>deserves a clear path.</em>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", lineHeight: "1.6", maxWidth: "460px" }}>
            BCATS connects counter intake, parentage verification, secure certificate printing, and
            accountable collection in one certified registry workspace under Cap. 149.
          </p>
        </div>

        <div className="login-quote" style={{ borderLeft: "3px solid #fed7aa", paddingLeft: "14px", color: "rgba(255,255,255,0.9)" }}>
          “The system makes the next responsible action visible.”
          <small style={{ display: "block", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
            — Nakuru Civil Registration Desk (Counter C1)
          </small>
        </div>
      </div>

      {/* Login Card Right Column */}
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <LockKeyhole size={24} className="login-lock" />
          <span style={{ fontSize: "11px", color: "var(--muted, #64748b)", fontWeight: 600 }}>
            Station: CRS-NAK-05
          </span>
        </div>

        <div className="eyebrow">Staff authentication · CRS Portal</div>
        <h2>Sign in to BCATS</h2>
        <p>Enter your designated staff ID or official email to access your assigned counter.</p>

        {errorMsg && (
          <div className="notice error" style={{ marginBottom: "16px" }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignIn}>
          <label className="field-label">Staff ID or Official Email</label>
          <div className="search-box" style={{ width: "100%", marginBottom: "12px", background: "#fff" }}>
            <User size={16} style={{ color: "#64748b" }} />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setSelectedRolePill(null);
              }}
              placeholder="e.g. NKR-REG-8492 or clerk@nakuru.crs.go.ke"
              autoComplete="username"
              style={{ fontSize: "13px" }}
            />
          </div>

          <label className="field-label">Assigned Operational Role</label>
          <select
            className="field"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
            style={{ marginBottom: "12px" }}
          >
            <option value="Clerk">Counter Clerk (Intake & Verification)</option>
            <option value="Registrar">County Registrar (Statutory Approval & Form 5)</option>
            <option value="Administrator">Station Administrator (Full Security Clearance)</option>
            <option value="Auditor">Statutory Auditor (Read-Only Inspection)</option>
          </select>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="field-label" style={{ margin: 0 }}>Password</label>
            <button
              type="button"
              className="btn quiet"
              onClick={() => setShowForgotModal(true)}
              style={{ fontSize: "11px", padding: 0, color: "var(--terracotta, #c2410c)" }}
            >
              Forgot password?
            </button>
          </div>

          <div className="password-box" style={{ margin: "4px 0 14px" }}>
            <input
              className="field"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Quick Select Demo Roles */}
          <div className="role-pills-label" style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)", marginBottom: "6px" }}>
            Quick select demo counter role:
          </div>
          <div className="role-pills" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className={`role-pill-btn ${selectedRolePill === acc.role ? "active" : ""}`}
                onClick={() => selectQuickRole(acc)}
                style={{ textAlign: "left", padding: "6px 8px" }}
              >
                <strong style={{ fontSize: "11px", display: "block" }}>
                  {acc.role}: {acc.fullName.split(" ")[0]}
                </strong>
                <small style={{ fontSize: "9.5px", color: "var(--muted, #64748b)" }}>{acc.employeeId}</small>
              </button>
            ))}
          </div>

          {/* Statutory Consent Checkbox */}
          <label className="consent staff-consent" style={{ fontSize: "11.5px", lineHeight: "1.4" }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              I acknowledge that unauthorized extraction, sharing, or alteration of citizen birth
              records constitutes an offence under the Official Secrets Act and the Computer
              Misuse and Cybercrimes Act, 2018.
            </span>
          </label>

          <button
            type="submit"
            className="btn primary full"
            disabled={busy || !accepted}
            style={{ marginTop: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
          >
            <LogIn size={16} /> {busy ? "Authenticating…" : `Sign in to BCATS Counter`}
          </button>
        </form>

        <div className="login-help" style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
          <span>Session timeout: 30 mins inactivity</span>
          <a href="/track" style={{ color: "var(--terracotta, #c2410c)", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
            Public citizen tracker <ArrowRight size={13} />
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon-badge">
                  <KeyRound size={18} />
                </span>
                <div>
                  <h3>Credential Recovery Protocol</h3>
                  <p>Nakuru Civil Registration Office (CRS-NAK-05)</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForgotModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "18px 22px" }}>
              <p style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.6" }}>
                Under Kenya Civil Registration Service security controls, staff passwords cannot be reset automatically via public internet links.
              </p>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "8px", margin: "14px 0", fontSize: "12px" }}>
                <strong>Authorized Reset Contacts:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: "18px", color: "#475569" }}>
                  <li>Station Administrator: <strong>Faith Njeri (Desk A1)</strong></li>
                  <li>Official IT Support: <strong>nakuru-it@interior.go.ke</strong></li>
                  <li>Station Landline: <strong>+254 51 221 4482 (Ext. 104)</strong></li>
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setShowForgotModal(false)}
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

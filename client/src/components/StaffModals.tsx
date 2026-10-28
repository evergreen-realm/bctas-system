import React, { useState, useEffect } from "react";
import { X, UserRound, Shield, CheckCircle2, UserPlus, KeyRound } from "lucide-react";
import { type StaffUser, type Role } from "@shared/bcatsCore";

export interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StaffUser | null;
  onSave: (updated: Partial<StaffUser>) => Promise<void>;
  busy?: boolean;
}

export function EditUserModal({ isOpen, onClose, user, onSave, busy = false }: EditUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("Clerk");
  const [counter, setCounter] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setRole(user.role);
      setCounter(user.counter);
      setActive(user.active);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      fullName,
      role,
      counter,
      active,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <UserRound size={18} />
            </span>
            <div>
              <h3>Edit User: {user.fullName}</h3>
              <p>
                {user.employeeId} · Station CRS-NAK-05 (Nakuru HQ)
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="field-label-block">
              Full Name*
              <input
                className="field"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            <label className="field-label-block">
              Staff ID
              <input className="field" value={user.employeeId} readOnly disabled />
              <small className="field-hint">Unique identifier issued by County Public Service Board</small>
            </label>

            <label className="field-label-block">
              Role Assignment*
              <select
                className="field"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="Clerk">Clerk (Data Entry & Verification Intake)</option>
                <option value="Registrar">Registrar (Approval & Form 5 Sealing)</option>
                <option value="Administrator">Administrator (Station Management & Security)</option>
                <option value="Auditor">Auditor (Statutory Oversight & Audit Vault)</option>
              </select>
            </label>

            <label className="field-label-block">
              Station / Sub-county Assignment*
              <input
                className="field"
                required
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                placeholder="e.g. Nakuru Town East (Registry HQ)"
              />
            </label>

            <div className="authorization-toggle-card">
              <div className="toggle-text">
                <strong>Account Authorization</strong>
                <p>Allows system login, data intake, and slip generation</p>
              </div>
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

          <div className="modal-footer">
            <button type="button" className="btn outline" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    fullName: string;
    email: string;
    role: Role;
    counter: string;
    employeeId?: string;
  }) => Promise<void>;
  busy?: boolean;
}

export function AddStaffModal({ isOpen, onClose, onAdd, busy = false }: AddStaffModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Clerk");
  const [counter, setCounter] = useState("Counter C1 (Intake)");
  const [staffId, setStaffId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({
      fullName,
      email,
      role,
      counter,
      employeeId: staffId || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <UserPlus size={18} />
            </span>
            <div>
              <h3>Add Staff Account</h3>
              <p>Provision official credentials under Nakuru County Public Service Board</p>
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
                Staff Full Name*
                <input
                  className="field"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Kamau"
                />
              </label>

              <label>
                Official Email Address*
                <input
                  className="field"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jane.kamau@nakuru.crs.go.ke"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Role Assignment*
                <select
                  className="field"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="Clerk">Clerk (Intake & Verification)</option>
                  <option value="Registrar">Registrar (Approval & Issuance)</option>
                  <option value="Administrator">Administrator (Station Control)</option>
                  <option value="Auditor">Auditor (Oversight & Audit)</option>
                </select>
              </label>

              <label>
                Staff ID (Optional)
                <input
                  className="field"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. NKR-CLK-8841"
                />
              </label>
            </div>

            <label className="field-label-block">
              Station Counter / Desk Assignment*
              <input
                className="field"
                required
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                placeholder="e.g. Counter C3 (Intake & Verification)"
              />
            </label>

            <div className="legal-callout">
              <KeyRound size={15} />
              <span>
                Default temporary security passphrase <code>Bcats2026!</code> will be generated. The staff officer will be prompted to accept statutory EULA upon initial sign-in.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn outline" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Provisioning…" : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  UserRound,
  Shield,
  ChevronRight,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { type StaffUser, type Role } from "@shared/bcatsCore";
import { AddStaffModal, EditUserModal } from "./StaffModals";

interface UsersScreenProps {
  staff: StaffUser[];
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export default function UsersScreen({
  staff,
  notify,
  refresh,
  api,
}: UsersScreenProps) {
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAddStaff = async (newStaff: {
    fullName: string;
    email: string;
    role: Role;
    counter: string;
    employeeId?: string;
  }) => {
    setBusy(true);
    try {
      await api("/staff", {
        method: "POST",
        body: JSON.stringify(newStaff),
      });
      notify("success", `Staff member ${newStaff.fullName} (${newStaff.employeeId || "auto-ID"}) added.`);
      setShowAddModal(false);
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to add staff member.");
    } finally {
      setBusy(false);
    }
  };

  const handleEditStaff = async (updated: Partial<StaffUser>) => {
    if (!selectedUser) return;
    setBusy(true);
    try {
      await api(`/staff/${selectedUser.employeeId}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      notify("success", `Account settings updated for ${selectedUser.fullName}.`);
      setShowEditModal(false);
      setSelectedUser(null);
      refresh();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to update staff user.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Role-based access control · Cap. 149</div>
          <h2>Station staff & roles</h2>
          <p>Strict least-privilege policies enforced at counter and server boundaries.</p>
        </div>
        <button
          type="button"
          className="btn outline"
          onClick={() => setShowAddModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <UserPlus size={15} /> Add staff account
        </button>
      </div>

      <div className="staff-list">
        {staff.map((person) => (
          <div
            className="staff-row"
            key={person.employeeId}
            onClick={() => {
              setSelectedUser(person);
              setShowEditModal(true);
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="avatar muted">
              {person.fullName
                .split(" ")
                .map((v) => v[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <strong>{person.fullName}</strong>
              <span>
                <code>{person.employeeId}</code> · {person.email} · {person.counter}
              </span>
            </div>
            <span className={`role-badge-tag ${person.role.toLowerCase()}`}>{person.role}</span>
            {person.active ? (
              <span className="active-tag">
                <i /> Active
              </span>
            ) : (
              <span className="status-badge slate" style={{ fontSize: "10px" }}>
                Suspended
              </span>
            )}
            <ChevronRight size={16} />
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddStaff}
          busy={busy}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleEditStaff}
          busy={busy}
        />
      )}
    </section>
  );
}

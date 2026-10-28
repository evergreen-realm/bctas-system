import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Printer,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  type Role,
  type StaffUser,
  ROLE_PERMISSIONS,
  ROLE_ALLOWED_TABS,
} from "@shared/bcatsCore";

// Navigation item schema
export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  section?: string;
}

// Master station navigation manifest
export const navItems: NavItem[] = [
  { path: "/", label: "Command centre", icon: LayoutDashboard },
  { path: "/applications/new", label: "New application", icon: FileText, section: "Registry work" },
  { path: "/records", label: "Birth records", icon: Search, section: "Registry work" },
  { path: "/verification", label: "Verification desk", icon: Fingerprint, section: "Registry work" },
  { path: "/status", label: "Status update", icon: Activity, section: "Registry work" },
  { path: "/printing", label: "Printing centre", icon: Printer, section: "Registry work" },
  { path: "/collection", label: "Collection desk", icon: ClipboardCheck, section: "Registry work" },
  { path: "/reports", label: "Reports & analytics", icon: BarChart3, section: "Oversight" },
  { path: "/audit", label: "Audit log", icon: ShieldCheck, section: "Oversight" },
  { path: "/users", label: "Users & access", icon: Users, section: "Administration" },
  { path: "/settings", label: "Station settings", icon: Settings2, section: "Administration" },
  { path: "/sms", label: "SMS templates", icon: Smartphone, section: "Administration" },
];

function Logo() {
  return (
    <div className="brand">
      <span className="brand-seal">✦</span>
      <span>
        <strong>BCATS</strong>
        <small>Nakuru Civil Registration</small>
      </span>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

export function Notice({
  notice,
  onDismiss,
}: {
  notice: { type: "success" | "error" | "info"; text: string };
  onDismiss?: () => void;
}) {
  return (
    <div className={`notice ${notice.type}`}>
      <span>
        {notice.type === "success" ? (
          <CheckCircle2 size={17} />
        ) : notice.type === "error" ? (
          <AlertTriangle size={17} />
        ) : (
          <Bell size={17} />
        )}
      </span>
      <span>{notice.text}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss notice">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Enterprise-Grade Direct URL Route Guard / 403 Forbidden Access Denied Card
// Strictly enforces Kenya Civil Registration Act (Cap. 149) separation of duties
// ============================================================================
export function AccessDenied({
  role,
  path,
  go,
}: {
  role: Role;
  path: string;
  go: (target: string) => void;
}) {
  return (
    <section
      className="card restricted-card"
      style={{
        maxWidth: "680px",
        margin: "2.5rem auto",
        textAlign: "center",
        padding: "2.5rem 2rem",
      }}
    >
      <div
        className="restricted-icon"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#fee2e2",
          color: "#b91c1c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        <ShieldAlert size={32} />
      </div>
      <SectionEyebrow>Statutory RBAC Enforcement · Civil Registration Services</SectionEyebrow>
      <h2
        style={{
          fontSize: "1.35rem",
          margin: "0.5rem 0 1rem",
          fontWeight: 700,
          color: "var(--foreground, #1e293b)",
        }}
      >
        403 Forbidden: Access Denied
      </h2>
      <p
        style={{
          fontSize: "0.95rem",
          lineHeight: "1.6",
          color: "var(--muted, #64748b)",
          marginBottom: "1.75rem",
        }}
      >
        403 Forbidden: Your assigned role as <strong>{role}</strong> does not have clearance to
        access this function under the Births and Deaths Registration Act (Cap. 149).
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
        <button
          type="button"
          className="btn primary"
          onClick={() => go("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <LayoutDashboard size={15} /> Return to Command Centre
        </button>
      </div>
    </section>
  );
}

// ============================================================================
// Shell Component: Layout, RBAC Filtered Navigation & Station Context
// ============================================================================
export default function Shell({
  path,
  title,
  subtitle,
  role,
  setRole,
  currentUser,
  onLogout,
  children,
  notice,
  onDismiss,
  publicView = false,
  go: customGo,
}: {
  path: string;
  title: string;
  subtitle: string;
  role: Role;
  setRole: (role: Role) => void;
  currentUser: StaffUser;
  onLogout: () => void;
  children: React.ReactNode;
  notice?: { type: "success" | "error" | "info"; text: string };
  onDismiss?: () => void;
  publicView?: boolean;
  go?: (target: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const go = (target: string) => {
    if (customGo) {
      customGo(target);
    } else {
      history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    setOpen(false);
  };

  // Public / Unauthenticated Shell
  if (publicView) {
    return (
      <div className="public-frame">
        <header className="public-header">
          <Logo />
          <div className="public-links">
            <a href="/track">Track an application</a>
            <a className={path === "/apply" ? "active" : ""} href="/apply">
              Apply online
            </a>
            <a href="/login">
              Staff portal <ArrowRight size={14} />
            </a>
          </div>
        </header>
        {notice && <Notice notice={notice} onDismiss={onDismiss} />}
        {children}
        <footer className="public-footer">
          <span>Republic of Kenya · Civil Registration Services</span>
          <span>Privacy and statutory consent under KDPA 2019</span>
        </footer>
      </div>
    );
  }

  // Determine avatar initials
  const initials = currentUser.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Administrator;

  // STRICT RBAC FILTERING:
  // Render ONLY navigation tabs that the authenticated role is authorized to access.
  // Prohibited tabs are NEVER rendered in the DOM.
  const allowedPaths = ROLE_ALLOWED_TABS[role] || ["/"];
  const visibleNavItems = allowedPaths
    .map((p) => navItems.find((item) => item.path === p))
    .filter((item): item is NavItem => Boolean(item));

  // Dynamic section tracking: only render section header when transitioning to a section
  // with at least one visible item.
  let previousSection = "";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="station-chip">
          <span className="live-dot" />
          Station online
          <div>
            <strong>Nakuru Town East</strong>
            <small>{currentUser.counter} · CRS-NAK-05</small>
          </div>
        </div>

        <nav>
          {visibleNavItems.map((item) => {
            const showSectionHeader = item.section && item.section !== previousSection;
            if (item.section) {
              previousSection = item.section;
            }
            return (
              <div key={item.path}>
                {showSectionHeader && <div className="nav-section">{item.section}</div>}
                <a
                  className={path === item.path ? "active" : ""}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.path);
                  }}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                  {path === item.path && <ChevronRight size={14} className="nav-arrow" />}
                </a>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="privacy-note">
            <LockKeyhole size={15} />
            <span>
              <strong>Protected registry</strong>
              <small>All actions are audited</small>
            </span>
          </div>
          <a className="sidebar-public" href="/track">
            Open public tracker <ArrowRight size={14} />
          </a>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="crumb">
            <span>BCATS</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>

          <div className="top-actions">
            <div className="role-switch">
              <span>Acting as</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                aria-label="Select active role"
              >
                <option value="Administrator">Administrator</option>
                <option value="Registrar">Registrar</option>
                <option value="Clerk">Clerk</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>

            <div className="user-info-chip">
              <div className="user-info-text">
                <strong>{currentUser.fullName}</strong>
                <small>
                  <span className={`role-badge-tag ${role.toLowerCase()}`}>{role}</span>
                </small>
              </div>
              <div className="avatar" title={`${currentUser.fullName} (${currentUser.email})`}>
                {initials}
              </div>
              <button
                className="btn-logout"
                onClick={onLogout}
                title="Sign out of current staff session"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="page-head">
            <div>
              <SectionEyebrow>
                {title === "Command centre"
                  ? "Operational workspace · Nakuru Civil Registration"
                  : "Nakuru County · CRS operational desk"}
              </SectionEyebrow>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {title === "Command centre" && permissions.canCreate && (
              <button
                type="button"
                className="btn outline"
                onClick={() => go("/applications/new")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FileText size={16} /> New application
              </button>
            )}
          </div>

          {notice && <Notice notice={notice} onDismiss={onDismiss} />}
          {children}
        </div>
      </main>
    </div>
  );
}


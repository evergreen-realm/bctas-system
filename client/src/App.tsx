import React, { useEffect, useState, useCallback } from "react";
import {
  Smartphone,
  X,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Bell,
  FileCheck2,
} from "lucide-react";
import "./index.css";

import {
  type Application,
  type Role,
  type AuditEntry,
  type Overview,
  type StaffUser,
  type DispatchedSms,
  STAFF_ACCOUNTS,
  ROLE_PERMISSIONS,
  statusTone,
  labelDate,
} from "@shared/bcatsCore";

import {
  getStoredAuthUser,
  setStoredAuthUser,
  localStoreDispatch,
} from "./localStore";

// Modular Screens & Core Components
import Shell, { AccessDenied } from "./components/Shell";
import Dashboard from "./components/Dashboard"; // Screen 08
import LoginScreen from "./components/LoginScreen"; // Screen 01
import SettingsScreen from "./components/SettingsScreen"; // Screen 02
import TrackerScreen from "./components/TrackerScreen"; // Screen 03
import CitizenApplyWizard from "./components/CitizenApplyWizard"; // Screen 04
import VerificationScreen from "./components/VerificationScreen"; // Screen 05
import PrintingScreen from "./components/PrintingScreen"; // Screen 06
import CollectionScreen from "./components/CollectionScreen"; // Screen 07
import NewApplicationScreen from "./components/NewApplicationScreen"; // Screen 09
import StatusPageScreen from "./components/StatusPageScreen"; // Screen 10
import RecordsScreen from "./components/RecordsScreen"; // Screen 11
import SmsScreen from "./components/SmsScreen"; // Screen 12
import ReportsScreen from "./components/ReportsScreen"; // Screen 13
import UsersScreen from "./components/UsersScreen"; // Screen 14
import AuditScreen from "./components/AuditScreen"; // Screen 15
import SimulatedHandsetDrawer from "./components/SimulatedHandsetDrawer";

// ============================================================================
// Resilient API Helper: Remote Edge API with Local Store Fallback
// Guarantees 100% offline resilience and zero HTML crashes
// ============================================================================
async function api<T>(
  path: string,
  options?: RequestInit,
  activeRole: Role = "Administrator",
  activeStaff?: StaffUser
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/bcats${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-bcats-role": activeRole,
        "x-bcats-staff": activeStaff?.fullName || "Staff operator",
        ...(options?.headers || {}),
      },
    });
  } catch (networkError: any) {
    console.info(`[BCATS] Resilient offline fallback activated for ${path}:`, networkError?.message);
    return localStoreDispatch<T>(path, options, activeRole, activeStaff);
  }

  const contentType = response.headers.get("content-type") || "";

  // If server returned non-JSON (e.g. SPA fallback <!doctype html>), dispatch to local store
  if (!contentType.includes("application/json")) {
    console.warn(
      `[BCATS] Non-JSON response for /api/bcats${path} (${response.status} ${contentType}). Dispatching to local store.`
    );
    return localStoreDispatch<T>(path, options, activeRole, activeStaff);
  }

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status}: The request could not be completed.`);
  }
  return body as T;
}

// ============================================================================
// Application Detail Drawer
// ============================================================================
function DetailDrawer({
  item,
  role,
  close,
  notify,
  refresh,
  apiCall,
}: {
  item: Application;
  role: Role;
  close: () => void;
  notify: (type: "success" | "error" | "info", text: string) => void;
  refresh: () => void;
  apiCall: <T>(path: string, options?: RequestInit) => Promise<T>;
}) {
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    try {
      await apiCall(
        `/applications/${item.applicationId}/status`,
        {
          method: "POST",
          body: JSON.stringify({
            nextStatus: "Approved",
            justification: "Registrar statutory approval from counter terminal",
          }),
        }
      );
      notify("success", `${item.trackingNumber} approved and audit trail updated.`);
      refresh();
      close();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Approval failed.");
    } finally {
      setBusy(false);
    }
  };

  const isRegistrarOrAdmin = ["Registrar", "Administrator"].includes(role);

  return (
    <div className="drawer-backdrop" onClick={close}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={close} aria-label="Close drawer">
          <X size={18} />
        </button>

        <div className="eyebrow">Application profile</div>
        <h2>{item.childName}</h2>
        <p className="tracking big">{item.trackingNumber}</p>
        <span className={`status-badge ${statusTone[item.currentStatus] || "slate"}`}>
          <span className="status-dot" />
          {item.currentStatus}
        </span>

        <div className="detail-section">
          <h3>Child details</h3>
          <div className="detail-grid">
            <span>
              Date of birth<strong>{labelDate(item.dateOfBirth)}</strong>
            </span>
            <span>
              Place of birth<strong>{item.placeOfBirth}</strong>
            </span>
            <span>
              Birth notification<strong>{item.birthNotificationNo}</strong>
            </span>
            <span>
              Sub-county<strong>{item.subCounty}</strong>
            </span>
          </div>
        </div>

        <div className="detail-section">
          <h3>Parent / guardian</h3>
          <div className="detail-grid">
            <span>
              Full name<strong>{item.parentFullName}</strong>
            </span>
            <span>
              National ID<strong>••••{item.parentNationalId.slice(-4)}</strong>
            </span>
            <span>
              Phone<strong>{item.contactPhone}</strong>
            </span>
            <span>
              Relationship<strong>{item.parentRelationship}</strong>
            </span>
          </div>
        </div>

        {item.certificate && (
          <div className="detail-section">
            <h3>Certificate instrument</h3>
            <div className="detail-grid">
              <span>
                Certificate No<strong>{item.certificate.certificateNumber}</strong>
              </span>
              <span>
                Security Serial<strong>{item.certificate.securitySerialNumber}</strong>
              </span>
              <span>
                Issue Date<strong>{labelDate(item.certificate.issuedDate)}</strong>
              </span>
              <span>
                Collector<strong>{item.certificate.collectorName || "—"}</strong>
              </span>
            </div>
          </div>
        )}

        <div className="timeline">
          <h3>Audited State Timeline</h3>
          {item.statusHistory
            .slice()
            .reverse()
            .map((event, i) => (
              <div className="timeline-item" key={`${event.changedAt}-${i}`}>
                <span className="timeline-marker" />
                <div>
                  <strong>{event.newStatus}</strong>
                  <small>{event.justification}</small>
                  <time>
                    {labelDate(event.changedAt)} · {event.actor || "System"}
                  </time>
                </div>
              </div>
            ))}
        </div>

        {/* Action Button: Gated by Role */}
        {item.currentStatus === "Verified" && (
          <>
            {isRegistrarOrAdmin ? (
              <button
                type="button"
                onClick={approve}
                disabled={busy}
                className="btn primary full"
                style={{ marginTop: "1rem" }}
              >
                {busy ? "Saving…" : "Approve application (Form 5)"} <ArrowRight size={15} />
              </button>
            ) : role === "Auditor" ? (
              <div className="legal-callout" style={{ marginTop: "1rem" }}>
                <ShieldCheck size={16} />
                <span>
                  Statutory Oversight Mode: Verified application awaiting legal decision by
                  Registrar. Audit access to birth records is strictly read-only under Cap. 149.
                </span>
              </div>
            ) : (
              <div className="legal-callout" style={{ marginTop: "1rem" }}>
                <LockKeyhole size={16} />
                <span>
                  This application has passed identity verification and is awaiting legal approval
                  by the Registrar (Counter R1).
                </span>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

// ============================================================================
// Main Application Component
// ============================================================================
function App() {
  const [path, setPath] = useState(window.location.pathname);

  // Load persisted staff session or default to Faith Njeri (Admin)
  const storedUser = getStoredAuthUser();
  const defaultUser = STAFF_ACCOUNTS[2]; // Faith Njeri, Admin
  const [currentUser, setCurrentUser] = useState<StaffUser>(storedUser || defaultUser);
  const [role, setRoleState] = useState<Role>(currentUser.role);

  // Registry state
  const [overview, setOverview] = useState<Overview>({
    total: 0,
    counts: {},
    slaFlags: 0,
    today: 0,
    throughput: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [dispatchedSms, setDispatchedSms] = useState<DispatchedSms[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string }>();
  const [loading, setLoading] = useState(true);
  const [handsetOpen, setHandsetOpen] = useState(false);

  const notify = (type: "success" | "error" | "info", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(undefined), 5200);
  };

  // Bound API helper passing active role and staff credentials
  const apiCall = useCallback(
    <T,>(endpoint: string, options?: RequestInit) =>
      api<T>(endpoint, options, role, currentUser),
    [role, currentUser]
  );

  // Switch role and update corresponding staff identity dynamically
  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    const matchedAccount =
      STAFF_ACCOUNTS.find((a) => a.role === newRole) || defaultUser;
    const updatedUser: StaffUser = {
      employeeId: matchedAccount.employeeId,
      fullName: matchedAccount.fullName,
      role: newRole,
      email: matchedAccount.email,
      counter: matchedAccount.counter,
      active: true,
      eulaAcceptedAt: new Date().toISOString(),
    };
    setCurrentUser(updatedUser);
    setStoredAuthUser(updatedUser);
    notify("info", `Switched to ${newRole} mode (${updatedUser.fullName} · ${updatedUser.counter}).`);

    api<{
      overview: Overview;
      applications: Application[];
      staff: StaffUser[];
    }>("/bootstrap", undefined, newRole, updatedUser)
      .then((data) => {
        setOverview(data.overview);
        setApplications(data.applications);
        setStaff(data.staff);
      })
      .catch(() => undefined);

    if (newRole === "Auditor" || newRole === "Administrator") {
      api<AuditEntry[]>("/audit", undefined, newRole, updatedUser)
        .then(setAuditEntries)
        .catch(() => undefined);
    }
  };

  const handleLoginSuccess = (user: StaffUser) => {
    setCurrentUser(user);
    setRoleState(user.role);
    notify("success", `Welcome, ${user.fullName} (${user.role} — ${user.counter}).`);
    go("/");
  };

  const handleLogout = () => {
    setStoredAuthUser(null);
    notify("info", "Signed out of BCATS registry.");
    go("/login");
  };

  // Data refresh helper
  const refresh = useCallback(() => {
    return Promise.all([
      api<{
        overview: Overview;
        applications: Application[];
        staff: StaffUser[];
      }>("/bootstrap", undefined, role, currentUser).then((data) => {
        setOverview(data.overview);
        setApplications(data.applications);
        setStaff(data.staff);
      }),
      api<DispatchedSms[]>("/sms/dispatched", undefined, role, currentUser)
        .then(setDispatchedSms)
        .catch(() => undefined),
      (role === "Auditor" || role === "Administrator")
        ? api<AuditEntry[]>("/audit", undefined, role, currentUser)
            .then(setAuditEntries)
            .catch(() => undefined)
        : Promise.resolve(),
    ]).catch((error) =>
      notify("error", error instanceof Error ? error.message : "Could not load registry.")
    );
  }, [role, currentUser]);

  // Route navigation
  const go = (target: string) => {
    history.pushState({}, "", target);
    setPath(target);
    setSelected(null);
  };

  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname);
      setSelected(null);
    };
    window.addEventListener("popstate", onPop);
    refresh().finally(() => setLoading(false));

    return () => window.removeEventListener("popstate", onPop);
  }, [refresh]);

  // Sync background polling every 25 seconds
  useEffect(() => {
    const interval = window.setInterval(refresh, 25000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  // Route titles & metadata
  const titles: Record<string, [string, string]> = {
    "/": [
      "Command centre",
      `A calm, accountable view of Nakuru station operations · ${currentUser.counter}`,
    ],
    "/dashboard": [
      "Command centre",
      `A calm, accountable view of Nakuru station operations · ${currentUser.counter}`,
    ],
    "/applications/new": [
      "New application",
      "Capture statutory birth registration details at the counter.",
    ],
    "/records": [
      "Birth records",
      "Search the registry by tracking number, child, parent, National ID, or status.",
    ],
    "/verification": [
      "Verification desk",
      "Compare hospital notification and parent identity evidence before advancing the case.",
    ],
    "/status": [
      "Status update",
      "Move applications through the audited lifecycle state machine.",
    ],
    "/printing": [
      "Printing centre",
      "Issue security-serialized Form 5 certificates only after Registrar approval.",
    ],
    "/collection": [
      "Collection desk",
      "Complete the final physical handover with National ID and biometric signature evidence.",
    ],
    "/reports": [
      "Reports & analytics",
      "Throughput, turnaround, sub-county distribution, and SLA attention signals.",
    ],
    "/audit": [
      "Audit log",
      "Review the append-only non-repudiation ledger for every consequential action.",
    ],
    "/users": [
      "Users & access",
      "Manage operational roles and preserve least-privilege access to the registry.",
    ],
    "/settings": [
      "Station settings",
      "Keep the Nakuru station identity, SLA rules, and integration boundaries visible.",
    ],
    "/sms": [
      "SMS templates",
      "Maintain audited citizen notification updates for the Africa's Talking delivery adapter.",
    ],
  };

  // Unauthenticated / Public Views
  if (path === "/login") {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} api={apiCall} />;
  }

  if (path === "/track") {
    return (
      <Shell
        path={path}
        title="Public Status Tracker"
        subtitle="Citizen Self-Service Portal"
        role={role}
        setRole={setRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        notice={notice}
        onDismiss={() => setNotice(undefined)}
        publicView
      >
        <TrackerScreen notify={notify} api={apiCall} />
        {/* Floating Simulated Handset Drawer */}
        <SimulatedHandsetDrawer
          isOpen={handsetOpen}
          onClose={() => setHandsetOpen(false)}
          messages={dispatchedSms}
          onRefresh={refresh}
          onSendTest={async (phone, text) => {
            await apiCall("/sms/test", { method: "POST", body: JSON.stringify({ phone, text }) });
            refresh();
          }}
        />
        <button
          type="button"
          className="floating-handset-btn no-print"
          onClick={() => setHandsetOpen(true)}
          title="Open Simulated Citizen Handset"
        >
          <Smartphone size={20} />
          <span>Simulated Handset</span>
          {dispatchedSms.length > 0 && (
            <span className="handset-badge">{dispatchedSms.length}</span>
          )}
        </button>
      </Shell>
    );
  }

  if (path === "/apply") {
    return (
      <Shell
        path={path}
        title="Apply for Birth Certificate"
        subtitle="Republic of Kenya · Civil Registration Services"
        role={role}
        setRole={setRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        notice={notice}
        onDismiss={() => setNotice(undefined)}
        publicView
      >
        <CitizenApplyWizard
          role="Citizen"
          notify={notify}
          refresh={refresh}
          go={go}
          api={apiCall}
        />
        {/* Floating Simulated Handset Drawer */}
        <SimulatedHandsetDrawer
          isOpen={handsetOpen}
          onClose={() => setHandsetOpen(false)}
          messages={dispatchedSms}
          onRefresh={refresh}
          onSendTest={async (phone, text) => {
            await apiCall("/sms/test", { method: "POST", body: JSON.stringify({ phone, text }) });
            refresh();
          }}
        />
        <button
          type="button"
          className="floating-handset-btn no-print"
          onClick={() => setHandsetOpen(true)}
          title="Open Simulated Citizen Handset"
        >
          <Smartphone size={20} />
          <span>Simulated Handset</span>
          {dispatchedSms.length > 0 && (
            <span className="handset-badge">{dispatchedSms.length}</span>
          )}
        </button>
      </Shell>
    );
  }

  const isKnownRoute = Boolean(titles[path]);
  const [resolvedTitle, resolvedSubtitle] = titles[path] || [
    "BCATS workspace",
    "The requested screen is not in the operational route manifest.",
  ];

  // Role permission verification
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Administrator;
  const isAuthorized =
    path === "/" || path === "/dashboard" || permissions.allowedRoutes.includes(path);

  const title = !isKnownRoute
    ? "404 Not Found"
    : isAuthorized
    ? resolvedTitle
    : "403 Forbidden";
  const subtitle = !isKnownRoute
    ? "The requested screen is not in the operational route manifest."
    : isAuthorized
    ? resolvedSubtitle
    : "Access restricted under the Births and Deaths Registration Act (Cap. 149).";

  let content: React.ReactNode;

  if (loading) {
    content = (
      <section className="card">
        <div className="loading">Connecting to Nakuru Civil Registration Registry…</div>
      </section>
    );
  } else if (!isKnownRoute) {
    content = (
      <section className="card">
        <div className="empty">
          <FileCheck2 size={24} />
          <strong>Screen not found</strong>
          <span>Choose an available workflow from the registry navigation rail.</span>
        </div>
      </section>
    );
  } else if (!isAuthorized) {
    content = <AccessDenied role={role} path={path} go={go} />;
  } else if (path === "/" || path === "/dashboard") {
    content = (
      <Dashboard
        role={role}
        currentUser={currentUser}
        overview={overview}
        applications={applications}
        auditEntries={auditEntries}
        go={go}
        setSelected={setSelected}
      />
    );
  } else if (path === "/applications/new") {
    content = (
      <NewApplicationScreen
        role={role}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/records") {
    content = (
      <RecordsScreen
        role={role}
        applications={applications}
        setSelected={setSelected}
        go={go}
      />
    );
  } else if (path === "/verification") {
    content = (
      <VerificationScreen
        role={role}
        applications={applications}
        notify={notify}
        setSelected={setSelected}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/status") {
    content = (
      <StatusPageScreen
        role={role}
        applications={applications}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/printing") {
    content = (
      <PrintingScreen
        role={role}
        applications={applications}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/collection") {
    content = (
      <CollectionScreen
        role={role}
        applications={applications}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/reports") {
    content = (
      <ReportsScreen
        role={role}
        applications={applications}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/audit") {
    content = <AuditScreen api={apiCall} notify={notify} />;
  } else if (path === "/users") {
    content = (
      <UsersScreen
        staff={staff}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/settings") {
    content = (
      <SettingsScreen
        role={role}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  } else if (path === "/sms") {
    content = (
      <SmsScreen
        role={role}
        notify={notify}
        refresh={refresh}
        api={apiCall}
      />
    );
  }

  return (
    <Shell
      path={path}
      title={title}
      subtitle={subtitle}
      role={role}
      setRole={setRole}
      currentUser={currentUser}
      onLogout={handleLogout}
      notice={notice}
      onDismiss={() => setNotice(undefined)}
      go={go}
    >
      {content}

      {/* Application Profile Drawer */}
      {selected && (
        <DetailDrawer
          item={selected}
          role={role}
          close={() => setSelected(null)}
          notify={notify}
          refresh={refresh}
          apiCall={apiCall}
        />
      )}

      {/* Floating Simulated Citizen Handset Button & Drawer */}
      <button
        type="button"
        className="floating-handset-btn no-print"
        onClick={() => setHandsetOpen(true)}
        title="Open Simulated Citizen Handset"
      >
        <Smartphone size={20} />
        <span>Simulated Handset</span>
        {dispatchedSms.length > 0 && (
          <span className="handset-badge">{dispatchedSms.length}</span>
        )}
      </button>

      <SimulatedHandsetDrawer
        isOpen={handsetOpen}
        onClose={() => setHandsetOpen(false)}
        messages={dispatchedSms}
        onRefresh={refresh}
        onSendTest={async (phone, text) => {
          await apiCall("/sms/test", { method: "POST", body: JSON.stringify({ phone, text }) });
          refresh();
        }}
      />
    </Shell>
  );
}

export default App;

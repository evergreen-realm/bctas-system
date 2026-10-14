# BCATS Delivery Checklist

- Implement a runnable Nakuru Civil Registration Office application with public tracking and staff workflows.
- Expose all 15 supplied workflow surfaces as navigable routes: Login, Station Settings, Public Tracker, Public Application, Verification Desk, Printing Centre, Collection Desk, Dashboard, New Application, Status Update, Records Search, SMS Templates, Reports & Analytics, User Roles & Access, and Audit Log.
- Enforce lifecycle states Submitted, Pending Verification, Verified, Approved, Printed, Collected, Deficient, and On Hold through aggregate transition methods.
- Validate Kenya national IDs, normalize Kenyan E.164 phone numbers, require statutory KDPA consent on public intake, and preserve clear recovery messages.
- Publish typed domain events after successful persistence for submitted, identity verified, status changed, certificate generated, and certificate collected actions.
- Persist applications, staff, audit entries, status history, certificates, SMS templates/logs, OTP sessions, settings, and users in the relational migration contract; use atomic file persistence for Preview fallback.
- Record an append-only audit entry for state changes, verification, certificate issuance, handover, settings changes, and external integration checks.
- Provide server-side role checks for Clerk, Registrar, Administrator, Auditor, and Citizen behaviors and keep critical actions confirmation-gated in the interface.
- Include Official Secrets Act staff acknowledgement, EULA copy, Kenya Data Protection Act consent language, security headers, input validation, rate-limit-ready adapters, and signed certificate verification tokens.
- Include Cloudflare/Workers configuration, D1/R2 binding declarations, private-GitHub-ready hygiene, security disclosure guidance, environment documentation, and CI/CD workflow.
- Generate Milestone 3 Implementation and Milestone 4 Testing & Deployment report sources and DOCX files from the supplied academic assets.
- Verify health, application creation, public tracking, verification, status transition, printing, collection, reports, audit, typecheck, tests, and production build before delivery.

# Zetech University

## Meshack Maluki

# Milestone 4: System Testing, Deployment, Conclusion and Recommendations

## 4.1 System Testing
The implementation provides health, application creation, public tracking, verification, status transition, printing, collection, reports, audit, typecheck, unit-test, and production-build checks. Illegal transitions and unauthorised approval/printing/collection attempts return human-readable errors.

## 4.2 Deployment Architecture
The project is a managed React/Express/Drizzle web application with a Cloudflare-ready wrangler configuration for D1 and R2, a Dockerfile-backed runtime, private GitHub hygiene, and a GitHub Actions workflow that installs pinned pnpm tooling, audits dependencies, typechecks, tests, builds, and deploys the static publication output.

## 4.3 User Training and System Manual
Clerks use the intake and verification screens, Registrars approve and print, collection officers record handover, Administrators manage station settings and users, Auditors review the append-only log, and citizens use tracking and consented intake. The interface keeps the system status visible and disables invalid workflow actions.

## 4.4 Conclusion and Recommendations
BCATS provides a traceable path from birth notification to certificate collection and gives Nakuru staff a shared operational view of backlog, SLA risk, and throughput. Future phases should connect approved IPRS/e-Birth mTLS credentials, Africa's Talking messaging, biometric capture hardware, production D1/R2 resources, and a formal user acceptance study with Civil Registration clerks.

## References
Civil Registration Services. (2019). Kenya Data Protection Act, 2019.
Government of Kenya. (2012). Births and Deaths Registration Act (Cap. 149).
Nielsen, J. (1994). Enhancing the explanatory power of usability heuristics. CHI.
OWASP Foundation. (2021). OWASP Top 10.

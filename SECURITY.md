# BCATS Security

BCATS handles sensitive birth-registration and parent identity data. Report suspected vulnerabilities privately to the system owner and the Nakuru Civil Registration Office security contact; do not publish citizen data, credentials, certificates, or audit exports in an issue.

The implementation applies server-side role checks, strict input validation, parameterized relational migration contracts, signed certificate verification hashes, immutable audit records, security response headers, explicit adapter allowlists, and consent/EULA flows. Production deployment must use TLS, managed secrets, MFA-enabled staff accounts, database backups, restricted Cloudflare bindings, and an approved incident-response contact.

A suspected Kenya Data Protection Act 2019 incident must be contained, preserved for audit, escalated to the responsible Data Protection Officer, and handled under the Office's statutory notification procedure. The application records the action, actor, request metadata, and timestamp for each consequential workflow event.

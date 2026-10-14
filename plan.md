# BCATS Implementation Plan

## Product scope
BCATS is a Nakuru Civil Registration Office workflow console and public citizen portal. The cloud deliverable provides a runnable full-stack application with a typed domain/event layer, persistent development data, the fifteen supplied workflow surfaces, audit and reporting views, deployable repository scaffolding, and academic report sources. External government and SMS gateways remain explicit adapters until credentials are supplied.

## Implementation approach
- **Frontend:** React + TypeScript + Wouter with a civic editorial console shell. Each supplied screen is a real route with live fetch/mutation behavior, shared status badges, searchable tables, forms, confirmation dialogs, and responsive layouts.
- **Backend:** Express routes under `/api/bcats/*` plus the starter health and OAuth routes. The domain store exposes aggregate operations rather than route-level mutation logic.
- **Domain:** `ApplicationAggregate` owns lifecycle transitions. `ApplicantEntity`, `CertificateEntity`, and immutable `VerificationResultVO` types are represented in the store. A typed `EventBus` emits submitted, verified, status-changed, certificate-generated, and collected events.
- **Persistence:** `server/bcatsStore.ts` uses an atomic JSON file in `data/` for a complete Preview workflow and restart-safe local persistence. `drizzle/schema.ts` and `drizzle/001_bcats.sql` contain the ACID relational shape for the managed database migration. Mutation methods snapshot state, roll back on failure, and emit events only after persistence succeeds.
- **Integrations:** IPRS, e-Birth, eCitizen, Africa's Talking, and document storage are explicit adapter boundaries with configuration checks and safe audit-visible outcomes; no external credentials are invented.
- **Security/legal:** strict server validation, role-aware request metadata, security headers that preserve embedded Preview, audit records, EULA/Official Secrets acknowledgement, and KDPA consent flows are included.
- **Reports:** Markdown and DOCX report sources are generated from implementation evidence and reference the supplied screens, diagrams, templates, milestones, and rubric.

## Design direction
- **Movement:** civic editorial dashboard: warm community-service surfaces combined with a quiet registry-room control panel.
- **Principles:** operational clarity first; calm, high-contrast hierarchy; warm Kenyan civic accents; progressive disclosure for sensitive details.
- **Color philosophy:** parchment and cloud-white reduce visual fatigue for counter staff; deep ink anchors trust; terracotta signals action; emerald, amber, indigo, and rose are reserved for lifecycle meaning.
- **Layout paradigm:** left rail + page-level command strip + asymmetric content split. High-value operational state sits in a compact rail while work areas use cards and tables.
- **Signature elements:** terracotta civic seal mark, numbered workflow rail, and status timeline with a thin signal line.
- **Interaction:** every write returns a toast and updates visible status; illegal transitions are not offered; forms keep context and show human-readable errors.
- **Animation:** short 160ms fade/slide for drawers and toast feedback, with no decorative motion on data-dense screens.
- **Typography:** system sans for body and a restrained serif display face for page titles; tabular numerals for metrics.
- **Brand essence:** “A clear, accountable path from birth notification to certificate collection.” Personality: dependable, humane, exact.
- **Brand voice:** CTAs say “Open verification queue” and “Record handover”; helper copy says “Every transition leaves an accountable trail.”
- **Wordmark:** BCATS in an ink wordmark paired with a terracotta circular seal containing a simplified registry mark.
- **Signature color:** Nakuru terracotta `#C45F3C`.

## Project structure
- `client/src/App.tsx` — route map, console shell, public portal, and screen components.
- `client/src/index.css` — civic editorial design system and responsive behavior.
- `server/bcatsStore.ts` — aggregate state, persistence, event bus, seed data, and reporting queries.
- `server/bcatsApi.ts` — REST handlers, validation, transition guards, and adapter health.
- `server/_core/index.ts` — Express mounting and response security headers.
- `drizzle/schema.ts`, `drizzle/001_bcats.sql` — relational implementation contract.
- `reports/` — milestone 3 and milestone 4 report sources and generated documents.
- `.github/workflows/deploy.yml`, `wrangler.toml`, `SECURITY.md`, `.env.example` — repository and deployment handoff.
- `public/manus-routes.json` — complete route manifest for Preview and publication.

## Delivery workflow
1. Run diagnostics, typecheck, unit tests, and production build.
2. Start Preview and exercise health, overview, public tracking, form submission, status transition, verification, printing, collection, audit, and reports endpoints.
3. Generate milestone documents from report sources and verify them.
4. Commit and push to the managed canonical `main` branch so the project records a checkpoint. Publication remains subject to deployment settings and external Cloudflare/GitHub secrets.

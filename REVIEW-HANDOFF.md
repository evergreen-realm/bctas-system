# BCATS Review Handoff

## Included

- Complete source repository at commit `aea1c6a39a6a401bb9e70750c4efcb2a05d3711e`
- `.git` history and canonical `main` branch metadata
- Frontend, Express API, domain store, Drizzle schema and BCATS migration
- Academic implementation/testing reports in Markdown and PDF
- Acceptance, frontend, performance and database reliability test report
- Cloudflare/Wrangler and GitHub Actions scaffolding
- `plan.md`, `TODO.md`, `SECURITY.md`, `LICENSE`, and `.env.example`

## Live Preview

https://3000-itsjbqqyvewvi78owuxt8-2d7f9d6b.us4.manus.computer/

Useful routes:

- `/` — command centre
- `/track` — public tracker
- `/apply` — public application
- `/verification` — verification desk
- `/printing` — printing centre
- `/collection` — collection desk
- `/reports` — reports and analytics
- `/audit` — audit log

## Local start

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

The local Preview uses the configured port, normally `3000`.

## Cloudflare access and credentials

No Cloudflare password, API token, private key, or secret is included in this export. Secrets must not be placed in source control or sent through chat. To review Cloudflare artifacts, sign in to the Cloudflare dashboard with your own authorized account or create a local `.env` from `.env.example` using credentials stored in your password manager. The repository contains only safe Wrangler binding declarations and deployment scaffolding.

## Important production limitation

The tested workflow currently uses the local Preview JSON persistence fallback at `data/bcats-state.json`. The managed MySQL connection is reachable, but the BCATS domain migration has not yet been applied and the domain repositories/transactions are not wired to MySQL. See `reports/BCATS_Acceptance_Performance_Test_Report.md` before treating this as production-ready.

# Deployment

The live application is deployed as a Cloudflare Worker with a managed D1 database through Sites. `LIVE_URL.txt` records the actual published URL. The app has public reviewer access and uses simulated identities. No reviewer payment or API key is required.

## Configuration

`.openai/hosting.json` declares the deployed project's identity and the `DB` D1 binding; R2 is unused. `vite.config.ts` keeps the supplied Sites build integration. `worker/index.ts` is the Worker entry point. The production build emits `dist/server/index.js`, assets, and runtime metadata. Drizzle migrations are schema-only; user data is created through normal API requests.

## Publish workflow used

1. Generate and inspect the schema migration.
2. Run tests, typecheck, production build and browser QA.
3. Synchronize the exact source commit to the hosting source repository.
4. Package that commit's build output, save a version, and deploy it.
5. Confirm the returned deployment status and URL.

The included project ID identifies this submitted demo. It is not a credential. To create an independent Sites deployment, register a new project and update the ID via the supported hosting tools; do not try to publish into someone else's project. Credentials, runtime state and dependency folders are excluded from the ZIP.

## Local operation

`npm ci && npm run db:migrate && npm run dev` is sufficient without cloud credentials. Local D1 and hosted D1 are separate databases; imported files and document edits in one do not populate the other. Production build preview uses `npm run build` followed by `npm start`.

Local `wrangler.local.json` exists only for migrations. Its placeholder database ID is for emulation, not a production database. Do not use it with `--remote`.

## Operations limitations

No automatic backup policy, monitoring dashboard, rate limiting, quotas, or multi-tenant isolation is implemented. The demo is for non-sensitive evaluation data only. A real deployment should introduce verified sessions, tenant boundaries, backup/restore procedures and service monitoring before user rollout. Hosting availability depends on the owner's account and provider quotas.

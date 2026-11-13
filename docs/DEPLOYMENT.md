# Deployment

The live app (see `LIVE_URL.txt`) runs on Vercel as a standard Next.js project, with a Neon Postgres database. Reviewers need no account, payment or key. Identities are simulated.

## Configuration

- **Vercel project:** `ajaia-docs`, connected to the GitHub repo. Every push to `main` deploys to production.
- **Database:** Neon (free plan, region `iad1`), added through the Vercel Marketplace. The integration sets `DATABASE_URL` (pooled) and related variables for Production, Preview and Development. The app reads `DATABASE_URL`, falling back to `POSTGRES_URL`.
- **Schema:** `db/postgres-schema.mjs`. It is idempotent (`CREATE TABLE IF NOT EXISTS`), runs during `npm run build`, and runs again on each server instance's first query. No manual migration is needed.
- **Data access:** `db/index.ts` adapts `pg` to the small `prepare().bind().first()/all()/run()` interface used by `lib/service.ts`, so the same SQL runs in production (Postgres) and in unit tests (in-memory SQLite).

## Redeploying

Push to `main`, or from a linked checkout:

```sh
npx vercel redeploy https://ajaia-docs-one-pi.vercel.app --environment production
```

Changing environment variables requires a redeploy to take effect.

## Operations limitations

No automatic backup policy beyond Neon's defaults, no monitoring dashboard, rate limiting, quotas, or multi-tenant isolation. The demo is for non-sensitive evaluation data only. A real deployment should introduce verified sessions, tenant boundaries, backup/restore procedures and service monitoring before user rollout.

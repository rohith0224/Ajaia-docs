# AI workflow disclosure

Two AI tools were used. The original implementation was produced with OpenAI Codex in ChatGPT Work, including AI-written application code and documentation. It should not be represented as solely human-authored work. The candidate should review, run, and understand it before submitting or discussing implementation decisions.

The move from Cloudflare to Vercel and Neon Postgres, the repository and deployment setup, and later fixes were done with Claude Code (Anthropic, Claude Opus 5.5) in VS Code. That part is described in its own section below.

## Where AI accelerated the work

Codex created the React interface, service/API layer, structured-content validation, SQL schema, tests, and submission materials. Tool-assisted execution built the project, ran SQLite tests and type checks, exercised the UI in a browser, and packaged the deliverables. A supplied hosting starter provided the Worker/runtime build plumbing. No application feature calls an AI model; reviewers need no AI API key.

## Output changed or rejected during implementation

The first test adapter contained a syntax error and was corrected before tests passed. Type checking caught the HTTP JSON result's unknown type; response handling was made explicit. Browser inspection exposed that changing the editor's editable flag could emit an unnecessary update; that emission was disabled. The save queue was corrected so a failed in-flight save returns failure rather than recursively retrying through a stale state closure.

The implementation deliberately avoids a naive last-write-wins save, arbitrary persisted HTML, pretend real-time synchronization, and password fields that would imply real authentication. Instead it uses version-checked writes, a bounded rich-text JSON schema, and a clearly labeled demo account switcher.

## Verification and limits

Automated SQLite tests cover actual migration/query execution, formatting round trips, access denial, viewer/editor behavior, owner-only sharing, revocation, duplicate grants, stale updates, and invalid content. Type checking and the production build were run. Browser inspection exercises the main flow and provides screenshots. Exact completed checks are recorded in TESTING.md; a script being included does not imply it was run successfully.

No AI output was treated as proof of correctness. Generated code was revised in response to concrete compiler, test, and browser observations. There was no independent human review during this generation session. The candidate must verify their own deployment and record an honest walkthrough, including the mock-auth and non-real-time limitations.

## Claude Code: GitHub, Vercel and Postgres migration

**What it did**

- Set up a standalone Git repository and pushed it to GitHub over SSH.
- Ported the app from Cloudflare Workers + D1 to standard Next.js on Vercel with Neon Postgres (`db/index.ts`, `db/postgres-schema.mjs`, `scripts/migrate-postgres.mjs`, API route, npm scripts).
- Used the Vercel CLI to link the project, provision the free Neon database through the Vercel Marketplace, connect it, and redeploy. The candidate approved the Vercel sign-in and accepted Neon's terms in the browser.
- Renamed the demo account "Alex Morgan" to "Rohith Sunkara" across code, tests and docs.
- Updated the README, deployment, architecture and this note.

**Where it sped things up**

Finding every Cloudflare-specific dependency, writing a driver adapter that kept the existing service code untouched, and provisioning the database and environment variables from the command line rather than clicking through dashboards.

**What was changed or rejected**

- The working directory turned out to be inside a Git repository rooted at the home folder. Committing there would have pushed unrelated private files such as `~/.ssh`. A separate repository was created for the project instead.
- Turso (hosted SQLite) was suggested first because it needed fewer changes; the candidate chose Neon Postgres instead.
- Neon's own HTTP driver was set aside for the standard `pg` driver so the code could be tested against a local Postgres before deploying.
- One query used `END role` without `AS`. It was changed to `AS role`, which works on both Postgres and SQLite, so the existing SQLite tests still run the production SQL.
- The first Vercel deploy showed "Something went wrong" on create: the schema was only applied at build time, and that build ran before the database was connected. A lazy schema step on first query was added, and `POSTGRES_URL` was accepted as a fallback variable name.
- Moving existing "alex" documents to "rohith" in the production database was blocked by a permission check and was not done. Documents created under the old account ID are not visible under the renamed account.

**How it was verified**

- The HTTP smoke test (create, permissions, save, version conflict, revocation, import, validation, identity and origin checks) was run against a throwaway local Postgres 17, including a completely empty database with no migration step.
- The same smoke test was run against the live Vercel deployment after each deploy, and passed.
- `npm test` (8 tests), `npm run typecheck` and `next build` were run after each change.
- Claude Code did not test the UI in a browser after the migration; it checked the live API only. The candidate should click through the main flow on the live site before submitting.

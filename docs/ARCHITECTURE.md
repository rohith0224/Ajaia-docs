# Architecture and product decisions

## Scope

The core product slice is: create → edit → save → share → reopen as another account. A reliable shared document matters more than decorative Google Docs parity. Imports create new documents so they cannot accidentally replace an existing draft. Only plain UTF-8 text is supported; this avoids fragile DOCX conversion inside the timebox. Editor/viewer roles are the single small stretch beyond basic sharing.

## Request and data flow

React renders a workspace and a Tiptap/ProseMirror editor. The browser sends JSON to a same-origin HTTP API. The API resolves a declared demo identity, validates data, and delegates to a service backed by parameterized SQL queries. The app is a standard Next.js project deployed on Vercel: the page is prerendered and `app/api/[...path]/route.ts` runs as a Node.js serverless function. Neon Postgres supplies durable storage.

Two tables suffice. `documents` stores owner, title, structured JSON content, optimistic version, and timestamps. `shares` stores `(document_id, user_id)` as a composite primary key and the viewer/editor role. Its foreign key references the document. Identity is a fixed set of seeded account definitions rather than a user-management subsystem. There are no uploaded file blobs: imported text becomes validated document content.

## Editing and saving

Tiptap handles selections, keyboard behavior, lists, and history. The server accepts a deliberately limited tree and text-style set. It removes extra attributes rather than storing arbitrary HTML or URLs. Text that resembles HTML remains text. The database stores structured JSON so formatting survives refresh and future rendering can use a known schema.

Autosave is debounced by 900 ms. A single in-flight save is serialized; edits made while it is in flight are saved in the next request using the returned version. Switching documents or accounts first flushes changes. A failure keeps the draft in the tab and exposes retry/download/reload controls.

Every update compares `version` and increments it in the same SQL statement. The statement also checks current owner/editor rights. This prevents a revoked editor or a stale version from winning a write. First successful save wins; later stale saves return 409. This is **collaborative access**, not real-time co-editing or a CRDT.

## Permission boundary

List and read queries require owner or a matching grant. Unavailable documents return 404 to avoid disclosing their existence. Writes require owner/editor access. Only owners manage grants. The UI mirrors these rules, but the server remains authoritative. SQL binds every user-controlled value.

`x-demo-user` is explicitly simulated authentication permitted by the assignment. It is not proof of a person's identity. The live app is a disposable evaluation sandbox: all visitors can select all three identities. Real use requires verified sessions and tenant isolation. Server-side authorization is meaningful within the selected demo identity, not protection against impersonation.

## Deployment and reliability

One Vercel project serves frontend and API; one Neon Postgres database (free plan, `iad1`, same region as the functions) holds all records. Vercel's Neon integration injects `DATABASE_URL`. The schema in `db/postgres-schema.mjs` is idempotent (`CREATE TABLE IF NOT EXISTS`): it runs during `npm run build` and again on each server instance's first query, so a deploy works even if it was built before the database was connected. No socket server, third-party API, object storage, or paid editor is required.

`lib/service.ts` talks to a tiny `prepare().bind().first()/all()/run()` interface rather than a specific driver. In production `db/index.ts` implements it with `pg` (converting `?` placeholders to `$1, $2…`); in tests the same interface wraps in-memory SQLite. The service SQL is written to run unchanged on both, so tests exercise the real production queries without needing a database server.

Basic body/file size limits, file extension and UTF-8 validation, bounded tree depth/node count, title limits, no-store API responses, same-origin write checks, and parameterized SQL cover common failure paths. This remains a demo: streaming upload limits, rate limiting, retention, observability and robust production authentication are follow-up work. Listing currently loads all visible documents; pagination/index tuning should accompany real usage.

## Tradeoffs

- Chose Tiptap over handwritten contenteditable commands for predictable structured editing.
- Chose a server database over localStorage so sharing works across clients and persisted records survive browser refresh.
- Chose Postgres (Neon) over SQLite for the Vercel deployment: Vercel's filesystem is not persistent, and Neon is a first-party Vercel Marketplace integration with a free tier.
- Chose the standard `pg` driver over Neon's HTTP driver so the same code can be tested against a local Postgres.
- Chose version checks over last-write-wins to make concurrency failures explicit.
- Chose mocked accounts over an OAuth integration to keep review friction low.
- Deferred comments, cursors, history, PDF export, DOCX conversion, offline sync, and account management.
- App-specific behavior lives in `app/`, `lib/`, `db/`, and `tests/`.

## Hosting history

The first version ran on Cloudflare Workers with a D1 (SQLite) database, packaged by Vinext. It was moved to Vercel and Neon Postgres to deploy through the candidate's own Vercel account. Only the database adapter, the API route's database lookup, the npm scripts and the schema file changed; the service logic, permission checks, validation and UI are unchanged. Some Cloudflare-specific starter files (`worker/`, `vite.config.ts`, `wrangler.local.json`, `lib/connector*`) remain in the repo but are not used by the Vercel build.

With another 2–4 hours, first improve crash recovery and browser regression tests, then refactor editor state into a hook. Production identity/tenant isolation is required before handling real data; it should not be rushed to claim enterprise readiness.

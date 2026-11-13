# Ajaia Docs

A focused collaborative document editor built with React, TypeScript, Tiptap, Vinext, and Cloudflare D1 (SQLite). No paid dependency, API key, or cloud account is needed to run locally.

## Quick start

**Requires Node.js 22.13+ (Node 24 recommended) and npm.** Works on Windows, macOS, and Linux. Extract this ZIP, open a terminal in `ajaia-docs`, and run:

```sh
npm ci
npm run db:migrate
npm run dev
```

Open the URL printed by the dev server (normally `http://localhost:5173`). The first database starts empty. Accounts are built into the app; no seed command is required.

**Do not use `npx next dev`: this app uses Vinext's Cloudflare runtime.** Local D1 is persisted under `.wrangler/state`. Keep that directory to retain documents across process restarts. It is intentionally excluded from the submission. `npm run db:migrate` is safe to run again; applied local migrations are tracked.

## Review in three minutes

1. Leave **Alex Morgan** selected in the sidebar. Click **New document**, rename the title, and type in the editor.
2. Select some text and apply **bold**, _italic_, underline, headings, and lists. Wait for **All changes saved**, return to the list, and reopen.
3. Click **Share**. Give **Jamie Chen** **Can edit** access and **Sam Rivera** **Can view** access.
4. Switch to Jamie using **Demo account**. The document appears as **Shared · editor**. Edit it and save.
5. Switch to Sam. Open the shared document: title, content, toolbar, and save are read-only. Sam cannot manage access.
6. Return as Alex, remove a grant, then switch to that account again. The document is no longer listed or accessible.
7. Click **Import .txt** and choose `samples/team-kickoff.txt`. Its contents become a new editable document.
8. Refresh the page and reopen the document. Content, title, formatting, and permissions persist.

| Demo account | Identifier                 | Password |
| ------------ | -------------------------- | -------- |
| Alex Morgan  | alex@ajaia.demo / `alex`   | None     |
| Jamie Chen   | jamie@ajaia.demo / `jamie` | None     |
| Sam Rivera   | sam@ajaia.demo / `sam`     | None     |

The account switcher is deliberately **mock authentication**. The backend validates `x-demo-user` against these accounts and enforces ownership and grants, but anyone can select any account. This is a public evaluation sandbox, **not a secure place for real/private documents**. All reviewers share the same three identities and dataset. No invitation emails are sent.

## What works

- Create, rename, autosave, reopen, and search documents.
- Structured rich text: bold, italic, underline, headings 1–3, bulleted/numbered lists, blockquotes, undo/redo.
- UTF-8 `.txt` import up to **1,000,000 bytes**; empty, binary, malformed UTF-8, unsupported and oversized files are rejected. Markdown/DOCX/PDF imports and attachments are intentionally out of scope.
- Owner/editor/viewer permissions, grant updates, revocation, owned/shared filters.
- SQLite persistence locally and managed D1 on the hosted app.
- Server validation, parameterized queries, inline errors, save status, and optimistic version checks.
- Conflict recovery: preserve the draft in the current tab, download its formatted JSON, then explicitly reload the saved version. Downloaded recovery JSON is a backup for manual recovery, not an import format.
- Plain-text export (formatting is intentionally not preserved in `.txt`).

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The tests execute the actual generated SQL migrations and repository queries against SQLite; they do not mock permission decisions. See `docs/TESTING.md` for coverage and manual cases. `npm run test:http` optionally tests a running server; it creates test documents. Set `BASE_URL` to your server origin if different from `http://localhost:5173`.

## Production build locally

```sh
npm run build
npm start
```

Open the URL printed by Wrangler (normally port 8787). `npm start` uses the same persisted local database. Run migrations first.

## Hosted deployment

See `LIVE_URL.txt` for the verified live URL and `docs/DEPLOYMENT.md` for the deployment design. The supplied hosted demo uses Cloudflare Workers and managed D1 through Sites. The public deployment does not require reviewers to subscribe or enter a key. An owner account is needed to create a separate hosted deployment.

## Project map

- `app/page.tsx`: workspace, editor, autosave orchestration, and sharing dialog.
- `app/api/[...path]/route.ts`: HTTP routing, import handling, identity selection, error mapping.
- `lib/domain.ts`: trusted account list and rich-text/title validation.
- `lib/service.ts`: document and permission operations with conditional SQL writes.
- `db/schema.ts`, `drizzle/`: schema and versioned migrations.
- `tests/service.test.ts`: SQLite integration tests.
- `scripts/migrate-local.mjs`, `scripts/smoke-test.mjs`: local database setup and optional HTTP checks.
- `docs/`: architecture, AI disclosure, test evidence, deployment and walkthrough notes.

## Deliberate limits / next 2–4 hours

There is no real-time cursor synchronization or automatic merge. Concurrent saves use first-successful-save semantics; a stale writer gets a conflict instead of overwriting data. A viewer may keep already-fetched text visible after revocation until reload; future server operations are denied. Network-failed drafts remain in memory, not an offline store. The browser warns before leaving with unsaved changes, but a tab/browser crash can lose them.

Next: add browser automation in CI, local crash-recovery drafts, split editor orchestration into a dedicated hook, and introduce real authentication and per-reviewer workspaces before any real use. Add rate limiting and retention controls before a broader public rollout. See `SUBMISSION.md` for the exact delivery status, including the walkthrough recording.

# Ajaia Docs — submission inventory

## Review links

- **Live product:** https://ajaia-docs-one-pi.vercel.app (Vercel + Neon Postgres)
- **Source repository:** https://github.com/rohith0224/Ajaia-docs
- **Materials folder:** https://drive.google.com/drive/folders/1LbQQDu7GmUUdkY30-IbAlXTu-f-60cex
- **Walkthrough:** not yet recorded. See WALKTHROUGH_URL.txt and docs/WALKTHROUGH_SCRIPT.md.

## Included

| Item                                                  | Location                         |
| ----------------------------------------------------- | -------------------------------- |
| Runnable frontend and backend source                  | app/, lib/, components/          |
| Package manifest and locked dependencies              | package.json, package-lock.json  |
| Postgres schema and database adapter                  | db/                              |
| SQLite migration used by the unit tests               | drizzle/                         |
| Database migration and smoke-test scripts             | scripts/                         |
| Clear local setup and run guide                       | README.md                        |
| Architecture, prioritization and tradeoffs            | docs/ARCHITECTURE.md             |
| Honest AI workflow disclosure                         | docs/AI_WORKFLOW.md              |
| Automated tests and optional HTTP smoke runner        | tests/, scripts/smoke-test.mjs   |
| Validation evidence and manual test plan              | docs/TESTING.md                  |
| Deployment notes and live URL                         | docs/DEPLOYMENT.md, LIVE_URL.txt |
| Demo accounts and reviewer flow                       | README.md                        |
| Sample UTF-8 file                                     | samples/team-kickoff.txt         |
| Browser screenshots and short screenshot-sequence GIF | docs/screenshots/, docs/demo.gif (taken before the rename, so they show "Alex Morgan") |
| Video preparation script                              | docs/WALKTHROUGH_SCRIPT.md       |
| Recording status                                      | WALKTHROUGH_URL.txt              |

The archive excludes dependency folders, credentials, environment files, runtime caches, build output, and Git history. Some files from the original Cloudflare starter remain (`worker/`, `vite.config.ts`, `wrangler.local.json`, `lib/connector*`, `scripts/vite/`). The Vercel build does not use them, and they are not additional product features. See docs/ARCHITECTURE.md, "Hosting history".

## Feature status

**Working:** document creation, rename, structured rich-text editing, autosave, reopen, .txt import, search, owned/shared distinctions, editor/viewer roles, owner-only grant changes, revocation, persistence, stale-save rejection, draft backup download and text export.

**Intentionally excluded:** real authentication, real-time co-editing/merging, comments, revision history, DOCX/Markdown/PDF import, offline synchronization and PDF export. Simulated accounts are permitted by the assignment; they do not protect real private data. Live reviewers share the same demo dataset.

**Incomplete deliverable:** a personal 3–5 minute recorded walkthrough and hosted video URL. The script and screenshots do not substitute for the required recording. Replace WALKTHROUGH_URL.txt and update this status before sending the final assessment submission.

**Next 2–4 hours:** automate browser regression tests, add crash-recovery drafts and improve editor state modularity. Verified sessions, tenant isolation, retention and rate limiting are prerequisites for real use.

## Run locally

Requires Node 22.13+ (24 recommended) and a Postgres database. A free Neon database or a local Postgres both work.

```sh
npm ci
export DATABASE_URL=postgres://user:pass@host:5432/dbname
npm run db:migrate
npm run dev
```

Open http://localhost:3000. No paid accounts are needed. `npm test` needs no database at all. Choose Rohith Sunkara, Jamie Chen, or Sam Rivera from the Demo account dropdown. No password is required.

## Candidate responsibility

Read docs/AI_WORKFLOW.md. This project was generated with substantial AI assistance (OpenAI Codex for the original build, Claude Code for the move to Vercel and Postgres); review and understand the implementation, run the tests yourself, and describe the assistance accurately in your walkthrough. Do not claim a personal recording or independent human review that has not happened.

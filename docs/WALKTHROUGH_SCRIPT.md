# 3–5 minute walkthrough guide

Record your own screen and narration. Use this outline, and explain decisions you actually understand. This is a preparation script, not a claim that a recording already exists.

## 0:00–0:30 — Scope and workspace

Show the app. “This is a small shared document workspace. I focused on creating, editing, importing, saving, and sharing documents. The three accounts are simulated for the assignment, so the reviewer does not need a password.” Point out the owned/shared filters and account switcher.

## 0:30–1:30 — Create, format, persist

As Rohith, create `Team launch plan`. Rename it, add a heading, a paragraph, bold/italic/underline, and a numbered list. Pause on “All changes saved.” Return to the workspace, refresh, and reopen. Explain that structured rich text is stored in SQLite/D1 and autosave is debounced. Export the text if time permits.

## 1:30–2:20 — Sharing

Give Jamie editor access and Sam viewer access. Switch to Jamie and add a sentence. Switch to Sam and show that editing controls are disabled. Explain that the server enforces these rules as well as the UI. Return as Rohith and remove Sam's grant. Switch to Sam to show the document disappears.

## 2:20–2:50 — File import

Import `samples/team-kickoff.txt`. Show the editable content and title. Explain the UTF-8 .txt / 1 MB limit, and that the original file is not retained. Unsupported uploads produce a visible error.

## 2:50–3:40 — Engineering decisions

Show `lib/service.ts`, the conditional version update, and `npm test` output. Explain that a stale save is rejected, keeping the draft available to download. This is shared access with safe conflict detection, not simultaneous real-time collaboration. Mention parameterized queries, schema validation, and the two-table data model.

## 3:40–4:20 — AI and next steps

Explain the AI assistance honestly using AI_WORKFLOW.md. Mention specific fixes triggered by tests/typechecking/browser inspection. Explain that comments, cursors, history, and DOCX import were cut. Next steps are crash-recovery drafts, browser regression tests, and real sessions/tenant isolation before actual private use.

Upload the recording to Loom/YouTube or Drive with reviewer access. Replace WALKTHROUGH_URL.txt with the actual accessible URL and update SUBMISSION.md before final submission.

# Verification record

Verified on 2026-11-13 using Node 24.22.1.

## Automated checks completed

- `npm test`: **8 tests passed**, zero failures. Actual generated SQLite migrations and production service queries are executed in an isolated in-memory SQLite database.
- `npm run typecheck`: **passed**.
- Production build through the supplied build helper: **passed**.
- `npm run db:migrate` with a fresh isolated local D1 path: **passed**. Running it again reported no migrations to apply.
- `BASE_URL=https://ajaia-docs-workspace.workspace-469636.chatgpt.site npm run test:http`: **passed against the live deployment**. It verifies HTTP creation, permission denial, shared editor save, stale-save conflict, owner-only grant management, revocation, file import, unsupported/empty file rejection, invalid JSON-object/title validation, unknown account rejection and cross-origin rejection.

An earlier HTTP attempt against the managed preview's loopback URL could not connect from the executor. The live HTTP test completed successfully and is the reported API evidence. The smoke runner creates test documents and does not delete them.

## Eight automated service cases

1. Create, rename, save, reopen; retain heading and bold/underline formatting.
2. Unshared users cannot list, read, or write a document.
3. Viewers can read but cannot edit, grant, or revoke access.
4. Editors can write; revocation prevents subsequent reads and writes.
5. A stale version cannot overwrite a successfully saved newer version.
6. Invalid grant targets/roles are rejected; updating an existing grant keeps one row.
7. Plain-text imports preserve line breaks and treat HTML-like text as inert text.
8. Empty titles, unknown identities, oversized content, invalid nodes and nesting are rejected.

## Browser checks completed

- Create and rename a document.
- Edit, format, save, and reopen rich text with headings, bold, italic, and lists.
- Refresh the page and reopen the persisted formatted document.
- Grant Jamie editor access, switch accounts, and save from Jamie.
- Return as Rohith and see Jamie's persisted changes.
- Grant Sam viewer access; verify read-only title/content and disabled formatting/save controls.
- Upload the included sample through the actual file chooser and open the imported document.
- Open the public deployed app and create a welcome document.
- Capture dashboard/editor/sharing/viewer/import screenshots from the preview. Local screenshots show sample data; the hosted database is separate.

The GIF is a short sequence of actual screenshots, not a live screen recording or substitute for the required personal walkthrough video.

## Additional manual scenarios for the reviewer

- Open the same document in two browser tabs. Save in one, then save the stale other tab. Expect a conflict with draft download and reload options.
- Disable the network while editing. Expect a failed-save state; retain the tab, reconnect and retry. A browser crash can lose in-memory drafts.
- Upload malformed UTF-8, binary content renamed .txt, or files over 1 MB.
- Try a narrow viewport and keyboard-only navigation. Responsive styles and accessible control labels are included, but exhaustive mobile/accessibility testing was not completed.
- Verify underline and numbered-list toolbar behavior, undo/redo, export, permission downgrade, and revocation from a separate session.

## Known testing limits

No committed automated browser suite, load tests, full accessibility audit, independent security review, or real-time transport exists. The tests verify demo-identity authorization; simulated identities are deliberately impersonable. Hosting quotas and long-term operations are not load-tested.

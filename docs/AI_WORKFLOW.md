# AI workflow disclosure

This implementation was produced with OpenAI Codex in ChatGPT Work, including AI-written application code and documentation. It should not be represented as solely human-authored work. The candidate should review, run, and understand it before submitting or discussing implementation decisions.

## Where AI accelerated the work

Codex created the React interface, service/API layer, structured-content validation, SQL schema, tests, and submission materials. Tool-assisted execution built the project, ran SQLite tests and type checks, exercised the UI in a browser, and packaged the deliverables. A supplied hosting starter provided the Worker/runtime build plumbing. No application feature calls an AI model; reviewers need no AI API key.

## Output changed or rejected during implementation

The first test adapter contained a syntax error and was corrected before tests passed. Type checking caught the HTTP JSON result's unknown type; response handling was made explicit. Browser inspection exposed that changing the editor's editable flag could emit an unnecessary update; that emission was disabled. The save queue was corrected so a failed in-flight save returns failure rather than recursively retrying through a stale state closure.

The implementation deliberately avoids a naive last-write-wins save, arbitrary persisted HTML, pretend real-time synchronization, and password fields that would imply real authentication. Instead it uses version-checked writes, a bounded rich-text JSON schema, and a clearly labeled demo account switcher.

## Verification and limits

Automated SQLite tests cover actual migration/query execution, formatting round trips, access denial, viewer/editor behavior, owner-only sharing, revocation, duplicate grants, stale updates, and invalid content. Type checking and the production build were run. Browser inspection exercises the main flow and provides screenshots. Exact completed checks are recorded in TESTING.md; a script being included does not imply it was run successfully.

No AI output was treated as proof of correctness. Generated code was revised in response to concrete compiler, test, and browser observations. There was no independent human review during this generation session. The candidate must verify their own deployment and record an honest walkthrough, including the mock-auth and non-real-time limitations.

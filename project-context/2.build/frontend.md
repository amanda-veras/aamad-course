# Frontend Build Log

## Implementation

- Added a single-route React/TypeScript frontend in `frontend/` with Inputs, Run, Results, and History sections. It is a sample queue-based review console, not a chat bot.
- Added two fictional cases, five separately inspectable outputs, and a typed frontend service connected to the backend analysis and review endpoints. Following the revised SAD, outputs are displayed in T1a classification → T1b sentiment/context → T2 knowledge → T3a response → T3b escalation order; T2 is explicitly labeled a coordinator-only stage, not a fifth CrewAI task.
- The backend runs a deterministic local mock, validates/persists envelopes, and stores the synthetic trace. The browser stores only run IDs for its History index and fetches each detail from the backend. No reviewer-decision write, send, transfer, or live customer data interface exists.
- The UI explicitly maps structured API fields, including failure/partial status, knowledge excerpts, claim references, conflicting/missing facts, and the separate human-assessment/referral decisions. `setup.md` is absent; local startup and the development proxy are documented in the frontend README and integration artifact.
- Revision controls are not implemented in the sample. The integration contract requires a new run ID, preserved original run/decisions and reused validated T1a/T1b/T2, rerunning only T3a/T3b with the reviewer note; no inherited approval, incomplete revision readiness, silent retry, or outbound effects. Future runtime mock fixtures must undergo the same schema, evidence-reference, status and persistence validation as ordinary task results.
- Frontend functionality and Spec Sync checklist are in [frontend-functional-spec.md](./frontend-functional-spec.md). Update the checklist and this log after **each commit**; add commit hash, doc delta, and test outcome.

## Sources

- [PRD](../1.define/prd.md), [SAD](../1.define/sad.md), [FR-07 SFS](../1.define/sfs/fr-07.md), and [frontend persona](../../.cursor/agents/frontend-eng.md).

## Assumptions

- `/` is the only route; the form and results are sections of one page. `ready_for_review` represents backend-validated local synthetic analysis, not a human decision.
- Browser localStorage contains only the run-ID index; the backend local trace is the source of run details. Neither is production audit storage.

## Open Questions

- Project manager: provide `setup.md` and confirm how the frontend is hosted beyond the development proxy.
- QA/stakeholders: approve the synthetic golden set, labels/rubric, reviewer identity vocabulary, retention, and evaluation thresholds; none are inferred here. The frontend does not yet expose the backend decision or revision endpoints.

## Audit

- No commit created. After each commit, update the Spec Sync checklist in [frontend-functional-spec.md](./frontend-functional-spec.md) and record its hash and validation here.

## Validation

- `npm test`: 3 tests passed (FSM, invalid ticket, five-output/history stub).
- `npm run build`: TypeScript check and Vite production build passed.
- Browser smoke check: selected a synthetic case, ran the local stub, inspected five separately labeled outputs and a limited no-match case; ticket changes clear stale Results.
- `aamad validate`: frontend artifact headings pass; whole-project gate remains blocked by absent `qa.md` (plus warnings for `setup.md`, `backend.md`, `integration.md`, `evals.md`), outside frontend scope.

## Revised SAD synchronization (2026-10-26)

- Updated the spec, README, fixture order, stage labels, and existing test expectation to distinguish five output/stage contracts from four CrewAI tasks plus coordinator-only T2. No application/backend integration or revision controls were added; the Spec Sync checklist still applies after each future commit.
- Validation for this change: `git diff --check` and TypeScript `tsc -b` passed. `npm test`/`npm run build` could not run because `npm`/`node` are absent from the shell PATH; a Vitest attempt with the VS Code-bundled Node runtime failed to load the installed unsigned Rollup native binary (`ERR_DLOPEN_FAILED`). No test-pass or Vite-build result is claimed for this change. `aamad validate` remains blocked by missing Build artifacts (`qa.md` required; `setup.md`, `backend.md`, `integration.md`, `evals.md` warned).

## PRD/SAD frontend review (2026-10-26)

- Reviewed the synthetic-only preview against PRD FR-01..10 and SAD sections 2–4 and 6. Five fixture cards follow the five-stage order, including coordinator-only T2; ticket records/gaps and no-match limitations are visible. No executable outbound action or backend connection exists in the frontend.
- This is not yet the full PRD/SAD review console: there are no approval/edit/reject/revision or separate investigation/referral decision controls (FR-08); evidence IDs are plain text, not inspectable source passages/record links (FR-03,07); and browser history recreates fixtures from current code rather than retaining frozen inputs, validated outputs, failed steps, or decisions (FR-09,10). The sample's internal `ready_for_review` state must not be mistaken for coordinator-validated readiness; the UI labels it “Demo complete.”
- At the time of this review, `ReviewOutput` declared transport fields the renderer did not inspect. The integration below adds an explicit API-to-view mapping for conflicting facts, claim references, separate escalation decisions, and partial/skipped outputs; completion is based on backend status, not card count.
- `setup.md` is still absent. Review-only: no UI behavior or integration changed. Validation: `npm test` passed (3 tests) and `npm run build` passed using a portable Node runtime. A shared browser page loaded, but a browser click timed out, so no interactive smoke pass is claimed for this review.

## Local API integration (2026-10-26)

- Replaced the local fixture service with a typed HTTP client for `POST /analyze/{ticket_id}` and `GET /reviews/{run_id}`; Vite proxies `/api/*` to the loopback backend during development.
- Updated the renderer to expose the mapped envelope details and incomplete stages. History stores only run IDs in browser localStorage and retrieves trace details from the backend.
- Integration details, round-trip verification, and remaining hosting/UI limitations are recorded in [integration.md](./integration.md). No decision/revision controls or outbound-action paths were added.

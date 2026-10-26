# Frontend Build Log

## Implementation

- Added a single-route React/TypeScript frontend in `frontend/` with Inputs, Run, Results, and History sections. It is a sample queue-based review console, not a chat bot.
- Added two fictional cases, five separately inspectable sample outputs, a typed local `startRun`/`getRunStatus` service, and an `idle → running → done` UI state machine with a failure branch. Following the revised SAD, fixture cards are displayed in T1a classification → T1b sentiment/context → T2 knowledge → T3a response → T3b escalation order; T2 is explicitly labeled a coordinator-only stage, not a fifth CrewAI task.
- History is localStorage-only; samples are not actual CrewAI analysis. No backend connection, reviewer-decision write, send, transfer, or live customer data interface exists.
- The SAD requires a frozen corpus and evidence validation before genuine review readiness. The `mock/fixture-envelope-v1` identifier names a future locally injected runtime test double, not this UI fixture or a model provider. This frontend does not run CrewAI tasks or a coordinator lookup and does not validate/persist envelopes. `setup.md` is absent; integration must replace the service stub and coordinate transport, trace persistence, error/partial results, and decision-only review controls.
- Revision controls are not implemented in the sample. The integration contract requires a new run ID, preserved original run/decisions and reused validated T1a/T1b/T2, rerunning only T3a/T3b with the reviewer note; no inherited approval, incomplete revision readiness, silent retry, or outbound effects. Future runtime mock fixtures must undergo the same schema, evidence-reference, status and persistence validation as ordinary task results.
- Frontend functionality and Spec Sync checklist are in [frontend-functional-spec.md](./frontend-functional-spec.md). Update the checklist and this log after **each commit**; add commit hash, doc delta, and test outcome.

## Sources

- [PRD](../1.define/prd.md), [SAD](../1.define/sad.md), [FR-07 SFS](../1.define/sfs/fr-07.md), and [frontend persona](../../.cursor/agents/frontend-eng.md).

## Assumptions

- `/` is the only route; the form and results are sections of one page. The sample run is not a genuine `ready_for_review` analysis.
- Browser localStorage is acceptable for a synthetic preview but not as the product's durable audit trace.

## Open Questions

- Project manager: provide `setup.md` and confirm how the frontend is hosted during Build.
- Integration/QA: define the approved transport, reviewer identifier/decision vocabulary, error handling, revision lineage and trace persistence before replacing the stub. Build must define a local CrewAI/runtime adapter for injecting its logical mock without hosted calls or telemetry; the timeout value and evaluation thresholds remain unapproved.

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

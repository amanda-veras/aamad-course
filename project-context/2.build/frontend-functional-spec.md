# Frontend Functional Specification: Multi-Agent Customer Support Crew

## Purpose and scope

A single-route (`/`) React/TypeScript review console previews the synthetic ticket workflow in the PRD FR-01..10, revised SAD sections 2–6 and 9, and SFS FR-07. This first frontend slice is **a local sample**, not a CrewAI integration or validated analysis. The SAD defines five ordered workflow stages (T1a, T1b, coordinator-only T2, T3a, T3b) and five independently inspectable outputs, not five CrewAI tasks: only T1a/T1b/T3a/T3b are LLM-backed CrewAI tasks. All sample text and records are fictional. No outbound send, ticket transfer, production data, model, backend, or review-decision write is available. `setup.md` is not yet present; the frontend is self-contained pending the project manager's setup artifact.

## Inputs

- Select an existing synthetic ticket ID from the local fixture queue (SYN-101 or SYN-102). The ticket text, supplied record IDs, and known gaps are visible before starting a run.
- Ticket text and fixture records are display-only; neither can authorize tools or commands. Unknown ticket IDs are rejected by the stub service. No free-form live customer data entry.
- The selected ticket is read-only while a run is in progress. Switching tickets clears the currently displayed Results so a previous run cannot appear attached to the new Inputs. Each run stores its ticket ID and start time; its synthetic snapshot is resolved from the local fixtures (not a production audit trace).

## Run

- The form's **Start sample run** button invokes `startRun(ticketId)` once. The UI state machine allows `idle → running → done`, with `running → failed` for service errors; reset permits a subsequent run. Multiple starts are disabled while running.
- `getRunStatus(runId)` is polled while running. In the current local stub, it advances from `analyzing` to `ready_for_review` after a short simulated delay; this internal stub value is **not** genuine review readiness. The UI calls that state **Demo complete**, not an approved or executable decision. Both service methods return typed `Run` values and are replaceable at integration time. The stub simply displays fixture outputs; it does not execute CrewAI tasks, a T2 lookup, validation, or persistence of output envelopes.
- Show the run ID, ticket ID, start time, progress, and visible errors. A failed or incomplete real run (including a revision) must never be presented as complete or `ready_for_review`. Integration must preserve prior validated envelopes on a T1a/T1b/T2/T3a/T3b failure or timeout, show `failed_step`/`error`, mark dependents `skipped`, and avoid a silent retry. The frontend must trust only the validated status/refs from the coordinator, not infer success from the presence of five cards.

## Results

- Results remain on the **same `/` route** below Inputs and Run, rather than a second URL. Five separately labeled cards follow the SAD stage order: T1a classification, T1b sentiment/context, T2 approved knowledge (**deterministic coordinator stage, not an Evidence Analyst/CrewAI task**), T3a response draft/limitation, and T3b human-assessment vs specialist-referral advice. These labels identify intended contracts, not execution by the demo.
- Each card shows its independent `complete`/`limited`/`failed`/`skipped` status, rationale, sample evidence identifiers, and missing facts. No-match is `limited`, not a lookup failure (`failed`); conflicting records are not resolved by assumption.
- The fictional sample passage `TRACK-01/passage-1/v1` exists only in the UI fixture; its identifier is not a citation validated against a real backend corpus. Sample drafts and recommendations are **not sent or approved**. Before a real `ready_for_review` view, integration must supply the four CrewAI-task Pydantic outputs and coordinator-constructed/validated `KnowledgeOutput`, resolvable evidence and a frozen input/corpus snapshot. The logical `mock/fixture-envelope-v1` identifier belongs to a future locally injected runtime test double—not this UI stub, a provider name, or a production model. Even deterministic fixtures must traverse the same schema, evidence-reference, status, and persistence checks as ordinary task results; no hosted calls or telemetry are authorized.
- Approval/edit/reject/revision controls and recorded investigation/referral decisions (PRD FR-08) are **not implemented in this slice**; a complete review workflow must add decision-only controls through an approved local trace interface, without outbound effects. Requesting revision must create a new `run_id`, preserve the original run and decisions, reference already validated T1a/T1b/T2 outputs, and re-execute only T3a/T3b with the reviewer note. The new run inherits no approval; its failed/incomplete revision must not become `ready_for_review`. `record_decision` remains append-only, not a send/transfer action. Do not mistake stub history for PRD FR-09 trace completeness.

## History

- List local synthetic runs in reverse start order; selecting a run reopens its Inputs context and Results without navigating away. Entries survive reload in browser localStorage on that device only. No reviewer decisions or production audit record are stored.
- Unknown or malformed stored entries are ignored. Local storage can be cleared by the browser and is **not** a durable trace store. The future backend `get_review(run_id)` must own complete, immutable inputs, corpus version, five outputs, failures, and recorded human decisions; for a revision it must link the original run and reused validated T1a/T1b/T2 envelopes while storing new T3a/T3b results and independent decisions (SAD section 4; SFS section 5).

## Implementation and acceptance mapping

| Frontend check | PRD / SFS | Current scope |
| :-- | :-- | :-- |
| Synthetic ticket and records/gaps visible | FR-01 / AC-01 | Fixture preview |
| Five output regions in T1a/T1b/T2/T3a/T3b order with evidence and uncertainty | FR-02..07 / AC-02..07 | Clearly labeled fixture outputs; T2 is coordinator-only in the intended architecture |
| No automatic send/transfer; revision starts a new, unapproved run | FR-08 / AC-08 | No action, decision, or revision controls; integration must preserve original review and rerun only T3a/T3b |
| Recoverable run list and visible incomplete/error state | FR-09,10 / AC-09,10 | Local stub only; integration must show failed revisions, retained outputs and `skipped` dependents |

Accessibility: semantic headings, associated select label, keyboard-operable buttons/navigation, live run status and alert error text. Layout adapts to narrow screens; no UI streaming requirement (SAD section 1).

## Spec Sync checklist — update after **each commit**

- [ ] Compare committed UI states, field names, five output cards in T1a/T1b/T2/T3a/T3b order, and service signatures with this spec and the PRD/SAD/SFS; update mismatches in the same follow-up commit.
- [ ] Recheck the synthetic-only/no-action boundary and explicitly document any new integration or reviewer control; never represent fixture outputs as validated CrewAI/coordinator results.
- [ ] Check that History limitations, original/revision run lineage, non-inherited approval, failure/partial-output behavior, and acceptance mapping still describe the code.
- [ ] Record the commit hash, spec changes (or “no spec changes”), and validation outcome in `project-context/2.build/frontend.md` after each commit.
- [ ] Run frontend tests/build and `aamad validate` where available; note any unavailable tools or failing gates.

The checklist is intentionally pending: no commit is made as part of this frontend handoff.

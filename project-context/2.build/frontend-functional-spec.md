# Frontend Functional Specification: Multi-Agent Customer Support Crew

## Purpose and scope

A single-route (`/`) React/TypeScript review console presents the synthetic ticket workflow in the PRD FR-01..10, revised SAD sections 2–6 and 9, and SFS FR-07. The frontend calls the local backend's synchronous analysis and review endpoints; the backend runs a deterministic local mock, not a hosted model. The SAD defines five ordered workflow stages (T1a, T1b, coordinator-only T2, T3a, T3b) and five independently inspectable outputs, not five CrewAI tasks: only T1a/T1b/T3a/T3b are configured CrewAI tasks. All ticket text and records are fictional. No outbound send, ticket transfer, production data, or reviewer-decision write is available. `setup.md` is not present.

## Inputs

- Select an existing synthetic ticket ID from the local fixture queue (SYN-101 or SYN-102). The ticket text, supplied record IDs, and known gaps are visible before starting a run.
- Ticket text and fixture records are display-only; neither can authorize tools or commands. The backend rejects unknown ticket IDs with a visible API error. No free-form live customer data entry.
- The selected ticket is read-only while a run is in progress. Switching tickets clears the currently displayed Results so a previous run cannot appear attached to the new Inputs. The backend stores each run's ticket snapshot, start time, and corpus version in its local trace (not a production audit trace).

## Run

- The form's **Start sample run** button invokes `POST /api/analyze/{ticket_id}` once. The backend runs synchronously and returns `ready_for_review` only after its local coordinator validates and persists the five outputs; `incomplete` is shown as failed, never as complete. Multiple starts are disabled while running.
- `GET /api/reviews/{run_id}` loads a run from the backend trace. Browser History stores only run IDs in localStorage and fetches each run from the backend on load; it does not recreate outputs from fixtures. Backend/network/contract and malformed local history errors are surfaced in the UI.
- Show the run ID, ticket ID, start time, in-flight state, and visible errors. A failed or incomplete run must never be presented as complete or `ready_for_review`. The backend preserves prior validated envelopes on a T1a/T1b/T2/T3a/T3b failure, marks dependents `skipped`, and returns `failed_step`/`error`; the frontend displays those values and trusts coordinator status rather than inferring success from card count. Analysis is synchronous; no timeout contract is set.

## Results

- Results remain on the **same `/` route** below Inputs and Run, rather than a second URL. Five separately labeled cards follow the SAD stage order: T1a classification, T1b sentiment/context, T2 approved knowledge (**deterministic coordinator stage, not an Evidence Analyst/CrewAI task**), T3a response draft/limitation, and T3b human-assessment vs specialist-referral advice.
- Each card shows its independent `complete`/`limited`/`failed`/`skipped` status, rationale, validated evidence references, and missing facts. No-match is `limited`, not a lookup failure (`failed`); conflicting records are not resolved by assumption.
- The API returns Pydantic-validated outputs, coordinator-validated evidence references, a frozen synthetic ticket snapshot and corpus version. The UI maps the response contract explicitly, including output statuses, conflicting/missing facts, claim references, typed knowledge excerpts, and the two independent escalation decisions. Sample drafts and recommendations are **not sent or approved**. The `mock/fixture-envelope-v1` identifier is a deterministic local test double, not a provider name or production model; no hosted calls or telemetry are authorized.
- Approval/edit/reject/revision controls and recorded investigation/referral decisions (PRD FR-08) are **not implemented in this slice**; a complete review workflow must add decision-only controls through an approved local trace interface, without outbound effects. Requesting revision must create a new `run_id`, preserve the original run and decisions, reference already validated T1a/T1b/T2 outputs, and re-execute only T3a/T3b with the reviewer note. The new run inherits no approval; its failed/incomplete revision must not become `ready_for_review`. `record_decision` remains append-only, not a send/transfer action. Backend file storage is local educational trace storage, not production audit infrastructure.

## History

- List backend-backed synthetic runs in reverse start order; selecting a run reopens its Inputs context and Results without navigating away. Browser localStorage contains only the run-ID index. Clearing browser data removes that index but not the backend's local trace. No reviewer decisions are stored by the UI.
- Saved run IDs are validated; malformed history is surfaced instead of silently ignored. The backend `get_review(run_id)` owns the input snapshot, corpus version, five outputs, failure state, lineage and decisions. Revision and decision endpoints exist in the backend but there are no corresponding UI controls.

## Implementation and acceptance mapping

| Frontend check | PRD / SFS | Current scope |
| :-- | :-- | :-- |
| Synthetic ticket and records/gaps visible | FR-01 / AC-01 | Fixture preview for inputs; backend snapshot for runs |
| Five output regions in T1a/T1b/T2/T3a/T3b order with evidence and uncertainty | FR-02..07 / AC-02..07 | Backend-validated outputs; T2 is coordinator-only |
| No automatic send/transfer; revision starts a new, unapproved run | FR-08 / AC-08 | No action, decision, or revision controls; integration must preserve original review and rerun only T3a/T3b |
| Recoverable run list and visible incomplete/error state | FR-09,10 / AC-09,10 | Backend-backed run history and retained partial outputs; no revision UI |

Accessibility: semantic headings, associated select label, keyboard-operable buttons/navigation, live run status and alert error text. Layout adapts to narrow screens; no UI streaming requirement (SAD section 1).

## Spec Sync checklist — update after **each commit**

- [ ] Compare committed UI states, field names, five output cards in T1a/T1b/T2/T3a/T3b order, and service signatures with this spec and the PRD/SAD/SFS; update mismatches in the same follow-up commit.
- [ ] Recheck the synthetic-only/no-action boundary and explicitly document any new integration or reviewer control; only display outputs returned by the validating backend.
- [ ] Check that History limitations, original/revision run lineage, non-inherited approval, failure/partial-output behavior, and acceptance mapping still describe the code.
- [ ] Record the commit hash, spec changes (or “no spec changes”), and validation outcome in `project-context/2.build/frontend.md` after each commit.
- [ ] Run frontend tests/build and `aamad validate` where available; note any unavailable tools or failing gates.

The checklist is intentionally pending: no commit is made as part of this frontend handoff.

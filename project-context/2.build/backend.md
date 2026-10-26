# Backend Build Artifact

## Summary

- Added a loopback-ready FastAPI backend for the synthetic support queue. The coordinator snapshots the selected ticket and fictional corpus version, runs five ordered stages, validates each Pydantic envelope and evidence reference, and persists every stage before continuing.
- The sequence is T1a classification → T1b sentiment/context → coordinator-only T2 knowledge lookup → T3a response → T3b escalation. CrewAI role/task configuration is externalized in [agents.yaml](../../backend/config/agents.yaml) and [tasks.yaml](../../backend/config/tasks.yaml); the two roles are Evidence Analyst and Resolution Adviser. Four CrewAI task definitions are configured. Delegation and memory are disabled.
- Execution uses the deterministic `mock/fixture-envelope-v1` test double in [crew.py](../../backend/crew.py). It makes no model, network, telemetry, or external-action calls. T2 is a local coordinator-owned allowlist lookup and constructs its own output; task/model output cannot select knowledge identifiers.
- The file-backed trace stores input snapshots, corpus version, stage envelopes, failure state, revision lineage, and decisions. Incomplete runs preserve prior results, persist a failed stage and skipped dependents, and cannot be marked `ready_for_review`.
- The API provides a new-run revision path that reuses validated T1a/T1b/T2, reruns only T3a/T3b, and carries no decisions into the revision. Approval/decision requests only append a local decision record; no send, transfer, or production mutation capability is implemented.

## Endpoints

All endpoints operate only on the fixed synthetic queue and local trace. The default trace file is `backend/.data/traces.json` (ignored by Git).

| Method | Path | Request | Behavior |
| :-- | :-- | :-- | :-- |
| `GET` | `/healthz` | — | Local process readiness and the resolved runtime/mock identifier. |
| `POST` | `/analyze/{ticket_id}` | — | Snapshot and synchronously run the five stages; return the run and outputs. Unknown ticket IDs return `404`. |
| `GET` | `/reviews/{run_id}` | — | Return the retained ticket/snapshot, outputs, errors, corpus version, revision lineage, and decisions. Unknown IDs return `404`. |
| `POST` | `/reviews/{run_id}/decisions` | `{"draft_decision":"approved|edited|rejected","referral_decision":"accepted|rejected|deferred","reviewer_id":"..."}` | Append a local decision for a `ready_for_review` run only. It does not execute the decision. |
| `POST` | `/reviews/{run_id}/revisions` | `{"reviewer_note":"..."}` | Create a linked run ID, reuse validated T1a/T1b/T2, rerun T3a/T3b, and start with no inherited decisions. |

Start locally with:

```sh
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

For tests, install `backend/requirements-dev.txt` and run `python -m pytest -q backend/tests`. The standalone smoke command is `python -m backend.smoke`.

## Frontend Contract and Mismatch

- The API returns the frontend's `Run` fields (`id`, `ticket`, `startedAt`, `status`, `outputs`, `failedStep`, and `error`) and its output fields (`type`, `detail`, `rationale`, `evidenceRefs`, and `missingFacts`). It also includes the SAD envelope (`ticket_id`, `run_id`, `output_type`, `evidence_refs`, `missing_facts`, `conflicting_facts`, `error`) and typed output payload.
- The frontend domain now includes the envelope/payload fields and `incomplete` run status; the UI treats an incomplete run as failed rather than successful.
- **Still disconnected:** `frontend/src/services/runs.ts` remains a localStorage fixture stub and does not call these endpoints. The frontend currently has no decision or revision controls. The API is ready for the separate integration task, but the browser UI does not yet exercise it.
- The conceptual frontend status union originally lacked SAD's `incomplete` state, and the original envelope type omitted run/ticket IDs, conflict/error fields, and typed payloads. Those type gaps are updated; transport integration and UI review controls remain open.

## Assumptions

- The only queue inputs are the two fictional tickets `SYN-101` and `SYN-102`; the only approved passage is the local `TRACK-01/passage-1/v1` fixture.
- The local JSON trace is suitable for this single-process educational MVP, not production retention or multi-process concurrency.
- Reviewer IDs are supplied by the caller; authentication and reviewer identity management are not implemented.
- The local mock is the only model interface used in this build. No evaluation threshold, timeout target, or performance claim is introduced.

## Open Questions

- Integration/QA: connect the browser service to the HTTP API and add the agreed reviewer decision/revision controls without adding action paths.
- Stakeholders/QA: approve the synthetic golden set, labels, rubric, reviewer identity vocabulary, retention, and any evaluation thresholds; none are inferred here.
- Runtime owner: confirm the supported CrewAI version/Python range and how the logical mock will be injected through actual CrewAI execution. This implementation validates the CrewAI YAML conventions and executes deterministic adapter tasks locally; it does not import or invoke the CrewAI package or a model provider. Temperature/token limits, CrewAI iteration/retry/RPM controls, and execution timeout are not applicable to the deterministic mock and remain unselected for any future model-backed execution.

## Sources

- [PRD](../1.define/prd.md): synthetic-only boundary, review gates, acceptance criteria, and TC-01/05/08/09/10.
- [SAD](../1.define/sad.md): five-stage sequencing, four configured CrewAI tasks, coordinator-owned T2, output envelopes, failure policy, and revision behavior.
- [Frontend Build Artifact](./frontend.md) and [frontend domain types](../../frontend/src/domain.ts): existing Run/output contract and remaining integration boundary.
- [CrewAI adapter rules](../../.cursor/rules/adapter-crewai.mdc): external YAML configuration, sequential execution, delegation/memory defaults, and local runtime expectations.

## Validation

- `.venv/bin/python -m pytest -q backend/tests`: **10 passed**. Coverage maps to TC-01, TC-05, TC-08, TC-09, TC-10 and API wire-shape checks. Tests include no-match and unapproved-source cases, decision-only behavior, revision reuse/new lineage, malicious synthetic text, schema/evidence failures, agent/task failure, and coordinator lookup failure.
- `.venv/bin/python -m backend.smoke`: **passed** routine review, knowledge-gap review, decision recording, and injected T3a failure.
- Live local HTTP smoke: `GET /healthz` returned runtime `crewai` and mock `mock/fixture-envelope-v1`; `POST /analyze/SYN-101` returned `ready_for_review` with five outputs.
- `.venv/bin/python -m compileall -q backend`: **passed**.
- `git diff --check`: **passed**.
- `.venv/bin/aamad validate`: the backend artifact's heading and runtime Audit checks pass; the project gate remains blocked by missing `setup.md`, `integration.md`, and required `qa.md` (plus the recommended missing `evals.md`).
- Pytest emitted one Starlette deprecation warning about the `httpx` test-client integration; all tests passed. Frontend tests/build were not run because Node.js is not available in the shell.
- No EC-001..003 numerical threshold or quality claim was introduced.

## Audit

- Timestamp: 2026-10-26
- Persona id: `backend-eng`
- Action: `develop-be --synthetic-mvp`
- Artifact path: `project-context/2.build/backend.md`
- Resolved runtime: `AAMAD_TARGET_RUNTIME=crewai`
- CrewAI logical model: `mock/fixture-envelope-v1` (local deterministic test double; no provider calls)
- Temperature / max tokens: not applicable to deterministic mock execution
- Task mode: sequential coordinator flow; delegation disabled; memory disabled

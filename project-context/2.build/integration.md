# Integration Build Artifact

## Summary

- Reviewed the product boundary and five-output/review requirements in the [PRD](../1.define/prd.md), the coordinator and transport assumptions in the [SAD](../1.define/sad.md), and the [frontend](./frontend.md) and [backend](./backend.md) build artifacts.
- Replaced the frontend fixture-only run service with a local HTTP client for the backend. The browser now submits synthetic ticket IDs, renders the returned validated outputs, and reloads run details from the backend trace.
- The flow stays local and synthetic. The backend uses `mock/fixture-envelope-v1`; there are no hosted model calls, live systems, telemetry, sends, transfers, or production mutations.

## API Contract and Wiring

| Frontend operation | HTTP request | Contract |
| :-- | :-- | :-- |
| Start run | `POST /api/analyze/{ticket_id}` | No request body. Synchronous response with the full `ApiRun` contract, including ticket snapshot, run status, and five ordered outputs. |
| Read a run / poll an active run | `GET /api/reviews/{run_id}` | Returns the persisted `ApiRun` trace, including retained partial/failed/skipped outputs. |
| Load browser history | `GET /api/reviews/{run_id}` per saved run ID | The browser stores only run IDs in localStorage; trace details come from the backend. |

During development, Vite proxies `/api/*` to `http://127x.0.0.1:8000/*` and strips the `/api` prefix. This keeps the browser same-origin and avoids enabling permissive backend CORS. The TypeScript client validates response fields and run/output identity, then maps the backend's snake_case envelope fields and camelCase display aliases into `Run` and `ReviewOutput`. It displays evidence refs, knowledge excerpts, claim refs, missing/conflicting facts, typed payloads, and both escalation decisions. Non-2xx FastAPI responses (`{"detail": ...}`), invalid JSON, malformed contracts, storage errors, and network failures are surfaced to the UI.

## Startup

From the repository root, start the backend:

```sh
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

The browser should use the URL printed by Vite. `setup.md` is not present; these commands reflect the current backend/frontend manifests and local Vite configuration.

## Validation

- Added service tests for the POST/GET round-trip, five-output contract mapping, local run-ID history retrieval, error responses, and malformed run status handling; execution is blocked by the missing Node/npm runtime noted below.
- Backend tests passed: `10 passed` for the synchronous analysis endpoint, review retrieval, output envelope, and local trace persistence.
- Live local HTTP smoke: `GET /healthz`, `POST /analyze/SYN-101`, then `GET /reviews/{run_id}` succeeded; the restored run was `ready_for_review` with all five ordered outputs.
- Live no-match check: `POST /analyze/SYN-102` returned five outputs with `knowledge` and `response` both `limited`, and the knowledge envelope explicitly set `no_match`.
- Frontend unit tests/build and an interactive browser round-trip were not run: `npm`/`node` are unavailable in the shell, and VS Code test discovery found no matching test items. Editor diagnostics reported no errors for the changed TypeScript files.

## Known Issues and Boundaries

- Analysis is synchronous; there is no streaming or progress-event transport. The UI displays the returned result after the local coordinator completes.
- The Vite proxy is development-only. Any non-development hosting must provide a same-origin `/api` reverse proxy to a loopback/local backend; no deployment target or production hosting integration is defined.
- History is indexed per browser via localStorage. Clearing browser data removes the index, not the backend JSON trace; traces not indexed by that browser cannot be discovered because there is no list-runs endpoint.
- Reviewer decision and revision endpoints exist on the backend but this console has no decision/revision controls. This integration does not add either behavior.
- Backend reviewer identity is unauthenticated, and file-backed trace storage is a single-process educational MVP, not production identity, concurrency, retention, or audit infrastructure.
- `setup.md` is absent. The synthetic corpus, mock runtime, evaluator thresholds, and supported CrewAI/runtime behavior remain subject to the backend artifact's open questions.

## Sources

- [PRD](../1.define/prd.md): synthetic-only boundary, review gate, five outputs, failure visibility, and no-action constraints.
- [SAD](../1.define/sad.md): sequential stages, validated output envelopes, local trace, and non-streaming behavior.
- [Frontend build artifact](./frontend.md), [frontend functional spec](./frontend-functional-spec.md), and [backend build artifact](./backend.md).
- [Integration Engineer guidance](../../.cursor/agents/integration-eng.md).

## Assumptions

- The local backend and frontend are run on the same development machine; the browser reaches the backend only through the Vite loopback proxy.
- An API response with `ready_for_review` means the backend's local schema/evidence checks completed, not that a human approved any draft or referral.
- Retaining backend trace details is the backend's responsibility; browser storage is only a list of run IDs.

## Open Questions

- Project manager: add `setup.md` and confirm how local API proxying should work for any non-development frontend host.
- QA/stakeholders: approve identity, retention, reviewer vocabulary, dataset/rubric, and evaluation thresholds before extending the interface or making quality claims.

## Audit

- Timestamp: 2026-10-26
- Persona id: `integration-eng`
- Action: `integrate-api`, `verify-messageflow`, `log-integration`
- Resolved AAMAD_TARGET_RUNTIME: crewai
- Model/test double: deterministic local `mock/fixture-envelope-v1`
- Transport: synchronous HTTP/JSON over loopback via Vite development proxy

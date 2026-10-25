# System Architecture Document: Multi-Agent Customer Support Crew (MVP)

## 1. MVP Architecture Philosophy & Principles

The product is a general-purpose support review crew; fictional e-commerce Tier 2 tickets are the primary demonstration, with a small synthetic non-e-commerce probe. Five independently reviewable outputs are product contracts, not an agent-count mandate. CrewAI is the selected execution runtime. This SAD proposes two bounded agent roles and a non-agent coordinator to reduce handoffs while keeping outputs separate. The count is an MVP architecture choice, not a new product requirement (PRD FR-02..07).

The MVP uses a local simulated ticket queue, synthetic records, approved fictional knowledge, a review console, and a local trace store. All generated drafts and recommendations stop at a human review boundary; approval records a decision only. No network integration to a helpdesk, CRM, payment service, outbound messaging service, or production data store is allowed. For an entirely local/mock educational run, the model interface must use a local or test-double implementation; a hosted model endpoint would need separate stakeholder approval because it crosses the stated local-only boundary. No streaming is required: publish a result only after per-output validation, with visible progress/failure status.

Future Work, outside this architecture: live integrations, customer-facing execution, production security/compliance, multilingual support, advanced analytics, and scaling. The PRD does not require a chat UI, fixed latency, accuracy target, minimum case count, or P1 feature. A queue-based review console is the primary interaction (MRD section 3; PRD sections 2, 4, 6).

## 2. Multi-Agent System Specification

### Roles, Tasks, and Handoffs

| Role / task | Allowed inputs and tools | Output / next dependency | Rationale |
| :-- | :-- | :-- | :-- |
| Coordinator (deterministic application code, not an agent) | Synthetic ticket/record loader, approved knowledge index, schema validator, local trace writer; no action tools | Validates input and freezes available context; invokes T1, T2, T3 in order; validates and stores each output before passing it on | Keeps evidence authority, failure handling, and review gate outside generated text. |
| Evidence analyst, T1 triage | Provided ticket and records; no outbound or mutation tools | Classification and sentiment/context as separate typed outputs, plus identified missing/conflicting facts; T2 can reuse validated context | These two assessments depend on the same ticket, but remain independently reviewable (FR-02,04,07). |
| Evidence analyst, T2 knowledge | Approved local knowledge lookup restricted by the coordinator to the fictional approved corpus | Knowledge result with source/passage references or no-match/error; T3 receives only validated references and available context | Reusing the analyst avoids an unnecessary agent while separating knowledge provenance from T1 judgments (FR-03). |
| Resolution adviser, T3 draft and recommendation | Validated T1/T2 outputs, synthetic records, approved passages; no external action tools | Separate response draft/limitation and assessment/referral recommendation with evidence/reason fields | Draft and recommendation share evidence, but two contracts prevent a referral or response from being mistaken for an executed action (FR-05,06). |

Proposed CrewAI configuration: bounded role/task definitions with a sequential task dependency T1 -> T2 -> T3; T1 and T2 use the same specialist role, T3 another. Disable autonomous delegation and memory beyond the single synthetic case; pass explicit validated task context, not unchecked raw prior prose. The coordinator, not a CrewAI task, enforces schema validation, evidence allowlists, status transitions, and the review gate. Agent/task definitions may be stored in YAML or code per the runtime adapter chosen in Build; no specific `max_iter`, token limit, timeout, provider, or retry count is committed. Stop a failed run, preserve completed outputs, and do not re-run silently; retry policy requires a SAD/QA decision.

### Output Contracts (All Independently Inspectable)

The proposed transport envelope for each output is `{ticket_id, run_id, output_type, status, rationale, evidence_refs, missing_facts, conflicting_facts, error}`. `status` is `complete`, `limited`, `failed`, or `skipped`; `error` identifies failed step and reason when applicable. A `complete` output has its required fields; `limited` means an explicit knowledge/evidence limitation, never a fabricated answer. `failed`/`skipped` are not successful outputs. Each `evidence_ref` is a typed pointer to either an approved knowledge passage (`source_id`, `passage_id`, `version`) or provided synthetic record (`record_id`, `field`); citations must resolve against the frozen input snapshot. Links are for inspection only, not live fetches. Fields/identifiers are proposed SAD contracts for QA and Build, not additional user-facing product features.

| `output_type` | Required structured fields when complete/limited | Evidence and uncertainty rule |
| :-- | :-- | :-- |
| `classification` | `issue_label`, `priority_label`, `rationale` | Point to ticket/record facts; use limited/uncertain labeling when inputs do not support a firm classification. Labels remain dataset-dependent. |
| `knowledge` | `matches[]` of approved `source_id`, `passage_id`, `version`, passage excerpt; `no_match` flag | No match is explicit. Unapproved or unresolvable sources are rejected, not cited. Retrieval failure is `failed`, distinct from no match. |
| `sentiment_context` | `tone`, `impact_context`, `rationale` | Cite ticket language and available context; tone alone is never an assessment or referral trigger. |
| `response` | `draft_text` or `cannot_answer_reason`, `claim_refs[]` linking factual/policy claims to evidence | No unsupported policy, verified outcome, or action claim. Missing/conflicting evidence appears as a limitation; do not imply a response was sent. |
| `escalation` | `human_assessment_recommended`, `assessment_reason`, `specialist_referral_suggested`, `referral_reason`, optional proposed specialist name | Two separate decisions; a referral needs evidence/procedure-based rationale. Neither field executes a transfer. Unknown policy or record conflict can recommend assessment without asserting specialist referral. |

The coordinator rejects invalid/missing required fields, unknown evidence refs, or contradictory status/claim combinations. It cannot certify the semantic truth of every generated claim; QA and the human reviewer check grounding. Every draft and escalation output, including `limited` outputs, remains subject to human review before any human use. Failed or skipped generation yields no approvable draft/recommendation.

### Grounding and Escalation Rules

The local approved-knowledge index yields identified passages from the current fictional corpus; supplied records are separate evidence with provenance. On intake, capture immutable available inputs and corpus version. Retrieve candidate passages, validate identifiers against the allowlist, and hand excerpts and record pointers to the resolution adviser. Claims must identify which approved passage or supplied record supports them. If a record is missing, conflicts with another record, or no applicable passage exists, state what is unknown and the needed verification; never infer payment status, policy, or customer outcome. A no-match is a normal limitation, while tool failure is a run error.

The escalation output distinguishes a need for human assessment from a possible specialist referral. Impact, record conflict, or insufficient evidence can warrant assessment; referral needs a documented procedural limit or evidence that the issue is outside the reviewer's available scope. Sentiment may affect wording and prioritization but cannot independently cause either decision. Payment examples in the MRD (including possible duplicate charge and Payments/Payment Operations referral) apply only to fictional e-commerce demo cases; other domains need their own approved knowledge and reviewed labels.

## 3. Frontend Architecture Specification

One minimal local review console with queue/ticket view, five separately labeled output regions, cited passage/record inspectors, unresolved-fact and failure indicators, and decision controls. On failure, show the failed step and available prior outputs, with no ready-for-approval state. Approval/edit/reject/revision controls record decisions; no command to send, transfer, or mutate is exposed. A revision yields another reviewable draft, not an automatic approval. Responsive layout and accessibility expectations are product concerns; exact framework, device support, and standard remain open. Prefer one simple web UI with typed request/response contracts; do not add chat, live dashboards, or vendor components as requirements.

## 4. Backend Architecture Specification

Local request/response boundary (conceptual contract, not a mandatory HTTP framework): `analyze(ticket_id)` reads only the synthetic queue and returns a `run_id` plus snapshot of five output envelopes and run status; `get_review(run_id)` returns retained inputs/evidence/outputs/errors/decisions; `record_decision(run_id, draft_decision, referral_decision, reviewer_id)` appends a human decision without side effects. Reviewable status values include `analyzing`, `ready_for_review`, `incomplete`, and `failed`; only a validated full run can be `ready_for_review`. A limited but explicitly labeled knowledge/evidence gap is not a successful factual answer. Review decisions must not change a failed run to complete. Actual API transport, reviewer identifier format, and exact revision contract are for Build after stakeholder confirmation.

Store the synthetic input snapshot, corpus version, per-task status and validated outputs, source references, uncertainty/errors, and reviewer decisions locally (a simple file-backed trace is a proposed MVP implementation, not an enterprise database requirement). Persist/record each validated task result before the next task begins, so later failures retain prior results. A model's text is never accepted as an authorization to call an external tool. No outbound adapters, production credentials, or mutating tool implementations are registered. Log synthetic IDs/status/error details without assuming production PII; local trace retention is an open decision. The runtime interface supports a local/mock model and approved knowledge lookup only.

## 5. DevOps & Deployment Architecture

Local educational deployment with synthetic fixtures, approved fictional corpus, and a small trace store; hosting choice remains open. CI/build gate should run format/lint, contract/unit tests, integration tests, and a smoke run on synthetic fixtures. A local health check may report process readiness, not market or model quality. Do not package production integrations, credentials, public endpoints, or action adapters. Operational deployment, advanced monitoring, and managed persistence are Future Work. Security assessment is required by workspace config before Deliver.

## 6. Data Flow & Integration Architecture

`simulated queue -> coordinator input snapshot -> T1 classification/context -> T2 approved knowledge -> T3 draft/escalation -> schema/evidence checks -> local trace -> human review console -> decision record`.

Each task receives only allowed context and writes a validated, typed output before the next. The UI never invokes CrewAI tools directly. The approval boundary leads only to a local decision record; there is no message, transfer, or record-update sink. The sole data sources are synthetic tickets/records and approved fictional passages. A task/tool/schema/orchestration failure records `failed_step`, reason, and previously validated results, marks dependent outputs `skipped`, and leaves the run incomplete/failed; errors are visible to the reviewer. No failure is represented as all five outputs complete.

## 7. Performance & Scalability Specifications

Measure time to first draft and human review effort against the same-case manual baseline, reporting by domain (PRD section 7). There is no approved response-time, accuracy, concurrency, throughput, cost, or minimum dataset-size threshold. Build may use local bounded execution, but specific budgets and retry/timeout values require operator and QA review; timeouts count as failed steps, not successful results. Single-user synthetic MVP is a deployment assumption to confirm, not a product limit. Scaling and production availability are deferred.

## 8. Security & Compliance Architecture

Restrict runtime tools and application dependencies to local synthetic read access and local decision/trace writes. Treat ticket text and knowledge excerpts as untrusted data: never execute embedded instructions or use them to extend the allowlist. Validate input and output shapes; ensure approved passage IDs resolve and prevent generated text from granting permissions. Reviewer actions can write only decision records. Enforce no network/outbound or mutation endpoints/adapters and no production credentials in the MVP; verify at wiring, tool-registry, and integration-test levels (including approval and prompt-injection paths). A security reviewer must examine bypasses via agent tools, workflow handlers, and UI review controls. Authentication model, local encryption, retention, and production compliance are open or deferred; synthetic-only is not a justification for permitting live access.

## 9. Testing & Quality Assurance Specifications

| PRD criteria / cases | Architecture component and expected test |
| :-- | :-- |
| AC-01,02,04 / TC-01,02,03,06,07 | Input snapshot and T1 outputs; unit tests for absent/conflicting facts, classification/tone independence; compare labels against reviewed synthetic gold labels. |
| AC-03,05 / TC-01,02,05,06,07 | Approved lookup, citation resolver, T3 response; no-match, unapproved citation, unsupported claim, and grounding review tests. |
| AC-06 / TC-01,02,03,04,06,07 | Escalation fields and rationale; test neutral-tone risk, tone-only changes, routine case, and procedural limit; separately grade assessment/referral decisions. |
| AC-07 / TC-01,05,06,07 | Five independent typed output regions; inspect each and its references without assuming five agents. |
| AC-08 / TC-01,04,08,09 | Review handler and tool allowlist; test approval/edit/reject/revision and proposed referral; inspect all call paths to prove no send, transfer, or external/production mutation executable path. |
| AC-09,10 / TC-02,08,09,10 | Trace writer and coordinator; inject agent, retrieval, invalid-schema, and orchestration failures after a prior output; assert preserved inputs/results, failed-step visibility, skipped dependents, and no false ready state. |

QA owns fixture selection, labels, rubric, and evaluator implementation; Build supplies unit/integration hooks and reproducible local runs. Report metrics and sample sizes separately for e-commerce and the non-e-commerce probe. Smoke test normal review, a knowledge gap, a failed task, and approval without external action. A security review precedes Deliver.

### Evaluation Criteria (Operator Approval Pending)

These are measurable dimensions, not approved pass/fail numeric targets. The PRD explicitly defers the synthetic golden dataset, labeling rubric, manual baseline, risk tolerance, and thresholds to stakeholders and QA. The operator must supply/approve thresholds before section 9 can become a scored pass/fail contract. Invariants such as no executable external action and no false completion are mandatory PRD acceptance conditions, not performance targets.

| ID | Dimension | Metric | Threshold | Grading Method | Source |
| :-- | :-- | :-- | :-- | :-- | :-- |
| EC-001 | Accuracy | Issue/priority label agreement; assessment recall and unnecessary recommendations separately from specialist suggestions | Pending operator/QA approval | Reviewed golden labels and case comparisons | PRD AC-02,06; section 7 |
| EC-002 | Grounding/safety | Citation relevance/coverage, unsupported factual/policy claims, unsafe output | Pending operator/QA approval | Source and claim review on approved synthetic cases | PRD AC-03,05,07; section 7 |
| EC-003 | Latency/review effort | Time to first draft; review time/edits vs same-case manual baseline | Pending operator/QA approval | Timed paired reviews by domain | PRD section 5, 7 |
| EC-004 | Security/action boundary | Executable outbound/mutation path and unreviewed decision use | No executable path; every draft/recommendation reviewed (categorical invariant) | Tool/API path inspection plus approval/injection integration tests | PRD AC-08; TC-08,09 |
| EC-005 | Reliability/trace | Failed-step visibility, prior result preservation, no incomplete-success status | Required for every injected failure (categorical invariant) | Agent, retrieval, schema, orchestration fault-injection tests | PRD AC-09,10; TC-10 |
| EC-006 | Cost | Local model/runtime usage per case, if measurable in chosen setup | Pending operator/QA approval | Run instrumentation or N/A for mock execution | PRD section 5, 7 (no cost target) |

No invented percentage, timeout, ticket count, or price is binding. Ask the operator for acceptable risk and target values after QA/stakeholders agree the dataset and rubric; an unapproved value must not be passed downstream as an acceptance gate.

## 10. MVP Launch & Feedback Strategy

Present the synthetic review workflow to stakeholders and QA, including routine and ambiguous e-commerce Tier 2 cases and a separately reported non-e-commerce probe. Capture reviewer edits, accept/reject decisions, source gaps, failure observations, and manual comparison without asserting proven generalization or ROI. No public launch or production pilot is scoped; iterate on reviewed evidence, safeguards, and usability before any later live-data decision.

## Implementation Guidance for AI Development Agents

1. Project setup: local synthetic fixtures, approved fictional corpus, CrewAI runtime adapter, trace contracts; no live integrations.
2. Frontend: review console for ticket, five output envelopes, citations, uncertainty, failed-step state, and human decision controls without backend actions.
3. Backend: coordinator with constrained tasks, local lookup, schema/evidence validation, local trace, decision-only handler.
4. Integration: connect UI to analysis and decision contracts; inspect every path for external action capability.
5. QA/security: map tests to PRD AC-01..10 and TC-01..10; fault injection and action-path inspection before handoff.
6. Deliver: package a local educational demo and documentation after review, without adding production capabilities.

## Architecture Validation Checklist

- [x] PRD FR-01..10 and AC-01..10 mapped to components and synthetic tests.
- [x] Proposed CrewAI boundaries and sequential dependencies documented; five outputs remain separate.
- [x] Conceptual UI/backend contracts agree on failure, review, and decision-only states; concrete transport remains open.
- [x] No secrets or production integrations required; action isolation is a testable invariant.
- [x] MVP vs Future Work explicit; thresholds remain operator/QA decisions.
- [x] Resolved runtime recorded in Audit.

## Sources

- [PRD](prd.md): authoritative functional requirements FR-01..10, acceptance criteria AC-01..10, test cases TC-01..10, and provisional evaluation policy.
- [MRD](mrd.md): product boundary, fictional e-commerce examples, evaluation context, and synthetic-only constraints.
- `aamad.config.yml`: CrewAI target runtime, required unit/integration tests and security assessment.
- No user stories were present at drafting; no feature-level story is assumed.

## Assumptions

- Proposed two-agent sequential layout, local non-streaming web console, in-process coordinator, file-backed trace, and single-user demo are implementation choices for simplicity, not mandated product requirements. Build may refine these while retaining PRD contracts.
- A local/mock model implementation is available for the synthetic demo. A hosted model or telemetry endpoint is not silently authorized by CrewAI selection.
- The local trace records synthetic run state and decisions; exact retention, reviewer identifier scheme, API transport, and UI accessibility standard await confirmation.

## Open Questions

- Operator/stakeholders and QA: What approved golden dataset, labels/rubric, manual baseline, risk tolerance, and thresholds will define pass/fail for accuracy, grounding, latency, safety, and cost? No number is derived from current inputs.
- Stakeholders: Which non-e-commerce support domain and synthetic cases, and is shop access included? What ticket/record fields and decision vocabulary are needed?
- Architect/Build: Which local or mock CrewAI-compatible model interface, timeout/retry approach, transport and trace format meet the synthetic-only boundary? Confirm no network model/provider or telemetry traffic.
- Stakeholders/security: What local reviewer identity, retention, accessibility, and threat-model detail are needed for the educational demo?
- MRD/PRD consistency: No direct product-scope conflict found. The SAD template asks for scored evaluation thresholds before Build, while the PRD says these require stakeholder/QA approval; section 9 records the gap instead of inventing values.

## Audit

- Timestamp: 2026-10-24
- Persona id: `system-arch`
- Action: `create-sad --mvp`
- Artifact path: `project-context/1.define/sad.md`
- Resolved AAMAD_TARGET_RUNTIME: crewai
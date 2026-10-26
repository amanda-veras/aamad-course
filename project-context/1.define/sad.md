# System Architecture Document: Multi-Agent Customer Support Crew (MVP)

## 1. MVP Architecture Philosophy & Principles

The product is a general-purpose support review crew; fictional e-commerce Tier 2 tickets are the primary demonstration, with a small synthetic non-e-commerce probe. Five independently reviewable outputs are product contracts, not an agent-count mandate. CrewAI is the selected execution runtime. This SAD proposes two bounded agent roles and a non-agent coordinator to reduce handoffs while keeping outputs separate. The count is an MVP architecture choice, not a new product requirement (PRD FR-02..07).

The MVP uses a local simulated ticket queue, synthetic records, approved fictional knowledge, a review console, and a local trace store. All generated drafts and recommendations stop at a human review boundary; approval records a decision only. No network integration to a helpdesk, CRM, payment service, outbound messaging service, or production data store is allowed. For an entirely local/mock educational run, the model interface must use a local or test-double implementation; a hosted model endpoint would need separate stakeholder approval because it crosses the stated local-only boundary. No streaming is required: publish a result only after per-output validation, with visible progress/failure status.

Future Work, outside this architecture: live integrations, customer-facing execution, production security/compliance, multilingual support, advanced analytics, and scaling. The PRD does not require a chat UI, fixed latency, accuracy target, minimum case count, or P1 feature. A queue-based review console is the primary interaction (MRD section 3; PRD sections 2, 4, 6).

## 2. Multi-Agent System Specification

### Roles, Tasks, and Handoffs

| Role / task | Allowed inputs and tools | Output / next dependency | Rationale |
| :-- | :-- | :-- | :-- |
| Coordinator (deterministic application code, not an agent) | Synthetic ticket/record loader, deterministic approved-corpus lookup, schema validator, local trace writer; no action tools | Freezes available context; runs five workflow stages T1a -> T1b -> T2 -> T3a -> T3b in order, performing T2 without an LLM-backed CrewAI task; validates and persists each envelope before starting the next stage | Keeps evidence authority, failure handling, and review gate outside generated text. |
| Evidence Analyst, T1a classification | Provided ticket and records; no outbound or mutation tools | `ClassificationOutput` envelope with issue/priority, rationale and gaps; T1b receives only validated context | Classification remains separately reviewable (FR-02,07). |
| Evidence Analyst, T1b sentiment_context | Provided ticket/records and validated T1a context; no outbound or mutation tools | `SentimentContextOutput` envelope with tone, impact, rationale and gaps; T2 receives only validated context | Tone cannot independently authorize assessment or referral (FR-04,07). |
| Coordinator, T2 knowledge stage (deterministic; no CrewAI task/agent) | Deterministic, allowlisted local lookup; no model-controlled retrieval or source identifiers | Constructs, validates and persists `KnowledgeOutput` from tool-returned `source_id`, `passage_id`, `version`, excerpt, or `no_match`; T3a receives only validated references | Source selection and envelope construction remain coordinator-owned (FR-03,07). |
| Resolution Adviser, T3a response | Validated T1a/T1b/T2 outputs, synthetic records and approved passages; no external action tools | `ResponseOutput` envelope with a grounded draft or explicit inability to answer; T3b receives only validated context | Draft is separate from recommendation (FR-05,07). |
| Resolution Adviser, T3b escalation | Validated T1a/T1b/T2/T3a context and synthetic records; no external action tools | `EscalationOutput` envelope with independent human-assessment and specialist-referral reasons | Recommendation cannot execute an action (FR-06,07). |

CrewAI Build defaults (not product requirements): define the two agents in `agents.yaml` and four LLM-backed CrewAI tasks (T1a, T1b, T3a, T3b) in `tasks.yaml`; the five-stage workflow inserts coordinator-only T2 between T1b and T3a. Each CrewAI task declares its own named Pydantic `output_pydantic` model (`ClassificationOutput`, `SentimentContextOutput`, `ResponseOutput`, `EscalationOutput`), carrying the section 2 envelope plus its typed payload. The coordinator constructs and validates a separate Pydantic `KnowledgeOutput` contract for T2 from deterministic lookup results; T2 is not declared as a normal CrewAI task. Set `allow_delegation=false` and disable memory; pass explicit validated stage context, not unchecked raw prior prose. For reproducible smoke runs and fault injection, pin the logical local test-double identifier `mock/fixture-envelope-v1` (not an assumed real model-provider identifier). Build must define how this test double is injected via the chosen CrewAI/runtime adapter without hosted model calls or telemetry; its deterministic fixture envelopes pass through the same schema, evidence-reference, status, and persistence validation as ordinary task results. No production model is selected; a hosted model/provider or telemetry endpoint requires stakeholder approval. Configure a bounded execution timeout in Build without treating its value as an EC-001..003 evaluation threshold: on expiry, record `failed_step`, preserve validated outputs, mark dependents `skipped`, and do not silently retry. The coordinator enforces schema validation, evidence allowlists, status transitions, and the review gate. Five stages and five outputs do not imply five CrewAI tasks or agents; the two roles remain an MVP architecture choice (PRD FR-02..07).

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

The coordinator's deterministic approved-corpus lookup yields identified passages from the current fictional corpus; supplied records are separate evidence with provenance. On intake, capture immutable available inputs and corpus version. At T2 the coordinator retrieves candidates, verifies identifiers against the allowlist, and writes the `KnowledgeOutput` envelope with `source_id`, `passage_id`, `version`, and excerpt, or `no_match`; the model never emits an identifier that the tool did not return. An empty applicable result is `limited`/`no_match`, while lookup tool failure is `failed` and stops dependent tasks. T3a and T3b receive only validated references, excerpts and record pointers. Claims must identify which approved passage or supplied record supports them. If a record is missing, conflicts with another record, or no applicable passage exists, state what is unknown and the needed verification; never infer payment status, policy, or customer outcome. A no-match is a normal limitation, while tool failure is a run error.

The escalation output distinguishes a need for human assessment from a possible specialist referral. Impact, record conflict, or insufficient evidence can warrant assessment; referral needs a documented procedural limit or evidence that the issue is outside the reviewer's available scope. Sentiment may affect wording and prioritization but cannot independently cause either decision. Payment examples in the MRD (including possible duplicate charge and Payments/Payment Operations referral) apply only to fictional e-commerce demo cases; other domains need their own approved knowledge and reviewed labels.

## 3. Frontend Architecture Specification

One minimal local review console with queue/ticket view, five separately labeled output regions, cited passage/record inspectors, unresolved-fact and failure indicators, and decision controls. On failure, show the failed step and available prior outputs, with no ready-for-approval state. Approval/edit/reject/revision controls record decisions; no command to send, transfer, or mutate is exposed. A request for revision captures the reviewer's note and opens a new `run_id` linked to the prior review; the UI preserves the original review and decisions and displays a new draft/recommendation from T3a/T3b without inheriting any approval, or a visible failed/incomplete revision when either stage fails. Responsive layout and accessibility expectations are product concerns; exact framework, device support, and standard remain open. Prefer one simple web UI with typed request/response contracts; do not add chat, live dashboards, or vendor components as requirements.

## 4. Backend Architecture Specification

Local request/response boundary (conceptual contract, not a mandatory HTTP framework): `analyze(ticket_id)` reads only the synthetic queue and returns a `run_id` plus snapshot of five output envelopes and run status; `get_review(run_id)` returns retained inputs/evidence/outputs/errors/decisions; `record_decision(run_id, draft_decision, referral_decision, reviewer_id)` appends a human decision without side effects. A `request_revision(run_id, reviewer_note)` on a reviewable run creates a new `run_id` linked to the original, reuses its already validated T1a/T1b/T2 outputs and frozen input/corpus snapshot, and re-executes only T3a then T3b with the note as additional review context. Original envelopes retain their original run IDs; the new trace references them and stores new T3a/T3b envelopes under the new run ID, with no inherited approval or decision. The result is another reviewable draft/recommendation only after both new outputs pass validation; a failed/incomplete revision cannot become `ready_for_review`, and the original run and decisions remain unchanged. Reviewable status values include `analyzing`, `ready_for_review`, `incomplete`, and `failed`; only a run with all five validated outputs (including referenced, already validated T1a/T1b/T2 on revision) can be `ready_for_review`. A limited but explicitly labeled knowledge/evidence gap is not a successful factual answer. Review decisions must not change a failed run to complete. Actual API/HTTP transport and reviewer identifier format remain open.

Store the synthetic input snapshot, corpus version, per-stage status and validated outputs (four CrewAI tasks T1a/T1b/T3a/T3b and coordinator-only T2), source references, uncertainty/errors, and reviewer decisions locally (a simple file-backed trace is a proposed MVP implementation, not an enterprise database requirement). Persist/record each validated output before the next stage begins, so a middle-stage failure or configured timeout retains prior results, records `failed_step`, and marks dependent stages skipped without silent retry. The local mock's fixture results follow the same validation and persistence path as ordinary CrewAI task results. A revision trace links its source run and reviewer note, reused validated envelopes, new T3a/T3b outputs and its own decisions; old approvals never carry over. A model's text is never accepted as an authorization to call an external tool. No outbound adapters, production credentials, or mutating tool implementations are registered. Log synthetic IDs/status/error details without assuming production PII; local trace retention is an open decision. The runtime interface supports a local/mock model and coordinator-owned approved knowledge lookup only.

## 5. DevOps & Deployment Architecture

Local educational deployment with synthetic fixtures, approved fictional corpus, and a small trace store; hosting choice remains open. CI/build gate should run format/lint, contract/unit tests, integration tests, and a reproducible smoke run using the locally injected fixture test double and synthetic fixtures (no hosted model calls or telemetry). A local health check may report process readiness, not market or model quality. Do not package production integrations, credentials, public endpoints, or action adapters. Operational deployment, advanced monitoring, and managed persistence are Future Work. Security assessment is required by workspace config before Deliver.

## 6. Data Flow & Integration Architecture

`simulated queue -> coordinator input snapshot -> T1a classification -> validate/persist -> T1b sentiment_context -> validate/persist -> T2 coordinator-owned approved-corpus lookup/knowledge envelope -> validate/persist -> T3a response -> validate/persist -> T3b escalation -> validate/persist -> local trace -> human review console -> decision record`.

The four CrewAI tasks receive only allowed context; the coordinator validates and persists each stage's typed envelope before starting the next. T2 is a deterministic coordinator stage, not an Evidence Analyst or LLM-backed CrewAI task; its local tool alone supplies source identifiers, and the coordinator constructs and validates `KnowledgeOutput`. A retrieval failure is `failed`, whereas an applicable-passage absence is `limited`/`no_match`. T3a/T3b consume validated references only. A revision links a new `run_id` to the original, reuses validated T1a/T1b/T2 envelopes and frozen inputs, and passes the reviewer's note only to newly executed T3a/T3b; it inherits no approval. The UI never invokes CrewAI tools directly. The approval boundary leads only to a local decision record; there is no message, transfer, or record-update sink. The sole data sources are synthetic tickets/records and approved fictional passages. A CrewAI task/coordinator stage/tool/schema/orchestration failure or bounded-execution timeout records `failed_step`, reason, and previously validated results, marks dependent outputs `skipped`, and leaves the run incomplete/failed without silent retry; errors are visible to the reviewer. The same failure and readiness rules apply to revisions and deterministic mock fixtures. No failure is represented as all five outputs complete.

## 7. Performance & Scalability Specifications

Measure time to first draft and human review effort against the same-case manual baseline, reporting by domain (PRD section 7). There is no approved response-time, accuracy, concurrency, throughput, cost, or minimum dataset-size threshold. Build uses local bounded execution, but the specific timeout value requires operator and QA review; timeouts count as failed steps, not successful results and trigger no silent retry. This Build default is separate from pending EC-001..003 thresholds. Single-user synthetic MVP is a deployment assumption to confirm, not a product limit. Scaling and production availability are deferred.

## 8. Security & Compliance Architecture

Restrict runtime tools and application dependencies to local synthetic read access and local decision/trace writes. Treat ticket text and knowledge excerpts as untrusted data: never execute embedded instructions or use them to extend the allowlist. Validate input and output shapes; ensure approved passage IDs resolve and prevent generated text from granting permissions. Reviewer actions can write only decision records. Enforce no network/outbound or mutation endpoints/adapters and no production credentials in the MVP; verify at wiring, tool-registry, and integration-test levels (including approval and prompt-injection paths). A security reviewer must examine bypasses via agent tools, workflow handlers, and UI review controls. Authentication model, local encryption, retention, and production compliance are open or deferred; synthetic-only is not a justification for permitting live access.

## 9. Testing & Quality Assurance Specifications

| PRD criteria / cases | Architecture component and expected test |
| :-- | :-- |
| AC-01,02,04 / TC-01,02,03,06,07 | Input snapshot and separately validated T1a classification and T1b sentiment_context; unit tests for absent/conflicting facts, classification/tone independence; compare labels against reviewed synthetic gold labels. |
| AC-03,05 / TC-01,02,05,06,07 | Coordinator-owned deterministic T2 approved lookup/envelope and citation resolver, then T3a response using validated references only; test tool-returned identifiers, `limited`/`no_match` versus `failed` tool error, unapproved citation, unsupported claim, and grounding review. |
| AC-06 / TC-01,02,03,04,06,07 | T3b escalation fields and rationale; test neutral-tone risk, tone-only changes, routine case, and procedural limit; separately grade assessment/referral decisions. |
| AC-07 / TC-01,05,06,07 | Five independently validated and persisted Pydantic output envelopes from four CrewAI tasks (T1a/T1b/T3a/T3b) and coordinator-only T2; inspect each and its references without assuming five agents or tasks. |
| AC-08 / TC-01,04,08,09 | Review handler and tool allowlist; test approval/edit/reject/revision and proposed referral; assert revision creates a distinct `run_id`, leaves the original run and its decisions unchanged, references validated T1a/T1b/T2 without rerunning them, executes only T3a/T3b again with the reviewer note, and inherits no prior approval/decision; inspect all call paths to prove no send, transfer, or external/production mutation executable path. |
| AC-09,10 / TC-02,08,09,10 | Trace writer and coordinator; inject CrewAI-task, T2 retrieval, invalid-schema, timeout, and orchestration failures between sequential stages, including T3a/T3b failures during revision; assert each prior validated output remains persisted, `failed_step` visibility, skipped dependents, no silent retry, and no false ready state (an incomplete revision cannot become `ready_for_review`); check revision lineage without modifying original run, decisions, or source envelopes. Exercise the same schema, evidence-reference, status and persistence checks with deterministic mock fixtures, including invalid fixture fault injection. |

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

1. Project setup: local synthetic fixtures, approved fictional corpus, CrewAI runtime adapter with explicitly injected `mock/fixture-envelope-v1` logical test double (no hosted calls/telemetry), trace contracts; no live integrations.
2. Frontend: review console for ticket, five output envelopes, citations, uncertainty, failed-step state, and human decision controls without backend actions.
3. Backend: coordinator orchestrating four configured CrewAI tasks and deterministic T2 as five stages, with local lookup, identical validation/persistence for mock and ordinary outputs, local trace, and decision-only handler.
4. Integration: connect UI to analysis and decision contracts; inspect every path for external action capability.
5. QA/security: map tests to PRD AC-01..10 and TC-01..10; fault injection including failed revisions and mock fixtures, original-run preservation, and action-path inspection before handoff.
6. Deliver: package a local educational demo and documentation after review, without adding production capabilities.

## Architecture Validation Checklist

- [x] PRD FR-01..10 and AC-01..10 mapped to components and synthetic tests.
- [x] Four configured CrewAI tasks plus deterministic coordinator-only T2 form five sequential stages; five validated outputs remain separate.
- [x] Conceptual UI/backend contracts agree on failure, revision without inherited approval, review, and decision-only states; concrete transport remains open.
- [x] No secrets or production integrations required; action isolation is a testable invariant.
- [x] MVP vs Future Work explicit; thresholds remain operator/QA decisions.
- [x] Resolved runtime recorded in Audit.

## Sources

- [PRD](prd.md): authoritative functional requirements FR-01..10, acceptance criteria AC-01..10, test cases TC-01..10, and provisional evaluation policy.
- [MRD](mrd.md): product boundary, fictional e-commerce examples, evaluation context, and synthetic-only constraints.
- `aamad.config.yml`: CrewAI target runtime, required unit/integration tests and security assessment.
- No user stories were present at drafting; no feature-level story is assumed.

## Assumptions

- Proposed two-agent layout with four CrewAI tasks and one deterministic coordinator stage, local non-streaming web console, in-process coordinator, file-backed trace, and single-user demo are implementation choices for simplicity, not mandated product requirements. Build may refine these while retaining five PRD output contracts.
- Build defaults are `agents.yaml` for two agents, `tasks.yaml` for four CrewAI tasks, delegation and memory disabled, an adapter-injected fixture-envelope local test double (`mock/fixture-envelope-v1` is a logical identifier, not a provider model) for reproducible smoke/fault-injection runs, and bounded timeout failure without silent retry; the exact timeout value is not an approved evaluation threshold. Mock envelopes undergo the same validations and persistence as ordinary results. A hosted model or telemetry endpoint is not silently authorized by CrewAI selection.
- The coordinator alone owns deterministic knowledge lookup and envelope construction; a reviewer-requested revision starts a new run with validated classification, sentiment/context, and knowledge reused, response/escalation rerun, and no inherited approval. These are design decisions, not still-open contract questions.
- The local trace records synthetic run state and decisions; exact retention, reviewer identifier scheme, API/HTTP transport, and UI accessibility standard await confirmation.

## Open Questions

- Operator/stakeholders and QA: What approved golden dataset, labels/rubric, manual baseline, risk tolerance, and thresholds will define pass/fail for accuracy, grounding, latency, safety, and cost? No number is derived from current inputs.
- Stakeholders: Which non-e-commerce support domain and synthetic cases, and is shop access included? What ticket/record fields and decision vocabulary are needed?
- Architect/Build: How is the logical fixture test double injected through the chosen CrewAI/runtime adapter, and which local or mock interface (beyond the fixture smoke double), bounded timeout value, API/HTTP transport, and trace format meet the synthetic-only boundary? Verify no network model/provider or telemetry traffic. Four CrewAI tasks plus coordinator-only T2, no-silent-retry timeout handling, and new-run revision behavior are decided; no production model has been selected.
- Stakeholders/security: What local reviewer identity, retention, accessibility, and threat-model detail are needed for the educational demo?
- MRD/PRD consistency: No direct product-scope conflict found. The SAD template asks for scored evaluation thresholds before Build, while the PRD says these require stakeholder/QA approval; section 9 records the gap instead of inventing values.

## Audit

- Timestamp: 2026-10-24
- Persona id: `system-arch`
- Action: `create-sad --mvp`
- Artifact path: `project-context/1.define/sad.md`
- Resolved AAMAD_TARGET_RUNTIME: crewai

- Timestamp: 2026-10-26T16:32:43-0300
- Persona id: `system-arch`
- Action: `revise-sad`
- Artifact path: `project-context/1.define/sad.md`
- Resolved AAMAD_TARGET_RUNTIME: crewai

- Timestamp: 2026-10-26T16:49:17-0300
- Persona id: `system-arch`
- Action: `revise-sad --targeted-consistency-review`
- Artifact path: `project-context/1.define/sad.md`
- Resolved AAMAD_TARGET_RUNTIME: crewai
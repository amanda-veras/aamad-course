# Product Requirements Document: Multi-Agent Customer Support Crew

## 1. Executive Summary

### Problem and Product

Support reviewers need a way to inspect ticket triage, relevant guidance, customer context, response drafts, and escalation reasoning together without relying on unsupported answers or delegating decisions to automation. The product is a **general-purpose Multi-Agent Customer Support Crew** for support teams across service environments. Its five independently reviewable specialist outputs are classification, knowledge retrieval, sentiment/context analysis, response generation, and escalation recommendation. Outputs do not imply one agent per output.

The MVP demonstrates this workflow with fictional enterprise e-commerce Tier 2 tickets and a small non-e-commerce synthetic probe. E-commerce is the primary demonstration, not a product-domain restriction. Only synthetic tickets, synthetic records, and an approved fictional knowledge base may be used. Support staff make all customer-facing and referral decisions. The crew cannot send messages, transfer tickets, or change production systems.

Success means reviewers can inspect evidence, uncertainty, all five outputs, and decisions on a labeled synthetic test set. Reduced investigation or review time, market demand, differentiation, and ROI are hypotheses, not established outcomes or launch claims. No market size, pricing, or quantified operational benefit is assumed.

## 2. Market Context and Users

- **Primary user:** Support reviewer assessing an unresolved ticket; a Tier 2 engineer plays this role in the e-commerce demonstration.
- **Other participants:** Stakeholders and QA curate synthetic tickets, approved fictional knowledge, expected labels, and evaluation rubrics. A specialist team may be suggested for a human decision, but receives no automatic transfer.
- **User need:** See what the ticket says, which records and guidance are available or missing, what each specialist output concluded, and why a draft or referral is proposed. The reviewer must be able to approve, edit, reject, or request revision without any action being executed by the crew.
- **Context:** The MRD surveys alternatives qualitatively but does not establish a buyer segment, competitive advantage, or willingness to pay. Commercialization and geographic scope are not MVP decisions.

## 3. Product Boundaries and Technical Handoff

- **Selected build runtime:** CrewAI (`AAMAD_TARGET_RUNTIME: crewai`), per workspace configuration. This constrains the implementation, not the product's five-output definition.
- **Input boundary:** A simulated queue supplies a synthetic ticket and available synthetic records; only approved fictional knowledge is eligible to support policy or process claims. Missing or contradictory inputs are valid cases.
- **Output boundary:** Analysis, citations, drafts, and recommendations are presented to a human reviewer; none is an executed customer or workflow action.
- **Architecture ownership:** The SAD decides CrewAI agent count, responsibilities, orchestration/delegation, retrieval/grounding method, output contracts, persistence, interfaces, audit storage, and tool isolation. No particular agent-to-output mapping, hosting platform, live API, or model is required by this PRD.
- **MVP exclusions:** Live customer data or integrations, outbound acknowledgements or responses, ticket transfers, production mutations, autonomous specialist referrals, customer-facing bots, and production deployment claims.

## 4. Functional Requirements and Acceptance Criteria

All requirements below are P0 for the synthetic MVP unless marked optional. Each AC is an observable behavior, not a numerical quality threshold. Test cases in section 7 reference these IDs.

| Requirement | General product behavior | Acceptance criteria |
| :-- | :-- | :-- |
| FR-01 Intake and evidence boundary | Accept a synthetic ticket with available synthetic context from a simulated queue; do not assume omitted records exist or query live systems. | AC-01: The reviewer can see the ticket and provided records, and absent or conflicting records are identified without fabricated lookups. |
| FR-02 Classification | Provide issue and priority classification as a separate reviewable output with its rationale. | AC-02: Every test ticket displays an issue/priority assessment; a case with insufficient evidence shows uncertainty rather than unsupported certainty. Labels are compared with the reviewed gold labels. |
| FR-03 Knowledge retrieval | Present relevant approved fictional knowledge, or explicitly report that no applicable source was found. | AC-03: Retrieved passages are traceable to approved source identifiers; reviewers can judge relevance and coverage against the expected passages; no-match cases expose the gap. |
| FR-04 Sentiment and context | Present tone and impact assessment independently of issue classification and decision advice. | AC-04: Reviewers can inspect the assessment and its ticket basis; changes in tone alone do not produce a specialist referral or human-assessment recommendation. |
| FR-05 Response generation | Present a grounded customer-facing draft, or explicitly say when the available evidence cannot support a reliable answer. | AC-05: Factual/policy claims cite approved knowledge or identified ticket records; missing/conflicting information is stated; no unsupported outcome, policy, or action is asserted. |
| FR-06 Escalation recommendation | Distinguish whether human assessment is warranted from whether a specialist referral is suggested; provide rationale or explicitly recommend neither. | AC-06: The two decisions and reasons are separately reviewable. Material discrepancies or evidence gaps can warrant human assessment without automatically suggesting a specialist; referral requires an evidence/procedure-based reason, never sentiment alone. |
| FR-07 Five-output review | Present FR-02 through FR-06 as five distinct outputs, each individually inspectable with applicable evidence, rationale, and unresolved facts. | AC-07: A reviewer can examine each output separately for the same ticket and trace supporting sources or missing evidence without inferring implementation agent count. |
| FR-08 Human decision and no-action boundary | Require human review of every customer-facing draft and every escalation recommendation; allow approval, editing, rejection, or a revision request and a recorded decision on further investigation/referral. Approval records a human decision only; it does not execute the decision. | AC-08: No draft or recommendation bypasses review; reviewer decisions are distinguishable from crew suggestions. Approval and other review controls only record decisions: no customer message, ticket transfer, or external/production record change occurs, including when an output suggests referral. |
| FR-09 Review trace | Record enough synthetic-case history to reconstruct the input, cited knowledge, five outputs, unresolved facts, and reviewer decisions for evaluation. | AC-09: For a reviewed ticket, QA can identify which available evidence supported each conclusion and what the reviewer changed or decided; unsupported or blocked outputs remain inspectable. |
| FR-10 Analysis failure visibility | Report agent-level and workflow/orchestration failures without losing the ticket, available inputs, or completed prior outputs. | AC-10: The reviewer can identify the failed step and see preserved inputs and prior outputs; incomplete analysis is visibly marked as failed or incomplete, never as successfully completed or ready for approval. |

### Demonstration Cases (Not General Product Rules)

| Fictional Tier 2 scenario | Coverage to include in synthetic cases |
| :-- | :-- |
| Customer order/payment discrepancies | Routine policy question, missing/conflicting payment and order records, possible duplicate charge, and an unresolved discrepancy. |
| Dealer order/inventory issues | Missing or conflicting dealer order and inventory context; grounded draft or explicit information gap. |
| Routing/location assignments | Incorrect or unclear order routing/location context with evidence to inspect and a reviewer decision. |
| Shop access (optional) | An additional approved-knowledge and missing-evidence example if stakeholders include it in the dataset. |

For payment examples only, a routine supported question should yield a draft without specialist referral; a possible duplicate charge or unresolved mismatch merits human assessment even when calmly worded. A Payments/Payment Operations referral is suggested only when the available evidence or documented Tier 2 procedure cannot resolve the matter. These labels are provisional until the synthetic dataset and rubric are reviewed; they do not define escalation categories for other domains.

### P1 / Future Work

No additional P1 feature is required for MVP. Potential later work includes live helpdesk integration, production security controls, multilingual support, manager analytics, and customer-facing automation, each subject to separate discovery, approval, and safeguards. None is a current acceptance criterion.

## 5. Non-Functional Requirements

| Area | MVP requirement and verification |
| :-- | :-- |
| Data and safety | Only synthetic inputs and approved fictional knowledge are accessible to the crew. Include misleading ticket text or knowledge content in safety tests; it must not authorize external actions or unsupported claims. |
| Traceability | Citations identify the supporting approved passage or available synthetic record. Preserve the relationship between inputs, five outputs, and reviewer decisions for evaluation; the SAD determines storage and audit design. |
| Reliability | Missing evidence and conflicting records must yield a visible limitation or review need, not a fabricated answer. Agent execution and orchestration failures must show the failed step, preserve available inputs and prior outputs, and prevent incomplete analysis from appearing complete. Recovery and observability details belong to the SAD. |
| Performance | Record time to first draft and human review time against the same-case manual baseline. No response-time, throughput, concurrency, or availability target is accepted before the evaluation plan and environment are agreed. |
| Privacy/security | No live PII, financial system credentials, production APIs, or outbound action capability in MVP. SAD and security review must verify that no executable path exists for outbound messaging, ticket transfers, or external/production record mutations, including through approval controls and agent tools. The SAD and security reviewer define isolation, logging, and prompt-injection controls for synthetic data. |
| Accessibility/usability | Reviewers must be able to inspect each output, cited evidence, missing facts, and decision controls in a clear operational view. Accessibility standard, device support, and exact interaction design need stakeholder confirmation. |

## 6. Reviewer Experience

The reviewer opens an unresolved synthetic ticket, sees supplied context and missing/conflicting facts, inspects each of the five outputs and its sources, then approves, edits, rejects, or requests revision of the draft and decides whether any further investigation or specialist referral should occur. Approval records the reviewer's decision only; it never sends a message, transfers a ticket, or updates an external or production record. A revision request returns a new reviewable draft; it does not trigger sending. Failed analysis shows the failed step and retained context instead of a ready-for-approval result. The reviewer can see when approved knowledge is unavailable and can distinguish the crew's recommendation from their own decision. Tier 2 terminology and payment-specific team names belong only to the e-commerce demonstration.

## 7. Acceptance Test Cases and Evaluation

Stakeholders and QA must agree on a synthetic golden set with expected issue/priority labels, approved passages, available/missing records, acceptable draft traits, human-assessment and specialist-referral decisions, and rationales before scoring. Include routine, ambiguous, contradictory, calm but material-risk, and misleading-input cases across the e-commerce scenarios. Add a small synthetic set with approved knowledge from at least one non-e-commerce support domain to probe transfer; report its results separately rather than claiming proven general performance.

| Test case | Synthetic setup and observable expectation | Requirements / criteria |
| :-- | :-- | :-- |
| TC-01 Routine supported ticket | Approved policy and consistent records: correct issue/priority, relevant cited passage, separate tone/context, grounded draft, neither assessment nor referral, reviewer approves or edits without sending. | FR-01..08 / AC-01..08 |
| TC-02 Missing or conflicting records | Ticket omits a necessary record or records disagree: uncertainty and gap visible in outputs, no invented outcome, human assessment explained without automatic specialist referral. | FR-01,02,03,05,06,07,09 / AC-01,02,03,05,06,07,09 |
| TC-03 Calm material discrepancy | Possible duplicate charge or other material mismatch written without frustration: human assessment proposed despite neutral tone; specialist referral only if procedures/evidence justify it. | FR-02,04,05,06 / AC-02,04,05,06 |
| TC-04 Specialist boundary | Documented Tier 2 checks cannot resolve a synthetic payment discrepancy: explain the procedural limit and suggest Payments/Payment Operations for reviewer decision; no transfer occurs. | FR-05,06,08,09 / AC-05,06,08,09 |
| TC-05 Knowledge gap | No approved source covers a question: retrieval reports no match, draft states inability or needed verification, reviewer can decide next step without an invented policy. | FR-03,05,06,07 / AC-03,05,06,07 |
| TC-06 Other e-commerce scenarios | Dealer order/inventory and routing/location tickets, plus shop access if included: verify all five outputs, source links, missing facts, and decision controls without applying payment-specific referral rules. | FR-01..09 / AC-01..09 |
| TC-07 Non-e-commerce probe | Synthetic ticket and approved knowledge from a distinct support domain: run the same five-output and review tests; report coverage and errors separately from the capstone. | FR-01..09 / AC-01..09 |
| TC-08 Reviewer and action boundary | Across approved, edited, referral, rejected, and revision-request cases: every draft and recommendation awaits human review; approval records a decision only. Verify reviewer controls, agent tools, and workflow paths have no executable route to outbound messaging, ticket transfer, or external/production mutation. | FR-08,09 / AC-08,09 |
| TC-09 Misleading input and trace | Ticket or fictional knowledge contains instructions to ignore rules or invent facts: outputs stay within approved evidence and action limits; QA reconstructs sources, unresolved facts, outputs, and review decision. | FR-01,03,05,07,08,09 / AC-01,03,05,07,08,09 |
| TC-10 Analysis failure | Inject a failure in an agent step and, separately, in workflow/orchestration after an earlier output is produced. In both cases, show the failed step, retain available inputs and prior outputs, and block incomplete analysis from being shown as successfully completed or ready for approval. | FR-09,10 / AC-09,10 |

### Scoring and Provisional Targets

- **Classification:** Compare issue and priority labels against reviewed expectations; report confusion patterns and ambiguous cases.
- **Retrieval:** Review cited passage relevance and coverage against the approved knowledge expected for each case; count missing or inappropriate sources.
- **Grounding and safety:** Inspect factual and policy statements for support by citations, explicit uncertainty, invented facts/actions, unsafe instructions, and policy violations; count violations separately.
- **Escalation:** Score human-assessment recall on cases requiring it and unnecessary human-assessment recommendations on routine grounded cases. Score specialist suggestions and unnecessary referrals separately. Check neutral-tone material-risk and tone-only cases.
- **Traceability and oversight:** For each reviewed case, verify five accessible outputs, evidence links or explicit gaps, decision history, and absence of unreviewed or executed actions.
- **Review effort:** Record first-draft latency, review time, edits, and accepted/rejected drafts; compare with manual review on the same synthetic cases. Report sample sizes, disagreements, and results by domain.

These are testable measures, not accepted numeric targets. Stakeholders and QA must approve the synthetic golden dataset, labeling rubric, manual baseline, risk tolerance, and thresholds before any percentages, time limits, ticket counts, or go/no-go scores become binding.

## 8. Implementation and Handoff

Define: approve this PRD and the synthetic evaluation labels, then hand product constraints to the system architect for SAD/SFS decisions. Build: implement simulated intake, five outputs, reviewer controls, and tests linked to the criteria above using the selected CrewAI runtime. Deliver: package and document the synthetic MVP after QA and security review. Staffing, cost, hosting, and schedule are unestimated. Major risks are unsupported drafts, prompt injection, weak fictional knowledge, inconsistent escalation, and demo-only results being generalized; grounding, explicit unknowns, action isolation, human review, and separate-domain reporting are the product-level mitigations.

## 9. Launch and Market Scope

Public launch, pricing, production integrations, and go-to-market strategy are not part of this educational synthetic MVP. Broader commercial applicability remains unvalidated and would require separate research and real-world evaluation.

## Sources

- [Market Research Document](mrd.md): product scope, five outputs, synthetic workflow, demo-specific payment rules, evidence and oversight boundaries, and proposed evaluation method.
- Stakeholder requirements in the current PRD request: scope distinction, required outputs, demo scenarios, acceptance mapping, and SAD dependencies.
- Workspace configuration: `aamad.config.yml` selects CrewAI and requires tests mapped to acceptance criteria. The runtime choice does not mandate five agents.

## Assumptions

- The MRD's proposed simulated review queue is the MVP starting point; ticket schema and reviewer controls remain subject to confirmation.
- Synthetic case authors and QA can supply approved fictional knowledge and expected labels before scoring; until then no numeric target is approved.
- The non-e-commerce probe tests workflow transfer, not market fit or performance across all support domains.
- No system-description artifact was provided; this PRD uses the latest MRD and the stakeholder request as its requirements baseline.

## Open Questions

| Owner | Decision needed |
| :-- | :-- |
| Stakeholders / QA | Approve case mix, sample sizes, approved fictional knowledge, expected issue/priority and assessment/referral labels, disagreement process, rubric, manual baseline, and provisional-to-binding thresholds. |
| Stakeholders / QA | Choose the non-e-commerce support domain and its synthetic cases, and decide whether shop access is included in the e-commerce demonstration. |
| Stakeholders / reviewer | Confirm simulated ticket fields, available synthetic record types, decision vocabulary, revision behavior, and how review effort is recorded. |
| System architect (SAD/SFS) | Specify CrewAI agent boundaries and orchestration, output/evidence contracts, grounding approach, action isolation, reviewer handoff, persistence, audit, and agent/workflow failure handling without equating five outputs to five agents. |
| System architect / security reviewer | Define synthetic data access, prompt-injection defenses, safe logging, accessibility approach, and a verification method proving no executable path exists for outbound messages, ticket transfers, or external/production mutations through reviewer controls, agent tools, or workflows. |
| Product owner | Confirm any later live-data, production, commercial, or domain-specific policy scope separately; e-commerce payment rules do not apply to every domain. |

## Audit

- Timestamp: 2026-10-24
- Persona id: `product-mgr`
- Action: `revise-prd`
- Artifact path: `project-context/1.define/prd.md`
- Resolved `AAMAD_TARGET_RUNTIME`: `crewai`

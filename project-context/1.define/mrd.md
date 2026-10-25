# Market Research Document: Capstone Project Multi-Agent Customer Support Crew

## Executive Summary

The product is a general-purpose Multi-Agent Customer Support Crew that assists support teams across customer service environments. It prepares five reviewable specialist outputs: ticket classification, knowledge retrieval, sentiment/context analysis, response generation, and escalation recommendation. A fictional enterprise e-commerce support workflow is the primary capstone demonstration, not a restriction on the product's intended applicability.

The MVP accepts synthetic tickets and available fictional records, identifies missing or conflicting evidence, retrieves approved guidance, and presents grounded drafts and recommendations for human review. For the demonstration, a Tier 2 engineer reviews customer order/payment discrepancies, dealer order/inventory discrepancies, and order routing/location-assignment issues; shop access may be included. Support staff decide the response or next investigation step. The crew does not send messages, transfer tickets, or modify production systems.

Customer-support AI research below provides broader market context, not a validated business case for this crew. Commercial demand, differentiation, return on investment, and pricing remain hypotheses; the capstone should prioritize grounding, traceability, human review, and measurable performance on synthetic cases.

## Research Query Structure

**Primary Focus**: General-purpose multi-agent customer support crew; fictional enterprise e-commerce Tier 2 support is the primary demonstration scenario.

**Selected Runtime**: `crewai`

## Stakeholder-Defined Product Requirements

- The product supports customer service teams with ticket classification, knowledge retrieval, sentiment/context analysis, response generation, and escalation recommendations across support domains.
- The capstone illustrates this workflow with fictional e-commerce tickets about customer order/payment, dealer order/inventory, and routing/location assignments; shop access is an optional additional example. These are demonstration cases, not product-domain limits.
- Every customer-facing draft and escalation recommendation goes to a human support reviewer for a final decision (a Tier 2 engineer in the demonstration). The crew may automate internal analysis but cannot send, transfer, or change customer or production records in the MVP.
- The product exposes five distinct specialist outputs; the SAD and Build phase decide how many CrewAI agents produce them.
- These requirements come from stakeholder elicitation, not from the market sources below. The e-commerce payment rules and proposed test cases in section 3 illustrate their use in the capstone.

## 1. Market Analysis & Opportunity Assessment

### Key Insights

- The cited McKinsey analysis [2] is a background research lead on potential productivity in customer operations; its page could not be retrieved for verification and it is not evidence of a benefit for this crew.
- Salesforce's current State of Service landing page describes investment in agentic AI [3]; this vendor-reported signal does not establish willingness to pay for this capstone.
- The stakeholder-defined product is a general customer support crew; the fictional e-commerce Tier 2 workflow is a demonstration scenario, not a market segment inferred from these reports.
- Transparent specialist outputs, grounded drafting, and human review are design goals to test, not proven competitive advantages.

### Data Points

- Salesforce's State of Service landing page states that 79% of service professionals are investing in agentic AI [3]. This is a vendor-reported statistic, not an independently checked sample or a forecast for this product.
- NIST's AI RMF 1.0 (released January 2023) provides voluntary guidance for incorporating trustworthiness in AI design and evaluation [7]. This informs risk management, not market size.
- Gartner's older forecast URL [1] was unavailable during this revision; McKinsey's report page [2] could not be retrieved. Neither is used here as verified quantitative evidence.

### Source Citations

- [3] Salesforce, State of Service landing page (current page; report methodology/year to verify before quoting study results).
- [7] NIST, AI Risk Management Framework 1.0 (2023).
- [1, 2, 4-6] Background leads only; the listed pages were not independently verified as edition-specific research for this revision. In particular, [1] is unavailable and [6] now serves a rolling 2026 edition.

### Implications

The product addresses general support operations through reviewable analysis, drafting, and escalation recommendations. Faster investigation, more consistent drafting, and less review effort are outcomes to measure against a manual baseline, not established benefits. The fictional e-commerce case grounds the capstone evaluation; neither SaaS nor e-commerce is an exclusive target market established by this research.

### Existing Solutions & Limitations

| Solution Category | Representative Solutions | Strengths | Limitations For This Capstone Opportunity |
| :-- | :-- | :-- | :-- |
| Enterprise CRM/service platforms | Salesforce Service Cloud, ServiceNow Customer Service Management, Microsoft Dynamics 365 Customer Service | Case-management and integration options | Live enterprise integration is outside the synthetic MVP; comparative cost or implementation effort has not been measured |
| Helpdesk AI suites | Zendesk AI, Intercom Fin, Freshdesk Freddy AI, HubSpot Service Hub AI | Vendor-described ticketing and AI-assist features [13-17] | Role-output visibility and evidence review require product-by-product evaluation; no superiority claim is made |
| Generic chatbot builders | Dialogflow CX, Amazon Lex, Azure Bot Service, Botpress | Conversation and channel tooling | Fit for a reviewable multi-agent support workflow has not been compared |
| Agent-assist and contact-center AI | Google Cloud Contact Center AI, NICE, Genesys Cloud AI, Five9 AI | Agent-assist and contact-center options | Voice/contact-center breadth is not part of this MVP; no cost comparison is available |
| Open-source or framework-based agent systems | CrewAI, LangGraph, AutoGen, Semantic Kernel | Orchestration options; CrewAI is the selected runtime [12] | Each still requires product-specific evaluation, guardrails, and UI design |

This is a qualitative landscape, not a benchmark of competitors. Whether existing tools lack the desired review workflow or whether this design improves outcomes is unverified. The MVP will demonstrate inspectable specialist outputs, cited evidence, and human decisions using synthetic e-commerce examples.

## 2. Technical Feasibility & Requirements Analysis

### Key Insights

- A multi-agent architecture is appropriate when the workflow benefits from role separation: intake, triage, retrieval, draft generation, QA, escalation, and reporting.
- Responses must be grounded in approved knowledge with reviewable citations; the SAD determines the retrieval and grounding approach. Unsupported free-form answers create unacceptable hallucination and policy risk.
- The MVP can use a lightweight knowledge base, synthetic ticket dataset, and mock CRM/helpdesk integrations before production APIs are introduced.
- Human reviewer approval is required for every draft and escalation recommendation (Tier 2 in the capstone demonstration); evidence and procedural limits, rather than sentiment alone, determine whether further assessment or specialist referral is recommended.
- Five distinct specialist outputs are required: classification, knowledge retrieval, sentiment/context analysis, response generation, and escalation recommendation. These are product outputs, not a mandate for five CrewAI agents; the SAD and Build phase determine orchestration and agent boundaries.
- CrewAI is the selected runtime; implementation details and the orchestration pattern remain architecture decisions.

### Data Points

- NIST AI Risk Management Framework identifies validity, reliability, safety, security, resilience, accountability, transparency, explainability, privacy, and fairness as key AI trustworthiness dimensions.
- OWASP Top 10 for LLM Applications identifies prompt injection, sensitive information disclosure, insecure output handling, excessive agency, and supply-chain risks as major design concerns.
- Vendor product pages describe combinations of AI assistance, knowledge retrieval, and support workflow features [13-17]; feature comparisons require direct verification.

### Source Citations

- NIST AI RMF 1.0, 2023.
- OWASP Top 10 for Large Language Model Applications, 2025 project materials.
- Microsoft Azure Architecture Center, AI and chatbot architecture guidance.
- OpenAI platform documentation on retrieval, tool use, and safety practices.
- Anthropic documentation on tool use and prompt safety.
- CrewAI documentation for multi-agent orchestration concepts.

### Implications

The product needs simulated ticket intake, approved-knowledge retrieval, reviewable outputs, policy guardrails, and an audit trail for support-staff decisions. The SAD should determine the implementation; production integrations are outside MVP scope.

## 3. User Experience & Workflow Analysis

### Key Insights

- Support staff need reviewable investigations across issue types; the capstone will illustrate this with e-commerce customer and dealer order/payment, inventory, and routing/location-assignment tickets.
- Customers value quick responses, but poor or incorrect automated replies can increase frustration and ticket volume.
- Support reviewers need visibility into escalation reasons, available evidence, unresolved facts, and knowledge-base gaps; manager analytics are a possible later need.
- The best MVP interface is an operational console showing ticket queue, agent analysis, draft response, cited knowledge, risk flags, and approval controls.
- Adoption depends on trust: users must be able to see why a response was suggested and what source material supports it.

### User Journey Mapping

1. An unresolved support ticket enters a simulated review queue with its description and available synthetic context. Records may be incomplete or contradictory; the crew makes no assumption that additional or live data is available.
2. The crew reads the provided fictional ticket context and approved knowledge, identifying absent records, unresolved facts, and evidence needed for verification. It does not query live systems.
3. The crew presents five distinct outputs to the support reviewer: classification (issue and priority), knowledge retrieval (relevant approved sources), sentiment/context analysis (tone and impact), response generation (grounded draft or explicit inability to answer), and escalation recommendation (assessment/referral rationale or no referral).
4. The reviewer inspects source references and discrepancies, then approves, edits, rejects, or requests a revised draft and decides any further investigation, customer response, or specialist referral. The crew does not execute these actions.

For the presentation, a Tier 2 engineer reviews fictional customer/dealer order and payment discrepancies, dealer inventory issues, routing/location-assignment issues, and optionally shop-access problems. Routine questions, missing or conflicting records, frustrated customers, and higher-risk discrepancies exercise the same general workflow.

### Automation Opportunities

- Internal analysis may automatically prepare classifications, evidence summaries, retrieved passages, sentiment/context assessments, drafts, and recommendations for human review. These outputs are not executed workflow actions.
- Every customer-facing draft and every human-assessment or specialist-referral recommendation must be reviewed by support staff before use. In the e-commerce demonstration, payment-related tickets receive evidence-based recommendations, not blanket specialist escalation.
- The MVP cannot send messages or acknowledgements, transfer tickets, or modify orders, payments, inventory, routing, accounts, or other production records. Any later customer-facing or production automation would require a separate decision and safeguards.

### E-Commerce Demonstration: Proposed Payment Triage Rules

These stakeholder-proposed payment examples specialize the general workflow for the fictional e-commerce capstone; they are not mandatory categories for every support environment or findings from market research. The crew assists Tier 2 engineers using synthetic tickets, synthetic order/payment context, and an approved fictional knowledge base; it does not access live systems or transfer tickets automatically.

| Ticket condition | Crew recommendation | Required explanation |
| :-- | :-- | :-- |
| Routine payment policy or process question, fully supported by approved knowledge | Draft a grounded response for Tier 2 review without recommending specialist escalation | Cite the applicable policy or procedure |
| Conflicting payment and order records, missing required evidence, or an inconclusive investigation | Recommend human assessment | Identify the conflict or missing information and what needs verification |
| Possible duplicate charge, unresolved payment/order mismatch, or other material financial discrepancy | Recommend human assessment regardless of sentiment | State the potential impact without claiming the payment outcome is verified |
| Evidence indicates investigation beyond Tier 2's information or documented procedures | Suggest Payments or Payment Operations as the specialist team for Tier 2 to consider | Explain why the existing evidence or procedure is insufficient |
| Applicable policy cannot be retrieved or evidence does not support a reliable conclusion | State the limitation and recommend manual review; do not improvise an answer | Specify the absent source or unresolved fact |

All drafts and escalation recommendations require human review (Tier 2 in these examples). Sentiment may influence tone and contribute to prioritization but must not independently trigger escalation. A recommendation for human assessment does not automatically imply specialist referral.

Proposed acceptance examples for a reviewed synthetic test set:

| Example | Expected decision |
| :-- | :-- |
| Approved policy answers a routine payment-process question, with no conflicting records | Grounded draft; Tier 2 review; no specialist referral |
| Synthetic order and payment records disagree or a necessary record is absent | Human assessment with the conflict or verification gap stated |
| Calmly worded possible duplicate charge or material financial mismatch | Human assessment despite neutral sentiment |
| Documented Tier 2 checks cannot resolve a payment discrepancy | Human assessment and a suggested Payments/Payment Operations referral for Tier 2 to decide |
| No approved policy covers the question | State the knowledge gap; no invented policy or payment outcome; Tier 2 review |

### Success Metrics

- Time to first draft response.
- Intent classification accuracy.
- Human-assessment recommendation recall on discrepancy cases; unnecessary human-assessment and specialist-referral recommendation rates on routine grounded cases. Measure specialist-referral suggestions separately from human-assessment recommendations.
- Percentage of drafts accepted with minor or no edits.
- Knowledge citation relevance.
- Average human review time per ticket.
- Safety/policy violation rate.

These are proposed measurements, not accepted targets. Any numeric targets suggested in Define artifacts (including accuracy percentages or response-time limits) are provisional and unvalidated until stakeholders and QA agree on labels, sample composition, risk tolerance, and measurement method using a reviewed synthetic test set and manual-triage baseline.

### Proposed MVP Evaluation Method

- Stakeholders and QA review synthetic support tickets with routine, ambiguous, and higher-risk cases. For the capstone, include fictional customer/dealer tickets spanning routine policy questions, conflicting or missing order/payment evidence, possible duplicate charges, inventory discrepancies, routing/location-assignment issues, and optionally shop access. Include calm high-risk cases and routine cases that do not merit specialist referral. Add a small set of synthetic tickets and approved knowledge from at least one non-e-commerce support domain to probe whether the five-output workflow transfers beyond the capstone.
- For each ticket, record expected issue/priority labels, available and missing facts, applicable approved knowledge passages, acceptable draft traits, whether human assessment is warranted, whether specialist referral is warranted, and the rationale. Reviewers resolve disputed labels before scoring.
- Compare classification to expected labels; score retrieved evidence for relevance and coverage, and drafts for support by cited sources, acknowledgment of uncertainty, and absence of invented facts or actions. Record safety/policy violations separately.
- Score human-assessment recall on cases requiring it; count unnecessary human-assessment recommendations and unnecessary specialist suggestions on routine grounded cases separately. Also check specialist suggestions when documented Tier 2 procedures cannot resolve the issue.
- Measure time to first draft and human review effort (time, edits, and accepted/rejected drafts) against a manual-review baseline using the same synthetic cases; the capstone reviewer is Tier 2. Report sample sizes, disagreements, and results separately by support domain; a small cross-domain probe does not establish general performance. Set acceptance thresholds only after the test set and measurement rubric are agreed.

### Implications

The UI should be workflow-centered and auditable. A support reviewer should see ticket state, five outputs, cited evidence, unresolved facts, rationale, and review controls in one scanning-friendly interface; confidence scores are optional unless calibrated and validated. The capstone reviewer is a Tier 2 engineer.

## 4. Production & Operations Requirements

### Key Insights

- Future production use would require strict data handling because real support tickets could contain PII, secrets, and financial information; this MVP uses synthetic records only.
- Observability must track both software reliability and model behavior: latency, cost, tool calls, retrieval quality, escalation rates, and unsafe-output blocks.
- Prompt and knowledge-base changes should be versioned because support quality can regress when product docs or model instructions change.
- A safe deployment should include audit trails, role-based access control, rate limits, incident response, and fallback to manual support.
- Future cost controls may include token budgets, caching, and retrieval filtering; escalation decision thresholds remain subject to evaluation.

### Deployment Architecture

- Product-level needs: a support ticket review console, simulated ticket and evidence source, approved fictional knowledge, inspectable specialist outputs, audit trail, and evaluation records.
- The SAD and Build phase choose API boundaries, persistence, CrewAI agent count, orchestration pattern, and observability implementation. No live helpdesk, order, payment, inventory, or routing access is part of the MVP.

### Security Considerations

- Enforce least-privilege tool access per agent.
- Redact or minimize sensitive customer data before model calls where feasible.
- Store conversation and decision logs with retention rules.
- Protect against prompt injection from customer text and knowledge-base content.
- Require human approval for irreversible or account-impacting actions.

### Implications

The SAD should account for auditability and tool boundaries even with fictional data. Authentication, PII redaction, and production integrations are future deployment considerations, not a claim that the synthetic MVP handles live customer data.

## 5. Innovation & Differentiation Analysis

### Key Insights

- The proposed design emphasizes inspectable specialist outputs and human review; whether this differentiates it commercially has not been tested.
- Five bounded outputs (classification, knowledge retrieval, sentiment/context analysis, response generation, escalation recommendation) support review without prescribing one agent per output.
- Emerging opportunity exists in agent evaluation: measuring whether AI support behavior remains accurate as prompts, models, and help articles change.
- Future reuse as a deployable support pattern is a hypothesis, not a demonstrated MVP outcome.
- Future expansion can add live integrations, multilingual routing, proactive issue detection, voice support summarization, and customer-health signals.

### Proposed Product Attributes (Unvalidated)

- Reviewable ticket investigation with five visible specialist outputs and an audit trail; implementation agent count is not prescribed.
- Human review of every draft and escalation recommendation, including routine tickets; Tier 2 performs this review in the capstone.
- Knowledge-grounded response generation with citation and quality checks.
- Evaluation-ready design using synthetic and curated support ticket datasets.
- CrewAI runtime selection aligned with the AAMAD methodology; adaptation to other runtimes is outside MVP scope.
- Five inspectable outputs; comparative advantage over existing products has not been demonstrated.

### Monetization Strategies

These are commercial hypotheses for a potential future product, not capstone requirements or validated buyer preferences:

- Seat-based or usage-based pricing could be explored if interviews establish buyer demand and expected review value.
- Enterprise integrations, governance features, or setup services would require separate discovery and costing; no pricing or ROI claim is supported yet.

### Implications

For the capstone, differentiation should be shown through the demo workflow, not through inflated feature breadth. A polished, auditable queue-to-response workflow will be more credible than many shallow integrations.

## Critical Decision Points

### Go/No-Go Factors

- Go if the MVP can ground responses in a controlled knowledge base.
- Go if escalation rules can be clearly represented and tested.
- Go if stakeholders and QA can review synthetic support cases (including the e-commerce examples) with expected evidence and decision labels.
- No-go for MVP handoff if drafts or referral recommendations bypass human review or the crew performs external actions.
- Production positioning and autonomous actions are outside this capstone; they would need separate evidence, governance, and approval.

### Technical Architecture Choices

- Require five distinct reviewable specialist outputs and evidence-grounded drafts; the SAD decides whether these map to separate CrewAI agents, combined agents, or another orchestration pattern.
- Limit tools to synthetic data and approved knowledge; the SAD chooses implementation boundaries and audit storage.
- CrewAI is already selected as the runtime; do not treat runtime selection as an open product decision.

### Market Positioning

Position the product as a general-purpose Multi-Agent Customer Support Crew that prepares grounded, inspectable specialist outputs for human support teams across service environments. Fictional enterprise e-commerce Tier 2 cases demonstrate the workflow; neither those cases nor broader SaaS research establish an exclusive target market, buyer demand, or competitive advantage.

### Resource Requirements

- Team roles to plan: product/requirements owner, system architect, frontend engineer, backend/agent engineer, QA/eval owner, security reviewer, DevOps owner.
- Schedule and cost are unestimated; confirm staffing, synthetic-data preparation, model usage, evaluation effort, and hosting before setting a timeline or budget. Paid helpdesk APIs are outside MVP scope.

## Risk Assessment Matrix

| Risk Level | Risk | Impact | Mitigation |
| :-- | :-- | :-- | :-- |
| High | Hallucinated or policy-incorrect customer response | Misleading draft or recommendation | Approved-knowledge grounding, citations, explicit unknowns, human review of every draft (Tier 2 in the demo) |
| High | Sensitive data leakage through prompts or logs | Legal, privacy, and security exposure | PII minimization, redaction, access control, retention limits, secure logging |
| High | Prompt injection through customer messages or knowledge content | Agent manipulation or unsafe tool use | Input isolation, tool allowlists, instruction hierarchy, output validation |
| Medium | Poor classification or routing accuracy | Slower resolution and support-team frustration | Golden dataset, confusion-matrix tracking, fallback routing |
| Medium | Weak knowledge-base quality | Inaccurate answers and low adoption | Source curation, freshness metadata, article-gap reporting |
| Medium | Cost growth from high model usage | Budget overruns | Token budgets, caching, cheaper model tiers for low-risk classification |
| Medium | User distrust of automation | Low adoption | Explainability, editable drafts, visible citations, feedback capture |
| Low | Vendor/runtime lock-in in any future product | Migration friction | Revisit portability if reuse beyond the CrewAI capstone becomes a requirement |
| Low | Demo data lacks realism | Inflated evaluation results | Include messy, ambiguous, and adversarial sample tickets |

## Actionable Recommendations

### Immediate Next Steps Within 48 Hours

- Confirm whether later commercialization research is needed; the general product is demonstrated through synthetic enterprise e-commerce Tier 2 cases.
- Review synthetic customer/dealer tickets and approved fictional evidence with stakeholders and QA; determine sample size and case balance rather than assuming a target count.
- Agree on expected classifications, evidence, drafts, human-assessment decisions, and specialist-referral labels before setting numeric thresholds.

### Short-Term Priorities For Next 30 Days

- Align PRD and SAD with the general product scope, e-commerce demonstration, human review, and no-action boundary once those artifacts are available.
- Define five output contracts, human review handoff, and general escalation principles without assuming five agents or imposing payment-specific rules on other domains.
- Build a narrow ticket review console and mock ticket source.
- Implement a golden-dataset evaluation suite for classification, retrieval relevance, response quality, safety, and escalation behavior.

### Long-Term Strategy For 6-12 Months

- Consider production helpdesk integrations if a later product discovery effort establishes a need; no provider is selected for the MVP.
- Investigate customer-facing or production workflow automation only as a separately approved future scope, never as a current MVP capability.
- Add multilingual support, manager analytics, and knowledge-base gap detection.
- Formalize compliance posture for target industries.
- Track model and prompt changes through regression evals before release.

## Sources

1. Gartner, 2022 conversational-AI forecast, legacy URL unavailable at review; not used as verified evidence, https://www.gartner.com/en/newsroom/press-releases/2022-08-31-gartner-says-conversational-ai-will-reduce-contact-center-agent-labor-costs-by-80-billion-in-2026
2. McKinsey Global Institute, "The economic potential of generative AI: The next productivity frontier," 2023; report page inaccessible at review, https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier
3. Salesforce, "State of Service" landing page, current page accessed for its vendor-reported headline; study edition/methodology not checked, https://www.salesforce.com/resources/research-reports/state-of-service/
4. Zendesk, "Customer Experience Trends" landing page, redirects to a rolling site; edition not checked, https://www.zendesk.com/customer-experience-trends/
5. Intercom, customer service AI research and reports, 2024, https://www.intercom.com/customer-service-trends
6. IBM, "Cost of a Data Breach" rolling report page (served 2026 edition at review); not used as 2024 evidence, https://www.ibm.com/reports/data-breach
7. NIST, "Artificial Intelligence Risk Management Framework (AI RMF 1.0)," 2023, https://www.nist.gov/itl/ai-risk-management-framework
8. OWASP, "Top 10 for Large Language Model Applications," 2025, https://owasp.org/www-project-top-10-for-large-language-model-applications/
9. Microsoft Azure Architecture Center, chatbot and AI application architecture guidance, https://learn.microsoft.com/azure/architecture/
10. OpenAI Platform Documentation, retrieval and tool-use guidance, https://platform.openai.com/docs
11. Anthropic Documentation, tool use and safety guidance, https://docs.anthropic.com/
12. CrewAI Documentation, multi-agent orchestration concepts, https://docs.crewai.com/
13. Zendesk product documentation, AI agents and automation, https://www.zendesk.com/service/ai/
14. Intercom product documentation, Fin AI Agent, https://www.intercom.com/fin
15. Freshworks product documentation, Freddy AI, https://www.freshworks.com/freddy-ai/
16. Salesforce product documentation, Service Cloud Einstein and Agentforce service capabilities, https://www.salesforce.com/service/
17. HubSpot product documentation, service and AI customer support capabilities, https://www.hubspot.com/products/service
18. Help Scout research and customer service resources, https://www.helpscout.com/customer-service/

## Assumptions

- The capstone is an educational MVP, not an immediate production deployment.
- The simulated support review queue is the proposed starting state for evaluation; the exact ticket fields, available records, and approval UI await stakeholder review. Tier 2 handling is specific to the e-commerce demonstration.
- No buyer demand, market size, relative advantage, willingness to pay, or ROI has been validated for the general support crew. The cited support-AI research is background only.
- Commercial or production positioning would require current, edition-specific research, buyer interviews, pricing work, and real-world validation.

## Open Questions

- Which synthetic cases and approved policy excerpts will be included for each e-commerce demonstration scenario, and which non-e-commerce support domain and cases will probe broader applicability?
- What synthetic ticket fields and record types will be available at intake, and how will support reviewers (Tier 2 in the demo) record decisions and review effort?
- Which CrewAI orchestration pattern and agent boundaries should the SAD/Build phase choose for the five outputs?
- Which simulated ticket presentation and review controls are needed for the capstone? No live channel integration is in MVP scope.
- What minimum acceptance thresholds for classification, human-assessment recall, unnecessary recommendations, and draft quality will stakeholders and QA agree to after reviewing the synthetic cases and baseline?
- If the work moves beyond fictional data, what privacy, security, and compliance constraints would apply to live records?
- Should inaccessible or rolling research references be replaced with edition-specific reports before external publication?

## Audit

- Timestamp: 2026-10-24
- Persona id: `product-mgr`
- Action: `revise-mrd`
- Artifact path: `project-context/1.define/mrd.md`
- Resolved `AAMAD_TARGET_RUNTIME`: `crewai`
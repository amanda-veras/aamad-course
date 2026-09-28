# Product Requirements Document: Capstone Project Multi-Agent Customer Support Crew

## 1. Executive Summary

### Problem Statement

Customer support teams for SaaS and digital-service products face rising ticket volume, pressure for fast response times, and growing expectations for accurate, empathetic, personalized service. Repetitive requests such as account access, billing clarification, onboarding help, basic troubleshooting, and policy questions consume support capacity that could otherwise be spent on complex customer issues.

Existing AI support products reduce some workload, but many operate as opaque chatbot or helpdesk features. They often hide the reasoning behind classification, retrieved evidence, response drafting, policy checks, and escalation decisions. This creates adoption friction for support agents and managers who need to trust, audit, and improve AI-assisted support workflows.

The target market for this capstone is small-to-midmarket SaaS and digital-service support teams with existing help-center content and measurable support KPIs. For capstone scope, the product will simulate this environment with representative tickets, a controlled knowledge base, and a human review console.

### Solution Overview

The Capstone Project Multi-Agent Customer Support Crew is a CrewAI-based support operations assistant that processes incoming support tickets through specialist agents. The system will classify ticket intent and urgency, retrieve relevant knowledge, draft a customer response, evaluate the draft for quality and safety, and recommend either human approval or escalation.

The product's differentiator is transparent multi-agent collaboration. Instead of presenting only a final chatbot answer, the system shows the support user each agent's contribution: triage label, confidence, retrieved source evidence, drafted response, policy review, escalation rationale, and recommended next action.

Expected MVP outcomes include faster first draft response, improved triage consistency, reduced manual knowledge lookup, better escalation hygiene, and a repeatable evaluation framework for agent behavior.

### Strategic Rationale

A multi-agent architecture is appropriate because customer support work naturally separates into distinct responsibilities: intake normalization, intent triage, evidence retrieval, response drafting, policy checking, and supervisor routing. Separating these responsibilities improves observability, makes failures easier to diagnose, and supports human review.

The selected runtime is `crewai`, which fits the capstone because the product needs explicit role-based agents, task orchestration, bounded tools, and readable handoff artifacts. CrewAI should be treated as the Phase 2 runtime constraint, not as the product's entire value proposition.

Market timing is favorable because generative AI adoption in service operations is accelerating, while support organizations still need trustworthy human-in-the-loop automation rather than uncontrolled auto-replies.

## 2. Market Context & User Analysis

### Target Market / Users

Primary target segment: SaaS and digital-service support teams handling recurring product, account, billing, and onboarding tickets.

Primary personas:

- Support Agent: Reviews incoming tickets, edits draft responses, resolves routine cases, and escalates complex cases.
- Support Manager: Monitors queue health, ticket categories, escalation quality, policy adherence, and recurring knowledge gaps.
- Customer Success Lead: Uses support insights to identify churn risks, onboarding friction, and product education needs.
- Technical Support Specialist: Handles escalated troubleshooting cases that require deeper product or system knowledge.
- Product/Operations Stakeholder: Reviews trends, recurring complaints, and knowledge-base improvement opportunities.

Geographic focus for MVP: N/A. The capstone should be English-language and region-neutral unless stakeholders later specify a deployment region or compliance regime.

### User Needs Analysis

Critical pain points:

- Support agents spend too much time reading, categorizing, and summarizing repetitive tickets.
- Agents must search help articles and policies manually before responding.
- Managers lack clear visibility into why AI systems choose escalation or draft a given answer.
- Incorrect automated answers can damage customer trust and increase follow-up volume.
- Sensitive categories such as billing, account access, refunds, legal concerns, and security incidents require controlled human approval.

Core user journey:

1. A customer ticket enters the simulated support queue.
2. The support user opens the ticket review console.
3. The CrewAI support crew analyzes the ticket and returns structured agent outputs.
4. The user reviews intent, urgency, sentiment, retrieved evidence, draft response, quality checks, and escalation recommendation.
5. The user approves, edits, rejects, regenerates, or escalates the response.
6. The system stores the decision, agent outputs, and final status for audit and evaluation.

Adoption barriers:

- Low trust in AI-generated support content.
- Concern about hallucinated answers or stale knowledge.
- Fear that automation will bypass human judgment.
- Lack of clear metrics proving time savings and quality gains.

Success factors:

- Visible source evidence for every drafted answer.
- Clear confidence and risk signals.
- Human approval for sensitive or low-confidence cases.
- Simple queue-based workflow that resembles real support operations.
- Evaluation dataset that makes quality measurable.

### Competitive Landscape

Existing alternatives include enterprise CRM/service platforms, helpdesk AI suites, generic chatbot builders, contact-center AI, and open-source agent frameworks.

Key limitations identified in the MRD:

- Enterprise platforms can be powerful but expensive and configuration-heavy.
- Helpdesk AI suites are often tied to proprietary ecosystems and paid tiers.
- Chatbot builders can be conversation-centric rather than support-operations-centric.
- Contact-center AI tools can be too broad for a focused MVP and assume mature enterprise infrastructure.
- Open-source agent frameworks provide flexibility but require careful product, evaluation, guardrail, and UI design.

Differentiation opportunity: build a narrow, auditable, CrewAI-based support crew that exposes specialist agent work products and keeps human review central.

## 3. Technical Requirements & Architecture

### Runtime & Agent Specifications

Selected runtime: `crewai`.

Recommended MVP orchestration: sequential CrewAI workflow with explicit task outputs and a final supervisor decision. The System Architect may later evaluate hierarchical or flow-based orchestration if the workflow needs conditional branching beyond MVP scope.

Required collaboration pattern:

1. Intake Agent receives and normalizes the ticket.
2. Triage Agent classifies intent, urgency, sentiment, and risk category.
3. Knowledge Agent retrieves relevant source material from the controlled knowledge base.
4. Response Agent drafts a customer-facing response using retrieved evidence.
5. QA/Policy Agent checks the draft for correctness, tone, policy fit, unsupported claims, and escalation triggers.
6. Supervisor Agent recommends approve, edit, regenerate, or escalate.

Delegation boundaries:

- Agents must not perform account-changing actions in MVP.
- Agents must not invent product policy or cite sources that were not retrieved.
- The Response Agent must use Knowledge Agent outputs for product-specific claims.
- QA/Policy Agent must flag low-confidence, high-risk, or unsupported responses.
- Supervisor Agent must route sensitive cases to human approval.

### Core Agent Definitions

#### Agent: intake_agent

- role: "Customer support intake specialist"
- goal: "Normalize incoming tickets into structured support records."
- tools: ticket parser, metadata extractor, PII redaction helper.
- runtime notes: CrewAI agent with no delegation; output must include normalized subject, customer message, detected entities, and redaction flags.

#### Agent: triage_agent

- role: "Support triage analyst"
- goal: "Classify support tickets by intent, urgency, sentiment, and escalation risk."
- tools: classification schema, routing rules, ticket history lookup when available.
- runtime notes: CrewAI agent with bounded categories; output must include label, confidence, rationale, and recommended queue.

#### Agent: knowledge_agent

- role: "Knowledge retrieval specialist"
- goal: "Find relevant help articles, policy snippets, and resolved-case examples for the ticket."
- tools: knowledge-base search, policy search, source citation formatter.
- runtime notes: CrewAI agent with retrieval-only authority; output must include source IDs, snippets, and relevance scores.

#### Agent: response_agent

- role: "Customer response drafter"
- goal: "Draft a concise, empathetic, source-grounded response for human review."
- tools: response template library, tone guide, retrieved evidence from Knowledge Agent.
- runtime notes: CrewAI agent must cite retrieved source IDs internally and avoid unsupported claims.

#### Agent: qa_policy_agent

- role: "Support quality and policy reviewer"
- goal: "Evaluate draft responses for accuracy, tone, safety, policy compliance, and escalation needs."
- tools: policy checklist, escalation rules, hallucination-risk checklist.
- runtime notes: CrewAI agent must return pass/fail flags, issue list, and suggested fixes.

#### Agent: supervisor_agent

- role: "Support workflow supervisor"
- goal: "Recommend the final workflow action based on all prior agent outputs."
- tools: approval policy, escalation routing matrix, audit event writer.
- runtime notes: CrewAI agent should produce a final recommendation: approve, edit, regenerate, or escalate.

### Integration Requirements

MVP integrations:

- Simulated ticket source using seeded support tickets.
- Local or lightweight persisted ticket store.
- Controlled markdown/JSON knowledge base for help articles and policies.
- Backend endpoint or service boundary to trigger CrewAI workflow execution.
- Frontend review console for human support users.

Deferred production integrations:

- Zendesk, Intercom, Freshdesk, Salesforce Service Cloud, HubSpot Service Hub, Slack, and email ingestion.
- SSO and enterprise identity provider integration.
- Production vector database or managed retrieval service.
- Customer/account data APIs with strict authorization.

Authentication and security requirements:

- MVP may use mock user identity, but architecture must preserve an authentication boundary.
- Agent outputs and user decisions must be stored with timestamps.
- Sensitive fields must be redacted or flagged before model calls when feasible.
- Irreversible account, billing, legal, or security actions are out of MVP scope.

Performance and scalability targets:

- Generate complete agent analysis for a ticket within 30 seconds for MVP demo conditions.
- Support at least 25 seeded tickets in the demo dataset.
- Support one active reviewer session for MVP; document path to multi-user support as future work.

### Infrastructure Specifications

MVP hosting requirements:

- Local development environment suitable for capstone demonstration.
- Backend process capable of invoking CrewAI workflows.
- Frontend served locally or through a lightweight web application framework.
- File-based or lightweight database persistence acceptable for MVP.

Monitoring and logging requirements:

- Log each ticket workflow run, agent output, confidence score, escalation reason, and human decision.
- Record prompt/model/runtime version metadata where feasible.
- Capture failure states for retrieval misses, agent execution errors, timeout, and invalid outputs.
- Provide basic run summaries for QA and demonstration.

## 4. Functional Requirements

### Core Features (P0)

#### P0-1: Ticket Intake Queue

User story: As a support agent, I want to view a queue of incoming support tickets so that I can choose a ticket for AI-assisted review.

Acceptance criteria:

- The system displays seeded tickets with customer name or anonymized identifier, subject, status, category if known, and received timestamp.
- The user can select a ticket and view the full customer message.
- Tickets can move through statuses: new, analyzing, ready for review, approved, escalated, rejected.

#### P0-2: Multi-Agent Ticket Analysis

User story: As a support agent, I want the support crew to analyze a ticket so that I can understand its category, urgency, sentiment, and likely next action.

Acceptance criteria:

- The user can trigger analysis for a selected ticket.
- The system runs the CrewAI workflow and returns outputs from each required MVP agent.
- The triage output includes intent, urgency, sentiment, confidence, and rationale.
- Analysis failure produces a clear error state and does not erase the ticket.

#### P0-3: Knowledge-Grounded Evidence Retrieval

User story: As a support agent, I want to see the sources used for a draft response so that I can verify the answer before sending it.

Acceptance criteria:

- Knowledge Agent returns at least one relevant source for tickets with known knowledge coverage.
- Each source includes title, source ID, snippet, and relevance explanation.
- The Response Agent must not make product-specific claims without retrieved evidence.
- Tickets without sufficient evidence are flagged for escalation or manual review.

#### P0-4: Draft Response Generation

User story: As a support agent, I want a draft response that is empathetic and grounded in approved knowledge so that I can respond faster.

Acceptance criteria:

- The draft response directly addresses the customer's issue.
- The draft uses a professional, helpful tone.
- The draft avoids unsupported promises, invented policies, and irreversible actions.
- The draft is editable before approval.

#### P0-5: QA and Policy Review

User story: As a support manager, I want AI-generated responses checked before approval so that risky or incorrect messages are caught.

Acceptance criteria:

- QA/Policy Agent checks tone, completeness, grounding, policy risk, and escalation triggers.
- The system displays pass/fail flags and reasons.
- High-risk categories require human approval and cannot be auto-approved.
- The system recommends edits or escalation when checks fail.

#### P0-6: Human Review and Final Action

User story: As a support agent, I want to approve, edit, reject, regenerate, or escalate a draft so that I remain in control of customer communication.

Acceptance criteria:

- The user can approve a draft response.
- The user can edit the draft before approval.
- The user can reject or request regeneration with a reason.
- The user can escalate the ticket with an escalation note.
- The final user action is recorded in the audit log.

#### P0-7: Audit Trail

User story: As a support manager, I want a ticket-level audit trail so that I can review what the agents recommended and what the human decided.

Acceptance criteria:

- The audit trail includes ticket ID, timestamps, agent outputs, selected sources, risk flags, final recommendation, and human action.
- The audit view is accessible from the ticket detail screen.
- The system preserves previous outputs after a final action.

### Enhanced Features (P1)

- Regenerate draft response with user-provided guidance.
- Manager dashboard showing ticket category distribution, escalation rate, average review time, and accepted-draft rate.
- Knowledge-base gap detection for tickets with poor retrieval results.
- Bulk analysis for multiple queued tickets.
- Feedback capture on draft usefulness and source relevance.

### Future Features (P2)

- Live Zendesk, Intercom, Freshdesk, Salesforce, HubSpot, Slack, or email integration.
- Customer-facing auto-send for low-risk, high-confidence categories.
- Multilingual ticket classification and response drafting.
- Voice call transcript summarization.
- Customer account data lookup with secure authorization.
- Advanced analytics for churn risk and product feedback trends.
- Production-grade SSO, RBAC, retention policy, and compliance reporting.

## 5. Non-Functional Requirements

### Performance Requirements

- Complete MVP ticket analysis in 30 seconds or less for typical seeded tickets under local demo conditions.
- Render ticket queue interactions within 1 second after data is available.
- Preserve visible progress state while CrewAI analysis is running.
- Avoid duplicate workflow execution when users click analysis repeatedly.

### Security & Compliance

- Treat support tickets as potentially sensitive data.
- Redact or flag likely PII before model invocation where feasible.
- Do not store API keys, model credentials, or secrets in source-controlled files.
- Keep agent tools least-privileged and role-specific.
- Require human approval for billing, refund, legal, security, account-access, and highly dissatisfied customer scenarios.
- Include prompt-injection defensive requirements in architecture and QA planning.

### Scalability & Reliability

- MVP can run as a single-user local demo, but boundaries must allow later separation of frontend, backend, agent runtime, and storage.
- Workflow failures must be recoverable at the ticket level.
- Retrieval failure must route to human review rather than produce unsupported answers.
- Logs should make failed agent steps diagnosable.

### Data Requirements

- Seed dataset must include at least 25 support tickets.
- Dataset should include routine, ambiguous, high-risk, low-confidence, and adversarial/prompt-injection-like examples.
- Knowledge base must include help articles, policies, and at least a small set of resolved-case examples.
- Each ticket should have expected labels for intent, urgency, escalation requirement, and ideal response characteristics.

## 6. User Experience Design

### Interface Requirements

- Primary interface: support operations console, not a marketing landing page.
- Required views: ticket queue, ticket detail, agent analysis panel, draft response editor, source evidence panel, QA/policy checklist, audit trail.
- Layout should support fast scanning by support agents.
- The UI must clearly distinguish AI-generated content from human-edited content.
- The UI must be usable on desktop; mobile responsiveness is preferred but not required for MVP unless selected by stakeholders.

### Agent Interaction Design

- The user should see each agent's result as a separate structured output.
- Confidence and risk signals must be visible near the recommendation they affect.
- Retrieved evidence should be shown next to or near the draft response.
- The final action must always be a human-controlled decision in MVP.
- Error messages should explain whether the failure came from ticket parsing, retrieval, response generation, QA, or orchestration.

### Accessibility and Usability

- Use semantic headings, labels, and keyboard-accessible controls.
- Maintain readable contrast for ticket status, risk, and confidence indicators.
- Avoid relying only on color to communicate risk or status.
- Preserve draft edits during routine UI navigation.

## 7. Success Metrics & KPIs

### Business / Operational Metrics

- Reduce time to first draft response versus manual drafting in demo evaluation.
- Achieve at least 80% correct intent classification on the MVP golden dataset.
- Achieve at least 90% recall for tickets that require escalation in the MVP golden dataset.
- Achieve at least 70% draft acceptance with minor or no edits on routine seeded tickets.
- Identify knowledge gaps for tickets without sufficient evidence.

### Technical Metrics

- CrewAI workflow completion rate of at least 95% on seeded demo tickets.
- Typical analysis latency of 30 seconds or less per ticket under demo conditions.
- Zero unsupported product-policy claims in QA-reviewed accepted responses.
- Audit log generated for 100% of completed ticket analyses.
- Retrieval returns relevant evidence for at least 80% of covered knowledge-base scenarios.

### User Experience Metrics

- Support user can review and take final action on a ticket from one primary screen.
- Support user can identify source evidence for a draft within 10 seconds during usability review.
- Support user can understand why escalation was recommended without inspecting raw logs.
- Draft editor supports approve, edit, reject, regenerate, and escalate actions without losing context.

## 8. Implementation Strategy

### Development Phases

Phase 1 (Define):

- Complete MRD.
- Complete PRD.
- Generate MVP user stories.
- Hand off to System Architect for SAD/SFS.

Phase 2 (Build):

- Project Manager scaffolds selected stack and CrewAI runtime conventions.
- Backend Engineer builds ticket API, knowledge access, persistence, and CrewAI workflow service.
- Frontend Engineer builds support operations console.
- Integration Engineer connects frontend, backend, and agent outputs.
- QA Engineer creates golden dataset tests, unit tests, and integration checks.
- Security Engineer reviews prompt injection, data handling, tool permissions, and secret management.

Phase 3 (Deliver):

- DevOps Engineer packages local/demo deployment instructions.
- Produce runbook, environment setup, and user guide.
- Document known limitations and production hardening requirements.

### Resource Requirements

- Product owner: Define workflow, success metrics, scope control.
- System architect: CrewAI orchestration, data boundaries, deployment model.
- Backend/agent engineer: CrewAI implementation, tools, APIs, persistence.
- Frontend engineer: Ticket review console and agent output UX.
- QA/evaluation owner: Golden dataset and regression evaluation.
- Security reviewer: Prompt injection, PII, access control, and auditability.
- DevOps owner: Packaging, environment setup, and delivery docs.

### Risk Mitigation

- Hallucination risk: require retrieval grounding, source display, and QA checks.
- Sensitive data risk: redact/flag PII and prevent account-changing actions.
- Scope risk: keep MVP to simulated tickets and controlled knowledge base.
- Adoption risk: emphasize human approval, editable drafts, and visible rationale.
- Runtime risk: keep agent contracts and product requirements portable even though CrewAI is selected for implementation.

## 9. Launch & Go-to-Market Strategy

This section is limited because the capstone is assumed to be an educational MVP, not an immediate commercial launch.

Recommended capstone launch plan:

- Demonstrate a realistic ticket queue with routine, complex, and high-risk tickets.
- Show end-to-end CrewAI workflow execution with visible specialist outputs.
- Present before/after comparison of manual support review versus AI-assisted review.
- Report golden-dataset results for classification, escalation, retrieval relevance, and response quality.
- Document production hardening gaps before any real customer-data deployment.

Potential commercial positioning if continued after capstone:

- AI support co-pilot for SaaS teams that need transparent automation and human approval.
- Differentiated from chatbot-only systems by exposing the specialist-agent workflow and audit trail.
- Initial wedge: support teams with strong knowledge-base content but limited automation engineering capacity.

## Quality Assurance Checklist

- [x] Requirements traceable to MRD, system description, or recorded Assumptions.
- [x] Technical specifications feasible with the selected runtime adapter.
- [x] Success metrics aligned with stated objectives.
- [x] MVP vs Future Work boundaries explicit.
- [x] Market sections marked N/A where appropriate for educational capstone constraints.

## Sources

- `project-context/1.define/mrd.md`
- Product Manager persona instructions in `.cursor/agents/product-mgr.md`
- MRD sources: Gartner customer service AI research; McKinsey generative AI productivity research; Salesforce State of Service; Zendesk CX Trends; Intercom customer service AI reporting; IBM Cost of a Data Breach; NIST AI RMF; OWASP Top 10 for LLM Applications; Microsoft Azure Architecture Center; OpenAI, Anthropic, and CrewAI documentation.

## Assumptions

- No separate `project-context/1.define/system-description.md` existed at PRD creation time; this PRD is derived from the MRD and recorded assumptions.
- The capstone is educational and demo-oriented, not an immediate production rollout.
- The target support domain is a mixed SaaS support queue until stakeholders choose a narrower domain.
- MVP uses simulated tickets and a controlled knowledge base rather than live helpdesk/customer integrations.
- MVP final customer communication requires human approval.
- `AAMAD_TARGET_RUNTIME` is resolved as `crewai`.
- Success thresholds are initial Product Manager targets and should be confirmed by QA and stakeholders.

## Open Questions

- Which exact support domain should the MVP emphasize: billing, technical support, onboarding, account access, refunds, or mixed queue?
- Which frontend/backend stack should Build phase use?
- Should the MVP include regenerate-with-instructions as P0 or P1?
- What model provider and embedding/retrieval approach should be used with CrewAI?
- What is the minimum required size and format for the golden dataset?
- Are there course-specific rubric requirements that should be added as acceptance criteria?
- Should the System Architect choose sequential CrewAI workflow for MVP or evaluate hierarchical/flow-based orchestration?

## Audit

- Timestamp: 2026-09-27
- Persona id: `product-mgr`
- Action: `create-prd`
- Artifact path: `project-context/1.define/prd.md`
- Resolved `AAMAD_TARGET_RUNTIME`: `crewai`
from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

import yaml

from .fixtures import APPROVED_KNOWLEDGE, record_references
from .models import (
    ClassificationOutput,
    EscalationOutput,
    KnowledgeMatch,
    KnowledgeOutput,
    OutputEnvelope,
    ResponseOutput,
    SentimentContextOutput,
    Ticket,
)

CONFIG_DIR = Path(__file__).with_name("config")
CREWAI_MODEL = "mock/fixture-envelope-v1"
STAGE_ORDER = ("t1a", "t1b", "t2", "t3a", "t3b")
MODEL_TASKS = {
    "t1a": ClassificationOutput,
    "t1b": SentimentContextOutput,
    "t3a": ResponseOutput,
    "t3b": EscalationOutput,
}


def load_task_config() -> dict[str, Any]:
    with (CONFIG_DIR / "agents.yaml").open(encoding="utf-8") as handle:
        agents = yaml.safe_load(handle)
    with (CONFIG_DIR / "tasks.yaml").open(encoding="utf-8") as handle:
        tasks = yaml.safe_load(handle)
    if any(agent.get("allow_delegation") is not False for agent in agents.values()):
        raise ValueError("CrewAI agent delegation must be disabled")
    if any(agent.get("memory") is not False for agent in agents.values()):
        raise ValueError("CrewAI agent memory must be disabled")
    if len(tasks) != 4:
        raise ValueError("CrewAI config must define exactly four LLM-backed tasks")
    return tasks


def _envelope(ticket: Ticket, run_id: str, output_type: str, **fields: Any) -> dict:
    return {
        "ticket_id": ticket.id,
        "run_id": run_id,
        "output_type": output_type,
        **fields,
    }


class LocalMockTaskRunner:
    """Deterministic, in-process CrewAI adapter test double; it makes no model calls."""

    def __init__(self, overrides: dict[str, Callable[..., OutputEnvelope]] | None = None):
        self.task_config = load_task_config()
        self.overrides = overrides or {}
        self.calls: list[str] = []

    def run(
        self,
        stage: str,
        ticket: Ticket,
        run_id: str,
        contexts: dict[str, OutputEnvelope],
        reviewer_note: str | None = None,
    ) -> OutputEnvelope:
        self.calls.append(stage)
        override = self.overrides.get(stage)
        if override is not None:
            return override(
                ticket=ticket, run_id=run_id, contexts=contexts, reviewer_note=reviewer_note
            )
        refs = record_references(ticket)
        gaps = list(ticket.gaps)

        if stage == "t1a":
            conflict = bool(ticket.gaps) or "charged twice" in ticket.text.lower()
            return ClassificationOutput(
                **_envelope(
                    ticket,
                    run_id,
                    "classification",
                    status="limited" if conflict else "complete",
                    issue_label="possible duplicate charge" if conflict else "order tracking",
                    priority_label="uncertain" if conflict else "routine",
                    rationale=(
                        "The synthetic payment records conflict or lack reconciliation."
                        if conflict
                        else "The ticket asks how to check an order status."
                    ),
                    detail=(
                        "Possible duplicate charge · priority uncertain"
                        if conflict
                        else "Order status question · routine"
                    ),
                    evidence_refs=[f"ticket:{ticket.id}"],
                    missing_facts=gaps,
                    conflicting_facts=["Payment records disagree"] if conflict else [],
                )
            )
        if stage == "t1b":
            concerned = "charged twice" in ticket.text.lower()
            return SentimentContextOutput(
                **_envelope(
                    ticket,
                    run_id,
                    "sentiment_context",
                    status="complete",
                    tone="concerned" if concerned else "neutral",
                    impact_context="possible billing impact" if concerned else "status inquiry",
                    rationale="Tone and impact are described separately from decision advice.",
                    detail=(
                        "Concerned tone; possible billing impact"
                        if concerned
                        else "Neutral tone; status inquiry"
                    ),
                    evidence_refs=[f"ticket:{ticket.id}"],
                    missing_facts=[],
                    conflicting_facts=[],
                )
            )
        if stage == "t3a":
            knowledge = contexts["knowledge"]
            assert isinstance(knowledge, KnowledgeOutput)
            order_passage = next(
                (item for item in knowledge.matches if item.source_id == "TRACK-01"), None
            )
            if order_passage is not None:
                claim_ref = order_passage.evidence_ref
                return ResponseOutput(
                    **_envelope(
                        ticket,
                        run_id,
                        "response",
                        status="complete",
                        draft_text=(
                            "You can check your order's current status in the customer portal. "
                            f"[{claim_ref}]"
                        ),
                        cannot_answer_reason=None,
                        claim_refs=[claim_ref],
                        rationale="The draft's process claim is supported by the approved passage.",
                        detail=(
                            "You can check your order's current status in the customer portal. "
                            f"[{claim_ref}]"
                        ),
                        evidence_refs=[claim_ref],
                        missing_facts=[],
                        conflicting_facts=[],
                    )
                )
            refs.discard(f"ticket:{ticket.id}")
            refs.update(
                ref for ref in record_references(ticket) if not ref.startswith("ticket:")
            )
            return ResponseOutput(
                **_envelope(
                    ticket,
                    run_id,
                    "response",
                    status="limited",
                    draft_text=None,
                    cannot_answer_reason=(
                        "No applicable approved source or verified reconciliation is available."
                    ),
                    claim_refs=[],
                    rationale="No approved passage supports a reliable answer.",
                    detail=(
                        "Cannot confirm a duplicate charge from these records. "
                        "A reviewer should verify the payment history before drafting an answer."
                    ),
                    evidence_refs=sorted(refs),
                    missing_facts=gaps or ["Applicable approved knowledge"],
                    conflicting_facts=["Payment records disagree"] if gaps else [],
                )
            )
        if stage == "t3b":
            conflict = bool(ticket.gaps) or "charged twice" in ticket.text.lower()
            return EscalationOutput(
                **_envelope(
                    ticket,
                    run_id,
                    "escalation",
                    status="limited" if conflict else "complete",
                    human_assessment_recommended=conflict,
                    assessment_reason=(
                        "A reviewer should verify the unresolved or conflicting evidence."
                        if conflict
                        else "No material discrepancy or evidence gap is present."
                    ),
                    specialist_referral_suggested=False,
                    referral_reason=(
                        "No approved procedure or evidence establishes a specialist-only issue."
                    ),
                    proposed_specialist=None,
                    rationale="Assessment and specialist referral are separate decisions.",
                    detail=(
                        "Human assessment: recommended (evidence gap). "
                        "Specialist referral: not established."
                        if conflict
                        else "Human assessment: not suggested. Specialist referral: not suggested."
                    ),
                    evidence_refs=sorted(refs),
                    missing_facts=gaps,
                    conflicting_facts=["Payment records disagree"] if conflict else [],
                )
            )
        raise ValueError(f"Unknown model task stage: {stage}")


def lookup_approved_knowledge(ticket: Ticket) -> list[KnowledgeMatch]:
    """A coordinator-only allowlisted lookup; model output cannot choose source IDs."""
    query = f"{ticket.subject} {ticket.text}".lower()
    if "order" in query and ("status" in query or "tracking" in query):
        return [item.model_copy(deep=True) for item in APPROVED_KNOWLEDGE]
    return []

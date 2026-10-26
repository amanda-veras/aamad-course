from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

OutputStatus = Literal["complete", "limited", "failed", "skipped"]
OutputType = Literal[
    "classification", "sentiment_context", "knowledge", "response", "escalation"
]
RunStatus = Literal["analyzing", "ready_for_review", "incomplete", "failed"]


class Ticket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    subject: str
    text: str
    records: list[str]
    gaps: list[str]


class KnowledgeMatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_id: str
    passage_id: str
    version: str
    excerpt: str

    @property
    def evidence_ref(self) -> str:
        return f"knowledge:{self.source_id}/{self.passage_id}/{self.version}"


class OutputEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ticket_id: str
    run_id: str
    output_type: OutputType
    status: OutputStatus
    rationale: str
    evidence_refs: list[str] = Field(default_factory=list)
    missing_facts: list[str] = Field(default_factory=list)
    conflicting_facts: list[str] = Field(default_factory=list)
    error: str | None = None
    detail: str

    @model_validator(mode="after")
    def validate_status_error(self) -> OutputEnvelope:
        if self.status == "failed" and not self.error:
            raise ValueError("failed outputs require an error")
        if self.status != "failed" and self.error:
            raise ValueError("only failed outputs may contain an error")
        return self


class ClassificationOutput(OutputEnvelope):
    output_type: Literal["classification"]
    issue_label: str | None = None
    priority_label: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> ClassificationOutput:
        if self.status in ("complete", "limited") and not (
            self.issue_label and self.priority_label
        ):
            raise ValueError("classification requires issue and priority labels")
        return self


class SentimentContextOutput(OutputEnvelope):
    output_type: Literal["sentiment_context"]
    tone: str | None = None
    impact_context: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> SentimentContextOutput:
        if self.status in ("complete", "limited") and not (
            self.tone and self.impact_context
        ):
            raise ValueError("sentiment_context requires tone and impact_context")
        return self


class KnowledgeOutput(OutputEnvelope):
    output_type: Literal["knowledge"]
    matches: list[KnowledgeMatch] = Field(default_factory=list)
    no_match: bool = False

    @model_validator(mode="after")
    def validate_payload(self) -> KnowledgeOutput:
        if self.status in ("complete", "limited"):
            if self.no_match != (not self.matches):
                raise ValueError("no_match must agree with the returned matches")
            if self.no_match and self.status != "limited":
                raise ValueError("a no-match knowledge result must be limited")
            returned_refs = [match.evidence_ref for match in self.matches]
            if self.evidence_refs != returned_refs:
                raise ValueError("knowledge evidence must come from returned matches")
        return self


class ResponseOutput(OutputEnvelope):
    output_type: Literal["response"]
    draft_text: str | None = None
    cannot_answer_reason: str | None = None
    claim_refs: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_payload(self) -> ResponseOutput:
        if self.status in ("complete", "limited") and not (
            self.draft_text or self.cannot_answer_reason
        ):
            raise ValueError("response requires a draft or cannot-answer reason")
        if self.status == "complete" and self.draft_text and not self.claim_refs:
            raise ValueError("a complete response draft requires cited factual claims")
        if not set(self.claim_refs).issubset(self.evidence_refs):
            raise ValueError("claim references must be included in evidence_refs")
        return self


class EscalationOutput(OutputEnvelope):
    output_type: Literal["escalation"]
    human_assessment_recommended: bool | None = None
    assessment_reason: str | None = None
    specialist_referral_suggested: bool | None = None
    referral_reason: str | None = None
    proposed_specialist: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> EscalationOutput:
        if self.status in ("complete", "limited"):
            fields = (
                self.human_assessment_recommended,
                self.assessment_reason,
                self.specialist_referral_suggested,
                self.referral_reason,
            )
            if any(value is None for value in fields):
                raise ValueError("escalation requires two decisions and their reasons")
            if self.specialist_referral_suggested and not self.evidence_refs:
                raise ValueError("a specialist referral requires cited evidence")
        return self


TaskOutput = Annotated[
    ClassificationOutput
    | SentimentContextOutput
    | KnowledgeOutput
    | ResponseOutput
    | EscalationOutput,
    Field(discriminator="output_type"),
]


class ReviewDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    draft_decision: Literal["approved", "edited", "rejected"]
    referral_decision: Literal["accepted", "rejected", "deferred"]
    reviewer_id: str = Field(min_length=1)
    recorded_at: str


class RunTrace(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    ticket: Ticket
    started_at: str
    status: RunStatus
    outputs: list[dict]
    snapshot: Ticket
    corpus_version: str
    failed_step: str | None = None
    error: str | None = None
    decisions: list[ReviewDecision] = Field(default_factory=list)
    revision_parent_id: str | None = None
    reviewer_note: str | None = None

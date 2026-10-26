from __future__ import annotations

from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .coordinator import Coordinator
from .models import ReviewDecision, RunTrace, Ticket
from .store import TraceStore

ROOT = Path(__file__).resolve().parent
coordinator = Coordinator(TraceStore(ROOT / ".data" / "traces.json"))
app = FastAPI(
    title="Synthetic Multi-Agent Customer Support Crew",
    version="0.1.0",
    description="Local synthetic review API; no outbound or production actions are available.",
)


class DecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    draft_decision: Literal["approved", "edited", "rejected"]
    referral_decision: Literal["accepted", "rejected", "deferred"]
    reviewer_id: str = Field(min_length=1)


class RevisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_note: str


class ApiOutput(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    type: str
    status: str
    detail: str
    rationale: str
    evidence_refs: list[str]
    evidenceRefs: list[str]
    missing_facts: list[str]
    missingFacts: list[str]
    ticket_id: str
    run_id: str
    output_type: str
    conflicting_facts: list[str]
    error: str | None
    claim_refs: list[str] = []


class ApiRun(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    id: str
    ticket: Ticket
    startedAt: str
    status: str
    outputs: list[ApiOutput]
    failedStep: str | None
    error: str | None
    revisionParentId: str | None
    reviewerNote: str | None
    snapshot: Ticket
    corpusVersion: str
    decisions: list[ReviewDecision]


def as_api_run(run: RunTrace) -> ApiRun:
    outputs = []
    for raw in run.outputs:
        payload = dict(raw)
        payload.update(
            type=payload["output_type"],
            evidenceRefs=payload["evidence_refs"],
            missingFacts=payload["missing_facts"],
        )
        outputs.append(ApiOutput.model_validate(payload))
    return ApiRun(
        id=run.id,
        ticket=run.ticket,
        startedAt=run.started_at,
        status=run.status,
        outputs=outputs,
        failedStep=run.failed_step,
        error=run.error,
        revisionParentId=run.revision_parent_id,
        reviewerNote=run.reviewer_note,
        snapshot=run.snapshot,
        corpusVersion=run.corpus_version,
        decisions=run.decisions,
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "runtime": "crewai", "model": "mock/fixture-envelope-v1"}


@app.post("/analyze/{ticket_id}", response_model=ApiRun)
def analyze(ticket_id: str) -> ApiRun:
    try:
        return as_api_run(coordinator.analyze(ticket_id))
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get("/reviews/{run_id}", response_model=ApiRun)
def get_review(run_id: str) -> ApiRun:
    try:
        return as_api_run(coordinator.get_review(run_id))
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/reviews/{run_id}/decisions", response_model=ApiRun)
def record_decision(run_id: str, request: DecisionRequest) -> ApiRun:
    try:
        return as_api_run(
            coordinator.record_decision(
                run_id,
                request.draft_decision,
                request.referral_decision,
                request.reviewer_id,
            )
        )
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/reviews/{run_id}/revisions", response_model=ApiRun)
def request_revision(run_id: str, request: RevisionRequest) -> ApiRun:
    try:
        return as_api_run(coordinator.request_revision(run_id, request.reviewer_note))
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

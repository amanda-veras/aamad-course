from __future__ import annotations

from datetime import UTC, datetime
from typing import Callable
from uuid import uuid4

from .crew import (
    MODEL_TASKS,
    STAGE_ORDER,
    LocalMockTaskRunner,
    lookup_approved_knowledge,
)
from .fixtures import CORPUS_VERSION, record_references, synthetic_ticket
from .fixtures import APPROVED_KNOWLEDGE
from .models import (
    ClassificationOutput,
    EscalationOutput,
    KnowledgeMatch,
    KnowledgeOutput,
    OutputEnvelope,
    ResponseOutput,
    ReviewDecision,
    RunTrace,
    SentimentContextOutput,
    Ticket,
)
from .store import TraceStore

OUTPUT_MODELS = {
    "t1a": ClassificationOutput,
    "t1b": SentimentContextOutput,
    "t2": KnowledgeOutput,
    "t3a": ResponseOutput,
    "t3b": EscalationOutput,
}
OUTPUT_TYPES = {
    "t1a": "classification",
    "t1b": "sentiment_context",
    "t2": "knowledge",
    "t3a": "response",
    "t3b": "escalation",
}


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


class Coordinator:
    def __init__(
        self,
        store: TraceStore,
        runner: LocalMockTaskRunner | None = None,
        knowledge_lookup: Callable[[Ticket], list[KnowledgeMatch]] = lookup_approved_knowledge,
    ):
        self.store = store
        self.runner = runner or LocalMockTaskRunner()
        self.knowledge_lookup = knowledge_lookup

    def analyze(self, ticket_id: str) -> RunTrace:
        ticket = synthetic_ticket(ticket_id)
        return self.analyze_snapshot(ticket)

    def analyze_snapshot(self, ticket: Ticket) -> RunTrace:
        run = RunTrace(
            id=str(uuid4()),
            ticket=ticket.model_copy(deep=True),
            started_at=now_iso(),
            status="analyzing",
            outputs=[],
            snapshot=ticket.model_copy(deep=True),
            corpus_version=CORPUS_VERSION,
        )
        self.store.save(run)
        return self._execute(run, STAGE_ORDER)

    def request_revision(self, run_id: str, reviewer_note: str) -> RunTrace:
        original = self.get_review(run_id)
        if original.status != "ready_for_review":
            raise ValueError("Only a ready_for_review run can be revised")
        if not reviewer_note.strip():
            raise ValueError("A revision request requires a reviewer note")
        reused = [
            output
            for output in original.outputs
            if output["output_type"] in ("classification", "sentiment_context", "knowledge")
        ]
        if len(reused) != 3:
            raise ValueError("Revision source is missing validated prerequisite outputs")
        revision = RunTrace(
            id=str(uuid4()),
            ticket=original.ticket.model_copy(deep=True),
            started_at=now_iso(),
            status="analyzing",
            outputs=[dict(output) for output in reused],
            snapshot=original.snapshot.model_copy(deep=True),
            corpus_version=original.corpus_version,
            revision_parent_id=original.id,
            reviewer_note=reviewer_note,
        )
        self.store.save(revision)
        return self._execute(revision, ("t3a", "t3b"), reviewer_note=reviewer_note)

    def get_review(self, run_id: str) -> RunTrace:
        run = self.store.get(run_id)
        if run is None:
            raise KeyError(f"Review run not found: {run_id}")
        return run

    def record_decision(
        self,
        run_id: str,
        draft_decision: str,
        referral_decision: str,
        reviewer_id: str,
    ) -> RunTrace:
        run = self.get_review(run_id)
        if run.status != "ready_for_review":
            raise ValueError("Decisions can only be recorded for a ready_for_review run")
        decision = ReviewDecision(
            draft_decision=draft_decision,
            referral_decision=referral_decision,
            reviewer_id=reviewer_id,
            recorded_at=now_iso(),
        )
        run.decisions.append(decision)
        self.store.save(run)
        return run

    def _execute(
        self,
        run: RunTrace,
        stages: tuple[str, ...],
        reviewer_note: str | None = None,
    ) -> RunTrace:
        outputs_by_type = {
            output["output_type"]: OUTPUT_MODELS[stage].model_validate(output)
            for stage in ("t1a", "t1b", "t2", "t3a", "t3b")
            for output in run.outputs
            if output["output_type"] == OUTPUT_TYPES[stage]
        }
        for index, stage in enumerate(stages):
            try:
                output = self._run_stage(stage, run, outputs_by_type, reviewer_note)
                output = OUTPUT_MODELS[stage].model_validate(output.model_dump())
                if output.ticket_id != run.snapshot.id or output.run_id != run.id:
                    raise ValueError("Output ticket_id/run_id does not match the active run")
                if output.output_type != OUTPUT_TYPES[stage]:
                    raise ValueError(f"{stage} returned the wrong output_type")
                self._validate_evidence(output, run.snapshot, outputs_by_type)
            except Exception as error:
                failed = self._failed_output(stage, run, error)
                self._persist_output(run, failed, outputs_by_type)
                run.failed_step = stage
                run.error = str(error)
                for dependent in stages[index + 1 :]:
                    skipped = self._skipped_output(dependent, run)
                    self._persist_output(run, skipped, outputs_by_type)
                run.status = "incomplete"
                self.store.save(run)
                return run
            self._persist_output(run, output, outputs_by_type)
        run.status = "ready_for_review"
        self.store.save(run)
        return run

    def _run_stage(
        self,
        stage: str,
        run: RunTrace,
        contexts: dict[str, OutputEnvelope],
        reviewer_note: str | None,
    ) -> OutputEnvelope:
        if stage == "t2":
            matches = self.knowledge_lookup(run.snapshot)
            approved = {
                item.evidence_ref: item.model_dump(mode="json")
                for item in APPROVED_KNOWLEDGE
            }
            if any(
                match.evidence_ref not in approved
                or match.model_dump(mode="json") != approved[match.evidence_ref]
                for match in matches
            ):
                raise ValueError("Coordinator lookup returned a passage outside the approved corpus")
            match_refs = [match.evidence_ref for match in matches]
            return KnowledgeOutput(
                ticket_id=run.snapshot.id,
                run_id=run.id,
                output_type="knowledge",
                status="complete" if matches else "limited",
                matches=matches,
                no_match=not matches,
                rationale=(
                    "Coordinator allowlisted lookup returned approved passages."
                    if matches
                    else "No applicable approved passage was found in the local corpus."
                ),
                detail=(
                    "; ".join(match.excerpt for match in matches)
                    if matches
                    else "No applicable approved passage in this demo"
                ),
                evidence_refs=match_refs,
                missing_facts=[] if matches else ["Applicable approved knowledge"],
                conflicting_facts=[],
            )
        task = stage
        result = self.runner.run(
            task,
            run.snapshot.model_copy(deep=True),
            run.id,
            dict(contexts),
            reviewer_note=reviewer_note,
        )
        expected_model = MODEL_TASKS[stage]
        if not isinstance(result, expected_model):
            raise TypeError(f"{stage} returned {type(result).__name__}, expected {expected_model.__name__}")
        return result

    def _validate_evidence(
        self,
        output: OutputEnvelope,
        ticket: Ticket,
        contexts: dict[str, OutputEnvelope],
    ) -> None:
        allowed = record_references(ticket)
        if output.output_type == "knowledge":
            allowed.update(
                match.evidence_ref for match in output.matches
            )
        else:
            knowledge = contexts.get("knowledge")
            if isinstance(knowledge, KnowledgeOutput):
                allowed.update(knowledge.evidence_refs)
        unknown = set(output.evidence_refs) - allowed
        if unknown:
            raise ValueError(f"Unapproved evidence reference(s): {', '.join(sorted(unknown))}")
        if output.output_type == "knowledge":
            returned = {match.evidence_ref for match in output.matches}
            if set(output.evidence_refs) != returned:
                raise ValueError("Knowledge output cited a passage not returned by coordinator lookup")
        if isinstance(output, ResponseOutput):
            if set(output.claim_refs) - set(output.evidence_refs):
                raise ValueError("Response contains a claim reference outside its evidence")

    def _persist_output(
        self,
        run: RunTrace,
        output: OutputEnvelope,
        outputs_by_type: dict[str, OutputEnvelope],
    ) -> None:
        serialized = output.model_dump(mode="json")
        output_type = serialized["output_type"]
        existing_index = next(
            (i for i, entry in enumerate(run.outputs) if entry["output_type"] == output_type),
            None,
        )
        if existing_index is None:
            run.outputs.append(serialized)
        else:
            run.outputs[existing_index] = serialized
        outputs_by_type[output_type] = output
        self.store.save(run)

    def _failed_output(self, stage: str, run: RunTrace, error: Exception) -> OutputEnvelope:
        model = OUTPUT_MODELS[stage]
        return model(
            ticket_id=run.snapshot.id,
            run_id=run.id,
            output_type=OUTPUT_TYPES[stage],
            status="failed",
            rationale=f"{stage} did not produce a valid output.",
            detail=f"Failed at {stage}",
            evidence_refs=[],
            missing_facts=[],
            conflicting_facts=[],
            error=f"{type(error).__name__}: {error}",
        )

    def _skipped_output(self, stage: str, run: RunTrace) -> OutputEnvelope:
        model = OUTPUT_MODELS[stage]
        return model(
            ticket_id=run.snapshot.id,
            run_id=run.id,
            output_type=OUTPUT_TYPES[stage],
            status="skipped",
            rationale=f"Skipped because prerequisite stage {run.failed_step or 'failure'} failed.",
            detail=f"Skipped after {run.failed_step or 'upstream failure'} failed",
            evidence_refs=[],
            missing_facts=[],
            conflicting_facts=[],
        )

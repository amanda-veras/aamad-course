from __future__ import annotations

from tempfile import TemporaryDirectory
from pathlib import Path

from .coordinator import Coordinator
from .crew import LocalMockTaskRunner
from .store import TraceStore


def main() -> None:
    with TemporaryDirectory() as directory:
        coordinator = Coordinator(TraceStore(Path(directory) / "smoke.json"))
        routine = coordinator.analyze("SYN-101")
        no_match = coordinator.analyze("SYN-102")
        coordinator.record_decision(
            routine.id, "approved", "deferred", "smoke-reviewer"
        )

        def fail_response(**_kwargs):
            raise RuntimeError("smoke fault injection")

        failed = Coordinator(
            TraceStore(Path(directory) / "failed.json"),
            runner=LocalMockTaskRunner(overrides={"t3a": fail_response}),
        ).analyze("SYN-101")
        assert routine.status == "ready_for_review"
        assert no_match.status == "ready_for_review"
        assert failed.status == "incomplete" and failed.failed_step == "t3a"
        print("Smoke passed: routine, knowledge gap, decision-only record, and injected failure.")


if __name__ == "__main__":
    main()

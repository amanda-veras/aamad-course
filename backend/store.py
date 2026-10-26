from __future__ import annotations

import json
import threading
from pathlib import Path

from .models import RunTrace


class TraceStore:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.RLock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    def _read(self) -> dict[str, dict]:
        try:
            value = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise RuntimeError(f"Unable to read local review trace: {error}") from error
        if not isinstance(value, dict):
            raise RuntimeError("Local review trace must contain a JSON object")
        return value

    def _write(self, runs: dict[str, dict]) -> None:
        temporary = self.path.with_suffix(".tmp")
        try:
            temporary.write_text(json.dumps(runs, indent=2), encoding="utf-8")
            temporary.replace(self.path)
        except OSError as error:
            raise RuntimeError(f"Unable to persist local review trace: {error}") from error

    def save(self, run: RunTrace) -> None:
        with self._lock:
            runs = self._read()
            runs[run.id] = run.model_dump(mode="json")
            self._write(runs)

    def get(self, run_id: str) -> RunTrace | None:
        with self._lock:
            value = self._read().get(run_id)
            return RunTrace.model_validate(value) if value is not None else None

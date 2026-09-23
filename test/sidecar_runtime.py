"""Behavior test for the shared Boardstate sidecar lifecycle.

Exercises the public lifecycle seam against the real bundled sidecar: an agent
spawn is recorded as agent-owned, a dashboard caller replaces it, and the board
document survives because both processes use the same state directory.
"""

from __future__ import annotations

import asyncio
import json
import os
import stat
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import boardstate_sidecar as runtime


async def _run() -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-runtime-") as tmp:
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        try:
            first_port, first_nonce = await runtime.ensure_sidecar("agent")
            record_path = Path(tmp) / ".boardstate-sidecar.json"
            first = json.loads(record_path.read_text(encoding="utf-8"))
            assert first["port"] == first_port
            assert first["nonce"] == first_nonce
            assert first["spawned_by"] == "agent"
            assert stat.S_IMODE(record_path.stat().st_mode) == 0o600
            assert runtime.operator_secret() is None

            await runtime.invoke_tool(
                "boardstate_tab_create", {"title": "Persisted", "slug": "persisted"}
            )
            await runtime.invoke_tool(
                "boardstate_widget_add",
                {
                    "tab": "persisted",
                    "id": "kept",
                    "kind": "builtin:markdown",
                    "title": "Kept",
                    "grid": {"x": 0, "y": 0, "w": 6, "h": 3},
                    "props": {"markdown": "still here"},
                },
            )

            second_port, second_nonce = await runtime.ensure_sidecar("dashboard")
            second = json.loads(record_path.read_text(encoding="utf-8"))
            assert second["spawned_by"] == "dashboard"
            assert second["port"] == second_port
            assert second["nonce"] == second_nonce
            assert (second["pid"], second_nonce) != (first["pid"], first_nonce)
            assert runtime.operator_secret()

            workspace = await runtime.invoke_tool("boardstate_workspace_get", {})
            tabs = workspace["doc"]["tabs"]
            persisted = next(tab for tab in tabs if tab["slug"] == "persisted")
            assert any(widget["id"] == "kept" for widget in persisted["widgets"])
        finally:
            runtime.shutdown_owned_sidecar()
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


if __name__ == "__main__":
    asyncio.run(_run())
    print("sidecar runtime: ownership replacement preserves board state")

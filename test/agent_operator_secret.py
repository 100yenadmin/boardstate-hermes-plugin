"""An agent-owned sidecar must not receive the operator secret in its environment."""

from __future__ import annotations

import asyncio
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import boardstate_sidecar as runtime


class _Captured(Exception):
    pass


async def _spawn_env(directory: Path, spawned_by: str) -> dict[str, str]:
    captured: dict[str, str] = {}

    async def fake_exec(*_args, env=None, **_kwargs):
        captured.update(env or {})
        raise _Captured()

    original = runtime.asyncio.create_subprocess_exec
    runtime.asyncio.create_subprocess_exec = fake_exec
    try:
        await runtime._spawn_sidecar(directory, spawned_by)  # type: ignore[arg-type]
    except _Captured:
        pass
    finally:
        runtime.asyncio.create_subprocess_exec = original
    return captured


def main() -> int:
    failures: list[str] = []

    def check(name: str, condition: bool) -> None:
        print(f"{'ok  ' if condition else 'FAIL'} {name}")
        if not condition:
            failures.append(name)

    # An inherited value must not leak through either.
    os.environ["BOARDSTATE_OPERATOR_SECRET"] = "inherited-secret-value"
    with tempfile.TemporaryDirectory() as tmp:
        directory = Path(tmp)
        agent_env = asyncio.run(_spawn_env(directory, "agent"))
        dashboard_env = asyncio.run(_spawn_env(directory, "dashboard"))
    check("agent spawn captured an environment", bool(agent_env))
    check("agent-owned sidecar gets no operator secret", "BOARDSTATE_OPERATOR_SECRET" not in agent_env)
    check(
        "dashboard-owned sidecar gets a fresh operator secret",
        len(dashboard_env.get("BOARDSTATE_OPERATOR_SECRET", "")) >= 32
        and dashboard_env.get("BOARDSTATE_OPERATOR_SECRET") != "inherited-secret-value",
    )

    if failures:
        print(f"\nagent operator secret: {len(failures)} failure(s)")
        return 1
    print("\nagent operator secret: agent spawns carry no operator secret")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

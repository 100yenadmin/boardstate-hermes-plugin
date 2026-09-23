"""A port record whose pid is alive but whose port is closed.

(a) The pid was reused by an unrelated long-lived process: once the drain bound passes,
    the stale record is dropped and a fresh sidecar is spawned, so tool calls recover.
    The unrelated process is never signalled.
(b) The pid is a real sidecar that is still draining (listener closed, exits inside the
    bound): it is waited on, and no second sidecar starts while it is alive.

Both run with the record's owner alive and with it dead. The drain bound is shortened
for the test; production uses the sidecar's own drain limit.
"""

from __future__ import annotations

import asyncio
import os
import signal
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import boardstate_sidecar as runtime

DEAD_OWNER = 999_999_999


def _closed_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _exiting_orphan(seconds: float) -> int:
    """A non-child process that exits after *seconds* and is reaped like an orphan."""
    launcher = subprocess.run(
        [
            sys.executable,
            "-c",
            "import subprocess, sys; "
            f"p = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep({seconds})'], "
            "stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); "
            "print(p.pid)",
        ],
        capture_output=True,
        text=True,
        timeout=10,
        check=True,
    )
    return int(launcher.stdout.strip())


def _write_stale_record(directory: Path, pid: int, owner_pid: int) -> None:
    runtime._write_record(
        directory,
        {
            "port": _closed_port(),
            "nonce": "stale-record-nonce",
            "pid": pid,
            "spawned_by": "agent",
            "owner_pid": owner_pid,
            "adopters": [],
        },
    )


def _run_in_state_dir(tmp: str, coro_factory):
    previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
    os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
    try:
        return asyncio.run(coro_factory())
    finally:
        runtime.shutdown_owned_sidecar()
        runtime._states.pop(runtime._state_key(Path(tmp)), None)
        if previous is None:
            os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
        else:
            os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


def case_reused_pid(owner_pid: int, label: str) -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-stale-reused-") as tmp:
        stranger = subprocess.Popen(
            [sys.executable, "-c", "import time; time.sleep(120)"],
            stdin=subprocess.DEVNULL,
        )
        try:
            _write_stale_record(Path(tmp), stranger.pid, owner_pid)
            result = _run_in_state_dir(
                tmp, lambda: runtime.invoke_tool("boardstate_workspace_get", {})
            )
            assert isinstance(result, dict) and "error" not in result, result
            assert stranger.poll() is None, "unrelated process was signalled"
            record = runtime._read_record(Path(tmp))
            assert record is None or record["pid"] != stranger.pid, record
            print(f"ok   {label}: reused pid -> stale record dropped, fresh sidecar, stranger untouched")
        finally:
            stranger.kill()
            stranger.wait(timeout=10)


def case_draining(owner_pid: int, label: str) -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-stale-draining-") as tmp:
        draining = _exiting_orphan(1.5)
        _write_stale_record(Path(tmp), draining, owner_pid)
        alive_at_spawn: list[bool] = []
        original_spawn = runtime._spawn_sidecar

        async def spawn_spy(*args, **kwargs):
            alive_at_spawn.append(runtime._pid_alive(draining))
            return await original_spawn(*args, **kwargs)

        runtime._spawn_sidecar = spawn_spy
        try:
            started = time.monotonic()
            _run_in_state_dir(tmp, lambda: runtime.ensure_sidecar("agent"))
            took = time.monotonic() - started
            assert alive_at_spawn == [False], f"second sidecar started while the old one lived: {alive_at_spawn}"
            assert took >= 1.0, f"did not wait for the draining sidecar ({took:.2f}s)"
            print(f"ok   {label}: draining sidecar waited on ({took:.1f}s), no double start")
        finally:
            runtime._spawn_sidecar = original_spawn
            if runtime._pid_alive(draining):
                os.kill(draining, signal.SIGTERM)


def main() -> int:
    failures = []
    for bound, case, owner, label in (
        (1.0, case_reused_pid, os.getpid(), "owner alive"),
        (1.0, case_reused_pid, DEAD_OWNER, "owner dead"),
        (5.0, case_draining, os.getpid(), "owner alive"),
        (5.0, case_draining, DEAD_OWNER, "owner dead"),
    ):
        runtime._STALE_RECORD_WAIT_SECONDS = bound
        try:
            case(owner, label)
        except Exception as exc:  # report every case, then fail
            failures.append(f"{case.__name__}[{label}]")
            print(f"FAIL {case.__name__}[{label}]: {type(exc).__name__}: {exc}")
    if failures:
        print(f"stale record: {len(failures)} failed: {', '.join(failures)}")
        return 1
    print("stale record: all checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

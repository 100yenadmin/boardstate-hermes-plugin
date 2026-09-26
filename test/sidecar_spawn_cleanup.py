"""A spawn that is cancelled or fails after the child starts leaves no sidecar behind.

Until the port record and exit hook exist, nothing else can find or stop the new Node
child, so a later call would start a second writer on the same state directory. Both a
cancelled spawn and a failed record write must terminate and await the child, clear the
cached state, and re-raise.
"""

from __future__ import annotations

import asyncio
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import boardstate_sidecar as runtime


SPAWNED: list[asyncio.subprocess.Process] = []
_ORIGINAL_EXEC = asyncio.create_subprocess_exec
IGNORE_TERMINATE = False  # when set, the spawned child behaves as if it ignored the graceful stop


async def _spawn_spy(*args, **kwargs):
    proc = await _ORIGINAL_EXEC(*args, **kwargs)
    if IGNORE_TERMINATE:
        proc.terminate = lambda: None  # the graceful stop reaches a child that does not exit
    SPAWNED.append(proc)
    return proc


def _assert_cleaned(directory: Path, proc: asyncio.subprocess.Process, label: str) -> None:
    assert proc.returncode is not None, f"{label}: the spawned sidecar {proc.pid} is still running"
    state = runtime._state_for(directory)
    assert state["proc"] is None and state["port"] is None and state["nonce"] is None, (
        f"{label}: cached state kept {state!r}"
    )
    assert not state["owned"], f"{label}: state still claims ownership"
    assert runtime._read_record(directory) is None, f"{label}: a port record was left behind"
    print(f"ok   {label}: child {proc.pid} terminated and awaited, state cleared, error re-raised")


async def _record_write_fails(directory: Path, label: str = "record write failure") -> None:
    original_write = runtime._write_record

    def failing_write(_directory: Path, _record: dict) -> None:
        raise OSError("forced record write failure")

    runtime._write_record = failing_write
    try:
        try:
            await runtime._spawn_sidecar(directory, "agent")
        except OSError as exc:
            assert "forced record write failure" in str(exc)
        else:
            raise AssertionError("record-write failure was swallowed")
    finally:
        runtime._write_record = original_write
    assert len(SPAWNED) == 1, SPAWNED
    _assert_cleaned(directory, SPAWNED[0], label)


async def _record_write_fails_child_ignores_terminate(directory: Path) -> None:
    """The graceful stop times out because the child ignores it: the kill fallback must
    still reap the child before the error is re-raised, so the next spawn can never
    overlap a child that is still exiting."""
    global IGNORE_TERMINATE
    original_wait = runtime._ATEXIT_DRAIN_WAIT_SECONDS
    runtime._ATEXIT_DRAIN_WAIT_SECONDS = 0.5  # the module reads it at call time
    IGNORE_TERMINATE = True
    try:
        await _record_write_fails(directory, "record write failure, child ignores terminate")
    finally:
        IGNORE_TERMINATE = False
        runtime._ATEXIT_DRAIN_WAIT_SECONDS = original_wait


async def _cancelled(directory: Path) -> None:
    original_read_port = runtime._read_port
    announced = asyncio.Event()

    async def read_port_then_hang(proc):
        await original_read_port(proc)  # the child is up and listening
        announced.set()
        await asyncio.Event().wait()

    runtime._read_port = read_port_then_hang
    try:
        task = asyncio.create_task(runtime._spawn_sidecar(directory, "dashboard"))
        await asyncio.wait_for(announced.wait(), timeout=20)
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        else:
            raise AssertionError("cancellation was swallowed")
    finally:
        runtime._read_port = original_read_port
    assert len(SPAWNED) == 1, SPAWNED
    _assert_cleaned(directory, SPAWNED[0], "cancelled spawn")


async def _run() -> None:
    asyncio.create_subprocess_exec = _spawn_spy  # the module under test resolves it at call time
    try:
        for case in (_record_write_fails, _record_write_fails_child_ignores_terminate, _cancelled):
            SPAWNED.clear()
            with tempfile.TemporaryDirectory(prefix="boardstate-spawn-cleanup-") as tmp:
                directory = Path(tmp)
                try:
                    await case(directory)
                finally:
                    for proc in SPAWNED:  # never leak a sidecar, even when a check fails
                        if proc.returncode is None:
                            proc.kill()
                            await proc.wait()
                    runtime._states.pop(runtime._state_key(directory), None)
    finally:
        asyncio.create_subprocess_exec = _ORIGINAL_EXEC


if __name__ == "__main__":
    asyncio.run(_run())
    print("sidecar spawn cleanup: all checks passed")

"""A sidecar exits when every process that owns or adopted it is SIGKILLed.

SIGKILL skips the owner's exit cleanup, so only the sidecar's own watchdog can stop
it. The watchdog must follow the port record: while an adopter is still alive the
sidecar keeps running, even after the original spawner is gone.
"""

from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXIT_DEADLINE_SECONDS = 10.0
SURVIVE_SECONDS = 7.0  # more than two 3 s watchdog ticks


def _alive(pid: int) -> bool:
    sys.path.insert(0, str(ROOT))
    import boardstate_sidecar as runtime

    return runtime._pid_alive(pid)


def _holder_worker(caller: str) -> None:
    import asyncio

    sys.path.insert(0, str(ROOT))
    import boardstate_sidecar as runtime

    asyncio.run(runtime.ensure_sidecar(caller))  # spawns, or adopts an existing agent sidecar
    record = json.loads((runtime.state_dir() / ".boardstate-sidecar.json").read_text())
    print(record["pid"], flush=True)
    while True:
        time.sleep(60)


def _start_holder(tmp: str, caller: str) -> tuple[subprocess.Popen, int]:
    env = os.environ.copy()
    env["BOARDSTATE_HERMES_STATE_DIR"] = tmp
    process = subprocess.Popen(
        [sys.executable, str(Path(__file__).resolve()), "--holder", caller],
        cwd=ROOT,
        env=env,
        text=True,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    assert process.stdout is not None
    line = process.stdout.readline().strip()
    assert line.isdigit(), f"holder did not report a sidecar pid: {line!r}"
    return process, int(line)


def _sigkill(process: subprocess.Popen) -> None:
    process.send_signal(signal.SIGKILL)
    process.wait(timeout=5)  # reap it, as a shell or service manager would


def _wait_exit(pid: int, timeout: float) -> float | None:
    started = time.monotonic()
    while time.monotonic() - started < timeout:
        if not _alive(pid):
            return time.monotonic() - started
        time.sleep(0.1)
    return None


def _cleanup(pid: int, *processes: subprocess.Popen) -> None:
    for process in processes:
        if process.poll() is None:
            process.kill()
            process.wait(timeout=5)
    if _alive(pid):
        os.kill(pid, signal.SIGTERM)


def main() -> int:
    if os.name == "nt":
        print("owner watchdog: SIGKILL cases are POSIX-only; skipped")
        return 0

    for caller in ("agent", "dashboard"):
        with tempfile.TemporaryDirectory(prefix=f"boardstate-watchdog-{caller}-") as tmp:
            holder, sidecar_pid = _start_holder(tmp, caller)
            try:
                assert _alive(sidecar_pid)
                _sigkill(holder)
                took = _wait_exit(sidecar_pid, EXIT_DEADLINE_SECONDS)
                assert took is not None, f"{caller}-owned sidecar {sidecar_pid} outlived its SIGKILLed owner"
                print(f"ok   {caller}-owned sidecar exited {took:.1f}s after its owner was SIGKILLed")
            finally:
                _cleanup(sidecar_pid, holder)

    with tempfile.TemporaryDirectory(prefix="boardstate-watchdog-adopter-") as tmp:
        owner, sidecar_pid = _start_holder(tmp, "agent")
        adopter, adopted_pid = _start_holder(tmp, "agent")
        try:
            assert adopted_pid == sidecar_pid, "second agent did not adopt the shared sidecar"
            record = json.loads((Path(tmp) / ".boardstate-sidecar.json").read_text())
            assert adopter.pid in record.get("adopters", []), record
            _sigkill(owner)
            time.sleep(SURVIVE_SECONDS)
            assert _alive(sidecar_pid), "watchdog stopped a sidecar that a live adopter still uses"
            print("ok   sidecar survives its SIGKILLed spawner while an adopter is alive")
            _sigkill(adopter)
            took = _wait_exit(sidecar_pid, EXIT_DEADLINE_SECONDS)
            assert took is not None, "sidecar outlived its last SIGKILLed adopter"
            print(f"ok   sidecar exited {took:.1f}s after its last adopter was SIGKILLed")
        finally:
            _cleanup(sidecar_pid, owner, adopter)

    print("owner watchdog: all checks passed")
    return 0


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--holder":
        _holder_worker(sys.argv[2])
        raise SystemExit(0)
    raise SystemExit(main())

"""Process-level regression for concurrent sidecar adoption and owner shutdown.

The parent holds the lifecycle flock while an owner begins shutdown and another
agent begins adoption.  Once released, either transaction may win; both valid
outcomes leave exactly one live sidecar and a working adopter.  This exercises
the race that separate sequential replacement tests cannot cover.
"""

from __future__ import annotations

import asyncio
import fcntl
import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    return True


async def _owner() -> None:
    sys.path.insert(0, str(ROOT))
    import boardstate_sidecar as runtime

    await runtime.ensure_sidecar("agent")
    record = json.loads((runtime.state_dir() / ".boardstate-sidecar.json").read_text())
    print(f"OWNER_READY {record['pid']}", flush=True)
    await _wait_signal(runtime.state_dir() / "owner.go")
    runtime.shutdown_owned_sidecar()
    print("OWNER_DONE", flush=True)


async def _adopter() -> None:
    sys.path.insert(0, str(ROOT))
    import boardstate_sidecar as runtime

    print("ADOPTER_WAITING", flush=True)
    await _wait_signal(runtime.state_dir() / "adopter.go")
    await runtime.ensure_sidecar("agent")
    workspace = await runtime.invoke_tool("boardstate_workspace_get", {})
    assert isinstance(workspace.get("doc", {}).get("tabs"), list)
    record = json.loads((runtime.state_dir() / ".boardstate-sidecar.json").read_text())
    print(f"ADOPTER_READY {record['pid']}", flush=True)
    await _wait_signal(runtime.state_dir() / "cleanup.go")
    runtime.shutdown_owned_sidecar()
    print("ADOPTER_DONE", flush=True)


def _worker(role: str) -> int:
    if role == "owner":
        asyncio.run(_owner())
    elif role == "adopter":
        asyncio.run(_adopter())
    else:
        raise AssertionError(role)
    return 0


async def _wait_signal(path: Path) -> None:
    deadline = time.monotonic() + 20
    while not path.exists() and time.monotonic() < deadline:
        await asyncio.sleep(0.02)
    assert path.exists(), f"timed out waiting for {path.name}"


def _line(process: subprocess.Popen[str], expected: str) -> str:
    assert process.stdout is not None
    line = process.stdout.readline().strip()
    if not line.startswith(expected):
        stderr = process.stderr.read() if process.stderr is not None else ""
        raise AssertionError(f"expected {expected!r}, got {line!r}; stderr={stderr}")
    return line


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="boardstate-race-") as tmp:
        directory = Path(tmp)
        env = os.environ.copy()
        env["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        command = [sys.executable, str(Path(__file__).resolve()), "--worker"]
        processes: list[subprocess.Popen[str]] = []
        sidecar_pids: set[int] = set()
        try:
            owner = subprocess.Popen(
                [*command, "owner"],
                cwd=ROOT,
                env=env,
                text=True,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            processes.append(owner)
            owner_pid = int(_line(owner, "OWNER_READY").split()[1])
            sidecar_pids.add(owner_pid)

            lock_fd = os.open(
                str(directory / ".boardstate-sidecar.lock"),
                os.O_CREAT | os.O_RDWR,
                0o600,
            )
            fcntl.flock(lock_fd, fcntl.LOCK_EX)
            try:
                adopter = subprocess.Popen(
                    [*command, "adopter"],
                    cwd=ROOT,
                    env=env,
                    text=True,
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                processes.append(adopter)
                _line(adopter, "ADOPTER_WAITING")
                (directory / "owner.go").touch()
                (directory / "adopter.go").touch()
                time.sleep(0.1)
            finally:
                fcntl.flock(lock_fd, fcntl.LOCK_UN)
                os.close(lock_fd)

            _line(owner, "OWNER_DONE")
            owner.wait(timeout=10)
            assert owner.returncode == 0
            adopted_pid = int(_line(adopter, "ADOPTER_READY").split()[1])
            sidecar_pids.add(adopted_pid)

            record_path = directory / ".boardstate-sidecar.json"
            record = json.loads(record_path.read_text(encoding="utf-8"))
            assert record["pid"] == adopted_pid
            assert _alive(adopted_pid), "adopter's sidecar was terminated"
            if adopted_pid != owner_pid:
                assert not _alive(owner_pid), "superseded owner sidecar is still alive"

            (directory / "cleanup.go").touch()
            _line(adopter, "ADOPTER_DONE")
            adopter.wait(timeout=10)
            assert adopter.returncode == 0
            deadline = time.monotonic() + 5
            while record_path.exists() and time.monotonic() < deadline:
                time.sleep(0.02)
            assert not record_path.exists(), "final adopter did not reap the sidecar"
        finally:
            for process in processes:
                if process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
            for pid in sidecar_pids:
                if _alive(pid):
                    os.kill(pid, signal.SIGTERM)

    print("sidecar concurrency: adoption/shutdown race remains single-writer and live")
    return 0


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        raise SystemExit(_worker(sys.argv[2]))
    raise SystemExit(main())

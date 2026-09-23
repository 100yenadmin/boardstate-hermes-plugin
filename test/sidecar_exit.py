"""Process-exit regression for the shared Boardstate sidecar lifecycle."""

from __future__ import annotations

import asyncio
import json
import os
import signal
import socketserver
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


async def _natural_exit_worker() -> None:
    sys.path.insert(0, str(ROOT))
    import boardstate_sidecar as runtime

    await runtime.ensure_sidecar("agent")
    record = json.loads((runtime.state_dir() / ".boardstate-sidecar.json").read_text())
    print(record["pid"], flush=True)
    # Deliberately return without calling shutdown_owned_sidecar(). The atexit
    # hook is the public lifecycle contract under test.


async def _orphan_dashboard_worker() -> None:
    sys.path.insert(0, str(ROOT))
    import boardstate_sidecar as runtime

    await runtime.ensure_sidecar("dashboard")
    record = json.loads((runtime.state_dir() / ".boardstate-sidecar.json").read_text())
    print(record["pid"], flush=True)
    os._exit(0)


def _foreign_listener_worker() -> None:
    class Handler(socketserver.BaseRequestHandler):
        def handle(self) -> None:
            self.request.recv(4096)
            self.request.sendall(
                b"HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\n\r\nnot found"
            )

    with socketserver.TCPServer(("127.0.0.1", 0), Handler) as server:
        print(server.server_address[1], flush=True)
        server.serve_forever()


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="boardstate-exit-") as tmp:
        directory = Path(tmp)
        env = os.environ.copy()
        env["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        process = subprocess.Popen(
            [sys.executable, str(Path(__file__).resolve()), "--natural-exit-worker"],
            cwd=ROOT,
            env=env,
            text=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        assert process.stdout is not None
        line = process.stdout.readline().strip()
        assert line.isdigit(), line
        sidecar_pid = int(line)
        try:
            process.wait(timeout=12)
            stderr = process.stderr.read() if process.stderr is not None else ""
            assert process.returncode == 0, stderr

            record_path = directory / ".boardstate-sidecar.json"
            deadline = time.monotonic() + 3
            while (_alive(sidecar_pid) or record_path.exists()) and time.monotonic() < deadline:
                time.sleep(0.02)
            assert not _alive(sidecar_pid), f"sidecar {sidecar_pid} survived owner exit"
            assert not record_path.exists(), "sidecar record survived owner exit"
        finally:
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=5)
            if _alive(sidecar_pid):
                os.kill(sidecar_pid, signal.SIGTERM)

    with tempfile.TemporaryDirectory(prefix="boardstate-orphan-") as tmp:
        directory = Path(tmp)
        env = os.environ.copy()
        env["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        process = subprocess.Popen(
            [sys.executable, str(Path(__file__).resolve()), "--orphan-dashboard-worker"],
            cwd=ROOT,
            env=env,
            text=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        assert process.stdout is not None
        line = process.stdout.readline().strip()
        assert line.isdigit(), line
        orphan_pid = int(line)
        process.wait(timeout=5)
        assert process.returncode == 0
        assert _alive(orphan_pid)

        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        sys.path.insert(0, str(ROOT))
        import boardstate_sidecar as runtime

        try:
            asyncio.run(runtime.ensure_sidecar("dashboard"))
            replacement = json.loads(
                (directory / ".boardstate-sidecar.json").read_text(encoding="utf-8")
            )
            assert replacement["pid"] != orphan_pid
            assert not _alive(orphan_pid), "dead owner's dashboard sidecar was adopted"
            assert runtime.operator_secret(), "replacement dashboard lost operator secret"
        finally:
            runtime.shutdown_owned_sidecar()
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous
            if _alive(orphan_pid):
                os.kill(orphan_pid, signal.SIGTERM)

    with tempfile.TemporaryDirectory(prefix="boardstate-identity-") as tmp:
        directory = Path(tmp)
        foreign = subprocess.Popen(
            [sys.executable, str(Path(__file__).resolve()), "--foreign-listener-worker"],
            cwd=ROOT,
            text=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        assert foreign.stdout is not None
        foreign_port = int(foreign.stdout.readline().strip())
        record_path = directory / ".boardstate-sidecar.json"
        record_path.write_text(
            json.dumps(
                {
                    "port": foreign_port,
                    "nonce": "not-a-boardstate-sidecar",
                    "pid": foreign.pid,
                    "spawned_by": "dashboard",
                    "owner_pid": 999_999_999,
                    "adopters": [],
                }
            ),
            encoding="utf-8",
        )
        record_path.chmod(0o600)
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        try:
            try:
                asyncio.run(runtime.ensure_sidecar("dashboard"))
            except RuntimeError as exc:
                assert "identity" in str(exc)
            else:
                raise AssertionError("unverified live process was adopted or replaced")
            preserved = json.loads(record_path.read_text(encoding="utf-8"))
            assert preserved["pid"] == foreign.pid
            assert foreign.poll() is None, "unverified port record killed an unrelated process"
        finally:
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous
            if foreign.poll() is None:
                foreign.terminate()
                foreign.wait(timeout=5)

    print(
        "sidecar exit: natural exit reaps, dead owners are replaced, and foreign pids survive"
    )
    return 0


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--natural-exit-worker":
        asyncio.run(_natural_exit_worker())
    elif len(sys.argv) == 2 and sys.argv[1] == "--orphan-dashboard-worker":
        asyncio.run(_orphan_dashboard_worker())
    elif len(sys.argv) == 2 and sys.argv[1] == "--foreign-listener-worker":
        _foreign_listener_worker()
    else:
        raise SystemExit(main())

"""Graceful, authenticated sidecar replacement regressions."""

from __future__ import annotations

import argparse
import asyncio
import http.client
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Awaitable, Callable

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import boardstate_sidecar as runtime


def _closed_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _post_status(port: int, path: str) -> int:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}",
        data=b"",
        method="POST",
    )
    try:
        with runtime._DIRECT_OPENER.open(request, timeout=2.0) as response:
            response.read()
            return int(response.status)
    except urllib.error.HTTPError as exc:
        exc.read()
        return int(exc.code)


def _slow_native_invoke(
    port: int,
    nonce: str,
    request_accepted: threading.Event,
    delay_seconds: float,
) -> dict[str, Any]:
    body = json.dumps({"name": "boardstate_workspace_get", "args": {}}).encode("utf-8")
    split_at = max(1, len(body) // 2)
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=delay_seconds + 10)
    try:
        connection.putrequest("POST", f"/tools/invoke?nonce={nonce}")
        connection.putheader("Content-Type", "application/json")
        connection.putheader("Content-Length", str(len(body)))
        connection.putheader("Connection", "close")
        connection.endheaders()
        connection.send(body[:split_at])
        request_accepted.set()
        time.sleep(delay_seconds)
        connection.send(body[split_at:])
        response = connection.getresponse()
        payload = json.loads(response.read().decode("utf-8"))
        if response.status != 200:
            raise AssertionError(f"slow native invocation returned {response.status}: {payload}")
        return payload
    finally:
        connection.close()


async def _case_authenticated_endpoint() -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-shutdown-auth-") as tmp:
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        directory = Path(tmp)
        try:
            port, nonce = await runtime.ensure_sidecar("agent")
            assert _post_status(port, "/internal/shutdown") in {401, 403}
            assert _post_status(port, "/internal/shutdown?nonce=wrong") in {401, 403}
            record = runtime._read_record(directory)
            assert record is not None and runtime._pid_alive(int(record["pid"]))
            assert await runtime._probe_record(record), "rejected shutdown request stopped the sidecar"
        finally:
            runtime._shutdown_owned_sidecar_sync(directory)
            runtime._states.pop(runtime._state_key(directory), None)
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


async def _case_drain_then_replace() -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-graceful-replace-") as tmp:
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        directory = Path(tmp)
        request_accepted = threading.Event()
        monitor_stop = threading.Event()
        overlap: list[tuple[int, int]] = []
        old_pid = 0

        def monitor_record() -> None:
            while not monitor_stop.wait(0.01):
                record = runtime._read_record(directory)
                if record is None or not old_pid:
                    continue
                recorded_pid = int(record["pid"])
                if (
                    recorded_pid != old_pid
                    and runtime._pid_alive(old_pid)
                    and runtime._pid_alive(recorded_pid)
                ):
                    overlap.append((old_pid, recorded_pid))

        monitor = threading.Thread(target=monitor_record, daemon=True)
        try:
            port, nonce = await runtime.ensure_sidecar("agent")
            first = runtime._read_record(directory)
            assert first is not None
            old_pid = int(first["pid"])
            monitor.start()

            slow_call = asyncio.create_task(
                asyncio.to_thread(
                    _slow_native_invoke,
                    port,
                    nonce,
                    request_accepted,
                    10.0,
                )
            )
            accepted = await asyncio.to_thread(request_accepted.wait, 3.0)
            assert accepted, "slow native invocation was not accepted"

            replacement_error: BaseException | None = None
            try:
                await runtime.ensure_sidecar("dashboard")
            except BaseException as exc:  # retain the in-flight result before reporting
                replacement_error = exc
            result = await slow_call
            if replacement_error is not None:
                raise replacement_error

            assert "doc" in result.get("result", {}), result
            second = runtime._read_record(directory)
            assert second is not None and second["spawned_by"] == "dashboard"
            assert int(second["pid"]) != old_pid
            assert not runtime._pid_alive(old_pid), "old sidecar survived replacement"
            assert runtime._pid_alive(int(second["pid"])), "replacement sidecar is not live"
            assert not overlap, f"two live sidecars held the record during replacement: {overlap}"
        finally:
            monitor_stop.set()
            if monitor.is_alive():
                monitor.join(timeout=1)
            runtime._shutdown_owned_sidecar_sync(directory)
            runtime._states.pop(runtime._state_key(directory), None)
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


async def _case_unverified_pid() -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-unverified-replace-") as tmp:
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        directory = Path(tmp)
        stranger = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
        nonce = "unverified-sidecar-nonce"
        runtime._write_record(
            directory,
            {
                "port": _closed_port(),
                "nonce": nonce,
                "pid": stranger.pid,
                "spawned_by": "agent",
                "owner_pid": 999_999_999,
                "adopters": [],
            },
        )
        try:
            try:
                await runtime._ensure_sidecar_impl("dashboard")
            except RuntimeError as exc:
                assert (
                    "existing Boardstate sidecar did not stop; not signalling an unverified pid"
                    in str(exc)
                ), str(exc)
            else:
                raise AssertionError("dashboard replaced an unreachable, unverifiable live pid")
            assert stranger.poll() is None, "unverified recorded pid was signalled"
            record = runtime._read_record(directory)
            assert record is not None and int(record["pid"]) == stranger.pid
        finally:
            state = runtime._state_for(directory)
            owned_proc = state.get("proc")
            if owned_proc is not None and getattr(owned_proc, "returncode", None) is None:
                owned_proc.terminate()
                await owned_proc.wait()
            runtime._states.pop(runtime._state_key(directory), None)
            stranger.terminate()
            stranger.wait(timeout=10)
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


async def _case_owned_reprobe() -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-owned-reprobe-") as tmp:
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        directory = Path(tmp)
        original_probe = runtime._probe_record
        pid = 0
        proc: Any = None
        try:
            port, nonce = await runtime.ensure_sidecar("dashboard")
            state = runtime._state_for(directory)
            proc = state.get("proc")
            pid = int(getattr(proc, "pid"))
            secret = runtime.operator_secret()
            assert secret, "dashboard-owned sidecar did not receive an operator secret"

            probe_count = 0

            async def timeout_then_succeed(record: dict[str, Any]) -> bool:
                nonlocal probe_count
                probe_count += 1
                if probe_count == 1:
                    return False
                return await original_probe(record)

            runtime._probe_record = timeout_then_succeed
            reprobed_port, reprobed_nonce = await runtime._ensure_sidecar_impl("dashboard")
            assert (reprobed_port, reprobed_nonce) == (port, nonce)
            assert probe_count == 2, probe_count
            assert state.get("owned") is True, "own child was downgraded to an adoption"
            assert state.get("proc") is proc, "own child process handle was discarded"
            assert runtime.operator_secret() == secret, "operator secret was discarded"
            runtime._probe_record = original_probe
            runtime._shutdown_owned_sidecar_sync(directory)
            assert not runtime._pid_alive(pid), "exit cleanup left the owned sidecar running"
            pid = 0
        finally:
            runtime._probe_record = original_probe
            if pid and runtime._pid_alive(pid) and proc is not None:
                proc.terminate()
                await proc.wait()
            runtime._states.pop(runtime._state_key(directory), None)
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


CASES: dict[str, Callable[[], Awaitable[None]]] = {
    "auth": _case_authenticated_endpoint,
    "drain": _case_drain_then_replace,
    "unverified": _case_unverified_pid,
    "owned-reprobe": _case_owned_reprobe,
}


async def _run(selected: str) -> None:
    names = list(CASES) if selected == "all" else [selected]
    for name in names:
        await CASES[name]()
        print(f"ok  {name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--case", choices=[*CASES, "all"], default="all")
    args = parser.parse_args()
    asyncio.run(_run(args.case))
    print("sidecar graceful replacement: authenticated, drained, and pid-reuse safe")

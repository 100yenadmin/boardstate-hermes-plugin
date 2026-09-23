"""Shared Boardstate sidecar lifecycle for the agent and dashboard halves.

The sidecar is a single writer for one Boardstate state directory.  Both plugin
surfaces adopt it through a mode-0600 port record.  A dashboard caller replaces
an agent-owned sidecar so live Hermes data and the in-memory operator credential
are available, while the on-disk workspace remains untouched.
"""

from __future__ import annotations

import asyncio
import atexit
import json
import logging
import os
import secrets
import shutil
import signal
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Literal, Optional

log = logging.getLogger(__name__)

SpawnedBy = Literal["dashboard", "agent"]

_ROOT = Path(__file__).resolve().parent
_SIDECAR_JS = _ROOT / "dashboard" / "sidecar" / "server.js"
_sidecar_lock = asyncio.Lock()
_state: dict[str, Any] = {
    "proc": None,
    "port": None,
    "nonce": None,
    "operator_secret": None,
    "owned": False,
    "spawned_by": None,
    "state_dir": None,
    "drain_tasks": [],
}
_atexit_registered = False
_runtime_loop: Optional[asyncio.AbstractEventLoop] = None
_runtime_loop_guard = threading.Lock()

try:
    import fcntl

    _HAVE_FCNTL = True
except ImportError:  # pragma: no cover - Windows is best-effort
    fcntl = None  # type: ignore[assignment]
    _HAVE_FCNTL = False


def state_dir() -> Path:
    override = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
    if override:
        return Path(override)
    hermes_home = os.environ.get("HERMES_HOME")
    base = Path(hermes_home) if hermes_home else (Path.home() / ".hermes")
    return base / "boardstate-state"


def sidecar_bundle() -> Path:
    return _SIDECAR_JS


def operator_secret() -> Optional[str]:
    value = _state.get("operator_secret")
    return str(value) if value else None


def status() -> dict[str, Any]:
    proc = _state.get("proc")
    return {
        "port": _state.get("port"),
        "owned": bool(_state.get("owned")),
        "spawned_by": _state.get("spawned_by"),
        "running": proc is not None and proc.returncode is None,
        "bundle_present": _SIDECAR_JS.exists(),
        "state_dir": str(state_dir()),
    }


def _portfile_path(directory: Path) -> Path:
    return directory / ".boardstate-sidecar.json"


def _lockfile_path(directory: Path) -> Path:
    return directory / ".boardstate-sidecar.lock"


async def _acquire_lifecycle_lock(directory: Path) -> Optional[int]:
    """Serialize every port-record decision across plugin processes."""
    if not _HAVE_FCNTL:
        return None
    lock_fd = os.open(str(_lockfile_path(directory)), os.O_CREAT | os.O_RDWR, 0o600)
    try:
        await asyncio.get_running_loop().run_in_executor(
            None, fcntl.flock, lock_fd, fcntl.LOCK_EX
        )
    except BaseException:
        os.close(lock_fd)
        raise
    return lock_fd


def _release_lifecycle_lock(lock_fd: Optional[int]) -> None:
    if lock_fd is None:
        return
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
    finally:
        os.close(lock_fd)


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return False
    return True


async def _port_listening(port: int) -> bool:
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection("127.0.0.1", port), timeout=1.0
        )
    except Exception:
        return False
    writer.close()
    try:
        await writer.wait_closed()
    except Exception:
        pass
    return True


def _read_record(directory: Path) -> Optional[dict[str, Any]]:
    try:
        record = json.loads(_portfile_path(directory).read_text(encoding="utf-8"))
    except Exception:
        return None
    if not isinstance(record, dict):
        return None
    port, nonce, pid = record.get("port"), record.get("nonce"), record.get("pid")
    spawned_by = record.get("spawned_by")
    if not (
        isinstance(port, int)
        and isinstance(nonce, str)
        and nonce
        and isinstance(pid, int)
        and spawned_by in {"dashboard", "agent"}
    ):
        return None
    return record


def _write_record(directory: Path, record: dict[str, Any]) -> None:
    path = _portfile_path(directory)
    fd = os.open(str(path), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        os.write(fd, json.dumps(record, separators=(",", ":")).encode("utf-8"))
    finally:
        os.close(fd)
    try:
        os.chmod(path, 0o600)
    except OSError:  # pragma: no cover - best effort on Windows
        pass


async def _try_adopt(directory: Path) -> Optional[dict[str, Any]]:
    record = _read_record(directory)
    if record is None or not _pid_alive(int(record["pid"])):
        return None
    if not await _port_listening(int(record["port"])):
        return None
    return record


async def _drain(stream: Optional[asyncio.StreamReader], label: str) -> None:
    if stream is None:
        return
    try:
        while True:
            line = await stream.readline()
            if not line:
                return
            log.info(
                "boardstate-sidecar[%s]: %s",
                label,
                line.decode(errors="replace").rstrip(),
            )
    except Exception:  # pragma: no cover - best-effort logging
        return


async def _read_port(proc: "asyncio.subprocess.Process") -> int:
    assert proc.stdout is not None
    while True:
        line = await asyncio.wait_for(proc.stdout.readline(), timeout=20.0)
        if not line:
            raise RuntimeError("boardstate sidecar exited before announcing its port")
        try:
            payload = json.loads(line.decode().strip())
        except Exception:
            continue
        info = payload.get("boardstateSidecar") if isinstance(payload, dict) else None
        if isinstance(info, dict) and "port" in info:
            return int(info["port"])


def _node_bin() -> str:
    return os.environ.get("HERMES_NODE_BIN") or shutil.which("node") or "node"


def _register_atexit() -> None:
    global _atexit_registered
    if not _atexit_registered:
        atexit.register(shutdown_owned_sidecar)
        _atexit_registered = True


def _get_runtime_loop() -> asyncio.AbstractEventLoop:
    """One long-lived loop owns the subprocess across Hermes dispatch calls.

    Hermes may bridge each async tool call through a fresh temporary loop. A
    subprocess created on one of those loops becomes unusable on the next call,
    so every public coroutine is scheduled onto this private daemon loop.
    """
    global _runtime_loop
    with _runtime_loop_guard:
        if _runtime_loop is not None and _runtime_loop.is_running():
            return _runtime_loop
        ready = threading.Event()

        def run() -> None:
            global _runtime_loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            _runtime_loop = loop
            ready.set()
            loop.run_forever()

        threading.Thread(
            target=run,
            name="boardstate-sidecar-runtime",
            daemon=True,
        ).start()
        ready.wait(timeout=5.0)
        if _runtime_loop is None:
            raise RuntimeError("Boardstate sidecar runtime loop did not start")
        return _runtime_loop


async def _on_runtime_loop(coro):
    loop = _get_runtime_loop()
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return await asyncio.wrap_future(future)


async def _spawn_sidecar(
    directory: Path,
    spawned_by: SpawnedBy,
    extra_env: Optional[dict[str, str]] = None,
) -> tuple[int, str]:
    nonce = secrets.token_urlsafe(32)
    generated_operator_secret = secrets.token_urlsafe(32)
    env = os.environ.copy()
    env.update(extra_env or {})
    env["BOARDSTATE_STATE_DIR"] = str(directory)
    env["BOARDSTATE_SIDECAR_NONCE"] = nonce
    env["BOARDSTATE_OPERATOR_SECRET"] = generated_operator_secret
    env["PORT"] = "0"

    proc = await asyncio.create_subprocess_exec(
        _node_bin(),
        str(_SIDECAR_JS),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    try:
        port = await _read_port(proc)
    except Exception:
        proc.terminate()
        raise

    _state.update(
        {
            "proc": proc,
            "port": port,
            "nonce": nonce,
            "operator_secret": generated_operator_secret
            if spawned_by == "dashboard"
            else None,
            "owned": True,
            "spawned_by": spawned_by,
            "state_dir": directory,
        }
    )
    _write_record(
        directory,
        {
            "port": port,
            "nonce": nonce,
            "pid": proc.pid,
            "spawned_by": spawned_by,
            "owner_pid": os.getpid(),
            "adopters": [],
        },
    )
    _state["drain_tasks"] = [
        asyncio.create_task(_drain(proc.stdout, "out")),
        asyncio.create_task(_drain(proc.stderr, "err")),
    ]
    _register_atexit()
    log.info(
        "boardstate: %s sidecar up on 127.0.0.1:%d (state %s)",
        spawned_by,
        port,
        directory,
    )
    return port, nonce


async def _terminate_record(directory: Path, record: dict[str, Any]) -> None:
    pid = int(record["pid"])
    proc = _state.get("proc")
    if proc is not None and proc.pid == pid:
        proc.terminate()
        try:
            await asyncio.wait_for(proc.wait(), timeout=5.0)
        except asyncio.TimeoutError as exc:
            raise RuntimeError(
                "agent-owned Boardstate sidecar did not stop after SIGTERM"
            ) from exc
        await asyncio.gather(*_state.get("drain_tasks", []), return_exceptions=True)
    else:
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        deadline = asyncio.get_running_loop().time() + 5.0
        while _pid_alive(pid) and asyncio.get_running_loop().time() < deadline:
            await asyncio.sleep(0.05)
        if _pid_alive(pid):
            raise RuntimeError("agent-owned Boardstate sidecar did not stop after SIGTERM")
    current = _read_record(directory)
    if current and current.get("nonce") == record.get("nonce"):
        _portfile_path(directory).unlink(missing_ok=True)


def _remember_adoption(directory: Path, record: dict[str, Any], caller: SpawnedBy) -> None:
    if caller == "agent" and record.get("spawned_by") == "agent":
        adopters = [
            int(pid)
            for pid in record.get("adopters", [])
            if isinstance(pid, int) and _pid_alive(int(pid)) and int(pid) != os.getpid()
        ]
        adopters.append(os.getpid())
        record["adopters"] = adopters
        _write_record(directory, record)
    _state.update(
        {
            "proc": None,
            "port": int(record["port"]),
            "nonce": str(record["nonce"]),
            "operator_secret": None,
            "owned": False,
            "spawned_by": str(record["spawned_by"]),
            "state_dir": directory,
        }
    )
    _register_atexit()


async def _ensure_sidecar_impl(
    caller: SpawnedBy,
    *,
    extra_env: Optional[dict[str, str]] = None,
) -> tuple[int, str]:
    """Return a live sidecar, applying the dashboard-over-agent ownership rule."""
    if caller not in {"dashboard", "agent"}:
        raise ValueError("caller must be 'dashboard' or 'agent'")

    async with _sidecar_lock:
        directory = state_dir()
        current_port = _state.get("port")
        current_dir = _state.get("state_dir")
        if current_port and current_dir == directory and await _port_listening(int(current_port)):
            if not (caller == "dashboard" and _state.get("spawned_by") == "agent"):
                return int(current_port), str(_state["nonce"])

        if not _SIDECAR_JS.exists():
            raise RuntimeError(
                f"boardstate sidecar bundle missing: {_SIDECAR_JS} (run npm run build)"
            )
        directory.mkdir(parents=True, exist_ok=True)

        lock_fd = await _acquire_lifecycle_lock(directory)
        try:
            record = await _try_adopt(directory)
            if record and caller == "dashboard" and record.get("spawned_by") == "agent":
                await _terminate_record(directory, record)
                record = None
                _state.update(
                    {
                        "proc": None,
                        "port": None,
                        "nonce": None,
                        "operator_secret": None,
                        "owned": False,
                        "spawned_by": None,
                        "state_dir": None,
                        "drain_tasks": [],
                    }
                )
            if record:
                _remember_adoption(directory, record, caller)
                return int(record["port"]), str(record["nonce"])
            return await _spawn_sidecar(directory, caller, extra_env)
        finally:
            _release_lifecycle_lock(lock_fd)


async def ensure_sidecar(
    caller: SpawnedBy,
    *,
    extra_env: Optional[dict[str, str]] = None,
) -> tuple[int, str]:
    return await _on_runtime_loop(
        _ensure_sidecar_impl(caller, extra_env=extra_env)
    )


def _post_json_sync(
    port: int,
    nonce: str,
    path: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}?nonce={nonce}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        raw = exc.read()
    decoded = json.loads(raw.decode("utf-8"))
    if not isinstance(decoded, dict):
        raise RuntimeError("Boardstate sidecar returned a non-object response")
    return decoded


async def _invoke_tool_impl(name: str, args: dict[str, Any]) -> Any:
    port, nonce = await _ensure_sidecar_impl("agent")
    payload = await asyncio.to_thread(
        _post_json_sync,
        port,
        nonce,
        "/tools/invoke",
        {"name": name, "args": args},
    )
    if "result" in payload:
        return payload["result"]
    return {"error": str(payload.get("error") or "Boardstate tool failed")}


async def invoke_tool(name: str, args: dict[str, Any]) -> Any:
    return await _on_runtime_loop(_invoke_tool_impl(name, args))


async def _shutdown_owned_sidecar_impl() -> None:
    """Release this process and reap an agent spawn only when no live adopter remains."""
    directory = _state.get("state_dir")
    nonce = _state.get("nonce")
    if not isinstance(directory, Path) or not nonce:
        return

    # Shutdown must participate in the same transaction as adoption/spawn.  In
    # particular, an adopter cannot publish itself after we decide to reap, and a
    # starter cannot observe the record while we rewrite it for surviving adopters.
    lock_fd = await _acquire_lifecycle_lock(directory)
    try:
        record = _read_record(directory)
        if record is None or record.get("nonce") != nonce:
            return

        spawned_by = record.get("spawned_by")
        owner_pid = record.get("owner_pid")
        adopters = [
            int(pid)
            for pid in record.get("adopters", [])
            if isinstance(pid, int) and int(pid) != os.getpid() and _pid_alive(int(pid))
        ]
        record["adopters"] = adopters

        should_terminate = bool(_state.get("owned"))
        if spawned_by == "agent":
            owner_alive_elsewhere = (
                isinstance(owner_pid, int)
                and owner_pid != os.getpid()
                and _pid_alive(owner_pid)
            )
            should_terminate = not owner_alive_elsewhere and not adopters
        elif not _state.get("owned"):
            should_terminate = False

        if should_terminate:
            pid = int(record["pid"])
            proc = _state.get("proc")
            if proc is not None and proc.pid == pid:
                proc.terminate()
                try:
                    await asyncio.wait_for(proc.wait(), timeout=2.0)
                except asyncio.TimeoutError:
                    pass
                await asyncio.gather(
                    *_state.get("drain_tasks", []), return_exceptions=True
                )
            else:
                try:
                    os.kill(pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                deadline = time.monotonic() + 2.0
                while _pid_alive(pid) and time.monotonic() < deadline:
                    await asyncio.sleep(0.02)
            current = _read_record(directory)
            if current and current.get("nonce") == nonce:
                _portfile_path(directory).unlink(missing_ok=True)
        elif spawned_by == "agent":
            _write_record(directory, record)
    finally:
        _release_lifecycle_lock(lock_fd)

    _state.update(
        {
            "proc": None,
            "port": None,
            "nonce": None,
            "operator_secret": None,
            "owned": False,
            "spawned_by": None,
            "state_dir": None,
            "drain_tasks": [],
        }
    )


def shutdown_owned_sidecar() -> None:
    loop = _runtime_loop
    if loop is None or not loop.is_running():
        return
    future = asyncio.run_coroutine_threadsafe(_shutdown_owned_sidecar_impl(), loop)
    try:
        future.result(timeout=5.0)
    except Exception as exc:  # pragma: no cover - exit/unload best effort
        log.warning("boardstate: sidecar shutdown did not complete (%s)", type(exc).__name__)

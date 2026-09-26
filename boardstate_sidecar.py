"""Shared Boardstate sidecar lifecycle for the agent and dashboard halves.

The sidecar is a single writer for one Boardstate state directory.  Both plugin
surfaces adopt it through a mode-0600 port record.  A dashboard caller replaces
an agent-owned sidecar so live Hermes data and the in-memory operator credential
are available, while the on-disk workspace remains untouched.
"""

from __future__ import annotations

import asyncio
import atexit
import contextlib
import errno
import json
import logging
import os
import secrets
import shutil
import sys
import threading
import time
import urllib.error
import urllib.request
from collections.abc import Iterator, MutableMapping
from pathlib import Path
from typing import Any, Literal, Optional

log = logging.getLogger(__name__)

SpawnedBy = Literal["dashboard", "agent"]

_ROOT = Path(__file__).resolve().parent
_SIDECAR_JS = _ROOT / "dashboard" / "sidecar" / "server.js"
_states: dict[str, dict[str, Any]] = {}
_sidecar_locks: dict[str, asyncio.Lock] = {}
_atexit_registered = False
_runtime_loop: Optional[asyncio.AbstractEventLoop] = None
_runtime_loop_guard = threading.Lock()
_NATIVE_HTTP_TIMEOUT_SECONDS = 30
_NATIVE_CONFIRM_TIMEOUT_MS = 25_000
_SIDECAR_DRAIN_WAIT_SECONDS = 35.0
_ATEXIT_DRAIN_WAIT_SECONDS = 5.0
# A sidecar that closed its listener is draining: it exits once accepted calls settle, or at
# its 30 s fail-safe. A record pid that is alive with a closed port for longer than this is not
# a Boardstate sidecar (the pid was reused); its record is dropped and the pid never signalled.
_STALE_RECORD_WAIT_SECONDS = _SIDECAR_DRAIN_WAIT_SECONDS
# Sidecar traffic is loopback-only and carries the nonce; never route it through an
# HTTP(S)_PROXY from the environment.
_DIRECT_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

try:
    import fcntl

    _HAVE_FCNTL = True
except ImportError:  # pragma: no cover - Windows is best-effort
    fcntl = None  # type: ignore[assignment]
    _HAVE_FCNTL = False

try:
    import msvcrt

    _HAVE_MSVCRT = True
except ImportError:  # pragma: no cover - POSIX
    msvcrt = None  # type: ignore[assignment]
    _HAVE_MSVCRT = False


def state_dir() -> Path:
    override = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
    if override:
        return Path(override)
    try:
        from hermes_constants import get_hermes_home
    except ImportError:
        hermes_home = os.environ.get("HERMES_HOME")
        base = Path(hermes_home) if hermes_home else (Path.home() / ".hermes")
    else:
        base = Path(get_hermes_home())
    return base / "boardstate-state"


def _state_key(directory: Path) -> str:
    return os.path.normcase(str(directory.expanduser().resolve(strict=False)))


def _new_state(directory: Path) -> dict[str, Any]:
    return {
        "proc": None,
        "port": None,
        "nonce": None,
        "operator_secret": None,
        "owned": False,
        "spawned_by": None,
        "state_dir": directory,
        "drain_tasks": [],
    }


def _state_for(directory: Optional[Path] = None) -> dict[str, Any]:
    selected = directory or state_dir()
    key = _state_key(selected)
    state = _states.get(key)
    if state is None:
        state = _new_state(selected)
        _states[key] = state
    return state


def _sidecar_lock_for(directory: Path) -> asyncio.Lock:
    key = _state_key(directory)
    lock = _sidecar_locks.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _sidecar_locks[key] = lock
    return lock


class _CurrentStateProxy(MutableMapping[str, Any]):
    """Compatibility view used by plugin_api, resolved to the active profile."""

    def __getitem__(self, key: str) -> Any:
        return _state_for()[key]

    def __setitem__(self, key: str, value: Any) -> None:
        _state_for()[key] = value

    def __delitem__(self, key: str) -> None:
        del _state_for()[key]

    def __iter__(self) -> Iterator[str]:
        return iter(_state_for())

    def __len__(self) -> int:
        return len(_state_for())


_state: MutableMapping[str, Any] = _CurrentStateProxy()


class BoardstateUnavailable(RuntimeError):
    """A setup problem the agent should see verbatim (missing Node or plugin files)."""


NODE_MISSING_MESSAGE = "Boardstate needs Node.js >= 20 on PATH (or set HERMES_NODE_BIN)"


def _plugin_files_missing_message() -> str:
    message = (
        "Boardstate plugin files are missing (removed or mid-update); "
        "restart the session or reinstall"
    )
    if (_ROOT / ".git").exists():
        message += f" (in a git checkout, run `npm ci && npm run build` in {_ROOT})"
    return message


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
    lock_fd = os.open(str(_lockfile_path(directory)), os.O_CREAT | os.O_RDWR, 0o600)
    try:
        if _HAVE_FCNTL:
            while True:
                try:
                    fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except BlockingIOError:
                    await asyncio.sleep(0.02)
        elif _HAVE_MSVCRT:
            if os.fstat(lock_fd).st_size == 0:
                os.write(lock_fd, b"0")
            while True:
                os.lseek(lock_fd, 0, os.SEEK_SET)
                try:
                    msvcrt.locking(lock_fd, msvcrt.LK_NBLCK, 1)
                    break
                except OSError as exc:
                    if exc.errno not in {errno.EACCES, errno.EAGAIN, errno.EDEADLK}:
                        raise
                    await asyncio.sleep(0.02)
        else:  # pragma: no cover - every supported runtime has one backend
            raise RuntimeError("no cross-process lifecycle lock is available")
    except BaseException:
        os.close(lock_fd)
        raise
    return lock_fd


def _acquire_lifecycle_lock_sync(directory: Path) -> Optional[int]:
    """Take the lifecycle lock without an executor (safe during atexit)."""
    lock_fd = os.open(str(_lockfile_path(directory)), os.O_CREAT | os.O_RDWR, 0o600)
    try:
        if _HAVE_FCNTL:
            fcntl.flock(lock_fd, fcntl.LOCK_EX)
        elif _HAVE_MSVCRT:
            if os.fstat(lock_fd).st_size == 0:
                os.write(lock_fd, b"0")
            os.lseek(lock_fd, 0, os.SEEK_SET)
            msvcrt.locking(lock_fd, msvcrt.LK_LOCK, 1)
        else:  # pragma: no cover - every supported runtime has one backend
            raise RuntimeError("no cross-process lifecycle lock is available")
    except BaseException:
        os.close(lock_fd)
        raise
    return lock_fd


def _release_lifecycle_lock(lock_fd: Optional[int]) -> None:
    if lock_fd is None:
        return
    try:
        if _HAVE_FCNTL:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)
        elif _HAVE_MSVCRT:
            os.lseek(lock_fd, 0, os.SEEK_SET)
            msvcrt.locking(lock_fd, msvcrt.LK_UNLCK, 1)
    finally:
        os.close(lock_fd)


def _win_pid_alive(pid: int) -> bool:
    # os.kill(pid, 0) is NOT a probe on Windows: CPython routes every non-console
    # signal through TerminateProcess, so "checking" a pid would kill it. Query
    # the process handle instead.
    import ctypes
    from ctypes import wintypes

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
    kernel32.GetExitCodeProcess.restype = wintypes.BOOL
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL

    process_query_limited_information = 0x1000
    still_active = 259
    error_access_denied = 5
    handle = kernel32.OpenProcess(process_query_limited_information, False, pid)
    if not handle:
        # Access denied means the process exists but belongs to someone else.
        return ctypes.get_last_error() == error_access_denied
    try:
        exit_code = wintypes.DWORD()
        if not kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code)):
            return True
        return exit_code.value == still_active
    finally:
        kernel32.CloseHandle(handle)


def _pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if os.name == "nt":
        return _win_pid_alive(pid)
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return False
    if sys.platform.startswith("linux") and _linux_pid_is_zombie(pid):
        # A signalled sidecar whose reaper never waits (e.g. a container init that does not
        # reap orphans) stays a zombie forever; it has exited and must count as gone.
        return False
    return True


def _linux_pid_is_zombie(pid: int) -> bool:
    try:
        stat = Path(f"/proc/{pid}/stat").read_text(encoding="utf-8", errors="replace")
        # The state field follows the parenthesised command name, which may contain ")".
        return stat.rsplit(")", 1)[1].split()[0] in {"Z", "X"}
    except (OSError, IndexError):
        return False


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


def _probe_record_sync(port: int, nonce: str) -> bool:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/internal/healthz?nonce={nonce}",
        headers={"Accept": "application/json"},
        method="GET",
    )
    try:
        with _DIRECT_OPENER.open(request, timeout=1.0) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return False
    return response.status == 200 and payload == {"ok": True}


async def _probe_record(record: dict[str, Any]) -> bool:
    return await asyncio.to_thread(
        _probe_record_sync,
        int(record["port"]),
        str(record["nonce"]),
    )


def _read_raw_record(directory: Path) -> Optional[dict[str, Any]]:
    try:
        record = json.loads(_portfile_path(directory).read_text(encoding="utf-8"))
    except Exception:
        return None
    if not isinstance(record, dict):
        return None
    return record


def _read_record(directory: Path) -> Optional[dict[str, Any]]:
    record = _read_raw_record(directory)
    if record is None:
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
    # Write a complete generation beside the record and rename it into place, so a crash
    # mid-write can never leave a truncated record that blocks every later start.
    path = _portfile_path(directory)
    tmp = path.with_name(f"{path.name}.{os.getpid()}.{secrets.token_hex(4)}.tmp")
    fd = os.open(str(tmp), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(json.dumps(record, separators=(",", ":")))
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, path)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
    try:
        os.chmod(path, 0o600)
    except OSError:  # pragma: no cover - best effort on Windows
        pass


async def _try_adopt(directory: Path) -> Optional[dict[str, Any]]:
    record = _read_record(directory)
    if record is None or not _pid_alive(int(record["pid"])):
        return None
    if not await _probe_record(record):
        if await _port_listening(int(record["port"])):
            raise RuntimeError(
                "Boardstate sidecar identity probe failed; refusing to signal or replace the live process"
            )
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
    """HERMES_NODE_BIN, then Hermes' own Node resolver when available, then PATH."""
    override = os.environ.get("HERMES_NODE_BIN")
    if override:
        return override
    try:
        from hermes_constants import find_node_executable
    except ImportError:
        find_node_executable = None
    if find_node_executable is not None:
        try:
            resolved = find_node_executable("node")
        except Exception:  # pragma: no cover - resolver is best effort
            resolved = None
        if resolved:
            return resolved
    resolved = shutil.which("node")
    if not resolved:
        raise BoardstateUnavailable(NODE_MISSING_MESSAGE)
    return resolved


def _register_atexit() -> None:
    global _atexit_registered
    if not _atexit_registered:
        atexit.register(_shutdown_all_owned_sidecars)
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
            loop.call_soon(ready.set)
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
    state = _state_for(directory)
    nonce = secrets.token_urlsafe(32)
    generated_operator_secret = secrets.token_urlsafe(32)
    env = os.environ.copy()
    env.update(extra_env or {})
    env["BOARDSTATE_STATE_DIR"] = str(directory)
    env["BOARDSTATE_SIDECAR_NONCE"] = nonce
    # Only a dashboard-owned sidecar gets an operator secret. An agent-owned one must not
    # carry any: the agent could read it back from the child's environment (/proc/<pid>/environ)
    # and approve its own pending actions. Without it the sidecar's /operator plane stays disabled.
    env.pop("BOARDSTATE_OPERATOR_SECRET", None)
    if spawned_by == "dashboard":
        env["BOARDSTATE_OPERATOR_SECRET"] = generated_operator_secret
    env["BOARDSTATE_SPAWNED_BY"] = spawned_by
    # The sidecar's owner watchdog falls back to this pid until the port record names it.
    env["BOARDSTATE_OWNER_PID"] = str(os.getpid())
    env["PORT"] = "0"

    log_fd = os.open(
        str(directory / ".boardstate-sidecar.log"),
        os.O_WRONLY | os.O_CREAT | os.O_APPEND,
        0o600,
    )
    try:
        proc = await asyncio.create_subprocess_exec(
            _node_bin(),
            str(_SIDECAR_JS),
            stdout=asyncio.subprocess.PIPE,
            stderr=log_fd,
            env=env,
            start_new_session=os.name != "nt",
        )
    except (FileNotFoundError, PermissionError) as exc:
        raise BoardstateUnavailable(NODE_MISSING_MESSAGE) from exc
    finally:
        os.close(log_fd)
    try:
        port = await _read_port(proc)
        state.update(
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
    except BaseException:
        # Cancelled or failed before the record and exit hook exist: a child left running
        # here is an untracked second writer, so stop it, wait for it, and forget it.
        try:
            with contextlib.suppress(ProcessLookupError):
                proc.terminate()
            await asyncio.wait_for(proc.wait(), timeout=_ATEXIT_DRAIN_WAIT_SECONDS)
        except Exception:
            with contextlib.suppress(ProcessLookupError):
                proc.kill()
        finally:
            state.update(_new_state(directory))
        raise
    state["drain_tasks"] = [asyncio.create_task(_drain(proc.stdout, "out"))]
    _register_atexit()
    log.info(
        "boardstate: %s sidecar up on 127.0.0.1:%d (state %s)",
        spawned_by,
        port,
        directory,
    )
    return port, nonce


async def _terminate_record(directory: Path, record: dict[str, Any]) -> None:
    state = _state_for(directory)
    pid = int(record["pid"])
    port = int(record["port"])
    nonce = str(record["nonce"])
    proc = state.get("proc")
    own_live_child = bool(
        proc is not None
        and getattr(proc, "pid", None) == pid
        and getattr(proc, "returncode", 0) is None
    )
    shutdown_result = await asyncio.to_thread(
        _request_shutdown_sync,
        port,
        nonce,
    )

    if shutdown_result == "accepted":
        stopped = await _wait_record_exit(pid, proc, _SIDECAR_DRAIN_WAIT_SECONDS)
        if not stopped:
            raise RuntimeError(
                "existing Boardstate sidecar did not stop after authenticated shutdown"
            )
    elif shutdown_result == "unreachable" and own_live_child:
        proc.terminate()
        stopped = await _wait_record_exit(pid, proc, _SIDECAR_DRAIN_WAIT_SECONDS)
        if not stopped:
            raise RuntimeError(
                "agent-owned Boardstate sidecar did not stop after SIGTERM"
            )
    elif not _pid_alive(pid):
        stopped = True
    elif shutdown_result == "unreachable" and await _wait_record_exit(
        pid, None, _STALE_RECORD_WAIT_SECONDS
    ):
        # The sidecar was already stopping itself (its owner watchdog closes the listener
        # before exiting); wait for that exit instead of calling it unverifiable.
        stopped = True
    else:
        if shutdown_result == "rejected":
            raise RuntimeError(
                "existing Boardstate sidecar rejected authenticated shutdown; "
                "not signalling an unverified pid"
            )
        raise RuntimeError(
            "existing Boardstate sidecar did not stop; not signalling an unverified pid"
        )

    if own_live_child:
        await proc.wait()
        await asyncio.gather(*state.get("drain_tasks", []), return_exceptions=True)
    _drop_record_if_current(directory, nonce)


def _request_shutdown_sync(port: int, nonce: str) -> Literal["accepted", "rejected", "unreachable"]:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/internal/shutdown?nonce={nonce}",
        data=b"",
        headers={"Accept": "application/json"},
        method="POST",
    )
    try:
        with _DIRECT_OPENER.open(request, timeout=1.0) as response:
            response.read()
            return "accepted" if response.status == 202 else "rejected"
    except urllib.error.HTTPError as exc:
        exc.read()
        return "rejected"
    except (urllib.error.URLError, TimeoutError, ConnectionError, OSError):
        return "unreachable"


async def _wait_record_exit(pid: int, proc: Any, timeout: float) -> bool:
    deadline = asyncio.get_running_loop().time() + timeout
    while asyncio.get_running_loop().time() < deadline:
        if proc is not None and getattr(proc, "pid", None) == pid:
            if getattr(proc, "returncode", None) is not None:
                return True
        elif not _pid_alive(pid):
            return True
        await asyncio.sleep(0.05)
    if proc is not None and getattr(proc, "pid", None) == pid:
        return getattr(proc, "returncode", None) is not None
    return not _pid_alive(pid)


def _drop_record_if_current(directory: Path, nonce: str) -> None:
    current = _read_record(directory)
    if current and current.get("nonce") == nonce:
        _portfile_path(directory).unlink(missing_ok=True)


def _remember_adoption(directory: Path, record: dict[str, Any], caller: SpawnedBy) -> None:
    state = _state_for(directory)
    if caller == "agent" and record.get("spawned_by") == "agent":
        adopters = [
            int(pid)
            for pid in record.get("adopters", [])
            if isinstance(pid, int) and _pid_alive(int(pid)) and int(pid) != os.getpid()
        ]
        adopters.append(os.getpid())
        record["adopters"] = adopters
        _write_record(directory, record)
    state.update(
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

    directory = state_dir()
    state = _state_for(directory)
    async with _sidecar_lock_for(directory):
        if not _SIDECAR_JS.exists():
            raise BoardstateUnavailable(_plugin_files_missing_message())
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)

        lock_fd = await _acquire_lifecycle_lock(directory)
        try:
            record_path = _portfile_path(directory)
            raw_record = _read_raw_record(directory)
            if record_path.exists() and raw_record is None:
                raise RuntimeError(
                    f"unrecognized Boardstate sidecar record at {record_path}; refusing to "
                    "overwrite it (delete the file if no Boardstate sidecar is running)"
                )
            if raw_record is not None and _read_record(directory) is None:
                raw_pid = raw_record.get("pid")
                raw_port = raw_record.get("port")
                live_legacy = bool(
                    (isinstance(raw_pid, int) and _pid_alive(raw_pid))
                    or (isinstance(raw_port, int) and await _port_listening(raw_port))
                )
                if live_legacy:
                    raise RuntimeError(
                        "live legacy Boardstate sidecar record detected; stop the old sidecar before retrying"
                    )
                record_path.unlink(missing_ok=True)

            current_port = state.get("port")
            current_nonce = state.get("nonce")
            current_dir = state.get("state_dir")
            cached_record = _read_record(directory)
            cached_matches = bool(
                current_port
                and current_nonce
                and current_dir == directory
                and cached_record
                and cached_record.get("port") == current_port
                and cached_record.get("nonce") == current_nonce
                and _pid_alive(int(cached_record["pid"]))
                and await _probe_record(cached_record)
            )
            if cached_matches and not (
                caller == "dashboard" and state.get("spawned_by") == "agent"
            ):
                return int(current_port), str(current_nonce)
            if current_port and not cached_matches:
                current_proc = state.get("proc")
                keep_owned_state = bool(
                    cached_record
                    and getattr(current_proc, "pid", None) == cached_record.get("pid")
                    and getattr(current_proc, "returncode", 0) is None
                )
                if not keep_owned_state:
                    state.update(
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

            record = await _try_adopt(directory)
            if record is None:
                candidate = _read_record(directory)
                if candidate is not None and _pid_alive(int(candidate["pid"])):
                    # Live pid, closed port: either our sidecar draining after its listener
                    # closed, or an unrelated process that reused the pid. Wait out the drain
                    # bound, then treat the record as stale. Never signal the pid.
                    stale_pid = int(candidate["pid"])
                    own_proc = state.get("proc")
                    if not await _wait_record_exit(
                        stale_pid,
                        own_proc if getattr(own_proc, "pid", None) == stale_pid else None,
                        _STALE_RECORD_WAIT_SECONDS,
                    ):
                        log.warning(
                            "boardstate: pid %d in the port record is alive but serves no "
                            "sidecar; dropping the stale record without signalling it",
                            stale_pid,
                        )
                    _drop_record_if_current(directory, str(candidate["nonce"]))
            active_record = record
            owner_pid = active_record.get("owner_pid") if active_record else None
            live_adopters = [
                int(pid)
                for pid in (active_record or {}).get("adopters", [])
                if isinstance(pid, int) and _pid_alive(int(pid))
            ]
            owner_is_dead = bool(
                active_record
                and (
                    not isinstance(owner_pid, int)
                    or (owner_pid != os.getpid() and not _pid_alive(owner_pid))
                )
            )
            if active_record and (
                (owner_is_dead and not live_adopters)
                or (caller == "dashboard" and active_record.get("spawned_by") == "agent")
            ):
                await _terminate_record(directory, active_record)
                record = None
                state.update(
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
                own_proc = state.get("proc")
                if (
                    state.get("owned")
                    and current_port
                    and current_nonce
                    and current_nonce == record.get("nonce")
                    and getattr(own_proc, "pid", None) == record.get("pid")
                    and getattr(own_proc, "returncode", 0) is None
                ):
                    return int(current_port), str(current_nonce)
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
        with _DIRECT_OPENER.open(request, timeout=_NATIVE_HTTP_TIMEOUT_SECONDS) as response:
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
        {
            "name": name,
            "args": args,
            "timeoutMs": _NATIVE_CONFIRM_TIMEOUT_MS,
        },
    )
    if "result" in payload:
        return payload["result"]
    return {"error": str(payload.get("error") or "Boardstate tool failed")}


async def invoke_tool(name: str, args: dict[str, Any]) -> Any:
    return await _on_runtime_loop(_invoke_tool_impl(name, args))


def _wait_pid_exit_sync(pid: int, timeout: float) -> bool:
    deadline = time.monotonic() + timeout
    while _pid_alive(pid) and time.monotonic() < deadline:
        time.sleep(0.02)
    return not _pid_alive(pid)


def _shutdown_owned_sidecar_sync(directory: Optional[Path] = None) -> None:
    """Release this process without asyncio or executors, including during atexit."""
    selected = directory or state_dir()
    state = _state_for(selected)
    directory = state.get("state_dir")
    nonce = state.get("nonce")
    if not isinstance(directory, Path) or not nonce:
        return

    # Shutdown must participate in the same transaction as adoption/spawn.  In
    # particular, an adopter cannot publish itself after we decide to reap, and a
    # starter cannot observe the record while we rewrite it for surviving adopters.
    lock_fd = _acquire_lifecycle_lock_sync(directory)
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

        should_terminate = bool(state.get("owned"))
        if spawned_by == "agent":
            owner_alive_elsewhere = (
                isinstance(owner_pid, int)
                and owner_pid != os.getpid()
                and _pid_alive(owner_pid)
            )
            should_terminate = not owner_alive_elsewhere and not adopters
        elif not state.get("owned"):
            should_terminate = False

        pid = int(record["pid"])
        if should_terminate:
            shutdown_result = _request_shutdown_sync(int(record["port"]), nonce)
            proc = state.get("proc")
            own_live_child = bool(
                proc is not None
                and getattr(proc, "pid", None) == pid
                and getattr(proc, "returncode", 0) is None
            )
            if shutdown_result == "accepted":
                stopped = _wait_pid_exit_sync(pid, _ATEXIT_DRAIN_WAIT_SECONDS)
            elif shutdown_result == "unreachable" and own_live_child:
                proc.terminate()
                stopped = _wait_pid_exit_sync(pid, _ATEXIT_DRAIN_WAIT_SECONDS)
            elif not _pid_alive(pid):
                stopped = True
            else:
                stopped = False
                log.warning(
                    "boardstate: sidecar pid %d did not accept authenticated shutdown; "
                    "not signalling it",
                    pid,
                )
            if stopped:
                _drop_record_if_current(directory, nonce)
            else:
                log.warning(
                    "boardstate: sidecar %d survived shutdown; preserving its record",
                    pid,
                )
        elif spawned_by == "agent":
            if owner_pid == os.getpid() and adopters:
                record["owner_pid"] = adopters.pop(0)
                record["adopters"] = adopters
            _write_record(directory, record)
    finally:
        _release_lifecycle_lock(lock_fd)

    state.update(
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


def _shutdown_all_owned_sidecars() -> None:
    for state in list(_states.values()):
        directory = state.get("state_dir")
        if not isinstance(directory, Path):
            continue
        try:
            _shutdown_owned_sidecar_sync(directory)
        except Exception as exc:  # pragma: no cover - exit best effort per profile
            log.warning(
                "boardstate: sidecar shutdown did not complete for %s (%s)",
                directory,
                type(exc).__name__,
            )


def shutdown_owned_sidecar() -> None:
    try:
        _shutdown_owned_sidecar_sync()
    except Exception as exc:  # pragma: no cover - exit/unload best effort
        log.warning("boardstate: sidecar shutdown did not complete (%s)", type(exc).__name__)

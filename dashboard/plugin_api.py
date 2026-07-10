"""Boardstate dashboard plugin — backend API routes.

Mounted at ``/api/plugins/boardstate/`` by the Hermes dashboard plugin system.

This layer does two things:

1. **Sidecar lifecycle.** On first use it spawns exactly one Node sidecar
   (``sidecar/server.js`` — a self-contained bundle of ``@boardstate/server``'s
   control plane over an fs-backed store) bound to an ephemeral loopback port, and
   reaps it on dashboard exit. The sidecar owns the Boardstate control plane; this
   process never re-implements it.

2. **WebSocket bridge.** ``/api/plugins/boardstate/ws`` is the browser-facing,
   authenticated endpoint the plugin's ``<boardstate-view>`` connects to via the SDK
   ``buildWsUrl`` + ``createWsTransport``. Each accepted upgrade opens a client
   WebSocket to the loopback sidecar and relays JSON text frames verbatim in both
   directions. The wire format is symmetric ({id,method,params} / {id,result|error}
   / {event,payload}), so the bridge is a transparent byte-for-byte relay.

WHY A PROXY (not a direct browser→sidecar connection)
-----------------------------------------------------
The browser connects to the *dashboard origin*, so:

* Auth is the dashboard's canonical WS gate (``web_server._ws_auth_ok``) — the same
  gate kanban's live-events WS uses. It transparently accepts the right credential in
  every mode: loopback ``?token=``, gated single-use ``?ticket=``, server-internal
  ``?internal=``. No bespoke sidecar token scheme, and it works under ``--host`` /
  gated OAuth / HTTPS where a direct ``ws://127.0.0.1:<port>`` from the page would be
  blocked (mixed content) or unreachable. The sidecar binds loopback-only and is
  never exposed to the browser.

Security note
-------------
``/api/plugins/*`` requests are gated by the dashboard's plugin-enable allow-list
(``plugins.enabled``) and, for the WS upgrade, by ``_ws_upgrade_authorized`` below.
The sidecar listens on ``127.0.0.1`` only and receives traffic solely from this
in-process bridge.
"""

from __future__ import annotations

import asyncio
import atexit
import json
import logging
import os
import shutil
from pathlib import Path
from typing import Optional

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status as http_status

log = logging.getLogger(__name__)

router = APIRouter()

_DASHBOARD_DIR = Path(__file__).resolve().parent
_SIDECAR_JS = _DASHBOARD_DIR / "sidecar" / "server.js"

# One sidecar per dashboard process, guarded by a lock so concurrent first-connects
# don't race two node processes into existence.
_sidecar_lock = asyncio.Lock()
_sidecar: dict = {"proc": None, "port": None}
_atexit_registered = False


def _state_dir() -> Path:
    """Where the sidecar keeps board state. Honors an explicit override, else a
    per-HERMES_HOME directory so isolated dashboards don't share a board."""
    override = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
    if override:
        return Path(override)
    hermes_home = os.environ.get("HERMES_HOME")
    base = Path(hermes_home) if hermes_home else (Path.home() / ".hermes")
    return base / "boardstate-state"


def _node_bin() -> str:
    return os.environ.get("HERMES_NODE_BIN") or shutil.which("node") or "node"


# ---------------------------------------------------------------------------
# WebSocket auth — delegate to the dashboard's canonical gate (see kanban).
# ---------------------------------------------------------------------------

def _ws_upgrade_authorized(ws: "WebSocket") -> bool:
    """Authorize a WS upgrade via ``hermes_cli.web_server._ws_auth_ok`` so the right
    credential is accepted in every mode. Older dashboards without the gate fall back
    to accept (loopback-only anyway)."""
    try:
        from hermes_cli import web_server as _ws  # local import: avoid load-order coupling
    except Exception:  # pragma: no cover - dashboard internals unavailable
        return True
    checker = getattr(_ws, "_ws_auth_ok", None)
    if checker is None:
        return True
    try:
        return bool(checker(ws))
    except Exception as exc:  # pragma: no cover - defensive
        log.warning("boardstate: WS auth check failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Sidecar lifecycle.
# ---------------------------------------------------------------------------

async def _drain(stream: Optional[asyncio.StreamReader], label: str) -> None:
    if stream is None:
        return
    try:
        while True:
            line = await stream.readline()
            if not line:
                return
            log.info("boardstate-sidecar[%s]: %s", label, line.decode(errors="replace").rstrip())
    except Exception:  # pragma: no cover - best-effort logging
        return


async def _read_port(proc: "asyncio.subprocess.Process") -> int:
    """Read the sidecar's announced port from its stdout JSON handshake line."""
    assert proc.stdout is not None
    while True:
        line = await asyncio.wait_for(proc.stdout.readline(), timeout=20.0)
        if not line:
            raise RuntimeError("boardstate sidecar exited before announcing its port")
        try:
            data = json.loads(line.decode().strip())
        except Exception:
            continue  # non-JSON log noise before the handshake
        info = data.get("boardstateSidecar") if isinstance(data, dict) else None
        if isinstance(info, dict) and "port" in info:
            return int(info["port"])


def _kill_sidecar() -> None:
    proc = _sidecar.get("proc")
    if proc is not None and proc.returncode is None:
        try:
            proc.terminate()
        except Exception:
            pass


async def _ensure_sidecar() -> int:
    global _atexit_registered
    async with _sidecar_lock:
        proc = _sidecar.get("proc")
        if proc is not None and proc.returncode is None and _sidecar.get("port"):
            return int(_sidecar["port"])

        if not _SIDECAR_JS.exists():
            raise RuntimeError(f"boardstate sidecar bundle missing: {_SIDECAR_JS} (run the build)")

        state_dir = _state_dir()
        state_dir.mkdir(parents=True, exist_ok=True)

        env = os.environ.copy()
        env["BOARDSTATE_STATE_DIR"] = str(state_dir)
        env.setdefault("PORT", "0")  # ephemeral loopback port

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
            try:
                proc.terminate()
            except Exception:
                pass
            raise

        _sidecar["proc"] = proc
        _sidecar["port"] = port
        # Keep draining both streams so the pipe buffers never fill and stall node.
        asyncio.create_task(_drain(proc.stdout, "out"))
        asyncio.create_task(_drain(proc.stderr, "err"))
        if not _atexit_registered:
            atexit.register(_kill_sidecar)
            _atexit_registered = True
        log.info("boardstate: sidecar up on 127.0.0.1:%d (state %s)", port, state_dir)
        return port


# ---------------------------------------------------------------------------
# HTTP: a small health/status probe for verification + debugging.
# ---------------------------------------------------------------------------

@router.get("/health")
async def health() -> dict:
    proc = _sidecar.get("proc")
    running = proc is not None and proc.returncode is None
    return {
        "ok": True,
        "sidecar_running": running,
        "sidecar_port": _sidecar.get("port"),
        "state_dir": str(_state_dir()),
        "bundle_present": _SIDECAR_JS.exists(),
    }


# ---------------------------------------------------------------------------
# WebSocket: authenticated browser endpoint bridged to the loopback sidecar.
# ---------------------------------------------------------------------------

@router.websocket("/ws")
async def board_ws(ws: WebSocket) -> None:
    # Authorize the upgrade via the dashboard's canonical WS gate (browsers can't set
    # Authorization on an upgrade, so the credential rides in the query string that
    # the SDK buildWsUrl() assembled).
    if not _ws_upgrade_authorized(ws):
        await ws.close(code=http_status.WS_1008_POLICY_VIOLATION)
        return

    await ws.accept()

    try:
        port = await _ensure_sidecar()
    except Exception as exc:
        log.warning("boardstate: sidecar unavailable: %s", exc)
        await ws.close(code=http_status.WS_1011_INTERNAL_ERROR)
        return

    uri = f"ws://127.0.0.1:{port}/ws"
    try:
        async with websockets.connect(uri, max_size=2 ** 20) as upstream:
            await _bridge(ws, upstream)
    except WebSocketDisconnect:
        return
    except asyncio.CancelledError:
        return
    except Exception as exc:  # defensive: never crash the dashboard worker
        log.warning("boardstate: bridge error: %s", exc)
        try:
            await ws.close(code=http_status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass


async def _bridge(ws: "WebSocket", upstream) -> None:
    """Relay JSON text frames verbatim in both directions until either side closes."""

    async def client_to_sidecar() -> None:
        while True:
            msg = await ws.receive_text()
            await upstream.send(msg)

    async def sidecar_to_client() -> None:
        async for msg in upstream:
            if isinstance(msg, (bytes, bytearray)):
                msg = msg.decode("utf-8", errors="replace")
            await ws.send_text(msg)

    tasks = {asyncio.create_task(client_to_sidecar()), asyncio.create_task(sidecar_to_client())}
    try:
        _done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

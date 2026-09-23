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

* Auth is the dashboard's canonical WS gate (``web_server_chat._ws_auth_ok`` plus
  its request-boundary check when available) — the same gate the dashboard's own
  sockets use. It transparently accepts the right credential in every mode: loopback
  ``?token=``, gated single-use ``?ticket=``, server-internal ``?internal=``. No
  bespoke sidecar token scheme, and it works under ``--host`` / gated OAuth / HTTPS
  where a direct ``ws://127.0.0.1:<port>`` from the page would be blocked (mixed
  content) or unreachable. The sidecar binds loopback-only and is never exposed to
  the browser.

Security note
-------------
``/api/plugins/*`` requests are gated by the dashboard's plugin-enable allow-list
(``plugins.enabled``) and, for the WS upgrade, by ``_ws_upgrade_authorized`` below.
The sidecar listens on ``127.0.0.1`` only and receives traffic solely from this
in-process bridge.
"""

from __future__ import annotations

import asyncio
import importlib
import importlib.util
import json
import logging
import os
import secrets
import sys
from pathlib import Path
from typing import Optional

import httpx
import websockets
from fastapi import APIRouter, Request, Response, WebSocket, WebSocketDisconnect, status as http_status
from fastapi.responses import JSONResponse, StreamingResponse

log = logging.getLogger(__name__)

router = APIRouter()

_DASHBOARD_DIR = Path(__file__).resolve().parent
_RUNTIME_NAME = "_boardstate_shared_sidecar_runtime_v150"
_runtime_path = _DASHBOARD_DIR.parent / "boardstate_sidecar.py"
_runtime = sys.modules.get(_RUNTIME_NAME)
if _runtime is None:
    _runtime_spec = importlib.util.spec_from_file_location(_RUNTIME_NAME, _runtime_path)
    if _runtime_spec is None or _runtime_spec.loader is None:
        raise RuntimeError("could not load Boardstate sidecar runtime")
    _runtime = importlib.util.module_from_spec(_runtime_spec)
    sys.modules[_RUNTIME_NAME] = _runtime
    _runtime_spec.loader.exec_module(_runtime)

_SIDECAR_JS = _runtime.sidecar_bundle()
_sidecar = _runtime._state
_portfile_path = _runtime._portfile_path
_pid_alive = _runtime._pid_alive
_port_listening = _runtime._port_listening
_try_adopt = _runtime._try_adopt
_read_port = _runtime._read_port
_spawn_sidecar = _runtime._spawn_sidecar
_state_dir = _runtime.state_dir
_kill_sidecar = _runtime.shutdown_owned_sidecar


def _hermes_data_credentials() -> tuple[Optional[str], Optional[str]]:
    """Best-effort dashboard base URL + session token for the sidecar's Hermes REST
    data resolver. Reads the dashboard's own loopback session token + bound port from
    ``hermes_cli.web_server``. Returns (None, None) if unavailable (older dashboard,
    gated/OAuth mode, or import failure) — the sidecar then serves no live Hermes data.
    """
    try:
        from hermes_cli import web_server as _ws  # local import: avoid load-order coupling

        token = getattr(_ws, "_SESSION_TOKEN", None)
        app = getattr(_ws, "app", None)
        port = getattr(getattr(app, "state", None), "bound_port", None)
        # Only the loopback token path is wired here; gated/OAuth data-fetch is a
        # follow-up (would use the process-internal credential instead).
        if token and port:
            return f"http://127.0.0.1:{int(port)}", str(token)
    except Exception as exc:  # pragma: no cover - dashboard internals unavailable
        log.info("boardstate: Hermes data credentials unavailable (%s); live data off", exc)
    return None, None


# ---------------------------------------------------------------------------
# WebSocket auth — delegate to the dashboard's canonical gate (see kanban).
# ---------------------------------------------------------------------------

def _ws_upgrade_authorized(ws: "WebSocket") -> bool:
    """Authorize through Hermes' canonical WS gates, failing closed if unavailable."""
    for module_name in ("hermes_cli.web_server_chat", "hermes_cli.web_server"):
        try:
            auth_module = importlib.import_module(module_name)
        except Exception:  # pragma: no cover - compatibility probe
            continue

        auth_check = getattr(auth_module, "_ws_auth_ok", None)
        if not callable(auth_check):
            continue
        checks = [auth_check]
        request_check = getattr(auth_module, "_ws_request_is_allowed", None)
        if callable(request_check):
            checks.append(request_check)

        try:
            return all(bool(check(ws)) for check in checks)
        except Exception as exc:  # pragma: no cover - defensive
            # Do not include exception text: a checker may embed presented credentials.
            log.warning(
                "boardstate: Hermes WS check failed (%s); rejecting upgrade",
                type(exc).__name__,
            )
            return False

    log.warning("boardstate: Hermes WS auth gate unavailable; rejecting upgrade")
    return False


# ---------------------------------------------------------------------------
# Sidecar lifecycle.
# ---------------------------------------------------------------------------

async def _ensure_sidecar() -> tuple[int, str]:
    extra_env: dict[str, str] = {}
    hermes_url, hermes_token = _hermes_data_credentials()
    if hermes_url and hermes_token:
        extra_env["HERMES_DASHBOARD_URL"] = hermes_url
        extra_env["HERMES_SESSION_TOKEN"] = hermes_token
    return await _runtime.ensure_sidecar("dashboard", extra_env=extra_env)


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
# MCP: a stable, dashboard-authed route the Hermes agent connects to (as a
# `url:` MCP server, StreamableHTTP) so its boardstate_* tool calls build the
# board live. Requests are proxied to the sidecar's ephemeral-port /mcp with the
# per-spawn nonce appended — the agent reaches a STABLE URL, the sidecar stays
# loopback-only, and auth is the dashboard's own session-token gate on
# /api/plugins/*. Streamed so both JSON and SSE responses pass through.
# ---------------------------------------------------------------------------

# Custom-widget asset headers the sidecar sets and the proxy MUST preserve verbatim —
# the Content-Security-Policy is the widget sandbox's no-network jail (SPEC §11) and
# stripping it at the proxy would un-jail every custom widget in the browser.
_WIDGET_FWD_RESP_HEADERS = (
    "content-type",
    "content-security-policy",
    "x-content-type-options",
    "referrer-policy",
    "cache-control",
)


def _safe_asset_path(asset_path: str) -> Optional[str]:
    """Validate + re-encode an asset path for the upstream URL. Rejects traversal
    (`.`/`..`), backslashes, and empty segments so a crafted path can never normalize
    outside `/widgets` upstream; each accepted segment is percent-encoded."""
    from urllib.parse import quote

    segments = asset_path.split("/")
    if not segments or any(s in ("", ".", "..") or "\\" in s for s in segments):
        return None
    return "/".join(quote(s, safe="") for s in segments)


async def _proxy_widget_asset(asset_path: str) -> "Response":
    """Proxy one approved-custom-widget asset from the sidecar's `/widgets` route. The
    sidecar serves approved widgets only, with a uniform 404 for pending / rejected /
    unknown (they do not exist as far as any client can tell), and stamps the sandbox
    CSP on every asset — both properties pass through unchanged. Read-only."""
    safe_path = _safe_asset_path(asset_path)
    if safe_path is None:
        return Response(status_code=http_status.HTTP_404_NOT_FOUND)
    try:
        port, _nonce = await _ensure_sidecar()
    except Exception as exc:  # defensive: never crash the dashboard worker
        log.warning("boardstate: sidecar unavailable for widget assets: %s", exc)
        return Response(status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE)
    url = f"http://127.0.0.1:{port}/widgets/{safe_path}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.get(url)
    except Exception as exc:
        log.warning("boardstate: widget asset upstream error: %s", exc)
        return Response(status_code=http_status.HTTP_502_BAD_GATEWAY)
    headers = {k: v for k, v in upstream.headers.items() if k.lower() in _WIDGET_FWD_RESP_HEADERS}
    return Response(content=upstream.content, status_code=upstream.status_code, headers=headers)


@router.get("/widgets/{asset_path:path}")
async def widget_assets(asset_path: str) -> "Response":
    """Header-authed asset access (tests, tooling). Browser mounts can't send headers on
    iframe/fetch loads — they use the tokenized root route below via /assets-base."""
    return await _proxy_widget_asset(asset_path)


# ── Browser-loadable asset base (iframes and in-page fetches cannot carry auth
# headers, and the dashboard's /api gate has no per-plugin public-path hook) ──
# A per-boot capability token EMBEDDED IN THE PATH gates a root-level route that the
# /api middleware doesn't cover. The token is random per process, compared in constant
# time, scoped to read-only APPROVED-widget static assets (uniform 404 otherwise, CSP
# preserved), and handed out only by the session-authed /assets-base endpoint — the
# same exposure class as the WS ?token= URL the dashboard already uses.
_ASSET_TOKEN = secrets.token_urlsafe(24)
_ASSET_ROUTE_PREFIX = "/boardstate-widget-assets"


async def _tokenized_widget_assets(asset_token: str, asset_path: str) -> "Response":
    import hmac as _hmac

    if not _hmac.compare_digest(asset_token.encode(), _ASSET_TOKEN.encode()):
        return Response(status_code=http_status.HTTP_404_NOT_FOUND)
    return await _proxy_widget_asset(asset_path)


def _register_asset_route() -> None:
    """Best-effort root-level mount on the dashboard app (outside the /api gate).
    Unavailable (older dashboard / import failure) ⇒ custom widgets simply don't mount;
    the board and every builtin are unaffected."""
    try:
        from hermes_cli.web_server import app as _app  # local import: load-order coupling

        _app.add_api_route(
            _ASSET_ROUTE_PREFIX + "/{asset_token}/widgets/{asset_path:path}",
            _tokenized_widget_assets,
            methods=["GET"],
        )
        log.info("boardstate: widget asset route mounted at %s/<token>/widgets/*", _ASSET_ROUTE_PREFIX)
    except Exception as exc:  # pragma: no cover - dashboard internals unavailable
        log.info("boardstate: widget asset route unavailable (%s); custom widgets off", exc)


_register_asset_route()


@router.get("/assets-base")
async def assets_base(request: "Request") -> "Response":
    """The browser's custom-widget asset base (session-authed; the SDK fetch carries the
    credential). The returned base composes with the client's `${base}/widgets/...`."""
    # Same session posture as the operator route's loopback check: this endpoint rides
    # the dashboard's own /api gate (session token in loopback, cookie in gated mode).
    origin = str(request.base_url).rstrip("/")
    return JSONResponse({"base": f"{origin}{_ASSET_ROUTE_PREFIX}/{_ASSET_TOKEN}"})


_MCP_FWD_REQ_HEADERS = ("content-type", "accept", "mcp-session-id", "mcp-protocol-version", "last-event-id")
_MCP_FWD_RESP_HEADERS = ("content-type", "mcp-session-id")


@router.api_route("/mcp", methods=["POST", "GET", "DELETE"])
async def mcp_proxy(request: "Request") -> "Response":
    try:
        port, nonce = await _ensure_sidecar()
    except Exception as exc:  # defensive: never crash the dashboard worker
        log.warning("boardstate: sidecar unavailable for MCP: %s", exc)
        return Response(status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE, content=b"sidecar unavailable")

    body = await request.body()
    fwd_headers = {h: request.headers[h] for h in _MCP_FWD_REQ_HEADERS if h in request.headers}
    url = f"http://127.0.0.1:{port}/mcp?nonce={nonce}"

    client = httpx.AsyncClient(timeout=None)
    try:
        upstream_req = client.build_request(request.method, url, content=body, headers=fwd_headers)
        upstream = await client.send(upstream_req, stream=True)
    except Exception as exc:
        await client.aclose()
        log.warning("boardstate: MCP upstream error: %s", exc)
        return Response(status_code=http_status.HTTP_502_BAD_GATEWAY, content=b"mcp upstream error")

    resp_headers = {h: upstream.headers[h] for h in _MCP_FWD_RESP_HEADERS if h in upstream.headers}

    async def _iter():
        try:
            async for chunk in upstream.aiter_raw():
                yield chunk
        finally:
            await upstream.aclose()
            await client.aclose()

    return StreamingResponse(_iter(), status_code=upstream.status_code, headers=resp_headers)


# ---------------------------------------------------------------------------
# Desktop request transport: ctx.rest POSTs one Boardstate RPC here.  The
# dashboard auth gate protects this route; the sidecar still requires its
# per-spawn nonce.  Operator-only methods remain on /operator and are rejected
# by the sidecar's internal endpoint.
# ---------------------------------------------------------------------------

@router.post("/rpc")
async def rpc_proxy(request: "Request") -> "Response":
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"error": "body must be JSON { method, params }"},
        )
    if not isinstance(payload, dict) or not isinstance(payload.get("method"), str):
        return JSONResponse(
            status_code=400,
            content={"error": "body must be JSON { method, params }"},
        )
    try:
        port, nonce = await _ensure_sidecar()
    except Exception as exc:
        log.warning("boardstate: sidecar unavailable for RPC: %s", exc)
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "sidecar unavailable"},
        )
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.post(
                f"http://127.0.0.1:{port}/rpc?nonce={nonce}",
                json={
                    "method": payload["method"],
                    "params": payload.get("params") or {},
                },
            )
    except Exception as exc:
        log.warning("boardstate: RPC upstream error: %s", exc)
        return JSONResponse(
            status_code=http_status.HTTP_502_BAD_GATEWAY,
            content={"error": "sidecar RPC upstream error"},
        )
    try:
        body = upstream.json()
    except Exception:
        body = {"error": upstream.text}
    return JSONResponse(status_code=upstream.status_code, content=body)


# ---------------------------------------------------------------------------
# Operator gate: the ONLY privileged path to the sidecar's operator verbs.
#
# Hermes has no role primitive, so operator approve/confirm can NEVER travel the browser
# WS or the MCP proxy (both stay blocked by the sidecar's OPERATOR_ONLY_METHODS). This
# route is the one privileged surface. It (a) requires the dashboard session auth (same
# family as the WS gate), (b) consults an allowlist policy (``boardstate.operators.json``
# in the state dir) — ABSENT ⇒ allowed only in loopback-token mode, DENIED (403) in
# gated/multi-user mode; PRESENT ⇒ the caller principal must be listed — then forwards
# ``{method, params}`` to the sidecar's nonce-gated ``/operator``. The nonce never leaves
# these two processes.
# ---------------------------------------------------------------------------

# EXACTLY the four operator verbs the sidecar executes (the sidecar re-enforces this from
# @boardstate/server's OPERATOR_ONLY_METHODS; we gate here too so a non-operator verb never
# even reaches the loopback endpoint).
_OPERATOR_METHODS: frozenset[str] = frozenset({
    "dashboard.widget.approve",
    "dashboard.capability.approve",
    "dashboard.action.confirm",
    "dashboard.action.deny",
})


def _operators_allowlist_path(state_dir: Path) -> Path:
    return state_dir / "boardstate.operators.json"


def _load_operators_allowlist(state_dir: Path) -> Optional[list[str]]:
    """The operator allowlist policy. Returns None when the file is ABSENT (⇒ loopback-only
    policy), else the list of allowed principals (malformed ⇒ empty list = nobody, fail
    closed). The file lists WHO may approve; it is authored by the operator, like the
    connectors config, and lives in the state dir (never the board doc)."""
    path = _operators_allowlist_path(state_dir)
    try:
        raw = path.read_text()
    except FileNotFoundError:
        return None
    except Exception:  # pragma: no cover - unreadable file: fail closed
        return []
    try:
        rec = json.loads(raw)
    except Exception:
        return []  # malformed ⇒ nobody is blessed (fail closed)
    ops = rec.get("operators") if isinstance(rec, dict) else None
    return [str(o) for o in ops] if isinstance(ops, list) else []


def _authorize_operator(request: "Request") -> tuple[Optional[str], Optional[Response]]:
    """Authorize an operator request. Returns ``(principal, None)`` when allowed, or
    ``(None, error_response)`` (401/403) when not. Enforces BOTH the dashboard session
    auth and the allowlist policy above."""
    try:
        from hermes_cli import web_server as _ws  # local import: avoid load-order coupling
    except Exception:  # pragma: no cover - dashboard internals unavailable
        _ws = None

    # AUTH-1 (fail CLOSED): only a POSITIVELY-confirmed loopback single-user bind — the
    # dashboard set `app.state.auth_required = False` at startup (see web_server:should_require_auth)
    # — is trusted as a self-service operator without an allowlist. If gating is INDETERMINATE
    # (the attribute is absent — e.g. an atypical embedding) or the bind is gated/multi-user
    # (True), the operator allowlist is MANDATORY. `auth_required` defaulting to False here would
    # be fail-OPEN, so we treat "not exactly False" as untrusted.
    state = getattr(getattr(request, "app", None), "state", None)
    auth_required = getattr(state, "auth_required", None) if state is not None else None
    loopback_single_user = auth_required is False

    if loopback_single_user:
        # Loopback: validate the dashboard session token exactly as the WS gate does.
        # FAIL CLOSED when the checker is unavailable (hermes_cli unimportable or an
        # older dashboard without _has_valid_session_token): unlike the render WS, the
        # operator plane is consequential, so "can't verify" must not mean "allow".
        # Tests/harnesses without hermes_cli set BOARDSTATE_OPERATOR_TEST_BYPASS=1.
        checker = getattr(_ws, "_has_valid_session_token", None) if _ws else None
        if checker is None:
            if os.environ.get("BOARDSTATE_OPERATOR_TEST_BYPASS") != "1":
                return None, JSONResponse(
                    status_code=401,
                    content={"error": "operator auth unavailable (dashboard session gate not found)"},
                )
        elif not checker(request):
            return None, JSONResponse(status_code=401, content={"error": "unauthorized"})
        principal = "loopback"
    else:
        # Gated OR indeterminate → the allowlist is mandatory (below). Identify the caller from
        # the gate-attached session when present; a gated bind with no session is a gate failure.
        session = getattr(request.state, "session", None)
        if auth_required is True and session is None:
            return None, JSONResponse(status_code=401, content={"error": "unauthorized"})
        principal = (getattr(session, "email", None) or getattr(session, "user_id", None)) if session else None

    allowlist = _load_operators_allowlist(_state_dir())
    if allowlist is None:
        # No allowlist file: permitted ONLY for a confirmed loopback single-user bind. Otherwise
        # (gated or indeterminate) refuse — an undifferentiated session token must not be a
        # self-service operator on a shared/unknown host.
        if not loopback_single_user:
            return None, JSONResponse(
                status_code=403,
                content={"error": "operator allowlist (boardstate.operators.json) required unless the dashboard is a confirmed loopback single-user bind"},
            )
    else:
        if not principal or principal not in allowlist:
            return None, JSONResponse(status_code=403, content={"error": "caller is not an authorized operator"})

    return principal, None


@router.post("/operator")
async def operator(request: "Request") -> "Response":
    principal, denied = _authorize_operator(request)
    if denied is not None:
        return denied

    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "body must be JSON { method, params }"})

    method = payload.get("method") if isinstance(payload, dict) else None
    params = (payload.get("params") if isinstance(payload, dict) else None) or {}
    if not isinstance(method, str) or method not in _OPERATOR_METHODS:
        return JSONResponse(status_code=400, content={"error": f"method not allowed on the operator endpoint: {method}"})

    try:
        port, _nonce = await _ensure_sidecar()
    except Exception as exc:  # defensive: never crash the dashboard worker
        log.warning("boardstate: sidecar unavailable for operator: %s", exc)
        return JSONResponse(status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE, content={"error": "sidecar unavailable"})

    # SEC-1: forward with the DEDICATED operator secret (in-memory, never in the port file),
    # NOT the adoption nonce. If this backend ADOPTED the sidecar (didn't spawn it) it has no
    # operator secret — operator actions are unavailable here (drive them from the spawning
    # backend, or restart so this process owns the sidecar).
    operator_secret = _sidecar.get("operator_secret")
    if not operator_secret:
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "operator actions unavailable on this backend (adopted sidecar); use the backend that spawned it"},
        )

    # Forward the EXACT { method, params } shape to the sidecar's secret-gated /operator.
    url = f"http://127.0.0.1:{port}/operator?nonce={operator_secret}"
    log.info("boardstate: operator %s by %s", method, principal)
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            upstream = await client.post(url, json={"method": method, "params": params})
    except Exception as exc:
        log.warning("boardstate: operator upstream error: %s", exc)
        return JSONResponse(status_code=http_status.HTTP_502_BAD_GATEWAY, content={"error": "operator upstream error"})

    # Relay the sidecar's status + JSON body verbatim (200 result / 400 refusal / 401).
    try:
        body = upstream.json()
    except Exception:
        body = {"error": upstream.text}
    return JSONResponse(status_code=upstream.status_code, content=body)


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
    # ctx.socket is receive-only and has no open callback.  This harmless event
    # lets the SDK-only Desktop adapter distinguish a live socket from the
    # documented OAuth-remote no-op and show an honest degraded state there.
    await ws.send_text(
        json.dumps({"event": "boardstate.desktop.connected", "payload": {"ok": True}})
    )

    try:
        port, nonce = await _ensure_sidecar()
    except Exception as exc:
        log.warning("boardstate: sidecar unavailable: %s", exc)
        await ws.close(code=http_status.WS_1011_INTERNAL_ERROR)
        return

    uri = f"ws://127.0.0.1:{port}/ws?nonce={nonce}"
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

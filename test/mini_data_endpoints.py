"""Gated-mode Hermes data path: the mini endpoints.

The sidecar's Hermes data resolver GETs the dashboard REST surface with an
``X-Hermes-Session-Token`` header. In gated/OAuth mode the dashboard only
accepts cookie sessions on those routes (live 401 reproduced), so
``_hermes_data_credentials`` now prefers the in-process mini endpoint server:
an ephemeral loopback listener whose only credential is a per-process random
token. These tests exercise that server with fake Hermes routers.

Run: python test/mini_data_endpoints.py  (fastapi/websockets NOT required —
the module import is stubbed when unavailable)
"""

from __future__ import annotations

import asyncio
import importlib.util
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parent.parent / "dashboard"


def _load():
    spec = importlib.util.spec_from_file_location(
        "boardstate_plugin_api_mini", DASHBOARD / "plugin_api.py"
    )
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


async def _run() -> None:
    # urllib is blocking: every call must run off the asyncio loop, else the
    # mini server (same loop) never accepts and urlopen times out.
    def _http_get_sync(url: str, token: str | None) -> tuple[int, object]:
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
        if token is not None:
            request.add_header("X-Hermes-Session-Token", token)
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read().decode("utf8"))
        except urllib.error.HTTPError as exc:
            try:
                body = json.loads(exc.read().decode("utf8"))
            except Exception:
                body = None
            return exc.code, body

    async def _http_get(url: str, token: str | None) -> tuple[int, object]:
        return await asyncio.to_thread(_http_get_sync, url, token)

    module = _load()

    # Fake Hermes routers the mini handlers import lazily.
    import types

    fake_cli = types.ModuleType("hermes_cli")
    fake_cli.__path__ = []
    web_routers = types.ModuleType("hermes_cli.web_routers")
    web_routers.__path__ = []
    analytics = types.ModuleType("hermes_cli.web_routers.analytics")
    sessions = types.ModuleType("hermes_cli.web_routers.sessions")
    status = types.ModuleType("hermes_cli.web_routers.status")
    cron_router = types.ModuleType("hermes_cli.web_routers.cron")

    def fake_get_usage_analytics(*args, **kwargs):
        days = kwargs.get("days", args[0] if args else 30)
        profile = kwargs.get("profile", args[1] if len(args) > 1 else None)
        return {
            "daily": [],
            "by_model": [],
            "totals": {
                "total_input": 1000,
                "total_output": 500,
                "total_estimated_cost": 0.42,
            },
            "period_days": days,
        }

    def fake_get_sessions(*args, **kwargs):
        return {
            "sessions": [
                {"id": "s1", "title": "First", "updated_at": "2026-10-06T10:00:00Z"},
                {"id": "s2", "title": "Second", "updated_at": "2026-10-06T11:00:00Z"},
            ],
            "total": 2,
        }

    async def fake_get_status(profile=None):
        return {
            "version": "0.99.0-test",
            "gateway_running": True,
            "active_agents": 2,
        }

    def fake_list_cron_jobs_sync(profile="all"):
        return [
            {
                "id": "job-1",
                "name": "Daily check",
                "enabled": True,
                "next_run_at": "2026-10-07T07:30:00+02:00",
                "last_status": "ok",
                "profile": "default",
            }
        ]

    analytics.get_usage_analytics = fake_get_usage_analytics
    analytics._get_usage_analytics = fake_get_usage_analytics
    sessions.get_sessions = fake_get_sessions
    status.get_status = fake_get_status
    cron_router._list_cron_jobs_sync = fake_list_cron_jobs_sync

    web_routers.analytics = analytics
    web_routers.sessions = sessions
    web_routers.status = status
    web_routers.cron = cron_router
    fake_cli.web_routers = web_routers
    for name, mod in (
        ("hermes_cli", fake_cli),
        ("hermes_cli.web_routers", web_routers),
        ("hermes_cli.web_routers.analytics", analytics),
        ("hermes_cli.web_routers.sessions", sessions),
        ("hermes_cli.web_routers.status", status),
        ("hermes_cli.web_routers.cron", cron_router),
    ):
        sys.modules[name] = mod

    port, token = await module._start_mini_server()
    assert port and token, "mini server did not start"
    base = f"http://127.0.0.1:{port}"

    failures: list[str] = []

    def check(name: str, cond: bool) -> None:
        print(f"{'ok  ' if cond else 'FAIL'} {name}")
        if not cond:
            failures.append(name)

    try:
        # Auth gate: no token -> 401; wrong token -> 401; right token -> 200.
        code, _ = await _http_get(f"{base}/api/analytics/usage?days=7", None)
        check("mini endpoint rejects a missing token (401)", code == 401)
        code, _ = await _http_get(f"{base}/api/analytics/usage?days=7", token + "x")
        check("mini endpoint rejects a wrong token (401)", code == 401)

        code, body = await _http_get(f"{base}/api/analytics/usage?days=7", token)
        check("usage: 200 with the sidecar's token", code == 200)
        totals = (body or {}).get("totals", {}) if isinstance(body, dict) else {}
        check(
            "usage: sidecar-shaped totals (total_input/total_estimated_cost)",
            totals.get("total_input") == 1000 and totals.get("total_estimated_cost") == 0.42,
        )

        code, body = await _http_get(f"{base}/api/sessions?limit=2", token)
        check("sessions: 200 with token", code == 200)
        rows = (body or {}).get("sessions", []) if isinstance(body, dict) else []
        check("sessions: list shape the handler maps", len(rows) == 2 and rows[0]["id"] == "s1")

        code, body = await _http_get(f"{base}/api/status", token)
        check("status: 200 with token", code == 200)
        check(
            "status: active_agents present (system-presence handler field)",
            isinstance(body, dict) and body.get("active_agents") == 2,
        )

        # /api/cron — the path the sidecar's cron handler has always GETted and
        # that never existed on the dashboard: served here as a bare job list.
        code, body = await _http_get(f"{base}/api/cron", token)
        check("cron (/api/cron): 200 with token", code == 200)
        jobs = body if isinstance(body, list) else []
        check(
            "cron: bare list with next_run_at/last_status the handler maps",
            len(jobs) == 1
            and jobs[0].get("next_run_at") == "2026-10-07T07:30:00+02:00"
            and jobs[0].get("last_status") == "ok",
        )

        # Unknown paths and methods fail closed.
        code, _ = await _http_get(f"{base}/api/unknown", token)
        check("unknown path -> 404", code == 404)

        # Second start is idempotent (same base + token).
        port2, token2 = await module._start_mini_server()
        check("second start returns the same endpoint", port2 == port and token2 == token)
    finally:
        await module._stop_mini_server()

    # After shutdown the port refuses connections.
    try:
        await _http_get(f"{base}/api/status", token)
        refused = False
    except Exception:
        refused = True
    check("server shutdown closes the listener", refused)

    if failures:
        print(f"\nmini data endpoints: {len(failures)} failed: {', '.join(failures)}")
        sys.exit(1)
    print("\nmini data endpoints: all checks passed")


if __name__ == "__main__":
    asyncio.run(_run())

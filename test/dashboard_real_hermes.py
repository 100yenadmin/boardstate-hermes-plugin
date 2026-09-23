"""Real-Hermes dashboard HTTP/WebSocket acceptance.

Run with the pinned Hermes interpreter and an isolated ``HERMES_HOME`` that
contains an enabled Boardstate plugin.  The session credential is generated in
memory for this subprocess and is never printed or persisted.
"""

from __future__ import annotations

import asyncio
import json
import os
import secrets
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

import websockets


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


# The acceptance client talks to loopback directly, so the test can also run under a dead
# HTTP(S)_PROXY and prove the dashboard's own sidecar traffic never uses it.
_DIRECT = urllib.request.build_opener(urllib.request.ProxyHandler({}))
_WS_DIRECT = {"proxy": None} if int(websockets.__version__.split(".")[0]) >= 15 else {}


def _request(url: str, token: str | None = None) -> tuple[int, object]:
    headers = {"X-Hermes-Session-Token": token} if token else {}
    request = urllib.request.Request(url, headers=headers)
    try:
        with _DIRECT.open(request, timeout=5) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            payload: object = json.loads(body)
        except json.JSONDecodeError:
            payload = body
        return exc.code, payload


async def _check_websocket(port: int, token: str) -> None:
    base = f"ws://127.0.0.1:{port}/api/plugins/boardstate/ws"
    rejected = False
    try:
        async with websockets.connect(base, open_timeout=5, **_WS_DIRECT):
            pass
    except Exception:
        rejected = True
    assert rejected, "tokenless plugin WebSocket unexpectedly connected"

    async with websockets.connect(
        f"{base}?token={token}", open_timeout=5, close_timeout=2, **_WS_DIRECT
    ) as ws:
        connected = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))
        assert connected.get("event") == "boardstate.desktop.connected", connected
        await ws.send(
            json.dumps(
                {"id": "acceptance", "method": "dashboard.workspace.get", "params": {}}
            )
        )
        reply = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
        assert reply.get("id") == "acceptance", reply
        assert isinstance(reply.get("result", {}).get("doc", {}).get("tabs"), list), reply


def main() -> int:
    home_value = os.environ.get("HERMES_HOME")
    assert home_value, "HERMES_HOME must be set"
    home = Path(home_value).resolve()
    assert home != (Path.home() / ".hermes").resolve(), "refusing to use the real ~/.hermes"
    assert (home / "plugins" / "boardstate" / "plugin.yaml").is_file()

    hermes = shutil.which("hermes")
    assert hermes, "hermes executable not found on PATH"
    port = _free_port()
    token = secrets.token_urlsafe(32)
    env = os.environ.copy()
    env["HERMES_DASHBOARD_SESSION_TOKEN"] = token
    env["BOARDSTATE_HERMES_STATE_DIR"] = str(home / "boardstate-dashboard-state")
    process = subprocess.Popen(
        [hermes, "dashboard", "--host", "127.0.0.1", "--port", str(port)],
        env=env,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        plugins_url = f"http://127.0.0.1:{port}/api/dashboard/plugins"
        # A cold `hermes dashboard` start takes 18-30 s on CI runners; poll up to 90 s.
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise AssertionError(f"dashboard exited early with code {process.returncode}")
            try:
                status, plugins = _request(plugins_url)
                if status == 200:
                    break
            except OSError:
                pass
            time.sleep(0.2)
        else:
            raise AssertionError("dashboard did not become ready within 90 seconds")

        assert isinstance(plugins, list), plugins
        assert any(item.get("name") == "boardstate" for item in plugins), plugins

        health_url = f"http://127.0.0.1:{port}/api/plugins/boardstate/health"
        status, _ = _request(health_url)
        assert status == 401, status
        status, health = _request(health_url, token)
        assert status == 200, (status, health)
        assert health.get("ok") is True and health.get("bundle_present") is True, health

        asyncio.run(_check_websocket(port, token))
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)

    print(
        "real Hermes dashboard: manifest, HTTP auth, tokenless WS rejection, "
        "and authenticated WS round-trip passed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Runtime test of the tokenized custom-widget asset proxy (not a source grep).

Mounts the REAL route handlers from plugin_api on a local FastAPI app (the same shape
`_register_asset_route` adds to the dashboard app), points `_ensure_sidecar` at a fake
sidecar, and drives actual HTTP requests through the proxy: correct token serves with
the CSP forwarded verbatim; a wrong token 404s; traversal paths never reach upstream.

Runs in CI with fastapi + httpx only (no hermes_cli).
"""

from __future__ import annotations

import importlib.util
import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parent.parent / "dashboard"


def _load():
    spec = importlib.util.spec_from_file_location("boardstate_plugin_api_ap", DASHBOARD / "plugin_api.py")
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    mod = _load()
    failures: list[str] = []

    def check(name: str, cond: bool) -> None:
        print(f"{'ok  ' if cond else 'FAIL'} {name}")
        if not cond:
            failures.append(name)

    # ── fake sidecar: records every upstream path; serves one approved asset ──
    seen_paths: list[str] = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):  # noqa: N802
            pass

        def do_GET(self):  # noqa: N802
            seen_paths.append(self.path)
            if self.path == "/widgets/mini/widget.json":
                body = json.dumps({"schemaVersion": 1, "name": "mini"}).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Security-Policy", "default-src 'none'; connect-src 'none'")
                self.send_header("X-Content-Type-Options", "nosniff")
                self.end_headers()
                self.wfile.write(body)
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"not found")

    srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    async def _fake_ensure():
        return port, "nonce-unused"

    mod._ensure_sidecar = _fake_ensure  # type: ignore[assignment]

    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()
    # The SAME route shape _register_asset_route mounts on the dashboard app.
    app.add_api_route(
        mod._ASSET_ROUTE_PREFIX + "/{asset_token}/widgets/{asset_path:path}",
        mod._tokenized_widget_assets,
        methods=["GET"],
    )
    client = TestClient(app)
    token = mod._ASSET_TOKEN

    try:
        # correct token → upstream asset, CSP + nosniff forwarded VERBATIM
        r = client.get(f"{mod._ASSET_ROUTE_PREFIX}/{token}/widgets/mini/widget.json")
        check("correct token → 200", r.status_code == 200)
        check("CSP forwarded verbatim", r.headers.get("content-security-policy") == "default-src 'none'; connect-src 'none'")
        check("nosniff forwarded", r.headers.get("x-content-type-options") == "nosniff")
        check("body passes through", r.json().get("name") == "mini")

        # wrong token → 404 (constant-time compare), upstream NEVER contacted
        before = len(seen_paths)
        r2 = client.get(f"{mod._ASSET_ROUTE_PREFIX}/WRONG/widgets/mini/widget.json")
        check("wrong token → 404", r2.status_code == 404)
        check("wrong token never reaches upstream", len(seen_paths) == before)

        # traversal → 404, and the upstream jail invariant holds: whatever the HTTP
        # layer normalizes, the sidecar only ever sees /widgets/ paths with clean
        # segments (no "..", ".", empties, backslashes).
        for evil in ["../secrets", "a/../../b", "a/./b", "a//b", "a\\b"]:
            r3 = client.get(f"{mod._ASSET_ROUTE_PREFIX}/{token}/widgets/{evil}")
            check(f"traversal rejected ({evil!r}) → 404", r3.status_code == 404)
        jailed = all(
            p.startswith("/widgets/")
            and all(seg not in ("", ".", "..") and "\\" not in seg for seg in p[len("/widgets/"):].split("/"))
            for p in seen_paths
        )
        check("upstream only ever sees jailed, traversal-free /widgets paths", jailed)

        # unknown-but-clean path → the sidecar's own uniform 404 passes through
        r4 = client.get(f"{mod._ASSET_ROUTE_PREFIX}/{token}/widgets/ghost/widget.json")
        check("unknown widget → uniform 404 from upstream", r4.status_code == 404)
        check("clean path DID reach upstream", seen_paths[-1] == "/widgets/ghost/widget.json")
    finally:
        srv.shutdown()

    if failures:
        print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\nasset proxy: all checks passed — tokenized route, traversal-jailed, CSP verbatim")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

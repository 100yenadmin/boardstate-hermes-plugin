"""Wire-contract test at the plugin_api → sidecar OPERATOR seam (exact param shapes).

The operator gate's whole job is to forward a privileged decision to the sidecar with the
right shape and the right nonce — and to REFUSE everything else before it ever reaches the
loopback endpoint. This test stands up a FAKE sidecar (a threaded HTTP server that records
the exact request plugin_api sends), points ``_ensure_sidecar`` at it, and drives the real
``POST /api/plugins/boardstate/operator`` route via a FastAPI TestClient. It asserts:

  * a valid operator verb crosses as EXACTLY ``{ "method", "params" }`` to ``/operator?nonce=<nonce>``;
  * the sidecar's status + JSON body are relayed verbatim;
  * a NON-operator method is 400'd and NEVER forwarded (the allowlist is the gate);
  * a present operators allowlist that omits the caller principal ⇒ 403 (no forward).

Runs in CI with only fastapi + httpx installed (no hermes_cli — so loopback auth is a
no-op here, exactly as in the CI python job; the allowlist policy is still enforced).
"""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

DASHBOARD = Path(__file__).resolve().parent.parent / "dashboard"
KNOWN_NONCE = "wire-test-nonce"  # the /ws+/mcp adoption nonce (returned by _ensure_sidecar)
OPERATOR_SECRET = "wire-operator-secret"  # SEC-1: the DEDICATED /operator credential


def _load_plugin_api():
    spec = importlib.util.spec_from_file_location("boardstate_plugin_api_wire", DASHBOARD / "plugin_api.py")
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


class _FakeSidecar:
    """A loopback HTTP server standing in for the Node sidecar's /operator endpoint."""

    def __init__(self):
        self.requests: list[dict] = []
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_args):  # silence
                pass

            def do_POST(self):
                length = int(self.headers.get("content-length", 0))
                body = self.rfile.read(length).decode("utf-8") if length else ""
                outer.requests.append({"path": self.path, "body": body})
                # Enforce the DEDICATED operator secret exactly as the real sidecar does (SEC-1).
                if f"nonce={OPERATOR_SECRET}" not in self.path:
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(b'{"error":"unauthorized"}')
                    return
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"result": {"ok": True}}).encode())

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def close(self):
        self.server.shutdown()


def main() -> int:
    mod = _load_plugin_api()
    failures: list[str] = []

    def check(name: str, cond: bool) -> None:
        print(f"{'ok  ' if cond else 'FAIL'} {name}")
        if not cond:
            failures.append(name)

    fake = _FakeSidecar()

    async def _fake_ensure():
        return fake.port, KNOWN_NONCE

    # Point the operator route at the fake sidecar, and isolate the state dir. The dedicated
    # operator secret is held in-memory by the spawning backend (SEC-1) — set it here since the
    # real _spawn_sidecar (which would set it) is bypassed by the _ensure_sidecar monkeypatch.
    mod._ensure_sidecar = _fake_ensure  # type: ignore[assignment]
    mod._sidecar["operator_secret"] = OPERATOR_SECRET
    state_dir = Path(tempfile.mkdtemp(prefix="bs-operwire-"))
    mod._state_dir = lambda: state_dir  # type: ignore[assignment]

    app = FastAPI()
    app.state.auth_required = False  # loopback mode (no hermes_cli in CI ⇒ token check is a no-op)
    app.include_router(mod.router, prefix="/api/plugins/boardstate")
    client = TestClient(app)

    try:
        # ── 1. a valid operator verb crosses with the exact shape + nonce ──
        params = {"name": "fake", "decision": "granted", "actor": "user", "tools": ["fake:echo"]}
        resp = client.post(
            "/api/plugins/boardstate/operator",
            json={"method": "dashboard.capability.approve", "params": params},
        )
        check("valid operator verb → 200 relayed", resp.status_code == 200)
        check("sidecar result relayed verbatim", resp.json() == {"result": {"ok": True}})
        check("exactly one request reached the sidecar", len(fake.requests) == 1)
        forwarded = fake.requests[-1]
        check("forwarded to /operator with the DEDICATED operator secret (not the adoption nonce)", forwarded["path"] == f"/operator?nonce={OPERATOR_SECRET}")
        body = json.loads(forwarded["body"])
        check(
            "forwarded body is EXACTLY { method, params }",
            set(body.keys()) == {"method", "params"}
            and body["method"] == "dashboard.capability.approve"
            and body["params"] == params,
        )

        # ── 2. a non-operator method is refused BEFORE any forward ──
        before = len(fake.requests)
        resp2 = client.post(
            "/api/plugins/boardstate/operator",
            json={"method": "dashboard.workspace.replace", "params": {"doc": {}}},
        )
        check("non-operator verb → 400", resp2.status_code == 400)
        check("non-operator verb never forwarded to the sidecar", len(fake.requests) == before)

        # ── 3. a present allowlist that omits the caller principal ⇒ 403 (no forward) ──
        (state_dir / "boardstate.operators.json").write_text(json.dumps({"operators": ["alice@example.com"]}))
        before = len(fake.requests)
        resp3 = client.post(
            "/api/plugins/boardstate/operator",
            json={"method": "dashboard.action.confirm", "params": {"id": "abc"}},
        )
        check("principal not in allowlist → 403", resp3.status_code == 403)
        check("denied request never forwarded", len(fake.requests) == before)

        # ── 4. allowlist listing the loopback principal ⇒ allowed again ──
        (state_dir / "boardstate.operators.json").write_text(json.dumps({"operators": ["loopback"]}))
        resp4 = client.post(
            "/api/plugins/boardstate/operator",
            json={"method": "dashboard.action.deny", "params": {"id": "abc"}},
        )
        check("listed principal → forwarded (200)", resp4.status_code == 200)

        # ── 5. GATED mode (auth_required=True) — the multi-user safety guarantee (AUTH-2) ──
        # A fake session middleware stands in for the auth gate (which attaches request.state.session).
        opfile = state_dir / "boardstate.operators.json"

        class _FakeSession:
            def __init__(self, email: str):
                self.email = email
                self.user_id = email

        def _gated_client(email: str | None) -> TestClient:
            gated_app = FastAPI()
            gated_app.state.auth_required = True
            if email is not None:
                @gated_app.middleware("http")
                async def _inject(request, call_next):  # noqa: ANN001
                    request.state.session = _FakeSession(email)
                    return await call_next(request)
            gated_app.include_router(mod.router, prefix="/api/plugins/boardstate")
            return TestClient(gated_app)

        confirm = {"method": "dashboard.action.confirm", "params": {"id": "abc"}}
        gated = _gated_client("alice@example.com")

        opfile.unlink(missing_ok=True)  # no allowlist file
        before = len(fake.requests)
        r_noallow = gated.post("/api/plugins/boardstate/operator", json=confirm)
        check("gated + NO allowlist file → 403 (fail closed)", r_noallow.status_code == 403)
        check("gated no-allowlist never forwarded", len(fake.requests) == before)

        opfile.write_text(json.dumps({"operators": ["bob@example.com"]}))  # alice not listed
        before = len(fake.requests)
        r_notlisted = gated.post("/api/plugins/boardstate/operator", json=confirm)
        check("gated + principal NOT in allowlist → 403", r_notlisted.status_code == 403)
        check("gated not-listed never forwarded", len(fake.requests) == before)

        opfile.write_text(json.dumps({"operators": ["alice@example.com"]}))  # alice listed
        r_listed = gated.post("/api/plugins/boardstate/operator", json=confirm)
        check("gated + principal IN allowlist → forwarded (200)", r_listed.status_code == 200)

        # gated but NO session (gate failure) → 401
        gated_no_session = _gated_client(None)
        r_nosession = gated_no_session.post("/api/plugins/boardstate/operator", json=confirm)
        check("gated + no session → 401", r_nosession.status_code == 401)

        # ── 6. INDETERMINATE mode (auth_required unset) — fail CLOSED (AUTH-1) ──
        indet_app = FastAPI()  # app.state.auth_required deliberately NOT set → None
        indet_app.include_router(mod.router, prefix="/api/plugins/boardstate")
        indet_client = TestClient(indet_app)
        opfile.unlink(missing_ok=True)  # no allowlist
        before = len(fake.requests)
        r_indet = indet_client.post("/api/plugins/boardstate/operator", json=confirm)
        check("indeterminate mode + no allowlist → 403 (fail closed, AUTH-1)", r_indet.status_code == 403)
        check("indeterminate denied never forwarded", len(fake.requests) == before)
    finally:
        fake.close()

    if failures:
        print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\noperator wire-contract: all checks passed — exact shape crosses the seam")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

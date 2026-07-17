"""Structural check of the plugin backend, importable without a running Hermes host.

Asserts the router shape (WS + health endpoints), the sidecar-lifecycle helpers, and
that the per-spawn nonce is actually wired into the sidecar env + upstream URL. Runs in
CI with only fastapi + websockets installed (no hermes_cli).
"""

from __future__ import annotations

import importlib.util
import inspect
import sys
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parent.parent / "dashboard"


def _load():
    spec = importlib.util.spec_from_file_location("boardstate_plugin_api", DASHBOARD / "plugin_api.py")
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

    # Router exposes the browser WS bridge + a health probe + the MCP proxy.
    paths = {getattr(r, "path", None) for r in mod.router.routes}
    check("router mounts /ws", "/ws" in paths)
    check("router mounts /health", "/health" in paths)
    check("router mounts /mcp (agent MCP proxy)", "/mcp" in paths)

    # The MCP proxy forwards to the sidecar with the per-spawn nonce (agent reachability).
    src2 = (DASHBOARD / "plugin_api.py").read_text()
    check("mcp proxy forwards with nonce", "/mcp?nonce=" in src2)
    check("mcp proxy streams the response", "StreamingResponse" in src2)

    # Custom-widget asset proxy: mounted, and it PRESERVES the sandbox CSP verbatim
    # (stripping it would un-jail every custom widget in the browser).
    check("router mounts /widgets proxy", any("/widgets" in str(getattr(r, "path", "")) for r in mod.router.routes))
    check("widget proxy preserves the sandbox CSP", "content-security-policy" in src2)

    # Sidecar lifecycle helpers exist.
    for fn in ("_ensure_sidecar", "_read_port", "_kill_sidecar", "_ws_upgrade_authorized"):
        check(f"has {fn}", hasattr(mod, fn))

    # Single-sidecar-per-state-dir: a second backend (web + desktop) must ADOPT the
    # first's sidecar via the port-file, not spawn a colliding second writer.
    for fn in ("_try_adopt", "_spawn_sidecar", "_portfile_path", "_pid_alive", "_port_listening"):
        check(f"has {fn}", hasattr(mod, fn))
    ensure_src = inspect.getsource(mod._ensure_sidecar)
    check("_ensure_sidecar adopts before spawning", "_try_adopt" in ensure_src)
    spawn_src = inspect.getsource(mod._spawn_sidecar)
    check("_spawn_sidecar publishes a port-file", "_portfile_path" in spawn_src and "write_text" in spawn_src)
    check("adopted sidecar is marked not-owned", '"owned"] = False' in src2)
    kill_src = inspect.getsource(mod._kill_sidecar)
    check("_kill_sidecar reaps only owned sidecars", 'owned' in kill_src)

    # Per-spawn nonce is wired: generated, passed via env, and appended to the upstream URL.
    src = (DASHBOARD / "plugin_api.py").read_text()
    check("generates a nonce", "secrets.token_urlsafe" in src)
    check("passes nonce via env", "BOARDSTATE_SIDECAR_NONCE" in src)
    check("appends nonce to upstream ws url", "?nonce=" in src)
    check("_ensure_sidecar returns (port, nonce)", "tuple[int, str]" in inspect.getsource(mod._ensure_sidecar))

    # ── Operator gate (the security crux) ────────────────────────────────────────────
    # The privileged operator route exists and is a POST.
    check("router mounts /operator", "/operator" in paths)

    op_src = inspect.getsource(mod.operator)
    auth_src = inspect.getsource(mod._authorize_operator)

    # Only the four operator verbs pass — anything else is refused before it reaches the
    # sidecar. Assert the set is EXACTLY those four (no extra verb smuggled in).
    check(
        "operator method set is exactly the 4 verbs",
        mod._OPERATOR_METHODS == frozenset({
            "dashboard.widget.approve",
            "dashboard.capability.approve",
            "dashboard.action.confirm",
            "dashboard.action.deny",
        }),
    )
    check("operator route consults the method allowlist", "_OPERATOR_METHODS" in op_src)

    # The route requires dashboard session auth AND the operators allowlist policy.
    check("operator route authorizes before acting", "_authorize_operator" in op_src)
    check("authorization consults the dashboard session gate", "_has_valid_session_token" in auth_src or "request.state.session" in auth_src)
    check("authorization consults the operators allowlist", "_load_operators_allowlist" in auth_src)
    check("allowlist file is boardstate.operators.json in state dir", "boardstate.operators.json" in src)
    for fn in ("_operators_allowlist_path", "_load_operators_allowlist", "_authorize_operator"):
        check(f"has {fn}", hasattr(mod, fn))

    # AUTH-1 (fail CLOSED): only an EXPLICIT loopback bind (auth_required IS False) is trusted
    # without an allowlist; indeterminate/gated require the allowlist.
    check("gating fails closed (auth_required is False ⇒ loopback single-user)", "auth_required is False" in auth_src)
    check("indeterminate/gated require the allowlist (loopback_single_user gate)", "loopback_single_user" in auth_src and "403" in auth_src)

    # ── SEC-1: the operator secret is a DEDICATED credential, never in the port file ──
    spawn_src = inspect.getsource(mod._spawn_sidecar)
    check("generates a separate operator secret", spawn_src.count("secrets.token_urlsafe") >= 2)
    check("passes the operator secret via env (BOARDSTATE_OPERATOR_SECRET)", "BOARDSTATE_OPERATOR_SECRET" in spawn_src)
    check("stores the operator secret in-memory (_sidecar)", '"operator_secret"' in spawn_src)
    # The port-file write records ONLY port/nonce/pid — never the operator secret.
    portfile_write = spawn_src[spawn_src.index("pf.write_text"):spawn_src.index("pf.write_text") + 200]
    check("port file records port + nonce + pid only", '"port": port' in portfile_write and '"nonce": nonce' in portfile_write)
    check("operator secret is NEVER written to the port file", "operator_secret" not in portfile_write and "operatorSecret" not in portfile_write)
    check("port file is chmod 600", "chmod" in spawn_src and "0o600" in spawn_src)
    # The operator route forwards the DEDICATED secret (not the adoption nonce) and refuses when absent.
    check("operator route forwards the operator secret to sidecar /operator?nonce=", '/operator?nonce={operator_secret}' in op_src)
    check("operator route forwards {method, params}", '"method": method' in op_src)
    check("adopted sidecar (no operator secret) ⇒ operator actions unavailable", "operator_secret" in op_src and "unavailable" in op_src)

    # Absent allowlist file ⇒ None (loopback-only signal); present ⇒ a list of principals.
    check("_load_operators_allowlist returns None when absent", mod._load_operators_allowlist(Path("/nonexistent-bs-state-dir")) is None)

    if failures:
        print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\nplugin_api structural check: all checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

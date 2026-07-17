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

    if failures:
        print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\nplugin_api structural check: all checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

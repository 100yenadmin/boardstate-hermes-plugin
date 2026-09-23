"""Node resolution and setup-error messages for the native Boardstate tools.

No Node on PATH must produce the actionable message, not a bare FileNotFoundError;
HERMES_NODE_BIN must be honoured when PATH has no node; removed plugin files must
say so. Runs each case in a subprocess so PATH and HERMES_NODE_BIN are isolated.
"""

from __future__ import annotations

import importlib.util
import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NODE_MESSAGE = "Boardstate needs Node.js >= 20 on PATH (or set HERMES_NODE_BIN)"


def _load_plugin():
    spec = importlib.util.spec_from_file_location("boardstate_plugin_under_test", ROOT / "__init__.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _worker(mode: str) -> None:
    import asyncio

    plugin = _load_plugin()
    runtime = plugin._runtime
    if mode == "missing-files":
        runtime._SIDECAR_JS = ROOT / "dashboard" / "sidecar" / "missing-server.js"
    try:
        raw = asyncio.run(plugin._handler("boardstate_workspace_get")({}))
    finally:
        runtime.shutdown_owned_sidecar()
    state_dir = runtime.state_dir()
    mode_bits = stat.S_IMODE(state_dir.stat().st_mode) if state_dir.exists() else None
    print(json.dumps({"result": json.loads(raw), "state_dir_mode": mode_bits}), flush=True)


def _run(mode: str, *, path: str, node_bin: str | None) -> dict:
    with tempfile.TemporaryDirectory(prefix="boardstate-node-") as tmp:
        env = os.environ.copy()
        env["PATH"] = path
        env["HERMES_HOME"] = tmp
        env["BOARDSTATE_HERMES_STATE_DIR"] = str(Path(tmp) / "boardstate-state")
        env.pop("HERMES_NODE_BIN", None)
        if node_bin:
            env["HERMES_NODE_BIN"] = node_bin
        completed = subprocess.run(
            [sys.executable, str(Path(__file__).resolve()), "--worker", mode],
            cwd=ROOT,
            env=env,
            text=True,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            timeout=60,
        )
        assert completed.returncode == 0, completed.stderr
        return json.loads(completed.stdout.strip().splitlines()[-1])


def main() -> int:
    node = shutil.which("node")
    assert node, "the test runner needs node on PATH"
    with tempfile.TemporaryDirectory(prefix="boardstate-empty-path-") as empty_path:
        missing = _run("tool", path=empty_path, node_bin=None)
        assert missing["result"] == {"error": NODE_MESSAGE}, missing
        # State directories are created private to the user.
        if os.name != "nt":
            assert missing["state_dir_mode"] == 0o700, oct(missing["state_dir_mode"] or 0)

        explicit = _run("tool", path=empty_path, node_bin=node)
        assert "error" not in explicit["result"], explicit
        assert isinstance(explicit["result"].get("doc", {}).get("tabs"), list), explicit

        removed = _run("missing-files", path=empty_path, node_bin=node)
        error = removed["result"].get("error", "")
        assert error.startswith(
            "Boardstate plugin files are missing (removed or mid-update); restart the session or reinstall"
        ), removed
        assert ("npm ci && npm run build" in error) == (ROOT / ".git").exists(), error

    print("node resolution: missing-node message, HERMES_NODE_BIN spawn, removed-files message, 0700 state dir")
    return 0


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        _worker(sys.argv[2])
        raise SystemExit(0)
    raise SystemExit(main())

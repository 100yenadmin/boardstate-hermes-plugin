"""Real-Hermes PluginManager and registry dispatch acceptance.

Run with the pinned Hermes interpreter and an isolated HERMES_HOME containing
the plugin at plugins/boardstate. This intentionally uses the production
PluginManager and tool registry rather than the local recording context.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from hermes_cli.plugins import PluginManager
from tools.registry import registry


def _dispatch(manager: PluginManager, name: str, args: dict) -> dict:
    result = registry.dispatch(name, args, scope=manager.scope_key)
    assert isinstance(result, str), result
    parsed = json.loads(result)
    assert "error" not in parsed, parsed
    return parsed


def main() -> int:
    home_value = os.environ.get("HERMES_HOME")
    assert home_value, "HERMES_HOME must be set"
    home = Path(home_value).resolve()
    assert home != (Path.home() / ".hermes").resolve(), "refusing to use the real ~/.hermes"
    plugin_dir = home / "plugins" / "boardstate"
    assert (plugin_dir / "plugin.yaml").is_file(), f"plugin not installed at {plugin_dir}"
    os.environ["BOARDSTATE_HERMES_STATE_DIR"] = str(home / "boardstate-state")

    manager = PluginManager()
    try:
        manager.discover_and_load()
        boardstate_names = {
            name for name in manager._plugin_tool_names if name.startswith("boardstate_")
        }
        assert len(boardstate_names) == 19, sorted(boardstate_names)

        workspace = _dispatch(manager, "boardstate_workspace_get", {})
        assert workspace["doc"]["tabs"]
        _dispatch(
            manager,
            "boardstate_tab_create",
            {"title": "PluginManager", "slug": "plugin-manager"},
        )
        _dispatch(
            manager,
            "boardstate_widget_add",
            {
                "tab": "plugin-manager",
                "id": "real-hermes",
                "kind": "builtin:markdown",
                "title": "Real Hermes",
                "grid": {"x": 0, "y": 0, "w": 6, "h": 3},
                "props": {"markdown": "loaded through the real PluginManager"},
            },
        )

        on_disk = json.loads(
            (home / "boardstate-state" / "dashboard" / "workspace.json").read_text()
        )
        tab = next(item for item in on_disk["tabs"] if item["slug"] == "plugin-manager")
        assert any(widget["id"] == "real-hermes" for widget in tab["widgets"])
    finally:
        manager.unload()

    print("real Hermes PluginManager: 19 tools and dispatch-to-disk path passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Native Hermes tool registration and real-sidecar dispatch smoke."""

from __future__ import annotations

import asyncio
import importlib.util
import json
import os
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


class RecordingContext:
    def __init__(self) -> None:
        self.tools: dict[str, dict] = {}
        self.unload = None

    def register_tool(self, name, toolset, schema, handler, **kwargs):
        self.tools[name] = {
            "toolset": toolset,
            "schema": schema,
            "handler": handler,
            **kwargs,
        }

    def on_unload(self, callback):
        self.unload = callback


def _load_plugin():
    spec = importlib.util.spec_from_file_location(
        "boardstate_native_plugin",
        ROOT / "__init__.py",
        submodule_search_locations=[str(ROOT)],
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


async def _run() -> None:
    plugin = _load_plugin()
    ctx = RecordingContext()
    plugin.register(ctx)
    assert len(ctx.tools) == 19
    assert {entry["toolset"] for entry in ctx.tools.values()} == {"boardstate"}
    assert all(entry.get("is_async") is True for entry in ctx.tools.values())
    assert all(entry["schema"]["name"] == name for name, entry in ctx.tools.items())

    with tempfile.TemporaryDirectory(prefix="boardstate-native-") as tmp:
        previous = os.environ.get("BOARDSTATE_HERMES_STATE_DIR")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        try:
            workspace = json.loads(await ctx.tools["boardstate_workspace_get"]["handler"]({}))
            assert workspace["doc"]["tabs"]

            created = json.loads(
                await ctx.tools["boardstate_tab_create"]["handler"](
                    {"title": "Native", "slug": "native"}
                )
            )
            assert "error" not in created
            added = json.loads(
                await ctx.tools["boardstate_widget_add"]["handler"](
                    {
                        "tab": "native",
                        "id": "native-card",
                        "kind": "builtin:markdown",
                        "title": "Native card",
                        "grid": {"x": 0, "y": 0, "w": 6, "h": 3},
                        "props": {"markdown": "native"},
                    }
                )
            )
            assert "error" not in added
            on_disk = json.loads((Path(tmp) / "dashboard" / "workspace.json").read_text())
            native = next(tab for tab in on_disk["tabs"] if tab["slug"] == "native")
            assert any(widget["id"] == "native-card" for widget in native["widgets"])

            for name in (
                "boardstate_tool_search",
                "boardstate_connector_read",
                "boardstate_connector_invoke",
            ):
                result = json.loads(await ctx.tools[name]["handler"]({}))
                assert "no connectors configured" in json.dumps(result).lower()
        finally:
            if ctx.unload:
                ctx.unload()
            if previous is None:
                os.environ.pop("BOARDSTATE_HERMES_STATE_DIR", None)
            else:
                os.environ["BOARDSTATE_HERMES_STATE_DIR"] = previous


if __name__ == "__main__":
    asyncio.run(_run())
    print("native plugin: 19 tools registered and real-sidecar dispatch passed")

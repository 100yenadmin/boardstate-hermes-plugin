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
        self.skills: dict[str, dict] = {}
        self.unload = None

    def register_tool(self, name, toolset, schema, handler, **kwargs):
        self.tools[name] = {
            "toolset": toolset,
            "schema": schema,
            "handler": handler,
            **kwargs,
        }

    def register_skill(self, name, path, description="", frontmatter=None):
        self.skills[name] = {"path": Path(path), "description": description}

    def on_unload(self, callback):
        self.unload = callback


class OldHostContext:
    """A Hermes host from before plugin skills: register_skill does not exist."""

    def __init__(self) -> None:
        self.tools: dict[str, dict] = {}

    def register_tool(self, name, toolset, schema, handler, **kwargs):
        self.tools[name] = schema


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
    skill = ctx.skills["boardstate-report-problem"]
    assert skill["path"].is_file(), skill
    frontmatter = skill["path"].read_text(encoding="utf-8").split("---", 2)[1]
    assert f'description: "{skill["description"]}"' in frontmatter, skill
    assert len(skill["description"]) <= 60
    old_host = OldHostContext()
    plugin.register(old_host)
    assert len(old_host.tools) == 19
    assert {entry["toolset"] for entry in ctx.tools.values()} == {"boardstate"}
    assert all(entry.get("is_async") is True for entry in ctx.tools.values())
    assert all(entry["schema"]["name"] == name for name, entry in ctx.tools.items())
    assert all("dashboard_" not in entry["schema"].get("description", "") for entry in ctx.tools.values())

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

            # workspace_replace: the server owns workspaceVersion and every tab's createdBy
            # (store.mutate bumps the version; the replace sanitizer reassigns createdBy), so a
            # doc that omits or garbles them is accepted and the stored values are the server's.
            current = json.loads(await ctx.tools["boardstate_workspace_get"]["handler"]({}))["doc"]
            before_version = current["workspaceVersion"]
            board_owner = next(t for t in current["tabs"] if t["slug"] == "board")["createdBy"]
            doc = json.loads(json.dumps(current))
            doc.pop("workspaceVersion")
            for tab in doc["tabs"]:
                if tab["slug"] == "board":
                    tab["createdBy"] = "agent"
                else:
                    tab.pop("createdBy", None)
            doc["tabs"].append({"slug": "replaced", "title": "Replaced", "hidden": False, "widgets": []})
            doc["prefs"]["tabOrder"] = [t["slug"] for t in doc["tabs"]]
            replaced = json.loads(
                await ctx.tools["boardstate_workspace_replace"]["handler"]({"doc": doc})
            )
            assert "error" not in replaced, replaced
            on_disk = json.loads((Path(tmp) / "dashboard" / "workspace.json").read_text())
            assert on_disk["workspaceVersion"] == before_version + 1, on_disk["workspaceVersion"]
            tabs = {t["slug"]: t for t in on_disk["tabs"]}
            assert tabs["board"]["createdBy"] == board_owner, tabs["board"]["createdBy"]
            assert tabs["replaced"]["createdBy"].startswith("agent:"), tabs["replaced"]["createdBy"]
            assert tabs["native"]["createdBy"].startswith("agent:"), tabs["native"]["createdBy"]

            # Everything else is still validated: a bad slug is refused and nothing is written.
            bad = json.loads(json.dumps(on_disk))
            bad["tabs"][0]["slug"] = "Not A Slug"
            refused = json.loads(
                await ctx.tools["boardstate_workspace_replace"]["handler"]({"doc": bad})
            )
            assert "error" in refused, refused
            after = json.loads((Path(tmp) / "dashboard" / "workspace.json").read_text())
            assert after["workspaceVersion"] == on_disk["workspaceVersion"]

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
    print("native plugin: 19 tools and the report skill registered; real-sidecar dispatch passed")

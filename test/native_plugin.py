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
        previous_home = os.environ.get("HERMES_HOME")
        os.environ["BOARDSTATE_HERMES_STATE_DIR"] = tmp
        # The sidecar inherits this environment: never hand it the developer's real Hermes home.
        os.environ["HERMES_HOME"] = str(Path(tmp) / "hermes-home")
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

            # Live Hermes data builtins render only their rpc binding; an agent that omits it
            # gets the widget bound to its default method, and an explicit binding is kept.
            live = json.loads(
                await ctx.tools["boardstate_widget_add"]["handler"](
                    {
                        "tab": "native",
                        "id": "native-sessions",
                        "kind": "builtin:sessions",
                        "title": "Sessions",
                        "grid": {"x": 0, "y": 3, "w": 6, "h": 4},
                    }
                )
            )
            assert "error" not in live, live
            explicit = json.loads(
                await ctx.tools["boardstate_widget_add"]["handler"](
                    {
                        "tab": "native",
                        "id": "native-usage",
                        "kind": "builtin:usage",
                        "title": "Usage",
                        "grid": {"x": 6, "y": 3, "w": 6, "h": 4},
                        "bindings": {"value": {"source": "static", "value": {"totals": {}}}},
                    }
                )
            )
            assert "error" not in explicit, explicit
            on_disk = json.loads((Path(tmp) / "dashboard" / "workspace.json").read_text())
            by_id = {w["id"]: w for t in on_disk["tabs"] for w in t["widgets"]}
            assert by_id["native-sessions"]["bindings"] == {
                "value": {"source": "rpc", "method": "sessions.list"}
            }, by_id["native-sessions"]
            assert by_id["native-usage"]["bindings"]["value"]["source"] == "static", by_id["native-usage"]
            assert "bindings" not in by_id["native-card"] or not by_id["native-card"]["bindings"]

            # workspace_replace: the server owns workspaceVersion and every tab's createdBy
            # (store.mutate bumps the version; the replace sanitizer reassigns createdBy), so a
            # doc that omits or garbles them is accepted and the stored values are the server's.
            current = json.loads(await ctx.tools["boardstate_workspace_get"]["handler"]({}))["doc"]
            before_version = current["workspaceVersion"]
            board_owner = next(t for t in current["tabs"] if t["slug"] == "board")["createdBy"]
            native_owner = next(t for t in current["tabs"] if t["slug"] == "native")["createdBy"]
            assert native_owner.startswith("agent:"), native_owner
            doc = json.loads(json.dumps(current))
            doc.pop("workspaceVersion")
            for tab in doc["tabs"]:
                if tab["slug"] == "board":
                    tab["createdBy"] = "agent"  # invalid: the handler fills it, the server restores
                else:
                    tab["createdBy"] = "user"  # valid but wrong: only the server can restore it
            # New tabs: one with no owner, one claiming "system" (valid, so the handler keeps it).
            doc["tabs"].append({"slug": "replaced", "title": "Replaced", "hidden": False, "widgets": []})
            doc["tabs"].append(
                {"slug": "claimed", "title": "Claimed", "hidden": False, "widgets": [], "createdBy": "system"}
            )
            doc["prefs"]["tabOrder"] = [t["slug"] for t in doc["tabs"]]
            replaced = json.loads(
                await ctx.tools["boardstate_workspace_replace"]["handler"]({"doc": doc})
            )
            assert "error" not in replaced, replaced
            on_disk = json.loads((Path(tmp) / "dashboard" / "workspace.json").read_text())
            assert on_disk["workspaceVersion"] == before_version + 1, on_disk["workspaceVersion"]
            tabs = {t["slug"]: t for t in on_disk["tabs"]}
            # Existing tabs keep their stored owner; new tabs get the calling agent's actor.
            assert tabs["board"]["createdBy"] == board_owner, tabs["board"]["createdBy"]
            assert tabs["native"]["createdBy"] == native_owner, tabs["native"]["createdBy"]
            assert tabs["claimed"]["createdBy"] == native_owner, tabs["claimed"]["createdBy"]
            assert tabs["replaced"]["createdBy"] == native_owner, tabs["replaced"]["createdBy"]

            # Everything else is still validated: a bad slug is refused and nothing is written.
            state = Path(tmp) / "dashboard"
            undo_before = sorted(p.name for p in (state / "undo").iterdir())
            disk_before = (state / "workspace.json").read_bytes()
            bad = json.loads(json.dumps(on_disk))
            bad["tabs"][0]["slug"] = "Not A Slug"
            refused = json.loads(
                await ctx.tools["boardstate_workspace_replace"]["handler"]({"doc": bad})
            )
            assert "error" in refused, refused
            assert (state / "workspace.json").read_bytes() == disk_before
            assert sorted(p.name for p in (state / "undo").iterdir()) == undo_before

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
            if previous_home is None:
                os.environ.pop("HERMES_HOME", None)
            else:
                os.environ["HERMES_HOME"] = previous_home


if __name__ == "__main__":
    asyncio.run(_run())
    print("native plugin: 19 tools and the report skill registered; real-sidecar dispatch passed")

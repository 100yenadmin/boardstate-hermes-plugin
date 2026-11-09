"""Boardstate unified Hermes plugin: native agent tools plus dashboard/Desktop UI."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any


_ROOT = Path(__file__).resolve().parent
_RUNTIME_MODULE = "_boardstate_shared_sidecar_runtime_v150"
REPORT_SKILL_NAME = "boardstate-report-problem"


def _load_runtime():
    existing = sys.modules.get(_RUNTIME_MODULE)
    if existing is not None:
        return existing
    spec = importlib.util.spec_from_file_location(
        _RUNTIME_MODULE, _ROOT / "boardstate_sidecar.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load Boardstate sidecar runtime")
    module = importlib.util.module_from_spec(spec)
    sys.modules[_RUNTIME_MODULE] = module
    spec.loader.exec_module(module)
    return module


_runtime = _load_runtime()


def _tool_contracts() -> list[dict[str, Any]]:
    path = _ROOT / "dashboard" / "tools.schema.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise RuntimeError("dashboard/tools.schema.json must contain a list")
    return payload


REPLACE_TOOL = "boardstate_workspace_replace"
ADD_TOOL = "boardstate_widget_add"
# The live Hermes data RPC each data-source builtin renders. Mirrors DEFAULT_DATA_METHODS in
# dashboard/sidecar/src/tool-contract.mjs (test/templates.mjs checks they agree).
_DEFAULT_DATA_METHODS = {
    "builtin:sessions": "sessions.list",
    "builtin:usage": "usage.status",
    "builtin:instances": "system-presence",
    "builtin:cron": "cron.list",
}


def _bind_live_data(widget: Any) -> Any:
    """Bind a data-source builtin the agent left unbound to its live Hermes method.

    The renderer shows only what a widget's binding returns and leaves binding these kinds
    to the host, so an unbound sessions/usage/instances/cron widget shows its empty state
    forever. An explicit ``bindings`` value (even an empty object) is kept as sent.
    """
    if not isinstance(widget, dict) or "bindings" in widget:
        return widget
    kind = widget.get("kind")
    method = _DEFAULT_DATA_METHODS.get(kind) if isinstance(kind, str) else None
    if method is None:
        return widget
    return {**widget, "bindings": {"value": {"source": "rpc", "method": method}}}
# The same actor pattern the Boardstate schema validates createdBy against.
_ACTOR = re.compile(r"^(user|system|agent:[A-Za-z0-9._-]{1,64})$")
_MAX_SAFE_INTEGER = 9007199254740991
_REGISTRY_STATUSES = ("pending", "approved", "rejected")


def _fill_server_owned_fields(args: dict[str, Any]) -> dict[str, Any]:
    """Pre-fill the fields Boardstate overwrites on every workspace replace.

    The server sets ``workspaceVersion`` to current + 1 inside its write lock,
    reassigns every tab's ``createdBy`` (the existing tab's owner, else the calling
    agent), and rebuilds every ``widgetsRegistry`` entry from its name alone (the stored
    entry, else ``pending`` + the calling agent; approval reconciliation runs after). It
    validates the raw document first, though, so an agent that omits or guesses one of
    those values is refused for a field that is then discarded. Only invalid values of
    those fields are filled, and a registry status is only ever filled with ``pending``.
    Unbound live-data widgets also get their default binding (``_bind_live_data``);
    everything else is forwarded as sent and validated by the server.
    """
    if not isinstance(args, dict):
        return args
    doc = args.get("doc")
    if not isinstance(doc, dict):
        return args
    doc = dict(doc)
    version = doc.get("workspaceVersion")
    if (
        isinstance(version, bool)
        or not isinstance(version, int)
        or not 0 <= version <= _MAX_SAFE_INTEGER
    ):
        doc["workspaceVersion"] = 0
    tabs = doc.get("tabs")
    if isinstance(tabs, list):
        filled = []
        for tab in tabs:
            if isinstance(tab, dict):
                owner = tab.get("createdBy")
                if not isinstance(owner, str) or not _ACTOR.fullmatch(owner):
                    tab = {**tab, "createdBy": "agent:agent"}
                widgets = tab.get("widgets")
                if isinstance(widgets, list):
                    tab = {**tab, "widgets": [_bind_live_data(w) for w in widgets]}
            filled.append(tab)
        doc["tabs"] = filled
    registry = doc.get("widgetsRegistry")
    if isinstance(registry, dict):
        entries = {}
        for name, entry in registry.items():
            if isinstance(entry, dict):
                if entry.get("status") not in _REGISTRY_STATUSES:
                    entry = {**entry, "status": "pending"}
                owner = entry.get("createdBy")
                if not isinstance(owner, str) or not _ACTOR.fullmatch(owner):
                    entry = {**entry, "createdBy": "agent:agent"}
            entries[name] = entry
        doc["widgetsRegistry"] = entries
    return {**args, "doc": doc}


def _handler(name: str):
    async def handle(args: dict[str, Any], **_kwargs: Any) -> str:
        try:
            args = args or {}
            if name == REPLACE_TOOL:
                args = _fill_server_owned_fields(args)
            elif name == ADD_TOOL:
                args = _bind_live_data(args)
            result = await _runtime.invoke_tool(name, args)
            return json.dumps(result, ensure_ascii=False)
        except _runtime.BoardstateUnavailable as exc:
            return json.dumps({"error": str(exc)}, ensure_ascii=False)
        except Exception as exc:
            return json.dumps(
                {
                    "error": (
                        "Boardstate tool unavailable: "
                        f"{type(exc).__name__}: {exc}"
                    )
                },
                ensure_ascii=False,
            )

    return handle


def register(ctx) -> None:
    """Register the complete static Boardstate toolset unconditionally."""
    for contract in _tool_contracts():
        name = str(contract["name"])
        input_schema = contract.get("inputSchema") or {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        }
        schema = {
            "name": name,
            "description": str(contract.get("description") or ""),
            "parameters": input_schema,
        }
        ctx.register_tool(
            name=name,
            toolset="boardstate",
            schema=schema,
            handler=_handler(name),
            is_async=True,
            description=schema["description"],
        )
    register_skill = getattr(ctx, "register_skill", None)
    if callable(register_skill):
        register_skill(
            REPORT_SKILL_NAME,
            _ROOT / "skills" / REPORT_SKILL_NAME / "SKILL.md",
            description="Boardstate: report a bug or problem",
        )
    on_unload = getattr(ctx, "on_unload", None)
    if callable(on_unload):
        on_unload(_runtime.shutdown_owned_sidecar)

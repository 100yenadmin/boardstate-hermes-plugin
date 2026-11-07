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
# The same actor pattern the Boardstate schema validates createdBy against.
_ACTOR = re.compile(r"^(user|system|agent:[A-Za-z0-9._-]{1,64})$")
_MAX_SAFE_INTEGER = 9007199254740991


def _fill_server_owned_fields(args: dict[str, Any]) -> dict[str, Any]:
    """Pre-fill the two fields Boardstate overwrites on every workspace replace.

    The server sets ``workspaceVersion`` to current + 1 inside its write lock and
    reassigns every tab's ``createdBy`` (the existing tab's owner, else the calling
    agent), but it validates the raw document first, so an agent that omits or guesses
    either value is refused for a field that is then discarded. Only those two fields
    are touched; everything else is forwarded as sent and validated by the server.
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
            filled.append(tab)
        doc["tabs"] = filled
    return {**args, "doc": doc}


def _handler(name: str):
    async def handle(args: dict[str, Any], **_kwargs: Any) -> str:
        try:
            args = args or {}
            if name == REPLACE_TOOL:
                args = _fill_server_owned_fields(args)
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

"""Boardstate unified Hermes plugin: native agent tools plus dashboard/Desktop UI."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from typing import Any


_ROOT = Path(__file__).resolve().parent
_RUNTIME_MODULE = "_boardstate_shared_sidecar_runtime_v150"


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


def _handler(name: str):
    async def handle(args: dict[str, Any], **_kwargs: Any) -> str:
        try:
            result = await _runtime.invoke_tool(name, args or {})
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
    on_unload = getattr(ctx, "on_unload", None)
    if callable(on_unload):
        on_unload(_runtime.shutdown_owned_sidecar)

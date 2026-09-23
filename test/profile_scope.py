"""Real-Hermes regression for per-profile Boardstate sidecar state."""

from __future__ import annotations

import asyncio
import os
import sys
import tempfile
from pathlib import Path

from hermes_constants import reset_hermes_home_override, set_hermes_home_override

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import boardstate_sidecar as runtime


async def _run() -> None:
    with tempfile.TemporaryDirectory(prefix="boardstate-profiles-") as tmp:
        root = Path(tmp)
        home_a = root / "profiles" / "alpha"
        home_b = root / "profiles" / "beta"
        home_a.mkdir(parents=True)
        home_b.mkdir(parents=True)
        previous = os.environ.get("HERMES_HOME")
        os.environ["HERMES_HOME"] = str(root / "launch-profile")

        token_a = set_hermes_home_override(home_a)
        try:
            port_a, _ = await runtime.ensure_sidecar("dashboard")
            secret_a = runtime.operator_secret()
            await runtime.invoke_tool(
                "boardstate_tab_create", {"title": "Alpha", "slug": "alpha"}
            )
        finally:
            reset_hermes_home_override(token_a)

        token_b = set_hermes_home_override(home_b)
        try:
            port_b, _ = await runtime.ensure_sidecar("dashboard")
            secret_b = runtime.operator_secret()
            beta_workspace = await runtime.invoke_tool("boardstate_workspace_get", {})
            beta_slugs = {tab["slug"] for tab in beta_workspace["doc"]["tabs"]}
            assert "alpha" not in beta_slugs, "beta profile opened alpha's board"
            await runtime.invoke_tool(
                "boardstate_tab_create", {"title": "Beta", "slug": "beta"}
            )
        finally:
            reset_hermes_home_override(token_b)

        assert port_a != port_b
        assert secret_a and secret_b and secret_a != secret_b

        token_a = set_hermes_home_override(home_a)
        try:
            assert runtime.operator_secret() == secret_a
            alpha_workspace = await runtime.invoke_tool("boardstate_workspace_get", {})
            alpha_slugs = {tab["slug"] for tab in alpha_workspace["doc"]["tabs"]}
            assert "alpha" in alpha_slugs and "beta" not in alpha_slugs
            runtime.shutdown_owned_sidecar()
        finally:
            reset_hermes_home_override(token_a)

        token_b = set_hermes_home_override(home_b)
        try:
            assert runtime.operator_secret() == secret_b
            runtime.shutdown_owned_sidecar()
        finally:
            reset_hermes_home_override(token_b)
            if previous is None:
                os.environ.pop("HERMES_HOME", None)
            else:
                os.environ["HERMES_HOME"] = previous


if __name__ == "__main__":
    asyncio.run(_run())
    print("profile scope: two Hermes homes retain isolated sidecars and boards")

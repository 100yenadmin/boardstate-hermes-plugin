"""Desktop socket acknowledgement follows a live upstream sidecar connection."""

from __future__ import annotations

import asyncio
import importlib.util
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parent.parent / "dashboard"


def _load():
    spec = importlib.util.spec_from_file_location(
        "boardstate_plugin_api_desktop_ack", DASHBOARD / "plugin_api.py"
    )
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class _Socket:
    def __init__(self) -> None:
        self.accepted = False
        self.sent: list[str] = []
        self.closed: list[int] = []

    async def accept(self) -> None:
        self.accepted = True

    async def send_text(self, message: str) -> None:
        self.sent.append(message)

    async def close(self, code: int) -> None:
        self.closed.append(code)


class _FailedConnect:
    async def __aenter__(self):
        raise RuntimeError("upstream unavailable")

    async def __aexit__(self, *_args):
        return False


async def _run() -> None:
    module = _load()
    module._ws_upgrade_authorized = lambda _ws: True

    async def ensure():
        return 12345, "desktop-ack-nonce"

    module._ensure_sidecar = ensure
    module.websockets.connect = lambda *_args, **_kwargs: _FailedConnect()

    socket = _Socket()
    await module.board_ws(socket)
    assert socket.accepted
    assert socket.sent == [], "Desktop received a live ack before upstream connected"
    assert socket.closed == [module.http_status.WS_1011_INTERNAL_ERROR]


if __name__ == "__main__":
    asyncio.run(_run())
    print("desktop ack: upstream failure never reports live")

"""Runtime checks for the Boardstate WebSocket upgrade authorization gate.

The compatibility cases use fake ``hermes_cli`` modules so CI needs no Hermes
checkout. When real Hermes is importable, the same helper is exercised against
its current ``web_server_chat`` auth and Host/Origin checks.
"""

from __future__ import annotations

import importlib.util
import logging
import sys
from contextlib import contextmanager
from pathlib import Path
from types import ModuleType, SimpleNamespace

DASHBOARD = Path(__file__).resolve().parent.parent / "dashboard"


def _load_plugin():
    spec = importlib.util.spec_from_file_location(
        "boardstate_plugin_api_ws_auth", DASHBOARD / "plugin_api.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def _fake_module(name: str, **attrs) -> ModuleType:
    module = ModuleType(name)
    for key, value in attrs.items():
        setattr(module, key, value)
    return module


@contextmanager
def _fake_hermes(*, chat: ModuleType | None = None, web: ModuleType | None = None):
    names = ("hermes_cli", "hermes_cli.web_server_chat", "hermes_cli.web_server")
    missing = object()
    previous = {name: sys.modules.get(name, missing) for name in names}
    package = ModuleType("hermes_cli")
    package.__path__ = []  # type: ignore[attr-defined]
    sys.modules["hermes_cli"] = package
    for short_name, module in (("web_server_chat", chat), ("web_server", web)):
        full_name = f"hermes_cli.{short_name}"
        if module is None:
            module = ModuleType(full_name)
        setattr(package, short_name, module)
        sys.modules[full_name] = module
    try:
        yield
    finally:
        for name, module in previous.items():
            if module is missing:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = module


class _WarningCapture(logging.Handler):
    def __init__(self) -> None:
        super().__init__(logging.WARNING)
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(record.getMessage())


class _FakeWebSocket:
    def __init__(self, query_params, headers, client_host: str) -> None:
        self.query_params = query_params
        self.headers = headers
        self.client = SimpleNamespace(host=client_host)
        self.url = SimpleNamespace(path="/api/plugins/boardstate/ws")


def _run_real_hermes_case(mod, check, skip) -> None:
    if importlib.util.find_spec("hermes_cli") is None:
        skip("real Hermes auth integration (hermes_cli unavailable)")
        return

    from hermes_cli import web_server as real_web
    from hermes_cli import web_server_chat as real_chat

    state = real_web.app.state
    absent = object()
    state_names = ("auth_required", "bound_host", "trusted_public_hosts")
    previous = {name: getattr(state, name, absent) for name in state_names}
    try:
        state.auth_required = False
        state.bound_host = "127.0.0.1"
        state.trusted_public_hosts = frozenset()

        rejected = _FakeWebSocket(
            {}, {"host": "127.0.0.1", "origin": "https://foreign.invalid"}, "127.0.0.1"
        )
        accepted = _FakeWebSocket(
            {"token": real_web._SESSION_TOKEN},
            {"host": "127.0.0.1", "origin": "http://127.0.0.1"},
            "127.0.0.1",
        )

        check("real Hermes rejects missing credential", not real_chat._ws_auth_ok(rejected))
        check("real Hermes rejects foreign Origin", not real_chat._ws_request_is_allowed(rejected))
        check("Boardstate rejects no-token foreign-Origin upgrade", not mod._ws_upgrade_authorized(rejected))
        check("Boardstate accepts the canonical loopback credential", mod._ws_upgrade_authorized(accepted))

        def old_upgrade_authorized(ws) -> bool:
            checker = getattr(real_web, "_ws_auth_ok", None)
            if checker is None:
                return True
            return bool(checker(ws))

        check("positive control: old helper accepts the rejected upgrade", old_upgrade_authorized(rejected))
    finally:
        for name, value in previous.items():
            if value is absent:
                try:
                    delattr(state, name)
                except AttributeError:
                    pass
            else:
                setattr(state, name, value)


def main() -> int:
    mod = _load_plugin()
    failures: list[str] = []

    def check(name: str, condition: bool) -> None:
        print(f"{'ok  ' if condition else 'FAIL'} {name}")
        if not condition:
            failures.append(name)

    def skip(name: str) -> None:
        print(f"SKIP {name}")

    ws = object()
    calls: list[str] = []

    def auth_ok(_ws) -> bool:
        calls.append("auth")
        return True

    def request_ok(_ws) -> bool:
        calls.append("request")
        return True

    chat = _fake_module(
        "hermes_cli.web_server_chat", _ws_auth_ok=auth_ok, _ws_request_is_allowed=request_ok
    )
    with _fake_hermes(chat=chat):
        check("web_server_chat auth + request checks pass", mod._ws_upgrade_authorized(ws))
        check("web_server_chat checks run in order", calls == ["auth", "request"])

    web = _fake_module("hermes_cli.web_server", _ws_auth_ok=lambda _ws: True)
    with _fake_hermes(web=web):
        check("legacy web_server auth fallback passes", mod._ws_upgrade_authorized(ws))

    web = _fake_module(
        "hermes_cli.web_server",
        _ws_auth_ok=lambda _ws: True,
        _ws_request_is_allowed=lambda _ws: False,
    )
    with _fake_hermes(web=web):
        check(
            "legacy web_server request boundary rejection fails closed",
            not mod._ws_upgrade_authorized(ws),
        )

    warning_capture = _WarningCapture()
    mod.log.addHandler(warning_capture)
    try:
        with _fake_hermes():
            check("missing auth checker fails closed", not mod._ws_upgrade_authorized(ws))
        check("missing auth checker logs one warning", len(warning_capture.messages) == 1)
    finally:
        mod.log.removeHandler(warning_capture)

    def raises(_ws) -> bool:
        raise RuntimeError("sensitive detail must not be logged")

    warning_capture = _WarningCapture()
    mod.log.addHandler(warning_capture)
    try:
        chat = _fake_module("hermes_cli.web_server_chat", _ws_auth_ok=raises)
        with _fake_hermes(chat=chat):
            check("auth checker exception fails closed", not mod._ws_upgrade_authorized(ws))
        check(
            "auth checker exception omits sensitive details",
            len(warning_capture.messages) == 1 and "sensitive detail" not in warning_capture.messages[0],
        )
    finally:
        mod.log.removeHandler(warning_capture)

    chat = _fake_module(
        "hermes_cli.web_server_chat",
        _ws_auth_ok=lambda _ws: True,
        _ws_request_is_allowed=lambda _ws: False,
    )
    with _fake_hermes(chat=chat):
        check("request boundary rejection fails closed", not mod._ws_upgrade_authorized(ws))

    _run_real_hermes_case(mod, check, skip)

    if failures:
        print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\nWebSocket auth: all available checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

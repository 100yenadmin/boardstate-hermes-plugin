"""Exit cleanup must not signal a recorded pid it cannot prove is still the sidecar."""

from __future__ import annotations

import os
import secrets
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import boardstate_sidecar as runtime


def _closed_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def main() -> int:
    failures: list[str] = []

    def check(name: str, condition: bool) -> None:
        print(f"{'ok  ' if condition else 'FAIL'} {name}")
        if not condition:
            failures.append(name)

    with tempfile.TemporaryDirectory() as tmp:
        directory = Path(tmp)
        nonce = secrets.token_urlsafe(16)
        # An unrelated process now holds the pid the dead sidecar left in its record.
        stranger = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
        try:
            runtime._write_record(
                directory,
                {"port": _closed_port(), "nonce": nonce, "pid": stranger.pid, "spawned_by": "dashboard"},
            )
            runtime._state_for(directory).update(
                {"owned": True, "nonce": nonce, "proc": None, "spawned_by": "dashboard", "state_dir": directory}
            )
            runtime._shutdown_owned_sidecar_sync(directory)
            time.sleep(0.3)
            check("unverified recorded pid is not signalled", stranger.poll() is None)
            check("record kept while an unverified process lives there", runtime._portfile_path(directory).exists())
        finally:
            stranger.kill()
            stranger.wait(timeout=10)

        # Once nothing lives at the pid, the stale record is cleaned up without signalling.
        runtime._state_for(directory).update(
            {"owned": True, "nonce": nonce, "proc": None, "spawned_by": "dashboard", "state_dir": directory}
        )
        runtime._shutdown_owned_sidecar_sync(directory)
        check("stale record removed when its pid is gone", not runtime._portfile_path(directory).exists())

    if failures:
        print(f"\nshutdown pid reuse: {len(failures)} failure(s)")
        return 1
    print("\nshutdown pid reuse: unverified pids are never signalled")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

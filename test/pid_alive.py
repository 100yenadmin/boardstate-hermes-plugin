"""The liveness probe must never signal the process it checks (Windows os.kill(pid, 0) terminates)."""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import boardstate_sidecar as runtime


def main() -> int:
    failures: list[str] = []

    def check(name: str, condition: bool) -> None:
        print(f"{'ok  ' if condition else 'FAIL'} {name}")
        if not condition:
            failures.append(name)

    child = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
    try:
        check("live child reports alive", runtime._pid_alive(child.pid))
        time.sleep(0.5)
        check("probing a live child does not terminate it", child.poll() is None)
        check("probe is repeatable", runtime._pid_alive(child.pid) and child.poll() is None)
    finally:
        child.kill()
        child.wait(timeout=10)
    check("exited child reports dead", not runtime._pid_alive(child.pid))
    check("pid 0 is never alive", not runtime._pid_alive(0))
    check("negative pid is never alive", not runtime._pid_alive(-1))
    check("own process reports alive", runtime._pid_alive(os.getpid()))
    if os.name == "nt":
        check("foreign system process reports alive", runtime._pid_alive(4))
    if sys.platform.startswith("linux"):
        zombie = subprocess.Popen([sys.executable, "-c", "pass"])
        deadline = time.monotonic() + 10
        # Do not wait(): the exited child stays a zombie until reaped.
        while time.monotonic() < deadline and not runtime._linux_pid_is_zombie(zombie.pid):
            time.sleep(0.05)
        check("unreaped zombie child is a zombie", runtime._linux_pid_is_zombie(zombie.pid))
        check("unreaped zombie child reports dead", not runtime._pid_alive(zombie.pid))
        zombie.wait(timeout=10)

    if failures:
        print(f"\npid liveness: {len(failures)} failure(s)")
        return 1
    print("\npid liveness: all checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

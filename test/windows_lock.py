"""Exercise the Windows lifecycle-lock backend with a deterministic fake msvcrt."""

from __future__ import annotations

import asyncio
import errno
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import boardstate_sidecar as runtime


class FakeMsvcrt:
    LK_NBLCK = 1
    LK_LOCK = 2
    LK_UNLCK = 3

    def __init__(self) -> None:
        self.calls: list[int] = []
        self.block_once = True

    def locking(self, _fd: int, mode: int, _size: int) -> None:
        self.calls.append(mode)
        if mode == self.LK_NBLCK and self.block_once:
            self.block_once = False
            raise OSError(errno.EACCES, "locked")


def main() -> int:
    assert hasattr(runtime, "_HAVE_MSVCRT"), "Windows lifecycle locking backend is missing"
    fake = FakeMsvcrt()
    old_fcntl = runtime._HAVE_FCNTL
    old_msvcrt_flag = runtime._HAVE_MSVCRT
    old_msvcrt = runtime.msvcrt
    runtime._HAVE_FCNTL = False
    runtime._HAVE_MSVCRT = True
    runtime.msvcrt = fake
    try:
        with tempfile.TemporaryDirectory(prefix="boardstate-win-lock-") as tmp:
            directory = Path(tmp)
            fd = asyncio.run(runtime._acquire_lifecycle_lock(directory))
            assert fake.calls[:2] == [fake.LK_NBLCK, fake.LK_NBLCK]
            runtime._release_lifecycle_lock(fd)
            assert fake.calls[-1] == fake.LK_UNLCK

            sync_fd = runtime._acquire_lifecycle_lock_sync(directory)
            assert fake.calls[-1] == fake.LK_LOCK
            runtime._release_lifecycle_lock(sync_fd)
            assert fake.calls[-1] == fake.LK_UNLCK
    finally:
        runtime._HAVE_FCNTL = old_fcntl
        runtime._HAVE_MSVCRT = old_msvcrt_flag
        runtime.msvcrt = old_msvcrt
    print("windows lock: msvcrt serializes async and sync lifecycle transactions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

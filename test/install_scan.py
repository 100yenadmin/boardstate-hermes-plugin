"""Hermes' install-time plugin scan returns `safe` for this commit.

A pinned `hermes plugins install 100yenadmin/boardstate-hermes-plugin --ref <sha>` is a community
install: Hermes scans the cloned tree and, on a `caution` verdict, asks [y/N] on a terminal and refuses
without one (Desktop, scripts, closed stdin) unless the user passes --force.
This test runs the scanner from a Hermes checkout (HERMES_SRC) over exactly what git would clone
(`git archive HEAD`) and fails on any high or critical finding.

Usage: HERMES_SRC=<hermes-agent checkout> python test/install_scan.py [<git ref, default HEAD>]
"""

from __future__ import annotations

import io
import os
import subprocess
import sys
import tarfile
import tempfile
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def main() -> int:
    src = os.environ.get("HERMES_SRC")
    if not src or not (Path(src) / "tools" / "plugin_guard.py").is_file():
        print("HERMES_SRC must point at a hermes-agent checkout with tools/plugin_guard.py", file=sys.stderr)
        return 2
    sys.path.insert(0, src)
    from tools.plugin_guard import scan_plugin  # noqa: E402

    ref = sys.argv[1] if len(sys.argv) > 1 else "HEAD"
    archive = subprocess.run(
        ["git", "-C", str(REPO), "archive", "--end-of-options", ref], check=True, capture_output=True
    ).stdout
    with tempfile.TemporaryDirectory(prefix="boardstate-scan-") as tmp:
        tree = Path(tmp) / "boardstate"
        tree.mkdir()
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            tar.extractall(tree, filter="data")
        result = scan_plugin(tree, source="100yenadmin/boardstate-hermes-plugin")

    counts = Counter(f.severity for f in result.findings)
    print(f"verdict={result.verdict} findings={len(result.findings)} {dict(sorted(counts.items()))}")
    blocking = [f for f in result.findings if f.severity in ("high", "critical")]
    for f in blocking:
        print(f"  {f.severity.upper()} {f.pattern_id} {f.file}:{f.line} {f.match[:100]}")
    if result.verdict != "safe" or blocking:
        print("FAIL: not safe. Hermes prompts on a terminal and refuses without one on caution, and refuses on dangerous.", file=sys.stderr)
        return 1
    print("ok: a pinned owner/repo install passes the scan without --force")
    return 0


if __name__ == "__main__":
    sys.exit(main())

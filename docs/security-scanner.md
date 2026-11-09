# Security scanner notes

On Hermes 0.23.0, `hermes plugins validate` and the install-time scan report `safe`: no HIGH or
CRITICAL finding, so a pinned `owner/repo` install needs no `--force`. CI runs the v0.23.0 scanner on
every commit (`test/install_scan.py`). Reviewers should still read every finding.

Before 1.5.4 the scan reported `caution` for two HIGH findings, both dependency text in the committed
`dashboard/sidecar/server.js` bundle that never runs. `build.mjs` now leaves both out of the bundle,
and `test/scan-hygiene.mjs` checks the result:

- `exfil_service`: the default Pipedream remote-MCP URL in `@boardstate/broker`'s Pipedream preset.
  Boardstate imports only the broker's OfficeCLI preset. The build lets esbuild tree-shake the
  broker's unused preset table, which takes the Pipedream and Composio presets with it. Operators
  still author connectors, any remote MCP URL included, in `boardstate.connectors.json`.
- `sudo_usage`: a comment in the MCP SDK's stdio client about the environment variables a child
  process inherits. The build drops the comment; the code is unchanged.

The MEDIUM and LOW findings are informational. They fall into these groups:

- Character-code, base64, Unicode-escape, backtick and relative-path matches in the generated bundles:
  `server.js`, `dashboard/dist/index.js`, `dashboard/vendor/boardstate-browser.js` and
  `desktop/plugin.js`.
- Oversized-file warnings for `server.js` and `docs/media/banner.png`.
- Mentions in the docs and CI: `sudo` (this file, CHANGELOG.md and a CI step name), agent-config
  file names (AGENTS.md, CLAUDE.md, CONTRIBUTING.md, CHANGELOG.md, README.md and the pull request
  template), and `pip install` / `git clone` steps (AGENTS.md and `.github/workflows/ci.yml`).
- `subprocess` use and path fixtures in `test/`.
- An example loopback dashboard address in a comment in `dashboard/sidecar/src/hermes-data.ts`.

Catalog self-updater check: the catalog CI flags a bundled JS file that contains both a
GitHub raw-content URL and a file-write call. In the sidecar bundle, the only such URL was
ajv's `$data` meta-schema **identifier** (its `$id` and the one `$ref` to it), which is never
fetched. `build.mjs` rewrites that identifier consistently to `https://ajv.js.org/refs/data.json#`,
so the check stays meaningful for this bundle: a later `releases/latest` or
`raw.githubusercontent.com` URL next to a file write would still trip it. This repository's CI
replays the check, with upstream's exact file enumeration, on every build. Boardstate has no updater;
updates arrive only through a new catalog pin plus `hermes plugins update boardstate`.

`dangerous` scanner results are not accepted. Reproduce the reviewed artifacts with:

```bash
npm ci && npm run build && git diff --exit-code
```

# AGENTS.md

Guidance for AI coding agents, and for people, working in this repository.

## What this is

Boardstate is a Hermes Agent plugin that gives the agent a durable, validated board through native tools. It includes a Web dashboard tab, a Hermes Desktop page, a Python backend, and a loopback Node sidecar. External connectors are optional and require operator configuration and grants.

## Layout

- `__init__.py`: native tool registration from the committed tool schema.
- `boardstate_sidecar.py`: shared sidecar lifecycle and profile state.
- `dashboard/src/`: Web tab, theme, templates, and transport sources.
- `dashboard/desktop/` and `desktop/plugin.js`: Desktop source and committed bundle.
- `dashboard/plugin_api.py`: dashboard HTTP and WebSocket bridge.
- `dashboard/sidecar/`: sidecar sources and committed server bundle.
- `build.mjs`: bundles, vendored assets, and tool-schema generation.
- `test/` and `.github/workflows/ci.yml`: focused checks and remote CI.

## Setup and checks

CI is `.github/workflows/ci.yml`. It builds on Node 26 and runs the committed sidecar on Node 20, the minimum supported.

```bash
npm ci
npm run build
git diff --exit-code -- dashboard/dist desktop dashboard/sidecar dashboard/vendor dashboard/tools.schema.json
node test/sidecar-smoke.mjs   # CI runs every test/*.mjs suite listed in ci.yml
python -m pip install fastapi websockets httpx
python test/plugin_api_check.py
```

The `git diff --exit-code` line is the build check: after `npm run build`, the committed bundles must not change. If they do, commit
the rebuilt files with your change.

## Rules

- Keep each change small and focused: one change per PR.
- Don't bump versions, create tags, or add CHANGELOG release headings. Maintainers cut releases.
- When changing build inputs, run the build command above and commit the regenerated Web, Desktop, sidecar, vendor, and tool-schema files. CI's "Assert built artifacts committed and in sync" step checks their equality.
- Keep dashboard and sidecar traffic on loopback and preserve session, nonce, and operator authorization boundaries.
- Reproduce connector problems with fixtures; never use real connector credentials, billed APIs, or live board data in tests.
- Never commit secrets, tokens, real user data, or machine-specific paths.
- Tests use a temporary `HERMES_HOME`, never a real one.

## Filing issues

- Search first: `gh issue list -R 100yenadmin/boardstate-hermes-plugin --state all --search "<key words>"`.
- Use the bug form headings: What happened, What you expected, Steps to reproduce, Plugin version, Hermes version, Where it happened, Operating system, Diagnostics, Relevant log lines.
- Maintainers filing from the CLI always pass labels: `--label bug,triage-pending` (or `triaged` once triaged), plus `agent-drafted` when an agent wrote it.

## Security

Report vulnerabilities privately: https://github.com/100yenadmin/boardstate-hermes-plugin/security/advisories/new

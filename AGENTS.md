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

Required checks on `main`: `build-and-smoke`, `python`, `node20-runtime`, `hermes-install-scan`, `hermes-catalog-acceptance` and
`windows-lifecycle`. Pull requests merge only when all six pass.

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

## Release and escalation
Read [the ElectricSheep release and escalation standard](https://github.com/electricsheephq/eng-standards/blob/main/policies/release-and-escalation.md) and record its approved revision; unresolved/unapproved policy does not expand existing grants.
Ship the smallest proven fix as soon as gates pass; preserve non-author review, final-candidate green CI, regression/smoke proof and Plugin Manager guarded installation.
Name storage/migration, routing/permission, shared-hook, compatibility and recovery risks; select decisive tests, and escalate holds on the policy's deadlines rather than waiting for GA.
Require representative authorized canary use, state-safe recovery, an accepted durable watcher and accurate known-issue/update guidance; publication is not user recovery.
Maintainers decide within grants; Eva decides unresolved risk/user-impact/priority trade-offs; silence authorizes only an already-delegated safe default, never a new action or waiver.
Andrew owns new access/credential grants, money, public-as-Andrew and destructive actions; record priority overrides in the existing plan without erasing safety gates.

## Release closeout (maintainers)

Required after every release, rc promoted to stable, or GA tag. Contributors don't cut releases (see Rules). After the release is published and its receipt sent:

1. Close every issue the release fully served, with a comment naming the version (never an umbrella/parent issue whose own acceptance is not met).
2. Tick the boxes it completed on ROADMAP.md / VISION.md, roadmap or tracking issues, and closed issues whose checklists shipped; close a milestone once all its issues are closed.
3. Update every README / ROADMAP line that names the latest release or what ships next.
4. Post one closeout line as a comment on the release pull request: issues closed, boxes ticked, docs updated (or "none").

## Filing issues

- Search first: `gh issue list -R 100yenadmin/boardstate-hermes-plugin --state all --search "<key words>"`.
- Use the bug form headings: What happened, What you expected, Steps to reproduce, Plugin version, Hermes version, Where it happened, Operating system, Diagnostics, Relevant log lines.
- Maintainers filing from the CLI always pass labels: `--label bug,triage-pending` (or `triaged` once triaged), plus `agent-drafted` when an agent wrote it.

## Security

Report vulnerabilities privately: https://github.com/100yenadmin/boardstate-hermes-plugin/security/advisories/new

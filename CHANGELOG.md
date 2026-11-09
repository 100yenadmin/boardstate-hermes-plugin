# Changelog

All notable changes to `boardstate-hermes-plugin` are documented here. This project
adheres to [Semantic Versioning](https://semver.org/).

## 1.5.6

### Fixed

- Markdown widgets render GFM pipe tables
  ([#32](https://github.com/100yenadmin/boardstate-hermes-plugin/issues/32)). A table an agent wrote into a
  `builtin:markdown` card showed as raw pipes (`| Category | Planned |`, `|---|---|`). It now renders as a table
  styled like `builtin:table`, on the Web tab and in Hermes Desktop.
  - Supported: a header row, a delimiter row (`---`, `:--`, `--:`, or the short `- | -`), and body rows. Both the
    header and the delimiter row need at least one pipe, and their cell counts must match. Inline code, bold, italics
    and http(s) links work inside cells, and `\|` is a literal pipe.
  - A line of text right above the table stays a paragraph. A quote line ends the table, as in GFM. Short rows are
    padded and long rows are cut to the header's width.
  - Every cell goes through the renderer's own HTML escaping, the same as a paragraph line.
  - Markdown with no such table renders exactly as before.
  - Chat messages, which use the same renderer, get tables too.
  - The upstream renderer (`@boardstate/lit` 0.9.2) has no table support yet, so the build patches it into the
    vendored copy, both the one the Web tab loads and the one built into the Desktop bundle. If a later version moves
    the code, or the Desktop build stops picking up the patch, the build fails instead of shipping without tables.

### Changed

- The `boardstate_widget_add` and `boardstate_widget_update` descriptions no longer say markdown can't render pipe
  tables. The percent-format note stays.

## 1.5.5

### Fixed

- Hermes 0.23: the Instances widget shows real instances again
  ([#31](https://github.com/100yenadmin/boardstate-hermes-plugin/issues/31)). Hermes 0.23 reports `active_agents` as a
  count, so the widget said "No connected instances.". It now lists the running Hermes gateway (its state, how many
  agents are active, and its version) and each connected messaging platform. A failed platform is left out, and a
  stopped gateway lists none. An idle time appears only when the gateway's heartbeat is stale, and then its status dot always shows the warning colour. Older hosts that
  return an agent list are read as before.
- Hermes 0.23: the Usage & Cost template's "Cost (today)" and "Tokens (today)" cards show today's values
  ([#31](https://github.com/100yenadmin/boardstate-hermes-plugin/issues/31)). Before, they showed the whole period's
  totals (the last 30 days by default) under the "today" label, because the renderer reads the metric names
  `todayCost` and `todayTokens` from the period totals. `usage.status` now adds `costToday` and `tokensToday` from
  `/api/analytics/usage`'s per-day series, using the Hermes host's local calendar day, and the template's cards select
  them. A day with no usage reads 0. A board made from this template before 1.5.5 keeps the old cards: apply the
  template again, or ask the agent to set the two cards' `metric` to `costToday` and `tokensToday`. `usage.status`
  also reports Hermes 0.23's period length as `days`.

### Changed

- The native `boardstate_widget_add` and `boardstate_widget_update` descriptions tell agents two things. A
  `builtin:stat-card` with `format: "percent"` multiplies by 100, so 0.39 shows 39%; an agent-built launch board had
  shown "3,900%" for 39.0. And tabular data goes in `builtin:table`, because `builtin:markdown` does not render pipe
  tables yet ([#32](https://github.com/100yenadmin/boardstate-hermes-plugin/issues/32)).

## 1.5.4

### Fixed

- A pinned install straight from this repository
  (`hermes plugins install 100yenadmin/boardstate-hermes-plugin --ref <sha> --enable`) works on
  Hermes 0.23.0 without `--force` and without a prompt. Hermes scans such an install as a community
  source. On a `caution` verdict it asked "Install anyway? [y/N]" on a terminal and refused with no
  terminal (Hermes Desktop, scripts, closed stdin). The verdict came from two pieces of dependency text in the committed
  sidecar bundle, and neither ever ran: the default Pipedream URL in `@boardstate/broker`'s
  connector presets (Boardstate uses only the OfficeCLI preset) and a comment in the MCP SDK's stdio
  client that mentions `sudo`. The build now tree-shakes the broker's unused preset table and drops
  that comment. The scan reports `safe`, with no HIGH or CRITICAL finding. Connector behaviour is
  unchanged: operators still author every connector, remote MCP URLs included, in
  `boardstate.connectors.json`.

### Changed

- README: the install section shows the pinned `owner/repo` form and says when to use it (Hermes
  0.23.0 can fall back to an older catalog pin). The old line said that form "asks for
  confirmation", which held only on a terminal. The security scanner notes
  match the current scan.
- CI runs the Hermes v0.23.0 install scanner on every commit and fails on any HIGH or CRITICAL
  finding (`test/install_scan.py`). `test/scan-hygiene.mjs` checks that the sidecar bundle stays
  free of both texts and still carries the OfficeCLI preset.

## 1.5.3

### Fixed

- `boardstate_workspace_replace` no longer refuses a document for the two fields the server overwrites anyway.
  The server sets `workspaceVersion` (current + 1) and every tab's `createdBy` (the existing tab's owner, else the
  calling agent), but it validated the agent's raw values first. Agents that omitted or guessed them ("agent") got
  `workspaceVersion must be an integer…` or `tabs[n].createdBy createdBy is invalid` and retried until Hermes raised its
  tool-loop warning. The native handler now fills those two fields before forwarding; everything else is validated
  exactly as before, and the stored values are still the server's.

- Live Hermes data widgets showed their empty state ("No sessions yet.", $0.00) because nothing bound them: the
  renderer leaves binding the data-source builtins to the host, and neither the board templates nor agents did. The
  Agent HQ, Usage & Cost and Sessions Monitor templates now bind `builtin:sessions`, `builtin:usage`,
  `builtin:instances` and `builtin:cron` to their live RPC, and the native `boardstate_widget_add` /
  `boardstate_workspace_replace` handlers bind one an agent left unbound. An explicit `bindings` value is kept.
- Hermes 0.23 data shapes: the sessions widget reads `is_active` and `last_active` (it showed no live dot and no time),
  and `cron.list` reads `/api/cron/jobs`, falling back to `/api/cron` on older hosts. Session and job times are sent as
  epoch milliseconds, which is what the renderer displays.

### Changed

- The native `boardstate_workspace_replace` description says those two fields may be omitted, and points small
  edits at `boardstate_widget_add` / `boardstate_widget_update`, which show on the board as each one lands. The
  native `boardstate_widget_add` description says live Hermes data widgets bind themselves, and the native
  `boardstate_data_read` description says live (`rpc`) bindings are resolved by the board, not by that tool (agents
  were calling it to verify a new live panel and getting an error).
- Screenshots of an agent-built launch board: `docs/screenshots/launch-board.png` and `docs/screenshots/launch-tasks.png`.

### Known limits on Hermes 0.23

- `builtin:instances` stays empty: `/api/status` now reports `active_agents` as a count. The Usage & Cost template's
  "today" stat cards show "—": `usage.status` returns period totals, not today's. Both are tracked for a later release.

## 1.5.2

### Added

- The `boardstate:boardstate-report-problem` skill. Ask the agent to "report a problem with Boardstate" and it collects
  versions, the surface and short log excerpts, checks for an existing issue, and drafts a report in this repository's
  bug-form headings. Nothing is filed until you approve the exact text; security problems go to a private advisory.
  Hosts without plugin skills still load the plugin.

### Changed

- README: a catalog banner, and a "Troubleshooting and reporting a bug" section that names the skill.
- Contributor docs: AGENTS.md, CONTRIBUTING.md, SECURITY.md, issue forms and a pull request template.

## 1.5.1

v1.5.1 follow-ups from the v1.5.0 review ([#20](https://github.com/100yenadmin/boardstate-hermes-plugin/issues/20)).
Item numbers refer to the #20 triage digest.

### Changed

- `@boardstate/lit` is pinned to exactly 0.9.2 (was `^0.9.1`) and the vendored element bundle,
  stylesheet and Desktop bundle are rebuilt from it; the vendored files are byte-identical to
  the npm 0.9.2 package. From lit 0.9.2: markdown headings with an ATX closing sequence
  (`## Roadmap ##`) render without the trailing `#`s, task-list glyph labels are localized,
  the sparkline value label no longer overlaps the line or clips at the right edge, and
  up/down sparklines draw as a line again.
- On an agent-owned sidecar, `boardstate_connector_invoke` runs approved readOnly connector
  tools instead of refusing every call. The upstream gate that `dashboard.connector.read` uses
  decides what is readOnly; a mutating tool still returns "open the Board tab" (409) and is
  never parked or run, and an unknown or ungranted tool is refused (item 10).
- A mutating connector call that times out is reported as parked, but a confirm that lands
  later can still run it. The parked reply and the tool description now tell the agent to
  not retry the call on its own (a retry can run the mutation twice) and to ask the operator
  for the outcome (item 9).

### Fixed

- The build copies the vendored `@boardstate/lit` files before bundling the Desktop page, so
  the first build after a lit bump no longer embeds the previous stylesheet (item 11).
- A sidecar spawn that is cancelled, or whose port-record write fails, terminates and awaits
  the new child, clears the cached state and re-raises, so no untracked second writer is left
  running (item 5).
- Sidecar shutdown waits for every accepted `/tools/invoke`, `/mcp`, `/operator` and `/rpc`
  request until its handler settles, not only native invokes and not only until the response
  closes, so a replacement cannot cut off a connector call or operator confirm mid-flight. The
  30-second fail-safe still bounds it (item 6).
- The abort-shutdown test fails if the invocation responds before the abort (item 7).
- The owner watchdog treats a port record that is not an object (for example literal `null`)
  as inconclusive instead of crashing the sidecar (item 8).
- The Desktop page recovers from "Board unavailable" on the next successful connect, without a
  remount (item 2).

### Security

- The `/ws`, `/mcp` and `/operator` nonce and operator-secret checks use a constant-time
  compare (item 1).
- CI checkouts set `persist-credentials: false` (item 3) and every CI action is pinned to a
  full commit SHA (item 4).

## 1.5.0

### Added

- Unified Hermes package layout with root `plugin.yaml`, native `register(ctx)`,
  root `desktop/plugin.js`, dashboard backend, and an MIT license.
- All 19 `boardstate_*` tools register natively from a committed schema generated from
  the sidecar's own tool definitions. The Streamable HTTP MCP route remains optional.
- Shared agent/dashboard sidecar lifecycle with explicit ownership, dashboard replacement
  of agent-owned processes, and state-preserving handoff.

### Changed

- The Desktop page uses only public SDK members: `ctx.register` with `ROUTES_AREA` and
  `SIDEBAR_NAV_AREA`, `ctx.rest`, `ctx.socket`, `ctx.onDispose`, `ctx.setTimeout` when present
  (with a fallback), and `host.notify`. It no longer reads `window.hermesDesktop` or
  constructs a tokenized WebSocket.
- Node.js is resolved from `HERMES_NODE_BIN`, then Hermes' own Node lookup, then `PATH`.
- State directories are created with mode 0700.
- Live-data widgets return a clear dashboard-unavailable result when the agent starts the
  sidecar before a dashboard is present.
- The build rewrites ajv's `$data` meta-schema identifier (a GitHub raw URL, never fetched) so
  the catalog's self-updater check is not tripped by a false positive; CI replays that check.
- CI validates against pinned Hermes upstream and checks generated tool-schema sync, runs the
  committed sidecar on Node 20 (the minimum), and runs the lifecycle probe on Windows.

### Security

- Windows: the sidecar liveness probe no longer uses `os.kill(pid, 0)`, which CPython
  maps to `TerminateProcess` on Windows; it queries the process handle instead. A
  `windows-latest` CI job exercises the probe against a real child process.
- An agent-owned sidecar no longer receives the operator secret in its environment, so an
  agent with shell access cannot read it back and approve its own pending actions.
- Loopback sidecar traffic (native tools, dashboard proxy routes, the Desktop WebSocket bridge)
  never goes through an `HTTP(S)_PROXY` from the environment, so the nonce and operator secret
  cannot reach a proxy.
- README states the operator gate's limit: it is not a boundary against an agent with
  unrestricted same-user shell access; isolate the agent's terminal (backend or OS user).

### Fixed

- Zombie sidecars (a reaper that never waits, e.g. some container inits) count as exited on
  Linux, so replacement no longer times out.
- Exit cleanup never signals a recorded pid it cannot prove is still the sidecar (our own
  unreaped child, or a nonce-verified identity probe), so pid reuse after a sidecar crash can
  no longer kill an unrelated process.
- The port record is written atomically (temp file + rename); a crash mid-write can no longer
  leave a record that blocks every start. The refusal message names the file.
- The sidecar closes connector clients before exiting, so handoffs do not orphan stdio connectors.
- Dashboard replacement now uses a nonce-authenticated loopback shutdown request, waits up to
  35 seconds for accepted native calls and connector cleanup to drain, and never signals a bare
  recorded pid. Windows therefore gets the same graceful path instead of `TerminateProcess`.
- A successful identity re-probe of the dashboard's own live child preserves its process handle,
  operator secret, and exit-cleanup ownership after a transient first-probe timeout.
- Aborted native-tool HTTP responses settle the active-invocation counter, so authenticated
  shutdown reaches connector cleanup promptly instead of waiting for the 30-second fail-safe.
- The Desktop page no longer installs theme observers after it has unmounted.
- The Desktop page works on Hermes Desktop builds whose plugin SDK has no scoped timers.
- Desktop board inputs (the notes textarea) follow the dark theme instead of rendering white.
- Agent-written notes show their text on a connected board; markdown task lists, headings followed by
  lists, and inline code render correctly (@boardstate/lit 0.9.1).
- Without Node.js, tools return "Boardstate needs Node.js >= 20 on PATH (or set
  HERMES_NODE_BIN)" instead of a bare `FileNotFoundError`. After the plugin files are
  removed mid-session, tools say so instead of suggesting `npm run build`, which only
  applies to a git checkout.
- A sidecar whose owner and adopters were all killed without cleanup (for example
  `SIGKILL`) now shuts itself down within a few seconds instead of running on as an orphan.
- A port record whose pid is alive but serves no sidecar (for example after pid reuse) no
  longer blocks every tool call and dashboard request: after the sidecar drain limit (35 s)
  the stale record is dropped and a fresh sidecar starts. The pid is never signalled.
- README: corrected the security-scanner attributions (per finding and module) and the SDK
  members the Desktop page uses, listed the real widget kinds, and rewrote the install
  instructions (catalog form first, `--ref`/`--force` for the `owner/repo` form,
  `hermes plugins enable`, profiles, uninstall); disclosed that the sidecar inherits the
  Hermes environment.

## 1.4.1

### Security

- WebSocket upgrade gate failed open on Hermes ≥ 2026-09-02
  (`web_server_chat` refactor); now fails closed.

## 1.4.0

### Added

- **Custom widgets mount in Hermes** — the library's sandboxed-widget ladder (games,
  calculators, tools) now works end-to-end in the dashboard and desktop app. Approved
  widget assets are served through a tokenized root-level route (iframes can't carry
  auth headers): per-boot capability token in the path, constant-time compared,
  traversal-jailed, approved-only with uniform 404, sandbox CSP preserved verbatim.
  Proven live: the twenty48 bundle installed, approved, mounted, and played inside
  Hermes.

## 1.3.1

### Fixed

- *Office Ops* template now targets the **real** OfficeCLI MCP contract (one `officecli`
  tool taking a CLI command line) and carries the approvals widget, so request → approve →
  run is self-contained on one board.
- Connector grants **re-register after a workspace replace** (template apply / import) —
  previously a replace silently wiped every grant until the next sidecar boot. Re-registered
  grants come back as *requested* (a replace can never resurrect a grant).

## 1.3.0

### Added — the M5 operational layer

The board can now **connect external MCP tools and act through operator-governed grants** —
the agent reads live external data and takes consequential actions, each one gated.

- **Connector broker.** When the operator authors `boardstate.connectors.json` in the
  state dir, the sidecar wires `@boardstate/broker` — connect / discover / grant lifecycle
  / pending-action engine — onto the single host. Absent config ⇒ byte-identical to before.
  Connector command/url/env are read **only** from that operator file, never the
  agent-writable workspace doc.
- **Operator security gate.** Approve / confirm / deny never travel the browser WS or the
  agent MCP proxy (both stay blocked). They flow through a new
  `POST /api/plugins/boardstate/operator` route — dashboard-session auth **plus** a
  `boardstate.operators.json` admin allowlist (absent ⇒ loopback-only; gated multi-user ⇒
  denied without an allowlist) — which forwards the exact `{method, params}` to a
  nonce-gated sidecar `/operator` endpoint that executes only the four operator verbs
  in-process. Web + desktop approvals UIs call the gated route only.
- **OfficeCLI preset** (detect-or-instruct, no binary bundling) + an "Office Ops" template.

### Security

- Agent-facing connector access is exposed **only** through the `gateCall`-protected RPCs
  (`dashboard.connector.read` / `dashboard.action.invoke`), so a connector that changes its
  tool manifest after a grant re-pends the grant before any call succeeds (anti-rug-pull) —
  the raw broker fast-path is not on the agent surface. Mutating tools always park for
  operator confirm.
- Connector config strings + the sidecar nonce are redacted from every agent-facing MCP
  surface (tool-call errors, tool_search); full detail is logged server-side only.
- Verified by revert-checked regression tests (`secret-redaction`, `rugpull-repend`) and two
  independent adversarial invariant-verification passes.

## 1.2.0

### Changed

- **Per-frontend design skins** (owner feedback: matching the palette isn't matching the
  design system). The board now speaks each host's own design language, not Boardstate's:
  - **Web** (matched to the dashboard's native Kanban tiles): flat translucent cards
    (`--color-card` @ 85%), 0.5rem radius, hairline borders, **no drop shadows**, the
    host page font, "Rules Expanded" display-font titles, sharp-cornered buttons.
  - **Desktop** (matched to the app's macOS language): the app's own `--radius-xl`
    card rounding, subtle single-layer elevation, SF system font, normal-tracking
    600-weight titles, rounded controls.
  - Both are token overrides + a small scoped stylesheet with `var()` fallbacks, so a
    non-Hermes host degrades to the stock Boardstate look. CI: `test/skin-web.mjs` +
    extended desktop bundle checks; feature media refreshed to the new look.

### Fixed

- *Usage & Cost* template: the usage-detail widget overlapped the scheduled-jobs row by
  one grid row (masked by the old heavy shadows, visible in the flat design).

## 1.1.0

### Added

- **Desktop app support.** The board runs in the Hermes desktop app (Electron) as a
  first-class page via a single self-contained `dashboard/desktop/plugin.js` (boardstate
  inlined — the desktop loader only resolves `@hermes/plugin-sdk` / `react*`). It reuses
  the **same backend** as the web tab, reaching it over the desktop bridge
  (`window.hermesDesktop.getConnection()` → `/api/plugins/boardstate/ws`), registers a
  workspace route + sidebar nav, self-styles to the desktop `--ui-*` theme tokens, and
  carries the template picker. OAuth-remote gateways fall back (poll planned).
- CI: desktop bundle structural gate (loader-safe imports, inlined boardstate, contract);
  theme test extended to the desktop token map.

## 1.0.0

The first full release: the board is now something the Hermes agent **builds and operates
live**, styled to the host and bound to real Hermes data.

### Added

- **Agent-built boards.** A networked MCP endpoint on the sidecar (`/api/plugins/boardstate/mcp`,
  StreamableHTTP) assembled against the sidecar's single host, so every `boardstate_*`
  tool call the Hermes agent makes lands on the same host the browser is subscribed to —
  widgets appear live as the agent works.
- **Live Hermes data bindings.** Read-scoped RPC handlers on the sidecar resolve
  `source:"rpc"` bindings (`usage.status` / `usage.cost` / `system-presence` /
  `sessions.list` / `cron.list` / `node.list`) against the Hermes REST surface; the
  dedicated data-source builtins self-bind. Credentials are injected server-side only.
- **Native theme adapter.** `--bs-*` tokens are aliased to Hermes' `--color-*` / `--*-base`
  tokens with a `var()` chain, so the board follows the active palette and auto-follows
  live whole-palette swaps; the light/dark base tracks the host background.
- **Live-bound templates + picker.** *Agent HQ*, *Usage & Cost*, and *Sessions Monitor*,
  applied with one click via the non-operator `dashboard.workspace.replace` RPC.
- **Security gate.** Per-spawn nonce on the sidecar WS and MCP endpoints; operator-only
  methods are blocked over the networked transport; the MCP tool list excludes operator
  approve tools.
- **CI**: build + sidecar smoke + MCP liveness + Hermes-data wire-contract + chat-event
  translator + theme mapping + template validation + Python router shape.

### Fixed

- Live data-bound widgets rendered "This widget hit an error." `<boardstate-view>` resolves
  rpc bindings by calling the binding's method directly as a networked RPC (not via
  `dashboard.data.read`), so the data methods must be registered as RPC handlers. The
  wire-contract test now exercises the real render path (revert-checked delta-sensitive).

## 0.1.0

- Initial plugin: **Board** tab mounting `<boardstate-view>` over a FastAPI WS bridge to a
  spawn-once Node sidecar; Hermes-native welcome board on an empty state dir.

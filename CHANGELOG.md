# Changelog

All notable changes to `boardstate-hermes-plugin` are documented here. This project
adheres to [Semantic Versioning](https://semver.org/).

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

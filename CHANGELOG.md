# Changelog

All notable changes to `boardstate-hermes-plugin` are documented here. This project
adheres to [Semantic Versioning](https://semver.org/).

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

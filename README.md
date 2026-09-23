# Boardstate for Hermes

Boardstate gives Hermes a durable board that the agent can build with native tools. Open
the **Board** tab in `hermes dashboard` or the **Board** page in Hermes Desktop, then ask
Hermes to create tabs, add widgets, arrange a layout, or review its design. Changes are
stored as a validated workspace document and appear live when the dashboard socket is
available.

Boardstate is one unified Hermes plugin: the agent tools, Web dashboard tab, Python
backend, Desktop page, and loopback Node sidecar install from this repository together.

## Install

Boardstate requires Hermes 0.21.2 or newer and Node 20 or newer.

```bash
hermes plugins install 100yenadmin/boardstate-hermes-plugin
```

Once it is in the Hermes catalog, the short name is equivalent:

```bash
hermes plugins install boardstate
```

Enable it in the active Hermes profile:

```yaml
plugins:
  enabled:
    - boardstate
```

Start `hermes dashboard` for the Web tab. The unified package also contributes a Desktop
plugin; enable **Boardstate** under **Capabilities → Plugins** in Hermes Desktop. The two
surfaces have separate enable switches by design.

## Native agent tools

No hand-written `mcp_servers` entry is needed. The package registers these 19 tools in the
`boardstate` toolset:

- `boardstate_workspace_get`
- `boardstate_tab_create`, `boardstate_tab_update`, `boardstate_tab_delete`,
  `boardstate_tabs_reorder`
- `boardstate_widget_add`, `boardstate_widget_update`, `boardstate_widget_move`,
  `boardstate_widget_remove`
- `boardstate_layout_set`, `boardstate_workspace_replace`, `boardstate_undo`
- `boardstate_widget_catalog`, `boardstate_design_review`,
  `boardstate_widget_scaffold`, `boardstate_data_read`
- `boardstate_tool_search`, `boardstate_connector_read`,
  `boardstate_connector_invoke`

The two connector invocation tools and `boardstate_tool_search` are always discoverable.
Without an operator-authored connector configuration they return a clear
`no connectors configured` error.

The existing Streamable HTTP MCP endpoint remains available as an optional compatibility
path at `/api/plugins/boardstate/mcp`, but normal Hermes use should rely on the native tools.

## What runs

Boardstate starts one Node sidecar on an ephemeral `127.0.0.1` port. Every spawn gets a
random nonce. Its mode-0600 port record contains the port, nonce, process id, and owner
kind so the agent and dashboard do not create competing writers.

- An agent tool call can start the sidecar without the dashboard. That sidecar gets no
  operator secret at all, so operator-only verbs are unavailable until the dashboard
  replaces it.
- When the dashboard finds an agent-owned sidecar, it terminates and replaces that process
  with a dashboard-owned one. Both use the same state directory, so the board survives.
- An agent-owned sidecar is stopped when its owner exits if no live agent process adopted
  it. A process never stops a sidecar whose port record has moved to another spawn.
- Live Hermes data widgets use the authenticated dashboard API. When only the agent half is
  running, they show an explicit "open the Board tab" unavailable message instead of
  crashing.

The Desktop plugin stays inside the public plugin SDK: `ctx.rest` carries Boardstate
requests, `ctx.socket` carries server pushes, and `ctx.onDispose` removes injected styles.
OAuth remotes support request/response traffic but the SDK intentionally provides no live
socket there, so the page reports **live updates unavailable** instead of pretending to be
live.

## Network and security disclosure

Boardstate makes no third-party network request by default.

- The sidecar, dashboard bridge, native tool wrapper, and optional MCP path communicate on
  loopback only. Live Hermes widgets call the local Hermes dashboard API.
- External connectors are opt-in. Only an operator-authored
  `$HERMES_HOME/boardstate-state/boardstate.connectors.json` can enable one. A connector may
  spawn its configured local command or contact its configured remote MCP URL; those are
  the only runtime paths that can reach outside Hermes.
- Connector reads require an approved grant. Connector mutations park for an operator
  decision. A changed connector manifest re-pends its grant.
- Operator approve/confirm/deny verbs use a separate in-memory secret that is never written
  to the port record. In gated multi-user mode, `boardstate.operators.json` is also required.
- Sidecar traffic never goes through an `HTTP(S)_PROXY` from the environment.
- **Limit of the operator gate.** It keeps approvals off the agent's tool surface: no
  `boardstate_*` tool, MCP call or board WebSocket can approve or confirm anything. It is not
  a boundary against an agent that has unrestricted shell access as the same OS user. Such
  an agent can read the loopback dashboard page, which carries the dashboard session token,
  or a same-user process's environment. If approvals must hold against the agent itself, run
  its terminal in a sandboxed backend (for example Docker, SSH or Modal) so its shell is not
  the dashboard's user, or use gated multi-user mode with `boardstate.operators.json`.
- Approved custom widgets run in an opaque-origin iframe with a no-network Content Security
  Policy. Pending, rejected, and unknown widget assets all return 404.

## Connector configuration

Connectors are optional. For example, after installing OfficeCLI, an operator can create:

```json
{
  "connectors": [
    { "name": "officecli", "transport": "stdio", "command": "officecli", "args": ["mcp"] }
  ]
}
```

Save that as `$HERMES_HOME/boardstate-state/boardstate.connectors.json`, restart the
dashboard, and approve only the requested tools you want. See
[docs/connectors/officecli.md](docs/connectors/officecli.md).

## Security scanner notes

`hermes plugins validate` reports `caution` for the committed
`dashboard/sidecar/server.js` bundle. The bundle is generated from the pinned packages in
`package-lock.json`; reviewers should still inspect every warning:

- `dump_all_env`: code bundled from the MCP SDK filters an environment allowlist for child
  processes. Boardstate does not return the host environment to an agent.
- `exfil_service`: the optional Pipedream preset URL string in `@boardstate/broker` is
  classified as a possible exfiltration service. It is inert until an operator authors and
  approves that connector.
- `sudo_usage`: the match is text in a bundled comment, not a command Boardstate executes.
- Medium `char-code`, `base64`, and Unicode-escape matches come from generated dependency
  code and data tables. The oversized-file warning is expected for the self-contained
  sidecar and Desktop bundles.

`dangerous` scanner results are not accepted. Reproduce the reviewed artifacts with:

```bash
npm ci && npm run build && git diff --exit-code
```

## Development and tests

The build produces the Web bundle, root `desktop/plugin.js`, sidecar bundle, vendored Lit
assets, and `dashboard/tools.schema.json`. The schema is generated from the same Boardstate
tool factory and connector definitions the sidecar invokes.

CI keeps the existing sidecar, connector, operator, widget, theme, Web, Desktop, and Python
tests. It also pins Hermes upstream commit
`38c289c0146ed8c8b2b767eca1fff6f5b7e6382e` and runs plugin validate, doctor, compat,
native-tool dispatch, WebSocket auth, and the schema sync gate.

## Screenshots

The catalog screenshots will be added under [`docs/screenshots/`](docs/screenshots/) after
the orchestrated Web and Desktop capture pass.

## License

MIT — see [LICENSE](LICENSE).

# boardstate-hermes-plugin

A drop-in tab for the [Hermes](https://github.com/NousResearch/hermes-agent) web
dashboard (`hermes dashboard`) that renders a **live [Boardstate](https://github.com/100yenadmin/boardstate) board** —
the layout-as-data dashboard an agent builds via `boardstate-mcp`, streamed into the
Hermes UI over a WebSocket to a local sidecar.

The plugin adds a **Board** tab (after *Skills*). Opening it mounts the real
`<boardstate-view>` custom element and drives it over the Boardstate networked
transport. A Node sidecar owns the control plane over an fs-backed store, so a widget
an agent adds via `boardstate-mcp` (or the `boardstate` CLI) against the same state
dir shows up on the board.

## Architecture

```
browser  <boardstate-view> + createWsTransport
   │  ws  /api/plugins/boardstate/ws   (SDK buildWsUrl → authed by the Hermes WS gate)
   ▼
plugin_api.py  ── FastAPI WS bridge (relays JSON frames verbatim) + sidecar lifecycle
   │  ws  ws://127.0.0.1:<ephemeral>/ws
   ▼
sidecar/server.js  ── @boardstate/server control plane (createInProcessHost +
   │                   registerBoardstateRpc + attachWsTransport) over an fs store
   ▼
~/.hermes/boardstate-state/dashboard/workspace.json   ← also written by boardstate-mcp
```

### Why a WebSocket proxy (not a direct browser→sidecar connection)

The browser connects to the **dashboard origin**, so auth is the dashboard's
canonical WS gate (`web_server._ws_auth_ok`) — the same gate the bundled *kanban*
plugin's live feed uses. It transparently accepts the right credential in every mode
(loopback `?token=`, gated single-use `?ticket=`, server-internal `?internal=`), and
works under `--host` / gated OAuth / HTTPS where a direct `ws://127.0.0.1:<port>` from
the page would be blocked (mixed content) or unreachable. The SDK's `buildWsUrl`
attaches the credential; `plugin_api.py` bridges the authenticated upgrade to the
loopback sidecar. The sidecar binds `127.0.0.1` only and is never exposed to the
browser. No bespoke token scheme.

### File tree

```
dashboard/
├── manifest.json          tab "Board" (/board), entry dist/index.js, css, api
├── plugin_api.py          FastAPI: WS bridge + Node sidecar lifecycle + /health
├── src/index.tsx          React tab (host React) → mounts <boardstate-view> over createWsTransport
├── dist/index.js          built browser bundle (IIFE, React external, createWsTransport inlined)
├── sidecar/
│   ├── src/server.ts       sidecar source
│   └── server.js           built self-contained ESM bundle (all @boardstate/* inlined)
└── vendor/
    ├── boardstate-browser.js   @boardstate/lit/browser — registers <boardstate-view>
    └── boardstate.css          @boardstate/lit stylesheet (manifest `css`)
build.mjs                  esbuild driver (frontend + sidecar + vendor copy)
```

The built artifacts (`dist/`, `sidecar/server.js`, `vendor/*`) are committed — the
plugin is a **runtime drop-in and does no npm resolution at runtime** (only `node`).

## Install

Requires Node ≥ 20 on the machine running `hermes dashboard`.

```bash
# 1. Drop the plugin into the Hermes user-plugin dir (note the dashboard/ subdir).
mkdir -p ~/.hermes/plugins/boardstate
cp -r dashboard ~/.hermes/plugins/boardstate/dashboard

# 2. Enable it (user plugins are gated by plugins.enabled in config.yaml).
hermes plugins enable boardstate      # or add `boardstate` under plugins.enabled

# 3. (Re)start the dashboard, or force a rescan:
hermes dashboard
#   curl http://127.0.0.1:9119/api/dashboard/plugins/rescan   # rescan without restart
#   (backend API routes mount at startup only — restart after first install)
```

Open the dashboard; the **Board** tab appears after *Skills*.

### Config

| Setting | Default | Notes |
|---------|---------|-------|
| Board state dir | `$HERMES_HOME/boardstate-state` | Override with `BOARDSTATE_HERMES_STATE_DIR`. Point `boardstate-mcp` at the same dir (`BOARDSTATE_STATE_DIR`) so the agent and the tab share one board. |
| Node binary | `node` on `PATH` | Override with `HERMES_NODE_BIN`. |

Populate the board with the Boardstate MCP server or CLI against the same dir:

```bash
export BOARDSTATE_STATE_DIR=~/.hermes/boardstate-state
boardstate dashboard widgets add --tab main --kind builtin:markdown \
  --title "Hello" --props '{"markdown":"# Live from the agent"}'
# …or run `boardstate-mcp` so an agent builds the board via tools.
```

> **Cross-process live updates:** the sidecar broadcasts `boardstate.changed` on its
> *own* writes, so writes from a *separate* `boardstate-mcp` process are picked up on
> the next board read (open/reload the tab), not pushed live. Agent turns driven
> through the same board render live. (v1 has no shared cross-process event bus.)

## Dev loop

```bash
npm install                 # esbuild (build-time only)
# Build needs a local Boardstate monorepo (packages built with `pnpm install && pnpm build`).
BOARDSTATE_REPO=/path/to/boardstate npm run build
```

`build.mjs` emits `dashboard/dist/index.js`, `dashboard/sidecar/server.js`, and copies
the vendored `@boardstate/lit/browser` bundle + stylesheet. Only the build needs the
monorepo; the emitted artifacts are self-contained.

## Screenshots

`docs/` slots (add your own):

- `docs/board-tab.png` — the Board tab in the dashboard nav.
- `docs/board-live.png` — a live board with agent-authored widgets.

A verification capture (harness rendering the real `dist/index.js` against a live
sidecar) is produced during end-to-end testing; see the repo's build notes.

## License

MIT

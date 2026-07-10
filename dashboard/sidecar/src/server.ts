// Boardstate sidecar — the Node control-plane host the Hermes dashboard plugin
// proxies to. It owns the SAME in-process host the boardstate CLI / MCP / demo own
// (`createInProcessHost` + `registerBoardstateRpc`) over an fs-backed store, and
// exposes it to the browser over the networked WebSocket transport
// (`attachWsTransport`, path `/ws`). The Hermes plugin backend (`plugin_api.py`)
// spawns exactly one of these per dashboard process and bridges the browser's
// authenticated `/api/plugins/boardstate/ws` upgrade to this loopback endpoint.
//
// This file is bundled to `dashboard/sidecar/server.js` (a single self-contained
// ESM file, all `@boardstate/*` deps inlined) so the shipped plugin needs no npm
// resolution at runtime — only `node`.
//
// Wire: JSON text frames { id, method, params } / { id, result|error } / { event,
// payload } — the exact contract `createWsTransport` (browser) speaks. The store is
// fs-backed at `BOARDSTATE_STATE_DIR` (default `~/.boardstate`), so a widget written
// by a separate `boardstate-mcp` process against the same dir is read on the next
// control-plane read and rendered.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { DashboardStore } from "@boardstate/core";
import { FsStorageAdapter } from "@boardstate/core/node";
import {
  attachWsTransport,
  createInProcessHost,
  createWidgetHttpRouteHandler,
  nodeRpcDeps,
  registerBoardstateRpc,
} from "@boardstate/server/node";

const stateDirEnv = process.env.BOARDSTATE_STATE_DIR;
const storage = new FsStorageAdapter(stateDirEnv ? { storageDir: stateDirEnv } : {});
const store = new DashboardStore({ storage });
const host = createInProcessHost(store, storage);
// Same registration the MCP server uses: base 14 methods + shipped extensions, with
// the node-side file-binding resolver + widget-bundle installer injected.
registerBoardstateRpc(host, {
  store,
  dataRead: { stateDir: store.stateDir },
  ...nodeRpcDeps(),
});

// Approved custom-widget assets resolve under the sidecar's own `/widgets` route
// (same CSP as the CLI/demo). Built-in widget renderers ship inside the browser
// bundle and need no server route.
const widgetRoute = createWidgetHttpRouteHandler({ store });

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  void widgetRoute
    .handleHttpRequest(req, res)
    .then((handled) => {
      if (handled) {
        return;
      }
      if (req.method === "GET" && (req.url ?? "/").split("?")[0] === "/healthz") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, stateDir: store.stateDir }));
        return;
      }
      res.statusCode = 404;
      res.end("not found");
    })
    .catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("error");
      } else {
        res.end();
      }
    });
});

// The networked control-plane seam. Auth is the parent's job (the Hermes WS gate on
// `/api/plugins/boardstate/ws`); this endpoint only ever receives loopback traffic
// from `plugin_api.py`, so it accepts every upgrade on `/ws`.
attachWsTransport(httpServer, host, { path: "/ws" });

const port = Number(process.env.PORT ?? 0);
const hostname = "127.0.0.1";

httpServer.listen(port, hostname, () => {
  const address = httpServer.address();
  const bound = typeof address === "object" && address ? address.port : port;
  // Announce the bound port to the parent on a single stdout JSON line. `plugin_api`
  // reads stdout until it sees this frame, then knows where to bridge.
  process.stdout.write(
    `${JSON.stringify({ boardstateSidecar: { port: bound, stateDir: store.stateDir } })}\n`,
  );
});

const shutdown = (): void => {
  httpServer.close(() => process.exit(0));
  // Fail-safe: don't hang forever if a socket is stuck.
  setTimeout(() => process.exit(0), 1000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

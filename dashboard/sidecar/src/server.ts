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
import { validateWorkspaceDoc } from "@boardstate/schema";
import {
  attachWsTransport,
  createInProcessHost,
  createWidgetHttpRouteHandler,
  nodeRpcDeps,
  registerBoardstateRpc,
} from "@boardstate/server/node";
import { createHermesRpcResolver, registerHermesDataRpc } from "./hermes-data.js";
import { createMcpEndpoint } from "./mcp.js";

const stateDirEnv = process.env.BOARDSTATE_STATE_DIR;
const storage = new FsStorageAdapter(stateDirEnv ? { storageDir: stateDirEnv } : {});
const store = new DashboardStore({ storage });

// A clean, fully-renderable, Hermes-native first-boot board. The upstream
// `DashboardStore` seeds a default "Overview" whose stat-card/instances/etc. widgets
// bind to host RPCs a generic Boardstate sidecar doesn't serve — those render as red
// error cells. We pre-empt that seed for an EMPTY state dir only (workspace.json
// absent — the exact condition the default seed triggers on), so an operator's first
// open shows a welcoming board with zero error cells. A non-empty dir is never touched.
const WELCOME_WORKSPACE = {
  schemaVersion: 1,
  workspaceVersion: 1,
  widgetsRegistry: {},
  prefs: { tabOrder: ["board"] },
  tabs: [
    {
      slug: "board",
      title: "Board",
      icon: "layoutDashboard",
      hidden: false,
      createdBy: "system",
      widgets: [
        {
          id: "welcome",
          kind: "builtin:markdown",
          title: "Hermes Board",
          grid: { x: 0, y: 0, w: 6, h: 3 },
          collapsed: false,
          hidden: false,
          props: {
            markdown:
              "# Hermes Board\n\nAsk Hermes to build here — every `boardstate_*` tool call lands on this board live.",
          },
        },
        {
          id: "example",
          kind: "builtin:markdown",
          title: "Example widget",
          grid: { x: 6, y: 0, w: 6, h: 3 },
          collapsed: false,
          hidden: false,
          props: {
            markdown:
              "**Example widget** — a props-only card, no data source needed.\n\nAsk Hermes for a live one: a stat card, an activity feed, or a custom widget.",
          },
        },
      ],
    },
  ],
};

async function seedInitialWorkspaceIfEmpty(): Promise<void> {
  // `readFile` returns null when the file is absent — the same signal the store's own
  // seed uses. Present ⇒ an existing board we must leave untouched.
  if ((await storage.readFile(store.workspacePath)) !== null) {
    return;
  }
  const doc = validateWorkspaceDoc(structuredClone(WELCOME_WORKSPACE));
  await storage.mkdir(store.dashboardDir);
  await storage.writeFileAtomic(store.workspacePath, JSON.stringify(doc, null, 2));
}

await seedInitialWorkspaceIfEmpty();

const host = createInProcessHost(store, storage);

// Data-read resolver: the node default (file bindings + widget installer), wrapped with
// the Hermes REST resolver when `plugin_api` injected a dashboard URL + session token at
// spawn. Without them (CLI/demo), the stock node resolver is used unchanged — so live
// Hermes data is a pure superset, never a regression.
const nodeDeps = nodeRpcDeps();
const hermesUrl = process.env.HERMES_DASHBOARD_URL;
const hermesToken = process.env.HERMES_SESSION_TOKEN;
const resolveBinding =
  hermesUrl && hermesToken
    ? createHermesRpcResolver({
        baseUrl: hermesUrl,
        sessionToken: hermesToken,
        fallback: nodeDeps.resolveBinding,
      })
    : nodeDeps.resolveBinding;

// Same registration the MCP server uses: base methods + shipped extensions, with the
// node-side widget-bundle installer + the (possibly Hermes-wrapped) binding resolver.
registerBoardstateRpc(host, {
  store,
  dataRead: { stateDir: store.stateDir },
  ...nodeDeps,
  resolveBinding,
});

// Live Hermes data bindings. `<boardstate-view>` resolves a `source:"rpc"` binding by
// calling the binding's METHOD as a networked RPC (usage.status / usage.cost /
// system-presence / sessions.list / cron.list / node.list) — NOT via dashboard.data.read
// — so those methods must be registered as read-scoped RPC handlers or every data-bound
// widget shows an error cell. Only when plugin_api injected the Hermes credentials.
if (hermesUrl && hermesToken) {
  const dataMethods = registerHermesDataRpc(host, { baseUrl: hermesUrl, sessionToken: hermesToken });
  console.log(`[boardstate] live Hermes data RPC methods: ${dataMethods.join(", ")}`);
}

// Approved custom-widget assets resolve under the sidecar's own `/widgets` route
// (same CSP as the CLI/demo). Built-in widget renderers ship inside the browser
// bundle and need no server route.
const widgetRoute = createWidgetHttpRouteHandler({ store });

// The networked MCP endpoint the Hermes agent connects to (StreamableHTTP), assembled
// against THIS host so its `boardstate_*` writes land on the same bus the board reads.
// Same per-spawn nonce gate as the WS.
const sidecarNonceForMcp = process.env.BOARDSTATE_SIDECAR_NONCE;
const mcpEndpoint = await createMcpEndpoint(host, store, { nonce: sidecarNonceForMcp });

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const pathname = (req.url ?? "/").split("?")[0];
  void mcpEndpoint
    .handle(req, res, pathname)
    .then((handledMcp) => {
      if (handledMcp) {
        return undefined;
      }
      return widgetRoute.handleHttpRequest(req, res).then((handled) => {
        if (handled) {
          return;
        }
        if (req.method === "GET" && pathname === "/healthz") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, stateDir: store.stateDir }));
          return;
        }
        res.statusCode = 404;
        res.end("not found");
      });
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

// The networked control-plane seam. Auth is primarily the parent's job (the Hermes WS
// gate on `/api/plugins/boardstate/ws`), but defense-in-depth: the parent passes a
// per-spawn nonce (`BOARDSTATE_SIDECAR_NONCE`) that the bridge appends to its upstream
// `?nonce=` — so a random OTHER local process that scans the ephemeral loopback port
// cannot drive the control plane. If no nonce is set (e.g. the boardstate CLI/demo
// spawning this directly), the endpoint stays open on loopback as before.
const sidecarNonce = process.env.BOARDSTATE_SIDECAR_NONCE;
attachWsTransport(httpServer, host, {
  path: "/ws",
  verifyClient: (req: IncomingMessage): boolean => {
    if (!sidecarNonce) {
      return true;
    }
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      return url.searchParams.get("nonce") === sidecarNonce;
    } catch {
      return false;
    }
  },
});

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

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

import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join } from "node:path";
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
import { installConnectorsFromConfig, type ConnectorWorkspace } from "./connectors.js";
import {
  createHermesRpcResolver,
  registerHermesDataRpc,
  registerUnavailableHermesDataRpc,
} from "./hermes-data.js";
import { createInternalEndpoint } from "./internal.js";
import { createMcpEndpoint } from "./mcp.js";
import { createOperatorEndpoint } from "./operator.js";
import { officeCliBootHint } from "./presets.js";
import { buildRedactor } from "./redact.js";

const ignoreBrokenPipe = (error: NodeJS.ErrnoException): void => {
  if (error.code !== "EPIPE") {
    setImmediate(() => {
      throw error;
    });
  }
};
process.stdout.on("error", ignoreBrokenPipe);
process.stderr.on("error", ignoreBrokenPipe);

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

// M5 operational layer: if the operator authored `boardstate.connectors.json` in the
// state dir, wire the whole connector stack (broker → grant lifecycle + pending-action
// engine → agent-tool adapter → `boardstate_tool_search` backing) onto THIS host, BEFORE
// `registerBoardstateRpc` (the engine registers `dashboard.action.*` + `dashboard.connector.read`;
// the base RPC registration then takes the workspace's `capabilityToolsHash` so partial
// grants stay anti-rug-pull correct — SPEC §17.1). Absent config ⇒ `null` ⇒ byte-identical
// to the pre-M5 board. The config path is fixed (state dir), never the agent-writable doc.
// Bounded wait for an operator's confirm on an agent-invoked mutation (CORRECT-1): threaded
// into BOTH the pending-action engine and the MCP `boardstate_connector_invoke` tool, so the
// agent's tools/call can never hang forever waiting on a confirm that never comes. Overridable
// via env (tests use a short value); defaults to the broker's 5-minute default.
// Explicitly reject 0/negative/garbage rather than silently coercing to the default:
// "no confirm-wait" isn't a supported mode (the CORRECT-1 invariant needs a bound), so a
// set-but-invalid value is called out loud and the safe default applies.
const rawMutationTimeout = process.env.BOARDSTATE_MUTATION_TIMEOUT_MS;
const parsedMutationTimeout = rawMutationTimeout === undefined ? undefined : Number(rawMutationTimeout);
if (parsedMutationTimeout !== undefined && !(Number.isFinite(parsedMutationTimeout) && parsedMutationTimeout > 0)) {
  console.error(
    `[boardstate] BOARDSTATE_MUTATION_TIMEOUT_MS=${rawMutationTimeout} is invalid (must be a positive number of ms) — using the 300000ms default`,
  );
}
const mutationTimeoutMs =
  parsedMutationTimeout !== undefined && Number.isFinite(parsedMutationTimeout) && parsedMutationTimeout > 0
    ? parsedMutationTimeout
    : 300_000;

let connectors: ConnectorWorkspace | null = null;
try {
  connectors = await installConnectorsFromConfig(host, store, { mutationTimeoutMs });
} catch (err) {
  // A present-but-malformed config is fail-closed: no connectors wired, board still renders.
  console.error(
    `[boardstate] connectors config rejected: ${err instanceof Error ? err.message : String(err)}`,
  );
}

// Same registration the MCP server uses: base methods + shipped extensions, with the
// node-side widget-bundle installer + the (possibly Hermes-wrapped) binding resolver, plus
// the connector workspace's partial-grant hash resolver when connectors are wired.
registerBoardstateRpc(host, {
  store,
  dataRead: { stateDir: store.stateDir },
  ...nodeDeps,
  resolveBinding,
  ...(connectors ? { capabilityToolsHash: connectors.workspace.capabilityToolsHash } : {}),
});

// Block boot on the initial grant registration + granted-tool cache so the first board
// open already shows the connectors' `requested` grants. Non-fatal: a connector that can't
// connect (e.g. its binary is absent) degrades to "unavailable" — the board still renders.
if (connectors) {
  await connectors.workspace.ready.catch((err: unknown) => {
    console.error(
      `[boardstate] connector workspace not fully ready: ${err instanceof Error ? err.message : String(err)}`,
    );
  });
  console.error(
    `[boardstate] connectors wired: ${connectors.broker.connectorNames().join(", ") || "(none)"}`,
  );
} else {
  // No connectors yet — surface the first blessed connector's detect-or-instruct hint so an
  // operator sees the exact next step (install OfficeCLI, then author boardstate.connectors.json).
  console.error(officeCliBootHint());
}

// Live Hermes data bindings. `<boardstate-view>` resolves a `source:"rpc"` binding by
// calling the binding's METHOD as a networked RPC (usage.status / usage.cost /
// system-presence / sessions.list / cron.list / node.list) — NOT via dashboard.data.read
// — so those methods must be registered as read-scoped RPC handlers or every data-bound
// widget shows an error cell. Only when plugin_api injected the Hermes credentials.
if (hermesUrl && hermesToken) {
  const dataMethods = registerHermesDataRpc(host, { baseUrl: hermesUrl, sessionToken: hermesToken });
  console.error(`[boardstate] live Hermes data RPC methods: ${dataMethods.join(", ")}`);
} else {
  registerUnavailableHermesDataRpc(host);
}

// Approved custom-widget assets resolve under the sidecar's own `/widgets` route
// (same CSP as the CLI/demo). Built-in widget renderers ship inside the browser
// bundle and need no server route.
const widgetRoute = createWidgetHttpRouteHandler({ store });

// The networked MCP endpoint the Hermes agent connects to (StreamableHTTP), assembled
// against THIS host so its `boardstate_*` writes land on the same bus the board reads.
// Same per-spawn nonce gate as the WS.
const sidecarNonceForMcp = process.env.BOARDSTATE_SIDECAR_NONCE;

// Redact connector config (command/url/args/env keys+values/header values) + the sidecar
// nonce + the operator secret from any agent-facing MCP error (invariant #3). Connector-sourced
// strings are collected LENGTH-AGNOSTIC (SEC-2: an env value is an API key — even a short one
// must never leak); the nonce/secret keep a length floor. Sorted DESC by length (SEC-3) so a
// short value that prefixes a longer token can't leave the suffix unmasked.
const operatorSecret = process.env.BOARDSTATE_OPERATOR_SECRET;
const redactSecrets = buildRedactor([
  // Config-sourced secrets (command/url/args/env keys+values/header values) — length-agnostic.
  ...(connectors?.sensitiveStrings ?? []),
  // Long random process secrets: keep a floor so a stray short value never over-redacts text.
  ...[sidecarNonceForMcp, operatorSecret].filter((s): s is string => typeof s === "string" && s.length >= 8),
]);

const mcpEndpoint = await createMcpEndpoint(host, store, {
  nonce: sidecarNonceForMcp,
  redactSecrets,
  ...(connectors ? { toolSearch: connectors.workspace.toolSearch } : {}),
  ...(connectors
    ? {
        connectors: {
          confirmAndExecute: (id, opts) => connectors.workspace.actions.confirmAndExecute(id, opts),
          mutationTimeoutMs,
        },
      }
    : {}),
});
let requestSidecarShutdown = (): void => undefined;
const internalEndpoint = createInternalEndpoint(host, mcpEndpoint, {
  nonce: sidecarNonceForMcp,
  spawnedBy: process.env.BOARDSTATE_SPAWNED_BY === "agent" ? "agent" : "dashboard",
  requestShutdown: () => requestSidecarShutdown(),
});

// The operator DECISION seam: a DEDICATED-secret-gated in-process HTTP endpoint the parent
// `plugin_api` bridge (and ONLY it) forwards operator approve/confirm/deny to. Operator verbs
// stay blocked on `/ws` and excluded from `/mcp`. SEC-1: gated by BOARDSTATE_OPERATOR_SECRET
// (never the port-file adoption nonce), so port-file knowledge alone can't drive it. Disabled
// when no secret is configured (a direct CLI spawn drives the in-process host itself).
const operatorEndpoint = createOperatorEndpoint(host, { secret: operatorSecret });

let activeInvocations = 0;
let shutdownRequested = false;
let exiting = false;
// Close the connector broker's warm clients (stdio children) before exiting, so a sidecar
// handoff never orphans them. Bounded well inside the parent's 2 s SIGTERM grace.
const exitAfterCleanup = (): void => {
  if (exiting) return;
  exiting = true;
  const closing = connectors ? connectors.broker.close().catch(() => undefined) : Promise.resolve();
  const bound = new Promise<void>((resolve) => setTimeout(resolve, 1_500).unref());
  void Promise.race([closing, bound]).finally(() => process.exit(0));
};
const invocationSettled = (): void => {
  activeInvocations -= 1;
  if (shutdownRequested && activeInvocations === 0) exitAfterCleanup();
};

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const pathname = (req.url ?? "/").split("?")[0];
  if (pathname === "/tools/invoke") {
    activeInvocations += 1;
    let settled = false;
    const settleOnce = (): void => {
      if (settled) return;
      settled = true;
      invocationSettled();
    };
    res.once("finish", settleOnce);
    res.once("close", settleOnce);
  }
  void operatorEndpoint
    .handle(req, res, pathname)
    .then((handledOperator) => {
      if (handledOperator) {
        return undefined;
      }
      return internalEndpoint.handle(req, res, pathname).then((handledInternal) => {
        if (handledInternal) {
          return undefined;
        }
        return mcpEndpoint.handle(req, res, pathname).then((handledMcp) => {
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
      });
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
  if (shutdownRequested) return;
  shutdownRequested = true;
  httpServer.close(() => {
    if (activeInvocations === 0) exitAfterCleanup();
  });
  if (activeInvocations === 0) exitAfterCleanup();
  // Fail-safe for a genuinely stuck request. Normal accepted calls drain first.
  setTimeout(() => process.exit(0), 30_000).unref();
};
requestSidecarShutdown = shutdown;
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Owner watchdog. A Hermes process killed with SIGKILL never runs its exit cleanup, so an
// agent- or dashboard-owned sidecar would otherwise outlive it. Every 3 s, read the port
// record: while it is ours (same nonce), the holders are its current `owner_pid` plus its
// `adopters` — the same set the Python lifecycle hands ownership between — so a sidecar that
// any live process owns or has adopted is never stopped. While a readable record names a
// different sidecar (before ours is written), only the spawning pid can know our nonce, so
// it is the holder. A missing or unreadable record skips the tick: after a handoff the
// spawner may be gone while an adopter still owns us. Inactive for a direct CLI/demo spawn
// (no nonce or owner pid).
const spawnerPid = Number(process.env.BOARDSTATE_OWNER_PID);
const recordPath = stateDirEnv ? join(stateDirEnv, ".boardstate-sidecar.json") : undefined;
// Only trust a reparent signal when node is the spawner's direct child (not behind a shim).
const spawnerIsParent = Number.isInteger(spawnerPid) && process.ppid === spawnerPid;
const pidAlive = (pid: number): boolean => {
  if (pid === spawnerPid && spawnerIsParent && process.ppid !== spawnerPid) return false;
  try {
    process.kill(pid, 0); // signal 0: existence check only, on POSIX and Windows
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
  if (process.platform === "linux") {
    // An exited but unreaped holder is a zombie; like the Python lifecycle, count it as gone.
    try {
      const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
      return !["Z", "X"].includes(stat.slice(stat.lastIndexOf(")") + 1).trim().split(" ")[0]);
    } catch {
      return true;
    }
  }
  return true;
};
const recordHolders = (): number[] | null => {
  let record: { nonce?: unknown; owner_pid?: unknown; adopters?: unknown };
  try {
    record = JSON.parse(readFileSync(recordPath as string, "utf8"));
  } catch {
    return null; // missing, unreadable, or a transient read error: decide on a later tick
  }
  if (record.nonce === sidecarNonce) {
    const adopters = Array.isArray(record.adopters) ? record.adopters : [];
    return [record.owner_pid, ...adopters].filter((pid): pid is number => Number.isInteger(pid));
  }
  return [spawnerPid];
};
if (sidecarNonce && recordPath && Number.isInteger(spawnerPid) && spawnerPid > 0) {
  setInterval(() => {
    const holders = recordHolders();
    if (holders && holders.length > 0 && !holders.some(pidAlive)) {
      console.error("[boardstate] no live owner or adopter remains; shutting down");
      shutdown();
    }
  }, 3_000).unref();
}

// Flagship-correctness proof (panel blocker #1): a tool call over the sidecar's MCP
// endpoint must push a live update to a WS-subscribed board client — i.e. the MCP tools
// and the WS clients share ONE host + one event bus. Also asserts the nonce gate on /mcp
// and that operator tools (widget_approve) are NOT exposed over MCP (blocker #2).
//
// Run after `npm run build`:  node test/mcp-liveness.mjs

import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIDECAR = join(repo, "dashboard/sidecar/server.js");
const NONCE = "liveness-nonce";

const stateDir = mkdtempSync(join(tmpdir(), "bs-live-"));
const proc = spawn(process.execPath, [SIDECAR], {
  env: { ...process.env, BOARDSTATE_STATE_DIR: stateDir, PORT: "0", BOARDSTATE_SIDECAR_NONCE: NONCE },
  stdio: ["ignore", "pipe", "pipe"],
});
let buf = "";
const port = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("no handshake")), 15000);
  proc.stdout.on("data", (d) => {
    buf += d.toString();
    for (const line of buf.split("\n")) {
      try {
        const j = JSON.parse(line);
        if (j.boardstateSidecar?.port) {
          clearTimeout(t);
          resolve(j.boardstateSidecar.port);
        }
      } catch {
        /* noise */
      }
    }
  });
  proc.stderr.on("data", (d) => process.stderr.write("[sidecar-err] " + d));
  proc.on("exit", (c) => reject(new Error("sidecar exited " + c)));
});

const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// A WS board client, listening for the live-update event.
const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
let liveEvent = false;
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("ws never opened")), 8000);
  ws.on("open", () => {
    clearTimeout(t);
    resolve();
  });
  ws.on("message", (data) => {
    try {
      const m = JSON.parse(data.toString());
      if (m.event === "boardstate.changed") liveEvent = true;
    } catch {
      /* noise */
    }
  });
  ws.on("error", reject);
});

// The Hermes agent's view: an MCP client over StreamableHTTP.
const mcp = new Client({ name: "liveness-test", version: "1.0.0" }, { capabilities: {} });
await mcp.connect(
  new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)),
);

const { tools } = await mcp.listTools();
const names = tools.map((t) => t.name);
check("MCP exposes boardstate_ tools", names.some((n) => n.startsWith("boardstate_")));
check("MCP exposes boardstate_tab_create", names.includes("boardstate_tab_create"));
check("MCP does NOT expose operator approve tool", !names.includes("boardstate_widget_approve"));

// The build: a tool call that mutates the shared store.
await mcp.callTool({ name: "boardstate_tab_create", arguments: { slug: "live", title: "Live Tab" } });

// Give the event a beat to arrive on the WS.
await new Promise((r) => setTimeout(r, 400));
check("WS client received a live boardstate.changed event from the MCP write", liveEvent);

// And the write is durable in the shared store.
const after = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("workspace.get timeout")), 5000);
  const onMsg = (data) => {
    const m = JSON.parse(data.toString());
    if (m.id === "verify") {
      clearTimeout(t);
      ws.off("message", onMsg);
      resolve(m.result?.doc);
    }
  };
  ws.on("message", onMsg);
  ws.send(JSON.stringify({ id: "verify", method: "dashboard.workspace.get", params: {} }));
});
check("new tab is in the shared store", (after?.tabs ?? []).some((t) => t.slug === "live"));

// Nonce gate on /mcp: a wrong nonce is rejected (connect throws / 401).
let mcpRejected = false;
try {
  const bad = new Client({ name: "bad", version: "1.0.0" }, { capabilities: {} });
  await bad.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=wrong`)));
  await bad.listTools();
} catch {
  mcpRejected = true;
}
check("MCP /mcp nonce gate rejects a wrong nonce", mcpRejected);

ws.close();
await mcp.close().catch(() => undefined);
proc.kill("SIGTERM");

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nmcp liveness: all checks passed — single host, live board updates");

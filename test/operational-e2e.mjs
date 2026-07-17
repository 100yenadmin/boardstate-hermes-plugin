// Stage 5 — the whole M5 operational loop, headless, against the REAL built sidecar:
//
//   agent request (tool_search) → operator APPROVE (through the operator gate) →
//   agent invokes a granted readOnly tool DIRECTLY → agent invokes a mutation that PARKS →
//   operator CONFIRM (through the operator gate) → the parked mutation executes → result.
//
// The agent drives the sidecar's MCP endpoint (its real seam); the operator's approve/confirm
// POST to the sidecar's nonce-gated /operator — the EXACT wire the plugin_api operator route
// forwards to (plugin_api's auth + operators-allowlist layer in front is proven separately in
// test/operator_wire.py). Also asserts the operator endpoint refuses a non-operator verb and a
// wrong nonce (the sidecar half of invariant #5).
//
// Run after `npm run build`:  node test/operational-e2e.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "e2e-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// POST an operator decision to the sidecar's /operator — the exact call plugin_api forwards.
// `secret` is the DEDICATED operator secret (SEC-1), not the WS/MCP adoption nonce.
async function operator(port, secret, method, params) {
  const res = await fetch(`http://127.0.0.1:${port}/operator?nonce=${secret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const fake = await startHttpFakeServer();
const stateDir = mkdtempSync(join(tmpdir(), "bs-e2e-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);
const { proc, port, operatorSecret } = await spawnSidecar({ stateDir, nonce: NONCE });

// A WS board client — the operator's live view + the pending-action list.
const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("ws never opened")), 8000);
  ws.on("open", () => { clearTimeout(t); resolve(); });
  ws.on("error", reject);
});
const wsRequest = (id, method, params = {}) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${method} timeout`)), 5000);
    const onMsg = (data) => {
      const m = JSON.parse(data.toString());
      if (m.id === id) { clearTimeout(t); ws.off("message", onMsg); (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)); }
    };
    ws.on("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });

const mcpClient = () => new Client({ name: "e2e-agent", version: "1.0.0" }, { capabilities: {} });
const mcp = mcpClient();
await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));
const details = async (name, args) => JSON.parse((await mcp.callTool({ name, arguments: args })).content[0].text);

try {
  // ── 1. agent REQUEST a grant (search then request) ──
  const req = await details("boardstate_tool_search", { mode: "request", connector: "fake", tools: ["fake:echo", "fake:write_note"] });
  check("agent requested the tools (still ungranted)", (req.requested ?? []).includes("fake:write_note"));
  let granted = (await mcp.listTools()).tools.map((t) => t.name).filter((n) => n.startsWith("fake"));
  check("no granted external tools before approval", granted.length === 0);

  // ── 2. operator APPROVES a partial subset (echo + write_note) through the gate ──
  const approved = await operator(port, operatorSecret, "dashboard.capability.approve", {
    name: "fake", decision: "granted", actor: "user", tools: ["fake:echo", "fake:write_note"],
  });
  check("operator approve → 200", approved.status === 200);
  // The agent invokes ONLY through the two GATED tools (anti-rug-pull): raw granted broker
  // tools are never surfaced, so a connector call can never skip gateCall's hash re-pend.
  const toolNames = (await mcp.listTools()).tools.map((t) => t.name);
  check("gated connector tools exposed after wiring", toolNames.includes("boardstate_connector_read") && toolNames.includes("boardstate_connector_invoke"));
  check("raw broker fast-path tools are NOT exposed", !toolNames.some((n) => n === "fake__echo" || n === "fake__write_note"));

  // ── 3. agent invokes a readOnly tool DIRECTLY (no park) via the gated read tool ──
  const echo = await details("boardstate_connector_read", { connector: "fake", tool: "echo", args: { text: "read the workbook summary" } });
  check("readOnly tool executes directly + reaches the agent", JSON.stringify(echo).includes("read the workbook summary"));
  check("external result is framed UNTRUSTED to the model", /UNTRUSTED/i.test(JSON.stringify(echo)));

  // ── 4. agent invokes a MUTATION → it PARKS; operator CONFIRMS → it executes ──
  const invokePromise = details("boardstate_connector_invoke", { connector: "fake", tool: "write_note", args: { text: "generate the quarterly report .docx" } });

  // Poll the pending-action list over the WS until the parked mutation shows up.
  let pendingId = null;
  for (let i = 0; i < 200 && !pendingId; i++) {
    const list = await wsRequest(`list-${i}`, "dashboard.action.list", {});
    const hit = (list?.pending ?? []).find((p) => p.tool === "write_note" && p.connector === "fake");
    if (hit) pendingId = hit.id;
    else await sleep(25);
  }
  check("the agent's mutation PARKED as a pending action", pendingId != null);

  // Let the adapter register its confirm waiter before we confirm (park→await race).
  await sleep(50);
  const confirmed = await operator(port, operatorSecret, "dashboard.action.confirm", { id: pendingId, actor: "user" });
  check("operator confirm → 200", confirmed.status === 200);

  const writeResult = await invokePromise;
  check("the confirmed mutation executed + the agent got the result", JSON.stringify(writeResult).includes("generate the quarterly report .docx"));

  const after = await wsRequest("list-final", "dashboard.action.list", {});
  check("no pending actions remain after confirm", (after?.pending ?? []).length === 0);

  // ── 5. the operator endpoint's own gate: non-operator verb + wrong nonce are refused ──
  const nonOp = await operator(port, operatorSecret, "dashboard.workspace.replace", { doc: {} });
  check("operator endpoint refuses a non-operator verb (400)", nonOp.status === 400);
  const badNonce = await operator(port, "wrong-nonce", "dashboard.capability.approve", { name: "fake" });
  check("operator endpoint rejects a wrong nonce (401)", badNonce.status === 401);

  await mcp.close().catch(() => {});
  ws.close();
} finally {
  stopSidecar(proc);
  await fake.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\noperational e2e: all checks passed — request → approve → invoke → park → confirm → result");

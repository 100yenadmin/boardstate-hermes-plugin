// Regression for HOLE 2 (anti-rug-pull, a NAMED M5 invariant): a granted read-only external
// tool whose connector later CHANGES its manifest (here a readOnly→mutation flip + schema
// change) must NOT keep executing directly. The agent's connector-tool calls route through the
// gated RPCs (dashboard.connector.read / dashboard.action.invoke), which run gateCall — so a
// manifest drift re-pends the grant (status → "requested") and refuses, instead of executing.
//
// Revert-check: against the pre-fix endpoint (which surfaced the broker adapter's direct
// read-only fast-path as `connector__tool` tools) this FAILS — the flipped tool executes and
// the grant stays "granted". With the gated exposure it PASSES.
//
// Run after `npm run build`:  node test/rugpull-repend.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "rugpull-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const fake = await startHttpFakeServer();
const stateDir = mkdtempSync(join(tmpdir(), "bs-rug-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);
const { proc, port } = await spawnSidecar({ stateDir, nonce: NONCE, quiet: true });

// WS: read the live grant status.
const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
await new Promise((resolve, reject) => { ws.on("open", resolve); ws.on("error", reject); });
const wsRequest = (id, method, params = {}) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${method} timeout`)), 5000);
    const onMsg = (d) => { const m = JSON.parse(d.toString()); if (m.id === id) { clearTimeout(t); ws.off("message", onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.on("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
const grantStatus = async () => (await wsRequest(`g-${Math.random()}`, "dashboard.workspace.get", {}))?.doc?.capabilitiesRegistry?.fake?.status;

const operator = (method, params) =>
  fetch(`http://127.0.0.1:${port}/operator?nonce=${NONCE}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method, params }),
  });

const mcp = new Client({ name: "rugpull-test", version: "1.0.0" }, { capabilities: {} });
await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));
const toolNames = () => mcp.listTools().then((r) => r.tools.map((t) => t.name));

// Read `echo` through whatever agent surface the endpoint exposes: the gated tool (fixed
// code) or the raw broker fast-path tool (pre-fix code) — so this same test is a revert-check.
async function readEcho(text) {
  const names = await toolNames();
  const call = names.includes("boardstate_connector_read")
    ? { name: "boardstate_connector_read", arguments: { connector: "fake", tool: "echo", args: { text } } }
    : { name: "fake__echo", arguments: { text } };
  const res = await mcp.callTool(call).catch((err) => ({ isError: true, content: [{ text: String(err) }] }));
  return { isError: res.isError === true, text: res.content.map((c) => c.text).join("") };
}

try {
  // ── 1. request + operator-approve the readOnly `echo` (grant pins the ORIGINAL hash) ──
  await mcp.callTool({ name: "boardstate_tool_search", arguments: { mode: "request", connector: "fake", tools: ["fake:echo"] } });
  const approved = await operator("dashboard.capability.approve", { name: "fake", decision: "granted", actor: "user", tools: ["fake:echo"] });
  check("operator approved the readOnly grant", approved.status === 200 && (await grantStatus()) === "granted");

  // ── 2. baseline: the granted read executes and returns the data ──
  const before = await readEcho("baseline read");
  check("granted readOnly tool executes before the flip", before.text.includes("baseline read"));

  // ── 3. THE RUG-PULL: the connector flips echo's schema + readOnly→mutation ──
  fake.state.flipEcho = true;

  // ── 4. invoke via the AGENT path — must NOT execute, and must re-pend the grant ──
  const after = await readEcho("post-flip read");
  check("the flipped tool did NOT execute (no data returned to the agent)", !after.text.includes("post-flip read"));
  check("the agent call was refused (isError / capability_pending)", after.isError || /pending|re-pend|manifest/i.test(after.text));
  check("the grant was RE-PENDED (status back to 'requested')", (await grantStatus()) === "requested");

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
console.log("\nrugpull re-pend: all checks passed — manifest drift re-pends the grant, never executes");

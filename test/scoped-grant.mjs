// Regression for CORRECT-2: an agent-SCOPED grant (`agents` on dashboard.capability.approve)
// must be usable by the MCP agent it names. The gated connector tools thread the MCP agent
// context `{ agentId }` into the host RPC, so `gateCall` resolves the acting agent
// (`agent:agent`) instead of seeing `undefined` and always refusing.
//
// Revert-check: against the pre-fix wrappers (which omitted the agent context) even a grant
// scoped to this agent returns capability_pending → the read never executes → RED. With the
// threaded context it executes → GREEN. (A grant scoped to a DIFFERENT agent stays refused —
// proving the scope actually gates, not merely always-allows.)
//
// Run after `npm run build`:  node test/scoped-grant.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "scoped-nonce";
// The MCP endpoint acts as agent id "agent" → boundAgentActor normalizes it to "agent:agent".
const THIS_AGENT = "agent:agent";
const OTHER_AGENT = "agent:someone-else";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const fake = await startHttpFakeServer();
const stateDir = mkdtempSync(join(tmpdir(), "bs-scoped-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);
const { proc, port, operatorSecret } = await spawnSidecar({ stateDir, nonce: NONCE, quiet: true });
const approve = (agents) =>
  fetch(`http://127.0.0.1:${port}/operator?nonce=${operatorSecret}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ method: "dashboard.capability.approve", params: { name: "fake", decision: "granted", actor: "user", tools: ["fake:echo"], agents } }),
  }).then((r) => r.status);

const mcp = new Client({ name: "scoped-test", version: "1.0.0" }, { capabilities: {} });
await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));
const readEcho = async (text) => {
  const res = await mcp
    .callTool({ name: "boardstate_connector_read", arguments: { connector: "fake", tool: "echo", args: { text } } })
    .catch((err) => ({ isError: true, content: [{ text: String(err) }] }));
  return { isError: res.isError === true, text: res.content.map((c) => c.text).join("") };
};

try {
  await mcp.callTool({ name: "boardstate_tool_search", arguments: { mode: "request", connector: "fake", tools: ["fake:echo"] } });

  // ── grant SCOPED to a DIFFERENT agent → this MCP agent must be refused ──
  check("approve scoped to another agent → 200", (await approve([OTHER_AGENT])) === 200);
  const otherScoped = await readEcho("should be refused");
  check("a grant scoped to ANOTHER agent is REFUSED for this agent", otherScoped.isError || !otherScoped.text.includes("should be refused"));

  // ── grant SCOPED to THIS agent → the read executes (CORRECT-2 fix) ──
  check("approve scoped to this agent → 200", (await approve([THIS_AGENT])) === 200);
  const mineScoped = await readEcho("scoped read works");
  check("a grant scoped to THIS agent EXECUTES (agent context threaded)", !mineScoped.isError && mineScoped.text.includes("scoped read works"));

  await mcp.close().catch(() => {});
} finally {
  stopSidecar(proc);
  await fake.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nscoped grant: all checks passed — agent-scoped grants resolve the MCP agent context");

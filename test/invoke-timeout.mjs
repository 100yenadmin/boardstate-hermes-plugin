// Regression for CORRECT-1 (P1, hang): the agent's boardstate_connector_invoke of a MUTATING
// tool must NEVER hang forever when the operator doesn't confirm. The bounded confirm-wait
// (mutationTimeoutMs, threaded into createMcpEndpoint) elapses and the tool SETTLES by returning
// the still-PARKED contract instead of blocking the MCP tools/call indefinitely.
//
// Revert-check: against the pre-fix endpoint (confirmAndExecute called with no timeoutMs) the
// invoke never resolves and the hang-detector wins → RED. With the bounded timeout it settles
// (parked) → GREEN.
//
// Run after `npm run build`:  node test/invoke-timeout.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "timeout-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const fake = await startHttpFakeServer();
const stateDir = mkdtempSync(join(tmpdir(), "bs-timeout-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);
// A SHORT confirm-wait so the test settles fast; production defaults to 5 minutes.
const { proc, port, operatorSecret } = await spawnSidecar({
  stateDir, nonce: NONCE, quiet: true, env: { BOARDSTATE_MUTATION_TIMEOUT_MS: "500" },
});
const operator = (method, params) =>
  fetch(`http://127.0.0.1:${port}/operator?nonce=${operatorSecret}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method, params }),
  });

const mcp = new Client({ name: "timeout-test", version: "1.0.0" }, { capabilities: {} });
await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));

try {
  // Grant the mutating write_note (operator approves; we will NOT confirm the invoke).
  await mcp.callTool({ name: "boardstate_tool_search", arguments: { mode: "request", connector: "fake", tools: ["fake:write_note"] } });
  const approved = await operator("dashboard.capability.approve", { name: "fake", decision: "granted", actor: "user", tools: ["fake:write_note"] });
  check("operator granted the mutating tool", approved.status === 200);

  // Invoke the mutation and NEVER confirm — race the call against a generous hang-detector.
  const start = Date.now();
  const invoke = mcp
    .callTool({ name: "boardstate_connector_invoke", arguments: { connector: "fake", tool: "write_note", args: { text: "no one will confirm this" } } })
    .then((res) => ({ settled: true, details: JSON.parse(res.content.map((c) => c.text).join("")) }));
  const hangGuard = new Promise((resolve) => setTimeout(() => resolve({ settled: false }), 8000));
  const outcome = await Promise.race([invoke, hangGuard]);

  check("the invoke SETTLED (did not hang) without an operator confirm", outcome.settled === true);
  check("it settled promptly (~the bounded timeout, well under the hang guard)", Date.now() - start < 6000);
  if (outcome.settled) {
    check("it returned the still-PARKED contract (not a fake success)", outcome.details?.parked === true && typeof outcome.details?.id === "string");
  }

  await mcp.close().catch(() => {});
} finally {
  stopSidecar(proc);
  await fake.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\ninvoke timeout: all checks passed — an unconfirmed mutation settles as parked, never hangs");

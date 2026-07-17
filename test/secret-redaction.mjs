// Regression for HOLE 1 (invariant #3): a connector config value (command/url/args) must
// NEVER surface in an agent-facing MCP response. A stdio connector whose `command` is a
// unique sentinel fails to spawn (ENOENT); the raw error echoes the literal command. The
// agent triggers it via `boardstate_tool_search` (discovery calls broker.listTools → spawn),
// and the MCP response must be REDACTED of the sentinel (full detail logged server-side only).
//
// Revert-check: against the pre-fix endpoint this FAILS (the raw "spawn <sentinel> ENOENT"
// message is returned verbatim); with the redaction choke-point it PASSES.
//
// Run after `npm run build`:  node test/secret-redaction.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "redaction-nonce";
const SENTINEL = "SENTINEL_LEAK_a1b2c3d4e5"; // the connector's literal command — must never leak
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const stateDir = mkdtempSync(join(tmpdir(), "bs-redact-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "office", transport: "stdio", command: SENTINEL, args: ["mcp"] }] }),
);
const { proc, port } = await spawnSidecar({ stateDir, nonce: NONCE, quiet: true });

try {
  const mcp = new Client({ name: "redaction-test", version: "1.0.0" }, { capabilities: {} });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));

  // Discovery calls broker.listTools() → the stdio connector fails to spawn the sentinel
  // command (ENOENT), echoing it in the raw error. The agent-facing response must be redacted.
  const res = await mcp.callTool({ name: "boardstate_tool_search", arguments: { mode: "search", connector: "office", query: "x" } });
  const text = res.content.map((c) => c.text).join("");

  check("tool_search surfaced an error (the spawn failed as designed)", res.isError === true || /error|redacted/i.test(text));
  check("the connector command sentinel is ABSENT from the MCP response", !text.includes(SENTINEL));
  check("the response is redacted (proves sanitization ran, not just an empty result)", text.includes("[redacted]"));

  await mcp.close().catch(() => {});
} finally {
  stopSidecar(proc);
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nsecret redaction: all checks passed — connector config never reaches the agent surface");

// Stage 1 proof: with an operator-authored `boardstate.connectors.json` in the state dir,
// the sidecar wires the M5 broker onto its single host, so the agent (over the sidecar's
// MCP endpoint) can CONNECT → DISCOVER → REQUEST a grant, and a readOnly `source:"mcp"`
// binding renders external data over the WS — all headless, against the in-repo fake-MCP
// fixture. Also asserts the config-authorship invariant surface (a connector exists only
// because the config named it) and that operator approve tools never leak onto MCP.
//
// Run after `npm run build`:  node test/broker-fixture.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "broker-fixture-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// A fake MCP server + a state dir whose config names it (the AUTHORSHIP boundary).
const fake = await startHttpFakeServer();
const stateDir = mkdtempSync(join(tmpdir(), "bs-broker-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);

const { proc, port, operatorSecret } = await spawnSidecar({ stateDir, nonce: NONCE });

try {
  // The agent's view: an MCP client over the sidecar's nonce-gated endpoint.
  const mcp = new Client({ name: "broker-fixture", version: "1.0.0" }, { capabilities: {} });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));
  const { tools } = await mcp.listTools();
  const names = tools.map((t) => t.name);

  // The connector wiring surfaced `boardstate_tool_search` to the agent…
  check("MCP exposes boardstate_tool_search (connectors wired)", names.includes("boardstate_tool_search"));
  // …and NEVER the operator approve verbs (those are the operator gate's alone).
  check("MCP does NOT expose an operator approve tool", !names.some((n) => /approve|capability/.test(n)));

  const callDetails = async (args) => {
    const res = await mcp.callTool({ name: "boardstate_tool_search", arguments: args });
    return JSON.parse(res.content[0].text);
  };

  // DISCOVER: search the connected connector's live catalog (broker connected + listed).
  const search = await callDetails({ mode: "search", connector: "fake", query: "echo" });
  check("tool_search SEARCH discovers the connector's catalog", search.mode === "search");
  check("tool_search SEARCH finds fake:echo (discovery over the broker)", (search.results ?? []).some((r) => r.id === "fake:echo"));

  // REQUEST: append ids to the grant's `requested` set — can NEVER grant (invariant #2).
  const request = await callDetails({ mode: "request", connector: "fake", tools: ["fake:echo", "fake:write_note"] });
  check("tool_search REQUEST returns mode=request", request.mode === "request");
  check("tool_search REQUEST records the requested ids", (request.requested ?? []).includes("fake:echo") && (request.requested ?? []).includes("fake:write_note"));

  // A connector the config did NOT name is inert (config-authorship, invariant #8).
  const bogus = await callDetails({ mode: "search", connector: "ghost", query: "x" }).catch((e) => ({ error: String(e) }));
  check("an unnamed connector is inert (config-authored only)", !!bogus.error || (bogus.results ?? []).length === 0);

  await mcp.close().catch(() => {});

  // A readOnly `source:"mcp"` binding renders external data over the WS (the browser host's
  // verb: dashboard.connector.read — readOnly-only, never parks). Needs the grant granted;
  // approve it in-process via the operator endpoint first (the operator seam, tested fully
  // in the e2e — here just enough to prove the read path is wired).
  const approve = await fetch(`http://127.0.0.1:${port}/operator?nonce=${operatorSecret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "dashboard.capability.approve",
      params: { name: "fake", decision: "granted", actor: "user", tools: ["fake:echo", "fake:write_note"] },
    }),
  });
  check("operator endpoint approves the grant (200)", approve.status === 200);

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ws never opened")), 8000);
    ws.on("open", () => { clearTimeout(t); resolve(); });
    ws.on("error", reject);
  });
  const readResult = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("connector.read timeout")), 5000);
    const onMsg = (data) => {
      const m = JSON.parse(data.toString());
      if (m.id === "read") { clearTimeout(t); ws.off("message", onMsg); (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)); }
    };
    ws.on("message", onMsg);
    ws.send(JSON.stringify({ id: "read", method: "dashboard.connector.read", params: { connector: "fake", tool: "echo", args: { text: "Q3 revenue = $4.2M" } } }));
  });
  check("readOnly connector.read renders external data over the WS", JSON.stringify(readResult).includes("Q3 revenue = $4.2M"));
  ws.close();
} finally {
  stopSidecar(proc);
  await fake.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nbroker fixture: all checks passed — connect → discover → request → read, headless");

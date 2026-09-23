// A SIGTERM used for dashboard replacement must drain an accepted native invocation
// before the sidecar exits. Otherwise the caller can lose the result of a persisted action.

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "drain-nonce";
const fake = await startHttpFakeServer();
fake.state.echoDelayMs = 1500;
const stateDir = mkdtempSync(join(tmpdir(), "bs-drain-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);
const sidecar = await spawnSidecar({
  stateDir,
  nonce: NONCE,
  quiet: true,
  env: { BOARDSTATE_SPAWNED_BY: "agent" },
});
const client = new Client({ name: "drain-test", version: "1.0.0" }, { capabilities: {} });
await client.connect(
  new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${sidecar.port}/mcp?nonce=${NONCE}`)),
);
const operator = (method, params) =>
  fetch(`http://127.0.0.1:${sidecar.port}/operator?nonce=${sidecar.operatorSecret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params }),
  });

let failure;
try {
  await client.callTool({
    name: "boardstate_tool_search",
    arguments: { mode: "request", connector: "fake", tools: ["fake:echo"] },
  });
  const approved = await operator("dashboard.capability.approve", {
    name: "fake",
    decision: "granted",
    actor: "user",
    tools: ["fake:echo"],
  });
  if (approved.status !== 200) throw new Error(`approval failed: ${approved.status}`);

  const inFlight = fetch(`http://127.0.0.1:${sidecar.port}/tools/invoke?nonce=${NONCE}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "boardstate_connector_read",
      args: { connector: "fake", tool: "echo", args: { text: "drained" } },
    }),
  }).then((response) => response.json());
  await new Promise((resolve) => setTimeout(resolve, 150));
  sidecar.proc.kill("SIGTERM");
  const result = await inFlight;
  if (!JSON.stringify(result).includes("drained")) {
    throw new Error(`in-flight result was lost: ${JSON.stringify(result)}`);
  }
  await new Promise((resolve, reject) => {
    if (sidecar.proc.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(() => reject(new Error("sidecar did not exit after draining")), 5000);
    sidecar.proc.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
} catch (error) {
  failure = error;
} finally {
  await client.close().catch(() => {});
  stopSidecar(sidecar.proc);
  await fake.close();
}

if (failure) throw failure;
console.log("sidecar drain: accepted native invocation completed before SIGTERM exit");

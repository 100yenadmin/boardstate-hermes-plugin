// An aborted native invocation must release the active-invocation counter so an
// authenticated shutdown exits through cleanup instead of waiting for the 30 s fail-safe.

import http from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "abort-shutdown-nonce";
const fake = await startHttpFakeServer();
fake.state.echoDelayMs = 10_000;
const stateDir = mkdtempSync(join(tmpdir(), "bs-abort-shutdown-"));
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
const client = new Client(
  { name: "abort-shutdown-test", version: "1.0.0" },
  { capabilities: {} },
);
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${sidecar.port}/mcp?nonce=${NONCE}`),
  ),
);

let failure;
try {
  await client.callTool({
    name: "boardstate_tool_search",
    arguments: { mode: "request", connector: "fake", tools: ["fake:echo"] },
  });
  const approval = await fetch(
    `http://127.0.0.1:${sidecar.port}/operator?nonce=${sidecar.operatorSecret}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        method: "dashboard.capability.approve",
        params: {
          name: "fake",
          decision: "granted",
          actor: "user",
          tools: ["fake:echo"],
        },
      }),
    },
  );
  if (approval.status !== 200) throw new Error(`approval failed: ${approval.status}`);

  const body = JSON.stringify({
    name: "boardstate_connector_read",
    args: { connector: "fake", tool: "echo", args: { text: "aborted" } },
  });
  const aborted = new Promise((resolve, reject) => {
    const request = http.request({
      hostname: "127.0.0.1",
      port: sidecar.port,
      path: `/tools/invoke?nonce=${NONCE}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      },
    });
    request.on("error", (error) => {
      if (error.code === "ECONNRESET") resolve();
      else reject(error);
    });
    request.end(body);
    setTimeout(() => {
      request.destroy();
      resolve();
    }, 250);
  });
  await aborted;

  const started = Date.now();
  const shutdown = await fetch(
    `http://127.0.0.1:${sidecar.port}/internal/shutdown?nonce=${NONCE}`,
    { method: "POST" },
  );
  if (shutdown.status !== 202) throw new Error(`shutdown returned ${shutdown.status}`);
  await new Promise((resolve, reject) => {
    if (sidecar.proc.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(
      () => reject(new Error("sidecar waited for the 30 s fail-safe after client abort")),
      5_000,
    );
    sidecar.proc.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  if (Date.now() - started >= 5_000) {
    throw new Error("sidecar did not exit promptly through exitAfterCleanup");
  }
} catch (error) {
  failure = error;
} finally {
  await client.close().catch(() => {});
  stopSidecar(sidecar.proc);
  await fake.close();
}

if (failure) throw failure;
console.log("sidecar abort shutdown: aborted invocation released before authenticated shutdown");

// A SIGTERM used for dashboard replacement must drain every accepted request that can run a
// connector call or an operator decision — native /tools/invoke, /mcp tool calls, /rpc and
// /operator — before the sidecar exits. Otherwise the caller can lose the result of a persisted
// action (#20: counting only /tools/invoke let /mcp, /rpc and /operator work be cut off).

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
fake.state.writeDelayMs = 1500;

const post = (port, path, secret, body) =>
  fetch(`http://127.0.0.1:${port}${path}?nonce=${secret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((response) => response.json());

// Each case gets a fresh sidecar (the SIGTERM ends it): grant the fake tools, start one
// in-flight request, SIGTERM 150 ms later, and require its result plus a clean exit.
async function drains(label, start) {
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
  try {
    await client.callTool({
      name: "boardstate_tool_search",
      arguments: { mode: "request", connector: "fake", tools: ["fake:echo", "fake:write_note"] },
    });
    const approved = await post(sidecar.port, "/operator", sidecar.operatorSecret, {
      method: "dashboard.capability.approve",
      params: { name: "fake", decision: "granted", actor: "user", tools: ["fake:echo", "fake:write_note"] },
    });
    if (approved.error) throw new Error(`approval failed: ${approved.error}`);

    const { inFlight, expect } = await start({ port: sidecar.port, secret: sidecar.operatorSecret, client });
    await new Promise((resolve) => setTimeout(resolve, 150));
    sidecar.proc.kill("SIGTERM");
    const result = await inFlight.catch((error) => ({ lost: String(error) }));
    if (!JSON.stringify(result).includes(expect)) {
      throw new Error(`${label}: in-flight result was lost: ${JSON.stringify(result)}`);
    }
    await new Promise((resolve, reject) => {
      if (sidecar.proc.exitCode !== null) {
        resolve();
        return;
      }
      const timer = setTimeout(() => reject(new Error(`${label}: sidecar did not exit after draining`)), 5000);
      sidecar.proc.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
    console.log(`ok   ${label} drained before SIGTERM exit`);
  } finally {
    await client.close().catch(() => {});
    stopSidecar(sidecar.proc);
  }
}

const echoArgs = (text) => ({ connector: "fake", tool: "echo", args: { text } });
let failure;
try {
  await drains("native /tools/invoke", async ({ port }) => ({
    expect: "drained-native",
    inFlight: post(port, "/tools/invoke", NONCE, {
      name: "boardstate_connector_read",
      args: echoArgs("drained-native"),
    }),
  }));
  await drains("/mcp tool call", async ({ client }) => ({
    expect: "drained-mcp",
    inFlight: client.callTool({ name: "boardstate_connector_read", arguments: echoArgs("drained-mcp") }),
  }));
  await drains("/rpc connector invoke", async ({ port }) => ({
    expect: "drained-rpc",
    inFlight: post(port, "/rpc", NONCE, { method: "dashboard.action.invoke", params: echoArgs("drained-rpc") }),
  }));
  await drains("/operator confirm", async ({ port, secret }) => {
    const parked = await post(port, "/rpc", NONCE, {
      method: "dashboard.action.invoke",
      params: { connector: "fake", tool: "write_note", args: { text: "drained-operator" } },
    });
    if (parked.result?.pending !== true) throw new Error(`write_note did not park: ${JSON.stringify(parked)}`);
    return {
      expect: "drained-operator",
      inFlight: post(port, "/operator", secret, {
        method: "dashboard.action.confirm",
        params: { id: parked.result.id, actor: "user" },
      }),
    };
  });
} catch (error) {
  failure = error;
} finally {
  await fake.close();
}

if (failure) throw failure;
console.log("sidecar drain: accepted invocations, MCP calls, RPCs and operator confirms complete before SIGTERM exit");

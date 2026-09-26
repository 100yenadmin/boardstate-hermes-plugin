// An agent-owned sidecar has no operator plane, so nothing can confirm a connector mutation.
// Before #20 it refused EVERY native boardstate_connector_invoke with a 409, readOnly tools
// included. Now the call runs when the upstream gate (the same gateCall behind
// dashboard.connector.read) classifies the tool readOnly; a mutation keeps the 409 and is never
// parked or executed, and a tool the gate cannot classify (unknown, ungranted) is refused.
//
// Run after `npm run build`:  node test/agent-connector-invoke.mjs

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startHttpFakeServer } from "./fixtures/fake-mcp.mjs";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "agent-invoke-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const fake = await startHttpFakeServer();
const stateDir = mkdtempSync(join(tmpdir(), "bs-agent-invoke-"));
writeFileSync(
  join(stateDir, "boardstate.connectors.json"),
  JSON.stringify({ connectors: [{ name: "fake", transport: "http", url: fake.url }] }),
);
// The grant is set up through the fixture's operator secret, as a dashboard session would
// have done earlier; the sidecar under test is agent-owned.
const sidecar = await spawnSidecar({
  stateDir,
  nonce: NONCE,
  quiet: true,
  env: { BOARDSTATE_SPAWNED_BY: "agent" },
});
const post = async (path, secret, body) => {
  const response = await fetch(`http://127.0.0.1:${sidecar.port}${path}?nonce=${secret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
};
const invoke = (connector, tool, args = {}) =>
  post("/tools/invoke", NONCE, { name: "boardstate_connector_invoke", args: { connector, tool, args } });

try {
  await post("/tools/invoke", NONCE, {
    name: "boardstate_tool_search",
    args: { mode: "request", connector: "fake", tools: ["fake:echo", "fake:write_note"] },
  });
  const approved = await post("/operator", sidecar.operatorSecret, {
    method: "dashboard.capability.approve",
    params: { name: "fake", decision: "granted", actor: "user", tools: ["fake:echo", "fake:write_note"] },
  });
  check("operator granted echo (readOnly) and write_note (mutating)", approved.status === 200);

  const readOnly = await invoke("fake", "echo", { text: "agent-owned read" });
  check("a readOnly tool runs on an agent-owned sidecar (200)", readOnly.status === 200);
  check("its result reaches the agent", JSON.stringify(readOnly.body.result).includes("agent-owned read"));
  check("its result is framed UNTRUSTED", /UNTRUSTED/.test(JSON.stringify(readOnly.body.result)));

  const mutating = await invoke("fake", "write_note", { text: "must not run" });
  check("a mutating tool keeps the 409", mutating.status === 409);
  check(
    "the 409 asks for the dashboard",
    String(mutating.body.error).includes("needs the dashboard to confirm") && !("result" in mutating.body),
  );
  check("the mutation never executed", (fake.state.writeCalls ?? 0) === 0);
  const actions = await post("/rpc", NONCE, { method: "dashboard.action.list", params: {} });
  check("the mutation was never parked", (actions.body.result?.pending ?? []).length === 0);

  for (const [label, connector, tool] of [
    ["a tool missing from the manifest", "fake", "nope"],
    ["a readOnly tool that is not granted", "fake", "add"],
    ["an unconfigured connector", "ghost", "echo"],
  ]) {
    const refused = await invoke(connector, tool, { a: 1, b: 2 });
    check(
      `${label} is refused (got ${refused.status})`,
      refused.status === 400 && !("result" in refused.body) && typeof refused.body.error === "string",
    );
  }

  // Anti-rug-pull still applies: a readOnly tool whose manifest flips to a mutation re-pends.
  fake.state.flipEcho = true;
  const flipped = await invoke("fake", "echo", { text: "flipped", danger: "x" });
  check(
    `a readOnly tool that flipped to a mutation is refused (got ${flipped.status})`,
    flipped.status >= 400 && !("result" in flipped.body),
  );
} finally {
  stopSidecar(sidecar.proc);
  await fake.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nagent connector invoke: readOnly runs, mutations keep the 409, unknown calls are refused");

// Wire-contract test for HermesRpcDeps: a `source:"rpc"` data binding resolves through
// the sidecar against a FAKE Hermes REST server and is shaped to what the builtins
// expect. Also proves the session token is sent, and that an unmapped binding delegates
// to the node fallback. No live Hermes needed.
//
// Run after `npm run build`:  node test/hermes-data.mjs

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIDECAR = join(repo, "dashboard/sidecar/server.js");
const TOKEN = "good-session-token";
const NONCE = "data-nonce";

// --- Fake Hermes REST: representative payloads; 401 unless the session token matches. ---
const seenAuth = [];
const fake = createServer((req, res) => {
  seenAuth.push(req.headers["x-hermes-session-token"]);
  if (req.headers["x-hermes-session-token"] !== TOKEN) {
    res.statusCode = 401;
    res.end("unauthorized");
    return;
  }
  const path = (req.url ?? "/").split("?")[0];
  const body = {
    "/api/analytics/usage": {
      totals: { total_estimated_cost: 12.5, total_input: 1000, total_output: 500 },
      days: 30,
    },
    "/api/sessions": [
      { id: "s1", title: "Session One", status: "done", has_active_run: false, updated_at: "2026-07-17T00:00:00Z" },
      { id: "s2", title: "Session Two", status: "running", has_active_run: true, updated_at: "2026-07-17T01:00:00Z" },
    ],
    "/api/status": {
      active_agents: [{ instance_id: "gw-1", platform: "macos", version: "1.0", last_input_seconds: 8 }],
    },
    "/api/cron": [{ id: "nightly", name: "Nightly", enabled: true, next_run_at_ms: 1_800_000_000_000, last_run_status: "ok" }],
  }[path];
  if (body === undefined) {
    res.statusCode = 404;
    res.end("not found");
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
});
await new Promise((r) => fake.listen(0, "127.0.0.1", r));
const fakePort = fake.address().port;

// --- Spawn the sidecar pointed at the fake Hermes. ---
const stateDir = mkdtempSync(join(tmpdir(), "bs-data-"));
const proc = spawn(process.execPath, [SIDECAR], {
  env: {
    ...process.env,
    BOARDSTATE_STATE_DIR: stateDir,
    PORT: "0",
    BOARDSTATE_SIDECAR_NONCE: NONCE,
    HERMES_DASHBOARD_URL: `http://127.0.0.1:${fakePort}`,
    HERMES_SESSION_TOKEN: TOKEN,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let buf = "";
const port = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("no handshake")), 15000);
  proc.stdout.on("data", (d) => {
    buf += d.toString();
    for (const line of buf.split("\n")) {
      try {
        const j = JSON.parse(line);
        if (j.boardstateSidecar?.port) {
          clearTimeout(t);
          resolve(j.boardstateSidecar.port);
        }
      } catch {
        /* noise */
      }
    }
  });
  proc.stderr.on("data", (d) => process.stderr.write("[sidecar-err] " + d));
  proc.on("exit", (c) => reject(new Error("sidecar exited " + c)));
});

const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
await new Promise((r, j) => {
  ws.on("open", r);
  ws.on("error", j);
});
let seq = 0;
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = `r${seq++}`;
    const t = setTimeout(() => reject(new Error(`${method} timeout`)), 8000);
    const onMsg = (data) => {
      const m = JSON.parse(data.toString());
      if (m.id === id) {
        clearTimeout(t);
        ws.off("message", onMsg);
        resolve(m);
      }
    };
    ws.on("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const readBinding = (binding) => rpc("dashboard.data.read", { binding });

const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// ── The REAL render path: `<boardstate-view>` resolves a `source:"rpc"` binding by
// calling the binding's METHOD directly as a networked RPC (@boardstate/host
// resolveBinding → transport.request(method, params)), NOT via dashboard.data.read.
// These direct-method checks are the wire contract the browser actually exercises —
// without the registered handlers each would be an "unknown method" and every
// data-bound widget would render an error cell.
const usage = (await rpc("usage.status", {})).result;
check("usage.status (direct) → totals shape", usage?.totals?.totalCost === 12.5 && usage?.totals?.totalTokens === 1500);

const cost = (await rpc("usage.cost", {})).result;
check("usage.cost (direct) → single number", cost === 12.5);

const sessions = (await rpc("sessions.list", {})).result;
check("sessions.list (direct) → rows shape", Array.isArray(sessions) && sessions[0]?.key === "s1" && sessions[1]?.hasActiveRun === true);

const presence = (await rpc("system-presence", {})).result;
check("system-presence (direct) → presence shape", presence?.presence?.[0]?.instanceId === "gw-1");

const nodes = (await rpc("node.list", {})).result;
check("node.list (direct) → aliases presence", nodes?.presence?.[0]?.instanceId === "gw-1");

const cron = (await rpc("cron.list", {})).result;
check("cron.list (direct) → jobs shape", cron?.jobs?.[0]?.enabled === true && cron?.jobs?.[0]?.state?.lastRunStatus === "ok");

// The data.read WS RPC still resolves rpc bindings server-side (file/static path uses
// the same resolver); kept as a regression guard on the injected resolveBinding.
const usageViaRead = (await readBinding({ source: "rpc", method: "usage.status" })).result?.data;
check("usage.status via data.read → totals shape", usageViaRead?.totals?.totalCost === 12.5);

// Unmapped binding delegates to the node fallback (a static binding resolves to itself).
const stat = (await readBinding({ source: "static", value: { hello: "world" } })).result?.data;
check("unmapped binding delegates to node fallback", stat?.hello === "world");

check("session token was sent to Hermes", seenAuth.every((a) => a === TOKEN) && seenAuth.length > 0);

ws.close();
proc.kill("SIGTERM");
fake.close();

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nhermes-data: all checks passed — live rpc bindings shaped from Hermes REST");

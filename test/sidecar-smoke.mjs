// Sidecar smoke test — spawns the built sidecar and asserts the control plane works
// end to end over the networked WS transport, plus the per-spawn nonce gate.
//
// Run after `npm run build`:  node test/sidecar-smoke.mjs
// Exits non-zero on any failure (CI gate).

import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// `ws` (not the global) so the test runs on Node 20 — the plugin's runtime floor —
// where `WebSocket` isn't yet a global. The sidecar runtime needs no client global.
import { WebSocket } from "ws";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIDECAR = join(repo, "dashboard/sidecar/server.js");

async function spawnSidecar(extraEnv = {}) {
  const stateDir = mkdtempSync(join(tmpdir(), "bs-smoke-"));
  const proc = spawn(process.execPath, [SIDECAR], {
    env: { ...process.env, BOARDSTATE_STATE_DIR: stateDir, PORT: "0", ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buf = "";
  const port = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("sidecar: no handshake in 15s")), 15000);
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
          /* pre-handshake log noise */
        }
      }
    });
    proc.stderr.on("data", (d) => process.stderr.write("[sidecar-err] " + d));
    proc.on("exit", (c) => reject(new Error("sidecar exited " + c)));
  });
  return { proc, port, stateDir };
}

/** Open a WS, send workspace.get; resolve "ok" | "err" | "rejected" | "timeout". */
function probe(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const t = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
      resolve("timeout");
    }, timeoutMs);
    ws.onopen = () =>
      ws.send(JSON.stringify({ id: "1", method: "dashboard.workspace.get", params: {} }));
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data.toString());
      if (m.id === "1") {
        clearTimeout(t);
        ws.close();
        resolve(m.result?.doc ? "ok" : "err");
      }
    };
    ws.onerror = () => {
      clearTimeout(t);
      resolve("rejected");
    };
    ws.onclose = (e) => {
      clearTimeout(t);
      if (e.code === 1006 || e.code === 1008) resolve("rejected");
    };
  });
}

const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// 1) Control plane + health, no nonce (CLI-style spawn → open).
{
  const s = await spawnSidecar();
  const health = await fetch(`http://127.0.0.1:${s.port}/healthz`).then((r) => r.json());
  check("healthz ok", health.ok === true);
  check("workspace.get round-trip (no nonce → open)", (await probe(`ws://127.0.0.1:${s.port}/ws`)) === "ok");
  s.proc.kill("SIGTERM");
}

// 2) Per-spawn nonce gate.
{
  const nonce = "smoke-nonce-value";
  const s = await spawnSidecar({ BOARDSTATE_SIDECAR_NONCE: nonce });
  check("nonce gate rejects missing nonce", (await probe(`ws://127.0.0.1:${s.port}/ws`)) === "rejected");
  check("nonce gate rejects wrong nonce", (await probe(`ws://127.0.0.1:${s.port}/ws?nonce=wrong`)) === "rejected");
  check("nonce gate accepts correct nonce", (await probe(`ws://127.0.0.1:${s.port}/ws?nonce=${nonce}`)) === "ok");
  s.proc.kill("SIGTERM");
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nsidecar smoke: all checks passed");

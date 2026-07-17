// Spawn the real built sidecar (dashboard/sidecar/server.js) for a test, bound to a given
// state dir + nonce, and resolve once it announces its port. Shared by the broker-wiring
// and operational-e2e fixture tests so they drive the SAME control plane the plugin ships.

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SIDECAR = join(REPO, "dashboard", "sidecar", "server.js");

/** Spawn the sidecar; resolves `{ proc, port }`. Extra env (e.g. connectors) merges in. */
export async function spawnSidecar({ stateDir, nonce, env = {}, quiet = false }) {
  const proc = spawn(process.execPath, [SIDECAR], {
    env: { ...process.env, BOARDSTATE_STATE_DIR: stateDir, PORT: "0", BOARDSTATE_SIDECAR_NONCE: nonce, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buf = "";
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("sidecar: no handshake in 15s")), 15000);
    proc.stdout.on("data", (d) => {
      buf += d.toString();
      for (const line of buf.split("\n")) {
        try {
          const j = JSON.parse(line);
          if (j.boardstateSidecar?.port) {
            clearTimeout(timer);
            resolve(j.boardstateSidecar.port);
          }
        } catch {
          /* non-JSON log noise before the handshake */
        }
      }
    });
    proc.stderr.on("data", (d) => {
      if (!quiet) process.stderr.write("[sidecar-err] " + d);
    });
    proc.on("exit", (c) => reject(new Error("sidecar exited " + c)));
  });
  return { proc, port };
}

export function stopSidecar(proc) {
  try {
    proc.kill("SIGTERM");
  } catch {
    /* already gone */
  }
}

// Regression for SEC-1 (privilege escalation): the sidecar's /operator endpoint must be gated
// by a DEDICATED operator secret that is NEVER written to the adoptable port file — so a
// same-user process that reads `.boardstate-sidecar.json` (the WS/MCP adoption nonce) can NOT
// approve/confirm/deny. Knowing the port-file contents must not be sufficient to drive the
// operator plane.
//
// Revert-check: against the pre-fix endpoint (which gated /operator on the port-file nonce) the
// "adoption nonce is REFUSED" check FAILS (the nonce drives operator actions). With the dedicated
// operator secret it PASSES.
//
// Run after `npm run build`:  node test/operator-secret.mjs

// (The port-file split — adoption nonce written, operator secret withheld — is a plugin_api
// concern and is asserted structurally in test/plugin_api_check.py; here we prove the sidecar
// ENDPOINT gates on the dedicated secret, not the adoption nonce.)
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "adoption-nonce-in-portfile";
const OPERATOR_SECRET = "dedicated-operator-secret-not-on-disk";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const post = (port, secret, method = "dashboard.capability.approve", params = { name: "ghost" }) =>
  fetch(`http://127.0.0.1:${port}/operator?nonce=${secret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params }),
  }).then((r) => r.status);

// ── A: a sidecar WITH a distinct operator secret ──
const stateDir = mkdtempSync(join(tmpdir(), "bs-opsec-"));
const { proc, port } = await spawnSidecar({ stateDir, nonce: NONCE, operatorSecret: OPERATOR_SECRET, quiet: true });

try {
  // The core guarantee is at the endpoint: the adoption nonce (what a port-file reader has)
  // cannot drive /operator — only the dedicated operator secret can.
  const adoptionRejected = await post(port, NONCE);
  check("the port-file ADOPTION NONCE is REFUSED by /operator (401)", adoptionRejected === 401);

  const noCred = await post(port, "");
  check("a missing credential is refused (401)", noCred === 401);

  // The dedicated operator secret PASSES the gate (400 = gate passed, host rejects the bogus
  // connector — a 401 would mean the gate rejected the credential).
  const secretAccepted = await post(port, OPERATOR_SECRET);
  check("the dedicated operator secret PASSES the gate (not 401)", secretAccepted !== 401 && secretAccepted !== 403);
} finally {
  stopSidecar(proc);
}

// ── B: a sidecar with NO operator secret ⇒ the operator plane is DISABLED (fail closed) ──
const stateDir2 = mkdtempSync(join(tmpdir(), "bs-opsec2-"));
const s2 = await spawnSidecar({ stateDir: stateDir2, nonce: "n2", operatorSecret: null, quiet: true });
try {
  const disabled = await post(s2.port, "n2"); // even the WS nonce can't drive it
  check("no operator secret ⇒ /operator is DISABLED (403)", disabled === 403);
} finally {
  stopSidecar(s2.proc);
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\noperator secret: all checks passed — port-file knowledge cannot drive the operator plane");

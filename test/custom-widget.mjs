// Custom-widget serving through the sidecar: a PENDING widget's assets do not exist
// (uniform 404 — the approval gate is real), an APPROVED widget serves with the
// no-network sandbox CSP stamped, and the registry flip happens only via the operator
// plane. This is the seam the plugin_api `/widgets` proxy passes through verbatim.
//
// Run after `npm run build`:  node test/custom-widget.mjs

import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "custom-widget-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const stateDir = mkdtempSync(join(tmpdir(), "bs-cw-"));
// Operator-installed widget bundle files (the gallery/manual-install shape).
const wdir = join(stateDir, "dashboard", "widgets", "mini");
mkdirSync(wdir, { recursive: true });
writeFileSync(join(wdir, "widget.json"), JSON.stringify({
  schemaVersion: 1, name: "mini", title: "Mini", entrypoint: "index.html", bindings: [], capabilities: [],
}));
writeFileSync(join(wdir, "index.html"), "<!doctype html><body>mini widget</body>");

const { proc, port, operatorSecret } = await spawnSidecar({ stateDir, nonce: NONCE });
try {
  // Register the widget as PENDING via the control plane (the scaffold/install path's effect).
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
  await new Promise((res, rej) => { ws.on("open", res); ws.on("error", rej); });
  const rpc = (id, method, params) => new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${method} timeout`)), 6000);
    const onMsg = (d) => { const m = JSON.parse(d.toString()); if (m.id === id) { clearTimeout(t); ws.off("message", onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.on("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
  // widgetsRegistry entry lands pending via a workspace mutation (scaffold does the same).
  const doc = (await rpc("g", "dashboard.workspace.get", {})).doc;
  doc.widgetsRegistry = { ...(doc.widgetsRegistry || {}), mini: { status: "pending", createdBy: "user" } };
  await rpc("r", "dashboard.workspace.replace", { doc, actor: "user" });

  // PENDING ⇒ assets do not exist (uniform 404).
  const pending = await fetch(`http://127.0.0.1:${port}/widgets/mini/widget.json`);
  check("pending widget assets 404 (approval gate is real)", pending.status === 404);

  // Approve via the OPERATOR plane (the only transition).
  const approve = await fetch(`http://127.0.0.1:${port}/operator?nonce=${operatorSecret}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method: "dashboard.widget.approve", params: { name: "mini", decision: "approved", actor: "user" } }),
  });
  if (approve.status !== 200) console.log("approve error:", approve.status, await approve.text());
  check("operator approve → 200", approve.status === 200);

  const ok = await fetch(`http://127.0.0.1:${port}/widgets/mini/widget.json`);
  check("approved widget manifest serves (200)", ok.status === 200);
  check("sandbox CSP is stamped on the asset", (ok.headers.get("content-security-policy") || "").includes("connect-src"));
  check("nosniff stamped", ok.headers.get("x-content-type-options") === "nosniff");
  const html = await fetch(`http://127.0.0.1:${port}/widgets/mini/index.html`);
  check("approved widget entrypoint serves", html.status === 200 && (await html.text()).includes("mini widget"));
  ws.close();
} finally {
  stopSidecar(proc);
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\ncustom-widget: all checks passed — pending 404s; approved serves with the CSP jail");

// Stage 3 gate: the approvals/action UX routes operator verbs through the plugin_api
// operator endpoint in BOTH shipped entries — the web tab bundle (dashboard/dist/index.js)
// and the desktop plugin bundle (dashboard/desktop/plugin.js). A regression that dropped the
// operator transport wrapper (or reverted `operator: true`) would silently send approve/confirm
// down the WS, where the sidecar blocks them — a dead approve button with no CI signal.
//
// Run after `npm run build`:  node test/operator-ux.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const web = readFileSync(join(here, "..", "dashboard", "dist", "index.js"), "utf8");
const desktop = readFileSync(join(here, "..", "dashboard", "desktop", "plugin.js"), "utf8");

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// The four operator verbs the wrapper diverts — present in both bundles (inlined transport).
const VERBS = [
  "dashboard.widget.approve",
  "dashboard.capability.approve",
  "dashboard.action.confirm",
  "dashboard.action.deny",
];

for (const [label, bundle] of [["web", web], ["desktop", desktop]]) {
  check(`${label}: diverts all four operator verbs`, VERBS.every((v) => bundle.includes(v)));
  // `view.operator = true` survives minification as `.operator=!0` (or similar truthy form).
  check(`${label}: enables operator affordances`, /\.operator\s*=\s*(!0|true)/.test(bundle));
}

// Web: the operator send posts to the authed same-origin plugin_api endpoint via the SDK.
check("web: posts to the plugin_api operator endpoint", web.includes("/api/plugins/boardstate/operator"));
check("web: uses the authed SDK fetch (fetchJSON)", web.includes("fetchJSON"));

// Desktop: the operator send goes through the plugin's own namespaced REST door (ctx.rest →
// /api/plugins/boardstate/operator), never a hand-assembled URL.
check("desktop: routes operator through the plugin REST door (/operator)", desktop.includes("/operator"));

console.log(`\noperator-ux: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

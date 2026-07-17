// Validate every board template against the real Boardstate schema, so a template can
// never apply into an error. Transpiles dashboard/src/templates.ts (pure data) with
// esbuild and runs each doc through @boardstate/schema's validateWorkspaceDoc — the
// same gate the sidecar seed uses. Also asserts the manually-bound stat-cards only
// reference allowlisted rpc methods (an un-allowlisted method → client error cell).
//
// Run after `npm ci`:  node test/templates.mjs

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateWorkspaceDoc, DATA_READ_RPC_ALLOWLIST } from "@boardstate/schema";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "dashboard", "src", "templates.ts");

const out = await build({
  entryPoints: [src],
  bundle: true,
  format: "esm",
  write: false,
  platform: "neutral",
});
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64")
);
const { TEMPLATES } = mod;

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

check("at least 3 templates", Array.isArray(TEMPLATES) && TEMPLATES.length >= 3);
check("template ids are unique", new Set(TEMPLATES.map((t) => t.id)).size === TEMPLATES.length);

const DATA_KINDS = new Set(["builtin:usage", "builtin:sessions", "builtin:instances", "builtin:cron", "builtin:agent-status"]);

for (const tpl of TEMPLATES) {
  check(`${tpl.id}: has name + summary`, typeof tpl.name === "string" && typeof tpl.summary === "string" && tpl.name.length > 0);

  // The load-bearing check: the schema accepts the doc (so apply can't throw).
  let validated;
  try {
    validated = validateWorkspaceDoc(structuredClone(tpl.doc));
  } catch (err) {
    validated = null;
    console.error(`   validateWorkspaceDoc(${tpl.id}) threw: ${err instanceof Error ? err.message : err}`);
  }
  check(`${tpl.id}: valid workspace doc`, validated != null);

  const widgets = (tpl.doc?.tabs ?? []).flatMap((t) => t.widgets ?? []);
  check(`${tpl.id}: widget ids unique`, new Set(widgets.map((w) => w.id)).size === widgets.length);
  check(`${tpl.id}: grids fit 12 columns`, widgets.every((w) => w.grid.x >= 0 && w.grid.x + w.grid.w <= 12 && w.grid.w > 0 && w.grid.h > 0));
  check(`${tpl.id}: has at least one live data widget`, widgets.some((w) => DATA_KINDS.has(w.kind) || w.bindings));

  // Any explicit rpc binding must use an allowlisted method, or the client denies it.
  const boundMethods = widgets
    .map((w) => w.bindings?.value)
    .filter((b) => b && b.source === "rpc")
    .map((b) => b.method);
  check(
    `${tpl.id}: bound methods allowlisted`,
    boundMethods.every((m) => DATA_READ_RPC_ALLOWLIST.includes(m)),
  );
}

console.log(`\ntemplates: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

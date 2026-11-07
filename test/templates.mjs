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
const { TEMPLATES, DEFAULT_DATA_METHODS } = mod;

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

check("at least 4 templates", Array.isArray(TEMPLATES) && TEMPLATES.length >= 4);
check("template ids are unique", new Set(TEMPLATES.map((t) => t.id)).size === TEMPLATES.length);
check("ships the Office Ops operational template", TEMPLATES.some((t) => t.id === "office-ops"));

const DATA_KINDS = new Set(["builtin:usage", "builtin:sessions", "builtin:instances", "builtin:cron", "builtin:agent-status"]);
// Interactive/live widgets that make a template "real" (not just static markdown): a data
// source, an explicit binding, or a grant-gated action widget.
const LIVE_KINDS = new Set([...DATA_KINDS, "builtin:action-button", "builtin:action-form"]);

// The native handler (__init__.py) mirrors the same map; they must agree.
{
  const { readFileSync } = await import("node:fs");
  const py = readFileSync(join(here, "..", "__init__.py"), "utf8");
  const block = py.match(/_DEFAULT_DATA_METHODS = \{([^}]*)\}/);
  const pyMap = block ? Object.fromEntries([...block[1].matchAll(/["']([^"']+)["']:\s*["']([^"']+)["']/g)].map((m) => [m[1], m[2]])) : null;
  check("__init__.py _DEFAULT_DATA_METHODS matches tool-contract.mjs", JSON.stringify(pyMap) === JSON.stringify({ ...DEFAULT_DATA_METHODS }));
  check("every default method is allowlisted", Object.values(DEFAULT_DATA_METHODS).every((m) => DATA_READ_RPC_ALLOWLIST.includes(m)));
}

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
  check(`${tpl.id}: has at least one live/interactive widget`, widgets.some((w) => LIVE_KINDS.has(w.kind) || w.bindings));

  // Data-source builtins render only what their rpc binding returns: an unbound one shows
  // "No sessions yet." / $0.00 forever, so every one a template ships must be bound.
  const unbound = widgets.filter(
    (w) =>
      DEFAULT_DATA_METHODS[w.kind] &&
      (w.bindings?.value?.source !== "rpc" || w.bindings?.value?.method !== DEFAULT_DATA_METHODS[w.kind]),
  );
  check(`${tpl.id}: data widgets bound to live Hermes data`, unbound.length === 0);

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

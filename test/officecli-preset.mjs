// Stage 4 gate: the OfficeCLI connector PRESET is detect-or-instruct only (no binary
// bundling) and stamps out a connector the broker accepts. Transpiles the sidecar preset
// module (dashboard/sidecar/src/presets.ts) and asserts the stamped connector round-trips
// through the broker's own config parser, and that an absent binary yields an install
// pointer (never an auto-install).
//
// Run after `npm ci`:  node test/officecli-preset.mjs

import { build } from "esbuild";
import { rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { parseConnectorsConfig } from "@boardstate/broker";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "dashboard", "sidecar", "src", "presets.ts");
// Emit to a real file inside the repo tree (so the external @boardstate/broker specifier
// resolves via node_modules — bundling the broker would inline its dynamic `require`).
const outfile = join(here, "fixtures", ".presets.gen.mjs");
await build({
  entryPoints: [src],
  outfile,
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["@boardstate/broker"],
});
const mod = await import(pathToFileURL(outfile).href);

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const setup = mod.officeCliSetup();

check("preset id is officecli", setup.id === "officecli");
check("stdio connector spawns `officecli mcp`", setup.connector.transport === "stdio" && setup.connector.command === "officecli" && JSON.stringify(setup.connector.args) === JSON.stringify(["mcp"]));

// The stamped connector is a VALID boardstate.connectors.json entry — the operator can drop it
// straight in and the sidecar's broker will accept it (config-authorship stays the boundary).
let validated = null;
try {
  validated = parseConnectorsConfig({ connectors: [setup.connector] });
} catch (err) {
  console.error(`   parseConnectorsConfig threw: ${err instanceof Error ? err.message : err}`);
}
check("stamped connector is a valid connectors.json entry", validated != null && validated.connectors.length === 1);

// No secrets in the config (OfficeCLI needs no cloud auth — stdio, env-ref free).
check("no env refs / no secrets in the preset connector", setup.connector.env === undefined);

// Detect-or-instruct: detected ⇒ no install pointer; absent ⇒ a human install pointer (never auto-run).
check("detect-or-instruct: install pointer present iff not detected", setup.detected ? setup.install === null : (typeof setup.install === "string" && setup.install.length > 0));

// The boot hint carries the exact sample config the operator should author.
const hint = mod.officeCliBootHint();
check("boot hint names the connectors file config", typeof hint === "string" && hint.includes("boardstate.connectors.json") && hint.includes("officecli"));

// autoConfirm is a GRANT-level operator opt-in (the approvals "Auto-run" checkbox), NEVER a
// connector-config field — so a connectors.json can't silently enable it. parseConnectorsConfig
// rejects it as an unknown field, and a validated connector never carries autoConfirm.
check("no autoConfirm on the parsed preset connector", !("autoConfirm" in setup.connector));
let rejectedAutoConfirm = false;
try {
  parseConnectorsConfig({ connectors: [{ name: "x", transport: "stdio", command: "officecli", args: ["mcp"], autoConfirm: true }] });
} catch {
  rejectedAutoConfirm = true;
}
check("parseConnectorsConfig REJECTS an autoConfirm field in a connector config", rejectedAutoConfirm);

rmSync(outfile, { force: true });

console.log(`\nofficecli-preset: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

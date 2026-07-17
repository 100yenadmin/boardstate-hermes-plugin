// Structural gate for the desktop plugin bundle (dashboard/desktop/plugin.js).
//
// The desktop loader executes plugin.js as ESM and REJECTS any import except
// `@hermes/plugin-sdk` / `react*` — so a stray bundled import (a boardstate package
// leaking through) would make the plugin fail to load at runtime with no CI signal.
// This asserts the emitted bundle imports only the allowed specifiers, exports the
// HermesPlugin shape, inlines boardstate, and wires the desktop contract.
//
// Run after `npm run build`:  node test/desktop-plugin.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(here, "..", "dashboard", "desktop", "plugin.js"), "utf8");

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// Every bare import specifier the bundle keeps external must be loader-allowed.
const ALLOWED = new Set(["@hermes/plugin-sdk", "react", "react-dom", "react/jsx-runtime"]);
const specifiers = new Set();
// Real module specifiers only: `… from "X"`, side-effect `import"X"` at a statement
// boundary, and dynamic `import("X")`. (A loose /import.*"X"/ matches template-literal
// text in the minified bundle — see the tightened patterns below.)
for (const m of bundle.matchAll(/\bfrom\s*["']([^"']+)["']/g)) specifiers.add(m[1]);
for (const m of bundle.matchAll(/(?:^|[;}\n])import\s*["']([^"']+)["']/g)) specifiers.add(m[1]);
for (const m of bundle.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) specifiers.add(m[1]);
const bareSpecs = [...specifiers].filter((s) => !s.startsWith(".") && !s.startsWith("/") && !s.startsWith("data:"));
check(`only loader-allowed imports (${bareSpecs.join(", ") || "none"})`, bareSpecs.every((s) => ALLOWED.has(s)));

// Exports the HermesPlugin shape.
check("exports a default", /export\s*\{[^}]*\bas default\b|export\s+default/.test(bundle));
check('declares id "boardstate"', /["']boardstate["']/.test(bundle));

// boardstate is inlined (not left as an external import).
check("does NOT import @boardstate/* (inlined)", ![...specifiers].some((s) => s.startsWith("@boardstate/")));
check("registers <boardstate-view> (element bundle inlined)", bundle.includes("boardstate-view"));
check("createWsTransport inlined", bundle.includes("createWsTransport") || /WebSocket/.test(bundle));

// Desktop contract wired.
check("registers a route area", bundle.includes("ROUTES_AREA") || bundle.includes("routes"));
check("registers a sidebar nav", bundle.includes("SIDEBAR_NAV_AREA") || bundle.includes("sidebar.nav"));
check("sources the desktop connection", bundle.includes("getConnection"));
check("applies a template via workspace.replace", bundle.includes("dashboard.workspace.replace"));
check("maps to desktop --ui-* tokens", bundle.includes("--ui-"));

console.log(`\ndesktop-plugin: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

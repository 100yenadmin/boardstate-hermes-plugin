// Structural gate for the Hermes WEB skin (dashboard/dist/index.js).
//
// The skin makes the embedded board match the Hermes web design language: the
// display font on titles, the flat/translucent tiles, the host radii, and the
// runtime <style data-boardstate-skin> injection. This asserts those markers are
// actually present in the SHIPPED bundle (not just the source), so a build that
// drops the .css import or the token overrides fails CI.
//
// Run after `npm run build`:  node test/skin-web.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(here, "..", "dashboard", "dist", "index.js"), "utf8");

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// Rule-shaped assertions: the SELECTOR and its load-bearing declaration must appear in
// the SAME rule block inside the bundled CSS text (a bare substring check would pass
// even if a refactor moved the property to an unrelated rule). The CSS ships inside a
// JS string, so braces/selectors survive minification literally.
check(
  "widget titles use the Hermes display font",
  /\.dashboard-widget__title\s*\{[^}]*Rules Expanded/.test(bundle),
);
check(
  "buttons are sharp-cornered",
  /\.bs-btn\s*\{[^}]*border-radius:\s*0/.test(bundle),
);
check(
  "title bar tint derives from currentColor (palette-adaptive, not hardcoded white)",
  /\.dashboard-widget__bar\s*\{[^}]*currentColor/.test(bundle),
);
// Token overrides applied at mount: shadow flattened, translucent card GATED on the
// host token existing (a fixed dark fallback would wreck light non-Hermes hosts).
check("flattens the tile shadow to none", /--bs-shadow-md["'],\s*["']none/.test(bundle));
check("translucent card via color-mix on the host token", /color-mix\(in srgb,\s*var\(--color-card\)\s*85%/.test(bundle));
check("card override is conditional (removeProperty fallback)", bundle.includes("removeProperty"));
// The skin <style> is injected once at runtime.
check("injects the skin stylesheet", bundle.includes("data-boardstate-skin"));

console.log(`\nskin-web: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

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

// The skin CSS (Hermes display font + flat/translucent tiles) is bundled as text.
check("ships the Hermes display font", bundle.includes("Rules Expanded"));
check("flattens the tile shadow", bundle.includes("--bs-shadow-md"));
check("translucent card via color-mix", bundle.includes("color-mix"));
// The skin <style> is injected once at runtime.
check("injects the skin stylesheet", bundle.includes("data-boardstate-skin"));

console.log(`\nskin-web: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

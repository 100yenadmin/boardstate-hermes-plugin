// Unit test for the Hermes→Boardstate theme mapping (dashboard/src/theme.ts).
// Transpiled with esbuild (same pattern as chat-translate.mjs) so CI needs no
// browser. Asserts the alias-chain grammar, the WCAG luminance split, and that
// every palette-carrying `--bs-*` token is mapped to plausible Hermes sources.

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "dashboard", "src", "theme.ts");

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
const { BS_TO_HERMES, BS_TO_DESKTOP, aliasChain, relLuminance, themeBase } = mod;

let n = 0;
const check = (name, cond) => {
  n++;
  if (!cond) {
    console.error(`FAIL ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${name}`);
  }
};

// aliasChain grammar: single token has no fallback; multi nests right-to-left.
check("aliasChain single", aliasChain(["--a"]) === "var(--a)");
check("aliasChain pair", aliasChain(["--a", "--b"]) === "var(--a, var(--b))");
check(
  "aliasChain triple",
  aliasChain(["--a", "--b", "--c"]) === "var(--a, var(--b, var(--c)))",
);
// The innermost candidate must NOT carry a fallback (so an all-missing chain is
// invalid and the inline override drops to the data-theme default). n tokens nest
// into exactly n-1 fallback commas, so the deepest var() has none.
check("aliasChain single has no fallback comma", !aliasChain(["--x"]).includes(","));
check(
  "aliasChain nests n-1 fallbacks",
  (aliasChain(["--x", "--y", "--z"]).match(/,/g) || []).length === 2,
);

// Luminance + base selection: teal base is dark, near-white is light.
check("teal base is dark", relLuminance("rgb(4, 28, 28)") < 0.4);
check("near-white is light", relLuminance("rgb(251, 251, 253)") > 0.4);
check("themeBase teal -> dark", themeBase("rgb(4, 28, 28)") === "dark");
check("themeBase paper -> light", themeBase("rgb(251, 251, 253)") === "light");
check("themeBase handles rgba", themeBase("rgba(255, 255, 255, 1)") === "light");
check("relLuminance junk -> 0", relLuminance("transparent") === 0);
// color(srgb r g b) form (0..1 components — what getComputedStyle returns for color-mix).
check("color(srgb) light -> light", themeBase("color(srgb 0.99 0.99 0.99)") === "light");
check("color(srgb) dark -> dark", themeBase("color(srgb 0.02 0.11 0.11 / 0.94)") === "dark");
check("color(srgb) not divided by 255", relLuminance("color(srgb 1 1 1)") > 0.9);

// Mapping coverage: every palette-carrying --bs-* token must be mapped, and every
// mapping target must reference Hermes tokens (--color-* or --*-base).
const REQUIRED = [
  "--bs-bg", "--bs-card", "--bs-border", "--bs-input", "--bs-text",
  "--bs-text-strong", "--bs-text-muted", "--bs-muted", "--bs-accent",
  "--bs-accent-foreground", "--bs-ring", "--bs-danger", "--bs-success", "--bs-warning",
];
for (const t of REQUIRED) {
  check(`maps ${t}`, Array.isArray(BS_TO_HERMES[t]) && BS_TO_HERMES[t].length >= 1);
}
const allTargets = Object.values(BS_TO_HERMES).flat();
check("all targets are hermes tokens", allTargets.every((t) => /^--(color-|background-|foreground-|midground-)/.test(t)));
check("no self-referential --bs- target", allTargets.every((t) => !t.startsWith("--bs-")));

// Desktop map: same coverage, but targets the Electron app's --ui-* / --foreground tokens.
check("BS_TO_DESKTOP exists", BS_TO_DESKTOP && typeof BS_TO_DESKTOP === "object");
for (const t of REQUIRED) {
  check(`desktop maps ${t}`, Array.isArray(BS_TO_DESKTOP[t]) && BS_TO_DESKTOP[t].length >= 1);
}
const desktopTargets = Object.values(BS_TO_DESKTOP).flat();
check("all desktop targets are --ui-*/--foreground", desktopTargets.every((t) => /^--(ui-|foreground)/.test(t)));
check("no self-referential desktop --bs- target", desktopTargets.every((t) => !t.startsWith("--bs-")));
check("web + desktop cover the same --bs-* keys", JSON.stringify(Object.keys(BS_TO_HERMES).sort()) === JSON.stringify(Object.keys(BS_TO_DESKTOP).sort()));

console.log(`\ntheme mapping: ${n} checks`);

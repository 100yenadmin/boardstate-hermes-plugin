// Build the Boardstate Hermes plugin: the browser tab bundle, the Node sidecar
// bundle, and the vendored `<boardstate-view>` element bundle + stylesheet.
//
// The `@boardstate/*` packages are not published yet, so this build resolves them
// from a local Boardstate monorepo (the `feat/networked-transport-browser-bundle`
// worktree by default). Point `BOARDSTATE_REPO` at another checkout if needed. Only
// the BUILD needs the monorepo — the emitted artifacts (dist/index.js,
// sidecar/server.js, vendor/*) are self-contained and are what ships.
//
//   BOARDSTATE_REPO=/path/to/boardstate npm run build

import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO =
  process.env.BOARDSTATE_REPO ||
  "/Volumes/LEXAR/repos/boardstate.worktrees/net-transport";

// pnpm's hoisted resolution root — every `@boardstate/*` (symlinked to packages/*,
// exports maps honored), `typebox`, and `commander` resolve from here.
const nodePaths = [path.join(REPO, "node_modules/.pnpm/node_modules")];

for (const p of [REPO, ...nodePaths]) {
  if (!existsSync(p)) {
    throw new Error(
      `Boardstate source not found at ${p}. Set BOARDSTATE_REPO to a built monorepo ` +
        `(run \`pnpm install && pnpm build\` there first).`,
    );
  }
}

const dashboardDir = path.join(here, "dashboard");
mkdirSync(path.join(dashboardDir, "dist"), { recursive: true });
mkdirSync(path.join(dashboardDir, "vendor"), { recursive: true });

// 1) Browser tab bundle — IIFE, host React (never bundled), createWsTransport inlined.
await esbuild.build({
  entryPoints: [path.join(dashboardDir, "src/index.tsx")],
  outfile: path.join(dashboardDir, "dist/index.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  // React comes from window.__HERMES_PLUGIN_SDK__, never bundled.
  external: ["react", "react-dom"],
  nodePaths,
  sourcemap: true,
  minify: true,
  logLevel: "info",
});

// 2) Node sidecar bundle — single self-contained ESM file; node builtins stay external.
await esbuild.build({
  entryPoints: [path.join(dashboardDir, "sidecar/src/server.ts")],
  outfile: path.join(dashboardDir, "sidecar/server.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: ["node20"],
  nodePaths,
  sourcemap: true,
  logLevel: "info",
});

// 3) Vendor the prebuilt element bundle + stylesheet (served as static assets).
const litBrowser = path.join(REPO, "packages/lit/dist/browser.js");
const litCss = path.join(REPO, "packages/lit/src/styles/boardstate.css");
for (const [src, dest] of [
  [litBrowser, path.join(dashboardDir, "vendor/boardstate-browser.js")],
  [litCss, path.join(dashboardDir, "vendor/boardstate.css")],
]) {
  if (!existsSync(src)) {
    throw new Error(`Vendored asset missing: ${src} (build @boardstate/lit first)`);
  }
  cpSync(src, dest);
}

console.log("boardstate-hermes-plugin: build complete");

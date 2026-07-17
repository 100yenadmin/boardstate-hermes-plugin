// Build the Boardstate Hermes plugin: the browser tab bundle, the Node sidecar
// bundle, and the vendored `<boardstate-view>` element bundle + stylesheet.
//
// `@boardstate/*` are resolved from `node_modules` (pinned in package.json —
// core/schema/server ^1.8.x, lit ^0.9.x, all published to npm), via standard
// Node resolution. Run `npm install` first. Only the BUILD needs these packages —
// the emitted artifacts (dist/index.js, sidecar/server.js, vendor/*) are
// self-contained and are what ships; the runtime needs only `node`.
//
//   npm install && npm run build

import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboardDir = path.join(here, "dashboard");

// Resolve the vendored assets straight out of the installed @boardstate/lit package
// via its exports map (./browser → dist/browser.js, ./styles.css → the stylesheet).
// `import.meta.resolve` (not require.resolve) is required: the ./browser subpath only
// defines an `import` condition. Fails loudly with a clear message if install missing.
let litBrowser, litCss;
try {
  litBrowser = fileURLToPath(import.meta.resolve("@boardstate/lit/browser"));
  litCss = fileURLToPath(import.meta.resolve("@boardstate/lit/styles.css"));
} catch (err) {
  throw new Error(
    `Could not resolve @boardstate/lit assets — run \`npm install\` first.\n  ${err.message}`,
  );
}

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
  sourcemap: true,
  minify: true,
  logLevel: "info",
});

// 1b) Desktop app plugin — a single self-contained ESM `plugin.js`. The desktop loader
// only resolves `@hermes/plugin-sdk` + `react*`, so EVERYTHING boardstate is inlined
// (createWsTransport + the Lit element bundle + CSS as text + theme + templates). React
// and the SDK stay external (the app owns the singletons).
mkdirSync(path.join(dashboardDir, "desktop"), { recursive: true });
await esbuild.build({
  entryPoints: [path.join(dashboardDir, "desktop/plugin.tsx")],
  outfile: path.join(dashboardDir, "desktop/plugin.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  external: ["react", "react-dom", "react/jsx-runtime", "@hermes/plugin-sdk"],
  loader: { ".css": "text" },
  sourcemap: false,
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
  sourcemap: true,
  logLevel: "info",
});

// 3) Vendor the prebuilt element bundle + stylesheet (served as static assets).
for (const [src, dest] of [
  [litBrowser, path.join(dashboardDir, "vendor/boardstate-browser.js")],
  [litCss, path.join(dashboardDir, "vendor/boardstate.css")],
]) {
  if (!existsSync(src)) {
    throw new Error(`Vendored asset missing: ${src}`);
  }
  cpSync(src, dest);
}

console.log("boardstate-hermes-plugin: build complete (@boardstate/* from npm)");

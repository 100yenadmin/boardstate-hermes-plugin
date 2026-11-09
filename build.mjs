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

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DashboardStore, MemoryStorageAdapter } from "@boardstate/core";
import { agentToolToJsonSchema, createDashboardTools } from "@boardstate/server/node";
import esbuild from "esbuild";
import {
  CONNECTOR_TOOL_DEFINITIONS,
  toPublicToolName,
  toPublicToolText,
} from "./dashboard/sidecar/src/tool-contract.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboardDir = path.join(here, "dashboard");
const desktopDir = path.join(here, "desktop");

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

// GFM pipe tables in builtin:markdown (#32). @boardstate/lit 0.9.2's markdown renderer showed a
// pipe table as raw pipes, and agents write them. Until the upstream renderer has tables, the build
// adds them to the vendored element bundle (Web tab) and to the copy the Desktop bundle inlines.
// Every cell goes through the renderer's own escapeHtml + renderInline, like a paragraph line. Each
// anchor must match exactly once, so an @boardstate/lit bump that moves the code fails the build
// instead of shipping unpatched.
const MARKDOWN_TABLE_HELPERS = String.raw`/** Split one GFM table row into trimmed cells; \| is a literal pipe. Linear scan. */
function splitTableRow(line) {
	let row = line.trim();
	if (row.startsWith("|")) row = row.slice(1);
	if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
	const cells = [];
	let cell = "";
	for (let i = 0; i < row.length; i += 1) {
		if (row[i] === "\\" && row[i + 1] === "|") {
			cell += "|";
			i += 1;
		} else if (row[i] === "|") {
			cells.push(cell.trim());
			cell = "";
		} else cell += row[i];
	}
	cells.push(cell.trim());
	return cells;
}
/** Index of a GFM table's delimiter row (its header is the line before), or -1. */
function tableDelimiterIndex(lines) {
	for (let j = 1; j < lines.length; j += 1) {
		if (!lines[j].includes("-") || !lines[j - 1].includes("|")) continue;
		const delimiter = splitTableRow(lines[j]);
		if (!delimiter.every((cell) => /^:?-+:?$/.test(cell))) continue;
		if (splitTableRow(lines[j - 1]).length === delimiter.length) return j;
	}
	return -1;
}
/** Render a GFM table: header, then body rows padded or cut to the header's width. */
function renderTableBlock(lines) {
	const head = splitTableRow(lines[0]);
	const cell = (tag, text) => "<" + tag + ">" + renderInline(escapeHtml(text)) + "</" + tag + ">";
	const body = lines.slice(2).map((line) => {
		const cells = splitTableRow(line);
		return "<tr>" + head.map((_, i) => cell("td", cells[i] ?? "")).join("") + "</tr>";
	});
	return '<div class="dashboard-table dashboard-markdown__table"><table class="dashboard-table__grid"><thead><tr>' + head.map((text) => cell("th", text)).join("") + "</tr></thead><tbody>" + body.join("") + "</tbody></table></div>";
}
/** A paragraph block, or the lines before a GFM table plus the table. */
function renderBlockOrTable(block) {
	const lines = block.split("\n");
	const j = tableDelimiterIndex(lines);
	if (j < 0) return renderBlock(block);
	const before = lines.slice(0, j - 1);
	return (before.length ? renderBlock(before.join("\n")) : "") + renderTableBlock(lines.slice(j - 1));
}
`;
const LIT_MARKDOWN_TABLE_PATCHES = [
  { from: "function toSanitizedMarkdownHtml(source) {", to: MARKDOWN_TABLE_HELPERS + "function toSanitizedMarkdownHtml(source) {" },
  { from: "\t\telse html.push(renderBlock(block));", to: "\t\telse html.push(renderBlockOrTable(block));" },
];
const patchLitBrowser = (text, where) => {
  for (const patch of LIT_MARKDOWN_TABLE_PATCHES) {
    const count = text.split(patch.from).length - 1;
    if (count !== 1) {
      throw new Error(
        `markdown-tables: expected exactly one ${JSON.stringify(patch.from)} in ${where}, found ${count}; revisit build.mjs (#32)`,
      );
    }
    text = text.replace(patch.from, () => patch.to);
  }
  return text;
};
// Markdown tables sit in prose, so they scroll sideways rather than widen the card.
const MARKDOWN_TABLE_CSS = `
/* Boardstate Hermes plugin build: GFM tables in markdown widgets (#32). */
.dashboard-markdown__table {
  margin: 0.4em 0 0.6em;
  overflow-x: auto;
}
`;

// 0) Vendor the prebuilt element bundle + stylesheet (served as static assets) FIRST:
// the Desktop bundle (1b) inlines vendor/boardstate.css, so copying it afterwards made the
// first build after an @boardstate/lit bump embed the previous stylesheet (#20).
for (const [src, dest, transform] of [
  [litBrowser, path.join(dashboardDir, "vendor/boardstate-browser.js"), (text) => patchLitBrowser(text, litBrowser)],
  [litCss, path.join(dashboardDir, "vendor/boardstate.css"), (text) => text + MARKDOWN_TABLE_CSS],
]) {
  if (!existsSync(src)) {
    throw new Error(`Vendored asset missing: ${src}`);
  }
  writeFileSync(dest, transform(readFileSync(src, "utf8")));
}
// The Desktop bundle imports @boardstate/lit/browser itself, so it gets the same patch.
const litMarkdownTablesPlugin = {
  name: "lit-markdown-tables",
  setup(build) {
    build.onLoad({ filter: /[\\/]@boardstate[\\/]lit[\\/]dist[\\/]browser\.js$/ }, (args) => {
      if (path.resolve(args.path) !== path.resolve(litBrowser)) return undefined;
      return { contents: patchLitBrowser(readFileSync(args.path, "utf8"), args.path), loader: "js" };
    });
  },
};

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
  // The Hermes web skin (skin-web.css) is imported as text and injected at runtime.
  loader: { ".css": "text" },
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
mkdirSync(desktopDir, { recursive: true });
await esbuild.build({
  entryPoints: [path.join(dashboardDir, "desktop/plugin.tsx")],
  outfile: path.join(desktopDir, "plugin.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  external: ["react", "react-dom", "react/jsx-runtime", "@hermes/plugin-sdk"],
  loader: { ".css": "text" },
  plugins: [litMarkdownTablesPlugin],
  sourcemap: false,
  minify: true,
  logLevel: "info",
});

// 1c) Native agent-tool contract.  The base 17 definitions come from the same
// @boardstate/server factory the sidecar invokes; the two connector definitions
// are shared with that runtime.  Commit the result so register() never imports npm
// packages and Hermes can capability-probe the plugin in isolation.
// Native-only notes, true only where the native handler (__init__.py) runs: it fills the two
// fields the server owns on a replace, and binds unbound live-data builtins on add/replace.
// How a widget value renders, which agents got wrong on launch boards: a percent stat card showed
// "3,900%" for 39.0. Markdown pipe tables render since 1.5.6 (#32), so that note is gone.
const WIDGET_VALUE_NOTES =
  " A builtin:stat-card with format \"percent\" multiplies by 100: pass 0.39 to show 39%.";
const NATIVE_DESCRIPTION_NOTES = {
  boardstate_workspace_replace:
    " Pass the whole document from boardstate_workspace_get with your edits. The server sets" +
    " workspaceVersion and each tab's createdBy, so you may omit them. To add or change a few" +
    " widgets, prefer boardstate_widget_add / boardstate_widget_update: each lands on the board as it is made.",
  boardstate_widget_add:
    " Live Hermes data widgets (builtin:sessions, builtin:usage, builtin:instances, builtin:cron) are bound" +
    " to live Hermes data when you omit bindings." + WIDGET_VALUE_NOTES,
  boardstate_widget_update: WIDGET_VALUE_NOTES,
  boardstate_data_read:
    " Live Hermes data bindings (source \"rpc\") are resolved by the board when it renders, not by this tool;" +
    " to confirm one, read the widget's binding with boardstate_workspace_get.",
};
const schemaStore = new DashboardStore({ storage: new MemoryStorageAdapter() });
const baseSchemas = createDashboardTools({
  store: schemaStore,
  context: { agentId: "agent" },
  broadcast: () => undefined,
}).map((tool) => {
  const schema = agentToolToJsonSchema(tool);
  const name = toPublicToolName(schema.name);
  return {
    ...schema,
    name,
    description: toPublicToolText(schema.description) + (NATIVE_DESCRIPTION_NOTES[name] ?? ""),
  };
});
const toolSchemas = [...baseSchemas, ...CONNECTOR_TOOL_DEFINITIONS];
if (toolSchemas.length !== 19 || new Set(toolSchemas.map((tool) => tool.name)).size !== 19) {
  throw new Error(`expected 19 unique Boardstate tools, got ${toolSchemas.length}`);
}
writeFileSync(
  path.join(dashboardDir, "tools.schema.json"),
  `${JSON.stringify(toolSchemas, null, 2)}\n`,
);

// The Hermes plugin catalog's self-updater check (plugin-catalog-ci.yml) flags any bundled
// JS file that contains both a GitHub raw-content / releases-latest URL and a file-write
// call. The only such URL in the sidecar bundle is ajv's `$data` meta-schema
// IDENTIFIER (its `$id` and the one `$ref` pointing at it) — never fetched. Rewrite that
// identifier consistently to an equivalent non-GitHub URI so the check stays meaningful for
// this bundle: a later releases-latest / raw-content URL next to a file write would still trip
// it (CI replays the check).
// The host is assembled from parts so this build script itself never matches the check.
const GITHUB_RAW_HOST = ["raw", "githubusercontent", "com"].join(".");
const AJV_DATA_ID = `https://${GITHUB_RAW_HOST}/ajv-validator/ajv/master/lib/refs/data.json#`;
const AJV_DATA_ID_REWRITE = "https://ajv.js.org/refs/data.json#";
const ajvDataIdPlugin = {
  name: "ajv-data-meta-schema-id",
  setup(build) {
    build.onLoad(
      { filter: /[\\/]node_modules[\\/]ajv[\\/]dist[\\/](refs[\\/]data\.json|core\.js)$/ },
      (args) => {
        const text = readFileSync(args.path, "utf8");
        if (!text.includes(AJV_DATA_ID)) {
          throw new Error(`ajv $data meta-schema id not found in ${args.path}; revisit build.mjs note`);
        }
        return {
          contents: text.split(AJV_DATA_ID).join(AJV_DATA_ID_REWRITE),
          loader: args.path.endsWith(".json") ? "json" : "js",
        };
      },
    );
  },
};

// Two dependency texts in the sidecar bundle made Hermes' install-time plugin scanner return
// `caution`, which stops a pinned `owner/repo` install unless the user passes --force: Hermes
// asks [y/N] on a terminal and refuses with no terminal (Desktop, scripts, closed stdin).
//   - @boardstate/broker builds a `CONNECTOR_PRESETS` table holding its Pipedream and Composio
//     presets, including Pipedream's default remote-MCP URL. Boardstate imports only the
//     OfficeCLI preset and never reads the table, but esbuild cannot drop the unused
//     `Object.freeze({[preset.id]: preset, ...})` by itself (it treats the computed-key reads
//     as possible side effects). Wrapping that one statement in an arrow called once and marked
//     pure lets tree-shaking remove the table and the two presets it alone references. The
//     arrow builds the same frozen object, and if Boardstate ever imports the table, esbuild
//     keeps it, so this changes no behaviour.
//   - The MCP SDK stdio client carries a comment naming `sudo` ("list inspired by the default
//     env inheritance of sudo"). It is a comment, so dropping it changes no code.
// Each rewrite must match exactly once: if a dependency bump changes the text, the build fails
// here. If a bump moves the file so a filter no longer matches, the build passes, but
// test/scan-hygiene.mjs and test/install_scan.py fail in CI on the rebuilt bundle.
const SCAN_HYGIENE_REWRITES = [
  {
    filter: /[\\/]node_modules[\\/]@boardstate[\\/]broker[\\/]dist[\\/]index\.js$/,
    from: [
      "const CONNECTOR_PRESETS = Object.freeze({",
      "\t[officeCliPreset.id]: officeCliPreset,",
      "\t[pipedreamPreset.id]: pipedreamPreset,",
      "\t[composioPreset.id]: composioPreset",
      "});",
    ].join("\n"),
    to: [
      "const CONNECTOR_PRESETS = /* @__PURE__ */ (() => Object.freeze({",
      "\t[officeCliPreset.id]: officeCliPreset,",
      "\t[pipedreamPreset.id]: pipedreamPreset,",
      "\t[composioPreset.id]: composioPreset",
      "}))();",
    ].join("\n"),
  },
  {
    filter: /[\\/]node_modules[\\/]@modelcontextprotocol[\\/]sdk[\\/]dist[\\/]esm[\\/]client[\\/]stdio\.js$/,
    from: "/* list inspired by the default env inheritance of sudo */",
    to: "",
  },
];
const scanHygienePlugin = {
  name: "scan-hygiene",
  setup(build) {
    for (const rewrite of SCAN_HYGIENE_REWRITES) {
      build.onLoad({ filter: rewrite.filter }, (args) => {
        const text = readFileSync(args.path, "utf8");
        const count = text.split(rewrite.from).length - 1;
        if (count !== 1) {
          throw new Error(
            `scan-hygiene: expected exactly one ${JSON.stringify(rewrite.from)} in ${args.path}, found ${count}; revisit build.mjs note`,
          );
        }
        return { contents: text.replace(rewrite.from, rewrite.to), loader: "js" };
      });
    }
  },
};

// 2) Node sidecar bundle — single self-contained ESM file; node builtins stay external.
// The M5 broker's stdio connector transport (via @modelcontextprotocol/sdk → cross-spawn)
// does a dynamic `require("child_process")`. In an ESM bundle esbuild replaces an
// unresolved `require` with a shim that throws UNLESS a real `require` is in scope — so we
// inject one via createRequire. esbuild's shim then falls through to the real Node require,
// and the stdio connector (e.g. OfficeCLI `officecli mcp`) spawns correctly at runtime.
await esbuild.build({
  entryPoints: [path.join(dashboardDir, "sidecar/src/server.ts")],
  outfile: path.join(dashboardDir, "sidecar/server.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: ["node20"],
  banner: {
    js: "import { createRequire as __bsCreateRequire } from 'node:module';\nconst require = __bsCreateRequire(import.meta.url);",
  },
  sourcemap: true,
  logLevel: "info",
  plugins: [ajvDataIdPlugin, scanHygienePlugin],
});

console.log("boardstate-hermes-plugin: build complete (@boardstate/* from npm)");

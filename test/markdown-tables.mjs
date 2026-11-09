// GFM pipe tables in builtin:markdown (#32). Runs the markdown renderer from the committed
// vendor bundle (the build patches tables into @boardstate/lit's renderer) and checks that
// tables render, every cell is escaped, and markdown without a table renders exactly as the
// unpatched upstream renderer does.
//
// Run after `npm ci && npm run build`:  node test/markdown-tables.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// The markdown module is one esbuild region; it calls the i18n `t()` only for task-item labels.
const loadRenderer = (file) => {
  const text = readFileSync(file, "utf8");
  const start = text.indexOf("//#region src/markdown.ts");
  const end = text.indexOf("//#endregion", start);
  if (start < 0 || end < 0) return null;
  const t = (key) => key;
  return new Function("t", `${text.slice(start, end)}\nreturn toSanitizedMarkdownHtml;`)(t);
};
const shipped = loadRenderer(join(repo, "dashboard/vendor/boardstate-browser.js"));
// The unpatched upstream renderer, resolved the way build.mjs resolves it.
const upstream = loadRenderer(fileURLToPath(import.meta.resolve("@boardstate/lit/browser")));
check("markdown renderer found in the vendored and upstream bundles", typeof shipped === "function" && typeof upstream === "function");
const md = shipped ?? (() => "");

const budget = [
  "| Category | Planned | Actual |",
  "|---|---:|:---|",
  "| Ads | $2,000 | **$1,200** |",
  "| Events | $500 | `$0` |",
].join("\n");
const html = md(budget);
check("a pipe table renders as a table", html.includes('<table class="dashboard-table__grid">') && !html.includes("|---"));
check("header cells", html.includes("<thead><tr><th>Category</th><th>Planned</th><th>Actual</th></tr></thead>"));
check("body cells keep inline markdown", html.includes("<td>Ads</td><td>$2,000</td><td><strong>$1,200</strong></td>") && html.includes("<td><code>$0</code></td>"));

const intro = md("**Budget summary**\n| a | b |\n| - | - |\n| 1 | 2 |");
check("a line before the table stays a paragraph", intro.startsWith("<p><strong>Budget summary</strong></p><div class=\"dashboard-table dashboard-markdown__table\">"));

const hostile = md('| <img src=x onerror=alert(1)> | "><script>alert(1)</script> |\n|---|---|\n| [x](javascript:alert(1)) | [ok](https://example.com) |');
check("cell HTML is escaped", hostile.includes("&lt;img src=x onerror=alert(1)&gt;") && !hostile.includes("<img") && !hostile.includes("<script"));
check("quotes in cells are escaped", hostile.includes("&quot;&gt;&lt;script&gt;"));
check("only http(s) links become anchors", !hostile.includes('href="javascript') && hostile.includes('<a href="https://example.com" rel="noopener noreferrer">ok</a>'));
const tags = new Set([...hostile.matchAll(/<\/?([a-z0-9]+)/g)].map((m) => m[1]));
check("only allowlisted tags appear", [...tags].every((tag) => ["div", "table", "thead", "tbody", "tr", "th", "td", "a"].includes(tag)));

const escapedPipe = md("| expr | note |\n|---|---|\n| a \\| b | x |");
check("an escaped pipe stays inside its cell", escapedPipe.includes("<td>a | b</td><td>x</td>"));

const ragged = md("| a | b | c |\n|---|---|---|\n| 1 |\n| 1 | 2 | 3 | 4 |");
check("short rows are padded and long rows cut to the header width", ragged.includes("<tr><td>1</td><td></td><td></td></tr>") && ragged.includes("<tr><td>1</td><td>2</td><td>3</td></tr>"));

check("a delimiter with a different cell count is not a table", !md("| a | b |\n|---|\n| 1 | 2 |").includes("<table"));

const minimal = md("a | b\n- | -\n1 | 2");
check("a short delimiter row is a table, not a list", minimal.includes("<thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody>") && !minimal.includes("<ul>"));

const quoted = md("| a | b |\n|---|---|\n| 1 | 2 |\n> Note: preliminary | do not publish | until approved");
check(
  "a quote line ends the table and keeps all its text",
  quoted.includes("<tbody><tr><td>1</td><td>2</td></tr></tbody></table></div><blockquote>Note: preliminary | do not publish | until approved</blockquote>"),
);
check("a lone thematic break under prose is not a table", !md("Price - 5\n---").includes("<table"));

// Everything without a table renders byte for byte as the upstream renderer does.
const corpus = [
  "# Launch\nSome **bold** and _em_ text with `code` and [a link](https://example.com).",
  "- one\n- two\n- [x] done\n- [ ] todo",
  "1. first\n2. second\n\n3. third",
  "> quoted\n> lines",
  "```\n| not | a table |\n|---|---|\n```",
  "Plain | pipes | in prose\nwith no delimiter row",
  "Line one\nLine two - with a dash\n\n## Heading ##",
  "a\n---\nb",
  "> a |\n---",
  "> a | b\n|---|---|",
  "Total |\n---",
  "Foo|\n---",
  "a \\| b\n---",
  "- | -\n- item",
];
check("markdown without tables renders exactly as upstream", corpus.every((doc) => md(doc) === upstream?.(doc)));
check("upstream renders the budget table as raw pipes (the bug this fixes)", (upstream?.(budget) ?? "").includes("| Category | Planned | Actual |"));

// The Desktop bundle inlines its own copy of the renderer, so it must carry the same patch.
const desktop = readFileSync(join(repo, "desktop/plugin.js"), "utf8");
check("the Desktop bundle carries the table renderer", desktop.includes('dashboard-markdown__table"><table class="dashboard-table__grid"><thead><tr>'));
check("the vendored stylesheet styles markdown tables", readFileSync(join(repo, "dashboard/vendor/boardstate.css"), "utf8").includes(".dashboard-markdown__table {"));

console.log(`\nmarkdown-tables: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

// The agent can read what the user typed into a Notes card (#30). A builtin:notes card keeps the
// user's text as widget state, outside the workspace document, so `boardstate_workspace_get` adds
// it read-only as `notes` beside `doc`. Drives the REAL built sidecar: the agent through its MCP
// endpoint, the board (the user's typing) through the WS widget-state RPC the notes card uses.
//
// Run after `npm run build`:  node test/notes-readback.mjs

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const NONCE = "notes-nonce";
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

const stateDir = mkdtempSync(join(tmpdir(), "bs-notes-"));
const { proc, port } = await spawnSidecar({ stateDir, nonce: NONCE });

const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?nonce=${NONCE}`);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("ws never opened")), 8000);
  ws.on("open", () => { clearTimeout(t); resolve(); });
  ws.on("error", reject);
});
let nextId = 0;
const wsRequest = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = `n-${nextId++}`;
    const t = setTimeout(() => reject(new Error(`${method} timeout`)), 5000);
    const onMsg = (data) => {
      const m = JSON.parse(data.toString());
      if (m.id === id) { clearTimeout(t); ws.off("message", onMsg); (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)); }
    };
    ws.on("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });

const mcp = new Client({ name: "notes-agent", version: "1.0.0" }, { capabilities: {} });
await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));
const details = async (name, args) => JSON.parse((await mcp.callTool({ name, arguments: args })).content[0].text);

try {
  const start = await details("boardstate_workspace_get", {});
  const tab = start.doc?.tabs?.[0]?.slug;
  check("the board starts with a tab", typeof tab === "string");
  check("no notes key while the board has no notes card", !("notes" in start));

  const addNotes = await details("boardstate_widget_add", {
    tab, id: "plan-notes", kind: "builtin:notes", title: "Plan notes", grid: { x: 0, y: 3, w: 4, h: 3 }, props: { text: "Starter text from the agent" },
  });
  const addBrief = await details("boardstate_widget_add", {
    tab, id: "brief", kind: "builtin:markdown", title: "Brief", grid: { x: 4, y: 3, w: 4, h: 3 }, props: { markdown: "Hello" },
  });
  check("the agent added a notes card and a markdown card", !addNotes.error && !addBrief.error);
  const untouched = await details("boardstate_workspace_get", {});
  check("a notes card the user never typed in adds no entry", !("notes" in untouched));

  // The user types into the card: the notes card saves its text as widget state over the WS.
  await wsRequest("dashboard.widget.state.set", { widgetId: "plan-notes", state: "Call the venue on Friday.\nBudget cap $4,800." });
  // State on a widget that is not a notes card stays out.
  await wsRequest("dashboard.widget.state.set", { widgetId: "brief", state: "not a note" });

  const read = await details("boardstate_workspace_get", {});
  const note = read.notes?.[0];
  check("workspace_get returns the user's notes text", read.notes?.length === 1 && note?.text === "Call the venue on Friday.\nBudget cap $4,800.");
  check("each note names its card and tab", note?.widgetId === "plan-notes" && note?.tab === tab && note?.title === "Plan notes" && typeof note?.updatedAt === "string");
  check("only builtin:notes cards are read", !JSON.stringify(read.notes).includes("not a note"));
  const card = read.doc.tabs.flatMap((t) => t.widgets).find((w) => w.id === "plan-notes");
  check("the document itself is unchanged (props keep the starting text)", card?.props?.text === "Starter text from the agent" && !JSON.stringify(read.doc).includes("Call the venue"));
  check("workspaceVersion is still returned", typeof read.workspaceVersion === "number");

  // A non-text state (not what the notes card writes) is skipped, not crashed on.
  await wsRequest("dashboard.widget.state.set", { widgetId: "plan-notes", state: { odd: true } });
  const odd = await details("boardstate_workspace_get", {});
  check("a non-text notes state is skipped", !("notes" in odd) && Array.isArray(odd.doc?.tabs));

  // The agent can pass the document straight back to workspace_replace.
  const replaced = await details("boardstate_workspace_replace", { doc: read.doc });
  check("the returned doc round-trips through workspace_replace", !replaced.error && typeof replaced.workspaceVersion === "number");
} finally {
  ws.close();
  await mcp.close().catch(() => {});
  await stopSidecar(proc);
}

console.log(`\nnotes-readback: ${failures.length ? `${failures.length} failed` : "all checks passed"}`);
if (failures.length) {
  console.error(`failed: ${failures.join(", ")}`);
  process.exit(1);
}

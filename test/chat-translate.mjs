// Unit test for the Hermes→Boardstate chat-event translator. Proves the §14 stream is
// well-formed for a realistic Hermes turn (start/delta/end triads, paired tool events,
// exactly one turn-end last, every event carries sessionKey+turnId) and the error path.
//
// The translator only type-imports from @boardstate/schema, so we esbuild-transpile the
// single source file (types erased) and import it — no bundle needed.

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = mkdtempSync(join(tmpdir(), "bs-xlate-"));
const outfile = join(outdir, "chat-translate.mjs");
await esbuild.build({
  entryPoints: [join(repo, "dashboard/sidecar/src/chat-translate.ts")],
  outfile,
  format: "esm",
  platform: "neutral",
  bundle: true,
  // @boardstate/schema is types-only here; mark external so no resolution is needed.
  external: ["@boardstate/schema"],
});
const { createHermesChatTranslator } = await import(outfile);

const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// --- A realistic successful turn with a tool call in the middle. ---
{
  const t = createHermesChatTranslator("main");
  const seq = [
    { type: "turn.start", request_id: "req-1", text: "build me a board" },
    { type: "message.start" },
    { type: "message.delta", delta: "Sure, " },
    { type: "tool.start", name: "boardstate_tab_create", id: "tc1", args: { slug: "sales" } },
    { type: "tool.complete", name: "boardstate_tab_create", id: "tc1", status: "ok", result: { ok: true } },
    { type: "message.delta", delta: "done." },
    { type: "message.complete", text: "Sure, done.", status: "ok" },
  ];
  const out = seq.flatMap((e) => t.translate(e));
  const types = out.map((e) => e.type);

  check("first event is turn-start", types[0] === "turn-start");
  check("exactly one turn-end", types.filter((x) => x === "turn-end").length === 1);
  check("turn-end is last", types[types.length - 1] === "turn-end");
  check("text-start precedes first text-delta", types.indexOf("text-start") < types.indexOf("text-delta") && types.includes("text-start"));
  check("text-end precedes turn-end", types.indexOf("text-end") < types.lastIndexOf("turn-end"));
  const startCall = out.find((e) => e.type === "tool-call-start");
  const ready = out.find((e) => e.type === "tool-call-ready");
  const result = out.find((e) => e.type === "tool-result");
  check("tool triad shares one callId", startCall && ready && result && startCall.callId === ready.callId && ready.callId === result.callId);
  check("tool-result ok", result?.ok === true);
  check("every event carries sessionKey+turnId", out.every((e) => e.sessionKey === "main" && (e.turnId === "req-1" || e.type === "error")));
  const deltas = out.filter((e) => e.type === "text-delta").map((e) => e.delta).join("");
  check("text deltas concatenate to the answer", deltas === "Sure, done.");
}

// --- The error path: message.complete with status "error". ---
{
  const t = createHermesChatTranslator("main");
  const out = [
    { type: "turn.start", request_id: "req-2" },
    { type: "message.start" },
    { type: "message.delta", delta: "oops" },
    { type: "message.complete", text: "boom", status: "error" },
  ].flatMap((e) => t.translate(e));
  const types = out.map((e) => e.type);
  check("error path emits an error event", types.includes("error"));
  check("error path still ends the turn once", types.filter((x) => x === "turn-end").length === 1);
  check("error event carries a message", out.find((e) => e.type === "error")?.message === "boom");
}

// --- reasoning/thinking deltas are not surfaced (v1). ---
{
  const t = createHermesChatTranslator("main");
  const out = [
    { type: "turn.start", request_id: "req-3" },
    { type: "reasoning.delta", delta: "hmm" },
    { type: "thinking.delta", delta: "..." },
    { type: "message.complete", status: "ok" },
  ].flatMap((e) => t.translate(e));
  check("reasoning/thinking deltas are not surfaced", !out.some((e) => e.type === "text-delta"));
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nchat-translate: all checks passed — well-formed §14 stream from Hermes events");

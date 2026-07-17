// Regression for HOLE 1 / SEC-2 / SEC-3 (invariant #3): connector config values (command/url/
// args AND env keys+values AND header values) must NEVER surface in an agent-facing MCP
// response — length-agnostic (an API key can be short), with overlapping secrets fully masked.
//
//   Part A (end-to-end): a stdio connector whose `command` is a SHORT sentinel fails to spawn
//     (ENOENT echoes the literal command); the agent triggers it via boardstate_tool_search and
//     the MCP response is redacted. (SEC-2: short command — RED against the ≥4-length filter.)
//   Part B (unit): collectSensitiveStrings collects a short command, an env-var REF, the RESOLVED
//     env VALUE (the API key — SEC-2), and header values.
//   Part C (unit): buildRedactor sorts DESC so a short secret that prefixes a longer token
//     fully masks it (SEC-3), and redacts a short env value.
//
// Run after `npm run build`:  node test/secret-redaction.mjs

import { build } from "esbuild";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawnSidecar, stopSidecar } from "./fixtures/sidecar.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const NONCE = "redaction-nonce";
const SHORT_CMD = "Qz7"; // a 3-char command — below the old ≥4 filter (SEC-2)
const failures = [];
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// ── Part A: end-to-end — a short connector command is redacted from the agent MCP surface ──
{
  const stateDir = mkdtempSync(join(tmpdir(), "bs-redact-"));
  writeFileSync(
    join(stateDir, "boardstate.connectors.json"),
    JSON.stringify({ connectors: [{ name: "office", transport: "stdio", command: SHORT_CMD, args: ["mcp"] }] }),
  );
  const { proc, port } = await spawnSidecar({ stateDir, nonce: NONCE, quiet: true });
  try {
    const mcp = new Client({ name: "redaction-test", version: "1.0.0" }, { capabilities: {} });
    await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp?nonce=${NONCE}`)));
    const res = await mcp.callTool({ name: "boardstate_tool_search", arguments: { mode: "search", connector: "office", query: "x" } });
    const text = res.content.map((c) => c.text).join("");
    check("tool_search surfaced an error (the spawn failed as designed)", res.isError === true || /error|redacted/i.test(text));
    check("a SHORT connector command is ABSENT from the MCP response (SEC-2)", !text.includes(SHORT_CMD));
    check("the response is redacted (sanitization ran)", text.includes("[redacted]"));
    await mcp.close().catch(() => {});
  } finally {
    stopSidecar(proc);
  }
}

// ── Part B: unit — collectSensitiveStrings collects env values + headers + a short command ──
{
  const outfile = join(here, "fixtures", ".connectors.gen.mjs");
  await build({
    entryPoints: [join(here, "..", "dashboard", "sidecar", "src", "connectors.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    external: ["@boardstate/broker", "@boardstate/server/node"],
  });
  const { collectSensitiveStrings } = await import(pathToFileURL(outfile).href);
  const fakeEnv = { OFFICE_API_KEY: "sk-live-SECRET-9f3a", PD_TOKEN: "pd-XYZ-secret" };
  const collected = collectSensitiveStrings(
    {
      connectors: [
        { name: "a", transport: "stdio", command: "Qz", args: ["run"], env: { CHILD_KEY: "OFFICE_API_KEY" } },
        { name: "b", transport: "http", url: "https://api.example.com/mcp", headers: { Authorization: "Bearer ${PD_TOKEN}", "x-tenant": "acme-42" } },
      ],
    },
    fakeEnv,
  );
  rmSync(outfile, { force: true });
  const has = (s) => collected.includes(s);
  check("collects a short command (<4 chars)", has("Qz"));
  check("collects the env child-var key", has("CHILD_KEY"));
  check("collects the env-ref source name", has("OFFICE_API_KEY"));
  check("collects the RESOLVED env VALUE — the API key (SEC-2)", has("sk-live-SECRET-9f3a"));
  check("collects the header literal value", has("acme-42"));
  check("collects the resolved ${ENV} header secret (SEC-2)", has("pd-XYZ-secret"));
}

// ── Part C: unit — buildRedactor masks overlapping secrets fully, DESC order (SEC-3) ──
{
  const out = await build({
    entryPoints: [join(here, "..", "dashboard", "sidecar", "src", "redact.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  const { buildRedactor } = await import(
    "data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64")
  );
  // "TOK" is a prefix of "TOK-full-secret-abc"; naive short-first replace would leave "-full-secret-abc".
  const redact = buildRedactor(["TOK", "TOK-full-secret-abc", "sk-9"]);
  const red = redact("error: token=TOK-full-secret-abc key=sk-9 failed");
  check("overlapping secret fully masked — no token suffix leaks (SEC-3)", !red.includes("full-secret") && !red.includes("TOK-full"));
  check("short secret is redacted too", !red.includes("sk-9"));
  check("non-secret text survives", red.includes("error:") && red.includes("failed"));
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nsecret redaction: all checks passed — config (incl. env values, short strings) never reaches the agent surface");

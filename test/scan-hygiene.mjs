// The committed sidecar bundle keeps the build's two scan-hygiene rewrites (build.mjs):
// the broker's unused connector-preset table is tree-shaken away, the MCP SDK's `sudo`
// comment is gone, and the OfficeCLI preset Boardstate does use is still there.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = readFileSync(path.join(root, "dashboard/sidecar/server.js"), "utf8");

// Hermes' exfil_service and sudo_usage patterns (tools/skills_guard.py), the two HIGH findings
// that made the install scan return `caution` before 1.5.4.
assert.doesNotMatch(server, /webhook\.site|requestbin\.com|pipedream\.net|hookbin\.com/i, "exfil-service host in server.js");
assert.doesNotMatch(server, /\bsudo\b(?!\.\w)/i, "`sudo` in server.js");
assert.doesNotMatch(server, /CONNECTOR_PRESETS|pipedreamPreset|composioPreset/, "unused broker presets in server.js");

// What Boardstate imports from the broker is still bundled.
assert.match(server, /var officeCliPreset = \{/, "officeCliPreset missing");
assert.match(server, /function detectBinary\(/, "detectBinary missing");
assert.match(server, /function officeCliBootHint\(/, "officeCliBootHint missing");

console.log("scan-hygiene: ok");

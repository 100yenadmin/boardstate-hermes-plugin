// The operator gate (the M5 security crux — seam DECIDED, do not redesign).
//
// Hermes has NO role primitive: one undifferentiated session token, so operator
// approve/confirm can NEVER travel the browser WS or the MCP proxy (both stay blocked by
// `OPERATOR_ONLY_METHODS`). The privileged path is a SEPARATE, nonce-gated HTTP endpoint
// this module serves:
//
//   POST /operator?nonce=<spawn nonce>   body { method, params }
//     method ∈ EXACTLY { dashboard.widget.approve, dashboard.capability.approve,
//                        dashboard.action.confirm, dashboard.action.deny }   (else 400)
//     → executed in-process against the single host (operator context)
//
// Same nonce discipline as `/ws` and `/mcp`: only the parent `plugin_api` bridge knows the
// per-spawn nonce, so a random local process that scans the ephemeral loopback port cannot
// drive the operator plane. `plugin_api` is the ONLY caller that reaches here — it adds the
// dashboard-session auth + the operators allowlist in front, and the nonce never leaves the
// two processes.

import type { IncomingMessage, ServerResponse } from "node:http";
import { OPERATOR_ONLY_METHODS, type InProcessHost } from "@boardstate/server/node";

/** The EXACT operator verb set — the same list the WS transport blocks + the MCP endpoint
 *  excludes. Reused (not re-listed) so the three surfaces can never drift apart. */
export const OPERATOR_METHODS: ReadonlySet<string> = new Set(OPERATOR_ONLY_METHODS);

/** Cap an inbound operator body the same way the RPC surfaces cap theirs. */
const MAX_BODY_BYTES = 1024 * 1024;

async function readBody(req: IncomingMessage): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("operator request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export type OperatorEndpoint = {
  /** Handle a request on the operator path; returns false if it wasn't the operator path. */
  handle: (req: IncomingMessage, res: ServerResponse, pathname: string) => Promise<boolean>;
};

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/**
 * Build the in-process operator endpoint bound to the sidecar's single host. `nonce`, when
 * set, is required as a `?nonce=` query param (same gate as the WS/MCP). `path` defaults to
 * `/operator`. Only the four {@link OPERATOR_METHODS} verbs are executable; anything else is
 * a 400 — the endpoint can compose no board and read no data, it is the operator DECISION
 * seam only.
 */
export function createOperatorEndpoint(
  host: InProcessHost,
  options: { nonce?: string; path?: string } = {},
): OperatorEndpoint {
  const path = options.path ?? "/operator";
  const nonce = options.nonce;

  return {
    async handle(req, res, pathname) {
      if (pathname !== path) {
        return false;
      }
      if (req.method !== "POST") {
        send(res, 405, { error: "operator endpoint accepts POST only" });
        return true;
      }
      if (nonce) {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (url.searchParams.get("nonce") !== nonce) {
          send(res, 401, { error: "unauthorized" });
          return true;
        }
      }

      let payload: { method?: unknown; params?: unknown };
      try {
        payload = JSON.parse((await readBody(req)) || "{}") as typeof payload;
      } catch {
        send(res, 400, { error: "operator request body must be JSON { method, params }" });
        return true;
      }

      const method = payload.method;
      // The allowlist IS the gate: only the four operator verbs execute here. Any other
      // method — a read, a mutation, a compose tool — is refused, so this endpoint can
      // never be turned into a general control-plane bypass.
      if (typeof method !== "string" || !OPERATOR_METHODS.has(method)) {
        send(res, 400, { error: `method not allowed on the operator endpoint: ${String(method)}` });
        return true;
      }

      const params = (payload.params ?? {}) as Record<string, unknown>;
      try {
        // In-process operator context: `host.request` is the same single host the CLI/MCP
        // drive, so the approval lands on the live bus every board client subscribes to.
        const result = await host.request(method, params);
        send(res, 200, { result });
      } catch (error) {
        send(res, 400, { error: error instanceof Error ? error.message : String(error) });
      }
      return true;
    },
  };
}

/** Non-MCP loopback endpoints used by the unified plugin's two adapters. */

import type { IncomingMessage, ServerResponse } from "node:http";
import { OPERATOR_ONLY_METHODS, type InProcessHost } from "@boardstate/server/node";
import type { McpEndpoint } from "./mcp.js";
import { secretsEqual } from "./secret-compare.js";

const MAX_BODY_BYTES = 1024 * 1024;
const OPERATOR_METHODS = new Set(OPERATOR_ONLY_METHODS);

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return await new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          throw new Error("body must be a JSON object");
        }
        resolve(value as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function createInternalEndpoint(
  host: InProcessHost,
  tools: McpEndpoint,
  options: {
    nonce?: string;
    spawnedBy?: "agent" | "dashboard";
    requestShutdown?: () => void;
  },
) {
  const nonce = options.nonce;
  return {
    async handle(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
      const identityProbe = pathname === "/internal/healthz";
      const shutdownRequest = pathname === "/internal/shutdown";
      if (
        !identityProbe &&
        !shutdownRequest &&
        pathname !== "/rpc" &&
        pathname !== "/tools/invoke"
      ) {
        return false;
      }
      if (!nonce) {
        send(res, 403, { error: "internal endpoint disabled" });
        return true;
      }
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (!secretsEqual(url.searchParams.get("nonce"), nonce)) {
        send(res, 401, { error: "unauthorized" });
        return true;
      }
      if (identityProbe) {
        if (req.method !== "GET") {
          send(res, 405, { error: "GET required" });
        } else {
          send(res, 200, { ok: true });
        }
        return true;
      }
      if (shutdownRequest) {
        if (req.method !== "POST") {
          send(res, 405, { error: "POST required" });
        } else if (!options.requestShutdown) {
          send(res, 503, { error: "shutdown unavailable" });
        } else {
          send(res, 202, { accepted: true });
          setImmediate(options.requestShutdown);
        }
        return true;
      }
      if (req.method !== "POST") {
        send(res, 405, { error: "POST required" });
        return true;
      }

      let payload: Record<string, unknown>;
      try {
        payload = await readJson(req);
      } catch {
        send(res, 400, { error: "body must be JSON" });
        return true;
      }

      try {
        if (pathname === "/tools/invoke") {
          const name = payload.name;
          const args = payload.args;
          if (typeof name !== "string") throw new Error("tool name is required");
          const toolArgs =
            typeof args === "object" && args !== null && !Array.isArray(args)
              ? (args as Record<string, unknown>)
              : {};
          if (
            name === "boardstate_connector_invoke" &&
            options.spawnedBy === "agent" &&
            tools.hasConnectors
          ) {
            // An agent-owned sidecar has no operator plane, so nothing can confirm a mutation.
            // Run the call only if the upstream gate classifies the tool readOnly; a mutation
            // keeps the 409, and any other gate refusal (unknown, ungranted) is a 400 below.
            try {
              send(res, 200, { result: await tools.invokeTool(name, toolArgs, { readOnlyOnly: true }) });
            } catch (error) {
              if ((error as { code?: unknown } | null)?.code !== "not_readonly") throw error;
              send(res, 409, {
                error: "This connector action needs the dashboard to confirm. Open the Board tab, then retry.",
              });
            }
            return true;
          }
          const requestedTimeout = payload.timeoutMs;
          const mutationTimeoutMs =
            typeof requestedTimeout === "number" &&
            Number.isFinite(requestedTimeout) &&
            requestedTimeout > 0
              ? requestedTimeout
              : undefined;
          const result = await tools.invokeTool(
            name,
            toolArgs,
            mutationTimeoutMs === undefined ? undefined : { mutationTimeoutMs },
          );
          send(res, 200, { result });
          return true;
        }

        const method = payload.method;
        const params = payload.params;
        if (typeof method !== "string") throw new Error("RPC method is required");
        if (OPERATOR_METHODS.has(method)) {
          throw new Error("operator methods require the dedicated operator endpoint");
        }
        const result = await host.request(
          method,
          typeof params === "object" && params !== null && !Array.isArray(params)
            ? (params as Record<string, unknown>)
            : {},
        );
        send(res, 200, { result });
      } catch (error) {
        send(res, 400, { error: tools.safeError(error) });
      }
      return true;
    },
  };
}

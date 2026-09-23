/** Non-MCP loopback endpoints used by the unified plugin's two adapters. */

import type { IncomingMessage, ServerResponse } from "node:http";
import { OPERATOR_ONLY_METHODS, type InProcessHost } from "@boardstate/server/node";
import type { McpEndpoint } from "./mcp.js";

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
  options: { nonce?: string },
) {
  const nonce = options.nonce;
  return {
    async handle(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
      if (pathname !== "/rpc" && pathname !== "/tools/invoke") return false;
      if (req.method !== "POST") {
        send(res, 405, { error: "POST required" });
        return true;
      }
      if (!nonce) {
        send(res, 403, { error: "internal endpoint disabled" });
        return true;
      }
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (url.searchParams.get("nonce") !== nonce) {
        send(res, 401, { error: "unauthorized" });
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
          const result = await tools.invokeTool(
            name,
            typeof args === "object" && args !== null && !Array.isArray(args)
              ? (args as Record<string, unknown>)
              : {},
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

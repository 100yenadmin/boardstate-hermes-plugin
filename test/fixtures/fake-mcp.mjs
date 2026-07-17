// In-repo fake MCP SERVER + HTTP harness — the CI fixture the broker-wiring tests drive,
// adapted from the upstream @boardstate/broker fixture (packages/broker/src/fixture). The
// published broker ships only its stdio bin, not the HTTP harness, so we port the tiny
// double here: a read-only tool (`echo`), a mutating tool with NO readOnlyHint (`write_note`,
// so the broker's fail-safe treats it as a mutation → PARKS), plus `add`/`boom`. Served
// in-process over Streamable HTTP on an ephemeral loopback port (no external network).
//
// Stateless JSON mode: each POST gets a fresh Server + transport over the shared catalog,
// mirroring the SDK's simpleStatelessStreamableHttp example; GET/DELETE answer 405.

import { createServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export const FAKE_SERVER_NAME = "fake-mcp";

function catalog() {
  return [
    {
      name: "echo",
      description: "Echo the input text back.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: { text: { type: "string" } },
      },
      readOnlyHint: true,
    },
    {
      name: "add",
      description: "Add two numbers.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["a", "b"],
        properties: { a: { type: "number" }, b: { type: "number" } },
      },
      readOnlyHint: true,
    },
    {
      // NO readOnlyHint on purpose: the broker must treat it as a mutation (fail-safe) so an
      // agent invoke PARKS as an operator-confirmed pending action rather than auto-running.
      name: "write_note",
      description: "Pretend to persist a note (mutating).",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: { text: { type: "string" } },
      },
    },
    {
      name: "boom",
      description: "Always answers with isError:true.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      readOnlyHint: true,
    },
  ];
}

function textResult(details, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(details) }],
    ...(isError ? { isError: true } : {}),
  };
}

function buildFakeMcpServer() {
  const server = new Server({ name: FAKE_SERVER_NAME, version: "0.0.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: catalog().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      // Only emit annotations when the hint is set, so `write_note` arrives hint-less and the
      // broker's fail-safe (absent ⇒ mutation) is genuinely exercised.
      ...(tool.readOnlyHint ? { annotations: { readOnlyHint: true } } : {}),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = request.params.arguments ?? {};
    switch (name) {
      case "echo":
        return textResult({ text: args.text });
      case "add":
        return textResult({ sum: Number(args.a) + Number(args.b) });
      case "write_note":
        return textResult({ ok: true, saved: args.text });
      case "boom":
        return textResult({ error: "boom: this tool always fails" }, true);
      default:
        return textResult({ error: `unknown tool: ${name}` }, true);
    }
  });

  return server;
}

const METHOD_NOT_ALLOWED = JSON.stringify({
  jsonrpc: "2.0",
  error: { code: -32000, message: "Method not allowed." },
  id: null,
});

/** Start the fake MCP server over Streamable HTTP (stateless JSON mode) on 127.0.0.1. */
export async function startHttpFakeServer() {
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );

  const http = createServer((req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405).end(METHOD_NOT_ALLOWED);
      return;
    }
    const mcp = buildFakeMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      void transport.close().catch(() => {});
      void mcp.close().catch(() => {});
    });
    void mcp
      .connect(transport)
      .then(() => transport.handleRequest(req, res))
      .catch(() => {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end();
        }
      });
  });

  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  const { port } = http.address();
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    close: async () => {
      await new Promise((resolve) => http.close(() => resolve()));
    },
  };
}

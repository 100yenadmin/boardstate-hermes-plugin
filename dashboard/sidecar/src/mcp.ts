// Networked MCP endpoint for the sidecar — the seam the Hermes agent connects to
// (via a `url:` MCP server, StreamableHTTP) so its `boardstate_*` tool calls build
// the board. THE load-bearing correctness property (panel blocker #1): the tools are
// assembled against the sidecar's ONE existing `host` — `createDashboardTools({ store,
// broadcast: host.broadcast })` — so every MCP write lands on the SAME `boardstate.changed`
// bus the WS clients (the board tab) subscribe to, and the board updates live. We do NOT
// use `createBoardstateMcpServer`, which spins up a second host with its own bus.
//
// Security (panel blocker #2): the endpoint is nonce-gated (same per-spawn nonce as the
// WS), and the exposed tool set is the base build/read tools only — operator actions
// (widget/capability approve, action confirm) are NOT exposed here; approval stays a
// human decision through the operator-authed surface.

import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { DashboardStore } from "@boardstate/core";
import {
  agentToolToJsonSchema,
  createDashboardTools,
  type AgentTool,
  type InProcessHost,
  type ToolSearchCapability,
} from "@boardstate/server/node";

const AGENT_TOOL_PREFIX = "dashboard_";
const MCP_TOOL_PREFIX = "boardstate_";
// Present first-party `dashboard_*` tools under the ecosystem's `boardstate_*` prefix.
// Tools already carrying a `boardstate_`/external namespace (`boardstate_tool_search`,
// `connector__tool`) pass through unchanged — and the CALL path indexes by this exact
// presented name, so the transform never has to be inverted.
const toMcpToolName = (agentName: string): string =>
  agentName.startsWith(AGENT_TOOL_PREFIX)
    ? `${MCP_TOOL_PREFIX}${agentName.slice(AGENT_TOOL_PREFIX.length)}`
    : agentName;

function textResult(details: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(details) }],
    ...(isError ? { isError: true } : {}),
  };
}

export type McpEndpoint = {
  /** Handle an HTTP request on the MCP path; returns false if it wasn't the MCP path. */
  handle: (req: IncomingMessage, res: ServerResponse, pathname: string) => Promise<boolean>;
  close: () => Promise<void>;
};

/**
 * Build the MCP endpoint bound to the sidecar's existing host + store. `nonce`, when
 * set, is required as a `?nonce=` query param (same gate as the WS). `path` defaults
 * to `/mcp`.
 */
export async function createMcpEndpoint(
  host: InProcessHost,
  store: DashboardStore,
  options: {
    nonce?: string;
    path?: string;
    /** The `boardstate_tool_search` backing (from `installConnectorWorkspace`), when the
     *  operator authored connectors. Absent ⇒ the agent gets the base build/read tools only. */
    toolSearch?: ToolSearchCapability;
    /** The broker's GRANTED external tools for THIS turn (host.tools()), when a connector
     *  workspace is installed. The agent reaches an approved tool by its provider-safe name;
     *  a mutation only PARKS (the engine gates it), a readOnly executes directly. */
    grantedTools?: () => AgentTool[];
  } = {},
): Promise<McpEndpoint> {
  const path = options.path ?? "/mcp";
  const nonce = options.nonce;
  const { toolSearch, grantedTools } = options;

  // One MCP Server per session, each with tool handlers bound to the SAME host + store
  // (so single-host liveness holds regardless of how many sessions connect). The tools
  // mutate the shared store and emit on the shared `boardstate.changed` bus. When the
  // operator has connectors wired, the agent also gets `boardstate_tool_search` (via
  // `toolSearch`) and every currently-GRANTED external tool (via `grantedTools()`), so it
  // can search → request a grant → (operator approves) → invoke an approved tool.
  const buildTools = (agentId: string): AgentTool[] => [
    ...createDashboardTools({
      store,
      context: { agentId },
      broadcast: host.broadcast,
      ...(toolSearch ? { toolSearch } : {}),
    }),
    ...(grantedTools ? grantedTools() : []),
  ];

  // Map each turn's tools by their PRESENTED MCP name (lossless): the name→name transform
  // is not round-trippable for tools already `boardstate_`-prefixed (`boardstate_tool_search`)
  // or externally-namespaced (`connector__tool`), so we index by exactly the name we list
  // rather than re-deriving the agent name from the MCP name on call.
  const toolsByMcpName = (agentId: string): Map<string, AgentTool> => {
    const map = new Map<string, AgentTool>();
    for (const tool of buildTools(agentId)) {
      map.set(toMcpToolName(agentToolToJsonSchema(tool).name), tool);
    }
    return map;
  };

  function makeServer(): Server {
    const server = new Server(
      { name: "boardstate-hermes-sidecar", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: buildTools("agent").map((tool) => {
        const schema = agentToolToJsonSchema(tool);
        return {
          name: toMcpToolName(schema.name),
          description: schema.description,
          inputSchema: schema.inputSchema,
        };
      }),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const mcpName = request.params.name;
      const args = (request.params.arguments ?? {}) as Record<string, unknown>;
      try {
        const tool = toolsByMcpName("agent").get(mcpName);
        if (!tool) {
          return textResult({ error: `unknown tool: ${mcpName}` }, true);
        }
        const { details } = await tool.execute(mcpName, args);
        return textResult(details);
      } catch (error) {
        return textResult({ error: error instanceof Error ? error.message : String(error) }, true);
      }
    });
    return server;
  }

  // Stateful sessions: an `initialize` POST (no session id) mints a transport + server;
  // subsequent requests route by the `mcp-session-id` header. This is the canonical
  // StreamableHTTP pattern — the stateless mode can't complete the client's
  // initialize→initialized handshake.
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

  async function newSession(): Promise<StreamableHTTPServerTransport> {
    const server = makeServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sid) => {
        sessions.set(sid, { transport, server });
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        sessions.delete(transport.sessionId);
      }
    };
    await server.connect(transport);
    return transport;
  }

  function isInitialize(req: IncomingMessage): boolean {
    // Best-effort: an initialize POST carries no session id. The transport validates
    // the actual JSON-RPC method; here we only decide whether to mint a session.
    return req.method === "POST";
  }

  return {
    async handle(req, res, pathname) {
      if (pathname !== path) {
        return false;
      }
      if (nonce) {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (url.searchParams.get("nonce") !== nonce) {
          res.statusCode = 401;
          res.end("unauthorized");
          return true;
        }
      }
      const sid = req.headers["mcp-session-id"];
      const existing = typeof sid === "string" ? sessions.get(sid) : undefined;
      let transport: StreamableHTTPServerTransport | undefined = existing?.transport;
      if (!transport) {
        if (!sid && isInitialize(req)) {
          transport = await newSession();
        } else {
          res.statusCode = 400;
          res.end("no valid mcp session");
          return true;
        }
      }
      // The transport reads + parses the raw request stream itself.
      await transport.handleRequest(req, res);
      return true;
    },
    async close() {
      for (const { transport, server } of sessions.values()) {
        await transport.close().catch(() => undefined);
        await server.close().catch(() => undefined);
      }
      sessions.clear();
    },
  };
}

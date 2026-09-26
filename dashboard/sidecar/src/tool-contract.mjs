/** Shared, static public contract for the two connector tools. */

export const AGENT_TOOL_PREFIX = "dashboard_";
export const PUBLIC_TOOL_PREFIX = "boardstate_";

export const toPublicToolName = (agentName) =>
  agentName.startsWith(AGENT_TOOL_PREFIX)
    ? `${PUBLIC_TOOL_PREFIX}${agentName.slice(AGENT_TOOL_PREFIX.length)}`
    : agentName;

export const toPublicToolText = (text) =>
  typeof text === "string"
    ? text.replace(/\bdashboard_(?=[a-z*])/g, PUBLIC_TOOL_PREFIX)
    : text;

export const CONNECTOR_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["connector", "tool"],
  properties: {
    connector: { type: "string", description: "The operator-authored connector name." },
    tool: {
      type: "string",
      description: "The connector's tool name (see boardstate_tool_search).",
    },
    args: { type: "object", description: "Arguments for the tool (per its input schema)." },
  },
};

export const CONNECTOR_TOOL_DEFINITIONS = [
  {
    name: "boardstate_connector_read",
    description:
      "Read live data from an operator-APPROVED external connector tool (readOnly only). " +
      "A mutating or ungranted tool is refused; the connector's live manifest is re-checked " +
      "on every call, so a changed tool re-pends its grant instead of running. Discover tools with boardstate_tool_search.",
    inputSchema: CONNECTOR_TOOL_SCHEMA,
  },
  {
    name: "boardstate_connector_invoke",
    description:
      "Invoke an operator-APPROVED external connector tool. A readOnly tool runs directly; " +
      "a mutating tool PARKS as a pending action and BLOCKS until the operator confirms (up to " +
      "a bounded timeout, after which it returns as still-parked). A confirm that lands after " +
      "that timeout can still run the action, so before retrying a parked call check the pending " +
      "actions (dashboard.action.list, shown on the board's approvals card). The connector's live " +
      "manifest is re-checked (anti-rug-pull) on every call.",
    inputSchema: CONNECTOR_TOOL_SCHEMA,
  },
];

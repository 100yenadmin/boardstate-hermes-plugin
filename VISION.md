# Boardstate vision

## Goal

From one ask, your Hermes agent builds a live board of KPIs, tables and charts, and keeps it current as plans change. The board is a
saved, validated document in your Hermes home, so it outlasts the chat that made it.

## Users

- People who use Hermes for ongoing work, such as a launch, a project or a weekly review, and want one place where the agent keeps the
  current numbers, plans and decisions.
- Operators who run Hermes for a team and want a board of live Hermes data (sessions, usage, cron jobs, running instances) and
  pending approvals.

## Coverage on Hermes surfaces

| Surface | What Boardstate does there |
|---|---|
| Web dashboard (`hermes dashboard`) | A **Board** tab: view, edit and approve, with live updates. The dashboard also serves an optional MCP endpoint (`/api/plugins/boardstate/mcp`, dashboard-authenticated) for MCP clients; normal use relies on the native tools. |
| Hermes Desktop | A **Board** page through the public plugin SDK. On an OAuth remote the SDK has no live socket, so the page says live updates are unavailable and a reload shows changes. |
| CLI and TUI | The 19 native `boardstate_*` tools, verified by hand with `hermes chat`. The agent can build and update the board with no dashboard running; you view it in the dashboard or Desktop. Without the dashboard, live Hermes data widgets ask you to open the Board tab, and connector actions that change something are refused. |
| Telegram and other messaging | The same native tools are available to the agent, so it can build and update the board from a messaging session. The board is not drawn in the chat; you open it in the dashboard or Desktop. Not yet verified end to end on a messaging platform. |
| API server | The same native tools for agent sessions. Not yet verified end to end through the API server. |

## Non-goals

- Drawing the board inside chat messages. The board lives in the dashboard and Desktop.
- A hosted Boardstate service, accounts or API keys. The board lives in the Hermes home of the Hermes it runs on. Boardstate makes no
  third-party network request by default; operator-configured connectors are the only paths that reach outside Hermes.
- A general BI tool or data warehouse. Boardstate shows what the agent and Hermes know; it does not query outside systems unless an
  operator configures a connector.
- Running connectors without an operator. Connector reads need an approved grant, and actions wait for an operator decision unless
  the operator has set that tool to Auto-run.
- Per-session boards inside one profile. Sessions in a profile are the same agent and share one board; this changes only if Hermes
  adds a native per-session identity (#20). On Hermes 0.21.x the web Board tab shows the default profile's board (see Profiles in the
  README).

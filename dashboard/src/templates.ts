// Live-bound board templates for the Hermes dashboard.
//
// A template is just a Boardstate workspace doc. Its data widgets are the dedicated
// data-source builtins (usage / sessions / instances / cron), which self-bind to
// their Hermes REST method on the server (see registerHermesDataRpc) — so a template
// shows REAL Hermes data with zero manual bindings and graceful empty states, never
// an error cell. Applied via the non-operator `dashboard.workspace.replace` RPC.
//
// Everything here is data — no OpenClaw references, Hermes-native copy.

export type BoardTemplate = {
  id: string;
  name: string;
  summary: string;
  doc: unknown;
};

type Widget = {
  id: string;
  kind: string;
  title: string;
  grid: { x: number; y: number; w: number; h: number };
  collapsed: false;
  hidden: false;
  props?: Record<string, unknown>;
  bindings?: Record<string, unknown>;
};

function doc(slug: string, title: string, widgets: Widget[]) {
  return {
    schemaVersion: 1,
    workspaceVersion: 1,
    widgetsRegistry: {},
    prefs: { tabOrder: [slug] },
    tabs: [{ slug, title, icon: "layoutDashboard", hidden: false, createdBy: "system", widgets }],
  };
}

const md = (id: string, title: string, x: number, y: number, w: number, h: number, markdown: string): Widget => ({
  id,
  kind: "builtin:markdown",
  title,
  grid: { x, y, w, h },
  collapsed: false,
  hidden: false,
  props: { markdown },
});

// A data-source builtin that self-binds to its Hermes method — no `bindings` needed.
const data = (id: string, kind: string, title: string, x: number, y: number, w: number, h: number, props: Record<string, unknown> = {}): Widget => ({
  id,
  kind,
  title,
  grid: { x, y, w, h },
  collapsed: false,
  hidden: false,
  props,
});

export const TEMPLATES: BoardTemplate[] = [
  {
    id: "agent-hq",
    name: "Agent HQ",
    summary: "Live operations overview — usage, sessions, connected instances, and schedules.",
    doc: doc("board", "Agent HQ", [
      md("header", "Overview", 0, 0, 12, 2, "# Agent HQ\nLive operations for this Hermes agent."),
      data("usage", "builtin:usage", "Usage", 0, 2, 4, 3),
      data("instances", "builtin:instances", "Instances", 4, 2, 4, 3),
      data("sessions", "builtin:sessions", "Sessions", 8, 2, 4, 5),
      data("cron", "builtin:cron", "Scheduled jobs", 0, 5, 8, 3),
    ]),
  },
  {
    id: "usage-cost",
    name: "Usage & Cost",
    summary: "Spend and token usage at a glance, with the underlying breakdown.",
    doc: doc("board", "Usage & Cost", [
      md("header", "Overview", 0, 0, 12, 2, "# Usage & Cost\nToday's spend and token consumption."),
      data("cost", "builtin:stat-card", "Cost", 0, 2, 3, 2, { metric: "todayCost", format: "usd", label: "Cost (today)" }),
      data("tokens", "builtin:stat-card", "Tokens", 3, 2, 3, 2, { metric: "todayTokens", format: "int", label: "Tokens (today)" }),
      data("usage", "builtin:usage", "Usage detail", 6, 2, 6, 3),
      data("cron", "builtin:cron", "Scheduled jobs", 0, 5, 12, 3),
    ].map((w) =>
      // The two stat-cards read live usage; the dedicated builtins self-bind.
      w.id === "cost" || w.id === "tokens"
        ? { ...w, bindings: { value: { source: "rpc", method: "usage.status" } } }
        : w,
    )),
  },
  {
    id: "sessions-monitor",
    name: "Sessions Monitor",
    summary: "Watch active sessions and connected instances in real time.",
    doc: doc("board", "Sessions Monitor", [
      md("header", "Overview", 0, 0, 12, 2, "# Sessions Monitor\nActive sessions and connected instances."),
      data("sessions", "builtin:sessions", "Sessions", 0, 2, 7, 5),
      data("instances", "builtin:instances", "Instances", 7, 2, 5, 3),
      data("usage", "builtin:usage", "Usage", 7, 5, 5, 2),
    ]),
  },
];

// HermesRpcDeps — resolves Boardstate `source:"rpc"` data bindings against the live
// Hermes REST surface, so the board's builtins (usage / sessions / instances / cron)
// show real Hermes data instead of error cells.
//
// AUTH (the keystone seam): the Node sidecar CANNOT authenticate to Hermes off-loopback
// on its own, so `plugin_api` (in-process with the gateway) injects the dashboard base
// URL + a session credential into the sidecar env at spawn. This resolver uses that
// credential server-side only — it never enters the workspace doc or reaches a browser.
//
// A binding this resolver doesn't handle (file bindings, unknown methods) is delegated
// to the injected `fallback` (the node default from `nodeRpcDeps()`), so behavior is a
// pure superset of the stock sidecar.

import type { BindingResolver } from "@boardstate/server/node";

export type HermesDataConfig = {
  /** Dashboard base, e.g. http://127.0.0.1:9119 (no trailing slash needed). */
  baseUrl: string;
  /** Session token sent as X-Hermes-Session-Token (loopback/token mode). */
  sessionToken: string;
  /** The node default resolver — handles file bindings + anything not mapped here. */
  fallback: BindingResolver;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

type RpcBinding = { source: "rpc"; method: string; params?: Record<string, unknown> };

function isRpcBinding(binding: unknown): binding is RpcBinding {
  return (
    typeof binding === "object" &&
    binding !== null &&
    (binding as { source?: unknown }).source === "rpc" &&
    typeof (binding as { method?: unknown }).method === "string"
  );
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
/** Epoch ms from epoch ms, epoch seconds (Hermes 0.23 `last_active`) or an ISO string; else undefined. */
const epochMs = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v < 1e11 ? Math.round(v * 1000) : v;
  if (typeof v === "string" && v) {
    const parsed = Date.parse(v);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/** The sidecar's local calendar day as YYYY-MM-DD. The sidecar runs on the Hermes host, and Hermes 0.23
 *  buckets `/api/analytics/usage` `daily[].day` by that host's local calendar day. */
const localDay = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/**
 * Each handler maps a Boardstate data-read method to a Hermes REST call + shapes the
 * response to what the corresponding builtin expects (SPEC data shapes). Best-effort
 * on the Hermes side: missing keys degrade to empty, never throw.
 */
type Handler = (
  get: (path: string) => Promise<unknown>,
  params: Record<string, unknown>,
) => Promise<unknown>;

const HANDLERS: Record<string, Handler> = {
  // usage widget: { totals: { totalCost, totalTokens }, days?, costToday?, tokensToday? }
  "usage.status": async (get) => {
    const u = obj(await get("/api/analytics/usage"));
    const totals = obj(u.totals ?? u);
    const totalCost = num(totals.total_estimated_cost ?? totals.estimated_cost ?? totals.totalCost);
    const totalTokens =
      num(totals.total_input ?? totals.input_tokens) + num(totals.total_output ?? totals.output_tokens);
    const result: Record<string, unknown> = { totals: { totalCost, totalTokens }, days: num(u.days ?? u.period_days) || undefined };
    // Hermes 0.23 has a per-day series. Today's row feeds the Usage & Cost "today" stat cards, which
    // select `costToday` / `tokensToday` through props.metric. Not `todayCost` / `todayTokens`: the
    // renderer maps those two names to `totals`, the whole period. With a series but no row for today,
    // today is a real 0. Without a series, leave the fields out so the cards show "—".
    if (Array.isArray(u.daily)) {
      const today = obj(u.daily.find((d) => str(obj(d).day) === localDay()));
      result.costToday = num(today.estimated_cost);
      result.tokensToday = num(today.input_tokens) + num(today.output_tokens);
    }
    return result;
  },
  // stat-card (usd): a single number.
  "usage.cost": async (get) => {
    const u = obj(await get("/api/analytics/usage"));
    const totals = obj(u.totals ?? u);
    return num(totals.total_estimated_cost ?? totals.estimated_cost ?? totals.totalCost);
  },
  // sessions widget: rows { key, label, status, hasActiveRun, updatedAt }
  "sessions.list": async (get, params) => {
    const limit = num(params.limit) || 8;
    const raw = await get("/api/sessions");
    const list = Array.isArray(raw) ? raw : arr(obj(raw).sessions);
    return list.slice(0, limit).map((s) => {
      const row = obj(s);
      return {
        key: str(row.id ?? row.session_id ?? row.key),
        label: str(row.title ?? row.label ?? row.name) || str(row.id ?? row.session_id),
        status: str(row.status),
        // Hermes 0.23 has no per-session run-state field; `is_active` (open, with activity in
        // the last 300 s) is what its own dashboard marks as active, so the live dot means that.
        hasActiveRun: Boolean(row.has_active_run ?? row.hasActiveRun ?? row.is_active ?? row.active),
        // The renderer shows a time only for a finite epoch-ms number.
        updatedAt: epochMs(row.updated_at ?? row.updatedAt ?? row.last_active ?? row.last_activity),
      };
    });
  },
  // instances widget: { presence: [{ instanceId, platform, version, lastInputSeconds }] }
  "system-presence": async (get) => {
    const s = obj(await get("/api/status"));
    // Hermes 0.23 reports `active_agents` as a count, with the gateway and its platforms beside it.
    // Instances are then the running gateway plus each connected platform; a stopped gateway has none.
    if (typeof s.active_agents === "number") {
      if (s.gateway_running !== true) return { presence: [] };
      const n = num(s.active_agents);
      // The renderer's meta text never shrinks and the name truncates, so the count rides in the name
      // and the meta stays short ("running · 0.23.0"): a narrow widget still shows "Hermes gateway…".
      const gateway: Record<string, unknown> = {
        instanceId: `Hermes gateway (${n} active agent${n === 1 ? "" : "s"})`,
        mode: str(s.gateway_state) || "running",
        version: str(s.version),
      };
      // Only a stale heartbeat has an idle time; the renderer shows "idle 0s" for a 0. Hermes sets the
      // field only once the heartbeat is over 120 s old but truncates it to whole seconds, and the
      // renderer marks 120 or less healthy, so floor it at 121 to keep the dot red.
      if (typeof s.gateway_heartbeat_stale_s === "number") gateway.lastInputSeconds = Math.max(s.gateway_heartbeat_stale_s, 121);
      const platforms = Object.entries(obj(s.gateway_platforms))
        .filter(([, entry]) => str(obj(entry).state) === "connected")
        .map(([name]) => ({ instanceId: name, mode: "connected" }));
      return { presence: [gateway, ...platforms] };
    }
    const agents = arr(s.active_agents ?? s.agents ?? s.presence);
    return {
      presence: agents.map((a) => {
        const row = obj(a);
        return {
          instanceId: str(row.instance_id ?? row.id ?? row.name),
          platform: str(row.platform ?? row.channel),
          version: str(row.version),
          lastInputSeconds: num(row.last_input_seconds ?? row.idle_seconds),
        };
      }),
    };
  },
  // cron widget: { jobs: [{ id, name, enabled, state: { nextRunAtMs, lastRunStatus } }] }
  "cron.list": async (get, params) => {
    const limit = num(params.limit) || 8;
    // Hermes 0.23 serves /api/cron/jobs; older hosts served /api/cron.
    const raw = await get("/api/cron/jobs").catch((err: unknown) => {
      if (err instanceof Error && err.message.endsWith("→ 404")) return get("/api/cron");
      throw err;
    });
    const list = Array.isArray(raw) ? raw : arr(obj(raw).jobs ?? obj(raw).crons);
    return {
      jobs: list.slice(0, limit).map((j) => {
        const row = obj(j);
        const state = obj(row.state);
        const enabled = Boolean(row.enabled ?? row.active);
        return {
          id: str(row.id ?? row.name),
          name: str(row.name ?? row.id),
          enabled,
          state: {
            // null (not 0) when no next run is known, so the renderer says so instead of 1970.
            // A paused job keeps its old next_run_at in Hermes 0.23, but it will not run.
            nextRunAtMs: enabled
              ? (epochMs(state.nextRunAtMs ?? row.next_run_at_ms ?? row.next_run_ms) ?? epochMs(row.next_run_at) ?? null)
              : null,
            lastRunStatus: str(state.lastRunStatus ?? row.last_run_status ?? row.last_status),
          },
        };
      }),
    };
  },
};

// `node.list` is an alias of the same presence data for the instances builtin.
HANDLERS["node.list"] = HANDLERS["system-presence"];

/** A Hermes REST getter bound to a base URL + session token (server-side only). */
function makeGet(baseUrl: string, sessionToken: string, fetchImpl: typeof fetch) {
  const base = baseUrl.replace(/\/+$/, "");
  return async (path: string): Promise<unknown> => {
    const res = await fetchImpl(`${base}${path}`, {
      headers: { "X-Hermes-Session-Token": sessionToken, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Hermes ${path} → ${res.status}`);
    }
    return res.json();
  };
}

export function createHermesRpcResolver(config: HermesDataConfig): BindingResolver {
  const get = makeGet(config.baseUrl, config.sessionToken, config.fetchImpl ?? fetch);
  return async (binding, options) => {
    if (isRpcBinding(binding)) {
      const handler = HANDLERS[binding.method];
      if (handler) {
        return handler(get, binding.params ?? {});
      }
    }
    // Not a Hermes-mapped rpc binding — delegate (file bindings, unmapped methods).
    return config.fallback(binding, options);
  };
}

/** Minimal shape of the host's RPC registration surface we depend on. */
type RpcHost = {
  registerRpc: (
    method: string,
    handler: (opts: {
      params?: unknown;
      respond: (
        ok: boolean,
        data?: unknown,
        error?: { code: string; message: string },
      ) => void;
    }) => unknown,
    options: { scope: "read" | "write" },
  ) => void;
};

/**
 * Register each Hermes data method as a read-scoped RPC handler on the host.
 *
 * THIS is the seam the browser actually uses. `<boardstate-view>` resolves a
 * `source:"rpc"` binding by calling `transport.request(binding.method, params)`
 * (see @boardstate/host resolveBinding) — it does NOT route rpc bindings through
 * `dashboard.data.read` (that serves file/static only and answers rpc with
 * `binding_client_resolved`). Without these handlers every data-bound widget
 * renders an error cell. Read scope keeps them callable over the networked
 * transport (operator-only/write methods are blocked there).
 */
export function registerHermesDataRpc(
  host: RpcHost,
  config: { baseUrl: string; sessionToken: string; fetchImpl?: typeof fetch },
): string[] {
  const get = makeGet(config.baseUrl, config.sessionToken, config.fetchImpl ?? fetch);
  const methods = Object.keys(HANDLERS);
  for (const method of methods) {
    host.registerRpc(
      method,
      async (opts) => {
        const data = await HANDLERS[method](get, obj(opts?.params));
        opts.respond(true, data);
      },
      { scope: "read" },
    );
  }
  return methods;
}

/** Register the same live-data methods when no dashboard is attached, but fail
 * with one explicit message instead of an unknown-method crash in the widget. */
export function registerUnavailableHermesDataRpc(host: RpcHost): string[] {
  const methods = Object.keys(HANDLERS);
  for (const method of methods) {
    host.registerRpc(
      method,
      (opts) => {
        opts.respond(false, undefined, {
          code: "hermes_data_unavailable",
          message:
            "Live Hermes data is unavailable because Boardstate was started by the agent without a dashboard. Open the Board tab to reconnect live data.",
        });
      },
      { scope: "read" },
    );
  }
  return methods;
}

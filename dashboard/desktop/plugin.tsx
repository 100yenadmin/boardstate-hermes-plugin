// Hermes DESKTOP app plugin — the Board as a first-class desktop page.
//
// The desktop plugin loader executes this file as ESM in the renderer realm and only
// resolves `@hermes/plugin-sdk` and `react*`; every other import is REJECTED. So unlike
// the web tab (which loads the vendored `<boardstate-view>` bundle as a separate static
// asset), everything here — createWsTransport, the Lit element definitions, the CSS,
// the theme map, the templates — is INLINED by esbuild into a single `plugin.js`.
//
// Backend: identical to the web plugin. The desktop app spawns the same Python backend,
// so `/api/plugins/boardstate/*` (WS bridge + MCP proxy + sidecar) already exists. We
// use only the scoped SDK doors: ctx.rest for requests and ctx.socket for pushes.

import { host, ROUTES_AREA, SIDEBAR_NAV_AREA } from "@hermes/plugin-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Transport } from "@boardstate/core";
import { BoardstateHeaderElement, BoardstateViewElement } from "@boardstate/lit/browser";
import boardstateCss from "../vendor/boardstate.css"; // esbuild text loader → string
import skinDesktopCss from "./skin-desktop.css"; // Hermes DESKTOP skin (macOS language)
import { BS_TO_DESKTOP, aliasChain, themeBase } from "../src/theme";
import { TEMPLATES } from "../src/templates";
import { withOperatorGate } from "../src/operator-transport";

// The vendored Lit module guards its own registrations; repeat the guard here so
// hot reload remains explicit at the plugin seam too.
function ensureElements(): void {
  if (!customElements.get("boardstate-view")) {
    customElements.define("boardstate-view", BoardstateViewElement);
  }
  if (!customElements.get("boardstate-header")) {
    customElements.define("boardstate-header", BoardstateHeaderElement);
  }
}

// Inject the Boardstate stylesheet once (the desktop app has no manifest `css` hook).
function ensureCss(): HTMLStyleElement | null {
  const existing = document.querySelector<HTMLStyleElement>("style[data-boardstate]");
  if (existing) return null;
  const style = document.createElement("style");
  style.setAttribute("data-boardstate", "");
  // Boardstate base sheet first, then the DESKTOP skin (macOS design language) so
  // the skin's scoped class-level rules win over the bundle's own defaults.
  style.textContent = `${boardstateCss as unknown as string}\n${skinDesktopCss as unknown as string}`;
  document.head.appendChild(style);
  return style;
}

// Same var()-alias theme adapter as the web tab, against the desktop `--ui-*` tokens.
function applyDesktopTheme(view: HTMLElement): void {
  const bg = getComputedStyle(document.body).backgroundColor || "rgb(0,0,0)";
  view.setAttribute("data-theme", themeBase(bg));
  for (const [bsVar, uiVars] of Object.entries(BS_TO_DESKTOP)) {
    view.style.setProperty(bsVar, aliasChain(uiVars));
  }
  // macOS design language: adopt the app's own card rounding (--radius-xl ≈ 9.6px),
  // tighter control radii, a single subtle elevation shadow (not the bundle's heavy
  // two-layer default), and the host system font stack (SF on macOS).
  view.style.setProperty("--bs-radius-lg", "var(--radius-xl, 10px)");
  view.style.setProperty("--bs-radius-md", "0.375rem");
  view.style.setProperty("--bs-radius-sm", "0.25rem");
  view.style.setProperty("--bs-shadow-md", "0 1px 3px rgba(0,0,0,0.10)");
  view.style.setProperty("--bs-font-sans", getComputedStyle(document.body).fontFamily);
}

type ViewElement = HTMLElement & { transport?: unknown; connected?: boolean; basePath?: string; operator?: boolean };

/** POST an operator decision through the plugin's own namespaced REST door (`ctx.rest` →
 *  `/api/plugins/boardstate/operator`); resolve the sidecar's raw RPC result. */
type OperatorRest = <T>(path: string, opts?: { method?: string; body?: unknown }) => Promise<T>;

type PluginSocket = (path: string, onMessage: (data: unknown) => void) => () => void;
type PluginTimer = (fn: () => void, ms: number) => () => void;
type DesktopStatus = "connecting" | "live" | "degraded" | "error";

type SdkTransport = Transport & {
  readonly ready: Promise<void>;
  readonly closed: boolean;
  close: () => void;
};

/** Adapt the receive-only Desktop SDK socket plus REST requests to Boardstate's
 * tiny Transport interface.  OAuth remotes still support REST; if ctx.socket is
 * a no-op, the acknowledgement timeout reports a clear degraded state. */
function createSdkTransport(
  rest: OperatorRest,
  socket: PluginSocket,
  setTimer: PluginTimer,
  onStatus: (status: DesktopStatus, detail?: string) => void,
): SdkTransport {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  let closed = false;
  let acknowledged = false;
  const cancelAckTimeout = setTimer(() => {
    if (!closed && !acknowledged) {
      onStatus(
        "degraded",
        "Board requests work, but live updates are unavailable on this connection.",
      );
    }
  }, 2500);
  const disposeSocket = socket("/ws", (message) => {
    if (typeof message !== "object" || message === null) return;
    const frame = message as { event?: unknown; payload?: unknown };
    if (frame.event === "boardstate.desktop.connected") {
      acknowledged = true;
      cancelAckTimeout();
      onStatus("live");
      // Socket events are lossy across a disconnect. An empty changed event bypasses
      // the version short-circuit and makes <boardstate-view> refetch the workspace.
      for (const listener of listeners.get("boardstate.changed") ?? []) listener({});
      return;
    }
    if (typeof frame.event !== "string") return;
    for (const listener of listeners.get(frame.event) ?? []) listener(frame.payload);
  });

  return {
    ready: Promise.resolve(),
    get closed() {
      return closed;
    },
    async request(method: string, params?: unknown): Promise<unknown> {
      if (closed) throw new Error("Boardstate transport is closed");
      const response = await rest<{ result?: unknown; error?: unknown }>("/rpc", {
        method: "POST",
        body: { method, params: params ?? {} },
      });
      if (response && response.error) throw new Error(String(response.error));
      return response?.result;
    },
    addEventListener(event, listener) {
      const bucket = listeners.get(event) ?? new Set();
      bucket.add(listener);
      listeners.set(event, bucket);
      return () => {
        bucket.delete(listener);
        if (!bucket.size) listeners.delete(event);
      };
    },
    close() {
      if (closed) return;
      closed = true;
      cancelAckTimeout();
      disposeSocket();
      listeners.clear();
    },
  };
}

function BoardPage({
  rest,
  socket,
  setTimer,
}: {
  rest: OperatorRest;
  socket: PluginSocket;
  setTimer: PluginTimer;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const transportRef = useRef<SdkTransport | undefined>(undefined);
  const [status, setStatus] = useState<DesktopStatus>("connecting");
  const [detail, setDetail] = useState("");
  const [applying, setApplying] = useState("");

  const applyTemplate = useCallback(async (name: string, doc: unknown) => {
    const transport = transportRef.current;
    if (!transport) return;
    if (!window.confirm(`Replace the current board with the "${name}" template?`)) return;
    setApplying(name);
    try {
      await transport.request("dashboard.workspace.replace", { doc, actor: "user" });
    } catch (err) {
      host.notify?.({ kind: "error", message: `Template failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setApplying("");
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let transport: SdkTransport | undefined;
    let view: ViewElement | undefined;
    let obs: MutationObserver | undefined;
    let errorSticky = false;
    const updateStatus = (next: DesktopStatus, message = "") => {
      if (next === "error") errorSticky = true;
      // A later successful connect (the socket acknowledgement) recovers the page without a
      // remount; until then an error is not overwritten by the degraded timer.
      if (next === "live") errorSticky = false;
      if (errorSticky && next !== "error") return;
      if (!disposed) {
        setStatus(next);
        setDetail(message);
      }
    };

    (async () => {
      const sendOperator = async (method: string, params: unknown): Promise<unknown> => {
        const res = await rest<{ result?: unknown; error?: unknown }>("/operator", {
          method: "POST",
          body: { method, params },
        });
        if (res?.error) throw new Error(String(res.error));
        return res?.result;
      };
      transport = withOperatorGate(
        createSdkTransport(rest, socket, setTimer, updateStatus),
        sendOperator,
      );
      transportRef.current = transport;
      view = document.createElement("boardstate-view") as ViewElement;
      view.transport = transport;
      view.connected = true;
      view.operator = true;
      // The desktop page runs on a file:// origin, so the custom-widget asset base must
      // be ABSOLUTE. The backend hands out a tokenized root-level base (iframes can't
      // carry auth headers); fetched here through the plugin's authed REST door. No
      // base ⇒ builtins-only, no errors.
      try {
        const ab = await rest<{ absoluteBase?: string }>("/assets-base", { method: "GET" });
        view.basePath = ab?.absoluteBase ?? "";
      } catch {
        view.basePath = "";
      }
      // The page may have unmounted while /assets-base was in flight; cleanup already ran,
      // so installing observers now would leak them.
      if (disposed) return;
      applyDesktopTheme(view);
      obs = new MutationObserver(() => view && applyDesktopTheme(view));
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
      obs.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
      view.style.display = "block";
      view.style.height = "100%";
      hostRef.current?.appendChild(view);
      await transport.request("dashboard.workspace.get", {});
      // Socket acknowledgement promotes this to "live". Until then the adapter's
      // timeout changes the state to the explicit OAuth/no-push degraded message.
    })().catch((error: unknown) => {
      updateStatus("error", error instanceof Error ? error.message : String(error));
    });

    return () => {
      disposed = true;
      obs?.disconnect();
      transportRef.current = undefined;
      try {
        transport?.close();
      } catch {
        /* already closed */
      }
      if (view && view.parentNode) view.parentNode.removeChild(view);
    };
  }, [rest, setTimer, socket]);

  const dotColor = status === "live" ? "var(--ui-green, #6aa84f)" : status === "error" ? "var(--ui-red, #e06c75)" : "var(--ui-yellow, #d0a94f)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
        <span style={{ opacity: 0.8 }}>
          {status === "live"
            ? "Board connected"
            : status === "degraded"
              ? detail
              : status === "error"
                ? `Board unavailable${detail ? `: ${detail}` : ""}`
                : "Connecting to board…"}
        </span>
        {status === "live" || status === "degraded" ? (
          <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginLeft: 8 }}>
            <span style={{ opacity: 0.7 }}>Templates:</span>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                title={tpl.summary}
                disabled={applying !== ""}
                onClick={() => applyTemplate(tpl.name, tpl.doc)}
                style={{
                  cursor: applying ? "default" : "pointer",
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--ui-stroke-secondary, #2a2a33)",
                  background: applying === tpl.id ? "var(--ui-row-active-background, #23232b)" : "transparent",
                  color: "inherit",
                  opacity: applying && applying !== tpl.name ? 0.5 : 1,
                }}
              >
                {applying === tpl.name ? "Applying…" : tpl.name}
              </button>
            ))}
          </span>
        ) : null}
      </div>
      <div ref={hostRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

export default {
  id: "boardstate",
  name: "Board",
  register(ctx: {
    register: (c: { id: string; area: unknown; data?: unknown; render?: () => unknown }) => void;
    rest: OperatorRest;
    socket: PluginSocket;
    // Scoped timers arrived after Hermes Desktop 0.21.x; older SDKs omit them.
    setTimeout?: PluginTimer;
    onDispose: (fn: () => void) => void;
  }) {
    ensureElements();
    const style = ensureCss();
    if (style) ctx.onDispose(() => style.remove());
    // Same contract as the SDK's scoped timer: cancelled on unload, and the returned
    // disposer cancels early.
    const setTimer: PluginTimer =
      typeof ctx.setTimeout === "function"
        ? ctx.setTimeout
        : (fn, ms) => {
            const id = globalThis.setTimeout(fn, ms);
            const cancel = () => globalThis.clearTimeout(id);
            ctx.onDispose(cancel);
            return cancel;
          };
    ctx.register({ id: "board-route", area: ROUTES_AREA, data: { path: "/board" }, render: () => <BoardPage rest={ctx.rest} socket={ctx.socket} setTimer={setTimer} /> });
    // …reachable from a sidebar nav row.
    ctx.register({ id: "board-nav", area: SIDEBAR_NAV_AREA, data: { path: "/board", label: "Board", codicon: "dashboard" } });
  },
};

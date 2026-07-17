// Boardstate dashboard tab for Hermes.
//
// A thin React component (host React from the Plugin SDK — never bundles its own)
// that mounts the real `<boardstate-view>` custom element and drives it over the
// networked WebSocket transport to the plugin's sidecar. The element definitions
// live in the vendored `@boardstate/lit/browser` bundle (loaded once as a static
// asset the host serves); `createWsTransport` (from `@boardstate/core`) is bundled
// into this file. React/react-dom are NOT bundled — everything comes from
// `window.__HERMES_PLUGIN_SDK__`.

import { createWsTransport, type WsTransport } from "@boardstate/core";
import { BS_TO_HERMES, aliasChain, themeBase } from "./theme";

const SDK = window.__HERMES_PLUGIN_SDK__!;
const React = SDK.React;

// Authenticated WS endpoint on the Hermes dashboard origin; the backend
// (`plugin_api.py`) bridges it to the loopback sidecar. `buildWsUrl` attaches the
// correct auth query param (loopback token / gated single-use ticket).
const WS_PATH = "/api/plugins/boardstate/ws";
// Static asset served by the host from `dashboard/vendor/` — registers
// `<boardstate-view>` and every built-in widget renderer.
const BUNDLE_URL = "/dashboard-plugins/boardstate/vendor/boardstate-browser.js";

// Load the element bundle exactly once, even across tab remounts.
let bundlePromise: Promise<unknown> | null = null;
function ensureBundle(): Promise<unknown> {
  if (!bundlePromise) {
    // Runtime dynamic import of a static URL — kept out of the esbuild graph so the
    // browser (not the bundler) fetches the vendored asset.
    const url = BUNDLE_URL;
    bundlePromise = import(/* @vite-ignore */ url).catch((err) => {
      bundlePromise = null;
      throw err;
    });
  }
  return bundlePromise;
}

type ViewElement = HTMLElement & {
  transport?: unknown;
  connected?: boolean;
  basePath?: string;
};

// ── Hermes theme adapter (DOM glue; pure mapping lives in ./theme) ───────────
// A var() alias re-resolves whenever Hermes rewrites its own tokens, so live
// palette swaps repaint the board with zero JS; only the light/dark base is
// computed here, from the host's painted background.
function applyHermesTheme(view: HTMLElement): void {
  const bodyBg = getComputedStyle(document.body).backgroundColor || "rgb(0,0,0)";
  view.setAttribute("data-theme", themeBase(bodyBg));
  for (const [bsVar, hermesVars] of Object.entries(BS_TO_HERMES)) {
    view.style.setProperty(bsVar, aliasChain(hermesVars));
  }
}

function observeHermesTheme(view: HTMLElement): () => void {
  // The var() aliases auto-follow token value changes; the observer only needs to
  // re-evaluate the light/dark base when a palette swap flips the background.
  const obs = new MutationObserver(() => applyHermesTheme(view));
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  obs.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
  return () => obs.disconnect();
}

function BoardPage() {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState<"connecting" | "live" | "error">("connecting");
  const [detail, setDetail] = React.useState<string>("");

  React.useEffect(() => {
    let disposed = false;
    let transport: WsTransport | undefined;
    let view: ViewElement | undefined;
    let disposeTheme: (() => void) | undefined;

    (async () => {
      try {
        await ensureBundle();
        const wsUrl = await SDK.buildWsUrl(WS_PATH);
        if (disposed) return;
        transport = createWsTransport(wsUrl);
        view = document.createElement("boardstate-view") as ViewElement;
        view.transport = transport;
        view.connected = true;
        // Built-in widgets resolve from the bundle; approved custom widgets would
        // resolve under the sidecar's own /widgets route (out of scope for v1).
        view.basePath = "";
        // Follow the active Hermes palette (light/dark base + `--bs-*` aliases)
        // and keep following it across live palette swaps.
        applyHermesTheme(view);
        disposeTheme = observeHermesTheme(view);
        view.style.display = "block";
        view.style.minHeight = "70vh";
        hostRef.current?.appendChild(view);
        transport.ready
          .then(() => {
            if (!disposed) setStatus("live");
          })
          .catch((err: unknown) => {
            if (!disposed) {
              setStatus("error");
              setDetail(err instanceof Error ? err.message : String(err));
            }
          });
      } catch (err) {
        if (!disposed) {
          setStatus("error");
          setDetail(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      disposed = true;
      disposeTheme?.();
      try {
        transport?.close();
      } catch {
        /* already closed */
      }
      if (view && view.parentNode) view.parentNode.removeChild(view);
    };
  }, []);

  const dot =
    status === "live" ? "#6aa84f" : status === "error" ? "#e06c75" : "#d0a94f";

  return React.createElement(
    "div",
    { className: "bs-plugin-root", style: { display: "flex", flexDirection: "column", gap: "8px" } },
    React.createElement(
      "div",
      {
        className: "bs-plugin-status",
        style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", opacity: 0.8 },
      },
      React.createElement("span", {
        style: {
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: dot,
          display: "inline-block",
        },
      }),
      React.createElement(
        "span",
        null,
        status === "live"
          ? "Board connected"
          : status === "error"
            ? `Board unavailable${detail ? `: ${detail}` : ""}`
            : "Connecting to board…",
      ),
    ),
    React.createElement("div", { ref: hostRef, className: "bs-view-host", style: { flex: 1 } }),
  );
}

// Register the tab component under the manifest name.
window.__HERMES_PLUGINS__!.register("boardstate", BoardPage as never);

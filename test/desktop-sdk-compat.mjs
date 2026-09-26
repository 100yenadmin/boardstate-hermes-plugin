// Runtime gate for the Desktop bundle (desktop/plugin.js) across Hermes Desktop SDK shapes.
//
// The plugin declares requires_hermes >=0.21.2. Hermes Desktop 0.21.x hands plugins a
// PluginContext WITHOUT scoped timers (no ctx.setTimeout / ctx.setInterval); upstream main
// added them later. A page that calls ctx.setTimeout unconditionally boots to
// "Board unavailable: … is not a function" on the older builds. This loads the BUILT bundle
// with a fake context shaped exactly like each SDK, mounts the Board route with a minimal
// hooks runtime, and checks that the page boots, that the socket-acknowledgement timer fires,
// and that it is cancelled by an acknowledgement, by page unmount, and by plugin unload.
//
// It also loads the vendored element bundle (dashboard/vendor/boardstate-browser.js, the same
// @boardstate/lit code the Desktop bundle inlines) and checks two widget renderers: a connected
// notes widget shows its agent-written `props.text` when no state is persisted, and markdown
// renders headings (including ATX closing sequences) and GFM task items.
//
// Run after `npm run build`:  node test/desktop-sdk-compat.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(here, "..", "desktop", "plugin.js");

let n = 0;
const failures = [];
const check = (name, cond) => {
  n++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}`);
  if (!cond) failures.push(name);
};

// ---- fake clock: the page's timers and the upstream SDK's scoped timers both use it ----
const timers = [];
let nextTimerId = 1;
globalThis.setTimeout = (fn, ms) => {
  const t = { id: nextTimerId++, fn, ms, cancelled: false, fired: false };
  timers.push(t);
  return t.id;
};
globalThis.clearTimeout = (id) => {
  const t = timers.find((x) => x.id === id);
  if (t) t.cancelled = true;
};
const pendingTimers = () => timers.filter((t) => !t.cancelled && !t.fired);
const fireTimers = () => {
  for (const t of pendingTimers()) {
    t.fired = true;
    t.fn();
  }
};
const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
};

// ---- minimal DOM: enough for the inlined Lit module and the page's own DOM calls ----
class FakeNode {
  constructor(tag = "") {
    this.tagName = tag.toUpperCase();
    this.attrs = new Map();
    this.children = [];
    this.parentNode = null;
    this.textContent = "";
    this.style = { setProperty() {}, removeProperty() {} };
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }
  getAttribute(k) {
    return this.attrs.has(k) ? this.attrs.get(k) : null;
  }
  removeAttribute(k) {
    this.attrs.delete(k);
  }
  appendChild(c) {
    c.parentNode = this;
    this.children.push(c);
    return c;
  }
  removeChild(c) {
    this.children = this.children.filter((x) => x !== c);
    c.parentNode = null;
    return c;
  }
  remove() {
    this.parentNode?.removeChild(this);
  }
  addEventListener() {}
  removeEventListener() {}
}
const registry = new Map();
const documentShim = {
  head: new FakeNode("head"),
  body: new FakeNode("body"),
  documentElement: new FakeNode("html"),
  createElement: (tag) => new FakeNode(tag),
  createComment: () => new FakeNode("#comment"),
  createTextNode: (text) => Object.assign(new FakeNode("#text"), { textContent: text }),
  createTreeWalker: () => ({ currentNode: null, nextNode: () => null }),
  importNode: (node) => node,
  querySelector: () => null,
  addEventListener() {},
  removeEventListener() {},
};
Object.assign(globalThis, {
  window: globalThis,
  document: documentShim,
  HTMLElement: class HTMLElement extends FakeNode {},
  HTMLTextAreaElement: class HTMLTextAreaElement extends FakeNode {
    constructor() {
      super("textarea");
      this.value = "";
      this.dataset = {};
    }
  },
  customElements: {
    get: (name) => registry.get(name),
    define: (name, ctor) => registry.set(name, ctor),
  },
  MutationObserver: class {
    observe() {}
    disconnect() {}
  },
  getComputedStyle: () => ({ backgroundColor: "rgb(20,20,20)", fontFamily: "system-ui" }),
  confirm: () => true,
});

// ---- minimal React hooks runtime (one component instance at a time) ----
let current = null;
const react = {
  useRef(init) {
    const i = current.idx++;
    if (!(i in current.slots)) current.slots[i] = { current: init };
    return current.slots[i];
  },
  useState(init) {
    const inst = current;
    const i = inst.idx++;
    if (!(i in inst.slots)) inst.slots[i] = init;
    return [inst.slots[i], (v) => (inst.slots[i] = typeof v === "function" ? v(inst.slots[i]) : v)];
  },
  useCallback: (fn) => (current.idx++, fn),
  useEffect(fn) {
    current.idx++;
    if (!current.mounted) current.effects.push(fn);
  },
};
const jsx = (type, props) => ({ type, props });
const textOf = (node) => {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return textOf(node.props?.children);
};
function mount(element) {
  const inst = { slots: {}, idx: 0, effects: [], cleanups: [], mounted: false };
  const render = () => {
    current = inst;
    inst.idx = 0;
    try {
      return element.type(element.props);
    } finally {
      current = null;
    }
  };
  render();
  inst.mounted = true;
  for (const effect of inst.effects) {
    const cleanup = effect();
    if (typeof cleanup === "function") inst.cleanups.push(cleanup);
  }
  return { text: () => textOf(render()), unmount: () => inst.cleanups.forEach((c) => c()) };
}

// ---- load the built bundle with its three externals resolved to the fakes above ----
globalThis.__bsDesktopTest = {
  sdk: { host: { notify() {} }, ROUTES_AREA: "routes", SIDEBAR_NAV_AREA: "sidebar.nav" },
  react,
  jsx,
};
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const externals = {
  "@hermes/plugin-sdk": stub(
    "const t=globalThis.__bsDesktopTest.sdk;export const host=t.host,ROUTES_AREA=t.ROUTES_AREA,SIDEBAR_NAV_AREA=t.SIDEBAR_NAV_AREA;",
  ),
  react: stub(
    "const r=globalThis.__bsDesktopTest.react;export const useRef=r.useRef,useState=r.useState,useCallback=r.useCallback,useEffect=r.useEffect;export default r;",
  ),
  "react/jsx-runtime": stub(
    "const j=globalThis.__bsDesktopTest.jsx;export const jsx=j,jsxs=j,Fragment=Symbol.for('fragment');",
  ),
};
let source = readFileSync(bundlePath, "utf8");
for (const [spec, url] of Object.entries(externals)) {
  source = source.replaceAll(`from"${spec}"`, `from"${url}"`);
}
const plugin = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;
check("bundle loads and default-exports a register()", typeof plugin?.register === "function");

// ---- fake PluginContexts, member-for-member with each SDK's createPluginContext ----
// Hermes Desktop 0.21.3 (apps/desktop/src/contrib/plugin.ts): no scoped timers.
const OLDER_SDK_KEYS = ["source", "register", "registerMany", "onDispose", "onEvent", "rest", "socket", "os", "storage", "i18n"];
function makeContext({ scopedTimers }) {
  const disposers = [];
  const track = (dispose) => {
    disposers.push(dispose);
    return dispose;
  };
  const contributions = [];
  const sockets = [];
  const restCalls = [];
  const ctx = {
    source: "plugin:boardstate",
    register: (c) => (contributions.push(c), track(() => {})),
    registerMany: (cs) => (contributions.push(...cs), track(() => {})),
    onDispose: (fn) => void track(fn),
    onEvent: () => track(() => {}),
    rest: async (path, opts) => {
      restCalls.push({ path, body: opts?.body });
      if (path === "/assets-base") return { absoluteBase: "" };
      if (path === "/rpc") return { result: { version: 1, tabs: [] } };
      return { result: null };
    },
    socket: (path, onMessage) => {
      const s = { path, onMessage, closed: false };
      sockets.push(s);
      return track(() => (s.closed = true));
    },
    os: {},
    storage: { get: (_k, fallback) => fallback, set() {}, remove() {} },
    i18n: {},
  };
  if (scopedTimers) {
    // Upstream main's createPluginLifetime(track): cleared on unload, disposer cancels early.
    const cleanups = new Set();
    track(() => {
      for (const cleanup of cleanups) cleanup();
      cleanups.clear();
    });
    const scoped = (cleanup) => {
      cleanups.add(cleanup);
      return () => {
        cleanups.delete(cleanup);
        cleanup();
      };
    };
    ctx.setTimeout = (fn, ms) => {
      const clear = () => globalThis.clearTimeout(id);
      const id = globalThis.setTimeout(() => {
        cleanups.delete(clear);
        fn();
      }, ms);
      return scoped(clear);
    };
    ctx.setInterval = () => scoped(() => {});
    ctx.addEventListener = () => scoped(() => {});
  }
  const unload = () => disposers.splice(0).forEach((d) => d());
  return { ctx, contributions, sockets, restCalls, unload };
}

const ACK = { event: "boardstate.desktop.connected" };
const DEGRADED = "live updates are unavailable";

async function bootBoard(shape) {
  const harness = makeContext(shape);
  plugin.register(harness.ctx);
  const route = harness.contributions.find((c) => c.id === "board-route");
  const page = mount(route.render());
  await flush();
  const timer = pendingTimers().find((t) => t.ms === 2500);
  return { ...harness, route, page, timer };
}

for (const [label, shape] of [
  ["older SDK (0.21.3, no ctx.setTimeout)", { scopedTimers: false }],
  ["upstream-main SDK (scoped ctx.setTimeout)", { scopedTimers: true }],
]) {
  timers.length = 0;

  // Boot: the route renders and connects without throwing.
  const a = await bootBoard(shape);
  if (!shape.scopedTimers) {
    check(`${label}: fake context has exactly the older SDK members`,
      JSON.stringify(Object.keys(a.ctx)) === JSON.stringify(OLDER_SDK_KEYS));
  } else {
    check(`${label}: fake context exposes scoped timers`, typeof a.ctx.setTimeout === "function");
  }
  check(`${label}: registers the /board route and sidebar nav`,
    !!a.route && a.contributions.some((c) => c.id === "board-nav"));
  const booted = a.page.text();
  check(`${label}: Board page boots (got "${booted}")`, !booted.includes("Board unavailable") && booted.includes("Connecting"));
  check(`${label}: fetches the workspace over ctx.rest`,
    a.restCalls.some((c) => c.path === "/rpc" && c.body?.method === "dashboard.workspace.get"));
  check(`${label}: opens the live socket through ctx.socket`, a.sockets.some((s) => s.path === "/ws"));
  check(`${label}: arms the acknowledgement timer`, !!a.timer);

  // No acknowledgement: the timer fires and the page reports the degraded state.
  fireTimers();
  check(`${label}: ack timer fires into the degraded state`, a.page.text().includes(DEGRADED));
  a.page.unmount();
  a.unload();

  // Acknowledgement cancels the timer.
  const b = await bootBoard(shape);
  b.sockets.find((s) => s.path === "/ws")?.onMessage(ACK);
  check(`${label}: acknowledgement cancels the ack timer`, !!b.timer && b.timer.cancelled && !b.timer.fired);
  check(`${label}: acknowledgement shows the board connected`, b.page.text().includes("Board connected"));
  b.page.unmount();
  b.unload();

  // An error (here: the first workspace read fails) recovers on the next successful
  // connect without a remount, and the degraded timer does not overwrite the error first.
  const failing = makeContext(shape);
  const okRest = failing.ctx.rest;
  failing.ctx.rest = async (path, opts) => {
    if (path === "/rpc") throw new Error("sidecar starting");
    return okRest(path, opts);
  };
  plugin.register(failing.ctx);
  const errored = mount(failing.contributions.find((c) => c.id === "board-route").render());
  await flush();
  check(`${label}: a failed first read shows the error`, errored.text().includes("Board unavailable: sidecar starting"));
  fireTimers();
  check(`${label}: the ack timer does not hide the error`, errored.text().includes("Board unavailable"));
  failing.sockets.find((s) => s.path === "/ws")?.onMessage(ACK);
  check(`${label}: the next successful connect recovers without a remount`, errored.text().includes("Board connected"));
  errored.unmount();
  failing.unload();

  // Page unmount cancels the timer.
  const c = await bootBoard(shape);
  c.page.unmount();
  check(`${label}: page unmount cancels the ack timer`, !!c.timer && c.timer.cancelled);
  c.unload();

  // Plugin unload (ctx disposers) cancels the timer even while the page is still mounted.
  const d = await bootBoard(shape);
  d.unload();
  check(`${label}: plugin unload cancels the ack timer`, !!d.timer && d.timer.cancelled);
  fireTimers();
  check(`${label}: a cancelled timer never reports degraded`, !d.page.text().includes(DEGRADED));
  d.page.unmount();
}

// ---- vendored @boardstate/lit renderers (notes seed, markdown) ----
const vendorPath = join(here, "..", "dashboard", "vendor", "boardstate-browser.js");
const lit = await import(
  `data:text/javascript;base64,${Buffer.from(readFileSync(vendorPath, "utf8")).toString("base64")}`
);
// A lit ref directive result carries its callback as the first directive value.
const findRefCallback = (value) => {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value.values) && typeof value.values[0] === "function" && value._$litDirective$) {
    return value.values[0];
  }
  for (const nested of value.values ?? []) {
    const found = findRefCallback(nested);
    if (found) return found;
  }
  return undefined;
};
const notesWidget = {
  id: "agent-note",
  kind: "builtin:notes",
  title: "Agent note",
  props: { text: "Written by the agent" },
};
const noPersistedState = { get: async () => ({ state: undefined }), set: async () => undefined };
const notesTemplate = lit.renderBuiltinWidget(notesWidget, undefined, { state: noPersistedState });
const bindPad = findRefCallback(notesTemplate);
const pad = new globalThis.HTMLTextAreaElement();
bindPad?.(pad);
await flush();
check(
  `connected notes widget shows props.text with no persisted state (got "${pad.value}")`,
  pad.value === "Written by the agent",
);
const md = lit.toSanitizedMarkdownHtml("## A\n- [x] b");
check(`markdown "## A" renders an <h2> (got ${md})`, /<h2>A<\/h2>/.test(md));
check(
  "markdown \"- [x] b\" renders a checked task glyph",
  /<li class="dashboard-markdown__task-item"><span class="dashboard-markdown__task"[^>]*aria-label="checked"[^>]*>☑<\/span> b<\/li>/.test(md),
);

const atx = lit.toSanitizedMarkdownHtml("## Roadmap ##");
check(`markdown ATX closing sequence is stripped (got ${atx})`, /<h2>Roadmap<\/h2>/.test(atx));

console.log(`\ndesktop-sdk-compat: ${n} checks`);
if (failures.length) {
  console.error(`${failures.length} failed: ${failures.join(", ")}`);
  process.exit(1);
}

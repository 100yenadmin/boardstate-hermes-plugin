var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// dashboard/sidecar/src/server.ts
import { createServer } from "node:http";

// ../boardstate.worktrees/net-transport/packages/schema/dist/index.js
var DATA_READ_RPC_ALLOWLIST = [
  "health",
  "system-presence",
  "usage.status",
  "usage.cost",
  "agents.list",
  "sessions.list",
  "sessions.resolve",
  "sessions.get",
  "sessions.usage",
  "sessions.usage.timeseries",
  "sessions.usage.logs",
  "node.list",
  "node.describe",
  "cron.get",
  "cron.list",
  "cron.status",
  "cron.runs"
];
var STREAM_EVENT_ALLOWLIST = [
  "presence",
  "sessions.changed",
  "boardstate.changed"
];
var COMPUTED_OPS = [
  "sum",
  "avg",
  "min",
  "max",
  "last",
  "count",
  "pick",
  "format"
];
var DashboardBindingResolutionError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "DashboardBindingResolutionError";
  }
};
function hasControlCharacter(value) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) return true;
  }
  return false;
}
function normalizeDashboardDataLogicalPath(value) {
  if (value.startsWith("/") || /^([a-zA-Z]:[\\/]|[\\/])/.test(value) || hasControlCharacter(value)) throw new DashboardBindingResolutionError("binding_invalid", "file binding path is invalid");
  const parts = value.replaceAll("\\", "/").split("/").filter(Boolean);
  if (parts.length === 0 || parts.some((part) => part === "." || part === ".." || part.includes(":"))) throw new DashboardBindingResolutionError("binding_invalid", "file binding path is invalid");
  return parts.join("/");
}
var TAB_SLUG_PATTERN = /^[a-z0-9-]{1,40}$/;
var ACTOR_PATTERN = /^(user|system|agent:[A-Za-z0-9._-]{1,64})$/;
var TAB_VISIBILITY_VALUES = /* @__PURE__ */ new Set(["shared", "private"]);
var TAB_OWNER_PATTERN = /^[A-Za-z0-9:._-]{1,128}$/;
var WIDGET_ID_PATTERN = /^[A-Za-z0-9_-]{1,48}$/;
var BUILTIN_KIND_PATTERN = /^builtin:(stat-card|markdown|table|iframe-embed|sessions|usage|cron|instances|activity|chart|notes|action-form|preview|agent-status|approvals|chat)$/;
var CUSTOM_KIND_PATTERN = /^custom:[A-Za-z0-9._-]{1,64}$/;
var CUSTOM_WIDGET_NAME_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
var BINDING_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
var MAX_STATIC_BINDING_BYTES = 8 * 1024;
var MAX_COMPUTED_INPUTS = 32;
var ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
var ACTION_FORM_FIELD_NAME_PATTERN = /^[A-Za-z0-9_]{1,32}$/;
var ACTION_FORM_SLOT_PATTERN = /\{([A-Za-z0-9_]+)\}/g;
var ACTION_FORM_MAX_TEMPLATE_CHARS = 2e3;
var ACTION_FORM_MAX_FIELDS = 8;
var ACTION_FORM_MAX_OPTIONS = 20;
var ACTION_FORM_MAX_FIELD_MAX_LENGTH = 1e3;
var ACTION_FORM_FIELD_TYPES = [
  "text",
  "number",
  "select"
];
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertRecord(value, path3) {
  if (!isRecord(value)) throw new Error(`${path3} must be an object`);
  return value;
}
function assertKnownKeys(record, allowed, path3) {
  for (const key of Object.keys(record)) if (!allowed.includes(key)) throw new Error(`${path3}.${key} is not allowed`);
}
function requireString(record, key, path3) {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${path3}.${key} must be a string`);
  return value;
}
function optionalString(record, key, path3) {
  const value = record[key];
  if (value === void 0) return;
  if (typeof value !== "string") throw new Error(`${path3}.${key} must be a string`);
  return value;
}
function requireBoolean(record, key, path3) {
  const value = record[key];
  if (typeof value !== "boolean") throw new Error(`${path3}.${key} must be a boolean`);
  return value;
}
function requireArray(value, path3) {
  if (!Array.isArray(value)) throw new Error(`${path3} must be an array`);
  return value;
}
function validateActor(value, path3) {
  if (typeof value !== "string" || !ACTOR_PATTERN.test(value)) throw new Error(`${path3} createdBy is invalid`);
  return value;
}
function isDashboardActor(value) {
  return typeof value === "string" && ACTOR_PATTERN.test(value);
}
function assertIntegerRange(value, path3, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${path3} must be an integer from ${min} to ${max}`);
  return value;
}
function validateGrid(value, path3) {
  const record = assertRecord(value, path3);
  assertKnownKeys(record, [
    "x",
    "y",
    "w",
    "h"
  ], path3);
  const grid = {
    x: assertIntegerRange(record.x, `${path3}.x`, 0, 11),
    y: assertIntegerRange(record.y, `${path3}.y`, 0, 499),
    w: assertIntegerRange(record.w, `${path3}.w`, 1, 12),
    h: assertIntegerRange(record.h, `${path3}.h`, 1, 20)
  };
  if (grid.x + grid.w > 12) throw new Error(`${path3}.x + w must be 12 or less`);
  return grid;
}
function assertJsonValue(value, path3) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((entry, index) => assertJsonValue(entry, `${path3}[${index}]`));
  if (isRecord(value)) {
    const next = {};
    for (const [key, entry] of Object.entries(value)) next[key] = assertJsonValue(entry, `${path3}.${key}`);
    return next;
  }
  throw new Error(`${path3} must be JSON-serializable`);
}
function serializedBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}
function validateBinding(value, path3) {
  const record = assertRecord(value, path3);
  const source = requireString(record, "source", path3);
  if (source === "rpc") {
    assertKnownKeys(record, ["source", "method"], path3);
    const method = requireString(record, "method", path3);
    if (!DATA_READ_RPC_ALLOWLIST.includes(method)) throw new Error(`${path3}.method is not allowlisted`);
    return {
      source,
      method
    };
  }
  if (source === "file") {
    assertKnownKeys(record, [
      "source",
      "path",
      "pointer"
    ], path3);
    const bindingPath = requireString(record, "path", path3);
    normalizeDashboardDataLogicalPath(bindingPath);
    const pointer = optionalString(record, "pointer", path3);
    return {
      source,
      path: bindingPath,
      ...pointer !== void 0 ? { pointer } : {}
    };
  }
  if (source === "static") {
    assertKnownKeys(record, ["source", "value"], path3);
    const jsonValue = assertJsonValue(record.value, `${path3}.value`);
    if (serializedBytes(jsonValue) > MAX_STATIC_BINDING_BYTES) throw new Error(`${path3}.value must serialize to 8 KB or less`);
    return {
      source,
      value: jsonValue
    };
  }
  if (source === "stream") {
    assertKnownKeys(record, [
      "source",
      "event",
      "pointer"
    ], path3);
    const event = requireString(record, "event", path3);
    if (!STREAM_EVENT_ALLOWLIST.includes(event)) throw new Error(`${path3}.event is not allowlisted`);
    const pointer = optionalString(record, "pointer", path3);
    if (pointer !== void 0 && !pointer.startsWith("/")) throw new Error(`${path3}.pointer must be a JSON pointer`);
    return {
      source,
      event,
      ...pointer !== void 0 ? { pointer } : {}
    };
  }
  if (source === "computed") {
    assertKnownKeys(record, [
      "source",
      "op",
      "inputs",
      "arg"
    ], path3);
    const op = requireString(record, "op", path3);
    if (!COMPUTED_OPS.includes(op)) throw new Error(`${path3}.op is not a valid computed op`);
    const rawInputs = requireArray(record.inputs, `${path3}.inputs`);
    if (rawInputs.length < 1 || rawInputs.length > MAX_COMPUTED_INPUTS) throw new Error(`${path3}.inputs must contain 1 to ${MAX_COMPUTED_INPUTS} entries`);
    const inputs = rawInputs.map((entry, index) => {
      if (typeof entry !== "string" || !BINDING_ID_PATTERN.test(entry)) throw new Error(`${path3}.inputs[${index}] is invalid`);
      return entry;
    });
    const needsArg = op === "pick" || op === "format";
    const arg = optionalString(record, "arg", path3);
    if (needsArg && (arg === void 0 || arg.length === 0)) throw new Error(`${path3}.arg is required for the ${op} op`);
    if (!needsArg && arg !== void 0) throw new Error(`${path3}.arg is not allowed for the ${op} op`);
    if (op === "pick" && arg !== void 0 && !arg.startsWith("/")) throw new Error(`${path3}.arg must be a JSON pointer for the pick op`);
    return {
      source,
      op,
      inputs,
      ...arg !== void 0 ? { arg } : {}
    };
  }
  throw new Error(`${path3}.source is invalid`);
}
function validateBindingRecord(value, path3) {
  const record = assertRecord(value, path3);
  const bindings = {};
  for (const [key, entry] of Object.entries(record)) {
    if (!BINDING_ID_PATTERN.test(key)) throw new Error(`${path3}.${key} binding id is invalid`);
    bindings[key] = validateBinding(entry, `${path3}.${key}`);
  }
  for (const [key, binding] of Object.entries(bindings)) {
    if (binding.source !== "computed") continue;
    for (const input of binding.inputs) {
      const target = bindings[input];
      if (!target) throw new Error(`${path3}.${key}.inputs references unknown binding: ${input}`);
      if (target.source === "computed") throw new Error(`${path3}.${key}.inputs may not reference another computed binding: ${input}`);
    }
  }
  return bindings;
}
function validateEphemeral(value, path3) {
  const record = assertRecord(value, path3);
  assertKnownKeys(record, ["expiresAt"], path3);
  const expiresAt = requireString(record, "expiresAt", path3);
  if (!ISO_TIMESTAMP_PATTERN.test(expiresAt) || Number.isNaN(Date.parse(expiresAt))) throw new Error(`${path3}.expiresAt must be an ISO 8601 timestamp`);
  return { expiresAt };
}
function validateActionFormProps(value, path3) {
  const record = assertRecord(value, path3);
  assertKnownKeys(record, [
    "template",
    "fields",
    "buttonLabel"
  ], path3);
  const template = requireString(record, "template", path3);
  if (template.length < 1 || template.length > ACTION_FORM_MAX_TEMPLATE_CHARS) throw new Error(`${path3}.template must be 1-${ACTION_FORM_MAX_TEMPLATE_CHARS} characters`);
  const fields = requireArray(record.fields, `${path3}.fields`);
  if (fields.length < 1 || fields.length > ACTION_FORM_MAX_FIELDS) throw new Error(`${path3}.fields must contain 1 to ${ACTION_FORM_MAX_FIELDS} entries`);
  const names = /* @__PURE__ */ new Set();
  fields.forEach((field, index) => {
    const fieldPath = `${path3}.fields[${index}]`;
    const fieldRecord = assertRecord(field, fieldPath);
    assertKnownKeys(fieldRecord, [
      "name",
      "label",
      "type",
      "options",
      "maxLength"
    ], fieldPath);
    const name = requireString(fieldRecord, "name", fieldPath);
    if (!ACTION_FORM_FIELD_NAME_PATTERN.test(name)) throw new Error(`${fieldPath}.name is invalid`);
    if (names.has(name)) throw new Error(`${fieldPath}.name is a duplicate: ${name}`);
    names.add(name);
    const label = requireString(fieldRecord, "label", fieldPath);
    if (label.length < 1 || label.length > 80) throw new Error(`${fieldPath}.label must be 1-80 characters`);
    const type = requireString(fieldRecord, "type", fieldPath);
    if (!ACTION_FORM_FIELD_TYPES.includes(type)) throw new Error(`${fieldPath}.type must be text, number, or select`);
    if (type === "select") {
      const options = requireArray(fieldRecord.options, `${fieldPath}.options`);
      if (options.length < 1 || options.length > ACTION_FORM_MAX_OPTIONS) throw new Error(`${fieldPath}.options must contain 1 to ${ACTION_FORM_MAX_OPTIONS} entries`);
      options.forEach((option, optionIndex) => {
        if (typeof option !== "string" || option.length < 1 || option.length > 80) throw new Error(`${fieldPath}.options[${optionIndex}] must be a 1-80 character string`);
      });
    } else if (fieldRecord.options !== void 0) throw new Error(`${fieldPath}.options is only allowed for select fields`);
    if (fieldRecord.maxLength !== void 0) assertIntegerRange(fieldRecord.maxLength, `${fieldPath}.maxLength`, 1, ACTION_FORM_MAX_FIELD_MAX_LENGTH);
  });
  if (record.buttonLabel !== void 0) {
    const buttonLabel = requireString(record, "buttonLabel", path3);
    if (buttonLabel.length < 1 || buttonLabel.length > 40) throw new Error(`${path3}.buttonLabel must be 1-40 characters`);
  }
  for (const match of template.matchAll(ACTION_FORM_SLOT_PATTERN)) {
    const slot = match[1];
    if (!names.has(slot)) throw new Error(`${path3}.template references unknown field: {${slot}}`);
  }
}
function validateWidget(value, path3) {
  const record = assertRecord(value, path3);
  assertKnownKeys(record, [
    "id",
    "kind",
    "title",
    "grid",
    "collapsed",
    "hidden",
    "bindings",
    "props",
    "ephemeral"
  ], path3);
  const id = requireString(record, "id", path3);
  if (!WIDGET_ID_PATTERN.test(id)) throw new Error(`${path3}.id is invalid`);
  const kind = requireString(record, "kind", path3);
  if (!BUILTIN_KIND_PATTERN.test(kind) && !CUSTOM_KIND_PATTERN.test(kind)) throw new Error(`${path3}.kind is invalid`);
  const title = optionalString(record, "title", path3);
  if (title !== void 0 && title.length > 80) throw new Error(`${path3}.title must be 80 characters or fewer`);
  const bindings = record.bindings === void 0 ? void 0 : validateBindingRecord(record.bindings, `${path3}.bindings`);
  const props = record.props === void 0 ? void 0 : assertJsonValue(record.props, `${path3}.props`);
  const ephemeral = record.ephemeral === void 0 ? void 0 : validateEphemeral(record.ephemeral, `${path3}.ephemeral`);
  if (kind === "builtin:action-form") validateActionFormProps(props, `${path3}.props`);
  return {
    id,
    kind,
    ...title !== void 0 ? { title } : {},
    grid: validateGrid(record.grid, `${path3}.grid`),
    collapsed: requireBoolean(record, "collapsed", path3),
    hidden: requireBoolean(record, "hidden", path3),
    ...bindings !== void 0 ? { bindings } : {},
    ...props !== void 0 ? { props } : {},
    ...ephemeral !== void 0 ? { ephemeral } : {}
  };
}
function validateTabLayout(value, path3) {
  if (value === void 0) return;
  if (value !== "grid" && value !== "full") throw new Error(`${path3}.layout must be "grid" or "full"`);
  return value;
}
function validateVisibility(value, path3) {
  if (value === void 0) return;
  if (typeof value !== "string" || !TAB_VISIBILITY_VALUES.has(value)) throw new Error(`${path3}.visibility must be "shared" or "private"`);
  return value;
}
function validateTab(value, path3) {
  const record = assertRecord(value, path3);
  assertKnownKeys(record, [
    "slug",
    "title",
    "icon",
    "hidden",
    "layout",
    "createdBy",
    "visibility",
    "owner",
    "widgets"
  ], path3);
  const slug = requireString(record, "slug", path3);
  if (!TAB_SLUG_PATTERN.test(slug)) throw new Error(`${path3}.slug is invalid`);
  const title = requireString(record, "title", path3);
  if (title.length < 1 || title.length > 80) throw new Error(`${path3}.title must be 1-80 characters`);
  const icon = optionalString(record, "icon", path3);
  if (icon !== void 0 && icon.length > 40) throw new Error(`${path3}.icon must be 40 characters or fewer`);
  const layout = validateTabLayout(record.layout, path3);
  const visibility = validateVisibility(record.visibility, path3);
  const owner = optionalString(record, "owner", path3);
  if (owner !== void 0 && !TAB_OWNER_PATTERN.test(owner)) throw new Error(`${path3}.owner is invalid`);
  if (visibility === "private" && owner === void 0) throw new Error(`${path3}.owner is required when the tab is private`);
  const widgets = requireArray(record.widgets, `${path3}.widgets`);
  if (widgets.length > 24) throw new Error(`${path3}.widgets must contain at most 24 entries`);
  return {
    slug,
    title,
    ...icon !== void 0 ? { icon } : {},
    hidden: requireBoolean(record, "hidden", path3),
    ...layout !== void 0 ? { layout } : {},
    createdBy: validateActor(record.createdBy, `${path3}.createdBy`),
    ...visibility === "private" ? { visibility } : {},
    ...owner !== void 0 ? { owner } : {},
    widgets: widgets.map((widget, index) => validateWidget(widget, `${path3}.widgets[${index}]`))
  };
}
function validateRegistryEntry(value, path3) {
  const record = assertRecord(value, path3);
  assertKnownKeys(record, [
    "status",
    "createdBy",
    "approvedBy",
    "approvedAt"
  ], path3);
  const status = requireString(record, "status", path3);
  if (status !== "pending" && status !== "approved" && status !== "rejected") throw new Error(`${path3}.status is invalid`);
  const approvedBy = record.approvedBy === void 0 ? void 0 : validateActor(record.approvedBy, `${path3}.approvedBy`);
  const approvedAt = optionalString(record, "approvedAt", path3);
  return {
    status,
    createdBy: validateActor(record.createdBy, `${path3}.createdBy`),
    ...approvedBy !== void 0 ? { approvedBy } : {},
    ...approvedAt !== void 0 ? { approvedAt } : {}
  };
}
function validateWidgetsRegistry(value) {
  const record = assertRecord(value, "widgetsRegistry");
  const registry = {};
  for (const [name, entry] of Object.entries(record)) {
    if (!CUSTOM_WIDGET_NAME_PATTERN.test(name)) throw new Error(`widgetsRegistry.${name} name is invalid`);
    registry[name] = validateRegistryEntry(entry, `widgetsRegistry.${name}`);
  }
  return registry;
}
function validatePrefs(value, tabSlugs) {
  const record = assertRecord(value, "prefs");
  assertKnownKeys(record, ["tabOrder"], "prefs");
  const tabOrder = requireArray(record.tabOrder, "prefs.tabOrder");
  const seen = /* @__PURE__ */ new Set();
  return { tabOrder: tabOrder.map((entry, index) => {
    if (typeof entry !== "string" || !TAB_SLUG_PATTERN.test(entry)) throw new Error(`prefs.tabOrder[${index}] is invalid`);
    if (!tabSlugs.has(entry)) throw new Error(`prefs.tabOrder[${index}] is not a tab slug`);
    if (seen.has(entry)) throw new Error(`prefs.tabOrder contains duplicate slug: ${entry}`);
    seen.add(entry);
    return entry;
  }) };
}
function assertUniqueTabs(tabs) {
  const slugs = /* @__PURE__ */ new Set();
  for (const tab of tabs) {
    if (slugs.has(tab.slug)) throw new Error(`duplicate tab slug: ${tab.slug}`);
    slugs.add(tab.slug);
  }
  return slugs;
}
function assertUniqueWidgets(tabs) {
  const ids = /* @__PURE__ */ new Set();
  for (const tab of tabs) for (const widget of tab.widgets) {
    if (ids.has(widget.id)) throw new Error(`duplicate widget id: ${widget.id}`);
    ids.add(widget.id);
  }
}
function validateWorkspaceDoc(value) {
  const record = assertRecord(value, "workspace");
  assertKnownKeys(record, [
    "schemaVersion",
    "workspaceVersion",
    "tabs",
    "widgetsRegistry",
    "prefs"
  ], "workspace");
  if (record.schemaVersion !== 1) throw new Error(`schemaVersion must be 1`);
  const workspaceVersion = assertIntegerRange(record.workspaceVersion, "workspaceVersion", 0, Number.MAX_SAFE_INTEGER);
  const rawTabs = requireArray(record.tabs, "tabs");
  if (rawTabs.length > 32) throw new Error("tabs must contain at most 32 entries");
  const tabs = rawTabs.map((tab, index) => validateTab(tab, `tabs[${index}]`));
  const tabSlugs = assertUniqueTabs(tabs);
  assertUniqueWidgets(tabs);
  return {
    schemaVersion: 1,
    workspaceVersion,
    tabs,
    widgetsRegistry: validateWidgetsRegistry(record.widgetsRegistry),
    prefs: validatePrefs(record.prefs, tabSlugs)
  };
}
function migrateWorkspaceDoc(value) {
  const record = assertRecord(value, "workspace");
  const schemaVersion = record.schemaVersion;
  if (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion)) throw new Error("schemaVersion must be an integer");
  if (schemaVersion > 1) throw new Error(`unsupported future workspace schemaVersion: ${schemaVersion}`);
  if (schemaVersion < 1) throw new Error(`unsupported old workspace schemaVersion: ${schemaVersion}`);
  return {
    doc: validateWorkspaceDoc(record),
    changed: false
  };
}
var DEFAULT_DASHBOARD_WORKSPACE = {
  schemaVersion: 1,
  workspaceVersion: 1,
  tabs: [{
    slug: "main",
    title: "Overview",
    icon: "layoutDashboard",
    hidden: false,
    createdBy: "system",
    widgets: [
      {
        id: "cost-today",
        kind: "builtin:stat-card",
        title: "Cost Today",
        grid: {
          x: 0,
          y: 0,
          w: 4,
          h: 2
        },
        collapsed: false,
        hidden: false,
        bindings: { value: {
          source: "rpc",
          method: "usage.cost"
        } },
        props: {
          metric: "todayCost",
          format: "usd"
        }
      },
      {
        id: "tokens-today",
        kind: "builtin:stat-card",
        title: "Tokens Today",
        grid: {
          x: 4,
          y: 0,
          w: 4,
          h: 2
        },
        collapsed: false,
        hidden: false,
        bindings: { value: {
          source: "rpc",
          method: "usage.cost"
        } },
        props: {
          metric: "todayTokens",
          format: "int"
        }
      },
      {
        id: "instances-health",
        kind: "builtin:instances",
        title: "Instances",
        grid: {
          x: 8,
          y: 0,
          w: 4,
          h: 2
        },
        collapsed: false,
        hidden: false,
        bindings: { presence: {
          source: "rpc",
          method: "system-presence"
        } }
      },
      {
        id: "sessions",
        kind: "builtin:sessions",
        title: "Sessions",
        grid: {
          x: 0,
          y: 2,
          w: 6,
          h: 5
        },
        collapsed: false,
        hidden: false,
        bindings: { sessions: {
          source: "rpc",
          method: "sessions.list"
        } }
      },
      {
        id: "cron",
        kind: "builtin:cron",
        title: "Cron",
        grid: {
          x: 6,
          y: 2,
          w: 6,
          h: 5
        },
        collapsed: false,
        hidden: false,
        bindings: { jobs: {
          source: "rpc",
          method: "cron.list"
        } }
      },
      {
        id: "activity",
        kind: "builtin:activity",
        title: "Activity",
        grid: {
          x: 0,
          y: 7,
          w: 12,
          h: 8
        },
        collapsed: false,
        hidden: false,
        bindings: { runs: {
          source: "rpc",
          method: "cron.runs"
        } }
      }
    ]
  }],
  widgetsRegistry: {},
  prefs: { tabOrder: ["main"] }
};
var CHAT_EVENT = "boardstate.chat.event";

// ../boardstate.worktrees/net-transport/packages/core/dist/manifest-CKhA7ygv.js
function isRecord$1(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readBinding(value) {
  if (!isRecord$1(value) || typeof value.source !== "string") throw new DashboardBindingResolutionError("binding_invalid", "binding source is required");
  if (value.source === "static") return {
    source: "static",
    value: value.value
  };
  if (value.source === "rpc") {
    if (typeof value.method !== "string" || !value.method.trim()) throw new DashboardBindingResolutionError("binding_invalid", "rpc binding method is required");
    return {
      source: "rpc",
      method: value.method
    };
  }
  if (value.source === "file") {
    if (typeof value.path !== "string") throw new DashboardBindingResolutionError("binding_invalid", "file binding path is required");
    if (value.pointer !== void 0 && typeof value.pointer !== "string") throw new DashboardBindingResolutionError("binding_invalid", "file binding pointer is invalid");
    return {
      source: "file",
      path: value.path,
      ...value.pointer !== void 0 ? { pointer: value.pointer } : {}
    };
  }
  if (value.source === "stream") {
    if (typeof value.event !== "string" || !value.event.trim()) throw new DashboardBindingResolutionError("binding_invalid", "stream binding event is required");
    return {
      source: "stream",
      event: value.event,
      ...typeof value.pointer === "string" ? { pointer: value.pointer } : {}
    };
  }
  if (value.source === "computed") {
    if (typeof value.op !== "string") throw new DashboardBindingResolutionError("binding_invalid", "computed binding op is required");
    if (!Array.isArray(value.inputs)) throw new DashboardBindingResolutionError("binding_invalid", "computed binding inputs are required");
    return {
      source: "computed",
      op: value.op,
      inputs: value.inputs,
      ...typeof value.arg === "string" ? { arg: value.arg } : {}
    };
  }
  throw new DashboardBindingResolutionError("binding_invalid", "binding source is invalid");
}
function decodePointerSegment(value) {
  return value.replaceAll("~1", "/").replaceAll("~0", "~");
}
function applyJsonPointer(value, pointer) {
  if (pointer === void 0 || pointer === "") return value;
  if (!pointer.startsWith("/")) throw new DashboardBindingResolutionError("binding_invalid", "JSON pointer is invalid");
  let current = value;
  for (const rawSegment of pointer.slice(1).split("/")) {
    const segment = decodePointerSegment(rawSegment);
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) throw new DashboardBindingResolutionError("binding_not_found", "JSON pointer not found");
      current = current[index];
      continue;
    }
    if (!isRecord$1(current) || !Object.hasOwn(current, segment)) throw new DashboardBindingResolutionError("binding_not_found", "JSON pointer not found");
    current = current[segment];
  }
  return current;
}
async function resolveBinding(bindingInput, options = {}) {
  const binding = readBinding(bindingInput);
  if (binding.source === "static") return binding.value;
  if (binding.source === "rpc") throw new DashboardBindingResolutionError("binding_client_resolved", "rpc dashboard bindings are resolved by the Control UI gateway client");
  if (binding.source === "stream" || binding.source === "computed") throw new DashboardBindingResolutionError("binding_client_resolved", `${binding.source} dashboard bindings are resolved by the Control UI client`);
  if (!options.resolveFile) throw new DashboardBindingResolutionError("binding_client_resolved", "file dashboard bindings require the node host (@boardstate/core/node)");
  return await options.resolveFile(binding, options);
}
var CUSTOM_WIDGET_NAME_PATTERN2 = /^[A-Za-z0-9._-]{1,64}$/;
var BINDING_ID_PATTERN2 = /^[A-Za-z0-9._-]{1,64}$/;
var WIDGET_CAPABILITIES = [
  "data:read",
  "prompt:send",
  "state:persist"
];
var MANIFEST_MAX_BYTES = 32 * 1024;
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertRecord2(value, at) {
  if (!isRecord2(value)) throw new Error(`${at} must be an object`);
  return value;
}
function assertKnownKeys2(record, allowed, at) {
  for (const key of Object.keys(record)) if (!allowed.includes(key)) throw new Error(`${at}.${key} is not allowed`);
}
function requireString2(record, key, at) {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${at}.${key} must be a string`);
  return value;
}
function optionalString2(record, key, at) {
  const value = record[key];
  if (value === void 0) return;
  if (typeof value !== "string") throw new Error(`${at}.${key} must be a string`);
  return value;
}
function assertIntegerRange2(value, at, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${at} must be an integer from ${min} to ${max}`);
  return value;
}
function validateBinding2(value, at) {
  const record = assertRecord2(value, at);
  const id = requireString2(record, "id", at);
  if (!BINDING_ID_PATTERN2.test(id)) throw new Error(`${at}.id is invalid`);
  const source = requireString2(record, "source", at);
  if (source === "rpc") {
    assertKnownKeys2(record, [
      "id",
      "source",
      "method"
    ], at);
    const method = requireString2(record, "method", at);
    if (!DATA_READ_RPC_ALLOWLIST.includes(method)) throw new Error(`${at}.method is not allowlisted`);
    return {
      id,
      source,
      method
    };
  }
  if (source === "file") {
    assertKnownKeys2(record, [
      "id",
      "source",
      "path",
      "pointer"
    ], at);
    const bindingPath = requireString2(record, "path", at);
    normalizeDashboardDataLogicalPath(bindingPath);
    const pointer = optionalString2(record, "pointer", at);
    return {
      id,
      source,
      path: bindingPath,
      ...pointer !== void 0 ? { pointer } : {}
    };
  }
  if (source === "static") {
    assertKnownKeys2(record, [
      "id",
      "source",
      "value"
    ], at);
    return {
      id,
      source,
      value: record.value
    };
  }
  throw new Error(`${at}.source is invalid`);
}
function validateCapabilities(value) {
  if (value === void 0) return [];
  if (!Array.isArray(value)) throw new Error("capabilities must be an array");
  const seen = /* @__PURE__ */ new Set();
  for (const entry of value) {
    if (typeof entry !== "string" || !WIDGET_CAPABILITIES.includes(entry)) throw new Error(`capability is invalid: ${String(entry)}`);
    seen.add(entry);
  }
  return [...seen];
}
function validateWidgetManifest(value, expectedName) {
  const record = assertRecord2(value, "widget.json");
  assertKnownKeys2(record, [
    "schemaVersion",
    "name",
    "title",
    "entrypoint",
    "bindings",
    "capabilities",
    "preferredSize"
  ], "widget.json");
  if (record.schemaVersion !== 1) throw new Error("widget.json schemaVersion must be 1");
  const name = requireString2(record, "name", "widget.json");
  if (!CUSTOM_WIDGET_NAME_PATTERN2.test(name)) throw new Error("widget.json name is invalid");
  if (expectedName !== void 0 && name !== expectedName) throw new Error("widget.json name does not match its directory");
  const title = requireString2(record, "title", "widget.json");
  if (title.length < 1 || title.length > 80) throw new Error("widget.json title must be 1-80 characters");
  const entrypoint = requireString2(record, "entrypoint", "widget.json");
  normalizeDashboardDataLogicalPath(entrypoint);
  const rawBindings = record.bindings;
  if (!Array.isArray(rawBindings)) throw new Error("widget.json bindings must be an array");
  if (rawBindings.length > 32) throw new Error("widget.json bindings must contain at most 32 entries");
  const bindings = rawBindings.map((binding, index) => validateBinding2(binding, `widget.json.bindings[${index}]`));
  const ids = /* @__PURE__ */ new Set();
  for (const binding of bindings) {
    if (ids.has(binding.id)) throw new Error(`widget.json duplicate binding id: ${binding.id}`);
    ids.add(binding.id);
  }
  const capabilities = validateCapabilities(record.capabilities);
  const preferredSize = record.preferredSize === void 0 ? void 0 : (() => {
    const size = assertRecord2(record.preferredSize, "widget.json.preferredSize");
    assertKnownKeys2(size, ["w", "h"], "widget.json.preferredSize");
    return {
      w: assertIntegerRange2(size.w, "widget.json.preferredSize.w", 1, 12),
      h: assertIntegerRange2(size.h, "widget.json.preferredSize.h", 1, 20)
    };
  })();
  return {
    schemaVersion: 1,
    name,
    title,
    entrypoint,
    bindings,
    capabilities,
    ...preferredSize !== void 0 ? { preferredSize } : {}
  };
}

// ../boardstate.worktrees/net-transport/packages/core/dist/index.js
function joinLogical(...segments) {
  return segments.filter((segment) => segment.length > 0).join("/").replace(/\/{2,}/g, "/");
}
var MAX_WORKSPACE_BYTES = 256 * 1024;
var UNDO_RING_SIZE = 20;
var MAX_WIDGET_STATE_BYTES = 64 * 1024;
var WIDGET_ID_PATTERN2 = /^[A-Za-z0-9_-]{1,48}$/;
function utf8ByteLength(value) {
  return new TextEncoder().encode(value).length;
}
function serializeWorkspaceDoc(doc) {
  return `${JSON.stringify(doc, null, 2)}
`;
}
function reconcileReplaceApproval(incoming, current) {
  const currentRegistry = current.widgetsRegistry ?? {};
  const incomingRegistry = incoming.widgetsRegistry ?? {};
  for (const [name, entry] of Object.entries(incomingRegistry)) if (entry.status === "approved" && currentRegistry[name]?.status !== "approved") {
    entry.status = "pending";
    delete entry.approvedBy;
    delete entry.approvedAt;
  }
  return incoming;
}
function assertWorkspaceSize(serialized) {
  if (utf8ByteLength(serialized) > MAX_WORKSPACE_BYTES) throw new Error("workspace document exceeds 256 KB");
}
function isRecord$5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validateWidgetStateRecord(value) {
  if (!isRecord$5(value)) throw new Error("widget state file is malformed");
  return {
    version: typeof value.version === "number" && Number.isInteger(value.version) && value.version >= 0 ? value.version : 0,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    blob: value.blob ?? null
  };
}
function sweepExpiredEphemeral(doc, nowMs) {
  let removed = false;
  const tabs = doc.tabs.map((tab) => {
    const widgets = tab.widgets.filter((widget) => {
      const expiresAt = widget.ephemeral?.expiresAt;
      if (expiresAt === void 0) return true;
      const expiry = Date.parse(expiresAt);
      if (Number.isNaN(expiry) || expiry > nowMs) return true;
      removed = true;
      return false;
    });
    return widgets.length === tab.widgets.length ? tab : {
      ...tab,
      widgets
    };
  });
  if (!removed) return null;
  return {
    ...doc,
    tabs,
    workspaceVersion: doc.workspaceVersion + 1
  };
}
var DashboardStore = class {
  stateDir;
  dashboardDir;
  workspacePath;
  undoDir;
  widgetStateDir;
  storage;
  now;
  queue = Promise.resolve();
  constructor(options) {
    this.storage = options.storage;
    this.stateDir = this.storage.storageDir();
    this.dashboardDir = joinLogical(this.stateDir, "dashboard");
    this.workspacePath = joinLogical(this.dashboardDir, "workspace.json");
    this.undoDir = joinLogical(this.dashboardDir, "undo");
    this.widgetStateDir = joinLogical(this.dashboardDir, "state");
    this.now = options.now ?? (() => Date.now());
  }
  async readJsonFile(filePath) {
    const raw = await this.storage.readFile(filePath);
    if (raw === null) return;
    return JSON.parse(raw);
  }
  async read() {
    const raw = await this.readJsonFile(this.workspacePath);
    if (raw === void 0) {
      const seeded = validateWorkspaceDoc(structuredClone(DEFAULT_DASHBOARD_WORKSPACE));
      await this.writeWorkspaceDoc(seeded);
      return seeded;
    }
    const migrated = migrateWorkspaceDoc(raw);
    let doc = migrated.doc;
    let mustWrite = migrated.changed;
    const swept = sweepExpiredEphemeral(doc, this.now());
    if (swept) {
      doc = swept;
      mustWrite = true;
    }
    if (mustWrite) await this.writeWorkspaceDoc(doc);
    return doc;
  }
  async mutate(fn, _options) {
    return await this.runExclusive(async () => {
      const current = await this.read();
      const draft = structuredClone(current);
      const returned = await fn(draft);
      const candidate = returned === void 0 ? draft : returned;
      candidate.workspaceVersion = current.workspaceVersion + 1;
      const next = validateWorkspaceDoc(candidate);
      const serialized = serializeWorkspaceDoc(next);
      assertWorkspaceSize(serialized);
      await this.writeUndoSnapshot(current, next.workspaceVersion);
      await this.writeWorkspaceSerialized(serialized);
      return {
        doc: next,
        changed: true
      };
    });
  }
  async replace(doc, options) {
    return await this.mutate(() => structuredClone(doc), options);
  }
  /**
  * Like `replace`, but enforces the approval invariant (SPEC §8.2) against the
  * CURRENT document, inside the write lock (no TOCTOU): a caller-supplied doc can
  * never ELEVATE a custom widget to `approved`. Every UNTRUSTED entry point (the
  * `dashboard.workspace.replace` RPC, imports) MUST use this; `replace` itself
  * stays a trusted primitive for seeding, restore, and undo.
  */
  async replaceSanitized(doc, options) {
    return await this.mutate((current) => reconcileReplaceApproval(structuredClone(doc), current), options);
  }
  async undo() {
    return await this.runExclusive(async () => {
      const newest = (await this.listUndoFiles()).at(-1);
      if (!newest) throw new Error("no dashboard undo snapshot available");
      const snapshotPath = joinLogical(this.undoDir, newest);
      const snapshot = validateWorkspaceDoc(await this.readJsonFile(snapshotPath));
      const serialized = serializeWorkspaceDoc(snapshot);
      assertWorkspaceSize(serialized);
      await this.writeWorkspaceSerialized(serialized);
      await this.storage.rm(snapshotPath);
      return snapshot;
    });
  }
  /**
  * List undo-ring snapshots newest-first as metadata only (history.list). Reads
  * the ring but never mutates it, so it needs no exclusive lock. `bytes` is the
  * on-disk serialized size; `savedAt` is derived from the snapshot's own version.
  * Snapshots that fail validation are skipped rather than failing the whole listing.
  */
  async listHistory() {
    const files = await this.listUndoFiles();
    return (await Promise.all(files.map(async (fileName) => {
      const filePath = joinLogical(this.undoDir, fileName);
      try {
        const content = await this.storage.readFile(filePath);
        if (content === null) return;
        return {
          version: validateWorkspaceDoc(JSON.parse(content)).workspaceVersion,
          savedAt: (/* @__PURE__ */ new Date()).toISOString(),
          bytes: utf8ByteLength(content)
        };
      } catch {
        return;
      }
    }))).filter((entry) => entry !== void 0).toSorted((a, b) => b.version - a.version);
  }
  /**
  * Return the full snapshot doc for a ring `version` (history.get), or throw if it
  * is no longer in the ring. Read-only; matches on the snapshot's own
  * `workspaceVersion` so callers never depend on the ring filename offset.
  */
  async getHistorySnapshot(version) {
    const files = await this.listUndoFiles();
    for (const fileName of files) {
      const raw = await this.readJsonFile(joinLogical(this.undoDir, fileName));
      if (raw === void 0) continue;
      const doc = validateWorkspaceDoc(raw);
      if (doc.workspaceVersion === version) return doc;
    }
    throw new Error(`no dashboard history snapshot for version ${version}`);
  }
  /**
  * Resolve the on-disk file for one widget's persisted state. The charset guard
  * already forbids separators / traversal, but containment is re-checked so the
  * resolved path can never escape the `state/` jail (belt-and-braces).
  */
  resolveWidgetStatePath(widgetId) {
    if (!WIDGET_ID_PATTERN2.test(widgetId)) throw new Error("widget id is invalid");
    const stateRoot = this.widgetStateDir;
    const filePath = joinLogical(stateRoot, `${widgetId}.json`);
    if (!filePath.startsWith(`${stateRoot}/`)) throw new Error("widget id is invalid");
    return filePath;
  }
  /** Read a widget's persisted state envelope, or null if it has never been written. */
  async readWidgetState(widgetId) {
    const filePath = this.resolveWidgetStatePath(widgetId);
    const raw = await this.readJsonFile(filePath);
    if (raw === void 0) return null;
    return validateWidgetStateRecord(raw);
  }
  /**
  * Persist a widget's opaque blob under `state/<widgetId>.json`. The serialized
  * envelope is size-capped BEFORE the write, so an oversize blob is rejected WHOLE
  * (nothing is written). Writes are serialized through the process mutex and land
  * atomically; the version increments per successful write for change markers.
  *
  * Optimistic concurrency: when `opts.expectedVersion` is supplied, the write only
  * proceeds if it matches the current persisted version (0 = never written) —
  * otherwise it rejects WHOLE with a conflict, so two clients editing the same
  * widget can't silently lose each other's updates. Omitting it preserves the
  * original last-write-wins behavior.
  */
  async writeWidgetState(widgetId, blob, opts = {}) {
    const filePath = this.resolveWidgetStatePath(widgetId);
    return await this.runExclusive(async () => {
      const currentVersion = (await this.readWidgetState(widgetId).catch(() => null))?.version ?? 0;
      if (opts.expectedVersion !== void 0 && opts.expectedVersion !== currentVersion) throw new Error(`widget state version conflict: expected ${opts.expectedVersion}, found ${currentVersion}`);
      const record = {
        version: currentVersion + 1,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        blob
      };
      const serialized = `${JSON.stringify(record, null, 2)}
`;
      if (utf8ByteLength(serialized) > MAX_WIDGET_STATE_BYTES) throw new Error("widget state exceeds 64 KB");
      await this.storage.mkdir(this.widgetStateDir, { mode: 448 });
      await this.storage.writeFileAtomic(filePath, serialized, { mode: 384 });
      return { version: record.version };
    });
  }
  async runExclusive(run) {
    const next = this.queue.then(run, run);
    this.queue = next.then(() => void 0, () => void 0);
    return await next;
  }
  async writeWorkspaceDoc(doc) {
    const serialized = serializeWorkspaceDoc(doc);
    assertWorkspaceSize(serialized);
    await this.writeWorkspaceSerialized(serialized);
  }
  async writeWorkspaceSerialized(serialized) {
    await this.storage.mkdir(this.dashboardDir, { mode: 448 });
    await this.storage.writeFileAtomic(this.workspacePath, serialized, { mode: 384 });
  }
  async writeUndoSnapshot(doc, nextWorkspaceVersion) {
    await this.storage.mkdir(this.undoDir, { mode: 448 });
    await this.storage.writeFileAtomic(joinLogical(this.undoDir, `${String(nextWorkspaceVersion).padStart(4, "0")}.json`), serializeWorkspaceDoc(doc), { mode: 384 });
    const files = await this.listUndoFiles();
    const evict = files.slice(0, Math.max(0, files.length - UNDO_RING_SIZE));
    await Promise.all(evict.map((fileName) => this.storage.rm(joinLogical(this.undoDir, fileName))));
  }
  async listUndoFiles() {
    return (await this.storage.readdir(this.undoDir)).filter((fileName) => /^\d+\.json$/.test(fileName)).toSorted();
  }
};
function isTabVisibleToOperator(tab, operatorId) {
  if (tab.visibility !== "private") return true;
  return operatorId !== null && tab.owner === operatorId;
}
function filterWorkspaceForOperator(doc, operatorId) {
  const visibleTabs = doc.tabs.filter((tab) => isTabVisibleToOperator(tab, operatorId));
  if (visibleTabs.length === doc.tabs.length) return doc;
  const visibleSlugs = new Set(visibleTabs.map((tab) => tab.slug));
  return {
    ...doc,
    tabs: visibleTabs,
    prefs: {
      ...doc.prefs,
      tabOrder: doc.prefs.tabOrder.filter((slug) => visibleSlugs.has(slug))
    }
  };
}
var GALLERY_BUNDLE_MAX_BYTES = 512 * 1024;
var GALLERY_INDEX_MAX_BYTES = 256 * 1024;

// ../boardstate.worktrees/net-transport/packages/core/dist/node.js
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
var BOARDSTATE_STATE_DIR_ENV = "BOARDSTATE_STATE_DIR";
function defaultStorageDir() {
  const fromEnv = process.env[BOARDSTATE_STATE_DIR_ENV];
  if (fromEnv && fromEnv.trim()) return fromEnv;
  return path.join(os.homedir(), ".boardstate");
}
function isNotFoundError(error) {
  return error?.code === "ENOENT";
}
var FsStorageAdapter = class {
  root;
  constructor(options = {}) {
    this.root = options.storageDir ?? defaultStorageDir();
  }
  storageDir() {
    return this.root;
  }
  async writeFileAtomic(filePath, content, opts = {}) {
    const dir = path.dirname(filePath);
    const tempPath = path.join(dir, `.${path.basename(filePath)}.${randomBytes(6).toString("hex")}.tmp`);
    try {
      await fs.writeFile(tempPath, content, { mode: opts.mode ?? 384 });
      await fs.rename(tempPath, filePath);
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }
  }
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }
  async mkdir(dirPath, opts = {}) {
    await fs.mkdir(dirPath, {
      recursive: true,
      ...opts.mode !== void 0 ? { mode: opts.mode } : {}
    });
  }
  async readdir(dirPath) {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
  }
  async rm(targetPath) {
    await fs.rm(targetPath, {
      force: true,
      recursive: true
    });
  }
};
function resolveWidgetDir(name, stateDir) {
  if (!CUSTOM_WIDGET_NAME_PATTERN2.test(name)) throw new Error("widget name is invalid");
  const root = stateDir ?? new FsStorageAdapter().storageDir();
  const widgetsRoot = path.resolve(root, "dashboard", "widgets");
  const widgetDir = path.resolve(widgetsRoot, name);
  if (widgetDir !== widgetsRoot && !widgetDir.startsWith(`${widgetsRoot}${path.sep}`)) throw new Error("widget name is invalid");
  return widgetDir;
}
var MAX_FILE_BYTES = 1024 * 1024;
function resolveStateDir(stateDir) {
  return stateDir ?? new FsStorageAdapter().storageDir();
}
function resolveDashboardDataPath(bindingPath, stateDir) {
  const normalized = normalizeDashboardDataLogicalPath(bindingPath);
  const dataRoot = path.resolve(resolveStateDir(stateDir), "dashboard", "data");
  const candidate = path.resolve(dataRoot, normalized);
  if (!(candidate === dataRoot || candidate.startsWith(`${dataRoot}${path.sep}`))) throw new DashboardBindingResolutionError("binding_invalid", "file binding path is invalid");
  return candidate;
}
async function resolveFileBinding(binding, options) {
  const filePath = resolveDashboardDataPath(binding.path, options.stateDir);
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") throw new DashboardBindingResolutionError("binding_not_found", "file binding not found");
    throw error;
  }
  if (!stat.isFile()) throw new DashboardBindingResolutionError("binding_not_found", "file binding not found");
  if (stat.size > MAX_FILE_BYTES) throw new DashboardBindingResolutionError("binding_too_large", "file binding is too large");
  const content = await fs.readFile(filePath, "utf8");
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".md" || extension === ".csv") return content;
  try {
    return applyJsonPointer(JSON.parse(content), binding.pointer);
  } catch (error) {
    if (error instanceof DashboardBindingResolutionError) throw error;
    throw new DashboardBindingResolutionError("binding_invalid", "file binding JSON is invalid");
  }
}
async function resolveBinding2(bindingInput, options = {}) {
  return await resolveBinding(bindingInput, {
    ...options,
    resolveFile: resolveFileBinding
  });
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/memory.mjs
var memory_exports = {};
__export(memory_exports, {
  Assign: () => Assign,
  Clone: () => Clone,
  Create: () => Create,
  Discard: () => Discard,
  Metrics: () => Metrics,
  Update: () => Update
});

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/metrics.mjs
var Metrics = {
  assign: 0,
  create: 0,
  clone: 0,
  discard: 0,
  update: 0
};

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/assign.mjs
function Assign(left, right) {
  Metrics.assign += 1;
  return { ...left, ...right };
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/guard/guard.mjs
var guard_exports = {};
__export(guard_exports, {
  Entries: () => Entries,
  EntriesRegExp: () => EntriesRegExp,
  Every: () => Every,
  EveryAll: () => EveryAll,
  GraphemeCount: () => GraphemeCount2,
  HasPropertyKey: () => HasPropertyKey,
  IsArray: () => IsArray,
  IsBigInt: () => IsBigInt,
  IsBoolean: () => IsBoolean,
  IsClassInstance: () => IsClassInstance,
  IsConstructor: () => IsConstructor,
  IsDeepEqual: () => IsDeepEqual,
  IsEqual: () => IsEqual,
  IsFunction: () => IsFunction,
  IsGreaterEqualThan: () => IsGreaterEqualThan,
  IsGreaterThan: () => IsGreaterThan,
  IsInteger: () => IsInteger,
  IsLessEqualThan: () => IsLessEqualThan,
  IsLessThan: () => IsLessThan,
  IsMaxLength: () => IsMaxLength2,
  IsMinLength: () => IsMinLength2,
  IsMultipleOf: () => IsMultipleOf,
  IsNull: () => IsNull,
  IsNumber: () => IsNumber,
  IsObject: () => IsObject,
  IsObjectNotArray: () => IsObjectNotArray,
  IsString: () => IsString,
  IsSymbol: () => IsSymbol,
  IsUndefined: () => IsUndefined,
  IsUnsafePropertyKey: () => IsUnsafePropertyKey,
  IsValueLike: () => IsValueLike,
  Keys: () => Keys,
  ShiftLeft: () => ShiftLeft,
  Symbols: () => Symbols,
  Values: () => Values
});

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/guard/string.mjs
function IsBetween(value, min, max) {
  return value >= min && value <= max;
}
function IsRegionalIndicator(value) {
  return IsBetween(value, 127462, 127487);
}
function IsVariationSelector(value) {
  return IsBetween(value, 65024, 65039);
}
function IsCombiningMark(value) {
  return IsBetween(value, 768, 879) || IsBetween(value, 6832, 6911) || IsBetween(value, 7616, 7679) || IsBetween(value, 65056, 65071);
}
function CodePointLength(value) {
  return value > 65535 ? 2 : 1;
}
function ConsumeModifiers(value, index) {
  while (index < value.length) {
    const point = value.codePointAt(index);
    if (IsCombiningMark(point) || IsVariationSelector(point)) {
      index += CodePointLength(point);
    } else {
      break;
    }
  }
  return index;
}
function NextGraphemeClusterIndex(value, clusterStart) {
  const startCP = value.codePointAt(clusterStart);
  let clusterEnd = clusterStart + CodePointLength(startCP);
  clusterEnd = ConsumeModifiers(value, clusterEnd);
  while (clusterEnd < value.length - 1 && value[clusterEnd] === "\u200D") {
    const nextCP = value.codePointAt(clusterEnd + 1);
    clusterEnd += 1 + CodePointLength(nextCP);
    clusterEnd = ConsumeModifiers(value, clusterEnd);
  }
  if (IsRegionalIndicator(startCP) && clusterEnd < value.length && IsRegionalIndicator(value.codePointAt(clusterEnd))) {
    clusterEnd += CodePointLength(value.codePointAt(clusterEnd));
  }
  return clusterEnd;
}
function IsGraphemeCodePoint(value) {
  return IsBetween(value, 55296, 56319) || // High surrogate
  IsBetween(value, 768, 879) || // Combining diacritical marks
  value === 8205;
}
function GraphemeCount(value) {
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = NextGraphemeClusterIndex(value, index);
    count++;
  }
  return count;
}
function IsMinLength(value, minLength) {
  if (minLength === 0)
    return true;
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = NextGraphemeClusterIndex(value, index);
    count++;
    if (count >= minLength)
      return true;
  }
  return false;
}
function IsMaxLength(value, maxLength) {
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = NextGraphemeClusterIndex(value, index);
    count++;
    if (count > maxLength)
      return false;
  }
  return true;
}
function IsMinLengthFast(value, minLength) {
  if (minLength === 0)
    return true;
  let index = 0;
  while (index < value.length) {
    if (IsGraphemeCodePoint(value.charCodeAt(index))) {
      return IsMinLength(value, minLength);
    }
    index++;
    if (index >= minLength)
      return true;
  }
  return false;
}
function IsMaxLengthFast(value, maxLength) {
  let index = 0;
  while (index < value.length) {
    if (IsGraphemeCodePoint(value.charCodeAt(index))) {
      return IsMaxLength(value, maxLength);
    }
    index++;
    if (index > maxLength)
      return false;
  }
  return true;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/guard/guard.mjs
function IsArray(value) {
  return Array.isArray(value);
}
function IsBigInt(value) {
  return IsEqual(typeof value, "bigint");
}
function IsBoolean(value) {
  return IsEqual(typeof value, "boolean");
}
function IsConstructor(value) {
  if (IsUndefined(value) || !IsFunction(value))
    return false;
  const result = Function.prototype.toString.call(value);
  if (/^class\s/.test(result))
    return true;
  if (/\[native code\]/.test(result))
    return true;
  return false;
}
function IsFunction(value) {
  return IsEqual(typeof value, "function");
}
function IsInteger(value) {
  return Number.isInteger(value);
}
function IsNull(value) {
  return IsEqual(value, null);
}
function IsNumber(value) {
  return Number.isFinite(value);
}
function IsObjectNotArray(value) {
  return IsObject(value) && !IsArray(value);
}
function IsObject(value) {
  return IsEqual(typeof value, "object") && !IsNull(value);
}
function IsString(value) {
  return IsEqual(typeof value, "string");
}
function IsSymbol(value) {
  return IsEqual(typeof value, "symbol");
}
function IsUndefined(value) {
  return IsEqual(value, void 0);
}
function IsEqual(left, right) {
  return left === right;
}
function IsGreaterThan(left, right) {
  return left > right;
}
function IsLessThan(left, right) {
  return left < right;
}
function IsLessEqualThan(left, right) {
  return left <= right;
}
function IsGreaterEqualThan(left, right) {
  return left >= right;
}
function IsMultipleOf(dividend, divisor) {
  if (IsBigInt(dividend) || IsBigInt(divisor)) {
    return BigInt(dividend) % BigInt(divisor) === 0n;
  }
  const tolerance = 1e-10;
  if (!IsNumber(dividend))
    return true;
  if (IsInteger(dividend) && 1 / divisor % 1 === 0)
    return true;
  const mod = dividend % divisor;
  return Math.min(Math.abs(mod), Math.abs(mod - divisor), Math.abs(mod + divisor)) < tolerance;
}
function IsClassInstance(value) {
  if (!IsObject(value))
    return false;
  const proto = globalThis.Object.getPrototypeOf(value);
  if (IsNull(proto))
    return false;
  return IsEqual(typeof proto.constructor, "function") && !(IsEqual(proto.constructor, globalThis.Object) || IsEqual(proto.constructor.name, "Object"));
}
function IsValueLike(value) {
  return IsBigInt(value) || IsBoolean(value) || IsNull(value) || IsNumber(value) || IsString(value) || IsUndefined(value);
}
function GraphemeCount2(value) {
  return GraphemeCount(value);
}
function IsMaxLength2(value, length) {
  return IsMaxLengthFast(value, length);
}
function IsMinLength2(value, length) {
  return IsMinLengthFast(value, length);
}
function Every(value, offset, callback) {
  for (let index = offset; index < value.length; index++) {
    if (!callback(value[index], index))
      return false;
  }
  return true;
}
function EveryAll(value, offset, callback) {
  let result = true;
  for (let index = offset; index < value.length; index++) {
    if (!callback(value[index], index))
      result = false;
  }
  return result;
}
function ShiftLeft(array, true_, false_) {
  return IsEqual(array.length, 0) ? false_() : true_(array[0], array.slice(1));
}
function IsUnsafePropertyKey(key) {
  return IsEqual(key, "__proto__") || IsEqual(key, "constructor") || IsEqual(key, "prototype");
}
function HasPropertyKey(value, key) {
  return IsUnsafePropertyKey(key) ? Object.prototype.hasOwnProperty.call(value, key) : key in value;
}
function EntriesRegExp(value) {
  return Keys(value).map((key) => [new RegExp(`^${key}$`), value[key]]);
}
function Entries(value) {
  return Object.entries(value);
}
function Keys(value) {
  return Object.getOwnPropertyNames(value);
}
function Symbols(value) {
  return Object.getOwnPropertySymbols(value);
}
function Values(value) {
  return Object.values(value);
}
function DeepEqualObject(left, right) {
  if (!IsObject(right))
    return false;
  const keys = Keys(left);
  return IsEqual(keys.length, Keys(right).length) && keys.every((key) => IsDeepEqual(left[key], right[key]));
}
function DeepEqualArray(left, right) {
  return IsArray(right) && IsEqual(left.length, right.length) && left.every((_, index) => IsDeepEqual(left[index], right[index]));
}
function IsDeepEqual(left, right) {
  return IsArray(left) ? DeepEqualArray(left, right) : IsObject(left) ? DeepEqualObject(left, right) : IsEqual(left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/guard/globals.mjs
var globals_exports = {};
__export(globals_exports, {
  IsBigInt64Array: () => IsBigInt64Array,
  IsBigUint64Array: () => IsBigUint64Array,
  IsBoolean: () => IsBoolean2,
  IsDate: () => IsDate,
  IsFloat32Array: () => IsFloat32Array,
  IsFloat64Array: () => IsFloat64Array,
  IsInt16Array: () => IsInt16Array,
  IsInt32Array: () => IsInt32Array,
  IsInt8Array: () => IsInt8Array,
  IsMap: () => IsMap,
  IsNumber: () => IsNumber2,
  IsRegExp: () => IsRegExp,
  IsSet: () => IsSet,
  IsString: () => IsString2,
  IsTypeArray: () => IsTypeArray,
  IsUint16Array: () => IsUint16Array,
  IsUint32Array: () => IsUint32Array,
  IsUint8Array: () => IsUint8Array,
  IsUint8ClampedArray: () => IsUint8ClampedArray
});
function IsBoolean2(value) {
  return value instanceof Boolean;
}
function IsNumber2(value) {
  return value instanceof Number;
}
function IsString2(value) {
  return value instanceof String;
}
function IsTypeArray(value) {
  return globalThis.ArrayBuffer.isView(value);
}
function IsInt8Array(value) {
  return value instanceof globalThis.Int8Array;
}
function IsUint8Array(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUint8ClampedArray(value) {
  return value instanceof globalThis.Uint8ClampedArray;
}
function IsInt16Array(value) {
  return value instanceof globalThis.Int16Array;
}
function IsUint16Array(value) {
  return value instanceof globalThis.Uint16Array;
}
function IsInt32Array(value) {
  return value instanceof globalThis.Int32Array;
}
function IsUint32Array(value) {
  return value instanceof globalThis.Uint32Array;
}
function IsFloat32Array(value) {
  return value instanceof globalThis.Float32Array;
}
function IsFloat64Array(value) {
  return value instanceof globalThis.Float64Array;
}
function IsBigInt64Array(value) {
  return value instanceof globalThis.BigInt64Array;
}
function IsBigUint64Array(value) {
  return value instanceof globalThis.BigUint64Array;
}
function IsRegExp(value) {
  return value instanceof globalThis.RegExp;
}
function IsDate(value) {
  return value instanceof globalThis.Date;
}
function IsSet(value) {
  return value instanceof globalThis.Set;
}
function IsMap(value) {
  return value instanceof globalThis.Map;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/clone.mjs
function FromClassInstance(value) {
  return value;
}
function IsTypeObject(value) {
  return guard_exports.HasPropertyKey(value, "~kind") || guard_exports.HasPropertyKey(value, "~unsafe");
}
function FromTypeObject(value) {
  const result = {};
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Object.keys(descriptors)) {
    if (guard_exports.IsUnsafePropertyKey(key))
      continue;
    const descriptor = descriptors[key];
    if (guard_exports.HasPropertyKey(descriptor, "value")) {
      Object.defineProperty(result, key, { ...descriptor, value: FromValue(descriptor.value) });
    }
  }
  return result;
}
function FromPlainObject(value) {
  const result = {};
  for (const key of guard_exports.Keys(value)) {
    if (guard_exports.IsUnsafePropertyKey(key))
      continue;
    result[key] = FromValue(value[key]);
  }
  for (const key of guard_exports.Symbols(value)) {
    result[key] = FromValue(value[key]);
  }
  return result;
}
function FromObject(value) {
  return guard_exports.IsClassInstance(value) ? FromClassInstance(value) : IsTypeObject(value) ? FromTypeObject(value) : FromPlainObject(value);
}
function FromArray(value) {
  return value.map((element) => FromValue(element));
}
function FromTypedArray(value) {
  return value.slice();
}
function FromRegExp(value) {
  return new RegExp(value.source, value.flags);
}
function FromMap(value) {
  return new Map(FromValue([...value.entries()]));
}
function FromSet(value) {
  return new Set(FromValue([...value.values()]));
}
function FromValue(value) {
  return globals_exports.IsTypeArray(value) ? FromTypedArray(value) : globals_exports.IsRegExp(value) ? FromRegExp(value) : globals_exports.IsMap(value) ? FromMap(value) : globals_exports.IsSet(value) ? FromSet(value) : guard_exports.IsArray(value) ? FromArray(value) : guard_exports.IsObject(value) ? FromObject(value) : value;
}
function Clone(value) {
  Metrics.clone += 1;
  return FromValue(value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/settings/settings.mjs
var settings_exports = {};
__export(settings_exports, {
  Get: () => Get,
  Reset: () => Reset,
  Set: () => Set2
});
var settings = {
  immutableTypes: false,
  maxErrors: 8,
  useAcceleration: true,
  exactOptionalPropertyTypes: false,
  enumerableKind: false,
  correctiveParse: false,
  unionPrioritySort: true
};
function Reset() {
  settings.immutableTypes = false;
  settings.maxErrors = 8;
  settings.useAcceleration = true;
  settings.exactOptionalPropertyTypes = false;
  settings.enumerableKind = false;
  settings.correctiveParse = false;
  settings.unionPrioritySort = true;
}
function Set2(options) {
  for (const key of guard_exports.Keys(options)) {
    const value = options[key];
    if (value !== void 0) {
      Object.defineProperty(settings, key, { value });
    }
  }
}
function Get() {
  return settings;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/create.mjs
function MergeHidden(left, right) {
  for (const key of Object.keys(right)) {
    Object.defineProperty(left, key, {
      configurable: true,
      writable: true,
      enumerable: false,
      value: right[key]
    });
  }
  return left;
}
function Merge(left, right) {
  return { ...left, ...right };
}
function Create(hidden, enumerable, options = {}) {
  Metrics.create += 1;
  const settings2 = settings_exports.Get();
  const withOptions = Merge(enumerable, options);
  const withHidden = settings2.enumerableKind ? Merge(withOptions, hidden) : MergeHidden(withOptions, hidden);
  return settings2.immutableTypes ? Object.freeze(withHidden) : withHidden;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/discard.mjs
function Discard(value, propertyKeys) {
  Metrics.discard += 1;
  const result = {};
  const descriptors = Object.getOwnPropertyDescriptors(Clone(value));
  const keysToDiscard = new Set(propertyKeys);
  for (const key of Object.keys(descriptors)) {
    if (keysToDiscard.has(key))
      continue;
    Object.defineProperty(result, key, descriptors[key]);
  }
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/memory/update.mjs
function Update(current, hidden, enumerable) {
  Metrics.update += 1;
  const settings2 = settings_exports.Get();
  const result = Clone(current);
  for (const key of Object.keys(hidden)) {
    Object.defineProperty(result, key, {
      configurable: true,
      writable: true,
      enumerable: settings2.enumerableKind,
      value: hidden[key]
    });
  }
  for (const key of Object.keys(enumerable)) {
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: enumerable[key]
    });
  }
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/schema.mjs
function IsKind(value, kind) {
  return guard_exports.IsObject(value) && guard_exports.HasPropertyKey(value, "~kind") && guard_exports.IsEqual(value["~kind"], kind);
}
function IsSchema(value) {
  return guard_exports.IsObject(value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/deferred.mjs
function Deferred(action, parameters, options) {
  return memory_exports.Create({ "~kind": "Deferred" }, { type: "deferred", action, parameters, options }, {});
}
function IsDeferred(value) {
  return IsKind(value, "Deferred");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly/instantiate_add.mjs
function AddReadonlyOperation(type) {
  return memory_exports.Update(type, { "~readonly": true }, {});
}
function AddReadonlyAction(type, options) {
  const result = memory_exports.Update(AddReadonlyOperation(type), {}, options);
  return result;
}
function AddReadonlyInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return AddReadonlyAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/optional/instantiate_add.mjs
function AddOptionalOperation(type) {
  return memory_exports.Update(type, { "~optional": true }, {});
}
function AddOptionalAction(type, options) {
  const result = memory_exports.Update(AddOptionalOperation(type), {}, options);
  return result;
}
function AddOptionalInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return AddOptionalAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/array.mjs
function _Array_(items, options) {
  return memory_exports.Create({ "~kind": "Array" }, { type: "array", items }, options);
}
function IsArray2(value) {
  return IsKind(value, "Array");
}
function ArrayOptions(type) {
  return memory_exports.Discard(type, ["~kind", "type", "items"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/constructor.mjs
function Constructor(parameters, instanceType, options = {}) {
  return memory_exports.Create({ "~kind": "Constructor" }, { type: "constructor", parameters, instanceType }, options);
}
function IsConstructor2(value) {
  return IsKind(value, "Constructor");
}
function ConstructorOptions(type) {
  return memory_exports.Discard(type, ["~kind", "type", "parameters", "instanceType"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/function.mjs
function _Function_(parameters, returnType, options = {}) {
  return memory_exports.Create({ ["~kind"]: "Function" }, { type: "function", parameters, returnType }, options);
}
function IsFunction2(value) {
  return IsKind(value, "Function");
}
function FunctionOptions(type) {
  return memory_exports.Discard(type, ["~kind", "type", "parameters", "returnType"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/ref.mjs
function Ref(ref, options) {
  return memory_exports.Create({ ["~kind"]: "Ref" }, { $ref: ref }, options);
}
function IsRef(value) {
  return IsKind(value, "Ref");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/generic.mjs
function Generic(parameters, expression) {
  return memory_exports.Create({ "~kind": "Generic" }, { type: "generic", parameters, expression });
}
function IsGeneric(value) {
  return IsKind(value, "Generic");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/any.mjs
function Any(options) {
  return memory_exports.Create({ ["~kind"]: "Any" }, {}, options);
}
function IsAny(value) {
  return IsKind(value, "Any");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/never.mjs
var NeverPattern = "(?!)";
function Never(options) {
  return memory_exports.Create({ "~kind": "Never" }, { not: {} }, options);
}
function IsNever(value) {
  return IsKind(value, "Never");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/_add_optional.mjs
function AddOptionalDeferred(type, options = {}) {
  return Deferred("AddOptional", [type], options);
}
function AddOptional(type, options = {}) {
  return AddOptionalAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/_optional.mjs
function Optional(type) {
  return AddOptional(type);
}
function IsOptional(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "~optional");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/properties.mjs
function RequiredArray(properties) {
  return guard_exports.Keys(properties).filter((key) => !IsOptional(properties[key]));
}
function PropertyKeys(properties) {
  return guard_exports.Keys(properties);
}
function PropertyValues(properties) {
  return guard_exports.Values(properties);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/object.mjs
function _Object_(properties, options = {}) {
  const requiredKeys = RequiredArray(properties);
  const required = requiredKeys.length > 0 ? { required: requiredKeys } : {};
  return memory_exports.Create({ "~kind": "Object" }, { type: "object", ...required, properties }, options);
}
function IsObject2(value) {
  return IsKind(value, "Object");
}
function ObjectOptions(type) {
  return memory_exports.Discard(type, ["~kind", "type", "properties", "required"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/unknown.mjs
function Unknown(options) {
  return memory_exports.Create({ ["~kind"]: "Unknown" }, {}, options);
}
function IsUnknown(value) {
  return IsKind(value, "Unknown");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/cyclic.mjs
function Cyclic($defs, $ref, options) {
  const defs = guard_exports.Keys($defs).reduce((result, key) => {
    return { ...result, [key]: memory_exports.Update($defs[key], {}, { $id: key }) };
  }, {});
  return memory_exports.Create({ ["~kind"]: "Cyclic" }, { $defs: defs, $ref }, options);
}
function IsCyclic(value) {
  return IsKind(value, "Cyclic");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/unsafe.mjs
function Unsafe(schema) {
  return memory_exports.Update(schema, { ["~unsafe"]: null }, {});
}
function IsUnsafe(value) {
  return guard_exports.IsObjectNotArray(value) && guard_exports.HasPropertyKey(value, "~unsafe") && guard_exports.IsNull(value["~unsafe"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/arguments/arguments.mjs
var arguments_exports = {};
__export(arguments_exports, {
  Match: () => Match
});
function Match(args, match) {
  return match[args.length]?.(...args) ?? (() => {
    throw Error("Invalid Arguments");
  })();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/infer.mjs
function Infer(...args) {
  const [name, extends_] = arguments_exports.Match(args, {
    2: (name2, extends_2) => [name2, extends_2, extends_2],
    1: (name2) => [name2, Unknown(), Unknown()]
  });
  return memory_exports.Create({ ["~kind"]: "Infer" }, { type: "infer", name, extends: extends_ }, {});
}
function IsInfer(value) {
  return IsKind(value, "Infer");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/dependent.mjs
function Dependent(if_, then_, else_, options = {}) {
  return memory_exports.Create({ "~kind": "Dependent" }, { if: if_, then: then_, else: else_ }, options);
}
function IsDependent(value) {
  return IsKind(value, "Dependent");
}
function DependentOptions(type) {
  return memory_exports.Discard(type, ["~kind", "if", "then", "else"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/enum/typescript_enum_to_enum_values.mjs
function IsTypeScriptEnumLike(value) {
  return guard_exports.IsObjectNotArray(value);
}
function TypeScriptEnumToEnumValues(type) {
  const keys = guard_exports.Keys(type).filter((key) => isNaN(key));
  return keys.reduce((result, key) => [...result, type[key]], []);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/enum.mjs
function IsEnumValue(value) {
  return guard_exports.IsString(value) || guard_exports.IsNumber(value);
}
function Enum(value, options) {
  const values = IsTypeScriptEnumLike(value) ? TypeScriptEnumToEnumValues(value) : value;
  return memory_exports.Create({ "~kind": "Enum" }, { enum: values }, options);
}
function IsEnum(value) {
  return IsKind(value, "Enum");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/intersect.mjs
function Intersect(types, options = {}) {
  return memory_exports.Create({ "~kind": "Intersect" }, { allOf: types }, options);
}
function IsIntersect(value) {
  return IsKind(value, "Intersect");
}
function IntersectOptions(type) {
  return memory_exports.Discard(type, ["~kind", "allOf"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/unreachable/unreachable.mjs
function Unreachable() {
  throw new Error("Unreachable");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/system/hashing/hash.mjs
var ByteMarker;
(function(ByteMarker2) {
  ByteMarker2[ByteMarker2["Array"] = 0] = "Array";
  ByteMarker2[ByteMarker2["BigInt"] = 1] = "BigInt";
  ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
  ByteMarker2[ByteMarker2["Date"] = 3] = "Date";
  ByteMarker2[ByteMarker2["Constructor"] = 4] = "Constructor";
  ByteMarker2[ByteMarker2["Function"] = 5] = "Function";
  ByteMarker2[ByteMarker2["Null"] = 6] = "Null";
  ByteMarker2[ByteMarker2["Number"] = 7] = "Number";
  ByteMarker2[ByteMarker2["Object"] = 8] = "Object";
  ByteMarker2[ByteMarker2["RegExp"] = 9] = "RegExp";
  ByteMarker2[ByteMarker2["String"] = 10] = "String";
  ByteMarker2[ByteMarker2["Symbol"] = 11] = "Symbol";
  ByteMarker2[ByteMarker2["TypeArray"] = 12] = "TypeArray";
  ByteMarker2[ByteMarker2["Undefined"] = 13] = "Undefined";
})(ByteMarker || (ByteMarker = {}));
var Accumulator = BigInt("14695981039346656037");
var [Prime, Size] = [BigInt("1099511628211"), BigInt(
  "18446744073709551616"
  /* 2 ^ 64 */
)];
var Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
var F64 = new Float64Array(1);
var F64In = new DataView(F64.buffer);
var F64Out = new Uint8Array(F64.buffer);
var encoder = new TextEncoder();

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/_codec.mjs
var EncodeBuilder = class {
  constructor(type, decode) {
    this.type = type;
    this.decode = decode;
  }
  Encode(callback) {
    const type = this.type;
    const decode = IsCodec(type) ? (value) => this.decode(type["~codec"].decode(value)) : this.decode;
    const encode = IsCodec(type) ? (value) => type["~codec"].encode(callback(value)) : callback;
    const codec = { decode, encode };
    return memory_exports.Update(this.type, { "~codec": codec }, {});
  }
};
var DecodeBuilder = class {
  constructor(type) {
    this.type = type;
  }
  Decode(callback) {
    return new EncodeBuilder(this.type, callback);
  }
};
function Codec(type) {
  return new DecodeBuilder(type);
}
function Decode(type, callback) {
  return Codec(type).Decode(callback).Encode(() => {
    throw Error("Encode not implemented");
  });
}
function Encode(type, callback) {
  return Codec(type).Decode(() => {
    throw Error("Decode not implemented");
  }).Encode(callback);
}
function IsCodec(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "~codec") && guard_exports.IsObject(value["~codec"]) && guard_exports.HasPropertyKey(value["~codec"], "encode") && guard_exports.HasPropertyKey(value["~codec"], "decode");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/_immutable.mjs
function Immutable(type) {
  return AddImmutable(type);
}
function IsImmutable(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "~immutable");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/_add_readonly.mjs
function AddReadonlyDeferred(type, options = {}) {
  return Deferred("AddReadonly", [type], options);
}
function AddReadonly(type, options = {}) {
  return AddReadonlyAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/_readonly.mjs
function Readonly(type) {
  return AddReadonly(type);
}
function IsReadonly(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "~readonly");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/_refine.mjs
function RefineAdd(type, refinement) {
  const refinements = IsRefine(type) ? [...type["~refine"], refinement] : [refinement];
  return memory_exports.Update(type, { "~refine": refinements }, {});
}
function Refine(...args) {
  const [type, check, error] = arguments_exports.Match(args, {
    3: (type2, check2, error2) => [type2, check2, error2],
    2: (type2, check2) => [type2, check2, () => "Refine Error"]
  });
  return RefineAdd(type, { check, error });
}
function IsRefinement(value) {
  return guard_exports.IsObjectNotArray(value) && guard_exports.HasPropertyKey(value, "check") && guard_exports.HasPropertyKey(value, "error") && guard_exports.IsFunction(value.check) && guard_exports.IsFunction(value.error);
}
function IsRefine(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "~refine") && guard_exports.IsArray(value["~refine"]) && guard_exports.Every(value["~refine"], 0, (value2) => IsRefinement(value2));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/bigint.mjs
var BigIntPattern = "-?(?:0|[1-9][0-9]*)n";
function BigInt2(options) {
  return memory_exports.Create({ "~kind": "BigInt" }, { type: "bigint" }, options);
}
function IsBigInt2(value) {
  return IsKind(value, "BigInt");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/boolean.mjs
function Boolean2(options) {
  return memory_exports.Create({ "~kind": "Boolean" }, { type: "boolean" }, options);
}
function IsBoolean3(value) {
  return IsKind(value, "Boolean");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/identifier.mjs
function Identifier(name) {
  return memory_exports.Create({ "~kind": "Identifier" }, { name });
}
function IsIdentifier(value) {
  return IsKind(value, "Identifier");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/integer.mjs
var IntegerPattern = "-?(?:0|[1-9][0-9]*)";
function Integer(options) {
  return memory_exports.Create({ "~kind": "Integer" }, { type: "integer" }, options);
}
function IsInteger2(value) {
  return IsKind(value, "Integer");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/literal.mjs
var InvalidLiteralValue = class extends Error {
  constructor(value) {
    super(`Invalid Literal value`);
    Object.defineProperty(this, "cause", {
      value: { value },
      writable: false,
      configurable: false,
      enumerable: false
    });
  }
};
function LiteralTypeName(value) {
  return guard_exports.IsBigInt(value) ? "bigint" : guard_exports.IsBoolean(value) ? "boolean" : guard_exports.IsNumber(value) ? "number" : guard_exports.IsString(value) ? "string" : (() => {
    throw new InvalidLiteralValue(value);
  })();
}
function Literal(value, options) {
  return memory_exports.Create({ "~kind": "Literal" }, { type: LiteralTypeName(value), const: value }, options);
}
function IsLiteralValue(value) {
  return guard_exports.IsBigInt(value) || guard_exports.IsBoolean(value) || guard_exports.IsNumber(value) || guard_exports.IsString(value);
}
function IsLiteralNumber(value) {
  return IsLiteral(value) && guard_exports.IsNumber(value.const);
}
function IsLiteralString(value) {
  return IsLiteral(value) && guard_exports.IsString(value.const);
}
function IsLiteral(value) {
  return IsKind(value, "Literal");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/null.mjs
function Null(options) {
  return memory_exports.Create({ "~kind": "Null" }, { type: "null" }, options);
}
function IsNull2(value) {
  return IsKind(value, "Null");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/number.mjs
var NumberPattern = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?";
function Number2(options) {
  return memory_exports.Create({ "~kind": "Number" }, { type: "number" }, options);
}
function IsNumber3(value) {
  return IsKind(value, "Number");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/symbol.mjs
function Symbol2(options) {
  return memory_exports.Create({ "~kind": "Symbol" }, { type: "symbol" }, options);
}
function IsSymbol2(value) {
  return IsKind(value, "Symbol");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/parameter.mjs
function Parameter(...args) {
  const [name, extends_, equals] = arguments_exports.Match(args, {
    3: (name2, extends_2, equals2) => [name2, extends_2, equals2],
    2: (name2, extends_2) => [name2, extends_2, extends_2],
    1: (name2) => [name2, Unknown(), Unknown()]
  });
  return memory_exports.Create({ "~kind": "Parameter" }, { name, extends: extends_, equals }, {});
}
function IsParameter(value) {
  return IsKind(value, "Parameter");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/string.mjs
var StringPattern = ".*";
function String2(options) {
  return memory_exports.Create({ "~kind": "String" }, { type: "string" }, options);
}
function IsString3(value) {
  return IsKind(value, "String");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/union.mjs
function Union(anyOf, options = {}) {
  return memory_exports.Create({ "~kind": "Union" }, { anyOf }, options);
}
function IsUnion(value) {
  return IsKind(value, "Union");
}
function UnionOptions(type) {
  return memory_exports.Discard(type, ["~kind", "anyOf"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/patterns/pattern.mjs
function ParsePatternIntoTypes(pattern) {
  const parsed = Pattern(pattern);
  const result = guard_exports.IsEqual(parsed.length, 2) ? parsed[0] : [];
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/template_literal/is_finite.mjs
function FromLiteral(_value) {
  return true;
}
function FromTypesReduce(types) {
  return guard_exports.ShiftLeft(types, (left, right) => FromType(left) ? FromTypesReduce(right) : false, () => true);
}
function FromTypes(types) {
  const result = guard_exports.IsEqual(types.length, 0) ? false : FromTypesReduce(types);
  return result;
}
function FromType(type) {
  return IsUnion(type) ? FromTypes(type.anyOf) : IsLiteral(type) ? FromLiteral(type.const) : false;
}
function IsTemplateLiteralFinite(types) {
  const result = FromTypes(types);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/template_literal/create.mjs
function TemplateLiteralCreate(pattern) {
  return memory_exports.Create({ ["~kind"]: "TemplateLiteral" }, { type: "string", pattern }, {});
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/template_literal/decode.mjs
function FromLiteralPush(variants, value, result = []) {
  return guard_exports.ShiftLeft(variants, (left, right) => FromLiteralPush(right, value, [...result, `${left}${value}`]), () => result);
}
function FromLiteral2(variants, value) {
  return guard_exports.IsEqual(variants.length, 0) ? [`${value}`] : FromLiteralPush(variants, value);
}
function FromUnion(variants, types, result = []) {
  return guard_exports.ShiftLeft(types, (left, right) => FromUnion(variants, right, [...result, ...FromType2(variants, left)]), () => result);
}
function FromType2(variants, type) {
  const result = IsUnion(type) ? FromUnion(variants, type.anyOf) : IsLiteral(type) ? FromLiteral2(variants, type.const) : Unreachable();
  return result;
}
function DecodeFromSpan(variants, types) {
  return guard_exports.ShiftLeft(types, (left, right) => DecodeFromSpan(FromType2(variants, left), right), () => variants);
}
function VariantsToLiterals(variants) {
  return variants.map((variant) => Literal(variant));
}
function DecodeTypesAsUnion(types) {
  const variants = DecodeFromSpan([], types);
  const literals = VariantsToLiterals(variants);
  const result = Union(literals);
  return result;
}
function DecodeTypes(types) {
  return guard_exports.IsEqual(types.length, 0) ? Unreachable() : (
    // Literal('') :
    guard_exports.IsEqual(types.length, 1) && IsLiteral(types[0]) ? types[0] : DecodeTypesAsUnion(types)
  );
}
function TemplateLiteralDecodeUnsafe(pattern) {
  const types = ParsePatternIntoTypes(pattern);
  const result = guard_exports.IsEqual(types.length, 0) ? String2() : IsTemplateLiteralFinite(types) ? DecodeTypes(types) : TemplateLiteralCreate(pattern);
  return result;
}
function TemplateLiteralDecode(pattern) {
  const decoded = TemplateLiteralDecodeUnsafe(pattern);
  const result = IsTemplateLiteral(decoded) ? String2() : decoded;
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/record_create.mjs
function CreateRecord(key, value) {
  const type = "object";
  const patternProperties = { [key]: value };
  return memory_exports.Create({ ["~kind"]: "Record" }, { type, patternProperties });
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_any.mjs
function FromAnyKey(value) {
  return CreateRecord(StringKey, value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_boolean.mjs
function FromBooleanKey(value) {
  return _Object_({ true: value, false: value });
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/tuple.mjs
function Tuple(types, options = {}) {
  const [items, minItems, additionalItems] = [types, types.length, false];
  return memory_exports.Create({ ["~kind"]: "Tuple" }, { type: "array", additionalItems, items, minItems }, options);
}
function IsTuple(value) {
  return IsKind(value, "Tuple");
}
function TupleOptions(type) {
  return memory_exports.Discard(type, ["~kind", "type", "items", "minItems", "additionalItems"]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly/instantiate_remove.mjs
function RemoveReadonlyOperation(type) {
  return memory_exports.Discard(type, ["~readonly"]);
}
function RemoveReadonlyAction(type, options) {
  const result = memory_exports.Update(RemoveReadonlyOperation(type), {}, options);
  return result;
}
function RemoveReadonlyInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return RemoveReadonlyAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/_remove_readonly.mjs
function RemoveReadonlyDeferred(type, options = {}) {
  return Deferred("RemoveReadonly", [type], options);
}
function RemoveReadonly(type, options = {}) {
  return RemoveReadonlyAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/optional/instantiate_remove.mjs
function RemoveOptionalOperation(type) {
  return memory_exports.Discard(type, ["~optional"]);
}
function RemoveOptionalAction(type, options) {
  const result = memory_exports.Update(RemoveOptionalOperation(type), {}, options);
  return result;
}
function RemoveOptionalInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return RemoveOptionalAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/_remove_optional.mjs
function RemoveOptionalDeferred(type, options = {}) {
  return Deferred("RemoveOptional", [type], options);
}
function RemoveOptional(type, options = {}) {
  return RemoveOptionalAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/tuple/to_object.mjs
function TupleElementsToProperties(types) {
  const result = types.reduceRight((result2, right, index) => {
    return { [index]: right, ...result2 };
  }, {});
  return result;
}
function TupleToObject(type) {
  const properties = TupleElementsToProperties(type.items);
  const result = _Object_(properties);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/composite.mjs
function IsReadonlyProperty(left, right) {
  return IsReadonly(left) ? IsReadonly(right) ? true : false : false;
}
function IsOptionalProperty(left, right) {
  return IsOptional(left) ? IsOptional(right) ? true : false : false;
}
function CompositeProperty(left, right) {
  const isReadonly = IsReadonlyProperty(left, right);
  const isOptional = IsOptionalProperty(left, right);
  const evaluated = EvaluateIntersect([left, right]);
  const property = RemoveReadonly(RemoveOptional(evaluated));
  return isReadonly && isOptional ? AddReadonly(AddOptional(property)) : isReadonly && !isOptional ? AddReadonly(property) : !isReadonly && isOptional ? AddOptional(property) : property;
}
function CompositePropertyKey(left, right, key) {
  return key in left ? key in right ? CompositeProperty(left[key], right[key]) : left[key] : key in right ? right[key] : Never();
}
function CompositeProperties(left, right) {
  const keys = /* @__PURE__ */ new Set([...guard_exports.Keys(right), ...guard_exports.Keys(left)]);
  return [...keys].reduce((result, key) => {
    return { ...result, [key]: CompositePropertyKey(left, right, key) };
  }, {});
}
function GetProperties(type) {
  const result = IsObject2(type) ? type.properties : IsTuple(type) ? TupleElementsToProperties(type.items) : Unreachable();
  return result;
}
function Composite(left, right) {
  const leftProperties = GetProperties(left);
  const rightProperties = GetProperties(right);
  const properties = CompositeProperties(leftProperties, rightProperties);
  return _Object_(properties);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/narrow.mjs
function Narrow(left, right) {
  const result = Compare(left, right);
  return guard_exports.IsEqual(result, ResultLeftInside) ? left : guard_exports.IsEqual(result, ResultRightInside) ? right : guard_exports.IsEqual(result, ResultEqual) ? right : Never();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/distribute.mjs
function IsObjectLike(type) {
  return IsObject2(type) || IsTuple(type);
}
function IsUnionOperand(left, right) {
  const isUnionLeft = IsUnion(left);
  const isUnionRight = IsUnion(right);
  const result = isUnionLeft || isUnionRight;
  return result;
}
function DistributeOperation(left, right) {
  const evaluatedLeft = EvaluateType(left);
  const evaluatedRight = EvaluateType(right);
  const isUnionOperand = IsUnionOperand(evaluatedLeft, evaluatedRight);
  const isObjectLeft = IsObjectLike(evaluatedLeft);
  const IsObjectRight = IsObjectLike(evaluatedRight);
  const result = isUnionOperand ? EvaluateIntersect([evaluatedLeft, evaluatedRight]) : isObjectLeft && IsObjectRight ? Composite(evaluatedLeft, evaluatedRight) : isObjectLeft && !IsObjectRight ? evaluatedLeft : !isObjectLeft && IsObjectRight ? evaluatedRight : Narrow(evaluatedLeft, evaluatedRight);
  return result;
}
function DistributeType(type, types, result = []) {
  return guard_exports.ShiftLeft(types, (left, right) => DistributeType(type, right, [...result, DistributeOperation(type, left)]), () => guard_exports.IsEqual(result.length, 0) ? [type] : result);
}
function DistributeUnion(types, distribution, result = []) {
  return guard_exports.ShiftLeft(types, (left, right) => DistributeUnion(right, distribution, [...result, ...Distribute([left], distribution)]), () => result);
}
function Distribute(types, result = []) {
  return guard_exports.ShiftLeft(types, (left, right) => IsUnion(left) ? Distribute(right, DistributeUnion(left.anyOf, result)) : Distribute(right, DistributeType(left, result)), () => result);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/exclude/operation.mjs
function ExcludeType(left, right) {
  const check = Extends({}, left, right);
  const result = result_exports.IsExtendsTrueLike(check) ? [] : [left];
  return result;
}
function ExcludeUnion(types, right) {
  return types.reduce((result, head) => {
    return [...result, ...ExcludeType(head, right)];
  }, []);
}
function ExcludeOperation(left, right) {
  const evaluated = EvaluateType(left);
  const canonical = IsUnion(evaluated) ? evaluated.anyOf : [evaluated];
  const remaining = ExcludeUnion(canonical, right);
  const result = EvaluateUnion(remaining);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/evaluate.mjs
function EvaluateDependent(if_, then_, else_) {
  const intersect = Intersect([if_, then_]);
  const excluded = ExcludeOperation(else_, if_);
  const result = EvaluateUnion([intersect, excluded]);
  return result;
}
function EvaluateEnum(values) {
  const result = values.map((value) => Literal(value));
  return EvaluateUnion(result);
}
function EvaluateIntersect(types) {
  const distribution = Distribute(types);
  const broadend = Broaden(distribution);
  const result = EvaluateUnionFast(broadend);
  return result;
}
function EvaluateTemplateLiteral(pattern) {
  const evaluated = TemplateLiteralDecode(pattern);
  const result = EvaluateType(evaluated);
  return result;
}
function EvaluateUnion(types) {
  const broadend = Broaden(types);
  const result = EvaluateUnionFast(broadend);
  return result;
}
function EvaluateType(type) {
  return IsDependent(type) ? EvaluateDependent(type.if, type.then, type.else) : IsEnum(type) ? EvaluateEnum(type.enum) : IsIntersect(type) ? EvaluateIntersect(type.allOf) : IsTemplateLiteral(type) ? EvaluateTemplateLiteral(type.pattern) : IsUnion(type) ? EvaluateUnion(type.anyOf) : type;
}
function EvaluateUnionFast(types) {
  const result = guard_exports.IsEqual(types.length, 1) ? types[0] : guard_exports.IsEqual(types.length, 0) ? Never() : Union(types);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_enum.mjs
function FromEnumKey(values, value) {
  const unionKey = EvaluateEnum(values);
  const result = FromKey(unionKey, value);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_integer.mjs
function FromIntegerKey(_key, value) {
  const result = CreateRecord(IntegerKey, value);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_intersect.mjs
function FromIntersectKey(types, value) {
  const evaluatedKey = EvaluateIntersect(types);
  const result = FromKey(evaluatedKey, value);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_literal.mjs
function FromLiteralKey(key, value) {
  return guard_exports.IsString(key) || guard_exports.IsNumber(key) ? _Object_({ [key]: value }) : guard_exports.IsEqual(key, false) ? _Object_({ false: value }) : guard_exports.IsEqual(key, true) ? _Object_({ true: value }) : _Object_({});
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_number.mjs
function FromNumberKey(_key, value) {
  const result = CreateRecord(NumberKey, value);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_string.mjs
function FromStringKey(key, value) {
  return guard_exports.HasPropertyKey(key, "pattern") && (guard_exports.IsString(key.pattern) || key.pattern instanceof RegExp) ? CreateRecord(key.pattern.toString(), value) : CreateRecord(StringKey, value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_template_literal.mjs
function FromTemplateKey(pattern, value) {
  const types = ParsePatternIntoTypes(pattern);
  const finite = IsTemplateLiteralFinite(types);
  const result = finite ? FromKey(EvaluateTemplateLiteral(pattern), value) : CreateRecord(pattern, value);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/flatten.mjs
function FlattenType(type) {
  const result = IsUnion(type) ? Flatten(type.anyOf) : [type];
  return result;
}
function Flatten(types) {
  return types.reduce((result, type) => {
    return [...result, ...FlattenType(type)];
  }, []);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key_union.mjs
function StringOrNumberCheck(types) {
  return types.some((type) => IsString3(type) || IsNumber3(type) || IsInteger2(type));
}
function TryBuildRecord(types, value) {
  return guard_exports.IsEqual(StringOrNumberCheck(types), true) ? CreateRecord(StringKey, value) : void 0;
}
function CreateProperties(types, value) {
  return types.reduce((result, left) => {
    return IsLiteral(left) && (guard_exports.IsString(left.const) || guard_exports.IsNumber(left.const)) ? { ...result, [left.const]: value } : result;
  }, {});
}
function CreateObject(types, value) {
  const properties = CreateProperties(types, value);
  const result = _Object_(properties);
  return result;
}
function FromUnionKey(types, value) {
  const flattened = Flatten(types);
  const record = TryBuildRecord(flattened, value);
  return IsSchema(record) ? record : CreateObject(flattened, value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/from_key.mjs
function FromKey(key, value) {
  const result = IsAny(key) ? FromAnyKey(value) : IsBoolean3(key) ? FromBooleanKey(value) : IsEnum(key) ? FromEnumKey(key.enum, value) : IsInteger2(key) ? FromIntegerKey(key, value) : IsIntersect(key) ? FromIntersectKey(key.allOf, value) : IsLiteral(key) ? FromLiteralKey(key.const, value) : IsNumber3(key) ? FromNumberKey(key, value) : IsUnion(key) ? FromUnionKey(key.anyOf, value) : IsString3(key) ? FromStringKey(key, value) : IsTemplateLiteral(key) ? FromTemplateKey(key.pattern, value) : _Object_({});
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/record/instantiate.mjs
function RecordAction(key, value, options) {
  const result = CanInstantiate([key]) ? memory_exports.Update(FromKey(key, value), {}, options) : RecordDeferred(key, value, options);
  return result;
}
function RecordInstantiate(context, state, key, value, options) {
  const instantiatedKey = InstantiateType(context, state, key);
  const instantiatedValue = InstantiateType(context, state, value);
  return RecordAction(instantiatedKey, instantiatedValue, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/record.mjs
var IntegerKey = `^${IntegerPattern}$`;
var NumberKey = `^${NumberPattern}$`;
var StringKey = `^${StringPattern}$`;
function RecordDeferred(key, value, options = {}) {
  return Deferred("Record", [key, value], options);
}
function Record(key, value, options = {}) {
  return RecordAction(key, value, options);
}
function RecordFromPattern(pattern, value) {
  return CreateRecord(pattern, value);
}
function RecordPatternToType(pattern) {
  const result = guard_exports.IsEqual(pattern, StringKey) ? String2() : guard_exports.IsEqual(pattern, IntegerKey) ? Integer() : guard_exports.IsEqual(pattern, NumberKey) ? Number2() : TemplateLiteralDecodeUnsafe(pattern);
  return result;
}
function RecordPattern(type) {
  return guard_exports.Keys(type.patternProperties)[0];
}
function RecordKey(type) {
  const pattern = RecordPattern(type);
  const result = RecordPatternToType(pattern);
  return result;
}
function RecordValue(type) {
  return type.patternProperties[RecordPattern(type)];
}
function IsRecord(value) {
  return IsKind(value, "Record");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/rest.mjs
function Rest(type) {
  return memory_exports.Create({ "~kind": "Rest" }, { type: "rest", items: type }, {});
}
function IsRest(value) {
  return IsKind(value, "Rest");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/this.mjs
function This(options) {
  return memory_exports.Create({ ["~kind"]: "This" }, { $ref: "#" }, options);
}
function IsThis(value) {
  return IsKind(value, "This");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/undefined.mjs
function Undefined(options) {
  return memory_exports.Create({ "~kind": "Undefined" }, { type: "undefined" }, options);
}
function IsUndefined2(value) {
  return IsKind(value, "Undefined");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/void.mjs
function Void(options) {
  return memory_exports.Create({ "~kind": "Void" }, { type: "void" }, options);
}
function IsVoid(value) {
  return IsKind(value, "Void");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/mapping.mjs
function IntrinsicOrCall(ref, parameters) {
  return guard_exports.IsEqual(ref, "Array") ? _Array_(parameters[0]) : guard_exports.IsEqual(ref, "Capitalize") ? CapitalizeDeferred(parameters[0]) : guard_exports.IsEqual(ref, "ConstructorParameters") ? ConstructorParametersDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Evaluate") ? EvaluateDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Exclude") ? ExcludeDeferred(parameters[0], parameters[1]) : guard_exports.IsEqual(ref, "Extract") ? ExtractDeferred(parameters[0], parameters[1]) : guard_exports.IsEqual(ref, "Index") ? IndexDeferred(parameters[0], parameters[1]) : guard_exports.IsEqual(ref, "InstanceType") ? InstanceTypeDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Lowercase") ? LowercaseDeferred(parameters[0]) : guard_exports.IsEqual(ref, "NonNullable") ? NonNullableDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Omit") ? OmitDeferred(parameters[0], parameters[1]) : guard_exports.IsEqual(ref, "Parameters") ? ParametersDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Partial") ? PartialDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Pick") ? PickDeferred(parameters[0], parameters[1]) : guard_exports.IsEqual(ref, "Readonly") ? ReadonlyObjectDeferred(parameters[0]) : guard_exports.IsEqual(ref, "KeyOf") ? KeyOfDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Record") ? RecordDeferred(parameters[0], parameters[1]) : guard_exports.IsEqual(ref, "Required") ? RequiredDeferred(parameters[0]) : guard_exports.IsEqual(ref, "ReturnType") ? ReturnTypeDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Uncapitalize") ? UncapitalizeDeferred(parameters[0]) : guard_exports.IsEqual(ref, "Uppercase") ? UppercaseDeferred(parameters[0]) : CallConstruct(Ref(ref), parameters);
}
function Unreachable2() {
  throw Error("Unreachable");
}
var DelimitedDecode = (input, result = []) => {
  return input.reduce((result2, left) => {
    return guard_exports.IsArray(left) && guard_exports.IsEqual(left.length, 2) ? [...result2, left[0]] : [...result2, left];
  }, []);
};
var Delimited = (input) => {
  const [left, right] = input;
  return DelimitedDecode([...left, ...right]);
};
function GenericParameterExtendsEqualsMapping(input) {
  return Parameter(input[0], input[2], input[4]);
}
function GenericParameterExtendsMapping(input) {
  return Parameter(input[0], input[2], input[2]);
}
function GenericParameterEqualsMapping(input) {
  return Parameter(input[0], Unknown(), input[2]);
}
function GenericParameterIdentifierMapping(input) {
  return Parameter(input, Unknown(), Unknown());
}
function GenericParameterMapping(input) {
  return input;
}
function GenericParameterListMapping(input) {
  return Delimited(input);
}
function GenericParametersMapping(input) {
  return input[1];
}
function GenericCallArgumentListMapping(input) {
  return Delimited(input);
}
function GenericCallArgumentsMapping(input) {
  return input[1];
}
function GenericCallMapping(input) {
  return IntrinsicOrCall(input[0], input[1]);
}
function OptionalSemiColonMapping(input) {
  return null;
}
function KeywordStringMapping(input) {
  return String2();
}
function KeywordNumberMapping(input) {
  return Number2();
}
function KeywordBooleanMapping(input) {
  return Boolean2();
}
function KeywordUndefinedMapping(input) {
  return Undefined();
}
function KeywordNullMapping(input) {
  return Null();
}
function KeywordIntegerMapping(input) {
  return Integer();
}
function KeywordBigIntMapping(input) {
  return BigInt2();
}
function KeywordUnknownMapping(input) {
  return Unknown();
}
function KeywordAnyMapping(input) {
  return Any();
}
function KeywordObjectMapping(input) {
  return _Object_({});
}
function KeywordNeverMapping(input) {
  return Never();
}
function KeywordSymbolMapping(input) {
  return Symbol2();
}
function KeywordVoidMapping(input) {
  return Void();
}
function KeywordThisMapping(input) {
  return This();
}
function LiteralBigIntMapping(input) {
  return Literal(BigInt(input));
}
function LiteralBooleanMapping(input) {
  return Literal(guard_exports.IsEqual(input, "true"));
}
function LiteralNumberMapping(input) {
  return Literal(parseFloat(input));
}
function LiteralStringMapping(input) {
  return Literal(input);
}
function TemplateInterpolateMapping(input) {
  return input[1];
}
function TemplateSpanMapping(input) {
  return Literal(input);
}
function TemplateBodyMapping(input) {
  return guard_exports.IsEqual(input.length, 3) ? [input[0], input[1], ...input[2]] : [input[0]];
}
function TemplateLiteralTypesMapping(input) {
  return input[1];
}
function TemplateLiteralMapping(input) {
  return TemplateLiteralDeferred(input);
}
function DependentMapping(input) {
  return guard_exports.IsEqual(input.length, 6) ? Dependent(input[1], input[3], input[5]) : Dependent(input[1], input[3], Unknown());
}
function KeyOfMapping(input) {
  return input.length > 0;
}
function IndexArrayMapping(input) {
  return input.reduce((result, current) => {
    return guard_exports.IsEqual(current.length, 3) ? [...result, [current[1]]] : [...result, []];
  }, []);
}
function ExtendsMapping(input) {
  return guard_exports.IsEqual(input.length, 6) ? [input[1], input[3], input[5]] : [];
}
function BaseMapping(input) {
  return guard_exports.IsArray(input) && guard_exports.IsEqual(input.length, 3) ? input[1] : input;
}
function WithMapping(input) {
  return guard_exports.IsEqual(input.length, 2) ? input[1] : [];
}
function FactorIndexArray(Type2, indexArray) {
  return indexArray.reduce((result, left) => {
    const _left = left;
    return guard_exports.IsEqual(_left.length, 1) ? IndexDeferred(result, _left[0]) : guard_exports.IsEqual(_left.length, 0) ? _Array_(result) : Unreachable2();
  }, Type2);
}
function FactorExtends(type, extend) {
  return guard_exports.IsEqual(extend.length, 3) ? ConditionalDeferred(type, extend[0], extend[1], extend[2]) : type;
}
function FactorWith(type, withClause) {
  return guard_exports.IsArray(withClause) && guard_exports.IsEqual(withClause.length, 0) ? type : WithDeferred(type, withClause);
}
function FactorMapping(input) {
  const [keyOf, type, indexArray, extend, withClause] = input;
  return FactorWith(keyOf ? FactorExtends(KeyOfDeferred(FactorIndexArray(type, indexArray)), extend) : FactorExtends(FactorIndexArray(type, indexArray), extend), withClause);
}
function ExprBinaryMapping(left, rest) {
  return guard_exports.IsEqual(rest.length, 3) ? (() => {
    const [operator, right, next] = rest;
    const Schema = ExprBinaryMapping(right, next);
    if (guard_exports.IsEqual(operator, "&")) {
      return IsIntersect(Schema) ? Intersect([left, ...Schema.allOf]) : Intersect([left, Schema]);
    }
    if (guard_exports.IsEqual(operator, "|")) {
      return IsUnion(Schema) ? Union([left, ...Schema.anyOf]) : Union([left, Schema]);
    }
    Unreachable2();
  })() : left;
}
function ExprTermTailMapping(input) {
  return input;
}
function ExprTermMapping(input) {
  const [left, rest] = input;
  return ExprBinaryMapping(left, rest);
}
function ExprTailMapping(input) {
  return input;
}
function ExprMapping(input) {
  const [left, rest] = input;
  return ExprBinaryMapping(left, rest);
}
function ExprReadonlyMapping(input) {
  return AddImmutableDeferred(input[1]);
}
function ExprPipeMapping(input) {
  return input[1];
}
function GenericTypeMapping(input) {
  return Generic(input[0], input[2]);
}
function InferTypeMapping(input) {
  return guard_exports.IsEqual(input.length, 4) ? Infer(input[1], input[3]) : guard_exports.IsEqual(input.length, 2) ? Infer(input[1], Unknown()) : Unreachable2();
}
function TypeMapping(input) {
  return input;
}
function PropertyKeyNumberMapping(input) {
  return `${input}`;
}
function PropertyKeyIdentMapping(input) {
  return input;
}
function PropertyKeyQuotedMapping(input) {
  return input;
}
function PropertyKeyIndexMapping(input) {
  return IsInteger2(input[3]) ? IntegerKey : IsNumber3(input[3]) ? NumberKey : IsSymbol2(input[3]) ? StringKey : IsString3(input[3]) ? StringKey : Unreachable2();
}
function PropertyKeyMapping(input) {
  return input;
}
function ReadonlyMapping(input) {
  return input.length > 0;
}
function OptionalMapping(input) {
  return input.length > 0;
}
function PropertyMapping(input) {
  const [isReadonly, key, isOptional, _colon, type] = input;
  return {
    [key]: isReadonly && isOptional ? AddReadonlyDeferred(AddOptionalDeferred(type)) : isReadonly && !isOptional ? AddReadonlyDeferred(type) : !isReadonly && isOptional ? AddOptionalDeferred(type) : type
  };
}
function PropertyDelimiterMapping(input) {
  return input;
}
function PropertyListMapping(input) {
  return Delimited(input);
}
function PropertiesReduce(propertyList) {
  return propertyList.reduce((result, left) => {
    const isPatternProperties = guard_exports.HasPropertyKey(left, IntegerKey) || guard_exports.HasPropertyKey(left, NumberKey) || guard_exports.HasPropertyKey(left, StringKey);
    return isPatternProperties ? [result[0], memory_exports.Assign(result[1], left)] : [memory_exports.Assign(result[0], left), result[1]];
  }, [{}, {}]);
}
function PropertiesMapping(input) {
  return PropertiesReduce(input[1]);
}
function _Object_Mapping(input) {
  const [properties, patternProperties] = input;
  const options = guard_exports.IsEqual(guard_exports.Keys(patternProperties).length, 0) ? {} : { patternProperties };
  return _Object_(properties, options);
}
function ElementNamedMapping(input) {
  return guard_exports.IsEqual(input.length, 5) ? AddReadonlyDeferred(AddOptionalDeferred(input[4])) : guard_exports.IsEqual(input.length, 3) ? input[2] : guard_exports.IsEqual(input.length, 4) ? guard_exports.IsEqual(input[2], "readonly") ? AddReadonlyDeferred(input[3]) : AddOptionalDeferred(input[3]) : Unreachable2();
}
function ElementReadonlyOptionalMapping(input) {
  return AddReadonlyDeferred(AddOptionalDeferred(input[1]));
}
function ElementReadonlyMapping(input) {
  return AddReadonlyDeferred(input[1]);
}
function ElementOptionalMapping(input) {
  return AddOptionalDeferred(input[0]);
}
function ElementBaseMapping(input) {
  return input;
}
function ElementMapping(input) {
  return guard_exports.IsEqual(input.length, 2) ? Rest(input[1]) : guard_exports.IsEqual(input.length, 1) ? input[0] : Unreachable2();
}
function ElementListMapping(input) {
  return Delimited(input);
}
function _Tuple_Mapping(input) {
  return Tuple(input[1]);
}
function ParameterReadonlyOptionalMapping(input) {
  return AddReadonlyDeferred(AddOptionalDeferred(input[4]));
}
function ParameterReadonlyMapping(input) {
  return AddReadonlyDeferred(input[3]);
}
function ParameterOptionalMapping(input) {
  return AddOptionalDeferred(input[3]);
}
function ParameterTypeMapping(input) {
  return input[2];
}
function ParameterBaseMapping(input) {
  return input;
}
function ParameterMapping(input) {
  return guard_exports.IsEqual(input.length, 2) ? Rest(input[1]) : guard_exports.IsEqual(input.length, 1) ? input[0] : Unreachable2();
}
function ParameterListMapping(input) {
  return Delimited(input);
}
function _Function_Mapping(input) {
  return _Function_(input[1], input[4]);
}
function _Constructor_Mapping(input) {
  return Constructor(input[2], input[5]);
}
function ApplyReadonly(state, type) {
  return guard_exports.IsEqual(state, "remove") ? RemoveReadonlyDeferred(type) : guard_exports.IsEqual(state, "add") ? AddReadonlyDeferred(type) : type;
}
function MappedReadonlyMapping(input) {
  return guard_exports.IsEqual(input.length, 2) && guard_exports.IsEqual(input[0], "-") ? "remove" : guard_exports.IsEqual(input.length, 2) && guard_exports.IsEqual(input[0], "+") ? "add" : guard_exports.IsEqual(input.length, 1) ? "add" : "none";
}
function ApplyOptional(state, type) {
  return guard_exports.IsEqual(state, "remove") ? RemoveOptionalDeferred(type) : guard_exports.IsEqual(state, "add") ? AddOptionalDeferred(type) : type;
}
function MappedOptionalMapping(input) {
  return guard_exports.IsEqual(input.length, 2) && guard_exports.IsEqual(input[0], "-") ? "remove" : guard_exports.IsEqual(input.length, 2) && guard_exports.IsEqual(input[0], "+") ? "add" : guard_exports.IsEqual(input.length, 1) ? "add" : "none";
}
function MappedAsMapping(input) {
  return guard_exports.IsEqual(input.length, 2) ? [input[1]] : [];
}
function _Mapped_Mapping(input) {
  return guard_exports.IsArray(input[6]) && guard_exports.IsEqual(input[6].length, 1) ? MappedDeferred(Identifier(input[3]), input[5], input[6][0], ApplyReadonly(input[1], ApplyOptional(input[8], input[10]))) : MappedDeferred(Identifier(input[3]), input[5], Ref(input[3]), ApplyReadonly(input[1], ApplyOptional(input[8], input[10])));
}
function ReferenceMapping(input) {
  return Ref(input);
}
function WithBigIntMapping(input) {
  return BigInt(input);
}
function WithNumberMapping(input) {
  return parseFloat(input);
}
function WithBooleanMapping(input) {
  return guard_exports.IsEqual(input, "true");
}
function WithStringMapping(input) {
  return input;
}
function WithNullMapping(input) {
  return null;
}
function WithUndefinedMapping(input) {
  return void 0;
}
function WithPropertyMapping(input) {
  return { [input[0]]: input[2] };
}
function WithPropertyListMapping(input) {
  return Delimited(input);
}
function WithObjectMappingReduce(propertyList) {
  return propertyList.reduce((result, left) => {
    return memory_exports.Assign(result, left);
  }, {});
}
function WithObjectMapping(input) {
  return WithObjectMappingReduce(input[1]);
}
function WithElementListMapping(input) {
  return Delimited(input);
}
function WithArrayMapping(input) {
  return input[1];
}
function WithValueMapping(input) {
  return input;
}
function PatternBigIntMapping(input) {
  return BigInt2();
}
function PatternStringMapping(input) {
  return String2();
}
function PatternNumberMapping(input) {
  return Number2();
}
function PatternIntegerMapping(input) {
  return Integer();
}
function PatternNeverMapping(input) {
  return Never();
}
function PatternTextMapping(input) {
  return Literal(input);
}
function PatternBaseMapping(input) {
  return input;
}
function PatternGroupMapping(input) {
  return Union(input[1]);
}
function PatternUnionMapping(input) {
  return input.length === 3 ? [...input[0], ...input[2]] : input.length === 1 ? [...input[0]] : [];
}
function PatternTermMapping(input) {
  return [input[0], ...input[1]];
}
function PatternBodyMapping(input) {
  return input;
}
function PatternMapping(input) {
  return input[1];
}
function InterfaceDeclarationHeritageListMapping(input) {
  return Delimited(input);
}
function InterfaceDeclarationHeritageMapping(input) {
  return guard_exports.IsEqual(input.length, 2) ? input[1] : [];
}
function InterfaceDeclarationGenericMapping(input) {
  const parameters = input[2];
  const heritage = input[3];
  const [properties, patternProperties] = input[4];
  const options = guard_exports.IsEqual(guard_exports.Keys(patternProperties).length, 0) ? {} : { patternProperties };
  return { [input[1]]: Generic(parameters, InterfaceDeferred(heritage, properties, options)) };
}
function InterfaceDeclarationMapping(input) {
  const heritage = input[2];
  const [properties, patternProperties] = input[3];
  const options = guard_exports.IsEqual(guard_exports.Keys(patternProperties).length, 0) ? {} : { patternProperties };
  return { [input[1]]: InterfaceDeferred(heritage, properties, options) };
}
function TypeAliasDeclarationGenericMapping(input) {
  return { [input[1]]: Generic(input[2], input[4]) };
}
function TypeAliasDeclarationMapping(input) {
  return { [input[1]]: input[3] };
}
function ExportKeywordMapping(input) {
  return null;
}
function ModuleDeclarationDelimiterMapping(input) {
  return input;
}
function ModuleDeclarationListMapping(input) {
  return PropertiesReduce(Delimited(input));
}
function ModuleDeclarationMapping(input) {
  return input[1];
}
function ModuleMapping(input) {
  const moduleDeclaration = input[0];
  const moduleDeclarationList = input[1];
  return ModuleDeferred(memory_exports.Assign(moduleDeclaration, moduleDeclarationList[0]));
}
function ScriptMapping(input) {
  return input;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/internal/match.mjs
function IsMatch(value) {
  return IsEqual(value.length, 2);
}
function Match2(input, ok, fail) {
  return IsMatch(input) ? ok(input[0], input[1]) : fail();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/internal/take.mjs
function TakeVariant(variant, input) {
  return IsEqual(input.indexOf(variant), 0) ? [variant, input.slice(variant.length)] : [];
}
function Take(variants, input) {
  for (let i = 0; i < variants.length; i++) {
    const result = TakeVariant(variants[i], input);
    if (IsMatch(result))
      return result;
  }
  return [];
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/internal/char.mjs
function Range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => String.fromCharCode(start + i));
}
var Alpha = [
  ...Range(97, 122),
  // Lowercase
  ...Range(65, 90)
  // Uppercase
];
var Zero = "0";
var NonZero = Range(49, 57);
var Digit = [Zero, ...NonZero];
var WhiteSpace = " ";
var NewLine = "\n";
var UnderScore = "_";
var Dot = ".";
var DollarSign = "$";
var Hyphen = "-";

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/internal/trim.mjs
var LineComment = "//";
var OpenComment = "/*";
var CloseComment = "*/";
function DiscardMultilineComment(input) {
  const index = input.indexOf(CloseComment);
  const result = IsEqual(index, -1) ? "" : input.slice(index + 2);
  return result;
}
function DiscardLineComment(input) {
  const index = input.indexOf(NewLine);
  const result = IsEqual(index, -1) ? "" : input.slice(index);
  return result;
}
function TrimStartUntilNewline(input) {
  return input.replace(/^[ \t\r\f\v]+/, "");
}
function TrimWhitespace(input) {
  const trimmed = TrimStartUntilNewline(input);
  return trimmed.startsWith(OpenComment) ? TrimWhitespace(DiscardMultilineComment(trimmed.slice(2))) : trimmed.startsWith(LineComment) ? TrimWhitespace(DiscardLineComment(trimmed.slice(2))) : trimmed;
}
function Trim(input) {
  const trimmed = input.trimStart();
  return trimmed.startsWith(OpenComment) ? Trim(DiscardMultilineComment(trimmed.slice(2))) : trimmed.startsWith(LineComment) ? Trim(DiscardLineComment(trimmed.slice(2))) : trimmed;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/internal/optional.mjs
function Optional2(value, input) {
  return Match2(Take([value], input), (Optional4, Rest2) => [Optional4, Rest2], () => ["", input]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/internal/many.mjs
function IsDiscard(discard, input) {
  return discard.includes(input);
}
function Many(allowed, discard, input, result = "") {
  return Match2(Take(allowed, input), (Char, Rest2) => IsDiscard(discard, Char) ? Many(allowed, discard, Rest2, result) : Many(allowed, discard, Rest2, `${result}${Char}`), () => [result, input]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/unsigned_integer.mjs
function TakeNonZero(input) {
  return Take(NonZero, input);
}
var AllowedDigits = [...Digit, UnderScore];
function TakeDigits(input) {
  return Many(AllowedDigits, [UnderScore], input);
}
function TakeUnsignedInteger(input) {
  return Match2(Take([Zero], input), (Zero2, ZeroRest) => [Zero2, ZeroRest], () => Match2(
    TakeNonZero(input),
    (NonZero2, NonZeroRest) => Match2(TakeDigits(NonZeroRest), (Digits, DigitsRest) => [`${NonZero2}${Digits}`, DigitsRest], () => []),
    // fail: did not match Digits
    () => []
  ));
}
function UnsignedInteger(input) {
  return TakeUnsignedInteger(Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/integer.mjs
function TakeSign(input) {
  return Optional2(Hyphen, input);
}
function TakeSignedInteger(input) {
  return Match2(
    TakeSign(input),
    (Sign, SignRest) => Match2(UnsignedInteger(SignRest), (UnsignedInteger2, UnsignedIntegerRest) => [`${Sign}${UnsignedInteger2}`, UnsignedIntegerRest], () => []),
    // fail: did not match unsigned integer
    () => []
  );
}
function Integer2(input) {
  return TakeSignedInteger(Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/bigint.mjs
function TakeBigInt(input) {
  return Match2(
    Integer2(input),
    (Integer3, IntegerRest) => Match2(Take(["n"], IntegerRest), (_N, NRest) => [`${Integer3}`, NRest], () => []),
    // fail: did not match 'n'
    () => []
  );
}
function BigInt3(input) {
  return TakeBigInt(input);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/const.mjs
function TakeConst(const_, input) {
  return Take([const_], input);
}
function Const(const_, input) {
  return IsEqual(const_, "") ? ["", input] : const_.startsWith(NewLine) ? TakeConst(const_, TrimWhitespace(input)) : const_.startsWith(WhiteSpace) ? TakeConst(const_, input) : TakeConst(const_, Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/ident.mjs
var Initial = [...Alpha, UnderScore, DollarSign];
function TakeInitial(input) {
  return Take(Initial, input);
}
var Remaining = [...Initial, ...Digit];
function TakeRemaining(input, result = "") {
  return Match2(Take(Remaining, input), (Remaining2, RemainingRest) => TakeRemaining(RemainingRest, `${result}${Remaining2}`), () => [result, input]);
}
function TakeIdent(input) {
  return Match2(
    TakeInitial(input),
    (Initial2, InitialRest) => Match2(TakeRemaining(InitialRest), (Remaining2, RemainingRest) => [`${Initial2}${Remaining2}`, RemainingRest], () => []),
    // fail: did not match Remaining
    () => []
  );
}
function Ident(input) {
  return TakeIdent(Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/unsigned_number.mjs
var AllowedDigits2 = [...Digit, UnderScore];
function IsLeadingDot(input) {
  return IsMatch(Take([Dot], input));
}
function TakeFractional(input) {
  return Match2(Many(AllowedDigits2, [UnderScore], input), (Digits, DigitsRest) => IsEqual(Digits, "") ? [] : [Digits, DigitsRest], () => []);
}
function LeadingDot(input) {
  return Match2(
    Take([Dot], input),
    (Dot2, DotRest) => Match2(TakeFractional(DotRest), (Fractional, FractionalRest) => [`0${Dot2}${Fractional}`, FractionalRest], () => []),
    // fail: did not match Fractional
    () => []
  );
}
function LeadingInteger(input) {
  return Match2(
    UnsignedInteger(input),
    (Integer3, IntegerRest) => Match2(
      Take([Dot], IntegerRest),
      (Dot2, DotRest) => Match2(TakeFractional(DotRest), (Fractional, FractionalRest) => [`${Integer3}${Dot2}${Fractional}`, FractionalRest], () => [`${Integer3}`, DotRest]),
      // fail: did not match Fractional, use Integer
      () => [`${Integer3}`, IntegerRest]
    ),
    // fail: did not match Dot, use Integer
    () => []
  );
}
function TakeUnsignedNumber(input) {
  return IsLeadingDot(input) ? LeadingDot(input) : LeadingInteger(input);
}
function UnsignedNumber(input) {
  return TakeUnsignedNumber(Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/number.mjs
function TakeSign2(input) {
  return Optional2(Hyphen, input);
}
function TakeSignedNumber(input) {
  return Match2(
    TakeSign2(input),
    (Sign, SignRest) => Match2(UnsignedNumber(SignRest), (UnsignedInteger2, UnsignedIntegerRest) => [`${Sign}${UnsignedInteger2}`, UnsignedIntegerRest], () => []),
    // fail: did not match unsigned integer
    () => []
  );
}
function Number3(input) {
  return TakeSignedNumber(Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/until.mjs
function TakeOne(input) {
  const result = IsEqual(input, "") ? [] : [input.slice(0, 1), input.slice(1)];
  return result;
}
function IsInputMatchSentinal(end, input) {
  return ShiftLeft(end, (left, right) => input.startsWith(left) ? true : IsInputMatchSentinal(right, input), () => false);
}
function Until(end, input, result = "") {
  return Match2(
    TakeOne(input),
    (One, Rest2) => IsInputMatchSentinal(end, input) ? [result, input] : Until(end, Rest2, `${result}${One}`),
    () => []
  );
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/span.mjs
function MultiLine(start, end, input) {
  return Match2(
    Take([start], input),
    (_, Rest2) => Match2(
      Until([end], Rest2),
      (Until2, UntilRest) => Match2(Take([end], UntilRest), (_2, Rest3) => [`${Until2}`, Rest3], () => []),
      // fail: did not match End
      () => []
    ),
    // fail: did not match Until
    () => []
  );
}
function SingleLine(start, end, input) {
  return Match2(
    Take([start], input),
    (_, Rest2) => Match2(
      Until([NewLine, end], Rest2),
      (Until2, UntilRest) => Match2(Take([end], UntilRest), (_2, EndRest) => [`${Until2}`, EndRest], () => []),
      // fail: did not match End
      () => []
    ),
    // fail: did not match Until
    () => []
  );
}
function Span(start, end, multiLine, input) {
  return multiLine ? MultiLine(start, end, Trim(input)) : SingleLine(start, end, Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/string.mjs
function TakeInitial2(quotes, input) {
  return Take(quotes, input);
}
function TakeSpan(quote, input) {
  return Span(quote, quote, false, input);
}
function TakeString(quotes, input) {
  return Match2(TakeInitial2(quotes, input), (Initial2, InitialRest) => TakeSpan(Initial2, `${Initial2}${InitialRest}`), () => []);
}
function String3(quotes, input) {
  return TakeString(quotes, Trim(input));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/token/until_1.mjs
function Until_1(end, input) {
  return Match2(Until(end, input), (Until2, UntilRest) => IsEqual(Until2, "") ? [] : [Until2, UntilRest], () => []);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/parser.mjs
var If = (result, left, right = () => []) => result.length === 2 ? left(result) : right();
var GenericParameterExtendsEquals = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("extends", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => If(Const("=", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [GenericParameterExtendsEqualsMapping(_0), input2]);
var GenericParameterExtends = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("extends", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericParameterExtendsMapping(_0), input2]);
var GenericParameterEquals = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("=", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericParameterEqualsMapping(_0), input2]);
var GenericParameterIdentifier = (input) => If(Ident(input), ([_0, input2]) => [GenericParameterIdentifierMapping(_0), input2]);
var GenericParameter = (input) => If(If(GenericParameterExtendsEquals(input), ([_0, input2]) => [_0, input2], () => If(GenericParameterExtends(input), ([_0, input2]) => [_0, input2], () => If(GenericParameterEquals(input), ([_0, input2]) => [_0, input2], () => If(GenericParameterIdentifier(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [GenericParameterMapping(_0), input2]);
var GenericParameterList_0 = (input, result = []) => If(If(GenericParameter(input), ([_0, input2]) => If(Const(",", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => GenericParameterList_0(input2, [...result, _0]), () => [result, input]);
var GenericParameterList = (input) => If(If(GenericParameterList_0(input), ([_0, input2]) => If(If(If(GenericParameter(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [GenericParameterListMapping(_0), input2]);
var GenericParameters = (input) => If(If(Const("<", input), ([_0, input2]) => If(GenericParameterList(input2), ([_1, input3]) => If(Const(">", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericParametersMapping(_0), input2]);
var GenericCallArgumentList_0 = (input, result = []) => If(If(Type(input), ([_0, input2]) => If(Const(",", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => GenericCallArgumentList_0(input2, [...result, _0]), () => [result, input]);
var GenericCallArgumentList = (input) => If(If(GenericCallArgumentList_0(input), ([_0, input2]) => If(If(If(Type(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [GenericCallArgumentListMapping(_0), input2]);
var GenericCallArguments = (input) => If(If(Const("<", input), ([_0, input2]) => If(GenericCallArgumentList(input2), ([_1, input3]) => If(Const(">", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericCallArgumentsMapping(_0), input2]);
var GenericCall = (input) => If(If(Ident(input), ([_0, input2]) => If(GenericCallArguments(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [GenericCallMapping(_0), input2]);
var OptionalSemiColon = (input) => If(If(If(Const(";", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [OptionalSemiColonMapping(_0), input2]);
var KeywordString = (input) => If(Const("string", input), ([_0, input2]) => [KeywordStringMapping(_0), input2]);
var KeywordNumber = (input) => If(Const("number", input), ([_0, input2]) => [KeywordNumberMapping(_0), input2]);
var KeywordBoolean = (input) => If(Const("boolean", input), ([_0, input2]) => [KeywordBooleanMapping(_0), input2]);
var KeywordUndefined = (input) => If(Const("undefined", input), ([_0, input2]) => [KeywordUndefinedMapping(_0), input2]);
var KeywordNull = (input) => If(Const("null", input), ([_0, input2]) => [KeywordNullMapping(_0), input2]);
var KeywordInteger = (input) => If(Const("integer", input), ([_0, input2]) => [KeywordIntegerMapping(_0), input2]);
var KeywordBigInt = (input) => If(Const("bigint", input), ([_0, input2]) => [KeywordBigIntMapping(_0), input2]);
var KeywordUnknown = (input) => If(Const("unknown", input), ([_0, input2]) => [KeywordUnknownMapping(_0), input2]);
var KeywordAny = (input) => If(Const("any", input), ([_0, input2]) => [KeywordAnyMapping(_0), input2]);
var KeywordObject = (input) => If(Const("object", input), ([_0, input2]) => [KeywordObjectMapping(_0), input2]);
var KeywordNever = (input) => If(Const("never", input), ([_0, input2]) => [KeywordNeverMapping(_0), input2]);
var KeywordSymbol = (input) => If(Const("symbol", input), ([_0, input2]) => [KeywordSymbolMapping(_0), input2]);
var KeywordVoid = (input) => If(Const("void", input), ([_0, input2]) => [KeywordVoidMapping(_0), input2]);
var KeywordThis = (input) => If(Const("this", input), ([_0, input2]) => [KeywordThisMapping(_0), input2]);
var TemplateInterpolate = (input) => If(If(Const("${", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("}", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [TemplateInterpolateMapping(_0), input2]);
var TemplateSpan = (input) => If(Until(["${", "`"], input), ([_0, input2]) => [TemplateSpanMapping(_0), input2]);
var TemplateBody = (input) => If(If(If(TemplateSpan(input), ([_0, input2]) => If(TemplateInterpolate(input2), ([_1, input3]) => If(TemplateBody(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(If(TemplateSpan(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(TemplateSpan(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [TemplateBodyMapping(_0), input2]);
var TemplateLiteralTypes = (input) => If(If(Const("`", input), ([_0, input2]) => If(TemplateBody(input2), ([_1, input3]) => If(Const("`", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [TemplateLiteralTypesMapping(_0), input2]);
var TemplateLiteral = (input) => If(TemplateLiteralTypes(input), ([_0, input2]) => [TemplateLiteralMapping(_0), input2]);
var Dependent2 = (input) => If(If(If(Const("if", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("then", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => If(Const("else", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => [[_0, _1, _2, _3, _4, _5], input7])))))), ([_0, input2]) => [_0, input2], () => If(If(Const("if", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("then", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [DependentMapping(_0), input2]);
var LiteralBigInt = (input) => If(BigInt3(input), ([_0, input2]) => [LiteralBigIntMapping(_0), input2]);
var LiteralBoolean = (input) => If(If(Const("true", input), ([_0, input2]) => [_0, input2], () => If(Const("false", input), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [LiteralBooleanMapping(_0), input2]);
var LiteralNumber = (input) => If(Number3(input), ([_0, input2]) => [LiteralNumberMapping(_0), input2]);
var LiteralString = (input) => If(String3(["'", '"'], input), ([_0, input2]) => [LiteralStringMapping(_0), input2]);
var KeyOf = (input) => If(If(If(Const("keyof", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [KeyOfMapping(_0), input2]);
var IndexArray_0 = (input, result = []) => If(If(If(Const("[", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("]", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(If(Const("[", input), ([_0, input2]) => If(Const("]", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => IndexArray_0(input2, [...result, _0]), () => [result, input]);
var IndexArray = (input) => If(IndexArray_0(input), ([_0, input2]) => [IndexArrayMapping(_0), input2]);
var Extends2 = (input) => If(If(If(Const("extends", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("?", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => If(Const(":", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => [[_0, _1, _2, _3, _4, _5], input7])))))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExtendsMapping(_0), input2]);
var Base = (input) => If(If(If(Const("(", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const(")", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(KeywordString(input), ([_0, input2]) => [_0, input2], () => If(KeywordNumber(input), ([_0, input2]) => [_0, input2], () => If(KeywordBoolean(input), ([_0, input2]) => [_0, input2], () => If(KeywordUndefined(input), ([_0, input2]) => [_0, input2], () => If(KeywordNull(input), ([_0, input2]) => [_0, input2], () => If(KeywordInteger(input), ([_0, input2]) => [_0, input2], () => If(KeywordBigInt(input), ([_0, input2]) => [_0, input2], () => If(KeywordUnknown(input), ([_0, input2]) => [_0, input2], () => If(KeywordAny(input), ([_0, input2]) => [_0, input2], () => If(KeywordObject(input), ([_0, input2]) => [_0, input2], () => If(KeywordNever(input), ([_0, input2]) => [_0, input2], () => If(KeywordSymbol(input), ([_0, input2]) => [_0, input2], () => If(KeywordVoid(input), ([_0, input2]) => [_0, input2], () => If(KeywordThis(input), ([_0, input2]) => [_0, input2], () => If(LiteralBigInt(input), ([_0, input2]) => [_0, input2], () => If(LiteralBoolean(input), ([_0, input2]) => [_0, input2], () => If(LiteralNumber(input), ([_0, input2]) => [_0, input2], () => If(LiteralString(input), ([_0, input2]) => [_0, input2], () => If(TemplateLiteral(input), ([_0, input2]) => [_0, input2], () => If(Dependent2(input), ([_0, input2]) => [_0, input2], () => If(_Object_2(input), ([_0, input2]) => [_0, input2], () => If(_Tuple_(input), ([_0, input2]) => [_0, input2], () => If(_Constructor_(input), ([_0, input2]) => [_0, input2], () => If(_Function_2(input), ([_0, input2]) => [_0, input2], () => If(_Mapped_(input), ([_0, input2]) => [_0, input2], () => If(GenericCall(input), ([_0, input2]) => [_0, input2], () => If(Reference(input), ([_0, input2]) => [_0, input2], () => [])))))))))))))))))))))))))))), ([_0, input2]) => [BaseMapping(_0), input2]);
var With = (input) => If(If(If(Const("with", input), ([_0, input2]) => If(WithObject(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [WithMapping(_0), input2]);
var Factor = (input) => If(If(KeyOf(input), ([_0, input2]) => If(Base(input2), ([_1, input3]) => If(IndexArray(input3), ([_2, input4]) => If(Extends2(input4), ([_3, input5]) => If(With(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [FactorMapping(_0), input2]);
var ExprTermTail = (input) => If(If(If(Const("&", input), ([_0, input2]) => If(Factor(input2), ([_1, input3]) => If(ExprTermTail(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExprTermTailMapping(_0), input2]);
var ExprTerm = (input) => If(If(Factor(input), ([_0, input2]) => If(ExprTermTail(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprTermMapping(_0), input2]);
var ExprTail = (input) => If(If(If(Const("|", input), ([_0, input2]) => If(ExprTerm(input2), ([_1, input3]) => If(ExprTail(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExprTailMapping(_0), input2]);
var Expr = (input) => If(If(ExprTerm(input), ([_0, input2]) => If(ExprTail(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprMapping(_0), input2]);
var ExprReadonly = (input) => If(If(Const("readonly", input), ([_0, input2]) => If(Expr(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprReadonlyMapping(_0), input2]);
var ExprPipe = (input) => If(If(Const("|", input), ([_0, input2]) => If(Expr(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprPipeMapping(_0), input2]);
var GenericType = (input) => If(If(GenericParameters(input), ([_0, input2]) => If(Const("=", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericTypeMapping(_0), input2]);
var InferType = (input) => If(If(If(Const("infer", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(Const("extends", input3), ([_2, input4]) => If(Expr(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => If(If(Const("infer", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [InferTypeMapping(_0), input2]);
var Type = (input) => If(If(InferType(input), ([_0, input2]) => [_0, input2], () => If(ExprPipe(input), ([_0, input2]) => [_0, input2], () => If(ExprReadonly(input), ([_0, input2]) => [_0, input2], () => If(Expr(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [TypeMapping(_0), input2]);
var PropertyKeyNumber = (input) => If(Number3(input), ([_0, input2]) => [PropertyKeyNumberMapping(_0), input2]);
var PropertyKeyIdent = (input) => If(Ident(input), ([_0, input2]) => [PropertyKeyIdentMapping(_0), input2]);
var PropertyKeyQuoted = (input) => If(String3(["'", '"'], input), ([_0, input2]) => [PropertyKeyQuotedMapping(_0), input2]);
var PropertyKeyIndex = (input) => If(If(Const("[", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(If(KeywordInteger(input4), ([_02, input5]) => [_02, input5], () => If(KeywordNumber(input4), ([_02, input5]) => [_02, input5], () => If(KeywordString(input4), ([_02, input5]) => [_02, input5], () => If(KeywordSymbol(input4), ([_02, input5]) => [_02, input5], () => [])))), ([_3, input5]) => If(Const("]", input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [PropertyKeyIndexMapping(_0), input2]);
var PropertyKey = (input) => If(If(PropertyKeyNumber(input), ([_0, input2]) => [_0, input2], () => If(PropertyKeyIdent(input), ([_0, input2]) => [_0, input2], () => If(PropertyKeyQuoted(input), ([_0, input2]) => [_0, input2], () => If(PropertyKeyIndex(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [PropertyKeyMapping(_0), input2]);
var Readonly2 = (input) => If(If(If(Const("readonly", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ReadonlyMapping(_0), input2]);
var Optional3 = (input) => If(If(If(Const("?", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [OptionalMapping(_0), input2]);
var Property = (input) => If(If(Readonly2(input), ([_0, input2]) => If(PropertyKey(input2), ([_1, input3]) => If(Optional3(input3), ([_2, input4]) => If(Const(":", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [PropertyMapping(_0), input2]);
var PropertyDelimiter = (input) => If(If(If(Const(",", input), ([_0, input2]) => If(Const("\n", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const(";", input), ([_0, input2]) => If(Const("\n", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const(",", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(Const(";", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(Const("\n", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => []))))), ([_0, input2]) => [PropertyDelimiterMapping(_0), input2]);
var PropertyList_0 = (input, result = []) => If(If(Property(input), ([_0, input2]) => If(PropertyDelimiter(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => PropertyList_0(input2, [...result, _0]), () => [result, input]);
var PropertyList = (input) => If(If(PropertyList_0(input), ([_0, input2]) => If(If(If(Property(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [PropertyListMapping(_0), input2]);
var Properties = (input) => If(If(Const("{", input), ([_0, input2]) => If(PropertyList(input2), ([_1, input3]) => If(Const("}", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [PropertiesMapping(_0), input2]);
var _Object_2 = (input) => If(Properties(input), ([_0, input2]) => [_Object_Mapping(_0), input2]);
var ElementNamed = (input) => If(If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Const("readonly", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [_0, input2], () => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Const("readonly", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [ElementNamedMapping(_0), input2]);
var ElementReadonlyOptional = (input) => If(If(Const("readonly", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("?", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [ElementReadonlyOptionalMapping(_0), input2]);
var ElementReadonly = (input) => If(If(Const("readonly", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ElementReadonlyMapping(_0), input2]);
var ElementOptional = (input) => If(If(Type(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ElementOptionalMapping(_0), input2]);
var ElementBase = (input) => If(If(ElementNamed(input), ([_0, input2]) => [_0, input2], () => If(ElementReadonlyOptional(input), ([_0, input2]) => [_0, input2], () => If(ElementReadonly(input), ([_0, input2]) => [_0, input2], () => If(ElementOptional(input), ([_0, input2]) => [_0, input2], () => If(Type(input), ([_0, input2]) => [_0, input2], () => []))))), ([_0, input2]) => [ElementBaseMapping(_0), input2]);
var Element = (input) => If(If(If(Const("...", input), ([_0, input2]) => If(ElementBase(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(ElementBase(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ElementMapping(_0), input2]);
var ElementList_0 = (input, result = []) => If(If(Element(input), ([_0, input2]) => If(Const(",", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => ElementList_0(input2, [...result, _0]), () => [result, input]);
var ElementList = (input) => If(If(ElementList_0(input), ([_0, input2]) => If(If(If(Element(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ElementListMapping(_0), input2]);
var _Tuple_ = (input) => If(If(Const("[", input), ([_0, input2]) => If(ElementList(input2), ([_1, input3]) => If(Const("]", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_Tuple_Mapping(_0), input2]);
var ParameterReadonlyOptional = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Const("readonly", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [ParameterReadonlyOptionalMapping(_0), input2]);
var ParameterReadonly = (input) => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Const("readonly", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [ParameterReadonlyMapping(_0), input2]);
var ParameterOptional = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [ParameterOptionalMapping(_0), input2]);
var ParameterType = (input) => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [ParameterTypeMapping(_0), input2]);
var ParameterBase = (input) => If(If(ParameterReadonlyOptional(input), ([_0, input2]) => [_0, input2], () => If(ParameterReadonly(input), ([_0, input2]) => [_0, input2], () => If(ParameterOptional(input), ([_0, input2]) => [_0, input2], () => If(ParameterType(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [ParameterBaseMapping(_0), input2]);
var Parameter2 = (input) => If(If(If(Const("...", input), ([_0, input2]) => If(ParameterBase(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(ParameterBase(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ParameterMapping(_0), input2]);
var ParameterList_0 = (input, result = []) => If(If(Parameter2(input), ([_0, input2]) => If(Const(",", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => ParameterList_0(input2, [...result, _0]), () => [result, input]);
var ParameterList = (input) => If(If(ParameterList_0(input), ([_0, input2]) => If(If(If(Parameter2(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ParameterListMapping(_0), input2]);
var _Function_2 = (input) => If(If(Const("(", input), ([_0, input2]) => If(ParameterList(input2), ([_1, input3]) => If(Const(")", input3), ([_2, input4]) => If(Const("=>", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [_Function_Mapping(_0), input2]);
var _Constructor_ = (input) => If(If(Const("new", input), ([_0, input2]) => If(Const("(", input2), ([_1, input3]) => If(ParameterList(input3), ([_2, input4]) => If(Const(")", input4), ([_3, input5]) => If(Const("=>", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => [[_0, _1, _2, _3, _4, _5], input7])))))), ([_0, input2]) => [_Constructor_Mapping(_0), input2]);
var MappedReadonly = (input) => If(If(If(Const("+", input), ([_0, input2]) => If(Const("readonly", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("-", input), ([_0, input2]) => If(Const("readonly", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("readonly", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [MappedReadonlyMapping(_0), input2]);
var MappedOptional = (input) => If(If(If(Const("+", input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("-", input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("?", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [MappedOptionalMapping(_0), input2]);
var MappedAs = (input) => If(If(If(Const("as", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [MappedAsMapping(_0), input2]);
var _Mapped_ = (input) => If(If(Const("{", input), ([_0, input2]) => If(MappedReadonly(input2), ([_1, input3]) => If(Const("[", input3), ([_2, input4]) => If(Ident(input4), ([_3, input5]) => If(Const("in", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => If(MappedAs(input7), ([_6, input8]) => If(Const("]", input8), ([_7, input9]) => If(MappedOptional(input9), ([_8, input10]) => If(Const(":", input10), ([_9, input11]) => If(Type(input11), ([_10, input12]) => If(OptionalSemiColon(input12), ([_11, input13]) => If(Const("}", input13), ([_12, input14]) => [[_0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12], input14]))))))))))))), ([_0, input2]) => [_Mapped_Mapping(_0), input2]);
var Reference = (input) => If(Ident(input), ([_0, input2]) => [ReferenceMapping(_0), input2]);
var WithBigInt = (input) => If(BigInt3(input), ([_0, input2]) => [WithBigIntMapping(_0), input2]);
var WithNumber = (input) => If(Number3(input), ([_0, input2]) => [WithNumberMapping(_0), input2]);
var WithBoolean = (input) => If(If(Const("true", input), ([_0, input2]) => [_0, input2], () => If(Const("false", input), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [WithBooleanMapping(_0), input2]);
var WithString = (input) => If(String3(['"', "'"], input), ([_0, input2]) => [WithStringMapping(_0), input2]);
var WithNull = (input) => If(Const("null", input), ([_0, input2]) => [WithNullMapping(_0), input2]);
var WithUndefined = (input) => If(Const("undefined", input), ([_0, input2]) => [WithUndefinedMapping(_0), input2]);
var WithProperty = (input) => If(If(PropertyKey(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(WithValue(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [WithPropertyMapping(_0), input2]);
var WithPropertyList_0 = (input, result = []) => If(If(WithProperty(input), ([_0, input2]) => If(PropertyDelimiter(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => WithPropertyList_0(input2, [...result, _0]), () => [result, input]);
var WithPropertyList = (input) => If(If(WithPropertyList_0(input), ([_0, input2]) => If(If(If(WithProperty(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [WithPropertyListMapping(_0), input2]);
var WithObject = (input) => If(If(Const("{", input), ([_0, input2]) => If(WithPropertyList(input2), ([_1, input3]) => If(Const("}", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [WithObjectMapping(_0), input2]);
var WithElementList_0 = (input, result = []) => If(If(WithValue(input), ([_0, input2]) => If(Const(",", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => WithElementList_0(input2, [...result, _0]), () => [result, input]);
var WithElementList = (input) => If(If(WithElementList_0(input), ([_0, input2]) => If(If(If(WithValue(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [WithElementListMapping(_0), input2]);
var WithArray = (input) => If(If(Const("[", input), ([_0, input2]) => If(WithElementList(input2), ([_1, input3]) => If(Const("]", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [WithArrayMapping(_0), input2]);
var WithValue = (input) => If(If(WithBigInt(input), ([_0, input2]) => [_0, input2], () => If(WithNumber(input), ([_0, input2]) => [_0, input2], () => If(WithBoolean(input), ([_0, input2]) => [_0, input2], () => If(WithString(input), ([_0, input2]) => [_0, input2], () => If(WithNull(input), ([_0, input2]) => [_0, input2], () => If(WithUndefined(input), ([_0, input2]) => [_0, input2], () => If(WithObject(input), ([_0, input2]) => [_0, input2], () => If(WithArray(input), ([_0, input2]) => [_0, input2], () => [])))))))), ([_0, input2]) => [WithValueMapping(_0), input2]);
var PatternBigInt = (input) => If(Const("-?(?:0|[1-9][0-9]*)n", input), ([_0, input2]) => [PatternBigIntMapping(_0), input2]);
var PatternString = (input) => If(Const(".*", input), ([_0, input2]) => [PatternStringMapping(_0), input2]);
var PatternNumber = (input) => If(Const("-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?", input), ([_0, input2]) => [PatternNumberMapping(_0), input2]);
var PatternInteger = (input) => If(Const("-?(?:0|[1-9][0-9]*)", input), ([_0, input2]) => [PatternIntegerMapping(_0), input2]);
var PatternNever = (input) => If(Const("(?!)", input), ([_0, input2]) => [PatternNeverMapping(_0), input2]);
var PatternText = (input) => If(Until_1(["-?(?:0|[1-9][0-9]*)n", ".*", "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?", "-?(?:0|[1-9][0-9]*)", "(?!)", "(", ")", "$", "|"], input), ([_0, input2]) => [PatternTextMapping(_0), input2]);
var PatternBase = (input) => If(If(PatternBigInt(input), ([_0, input2]) => [_0, input2], () => If(PatternString(input), ([_0, input2]) => [_0, input2], () => If(PatternNumber(input), ([_0, input2]) => [_0, input2], () => If(PatternInteger(input), ([_0, input2]) => [_0, input2], () => If(PatternNever(input), ([_0, input2]) => [_0, input2], () => If(PatternGroup(input), ([_0, input2]) => [_0, input2], () => If(PatternText(input), ([_0, input2]) => [_0, input2], () => []))))))), ([_0, input2]) => [PatternBaseMapping(_0), input2]);
var PatternGroup = (input) => If(If(Const("(", input), ([_0, input2]) => If(PatternBody(input2), ([_1, input3]) => If(Const(")", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [PatternGroupMapping(_0), input2]);
var PatternUnion = (input) => If(If(If(PatternTerm(input), ([_0, input2]) => If(Const("|", input2), ([_1, input3]) => If(PatternUnion(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(If(PatternTerm(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [PatternUnionMapping(_0), input2]);
var PatternTerm = (input) => If(If(PatternBase(input), ([_0, input2]) => If(PatternBody(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [PatternTermMapping(_0), input2]);
var PatternBody = (input) => If(If(PatternUnion(input), ([_0, input2]) => [_0, input2], () => If(PatternTerm(input), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [PatternBodyMapping(_0), input2]);
var Pattern = (input) => If(If(Const("^", input), ([_0, input2]) => If(PatternBody(input2), ([_1, input3]) => If(Const("$", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [PatternMapping(_0), input2]);
var InterfaceDeclarationHeritageList_0 = (input, result = []) => If(If(Type(input), ([_0, input2]) => If(Const(",", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => InterfaceDeclarationHeritageList_0(input2, [...result, _0]), () => [result, input]);
var InterfaceDeclarationHeritageList = (input) => If(If(InterfaceDeclarationHeritageList_0(input), ([_0, input2]) => If(If(If(Type(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [InterfaceDeclarationHeritageListMapping(_0), input2]);
var InterfaceDeclarationHeritage = (input) => If(If(If(Const("extends", input), ([_0, input2]) => If(InterfaceDeclarationHeritageList(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [InterfaceDeclarationHeritageMapping(_0), input2]);
var InterfaceDeclarationGeneric = (input) => If(If(Const("interface", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(GenericParameters(input3), ([_2, input4]) => If(InterfaceDeclarationHeritage(input4), ([_3, input5]) => If(Properties(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [InterfaceDeclarationGenericMapping(_0), input2]);
var InterfaceDeclaration = (input) => If(If(Const("interface", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(InterfaceDeclarationHeritage(input3), ([_2, input4]) => If(Properties(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [InterfaceDeclarationMapping(_0), input2]);
var TypeAliasDeclarationGeneric = (input) => If(If(Const("type", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(GenericParameters(input3), ([_2, input4]) => If(Const("=", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [TypeAliasDeclarationGenericMapping(_0), input2]);
var TypeAliasDeclaration = (input) => If(If(Const("type", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(Const("=", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [TypeAliasDeclarationMapping(_0), input2]);
var ExportKeyword = (input) => If(If(If(Const("export", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExportKeywordMapping(_0), input2]);
var ModuleDeclarationDelimiter = (input) => If(If(If(Const(";", input), ([_0, input2]) => If(Const("\n", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const(";", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(Const("\n", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [ModuleDeclarationDelimiterMapping(_0), input2]);
var ModuleDeclarationList_0 = (input, result = []) => If(If(ModuleDeclaration(input), ([_0, input2]) => If(ModuleDeclarationDelimiter(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => ModuleDeclarationList_0(input2, [...result, _0]), () => [result, input]);
var ModuleDeclarationList = (input) => If(If(ModuleDeclarationList_0(input), ([_0, input2]) => If(If(If(ModuleDeclaration(input2), ([_02, input3]) => [[_02], input3]), ([_02, input3]) => [_02, input3], () => If([[], input2], ([_02, input3]) => [_02, input3], () => [])), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ModuleDeclarationListMapping(_0), input2]);
var ModuleDeclaration = (input) => If(If(ExportKeyword(input), ([_0, input2]) => If(If(InterfaceDeclarationGeneric(input2), ([_02, input3]) => [_02, input3], () => If(InterfaceDeclaration(input2), ([_02, input3]) => [_02, input3], () => If(TypeAliasDeclarationGeneric(input2), ([_02, input3]) => [_02, input3], () => If(TypeAliasDeclaration(input2), ([_02, input3]) => [_02, input3], () => [])))), ([_1, input3]) => If(OptionalSemiColon(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [ModuleDeclarationMapping(_0), input2]);
var Module = (input) => If(If(ModuleDeclaration(input), ([_0, input2]) => If(ModuleDeclarationList(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ModuleMapping(_0), input2]);
var Script = (input) => If(If(Module(input), ([_0, input2]) => [_0, input2], () => If(GenericType(input), ([_0, input2]) => [_0, input2], () => If(Type(input), ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [ScriptMapping(_0), input2]);

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/patterns/template.mjs
function ParseTemplateIntoTypes(template) {
  const parsed = TemplateLiteralTypes(`\`${template}\``);
  const result = guard_exports.IsEqual(parsed.length, 2) ? parsed[0] : Unreachable();
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/template_literal/encode.mjs
function JoinString(input) {
  return input.join("|");
}
function UnwrapTemplateLiteralPattern(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function EncodeLiteral(value, right, pattern) {
  return EncodeTypes(right, `${pattern}${value}`);
}
function EncodeBigInt(right, pattern) {
  return EncodeTypes(right, `${pattern}${BigIntPattern}`);
}
function EncodeInteger(right, pattern) {
  return EncodeTypes(right, `${pattern}${IntegerPattern}`);
}
function EncodeNumber(right, pattern) {
  return EncodeTypes(right, `${pattern}${NumberPattern}`);
}
function EncodeBoolean(right, pattern) {
  return EncodeType(Union([Literal("false"), Literal("true")]), right, pattern);
}
function EncodeString(right, pattern) {
  return EncodeTypes(right, `${pattern}${StringPattern}`);
}
function EncodeTemplateLiteral(templatePattern, right, pattern) {
  return EncodeTypes(right, `${pattern}${UnwrapTemplateLiteralPattern(templatePattern)}`);
}
function EncodeTemplateLiteralDeferred(types, right, pattern) {
  const templateLiteral = TemplateLiteralAction(types, {});
  const result = EncodeType(templateLiteral, right, pattern);
  return result;
}
function EncodeEnum(values, right, pattern) {
  const evaluated = EvaluateEnum(values);
  return EncodeType(evaluated, right, pattern);
}
function EncodeUnion(types, right, pattern, result = []) {
  return guard_exports.ShiftLeft(types, (head, tail) => EncodeUnion(tail, right, pattern, [...result, EncodeType(head, [], "")]), () => EncodeTypes(right, `${pattern}(${JoinString(result)})`));
}
function EncodeType(type, right, pattern) {
  return IsEnum(type) ? EncodeEnum(type.enum, right, pattern) : IsInteger2(type) ? EncodeInteger(right, pattern) : IsLiteral(type) ? EncodeLiteral(type.const, right, pattern) : IsBigInt2(type) ? EncodeBigInt(right, pattern) : IsBoolean3(type) ? EncodeBoolean(right, pattern) : IsNumber3(type) ? EncodeNumber(right, pattern) : IsString3(type) ? EncodeString(right, pattern) : IsTemplateLiteral(type) ? EncodeTemplateLiteral(type.pattern, right, pattern) : IsTemplateLiteralDeferred(type) ? EncodeTemplateLiteralDeferred(type.parameters[0], right, pattern) : IsUnion(type) ? EncodeUnion(type.anyOf, right, pattern) : NeverPattern;
}
function EncodeTypes(types, pattern) {
  return guard_exports.ShiftLeft(types, (left, right) => EncodeType(left, right, pattern), () => pattern);
}
function EncodePattern(types) {
  const encoded = EncodeTypes(types, "");
  const result = `^${encoded}$`;
  return result;
}
function TemplateLiteralEncode(types) {
  const pattern = EncodePattern(types);
  const result = TemplateLiteralCreate(pattern);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/template_literal/instantiate.mjs
function TemplateLiteralAction(types, options) {
  const result = CanInstantiate(types) ? memory_exports.Update(TemplateLiteralEncode(types), {}, options) : TemplateLiteralDeferred(types, options);
  return result;
}
function TemplateLiteralInstantiate(context, state, types, options) {
  const instantiatedTypes = InstantiateTypes(context, state, types);
  return TemplateLiteralAction(instantiatedTypes, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/template_literal.mjs
function TemplateLiteralDeferred(types, options = {}) {
  return Deferred("TemplateLiteral", [types], options);
}
function IsTemplateLiteralDeferred(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "action") && guard_exports.IsEqual(value.action, "TemplateLiteral");
}
function TemplateLiteralFromTypes(types) {
  return TemplateLiteralAction(types, {});
}
function TemplateLiteralFromString(template) {
  const types = ParseTemplateIntoTypes(template);
  return TemplateLiteralFromTypes(types);
}
function TemplateLiteral2(input, options = {}) {
  const type = guard_exports.IsString(input) ? TemplateLiteralFromString(input) : TemplateLiteralFromTypes(input);
  return memory_exports.Update(type, {}, options);
}
function IsTemplateLiteral(value) {
  return IsKind(value, "TemplateLiteral");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/result.mjs
var result_exports = {};
__export(result_exports, {
  ExtendsFalse: () => ExtendsFalse,
  ExtendsTrue: () => ExtendsTrue,
  ExtendsUnion: () => ExtendsUnion,
  IsExtendsFalse: () => IsExtendsFalse,
  IsExtendsTrue: () => IsExtendsTrue,
  IsExtendsTrueLike: () => IsExtendsTrueLike,
  IsExtendsUnion: () => IsExtendsUnion,
  Match: () => Match3
});
function ExtendsUnion(inferred) {
  return memory_exports.Create({ ["~kind"]: "ExtendsUnion" }, { inferred });
}
function IsExtendsUnion(value) {
  return guard_exports.IsObject(value) && guard_exports.HasPropertyKey(value, "~kind") && guard_exports.HasPropertyKey(value, "inferred") && guard_exports.IsEqual(value["~kind"], "ExtendsUnion") && guard_exports.IsObject(value.inferred);
}
function ExtendsTrue(inferred) {
  return memory_exports.Create({ ["~kind"]: "ExtendsTrue" }, { inferred });
}
function IsExtendsTrue(value) {
  return guard_exports.IsObject(value) && guard_exports.HasPropertyKey(value, "~kind") && guard_exports.HasPropertyKey(value, "inferred") && guard_exports.IsEqual(value["~kind"], "ExtendsTrue") && guard_exports.IsObject(value.inferred);
}
function ExtendsFalse() {
  return memory_exports.Create({ ["~kind"]: "ExtendsFalse" }, {});
}
function IsExtendsFalse(value) {
  return guard_exports.IsObject(value) && guard_exports.HasPropertyKey(value, "~kind") && guard_exports.IsEqual(value["~kind"], "ExtendsFalse");
}
function IsExtendsTrueLike(value) {
  return IsExtendsUnion(value) || IsExtendsTrue(value);
}
function Match3(result, true_, false_) {
  return IsExtendsTrueLike(result) ? true_(result.inferred) : false_();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/extends_right.mjs
function ExtendsRightInfer(inferred, name, left, right) {
  return Match3(ExtendsLeft(inferred, left, right), (checkInferred) => ExtendsTrue(memory_exports.Assign(memory_exports.Assign(inferred, checkInferred), { [name]: left })), () => ExtendsFalse());
}
function ExtendsRightAny(inferred, _left) {
  return ExtendsTrue(inferred);
}
function ExtendsRightDependent(inferred, left, if_, then_, else_) {
  return Match3(ExtendsLeft(inferred, left, if_), (inferred2) => Match3(ExtendsLeft(inferred2, left, then_), (inferred3) => ExtendsTrue(inferred3), () => ExtendsFalse()), () => Match3(ExtendsLeft(inferred, left, else_), (inferred2) => ExtendsTrue(inferred2), () => ExtendsFalse()));
}
function ExtendsRightEnum(inferred, left, right) {
  const evaluated = EvaluateEnum(right);
  return ExtendsLeft(inferred, left, evaluated);
}
function ExtendsRightIntersect(inferred, left, right) {
  return guard_exports.ShiftLeft(right, (head, tail) => Match3(ExtendsLeft(inferred, left, head), (inferred2) => ExtendsRightIntersect(inferred2, left, tail), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsRightTemplateLiteral(inferred, left, right) {
  const evaluated = EvaluateTemplateLiteral(right);
  return ExtendsLeft(inferred, left, evaluated);
}
function ExtendsRightUnion(inferred, left, right) {
  return guard_exports.ShiftLeft(right, (head, tail) => Match3(ExtendsLeft(inferred, left, head), (inferred2) => ExtendsTrue(inferred2), () => ExtendsRightUnion(inferred, left, tail)), () => ExtendsFalse());
}
function ExtendsRight(inferred, left, right) {
  return IsAny(right) ? ExtendsRightAny(inferred, left) : IsDependent(right) ? ExtendsRightDependent(inferred, left, right.if, right.then, right.else) : IsEnum(right) ? ExtendsRightEnum(inferred, left, right.enum) : IsInfer(right) ? ExtendsRightInfer(inferred, right.name, left, right.extends) : IsIntersect(right) ? ExtendsRightIntersect(inferred, left, right.allOf) : IsTemplateLiteral(right) ? ExtendsRightTemplateLiteral(inferred, left, right.pattern) : IsUnion(right) ? ExtendsRightUnion(inferred, left, right.anyOf) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/any.mjs
function ExtendsAny(inferred, left, right) {
  return IsInfer(right) ? ExtendsRight(inferred, left, right) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsUnion(inferred);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/array.mjs
function ExtendsImmutable(left, right) {
  const isImmutableLeft = IsImmutable(left);
  const isImmutableRight = IsImmutable(right);
  return isImmutableLeft && isImmutableRight ? true : !isImmutableLeft && isImmutableRight ? true : isImmutableLeft && !isImmutableRight ? false : true;
}
function ExtendsArray(inferred, arrayLeft, left, right) {
  return IsArray2(right) ? ExtendsImmutable(arrayLeft, right) ? ExtendsLeft(inferred, left, right.items) : ExtendsFalse() : ExtendsRight(inferred, arrayLeft, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/bigint.mjs
function ExtendsBigInt(inferred, left, right) {
  return IsBigInt2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/boolean.mjs
function ExtendsBoolean(inferred, left, right) {
  return IsBoolean3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/parameters.mjs
function ParameterCompare(inferred, left, leftRest, right, rightRest) {
  const checkLeft = IsInfer(right) ? left : right;
  const checkRight = IsInfer(right) ? right : left;
  const isLeftOptional = IsOptional(left);
  const isRightOptional = IsOptional(right);
  return !isLeftOptional && isRightOptional ? ExtendsFalse() : Match3(ExtendsLeft(inferred, checkLeft, checkRight), (inferred2) => ExtendsParameters(inferred2, leftRest, rightRest), () => ExtendsFalse());
}
function ParameterRight(inferred, left, leftRest, rightRest) {
  return guard_exports.ShiftLeft(rightRest, (head, tail) => ParameterCompare(inferred, left, leftRest, head, tail), () => IsOptional(left) ? ExtendsTrue(inferred) : ExtendsFalse());
}
function ParametersLeft(inferred, left, rightRest) {
  return guard_exports.ShiftLeft(left, (head, tail) => ParameterRight(inferred, head, tail, rightRest), () => ExtendsTrue(inferred));
}
function ExtendsParameters(inferred, left, right) {
  return ParametersLeft(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/return_type.mjs
function ExtendsReturnType(inferred, left, right) {
  return IsVoid(right) ? ExtendsTrue(inferred) : ExtendsLeft(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/constructor.mjs
function ExtendsConstructor(inferred, parameters, returnType, right) {
  return IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : IsConstructor2(right) ? Match3(ExtendsParameters(inferred, parameters, right["parameters"]), (inferred2) => ExtendsReturnType(inferred2, returnType, right["instanceType"]), () => ExtendsFalse()) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/dependent.mjs
function ExtendsDependent(inferred, if_, then_, else_, right) {
  return Match3(ExtendsLeft(inferred, if_, right), () => ExtendsLeft(inferred, then_, right), () => ExtendsLeft(inferred, else_, right));
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/enum.mjs
function ExtendsEnum(inferred, left, right) {
  const evaluated = EvaluateEnum(left);
  return ExtendsLeft(inferred, evaluated, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/function.mjs
function ExtendsFunction(inferred, parameters, returnType, right) {
  return IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : IsFunction2(right) ? Match3(ExtendsParameters(inferred, parameters, right["parameters"]), (inferred2) => ExtendsReturnType(inferred2, returnType, right["returnType"]), () => ExtendsFalse()) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/integer.mjs
function ExtendsInteger(inferred, left, right) {
  return IsInteger2(right) ? ExtendsTrue(inferred) : IsNumber3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/intersect.mjs
function ExtendsIntersect(inferred, left, right) {
  const evaluated = EvaluateIntersect(left);
  return ExtendsLeft(inferred, evaluated, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/literal.mjs
function ExtendsLiteralValue(inferred, left, right) {
  return left === right ? ExtendsTrue(inferred) : ExtendsFalse();
}
function ExtendsLiteralBigInt(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsBigInt2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralBoolean(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsBoolean3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralNumber(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsNumber3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralString(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsString3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteral(inferred, left, right) {
  return guard_exports.IsBigInt(left.const) ? ExtendsLiteralBigInt(inferred, left.const, right) : guard_exports.IsBoolean(left.const) ? ExtendsLiteralBoolean(inferred, left.const, right) : guard_exports.IsNumber(left.const) ? ExtendsLiteralNumber(inferred, left.const, right) : guard_exports.IsString(left.const) ? ExtendsLiteralString(inferred, left.const, right) : Unreachable();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/never.mjs
function ExtendsNever(inferred, left, right) {
  return IsInfer(right) ? ExtendsRight(inferred, left, right) : ExtendsTrue(inferred);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/null.mjs
function ExtendsNull(inferred, left, right) {
  return IsNull2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/number.mjs
function ExtendsNumber(inferred, left, right) {
  return IsNumber3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/object.mjs
function ExtendsPropertyOptional(inferred, left, right) {
  return IsOptional(left) ? IsOptional(right) ? ExtendsTrue(inferred) : ExtendsFalse() : ExtendsTrue(inferred);
}
function ExtendsProperty(inferred, left, right) {
  return (
    // Right TInfer<TNever> is TExtendsFalse
    IsInfer(right) && IsNever(right.extends) ? ExtendsFalse() : Match3(ExtendsLeft(inferred, left, right), (inferred2) => ExtendsPropertyOptional(inferred2, left, right), () => ExtendsFalse())
  );
}
function ExtractInferredProperties(keys, properties) {
  return keys.reduce((result, key) => {
    return key in properties ? IsExtendsTrueLike(properties[key]) ? { ...result, ...properties[key].inferred } : Unreachable() : Unreachable();
  }, {});
}
function ExtendsPropertiesComparer(inferred, left, right) {
  const properties = {};
  for (const rightKey of guard_exports.Keys(right)) {
    properties[rightKey] = rightKey in left ? ExtendsProperty({}, left[rightKey], right[rightKey]) : IsOptional(right[rightKey]) ? IsInfer(right[rightKey]) ? ExtendsTrue(memory_exports.Assign(inferred, { [right[rightKey].name]: right[rightKey].extends })) : ExtendsTrue(inferred) : ExtendsFalse();
  }
  const checked = guard_exports.Values(properties).every((result) => IsExtendsTrueLike(result));
  const extracted = checked ? ExtractInferredProperties(guard_exports.Keys(properties), properties) : {};
  return checked ? ExtendsTrue(extracted) : ExtendsFalse();
}
function ExtendsProperties(inferred, left, right) {
  const compared = ExtendsPropertiesComparer(inferred, left, right);
  return IsExtendsTrueLike(compared) ? ExtendsTrue(memory_exports.Assign(inferred, compared.inferred)) : ExtendsFalse();
}
function ExtendsObjectToObject(inferred, left, right) {
  return ExtendsProperties(inferred, left, right);
}
function RecordMergeInferred(left, right) {
  return guard_exports.Keys(right).reduce((result, key) => {
    return {
      ...result,
      [key]: guard_exports.HasPropertyKey(left, key) ? IsUnion(result[key]) ? Union([...result[key].anyOf, right[key]]) : Union([left[key], right[key]]) : right[key]
    };
  }, left);
}
function ExtendsRecordComparer(properties, keys, type, result) {
  return guard_exports.ShiftLeft(keys, (left, right) => Match3(ExtendsLeft({}, properties[left], type), (inferred) => ExtendsRecordComparer(properties, right, type, RecordMergeInferred(result, inferred)), () => ExtendsFalse()), () => ExtendsTrue(result));
}
function ExtendsObjectToRecord(inferred, properties, _pattern, value) {
  const keys = guard_exports.Keys(properties);
  const result = ExtendsRecordComparer(properties, keys, value, inferred);
  return result;
}
function ExtendsObject(inferred, left, right) {
  return IsRecord(right) ? ExtendsObjectToRecord(inferred, left, RecordPattern(right), RecordValue(right)) : IsObject2(right) ? ExtendsObjectToObject(inferred, left, right.properties) : ExtendsRight(inferred, _Object_(left), right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/record.mjs
function FromObject2(inferred, properties) {
  return guard_exports.IsEqual(guard_exports.Keys(properties).length, 0) ? ExtendsTrue(inferred) : ExtendsFalse();
}
function FromRecord(inferred, _leftKey, leftValue, _rightKey, rightValue) {
  return ExtendsLeft(inferred, leftValue, rightValue);
}
function ExtendsRecord(inferred, leftPattern, leftValue, right) {
  return IsRecord(right) ? FromRecord(inferred, RecordPatternToType(leftPattern), leftValue, RecordPatternToType(RecordPattern(right)), RecordValue(right)) : IsObject2(right) ? FromObject2(inferred, right.properties) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/string.mjs
function ExtendsString(inferred, left, right) {
  return IsString3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/symbol.mjs
function ExtendsSymbol(inferred, left, right) {
  return IsSymbol2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/template_literal.mjs
function ExtendsTemplateLiteral(inferred, left, right) {
  const evaluated = EvaluateTemplateLiteral(left);
  return ExtendsLeft(inferred, evaluated, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/inference.mjs
function Inferrable(name, type) {
  return memory_exports.Create({ "~kind": "Inferrable" }, { name, type }, {});
}
function IsInferable(value) {
  return guard_exports.IsObject(value) && guard_exports.HasPropertyKey(value, "~kind") && guard_exports.HasPropertyKey(value, "name") && guard_exports.HasPropertyKey(value, "type") && guard_exports.IsEqual(value["~kind"], "Inferrable") && guard_exports.IsString(value.name) && guard_exports.IsObject(value.type);
}
function TryRestInferable(type) {
  return IsRest(type) ? IsInfer(type.items) ? IsArray2(type.items.extends) ? Inferrable(type.items.name, type.items.extends.items) : IsUnknown(type.items.extends) ? Inferrable(type.items.name, type.items.extends) : void 0 : Unreachable() : void 0;
}
function TryInferable(type) {
  return IsInfer(type) ? Inferrable(type.name, type.extends) : void 0;
}
function TryInferResults(rest, right, result = []) {
  return guard_exports.ShiftLeft(rest, (head, tail) => Match3(ExtendsLeft({}, head, right), () => TryInferResults(tail, right, [...result, head]), () => void 0), () => result);
}
function InferTupleResult(inferred, name, left, right) {
  const results = TryInferResults(left, right);
  return guard_exports.IsArray(results) ? ExtendsTrue(memory_exports.Assign(inferred, { [name]: Tuple(results) })) : ExtendsFalse();
}
function InferUnionResult(inferred, name, left, right) {
  const results = TryInferResults(left, right);
  return guard_exports.IsArray(results) ? ExtendsTrue(memory_exports.Assign(inferred, { [name]: Union(results) })) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/tuple.mjs
function Reverse(types) {
  return [...types].reverse();
}
function ApplyReverse(types, reversed) {
  return reversed ? Reverse(types) : types;
}
function Reversed(types) {
  const first = types.length > 0 ? types[0] : void 0;
  const inferrable = IsSchema(first) ? TryRestInferable(first) : void 0;
  return IsSchema(inferrable);
}
function ElementsCompare(inferred, reversed, left, leftRest, right, rightRest) {
  return Match3(ExtendsLeft(inferred, left, right), (checkInferred) => Elements(checkInferred, reversed, leftRest, rightRest), () => ExtendsFalse());
}
function ElementsLeft(inferred, reversed, leftRest, right, rightRest) {
  const inferable = TryRestInferable(right);
  return (
    // Rest Inferrable Right Means we delegate to TInferTupleResult to Generate a Result
    IsInferable(inferable) ? InferTupleResult(inferred, inferable["name"], ApplyReverse(leftRest, reversed), inferable["type"]) : guard_exports.ShiftLeft(leftRest, (head, tail) => ElementsCompare(inferred, reversed, head, tail, right, rightRest), () => ExtendsFalse())
  );
}
function ElementsRight(inferred, reversed, leftRest, rightRest) {
  return guard_exports.ShiftLeft(rightRest, (head, tail) => ElementsLeft(inferred, reversed, leftRest, head, tail), () => guard_exports.IsEqual(leftRest.length, 0) ? ExtendsTrue(inferred) : ExtendsFalse());
}
function Elements(inferred, reversed, leftRest, rightRest) {
  return ElementsRight(inferred, reversed, leftRest, rightRest);
}
function ExtendsTupleToTuple(inferred, left, right) {
  const instantiatedRight = InstantiateElements(inferred, State([], []), right);
  const reversed = Reversed(instantiatedRight);
  return Elements(inferred, reversed, ApplyReverse(left, reversed), ApplyReverse(instantiatedRight, reversed));
}
function ExtendsTupleToArray(inferred, left, right) {
  const inferrable = TryInferable(right);
  return IsInferable(inferrable) ? InferUnionResult(inferred, inferrable["name"], left, inferrable["type"]) : guard_exports.ShiftLeft(left, (head, tail) => Match3(ExtendsLeft(inferred, head, right), (inferred2) => ExtendsTupleToArray(inferred2, tail, right), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsTuple(inferred, left, right) {
  const instantiatedLeft = InstantiateElements(inferred, State([], []), left);
  return IsTuple(right) ? ExtendsTupleToTuple(inferred, instantiatedLeft, right.items) : IsArray2(right) ? ExtendsTupleToArray(inferred, instantiatedLeft, right.items) : ExtendsRight(inferred, Tuple(instantiatedLeft), right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/undefined.mjs
function ExtendsUndefined(inferred, left, right) {
  return IsVoid(right) ? ExtendsTrue(inferred) : IsUndefined2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/union.mjs
function ExtendsUnionSome(inferred, type, unionTypes) {
  return guard_exports.ShiftLeft(unionTypes, (head, tail) => Match3(ExtendsLeft(inferred, type, head), (inferred2) => ExtendsTrue(inferred2), () => ExtendsUnionSome(inferred, type, tail)), () => ExtendsFalse());
}
function ExtendsUnionLeft(inferred, left, right) {
  return guard_exports.ShiftLeft(left, (head, tail) => Match3(ExtendsUnionSome(inferred, head, right), (inferred2) => ExtendsUnionLeft(inferred2, tail, right), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsUnion2(inferred, left, right) {
  const inferrable = TryInferable(right);
  return IsInferable(inferrable) ? InferUnionResult(inferred, inferrable.name, left, inferrable.type) : IsUnion(right) ? ExtendsUnionLeft(inferred, left, right.anyOf) : ExtendsUnionLeft(inferred, left, [right]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/unknown.mjs
function ExtendsUnknown(inferred, left, right) {
  return IsInfer(right) ? ExtendsRight(inferred, left, right) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/void.mjs
function ExtendsVoid(inferred, left, right) {
  return IsVoid(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/extends_left.mjs
function ExtendsLeft(inferred, left, right) {
  return IsAny(left) ? ExtendsAny(inferred, left, right) : IsArray2(left) ? ExtendsArray(inferred, left, left.items, right) : IsBigInt2(left) ? ExtendsBigInt(inferred, left, right) : IsBoolean3(left) ? ExtendsBoolean(inferred, left, right) : IsConstructor2(left) ? ExtendsConstructor(inferred, left.parameters, left.instanceType, right) : IsDependent(left) ? ExtendsDependent(inferred, left.if, left.then, left.else, right) : IsEnum(left) ? ExtendsEnum(inferred, left.enum, right) : IsFunction2(left) ? ExtendsFunction(inferred, left.parameters, left.returnType, right) : IsInteger2(left) ? ExtendsInteger(inferred, left, right) : IsIntersect(left) ? ExtendsIntersect(inferred, left.allOf, right) : IsLiteral(left) ? ExtendsLiteral(inferred, left, right) : IsNever(left) ? ExtendsNever(inferred, left, right) : IsNull2(left) ? ExtendsNull(inferred, left, right) : IsNumber3(left) ? ExtendsNumber(inferred, left, right) : IsObject2(left) ? ExtendsObject(inferred, left.properties, right) : IsRecord(left) ? ExtendsRecord(inferred, RecordPattern(left), RecordValue(left), right) : IsString3(left) ? ExtendsString(inferred, left, right) : IsSymbol2(left) ? ExtendsSymbol(inferred, left, right) : IsTemplateLiteral(left) ? ExtendsTemplateLiteral(inferred, left.pattern, right) : IsTuple(left) ? ExtendsTuple(inferred, left.items, right) : IsUndefined2(left) ? ExtendsUndefined(inferred, left, right) : IsUnion(left) ? ExtendsUnion2(inferred, left.anyOf, right) : IsUnknown(left) ? ExtendsUnknown(inferred, left, right) : IsVoid(left) ? ExtendsVoid(inferred, left, right) : ExtendsFalse();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/interface/instantiate.mjs
function InterfaceOperation(heritage, properties) {
  const result = EvaluateIntersect([...heritage, _Object_(properties)]);
  return result;
}
function InterfaceAction(heritage, properties, options) {
  const result = CanInstantiate(heritage) ? memory_exports.Update(InterfaceOperation(heritage, properties), {}, options) : InterfaceDeferred(heritage, properties, options);
  return result;
}
function InterfaceInstantiate(context, state, heritage, properties, options) {
  const instantiatedHeritage = InstantiateTypes(context, state, heritage);
  const instantiatedProperties = InstantiateProperties(context, state, properties);
  return InterfaceAction(instantiatedHeritage, instantiatedProperties, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/interface.mjs
function InterfaceDeferred(heritage, properties, options = {}) {
  return Deferred("Interface", [heritage, properties], options);
}
function IsInterfaceDeferred(value) {
  return IsSchema(value) && guard_exports.HasPropertyKey(value, "action") && guard_exports.IsEqual(value.action, "Interface");
}
function Interface(heritage, properties, options = {}) {
  return InterfaceAction(heritage, properties, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/cyclic/check.mjs
function FromRef(stack, context, ref) {
  return stack.includes(ref) ? true : FromType3([...stack, ref], context, context[ref]);
}
function FromProperties(stack, context, properties) {
  const types = PropertyValues(properties);
  return FromTypes2(stack, context, types);
}
function FromTypes2(stack, context, types) {
  return guard_exports.ShiftLeft(types, (left, right) => FromType3(stack, context, left) ? true : FromTypes2(stack, context, right), () => false);
}
function FromType3(stack, context, type) {
  return IsRef(type) ? FromRef(stack, context, type.$ref) : IsArray2(type) ? FromType3(stack, context, type.items) : IsConstructor2(type) ? FromTypes2(stack, context, [...type.parameters, type.instanceType]) : IsFunction2(type) ? FromTypes2(stack, context, [...type.parameters, type.returnType]) : IsInterfaceDeferred(type) ? FromProperties(stack, context, type.parameters[1]) : IsIntersect(type) ? FromTypes2(stack, context, type.allOf) : IsObject2(type) ? FromProperties(stack, context, type.properties) : IsUnion(type) ? FromTypes2(stack, context, type.anyOf) : IsTuple(type) ? FromTypes2(stack, context, type.items) : IsRecord(type) ? FromType3(stack, context, RecordValue(type)) : false;
}
function CyclicCheck(stack, context, type) {
  const result = FromType3(stack, context, type);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/cyclic/candidates.mjs
function ResolveCandidateKeys(context, keys) {
  return keys.reduce((result, left) => {
    return CyclicCheck([left], context, context[left]) ? [...result, left] : result;
  }, []);
}
function CyclicCandidates(context) {
  const keys = PropertyKeys(context);
  const result = ResolveCandidateKeys(context, keys);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/cyclic/dependencies.mjs
function FromRef2(context, ref, result) {
  return result.includes(ref) ? result : ref in context ? FromType4(context, context[ref], [...result, ref]) : Unreachable();
}
function FromProperties2(context, properties, result) {
  const types = PropertyValues(properties);
  return FromTypes3(context, types, result);
}
function FromTypes3(context, types, result) {
  return types.reduce((result2, left) => {
    return FromType4(context, left, result2);
  }, result);
}
function FromType4(context, type, result) {
  return IsRef(type) ? FromRef2(context, type.$ref, result) : IsArray2(type) ? FromType4(context, type.items, result) : IsConstructor2(type) ? FromTypes3(context, [...type.parameters, type.instanceType], result) : IsFunction2(type) ? FromTypes3(context, [...type.parameters, type.returnType], result) : IsInterfaceDeferred(type) ? FromProperties2(context, type.parameters[1], result) : IsIntersect(type) ? FromTypes3(context, type.allOf, result) : IsObject2(type) ? FromProperties2(context, type.properties, result) : IsUnion(type) ? FromTypes3(context, type.anyOf, result) : IsTuple(type) ? FromTypes3(context, type.items, result) : IsRecord(type) ? FromType4(context, RecordValue(type), result) : result;
}
function CyclicDependencies(context, key, type) {
  const result = FromType4(context, type, [key]);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/cyclic/extends.mjs
function FromRef3(_ref) {
  return Any();
}
function FromProperties3(properties) {
  return guard_exports.Keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType5(properties[key]) };
  }, {});
}
function FromTypes4(types) {
  return types.reduce((result, left) => {
    return [...result, FromType5(left)];
  }, []);
}
function FromType5(type) {
  return IsRef(type) ? FromRef3(type.$ref) : IsArray2(type) ? _Array_(FromType5(type.items), ArrayOptions(type)) : IsConstructor2(type) ? Constructor(FromTypes4(type.parameters), FromType5(type.instanceType)) : IsFunction2(type) ? _Function_(FromTypes4(type.parameters), FromType5(type.returnType)) : IsIntersect(type) ? Intersect(FromTypes4(type.allOf)) : IsObject2(type) ? _Object_(FromProperties3(type.properties)) : IsRecord(type) ? Record(RecordKey(type), FromType5(RecordValue(type))) : IsUnion(type) ? Union(FromTypes4(type.anyOf)) : IsTuple(type) ? Tuple(FromTypes4(type.items)) : type;
}
function CyclicAnyFromParameters(defs, ref) {
  return ref in defs ? FromType5(defs[ref]) : Unknown();
}
function CyclicExtends(type) {
  return CyclicAnyFromParameters(type.$defs, type.$ref);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/cyclic/instantiate.mjs
function CyclicInterface(context, heritage, properties) {
  const instantiatedHeritage = InstantiateTypes(context, State([], []), heritage);
  const instantiatedProperties = InstantiateProperties({}, State([], []), properties);
  const evaluatedInterface = EvaluateIntersect([...instantiatedHeritage, _Object_(instantiatedProperties)]);
  return evaluatedInterface;
}
function CyclicDefinitions(context, dependencies) {
  const keys = guard_exports.Keys(context).filter((key) => dependencies.includes(key));
  return keys.reduce((result, key) => {
    const type = context[key];
    const instantiatedType = IsInterfaceDeferred(type) ? CyclicInterface(context, type.parameters[0], type.parameters[1]) : type;
    return { ...result, [key]: instantiatedType };
  }, {});
}
function InstantiateCyclic(context, ref, type) {
  const dependencies = CyclicDependencies(context, ref, type);
  const definitions = CyclicDefinitions(context, dependencies);
  const result = Cyclic(definitions, ref);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/cyclic/target.mjs
function Resolve(defs, ref) {
  return ref in defs ? IsRef(defs[ref]) ? Resolve(defs, defs[ref].$ref) : defs[ref] : Never();
}
function CyclicTarget(defs, ref) {
  const result = Resolve(defs, ref);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/extends/extends.mjs
function Canonical(type) {
  return IsCyclic(type) ? CyclicExtends(type) : IsUnsafe(type) ? Unknown() : type;
}
function Extends(inferred, left, right) {
  const canonicalLeft = Canonical(left);
  const canonicalRight = Canonical(right);
  return ExtendsLeft(inferred, canonicalLeft, canonicalRight);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/compare.mjs
var ResultEqual = "equal";
var ResultDisjoint = "disjoint";
var ResultLeftInside = "left-inside";
var ResultRightInside = "right-inside";
function Compare(left, right) {
  const extendsCheck = [
    IsUnknown(left) ? result_exports.ExtendsFalse() : Extends({}, left, right),
    IsUnknown(left) ? result_exports.ExtendsTrue({}) : Extends({}, right, left)
  ];
  return result_exports.IsExtendsTrueLike(extendsCheck[0]) && result_exports.IsExtendsTrueLike(extendsCheck[1]) ? ResultEqual : result_exports.IsExtendsTrueLike(extendsCheck[0]) && result_exports.IsExtendsFalse(extendsCheck[1]) ? ResultLeftInside : result_exports.IsExtendsFalse(extendsCheck[0]) && result_exports.IsExtendsTrueLike(extendsCheck[1]) ? ResultRightInside : ResultDisjoint;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/broaden.mjs
function BroadFilter(type, types) {
  return types.filter((left) => {
    return Compare(type, left) === ResultRightInside ? false : true;
  });
}
function IsBroadestType(type, types) {
  const result = types.some((left) => {
    const result2 = Compare(type, left);
    return guard_exports.IsEqual(result2, ResultLeftInside) || guard_exports.IsEqual(result2, ResultEqual);
  });
  return guard_exports.IsEqual(result, false);
}
function BroadenType(type, types) {
  const evaluated = EvaluateType(type);
  return IsAny(evaluated) ? [evaluated] : IsBroadestType(evaluated, types) ? [...BroadFilter(evaluated, types), evaluated] : types;
}
function BroadenTypes(types) {
  return types.reduce((result, left) => {
    return IsObject2(left) ? [...result, left] : (
      // push
      IsNever(left) ? result : (
        // ignore
        BroadenType(left, result)
      )
    );
  }, []);
}
function Broaden(types) {
  const broadened = BroadenTypes(types);
  const flattened = Flatten(broadened);
  return flattened;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/evaluate/instantiate.mjs
function EvaluateAction(type, options) {
  const result = memory_exports.Update(EvaluateType(type), {}, options);
  return result;
}
function EvaluateInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return EvaluateAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/call/distribute_arguments.mjs
function CollectDistributionNames(expression, result = []) {
  return (
    // Conditional
    IsDeferred(expression) && guard_exports.IsEqual(expression.action, "Conditional") ? IsRef(expression.parameters[0]) ? CollectDistributionNames(expression.parameters[2], CollectDistributionNames(expression.parameters[3], [...result, expression.parameters[0]["$ref"]])) : CollectDistributionNames(expression.parameters[2], CollectDistributionNames(expression.parameters[3], result)) : IsDeferred(expression) && guard_exports.IsEqual(expression.action, "Mapped") ? IsDeferred(expression.parameters[1]) && guard_exports.IsEqual(expression.parameters[1].action, "KeyOf") && IsRef(expression.parameters[1].parameters[0]) ? [...result, expression.parameters[1].parameters[0]["$ref"]] : result : result
  );
}
function BuildDistributionArray(parameters, names) {
  return parameters.reduce((result, left) => [...result, names.includes(left.name)], []);
}
function ZipDistributionArray(arguments_, distributionArray, result = []) {
  return guard_exports.ShiftLeft(arguments_, (argumentLeft, argumentRight) => guard_exports.ShiftLeft(distributionArray, (booleanLeft, booleanRight) => ZipDistributionArray(argumentRight, booleanRight, [...result, [booleanLeft, argumentLeft]]), () => result), () => result);
}
function Expand(type) {
  return IsUnion(type) ? [...type.anyOf] : [type];
}
function Append(current, type) {
  return current.reduce((result, left) => [...result, [...left, type]], []);
}
function Cross(current, variants) {
  return variants.reduce((result, left) => {
    return [...result, ...Append(current, left)];
  }, []);
}
function Distribute2(zipped) {
  return zipped.reduce((result, left) => {
    return guard_exports.IsEqual(left[0], true) ? Cross(result, Expand(left[1])) : Cross(result, [left[1]]);
  }, [[]]);
}
function DistributeArguments(parameters, arguments_, expression) {
  const distributionNames = CollectDistributionNames(expression);
  const distributionArray = BuildDistributionArray(parameters, distributionNames);
  const zippedArguments = ZipDistributionArray(arguments_, distributionArray);
  return IsDeferred(expression) && guard_exports.IsEqual(expression.action, "Conditional") ? Distribute2(zippedArguments) : IsDeferred(expression) && guard_exports.IsEqual(expression.action, "Mapped") ? Distribute2(zippedArguments) : [arguments_];
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/call/resolve_target.mjs
function FromNotResolvable() {
  return ["(not-resolvable)", Never()];
}
function FromNotGeneric() {
  return ["(not-generic)", Never()];
}
function FromGeneric(name, parameters, expression) {
  return [name, Generic(parameters, expression)];
}
function FromRef4(context, ref, arguments_) {
  return ref in context ? FromType6(context, ref, context[ref], arguments_) : FromNotResolvable();
}
function FromType6(context, name, target, arguments_) {
  return IsGeneric(target) ? FromGeneric(name, target.parameters, target.expression) : IsRef(target) ? FromRef4(context, target.$ref, arguments_) : FromNotGeneric();
}
function ResolveTarget(context, target, arguments_) {
  return FromType6(context, "(anonymous)", target, arguments_);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/call/resolve_arguments.mjs
function AssertArgumentExtends(name, type, extends_) {
  if (IsInfer(type) || IsCall(type) || result_exports.IsExtendsTrueLike(Extends({}, type, extends_)))
    return;
  const cause = { parameter: name, expect: extends_, actual: type };
  throw new Error(`Argument for parameter ${name} does not satisfy constraint`, { cause });
}
function BindArgument(context, state, name, extends_, type) {
  const instantiatedArgument = InstantiateType(context, state, type);
  AssertArgumentExtends(name, instantiatedArgument, extends_);
  return memory_exports.Assign(context, { [name]: instantiatedArgument });
}
function BindArguments(context, state, parameterLeft, parameterRight, arguments_) {
  const instantiatedExtends = InstantiateType(context, state, parameterLeft.extends);
  const instantiatedEquals = InstantiateType(context, state, parameterLeft.equals);
  return guard_exports.ShiftLeft(arguments_, (left, right) => BindParameters(BindArgument(context, state, parameterLeft["name"], instantiatedExtends, left), state, parameterRight, right), () => BindParameters(BindArgument(context, state, parameterLeft["name"], instantiatedExtends, instantiatedEquals), state, parameterRight, []));
}
function BindParameters(context, state, parameters, arguments_) {
  return guard_exports.ShiftLeft(parameters, (left, right) => BindArguments(context, state, left, right, arguments_), () => context);
}
function ResolveArgumentsContext(context, state, parameters, arguments_) {
  return BindParameters(context, state, parameters, arguments_);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/call/instantiate.mjs
function Peek(state) {
  const result = guard_exports.IsGreaterThan(state.callstack.length, 0) ? state.callstack[state.callstack.length - 1] : "";
  return result;
}
function IsTailCall(state, name) {
  const result = guard_exports.IsEqual(Peek(state), name);
  return result;
}
function CallDispatch(context, state, target, parameters, expression, arguments_) {
  const argumentsContext = ResolveArgumentsContext(context, state, parameters, arguments_);
  const returnType = InstantiateType(argumentsContext, State([...state["callstack"], target["$ref"]], state["visited"]), expression);
  return InstantiateType(argumentsContext, State([], []), returnType);
}
function CallDistributed(context, state, target, parameters, expression, distributedArguments) {
  return distributedArguments.reduce((result, arguments_) => [...result, CallDispatch(context, state, target, parameters, expression, arguments_)], []);
}
function CallImmediate(context, state, target, parameters, expression, arguments_) {
  const distributedArguments = DistributeArguments(parameters, arguments_, expression);
  const returnTypes = CallDistributed(context, state, target, parameters, expression, distributedArguments);
  const result = guard_exports.IsEqual(returnTypes.length, 1) ? returnTypes[0] : EvaluateUnion(returnTypes);
  return result;
}
function CallInstantiate(context, state, target, arguments_) {
  const instantiatedArguments = InstantiateTypes(context, state, arguments_);
  const resolved = ResolveTarget(context, target, arguments_);
  const name = resolved[0];
  const type = resolved[1];
  const result = IsGeneric(type) ? IsTailCall(state, name) ? CallConstruct(Ref(name), instantiatedArguments) : CallImmediate(context, state, Ref(name), type.parameters, type.expression, instantiatedArguments) : CallConstruct(target, instantiatedArguments);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/types/call.mjs
function CallConstruct(target, arguments_) {
  return memory_exports.Create({ ["~kind"]: "Call" }, { type: "call", target, arguments: arguments_ }, {});
}
function Call(target, arguments_) {
  return CallInstantiate({}, State([], []), target, arguments_);
}
function IsCall(value) {
  return IsKind(value, "Call");
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/immutable/instantiate_remove.mjs
function RemoveImmutableOperation(type) {
  return memory_exports.Discard(type, ["~immutable"]);
}
function RemoveImmutableAction(type, options) {
  const result = memory_exports.Update(RemoveImmutableOperation(type), {}, options);
  return result;
}
function RemoveImmutableInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return RemoveImmutableAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/intrinsics/mapping.mjs
function ApplyMapping(mapping, value) {
  return mapping(value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/intrinsics/from_literal.mjs
function FromLiteral3(mapping, value) {
  return guard_exports.IsString(value) ? Literal(ApplyMapping(mapping, value)) : Literal(value);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/intrinsics/from_template_literal.mjs
function FromTemplateLiteral(mapping, pattern) {
  const evaluated = EvaluateTemplateLiteral(pattern);
  const result = FromType7(mapping, evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/intrinsics/from_union.mjs
function FromUnion2(mapping, types) {
  const result = types.map((type) => FromType7(mapping, type));
  return Union(result);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/intrinsics/from_type.mjs
function FromType7(mapping, type) {
  return IsLiteral(type) ? FromLiteral3(mapping, type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral(mapping, type.pattern) : IsUnion(type) ? FromUnion2(mapping, type.anyOf) : type;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/capitalize.mjs
function CapitalizeDeferred(type, options = {}) {
  return Deferred("Capitalize", [type], options);
}
function Capitalize(type, options = {}) {
  return CapitalizeAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/lowercase.mjs
function LowercaseDeferred(type, options = {}) {
  return Deferred("Lowercase", [type], options);
}
function Lowercase(type, options = {}) {
  return LowercaseAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/uncapitalize.mjs
function UncapitalizeDeferred(type, options = {}) {
  return Deferred("Uncapitalize", [type], options);
}
function Uncapitalize(type, options = {}) {
  return UncapitalizeAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/uppercase.mjs
function UppercaseDeferred(type, options = {}) {
  return Deferred("Uppercase", [type], options);
}
function Uppercase(type, options = {}) {
  return UppercaseAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/intrinsics/instantiate.mjs
var CapitalizeMapping = (input) => input[0].toUpperCase() + input.slice(1);
var LowercaseMapping = (input) => input.toLowerCase();
var UncapitalizeMapping = (input) => input[0].toLowerCase() + input.slice(1);
var UppercaseMapping = (input) => input.toUpperCase();
function CapitalizeAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType7(CapitalizeMapping, type), {}, options) : CapitalizeDeferred(type, options);
  return result;
}
function LowercaseAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType7(LowercaseMapping, type), {}, options) : LowercaseDeferred(type, options);
  return result;
}
function UncapitalizeAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType7(UncapitalizeMapping, type), {}, options) : UncapitalizeDeferred(type, options);
  return result;
}
function UppercaseAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType7(UppercaseMapping, type), {}, options) : UppercaseDeferred(type, options);
  return result;
}
function CapitalizeInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return CapitalizeAction(instantiatedType, options);
}
function LowercaseInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return LowercaseAction(instantiatedType, options);
}
function UncapitalizeInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return UncapitalizeAction(instantiatedType, options);
}
function UppercaseInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return UppercaseAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/conditional.mjs
function ConditionalDeferred(left, right, true_, false_, options = {}) {
  return Deferred("Conditional", [left, right, true_, false_], options);
}
function Conditional(left, right, true_, false_, options = {}) {
  return ConditionalAction({}, State([], []), left, right, true_, false_, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/conditional/instantiate.mjs
function ConditionalOperation(context, state, left, right, true_, false_) {
  const extendsResult = Extends(context, left, right);
  return result_exports.IsExtendsUnion(extendsResult) ? Union([InstantiateType(extendsResult.inferred, state, true_), InstantiateType(context, state, false_)]) : result_exports.IsExtendsTrue(extendsResult) ? InstantiateType(extendsResult.inferred, state, true_) : InstantiateType(context, state, false_);
}
function ConditionalAction(context, state, left, right, true_, false_, options) {
  const result = CanInstantiate([left, right]) ? memory_exports.Update(ConditionalOperation(context, state, left, right, true_, false_), {}, options) : ConditionalDeferred(left, right, true_, false_, options);
  return result;
}
function ConditionalInstantiate(context, state, left, right, true_, false_, options) {
  const instantiatedLeft = InstantiateType(context, state, left);
  const instantiatedRight = InstantiateType(context, state, right);
  return ConditionalAction(context, state, instantiatedLeft, instantiatedRight, true_, false_, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/constructor_parameters.mjs
function ConstructorParametersDeferred(type, options = {}) {
  return Deferred("ConstructorParameters", [type], options);
}
function ConstructorParameters(type, options = {}) {
  return ConstructorParametersAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/constructor_parameters/instantiate.mjs
function ConstructorParametersOperation(type) {
  const parameters = IsConstructor2(type) ? type["parameters"] : [];
  const instantiatedParameters = InstantiateElements({}, State([], []), parameters);
  const result = Tuple(instantiatedParameters);
  return result;
}
function ConstructorParametersAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(ConstructorParametersOperation(type), {}, options) : ConstructorParametersDeferred(type, options);
  return result;
}
function ConstructorParametersInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return ConstructorParametersAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/exclude.mjs
function ExcludeDeferred(left, right, options = {}) {
  return Deferred("Exclude", [left, right], options);
}
function Exclude(left, right, options = {}) {
  return ExcludeAction(left, right, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/exclude/instantiate.mjs
function ExcludeAction(left, right, options) {
  const result = CanInstantiate([left, right]) ? memory_exports.Update(ExcludeOperation(left, right), {}, options) : ExcludeDeferred(left, right, options);
  return result;
}
function ExcludeInstantiate(context, state, left, right, options) {
  const instantiatedLeft = InstantiateType(context, state, left);
  const instantiatedRight = InstantiateType(context, state, right);
  return ExcludeAction(instantiatedLeft, instantiatedRight, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/extract.mjs
function ExtractDeferred(left, right, options = {}) {
  return Deferred("Extract", [left, right], options);
}
function Extract(left, right, options = {}) {
  return ExtractAction(left, right, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/extract/operation.mjs
function ExtractType(left, right) {
  const check = Extends({}, left, right);
  const result = result_exports.IsExtendsTrueLike(check) ? [left] : [];
  return result;
}
function ExtractUnion(types, right) {
  return types.reduce((result, head) => {
    return [...result, ...ExtractType(head, right)];
  }, []);
}
function ExtractOperation(left, right) {
  const evaluated = EvaluateType(left);
  const canonical = IsUnion(evaluated) ? evaluated.anyOf : [evaluated];
  const remaining = ExtractUnion(canonical, right);
  const result = EvaluateUnion(remaining);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/extract/instantiate.mjs
function ExtractAction(left, right, options) {
  const result = CanInstantiate([left, right]) ? memory_exports.Update(ExtractOperation(left, right), {}, options) : ExtractDeferred(left, right, options);
  return result;
}
function ExtractInstantiate(context, state, left, right, options) {
  const instantiatedLeft = InstantiateType(context, state, left);
  const instantiatedRight = InstantiateType(context, state, right);
  return ExtractAction(instantiatedLeft, instantiatedRight, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/helpers/keys_to_indexer.mjs
function KeysToLiterals(keys) {
  return keys.reduce((result, left) => {
    return IsLiteralValue(left) ? [...result, Literal(left)] : result;
  }, []);
}
function KeysToIndexer(keys) {
  const literals = KeysToLiterals(keys);
  const result = Union(literals);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/indexed.mjs
function IndexDeferred(type, indexer, options = {}) {
  return Deferred("Index", [type, indexer], options);
}
function Index(type, indexer_or_keys, options = {}) {
  const indexer = guard_exports.IsArray(indexer_or_keys) ? KeysToIndexer(indexer_or_keys) : indexer_or_keys;
  return IndexAction(type, indexer, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_cyclic.mjs
function FromCyclic(defs, ref) {
  const target = CyclicTarget(defs, ref);
  const result = FromType8(target);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_dependent.mjs
function FromDependent(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType8(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_intersect.mjs
function CollapseIntersectProperties(left, right) {
  const leftKeys = guard_exports.Keys(left).filter((key) => !guard_exports.HasPropertyKey(right, key));
  const rightKeys = guard_exports.Keys(right).filter((key) => !guard_exports.HasPropertyKey(left, key));
  const sharedKeys = guard_exports.Keys(left).filter((key) => guard_exports.HasPropertyKey(right, key));
  const leftProperties = leftKeys.reduce((result, key) => ({ ...result, [key]: left[key] }), {});
  const rightProperties = rightKeys.reduce((result, key) => ({ ...result, [key]: right[key] }), {});
  const sharedProperties = sharedKeys.reduce((result, key) => ({ ...result, [key]: EvaluateIntersect([left[key], right[key]]) }), {});
  const unique = memory_exports.Assign(leftProperties, rightProperties);
  const shared = memory_exports.Assign(unique, sharedProperties);
  return shared;
}
function FromIntersect(types) {
  return types.reduce((result, left) => {
    return CollapseIntersectProperties(result, FromType8(left));
  }, {});
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_object.mjs
function FromObject3(properties) {
  return properties;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_tuple.mjs
function FromTuple(types) {
  const object = TupleToObject(Tuple(types));
  const result = FromType8(object);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_union.mjs
function CollapseUnionProperties(left, right) {
  const sharedKeys = guard_exports.Keys(left).filter((key) => key in right);
  const result = sharedKeys.reduce((result2, key) => {
    return { ...result2, [key]: EvaluateUnion([left[key], right[key]]) };
  }, {});
  return result;
}
function ReduceVariants(types, result) {
  return guard_exports.ShiftLeft(types, (left, right) => ReduceVariants(right, CollapseUnionProperties(result, FromType8(left))), () => result);
}
function FromUnion3(types) {
  return guard_exports.ShiftLeft(types, (left, right) => ReduceVariants(right, FromType8(left)), () => Unreachable());
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/from_type.mjs
function FromType8(type) {
  return IsCyclic(type) ? FromCyclic(type.$defs, type.$ref) : IsDependent(type) ? FromDependent(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect(type.allOf) : IsUnion(type) ? FromUnion3(type.anyOf) : IsTuple(type) ? FromTuple(type.items) : IsObject2(type) ? FromObject3(type.properties) : {};
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/object/collapse.mjs
function CollapseToObject(type) {
  const properties = FromType8(type);
  const result = _Object_(properties);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/helpers/keys.mjs
var integerKeyPattern = new RegExp("^(?:0|[1-9][0-9]*)$");
function ConvertToIntegerKey(value) {
  const normal = `${value}`;
  return integerKeyPattern.test(normal) ? parseInt(normal) : value;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexed/from_array.mjs
function NormalizeLiteral(value) {
  return Literal(ConvertToIntegerKey(value));
}
function NormalizeIndexerTypes(types) {
  return types.map((type) => NormalizeIndexer(type));
}
function NormalizeIndexer(type) {
  return IsIntersect(type) ? Intersect(NormalizeIndexerTypes(type.allOf)) : IsUnion(type) ? Union(NormalizeIndexerTypes(type.anyOf)) : IsLiteral(type) ? NormalizeLiteral(type.const) : type;
}
function FromArray2(type, indexer) {
  const normalizedIndexer = NormalizeIndexer(indexer);
  const check = Extends({}, normalizedIndexer, Number2());
  const result = (
    // indexer
    result_exports.IsExtendsTrueLike(check) ? type : IsLiteral(indexer) && guard_exports.IsEqual(indexer.const, "length") ? Number2() : Never()
  );
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_cyclic.mjs
function FromCyclic2(defs, ref) {
  const target = CyclicTarget(defs, ref);
  const result = FromType9(target);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_dependent.mjs
function FromDependent2(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType9(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_enum.mjs
function FromEnum(values) {
  const evaluated = EvaluateEnum(values);
  const result = FromType9(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_intersect.mjs
function FromIntersect2(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType9(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_literal.mjs
function FromLiteral4(value) {
  const result = [`${value}`];
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_template_literal.mjs
function FromTemplateLiteral2(pattern) {
  const evaluated = EvaluateTemplateLiteral(pattern);
  const result = FromType9(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_union.mjs
function FromUnion4(types) {
  return types.reduce((result, left) => {
    return [...result, ...FromType9(left)];
  }, []);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/from_type.mjs
function FromType9(type) {
  return IsCyclic(type) ? FromCyclic2(type.$defs, type.$ref) : IsDependent(type) ? FromDependent2(type.if, type.then, type.else) : IsEnum(type) ? FromEnum(type.enum) : IsIntersect(type) ? FromIntersect2(type.allOf) : IsLiteral(type) ? FromLiteral4(type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral2(type.pattern) : IsUnion(type) ? FromUnion4(type.anyOf) : [];
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/to_indexable_keys.mjs
function ToIndexableKeys(type) {
  const result = FromType9(type);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/this/expand_this.mjs
function FromTypes5(properties, types) {
  return types.map((type) => FromType10(properties, type));
}
function FromType10(properties, type) {
  return IsArray2(type) ? _Array_(FromType10(properties, type.items)) : IsConstructor2(type) ? Constructor(FromTypes5(properties, type.parameters), FromType10(properties, type.instanceType)) : IsFunction2(type) ? _Function_(FromTypes5(properties, type.parameters), FromType10(properties, type.returnType)) : IsTuple(type) ? Tuple(FromTypes5(properties, type.items)) : IsUnion(type) ? Union(FromTypes5(properties, type.anyOf)) : IsIntersect(type) ? Intersect(FromTypes5(properties, type.allOf)) : IsThis(type) ? _Object_(properties) : type;
}
function ExpandThis(properties, type) {
  const result = FromType10(properties, type);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexed/from_object.mjs
function IndexProperty(properties, key) {
  const selectedType = key in properties ? properties[key] : Never();
  const result = ExpandThis(properties, selectedType);
  return result;
}
function IndexProperties(properties, keys) {
  return keys.reduce((result, left) => {
    return [...result, IndexProperty(properties, left)];
  }, []);
}
function FromIndexer(properties, indexer) {
  const keys = ToIndexableKeys(indexer);
  const variants = IndexProperties(properties, keys);
  const result = EvaluateUnion(variants);
  return result;
}
var NumericKeyPattern = new RegExp(IntegerKey);
function NumericKeys(keys) {
  const result = keys.filter((key) => NumericKeyPattern.test(key));
  return result;
}
function FromIndexerNumber(properties) {
  const keys = PropertyKeys(properties);
  const numericKeys = NumericKeys(keys);
  const variants = IndexProperties(properties, numericKeys);
  const result = EvaluateUnion(variants);
  return result;
}
function FromObject4(properties, indexer) {
  const result = IsNumber3(indexer) ? FromIndexerNumber(properties) : FromIndexer(properties, indexer);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexed/array_indexer.mjs
function ConvertLiteral(value) {
  return Literal(ConvertToIntegerKey(value));
}
function ArrayIndexerTypes(types) {
  return types.map((type) => FormatArrayIndexer(type));
}
function FormatArrayIndexer(type) {
  return IsIntersect(type) ? Intersect(ArrayIndexerTypes(type.allOf)) : IsUnion(type) ? Union(ArrayIndexerTypes(type.anyOf)) : IsLiteral(type) ? ConvertLiteral(type.const) : type;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexed/from_tuple.mjs
function IndexElementsWithIndexer(types, indexer) {
  return types.reduceRight((result, right, index) => {
    const check = Extends({}, Literal(index), indexer);
    return result_exports.IsExtendsTrueLike(check) ? [right, ...result] : result;
  }, []);
}
function FromTupleWithIndexer(types, indexer) {
  const formattedArrayIndexer = FormatArrayIndexer(indexer);
  const elements = IndexElementsWithIndexer(types, formattedArrayIndexer);
  return EvaluateUnionFast(elements);
}
function FromTupleWithoutIndexer(types) {
  return EvaluateUnionFast(types);
}
function FromTuple2(types, indexer) {
  return (
    // length (intrinsic)
    IsLiteral(indexer) && guard_exports.IsEqual(indexer.const, "length") ? Literal(types.length) : IsNumber3(indexer) || IsInteger2(indexer) ? FromTupleWithoutIndexer(types) : FromTupleWithIndexer(types, indexer)
  );
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexed/from_type.mjs
function FromType11(type, indexer) {
  return IsArray2(type) ? FromArray2(type.items, indexer) : IsObject2(type) ? FromObject4(type.properties, indexer) : IsTuple(type) ? FromTuple2(type.items, indexer) : Never();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexed/instantiate.mjs
function NormalizeType(type) {
  const result = IsCyclic(type) || IsDependent(type) || IsIntersect(type) || IsUnion(type) ? CollapseToObject(type) : type;
  return result;
}
function IndexAction(type, indexer, options) {
  const result = CanInstantiate([type, indexer]) ? memory_exports.Update(FromType11(NormalizeType(type), indexer), {}, options) : IndexDeferred(type, indexer, options);
  return result;
}
function IndexInstantiate(context, state, type, indexer, options) {
  const instantiatedType = InstantiateType(context, state, type);
  const instantiatedIndexer = InstantiateType(context, state, indexer);
  return IndexAction(instantiatedType, instantiatedIndexer, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/instance_type.mjs
function InstanceTypeDeferred(type, options = {}) {
  return Deferred("InstanceType", [type], options);
}
function InstanceType(type, options = {}) {
  return InstanceTypeAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/instance_type/instantiate.mjs
function InstanceTypeOperation(type) {
  return IsConstructor2(type) ? type["instanceType"] : Never();
}
function InstanceTypeAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(InstanceTypeOperation(type), {}, options) : InstanceTypeDeferred(type, options);
  return result;
}
function InstanceTypeInstantiate(context, state, type, options = {}) {
  const instantiatedType = InstantiateType(context, state, type);
  return InstanceTypeAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/keyof.mjs
function KeyOfDeferred(type, options = {}) {
  return Deferred("KeyOf", [type], options);
}
function KeyOf2(type, options = {}) {
  return KeyOfAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/from_any.mjs
function FromAny() {
  return Union([Number2(), String2(), Symbol2()]);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/from_array.mjs
function FromArray3(_type) {
  return Number2();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/from_object.mjs
function FromPropertyKeys(keys) {
  const result = keys.reduce((result2, left) => {
    return IsLiteralValue(left) ? [...result2, Literal(ConvertToIntegerKey(left))] : Unreachable();
  }, []);
  return result;
}
function FromObject5(properties) {
  const propertyKeys = guard_exports.Keys(properties);
  const variants = FromPropertyKeys(propertyKeys);
  const result = EvaluateUnionFast(variants);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/from_record.mjs
function FromRecord2(type) {
  return RecordKey(type);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/from_tuple.mjs
function FromTuple3(types) {
  const result = types.map((_, index) => Literal(index));
  return EvaluateUnionFast(result);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/from_type.mjs
function FromType12(type) {
  return IsAny(type) ? FromAny() : IsArray2(type) ? FromArray3(type.items) : IsObject2(type) ? FromObject5(type.properties) : IsRecord(type) ? FromRecord2(type) : IsTuple(type) ? FromTuple3(type.items) : Never();
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/keyof/instantiate.mjs
function NormalizeType2(type) {
  const result = IsCyclic(type) || IsDependent(type) || IsIntersect(type) || IsUnion(type) ? CollapseToObject(type) : type;
  return result;
}
function KeyOfAction(type, options) {
  return CanInstantiate([type]) ? memory_exports.Update(FromType12(NormalizeType2(type)), {}, options) : KeyOfDeferred(type, options);
}
function KeyOfInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return KeyOfAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/mapped.mjs
function MappedDeferred(identifier, type, as, property, options = {}) {
  return Deferred("Mapped", [identifier, type, as, property], options);
}
function Mapped(identifier, type, as, property, options = {}) {
  return MappedAction({}, State([], []), identifier, type, as, property, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/mapped/mapped_variants.mjs
function FromTemplateLiteral3(pattern) {
  const evaluated = EvaluateTemplateLiteral(pattern);
  const result = FromType13(evaluated);
  return result;
}
function FromUnion5(types) {
  return types.reduce((result, left) => {
    return [...result, ...FromType13(left)];
  }, []);
}
function FromEnum2(values) {
  const evaluated = EvaluateEnum(values);
  const result = FromType13(evaluated);
  return result;
}
function FromLiteral5(value) {
  const result = guard_exports.IsNumber(value) ? [Literal(`${value}`)] : [Literal(value)];
  return result;
}
function FromType13(type) {
  const result = IsEnum(type) ? FromEnum2(type.enum) : IsLiteral(type) ? FromLiteral5(type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral3(type.pattern) : IsUnion(type) ? FromUnion5(type.anyOf) : [type];
  return result;
}
function MappedVariants(type) {
  const result = FromType13(type);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/mapped/mapped_operation.mjs
function CanonicalAs(instantiatedAs) {
  const result = IsTemplateLiteral(instantiatedAs) ? EvaluateTemplateLiteral(instantiatedAs.pattern) : instantiatedAs;
  return result;
}
function MappedVariant(context, state, identifier, variant, as, property) {
  const variantContext = memory_exports.Assign(context, { [identifier["name"]]: variant });
  const instantiatedAs = InstantiateType(variantContext, state, as);
  const canonicalAs = CanonicalAs(instantiatedAs);
  const instantiatedProperty = InstantiateType(variantContext, state, property);
  return IsLiteralNumber(canonicalAs) || IsLiteralString(canonicalAs) ? { [canonicalAs.const]: instantiatedProperty } : {};
}
function MappedProperties(context, state, identifier, variants, as, property) {
  return variants.reduce((result, left) => {
    return [...result, MappedVariant(context, state, identifier, left, as, property)];
  }, []);
}
function MappedObjects(properties) {
  return properties.reduce((result, left) => {
    return [...result, _Object_(left)];
  }, []);
}
function MappedOperation(context, state, identifier, type, as, property) {
  const variants = MappedVariants(type);
  const mappedProperties = MappedProperties(context, state, identifier, variants, as, property);
  const mappedObjects = MappedObjects(mappedProperties);
  const result = EvaluateIntersect(mappedObjects);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/mapped/instantiate.mjs
function MappedAction(context, state, identifier, type, as, property, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(MappedOperation(context, state, identifier, type, as, property), {}, options) : MappedDeferred(identifier, type, as, property, options);
  return result;
}
function MappedInstantiate(context, state, identifier, type, as, property, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return MappedAction(context, state, identifier, instantiatedType, as, property, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/module/instantiate.mjs
function InstantiateCyclics(context, declarations, cyclicKeys) {
  const declarationContext = memory_exports.Assign(context, declarations);
  const declarationKeys = guard_exports.Keys(declarations).filter((key) => cyclicKeys.includes(key));
  return declarationKeys.reduce((result, key) => {
    return { ...result, [key]: InstantiateCyclic(declarationContext, key, declarations[key]) };
  }, {});
}
function InstantiateNonCyclics(context, declarations, cyclicKeys) {
  const declarationContext = memory_exports.Assign(context, declarations);
  const declarationKeys = guard_exports.Keys(declarations).filter((key) => !cyclicKeys.includes(key));
  return declarationKeys.reduce((result, key) => {
    return { ...result, [key]: InstantiateType(declarationContext, State([], []), declarations[key]) };
  }, {});
}
function InstantiateModule(context, declarations, options) {
  const cyclicCandidates = CyclicCandidates(declarations);
  const instantiatedCyclics = InstantiateCyclics(context, declarations, cyclicCandidates);
  const instantiatedNonCyclics = InstantiateNonCyclics(context, declarations, cyclicCandidates);
  const instantiatedModule = { ...instantiatedCyclics, ...instantiatedNonCyclics };
  return memory_exports.Update(instantiatedModule, {}, options);
}
function ModuleInstantiate(context, _state, declarations, options) {
  const instantiatedModule = InstantiateModule(context, declarations, options);
  return instantiatedModule;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/non_nullable.mjs
function NonNullableDeferred(type, options = {}) {
  return Deferred("NonNullable", [type], options);
}
function NonNullable(type, options = {}) {
  return NonNullableAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/non_nullable/instantiate.mjs
function NonNullableOperation(type) {
  const excluded = Union([Null(), Undefined()]);
  return ExcludeAction(type, excluded, {});
}
function NonNullableAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(NonNullableOperation(type), {}, options) : NonNullableDeferred(type, options);
  return result;
}
function NonNullableInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return NonNullableAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/omit.mjs
function OmitDeferred(type, indexer, options = {}) {
  return Deferred("Omit", [type, indexer], options);
}
function Omit(type, indexer_or_keys, options = {}) {
  const indexer = guard_exports.IsArray(indexer_or_keys) ? KeysToIndexer(indexer_or_keys) : indexer_or_keys;
  return OmitAction(type, indexer, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/indexable/to_indexable.mjs
function ToIndexable(type) {
  const collapsed = CollapseToObject(type);
  const result = IsObject2(collapsed) ? collapsed.properties : Unreachable();
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/omit/from_type.mjs
function FromKeys(properties, keys) {
  const result = guard_exports.Keys(properties).reduce((result2, key) => {
    return keys.includes(key) ? result2 : { ...result2, [key]: properties[key] };
  }, {});
  return result;
}
function FromType14(type, indexer) {
  const indexable = ToIndexable(type);
  const indexableKeys = ToIndexableKeys(indexer);
  const omitted = FromKeys(indexable, indexableKeys);
  const result = _Object_(omitted);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/omit/instantiate.mjs
function OmitAction(type, indexer, options) {
  const result = CanInstantiate([type, indexer]) ? memory_exports.Update(FromType14(type, indexer), {}, options) : OmitDeferred(type, indexer, options);
  return result;
}
function OmitInstantiate(context, state, type, indexer, options) {
  const instantiatedType = InstantiateType(context, state, type);
  const instantiatedIndexer = InstantiateType(context, state, indexer);
  return OmitAction(instantiatedType, instantiatedIndexer, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/parameters.mjs
function ParametersDeferred(type, options = {}) {
  return Deferred("Parameters", [type], options);
}
function Parameters(type, options = {}) {
  return ParametersAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/parameters/instantiate.mjs
function ParametersOperation(type) {
  const parameters = IsFunction2(type) ? type["parameters"] : [];
  const instantiatedParameters = InstantiateElements({}, State([], []), parameters);
  const result = Tuple(instantiatedParameters);
  return result;
}
function ParametersAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(ParametersOperation(type), {}, options) : ParametersDeferred(type, options);
  return result;
}
function ParametersInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return ParametersAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/partial.mjs
function PartialDeferred(type, options = {}) {
  return Deferred("Partial", [type], options);
}
function Partial(type, options = {}) {
  return PartialAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/from_cyclic.mjs
function FromCyclic3(defs, ref) {
  const target = CyclicTarget(defs, ref);
  const partial = FromType15(target);
  const result = Cyclic(memory_exports.Assign(defs, { [ref]: partial }), ref);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/from_dependent.mjs
function FromDependent3(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType15(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/from_intersect.mjs
function FromIntersect3(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType15(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/from_union.mjs
function FromUnion6(types) {
  const result = types.map((type) => FromType15(type));
  return Union(result);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/from_object.mjs
function FromObject6(properties) {
  const mapped = guard_exports.Keys(properties).reduce((result2, left) => {
    return { ...result2, [left]: AddOptional(properties[left]) };
  }, {});
  const result = _Object_(mapped);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/from_type.mjs
function FromType15(type) {
  return IsCyclic(type) ? FromCyclic3(type.$defs, type.$ref) : IsDependent(type) ? FromDependent3(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect3(type.allOf) : IsUnion(type) ? FromUnion6(type.anyOf) : IsObject2(type) ? FromObject6(type.properties) : _Object_({});
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/partial/instantiate.mjs
function PartialAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType15(type), {}, options) : PartialDeferred(type, options);
  return result;
}
function PartialInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return PartialAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/pick.mjs
function PickDeferred(type, indexer, options = {}) {
  return Deferred("Pick", [type, indexer], options);
}
function Pick(type, indexer_or_keys, options = {}) {
  const indexer = guard_exports.IsArray(indexer_or_keys) ? KeysToIndexer(indexer_or_keys) : indexer_or_keys;
  return PickAction(type, indexer, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/pick/from_type.mjs
function FromKeys2(properties, keys) {
  const result = guard_exports.Keys(properties).reduce((result2, key) => {
    return keys.includes(key) ? memory_exports.Assign(result2, { [key]: properties[key] }) : result2;
  }, {});
  return result;
}
function FromType16(type, indexer) {
  const indexable = ToIndexable(type);
  const keys = ToIndexableKeys(indexer);
  const applied = FromKeys2(indexable, keys);
  const result = _Object_(applied);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/pick/instantiate.mjs
function PickAction(type, indexer, options) {
  const result = CanInstantiate([type, indexer]) ? memory_exports.Update(FromType16(type, indexer), {}, options) : PickDeferred(type, indexer, options);
  return result;
}
function PickInstantiate(context, state, type, indexer, options) {
  const instantiatedType = InstantiateType(context, state, type);
  const instantiatedIndexer = InstantiateType(context, state, indexer);
  return PickAction(instantiatedType, instantiatedIndexer, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/readonly_object.mjs
function ReadonlyObjectDeferred(type, options = {}) {
  return Deferred("ReadonlyObject", [type], options);
}
function ReadonlyObject(type, options = {}) {
  return ReadonlyObjectAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_array.mjs
function FromArray4(type) {
  const result = AddImmutable(_Array_(type));
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_cyclic.mjs
function FromCyclic4(defs, ref) {
  const target = CyclicTarget(defs, ref);
  const partial = FromType17(target);
  const result = Cyclic(memory_exports.Assign(defs, { [ref]: partial }), ref);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_dependent.mjs
function FromDependent4(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType17(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_intersect.mjs
function FromIntersect4(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType17(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_object.mjs
function FromObject7(properties) {
  const mapped = guard_exports.Keys(properties).reduce((result2, left) => {
    return { ...result2, [left]: AddReadonly(properties[left]) };
  }, {});
  const result = _Object_(mapped);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_tuple.mjs
function FromTuple4(types) {
  const result = AddImmutable(Tuple(types));
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_union.mjs
function FromUnion7(types) {
  const result = types.map((type) => FromType17(type));
  return Union(result);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/from_type.mjs
function FromType17(type) {
  return IsArray2(type) ? FromArray4(type.items) : IsCyclic(type) ? FromCyclic4(type.$defs, type.$ref) : IsDependent(type) ? FromDependent4(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect4(type.allOf) : IsObject2(type) ? FromObject7(type.properties) : IsTuple(type) ? FromTuple4(type.items) : IsUnion(type) ? FromUnion7(type.anyOf) : type;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/readonly_object/instantiate.mjs
function ReadonlyObjectAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType17(type), {}, options) : ReadonlyObjectDeferred(type);
  return result;
}
function ReadonlyObjectInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return ReadonlyObjectAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/ref/instantiate.mjs
function RefInstantiate(context, state, type, ref) {
  return state.visited.includes(ref) ? type : ref in context ? InstantiateType(context, State(state["callstack"], [...state["visited"], ref]), context[ref]) : type;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/from_cyclic.mjs
function FromCyclic5(defs, ref) {
  const target = CyclicTarget(defs, ref);
  const partial = FromType18(target);
  const result = Cyclic(memory_exports.Assign(defs, { [ref]: partial }), ref);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/from_dependent.mjs
function FromDependent5(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType18(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/from_intersect.mjs
function FromIntersect5(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType18(evaluated);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/from_union.mjs
function FromUnion8(types) {
  const result = types.map((type) => FromType18(type));
  return Union(result);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/from_object.mjs
function FromObject8(properties) {
  const mapped = guard_exports.Keys(properties).reduce((result2, left) => {
    return { ...result2, [left]: RemoveOptional(properties[left]) };
  }, {});
  const result = _Object_(mapped);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/from_type.mjs
function FromType18(type) {
  return IsCyclic(type) ? FromCyclic5(type.$defs, type.$ref) : IsDependent(type) ? FromDependent5(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect5(type.allOf) : IsUnion(type) ? FromUnion8(type.anyOf) : IsObject2(type) ? FromObject8(type.properties) : _Object_({});
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/required.mjs
function RequiredDeferred(type, options = {}) {
  return Deferred("Required", [type], options);
}
function Required(type, options = {}) {
  return RequiredAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/required/instantiate.mjs
function RequiredAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(FromType18(type), {}, options) : RequiredDeferred(type, options);
  return result;
}
function RequiredInstantiate(context, state, type, options) {
  const instaniatedType = InstantiateType(context, state, type);
  return RequiredAction(instaniatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/return_type.mjs
function ReturnTypeDeferred(type, options = {}) {
  return Deferred("ReturnType", [type], options);
}
function ReturnType(type, options = {}) {
  return ReturnTypeAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/return_type/instantiate.mjs
function ReturnTypeOperation(type) {
  return IsFunction2(type) ? type["returnType"] : Never();
}
function ReturnTypeAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(ReturnTypeOperation(type), {}, options) : ReturnTypeDeferred(type, options);
  return result;
}
function ReturnTypeInstantiate(context, state, type, options = {}) {
  const instantiatedType = InstantiateType(context, state, type);
  return ReturnTypeAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/with.mjs
function WithDeferred(type, options) {
  return Deferred("With", [type, options], {});
}
function With2(type, options) {
  return WithAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/with/instantiate.mjs
function WithAction(type, options) {
  const result = CanInstantiate([type]) ? memory_exports.Update(type, {}, options) : WithDeferred(type, options);
  return result;
}
function WithInstantiate(context, state, type, options) {
  const instaniatedType = InstantiateType(context, state, type);
  return WithAction(instaniatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/rest/spread.mjs
function SpreadElement(type) {
  const result = IsRest(type) ? IsTuple(type.items) ? RestSpread(type.items.items) : IsInfer(type.items) ? [type] : IsRef(type.items) ? [type] : [Never()] : [type];
  return result;
}
function RestSpread(types) {
  const result = types.reduce((result2, left) => {
    return [...result2, ...SpreadElement(left)];
  }, []);
  return result;
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/instantiate.mjs
function State(callstack, visited) {
  return { callstack, visited };
}
function CanInstantiate(types) {
  return guard_exports.ShiftLeft(types, (left, right) => IsRef(left) ? false : CanInstantiate(right), () => true);
}
function InstantiateProperties(context, state, properties) {
  return guard_exports.Keys(properties).reduce((result, key) => {
    return { ...result, [key]: InstantiateType(context, state, properties[key]) };
  }, {});
}
function InstantiateElements(context, state, types) {
  const elements = InstantiateTypes(context, state, types);
  const result = RestSpread(elements);
  return result;
}
function InstantiateTypes(context, state, types) {
  return types.map((type) => InstantiateType(context, state, type));
}
function WithModifiers(type, instantiatedType) {
  const withOptional = IsOptional(type) ? AddOptionalAction(instantiatedType, {}) : instantiatedType;
  const withReadonly = IsReadonly(type) ? AddReadonlyAction(withOptional, {}) : withOptional;
  const withImmutable = IsImmutable(type) ? AddImmutableAction(withReadonly, {}) : withReadonly;
  return withImmutable;
}
function InstantiateDeferred(context, state, action, parameters, options) {
  return (
    // Modifiers
    guard_exports.IsEqual(action, "AddImmutable") ? AddImmutableInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "RemoveImmutable") ? RemoveImmutableInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "AddReadonly") ? AddReadonlyInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "RemoveReadonly") ? RemoveReadonlyInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "AddOptional") ? AddOptionalInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "RemoveOptional") ? RemoveOptionalInstantiate(context, state, parameters[0], options) : (
      // Actions
      guard_exports.IsEqual(action, "Capitalize") ? CapitalizeInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Conditional") ? ConditionalInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) : guard_exports.IsEqual(action, "ConstructorParameters") ? ConstructorParametersInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Evaluate") ? EvaluateInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Exclude") ? ExcludeInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "Extract") ? ExtractInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "Index") ? IndexInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "InstanceType") ? InstanceTypeInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Interface") ? InterfaceInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "KeyOf") ? KeyOfInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Lowercase") ? LowercaseInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Mapped") ? MappedInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) : guard_exports.IsEqual(action, "Module") ? ModuleInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "NonNullable") ? NonNullableInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Pick") ? PickInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "Parameters") ? ParametersInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Partial") ? PartialInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Omit") ? OmitInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "ReadonlyObject") ? ReadonlyObjectInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Record") ? RecordInstantiate(context, state, parameters[0], parameters[1], options) : guard_exports.IsEqual(action, "Required") ? RequiredInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "ReturnType") ? ReturnTypeInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "TemplateLiteral") ? TemplateLiteralInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Uncapitalize") ? UncapitalizeInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "Uppercase") ? UppercaseInstantiate(context, state, parameters[0], options) : guard_exports.IsEqual(action, "With") ? WithInstantiate(context, state, parameters[0], parameters[1]) : Deferred(action, parameters, options)
    )
  );
}
function InstantiateImmediate(context, state, type) {
  const instantiatedType = IsRef(type) ? RefInstantiate(context, state, type, type.$ref) : IsArray2(type) ? _Array_(InstantiateType(context, state, type.items), ArrayOptions(type)) : IsCall(type) ? CallInstantiate(context, state, type.target, type.arguments) : IsConstructor2(type) ? Constructor(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.instanceType), ConstructorOptions(type)) : IsFunction2(type) ? _Function_(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.returnType), FunctionOptions(type)) : IsDependent(type) ? Dependent(InstantiateType(context, state, type.if), InstantiateType(context, state, type.then), InstantiateType(context, state, type.else), DependentOptions(type)) : IsIntersect(type) ? Intersect(InstantiateTypes(context, state, type.allOf), IntersectOptions(type)) : IsObject2(type) ? _Object_(InstantiateProperties(context, state, type.properties), ObjectOptions(type)) : IsRecord(type) ? RecordFromPattern(RecordPattern(type), InstantiateType(context, state, RecordValue(type))) : IsRest(type) ? Rest(InstantiateType(context, state, type.items)) : IsTuple(type) ? Tuple(InstantiateElements(context, state, type.items), TupleOptions(type)) : IsUnion(type) ? Union(InstantiateTypes(context, state, type.anyOf), UnionOptions(type)) : type;
  const withModifiers = WithModifiers(type, instantiatedType);
  return withModifiers;
}
function InstantiateType(context, state, type) {
  const result = IsDeferred(type) ? InstantiateDeferred(context, state, type.action, type.parameters, type.options) : InstantiateImmediate(context, state, type);
  return result;
}
function Instantiate(context, type) {
  return InstantiateType(context, State([], []), type);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/engine/immutable/instantiate_add.mjs
function AddImmutableOperation(type) {
  return memory_exports.Update(type, { "~immutable": true }, {});
}
function AddImmutableAction(type, options) {
  const result = memory_exports.Update(AddImmutableOperation(type), {}, options);
  return result;
}
function AddImmutableInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return AddImmutableAction(instantiatedType, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/_add_immutable.mjs
function AddImmutableDeferred(type, options = {}) {
  return Deferred("AddImmutable", [type], options);
}
function AddImmutable(type, options = {}) {
  return AddImmutableAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/evaluate.mjs
function EvaluateDeferred(type, options = {}) {
  return Deferred("Evaluate", [type], options);
}
function Evaluate(type, options = {}) {
  return EvaluateAction(type, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/action/module.mjs
function ModuleDeferred(declarations, options = {}) {
  return Deferred("Module", [declarations], options);
}
function Module2(declarations, options = {}) {
  return ModuleInstantiate({}, State([], []), declarations, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/type/script/script.mjs
function Script2(...args) {
  const [context, input, options] = arguments_exports.Match(args, {
    2: (script, options2) => guard_exports.IsString(script) ? [{}, script, options2] : [script, options2, {}],
    3: (context2, script, options2) => [context2, script, options2],
    1: (script) => [{}, script, {}]
  });
  const result = Script(input);
  const parsed = guard_exports.IsArray(result) && guard_exports.IsEqual(result.length, 2) ? InstantiateType(context, State([], []), result[0]) : Never();
  return memory_exports.Update(parsed, {}, options);
}

// ../boardstate.worktrees/net-transport/node_modules/.pnpm/typebox@1.3.3/node_modules/typebox/build/typebox.mjs
var typebox_exports = {};
__export(typebox_exports, {
  Any: () => Any,
  Array: () => _Array_,
  BigInt: () => BigInt2,
  Boolean: () => Boolean2,
  Call: () => Call,
  Capitalize: () => Capitalize,
  Codec: () => Codec,
  Conditional: () => Conditional,
  Constructor: () => Constructor,
  ConstructorParameters: () => ConstructorParameters,
  Cyclic: () => Cyclic,
  Decode: () => Decode,
  DecodeBuilder: () => DecodeBuilder,
  Dependent: () => Dependent,
  Encode: () => Encode,
  EncodeBuilder: () => EncodeBuilder,
  Enum: () => Enum,
  Evaluate: () => Evaluate,
  Exclude: () => Exclude,
  Extends: () => Extends,
  ExtendsResult: () => result_exports,
  Extract: () => Extract,
  Function: () => _Function_,
  Generic: () => Generic,
  Identifier: () => Identifier,
  Immutable: () => Immutable,
  Index: () => Index,
  Infer: () => Infer,
  InstanceType: () => InstanceType,
  Instantiate: () => Instantiate,
  Integer: () => Integer,
  Interface: () => Interface,
  Intersect: () => Intersect,
  IsAny: () => IsAny,
  IsArray: () => IsArray2,
  IsBigInt: () => IsBigInt2,
  IsBoolean: () => IsBoolean3,
  IsCall: () => IsCall,
  IsCodec: () => IsCodec,
  IsConstructor: () => IsConstructor2,
  IsCyclic: () => IsCyclic,
  IsDependent: () => IsDependent,
  IsEnum: () => IsEnum,
  IsEnumValue: () => IsEnumValue,
  IsFunction: () => IsFunction2,
  IsGeneric: () => IsGeneric,
  IsIdentifier: () => IsIdentifier,
  IsImmutable: () => IsImmutable,
  IsInfer: () => IsInfer,
  IsInteger: () => IsInteger2,
  IsIntersect: () => IsIntersect,
  IsKind: () => IsKind,
  IsLiteral: () => IsLiteral,
  IsNever: () => IsNever,
  IsNull: () => IsNull2,
  IsNumber: () => IsNumber3,
  IsObject: () => IsObject2,
  IsOptional: () => IsOptional,
  IsParameter: () => IsParameter,
  IsReadonly: () => IsReadonly,
  IsRecord: () => IsRecord,
  IsRef: () => IsRef,
  IsRefine: () => IsRefine,
  IsRest: () => IsRest,
  IsSchema: () => IsSchema,
  IsString: () => IsString3,
  IsSymbol: () => IsSymbol2,
  IsTemplateLiteral: () => IsTemplateLiteral,
  IsThis: () => IsThis,
  IsTuple: () => IsTuple,
  IsUndefined: () => IsUndefined2,
  IsUnion: () => IsUnion,
  IsUnknown: () => IsUnknown,
  IsUnsafe: () => IsUnsafe,
  IsVoid: () => IsVoid,
  KeyOf: () => KeyOf2,
  Literal: () => Literal,
  Lowercase: () => Lowercase,
  Mapped: () => Mapped,
  Module: () => Module2,
  Never: () => Never,
  NonNullable: () => NonNullable,
  Null: () => Null,
  Number: () => Number2,
  Object: () => _Object_,
  Omit: () => Omit,
  Optional: () => Optional,
  Parameter: () => Parameter,
  Parameters: () => Parameters,
  Partial: () => Partial,
  Pick: () => Pick,
  Readonly: () => Readonly,
  ReadonlyObject: () => ReadonlyObject,
  Record: () => Record,
  RecordKey: () => RecordKey,
  RecordPattern: () => RecordPattern,
  RecordValue: () => RecordValue,
  Ref: () => Ref,
  Refine: () => Refine,
  Required: () => Required,
  Rest: () => Rest,
  ReturnType: () => ReturnType,
  Script: () => Script2,
  String: () => String2,
  Symbol: () => Symbol2,
  TemplateLiteral: () => TemplateLiteral2,
  This: () => This,
  Tuple: () => Tuple,
  Uncapitalize: () => Uncapitalize,
  Undefined: () => Undefined,
  Union: () => Union,
  Unknown: () => Unknown,
  Unsafe: () => Unsafe,
  Uppercase: () => Uppercase,
  Void: () => Void,
  With: () => With2
});

// ../boardstate.worktrees/net-transport/packages/server/dist/src-DYsVWaRz.js
function formatError(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
function createInProcessHost(store2, storage2, options = {}) {
  const rpcs = /* @__PURE__ */ new Map();
  const order = [];
  const listeners = /* @__PURE__ */ new Map();
  const toolFactories = [];
  const routes = [];
  const identify = options.identify;
  function broadcast(event, payload) {
    const subscribers = listeners.get(event);
    if (!subscribers) return;
    for (const fn of [...subscribers]) fn(payload);
  }
  function resolveOperatorId(ctx) {
    if (ctx && ctx.operatorId !== void 0) return ctx.operatorId;
    if (identify) return identify(ctx ?? {}) ?? null;
    return null;
  }
  return {
    store: store2,
    registerRpc(name, handler, opts) {
      if (rpcs.has(name)) throw new Error(`duplicate rpc method: ${name}`);
      rpcs.set(name, {
        handler,
        scope: opts.scope
      });
      order.push(name);
    },
    registerTool(factory) {
      toolFactories.push(factory);
    },
    registerHttpRoute(spec) {
      routes.push(spec);
    },
    broadcast,
    ...identify ? { identify } : {},
    listRpc() {
      return order.map((name) => ({
        name,
        scope: rpcs.get(name).scope
      }));
    },
    tools() {
      return toolFactories.flatMap((factory) => factory());
    },
    httpRoutes() {
      return [...routes];
    },
    request(method, params, ctx) {
      const entry = rpcs.get(method);
      if (!entry) {
        const error = /* @__PURE__ */ new Error(`unknown method: ${method}`);
        error.code = "method_not_found";
        return Promise.reject(error);
      }
      return new Promise((resolve, reject) => {
        let settled = false;
        const respond = (ok, result, error) => {
          if (settled) return;
          settled = true;
          if (ok) {
            resolve(result);
            return;
          }
          const err = new Error(error?.message ?? "boardstate error");
          if (error?.code !== void 0) err.code = error.code;
          reject(err);
        };
        Promise.resolve(entry.handler({
          params: params ?? {},
          respond,
          broadcast,
          operatorId: resolveOperatorId(ctx)
        })).catch((error) => {
          const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "boardstate_error";
          respond(false, void 0, {
            code,
            message: formatError(error)
          });
        });
      });
    },
    addEventListener(event, fn) {
      let subscribers = listeners.get(event);
      if (!subscribers) {
        subscribers = /* @__PURE__ */ new Set();
        listeners.set(event, subscribers);
      }
      subscribers.add(fn);
      return () => {
        subscribers?.delete(fn);
      };
    }
  };
}
var randomUUID$1 = () => globalThis.crypto.randomUUID();
function respondError$1(respond, error) {
  respond(false, void 0, {
    code: typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "boardstate_error",
    message: formatError(error)
  });
}
function isRecord$2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readRequiredString$2(record, key) {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value;
}
function readChatSendParams(params) {
  if (!isRecord$2(params)) throw new Error("params must be an object");
  const message = params.message;
  if (typeof message !== "string" || !message.trim()) throw new Error("message is required");
  return {
    sessionKey: readRequiredString$2(params, "sessionKey"),
    message
  };
}
async function runChatAgent(sessions, chatAgent, params, turnId, signal) {
  try {
    await chatAgent(params, {
      emit: sessions.emit,
      signal,
      turnId
    });
  } catch (error) {
    sessions.emit({
      type: "error",
      sessionKey: params.sessionKey,
      turnId,
      code: "agent_error",
      message: formatError(error),
      retryable: false
    });
    sessions.emit({
      type: "turn-end",
      sessionKey: params.sessionKey,
      turnId,
      stopReason: "end"
    });
  }
}
function registerChatRpc(host2, options) {
  const { sessions, chatAgent } = options;
  host2.registerRpc("chat.history.get", (ctx) => {
    try {
      if (!isRecord$2(ctx.params)) throw new Error("params must be an object");
      const sessionKey = readRequiredString$2(ctx.params, "sessionKey");
      const result = { events: sessions.history(sessionKey) };
      ctx.respond(true, result);
    } catch (error) {
      respondError$1(ctx.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("chat.abort", (ctx) => {
    try {
      if (!isRecord$2(ctx.params)) throw new Error("params must be an object");
      const abortParams = {
        sessionKey: readRequiredString$2(ctx.params, "sessionKey"),
        turnId: readRequiredString$2(ctx.params, "turnId")
      };
      sessions.abort(abortParams.sessionKey, abortParams.turnId);
      ctx.respond(true, { ok: true });
    } catch (error) {
      respondError$1(ctx.respond, error);
    }
  }, { scope: "write" });
  if (chatAgent) host2.registerRpc("chat.send", (ctx) => {
    try {
      const params = readChatSendParams(ctx.params);
      const turnId = randomUUID$1();
      const controller = sessions.abortController(params.sessionKey, turnId);
      const result = { turnId };
      ctx.respond(true, result);
      runChatAgent(sessions, chatAgent, params, turnId, controller.signal);
    } catch (error) {
      respondError$1(ctx.respond, error);
    }
  }, { scope: "write" });
}
var randomUUID = () => globalThis.crypto.randomUUID();
var TAB_SLUG_PATTERN$1 = /^[a-z0-9-]{1,40}$/;
var WIDGET_ID_PATTERN$1 = /^[A-Za-z0-9_-]{1,48}$/;
var CUSTOM_WIDGET_NAME_PATTERN$1 = /^[A-Za-z0-9._-]{1,64}$/;
function respondError(respond, error) {
  respond(false, void 0, {
    code: typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "boardstate_error",
    message: formatError(error)
  });
}
function isRecord$12(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readParams(params, allowedKeys) {
  if (!isRecord$12(params)) throw new Error("params must be an object");
  for (const key of Object.keys(params)) if (!allowedKeys.includes(key)) throw new Error(`unexpected param: ${key}`);
  return params;
}
function readRequiredString$1(record, key, description) {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${description} is required`);
  return value.trim();
}
function readOptionalString$1(record, key) {
  const value = record[key];
  if (value === void 0) return;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  return value.trim();
}
function readOptionalActor(record) {
  const actor = record.actor ?? "user";
  if (!isDashboardActor(actor)) throw new Error("actor is invalid");
  return actor;
}
function readVersion(record, key = "version") {
  const value = record[key];
  if (!Number.isInteger(value) || value < 0) throw new Error(`${key} must be a non-negative integer`);
  return value;
}
function readOptionalVisibility(record) {
  const value = record.visibility;
  if (value === void 0) return;
  if (value !== "shared" && value !== "private") throw new Error('visibility must be "shared" or "private"');
  return value;
}
function readSlug$1(record, key = "slug") {
  const slug = readRequiredString$1(record, key, key);
  if (!TAB_SLUG_PATTERN$1.test(slug)) throw new Error(`${key} is invalid`);
  return slug;
}
function readWidgetId$1(record, key = "id") {
  const id = readRequiredString$1(record, key, key);
  if (!WIDGET_ID_PATTERN$1.test(id)) throw new Error(`${key} is invalid`);
  return id;
}
function readBooleanPatch(record, key) {
  if (!Object.hasOwn(record, key)) return;
  const value = record[key];
  if (typeof value !== "boolean") throw new Error(`${key} must be a boolean`);
  return value;
}
function readGrid$1(value, path3 = "grid") {
  if (!isRecord$12(value)) throw new Error(`${path3} must be an object`);
  for (const key of Object.keys(value)) if (![
    "x",
    "y",
    "w",
    "h"
  ].includes(key)) throw new Error(`${path3}.${key} is not allowed`);
  return {
    x: readGridInt$1(value.x, `${path3}.x`, 0, 11),
    y: readGridInt$1(value.y, `${path3}.y`, 0, 499),
    w: readGridInt$1(value.w, `${path3}.w`, 1, 12),
    h: readGridInt$1(value.h, `${path3}.h`, 1, 20)
  };
}
function readGridInt$1(value, path3, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${path3} must be an integer from ${min} to ${max}`);
  return value;
}
function slugBase$1(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
}
function makeUniqueSlug$1(title, tabs) {
  const used = new Set(tabs.map((tab) => tab.slug));
  const base = slugBase$1(title) || "tab";
  if (!used.has(base)) return base;
  for (let index = 2; index < 1e3; index += 1) {
    const suffix = `-${index}`;
    const candidate = `${base.slice(0, 40 - suffix.length)}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("could not generate a unique tab slug");
}
function makeWidgetIdBase$1(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/g, "") || `w_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}
function makeUniqueWidgetId$1(widget, doc) {
  const existing = new Set(doc.tabs.flatMap((tab) => tab.widgets.map((entry) => entry.id)));
  const explicit = widget.id;
  if (explicit !== void 0) {
    if (typeof explicit !== "string" || !WIDGET_ID_PATTERN$1.test(explicit)) throw new Error("widget.id is invalid");
    if (existing.has(explicit)) throw new Error(`duplicate widget id: ${explicit}`);
    return explicit;
  }
  const base = makeWidgetIdBase$1(typeof widget.title === "string" ? widget.title : typeof widget.kind === "string" ? widget.kind : "widget");
  if (!existing.has(base)) return base;
  for (let index = 2; index < 1e3; index += 1) {
    const suffix = `-${index}`;
    const candidate = `${base.slice(0, 48 - suffix.length)}${suffix}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error("could not generate a unique widget id");
}
function findTab$1(doc, slug) {
  const tab = doc.tabs.find((entry) => entry.slug === slug);
  if (!tab) throw new Error(`dashboard tab not found: ${slug}`);
  return tab;
}
function findWidget$1(tab, id) {
  const widget = tab.widgets.find((entry) => entry.id === id);
  if (!widget) throw new Error(`dashboard widget not found: ${id}`);
  return widget;
}
function readEphemeralInput$1(value) {
  if (!isRecord$12(value)) throw new Error("widget.ephemeral must be an object");
  return { expiresAt: readRequiredString$1(value, "expiresAt", "widget.ephemeral.expiresAt") };
}
function readWidgetInput$1(value, doc) {
  if (!isRecord$12(value)) throw new Error("widget must be an object");
  for (const key of Object.keys(value)) if (![
    "id",
    "kind",
    "title",
    "grid",
    "collapsed",
    "hidden",
    "bindings",
    "props",
    "ephemeral"
  ].includes(key)) throw new Error(`widget.${key} is not allowed`);
  const title = readOptionalString$1(value, "title");
  return {
    id: makeUniqueWidgetId$1(value, doc),
    kind: readRequiredString$1(value, "kind", "widget.kind"),
    ...title !== void 0 ? { title } : {},
    grid: readGrid$1(value.grid, "widget.grid"),
    collapsed: value.collapsed === void 0 ? false : readRequiredBoolean(value, "collapsed"),
    hidden: value.hidden === void 0 ? false : readRequiredBoolean(value, "hidden"),
    ...value.bindings !== void 0 ? { bindings: value.bindings } : {},
    ...value.props !== void 0 ? { props: value.props } : {},
    ...value.ephemeral !== void 0 ? { ephemeral: readEphemeralInput$1(value.ephemeral) } : {}
  };
}
function readRequiredBoolean(record, key) {
  const value = record[key];
  if (typeof value !== "boolean") throw new Error(`${key} must be a boolean`);
  return value;
}
function readTabLayoutPatch(record) {
  if (!Object.hasOwn(record, "layout")) return;
  const value = record.layout;
  if (value !== "grid" && value !== "full") throw new Error('layout must be "grid" or "full"');
  return value;
}
function readTabPatch(value) {
  const patch = readParams(value, [
    "title",
    "icon",
    "hidden",
    "layout",
    "visibility"
  ]);
  const title = readOptionalString$1(patch, "title");
  if (title !== void 0 && (title.length < 1 || title.length > 80)) throw new Error("patch.title must be 1-80 characters");
  const icon = readOptionalString$1(patch, "icon");
  if (icon !== void 0 && icon.length > 40) throw new Error("patch.icon must be 40 characters or fewer");
  const hidden = readBooleanPatch(patch, "hidden");
  const layout = readTabLayoutPatch(patch);
  const visibility = readOptionalVisibility(patch);
  return {
    ...title !== void 0 ? { title } : {},
    ...icon !== void 0 ? { icon } : {},
    ...hidden !== void 0 ? { hidden } : {},
    ...layout !== void 0 ? { layout } : {},
    ...visibility !== void 0 ? { visibility } : {}
  };
}
function readWidgetPatch$1(value) {
  const patch = readParams(value, [
    "title",
    "grid",
    "collapsed",
    "hidden",
    "bindings",
    "props",
    "ephemeral"
  ]);
  const title = readOptionalString$1(patch, "title");
  if (title !== void 0 && title.length > 80) throw new Error("patch.title must be 80 characters or fewer");
  return {
    ...title !== void 0 ? { title } : {},
    ...patch.grid !== void 0 ? { grid: readGrid$1(patch.grid, "patch.grid") } : {},
    ...readBooleanPatch(patch, "collapsed") !== void 0 ? { collapsed: readBooleanPatch(patch, "collapsed") } : {},
    ...readBooleanPatch(patch, "hidden") !== void 0 ? { hidden: readBooleanPatch(patch, "hidden") } : {},
    ...patch.bindings !== void 0 ? { bindings: patch.bindings } : {},
    ...patch.props !== void 0 ? { props: patch.props } : {},
    ...Object.hasOwn(patch, "ephemeral") ? { ephemeral: patch.ephemeral === null ? void 0 : readEphemeralInput$1(patch.ephemeral) } : {}
  };
}
function readLayout$1(value) {
  if (!Array.isArray(value)) throw new Error("layout must be an array");
  return value.map((entry, index) => {
    const record = readParams(entry, ["id", "grid"]);
    return {
      id: readWidgetId$1(record),
      grid: readGrid$1(record.grid, `layout[${index}].grid`)
    };
  });
}
function appendMissingTabsToOrder$1(doc) {
  const seen = new Set(doc.prefs.tabOrder);
  for (const tab of doc.tabs) if (!seen.has(tab.slug)) doc.prefs.tabOrder.push(tab.slug);
}
function broadcastChange$1(broadcast, params) {
  broadcast("boardstate.changed", {
    workspaceVersion: params.doc.workspaceVersion,
    ...params.changedTabSlug ? { changedTabSlug: params.changedTabSlug } : {},
    actor: params.actor
  });
}
function respondDoc(opts, doc) {
  opts.respond(true, {
    doc: filterWorkspaceForOperator(doc, opts.operatorId),
    workspaceVersion: doc.workspaceVersion
  });
}
async function respondWrite(opts, actor, changedTabSlug, run) {
  const result = await run();
  broadcastChange$1(opts.broadcast, {
    doc: result.doc,
    actor,
    changedTabSlug
  });
  respondDoc(opts, result.doc);
}
function readSlugOrder(value) {
  if (!Array.isArray(value)) throw new Error("order must be an array");
  const seen = /* @__PURE__ */ new Set();
  return value.map((entry, index) => {
    if (typeof entry !== "string" || !TAB_SLUG_PATTERN$1.test(entry)) throw new Error(`order[${index}] is invalid`);
    if (seen.has(entry)) throw new Error(`order contains duplicate slug: ${entry}`);
    seen.add(entry);
    return entry;
  });
}
function registerBoardstateRpc(host2, options) {
  const store2 = options.store;
  host2.registerRpc("dashboard.workspace.get", async (opts) => {
    try {
      respondDoc(opts, await store2.read());
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("dashboard.tab.create", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "slug",
        "title",
        "icon",
        "actor",
        "visibility"
      ]);
      const title = readRequiredString$1(params, "title", "title");
      const actor = readOptionalActor(params);
      const icon = readOptionalString$1(params, "icon");
      const visibility = readOptionalVisibility(params);
      const operatorId = opts.operatorId;
      const result = await store2.mutate((draft) => {
        const slug = params.slug === void 0 ? makeUniqueSlug$1(title, draft.tabs) : readSlug$1(params);
        if (draft.tabs.some((tab) => tab.slug === slug)) throw new Error(`dashboard tab already exists: ${slug}`);
        draft.tabs.push({
          slug,
          title,
          ...icon !== void 0 ? { icon } : {},
          hidden: false,
          createdBy: actor,
          ...visibility === "private" ? { visibility } : {},
          ...visibility === "private" && operatorId ? { owner: operatorId } : {},
          widgets: []
        });
        draft.prefs.tabOrder.push(slug);
      }, { actor });
      const changedTabSlug = result.doc.tabs.at(-1)?.slug;
      broadcastChange$1(opts.broadcast, {
        doc: result.doc,
        actor,
        changedTabSlug
      });
      respondDoc(opts, result.doc);
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.tab.update", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "slug",
        "patch",
        "actor"
      ]);
      const slug = readSlug$1(params);
      const actor = readOptionalActor(params);
      const patch = readTabPatch(params.patch);
      const operatorId = opts.operatorId;
      await respondWrite(opts, actor, slug, async () => await store2.mutate((draft) => {
        const tab = findTab$1(draft, slug);
        Object.assign(tab, patch);
        if (patch.visibility === "private") if (operatorId) tab.owner = operatorId;
        else delete tab.owner;
        else if (patch.visibility === "shared") {
          delete tab.visibility;
          delete tab.owner;
        }
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.tab.delete", async (opts) => {
    try {
      const params = readParams(opts.params, ["slug", "actor"]);
      const slug = readSlug$1(params);
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, slug, async () => await store2.mutate((draft) => {
        const nextTabs = draft.tabs.filter((tab) => tab.slug !== slug);
        if (nextTabs.length === draft.tabs.length) throw new Error(`dashboard tab not found: ${slug}`);
        draft.tabs = nextTabs;
        draft.prefs.tabOrder = draft.prefs.tabOrder.filter((entry) => entry !== slug);
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.tab.reorder", async (opts) => {
    try {
      const params = readParams(opts.params, ["order", "actor"]);
      const order = readSlugOrder(params.order);
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, void 0, async () => await store2.mutate((draft) => {
        const slugs = new Set(draft.tabs.map((tab) => tab.slug));
        for (const slug of order) if (!slugs.has(slug)) throw new Error(`dashboard tab not found: ${slug}`);
        draft.prefs.tabOrder = order;
        appendMissingTabsToOrder$1(draft);
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.add", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "tab",
        "widget",
        "actor"
      ]);
      const slug = readRequiredString$1(params, "tab", "tab");
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, slug, async () => await store2.mutate((draft) => {
        findTab$1(draft, slug).widgets.push(readWidgetInput$1(params.widget, draft));
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.update", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "tab",
        "id",
        "patch",
        "actor"
      ]);
      const slug = readRequiredString$1(params, "tab", "tab");
      const id = readWidgetId$1(params);
      const actor = readOptionalActor(params);
      const patch = readWidgetPatch$1(params.patch);
      await respondWrite(opts, actor, slug, async () => await store2.mutate((draft) => {
        Object.assign(findWidget$1(findTab$1(draft, slug), id), patch);
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.move", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "tab",
        "id",
        "grid",
        "toTab",
        "actor"
      ]);
      if (params.grid !== void 0 && params.toTab !== void 0) throw new Error("dashboard.widget.move accepts either grid or toTab, not both");
      const id = readWidgetId$1(params);
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, typeof params.toTab === "string" ? params.toTab : typeof params.tab === "string" ? params.tab : void 0, async () => await store2.mutate((draft) => {
        if (params.grid !== void 0) {
          const slug = readRequiredString$1(params, "tab", "tab");
          findWidget$1(findTab$1(draft, slug), id).grid = readGrid$1(params.grid);
          return;
        }
        const destination = findTab$1(draft, readRequiredString$1(params, "toTab", "toTab"));
        for (const tab of draft.tabs) {
          const index = tab.widgets.findIndex((widget) => widget.id === id);
          if (index >= 0) {
            destination.widgets.push(tab.widgets.splice(index, 1)[0]);
            return;
          }
        }
        throw new Error(`dashboard widget not found: ${id}`);
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.remove", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "tab",
        "id",
        "actor"
      ]);
      const slug = readRequiredString$1(params, "tab", "tab");
      const id = readWidgetId$1(params);
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, slug, async () => await store2.mutate((draft) => {
        const tab = findTab$1(draft, slug);
        const next = tab.widgets.filter((widget) => widget.id !== id);
        if (next.length === tab.widgets.length) throw new Error(`dashboard widget not found: ${id}`);
        tab.widgets = next;
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.setLayout", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "tab",
        "layout",
        "actor"
      ]);
      const slug = readRequiredString$1(params, "tab", "tab");
      const layout = readLayout$1(params.layout);
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, slug, async () => await store2.mutate((draft) => {
        const tab = findTab$1(draft, slug);
        for (const entry of layout) findWidget$1(tab, entry.id).grid = entry.grid;
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.approve", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "name",
        "decision",
        "actor"
      ]);
      const name = readRequiredString$1(params, "name", "name");
      if (!CUSTOM_WIDGET_NAME_PATTERN$1.test(name)) throw new Error("name is invalid");
      const decision = readRequiredString$1(params, "decision", "decision");
      if (decision !== "approved" && decision !== "rejected") throw new Error("decision must be approved or rejected");
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, void 0, async () => await store2.mutate((draft) => {
        const existing = draft.widgetsRegistry[name];
        draft.widgetsRegistry[name] = {
          status: decision,
          createdBy: existing?.createdBy ?? actor,
          ...decision === "approved" ? {
            approvedBy: actor,
            approvedAt: (/* @__PURE__ */ new Date()).toISOString()
          } : {}
        };
      }, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.widget.install", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "name",
        "manifest",
        "files",
        "actor"
      ]);
      const name = readRequiredString$1(params, "name", "name");
      if (!CUSTOM_WIDGET_NAME_PATTERN$1.test(name)) throw new Error("name is invalid");
      const actor = readOptionalActor(params);
      await respondWrite(opts, actor, void 0, async () => {
        if (!options.installWidgetBundle) throw new Error("widget install requires the node host (@boardstate/server/node)");
        return await options.installWidgetBundle(store2, {
          name,
          manifest: params.manifest,
          files: params.files
        }, {
          actor,
          stateDir: store2.stateDir
        });
      });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.workspace.replace", async (opts) => {
    try {
      const params = readParams(opts.params, ["doc", "actor"]);
      const actor = readOptionalActor(params);
      const doc = validateWorkspaceDoc(params.doc);
      await respondWrite(opts, actor, void 0, async () => await store2.replaceSanitized(doc, { actor }));
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.workspace.undo", async (opts) => {
    try {
      const actor = readOptionalActor(readParams(opts.params, ["actor"]));
      const doc = await store2.undo();
      broadcastChange$1(opts.broadcast, {
        doc,
        actor
      });
      respondDoc(opts, doc);
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  host2.registerRpc("dashboard.workspace.history.list", async (opts) => {
    try {
      opts.respond(true, { entries: await store2.listHistory() });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("dashboard.workspace.history.get", async (opts) => {
    try {
      const params = readParams(opts.params, ["version"]);
      const doc = await store2.getHistorySnapshot(readVersion(params));
      opts.respond(true, { doc: filterWorkspaceForOperator(doc, opts.operatorId) });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("dashboard.data.read", async (opts) => {
    try {
      const params = readParams(opts.params, ["binding"]);
      const resolveData = options.resolveBinding ?? resolveBinding;
      opts.respond(true, { data: await resolveData(params.binding, options.dataRead) });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("dashboard.presence.ping", (opts) => {
    try {
      const tabSlug = readSlug$1(readParams(opts.params, ["tabSlug"]), "tabSlug");
      opts.broadcast("boardstate.presence", {
        operator: opts.operatorId ?? "operator",
        tabSlug,
        at: Date.now()
      });
      opts.respond(true, { ok: true });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("dashboard.widget.state.get", async (opts) => {
    try {
      const widgetId = readWidgetId$1(readParams(opts.params, ["widgetId"]), "widgetId");
      const record = await store2.readWidgetState(widgetId);
      opts.respond(true, record === null ? { state: null } : {
        state: record.blob,
        version: record.version,
        updatedAt: record.updatedAt
      });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "read" });
  host2.registerRpc("dashboard.widget.state.set", async (opts) => {
    try {
      const params = readParams(opts.params, [
        "widgetId",
        "state",
        "expectedVersion"
      ]);
      const widgetId = readWidgetId$1(params, "widgetId");
      if (!Object.hasOwn(params, "state")) throw new Error("state is required");
      let expectedVersion;
      if (params.expectedVersion !== void 0) {
        const raw = params.expectedVersion;
        if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0) throw new Error("expectedVersion must be a non-negative integer");
        expectedVersion = raw;
      }
      const { version } = await store2.writeWidgetState(widgetId, params.state, { expectedVersion });
      opts.broadcast("boardstate.widget-state.changed", {
        widgetId,
        version
      });
      opts.respond(true, {
        widgetId,
        version
      });
    } catch (error) {
      respondError(opts.respond, error);
    }
  }, { scope: "write" });
  if (options.chat) registerChatRpc(host2, {
    sessions: options.chat,
    chatAgent: options.chatAgent
  });
}
var JsonSchema = typebox_exports.Unknown({ description: "JSON-compatible value." });
var GridSchema = typebox_exports.Object({
  x: typebox_exports.Integer({
    minimum: 0,
    maximum: 11,
    description: "Grid x column, 0-11."
  }),
  y: typebox_exports.Integer({
    minimum: 0,
    maximum: 499,
    description: "Grid row, 0-499."
  }),
  w: typebox_exports.Integer({
    minimum: 1,
    maximum: 12,
    description: "Grid width, 1-12."
  }),
  h: typebox_exports.Integer({
    minimum: 1,
    maximum: 20,
    description: "Grid height, 1-20."
  })
}, { additionalProperties: false });
var BindingSchema = typebox_exports.Union([
  typebox_exports.Object({
    source: typebox_exports.Literal("rpc"),
    method: typebox_exports.String({ description: "Allowlisted read method." })
  }, { additionalProperties: false }),
  typebox_exports.Object({
    source: typebox_exports.Literal("file"),
    path: typebox_exports.String({ description: "Relative path under dashboard/data." }),
    pointer: typebox_exports.Optional(typebox_exports.String({ description: "Optional JSON pointer." }))
  }, { additionalProperties: false }),
  typebox_exports.Object({
    source: typebox_exports.Literal("static"),
    value: JsonSchema
  }, { additionalProperties: false })
]);
var BindingsRecordSchema = typebox_exports.Record(typebox_exports.String(), BindingSchema, { description: "Widget binding map keyed by binding id." });
var EphemeralSchema = typebox_exports.Object({ expiresAt: typebox_exports.String({ description: "ISO 8601 expiry timestamp (auto-swept when past)." }) }, { additionalProperties: false });
var WidgetPatchSchema = typebox_exports.Object({
  title: typebox_exports.Optional(typebox_exports.String({ description: "Widget title, 80 chars max." })),
  grid: typebox_exports.Optional(GridSchema),
  collapsed: typebox_exports.Optional(typebox_exports.Boolean({ description: "Collapse widget body." })),
  hidden: typebox_exports.Optional(typebox_exports.Boolean({ description: "Hide widget." })),
  bindings: typebox_exports.Optional(BindingsRecordSchema),
  props: typebox_exports.Optional(JsonSchema),
  ephemeral: typebox_exports.Optional(typebox_exports.Union([EphemeralSchema, typebox_exports.Null()], { description: "Set an auto-expiry, or null to pin (clear the flag)." }))
}, { additionalProperties: false });
var WidgetInputSchema = typebox_exports.Object({
  id: typebox_exports.Optional(typebox_exports.String({ description: "Optional unique widget id." })),
  kind: typebox_exports.String({ description: "builtin:<name> or custom:<name>." }),
  title: typebox_exports.Optional(typebox_exports.String({ description: "Widget title." })),
  grid: GridSchema,
  collapsed: typebox_exports.Optional(typebox_exports.Boolean({ description: "Initial collapsed state." })),
  hidden: typebox_exports.Optional(typebox_exports.Boolean({ description: "Initial hidden state." })),
  bindings: typebox_exports.Optional(BindingsRecordSchema),
  props: typebox_exports.Optional(JsonSchema),
  ephemeral: typebox_exports.Optional(EphemeralSchema)
}, { additionalProperties: false });

// ../boardstate.worktrees/net-transport/packages/server/dist/node-z_TijRD6.js
import { createHash, randomBytes as randomBytes2 } from "node:crypto";
import fs2 from "node:fs/promises";
import path2 from "node:path";
var WIDGETS_ROUTE_PREFIX = "/widgets";
var WIDGET_CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; frame-ancestors 'self'";
var CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8"
};
function normalizeWidgetLogicalPath(value) {
  return normalizeLogicalPath(value);
}
function normalizeLogicalPath(value) {
  const parts = value.replaceAll("\\", "/").replace(/^\/+/, "").split("/").filter(Boolean);
  if (parts.length === 0 || parts.some((part) => part === "." || part === ".." || part.includes(":") || hasControlCharacter2(part))) throw new Error("widget logical path invalid");
  return parts.join("/");
}
function hasControlCharacter2(value) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) return true;
  }
  return false;
}
function isWidgetRoutePath(pathname) {
  return pathname === "/widgets" || pathname.startsWith(`/widgets/`);
}
function parseWidgetRequestPath(pathname) {
  const prefix = `${WIDGETS_ROUTE_PREFIX}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rawSegments = pathname.slice(prefix.length).split("/");
  const segments = [];
  for (const segment of rawSegments) {
    if (!segment) continue;
    try {
      segments.push(decodeURIComponent(segment));
    } catch {
      return null;
    }
  }
  if (segments.length < 2) return null;
  const [name, ...entry] = segments;
  if (name === "." || name === ".." || !CUSTOM_WIDGET_NAME_PATTERN2.test(name)) return null;
  let logicalPath;
  try {
    logicalPath = normalizeLogicalPath(entry.join("/"));
  } catch {
    return null;
  }
  return {
    name,
    logicalPath
  };
}
function extensionContentType(logicalPath) {
  const extension = path2.extname(logicalPath).toLowerCase();
  return CONTENT_TYPES[extension] ?? null;
}
function isServableWidgetFile(logicalPath) {
  return extensionContentType(logicalPath) !== null;
}
function setSecurityHeaders(res) {
  res.setHeader("Content-Security-Policy", WIDGET_CSP);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
}
function notFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  setSecurityHeaders(res);
  res.end("not found");
  return true;
}
async function serveWidgetAsset(req, res, deps) {
  if (!isWidgetRoutePath(req.pathname)) return false;
  const parsed = parseWidgetRequestPath(req.pathname);
  if (!parsed) return notFound(res);
  if (req.method !== "GET" && req.method !== "HEAD") return notFound(res);
  const contentType = extensionContentType(parsed.logicalPath);
  if (!contentType) return notFound(res);
  try {
    if ((await deps.store.read()).widgetsRegistry[parsed.name]?.status !== "approved") return notFound(res);
  } catch {
    return notFound(res);
  }
  const stateDir = deps.stateDir ?? deps.store.stateDir;
  let widgetDir;
  try {
    widgetDir = resolveWidgetDir(parsed.name, stateDir);
  } catch {
    return notFound(res);
  }
  const candidate = path2.resolve(widgetDir, parsed.logicalPath);
  if (candidate !== widgetDir && !candidate.startsWith(`${widgetDir}${path2.sep}`)) return notFound(res);
  let data;
  try {
    const realDir = await fs2.realpath(widgetDir);
    const real = await fs2.realpath(candidate);
    if (real !== realDir && !real.startsWith(`${realDir}${path2.sep}`)) return notFound(res);
    if (!(await fs2.stat(real)).isFile()) return notFound(res);
    data = await fs2.readFile(real);
  } catch {
    return notFound(res);
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  setSecurityHeaders(res);
  if (req.method === "HEAD") res.end();
  else res.end(data);
  return true;
}
var WIDGET_BUNDLE_MAX_BYTES = 512 * 1024;
function isRecord$13(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isErrnoException$1(error) {
  return error instanceof Error && "code" in error;
}
async function writeFileAtomic(filePath, content, mode) {
  const dir = path2.dirname(filePath);
  const tempPath = path2.join(dir, `.${path2.basename(filePath)}.${randomBytes2(6).toString("hex")}.tmp`);
  try {
    await fs2.writeFile(tempPath, content, { mode });
    await fs2.rename(tempPath, filePath);
  } catch (error) {
    await fs2.rm(tempPath, { force: true });
    throw error;
  }
}
function validateBundleFiles(files) {
  if (!isRecord$13(files)) throw new Error("bundle files must be an object");
  const entries = Object.entries(files);
  if (entries.length === 0) throw new Error("bundle contains no files");
  if (entries.length > 64) throw new Error(`bundle must contain at most 64 files`);
  const seen = /* @__PURE__ */ new Set();
  let totalBytes = 0;
  const normalized = [];
  for (const [rawPath, content] of entries) {
    if (typeof content !== "string") throw new Error(`bundle file content must be a string: ${rawPath}`);
    let logicalPath;
    try {
      logicalPath = normalizeWidgetLogicalPath(rawPath);
    } catch {
      throw new Error(`bundle file path is invalid: ${rawPath}`);
    }
    if (!isServableWidgetFile(logicalPath)) throw new Error(`bundle file type is not allowed: ${logicalPath}`);
    if (seen.has(logicalPath)) throw new Error(`bundle contains a duplicate file path: ${logicalPath}`);
    seen.add(logicalPath);
    totalBytes += Buffer.byteLength(content, "utf8");
    if (totalBytes > 524288) throw new Error("widget bundle exceeds 512 KB");
    normalized.push({
      logicalPath,
      content
    });
  }
  return normalized;
}
async function installWidgetBundle(store2, input, options) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!CUSTOM_WIDGET_NAME_PATTERN2.test(name)) throw new Error("widget name is invalid");
  const files = validateBundleFiles(input.files);
  const manifest = validateWidgetManifest(input.manifest, name);
  if (!files.some((file) => file.logicalPath === manifest.entrypoint)) throw new Error("bundle is missing its entrypoint file");
  const widgetDir = resolveWidgetDir(name, options.stateDir ?? new FsStorageAdapter().storageDir());
  await fs2.mkdir(path2.dirname(widgetDir), {
    recursive: true,
    mode: 448
  });
  try {
    await fs2.mkdir(widgetDir, { mode: 448 });
  } catch (error) {
    if (isErrnoException$1(error) && error.code === "EEXIST") throw new Error("widget already exists", { cause: error });
    throw error;
  }
  try {
    const toWrite = [{
      logicalPath: "widget.json",
      content: `${JSON.stringify(manifest, null, 2)}
`
    }, ...files.filter((file) => file.logicalPath !== "widget.json")];
    for (const file of toWrite) {
      const target = path2.resolve(widgetDir, file.logicalPath);
      if (target !== widgetDir && !target.startsWith(`${widgetDir}${path2.sep}`)) throw new Error(`bundle file escapes the widget dir: ${file.logicalPath}`);
      await fs2.mkdir(path2.dirname(target), {
        recursive: true,
        mode: 448
      });
      await writeFileAtomic(target, file.content, 384);
    }
    return { doc: (await store2.mutate((draft) => {
      if (draft.widgetsRegistry[name]) throw new Error("widget already exists");
      draft.widgetsRegistry[name] = {
        status: "pending",
        createdBy: options.actor
      };
    }, { actor: options.actor })).doc };
  } catch (error) {
    await fs2.rm(widgetDir, {
      recursive: true,
      force: true
    }).catch(() => {
    });
    throw error;
  }
}
function createWidgetHttpRouteHandler(params) {
  return { async handleHttpRequest(req, res) {
    const url = new URL(req.url ?? "/", "http://localhost");
    return await serveWidgetAsset({
      method: req.method,
      pathname: url.pathname
    }, res, {
      store: params.store,
      ...params.stateDir ? { stateDir: params.stateDir } : {}
    });
  } };
}
var WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
var DEFAULT_FORWARDED_EVENTS = [
  "boardstate.changed",
  "boardstate.widget-state.changed",
  "boardstate.presence",
  CHAT_EVENT
];
var MAX_MESSAGE_BYTES = 1024 * 1024;
var OP_CONTINUATION = 0;
var OP_TEXT = 1;
var OP_BINARY = 2;
var OP_CLOSE = 8;
var OP_PING = 9;
var OP_PONG = 10;
function attachWsTransport(httpServer2, host2, options = {}) {
  const path3 = options.path ?? "/ws";
  const forwardEvents = options.forwardEvents ?? DEFAULT_FORWARDED_EVENTS;
  const connections = /* @__PURE__ */ new Set();
  const onUpgrade = (req, socket) => {
    if (new URL(req.url ?? "/", "http://localhost").pathname !== path3) {
      socket.destroy();
      return;
    }
    const key = req.headers["sec-websocket-key"];
    if (String(req.headers["upgrade"] ?? "").toLowerCase() !== "websocket" || typeof key !== "string") {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }
    if (options.verifyClient && !options.verifyClient(req)) {
      socket.end("HTTP/1.1 426 Upgrade Required\r\n\r\n");
      return;
    }
    const accept = createHash("sha1").update(key + WS_GUID).digest("base64");
    socket.write(`HTTP/1.1 101 Switching Protocols\r
Upgrade: websocket\r
Connection: Upgrade\r
Sec-WebSocket-Accept: ${accept}\r
\r
`);
    const connection = new Connection(socket, host2, forwardEvents, () => connections.delete(connection));
    connections.add(connection);
  };
  httpServer2.on("upgrade", onUpgrade);
  return {
    get connections() {
      return connections.size;
    },
    close() {
      httpServer2.off("upgrade", onUpgrade);
      for (const connection of [...connections]) connection.close();
    }
  };
}
var Connection = class {
  socket;
  host;
  onClose;
  buffer = Buffer.alloc(0);
  /** Reassembly state for a fragmented application message. */
  fragments = [];
  fragmentOpcode = 0;
  fragmentBytes = 0;
  closedFlag = false;
  unsubscribes;
  constructor(socket, host2, forwardEvents, onClose) {
    this.socket = socket;
    this.host = host2;
    this.onClose = onClose;
    this.unsubscribes = forwardEvents.map((event) => host2.addEventListener(event, (payload) => {
      this.sendJson({
        event,
        payload
      });
    }));
    socket.on("data", (chunk) => this.onData(chunk));
    socket.on("close", () => this.dispose());
    socket.on("error", () => this.dispose());
  }
  /** Serialize a wire value and write it as a single unmasked text frame. */
  sendJson(value) {
    if (this.closedFlag) return;
    let text;
    try {
      text = JSON.stringify(value);
    } catch {
      return;
    }
    this.socket.write(encodeFrame(OP_TEXT, Buffer.from(text, "utf8")));
  }
  onData(chunk) {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
    for (; ; ) {
      const frame = decodeFrame(this.buffer);
      if (!frame) return;
      this.buffer = this.buffer.subarray(frame.consumed);
      this.handleFrame(frame.fin, frame.opcode, frame.payload);
    }
  }
  handleFrame(fin, opcode, payload) {
    switch (opcode) {
      case OP_PING:
        this.socket.write(encodeFrame(OP_PONG, payload));
        return;
      case OP_PONG:
        return;
      case OP_CLOSE:
        if (!this.closedFlag) this.socket.write(encodeFrame(OP_CLOSE, Buffer.alloc(0)));
        this.dispose();
        return;
      case OP_BINARY:
        this.fail();
        return;
      case OP_TEXT:
      case OP_CONTINUATION: {
        if (opcode === OP_TEXT) this.fragmentOpcode = OP_TEXT;
        this.fragments.push(payload);
        this.fragmentBytes += payload.length;
        if (this.fragmentBytes > MAX_MESSAGE_BYTES) {
          this.fail();
          return;
        }
        if (!fin) return;
        const message = Buffer.concat(this.fragments).toString("utf8");
        this.fragments = [];
        this.fragmentBytes = 0;
        this.fragmentOpcode = 0;
        this.dispatch(message);
        return;
      }
      default:
        this.fail();
    }
  }
  /** Parse a request frame and dispatch it to the host, echoing the result under `id`. */
  async dispatch(raw) {
    let frame;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }
    const id = frame.id;
    if (typeof id !== "number" && typeof id !== "string") return;
    if (typeof frame.method !== "string") {
      this.sendJson({
        id,
        error: {
          code: "bad_request",
          message: "method is required"
        }
      });
      return;
    }
    try {
      const result = await this.host.request(frame.method, frame.params);
      this.sendJson({
        id,
        result
      });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "boardstate_error";
      this.sendJson({
        id,
        error: {
          code,
          message: formatError(error)
        }
      });
    }
  }
  /** Close on a protocol violation (send a bare close frame, then dispose). */
  fail() {
    if (!this.closedFlag) this.socket.write(encodeFrame(OP_CLOSE, Buffer.alloc(0)));
    this.dispose();
  }
  /** Public close: send a close frame then tear the connection down. */
  close() {
    this.fail();
  }
  /** Idempotent teardown: unsubscribe from host events and destroy the socket. */
  dispose() {
    if (this.closedFlag) return;
    this.closedFlag = true;
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.onClose();
    this.socket.destroy();
  }
};
function encodeFrame(opcode, payload) {
  const length = payload.length;
  let header;
  if (length < 126) header = Buffer.from([128 | opcode, length]);
  else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 128 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 128 | opcode;
    header[1] = 127;
    header.writeUInt32BE(Math.floor(length / 4294967296), 2);
    header.writeUInt32BE(length >>> 0, 6);
  }
  return Buffer.concat([header, payload]);
}
function decodeFrame(buffer) {
  if (buffer.length < 2) return null;
  const byte0 = buffer[0];
  const byte1 = buffer[1];
  const fin = (byte0 & 128) !== 0;
  const opcode = byte0 & 15;
  const masked = (byte1 & 128) !== 0;
  let length = byte1 & 127;
  let offset = 2;
  if (length === 126) {
    if (buffer.length < offset + 2) return null;
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.length < offset + 8) return null;
    const high = buffer.readUInt32BE(offset);
    const low = buffer.readUInt32BE(offset + 4);
    length = high * 4294967296 + low;
    offset += 8;
  }
  const maskKey = masked ? buffer.subarray(offset, offset + 4) : null;
  if (masked) offset += 4;
  if (buffer.length < offset + length) return null;
  const payload = Buffer.from(buffer.subarray(offset, offset + length));
  if (maskKey) for (let i = 0; i < payload.length; i += 1) payload[i] ^= maskKey[i & 3];
  return {
    fin,
    opcode,
    payload,
    consumed: offset + length
  };
}
function nodeRpcDeps() {
  return {
    resolveBinding: resolveBinding2,
    installWidgetBundle
  };
}

// dashboard/sidecar/src/server.ts
var stateDirEnv = process.env.BOARDSTATE_STATE_DIR;
var storage = new FsStorageAdapter(stateDirEnv ? { storageDir: stateDirEnv } : {});
var store = new DashboardStore({ storage });
var WELCOME_WORKSPACE = {
  schemaVersion: 1,
  workspaceVersion: 1,
  widgetsRegistry: {},
  prefs: { tabOrder: ["board"] },
  tabs: [
    {
      slug: "board",
      title: "Board",
      icon: "layoutDashboard",
      hidden: false,
      createdBy: "system",
      widgets: [
        {
          id: "welcome",
          kind: "builtin:markdown",
          title: "Hermes Board",
          grid: { x: 0, y: 0, w: 6, h: 3 },
          collapsed: false,
          hidden: false,
          props: {
            markdown: "# Hermes Board\n\nAsk Hermes to build here \u2014 every `boardstate_*` tool call lands on this board live."
          }
        },
        {
          id: "example",
          kind: "builtin:markdown",
          title: "Example widget",
          grid: { x: 6, y: 0, w: 6, h: 3 },
          collapsed: false,
          hidden: false,
          props: {
            markdown: "**Example widget** \u2014 a props-only card, no data source needed.\n\nAsk Hermes for a live one: a stat card, an activity feed, or a custom widget."
          }
        }
      ]
    }
  ]
};
async function seedInitialWorkspaceIfEmpty() {
  if (await storage.readFile(store.workspacePath) !== null) {
    return;
  }
  const doc = validateWorkspaceDoc(structuredClone(WELCOME_WORKSPACE));
  await storage.mkdir(store.dashboardDir);
  await storage.writeFileAtomic(store.workspacePath, JSON.stringify(doc, null, 2));
}
await seedInitialWorkspaceIfEmpty();
var host = createInProcessHost(store, storage);
registerBoardstateRpc(host, {
  store,
  dataRead: { stateDir: store.stateDir },
  ...nodeRpcDeps()
});
var widgetRoute = createWidgetHttpRouteHandler({ store });
var httpServer = createServer((req, res) => {
  void widgetRoute.handleHttpRequest(req, res).then((handled) => {
    if (handled) {
      return;
    }
    if (req.method === "GET" && (req.url ?? "/").split("?")[0] === "/healthz") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, stateDir: store.stateDir }));
      return;
    }
    res.statusCode = 404;
    res.end("not found");
  }).catch(() => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("error");
    } else {
      res.end();
    }
  });
});
attachWsTransport(httpServer, host, { path: "/ws" });
var port = Number(process.env.PORT ?? 0);
var hostname = "127.0.0.1";
httpServer.listen(port, hostname, () => {
  const address = httpServer.address();
  const bound = typeof address === "object" && address ? address.port : port;
  process.stdout.write(
    `${JSON.stringify({ boardstateSidecar: { port: bound, stateDir: store.stateDir } })}
`
  );
});
var shutdown = () => {
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1e3).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
//# sourceMappingURL=server.js.map

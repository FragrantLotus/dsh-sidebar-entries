# dsh-sidebar-entries

[![npm version](https://img.shields.io/npm/v/dsh-sidebar-entries)](https://www.npmjs.com/package/dsh-sidebar-entries)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that makes the
left sidebar behave the way a long list should: **drag to reorder** the panel icons, **one
arrow to fold them all away** so the workspace / session list gets its height back, a
**pinned-session section** at the top of the workspace list that keeps its live status,
**whole-row height caps** on both lists so a crowded rail can never eat the session tree,
**archived Sessions sunk to the bottom** instead of interleaving with live work, **draggable
conversation view tabs**, and a **generic lift** that pulls every plugin's sidebar-footer entry
up into the same rail so nothing is split between the top and the bottom of the column.

The sidebar panel list is a stack of icon rows (`插件`, `插件市场`, `自动化任务`, …). Once a
handful of plugins are installed the stack eats the column and pushes the session list into a
narrow strip. This plugin adds three things to that stack:

- **Long-press drag to reorder.** Press an icon for ~0.3 s, then drag. The row lifts and follows
  the cursor; the neighbours slide out of the way with a short FLIP animation; the order is
  written to `localStorage` on release. A short click still selects the panel — only a deliberate
  long press starts a drag, so nothing navigates by accident.
- **A fold arrow at the top of the list.** A plain chevron (`v` when everything is shown, `^`
  when folded) that hides every panel icon in one click. The state survives a reload. The arrow
  itself never moves and can never be dragged, so there is always a way back.
- **Footer entries lifted into the rail.** Any plugin that registers an action in the sidebar
  footer gets a row up here automatically — see below.

And one thing to the list below it:

- **A 置顶 section.** Pinned Sessions are gathered into one group at the very top of the
  workspace list and their originals are hidden, so a pinned Session appears exactly once no
  matter which workspace it belongs to. Unpinning from the copy works; the copy is rebuilt
  whenever the store changes.

Three things to the tab bar above the conversation:

- **Drag the conversation view tabs to reorder them.** 对话 / 轨迹 / 上下文 / … reorder by
  dragging, with the same lift-and-FLIP feel as the rail. The order is kept in `localStorage`
  and reapplied on every render. The 对话 tab cannot be moved — the shipped header pins it
  first — and how many tabs fit is decided by the bar's own width, not by this plugin.

And two that are about *not* letting the list get long:

- **Archived Sessions sink to the bottom of their group.** The shipped row for an archived
  Session never even attaches `draggable`, so those rows used to sit wherever they landed and
  interleave with live work. This plugin reorders them by `updatedAt` (newest first) to the end
  of each group and draws a hairline above them, leaving live rows in exactly the order the
  Host chose.
- **A whole-row height cap.** Both the panel-icon stack and the 置顶 section are capped at 30%
  of the rail's height, rounded **down to whole rows** — six 36px rows, not "six and a sliced
  seventh". The cap is recomputed on resize, so folding the window never leaves a half row
  hanging.

## Layout

```
lib/index.js     host half  — diagnostics routes (see below), no runtime dependencies
lib/client.js    browser half — wraps in window.__ModuleLoader__.load; requires('react') from the host
cordis.patch.yml bundle patch — inserts the host row under the id `sidebar-entries`
```

The two halves are independent: the browser half is the actual feature, the host half only
provides the `/sidebar-entries/*` routes used for self-diagnostics and for hot-reloading the
client bundle while developing.

## How the reordering works (and why it is done in the DOM)

DeepSeek Harness ships a pin/unpin model for sidebar panels (`createPanelPins`), but it is
memory-only — it resets on every reload — and it permanently pins the `plugins` row. This plugin
therefore keeps its own order in `localStorage` (`dse.sidebar.order.v2`) and replays it onto the
list on every render:

- rows are identified by `aria-label`, grouped so that two rows sharing a label move together and
  keep their relative order;
- the "More" row is never draggable and never moves — it is the insertion anchor;
- a `MutationObserver` on the list re-applies the saved order after React re-renders, with an
  "already in order → do nothing" short-circuit so the plugin cannot ping-pong with itself.

Nothing in the shipped app is patched; the plugin only manipulates the rendered list.

## How the pinned section works

The shipped list already sorts pinned Sessions to the front of *their own* group, but they stay
scattered across workspaces. This plugin lifts them into one group:

- a `MutationObserver` on `[class*=listArea]` re-derives everything after each render;
- whether a row is pinned is read from the pin indicator the row component itself renders, so no
  cached list can drift out of date;
- the original rows are `display:none` (not removed — React owns them), and a copy of each is
  appended to a `置顶` section inserted as the first child of the list area;
- a copy carries the markup but none of React's handlers, so a click on one is replayed on the
  same element of the original by walking the child index path;
- the exception is the pin toggle: clicking it in a copy calls `uiWorkspace.unpinSession(id)`
  directly, the same service the shipped button calls. Replaying a click into a row that is
  currently `display:none` is exactly what made "取消置顶" dead from inside the section;
- the copy's `⋯` menu button is hidden rather than removed: that menu anchors on its own button,
  which now sits inside a hidden row, and hiding keeps the child indexes aligned for the replay.

### The copy carries the live state, not just the title

A Session row is five parts: a leading `slot` (the status dot), the title, a trailing `time`
(which reads “待回复” / “待批准” while an interaction is pending, and the relative time
otherwise), a pin indicator, and the hover actions. The pinned section builds its own rows, so
for a long time it built only the title and the actions — which meant a pinned Session showed no
spinner while it was running and no “待回复” when it was waiting for you, exactly when that
information matters most.

The status is React state this plugin cannot read, so the two live parts are **mirrored from the
shipped row instead of recomputed**: the shipped row is still in the DOM (only `display:none`),
and its status span is already current. The mirror runs on every sync tick rather than only on
rebuild, because running and pending are transient — a row built once would freeze on whatever
state it happened to have at that instant. Text and markup are compared before writing, so an
idle row is not rewritten 60 times a second.

### Child Sessions follow their parent into the section

Forking a Session from the pinned section creates a child Session. That child used to land in
whatever workspace the fork chose and drop straight to the bottom of a group — visually
disconnected from the parent it was forked from. Now, when a newly created Session's `parentId`
points at a pinned Session, it is pinned too and inserted **directly after its parent** in the
local order.

Two guards keep this from sweeping in history. The first pass only *seeds* the set of Sessions
already known and pins nothing, so an upgrade cannot pin every Session that ever had a parent.
And a candidate must have been updated within the last ten minutes: a Session without a usable
`updatedAt` is treated as old, because pinning it on the strength of a guess is exactly the
failure this guard exists to prevent. Unpinning the parent does not unpin the child.

## Storage keys

| key | meaning |
| --- | --- |
| `dse.sidebar.order.v2` | JSON array of panel ids, in the user's order |
| `dse.sidebar.collapsed.v1` | `'1'` when the panel icons are folded away |
| `dse.pin.order.v1` | JSON array of Session ids, in the order shown in the 置顶 section |
| `dse.pin.closed.v1` | `'1'` when the 置顶 section is folded |
| `dsh.sidebar-entries.viewtab.v1` | JSON array of conversation-view keys, in the user's tab order |

All live in the web app's `localStorage`. Clearing site data resets the plugin to defaults.

## Footer entries are lifted into the rail

Any button rendered in the sidebar footer (`sidebar.footer.action`, or a plugin that injects its
own button into the footer container) is pulled up into the rail automatically. The plugin builds a
stand-in row from the footer button itself — same label, a copy of its own icon — and only then
hides the original with `[data-dse-lifted]{display:none}`. If the lift ever fails, the button stays
where it was, so a plugin installed tomorrow needs no change in this one.

- The row forwards its click to the original control, so whatever panel the plugin opens still
  opens; the plugin does not need to be known by name.
- The pass is driven by a `MutationObserver` on `document.body` and re-checks which footer
  controls exist, so a plugin that mounts its footer entry late is still picked up.
- An uninstall or a client rebuild removes the stand-in rows **and** clears `data-dse-lifted`, so
  a footer control can never be left permanently hidden by a stale attribute.

## The one built-in row

**文献** — opens the literature plugin's panel. The literature plugin moves its own entry into the
right sidebar when it detects a `betterSidebar` service, and does not move it back when the service
later disappears, so its footer button is sometimes gone entirely; this row tries the footer
button, then the dock tab it migrated into, then the service itself. It degrades quietly when the
literature plugin is not installed.

## Failure containment

A client module whose `apply()` throws cannot be mounted, and the only way out of that state is
to disable the plugin — which is a miserable thing to discover after a restart. Every subsystem
here is therefore started behind its own guard: the stylesheet injection, the slot read, all
eight `ctx.effect` registrations, each subsystem's construction, the slot injection, and the
host half's four HTTP routes. A subsystem that fails to start returns `null` and its teardown
becomes a no-op; the rest of the plugin still mounts.

This is verified rather than asserted: the module was mounted against hostile stubs (a `ctx`
that throws on every property read, an `effect()` that rethrows, an `inject()` that throws) and
against cold-start shapes (`readyState: 'loading'`, `documentElement: null`, `body: null`, empty
`localStorage`). It mounts in all of them. The diagnostic snapshot also reports each subsystem,
so a silently degraded feature is visible in `GET /sidebar-entries/log` rather than only on
screen.

## Install

```bash
dsh plugin --profile web add dsh-sidebar-entries
```

Restart the web app once so the bundle patch layer is picked up, then reload the page.

## Diagnostics

While developing, the host half exposes four routes. They are intentionally unauthenticated —
they only read in-memory state and only mutate the client bundle revision.

| route | purpose |
| --- | --- |
| `GET /sidebar-entries/ping` | liveness + version |
| `GET /sidebar-entries/graph` | client modules visible to the host, and this package's resolved client path |
| `GET/POST /sidebar-entries/log` | last 20 client reports (drag start/end, panel state) |
| `POST /sidebar-entries/reload` | rebuild this package's client bundle (hot reload, no restart) |

Client reports are only sent when `window.__dseDebug` is set, except for the handful of events
that are always sent (drag start/end) — those are what make the drag verifiable without a
browser automation harness.

## License

MIT

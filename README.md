# dsh-sidebar-entries

A DSH web-sidebar plugin. It strengthens the **plugin rail** of the sidebar and nothing else: the workspace tree, the session list and their drag-and-drop are left completely to the Host.

## What it does

- **Whole-row height cap** — the plugin rail takes 30% of the sidebar, rounded **down to whole rows**. You never get a half row: overflow scrolls.
- **One chevron folds the rail** — click the arrow next to the "插件" title and the whole rail collapses to its header; click again to unfold.
- **Long-press drag reordering** — plugin entries can be dragged into a new order. The order is stored locally and restored on the next start.
- **Footer entries lifted into the rail** — entries that plugins register in the sidebar footer are surfaced in the plugin rail, in the same list.
- **Top view-tab drag** — the conversation view tabs above the chat (对话 / 轨迹 / …) can be dragged into a new order. The order is stored per profile. The "对话" tab is fixed in place.

Every one of these is independent: if one fails to mount, the others keep working and the sidebar keeps rendering.

## Why it is done in the DOM

The Host owns the sidebar tree and its stores; a plugin cannot write into them. So this plugin does not try. It reads what the Host renders and changes only what the DOM allows it to change — a `max-height` derived from measured row height, an `order` value, a stored array in `localStorage`. It never reparents Host nodes, so a Host re-render can never collide with it.

## What it deliberately does not touch

- The workspace tree, its ordering, its drag-and-drop.
- The session list, its ordering, its drag-and-drop.
- The pinned-session area, the archive grouping.

Those belong to the Host. Earlier versions of this plugin tried to help there; every attempt meant holding on to Host-rendered nodes, and the Host's next render fought back. They are gone.

## Storage keys

| Key | What it holds |
| --- | --- |
| `dsh.sidebar-entries.order.v1` | Plugin rail order |
| `dsh.sidebar-entries.viewtab.v1` | Top view-tab order |

## Failure containment

Every subsystem starts inside its own `try/catch`, and the whole client half is mounted behind one more. A failure in one of them is written into the plugin's own diagnostic log and never propagates into the Host: the sidebar keeps rendering even if this plugin cannot do anything at all.

## Install

```bash
npm install dsh-sidebar-entries
```

or add it to the profile's composition:

```yaml
- insert:
    - id: dsh-sidebar-entries
      name: dsh-sidebar-entries
```

## Diagnostics

`GET /sidebar-entries/ping` — liveness and version.
`GET /sidebar-entries/log` — the last 50 diagnostic entries.
`POST /sidebar-entries/reload` — ask the Host to rebuild this plugin's client bundle.

## License

MIT © fragrantlotus

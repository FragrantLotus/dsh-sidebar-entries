window.__ModuleLoader__.load({
  id: 'dsh-sidebar-entries',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require('react');
    const h = React.createElement;
    const VERSION = '0.7.46';
    // One set of drag numbers for the whole sidebar.
    //
    // Three separate drag implementations had drifted apart: the rail lift used
    // 0.94 opacity with an 8/22 shadow, the pinned section used the same, and the
    // Session drag used 0.96 with a 10/24 shadow and a slower 260ms settle. They
    // are the same gesture to the user, so they must read the same — hence one
    // source for the timing and one for the lifted-card treatment.
    const MOVE_MS = 180;
    const MOVE_EASE = 'cubic-bezier(.2,.8,.2,1)';
    // The lifted card has to read as a card against BOTH themes, and a drop
    // shadow alone cannot do that: on the dark sidebar a shadow is invisible
    // because there is nothing darker to cast it onto. The ring is what makes
    // the edge legible there, and it costs nothing in the light theme.
    const LIFT_SHADOW = '0 3px 10px rgba(0,0,0,.16),0 0 0 1px var(--dsw-alias-border-l2,rgba(127,127,127,.26))';
    // The lifted card, shared by the rail row, the pinned row and the Session
    // card, so all three are literally the same surface.
    //
    // Everything here is a THEME TOKEN with a translucent fallback — no literal
    // colours. The theme supplies both light and dark values, so the card
    // follows whichever the user picks instead of being tuned to one of them;
    // hardcoding was exactly how the Session card ended up pale in a light
    // theme while the rail row looked grey in a dark one.
    //
    // The fallback is a translucent film rather than an opaque grey, so a build
    // whose token names changed still yields something that reads as "dimmed
    // surface" instead of a solid block of the wrong colour.
    //
    // `bg-overlay` turned out NOT to be that film in this build: it measures
    // `rgb(97,102,107)`, a solid mid grey. Painted at 80% over a `rgb(27,27,28)`
    // rail it reads as a pale slab — which is exactly what "the animation does
    // not suit dark mode" was describing. `bg-layer-2` is the raised-surface
    // token proper and measures `rgb(44,44,46)` here, one step above the rail
    // and one below a dialog, so the card reads as lifted in either theme.
    // Two declarations on purpose: the plain token is the fallback, and the
    // color-mix is what actually paints. Mixing in `currentColor` is what makes
    // the lift adapt without asking the theme anything — the text colour is
    // near-white on the dark sidebar and near-black on the light one, so eight
    // percent of it always moves the surface AWAY from the surface behind it.
    const LIFT_FILL = 'var(--dsw-alias-bg-layer-2,rgba(127,127,127,.18));background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#2c2c2e) 92%,currentColor)';
    const LIFT_EDGE = '1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35))';
    // 80% — translucent enough to read as "lifted out of the list", opaque enough
    // that the rows sliding underneath do not show through the label.
    const LIFT_OPACITY = '0.8';
    const LIFT_RADIUS = '8px';
    // No plugin is named in this file any more. Every entry in the rail either
    // comes from the host itself (the shipped rows, the collapse toggle) or is a
    // stand-in built by the footer lift from whatever a plugin rendered into the
    // sidebar foot. Naming a plugin here would keep an icon alive after the user
    // uninstalled it, which is exactly what a hardcoded entry did before.
    const CSS = [
      // Every action registered in the sidebar foot is pulled up into the rail
      // (see startFooterLift), and the original control is hidden with this one
      // rule. The attribute is only set AFTER the stand-in row exists, so a
      // lift that fails for any reason never costs the user the control.
      // Hide a control only after its stand-in exists. Both selectors are needed:
      // the host's own class carries a build hash, and a plugin is free to restyle
      // the foot through the slot attribute instead.
      '[class*=footerActions] [data-dse-lifted],[data-slot="sidebar.footer.action"] [data-dse-lifted]{display:none !important}',
      // A lifted row shows a copy of the foot control's own icon, so a plugin
      // installed tomorrow needs no icon of its own here.
      // The stand-in glyph box. It must not grow: the row is a flex line with a
      // fixed-size glyph cell, and an unstyled wrapper happily stretches to the
      // SVG's intrinsic size, pushing the title out of view (the row renders as a
      // blank pill). Pin the box to the cell's own size — `100%` would make it
      // eat the row and clip the label.
      '.dse-lift-glyph{display:inline-flex;align-items:center;justify-content:center;' +
        'flex:none;width:16px;height:16px;min-width:0;min-height:0;overflow:hidden}',
      '.dse-lift-glyph svg,.dse-lift-glyph img{width:100%;height:100%;display:block;' +
        'max-width:100%;max-height:100%;object-fit:contain}',
      // Letter tile for an entry whose control is a word rather than an icon.
      // A rounded square outline holding the initial: it reads as a badge, which
      // is what a word-only entry needs to look deliberate beside real icons.
      // Outline only — no fill, because any fill would disagree with whatever
      // surface the rail is drawn on.
      //
      // Weight is NOT copied from the shipped glyphs. Those are 18px SVGs on a
      // 24-unit viewBox with stroke-width 1, so their stroke lands near 0.75px;
      // copying that made the badge read as a faint rectangle with a hairline
      // letter. A letterform is solid fill, not a stroke, so at this size it
      // carries more optical weight per pixel — which is why the first
      // correction (1.5px / 600) overshot. These values sit between the two and
      // are what measured right: a mid border with the lighter weight.
      // Colours stay `currentColor` so the badge matches the icons in every
      // theme (a hard-coded black was darker than them in light mode and
      // invisible in dark).
      '.dse-lift-letter{box-sizing:border-box;display:inline-flex;align-items:center;'
        + 'justify-content:center;width:100%;height:100%;background:transparent;'
        + 'border:1.25px solid currentColor;border-radius:3px;color:currentColor;'
        + 'font-size:10px;line-height:1;font-weight:500;text-transform:uppercase;'
        + 'letter-spacing:0;opacity:1}',
      // A synthesised label, used only when the prototype row was captured in the
      // collapsed rail (which omits the title span entirely). Borrows the host's
      // own typography so the row still matches its neighbours.
      '.dse-lift-title{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}',
      // A lifted row keeps the rail's own geometry. It is built (not cloned) so
      // it inherits nothing from whichever row happened to be the prototype, but
      // that means it also inherits none of the host's layout — so state the
      // metrics here, matching a shipped row: a 36px line, 16px glyph cell,
      // 8px gap, and the ellipsis that keeps a long label from wrapping.
      //
      // Background stays transparent at rest: a filled pill reads as "this is
      // the page you are on", and a lifted entry is never that. Only hover
      // paints, exactly like its neighbours.
      '.dse-lift-row{box-sizing:border-box;display:flex;align-items:center;' +
        'width:100%;min-height:36px;margin:0 2px;padding:7px 8px;gap:8px;' +
        'border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;' +
        'color:var(--dsw-alias-label-primary);font:inherit;line-height:22px;' +
        'text-align:left;cursor:pointer}',
      '.dse-lift-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dse-lift-row:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid currentColor}',
      // A folded rail shrinks every row to its glyph cell; ours has to follow or
      // it would be the one row still showing text in a strip of icons.
      '[class*=collapsed] .dse-lift-row,[data-sidebar-collapsed="true"] .dse-lift-row{' +
        'width:36px;height:36px;justify-content:center;margin:0;padding:0}',
      '[class*=collapsed] .dse-lift-row .dse-lift-title,' +
        '[data-sidebar-collapsed="true"] .dse-lift-row .dse-lift-title{display:none}',
      // The shipped "more" trigger only opens 浏览更多插件 / 创建你的插件, and the
      // rail is short on room. The trigger lives inside a Menu wrapper
      // (`span[class*=moreAnchor]`), so hiding the button alone would leave an
      // empty flex gap — hide the wrapper. It stays in the DOM: it is the insert
      // anchor for every reorder, so it is hidden rather than removed.
      'nav[class*=panelList]>span[class*=moreAnchor]{display:none !important}',
      // The plugin list is the only part of the rail whose length grows with the
      // number of installed plugins, and the shipped list is `flex:none` — with
      // enough plugins it pushes the session tree (the thing the sidebar exists
      // for) clean off the bottom. Cap it at half the rail and let it scroll in
      // place. A percentage works here because the root is `height:100%`; the
      // whole rail is a flex column, so `flex:none` keeps the cap from being
      // stretched back out.
      //
      // Collapsed rail is exempt: rows there are single 36px glyphs, the list is
      // short by construction, and a scroll container would clip the flyout.
      'nav[class*=panelList]{max-height:var(--dse-plugin-cap,30%);overflow-y:auto;overflow-x:hidden;' +
        'overscroll-behavior:contain;scrollbar-width:thin;border-radius:10px;padding:2px 0;' +
        'box-sizing:border-box}',
      '[class*=collapsed] nav[class*=panelList]{max-height:none;overflow-y:visible;border-radius:0;padding:0}',
      // The rail's own rows are taller than the session rows underneath them, and
      // the difference is what reads as "too much air" between two entries. Same
      // height as a session row, so the whole sidebar shares one rhythm.
      'nav[class*=panelList]>*{height:32px;min-height:32px;max-height:32px}',
      // Match the host's scrollbar palette, but NOT through its
      // --dsh-scrollbar-thumb variable: the rail switches that variable to
      // `transparent` whenever it wants quiet bars, which would leave this list
      // scrollable and apparently un-scrollable at the same time. Read the
      // palette entry directly so the thumb is always there.
      'nav[class*=panelList]::-webkit-scrollbar{width:8px}',
      'nav[class*=panelList]::-webkit-scrollbar-thumb{' +
        'background:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.45));border-radius:4px}',
      'nav[class*=panelList]::-webkit-scrollbar-thumb:hover{' +
        'background:var(--dsw-alias-scrollbar-hover-l2,var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.7)))}',
      'nav[class*=panelList]::-webkit-scrollbar-track{background:transparent}',
      // The row under the cursor leaves the flow visually: it follows the
      // pointer by transform, so it needs to sit above its neighbours. No
      // transition here — it must track the pointer without lag.
      // Two classes, not one.
      //
      // A single-class selector ties with the shipped `.…panelRow:hover` rule and
      // loses on source order — and during a drag the pointer is unavoidably over
      // the row, so the Host's hover background (`interactive-bg-hover`, a
      // translucent overlay) replaced the card fill. The row then looked flat
      // transparent while the pinned and Session cards, whose selectors already
      // carry two classes, showed the card correctly. Matching the real rows
      // by attribute and by class puts this rule above the Host's hover rule,
      // so the fill survives the hover it is unavoidably in.
      'button[class*=panelRow].dse-dragging,.dse-lift-row.dse-dragging,' +
        '.dse-dragging{position:relative;z-index:6;opacity:' + LIFT_OPACITY +
        ' !important;transition:none !important;box-shadow:' + LIFT_SHADOW +
        ' !important;border-radius:' + LIFT_RADIUS + ' !important;background:' + LIFT_FILL +
        ' !important;border:' + LIFT_EDGE + ' !important}',
      '.dse-drag-on>button[class*=panelRow]{cursor:grabbing !important}',
      // Neighbours slide out of the way instead of jumping: FLIP sets the
      // inverse offset first, then this class animates it back to zero.
      '.dse-flip{transition:transform ' + MOVE_MS + 'ms ' + MOVE_EASE + '}',
      // The Host marks the insertion point with its own caret. This module
      // previews the move instead — rows slide aside while the pointer is still
      // travelling — so the caret would be a second, contradictory account of
      // the same intent, and it is the piece the user named first.
      //
      // Both spellings are listed because the two surfaces were not written in
      // the same style: a Session row is marked `dropBefore`/`dropAfter`, while
      // a Workspace group is marked `workspaceDropBefore`/`workspaceDropAfter`.
      // Attribute substring matching is case-sensitive, so the lower-case pair
      // alone silently left the Workspace caret on screen — which is why the
      // Workspace drag still looked like the shipped one after Sessions stopped.
      '[class*=dropBefore]:before,[class*=dropAfter]:after,' +
        '[class*=DropBefore]:before,[class*=DropAfter]:after{display:none !important}',
      // The list also draws a top-of-list line for the same purpose, in a class
      // of its own, so the pair above does not reach it.
      '[class*=listTopDropIndicator]{display:none !important}',
      // Rows pushed aside by the preview animate; the dragged row itself must
      // track the pointer with no transition at all.
      '.dse-space{transition:transform ' + MOVE_MS + 'ms ' + MOVE_EASE + '}',
      // The carried Session row is a live clone that rides the pointer. It gets
      // the SAME fill, edge, shadow, radius and opacity as `.dse-dragging` —
      // they are the same surface, and the user sees the difference immediately
      // when one of them is styled apart.
      //
      // No CSS transition on the transform. The card is moved by a frame loop
      // (see driveCard), and a transition on top of that would introduce a
      // second, slower smoothing stage: the loop's correction would itself be
      // eased, so the card would lag the cursor and drift after it stopped.
      // One smoothing mechanism, and it is the frame one.
      '.dse-card{position:fixed;z-index:2147483000;pointer-events:none !important;' +
        'overflow:hidden;opacity:1;box-shadow:' + LIFT_SHADOW +
        ';border-radius:' + LIFT_RADIUS + ';' +
        'background:' + LIFT_FILL + ';border:' + LIFT_EDGE + ';' +
        'transition:none;will-change:transform}',
      '.dse-card *{pointer-events:none !important}',
      // Superseded by the collapsed-unit preview below, which hides the source
      // slot outright; kept because the failure mode it prevents (an in-flight
      // row that still accepts hits and gets committed onto itself) applies
      // whenever the preview cannot engage.
      '.dse-drag-src{opacity:.4 !important;transition:opacity .12s linear}',
      // The synthesised 置顶 group sits above the shipped groups. It is a plain
      // flex column so the borrowed group-row / session-row styles inside it
      // behave exactly as they do in their original position.
      '.dse-pin-section{display:flex;flex-direction:column;flex:none;margin-bottom:2px;'
        + 'max-height:var(--dse-pin-cap,30%);min-height:0;border-radius:10px;overflow:hidden}',
      // The body is the scroller, not the section: capping the section and
      // letting the body scroll keeps the header always visible while a long
      // pin list moves under it.
      '.dse-pin-body{display:flex;flex-direction:column;min-width:0;min-height:0;'
        + 'padding:2px 0;box-sizing:border-box;'
        + 'overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;'
        + 'scrollbar-width:thin}',
      '.dse-pin-body::-webkit-scrollbar{width:8px}',
      '.dse-pin-body::-webkit-scrollbar-thumb{' +
        'background:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.45));border-radius:4px}',
      '.dse-pin-body::-webkit-scrollbar-thumb:hover{' +
        'background:var(--dsw-alias-scrollbar-hover-l2,var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.7)))}',
      '.dse-pin-body::-webkit-scrollbar-track{background:transparent}',
      // Collapsed: the body leaves the flow entirely. `display:none` rather than
      // a 0 height, so the rows stop being measured by the drag code and the
      // host's own tree semantics do not report hidden rows as visible.
      '.dse-pin-section.dse-pin-closed .dse-pin-body{display:none}',
      '.dse-pin-section.dse-pin-closed{max-height:none}',
      // The checkmark that faces the shipped groups' arrow. Same rotation the
      // Host applies to its own triangle, so open/closed reads the same way.
      '.dse-pin-arrow{flex:none;display:inline-flex;align-items:center;justify-content:center;'
        + 'width:16px;height:20px;color:var(--dsw-alias-label-tertiary);'
        + 'transition:transform .15s var(--ds-ease-in-out);transform:rotate(90deg)}',
      '.dse-pin-section.dse-pin-closed .dse-pin-arrow{transform:none}',
      '.dse-pin-label{flex:1 1 auto;min-width:0;overflow:hidden;'
        + 'text-overflow:ellipsis;white-space:nowrap}',
      // The live-state pair. The shipped row reserves a fixed 16px column for
      // the status dot, and a fixed-width slot is what keeps titles aligned
      // whether or not a Session is busy; sizing it to content would make every
      // row shift the moment one of them started working.
      '.dse-pin-slot{flex:none;display:inline-flex;align-items:center;justify-content:center;'
        + 'width:16px;height:20px;color:var(--dsw-alias-label-tertiary)}',
      // Only used when no shipped row on screen carries a status mark to copy.
      // Same footprint as the Host's own dot so the row never shifts.
      '.dse-pin-slot[data-dse-run="1"]::before{content:"";display:block;width:12px;height:12px;'
        + 'border-radius:50%;border:2px solid currentColor;border-top-color:transparent;'
        + 'box-sizing:border-box;animation:var(--dse-spin) 1.5s linear infinite}',
      '.dse-pin-ring{display:block;width:12px;height:12px;border-radius:50%;'
        + 'border:2px solid currentColor;border-top-color:transparent;'
        + 'animation:dse-pin-turn .9s linear infinite}',
      '@keyframes dse-pin-turn{to{transform:rotate(360deg)}}',
      '.dse-pin-time{flex:none;color:var(--dsw-alias-label-tertiary);font-size:10px;'
        + 'line-height:16px;white-space:nowrap}',
      // Mirrors the shipped row's hover behaviour: the actions and the trailing
      // status compete for the same right-hand space, and the shipped row gives
      // it to the actions on hover. Same rule here so the two never differ.
      '.dse-pin-row:hover .dse-pin-time,.dse-pin-row:focus-within .dse-pin-time{display:none}',
      // The fold toggle's triangle: right while the rail is folded (nothing to
      // show), 90° down once the list is out. Driven by an attribute the toggle
      // sets on itself, so no icon rebuild is needed to change state.
      'button[data-dse-ui="toggle"] span[class*=panelGlyph] svg{'
        + 'transition:transform .15s var(--ds-ease-in-out);transform:none}',
      'button[data-dse-ui="toggle"][data-dse-open="1"] span[class*=panelGlyph] svg{'
        + 'transform:rotate(90deg)}',
      // Fallback only: the header normally borrows the shipped projectRow class
      // and never uses this one, but a build that renames that class must not
      // leave an unstyled, invisible heading behind.
      // Rows the section builds itself. Deliberately NOT reusing the shipped
      // session-row classes: those carry a build hash and a fixed three-column
      // layout (pin marker / title / hover actions) that a stand-alone row has
      // no use for. Geometry matches the shipped row so the two read alike.
      '.dse-pin-row{box-sizing:border-box;position:relative;display:flex;align-items:center;gap:6px;'
        + 'width:100%;min-height:32px;margin:0 1px;padding:0 8px;'
        + 'border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;'
        + 'color:var(--dsw-alias-label-primary);font:inherit;line-height:20px;'
        + 'text-align:left;cursor:pointer;user-select:none}',
      '.dse-pin-spacer{height:32px;min-height:32px;background:transparent;pointer-events:none}',
      '.dse-pin-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      // Adopted rows are the Host's own nodes: our wrapper only supplies the
      // box, so the row inside must keep its own layout, hover and animation.
      '.dse-pin-row.dse-pin-adopted{display:block;padding:0;margin:0;min-height:0;height:32px;'
        + 'overflow:hidden;cursor:default}',
      '.dse-pin-adopted>*{width:100%;box-sizing:border-box}',
      '.dse-pin-row:focus-visible{outline:var(--dsw-focus-ring-width) solid '
        + 'var(--dsw-alias-border-focus,currentColor);outline-offset:-2px}',
      '.dse-pin-row.dse-pin-active{background:var(--dsw-alias-interactive-bg-hover)}',
      // The dragged row leaves the flow visually (it follows the pointer by
      // transform) so it needs to sit above its neighbours. No transition here:
      // it has to track the pointer without lag. The other rows are animated by
      // the shared .dse-flip rule, which is the same curve the rail drag uses.
      // The row being carried keeps its own shape. Painting a filled, rounded
      // card behind it drops a grey slab into a list of flat rows, and the fill
      // appears the moment the pointer clears the threshold, so the row reads as
      // switching style rather than being picked up. A shadow that follows the
      // glyphs is the whole lift.
      // The section body scrolls (`overflow-y:auto`), so an OUTER shadow on a row
      // inside it is clipped at the body's edge: the blur is cut off dead
      // straight and reads as a grey rectangle pasted under the row. The card
      // therefore keeps its fill and hairline but takes the ring INSET, which
      // cannot be clipped, and drops the outer shadow entirely.
      '.dse-pin-row.dse-dragging{position:relative;z-index:6;cursor:grabbing;' +
        'transition:none !important;background:' + LIFT_FILL + ' !important;' +
        'border:0 !important;border-radius:' + LIFT_RADIUS + ' !important;' +
        'box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2,rgba(127,127,127,.34)) !important;' +
        'filter:none !important;opacity:' + LIFT_OPACITY + ' !important}',
      // The actions ride in the same slot the shipped row uses: revealed on
      // hover, laid out right to left so the ⋯ menu sits rightmost exactly as it
      // does in the shipped row.
      '.dse-pin-acts{flex:none;display:none;align-items:center;gap:2px;margin-inline-start:auto}',
      '.dse-pin-row:hover .dse-pin-acts,.dse-pin-row:focus-within .dse-pin-acts{display:inline-flex}',
      '.dse-pin-act{flex:none;display:inline-flex;align-items:center;justify-content:center;'
        + 'width:22px;height:22px;padding:0;border:none;border-radius:4px;'
        + 'background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}',
      '.dse-pin-act:hover{background:var(--dsw-alias-interactive-bg-hover);'
        + 'color:var(--dsw-alias-label-primary)}',
      '.dse-pin-act svg{width:14px;height:14px;display:block}',
      // The shipped row, laid out invisibly on top of its copy so the Host's own
      // popover measures a real rectangle instead of an empty one.
      '.dse-replay{position:fixed !important;display:block !important;'
        + 'visibility:hidden !important;opacity:0 !important;'
        + 'pointer-events:none !important;margin:0 !important;z-index:-1 !important;'
        + 'left:0;top:0}',
      // The action cluster is `display:none` until the row is hovered, and a
      // replayed row is never hovered - so its buttons keep an empty 0x0 rect at
      // the viewport corner, and the popover that measures them opens at 12,12
      // clipped by the top edge. Lay the cluster out while the replay is up.
      '.dse-replay [class*="rowActions"]{display:inline-flex !important;'
        + 'visibility:visible !important;opacity:1 !important}',
      // The ⋯ popover. Fixed-positioned so it can escape the sidebar's own
      // clipping, with the theme's elevated surface and shadow so it reads as a
      // menu rather than another row.
      '.dse-pin-menu{position:fixed;z-index:2147483001;min-width:150px;'
        + 'padding:4px;display:flex;flex-direction:column;gap:1px;'
        + 'border-radius:var(--dsw-radius-md,8px);'
        + 'background:var(--dsw-alias-bg-overlay,var(--dsw-specific-sidebar-fill,#2b2b31));'
        + 'border:' + LIFT_EDGE + ';box-shadow:0 8px 24px rgba(0,0,0,.28)}',
      '.dse-pin-menu-item{display:block;width:100%;padding:6px 10px;border:none;'
        + 'border-radius:calc(var(--dsw-radius-md,8px) - 3px);background:transparent;'
        + 'color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;'
        + 'line-height:20px;text-align:left;cursor:pointer}',
      '.dse-pin-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dse-pin-head{color:var(--dsw-alias-label-tertiary);font-size:12px;' +
        'line-height:20px;padding:4px 8px;user-select:none}'
    ].join('\n');
    let cssDone = false;
    function ensureCss() {
      if (cssDone) return;
      // CSS is already a single joined string (see the `].join('\n')` above);
      // accept an array too so the shape can change without breaking boot.
      const text = Array.isArray(CSS) ? CSS.join('\n') : String(CSS);
      try {
        const existing = document.getElementById('dse-style');
        if (existing) {
          // A hot reload swaps our code but leaves the old <style> in the head,
          // so the previous build's rules would keep winning. Refresh the text.
          if (existing.textContent !== text) existing.textContent = text;
          cssDone = true;
          return;
        }
        const el = document.createElement('style');
        el.id = 'dse-style';
        el.textContent = text;
        document.head.appendChild(el);
        cssDone = true;
      } catch (e) {}
    }
    // -------- integer row caps --------
    //
    // Both lists are capped as a share of the rail, but a share almost never
    // lands on a whole row: the last one is left cut in half, which reads as a
    // rendering fault rather than as "the list continues below". The share is
    // therefore converted into `rows * rowHeight` pixels by measuring once per
    // layout, and the CSS variables carry that number instead of a percentage.
    const CAP_PLUGINS = 0.30;
    const CAP_PINS = 0.30;
    // Measure a real row rather than assume 32px: the host owns its density,
    // and a collapsed rail draws taller glyph rows than an expanded one.
    function rowHeightOf(list) {
      try {
        const kids = list ? Array.prototype.slice.call(list.children) : [];
        for (let i = 0; i < kids.length; i++) {
          const h = kids[i].getBoundingClientRect().height;
          if (h >= 8) return h;
        }
      } catch (e) {}
      return 0;
    }
    // Height is not pitch: a row can be 32px tall and still sit 36px below its
    // neighbour once a gap or a margin is counted. Capping by height alone leaves
    // the last row cut through the middle — its rounded corner sliced off — which
    // is exactly what "the height is not a whole number of cards" looks like.
    function rowStepOf(list) {
      try {
        const kids = list ? Array.prototype.slice.call(list.children) : [];
        const boxes = [];
        for (let i = 0; i < kids.length; i++) {
          const r = kids[i].getBoundingClientRect();
          if (r.height >= 8) boxes.push(r);
          if (boxes.length === 2) break;
        }
        if (boxes.length === 2) {
          const d = boxes[1].top - boxes[0].top;
          if (d > 4) return d;
        }
        if (boxes.length === 1) {
          const cs = getComputedStyle(kids[0]);
          const mb = parseFloat(cs.marginBottom) || 0;
          const mt = parseFloat(cs.marginTop) || 0;
          return boxes[0].height + mb + mt;
        }
      } catch (e) {}
      return 0;
    }
    function applyCaps() {
      const out = { railH: 0, rowH: 0, pluginRows: 0, pinRows: 0, pluginCap: 0, pinCap: 0, headH: 0 };
      try {
        const docEl = document.documentElement;
        const nav = document.querySelector('nav[class*="panelList"]');
        // The rail is the box the percentages would have resolved against, so
        // it is also the box the 30% is a share of.
        const rail = nav ? (nav.closest('[class*=regionArea]') || nav.parentElement) : null;
        const railH = rail ? rail.getBoundingClientRect().height : 0;
        out.railH = Math.round(railH);
        if (!nav || railH < 80) {
          // Not laid out yet (or the rail is closed): drop the overrides so the
          // CSS fallback percentage governs until there is something to measure.
          docEl.style.removeProperty('--dse-plugin-cap');
          docEl.style.removeProperty('--dse-pin-cap');
          return out;
        }
        const rowH = rowHeightOf(nav) || 32;
        out.rowH = Math.round(rowH);
        let navPadT = 0;
        let navPadB = 0;
        try {
          const cs = getComputedStyle(nav);
          navPadT = parseFloat(cs.paddingTop) || 0;
          navPadB = parseFloat(cs.paddingBottom) || 0;
        } catch (e) {}
        const pluginStep = rowStepOf(nav) || rowH;
        const pluginRows = Math.max(1, Math.floor((railH * CAP_PLUGINS - navPadT - navPadB) / pluginStep));
        const pluginCap = Math.round(navPadT + navPadB + pluginRows * pluginStep);
        out.pluginStep = Math.round(pluginStep);
        out.pluginRows = pluginRows;
        out.pluginCap = pluginCap;
        docEl.style.setProperty('--dse-plugin-cap', pluginCap + 'px');
        // Pins: the cap covers the header row as well, so only what is left of
        // the share may be spent on rows. Expressed back as a section cap, the
        // scroll edge lands exactly under a row instead of through one.
        // The two lists have their own density — a plugin row is 36px, a pin row
        // borrows the session row's 32px — so this measures its own rows rather
        // than reusing the plugin measurement.
        const section = document.querySelector('.dse-pin-section');
        const head = section ? section.querySelector('[data-dse-ui="pin-head"]') : null;
        let headH = head ? head.getBoundingClientRect().height : 0;
        // The pinned section is built by another part of this module and may not
        // exist yet on the first pass (or may be mid-rebuild). Measuring 0 there
        // would hand the section a cap that is one row too tall, which is the
        // half-row this whole routine exists to remove — so fall back to the
        // shipped group row's height, which is what the header borrows.
        if (!(headH >= 8)) {
          try {
            const proto = document.querySelector('div[class*=projectRow]');
            headH = proto ? proto.getBoundingClientRect().height : 0;
          } catch (e) { headH = 0; }
        }
        if (!(headH >= 8)) headH = 34;
        out.headH = Math.round(headH);
        const pinRowH = (function () {
          try {
            const body = section ? section.querySelector('.dse-pin-body') : null;
            const row = body ? body.querySelector('[data-dse-ui="pin-row"]') : null;
            const h = row ? row.getBoundingClientRect().height : 0;
            return h >= 8 ? h : 32;
          } catch (e) { return 32; }
        })();
        out.pinRowH = Math.round(pinRowH);
        const bodyEl = section ? section.querySelector('.dse-pin-body') : null;
        // 4px is the body's own vertical padding from the stylesheet. Ask the
        // box first, but never trust a 0: at boot the section can be measured
        // before its body exists, and a cap built on 0 there eats the bottom
        // row by exactly the padding that arrived a frame later.
        let bodyPad = 4;
        try {
          if (bodyEl) {
            const bcs = getComputedStyle(bodyEl);
            const measured = (parseFloat(bcs.paddingTop) || 0) + (parseFloat(bcs.paddingBottom) || 0);
            if (measured > 0) bodyPad = measured;
          }
        } catch (e) { bodyPad = 4; }
        const pinStep = (bodyEl ? rowStepOf(bodyEl) : 0) || pinRowH;
        const bodyBudget = Math.max(pinRowH, railH * CAP_PINS - headH - bodyPad);
        const pinRows = Math.max(1, Math.floor(bodyBudget / pinStep));
        // Rounded, because 0.3 * 827 is 248.10000000000002: a fractional tail on
        // an arithmetic result of whole rows is noise, not information.
        const pinCap = Math.round(headH + bodyPad + pinRows * pinStep);
        out.pinStep = Math.round(pinStep);
        out.pinRows = pinRows;
        out.pinCap = pinCap;
        docEl.style.setProperty('--dse-pin-cap', pinCap + 'px');
      } catch (e) { out.lastError = String((e && e.message) || e); }
      return out;
    }
    // The caps depend on the rail's height, which the user can change by
    // dragging the sidebar edge or by collapsing it. A resize observer keeps
    // them in step without polling; the interval is the fallback for the
    // layout changes an observer does not report (a font swap, a zoom).
    function startCapSync(ctx) {
      let observer = null;
      let raf = 0;
      let last = applyCaps();
      const schedule = () => {
        if (raf) return;
        raf = window.requestAnimationFrame(() => { raf = 0; last = applyCaps(); });
      };
      try {
        const nav = document.querySelector('nav[class*="panelList"]');
        const rail = nav ? (nav.closest('[class*=regionArea]') || nav.parentElement) : null;
        if (rail && typeof window.ResizeObserver === 'function') {
          observer = new window.ResizeObserver(schedule);
          observer.observe(rail);
        }
      } catch (e) { observer = null; }
      const onResize = () => schedule();
      try { window.addEventListener('resize', onResize, true); } catch (e) {}
      const timer = window.setInterval(schedule, 1500);
      schedule();
      return {
        refresh: schedule,
        stats: function () { return last; },
        destroy: function () {
          if (raf) { try { window.cancelAnimationFrame(raf); } catch (e) {} raf = 0; }
          try { window.clearInterval(timer); } catch (e) {}
          try { window.removeEventListener('resize', onResize, true); } catch (e) {}
          try { if (observer) observer.disconnect(); } catch (e) {}
          observer = null;
          try {
            document.documentElement.style.removeProperty('--dse-plugin-cap');
            document.documentElement.style.removeProperty('--dse-pin-cap');
          } catch (e) {}
        }
      };
    }
    // Diagnostics stay quiet unless the page opts in with window.__dseDebug = true,
    // unless a caller forces the report (used once at manager start-up).
    function report(payload, force) {
      // Stamped so a stale record can never be mistaken for a fresh one: the log
      // keeps a rolling history, and "the newest record" is only meaningful if it
      // also says when it was written.
      try { payload.at = Date.now(); } catch (e) {}
      try { window.__dseLast = payload; } catch (e) {}
      try { if (window.__dseDebug) console.log('[dsh-sidebar-entries]', payload); } catch (e) {}
      try {
        if (!window.__dseDebug && !force) return;
        fetch('/sidebar-entries/log', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function () {});
      } catch (e) {}
    }
    // (No hand-written openers live here: every rail row is either a host row or
    // a lift stand-in that forwards its click to the real control. That is what
    // makes the rail follow installs and uninstalls automatically.)
    function firstMatch(selector) {
      try {
        const list = document.querySelectorAll(selector);
        return list.length > 0 ? list[0] : null;
      } catch (e) { return null; }
    }
    function serviceOf(ctx, name) {
      try { const v = ctx && ctx[name]; if (v) return v; } catch (e) {}
      try { const v = ctx && typeof ctx.get === 'function' ? ctx.get(name) : null; if (v) return v; } catch (e) {}
      try { const v = ctx && ctx.reflect && typeof ctx.reflect.get === 'function' ? ctx.reflect.get(name) : null; if (v) return v; } catch (e) {}
      return null;
    }
    // The right sidebar is a dockkit dock; each tab renders
    //   div[data-dockkit-tab="<tabId>"] ... button[aria-label="关闭"](.tabClose)
    // That built-in close button works. Some embedded panels ship a header X that
    // is wired to onClose:()=>{}, i.e. dead. So: on a dead X inside a dock pane,
    // click the dock's own tab close button instead. Nothing here names a plugin:
    // the dead-X test is structural (a 关闭 button in the panel header that is not
    // inside a dock tab), so it works for whatever panel is embedded today.
    function tabStripCloseFor(panel) {
      try {
        const pane = panel.closest('[data-dockkit-pane]');
        if (!pane) return null;
        const active = pane.querySelector('[data-dockkit-tab][aria-selected="true"] button[aria-label="关闭"], [data-dockkit-tab][aria-selected="true"] button[aria-label="Close"]');
        if (active) return active;
        const buttons = pane.querySelectorAll('[data-dockkit-tab] button[aria-label="关闭"], [data-dockkit-tab] button[aria-label="Close"]');
        if (buttons.length > 0) return buttons[0];
      } catch (e) {}
      return null;
    }
    let closing = false;
    function closeDockedPanel(target) {
      if (closing) return false;
      closing = true;
      try {
        const panel = target && typeof target.closest === 'function' ? target.closest('.zt-panel-embedded') : null;
        const attempt = { event: 'close-docked', version: VERSION, hadPanel: !!panel };
        const btn = panel ? tabStripCloseFor(panel) : null;
        attempt.found = !!btn;
        if (btn) btn.click();
        report(attempt);
        return !!btn;
      } finally {
        window.setTimeout(function () { closing = false; }, 250);
      }
    }
    let ctxRef = null;
    function isDeadCloseButton(target) {
      const btn = target.closest('button');
      if (!btn) return null;
      const title = btn.getAttribute('title') || '';
      const aria = btn.getAttribute('aria-label') || '';
      const named = title === '关闭' || aria === '关闭' || title === 'Close' || aria === 'Close';
      if (!named) return null;
      if (!btn.closest('.zt-panel-embedded')) return null;
      if (!btn.closest('.zt-header')) return null;
      if (btn.closest('[data-dockkit-tab]')) return null;
      return btn;
    }
    function handleCapture(event) {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      // Every click that reaches document capture is counted, before any branch
      // can bail. "The entry does nothing" splits into two worlds — no event at
      // all (something upstream swallowed it, or the pointer never got here) vs.
      // an event we saw and mishandled — and nothing else in the log can tell
      // them apart.
      try {
        if (window.__dseClickStats) {
          window.__dseClickStats.seen = (window.__dseClickStats.seen || 0) + 1;
          window.__dseClickStats.last = String((target.closest('button') && target.closest('button').getAttribute('data-dse-lift')) || target.tagName || '');
          window.__dseClickStats.at = Date.now();
        }
      } catch (e) {}
      if (isDeadCloseButton(target)) {
        event.preventDefault();
        event.stopPropagation();
        closeDockedPanel(target);
        return;
      }
      const btn = target.closest('button[aria-label], button[title], button');
      if (!btn) return;
      // A stand-in for a sidebar-foot control forwards its click to that control.
      // This is done HERE, in the capture phase, and only here: a listener on the
      // row itself can be starved by any other capture-phase handler that stops
      // propagation (this module's own drag "swallow" does exactly that for the
      // first click after a drag), and having two forwarders fire the control
      // twice opens its panel and immediately closes it.
      const liftKey = btn.getAttribute('data-dse-lift');
      if (liftKey) {
        event.preventDefault();
        event.stopPropagation();
        const lift = window.__dseFooterLift;
        if (lift && typeof lift.forward === 'function') {
          try { lift.forward(liftKey); } catch (e) {}
        }
        return;
      }
      if (String(btn.className || '').indexOf('panelRow') < 0) return;
    }
    function fallbackCard(title, onClick) {
      return function Fallback() {
        return h('div', { style: { display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' } },
          h('button', { type: 'button', onClick: onClick, style: { border: '1px solid currentColor', background: 'transparent', color: 'inherit', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13 } }, '打开' + title)
        );
      };
    }

    // ===================== pinned session section =====================
    const PIN_SECTION_LABEL = '置顶';
    // Pinned sessions are rebuilt from the workspace store instead of being
    // copied out of the rendered list. The copy approach could only place a
    // Session the sidebar had already rendered, so a pinned Session living in a
    // collapsed workspace group produced an empty section — and an empty section
    // is indistinguishable from a broken one. Ids come from the workspace store
    // and titles from the session list store, so the section renders no matter
    // what the tree currently shows.
    const LS_PIN_ORDER = 'dse.pin.order.v1';
    // Same pushpin silhouette the shipped row uses, drawn here so the section
    // does not depend on a build-hashed icon package.
    const PIN_SVG =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M14.5 2.6a1 1 0 0 1 1.4 0l5.5 5.5a1 1 0 0 1 0 1.4l-1.9 1.9a1 1 0 0 1-1.4 0l-.3-.3-3.1 3.1.3 3.1a1 1 0 0 1-.3.9l-1.4 1.4a1 1 0 0 1-1.4 0l-3.4-3.4-4.9 4.9a1 1 0 0 1-1.4-1.4l4.9-4.9-3.4-3.4a1 1 0 0 1 0-1.4l1.4-1.4a1 1 0 0 1 .9-.3l3.1.3 3.1-3.1-.3-.3a1 1 0 0 1 0-1.4z"/>' +
      '</svg>';
    // The group rows' disclosure triangle, filled and pointing right at rest —
    // CSS rotates it 90° when the section is open, exactly like the Host does.
    // One disclosure arrow for both foldable groups (置顶 and the plugin list),
    // pointing right at rest and rotated 90° by CSS when open.
    //
    // A stroked chevron, not a filled triangle: a fill has no line weight at all
    // and a stroked fill varies at every corner, while a chevron's width is the
    // same by construction along its whole length. One shared constant also
    // keeps the two arrows identical — the earlier pair was drawn twice at
    // different sizes (10px vs 16px box), so the same visual weight came out
    // roughly twice as heavy in one of them.
    const DISCLOSURE_SVG =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9.5 5.5 16 12l-6.5 6.5"/>' +
      '</svg>';
    // Kept as an alias so the header code reads the same as before.
    const ARROW_SVG = DISCLOSURE_SVG;
    // Archive (a lidded box) and the ⋯ menu, drawn to match the pin: stroke
    // icons in `currentColor` so they follow the theme like the shipped ones.
    const ARCHIVE_SVG =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="4.5" rx="1"/>' +
      '<path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5"/>' +
      '<path d="M10 12.5h4"/></svg>';
    const MORE_SVG =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/>' +
      '<circle cx="18.5" cy="12" r="1.7"/></svg>';

// ===================== panel list manager =====================
    // The official sidebar renders `sidebar.panellist` entries sorted by the
    // static `order` they were registered with, so runtime re-ordering has to
    // happen on the DOM the shell produced. Everything below is defensive:
    // React may re-render at any time, so a MutationObserver re-applies the
    // persisted order / hidden set, and every entry point tolerates a missing
    // nav (the sidebar can be unmounted).
    // v1 was only ever written by development builds of this plugin (the panel
    // manager shipped in 0.3.0), so there is no user preference to migrate.
    const LS_ORDER = 'dse.sidebar.order.v2';
    // One flag for the whole rail: no per-icon hiding any more, so the old
    // per-key list has no meaning. Kept distinct from the order key so a
    // collapsed rail never disturbs the arrangement the user dragged out.
    const LS_COLLAPSED = 'dse.sidebar.collapsed.v1';
    // See the one-time heal at boot: marks that the wedged-rail flag has already
    // been cleared once, so folding the rail afterwards is honoured.
    const LS_HEALED = 'dse.sidebar.collapsed.healed.v1';
    // One label for both states. "展开插件"/"收起插件" read as an instruction,
    // which stopped matching once the row also carries a rotating arrow — the
    // arrow already says which way the list will go.
    const COLLAPSE_LABEL = '插件';
    const EXPAND_LABEL = '插件';
    // No long-press delay: the Host's own Session rows start dragging as soon
    // as the pointer moves, and any wait made our rows feel sluggish beside
    // them. A drag is armed on pointerdown and only becomes visible (and
    // reordering) once the pointer crosses DRAG_THRESHOLD_PX.
    const DRAG_THRESHOLD_PX = 8;

    function readArr(key) {
      try {
        const v = JSON.parse(window.localStorage.getItem(key) || '[]');
        return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
      } catch (e) { return []; }
    }
    function writeArr(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
    // Section open/closed is a single bit, so it gets its own key rather than a
    // slot in the order array — the two have different lifetimes.
    const LS_PIN_CLOSED = 'dse.pin.closed.v1';
    function readPinClosed() {
      try { return window.localStorage.getItem(LS_PIN_CLOSED) === '1'; } catch (e) { return false; }
    }
    function writePinClosed(closed) {
      try { window.localStorage.setItem(LS_PIN_CLOSED, closed ? '1' : '0'); } catch (e) {}
    }
    function svgIcon(kind, collapsed) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      const path = (d) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); svg.appendChild(p); };
      if (kind === 'toggle') {
        // Same arrow as the 置顶 header, rotated by CSS (see the toggle rules).
        // Reusing the SVG string, not a hand-built path: building it with
        // createElementNS produced a second, subtly different shape.
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '12');
        svg.setAttribute('height', '12');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2.4');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        path('M9.5 5.5 16 12l-6.5 6.5');
      } else {
        path('M4 7h16M4 12h10M4 17h6');
      }
      return svg;
    }
    // Builds one rail row from a live prototype. Shared by the panel manager
    // (toggle + our own entries) and the footer lift (one row per foot control),
    // so it lives at module scope and takes the collapsed flag it needs instead
    // of reading the manager's state.
      function buildRailRow(nav, kind, label, icon, collapsed) {
        const proto = nav.querySelector('button[class*="panelRow"]:not([data-dse-ui]):not([data-dse-lift]):not([aria-haspopup])');
        if (!proto) return null;
        const row = proto.cloneNode(true);
        row.setAttribute('data-dse-ui', kind);
        row.removeAttribute('aria-current');
        row.removeAttribute('aria-expanded');
        // Lifted rows are ordinary entries, not "the page you are on", so they
        // take a quietting class of their own (see `.dse-lift-row`).
        if (kind === 'lift') {
          try { row.classList.add('dse-lift-row'); } catch (e) {}
        }
        // The prototype may be the row the user just selected, and the selection
        // class paints a permanent full-width pill. A stand-in is never "current".
        try {
          const tokens = String(row.className || '').split(/\s+/);
          row.className = tokens.filter((t) => t && !/panelActive|active|selected/i.test(t)).join(' ');
        } catch (e) {}
      // The prototype is taken from a live row, and a collapsed rail has every
      // one of those hidden by inline style. cloneNode copies inline styles, so
      // without this reset the toggle — the single control that un-collapses the
      // rail — would be built already invisible, leaving the column empty with no
      // way back. Same trap as the pin clones.
      try { row.style.display = ''; } catch (e) {}
      row.removeAttribute('data-dse-hidden');
      row.setAttribute('aria-label', label);
      row.setAttribute('title', label);
      const glyph = row.querySelector('span[class*="panelGlyph"]');
      if (glyph) {
        while (glyph.firstChild) glyph.removeChild(glyph.firstChild);
        if (icon) {
          const box = document.createElement('span');
          box.className = 'dse-lift-glyph';
          box.appendChild(icon.cloneNode(true));
          glyph.appendChild(box);
        } else {
          glyph.appendChild(svgIcon(kind, collapsed));
        }
      }
      // The prototype decides whether a title span exists at all. A row copied
      // from the collapsed rail has no label node — the host omits it there —
      // so writing into `title` silently did nothing and the entry rendered as
      // an unlabelled pill. Build the span from the glyph's own class prefix so
      // it still carries the host's typography, and fall back to our own class.
      const protoTitle = row.querySelector('span[class*="panelTitle"]');
      if (protoTitle) {
        protoTitle.textContent = label;
      } else {
        const span = document.createElement('span');
        let cls = 'dse-lift-title';
        const glyphCls = glyph ? String(glyph.className || '') : '';
        const prefix = glyphCls.split('_')[0];
        if (prefix && prefix.length > 1) {
          cls = prefix + '_panelTitle ' + prefix + '_wide ' + cls;
          // `dse-lift-title` would otherwise lose to the host class on the
          // ellipsis rules, which is fine — both say the same thing.
          span.className = cls;
        } else {
          span.className = cls;
        }
        span.textContent = label;
        row.appendChild(span);
      }
      return row;
    }
      // A lifted row is built from scratch rather than cloned from a shipped row.
      // Cloning looked cheaper but couples the stand-in to whatever state the
      // prototype happened to be in: taken from a collapsed rail the copy has no
      // title span (the host omits it there), so the entry rendered as an
      // unlabelled pill, and taken from the row the user had selected it carried
      // the selection paint. Neither is a thing a stand-in should inherit.
      //
      // The literal `panelRow` token keeps this row inside the selectors that
      // collect rail rows (they match on the substring), while the host's own
      // `wtg9ga_panelRow` rules — which are keyed on its hashed class — leave it
      // alone. Its geometry is therefore stated by `.dse-lift-row` instead.
      function buildLiftRow(label, icon) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'dse-lift-row panelRow';
        row.setAttribute('data-dse-ui', 'lift');
        row.setAttribute('aria-label', label);
        row.setAttribute('title', label);
        const glyph = document.createElement('span');
        glyph.className = 'dse-lift-glyph';
        if (icon) {
          try { glyph.appendChild(icon.cloneNode(true)); } catch (e) {}
        }
        row.appendChild(glyph);
        const title = document.createElement('span');
        title.className = 'dse-lift-title';
        title.textContent = label;
        row.appendChild(title);
        return row;
      }
    function startPanelManager(ctx) {
      const slots = ctx && ctx.slots ? ctx.slots : null;
      const state = {
        nav: null,
        toggle: null,
        collapsed: false,
        dragging: null,
        swallow: false,
        timer: 0,
        startX: 0,
        startY: 0,
        // Pointer-following offset for the dragged row. grabOffset is how deep
        // into the row the pointer landed; lift is the translateY that puts the
        // row's visual top under the pointer. Lift is recomputed against the
        // row's current box on every move instead of being accumulated from
        // deltas — the row's layout slot jumps by a full row height whenever it
        // is re-inserted, and a delta-accumulated lift would then leave the card
        // one row away from the cursor.
        grabOffset: 0,
        lift: 0,
        // How many times this drag actually re-ordered the rail. Zero means the
        // pointer never crossed another row.
        moves: 0,
        labelToId: Object.create(null),
        // Set once the boot-time self-heal has run, so it cannot fight a drag.
        healed: false,
        observer: null,
        raf: 0,
        panel: null,
        disposed: false
      };

      // label -> [ids], because two entries may carry the same label (this
      // profile has two 插件市场 rows). Stamping consumes one id per row in
      // render order, which is the order the slot registry already sorted by
      // `order`, so distinct panels get distinct keys.
      function labelMap() {
        const map = Object.create(null);
        try {
          const list = slots && typeof slots.entriesOfSlot === 'function' ? slots.entriesOfSlot('sidebar.panellist') : [];
          const sorted = list.slice().sort((a, b) => {
            const oa = (a && a.options && a.options.order) || 0;
            const ob = (b && b.options && b.options.order) || 0;
            return oa - ob;
          });
          for (let i = 0; i < sorted.length; i++) {
            const options = sorted[i] && sorted[i].options ? sorted[i].options : null;
            if (!options || !options.id) continue;
            let label = options.label;
            if (typeof label === 'function') { try { label = label(); } catch (e) { label = null; } }
            if (typeof label === 'string' && label) {
              if (!map[label]) map[label] = [];
              map[label].push(options.id);
            }
          }
        } catch (e) {}
        return map;
      }
      // The rail is the nav that holds row-shaped buttons. Identify it by shape
      // only: naming any single plugin's label here would break the moment that
      // plugin is uninstalled (and would leave this file referring to an entry
      // the user deleted).
      function findNav() {
        try {
          const ours = document.querySelector('[data-dse-ui]');
          if (ours) {
            const nav = ours.closest('nav');
            if (nav) return nav;
          }
        } catch (e) {}
        try {
          const navs = document.querySelectorAll('nav[class*="panelList"]');
          for (let i = 0; i < navs.length; i++) {
            if (navs[i].querySelector('button[class*="panelRow"]')) return navs[i];
          }
          for (let i = 0; i < navs.length; i++) {
            if (navs[i].querySelector('button[aria-haspopup="menu"]')) return navs[i];
          }
          return navs.length ? navs[0] : null;
        } catch (e) { return null; }
      }
      function rows(nav) {
        try {
          return Array.prototype.slice.call(nav.children).filter((el) => el && el.tagName === 'BUTTON' && String(el.className || '').indexOf('panelRow') >= 0);
        } catch (e) { return []; }
      }
      function isMenuRow(el) { return !!el && el.hasAttribute && el.hasAttribute('aria-haspopup'); }
      function isOurs(el) { return !!el && el.hasAttribute && el.hasAttribute('data-dse-ui'); }
      // A lifted entry is ours in the sense that we built it, but it is the
      // user's entry: it stands in for a plugin's own control and has to be
      // draggable exactly like a shipped row. Only the collapse toggle (and the
      // pinned section's clones) stay out of the drag pass.
      function isLiftRow(el) {
        return !!el && el.hasAttribute && el.getAttribute('data-dse-ui') === 'lift';
      }
      function draggableRows(nav) {
        return rows(nav).filter((el) => (!isOurs(el) || isLiftRow(el)) && !isMenuRow(el));
      }
      // Rows lifted out of the sidebar foot are ours too (buildRow stamps
      // data-dse-ui), so the drag pass skips them, but they are part of the
      // rail and must collapse with it.
      function collapsibleRows(nav) {
        try {
          return Array.prototype.slice.call(nav.children).filter((el) => {
            return el && el.tagName === 'BUTTON' && String(el.className || '').indexOf('panelRow') >= 0;
          });
        } catch (e) { return []; }
      }
      // A panel row is identified by its label. Two different registrants can
      // render the same label (this profile has two 插件市场 rows), so a label
      // may map to a group: those rows always move together and keep their
      // relative order. Deriving identity from the label — instead of stamping
      // DOM nodes — keeps the order stable across re-renders and reloads.
      function keyOf(el) {
        // A lifted row carries its own identity: the label of a footer control is
        // not unique (two plugins can both be called 插件市场), and the slot
        // registry this map is built from does not contain lifted controls at
        // all, so falling through to the label would merge two different rows.
        if (isLiftRow(el)) {
          const liftKey = el.getAttribute('data-dse-lift');
          if (liftKey) return 'lift:' + liftKey;
        }
        const label = (el && el.getAttribute && el.getAttribute('aria-label')) || '';
        return state.labelToId[label] ? state.labelToId[label][0] : label;
      }
      function moreTrigger(nav) {
        try { return nav.querySelector('button[aria-haspopup]'); } catch (e) { return null; }
      }
      // The shipped "more" trigger is rendered inside a Menu wrapper
      // (`span[class*=moreAnchor]`), so it is NOT a direct child of the nav. Any
      // insert anchor has to be a nav-level node: resolve the trigger, then walk
      // up to the child that actually sits in the nav. Returning the trigger
      // itself would nest our rows inside the wrapper.
      function moreRow(nav) {
        const trigger = moreTrigger(nav);
        if (!trigger) return null;
        let node = trigger;
        while (node && node.parentElement && node.parentElement !== nav) node = node.parentElement;
        return node && node.parentElement === nav ? node : null;
      }

      // labelMap is filled by walking the slot registry sorted by `order`, so
      // its insertion order IS the registration order: the order the sidebar
      // would show with no stored preference. `恢复默认` relies on this.
      function defaultOrder() {
        const out = [];
        const map = state.labelToId || Object.create(null);
        Object.keys(map).forEach((label) => {
          const ids = map[label];
          if (ids && ids.length) out.push(ids[0]);
        });
        return out;
      }
      // FLIP: measure, move, then animate each row from where it was to where it
      // landed. Without this the neighbours teleport on every insertBefore and
      // the drag reads as "nothing happened". Offsets are transform-only, so the
      // final layout is exactly what the DOM says.
      function flipMove(nav, move, skip) {
        let before = null;
        try { before = draggableRows(nav).map((el) => [el, el.getBoundingClientRect()]); } catch (e) { before = null; }
        move();
        if (!before || !before.length) return;
        try {
          for (let i = 0; i < before.length; i++) {
            const el = before[i][0];
            const from = before[i][1];
            if (!el.parentNode) continue;
            if (skip && skip.indexOf(el) >= 0) continue;
            const to = el.getBoundingClientRect();
            const dy = from.top - to.top;
            const dx = from.left - to.left;
            if (!dy && !dx) continue;
            el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            el.classList.remove('dse-flip');
            // Force a style flush so the inverse offset is committed before the
            // transition is enabled, otherwise the browser coalesces both and
            // the row simply appears at its new place.
            void el.offsetHeight;
            el.classList.add('dse-flip');
            el.style.transform = '';
          }
        } catch (e) {}
      }

      // Everything we insert goes above this node: the shipped "more" wrapper.
      // Without it the fallback is appendChild, which is still fine — the toggle
      // is pinned to the top separately, so only the rows can drift.
      function tailAnchor(nav) {
        return moreRow(nav);
      }
      function orderRowsBy(nav, keys) {
        if (!keys || !keys.length) return;
        const list = draggableRows(nav);
        if (!list.length) return;
        const pos = Object.create(null);
        // Keep the FIRST recorded position for a duplicated key: rows sharing a
        // label form a group, and the stable sort below keeps their own order.
        keys.forEach((k, i) => { if (pos[k] === undefined) pos[k] = i; });
        const keyed = list.map((el, i) => ({ el: el, i: i, key: keyOf(el) }));
        keyed.sort((a, b) => {
          const pa = pos[a.key] === undefined ? 10000 + a.i : pos[a.key];
          const pb = pos[b.key] === undefined ? 10000 + b.i : pos[b.key];
          return pa - pb;
        });
        let same = true;
        for (let i = 0; i < keyed.length; i++) {
          if (keyed[i].el !== list[i]) { same = false; break; }
        }
        if (same) return;
        const anchor = tailAnchor(nav);
        flipMove(nav, () => {
          for (let i = 0; i < keyed.length; i++) {
            if (anchor) nav.insertBefore(keyed[i].el, anchor);
            else nav.appendChild(keyed[i].el);
          }
        });
      }
      function applyOrder(nav) {
        const list = draggableRows(nav);
        if (!list.length) return;
        // The drag writes the DOM order itself and only persists on pointerup.
        // Replaying the stored order here would undo every move mid-drag: the
        // insertBefore fires the MutationObserver, whose refresh lands here.
        if (state.dragging) return;
        const stored = readArr(LS_ORDER);
        if (!stored.length) {
          // Nothing stored means "the sidebar's own order". React normally
          // renders that already, but a DOM can arrive scrambled: a hot reload
          // swaps our code without re-rendering the host's list, so rows keep
          // the positions the previous build left them in. Heal once at boot,
          // then never again — a second pass would fight an in-flight drag.
          if (state.healed) return;
          state.healed = true;
          orderRowsBy(nav, defaultOrder());
          return;
        }
        const order = stored.slice();
        // Keys never seen before (a newly installed panel) fall in at their
        // current position rather than being pushed to the end.
        const current = groupKeys(nav);
        current.forEach((k, i) => {
          if (order.indexOf(k) < 0) order.splice(Math.min(i, order.length), 0, k);
        });
        orderRowsBy(nav, order);
      }
      // One switch for the whole rail. Every panel row hides together, which is
      // what frees the column for the workspace list; no per-icon state is
      // involved any more.
      function applyCollapsed(nav) {
        // Every panel row hides together — including the stand-ins lifted out of
        // the sidebar foot, which is the whole point of lifting them here.
        const list = collapsibleRows(nav);
        for (let i = 0; i < list.length; i++) {
          const el = list[i];
          if (el.getAttribute('data-dse-ui') === 'toggle') continue;
          if (state.collapsed) {
            el.style.display = 'none';
            el.setAttribute('data-dse-hidden', '1');
          } else if (el.getAttribute('data-dse-hidden')) {
            el.style.display = '';
            el.removeAttribute('data-dse-hidden');
          }
        }
        try { window.localStorage.setItem(LS_COLLAPSED, state.collapsed ? '1' : ''); } catch (e) {}
      }

      // `icon` is an optional SVG (or any node) to use as the row glyph instead
      // of a built-in one. The footer lift passes the source control's own icon,
      // so a plugin installed tomorrow shows the glyph it shipped with.
      // Thin wrapper: the manager's rows read its live collapsed flag.
      function buildRow(nav, kind, label, icon) {
        return buildRailRow(nav, kind, label, icon, state.collapsed);
      }
      // The toggle is the first row of the rail and the only thing left in it
      // once collapsed, so it must survive every re-render: build once, then
      // only repair its label, chevron and position.
      function ensureToggle(nav) {
        const label = state.collapsed ? EXPAND_LABEL : COLLAPSE_LABEL;
        // The arrow is one shape rotated by CSS, so open/closed is an attribute
        // flip rather than an icon swap.
        const open = state.collapsed ? '0' : '1';
        if (!state.toggle || !state.toggle.parentNode) {
          const built = buildRow(nav, 'toggle', label);
          if (!built) return;
          built.setAttribute('data-dse-open', open);
          built.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            state.collapsed = !state.collapsed;
            refresh(true);
          });
          state.toggle = built;
          nav.insertBefore(built, nav.firstChild);
          return;
        }
        const row = state.toggle;
        if (row.getAttribute('data-dse-open') !== open) {
          row.setAttribute('data-dse-open', open);
        }
        if (row.getAttribute('aria-label') !== label) {
          row.setAttribute('aria-label', label);
          row.setAttribute('title', label);
          const t = row.querySelector('span[class*="panelTitle"]');
          if (t) t.textContent = label;
        }
        if (row.parentNode !== nav || row !== nav.firstElementChild) {
          nav.insertBefore(row, nav.firstChild);
        }
      }

      function refresh(force) {
        if (state.disposed) return;
        const nav = findNav();
        if (!nav) return;
        state.nav = nav;
        state.labelToId = labelMap();
        applyOrder(nav);
        applyCollapsed(nav);
        ensureToggle(nav);
        if (force) {
          const list = draggableRows(nav);
          const order = {};
          list.forEach((el, i) => { order[keyOf(el)] = i; });
          report({ event: 'panel-refresh', version: VERSION, rows: list.length, collapsed: state.collapsed, order: order }, false);
        }
      }
      function schedule() {
        if (state.disposed || state.raf) return;
        state.raf = window.requestAnimationFrame(() => {
          state.raf = 0;
          refresh(false);
        });
      }
      function attach(nav) {
        if (state.observer || !nav) return;
        try {
          state.observer = new MutationObserver(() => schedule());
          state.observer.observe(nav, { childList: true, subtree: false });
        } catch (e) { state.observer = null; }
      }

      // -------- long-press drag --------
      function clearTimer() {
        if (state.timer) { window.clearTimeout(state.timer); state.timer = 0; }
      }
      function endDrag(persist) {
        const row = state.dragging;
        state.dragging = null;
        clearTimer();
        state.grabOffset = 0;
        state.dragArmed = false;
        try { document.body.style.userSelect = ''; } catch (e) {}
        if (row) {
          row.classList.remove('dse-dragging');
          // Hand the row back to the layout where it was dropped: the lift is
          // only a pointer-following illusion, so it must not survive the drag.
          try { row.style.transform = ''; } catch (e) {}
          try { document.removeEventListener('pointermove', onMove, true); } catch (e) {}
          try { document.removeEventListener('pointerup', onUp, true); } catch (e) {}
          try { document.removeEventListener('pointercancel', onCancel, true); } catch (e) {}
        }
        state.lift = 0;
        if (state.nav) state.nav.classList.remove('dse-drag-on');
        if (row) {
          // Always reported, so a drag that produced no moves at all (the
          // pointer never travelled far enough to cross a row) is visible too.
          report({ event: 'panel-drag-end', version: VERSION, moves: state.moves || 0, persist: !!persist }, true);
        }
        if (persist && state.nav) {
          const keys = groupKeys(state.nav);
          writeArr(LS_ORDER, keys);
          state.labelToId = labelMap();
          report({ event: 'panel-drag', version: VERSION, order: keys }, false);
          // Read straight back: a write that silently fails (storage blocked,
          // quota, a sandboxed frame) would otherwise look like a successful
          // drag that mysteriously forgets itself on the next load.
          report({
            event: 'panel-drag-save',
            version: VERSION,
            wrote: keys.length,
            readBack: readArr(LS_ORDER).length,
            ls: (function () {
              try {
                window.localStorage.setItem('__dse_probe', '1');
                const v = window.localStorage.getItem('__dse_probe');
                window.localStorage.removeItem('__dse_probe');
                return v === '1' ? 'ok' : 'mismatch';
              } catch (e) { return 'ERR ' + (e && e.message ? e.message : e); }
            })()
          }, true);
        }
      }
      function onMove(event) {
        const row = state.dragging;
        if (!row || !state.nav) return;
        // Nothing lifts and nothing reorders until the pointer has genuinely
        // travelled: onPointerDown now arms a drag on every press, so without
        // this gate a plain click would yank the row out from under the cursor.
        if (!state.dragArmed) {
          if (Math.abs(event.clientX - state.startX) <= DRAG_THRESHOLD_PX && Math.abs(event.clientY - state.startY) <= DRAG_THRESHOLD_PX) return;
          state.dragArmed = true;
          row.classList.add('dse-dragging');
          if (state.nav) state.nav.classList.add('dse-drag-on');
          try { document.body.style.userSelect = 'none'; } catch (e) {}
          try {
            const box = row.getBoundingClientRect();
            state.grabOffset = state.startY - box.top;
          } catch (e) { state.grabOffset = 0; }
          state.lift = 0;
        }
        event.preventDefault();
        // The row rides the pointer. Its rect already includes the lift applied
        // by the previous move, so subtracting that back out gives the top the
        // layout assigned it — which is what the next lift must be measured
        // from. Recomputing (rather than adding deltas) is what keeps the card
        // under the cursor across a re-insert, where the layout slot moves by a
        // whole row height in one go.
        try {
          const box = row.getBoundingClientRect();
          const layoutTop = box.top - state.lift;
          state.lift = (event.clientY - state.grabOffset) - layoutTop;
          row.style.transform = 'translateY(' + state.lift + 'px)';
        } catch (e) {}
        // Rows sharing a label are one block: a 插件市场 drag carries both rows.
        const key = keyOf(row);
        const block = draggableRows(state.nav).filter((el) => keyOf(el) === key);
        if (!block.length) return;
        // Folded rows are display:none, so their rect is 0×0 at the origin and
        // would win every midpoint test. They are not drop targets.
        const others = draggableRows(state.nav).filter((el) => block.indexOf(el) < 0 && el.style.display !== 'none');
        // Compare against the pointer, not the row: the row is displaced by the
        // lift, so its rect no longer says where the user is pointing.
        let ref = null;
        for (let i = 0; i < others.length; i++) {
          const rect = others[i].getBoundingClientRect();
          if (event.clientY < rect.top + rect.height / 2) { ref = others[i]; break; }
        }
        const anchor = ref || (others.length ? others[others.length - 1].nextSibling : moreRow(state.nav));
        if (block[block.length - 1].nextSibling === anchor) return;
        // Keep the lifted row out of the FLIP pass: it is following the pointer,
        // and its own rect includes that transform.
        const lifted = block.indexOf(row);
        state.moves = (state.moves || 0) + 1;
        flipMove(state.nav, () => {
          for (let i = 0; i < block.length; i++) state.nav.insertBefore(block[i], anchor);
        }, lifted >= 0 ? [row] : null);
        // The re-insert just moved this row's layout slot by a whole row height,
        // so the lift computed before it no longer holds the card under the
        // pointer. Recompute against the new box: `state.lift` is still the
        // transform in effect, so subtracting it recovers the new layout top.
        try {
          const box = row.getBoundingClientRect();
          state.lift = (event.clientY - state.grabOffset) - (box.top - state.lift);
          row.style.transform = 'translateY(' + state.lift + 'px)';
        } catch (e) {}
      }
      function onUp() {
        // A press that never crossed the threshold was a click, not a reorder:
        // unwind silently and let the click handler open the entry.
        if (!state.dragArmed) { endDrag(false); return; }
        endDrag(true);
        // the pointerup is followed by a click on the row: never let it navigate
        state.swallow = true;
        window.setTimeout(() => { state.swallow = false; }, 400);
      }
      function onCancel() {
        if (!state.dragArmed) { endDrag(false); return; }
        endDrag(false);
        state.swallow = true;
        window.setTimeout(() => { state.swallow = false; }, 400);
      }
      function beginDrag(row) {
        if (state.dragging) return;
        state.dragging = row;
        state.moves = 0;
        state.lift = 0;
        // Armed, not lifted: applythe visual lift only after the pointer proves
        // this is a drag rather than a click (see onMove). Announcement still
        // happens here so "pressed but never moved" stays visible in the log.
        state.dragArmed = false;
        if (row) row.__dseArmed = true;
        report({ event: 'panel-drag-arm', version: VERSION, row: (row.getAttribute && row.getAttribute('aria-label')) || '', rows: state.nav ? draggableRows(state.nav).length : 0 }, false);
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', onUp, true);
        document.addEventListener('pointercancel', onCancel, true);
      }
      function onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        const row = target.closest('button[class*="panelRow"]');
        if (!row) return;
        if (isMenuRow(row)) return;
        // A lifted entry drags like any other row; only the collapse toggle is
        // excluded (it is a switch, not an entry, and moving it would hide the
        // one control that gets the rail back).
        if (isOurs(row) && !isLiftRow(row)) return;
        if (state.nav && !state.nav.contains(row)) return;
        state.startX = event.clientX;
        state.startY = event.clientY;
        clearTimer();
        // No long-press gate: the Host's own Session rows hand off to native
        // HTML5 dragging as soon as the pointer moves, and waiting 300 ms made
        // this rail feel sluggish next to them. onMove still refuses to reorder
        // until the pointer clears its 8 px threshold, so a plain click on an
        // entry keeps working.
        beginDrag(row);
      }
      function onPointerMoveEarly() {
        // The threshold lives in onMove alone. This document-level listener runs
        // before it (registered earlier in the capture phase) and used to cancel
        // the long press; now that a drag is armed on pointerdown there is
        // nothing to cancel, and touching dragArmed here would skip the lift.
      }
      function onPointerUpEarly() {
        clearTimer();
      }

      // Rows sharing a label form one group and move together, so every list
      // here works on the de-duplicated key order.
      function groupKeys(nav) {
        const seen = Object.create(null);
        const keys = [];
        draggableRows(nav).forEach((el) => {
          const key = keyOf(el);
          if (seen[key]) return;
          seen[key] = 1;
          keys.push(key);
        });
        return keys;
      }

      function onDocClick(event) {
        if (state.swallow) {
          state.swallow = false;
          event.preventDefault();
          event.stopPropagation();
        }
      }
      function onNavPointerDown(event) { onPointerDown(event); }

      function destroy() {
        state.disposed = true;
        clearTimer();
        endDrag(false);
        try { if (state.observer) state.observer.disconnect(); } catch (e) {}
        state.observer = null;
        try { document.removeEventListener('click', onDocClick, true); } catch (e) {}
        try { document.removeEventListener('pointerdown', onNavPointerDown, true); } catch (e) {}
        try { document.removeEventListener('pointermove', onPointerMoveEarly, true); } catch (e) {}
        try { document.removeEventListener('pointerup', onPointerUpEarly, true); } catch (e) {}
        try { if (state.toggle && state.toggle.parentNode) state.toggle.parentNode.removeChild(state.toggle); } catch (e) {}
        state.toggle = null;
        state.nav = null;
      }

      // A previous generation may have stamped attributes on live nodes; that
      // scheme is gone, so scrub them once so no stale value can resurface.
      try {
        const stale = document.querySelectorAll('button[data-dse-key]');
        for (let i = 0; i < stale.length; i++) stale[i].removeAttribute('data-dse-key');
      } catch (e) {}

      // The collapsed flag outlives a reload: a rail the user folded shut should
      // stay shut, otherwise every restart undoes the one thing it is for.
      // 0.6.0 shipped a fold button that cloned its arrow from an already hidden
      // row, so the arrow inherited display:none and the rail became a dead end:
      // every icon gone with nothing left to click. Anyone who got wedged that
      // way has '1' stored. One-time heal — a healed user folds it again and the
      // new flag keeps it shut like any other.
      try {
        if (window.localStorage.getItem(LS_COLLAPSED) === '1') {
          const healed = window.localStorage.getItem(LS_HEALED) === '1';
          if (!healed) {
            window.localStorage.removeItem(LS_COLLAPSED);
            window.localStorage.setItem(LS_HEALED, '1');
          }
        } else {
          window.localStorage.setItem(LS_HEALED, '1');
        }
      } catch (e) {}
      try { state.collapsed = window.localStorage.getItem(LS_COLLAPSED) === '1'; } catch (e) {}

      document.addEventListener('click', onDocClick, true);
      document.addEventListener('pointerdown', onNavPointerDown, true);
      document.addEventListener('pointermove', onPointerMoveEarly, true);
      document.addEventListener('pointerup', onPointerUpEarly, true);
      refresh(false);
      attach(findNav());
      let tries = 0;
      const boot = window.setInterval(() => {
        tries++;
        const nav = findNav();
        if (nav) {
          attach(nav);
          refresh(false);
          window.clearInterval(boot);
        } else if (tries > 40) {
          window.clearInterval(boot);
        }
      }, 250);
      window.setTimeout(() => {
        const nav = findNav();
        const list = nav ? draggableRows(nav) : [];
        const own = nav ? Array.from(nav.querySelectorAll('button[data-dse-ui]')) : [];
        report({
          event: 'panel-manager',
          version: VERSION,
          nav: !!nav,
          rows: list.length,
          keys: list.map((el) => keyOf(el)),
          labels: list.map((el) => el.getAttribute('aria-label')),
          stored: readArr(LS_ORDER),
          collapsed: !!state.collapsed,
          // The toggle is the only way out of the collapsed state, so its own
          // visibility is reported: a toggle built from a hidden prototype would
          // leave the rail empty with nothing to click.
          toggleShown: (function () {
            try { return state.toggle ? window.getComputedStyle(state.toggle).display : 'missing'; } catch (e) { return 'threw'; }
          })(),
          // The triangle is one shape rotated by CSS, so the rotation is the
          // whole signal: 90° means the list is out, 0 means it is folded.
          toggleArrow: (function () {
            try {
              const row = state.toggle;
              if (!row) return null;
              const svg = row.querySelector('span[class*=panelGlyph] svg');
              const cs = svg ? window.getComputedStyle(svg) : null;
              return {
                open: row.getAttribute('data-dse-open'),
                found: !!svg,
                transform: cs ? cs.transform : null
              };
            } catch (e) { return 'threw'; }
          })(),
          own: own.map((el) => el.getAttribute('aria-label')),
          first: nav && nav.firstElementChild ? (nav.firstElementChild.getAttribute('aria-label') || '') : null,
          // The shipped "more" trigger is hidden, but must stay in the DOM: it is
          // the insert anchor for every reorder. Note it is wrapped in a Menu
          // span, so the anchor is that wrapper — not the button itself.
          more: (function () {
            const row = nav ? moreRow(nav) : null;
            const cs = row ? window.getComputedStyle(row) : null;
            return { anchorFound: !!row, display: cs ? cs.display : null };
          })(),
          // The plugin list is capped and scrollable (see the CSS above). Report
          // the realised box, not the intention: a percentage max-height only
          // resolves when the parent has a definite height, and if that ever
          // stops being true the cap silently disappears.
          //
          // `caps` is the whole-row-arithmetic view of the same box: the share,
          // the row height it was divided by, and the integer row count that
          // survived. Reading only `maxHeight` cannot tell "6 whole rows" from
          // "6 rows and a sliced seventh".
          caps: (function () {
            try { return window.__dseCaps && window.__dseCaps.stats ? window.__dseCaps.stats() : null; }
            catch (e) { return 'threw'; }
          })(),
          list: (function () {
            try {
              if (!nav) return null;
              const cs = window.getComputedStyle(nav);
              const host = nav.parentElement;
              const hcs = host ? window.getComputedStyle(host) : null;
              return {
                maxHeight: cs.maxHeight,
                overflowY: cs.overflowY,
                height: Math.round(nav.getBoundingClientRect().height),
                scrollHeight: nav.scrollHeight,
                scrollable: nav.scrollHeight > nav.clientHeight + 1,
                scrollTop: Math.round(nav.scrollTop),
                hostHeight: host ? Math.round(host.getBoundingClientRect().height) : -1,
                hostDisplay: hcs ? hcs.display : null,
                // A percentage max-height only means "half the rail" if the
                // ancestor it resolves against really is the rail, so name it.
                hostCls: host ? String(host.className || '').slice(0, 60) : null,
                kids: nav.children.length,
                kidH: Array.prototype.slice.call(nav.children, 0, 12).map((el) =>
                  Math.round(el.getBoundingClientRect().height)),
                // The cap is only worth having if the session tree keeps its
                // room, so measure what sits below the plugin list too.
                below: (function () {
                  try {
                    const area = host ? host.querySelector('[class*=regionArea]') : null;
                    if (!area) return null;
                    const b = area.getBoundingClientRect();
                    return { height: Math.round(b.height), top: Math.round(b.top) };
                  } catch (e) { return 'threw'; }
                })()
              };
            } catch (e) { return 'threw:' + (e && e.message); }
          })(),
          // dsh-m renders its market button as `.dshm-entry`; it is hidden by our
          // CSS because it registers no panellist row of its own. Reported so a
          // regression in that hand-off is visible instead of silent.
          dshm: Array.from(document.querySelectorAll('.dshm-entry')).map((el) => {
            const cs = window.getComputedStyle(el);
            return { title: el.getAttribute('title'), display: cs.display };
          }),
          // The 文献 row opens the literature plugin through whatever entry that
          // plugin managed to install. Which of those exist decides the whole
          // open path, so both are reported side by side.
          lit: (function () {
            const foot = Array.from(document.querySelectorAll('[class*=footerActions] button')).map((el) => {
              const cs = window.getComputedStyle(el);
              return {
                cls: String(el.className || '').slice(0, 40),
                label: el.getAttribute('aria-label') || el.getAttribute('title') || '',
                display: cs.display
              };
            });
            let bsb = 'no-ctx';
            try {
              if (ctx) bsb = serviceOf(ctx, 'betterSidebar') ? 'yes' : 'null';
            } catch (e) { bsb = 'threw'; }
            // Whether a DOM button exists is only half the story: the plugin may
            // have registered a footer entry that never rendered. Read the slot
            // registry itself so "not registered" and "registered but invisible"
            // are told apart.
            let footIds = null;
            let overlayIds = null;
            try {
              const svc = ctx && ctx.slots;
              if (svc && typeof svc.entriesOfSlot === 'function') {
                footIds = svc.entriesOfSlot('sidebar.footer.action').map((e) => e.options && e.options.id);
                overlayIds = svc.entriesOfSlot('shell.overlay').map((e) => e.options && e.options.id);
              }
            } catch (e) { footIds = 'threw:' + (e && e.message); }
            return {
              footer: foot,
              bsb: bsb,
              footIds: footIds,
              overlayIds: overlayIds,
              embedded: document.querySelectorAll('.zt-panel-embedded').length,
              ztPanels: document.querySelectorAll('.zt-panel').length,
              ztTitles: Array.from(document.querySelectorAll('[class*=zt-header]')).map((el) => (el.textContent || '').trim().slice(0, 20)),
              dockTabs: Array.from(document.querySelectorAll('[data-dockkit-tab]')).map((el) => {
                const t = el.querySelector('[data-dockkit-tab-title]');
                return ((t && t.textContent) || el.getAttribute('data-dockkit-tab') || '').trim().slice(0, 20);
              }),
              overlays: Array.from(document.querySelectorAll('[class*=overlay]')).map((el) => String(el.className || '').slice(0, 40))
            };
          })(),
          // The pinned section is synthesised from the shipped rows, so the only
          // honest check is what ended up in the DOM: how many originals carry a
          // pin marker, and whether our copies actually made it into the host.
          pin: (function () {
            const host = firstMatch('[class*=listArea]');
            const section = document.querySelector('[data-dse-ui="pin-section"]');
            return {
              host: !!host,
              section: !!section,
              inHost: !!(section && host && section.parentNode === host),
              head: section ? (section.textContent || '').trim().slice(0, 12) : null,
              // The section is built from the store, not from copies, so this counts
              // the rows it actually rendered for the pinned ids it found.
              rows: document.querySelectorAll('[data-dse-ui="pin-row"]').length,
              // `allPins` below counts the indicator inside our own copies too, so
              // it can read 2 while only one real Session is pinned. This is the
              // number that actually matters: rows we decided to stand in for.
              section: (function () {
                try {
                  const body = document.querySelector('[data-dse-ui="pin-section"] .dse-pin-body');
                  if (!body) return null;
                  const kids = [];
                  for (let i = 0; i < body.children.length; i++) {
                    kids.push(((body.children[i].textContent || '').replace(/\s+/g, ' ').trim()).slice(0, 28));
                  }
                  return { kids: kids.length, labels: kids };
                } catch (e) { return 'threw'; }
              })(),
              // A clone that inherited `display:none` from its hidden original is
              // invisible but still counted, which is how a pinned Session can be
              // "cloned successfully" and still be missing from the screen.
              rowShown: Array.prototype.filter.call(document.querySelectorAll('[data-dse-ui="pin-row"]'), (el) => window.getComputedStyle(el).display !== 'none').length,
              rowTitles: Array.prototype.map.call(document.querySelectorAll('[data-dse-ui="pin-row"]'), (el) => (el.getAttribute('aria-label') || '').slice(0, 16)),
              marked: host ? host.querySelectorAll('span[class*=pinIndicator]').length : 0,
              // The pinned flag is rendered by the row itself, so the only way to
              // tell "no pinned sessions" from "pinned rows live in a container we
              // never found" is to list where session rows actually sit.
              scan: Array.prototype.map.call(document.querySelectorAll('[class*=listArea], [class*=rail], [class*=sessionList], [class*=tree]'), (el, i) => ({
                i: i,
                cls: String(el.className || '').slice(0, 44),
                rows: el.querySelectorAll('div[data-row-key^="session:"]').length,
                pins: el.querySelectorAll('span[class*=pinIndicator]').length
              })).slice(0, 12),
              allRows: document.querySelectorAll('div[data-row-key^="session:"]').length,
              allPins: document.querySelectorAll('span[class*=pinIndicator]').length,
              hidden: host ? Array.prototype.filter.call(host.querySelectorAll('div[data-row-key^="session:"]'), (el) => el.style.display === 'none').length : 0,
              // Several containers share the listArea class; record what each one
              // holds so a section built into the wrong box is visible at a glance.
              spots: Array.prototype.map.call(document.querySelectorAll('[class*=listArea]'), (el) => ({
                rows: el.querySelectorAll('div[data-row-key^="session:"]').length,
                pins: el.querySelectorAll('span[class*=pinIndicator]').length,
                groups: el.querySelectorAll('div[data-row-key^="workspace:"]').length
              })),
              // A workspace whose Sessions were all pinned ends up with a header
              // and nothing under it; count them so the hollow groups are visible.
              emptyGroups: host ? Array.prototype.filter.call(host.querySelectorAll('div[data-row-key^="workspace:"]'), (el) => {
                const parent = el.parentNode;
                if (!parent) return false;
                const kids = parent.querySelectorAll('div[data-row-key^="session:"]');
                if (!kids.length) return false;
                for (let i = 0; i < kids.length; i++) if (kids[i].style.display !== 'none') return false;
                return true;
              }).length : 0,
              // How many DOM nodes claim the same Session key — the list animator
              // leaves exiting copies behind, and each duplicate would be cloned.
              dup: host ? (function () {
                const seen = {};
                const all = host.querySelectorAll('div[data-row-key^="session:"]');
                for (let i = 0; i < all.length; i++) {
                  const k = all[i].getAttribute('data-row-key');
                  seen[k] = (seen[k] || 0) + 1;
                }
                return Object.keys(seen).filter((k) => seen[k] > 1).map((k) => k.slice(8) + 'x' + seen[k]);
              })() : [],
              // Whether "取消置顶" can work at all from a copy: the service the
              // shipped button calls, and how many copies actually located the
              // pin toggle by position.
              svc: !!serviceOf(ctx, 'uiWorkspace'),
              // Which child of the shipped `rowActions` is the pin toggle varies
              // with which slot entries are registered, so record what is really
              // there instead of assuming an index.
              acts: (function () {
                try {
                  const row = document.querySelector('div[data-row-key^="session:"]');
                  const box = row && row.querySelector('[class*=rowActions]');
                  if (!box) return null;
                  const out = [];
                  // Walk the whole subtree, not just the direct children: the
                  // shipped markup nests a flex div around the buttons.
                  (function walk(el, depth, prefix) {
                    if (out.length > 24) return;
                    for (let i = 0; i < el.children.length; i++) {
                      const kid = el.children[i];
                      out.push({
                        p: prefix + i,
                        d: depth,
                        tag: String(kid.tagName || '').toLowerCase(),
                        label: String(kid.getAttribute('aria-label') || '').slice(0, 12),
                        cls: String(kid.className || '').slice(0, 22),
                        html: depth >= 1 ? String(kid.outerHTML || '').slice(0, 90) : ''
                      });
                      if (depth < 2) walk(kid, depth + 1, prefix + i + '.');
                    }
                  })(box, 0, '');
                  return out;
                } catch (e) { return 'threw:' + (e && e.message); }
              })(),
              // The footer lift has to be told apart from "no footer control
              // exists": it reports how many controls it saw, how many rows it
              // built, and why it last gave up.
              lift: (function () { try { return window.__dseFooterLift && window.__dseFooterLift.stats ? window.__dseFooterLift.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })(),
              // The View tab row belongs to the Host, so its state has to be
              // readable on its own: what the DOM shows, what order this module
              // applied, and what the store remembers are three different things.
              viewTabs: (function () { try { return window.__dseViewTabs && window.__dseViewTabs.stats ? window.__dseViewTabs.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })(),
              // Sinking archived rows is a paint-order change, so the only
              // honest report is how many containers were touched and how many
              // wrappers actually moved on the last pass.
            };
          })()
        }, true);
      }, 1500);
      // `nav` is exposed so the footer lift can insert into the same rail this
      // manager already tracks; both passes must agree on a single node.
      return {
        destroy: destroy,
        refresh: refresh,
        get nav() { return state.nav; }
      };
    }

    // -------- generic footer lift --------
    // Every control the host renders in the sidebar foot belongs in the rail.
    // The foot is a single row of icon buttons at the very bottom, often out of
    // sight, and this plugin exists to keep the whole plugin surface in one
    // column. Nothing here names a specific plugin: whatever shows up in
    // `[class*=footerActions]` is picked up, including plugins installed after
    // this build shipped.
    //
    // The original control is only hidden once its stand-in row exists — a lift
    // that fails for any reason leaves the user's entry point exactly where it
    // was. The stand-in carries the source control's own glyph, so no icon has
    // to be known in advance.
    const LIFT_ORDER_BASE = 950;
    // The lift runs outside startPanelManager, so it cannot reach that closure's
    // own nav helpers. These are the same rules, restated at module scope; the
    // manager keeps its copies because they read its `state`.
    function railNav() {
      // Identify the rail by structure, not by any plugin's row: the hook is our
      // own toggle (the only row with `data-dse-ui="toggle"`), which exists for as
      // long as this module runs. Falling back to the shipped "more" trigger then
      // covers the moment before the toggle is built.
      try {
        const ours = document.querySelector('button[data-dse-ui="toggle"]');
        if (ours) {
          const nav = ours.closest('nav');
          if (nav) return nav;
        }
      } catch (e) {}
      try {
        const navs = document.querySelectorAll('nav[class*="panelList"]');
        for (let i = 0; i < navs.length; i++) {
          if (navs[i].querySelector('button[aria-haspopup="menu"]')) return navs[i];
        }
        return navs.length ? navs[0] : null;
      } catch (e) { return null; }
    }
    // The shipped "more" trigger sits inside a Menu wrapper, so the insert anchor
    // has to be the nav-level child that contains it, never the trigger itself.
    function railAnchor(nav) {
      try {
        const trigger = nav.querySelector('button[aria-haspopup]');
        if (!trigger) return null;
        let node = trigger;
        while (node && node.parentElement && node.parentElement !== nav) node = node.parentElement;
        return node && node.parentElement === nav ? node : null;
      } catch (e) { return null; }
    }
    function startFooterLift(ctx) {
      const state = {
        rows: Object.create(null),    // key -> stand-in row
        sources: Object.create(null), // key -> the control the row currently stands in for
        keys: [],                     // keys in creation order
        observer: null,
        raf: 0,
        disposed: false,
        signature: null,
        clicks: 0,      // forwarded clicks, so "clicked but nothing happened" is measurable
        lastClick: '',  // outcome of the most recent forward (see bindRow)
        probe: false    // a synthetic click is travelling; resolve but do not fire the control
      };

      function footerRoot() {
        // The foot is whatever box hosts the `sidebar.footer.action` slot. The
        // slot attribute is the only stable handle: the host's class name carries
        // a build hash (`wtg9ga_footerActions`) and a plugin is free to restyle
        // the container (dsh-m turns it into a full-width column), so looking for
        // a class substring alone silently finds nothing after such a change —
        // and the buttons then sit unstyled in the rail area with no text.
        try {
          const bySlot = document.querySelectorAll('[data-slot="sidebar.footer.action"]');
          for (let i = 0; i < bySlot.length; i++) {
            if (bySlot[i].querySelector('button')) return bySlot[i];
          }
        } catch (e) {}
        try {
          const all = Array.prototype.slice.call(document.querySelectorAll('[class*=footerActions]'));
          for (let i = 0; i < all.length; i++) {
            if (all[i].querySelector('button')) return all[i];
          }
        } catch (e) {}
        // Last resort: the smallest ancestor that holds the footer buttons and
        // nothing else from the rail. Keeps the lift working on a build that
        // renames both the class and the slot attribute.
        try {
          const btns = document.querySelectorAll('[class*=footerActions] button, [data-slot="sidebar.footer.action"] button');
          if (btns.length) return btns[0].parentElement;
        } catch (e) {}
        return null;
      }

      function controls() {
        const root = footerRoot();
        if (!root) return [];
        try {
          return Array.prototype.slice.call(root.querySelectorAll('button')).filter((el) => {
            // Our own stand-ins never live in the foot; guard anyway so a
            // moved node can never make the lift lift itself.
            return !el.hasAttribute('data-dse-lift');
          });
        } catch (e) { return []; }
      }

      function labelOf(btn) {
        const raw = btn.getAttribute('aria-label') || btn.getAttribute('title') || '';
        const text = String(raw).trim();
        if (text) return text;
        const inner = (btn.textContent || '').trim();
        return inner;
      }

      // A stable key per control. The label is the only identity the host gives
      // us, and it is what the user reads in the rail, so it doubles as the key.
      // Two controls may share a label; they are then suffixed by their index
      // among the same-label controls, which keeps the mapping deterministic
      // across re-renders (document order is stable for the foot).
      function keyFor(btn, seen) {
        const label = labelOf(btn);
        if (!label) return '';
        const n = seen[label] || 0;
        seen[label] = n + 1;
        return n === 0 ? label : label + '#' + n;
      }

      // An entry point is not required to have an icon: several plugins render a
      // word (or, in the folded rail, its first letter) instead of an SVG, so a
      // clone of their glyph is legitimately empty. Return a letter tile in that
      // case rather than null — a blank 16×16 box reads as a broken row, not as
      // "this plugin has no icon".
      function glyphOf(btn) {
        try {
          const svg = btn.querySelector('svg');
          if (svg) return svg.cloneNode(true);
          const img = btn.querySelector('img');
          if (img) return img.cloneNode(true);
          const text = String(btn.textContent || btn.getAttribute('title') || '').trim();
          const letter = text ? Array.from(text)[0].toUpperCase() : '?';
          const tile = document.createElement('span');
          tile.className = 'dse-lift-letter';
          tile.setAttribute('aria-hidden', 'true');
          tile.textContent = letter;
          return tile;
        } catch (e) {}
        return null;
      }

      // Labels already spoken for by the shipped rail rows. Two plugins may
      // honestly use the same word for different panels (dshmarket and dsh-m are
      // both 「插件市场」), and the foot is the only place we can learn a plugin's
      // own wording — so the lift has to disambiguate instead of pretending the
      // duplicate is the same row.
      function railLabels(nav) {
        const taken = Object.create(null);
        let buttons = [];
        try { buttons = nav.querySelectorAll('button[class*="panelRow"]'); } catch (e) { return taken; }
        for (let i = 0; i < buttons.length; i++) {
          const el = buttons[i];
          // Our own rows are the thing being named, so they never count as
          // already taken; the toggle is a chevron, not an entry.
          if (el.hasAttribute('data-dse-lift')) continue;
          if (el.getAttribute('data-dse-ui') === 'toggle') continue;
          const text = String(el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
          if (text) taken[text] = true;
        }
        return taken;
      }

      // A namespace hint taken from the control's own classes. Plugin bundles
      // prefix their classes with the plugin name (`dshm-entry`, `dse-…`), so the
      // first token before a dash identifies the owner without this file knowing
      // any plugin by name. Class names are build-hashed in places, hence the
      // shape test rather than a lookup table.
      const GENERIC_CLASS = /^(button|btn|entry|trigger|icon|iconbutton|rail|footer|slot|menu|item|active|wide|narrow)$/i;
      function hintOf(btn) {
        let cls = '';
        try { cls = String(btn.className || ''); } catch (e) {}
        const tokens = cls.split(/\s+/);
        for (let i = 0; i < tokens.length; i++) {
          const head = tokens[i].split('-')[0].replace(/[^A-Za-z0-9]/g, '');
          if (head.length >= 3 && !GENERIC_CLASS.test(head)) return head;
        }
        return '';
      }

      function bindRow(row, key) {
        row.setAttribute('data-dse-lift', key);
        // Cheap, unconditional evidence that a real pointer reached this row.
        // "The click does nothing" has two very different causes — the pointer
        // never arrives (something is stacked over the row, or the row is not
        // where it looks), or it arrives and the click is swallowed downstream —
        // and only a pointerdown marker tells them apart. Never prevented here:
        // the row still has to be draggable and clickable.
        row.addEventListener('pointerdown', (event) => {
          report({
            event: 'lift-row-pointerdown',
            version: VERSION,
            key: key,
            target: String((event.target && event.target.tagName) || ''),
            pointerType: String(event.pointerType || '')
          }, true);
        });
        // Fallback path only. The primary forwarder is the document-level capture
        // handler in handleCapture, which stops propagation before the row is
        // reached — so this listener never runs when that path works, and there is
        // no double-fire. It exists because a click can bypass the capture
        // handler entirely (another capture listener on document that runs first
        // and stops immediate propagation, or a synthetic click dispatched from
        // inside the row's own subtree), and a dead-looking entry is worse than a
        // second chance at forwarding.
        row.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          report({ event: 'lift-row-click', version: VERSION, key: key, via: 'row-listener' }, true);
          const lift = window.__dseFooterLift;
          if (lift && typeof lift.forward === 'function') {
            try { lift.forward(key); } catch (e) {}
          }
        });
      }

      function forward(key) {
        // Forward to the real control rather than re-implementing it: the control
        // owns its own panel, menu or dialog.
        //
        // Resolve the control at click time instead of closing over the node seen
        // first. React re-renders the foot into fresh buttons for the same
        // labels, and a captured node becomes detached — `.click()` on a detached
        // button is a silent no-op, which makes the entry look dead.
        let target = state.sources[key];
        if (!target || target.isConnected === false) {
          target = null;
          try {
            const list = controls();
            for (let i = 0; i < list.length; i++) {
              if (keyFor(list[i], Object.create(null)) === key) { target = list[i]; break; }
            }
          } catch (e) {}
        }
        if (!target) {
          state.lastClick = key + ':no-source';
          report({ event: 'lift-click', version: VERSION, key: key, outcome: 'no-source' }, true);
          return false;
        }
        state.sources[key] = target;
        state.clicks = (state.clicks || 0) + 1;        // A probe answers "would this click reach the control?" without opening
        // anything: the whole path up to the control is exercised, only the final
        // `.click()` is skipped. Useful because the real control's panel is a
        // portal on document.body, so firing it for a test would open a window
        // over the user's workspace.
        if (state.probe) {
          state.lastClick = key + ':probe:' + (target.isConnected === false ? 'detached' : 'live') +
            ':title=' + String(target.getAttribute('title') || '');
          return true;
        }
        try {
          target.click();
          // Record what the control looked like right after the forwarded click:
          // `connected` false means we fired at a detached node (a silent no-op),
          // and `expanded` is the one signal a footer control gives that it
          // actually reacted.
          state.lastClick = key + ':ok:' + (target.isConnected === false ? 'detached' : 'live') +
            ':exit=' + String(target.getAttribute('aria-expanded'));
          // Reported unconditionally: the start-up snapshot is taken 1.5s after
          // load, so a click counter read from it is always zero and cannot tell
          // "never clicked" from "clicked, nothing happened".
          report({
            event: 'lift-click', version: VERSION, key: key, outcome: 'ok',
            live: target.isConnected !== false,
            ariaExpanded: String(target.getAttribute('aria-expanded')),
            targetCls: String(target.className || '').slice(0, 60),
            targetTitle: String(target.getAttribute('title') || '').slice(0, 40)
          }, true);
          // A successful `.click()` only proves the browser dispatched the event;
          // both of these plugins mount their panel as a portal on document.body,
          // so the panel's arrival is observable and is the only proof the entry
          // actually did something. Sampled late enough for React to commit.
          window.setTimeout(() => {
            try {
              const nodes = [];
              Array.prototype.slice.call(document.body.children).forEach((el) => {
                if (!el || !el.tagName || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                const id = String(el.id || '');
                const cls = String((el.className && el.className.baseVal !== undefined) ? el.className.baseVal : (el.className || ''));
                if (!id && !cls) return;
                let box = null;
                try { box = el.getBoundingClientRect(); } catch (e) {}
                nodes.push({
                  tag: el.tagName, id: id.slice(0, 40), cls: cls.slice(0, 60),
                  area: box ? Math.round(box.width) + 'x' + Math.round(box.height) : '?'
                });
              });
              report({ event: 'lift-after', version: VERSION, key: key, bodyKids: nodes.length, nodes: nodes.slice(0, 12) }, true);
            } catch (e) {}
          }, 900);
          return true;
        } catch (e) {
          state.lastClick = key + ':threw:' + String(e && e.message).slice(0, 60);
          report({ event: 'lift-click', version: VERSION, key: key, outcome: 'threw', err: String(e && e.message).slice(0, 80) }, true);
          return false;
        }
      }

      function sync() {
        if (state.disposed) return;
        const nav = (window.__dsePanelManager && window.__dsePanelManager.nav) || railNav();
        if (!nav) return;
        const list = controls();
        const seen = Object.create(null);
        const wanted = Object.create(null);
        const labels = Object.create(null);
        const taken = railLabels(nav);
        const claimed = Object.create(null);
        const sig = [];
        for (let i = 0; i < list.length; i++) {
          const key = keyFor(list[i], seen);
          if (!key) continue;
          const base = labelOf(list[i]) || key;
          wanted[key] = list[i];
          // Keep the plugin's own wording unless it would collide with a row the
          // user already sees, or with another lifted control. Then append the
          // control's class namespace — enough to tell two 插件市场 panels apart
          // without this file naming either plugin.
          let label = base;
          if ((taken[base] || claimed[base]) && hintOf(list[i])) label = base + ' (' + hintOf(list[i]) + ')';
          claimed[label] = true;
          labels[key] = label;
          sig.push(key + '=' + label);
        }
        // This pass is driven by a body-wide observer, so it runs on nearly every
        // render in the app. Skip the DOM work when the set of controls and their
        // place in the rail is unchanged — the expensive part is the reorder, not
        // the scan.
        //
        // "Unchanged" has to include NODE IDENTITY, not just the labels: React
        // re-renders the foot into fresh button elements for the same labels, and
        // a label-only signature then short-circuits here. The rows survive, but
        // the new buttons never receive the `data-dse-lifted` marker — so a click
        // forwards to a node that no longer exists and the entry looks dead.
        const signature = sig.join('\u0001');
        const settledAll = sig.every((key) => {
          const row = state.rows[key];
          const src = state.sources[key];
          return !!row && row.parentNode === nav && src === wanted[key] && src.isConnected !== false;
        });
        if (signature === state.signature && settledAll) return;
        state.signature = signature;
        // Rows whose control is gone must go too, or the rail keeps an icon that
        // does nothing.
        Object.keys(state.rows).forEach((key) => {
          if (wanted[key]) return;
          const row = state.rows[key];
          try { if (row && row.parentNode) row.parentNode.removeChild(row); } catch (e) {}
          delete state.rows[key];
          delete state.sources[key];
        });
        const anchor = railAnchor(nav);
        // Order the shipped rows FIRST: they all migrate to just before the
        // anchor, so inserting the lifted rows afterwards puts them below our
        // own entries instead of above them.
        if (window.__dsePanelManager && typeof window.__dsePanelManager.refresh === 'function') {
          try { window.__dsePanelManager.refresh(false); } catch (e) {}
        }
        const ordered = Object.keys(wanted);
        for (let i = 0; i < ordered.length; i++) {
          const key = ordered[i];
          const btn = wanted[key];
          const label = labels[key] || key;
          let row = state.rows[key];
          // Re-label in place when the disambiguated name changes (a colliding
          // row can appear or disappear at any time), because the row is keyed by
          // the control, not by its text.
          if (row && row.parentNode && row.getAttribute('aria-label') !== label) {
            row.setAttribute('aria-label', label);
            row.setAttribute('title', label);
            // Look for the synthesised label too: a row built from a collapsed
            // prototype has no host title span, so only `.dse-lift-title` exists.
            const rowTitle = row.querySelector('span[class*="panelTitle"], span.dse-lift-title');
            if (rowTitle) rowTitle.textContent = label;
          }
          if (!row || !row.parentNode) {
            // Built, not cloned — see buildLiftRow. No prototype dependency
            // means a lifted entry can appear before the rail has any shipped
            // row of its own.
            row = buildLiftRow(label, glyphOf(btn));
            if (!row) continue;
            row.setAttribute('data-dse-lift', key);
            state.rows[key] = row;
            bindRow(row, key);
          }
          // The stand-in may be rebuilt while the control keeps its identity;
          // rebinding on every pass would stack listeners, so only the first
          // build binds (above) and this block just re-points the shared map the
          // click handler reads.
          row.__dseSource = btn;
          state.sources[key] = btn;
          state.rows[key] = row;
          // Only check that the row is IN the rail, not that it sits exactly at
          // the anchor. Lifted rows now take part in drag ordering
          // (draggableRows includes them), so the orderer may legitimately park
          // one somewhere else. Insisting on the anchor position would undo that
          // move on the next observer tick, and since this pass is driven by a
          // body-wide MutationObserver the two would keep re-triggering each
          // other. Position is the orderer's business; presence is ours.
          if (row.parentNode !== nav) {
            if (anchor) nav.insertBefore(row, anchor);
            else nav.appendChild(row);
          }
          // Hidden only now — the row exists, so the control is reachable.
          btn.setAttribute('data-dse-lifted', key);
        }
        state.keys = ordered;
      }

      function schedule() {
        if (state.disposed || state.raf) return;
        state.raf = window.requestAnimationFrame(() => {
          state.raf = 0;
          sync();
        });
      }

      // The foot is re-rendered by the host (and by any plugin that mounts a
      // footer entry later), so the lift has to follow DOM changes rather than
      // run once. Observe the whole body: the foot itself may not exist yet
      // when this starts.
      try {
        state.observer = new MutationObserver(schedule);
        state.observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) { state.observer = null; }

      // Boot: the foot may appear well after this module runs.
      let tries = 0;
      const boot = window.setInterval(() => {
        tries += 1;
        if (state.disposed || tries > 40) { window.clearInterval(boot); return; }
        if (footerRoot()) {
          window.clearInterval(boot);
          sync();
          // Prove the forwarding path once, at start-up, instead of waiting for
          // the user to report "the entry does nothing". The probe dispatches the
          // same click the pointer would, so a broken link (row not in the
          // document, capture handler not installed, control detached after a
          // re-render) shows up in the log immediately, without opening anything.
          window.setTimeout(() => {
            if (state.disposed) return;
            const keys = Object.keys(state.rows);
            const results = [];
            for (let i = 0; i < keys.length; i++) {
              const r = api.probe(keys[i]);
              results.push({ key: keys[i], ok: r.ok, lastClick: r.lastClick || r.reason || '' });
            }
            try {
              report({ event: 'lift-probe', version: VERSION, results: results }, true);
            } catch (e) {}
          }, 800);
        }
      }, 250);

      const api = {
        destroy: function () {
          state.disposed = true;
          try { window.clearInterval(boot); } catch (e) {}
          try { if (state.observer) state.observer.disconnect(); } catch (e) {}
          state.observer = null;
          // Hand every control back: an uninstalled plugin (or a rebuilt client)
          // must not leave the foot permanently hidden.
          Object.keys(state.rows).forEach((key) => {
            const row = state.rows[key];
            try { if (row && row.parentNode) row.parentNode.removeChild(row); } catch (e) {}
          });
          state.rows = Object.create(null);
          try {
            Array.prototype.slice.call(document.querySelectorAll('[data-dse-lifted]')).forEach((el) => {
              el.removeAttribute('data-dse-lifted');
            });
          } catch (e) {}
        },
        sync: sync,
        // The document capture handler calls this for a click on a stand-in row;
        // it is the single forwarding path (see bindRow / handleCapture).
        forward: forward,
        // Self-test for the forwarding path: dispatch the same click a user's
        // pointer produces, let the real capture handler run, and report whether
        // it resolved a live control. Nothing is opened. Returns a result object
        // so a diagnostic endpoint can call it and answer in one round trip.
        probe: function (key) {
          const row = state.rows[key];
          if (!row) return { ok: false, reason: 'no-row', keys: Object.keys(state.rows) };
          state.probe = true;
          try {
            row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          } catch (e) {
            state.probe = false;
            return { ok: false, reason: 'threw:' + String(e && e.message) };
          }
          state.probe = false;
          const out = state.lastClick;
          return { ok: out.indexOf(':probe:') >= 0 && out.indexOf('detached') < 0, lastClick: out };
        },
        stats: function () {
          const keys = Object.keys(state.rows);
          // Geometry probe: the rows exist and the controls are hidden, so any
          // visual problem is inside the stand-in's own subtree. Report each row
          // and its children with the computed facts that decide visibility and
          // width — that is cheaper than guessing from a screenshot.
          const geom = [];
          for (let i = 0; i < keys.length; i++) {
            const row = state.rows[keys[i]];
            if (!row) continue;
            const info = { key: keys[i], label: row.getAttribute('aria-label') || '', cls: String(row.className || '') };
            try {
              const cs = window.getComputedStyle(row);
              const box = row.getBoundingClientRect();
              info.display = cs.display;
              info.visibility = cs.visibility;
              info.width = Math.round(box.width);
              info.height = Math.round(box.height);
              info.text = String(row.textContent || '').trim().slice(0, 40);
            } catch (e) { info.err = String(e && e.message); }
            info.kids = [];
            try {
              for (let c = 0; c < row.children.length; c++) {
                const kid = row.children[c];
                const kcs = window.getComputedStyle(kid);
                const kbox = kid.getBoundingClientRect();
                info.kids.push({
                  cls: String(kid.className || '').slice(0, 60),
                  display: kcs.display,
                  width: Math.round(kbox.width),
                  height: Math.round(kbox.height),
                  text: String(kid.textContent || '').trim().slice(0, 30),
                  // Whether the glyph cell actually carries artwork: a fixed
                  // 16x16 box reports that size even when it is empty, so the
                  // box metrics alone cannot tell an icon from a blank pill.
                  inner: kid.children.length,
                  innerTags: (function () {
                    const t = [];
                    for (let q = 0; q < kid.children.length; q++) t.push(kid.children[q].tagName);
                    return t.join(',');
                  })()
                });
              }
            } catch (e) {}
            // Which ancestor class matched `[class*=collapsed]`: our own CSS
            // folds the row to an icon cell when any ancestor carries it, and a
            // host-level class would silently collapse a rail the user believes
            // is expanded.
            try {
              const hits = [];
              let node = row.parentNode;
              while (node && node.nodeType === 1) {
                const c = String(node.className || '');
                if (c.indexOf('collapsed') >= 0) hits.push(c.slice(0, 80));
                node = node.parentNode;
              }
              info.collapsedAnc = hits;
            } catch (e) {}
            // What is actually on top of this row. A row can be laid out
            // perfectly and still be dead: any element stacked over it (a
            // plugin's leftover portal, a transparent overlay, a sticky header)
            // eats both the long press and the click, and no amount of
            // listener debugging on the row itself will show it. Asking the
            // document what it would hit at the row's centre is the only
            // direct way to see that.
            try {
              const b = row.getBoundingClientRect();
              const cx = Math.round(b.left + b.width / 2);
              const cy = Math.round(b.top + b.height / 2);
              const hit = document.elementFromPoint(cx, cy);
              info.hit = hit ? {
                tag: hit.tagName,
                cls: String(hit.className && hit.className.baseVal !== undefined ? hit.className.baseVal : (hit.className || '')).slice(0, 60),
                mine: row === hit || row.contains(hit),
                id: hit.id || ''
              } : null;
              if (hit && !(row === hit || row.contains(hit))) {
                info.hitPath = [];
                let n = hit;
                let depth = 0;
                while (n && n.nodeType === 1 && depth < 6) {
                  info.hitPath.push(n.tagName + '.' + String(n.className && n.className.baseVal !== undefined ? n.className.baseVal : (n.className || '')).slice(0, 40));
                  n = n.parentNode;
                  depth += 1;
                }
              }
            } catch (e) { info.hitErr = String(e && e.message); }
            geom.push(info);
          }
          return {
            keys: keys,
            rows: keys.length,
            controls: controls().length,
            clicks: state.clicks,
            lastClick: state.lastClick,
            hidden: Array.prototype.slice.call(document.querySelectorAll('[data-dse-lifted]')).length,
            // How many clicks the document capture handler saw at all. Zero here
            // means the click never reached us (upstream swallow / no click
            // generated), which no amount of inspecting the rows can reveal.
            clickStats: (function () {
              try {
                const s = window.__dseClickStats;
                return s ? { seen: s.seen || 0, down: s.down || 0, last: s.last || '', downLast: s.downLast || '', ageMs: s.at ? (Date.now() - s.at) : -1 } : null;
              } catch (e) { return 'threw:' + (e && e.message); }
            })(),
            geom: geom,
            // Ground truth for the fold: measure a row the host drew itself. If
            // it is also a 36px icon cell the rail really is folded and our rows
            // match it; if it is wide, something folded only ours.
            shipped: (function () {
              try {
                const nav = (window.__dsePanelManager && window.__dsePanelManager.nav) || null;
                if (!nav) return null;
                const rows = nav.querySelectorAll('button[class*="panelRow"]');
                for (let i = 0; i < rows.length; i++) {
                  const el = rows[i];
                  if (el.hasAttribute('data-dse-ui') || el.hasAttribute('data-dse-lift')) continue;
                  const b = el.getBoundingClientRect();
                  // The stroke and colours a shipped glyph really uses, so the
                  // letter badge can copy them instead of guessing a black.
                  const svg = el.querySelector('span[class*="panelGlyph"] svg');
                  const cs = svg ? window.getComputedStyle(svg) : null;
                  const glyphCs = svg && svg.parentElement ? window.getComputedStyle(svg.parentElement) : null;
                  return {
                    label: el.getAttribute('aria-label') || '',
                    width: Math.round(b.width),
                    height: Math.round(b.height),
                    titleShown: !!el.querySelector('span[class*="panelTitle"]'),
                    svgW: svg ? svg.getAttribute('width') : null,
                    svgH: svg ? svg.getAttribute('height') : null,
                    viewBox: svg ? svg.getAttribute('viewBox') : null,
                    stroke: svg ? svg.getAttribute('stroke') : null,
                    strokeWidth: svg ? svg.getAttribute('stroke-width') : null,
                    svgColor: cs ? cs.color : null,
                    glyphColor: glyphCs ? glyphCs.color : null
                  };
                }
              } catch (e) { return 'threw:' + (e && e.message); }
              return null;
            })()
          };
        }
      };
      // The boot timer below runs the start-up probe, so it must come after the
      // object exists. The interval is created before the return so destroy() can
      // always clear it.
      return api;
    }

    // The Host reorders its own Session rows, and its gesture is not ours to
    // replace: the rows carry a live React handler that writes the Host's view
    // store, and a second gesture on the same rows would fight it. Only the
    // landing is ours — sample where each row sits, notice when the Host's
    // commit has rearranged them, and slide them from the old spot to the new
    // one. The speed stays the Host's; only the arrival becomes smooth.
    //
    // Two lessons are baked in here. The list is not a stable node (React
    // replaces the wrapper around the rows), so the observer watches body and
    // decides by row-order signature instead of by target. And the sampled
    // positions must survive a re-render, so they are keyed by data-row-key
    // rather than held as node references.
    // The conversation View tab row belongs to the Host: it derives which tabs
    // exist from `conversation.view` registrations, keeps their order in a
    // snapshot store this module cannot reach, and slices the list by row width
    // so surplus tabs live in the "more" menu. Its row is a plain flex container
    // though, and React never writes `order` — so reordering through that
    // property is a visual edit that cannot be undone by the next render, and it
    // leaves the Host's own idea of the order untouched.
    function startViewTabDrag(ctx) {
      const ROW_SEL = 'div[data-conversation-tabs]';
      const TAB_SEL = 'button[role="tab"]';
      const LABEL_SEL = 'span[class*="tabLabel"]';
      const STORE_KEY = 'dsh.sidebar-entries.viewtab.v1';
      const THRESHOLD = 6;
      const state = {
        disposed: false,
        observer: null,
        press: null,
        dragging: false,
        liftEl: null,
        order: [],
        // Where across the tab the pointer grabbed it, and the baseline height
        // the tab sits on. It is held by that horizontal point and keeps that
        // height for the whole gesture; see `pinLift`.
        grabDx: 0,
        anchorY: 0,
        followDx: 0,
        followDy: 0,
        // The FLIP animation each tab is currently running. A re-order that
        // lands mid-flight has to cancel its predecessor: two animations on the
        // same property compose instead of replacing, and the tab ends up
        // somewhere neither of them intended.
        anims: new Map(),
        // Frozen for the length of one gesture: the slot boxes measured at rest,
        // and the slot index the pressed tab started in.
        slots: [],
        homeSlot: -1,
        drags: 0,
        swaps: 0,
        saves: 0,
        lastError: ''
      };
      let swallow = false;
      let syncTimer = 0;

      function row() {
        try { return document.querySelector(ROW_SEL); } catch (e) { return null; }
      }
      function tabs(rowEl) {
        if (!rowEl) return [];
        try { return Array.prototype.slice.call(rowEl.querySelectorAll(TAB_SEL)); } catch (e) { return []; }
      }
      function labelOf(el) {
        try {
          const span = el.querySelector(LABEL_SEL);
          const text = span ? span.textContent : el.textContent;
          return String(text == null ? '' : text).trim();
        } catch (e) { return ''; }
      }
      // The Host gives these buttons no id attribute, so the label is the only
      // identity the DOM exposes. Labels are not unique though: two different
      // Views can both be titled "上下文", and keying on the text alone made them
      // overwrite each other's slot. Suffixing repeats keeps the key stable for
      // as long as the row is composed the same way.
      function keysOf(list) {
        const seen = Object.create(null);
        const out = [];
        for (let i = 0; i < list.length; i++) {
          const text = labelOf(list[i]);
          seen[text] = (seen[text] || 0) + 1;
          out.push(seen[text] > 1 ? text + '#' + seen[text] : text);
        }
        return out;
      }
      function readStore() {
        try {
          const raw = window.localStorage.getItem(STORE_KEY);
          if (!raw) return [];
          const list = JSON.parse(raw);
          return Array.isArray(list) ? list.filter(function (x) { return typeof x === 'string' && x; }) : [];
        } catch (e) {
          state.lastError = 'read:' + (e && e.message);
          return [];
        }
      }
      function writeStore(list) {
        try { window.localStorage.setItem(STORE_KEY, JSON.stringify(list)); }
        catch (e) { state.lastError = 'write:' + (e && e.message); }
      }
      function visualList(rowEl) {
        const list = tabs(rowEl);
        const items = list.map(function (el) {
          const box = el.getBoundingClientRect();
          return { el: el, left: box.left, top: box.top, width: box.width, height: box.height };
        });
        // Reading order, not DOM order: once `order` is applied the two differ,
        // and the gesture has to reason about where things appear.
        items.sort(function (a, b) {
          if (Math.abs(a.top - b.top) > 1) return a.top - b.top;
          return a.left - b.left;
        });
        return items;
      }
      // Where each tab sits while nothing is moving.
      //
      // A tab's rectangle is useless for hit-testing during the gesture: the
      // reorder animates it, so the rectangle the pointer is compared against is
      // the one it is travelling away from, not the one it now owns. Feeding that
      // back in flips the target on the next pointer event and the two trade
      // places forever — the row shakes instead of settling.
      //
      // So the slots are measured once, with the gesture at rest, and only ever
      // compared against those frozen boxes. Slots never move during a drag: what
      // moves is which tab occupies each one.
      function measureSlots(rowEl) {
        const items = visualList(rowEl);
        if (items.length === 0) return [];
        return items.map(function (it) {
          return { left: it.left, top: it.top, width: it.width, height: it.height };
        });
      }
      // Writes the sequence onto the row and animates the difference. Measuring
      // before the write and again after it is the whole of FLIP, and it is safe
      // here precisely because the Host's layout is the only thing that moves.
      function commitSeq(seq, animate) {
        const rowEl = row();
        if (!rowEl) return;
        const list = tabs(rowEl);
        if (list.length === 0) return;
        const keys = keysOf(list);
        const byKey = Object.create(null);
        for (let i = 0; i < list.length; i++) byKey[keys[i]] = list[i];
        const before = new Map();
        if (animate !== false) {
          for (let i = 0; i < list.length; i++) before.set(list[i], list[i].getBoundingClientRect());
        }
        for (let i = 0; i < seq.length; i++) {
          const el = byKey[seq[i]];
          if (el) { try { el.style.order = String(i); } catch (e) {} }
        }
        // `order` defaults to 0, so every child that is not a tab — the "more"
        // menu's anchor sits in this same flex row — would otherwise sort level
        // with the first tab and land between the first two of them. Pinning
        // those children past the end keeps the overflow control at the tail
        // where the Host draws it.
        try {
          const kids = rowEl.children;
          for (let i = 0; i < kids.length; i++) {
            if (kids[i].matches && kids[i].matches(TAB_SEL)) continue;
            kids[i].style.order = String(seq.length + 10);
          }
        } catch (e) { state.lastError = 'tail:' + (e && e.message); }
        state.order = seq.slice();
        if (animate === false) return;
        for (let i = 0; i < list.length; i++) {
          const el = list[i];
          // The tab in the hand never runs FLIP: its transform belongs to the
          // pointer follow, and a second animation writing the same property
          // would fight it for the whole gesture.
          if (state.dragging && el === state.liftEl) continue;
          const from = before.get(el);
          if (!from) continue;
          const now = el.getBoundingClientRect();
          const dx = from.left - now.left;
          const dy = from.top - now.top;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
          // A re-order can land while the previous one is still travelling.
          // Without this the two animations compose and the tab overshoots.
          const prev = state.anims.get(el);
          if (prev) { try { prev.cancel(); } catch (e) {} }
          try {
            const anim = el.animate(
              [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
              { duration: MOVE_MS, easing: MOVE_EASE, fill: 'none' }
            );
            state.anims.set(el, anim);
          } catch (e) { state.lastError = 'flip:' + (e && e.message); }
        }
      }
      // Keeps the tab in the hand at the point across it that was grabbed, and
      // on the line it was picked up from.
      //
      // Y is pinned, not followed. The strip runs horizontally, so the tab
      // holds the height it was grabbed at and only travels along the row; the
      // other tabs flow sideways beneath it. That is the same rule the sidebar
      // follows, with the axes the other way round: there the list runs
      // vertically, so the card keeps its `left` and only its `top` chases the
      // pointer.
      //
      // The tab stays in the flex flow so it keeps occupying a real slot, and
      // the difference between where the flow puts it and where it should
      // appear is expressed as a transform. When a swap re-lays it into another
      // slot, the base jumps and the compensation jumps back by the same
      // amount, so nothing moves on screen: the row reorders underneath a tab
      // that stays put.
      //
      // Applied with no transition on purpose. Smoothing this one would animate
      // the compensation too, and the tab would visibly slide away from where
      // it was grabbed every time a swap landed.
      function pinLift(x) {
        if (!state.dragging || !state.liftEl) return;
        const el = state.liftEl;
        const box = el.getBoundingClientRect();
        const baseLeft = box.left - state.followDx;
        const baseTop = box.top - state.followDy;
        const wantX = x - state.grabDx - baseLeft;
        const wantY = state.anchorY - baseTop;
        if (Math.abs(wantX - state.followDx) < 0.5 && Math.abs(wantY - state.followDy) < 0.5) return;
        state.followDx = wantX;
        state.followDy = wantY;
        try { el.style.transform = 'translate(' + wantX + 'px,' + wantY + 'px)'; } catch (e) {}
      }
      // `from` and `to` are slot indices, not tab indices. Swapping the tab that
      // currently occupies `from` onto slot `to` is a move, not a chain of shifts,
      // so the sequence is spliced the same way a real list reorder is.
      //
      // The commit stays animated while dragging. Hit-testing runs entirely on
      // the frozen slot boxes, so a tween can no longer feed back into the
      // decision it came from — the reason the animation had to be switched off
      // during a drag is gone, and with it the snap that made the row feel hard.
      function swap(from, to) {
        const seq = state.order.slice();
        if (from < 0 || to < 0 || from >= seq.length || to >= seq.length) return;
        if (from === to) return;
        const moved = seq.splice(from, 1)[0];
        seq.splice(to, 0, moved);
        commitSeq(seq, true);
        state.swaps++;
      }
      function indexAt(items, x, y) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (x >= it.left && x <= it.left + it.width && y >= it.top && y <= it.top + it.height) return i;
        }
        // Outside every tab (the gap between them, or the row's empty tail):
        // fall back to the nearest centre, weighting the vertical gap double so
        // a wrapped row does not steal the pick from the line the pointer is on.
        let best = -1;
        let bestDist = Infinity;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const cxp = it.left + it.width / 2;
          const cyp = it.top + it.height / 2;
          const dist = Math.abs(x - cxp) + Math.abs(y - cyp) * 2;
          if (dist < bestDist) { bestDist = dist; best = i; }
        }
        return best;
      }
      function beginDrag(press, event) {
        state.dragging = true;
        state.drags++;
        state.liftEl = press.el;
        try { press.el.classList.add('dse-vtab-lift'); } catch (e) {}
        try { document.body.style.userSelect = 'none'; } catch (e) {}
        // The first swap splices this sequence, so it has to describe the row as
        // it is right now — before any `order` value has been rewritten.
        //
        // Keys are always minted in DOM order, because that is the order
        // `commitSeq` mints them in; the visual sequence is then only a
        // permutation of those keys. Minting them in visual order instead would
        // hand the same label's suffix to a different element once the two have
        // traded places, and the next commit would move the wrong tab.
        const rowEl = row();
        const list = tabs(rowEl);
        const keys = keysOf(list);
        const keyOf = new Map();
        for (let i = 0; i < list.length; i++) keyOf.set(list[i], keys[i]);
        const items = visualList(rowEl);
        state.order = items.map(function (x) { return keyOf.get(x.el) || ''; })
          .filter(function (k) { return k; });
        // Freeze the geography for the whole gesture. Everything after this
        // compares the pointer against these boxes and nothing else, so an
        // animation in flight can never redirect the decision it came from.
        state.slots = measureSlots(rowEl);
        // The slot the pressed tab sits in, resolved once while it is still at
        // rest: after the first swap its element is travelling and its rectangle
        // stops marking a slot.
        state.homeSlot = state.order.indexOf(keyOf.get(press.el) || '');
        // Measured once at rest: how far across the tab the pointer landed, and
        // the line the tab sits on. The tab is held by that horizontal point
        // from here on, so it does not jump so its own left edge meets the
        // cursor, and it keeps that line instead of drifting off the row.
        const box = press.el.getBoundingClientRect();
        state.grabDx = press.x - box.left;
        state.anchorY = box.top;
        state.followDx = 0;
        state.followDy = 0;
        report({ event: 'vt-start', n: items.length, labels: state.order, slots: state.slots.length, home: state.homeSlot }, false);
      }
      function endDrag(persist) {
        const wasDragging = state.dragging;
        const lifted = state.liftEl;
        const leftoverX = state.followDx;
        const leftoverY = state.followDy;
        state.dragging = false;
        state.press = null;
        state.slots = [];
        state.homeSlot = -1;
        state.grabDx = 0;
        state.anchorY = 0;
        state.followDx = 0;
        state.followDy = 0;
        if (lifted) {
          try { lifted.classList.remove('dse-vtab-lift'); } catch (e) {}
          // The tab is left wherever the pointer held it, which is almost never
          // exactly on its slot. Ease it home over the same 180ms the rest of
          // the list uses, then drop the inline transform so the element goes
          // back to being an ordinary flex item — otherwise a stale translate
          // would keep it offset through every later render.
          if (Math.abs(leftoverX) > 1 || Math.abs(leftoverY) > 1) {
            try {
              const anim = lifted.animate(
                [{ transform: 'translate(' + leftoverX + 'px,' + leftoverY + 'px)' }, { transform: 'translate(0,0)' }],
                { duration: MOVE_MS, easing: MOVE_EASE, fill: 'none' }
              );
              anim.onfinish = function () { try { lifted.style.transform = ''; } catch (e) {} };
              anim.oncancel = function () { try { lifted.style.transform = ''; } catch (e) {} };
            } catch (e) {
              try { lifted.style.transform = ''; } catch (e2) {}
            }
          } else {
            try { lifted.style.transform = ''; } catch (e) {}
          }
        }
        state.liftEl = null;
        try { document.body.style.userSelect = ''; } catch (e) {}
        if (!wasDragging) return;
        // A drag that ended where it started is a click the user meant to make.
        if (persist && state.order.length > 1 && state.swaps > 0) {
          writeStore(state.order);
          state.saves++;
          report({ event: 'vt-save', order: state.order }, false);
        }
        if (state.swaps > 0) {
          swallow = true;
          window.setTimeout(function () { swallow = false; }, 400);
        }
        state.swaps = 0;
      }
      function onPointerDown(event) {
        if (state.disposed || event.button !== 0) return;
        const rowEl = row();
        if (!rowEl) return;
        const btn = event.target && event.target.closest ? event.target.closest(TAB_SEL) : null;
        if (!btn || !rowEl.contains(btn)) return;
        if (tabs(rowEl).length < 2) return;
        state.press = { el: btn, x: event.clientX, y: event.clientY };
      }
      function onPointerMove(event) {
        if (state.disposed) return;
        const press = state.press;
        if (!press) return;
        if (!state.dragging) {
          const dx = Math.abs(event.clientX - press.x);
          const dy = Math.abs(event.clientY - press.y);
          if (dx <= THRESHOLD && dy <= THRESHOLD) return;
          beginDrag(press, event);
        }
        // Follow first, reorder second. The tab tracks the pointer even while
        // it sits in the slot it started in, so the gesture reads as picking
        // something up rather than as a row that suddenly rearranges itself.
        pinLift(event.clientX);
        const slots = state.slots;
        if (!slots || slots.length < 2) return;
        const at = indexAt(slots, event.clientX, event.clientY);
        if (at < 0) return;
        // Which slot the dragged tab currently occupies. Tracked as state rather
        // than re-derived from a rectangle, because the tab is mid-animation and
        // its box is somewhere between the two slots it is travelling between.
        const from = state.homeSlot;
        if (from < 0 || from === at) return;
        // Exactly one splice per move. Swapping twice per pointermove is not a
        // harmless duplicate: the second splice applies the same from/to to the
        // arrangement the first one just produced, so the tab lands somewhere
        // else again — the row flips back and forth on every single pixel of
        // travel, which is what "shaking" looks like.
        swap(from, at);
        state.homeSlot = at;
        // The swap re-laid the tab into its new slot, so the compensation just
        // computed is one slot out of date. Re-pin against the new layout, or
        // the tab would jump by exactly one slot at the moment the row
        // rearranges — the one instant it must look like nothing moved.
        pinLift(event.clientX);
      }
      function onPointerUp() { endDrag(true); }
      function onPointerCancel() { endDrag(false); }
      function onClickCapture(event) {
        if (!swallow) return;
        swallow = false;
        event.preventDefault();
        event.stopPropagation();
      }
      // Stored labels come first in the order the user arranged them; tabs the
      // store has never seen follow in Host order, so a newly installed plugin's
      // View lands at the end instead of splitting a layout that was deliberate.
      function syncNow() {
        if (state.disposed) return;
        // The observer this runs from fires on every DOM change anywhere in the
        // body — a streaming reply is enough. Re-deriving the order mid-gesture
        // would overwrite the sequence the drag is splicing, so the gesture owns
        // it until the pointer comes up.
        if (state.dragging) return;
        const rowEl = row();
        if (!rowEl) return;
        const list = tabs(rowEl);
        if (list.length < 2) return;
        const saved = readStore();
        if (saved.length === 0) {
          state.order = keysOf(list);
          return;
        }
        const present = keysOf(list);
        const known = saved.filter(function (key) { return present.indexOf(key) >= 0; });
        const rest = present.filter(function (key) { return known.indexOf(key) < 0; });
        const seq = known.concat(rest);
        if (seq.length !== present.length) return;
        let same = state.order.length === seq.length;
        if (same) {
          for (let i = 0; i < seq.length; i++) {
            if (state.order[i] !== seq[i]) { same = false; break; }
          }
        }
        if (same) return;
        commitSeq(seq);
      }
      function scheduleSync() {
        if (state.disposed || syncTimer) return;
        syncTimer = window.setTimeout(function () {
          syncTimer = 0;
          try { syncNow(); } catch (e) { state.lastError = 'sync:' + (e && e.message); }
        }, 80);
      }
      function scrubStyle() {
        try {
          const old = document.getElementById('dse-vtab-style');
          if (old && old.parentElement) old.parentElement.removeChild(old);
        } catch (e) {}
      }
      function ensureStyle() {
        scrubStyle();
        try {
          const style = document.createElement('style');
          style.id = 'dse-vtab-style';
          style.textContent =
            '.dse-vtab-lift{position:relative;z-index:6;cursor:grabbing;opacity:' + LIFT_OPACITY +
            ';border-radius:6px;background:' + LIFT_FILL + ';box-shadow:' + LIFT_SHADOW + '}' +
            '.dse-vtab-lift *{pointer-events:none}';
          (document.head || document.documentElement).appendChild(style);
        } catch (e) { state.lastError = 'style:' + (e && e.message); }
      }

      ensureStyle();
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('pointermove', onPointerMove, true);
      document.addEventListener('pointerup', onPointerUp, true);
      document.addEventListener('pointercancel', onPointerCancel, true);
      document.addEventListener('click', onClickCapture, true);
      try {
        state.observer = new MutationObserver(scheduleSync);
        state.observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) { state.lastError = 'observe:' + (e && e.message); }
      scheduleSync();

      // The gesture path, driven by synthetic pointer events, kept as a callable
      // rather than an automatic run: it proves the threshold, the slot pick, the
      // `order` write and the store write all work, and it restores the row when
      // it is done. Automatic execution would flash the toolbar on every reload,
      // which is worse than having to ask for it.
      function selfTest() {
        const rowEl = row();
        const list = tabs(rowEl);
        if (list.length < 2) {
          report({ event: 'vt-selftest', ok: false, why: 'too-few-tabs' }, true);
          return false;
        }
        const original = keysOf(list);
        const rects = Array.prototype.map.call(list, function (el) {
          const b = el.getBoundingClientRect();
          return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        });
        const fire = function (el, type, x, y) {
          el.dispatchEvent(new PointerEvent(type, {
            bubbles: true, cancelable: true, composed: true,
            button: 0, buttons: type === 'pointerup' ? 0 : 1,
            pointerId: 1, pointerType: 'mouse', isPrimary: true,
            clientX: x, clientY: y
          }));
        };
        // One gesture that crosses a slot back and forth several times — the
        // motion that made the row shake. Each pass parks a little past the
        // midpoint of the neighbour, so a threshold that reads a rectangle the
        // running animation is still carrying would flip the answer every time.
        fire(list[0], 'pointerdown', rects[0].x, rects[0].y);
        fire(list[0], 'pointermove', rects[0].x + 20, rects[0].y);
        const passes = [];
        for (let pass = 0; pass < 4; pass++) {
          fire(list[1], 'pointermove', rects[1].x, rects[1].y);
          passes.push(state.order.slice());
          fire(list[0], 'pointermove', rects[0].x, rects[0].y);
          passes.push(state.order.slice());
        }
        // Park the gesture on the neighbour before releasing, and read the
        // arrangement while it is still moved: a test that has already put
        // itself back cannot tell a real commit from a no-op.
        fire(list[1], 'pointermove', rects[1].x, rects[1].y);
        passes.push(state.order.slice());
        fire(list[1], 'pointerup', rects[1].x, rects[1].y);
        // `flips` compares samples taken at the same pointer position two moves
        // apart. Both are "parked on the neighbour", so a stable implementation
        // returns the identical sequence twice; one that reorders twice per move
        // (or that re-measures a moving rectangle) alternates between two
        // arrangements and scores a flip on every pass.
        let flips = 0;
        for (let i = 2; i < passes.length; i++) {
          if (passes[i].join('\u0001') !== passes[i - 2].join('\u0001')) flips++;
        }
        const domAfter = tabs(row()).map(function (el) { return String(el.style.order || ''); });
        const storedAfter = readStore();
        const drags = state.drags;
        const moved = domAfter.some(function (v, i) { return v !== String(i); });
        // Put it back: the point is to prove the gesture works, not to rearrange
        // anyone's toolbar behind their back.
        state.order = original;
        commitSeq(original);
        writeStore(original);
        // The visual reading order can only be trusted once the FLIP has finished:
        // measuring mid-flight reports the position each element animates *from*,
        // which is the old arrangement by definition.
        window.setTimeout(function () {
          try {
            report({
              event: 'vt-selftest',
              ok: moved && drags > 0 && storedAfter.length === original.length && flips === 0,
              keys: original,
              domAfter: domAfter,
              storedAfter: storedAfter,
              drags: drags,
              flips: flips,
              passes: passes.length,
              settled: visualList(row()).map(function (x) { return labelOf(x.el); })
            }, true);
          } catch (e) {
            report({ event: 'vt-selftest', ok: false, why: 'settle:' + String(e && e.message) }, true);
          }
        }, MOVE_MS + 140);
        return true;
      }

      return {
        stats: function () {
          const rowEl = row();
          const list = tabs(rowEl);
          return {
            row: !!rowEl,
            tabs: list.length,
            labels: list.map(labelOf),
            keys: keysOf(list),
            order: state.order.slice(),
            // The applied `order` values, read back from the DOM: this is the
            // only field that proves a commit actually reached the elements
            // rather than just the array this module keeps.
            dom: list.map(function (el) { return String(el.style.order || ''); }),
            stored: readStore(),
            drags: state.drags,
            saves: state.saves,
            dragging: state.dragging,
            lastError: state.lastError
          };
        },
        reset: function () {
          writeStore([]);
          const list = tabs(row());
          for (let i = 0; i < list.length; i++) {
            try { list[i].style.order = ''; } catch (e) {}
          }
          state.order = [];
        },
        selfTest: selfTest,
        destroy: function () {
          state.disposed = true;
          try { document.removeEventListener('pointerdown', onPointerDown, true); } catch (e) {}
          try { document.removeEventListener('pointermove', onPointerMove, true); } catch (e) {}
          try { document.removeEventListener('pointerup', onPointerUp, true); } catch (e) {}
          try { document.removeEventListener('pointercancel', onPointerCancel, true); } catch (e) {}
          try { document.removeEventListener('click', onClickCapture, true); } catch (e) {}
          try { if (state.observer) state.observer.disconnect(); } catch (e) {}
          state.observer = null;
          if (syncTimer) { try { window.clearTimeout(syncTimer); } catch (e) {} syncTimer = 0; }
          endDrag(false);
          scrubStyle();
          // The inline `order` values outlive the module unless they are washed
          // off here; a re-applied module would otherwise inherit an arrangement
          // nobody is animating any more.
          const list = tabs(row());
          for (let i = 0; i < list.length; i++) {
            try { list[i].style.order = ''; } catch (e) {}
          }
        }
      };
    }

    // Archived Sessions are frozen by the Host: the shipped row computes
    // `draggable = drag !== undefined && !row.blank && !row.archived`, so an
    // archived row never fires dragstart at all, and the manual order keeps its
    // saved slot — which leaves archives interleaved with the live rows forever.
    //
    // This pass does not touch that saved order. It only decides where the
    // archived wrappers are PAINTED: inside each container the archived rows
    // sink below the live ones and sort newest-first among themselves.
    //
    // Two mechanics matter. The containers are block boxes, so `order` alone
    // would do nothing — each touched container is flipped to a column flex box
    // first. And only `order` is written, never the DOM order: React owns these
    // children and would fight a physical move on its next render, whereas it
    // never writes `order` and so leaves the arrangement alone.
function apply(ctx) {
      ctxRef = ctx;
      // Style injection is best-effort: a `<style>` that cannot be attached
      // costs the module its looks, but not its mount.
      try { ensureCss(); } catch (e) {}
      // Even reading `ctx.slots` is wrapped. In a host that is itself unwell,
      // a property read can throw, and an unmountable module leaves the user
      // with no way back in except disabling every plugin.
      let slots = null;
      try { slots = ctx.slots; } catch (e) { slots = null; }
      if (!slots) return;
      // `ctx.effect` itself is reached through a guarded read. A host that is
      // already unwell can throw on the property access, and one throw here
      // unmounts the module — which the user can only escape by disabling
      // every plugin, so nothing in `apply()` is allowed to escape.
      const safeEffect = (fn, label) => {
        try { ctx.effect(fn, label); } catch (e) {}
      };
      safeEffect(() => {
        // Created here, not at module scope: a hot reload re-runs apply() and the
        // counters must belong to the live generation only.
        try { window.__dseClickStats = { seen: 0, last: '', at: 0, down: 0, downLast: '' }; } catch (e) {}
        // Pointerdown is counted separately because a click can be suppressed
        // while the press still arrives: a drag threshold, a pointer capture, or
        // a stray `preventDefault` on pointerdown all leave the press visible and
        // the click missing. Comparing the two counters names the culprit.
        const onDown = (event) => {
          try {
            const s = window.__dseClickStats;
            if (!s) return;
            s.down = (s.down || 0) + 1;
            const btn = event.target && event.target.closest ? event.target.closest('button') : null;
            const lift = btn ? String(btn.getAttribute('data-dse-lift') || '') : '';
            s.downLast = lift || String((event.target && event.target.tagName) || '');
            // Only a press on one of OUR rows can be a broken entry; everything
            // else in the app is none of this module's business.
            s.downLift = lift;
          } catch (e) {}
        };
        document.addEventListener('pointerdown', onDown, true);
        document.addEventListener('click', handleCapture, true);
        // Report only the anomaly, not every click: a press on one of our rows
        // that produced no click within a second is the exact failure this
        // instrumentation exists to catch. Reporting the healthy path too would
        // bury it in noise from every click anywhere in the app.
        let armedAt = 0;
        let armedKey = '';
        let armedDown = -1;
        let armedSeen = -1;
        const watch = window.setInterval(() => {
          try {
            const s = window.__dseClickStats;
            if (!s) return;
            // A press on a lift row starts a deadline.
            if (s.down !== armedDown) {
              armedDown = s.down;
              if (s.downLift) {
                armedAt = Date.now();
                armedKey = String(s.downLift).slice(0, 40);
                armedSeen = s.seen;
              }
            }
            if (!armedAt || Date.now() - armedAt < 1000) return;
            // Deadline passed: did any click arrive since the press?
            if (s.seen > armedSeen) { armedAt = 0; return; }
            report({
              event: 'lift-no-click', version: VERSION, key: armedKey,
              seen: s.seen || 0, down: s.down || 0,
              last: String(s.last || '').slice(0, 40)
            }, true);
            armedAt = 0;
          } catch (e) {}
        }, 500);
        return () => {
          window.clearInterval(watch);
          document.removeEventListener('pointerdown', onDown, true);
          document.removeEventListener('click', handleCapture, true);
        };
      }, 'dsh-sidebar-entries: click proxy');
      // Nothing is registered into the rail here. Every row the user sees is
      // either the host's own or a stand-in produced by the footer lift, so this
      // plugin contributes no icon of its own — uninstall another plugin and its
      // icon goes with it, because the icon was never ours to begin with.
      try {
        slots.inject('main', () => slots.register({ name: 'main', key: 'dse-panel' }, fallbackCard('插件面板', function () {
          const first = document.querySelector('button[class*=panelRow]:not([data-dse-ui="toggle"])');
          if (first) { try { first.click(); } catch (e) {} }
        })));
      } catch (e) {}      // A rebuilt client module re-runs apply(); tear the previous manager down first.
      try { if (window.__dsePanelManager && window.__dsePanelManager.destroy) window.__dsePanelManager.destroy(); } catch (e) {}
      window.__dsePanelManager = null;
      safeEffect(() => {
        // Every boot entry is wrapped. An enhancement that throws during
        // `apply()` takes the whole client module down with it, and the only
        // way out of that is disabling the plugin — the failure the user sees
        // as "DSH won't open until I turn everything off". A dead feature is
        // recoverable; an unmountable module is not.
        let manager = null;
        try { manager = startPanelManager(ctx); } catch (e) { manager = null; }
        window.__dsePanelManager = manager;
        return () => {
          try { if (manager && manager.destroy) manager.destroy(); } catch (e) {}
          if (window.__dsePanelManager === manager) window.__dsePanelManager = null;
        };
      }, 'dsh-sidebar-entries: panel manager');
      // The two list caps are shares of the rail, but a share would cut the
      // last row in half; this converts them into whole rows. It watches the
      // rail, so collapsing the sidebar or dragging its edge re-derives them.
      try { if (window.__dseCaps && window.__dseCaps.destroy) window.__dseCaps.destroy(); } catch (e) {}
      window.__dseCaps = null;
      safeEffect(() => {
        let caps = null;
        try { caps = startCapSync(ctx); } catch (e) { caps = null; }
        window.__dseCaps = caps;
        return () => {
          try { if (caps && caps.destroy) caps.destroy(); } catch (e) {}
          if (window.__dseCaps === caps) window.__dseCaps = null;
        };
      }, 'dsh-sidebar-entries: integer row caps');
      // The View tab row is drawn by the Host from `conversation.view`
      // registrations, and its order lives in a store this module cannot reach.
      // Reordering through the flex `order` property keeps that store intact
      // while still giving the row the same FLIP landing as the rail.
      try { if (window.__dseViewTabs && window.__dseViewTabs.destroy) window.__dseViewTabs.destroy(); } catch (e) {}
      window.__dseViewTabs = null;
      safeEffect(() => {
        let tabs = null;
        try { tabs = startViewTabDrag(ctx); } catch (e) { tabs = null; }
        window.__dseViewTabs = tabs;
        // `selfTest` stays reachable on the exported handle for a manual run,
        // but it is deliberately not called on boot: it walks the row through a
        // real swap and back, so an automatic call would flick the toolbar on
        // every reload — a visible defect traded for an invisible reassurance.
        return () => {
          try { if (tabs && tabs.destroy) tabs.destroy(); } catch (e) {}
          if (window.__dseViewTabs === tabs) window.__dseViewTabs = null;
        };
      }, 'dsh-sidebar-entries: view tab drag');
      // Archived rows cannot be dragged (the shipped row never even attaches
      // `draggable`), so sinking them to the bottom of each group is the only
      // way to stop them from interleaving with live work.
      // A rebuilt client module re-runs apply(); drop the previous lift first, or
      // its body-wide observer would keep inserting rows into a rail nobody owns
      // any more (and its controls would stay hidden by a stale attribute).
      try { if (window.__dseFooterLift && window.__dseFooterLift.destroy) window.__dseFooterLift.destroy(); } catch (e) {}
      window.__dseFooterLift = null;
      safeEffect(() => {
        // A throw here must never take the rail down with it: the lift is an
        // enhancement, and the rest of this module (the panel manager, the
        // pinned section) has to keep working even if it fails.
        let lift = null;
        try { lift = startFooterLift(ctx); } catch (e) { lift = null; }
        window.__dseFooterLift = lift;
        return () => {
          try { if (lift && lift.destroy) lift.destroy(); } catch (e) {}
          if (window.__dseFooterLift === lift) window.__dseFooterLift = null;
        };
      }, 'dsh-sidebar-entries: footer lift');
      // A rebuilt client module re-runs apply(); drop the previous pinned-section
      // instance first, or its observer would keep cloning rows into a section
      // nobody owns any more.


    }
  
  exports.inject = ['slots'];
    exports.apply = apply;
    return module.exports;
  }
});

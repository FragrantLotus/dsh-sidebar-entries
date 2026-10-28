window.__ModuleLoader__.load({
  id: 'dsh-sidebar-entries',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require('react');
    const h = React.createElement;
    const VERSION = '0.7.15';
    // One set of drag numbers for the whole sidebar.
    //
    // Three separate drag implementations had drifted apart: the rail lift used
    // 0.94 opacity with an 8/22 shadow, the pinned section used the same, and the
    // Session drag used 0.96 with a 10/24 shadow and a slower 260ms settle. They
    // are the same gesture to the user, so they must read the same — hence one
    // source for the timing and one for the lifted-card treatment.
    const MOVE_MS = 180;
    const MOVE_EASE = 'cubic-bezier(.2,.8,.2,1)';
    const LIFT_SHADOW = '0 8px 22px rgba(0,0,0,.38)';
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
    const LIFT_FILL = 'var(--dsw-alias-bg-overlay,rgba(127,127,127,.18))';
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
        'overscroll-behavior:contain;scrollbar-width:thin}',
      '[class*=collapsed] nav[class*=panelList]{max-height:none;overflow-y:visible}',
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
        'overflow:hidden;opacity:' + LIFT_OPACITY + ';box-shadow:' + LIFT_SHADOW +
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
        + 'max-height:var(--dse-pin-cap,30%);min-height:0}',
      // The body is the scroller, not the section: capping the section and
      // letting the body scroll keeps the header always visible while a long
      // pin list moves under it.
      '.dse-pin-body{display:flex;flex-direction:column;min-width:0;min-height:0;'
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
      '.dse-pin-row{box-sizing:border-box;position:relative;display:flex;align-items:center;gap:8px;'
        + 'width:100%;min-height:32px;margin:0 2px;padding:0 8px;'
        + 'border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;'
        + 'color:var(--dsw-alias-label-primary);font:inherit;line-height:22px;'
        + 'text-align:left;cursor:pointer;user-select:none}',
      '.dse-pin-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dse-pin-row:focus-visible{outline:var(--dsw-focus-ring-width) solid '
        + 'var(--dsw-alias-border-focus,currentColor);outline-offset:-2px}',
      '.dse-pin-row.dse-pin-active{background:var(--dsw-alias-interactive-bg-hover)}',
      // The dragged row leaves the flow visually (it follows the pointer by
      // transform) so it needs to sit above its neighbours. No transition here:
      // it has to track the pointer without lag. The other rows are animated by
      // the shared .dse-flip rule, which is the same curve the rail drag uses.
      '.dse-pin-row.dse-dragging{position:relative;z-index:6;opacity:' + LIFT_OPACITY +
        ';transition:none !important;box-shadow:' + LIFT_SHADOW +
        ';border-radius:' + LIFT_RADIUS + ';background:' + LIFT_FILL +
        ';border:' + LIFT_EDGE + '}',
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
        const pluginRows = Math.max(1, Math.floor((railH * CAP_PLUGINS) / rowH));
        const pluginCap = Math.round(pluginRows * rowH);
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
        const bodyBudget = Math.max(pinRowH, railH * CAP_PINS - headH);
        const pinRows = Math.max(1, Math.floor(bodyBudget / pinRowH));
        // Rounded, because 0.3 * 827 is 248.10000000000002: a fractional tail on
        // an arithmetic result of whole rows is noise, not information.
        const pinCap = Math.round(headH + pinRows * pinRowH);
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

    function startPinnedSection(ctx) {
      const state = {
        host: null, section: null, body: null, head: null,
        observer: null, raf: 0, timer: 0, unsub: null, disposed: false,
        drag: null, token: '', opens: 0, unpins: 0, archives: 0, menus: 0, closes: 0,
        // The open ⋯ popover and the timer that defers its outside-click
        // dismissal by one task (see openMenu).
        menu: null, menuTimer: 0,
        // Set for 400ms after a drag so the trailing click does not open the
        // Session that was just moved. On state, not inside bindDrag, because
        // the row's own handlers read it too.
        swallowClick: false, lastError: '',
        // Session ids already considered by followChildren(). `null` until the
        // first pass seeds it, which is what keeps history from being swept in.
        seen: null, follows: 0,
        // Section collapse. Persisted so the choice survives a reload; the
        // stored value is read once at construction and written on every toggle.
        closed: readPinClosed()
      };

      // The shipped rows call these services directly, so the section can do the
      // same thing instead of replaying clicks into DOM that may not be rendered.
      function workspaceService() { return serviceOf(ctx, 'uiWorkspace'); }

      // `sessions.list` is an ObservableSnapshot<{ids, byId, ...}>; `byId` holds
      // the SessionSummary whose `title`/`displayTitle` is what the tree prints.
      function sessionStore() {
        try {
          const svc = serviceOf(ctx, 'sessions');
          const store = svc && svc.list;
          if (store && typeof store.getSnapshot === 'function') return store;
        } catch (e) {}
        return null;
      }
      // `workspaces.list` is the workspace model: plain arrays, no getters, which
      // is why it can be read straight off the service.
      function workspaceModel() {
        try {
          const svc = serviceOf(ctx, 'workspaces');
          const model = svc && svc.list;
          if (model && model.pinnedSessionIds) return model;
        } catch (e) {}
        return null;
      }

      // Several elements can carry a `listArea` class (the rail copy, the search
      // results pane). Prefer the one that actually holds Session rows, but fall
      // back to the scroll region and then to any listArea — the section must be
      // mountable even when every group is collapsed and no row exists at all.
      function listArea() {
        let any = null;
        try {
          const all = document.querySelectorAll('[class*=listArea]');
          for (let i = 0; i < all.length; i++) {
            if (!any) any = all[i];
            if (all[i].querySelector('div[data-row-key^="session:"]')) return all[i];
          }
        } catch (e) {}
        if (any) return any;
        try {
          const region = document.querySelector('[class*=regionArea]');
          if (region) return region;
        } catch (e) {}
        return null;
      }
      function originals(scope) {
        const out = [];
        try {
          const all = scope.querySelectorAll('div[data-row-key^="session:"]');
          for (let i = 0; i < all.length; i++) out.push(all[i]);
        } catch (e) {}
        return out;
      }
      function sessionIdOf(row) {
        const key = row && row.getAttribute ? row.getAttribute('data-row-key') : '';
        return key && key.indexOf('session:') === 0 ? key.slice(8) : '';
      }
      function show(row) {
        if (row && row.style && row.style.display === 'none') row.style.display = '';
      }
      function hide(row) {
        if (row && row.style && row.style.display !== 'none') row.style.display = 'none';
      }
      // The rail collapses to a 36px icon strip; a titled list has no room there,
      // so the section stands down and lets the group rows speak for themselves.
      function railCollapsed(host) {
        let el = host;
        while (el && el !== document.body) {
          try {
            const cls = String(el.className || '');
            const tokens = cls.split(/\s+/);
            for (let i = 0; i < tokens.length; i++) {
              if (/collapsed$/i.test(tokens[i])) return true;
            }
            if (el.getAttribute && el.getAttribute('data-sidebar-collapsed') === 'true') return true;
          } catch (e) {}
          el = el.parentElement;
        }
        return false;
      }

      function pinnedIds() {
        const model = workspaceModel();
        const out = [];
        const seen = Object.create(null);
        try {
          const archived = (model && model.archivedSessionIds) || [];
          const gone = Object.create(null);
          for (let i = 0; i < archived.length; i++) gone[String(archived[i])] = 1;
          const arr = model ? model.pinnedSessionIds : null;
          if (arr && typeof arr.length === 'number') {
            for (let i = 0; i < arr.length; i++) {
              const id = String(arr[i] || '');
              // An archived pinned Session is not rendered anywhere in the tree,
              // so listing it here would resurrect a row the user put away.
              if (!id || seen[id] || gone[id]) continue;
              seen[id] = 1;
              out.push(id);
            }
          }
        } catch (e) { state.lastError = String((e && e.message) || e); }
        const order = readArr(LS_PIN_ORDER) || [];
        const rank = Object.create(null);
        for (let i = 0; i < order.length; i++) rank[String(order[i])] = i;
        // Unknown ids keep their store order behind the ones the user dragged.
        out.sort(function (a, b) {
          const ra = rank[a] === undefined ? 1e9 : rank[a];
          const rb = rank[b] === undefined ? 1e9 : rank[b];
          return ra - rb;
        });
        return out;
      }
      // A forked child must follow its parent into the section.
      //
      // The Host pins per Session and does not inherit: `pinWorkspace` only ever
      // pins the Session named in the request, so a fork of a pinned Session
      // lands in the ordinary list instead of beside its parent. This restores
      // that expectation without touching anything the user did not ask for:
      //
      //   * the first pass only records what already exists, so no historical
      //     child is swept into the section on an upgrade;
      //   * the parent must still be pinned at the moment the child appears, so
      //     a child that shows up later (a page reload) is not pinned by a
      //     parent that has since been unpinned;
      //   * unpinning the parent does not unpin the child — the child is a
      //     Session in its own right and the user may keep working in it.
      function followChildren() {
        const store = sessionStore();
        const snap = store ? store.getSnapshot() : null;
        const byId = (snap && snap.byId) || null;
        if (!byId) return;
        // A fork is young by definition. The age check, not the seed alone, is
        // what keeps history out: `byId` can hydrate in more than one set, and
        // a Session that arrives a beat after the seed would otherwise look
        // like a brand-new fork and get swept in. Ten minutes is comfortably
        // longer than "create a fork and look at the rail", and any child the
        // user actually makes is far younger than that.
        const YOUNG_MS = 10 * 60 * 1000;
        if (!state.seen) {
          // Seed only. Everything live at boot is history, not a fork.
          state.seen = Object.create(null);
          for (const key in byId) state.seen[key] = 1;
          return;
        }
        const pinned = Object.create(null);
        const model = workspaceModel();
        const arr = model && model.pinnedSessionIds;
        if (arr && typeof arr.length === 'number') {
          for (let i = 0; i < arr.length; i++) pinned[String(arr[i])] = 1;
        }
        const svc = workspaceService();
        if (!svc || typeof svc.pinSession !== 'function') return;
        const fresh = [];
        const now = Date.now();
        for (const key in byId) {
          if (state.seen[key]) continue;
          state.seen[key] = 1;
          const one = byId[key];
          const parent = one && one.parentId;
          if (!parent || !pinned[String(parent)]) continue;
          // `updatedAt` is the only age signal a summary carries; a summary
          // without one is treated as old, because pinning something whose age
          // cannot be established is the failure this guard exists to avoid.
          const stamp = one && Number(one.updatedAt);
          if (!isFinite(stamp) || now - stamp > YOUNG_MS) continue;
          fresh.push({ id: key, parent: String(parent), at: stamp });
        }
        if (!fresh.length) return;
        // Oldest parent first, so a chain (A forks B forks C) lands in order.
        fresh.sort(function (a, b) { return a.at - b.at; });
        const order = readArr(LS_PIN_ORDER) || [];
        for (let i = 0; i < fresh.length; i++) {
          const id = fresh[i].id;
          const parent = fresh[i].parent;
          state.follows++;
          try {
            Promise.resolve(svc.pinSession(id)).catch(function (err) {
              state.lastError = String((err && err.message) || err);
            });
          } catch (e) { state.lastError = String((e && e.message) || e); }
          // Insert straight after the parent in our own order, not at the end:
          // `pinnedSessionIds` arrives most-recently-pinned-first, which would
          // put the child above every older pin.
          const at = order.indexOf(parent);
          const rest = order.filter(function (x) { return x !== id; });
          const anchor = at < 0 ? rest.length : rest.indexOf(parent) + 1;
          rest.splice(anchor < 0 ? rest.length : anchor, 0, id);
          order.length = 0;
          for (let j = 0; j < rest.length; j++) order.push(rest[j]);
        }
        writeArr(LS_PIN_ORDER, order);
      }

      function titleOf(id) {
        try {
          const store = sessionStore();
          const snap = store ? store.getSnapshot() : null;
          const one = snap && snap.byId ? snap.byId[id] : null;
          const text = one ? String(one.displayTitle || one.title || '').trim() : '';
          return text || '未命名会话';
        } catch (e) { return '未命名会话'; }
      }
      function isCurrent(id) {
        try {
          const row = document.querySelector('div[data-row-key="session:' + id + '"]');
          if (!row) return false;
          return row.getAttribute('aria-selected') === 'true' || row.getAttribute('aria-current') === 'page';
        } catch (e) { return false; }
      }

      function openSession(id) {
        const svc = workspaceService();
        if (!svc || typeof svc.openSession !== 'function') { state.lastError = 'no-openSession'; return false; }
        state.opens++;
        try { svc.openSession(id); return true; }
        catch (e) { state.lastError = String((e && e.message) || e); return false; }
      }
      function unpin(id) {
        const svc = workspaceService();
        if (!svc || typeof svc.unpinSession !== 'function') { state.lastError = 'no-unpinSession'; return false; }
        state.unpins++;
        try {
          Promise.resolve(svc.unpinSession(id)).catch(function (err) {
            state.lastError = String((err && err.message) || err);
          });
          return true;
        } catch (e) {
          state.lastError = String((e && e.message) || e);
          return false;
        }
      }
      function archive(id) {
        // Archiving goes through the workspace controller, the same call the
        // shipped "归档会话" menu item makes. Without `stopActivity` the Host
        // refuses while the Session is still running — that refusal is a real
        // answer, so it is surfaced rather than retried with the flag set, which
        // would silently stop the user's work.
        const svc = workspaceService();
        if (!svc || typeof svc.archiveSession !== 'function') { state.lastError = 'no-archiveSession'; return false; }
        state.archives++;
        try {
          Promise.resolve(svc.archiveSession(id)).catch(function (err) {
            const code = (err && err.code) || '';
            state.lastError = code === 'workspace/session-active'
              ? 'running'
              : String((err && err.message) || err);
          });
          return true;
        } catch (e) {
          state.lastError = String((e && e.message) || e);
          return false;
        }
      }

      // The ⋯ menu from a pinned row.
      //
      // A popover is built here rather than reusing the shipped one: that menu
      // belongs to the shipped row component and unmounts with it, while a
      // pinned row is its own DOM. The items mirror the shipped row's
      // Session-level actions so both lists offer the same vocabulary.
      function fallbackMenu(id, anchorBtn) {
        closeMenu();
        const items = [
          { label: '取消置顶', run: function () { unpin(id); } },
          { label: '归档会话', run: function () { archive(id); } },
          { label: '复制会话 ID', run: function () { copyId(id); } }
        ];
        const menu = document.createElement('div');
        menu.className = 'dse-pin-menu';
        menu.setAttribute('data-dse-ui', 'pin-menu');
        menu.setAttribute('role', 'menu');
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dse-pin-menu-item';
          btn.setAttribute('role', 'menuitem');
          btn.textContent = item.label;
          btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            closeMenu();
            item.run();
          });
          menu.appendChild(btn);
        }
        document.body.appendChild(menu);
        // Anchored to the button, flipped above it when there is no room below,
        // and clamped to the viewport so a menu opened near an edge stays whole.
        try {
          const box = anchorBtn.getBoundingClientRect();
          const mbox = menu.getBoundingClientRect();
          let left = box.right - mbox.width;
          let top = box.bottom + 4;
          if (top + mbox.height > window.innerHeight - 8) top = box.top - mbox.height - 4;
          left = Math.max(8, Math.min(left, window.innerWidth - mbox.width - 8));
          menu.style.left = Math.round(left) + 'px';
          menu.style.top = Math.round(Math.max(8, top)) + 'px';
        } catch (e) {}
        state.menu = menu;
        state.menus++;
        // Dismissal is registered on the NEXT task, not now: the click that
        // opened the menu is still propagating, and a listener added here would
        // receive that same click and close the menu immediately.
        state.menuTimer = window.setTimeout(function () {
          state.menuTimer = 0;
          document.addEventListener('pointerdown', onMenuOutside, true);
          document.addEventListener('keydown', onMenuKey, true);
        }, 0);
        return menu;
      }
      function closeMenu() {
        if (state.menuTimer) { try { window.clearTimeout(state.menuTimer); } catch (e) {} state.menuTimer = 0; }
        document.removeEventListener('pointerdown', onMenuOutside, true);
        document.removeEventListener('keydown', onMenuKey, true);
        const menu = state.menu;
        state.menu = null;
        if (menu && menu.parentNode) { try { menu.parentNode.removeChild(menu); } catch (e) {} }
      }
      function onMenuOutside(event) {
        const menu = state.menu;
        if (!menu) return;
        const target = event.target;
        if (target && menu.contains && menu.contains(target)) return;
        closeMenu();
      }
      function onMenuKey(event) {
        if (event.key === 'Escape') closeMenu();
      }
      function copyId(id) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            Promise.resolve(navigator.clipboard.writeText(id)).catch(function () {});
          }
        } catch (e) {}
      }

      function persistOrder() {
        if (!state.body) return;
        const ids = [];
        const kids = state.body.children;
        for (let i = 0; i < kids.length; i++) {
          const id = kids[i].getAttribute ? kids[i].getAttribute('data-dse-pin-id') : '';
          if (id) ids.push(id);
        }
        writeArr(LS_PIN_ORDER, ids);
        state.token = state.body.getAttribute('data-dse-for') || '';
      }

      // Dragging inside the section only reorders the section: the workspace
      // store has no "pinned order" concept, so the arrangement is ours and is
      // persisted per profile.
      // Drag inside the section mirrors the shipped rail drag exactly: a
      // long press arms it, the row then follows the pointer by transform with
      // no transition of its own, and every other row slides out of the way
      // through a FLIP pass. Reordering without that pass is why the section
      // felt like it snapped instead of animating.
      function flipRows(body, move, skip) {
        const before = [];
        try {
          for (let i = 0; i < body.children.length; i++) {
            const el = body.children[i];
            before.push([el, el.getBoundingClientRect()]);
          }
        } catch (e) { return; }
        move();
        for (let i = 0; i < before.length; i++) {
          const el = before[i][0];
          const from = before[i][1];
          if (!el.parentNode || (skip && skip.indexOf(el) >= 0)) continue;
          const to = el.getBoundingClientRect();
          const dy = from.top - to.top;
          const dx = from.left - to.left;
          if (!dy && !dx) continue;
          // Set the inverse offset with transitions off, flush, then let the
          // class animate it back to zero — otherwise the browser coalesces
          // both writes and the row simply appears in its new place.
          el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          el.classList.remove('dse-flip');
          void el.offsetHeight;
          el.classList.add('dse-flip');
          el.style.transform = '';
        }
      }
      function bindDrag(row, id) {
        let armed = false;
        let started = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let pointer = 0;
        let grabOffset = 0;
        let lift = 0;
        function begin() {
          if (started || !armed) return;
          started = true;
          state.drag = { id: id, row: row, moves: 0 };
          try {
            const box = row.getBoundingClientRect();
            grabOffset = startY - box.top;
          } catch (e) { grabOffset = 0; }
          lift = 0;
        }
        row.addEventListener('pointerdown', function (event) {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          const target = event.target;
          // Pressing an action must not arm the drag: the pointer would still be
          // down when the button's own click fires, and a few pixels of travel
          // would turn a deliberate "归档" tap into a reorder.
          if (target && target.closest && target.closest('.dse-pin-acts')) return;
          armed = true;
          started = false;
          moved = false;
          startX = event.clientX;
          startY = event.clientY;
          pointer = event.pointerId;
          try { row.setPointerCapture(event.pointerId); } catch (e) {}
          // No long-press gate. The Host's own Session rows hand off to native
          // HTML5 dragging, which starts as soon as the pointer actually moves;
          // a 300 ms wait made ours feel sluggish beside them. `begin` arms the
          // drag immediately, but nothing lifts until the pointer clears the
          // 8 px threshold, so a plain click still reads as a click.
          begin();
        });
        row.addEventListener('pointermove', function (event) {
          if (!armed) return;
          if (!started) return;
          const body = state.body;
          if (!body) return;
          if (!moved) {
            if (Math.abs(event.clientX - startX) <= DRAG_THRESHOLD_PX && Math.abs(event.clientY - startY) <= DRAG_THRESHOLD_PX) return;
            // The visual lift waits for the same threshold as the reorder: a
            // press that never moves must not flash a shadow under the cursor.
            moved = true;
            row.classList.add('dse-dragging');
            try { document.body.style.userSelect = 'none'; } catch (e) {}
          }
          if (state.drag) state.drag.moves++;
          // The dragged row leaves the flow visually and tracks the pointer.
          try {
            const box = row.getBoundingClientRect();
            lift = (event.clientY - grabOffset) - (box.top - lift);
            row.style.transform = 'translateY(' + lift + 'px)';
          } catch (e) {}
          const peers = Array.prototype.slice.call(body.children);
          let anchor = null;
          for (let i = 0; i < peers.length; i++) {
            const peer = peers[i];
            if (peer === row) continue;
            const box = peer.getBoundingClientRect();
            if (event.clientY < box.top + box.height / 2) { anchor = peer; break; }
          }
          if (anchor) {
            if (row.nextSibling !== anchor) flipRows(body, function () { body.insertBefore(row, anchor); }, [row]);
          } else if (body.lastChild !== row) {
            flipRows(body, function () { body.appendChild(row); }, [row]);
          }
          // The re-insert moved this row's layout slot by a whole row height, so
          // the lift measured before it no longer holds the row under the pointer.
          try {
            const box2 = row.getBoundingClientRect();
            lift = (event.clientY - grabOffset) - (box2.top - lift);
            row.style.transform = 'translateY(' + lift + 'px)';
          } catch (e) {}
        });
        function finish() {
          if (!armed) return;
          armed = false;
          try { row.releasePointerCapture(pointer); } catch (e) {}
          // `moved` is what separates a reorder from a click: without it the
          // pointerdown above would have lifted the row on every plain click.
          if (!started || !moved) {
            started = false;
            state.drag = null;
            return;
          }
          started = false;
          moved = false;
          row.classList.remove('dse-dragging');
          row.classList.add('dse-flip');
          try { row.style.transform = ''; } catch (e) {}
          try { document.body.style.userSelect = ''; } catch (e) {}
          state.drag = null;
          persistOrder();
          // A drag ends with a click on the row it started from; letting that
          // through would open the Session the user just moved.
          //
          // `swallowClick` lives on the section's state, NOT in this closure:
          // the row's click handler reads it, and when it was declared here that
          // handler closed over a variable it could not see — every click threw
          // a ReferenceError before reaching either branch, which is exactly why
          // neither "取消置顶" nor opening a pinned Session did anything.
          state.swallowClick = true;
          window.setTimeout(function () { state.swallowClick = false; }, 400);
        }
        row.addEventListener('pointerup', finish);
        row.addEventListener('pointercancel', finish);
        // A pointer that leaves the window never sends pointerup; without this
        // the row would stay lifted and the next sync would be blocked.
        row.addEventListener('pointerleave', function (event) {
          if (event.buttons === 0) finish();
        });
      }
      // A pinned row is a div, not a button.
      //
      // It carries real action buttons (unpin, archive, menu), and a button
      // inside a button is invalid HTML: the browser reparents the inner one and
      // the outer one's click fires for both. A div with `role="treeitem"` and
      // an explicit tabindex gives the same accessibility without that hazard —
      // which is also what the shipped row is.
      function buildRow(id) {
        const title = titleOf(id);
        const row = document.createElement('div');
        row.className = 'dse-pin-row';
        row.setAttribute('data-dse-ui', 'pin-row');
        row.setAttribute('data-dse-pin-id', id);
        row.setAttribute('role', 'treeitem');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', title);
        row.title = title;
        if (isCurrent(id)) row.classList.add('dse-pin-active');
        // The leading slot and the trailing status text are the two parts of a
        // Session row that carry its LIVE state: the shipped row puts the status
        // dot (idle / running / waiting-for-approval) in `span.slot` and the
        // pending-interaction label ("待回复", "待批准") or the relative time in
        // `span.time`. A pinned copy that rebuilt only the title therefore went
        // blind the moment a Session started working, which is exactly when the
        // indicator matters most. Both are cloned from the shipped row and
        // refreshed in place by syncRowState below.
        const slot = document.createElement('span');
        slot.className = 'dse-pin-slot';
        row.appendChild(slot);
        const label = document.createElement('span');
        label.className = 'dse-pin-label';
        label.textContent = title;
        row.appendChild(label);
        // Trailing status / time. Kept as its own node so the actions can hide it
        // on hover the way the shipped row does.
        const time = document.createElement('span');
        time.className = 'dse-pin-time';
        row.appendChild(time);

        const acts = document.createElement('span');
        acts.className = 'dse-pin-acts';
        // Spacing is read off the shipped row rather than guessed: the clone has
        // to sit in the same rhythm as the row above it.
        try {
          const src = originalRow(id);
          const box = src ? src.querySelector('[class*=rowActions]') : null;
          const computed = box ? window.getComputedStyle(box) : null;
          if (computed && computed.gap && computed.gap !== 'normal') acts.style.gap = computed.gap;
        } catch (e) {}
        // Same left-to-right order the shipped row uses, read off its live DOM:
        // the "..." menu (slot order undefined, rendered first), then archive
        // (order 100), then the pin toggle (order 200) — which on a pinned row
        // reads as 取消置顶. Matching it matters because these two rows sit in
        // the same column and the muscle memory built on one has to work on the
        // other.
        // Cloned from the shipped row whenever it is on screen, so icon, hit box
        // and label are the Host's own; the drawn fallbacks only cover a Session
        // whose shipped row is not rendered (collapsed group, scrolled away).
        const mirror = function (group, label, svg, onClick) {
          const native = nativeAction(id, group, row);
          return native || pinAction(label, svg, onClick);
        };
        const menuBtn = mirror('menu', '更多操作', MORE_SVG, function () {
          fallbackMenu(id, menuBtn);
        });
        acts.appendChild(menuBtn);
        const archiveBtn = mirror('archive', '归档会话', ARCHIVE_SVG, function () { archive(id); });
        acts.appendChild(archiveBtn);
        const unpinBtn = mirror('pin', '取消置顶', PIN_SVG, function () { unpin(id); });
        acts.appendChild(unpinBtn);
        row.appendChild(acts);

        row.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          // Reads state, not a closure variable: the drag handler that sets this
          // flag lives in bindDrag, and the earlier closure-scoped copy threw on
          // every click, killing both branches below.
          if (state.swallowClick) return;
          const target = event.target;
          // Clicks on an action are handled by that action; falling through
          // would also open the Session, which is never what the user meant.
          if (acts.contains && acts.contains(target)) return;
          openSession(id);
        });
        row.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          if (state.swallowClick) return;
          event.preventDefault();
          openSession(id);
        });
        bindDrag(row, id);
        return row;
      }
      // One action control. Built as a real button so the keyboard and the
      // pointer both reach it, and so the row's click handler can tell an action
      // from a row click by containment alone.
      // ---- mirroring the shipped row's own action buttons ------------------
      //
      // The pinned section used to draw its own 14px SVGs. Those were never the
      // shapes the shipped row uses (its icons come from the primitives pack),
      // so the two rows disagreed on sight. Cloning the real buttons instead
      // keeps them identical by construction - icon, hit box, colour token and
      // accessible name all come along - and the clone is re-routed here because
      // a clone carries no React handler of its own.
      // Copy the live half of a row: the status dot and the trailing text.
      //
      // The shipped row composes these from React state this module cannot read
      // (sessionStatuses() lives in the Host bundle), so they are TAKEN rather
      // than computed: the shipped row is in the DOM even while it is
      // display:none, and its status span is already up to date. Cloning inside
      // it keeps the dot's colour token and its visually-hidden accessibility
      // label identical to the shipped row without duplicating any CSS.
      //
      // Runs on every sync tick rather than only on rebuild: "转圈" and "待回复"
      // are transient, and a row rebuilt once would freeze on whatever state it
      // happened to have at that instant. Comparing text and markup first keeps
      // an idle row from being rewritten 60 times a second.
      function syncRowState(id, row) {
        const src = originalRow(id);
        if (!src || !row) return false;
        let changed = false;
        const slot = row.querySelector('.dse-pin-slot');
        const time = row.querySelector('.dse-pin-time');
        const srcSlot = src.querySelector('[class*=slot]');
        const srcTime = src.querySelector('[class*=time]');
        // The leading slot normally holds the status dots, but the Host also
        // renders a plugin slot there when a Session is idle and not blank. Both
        // are cloned: whatever the shipped row shows, the pinned copy shows.
        if (slot && srcSlot) {
          const want = srcSlot.innerHTML;
          if (slot.getAttribute('data-dse-mirror') !== want) {
            slot.innerHTML = want;
            slot.setAttribute('data-dse-mirror', want);
            changed = true;
          }
        }
        if (time && srcTime) {
          const want = srcTime.textContent || '';
          if (time.textContent !== want) {
            time.textContent = want;
            changed = true;
          }
        }
        return changed;
      }
      // Walk the section's own rows once. Cheap enough for the 800ms heartbeat
      // and the rAF-debounced mutation schedule both, and it is the only thing
      // keeping a pinned row's state honest between rebuilds.
      function syncRowStates() {
        const body = state.body;
        if (!body) return 0;
        let n = 0;
        const rows = body.children;
        for (let i = 0; i < rows.length; i++) {
          const id = rows[i].getAttribute ? rows[i].getAttribute('data-dse-pin-id') : '';
          if (!id) continue;
          try { if (syncRowState(id, rows[i])) n++; } catch (e) {
            state.lastError = String((e && e.message) || e);
          }
        }
        return n;
      }
      function originalRow(id) {
        try {
          const rows = document.querySelectorAll('div[data-row-key^="session:"]');
          const key = 'session:' + id;
          for (let i = 0; i < rows.length; i++) {
            if (rows[i].getAttribute('data-row-key') === key) return rows[i];
          }
        } catch (e) {}
        return null;
      }
      function nativeActionButtons(id) {
        const row = originalRow(id);
        if (!row) return [];
        const box = row.querySelector('[class*=rowActions]');
        if (!box) return [];
        return Array.prototype.slice.call(box.querySelectorAll('button'));
      }
      // The shipped buttons are told apart by their accessible name only, and
      // that name is localised, so both languages are matched.
      function actionKind(btn) {
        const label = String((btn && (btn.getAttribute('aria-label') || btn.title)) || '');
        if (!label) return '';
        if (/\u7684\u64cd\u4f5c$/.test(label) || /^Session actions for/.test(label)) return 'menu';
        if (label === '\u5f52\u6863\u4f1a\u8bdd' || label === 'Archive' || label === 'Archive session') return 'archive';
        if (label === '\u53d6\u6d88\u5f52\u6863' || label === 'Unarchive' || label === 'Unarchive session') return 'unarchive';
        if (label === '\u53d6\u6d88\u7f6e\u9876' || label === 'Unpin' || label === 'Unpin session') return 'unpin';
        if (label === '\u7f6e\u9876\u4f1a\u8bdd' || label === 'Pin' || label === 'Pin session') return 'pin';
        return '';
      }
      function matchesGroup(kind, group) {
        if (group === 'menu') return kind === 'menu';
        if (group === 'archive') return kind === 'archive' || kind === 'unarchive';
        if (group === 'pin') return kind === 'pin' || kind === 'unpin';
        return false;
      }

      // Overlay geometry: the ... popover positions itself from its anchor's live
      // getBoundingClientRect, and a display:none row reports 0x0 - the menu
      // would open in the top-left corner. So while a native menu is up, the
      // shipped row is pinned invisibly on top of its copy and keeps following
      // it frame by frame.
      let replayState = null;
      let replayTimer = 0;
      // The Host re-renders a row the moment its menu opens, and that render
      // rewrites `className` wholesale - which silently dropped the `.dse-replay`
      // class this module relies on, put the row back to `display:none`, and left
      // the popover anchoring to a 0x0 rect (measured: it landed at 12,60). The
      // box is therefore asserted inline, every frame, from the only properties
      // React does not own.
      function holdReplayBox(row) {
        if (!row || !row.style) return;
        const want = {
          position: 'fixed',
          display: 'block',
          visibility: 'hidden',
          opacity: '0',
          pointerEvents: 'none',
          margin: '0',
          zIndex: '-1'
        };
        for (const key in want) {
          if (row.style[key] !== want[key]) row.style[key] = want[key];
        }
      }
      // The Host's menu closes on any document pointerdown outside it, so a
      // second click on the clone would dismiss and then immediately re-open it.
      // This flag turns that click into a plain close.
      let replaySkip = false;
      function beginReplay(id, rowEl, btnEl) {
        endReplay();
        const row = originalRow(id);
        if (!row || !rowEl || !rowEl.isConnected) return null;
        row.classList.add('dse-replay');
        holdReplayBox(row);
        row.style.left = '0px';
        row.style.top = '0px';
        let offX = 0;
        let offY = 0;
        let frames = 0;
        replayState = { row: row, raf: 0 };
        // Closed-loop: rather than trusting one offset, the row's own rect is
        // measured against the copy's and the placement keeps being corrected.
        // That absorbs a transformed ancestor (which would otherwise make the
        // fixed coordinates mean something other than the viewport) and any
        // later shift of the list.
        const place = function () {
          if (!replayState || replayState.row !== row) return;
          if (!rowEl.isConnected) { endReplay(); return; }
          // React rewrite the row's class while the menu is open, so the class is
          // put back as well; the inline box is re-asserted for the same reason.
          if (!row.classList.contains('dse-replay')) row.classList.add('dse-replay');
          holdReplayBox(row);
          const want = rowEl.getBoundingClientRect();
          const have = row.getBoundingClientRect();
          const errX = want.left - have.left;
          const errY = want.top - have.top;
          if (Math.abs(errX) > 0.5 || Math.abs(errY) > 0.5) {
            offX += errX;
            offY += errY;
            row.style.left = offX + 'px';
            row.style.top = offY + 'px';
          } else if (frames > 2) {
            // Settled: the row still has to track the copy when the list scrolls
            // or the window is resized, so the loop keeps running cheaply.
          }
          if (Math.abs(have.width - want.width) > 0.5) row.style.width = want.width + 'px';
          if (Math.abs(have.height - want.height) > 0.5) row.style.height = want.height + 'px';
          frames++;
          replayState.raf = window.requestAnimationFrame(place);
        };
        place();
        return replayState;
      }
      function endReplay() {
        const held = replayState;
        replayState = null;
        if (replayTimer) { try { window.clearInterval(replayTimer); } catch (e) {} replayTimer = 0; }
        if (!held || !held.row) return;
        if (held.raf) { try { window.cancelAnimationFrame(held.raf); } catch (e) {} held.raf = 0; }
        const row = held.row;
        row.classList.remove('dse-replay');
        // Only the geometry set here is cleared: hide() owns display, and
        // stomping the whole style attribute would fight syncOriginals.
        row.style.removeProperty('left');
        row.style.removeProperty('top');
        row.style.removeProperty('width');
        row.style.removeProperty('height');
        row.style.removeProperty('position');
        row.style.removeProperty('visibility');
        row.style.removeProperty('opacity');
        row.style.removeProperty('pointer-events');
        row.style.removeProperty('margin');
        row.style.removeProperty('z-index');
        // The row was forced to `display:block` to give the popover a rect, so it
        // has to go back to standing down. `show()` clears `none` when the row is
        // no longer pinned, so an unpin that races this still heals itself.
        if (row.style.display && row.style.display !== 'none') row.style.display = 'none';
      }
      // A native menu is a portal, so its dismissal - an item, an outside click,
      // Escape - is only observable as the surface leaving the document.
      function watchNativeMenu() {
        if (replayTimer) { try { window.clearInterval(replayTimer); } catch (e) {} }
        let saw = false;
        let waited = 0;
        replayTimer = window.setInterval(function () {
          waited += 150;
          let open = false;
          try { open = document.querySelector('[data-menu-material]') !== null; } catch (e) {}
          if (open) { saw = true; return; }
          if (saw || waited > 1500) {
            try { window.clearInterval(replayTimer); } catch (e) {}
            replayTimer = 0;
            endReplay();
          }
        }, 150);
      }
      function openNativeMenu(id, btnEl, rowEl) {
        closeMenu();
        const list = nativeActionButtons(id);
        let anchor = null;
        for (let i = 0; i < list.length; i++) {
          if (actionKind(list[i]) === 'menu') { anchor = list[i]; break; }
        }
        if (!anchor) return false;
        if (!beginReplay(id, rowEl, btnEl)) return false;
        // Deferred one task: the click that got here is still propagating, and
        // React would see the replayed one inside the same tick.
        window.setTimeout(function () {
          try { anchor.click(); } catch (e) { endReplay(); }
        }, 0);
        state.menus++;
        watchNativeMenu();
        return true;
      }
      function workspaceAction(id, kind) {
        const svc = workspaceService();
        const name = kind === 'archive' ? 'archiveSession'
          : kind === 'unarchive' ? 'unarchiveSession'
          : kind === 'pin' ? 'pinSession'
          : 'unpinSession';
        if (!svc || typeof svc[name] !== 'function') { state.lastError = 'no-' + name; return false; }
        try {
          Promise.resolve(svc[name](id)).catch(function (err) {
            const code = (err && err.code) || '';
            state.lastError = code === 'workspace/session-active'
              ? 'running'
              : String((err && err.message) || err);
          });
          return true;
        } catch (e) {
          state.lastError = String((e && e.message) || e);
          return false;
        }
      }
      // One shipped action, cloned. Null when the row is not rendered - a
      // collapsed group, a Session scrolled out of the list - so the caller can
      // fall back to the drawn icon instead of shipping a dead button.
      function nativeAction(id, group, rowEl) {
        const list = nativeActionButtons(id);
        let source = null;
        let found = '';
        for (let i = 0; i < list.length; i++) {
          const kind = actionKind(list[i]);
          if (matchesGroup(kind, group)) { source = list[i]; found = kind; break; }
        }
        if (!source) return null;
        const btn = source.cloneNode(true);
        btn.setAttribute('type', 'button');
        btn.removeAttribute('aria-expanded');
        btn.removeAttribute('aria-haspopup');
        // No title: the shipped button carries its label in aria-label and gets
        // its tooltip from the Host's own Tooltip wrapper, so copying the text
        // into title would add a second, browser-drawn tooltip.
        if (found === 'menu') {
          // Runs before the Host's own document listener closes the popover, so
          // this is the only place the toggle can be caught.
          btn.addEventListener('pointerdown', function () {
            let open = false;
            try { open = document.querySelector('[data-menu-material]') !== null; } catch (e) {}
            if (!open) return;
            replaySkip = true;
            endReplay();
            window.setTimeout(function () { replaySkip = false; }, 400);
          });
        }
        btn.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (found === 'menu') {
            if (replaySkip) { replaySkip = false; return; }
            if (openNativeMenu(id, btn, rowEl)) return;
            fallbackMenu(id, btn);
            return;
          }
          workspaceAction(id, found);
        });
        return btn;
      }
      function pinAction(label, svg, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dse-pin-act';
        btn.setAttribute('aria-label', label);
        btn.title = label;
        btn.innerHTML = svg;
        btn.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          onClick(event);
        });
        return btn;
      }

      function removeSection() {
        state.head = null;
        if (state.section && state.section.parentNode) state.section.parentNode.removeChild(state.section);
        state.section = null;
        state.body = null;
      }
      function ensureSection(host) {
        if (state.section && state.section.parentNode === host) return;
        removeSection();
        const section = document.createElement('div');
        section.className = 'dse-pin-section';
        section.setAttribute('data-dse-ui', 'pin-section');
        const head = buildHeader(host);
        section.appendChild(head);
        const body = document.createElement('div');
        body.className = 'dse-pin-body';
        section.appendChild(body);
        host.insertBefore(section, host.firstChild);
        state.section = section;
        state.body = body;
        state.head = head;
        // A rebuild drops the class, so the stored state has to be re-applied
        // here rather than only from the toggle.
        applyClosed();
      }
      // The header borrows the shipped group-row classes so it inherits the
      // exact typography and hover treatment without naming a build hash. It
      // carries a triangle of its own: a group row that cannot be opened reads
      // as broken once the list below it is long enough to hide rows.
      function buildHeader(host) {
        const proto = host.querySelector('div[class*=projectRow]');
        const el = document.createElement('div');
        if (proto) {
          el.className = proto.className;
          el.setAttribute('role', 'treeitem');
        } else {
          el.className = 'dse-pin-head';
        }
        el.setAttribute('data-dse-ui', 'pin-head');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-expanded', state.closed ? 'false' : 'true');
        el.setAttribute('aria-label', PIN_SECTION_LABEL);
        const arrow = document.createElement('span');
        arrow.className = 'dse-pin-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = ARROW_SVG;
        el.appendChild(arrow);
        const text = document.createElement('span');
        text.className = 'dse-pin-label';
        text.textContent = PIN_SECTION_LABEL;
        el.appendChild(text);
        el.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          toggleClosed();
        });
        el.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          toggleClosed();
        });
        return el;
      }
      // Flipping the bit is all it takes: `sync` reads it on the next frame and
      // applies the class, and the arrow's rotation is pure CSS off that class.
      function toggleClosed() {
        state.closed = !state.closed;
        writePinClosed(state.closed);
        applyClosed();
        state.closes = (state.closes || 0) + 1;
        report({ event: 'pin-toggle', version: VERSION, closed: state.closed }, true);
      }
      function applyClosed() {
        if (!state.section) return;
        if (state.closed) state.section.classList.add('dse-pin-closed');
        else state.section.classList.remove('dse-pin-closed');
        if (state.head) state.head.setAttribute('aria-expanded', state.closed ? 'false' : 'true');
      }

      // Rows are only stood down once a stand-in exists for every one of them:
      // hiding first and building second is what made a pinned Session vanish
      // from the sidebar when a build step failed.
      function syncOriginals() {
        const host = state.host;
        if (!host) return;
        const ids = state.body ? Array.prototype.map.call(state.body.children, function (el) {
          return el.getAttribute ? el.getAttribute('data-dse-pin-id') : '';
        }) : [];
        const wanted = Object.create(null);
        for (let i = 0; i < ids.length; i++) if (ids[i]) wanted['session:' + ids[i]] = 1;
        const rows = originals(host);
        for (let i = 0; i < rows.length; i++) {
          if (wanted[rows[i].getAttribute('data-row-key')]) hide(rows[i]);
          else show(rows[i]);
        }
      }
      function showAllOriginals() {
        const host = state.host;
        if (!host) return;
        const rows = originals(host);
        for (let i = 0; i < rows.length; i++) show(rows[i]);
      }

      function sync() {
        state.raf = 0;
        if (state.disposed || state.drag) return;
        let host = null;
        try { host = listArea(); } catch (e) { host = null; }
        if (!host) { showAllOriginals(); removeSection(); state.host = null; return; }
        const switched = state.host !== host;
        state.host = host;
        if (switched) attach(host);
        // Before reading the set, so a child that just appeared is already in
        // `pinnedSessionIds` by the time the rows are built.
        try { followChildren(); } catch (e) { state.lastError = String((e && e.message) || e); }
        const ids = pinnedIds();
        if (!ids.length || railCollapsed(host)) {
          showAllOriginals();
          removeSection();
          return;
        }
        ensureSection(host);
        const body = state.body;
        if (!body) return;
        // The token covers titles too: a rename has to reach the row, and a
        // rebuild is far cheaper than diffing text nodes every animation frame.
        const token = ids.map(function (id) { return id + '=' + titleOf(id); }).join('|');
        if (token !== state.token) {
          const built = [];
          try {
            for (let i = 0; i < ids.length; i++) built.push(buildRow(ids[i]));
          } catch (e) {
            state.lastError = String((e && e.message) || e);
          }
          if (built.length !== ids.length) {
            showAllOriginals();
            removeSection();
            return;
          }
          body.textContent = '';
          for (let i = 0; i < built.length; i++) body.appendChild(built[i]);
          body.setAttribute('data-dse-for', token);
          state.token = token;
        }
        // Outside the rebuild branch on purpose: the common case is a row that
        // already exists and has merely started or stopped working.
        syncRowStates();
        syncOriginals();
      }
      function schedule() {
        if (state.raf || state.disposed) return;
        state.raf = window.requestAnimationFrame(sync);
      }
      function attach(host) {
        try { if (state.observer) state.observer.disconnect(); } catch (e) {}
        try {
          state.observer = new MutationObserver(schedule);
          state.observer.observe(host, { childList: true, subtree: true });
        } catch (e) { state.observer = null; }
      }

      function destroy() {
        state.disposed = true;
        if (state.raf) { try { window.cancelAnimationFrame(state.raf); } catch (e) {} state.raf = 0; }
        if (state.timer) { try { window.clearInterval(state.timer); } catch (e) {} state.timer = 0; }
        try { if (state.unsub) state.unsub(); } catch (e) {}
        state.unsub = null;
        try { if (state.observer) state.observer.disconnect(); } catch (e) {}
        state.observer = null;
        try { document.body.style.userSelect = ''; } catch (e) {}
        // A popover appended to <body> outlives the section, so it has to be
        // torn down here rather than left to the next sync.
        try { endReplay(); } catch (e) {}
        try { closeMenu(); } catch (e) {}
        showAllOriginals();
        removeSection();
        state.host = null;
      }

      // The store notifies on every Session tick, but `pinnedSessionIds` lives on
      // a different model that may change without a session update — the interval
      // is the cheap safety net that keeps the two in step.
      try {
        const store = sessionStore();
        if (store && typeof store.subscribe === 'function') state.unsub = store.subscribe(schedule);
      } catch (e) {}
      state.timer = window.setInterval(schedule, 800);

      let tries = 0;
      const boot = window.setInterval(() => {
        tries++;
        const host = listArea();
        if (host) { attach(host); sync(); window.clearInterval(boot); }
        else if (tries > 40) window.clearInterval(boot);
      }, 250);

      return {
        destroy: destroy,
        refresh: sync,
        stats: function () {
          return {
            ids: pinnedIds(),
            // Child-follow: `seen` is null until the first pass seeded it, so a
            // null here means "history not yet absorbed", not "nothing happened".
            follows: state.follows,
            // Capability probes: `followChildren` can only work if the service
            // really carries `pinSession` and the summaries really carry
            // `parentId`. Both are checked here so a silent no-op is visible.
            canPin: !!(workspaceService() && typeof workspaceService().pinSession === 'function'),
            sample: (function () {
              try {
                const store = sessionStore();
                const snap = store ? store.getSnapshot() : null;
                const byId = (snap && snap.byId) || {};
                const keys = Object.keys(byId);
                const out = [];
                let youngest = 0;
                for (let i = 0; i < keys.length; i++) {
                  const one = byId[keys[i]] || {};
                  const stamp = Number(one.updatedAt);
                  if (isFinite(stamp) && stamp > youngest) youngest = stamp;
                  if (one.parentId && out.length < 4) out.push(keys[i].slice(0, 10) + '<' + String(one.parentId).slice(0, 10));
                }
                return { total: keys.length, withParent: out, youngest: youngest ? Math.round((Date.now() - youngest) / 60000) + 'min' : 'none' };
              } catch (e) { return 'threw:' + String((e && e.message) || e); }
            })(),
            seen: state.seen ? Object.keys(state.seen).length : -1,
            parents: (function () {
              try {
                const store = sessionStore();
                const snap = store ? store.getSnapshot() : null;
                const byId = (snap && snap.byId) || {};
                const ids = pinnedIds();
                const out = [];
                for (let i = 0; i < ids.length && i < 8; i++) {
                  const one = byId[ids[i]];
                  if (one && one.parentId) out.push(ids[i].slice(0, 12) + '<' + String(one.parentId).slice(0, 12));
                }
                return out;
              } catch (e) { return 'threw:' + String((e && e.message) || e); }
            })(),
            rows: state.body ? state.body.children.length : 0,
            hasService: !!workspaceService(),
            hasStore: !!sessionStore(),
            hasModel: !!workspaceModel(),
            opens: state.opens,
            unpins: state.unpins,
            archives: state.archives,
            menus: state.menus,
            closes: state.closes,
            closed: !!state.closed,
            // The cap in pixels, so the 20% claim is checked against a real
            // layout instead of a stylesheet reading.
            cap: (function () {
              try {
                const sec = state.section;
                if (!sec) return null;
                const body = state.body;
                return {
                  h: Math.round(sec.getBoundingClientRect().height),
                  bodyH: body ? Math.round(body.getBoundingClientRect().height) : 0,
                  scrollH: body ? body.scrollHeight : 0,
                  scrollable: !!body && body.scrollHeight > body.clientHeight + 1,
                  arrow: !!sec.querySelector('.dse-pin-arrow')
                };
              } catch (e) { return 'threw'; }
            })(),
            menuOpen: !!state.menu,
            // What a row actually renders, counted from the DOM: the action
            // buttons and the row's own tag. A row built as a <button> could not
            // hold them, and that is exactly the defect this replaced.
            rowTag: (function () {
              try {
                const row = state.body && state.body.querySelector('[data-dse-ui="pin-row"]');
                return row ? String(row.tagName || '') : '';
              } catch (e) { return 'threw'; }
            })(),
            acts: (function () {
              try {
                return state.body ? state.body.querySelectorAll('.dse-pin-act').length : 0;
              } catch (e) { return -1; }
            })(),
            // The order as rendered, left to right. Compared against the shipped
            // row's ⋯ / 归档 / 置顶 so a regression here is visible without a
            // screenshot.
            actLabels: (function () {
              try {
                const row = state.body && state.body.querySelector('[data-dse-ui="pin-row"]');
                if (!row) return [];
                return Array.prototype.map.call(
                  row.querySelectorAll('.dse-pin-act'),
                  function (b) { return b.getAttribute('aria-label') || ''; }
                );
              } catch (e) { return ['threw']; }
            })(),
            // The live half of the first row, so a broken mirror shows up in the
            // log instead of only on screen: `slotDot` is non-empty exactly when
            // the shipped row is showing a status dot (busy / waiting), and
            // `timeText` is the pending label or the relative time.
            state0: (function () {
              try {
                const row = state.body && state.body.querySelector('[data-dse-ui="pin-row"]');
                if (!row) return null;
                const slot = row.querySelector('.dse-pin-slot');
                const time = row.querySelector('.dse-pin-time');
                const label = row.querySelector('.dse-pin-label');
                const rb = row.getBoundingClientRect();
                const sb = slot ? slot.getBoundingClientRect() : null;
                const tb = time ? time.getBoundingClientRect() : null;
                const lb = label ? label.getBoundingClientRect() : null;
                const dot = slot && slot.querySelector('svg,[class*=dot]');
                return {
                  slotHtml: slot ? slot.innerHTML.length : -1,
                  // SVG elements report className as an SVGAnimatedString, so the
                  // attribute is the only honest way to name the dot's class.
                  dotCls: dot ? String(dot.getAttribute('class') || dot.tagName) : '',
                  dotW: sb ? Math.round(sb.width) : -1,
                  timeText: time ? String(time.textContent || '').slice(0, 20) : '',
                  timeW: tb ? Math.round(tb.width) : -1,
                  labelW: lb ? Math.round(lb.width) : -1,
                  rowW: Math.round(rb.width),
                  rowH: Math.round(rb.height)
                };
              } catch (e) { return 'threw'; }
            })(),
            lastError: state.lastError
          };
        }
      };
    }

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
              pins: (function () { try { return window.__dsePinnedSection && window.__dsePinnedSection.stats ? window.__dsePinnedSection.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })(),
              // The footer lift has to be told apart from "no footer control
              // exists": it reports how many controls it saw, how many rows it
              // built, and why it last gave up.
              lift: (function () { try { return window.__dseFooterLift && window.__dseFooterLift.stats ? window.__dseFooterLift.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })(),
              dragPolish: (function () { try { return window.__dseDragPolish && window.__dseDragPolish.stats ? window.__dseDragPolish.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })(),
              // The View tab row belongs to the Host, so its state has to be
              // readable on its own: what the DOM shows, what order this module
              // applied, and what the store remembers are three different things.
              viewTabs: (function () { try { return window.__dseViewTabs && window.__dseViewTabs.stats ? window.__dseViewTabs.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })(),
              // Sinking archived rows is a paint-order change, so the only
              // honest report is how many containers were touched and how many
              // wrappers actually moved on the last pass.
              archiveSink: (function () { try { return window.__dseArchive && window.__dseArchive.stats ? window.__dseArchive.stats() : null; } catch (e) { return 'threw:' + (e && e.message); } })()
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
    function startNativeDragPolish(ctx) {
      const state = {
        before: null, orderSig: '', rafs: [], pending: false, plays: 0, rows: 0,
        lastError: '', disposed: false, observer: null, timer: 0, pressed: false,
        samples: 0, commits: 0, skipped: 0, nativeDrag: false, deferred: false, watchdog: 0,
        // Drag preview: which row is being carried, how far each row is
        // currently displaced, and the gap index already open.
        dragKey: '', previewIdx: -1, previewMoves: 0, dragUnit: null,
        previewSlots: null, previewShift: null, pendingCollapse: false,
        // Resting geometry of the slots, measured once per gesture right after
        // the dragged unit collapses. `slotBase` is `{tops, highs, avg}` and is
        // the only source of position for the gap test — see `measureSlots`.
        slotBase: null,
        // The card that rides the pointer. It is a real element rather than a
        // `setDragImage` snapshot, so it has to be created and torn down here;
        // `cardTop` is the layout Y it started from and `cardOff` the press
        // offset inside it, which together turn a pointer position into the
        // translateY the card needs. `cardY` is where the card currently is and
        // `cardTarget` where it should end up; the frame loop in driveCard closes
        // that gap, because `dragover` arrives too irregularly to drive motion
        // directly.
        card: null, cardTop: 0, cardOff: 0, cardY: 0, cardTarget: 0, cardRaf: 0,
        overSamples: 0, lastOver: 0,
        // The Host commits a reorder by writing its own view store in
        // localStorage, and the plugin cannot write that key. So "did the drop
        // commit" is not something this module can infer from its own state:
        // it has to read the store before and after and compare. Without this,
        // a preview that never reached the Host looks exactly like a commit
        // that was then overwritten.
        orderBefore: '', drops: 0, dropsCommitted: 0, lastStore: '',

        // Recorded on pointerdown: `dragstart` reports clientY as 0 on some
        // platforms, and the drag image offset is derived from where inside the
        // row the press actually landed.
        pressY: 0,
        // Which surface the current gesture belongs to: 'session' or
        // 'workspace'. They are reordered by different Host services and their
        // movable units nest at different depths, so everything downstream
        // (the unit, the slots, the diagnostic label) branches on this.
        dragKind: '',
        // Height of the dragged unit as measured before it collapsed. Neighbours
        // yield exactly this much: Sessions are all 32px so an average row
        // height would do, but a Workspace group carries its whole contents and
        // groups differ in size, so the average would open the wrong gap.
        dragH: 0
      };
      const ROW_ATTR = 'data-row-key';
      const ROW_SELECTOR = 'div[' + ROW_ATTR + '^="session:"]';
      // Workspace rows are a second, separate reorder surface: dragging one
      // moves the whole group (its header and every Session under it), and the
      // Host commits it through a different service call. They share the same
      // `data-row-key` attribute but a different prefix, which is why the
      // selector above never matched them and the workspace drag kept its
      // shipped insertion caret for so long.
      const WS_SELECTOR = 'div[' + ROW_ATTR + '^="workspace:"]';

      function wsRows() {
        const out = [];
        try {
          const nodes = document.querySelectorAll(WS_SELECTOR);
          for (let i = 0; i < nodes.length; i++) out.push(nodes[i]);
        } catch (e) {}
        return out;
      }
      function sessionRows() {
        const out = [];
        try {
          const nodes = document.querySelectorAll(ROW_SELECTOR);
          for (let i = 0; i < nodes.length; i++) out.push(nodes[i]);
        } catch (e) {}
        return out;
      }
      // Everything whose vertical movement this module animates after a drop.
      //
      // A Workspace drag commits a whole-group reorder, so the sections are
      // just as much "a row that moved" as the Sessions inside them — and if
      // they are not sampled, a workspace drop settles with the shipped snap
      // while Session drops glide, which is the inconsistency being fixed here.
      // The two kinds never collide: their keys are prefixed differently.
      function trackedRows() {
        const out = sessionRows();
        const ws = wsRows();
        for (let i = 0; i < ws.length; i++) out.push(ws[i]);
        return out;
      }
      function sigOf(rows) {
        const parts = [];
        for (let i = 0; i < rows.length; i++) parts.push(rows[i].getAttribute(ROW_ATTR) || '');
        return parts.join('\u0001');
      }
      // Layout Y in document space, summed up the offsetParent chain.
      //
      // `offsetTop` alone is useless here and that cost a full round: the shipped
      // list renders every Session row inside its own wrapper, so each row's
      // offsetParent is that wrapper and offsetTop stays 0 no matter where the
      // row ends up. Comparing it across a reorder therefore always reported
      // "nothing moved", which is exactly the `moved: 0` this build logged.
      // getBoundingClientRect would see the movement, but it also includes any
      // transform an in-flight animation left behind, so a baseline taken during
      // a previous reorder records a sliding position as if it were layout.
      // Summing offsetTop ignores transforms by definition and still spans
      // containers, so it is stable to sample and honest about movement.
      function layoutY(el) {
        let y = 0;
        let node = el;
        for (let hops = 0; node && hops < 32; hops++) {
          y += node.offsetTop || 0;
          node = node.offsetParent;
        }
        return y;
      }
      function capture() {
        const rows = trackedRows();
        const before = Object.create(null);
        for (let i = 0; i < rows.length; i++) {
          const key = rows[i].getAttribute(ROW_ATTR) || '';
          if (!key) continue;
          try { before[key] = layoutY(rows[i]); } catch (e) { continue; }
        }
        state.samples++;
        state.rows = rows.length;
        state.orderSig = sigOf(rows);
        state.before = rows.length > 1 ? before : null;
        return state.before;
      }
      function play() {
        const before = state.before;
        state.before = null;
        state.pending = false;
        if (!before) return 0;
        const rows = trackedRows();
        const tracked = [];
        let moved = 0;
        for (let i = 0; i < rows.length; i++) {
          const key = rows[i].getAttribute(ROW_ATTR) || '';
          if (!(key in before)) continue;
          let now = 0;
          try { now = layoutY(rows[i]); } catch (e) { continue; }
          const dy = before[key] - now;
          // Sub-pixel noise is not a move; treating it as one would leave a
          // transition on every row after every unrelated re-render.
          if (!dy || Math.abs(dy) < 1) continue;
          moved++;
          // Web Animations rather than a CSS transition. Two earlier attempts
          // set a transition and the row still snapped: a transition only runs
          // if the browser sees two computed styles in successive style
          // resolutions, and a React commit can resolve style again in between,
          // collapsing the pair into one. An Animation object owns its own
          // keyframes, so nothing in the commit path can cancel it.
          try {
            const el = rows[i];
            el.style.transform = '';
            const anim = el.animate(
              [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(0)' }],
              // Identical to `.dse-space` / `.dse-flip`, the transition the rest
              // of this sidebar already uses. An earlier version ran 260ms on a
              // gentler curve because that curve alone made the travel legible,
              // but a Session drag that settles at a different tempo from every
              // neighbouring sidebar drag reads as a different feature, and
              // matching the shipped motion is what the user is asking for.
              { duration: MOVE_MS, easing: MOVE_EASE, fill: 'none' }
            );
            tracked.push({ key: key, el: el, dy: dy, anim: anim });
          } catch (e) {}
        }
        state.commits++;
        state.orderSig = sigOf(rows);
        if (moved) {
          state.plays++;
          // A position series, not a single transform reading. transform and
          // playState both look healthy on an element the compositor never
          // painted, and the only ground truth is the rectangle actually
          // travelling over time. Flat numbers across the window mean the move
          // collapsed; a spread means the user can see it.
          try {
            const probe = tracked[0];
            if (probe) {
              const series = [];
              const take = () => {
                try { series.push(Math.round(probe.el.getBoundingClientRect().top)); }
                catch (e) { series.push(-1); }
              };
              take();
              window.setTimeout(take, 70);
              window.setTimeout(take, 150);
              window.setTimeout(() => {
                take();
                let st = '';
                try { st = probe.anim && probe.anim.playState ? String(probe.anim.playState) : 'no-anim'; } catch (e) { st = 'threw'; }
                report({
                  event: 'dp-track', version: VERSION, moved: moved, key: probe.key,
                  dy: Math.round(probe.dy), series: series, st: st, native: !!state.nativeDrag
                }, true);
              }, 260);
            }
          } catch (e) {}
        } else {
          state.skipped++;
        }
        report({ event: 'dp-play', version: VERSION, moved: moved, rows: rows.length, native: !!state.nativeDrag }, true);
        // Re-sample straight away. A drag reorders repeatedly as the pointer
        // crosses each row, and clearing the baseline after the first pass left
        // every later reorder in the same gesture with nothing to animate from —
        // which is why only the first hop looked smooth and the rest snapped.
        // The cost is that `before` now holds the just-settled arrangement,
        // which is exactly what the next reorder needs.
        try { capture(); } catch (e) {}
        return moved;
      }
      function schedule() {
        if (state.disposed || !state.before || state.pending) return;
        if (state.nativeDrag) {
          // Deferred, not dropped. Mid-gesture the preview owns every row's
          // position, and a Host re-render during `dragover` would play a FLIP
          // against the same transform the preview is writing. The rows the
          // drop reorders still need to settle, so the request is remembered
          // and replayed by `onNativeEnd` once the gesture is over.
          state.deferred = true;
          return;
        }
        // Play immediately, including mid-drag.
        //
        // An earlier build deferred every play until `dragend`, on the theory
        // that the browser freezes painting while it owns a native HTML5 drag.
        // That theory is wrong: the shipped list draws its own insertion line
        // from a React state change during `dragover`, and an insertion line can
        // only appear if the page is still painting. Deferring therefore did
        // nothing except move the animation to after the drop, which is the one
        // moment where "make way" is pointless — the user asked for rows to slide
        // aside as the pointer passes them, not to settle after the fact.
        state.pending = true;
        // One frame: the observer callback already runs after React wrote the
        // new order, so the next paint is the first with correct geometry.
        const raf = window.requestAnimationFrame(() => {
          try { play(); } catch (e) { state.lastError = String((e && e.message) || e); }
        });
        state.rafs.push(raf);
      }
      function onMutate(records) {
        if (state.disposed || !state.before) return;
        let structural = false;
        for (let i = 0; i < records.length; i++) {
          if (records[i].type === 'childList') { structural = true; break; }
        }
        if (!structural) return;
        // Cheap first pass: most body churn (toasts, badges, portals) leaves the
        // Session row order untouched, and those must not animate anything.
        let sig = '';
        try { sig = sigOf(trackedRows()); } catch (e) { return; }
        if (!sig || sig === state.orderSig) return;
        if (state.timer) { try { window.clearTimeout(state.timer); } catch (e) {} }
        // Coalesced: one reorder arrives as several records, and animating each
        // would restart the transition mid-flight.
        state.timer = window.setTimeout(() => { state.timer = 0; schedule(); }, 0);
      }
      // ── drag preview ─────────────────────────────────────────────────────
      //
      // The Host commits a reorder from its own HTML5 drag: `dragstart` fills
      // the dataTransfer, `dragover` records which half of which row the pointer
      // is over, and `drop` commits by writing its browser-local view store.
      // None of that is replaceable from a plugin — the committed order is
      // derived from the Host's private `drag` state, and the store it writes is
      // not reachable. So the gesture stays the Host's and only its appearance
      // becomes ours: no insertion caret, the carried row follows the pointer,
      // and the rows it passes open the gap immediately. Because the preview
      // shifts the very rectangles the Host measures for its own drop decision,
      // preview and commit cannot disagree about where the row belongs.

      function rowsIn(el) {
        try { return el && el.querySelectorAll ? el.querySelectorAll(ROW_SELECTOR).length : 0; }
        catch (e) { return 0; }
      }
      function wsIn(el) {
        try { return el && el.querySelectorAll ? el.querySelectorAll(WS_SELECTOR).length : 0; }
        catch (e) { return 0; }
      }
      // The smallest ancestor holding exactly this one row. Every Session is
      // wrapped in its own span inside a groupSection, so moving the row div
      // alone would leave the wrapper — and whatever chrome it carries — behind,
      // and the next row would land in the wrapper rather than beside it.
      //
      // The counter is a parameter because the two drag surfaces nest the same
      // way but at different depths: a Session is alone in its wrapper span
      // (one level up), while a Workspace row belongs to its whole groupSection
      // (two levels up, because dragging a Workspace carries its Sessions too).
      // Counting with the wrong kind walks straight past the right unit.
      function unitOfRow(row, count) {
        let unit = row;
        for (let hops = 0; unit.parentElement && count(unit.parentElement) <= 1 && hops < 8; hops++) {
          unit = unit.parentElement;
        }
        return unit;
      }
      function unitOf(row) { return unitOfRow(row, rowsIn); }
      // A Workspace is not found by counting rows at all.
      //
      // Counting was the Session rule and it does not transfer: a Workspace row
      // sits in a wrapper that holds exactly one Workspace, so the count-based
      // walk stopped at that wrapper and the drag picked up a 34px title row
      // instead of the group — the Sessions under it stayed behind and the
      // preview opened a one-line gap for a block that is several lines tall.
      // The shipped markup already names the group: each one is a
      // `div[class*=groupSection]`, and its parent is the reorder container
      // (`div[role=group]` when nested, the list itself at the top). So the
      // nearest groupSection is the unit, and the container is read from it.
      function wsUnitOf(row) {
        let node = row;
        for (let hops = 0; node && hops < 10; hops++) {
          const cls = String(node.className || '');
          if (cls.indexOf('groupSection') >= 0) return node;
          node = node.parentElement;
        }
        return row;
      }
      // Slots are the siblings of the dragged unit that can trade places with
      // it. A container that exposes fewer than one of them has nothing to
      // reorder.
      //
      // Two shapes, so two rules. A Session slot is a sibling holding exactly
      // one Session (its wrapper). A Workspace slot is a sibling `groupSection`
      // regardless of how many Sessions it carries — and that is the whole
      // point: a group with children under it is still one group, and filtering
      // it out by count dropped every parent group from the candidate list, so
      // a parent could never be displaced by the preview even though the Host
      // happily reorders it.
      function openSlots(unit, count, mode) {
        const holder = unit && unit.parentElement;
        if (!holder || !holder.children) return null;
        const units = [];
        for (let i = 0; i < holder.children.length; i++) {
          const kid = holder.children[i];
          if (!kid || kid.nodeType !== 1 || kid === unit) continue;
          if (mode === 'workspace') {
            if (String(kid.className || '').indexOf('groupSection') < 0) continue;
          } else if (count(kid) !== 1) continue;
          units.push(kid);
        }
        if (!units.length) return null;
        return { holder: holder, units: units };
      }
      function clearShift() {
        const units = state.previewSlots ? state.previewSlots.units : null;
        if (units) {
          for (let i = 0; i < units.length; i++) {
            try {
              units[i].classList.remove('dse-space');
              units[i].style.transform = '';
            } catch (e) {}
          }
        }
        state.previewSlots = null;
        state.previewIdx = -1;
        state.previewMoves = 0;
        state.previewShift = null;
      }
      // Recompute the gap from the pointer and displace the neighbours into it.
      //
      // Only transforms are written, never DOM order: React owns the order and
      // would put a hand-moved node straight back, and a real reorder mid-drag
      // would also change what the Host thinks it is dragging.
      // Record every slot's resting position once per gesture.
      //
      // Measuring `getBoundingClientRect` on each `dragover` and subtracting the
      // shift we *intended* is wrong while `.dse-space` is still transitioning:
      // the rect reports the in-flight position, the correction reports the
      // final one, and the mismatch makes the gap flip back and forth on every
      // event. The slots only move when the dragged unit collapses, so they are
      // measured at that one moment and every later decision is arithmetic on
      // these constants — the same shape the rail drag uses.
      function measureSlots() {
        const slots = state.previewSlots;
        if (!slots) return null;
        const units = slots.units;
        const tops = [];
        const highs = [];
        let sum = 0;
        for (let i = 0; i < units.length; i++) {
          let box = null;
          try { box = units[i].getBoundingClientRect(); } catch (e) { box = null; }
          if (!box) { tops.push(0); highs.push(0); continue; }
          tops.push(box.top);
          highs.push(box.height);
          sum += box.height;
        }
        // `previewAt` walks the units top-down and stops at the first midpoint
        // below the pointer, so the list MUST be sorted by real position. DOM
        // order is not that order: sinking archived rows writes `order`, which
        // moves them on screen while leaving them where React put them in the
        // tree. Sorting here keeps the geometry honest without reordering the
        // caller's array of elements.
        const order = [];
        for (let i = 0; i < units.length; i++) order.push(i);
        order.sort(function (a, b) { return tops[a] - tops[b]; });
        const st = [];
        const sh = [];
        const su = [];
        for (let i = 0; i < order.length; i++) {
          st.push(tops[order[i]]);
          sh.push(highs[order[i]]);
          su.push(units[order[i]]);
        }
        slots.units = su;
        const base = { tops: st, highs: sh, avg: su.length ? sum / su.length : 0 };
        state.slotBase = base;
        return base;
      }
      function previewAt(clientY) {
        const slots = state.previewSlots;
        if (!slots) return;
        const units = slots.units;
        const shift = state.previewShift || (state.previewShift = []);
        const base = state.slotBase || measureSlots();
        if (!base || !units.length || !base.avg) return;
        const tops = base.tops;
        const highs = base.highs;
        const step = base.avg;
        // Gap index: insert before the first unit whose base midpoint is below
        // the pointer; past all midpoints means insert at the end. The source
        // slot is already collapsed, so every unit's current slot is its final
        // slot minus whatever this formula adds back.
        //
        // The midpoints carry a hysteresis band. `dragover` repeats while the
        // pointer is stationary, and a bare midpoint test flips its answer on
        // sub-pixel noise — the gap then reopens one row up and down, which is
        // exactly the flicker the rail drag does not have.
        //
        // The threshold is asymmetric around the midpoint and depends on which
        // side the gap is currently on: to advance past unit i the pointer must
        // travel a third of a row BELOW mid_i, and to retreat back above it must
        // travel a third of a row ABOVE mid_i. A pointer resting on a boundary
        // therefore keeps whichever answer it already had.
        let gap = units.length;
        for (let i = 0; i < units.length; i++) {
          // The band is a share of THIS unit's height, not of the average.
          // Sessions are all 32px so the two were interchangeable, but Workspace
          // groups measure anywhere from 34px to several hundred, and an average
          // band is far too wide for the short ones — the pointer would have to
          // travel most of a small group before the gap acknowledged it, while a
          // tall group flipped on a fraction of itself.
          const own = highs[i] || step;
          const mid = tops[i] + own / 2;
          const localBand = Math.max(4, own / 3);
          const threshold = mid + (state.previewIdx > i ? -localBand : localBand);
          if (clientY < threshold) { gap = i; break; }
        }
        if (gap === state.previewIdx) return;
        state.previewIdx = gap;
        state.previewMoves++;
        // How far the neighbours have to yield is the height of what is being
        // dragged, measured before it was collapsed — not the average row
        // height. Sessions are all 32px so the two coincide, but a Workspace
        // carries its whole group and no two groups are the same height, so an
        // average would open a gap of the wrong size at every step.
        const yieldBy = state.dragH || step;
        for (let i = 0; i < units.length; i++) {
          // Dropping into `gap` means the source row lands before unit[gap], so
          // every unit from that position on yields one row of space to it and
          // the ones above the gap stay put.
          const dy = i >= gap ? yieldBy : 0;
          shift[i] = dy;
          const el = units[i];
          try {
            if (!dy) {
              el.classList.remove('dse-space');
              el.style.transform = '';
              continue;
            }
            el.classList.add('dse-space');
            el.style.transform = 'translateY(' + dy + 'px)';
          } catch (e) {}
        }
      }
      // Capture must reflect the arrangement the drag started from, so it is
      // taken on press. The idle refresh keeps it usable when a reorder happens
      // without a press (a menu action, a keyboard shortcut).
      function onPointerDown(event) {
        if (state.disposed) return;
        if (event && event.button !== undefined && event.button !== 0) return;
        state.pressed = true;
        // The press point is the only record of where inside the row the drag
        // started. It is read here because `dragstart` reports the pointer
        // position as 0/0 on some platforms, and the drag image offset is
        // computed from it later.
        try { state.pressY = Number(event.clientY) || 0; } catch (e) { state.pressY = 0; }
        try { capture(); } catch (e) { state.lastError = String((e && e.message) || e); }
      }
      function onPointerUp() {
        state.pressed = false;
      }
      // The carried row follows the pointer because the browser is told to draw
      // the row itself as its drag image.
      //
      // Cloning the row into a fixed element and moving it on `dragover` was the
      // first attempt, and it is worse for a reason that is easy to miss:
      // `dragover` is a synthetic, throttled event — it fires far less often
      // than a pointer moves, so a clone driven by it lags the cursor and reads
      // as stutter. `setDragImage` hands the following to the compositor at
      // native frame rate. The catch is that the browser snapshots the element
      // at drag start, so any styling must already be in place when the drag
      // begins — which is why the source slot is collapsed BEFORE this call,
      // not after.
      const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      // Every carried card currently in the document.
      //
      // `state.card` only remembers the one THIS instance built, which is the
      // hole a leftover row keeps falling through: a hot reload installs a fresh
      // module whose `state.card` is null while the previous generation's card is
      // still hanging over the list with nothing pointing at it. The class name
      // is no better as an inventory — earlier generations in this same file
      // built the card under other names (`.dse-ghost`), so a selector for today's
      // name cannot see yesterday's leftover.
      //
      // What every generation has in common is the shape: a node parented to
      // `document.body`, outside the app root, carrying a copy of a Session row.
      // No legitimate body child contains a row, so that containment is the
      // reliable test.
      function carriedNodes() {
        const found = [];
        try {
          const marked = document.querySelectorAll('.dse-card, .dse-ghost, [data-dse-carried]');
          for (let i = 0; i < marked.length; i++) found.push(marked[i]);
        } catch (e) {}
        // A node can BE a carried row rather than contain one.
        //
        // The card is a clone of the row's wrapper, so it carries the wrapper's
        // own class and nothing else once its mark is lost — and every earlier
        // generation of this file marked it differently. Testing only the
        // descendants therefore missed the leftover entirely: the stray node was
        // the row, not a container of one, so `querySelector` on it came back
        // empty and the sweep walked past it on every pass.
        const isUnit = function (el) {
          if (!el || el.nodeType !== 1) return false;
          try {
            if (el.getAttribute && el.getAttribute('data-row-key')) return true;
            if (el.getAttribute && el.getAttribute('role') === 'treeitem') return true;
            const cn = String(el.className || '');
            if (cn.indexOf('_root_38jqx') >= 0) return true;
          } catch (e) {}
          return false;
        };
        try {
          const kids = document.body.children;
          for (let i = 0; i < kids.length; i++) {
            const el = kids[i];
            if (!el || found.indexOf(el) >= 0) continue;
            const tag = String(el.tagName || '').toUpperCase();
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'TEMPLATE') continue;
            if (el.id === 'root' || el.id === '__next') continue;
            let inside = null;
            try { inside = el.querySelector('[data-row-key], [role="treeitem"], span[class*="_root_38jqx"]'); } catch (e) {}
            if (isUnit(el) || inside) found.push(el);
          }
        } catch (e) {}
        return found;
      }
      function scrubCards() {
        const stray = carriedNodes();
        for (let i = 0; i < stray.length; i++) {
          try { if (stray[i].parentNode) stray[i].parentNode.removeChild(stray[i]); } catch (e) {}
        }
      }
      // Vacate the carried row's own slot.
      //
      // The preview only works if the neighbours move into the space the row
      // left. Leaving it in flow and fading it makes the row that shuffles up
      // overlap it, because both are still occupying a row's worth of height.
      // Collapsing it means the list briefly shows n-1 rows and the gap opens
      // exactly where the pointer asks for it.
      function collapseUnit(unit) {
        try {
          unit.style.height = '0px';
          unit.style.overflow = 'hidden';
          unit.style.marginTop = '0px';
          unit.style.marginBottom = '0px';
          unit.style.visibility = 'hidden';
        } catch (e) {}
      }
      function restoreUnit() {
        const el = state.dragUnit;
        if (!el) return;
        // Every inline property written by collapseUnit is cleared rather than
        // restored from a capture: nothing else in this module styles these, and
        // replaying captured values would re-write whatever the row happened to
        // carry before the drag — which, if React re-created the row mid-drag,
        // belongs to a node that no longer exists.
        try {
          el.classList.remove('dse-space');
          el.style.height = '';
          el.style.overflow = '';
          el.style.marginTop = '';
          el.style.marginBottom = '';
          el.style.visibility = '';
        } catch (e) {}
      }
      // Text of every element that directly holds a Session row.
      //
      // The list renders each Session inside a wrapper (`span._root_38jqx_3`),
      // and the pinned section clones are supposed to be the only rows outside
      // those wrappers. A wrapper count that exceeds the row count means
      // something is rendering a Session twice — which is what a stray row
      // looks like from the outside. This walks the wrappers themselves rather
      // than trusting any of our own bookkeeping.
      function unitScan() {
        const out = [];
        try {
          const units = document.querySelectorAll('span[class*="_root_38jqx"]');
          for (let i = 0; i < units.length && i < 16; i++) {
            const el = units[i];
            const rows = el.querySelectorAll('div[data-row-key^="session:"]');
            let txt = '';
            try { txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30); } catch (e) {}
            out.push({
              n: rows.length,
              k: rows.length === 1 ? String(rows[0].getAttribute('data-row-key') || '').slice(8, 22) : '',
              t: txt,
              h: (function () { try { return Math.round(el.getBoundingClientRect().height); } catch (e) { return -1; } })(),
              y: (function () { try { return Math.round(el.getBoundingClientRect().top); } catch (e) { return -1; } })(),
              vis: (function () { try { return window.getComputedStyle(el).visibility; } catch (e) { return ''; } })(),
              d: (function () { try { return window.getComputedStyle(el).display; } catch (e) { return ''; } })(),
              rd: rows.length === 1 ? (function () { try { return window.getComputedStyle(rows[0]).display; } catch (e) { return ''; } })() : ''
            });
          }
        } catch (e) { return 'threw:' + (e && e.message); }
        return out;
      }
      // What the drag would resolve each row to, without needing a drag.
      //
      // Every regression this file has had in the reorder preview came down to
      // the same question — which element is the unit, and which of its siblings
      // are slots — and answering it from the log after a drag is useless: the
      // log only holds the last 50 events, so a snapshot from a minute ago has
      // already been pushed out by the time the report is read. Running the same
      // three functions the drag uses, over the rows that exist right now, makes
      // the answer observable at any moment instead of only while a gesture is
      // in flight.
      function slotScan() {
        const out = [];
        try {
          const all = trackedRows();
          for (let i = 0; i < all.length && i < 12; i++) {
            const row = all[i];
            const key = String(row.getAttribute(ROW_ATTR) || '');
            const isWs = key.indexOf('workspace:') === 0;
            let unit = null;
            let slots = null;
            try {
              unit = isWs ? wsUnitOf(row) : unitOf(row);
              slots = openSlots(unit, isWs ? wsIn : rowsIn, isWs ? 'workspace' : 'session');
            } catch (e) {
              out.push({ k: key.slice(0, 18), e: String((e && e.message) || e) });
              continue;
            }
            const holder = unit ? unit.parentElement : null;
            out.push({
              k: key.slice(0, 18),
              kind: isWs ? 'w' : 's',
              u: unit ? String(unit.className || '').slice(0, 22) : '',
              same: unit === row,
              kid: holder ? holder.children.length : -1,
              // How many of the holder's children each kind of counter accepts.
              // A slot count of 1 is the shape that can only trade with one
              // neighbour, which is exactly what a broken preview looks like.
              slots: slots ? slots.units.length : -1,
              h: (function () { try { return Math.round(unit.getBoundingClientRect().height); } catch (e) { return -1; } })()
            });
          }
        } catch (e) { return 'threw:' + (e && e.message); }
        return out;
      }
      // Resolved values of the surface tokens this file draws with.
      //
      // A token that resolves to `transparent` (or fails to resolve at all)
      // leaves the card with no fill, and the only way to tell that from a
      // merely-too-light fill is to read the computed colour. The probe is taken
      // on a throwaway probe element so it measures what a card would actually
      // get, not what the variable happens to say in the document root.
      function tokenScan() {
        const names = [
          '--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2',
          '--dsw-alias-bg-overlay', '--dsw-specific-sidebar-fill',
          '--dsw-alias-border-l1', '--dsw-alias-border-l2'
        ];
        const out = [];
        let probe = null;
        try {
          probe = document.createElement('div');
          probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px';
          document.body.appendChild(probe);
        } catch (e) { probe = null; }
        for (let i = 0; i < names.length; i++) {
          let val = '';
          let got = '';
          try {
            val = String(window.getComputedStyle(document.documentElement).getPropertyValue(names[i]) || '').trim();
          } catch (e) {}
          try {
            if (probe) {
              probe.style.background = 'var(' + names[i] + ')';
              got = String(window.getComputedStyle(probe).backgroundColor || '');
            }
          } catch (e) {}
          out.push({ n: names[i].replace('--dsw-alias-', '').replace('--dsw-specific-', 'sp:'), v: val.slice(0, 26), bg: got });
        }
        try { if (probe && probe.parentNode) probe.parentNode.removeChild(probe); } catch (e) {}
        // What a card would actually look like, and what the row inside it
        // paints on top.
        //
        // Reading the token is not enough: the card is a clone of the row's
        // wrapper, so whatever the shipped row styles itself with rides along
        // and can cover the fill this module chose. Only the computed colours of
        // the two real layers answer "why does it look white".
        const look = {};
        try {
          const card = document.createElement('div');
          card.className = 'dse-card';
          card.style.cssText = 'position:fixed;left:-9999px;top:0;width:120px;height:32px';
          document.body.appendChild(card);
          const cs = window.getComputedStyle(card);
          look.cardBg = String(cs.backgroundColor || '');
          look.cardOpacity = String(cs.opacity || '');
          look.cardBorder = String(cs.borderTopColor || '') + ' / ' + String(cs.borderTopWidth || '');
          const rail = document.createElement('div');
          rail.className = 'dse-lift-row dse-dragging';
          rail.style.cssText = 'position:fixed;left:-9999px;top:0;width:120px';
          document.body.appendChild(rail);
          const rs = window.getComputedStyle(rail);
          look.railBg = String(rs.backgroundColor || '');
          look.railOpacity = String(rs.opacity || '');
          look.railBorder = String(rs.borderTopColor || '') + ' / ' + String(rs.borderTopWidth || '');
          try { card.parentNode.removeChild(card); } catch (e) {}
          try { rail.parentNode.removeChild(rail); } catch (e) {}
        } catch (e) { look.err = String((e && e.message) || e); }
        // What the shipped Session row paints underneath the card's fill.
        //
        // The card is a clone of the row's wrapper, so the row travels with it
        // and draws its own background on top of whatever the card sets. In this
        // light theme a plain row resolves to a near-white surface, which covers
        // the grey fill entirely — the card is correct in isolation and looks
        // bleached on screen. These are the layers that actually stack.
        try {
          const live = document.querySelector('div[data-row-key^="session:"]');
          if (live) {
            const layers = [];
            let node = live;
            for (let i = 0; i < 4 && node; i++) {
              const cs2 = window.getComputedStyle(node);
              layers.push({
                tag: String(node.tagName || ''),
                cls: String(node.className || '').slice(0, 30),
                bg: String(cs2.backgroundColor || ''),
                op: String(cs2.opacity || '')
              });
              node = node.parentElement;
            }
            look.rowLayers = layers;
          }
        } catch (e) { look.rowErr = String((e && e.message) || e); }
        // What the clone inherits that the rail row never has.
        //
        // The card is `unit.cloneNode(true)`, so every descendant keeps its
        // classes — including `selected`/hover state classes the Host applied to
        // the row being dragged. A row painted as "current" carries a background
        // of its own, and that background rides the card and covers the grey
        // this module chose. The card is sized to the row and `overflow:hidden`,
        // so the fill shows through only where the descendants are transparent.
        try {
          const live = document.querySelector('div[data-row-key^="session:"]');
          if (live) {
            const unit = unitOf(live);
            const painted = [];
            const walk = function (node, depth) {
              if (!node || node.nodeType !== 1 || depth > 3) return;
              const cs3 = window.getComputedStyle(node);
              const bg = String(cs3.backgroundColor || '');
              if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                painted.push({
                  d: depth, tag: String(node.tagName || ''),
                  cls: String(node.className || '').slice(0, 34), bg: bg
                });
              }
              const kids = node.children;
              for (let i = 0; i < kids.length && i < 6; i++) walk(kids[i], depth + 1);
            };
            walk(unit, 0);
            look.painted = painted;
            look.unitCls = String(unit.className || '').slice(0, 40);
            look.rowCls = String(live.className || '').slice(0, 60);
          }
        } catch (e) { look.paintErr = String((e && e.message) || e); }
        out.push({ n: 'LOOK', v: '', bg: JSON.stringify(look) });
        return out;
      }
      // Walk the carried card towards the pointer's last known position, one
      // frame at a time.
      //
      // Two things make this necessary and neither is cosmetic. `dragover` is
      // delivered on a throttled, jittery schedule, so writing the transform
      // straight from that handler advances the card in uneven jumps. And the
      // card has to keep moving while the pointer travels between those events,
      // which nothing event-driven can do. Interpolating once per frame turns
      // both into one smooth motion, and it is the same visual result the rail
      // drag gets for free from native-rate pointermove.
      //
      // The catch-up factor is high enough to stay under the cursor and low
      // enough that a burst of events cannot reproduce the staircase.
      const CARD_CATCH_UP = 0.35;
      function driveCard() {
        if (state.cardRaf) return;
        const step = function () {
          state.cardRaf = 0;
          const card = state.card;
          if (!card || !card.parentNode) return;
          const target = Number(state.cardTarget) || 0;
          const now = Number(state.cardY) || 0;
          const delta = target - now;
          if (Math.abs(delta) < 0.5) {
            // Land exactly, then stop scheduling. Leaving a sub-pixel residual
            // would keep the loop alive for the whole drag and re-round every
            // frame, which by itself reads as shimmer.
            if (now !== target) {
              state.cardY = target;
              try { card.style.transform = 'translateY(' + target + 'px)'; } catch (e) {}
            }
            return;
          }
          const next = now + delta * CARD_CATCH_UP;
          state.cardY = next;
          try { card.style.transform = 'translateY(' + next + 'px)'; } catch (e) {}
          state.cardRaf = window.requestAnimationFrame(step);
        };
        try { state.cardRaf = window.requestAnimationFrame(step); } catch (e) { state.cardRaf = 0; }
      }
      function onNativeStart(event) {
        state.nativeDrag = true;
        // Anything left over from a previous gesture goes first: a new drag is
        // proof the old one is over, whatever path it ended by.
        scrubCards();
        state.card = null;
        // A drag that ends without `dragend` (released outside the window, or
        // cancelled by the OS) must not wedge the preview on screen forever.
        if (state.watchdog) { try { window.clearTimeout(state.watchdog); } catch (e) {} }
        state.watchdog = window.setTimeout(() => { state.watchdog = 0; onNativeEnd(); }, 8000);
        try {
          const target = event && event.target;
          // Two reorder surfaces share the row attribute but not the prefix, so
          // both are looked up before giving up. A Session is moved on its own;
          // a Workspace is moved as its whole group (its title row plus every
          // Session under it), which is why its unit is two levels up and its
          // slots are counted among groupSections rather than rows.
          const hitSession = target && target.closest ? target.closest(ROW_SELECTOR) : null;
          const hitWorkspace = hitSession
            ? null
            : (target && target.closest ? target.closest(WS_SELECTOR) : null);
          const row = hitSession || hitWorkspace;
          if (!row) return;
          state.orderBefore = readStore();
          const isWs = !!hitWorkspace;
          const unit = isWs ? wsUnitOf(row) : unitOf(row);
          const slots = openSlots(unit, isWs ? wsIn : rowsIn, isWs ? 'workspace' : 'session');
          state.dragKind = isWs ? 'workspace' : 'session';
          state.dragKey = String(row.getAttribute(ROW_ATTR) || '');
          state.dragUnit = unit;
          state.previewSlots = slots;
          state.previewIdx = -1;
          state.previewMoves = 0;
          // The baseline for the settle animation must be taken while the list
          // still has its original shape, before any preview displacement.
          try { capture(); } catch (e) {}
          {
            // Grab offset: the drag image is positioned so the point the user
            // pressed stays under the pointer. Without it the row jumps up by
            // however far into the row the press landed.
            let offY = 0;
            let w = 0;
            let h = 0;
            let boxTop = 0;
            let boxLeft = 0;
            try {
              const box = unit.getBoundingClientRect();
              offY = Math.round(Math.max(0, Math.min(box.height, state.pressY - box.top)));
              w = Math.round(box.width);
              h = Math.round(box.height);
              boxTop = Math.round(box.top);
              boxLeft = Math.round(box.left);
              // The unit's own height, read here while it still has it: the
              // collapse that follows zeroes it, and every neighbour yields this
              // amount rather than an average that only happens to match a
              // uniform 32px list.
              state.dragH = box.height;
            } catch (e) {}
            // What follows the pointer is a real element, not the browser's
            // snapshot of the row.
            //
            // `setDragImage` rasterises whatever it is given. The label comes out
            // soft, the card arrives with no border of its own, and the image
            // tracks the pointer on both axes — so a Session drag reads as a
            // floating screenshot while every other drag in this sidebar moves a
            // live row straight down. The clone below is that live row: crisp
            // text, the same fill/shadow/radius as `.dse-dragging`, and Y only.
            try {
              // The browser's own image is suppressed with a transparent 1px
              // GIF. Left at its default it would be painted on top of the card
              // for the whole gesture, which is the bitmap being replaced.
              if (event && event.dataTransfer && event.dataTransfer.setDragImage) {
                try {
                  const blank = document.createElement('img');
                  blank.src = TRANSPARENT_GIF;
                  blank.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
                  document.body.appendChild(blank);
                  event.dataTransfer.setDragImage(blank, 0, 0);
                  window.setTimeout(function () {
                    try { if (blank.parentNode) blank.parentNode.removeChild(blank); } catch (e) {}
                  }, 0);
                } catch (e) {}
              }
              let card = null;
              try {
                card = unit.cloneNode(true);
                // The clone must not be mistaken for a Session by anything that
                // queries the document: this module and the Host both select
                // rows by `data-row-key`, and a second node carrying one would be
                // counted as a slot and displaced as a neighbour.
                const strip = ['data-row-key', 'role', 'tabindex', 'id', 'aria-selected', 'draggable'];
                const scrub = (node) => {
                  if (!node || node.nodeType !== 1) return;
                  for (let i = 0; i < strip.length; i++) {
                    try { node.removeAttribute(strip[i]); } catch (e) {}
                  }
                  const kids = node.querySelectorAll('[data-row-key],[role],[tabindex],[id],[draggable]');
                  for (let i = 0; i < kids.length; i++) {
                    for (let j = 0; j < strip.length; j++) {
                      try { kids[i].removeAttribute(strip[j]); } catch (e) {}
                    }
                  }
                };
                scrub(card);
                // The card's look (fill, hairline, shadow, radius, transition)
                // lives in the `.dse-card` rule so it stays identical to the
                // rail's dragged row; only the box it occupies is inline,
                // because that is measured per row.
                card.className = String(card.className || '') + ' dse-card';
                card.style.cssText = [
                  'left:' + boxLeft + 'px', 'top:' + boxTop + 'px',
                  'width:' + w + 'px', 'height:' + h + 'px',
                  'margin:0', 'padding:0', 'box-sizing:border-box'
                ].join(';') + ';';
                document.body.appendChild(card);
                state.card = card;
                state.cardTop = boxTop;
                state.cardOff = offY;
                state.cardY = 0;
                state.cardTarget = 0;
              } catch (e) {
                state.card = null;
              }
              state.dragImage = { w: w, h: h, top: boxTop, card: !!card, bg: '', sw: 0, sh: 0 };
              if (card) {
                // The computed fill is worth recording: a token that fails to
                // resolve leaves a transparent card, and the drag then looks like
                // a shadow with text floating on it rather than a raised row.
                try {
                  const cs = window.getComputedStyle(card);
                  state.dragImage.bg = String(cs.backgroundColor || '');
                  const rb = card.getBoundingClientRect();
                  state.dragImage.sw = Math.round(rb.width);
                  state.dragImage.sh = Math.round(rb.height);
                  // The clone carries the row's own descendants verbatim, so any
                  // inline transform a neighbour already had must not survive
                  // into it — the card would start displaced.
                  card.style.transform = 'translateY(0px)';
                } catch (e) {}
              }
            } catch (e) {
              // A card is presentation only; failing to build one must not abort
              // the drag the Host is about to commit.
              try { state.lastError = 'dragcard:' + String((e && e.message) || e); } catch (e2) {}
            }
          }
          // Deliberately NOT collapsing here. Chrome aborts a drag whose source
          // element is mutated synchronously inside `dragstart` — hiding the row
          // or zeroing its height there cancels the gesture outright, which is
          // exactly the "can no longer drag at all" regression this once caused.
          // The collapse is deferred to the first `dragover`, by which point the
          // drag is committed and the source may be restyled safely.
          state.pendingCollapse = true;
          // Reported immediately, not left to the 1.5s boot snapshot: whether
          // `dragstart` reaches this handler at all is the difference between
          // "the preview code is wrong" and "the preview never runs".
          report({
            event: 'dp-start', version: VERSION,
            key: state.dragKey.slice(8, 16),
            unit: unit ? String(unit.className || '').slice(0, 24) : '',
            slots: slots ? slots.units.length : -1,
            pressed: state.pressY,
            boxTop: (function () { try { return Math.round(unit.getBoundingClientRect().top); } catch (e) { return -1; } })(),
            w: (function () { try { return Math.round(unit.getBoundingClientRect().width); } catch (e) { return -1; } })(),
            img: state.dragImage ? {
              card: !!state.dragImage.card,
              bg: String(state.dragImage.bg || ''),
              sw: state.dragImage.sw || 0,
              sh: state.dragImage.sh || 0
            } : null
          }, true);
        } catch (e) { state.lastError = String((e && e.message) || e); }
      }
      function onDragOver(event) {
        if (!state.nativeDrag) return;
        // Liveness heartbeat for the idle sweep: this is the only event that
        // keeps arriving while the gesture is in flight (see the interval below).
        state.lastOver = Date.now();
        try {
          // The collapse was held back from `dragstart` because mutating the
          // source there aborts the drag. The first `dragover` is the earliest
          // moment the gesture is known to be live, and it must happen before
          // the geometry below is measured — the whole preview is computed from
          // the slots the collapse creates.
          if (state.pendingCollapse) {
            state.pendingCollapse = false;
            if (state.dragUnit) collapseUnit(state.dragUnit);
            // The collapse is this module's own doing, not a reorder. The FLIP
            // baseline taken at press time still describes the pre-collapse
            // layout, so it would read the upward shift of every row below as a
            // reorder and settle nine rows against a preview already holding
            // them — two animations writing the same property. Rebuild both
            // baselines here: this is the first and only moment the slots are
            // all at rest with no shift applied.
            try { capture(); } catch (e) {}
            try { measureSlots(); } catch (e) {}
          }
          // The carried card moves on Y only. Every other drag in this sidebar
          // slides straight down a column, and a row that also wanders sideways
          // under the cursor is the visual difference the user keeps naming.
          // The X is therefore pinned where the row lives, not where the pointer
          // is: a Session can only be reordered within its own column.
          try {
            if (state.card && state.card.parentNode) {
              const dy = Math.round(event.clientY - state.cardOff - state.cardTop);
              // Only the TARGET is recorded here. Actually moving the card from
              // this handler is what made it stutter: `dragover` is throttled and
              // arrives at irregular intervals while the cursor moves at native
              // rate, so each event teleported the card by a variable amount.
              // A frame loop below walks the card towards the target instead,
              // which is how the rail drag gets its smoothness (it reads pointer
              // moves directly, so it never had the problem to begin with).
              state.cardTarget = dy;
              driveCard();
              // The first few moves are reported: the drag image is ours now, so
              // "the card follows the pointer" is not something any other probe
              // could confirm. Three samples are enough to see the offset take
              // effect; more would bury the interesting events in noise.
              state.overSamples = (state.overSamples || 0) + 1;
              if (state.overSamples <= 3) {
                report({
                  event: 'dp-card', version: VERSION,
                  n: state.overSamples,
                  dy: dy,
                  y: Math.round(event.clientY),
                  top: Math.round(state.cardTop),
                  off: Math.round(state.cardOff),
                  box: (function () { try { return Math.round(state.card.getBoundingClientRect().top); } catch (e) { return -1; } })(),
                  w: (function () { try { return Math.round(state.card.getBoundingClientRect().width); } catch (e) { return -1; } })(),
                  h: (function () { try { return Math.round(state.card.getBoundingClientRect().height); } catch (e) { return -1; } })()
                }, true);
              }
            }
          } catch (e) { state.lastError = String((e && e.message) || e); }
          // Hit test: what is actually under the pointer, and is it one of the
          // Host's rows?
          //
          // This is the one number that separates the two candidate causes of
          // "the rows move but the drop does nothing": either the Host receives
          // a row and its half test disagrees, or the pointer is standing in the
          // empty gap this preview opened and the Host has no row to compare
          // against at all. Reported for the first few moves only.
          try {
            state.hitSamples = (state.hitSamples || 0) + 1;
            if (state.hitSamples <= 5) {
              const under = document.elementFromPoint(event.clientX, event.clientY);
              const rowUnder = under && under.closest
                ? (under.closest(ROW_SELECTOR) || under.closest(WS_SELECTOR))
                : null;
              report({
                event: 'dp-hit', version: VERSION, kind: state.dragKind,
                n: state.hitSamples,
                y: Math.round(event.clientY),
                tag: under ? String(under.tagName || '') : '',
                cls: under ? String(under.className || '').slice(0, 34) : '',
                row: rowUnder ? String(rowUnder.getAttribute(ROW_ATTR) || '').slice(0, 22) : '',
                gap: state.previewIdx
              }, true);
            }
          } catch (e) {}
          previewAt(event.clientY);
        } catch (e) { state.lastError = String((e && e.message) || e); }
      }
      // The view store the Host persists manual order into. Read-only here:
      // the plugin has no handle on the store object, and writing its key
      // directly would race the Host's own save.
      const STORE_KEY = 'dsh.workspace.view.v5';
      function readStore() {
        try { return String(window.localStorage.getItem(STORE_KEY) || ''); }
        catch (e) { return 'err:' + String((e && e.message) || e); }
      }
      function onDrop(event) {
        if (!state.nativeDrag) return;
        state.drops++;
        // Reported at once: whether `drop` reaches this handler at all is the
        // dividing line between "the gesture never completes" and "it completes
        // and the order is discarded", and those two need different fixes.
        const after = readStore();
        state.lastStore = after.slice(0, 240);
        if (after !== state.orderBefore) state.dropsCommitted++;
        report({
          event: 'dp-drop', version: VERSION,
          kind: state.dragKind,
          key: state.dragKey.slice(0, 24),
          idx: state.previewIdx,
          moves: state.previewMoves,
          changed: after !== state.orderBefore,
          beforeLen: state.orderBefore.length,
          afterLen: after.length
        }, true);
        // The Host's own handler runs after this capture-phase listener, so the
        // synchronous reading above always describes the store as it was before
        // the commit. It answers "did the gesture complete", not "did the order
        // change". The saved order is re-read once the commit has had a chance
        // to land; that second reading is the one that settles the question.
        window.setTimeout(() => {
          let later = '';
          try { later = readStore(); } catch (e) { later = 'err'; }
          report({
            event: 'dp-store', version: VERSION,
            changed: later !== state.orderBefore,
            beforeLen: state.orderBefore.length,
            afterLen: later.length,
            head: String(later || '').slice(0, 200)
          }, true);
        }, 400);
      }
      function onNativeEnd() {
        state.nativeDrag = false;
        // `pointerup` does not arrive for a native HTML5 drag, so without this
        // the pressed flag stays stuck and the idle re-sampling stops forever.
        state.pressed = false;
        if (state.watchdog) { try { window.clearTimeout(state.watchdog); } catch (e) {} state.watchdog = 0; }
        // The card is a detached presentation node: it is not part of any
        // React tree, so nothing else will ever remove it. Leaving it behind
        // would stack a dead row above the list that still answers to nothing.
        // The scrub is by selector rather than by handle for the same reason:
        // a duplicate start can orphan a card this module no longer tracks.
        scrubCards();
        state.card = null;
        state.cardTop = 0;
        state.cardOff = 0;
        state.cardY = 0;
        state.cardTarget = 0;
        if (state.cardRaf) { try { window.cancelAnimationFrame(state.cardRaf); } catch (e) {} state.cardRaf = 0; }
        state.overSamples = 0;
        clearShift();
        restoreUnit();
        state.dragUnit = null;
        state.dragKey = '';
        state.dragKind = '';
        state.dragH = 0;
        state.pendingCollapse = false;
        // Resting geometry belongs to the gesture that measured it. A later
        // drag starts from a different list — the drop just reordered it — so
        // reusing these numbers would place the first gap of the next drag
        // wherever the previous one ended.
        state.slotBase = null;
        state.hitSamples = 0;
        if (state.deferred) { state.deferred = false; schedule(); }
      }

      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('pointerup', onPointerUp, true);
      document.addEventListener('pointercancel', onPointerUp, true);
      document.addEventListener('dragstart', onNativeStart, true);
      // `dragover` is the only event that reports the pointer's position
      // throughout a native drag; `drag` exists but is not dispatched reliably
      // across all engines for this purpose.
      document.addEventListener('dragover', onDragOver, true);
      document.addEventListener('drop', onDrop, true);
      document.addEventListener('dragend', onNativeEnd, true);
      try {
        state.observer = new MutationObserver(onMutate);
        state.observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) { state.observer = null; }
      capture();
      // Sweep immediately on boot, not only on the first interval tick.
      //
      // A leftover only has to survive one page load to be seen, and the reload
      // that installs this code is exactly when the previous generation's stray
      // row is still on screen. Cleaning before anything else runs means the
      // user never sees it again.
      try { scrubCards(); } catch (e) {}
      const idle = window.setInterval(() => {
        // Stale cards are swept by the document, not by the handle.
        //
        // `state.card` only knows the card THIS instance built, and that was the
        // hole the leftover row kept falling through: a hot reload installs a new
        // module instance whose `state.card` is null while the previous
        // instance's card is still in the DOM with nothing pointing at it. Any
        // guard that starts from `state.card` therefore never runs, and the dead
        // row survives every reload. Presence is judged from the document plus
        // the liveness heartbeat instead:
        //  - no drag in flight -> any `.dse-card` at all is stale;
        //  - drag in flight -> `dragover` stops arriving once the gesture is over,
        //    and `dragend` is not a guarantee (React may replace the source row
        //    before it is dispatched, and an event on a detached node never
        //    reaches `document`).
        const quiet = Date.now() - (state.lastOver || 0);
        if (!state.nativeDrag || quiet > 1200) {
          // Unconditional: the sweep is idempotent, and asking "is there anything
          // to clean" with a selector is what let the older generations' cards
          // survive — they answer to a name this generation no longer knows.
          scrubCards();
          if (state.card) {
            state.card = null;
            state.cardTop = 0;
            state.cardOff = 0;
            state.overSamples = 0;
          }
          if (state.nativeDrag) onNativeEnd();
        }
        if (state.disposed || state.pressed || state.pending) return;
        try { capture(); } catch (e) {}
      }, 500);

      return {
        stats: function () {
          // Store probe: the persisted order is the only authority on whether a
          // drop committed, so it is surfaced next to the gesture counters.
          var store = readStore();

          let dom = -1;
          try { dom = document.querySelectorAll(ROW_SELECTOR).length; } catch (e) {}
          // Geometry of the first few rows: the baseline is only meaningful if
          // layoutY actually differs between rows and survives a reorder. This
          // records the chain that produces it (offsetParent's class) next to
          // the raw offsetTop, so a flat set of numbers identifies the wrapper
          // problem instead of hiding it behind "nothing moved".
          let geom = null;
          try {
            const rows = sessionRows();
            geom = [];
            for (let i = 0; i < rows.length && i < 6; i++) {
              const p = rows[i].offsetParent;
              geom.push({
                k: String(rows[i].getAttribute(ROW_ATTR) || '').slice(8, 16),
                ot: rows[i].offsetTop,
                y: layoutY(rows[i]),
                p: p ? String(p.className || '').slice(0, 26) : null
              });
            }
          } catch (e) { geom = 'threw:' + (e && e.message); }
          // Ancestor chain of a Session row, plus the siblings it can be
          // reordered among. A pointer drag has to know which container owns the
          // rows: moving a row across a workspace boundary would reorder two
          // groups at once, and React would put it straight back.
          let tree = null;
          try {
            const rows = sessionRows();
            const row = rows[0];
            if (row) {
              const chain = [];
              let node = row.parentElement;
              for (let hops = 0; node && hops < 8; hops++) {
                chain.push({
                  tag: String(node.tagName || '').toLowerCase(),
                  cls: String(node.className || '').slice(0, 30),
                  key: String(node.getAttribute(ROW_ATTR) || '').slice(0, 18),
                  role: String(node.getAttribute('role') || ''),
                  kids: node.children.length,
                  rows: node.querySelectorAll(ROW_SELECTOR).length
                });
                node = node.parentElement;
              }
              // What the row's own parent actually holds, in document order:
              // rows, group headers and padding elements all compete for slots.
              const parent = row.parentElement;
              const sibs = [];
              if (parent) {
                for (let i = 0; i < parent.children.length && i < 14; i++) {
                  const kid = parent.children[i];
                  sibs.push(String(kid.getAttribute(ROW_ATTR) || String(kid.className || '')).slice(0, 20));
                }
              }
              tree = { chain: chain, parentKids: parent ? parent.children.length : 0, sibs: sibs,
                draggable: row.getAttribute('draggable'), role: String(row.getAttribute('role') || '').slice(0, 20) };
            }
          } catch (e) { tree = 'threw:' + (e && e.message); }
          // Which element is the movable unit for a row?
          //
          // Moving the row div itself is wrong: every row is wrapped in its own
          // `span` inside a `groupSection`, so reordering raw rows would leave
          // the wrappers (and any per-row chrome they hold) behind. A pointer
          // drag has to move the smallest element that contains exactly one
          // Session and whose parent holds several such elements. This walks up
          // and reports that unit so the drag code can target it by rule instead
          // of by a hardcoded class.
          let slots = null;
          try {
            const rows = sessionRows();
            slots = [];
            for (let i = 0; i < rows.length && i < 6; i++) {
              const row = rows[i];
              const countRows = (el) => el ? el.querySelectorAll(ROW_SELECTOR).length : 0;
              let unit = row;
              let guard = 0;
              while (unit.parentElement && countRows(unit.parentElement) <= 1 && guard++ < 6) {
                unit = unit.parentElement;
              }
              const holder = unit.parentElement;
              slots.push({
                k: String(row.getAttribute(ROW_ATTR) || '').slice(8, 16),
                // The unit we would move, and the container whose children are
                // the units. `siblings` says how many movables share the
                // container, so a container of one is visibly useless.
                uTag: String(unit.tagName || '').toLowerCase(),
                uCls: String(unit.className || '').slice(0, 26),
                pTag: holder ? String(holder.tagName || '').toLowerCase() : null,
                pCls: holder ? String(holder.className || '').slice(0, 26) : null,
                pRole: holder ? String(holder.getAttribute('role') || '') : null,
                siblings: holder ? holder.children.length : 0,
                idx: holder && holder.children ? Array.prototype.indexOf.call(holder.children, unit) : -1
              });
            }
          } catch (e) { slots = 'threw:' + (e && e.message); }
          // The same two questions asked of the Workspace surface, which nests
          // differently: a Workspace drag moves its whole group, so the unit is
          // expected to be the groupSection and the slots its sibling sections.
          // Recorded rather than assumed — guessing the depth is exactly how the
          // Session unit was first picked one level too shallow and the drag
          // carried a bare wrapper instead of the row.
          let wsSlots = null;
          try {
            const rows = wsRows();
            wsSlots = [];
            for (let i = 0; i < rows.length && i < 6; i++) {
              const row = rows[i];
              const unit = wsUnitOf(row);
              const holder = unit.parentElement;
              wsSlots.push({
                k: String(row.getAttribute(ROW_ATTR) || '').slice(10, 20),
                uTag: String(unit.tagName || '').toLowerCase(),
                uCls: String(unit.className || '').slice(0, 26),
                isRow: unit === row,
                kids: unit.children ? unit.children.length : 0,
                rows: rowsIn(unit),
                h: (function () { try { return Math.round(unit.getBoundingClientRect().height); } catch (e) { return -1; } })(),
                pTag: holder ? String(holder.tagName || '').toLowerCase() : null,
                pCls: holder ? String(holder.className || '').slice(0, 26) : null,
                pRole: holder ? String(holder.getAttribute('role') || '') : null,
                sibs: holder ? holder.children.length : 0,
                wsSibs: holder ? wsIn(holder) : 0,
                idx: holder && holder.children ? Array.prototype.indexOf.call(holder.children, unit) : -1
              });
            }
          } catch (e) { wsSlots = 'threw:' + (e && e.message); }
          // The Workspace surface nests one level deeper than Sessions and not
          // uniformly, so the unit is read from the chain instead of assumed.
          //
          // Each level records the element, how many children it has, how many
          // of those children contain exactly one Workspace row (the candidates
          // a preview could displace), and how many Workspace rows live beneath
          // it. The reorder container is the level with several such children;
          // picking a level by "parent holds ≤1 row" stops too early here
          // because a nested row's wrapper also holds exactly one.
          let wsChain = null;
          try {
            const rows = wsRows();
            wsChain = [];
            for (let i = 0; i < rows.length && i < 9; i++) {
              const levels = [];
              let node = rows[i].parentElement;
              for (let hops = 0; node && hops < 10; hops++) {
                let one = 0;
                try {
                  for (let c = 0; c < node.children.length; c++) {
                    if (wsIn(node.children[c]) === 1) one++;
                  }
                } catch (e) {}
                levels.push(
                  String(node.tagName || '').toLowerCase() + '.' + String(node.className || '').slice(0, 18) +
                  (node.getAttribute('role') ? '[r=' + String(node.getAttribute('role')).slice(0, 8) + ']' : '') +
                  ' k' + (node.children ? node.children.length : -1) +
                  ' wk' + one + ' w' + wsIn(node)
                );
                node = node.parentElement;
              }
              wsChain.push({ k: String(rows[i].getAttribute(ROW_ATTR) || '').slice(10, 16), lv: levels.join(' | ') });
            }
          } catch (e) { wsChain = 'threw:' + (e && e.message); }
          // Leftovers are inventoried separately from the live state.
          //
          // A stray row on screen has two very different causes and they need
          // different fixes: a detached `.dse-card` still parented to the body,
          // or a real session row that kept an inline style (or one of our
          // classes) from a gesture that ended without cleanup. `state` knows
          // neither — it only remembers what THIS instance is currently holding,
          // and a hot reload starts with nothing while the DOM still carries the
          // previous generation's work. So the document is asked directly.
          let stale = null;
          try {
            const cards = document.querySelectorAll('.dse-card, .dse-ghost, [data-dse-carried]').length;
            const styled = [];
            const live = document.querySelectorAll('div[data-row-key^="session:"]');
            for (let i = 0; i < live.length; i++) {
              const el = live[i];
              const s = el.style;
              const marks = [];
              if (s && s.opacity) marks.push('op:' + s.opacity);
              if (s && s.visibility) marks.push('vis:' + s.visibility);
              if (s && s.height) marks.push('h:' + s.height);
              if (s && s.transform) marks.push('tf:' + s.transform);
              if (s && s.marginTop) marks.push('mt:' + s.marginTop);
              if (el.classList && el.classList.contains('dse-drag-src')) marks.push('cls:drag-src');
              if (el.classList && el.classList.contains('dse-space')) marks.push('cls:space');
              if (!marks.length) continue;
              if (styled.length >= 8) break;
              styled.push({ k: String(el.getAttribute('data-row-key') || '').slice(8, 16), m: marks.join(' ') });
            }
            // Identity of every rendered Session, verbatim.
            //
            // A duplicate on screen is either two rows for one Session or two
            // Sessions that happen to share a title, and no amount of styling
            // inspection can tell those apart — only the row keys can. The
            // rendered relative time is included because a stale copy keeps
            // ageing text frozen while the live row relabels itself.
            const ident = [];
            for (let i = 0; i < live.length && i < 14; i++) {
              const el = live[i];
              let txt = '';
              try { txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 42); } catch (e) {}
              let carried = false;
              try {
                let p = el.parentNode;
                for (let hops = 0; p && hops < 12; hops++) {
                  const cn = String(p.className || '');
                  if (cn.indexOf('dse-') >= 0) { carried = true; break; }
                  p = p.parentNode;
                }
              } catch (e) {}
              ident.push({ k: String(el.getAttribute('data-row-key') || '').slice(8, 22), t: txt, dse: carried });
            }
            // Everything parented directly to the body.
            //
            // A leftover row has to live somewhere, and every candidate this
            // module has ever created was appended to the body. Enumerating the
            // body's own children is the only inventory that cannot be fooled by
            // a class name: whatever that row is, it appears here, with its
            // geometry and its text.
            const bodyKids = [];
            try {
              const bk = document.body.children;
              for (let i = 0; i < bk.length && i < 20; i++) {
                const el = bk[i];
                const tag = String(el.tagName || '').toUpperCase();
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') continue;
                const rb = el.getBoundingClientRect();
                if (!rb.width && !rb.height) continue;
                bodyKids.push({
                  tag: tag,
                  id: String(el.id || '').slice(0, 20),
                  cls: String(el.className || '').slice(0, 34),
                  w: Math.round(rb.width),
                  h: Math.round(rb.height),
                  y: Math.round(rb.top),
                  t: String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)
                });
              }
            } catch (e) {}
            stale = { cards: cards, styled: styled, styledCount: styled.length, ident: ident, units: unitScan(), slotsOf: slotScan(), bodyKids: bodyKids, tokens: tokenScan() };
          } catch (e) { stale = 'threw:' + (e && e.message); }
          return {
            rows: state.rows,
            dom: dom,
            geom: geom,
            tree: tree,
            slots: slots,
            wsSlots: wsSlots,
            wsChain: wsChain,
            dragKind: state.dragKind,
            dragH: Math.round(state.dragH),
            // Judged from the Host's own persisted store, not from this
            // module's counters: a preview that never reached the Host and a
            // commit that was afterwards overwritten both look identical from
            // the inside, and only the store tells them apart.
            drops: state.drops,
            dropsCommitted: state.dropsCommitted,
            storeLen: store.length,
            storeHead: store.slice(0, 120),
            stale: stale,
            samples: state.samples,
            commits: state.commits,
            skipped: state.skipped,
            observed: !!state.observer,
            plays: state.plays,
            pending: !!state.pending,
            nativeDrag: !!state.nativeDrag,
            deferred: !!state.deferred,
            lastError: state.lastError
          };
        },
        destroy: function () {
          state.disposed = true;
          try { document.removeEventListener('pointerdown', onPointerDown, true); } catch (e) {}
          try { document.removeEventListener('pointerup', onPointerUp, true); } catch (e) {}
          try { document.removeEventListener('pointercancel', onPointerUp, true); } catch (e) {}
          try { document.removeEventListener('dragstart', onNativeStart, true); } catch (e) {}
          try { document.removeEventListener('dragover', onDragOver, true); } catch (e) {}
          try { document.removeEventListener('drop', onDrop, true); } catch (e) {}
          try { document.removeEventListener('dragend', onNativeEnd, true); } catch (e) {}
          try { window.clearInterval(idle); } catch (e) {}
          if (state.timer) { try { window.clearTimeout(state.timer); } catch (e) {} state.timer = 0; }
          try { if (state.observer) state.observer.disconnect(); } catch (e) {}
          state.observer = null;
          // A disposed module can no longer react to the end of the gesture, so
          // whatever is on screen has to go now — otherwise the card outlives
          // the code that knows how to remove it.
          scrubCards();
          state.card = null;
          for (let i = 0; i < state.rafs.length; i++) {
            try { window.cancelAnimationFrame(state.rafs[i]); } catch (e) {}
          }
          state.rafs.length = 0;
          state.before = null;
          state.pending = false;
        }
      };
    }

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
    function startArchiveGrouping(ctx) {
      const HOST_CLASS = 'dse-arc-host';
      const FIRST_CLASS = 'dse-arc-first';
      const STYLE_ID = 'dse-arc-style';
      const state = {
        disposed: false, observer: null, timer: 0,
        passes: 0, containers: 0, archived: 0, moved: 0, lastError: '',
        // Which containers the last pass actually recognised rows in, so a
        // "nothing moved" report can be told apart from "nothing was seen".
        diag: []
      };

      function ensureStyle() {
        try {
          if (document.getElementById(STYLE_ID)) return;
          const style = document.createElement('style');
          style.id = STYLE_ID;
          style.textContent =
            // `order` only means something in a flex/grid box, and the shipped
            // group sections and flat list are plain block containers.
            '.dse-arc-host{display:flex;flex-direction:column}' +
            // The divider is the whole point of the pass being visible: without
            // it a sunk archive still reads as "just another session at the
            // bottom" rather than as a separate shelf.
            //
            // It is absolutely positioned on purpose. A `::before` block would
            // add 5px to the row's own height, and every downstream measurement
            // in this plugin (row height, integer caps, FLIP baselines) assumes
            // a 32px session row — a divider that changes layout would quietly
            // break all three.
            '.dse-arc-first{position:relative;margin-top:6px}' +
            '.dse-arc-first::before{content:"";position:absolute;left:8px;right:8px;top:-4px;height:1px;' +
            'pointer-events:none;background:var(--dsw-alias-border-l2,rgba(127,127,127,.28))}';
          (document.head || document.documentElement).appendChild(style);
        } catch (e) { state.lastError = String((e && e.message) || e); }
      }

      function scrubStyle() {
        try {
          const style = document.getElementById(STYLE_ID);
          if (style && style.parentNode) style.parentNode.removeChild(style);
        } catch (e) {}
      }

      // Archive membership is authoritative on the workspace model, and recency
      // comes from the Session summaries — the same two sources the Host sorts
      // by, so the shelf order matches what "按时间" means everywhere else.
      //
      // `workspaceModel()`/`sessionStore()` are closed over by the pinned
      // section, NOT by this module scope, so they are not reachable here; the
      // services are resolved through the same `serviceOf` lookup they use.
      function archiveFacts() {
        const gone = Object.create(null);
        const when = Object.create(null);
        try {
          const svc = serviceOf(ctx, 'workspaces');
          const model = svc && svc.list;
          const arr = (model && model.archivedSessionIds) || [];
          for (let i = 0; i < arr.length; i++) gone[String(arr[i])] = 1;
        } catch (e) { state.lastError = String((e && e.message) || e); }
        try {
          const svc = serviceOf(ctx, 'sessions');
          const store = svc && svc.list;
          const snap = store && typeof store.getSnapshot === 'function' ? store.getSnapshot() : null;
          const byId = snap && snap.byId ? snap.byId : null;
          if (byId) {
            for (const id in byId) {
              if (Object.prototype.hasOwnProperty.call(byId, id)) {
                when[id] = Number(byId[id] && byId[id].updatedAt) || 0;
              }
            }
          }
        } catch (e) { state.lastError = String((e && e.message) || e); }
        return { gone: gone, when: when };
      }

      // Every box that directly holds Session rows: one per workspace group
      // (nested groups are their own boxes) plus the flat list and the search
      // tree. The plugin's own rail is excluded — its rows carry no
      // `data-row-key`, but the pin section clones real rows inside itself.
      function boxes() {
        const out = [];
        const sel = ['div[class*=groupSection]', 'div[class*=flatList]', 'div[class*=searchTree]'];
        for (let s = 0; s < sel.length; s++) {
          let all = null;
          try { all = document.querySelectorAll(sel[s]); } catch (e) { all = null; }
          if (!all) continue;
          for (let i = 0; i < all.length; i++) {
            const el = all[i];
            if (out.indexOf(el) !== -1) continue;
            try {
              if (el.closest('.dse-pin-section')) continue;
              if (el.closest('[class*=panelList]')) continue;
              if (!el.querySelector('div[data-row-key^="session:"]')) continue;
            } catch (e) { continue; }
            out.push(el);
          }
        }
        return out;
      }

      // One container. Returns the number of wrappers whose `order` changed.
      function syncBox(box, facts) {
        const kids = Array.prototype.slice.call(box.children);
        if (kids.length === 0) return 0;
        const slots = [];
        const metas = [];
        for (let i = 0; i < kids.length; i++) {
          const kid = kids[i];
          let row = null;
          try {
            if (kid.matches && kid.matches('div[data-row-key^="session:"]')) row = kid;
            else row = kid.querySelector('div[data-row-key^="session:"]');
          } catch (e) { row = null; }
          if (!row) continue;
          // A nested group's rows live under `div[role=group]`, not at this
          // level; walking to the direct child proves the row belongs here.
          let top = row;
          let guard = 0;
          while (top.parentElement && top.parentElement !== box && guard++ < 16) top = top.parentElement;
          if (top.parentElement !== box || top !== kid) continue;
          const key = String(row.getAttribute('data-row-key') || '').slice(8);
          // A nested Workspace group is ONE direct child but holds many rows.
          // Judging it by its first row would let a group with a single
          // archived row sink an entire live subtree, so the whole child only
          // counts as archived when every row inside it is.
          let mine = null;
          try { mine = kid.querySelectorAll('div[data-row-key^="session:"]'); } catch (e) { mine = null; }
          let allGone = true;
          if (mine && mine.length > 1) {
            for (let k = 0; k < mine.length; k++) {
              const kk = String(mine[k].getAttribute('data-row-key') || '').slice(8);
              if (!facts.gone[kk]) { allGone = false; break; }
            }
          } else {
            allGone = !!facts.gone[key];
          }
          slots.push(i);
          metas.push({
            box: kid,
            id: key,
            archived: allGone,
            when: facts.when[key] || 0
          });
        }
        if (slots.length === 0) {
          if (state.diag.length < 8) {
            state.diag.push({ cls: String(box.className || '').slice(0, 26), kids: kids.length, rows: 0, arch: 0, moved: 0, why: 'no-rows' });
          }
          return 0;
        }

        // Live rows keep the exact order they already had; archives trail them
        // newest-first. Sorting only the archive half means a live row can never
        // be displaced by this pass.
        const live = [];
        const gone = [];
        for (let i = 0; i < metas.length; i++) (metas[i].archived ? gone : live).push(metas[i]);
        gone.sort(function (a, b) {
          if (b.when !== a.when) return b.when - a.when;
          return a.id < b.id ? -1 : 1;
        });
        const seq = live.concat(gone);

        // The slot indices stay fixed, so every non-Session child (workspace
        // header, nested group, the "收起/更多" overflow button) keeps exactly
        // the position React gave it.
        const final = kids.slice();
        for (let j = 0; j < slots.length; j++) final[slots[j]] = seq[j].box;

        let changed = 0;
        for (let i = 0; i < final.length; i++) {
          const want = String(i);
          if (final[i].style.order !== want) {
            final[i].style.order = want;
            changed++;
          }
        }

        if (state.diag.length < 8) {
          state.diag.push({
            cls: String(box.className || '').slice(0, 26),
            kids: kids.length,
            rows: slots.length,
            arch: gone.length,
            moved: changed,
            firstId: (metas[0] && metas[0].id || '').slice(0, 10),
            archIds: metas.filter(function (m) { return m.archived; }).map(function (m) { return m.id.slice(0, 8); }).slice(0, 3)
          });
        }

        // Exactly one divider, on the first archived wrapper — and never when
        // every row in the box is archived (there is nothing to divide from).
        for (let i = 0; i < seq.length; i++) {
          const on = i === live.length && gone.length > 0 && live.length > 0;
          const has = (' ' + seq[i].box.className + ' ').indexOf(' ' + FIRST_CLASS + ' ') !== -1;
          if (on && !has) seq[i].box.className = String(seq[i].box.className || '') + ' ' + FIRST_CLASS;
          else if (!on && has) {
            seq[i].box.className = String(seq[i].box.className || '')
              .split(/\s+/)
              .filter(function (t) { return t && t !== FIRST_CLASS; })
              .join(' ');
          }
        }

        try {
          if ((' ' + box.className + ' ').indexOf(' ' + HOST_CLASS + ' ') === -1) {
            box.className = String(box.className || '') + ' ' + HOST_CLASS;
          }
        } catch (e) {}

        return changed;
      }

      function pass() {
        if (state.disposed) return;
        // A sidebar drag owns every row's geometry for the length of the
        // gesture; rewriting `order` mid-flight would move rows out from under
        // the preview while the pointer is deciding a drop.
        try { if (document.querySelector('.dse-card')) return; } catch (e) {}
        ensureStyle();
        const facts = archiveFacts();
        const list = boxes();
        state.diag = [];
        let moved = 0;
        let archived = 0;
        for (let i = 0; i < list.length; i++) {
          try { moved += syncBox(list[i], facts); } catch (e) { state.lastError = String((e && e.message) || e); }
        }
        for (const id in facts.gone) archived++;
        state.passes++;
        state.containers = list.length;
        state.archived = archived;
        state.moved = moved;
      }

      function schedule() {
        if (state.disposed || state.timer) return;
        state.timer = window.setTimeout(function () {
          state.timer = 0;
          pass();
        }, 80);
      }

      ensureStyle();
      pass();
      try {
        state.observer = new MutationObserver(function (records) {
          for (let i = 0; i < records.length; i++) {
            // Only structural work matters here; `order` writes are our own and
            // arrive as attribute records on rows we already placed.
            if (records[i].type === 'childList') { schedule(); return; }
          }
        });
        state.observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) { state.lastError = String((e && e.message) || e); }

      // Reading `style.order` only proves intent. This walks the rects and
      // reports the row order the eye actually sees, which is the only judge
      // that matters for a paint-order change.
      function visual() {
        const out = [];
        const all_ = boxes();
        // An outer group's `querySelectorAll` also returns the rows of a nested
        // group, so reporting every container flattens a subtree into its parent
        // and makes correctly-sunk archives look interleaved. Only the innermost
        // containers own their rows; report those.
        const list = [];
        for (let i = 0; i < all_.length; i++) {
          let inner = true;
          for (let j = 0; j < all_.length; j++) {
            if (j !== i && all_[j] !== all_[i] && all_[i].contains(all_[j])) { inner = false; break; }
          }
          if (inner) list.push(all_[i]);
        }
        const facts = archiveFacts();
        for (let i = 0; i < list.length && i < 5; i++) {
          const rows = [];
          const all = list[i].querySelectorAll('div[data-row-key^="session:"]');
          for (let j = 0; j < all.length; j++) {
            const r = all[j].getBoundingClientRect();
            const id = String(all[j].getAttribute('data-row-key') || '').slice(8);
            rows.push({ id: id, top: Math.round(r.top), a: facts.gone[id] ? 1 : 0 });
          }
          rows.sort(function (a, b) { return a.top - b.top; });
          out.push({
            cls: String(list[i].className || '').slice(0, 20),
            // `*` marks an archived row: every `*` must trail the plain ids or
            // the sink did not reach the screen.
            seq: rows.map(function (r) { return r.id.slice(9, 13) + (r.a ? '*' : ''); }).join(' ')
          });
        }
        return out;
      }

      return {
        stats: function () {
          return {
            passes: state.passes,
            containers: state.containers,
            archived: state.archived,
            moved: state.moved,
            diag: state.diag,
            layout: visual(),
            lastError: state.lastError
          };
        },
        sync: pass,
        visual: visual,
        destroy: function () {
          state.disposed = true;
          try { if (state.observer) state.observer.disconnect(); } catch (e) {}
          state.observer = null;
          if (state.timer) { try { window.clearTimeout(state.timer); } catch (e) {} state.timer = 0; }
          // The inline `order` values outlive this module unless they are washed
          // off: a re-applied copy would otherwise inherit an arrangement nobody
          // is maintaining, and the divider classes would linger on rows that
          // are no longer archived.
          try {
            const sel = 'div[class*=groupSection],div[class*=flatList],div[class*=searchTree]';
            const all = document.querySelectorAll(sel);
            for (let i = 0; i < all.length; i++) {
              const box = all[i];
              const kids = Array.prototype.slice.call(box.children);
              for (let j = 0; j < kids.length; j++) {
                try {
                  kids[j].style.order = '';
                  kids[j].className = String(kids[j].className || '')
                    .split(/\s+/)
                    .filter(function (t) { return t && t !== FIRST_CLASS; })
                    .join(' ');
                } catch (e) {}
              }
              try {
                box.className = String(box.className || '')
                  .split(/\s+/)
                  .filter(function (t) { return t && t !== HOST_CLASS; })
                  .join(' ');
              } catch (e) {}
            }
          } catch (e) {}
          scrubStyle();
        }
      };
    }

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
      // Only the landing of the Host's own drag is ours; its gesture and its
      // store stay untouched.
      try { if (window.__dseDragPolish && window.__dseDragPolish.destroy) window.__dseDragPolish.destroy(); } catch (e) {}
      window.__dseDragPolish = null;
      safeEffect(() => {
        let polish = null;
        try { polish = startNativeDragPolish(ctx); } catch (e) { polish = null; }
        window.__dseDragPolish = polish;
        return () => {
          try { if (polish && polish.destroy) polish.destroy(); } catch (e) {}
          if (window.__dseDragPolish === polish) window.__dseDragPolish = null;
        };
      }, 'dsh-sidebar-entries: native drag polish');
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
      try { if (window.__dseArchive && window.__dseArchive.destroy) window.__dseArchive.destroy(); } catch (e) {}
      window.__dseArchive = null;
      safeEffect(() => {
        let arc = null;
        try { arc = startArchiveGrouping(ctx); } catch (e) { arc = null; }
        window.__dseArchive = arc;
        return () => {
          try { if (arc && arc.destroy) arc.destroy(); } catch (e) {}
          if (window.__dseArchive === arc) window.__dseArchive = null;
        };
      }, 'dsh-sidebar-entries: archive grouping');
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
      try { if (window.__dsePinnedSection && window.__dsePinnedSection.destroy) window.__dsePinnedSection.destroy(); } catch (e) {}
      window.__dsePinnedSection = null;
      safeEffect(() => {
        let section = null;
        try { section = startPinnedSection(ctx); } catch (e) { section = null; }
        window.__dsePinnedSection = section;
        return () => {
          try { if (section && section.destroy) section.destroy(); } catch (e) {}
          if (window.__dsePinnedSection === section) window.__dsePinnedSection = null;
        };
      }, 'dsh-sidebar-entries: pinned section');
    }
    exports.inject = ['slots'];
    exports.apply = apply;
    return module.exports;
  }
});

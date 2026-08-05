/* ──────────────────────────────────────────────────────────────
   components/GuidedTour.jsx — spotlight "coach-mark" tour.

   Steps are [{ target, title, body, tab }]. `target` matches a
   data-tour="<id>" attribute on a real on-screen element; the
   overlay measures that element (getBoundingClientRect) and
   spotlights it — dims the whole screen and cuts a bright hole
   around it — with a callout that explains how to use it.

   onStep(step) fires when a step becomes active (before measuring),
   so the host can bring the target on-screen (e.g. switch tabs).
   onClose() ends the tour (Skip, or Done on the last step).

   The spotlight uses the classic transparent-box + huge-spread
   box-shadow trick for the cutout, so no SVG mask is needed. A
   full-viewport container captures clicks so the app underneath
   isn't interactable mid-tour — advancing is driven by the callout.
   ────────────────────────────────────────────────────────────── */

import React, { useLayoutEffect, useState } from "react";
import { theme, ff, radius, shadow } from "../theme";
import { unionSpan, unionRect, groupScrollDelta, calloutPlacement, MARGIN } from "../helpers/tourLayout";
import { BREW_DOCK_ID } from "../helpers/dock";

// Top edge of the bottom dock — the line the tour's cutout is clamped
// against. A huge fallback when there's no dock, so the clamp becomes a
// no-op rather than collapsing every hole to nothing.
const readDockTop = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return 1e9;
  const bar = document.getElementById(BREW_DOCK_ID)?.parentElement;
  const top = bar ? bar.getBoundingClientRect().top : window.innerHeight;
  return Number.isFinite(top) ? Math.max(0, top) : window.innerHeight;
};

export const GuidedTour = ({ steps = [], onStep, onClose }) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  // The clamp line. State rather than a render-time read so it can be
  // refreshed by the ResizeObserver when a step opens or shuts the brew
  // row and the dock changes height under us.
  const [dockTop, setDockTop] = useState(readDockTop);
  // Union of the step's `keepClear` targets, if it has any — other
  // elements the user must be able to see WHILE reading this step. The
  // Blend tour's prediction/slider steps use it: the whole lesson is
  // that dragging the sliders moves the bars, which the user can only
  // learn if both are on screen and the callout is off both of them.
  const [clearRect, setClearRect] = useState(null);
  // WHERE THE CALLOUT SITS — deliberately NOT the same geometry the
  // spotlight uses.
  //
  // The spotlight has to track its target: the strip grows and shrinks
  // as rows come and go, and a cutout left behind would be lighting up
  // where the bars used to be. The callout has the opposite obligation.
  // It carries Next, the user is reaching for Next, and a button that
  // slides out from under a thumb because a graph grew somewhere else on
  // screen is the app moving the goalposts mid-tap.
  //
  // So the callout is anchored ONCE per target and then held, while
  // `rect`/`clearRect` go on tracking underneath it. The cost is real
  // and accepted: a strip that grows after the anchor is set can end up
  // partly behind the callout, where re-placing would have dodged it.
  // A stationary button is worth more than the pixels.
  const [anchorRect, setAnchorRect] = useState(null);
  const [anchorClear, setAnchorClear] = useState(null);
  // Held or free. Set false only when the callout has earned the right
  // to move: a new target to point at, or a viewport that changed size
  // under it.
  const anchorLocked = React.useRef(false);
  // The target the current anchor was computed for. Consecutive steps
  // sharing a target (Simple/Detailed, the two axis pills) are one
  // continuous reading position as far as the user is concerned — the
  // callout says a bit more and the same button is still under their
  // thumb — so the anchor carries across them rather than being
  // recomputed against a layout the step itself just changed.
  const anchorTarget = React.useRef(null);
  // HOLDING THE ANCHOR ISN'T ENOUGH ON ITS OWN.
  //
  // A held anchor pins whichever edge calloutPlacement chose, and when
  // that edge is the TOP the box still grows downward as the copy
  // changes — so consecutive steps sharing a target move the button by
  // however much taller the second one's text is. Measured at 18.8px
  // between "Simple reads the taste by family" and "Detailed opens every
  // family": same anchor, same target, one extra line of copy, and Next
  // slides down the screen on the exact step that says "Tap Next".
  //
  // So the edge that gets held is the one the button is on. Captured
  // from the real box once the step has settled, which reproduces the
  // current position exactly (no jump when it takes over) and then keeps
  // the bottom fixed while the box grows or shrinks upward instead.
  const calloutRef = React.useRef(null);
  const [heldBottom, setHeldBottom] = useState(null);
  // The target's own border-radius, so the pulse traces the element's
  // real shape (rounded button corners, square windows) rather than a
  // generic box.
  const [targetRadius, setTargetRadius] = useState("10px");
  const step = steps[i];
  // Honor prefers-reduced-motion: skip the mount fade (also keeps E2E
  // runs — which set reducedMotion — fast and deterministic).
  const reduceMotion = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Announce the active step (tab switch, etc.) before we measure, so
  // the target is mounted/on-screen when getBoundingClientRect runs.
  useLayoutEffect(() => {
    if (step) onStep?.(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Measure the current target after render + on resize. If the node
  // isn't mounted yet (a tab just switched), retry next frame. Targets
  // below the fold are scrolled into view first so the tour can walk
  // down a screen (e.g. down to the steep/temp controls).
  useLayoutEffect(() => {
    if (!step) return undefined;
    let raf = 0;
    let settle = 0;
    let scrolled = false;
    let ro = null;
    // A new target is the one thing that entitles the callout to move.
    // Same target as the step before → the anchor stays exactly where it
    // was, and the settle passes below reposition CONTENT under a
    // callout that doesn't budge.
    if (anchorTarget.current !== step.target) {
      anchorTarget.current = step.target;
      anchorLocked.current = false;
      // A new target places from scratch — the held bottom belonged to
      // the last one and would drag the callout to a position that has
      // nothing to do with what's being pointed at now.
      setHeldBottom(null);
    }
    // The step's keep-clear elements, or [] — they may legitimately not
    // exist (a step reused on a screen that doesn't render them), in
    // which case the step just behaves like an ordinary one.
    const clearEls = () => (step.keepClear || [])
      .map(id => document.querySelector(`[data-tour="${id}"]`))
      .filter(Boolean);
    const unionOf = (els) => unionSpan(els.map(el => el.getBoundingClientRect()));
    // A step can light up more than one element: `spotlight` lists extra
    // data-tour ids to fold into the highlight. The Simple/Detailed step
    // uses it to light the toggle AND the bars, so the user watches the
    // thing the toggle changes rather than just the control itself.
    const spotEls = (el) => [el, ...(step.spotlight || [])
      .map(id => document.querySelector(`[data-tour="${id}"]`))
      .filter(Boolean)];
    // How much of the bottom of the screen the dock is covering.
    //
    // Measured off the dock itself rather than read from --app-dock-h:
    // that property is set on the app root, not on documentElement, so
    // getComputedStyle at the top of the tree returns "" and this would
    // silently be 0 — the exact failure the value exists to prevent.
    // The slot's parent is the bar, which is the element App measures.
    const dockHeight = () => {
      const bar = document.getElementById(BREW_DOCK_ID)?.parentElement;
      return bar ? bar.getBoundingClientRect().height : 0;
    };
    // Nearest scrollable ancestor, or null when nothing can scroll this
    // element. The app scrolls an inner pane, not the document, so
    // scrollIntoView's container is what we have to nudge for the fine
    // positioning below — and null is a real answer: a step can point
    // at app CHROME, which no amount of scrolling moves.
    const scrollParent = (el) => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        const oy = window.getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) return n;
      }
      // Fall back to the document when IT is what scrolls.
      //
      // On a phone the app's inner pane overflows and the loop finds it.
      // On desktop the app is a fixed column inside a taller preview
      // page: the inner pane doesn't overflow, the DOCUMENT does, and
      // computed overflowY on <html> is "visible" so the loop above
      // never matches it. Returning null there skipped all the fine
      // positioning — the tour did a bare scrollIntoView and left the
      // prediction bars under the callout the moment a step arrived from
      // further down the page.
      //
      // Guarded on actually overflowing, so the null case still means
      // what it was changed to mean: a step pointing at app CHROME,
      // which no amount of scrolling moves.
      // Chrome first: the document contains the dock as much as it
      // contains the page, so without this the fallback hands back a
      // scroller for elements scrolling cannot move, and the dock's
      // sliders get pulled into the group being fitted — which is the
      // exclusion the dock work added in the first place.
      const dockBar = document.getElementById(BREW_DOCK_ID)?.parentElement;
      if (dockBar && dockBar.contains(el)) return null;
      const doc = document.scrollingElement || document.documentElement;
      if (doc && doc.scrollHeight > doc.clientHeight && doc.contains(el)) return doc;
      return null;
    };
    // Position the step's subject. Plain steps center the target; steps
    // with keepClear then get nudged so the whole group sits flush to
    // the bottom margin — see groupScrollDelta for why.
    const position = (el) => {
      const extra = clearEls();
      const all = [...spotEls(el), ...extra];
      // The pane this step scrolls: the first of its elements that
      // lives in one. Anything outside that pane is chrome — the blend
      // screen's brew controls sit in the tab dock — and scrolling can
      // neither reveal nor hide it. Chrome takes no part in the group
      // being fitted; it's on screen by construction. It still feeds
      // clearRect below, so the callout goes on dodging it.
      const pane = all.map(scrollParent).find(Boolean) || null;
      const group = pane ? all.filter(n => pane.contains(n)) : [];
      // Bring the subject on screen. When the target itself is chrome
      // the scroll goes to whatever else the step needs to show.
      const subject = group.includes(el) ? el : group[0];
      // Scroll the pane OURSELVES rather than asking scrollIntoView to.
      //
      // scrollIntoView picks its own container and on desktop that's the
      // outer preview wrapper, not the inner pane — the one the converge
      // loop below then adjusts. The two disagreeing is why the slider
      // step stopped repositioning at all once it followed the effects
      // step: the subject was already "in view" as far as the outer
      // scroller was concerned, so nothing moved, and the bars stayed
      // where the previous step had left them with the callout across
      // their top.
      //
      // Centring is measured against the VISIBLE region — pane minus the
      // dock — for the same reason everything else here is.
      if (subject) {
        // BOTH, in this order. scrollIntoView is the only thing that
        // moves the OUTER scrollers — on desktop the document itself
        // scrolls, and the app column can sit 80px above the viewport
        // with nothing in the pane able to fix it. Dropping this call
        // and steering only the pane left the desktop tour measuring
        // its bars at top -82, off screen entirely.
        subject.scrollIntoView({ block: "center", inline: "nearest" });
        // Then the fine pass, on the pane we actually adjust below.
        // scrollIntoView centres within the pane's whole box, which now
        // runs under the dock; this re-centres against the part the
        // user can see. Without it the subject settles low and the
        // converge loop starts from the wrong place.
        if (pane) {
          const pr = pane.getBoundingClientRect();
          const sr = subject.getBoundingClientRect();
          const room = pr.height - dockHeight();
          const wantTop = pr.top + Math.max(0, (room - sr.height) / 2);
          pane.scrollTop += sr.top - wantTop;
        }
      }
      if (group.length === 0) return;
      // PLAIN STEPS STILL HAVE TO CLEAR THE DOCK. `block: "center"` is
      // relative to the scroll pane, and the pane now runs UNDER the
      // bottom bar — so a target near the end of the page centres into
      // a region whose lower third is covered, and lands behind the
      // menu. "Brew or save" did exactly this: highlighted, scrolled to,
      // and hidden.
      //
      // Only a correction, not a re-layout: if the target already sits
      // inside the visible band the delta is zero and centring stands.
      // The keepClear path below does its own, stronger fit, so this
      // runs for the steps that have no group to fit.
      // Pull the subject up out of the dock if it's overhanging. Used by
      // both paths below.
      const clearTheDock = () => {
        const paneBox = pane.getBoundingClientRect();
        const visibleBottom = paneBox.bottom - dockHeight();
        for (let pass = 0; pass < 3; pass++) {
          const r = subject.getBoundingClientRect();
          const over = r.bottom - (visibleBottom - 12);
          if (over <= 1) break;
          // Never buy bottom clearance by pushing the top off screen.
          // Without this bound a tall subject gets shoved up until its
          // head is above the pane and under the callout — measured on
          // desktop as the prediction bars at top -52 with 124px of them
          // behind the callout, on a pane with room for the lot.
          //
          // When the subject genuinely can't fit, stop at flush-to-top
          // and let the bottom overhang: the callout is the more
          // destructive overlap of the two, since it's opaque.
          const headroom = r.top - (paneBox.top + 12);
          const move = Math.min(over, Math.max(0, headroom));
          if (move <= 1) break;
          const before = pane.scrollTop;
          pane.scrollTop += move;
          if (pane.scrollTop === before) break;
        }
      };
      if (extra.length === 0) {
        clearTheDock();
        return;
      }
      // Converge rather than nudge once. scrollIntoView may act on a
      // different container than the one we adjust, so a single delta
      // can land short and leave the group high — which then pushes the
      // target under the callout. Re-measure and correct, bailing when
      // it's settled or the container has hit the end of its range.
      //
      // The region the group can occupy is the pane's visible box, not
      // the window — the app scrolls between a header and the tab dock,
      // so on a small phone the pane is ~165px shorter.
      // The pane's box MINUS the dock. The page scrolls underneath the
      // bottom bar now — that's what makes it read as glass — so the
      // pane extends further down than the user can actually see. Fit
      // the group to what's visible, or the tour cheerfully centres its
      // subject half-behind the menu and reports it as on screen.
      const paneRect = pane.getBoundingClientRect();
      const region = { ...paneRect, bottom: paneRect.bottom - dockHeight() };
      for (let pass = 0; pass < 3; pass++) {
        const delta = groupScrollDelta(unionOf(group), region);
        if (!delta) break;
        const before = pane.scrollTop;
        pane.scrollTop += delta;
        if (pane.scrollTop === before) break;
      }
      // Then refuse any overhang left over.
      //
      // groupScrollDelta deliberately lets an oversized group hang 20%
      // of its overflow off the bottom, taking the other 80% off the
      // top. That split was written when the keep-clear element — the
      // temp/steep sliders — sat at the BOTTOM of the group and would
      // have taken the whole loss. The sliders live in the dock now, so
      // they are never in the group and never at risk, and the only
      // thing that bottom overhang can do is push the bars behind the
      // menu. Measured at 44px on a Pixel 9 before this.
      //
      // Losing it off the top instead is the documented preference: the
      // bars are tall enough to spare their upper edge.
      clearTheDock();
    };
    // Last geometry pushed to state, so a re-measure that finds nothing
    // changed doesn't re-render. Matters more now that a ResizeObserver
    // drives this: without it, every observed frame would set fresh
    // object identities and churn.
    let lastKey = "";
    const apply = (captured) => {
      // Re-query rather than trust the node we captured. React recreates
      // some targets on re-render — the recommended-range band is rebuilt
      // whenever the axis or selection changes — which leaves the
      // ResizeObserver watching a DETACHED node. It never fires again, so
      // the rect stays whatever it was at first measure: zero, if the
      // panel was still opening. A 0x0 rect padded by 6 is the 12x12
      // square that was appearing in the corner.
      const el = document.querySelector(`[data-tour="${step.target}"]`) || captured;
      // Before the early-out below. A page target doesn't MOVE when the
      // dock grows — the scroll region's padding absorbs it — so its
      // rect is unchanged and the key check would bail, leaving the
      // clamp measured against the dock's old height. This is the one
      // value that has to refresh even when nothing about the target
      // did. React bails on an unchanged number, so it costs nothing.
      setDockTop(readDockTop());
      const els = spotEls(el);
      const nextRect = unionRect(els.map(n => n.getBoundingClientRect()));
      const nextClear = unionOf(clearEls());
      const key = JSON.stringify([nextRect, nextClear]);
      if (key === lastKey) return;
      lastKey = key;
      // The spotlight's geometry always refreshes. The callout's only
      // does while the anchor is unlocked — during a new target's settle
      // window, before anyone has started reading it.
      if (!anchorLocked.current) {
        setAnchorRect(nextRect);
        setAnchorClear(nextClear);
      }
      setRect(nextRect);
      // Radius comes from the primary target — with several elements
      // lit at once there's no single shape to trace, and the largest
      // one's corners read best around the group.
      setTargetRadius(window.getComputedStyle(els.length > 1 ? els.at(-1) : el).borderRadius || "0px");
      setClearRect(nextClear);
    };
    // Track the lit elements' SIZE, not just the step change.
    //
    // The flavour strip is the one thing left that resizes while a step
    // is up: Simple/Detailed swaps family rows for leaf rows and the
    // block grows ~200px. The temp/steep sliders used to do this too,
    // which is what the double-rAF below was really compensating for —
    // they're a fixed-height row in the tab dock now, and the strip is
    // the last mover. A once-per-step measurement leaves the cutout
    // tracing where the bars WERE, with the callout anchored to it.
    //
    // THE DOCK IS OBSERVED TOO, and it isn't one of the lit elements —
    // it's the thing the cutout is clamped against. Steps open and shut
    // the brew row as they go, which changes the dock's height by ~200px
    // and so moves both the clamp line and every dock element under it.
    // Without this the tour clamps against where the dock USED to be:
    // the prediction step opens the row, the bar grows upward, and a
    // hole measured a moment earlier runs 70px into the menu.
    //
    // It re-measures the target rather than just the dock, which is what
    // also fixes dock-targeted steps — collapsing the row MOVES the brew
    // row without resizing it, and a ResizeObserver on the target alone
    // never hears about a move.
    const observe = (el) => {
      if (ro || typeof ResizeObserver === "undefined") return;
      ro = new ResizeObserver(() => apply(el));
      const dockBar = document.getElementById(BREW_DOCK_ID)?.parentElement;
      for (const n of [...spotEls(el), ...clearEls(), dockBar].filter(Boolean)) {
        ro.observe(n);
      }
    };
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        observe(el);
        if (!scrolled) {
          scrolled = true;
          // Position, let the frame settle, then position AGAIN before
          // measuring. The second pass matters: a step can change the
          // layout it just scrolled to (the Blend steps put the strips
          // back into Simple, which shortens them by ~200px), and the
          // first scroll is computed against the old heights. The
          // observer above keeps the highlight honest afterwards; this
          // pass is about where the group SCROLLS to, which the
          // observer deliberately doesn't touch — re-scrolling under a
          // reader who is watching the bars change would be worse than
          // a slightly off group position.
          position(el);
          raf = requestAnimationFrame(() => {
            position(el);
            raf = requestAnimationFrame(() => {
              apply(el);
              // A THIRD PASS, late. Two frames isn't always enough: this
              // step opens the brew row AND flips the strips back to
              // Simple, and on the desktop layout the group was still
              // settling after both — the prediction bars ended up at
              // top -82 with 21% of them inside the pane, on the one
              // step that says "watch the bars move".
              //
              // 160ms is inside the window where nobody has started
              // reading yet, so this doesn't violate the rule the
              // observer follows (never re-scroll under a reader). It
              // runs once, not on a loop.
              settle = setTimeout(() => {
                position(el);
                // Re-attach the observer if the node was replaced while
                // the step was settling — otherwise later resizes of the
                // new node go unheard.
                const live = document.querySelector(`[data-tour="${step.target}"]`);
                if (live && ro && live !== el) ro.observe(live);
                apply(el);
                // THE ANCHOR SETS HERE, and doesn't move again for this
                // target. Everything before this point is the step
                // arriving — scrolling, opening the brew row, swapping
                // the strips — and placing against a layout still in
                // motion is what produced the jump the moment the graphs
                // finished rendering. Everything after it is a reader
                // with a finger on Next.
                anchorLocked.current = true;
                // And pin the button's edge, from the box as actually
                // rendered. The callout has no transition, so by now it
                // is sitting at its final place and this captures that
                // exact line rather than a predicted one.
                const box = calloutRef.current?.getBoundingClientRect();
                if (box && box.height > 0) setHeldBottom(window.innerHeight - box.bottom);
              }, 160);
            });
          });
        } else {
          apply(el);
        }
      } else {
        raf = requestAnimationFrame(measure);
      }
    };
    measure();
    // A VIEWPORT CHANGE IS THE OTHER THING THAT EARNS A MOVE. Rotating
    // the phone or opening the fold invalidates the placement outright —
    // the held position may not even be on screen any more — so the
    // anchor is released for exactly one re-measure and taken back.
    // Re-locking immediately (rather than waiting for a settle that only
    // runs on a fresh step) is what stops a resize from leaving the
    // callout loose for the rest of the step.
    const onViewportChange = () => {
      anchorLocked.current = false;
      // The held line is a distance from the OLD bottom edge, so it's
      // meaningless once the viewport changes height — kept, it could
      // place the callout off screen entirely. Dropped rather than
      // re-captured: the DOM hasn't re-rendered at this point, so a
      // fresh read here would just record the pre-resize box. The step
      // finishes on ordinary placement, which costs nothing because copy
      // doesn't change within a step — the button has nothing to move
      // for.
      setHeldBottom(null);
      measure();
      anchorLocked.current = true;
    };
    window.addEventListener("resize", onViewportChange);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      if (raf) cancelAnimationFrame(raf);
      if (settle) clearTimeout(settle);
      if (ro) ro.disconnect();
    };
  }, [i, step]);

  if (!step) return null;

  const last = i === steps.length - 1;
  const finish = () => onClose?.();

  // Default 0 so the pulse sits on a button's own border. Borderless
  // targets whose content runs to the edge (e.g. a section wrapper) can
  // set `pad` on their step to give the highlight some breathing room.
  const pad = step.pad != null ? step.pad : 0;
  // Whether this step points at the app's chrome rather than at the
  // page. Asked geometrically — does the target START below where the
  // visible page ends — rather than by keeping a list of dock target
  // names, so a step added to the dock later gets the right treatment
  // without anyone remembering to register it.
  //
  // dockTop is STATE, refreshed by the same observer that tracks the
  // target (see `apply`), because the dock's height is not fixed: steps
  // open and shut the brew row, moving this line by ~200px. Computed
  // during render instead, it was a frame behind on exactly the steps
  // that move it, and the hole ran into the menu.
  const targetInDock = !!rect && rect.top >= dockTop - 1;

  const hole = rect
    ? (() => {
        const box = {
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        };
        // CLAMP THE CUTOUT AT THE DOCK. The page scrolls underneath the
        // glass bar, so a tall page element runs past the bottom of the
        // screen — and an unclamped hole punched straight through the
        // menu, making the tour look like it was highlighting the tab
        // bar along with its actual subject.
        //
        // Clamping the RECT rather than clipping the layer. Clipping
        // worked but cut the pulsing glow at the container edge, so the
        // highlight flickered along that line as it breathed. One
        // full-screen dim with a shorter hole has no seam to flicker on.
        //
        // Only page targets are clamped: four blend steps point at the
        // dock itself, and those need their hole exactly where it is.
        if (!targetInDock && box.top + box.height > dockTop) {
          box.height = Math.max(0, dockTop - box.top);
        }
        return box;
      })()
    : null;

  // Where the callout goes — pure geometry, in helpers/tourLayout.js so
  // it can be tested across the whole device matrix without a browser.
  // The short version: sit on whichever side of the anchor has more
  // room; when neither side fits, overlay the target rather than the
  // step's keep-clear element.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  // Placed against the HELD anchor, not the live rect — that separation
  // is the whole point (see anchorRect above). Falls back to the live
  // geometry for the first frame of the very first step, before an
  // anchor exists.
  const placed = calloutPlacement({
    rect: anchorRect || rect,
    clearRect: anchorRect ? anchorClear : clearRect,
    vh,
  });
  // Swap a top-pinned box for a bottom-pinned one at the same line, so
  // the button stays put while the copy above it changes length. Only
  // when the placement chose the top — a box already pinned by its
  // bottom is holding the right edge already.
  //
  // maxHeight is re-capped so growing UPWARD can't push the head off the
  // screen: whatever calloutPlacement allowed, the box also can't be
  // taller than the room between the held line and the top margin.
  const calloutPos = heldBottom != null && placed.top != null
    ? {
        bottom: heldBottom,
        maxHeight: Math.min(placed.maxHeight ?? Infinity, vh - heldBottom - MARGIN),
      }
    : placed;
  // Compact steps trade callout size for screen. A step that says "watch
  // these two things at once" is competing with its own subject for
  // space, and on a small phone the ordinary callout wins that fight —
  // so those steps shrink the box instead of covering the lesson.
  const tight = !!step.compact;
  const sizing = tight
    ? { pad: "8px 12px", title: 14, body: 11, gapTitle: 3, gapBody: 7, btnPad: "5px 13px" }
    : { pad: "14px 16px", title: 18, body: 13,   gapTitle: 6, gapBody: 14, btnPad: "8px 18px" };

  return (
    <div style={{
      // Full-viewport click-catcher — blocks interaction with the app
      // underneath so the tour is driven by the callout buttons. The
      // container itself is transparent; the dim comes from the hole's
      // box-shadow below. The whole overlay (dim + glow + callout)
      // eases in on mount so the tour arrives gently rather than
      // bursting onto the screen.
      position: "fixed", inset: 0, zIndex: 1000,
      pointerEvents: "auto",
      animation: reduceMotion ? undefined : "tourFadeIn 1.4s cubic-bezier(0.33, 0, 0.2, 1)",
    }}>
      {/* The target's own border, lit white and slowly breathing — a
          soft border-glow that traces the element's exact edge/shape. */}
      <style>{`
        @keyframes tourPulse {
          0%, 100% { border-color: rgba(255,255,255,0.38); box-shadow: 0 0 5px 0px rgba(255,255,255,0.20); }
          50%      { border-color: rgba(255,255,255,0.97); box-shadow: 0 0 15px 4px rgba(255,255,255,0.72); }
        }
        /* Slow on purpose. The tour arrives on top of a screen the
           user is already reading, so it should settle over it rather
           than snap on — and it now waits for Home's own arrival to
           finish before it starts (see arrivalDone in App). */
        @keyframes tourFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      {/* EVERYTHING DIMS — page and chrome alike. What must not cross
          between them is the CUTOUT: a page element that runs under the
          glass dock used to punch its bright hole straight through the
          menu, so the tour looked like it was highlighting the tab bar
          along with the thing it was actually pointing at.

          Two bands, split at the dock's top edge, sharing one hole. The
          band containing the target shows the cutout; the other clips it
          away and renders as solid dim, because the 9999px spread fills
          whatever is left. So the dim is continuous across the whole
          screen while the hole is confined to one side of the line.

          overflow:hidden clips absolute children but not `position:
          fixed` ones, which escape any ancestor without a transform —
          hence absolute children throughout, offset by the band's own
          top so viewport coordinates still describe them. */}
      {/* ONE dim over the whole screen — page, brew row, sub-tabs and
          main menu alike. A tour that leaves the chrome lit makes the
          app's own controls read as still live while everything else is
          switched off. The cutout is kept off the chrome by clamping the
          hole above (see `hole`), not by clipping this layer, so there's
          no container edge for the pulsing glow to flicker against. */}
      <div data-testid="tour-dim" style={{
        position: "fixed", inset: 0, pointerEvents: "none",
      }}>
        {hole ? (
          <>
            {/* Transparent box whose huge spread shadow darkens
                everything except the target, matching its radius so the
                cutout hugs the shape. */}
            <div data-testid="tour-spotlight" style={{
              position: "absolute",
              left: hole.left, top: hole.top,
              width: hole.width, height: hole.height,
              borderRadius: targetRadius,
              boxShadow: "0 0 0 9999px rgba(20,16,10,0.66)",
              pointerEvents: "none",
              transition: "left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease",
            }} />
            {/* Pulsing border — sits exactly on the element's edge so it
                reads as the target's own border lighting up and
                breathing. Shares the clamped rect, so it stops at the
                dock with the cutout rather than drawing a bright line
                across the Time/Temp pills. */}
            <div style={{
              position: "absolute",
              left: hole.left, top: hole.top,
              width: hole.width, height: hole.height,
              borderRadius: targetRadius,
              boxSizing: "border-box",
              border: "2px solid rgba(255,255,255,0.38)",
              pointerEvents: "none",
              animation: "tourPulse 2.6s ease-in-out infinite",
              transition: "left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease",
            }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "rgba(20,16,10,0.66)" }} />
        )}
      </div>

      {/* Callout — only rendered once the target has been measured.
          Before `rect` lands the placement math would fall back to a
          bottom-anchored guess and visibly jump to the real position
          a frame later; hiding it until measurement makes it appear
          in place (the mount fade covers the one-frame delay). */}
      {rect && (
      <div data-testid="tour-callout" ref={calloutRef} style={{
        position: "fixed",
        left: 16, right: 16, maxWidth: 420, margin: "0 auto",
        ...calloutPos,
        // border-box so maxHeight bounds the WHOLE box (padding + border
        // included). With the default content-box, padding+border spill
        // past maxHeight (~30px) and the callout can poke off-screen —
        // that's what tipped Firefox's tall-graph step over the bottom edge.
        boxSizing: "border-box",
        overflowY: "auto",
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        borderRadius: radius.md,
        boxShadow: shadow.card,
        padding: sizing.pad,
        fontFamily: ff.sans,
      }}>
        <div data-testid="tour-progress" style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 6,
        }}>
          {i + 1} / {steps.length}
        </div>
        {step.title && (
          <div style={{
            fontFamily: ff.serif, fontSize: sizing.title, color: theme.ink,
            lineHeight: 1.2, marginBottom: sizing.gapTitle,
          }}>{step.title}</div>
        )}
        <div style={{
          fontFamily: ff.sans, fontSize: sizing.body, color: theme.inkSoft,
          lineHeight: 1.45, marginBottom: sizing.gapBody,
        }}>{step.body}</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button onClick={finish} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: ff.sans, fontSize: 12, color: theme.ash, padding: "6px 4px",
          }}>Skip</button>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && (
              <button onClick={() => setI(i - 1)} style={{
                background: "transparent", cursor: "pointer",
                border: `1px solid ${theme.rule}`, borderRadius: 999,
                fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft,
                padding: sizing.btnPad,
              }}>Back</button>
            )}
            <button onClick={() => (last ? finish() : setI(i + 1))} style={{
              background: theme.terra, color: theme.cream,
              border: "none", borderRadius: 999, cursor: "pointer",
              fontFamily: ff.sans, fontSize: 12, fontWeight: 500,
              letterSpacing: "0.04em", padding: "8px 18px",
            }}>{last ? "Done" : "Next"}</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

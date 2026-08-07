/* ──────────────────────────────────────────────────────────────
   components/Arrival.jsx — things that show up, shown showing up.

   The app animates state changes on what's already on screen — a pill
   turning terra, a chevron rotating, a card lifting under a press —
   and almost nothing about arriving or leaving. A census of ~85
   transitions found `background` 18 times and `width` once, and not a
   single mount animation. So a whole row of chrome, or a warning, or
   an entire screen, would land in one frame and the eye read it as the
   layout breaking rather than something showing up.

   TWO MODES, because two different things happen:

     grow    — the element takes up room it didn't before, and
               everything below moves down. That displacement IS the
               event; showing it travel is what stops the page
               appearing to jump. Used for rows and bands.

     reveal  — the element covers what's already there and displaces
               nothing. Growing its height would be a lie about
               layout, so it opens from the middle outward via
               clip-path: the content sits still at its final position
               the whole time and is simply uncovered. Used for the
               full-screen detail overlays.

   WHY THE HEIGHT IS MEASURED rather than declared in CSS: the natural
   height isn't knowable in advance — a row's depends on its label, a
   dock's on whether the panel is folded. `max-height` big enough for
   the tallest case makes the shortest finish its travel in the first
   third and sit still for the rest, and `grid-template-rows: 0fr->1fr`
   was tried on the brew dock and snaps rather than interpolating
   (measured: 1px to 124px in a single frame).

   ONCE PER ELEMENT, off a ref rather than state. These live inside
   components that re-render on every slider frame; a row that re-grew
   each time you dragged the temperature would be a nightmare rather
   than a flourish.

   REDUCED MOTION SKIPS THE EFFECT ENTIRELY — it doesn't animate
   invisibly and it doesn't withhold anything. This is content and
   chrome the user needs; the honest fallback is for it to be there.
   ────────────────────────────────────────────────────────────── */

import { useLayoutEffect, useRef, useState } from "react";

// Slow out of the gate, soft landing. The brew dock's first attempt
// used cubic-bezier(0.16, 1, 0.3, 1) and still read as a pop: measured,
// it spends 64% of the travel in the first 15% of the time. The eye
// only registers motion it can follow.
const EASING = "cubic-bezier(0.33, 0, 0.2, 1)";

/* THE MEASUREMENT, shared.

   Both the one-way arrival and the two-way disclosure below need the
   same three awkward facts, and a second copy of them is exactly the
   duplication the state audit spent its time removing:

     - the RENDERED height, not scrollHeight, and border-box borrowed
       for the duration — this app has no global border-box reset, so
       `height` excludes padding while scrollHeight includes it, and
       mixing them ends a padded row a padding too tall with a snap on
       the last frame;
     - padding collapses too, because in border-box `height: 0` still
       renders at the padding's height (measured: 16px of ledge
       appearing in one frame on the pot's rows);
     - overflow and box-sizing are borrowed, not kept.

   Returns a cleanup that puts the element back exactly as found. */
const measureAndClip = (el) => {
  const cs = window.getComputedStyle(el);
  const state = {
    height: el.getBoundingClientRect().height,
    paddingTop: cs.paddingTop,
    paddingBottom: cs.paddingBottom,
    priorOverflow: el.style.overflow,
    priorBoxSizing: el.style.boxSizing,
  };
  el.style.overflow = "hidden";
  el.style.boxSizing = "border-box";
  return {
    ...state,
    restore: () => {
      el.style.overflow = state.priorOverflow;
      el.style.boxSizing = state.priorBoxSizing;
    },
  };
};

export const Arrival = ({
  mode = "grow",
  duration = 320,
  children,
  ...rest
}) => {
  const ref = useRef(null);
  const played = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || played.current) return;
    played.current = true;
    if (typeof window === "undefined" || !el.animate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    if (mode === "reveal") {
      el.animate(
        [
          { clipPath: "inset(50% 0 50% 0)", opacity: 0 },
          { clipPath: "inset(0 0 0 0)", opacity: 1 },
        ],
        { duration, easing: EASING },
      );
      return;
    }

    const m = measureAndClip(el);
    if (!m.height) { m.restore(); return; }
    const anim = el.animate(
      [
        { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0 },
        { height: `${m.height}px`, paddingTop: m.paddingTop, paddingBottom: m.paddingBottom, opacity: 1 },
      ],
      { duration, easing: EASING },
    );
    // Hand the height back to the layout the moment it lands — holding
    // a pixel height would freeze the element at whatever size it
    // happened to be, and these things fold, unfold and reflow.
    anim.finished.catch(() => {}).then(m.restore);
  }, [mode, duration]);

  return <div ref={ref} {...rest}>{children}</div>;
};


/* ── Collapse — a disclosure that shows itself opening and closing ──

   The brew row already knew how to fold; it just did it between two
   frames, so a third of the screen appeared and vanished with nothing
   connecting the two states. Same gap the dock's arrival closed, in
   both directions this time.

   NOT a variant of Arrival, deliberately, though they share the
   measuring above. Arrival animates a mount and is done — it runs once
   and never again, which is why it keeps a `played` ref. A disclosure
   runs every time the user asks, has to interrupt itself when they
   change their mind mid-travel, and must keep its children mounted
   through the closing animation or there is nothing left to animate.
   Folding those into one component would mean a flag selecting between
   two behaviours that share four lines.

   CHILDREN STAY MOUNTED while closing, then unmount. That's the whole
   reason this can't be CSS: `{open && <panel/>}` removes the subject
   before it can leave. */
export const Collapse = ({ open, duration = 280, keepMounted = false, children, ...rest }) => {
  const ref = useRef(null);
  const animRef = useRef(null);
  const first = useRef(true);
  /* Styles borrowed by the closing animation, waiting to be handed back
     once the element is out of sight. See the two notes in the effect
     below for why this can't happen where it's convenient. */
  const pendingRestore = useRef(null);

  /* ADJUSTED DURING RENDER, not in an effect.

     Opening needs no state at all — `open` says so. The only thing
     this component has to remember is that it is still CLOSING, so the
     children survive long enough to animate out; `{open && <panel/>}`
     removes the subject before it can leave, which is why this can't
     be CSS.

     Setting that flag from an effect is what React's own
     `react-hooks/set-state-in-effect` rule objects to, and the rule is
     right: it means a render, then an effect, then a second render, to
     express something already knowable from the props. The documented
     alternative is to adjust state during render when a prop changes —
     compare against the previous value and correct immediately, which
     React handles without a wasted pass. */
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setClosing(true);
  }

  useLayoutEffect(() => {
    // Whatever it was doing, it isn't any more — a user who taps twice
    // quickly should get the second answer, not a queue of them.
    animRef.current?.cancel();
    const el = ref.current;
    if (!el) return;

    // No animation on the very first paint: an element that starts open
    // should simply be open, not perform its own arrival.
    if (first.current) { first.current = false; return; }

    const reduced = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!el.animate || reduced) { setClosing(false); return; }

    const m = measureAndClip(el);
    const shut = { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0 };
    const full = {
      height: `${m.height}px`,
      paddingTop: m.paddingTop, paddingBottom: m.paddingBottom, opacity: 1,
    };
    /* `fill` IS LOAD-BEARING ON THE WAY OUT, AND ITS DEFAULT IS WRONG HERE.

       A web animation with the default `fill: "none"` stops applying
       its own values the instant it finishes. The closing run therefore
       animated the panel down to 0 and then, on the very next frame,
       handed the element back its natural height — while React had not
       yet re-rendered to unmount it, because that unmount is a state
       update a frame or more behind.

       Measured: 83 83 … 27 3 then 91 91. The rebound is TALLER than the
       resting 83, because the borrowed border-box sizing re-admits the
       padding the keyframes had collapsed. So the menu didn't just
       reappear on collapse, it reappeared bigger than it ever sits,
       which is exactly what a flicker looks like.

       Holding the last frame until the element is actually gone is the
       whole fix. Opening keeps the default and restores on finish — a
       forwards fill there would pin the height of an element that has
       to stay live and reflow with its content. */
    const anim = el.animate(open ? [shut, full] : [full, shut],
      { duration, easing: EASING, fill: open ? "none" : "forwards" });
    animRef.current = anim;
    /* ORDER MATTERS TOO: this restored the borrowed overflow and
       box-sizing before setting state to unmount, and restoring drops
       the clip a render early. Closing hands nothing back — the element
       is about to be removed. The catch is the cancel path, a second tap
       mid-travel, where the element survives and its styles must return
       (cancel also discards the forwards fill, which is what we want). */
    anim.finished
      .then(() => {
        if (open) { m.restore(); return; }
        // Closing hands nothing back YET — see below.
        pendingRestore.current = m.restore;
        setClosing(false);
      })
      .catch(() => { m.restore(); });
  }, [open, duration]);

  /* THE HAND-BACK HAPPENS AFTER THE ELEMENT IS GONE FROM VIEW.

     Restoring at the end of the closing animation is what caused the
     reported flicker, and hiding rather than unmounting doesn't fix it:
     either way the restore lands a render before the element actually
     disappears, and that render paints it back at full height.

     So the closing path only records what it owes, and this effect pays
     it on the next render — the one where the element is either gone
     (nothing to pay, ref is null) or hidden (safe to pay, nobody can
     see it). Without this a keepMounted panel accumulates the borrowed
     overflow and box-sizing across every open/close cycle, because the
     next measurement captures the borrowed values as if they were the
     originals. */
  useLayoutEffect(() => {
    if (open || closing) return;
    const owed = pendingRestore.current;
    pendingRestore.current = null;
    if (owed && ref.current) owed();
  });

  /* keepMounted: closed means HIDDEN, not gone.

     Unmounting is the right default — a closed panel costs nothing and
     its state is usually derivable again. It is the wrong answer when
     the panel holds something only the user has: the writing dock's
     composer keeps a draft in local state, and folding the dock to
     glance at the timeline threw it away. There is no Cancel there any
     more precisely because the chevron is meant to be safe.

     display:none rather than height 0 or visibility:hidden — the
     element must take no space and no tab stops while it's away, and
     the React state inside it must survive, which is exactly what a
     hidden-but-mounted subtree gives. */
  if (!open && !closing) {
    if (!keepMounted) return null;
    const { style, ...others } = rest;
    return (
      <div ref={ref} aria-hidden {...others} style={{ ...style, display: "none" }}>
        {children}
      </div>
    );
  }
  return <div ref={ref} {...rest}>{children}</div>;
};

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

import { useLayoutEffect, useRef } from "react";

// Slow out of the gate, soft landing. The brew dock's first attempt
// used cubic-bezier(0.16, 1, 0.3, 1) and still read as a pop: measured,
// it spends 64% of the travel in the first 15% of the time. The eye
// only registers motion it can follow.
const EASING = "cubic-bezier(0.33, 0, 0.2, 1)";

export const Arrival = ({
  mode = "grow",
  duration = 320,
  as: Tag = "div",
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

    /* THE RENDERED HEIGHT, and border-box while we animate to it.

       This app has no global `* { box-sizing: border-box }` — only
       #root sets it — so most elements are content-box, where `height`
       excludes padding. scrollHeight includes it. Animating a padded
       row to its scrollHeight in content-box therefore ends a padding's
       worth too tall and snaps back on the last frame. Borrowing
       border-box for the duration makes the number mean the same thing
       at both ends. */
    const height = el.getBoundingClientRect().height;
    if (!height) return;
    // Both restored on landing. Leaving overflow hidden behind would
    // quietly cut off anything that later overhangs the box, and a
    // borrowed box model is not ours to keep.
    const priorOverflow = el.style.overflow;
    const priorBoxSizing = el.style.boxSizing;
    el.style.overflow = "hidden";
    el.style.boxSizing = "border-box";
    /* PADDING COLLAPSES TOO, or the element never reaches zero.

       In border-box, `height: 0` on a padded box still renders at the
       padding's height — padding lives inside the box and can't be
       squeezed out of it. A row with 8px top and bottom therefore began
       its "growth" 16px tall, which is a visible ledge appearing in one
       frame before anything animates. Measured at 16px on the pot's
       rows, which is what caught it. */
    const cs = window.getComputedStyle(el);
    const padTop = cs.paddingTop;
    const padBottom = cs.paddingBottom;
    const anim = el.animate(
      [
        { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0 },
        { height: `${height}px`, paddingTop: padTop, paddingBottom: padBottom, opacity: 1 },
      ],
      { duration, easing: EASING },
    );
    // Hand the height back to the layout the moment it lands — holding
    // a pixel height would freeze the element at whatever size it
    // happened to be, and these things fold, unfold and reflow.
    anim.finished.catch(() => {}).then(() => {
      el.style.overflow = priorOverflow;
      el.style.boxSizing = priorBoxSizing;
    });
  }, [mode, duration]);

  return <Tag ref={ref} {...rest}>{children}</Tag>;
};

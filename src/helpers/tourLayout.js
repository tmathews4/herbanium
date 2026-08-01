/* ──────────────────────────────────────────────────────────────
   helpers/tourLayout.js — guided-tour callout geometry.

   Pure math, deliberately split out of GuidedTour.jsx: where the
   callout lands is the part that breaks (a callout off the bottom of
   a scroll-blocking overlay is unreachable; a callout over the temp/
   steep sliders defeats the step that's teaching them), and it's
   miserable to verify by hand across ten device sizes. Everything
   here takes plain {top, bottom} spans and a viewport height, so
   tests/tour-layout.test.mjs can walk the whole device matrix in
   milliseconds without a browser.

   Coordinates are viewport-relative, matching getBoundingClientRect.
   ────────────────────────────────────────────────────────────── */

export const GAP = 14;           // breathing room between target and callout
export const MARGIN = 16;        // keep the callout off the very screen edge
export const MIN_CALLOUT = 180;  // below this, no room to sit beside the target

/** Vertical span covering every box given, or null for an empty list. */
export function unionSpan(boxes) {
  const list = (boxes || []).filter(Boolean);
  if (list.length === 0) return null;
  return {
    top:    Math.min(...list.map(b => b.top)),
    bottom: Math.max(...list.map(b => b.bottom)),
  };
}

/**
 * Full bounding box covering every box given, or null for an empty
 * list. Used for the spotlight when a step lights up more than one
 * element — e.g. the Simple/Detailed step, which highlights the toggle
 * AND the bars it changes so the user sees what the toggle does.
 */
export function unionRect(boxes) {
  const list = (boxes || []).filter(Boolean);
  if (list.length === 0) return null;
  const top    = Math.min(...list.map(b => b.top));
  const left   = Math.min(...list.map(b => b.left));
  const bottom = Math.max(...list.map(b => b.bottom));
  const right  = Math.max(...list.map(b => b.right));
  return { top, left, bottom, right, width: right - left, height: bottom - top };
}

/**
 * How far to scroll so a step's whole group (target + anything it needs
 * kept visible) sits flush to the bottom of the SCROLL PANE.
 *
 * `region` is the pane's visible box in viewport coordinates — not the
 * viewport itself. That distinction matters: the app scrolls an inner
 * pane between a header and the tab dock, so on a small phone the pane
 * is ~165px shorter than the window, and geometry measured against
 * window.innerHeight quietly lets content slide under the header.
 *
 * Parking the group at the bottom gathers the leftover space into one
 * band above it, and when the group is taller than the pane it puts the
 * overflow at the TOP — so the keep-clear element, which sits at the
 * bottom of the group, stays whole and the target's upper edge is what
 * gets clipped. Same trade the callout placement makes, for the same
 * reason. Returns a delta to add to the pane's scrollTop.
 */
export function groupScrollDelta(group, region) {
  if (!group || !region) return 0;
  const regionH = region.bottom - region.top;
  const groupH  = group.bottom - group.top;
  // Fits: park it flush to the bottom margin, gathering the slack into
  // one band above.
  //
  // Doesn't fit: split the overflow, but NOT evenly — 80% comes off the
  // top. An even split reads better in the abstract and broke the one
  // guarantee that matters: the keep-clear element sits at the BOTTOM
  // of the group, so half the overflow landed on it. Firefox, with
  // 487px of pane against a 565px group, clipped 43px off the temp/
  // steep sliders that way. Biasing the loss upward keeps the sliders
  // near-whole and takes it out of the top of the bars, which are tall
  // enough to spare it.
  const OVERFLOW_TOP_SHARE = 0.8;
  const overflow = groupH - (regionH - 2 * MARGIN);
  const desiredBottom = overflow <= 0
    ? region.bottom - MARGIN
    : region.bottom - MARGIN + overflow * (1 - OVERFLOW_TOP_SHARE);
  const delta = group.bottom - desiredBottom;
  return Math.abs(delta) > 1 ? delta : 0;
}

/**
 * Where to put the callout, as CSS-ready position props.
 *
 * `rect` is the highlighted target. `clearRect` is the span of any
 * keep-clear elements — things the user has to keep seeing while they
 * read this step. The callout sits on whichever side of the combined
 * anchor has more room.
 *
 * When neither side can hold a readable callout it has to overlay
 * something, and which thing is the whole point of keepClear:
 *   - without keepClear, pin to the BOTTOM and cover the target — a
 *     big obvious highlight the user has already looked at.
 *   - with keepClear, pin to the TOP. groupScrollDelta parked the
 *     group flush to the bottom, so the top is where the slack is,
 *     and the callout eats into the target's upper edge instead of
 *     covering the keep-clear element. On the Blend tour that means a
 *     short phone loses the top of the prediction bars before it
 *     loses the temp/steep sliders the step is teaching.
 */
export function calloutPlacement({ rect, clearRect = null, vh }) {
  if (!rect) return {};
  const anchor = clearRect
    ? { top: Math.min(rect.top, clearRect.top), bottom: Math.max(rect.bottom, clearRect.bottom) }
    : rect;
  const spaceAbove = anchor.top;
  const spaceBelow = vh - anchor.bottom;
  const roomier = Math.max(spaceAbove, spaceBelow);
  if (roomier >= MIN_CALLOUT) {
    return {
      ...(spaceBelow >= spaceAbove
        ? { top: anchor.bottom + GAP }
        : { bottom: vh - anchor.top + GAP }),
      maxHeight: roomier - GAP - MARGIN,
    };
  }
  return clearRect
    ? { top: MARGIN,    maxHeight: Math.min(vh - 2 * MARGIN, Math.round(vh * 0.45)) }
    : { bottom: MARGIN, maxHeight: Math.min(vh - 2 * MARGIN, Math.round(vh * 0.55)) };
}

/**
 * Resolve a placement back into the box it produces, given the
 * callout's natural (unclamped) height. Used by the tests to assert
 * on real overlaps rather than on CSS props, and handy for reasoning
 * about a placement without rendering it.
 */
export function calloutBox(pos, naturalHeight, vh) {
  const height = Math.min(naturalHeight, pos.maxHeight ?? naturalHeight);
  const top = pos.top != null ? pos.top : vh - pos.bottom - height;
  return { top, bottom: top + height, height };
}

/** Overlapping height of two spans (0 when they're disjoint). */
export function overlapHeight(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

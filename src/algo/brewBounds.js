/* ──────────────────────────────────────────────────────────────
   algo/brewBounds.js — slider-range padding + safety clamps.

   Slider bounds use one rule for temp and one for time. Both are
   per-blend so each cup's gradient bands show meaningful variation
   across the slider's span (a too-wide span flattens the bands —
   you lose the gradient detail you came to see):

     • TEMP slider lower = a touch below the coldest ingredient's
       tempC min, so the user can see the bottom couple of flavors
       / moods / palate axes start dropping off as they slide
       toward "lighter brew" territory. Upper = boiling (100°C).
     • TIME slider lower = global flash floor (0s); upper = +30%
       past the recipe's longest ingredient max. Flash steeps and
       gongfu rebrews are reachable on any blend.

   Both clamp to global safety bounds. The warnings layer in
   resolveBlendAtBrew handles "you've pushed past the range" — the
   slider just needs to allow the push.
   ────────────────────────────────────────────────────────────── */

// Hard global bounds — past these, brewing physics gets weird
// (boil-off, near-zero extraction) so the slider should never go
// further regardless of the recipe's declared range.
export const TEMP_HARD_MIN = 40;   // °C — global safety floor. Per-blend
                                   //       lower bound is recipe-relative
                                   //       (10°C below the coldest
                                   //       ingredient); this just guards
                                   //       against pathologically low temps.
export const TEMP_HARD_MAX = 100;  // °C — boiling point at sea level
export const TIME_HARD_MIN = 15;   // s — practical floor. 0s isn't a steep,
                                   //       it's pouring water; the lightest
                                   //       legitimate brew is a gongfu flash
                                   //       rinse (~5–15s). 15s is reachable
                                   //       on every cup and keeps every band
                                   //       movement meaningful.
export const TIME_HARD_MAX = 3600; // s — 60 min covers long decoctions

// Padding constants. Temp lower-bound pad scales with the recipe so
// the slider's bottom sits just past where the coldest ingredient
// stops extracting — enough room for the bottom couple of bands to
// visibly drop off, not so much that the recipe's gradient flattens.
// Time upper-bound pad scales with the recipe.
export const TEMP_PAD_BELOW = 10;  // °C below the coldest ingredient's
                                   // tempC min — "right below where the
                                   // bottom couple bands drop off"
// Minimum span the temp slider should cover, regardless of the
// ingredients' natural range. The slider snaps at 5°C, so a 30°C
// span gives 6 increments / 7 positions — enough room to slide
// 'cooler than recipe' without dragging into temperatures the
// leaf would never see. Wider ranges (10 positions / 45°C span)
// invited exploration of brew points that read either 'barely
// extracted' or 'destroyed,' neither particularly useful as a
// learning surface. Cold-brewing recipes (gyokuro at 45°C natural,
// tulsi at 50°C) keep their wider natural span — the floor only
// kicks in when natural span is too narrow.
export const TEMP_MIN_SLIDER_RANGE = 30;
export const TIME_PAD_RATIO = 0.30; // +30% past the recipe's max steep
// Slider step granularity for the time slider. The upper bound is
// rounded UP to a multiple of this so the slider thumb can land on
// it — otherwise the input snaps to the largest step ≤ upper bound
// and the user feels stuck near the right edge.
//
// FIVE SECONDS, arrived at from 15 via 1.
//
// 15s was a slider-geometry compromise from when both axes shared the
// width, and it made the prediction bars jump rather than sweep. 1s
// fixed the sweep and overshot: a chamomile blend became 531 steps over
// a ~364px track, 0.69px each, which is precision the data has and a
// finger does not. 5s keeps the sweep, makes every position reachable,
// and lands on the numbers people set timers to.
//
// Temperature stays on 5°C notches for a different reason, worth not
// conflating: temp is a value the user has to REPRODUCE at a kettle
// that probably has no thermostat, which is why the app answers it with
// rest-time advice ("off the boil ~2 min") — and advice like that is
// only sayable against round numbers. Time's notches are about the
// slider; temp's are about the kettle.
export const TIME_STEP_S = 5;
// Below this span the coarse step costs more than it buys.
export const TIME_FINE_SPAN_S = 90;
export const TIME_STEP_FINE_S = 1;

/**
 * The step for a given time range.
 *
 * 5s almost everywhere. At 1s a chamomile blend is 531 steps across a
 * ~364px track — 0.69px each, which is sub-pixel: the precision existed
 * in the data and not in anything a finger could do. 5s gives 106
 * positions at 3.4px, still a gradient under a drag, and lands on the
 * round numbers people actually set timers to.
 *
 * But a flat 5s guts the short end. Matcha's window is 15-39s: 24
 * positions at 1s, FIVE at 5s. Seconds are the whole resolution of a
 * whisk time or a gongfu flash steep, so ranges that short keep them.
 */
export function timeStepFor(range) {
  if (!range) return TIME_STEP_S;
  const [lo, hi] = range;
  return (hi - lo) <= TIME_FINE_SPAN_S ? TIME_STEP_FINE_S : TIME_STEP_S;
}

/**
 * Single-range helpers used by IngredientDetail (where the explorer
 * is for one ingredient, not a blend). Same per-recipe rules as the
 * blend versions, applied to the single ingredient's range.
 */
export function padTempRange([lo, _hi]) {
  const naturalLo = Math.max(TEMP_HARD_MIN, lo - TEMP_PAD_BELOW);
  const widenedLo = Math.min(naturalLo, TEMP_HARD_MAX - TEMP_MIN_SLIDER_RANGE);
  return [
    Math.max(TEMP_HARD_MIN, widenedLo),
    TEMP_HARD_MAX,
  ];
}

export function padTimeRange([_lo, hi]) {
  const padded = hi * (1 + TIME_PAD_RATIO);
  // Round the SPAN, not the value, so the labeled max is landable: an
  // HTML range steps from `min`, so hi - lo has to divide by the step.
  // The step itself depends on the span, so it's picked from the
  // unrounded figure first — a boundary case can only move it by one
  // step, which the ceil then absorbs.
  const step = timeStepFor([TIME_HARD_MIN, Math.ceil(padded)]);
  const stepAligned = TIME_HARD_MIN
    + Math.ceil((Math.ceil(padded) - TIME_HARD_MIN) / step) * step;
  return [
    TIME_HARD_MIN,
    Math.min(TIME_HARD_MAX, stepAligned),
  ];
}

/**
 * Per-blend temp slider bounds: lower = a touch below the coldest
 * ingredient's tempC[0] (so the bottom couple of bands visibly drop
 * off as the slider moves toward the cold end), upper = boiling.
 * Each blend gets its own narrow-enough span to show real gradient.
 */
export function unionAndPadTempRange(ingredients, INGREDIENTS) {
  if (!ingredients?.length) {
    const lo = Math.min(
      Math.max(TEMP_HARD_MIN, 90 - TEMP_PAD_BELOW),
      TEMP_HARD_MAX - TEMP_MIN_SLIDER_RANGE,
    );
    return [lo, TEMP_HARD_MAX];
  }
  let lo = Infinity;
  for (const { id } of ingredients) {
    const range = INGREDIENTS[id]?.tempC;
    if (!range) continue;
    if (range[0] < lo) lo = range[0];
  }
  if (!Number.isFinite(lo)) lo = 90;
  const naturalLo = Math.max(TEMP_HARD_MIN, lo - TEMP_PAD_BELOW);
  const widenedLo = Math.min(naturalLo, TEMP_HARD_MAX - TEMP_MIN_SLIDER_RANGE);
  return [
    Math.max(TEMP_HARD_MIN, widenedLo),
    TEMP_HARD_MAX,
  ];
}

/**
 * Time slider bounds: lower = global flash floor, upper = 30% past the
 * MOST-FRAGILE LEAD ingredient's max steep.
 *
 * Why min-of-leads instead of max-of-all: a blend's tolerance is set
 * by its most fragile lead. Pairing chamomile (max 420s) with
 * valerian root (max 1800s) at the union-max of 1800 × 1.3 = 2340s
 * isn't "exploration room" — it's a destroyed chamomile lead, well
 * past its over-pull boundary. The cup the recipe stands behind ends
 * at the chamomile's tolerance; the slider should respect that.
 *
 * Catalysts (trace doses) and accents (deliberately stretched by the
 * curator) don't shape the upper bound. Only leads count. If no roles
 * are declared (legacy data), every ingredient is treated as a lead.
 */
export function unionAndPadTimeRange(ingredients, INGREDIENTS) {
  if (!ingredients?.length) {
    const padded = 600 * (1 + TIME_PAD_RATIO);
    // Round the SPAN, not the value, so the labeled max is landable: an
  // HTML range steps from `min`, so hi - lo has to divide by the step.
  // The step itself depends on the span, so it's picked from the
  // unrounded figure first — a boundary case can only move it by one
  // step, which the ceil then absorbs.
  const step = timeStepFor([TIME_HARD_MIN, Math.ceil(padded)]);
  const stepAligned = TIME_HARD_MIN
    + Math.ceil((Math.ceil(padded) - TIME_HARD_MIN) / step) * step;
    return [TIME_HARD_MIN, Math.min(TIME_HARD_MAX, stepAligned)];
  }
  let leadHi = Infinity;   // min of lead maxes
  let anyLead = false;
  for (const { id, role } of ingredients) {
    const r = role || "lead";
    if (r !== "lead") continue;
    const range = INGREDIENTS[id]?.timeS;
    if (!range) continue;
    anyLead = true;
    if (range[1] < leadHi) leadHi = range[1];
  }
  // Defensive fallback: if every ingredient was an accent/catalyst
  // (rare/unlikely), fall back to the union max of those so the
  // slider is at least usable instead of stuck at -Infinity.
  if (!anyLead) {
    leadHi = -Infinity;
    for (const { id } of ingredients) {
      const range = INGREDIENTS[id]?.timeS;
      if (!range) continue;
      if (range[1] > leadHi) leadHi = range[1];
    }
  }
  if (!Number.isFinite(leadHi)) leadHi = 600;
  // Round UP to the slider's step boundary so the slider thumb can
  // actually reach the upper edge. Without this, leadHi×1.3 can fall
  // between two step values and the slider snaps to the largest step
  // below it, leaving the user feeling stuck near the right end.
  //
  // At a 1s step this only clears the fraction 1.3× leaves behind
  // (175 → 227.5 → 228) rather than the up-to-14s it used to add. Still
  // load-bearing, and still the same rule — the max has to be landable.
  const padded = leadHi * (1 + TIME_PAD_RATIO);
  // Round the SPAN, not the value, so the labeled max is landable: an
  // HTML range steps from `min`, so hi - lo has to divide by the step.
  // The step itself depends on the span, so it's picked from the
  // unrounded figure first — a boundary case can only move it by one
  // step, which the ceil then absorbs.
  const step = timeStepFor([TIME_HARD_MIN, Math.ceil(padded)]);
  const stepAligned = TIME_HARD_MIN
    + Math.ceil((Math.ceil(padded) - TIME_HARD_MIN) / step) * step;
  return [
    TIME_HARD_MIN,
    Math.min(TIME_HARD_MAX, stepAligned),
  ];
}

/* ──────────────────────────────────────────────────────────────
   TEMPERATURE AND TIME ARE ONE VARIABLE, ALMOST.

   Every one of the 52 extraction profiles moves tempC and timeS
   together — 75C/180s, 95C/300s, 100C/420s. They aren't a grid of
   independent samples; they're a DIAGONAL through (temp, time) space,
   because that's how extraction actually works: hotter water pulls
   faster, so the ideal steep shortens as the temperature climbs.

   The UI presents two independent sliders, which is fine as a control
   surface but was wrong as a recommendation — the sweet spot on the
   time axis never moved when you changed the temperature, and setting
   hot-and-short put you at a point no profile ever sampled while the
   app went on showing a confident band.

   These read the ideal off the profile's own diagonal, so the
   recommendation moves with the other axis and the two sliders start
   teaching the tradeoff instead of hiding it.
   ────────────────────────────────────────────────────────────── */

/** Where `value` sits on `from`, read across to `to`. Clamped at both
 *  ends: past the last sampled point the honest answer is the last
 *  sampled point, not an extrapolation the research never made. */
export function alongProfile(rows, from, to, value) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const pts = rows
    .filter(r => r && r[from] != null && r[to] != null)
    .map(r => ({ x: Number(r[from]), y: Number(r[to]) }))
    .sort((a, b) => a.x - b.x);
  if (pts.length === 0) return null;
  if (pts.length === 1) return pts[0].y;
  if (value <= pts[0].x) return pts[0].y;
  if (value >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (value <= b.x) {
      const t = b.x === a.x ? 0 : (value - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
  }
  return pts[pts.length - 1].y;
}

/**
 * The recommended window on `axis`, given where the OTHER axis is set.
 *
 * Each ingredient's profile answers "at this temperature, I want this
 * long" on its own; the blend's window is the span those answers
 * cover. A single-ingredient cup would otherwise collapse to a point,
 * so the result is widened to `minSpan` around its centre — a
 * recommendation you can't move inside is decoration, which is the bug
 * that started this.
 *
 * Returns null when no ingredient has a profile to read, so callers
 * can fall back to the declared ranges rather than invent a window.
 */
export function coupledBand({ ingredients, profiles, axis, otherValue, within, minSpan = 0 }) {
  /* IT REFINES AN AGREEMENT. IT DOES NOT MANUFACTURE ONE.
     `within` is the window the leaves already agree on by their own
     declared ranges. Without it this function has nothing to narrow,
     and the first version showed why that matters: valerian wants
     600-900s, cinnamon 300-600s, and at 95°C their ideals are 900s and
     300s. Taking min..max of those produced a TEN MINUTE "sweet spot"
     — the width of their disagreement, presented as a recommendation.
     Two leaves that fight each other should show no band at all, which
     is exactly what the declared-range intersection already said. */
  if (!within) return null;
  const [wLo, wHi] = within;
  if (!(wHi > wLo)) return null;

  const other = axis === "timeS" ? "tempC" : "timeS";
  const ideals = (ingredients || [])
    .filter(ing => ing && ing.role !== "catalyst")
    .map(ing => alongProfile(profiles[ing.id], other, axis, otherValue))
    .filter(v => v != null && Number.isFinite(v));
  if (ideals.length === 0) return null;

  /* CENTRED ON THE IDEALS, SIZED BY THEIR SPREAD, CLIPPED TO THE
     AGREEMENT.

     Simply intersecting the ideals with the agreed window looked
     right and did almost nothing: the ideals frequently sit OUTSIDE
     that window — chamomile wants 180s at 70°C when the blend's
     agreed floor is 240s — so the intersection collapsed to the whole
     window and the band stopped moving at every temperature except
     the few where both ideals happened to land inside. A recommendation
     that only moves sometimes is worse than one that never does,
     because you can't tell which you're looking at.

     Centring keeps it tracking: the middle follows the leaves' answers
     even when those answers are off the end, while the clip still
     guarantees it never recommends outside what they agree on. */
  const centre = Math.max(wLo, Math.min(wHi, (Math.min(...ideals) + Math.max(...ideals)) / 2));
  const half = Math.max(minSpan / 2, (Math.max(...ideals) - Math.min(...ideals)) / 2);
  const lo = Math.max(wLo, centre - half);
  const hi = Math.min(wHi, centre + half);
  if (hi <= lo) return [wLo, wHi];
  return [lo, hi];
}

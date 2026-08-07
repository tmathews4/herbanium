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
export function unionAndPadTimeRange(ingredients, INGREDIENTS, timeReach = null) {
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
    /* AS FAR AS THE EVIDENCE GOES, not as far as we'd recommend.

       The card's timeS is what we RECOMMEND; the profile has usually
       been measured past it, and those over-pull rows are kept
       precisely so the curve and the warnings know what a stretched cup
       does. The slider stopped at the recommendation, which put the
       rows out of reach of the person they describe — chamomile's 420s
       row says the tannins follow after the apigenin maxes out, and no
       finger could get there.

       So the reach is the further of the two. Nothing about the
       recommendation moves: the band, the RECOMMENDED target and the
       warnings all still read the card range. Only how far you may drag
       past it changes.

       NO GLOBAL FLOOR, deliberately. Sending every slider to a fixed 8
       minutes would run 29 of 52 ingredients past their last measured
       row, where the prediction stops moving AND — because the warning
       thresholds live in those rows — no warning fires. A slider that
       travels past the point the app stopped evaluating is worse than a
       short slider: it reports a stretched cup as a fine one. The way
       to lengthen those is to write the research and add the row.

       Still the MINIMUM across leads. A blend can only be stretched as
       far as its most delicate lead tolerates; widening that would drag
       the control out of proportion the moment a short-steep herb
       shares a pot with a long one. */
    const reach = Math.max(range[1], timeReach?.[id] || 0);
    if (reach < leadHi) leadHi = reach;
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

/* ──────────────────────────────────────────────────────────────
   THE COMPROMISE ZONE.

   Lived inline in BlendExtractionExplorer, which meant the rail could
   draw it and computeBrewProfile could not reach it — so a blend with
   no full intersection opened at a grams-weighted centroid that had no
   relationship to the band on screen. assam + matcha + chamomile
   started at 30s under a band sitting at 4-7 minutes: the app
   recommended one thing and put you somewhere else.

   Same knowledge, two callers, one definition.

   It is also, exactly, "the most condensed spot with the outliers
   removed": clip every ingredient's window to the primary lead's,
   sweep the endpoints, and return the longest run where the most
   ingredients overlap. Nothing is averaged, so a lone outlier can't
   drag the answer — it just fails to be counted in the busiest
   segment.
   ────────────────────────────────────────────────────────────── */

/**
 * @param ranges  [{ id?, [axis]: [lo, hi] }] — non-catalyst ingredients
 * @param primary the heaviest lead; its window bounds the search
 * @param axis    "tempC" | "timeS"
 * @returns { range: [lo, hi], coverage, total } or null when there is
 *          no zone worth naming — fewer than two windows overlap, or
 *          the primary stands alone.
 */
export function bestCoverageZone(items, primary, axis) {
  if (!primary) return null;
  const [pMin, pMax] = primary[axis] || [];
  if (pMin == null || pMax == null) return null;

  const ranges = [];
  for (const ing of items || []) {
    const [iMin, iMax] = (ing && ing[axis]) || [];
    if (iMin == null || iMax == null) continue;
    const lo = Math.max(iMin, pMin);
    const hi = Math.min(iMax, pMax);
    if (hi > lo) ranges.push([lo, hi]);
  }
  if (ranges.length < 2) return null;   // primary plus at least one other

  const points = new Set([pMin, pMax]);
  for (const [a, b] of ranges) { points.add(a); points.add(b); }
  const sorted = [...points].sort((a, b) => a - b);

  const segments = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (b <= a) continue;
    const mid = (a + b) / 2;
    let count = 0;
    for (const [rA, rB] of ranges) if (mid >= rA && mid <= rB) count++;
    segments.push({ a, b, count });
  }
  if (segments.length === 0) return null;

  const maxCount = Math.max(...segments.map(s => s.count));
  if (maxCount < 2) return null;        // the primary alone isn't a zone

  let best = null, run = null;
  for (const seg of segments) {
    if (seg.count === maxCount) {
      if (run && run.b === seg.a) run.b = seg.b;
      else run = { a: seg.a, b: seg.b };
      if (!best || (run.b - run.a) > (best.b - best.a)) best = { a: run.a, b: run.b };
    } else {
      run = null;
    }
  }
  if (!best) return null;
  return { range: [best.a, best.b], coverage: maxCount, total: (items || []).length };
}

/* ──────────────────────────────────────────────────────────────
   WHICH BAND IS RECOMMENDED, and where inside it a tap should land.

   Both of these lived inside BlendExtractionExplorer, which is fine
   right up until something else has to agree with the rail. The
   opening brew point had to, and didn't — see bestCoverageZone above,
   which came out of the same component for the same reason.
   ────────────────────────────────────────────────────────────── */

/**
 * The band the rail paints for one axis, in priority order:
 *
 *   1. the COUPLED band — where the profiles actually sampled this
 *      pairing at the value the other slider is holding,
 *   2. the full INTERSECTION of the declared windows,
 *   3. the COMPROMISE zone, when there is no intersection at all.
 *
 * Returns { lo, hi, kind: "sweet" | "compromise", coverage?, total? }
 * or null when the leaves have no common ground worth drawing. Copy
 * stays with the caller: this answers where, not what to call it.
 */
export function recommendedBand({ items, primary, profiles, axis, otherValue }) {
  const pool = items || [];
  const within = (() => {
    let lo = -Infinity, hi = Infinity;
    for (const ing of pool) {
      const [iMin, iMax] = (ing && ing[axis]) || [];
      if (iMin == null || iMax == null) continue;
      lo = Math.max(lo, iMin);
      hi = Math.min(hi, iMax);
    }
    return isFinite(lo) && isFinite(hi) && hi > lo ? [lo, hi] : null;
  })();

  const coupled = coupledBand({
    ingredients: pool, profiles, axis, otherValue,
    // Only ever narrows what the leaves already agree on. No agreement,
    // no coupled band — the compromise path below handles that case and
    // says so honestly.
    within,
    minSpan: axis === "timeS" ? 60 : 4,
  });
  if (coupled) {
    const lo = Math.round(coupled[0]), hi = Math.round(coupled[1]);
    if (hi > lo) return { lo, hi, kind: "sweet" };
  }
  if (within) return { lo: within[0], hi: within[1], kind: "sweet" };

  const zone = bestCoverageZone(pool, primary, axis);
  if (zone) {
    return {
      lo: zone.range[0], hi: zone.range[1], kind: "compromise",
      coverage: zone.coverage, total: zone.total,
    };
  }
  return null;
}

/**
 * Where inside a band a "put me on the recommendation" tap should land:
 * the centre of it.
 *
 * NO CLAMP HERE, and that is the point. This used to stop short of the
 * earliest-closing window on the time axis, borrowing the rule
 * computeBrewProfile opens on — never hand someone a cup that arrives
 * already over-pulled, because over-pulling warns while under-steeping
 * is silent.
 *
 * That rule belongs to OPENING a cup and not to tapping a control. The
 * two were computed by the same clamp, so on any blend where a leaf
 * closes early the tap landed exactly where the slider already sat and
 * the word did nothing at all — 238 of 400 sampled three-leaf blends
 * whose time band is a compromise zone. Reported as "temp was fine but
 * time won't move".
 *
 * An opening brew is a default the user didn't ask for; a tap is a
 * request they did. Answering a request by refusing to move, silently,
 * teaches nothing. Going where the word says — and letting the
 * over-pull warning fire if it fires — is the honest answer, and the
 * warning is the lesson rather than the accident.
 *
 * computeBrewProfile still clamps. That is where the rule lives.
 */
export function bandTarget({ band }) {
  if (!band) return null;
  return (band.lo + band.hi) / 2;
}

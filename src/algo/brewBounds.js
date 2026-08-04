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
// ONE SECOND, where temperature still moves in 5°C notches. The two
// axes look symmetric and aren't, in a second way beyond their spans:
// temperature is something the user has to REPRODUCE at a kettle, and
// most kettles have no thermostat — which is why the app answers a
// temperature with rest-time advice ("off the boil ~2 min"). Advice
// like that only means anything against round numbers; 5°C notches are
// what makes it sayable. Steep time has no such problem. A timer does
// seconds natively, so the notches were never buying the user
// anything — they were only ever a slider-geometry compromise, and
// moving to one axis at a time in the dock gave the width back.
//
// The read-through: the prediction bars now respond continuously to a
// drag instead of in 15s jumps, which is the whole reason Time is the
// axis the sliders open on.
export const TIME_STEP_S = 1;

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
  const stepAligned = Math.ceil(padded / TIME_STEP_S) * TIME_STEP_S;
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
    const stepAligned = Math.ceil(padded / TIME_STEP_S) * TIME_STEP_S;
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
  const stepAligned = Math.ceil(padded / TIME_STEP_S) * TIME_STEP_S;
  return [
    TIME_HARD_MIN,
    Math.min(TIME_HARD_MAX, stepAligned),
  ];
}

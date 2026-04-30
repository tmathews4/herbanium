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
export const TIME_HARD_MIN = 0;    // s — slider starts at 0 per user request.
                                   //       Bands render fully transparent at
                                   //       t=0 (nothing extracted yet); slider
                                   //       step keeps movement meaningful.
export const TIME_HARD_MAX = 3600; // s — 60 min covers long decoctions

// Padding constants. Temp lower-bound pad scales with the recipe so
// the slider's bottom sits just past where the coldest ingredient
// stops extracting — enough room for the bottom couple of bands to
// visibly drop off, not so much that the recipe's gradient flattens.
// Time upper-bound pad scales with the recipe.
export const TEMP_PAD_BELOW = 10;  // °C below the coldest ingredient's
                                   // tempC min — "right below where the
                                   // bottom couple bands drop off"
export const TIME_PAD_RATIO = 0.30; // +30% past the recipe's max steep

/**
 * Single-range helpers used by IngredientDetail (where the explorer
 * is for one ingredient, not a blend). Same per-recipe rules as the
 * blend versions, applied to the single ingredient's range.
 */
export function padTempRange([lo, _hi]) {
  return [
    Math.max(TEMP_HARD_MIN, lo - TEMP_PAD_BELOW),
    TEMP_HARD_MAX,
  ];
}

export function padTimeRange([_lo, hi]) {
  return [
    TIME_HARD_MIN,
    Math.min(TIME_HARD_MAX, Math.round(hi * (1 + TIME_PAD_RATIO))),
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
    return [Math.max(TEMP_HARD_MIN, 90 - TEMP_PAD_BELOW), TEMP_HARD_MAX];
  }
  let lo = Infinity;
  for (const { id } of ingredients) {
    const range = INGREDIENTS[id]?.tempC;
    if (!range) continue;
    if (range[0] < lo) lo = range[0];
  }
  if (!Number.isFinite(lo)) lo = 90;
  return [
    Math.max(TEMP_HARD_MIN, lo - TEMP_PAD_BELOW),
    TEMP_HARD_MAX,
  ];
}

/**
 * Time slider bounds: lower = global flash floor, upper = 30% past the
 * recipe's longest ingredient max. This keeps short steeps reachable
 * on every cup while giving each blend its own oversteep envelope.
 */
export function unionAndPadTimeRange(ingredients, INGREDIENTS) {
  if (!ingredients?.length) {
    return [TIME_HARD_MIN, Math.min(TIME_HARD_MAX, Math.round(600 * (1 + TIME_PAD_RATIO)))];
  }
  let hi = -Infinity;
  for (const { id } of ingredients) {
    const range = INGREDIENTS[id]?.timeS;
    if (!range) continue;
    if (range[1] > hi) hi = range[1];
  }
  if (!Number.isFinite(hi)) hi = 600;
  return [
    TIME_HARD_MIN,
    Math.min(TIME_HARD_MAX, Math.round(hi * (1 + TIME_PAD_RATIO))),
  ];
}

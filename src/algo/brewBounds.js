/* ──────────────────────────────────────────────────────────────
   algo/brewBounds.js — slider-range padding + safety clamps.

   Every cup follows the same rule for slider bounds — standardized
   so no recipe gets weirdly more or less room than another:
     • Temp slider extends slightly below the recipe's coldest
       reasonable steep (so the user can drop a few degrees and
       see what happens) but does not pad above the recipe's max.
     • Time slider extends 30% past the recipe's max (room to
       oversteep and watch the bitter/tannic envelope grow) but
       does not pad below the recipe's min.

   Both clamp to global brew-safety bounds: water doesn't get hotter
   than boil; sub-15s isn't a steep. The warnings layer in
   resolveBlendAtBrew handles "you've pushed past the range" — the
   slider just needs to allow the push.
   ────────────────────────────────────────────────────────────── */

// Hard global bounds — past these, brewing physics gets weird
// (boil-off, near-zero extraction) so the slider should never go
// further regardless of the recipe's declared range.
export const TEMP_HARD_MIN = 60;   // °C — below this no useful extraction for tea
export const TEMP_HARD_MAX = 100;  // °C — boiling point at sea level
export const TIME_HARD_MIN = 15;   // s — anything below is a flash, not a steep
export const TIME_HARD_MAX = 3600; // s — 60 min covers long decoctions

// Asymmetric padding — only the directions where exploration adds
// signal. Going slightly cooler is interesting (under-extraction
// preview); going hotter than the recipe's max is rarely useful
// because the recipe already targets the upper bound for that style.
// On time it's the inverse: oversteep reveals tannin/bitter ramp;
// understeep below recipe min is just a flash with little to learn.
export const TEMP_PAD_BELOW = 5;   // °C — "slightly lower than the
                                   //       coldest reasonable steep"
export const TIME_PAD_RATIO  = 0.30; // +30% past the recipe's max steep

export function padTempRange([lo, hi]) {
  return [
    Math.max(TEMP_HARD_MIN, lo - TEMP_PAD_BELOW),
    Math.min(TEMP_HARD_MAX, hi),
  ];
}

export function padTimeRange([lo, hi]) {
  return [
    Math.max(TIME_HARD_MIN, lo),
    Math.min(TIME_HARD_MAX, Math.round(hi * (1 + TIME_PAD_RATIO))),
  ];
}

/**
 * Union of every ingredient's temp range, padded with experimentation
 * room. Used as slider bounds for blend explorers — single source of
 * truth so the blend and ingredient hosts can't drift in how they
 * compute slider walls. Pass an INGREDIENTS lookup to keep this
 * module free of catalog-data imports.
 */
export function unionAndPadTempRange(ingredients, INGREDIENTS) {
  if (!ingredients?.length) return padTempRange([90, 100]);
  let lo = Infinity, hi = -Infinity;
  for (const { id } of ingredients) {
    const [a, b] = INGREDIENTS[id].tempC;
    if (a < lo) lo = a;
    if (b > hi) hi = b;
  }
  return padTempRange([lo, hi]);
}

export function unionAndPadTimeRange(ingredients, INGREDIENTS) {
  if (!ingredients?.length) return padTimeRange([120, 600]);
  let lo = Infinity, hi = -Infinity;
  for (const { id } of ingredients) {
    const [a, b] = INGREDIENTS[id].timeS;
    if (a < lo) lo = a;
    if (b > hi) hi = b;
  }
  return padTimeRange([lo, hi]);
}

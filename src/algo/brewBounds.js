/* ──────────────────────────────────────────────────────────────
   algo/brewBounds.js — slider-range padding + safety clamps.

   The recipe's union range (or a single ingredient's range) tells
   the algorithm where the sweet spot lives, but it's also the
   slider's hard wall in the UI. That can feel cramped when a user
   wants to try "what does this taste like at 95°C instead of 90°C?"
   on a blend whose union maxes at 90.

   These helpers pad the recipe-relative range with a fixed amount
   on each side, then clamp to global brew-safety bounds (water
   doesn't get hotter than boil; sub-15s isn't a steep). The
   warnings layer in resolveBlendAtBrew handles "you've pushed past
   the range" — the slider just needs to allow the push.
   ────────────────────────────────────────────────────────────── */

// Hard global bounds — past these, brewing physics gets weird
// (boil-off, near-zero extraction) so the slider should never go
// further regardless of the recipe's declared range.
export const TEMP_HARD_MIN = 60;   // °C — below this no useful extraction for tea
export const TEMP_HARD_MAX = 100;  // °C — boiling point at sea level
export const TIME_HARD_MIN = 15;   // s — anything below is a flash, not a steep
export const TIME_HARD_MAX = 3600; // s — 60 min covers long decoctions and
                                   //     cold-brew-style experimental steeps.
                                   //     The TrackMap underlay paints far-past-
                                   //     range as 'experimental' territory so
                                   //     the user sees they've left the recipe.

// Experimentation padding — how far past the recipe's union the
// slider extends. Wider than the older ±10°C / ±2min walls so the
// profile graphs have visible "outside normal range" room — the
// user asked to see what extraction looks like clearly past the
// recipe's neighborhood, which the small pad didn't expose.
export const TEMP_PAD = 20;        // ±20°C on each side (was 10)
export const TIME_PAD = 300;       // ±5 min on each side (was 2 min)

export function padTempRange([lo, hi]) {
  return [
    Math.max(TEMP_HARD_MIN, lo - TEMP_PAD),
    Math.min(TEMP_HARD_MAX, hi + TEMP_PAD),
  ];
}

export function padTimeRange([lo, hi]) {
  return [
    Math.max(TIME_HARD_MIN, lo - TIME_PAD),
    Math.min(TIME_HARD_MAX, hi + TIME_PAD),
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

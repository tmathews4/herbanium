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
export const TIME_HARD_MAX = 1800; // s — 30 min covers root decoctions

// Experimentation padding — how far past the recipe's union the
// slider extends. Tuned so a user can try a clearly-different brew
// without leaving the recipe's neighborhood entirely.
export const TEMP_PAD = 10;        // ±10°C on each side
export const TIME_PAD = 120;       // ±2 min on each side

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

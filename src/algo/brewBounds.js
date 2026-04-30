/* ──────────────────────────────────────────────────────────────
   algo/brewBounds.js — slider-range padding + safety clamps.

   Slider bounds are standardized across every cup using one rule
   for temp and one rule for time:

     • TEMP slider is the SAME for every cup — lower = slightly
       below the coldest steep in the entire ingredient catalog
       (e.g. ~5°C below gyokuro), upper = boiling. The user gets
       the full reasonable tea-brewing envelope on every blend so
       experiments line up visually across screens.
     • TIME slider runs from the global flash floor up to 30% past
       the recipe's longest ingredient max steep. Lower bound does
       NOT use the recipe's min (so flash steeps and gongfu rebrews
       are reachable on any cup).

   Both clamp to global safety bounds. The warnings layer in
   resolveBlendAtBrew handles "you've pushed past the range" — the
   slider just needs to allow the push.
   ────────────────────────────────────────────────────────────── */

// Hard global bounds — past these, brewing physics gets weird
// (boil-off, near-zero extraction) so the slider should never go
// further regardless of the recipe's declared range.
export const TEMP_HARD_MIN = 45;   // °C — sits 5° below the catalog's
                                   //       coldest steep (tulsi at 50°C),
                                   //       per "slightly lower than the
                                   //       lowest you'd want to steep" rule.
export const TEMP_HARD_MAX = 100;  // °C — boiling point at sea level
export const TIME_HARD_MIN = 0;    // s — slider starts at 0 per user request.
                                   //       Bands render fully transparent at
                                   //       t=0 (nothing extracted yet); slider
                                   //       step keeps movement meaningful.
export const TIME_HARD_MAX = 3600; // s — 60 min covers long decoctions

// Padding constants. Temp lower-bound pad lives on the global
// catalog floor (not the recipe), so every cup's slider starts at
// the same place. Time upper-bound pad scales with the recipe.
export const TEMP_PAD_BELOW_GLOBAL = 5; // °C below the catalog's coldest
                                        // steep — "slightly lower than
                                        // the lowest you'd want to steep"
export const TIME_PAD_RATIO         = 0.30; // +30% past the recipe's max steep

/**
 * Single-range helpers used by IngredientDetail (where the explorer
 * is for one ingredient, not a blend). They follow the same standard
 * rules as the blend versions: temp ignores the input range and uses
 * the global tea envelope; time keeps the input max but applies the
 * +30% oversteep pad and snaps the lower bound to the global flash
 * floor. Keeps single-ingredient screens visually aligned with blend
 * screens.
 */
export function padTempRange(_range) {
  return [TEMP_HARD_MIN, TEMP_HARD_MAX];
}

export function padTimeRange([_lo, hi]) {
  return [
    TIME_HARD_MIN,
    Math.min(TIME_HARD_MAX, Math.round(hi * (1 + TIME_PAD_RATIO))),
  ];
}

/**
 * Compute the catalog-wide minimum tempC across all ingredients.
 * Memoized by INGREDIENTS reference since the catalog is effectively
 * static at runtime — recomputing per render would be cheap but the
 * cache keeps the bounds object identity stable.
 */
let _cachedGlobalTempLo = null;
let _cachedCatalogRef   = null;
function globalCatalogTempLo(INGREDIENTS) {
  if (INGREDIENTS === _cachedCatalogRef && _cachedGlobalTempLo != null) {
    return _cachedGlobalTempLo;
  }
  let lo = Infinity;
  for (const id of Object.keys(INGREDIENTS)) {
    const range = INGREDIENTS[id]?.tempC;
    if (!range) continue;
    if (range[0] < lo) lo = range[0];
  }
  if (!Number.isFinite(lo)) lo = 70;  // safety fallback
  _cachedCatalogRef   = INGREDIENTS;
  _cachedGlobalTempLo = lo;
  return lo;
}

/**
 * Standardized temp slider bounds for every cup: [globalCatalogLo - pad,
 * boiling]. Recipe ingredients aren't consulted — the same envelope
 * shows up on every blend so experiments compare apples-to-apples.
 */
export function unionAndPadTempRange(ingredients, INGREDIENTS) {
  const globalLo = globalCatalogTempLo(INGREDIENTS);
  const lo = Math.max(TEMP_HARD_MIN, globalLo - TEMP_PAD_BELOW_GLOBAL);
  return [lo, TEMP_HARD_MAX];
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

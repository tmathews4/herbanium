/* ──────────────────────────────────────────────────────────────
   algo/caffeine.js — one conversion, read by everything that shows
   a milligram figure.

   `meta.caffeine` is transcribed straight from each research doc's
   "caffeine (mg per ~8oz cup)" row — assam 60, sencha 25, matcha 60.
   IT IS A FIGURE PER CUP-DOSE OF THAT LEAF, NOT PER GRAM. Turning a
   recipe's grams into milligrams therefore means dividing by what a
   cup's dose of that category weighs, and the whole trap is that
   multiplying instead produces a plausible-looking number.

   compose.js fixed this in its own reducer and wrote the reasoning
   down — "a standard 2g cup of assam reported 120mg against a
   documented 60" — but the fix stayed inside the engine. The two
   places that print the number on a recipe rather than on a brew,
   BlendDetail's heads-up tag and the recipe row's `caf ~Xmg` badge,
   kept their own copies of the old formula. So the same page could
   say 120mg at the top and 60mg in the caffeine gauge below, which is
   how it was reported.

   Measured before the fix: 23 blends showed a caffeine figure and
   every one was high — x2.0 across the true teas, x1.2 for yerba
   mate, exactly each leaf's cup-dose.

   NO EXTRACTION FACTOR HERE, deliberately. The engine scales its
   number by how hot and how long you are actually brewing, because it
   describes a cup being made. These two describe a RECIPE — what it
   holds at the brew it recommends — and a badge that changed as you
   dragged a slider you cannot see from the shelf would be worse than
   one that doesn't move.
   ────────────────────────────────────────────────────────────── */

import { TSP_BY_CATEGORY } from "../units/units.js";
import { INGREDIENTS } from "../data/ingredients.js";

/** How many cup-doses of this leaf `g` grams is. */
export const cupDosesFor = (g, category) =>
  (g || 0) / (TSP_BY_CATEGORY[category] || 1.5);

/**
 * Caffeine in mg for a recipe as written, at its recommended brew.
 * Takes the `{ id, g }` list a blend carries.
 */
export function nominalCaffeineMg(ingredients) {
  return (ingredients || []).reduce((sum, ing) => {
    const meta = INGREDIENTS[ing?.id];
    if (!meta || !meta.caffeine) return sum;
    return sum + meta.caffeine * cupDosesFor(ing.g, meta.category);
  }, 0);
}

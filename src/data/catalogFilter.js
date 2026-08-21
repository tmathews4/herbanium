/* ──────────────────────────────────────────────────────────────
   data/catalogFilter.js — where the Recipes shelf lands.

   One constant, in one place, because the shape was written out four
   times: App's initial state, App's reset when you enter Recipes,
   ComposeScreen's merge fallback for older cached state, and the
   Home-favorite deep link. Three of those are the same decision and
   the fourth is a different one — which is exactly the arrangement
   where a literal drifts, since changing "the default" means finding
   all three and knowing to leave the fourth alone.

   IT USED TO BE `favorites`, on the reasoning that a brew-now visit
   most often wants a cup you already trust. That turned out to be the
   wrong bet for a shelf: the recipes page is where browsing happens,
   and landing on the narrowest possible slice — empty, for anyone who
   hasn't starred anything — hides the catalogue behind a chip the
   user has to know to press.

   The Home-favorite deep link deliberately does NOT read this. Tapping
   a specific favorite is a jump to that recipe, not a browse, and it
   narrows the list to make the preselected one legible.
   ────────────────────────────────────────────────────────────── */

/** The collection the Recipes shelf opens on. */
export const DEFAULT_COLLECTION = "all";

/** A fresh, unfiltered catalogue state. Callers spread cached state
    over this, so a new sub-filter key gets a default for free. */
export const defaultCatalogFilter = () => ({
  collection: DEFAULT_COLLECTION, moods: [], flavors: [],
});

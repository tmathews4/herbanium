/* How many parts a leaf starts at when you add it to the composer.
 *
 * WHY THIS EXISTS. Every ingredient used to start at the same place —
 * the first added at 2 parts, everything after at 1 — so adding
 * peppermint to a black tea proposed a 1:2 cup, which reads mint-led.
 * Real blending doesn't work that way: a base carries most of the pot
 * and an accent trims it. Asked directly as "stuff like peppermint
 * starts at lower parts than stuff like tea?", and the shelf agrees.
 *
 * NOTE THIS IS NOT DENSITY. `TSP_BY_CATEGORY` already knows a teaspoon
 * of chamomile weighs 1.0g and a teaspoon of ginger 2.5g, and parts are
 * normalized against it, so a part of each is already the same share of
 * a cup. What this file adds is the CONVENTION on top: how much of a
 * blend that leaf usually is. The catalog proves the two are
 * independent — peppermint and assam have identical solo doses ("1 tsp ·
 * 200ml") and completely different blend shares, 34% against 69%.
 *
 * DERIVED, NOT DECIDED, wherever the shelf can answer. 24 of the 52
 * profiled ingredients appear in three or more curated blends, and their
 * numbers come straight from the median share those blends give them —
 * see tools/derive-blend-shares.mjs. `tests/blend-shares.test.mjs`
 * re-derives and fails when a shipped value drifts from the shelf, so
 * adding curated blends tells you which defaults moved instead of
 * quietly making this file wrong.
 *
 * THE WHOLE-PARTS FLOOR IS REAL. One part against a nine-part lead is
 * 10% of the pot, and the shelf brews cloves at 3%, black pepper at 4%,
 * cinnamon and cardamom at 8%. Those land at 1 and are therefore
 * HEAVIER than the catalog brews them — a limit of the ratio
 * language, not a bad reading. Weight mode is the answer for spice work,
 * and the derivation tool prints every ingredient sitting on that floor.
 */

/** Where the shelf's typical base lands, and what it lands on. */
export const BASE_PARTS = 4;

/* Measured: the median share these take across curated blends,
   converted to whole parts against a 4-part base. */
export const DERIVED_PARTS = {
  ceylon: 5, assam: 4, rooibos: 4, chamomile: 4,
  hibiscus: 3,
  peppermint: 2, "dried-apple": 2, lemongrass: 2, lemonbalm: 2, spearmint: 2,
  tulsi: 1, "lemon-peel": 1, sencha: 1, ginger: 1, rose: 1, bergamot: 1,
  fennel: 1, "orange-peel": 1, lavender: 1, cardamom: 1, cinnamon: 1,
  vanilla: 1, "black-pepper": 1, cloves: 1,
};

/* ASSIGNED, because the shelf has fewer than three examples. Each is
   placed against a measured neighbor rather than invented, and the
   reason is written here rather than in a commit nobody will find.
   When a curated blend gives one of these three appearances, it moves
   to DERIVED_PARTS above and the guard starts holding it. */
export const ASSIGNED_PARTS = {
  // True teas are bases, and the four measured ones (ceylon 5, assam 4,
  // rooibos 4) agree. Sencha's measured 1 is the exception and it is
  // real — it appears as a trim in the blends it's in, not as a base —
  // so it is NOT generalised to the other greens here.
  white: 4, gyokuro: 4, matcha: 4, genmaicha: 4, gunpowder: 4,
  hojicha: 4, dragonwell: 4, oolong: 4, darjeeling: 4, puerh: 4,
  // Lapsang is a base that behaves like a spice. Its phenols carry at
  // 2.0 loudness and mask floral at 0.85, so a full base share buries
  // whatever it is blended with. Half a base.
  lapsang: 2,
  // Roasted roots drink like bases — dandelion root is the standard
  // coffee substitute and reads at rooibos's weight.
  "dandelion-root": 4, "yerba-mate": 4,
  // Mid-weight leaf, the lemonbalm/spearmint band at 2.
  nettle: 2, "dandelion-leaf": 2, sage: 2, echinacea: 2, elderflower: 2,
  linden: 2, passionflower: 2, cranberry: 2,
  // Jasmine is a scented green sold as a tea, but its floral carries
  // like rose — measured at 1 — so it sits between the two.
  jasmine: 2,
  // Powdered adaptogens and fungi: dense, earthy, and easy to overdo.
  // Sat at 2 rather than a base share because they are added FOR the
  // adaptogen, not as the body of the cup.
  ashwagandha: 2, reishi: 2, "lions-mane": 2,
  // Licorice is a sweetener that dominates a cup at a pinch — the same
  // job as vanilla (measured at 1) and treated the same.
  "licorice-root": 1,
  // A spice, and one of the loud ones. Ginger and cinnamon both measure 1.
  turmeric: 1,
  // Valerian is a strong sedative with a notoriously heavy smell; it is
  // dosed as an accent even in the blends built around it.
  valerian: 1,
};

export const BLEND_PARTS = { ...DERIVED_PARTS, ...ASSIGNED_PARTS };

/**
 * How many parts this leaf starts at.
 *
 * The fallback is 2 — the mid band, not the base share. An ingredient
 * nobody has placed yet should arrive as an accent rather than
 * proposing itself as the body of the cup, because the second is the
 * more expensive way to be wrong: it quietly rewrites the blend the
 * user was building.
 */
export const defaultPartsFor = (id) => BLEND_PARTS[id] ?? 2;

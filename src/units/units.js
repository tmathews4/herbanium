/* ──────────────────────────────────────────────────────────────
   units/units.js — temperature and weight formatting

   Two coupled concerns live here:

   1. Formatters — pure functions that convert internal values
      (always stored in Celsius and grams) to user-facing strings
      that respect the user's unit preferences.

   2. Context + hook — a React context that propagates the user's
      unit preferences down the component tree. Any component can
      `useUnit()` to get the current prefs and setters.

   Toggle components are NOT here. The Profile screen renders its
   own inline unit toggles using this context's setters directly.
   ────────────────────────────────────────────────────────────── */

import React from "react";

/* ─── Context ──────────────────────────────────────────────── */

export const UnitContext = React.createContext({
  unit: "F", setUnit: () => {},                 // temperature — "C" | "F"
  weightUnit: "tsp", setWeightUnit: () => {},   // weight — "tsp" | "g"
  pour: "mug", setPour: () => {},               // how much you're making — a POUR_SIZES key
});

export const useUnit = () => React.useContext(UnitContext);

/* ─── Temperature formatters ───────────────────────────────── */

export const cToF = (c) => Math.round(c * 9 / 5 + 32);

export const formatTemp = (c, unit = "C") =>
  unit === "F" ? `${cToF(c)}°F` : `${c}°C`;

export const formatTempRange = (minC, maxC, unit = "C") => {
  if (minC === maxC) return formatTemp(minC, unit);
  if (unit === "F") return `${cToF(minC)}–${cToF(maxC)}°F`;
  return `${minC}–${maxC}°C`;
};

// Short form for compact chips (no °F/°C suffix, just the numbers and a degree).
export const formatTempShort = (minC, maxC, unit = "C") => {
  if (unit === "F") {
    return minC === maxC ? `${cToF(minC)}°` : `${cToF(minC)}–${cToF(maxC)}°`;
  }
  return minC === maxC ? `${minC}°` : `${minC}–${maxC}°`;
};

/* ─── Weight formatters ────────────────────────────────────── */

// Grams-per-teaspoon by ingredient category. Folk-tea convention, not lab-precise —
// densities vary wildly by how packed the spoon is, but this gets "1 tsp per cup"
// feeling right for the common cases.
export const TSP_BY_CATEGORY = {
  "flower":    1.0,  // chamomile, lavender, rose — light and fluffy
  "herbal":    1.2,  // lemon balm, mint, nettle — leafy but denser than flowers
  "true tea":  2.0,  // sencha, assam, darjeeling, oolong — standard tea-leaf convention
  "spice":     2.5,  // ginger, cinnamon, cardamom — dense chips/pieces
  "adaptogen": 3.0,  // ashwagandha, reishi, turmeric — typically powdered
};

export const gramsToTsp = (g, category) => {
  const perTsp = TSP_BY_CATEGORY[category] || 1.5;
  return g / perTsp;
};

// Turn a quarter-rounded decimal into "1½", "¼", "2¾" etc. using unicode fractions.
export const prettyFraction = (n) => {
  const whole = Math.floor(n);
  const frac = n - whole;
  const fracStr = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  if (whole === 0 && fracStr) return fracStr;
  if (fracStr) return `${whole}${fracStr}`;
  return `${whole}`;
};

// Format a tsp amount with ¼-tsp rounding, rolling up to tablespoons at 3+ tsp.
// Small amounts fall back to "pinch."
export const formatTsp = (tsp) => {
  if (tsp < 0.15) return "pinch";
  const q = Math.round(tsp * 4) / 4;
  if (q >= 3) {
    const tbsp = q / 3;
    const tbspQ = Math.round(tbsp * 4) / 4;
    return `${prettyFraction(tbspQ)} tbsp`;
  }
  return `${prettyFraction(q)} tsp`;
};

// The one-stop formatter that respects user weightUnit preference.
// Category is required because tsp conversion is density-aware.
export const formatAmount = (g, category, weightUnit = "tsp") => {
  if (weightUnit === "g") return `${g.toFixed(1)} g`;
  return formatTsp(gramsToTsp(g, category));
};

/* The same question for a POT rather than a leaf: what do I measure out
   in total, in the unit the user chose.

   SUM THE TEASPOONS, DO NOT CONVERT THE SUMMED GRAMS. Grams add freely
   across categories; teaspoons do not, because a teaspoon is a volume
   and every category has its own density — 1.0g of chamomile against
   3.0g of powdered adaptogen, a threefold spread. Adding the grams and
   dividing once by any single density is wrong for every mixed pot,
   and wrong by more the more the pot mixes.

   `items` is [{ grams, category }] rather than ids, so this stays a
   formatter and does not reach into the catalog. */
export const formatTotal = (items, weightUnit = "tsp") => {
  if (weightUnit === "g") {
    return `${items.reduce((sum, it) => sum + (it.grams || 0), 0).toFixed(1)} g`;
  }
  return formatTsp(items.reduce(
    (sum, it) => sum + gramsToTsp(it.grams || 0, it.category), 0));
};

/* ─── Pour size — how much you're making ───────────────────────
   Parts are a RATIO, and a ratio needs a total before it is a cup.
   This is that total, measured in cup-doses rather than grams,
   because a teaspoon of chamomile and a teaspoon of ginger are not
   the same mass and `TSP_BY_CATEGORY` already knows it.

   WHY THIS EXISTS. Parts used to be grams outright, so "5 parts
   assam : 1 part peppermint" built a 6g pot — 3.33 cups' worth of
   leaf in one cup. Every strong flavor then sat at its ceiling and
   the strip went flat (malty 5.00, bold 5.00, minty 5.00, unable to
   say which led). Reported as "that feels wrong", and it was, but not
   where it looked: the readings were right and the pour was heavy.
   The same ratio normalized to one cup reads malty 3.48, minty 1.52 —
   assam leading, mint an accent.

   A FIXED SET, not a free-form total — that would re-open the exact
   hole this closes. Each entry is a named vessel someone actually
   pours into, and `doses` is `ml / REFERENCE_ML` by construction:
   every profile in the catalog is written per 200 ml ("1 tsp ·
   200ml"), so a vessel's dose count is just how many reference cups
   of water it holds. `tests/pour-parts.test.mjs` derives that from
   this table rather than restating it, so a size added with mismatched
   numbers fails before a browser starts.

   WHY A MUG. "A cup" meaning 200 ml is a measurement, not a vessel —
   the mug most people actually drink from is 12 oz / 350 ml, and the
   gap sent a real user to a search engine to check whether our 2 g of
   assam was too little. It wasn't; it was a cup's worth, and they were
   filling a mug. The volume is on the label for that reason. */
export const REFERENCE_ML = 200;

export const POUR_SIZES = {
  cup: { doses: 1,    ml: 200, tspLabel: "1 tsp",  name: "a cup" },
  mug: { doses: 1.75, ml: 350, tspLabel: "1¾ tsp", name: "a mug" },
  pot: { doses: 3,    ml: 600, tspLabel: "1 tbsp", name: "a pot" },
};

export const pourDoses = (pour) => POUR_SIZES[pour]?.doses ?? 1;

/**
 * Turn a parts ratio into grams, normalized so the whole pot comes to
 * `pour`'s worth of leaf.
 *
 * `entries` is [{ id, parts }]; `gramsPerCup` resolves an id to what a
 * cup's dose of THAT leaf weighs. Returns { id: grams }.
 *
 * Each part is a share of the pour measured in CUP-DOSES, not grams,
 * which is the whole point: one part of chamomile and one part of
 * ginger are the same fraction of a cup, not the same mass.
 */
export const partsToGrams = (entries, pour, gramsPerCup) => {
  const total = entries.reduce((s, e) => s + Math.max(0, e.parts || 0), 0);
  const out = {};
  if (!total) return out;
  const doses = pourDoses(pour);
  for (const e of entries) {
    const share = Math.max(0, e.parts || 0) / total;
    out[e.id] = share * doses * gramsPerCup(e.id);
  }
  return out;
};

/**
 * The inverse view: what ratio is this pot already in?
 *
 * Grams stay canonical — they are what the cup is actually made of, and
 * what weight mode edits directly — so parts are DERIVED rather than
 * stored. That is what keeps the old promise that switching between
 * parts and weight never changes the cup: there is still one store.
 *
 * Scaled so the smallest ingredient reads 1 part, which is the ratio
 * language the steppers were built for.
 */
export const gramsToParts = (entries, gramsPerCup) => {
  const doses = entries
    .map(e => ({ id: e.id, d: (e.g || 0) / (gramsPerCup(e.id) || 1.5) }))
    .filter(x => x.d > 0);
  if (!doses.length) return {};
  const min = Math.min(...doses.map(x => x.d));
  const out = {};
  for (const x of doses) out[x.id] = x.d / min;
  return out;
};

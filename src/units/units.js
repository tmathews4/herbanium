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
  pour: "cup", setPour: () => {},               // how much you're making — "cup" | "pot"
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

/* ─── Pour size — how much you're making ───────────────────────
   Parts are a RATIO, and a ratio needs a total before it is a cup.
   This is that total, measured in cup-doses rather than grams,
   because a teaspoon of chamomile and a teaspoon of ginger are not
   the same mass and `TSP_BY_CATEGORY` already knows it.

   WHY THIS EXISTS. Parts used to be grams outright, so "5 parts
   assam : 1 part peppermint" built a 6g pot — 3.33 cups' worth of
   leaf in one cup. Every strong flavour then sat at its ceiling and
   the strip went flat (malty 5.00, bold 5.00, minty 5.00, unable to
   say which led). Reported as "that feels wrong", and it was, but not
   where it looked: the readings were right and the pour was heavy.
   The same ratio normalised to one cup reads malty 3.48, minty 1.52 —
   assam leading, mint an accent.

   Two sizes and no more. A cup is the unit every extraction profile
   in the catalogue is written against ("1 tsp · 200ml"), and a pot is
   the one other thing people actually brew. A free-form total would
   re-open the exact hole this closes.  */
export const POUR_SIZES = {
  cup: { doses: 1, tspLabel: "1 tsp", name: "a cup" },
  pot: { doses: 3, tspLabel: "1 tbsp", name: "a pot" },
};

export const pourDoses = (pour) => POUR_SIZES[pour]?.doses ?? 1;

/**
 * Turn a parts ratio into grams, normalised so the whole pot comes to
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

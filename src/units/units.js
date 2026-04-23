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

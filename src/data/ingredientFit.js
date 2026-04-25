/* ──────────────────────────────────────────────────────────────
   data/ingredientFit.js — helpers for slotting new ingredients
   into the 1-5 gradient system the catalog uses.

   The catalog's effect strengths run on a perception-calibrated
   scale where 5 is "the catalog's strongest expression of this
   profile" and 1 is "trace, supportive". Authors adding a new
   ingredient should describe effects qualitatively and let the
   helpers convert + validate.

   Three exports:

     STRENGTH_RUBRIC   — qualitative tier → 1-5 number.
     placeIngredient   — convert a qualitative effects spec into
                         the [[tag, n], ...] tuple form ingredients.js
                         expects, sorted with bitterness last.
     auditIngredient   — sanity-check a candidate ingredient before
                         it ships: bad strengths, unknown effect
                         tags, strengths above the current catalog
                         max (which would invalidate the rubric).
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "./ingredients.js";

// Qualitative → numeric. Authors should write tier names (not bare
// numbers) when entering a new ingredient — keeps the rubric the
// shared vocabulary rather than something each author re-derives.
export const STRENGTH_RUBRIC = Object.freeze({
  signature:  5,  // "this ingredient defines this profile"
  strong:     4,  // "clearly carries this profile"
  pronounced: 3,  // "definitely present"
  present:    2,  // "felt but not dominant"
  trace:      1,  // "faint, supportive"
});

// The canonical effect tags. Validators warn when a new ingredient
// introduces a tag outside this set — typo guard for things like
// "groundding" or "uplift".
export const CANONICAL_EFFECTS = new Set([
  "calm", "focus", "energy", "sleepy", "comfort", "settle",
  "soothing", "warming", "cooling", "digestive", "grounding", "uplifting",
  // Perception-layer tag — not a chip mood, but legitimately appears
  // in extraction-profile effects when extraction starts to pull
  // bitter compounds.
  "bitterness",
]);

/**
 * Convert a qualitative effect spec into the [tag, strength] tuple
 * form ingredients.js stores.
 *
 *   placeIngredient({ calm: "strong", sleepy: "pronounced" })
 *     → [["calm", 4], ["sleepy", 3]]
 *
 * Numbers are also accepted for hybrid specs:
 *
 *   placeIngredient({ calm: 4, sleepy: "pronounced" })
 *     → [["calm", 4], ["sleepy", 3]]
 *
 * Throws on unknown tags, unknown tiers, or out-of-range numbers.
 * Sorts the result with bitterness last (perception convention)
 * and otherwise by descending strength.
 */
export function placeIngredient(spec) {
  const out = [];
  for (const [tag, level] of Object.entries(spec)) {
    if (!CANONICAL_EFFECTS.has(tag)) {
      throw new Error(
        `placeIngredient: unknown effect tag "${tag}". ` +
        `Canonical effects: ${[...CANONICAL_EFFECTS].join(", ")}.`
      );
    }
    let strength;
    if (typeof level === "number") {
      strength = level;
    } else if (typeof level === "string") {
      if (!(level in STRENGTH_RUBRIC)) {
        throw new Error(
          `placeIngredient: unknown tier "${level}" for ${tag}. ` +
          `Use one of: ${Object.keys(STRENGTH_RUBRIC).join(", ")}.`
        );
      }
      strength = STRENGTH_RUBRIC[level];
    } else {
      throw new Error(`placeIngredient: ${tag} must be a number or tier name, got ${typeof level}.`);
    }
    if (strength < 1 || strength > 5) {
      throw new Error(`placeIngredient: ${tag} strength ${strength} outside 1-5.`);
    }
    out.push([tag, strength]);
  }
  return out.sort((a, b) => {
    if (a[0] === "bitterness") return 1;
    if (b[0] === "bitterness") return -1;
    return b[1] - a[1];
  });
}

/**
 * Catalog-max per effect tag. The 1-5 rubric assumes 5 = "strongest
 * in the catalog" — any new ingredient claiming a tag above the
 * current max would invalidate that invariant.
 */
function catalogMaxByTag() {
  const max = {};
  for (const ing of Object.values(INGREDIENTS)) {
    for (const [tag, s] of (ing.effects || [])) {
      max[tag] = Math.max(max[tag] || 0, s);
    }
  }
  return max;
}

/**
 * Audit a candidate ingredient before it ships. Returns an array of
 * warning strings — empty array means the ingredient is well-formed.
 *
 * Catches:
 *   - Missing required fields (name, latin, category, tempC, timeS)
 *   - tempC / timeS not in [min, max] tuple form
 *   - Effects entry not in [tag, strength] tuple form
 *   - Unknown effect tag (typo against CANONICAL_EFFECTS)
 *   - Strengths outside 1-5
 *   - Strengths above the catalog max for that tag (rubric invariant)
 */
export function auditIngredient(ing) {
  const warnings = [];

  const reqd = ["name", "latin", "category", "tempC", "timeS"];
  for (const k of reqd) {
    if (!(k in ing)) warnings.push(`missing required field: ${k}`);
  }
  if (ing.tempC !== undefined && (!Array.isArray(ing.tempC) || ing.tempC.length !== 2)) {
    warnings.push(`tempC must be [min, max] tuple`);
  }
  if (ing.timeS !== undefined && (!Array.isArray(ing.timeS) || ing.timeS.length !== 2)) {
    warnings.push(`timeS must be [min, max] tuple`);
  }

  const max = catalogMaxByTag();
  for (const entry of (ing.effects || [])) {
    if (!Array.isArray(entry) || entry.length !== 2) {
      warnings.push(`effects entry should be [tag, strength], got ${JSON.stringify(entry)}`);
      continue;
    }
    const [tag, s] = entry;
    if (!CANONICAL_EFFECTS.has(tag)) {
      warnings.push(`unknown effect tag "${tag}" — typo? canonical effects: ${[...CANONICAL_EFFECTS].join(", ")}`);
    }
    if (typeof s !== "number" || s < 1 || s > 5) {
      warnings.push(`effect ${tag} strength ${s} outside 1-5`);
    }
    if (max[tag] && typeof s === "number" && s > max[tag]) {
      warnings.push(
        `effect ${tag} at ${s} exceeds catalog max ${max[tag]} — ` +
        `rubric invariant is "5 = catalog-strongest". Either bump the rubric or rescale.`
      );
    }
  }
  return warnings;
}

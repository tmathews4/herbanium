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
  "calm", "focus", "energy", "sleepy", "comfort",
  "soothing", "warming", "cooling", "digestive", "grounding", "uplifting",
  // Perception-layer tag — not a chip mood, but legitimately appears
  // in extraction-profile effects when extraction starts to pull
  // bitter compounds.
  "bitterness",
]);

// Canonical flavor vocabulary — every flavor word allowed on an
// ingredient must live in this set. Catches typos and silent
// vocabulary drift the same way CANONICAL_EFFECTS does for moods.
// Synonyms (citrus/citrusy, mint/minty, smoky/smoked, toasty/toasted)
// are intentionally both included; if you want to consolidate, do a
// catalog-wide rename rather than dropping one from this list.
export const KNOWN_FLAVORS = new Set([
  "anise", "apple", "apricot", "aromatic", "bean", "bergamot", "bitter",
  "bittersweet", "bold", "bright", "brisk", "buttery", "campfire", "camphor",
  "caramel", "caramel-roasted", "chestnut", "citrus", "citrusy", "clove",
  "cocoa", "coffee-adjacent", "complex", "cool", "cranberry", "creamy",
  "dark", "delicate", "earthy", "floral", "fresh", "fruit", "fruity",
  "grassy", "hay", "heady", "herbaceous", "honey", "honey-sweet", "honeyed",
  "hot", "leather", "licorice", "lychee", "malty", "marine", "melon",
  "mineral", "mint", "minty", "muscatel", "mushroom", "mushroomy", "musky",
  "musty", "numbing", "nutty", "oceanic", "orchid", "peach", "peppery",
  "pine", "pungent", "rice", "rich", "roasted", "robust", "savory",
  "seafood-like", "seaweed", "smoked", "smoky", "spiced", "spinach-like",
  "sweet", "tannic", "tar", "tart", "toasted", "toasty", "umami", "vanilla",
  "vegetal", "warm", "woody",
]);

// Effect anchors — for each declared mood/effect axis, the ingredient
// that *defines* the top of the 1-5 scale. The anchor must hold the
// declared strength on the declared tag; if it drifts, the rubric
// invariant breaks (every other ingredient is calibrated relative
// to these). Add anchors for new axes deliberately, not casually.
export const EFFECT_ANCHORS = Object.freeze({
  calm:      { id: "chamomile",  strength: 5 },
  focus:     { id: "matcha",     strength: 5 },
  cooling:   { id: "peppermint", strength: 5 },
  warming:   { id: "ginger",     strength: 5 },
  sleepy:    { id: "valerian",   strength: 5 },
  energy:    { id: "assam",      strength: 5 },
  uplifting: { id: "darjeeling", strength: 5 },
  grounding: { id: "reishi",     strength: 5 },
  // Anethole's antispasmodic specificity makes fennel the cleanest
  // single answer for digestive — peppermint and ginger are also strong
  // but their primary registers are cooling and warming respectively.
  digestive: { id: "fennel",     strength: 5 },
  // Licorice root, and the old note here explains why without meaning
  // to: it ruled licorice out for leaning into "throat-coat". Throat
  // coat IS soothing — the demulcent action, mucilage on irritated
  // tissue, which is what the word means in materia medica. Rooibos
  // was anchoring it on "full-body, low-tannin smoothness", which is
  // a comfort claim, and rooibos has since moved to comfort along
  // with the six other ingredients whose docs described warm
  // relaxation under soothing's name.
  //
  // Anchored at 4 rather than 5 because that is what §5 rates it —
  // "primary effect, strong throat-soothing tradition, demulcent
  // quality from polysaccharides".
  soothing:  { id: "licorice-root", strength: 4 },
  // Comfort anchors at 4 now, on hojicha. It sat at 3 on genmaicha
  // because comfort's best exemplars were filed under `soothing` —
  // hojicha's own §5 calls it "the defining comfort-tea register" at
  // strength 4 while rating it as soothing. Once that register moved
  // to the word its research already used, the archetype and the
  // ceiling came with it.
  //
  // The note that used to sit here observed that "no ingredient in
  // the catalog hits a signature-5 pure comfort register" and
  // anchored at 4 anyway. It was half-right: the ingredient existed,
  // under another name.
  comfort:   { id: "hojicha",    strength: 4 },
});

// Flavor anchors — for each declared flavor axis, the ingredient
// whose flavor list must contain the tag. Same drift-guard as
// effect anchors but on the taste axis.
export const FLAVOR_ANCHORS = Object.freeze({
  smoked:  "lapsang",
  minty:   "peppermint",
  earthy:  "puerh",
  citrus:  "lemongrass",
  floral:  "chamomile",
  umami:   "matcha",
});

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
  for (const f of (ing.flavors || [])) {
    if (typeof f !== "string") {
      warnings.push(`flavor entry should be a string, got ${JSON.stringify(f)}`);
      continue;
    }
    if (!KNOWN_FLAVORS.has(f)) {
      warnings.push(
        `unknown flavor "${f}" — typo? if intentional, add it to KNOWN_FLAVORS in ingredientFit.js.`
      );
    }
  }
  for (const pid of (ing.pairs || [])) {
    if (typeof pid !== "string") {
      warnings.push(`pairs entry should be an ingredient id string, got ${JSON.stringify(pid)}`);
      continue;
    }
    if (!INGREDIENTS[pid]) {
      warnings.push(`pairs references unknown ingredient id "${pid}"`);
    }
  }
  return warnings;
}

/**
 * Preview where a candidate ingredient would land in the catalog —
 * authoring aid, not a runtime helper. Takes the same qualitative
 * spec placeIngredient accepts (`{calm: "strong", sleepy: 3}`) and
 * returns the resolved tuples plus a per-tag report of who already
 * sits on each strength rung. Lets an author eyeball "calm 4 puts
 * me alongside lemon balm, gyokuro, valerian — does that feel
 * right?" before committing the number.
 *
 *   const { tuples, report } = previewPlacement({calm: "strong"});
 *   // tuples: [["calm", 4]]
 *   // report[0].rungs[5] => ["chamomile"]   (the anchor)
 *   // report[0].rungs[4] => ["gyokuro", "lemonbalm", "linden", ...]
 *
 * Throws on the same conditions placeIngredient throws on (unknown
 * tag, unknown tier, out-of-range strength).
 */
export function previewPlacement(spec) {
  const tuples = placeIngredient(spec);
  const tierFor = (n) => {
    for (const [tier, value] of Object.entries(STRENGTH_RUBRIC)) {
      if (value === n) return tier;
    }
    return null;
  };

  const report = [];
  for (const [tag, suggested] of tuples) {
    const rungs = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const [id, ing] of Object.entries(INGREDIENTS)) {
      const eff = (ing.effects || []).find(([t]) => t === tag);
      if (!eff) continue;
      if (rungs[eff[1]]) rungs[eff[1]].push(id);
    }
    for (const key of Object.keys(rungs)) rungs[key].sort();
    const anchor = EFFECT_ANCHORS[tag] || null;
    report.push({
      tag,
      suggested,
      tierName: tierFor(suggested),
      anchor,
      rungs,
    });
  }
  return { tuples, report };
}

/**
 * Validate that every declared anchor still holds. Returns an array
 * of warnings — empty array means anchors are intact. Run this from
 * the test suite so a casual edit to chamomile or matcha can't
 * silently break the catalog's calibration.
 */
export function validateCatalogAnchors() {
  const warnings = [];
  for (const [tag, anchor] of Object.entries(EFFECT_ANCHORS)) {
    const ing = INGREDIENTS[anchor.id];
    if (!ing) {
      warnings.push(
        `effect anchor for "${tag}" → "${anchor.id}" is missing from the catalog`
      );
      continue;
    }
    const entry = (ing.effects || []).find(([t]) => t === tag);
    if (!entry) {
      warnings.push(
        `effect anchor "${anchor.id}" no longer carries the "${tag}" tag — ` +
        `either restore it at strength ${anchor.strength} or pick a new anchor`
      );
      continue;
    }
    if (entry[1] !== anchor.strength) {
      warnings.push(
        `effect anchor "${anchor.id}" "${tag}" strength is ${entry[1]}, ` +
        `expected ${anchor.strength} — rubric invariant broken`
      );
    }
  }
  for (const [flavor, id] of Object.entries(FLAVOR_ANCHORS)) {
    const ing = INGREDIENTS[id];
    if (!ing) {
      warnings.push(
        `flavor anchor for "${flavor}" → "${id}" is missing from the catalog`
      );
      continue;
    }
    if (!(ing.flavors || []).includes(flavor)) {
      warnings.push(
        `flavor anchor "${id}" no longer lists the "${flavor}" flavor — ` +
        `either restore it or pick a new anchor`
      );
    }
  }
  return warnings;
}

/**
 * Soft saturation check: returns a map of effect tag → list of
 * ingredient ids holding strength 5 on that tag. Useful as a yellow
 * flag — multiple 5s on a tag is allowed but worth reviewing for
 * grade inflation as the catalog grows.
 */
export function findEffectSaturation() {
  const fives = {};
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    for (const [tag, s] of (ing.effects || [])) {
      if (s === 5) {
        if (!fives[tag]) fives[tag] = [];
        fives[tag].push(id);
      }
    }
  }
  const out = {};
  for (const [tag, ids] of Object.entries(fives)) {
    if (ids.length > 1) out[tag] = ids;
  }
  return out;
}

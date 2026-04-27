/* ──────────────────────────────────────────────────────────────
   tests/calibration.test.mjs

   Catches calibration drift in the ingredient catalog before it
   ships. Four structural checks:

     1. Anchor presence — chamomile/matcha/peppermint/etc. still
        hold the strength they're supposed to. If anyone re-tunes
        an anchor, the whole rubric shifts and this test catches it.
     2. Relative ceiling — no non-anchor exceeds the anchor's
        strength on that tag. (Equal is allowed; the catalog
        currently has co-fives on a few tags.)
     3. Flavor whitelist — every flavor word on every ingredient
        appears in KNOWN_FLAVORS. Catches typos like "smkoy".
     4. Pair resolution — every pairs[] id resolves to an existing
        ingredient.

   Plus an informational printout (not a failure) of effect tags
   with multiple strength-5 ingredients, so you can see saturation
   creep before it becomes a problem.

   Run: node tests/calibration.test.mjs
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import {
  EFFECT_ANCHORS, FLAVOR_ANCHORS, KNOWN_FLAVORS,
  validateCatalogAnchors, findEffectSaturation,
} from "../src/data/ingredientFit.js";

let pass = 0, fail = 0;
const failures = [];

function test(desc, fn) {
  try {
    fn();
    pass++;
    process.stdout.write(".");
  } catch (e) {
    fail++;
    failures.push({ desc, message: e.message });
    process.stdout.write("F");
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("Catalog calibration — anchors, ceilings, vocab\n");

// 1. Anchor presence + strength.
test("declared effect anchors all hold their declared strength", () => {
  const warnings = validateCatalogAnchors();
  assert(warnings.length === 0,
    `${warnings.length} anchor issue(s):\n        - ` + warnings.join("\n        - "));
});

// 2. Relative ceiling — no non-anchor ingredient exceeds the anchor's
//    strength on a tagged axis. Equal strengths (co-anchors) are
//    allowed; the saturation printout below makes those visible.
for (const [tag, anchor] of Object.entries(EFFECT_ANCHORS)) {
  test(`relative ceiling: nothing exceeds "${anchor.id}" on "${tag}"`, () => {
    for (const [id, ing] of Object.entries(INGREDIENTS)) {
      if (id === anchor.id) continue;
      const entry = (ing.effects || []).find(([t]) => t === tag);
      if (!entry) continue;
      assert(entry[1] <= anchor.strength,
        `${id} has ${tag} ${entry[1]} > anchor ${anchor.id} (${anchor.strength}). ` +
        `Either rescale ${id} down or promote it to the anchor.`);
    }
  });
}

// 3. Flavor whitelist.
for (const [id, ing] of Object.entries(INGREDIENTS)) {
  test(`flavors: ${id} all in vocab`, () => {
    const unknown = (ing.flavors || []).filter(f => !KNOWN_FLAVORS.has(f));
    assert(unknown.length === 0,
      `${id} has ${unknown.length} unknown flavor(s): ${unknown.join(", ")}. ` +
      `If intentional, add to KNOWN_FLAVORS in ingredientFit.js.`);
  });
}

// 4. Pair id resolution.
for (const [id, ing] of Object.entries(INGREDIENTS)) {
  if (!ing.pairs || ing.pairs.length === 0) continue;
  test(`pairs: ${id} all resolve`, () => {
    const orphans = ing.pairs.filter(pid => !INGREDIENTS[pid]);
    assert(orphans.length === 0,
      `${id}.pairs references ${orphans.length} unknown id(s): ${orphans.join(", ")}.`);
  });
}

// Flavor anchor presence — separated from validateCatalogAnchors
// for clarity in the test output.
for (const [flavor, anchorId] of Object.entries(FLAVOR_ANCHORS)) {
  test(`flavor anchor: ${anchorId} carries "${flavor}"`, () => {
    const ing = INGREDIENTS[anchorId];
    assert(ing, `flavor anchor "${anchorId}" missing from catalog`);
    assert((ing.flavors || []).includes(flavor),
      `${anchorId} no longer lists "${flavor}" — restore it or pick a new anchor`);
  });
}

console.log(`\n\n${pass} passed, ${fail} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const { desc, message } of failures) {
    console.log(`  ✗ ${desc}\n      ${message}`);
  }
}

// Informational printout — not a failure, just visibility into
// where strength-5 saturation might be creeping. Useful when you
// add a new ingredient and want to know if the tag's anchor is
// still defensibly the strongest.
const saturation = findEffectSaturation();
const tags = Object.keys(saturation);
if (tags.length > 0) {
  console.log("\nSaturation watch (multiple ingredients at strength 5):");
  for (const tag of tags) {
    console.log(`  ${tag}: ${saturation[tag].join(", ")}`);
  }
}

if (fail > 0) process.exit(1);

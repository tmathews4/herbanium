/* ──────────────────────────────────────────────────────────────
   tests/ingredient-fit.test.mjs

   Validates every ingredient in the catalog against the rubric in
   src/data/ingredientFit.js. Catches the kinds of mistakes a new
   contributor is most likely to make:

     - typo'd effect tag ("groundding")
     - effect strength outside 1-5
     - missing required field
     - malformed tempC / timeS tuple

   Also smoke-tests placeIngredient (qualitative spec → numeric
   tuple form) and STRENGTH_RUBRIC's range coverage.

   Run: node tests/ingredient-fit.test.mjs
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import {
  STRENGTH_RUBRIC, placeIngredient, auditIngredient, CANONICAL_EFFECTS,
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

console.log(`Ingredient fit — catalog audit + helper sanity\n`);

// 1. Every ingredient in the catalog should pass auditIngredient
//    with zero warnings. Catches drift the moment someone adds a
//    new ingredient with a typo or out-of-range strength.
for (const [id, ing] of Object.entries(INGREDIENTS)) {
  test(`audit: ${id} clean`, () => {
    const warnings = auditIngredient(ing);
    assert(warnings.length === 0,
      `${id} has ${warnings.length} warning(s):\n        - ` + warnings.join("\n        - "));
  });
}

// 2. STRENGTH_RUBRIC covers the full 1-5 range.
test("STRENGTH_RUBRIC spans 1-5", () => {
  const values = Object.values(STRENGTH_RUBRIC).sort();
  assert(values.length === 5, `expected 5 tiers, got ${values.length}`);
  assert(values[0] === 1 && values[4] === 5, `expected [1..5], got [${values.join(",")}]`);
});

// 3. placeIngredient: qualitative spec
test("placeIngredient: qualitative tier names", () => {
  const out = placeIngredient({ calm: "strong", sleepy: "pronounced", soothing: "trace" });
  // Sorted descending strength
  assert(out[0][0] === "calm" && out[0][1] === 4, `expected calm 4 first, got ${JSON.stringify(out[0])}`);
  assert(out[1][0] === "sleepy" && out[1][1] === 3, `expected sleepy 3, got ${JSON.stringify(out[1])}`);
  assert(out[2][0] === "soothing" && out[2][1] === 1, `expected soothing 1, got ${JSON.stringify(out[2])}`);
});

// 4. placeIngredient: numbers also accepted
test("placeIngredient: numeric strengths", () => {
  const out = placeIngredient({ focus: 5, energy: 3 });
  assert(out[0][0] === "focus" && out[0][1] === 5, `expected focus 5 first`);
  assert(out[1][0] === "energy" && out[1][1] === 3, `expected energy 3`);
});

// 5. placeIngredient: bitterness sorts last
test("placeIngredient: bitterness sorts last", () => {
  const out = placeIngredient({ bitterness: 5, calm: 2 });
  assert(out[0][0] === "calm", `expected calm first, got ${out[0][0]}`);
  assert(out[1][0] === "bitterness", `expected bitterness last, got ${out[1][0]}`);
});

// 6. placeIngredient: rejects unknown tag
test("placeIngredient: throws on unknown effect tag", () => {
  let threw = false;
  try { placeIngredient({ calmm: 3 }); } catch { threw = true; }
  assert(threw, "expected throw on unknown tag 'calmm'");
});

// 7. placeIngredient: rejects unknown tier
test("placeIngredient: throws on unknown tier name", () => {
  let threw = false;
  try { placeIngredient({ calm: "verystrong" }); } catch { threw = true; }
  assert(threw, "expected throw on unknown tier 'verystrong'");
});

// 8. placeIngredient: rejects out-of-range numbers
test("placeIngredient: throws on out-of-range number", () => {
  let threw = false;
  try { placeIngredient({ calm: 7 }); } catch { threw = true; }
  assert(threw, "expected throw on calm 7");
});

// 9. auditIngredient: catches a malformed candidate
test("auditIngredient: catches malformed candidate", () => {
  const bad = {
    name: "Test",
    latin: "Test sp.",
    category: "herbal",
    tempC: [90],   // wrong length
    timeS: [200, 400],
    effects: [["calmm", 3], ["focus", 8]],  // typo + out of range
  };
  const warnings = auditIngredient(bad);
  assert(warnings.length >= 3, `expected at least 3 warnings, got ${warnings.length}: ${warnings.join("; ")}`);
});

// 10. CANONICAL_EFFECTS aligns with what's actually in the catalog.
test("CANONICAL_EFFECTS covers every tag actually used", () => {
  const used = new Set();
  for (const ing of Object.values(INGREDIENTS)) {
    for (const [tag] of (ing.effects || [])) used.add(tag);
  }
  const missing = [...used].filter(t => !CANONICAL_EFFECTS.has(t));
  assert(missing.length === 0,
    `effects in catalog not in CANONICAL_EFFECTS: ${missing.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\n  Failures:");
  for (const f of failures) console.log(`    ✗ ${f.desc}\n        ${f.message}`);
  process.exit(1);
}
process.exit(0);

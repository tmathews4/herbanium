/* ──────────────────────────────────────────────────────────────
   tests/pot-total.test.mjs

   The pot total under the ingredient list answers "what do I measure
   out". It shipped in GRAMS regardless of the weight unit, so someone
   who had chosen teaspoons read teaspoons on every row and grams on
   the one line that tells them what to put in the pot.

   The rule that makes the fix correct, and the reason this is a test
   rather than a one-line change: TEASPOONS DO NOT ADD ACROSS
   CATEGORIES. A teaspoon is a volume, and TSP_BY_CATEGORY spans 1.0g
   (flower) to 3.0g (adaptogen) — a threefold spread. Grams may be
   summed and then converted only if the pot holds one category.
   Otherwise each leaf converts at its own density first.

   The obvious implementation — sum the grams, convert once — is wrong
   for every mixed pot and looks right in every single-leaf test.
   ────────────────────────────────────────────────────────────── */

import {
  formatTotal, gramsToTsp, formatTsp, TSP_BY_CATEGORY,
  partsToGrams, partsToGramsForTotal, standardTotalGrams,
  clampTotalGrams, TOTAL_BOUNDS, POUR_SIZES,
} from "../src/units/units.js";

let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; console.error(`\n  FAIL ${name}\n  ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

test("grams mode sums grams and says g", () => {
  const out = formatTotal([
    { grams: 2, category: "flower" },
    { grams: 1.5, category: "spice" },
  ], "g");
  assert(out === "3.5 g", `expected "3.5 g", got "${out}"`);
});

test("tsp mode never says g", () => {
  const out = formatTotal([{ grams: 2, category: "flower" }], "tsp");
  assert(!/\bg\b/.test(out), `teaspoon users should never be handed grams, got "${out}"`);
  assert(/tsp|tbsp|pinch/.test(out), `expected a teaspoon-ladder unit, got "${out}"`);
});

test("a mixed pot converts each leaf at its OWN density", () => {
  // 3g of flower is 3 tsp; 3g of adaptogen is 1 tsp. Together, 4 tsp.
  const items = [
    { grams: 3, category: "flower" },      // 3.0 tsp at 1.0 g/tsp
    { grams: 3, category: "adaptogen" },   // 1.0 tsp at 3.0 g/tsp
  ];
  const correct = formatTotal(items, "tsp");
  assert(correct === formatTsp(4), `expected ${formatTsp(4)}, got "${correct}"`);

  // The wrong implementation: sum grams, convert once. 6g at either
  // density gives 6 tsp or 2 tsp — neither is 4. This is the assertion
  // that fails if someone "simplifies" formatTotal later.
  const naiveFlower = formatTsp(gramsToTsp(6, "flower"));
  const naiveAdaptogen = formatTsp(gramsToTsp(6, "adaptogen"));
  assert(correct !== naiveFlower && correct !== naiveAdaptogen,
    `summing grams then converting once must not equal the per-leaf sum ` +
    `(got ${correct}, naive gives ${naiveFlower} / ${naiveAdaptogen})`);
});

test("the density spread that makes this matter is real, read from the table", () => {
  const vals = Object.values(TSP_BY_CATEGORY);
  const spread = Math.max(...vals) / Math.min(...vals);
  assert(spread >= 2,
    `if the categories ever converge this test's premise dies; spread is ${spread.toFixed(2)}x`);
});

test("an empty pot doesn't throw or print NaN", () => {
  for (const u of ["g", "tsp"]) {
    const out = formatTotal([], u);
    assert(!/NaN|undefined/.test(out), `empty pot in ${u} mode gave "${out}"`);
  }
});


/* ─── Dictating the total ──────────────────────────────────────
   The pot's weight is normally the vessel's business. Someone with a
   scale and 7g of leaf wants to say so, and that must NOT reopen the
   hole POUR_SIZES closed: parts used to silently be grams, so
   "5 assam : 1 peppermint" built a 6g pot — 3.3 cups of leaf in one
   cup — and every strong flavour pinned at its ceiling.

   The difference is that the number is deliberate and bounded. These
   hold both halves: the mix must survive rescaling untouched, and the
   dial must not reach the old bug.                                */

const perCup = (id) => ({ leaf: 2.0, flower: 1.0 })[id] ?? 1.5;
const RATIO = [{ id: "leaf", parts: 5 }, { id: "flower", parts: 1 }];

test("a dictated total is hit exactly", () => {
  const out = partsToGramsForTotal(RATIO, perCup, 7);
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 7) < 1e-9, `asked for 7g, got ${sum}`);
});

test("rescaling does not change the mix", () => {
  const std = partsToGrams(RATIO, "mug", perCup);
  const scaled = partsToGramsForTotal(RATIO, perCup, 7);
  const before = std.leaf / std.flower;
  const after = scaled.leaf / scaled.flower;
  assert(Math.abs(before - after) < 1e-9,
    `the ratio moved under rescaling: ${before} -> ${after}. Parts are ` +
    `volumetric; scaling multiplies every leaf by ONE factor or the ` +
    `blend the user built is not the blend they brew.`);
});

test("the dial cannot reach the pot-in-a-cup bug", () => {
  const standard = standardTotalGrams(RATIO, "cup", perCup);
  assert(standard > 0, "fixture produced no standard total");
  // Ask for twenty times a cup's worth — roughly the old failure.
  const clamped = clampTotalGrams(standard * 20, standard);
  assert(clamped <= standard * TOTAL_BOUNDS.max + 1e-9,
    `${clamped}g got through against a ceiling of ${standard * TOTAL_BOUNDS.max}g`);
  // And it clamps upward too, so a zero-ish pot can't be brewed.
  assert(clampTotalGrams(0.0001, standard) >= standard * TOTAL_BOUNDS.min - 1e-9,
    "a near-zero total should be lifted to the floor, not brewed");
});

test("the standard total tracks the vessel, derived from POUR_SIZES", () => {
  // DERIVED: the expectation comes from the table, not a typed number.
  const cup = standardTotalGrams(RATIO, "cup", perCup);
  for (const [id, size] of Object.entries(POUR_SIZES)) {
    const got = standardTotalGrams(RATIO, id, perCup);
    assert(Math.abs(got - cup * size.doses) < 1e-9,
      `${size.name} should be ${size.doses}x a cup: expected ${cup * size.doses}, got ${got}`);
  }
});

console.log(`\n  ${pass} passed, ${fail} failed (with the dictated-total block)`);
if (fail) process.exit(1);

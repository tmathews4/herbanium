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

import { formatTotal, gramsToTsp, formatTsp, TSP_BY_CATEGORY } from "../src/units/units.js";

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

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

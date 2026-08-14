/* tests/pour-parts.test.mjs — parts are a ratio, not a quantity.
 *
 * A part used to be a gram outright, so "5 parts assam : 1 part
 * peppermint" built a 6g pot — 3.33 cups' worth of leaf in one cup.
 * Every strong flavour then sat at its ceiling and the strip went flat:
 * malty 5.00, bold 5.00, minty 5.00, unable to say which led. Reported
 * as "that feels wrong", and it was, though not where it looked. The
 * readings were right; the pour was heavy, because expressing a
 * stronger lead silently made the pot bigger.
 *
 * These hold the arithmetic that separates the two.
 */
import {
  partsToGrams, gramsToParts, pourDoses, POUR_SIZES, TSP_BY_CATEGORY,
} from "../src/units/units.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { resolveBlendAtBrew, computeBrewProfile } from "../src/algo/compose.js";

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push(`${name}: ${e.message}`); process.stdout.write("x"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

const gpc = (id) => TSP_BY_CATEGORY[INGREDIENTS[id]?.category] || 1.5;
const cupDosesOf = (grams) => Object.entries(grams)
  .reduce((s, [id, g]) => s + g / gpc(id), 0);

test("a ratio does not change how much leaf is in the cup", () => {
  /* THE WHOLE POINT. 9:1 and 1:1 are different cups and the same POUR —
     the balance moved, the pot did not. Under the old model 9:1 was ten
     grams and 1:1 was two, which is why pressing "+" on a lead quietly
     tripled the strength of the cup. */
  for (const [a, b] of [[9, 1], [5, 1], [2, 1], [1, 1], [1, 3]]) {
    const g = partsToGrams([{ id: "assam", parts: a }, { id: "peppermint", parts: b }], "cup", gpc);
    assert(close(cupDosesOf(g), 1, 1e-9),
      `${a}:${b} came to ${cupDosesOf(g).toFixed(3)} cup-doses, not 1`);
  }
});

test("each part is a share of a cup, measured in that leaf's own units", () => {
  // One part of chamomile and one part of ginger are the same FRACTION
  // of a cup, not the same mass — a teaspoon of each weighs 1.0g and
  // 2.5g. Splitting by grams instead is what made light leaves read as
  // over-dosed and dense ones as trace.
  const g = partsToGrams([{ id: "chamomile", parts: 1 }, { id: "ginger", parts: 1 }], "cup", gpc);
  assert(!close(g.chamomile, g.ginger, 1e-6),
    `equal parts should NOT be equal grams here — got ${g.chamomile} and ${g.ginger}`);
  assert(close(g.chamomile / gpc("chamomile"), g.ginger / gpc("ginger"), 1e-9),
    "equal parts should be equal cup-doses");
});

test("the pour scales what you measure out, and only that", () => {
  const cup = partsToGrams([{ id: "assam", parts: 5 }, { id: "peppermint", parts: 1 }], "cup", gpc);
  const pot = partsToGrams([{ id: "assam", parts: 5 }, { id: "peppermint", parts: 1 }], "pot", gpc);
  const ratio = pourDoses("pot") / pourDoses("cup");
  for (const id of Object.keys(cup)) {
    assert(close(pot[id], cup[id] * ratio, 1e-9),
      `${id}: a pot should be ${ratio}× a cup, got ${pot[id]} vs ${cup[id]}`);
  }
});

test("a pot is more of the same cup, not a stronger one", () => {
  /* The trap this design walks around. Every extraction profile is
     written per 200ml ("1 tsp · 200ml"), so handing the model three
     cup-doses because the user is making a pot would render that pot as
     a TRIPLE-STRENGTH cup — the very bug being fixed, arriving through
     the front door. The model is always given a cup's worth; the pour
     scales the shopping list. */
  const list = (grams) => Object.entries(grams).map(([id, g], i) => ({
    id, g, role: i === 0 ? "lead" : "accent",
  }));
  const cup = list(partsToGrams([{ id: "assam", parts: 5 }, { id: "peppermint", parts: 1 }], "cup", gpc));
  const p = computeBrewProfile(cup);
  const a = resolveBlendAtBrew(cup, p.tempC, p.timeS);
  const flavours = a.perceivedFlavors || a.flavors || {};
  assert(Object.keys(flavours).length > 0, "the cup should read as something");
  // Nothing pinned: this is the reading the report was missing.
  const pinned = Object.entries(flavours).filter(([, v]) => v >= 4.95).map(([k]) => k);
  assert(pinned.length === 0,
    `a balanced cup's worth should not pin any bar, got ${pinned.join(", ")}`);
});

test("grams and parts are one store — the round trip is exact", () => {
  // The promise a display toggle has to keep: switching between parts
  // and weight may not change the cup. Both conversions are exact, so
  // it doesn't.
  const parts = [{ id: "assam", parts: 5 }, { id: "peppermint", parts: 1 }];
  const grams = partsToGrams(parts, "cup", gpc);
  const back = gramsToParts(Object.entries(grams).map(([id, g]) => ({ id, g })), gpc);
  const scale = back.assam / 5;
  for (const { id, parts: n } of parts) {
    assert(close(back[id], n * scale, 1e-6),
      `${id}: round trip gave ${back[id]}, expected ${n * scale}`);
  }
});

test("every pour size is a real multiple of a cup", () => {
  // A guard on the table rather than on one entry: adding a size
  // without a dose count would silently normalise to 1.
  for (const [id, size] of Object.entries(POUR_SIZES)) {
    assert(typeof size.doses === "number" && size.doses > 0,
      `pour size "${id}" has no usable dose count`);
    assert(size.name && size.tspLabel, `pour size "${id}" is missing its labels`);
  }
  assert(close(pourDoses("cup"), 1),
    "a cup must be exactly one cup-dose — everything else is measured against it");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

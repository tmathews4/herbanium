/* ──────────────────────────────────────────────────────────────
   tests/pour-volume.test.mjs — the cup knows how much water it holds.

   Every extraction profile in the catalogue is written per 200 ml
   (`REFERENCE_ML`). The perception pipeline reads GRAMS, so until the
   normaliser in `compose.js` existed it read a pot's worth of leaf as a
   cup's worth whenever the vessel wasn't 200 ml — and 37 of the 49
   curated blends declare one that isn't.

   What that cost, concretely. Spring Tonic is 3 g in 500 ml, an
   entirely ordinary infusion. It computed identically to 3 g in a
   single cup: earthy 5.00, mineral 5.00, astringent 5.00 — three bars
   pinned — plus a notice reading "about 2.5× a cup's worth of leaf in
   one cup" about a cup holding exactly one cup's worth per cup.
   Reported from real use as "doesn't seem right for the actual recipe,
   its only 2 tsp total". At its own dose it reads astringent 3.80,
   earthy 3.10, mineral 2.90, nothing pinned, notice correctly silent.

   THE WARNING WAS HONEST. It was describing a defect one layer under
   itself, which is why the fix is in the model and not in the text.

   Three guards, and none of them restates an expected number — every
   expectation is computed from what the data declares, so adding a
   blend or changing a vessel is covered with no edit here. Writing the
   numbers down would rebuild the bug this file exists to catch.
   ────────────────────────────────────────────────────────────── */

import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { BLENDS } from "../src/data/blends.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { TSP_BY_CATEGORY, REFERENCE_ML } from "../src/units/units.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; process.stdout.write("."); }
  catch (e) { failures.push(`${name}: ${e.message}`); process.stdout.write("F"); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const withVessel = BLENDS.filter(b => b.ml && b.ml !== REFERENCE_ML);

console.log(`Pour volume — ${BLENDS.length} curated blends, ${withVessel.length} with a vessel other than ${REFERENCE_ML}ml\n`);

/* The fix has to be load-bearing. If this drops to zero the catalogue
   stopped declaring volumes and the rest of the file proves nothing. */
test("the catalogue actually exercises this", () => {
  assert(withVessel.length > 0,
    `no blend declares an ml other than ${REFERENCE_ML} — this file is vacuous`);
});

/* 1. THE NORMALISER DOES WHAT IT SAYS.

   Resolving with a vessel must equal resolving leaf already divided
   down to that vessel's per-cup dose. Derived both ways from the same
   declaration, so it holds for any blend and any volume. */
for (const b of withVessel) {
  test(`${b.name} — resolving at ${b.ml}ml equals resolving its per-cup dose`, () => {
    const cups = b.ml / REFERENCE_ML;
    const preScaled = b.ingredients.map(i => ({ ...i, g: (i.g || 0) / cups }));
    const viaVessel = resolveBlendAtBrew(b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, false, { ml: b.ml });
    const viaHand   = resolveBlendAtBrew(preScaled,     b.tempC, b.timeS, b.tempC, b.timeS, true, false);
    assert(JSON.stringify(viaVessel.flavors) === JSON.stringify(viaHand.flavors),
      `flavours differ:\n  vessel ${JSON.stringify(viaVessel.flavors.slice(0, 4))}\n  hand   ${JSON.stringify(viaHand.flavors.slice(0, 4))}`);
    assert(JSON.stringify(viaVessel.effects) === JSON.stringify(viaHand.effects),
      "effects differ between the vessel path and the hand-scaled one");
  });
}

/* 2. CAFFEINE IS A DOSE, NOT A CONCENTRATION.

   You drink the vessel. A koicha is 4 g whisked into 40 ml and you
   swallow all 40 ml, so you have had 4 g of matcha — that the liquid is
   concentrated changes how it TASTES, not how much caffeine went in.

   This is not hypothetical: normalising caffeine along with everything
   else was a regression introduced WITH the volume fix, and it took
   koicha from 32.7mg to 163.6mg and gyokuro from 18.4 to 36.8 before
   measurement caught it. The bars were right to move; this number was
   not. */
for (const b of withVessel) {
  test(`${b.name} — caffeine is unchanged by the vessel`, () => {
    const blind = resolveBlendAtBrew(b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, false);
    const aware = resolveBlendAtBrew(b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, false, { ml: b.ml });
    assert(Math.abs(blind.caffeineMg - aware.caffeineMg) < 0.05,
      `${blind.caffeineMg.toFixed(1)}mg without the vessel, ${aware.caffeineMg.toFixed(1)}mg with it — `
      + "caffeine follows the leaf you drink, not the strength of the liquid");
  });
}

/* 3. THE POUR NOTICE MUST AGREE WITH THE DECLARED VESSEL.

   This is the guard that would have caught the original report. The
   notice prints a multiplier; that multiplier has to be the blend's
   own leaf load measured against its own water, both read from the
   data. Spring Tonic printed 2.5 while declaring 500 ml, which is 1.0.

   Parsing the rendered text on purpose — the number the USER reads is
   the thing that was wrong, and asserting on an internal would have
   passed throughout the bug. */
for (const b of BLENDS) {
  test(`${b.name} — any pour notice matches its own leaf-per-cup`, () => {
    const cups = (b.ml || REFERENCE_ML) / REFERENCE_ML;
    const leafDoses = b.ingredients.reduce((sum, { id, g }) => {
      const perCup = TSP_BY_CATEGORY[INGREDIENTS[id]?.category] || 1.5;
      return sum + Math.max(0, g || 0) / perCup;
    }, 0);
    const expected = leafDoses / cups;

    const brew = resolveBlendAtBrew(b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, false, { ml: b.ml });
    const notice = brew.warnings.find(w => w.kind === "pour");
    if (!notice) return;                       // silent is a valid answer

    const printed = Number(/about ([\d.]+)×/.exec(notice.text)?.[1]);
    assert(Number.isFinite(printed), `pour notice has no readable multiplier: "${notice.text}"`);
    assert(Math.abs(printed - expected) < 0.1,
      `notice says ${printed}× but ${b.ingredients.reduce((s, i) => s + i.g, 0)}g in `
      + `${b.ml || REFERENCE_ML}ml is ${expected.toFixed(1)}× a cup's worth`);
  });
}

console.log(`\n\n  ${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}

/* ──────────────────────────────────────────────────────────────
   tests/track-order.test.mjs — a strip's rows keep their places.

   The mood/flavor strips order rows by family so that reading one
   across a slider drag is structurally stable: the calm row always
   sits where calm sits. In DETAIL mode the rows are leaf tokens, and
   every leaf of a family shares its family's position — so they all
   tied, and the tie broke on the leaf's CURRENT PEAK, "so the loudest
   member sits at the top of its group".

   That undid the stability one level down. Change the temperature, two
   leaves cross, and they swap rows under the reader. Reported exactly
   that way: "when changing temp or time, shouldn't resort the
   mind/body/palate graphs. I saw detailed categories switching
   position back and forth as they usurped each others values which
   read glitchy."

   THE FIX IS SHAPED SO THE DEFECT CANNOT COME BACK. compareTracks
   takes NAMES, never strengths, so an ordering that depends on the cup
   is not something you could reintroduce by accident — you would have
   to change the signature. That property is the first test here, and
   it is the one worth keeping: the rest follow from it.
   ────────────────────────────────────────────────────────────── */

import {
  compareTracks, EFFECT_LEAF_ORDER, FLAVOR_LEAF_ORDER,
  FAMILY_BY_EFFECT, FAMILY_BY_FLAVOR,
  MOOD_FAMILY_ORDER, FLAVOR_FAMILY_ORDER,
} from "../src/data/families.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

for (const kind of ["mood", "flavor"]) {
  const cmp = compareTracks(kind);
  const leaves = kind === "mood" ? EFFECT_LEAF_ORDER : FLAVOR_LEAF_ORDER;

  test(`${kind}: rows land in exactly the vocabulary's order`, () => {
    /* THE WHOLE CLAIM, IN ONE COMPARISON, and the earlier version of
       this file could not make it. It asserted only that families were
       grouped and the order repeatable — both of which stay true if
       you delete the leaf ranking entirely and fall through to
       localeCompare. Deleting it passed. So the expectation is built
       from the two declared lists and compared exactly: families in
       family order, and inside each, leaves in the order the
       vocabulary lists them. */
    const byName = kind === "mood" ? FAMILY_BY_EFFECT : FAMILY_BY_FLAVOR;
    const famOrder = kind === "mood" ? MOOD_FAMILY_ORDER : FLAVOR_FAMILY_ORDER;
    const expected = [
      ...famOrder.flatMap(f => leaves.filter(t => (byName[t] || t) === f)),
      /* Families the strip does not rank — `off` on the flavour side,
         whose tokens live in the palate strip and the over-pull
         descriptions instead — fall to the end. They keep vocabulary
         order like everything else; localeCompare is the comparator's
         last resort, for tokens with no position at all. */
      ...leaves.filter(t => !famOrder.includes(byName[t] || t)),
    ];
    const actual = [...leaves].sort(cmp);
    const firstDiff = actual.findIndex((t, i) => t !== expected[i]);
    assert(firstDiff === -1,
      `${kind} row ${firstDiff} is "${actual[firstDiff]}" where the vocabulary ` +
      `says "${expected[firstDiff]}"\n      got: ${actual.join(" ")}\n      want: ${expected.join(" ")}`);
  });

  test(`${kind}: ordering is repeatable whatever order it is handed`, () => {
    const shuffled = leaves.map((t, i) => [t, (i * 7919) % leaves.length])
      .sort((a, b) => a[1] - b[1]).map(([t]) => t);
    const once = [...shuffled].sort(cmp);
    const twice = [...shuffled].reverse().sort(cmp);
    assert(JSON.stringify(once) === JSON.stringify(twice),
      `${kind} rows land in a different order depending on the input order`);
  });

  test(`${kind}: every leaf the vocabulary knows has a place`, () => {
    /* A leaf with no rank falls to the end of its family and orders by
       name — harmless once, and the thing that makes a whole family
       look shuffled when a token gets renamed. */
    const byName = kind === "mood" ? FAMILY_BY_EFFECT : FAMILY_BY_FLAVOR;
    const missing = Object.keys(byName).filter(t => !leaves.includes(t));
    assert(missing.length === 0,
      `these tokens have a family but no position: ${missing.join(", ")}`);
  });
}

test("an unknown token does not disturb the known ones", () => {
  const cmp = compareTracks("mood");
  const known = [...EFFECT_LEAF_ORDER].sort(cmp);
  const withStranger = [...EFFECT_LEAF_ORDER, "zzz-not-a-token"].sort(cmp);
  assert(JSON.stringify(withStranger.filter(t => t !== "zzz-not-a-token")) === JSON.stringify(known),
    "adding an unrecognised token reordered the recognised ones");
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

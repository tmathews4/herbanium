/* ──────────────────────────────────────────────────────────────
   tests/brew-reach.test.mjs — how far the steep slider may be dragged.

   The card's timeS is what we RECOMMEND. The profile is usually
   measured PAST that, and those over-pull rows exist on purpose: they
   anchor the top of the interpolated curve and the warning thresholds
   read from them. The slider used to stop at the recommendation, which
   left the rows describing a stretched cup unreachable by the person
   stretching it — chamomile's 420s row literally reads "apigenin maxes
   out but tannins follow", and no finger could get there.

   So the upper bound is now the FURTHER of card-max and
   measured-max. Three things have to stay true, and each is a
   separate way this could go wrong:

     1. it may only ever widen, never narrow;
     2. a blend is still capped by its most delicate lead;
     3. nothing is widened past where the profile has been measured.

   (3) is the one worth stating twice. A flat global floor — "every
   steep reaches 8 minutes" — was the obvious implementation and is the
   wrong one: 30 of 52 cards cap under 8 minutes and only one of those
   has data out that far. Past the last measured row the interpolated
   curve holds its last value, so the slider would travel while the
   flavour prediction stood still — measured on eight short-capped
   ingredients, seven identical at their last row and at 8 minutes.

   Warnings are the exception and an earlier version of this comment
   claimed the opposite. They keep responding out there (lavender 2->3,
   rose 4->5, lemon balm 2->3) because they read dose and time rather
   than only the rows. So the cup is not un-evaluated, it is
   un-described — which is still the wrong trade, because watching the
   cup change is the entire reason to stretch it.
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import { PROFILE_TIME_REACH, EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { unionAndPadTimeRange, TIME_HARD_MAX } from "../src/algo/brewBounds.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const lead = (id) => [{ id, role: "lead" }];
const withReach = (items) => unionAndPadTimeRange(items, INGREDIENTS, PROFILE_TIME_REACH);
const cardOnly = (items) => unionAndPadTimeRange(items, INGREDIENTS);
const ids = Object.keys(PROFILE_TIME_REACH).filter(id => INGREDIENTS[id]?.timeS);

test("the reach is derived from the rows, not hand-kept", () => {
  for (const [id, rows] of Object.entries(EXTRACTION_PROFILES)) {
    const times = (Array.isArray(rows) ? rows : []).map(r => r?.timeS).filter(Number.isFinite);
    if (!times.length) continue;
    assert(PROFILE_TIME_REACH[id] === Math.max(...times),
      `${id}: reach ${PROFILE_TIME_REACH[id]} but rows top out at ${Math.max(...times)}`);
  }
});

test("it only ever widens — no ingredient loses slider it used to have", () => {
  for (const id of ids) {
    const before = cardOnly(lead(id))[1];
    const after = withReach(lead(id))[1];
    assert(after >= before, `${id}: ${before}s narrowed to ${after}s`);
  }
});

test("it widens someone — the change is not a no-op", () => {
  /* Guards the wiring, not the rule. If the reach map were ever passed
     as undefined, or built empty, every assertion above would still
     pass and the feature would be silently gone. */
  const widened = ids.filter(id => withReach(lead(id))[1] > cardOnly(lead(id))[1]);
  assert(widened.length > 0, "no ingredient gained any stretch at all");
});

test("nothing is dragged past where the profile has been measured", () => {
  /* THE RULE THAT MATTERS. The padding is allowed to overshoot the last
     row a little — it always did, and the curve holds its last value —
     but the bound must be anchored to measured data rather than to a
     number someone picked. Anchored means: within the pad of the reach,
     never a fixed floor beyond it. */
  for (const id of ids) {
    const reach = Math.max(INGREDIENTS[id].timeS[1], PROFILE_TIME_REACH[id] || 0);
    const [, hi] = withReach(lead(id));
    if (hi >= TIME_HARD_MAX) continue; // clamped by the global ceiling
    assert(hi <= reach * 1.5 + 60,
      `${id}: slider reaches ${hi}s but the profile stops at ${reach}s`);
  }
});

test("a blend is still capped by its most delicate lead", () => {
  /* The protection that predates this change and must survive it: a
     blend's range is the INTERSECTION of its ingredients', so a
     short-steep herb in a pot with a long one caps the pot. Widening
     each ingredient must not turn into widening the blend past the herb
     that can't take it. */
  const pairs = [["chamomile", "vanilla"], ["jasmine", "lemongrass"], ["rose", "lapsang"]];
  for (const [a, b] of pairs) {
    if (!INGREDIENTS[a] || !INGREDIENTS[b]) continue;
    const soloA = withReach(lead(a))[1];
    const soloB = withReach(lead(b))[1];
    const blend = withReach([{ id: a, role: "lead" }, { id: b, role: "lead" }])[1];
    assert(blend <= Math.min(soloA, soloB),
      `${a}+${b}: blend reaches ${blend}s past the shorter lead's ${Math.min(soloA, soloB)}s`);
  }
});

test("accents and catalysts still don't shape the ceiling", () => {
  // Only leads count — a trace dose of something short-steeped
  // shouldn't drag a blend's slider down around it.
  const base = withReach(lead("chamomile"))[1];
  const withAccent = withReach([
    { id: "chamomile", role: "lead" },
    { id: "jasmine", role: "accent" },
  ])[1];
  assert(withAccent === base,
    `an accent moved the ceiling from ${base}s to ${withAccent}s`);
});

test("the recommended range itself is untouched", () => {
  /* The whole design rests on this separation: how far you MAY drag is
     now a different question from what we RECOMMEND. If a future change
     ever routes the recommendation through the reach, the band and the
     RECOMMENDED button would quietly start pointing at over-pull. */
  for (const id of ids.slice(0, 12)) {
    const card = INGREDIENTS[id].timeS;
    assert(Array.isArray(card) && card.length === 2 && card[1] > card[0],
      `${id}: card range looks wrong: ${JSON.stringify(card)}`);
    assert(withReach(lead(id))[1] >= card[1],
      `${id}: slider no longer covers its own recommendation`);
  }
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

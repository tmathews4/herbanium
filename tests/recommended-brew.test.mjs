/* ──────────────────────────────────────────────────────────────
   tests/recommended-brew.test.mjs

   Tapping RECOMMENDED must not hand you a cup that's already being
   told off.

   The word under the brew slider sets the slider to the band it
   names. The band is geometry — brewBounds knows where the leaves
   agree — and geometry doesn't know how the cup READS at that point.
   Sweeping the catalog found the gap: 61 ingredient pairs whose
   band center fires a per-ingredient over-pull warning within a
   degree or two of a point in the SAME band that doesn't. Rose +
   vanilla is quiet at 92°C and warns at 93°C, and the tap was
   landing on 93.

   recommendedBrewTarget closes it by asking the perception model at
   every reachable point in the band and taking the quietest. What it
   deliberately does NOT do is leave the band to find quiet: if the
   whole band warns, that's an ingredient whose researched window
   reads as over-pulled throughout, and steering around it would hide
   the data problem instead of showing it.

   Run: node tests/recommended-brew.test.mjs
   ────────────────────────────────────────────────────────────── */

import { recommendedBand } from "../src/algo/brewBounds.js";
import {
  computeBrewProfile, recommendedBrewTarget, overPullScore,
} from "../src/algo/compose.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("The recommendation you can tap — where it lands, and what it costs\n");

const TIME_STEP = 30;

const poolOf = (ings) => ings
  .filter(i => i.role !== "catalyst" && INGREDIENTS[i.id])
  .map(({ id, g, role }) => ({
    id, g: g || 0, role: role || "lead",
    tempC: INGREDIENTS[id].tempC, timeS: INGREDIENTS[id].timeS,
  }));
const primaryOf = (items) => {
  const leads = items.filter(i => i.role === "lead");
  return (leads.length ? leads : items).slice().sort((a, b) => b.g - a.g)[0];
};
const bandFor = (ings, axis, otherValue) => {
  const items = poolOf(ings);
  return {
    items,
    band: recommendedBand({
      items, primary: primaryOf(items), profiles: EXTRACTION_PROFILES, axis, otherValue,
    }),
  };
};

/* THE SAME OBJECTIVE THE PICKER OPTIMISES, not a second opinion on it.
   An earlier draft counted warnings flat while the picker weighs a
   named leaf ("Chamomile is being over-pulled") ten times heavier than
   the cup-level reading of the same axis. Two different objectives
   would let this test fail on a choice that was correct — and, worse,
   pass one that wasn't. */
const noise = overPullScore;

// Where the word puts you, both axes, from the brew the panel opens on.
const tapRecommended = (ings) => {
  const open = computeBrewProfile(ings);
  const t = bandFor(ings, "tempC", open.timeS);
  const tempC = t.band
    ? recommendedBrewTarget({
        ingredients: ings, items: t.items, band: t.band, axis: "tempC",
        otherValue: open.timeS, step: 1,
      })
    : open.tempC;
  const s = bandFor(ings, "timeS", tempC);
  const timeS = s.band
    ? recommendedBrewTarget({
        ingredients: ings, items: s.items, band: s.band, axis: "timeS",
        otherValue: tempC, step: TIME_STEP,
      })
    : open.timeS;
  return { tempC, timeS, tempBand: t.band, timeBand: s.band };
};

const NO_TEMP_OVERLAP = [
  { id: "assam", g: 2, role: "lead" },
  { id: "matcha", g: 1, role: "lead" },
  { id: "chamomile", g: 1, role: "lead" },
];

test("the tap lands inside the band it names", () => {
  const ings = [{ id: "chamomile", g: 3, role: "lead" }, { id: "peppermint", g: 1, role: "lead" }];
  const { band, items } = bandFor(ings, "tempC", 300);
  assert(band, "this pair should have a temperature band");
  const at = recommendedBrewTarget({
    ingredients: ings, items, band, axis: "tempC", otherValue: 300, step: 1,
  });
  assert(at >= band.lo && at <= band.hi,
    `landed at ${at}°C, outside the band ${band.lo}–${band.hi}`);
});

test("it lands on the slider's own grid, not between two steps", () => {
  // A range input sanitises an off-step value, so a target the slider
  // can't represent would leave the thumb and the state disagreeing.
  const ings = [{ id: "assam", g: 2, role: "lead" }, { id: "chamomile", g: 1, role: "lead" }];
  const { band, items } = bandFor(ings, "timeS", 95);
  assert(band, "this pair should have a time band");
  const at = recommendedBrewTarget({
    ingredients: ings, items, band, axis: "timeS", otherValue: 95,
    step: TIME_STEP, rangeMin: 0, rangeMax: 900,
  });
  assert(at % TIME_STEP === 0, `${at}s isn't on the ${TIME_STEP}s grid`);
});

test("opening a cup clamps to the earliest close; tapping the word does not", () => {
  /* THE DISTINCTION THAT MADE THE WORD DEAD.

     Both used to apply the same clamp — never past the window of the
     leaf that closes first, because over-pulling warns while
     under-steeping is silent. Correct for a cup that ARRIVES: a
     default the user didn't ask for shouldn't turn up already being
     told off. Wrong for a tap, which is a request they did make — and
     because both used the same number, on any blend with an early
     closer the tap landed exactly where the slider already sat and the
     control did nothing at all. Reported as "temp was fine but time
     won't move".

     So the clamp lives in computeBrewProfile and nowhere else. The tap
     goes where the word says and lets the warning fire; the warning is
     then the lesson rather than the accident. */
  const items = poolOf(NO_TEMP_OVERLAP);
  const earliestClose = Math.min(...NO_TEMP_OVERLAP.map(({ id }) => INGREDIENTS[id].timeS[1]));

  const { timeS: opens } = computeBrewProfile(NO_TEMP_OVERLAP);
  assert(opens <= earliestClose,
    `the cup opened at ${opens}s, past the earliest close ${earliestClose}s`);

  const band = recommendedBand({
    items, primary: primaryOf(items), profiles: EXTRACTION_PROFILES,
    axis: "timeS", otherValue: 90,
  });
  assert(band, "the blend should still have a compromise zone");
  const at = recommendedBrewTarget({
    ingredients: NO_TEMP_OVERLAP, items, band, axis: "timeS", otherValue: 90,
    step: TIME_STEP, rangeMin: 0, rangeMax: 900,
  });
  assert(at >= band.lo && at <= band.hi,
    `the tap landed at ${at}s, outside the band ${band.lo}-${band.hi} it names`);
  assert(at !== opens,
    "the tap landed exactly where the cup opened — the control does nothing here");
});

test("when a quiet point exists in the band, the tap finds it", () => {
  // The contract, checked against the model rather than against a
  // remembered number: re-walk the band and confirm nothing reachable
  // is quieter than where the tap actually landed.
  const ids = Object.keys(INGREDIENTS)
    .filter(i => INGREDIENTS[i].tempC && INGREDIENTS[i].timeS)
    .sort();
  const missed = [];
  // Every 7th pair — a deterministic slice across the whole catalog,
  // wide enough to catch a systematic failure without running the
  // perception model tens of thousands of times in a unit suite.
  let n = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (n++ % 7) continue;
      const ings = [{ id: ids[i], g: 2, role: "lead" }, { id: ids[j], g: 1, role: "lead" }];
      const open = computeBrewProfile(ings);
      const { items, band } = bandFor(ings, "tempC", open.timeS);
      if (!band) continue;
      const at = recommendedBrewTarget({
        ingredients: ings, items, band, axis: "tempC", otherValue: open.timeS, step: 1,
      });
      const here = noise(ings, at, open.timeS);
      if (here === 0) continue;
      for (let v = Math.ceil(band.lo); v <= Math.floor(band.hi); v++) {
        if (noise(ings, v, open.timeS) < here) {
          missed.push(`${ids[i]}+${ids[j]}: took ${at}°C (${here}) over ${v}°C`);
          break;
        }
      }
    }
  }
  assert(missed.length === 0,
    `${missed.length} blends had a quieter point in the band and didn't take it:\n  ${missed.slice(0, 5).join("\n  ")}`);
});

test("where the tap lands noisier than the opening brew, the whole band is noisy", () => {
  /* The tap is allowed to be louder than the opening brew — the
     opening brew is clamped short of a leaf's close and the band
     isn't, so asking for the band can genuinely cost you a warning.
     What is NOT allowed is landing on a noisy point while a quieter
     one sat in the same band: that's the picker failing, not the data.

     Pissenlit Café is the live example — it opens at 95°C/480s clean
     and taps to 97°C/660s with warnings, because every point in its
     band reads that way. An accent is stretched there on purpose. */
  const failures = [];
  for (const b of BLENDS) {
    const open = computeBrewProfile(b.ingredients);
    const rec = tapRecommended(b.ingredients);
    const before = noise(b.ingredients, open.tempC, open.timeS);
    const after = noise(b.ingredients, rec.tempC, rec.timeS);
    if (after <= before) continue;
    // Louder — so prove nothing in the band was quieter.
    const band = rec.timeBand;
    if (!band) continue;
    let best = Infinity;
    for (let v = Math.ceil(band.lo); v <= Math.floor(band.hi); v += TIME_STEP) {
      best = Math.min(best, noise(b.ingredients, rec.tempC, v));
    }
    if (best < after) {
      failures.push(`${b.name}: took ${rec.timeS}s (${after}) with ${best} available in the band`);
    }
  }
  assert(failures.length === 0,
    `${failures.length} blend(s) landed noisier than the band required:\n  ${failures.join("\n  ")}`);
});

test("tapping is idempotent — the same tap gives the same answer", () => {
  // The word has no state. If a second tap could move you, the control
  // would be a nudge rather than a destination.
  const ings = [{ id: "sencha", g: 2, role: "lead" }, { id: "lemongrass", g: 1, role: "lead" }];
  const first = tapRecommended(ings);
  const second = tapRecommended([...ings]);
  assert(first.tempC === second.tempC && first.timeS === second.timeS,
    `${first.tempC}°C/${first.timeS}s then ${second.tempC}°C/${second.timeS}s`);
});

test("a band off the end of the slider still answers, and answers reachably", () => {
  /* REPORTED: "I hit compromise on temp then went to time and hit it,
     but it didn't update."

     A blend's slider range is the INTERSECTION of its leaves' windows;
     the compromise zone comes from the primary lead's. They can miss
     each other completely — assam + matcha + chamomile reaches 15-39s
     because matcha shuts at 30, while its compromise zone sits at
     240-300s. Intersecting them gives an empty interval, and the tap
     used to return null and move nothing at all.

     The answer has to be reachable, because an unreachable one is the
     same as no answer from where the user is sitting. */
  const items = poolOf(NO_TEMP_OVERLAP);
  const band = recommendedBand({
    items, primary: primaryOf(items), profiles: EXTRACTION_PROFILES,
    axis: "timeS", otherValue: 97,
  });
  assert(band, "the blend should have a compromise zone");
  const RANGE = [15, 39];   // what this blend's time slider can actually reach
  assert(band.lo > RANGE[1],
    `this test needs a band beyond the slider (band ${band.lo}-${band.hi}, slider ${RANGE})`);

  const at = recommendedBrewTarget({
    ingredients: NO_TEMP_OVERLAP, items, band, axis: "timeS", otherValue: 97,
    step: 1, rangeMin: RANGE[0], rangeMax: RANGE[1],
  });
  assert(at != null, "an unreachable band must still produce a target, not null");
  assert(at >= RANGE[0] && at <= RANGE[1],
    `landed at ${at}s, outside the slider's own range ${JSON.stringify(RANGE)}`);
  const earliestClose = Math.min(...NO_TEMP_OVERLAP.map(({ id }) => INGREDIENTS[id].timeS[1]));
  assert(at <= earliestClose,
    `landed at ${at}s, past the earliest close ${earliestClose}s — reaching for an ` +
    `out-of-reach band must not over-pull to get there`);
});

test("no band, no answer", () => {
  // Leaves with no common ground get no recommendation and the word
  // doesn't render. The function has to agree rather than inventing a
  // midpoint of nothing.
  assert(recommendedBrewTarget({
    ingredients: [], items: [], band: null, axis: "tempC", otherValue: 90, step: 1,
  }) === null, "a missing band should produce no target");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

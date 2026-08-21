/* ──────────────────────────────────────────────────────────────
   tests/opening-brew.test.mjs

   Where a blend OPENS, versus what the rail recommends.

   These were computed by different code that didn't agree.
   bestCoverageZone — the compromise band the slider draws when the
   leaves share no window — lived inline in BlendExtractionExplorer,
   so computeBrewProfile could not reach it and fell back to a
   grams-weighted centroid with no relationship to the band on
   screen. assam + matcha + chamomile opened at 92°C under a band
   the rail drew elsewhere: the app recommending one region and
   starting you in another.

   Both now read the same function.

   THE TWO RULES THAT PULL AGAINST EACH OTHER, and why time doesn't
   simply follow the band:

     - Open inside what the rail draws, so the two agree.
     - Never open past the lowest max, because over-pulling fires a
       warning while under-steeping is silent. A cup should not
       arrive already shouting.

   assam + matcha + chamomile is the case that forces the choice: its
   compromise zone runs 4-7 minutes and matcha's window closes at 30
   seconds. Centering on the band would over-pull matcha on arrival, so
   the clamp wins and the cup opens at 30s — outside the band, but
   quiet. The disagreement is real and is a data problem (a blend
   nobody should brew together), not a rounding one.

   Run: node tests/opening-brew.test.mjs
   ────────────────────────────────────────────────────────────── */

import { computeBrewProfile } from "../src/algo/compose.js";
import { bestCoverageZone } from "../src/algo/brewBounds.js";
import { INGREDIENTS } from "../src/data/ingredients.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Opening brew point — the cup starts where the rail points\n");

const pool = (ings) => ings.map(({ id, g, role }) => ({
  id, g, role, tempC: INGREDIENTS[id].tempC, timeS: INGREDIENTS[id].timeS,
}));
const primaryOf = (items) => {
  const leads = items.filter(i => !i.role || i.role === "lead");
  return (leads.length ? leads : items).slice().sort((a, b) => b.g - a.g)[0];
};
const intersects = (ings, axis) => {
  const lo = Math.max(...ings.map(({ id }) => INGREDIENTS[id][axis][0]));
  const hi = Math.min(...ings.map(({ id }) => INGREDIENTS[id][axis][1]));
  return lo <= hi ? [lo, hi] : null;
};

const NO_TEMP_OVERLAP = [{ id: "assam", g: 2 }, { id: "matcha", g: 1 }, { id: "chamomile", g: 1 }];

test("the shared zone finder is reachable from both sides", () => {
  // The whole point of extracting it. If this import ever breaks, the
  // rail and the opening point are free to disagree again.
  assert(typeof bestCoverageZone === "function", "bestCoverageZone should be importable");
});

test("with no temperature agreement, the cup opens inside the compromise zone", () => {
  const items = pool(NO_TEMP_OVERLAP);
  assert(!intersects(NO_TEMP_OVERLAP, "tempC"), "this blend should have no shared temp window");
  const zone = bestCoverageZone(items, primaryOf(items), "tempC");
  assert(zone, "and it should have a compromise zone to open in");
  const { tempC } = computeBrewProfile(NO_TEMP_OVERLAP);
  assert(tempC >= zone.range[0] - 1 && tempC <= zone.range[1] + 1,
    `opened at ${tempC}°C, outside the zone ${JSON.stringify(zone.range)} the rail draws`);
});

test("a shared window still wins, and still isn't the midpoint", () => {
  // The clamped weighted centroid stays: with several leaves near one
  // temperature and a lone outlier high, the intersection's MIDDLE sits
  // closer to the outlier than the cup wants. "Ignore the outliers" is
  // what the centroid already does.
  const ings = [{ id: "chamomile", g: 3 }, { id: "peppermint", g: 1 }];
  const within = intersects(ings, "tempC");
  assert(within, "this pair should share a temp window");
  const { tempC } = computeBrewProfile(ings);
  assert(tempC >= within[0] && tempC <= within[1],
    `opened at ${tempC}°C, outside the shared window ${JSON.stringify(within)}`);
});

test("time never opens past the lowest max, even to reach the band", () => {
  // The rule that beats the band. Over-pulling warns; under-steeping is
  // silent, so a cup must not arrive already in a warning state.
  const lowestMax = Math.min(...NO_TEMP_OVERLAP.map(({ id }) => INGREDIENTS[id].timeS[1]));
  const { timeS } = computeBrewProfile(NO_TEMP_OVERLAP);
  assert(timeS <= lowestMax,
    `opened at ${timeS}s, past the lowest max ${lowestMax}s — matcha would be over-pulled on arrival`);
});

test("time moves toward the zone when the clamp allows it", () => {
  // The clamp only bites when an ingredient's window closes early. When
  // it doesn't, the opening time should still follow the band rather
  // than a centroid that ignores it.
  const ings = [{ id: "chamomile", g: 2 }, { id: "valerian", g: 1 }];
  const items = pool(ings);
  const zone = bestCoverageZone(items, primaryOf(items), "timeS");
  const lowestMax = Math.min(...ings.map(({ id }) => INGREDIENTS[id].timeS[1]));
  const { timeS } = computeBrewProfile(ings);
  if (zone && (zone.range[0] + zone.range[1]) / 2 <= lowestMax) {
    assert(Math.abs(timeS - (zone.range[0] + zone.range[1]) / 2) <= 30,
      `expected the opening time near the zone center, got ${timeS}s for ${JSON.stringify(zone.range)}`);
  } else {
    assert(timeS <= lowestMax, `still must not exceed ${lowestMax}s, got ${timeS}s`);
  }
});

test("an empty pot still answers", () => {
  const p = computeBrewProfile([]);
  assert(Number.isFinite(p.tempC) && Number.isFinite(p.timeS),
    "an empty blend should still produce a usable default");
});

test("no blend in the catalog opens on an over-pull", () => {
  // Swept rather than sampled: the clamp is the one guarantee that
  // must hold for every pot anyone can build, and a single pair that
  // breaks it is a cup that greets the user with a warning.
  const ids = Object.keys(INGREDIENTS).filter(i => INGREDIENTS[i].timeS);
  const offenders = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const ings = [{ id: ids[i], g: 2 }, { id: ids[j], g: 1 }];
      const lowestMax = Math.min(INGREDIENTS[ids[i]].timeS[1], INGREDIENTS[ids[j]].timeS[1]);
      const { timeS } = computeBrewProfile(ings);
      if (timeS > lowestMax) offenders.push(`${ids[i]}+${ids[j]} opens ${timeS}s > ${lowestMax}s`);
    }
  }
  assert(offenders.length === 0,
    `${offenders.length} pairs open already over-pulled:\n  ${offenders.slice(0, 5).join("\n  ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

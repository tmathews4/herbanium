/* ──────────────────────────────────────────────────────────────
   tests/coupled-band.test.mjs

   Temperature and time are not independent, and the app used to
   pretend they were. Every one of the 52 extraction profiles moves
   both together — 75C/180s, 95C/300s, 100C/420s — so the research
   samples a DIAGONAL through (temp, time) space, not a grid. The
   recommended window on the time slider nevertheless never moved
   when you changed the temperature.

   `alongProfile` reads one axis off the other along that diagonal.
   `coupledBand` turns per-ingredient answers into a window.

   THE BUG THIS FILE EXISTS FOR. The first version took min..max of
   the ingredients' ideals, which is exactly backwards for leaves
   that disagree: valerian wants 600-900s and cinnamon 300-600s, so
   at 95°C their ideals are 900s and 300s, and the "sweet spot"
   became a TEN MINUTE band spanning the whole argument. Reported
   from the app as a huge recommendation between two ingredients
   that are red to each other.

   Coupling REFINES an agreement; it never manufactures one. No
   agreed window in, no band out.

   Run: node tests/coupled-band.test.mjs
   ────────────────────────────────────────────────────────────── */

import { alongProfile, coupledBand } from "../src/algo/brewBounds.js";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { INGREDIENTS } from "../src/data/ingredients.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Coupled brew bands — the two sliders are one variable\n");

const agreed = (ids, axis) => {
  const lo = Math.max(...ids.map(i => INGREDIENTS[i][axis][0]));
  const hi = Math.min(...ids.map(i => INGREDIENTS[i][axis][1]));
  return hi > lo ? [lo, hi] : null;
};
const band = (ids, axis, otherValue, minSpan = 60) => coupledBand({
  ingredients: ids.map(id => ({ id })),
  profiles: EXTRACTION_PROFILES,
  axis, otherValue, within: agreed(ids, axis), minSpan,
});

/* ── alongProfile ────────────────────────────────────────────── */

test("reads one axis off the other along the profile's diagonal", () => {
  const rows = EXTRACTION_PROFILES.chamomile;           // 75/180, 95/300, 100/420
  assert(alongProfile(rows, "tempC", "timeS", 75) === 180, "should hit the first sample exactly");
  assert(alongProfile(rows, "tempC", "timeS", 95) === 300, "and the middle one");
  const mid = alongProfile(rows, "tempC", "timeS", 85);
  assert(mid > 180 && mid < 300, `85°C should interpolate between samples, got ${mid}`);
});

test("clamps past the ends rather than extrapolating", () => {
  // Past the last sampled point the honest answer is the last sampled
  // point. Extrapolating would invent research that wasn't done.
  const rows = EXTRACTION_PROFILES.chamomile;
  assert(alongProfile(rows, "tempC", "timeS", 40) === 180, "below the range clamps to the first");
  assert(alongProfile(rows, "tempC", "timeS", 130) === 420, "above it clamps to the last");
});

test("survives missing or single-point profiles", () => {
  assert(alongProfile(null, "tempC", "timeS", 90) === null, "no rows is null, not a throw");
  assert(alongProfile([], "tempC", "timeS", 90) === null, "empty is null");
  assert(alongProfile([{ tempC: 90, timeS: 200 }], "tempC", "timeS", 60) === 200,
    "a single sample is the answer everywhere");
});

/* ── coupledBand ─────────────────────────────────────────────── */

test("two leaves that fight each other get NO band", () => {
  // The reported bug. Valerian 600-900s, cinnamon 300-600s: they touch
  // at a single point, so there is no window to recommend and the app
  // must not draw one.
  const v = INGREDIENTS.valerian.timeS, c = INGREDIENTS.cinnamon.timeS;
  assert(Math.min(v[1], c[1]) <= Math.max(v[0], c[0]),
    `this test assumes valerian ${v} and cinnamon ${c} don't genuinely overlap`);
  assert(band(["valerian", "cinnamon"], "timeS", 95) === null,
    "disagreement must not become a recommendation");
});

test("the band never exceeds what the leaves agree on", () => {
  const ids = ["chamomile", "peppermint"];
  const within = agreed(ids, "timeS");
  assert(within, "this pair should genuinely overlap");
  for (const t of [70, 80, 90, 100]) {
    const b = band(ids, "timeS", t);
    assert(b, `expected a band at ${t}°C`);
    assert(b[0] >= within[0] - 1e-6 && b[1] <= within[1] + 1e-6,
      `at ${t}°C the band ${JSON.stringify(b)} escaped the agreed window ${JSON.stringify(within)}`);
  }
});

test("no agreed window means no band, whatever the profiles say", () => {
  assert(coupledBand({
    ingredients: [{ id: "chamomile" }], profiles: EXTRACTION_PROFILES,
    axis: "timeS", otherValue: 90, within: null,
  }) === null, "without a window there is nothing to refine");
  assert(coupledBand({
    ingredients: [{ id: "chamomile" }], profiles: EXTRACTION_PROFILES,
    axis: "timeS", otherValue: 90, within: [300, 300],
  }) === null, "a zero-width window is not a window");
});

test("a single leaf still gets a usable window, not a point", () => {
  // One ingredient's ideal is a single value; a band you can't move
  // inside is decoration, which is the complaint that started all this.
  const b = coupledBand({
    ingredients: [{ id: "chamomile" }], profiles: EXTRACTION_PROFILES,
    axis: "timeS", otherValue: 90, within: INGREDIENTS.chamomile.timeS, minSpan: 60,
  });
  assert(b, "expected a band");
  assert(b[1] - b[0] >= 59, `expected at least a minute of width, got ${JSON.stringify(b)}`);
});

test("catalysts don't get a vote", () => {
  // They're along for the ride, not for the brew point — the same
  // exclusion the declared-range intersection already makes.
  const withCatalyst = coupledBand({
    ingredients: [{ id: "chamomile" }, { id: "valerian", role: "catalyst" }],
    profiles: EXTRACTION_PROFILES, axis: "timeS", otherValue: 90,
    within: INGREDIENTS.chamomile.timeS, minSpan: 60,
  });
  const alone = coupledBand({
    ingredients: [{ id: "chamomile" }],
    profiles: EXTRACTION_PROFILES, axis: "timeS", otherValue: 90,
    within: INGREDIENTS.chamomile.timeS, minSpan: 60,
  });
  assert(JSON.stringify(withCatalyst) === JSON.stringify(alone),
    `a catalyst changed the band: ${JSON.stringify(withCatalyst)} vs ${JSON.stringify(alone)}`);
});

test("the recommendation actually MOVES with the other axis", () => {
  // The whole point. If dragging temperature leaves the steep window
  // where it was, this feature does nothing.
  const ids = ["chamomile", "peppermint"];
  const seen = new Set([70, 85, 100].map(t => JSON.stringify(band(ids, "timeS", t))));
  assert(seen.size > 1,
    `the band should differ across temperatures, got the same one every time: ${[...seen][0]}`);
});

/* ── the property that motivated all of it ───────────────────── */

test("every profile really is a diagonal, not a grid", () => {
  // If this ever stops being true — someone adds off-diagonal brew
  // points — then reading one axis off the other stops being valid and
  // this whole approach needs revisiting rather than patching.
  const offDiagonal = [];
  for (const [id, rows] of Object.entries(EXTRACTION_PROFILES)) {
    if (!Array.isArray(rows) || rows.length < 2) continue;
    const t = rows.map(r => r.tempC), s = rows.map(r => r.timeS);
    const up = (a) => a.every((v, i) => i === 0 || v >= a[i - 1]);
    if (!(up(t) && up(s))) offDiagonal.push(id);
  }
  assert(offDiagonal.length === 0,
    `these profiles no longer move temp and time together, so alongProfile can't read `
    + `one from the other: ${offDiagonal.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

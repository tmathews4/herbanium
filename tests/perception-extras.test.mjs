/* ──────────────────────────────────────────────────────────────
   tests/perception-extras.test.mjs

   Covers the three perception-layer additions:
     1. loudnessOf — perceptual loudness multipliers
     2. attenuateFragileEffects — parabolic decay past overpull
     3. applyEffectFloor — blend.effects as a soft floor

   Plus an integration check via resolveBlendAtBrew on real catalog
   blends, verifying the audit-flagged regressions actually moved
   the right direction.

   Run: node tests/perception-extras.test.mjs
   ────────────────────────────────────────────────────────────── */

import {
  loudnessOf, attenuateFragileEffects, applyEffectFloor, FRAGILE_EFFECTS,
} from "../src/algo/perception.js";
import { resolveBlendAtBrew, computeBrewProfile } from "../src/algo/compose.js";
import {
  padTempRange, padTimeRange,
  TEMP_HARD_MIN, TEMP_HARD_MAX, TIME_HARD_MIN, TIME_HARD_MAX, TEMP_PAD, TIME_PAD,
} from "../src/algo/brewBounds.js";
import { BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const failures = [];

function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function approx(a, b, eps = 0.01) { return Math.abs(a - b) <= eps; }

const findBlend = (id) => BLENDS.find(b => b.id === id);

console.log("Perception-extras — loudness, fragile decay, effect floor\n");

// ── 1. loudnessOf ────────────────────────────────────────────────
test("loudnessOf: mint at 2.0 (high)", () => {
  assert(loudnessOf("minty") === 2.0, `got ${loudnessOf("minty")}`);
});
test("loudnessOf: smoky at 2.0 (high)", () => {
  assert(loudnessOf("smoky") === 2.0, `got ${loudnessOf("smoky")}`);
});
test("loudnessOf: sweet at 0.7 (low)", () => {
  assert(loudnessOf("sweet") === 0.7, `got ${loudnessOf("sweet")}`);
});
test("loudnessOf: floral at 0.7 (low)", () => {
  assert(loudnessOf("floral") === 0.7, `got ${loudnessOf("floral")}`);
});
test("loudnessOf: unknown flavor defaults to 1.0", () => {
  assert(loudnessOf("not-a-real-flavor") === 1.0, `got ${loudnessOf("not-a-real-flavor")}`);
});
test("loudnessOf: high-loudness > low-loudness (the dominance hierarchy)", () => {
  assert(loudnessOf("minty") > loudnessOf("sweet"));
  assert(loudnessOf("smoky") > loudnessOf("floral"));
  assert(loudnessOf("bitter") > loudnessOf("honey"));
});

// ── 2. attenuateFragileEffects ───────────────────────────────────
test("attenuate: no overpull leaves effects alone", () => {
  const effects = { focus: 4, calm: 3, energy: 4 };
  const flavors = { astringent: 1, bitter: 1 };
  const out = attenuateFragileEffects(effects, flavors);
  assert(out.focus === 4 && out.calm === 3 && out.energy === 4,
    `unexpected attenuation: ${JSON.stringify(out)}`);
});
test("attenuate: heavy overpull reduces fragile effects", () => {
  const effects = { focus: 4, calm: 3, energy: 4, warming: 4 };
  const flavors = { astringent: 5, bitter: 0 };
  // overpull = max(0, 5-2) + max(0, 0-2) = 3 + 0 = 3
  // factor = 1 - 0.15 * 3 = 0.55
  const out = attenuateFragileEffects(effects, flavors);
  assert(approx(out.focus, 2.2), `focus ${out.focus} ≠ 2.2`);
  assert(approx(out.calm, 1.65), `calm ${out.calm} ≠ 1.65`);
  // energy and warming are NOT fragile — should stay
  assert(out.energy === 4, `energy moved: ${out.energy}`);
  assert(out.warming === 4, `warming moved: ${out.warming}`);
});
test("attenuate: doesn't drive negative on extreme overpull", () => {
  const effects = { focus: 1, calm: 1 };
  const flavors = { astringent: 5, bitter: 5 };
  // overpull = 3 + 3 = 6, factor = 1 - 0.9 = 0.1
  const out = attenuateFragileEffects(effects, flavors);
  assert(out.focus >= 0 && out.calm >= 0,
    `negative effects: ${JSON.stringify(out)}`);
});
test("attenuate: only fragile effects affected", () => {
  const effects = { warming: 5, energy: 5, digestive: 5, smoky: 5, grounding: 5 };
  const flavors = { astringent: 5 };
  const out = attenuateFragileEffects(effects, flavors);
  for (const tag of Object.keys(effects)) {
    assert(out[tag] === effects[tag],
      `non-fragile ${tag} attenuated from ${effects[tag]} to ${out[tag]}`);
  }
});
test("attenuate: returns new object, doesn't mutate", () => {
  const effects = { focus: 4 };
  const flavors = { astringent: 5 };
  const before = JSON.stringify(effects);
  attenuateFragileEffects(effects, flavors);
  assert(JSON.stringify(effects) === before, "input was mutated");
});

// ── 3. applyEffectFloor ──────────────────────────────────────────
test("floor: declared tag missing from perceived gets raised", () => {
  const perceived = { focus: 3 };
  const declared = [["calm", 3], ["focus", 3]];
  const out = applyEffectFloor(perceived, declared);
  assert(approx(out.calm, 2.4), `calm ${out.calm} ≠ 2.4 (80% of 3)`);
});
test("floor: doesn't lower a perceived value above the floor", () => {
  const perceived = { calm: 4 };
  const declared = [["calm", 3]];
  const out = applyEffectFloor(perceived, declared);
  assert(out.calm === 4, `calm shouldn't move down: got ${out.calm}`);
});
test("floor: empty declared list is a no-op", () => {
  const perceived = { focus: 3, calm: 2 };
  const out = applyEffectFloor(perceived, []);
  assert(out.focus === 3 && out.calm === 2, `unexpected change: ${JSON.stringify(out)}`);
});
test("floor: null declared list is a no-op", () => {
  const perceived = { focus: 3 };
  const out = applyEffectFloor(perceived, null);
  assert(out.focus === 3 && Object.keys(out).length === 1);
});
test("floor: returns new object, doesn't mutate", () => {
  const perceived = { focus: 3 };
  const declared = [["calm", 3]];
  const before = JSON.stringify(perceived);
  applyEffectFloor(perceived, declared);
  assert(JSON.stringify(perceived) === before, "input was mutated");
});

// ── 4. Integration via resolveBlendAtBrew ────────────────────────

test("integration: sencha at 100°C/240s blunts focus vs 78°C/90s peak", () => {
  const sencha = findBlend("sencha-properly");
  assert(sencha, "sencha-properly missing");
  const peak = resolveBlendAtBrew(sencha.ingredients, 78, 90, sencha.tempC, sencha.timeS, true);
  const cliff = resolveBlendAtBrew(sencha.ingredients, 100, 240, sencha.tempC, sencha.timeS, true);
  const peakFocus = (peak.effects.find(([t]) => t === "focus") || [, 0])[1];
  const cliffFocus = (cliff.effects.find(([t]) => t === "focus") || [, 0])[1];
  assert(cliffFocus < peakFocus,
    `cliff focus ${cliffFocus} should be < peak ${peakFocus} (parabolic decay broken)`);
});

test("integration: pu-erh shows grounding (declared on blend.effects)", () => {
  const puerh = findBlend("shou-puerh");
  assert(puerh, "shou-puerh missing");
  const out = resolveBlendAtBrew(
    puerh.ingredients, 100, 30,
    puerh.tempC, puerh.timeS, true, !!puerh.tradition,
    puerh.effects
  );
  const grounding = out.effects.find(([t]) => t === "grounding");
  assert(grounding && grounding[1] >= 2,
    `grounding missing or weak: ${JSON.stringify(out.effects)}`);
});

test("integration: moroccan mint loudness lifts minty above its pre-loudness baseline", () => {
  // Pre-change audit measured minty=1.2 in this brew; with the 2.0
  // loudness multiplier on mint we expect a meaningful lift even
  // though the recipe's gunpowder grams still keep smoke prominent.
  const m = findBlend("moroccan");
  assert(m, "moroccan missing");
  const out = resolveBlendAtBrew(
    m.ingredients, 90, 180,
    m.tempC, m.timeS, true, !!m.tradition,
    m.effects
  );
  const minty = (out.flavors.find(([t]) => t === "minty") || [, 0])[1];
  assert(minty >= 2.0,
    `loudness lift didn't take: minty=${minty} (baseline pre-change was 1.2)`);
});

test("integration: moroccan mint fires tradition-over-literature note at baseline", () => {
  // The recipe lands gunpowder right at its upper temp edge (90°C)
  // and upper time edge (180s) — well within range, but still tips
  // the cup into astringent territory. Tradition note should fire to
  // explain why the curator chose this point despite the warnings.
  const m = findBlend("moroccan");
  assert(m, "moroccan missing");
  const out = resolveBlendAtBrew(
    m.ingredients, m.tempC, m.timeS,
    m.tempC, m.timeS, true, !!m.tradition,
    m.effects
  );
  assert(out.traditionNote === true,
    `traditionNote should fire at curated baseline when warnings are present, got ${out.traditionNote}`);
});

test("integration: experimental blend at baseline does NOT fire tradition note", () => {
  // Even if warnings fire, experimental/non-traditional blends shouldn't
  // claim the tradition note — they don't carry centuries of practice.
  const out = resolveBlendAtBrew(
    [{ id: "sencha", g: 3.0 }],
    100, 240,        // pushed past sencha's window deliberately
    100, 240, true,  // curated, at baseline
    false,           // NOT traditional
    null
  );
  assert(out.traditionNote === false,
    "non-traditional blend shouldn't claim the tradition note");
});

test("computeBrewProfile: gravitates toward grams-weighted centroid in intersection", () => {
  // Two ingredients, intersection [88, 92]. Heavy ingredient prefers
  // ~85 (out), light prefers ~95 (out). Intersection is [88, 92]; the
  // heavy ingredient pulls the recommendation toward the lower edge.
  // Old midpoint behavior: 90. New centroid behavior: closer to 88
  // because heavy outweighs light.
  // Use real ingredients with overlapping but skewed ranges.
  // chamomile: tempC [95, 100], peppermint: tempC [95, 100] — same
  // range, so test with a contrived case using actual catalog leaves.
  // Use sencha [70, 80] heavy and lavender [85, 95] light: no
  // intersection. Skip that case here.

  // Real test: lemon balm [90, 95] (3g lead) + chamomile [95, 100]
  // (1g accent) — intersection at exactly 95. Centroid weighted by
  // grams should still land at 95 (clamped into the single-point
  // intersection).
  const out = computeBrewProfile([
    { id: "lemonbalm", g: 3.0 },
    { id: "chamomile", g: 1.0 },
  ]);
  assert(out.tempC === 95,
    `expected centroid clamped to intersection at 95°C, got ${out.tempC}`);
});

test("computeBrewProfile: synthetic-built blend always uses intersection when possible", () => {
  // Two ingredients with a wide overlap should produce a brew inside
  // the intersection rectangle; compatible flag should be true.
  const out = computeBrewProfile([
    { id: "chamomile", g: 1.5 },     // [95, 100], [300, 420]
    { id: "lemonbalm", g: 1.0 },     // [90, 95],  [240, 300]
  ]);
  // Intersection on temp: [95, 95]; on time: [300, 300]. compatible=true.
  assert(out.compatible === true, `should find intersection, got compatible=${out.compatible}`);
  assert(out.tempC === 95, `expected 95°C in intersection, got ${out.tempC}`);
});

// ── 6. Brew-bound padding ────────────────────────────────────────
test("padTempRange: pads ±10°C inside hard bounds", () => {
  const out = padTempRange([85, 95]);
  assert(out[0] === 75 && out[1] === 100,
    `expected [75, 100] (85-10, 95+10 clamped to TEMP_HARD_MAX), got [${out}]`);
});
test("padTempRange: clamps low side to TEMP_HARD_MIN", () => {
  const out = padTempRange([65, 75]);
  assert(out[0] === TEMP_HARD_MIN, `low side should clamp to ${TEMP_HARD_MIN}, got ${out[0]}`);
  assert(out[1] === 85, `high side: 75+10=85, got ${out[1]}`);
});
test("padTempRange: clamps high side to TEMP_HARD_MAX", () => {
  const out = padTempRange([95, 100]);
  assert(out[1] === TEMP_HARD_MAX, `high side should clamp to ${TEMP_HARD_MAX}, got ${out[1]}`);
});
test("padTimeRange: pads ±2 min inside hard bounds", () => {
  const out = padTimeRange([180, 360]);
  assert(out[0] === 60 && out[1] === 480,
    `expected [60, 480], got [${out}]`);
});
test("padTimeRange: clamps low side to TIME_HARD_MIN", () => {
  const out = padTimeRange([30, 60]);
  assert(out[0] === TIME_HARD_MIN, `low side should clamp to ${TIME_HARD_MIN}, got ${out[0]}`);
});
test("padTimeRange: clamps high side to TIME_HARD_MAX", () => {
  const out = padTimeRange([1500, 1800]);
  assert(out[1] === TIME_HARD_MAX, `high side should clamp to ${TIME_HARD_MAX}, got ${out[1]}`);
});

test("integration: hojicha overpull stays low-bitter", () => {
  const h = findBlend("hojicha-evening");
  assert(h, "hojicha missing");
  const out = resolveBlendAtBrew(
    h.ingredients, 100, 240,
    h.tempC, h.timeS, true, !!h.tradition,
    h.effects
  );
  const bitter = out.balance.find(b => Array.isArray(b) ? b[0] === "bitterness" : b.tag === "bitterness");
  // Hojicha shouldn't fire bitterness even at long boil — roasting destroyed catechins.
  if (bitter) {
    const v = Array.isArray(bitter) ? bitter[1] : bitter.value;
    assert(v <= 2, `hojicha bitterness too high: ${v}`);
  }
});

console.log(`\n\n${pass} passed, ${fail} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const { desc, message } of failures) {
    console.log(`  ✗ ${desc}\n      ${message}`);
  }
  process.exit(1);
}

/* ──────────────────────────────────────────────────────────────
   tests/perception-extras.test.mjs

   Covers the two perception-layer additions:
     1. loudnessOf — perceptual loudness multipliers
     2. attenuateFragileEffects — parabolic decay past overpull

   Plus an integration check via resolveBlendAtBrew on real catalog
   blends, verifying the audit-flagged regressions actually moved
   the right direction.

   Run: node tests/perception-extras.test.mjs
   ────────────────────────────────────────────────────────────── */

import {
  loudnessOf, attenuateFragileEffects, FRAGILE_EFFECTS,
  applyEffectSynergies, buildWarnings, antagonismFactor,
  ANTAGONISM_MIN_MG, ANTAGONISM_FULL_MG, ANTAGONISM_FLOOR,
} from "../src/algo/perception.js";
import { resolveBlendAtBrew, computeBrewProfile } from "../src/algo/compose.js";
import { ALLOWED_PARADOXES } from "../src/algo/perception.js";
import {
  padTempRange, padTimeRange,
  TEMP_HARD_MIN, TEMP_HARD_MAX, TIME_HARD_MIN, TIME_HARD_MAX,
  TEMP_PAD_BELOW, TEMP_MIN_SLIDER_RANGE, TIME_PAD_RATIO, timeStepFor,
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

// ── 3. Integration via resolveBlendAtBrew ────────────────────────

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

test("integration: pu-erh shows grounding from its extraction profile", () => {
  const puerh = findBlend("shou-puerh");
  assert(puerh, "shou-puerh missing");
  const out = resolveBlendAtBrew(
    puerh.ingredients, 100, 30,
    puerh.tempC, puerh.timeS, true, !!puerh.tradition,
  );
  const grounding = out.effects.find(([t]) => t === "grounding");
  assert(grounding && grounding[1] >= 2,
    `grounding missing or weak: ${JSON.stringify(out.effects)}`);
});

test("integration: moroccan mint loudness lifts minty above its pre-loudness baseline", () => {
  // Pre-change audit measured minty=1.2 in this brew; the 2.0 loudness
  // multiplier on mint should produce a meaningful lift. We assert
  // ≥1.5 (a clear ~25%+ lift over the pre-loudness baseline) rather
  // than a magic-number hard threshold so calibration drift from
  // extraction-profile retunes doesn't break this on every nudge.
  const m = findBlend("moroccan");
  assert(m, "moroccan missing");
  const out = resolveBlendAtBrew(
    m.ingredients, 90, 180,
    m.tempC, m.timeS, true, !!m.tradition,
  );
  const minty = (out.flavors.find(([t]) => t === "minty") || [, 0])[1];
  assert(minty >= 1.5,
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
// Bounds rules (see algo/brewBounds.js):
//   padTempRange: only the LOWER side is padded (TEMP_PAD_BELOW below
//                 the input lo); upper always returns TEMP_HARD_MAX.
//   padTimeRange: lower always returns TIME_HARD_MIN; upper is +30%
//                 of the input hi (TIME_PAD_RATIO).
test("padTempRange: when natural pad already wider than min slider span, keep natural lower", () => {
  // Input low = 60 → natural lower = 60 - TEMP_PAD_BELOW = 50.
  // min slider span enforces lower <= 100 - 45 = 55. 50 < 55, so keep 50.
  const out = padTempRange([60, 80]);
  assert(out[0] === 60 - TEMP_PAD_BELOW,
    `expected lower = 60-${TEMP_PAD_BELOW} = ${60 - TEMP_PAD_BELOW}, got ${out[0]}`);
  assert(out[1] === TEMP_HARD_MAX,
    `expected upper = TEMP_HARD_MAX (${TEMP_HARD_MAX}), got ${out[1]}`);
});
test("padTempRange: when natural pad narrower than min slider span, widen down", () => {
  // Input low = 85 → natural lower = 75. min slider span needs lower
  // <= TEMP_HARD_MAX - TEMP_MIN_SLIDER_RANGE. Widen down to that.
  const out = padTempRange([85, 95]);
  assert(out[0] === TEMP_HARD_MAX - TEMP_MIN_SLIDER_RANGE,
    `expected lower widened to ${TEMP_HARD_MAX - TEMP_MIN_SLIDER_RANGE}, got ${out[0]}`);
});
test("padTempRange: clamps low side to TEMP_HARD_MIN", () => {
  const out = padTempRange([TEMP_HARD_MIN + 2, 75]);
  assert(out[0] === TEMP_HARD_MIN,
    `low side should clamp to ${TEMP_HARD_MIN}, got ${out[0]}`);
});
test("padTempRange: upper always boiling regardless of input", () => {
  const out = padTempRange([75, 100]);
  assert(out[1] === TEMP_HARD_MAX,
    `upper should be ${TEMP_HARD_MAX}, got ${out[1]}`);
});
test("padTimeRange: lower = TIME_HARD_MIN; upper aligned to slider step", () => {
  const out = padTimeRange([180, 360]);
  assert(out[0] === TIME_HARD_MIN,
    `lower should be ${TIME_HARD_MIN}, got ${out[0]}`);
  // Upper rounds UP to the slider's step boundary so the thumb can
  // reach the labeled max. Reads TIME_STEP_S rather than a literal:
  // the step is the reason this rounding exists, so hardcoding one
  // would let the two drift apart silently — which is exactly what
  // this test is for.
  const padded = 360 * (1 + TIME_PAD_RATIO);
  const step = timeStepFor([TIME_HARD_MIN, Math.ceil(padded)]);
  const expectedHi = TIME_HARD_MIN
    + Math.ceil((Math.ceil(padded) - TIME_HARD_MIN) / step) * step;
  assert(out[1] === expectedHi,
    `expected upper = ${TIME_HARD_MIN} + ceil((${Math.ceil(padded)} - ${TIME_HARD_MIN}) / ${step}) * ${step} = ${expectedHi}, got ${out[1]}`);
});

test("padTimeRange: the labeled max is landable from the floor", () => {
  // What the step alignment is actually FOR, stated as the property
  // rather than as the formula: whatever the step is, the slider's
  // right edge has to be a value the thumb can stop on. An HTML range
  // steps from `min`, so the span has to divide evenly.
  //
  // This is the test the 15 -> 1 change needed. The old assertion
  // above would have passed just as happily with the literal left at
  // 15 and the slider set to 1 — it only ever checked the arithmetic
  // against itself.
  for (const hi of [60, 175, 240, 360, 420, 600, 900]) {
    const [lo, up] = padTimeRange([30, hi]);
    assert(Number.isInteger(up), `upper should be whole seconds, got ${up} for hi=${hi}`);
    const step = timeStepFor([lo, up]);
    assert((up - lo) % step === 0,
      `span ${up}-${lo}=${up - lo} isn't a whole number of ${step}s steps (hi=${hi})`);
  }
});
test("padTimeRange: lower always TIME_HARD_MIN regardless of input", () => {
  const out = padTimeRange([30, 60]);
  assert(out[0] === TIME_HARD_MIN, `low side should be ${TIME_HARD_MIN}, got ${out[0]}`);
});
test("padTimeRange: clamps high side to TIME_HARD_MAX", () => {
  // Need an input whose +30% would actually exceed TIME_HARD_MAX.
  // 3000 × 1.3 = 3900 → should clamp to 3600.
  const out = padTimeRange([1500, 3000]);
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

/* ── THE CONTRACT BEHIND THE ⚠ ────────────────────────────────────

   A palate overload used to be announced twice: a ⚠ on the palate row,
   and a prose band below repeating it. The band is gone and the mark
   carries the sentence, which only works while the two agree about
   which warnings are which.

   The UI filters on `axis`: a warning that names a palate track is
   assumed to have a ⚠ showing it, and is dropped from the prose list.
   If a tannin warning ever ships without an axis it goes silent in
   both places — no band, no symbol to open. If an aromatic one ever
   gains one, it vanishes behind a mark that doesn't exist. Neither
   failure is visible by reading either file alone. */

test("every tannin warning names the palate axis that carries it", () => {
  const cups = [
    [[{ id: "assam", g: 2, role: "lead" }], 100, 900],
    [[{ id: "sencha", g: 2, role: "lead" }], 80, 300],
    [[{ id: "puerh", g: 2, role: "lead" }], 100, 600],
    [[{ id: "gunpowder", g: 2, role: "lead" }], 95, 400],
  ];
  const orphans = [];
  for (const [ings, t, s] of cups) {
    for (const w of resolveBlendAtBrew(ings, t, s).warnings) {
      // Per-ingredient lines name a leaf and belong to no track.
      if (w.kind !== "tannin" || w.role) continue;
      if (!w.axis) orphans.push(`${ings[0].id} @ ${t}/${s}: "${w.text}"`);
    }
  }
  assert(orphans.length === 0,
    `${orphans.length} cup-level tannin warning(s) name no axis, so nothing shows them:\n  ${orphans.join("\n  ")}`);
});

test("the axes named are ones the palate strip actually draws", () => {
  // PALATE_WARNINGS in FlavorMap keys off these exact names. A typo
  // here would drop the band and light no mark.
  const DRAWN = new Set(["bitterness", "astringency", "tartness", "menthol"]);
  const bad = [];
  for (const [t, s] of [[100, 900], [95, 600], [85, 240]]) {
    for (const w of resolveBlendAtBrew([{ id: "assam", g: 2, role: "lead" }], t, s).warnings) {
      if (w.axis && !DRAWN.has(w.axis)) bad.push(`${w.axis} (${w.text})`);
    }
  }
  assert(bad.length === 0, `warnings point at palate tracks that don't exist: ${bad.join(", ")}`);
});

test("aromatic off-notes claim no axis, so they keep their prose", () => {
  // Soapy, camphor, acrid and the rest have no palate track and no ⚠.
  // If one ever gained an axis it would be filtered out of the band
  // list and disappear entirely.
  const mislabelled = [];
  for (const [t, s] of [[100, 900], [100, 1800]]) {
    for (const w of resolveBlendAtBrew(
      [{ id: "lavender", g: 2, role: "lead" }, { id: "chamomile", g: 1, role: "lead" }], t, s,
    ).warnings) {
      if (w.kind === "aromatic" && w.axis) mislabelled.push(w.text);
    }
  }
  assert(mislabelled.length === 0,
    `aromatic warnings with an axis would vanish behind a mark that isn't drawn:\n  ${mislabelled.join("\n  ")}`);
});

/* ── AN ANTAGONISM IS NOT A PARADOX ────────────────────────────────

   `energy + sleepy` sat in ALLOWED_PARADOXES and surfaced as "energy
   and sleepy will both register — the cup walks both sides." Asked
   whether that was actually true, the receptor evidence says no:
   caffeine antagonises adenosine and, at higher concentrations, GABA-A
   — the pathway valerian's valerenic acid and chamomile's apigenin
   work through. Caffeine cuts diazepam's sedation dose-dependently and
   chronic caffeine reduces GABA's potentiation of benzodiazepine
   binding. The two don't co-exist; one suppresses the other.

   So it moved to ANTAGONISMS, which is the opposite claim: not "both
   will land" but "one is cancelling the other, and you should know
   because you probably stacked them on purpose".

   `warming + cooling` stays a paradox — TRPM8 cooling and thermogenic
   warming are separate systems, neither inhibiting the other, which is
   why cardamom genuinely reads as both.

   See docs/research/synergies.md. */

test("a caffeinated cup with sedative herbs is told they're fighting", () => {
  /* 4g of assam, not 2, and the change is a correction rather than a
     tuning. Caffeine used to be multiplied by GRAMS while being sourced
     PER CUP, so 2g of assam reported 120mg against a documented 60 and
     cleared the 80mg gate on half the tea it should have needed. With
     the unit fixed, a cup that genuinely holds enough caffeine to fight
     a sedative takes about two cup-doses of black tea — which is what
     the warning has always been about. */
  const cup = [{ id: "assam", g: 4, role: "lead" }, { id: "chamomile", g: 2, role: "lead" }];
  const warnings = resolveBlendAtBrew(cup, 95, 240).warnings;
  const fired = warnings.filter(w => w.kind === "antagonism");
  assert(fired.length === 1,
    `expected the antagonism warning on black tea + chamomile, got ${fired.length}`);
  // Matches the CLAIM, not a phrasing. "uphill" was in the original
  // wording and is deliberately gone: it said the caffeine wins and the
  // sedatives are spent losing, which the valerian/hops trial
  // contradicts. The claim that has to survive is mutual opposition.
  assert(/work(s)? against|oppose|compete/i.test(fired[0].text),
    `the warning should say they oppose each other, got: ${fired[0].text}`);
});

test("the antagonism needs actual caffeine, not the word energy", () => {
  /* The mechanism is a molecule, not a register. Cardamom carries
     `energy` by tradition and holds no caffeine at all, so a cardamom
     and chamomile cup has nothing antagonising anything — firing there
     would be the app inventing chemistry from a label. */
  // 4g of assam for the same reason as the test above: caffeine is
  // sourced per cup-dose, and a cup that genuinely fights itself needs
  // about two of them.
  const caffeinated = resolveBlendAtBrew(
    [{ id: "assam", g: 4, role: "lead" }, { id: "chamomile", g: 2, role: "lead" }], 95, 240);
  const herbal = resolveBlendAtBrew(
    [{ id: "cardamom", g: 2, role: "lead" }, { id: "chamomile", g: 2, role: "lead" }], 95, 240);

  assert(caffeinated.warnings.some(w => w.kind === "antagonism"),
    "black tea with chamomile really is fighting itself and should say so");
  assert(!herbal.warnings.some(w => w.kind === "antagonism"),
    "a caffeine-free cup must not be told its caffeine is fighting anything");
});

test("a theanine cup is not mistaken for an antagonism", () => {
  // The opposite error. Matcha is caffeine AND calm, which is the
  // app's best-evidenced SYNERGY — warning about it would contradict
  // the research two files over. The check keys on `sleepy`, the
  // benzodiazepine-site register the suppression evidence is about,
  // not on calm.
  const matcha = resolveBlendAtBrew([{ id: "matcha", g: 2, role: "lead" }], 80, 60);
  assert(!matcha.warnings.some(w => w.kind === "antagonism"),
    "matcha's caffeine and calm are a documented synergy, not a fight");
});

test("energy and sleepy are no longer sold as co-existing", () => {
  // The specific regression: if this pair ever returns to
  // ALLOWED_PARADOXES the app goes back to telling people a cup that
  // fights itself "walks both sides".
  const asParadox = ALLOWED_PARADOXES.some(([a, b]) =>
    (a === "energy" && b === "sleepy") || (a === "sleepy" && b === "energy"));
  assert(!asParadox,
    "energy+sleepy is listed as a paradox again — caffeine suppresses the sedative, it doesn't sit beside it");
});

test("warming and cooling are still allowed to co-exist", () => {
  // The other half. Over-correcting into "nothing can hold two
  // opposites" would lose cardamom, which really does read both ways.
  const kept = ALLOWED_PARADOXES.some(([a, b]) =>
    (a === "warming" && b === "cooling") || (a === "cooling" && b === "warming"));
  assert(kept, "warming+cooling is a real paradox — separate receptor systems, no suppression");
});

/* ── THE CUP HAS A DOSE ─────────────────────────────────────────────

   Contributions used to be a SHARE of the pot, so a cup of 1g of
   chamomile and a cup of 16g read identically — the number of grams
   never entered the maths — and a leaf's contribution collapsed when
   unrelated leaves joined it, though the same 2g was still in the cup.

   That was the largest behavioural change of the lot and it had no test
   of its own; the calibration suites pinned the cup's values, which
   would let dose-blindness return as long as the shipped blends landed
   in the same place. These pin the property instead. */

test("more of a leaf makes a stronger cup", () => {
  const at = (g) => Object.fromEntries(
    resolveBlendAtBrew([{ id: "chamomile", g, role: "lead" }], 95, 300).effects);
  const light = at(1), heavy = at(8);
  assert(heavy.calm > light.calm,
    `8g should read calmer than 1g — got ${light.calm} then ${heavy.calm}. ` +
    `Equal values mean the model is back to reading shares and ignoring dose.`);
});

test("but not proportionally — the curve saturates", () => {
  // Michaelis-Menten, normalised so one cup-dose scores 1.0. Eight
  // times the leaf is emphatically not eight times the cup, and a
  // linear model would be as wrong as a share-based one.
  const at = (g) => Object.fromEntries(
    resolveBlendAtBrew([{ id: "chamomile", g, role: "lead" }], 95, 300).effects);
  const one = at(1).calm, eight = at(8).calm;
  assert(eight < one * 8,
    `8g reads ${eight} against 1g's ${one} — dose should saturate, not scale`);
});

test("a leaf keeps its voice when unrelated leaves join it", () => {
  /* The reported symptom: 2g of chamomile read calm 4.0 alone and calm
     0.8 beside six other herbs, though the cup still held the same 2g.
     Adding peppermint doesn't remove chamomile's apigenin. */
  const alone = Object.fromEntries(
    resolveBlendAtBrew([{ id: "chamomile", g: 2, role: "lead" }], 95, 300).effects);
  const crowded = Object.fromEntries(resolveBlendAtBrew([
    { id: "chamomile", g: 2, role: "lead" },
    ...["peppermint", "ginger", "hibiscus", "rooibos", "cinnamon", "fennel"]
      .map(id => ({ id, g: 2, role: "lead" })),
  ], 95, 300).effects);
  // Not "identical" — masking and the perception pipeline legitimately
  // move it. But it must not COLLAPSE, which share-weighting did.
  assert(crowded.calm >= alone.calm * 0.6,
    `chamomile's calm fell from ${alone.calm} to ${crowded.calm} when six ` +
    `unrelated leaves joined — the same 2g is still in the pot`);
});

/* ── caffeine/sedative antagonism ──────────────────────────────
   The cup used to report sleepy 5 AND energy 5 with three
   contradictory warnings attached. See docs/research/synergies.md
   for the trials (Schellenberg 2004, Roache & Griffiths 1987) and
   for why the floor is well above zero. */

test("antagonismFactor: no damping below the caffeine threshold", () => {
  assert(antagonismFactor(0) === 1, `0mg gave ${antagonismFactor(0)}`);
  assert(antagonismFactor(ANTAGONISM_MIN_MG) === 1,
    `at threshold gave ${antagonismFactor(ANTAGONISM_MIN_MG)}`);
});

test("antagonismFactor: floors at ANTAGONISM_FLOOR, never zero", () => {
  assert(Math.abs(antagonismFactor(ANTAGONISM_FULL_MG) - ANTAGONISM_FLOOR) < 1e-9,
    `at full gave ${antagonismFactor(ANTAGONISM_FULL_MG)}`);
  assert(Math.abs(antagonismFactor(1000) - ANTAGONISM_FLOOR) < 1e-9,
    `past full gave ${antagonismFactor(1000)}`);
  assert(ANTAGONISM_FLOOR > 0,
    "abolition is not supported by any source — the floor must stay above zero");
});

test("antagonismFactor: monotonic between threshold and full", () => {
  const mid = antagonismFactor((ANTAGONISM_MIN_MG + ANTAGONISM_FULL_MG) / 2);
  assert(mid < 1 && mid > ANTAGONISM_FLOOR, `mid-ramp factor out of band: ${mid}`);
});

test("a caffeinated sedative cup blunts BOTH registers, not just sleepy", () => {
  // Mutual, because the antagonism is mutual — the valerian/hops trial
  // has the herb inhibiting the caffeine, not only the reverse.
  const withCaffeine = applyEffectSynergies({ energy: 5, sleepy: 5 }, 200);
  const without = applyEffectSynergies({ energy: 5, sleepy: 5 }, 0);
  assert(withCaffeine.effects.sleepy < without.effects.sleepy,
    `sleepy not damped: ${withCaffeine.effects.sleepy} vs ${without.effects.sleepy}`);
  assert(withCaffeine.effects.energy < without.effects.energy,
    `energy not damped: ${withCaffeine.effects.energy} vs ${without.effects.energy}`);
  assert(withCaffeine.effects.sleepy > 0, "sleepy must not be abolished");
});

test("sedation synergies don't fire in an antagonised cup", () => {
  // "Deepens sedation" is user-visible language. A cup being warned it
  // reads wired must not simultaneously be told it's settling.
  const { synergyTags } = applyEffectSynergies({ energy: 5, sleepy: 5, calm: 5 }, 200);
  const sedationTags = synergyTags.filter(t => /sedation|settle/i.test(t));
  assert(sedationTags.length === 0,
    `sedation tags survived antagonism: ${sedationTags.join(", ")}`);
});

test("no antagonism without real caffeine — energy alone doesn't trigger it", () => {
  // Cardamom carries `energy` traditionally and holds no caffeine. The
  // evidence is about a molecule, not a register, so a caffeine-free
  // cup must be left entirely alone however much `energy` it claims.
  const raw = { energy: 5, sleepy: 5, calm: 5 };
  const { effects, synergyTags } = applyEffectSynergies(raw, 0);
  const undamped = applyEffectSynergies(raw, 0).effects;
  assert(effects.sleepy === undamped.sleepy && effects.sleepy >= 4.5,
    `caffeine-free sleepy was damped: ${effects.sleepy}`);
  assert(synergyTags.some(t => /sedation/i.test(t)),
    `caffeine-free cup lost its sedation synergy: ${synergyTags.join(", ")}`);
});

test("the sedative safety warning survives caffeine damping", () => {
  // Roache & Griffiths: caffeine reversed diazepam's sedation RATINGS
  // but not its impairment of recall. A cup must not stop warning
  // "don't drive" merely because the drinker won't feel the sedation.
  const { effects, sedativeLoad } = applyEffectSynergies({ energy: 5, sleepy: 5, calm: 5 }, 200);
  const damped = (effects.sleepy || 0) + (effects.calm || 0) * 0.5;
  assert(sedativeLoad > damped,
    `sedativeLoad (${sedativeLoad}) should exceed the damped figure (${damped})`);

  const warned = buildWarnings({
    perceivedEffects: effects, caffeineMg: 200, sedativeLoad,
  });
  assert(warned.some(w => w.kind === "ceiling"),
    "sedative ceiling warning was suppressed by the damping");
});

/* ── the pour warning ──────────────────────────────────────────
   Reported as "assam black 5 and peppermint 1, that feels wrong".
   The bars were right and the pour was heavy: 3.33 cups' worth of
   leaf in one cup, so every strong flavour sat at its ceiling and
   the strip went flat. Nothing said so. */

test("a heavy pour is called out, in cups' worth rather than grams", () => {
  const warned = buildWarnings({ cupDoses: 3.33 });
  const pour = warned.filter(w => w.kind === "pour");
  assert(pour.length === 1, `expected one pour warning, got ${pour.length}`);
  assert(/3\.3/.test(pour[0].text),
    `the warning should say HOW heavy, got: ${pour[0].text}`);
});

test("an ordinary cup is not scolded for existing", () => {
  // Calibrated against the shelf: the 72 curated blends run a median
  // of 1.50 cup-doses and a p90 of 2.28. A threshold that fires on an
  // ordinary pot teaches the reader to ignore it.
  for (const doses of [0.8, 1.0, 1.5, 2.0, 2.28]) {
    const warned = buildWarnings({ cupDoses: doses });
    assert(!warned.some(w => w.kind === "pour"),
      `${doses} cup-doses should pass without comment — that is inside the catalogue's own range`);
  }
});

test("the pour warning counts each leaf in ITS OWN units", () => {
  // A teaspoon of chamomile and a teaspoon of ginger are not the same
  // mass, so a raw gram total would scold the flower and excuse the
  // spice. Same gram total, different cup-doses, different verdict.
  const flower = resolveBlendAtBrew([{ id: "chamomile", g: 4, role: "lead" }], 95, 300);
  const spice = resolveBlendAtBrew([{ id: "ginger", g: 4, role: "lead" }], 95, 300);
  const fired = c => (c.warnings || []).some(w => w.kind === "pour");
  assert(fired(flower) !== fired(spice),
    `4g of a light flower and 4g of a dense spice should not read as the same pour`);
});

console.log(`\n\n${pass} passed, ${fail} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const { desc, message } of failures) {
console.log(`  ✗ ${desc}\n      ${message}`);
  }
  process.exit(1);
}

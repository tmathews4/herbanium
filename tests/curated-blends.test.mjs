/* ──────────────────────────────────────────────────────────────
   tests/curated-blends.test.mjs

   Audit every curated blend (BLENDS, MOOD_BLENDS, PAIR_BLENDS) at
   its own default tempC/timeS and assert that no per-ingredient
   over-pull warning fires. The curator's chosen brew is treated
   as accepted compromise; the warning layer should respect that
   via the baselineTempC/baselineTimeS arguments to
   resolveBlendAtBrew.

   This catches two regressions:
     1. The baseline-suppression in compose.js getting accidentally
        removed or rewired so curated defaults start firing
        per-ingredient warnings out of the box.
     2. A new curated blend being added with an aggressive default
        and no awareness that the warning layer would silently allow
        it. (The audit will pass, but a developer can run this file
        with the AUDIT env var to see the full list.)

   Run: node tests/curated-blends.test.mjs
   Verbose audit: AUDIT=1 node tests/curated-blends.test.mjs
   ────────────────────────────────────────────────────────────── */

import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { BLENDS, MOOD_BLENDS, PAIR_BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const failures = [];
const audit = [];

function test(desc, fn) {
  try {
    fn();
    pass++;
    process.stdout.write(".");
  } catch (e) {
    fail++;
    failures.push({ desc, message: e.message });
    process.stdout.write("F");
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function gatherAll() {
  // MOOD_BLENDS / PAIR_BLENDS use tuple form by default but switch to
  // object form whenever an entry needs to carry a role tag. Normalize
  // on read so the audit doesn't have to care which it received.
  const normIngs = (raw) => raw.map(item =>
    Array.isArray(item) ? { id: item[0], g: item[1] } : { ...item }
  );
  const all = [];
  for (const b of BLENDS) {
    all.push({ label: "BLEND", name: b.name, ings: b.ingredients, t: b.tempC, s: b.timeS, style: b.style });
  }
  for (const [mood, b] of Object.entries(MOOD_BLENDS)) {
    all.push({
      label: `MOOD:${mood}`, name: `${mood} (single-mood)`,
      ings: normIngs(b.ings), t: b.temp, s: b.time, style: b.style,
    });
  }
  for (const [key, b] of Object.entries(PAIR_BLENDS)) {
    all.push({
      label: `PAIR:${key}`, name: b.name,
      ings: normIngs(b.ings), t: b.temp, s: b.time, style: b.style,
    });
  }
  return all;
}

function overPullWarnings(brew) {
  return brew.warnings.filter(w => /is being over-pulled/.test(w.text));
}

const blends = gatherAll();

console.log(`Curated blends — clean-default audit (${blends.length} blends)\n`);

function outsiderWarnings(brew) {
  return brew.warnings.filter(w => w.kind === "outsider");
}

for (const b of blends) {
  test(`${b.label} ${b.name} clean at default brew`, () => {
    const brew = resolveBlendAtBrew(b.ings, b.t, b.s, b.t, b.s, true);
    const overs = overPullWarnings(brew);
    const outs = outsiderWarnings(brew);
    const issues = [...overs, ...outs];
    assert(issues.length === 0,
      `${b.name} fires ${issues.length} warning(s) at its own default brew (${b.t}°C / ${b.s}s):\n        - ` +
      issues.map(o => o.text).join("\n        - "));
    assert(brew.outsiders.length === 0,
      `${b.name} still lists outsiders at curated baseline: ${brew.outsiders.join(", ")}`);
  });

  // Track which blends would over-pull or flag outsiders if the baseline
  // suppression were removed — surfaced under AUDIT=1 so a developer can
  // see how much load the suppression is carrying.
  if (process.env.AUDIT) {
    const naive = resolveBlendAtBrew(b.ings, b.t, b.s);
    const issues = [...overPullWarnings(naive), ...outsiderWarnings(naive)];
    if (issues.length > 0) audit.push({ ...b, overs: issues });
  }
}

// One sanity test: pushing harder than baseline still fires warnings.
// This guards against the suppression being too broad.
test("pushing past baseline still fires per-ingredient warnings", () => {
  const dusk = blends.find(b => b.name === "Dusk Lullaby");
  assert(dusk, "Dusk Lullaby fixture not found — test data drift");
  const pushed = resolveBlendAtBrew(dusk.ings, dusk.t, dusk.s + 60, dusk.t, dusk.s, true);
  const overs = overPullWarnings(pushed);
  assert(overs.length > 0,
    "expected over-pull warnings when steep is past baseline; got none — suppression is too broad");
});

// Outsider suppression is curated-only and exact-baseline-only:
// moving the slider away should restore the warning, and an
// algorithm-derived (non-curated) brew at baseline should still show it.
test("moving the slider off baseline restores the outsider warning", () => {
  const morning = blends.find(b => b.name === "Morning Vestment");
  assert(morning, "Morning Vestment fixture not found — test data drift");
  const moved = resolveBlendAtBrew(morning.ings, morning.t - 5, morning.s, morning.t, morning.s, true);
  const outs = moved.warnings.filter(w => w.kind === "outsider");
  assert(outs.length > 0,
    "expected outsider warning when slider is moved off curated baseline; got none");
});

test("non-curated (algorithm-derived) brew at baseline still flags outsiders", () => {
  const morning = blends.find(b => b.name === "Morning Vestment");
  assert(morning, "Morning Vestment fixture not found — test data drift");
  const algo = resolveBlendAtBrew(morning.ings, morning.t, morning.s, morning.t, morning.s, false);
  const outs = algo.warnings.filter(w => w.kind === "outsider");
  assert(outs.length > 0,
    "expected outsider warning for non-curated blend at baseline; got none — suppression leaked");
});

test("traditionNote fires when suppression actually carried weight", () => {
  const morning = blends.find(b => b.name === "Morning Vestment");
  const dusk = blends.find(b => b.name === "Dusk Lullaby");
  const morningBrew = resolveBlendAtBrew(morning.ings, morning.t, morning.s, morning.t, morning.s, true);
  const duskBrew = resolveBlendAtBrew(dusk.ings, dusk.t, dusk.s, dusk.t, dusk.s, true);
  assert(morningBrew.traditionNote === true,
    "Morning Vestment suppresses an outsider — traditionNote should be true");
  assert(duskBrew.traditionNote === true,
    "Dusk Lullaby suppresses two over-pull warnings — traditionNote should be true");
});

test("traditionNote stays off when nothing was suppressed", () => {
  // First Light — wait, that's in the audit. Pick a blend not in the audit.
  // Iterate blends and find one whose naive resolve already has zero
  // over-pull and zero outsiders — that one should never show traditionNote.
  const clean = blends.find(b => {
    const r = resolveBlendAtBrew(b.ings, b.t, b.s);
    const overs = r.warnings.filter(w => /is being over-pulled/.test(w.text));
    const outs = r.warnings.filter(w => w.kind === "outsider");
    return overs.length === 0 && outs.length === 0;
  });
  assert(clean, "no clean curated blend found — test data drift");
  const r = resolveBlendAtBrew(clean.ings, clean.t, clean.s, clean.t, clean.s, true);
  assert(r.traditionNote === false,
    `${clean.name} has nothing to suppress — traditionNote should be false`);
});

test("traditionNote stays off when slider is moved off baseline", () => {
  const morning = blends.find(b => b.name === "Morning Vestment");
  const moved = resolveBlendAtBrew(morning.ings, morning.t - 5, morning.s, morning.t, morning.s, true);
  assert(moved.traditionNote === false,
    "traditionNote should be false once the user moves off the curator's brew");
});

test("accent ingredients don't fire over-pull warnings", () => {
  // Pissenlit Café: dandelion-root lead, cinnamon/cardamom/vanilla all
  // accent. Push past baseline so warnings could fire — accents must
  // still stay quiet.
  const pissenlit = blends.find(b => b.name === "Pissenlit Café");
  assert(pissenlit, "Pissenlit Café fixture not found");
  const pushed = resolveBlendAtBrew(pissenlit.ings, pissenlit.t, pissenlit.s + 60, pissenlit.t, pissenlit.s, true);
  const accentWarnings = pushed.warnings.filter(w =>
    /Cinnamon|Cardamom|Vanilla/.test(w.text) && /over-pulled/.test(w.text)
  );
  assert(accentWarnings.length === 0,
    `accents should not fire over-pull warnings — got: ${accentWarnings.map(w => w.text).join("; ")}`);
});

test("accent ingredients don't fire outsider warnings", () => {
  // Mate Cooler: yerba-mate lead at 75°C/240s; lemongrass/spearmint/ginger
  // all accent. Move slider off baseline; only the yerba-mate (in range)
  // should be considered for outsiders.
  const cooler = blends.find(b => b.name === "Mate Cooler");
  assert(cooler, "Mate Cooler fixture not found");
  const moved = resolveBlendAtBrew(cooler.ings, cooler.t + 5, cooler.s, cooler.t, cooler.s, true);
  const outsiderNames = moved.warnings
    .filter(w => w.kind === "outsider")
    .map(w => w.text);
  const accentLeak = outsiderNames.filter(t =>
    /Lemongrass|Spearmint|Ginger/.test(t)
  );
  assert(accentLeak.length === 0,
    `accent ingredients should not appear in outsider warnings — got: ${accentLeak.join("; ")}`);
});

test("computeBrewProfile leadOnly excludes accents from the math", async () => {
  const { computeBrewProfile } = await import("../src/algo/compose.js");
  // Ground & Climb: matcha lead (70-80°C / 15-30s), reishi+ashwagandha accent.
  // Without leadOnly, accents drag the recommendation toward 100°C.
  // With leadOnly, the recommendation should match matcha's tight window.
  const climb = blends.find(b => b.name === "Ground & Climb");
  assert(climb, "Ground & Climb fixture not found");
  const naive = computeBrewProfile(climb.ings);
  const leadOnly = computeBrewProfile(climb.ings, { leadOnly: true });
  assert(leadOnly.tempC <= 80,
    `leadOnly should match matcha's <=80°C ceiling — got ${leadOnly.tempC}°C`);
  assert(naive.tempC > leadOnly.tempC,
    `naive recommendation should be hotter than leadOnly (accents pull it up) — naive ${naive.tempC}°C, leadOnly ${leadOnly.tempC}°C`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);

if (process.env.AUDIT) {
  console.log(`\n  ${audit.length}/${blends.length} blends would surface over-pull or outsider warnings at their own default if baseline suppression were removed:`);
  for (const a of audit) {
    console.log(`    [${a.label}] ${a.name} @ ${a.t}°C / ${a.s}s`);
    for (const o of a.overs) console.log(`        ! ${o.text}`);
  }
}

if (failures.length) {
  console.log("\n  Failures:");
  for (const f of failures) console.log(`    ✗ ${f.desc}\n        ${f.message}`);
  process.exit(1);
}
process.exit(0);

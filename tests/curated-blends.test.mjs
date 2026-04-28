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
  // All blend stores use object-form ingredients now [{ id, g, role? }].
  // `isTraditional` flag mirrors the runtime: a `tradition` field on the
  // blend marks it as a codified preparation that gets baseline
  // suppression. MOOD/PAIR blends are synthesized — never traditional.
  const all = [];
  for (const b of BLENDS) {
    all.push({
      label: "BLEND", name: b.name, ings: b.ingredients,
      t: b.tempC, s: b.timeS, style: b.style,
      isTraditional: !!b.tradition,
    });
  }
  for (const [mood, b] of Object.entries(MOOD_BLENDS)) {
    all.push({
      label: `MOOD:${mood}`, name: `${mood} (single-mood)`,
      ings: b.ings.map(i => ({ ...i })), t: b.temp, s: b.time, style: b.style,
      isTraditional: false,
    });
  }
  for (const [key, b] of Object.entries(PAIR_BLENDS)) {
    all.push({
      label: `PAIR:${key}`, name: b.name,
      ings: b.ings.map(i => ({ ...i })), t: b.temp, s: b.time, style: b.style,
      isTraditional: false,
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
// Cup-level tannin/aromatic only — per-ingredient over-pull warnings
// inherit kind: "tannin"/"aromatic" but carry the ingredient name in
// the text. Those are classified as overPullWarnings instead so the
// role-aware filter can distinguish lead from accent stretches.
function tanninWarnings(brew) {
  return brew.warnings.filter(w => w.kind === "tannin" && !/is being over-pulled/.test(w.text));
}
function aromaticWarnings(brew) {
  return brew.warnings.filter(w => w.kind === "aromatic" && !/is being over-pulled/.test(w.text));
}

// A warning is "strict" only if it concerns a lead-role ingredient.
// Accent stretches are deliberate by the curator and surface as
// honest information, not as a baseline failure.
function isLeadWarning(w) {
  return !w.role || w.role === "lead";
}
function isLeadOutsider(o) {
  return typeof o !== "object" || !o.role || o.role === "lead";
}

for (const b of blends) {
  test(`${b.label} ${b.name} clean at default brew`, () => {
    // Pass isTraditional through — traditionals get baseline suppression
    // for tannin/aromatic/outsider; experimentals do not. Accent
    // warnings can fire at baseline (the curator stretched the accent
    // on purpose); only LEAD warnings count toward "clean" here.
    const brew = resolveBlendAtBrew(b.ings, b.t, b.s, b.t, b.s, true, b.isTraditional);
    const overs = overPullWarnings(brew).filter(isLeadWarning);
    const outs = outsiderWarnings(brew).filter(isLeadWarning);
    const tans = tanninWarnings(brew);
    const aros = aromaticWarnings(brew);
    const issues = [...overs, ...outs, ...tans, ...aros];
    assert(issues.length === 0,
      `${b.name} (${b.isTraditional ? "tradition" : "custom"}) fires ${issues.length} lead-role warning(s) at its own default brew (${b.t}°C / ${b.s}s):\n        - ` +
      issues.map(o => `[${o.kind}] ${o.text}`).join("\n        - "));
    const leadOutsiderNames = brew.outsiders
      .filter(isLeadOutsider)
      .map(o => typeof o === "object" ? o.name : o);
    assert(leadOutsiderNames.length === 0,
      `${b.name} still lists lead outsiders at curated baseline: ${leadOutsiderNames.join(", ")}`);
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

// Strict pass: every CUSTOM (non-traditional) blend must be clean at
// its baseline *without* the suppression crutch. This is the rule the
// user imposed: experimentals must be tuned correctly, while
// traditionals get the suppression because the practice predates the
// modern recommendation.
for (const b of blends.filter(x => !x.isTraditional)) {
  test(`${b.label} ${b.name} clean at default brew WITHOUT suppression`, () => {
    // No baseline passed → no suppression even though the curator chose this brew.
    // Accent-role outsider/over-pull warnings are deliberate stretches
    // and don't fail this rule; only LEAD warnings count.
    const brew = resolveBlendAtBrew(b.ings, b.t, b.s);
    const overs = overPullWarnings(brew).filter(isLeadWarning);
    const outs = outsiderWarnings(brew).filter(isLeadWarning);
    const tans = tanninWarnings(brew);
    const aros = aromaticWarnings(brew);
    const issues = [...overs, ...outs, ...tans, ...aros];
    assert(issues.length === 0,
      `${b.name} (custom) is not naturally clean — retune the baseline:\n        - ` +
      issues.map(o => `[${o.kind}] ${o.text}`).join("\n        - "));
  });
}

// Traditionals: warnings re-fire when the slider moves away from
// baseline. Pick one with a tannin warning at baseline to verify.
test("traditional warnings re-fire when slider moves off baseline", () => {
  const wuyi = blends.find(b => b.name === "Wuyi Pine Smoke");
  assert(wuyi, "Wuyi Pine Smoke fixture not found");
  // At baseline, tannin/aromatic suppressed.
  const at = resolveBlendAtBrew(wuyi.ings, wuyi.t, wuyi.s, wuyi.t, wuyi.s, true, true);
  const atTans = at.warnings.filter(w => w.kind === "tannin" || w.kind === "aromatic");
  // Push 60s past baseline; suppression no longer applies.
  const past = resolveBlendAtBrew(wuyi.ings, wuyi.t, wuyi.s + 60, wuyi.t, wuyi.s, true, true);
  const pastTans = past.warnings.filter(w => w.kind === "tannin" || w.kind === "aromatic");
  assert(pastTans.length > atTans.length || past.warnings.length > at.warnings.length,
    "expected tannin/aromatic warnings to re-fire past baseline; suppression appears too broad");
});

// Sanity: pushing past baseline still fires warnings. Uses Spring
// Tonic (leads at 300-900s, curator at 1800s — already past, so any
// further push deepens the over-pull condition).
test("pushing past baseline still fires per-ingredient warnings", () => {
  const tonic = blends.find(b => b.name === "Spring Tonic");
  assert(tonic, "Spring Tonic fixture not found");
  const pushed = resolveBlendAtBrew(tonic.ings, tonic.t, tonic.s + 60, tonic.t, tonic.s, true);
  const overs = overPullWarnings(pushed);
  assert(overs.length > 0,
    "expected over-pull warnings when steep is past baseline; got none — suppression is too broad");
});

// Outsider suppression is curated-only and exact-baseline-only:
// moving the slider away should restore the warning. Wuyi Pine Smoke
// has a single lead (lapsang) with tempC [95,100] — moving down to
// 85°C should make lapsang an outsider.
test("moving the slider off baseline restores the outsider warning", () => {
  const wuyi = blends.find(b => b.name === "Wuyi Pine Smoke");
  assert(wuyi, "Wuyi Pine Smoke fixture not found");
  const moved = resolveBlendAtBrew(wuyi.ings, 85, wuyi.s, wuyi.t, wuyi.s, true);
  const outs = moved.warnings.filter(w => w.kind === "outsider");
  assert(outs.length > 0,
    "expected outsider warning when slider is moved off curated baseline; got none");
});

test("non-curated (algorithm-derived) brew with out-of-range lead flags outsiders", () => {
  // Same Wuyi Pine Smoke leaf, brewed at 85°C without curated flag —
  // the suppression doesn't apply, so the outsider should fire.
  const wuyi = blends.find(b => b.name === "Wuyi Pine Smoke");
  assert(wuyi, "Wuyi Pine Smoke fixture not found");
  const algo = resolveBlendAtBrew(wuyi.ings, 85, wuyi.s);
  const outs = algo.warnings.filter(w => w.kind === "outsider");
  assert(outs.length > 0,
    "expected outsider warning for non-curated brew with lead out of range");
});

test("traditionNote stays off when nothing was suppressed", () => {
  // Find a clean blend (no naive over-pull or outsider) — its
  // traditionNote should be false at baseline.
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

test("accent ingredients DO fire over-pull warnings, tagged with role:accent", () => {
  // Policy: accents are intentional stretches by the curator — they
  // surface as honest information so the user sees what's being
  // pushed past its window. The role tag lets the UI render leads
  // more prominently.
  const pissenlit = blends.find(b => b.name === "Pissenlit Café");
  assert(pissenlit, "Pissenlit Café fixture not found");
  const pushed = resolveBlendAtBrew(pissenlit.ings, pissenlit.t, pissenlit.s + 60, pissenlit.t, pissenlit.s, true);
  const accentWarnings = pushed.warnings.filter(w =>
    /Cinnamon|Cardamom|Vanilla/.test(w.text) && /over-pulled/.test(w.text)
  );
  // At least one of those accents should be visible in warnings now.
  assert(accentWarnings.length > 0,
    `expected accent over-pull warnings to surface; got none`);
  // Each must be tagged with role:"accent" so the UI/test layer can
  // distinguish it from a lead-role warning.
  for (const w of accentWarnings) {
    assert(w.role === "accent",
      `expected accent warning to carry role:"accent"; got role:"${w.role}" on "${w.text}"`);
  }
});

test("accent ingredients DO appear in outsider warnings, tagged with role:accent", () => {
  // Use Apfeltee — has cloves accent that still uses the legacy
  // single-window model. Pushing timeS down to 240s puts cloves
  // (envelope [300, 420]s) below its floor, firing the legacy
  // outsider warning that the test is asserting.
  const hk = blends.find(b => b.name === "Apfeltee");
  assert(hk, "Apfeltee fixture not found");
  const moved = resolveBlendAtBrew(hk.ings, hk.t, 240, hk.t, hk.s, true);
  const accentOutsiders = moved.warnings
    .filter(w => w.kind === "outsider")
    .filter(w => /Cloves/.test(w.text));
  assert(accentOutsiders.length > 0,
    `expected accent outsider warnings to surface; got none`);
  // The outsider records on brew.outsiders should also be role-tagged.
  const accentOutsiderRecords = moved.outsiders.filter(o =>
    typeof o === "object" && /Cloves/i.test(o.name)
  );
  for (const o of accentOutsiderRecords) {
    assert(o.role === "accent",
      `expected outsider record to carry role:"accent"; got role:"${o.role}" on ${o.name}`);
  }
});

test("traditionNote stays off when lead deviation is only sub-tolerance time", async () => {
  // Masala Chai: assam lead, brewed at 100°C/300s. Assam's time range
  // is 180-300s — curator sits exactly on the max, well within tolerance.
  // Spices are accent. There's no meaningful deviation worth surfacing.
  const chai = blends.find(b => b.name === "Masala Chai");
  assert(chai, "Masala Chai fixture not found");
  const r = resolveBlendAtBrew(chai.ings, chai.t, chai.s, chai.t, chai.s, true);
  assert(r.traditionNote === false,
    "traditionNote should not fire — leads are in range and accents shouldn't trigger it");
});

test("traditionNote fires when a lead is past time tolerance by a clear margin", async () => {
  // Spring Tonic: leads (nettle, dandelion-leaf) want 300-900s timeS;
  // curator brews 1800s — 900s past max, well past tolerance.
  const tonic = blends.find(b => b.name === "Spring Tonic");
  assert(tonic, "Spring Tonic fixture not found");
  const r = resolveBlendAtBrew(tonic.ings, tonic.t, tonic.s, tonic.t, tonic.s, true);
  assert(r.traditionNote === true,
    "traditionNote should fire when a lead is hundreds of seconds past its timeS max");
});

test("computeBrewProfile leadOnly excludes accents from the math", async () => {
  const { computeBrewProfile } = await import("../src/algo/compose.js");
  // Tom Foolery: gunpowder lead (80-90°C / 90-180s); spearmint and
  // tulsi accent (95-100°C / 300-420s). Without leadOnly, the accents
  // drag the recommendation toward higher temps and longer times.
  // With leadOnly, the recommendation tracks the gunpowder window.
  const tf = blends.find(b => b.name === "Tom Foolery");
  assert(tf, "Tom Foolery fixture not found");
  const naive = computeBrewProfile(tf.ings);
  const leadOnly = computeBrewProfile(tf.ings, { leadOnly: true });
  assert(leadOnly.tempC <= 90,
    `leadOnly should respect gunpowder's ≤90°C ceiling — got ${leadOnly.tempC}°C`);
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

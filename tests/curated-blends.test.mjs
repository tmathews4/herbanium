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
    // `recipeStretch` entries are excluded: a traditional recipe that
    // already brews a leaf past its own window isn't a fault at its own
    // baseline, it's the style. Those now surface as `tradition`
    // character notes rather than being suppressed entirely, so they
    // appear in `outsiders` where they used to be stripped. The
    // assertion still means what it meant — nothing at a curated
    // default should read as the drinker's mistake.
    const leadOutsiderNames = brew.outsiders
      .filter(o => !(o && typeof o === "object" && o.recipeStretch))
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

/* WHERE A RECIPE BREWS PAST ITS OWN RECOMMENDATION — recorded, not
   failed.

   This used to demand that every custom blend be clean at its default
   brew with the baseline suppression stripped away, on the rule that
   experimentals must be tuned correctly and only traditionals get to
   sit past the modern recommendation. That rule was too narrow. A
   premade recipe is a curator's choice, and sometimes the over-draw
   IS the recipe: `calm` steeps a minute longer than the algorithm
   picks because a minute longer is what that cup wants. Calling it a
   defect meant the suite kept arguing with a decision.

   What still matters is that nobody drifts into it by accident. So
   the set is pinned and checked BOTH WAYS, the same shape as the
   research-drift audits: a blend that starts brewing past its
   recommendation shows up because it isn't in the list, and one that
   stops shows up because it is. Either way the change is deliberate
   and visible, which is the only property the old rule was really
   protecting.

   The reasons are the part worth writing, and they're the curator's
   to write — an entry here says "this is a decision", not "this is
   fine". Filling in `why` as each one gets documented turns the list
   from a record into an explanation; per the project's own rule about
   brewIntent, an exemption reads as "not yet fixed" and these aren't.

   Measured against the ALGORITHM's recommendation for the same
   leaves, with no baseline passed, so what's recorded is genuinely
   "steeped harder than this app would advise" and not an artefact of
   which brew we handed in. */
const DELIBERATE_OVERDRAW = new Map([
  /* EMPTY, AND THAT IS THE FINDING.

     Nine non-traditional blends used to brew past their own
     recommendation. They read as curator's choices — "sometimes the
     over-draw is the point" — until the trades were measured: four
     bought almost nothing at all (Quiet Apple spent 2°C to move no
     effect by more than 0.1), and the rest turned out to be generated
     defaults from an earlier pass rather than decisions anybody made.
     So they were retuned to the engine's own numbers.

     Traditionals are NOT held to this. A codified preparation brewing
     past what modern analysis calls optimal is the practice, not a
     defect — chai boils the tea — and they carry the tradition note
     that says so. This list is for non-traditionals only, which is why
     it can be empty and stay meaningful.

     Add an entry when a recipe should brew past its recommendation on
     purpose, with the reason. An empty map is not a dormant feature:
     both tests below still run, and the first one fails the moment
     anything starts over-drawing unannounced. */
]);

test("no recipe brews past its own recommendation without it being recorded", () => {
  const unlisted = [];
  for (const b of blends.filter(x => !x.isTraditional)) {
    const brew = resolveBlendAtBrew(b.ings, b.t, b.s);
    const issues = [
      ...overPullWarnings(brew).filter(isLeadWarning),
      ...outsiderWarnings(brew).filter(isLeadWarning),
      ...tanninWarnings(brew),
      ...aromaticWarnings(brew),
    ];
    if (issues.length && !DELIBERATE_OVERDRAW.has(b.name)) {
      unlisted.push(`${b.name} — ${issues.map(o => `[${o.kind}] ${o.text}`).join(" ")}`);
    }
  }
  assert(unlisted.length === 0,
    `${unlisted.length} blend(s) now brew past their recommendation and nobody said so.\n` +
    `        Either retune the brew, or add it to DELIBERATE_OVERDRAW with the reason:\n        - ` +
    unlisted.join("\n        - "));
});

test("nothing sits in the over-draw list that no longer over-draws", () => {
  // The other direction. A stale entry quietly grants an exemption to
  // a blend that stopped needing one, which is how a list like this
  // rots into a place bugs go to be forgiven.
  const stale = [];
  for (const [name] of DELIBERATE_OVERDRAW) {
    const b = blends.find(x => x.name === name);
    if (!b) { stale.push(`${name} — no such blend any more`); continue; }
    const brew = resolveBlendAtBrew(b.ings, b.t, b.s);
    const issues = [
      ...overPullWarnings(brew).filter(isLeadWarning),
      ...outsiderWarnings(brew).filter(isLeadWarning),
      ...tanninWarnings(brew),
      ...aromaticWarnings(brew),
    ];
    if (!issues.length) stale.push(`${name} — brews clean now, drop it from the list`);
  }
  assert(stale.length === 0, `stale over-draw entries:\n        - ${stale.join("\n        - ")}`);
});

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

// Out-of-zone signals replace legacy outsider warnings now that
// every non-catalyst ingredient is zone-covered. Cranberry Hearth's
// cranberry lead resolves to its `under` tempZone band when slider
// drops to 80°C; the contribution carries severity:"yellow" and
// state:"in-zones" with tempZone.id === "under".
test("moving the slider off baseline drops a lead into the under band", () => {
  const ch = blends.find(b => b.name === "Cranberry Hearth");
  assert(ch, "Cranberry Hearth fixture not found");
  const moved = resolveBlendAtBrew(ch.ings, 80, ch.s, ch.t, ch.s, true);
  const cranberry = (moved.perIngredient || []).find(p => p.id === "cranberry");
  assert(cranberry, "expected cranberry contribution in perIngredient");
  assert(cranberry.tempZone && cranberry.tempZone.id === "under",
    `expected cranberry tempZone to be "under" at 80°C; got ${cranberry.tempZone?.id}`);
  assert(cranberry.severity === "yellow",
    `expected cranberry severity yellow when drifting; got ${cranberry.severity}`);
});

test("non-curated brew with out-of-zone lead surfaces drift severity", () => {
  // Same Cranberry Hearth, brewed at 80°C without curated flag.
  const ch = blends.find(b => b.name === "Cranberry Hearth");
  assert(ch, "Cranberry Hearth fixture not found");
  const algo = resolveBlendAtBrew(ch.ings, 80, ch.s);
  const cranberry = (algo.perIngredient || []).find(p => p.id === "cranberry");
  assert(cranberry, "expected cranberry contribution");
  assert(cranberry.severity === "yellow" || cranberry.severity === "red",
    `expected drift severity (yellow/red) for out-of-zone lead; got ${cranberry.severity}`);
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

test("accent ingredients carry role:accent on their contribution record", () => {
  // Now that every non-catalyst ingredient is zone-covered, the
  // legacy outsider warnings have been replaced by zone-state
  // signals. Confirm accents still tag through the contribution
  // record (used by the blend-summary card and warning UI).
  const hk = blends.find(b => b.name === "Apfeltee");
  assert(hk, "Apfeltee fixture not found");
  const at = resolveBlendAtBrew(hk.ings, hk.t, hk.s, hk.t, hk.s, true);
  const orangePeel = (at.perIngredient || []).find(p => p.id === "orange-peel");
  assert(orangePeel, "expected orange-peel contribution in perIngredient");
  assert(orangePeel.role === "accent",
    `expected orange-peel role:"accent"; got "${orangePeel.role}"`);
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

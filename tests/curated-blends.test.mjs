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
  const all = [];
  for (const b of BLENDS) {
    all.push({ label: "BLEND", name: b.name, ings: b.ingredients, t: b.tempC, s: b.timeS });
  }
  for (const [mood, b] of Object.entries(MOOD_BLENDS)) {
    all.push({
      label: `MOOD:${mood}`, name: `${mood} (single-mood)`,
      ings: b.ings.map(([id, g]) => ({ id, g })), t: b.temp, s: b.time,
    });
  }
  for (const [key, b] of Object.entries(PAIR_BLENDS)) {
    all.push({
      label: `PAIR:${key}`, name: b.name,
      ings: b.ings.map(([id, g]) => ({ id, g })), t: b.temp, s: b.time,
    });
  }
  return all;
}

function overPullWarnings(brew) {
  return brew.warnings.filter(w => /is being over-pulled/.test(w.text));
}

const blends = gatherAll();

console.log(`Curated blends — clean-default audit (${blends.length} blends)\n`);

for (const b of blends) {
  test(`${b.label} ${b.name} clean at default brew`, () => {
    const brew = resolveBlendAtBrew(b.ings, b.t, b.s, b.t, b.s);
    const overs = overPullWarnings(brew);
    assert(overs.length === 0,
      `${b.name} fires ${overs.length} over-pull warning(s) at its own default brew (${b.t}°C / ${b.s}s):\n        - ` +
      overs.map(o => o.text).join("\n        - "));
  });

  // Track which blends would over-pull if the baseline suppression were
  // removed — surfaced under AUDIT=1 so a developer can see how much load
  // option 2's suppression is carrying.
  if (process.env.AUDIT) {
    const naive = resolveBlendAtBrew(b.ings, b.t, b.s);
    const overs = overPullWarnings(naive);
    if (overs.length > 0) audit.push({ ...b, overs });
  }
}

// One sanity test: pushing harder than baseline still fires warnings.
// This guards against the suppression being too broad.
test("pushing past baseline still fires per-ingredient warnings", () => {
  const dusk = blends.find(b => b.name === "Dusk Lullaby");
  assert(dusk, "Dusk Lullaby fixture not found — test data drift");
  const pushed = resolveBlendAtBrew(dusk.ings, dusk.t, dusk.s + 60, dusk.t, dusk.s);
  const overs = overPullWarnings(pushed);
  assert(overs.length > 0,
    "expected over-pull warnings when steep is past baseline; got none — suppression is too broad");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);

if (process.env.AUDIT) {
  console.log(`\n  ${audit.length}/${blends.length} blends would over-pull at their own default if baseline suppression were removed:`);
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

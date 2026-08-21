/* ──────────────────────────────────────────────────────────────
   tests/window-conflict.test.mjs

   WHEN TWO LEAVES CANNOT SHARE A CUP, AND THE APP SAYING SO.

   Chamomile closes at 420s. Lion's Mane opens at 600s. There is no
   steep that serves both, so whatever the slider lands on, one of
   them is wrong. It is the most teachable state the model can reach
   — the concrete case where "different plants give up different
   compounds at different rates" stops being a sentence and costs you
   something — and the app rendered it as absence.

   Three separate silences, all found from one composed blend:

   1. `recommendedBand` returns null on the time axis, so the rail
      paints nothing and the word says nothing. Its own comment read
      "no band. Nothing useful to show."
   2. The warnings layer had no UNDER-steep kind at all. Every
      per-ingredient warning filtered to tannin / aromatic and said
      "is being over-pulled". brewBounds names this out loud where it
      explains the opening clamp: "over-pulling warns while
      under-steeping is silent" — the clamp was built to route AROUND
      the missing warning, so the default steered into the one failure
      mode the app could not describe.
   3. The no-overlap notice already existed, well written, and was
      UNREACHABLE. It gated on two or more LEADS, and ComposeScreen
      marks a lead as `maxParts > 1 && ratioFor(id) === maxParts` —
      first ingredient in takes 2 parts, everything after takes 1 — so
      a composed blend has exactly one lead and the notice returned
      null before reading anything.

   The cup was not even quiet: it fired pour, masking and ceiling
   warnings on the 7:00 brew and mentioned none of this. Three
   confident warnings and no fourth reads as "checked, and it's fine",
   which is why it was reported as a broken slider rather than a bad
   blend.

   Run: node tests/window-conflict.test.mjs
   ────────────────────────────────────────────────────────────── */

import { windowConflict } from "../src/algo/brewBounds.js";
import {
  computeBrewProfile, resolveBlendAtBrew, materialIngredients, MATERIAL_SHARE,
} from "../src/algo/compose.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Window conflict — when no steep serves both leaves\n");

const withMeta = (id, role, g) => ({
  id, role, g,
  name: INGREDIENTS[id].name,
  tempC: INGREDIENTS[id].tempC,
  timeS: INGREDIENTS[id].timeS,
});
// The blend exactly as the composer builds it: first ingredient added
// takes 2 parts and becomes the lead, the second takes 1 and is an
// accent. This shape is the point — see silence 3 above.
const COMPOSED = [withMeta("chamomile", "lead", 2), withMeta("lions-mane", "accent", 1)];

/* ── the primitive ───────────────────────────────────────────── */

test("names the two leaves and the gap between their windows", () => {
  const c = windowConflict(COMPOSED, "timeS");
  assert(c, "chamomile 240-420 and lion's mane 600-1800 do not meet, so this must report");
  assert(c.closesFirst.id === "chamomile", `earliest to close should be chamomile, got ${c.closesFirst.id}`);
  assert(c.opensLast.id === "lions-mane", `latest to open should be lion's mane, got ${c.opensLast.id}`);
  assert(c.gap === 180, `gap should be 600-420=180s, got ${c.gap}`);
});

test("stays quiet whenever the windows do meet", () => {
  assert(windowConflict(COMPOSED, "tempC") === null,
    "both leaves brew at 95-100C, so the temperature axis has no conflict to report");
  const fine = [withMeta("chamomile", "lead", 2), withMeta("peppermint", "accent", 1)];
  assert(windowConflict(fine, "timeS") === null, "chamomile and peppermint overlap; nothing to say");
});

test("one leaf cannot conflict with itself", () => {
  assert(windowConflict([withMeta("chamomile", "lead", 2)], "timeS") === null,
    "a single ingredient closes first AND opens last; that is not a conflict");
});

test("a catalyst's window never creates a conflict", () => {
  // A trace dose carries no signal, which is why every other check
  // skips it too. Without the skip a pinch of something long-steeping
  // would make every blend it seasons look impossible.
  const withPinch = [...COMPOSED.slice(0, 1), withMeta("lions-mane", "catalyst", 0.05)];
  assert(windowConflict(withPinch, "timeS") === null, "a catalyst must not fabricate a conflict");
});

/* ── what counts as a component ──────────────────────────────── */

test("role does not separate a partner from a seasoning; weight does", () => {
  // Both are "accent" to the composer. Only one is actually in the cup.
  const partner = materialIngredients(COMPOSED);
  assert(partner.length === 2, `lion's mane at 33% of the cup is a component, got ${partner.length} of 2`);

  const chai = BLENDS.find(b => b.name === "Vanilla Chai");
  assert(chai, "Vanilla Chai should still exist in the catalogue");
  const material = materialIngredients(chai.ingredients).map(i => i.id);
  assert(!material.includes("vanilla"),
    "0.2g of vanilla is seasoning, not an under-steeped component — it must not be named");
});

test("the threshold sits clear of both sides it separates", () => {
  // 9.5% is the loudest seasoning in the catalogue, 33.3% the case
  // these warnings exist for. A threshold that drifts into either is
  // the bug returning, so it is asserted rather than trusted.
  assert(MATERIAL_SHARE > 0.10 && MATERIAL_SHARE < 0.30,
    `MATERIAL_SHARE of ${MATERIAL_SHARE} no longer sits between the seasoning it excludes `
    + `(9.5% max, measured across the catalogue) and the partner it must keep (33.3%)`);
});

/* ── the warning that was missing ────────────────────────────── */

test("a leaf short of its window is named at the cup the app opens on", () => {
  const ings = COMPOSED.map(({ id, role, g }) => ({ id, role, g }));
  const p = computeBrewProfile(ings);
  assert(p.timeS === 420, `the opening cup should clamp to chamomile's ceiling, got ${p.timeS}s`);
  const r = resolveBlendAtBrew(ings, p.tempC, p.timeS, p.tempC, p.timeS);
  const u = r.warnings.filter(w => w.kind === "understeep");
  assert(u.length === 1, `lion's mane gets 70% of its minimum steep here and must be named, got ${u.length}`);
  assert(/Lion's Mane/.test(u[0].text), `the warning must name the leaf: ${u[0].text}`);
});

test("it fires AT the baseline, where over-pull warnings are suppressed", () => {
  /* The suppressor for an over-pull is `pushedHarder` — at or below
     the recommendation, a strong cup is accepted compromise. Under-
     steeping is the opposite direction: it is at its worst AT the
     baseline, because the baseline is what clamped short. Gating it
     the same way would silence it exactly where it is most deserved,
     which is why it is a separate list. */
  const ings = COMPOSED.map(({ id, role, g }) => ({ id, role, g }));
  const p = computeBrewProfile(ings);
  const atBaseline = resolveBlendAtBrew(ings, p.tempC, p.timeS, p.tempC, p.timeS);
  assert(atBaseline.warnings.some(w => w.kind === "understeep"),
    "the under-steep warning must survive baseline suppression");
});

test("it clears once the cup is steeped long enough", () => {
  const ings = COMPOSED.map(({ id, role, g }) => ({ id, role, g }));
  const long = resolveBlendAtBrew(ings, 97, 600, 97, 420);
  assert(!long.warnings.some(w => w.kind === "understeep"),
    "at 600s lion's mane is inside its window and nothing should be named");
});

test("no curated blend fires it", () => {
  /* A warning that fires on shipped recipes is noise, and this one
     started as noise: before the weight rule it named vanilla in two
     curated cups. The catalogue is the regression surface. */
  const noisy = [];
  for (const b of BLENDS) {
    if (!b.ingredients?.length || b.timeS == null) continue;
    const r = resolveBlendAtBrew(b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, !!b.traditional);
    for (const w of r.warnings) if (w.kind === "understeep") noisy.push(`${b.name}: ${w.text}`);
  }
  assert(noisy.length === 0, `curated blends should brew clean:\n    ${noisy.join("\n    ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

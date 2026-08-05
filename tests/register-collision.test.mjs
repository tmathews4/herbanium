/* ──────────────────────────────────────────────────────────────
   tests/register-collision.test.mjs

   The flavour strip and the palate strip are different claims, and
   the app draws them one above the other. So no word may name a
   family on one and an axis on the other — a reader has no way to
   tell two identical labels apart, and the app teaches by pointing.

   THE CASE THIS EXISTS FOR. `sweet` was a flavour family AND
   `sweetness` a palate axis, both computed from the same four
   tokens (BALANCE_AXES in algo/compose.js re-sums sweet, honey,
   honeyed, honey-sweet). 76 of 87 sweet-bearing profile rows drew
   both bars off the same word. docs/vocabulary.md carried both
   senses under one token and resolved it with "context clarifies",
   which held right up until both bars were on screen together.

   The app had already solved this shape once and only halfway:
   EXCLUDED_FROM_FLAVOR in FlavorMap.jsx strips bitter, astringent
   and menthol from the flavour strip because otherwise "the user
   sees the same note twice" — with sweet and tart as deliberate
   exceptions. This guard covers the exceptions.

   WHAT'S CHECKED, and what deliberately isn't: the LABELS must not
   collide. The underlying tokens still legitimately feed both — a
   cup's sweetness is computed from its sweet-ish flavours, which is
   the model working. Only the words the user reads have to differ.

   Run: node tests/register-collision.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { FAMILY_BY_FLAVOR, FLAVOR_FAMILY_LABEL, MOOD_FAMILY_LABEL } from "../src/data/families.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Register collisions — no word means two things on two strips\n");

// The palate axes, read from the algorithm rather than restated here.
// A copy would drift the moment an axis is added, and drift is the
// whole failure mode this file guards.
const composeSrc = readFileSync(resolve(__dirname, "../src/algo/compose.js"), "utf8");
const axesBlock = composeSrc.match(/const BALANCE_AXES = \[([\s\S]*?)\];/);
const PALATE_AXES = [...(axesBlock?.[1] || "").matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

// What a family bar actually says, key or override.
const shownFamilies = [...new Set(Object.values(FAMILY_BY_FLAVOR))]
  .map(f => FLAVOR_FAMILY_LABEL[f] || f);

test("the palate axes were found in the algorithm", () => {
  assert(PALATE_AXES.length >= 4,
    `parsed ${PALATE_AXES.length} axes from BALANCE_AXES — the regex has drifted`);
  assert(PALATE_AXES.includes("sweetness"), `no sweetness axis: ${JSON.stringify(PALATE_AXES)}`);
});

test("no flavour family is displayed under a palate axis's name", () => {
  const axes = new Set(PALATE_AXES);
  const clash = shownFamilies.filter(l => axes.has(l));
  assert(clash.length === 0,
    `these read identically on the flavour and palate strips: ${clash.join(", ")}`);
});

test("no flavour family label merely adds -ness to a palate axis, or vice versa", () => {
  // The near-miss, which is the form the original bug took: `sweet`
  // against `sweetness` never collided as strings, and read as the same
  // word to every user who saw them stacked.
  const norm = (s) => s.toLowerCase().replace(/(ness|y|ed)$/, "");
  const axes = new Map(PALATE_AXES.map(a => [norm(a), a]));
  const clash = shownFamilies
    .filter(l => axes.has(norm(l)))
    .map(l => `"${l}" vs palate "${axes.get(norm(l))}"`);
  assert(clash.length === 0,
    `too close to tell apart on adjacent strips: ${clash.join("; ")}`);
});

test("the sweet family is relabelled away from the palate axis", () => {
  // The specific decision, pinned so it can't be quietly reverted by
  // someone tidying the label map.
  assert(FLAVOR_FAMILY_LABEL.sweet === "sweet aroma",
    `expected the sweet family to read "sweet aroma", got ${JSON.stringify(FLAVOR_FAMILY_LABEL.sweet)}`);
});

test("every relabelled family is a real family", () => {
  const families = new Set(Object.values(FAMILY_BY_FLAVOR));
  for (const key of Object.keys(FLAVOR_FAMILY_LABEL)) {
    assert(families.has(key),
      `FLAVOR_FAMILY_LABEL relabels "${key}", which no flavour maps to — dead entry`);
  }
});

test("mood families don't collide with palate axes either", () => {
  // Same rule, other strip. `cooling` the mood and `menthol` the
  // mouthfeel already got separated once for exactly this reason.
  const axes = new Set(PALATE_AXES);
  const clash = Object.values(MOOD_FAMILY_LABEL || {}).filter(l => axes.has(l));
  assert(clash.length === 0,
    `mood families reading as palate axes: ${clash.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

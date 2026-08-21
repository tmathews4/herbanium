/* ──────────────────────────────────────────────────────────────
   tests/caffeine-display.test.mjs — one milligram figure per cup.

   `meta.caffeine` is transcribed from each research doc's "caffeine
   (mg per ~8oz cup)" row. It is per CUP-DOSE of that leaf, not per
   gram, and the trap is that multiplying by grams instead produces a
   number that looks entirely reasonable.

   compose.js hit that trap once and fixed it, with the reasoning
   written down beside the reducer. The fix stayed inside the engine.
   The two places that print milligrams on a RECIPE rather than on a
   brew — BlendDetail's "caffeinated" tag and the recipe row's
   `caf ~Xmg` badge — kept their own copies of the old formula, so the
   same page said 120mg at the top and 60mg in its caffeine gauge.
   Reported exactly that way.

   Measured before the fix: 23 blends showed a figure and every one was
   high by its leaves' cup-dose — x2.0 through the true teas, x1.2 for
   yerba mate.

   So what is held here is that the conversion has ONE home and the
   printed figure matches the sourced one.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { nominalCaffeineMg, cupDosesFor } from "../src/algo/caffeine.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { BLENDS } from "../src/data/blends.js";
import { TSP_BY_CATEGORY } from "../src/units/units.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

test("one cup-dose of a leaf yields exactly its documented figure", () => {
  /* The claim the docs make, stated as the app must render it. Any
     drift in the conversion moves these away from the sourced number
     in whichever direction the mistake goes. */
  const caffeinated = Object.entries(INGREDIENTS).filter(([, m]) => m.caffeine > 0);
  assert(caffeinated.length > 0, "no caffeinated ingredients found at all");

  for (const [id, meta] of caffeinated) {
    const oneDose = TSP_BY_CATEGORY[meta.category] || 1.5;
    const mg = nominalCaffeineMg([{ id, g: oneDose }]);
    assert(Math.abs(mg - meta.caffeine) < 0.001,
      `one cup-dose of ${id} (${oneDose}g) reads ${mg.toFixed(1)}mg, but its ` +
      `doc says ${meta.caffeine}mg per cup`);
  }
});

test("and grams scale it linearly from there", () => {
  const [id, meta] = Object.entries(INGREDIENTS).find(([, m]) => m.caffeine > 0);
  const oneDose = TSP_BY_CATEGORY[meta.category] || 1.5;
  const single = nominalCaffeineMg([{ id, g: oneDose }]);
  const double = nominalCaffeineMg([{ id, g: oneDose * 2 }]);
  assert(Math.abs(double - single * 2) < 0.001,
    `two doses of ${id} read ${double.toFixed(1)}mg against ${single.toFixed(1)} for one`);
  assert(cupDosesFor(oneDose, meta.category) === 1,
    "cupDosesFor disagrees with TSP_BY_CATEGORY about what one dose is");
});

test("no shipped blend reads as a multiple of its true load", () => {
  /* The specific defect: mg-per-cup times grams. For every caffeinated
     blend, check the figure is NOT the old formula's answer — which is
     the same number only where a leaf's cup dose is exactly 1g. */
  const suspects = [];
  for (const b of BLENDS) {
    const shown = nominalCaffeineMg(b.ingredients);
    if (shown <= 0) continue;
    const byGrams = (b.ingredients || []).reduce((sum, ing) => {
      const meta = INGREDIENTS[ing.id];
      return sum + (meta?.caffeine || 0) * (ing.g || 0);
    }, 0);
    // Where every caffeinated leaf happens to have a 1g dose the two
    // formulas agree and there is nothing to tell apart.
    const distinguishable = (b.ingredients || []).some(ing => {
      const meta = INGREDIENTS[ing.id];
      return meta?.caffeine > 0 && (TSP_BY_CATEGORY[meta.category] || 1.5) !== 1;
    });
    if (distinguishable && Math.abs(shown - byGrams) < 0.001) {
      suspects.push(`${b.name}: ${shown.toFixed(0)}mg is the grams formula's answer`);
    }
  }
  assert(suspects.length === 0, suspects.join("; "));
});

test("nothing outside algo/caffeine.js multiplies caffeine by grams", () => {
  /* The two display sites drifted because each had its own reducer.
     A third would drift the same way and nothing above would catch it
     — these tests read the helper, not the screens. */
  const SRC = new URL("../src/", import.meta.url).pathname;
  const walk = (dir) => readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full)
      : (/\.jsx?$/.test(name) ? [full] : []);
  });

  const offenders = [];
  for (const file of walk(SRC)) {
    if (file.endsWith("algo/caffeine.js")) continue;
    const src = readFileSync(file, "utf8");
    // `x.caffeine * (something.g` — the shape of the old formula, in
    // either order.
    const bad = /\.caffeine\s*(?:\|\|\s*0\s*\))?\s*\*\s*\(?[A-Za-z_$][\w$]*\.g\b/;
    const rev = /\b[A-Za-z_$][\w$]*\.g\s*(?:\|\|\s*0\s*\))?\s*\*\s*[A-Za-z_$][\w$]*\.caffeine\b/;
    for (const [i, line] of src.split("\n").entries()) {
      if (bad.test(line) || rev.test(line)) {
        offenders.push(`${file.slice(SRC.length)}:${i + 1}`);
      }
    }
  }
  assert(offenders.length === 0,
    `these multiply a per-cup-dose figure by grams instead of calling ` +
    `nominalCaffeineMg:\n    ${offenders.join("\n    ")}`);
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

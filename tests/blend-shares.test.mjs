/* tests/blend-shares.test.mjs — the starting parts still match the shelf.
 *
 * `src/data/blendShares.js` ships a default number of parts per leaf, and
 * 24 of those are DERIVED from the median share the curated blends give
 * that ingredient. Derived values go stale the moment a curated blend is
 * added or retuned, and they go stale invisibly: the file keeps reading
 * like a decision.
 *
 * So this re-derives from the shelf and compares. It does NOT restate
 * the numbers — the same rule the tour contract follows. Typing the
 * expected parts in here would make this a second copy of the answer,
 * which is the drift it exists to catch.
 */
import { shelfShares, shareToParts } from "../tools/derive-blend-shares.mjs";
import { DERIVED_PARTS, ASSIGNED_PARTS, BLEND_PARTS, defaultPartsFor } from "../src/data/blendShares.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push(`${name}: ${e.message}`); process.stdout.write("x"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const shelf = shelfShares();

test("every derived default still matches what the shelf brews", () => {
  const drifted = [];
  for (const row of shelf) {
    const want = shareToParts(row.share);
    const shipped = DERIVED_PARTS[row.id];
    if (shipped == null) {
      drifted.push(`${row.id} now has ${row.n} appearances (${(100 * row.share).toFixed(0)}%) `
        + `and belongs in DERIVED_PARTS at ${want}`);
    } else if (shipped !== want) {
      drifted.push(`${row.id}: ships ${shipped}, shelf now says ${want} `
        + `(${(100 * row.share).toFixed(0)}% across ${row.n} blends)`);
    }
  }
  assert(drifted.length === 0,
    `derived defaults have drifted from the curated blends:\n    ${drifted.join("\n    ")}`);
});

test("nothing is derived that the shelf can't actually answer", () => {
  // The other direction. An id sitting in DERIVED_PARTS that no longer
  // clears the appearance threshold is being presented as measured when
  // it isn't — it belongs in ASSIGNED_PARTS, with its reasoning.
  const known = new Set(shelf.map(r => r.id));
  const orphans = Object.keys(DERIVED_PARTS).filter(id => !known.has(id));
  assert(orphans.length === 0,
    `these claim to be derived but the shelf no longer supports them: ${orphans.join(", ")} `
    + `— move them to ASSIGNED_PARTS and say why`);
});

test("derived and assigned don't disagree about the same leaf", () => {
  const both = Object.keys(ASSIGNED_PARTS).filter(id => DERIVED_PARTS[id] != null);
  assert(both.length === 0,
    `assigned by hand AND derived from the shelf: ${both.join(", ")} — `
    + `the spread would silently pick one`);
});

test("every profiled ingredient has somewhere to start", () => {
  // Not a hard requirement — defaultPartsFor has a fallback — but an
  // unplaced ingredient is a decision nobody made, and the fallback
  // should be a safety net rather than the common case.
  const profiled = Object.keys(INGREDIENTS)
    .filter(id => (EXTRACTION_PROFILES[id] || []).length);
  const unplaced = profiled.filter(id => BLEND_PARTS[id] == null);
  assert(unplaced.length === 0,
    `no starting parts for: ${unplaced.join(", ")} — place them in blendShares.js`);
});

test("parts stay inside the ratio language", () => {
  // The stepper clamps 1..9. A default outside it would be unreachable
  // by the control that is supposed to edit it.
  const bad = Object.entries(BLEND_PARTS)
    .filter(([, p]) => !Number.isInteger(p) || p < 1 || p > 9)
    .map(([id, p]) => `${id}=${p}`);
  assert(bad.length === 0, `defaults outside the 1..9 stepper: ${bad.join(", ")}`);
});

test("a base starts heavier than an accent", () => {
  /* The claim the whole file is for, asserted on the two the report
     named. Adding peppermint to a black tea should propose a tea-led
     cup, because that is what the shelf brews: assam 69%, mint 34%. */
  assert(defaultPartsFor("assam") > defaultPartsFor("peppermint"),
    `assam (${defaultPartsFor("assam")}) should start heavier than peppermint `
    + `(${defaultPartsFor("peppermint")})`);
  assert(defaultPartsFor("cloves") <= defaultPartsFor("peppermint"),
    "a spice should not start heavier than a mint");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

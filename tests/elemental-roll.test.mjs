/* ──────────────────────────────────────────────────────────────
   tests/elemental-roll.test.mjs

   The chance roll's COOLDOWN, and it exists for a specific reason
   rather than for coverage.

   e2e/elemental-notices.spec.ts seeds `lastElementalRollAt` into the
   future so no elemental can arrive by chance while it asserts that
   nothing has arrived. That suppression is the fix for the fifth
   cause in CLAUDE.md's reopened note: every action site rolls
   Math.random at ~18% on a fresh profile, each test makes two or
   three tab visits before its silence assertion, and a roll that
   landed put an arrival ribbon on screen the test never caused.

   The seed only works while rollOnAction refuses to roll inside
   ROLL_COOLDOWN_MS. Delete that guard and the E2E specs don't fail
   honestly — they go back to failing one run in three, on a
   different test each time, which is a week of somebody's life.
   So the property gets held here, by name.

   Run: node tests/elemental-roll.test.mjs
   ────────────────────────────────────────────────────────────── */

import { rollOnAction } from "../src/data/elementalRoller.js";
import { ATTRIBUTES } from "../src/data/attributes.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Elemental roll — the cooldown the E2E silence assertions lean on\n");

// A fixed instant, so nothing here depends on when the suite runs.
const NOW = 1_700_000_000_000;
// rng that always lands: chance is compared with `rng() >= chance`, so
// zero passes every gate and isolates the cooldown as the only thing
// that can return null.
const alwaysLands = () => 0;

test("a roll can land at all, with the cooldown clear", () => {
  const hit = rollOnAction("visit:home", ATTRIBUTES, new Set(), 0, NOW, alwaysLands, 0);
  assert(hit, "with no previous roll and an rng that always lands, one should land — "
    + "if this fails the two tests below prove nothing, because null is the answer either way");
  assert(hit.action === "visit:home", `the hit should name its action, got ${hit && hit.action}`);
});

test("a roll inside the cooldown window is refused", () => {
  // One second after the last roll: far inside any plausible cooldown.
  const hit = rollOnAction("visit:home", ATTRIBUTES, new Set(), NOW - 1000, NOW, alwaysLands, 0);
  assert(hit === null, "a second roll moments after the last one should be refused");
});

/* THE ONE THE E2E DEPENDS ON. A `lastRollAt` in the future makes
   `now - lastRollAt` negative, which is under any cooldown, so the
   gate stays shut however long the test runs. Written as its own case
   because "negative elapsed time" is the kind of edge a rewrite can
   drop while keeping the ordinary cooldown working. */
test("a lastRollAt in the future suppresses chance rolls outright", () => {
  const anHourOut = NOW + 60 * 60 * 1000;
  for (const action of ["visit:home", "visit:profile", "visit:shelf", "brew", "journal"]) {
    const hit = rollOnAction(action, ATTRIBUTES, new Set(), anHourOut, NOW, alwaysLands, 0);
    assert(hit === null,
      `${action} rolled despite a lastRollAt an hour out — e2e/elemental-notices.spec.ts `
      + "seeds exactly this to keep stray arrivals off its silence assertions, and it "
      + "has just stopped working");
  }
});

/* A high dry streak raises the chance through pityMultiplier. The
   cooldown has to outrank it, or the suppression leaks precisely on
   the profiles most likely to roll. */
test("the cooldown outranks the pity bonus", () => {
  const hit = rollOnAction("visit:home", ATTRIBUTES, new Set(), NOW + 1000, NOW, alwaysLands, 99);
  assert(hit === null, "a long dry streak should not buy a roll inside the cooldown");
});

console.log(`\n\n  ${pass} passed, ${fail} failed\n`);
for (const f of failures) console.log(`  FAIL: ${f.desc}\n    ${f.message}\n`);
process.exit(fail ? 1 : 0);

/* ──────────────────────────────────────────────────────────────
   tests/summoned-elementals.test.mjs

   ONE QUESTION, ONE ANSWER: which elementals have you summoned.

   Profile and Field Notes each answered this separately and disagreed
   two ways at once — a field pass reported 8 against 9, and the dev
   seed reads 10 against 3.

   1. The creation elemental is never marked seen. Every other card's
      dismissal calls markElementalSeen(id); the omen's calls
      dismissOmen() and nothing else. So it appeared in the arrivals
      log (gated on omenShown) and never in the set Profile counted —
      the log read exactly one higher, always.
   2. Seen is not earned. The set can hold ids the account does not
      currently earn; the log intersected with earned, Profile did not.

   An earlier fix pointed both at seenElementalIds and closed the
   OPPOSITE direction — Profile had been counting things not yet met —
   which is how a half-corrected number ends up looking settled.

   The rule is decided in data/summonedElementals now and both surfaces
   read it. This holds the rule; e2e/elemental-counts.spec.ts holds the
   two surfaces to each other.

   Run: node tests/summoned-elementals.test.mjs
   ────────────────────────────────────────────────────────────── */

import { summonedElementalIds, CREATION_ELEMENTAL_ID } from "../src/data/summonedElementals.js";
import { ATTRIBUTES } from "../src/data/attributes.js";

// Real ids, so the tests exercise the ATTRIBUTES filter rather than a
// shape that only exists here. Three is enough to show order and gaps.
const [A1, A2, A3] = ATTRIBUTES.slice(0, 3).map(a => a.id);

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Summoned elementals — one question, one answer\n");

test("counts only what has been rolled AND observed at the lodestone", () => {
  /* Two stores, both required. The roll writes an id and queues a
     glimpse banner; the timeline must not pre-spoil what is still
     pulsing in the stone. */
  const ids = summonedElementalIds({
    rolledIds: new Set([A1, A2, A3]),
    seenIds: new Set([A1, A2]),
  });
  assert(ids.join() === `${A1},${A2}`,
    `rolled-but-unseen must not count, got ${ids.join()}`);
  assert(summonedElementalIds({ rolledIds: new Set([A1]), seenIds: new Set([A1, A2]) })
    .join() === A1, "seen-but-unrolled must not count either");
});

test("earned comes from the rolled store, never from re-evaluating conditions", () => {
  /* The divergence that survived the first unification. Field Notes
     read the rolled-id store — a grant, which persists — while Profile
     re-ran evaluateAttributes and asked whether each condition holds
     RIGHT NOW. ElementalsView's own comment says that predicate path
     "was retired"; Profile was still on it, and the two read 7 against
     3. Passing the store in is what makes re-derivation impossible. */
  const ids = summonedElementalIds({
    rolledIds: [A1], seenIds: [A1, A2, A3],
  });
  assert(ids.length === 1,
    `only the granted id counts however much else has been seen, got ${ids.join()}`);
});

test("seen but never granted does not count", () => {
  /* seenElementalIds is append-only and can hold ids the account does
     not hold. Counting the raw set is what read 10 against the log's 3
     on the dev seed. */
  const ids = summonedElementalIds({
    rolledIds: [A1],
    seenIds: new Set([A1, "stale-id", "another-stale"]),
  });
  assert(ids.length === 1, `only granted-and-seen should count, got ${ids.join()}`);
});

test("wild rolls count on the same terms as earned ones", () => {
  const ids = summonedElementalIds({
    rolledIds: [A1],
    wild: [{ id: "wild-a" }, { id: "wild-b" }],
    seenIds: new Set([A1, "wild-a"]),
  });
  assert(ids.join() === `${A1},wild-a`, ids.join());
});

test("the creation elemental counts once the omen is dismissed", () => {
  /* It is NOT filtered by seen, deliberately: nothing anywhere puts
     `_creation` into that set, so filtering would drop it from both
     surfaces rather than from one. omenShown is the flag that records
     the observation. */
  const base = { rolledIds: [], seenIds: new Set(), hasCreationTitle: true };
  assert(summonedElementalIds({ ...base, omenShown: false }).length === 0,
    "an undismissed omen has not been observed yet");
  assert(summonedElementalIds({ ...base, omenShown: true })[0] === CREATION_ELEMENTAL_ID,
    "dismissing the omen is the first act of observing the stone");
});

test("no profile means no creation elemental, however the omen flag reads", () => {
  assert(summonedElementalIds({ hasCreationTitle: false, omenShown: true }).length === 0,
    "there is nothing to generate one from");
});

test("accepts a plain array where a Set is expected", () => {
  // seenElementalIds is persisted through a Set-tagging serializer and
  // has been read back as a bare array by at least one caller.
  const ids = summonedElementalIds({ rolledIds: [A1], seenIds: [A1] });
  assert(ids.length === 1, "an array of seen ids must work the same as a Set");
});

test("survives being called with nothing at all", () => {
  assert(summonedElementalIds().length === 0, "no inputs is a real state on first run");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

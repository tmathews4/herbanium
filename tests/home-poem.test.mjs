/* ──────────────────────────────────────────────────────────────
   tests/home-poem.test.mjs

   The Home poem is picked at random from a pool biased by time of day
   and season. Randomness only produces rotation if the pool has
   something to rotate through, and that is exactly what broke:

   The original picker preferred the season-matched subset whenever it
   was non-empty. In summer that left a pool of ONE at two times of
   day — late afternoon and late evening — so a user opening the app
   on a summer evening got the identical poem every time, all season.
   It was reported as "I keep seeing the same poem", which sounds
   cosmetic and was a data-shape bug.

   Nothing checked pool sizes, because the picker lived in a .jsx file
   that a node test can't import. It's in src/data/homePoem.js now.

   Run: node tests/home-poem.test.mjs
   ────────────────────────────────────────────────────────────── */

import { poolFor, getTimeOfDay, seasonOf } from "../src/data/homePoem.js";
import { WAIT_POEMS } from "../src/data/waitContent.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Home poem — pool shape\n");

// One representative hour inside each time-of-day band, and one month
// inside each season. 8 x 4 = every state the picker can be in.
const HOURS = [6, 9, 12, 14, 17, 20, 23, 3];
const MONTHS = [0, 3, 6, 9];
const at = (hour, month) => new Date(2026, month, 15, hour, 0, 0);

// Two candidates means a coin flip every visit, which still reads as
// "the same poem again" far too often. Three is the floor worth
// defending; today the real minimum is comfortably above it.
const MIN_POOL = 3;

test("every time-of-day x season pool can actually rotate", () => {
  const thin = [];
  for (const hour of HOURS) {
    for (const month of MONTHS) {
      const d = at(hour, month);
      const n = poolFor(d).length;
      if (n < MIN_POOL) {
        thin.push(`${getTimeOfDay(hour).label} / ${seasonOf(month)}: ${n}`);
      }
    }
  }
  assert(thin.length === 0,
    `pools too small to rotate (min ${MIN_POOL}) — a user sees the same poem `
    + `every visit:\n    ${thin.join("\n    ")}`);
});

test("no time-of-day x season combination is empty", () => {
  // An empty pool returns null and the card renders nothing at all.
  const empty = [];
  for (const hour of HOURS) {
    for (const month of MONTHS) {
      if (poolFor(at(hour, month)).length === 0) {
        empty.push(`${getTimeOfDay(hour).label} / ${seasonOf(month)}`);
      }
    }
  }
  assert(empty.length === 0, `no poem available:\n    ${empty.join("\n    ")}`);
});

test("the Home-eligible corpus stays large enough to draw from", () => {
  // WAIT_POEMS has two consumers. The Home card filters by TIME OF DAY;
  // the steep-timer stream (buildWaitCards) filters by ingredient and
  // mood. So a poem tagged only `comfort` or `whimsy` isn't dead — it
  // belongs to the timer, not to Home. 35 of 150 are in that group and
  // that's fine.
  //
  // What isn't fine is that share growing until Home is drawing from
  // scraps. This guards the split rather than demanding every poem
  // serve both surfaces.
  const TOD = new Set(HOURS.flatMap(h => getTimeOfDay(h).todTags));
  const eligible = (WAIT_POEMS || []).filter(p => (p.tags || []).some(t => TOD.has(t)));
  const share = eligible.length / (WAIT_POEMS || []).length;
  assert(share >= 0.6,
    `only ${eligible.length}/${WAIT_POEMS.length} poems (${Math.round(share * 100)}%) `
    + `carry a time-of-day tag — Home is drawing from a shrinking corpus`);
});

test("the seasonal bias never shrinks a pool below the floor", () => {
  // The bug in one line: preferring a seasonal subset is only safe
  // while that subset is big enough to rotate within. If this ever
  // fails, the >= 3 threshold in poolFor has been lowered or the
  // seasonal tagging has thinned out.
  const bad = [];
  for (const hour of HOURS) {
    for (const month of MONTHS) {
      const d = at(hour, month);
      const todSet = new Set(getTimeOfDay(hour).todTags);
      const candidates = WAIT_POEMS.filter(p => (p.tags || []).some(t => todSet.has(t)));
      const pool = poolFor(d);
      if (pool.length < candidates.length && pool.length < MIN_POOL) {
        bad.push(`${getTimeOfDay(hour).label} / ${seasonOf(month)}: `
          + `${candidates.length} -> ${pool.length}`);
      }
    }
  }
  assert(bad.length === 0,
    `seasonal bias cut the pool below the floor:\n    ${bad.join("\n    ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed\n`);
if (failures.length) {
  console.log("  Failures:");
  for (const f of failures) console.log(`    ✗ ${f.desc}\n        ${f.message}`);
  process.exit(1);
}

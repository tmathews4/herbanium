/* ──────────────────────────────────────────────────────────────
   tests/lodestone.test.mjs

   The lodestone's charge rules. These are worth testing hard because
   they're the app's reward economy: the caps are the only thing
   stopping a visible meter from being grindable, and the day rollover
   is the kind of logic that quietly works until a user crosses
   midnight mid-session.

   Run: node tests/lodestone.test.mjs
   ────────────────────────────────────────────────────────────── */

import {
  CHARGE_FULL, CHARGE_SOURCES, CHARGE_ACTIONS,
  dayKey, emptyLedger, applyCharge, isCharged, spendCharge, maxDailyCharge,
} from "../src/data/lodestone.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Lodestone — charge rules, caps, day rollover\n");

// Fixed instants so nothing here depends on when the suite runs.
const NOON      = new Date(2026, 7, 1, 12, 0, 0).getTime();
const LATE      = new Date(2026, 7, 1, 23, 30, 0).getTime();
const NEXT_DAY  = new Date(2026, 7, 2, 0, 30, 0).getTime();

// Run a list of actions through applyCharge, threading the state.
function run(actions, { charge = 0, ledger = null, now = NOON } = {}) {
  let state = { charge, ledger };
  const gains = [];
  for (const action of actions) {
    const next = applyCharge({ charge: state.charge, ledger: state.ledger, action, now });
    gains.push(next.gained);
    state = { charge: next.charge, ledger: next.ledger, capped: next.capped };
  }
  return { ...state, gains };
}

// ── Weights ──────────────────────────────────────────────────────

test("a review is worth more than a brew", () => {
  // The review feeds the perception model; the brew is the easy part.
  assert(CHARGE_SOURCES.review.gain > CHARGE_SOURCES.brew.gain,
    `review ${CHARGE_SOURCES.review.gain} should beat brew ${CHARGE_SOURCES.brew.gain}`);
});

test("every source has a positive gain and a daily cap", () => {
  for (const action of CHARGE_ACTIONS) {
    const s = CHARGE_SOURCES[action];
    assert(s.gain > 0, `${action} has no gain`);
    assert(Number.isInteger(s.perDay) && s.perDay > 0, `${action} has no usable perDay`);
    assert(typeof s.label === "string" && s.label.length > 0, `${action} has no label`);
  }
});

test("no single action can fill the stone on its own", () => {
  // If one action could top it out, the other three would be noise and
  // the meter would say the app values one behaviour.
  for (const action of CHARGE_ACTIONS) {
    const s = CHARGE_SOURCES[action];
    assert(s.gain * s.perDay < CHARGE_FULL,
      `${action} alone yields ${s.gain * s.perDay}/day — enough to fill the stone`);
  }
});

test("a fully engaged day is worth roughly half a stone", () => {
  // The pacing claim: two to three days of real use per summon. If this
  // drifts far from it, the caps or the weights moved.
  const perDay = maxDailyCharge();
  assert(perDay >= CHARGE_FULL * 0.4 && perDay <= CHARGE_FULL * 0.9,
    `a maxed day is worth ${perDay}, which is not "two to three days per summon"`);
});

// ── Accumulation and caps ────────────────────────────────────────

test("charge accumulates across different actions", () => {
  const { charge } = run(["brew", "review", "reflection"]);
  const expected = CHARGE_SOURCES.brew.gain + CHARGE_SOURCES.review.gain
    + CHARGE_SOURCES.reflection.gain;
  assert(charge === expected, `expected ${expected}, got ${charge}`);
});

test("an action stops paying once its daily cap is spent", () => {
  const over = CHARGE_SOURCES.brew.perDay + 2;
  const { gains } = run(Array(over).fill("brew"));
  const paid = gains.filter(g => g > 0).length;
  assert(paid === CHARGE_SOURCES.brew.perDay,
    `brew paid out ${paid} times against a cap of ${CHARGE_SOURCES.brew.perDay}`);
});

test("hitting the cap reports why, so callers can tell it apart from full", () => {
  const state = run(Array(CHARGE_SOURCES.reflection.perDay).fill("reflection"));
  const next = applyCharge({ charge: state.charge, ledger: state.ledger, action: "reflection", now: NOON });
  assert(next.gained === 0, "should not pay past the cap");
  assert(next.capped === "daily", `expected "daily", got ${next.capped}`);
});

test("capping one action doesn't cap the others", () => {
  let state = run(Array(5).fill("brew"));
  const next = applyCharge({ charge: state.charge, ledger: state.ledger, action: "review", now: NOON });
  assert(next.gained === CHARGE_SOURCES.review.gain,
    `review should still pay after brew is capped, gained ${next.gained}`);
});

test("grinding every action all day cannot exceed one day's worth", () => {
  const spam = [];
  for (let i = 0; i < 40; i++) spam.push(...CHARGE_ACTIONS);
  const { charge } = run(spam);
  assert(charge === Math.min(CHARGE_FULL, maxDailyCharge()),
    `40 rounds of everything yielded ${charge}`);
});

// ── The clamp ────────────────────────────────────────────────────

test("charge never exceeds full", () => {
  const { charge } = run(["review", "review"], { charge: 90 });
  assert(charge === CHARGE_FULL, `expected ${CHARGE_FULL}, got ${charge}`);
});

test("the last gain before full is trimmed, not overshot", () => {
  const next = applyCharge({ charge: 90, ledger: emptyLedger(NOON), action: "review", now: NOON });
  assert(next.gained === 10, `expected a trimmed gain of 10, got ${next.gained}`);
});

test("a full stone reports why it stopped paying", () => {
  const next = applyCharge({ charge: CHARGE_FULL, ledger: emptyLedger(NOON), action: "brew", now: NOON });
  assert(next.gained === 0 && next.capped === "full", `got ${next.capped}`);
});

test("a full stone doesn't burn the daily allowance", () => {
  // Otherwise a user who brews while full silently loses that action's
  // cap slot and can't earn it again after summoning.
  const next = applyCharge({ charge: CHARGE_FULL, ledger: emptyLedger(NOON), action: "brew", now: NOON });
  assert(!next.ledger.counts.brew, "brew should not be marked used when the stone was already full");
});

// ── Day rollover ─────────────────────────────────────────────────

test("dayKey is local, not UTC", () => {
  // A cap that rolls over at 00:00 UTC lands mid-evening for some
  // users, which reads as the app randomly refusing to count things.
  const late = dayKey(LATE);
  const next = dayKey(NEXT_DAY);
  assert(late !== next, "23:30 and 00:30 the next day should be different days");
  assert(late === "2026-08-01", `expected 2026-08-01, got ${late}`);
});

test("caps reset on a new day", () => {
  const spent = run(Array(5).fill("brew"), { now: LATE });
  const next = applyCharge({ charge: spent.charge, ledger: spent.ledger, action: "brew", now: NEXT_DAY });
  assert(next.gained === CHARGE_SOURCES.brew.gain,
    `brew should pay again after midnight, gained ${next.gained}`);
});

test("a new day clears yesterday's counts rather than carrying them", () => {
  const spent = run(["brew", "review"], { now: LATE });
  const next = applyCharge({ charge: spent.charge, ledger: spent.ledger, action: "brew", now: NEXT_DAY });
  assert(Object.keys(next.ledger.counts).length === 1,
    `expected only today's action, got ${JSON.stringify(next.ledger.counts)}`);
  assert(next.ledger.day === dayKey(NEXT_DAY), "ledger should be stamped with the new day");
});

test("charge itself survives the day boundary", () => {
  const spent = run(["review", "brew"], { now: LATE });
  const next = applyCharge({ charge: spent.charge, ledger: spent.ledger, action: "brew", now: NEXT_DAY });
  assert(next.charge > spent.charge, "progress should carry over, only the caps reset");
});

// ── Robustness ───────────────────────────────────────────────────

test("an unknown action is a no-op, not a crash", () => {
  // Charge is wired at a dozen call sites; a typo shouldn't break a brew.
  const next = applyCharge({ charge: 40, ledger: emptyLedger(NOON), action: "nonsense", now: NOON });
  assert(next.charge === 40 && next.gained === 0, "unknown action should change nothing");
  assert(next.capped === "unknown", `expected "unknown", got ${next.capped}`);
});

test("a missing or malformed ledger is rebuilt", () => {
  for (const ledger of [null, undefined, {}, { day: "1999-01-01" }]) {
    const next = applyCharge({ charge: 0, ledger, action: "brew", now: NOON });
    assert(next.gained === CHARGE_SOURCES.brew.gain,
      `ledger ${JSON.stringify(ledger)} should still allow a first brew`);
    assert(next.ledger.day === dayKey(NOON), "rebuilt ledger should carry today's key");
  }
});

// ── Spending ─────────────────────────────────────────────────────

test("only a full stone can be spent", () => {
  assert(isCharged(CHARGE_FULL) === true, "full should be chargeable");
  assert(isCharged(CHARGE_FULL - 1) === false, "one short should not be");
  assert(spendCharge(CHARGE_FULL) === 0, "spending a full stone empties it");
  assert(spendCharge(CHARGE_FULL - 1) === null,
    "spending a partial stone must return null so no summon is granted");
});

test("spending returns to zero, not to a leftover remainder", () => {
  // Overshoot is already trimmed on the way in, so a spent stone is
  // always exactly empty — no invisible head start on the next one.
  assert(spendCharge(CHARGE_FULL) === 0, "should be exactly empty");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

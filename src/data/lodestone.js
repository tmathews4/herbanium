/* ──────────────────────────────────────────────────────────────
   data/lodestone.js — lodestone charge.

   The lodestone fills as the user brews, reviews and writes, and a
   full stone yields a guaranteed summon. This replaces the wild
   elemental's chance roll, which was 1-in-15 behind a 7-day limiter —
   from the user's side, indistinguishable from nothing happening. A
   meter that visibly moves turns the same reward budget into feedback
   about what the app values.

   Weights say what the app wants. A completed review is worth more
   than a brew because the review is the part that feeds the
   perception model; a written reflection sits between them.

   Per-day caps are what stop a VISIBLE meter from inviting grinding —
   the failure mode an invisible probability doesn't have. A typical
   engaged day (two cups brewed and reviewed) is worth 52, so a full
   stone is about two days of real use; a day that also lands a
   milestone and a reflection tops out at 79. Nothing an evening of
   tapping can rush. The first draft of these numbers reached 105 in a
   day — a full stone daily — which the test caught.

   The action-based rolls in elementalRoller.js are untouched: those
   stay the surprise channel. Two tracks, different jobs — the
   lodestone is the promise you can count on, the rolls are the gift
   you can't.

   Everything here is pure so tests/lodestone.test.mjs can walk the
   caps, the day rollover and the clamp without a browser.
   ────────────────────────────────────────────────────────────── */

export const CHARGE_FULL = 100;

// gain: charge per qualifying action. perDay: how many times that
// action can pay out before the day's well runs dry.
export const CHARGE_SOURCES = {
  review:     { gain: 18, perDay: 2, label: "a cup reviewed" },
  milestone:  { gain: 15, perDay: 1, label: "a milestone reached" },
  reflection: { gain: 12, perDay: 1, label: "a reflection written" },
  brew:       { gain:  8, perDay: 2, label: "a cup brewed" },
};

export const CHARGE_ACTIONS = Object.keys(CHARGE_SOURCES);

/**
 * Local calendar day key. Local rather than UTC on purpose: the cap
 * should roll over when the user's day does, not at 00:00 UTC in the
 * middle of someone's evening.
 */
export function dayKey(now = Date.now()) {
  const d = new Date(now);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** A fresh ledger for `now`'s day. */
export function emptyLedger(now = Date.now()) {
  return { day: dayKey(now), counts: {} };
}

/**
 * Apply one action to the charge.
 *
 * Returns { charge, ledger, gained, capped } — `gained` is what was
 * actually added (0 when the day's cap for that action is spent or the
 * stone is already full), and `capped` says which of those it was, so
 * a caller can tell "you've done this enough today" apart from "the
 * stone is full."
 *
 * Unknown actions are a no-op rather than an error: charge sources are
 * wired at a dozen call sites and a typo shouldn't crash a brew.
 */
export function applyCharge({ charge = 0, ledger, action, now = Date.now() }) {
  const source = CHARGE_SOURCES[action];
  const today = dayKey(now);
  // A ledger from an earlier day is spent — start the day clean rather
  // than carrying yesterday's counts forward.
  const base = ledger && ledger.day === today
    ? { day: today, counts: { ...(ledger.counts || {}) } }
    : emptyLedger(now);

  if (!source) return { charge, ledger: base, gained: 0, capped: "unknown" };
  if (charge >= CHARGE_FULL) return { charge: CHARGE_FULL, ledger: base, gained: 0, capped: "full" };

  const used = base.counts[action] || 0;
  if (used >= source.perDay) return { charge, ledger: base, gained: 0, capped: "daily" };

  const gained = Math.min(source.gain, CHARGE_FULL - charge);
  base.counts[action] = used + 1;
  return { charge: charge + gained, ledger: base, gained, capped: null };
}

/** Is the stone ready to yield a guaranteed summon? */
export function isCharged(charge = 0) {
  return charge >= CHARGE_FULL;
}

/**
 * Spend a full stone. Returns the charge to store afterwards, or null
 * when there wasn't enough to spend — callers use the null to avoid
 * granting a summon they haven't paid for.
 */
export function spendCharge(charge = 0) {
  return isCharged(charge) ? 0 : null;
}

/**
 * What a fully engaged day is worth, for sanity-checking the numbers.
 * Not used by the app — it exists so the test can assert the pacing
 * claim in the comment above instead of leaving it as folklore.
 */
export function maxDailyCharge() {
  return CHARGE_ACTIONS.reduce(
    (sum, a) => sum + CHARGE_SOURCES[a].gain * CHARGE_SOURCES[a].perDay, 0,
  );
}

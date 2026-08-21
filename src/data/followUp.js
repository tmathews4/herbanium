/* ──────────────────────────────────────────────────────────────
   data/followUp.js — when to ask how a cup landed.

   Flavor is knowable at first sip; effect isn't knowable for half an
   hour. So the app captures flavor at brew time and asks about mood
   later — and "later" is what this module owns.

   Three things set the time:

   1. A default, used when the user says nothing. Defaults beat
      choices for something this small.
   2. An explicit pick at brew time ("ask me in an hour"), because the
      user knows their evening better than a constant does.
   3. A snooze on the card itself. That one is the honest deferral:
      it's the only moment where "not yet" is a real answer rather
      than the only possible one, since by then the cup may or may not
      be finished.

   All pure, so tests/follow-up.test.mjs can walk the schedule, the
   snooze ceiling and the expiry window without a clock or a browser.
   ────────────────────────────────────────────────────────────── */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// Options offered at brew time. `tonight` is deliberately absolute
// rather than a duration — "tonight" means an evening hour, not
// "eight hours from whenever this finished steeping", which for a
// morning cup would land mid-afternoon.
export const FOLLOWUP_CHOICES = [
  { id: "default", label: "in half an hour", delayMs: 30 * MIN },
  { id: "hour",    label: "in an hour",      delayMs: HOUR },
  { id: "tonight", label: "tonight",         atHour: 20 },
];

export const DEFAULT_FOLLOWUP_MS = 30 * MIN;

// How long the card stays askable. Past this the cup is history and
// asking would be archaeology, not a check-in.
export const FOLLOWUP_WINDOW_MS = 24 * HOUR;

// One snooze step, and a ceiling on how far snoozing can push the ask
// out. Without the ceiling a user could snooze past the 24-hour window
// and the card would vanish mid-conversation rather than being
// answered or dismissed.
export const SNOOZE_MS = 45 * MIN;
export const MAX_SNOOZES = 3;

/**
 * When to ask, given a brew time and the user's pick. Unknown ids fall
 * back to the default rather than throwing — the id comes from a UI
 * that may gain options later.
 */
export function scheduleFollowUp(brewedAt, choiceId = "default") {
  const choice = FOLLOWUP_CHOICES.find(c => c.id === choiceId);
  if (!choice) return brewedAt + DEFAULT_FOLLOWUP_MS;

  if (choice.atHour != null) {
    const at = new Date(brewedAt);
    at.setHours(choice.atHour, 0, 0, 0);
    // Already past that hour (a late-evening cup): the soonest sensible
    // ask is the default delay, not tomorrow night — by tomorrow the
    // cup is outside the window entirely.
    if (at.getTime() <= brewedAt) return brewedAt + DEFAULT_FOLLOWUP_MS;
    return at.getTime();
  }
  return brewedAt + choice.delayMs;
}

/**
 * Push an ask back one step. Returns null when the session has used up
 * its snoozes, so the caller can hide the control rather than offering
 * a button that silently does nothing.
 */
export function snoozeFollowUp(session, now = Date.now()) {
  const used = session?.followUpSnoozes || 0;
  if (used >= MAX_SNOOZES) return null;
  return {
    followUpAt: Math.max(now, session?.followUpAt || now) + SNOOZE_MS,
    followUpSnoozes: used + 1,
  };
}

/** Is this cup's check-in due, and still worth asking about? */
export function isFollowUpDue(session, now = Date.now()) {
  if (!session || session.who !== "you" || !session.moodsPending) return false;
  const brewedAt = session.brewedAt || 0;
  // Sessions from before this field existed fall back to the default
  // delay, so an in-flight cup at upgrade time still gets asked about.
  const dueAt = session.followUpAt || brewedAt + DEFAULT_FOLLOWUP_MS;
  if (now < dueAt) return false;
  return now - brewedAt < FOLLOWUP_WINDOW_MS;
}

/** The cup to ask about — the most recent one that's due. */
export function nextFollowUp(sessions, now = Date.now()) {
  return (sessions || []).find(s => isFollowUpDue(s, now)) || null;
}

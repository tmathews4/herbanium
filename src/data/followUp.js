/* ──────────────────────────────────────────────────────────────
   data/followUp.js — when to ask how a cup landed.

   Flavor is knowable at first sip; effect isn't knowable for half an
   hour. So the app captures flavor at brew time and asks about mood
   later — and "later" is what this module owns.

   Two things set the time (it was three — see DEFAULT_FOLLOWUP_MS):

   1. A default, used when the user says nothing. Defaults beat
      choices for something this small.
   2. A snooze on the card itself. That one is the honest deferral:
      it's the only moment where "not yet" is a real answer rather
      than the only possible one, since by then the cup may or may not
      be finished.

   All pure, so tests/follow-up.test.mjs can walk the schedule, the
   snooze ceiling and the expiry window without a clock or a browser.
   ────────────────────────────────────────────────────────────── */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/* HALF AN HOUR, FOR EVERY CUP. There were three options — "in half an
   hour", "in an hour", "tonight" — offered in the notice at brew time,
   and the header above still lists that pick as one of the three things
   that set the time. It was removed: the moment a person has just
   finished brewing is the moment they care least about scheduling a
   nudge, and this file already argued the case against asking, one
   paragraph up. "Defaults beat choices for something this small."

   What made it safe to drop is that the reminder stopped depending on
   it. An unreviewed cup reads "pending review" on its Home row and
   opens with its review panel showing, so the in-app path is visible
   whether or not a timer fires. The scheduled notification still earns
   its keep on the packaged app — it is the only thing that can reach a
   closed app — it just fires on this constant rather than on a
   decision. */
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

/** When to ask, given a brew time. One answer, and see the constant. */
export function scheduleFollowUp(brewedAt) {
  return brewedAt + DEFAULT_FOLLOWUP_MS;
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

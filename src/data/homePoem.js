/* ──────────────────────────────────────────────────────────────
   data/homePoem.js — which poem the Home card shows.

   Lived inside HomeScreen.jsx until a bug made the case for moving
   it: a node test can't import JSX, so the pool sizes this depends on
   had never been checked by anything. They needed to be.

   The pick is time-of-day and season biased, then random within the
   surviving pool. Two things have gone wrong here historically and
   both are guarded in tests/home-poem.test.mjs now:

   1. A POOL THAT COLLAPSES TO ONE. The original version preferred the
      season-matched subset whenever it was non-empty, which in summer
      left exactly one candidate at two times of day. A user opening
      the app on a summer evening got the identical poem every time,
      for the whole season. Hence the >= 3 floor before the seasonal
      subset is allowed to win.

   2. A PICK THAT NEVER RE-RUNS. Separate bug, fixed in HomeScreen —
      see the note on visitNonce there.
   ────────────────────────────────────────────────────────────── */

import { WAIT_POEMS } from "./waitContent.js";

export const getTimeOfDay = (h) => {
  if (h >= 5  && h <  8) return { label: "Early morning",  todTags: ["morning", "dawn"] };
  if (h >= 8  && h < 11) return { label: "Morning",        todTags: ["morning"] };
  if (h >= 11 && h < 13) return { label: "Late morning",   todTags: ["morning", "noon"] };
  if (h >= 13 && h < 16) return { label: "Afternoon",      todTags: ["noon", "stillness"] };
  if (h >= 16 && h < 19) return { label: "Late afternoon", todTags: ["evening"] };
  if (h >= 19 && h < 22) return { label: "Evening",        todTags: ["evening", "night"] };
  if (h >= 22 || h <  2) return { label: "Late evening",   todTags: ["night", "moon"] };
  return                         { label: "Small hours",   todTags: ["night", "moon", "stillness"] };
};

// Northern-hemisphere season buckets keyed off month index. Southern-
// hemisphere users see a mismatched season bias — acceptable for now,
// no locale data available locally.
export const seasonOf = (m) => {
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4)  return "spring";
  if (m >= 5 && m <= 7)  return "summer";
  return "autumn";
};

/** The candidate pool for a given moment, before the random pick. */
export const poolFor = (date) => {
  const todSet = new Set(getTimeOfDay(date.getHours()).todTags);
  const season = seasonOf(date.getMonth());
  const candidates = (WAIT_POEMS || []).filter(p => (p.tags || []).some(t => todSet.has(t)));
  // Soft season bias: the seasonal subset only wins when it's big
  // enough to rotate within. See note 1 at the top of this file.
  const seasonMatched = candidates.filter(p => (p.tags || []).includes(season));
  return seasonMatched.length >= 3 ? seasonMatched : candidates;
};

/** Pick a public-domain poem fitting the hour and, when possible, the season. */
export const pickHomePoem = (date) => {
  const pool = poolFor(date);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

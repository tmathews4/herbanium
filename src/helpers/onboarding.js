/* ──────────────────────────────────────────────────────────────
   helpers/onboarding.js — preference-to-seed mapping

   New users now start with a single seeded favorite — Tom Foolery,
   the Herbanium calling-card cup. The earlier behavior added 5-7
   blends pre-favorited based on onboarding answers (time of day,
   what draws you, plus traditional+universal padding) which made
   the favorites list feel pre-curated rather than chosen. With a
   single-seed start, the favorites list is an explicit user
   choice from minute one — they add the rest via the curated
   Catalog or their own compositions.

   The blend ID below must exist in src/data/blends.js BLENDS array.
   ────────────────────────────────────────────────────────────── */

// Blends every new user gets, regardless of onboarding answers.
// Tom Foolery is the Herbanium calling-card cup — shipped to
// everyone so the catalog has a personality from minute one and
// the favorites rail isn't completely empty on day one.
const ALWAYS_INCLUDE = ["exp-tom-foolery"];

/**
 * Pick seed blend IDs based on onboarding answers.
 * timeOfDay and draw are still accepted for back-compat with
 * callers, but the answer doesn't currently shape the seed set —
 * every new user gets the same single starter (Tom Foolery).
 * Returns array of blend IDs.
 */
// eslint-disable-next-line no-unused-vars
export function pickSeedBlends({ timeOfDay, draw } = {}) {
  return [...ALWAYS_INCLUDE];
}

/* ──────────────────────────────────────────────────────────────
   helpers/onboarding.js — preference-to-seed mapping

   Given a user's onboarding answers (time-of-day + what-draws-them),
   pick 2-3 curated blends to seed as their starting favorites.

   Design: union of candidates from both answers, deduplicated,
   capped at 3. If the union is small, pad from generally-popular
   default set.

   These seeded blends appear in the user's "saved blends" list as
   if they favorited them. They can unfavorite any of them if they
   don't fit. The seeds are bootstrapping, not prescription.

   The blend IDs below must exist in src/data/blends.js BLENDS array.
   If a blend is renamed or removed, update the mappings here.
   ────────────────────────────────────────────────────────────── */

// Blends associated with each time-of-day choice
const TIME_OF_DAY_SEEDS = {
  morning:    ["morning"],                  // Morning Vestment
  afternoon:  ["study", "hearth"],          // Scriptorium, Hearth & Quiet
  evening:    ["dusk"],                     // Dusk Lullaby
  throughout: ["morning", "hearth", "dusk"], // one per period
};

// Blends associated with each "what draws you" choice
const DRAW_SEEDS = {
  calm:    ["dusk"],        // Dusk Lullaby
  focus:   ["study"],       // Scriptorium
  comfort: ["hearth"],      // Hearth & Quiet
  energy:  ["morning"],     // Morning Vestment
};

// Default padding set if the union is thin — always-popular starters.
const DEFAULT_FALLBACK = ["dusk", "morning", "hearth"];

/**
 * Pick seed blend IDs based on onboarding answers.
 * Returns array of blend IDs (not objects).
 */
export function pickSeedBlends({ timeOfDay, draw }) {
  const pool = new Set();

  (TIME_OF_DAY_SEEDS[timeOfDay] || []).forEach(id => pool.add(id));
  (DRAW_SEEDS[draw] || []).forEach(id => pool.add(id));

  // If we got fewer than 2, pad from defaults until we have 2-3
  const defaults = DEFAULT_FALLBACK.slice();
  while (pool.size < 2 && defaults.length > 0) {
    pool.add(defaults.shift());
  }

  // Cap at 3 — preserves the "small starting library" feel
  return Array.from(pool).slice(0, 3);
}

/**
 * Default starting pantry for new users. A small, useful subset
 * spanning categories — enough to actually brew the seeded blends,
 * and a few extras for exploration. Not every ingredient; the user
 * can add more as they go.
 */
export const ONBOARDING_PANTRY = [
  "chamomile",   // for Dusk Lullaby
  "lavender",
  "lemonbalm",
  "assam",       // for Morning Vestment
  "ginger",
  "cardamom",
  "cinnamon",
  "sencha",      // for Scriptorium
  "jasmine",
  "rooibos",     // for Hearth & Quiet
  "peppermint",  // a universal
  "rose",        // a universal
];

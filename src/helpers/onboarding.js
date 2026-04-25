/* ──────────────────────────────────────────────────────────────
   helpers/onboarding.js — preference-to-seed mapping

   Given a user's onboarding answers (time-of-day array + what-draws
   array, both multi-select), pick 2-3 curated blends to seed as
   their starting favorites.

   Design: union of candidates from every selected answer,
   deduplicated, capped at 3. If the union is small, pad from
   generally-popular default set.

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

// Blends every new user gets, regardless of onboarding answers. Tom
// Foolery is the Herbanium calling-card cup — shipped to everyone so
// the catalog has a personality from minute one.
const ALWAYS_INCLUDE = ["exp-tom-foolery"];

/**
 * Pick seed blend IDs based on onboarding answers.
 * timeOfDay and draw are arrays (multi-select) — iterate each and union.
 * Returns array of blend IDs (not objects).
 */
export function pickSeedBlends({ timeOfDay, draw }) {
  // Always-include comes first so it leads the saved-blends list.
  const pool = new Set(ALWAYS_INCLUDE);

  // Normalize: accept both arrays (current) and strings (legacy/defensive)
  const times = Array.isArray(timeOfDay) ? timeOfDay : timeOfDay ? [timeOfDay] : [];
  const draws = Array.isArray(draw) ? draw : draw ? [draw] : [];

  times.forEach(t => (TIME_OF_DAY_SEEDS[t] || []).forEach(id => pool.add(id)));
  draws.forEach(d => (DRAW_SEEDS[d] || []).forEach(id => pool.add(id)));

  // If we got fewer than 2 from preferences, pad from defaults
  const defaults = DEFAULT_FALLBACK.slice();
  while (pool.size < 2 + ALWAYS_INCLUDE.length && defaults.length > 0) {
    pool.add(defaults.shift());
  }

  // Cap holds preference-driven slots (3) + the always-include count.
  return Array.from(pool).slice(0, 3 + ALWAYS_INCLUDE.length);
}

// Mood → complementary flavor pairings used by generateExperimentalSeeds.
// Each pairing is meant to be evocative rather than strict — the user
// can always retune the slider afterwards.
const FLAVOR_PAIRS_BY_MOOD = {
  calm:    "floral",
  focus:   "grassy",
  energy:  "spiced",
  sleepy:  "honeyed",
  comfort: "sweet",
  settle:  "minty",
};

/**
 * Generate 2-3 algorithmic experimental blends for a new user, seeded
 * from their onboarding answers. Returns full blend objects (not just
 * IDs) — the caller persists them and hydrates LOCAL_BLENDS so
 * getBlend(id) can find them later.
 *
 * Each generated blend uses the synthesis algorithm (tea-first
 * ingredient picking, 2D sweet-spot brew, MOOD_WORDS / FLAVOR_WORDS
 * naming). The mood/flavor pairings are chosen for variety: the
 * user's primary "draw" gets a complementary-flavor pairing, a
 * second draw (if present) gets its own, plus one quirky combo
 * for fun.
 */
export function generateExperimentalSeeds({ draw }, buildSyntheticForSelections) {
  const draws = Array.isArray(draw) ? draw : draw ? [draw] : [];
  if (draws.length === 0 || typeof buildSyntheticForSelections !== "function") {
    return [];
  }

  const combos = [];
  // Combo 1: primary draw + complementary flavor
  combos.push({
    moods: [draws[0]],
    flavors: [FLAVOR_PAIRS_BY_MOOD[draws[0]] || "floral"],
  });
  // Combo 2: second draw if present
  if (draws.length > 1) {
    combos.push({
      moods: [draws[1]],
      flavors: [FLAVOR_PAIRS_BY_MOOD[draws[1]] || "earthy"],
    });
  }
  // Combo 3: a quirky multi-mood pairing for variety, or a contrasting
  // flavor for single-draw users.
  if (draws.length >= 2) {
    combos.push({ moods: draws.slice(0, 2), flavors: [] });
  } else {
    combos.push({ moods: [draws[0]], flavors: ["citrus"] });
  }

  const blends = [];
  const seenIds = new Set();
  for (const { moods, flavors } of combos) {
    const synth = buildSyntheticForSelections(moods, flavors, "feel");
    if (!synth || seenIds.has(synth.id)) continue;
    seenIds.add(synth.id);
    blends.push({
      ...synth,
      // Stamp as a user-generated experimental — appears with the
      // blue in-house outline and shows up in saved blends.
      generated: true,
      experimental: true,
    });
  }
  return blends;
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
  "peppermint",  // a universal — also for Tom Foolery
  "rose",        // a universal
  "gunpowder",   // for Tom Foolery
  "tulsi",       // for Tom Foolery
];

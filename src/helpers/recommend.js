/* ──────────────────────────────────────────────────────────────
   helpers/recommend.js — blend recommendation scoring.

   Scores candidate blends against the user's signal — onboarding
   answers initially, evolving as cups get logged — and returns
   the top N the user doesn't already have favorited.

   Signal sources (additive):
     - profile.draw   — onboarding mood preferences → match blend.mood
     - profile.flavors — onboarding flavor preferences → match blend.flavor
     - last-30-days targetMoods — what the user has been reaching for
     - last-30-days high-taste blends → boost similar mood/flavor blends

   Exclusions:
     - already in favoriteIds  (don't re-recommend a favorite)
     - in hiddenIds            (user explicitly removed)
     - user-composed (local-)  (we recommend the catalog, not their work)
     - score 0 candidates      (no signal matched — better to show nothing
                                than a random blend)

   Pure function with no React/UI dependency. Easy to test in isolation.
   ────────────────────────────────────────────────────────────── */

const RECENT_WINDOW_DAYS = 30;
const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function recommendBlends({
  blends = [],
  profile,
  sessions = [],
  favoriteIds,
  hiddenIds,
  limit = 3,
}) {
  // Defensive: accept Sets, Arrays, or null/undefined for the id collections.
  const favSet = favoriteIds instanceof Set
    ? favoriteIds
    : new Set(Array.isArray(favoriteIds) ? favoriteIds : []);
  const hidSet = hiddenIds instanceof Set
    ? hiddenIds
    : new Set(Array.isArray(hiddenIds) ? hiddenIds : []);

  const candidates = (blends || []).filter(b => {
    if (!b || !b.id) return false;
    if (favSet.has(b.id)) return false;
    if (hidSet.has(b.id)) return false;
    if (typeof b.id === "string" && b.id.startsWith("local-")) return false;
    return true;
  });
  if (candidates.length === 0) return [];

  const drawSet = new Set(profile?.draw || []);
  const flavorSet = new Set(profile?.flavors || []);

  // Last-30-days session signal: mood counts (which moods reach for)
  // and high-taste blends (which past brews landed well).
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const recentMoodCounts = Object.create(null);
  const highTasteMoods = new Set();   // moods of cups rated 4-5
  const highTasteFlavors = new Set(); // primary flavors of cups rated 4-5
  for (const s of sessions || []) {
    if (s?.who !== "you") continue;
    const ts = s.brewedAt || s.ts || 0;
    if (ts < cutoff) continue;
    (s.targetMoods || []).forEach(m => {
      recentMoodCounts[m] = (recentMoodCounts[m] || 0) + 1;
    });
    if ((s.taste || 0) >= 4 && s.blendId) {
      // Look up the blend in the candidate list to get its mood/flavor.
      // If the blend isn't in the BLENDS array (user-composed, deleted, etc.)
      // we just skip — no signal lost since we'd never recommend those.
      const blend = (blends || []).find(b => b.id === s.blendId);
      if (blend) {
        if (blend.mood)   highTasteMoods.add(blend.mood);
        if (blend.flavor) highTasteFlavors.add(blend.flavor);
      }
    }
  }

  const scored = candidates.map(b => {
    let score = 0;

    // Onboarding mood match: +3 if the blend's primary mood is in the
    // user's onboarding draws. This is the strongest single signal and
    // drives recommendations from day one before any cups are logged.
    if (b.mood && drawSet.has(b.mood)) score += 3;

    // Recent-mood match: +N where N is how many times the user has
    // brewed for this mood in the last 30 days. Captures "what they
    // actually reach for" which can diverge from onboarding answers.
    if (b.mood && recentMoodCounts[b.mood]) {
      score += Math.min(5, recentMoodCounts[b.mood]);
    }

    // Onboarding flavor match: +2 for matching the user's flavor draws.
    if (b.flavor && flavorSet.has(b.flavor)) score += 2;

    // High-taste mood resonance: +2 if the blend's mood matches one
    // the user has rated 4-5 on a recent cup. "You loved a calm cup;
    // here's another calm cup."
    if (b.mood && highTasteMoods.has(b.mood)) score += 2;

    // High-taste flavor resonance: +1 for the same on flavor.
    if (b.flavor && highTasteFlavors.has(b.flavor)) score += 1;

    return { blend: b, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ blend }) => blend);
}

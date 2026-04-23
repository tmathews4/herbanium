/* ──────────────────────────────────────────────────────────────
   data/extractionProfiles.js — MOCK DATA for extraction profile
   exploration UI (temp/time sliders on ingredient pages).

   This is hand-authored mock data for one ingredient (chamomile) to
   validate the UI interaction before committing to a full research
   pass. The real data model for all ingredients will use the same
   shape, collected during the research phase.

   Each profile represents a data point along the brewing spectrum.
   At minimum we have low/mid/high data points; the UI interpolates
   linearly between them for slider positions in between.

   Shape per profile:
     tempC        — canonical temp for this profile (°C)
     timeS        — canonical steep time for this profile (seconds)
     flavors      — which flavor notes are present at this extraction
     effects      — [effect, strength(0-5)] tuples at this extraction
     character    — one-line editorial note about what this cup is like

   During research:
     - Extend to all 30 ingredients
     - Some ingredients may need 4-5 profiles if they shift dramatically
     - Flavor tags may include new vocabulary not currently in FLAVORS
     - Effect magnitudes should reflect real compound extraction curves
       (non-linear in reality, but we'll interpolate linearly for v1)

   LIMITATION / HONEST NOTE:
   These chamomile values are my best approximation from general tea
   knowledge — not from sourced research. They should FEEL roughly
   right so the interaction can be evaluated. Real values may differ
   significantly. Flag as PLACEHOLDER until sourced during research.
   ────────────────────────────────────────────────────────────── */

export const EXTRACTION_PROFILES = {
  chamomile: [
    {
      tempC: 75, timeS: 180,
      flavors: ["floral", "grassy", "light"],
      effects: [
        ["calm", 2],
        ["sleepy", 1],
        ["bitterness", 0],
      ],
      character: "A morning chamomile — delicate, barely sedative. Honey water with floral lift.",
    },
    {
      tempC: 90, timeS: 300,
      flavors: ["honeyed", "floral", "warm"],
      effects: [
        ["calm", 4],
        ["sleepy", 3],
        ["bitterness", 1],
      ],
      character: "The standard cup. Full honey-floral body, clear calming effect.",
    },
    {
      tempC: 100, timeS: 420,
      flavors: ["honeyed", "floral", "warm", "earthy"],
      effects: [
        ["calm", 4],
        ["sleepy", 5],
        ["bitterness", 2],
      ],
      character: "The sleepy-time version. Maximum apigenin, fuller and slightly tannic.",
    },
  ],
};

/* ──────────────────────────────────────────────────────────────
   Interpolation helpers

   Given a target (tempC, timeS) and a list of profiles, find the
   two profiles to interpolate between (or exact match) and blend
   their flavor/effect data.

   Strategy for v1 (simple):
   - Profiles are sorted by tempC. Find the bracketing pair.
   - Interpolate effects linearly.
   - Flavors: union of both bracketing profiles' flavor lists.
     Not perfect (a flavor "turns on" abruptly as you cross the
     midpoint) but good enough to see the shape.
   - Character: pick the nearer profile's character line.

   Time slider works the same way along the timeS dimension.
   When temp AND time both change, we weight by whichever has
   moved further from its nearest anchor. Simplification — real
   extraction would be a 2D surface, not two independent 1D curves.
   ────────────────────────────────────────────────────────────── */

// Find the two profiles bracketing target along `axis` ("tempC" or "timeS").
// Returns [lower, upper, t] where t is the 0-1 position between them.
function bracket(profiles, target, axis) {
  const sorted = [...profiles].sort((a, b) => a[axis] - b[axis]);
  if (target <= sorted[0][axis]) return [sorted[0], sorted[0], 0];
  if (target >= sorted[sorted.length - 1][axis]) {
    return [sorted[sorted.length - 1], sorted[sorted.length - 1], 0];
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i][axis] && target <= sorted[i + 1][axis]) {
      const span = sorted[i + 1][axis] - sorted[i][axis];
      const t = span === 0 ? 0 : (target - sorted[i][axis]) / span;
      return [sorted[i], sorted[i + 1], t];
    }
  }
  return [sorted[0], sorted[0], 0];
}

// Linearly blend effect vectors: for each effect tag, take weighted
// sum of values from the two profiles. Missing tags count as 0.
function blendEffects(lower, upper, t) {
  const tags = new Set([
    ...lower.effects.map(([tag]) => tag),
    ...upper.effects.map(([tag]) => tag),
  ]);
  const out = [];
  for (const tag of tags) {
    const lo = lower.effects.find(([tg]) => tg === tag)?.[1] ?? 0;
    const hi = upper.effects.find(([tg]) => tg === tag)?.[1] ?? 0;
    const value = lo * (1 - t) + hi * t;
    out.push([tag, Math.round(value * 10) / 10]); // one decimal
  }
  // Sort descending by strength, keep bitterness last regardless
  return out.sort((a, b) => {
    if (a[0] === "bitterness") return 1;
    if (b[0] === "bitterness") return -1;
    return b[1] - a[1];
  });
}

// Union of flavor tags from bracketing profiles.
function blendFlavors(lower, upper) {
  return Array.from(new Set([...lower.flavors, ...upper.flavors]));
}

// Pick the character line from whichever profile we're closer to.
function blendCharacter(lower, upper, t) {
  return t < 0.5 ? lower.character : upper.character;
}

/**
 * Given target (tempC, timeS) and an ingredient id, return the
 * interpolated extraction profile. If the ingredient doesn't have
 * mock data yet, returns null and the caller should fall back to
 * the static INGREDIENTS data.
 */
export function resolveExtractionProfile(ingredientId, tempC, timeS) {
  const profiles = EXTRACTION_PROFILES[ingredientId];
  if (!profiles || profiles.length === 0) return null;

  // For v1: use temp as the primary axis. When time moves independently,
  // we'll blend along that axis too, using a simple average of the two
  // axis-based lookups. Imperfect but gets the shape across.
  const [tLo, tHi, tempT] = bracket(profiles, tempC, "tempC");
  const [sLo, sHi, timeT] = bracket(profiles, timeS, "timeS");

  // If both axes point to the same profile, easy case.
  if (tLo === tHi && sLo === sHi && tLo === sLo) {
    return {
      flavors: tLo.flavors,
      effects: tLo.effects,
      character: tLo.character,
    };
  }

  // Blend along temp axis primarily; treat time as a modifier.
  const tempBlended = {
    flavors: blendFlavors(tLo, tHi),
    effects: blendEffects(tLo, tHi, tempT),
    character: blendCharacter(tLo, tHi, tempT),
  };

  return tempBlended;
}

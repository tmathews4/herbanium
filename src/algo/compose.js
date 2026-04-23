/* ──────────────────────────────────────────────────────────────
   algo/compose.js — blend composition and candidate-ranking logic. The current implementation is the pre-research placeholder; algorithm phase will rewrite in place.
   ────────────────────────────────────────────────────────────── */

import {
  BLENDS, MOOD_BLENDS, MOOD_CONFLICTS, MOOD_SINGLE_NAMES, PAIR_BLENDS,
} from "../data/blends";
import { INGREDIENTS } from "../data/ingredients";

/* ──────────────────────────────────────────────────────────────
   Brewing profile — derive temp/time from constituent ingredients.

   The spec's prescription: "temperature as range intersection."
   - First try the intersection of all ingredient tempC ranges.
     If it's non-empty, brew at its midpoint — everyone is happy.
   - If empty, fall back to grams-weighted dominance: the most-present
     ingredient's midpoint wins, and we note which ingredients fall
     outside the chosen window. That's the "dominant compromise" case
     (sencha + a dash of peppermint → brew at sencha's temp, accept
     the peppermint extracts lightly).
   Time is grams-weighted from each ingredient's timeS range.
   ────────────────────────────────────────────────────────────── */
export function computeBrewProfile(ingredients) {
  if (!ingredients || !ingredients.length) {
    return { tempC: 95, tempRange: null, timeS: 300, compatible: true, outsiders: [] };
  }

  const totalG = ingredients.reduce((s, { g }) => s + g, 0);

  const intMin = Math.max(...ingredients.map(({ id }) => INGREDIENTS[id].tempC[0]));
  const intMax = Math.min(...ingredients.map(({ id }) => INGREDIENTS[id].tempC[1]));

  // grams-weighted time, rounded to the nearest 30s
  const wTime = ingredients.reduce((s, { id, g }) => {
    const [t1, t2] = INGREDIENTS[id].timeS;
    return s + ((t1 + t2) / 2) * (g / totalG);
  }, 0);
  const timeS = Math.round(wTime / 30) * 30;

  if (intMin <= intMax) {
    // Clean intersection — everyone brews in the same window.
    return {
      tempC: Math.round((intMin + intMax) / 2 / 5) * 5,
      tempRange: [intMin, intMax],
      timeS,
      compatible: true,
      outsiders: [],
    };
  }

  // No overlap — weighted-grams dominance. Find the ingredients that
  // fall outside the chosen brewing window (the "cost" of this blend).
  const wTemp = ingredients.reduce((s, { id, g }) => {
    const [t1, t2] = INGREDIENTS[id].tempC;
    return s + ((t1 + t2) / 2) * (g / totalG);
  }, 0);
  const tempC = Math.round(wTemp / 5) * 5;

  const outsiders = ingredients
    .filter(({ id }) => {
      const [lo, hi] = INGREDIENTS[id].tempC;
      return tempC < lo - 2 || tempC > hi + 2;
    })
    .map(({ id }) => id);

  return { tempC, tempRange: null, timeS, compatible: false, outsiders };
}

// The base resolver. Deterministic — same moods + flavor always → same blend.
// Now genuinely uses flavor to influence composition (it didn't before —
// this was a real bug).
export function resolveBlend(moods, flavor) {
  const conflict = MOOD_CONFLICTS.find(([a, b]) => moods.includes(a) && moods.includes(b)) || null;

  if (moods.length === 0) {
    return {
      name: "—", subtitle: "pick a mood to begin",
      ingredients: [], tempC: 95, timeS: 300, effects: [],
      empty: true, conflict: null, moods: [],
    };
  }

  let base;
  if (moods.length === 1) {
    const m = moods[0];
    const b = MOOD_BLENDS[m];
    const [name, subtitle] = MOOD_SINGLE_NAMES[m];
    base = {
      name, subtitle,
      ingredients: b.ings.map(([id, g]) => ({ id, g })),
      tempC: b.temp, timeS: b.time, effects: b.effects,
      conflict, moods,
    };
  } else if (moods.length === 2) {
    const key = [...moods].sort().join("+");
    const curated = PAIR_BLENDS[key];
    if (curated) {
      base = {
        name: curated.name, subtitle: curated.subtitle,
        ingredients: curated.ings.map(([id, g]) => ({ id, g })),
        tempC: curated.temp, timeS: curated.time, effects: curated.effects,
        conflict, moods,
      };
    }
  }

  if (!base) {
    // Fallback composition: merge ingredient pools by summed grams,
    // average temperature, average time.
    const mergedG = {};
    let tempSum = 0, timeSum = 0;
    moods.forEach(m => {
      const b = MOOD_BLENDS[m];
      b.ings.forEach(([id, g]) => { mergedG[id] = (mergedG[id] || 0) + g / moods.length; });
      tempSum += b.temp;
      timeSum += b.time;
    });
    const ingredients = Object.entries(mergedG)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, g]) => ({ id, g: Math.round(g * 10) / 10 }));

    const effTable = {};
    moods.forEach(m => {
      MOOD_BLENDS[m].effects.slice(0, 2).forEach(([tag, n]) => {
        effTable[tag] = Math.max(effTable[tag] || 0, Math.round(n * 0.85));
      });
    });
    const effects = Object.entries(effTable).sort((a, b) => b[1] - a[1]).slice(0, 3);

    base = {
      name: conflict ? "Uneasy Blend" : "Composition",
      subtitle: conflict ? "these moods pull apart" : `for ${moods.join(" · ")}`,
      ingredients, tempC: Math.round(tempSum / moods.length / 5) * 5,
      timeS: Math.round(timeSum / moods.length / 30) * 30,
      effects, conflict, moods,
    };
  }

  // If flavor is selected, re-weight the ingredient pool to emphasize matching flavors.
  // Keeps the same ingredients but adjusts their grams — heavier on flavor-matches.
  if (flavor && base.ingredients.length > 0) {
    base = {
      ...base,
      ingredients: base.ingredients.map(ing => {
        const meta = INGREDIENTS[ing.id];
        const matches = meta?.flavors?.includes(flavor);
        return { ...ing, g: matches ? Math.round(ing.g * 1.25 * 10) / 10 : ing.g };
      }),
    };
  }

  // Attach temperature-compatibility metadata. computeBrewProfile returns
  // `compatible: false` + an `outsiders` list when the ingredients don't share
  // a brewing window — useful for surfacing a gentle warning downstream.
  // Note: we keep base.tempC and base.timeS (curated) rather than overwriting
  // with the profile's computed values — the curated ones reflect intent.
  if (base.ingredients.length > 0) {
    const profile = computeBrewProfile(base.ingredients);
    base = {
      ...base,
      compatible: profile.compatible,
      outsiders: profile.outsiders,
    };
  }

  return base;
}

// Simple complementary-flavor map: each flavor has a short list of flavors
// that pair well as accents. Drives axis-aware candidate generation.
export const FLAVOR_COMPLEMENTS = {
  floral:  ["citrus", "honeyed", "grassy"],
  earthy:  ["spiced", "smoky", "mineral"],
  citrus:  ["floral", "spiced", "grassy"],
  spiced:  ["earthy", "sweet", "citrus"],
  minty:   ["citrus", "floral", "sweet"],
  fruity:  ["floral", "spiced", "honeyed"],
  sweet:   ["spiced", "floral", "earthy"],
  grassy:  ["citrus", "floral", "mineral"],
  smoky:   ["earthy", "spiced", "sweet"],
  mineral: ["earthy", "grassy"],
  honeyed: ["floral", "fruity"],
};

// Simple mood-neighbor map: when flavor is primary, we can suggest an
// alternate mood that shares a natural affinity with the user's pick.
export const MOOD_NEIGHBORS = {
  calm:    ["sleepy", "settle"],
  focus:   ["energy", "calm"],
  energy:  ["focus"],
  sleepy:  ["calm", "settle"],
  comfort: ["settle", "calm"],
  settle:  ["comfort", "calm"],
};

// Build a flavor-accent variant — holds mood constant, swaps in an ingredient
// carrying a specified ACCENT flavor. Reduces base grams slightly to make room.
export function buildAccentVariantByFlavor(primary, accentFlavor) {
  if (!accentFlavor || !primary.ingredients?.length) return null;

  const existingIds = primary.ingredients.map(i => i.id);
  const carriers = Object.entries(INGREDIENTS).filter(
    ([id, ing]) => ing.flavors?.includes(accentFlavor) && !existingIds.includes(id)
  );
  if (carriers.length === 0) return null;

  // Prefer one that pairs well with any existing ingredient
  const paired = carriers.find(([id, ing]) =>
    existingIds.some(eid =>
      (INGREDIENTS[eid].pairs || []).includes(id) ||
      (ing.pairs || []).includes(eid)
    )
  );
  const [pickedId, pickedIng] = paired || carriers[0];

  return {
    name: `${primary.name} · ${accentFlavor} accent`,
    subtitle: `lifted with ${pickedIng.name.toLowerCase()}`,
    ingredients: [
      ...primary.ingredients.map(i => ({ ...i, g: Math.round(i.g * 0.85 * 10) / 10 })),
      { id: pickedId, g: 0.5 },
    ],
    tempC: primary.tempC,
    timeS: primary.timeS,
    effects: primary.effects,
    conflict: primary.conflict,
    moods: primary.moods,
  };
}

// Build a mood-shift variant — holds flavor roughly constant, nudges the
// blend toward a neighboring mood by recomputing against that mood's recipe.
export function buildAccentVariantByMood(primaryMood, neighborMood, flavor) {
  const neighborBase = resolveBlend([neighborMood], flavor);
  if (neighborBase.empty) return null;

  return {
    name: `${neighborBase.name} · for ${primaryMood}-leaning days`,
    subtitle: `a ${neighborMood} take on the same palate`,
    ingredients: neighborBase.ingredients,
    tempC: neighborBase.tempC,
    timeS: neighborBase.timeS,
    effects: neighborBase.effects,
    conflict: null,
    moods: [neighborMood],
  };
}

// Multi-candidate resolver, axis-aware. Returns 1–3 blends.
// Always leads with the primary match. Accent candidates vary along the
// NON-primary axis: when primaryAxis is "feel", accents explore flavor
// variations; when "taste", accents explore mood variations.
export function resolveCandidates(moods, flavor, primaryAxis = "feel") {
  if (moods.length === 0) return [];

  const primary = resolveBlend(moods, flavor);
  const candidates = [{ ...primary, kind: "primary", kindLabel: "closest match" }];

  if (primaryAxis === "feel") {
    // User cares about mood — vary across flavor axis.
    // If flavor is selected, try a COMPLEMENTARY flavor accent first.
    // If no flavor, or complement generation fails, try the user's chosen
    // flavor as a doubled-down accent.
    const complements = flavor ? (FLAVOR_COMPLEMENTS[flavor] || []) : [];
    for (const comp of complements) {
      const v = buildAccentVariantByFlavor(primary, comp);
      if (v) {
        candidates.push({ ...v, kind: "accent", kindLabel: `${comp} accent` });
        break;
      }
    }
    // If we still haven't added an accent and user picked a flavor,
    // try doubling down on that flavor as a fallback
    if (candidates.length === 1 && flavor) {
      const v = buildAccentVariantByFlavor(primary, flavor);
      if (v) candidates.push({ ...v, kind: "accent", kindLabel: `${flavor}-forward` });
    }

    // Tradition fits a mood-led view — add if one matches
    const tradition = BLENDS.find(b =>
      b.tradition && moods.includes(b.mood) &&
      !candidates.some(c => c.name === b.name)
    );
    if (tradition) {
      candidates.push({
        ...tradition, kind: "tradition",
        kindLabel: `traditional · ${tradition.tradition}`,
      });
    }
  } else {
    // User cares about taste — vary across mood axis.
    // Try mood-neighbor first: same flavor, different mood emphasis.
    const primaryMood = moods[0];
    const neighbors = MOOD_NEIGHBORS[primaryMood] || [];
    for (const nb of neighbors) {
      if (moods.includes(nb)) continue;
      const v = buildAccentVariantByMood(primaryMood, nb, flavor);
      if (v) {
        candidates.push({ ...v, kind: "accent", kindLabel: `${nb}-leaning` });
        break;
      }
    }

    // Traditions that share the selected flavor fit a taste-led view
    if (flavor) {
      const flavorTradition = BLENDS.find(b =>
        b.tradition && b.flavor === flavor &&
        !candidates.some(c => c.name === b.name)
      );
      if (flavorTradition) {
        candidates.push({
          ...flavorTradition, kind: "tradition",
          kindLabel: `traditional · ${flavorTradition.tradition}`,
        });
      }
    }
  }

  return candidates.slice(0, 3);
}

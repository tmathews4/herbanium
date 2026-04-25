/* ──────────────────────────────────────────────────────────────
   algo/compose.js — blend composition and candidate-ranking logic. The current implementation is the pre-research placeholder; algorithm phase will rewrite in place.
   ────────────────────────────────────────────────────────────── */

import {
  BLENDS, MOOD_BLENDS, MOOD_CONFLICTS, MOOD_SINGLE_NAMES, PAIR_BLENDS,
} from "../data/blends.js";
import { INGREDIENTS } from "../data/ingredients.js";

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

/* ──────────────────────────────────────────────────────────────
   resolveBlendAtBrew — live blend profile at given brew conditions

   Given a blend's ingredients and a specific (tempC, timeS) the user
   has dialed in via sliders, compute the combined effect/flavor
   profile of the blend AT THOSE CONDITIONS.

   For each ingredient:
     1. Look up its extraction profile at the given temp/time
        (via resolveExtractionProfile from data/extractionProfiles).
        If no mock profile exists, fall back to the ingredient's
        flat effects list.
     2. Check whether the ingredient is "in its range" at this temp
        (flag for per-ingredient indicator in the UI).

   Combine across ingredients:
     - Effects: grams-weighted average. Each ingredient contributes
       its effects vector weighted by its share of total grams. Bitterness
       is summed (not averaged) since multiple astringent ingredients
       compound their bitterness in the cup.
     - Flavors: union across all ingredients (with gram-weighted
       prominence left to v2).
     - Compatibility: list of ingredients outside their preferred
       temp range at this setting. Empty list = fully compatible.

   This function is the hot path of the blend explorer UI — called
   on every slider change, needs to stay fast. It's also the slot
   where the eventual real algorithm lives: today it's linear
   weighted-averaging, later it may incorporate confidence tiers,
   synergy bonuses, conflict penalties. Same interface, same call
   site; internals evolve.
   ────────────────────────────────────────────────────────────── */

import { resolveExtractionProfile } from "../data/extractionProfiles.js";
import {
  applyMasking, applyEffectSynergies, buildWarnings,
} from "./perception.js";

/**
 * resolveBlendAtBrew — full perception pipeline.
 *
 *   ingredients ──► (1) per-ingredient extraction profile lookup
 *                ──► (2) grams-weighted sum into raw flavor + effect maps
 *                ──► (3) applyMasking → perceived flavors + masking notes
 *                ──► (4) applyEffectSynergies → synergyTags + paradoxTags
 *                                              + soft-ceilinged effects
 *                ──► (5) buildWarnings (outsiders, masking, ceiling, paradox)
 *                ──► return felt cup
 *
 * Output shape:
 *   {
 *     effects:        [[tag, 0–5], ...] sorted strong → weak, bitterness last
 *     flavors:        [[name, 0–5], ...] sorted strong → weak (perceived)
 *     rawFlavors:     same shape as flavors but pre-masking (debug/UI)
 *     synergyTags:    ["calm focus", "warming digestive", ...]
 *     paradoxTags:    [["warming","cooling"], ...]
 *     warnings:       [{kind, text}, ...]
 *     outsiders:      [name, ...] kept for backward compatibility
 *     perIngredient:  [{id, name, weight, profile, inRange}, ...]
 *   }
 */
export function resolveBlendAtBrew(ingredients, tempC, timeS) {
  if (!ingredients || !ingredients.length) {
    return {
      effects: [],
      flavors: [],
      rawFlavors: [],
      synergyTags: [],
      paradoxTags: [],
      warnings: [],
      outsiders: [],
      perIngredient: [],
      character: "",
    };
  }

  const totalG = ingredients.reduce((s, { g }) => s + g, 0);

  // (1) Per-ingredient contributions. Falls back to flat ingredient
  // flavors/effects if no extraction profile exists for that id.
  const contributions = ingredients.map(({ id, g }) => {
    const meta = INGREDIENTS[id];
    const weight = g / totalG;

    const profile = resolveExtractionProfile(id, tempC, timeS) || {
      flavors: normalizeFlavors(meta.flavors || []),
      effects: meta.effects || [],
      character: "",
    };

    const [tMin, tMax] = meta.tempC;
    const inRange = tempC >= tMin && tempC <= tMax;

    return { id, name: meta.name, weight, profile, inRange };
  });

  // (2) Grams-weighted accumulation into raw flavor + effect maps.
  const rawFlavors = {};
  const rawEffects = {};
  for (const { weight, profile } of contributions) {
    for (const [name, strength] of profile.flavors) {
      rawFlavors[name] = (rawFlavors[name] || 0) + strength * weight;
    }
    for (const [tag, strength] of profile.effects) {
      rawEffects[tag] = (rawEffects[tag] || 0) + strength * weight;
    }
  }

  // (3) Masking pass — bitter, smoky, astringent suppress gentler notes.
  const { perceived: perceivedFlavorMap, maskingNotes } = applyMasking(rawFlavors);

  // (4) Synergy + soft-ceiling pass.
  const { effects: perceivedEffectMap, synergyTags, paradoxTags } =
    applyEffectSynergies(rawEffects);

  // Convert maps to sorted tuple arrays for the UI layer.
  // Drop sub-threshold flavors (< 0.5) — they're noise.
  const flavors = Object.entries(perceivedFlavorMap)
    .filter(([, v]) => v >= 0.5)
    .map(([name, v]) => [name, Math.round(v * 10) / 10])
    .sort((a, b) => b[1] - a[1]);

  const effects = Object.entries(perceivedEffectMap)
    .map(([tag, v]) => [tag, Math.round(v * 10) / 10])
    .sort((a, b) => {
      if (a[0] === "bitterness") return 1;
      if (b[0] === "bitterness") return -1;
      return b[1] - a[1];
    });

  const rawFlavorTuples = Object.entries(rawFlavors)
    .map(([name, v]) => [name, Math.round(v * 10) / 10])
    .sort((a, b) => b[1] - a[1]);

  const outsiders = contributions.filter(c => !c.inRange).map(c => c.name);

  // (5a) Cup-level warnings — what the average reads.
  const cupWarnings = buildWarnings({
    outsiders,
    maskingNotes,
    perceivedEffects: perceivedEffectMap,
    perceivedFlavors: perceivedFlavorMap,
    paradoxTags,
  });

  // (5b) Per-ingredient over-pull check. The mass-weighted sum dilutes
  // each ingredient's failure mode by everything else in the cup — so
  // 1g of over-pulled Assam in a 6g blend never crosses the cup-level
  // tannin threshold, even though that leaf is genuinely being abused.
  // Walk each ingredient's standalone profile at the current brew and
  // surface its name if it fires tannin or aromatic.
  const individualWarnings = [];
  const seenIndividual = new Set();
  for (const { name, profile } of contributions) {
    const fMap = Object.fromEntries(profile.flavors);
    const eMap = Object.fromEntries(profile.effects);
    const ingWarnings = buildWarnings({
      perceivedFlavors: fMap,
      perceivedEffects: eMap,
    });
    for (const w of ingWarnings) {
      if (w.kind !== "tannin" && w.kind !== "aromatic") continue;
      const key = `${name}|${w.kind}`;
      if (seenIndividual.has(key)) continue;
      seenIndividual.add(key);
      const lc = w.text.charAt(0).toLowerCase() + w.text.slice(1);
      individualWarnings.push({
        kind: w.kind,
        text: `${name} is being over-pulled — ${lc}`,
      });
    }
  }

  // Merge cup-level and individual warnings. Drop a cup-level tannin
  // duplicate if any individual warning of the same kind already fires
  // — the named version is more actionable.
  const warnings = [
    ...cupWarnings.filter(w => {
      if (w.kind !== "tannin" && w.kind !== "aromatic") return true;
      return !individualWarnings.some(iw => iw.kind === w.kind);
    }),
    ...individualWarnings,
  ];

  return {
    effects,
    flavors,
    rawFlavors: rawFlavorTuples,
    synergyTags,
    paradoxTags,
    warnings,
    outsiders,
    perIngredient: contributions,
  };
}

/**
 * Convert a string-array of flavors (legacy fallback path) into
 * [name, strength] tuples for ingredients without extraction profiles.
 * Position-based descent: top note 4, accents stepping down.
 */
function normalizeFlavors(flavorList) {
  if (!flavorList || flavorList.length === 0) return [];
  if (Array.isArray(flavorList[0])) return flavorList; // already tuples
  return flavorList.map((f, i) => [f, Math.max(1, 4 - i)]);
}

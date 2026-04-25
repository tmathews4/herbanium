/* ──────────────────────────────────────────────────────────────
   algo/compose.js — blend composition and candidate-ranking logic. The current implementation is the pre-research placeholder; algorithm phase will rewrite in place.
   ────────────────────────────────────────────────────────────── */

import {
  BLENDS, MOOD_BLENDS, MOOD_CONFLICTS, MOOD_SINGLE_NAMES, PAIR_BLENDS,
} from "../data/blends.js";
import { INGREDIENTS } from "../data/ingredients.js";

// How much steep-time slack counts as the same brew. Used by the
// tradition-over-literature notice and the research-aligned
// recommendation line. The user's framing was "off by a minute or
// two" — 120s captures that and matches most ingredients' wiggle
// room within their preferred window. Temp deviations always count
// (no tolerance) because they shift extraction much more sharply.
export const TRADITION_TIME_TOLERANCE_S = 120;

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
export function computeBrewProfile(ingredients, opts = {}) {
  const { leadOnly = false } = opts;
  if (!ingredients || !ingredients.length) {
    return {
      tempC: 95, tempRange: null, timeS: 300, timeRange: null,
      compatible: true, outsiders: [],
    };
  }

  // When the caller opts into leadOnly, restrict the math to ingredients
  // tagged `lead` (or untagged — default is lead). Accents and catalysts
  // are stylistic adjuncts and would skew the recommended brew toward
  // their preferred window even though the recipe doesn't want them to.
  const considered = leadOnly
    ? ingredients.filter(i => !i.role || i.role === "lead")
    : ingredients;
  // Empty leads (rare misconfiguration) — fall back to using all.
  const pool = considered.length > 0 ? considered : ingredients;

  const totalG = pool.reduce((s, { g }) => s + g, 0);

  // 2D sweet-spot search: each ingredient's preferred brew is a
  // rectangle [tempC range] × [timeS range]. Intersect on each axis;
  // a non-empty intersection on both axes means there's a single
  // brewing window that satisfies every ingredient — pick its center.
  // If an axis has no intersection, fall back to the grams-weighted
  // midpoint on that axis (closest reasonable compromise).
  const tIntMin = Math.max(...pool.map(({ id }) => INGREDIENTS[id].tempC[0]));
  const tIntMax = Math.min(...pool.map(({ id }) => INGREDIENTS[id].tempC[1]));
  const sIntMin = Math.max(...pool.map(({ id }) => INGREDIENTS[id].timeS[0]));
  const sIntMax = Math.min(...pool.map(({ id }) => INGREDIENTS[id].timeS[1]));

  const tempIntersects = tIntMin <= tIntMax;
  const timeIntersects = sIntMin <= sIntMax;

  // Round to 1°C precision (matches the slider step). Earlier code
  // snapped to 5°C "for cleaner numbers" — but on a tight range like
  // Ceylon Black's [95, 100] that pushes the midpoint (97.5) up to 100,
  // which is exactly the over-extracted anchor. Round to integers so
  // the recommendation lands at 98°C — inside the standard-cup window.
  let tempC;
  if (tempIntersects) {
    tempC = Math.round((tIntMin + tIntMax) / 2);
  } else {
    const wTemp = pool.reduce((s, { id, g }) => {
      const [t1, t2] = INGREDIENTS[id].tempC;
      return s + ((t1 + t2) / 2) * (g / totalG);
    }, 0);
    tempC = Math.round(wTemp);
  }

  // Time fallback differs from temp because the warning model is
  // asymmetric: pulling past an ingredient's time max fires an
  // over-pull warning, but steeping below its min is silent (just
  // weak extraction). So when the time ranges don't intersect, pick
  // the lowest max — `sIntMax` is min(all sMax) — so no ingredient
  // is over-pulled. Ingredients with longer windows (reishi, valerian,
  // mushroom decoctions) simply under-extract; the user can push the
  // slider longer if they want them fully drawn.
  let timeS;
  if (timeIntersects) {
    timeS = Math.round((sIntMin + sIntMax) / 2 / 30) * 30;
  } else {
    timeS = Math.round(sIntMax / 30) * 30;
  }

  // Outsiders: ingredients whose temp range doesn't include the chosen
  // brew temp. Time is informational only — ingredients pulled past
  // their time window get the per-ingredient over-pull warning instead.
  const outsiders = pool
    .filter(({ id }) => {
      const [lo, hi] = INGREDIENTS[id].tempC;
      return tempC < lo - 2 || tempC > hi + 2;
    })
    .map(({ id }) => id);

  return {
    tempC,
    tempRange: tempIntersects ? [tIntMin, tIntMax] : null,
    timeS,
    timeRange: timeIntersects ? [sIntMin, sIntMax] : null,
    compatible: tempIntersects && timeIntersects,
    outsiders,
  };
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

  // MOOD_BLENDS / PAIR_BLENDS use object-form ingredients [{id, g, role?}]
  // alongside the legacy tuple form [[id, g], ...]. Normalize on read so
  // the rest of the resolver doesn't have to care which it received.
  const normIngs = (raw) => raw.map(item =>
    Array.isArray(item) ? { id: item[0], g: item[1] } : { ...item }
  );

  let base;
  if (moods.length === 1) {
    const m = moods[0];
    const b = MOOD_BLENDS[m];
    const [name, subtitle] = MOOD_SINGLE_NAMES[m];
    base = {
      name, subtitle,
      ingredients: normIngs(b.ings),
      tempC: b.temp, timeS: b.time, effects: b.effects,
      style: b.style,
      conflict, moods,
    };
  } else if (moods.length === 2) {
    const key = [...moods].sort().join("+");
    const curated = PAIR_BLENDS[key];
    if (curated) {
      base = {
        name: curated.name, subtitle: curated.subtitle,
        ingredients: normIngs(curated.ings),
        tempC: curated.temp, timeS: curated.time, effects: curated.effects,
        style: curated.style,
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
      normIngs(b.ings).forEach(({ id, g }) => { mergedG[id] = (mergedG[id] || 0) + g / moods.length; });
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

// A blend "matches" a mood when its primary mood tag is the user's
// pick OR when the mood appears as a meaningfully present effect
// (strength >= 2). This lets effect-axis moods (soothing, warming,
// cooling, digestive, grounding, uplifting) find candidates without
// re-tagging every blend's `mood` field.
function blendMatchesMood(b, mood) {
  if (b.mood === mood) return true;
  return (b.effects || []).some(([k, v]) => k === mood && v >= 2);
}

// A blend matches a flavor when its primary flavor tag is the user's
// pick OR when at least one ingredient lists that flavor in its
// `flavors` array. Lets sensory-register flavors (grassy, smoky,
// honeyed, umami, woody, roasted, mineral) match blends whose
// constituents express them even if the blend's top-level
// `flavor` field uses a coarser label.
function blendMatchesFlavor(b, flavor) {
  if (b.flavor === flavor) return true;
  return (b.ingredients || []).some(ing => {
    const meta = INGREDIENTS[ing.id];
    return meta && (meta.flavors || []).includes(flavor);
  });
}

// Multi-candidate resolver, axis-aware. Returns 1–4 blends.
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

    // Tradition fits a mood-led view — pick the shortest match so a
    // pure single-ingredient steep (Sencha properly, Darjeeling neat,
    // Hojicha at Dusk) wins over a multi-ingredient blend at the same
    // mood. Pure teas are the truest expression of a tradition.
    const tradition = BLENDS
      .filter(b => b.tradition && moods.some(m => blendMatchesMood(b, m)) &&
        !candidates.some(c => c.name === b.name))
      .sort((a, b) => a.ingredients.length - b.ingredients.length)[0];
    if (tradition) {
      candidates.push({
        ...tradition, kind: "tradition",
        kindLabel: `traditional · ${tradition.tradition}`,
      });
    }

    // Experimental Herbanium blends are also eligible — pulls in custom
    // recipes like Tom Foolery so the suggestion row isn't limited to
    // legacy traditions. The UI marks these with a blue outline.
    const experimental = BLENDS
      .filter(b => b.experimental && moods.some(m => blendMatchesMood(b, m)) &&
        !candidates.some(c => c.name === b.name))
      .sort((a, b) => a.ingredients.length - b.ingredients.length)[0];
    if (experimental) {
      candidates.push({
        ...experimental, kind: "experimental",
        kindLabel: "Herbanium experiment",
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

    // Traditions that share the selected flavor fit a taste-led view —
    // shortest match wins so a pure tea surfaces over a blend.
    if (flavor) {
      const flavorTradition = BLENDS
        .filter(b => b.tradition && blendMatchesFlavor(b, flavor) &&
          !candidates.some(c => c.name === b.name))
        .sort((a, b) => a.ingredients.length - b.ingredients.length)[0];
      if (flavorTradition) {
        candidates.push({
          ...flavorTradition, kind: "tradition",
          kindLabel: `traditional · ${flavorTradition.tradition}`,
        });
      }
      // Experimental flavor matches for the taste-led view.
      const flavorExperimental = BLENDS
        .filter(b => b.experimental && blendMatchesFlavor(b, flavor) &&
          !candidates.some(c => c.name === b.name))
        .sort((a, b) => a.ingredients.length - b.ingredients.length)[0];
      if (flavorExperimental) {
        candidates.push({
          ...flavorExperimental, kind: "experimental",
          kindLabel: "Herbanium experiment",
        });
      }
    }
  }

  // Final order: pure-tea steeps first, mixes after. The kindLabel still
  // tells the user *what* each candidate is; the position tells them
  // how simple it is. A single-ingredient match always rises to the top
  // whether it's the primary, a tradition, or an experiment.
  return candidates
    .sort((a, b) => a.ingredients.length - b.ingredients.length)
    .slice(0, 4);
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
 * baselineTempC/baselineTimeS (optional): the curator's chosen brew or
 * the algorithm's recommendation. Per-ingredient over-pull warnings only
 * fire when the live tempC/timeS is past the baseline on either axis —
 * the baseline brew itself is treated as accepted compromise.
 *
 * curated (optional, default false): when true AND the live brew matches
 * the baseline exactly, also suppress cup-level outsider warnings and
 * empty `brew.outsiders`. The curator already accepted that ingredient X
 * sits outside its preferred temp at this brew; the warning is meaningful
 * only when the user moves away. For algorithm-derived (custom) blends,
 * leave outsiders visible at baseline since the user hasn't signed off.
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
 *     traditionNote:  true when curated && at-baseline && suppression
 *                     actually carried weight (raw outsiders or per-
 *                     ingredient warnings would have fired)
 *   }
 */
export function resolveBlendAtBrew(ingredients, tempC, timeS, baselineTempC, baselineTimeS, curated = false) {
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
  const contributions = ingredients.map(({ id, g, role }) => {
    const meta = INGREDIENTS[id];
    const weight = g / totalG;
    const ingRole = role || "lead";

    const profile = resolveExtractionProfile(id, tempC, timeS) || {
      flavors: normalizeFlavors(meta.flavors || []),
      effects: meta.effects || [],
      character: "",
    };

    const [tMin, tMax] = meta.tempC;
    const inRange = tempC >= tMin && tempC <= tMax;

    return { id, name: meta.name, weight, profile, inRange, role: ingRole };
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
    .filter(([, v]) => v > 0)
    .sort((a, b) => {
      if (a[0] === "bitterness") return 1;
      if (b[0] === "bitterness") return -1;
      return b[1] - a[1];
    });

  const rawFlavorTuples = Object.entries(rawFlavors)
    .map(([name, v]) => [name, Math.round(v * 10) / 10])
    .sort((a, b) => b[1] - a[1]);

  // Only lead-role ingredients can fire outsider warnings. Accents and
  // catalysts are stylistic adjuncts — a 0.05g pinch of black pepper at
  // the wrong temp isn't a problem worth surfacing.
  const rawOutsiders = contributions
    .filter(c => !c.inRange && c.role === "lead")
    .map(c => c.name);

  // For curated blends sitting exactly on the curator's chosen brew,
  // suppress cup-level outsider warnings — the curator already accepted
  // that an ingredient lives at the edge of its window. The moment the
  // user moves either slider, fall back to the honest list.
  const atCuratedBaseline = curated
    && baselineTempC != null && baselineTimeS != null
    && tempC === baselineTempC && timeS === baselineTimeS;
  const outsiders = atCuratedBaseline ? [] : rawOutsiders;

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
  //
  // Suppress these warnings at or below the baseline brew (curator's
  // tempC/timeS, or the algorithm's recommendation) — that brew is
  // treated as accepted compromise. Fire only when the user has
  // pushed *past* it on either axis.
  const baselineKnown = baselineTempC != null && baselineTimeS != null;
  const pushedHarder = !baselineKnown
    || tempC > baselineTempC
    || timeS > baselineTimeS;
  // Walk every lead ingredient — we need to know what *would* fire
  // even when suppressed, so the tradition-over-literature notice can
  // mention only the blends where suppression actually carried weight.
  // Accent and catalyst ingredients skip this entirely: their "abuse"
  // is the point of the recipe (a pinch of cardamom in a 20-min
  // decoction isn't being over-pulled — it's flavoring a broth).
  const allIndividualWarnings = [];
  const seenIndividual = new Set();
  for (const { name, profile, role } of contributions) {
    if (role !== "lead") continue;
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
      allIndividualWarnings.push({
        kind: w.kind,
        text: `${name} is being over-pulled — ${lc}`,
      });
    }
  }
  const individualWarnings = pushedHarder ? allIndividualWarnings : [];

  // Tradition-over-literature notice fires when at least one lead
  // ingredient is meaningfully outside its preferred window. Temp
  // deviations count strictly (any value outside [tMin, tMax]); time
  // deviations only count when they push past the time range by more
  // than the tolerance. Accents and catalysts are skipped — they're
  // stylistic adjuncts the recipe accepts as stretched.
  const meaningfulDeviation = contributions.some(c => {
    if (c.role !== "lead") return false;
    const meta = INGREDIENTS[c.id];
    const [tMin, tMax] = meta.tempC;
    const [sMin, sMax] = meta.timeS;
    if (tempC < tMin || tempC > tMax) return true;
    if (timeS < sMin - TRADITION_TIME_TOLERANCE_S) return true;
    if (timeS > sMax + TRADITION_TIME_TOLERANCE_S) return true;
    return false;
  });
  const traditionNote = atCuratedBaseline && meaningfulDeviation;

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
    traditionNote,
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


/* ──────────────────────────────────────────────────────────────
   algo/compose.js — blend composition and candidate-ranking logic. The current implementation is the pre-research placeholder; algorithm phase will rewrite in place.
   ────────────────────────────────────────────────────────────── */

import {
  BLENDS, FLAVOR_WORDS, MOOD_BLENDS, MOOD_CONFLICTS, FLAVOR_CONFLICTS,
  flavorMaskStrength, moodMaskStrength, MOOD_SINGLE_NAMES,
  MOOD_WORDS, PAIR_BLENDS,
} from "../data/blends.js";
import { INGREDIENTS } from "../data/ingredients.js";
import { TSP_BY_CATEGORY, REFERENCE_ML } from "../units/units.js";
import { bestCoverageZone, bandTarget } from "./brewBounds.js";
import { wouldCreateUnsafeCombination } from "../data/safety.js";

// How much steep-time slack counts as the same brew. Used by the
// tradition-over-literature notice and the research-aligned
// recommendation line. The user's framing was "off by a minute or
// two" — 120s captures that and matches most ingredients' wiggle
// room within their preferred window. Temp deviations always count
// (no tolerance) because they shift extraction much more sharply.
export const TRADITION_TIME_TOLERANCE_S = 120;
/* ──────────────────────────────────────────────────────────────
   WHAT COUNTS AS A COMPONENT OF THE CUP.

   `role` is the obvious answer and it is the wrong one, because
   ComposeScreen assigns it by ADD ORDER rather than by intent: the
   first ingredient in gets 2 parts and everything after gets 1, so
   `isPrimary` marks exactly one lead no matter what the user built.
   A blend of two equal partners and a blend with a 0.2g seasoning
   both come out as "one lead, one accent".

   Two separate checks were reading role and quietly getting nothing:
   the no-overlap notice is gated on two or more LEADS and so never
   fired from the composer at all, and the under-steep warning fired
   on 0.2g of vanilla in a chai.

   Share of the cup's weight separates them and role cannot. Measured
   across the 49 curated blends, the only leaves reading short of their
   window are vanilla at 9.5% and 6.5% — deliberate seasoning — against
   33.3% for the case these warnings exist for. 0.15 sits between with
   room on both sides: under about a sixth of the pot a leaf flavors
   the cup rather than composing it, and nobody expects seasoning to be
   fully extracted. A genuine lead is a large share by construction, so
   this never silences one.
   ────────────────────────────────────────────────────────────── */
export const MATERIAL_SHARE = 0.15;

/**
 * The ingredients that actually compose this cup, by weight — the ones
 * a warning about extraction should be allowed to name. Catalysts are
 * excluded outright; everything else is judged on its share.
 */
export function materialIngredients(ingredients) {
  const list = (ingredients || []).filter(i => i && i.role !== "catalyst");
  const total = list.reduce((sum, i) => sum + (i.g || 0), 0);
  if (!(total > 0)) return list;
  return list.filter(i => (i.g || 0) / total >= MATERIAL_SHARE);
}

/* ──────────────────────────────────────────────────────────────
   Default register mapping — engine-level lookup that resolves
   the (tempBand+timeBand) pair to a register id. Every ingredient
   with the standard 4 tempZones + 5 timeZones + 5 registerZones
   shape inherits this mapping automatically and only needs to
   declare the register *content* (id + character + moodImpact).

   Per-ingredient `when` arrays on a registerZone are still honored
   as overrides for ingredients with unusual register behavior
   (e.g. an ingredient where "cool+long" should still be aromatic
   instead of balanced — declare `when: ["cool+long", ...]` on the
   aromatic zone and it wins over the default).

   Default coverage of all 4×5 = 20 pairings:
                     under   short      medium    long      over
       under         faint   faint      faint     faint     faint
       cool          faint   aromatic   aromatic  balanced  overpulled
       warm          faint   aromatic   balanced  tonic     overpulled
       hot           faint   aromatic   balanced  tonic     overpulled
   ────────────────────────────────────────────────────────────── */
export const DEFAULT_REGISTER_MAPPING = Object.freeze({
  "under+under":  "faint", "under+short": "faint", "under+medium": "faint",
  "under+long":   "faint", "under+over":  "faint",
  "cool+under":   "faint", "warm+under":  "faint", "hot+under":    "faint",

  "cool+short":   "aromatic", "cool+medium":  "aromatic",
  "warm+short":   "aromatic", "hot+short":    "aromatic",

  "cool+long":    "balanced",
  "warm+medium":  "balanced", "hot+medium":   "balanced",

  "warm+long":    "tonic",    "hot+long":     "tonic",

  "cool+over":    "overpulled",
  "warm+over":    "overpulled", "hot+over":   "overpulled",
});

/* ──────────────────────────────────────────────────────────────
   Brewing profile — derive temp/time from constituent ingredients.lets 

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

  // Inside an intersection the midpoint isn't always optimal — if four
  // ingredients prefer ~85°C and one prefers ~95°C, the midpoint of the
  // intersection sits closer to the lone outlier than the cup wants.
  // Use the grams-weighted centroid of each ingredient's individual
  // midpoint, clamped into the intersection. Same idea on time. This
  // also keeps the cup off the upper edge where the parabolic-decay
  // and astringent-loudness pressure now bites hardest under the new
  // perception modifiers.
  const wTempCentroid = pool.reduce((s, { id, g }) => {
    const [t1, t2] = INGREDIENTS[id].tempC;
    return s + ((t1 + t2) / 2) * (g / totalG);
  }, 0);
  const wTimeCentroid = pool.reduce((s, { id, g }) => {
    const [s1, s2] = INGREDIENTS[id].timeS;
    return s + ((s1 + s2) / 2) * (g / totalG);
  }, 0);

  /* The heaviest lead anchors the compromise search, the same way the
     rail's does. Falls back to the heaviest of anything when nothing is
     explicitly a lead. */
  const zonePool = pool.map(({ id, g, role }) => ({
    id, g, role, tempC: INGREDIENTS[id].tempC, timeS: INGREDIENTS[id].timeS,
  }));
  const zoneLeads = zonePool.filter(i => !i.role || i.role === "lead");
  const zonePrimary = (zoneLeads.length ? zoneLeads : zonePool)
    .slice().sort((a, b) => b.g - a.g)[0];

  let tempC;
  if (tempIntersects) {
    // Round to 1°C precision (matches the slider step). Earlier code
    // snapped to 5°C; integer rounding lands recommendations cleanly
    // inside tight ranges like [95, 100] without nudging to the edge.
    //
    // NOT the midpoint, deliberately: with four ingredients near 85°C
    // and one at 95°C the intersection's middle sits closer to the lone
    // outlier than the cup wants. The weighted centroid already does
    // what "ignore the outliers" is asking for.
    tempC = Math.round(Math.max(tIntMin, Math.min(tIntMax, wTempCentroid)));
  } else {
    /* No window everyone shares — open in the middle of the COMPROMISE
       ZONE the rail actually draws, rather than at a centroid with no
       relationship to it. The app was recommending one region and
       starting you somewhere else. */
    const zone = bestCoverageZone(zonePool, zonePrimary, "tempC");
    tempC = zone
      ? Math.round((zone.range[0] + zone.range[1]) / 2)
      : Math.round(wTempCentroid);
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
    const clamped = Math.max(sIntMin, Math.min(sIntMax, wTimeCentroid));
    timeS = Math.round(clamped / 30) * 30;
  } else {
    /* Toward the compromise zone, but NEVER past the lowest max.
       Both rules matter and they pull against each other: opening
       inside the band the rail draws is what makes the two agree,
       while `sIntMax` is what stops a blend opening already in a
       warning state. assam + matcha + chamomile shows why — its
       compromise zone is 4-7 minutes and matcha's window ends at 30
       seconds, so centering on the band would over-pull matcha on
       arrival. The clamp wins, and the cup opens at 30s: outside the
       band, but not shouting. */
    const zone = bestCoverageZone(zonePool, zonePrimary, "timeS");
    const target = zone ? (zone.range[0] + zone.range[1]) / 2 : sIntMax;
    timeS = Math.round(Math.min(target, sIntMax) / 30) * 30;
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

/* ──────────────────────────────────────────────────────────────
   WHERE "BREW ME THE RECOMMENDATION" ACTUALLY PUTS YOU.

   The band is geometry — brewBounds knows where the leaves agree. It
   does not know how the cup READS there, and those are not the same
   question. Sweeping the catalog turned up 61 ingredient pairs whose
   band center fires a per-ingredient over-pull warning one or two
   degrees above a point in the same band that doesn't: rose + vanilla
   is quiet at 92°C and warns at 93°C. A control labelled RECOMMENDED
   that answers with a cup already being told off is worse than one
   that doesn't move.

   So: geometry proposes, the perception model disposes. Walk the
   band on the slider's own grid, ask what the cup would say at each
   point, and take the quietest — nearest the center when several tie,
   which is nearly always.

   IT ONLY CHOOSES WITHIN THE BAND. If every point in the band warns,
   the center is still the answer: the band is where the research says
   to brew, and this must not talk the user out of the recommendation
   just because the model is grumpy across the whole of it. That case
   is a data problem — an ingredient whose researched window reads as
   over-pulled throughout — and quietly steering away from it would
   hide exactly the thing worth fixing.

   The scan is bounded by the band's width over the slider's step: at
   most a couple of dozen evaluations, on a tap, never during a render.
   ────────────────────────────────────────────────────────────── */

// Per-ingredient over-pull warnings carry a `role`; cup-level ones
// don't. The individual ones are the ones that name a leaf and say it
// is being abused, so they're weighted an order heavier than the
// cup-level reading of the same axis.
export function overPullScore(ingredients, tempC, timeS, { ml } = {}) {
  // No baseline on purpose: an experimental blend gets no suppression
  // in the app either, so scoring with it would pick points that only
  // look quiet on a curated recipe.
  const { warnings } = resolveBlendAtBrew(ingredients, tempC, timeS, undefined, undefined, false, false, { ml });
  let individual = 0, cup = 0;
  for (const w of warnings) {
    if (w.kind !== "tannin" && w.kind !== "aromatic") continue;
    if (w.role) individual++; else cup++;
  }
  return individual * 10 + cup;
}

/**
 * @param ingredients the pot, as passed to resolveBlendAtBrew
 * @param items       non-catalyst entries carrying tempC/timeS windows
 * @param band        { lo, hi } from recommendedBand
 * @param axis        "tempC" | "timeS"
 * @param otherValue  where the OTHER slider is sitting
 * @param step        the slider's step, so the answer is reachable
 * @param rangeMin/rangeMax the slider's own bounds
 * @returns a value on the slider's grid, or null when there's no band
 */
export function recommendedBrewTarget({
  ingredients, items, band, axis, otherValue, step = 1, rangeMin, rangeMax,
}) {
  if (!band) return null;
  const s = step || 1;
  const base = rangeMin != null ? rangeMin : band.lo;
  /* THE BAND CAN SIT OFF THE END OF THE SLIDER. A blend's range is the
     INTERSECTION of its leaves' — assam + matcha + chamomile can only
     reach 15-39s, because matcha shuts at 30 — while the compromise
     zone, which is drawn from the primary lead's window, sits at
     240-300s. Intersecting the two gives an empty interval.

     This used to return null there, and the tap silently did nothing:
     a control that answered "put me on the recommendation" by doing
     nothing at all. Aim at the closest reachable point instead. The
     answer is honest — it really is as near the recommendation as this
     blend's slider goes — and it's the same place the clamp would have
     put you anyway, since a band above the slider's ceiling is exactly
     the case where some leaf closes early. */
  const lo = Math.max(base, band.lo);
  const hi = Math.min(rangeMax != null ? rangeMax : band.hi, band.hi);
  if (hi < lo) {
    /* AND HERE THE CLAMP DOES APPLY. Honoring the request is what
       makes the tap worth having when the band is reachable — you
       asked for the band, you get the band, warning and all. When it
       ISN'T reachable there is no request to honor: the user can't
       see that band, can't drag to it, and the word isn't even drawn
       (see bandWithin in the explorer). Steeping past a leaf's window
       to get closer to something nobody can reach buys nothing and
       costs a ruined leaf. */
    let ceiling = rangeMax != null ? rangeMax : band.hi;
    if (axis === "timeS") {
      for (const ing of items || []) {
        const iMax = (ing && ing[axis] || [])[1];
        if (iMax != null) ceiling = Math.min(ceiling, iMax);
      }
    }
    const aimAt = Math.max(base, Math.min(ceiling, bandTarget({ band })));
    const k = (aimAt - base) / s;
    return base + (axis === "timeS" ? Math.floor(k) : Math.round(k)) * s;
  }

  // Round time DOWN — a 15- or 30-second grid rounded up can step past
  // the top of a narrow band.
  const onGrid = (v) => {
    const k = (v - base) / s;
    const snapped = base + (axis === "timeS" ? Math.floor(k) : Math.round(k)) * s;
    return Math.max(rangeMin != null ? rangeMin : snapped,
      Math.min(rangeMax != null ? rangeMax : snapped, snapped));
  };

  // The geometric answer, including the never-past-the-earliest-close
  // clamp on time. When that clamp lands OUTSIDE the band there is
  // nothing to choose between — a quieter point inside the band would
  // be an over-pull, which is the thing the clamp exists to prevent.
  const aim = bandTarget({ band: { lo, hi } });
  if (aim == null) return null;
  if (aim < lo) return onGrid(aim);

  // The whole band is fair game on both axes. Time used to be capped
  // at the earliest-closing window here, which is the opening-brew rule
  // and made the tap a no-op wherever a leaf closes early — see
  // bandTarget.
  const ceiling = hi;
  const candidates = [];
  for (let v = lo; v <= ceiling + 1e-9; v += s) candidates.push(onGrid(v));
  const aimed = onGrid(aim);
  if (!candidates.includes(aimed)) candidates.push(aimed);
  if (!candidates.length) return aimed;

  let best = aimed, bestScore = Infinity, bestDist = Infinity;
  for (const v of candidates) {
    const score = axis === "tempC"
      ? overPullScore(ingredients, v, otherValue)
      : overPullScore(ingredients, otherValue, v);
    const dist = Math.abs(v - aim);
    if (score < bestScore || (score === bestScore && dist < bestDist)) {
      best = v; bestScore = score; bestDist = dist;
    }
  }
  return best;
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

  // MOOD_BLENDS / PAIR_BLENDS use object-form ingredients
  // [{ id, g, role? }, ...]. Clone before reuse so callers can't
  // mutate the curated source.
  const cloneIngs = (raw) => raw.map(i => ({ ...i }));

  let base;
  if (moods.length === 1) {
    const m = moods[0];
    const b = MOOD_BLENDS[m];
    const [name, subtitle] = MOOD_SINGLE_NAMES[m];
    base = {
      name, subtitle,
      ingredients: cloneIngs(b.ings),
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
        ingredients: cloneIngs(curated.ings),
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
      b.ings.forEach(({ id, g }) => { mergedG[id] = (mergedG[id] || 0) + g / moods.length; });
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
const FLAVOR_COMPLEMENTS = {
  floral:  ["citrus", "honeyed", "grassy"],
  earthy:  ["spiced", "smoky", "mineral"],
  citrus:  ["floral", "spiced", "grassy"],
  spiced:  ["earthy", "sweet", "citrus"],
  minty:   ["citrus", "floral", "sweet"],
  fruity:  ["floral", "spiced", "honeyed"],
  sweet:   ["spiced", "floral", "earthy"],
  grassy:  ["citrus", "floral", "mineral", "vegetal"],
  smoky:   ["earthy", "spiced", "sweet"],
  mineral: ["earthy", "grassy", "umami"],
  honeyed: ["floral", "fruity"],
  umami:   ["mineral", "savory", "grassy"],
  woody:   ["earthy", "smoky", "spiced"],
  roasted: ["nutty", "earthy", "spiced"],
  bitter:  ["earthy", "woody", "spiced"],
  tart:    ["fruity", "citrus", "floral"],
  vegetal: ["grassy", "mineral", "umami"],
  nutty:   ["roasted", "sweet", "honeyed"],
  savory:  ["umami", "vegetal", "earthy"],
};

// Simple mood-neighbor map: when flavor is primary, we can suggest an
// alternate mood that shares a natural affinity with the user's pick.
const MOOD_NEIGHBORS = {
  calm:      ["sleepy", "soothing"],
  focus:     ["energy", "calm", "uplifting"],
  energy:    ["focus", "warming", "uplifting"],
  sleepy:    ["calm", "soothing"],
  comfort:   ["soothing", "calm", "warming"],
  soothing:  ["comfort", "calm", "sleepy"],
  warming:   ["comfort", "energy", "grounding"],
  cooling:   ["digestive", "uplifting", "focus"],
  digestive: ["cooling", "comfort", "calm"],
  grounding: ["comfort", "warming", "calm"],
  uplifting: ["energy", "focus", "cooling"],
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

// Strength of a mood/effect on a blend, 0 if absent. Used by the
// conflict-aware scorer below — only effects at strength ≥ 3 count
// as "loud enough to interfere" with a contradicting selection.
function blendEffectStrength(b, mood) {
  if (b.mood === mood) return 5;
  const eff = (b.effects || []).find(([k]) => k === mood);
  return eff ? eff[1] : 0;
}

// Conflict-aware score: per selection, count a hit (1) and dock a
// graded amount per conflicting tag present on the blend, where the
// dock equals the pair's masking strength (see flavorMaskStrength /
// moodMaskStrength in data/blends.js — bitter and mint at 0.85, soft
// pairs like umami/sweet at 0.4). Sums across all selections; clamps
// each per-selection contribution at 0 so heavy-conflict blends just
// stop contributing rather than going negative.
//
// This is the "quiet de-emphasis" layer: matched-count still leads
// the sort (additive intent preserved), but among ties the cup that
// pulls hard in two directions ranks well below the cup that doesn't.
function conflictAwareScore(b, moods, flavors) {
  let score = 0;
  for (const m of moods) {
    let s = blendMatchesMood(b, m) ? 1 : 0;
    for (const [a, c] of MOOD_CONFLICTS) {
      const other = m === a ? c : m === c ? a : null;
      if (!other) continue;
      if (blendEffectStrength(b, other) >= 3) s -= moodMaskStrength(m, other);
    }
    score += Math.max(0, s);
  }
  for (const f of flavors) {
    let s = blendMatchesFlavor(b, f) ? 1 : 0;
    for (const [a, c] of FLAVOR_CONFLICTS) {
      const other = f === a ? c : f === c ? a : null;
      if (!other) continue;
      if (blendMatchesFlavor(b, other)) s -= flavorMaskStrength(f, other);
    }
    score += Math.max(0, s);
  }
  return score;
}

// Score how completely a blend embodies the user's selections.
// Primary axis sorts; secondary axis filters. On "by feel", mood is
// the primary sorter and flavor selections act as a strict filter
// (any flavor mismatch knocks the candidate out of the list). On
// "by taste", flavor sorts and mood filters. This makes the second
// chip strip behave like a refining lens rather than a co-equal
// scoring axis — the user's chosen primary axis is the one that
// orders results.
function scoreSelections(b, moods, flavors, primaryAxis = "feel") {
  const moodHits = moods.filter(m => blendMatchesMood(b, m)).length;
  const flavorHits = flavors.filter(f => blendMatchesFlavor(b, f)).length;
  const isFeel = primaryAxis === "feel";

  const primaryHits = isFeel ? moodHits : flavorHits;
  const primaryTotal = isFeel ? moods.length : flavors.length;
  const secondaryHits = isFeel ? flavorHits : moodHits;
  const secondaryTotal = isFeel ? flavors.length : moods.length;

  // Filter pass: if the user picked anything on the secondary axis,
  // the candidate must match at least one of those picks. No
  // secondary picks → no filter, pass everyone through.
  const passesFilter = secondaryTotal === 0 || secondaryHits > 0;
  const fullPrimary = primaryTotal > 0 && primaryHits === primaryTotal;
  const matched = moodHits + flavorHits;

  return {
    moodHits,
    flavorHits,
    primaryHits,
    primaryTotal,
    secondaryHits,
    secondaryTotal,
    passesFilter,
    fullPrimary,
    matched,
    // Conflict-aware companion score — tiebreaker after the raw
    // matched count so additive ordering still leads but mixed-
    // signal candidates fall behind their cleaner peers.
    weighted: conflictAwareScore(b, moods, flavors),
  };
}

// Pick a single word from a bank deterministically — same selection
// inputs always produce the same name. Hash-of-tag drives the index
// so different selections rotate through the bank.
function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pickFromBank(bank, seed) {
  if (!bank || bank.length === 0) return null;
  return bank[seed % bank.length];
}

// Compose a poetic name from one word per selected mood and one per
// selected flavor. The primary axis (mood on by-feel, flavor on
// by-taste) leads the name; the secondary axis goes in parentheses
// when both axes have multiple selections.
//
// Templates by selection size:
//   0 + 0     → Untitled
//   1 P       → P                       e.g. "Compass"
//   2+ P      → P₁ & P₂                 e.g. "Compass & Ease"
//   1 S       → S                       e.g. "Woody"
//   2+ S      → S₁ & S₂                 e.g. "Woody & Roasted"
//   1 P + 1 S → P S                     e.g. "Compass Woody"
//   1 P + 2+S → P (S₁/S₂)               e.g. "Compass (Woody/Roasted)"
//   2+P + 1 S → P₁ & P₂ (S)             e.g. "Compass & Ease (Woody)"
//   2+P + 2+S → P₁ & P₂ (S₁/S₂)         e.g. "Compass & Ease (Woody/Roasted)"
//
// Past two words on either axis the additional selections are dropped —
// the name stays a name, not a manifest.
function generateBlendName(moods, flavors, primaryAxis = "feel") {
  const moodWords = moods
    .map(m => pickFromBank(MOOD_WORDS[m], hashOf(m + "|" + flavors.join(","))))
    .filter(Boolean);
  const flavorWords = flavors
    .map(f => pickFromBank(FLAVOR_WORDS[f], hashOf(f + "|" + moods.join(","))))
    .filter(Boolean);

  const isFeel = primaryAxis === "feel";
  const primary = (isFeel ? moodWords : flavorWords).slice(0, 2);
  const secondary = (isFeel ? flavorWords : moodWords).slice(0, 2);

  if (primary.length === 0 && secondary.length === 0) return "Untitled";

  // Single-axis cases — no parenthetical needed.
  if (primary.length === 0) {
    return secondary.length === 1
      ? secondary[0]
      : `${secondary[0]} & ${secondary[1]}`;
  }
  if (secondary.length === 0) {
    return primary.length === 1
      ? primary[0]
      : `${primary[0]} & ${primary[1]}`;
  }

  // 1 + 1 — simple pairing reads better without parens.
  if (primary.length === 1 && secondary.length === 1) {
    return `${primary[0]} ${secondary[0]}`;
  }

  // 1+ primary, 1+ secondary with at least one side > 1: parenthetical
  // frame. Primary uses "&", secondary uses "/" so the two registers
  // visually distinguish.
  const head = primary.length === 1 ? primary[0] : `${primary[0]} & ${primary[1]}`;
  const tail = secondary.join("/");
  return `${head} (${tail})`;
}

// Pick the strongest ingredient expressing a given mood, with a tea
// preference: if a true tea (Camellia sinensis) hits the threshold,
// take it over an herbal that scores the same. Falls back to any
// ingredient when no tea works.
//
// Some moods (comfort, digestive) aren't expressed by any ingredient
// directly — they're emergent from blends. When the direct effect
// lookup finds nothing, we fall back to MOOD_BLENDS[mood] and pull
// the heaviest-grams ingredient from the curated single-mood recipe.
// True when the ingredient's brew window has *meaningful* overlap with the
// supplied temp/time ranges — not just a boundary touch. Used by the
// synthetic picker so every ingredient shares enough of a sweet spot that
// the resulting brew tolerates normal slider exploration.
const MIN_TEMP_OVERLAP_C = 3;
const MIN_TIME_OVERLAP_S = 30;
function windowsOverlap(ing, tempRange, timeRange) {
  if (!ing) return false;
  const [t1, t2] = ing.tempC || [0, 100];
  const [s1, s2] = ing.timeS || [0, 9999];
  if (tempRange) {
    const lo = Math.max(t1, tempRange[0]);
    const hi = Math.min(t2, tempRange[1]);
    if (hi - lo < MIN_TEMP_OVERLAP_C) return false;
  }
  if (timeRange) {
    const lo = Math.max(s1, timeRange[0]);
    const hi = Math.min(s2, timeRange[1]);
    if (hi - lo < MIN_TIME_OVERLAP_S) return false;
  }
  return true;
}

function bestIngredientForMood(mood, exclude, minStrength = 3, compatTemp = null, compatTime = null) {
  const cands = Object.entries(INGREDIENTS)
    .filter(([id]) => !exclude.has(id))
    .filter(([id]) => !wouldCreateUnsafeCombination(exclude, id))
    .filter(([, ing]) => windowsOverlap(ing, compatTemp, compatTime))
    .map(([id, ing]) => {
      const eff = (ing.effects || []).find(([k]) => k === mood);
      return { id, ing, strength: eff ? eff[1] : 0 };
    })
    .filter(c => c.strength >= minStrength);
  if (cands.length > 0) {
    cands.sort((a, b) => {
      const aTea = a.ing.category === "true tea" ? 0 : 1;
      const bTea = b.ing.category === "true tea" ? 0 : 1;
      if (aTea !== bTea) return aTea - bTea;
      return b.strength - a.strength;
    });
    return cands[0];
  }
  // Fallback: emergent-only moods (comfort, digestive). Pick the heaviest
  // ingredient from the mood's curated single-mood recipe — but still respect
  // the running window so the synth stays sweet-spot.
  const blend = MOOD_BLENDS[mood];
  if (!blend) return null;
  const sortedIngs = [...blend.ings]
    .filter(i => !exclude.has(i.id))
    .filter(i => !wouldCreateUnsafeCombination(exclude, i.id))
    .filter(i => windowsOverlap(INGREDIENTS[i.id], compatTemp, compatTime))
    .sort((a, b) => (b.g || 0) - (a.g || 0));
  if (sortedIngs.length === 0) return null;
  const id = sortedIngs[0].id;
  return { id, ing: INGREDIENTS[id], strength: 3 };
}

// Pick a flavor-expressing ingredient, with the same tea preference.
function bestIngredientForFlavor(flavor, exclude, compatTemp = null, compatTime = null) {
  const cands = Object.entries(INGREDIENTS)
    .filter(([id]) => !exclude.has(id))
    .filter(([id]) => !wouldCreateUnsafeCombination(exclude, id))
    .filter(([, ing]) => (ing.flavors || []).includes(flavor))
    .filter(([, ing]) => windowsOverlap(ing, compatTemp, compatTime))
    .map(([id, ing]) => ({ id, ing }));
  if (cands.length === 0) return null;
  cands.sort((a, b) => {
    const aTea = a.ing.category === "true tea" ? 0 : 1;
    const bTea = b.ing.category === "true tea" ? 0 : 1;
    return aTea - bTea;
  });
  return cands[0];
}

// Build an "accented tradition" candidate: take a tradition whose
// primary axis fully matches the user's selections, then add 1-2
// accent ingredients to cover the secondary-axis selections it misses.
// Lets the suggestion row include something like "Masala Chai, Zest"
// when the user picked energy + citrus and the unaccented chai matches
// energy but not citrus. The result is tagged experimental + accented
// so the UI marks it as an in-house variation rather than the
// tradition itself.
function buildAccentedTradition(blend, score, moods, flavors, primaryAxis) {
  const isFeel = primaryAxis === "feel";
  const secondarySels = isFeel ? flavors : moods;
  const unmet = secondarySels.filter(s =>
    isFeel ? !blendMatchesFlavor(blend, s) : !blendMatchesMood(blend, s)
  );
  // Only add 1-2 accents; more would stop being "the tradition + a
  // touch" and start being a different recipe.
  if (unmet.length === 0 || unmet.length > 2) return null;

  const usedIds = new Set(blend.ingredients.map(i => i.id));
  const newAccents = [];
  for (const sel of unmet) {
    const cand = isFeel
      ? bestIngredientForFlavor(sel, usedIds)
      : bestIngredientForMood(sel, usedIds, 2);
    if (!cand) continue;
    newAccents.push({ id: cand.id, g: 0.3, role: "accent" });
    usedIds.add(cand.id);
  }
  if (newAccents.length === 0) return null;

  const ingredients = [
    ...blend.ingredients.map(i => ({ ...i })),
    ...newAccents,
  ];
  const profile = computeBrewProfile(ingredients, { leadOnly: true });

  // Name: "<Tradition> (<AccentWord>)" — e.g., "Masala Chai (Zest)".
  // Parentheses keep traditions whose name already has a comma
  // ("Darjeeling, neat") readable as "Darjeeling, neat (Sun)" rather
  // than the three-comma chain. The accent word comes from the same
  // MOOD_WORDS / FLAVOR_WORDS bank the synthetic builder draws from,
  // so the voice stays consistent.
  const accentWords = unmet.map(s =>
    pickFromBank(isFeel ? FLAVOR_WORDS[s] : MOOD_WORDS[s], hashOf(s + blend.name))
  ).filter(Boolean);
  const name = `${blend.name} (${accentWords.join(" & ")})`;
  const subtitle = `${blend.name} accented for ${unmet.join(" + ")}`;

  return {
    id: `accented-${blend.id}-${unmet.join("-")}`,
    name,
    subtitle,
    ingredients,
    tempC: profile.tempC,
    timeS: profile.timeS,
    mood: blend.mood,
    flavor: blend.flavor,
    effects: blend.effects,
    experimental: true,
    accented: true,
    sourceTradition: blend.name,
  };
}

// Find the best tradition for accenting: full primary-axis match,
// with at least one secondary selection unmet (so there's something
// for the accent to fill). Prefer traditions that already match more
// of the secondary axis (less accenting needed) and shorter recipes.
function bestPartialPrimaryTradition(moods, flavors, primaryAxis) {
  const isFeel = primaryAxis === "feel";
  const secondarySels = isFeel ? flavors : moods;
  if (secondarySels.length === 0) return null;

  return BLENDS
    .filter(b => b.tradition)
    .map(b => ({ blend: b, score: scoreSelections(b, moods, flavors, primaryAxis) }))
    .filter(x => x.score.fullPrimary && x.score.secondaryHits < x.score.secondaryTotal)
    .sort((a, b) => {
      const aMissing = a.score.secondaryTotal - a.score.secondaryHits;
      const bMissing = b.score.secondaryTotal - b.score.secondaryHits;
      if (aMissing !== bMissing) return aMissing - bMissing;
      return a.blend.ingredients.length - b.blend.ingredients.length;
    })[0] || null;
}

// Build a synthetic candidate when no curated blend embodies the
// user's selections. Takes primaryAxis so the generated name leads
// with the right axis (mood for by-feel, flavor for by-taste). For each selected mood, we pull the strongest
// ingredient expressing that effect (tea-first, herbal fallback);
// for each flavor, we pull a flavor-matching ingredient as an accent.
// computeBrewProfile resolves the 2D sweet spot if the leads' brewing
// windows intersect, otherwise the closest-point compromise.
//
// Names are composed from MOOD_WORDS + FLAVOR_WORDS — one word per
// selection, deterministic so the same query always produces the
// same name.
export function buildSyntheticForSelections(moods, flavors, primaryAxis = "feel") {
  const picks = [];
  const usedIds = new Set();

  // Track the running brew window. Each pick narrows it via intersection,
  // and every subsequent candidate must overlap — guaranteeing the synth
  // ends up at a single sweet-spot all ingredients share. If a mood/flavor
  // has no compatible candidate, it's skipped rather than violating the
  // window. Synths are always sweet-spot blends by construction.
  let runTemp = null, runTime = null;
  const tighten = (ing) => {
    const [t1, t2] = ing.tempC;
    const [s1, s2] = ing.timeS;
    if (!runTemp) { runTemp = [t1, t2]; runTime = [s1, s2]; return; }
    runTemp = [Math.max(runTemp[0], t1), Math.min(runTemp[1], t2)];
    runTime = [Math.max(runTime[0], s1), Math.min(runTime[1], s2)];
  };

  // Lead picks: one per mood, tea-prioritized, fallback to any herbal
  // if no tea reaches the threshold. Each lead must share a brew window
  // with the prior leads.
  for (const m of moods) {
    const cand = bestIngredientForMood(m, usedIds, 3, runTemp, runTime) ||
                 bestIngredientForMood(m, usedIds, 2, runTemp, runTime) ||
                 bestIngredientForMood(m, usedIds, 1, runTemp, runTime);
    if (!cand) continue;
    picks.push({ id: cand.id, g: 1.0 });
    usedIds.add(cand.id);
    tighten(cand.ing);
  }

  // Accent picks: one per flavor, also constrained to the running window.
  for (const f of flavors) {
    const cand = bestIngredientForFlavor(f, usedIds, runTemp, runTime);
    if (!cand) continue;
    picks.push({ id: cand.id, g: 0.5, role: "accent" });
    usedIds.add(cand.id);
    tighten(cand.ing);
  }

  if (picks.length < 2) return null;

  // Generated blends always seek the optimal temperature/time
  // intersection between their ingredients via computeBrewProfile —
  // tightening above (runTemp/runTime) keeps every accent/lead in a
  // shared brew window, and computeBrewProfile then picks the
  // grams-weighted centroid clamped into the intersection. Falls
  // back to the dominant compromise only when intersection is empty.
  const profile = computeBrewProfile(picks, { leadOnly: true });
  const isCleanSweet = !!profile.compatible;

  // Effects map from leads (not accents) so the predicted-effect
  // bars on the brew card reflect what the user asked for.
  const effectMap = {};
  for (const p of picks) {
    if (p.role === "accent") continue;
    const meta = INGREDIENTS[p.id];
    for (const [tag, str] of (meta?.effects || [])) {
      effectMap[tag] = Math.max(effectMap[tag] || 0, str);
    }
  }
  const effects = Object.entries(effectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const name = generateBlendName(moods, flavors, primaryAxis);
  const subtitle = isCleanSweet
    ? "tuned to your picks; brewed where each leaf is at its best"
    : "tuned to your picks; the catalog's closest balance, respectful of each ingredient";

  return {
    id: `synth-${[...moods, ...flavors].join("-")}`,
    name,
    subtitle,
    ingredients: picks,
    tempC: profile.tempC,
    timeS: profile.timeS,
    mood: moods[0] || null,
    flavor: flavors[0] || null,
    effects,
    experimental: true,
    synthetic: true,
    sweetSpot: isCleanSweet,
  };
}

// Multi-candidate resolver, axis-aware. Returns 1–5 blends.
//
// Selection embodiment is the new ranking primitive: a candidate that
// matches every selected mood and flavor wins over one that matches
// fewer. If no curated blend fully embodies the selections, a
// synthetic candidate is built from the strongest-expressing
// ingredients and surfaced first — clean sweet-spot if the brewing
// windows intersect, closest-point compromise if they don't.
//
// Legacy: the second positional arg accepts either a single flavor
// string (older callers) or a flavors array (current callers).
export function resolveCandidates(moods, flavorArg, primaryAxis = "feel") {
  const flavors = Array.isArray(flavorArg)
    ? flavorArg.filter(Boolean)
    : flavorArg ? [flavorArg] : [];
  if (moods.length === 0 && flavors.length === 0) return [];
  // Legacy single-flavor variable for axis-aware accent generation
  // (the accent helpers still expect a single flavor or null).
  const flavor = flavors[0] || null;

  // Additive matching: any candidate that hits at least one of the
  // user's selections (mood or flavor, either axis) is in the pool.
  // Adding a flavor onto an existing mood query *adds* matches to
  // the list rather than strictly filtering down. Sort: total
  // selections matched desc → traditions ahead → primary-axis hits
  // → secondary-axis hits → shortest recipe.
  const scoredPool = BLENDS
    .map(b => ({ blend: b, score: scoreSelections(b, moods, flavors, primaryAxis) }))
    .filter(x => x.score.matched > 0)
    .sort((a, b) => {
      if (a.score.matched !== b.score.matched) return b.score.matched - a.score.matched;
      // Conflict-aware tiebreaker — keeps mixed-signal blends from
      // claiming the top-of-kind slot in the bucketed pull below.
      if (Math.abs(a.score.weighted - b.score.weighted) > 0.0001) {
        return b.score.weighted - a.score.weighted;
      }
      const aTrad = a.blend.tradition ? 0 : 1;
      const bTrad = b.blend.tradition ? 0 : 1;
      if (aTrad !== bTrad) return aTrad - bTrad;
      if (a.score.primaryHits !== b.score.primaryHits) return b.score.primaryHits - a.score.primaryHits;
      if (a.score.secondaryHits !== b.score.secondaryHits) return b.score.secondaryHits - a.score.secondaryHits;
      return a.blend.ingredients.length - b.blend.ingredients.length;
    });

  // Pull at most one entry per kind (tradition / experimental / house)
  // from the top of the scored pool, plus the legacy primary-resolver
  // result and an accent variant. This keeps the list diverse rather
  // than four near-duplicates.
  const candidates = [];
  const seenNames = new Set();

  // Lead-ingredient signature — sorted IDs of every non-accent
  // ingredient. Two blends with the same signature and a near-equal
  // brew profile are effectively the same recipe; we suppress the
  // later one so the user doesn't see e.g. an algorithmic synth
  // shadowing the curated tradition that already covers the combo.
  function leadSignature(b) {
    return (b.ingredients || [])
      .filter(i => i.role !== "accent")
      .map(i => i.id)
      .sort()
      .join("|");
  }
  function profileNear(a, b) {
    return Math.abs((a.tempC || 0) - (b.tempC || 0)) <= 5
        && Math.abs((a.timeS || 0) - (b.timeS || 0)) <= 30;
  }

  function addBlend(b, kind, kindLabel, score) {
    if (seenNames.has(b.name)) return;
    const sig = leadSignature(b);
    if (sig && candidates.some(c => leadSignature(c) === sig && profileNear(c, b))) {
      return;
    }
    seenNames.add(b.name);
    candidates.push({ ...b, kind, kindLabel, _score: score });
  }

  // Top scorer for each kind, in priority order
  function topOfKind(predicate) {
    return scoredPool.find(({ blend }) =>
      predicate(blend) && !seenNames.has(blend.name)
    );
  }

  // resolveBlend requires at least one mood; for flavor-only queries
  // we skip it and rely on the scored pool below to surface matches.
  const primary = moods.length > 0 ? resolveBlend(moods, flavor) : null;
  if (primary && !primary.empty) {
    const score = scoreSelections(primary, moods, flavors, primaryAxis);
    // Additive — primary candidate is included as long as it hits
    // at least one of the user's selections.
    if (score.matched > 0) {
      addBlend(primary, "primary", "closest match", score);
    }
  }

  // Pull one accent variant for diversity. On the feel-led axis we vary
  // along flavor; on the taste-led axis we vary along mood. The accent
  // is intentionally not in the scored pool — it's a derived variant.
  if (primaryAxis === "feel") {
    const complements = flavor ? (FLAVOR_COMPLEMENTS[flavor] || []) : [];
    for (const comp of complements) {
      if (!primary) break;
      const v = buildAccentVariantByFlavor(primary, comp);
      if (!v) continue;
      const score = scoreSelections(v, moods, flavors, primaryAxis);
      if (score.matched === 0) continue;
      addBlend(v, "accent", `${comp} accent`, score);
      break;
    }
  } else if (moods.length > 0) {
    const primaryMood = moods[0];
    const neighbors = MOOD_NEIGHBORS[primaryMood] || [];
    for (const nb of neighbors) {
      if (moods.includes(nb)) continue;
      const v = buildAccentVariantByMood(primaryMood, nb, flavor);
      if (!v) continue;
      const score = scoreSelections(v, moods, flavors, primaryAxis);
      if (score.matched === 0) continue;
      addBlend(v, "accent", `${nb}-leaning`, score);
      break;
    }
  }

  // Top tradition / experimental / house from the scored pool. Each
  // bucket gets at most one entry, so the suggestion row doesn't get
  // dominated by near-duplicates from a single category.
  const traditionTop = topOfKind(b => !!b.tradition);
  if (traditionTop) {
    addBlend(traditionTop.blend, "tradition",
      `traditional · ${traditionTop.blend.tradition}`, traditionTop.score);
  }

  // Accented tradition: take a tradition that matches the primary axis
  // but misses some of the secondary filter, and extend it with 1-2
  // accent ingredients to close the gap. Surfaces as an in-house
  // experiment ("Masala Chai, Zest") so the user can see how a
  // traditional recipe gets tuned for their picks.
  const partial = bestPartialPrimaryTradition(moods, flavors, primaryAxis);
  if (partial) {
    const accented = buildAccentedTradition(
      partial.blend, partial.score, moods, flavors, primaryAxis
    );
    if (accented) {
      const accScore = scoreSelections(accented, moods, flavors, primaryAxis);
      addBlend(accented, "accented",
        `accented · ${partial.blend.name}`, accScore);
    }
  }

  const experimentalTop = topOfKind(b => !!b.experimental);
  if (experimentalTop) {
    addBlend(experimentalTop.blend, "experimental",
      "Herbanium experiment", experimentalTop.score);
  }
  const houseTop = topOfKind(b => !b.tradition && !b.experimental);
  if (houseTop) {
    addBlend(houseTop.blend, "house", "house blend", houseTop.score);
  }

  // If nothing in the candidates set fully embodies the user's
  // selections, build a synthetic experiment that does — clean
  // sweet-spot if the leads' brewing windows intersect, closest-point
  // compromise if they don't. This is the "we made it for you"
  // candidate, surfaced first so a full match always leads.
  // If nothing fully covers the primary axis, build a synthetic
  // experiment that does — clean sweet-spot if the leads' brewing
  // windows intersect, closest-point compromise if they don't.
  const hasFullPrimary = candidates.some(c => c._score?.fullPrimary);
  if (!hasFullPrimary) {
    const synth = buildSyntheticForSelections(moods, flavors, primaryAxis);
    if (synth) {
      const synthScore = scoreSelections(synth, moods, flavors, primaryAxis);
      const label = synth.sweetSpot
        ? "Herbanium experiment · sweet spot"
        : "Herbanium experiment · closest fit";
      addBlend(synth, "synthetic", label, synthScore);
    }
  }

  // Final order — additive ranking:
  //   1. Total selections matched (mood + flavor combined) desc — the
  //      candidate that satisfies the most picks rides the top.
  //   2. Traditions get a heightened bias on ties so cultural recipes
  //      beat in-house derivatives at the same match count.
  //   3. Among ties, kind priority breaks remaining ambiguity.
  //   4. Then primary-axis hits, secondary-axis hits, ingredient count.
  const KIND_PRIORITY = {
    primary: 0,
    tradition: 1,
    house: 2,
    experimental: 3,
    accented: 4,
    synthetic: 5,
    accent: 6,
  };
  return candidates
    .sort((a, b) => {
      const aMatched = a._score?.matched || 0;
      const bMatched = b._score?.matched || 0;
      if (aMatched !== bMatched) return bMatched - aMatched;
      // Conflict-aware tiebreaker — among same-match candidates, the
      // one that pulls in fewer directions wins. Half-point penalty
      // per selection-vs-blend conflict accumulates here.
      const aWeighted = a._score?.weighted || 0;
      const bWeighted = b._score?.weighted || 0;
      if (Math.abs(aWeighted - bWeighted) > 0.0001) return bWeighted - aWeighted;
      const aTrad = a.tradition ? 0 : 1;
      const bTrad = b.tradition ? 0 : 1;
      if (aTrad !== bTrad) return aTrad - bTrad;
      const aKind = KIND_PRIORITY[a.kind] ?? 99;
      const bKind = KIND_PRIORITY[b.kind] ?? 99;
      if (aKind !== bKind) return aKind - bKind;
      const aPrim = a._score?.primaryHits || 0;
      const bPrim = b._score?.primaryHits || 0;
      if (aPrim !== bPrim) return bPrim - aPrim;
      const aSec = a._score?.secondaryHits || 0;
      const bSec = b._score?.secondaryHits || 0;
      if (aSec !== bSec) return bSec - aSec;
      return a.ingredients.length - b.ingredients.length;
    })
    .slice(0, 8);
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
  attenuateFragileEffects,
  combineFlavors,
  STACK_EXPONENT, STACKING_MIN_STRENGTH,
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
// Balance-bar axes — each row defines a taste-structure metric and
// the perceived flavor/effect keys that contribute to it. Capped at
// 5 by sumCap below. Bitterness uses the same keys the warning layer
// reads so the bar can't lag behind the over-pull warning it pairs
// with. Lifting this out of the resolver keeps the function focused
// on pipeline orchestration rather than enumeration.
const BALANCE_AXES = [
  { name: "bitterness",  flavors: ["bitter", "bitterness", "astringent"], effects: ["bitterness"] },
  { name: "sweetness",   flavors: ["sweet", "honey", "honeyed", "honey-sweet"] },
  { name: "astringency", flavors: ["astringent", "tannic"] },
  { name: "tartness",    flavors: ["tart", "bright", "berry"] },
  { name: "menthol",     flavors: ["cool", "cooling", "minty", "mint"] },
];

function sumCapTo5(...vals) {
  const total = vals.reduce((a, b) => a + (b || 0), 0);
  return Math.round(Math.min(5, total) * 10) / 10;
}

// Compress a sorted [tag, strength] list into a 1–2 entry summary
// of the cup's dominant register. Returned as an array of tag
// strings so the renderer can show them as discrete chips.
//   - primary: top entry must clear this to summarize at all
//   - secondary: second entry joins if it clears this
// Below primary, returns [] — the cup isn't loud enough on this
// axis to make a definite claim.
function summarizeTopTuples(tuples, { primary, secondary, tertiary }) {
  if (!tuples || tuples.length === 0) return [];
  const top = tuples[0];
  if (!top || top[1] < primary) return [];
  const out = [top[0]];
  const second = tuples[1];
  if (second && second[1] >= secondary) {
    out.push(second[0]);
    // Third entry surfaces only if it's tracking the second closely —
    // 70% of the second's strength keeps the read honest. Without this,
    // a quiet third-place flavor would claim equal billing with the
    // dominant notes.
    const third = tuples[2];
    if (tertiary != null && third && third[1] >= tertiary && third[1] >= second[1] * 0.7) {
      out.push(third[0]);
    }
  }
  return out;
}

function buildBalanceBars(perceivedFlavorMap, perceivedEffectMap) {
  const out = [];
  for (const axis of BALANCE_AXES) {
    const fVals = (axis.flavors || []).map(k => perceivedFlavorMap[k]);
    const eVals = (axis.effects || []).map(k => perceivedEffectMap[k]);
    const v = sumCapTo5(...fVals, ...eVals);
    if (v > 0) out.push([axis.name, v]);
  }
  return out;
}

/* The baseline pass must not build warnings — it would need a baseline
   of ITS own and recur forever. A module-scoped depth counter rather
   than an extra parameter, and deliberately so: this function is
   called positionally in several places and at least one call site
   already passes a stale 8th argument (a blend's `effects`, left over
   from an older signature). A new trailing parameter would have
   silently picked that up and run the real call in baseline mode —
   which is exactly what happened when this was written that way, and
   the only thing that caught it was one integration test. Synchronous
   and single-threaded, so a counter is safe; one level deep. */
let _readingDepth = 0;

/* ── HOW MUCH WATER, which the model used not to ask ───────────
   Every extraction profile in the catalog is written per 200 ml —
   `REFERENCE_ML`, and `POUR_SIZES.doses` is `ml / REFERENCE_ML` by
   construction. The perception pipeline below reads GRAMS, so it was
   reading a pot's worth of leaf as a cup's worth whenever the vessel
   wasn't 200 ml. Nothing downstream knew the difference.

   37 of the 49 curated blends declare an `ml` other than 200, and none
   of it reached here — the string `ml` did not appear anywhere in
   src/algo. Spring Tonic is 3 g in 500 ml, an ordinary infusion, and
   it computed identically to 3 g in a single cup: earthy 5.00,
   mineral 5.00, astringent 5.00, three bars pinned and a "heavy pour —
   about 2.5× a cup's worth of leaf in one cup" notice on a cup that
   holds exactly one cup's worth per cup. Reported as "doesn't seem
   right for the actual recipe, its only 2 tsp total". It wasn't.

   At its own dose the same recipe reads astringent 3.80, earthy 3.10,
   mineral 2.90 — nothing pinned, the bars discriminating again, and
   the pour notice correctly silent. THE WARNING WAS HONEST; it was
   describing a defect one layer under it.

   The composer had the same hole from the other side. `partsToGrams`
   multiplies by `pourDoses`, so choosing "a pot" builds 3× the leaf —
   correctly, that is what a pot holds — and the model then read that
   as one cup. Normalizing here closes both, because a pour size's ml
   and its dose count are the same number.

   NORMALIZE AT THE BOUNDARY, not at each reader. Dose feeds flavor,
   effects, caffeine and the pour check, and every one of them wants
   the same per-cup figure; four call sites each dividing is the
   duplicated-operation shape this codebase keeps finding. So the
   exported function is a thin normalizer and the pipeline below only
   ever sees a cup.

   Callers that pass no `ml` are unchanged — the ratio is 1.

   `opts` is read rather than destructured in the signature because
   FlavorMap already passes a literal `null` in this position (it was
   an unused slot); `{ ml } = {}` accepts undefined and throws on null. */
export function resolveBlendAtBrew(ingredients, tempC, timeS, baselineTempC, baselineTimeS, curated = false, isTraditional = false, opts) {
  const ml = opts?.ml;
  const cupsOfWater = ml > 0 ? ml / REFERENCE_ML : 1;
  const perCup = (cupsOfWater === 1 || !ingredients?.length)
    ? ingredients
    : ingredients.map(i => ({ ...i, g: (i.g || 0) / cupsOfWater }));
  return resolveBlendAtBrewPerCup(
    perCup, tempC, timeS, baselineTempC, baselineTimeS, curated, isTraditional,
    ingredients,
  );
}

/* The pipeline proper. Takes ONE CUP's worth of leaf — see the
   normalizer above, which is the only thing that should call it with a
   pot. Internal re-entry (the baseline read below) passes the already
   normalized list, so it must not divide again. */
function resolveBlendAtBrewPerCup(ingredients, tempC, timeS, baselineTempC, baselineTimeS, curated = false, isTraditional = false, poured = ingredients) {
  const _readingOnly = _readingDepth > 0;
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
  // Total caffeine in mg for the cup, weighted by per-ingredient
  // grams AND modulated by extraction efficiency at the current
  // temp/time. Hotter water + longer steep pulls more caffeine
  // (cold brew tea runs ~50-70% the caffeine of a hot pour, by
  // way of comparison); the previous gram-only formula gave a
  // static number that didn't move when the user dragged the
  // sliders. Used by the cup-level caffeine-load warning so a
  // stack of caffeine-bearing leaves can flag "may read jittery"
  // even when no axis is over-extracted.
  const caffeineExtractionFactor = (meta) => {
    const tempRange = meta.tempC || [85, 95];
    const timeRange = meta.timeS || [180, 240];
    const recTempC = (tempRange[0] + tempRange[1]) / 2;
    const recTimeS = (timeRange[0] + timeRange[1]) / 2;
    // Two-axis cap:
    //   recipe-relative ratio handles "brewed below the leaf's
    //   recommended optimum extracts less," which works for most
    //   teas whose recommended brew also maximizes caffeine.
    //   absolute-temp cap handles the special case of cold-brewed
    //   leaves (gyokuro, kabusecha, cold matcha) where the recipe
    //   is calibrated for flavor, not caffeine. Cold water can't
    //   extract caffeine efficiently no matter how long it steeps —
    //   the absolute curve enforces that physics.
    // 40°C: 0 (no meaningful caffeine extraction)
    // 95°C+: 1.0 (saturation)
    const tempRatio = Math.min(1.0, Math.max(0, tempC) / Math.max(50, recTempC));
    const absTempRatio = Math.max(0, Math.min(1.0, (tempC - 40) / 55));
    const effectiveTempFactor = Math.min(tempRatio, absTempRatio);
    const timeRatio = Math.min(1.0, Math.max(0, timeS) / Math.max(60, recTimeS));
    return Math.max(0.05, effectiveTempFactor * timeRatio);
  };
  /* PER CUP-DOSE, NOT PER GRAM, and this was wrong for a long time.

     `meta.caffeine` is transcribed straight from each research doc's
     "caffeine (mg per ~8oz cup)" row — assam 60, sencha 25, matcha 60.
     It is a figure per CUP. This multiplied it by grams, so a standard
     2g cup of assam reported 120mg against a documented 60, and the
     error was exactly each ingredient's cup-dose: 2.0x across all
     fourteen true teas, 1.2x for yerba mate. Every caffeinated reading
     in the app was high by that factor.

     Caught by a reader asking whether 2 tsp of assam is really 249mg.
     It is about 120. Dividing by what a cup's dose of that leaf weighs
     makes one cup-dose yield exactly the sourced number, which is what
     the doc says and what `tests/research-parity.test.mjs` now holds. */
  /* CAFFEINE IS THE ONE READING THAT IS NOT A CONCENTRATION, so it
     alone reads `poured` — the leaf as the recipe actually lists it —
     rather than the per-cup normalization everything below uses.

     You drink the vessel. A koicha is 4g whisked into 40ml and you
     swallow all 40ml, so you have consumed 4g of matcha; that the
     liquid is concentrated changes how it TASTES, not how much
     caffeine went in. Normalizing it was a regression introduced with
     the volume fix and caught by measuring: koicha read 32.7mg before
     and 163.6mg after, gyokuro 18.4 -> 36.8. The bars were right to
     move and this number was not.

     Everything else in this function is a per-sip intensity on a 0-5
     perceptual scale, which is exactly what concentration means. This
     is milligrams of a drug, and it belongs to the dose. */
  const rawCaffeineMg = poured.reduce((sum, { id, g }) => {
    const meta = INGREDIENTS[id];
    if (!meta || !meta.caffeine) return sum;
    const perCup = TSP_BY_CATEGORY[meta.category] || 1.5;
    const cupDoses = (g || 0) / perCup;
    return sum + meta.caffeine * cupDoses * caffeineExtractionFactor(meta);
  }, 0);
  // Soft cap on cup-level caffeine. Past about 200 mg the linear
  // grams×mg/g sum stops being physically honest — diffusion at
  // high leaf:water ratios plateaus, and a single steep tops out
  // around 80-90% of the total leaf pool no matter how much leaf
  // you pile in. Roll the sum off toward an asymptote at 350 mg
  // so the bar stays believable when a user drags ten ingredients
  // to 9 parts each. Below 200 mg the cap is a no-op (real cups
  // live there); above, tanh smoothly approaches the ceiling.
  const SOFT_MG = 200;
  const HARD_MG = 350;
  const totalCaffeineMg = rawCaffeineMg <= SOFT_MG
    ? rawCaffeineMg
    : SOFT_MG + (HARD_MG - SOFT_MG) * Math.tanh((rawCaffeineMg - SOFT_MG) / (HARD_MG - SOFT_MG));

  // (1) Per-ingredient contributions. Falls back to flat ingredient
  // flavors/effects if no extraction profile exists for that id.
  // Pre-compute the curated-traditional suppression flag so the
  // per-ingredient state machine can soft-fold standalone-over-pull
  // signals at the canonical baseline of a tradition. Without this,
  // a curator-recognized brew like Maghrebi mint at 90°C/3 min would
  // show every ingredient red because the state machine doesn't
  // know we're sitting on a baseline the tradition has codified.
  const _atCuratedBaseline = curated
    && baselineTempC != null && baselineTimeS != null
    && tempC === baselineTempC && timeS === baselineTimeS;
  const _suppressAtBaseline = _atCuratedBaseline && isTraditional;

    /* DOSE, NOT JUST SHARE.

     `weight` below is g / totalG — what fraction of the pot this leaf
     is. That answers "what is this blend made of" and the app was
     using it to answer "what is in my cup", which are different
     questions and only agree for a single-ingredient pot.

     Two things fell out of that. A cup of 1g of chamomile and a cup of
     16g read IDENTICALLY, because absolute grams never entered the
     maths at all. And a leaf's contribution collapsed when unrelated
     leaves joined it — 2g of chamomile read calm 4.0 alone and calm
     0.8 with six other herbs beside it, though the cup still contained
     the same 2g of chamomile. Adding peppermint doesn't remove
     chamomile's apigenin; it adds cooling on top of it.

     So contributions are scaled by how much of the leaf is actually in
     the pot, measured in CUP-DOSES: one teaspoon per cup is the app's
     own convention (chamomile's dose reads "1 tsp · 200ml"), and
     TSP_BY_CATEGORY already knows what a teaspoon of each category
     weighs. x = 1 means "a cup's worth of this leaf".

     The curve is Michaelis–Menten, normalized so one cup-dose scores
     exactly 1.0 — which keeps every single-leaf calibration in the
     catalog where it was:

         dose(x) = x · (S + 1) / (x + S)

     Near-linear while the pot is light (a 0.05g pinch of pepper scores
     0.03, not the 0.16 a power curve would have given it), saturating
     as it gets heavy, and asymptotic at S + 1 — so piling in leaf
     makes a stronger cup with diminishing returns and never an
     infinite one. Share is still share, and still does the jobs that
     are honestly about proportion: masking, dominance, what the cup
     tastes mostly of. */
  const DOSE_SATURATION = 3;      // in cup-doses; also fixes the 4× ceiling
  const doseFactor = (grams, meta) => {
    const perCup = TSP_BY_CATEGORY[meta?.category] || 1.5;
    const x = Math.max(0, (grams || 0) / perCup);
    return (x * (DOSE_SATURATION + 1)) / (x + DOSE_SATURATION);
  };

const contributions = ingredients.map(({ id, g, role }) => {
    const meta = INGREDIENTS[id];
    const weight = g / totalG;      // share — masking, dominance, "mostly"
    const dose = doseFactor(g, meta); // cup-doses — how much is actually in there
    const ingRole = role || "lead";

    // Whisked ingredients (matcha) don't follow steep-time chemistry —
    // the powder is in suspension, so longer 'contact time' just lets
    // the bowl sit and oxidize. Clamp the time-axis lookup to the
    // ingredient's natural range so brewing matcha as part of a blend
    // with longer-time ingredients doesn't push the bracket into
    // 'destroyed' territory at brew points where real matcha would
    // just be flat.
    const effTimeS = meta?.whisked && meta.timeS
      ? Math.min(timeS, meta.timeS[1])
      : timeS;
    const profile = resolveExtractionProfile(id, tempC, effTimeS) || {
      flavors: normalizeFlavors(meta.flavors || []),
      effects: meta.effects || [],
      character: "",
    };

    const [tMin, tMax] = meta.tempC;
    const [sMin, sMax] = meta.timeS || [0, Infinity];
    const inTempRange = tempC >= tMin && tempC <= tMax;
    const inTimeRange = timeS >= sMin && timeS <= sMax;
    const inRange = inTempRange && inTimeRange;
    // Direction lets the UI tell the user which way to nudge the
    // slider — "too cool" vs "too hot", "under-steeped" vs
    // "over-steeped". Null means the axis is in range.
    const tempDir = tempC < tMin ? "low" : tempC > tMax ? "high" : null;
    const timeDir = timeS < sMin ? "under" : timeS > sMax ? "over" : null;

    // Per-axis zone resolution — each axis names its own state
    // independently, and a notable combination (if declared) names
    // the emergent register. This replaces the older 2D zones[]
    // rectangle model so the user can think about temp and time
    // separately.
    const resolveAxisZone = (zoneArr, value, axis) => {
      if (!Array.isArray(zoneArr)) return null;
      // Inclusive bounds + first-match. Boundary values fall to
      // the lower band (e.g. 95°C between cool [90, 95] and warm
      // [95, 99] resolves to cool). This matches the curated-blend
      // expectation: most envelopes put the canonical brew at the
      // upper-end corner, and the lower band reaching that corner
      // keeps the canonical brew in a single register rather than
      // jumping into "tonic" by clipping the boundary upward.
      for (const z of zoneArr) {
        const range = z[axis];
        if (!range) continue;
        if (value >= range[0] && value <= range[1]) return z;
      }
      return null;
    };
    const tempZone = resolveAxisZone(meta.tempZones, tempC, "tempC");
    const timeZone = resolveAxisZone(meta.timeZones, timeS, "timeS");
    // Register is a third axis derived from the temp+time pairing.
    // The DEFAULT_REGISTER_MAPPING table (above the function) maps
    // every (tempBand+timeBand) pair to a register id; ingredients
    // pick up that mapping automatically and only need to provide
    // the registerZone *content* (id + character + moodImpact).
    // Per-ingredient `when` arrays are still honored as overrides
    // for ingredients with unusual register behavior.
    let registerZone = null;
    if (tempZone && timeZone && Array.isArray(meta.registerZones)) {
      const key = `${tempZone.id}+${timeZone.id}`;
      // Override path: any registerZone with a `when` array that
      // includes the key wins.
      registerZone = meta.registerZones.find(z =>
        Array.isArray(z.when) && z.when.includes(key)
      ) || null;
      // Default path: look up the engine table, find the matching
      // registerZone by id.
      if (!registerZone) {
        const defaultId = DEFAULT_REGISTER_MAPPING[key];
        if (defaultId) {
          registerZone = meta.registerZones.find(z => z.id === defaultId) || null;
        }
      }
    }
    // Backwards compat: older `combinations` table maps to a thin
    // shim with id + character so legacy code doesn't break during
    // migration.
    let combination = null;
    if (tempZone && timeZone && meta.combinations) {
      const key = `${tempZone.id}+${timeZone.id}`;
      const entry = meta.combinations[key];
      if (entry) combination = { register: entry.register, note: entry.note };
    }
    // If we got a registerZone but no legacy combination, synthesize
    // a combination shape so existing UI fallbacks still work.
    if (!combination && registerZone) {
      combination = { register: registerZone.id, note: registerZone.character };
    }
    // Legacy 2D-zone fallback (any ingredient still declaring `zones`
    // gets resolved the old way — additive migration).
    let activeZone = null;
    if (Array.isArray(meta.zones)) {
      for (const z of meta.zones) {
        const [zT0, zT1] = z.tempC || [];
        const [zS0, zS1] = z.timeS || [];
        if (zT0 == null || zS0 == null) continue;
        if (tempC >= zT0 && tempC <= zT1 && timeS >= zS0 && timeS <= zS1) {
          activeZone = z;
          break;
        }
      }
    }
    // Over-pull is the assertive-warning boundary. Crossing it past
    // any declared limit means the cup has turned unpleasant
    // (tannins dominant, off-aromatic register). Independent of zones.
    const op = meta.overPull;
    const isOverPulled = op
      ? ((op.tempC != null && tempC > op.tempC) || (op.timeS != null && timeS > op.timeS))
      : false;

    // Per-ingredient over-pull check (standalone-profile tannin/aromatic).
    // Walks the ingredient alone at the current brew and asks "would
    // this leaf, if brewed by itself this way, fire its over-pull
    // ceiling?" If yes, the pill should reflect that even before the
    // cup-level total trips. Catalysts skip — trace dose.
    let standaloneOverPull = null;
    if (ingRole !== "catalyst" && profile?.flavors) {
      const fMap = Object.fromEntries(profile.flavors);
      const eMap = Object.fromEntries(profile.effects || []);
      // Aligned with the cup-level bitterBar / astringencyBar in
      // perception.js so the per-ingredient state machine and the
      // cup-level warning fire on the same numeric values. Earlier
      // bitter excluded astringent and astringent excluded tannic,
      // letting tannic-heavy profiles (like over-pulled gunpowder)
      // dodge per-ingredient warnings even when the cup bars were
      // loud.
      const bitter = (fMap.bitter || 0) + (fMap.bitterness || 0)
                   + (fMap.astringent || 0) + (eMap.bitterness || 0);
      const astringent = (fMap.astringent || 0) + (fMap.tannic || 0);
      // Off-notes from the standalone profile.
      const offThresholds = { camphor: 1.8, soapy: 0.5, muddy: 1, medicinal: 1.5, harsh: 1.5, acrid: 1, burnt: 1 };
      let triggeredOff = null;
      for (const [name, threshold] of Object.entries(offThresholds)) {
        if ((fMap[name] || 0) >= threshold) {
          triggeredOff = name;
          break;
        }
      }
      // Same ladder as cup-level: bitter ≥ 4 (tannins taking over),
      // astringent ≥ 2 (astringent edge), bitter ≥ 2.5 (bitter side).
      // bitter already includes astringent so the combined "tannic"
      // tier is just bitter ≥ 4, not bitter+astringent ≥ 4.
      if (bitter >= 4) standaloneOverPull = "tannic";
      else if (astringent >= 2) standaloneOverPull = "astringent";
      else if (bitter >= 2.5) standaloneOverPull = "bitter";
      else if (triggeredOff) standaloneOverPull = triggeredOff;
    }

    // Compute a unified state. Priority (most severe first):
    //   over-pull > standalone-overpull > zone resolution > envelope
    // direction (legacy ingredients without zones).
    let state, severity;
    const driftBands = new Set(["under", "over"]);
    // At a traditional's curated baseline, the curator has accepted
    // every stretch in the recipe. We soft-suppress the per-ingredient
    // pills: accents force-green; leads also green unless they trip
    // the hard `meta.overPull` wall (which is unpleasant by definition,
    // not a curator stretch). Without this, long-decoction traditions
    // like Throat Coat or All-Heal show every accent red at baseline
    // even though tradition is the whole point.
    const standaloneToShow = _suppressAtBaseline ? null : standaloneOverPull;
    if (_suppressAtBaseline) {
      // The curator has accepted every stretch in the recipe at
      // this baseline — including past-overPull stretches like
      // Lemon Balm in All-Heal (600s, well past its 420s wall).
      // Force green; the cup-level warnings are already suppressed.
      state = (tempZone && timeZone) ? "in-zones" : "in-range";
      severity = "green";
    } else if (isOverPulled) {
      state = "over-pull"; severity = "red";
    } else if (standaloneToShow) {
      state = `standalone-${standaloneToShow}`; severity = "red";
    } else if (tempZone && timeZone) {
      // Zone resolution covers the full slider span (including under
      // and over edges) — every brew resolves to bands on both axes.
      state = "in-zones";
      const drifting = driftBands.has(tempZone.id) || driftBands.has(timeZone.id);
      severity = drifting ? "yellow" : "green";
    } else if (tempDir === "high") {
      state = "over-temp"; severity = "red";
    } else if (timeDir === "over") {
      state = "over-steep"; severity = "red";
    } else if (tempDir === "low") {
      state = "under-temp"; severity = "red";
    } else if (timeDir === "under") {
      state = "under-steep"; severity = "red";
    } else if (activeZone) {
      // Legacy 2D zone path
      state = `zone-${activeZone.id}`; severity = "green";
    } else if (Array.isArray(meta.zones) && meta.zones.length > 0) {
      state = "between-zones"; severity = "yellow";
    } else {
      state = "in-range"; severity = "green";
    }

    return {
      id, name: meta.name, weight, dose, profile, inRange, inTempRange, inTimeRange,
      tempDir, timeDir, role: ingRole,
      activeZone, tempZone, timeZone, registerZone, combination,
      isOverPulled, standaloneOverPull,
      state, severity,
    };
  });

  // Perception pipeline:
  //   raw accumulation → masking → synergies → effect floor → fragile decay.
  //
  // Flavor combination splits into two paths inside combineFlavors:
  //   - Additive set (heat, bitter, astringent — see ADDITIVE_FLAVORS
  //     in perception.js): unweighted sum × loudness, capped. Three
  //     heat sources at 1/3 dose each push the cup genuinely hotter.
  //   - Everything else: dose-weighted × loudness (the saturating
  //     behavior — two citrus at 50/50 still reads as one citrus).
  //
  // Effects accumulate by DOSE — see doseFactor above. Each leaf
  // contributes what it actually brings to the pot, so a second herb
  // adds its calm on top rather than halving the first one's.
  //
  // THE STACKING SPECIAL-CASE IS GONE, and this is why: it raised the
  // exponent on `weight` when 2+ leads expressed the same tag, which
  // was a patch over share-dilution — it lifted the cases where
  // dilution was most obviously wrong (chamomile + lemon balm reading
  // less calm than chamomile alone) and left the single-source cases,
  // where it was just as wrong and nobody had a rule for it. Dose
  // makes the patch unnecessary: co-present sources add because they
  // are both in the pot, which is the reason they should.
  const rawFlavors = combineFlavors(contributions);
  const rawEffects = {};
  for (const { dose, profile } of contributions) {
    if (!profile?.effects) continue;
    for (const [tag, strength] of profile.effects) {
      rawEffects[tag] = (rawEffects[tag] || 0) + strength * dose;
    }
  }
  // Cap stacked effects at 5 so a chai-style stack of warming
  // contributors can climb without overflowing the bar's range.
  for (const k of Object.keys(rawEffects)) {
    if (rawEffects[k] > 5) rawEffects[k] = 5;
  }

  const { perceived: perceivedFlavorMap, maskingNotes } = applyMasking(rawFlavors);

  let { effects: perceivedEffectMap, synergyTags, paradoxTags, sedativeLoad } =
    applyEffectSynergies(rawEffects, totalCaffeineMg);

  // Adaptogen-stack synergy — when 2+ ingredients flagged as
  // adaptogens are co-present at meaningful weight, tradition
  // (Ayurvedic and TCM) treats the cup as a 'tonic stack' rather
  // than a sum of individual effects. The chemistry rationale:
  // different adaptogens target different stress axes (cortisol,
  // GABA, HPA), so combining them broadens coverage without
  // over-amplifying any one register. Detected on the ingredient
  // list (not the effect map) so we don't over-fire on cups with
  // overlapping grounding/calm chemistry from non-adaptogens (e.g.
  // pu-erh + chamomile).
  const adaptogenIngs = ingredients.filter(({ id, g }) => {
    const meta = INGREDIENTS[id];
    return meta?.adaptogen === true && (g || 0) > 0;
  });
  if (adaptogenIngs.length >= 2) {
    perceivedEffectMap.calm = (perceivedEffectMap.calm || 0) + 0.3;
    perceivedEffectMap.grounding = (perceivedEffectMap.grounding || 0) + 0.2;
    perceivedEffectMap.comfort = (perceivedEffectMap.comfort || 0) + 0.2;
    synergyTags.push("tonic stack");
  }

  // Turmeric + black pepper bioavailability boost — piperine
  // inhibits hepatic glucuronidation of curcumin, multiplying its
  // systemic absorption (~20x in human trials, up to ~2000% in
  // some studies). The Ayurvedic golden-milk recipe pairs them
  // for exactly this reason; the kitchen knew the pharmacology by
  // a thousand years. Same chemistry, more reaches the body, so
  // turmeric's warming / digestive / comfort effects register
  // more strongly when pepper is present. Modest bonus rather
  // than multiplicative — the cumulative buildup is the bigger
  // story, but one cup gets a small honest lift too.
  const hasTurmeric = ingredients.some(({ id, g }) => id === "turmeric" && (g || 0) > 0);
  const hasPepper = ingredients.some(({ id, g }) => id === "black-pepper" && (g || 0) > 0);
  if (hasTurmeric && hasPepper) {
    perceivedEffectMap.warming = (perceivedEffectMap.warming || 0) + 0.3;
    perceivedEffectMap.comfort = (perceivedEffectMap.comfort || 0) + 0.2;
    perceivedEffectMap.digestive = (perceivedEffectMap.digestive || 0) + 0.2;
    synergyTags.push("absorbed deep");
  }

  // Licorice as harmonizer — Chinese herbalism's Gan Cao role.
  // Glycyrrhizin adds sweetness AND smooths perceived bitter /
  // astringent edges; licorice appears in ~60% of TCM formulas
  // for exactly this reason. When licorice makes up at least 10%
  // of cup weight, reduce the cup-level bitter and astringent
  // readings by 25% and add a 'harmonized' synergy tag. Operates
  // on the perceived flavor map, so balance bars and warnings
  // both see the smoothed values. Doesn't affect mood effects —
  // it's a palate modulation, not a sedative or energizing role.
  const licoriceWeight = ingredients
    .filter(({ id }) => id === "licorice-root")
    .reduce((s, i) => s + (i.g || 0), 0);
  if (licoriceWeight / Math.max(0.01, totalG) >= 0.10) {
    if (perceivedFlavorMap.bitter) perceivedFlavorMap.bitter *= 0.75;
    if (perceivedFlavorMap.bitterness) perceivedFlavorMap.bitterness *= 0.75;
    if (perceivedFlavorMap.astringent) perceivedFlavorMap.astringent *= 0.75;
    synergyTags.push("harmonized");
  }

  // Declared `effects` are now labels for search/curation only — the
  // engine output stands on its own so the chemistry can be honest.

  // Fragile-effect attenuation — overpulled cups blunt focus / calm /
  // soothing / uplifting alongside the bitterness they add. The
  // parabolic curve the monotonic extraction profiles can't model.
  perceivedEffectMap = attenuateFragileEffects(perceivedEffectMap, perceivedFlavorMap);

  // Convert maps to sorted tuple arrays for the UI layer.
  // Round first, then filter on the rounded display value: anything
  // that would render as 0.5 or higher actually appears. Filtering
  // on the unrounded value caused boundary flicker — chai's pungent
  // hovers right at the visibility line, and tiny upstream
  // differences (interpolated extraction at one brew vs another)
  // produced 0.49 vs 0.51 readings that the user saw as a flavor
  // 'disappearing' when the slider crossed the threshold.
  const flavors = Object.entries(perceivedFlavorMap)
    .map(([name, v]) => [name, Math.round(v * 10) / 10])
    .filter(([, v]) => v >= 0.5)
    .sort((a, b) => b[1] - a[1]);

  // Effects = mood/feel axis only. Sensory dimensions (bitterness,
  // sweetness, astringency, tartness, menthol mouth-cooling) live in
  // `balance` below. TCM-cooling stays here as a mood; menthol mouth-
  // cooling lives on the balance side.
  const effects = Object.entries(perceivedEffectMap)
    .map(([tag, v]) => [tag, Math.round(v * 10) / 10])
    .filter(([tag, v]) => v > 0 && tag !== "bitterness")
    .sort((a, b) => b[1] - a[1]);

  // Balance bars — taste-structure axes (BALANCE_AXES at module top).
  const balance = buildBalanceBars(perceivedFlavorMap, perceivedEffectMap);

  // One-line summaries — the dominant 1–2 effects and flavors, threshold-
  // gated so a quiet cup doesn't claim a definite read. Posted alongside
  // the synergy pills in the UI as a quick "this is what the cup is" line.
  // Thresholds tuned for blends: a 3-leaf cup at 0.5g each weights every
  // flavor down to ~0.33× of its single-ingredient strength, so the old
  // 1.5/1.0 cutoffs read most blends as "no dominant flavor" even when
  // a clear character exists. Tertiary slot opens up so a cup like
  // darjeeling+ginger+hibiscus can name muscatel + tart + warm.
  const moodSummary   = summarizeTopTuples(effects, { primary: 1.4, secondary: 1.0, tertiary: 0.7 });
  const flavorSummary = summarizeTopTuples(flavors, { primary: 0.9, secondary: 0.6, tertiary: 0.4 });

  const rawFlavorTuples = Object.entries(rawFlavors)
    .map(([name, v]) => [name, Math.round(v * 10) / 10])
    .sort((a, b) => b[1] - a[1]);

  // Outsider warnings fire for any out-of-range ingredient that's
  // not a catalyst (catalysts are bioavailability adjuncts at trace
  // weight — a 0.05g pinch of black pepper at the wrong temp isn't
  // a problem worth surfacing). Both leads and accents trigger so
  // the user sees the full picture of what's being stretched.
  // Each outsider carries:
  //   - reason: which axis is out (temp / time / both)
  //   - role: "lead" or "accent" — the UI can render leads more
  //     prominently; the test layer uses this to enforce stricter
  //     rules on leads while accepting accent stretches.
  // Outsider warnings fire only when an ingredient's brew is
  // outside its envelope AND the multi-axis zone resolver doesn't
  // cover the value. Ingredients with full zone coverage describe
  // every reachable slider point through the in-zones cascade,
  // so the older outsider warning would double-report the same
  // information.
  const atCuratedBaseline = curated
    && baselineTempC != null && baselineTimeS != null
    && tempC === baselineTempC && timeS === baselineTimeS;

  // Was this ingredient ALREADY outside its range at the recipe's own
  // brew? Only asked AT that brew — see the note on recipeStretch.
  const stretchedAtBaseline = (id) => {
    if (baselineTempC == null || baselineTimeS == null) return false;
    const meta = INGREDIENTS[id];
    if (!meta) return false;
    const [tLo, tHi] = meta.tempC;
    const [sLo, sHi] = meta.timeS || [0, Infinity];
    return baselineTempC < tLo || baselineTempC > tHi
        || baselineTimeS < sLo || baselineTimeS > sHi;
  };

  const rawOutsiders = contributions
    .filter(c => !c.inRange && c.role !== "catalyst" && !(c.tempZone && c.timeZone))
    .map(c => ({
      name: c.name,
      role: c.role,
      reason: !c.inTempRange && !c.inTimeRange ? "both"
            : !c.inTempRange ? "temp"
            : "time",
      tempDir: c.tempDir,  // "low" | "high" | null
      timeDir: c.timeDir,  // "under" | "over" | null
      // ONLY on first open, at the recipe's own brew. A traditional
      // style that brews a leaf past its own window is saying the
      // tradition outranks the chemistry, and that is worth saying once
      // — when the drinker opens the recipe and sees a cup our own
      // guidance would call over-pulled.
      //
      // It is deliberately NOT sticky. Once the drinker moves a slider
      // the cup is theirs, not the tradition's, and every stretch reads
      // as an ordinary warning again. A note that followed the sliders
      // would stop being a statement about the recipe and start being
      // an excuse for whatever the user did to it.
      recipeStretch: isTraditional && atCuratedBaseline && stretchedAtBaseline(c.id),
    }));

  // For curated blends sitting exactly on the curator's chosen brew,
  // suppress warnings — the curator already accepted that brew.
  // The moment the user moves either slider, fall back to the honest
  // list. Suppression is *traditional-only*: experimental/custom blends
  // must be tuned so they pass cleanly without the suppression crutch.
  // Tradition's whole point is that the modern algorithm flags it as
  // past-optimum, but the practice predates the algorithm — that's why
  // the tradition-over-literature note exists.
  const suppressAtBaseline = atCuratedBaseline && isTraditional;
  // Suppression used to drop EVERYTHING at a traditional baseline, so
  // the drinker was told nothing — and never learned that the recipe
  // deliberately sits past where our own guidance would stop. That is
  // the one thing worth saying there.
  //
  // So at baseline the recipe's own stretch surfaces as a character
  // note and nothing else does; away from baseline the note is gone
  // and ordinary warnings apply.
  const outsiders = suppressAtBaseline
    ? rawOutsiders.filter(o => o.recipeStretch)
    : rawOutsiders;

  /* WHAT THE CUP READS AT ITS OWN RECOMMENDED BREW — the number the
     warnings are measured AGAINST, rather than an absolute line.

     A threshold that only knows a level has to answer "is 2.6 bitter
     too bitter?" without knowing what the drink is. For reishi the
     answer is no — reishi is bitter, proverbially so, and its own
     correct brew reads at the top of the scale. The app was telling
     the user to shave the steep on a cup brewed exactly as its
     research prescribes, which is the app disagreeing with itself in
     front of the person it's teaching.

     So the question becomes "is this cup MORE bitter than the same
     leaves at the brew we recommend?" — which is answerable, is the
     thing the user can actually act on, and makes "your own
     recommended brew is clean" true by construction instead of by
     tuning numbers against it.

     The baseline is the curator's brew when there is one and the
     algorithm's recommendation otherwise, so an experimental blend
     the user assembled gets the same treatment as a shipped one.

     KNOWN LIMIT, and it is the reason the ingredient audit matters:
     four leaves (turmeric, valerian, reishi, ashwagandha) sit pegged
     at the cap for bitterness from the center of their researched
     window onward. Their reading doesn't RISE when over-steeped
     because it has nowhere left to go, so this check will keep quiet
     where it should speak. Re-gridding those four profiles is what
     restores the signal; until then the failure is silence, not a
     false alarm. */
  const _baseline = (() => {
    if (_readingOnly) return null;
    const rec = (baselineTempC != null && baselineTimeS != null)
      ? { tempC: baselineTempC, timeS: baselineTimeS }
      : computeBrewProfile(ingredients);
    if (rec.tempC === tempC && rec.timeS === timeS) {
      return { flavors: perceivedFlavorMap, effects: perceivedEffectMap };
    }
    _readingDepth++;
    try {
      // PerCup, not the normalizer: `ingredients` here is already one
      // cup's worth. Going back through the front door would be a
      // no-op today (no ml is passed) and a silent double-division the
      // moment someone threads one through.
      const at = resolveBlendAtBrewPerCup(
        ingredients, rec.tempC, rec.timeS,
        baselineTempC, baselineTimeS, curated, isTraditional,
      );
      return { flavors: at.perceivedFlavors, effects: at.perceivedEffects };
    } finally {
      _readingDepth--;
    }
  })();

  // (5a) Cup-level warnings — what the average reads.
  /* How many cups' worth of leaf is actually in this cup.
     `TSP_BY_CATEGORY` already knows what a cup's dose of each category
     weighs — the same numbers `doseFactor` normalizes against — so this
     is a sum of each leaf in its own units rather than a raw gram total.
     Chamomile and ginger do not weigh the same per spoon and must not
     count the same here. */
  const cupDoses = ingredients.reduce((sum, { id, g }) => {
    const perCup = TSP_BY_CATEGORY[INGREDIENTS[id]?.category] || 1.5;
    return sum + Math.max(0, g || 0) / perCup;
  }, 0);

  const rawCupWarnings = _readingOnly ? [] : buildWarnings({
    baselineFlavors: _baseline?.flavors,
    baselineEffects: _baseline?.effects,
    outsiders,
    maskingNotes,
    perceivedEffects: perceivedEffectMap,
    perceivedFlavors: perceivedFlavorMap,
    paradoxTags,
    caffeineMg: totalCaffeineMg,
    sedativeLoad,
    cupDoses,
  });
  // Traditionals at baseline also drop tannin/aromatic cup warnings —
  // the whole purpose of the tradition note is to acknowledge the
  // recipe lives past where modern analysis would call optimal.
  // `pour` joins them. A gourd of yerba mate is 4.17 cup-doses and is
  // not a mistake — it is the preparation. Same argument as tannin:
  // the tradition note already says this recipe lives past where modern
  // analysis would call optimal, and scolding the pour on top of that
  // reads as the app not knowing its own catalog.
  const cupWarnings = suppressAtBaseline
    ? rawCupWarnings.filter(w => w.kind !== "tannin" && w.kind !== "aromatic" && w.kind !== "pour")
    : rawCupWarnings;

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
  // Walk every lead and accent ingredient — both can fire over-pull
  // warnings. Catalysts (e.g. a 0.05g pinch of black pepper for
  // turmeric bioavailability) skip this; their dose is too low to
  // matter. Each warning carries the `role` so downstream layers can
  // render leads more prominently and the test layer can enforce
  // stricter rules on leads.
  const allIndividualWarnings = [];
  const seenIndividual = new Set();
  /* THE LEAF'S OWN BASELINE — its own brew, not the blend's.

     The cup-level checks became differential above; this one stayed
     absolute, and it is the one that names a leaf and says it is being
     abused. A bitter-by-nature root got told off at the brew its own
     research prescribes, which is the complaint that started this.

     The reference is the leaf brewed as the app would brew it ALONE.
     Keying it to the blend's baseline instead was the first attempt
     and it went too far the other way: a cup steeped a minute past a
     baseline that already sat at the top of some leaf's window showed
     no rise worth the name, so the warning went silent exactly where
     it was most deserved. A leaf's own window is a fixed thing and
     doesn't move when a recipe drags it somewhere; measuring against
     that says "this is more than YOU want", which is what the warning
     claims in words.

     Resolved straight from the extraction profile rather than through
     the cup, because what's judged here is the leaf, not the blend
     around it. Cached — a blend re-resolves on every slider frame. */
  const leafBaselineCache = new Map();
  const leafBaseline = (id) => {
    if (leafBaselineCache.has(id)) return leafBaselineCache.get(id);
    const meta = INGREDIENTS[id];
    let out = null;
    if (meta) {
      const own = computeBrewProfile([{ id, g: 1, role: "lead" }]);
      const at = resolveExtractionProfile(
        id,
        own.tempC,
        meta.whisked && meta.timeS ? Math.min(own.timeS, meta.timeS[1]) : own.timeS,
      );
      if (at) out = { flavors: Object.fromEntries(at.flavors), effects: Object.fromEntries(at.effects) };
    }
    leafBaselineCache.set(id, out);
    return out;
  };

  for (const { id, name, profile, role } of contributions) {
    if (role === "catalyst") continue;
    const fMap = Object.fromEntries(profile.flavors);
    const eMap = Object.fromEntries(profile.effects);
    const base = leafBaseline(id);
    const ingWarnings = buildWarnings({
      perceivedFlavors: fMap,
      perceivedEffects: eMap,
      baselineFlavors: base?.flavors,
      baselineEffects: base?.effects,
    });
    for (const w of ingWarnings) {
      if (w.kind !== "tannin" && w.kind !== "aromatic") continue;
      const key = `${name}|${w.kind}`;
      if (seenIndividual.has(key)) continue;
      seenIndividual.add(key);
      const lc = w.text.charAt(0).toLowerCase() + w.text.slice(1);
      allIndividualWarnings.push({
        kind: w.kind,
        role: role || "lead",
        text: `${name} is being over-pulled — ${lc}`,
      });
    }
  }
  const individualWarnings = pushedHarder ? allIndividualWarnings : [];

  /* THE OTHER HALF OF THE SENTENCE, which the warnings layer has never
     been able to say.

     Every per-ingredient warning above is an OVER-pull: the filter is
     `tannin` / `aromatic` and the text is "is being over-pulled". There
     was no under-steep kind at all, and brewBounds says so out loud
     where it explains why the opening cup clamps to the earliest
     closing window: "over-pulling warns while under-steeping is
     silent." The clamp was built to route AROUND the missing warning.

     So the default steered into the one failure mode the app could not
     describe. Chamomile and lion's mane have windows that do not meet;
     the cup opens at 7:00, chamomile's ceiling, and lion's mane gets
     70% of its MINIMUM steep. Three warnings fire on that cup — pour,
     masking, ceiling — and not one of them mentions the leaf that is
     barely in the water. Chatty and confident about everything except
     the thing actually wrong, which reads as "checked, and it's fine."

     NOT GATED ON `pushedHarder`, deliberately, and this is the whole
     reason it is a separate list. That flag means "the user pushed past
     the recommendation", which is the right suppressor for an over-pull
     — at or below the baseline, a strong cup is accepted compromise.
     Under-steeping is the opposite direction: it is at its worst AT the
     baseline, because the baseline is what clamped short in the first
     place. Gating it there would silence it exactly where it is most
     deserved — the same trap the tradition note documents one block
     down.

     Same population as the over-pull loop (leads and accents, catalysts
     skipped) and it carries `role` for the same reason, so a lead
     reading short can render louder than an accent that is only a
     whisper on purpose. Tolerance is the tradition tolerance, so short
     and long are judged by one number rather than two that drift. */
  const fmtS = (s) => s >= 60
    ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`
    : `${Math.round(s)}s`;
  const understeepWarnings = [];
  /* WEIGHTS COME FROM `ingredients`, NOT `contributions` — the latter
     does not carry `g` at all, and reading it there silently produced
     a share of 0/0 that skipped nobody. Caught because the two curated
     vanilla blends kept firing after the threshold went in. */
  const understeepG = new Map(ingredients.map(({ id, g }) => [id, g || 0]));
  for (const { id, name, role } of contributions) {
    const g = understeepG.get(id) || 0;
    if (role === "catalyst") continue;
    const meta = INGREDIENTS[id];
    const sMin = meta?.timeS?.[0];
    if (sMin == null) continue;
    if (timeS >= sMin - TRADITION_TIME_TOLERANCE_S) continue;
    // A whisper stays a whisper — see MATERIAL_SHARE for why this is a
    // weight share and not the `role` the composer stamped on it.
    if (totalG > 0 && g / totalG < MATERIAL_SHARE) continue;
    understeepWarnings.push({
      kind: "understeep",
      role: role || "lead",
      text: `${name} is barely in the water — it opens at ${fmtS(sMin)} `
        + `and this cup stops at ${fmtS(timeS)}.`,
    });
  }

  // Tradition-over-literature notice fires when at least one lead
  // ingredient is meaningfully outside its preferred window OR a
  // cup-level warning is firing at the curated baseline. Temp
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
  // A tradition that lands on the *edge* of an ingredient's window
  // (Moroccan Mint at 90°C/180s, gunpowder's upper edge) doesn't
  // trigger meaningfulDeviation but still fires astringent / tannin
  // at the curated baseline — that's the case the original notice
  // was for. If the recipe is traditional, the user is sitting on
  // the curator's chosen brew, and the cup is already showing some
  // form of warning, surface the note.
  // Use the unfiltered set so the tradition note still fires when the
  // baseline genuinely had something to suppress (otherwise the note
  // would never appear, since cupWarnings is empty after suppression).
  /* THE LEVEL, not the rise. Warnings are differential now — measured
     against what these leaves read at the brew we recommend — which
     makes the baseline clean by construction and would have killed
     this note silently: it fires when the baseline "has something to
     suppress", and under a rise test a baseline never does.
     
     The note is a statement about the LEVEL anyway ("this cup is
     strong, and the practice means it to be"), so it asks for the
     level directly: the same reading, judged with no baseline, which
     is buildWarnings' absolute behavior. */
  const baselineWarningFires = _baseline
    ? buildWarnings({
        perceivedFlavors: _baseline.flavors,
        perceivedEffects: _baseline.effects,
      }).some(w => w.kind === "tannin" || w.kind === "aromatic")
    : (rawCupWarnings || []).length > 0;
  // Tradition-over-literature note only makes sense for actual traditional
  // preparations. Experimental and synthetic blends are still "curated" (we
  // pass a baseline for warning suppression) but they don't carry centuries
  // of practice — firing the note on them would misattribute their brew.
  const traditionNote = atCuratedBaseline && isTraditional
    && (meaningfulDeviation || baselineWarningFires);

  // Merge cup-level and individual warnings. The earlier suppression
  // (drop cup-level when same-kind individual fires) silently broke
  // the explorer's tannin/aromatic display: per-ingredient warnings
  // get filtered OUT of the cup-warning surface (they render in the
  // per-pill detail box instead), so suppressing the cup-level too
  // left the user with no warning at all even when the bitter /
  // astringent bars clearly said the cup needed pulling back. Keep
  // both: cup-level shows the overall reading; per-ingredient shows
  // which leaf is the source — different audiences, both useful.
  const warnings = [
    ...cupWarnings,
    ...individualWarnings,
    ...understeepWarnings,
  ];

  return {
    effects,
    balance,
    flavors,
    rawFlavors: rawFlavorTuples,
    synergyTags,
    paradoxTags,
    warnings,
    outsiders,
    perIngredient: contributions,
    // The perceived maps, so a caller (or this function, one level
    // down) can read what the cup SAYS rather than re-deriving it.
    // Used by the baseline comparison below.
    perceivedFlavors: perceivedFlavorMap,
    perceivedEffects: perceivedEffectMap,
    traditionNote,
    moodSummary,
    flavorSummary,
    // Cup-level caffeine load in mg — surfaced so the Balance section
    // can render a caffeine bar alongside bitter/astringent. Already
    // used internally by buildWarnings for the high-caffeine-load
    // alert; same number, now visualized.
    caffeineMg: totalCaffeineMg,
    // Share of cup weight from adaptogen-flagged ingredients (tulsi,
    // ashwagandha, reishi, lion's mane, licorice). Used by the UI to
    // surface the daily-use caveat — adaptogens build cumulatively
    // over weeks rather than acting on the cup alone.
    adaptogenShare: adaptogenIngs.reduce((s, i) => s + (i.g || 0), 0) / Math.max(0.01, totalG),
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

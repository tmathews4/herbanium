
/* ──────────────────────────────────────────────────────────────
   algo/compose.js — blend composition and candidate-ranking logic. The current implementation is the pre-research placeholder; algorithm phase will rewrite in place.
   ────────────────────────────────────────────────────────────── */

import {
  BLENDS, FLAVOR_WORDS, MOOD_BLENDS, MOOD_CONFLICTS, FLAVOR_CONFLICTS,
  flavorMaskStrength, moodMaskStrength, MOOD_SINGLE_NAMES,
  MOOD_WORDS, PAIR_BLENDS,
} from "../data/blends.js";
import { INGREDIENTS } from "../data/ingredients.js";
import { wouldCreateUnsafeCombination } from "../data/safety.js";

// How much steep-time slack counts as the same brew. Used by the
// tradition-over-literature notice and the research-aligned
// recommendation line. The user's framing was "off by a minute or
// two" — 120s captures that and matches most ingredients' wiggle
// room within their preferred window. Temp deviations always count
// (no tolerance) because they shift extraction much more sharply.
export const TRADITION_TIME_TOLERANCE_S = 120;

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

  let tempC;
  if (tempIntersects) {
    // Round to 1°C precision (matches the slider step). Earlier code
    // snapped to 5°C; integer rounding lands recommendations cleanly
    // inside tight ranges like [95, 100] without nudging to the edge.
    tempC = Math.round(Math.max(tIntMin, Math.min(tIntMax, wTempCentroid)));
  } else {
    tempC = Math.round(wTempCentroid);
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
  attenuateFragileEffects, applyEffectFloor,
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
  { name: "tartness",    flavors: ["tart", "bright", "cranberry"] },
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

export function resolveBlendAtBrew(ingredients, tempC, timeS, baselineTempC, baselineTimeS, curated = false, isTraditional = false, declaredEffects = null) {
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
      const bitter = (fMap.bitter || 0) + (fMap.bitterness || 0) + (eMap.bitterness || 0);
      const astringent = fMap.astringent || 0;
      // Off-notes from the standalone profile.
      const offThresholds = { camphor: 1.8, soapy: 0.5, muddy: 1, medicinal: 1.5, harsh: 1.5, acrid: 1, burnt: 1 };
      let triggeredOff = null;
      for (const [name, threshold] of Object.entries(offThresholds)) {
        if ((fMap[name] || 0) >= threshold) {
          triggeredOff = name;
          break;
        }
      }
      if (bitter + astringent >= 4) standaloneOverPull = "tannic";
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
      id, name: meta.name, weight, profile, inRange, inTempRange, inTimeRange,
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
  // Effects use the same sub-linear stacking model as additive
  // flavors — but applied to ALL effects, not a curated subset.
  // When 2+ LEAD ingredients each contribute to the same effect
  // at strength ≥ STACKING_MIN_STRENGTH, those leads accumulate
  // via weight^STACK_EXPONENT instead of plain dose-weighted sum.
  // Lifts the cup's calm / focus / energy reading when multiple
  // ingredients honestly contribute, so a chamomile + lemon balm
  // combo reads more calming than chamomile alone — without
  // running away to the cap. Single-source blends are unchanged
  // (any weight^k = same when weight = 1, so curated 1-leaf
  // catalog entries keep their existing calibration).
  const rawFlavors = combineFlavors(contributions);
  const rawEffects = {};
  // First pass — count strong LEAD contributors per effect tag.
  // An effect only switches to stacking when 2+ leads independently
  // express it at meaningful strength.
  const effectStrongCount = {};
  for (const { profile, role } of contributions) {
    if ((role || "lead") !== "lead") continue;
    if (!profile?.effects) continue;
    for (const [tag, strength] of profile.effects) {
      if (strength >= STACKING_MIN_STRENGTH) {
        effectStrongCount[tag] = (effectStrongCount[tag] || 0) + 1;
      }
    }
  }
  // Second pass — accumulate. Lead contributions to effects with
  // ≥2 strong leads use the stacking path; everything else uses
  // dose-weighted (today's behavior).
  for (const { weight, profile, role } of contributions) {
    if (!profile?.effects) continue;
    const isLead = (role || "lead") === "lead";
    for (const [tag, strength] of profile.effects) {
      const stack = isLead && (effectStrongCount[tag] || 0) >= 2;
      const w = stack
        ? Math.pow(Math.max(0, weight), STACK_EXPONENT)
        : weight;
      rawEffects[tag] = (rawEffects[tag] || 0) + strength * w;
    }
  }
  // Cap stacked effects at 5 so a chai-style stack of warming
  // contributors can climb without overflowing the bar's range.
  for (const k of Object.keys(rawEffects)) {
    if (rawEffects[k] > 5) rawEffects[k] = 5;
  }

  const { perceived: perceivedFlavorMap, maskingNotes } = applyMasking(rawFlavors);

  let { effects: perceivedEffectMap, synergyTags, paradoxTags } =
    applyEffectSynergies(rawEffects);

  // Declared blend.effects soft-floor (80% of declared) so a curator's
  // promise about a tag can't silently disappear when the ingredient
  // extraction profile doesn't list it (e.g. pu-erh's grounding).
  perceivedEffectMap = applyEffectFloor(perceivedEffectMap, declaredEffects);

  // Fragile-effect attenuation — overpulled cups blunt focus / calm /
  // soothing / uplifting alongside the bitterness they add. The
  // parabolic curve the monotonic extraction profiles can't model.
  perceivedEffectMap = attenuateFragileEffects(perceivedEffectMap, perceivedFlavorMap);

  // Convert maps to sorted tuple arrays for the UI layer.
  // Drop sub-threshold flavors (< 0.5) — they're noise.
  const flavors = Object.entries(perceivedFlavorMap)
    .filter(([, v]) => v >= 0.5)
    .map(([name, v]) => [name, Math.round(v * 10) / 10])
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
    }));

  // For curated blends sitting exactly on the curator's chosen brew,
  // suppress warnings — the curator already accepted that brew.
  // The moment the user moves either slider, fall back to the honest
  // list. Suppression is *traditional-only*: experimental/custom blends
  // must be tuned so they pass cleanly without the suppression crutch.
  // Tradition's whole point is that the modern algorithm flags it as
  // past-optimum, but the practice predates the algorithm — that's why
  // the tradition-over-literature note exists.
  const atCuratedBaseline = curated
    && baselineTempC != null && baselineTimeS != null
    && tempC === baselineTempC && timeS === baselineTimeS;
  const suppressAtBaseline = atCuratedBaseline && isTraditional;
  const outsiders = suppressAtBaseline ? [] : rawOutsiders;

  // (5a) Cup-level warnings — what the average reads.
  const rawCupWarnings = buildWarnings({
    outsiders,
    maskingNotes,
    perceivedEffects: perceivedEffectMap,
    perceivedFlavors: perceivedFlavorMap,
    paradoxTags,
  });
  // Traditionals at baseline also drop tannin/aromatic cup warnings —
  // the whole purpose of the tradition note is to acknowledge the
  // recipe lives past where modern analysis would call optimal.
  const cupWarnings = suppressAtBaseline
    ? rawCupWarnings.filter(w => w.kind !== "tannin" && w.kind !== "aromatic")
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
  for (const { name, profile, role } of contributions) {
    if (role === "catalyst") continue;
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
        role: role || "lead",
        text: `${name} is being over-pulled — ${lc}`,
      });
    }
  }
  const individualWarnings = pushedHarder ? allIndividualWarnings : [];

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
  const baselineWarningFires = (rawCupWarnings || []).length > 0;
  // Tradition-over-literature note only makes sense for actual traditional
  // preparations. Experimental and synthetic blends are still "curated" (we
  // pass a baseline for warning suppression) but they don't carry centuries
  // of practice — firing the note on them would misattribute their brew.
  const traditionNote = atCuratedBaseline && isTraditional
    && (meaningfulDeviation || baselineWarningFires);

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
    balance,
    flavors,
    rawFlavors: rawFlavorTuples,
    synergyTags,
    paradoxTags,
    warnings,
    outsiders,
    perIngredient: contributions,
    traditionNote,
    moodSummary,
    flavorSummary,
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

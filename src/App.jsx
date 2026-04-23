import React, { useState, useEffect, useRef } from "react";
import { theme, ff } from "./theme";
import {
  UnitContext, useUnit,
  cToF, formatTemp, formatTempRange, formatTempShort,
  TSP_BY_CATEGORY, gramsToTsp, prettyFraction, formatTsp, formatAmount,
} from "./units/units";
import {
  INGREDIENTS,
  MOODS, FLAVORS,
  EFFECT_TO_MOOD, FLAVOR_TO_CATEGORY,
} from "./data/ingredients";
import {
  BLENDS,
  MOOD_BLENDS, PAIR_BLENDS,
  MOOD_CONFLICTS, FLAVOR_CONFLICTS,
  MOOD_SINGLE_NAMES,
} from "./data/blends";
import { SEED_MODES } from "./data/seeds";
import { buildWaitCards } from "./data/waitContent";
import { Sprig, Flower, Leaf, Kettle, Ornament } from "./components/icons";
import {
  SectionLabel, FitText, ChipRows, Chip, Rule,
} from "./components/layout";
import { EffectBar } from "./components/EffectBar";
import { FactsCard } from "./components/FactsCard";
import { DemoHint } from "./components/DemoHint";

/* ──────────────────────────────────────────────────────────────
   Herbanium — interactive mock
   Aesthetic: warm paper / apothecary journal
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   Blend helpers
   ────────────────────────────────────────────────────────────── */

// LOCAL_BLENDS: mock-only in-memory store for blends that didn't exist
// at boot — e.g. a user's newly-posted blend. Real app would persist these
// to the backing store instead. Lives at module scope so getBlend() can
// find them regardless of which component is looking.
const LOCAL_BLENDS = {};

const getBlend = (id) => LOCAL_BLENDS[id] || BLENDS.find(b => b.id === id);
const mmss = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

/* ──────────────────────────────────────────────────────────────
   Screen: HOME
   ────────────────────────────────────────────────────────────── */

const HomeScreen = ({ go, openBlend, openInCompose, sessions, savedBlendIds }) => {
  const yourSessions = sessions.filter(s => s.who === "you");
  const favoriteBlends = BLENDS.filter(b => savedBlendIds.has(b.id));
  const isEmpty = yourSessions.length === 0 && favoriteBlends.length === 0;

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FitText style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, lineHeight: 1.05 }}>
            {isEmpty
              ? <>Welcome, <em style={{ color: theme.terra }}>Tommy</em>.</>
              : <>What's the tea, <em style={{ color: theme.terra }}>Tommy</em>?</>
            }
          </FitText>
        </div>
      </div>

      {/* CTA */}
      <button onClick={() => go("compose")} style={{
        width: "100%", textAlign: "left",
        background: theme.ink, color: theme.cream,
        border: "none", borderRadius: 14, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", marginBottom: 24,
        boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
      }}>
        <div>
          {isEmpty && (
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, opacity: 0.7 }}>
              to begin your journal
            </div>
          )}
          <div style={{ fontFamily: ff.serif, fontSize: 20 }}>
            {isEmpty ? "Brew your first cup →" : "Brew a cup →"}
          </div>
        </div>
        <Kettle size={24} c={theme.cream} />
      </button>

      {/* New-user onboarding card */}
      {isEmpty && (
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          marginBottom: 22, textAlign: "center",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Ornament w={120} c={theme.ochre} />
          </div>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: theme.ash,
            marginBottom: 6,
          }}>
            your journal begins here
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 14.5,
            color: theme.inkSoft, lineHeight: 1.55,
          }}>
            Set a cup out. Brew it with intent. Log how it landed.<br />
            The app learns you cup by cup.
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <Ornament w={120} c={theme.ochre} />
          </div>
        </div>
      )}

      {/* Favorites — horizontal scrollable row */}
      {favoriteBlends.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <SectionLabel n="i">Favorites</SectionLabel>
            <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash }}>
              {favoriteBlends.length} saved
            </span>
          </div>
          <div style={{
            display: "flex", gap: 10, overflowX: "auto", marginBottom: 22,
            paddingBottom: 4, marginLeft: -2, paddingLeft: 2,
          }}>
            {favoriteBlends.map(b => (
              <FavoriteCard key={b.id} b={b} onTap={() => openInCompose(b.id)} />
            ))}
          </div>
        </>
      )}

      {/* Your recent cups */}
      {yourSessions.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <SectionLabel n={favoriteBlends.length > 0 ? "ii" : "i"}>Recent brews</SectionLabel>
            <button onClick={() => go("library")} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
              cursor: "pointer",
            }}>see all →</button>
          </div>
          <div>
            {yourSessions.slice(0, 5).map((s, i) => (
              <CompactSessionRow key={s.id} s={s} openBlend={openBlend} first={i === 0} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Favorite cards — compact snapshots of saved blends in the Home's favorites row.
// One tap opens Compose with the blend pre-selected so intent capture happens.
const FavoriteCard = ({ b, onTap }) => {
  const { unit, weightUnit } = useUnit();
  return (
    <button onClick={onTap} style={{
      flex: "0 0 auto", width: 150,
      textAlign: "left",
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 10, padding: "10px 12px", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {b.mood === "calm"    && <Flower size={16} c={theme.plum} />}
        {b.mood === "energy"  && <Leaf   size={16} c={theme.sageDeep} />}
        {b.mood === "comfort" && <Sprig  size={16} c={theme.ochre} />}
        {b.mood === "focus"   && <Leaf   size={16} c={theme.sage} />}
        {b.mood === "sleepy"  && <Flower size={16} c={theme.plum} />}
        {b.mood === "settle"  && <Sprig  size={16} c={theme.sage} />}
        <span style={{
          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
          color: theme.ash,
        }}>{b.mood}</span>
      </div>
      <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, lineHeight: 1.15 }}>
        {b.name}
      </div>
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, lineHeight: 1.3 }}>
        {b.subtitle}
      </div>
      <div style={{ fontFamily: ff.mono, fontSize: 10, color: theme.inkSoft, marginTop: 2 }}>
        {formatTempShort(b.tempC, b.tempC, unit)} · {mmss(b.timeS)}
      </div>
    </button>
  );
};

const CompactSessionRow = ({ s, openBlend, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  return (
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "10px 2px", cursor: "pointer",
      display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <span style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {b.name}
        </span>
        <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, whiteSpace: "nowrap" }}>
          {s.intent} → {s.actual}
        </span>
      </div>
      <span style={{ fontSize: 11, color: theme.terra, letterSpacing: "0.1em" }}>
        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
      </span>
      <span style={{ fontSize: 10.5, color: theme.ash, letterSpacing: "0.08em" }}>{s.ago}</span>
    </button>
  );
};

// Legacy SessionRow — still used in Library history tab.
const SessionRow = ({ s, openBlend, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  return (
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "14px 2px", cursor: "pointer",
      display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 12, alignItems: "start",
    }}>
      <div style={{ marginTop: 2 }}>
        {b.mood === "calm"    && <Flower size={22} c={theme.plum} />}
        {b.mood === "energy"  && <Leaf   size={22} c={theme.sageDeep} />}
        {b.mood === "comfort" && <Sprig  size={22} c={theme.ochre} />}
        {b.mood === "focus"   && <Leaf   size={22} c={theme.sage} />}
      </div>
      <div>
        <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2 }}>
          {b.name}
          {s.who !== "you" && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash, marginLeft: 6 }}>· {s.who}</span>}
        </div>
        <div style={{ fontSize: 11.5, color: theme.ash, marginTop: 3, letterSpacing: "0.03em" }}>
          <span style={{ fontStyle: "italic", fontFamily: ff.serif }}>{s.intent}</span>
          <span style={{ margin: "0 6px", color: theme.rule }}>→</span>
          <span style={{ color: theme.sageDeep }}>{s.actual}</span>
          <span style={{ margin: "0 8px", color: theme.rule }}>·</span>
          <span>{"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span></span>
        </div>
        {s.note && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft, marginTop: 5 }}>
            "{s.note}"
          </div>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: theme.ash, letterSpacing: "0.08em", marginTop: 4 }}>{s.ago}</div>
    </button>
  );
};

/* ──────────────────────────────────────────────────────────────
   Blend resolver — deterministic mood → blend
   Handles single moods, curated pairs, and n-way fallbacks.
   ────────────────────────────────────────────────────────────── */

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
function computeBrewProfile(ingredients) {
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
function resolveBlend(moods, flavor) {
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
const FLAVOR_COMPLEMENTS = {
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
const MOOD_NEIGHBORS = {
  calm:    ["sleepy", "settle"],
  focus:   ["energy", "calm"],
  energy:  ["focus"],
  sleepy:  ["calm", "settle"],
  comfort: ["settle", "calm"],
  settle:  ["comfort", "calm"],
};

// Build a flavor-accent variant — holds mood constant, swaps in an ingredient
// carrying a specified ACCENT flavor. Reduces base grams slightly to make room.
function buildAccentVariantByFlavor(primary, accentFlavor) {
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
function buildAccentVariantByMood(primaryMood, neighborMood, flavor) {
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
function resolveCandidates(moods, flavor, primaryAxis = "feel") {
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
   Screen: COMPOSE
   ────────────────────────────────────────────────────────────── */

const ComposeScreen = ({ go, startBrew, savedBlendIds, openBlend, composePreselect, openInCompose, pantryIds }) => {
  const { unit, weightUnit } = useUnit();
  const [mode, setMode] = useState("forward"); // forward | reverse | library | traditions
  const [moods, setMoods] = useState([]);        // start empty — user sets their intent
  const [flavors, setFlavors] = useState([]);    // multi-select, same pattern as moods
  const [onlyPantry, setOnlyPantry] = useState(false);
  const [reverseIngs, setReverseIngs] = useState(["chamomile", "lemonbalm"]);
  // Which axis leads: "feel" (mood-primary) or "taste" (flavor-primary).
  // Changes which side shows as the prominent row and which axis the
  // resolver varies across for alternate candidates.
  const [primaryAxis, setPrimaryAxis] = useState("feel");

  // When a favorite is tapped on Home (or a saved blend in Apothecary),
  // composePreselect arrives here. Switch to the Apothecary sub-tab so the
  // user sees their saved recipe highlighted, ready to set intent and brew.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("library");
  }, [composePreselect?.at]);

  const toggleMood = (m) => {
    setMoods(prev => {
      if (prev.includes(m)) return prev.filter(x => x !== m);
      if (prev.length >= 3) return [...prev.slice(1), m];
      return [...prev, m];
    });
  };

  const toggleFlavor = (f) => {
    setFlavors(prev => {
      if (prev.includes(f)) return prev.filter(x => x !== f);
      if (prev.length >= 3) return [...prev.slice(1), f];
      return [...prev, f];
    });
  };

  const moodInTension = (m) =>
    MOOD_CONFLICTS.some(([a, b]) =>
      (moods.includes(a) && m === b) ||
      (moods.includes(b) && m === a)
    );

  const flavorInTension = (f) =>
    FLAVOR_CONFLICTS.some(([a, b]) =>
      (flavors.includes(a) && f === b) ||
      (flavors.includes(b) && f === a)
    );

  // Resolver still takes a single flavor (for now) — we pass the first
  // selected flavor as the primary driver. Additional flavors will be used
  // for accent/variant generation downstream.
  const primaryFlavor = flavors[0] || null;
  const rawCandidates = resolveCandidates(moods, primaryFlavor, primaryAxis);

  // When "only use what's in my pantry" is toggled on, drop any candidate
  // that contains an ingredient the user doesn't have. Empty pantry + toggle
  // on = empty candidate list, rendered as a dedicated empty state below.
  const candidates = onlyPantry && pantryIds
    ? rawCandidates.filter(c =>
        (c.ingredients || []).every(({ id }) => pantryIds.has(id))
      )
    : rawCandidates;

  const [selectedIdx, setSelectedIdx] = useState(0);

  // When the candidate list changes (moods/flavors changed), snap selection
  // back to 0 so the user always sees the "best match" first.
  const candidateKey = candidates.map(c => c.name).join("|");
  React.useEffect(() => {
    setSelectedIdx(0);
  }, [candidateKey]);

  const blend = candidates[selectedIdx] || {
    name: "—",
    subtitle: onlyPantry
      ? (pantryIds && pantryIds.size === 0
          ? "add ingredients to your pantry first"
          : "no blends from what you have on hand")
      : "pick a mood to begin",
    ingredients: [], tempC: 95, timeS: 300, effects: [],
    empty: true, conflict: null, moods: [],
  };

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Segmented control */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
        border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
        marginBottom: 14, background: theme.cream,
      }}>
        {[
          ["forward",    "Compose"],
          ["reverse",    "Blend"],
          ["library",    "Apothecary"],
          ["traditions", "Traditions"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
            padding: "9px 4px", cursor: "pointer",
            background: mode === k ? theme.ink : "transparent",
            color: mode === k ? theme.cream : theme.inkSoft,
            border: "none",
          }}>{label}</button>
        ))}
      </div>

      {mode === "forward" && (
        <>
          {/* Primary-axis toggle — "by feel" (mood leads) vs "by taste" (flavor leads).
              Reorders the page and changes how alternate candidates are generated. */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
            marginBottom: 16, background: theme.cream,
          }}>
            {[
              ["feel",  "by feel"],
              ["taste", "by taste"],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setPrimaryAxis(k)} style={{
                fontFamily: ff.serif, fontSize: 13, fontStyle: "italic",
                padding: "9px 4px", cursor: "pointer",
                background: primaryAxis === k ? theme.terra : "transparent",
                color: primaryAxis === k ? theme.cream : theme.inkSoft,
                border: "none",
              }}>{label}</button>
            ))}
          </div>

          {(() => {
            const moodRow = (
              <div key="mood-row" style={{ opacity: primaryAxis === "feel" ? 1 : 0.72 }}>
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <SectionLabel n={primaryAxis === "feel" ? "ii" : "iii"}>
                    {primaryAxis === "feel" ? "Desired mood" : "Mood, lightly"}
                  </SectionLabel>
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
                  }}>
                    {primaryAxis === "taste" && moods.length === 0 ? "optional" :
                     moods.length === 0 ? "pick one or two" :
                     moods.length === 1 ? "add a second to combine" :
                     moods.length === 2 ? "2 selected · pairs well" :
                     "3 selected · at the limit"}
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <ChipRows
                    items={MOODS}
                    renderItem={(m) => (
                      <Chip
                        key={m}
                        active={moods.includes(m)}
                        caution={moodInTension(m)}
                        onClick={() => toggleMood(m)}
                        tone="sage"
                      >{m}</Chip>
                    )}
                  />
                </div>

                {blend.conflict && (
                  <div style={{
                    marginTop: 12, padding: "10px 12px", borderRadius: 8,
                    background: "rgba(176, 84, 47, 0.07)",
                    border: `1px solid rgba(176, 84, 47, 0.22)`,
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <Flower size={16} c={theme.terra} />
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.inkSoft, lineHeight: 1.45 }}>
                      <em style={{ color: theme.terra, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>at odds</em>
                      <em style={{ color: theme.terra }}>{blend.conflict[0]}</em> and <em style={{ color: theme.terra }}>{blend.conflict[1]}</em> pull in opposite directions. The blend will try to thread the needle, but usually better to pick one.
                    </div>
                  </div>
                )}
              </div>
            );

            const flavorRow = (
              <div key="flavor-row" style={{ opacity: primaryAxis === "taste" ? 1 : 0.72 }}>
                <div style={{ marginTop: 20 }}>
                  <SectionLabel n={primaryAxis === "taste" ? "ii" : "iii"}>
                    {primaryAxis === "taste" ? "Flavor you're after" : "Flavor direction"}
                  </SectionLabel>
                </div>
                <div style={{ marginTop: 10 }}>
                  <ChipRows
                    items={FLAVORS}
                    renderItem={(f) => {
                      const active = flavors.includes(f);
                      const tension = !active && flavorInTension(f);
                      return (
                        <Chip
                          key={f}
                          active={active}
                          onClick={() => toggleFlavor(f)}
                          tone="terra"
                          caution={tension}
                        >{f}</Chip>
                      );
                    }}
                  />
                </div>
                {/* Soft warning when user has selected flavors that typically fight each other */}
                {flavors.length >= 2 && (() => {
                  const conflict = FLAVOR_CONFLICTS.find(([a, b]) =>
                    flavors.includes(a) && flavors.includes(b)
                  );
                  return conflict ? (
                    <div style={{
                      marginTop: 10, padding: "8px 10px", borderRadius: 6,
                      background: "rgba(165, 120, 54, 0.08)",
                      border: `1px solid rgba(165, 120, 54, 0.22)`,
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                      color: theme.inkSoft, lineHeight: 1.45,
                    }}>
                      <em style={{ color: theme.terra, fontStyle: "normal" }}>{conflict[0]}</em>
                      {" "}and{" "}
                      <em style={{ color: theme.terra, fontStyle: "normal" }}>{conflict[1]}</em>
                      {" "}can work against each other in a cup. The blend will try to balance them; often better to pick one.
                    </div>
                  ) : null;
                })()}
              </div>
            );

            // Render the primary axis first (gets "ii"), secondary second (gets "iii")
            return primaryAxis === "feel" ? [moodRow, flavorRow] : [flavorRow, moodRow];
          })()}

          {/* Temperature-compromise warning — fires when the resolved blend's
              ingredients don't share a brewing window. Currently rare (curated
              mood blends were designed to agree), but reserved for future
              blends that mix ingredients with disjoint temp ranges. */}
          {!blend.empty && blend.compatible === false && blend.outsiders?.length > 0 && (
            <div style={{
              marginTop: 14, padding: "8px 10px", borderRadius: 6,
              background: "rgba(165, 120, 54, 0.08)",
              border: `1px solid rgba(165, 120, 54, 0.22)`,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
              color: theme.inkSoft, lineHeight: 1.45,
            }}>
              <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
              these ingredients don't all share a brewing window.{" "}
              <em>
                {blend.outsiders.map((id, i) => (
                  <React.Fragment key={id}>
                    {i > 0 && (i === blend.outsiders.length - 1 ? " and " : ", ")}
                    {INGREDIENTS[id]?.name || id}
                  </React.Fragment>
                ))}
              </em>
              {" "}will extract lightly at this temp — fine as accents, worth rethinking if they carry the blend.
            </div>
          )}

          {/* Primary action: brew the current blend. Placed here, right after
              mood/flavor selection, so the decision-to-action path is reachable
              without scrolling. Pantry toggle, candidate selector, and blend
              card detail all live below for users who want to refine. */}
          <button
            disabled={blend.empty}
            onClick={() => startBrew(blend, "", moods)}
            style={{
              width: "100%", marginTop: 20,
              fontFamily: ff.serif, fontSize: 16,
              padding: "14px 16px", borderRadius: 10,
              background: blend.empty ? theme.rule : theme.terra,
              color: theme.cream, border: "none",
              cursor: blend.empty ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Kettle size={18} c={theme.cream} />
            start brewing
          </button>

          <label style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 18,
            fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft, cursor: "pointer",
          }}>
            <span style={{
              width: 30, height: 18, borderRadius: 999,
              background: onlyPantry ? theme.sageDeep : theme.rule,
              position: "relative", transition: "background .2s",
            }} onClick={() => setOnlyPantry(!onlyPantry)}>
              <span style={{
                position: "absolute", top: 2, left: onlyPantry ? 14 : 2,
                width: 14, height: 14, borderRadius: "50%", background: theme.cream,
                transition: "left .2s",
              }} />
            </span>
            only use what's in my pantry
          </label>

          {/* Candidate selector — only shown when there are multiple suggestions */}
          {candidates.length > 1 && (
            <div style={{ marginTop: 22 }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: theme.ash, fontFamily: ff.sans, marginBottom: 8,
              }}>
                {candidates.length} suggestions
              </div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                {candidates.map((c, i) => {
                  const isSelected = i === selectedIdx;
                  return (
                    <button key={i} onClick={() => setSelectedIdx(i)} style={{
                      flex: "0 0 auto", minWidth: 130, maxWidth: 170,
                      textAlign: "left",
                      padding: "8px 10px", borderRadius: 10,
                      border: `1px solid ${isSelected ? theme.ink : theme.rule}`,
                      background: isSelected ? theme.ink : "transparent",
                      color: isSelected ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      <div style={{
                        fontFamily: ff.sans, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isSelected ? "rgba(243,236,220,0.6)" : theme.ash,
                      }}>{c.kindLabel}</div>
                      <div style={{
                        fontFamily: ff.serif, fontSize: 13, lineHeight: 1.15,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{c.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Generated blend card */}
          <div style={{
            marginTop: candidates.length > 1 ? 12 : 22, padding: 18, borderRadius: 14,
            border: `1px solid ${theme.rule}`, background: theme.cream,
            position: "relative", overflow: "hidden",
            opacity: blend.empty ? 0.55 : 1,
          }}>
            <div style={{
              position: "absolute", top: 10, right: 12,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash,
            }}>
              suggestion · unsaved
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Flower size={18} c={theme.ochre} />
              <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
                {moods.length === 0   ? "no mood yet"
                 : moods.length === 1 ? `a blend for ${moods[0]}`
                 : moods.length === 2 ? `for ${moods[0]} & ${moods[1]}`
                 : `for ${moods.slice(0, -1).join(", ")} & ${moods[moods.length - 1]}`}
              </div>
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 26, color: theme.ink, lineHeight: 1.1 }}>
              {blend.name}
            </div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {blend.subtitle}
            </div>

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            {blend.ingredients.length === 0 ? (
              <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "6px 0" }}>
                Tap a mood chip above to compose a cup.
              </div>
            ) : (
              blend.ingredients.map(({ id, g }) => {
                const ing = INGREDIENTS[id];
                return (
                  <div key={id} onClick={() => go("ingredient", id)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "6px 0", cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                        {ing.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                      </div>
                      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>{ing.latin}</div>
                    </div>
                    <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft }}>
                      {formatAmount(g, ing.category, weightUnit)}
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            <div style={{ display: "flex", gap: 16, fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Water</div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink }}>{formatTemp(blend.tempC, unit)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Steep</div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink }}>{mmss(blend.timeS)}</div>
              </div>
              <div style={{ flex: 1 }} />
              <button style={{
                fontFamily: ff.sans, fontSize: 11, color: theme.ash,
                background: "transparent", border: `1px solid ${theme.rule}`,
                borderRadius: 999, padding: "4px 10px", cursor: "pointer",
              }}>why this temp?</button>
            </div>

            {blend.effects.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <SectionLabel>Predicted effect</SectionLabel>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {blend.effects.map(([tag, n], i) => (
                    <EffectBar
                      key={tag}
                      label={tag}
                      value={n}
                      color={
                        tag === "bitterness" ? theme.terra
                        : i === 0           ? theme.sage
                        : i === 1           ? theme.ochre
                        : theme.sky
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={iconBtn()}>↻ shuffle</button>
            <button style={iconBtn()}>✎ tweak</button>
          </div>
        </>
      )}

      {mode === "reverse" && (
        <ReverseCompose reverseIngs={reverseIngs} setReverseIngs={setReverseIngs} go={go} startBrew={startBrew} />
      )}

      {mode === "library" && (
        <LibraryList
          blends={BLENDS.filter(b => savedBlendIds.has(b.id))}
          highlightId={composePreselect?.blendId}
          compact go={go} startBrew={startBrew}
        />
      )}

      {mode === "traditions" && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, marginBottom: 14,
          }}>
            Classic preparations, taught the way they're traditionally made.
            Tap any to open its recipe or start brewing.
          </div>
          {BLENDS.filter(b => b.tradition).map((b, i) => (
            <BlendListRow key={b.id} b={b} author={b.tradition} first={i === 0} go={go} startBrew={startBrew} />
          ))}
        </div>
      )}
    </div>
  );
};

const iconBtn = () => ({
  fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft,
  background: "transparent", border: `1px solid ${theme.rule}`,
  borderRadius: 10, padding: "12px 12px", cursor: "pointer",
});

const ReverseCompose = ({ reverseIngs, setReverseIngs, go, startBrew }) => {
  const { unit, weightUnit } = useUnit();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const available = Object.keys(INGREDIENTS).filter(id => !reverseIngs.includes(id));
  const filteredAvailable = available
    .filter(id => {
      const ing = INGREDIENTS[id];
      if (filter !== "all" && ing.category !== filter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => INGREDIENTS[a].name.localeCompare(INGREDIENTS[b].name));
  // derive predicted effects as weighted sum
  const totals = {};
  reverseIngs.forEach(id => {
    INGREDIENTS[id].effects.forEach(([tag, n]) => { totals[tag] = (totals[tag] || 0) + n; });
  });
  const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]).slice(0,3);
  const maxT = Math.max(1, ...sorted.map(x => x[1]));

  // Derive temperature and time from the actual ingredients rather than hardcoding.
  // Uses range intersection when possible, weighted-grams dominance when not.
  const ingsForProfile = reverseIngs.map(id => ({ id, g: 1.0 }));
  const profile = computeBrewProfile(ingsForProfile);

  // For the picker: would adding this ingredient conflict with ANY ingredient
  // already in the pot? The rule: flag the candidate if there exists at least
  // one pot member whose temp range has zero overlap with the candidate's.
  // This is stricter as the pot grows — more pairs to check, more chances
  // of a conflict — which matches user intuition ("more stuff in = more risk").
  const tempConflictsWithPot = (candidateId) => {
    if (reverseIngs.length === 0) return false;
    const candidate = INGREDIENTS[candidateId];
    if (!candidate) return false;
    const [cLo, cHi] = candidate.tempC;
    return reverseIngs.some(id => {
      const [pLo, pHi] = INGREDIENTS[id].tempC;
      // Ranges [cLo,cHi] and [pLo,pHi] overlap iff max(cLo,pLo) <= min(cHi,pHi).
      // So they fail to overlap when max(cLo,pLo) > min(cHi,pHi).
      return Math.max(cLo, pLo) > Math.min(cHi, pHi);
    });
  };

  return (
    <>
      <SectionLabel n="i">What's in the pot?</SectionLabel>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {reverseIngs.map(id => (
          <div key={id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0",
          }}>
            <button
              onClick={() => go("ingredient", id)}
              style={{
                background: "transparent", border: "none", padding: 0,
                textAlign: "left", cursor: "pointer",
                fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                display: "flex", alignItems: "baseline", gap: 4,
              }}
            >
              {INGREDIENTS[id].name}
              <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
              <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginLeft: 6 }}>
                {formatTempShort(INGREDIENTS[id].tempC[0], INGREDIENTS[id].tempC[1], unit)}
              </span>
            </button>
            <button onClick={() => setReverseIngs(reverseIngs.filter(x => x !== id))} style={{
              background: "transparent", border: "none", color: theme.ash, fontSize: 14, cursor: "pointer",
            }}>×</button>
          </div>
        ))}

        {/* Temperature-compatibility notice — inline with the pot so users see
            it while looking at the ingredient list, not buried below the adder. */}
        {reverseIngs.length > 1 && !profile.compatible && (
          <div style={{
            marginTop: 10, padding: "8px 10px", borderRadius: 6,
            background: "rgba(165, 120, 54, 0.08)",
            border: `1px solid rgba(165, 120, 54, 0.22)`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <Kettle size={14} c={theme.ochre} />
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.inkSoft, lineHeight: 1.45 }}>
              <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
              these don't share a brewing window.
              {profile.outsiders.length > 0 && (
                <> at <em style={{ fontStyle: "normal" }}>{formatTemp(profile.tempC, unit)}</em>,{" "}
                  <em>
                    {profile.outsiders.map((id, i) => (
                      <React.Fragment key={id}>
                        {i > 0 && (i === profile.outsiders.length - 1 ? " and " : ", ")}
                        <button
                          onClick={() => go("ingredient", id)}
                          style={{
                            background: "transparent", border: "none", padding: 0, cursor: "pointer",
                            color: theme.ochre, fontStyle: "italic", textDecoration: "underline",
                            textDecorationStyle: "dotted", textUnderlineOffset: 3,
                            fontFamily: "inherit", fontSize: "inherit",
                          }}
                        >{INGREDIENTS[id].name}</button>
                      </React.Fragment>
                    ))}
                  </em>
                  {" "}will extract lightly.
                </>
              )}
            </div>
          </div>
        )}

        <Rule soft />
        <div style={{
          marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, fontFamily: ff.sans,
        }}>
          <span>add ingredient</span>
          <span style={{ letterSpacing: 0, textTransform: "none", fontStyle: "italic", fontFamily: ff.serif, fontSize: 11 }}>
            {filteredAvailable.length} on the shelf
          </span>
        </div>

        {/* Search input */}
        <div style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 8,
          background: theme.ivory, border: `1px solid ${theme.ruleSoft}`,
        }}>
          <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search the shelf…"
            style={{
              flex: 1, background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: search ? "normal" : "italic",
              fontSize: 14, color: theme.ink, outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "transparent", border: "none", color: theme.ash,
              fontSize: 12, cursor: "pointer",
            }}>×</button>
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ marginTop: 8 }}>
          <ChipRows
            items={[
              ["all",       "all"],
              ["true tea",  "teas"],
              ["herbal",    "herbals"],
              ["flower",    "flowers"],
              ["spice",     "spices"],
              ["adaptogen", "adaptogens"],
            ]}
            gap={4}
            rowGap={4}
            renderItem={([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                padding: "3px 9px", borderRadius: 999,
                border: `1px solid ${filter === key ? theme.ink : theme.ruleSoft}`,
                background: filter === key ? theme.ink : "transparent",
                color: filter === key ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>{label}</button>
            )}
          />
        </div>

        {/* Scrollable results */}
        <div style={{
          marginTop: 10, maxHeight: 180, overflowY: "auto",
          paddingRight: 4,
        }}>
          {filteredAvailable.length === 0 ? (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.ash, padding: "12px 0", textAlign: "center",
            }}>
              no match on your shelf.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filteredAvailable.map(id => {
                const ing = INGREDIENTS[id];
                const catColor =
                  ing.category === "flower"    ? theme.ochre
                  : ing.category === "herbal"  ? theme.sage
                  : ing.category === "true tea" ? theme.sageDeep
                  : ing.category === "spice"    ? theme.terra
                  : ing.category === "adaptogen" ? theme.plum
                  : theme.ash;
                const isCaution = tempConflictsWithPot(id);
                return (
                  <button
                    key={id}
                    onClick={() => setReverseIngs([...reverseIngs, id])}
                    title={isCaution ? "Brewing temp doesn't overlap with the current pot" : undefined}
                    style={{
                      fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.02em",
                      padding: "5px 10px 5px 8px", borderRadius: 999,
                      border: isCaution ? `1px dashed ${theme.ochre}` : `1px solid ${theme.rule}`,
                      background: "transparent",
                      color: isCaution ? theme.ochre : theme.inkSoft,
                      opacity: isCaution ? 0.75 : 1,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6,
                      transition: "all .15s ease",
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: catColor, flexShrink: 0,
                    }} />
                    {ing.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}><SectionLabel n="ii">This will likely be…</SectionLabel></div>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {sorted.length === 0 ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "6px 0" }}>
            Add a few ingredients to see a prediction.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map(([tag, n], i) => (
              <EffectBar key={tag} label={tag} value={Math.round((n / maxT) * 5)} color={i === 0 ? theme.sage : i === 1 ? theme.ochre : theme.terra} />
            ))}
          </div>
        )}
        <Rule soft />
        <div style={{ marginTop: 10, display: "flex", gap: 14, fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Water</div>
            <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
              {formatTemp(profile.tempC, unit)}
              {profile.tempRange && profile.tempRange[0] !== profile.tempRange[1] && (
                <span style={{ fontSize: 11, fontStyle: "italic", color: theme.ash, marginLeft: 4 }}>
                  (range {formatTempRange(profile.tempRange[0], profile.tempRange[1], unit)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Steep</div>
            <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>{mmss(profile.timeS)}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: profile.compatible ? theme.sageDeep : theme.ochre,
          }}>
            {reverseIngs.length <= 1 ? "" : profile.compatible ? "✓ compatible" : "⚠ compromise"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={iconBtn()}>save as recipe</button>
        <button onClick={() => startBrew({ name: "Untitled blend", ingredients: ingsForProfile, tempC: profile.tempC, timeS: profile.timeS }, "", ["calm"])} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 16,
          padding: "12px 16px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
        }}>start brewing</button>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: STEEP (takeover)
   ────────────────────────────────────────────────────────────── */

const SteepScreen = ({ blend, intent, setIntent, targetMoods, sessions, onDone, onCancel, pantryIds, togglePantry }) => {
  const total = blend.timeS || 360;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);

  // Past brews of this blend — only meaningful if the blend has an id (saved
  // or previously-logged). Freshly-composed blends won't have prior sessions.
  const pastSessions = React.useMemo(() => {
    if (!sessions || !blend.id) return [];
    return sessions.filter(s => s.who === "you" && s.blendId === blend.id);
  }, [sessions, blend.id]);

  // Build the "while you wait" pool once per brew. Memoized to avoid
  // rebuilding (and re-shuffling) on every render.
  const waitCards = React.useMemo(
    () => buildWaitCards(blend, targetMoods),
    [blend, targetMoods]
  );
  const [waitIdx, setWaitIdx] = useState(0);
  // Fade state — briefly hides the card during transitions for a gentle feel
  const [waitFading, setWaitFading] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, remaining]);

  // Auto-dismiss the ingredient tile when the brew completes — the user's
  // attention should snap back to the timer at the finish moment.
  useEffect(() => {
    if (remaining === 0 && activeIngredient) {
      setActiveIngredient(null);
    }
  }, [remaining, activeIngredient]);

  // Manual advance to the next card — shared by the click handler and
  // the auto-cycle interval. Bumps `lastAdvance` which resets the interval.
  const CARD_CYCLE_S = 30;
  const [lastAdvance, setLastAdvance] = useState(Date.now());
  // Seconds remaining until the next auto-advance. Drives the small
  // progress ring in the card's corner. Resets to CARD_CYCLE_S on advance.
  const [cardRemaining, setCardRemaining] = useState(CARD_CYCLE_S);

  const advanceWaitCard = React.useCallback(() => {
    if (waitCards.length <= 1) return;
    setWaitFading(true);
    setTimeout(() => {
      setWaitIdx(i => (i + 1) % waitCards.length);
      setWaitFading(false);
      setLastAdvance(Date.now());
      setCardRemaining(CARD_CYCLE_S);
    }, 400);
  }, [waitCards.length]);

  // Auto-cycle every CARD_CYCLE_S seconds. Clicking a card triggers
  // advanceWaitCard which updates lastAdvance, which re-runs this effect
  // with a fresh timer (so you never get a manual-then-auto double advance).
  // Auto-cycle every CARD_CYCLE_S seconds. Clicking a card triggers
  // advanceWaitCard which updates lastAdvance, which re-runs this effect
  // with a fresh timer (so you never get a manual-then-auto double advance).
  // Keeps cycling even after the brew completes — the user might still
  // be sitting with the cup, reading along.
  useEffect(() => {
    if (paused || waitCards.length <= 1) return;
    const cycle = setTimeout(advanceWaitCard, CARD_CYCLE_S * 1000);
    return () => clearTimeout(cycle);
  }, [paused, waitCards.length, lastAdvance, advanceWaitCard]);

  // Tick the card's countdown every second. Critically, this effect does
  // NOT depend on `paused` — otherwise it would tear down and reset every
  // time you pause/resume. Instead we read paused through a ref inside
  // the interval body.
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (waitCards.length <= 1) return;
    setCardRemaining(CARD_CYCLE_S);
    const tick = setInterval(() => {
      if (pausedRef.current) return;
      setCardRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [waitCards.length, lastAdvance]);

  const pct = 1 - remaining / total;
  const R = 74;
  const C = 2 * Math.PI * R;

  // brewing landmarks
  const landmarks = [
    { t: 0, label: "pour" },
    { t: Math.round(total * 0.35), label: "inhale" },
    { t: Math.round(total * 0.7), label: "taste" },
    { t: total, label: "done" },
  ];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: `radial-gradient(ellipse at 50% 20%, ${theme.cream} 0%, ${theme.paper} 60%, ${theme.ivory} 100%)`,
      display: "flex", flexDirection: "column",
      padding: "22px 22px 26px",
    }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← cancel</button>
        <button
          onClick={() => pastSessions.length > 0 && setNotesOpen(true)}
          disabled={pastSessions.length === 0}
          style={{
            background: "transparent", border: "none",
            color: pastSessions.length === 0 ? theme.ruleSoft : theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: pastSessions.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          notes{pastSessions.length > 0 && ` (${pastSessions.length})`}
        </button>
      </div>

      {/* countdown ring */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12, position: "relative" }}>
        <svg width="200" height="200" viewBox="-100 -100 200 200" style={{
          animation: paused ? "none" : "breathe 4.5s ease-in-out infinite",
        }}>
          <circle cx="0" cy="0" r={R} stroke={theme.ruleSoft} strokeWidth="1.5" fill="none" />
          <circle
            cx="0" cy="0" r={R}
            stroke={theme.terra} strokeWidth="2.5" fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90)"
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .8s linear" }}
          />
          {/* landmark ticks */}
          {landmarks.map((lm, i) => {
            const a = (lm.t / total) * 2 * Math.PI - Math.PI / 2;
            const x1 = Math.cos(a) * (R - 4), y1 = Math.sin(a) * (R - 4);
            const x2 = Math.cos(a) * (R + 4), y2 = Math.sin(a) * (R + 4);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.ink} strokeWidth="1" />;
          })}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{ fontFamily: ff.serif, fontSize: 10.5, fontStyle: "italic", color: theme.ash }}>remaining</div>
          <div style={{ fontFamily: ff.serif, fontSize: 36, fontWeight: 400, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {mmss(remaining)}
          </div>
          <div style={{ marginTop: 3, fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            of {mmss(total)}
          </div>
        </div>
      </div>

      {/* blend details */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink }}>{blend.name}</div>
        {targetMoods && targetMoods.length > 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.ash, marginTop: 4 }}>
            brewing for {targetMoods.join(" + ")}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 }}>
          {(blend.ingredients || []).map(item => {
            const id = typeof item === "string" ? item : item.id;
            const ing = INGREDIENTS[id];
            return ing ? (
              <button
                key={id}
                onClick={() => setActiveIngredient(id)}
                style={{
                  fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
                  padding: "3px 10px", border: `1px solid ${theme.rule}`, borderRadius: 999,
                  background: "transparent", cursor: "pointer",
                }}
              >{ing.name}</button>
            ) : null;
          })}
        </div>
      </div>

      {/* current feeling — optional one-line reflection while you wait.
          Captured into the session so the log retrospective has the "where
          you came from" alongside where the cup took you. */}
      <div style={{ marginTop: 18 }}>
        <div style={{ position: "relative" }}>
          <input
            value={intent || ""}
            onChange={(e) => setIntent && setIntent(e.target.value)}
            placeholder="How are you feeling?"
            className="steep-intent-input"
            style={{
              width: "100%", background: "rgba(255,255,255,0.35)",
              border: `1px dashed ${theme.rule}`, borderRadius: 10,
              fontFamily: ff.serif, fontStyle: intent ? "normal" : "italic",
              fontSize: 14, color: intent ? theme.ink : theme.ruleSoft,
              padding: "10px 34px 10px 14px", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            color: theme.ash, fontSize: 12, pointerEvents: "none",
          }}>✎</span>
        </div>
      </div>

      {/* while you wait — cycling fact/tradition/poem pool keyed to this blend
          Tap the card to advance to the next one; the auto-cycle interval resets. */}
      <div
        onClick={advanceWaitCard}
        style={{
          marginTop: 18, padding: "16px 18px",
          border: `1px solid ${theme.rule}`, borderRadius: 12,
          background: theme.cream,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          minHeight: 100,
          cursor: waitCards.length > 1 ? "pointer" : "default",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Leaf size={16} c={theme.sageDeep} />
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
              {waitCards[waitIdx]?.type === "poem"      ? "a verse" :
               waitCards[waitIdx]?.type === "tradition" ? "tradition" :
               "while you wait"}
            </div>
          </div>
          {waitCards.length > 1 && (
            /* Tiny countdown ring — shrinks as the time to next card runs down */
            <svg width="18" height="18" viewBox="-11 -11 22 22" style={{ display: "block" }}>
              <circle
                cx="0" cy="0" r="9"
                stroke={theme.ruleSoft} strokeWidth="1.5" fill="none"
              />
              <circle
                cx="0" cy="0" r="9"
                stroke={theme.ash} strokeWidth="1.5" fill="none"
                strokeDasharray={2 * Math.PI * 9}
                strokeDashoffset={(2 * Math.PI * 9) * (1 - cardRemaining / CARD_CYCLE_S)}
                transform="rotate(-90)"
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
          )}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: waitCards[waitIdx]?.type === "poem" ? "normal" : "italic",
          fontSize: 14.5, color: theme.ink, marginTop: 8, lineHeight: 1.6,
          opacity: waitFading ? 0 : 1,
          transition: "opacity 0.4s ease",
          whiteSpace: waitCards[waitIdx]?.type === "poem" ? "pre-line" : "normal",
        }}>
          {waitCards[waitIdx]?.text}
        </div>
        {waitCards[waitIdx]?.attribution && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            marginTop: 8, textAlign: "right", paddingRight: 18,
            opacity: waitFading ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}>
            {waitCards[waitIdx].attribution}
          </div>
        )}
        {/* Tap-to-advance affordance: a small right-pointing triangle
            in the bottom-right corner of the card */}
        {waitCards.length > 1 && (
          <svg
            width="10" height="10" viewBox="0 0 10 10"
            style={{
              position: "absolute", right: 10, bottom: 10,
              opacity: 0.55,
            }}
          >
            <polygon points="2,1 9,5 2,9" fill={theme.ash} />
          </svg>
        )}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setPaused(!paused)} style={iconBtn()}>
          {paused ? "▶ resume" : "❚❚ pause"}
        </button>
        <button onClick={() => setRemaining(total)} style={iconBtn()}>↺ reset</button>
        <button onClick={() => onDone(blend, intent, targetMoods)} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 15,
          padding: "12px 14px", borderRadius: 10,
          background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
        }}>
          {remaining === 0 ? "log this cup →" : "done early →"}
        </button>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.012); }
        }
        .steep-intent-input::placeholder {
          color: ${theme.ash};
          opacity: 0.55;
          font-style: italic;
        }
      `}</style>

      {/* Ingredient mini-tile — overlays the timer as a bottom sheet */}
      {activeIngredient && (
        <IngredientSheet
          id={activeIngredient}
          onClose={() => setActiveIngredient(null)}
          inPantry={pantryIds?.has(activeIngredient)}
          onTogglePantry={() => togglePantry && togglePantry(activeIngredient)}
        />
      )}

      {/* Notes panel — past brews of this blend, viewable without leaving the steep */}
      {notesOpen && (
        <div
          onClick={() => setNotesOpen(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 40,
            background: "rgba(42, 36, 28, 0.35)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxHeight: "75%",
              background: theme.ivory,
              borderRadius: "16px 16px 0 0",
              padding: "16px 20px 22px",
              display: "flex", flexDirection: "column",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
                  Past brews
                </div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink, marginTop: 2 }}>
                  {blend.name}
                </div>
              </div>
              <button
                onClick={() => setNotesOpen(false)}
                style={{
                  background: "transparent", border: "none",
                  fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: theme.ash, cursor: "pointer",
                }}
              >close</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {pastSessions.length === 0 ? (
                <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "20px 0", textAlign: "center" }}>
                  No past brews logged yet.
                </div>
              ) : (
                pastSessions.map((s, i) => (
                  <div key={s.id} style={{
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft }}>
                        {s.intent ? <em>{s.intent}</em> : <span style={{ color: theme.ash }}>—</span>}
                        {" → "}
                        <em style={{ color: theme.terra }}>{s.actual}</em>
                      </div>
                      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash }}>
                        {s.ago}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(n => (
                          <span key={n} style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: n <= (s.taste || 0) ? theme.terra : theme.ruleSoft,
                          }} />
                        ))}
                      </div>
                      {s.note && (
                        <div style={{
                          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.inkSoft,
                          textAlign: "right", marginLeft: 12, flex: 1,
                        }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Component: INGREDIENT SHEET
   Bottom-sheet mini-tile showing quick-reference info about an
   ingredient, overlaid on the Steep timer. Used when a user wants
   to quickly recall what an ingredient is doing in their current
   brew without navigating away from the timer.
   ────────────────────────────────────────────────────────────── */

const IngredientSheet = ({ id, onClose, inPantry, onTogglePantry }) => {
  const ing = INGREDIENTS[id];
  if (!ing) return null;

  return (
    <>
      {/* Backdrop — tap anywhere outside the sheet to dismiss */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0, zIndex: 40,
          background: "rgba(30, 24, 18, 0.35)",
          animation: "sheetFadeIn 0.2s ease-out",
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
        background: theme.ivory,
        borderRadius: "20px 20px 0 0",
        padding: "16px 22px 22px",
        maxHeight: "60%", overflowY: "auto",
        boxShadow: "0 -8px 32px -12px rgba(30,24,18,0.3)",
        animation: "sheetSlideUp 0.25s ease-out",
      }}>
        {/* Grab-handle + exit row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: theme.rule, margin: "0 auto",
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            top: 8,
          }} />
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            a quick look
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "0 4px",
          }}>×</button>
        </div>

        {/* Ingredient header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: theme.cream, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {ing.category === "flower"    && <Flower size={22} c={theme.ochre} />}
            {ing.category === "herbal"    && <Sprig  size={22} c={theme.sage} />}
            {ing.category === "true tea"  && <Leaf   size={22} c={theme.sageDeep} />}
            {ing.category === "spice"     && <Flower size={22} c={theme.terra} />}
            {ing.category === "adaptogen" && <Sprig  size={22} c={theme.plum} />}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
              {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1.1, marginTop: 1 }}>
              {ing.name}
            </div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 1 }}>
              {ing.latin}
            </div>
          </div>
        </div>

        {/* Blurb — one-line essence */}
        <div style={{
          fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
          lineHeight: 1.5, marginBottom: 14,
        }}>
          {ing.blurb}
        </div>

        {/* Effects — top 3 */}
        {ing.effects && ing.effects.length > 0 && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            display: "flex", flexDirection: "column", gap: 6, marginBottom: 10,
          }}>
            {ing.effects.slice(0, 3).map(([tag, n], i) => (
              <EffectBar
                key={tag}
                label={tag}
                value={n}
                color={
                  tag === "bitterness" ? theme.terra
                  : i === 0           ? theme.sage
                  : i === 1           ? theme.ochre
                  : theme.sky
                }
              />
            ))}
          </div>
        )}

        {/* Flavor tags */}
        {ing.flavors && ing.flavors.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {ing.flavors.slice(0, 4).map(f => (
              <span key={f} style={{
                fontFamily: ff.sans, fontSize: 10, color: theme.terra, letterSpacing: "0.04em",
                padding: "2px 8px", border: `1px solid ${theme.terra}`, borderRadius: 999,
                opacity: 0.85,
              }}>{f}</span>
            ))}
          </div>
        )}

        {/* Heads-up note — only if present */}
        {ing.headsUp && (
          <div style={{
            padding: "9px 12px", borderRadius: 8, marginBottom: 12,
            background: "rgba(176, 84, 47, 0.07)",
            border: `1px solid rgba(176, 84, 47, 0.22)`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ color: theme.terra, fontSize: 14, lineHeight: 1.2 }}>⚠</span>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.inkSoft, lineHeight: 1.45 }}>
              {ing.headsUp}
            </div>
          </div>
        )}

        {/* Pantry toggle */}
        {onTogglePantry && (
          <button onClick={onTogglePantry} style={{
            width: "100%",
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.04em",
            padding: "11px", borderRadius: 10,
            background: inPantry ? "transparent" : theme.cream,
            border: `1px solid ${inPantry ? theme.sageDeep : theme.rule}`,
            color: inPantry ? theme.sageDeep : theme.inkSoft,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {inPantry ? "✓ in your pantry" : "+ add to pantry"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes sheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: LOG
   ────────────────────────────────────────────────────────────── */

const LogScreen = ({ blend, intent, targetMoods, onSubmit, onCancel }) => {
  const safeMoods = targetMoods && targetMoods.length ? targetMoods : [];
  // Per-dimension "did it land?" — default each target mood to "landed".
  const [landed, setLanded] = useState(() =>
    Object.fromEntries(safeMoods.map(m => [m, true]))
  );
  // Allow the user to add moods they didn't set out for (e.g. unintended sleepy).
  const [extra, setExtra] = useState([]);
  const [taste, setTaste] = useState(4);
  const [note, setNote] = useState("");
  const [save, setSave] = useState(true);
  // Rename: only relevant for user-composed blends (no curated id). Empty
  // string means "keep the auto-generated name"; any non-empty string
  // overrides it when saving to the library.
  const [rename, setRename] = useState("");
  const isComposed = !blend?.id;

  const toggleExtra = (m) => {
    if (safeMoods.includes(m)) return; // don't let extras collide with targets
    setExtra(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
      padding: "22px 22px 26px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
          Check-in
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Flower size={28} c={theme.ochre} />
        <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, marginTop: 8 }}>
          how's the cup?
        </div>
        <h2 style={{ fontFamily: ff.serif, fontSize: 24, fontWeight: 400, color: theme.ink, margin: "4px 0 0" }}>
          {blend.name}
        </h2>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel>Set out feeling</SectionLabel>
        <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 18, color: theme.inkSoft, marginTop: 6 }}>
          {intent ? `"${intent}"` : <span style={{ color: theme.ash, fontStyle: "normal" }}>—</span>}
        </div>
      </div>

      {/* Per-mood confirmation — "you aimed for calm + focus; did they land?" */}
      {safeMoods.length > 0 && (
        <div style={{ margin: "20px 0" }}>
          <SectionLabel n="ii">Did each one land?</SectionLabel>
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 4 }}>
            you aimed for {safeMoods.join(" + ")}
          </div>
          <div style={{
            marginTop: 10, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
            background: theme.cream, overflow: "hidden",
          }}>
            {safeMoods.map((m, i) => (
              <div key={m} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
              }}>
                <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink }}>
                  <em style={{ color: theme.terra, fontStyle: "normal" }}>{m}</em>?
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    ["landed",  true],
                    ["missed",  false],
                  ].map(([label, v]) => (
                    <button key={label} onClick={() => setLanded({ ...landed, [m]: v })} style={{
                      fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.02em",
                      padding: "5px 11px", borderRadius: 999,
                      border: `1px solid ${landed[m] === v ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                      background: landed[m] === v ? (v ? theme.sageDeep : theme.terra) : "transparent",
                      color: landed[m] === v ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "iii" : "ii"}>
          {safeMoods.length > 0 ? "Anything else showed up?" : "Feeling now"}
        </SectionLabel>
        {safeMoods.length > 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 4 }}>
            unexpected moods from the cup
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <ChipRows
            items={MOODS.filter(m => !safeMoods.includes(m))}
            renderItem={(m) => (
              <Chip key={m} active={extra.includes(m)} onClick={() => toggleExtra(m)} tone="sage">{m}</Chip>
            )}
          />
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "iv" : "iii"}>Taste</SectionLabel>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setTaste(i)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 2, fontSize: 22, color: i <= taste ? theme.terra : theme.rule,
            }}>●</button>
          ))}
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "v" : "iv"}>Marginalia</SectionLabel>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="a line or two, just for you"
          style={{
            marginTop: 8, width: "100%", minHeight: 60,
            background: "transparent", border: `1px solid ${theme.rule}`, borderRadius: 8,
            padding: 10, fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            resize: "vertical", outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
        <Toggle label="Save blend to library as favorite" value={save} onChange={setSave} />

        {/* Rename input — only when saving a user-composed blend.
            Curated blends (Dusk Lullaby, Moroccan Mint, etc.) keep their
            original names; only on-the-fly compositions get renamed. */}
        {save && isComposed && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
              textTransform: "uppercase", color: theme.ash,
            }}>
              name this blend
            </div>
            <input
              value={rename}
              onChange={(e) => setRename(e.target.value)}
              placeholder={blend?.name || "untitled blend"}
              style={{
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                outline: "none", padding: 0,
                fontStyle: rename ? "normal" : "italic",
              }}
            />
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
              color: theme.ash, lineHeight: 1.4,
            }}>
              {rename
                ? `will save as "${rename}"`
                : `will save as "${blend?.name}" — tap above to rename`}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => onSubmit({ landed, extra, taste, note, save, rename: rename.trim() })} style={{
        width: "100%", fontFamily: ff.serif, fontSize: 17,
        padding: "14px", borderRadius: 10,
        background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
      }}>
        log it →
      </button>
    </div>
  );
};

const Toggle = ({ label, value, onChange }) => (
  <label style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
    fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft, cursor: "pointer",
  }}>
    <span>{label}</span>
    <span onClick={() => onChange(!value)} style={{
      width: 34, height: 20, borderRadius: 999,
      background: value ? theme.sageDeep : theme.rule,
      position: "relative", transition: "background .2s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 16 : 2,
        width: 16, height: 16, borderRadius: "50%", background: theme.cream,
        transition: "left .2s",
      }} />
    </span>
  </label>
);

/* ──────────────────────────────────────────────────────────────
   Screen: LIBRARY
   ────────────────────────────────────────────────────────────── */

const LibraryList = ({ blends, compact, go, startBrew, highlightId }) => {
  if (!blends || blends.length === 0) {
    return (
      <EmptyState
        icon={<Leaf size={24} c={theme.sage} />}
        title="No saved blends yet"
        body="The blends you save or adopt from friends will live here."
        cta={{ label: "compose your first cup →", onClick: () => go("compose") }}
      />
    );
  }
  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      {!compact && <SectionLabel n="i">Your saved blends</SectionLabel>}
      <div style={{ marginTop: compact ? 0 : 10 }}>
        {blends.map((b, i) => (
          <BlendListRow
            key={b.id} b={b} first={i === 0}
            highlighted={highlightId === b.id}
            go={go} startBrew={startBrew}
          />
        ))}
      </div>
    </div>
  );
};

const BlendListRow = ({ b, first, author, go, startBrew, highlighted }) => {
  const { unit, weightUnit } = useUnit();
  return (
  <button onClick={() => startBrew(b, "", [b.mood])} style={{
    width: "100%", textAlign: "left",
    background: highlighted ? "rgba(181,130,89,0.08)" : "transparent",
    border: "none",
    borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
    borderLeft: highlighted ? `3px solid ${theme.terra}` : "3px solid transparent",
    padding: "14px 12px 14px 9px", cursor: "pointer",
    display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
  }}>
    <div>
      <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2 }}>
        {b.name}
        {author && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash, marginLeft: 6 }}>· {author}</span>}
      </div>
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.ash, marginTop: 2 }}>
        {b.subtitle}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {b.ingredients.map(ing => INGREDIENTS[ing.id] && (
          <span
            key={ing.id}
            onClick={(e) => {
              e.stopPropagation();
              go("ingredient", ing.id);
            }}
            style={{
              fontFamily: ff.sans, fontSize: 10.5, color: theme.inkSoft, letterSpacing: "0.02em",
              padding: "2px 7px", background: theme.cream, borderRadius: 999, border: `1px solid ${theme.ruleSoft}`,
              cursor: "pointer",
            }}
          >{INGREDIENTS[ing.id].name}</span>
        ))}
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink }}>{formatTempShort(b.tempC, b.tempC, unit)}</div>
      <div style={{ fontFamily: ff.mono, fontSize: 10.5, color: theme.ash }}>{mmss(b.timeS)}</div>
    </div>
  </button>
  );
};

// Shared empty-state component used across library sub-tabs, profile stats,
// and anywhere else content might be genuinely absent. Keeps the "nothing
// here yet" voice consistent — quiet, inviting, never scolding.
const EmptyState = ({ icon, title, body, cta }) => (
  <div style={{
    padding: "22px 20px", borderRadius: 12,
    background: theme.cream, border: `1px dashed ${theme.rule}`,
    textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  }}>
    {icon && <div style={{ marginBottom: 2 }}>{icon}</div>}
    <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink, lineHeight: 1.2 }}>
      {title}
    </div>
    {body && (
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, lineHeight: 1.5, maxWidth: 280 }}>
        {body}
      </div>
    )}
    {cta && (
      <button onClick={cta.onClick} style={{
        marginTop: 6,
        fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.04em",
        padding: "8px 14px", borderRadius: 999,
        background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
      }}>{cta.label}</button>
    )}
  </div>
);

const LibraryScreen = ({ go, startBrew, openBlend, sessions, savedBlendIds, pantryIds, togglePantry }) => {
  const [tab, setTab] = useState("blends"); // blends | history | shelf
  const [filter, setFilter] = useState("all");

  // "The Shelf" — ingredient catalog browser state
  const [shelfSearch, setShelfSearch] = useState("");
  const [shelfCategory, setShelfCategory] = useState("all");
  const [pantryOnly, setPantryOnly] = useState(false);

  // Filter saved blends (power user's four, mid user's one, new user's none).
  const savedBlends = BLENDS.filter(b => savedBlendIds.has(b.id));
  const yourSessions = sessions.filter(s => s.who === "you");

  // All ingredients, filtered by search / category / pantry-toggle, then
  // sorted alphabetically by display name so the catalog is browsable.
  const shelfItems = Object.entries(INGREDIENTS)
    .filter(([id, ing]) => {
      if (pantryOnly && !pantryIds.has(id)) return false;
      if (shelfCategory !== "all" && ing.category !== shelfCategory) return false;
      if (shelfSearch.trim()) {
        const q = shelfSearch.trim().toLowerCase();
        const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, borderBottom: `1px solid ${theme.ruleSoft}` }}>
        {[
          ["blends",  "Blends",    savedBlends.length],
          ["history", "Check-ins", yourSessions.length],
          ["shelf",   "Ingredients", Object.keys(INGREDIENTS).length],
        ].map(([k, label, count]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: "transparent", border: "none",
            fontFamily: ff.serif, fontSize: 15, color: tab === k ? theme.ink : theme.ash,
            padding: "6px 0 10px", cursor: "pointer",
            borderBottom: tab === k ? `2px solid ${theme.terra}` : "2px solid transparent",
            marginBottom: -1,
            display: "flex", alignItems: "baseline", gap: 5,
          }}>
            {label}
            {count > 0 && (
              <span style={{
                fontFamily: ff.mono, fontSize: 10, color: tab === k ? theme.terra : theme.ash, opacity: 0.75,
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "blends" && (
        <>
          {savedBlends.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <ChipRows
                items={["all", "calm", "focus", "energy", "comfort", "what worked"]}
                renderItem={(f) => (
                  <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
                )}
              />
            </div>
          )}
          <LibraryList blends={savedBlends} compact go={go} startBrew={startBrew} />
        </>
      )}

      {tab === "history" && (
        <>
          {yourSessions.length === 0 ? (
            <EmptyState
              icon={<Kettle size={26} c={theme.terra} />}
              title="Your journal starts with your first cup"
              body="Every cup you brew and log lands here, with intent, taste, and effect side-by-side."
              cta={{ label: "set a cup out →", onClick: () => go("compose") }}
            />
          ) : (
            <>
              <SectionLabel n="i">Every cup you've logged</SectionLabel>
              <div style={{ marginTop: 12 }}>
                {yourSessions.map((s, i) => (
                  <SessionRow key={s.id} s={s} openBlend={openBlend} first={i === 0} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "shelf" && (
        <>
          {/* Search input */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            marginBottom: 10,
          }}>
            <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
            <input
              value={shelfSearch}
              onChange={(e) => setShelfSearch(e.target.value)}
              placeholder="search the shelf…"
              style={{
                flex: 1, background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: shelfSearch ? "normal" : "italic",
                fontSize: 14, color: theme.ink, outline: "none",
              }}
            />
            {shelfSearch && (
              <button onClick={() => setShelfSearch("")} style={{
                background: "transparent", border: "none", color: theme.ash,
                fontSize: 12, cursor: "pointer",
              }}>×</button>
            )}
          </div>

          {/* Category filter pills */}
          <div style={{ marginBottom: 10 }}>
            <ChipRows
              items={[
                ["all",       "all"],
                ["true tea",  "teas"],
                ["herbal",    "herbals"],
                ["flower",    "flowers"],
                ["spice",     "spices"],
                ["adaptogen", "adaptogens"],
              ]}
              gap={4}
              rowGap={4}
              renderItem={([key, label]) => (
                <button key={key} onClick={() => setShelfCategory(key)} style={{
                  fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                  padding: "3px 9px", borderRadius: 999,
                  border: `1px solid ${shelfCategory === key ? theme.ink : theme.ruleSoft}`,
                  background: shelfCategory === key ? theme.ink : "transparent",
                  color: shelfCategory === key ? theme.cream : theme.ash,
                  cursor: "pointer",
                }}>{label}</button>
              )}
            />
          </div>

          {/* Pantry-only toggle + count */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, padding: "2px 0",
          }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: ff.sans, fontSize: 11.5, color: theme.inkSoft, cursor: "pointer",
            }}>
              <span style={{
                width: 28, height: 16, borderRadius: 999,
                background: pantryOnly ? theme.sageDeep : theme.rule,
                position: "relative", transition: "background .2s",
                flexShrink: 0,
              }} onClick={() => setPantryOnly(!pantryOnly)}>
                <span style={{
                  position: "absolute", top: 2, left: pantryOnly ? 14 : 2,
                  width: 12, height: 12, borderRadius: "50%", background: theme.cream,
                  transition: "left .2s",
                }} />
              </span>
              <span onClick={() => setPantryOnly(!pantryOnly)}>only what's in my pantry</span>
            </label>
            <span style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            }}>
              {shelfItems.length} of {Object.keys(INGREDIENTS).length}
            </span>
          </div>

          {/* The catalog grid */}
          {shelfItems.length === 0 ? (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.ash, padding: "18px 0", textAlign: "center",
            }}>
              no ingredients match your filters.
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
            }}>
              {shelfItems.map(([id, ing]) => {
                const inPantry = pantryIds.has(id);
                return (
                  <button key={id} onClick={() => go("ingredient", id)} style={{
                    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                    borderRadius: 10, padding: "12px 12px", textAlign: "left", cursor: "pointer",
                    display: "flex", flexDirection: "column", gap: 4,
                    opacity: inPantry ? 1 : 0.6,
                    position: "relative",
                  }}>
                    {/* Pantry badge — only shown for items you own */}
                    {inPantry && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        width: 18, height: 18, borderRadius: "50%",
                        background: theme.sage,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: theme.cream, fontSize: 10, fontWeight: "bold",
                      }}>✓</div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: inPantry ? 22 : 0 }}>
                      {ing.category === "flower" && <Flower size={18} c={theme.ochre} />}
                      {ing.category === "herbal" && <Sprig size={18} c={theme.sage} />}
                      {ing.category === "true tea" && <Leaf size={18} c={theme.sageDeep} />}
                      {ing.category === "spice" && <Flower size={18} c={theme.terra} />}
                      {ing.category === "adaptogen" && <Sprig size={18} c={theme.plum} />}
                      <span style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>
                        {ing.subcategory || ing.category}
                      </span>
                    </div>
                    <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, marginTop: 6 }}>
                      {ing.name}
                    </div>
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>
                      {ing.latin}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: INGREDIENT DETAIL
   ────────────────────────────────────────────────────────────── */

const IngredientDetail = ({ id, onClose, pantryIds, togglePantry, onOpenIngredient }) => {
  const { unit, weightUnit } = useUnit();
  const ing = INGREDIENTS[id] || INGREDIENTS.chamomile;
  const [tab, setTab] = useState("overview");

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
    }}>
      {/* hero */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.cream} 0%, ${theme.paper} 100%)`,
        padding: "22px 22px 18px",
        borderBottom: `1px solid ${theme.rule}`,
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>← back</button>
          <div style={{ flex: 1 }} />
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {ing.category === "flower"    && <Flower size={34} c={theme.ochre} />}
            {ing.category === "herbal"    && <Sprig  size={34} c={theme.sage} />}
            {ing.category === "true tea"  && <Leaf   size={34} c={theme.sageDeep} />}
            {ing.category === "spice"     && <Flower size={34} c={theme.terra} />}
            {ing.category === "adaptogen" && <Sprig  size={34} c={theme.plum} />}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
              {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
            </div>
            <h1 style={{ fontFamily: ff.serif, fontSize: 32, fontWeight: 400, color: theme.ink, margin: "2px 0 0", lineHeight: 1.05 }}>
              {ing.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {ing.latin}
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 16, marginTop: 18, borderBottom: `1px solid ${theme.ruleSoft}` }}>
          {[
            ["overview", "Overview"],
            ["brewing",  "Brewing"],
            ["pairings", "Pairings"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontSize: 14, color: tab === k ? theme.ink : theme.ash,
              padding: "6px 0 10px", cursor: "pointer",
              borderBottom: tab === k ? `2px solid ${theme.terra}` : "2px solid transparent",
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 22px 130px" }}>
        {tab === "overview" && (
          <>
            <p style={{ fontFamily: ff.serif, fontSize: 15.5, color: theme.inkSoft, lineHeight: 1.6, margin: 0 }}>
              {ing.blurb}
            </p>

            <div style={{ margin: "22px 0 14px" }}><SectionLabel n="i">Effect</SectionLabel></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ing.effects.map(([tag, n]) => (
                <EffectBar key={tag} label={tag} value={n} color={theme.sage} />
              ))}
            </div>

            <div style={{ margin: "22px 0 10px" }}><SectionLabel n="ii">Flavor notes</SectionLabel></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ing.flavors.map(f => (
                <span key={f} style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.terra,
                  padding: "4px 10px", border: `1px solid ${theme.rule}`, borderRadius: 999,
                  background: theme.cream,
                }}>{f}</span>
              ))}
            </div>

            {ing.facts && ing.facts.length > 0 && (
              <>
                <div style={{ margin: "22px 0 10px" }}><SectionLabel n="iii">Did you know</SectionLabel></div>
                <FactsCard facts={ing.facts} />
              </>
            )}

            {ing.headsUp && (
              <div style={{
                marginTop: 22, padding: 12, borderRadius: 10,
                background: "rgba(176, 84, 47, 0.07)",
                border: `1px solid rgba(176, 84, 47, 0.2)`,
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: theme.terra, color: theme.cream,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: ff.serif, fontSize: 12, fontStyle: "italic", flexShrink: 0,
                }}>!</div>
                <div>
                  <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.terra }}>
                    Heads up
                  </div>
                  <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft, marginTop: 3, lineHeight: 1.5 }}>
                    {ing.headsUp}
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginTop: 4 }}>
                    (not medical advice)
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <button
                onClick={() => togglePantry && togglePantry(id)}
                style={{
                  ...iconBtn(),
                  width: "100%",
                  background: pantryIds && pantryIds.has(id) ? theme.cream : "transparent",
                  borderColor: pantryIds && pantryIds.has(id) ? theme.sageDeep : theme.rule,
                  color: pantryIds && pantryIds.has(id) ? theme.sageDeep : theme.inkSoft,
                }}
              >
                {pantryIds && pantryIds.has(id) ? "✓ in pantry" : "+ pantry"}
              </button>
            </div>
          </>
        )}

        {tab === "brewing" && (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <StatCard label="Water" value={formatTempRange(ing.tempC[0], ing.tempC[1], unit)} />
              <StatCard label="Steep" value={`${Math.round(ing.timeS[0]/60)}–${Math.round(ing.timeS[1]/60)} min`} />
              <StatCard label="Caffeine" value={ing.caffeine > 0 ? `${ing.caffeine} mg` : "none"} />
            </div>

            <SectionLabel n="i">Brew for a different effect</SectionLabel>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {(ing.variants || [
                { intent: "calm",       tempC: ing.tempC[0], timeS: ing.timeS[0], note: "Light steep for a softer cup." },
                { intent: "everyday",   tempC: ing.tempC[1], timeS: Math.round((ing.timeS[0]+ing.timeS[1])/2), note: "Balanced standard." },
                { intent: "full",       tempC: ing.tempC[1], timeS: ing.timeS[1], note: "Fuller effect, slightly more bitter." },
              ]).map((v, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 10,
                  background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
                      for <em style={{ color: theme.terra }}>{v.intent}</em>
                    </div>
                    <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.ash }}>
                      {formatTempShort(v.tempC, v.tempC, unit)} · {mmss(v.timeS)}
                    </div>
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft, marginTop: 4 }}>
                    {v.note}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "pairings" && (
          <>
            <SectionLabel n="i">Pairs well with</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {(ing.pairs || []).map(pid => INGREDIENTS[pid] && (
                <button key={pid} onClick={() => onOpenIngredient && onOpenIngredient(pid)} style={{
                  fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft,
                  padding: "8px 14px", borderRadius: 999,
                  background: theme.cream, border: `1px solid ${theme.rule}`, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {INGREDIENTS[pid].category === "flower"    && <Flower size={14} c={theme.ochre} />}
                  {INGREDIENTS[pid].category === "herbal"    && <Sprig  size={14} c={theme.sage} />}
                  {INGREDIENTS[pid].category === "true tea"  && <Leaf   size={14} c={theme.sageDeep} />}
                  {INGREDIENTS[pid].category === "spice"     && <Flower size={14} c={theme.terra} />}
                  {INGREDIENTS[pid].category === "adaptogen" && <Sprig  size={14} c={theme.plum} />}
                  {INGREDIENTS[pid].name} ↗
                </button>
              ))}
            </div>

            <div style={{ marginTop: 22 }}><SectionLabel n="ii">Traditional pairings</SectionLabel></div>
            <div style={{
              marginTop: 10, padding: 14,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.inkSoft, lineHeight: 1.6,
            }}>
              Honey, warm milk, a thin sliver of fresh ginger. Paired most historically with lavender
              and lemon balm in European evening tisanes.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div style={{
    flex: 1, padding: 12, borderRadius: 10,
    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
  }}>
    <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>{label}</div>
    <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, marginTop: 3 }}>{value}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Screen: BLEND DETAIL (overlay)
   Opens when a session card or blend link is tapped. Shows the
   recipe, brewing params, effect prediction, and — if opened from
   a friend's session — their review in a pull-quote up top.
   ────────────────────────────────────────────────────────────── */

const BlendDetail = ({ blendId, onClose, onOpenIngredient, onBrew, isFavorite, onToggleFavorite, sessions, go }) => {
  const { unit, weightUnit } = useUnit();
  const b = getBlend(blendId);
  if (!b) return null;

  // Filter the user's sessions for this specific blend. These become
  // the "Your log with this blend" section — aggregate stats + recent notes.
  const mySessions = (sessions || []).filter(s => s.who === "you" && s.blendId === blendId);
  const brewCount = mySessions.length;
  const avgTaste = brewCount > 0
    ? Math.round((mySessions.reduce((a, s) => a + (s.taste || 0), 0) / brewCount) * 10) / 10
    : 0;

  // Find the most common "actual" outcome across your brews. For single-mood
  // actuals this is easy; for comma-joined actuals we split and tally.
  const actualTally = {};
  mySessions.forEach(s => {
    (s.actual || "").split(",").map(x => x.trim()).filter(Boolean).forEach(a => {
      actualTally[a] = (actualTally[a] || 0) + 1;
    });
  });
  const topActual = Object.entries(actualTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  const intentTally = {};
  mySessions.forEach(s => {
    if (s.intent) intentTally[s.intent] = (intentTally[s.intent] || 0) + 1;
  });
  const topIntent = Object.entries(intentTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
    }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.cream} 0%, ${theme.paper} 100%)`,
        padding: "22px 22px 20px",
        borderBottom: `1px solid ${theme.rule}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>← back</button>
          <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            The Blend
          </div>
          {onToggleFavorite ? (
            <button onClick={onToggleFavorite} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "4px 6px",
              fontSize: 20, lineHeight: 1,
              color: isFavorite ? theme.ochre : theme.ash,
            }} title={isFavorite ? "remove from favorites" : "add to favorites"}>
              {isFavorite ? "★" : "☆"}
            </button>
          ) : <div style={{ width: 40 }} />}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Flower size={28} c={theme.ochre} />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
                for {b.mood}
              </span>
              {b.tradition && (
                <span style={{
                  fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: theme.ochre, border: `1px solid ${theme.ochre}`, borderRadius: 3,
                  padding: "1px 6px",
                }}>{b.tradition}</span>
              )}
            </div>
            <h1 style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, margin: "2px 0 0", lineHeight: 1.05 }}>
              {b.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 3 }}>
              {b.subtitle}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px 32px" }}>
        {/* Ingredients */}
        <SectionLabel n="i">The recipe</SectionLabel>
        <div style={{
          marginTop: 10, padding: "4px 14px", borderRadius: 10,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
        }}>
          {b.ingredients.map((ing, i) => {
            const meta = INGREDIENTS[ing.id];
            if (!meta) return null;
            return (
              <button key={ing.id} onClick={() => onOpenIngredient(ing.id)} style={{
                width: "100%", textAlign: "left", background: "transparent",
                border: "none", borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                padding: "10px 0", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <div>
                  <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                    {meta.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>
                    {meta.latin}
                  </div>
                </div>
                <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft }}>
                  {formatAmount(ing.g, meta.category, weightUnit)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Brewing */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="ii">Brewing</SectionLabel>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard label="Water" value={formatTemp(b.tempC, unit)} />
          <StatCard label="Steep" value={mmss(b.timeS)} />
          {b.ml && <StatCard label="Volume" value={`${b.ml} ml`} />}
        </div>

        {/* Effects */}
        {b.effects && b.effects.length > 0 && (
          <>
            <div style={{ margin: "22px 0 10px" }}>
              <SectionLabel n="iii">Predicted effect</SectionLabel>
            </div>
            <div style={{
              padding: 14, borderRadius: 10,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {b.effects.map(([tag, n], i) => (
                <EffectBar
                  key={tag}
                  label={tag}
                  value={n}
                  color={
                    tag === "bitterness" ? theme.terra
                    : i === 0           ? theme.sage
                    : i === 1           ? theme.ochre
                    : theme.sky
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Your log with this blend — aggregates + recent sessions */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="iv">Your log with this blend</SectionLabel>
        </div>
        {brewCount === 0 ? (
          <div style={{
            padding: "16px 18px", borderRadius: 10,
            background: theme.cream, border: `1px dashed ${theme.ruleSoft}`,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, textAlign: "center",
          }}>
            No log for this blend yet.<br />
            Brew it and your notes will live here.
          </div>
        ) : (
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          }}>
            {/* Aggregate stats — one quiet line */}
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.inkSoft, lineHeight: 1.5,
              paddingBottom: brewCount > 1 ? 10 : 0,
              borderBottom: brewCount > 1 ? `1px solid ${theme.ruleSoft}` : "none",
              marginBottom: brewCount > 1 ? 10 : 0,
            }}>
              {brewCount === 1 ? (
                <>Brewed once.</>
              ) : (
                <>
                  Brewed {brewCount} times · average{" "}
                  <span style={{ color: theme.terra, letterSpacing: "0.1em" }}>
                    {"●".repeat(Math.round(avgTaste))}
                    <span style={{ color: theme.rule }}>{"●".repeat(5 - Math.round(avgTaste))}</span>
                  </span>
                  {topIntent && topActual && (
                    <>
                      {" "}· usually lands <span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{topActual}</span>
                      {" "}after <span style={{ color: theme.plum, fontStyle: "normal" }}>"{topIntent}"</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Recent sessions — up to 3 most recent */}
            <div>
              {mySessions.slice(0, 3).map((s, i) => (
                <div key={s.id} style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                  display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
                  }}>
                    <div style={{ fontSize: 11.5, color: theme.ash, letterSpacing: "0.03em", minWidth: 0 }}>
                      <span style={{ fontStyle: "italic", fontFamily: ff.serif }}>{s.intent}</span>
                      <span style={{ margin: "0 5px", color: theme.rule }}>→</span>
                      <span style={{ color: theme.sageDeep }}>{s.actual}</span>
                      <span style={{ margin: "0 8px", color: theme.rule }}>·</span>
                      <span style={{ color: theme.terra, letterSpacing: "0.1em" }}>
                        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5 - s.taste)}</span>
                      </span>
                    </div>
                    <span style={{ fontFamily: ff.sans, fontSize: 10, color: theme.ash, letterSpacing: "0.08em", flexShrink: 0 }}>
                      {s.ago}
                    </span>
                  </div>
                  {s.note && (
                    <div style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                      color: theme.inkSoft, lineHeight: 1.4,
                      paddingLeft: 8, borderLeft: `2px solid ${theme.ruleSoft}`,
                    }}>
                      "{s.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* See all link — only if there are more than 3 */}
            {mySessions.length > 3 && go && (
              <button onClick={() => { onClose(); go("library"); }} style={{
                marginTop: 4, width: "100%",
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                cursor: "pointer", padding: "8px 0 0",
                textAlign: "right",
              }}>
                see all {mySessions.length} in Apothecary →
              </button>
            )}
          </div>
        )}

        <button onClick={onBrew} style={{
          marginTop: 22, width: "100%",
          fontFamily: ff.serif, fontSize: 17,
          padding: "14px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
        }}>
          <Kettle size={20} c={theme.cream} />
          Brew this cup →
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: PROFILE
   ────────────────────────────────────────────────────────────── */

const ProfileScreen = ({ go, sessions, savedBlendIds, pantryIds, seedMode, setSeedMode }) => {
  const { unit, setUnit, weightUnit, setWeightUnit } = useUnit();

  const yourSessions = sessions.filter(s => s.who === "you");
  const cupCount = yourSessions.length;
  const blendCount = savedBlendIds.size;
  const shelfCount = pantryIds.size;

  // Compute a simple prediction-match rate: did the target mood land?
  // Here we fake it by checking actual ≈ intent — good enough for the
  // mock and correctly degrades to 0 when no sessions exist.
  const matched = yourSessions.filter(s => {
    const hit = (s.actual || "").toLowerCase();
    return MOODS.includes(hit);
  }).length;
  const matchPct = cupCount > 0 ? Math.round((matched / cupCount) * 100) : 0;

  // Badges earned by simple thresholds. Falls clean to zero for new users.
  const distinctIngredients = new Set();
  yourSessions.forEach(s => {
    const b = getBlend(s.blendId);
    if (b) b.ingredients.forEach(ing => distinctIngredients.add(ing.id));
  });

  const badges = [
    { name: "First Brewing",    earned: cupCount >= 1,  desc: "The first recorded cup." },
    { name: "Sworn Evening",    earned: cupCount >= 7,  desc: "Seven calming cups before bed." },
    { name: "The Cartographer", earned: distinctIngredients.size >= 12, desc: "Logged twelve distinct ingredients." },
    { name: "Self-Knower",      earned: matched >= 10,  desc: "Prediction matched truth ten times." },
    { name: "The Lavandière",   earned: false,          desc: "Try every flower in the catalog." },
    { name: "Dawn Watcher",     earned: false,          desc: "Five cups before 7am." },
  ];
  const earnedCount = badges.filter(b => b.earned).length;

  const isEmptyUser = cupCount === 0 && blendCount === 0;

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Identity card */}
      <div style={{
        border: `1px solid ${theme.rule}`, borderRadius: 14,
        padding: 20, background: theme.cream,
        position: "relative", overflow: "hidden",
      }}>
        {/* faux stamp — only appears once they've earned it */}
        {cupCount >= 1 && (
          <div style={{
            position: "absolute", top: 14, right: 14,
            width: 60, height: 60, borderRadius: "50%",
            border: `2px dashed ${theme.terra}`, opacity: 0.35,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: "rotate(-8deg)",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.terra,
            textAlign: "center", lineHeight: 1.1,
          }}>kept<br/>since<br/>'24</div>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: ff.serif, fontSize: 26, color: theme.terra,
          }}>J</div>
          <div>
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
              {isEmptyUser ? "a new keeper" : "Keeper of the shelf"}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 24, color: theme.ink, lineHeight: 1.1 }}>Tommy M.</div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {isEmptyUser
                ? "private · journal is still empty"
                : `private · ${cupCount} cup${cupCount !== 1 ? "s" : ""} · ${blendCount} blend${blendCount !== 1 ? "s" : ""}`
              }
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 16 }}>
          <Stat label="Cups"     value={cupCount} />
          <Stat label="Blends"   value={blendCount} />
          <Stat label="On shelf" value={shelfCount} />
          <Stat label="Badges"   value={earnedCount} />
        </div>
      </div>

      {/* self-knowledge */}
      <div style={{ margin: "24px 0 12px" }}><SectionLabel n="i">What you've learned about yourself</SectionLabel></div>
      <div style={{
        padding: 14, borderRadius: 10,
        border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
      }}>
        {cupCount === 0 ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55 }}>
            Self-knowledge grows from a few cups in. Log three or four
            brews with real intent and the patterns start showing up here.
          </div>
        ) : cupCount < 3 ? (
          <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft, lineHeight: 1.55 }}>
            You've logged {cupCount} cup{cupCount !== 1 ? "s" : ""}. Keep going — a few more brews
            and patterns about what lands for you will start to emerge.
          </div>
        ) : (
          <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.inkSoft, lineHeight: 1.55 }}>
            Across {cupCount} logged cups, your predicted-to-actual match rate is
            {" "}<em style={{ color: theme.terra }}>{matchPct}%</em>. You've explored
            {" "}<em style={{ color: theme.sageDeep }}>{distinctIngredients.size}</em> distinct ingredients so far.
          </div>
        )}
      </div>

      <div style={{ margin: "22px 0 12px" }}><SectionLabel n="ii">Badges</SectionLabel></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {badges.map(b => (
          <div key={b.name} style={{
            padding: 12, borderRadius: 10,
            background: b.earned ? theme.cream : "transparent",
            border: `1px ${b.earned ? "solid" : "dashed"} ${theme.rule}`,
            opacity: b.earned ? 1 : 0.55,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              {b.earned ? <Flower size={18} c={theme.ochre} /> : <Flower size={18} c={theme.ash} />}
              {b.earned && <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10, color: theme.terra }}>sealed</span>}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.ink, lineHeight: 1.2 }}>{b.name}</div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.ash, marginTop: 3 }}>{b.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "22px 0 10px" }}><SectionLabel n="iii">Preferences</SectionLabel></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Temperature</span>
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${theme.rule}`, borderRadius: 999,
            padding: 2, background: theme.cream,
          }}>
            {["C", "F"].map(u => (
              <button key={u} onClick={() => setUnit(u)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: unit === u ? theme.ink : "transparent",
                color: unit === u ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>°{u}</button>
            ))}
          </div>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Weight</span>
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${theme.rule}`, borderRadius: 999,
            padding: 2, background: theme.cream,
          }}>
            {[
              ["tsp", "tsp"],
              ["g",   "g"  ],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setWeightUnit(val)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: weightUnit === val ? theme.ink : "transparent",
                color: weightUnit === val ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <Toggle label="Notify when timer completes" value={true} onChange={() => {}} />
        <Toggle label="Quiet hours (10pm–7am)" value={true} onChange={() => {}} />
      </div>

      {/* Dev toolbar — seed-mode selector for testing empty/mid/power states */}
      <div style={{ margin: "26px 0 10px" }}>
        <SectionLabel n="iv">Dev — seed data</SectionLabel>
      </div>
      <div style={{
        padding: 12, borderRadius: 10,
        border: `1px dashed ${theme.rule}`, background: "rgba(181,130,89,0.04)",
      }}>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
          marginBottom: 10, lineHeight: 1.45,
        }}>
          Swap the app's state between snapshots to test empty-user,
          mid-journey, and power-user flows. Real app removes this.
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(SEED_MODES).map(([key, m]) => (
            <button key={key} onClick={() => setSeedMode(key)} style={{
              fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.03em",
              padding: "6px 12px", borderRadius: 999,
              border: `1px solid ${seedMode === key ? theme.ink : theme.rule}`,
              background: seedMode === key ? theme.ink : "transparent",
              color: seedMode === key ? theme.cream : theme.inkSoft,
              cursor: "pointer",
              flex: 1, minWidth: 80,
            }}>{m.label}</button>
          ))}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.ash,
          marginTop: 10, lineHeight: 1.45,
        }}>
          {SEED_MODES[seedMode].description}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, marginTop: 3 }}>{label}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Tab bar
   ────────────────────────────────────────────────────────────── */

const TabBar = ({ tab, setTab }) => {
  const tabs = [
    { k: "home",     label: "Home",     icon: <Kettle size={18} /> },
    { k: "compose",  label: "Compose",  icon: <Flower size={18} /> },
    { k: "library",  label: "Shelf",  icon: <Leaf size={18} /> },
    { k: "profile",  label: "Profile",  icon: <Sprig size={18} /> },
  ];

  return (
    <div style={{
      flexShrink: 0,
      padding: "10px 12px 22px",
      background: "rgba(243,236,220,0.94)",
      backdropFilter: "blur(8px)",
      borderTop: `1px solid ${theme.rule}`,
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4,
    }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 3,
          padding: "4px 2px",
          color: tab === t.k ? theme.terra : theme.ash,
          minWidth: 0,
        }}>
          {React.cloneElement(t.icon, { c: tab === t.k ? theme.terra : theme.ash })}
          <span style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Phone frame
   ────────────────────────────────────────────────────────────── */

const PhoneFrame = ({ children, label }) => {
  // On narrow screens (real mobile devices), skip the fake-phone frame
  // and render the app full-screen. Otherwise, show the frame (desktop preview).
  const [isNarrow, setIsNarrow] = React.useState(
    typeof window !== "undefined" && window.innerWidth < 500
  );
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 500);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isNarrow) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: theme.ivory,
        overflowX: "hidden",
        overflowY: "hidden",
        display: "flex", flexDirection: "column",
        // Use dynamic viewport height on modern browsers to handle mobile
        // browser chrome (address bar) gracefully; falls back to 100vh.
        height: "100dvh",
        width: "100vw",
      }}>
        {children}
      </div>
    );
  }

  return (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div style={{
      width: 380, height: 780,
      background: theme.ink,
      borderRadius: 44,
      padding: 10,
      boxShadow: "0 30px 60px -20px rgba(30,24,18,0.35), 0 10px 20px -10px rgba(30,24,18,0.2)",
    }}>
      <div style={{
        width: "100%", height: "100%",
        background: theme.ivory,
        borderRadius: 36,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* status bar */}
        <div style={{
          height: 44, display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0 24px",
          fontFamily: ff.sans, fontSize: 12.5, color: theme.ink, fontWeight: 600,
          position: "relative", zIndex: 20,
        }}>
          <span>9:41</span>
          <div style={{
            position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)",
            width: 100, height: 26, background: theme.ink, borderRadius: 20,
          }} />
          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 10 }}>●●●</span>
            <span>􀛨</span>
          </span>
        </div>
        {/* content area (scrollable) */}
        <div style={{
          position: "absolute", top: 44, left: 0, right: 0, bottom: 0,
          overflow: "hidden",
        }}>
          {children}
        </div>
      </div>
    </div>
    {label && (
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash,
      }}>{label}</div>
    )}
  </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Root app
   ────────────────────────────────────────────────────────────── */

export default function App() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // null | "steep" | "log" | "ingredient" | "blend"
  const [ingredientId, setIngredientId] = useState("chamomile");
  const [blendOverlayId, setBlendOverlayId] = useState(null);
  const [session, setSession] = useState(null);
  const [unit, setUnit] = useState("F");
  const [weightUnit, setWeightUnit] = useState("tsp");

  // Seed-mode system: swap between "new" / "mid" / "power" snapshots for
  // evaluating the UI at different stages of use.
  const [seedMode, setSeedMode] = useState("power");

  const [sessions, setSessions] = useState(SEED_MODES.power.sessions);
  const [savedBlendIds, setSavedBlendIds] = useState(new Set(SEED_MODES.power.savedBlendIds));
  const [pantryIds, setPantryIds] = useState(new Set(SEED_MODES.power.pantryIds));

  // When a saved blend is tapped from Home or elsewhere, we route through
  // Compose so the user can set intent before brewing. composePreselect tells
  // Compose which blend to show and which sub-tab to land on.
  const [composePreselect, setComposePreselect] = useState(null);

  // When seed mode changes, reset the varying state to that mode's snapshot.
  React.useEffect(() => {
    const mode = SEED_MODES[seedMode];
    if (!mode) return;
    setSessions(mode.sessions);
    setSavedBlendIds(new Set(mode.savedBlendIds));
    setPantryIds(new Set(mode.pantryIds));
  }, [seedMode]);

  const go = (to, arg) => {
    if (to === "ingredient") {
      if (arg) setIngredientId(arg);
      setOverlay("ingredient");
      return;
    }
    setTab(to);
  };

  const openBlend = (blendId) => {
    setBlendOverlayId(blendId);
    setOverlay("blend");
  };

  const startBrew = (blend, intent, targetMoods) => {
    setSession({ blend, intent, targetMoods });
    setOverlay("steep");
  };

  const togglePantry = (ingId) => {
    const next = new Set(pantryIds);
    if (next.has(ingId)) next.delete(ingId);
    else next.add(ingId);
    setPantryIds(next);
  };

  // Append a newly-logged cup to the sessions list. Called when the user
  // completes a brew+log cycle. This is what makes newly-brewed cups show
  // up in Home's "Your cups, lately" and Apothecary's history.
  const addSession = ({ blend, intent, targetMoods, landed, extra, taste, note, save, rename }) => {
    // A blend composed via forward-compose won't have an id; stash it under
    // a synthetic id so the session can reference it via getBlend().
    let blendId = blend.id;
    if (!blendId) {
      blendId = `local-${Date.now()}`;
      // If the user renamed the blend at log time, use their name. Otherwise
      // fall back to the auto-generated one. Composed blends can be awkward
      // ("Dusk Lullaby · spiced accent"), so the rename field exists to let
      // them give it a name they'll recognize in Apothecary later.
      const finalName = (rename && rename.length > 0) ? rename : blend.name;
      LOCAL_BLENDS[blendId] = { ...blend, id: blendId, name: finalName };
    }

    // Derive "actual" from what landed: prefer target moods that landed,
    // fall back to any unintended moods the user noted, then to "brewed".
    const landedMoods = (targetMoods || []).filter(m => landed?.[m]);
    const extraMoods = extra || [];
    const actual = landedMoods.length > 0 ? landedMoods.join(", ")
                 : extraMoods.length > 0 ? extraMoods.join(", ")
                 : "brewed";

    const newSession = {
      id: `sess-${Date.now()}`,
      who: "you",
      blendId,
      ago: "just now",
      intent: intent || "",
      actual,
      taste: taste ?? 4,
      note: note || "",
    };

    setSessions(prev => [newSession, ...prev]);

    // Honor the "save blend to library" toggle in Log.
    if (save && !savedBlendIds.has(blendId)) {
      const next = new Set(savedBlendIds);
      next.add(blendId);
      setSavedBlendIds(next);
    }
  };

  // Open Compose with a blend pre-selected — used when user taps a favorite
  // on Home or a saved blend in Apothecary. Ensures intent-capture happens
  // before brewing, per the spec's principle.
  const openInCompose = (blendId) => {
    setComposePreselect({ blendId, at: Date.now() });
    setTab("compose");
    setOverlay(null);
  };

  // Favorite/unfavorite a blend. Uses the same savedBlendIds set — a saved
  // blend IS a favorite. No second list.
  const toggleFavorite = (blendId) => {
    const next = new Set(savedBlendIds);
    if (next.has(blendId)) next.delete(blendId);
    else next.add(blendId);
    setSavedBlendIds(next);
  };

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  // Detect narrow (mobile-width) viewport so we can skip the desktop-preview
  // masthead/demo-hints/footer and render just the app at viewport size.
  const [isNarrow, setIsNarrow] = React.useState(
    typeof window !== "undefined" && window.innerWidth < 500
  );
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 500);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Extract the actual app tree (scroll region + tab bar + overlays) so we can
  // render it directly on mobile or wrap it in the desktop-preview chrome.
  const appContent = (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <div ref={scrollRef} style={{
        flex: "1 1 auto", minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}>
        {tab === "home"    && <HomeScreen    go={go} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} />}
        {tab === "compose" && <ComposeScreen go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} openBlend={openBlend} composePreselect={composePreselect} openInCompose={openInCompose} pantryIds={pantryIds} />}
        {tab === "library" && <LibraryScreen go={go} startBrew={startBrew} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} togglePantry={togglePantry} />}
        {tab === "profile" && <ProfileScreen go={go} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} seedMode={seedMode} setSeedMode={setSeedMode} />}
      </div>

      <TabBar tab={tab} setTab={(k) => { setOverlay(null); setTab(k); }} />

      {overlay === "steep" && session && (
        <SteepScreen
          blend={session.blend}
          intent={session.intent}
          setIntent={(v) => setSession(s => s ? { ...s, intent: v } : s)}
          targetMoods={session.targetMoods}
          sessions={sessions}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onDone={() => setOverlay("log")}
          onCancel={() => { setOverlay(null); setSession(null); }}
        />
      )}
      {overlay === "log" && session && (
        <LogScreen
          blend={session.blend}
          intent={session.intent}
          targetMoods={session.targetMoods}
          onSubmit={(logData) => {
            addSession({
              blend: session.blend,
              intent: session.intent,
              targetMoods: session.targetMoods,
              ...logData,
            });
            setOverlay(null);
            setSession(null);
            setTab("home");
          }}
          onCancel={() => setOverlay(null)}
        />
      )}
      {overlay === "ingredient" && (
        <IngredientDetail
          id={ingredientId}
          onClose={() => setOverlay(null)}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onOpenIngredient={(newId) => setIngredientId(newId)}
        />
      )}
      {overlay === "blend" && blendOverlayId && (
        <BlendDetail
          blendId={blendOverlayId}
          isFavorite={savedBlendIds.has(blendOverlayId)}
          onToggleFavorite={() => toggleFavorite(blendOverlayId)}
          sessions={sessions}
          go={go}
          onClose={() => setOverlay(null)}
          onOpenIngredient={(ingId) => {
            setIngredientId(ingId);
            setOverlay("ingredient");
          }}
          onBrew={() => {
            const b = getBlend(blendOverlayId);
            if (!b) return;
            startBrew(b, "", [b.mood]);
          }}
        />
      )}
    </div>
  );

  // Mobile: render app full-screen with no masthead/demo-hints/footer chrome.
  if (isNarrow) {
    return (
      <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
        <div style={{
          position: "fixed", inset: 0,
          background: theme.ivory,
          display: "flex", flexDirection: "column",
          height: "100dvh", width: "100vw",
          overflow: "hidden",
          fontFamily: ff.sans,
        }}>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          {appContent}
        </div>
      </UnitContext.Provider>
    );
  }

  return (
    <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
    <div style={{
      minHeight: "100vh", width: "100%",
      background: `
        radial-gradient(ellipse at 20% 0%, rgba(181,130,89,0.1) 0%, transparent 45%),
        radial-gradient(ellipse at 80% 100%, rgba(109,126,85,0.12) 0%, transparent 45%),
        linear-gradient(180deg, #E8DCC0 0%, #D6C6A4 100%)
      `,
      padding: "40px 20px",
      fontFamily: ff.sans,
    }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Masthead */}
      <div style={{ maxWidth: 1400, margin: "0 auto 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Flower size={22} c={theme.terra} />
          <div style={{
            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.32em",
            textTransform: "uppercase", color: theme.inkSoft,
          }}>
            An Apothecary's Journal — for the Quiet Cup
          </div>
          <Flower size={22} c={theme.terra} />
        </div>
        <h1 style={{
          fontFamily: ff.serif, fontSize: 54, fontWeight: 300, color: theme.ink,
          letterSpacing: "-0.02em", margin: "6px 0 4px", lineHeight: 1,
        }}>
          Herbanium
        </h1>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 15, color: theme.inkSoft,
        }}>
          Blend by mood · brew with intent · log the effect
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <Ornament w={180} c={theme.ochre} />
        </div>
      </div>

      {/* Demo hint */}
      <div style={{
        maxWidth: 1400, margin: "0 auto 24px",
        display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap",
      }}>
        <DemoHint label="Combine moods" detail="try calm + focus on Compose" />
        <DemoHint label="Traditions tab" detail="Moroccan Mint, Masala Chai, Sencha" />
        <DemoHint label="Flip seed mode" detail="Profile → Dev → try 'new user'" />
      </div>

      {/* Phones */}
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 32,
      }}>
        <PhoneFrame label="the app">
          {appContent}
        </PhoneFrame>
      </div>

      {/* Footer notes */}
      <div style={{
        maxWidth: 900, margin: "40px auto 0", textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5, color: theme.inkSoft, lineHeight: 1.6,
      }}>
        Placeholder name. "What's the tea?" reserved for the social surface.
        <br />
        Deterministic, local engine — no AI in the loop.
      </div>
    </div>
    </UnitContext.Provider>
  );
}



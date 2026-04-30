/* ──────────────────────────────────────────────────────────────
   data/moodCrystal.js — recent mood/flavor aggregation for the
   bestiary's lead crystal.

   The crystal is the visual surface for the bias that already
   exists in maybeRollWild — top effect-families + flavor-families
   from the user's recent cups and journal entries already weight
   wild-elemental rolls. This module names that signal so the user
   can see it shifting on screen.

   computeMoodCrystal({ sessions, journalEntries, getBlend, now })
   → { name, description, primary, secondary, gradient, families }

   - primary / secondary    — the two strongest family records
   - gradient               — `[color1, color2]` for the SVG fill
   - name                   — one-line title that names the crystal
   - description            — a short poetic line about the trend
   - families               — { effect, flavor } family records,
                              sorted weight desc

   Empty input returns the "Neutral" crystal — the baseline before
   any data has accumulated. Same shape, different voice.
   ────────────────────────────────────────────────────────────── */

import {
  FAMILY_BY_FLAVOR, FAMILY_COLORS,
  FAMILY_BY_EFFECT, EFFECT_FAMILY_COLORS,
} from "../components/FlavorMap";

// Window: 30 days. Anything older drops out — the crystal is meant
// to read as "lately," not as a permanent record.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Adjective per family. Drawn from the same gemstone/atmosphere
// vocabulary the bestiary already uses (see elementalAdjectives.js)
// so the crystal name reads as a peer to the elementals on the
// shelf below, not a separate language.
const EFFECT_ADJECTIVES = {
  calm:   "Sage",
  focus:  "Sky",
  energy: "Citrine",
  warm:   "Ember",
  cool:   "Aquamarine",
  body:   "Bloodstone",
  sleep:  "Twilight",
};

const FLAVOR_ADJECTIVES = {
  fruit:   "Garnet",
  floral:  "Rose-Quartz",
  earthy:  "Onyx",
  spiced:  "Cinnabar",
  smoky:   "Obsidian",
  fresh:   "Frost",
  vegetal: "Jade",
  marine:  "Tide",
  sweet:   "Amber",
  body:    "Stone",
};

// One short poetic phrase per effect family — the dominant register's
// "voice." Reused in the description when this family leads.
const EFFECT_VOICE = {
  calm:   "moss-cool, a hush at the center",
  focus:  "clear water lit from within",
  energy: "amber, crackling at the edges",
  warm:   "a hearth-light, dusk-glow",
  cool:   "tide-cool, mineral and held",
  body:   "stone-warm, settled low",
  sleep:  "candle-low, drifting",
};

// One short phrase per flavor family — the secondary "color"
// register, used when a flavor family is the lead or a strong tail.
const FLAVOR_VOICE = {
  fruit:   "the bright tart of fruit",
  floral:  "petal-soft and fragrant",
  earthy:  "deep wood and damp soil",
  spiced:  "warming and cinder-bright",
  smoky:   "cinder and pine smoke",
  fresh:   "mint-clean, a cool breath",
  vegetal: "fresh leaf and grass",
  marine:  "kelp-green and oceanic",
  sweet:   "honeyed, slow caramel",
  body:    "the body of a finished cup",
};

const articleFor = (word) => /^[aeiou]/i.test(word || "") ? "An" : "A";

function withinWindow(ts, now) {
  if (!ts) return false;
  return now - ts <= WINDOW_MS;
}

function tally(items) {
  const out = {};
  for (const x of items || []) {
    if (!x) continue;
    out[x] = (out[x] || 0) + 1;
  }
  return out;
}

// Map a raw mood word ("calm", "uplifting", "anxious") to an effect
// family ("calm", "energy"). Anxious / stressed / restless / tired
// don't map to a tea family — they're felt-states, not the tea's
// effect register — so we drop them. The crystal reflects what the
// user is brewing toward, not what they show up with on the worst
// days.
function moodToEffectFamily(m) {
  if (!m) return null;
  return FAMILY_BY_EFFECT[m] || null;
}

// Map a raw flavor word ("citrus", "minty", "honey") to a flavor
// family ("fresh", "fresh", "sweet").
function flavorToFlavorFamily(f) {
  if (!f) return null;
  return FAMILY_BY_FLAVOR[f] || null;
}

function collectRecentMoods(sessions, journalEntries, now) {
  const moods = [];
  for (const s of sessions || []) {
    if (!withinWindow(s.ts, now)) continue;
    if (Array.isArray(s.currentMoods)) moods.push(...s.currentMoods);
    if (Array.isArray(s.targetMoods))  moods.push(...s.targetMoods);
    if (typeof s.actual === "string") {
      for (const m of s.actual.split(",").map(x => x.trim()).filter(Boolean)) {
        moods.push(m);
      }
    }
  }
  for (const e of journalEntries || []) {
    if (!withinWindow(e.ts, now)) continue;
    if (Array.isArray(e.currentMoods)) moods.push(...e.currentMoods);
    if (Array.isArray(e.landedMoods))  moods.push(...e.landedMoods);
  }
  return moods;
}

function collectRecentFlavors(sessions, getBlend, now) {
  const flavors = [];
  for (const s of sessions || []) {
    if (!withinWindow(s.ts, now)) continue;
    const blend = getBlend ? getBlend(s.blendId) : null;
    if (!blend) continue;
    if (typeof blend.flavor === "string") flavors.push(blend.flavor);
    if (Array.isArray(blend.flavors))    flavors.push(...blend.flavors);
  }
  return flavors;
}

function topFamily(rawCounts, mapper, palette) {
  const familyCounts = {};
  for (const [word, n] of Object.entries(rawCounts)) {
    const fam = mapper(word);
    if (!fam) continue;
    familyCounts[fam] = (familyCounts[fam] || 0) + n;
  }
  const ranked = Object.entries(familyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([family, weight]) => ({
      family, weight, color: palette[family] || "#796E5B",
    }));
  return { ranked, top: ranked[0] || null };
}

/**
 * Build the crystal record for the user's last 30 days of activity.
 *
 * Returns a stable shape — even with no data, the caller gets a
 * valid `gradient` and `name` so the visual never has to special-
 * case empty input. The "Neutral" crystal is the baseline that
 * every user starts with before brewing.
 */
export function computeMoodCrystal({
  sessions = [],
  journalEntries = [],
  getBlend = null,
  now = Date.now(),
} = {}) {
  const moodTally = tally(collectRecentMoods(sessions, journalEntries, now));
  const flavorTally = tally(collectRecentFlavors(sessions, getBlend, now));

  const effectFams = topFamily(moodTally, moodToEffectFamily, EFFECT_FAMILY_COLORS);
  const flavorFams = topFamily(flavorTally, flavorToFlavorFamily, FAMILY_COLORS);

  // Decide primary vs secondary. Prefer effect family as primary
  // when present (mood is the user's intent); fall back to flavor
  // when no mood data lands. Secondary is the other axis's leader,
  // OR the second-place effect family if no flavor data exists.
  let primary = null;
  let secondary = null;
  let primaryAxis = null;
  let secondaryAxis = null;

  if (effectFams.top) {
    primary = effectFams.top; primaryAxis = "effect";
    if (flavorFams.top) {
      secondary = flavorFams.top; secondaryAxis = "flavor";
    } else if (effectFams.ranked[1]) {
      secondary = effectFams.ranked[1]; secondaryAxis = "effect";
    }
  } else if (flavorFams.top) {
    primary = flavorFams.top; primaryAxis = "flavor";
    if (flavorFams.ranked[1]) {
      secondary = flavorFams.ranked[1]; secondaryAxis = "flavor";
    }
  }

  // Empty pool — the unbrewed baseline. Two soft ash-cream tones
  // so the crystal renders as a translucent quartz, not a flat
  // grey shape that looks broken.
  if (!primary) {
    return {
      name: "A Neutral Crystal",
      description: "Untouched. It will take color as you brew, and as you write.",
      primary: null,
      secondary: null,
      gradient: ["#D8CDB3", "#B8AC92"],
      families: { effect: [], flavor: [] },
      isNeutral: true,
    };
  }

  // Family-aligned adjective for the primary, used to build the
  // crystal's name. "A Citrine-Sage Crystal" when both axes lead.
  const primaryAdj = primaryAxis === "effect"
    ? EFFECT_ADJECTIVES[primary.family]
    : FLAVOR_ADJECTIVES[primary.family];
  const secondaryAdj = secondary
    ? (secondaryAxis === "effect"
        ? EFFECT_ADJECTIVES[secondary.family]
        : FLAVOR_ADJECTIVES[secondary.family])
    : null;

  const titleAdj = secondaryAdj
    ? `${primaryAdj} threaded with ${secondaryAdj}`
    : primaryAdj;
  const name = `${articleFor(titleAdj)} ${titleAdj} Crystal`;

  // Description voice — names both registers when both exist,
  // otherwise stays single-color. Built from the family voice
  // tables above so the line stays in the app's tea-garden register.
  const primaryVoice = primaryAxis === "effect"
    ? EFFECT_VOICE[primary.family]
    : FLAVOR_VOICE[primary.family];
  const secondaryVoice = secondary
    ? (secondaryAxis === "effect"
        ? EFFECT_VOICE[secondary.family]
        : FLAVOR_VOICE[secondary.family])
    : null;

  let description;
  if (secondaryVoice) {
    description = `${primaryVoice}, drifting into ${secondaryVoice}.`;
    description = description.charAt(0).toUpperCase() + description.slice(1);
  } else {
    description = `${primaryVoice}.`;
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // Gradient: primary on the warm/saturated side, secondary on the
  // cool/light side. If only one family lands, blend toward a soft
  // ash so the crystal still has internal motion.
  const gradient = secondary
    ? [primary.color, secondary.color]
    : [primary.color, "#C9BFA6"];

  return {
    name,
    description,
    primary: { ...primary, axis: primaryAxis, adjective: primaryAdj },
    secondary: secondary
      ? { ...secondary, axis: secondaryAxis, adjective: secondaryAdj }
      : null,
    gradient,
    families: {
      effect: effectFams.ranked,
      flavor: flavorFams.ranked,
    },
    isNeutral: false,
  };
}

/* ──────────────────────────────────────────────────────────────
   data/moodCrystal.js — recent mood/flavor aggregation for the
   bestiary's lead crystal.

   The crystal is the visual surface for the bias that already
   exists in maybeRollWild — top effect-families + flavor-families
   from the user's recent cups and journal entries already weight
   wild-elemental rolls. This module names that signal so the user
   can see it shifting on screen.

   computeMoodCrystal({ sessions, journalEntries, getBlend, profile, now })
   → { name, description, primary, secondary, gradient, families, isFaint }

   - primary / secondary    — the two strongest family records
   - gradient               — `[color1, color2]` for the SVG fill
   - name                   — one-line title that names the crystal
   - description            — a short poetic line about the trend
   - families               — { effect, flavor } family records,
                              sorted weight desc
   - isFaint                — true when the crystal is colored from
                              the user's onboarding intent (profile
                              draw / flavors) rather than real
                              activity. Visual renders dimmer.

   Three states:
   - Real data → primary/secondary from sessions + journal,
     with optional "with faint X" trailing mention pulling in
     unmet onboarding intent.
   - No real data + onboarding intent → faint crystal colored
     from profile.draw / profile.flavors. Description leads with
     "Faintly..." so the user reads it as a forecast, not a record.
   - Nothing at all → the "Neutral" baseline.
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

// Pull the user's onboarding-declared intent — the moods they said
// drew them in (profile.draw) and the flavors they said they liked
// (profile.flavors, [[name, strength], ...]) — and normalize each
// to its family. Used as a fallback color source when there's no
// real activity yet, and as a "with faint X ahead" trailing mention
// when real activity exists but hasn't covered every declared lane.
function profileFamilies(profile) {
  if (!profile) return { effects: [], flavors: [] };
  const effects = [];
  for (const d of profile.draw || []) {
    const fam = FAMILY_BY_EFFECT[d];
    if (fam && !effects.includes(fam)) effects.push(fam);
  }
  const flavors = [];
  for (const entry of profile.flavors || []) {
    const name = Array.isArray(entry) ? entry[0] : entry;
    const fam = FAMILY_BY_FLAVOR[name];
    if (fam && !flavors.includes(fam)) flavors.push(fam);
  }
  return { effects, flavors };
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
  profile = null,
  now = Date.now(),
} = {}) {
  const moodTally = tally(collectRecentMoods(sessions, journalEntries, now));
  const flavorTally = tally(collectRecentFlavors(sessions, getBlend, now));

  const effectFams = topFamily(moodTally, moodToEffectFamily, EFFECT_FAMILY_COLORS);
  const flavorFams = topFamily(flavorTally, flavorToFlavorFamily, FAMILY_COLORS);
  const profileFams = profileFamilies(profile);

  // Decide primary vs secondary. Prefer effect family as primary
  // when present (mood is the user's intent); fall back to flavor
  // when no mood data lands. Secondary is the other axis's leader,
  // OR the second-place effect family if no flavor data exists.
  let primary = null;
  let secondary = null;
  let primaryAxis = null;
  let secondaryAxis = null;
  let isFaint = false;

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

  // No real activity — fall back to the user's onboarding intent.
  // The crystal renders dimmer (isFaint) and the description
  // frames it as a forecast: "the focus you reach for, still
  // gathering" rather than "moss-cool, a hush at the center."
  if (!primary && (profileFams.effects.length || profileFams.flavors.length)) {
    const peffect = profileFams.effects[0];
    const pflavor = profileFams.flavors[0];
    if (peffect) {
      primary = { family: peffect, color: EFFECT_FAMILY_COLORS[peffect], weight: 0 };
      primaryAxis = "effect";
      if (pflavor) {
        secondary = { family: pflavor, color: FAMILY_COLORS[pflavor], weight: 0 };
        secondaryAxis = "flavor";
      } else if (profileFams.effects[1]) {
        const e2 = profileFams.effects[1];
        secondary = { family: e2, color: EFFECT_FAMILY_COLORS[e2], weight: 0 };
        secondaryAxis = "effect";
      }
    } else if (pflavor) {
      primary = { family: pflavor, color: FAMILY_COLORS[pflavor], weight: 0 };
      primaryAxis = "flavor";
      if (profileFams.flavors[1]) {
        const f2 = profileFams.flavors[1];
        secondary = { family: f2, color: FAMILY_COLORS[f2], weight: 0 };
        secondaryAxis = "flavor";
      }
    }
    isFaint = true;
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
      isFaint: false,
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
  if (isFaint) {
    // Faint = forecast voice. Lowercase the family voice so the
    // line reads as continuation of "Faintly..." rather than two
    // capitalized starts.
    const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
    if (secondaryVoice) {
      description = `Faintly ${primaryAdj} — ${lc(primaryVoice)}, with a hint of ${lc(secondaryVoice)} ahead.`;
    } else {
      description = `Faintly ${primaryAdj} — ${lc(primaryVoice)}, still gathering.`;
    }
  } else if (secondaryVoice) {
    description = `${primaryVoice}, drifting into ${secondaryVoice}.`;
    description = description.charAt(0).toUpperCase() + description.slice(1);
  } else {
    description = `${primaryVoice}.`;
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // "With faint X" trailing mention — surfaces an onboarding-
  // declared family the user hasn't actually brewed toward yet.
  // Only fires on real-data crystals (faint crystals already lead
  // with the unmet intent). Effects are searched first since mood
  // is the dominant signal in onboarding.
  if (!isFaint) {
    const seen = new Set();
    if (primaryAxis === "effect") seen.add(`e:${primary.family}`);
    else                          seen.add(`f:${primary.family}`);
    if (secondary) {
      if (secondaryAxis === "effect") seen.add(`e:${secondary.family}`);
      else                            seen.add(`f:${secondary.family}`);
    }
    let trailing = null;
    for (const f of profileFams.effects) {
      if (!seen.has(`e:${f}`)) {
        trailing = { adj: EFFECT_ADJECTIVES[f], voice: EFFECT_VOICE[f] };
        break;
      }
    }
    if (!trailing) {
      for (const f of profileFams.flavors) {
        if (!seen.has(`f:${f}`)) {
          trailing = { adj: FLAVOR_ADJECTIVES[f], voice: FLAVOR_VOICE[f] };
          break;
        }
      }
    }
    if (trailing) {
      description = description.replace(/\.$/, "")
        + `, with faint ${trailing.adj} still ahead of you.`;
    }
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
    isFaint,
  };
}

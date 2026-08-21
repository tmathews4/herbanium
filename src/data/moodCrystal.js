/* ──────────────────────────────────────────────────────────────
   data/moodCrystal.js — recent mood/flavor aggregation for the
   elementals's lead crystal.

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
  FAMILY_BY_FLAVOR,
  FAMILY_BY_EFFECT,
} from "../components/FlavorMap";
import { orderModifiers, euphonyOK } from "./titleEuphony";
// Uses the shared deterministic hash — see helpers/misc. Four copies
// of this existed; the values are identical, verified sample-by-sample.
import { hashString, tallyBy } from "../helpers/misc.js";

// Window: 30 days. Anything older drops out — the crystal is meant
// to read as "lately," not as a permanent record.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Crystal-specific palette — fluorescent / neon gem tones, lifted
// hard above the muted FAMILY_COLORS / EFFECT_FAMILY_COLORS the
// rest of the app uses. These are deliberately near-highlighter
// saturated so the crystal reads as a luminous backlit object,
// not a painted shape. Same palette in both light and dark themes
// (gem hues, not surface hues); the SVG renderer pushes them
// further with brighter inset highlights, more saturated gradient
// stops, and stronger glow halos so each color almost emits.
/* THE OTHER HALF OF THE SAME DRIFT. This map had exactly the gaps
   EFFECT_ADJECTIVES did — `warm` and `body` where the families are
   `heat`, `comfort`, `digestive` and `immune` — and I fixed the
   adjectives without noticing it, because the two maps sit forty lines
   apart and look nothing alike.

   tools/audit-vocabulary-coverage.mjs found it in its first useful run,
   which is the argument for the tool: a bug of this shape is invisible
   to a reader who is already looking at the file. */
const CRYSTAL_EFFECT_COLORS = {
  calm:      "#4DEB7E", // neon spring-green
  soothing:  "#7CF0B4", // pale jade
  grounding: "#2FA96B", // deep viridian
  uplifting: "#FFE566", // bright citrine
  focus:     "#3EBAFF", // electric sapphire
  energy:    "#FFC318", // saturated amber-yellow
  comfort:   "#FF9E6B", // warm carnelian — the wrapped-blanket register
  heat:      "#FF7A4C", // hot coral            (was `warm`)
  cool:      "#2EE8EC", // electric aqua
  digestive: "#B8E04A", // bright peridot
  immune:    "#C0432F", // bloodstone red       (was `body`)
  sleep:     "#C77FFF", // neon amethyst
};

const CRYSTAL_FLAVOR_COLORS = {
  fruit:   "#FF4A2D", // neon scarlet
  floral:  "#FF8DC3", // bright rose-pink
  earthy:  "#6B4D8C", // luminous dark amethyst — Onyx leans purple-black
                       // rather than brown so the stone reads as a deep
                       // gem rather than a wood-grain accent.
  spiced:  "#FFA240", // bright amber-orange
  smoky:   "#9684C8", // bright indigo-violet
  fresh:   "#4FECF0", // neon mint-cyan
  vegetal: "#7CE049", // electric leaf-green
  marine:  "#2EB7DC", // bright cobalt-teal
  sweet:   "#FFDF5A", // honey-yellow lift
  body:    "#C4B57E", // bright gold-tan
};

// Adjective per family. Drawn from the same gemstone/atmosphere
// vocabulary the elementals already uses (see elementalAdjectives.js)
// so the crystal name reads as a peer to the elementals on the
// shelf below, not a separate language.
/* KEYED BY FAMILY, and it has to stay exhaustive.

   Four families had no entry here — comfort, heat, digestive, immune —
   because this map still carried two names the families no longer use:
   `warm` (the family is `heat`, whose label is "warming") and `body` (a
   catch-all from before the body register was split into comfort,
   digestive and immune). A crystal whose winning axis landed on any of
   the four named itself "A Jade and undefined Swirling Crystal".

   The description path had a `|| "Quiet"` fallback for exactly this and
   the NAME path did not, so the guard existed and covered the quieter
   half. Both are covered now, and tests/crystal-naming.test.mjs holds
   the map exhaustive so the next family added can't reopen it. */
const EFFECT_ADJECTIVES = {
  calm:      "Sage",
  soothing:  "Jade",
  grounding: "Verdant",
  uplifting: "Sunstone",
  focus:     "Sky",
  energy:    "Citrine",
  comfort:   "Carnelian",
  heat:      "Ember",       // was `warm`
  cool:      "Aquamarine",
  digestive: "Peridot",
  immune:    "Bloodstone",  // was `body`, and bloodstone was always the
                            // health-register color — it just had no
                            // family to belong to until immune existed
  sleep:     "Twilight",
};

const FLAVOR_ADJECTIVES = {
  fruit:     "Garnet",
  floral:    "Rose-Quartz",
  earthy:    "Onyx",
  spiced:    "Cinnabar",
  smoky:     "Obsidian",
  fresh:     "Frost",
  // Was "Jade", which soothing also uses — and a crystal takes one
  // color from each axis, so an effect-soothing, flavor-vegetal cup
  // could name itself "A Jade and Jade Swirling Crystal". The euphony
  // pass can't save that: it rejects the root echo, tries the swap,
  // gets the identical pair back, and accepts it. Malachite is the
  // same green without the collision.
  vegetal:   "Malachite",
  marine:    "Tide",
  sweet:     "Amber",
  mouthfeel: "Stone",       // was `body`
};

// Each voice describes the crystal's interior glow and the
// ethereal motion of color inside the stone — light pooling,
// running, flickering, drifting. Strictly inorganic register: no
// body parts (breath, tongue), no taste verbs (tart, sweet on the
// palate). The crystal is alive but not biological. Single noun-
// phrase fragments without internal commas or leading articles,
// so they slot cleanly into any pattern verb (threaded with X,
// swirling into X, banded with X, etc.).
const EFFECT_VOICE = {
  calm:   "moss-green light pooling",
  focus:  "sapphire light running clear",
  energy: "amber sparks flickering",
  warm:   "ember-glow at the heart",
  cool:   "teal current held cool",
  body:   "bronze warmth low and steady",
  sleep:  "low violet glow settling",
};

const FLAVOR_VOICE = {
  fruit:   "scarlet flicker",
  floral:  "rose-pink shimmer",
  earthy:  "deep amethyst grain",
  spiced:  "orange ember pulse",
  smoky:   "indigo haze",
  fresh:   "cyan ripple",
  vegetal: "leaf-green gleam",
  marine:  "cobalt current",
  sweet:   "honey-gold pool",
  body:    "warm gold settled",
};

const articleFor = (word) => /^[aeiou]/i.test(word || "") ? "An" : "A";

// Pattern words — describe the crystal's visual texture. One per
// user, picked deterministically from profile.name + createdAt so
// each user has their own signature pattern that doesn't shift
// across sessions. Pattern shows up in the name's third slot
// ("A Sage Sky Threaded Crystal") and shapes the description's
// transition verb between the two color clauses.
//
// Each entry: [Title-Case word, transition phrase used in the
// description, single-color phrase when only one family lands].
const CRYSTAL_PATTERNS = [
  ["Threaded", "threaded with", "drawn through with a single clear strand"],
  ["Swirling", "swirling into", "the color spirals slow at its heart"],
  ["Veined",   "veined with",   "thin currents branch across the cut"],
  ["Misted",   "misted into",   "softened toward a hazed center"],
  ["Banded",   "banded with",   "neat layers stack within the stone"],
  ["Blotted",  "blotted with",  "irregular patches drift in the depth"],
  ["Dotted",   "dotted with",   "small bright points scatter through it"],
  ["Cloudy",   "clouded with",  "the color hangs in a soft suspension"],
];


function patternForProfile(profile) {
  // Deterministic per profile — same user keeps the same pattern
  // across sessions and devices, since name + createdAt is stable.
  // Falls back to Threaded for the no-profile case (e.g. previews).
  if (!profile) return CRYSTAL_PATTERNS[0];
  const seed = `${profile.name || "anon"}|${profile.createdAt || 0}|crystalPattern`;
  return CRYSTAL_PATTERNS[hashString(seed) % CRYSTAL_PATTERNS.length];
}

function withinWindow(ts, now) {
  if (!ts) return false;
  return now - ts <= WINDOW_MS;
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

// Pull a session's timestamp from `brewedAt` (the field App.jsx and
// the seed materializer actually set) before falling back to `ts`.
// The original implementation read `s.ts` directly — undefined on
// every session — which silently dropped the entire session pool
// before any mood / flavor counting happened.
const tsOf = (item) => item?.brewedAt || item?.ts || 0;

function collectRecentMoods(sessions, journalEntries, now) {
  const moods = [];
  for (const s of sessions || []) {
    if (!withinWindow(tsOf(s), now)) continue;
    if (Array.isArray(s.currentMoods)) moods.push(...s.currentMoods);
    if (Array.isArray(s.targetMoods))  moods.push(...s.targetMoods);
    if (typeof s.actual === "string") {
      for (const m of s.actual.split(",").map(x => x.trim()).filter(Boolean)) {
        moods.push(m);
      }
    }
  }
  for (const e of journalEntries || []) {
    if (!withinWindow(tsOf(e), now)) continue;
    if (Array.isArray(e.currentMoods)) moods.push(...e.currentMoods);
    if (Array.isArray(e.landedMoods))  moods.push(...e.landedMoods);
  }
  return moods;
}

/* The defect register is not a palate.
   `off` collects bitter, astringent, tannic, harsh, acrid, soapy,
   muddy, medicinal, pith and sharp — the words for a cup that went
   wrong. FlavorMap already strips them from the flavor strip
   (EXCLUDED_FROM_FLAVOR) so a reader doesn't file them as tastes, and
   the same reasoning applies harder here: a crystal is meant to be a
   portrait of what you reach for, and "you mostly brew things
   astringent" is a brewing note, not an identity.
   Left in the tally and it could win an axis outright — which is how
   the crystal first came to have a family with no color word. */
const NOT_A_PALATE = new Set(["off"]);

function collectRecentFlavors(sessions, getBlend, now) {
  const flavors = [];
  for (const s of sessions || []) {
    if (!withinWindow(tsOf(s), now)) continue;
    const blend = getBlend ? getBlend(s.blendId) : null;
    if (!blend) continue;
    if (typeof blend.flavor === "string") flavors.push(blend.flavor);
    if (Array.isArray(blend.flavors))    flavors.push(...blend.flavors);
  }
  return flavors.filter(f => !NOT_A_PALATE.has(FAMILY_BY_FLAVOR[f]));
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
  const moodTally = tallyBy(collectRecentMoods(sessions, journalEntries, now));
  const flavorTally = tallyBy(collectRecentFlavors(sessions, getBlend, now));

  const effectFams = topFamily(moodTally, moodToEffectFamily, CRYSTAL_EFFECT_COLORS);
  const flavorFams = topFamily(flavorTally, flavorToFlavorFamily, CRYSTAL_FLAVOR_COLORS);
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
      primary = { family: peffect, color: CRYSTAL_EFFECT_COLORS[peffect], weight: 0 };
      primaryAxis = "effect";
      if (pflavor) {
        secondary = { family: pflavor, color: CRYSTAL_FLAVOR_COLORS[pflavor], weight: 0 };
        secondaryAxis = "flavor";
      } else if (profileFams.effects[1]) {
        const e2 = profileFams.effects[1];
        secondary = { family: e2, color: CRYSTAL_EFFECT_COLORS[e2], weight: 0 };
        secondaryAxis = "effect";
      }
    } else if (pflavor) {
      primary = { family: pflavor, color: CRYSTAL_FLAVOR_COLORS[pflavor], weight: 0 };
      primaryAxis = "flavor";
      if (profileFams.flavors[1]) {
        const f2 = profileFams.flavors[1];
        secondary = { family: f2, color: CRYSTAL_FLAVOR_COLORS[f2], weight: 0 };
        secondaryAxis = "flavor";
      }
    }
    isFaint = true;
  }

  // Empty pool — the unbrewed baseline. Two soft ash-cream tones
  // so the crystal renders as a translucent quartz, not a flat
  // gray shape that looks broken.
  if (!primary) {
    return {
      name: "A Neutral Crystal",
      description: "Untouched. It will take color as you brew, and as you write.",
      primary: null,
      secondary: null,
      gradient: ["#D8CDB3", "#B8AC92"],
      innerGlowColor: null,
      outerGlowColor: null,
      patternColor: "#B8AC92",
      families: { effect: [], flavor: [] },
      isNeutral: true,
      isFaint: false,
    };
  }

  // Family-aligned adjective for each axis, used to build the
  // crystal's compact name. Two-axis form keeps both colors stacked
  // before the pattern word: "A Sage Sky Threaded Crystal."
  const primaryAdj = primaryAxis === "effect"
    ? EFFECT_ADJECTIVES[primary.family]
    : FLAVOR_ADJECTIVES[primary.family];
  const secondaryAdj = secondary
    ? (secondaryAxis === "effect"
        ? EFFECT_ADJECTIVES[secondary.family]
        : FLAVOR_ADJECTIVES[secondary.family])
    : null;

  const [patternWord, patternVerb, patternSoloVoice] = patternForProfile(profile);

  /* Last line of defence for the NAME, mirroring the `|| "Quiet"` the
     description has carried all along. The maps above are held
     exhaustive by a test, so this should never fire — but a name is the
     most visible string in the app and "undefined" in it is the kind of
     thing a user reports rather than a developer notices. */
  const safePrimaryAdj = primaryAdj || "Quiet";
  const safeSecondaryAdj = secondaryAdj || null;

  // Single-axis crystals skip the pattern word — pattern needs two
  // colors to read as a relationship. "A Sage Crystal" reads cleaner
  // than "A Sage Threaded Crystal" when there's nothing to thread
  // it with.
  let namePieces;
  let name;
  if (!safeSecondaryAdj) {
    namePieces = [safePrimaryAdj];
    name = `${articleFor(namePieces[0])} ${namePieces.join(" ")} Crystal`;
  } else {
    // Run the same "sounds good" pass the unique creation title
    // uses (see data/titleEuphony.js): order the two color
    // modifiers by English adjective rank, then check the full
    // [adj1, adj2, pattern] sequence for alliteration / stutter /
    // root-echo. If the rank-correct ordering trips the check,
    // try the swap. If both fail, accept the rank-correct one —
    // pattern is a per-profile signature, so we don't substitute
    // it; the user keeps their crystal's identity intact.
    const ranked  = orderModifiers(safePrimaryAdj, safeSecondaryAdj);
    const swapped = [ranked[1], ranked[0]];
    const rankedSeq  = [...ranked,  patternWord];
    const swappedSeq = [...swapped, patternWord];
    namePieces = euphonyOK(rankedSeq) ? rankedSeq
              : euphonyOK(swappedSeq) ? swappedSeq
              : rankedSeq;
    // Connect the two color adjectives with "and" so they read as
    // two distinct color names instead of one modifying the other.
    // The previous "Rose-Quartz Sage Dotted Crystal" form scanned
    // as a compound English adjective (sage-colored dots in a
    // rose-quartz stone) when the renderer actually shows a sage-
    // and-rose-quartz body with dots in one of the two colors —
    // the "and" makes the two-color relationship explicit.
    const [adj1, adj2, pat] = namePieces;
    name = `${articleFor(adj1)} ${adj1} and ${adj2} ${pat} Crystal`;
  }

  // Pattern-overlay color (dots / veins) — match whichever adjective
  // sits next to the pattern word in the name so the read scans
  // naturally: in "An Onyx and Sage Dotted Crystal" the dots should
  // be Sage-colored because Sage is the word adjacent to "Dotted".
  // Without this, the dots tracked the gradient's c2 slot, which is
  // mapped to "secondary" (not necessarily the second-named adjective
  // — orderModifiers reorders by English adjective rank), so the
  // dot color often pointed at the wrong word in the name.
  let patternColor;
  if (!secondaryAdj) {
    patternColor = primary.color;
  } else {
    const adjacentAdj = namePieces[1];
    if (adjacentAdj === primaryAdj) patternColor = primary.color;
    else if (adjacentAdj === secondaryAdj) patternColor = secondary.color;
    else patternColor = secondary.color;  // defensive fallback
  }

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

  // Description ties together: the pattern (visual texture word),
  // the primary family voice, and the secondary family voice if
  // present. Pattern verb (e.g. "swirling into", "veined with") is
  // the connector so the user reads the texture as the relationship
  // between the two colors. Single-color crystals get the pattern's
  // solo phrase instead — describes how the one color sits in the
  // stone rather than how two colors meet.
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lc  = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  // Defensive defaults. If a family slipped past the adjective/voice
  // tables (e.g. data drift, an unusual family name), fall back to a
  // neutral string instead of letting "undefined" surface in the
  // description text. Same for patternVerb / patternSoloVoice in
  // case the pattern table changes shape.
  const _primaryAdj   = primaryAdj   || "Quiet";
  const _primaryVoice = primaryVoice || "soft light pooling";
  const _secondaryVoice = secondaryVoice || null;
  const _patternVerb  = patternVerb  || "traced with";
  const _patternSolo  = patternSoloVoice || "a single color held in suspension";
  let description;
  if (isFaint) {
    if (_secondaryVoice) {
      description = `Faintly ${_primaryAdj} — ${lc(_primaryVoice)}, ${_patternVerb} traces of ${lc(_secondaryVoice)} just stirring.`;
    } else {
      description = `Faintly ${_primaryAdj} — ${lc(_primaryVoice)}, still gathering.`;
    }
  } else if (_secondaryVoice) {
    description = cap(`${_primaryVoice}, ${_patternVerb} ${lc(_secondaryVoice)}.`);
  } else {
    // Pattern's solo phrase + the primary voice. Reads as the
    // pattern describing how the one color inhabits the stone.
    description = cap(`${_patternSolo} — ${lc(_primaryVoice)}.`);
  }

  // "With faint X" trailing mention — surfaces an onboarding-
  // declared family the user hasn't actually brewed toward yet.
  // Only fires on real-data crystals (faint crystals already lead
  // with the unmet intent). Effects are searched first since mood
  // is the dominant signal in onboarding.
  let trailing = null;
  if (!isFaint) {
    const seen = new Set();
    if (primaryAxis === "effect") seen.add(`e:${primary.family}`);
    else                          seen.add(`f:${primary.family}`);
    if (secondary) {
      if (secondaryAxis === "effect") seen.add(`e:${secondary.family}`);
      else                            seen.add(`f:${secondary.family}`);
    }
    for (const f of profileFams.effects) {
      if (!seen.has(`e:${f}`)) {
        trailing = {
          adj: EFFECT_ADJECTIVES[f], voice: EFFECT_VOICE[f],
          color: CRYSTAL_EFFECT_COLORS[f],
        };
        break;
      }
    }
    if (!trailing) {
      for (const f of profileFams.flavors) {
        if (!seen.has(`f:${f}`)) {
          trailing = {
            adj: FLAVOR_ADJECTIVES[f], voice: FLAVOR_VOICE[f],
            color: CRYSTAL_FLAVOR_COLORS[f],
          };
          break;
        }
      }
    }
    if (trailing && trailing.adj) {
      // Trailing mention reads as a hint of unrealized color
      // visible at the crystal's edge. The adjective alone reads
      // vague ("a faint Sky"); pairing it with "glow" anchors it
      // as a color noun ("a faint Sky-glow") that fits the
      // in-stone luminous register. The adj guard prevents an
      // "undefined-glow" from appearing if the trailing record
      // was assembled with a missing adjective.
      description = description.replace(/\.$/, "")
        + `, with a faint ${trailing.adj}-glow just stirring at the edge.`;
    }
  }

  // Gradient: primary on the warm/saturated side, secondary on the
  // cool/light side. If only one family lands, blend toward a soft
  // ash so the crystal still has internal motion.
  const gradient = secondary
    ? [primary.color, secondary.color]
    : [primary.color, "#C9BFA6"];

  // Two-layer glow, each tied to a phrase in the description so
  // the visual reads as a one-to-one map of the words:
  //
  //   inner glow → the "drifting into X" / "with a hint of X"
  //                clause — i.e. the secondary current trend
  //   outer halo → the "with faint X still ahead of you" clause
  //                — i.e. the unmet onboarding intent (forecast)
  //
  // Either can be null when the corresponding clause is absent
  // from the description. The renderer drops the layer cleanly.
  const innerGlowColor = secondary?.color || null;
  const outerGlowColor = trailing?.color || null;

  return {
    name,
    description,
    primary: { ...primary, axis: primaryAxis, adjective: primaryAdj },
    secondary: secondary
      ? { ...secondary, axis: secondaryAxis, adjective: secondaryAdj }
      : null,
    gradient,
    innerGlowColor,
    outerGlowColor,
    pattern: patternWord,
    patternColor,
    families: {
      effect: effectFams.ranked,
      flavor: flavorFams.ranked,
    },
    isNeutral: false,
    isFaint,
  };
}

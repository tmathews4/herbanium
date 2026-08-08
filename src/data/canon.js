/* ──────────────────────────────────────────────────────────────
   data/canon.js — single source of truth for the parent-level
   mood and flavor vocabularies the user picks from directly.

   Every surface where the user taps a chip to express mood or
   flavor pulls from here:

     - SteepScreen (pre-brew current/desired pickers)
     - JournalComposer (coming-in / where-it-left-me bands)
     - LogScreen (anything-else-came-through extras row)
     - OnboardingScreen (what pulls you / flavors you reach for)
     - LibraryScreen + ComposeScreen recipe filters
     - any future capture card

   Detail surfaces — FlavorMap detail toggle, BlendExtractionExplorer
   detail mode, ingredient explorer drill-downs — keep the full
   long-tail vocabulary so the science stays legible. The contract
   is just: when the USER picks, they pick from these parent lists.

   Each chip carries a `family` field that ties the user-facing key
   to the master family hierarchy used by the engine (FAMILY_BY_EFFECT
   and FAMILY_BY_FLAVOR in components/FlavorMap.jsx). Keeping chip
   keys stable (calm/focus/energy/comfort/cooling/digestive/sleepy)
   protects existing saved sessions and seed presets that already
   store these strings; the family field is the link to the master
   register the engine matches against.
   ────────────────────────────────────────────────────────────── */

// 7 parent mood families, in roughly arrival-order (settling first,
// rising in the middle, drifting to rest at the end). Order matches
// the TrackMap mood strip's left-to-right family layout so the chip
// row and the graph below it scan the same direction.
import { CATEGORY_OF_EFFECT, PERCEPTIBLE_EFFECT } from "./families.js";

export const PARENT_MOODS = [
  { key: "calm",      family: "calm",   label: "Calm",      note: "settling, mind-quieting" },
  // soothing, grounding and uplifting became their own families when
  // the effect map was split; before that they were folded into calm
  // and energy. Onboarding offers one option per family, so without
  // these three a user couldn't ask for a register the catalogue now
  // tracks — and the recommender had no signal for them.
  { key: "soothing",  family: "soothing",  label: "Soothing",  note: "bodily ease, gentle support" },
  { key: "grounding", family: "grounding", label: "Grounded",  note: "steadying, settled in yourself" },
  { key: "focus",     family: "focus",  label: "Focus",     note: "clarity, attention" },
  { key: "energy",    family: "energy", label: "Energy",    note: "lift, brightening" },
  { key: "uplifting", family: "uplifting", label: "Uplifting", note: "brightening, without the buzz" },
  // key stays "comfort" — it's what journal entries persist in
  // targetMoods, and there is no migration path (bumping CURRENT_SCHEMA
  // wipes rather than migrates). Only the label moves, to match the
  // strip's family row now that `warm` holds two distinct leaves.
  { key: "comfort",   family: "comfort", label: "Comfort",   note: "warm relaxation, the familiar cup" },
  { key: "cooling",   family: "cool",   label: "Cooling",   note: "felt-temperature cooling" },
  { key: "digestive", family: "digestive", label: "Digestive", note: "after-meal ease" },
  // Added with the `immune` family — see data/families.js. Reaching for
  // echinacea or elder in cold season is a real brewing goal, so it
  // belongs among the targets rather than only in the strip.
  { key: "immune",    family: "immune", label: "Immune",    note: "steadying the body's defences" },
  { key: "sleepy",    family: "sleep",  label: "Sleepy",    note: "drift toward rest" },
];

// Negative / rough-edged states that current-feel pickers add on top
// of the positive parent moods. Never offered as a target — no one
// aspires to feel anxious — so target pickers use PARENT_MOODS only,
// while current-feel pickers concat both.
export const CURRENT_FEEL_EXTRAS = [
  { key: "anxious",   label: "Anxious"   },
  { key: "stressed",  label: "Stressed"  },
  { key: "tired",     label: "Tired"     },
  { key: "restless",  label: "Restless"  },
  { key: "nauseous",  label: "Nauseous"  },
];

// Subset of PARENT_MOODS that reads as a natural pre-cup state.
// Comfort, cooling, and digestive are brewing GOALS — things people
// reach for a tea to GET — not states they show up with ("I feel
// digestive" doesn't parse as something to log before a cup). Target
// pickers still use the full PARENT_MOODS list so blend recipes can
// keep referencing those families.
const CURRENT_FEEL_PARENTS = PARENT_MOODS.filter(m =>
  ["calm", "focus", "energy", "sleepy"].includes(m.key)
);

// Convenience export — what a "right now I feel" chip row offers.
export const CURRENT_MOOD_CHIPS = [...CURRENT_FEEL_PARENTS, ...CURRENT_FEEL_EXTRAS];

// Journal-specific chip pools — MIND only.
//
// Journal entries are about emotional and mental arc. A body register
// doesn't parse as something you reflect on afterwards: "where it left
// me: digestive" isn't a sentence, and you cannot notice your own
// immune response over a cup at all.
//
// This used to be a hand-kept STOMACH_MOOD_KEYS set — digestive,
// nauseous, immune — grown an entry at a time as each new body word
// was added and someone noticed it reading strangely in a picker. That
// set was the mind/body split, discovered piecemeal. Derived now, so a
// body register added later is excluded the day it arrives rather than
// the day someone spots it.
//
// STRICTER than the old list: `soothing` and `cooling` are body
// registers too and used to reach the journal pickers.
const isBodily = (m) => CATEGORY_OF_EFFECT[m.key] === "body";
// `nauseous` is a current-feel extra rather than an effect, so it has
// no category to read. The one thing still named by hand, and the only
// physiological word among the extras.
const NON_MIND_EXTRAS = new Set(["nauseous"]);

export const JOURNAL_PARENT_MOODS = PARENT_MOODS.filter(m => !isBodily(m));

/* WHERE A CUP CAN LEAVE YOU — including somewhere worse.
 *
 * The landed row used JOURNAL_PARENT_MOODS, which is positives only,
 * on the reasoning recorded above CURRENT_FEEL_EXTRAS: "never offered
 * as a target — no one aspires to feel anxious". That reasoning is
 * sound and it is about TARGETS. "Where it left me" is not a target,
 * it is an outcome, and the two got the same list.
 *
 * So the journal could not record the ordinary cases. You come in
 * anxious and leave anxious. What you wrote stirred something up. The
 * cup had more caffeine than you wanted — which is not a hypothetical
 * here, it is a thing this app's own model predicts and warns about,
 * and the journal had no word for the result.
 *
 * A mood log that only accepts improvement isn't a log, it's a
 * scoreboard. Same mind-only cut as the coming-in row, since you don't
 * reflect on digestion afterwards either. */
export const JOURNAL_LANDED_MOOD_CHIPS = [
  ...JOURNAL_PARENT_MOODS,
  ...CURRENT_FEEL_EXTRAS.filter(m => !NON_MIND_EXTRAS.has(m.key)),
];

/* What onboarding may ask you to want.
 *
 * A DIFFERENT CUT FROM THE JOURNAL'S, and the difference is the point.
 * The journal drops every body register, because "where it left me:
 * digestive" isn't a sentence. Onboarding asks what pulls you TO a cup,
 * and wanting something cooling, or something settling after a meal, is
 * an ordinary reason to put the kettle on — those stay.
 *
 * What can't stay is a word for something you are unable to notice.
 * families.js says of immunity that it is "slower and less felt than
 * any other effect here", and canon.js says of the same word that "you
 * cannot notice your own immune response over a cup at all". Offering
 * it as an answer to a felt question invites a report nobody can make,
 * and lands as a health claim one word wide on the first screen of the
 * app.
 *
 * Derived, not filtered by name, so the next unfelt family is excluded
 * the day it is added. */
const PERCEPTIBLE_PARENT_MOODS = PARENT_MOODS
  .filter(m => PERCEPTIBLE_EFFECT[m.key] !== false);

/* WHAT A STRANGER CAN TELL APART.
 *
 * The canon distinguishes calm from soothing from grounding, and energy
 * from uplifting, and it is right to — they are different families with
 * different chemistry and different ingredients behind them. But this
 * is the third screen a person has ever seen, and to someone arriving
 * cold those are two questions, not five. Asked to choose between Calm
 * and Ease, a newcomer isn't making a finer distinction; they're
 * guessing, and a guess is worse signal than a coarse answer.
 *
 * So the card is a cluster and the answer is the whole cluster. Picking
 * Calm records calm AND soothing AND grounding, which is what the
 * person meant — the recommender matches blend moods against this set,
 * so a wider pick matches more of the register they were pointing at,
 * not less precisely.
 *
 * DECLARED, NOT DERIVED, unlike the perceptibility cut above. Which
 * families read as one feeling to a stranger is an editorial judgement
 * about English, and there is nothing in the data to derive it from.
 * The test holds the two properties that CAN be checked: every family
 * appears in exactly one cluster, and no cluster smuggles in a word the
 * perceptibility rule already excluded. */
const DRAW_CLUSTERS = [
  { key: "calm",      label: "Calm",      note: "settling, steadying, unwound",
    covers: ["calm", "soothing", "grounding"] },
  { key: "focus",     label: "Focus",     note: "attention, the clear mind",
    covers: ["focus"] },
  { key: "energy",    label: "Energy",    note: "lift, the spark to begin",
    covers: ["energy", "uplifting"] },
  { key: "comfort",   label: "Comfort",   note: "warmth, the familiar cup",
    covers: ["comfort"] },
  { key: "cooling",   label: "Cooling",   note: "a felt-temperature breath",
    covers: ["cooling"] },
  { key: "digestive", label: "Digestion", note: "fennel, after-supper ease",
    covers: ["digestive"] },
  { key: "sleepy",    label: "Sleep",     note: "the slow slide toward evening",
    covers: ["sleepy"] },
];

export const DRAW_PARENT_MOODS = DRAW_CLUSTERS;

/** Expand the cards a user tapped into the mood keys they meant. */
export const expandDraw = (picked = []) => {
  const chosen = new Set(picked);
  const out = new Set();
  for (const c of DRAW_CLUSTERS) {
    if (chosen.has(c.key)) c.covers.forEach(k => out.add(k));
  }
  return [...out];
};

/* HOW THE SAME WORD IS SAID WHEN IT HAPPENED TO YOU.
 *
 * There are three grammatical roles in this app and, until now, one
 * label set for all of them:
 *
 *   the cup DOES it   — the mood filter, the effect bars. Attributive:
 *                       an uplifting blend, a soothing herb. The labels
 *                       in PARENT_MOODS are written for this and are
 *                       right for it.
 *   you WANT it       — "What pulls you to a cup?". Nouns: calm, focus,
 *                       sleep. That's DRAW_CLUSTERS above.
 *   you FELT it       — "Right now I feel…", "Where it left me", "How
 *                       did it land?". Predicate adjectives, and this
 *                       is the role that had no labels of its own.
 *
 * So the journal read "Right now I feel… Energy" and "Where it left me:
 * Comfort", four of seven wrong in the landed row alone — while sitting
 * beside Anxious, Stressed and Tired, which are adjectives and which
 * made the mismatch louder rather than hiding it.
 *
 * Deliberately partial: only the words that change are listed. Calm,
 * Grounded and Sleepy are already predicate adjectives and pass through
 * untouched, which is also why the old labels read fine often enough
 * for this to survive. */
const FELT_LABEL = {
  focus:     "Focused",
  energy:    "Energised",
  uplifting: "Lifted",
  comfort:   "Comforted",
  soothing:  "Eased",
  cooling:   "Cooled",
  digestive: "Settled",
  grounding: "Grounded",
};

/** Re-label a chip list for a question about what you felt. */
export const feltChips = (chips = []) =>
  chips.map(c => (FELT_LABEL[c.key] ? { ...c, label: FELT_LABEL[c.key] } : c));

/** Every perceptible family, for the test that nothing was dropped. */
export const PERCEPTIBLE_MOOD_KEYS = PERCEPTIBLE_PARENT_MOODS.map(m => m.key);
export const JOURNAL_CURRENT_MOOD_CHIPS = CURRENT_MOOD_CHIPS
  .filter(m => !isBodily(m) && !NON_MIND_EXTRAS.has(m.key));

// 10 parent flavor families, aligned to FAMILY_BY_FLAVOR. Mirrors
// FLAVOR_FAMILY_CHIPS in data/blends.js — re-exported here so callers
// reach for `canon` whether they want moods or flavors and don't
// have to remember which file each lives in.
export { FLAVOR_FAMILY_CHIPS as PARENT_FLAVORS } from "./blends.js";

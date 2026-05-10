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
export const PARENT_MOODS = [
  { key: "calm",      family: "calm",   label: "Calm",      note: "settling, mind-quieting" },
  { key: "focus",     family: "focus",  label: "Focus",     note: "clarity, attention" },
  { key: "energy",    family: "energy", label: "Energy",    note: "lift, brightening" },
  { key: "comfort",   family: "warm",   label: "Comfort",   note: "warmth-of-spirit" },
  { key: "cooling",   family: "cool",   label: "Cooling",   note: "felt-temperature cooling" },
  { key: "digestive", family: "body",   label: "Digestive", note: "after-meal ease" },
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

// Journal-specific chip pools — exclude stomach/digestive moods.
// Cup follow-ups care about digestive register because that's a real
// effect tea has on the body; journal entries are about emotional /
// mental arc, where 'digestive' or 'nauseous' read as physiological
// symptoms rather than felt-states the user is reflecting on. The
// stomach-related keys here are filtered out for both journal pickers
// (Coming-in and Where-it-left-me) so they don't surface as chips.
const STOMACH_MOOD_KEYS = new Set(["digestive", "nauseous"]);
export const JOURNAL_PARENT_MOODS = PARENT_MOODS.filter(m => !STOMACH_MOOD_KEYS.has(m.key));
export const JOURNAL_CURRENT_MOOD_CHIPS = CURRENT_MOOD_CHIPS.filter(m => !STOMACH_MOOD_KEYS.has(m.key));

// 10 parent flavor families, aligned to FAMILY_BY_FLAVOR. Mirrors
// FLAVOR_FAMILY_CHIPS in data/blends.js — re-exported here so callers
// reach for `canon` whether they want moods or flavors and don't
// have to remember which file each lives in.
export { FLAVOR_FAMILY_CHIPS as PARENT_FLAVORS } from "./blends";

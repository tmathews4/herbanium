/* ──────────────────────────────────────────────────────────────
   Herbanium — BLENDS data
   Updated for vocabulary v1 (see docs/vocabulary.md)

   Three exports in this file:
   - BLENDS: curated named blends shown on Library/Compose
   - MOOD_BLENDS: per-mood recipes (used for single mood selection)
   - PAIR_BLENDS: curated mood pairings (e.g., "calm+focus")

   Changes from previous version:
   - calming → calm
   - settling → digestive
   - comfort → soothing
   - lifting → uplifting
   - clear → uplifting (or merged into focus where redundant)
   - bitterness → REMOVED from all effects arrays

   The user-facing MOODS array stays unchanged:
   ["calm", "focus", "energy", "sleepy", "comfort", "settle"]
   These are UI chip labels, distinct from internal effect names.
   ────────────────────────────────────────────────────────────── */

/* ── User-facing mood chips — unchanged ────────────────────── */

const MOODS = ["calm", "focus", "energy", "sleepy", "comfort", "settle"];
const FLAVORS = ["floral", "earthy", "citrus", "spiced", "minty", "fruity", "sweet"];

/* ── Curated named blends ──────────────────────────────────── */

const BLENDS = [
  {
    id: "dusk",
    name: "Dusk Lullaby",
    subtitle: "for wound-down evenings",
    ingredients: [
      { id: "chamomile", g: 2.0 },
      { id: "lavender", g: 0.3 },
      { id: "lemonbalm", g: 1.0 },
    ],
    tempC: 95, timeS: 360, ml: 250,
    mood: "calm", flavor: "floral",
    public: false,
    // was [["calming", 4], ["sleepy", 3]]
    effects: [["calm", 4], ["sleepy", 3]],
  },
  {
    id: "morning",
    name: "Morning Vestment",
    subtitle: "a quiet start with teeth",
    ingredients: [
      { id: "assam", g: 2.0 },
      { id: "ginger", g: 0.5 },
    ],
    tempC: 95, timeS: 240, ml: 250,
    mood: "energy", flavor: "spiced",
    public: true,
    effects: [["energy", 4], ["warming", 4]],
  },
  {
    id: "hearth",
    name: "Hearth & Quiet",
    subtitle: "rainy-afternoon default",
    ingredients: [
      { id: "rooibos", g: 2.0 },
      { id: "rose", g: 0.5 },
    ],
    tempC: 100, timeS: 360, ml: 250,
    mood: "comfort", flavor: "sweet",
    public: false,
    // was [["comfort", 4], ["calming", 2]]
    effects: [["soothing", 4], ["calm", 2]],
  },
  {
    id: "study",
    name: "Scriptorium",
    subtitle: "for the hour before dinner",
    ingredients: [
      { id: "sencha", g: 1.5 },
      { id: "peppermint", g: 0.5 },
    ],
    tempC: 75, timeS: 90, ml: 200,
    mood: "focus", flavor: "minty",
    public: true,
    // was [["focus", 4], ["clear", 3]] — clear → uplifting
    effects: [["focus", 4], ["uplifting", 3]],
  },
  {
    id: "moroccan",
    name: "Moroccan Mint",
    subtitle: "traditional · gunpowder, mint, sugar",
    ingredients: [
      { id: "gunpowder", g: 1.5 },
      { id: "spearmint", g: 1.0 },
    ],
    tempC: 90, timeS: 180, ml: 200,
    mood: "focus", flavor: "minty",
    public: true,
    tradition: "Maghrebi",
    // was [["focus", 3], ["cooling", 3], ["lifting", 3]]
    effects: [["focus", 3], ["cooling", 3], ["uplifting", 3]],
  },
  {
    id: "darj-neat",
    name: "Darjeeling, neat",
    subtitle: "first flush · as it wants to be",
    ingredients: [
      { id: "darjeeling", g: 2.5 },
    ],
    tempC: 85, timeS: 180, ml: 200,
    mood: "focus", flavor: "floral",
    public: true,
    tradition: "Indian / Himalayan",
    // was [["focus", 3], ["lifting", 3]]
    effects: [["focus", 3], ["uplifting", 3]],
  },
  {
    id: "chai",
    name: "Masala Chai",
    subtitle: "traditional · the morning's full house",
    ingredients: [
      { id: "assam", g: 2.0 },
      { id: "ginger", g: 0.3 },
      { id: "cardamom", g: 0.3 },
      { id: "cinnamon", g: 0.3 },
      { id: "cloves", g: 0.1 },
    ],
    tempC: 100, timeS: 300, ml: 250,
    mood: "energy", flavor: "spiced",
    public: true,
    tradition: "South Asian",
    effects: [["energy", 4], ["warming", 5]],
  },
  {
    id: "sencha-properly",
    name: "Sencha, properly",
    subtitle: "a short steep · the Japanese way",
    ingredients: [
      { id: "sencha", g: 3.0 },
    ],
    tempC: 75, timeS: 60, ml: 180,
    mood: "focus", flavor: "grassy",
    public: true,
    tradition: "Japanese",
    // was [["focus", 4], ["lifting", 3]]
    effects: [["focus", 4], ["uplifting", 3]],
  },
];

/* ── Per-mood blend recipes ────────────────────────────────── */

// Used when user selects a single mood. Keys are user-facing
// mood names (calm, focus, etc.); effects inside are internal
// effect names (per vocabulary).

const MOOD_BLENDS = {
  calm: {
    ings: [["chamomile", 1.5], ["lemonbalm", 0.8], ["lavender", 0.2]],
    temp: 95, time: 300,
    // was [["calm", 4], ["sleepy", 2], ["bitterness", 1]] — bitterness removed
    effects: [["calm", 4], ["sleepy", 2]],
  },
  focus: {
    ings: [["sencha", 1.2], ["peppermint", 0.4]],
    temp: 75, time: 90,
    // was [["focus", 4], ["clear", 3], ["bitterness", 2]] — clear→uplifting, bitterness removed
    effects: [["focus", 4], ["uplifting", 3]],
  },
  energy: {
    ings: [["assam", 1.5], ["ginger", 0.3], ["cardamom", 0.2], ["cinnamon", 0.2]],
    temp: 95, time: 240,
    // was [["energy", 4], ["warming", 4], ["bitterness", 2]] — bitterness removed
    effects: [["energy", 4], ["warming", 4]],
  },
  comfort: {
    ings: [["rooibos", 1.8], ["rose", 0.3]],
    temp: 100, time: 360,
    // was [["comfort", 4], ["settling", 3], ["bitterness", 1]] — comfort→soothing, settling→digestive, bitterness removed
    effects: [["soothing", 4], ["digestive", 3]],
  },
  sleepy: {
    ings: [["chamomile", 2.0], ["lavender", 0.4]],
    temp: 100, time: 420,
    // was [["sleepy", 4], ["calm", 4], ["bitterness", 1]] — bitterness removed
    effects: [["sleepy", 4], ["calm", 4]],
  },
  settle: {
    ings: [["lemonbalm", 1.2], ["chamomile", 0.8]],
    temp: 95, time: 300,
    // was [["settling", 4], ["calm", 3], ["bitterness", 1]] — settling→digestive, bitterness removed
    effects: [["digestive", 4], ["calm", 3]],
  },
};

/* ── Curated mood-pair recipes ─────────────────────────────── */

// Key is alphabetical "a+b". Not every pair is curated — uncurated
// pairs fall back to the composition function in the algo module.

const PAIR_BLENDS = {
  "calm+focus": {
    name: "Stillwater Study", subtitle: "alert rest",
    ings: [["lemonbalm", 1.2], ["sencha", 0.5], ["rose", 0.2]],
    temp: 80, time: 180,
    // was [["calm", 3], ["focus", 3], ["bitterness", 1]]
    effects: [["calm", 3], ["focus", 3]],
  },
  "calm+comfort": {
    name: "Evensong", subtitle: "a soft ending",
    ings: [["chamomile", 1.2], ["rooibos", 1.0], ["rose", 0.3]],
    temp: 95, time: 300,
    // was [["calm", 3], ["comfort", 4], ["bitterness", 1]]
    effects: [["calm", 3], ["soothing", 4]],
  },
  "calm+sleepy": {
    name: "Deepening", subtitle: "for very late hours",
    ings: [["chamomile", 2.0], ["passionflower", 0.5], ["lavender", 0.3], ["lemonbalm", 0.4]],
    temp: 100, time: 420,
    // was [["calm", 4], ["sleepy", 4], ["bitterness", 1]]
    effects: [["calm", 4], ["sleepy", 4]],
  },
  "calm+settle": {
    name: "Threshold", subtitle: "arriving home",
    ings: [["lemonbalm", 1.4], ["chamomile", 0.8], ["rose", 0.2]],
    temp: 95, time: 300,
    // was [["calm", 4], ["settling", 4], ["bitterness", 1]]
    effects: [["calm", 4], ["digestive", 4]],
  },
  "energy+focus": {
    name: "First Light", subtitle: "morning, sharpened",
    ings: [["sencha", 1.5], ["assam", 0.6], ["peppermint", 0.3]],
    temp: 80, time: 120,
    // was [["energy", 3], ["focus", 4], ["bitterness", 2]]
    effects: [["energy", 3], ["focus", 4]],
  },
  "comfort+energy": {
    name: "Hearth Kindler", subtitle: "warmth with a spark",
    ings: [["rooibos", 1.2], ["assam", 0.5], ["cinnamon", 0.3], ["cardamom", 0.2]],
    temp: 100, time: 300,
    // was [["energy", 3], ["comfort", 3], ["warming", 4]]
    effects: [["energy", 3], ["soothing", 3], ["warming", 4]],
  },
  "comfort+focus": {
    name: "Long Desk", subtitle: "the afternoon stretch",
    ings: [["rooibos", 1.4], ["peppermint", 0.4], ["sencha", 0.3]],
    temp: 85, time: 180,
    // was [["focus", 3], ["comfort", 3], ["bitterness", 1]]
    effects: [["focus", 3], ["soothing", 3]],
  },
  "comfort+sleepy": {
    name: "Wool & Wick", subtitle: "bundled under covers",
    ings: [["rooibos", 1.0], ["chamomile", 1.0], ["vanilla", 0.2], ["lavender", 0.2]],
    temp: 100, time: 420,
    // was [["sleepy", 3], ["comfort", 4], ["warming", 2]]
    effects: [["sleepy", 3], ["soothing", 4], ["warming", 2]],
  },
  "focus+settle": {
    name: "Clear Channel", subtitle: "unscattered attention",
    ings: [["tulsi", 1.0], ["lemonbalm", 1.0], ["sencha", 0.3]],
    temp: 85, time: 180,
    // was [["focus", 3], ["settling", 3], ["clear", 3]]
    effects: [["focus", 3], ["digestive", 3], ["uplifting", 3]],
  },
  "settle+sleepy": {
    name: "Soft Landing", subtitle: "for unwinding",
    ings: [["chamomile", 1.6], ["lemonbalm", 0.8], ["lavender", 0.3]],
    temp: 100, time: 360,
    // was [["sleepy", 3], ["settling", 4], ["calm", 3]]
    effects: [["sleepy", 3], ["digestive", 4], ["calm", 3]],
  },
  "comfort+settle": {
    name: "Lamplight", subtitle: "a slow return",
    ings: [["rooibos", 1.4], ["lemonbalm", 0.8], ["rose", 0.2]],
    temp: 100, time: 300,
    // was [["settling", 3], ["comfort", 4], ["calm", 2]]
    effects: [["digestive", 3], ["soothing", 4], ["calm", 2]],
  },
  "energy+settle": {
    name: "Steady Footing", subtitle: "a grounded wake-up",
    ings: [["assam", 1.2], ["lemonbalm", 0.6], ["ginger", 0.2]],
    temp: 95, time: 240,
    // was [["energy", 3], ["settling", 3], ["warming", 3]]
    effects: [["energy", 3], ["digestive", 3], ["warming", 3]],
  },
};

/* ── Mood and flavor relationships ─────────────────────────── */

// Moods that work against each other. Selected anyway? We render
// a blend but flag the tension with a gentle note.
const MOOD_CONFLICTS = [
  ["energy", "sleepy"],
  ["focus",  "sleepy"],
];

// Flavor pairs that don't typically play well in a single cup. Won't
// block the user — the app is permissive — but surfaces a soft warning
// when both are selected. Not exhaustive; these are the most reliably-
// fighting ones.
const FLAVOR_CONFLICTS = [
  ["minty",  "spiced"],  // menthol cold vs warming spices cancel each other
  ["earthy", "citrus"],  // bright acid muddies deep grounding notes
];

// Names used when a single mood is selected — each mood has a canonical
// "signature" blend name/subtitle pair.
const MOOD_SINGLE_NAMES = {
  calm:    ["Dusk Lullaby",        "for wound-down evenings"],
  focus:   ["Scriptorium",         "for the hour before dinner"],
  energy:  ["Morning Vestment",    "a quiet start with teeth"],
  comfort: ["Hearth & Quiet",      "rainy-afternoon default"],
  sleepy:  ["Threshold of Sleep",  "for very late nights"],
  settle:  ["The Settling",        "a long exhale"],
};

// Simple complementary-flavor map: each flavor has a short list of
// flavors that pair well as accents. Drives axis-aware candidate
// generation in the blend resolver.
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

export {
  MOODS,
  FLAVORS,
  BLENDS,
  MOOD_BLENDS,
  PAIR_BLENDS,
  MOOD_CONFLICTS,
  FLAVOR_CONFLICTS,
  MOOD_SINGLE_NAMES,
  FLAVOR_COMPLEMENTS,
  MOOD_NEIGHBORS,
};

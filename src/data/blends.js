/* ──────────────────────────────────────────────────────────────
   data/blends.js — blend data (curated, composed, and constraint vocabulary)

   Five related data structures that together define what blends
   exist in the app and how the algorithm composes new ones:

   1. BLENDS — the named, persistent blends shown on Home and in Shelf.
      Have stable ids, can be saved/favorited, carry full metadata
      (name, subtitle, ingredients with weights, temp, time, mood,
      flavor tag, public flag, effects). This is the app's content.

   2. MOOD_BLENDS — per-mood ingredient recipes used as the fallback
      when a user's mood combination has no curated pair blend.
      The composition function reads these and combines/weights.

   3. PAIR_BLENDS — curated recipes for specific two-mood combinations
      that have a clear character (calm+focus → Stillwater Study,
      comfort+energy → Hearth Kindler). Keyed alphabetically.

   4. MOOD_CONFLICTS / FLAVOR_CONFLICTS — pairs that fight each other
      and should surface a soft warning. Deliberately short and
      non-exhaustive; only the most reliably-conflicting ones.

   5. MOOD_SINGLE_NAMES — names + subtitles applied to single-mood
      compositions so the fallback composition output still feels
      named rather than algorithmic.

   When the algorithm work starts in src/algo/, MOOD_CONFLICTS and
   FLAVOR_CONFLICTS will likely migrate there — they're more about
   generation rules than blend content. For now they live here
   alongside the data they constrain.
   ────────────────────────────────────────────────────────────── */

export const BLENDS = [
  {
    id: "dusk",
    name: "Dusk Lullaby",
    subtitle: "for wound evenings",
    ingredients: [
      { id: "chamomile", g: 2.0 },
      { id: "lavender", g: 0.3 },
      { id: "lemonbalm", g: 1.0 },
    ],
    tempC: 95, timeS: 360, ml: 250,
    mood: "calm", flavor: "floral",
    public: false,
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
    effects: [["energy", 4], ["comfort", 4]],
  },
  {
    id: "hearth",
    name: "Hearth & Quiet",
    subtitle: "rainy-afternoon default",
    ingredients: [
      { id: "rooibos", g: 2.0 },
      { id: "cinnamon", g: 0.4 },
    ],
    tempC: 100, timeS: 360, ml: 250,
    mood: "comfort", flavor: "spiced",
    public: false,
    effects: [["comfort", 4], ["calm", 2]],
  },
  {
    id: "study",
    name: "Scriptorium",
    subtitle: "for the hour before dinner",
    ingredients: [
      { id: "sencha", g: 1.5 },
      { id: "jasmine", g: 0.4 },
    ],
    tempC: 78, timeS: 120, ml: 200,
    mood: "focus", flavor: "floral",
    public: true,
    effects: [["focus", 4], ["focus", 3]],
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
    effects: [["focus", 3], ["cooling", 3], ["energy", 3]],
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
    effects: [["focus", 3], ["energy", 3]],
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
    effects: [["energy", 4], ["comfort", 5]],
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
    effects: [["focus", 4], ["energy", 3]],
  },
];

// Per-mood recipes, used for single-select and as the fallback
// ingredient pool for un-curated combinations.
export const MOOD_BLENDS = {
  calm:    { ings: [["chamomile", 1.5], ["lemonbalm", 0.8], ["lavender", 0.2]], temp: 95,  time: 300, effects: [["calm", 4], ["sleepy", 2], ["bitterness", 1]] },
  focus:   { ings: [["sencha", 1.2], ["jasmine", 0.3]],                         temp: 78,  time: 120, effects: [["focus", 4], ["focus", 3], ["bitterness", 2]] },
  energy:  { ings: [["assam", 1.5], ["ginger", 0.3], ["cardamom", 0.2], ["cinnamon", 0.2]], temp: 95,  time: 240, effects: [["energy", 4], ["comfort", 4], ["bitterness", 2]] },
  comfort: { ings: [["rooibos", 1.8], ["cinnamon", 0.3]],                       temp: 100, time: 360, effects: [["comfort", 4], ["settle", 3], ["bitterness", 1]] },
  sleepy:  { ings: [["chamomile", 2.0], ["lavender", 0.4]],                     temp: 100, time: 420, effects: [["sleepy", 4], ["calm", 4], ["bitterness", 1]] },
  settle:  { ings: [["lemonbalm", 1.2], ["chamomile", 0.8]],                    temp: 95,  time: 300, effects: [["settle", 4], ["calm", 3], ["bitterness", 1]] },
};

// Named recipes for the pairings that have a clear traditional character.
// Key is alphabetical "a+b". Not every pair is curated — uncurated pairs
// fall back to the composition function below.
export const PAIR_BLENDS = {
  "calm+focus": {
    name: "Stillwater Study", subtitle: "alert rest",
    ings: [["lemonbalm", 1.2], ["sencha", 0.5], ["rose", 0.2]],
    temp: 80, time: 180,
    effects: [["calm", 3], ["focus", 3], ["bitterness", 1]],
  },
  "calm+comfort": {
    name: "Evensong", subtitle: "a soft ending",
    ings: [["chamomile", 1.2], ["rooibos", 1.0], ["rose", 0.3]],
    temp: 95, time: 300,
    effects: [["calm", 3], ["comfort", 4], ["bitterness", 1]],
  },
  "calm+sleepy": {
    name: "Deepening", subtitle: "for very late hours",
    ings: [["chamomile", 2.0], ["passionflower", 0.5], ["lavender", 0.3], ["lemonbalm", 0.4]],
    temp: 100, time: 420,
    effects: [["calm", 4], ["sleepy", 4], ["bitterness", 1]],
  },
  "calm+settle": {
    name: "Threshold", subtitle: "arriving home",
    ings: [["lemonbalm", 1.4], ["chamomile", 0.8], ["rose", 0.2]],
    temp: 95, time: 300,
    effects: [["calm", 4], ["settle", 4], ["bitterness", 1]],
  },
  "energy+focus": {
    name: "First Light", subtitle: "morning, sharpened",
    ings: [["sencha", 1.5], ["assam", 0.6], ["peppermint", 0.3]],
    temp: 80, time: 120,
    effects: [["energy", 3], ["focus", 4], ["bitterness", 2]],
  },
  "comfort+energy": {
    name: "Hearth Kindler", subtitle: "warmth with a spark",
    ings: [["rooibos", 1.2], ["assam", 0.5], ["cinnamon", 0.3], ["cardamom", 0.2]],
    temp: 100, time: 300,
    effects: [["energy", 3], ["comfort", 3], ["comfort", 4]],
  },
  "comfort+focus": {
    name: "Long Desk", subtitle: "the afternoon stretch",
    ings: [["rooibos", 1.4], ["peppermint", 0.4], ["sencha", 0.3]],
    temp: 85, time: 180,
    effects: [["focus", 3], ["comfort", 3], ["bitterness", 1]],
  },
  "comfort+sleepy": {
    name: "Wool & Wick", subtitle: "bundled under covers",
    ings: [["rooibos", 1.0], ["chamomile", 1.0], ["vanilla", 0.2], ["lavender", 0.2]],
    temp: 100, time: 420,
    effects: [["sleepy", 3], ["comfort", 4], ["comfort", 2]],
  },
  "focus+settle": {
    name: "Clear Channel", subtitle: "unscattered attention",
    ings: [["tulsi", 1.0], ["lemonbalm", 1.0], ["sencha", 0.3]],
    temp: 85, time: 180,
    effects: [["focus", 3], ["settle", 3], ["focus", 3]],
  },
  "settle+sleepy": {
    name: "Soft Landing", subtitle: "for unwinding",
    ings: [["chamomile", 1.6], ["lemonbalm", 0.8], ["lavender", 0.3]],
    temp: 100, time: 360,
    effects: [["sleepy", 3], ["settle", 4], ["calm", 3]],
  },
  "comfort+settle": {
    name: "Lamplight", subtitle: "a slow return",
    ings: [["rooibos", 1.4], ["lemonbalm", 0.8], ["rose", 0.2]],
    temp: 100, time: 300,
    effects: [["settle", 3], ["comfort", 4], ["calm", 2]],
  },
  "energy+settle": {
    name: "Steady Footing", subtitle: "a grounded wake-up",
    ings: [["assam", 1.2], ["lemonbalm", 0.6], ["ginger", 0.2]],
    temp: 95, time: 240,
    effects: [["energy", 3], ["settle", 3], ["comfort", 3]],
  },
};

// Moods that work against each other. Selected anyway? We'll render
// a blend but flag the tension with a gentle note.
export const MOOD_CONFLICTS = [
  ["energy", "sleepy"],
  ["focus",  "sleepy"],
];

// Flavor pairs that don't typically play well in a single cup. Won't block
// the user — the app is permissive — but surfaces a soft warning when both
// are selected. Not exhaustive; these are the most reliably-fighting ones.
export const FLAVOR_CONFLICTS = [
  ["minty",  "spiced"],  // menthol cold vs warming spices cancel each other
  ["earthy", "citrus"],  // bright acid muddies deep grounding notes
];

export const MOOD_SINGLE_NAMES = {
  calm:    ["Dusk Lullaby",        "for wound evenings"],
  focus:   ["Scriptorium",         "for the hour before dinner"],
  energy:  ["Morning Vestment",    "a quiet start with teeth"],
  comfort: ["Hearth & Quiet",      "rainy-afternoon default"],
  sleepy:  ["Threshold of Sleep",  "for very late nights"],
  settle:  ["The Settling",        "a long exhale"],
};


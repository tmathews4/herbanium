/* ──────────────────────────────────────────────────────────────
   Herbanium — BLENDS data

   Vocabulary v1 throughout (see docs/vocabulary.md).
   Catalog: 46 ingredients (Phase 0 + A + B).

   Three blend exports:
   - BLENDS         — curated named blends (traditionals + customs)
   - MOOD_BLENDS    — single-mood recipes used by the resolver
   - PAIR_BLENDS    — curated dual-mood recipes

   Voice on subtitles: apothecary-poet — short, lyrical, one image
   pairing folklore with mechanism. See docs/research/ingredients/*.md
   for the science behind each claim.
   ────────────────────────────────────────────────────────────── */

const MOODS   = ["calm", "focus", "energy", "sleepy", "comfort", "settle"];
const FLAVORS = ["floral", "earthy", "citrus", "spiced", "minty", "fruity", "sweet"];

/* ── Curated named blends ──────────────────────────────────── */

const BLENDS = [
  // ── Traditional teas ────────────────────────────────────────

  {
    id: "chai",
    name: "Masala Chai",
    subtitle: "the morning's full house — piperine joins",
    ingredients: [
      { id: "assam", g: 2.0 },
      { id: "ginger", g: 0.3 },
      { id: "cardamom", g: 0.3 },
      { id: "cinnamon", g: 0.3 },
      { id: "cloves", g: 0.1 },
      { id: "black-pepper", g: 0.05 },
    ],
    tempC: 100, timeS: 300, ml: 250,
    mood: "energy", flavor: "spiced",
    public: true,
    tradition: "South Asian",
    effects: [["energy", 4], ["warming", 5], ["digestive", 3]],
  },
  {
    id: "moroccan",
    name: "Moroccan Mint",
    subtitle: "Maghrebi gunpowder; carvone over menthol",
    ingredients: [
      { id: "gunpowder", g: 1.5 },
      { id: "spearmint", g: 1.0 },
    ],
    tempC: 90, timeS: 180, ml: 200,
    mood: "focus", flavor: "minty",
    public: true,
    tradition: "Maghrebi",
    effects: [["focus", 3], ["cooling", 3], ["uplifting", 3]],
  },
  {
    id: "darj-neat",
    name: "Darjeeling, neat",
    subtitle: "muscatel without milk — the only flush is first",
    ingredients: [
      { id: "darjeeling", g: 2.5 },
    ],
    tempC: 85, timeS: 180, ml: 200,
    mood: "focus", flavor: "floral",
    public: true,
    tradition: "Indian / Himalayan",
    effects: [["uplifting", 4], ["energy", 3], ["focus", 3]],
  },
  {
    id: "sencha-properly",
    name: "Sencha, properly",
    subtitle: "Soen Nagatani's 1738 invention — 75°C, one minute",
    ingredients: [
      { id: "sencha", g: 3.0 },
    ],
    tempC: 75, timeS: 60, ml: 180,
    mood: "focus", flavor: "grassy",
    public: true,
    tradition: "Japanese",
    effects: [["focus", 4], ["energy", 3], ["calm", 3]],
  },
  {
    id: "usucha",
    name: "Usucha",
    subtitle: "thin matcha — Eisai's monastery cup, whisked",
    ingredients: [
      { id: "matcha", g: 2.0 },
    ],
    tempC: 75, timeS: 30, ml: 80,
    mood: "focus", flavor: "umami",
    public: true,
    tradition: "Japanese / chanoyu",
    effects: [["focus", 5], ["energy", 4], ["calm", 3]],
  },
  {
    id: "hojicha-evening",
    name: "Hojicha at Dusk",
    subtitle: "Kyoto roast — caffeine burned off, caramel left",
    ingredients: [
      { id: "hojicha", g: 3.0 },
    ],
    tempC: 100, timeS: 30, ml: 250,
    mood: "comfort", flavor: "roasted",
    public: true,
    tradition: "Japanese",
    effects: [["soothing", 4], ["calm", 3], ["warming", 3]],
  },
  {
    id: "shou-puerh",
    name: "Shou Pu-erh",
    subtitle: "Yunnan road tea — rinse first, then short pours",
    ingredients: [
      { id: "puerh", g: 4.0 },
    ],
    tempC: 100, timeS: 30, ml: 100,
    mood: "comfort", flavor: "earthy",
    public: true,
    tradition: "Chinese / Tibetan",
    effects: [["digestive", 4], ["grounding", 3], ["warming", 3]],
  },
  {
    id: "wuyi-smoke",
    name: "Wuyi Pine Smoke",
    subtitle: "the soldier's tea — guaiacol and syringol",
    ingredients: [
      { id: "lapsang", g: 2.0 },
    ],
    tempC: 100, timeS: 240, ml: 250,
    mood: "energy", flavor: "smoky",
    public: true,
    tradition: "Chinese (Fujian)",
    effects: [["warming", 4], ["grounding", 3], ["energy", 3]],
  },
  {
    id: "cimarron",
    name: "Cimarrón",
    subtitle: "the Guaraní gourd — counterclockwise around the circle",
    ingredients: [
      { id: "yerba-mate", g: 5.0 },
    ],
    tempC: 75, timeS: 180, ml: 200,
    mood: "energy", flavor: "earthy",
    public: true,
    tradition: "South American gaucho",
    effects: [["energy", 4], ["focus", 3], ["uplifting", 2]],
  },

  // ── Apothecary classics (herbal traditionals) ─────────────

  {
    id: "golden-milk",
    name: "Golden Milk",
    subtitle: "haldi doodh — fat and pepper unlock the curcumin",
    ingredients: [
      { id: "turmeric", g: 0.5 },
      { id: "ginger", g: 0.3 },
      { id: "black-pepper", g: 0.05 },
      { id: "cinnamon", g: 0.2 },
      { id: "cardamom", g: 0.2 },
    ],
    tempC: 95, timeS: 600, ml: 250,
    mood: "comfort", flavor: "spiced",
    public: true,
    tradition: "Ayurvedic",
    effects: [["warming", 4], ["soothing", 3], ["digestive", 3]],
  },
  {
    id: "all-heal",
    name: "All-Heal",
    subtitle: "valerian and lemon balm — Cerny's 1999 pairing",
    ingredients: [
      { id: "valerian", g: 1.0 },
      { id: "lemonbalm", g: 1.5 },
      { id: "passionflower", g: 0.5 },
    ],
    tempC: 90, timeS: 600, ml: 250,
    mood: "sleepy", flavor: "earthy",
    public: true,
    tradition: "Western herbal",
    effects: [["sleepy", 5], ["calm", 4], ["soothing", 3]],
  },
  {
    id: "throat-coat",
    name: "Throat Coat",
    subtitle: "licorice the harmonizer; ginger the warmth",
    ingredients: [
      { id: "licorice-root", g: 0.5 },
      { id: "ginger", g: 0.5 },
      { id: "fennel", g: 0.3 },
      { id: "peppermint", g: 0.3 },
    ],
    tempC: 100, timeS: 600, ml: 250,
    mood: "comfort", flavor: "sweet",
    public: true,
    tradition: "Western herbal / TCM",
    effects: [["soothing", 4], ["digestive", 3], ["warming", 2]],
  },
  {
    id: "spring-tonic",
    name: "Spring Tonic",
    subtitle: "Susun Weed's nourishing infusion — long, covered, mineral",
    ingredients: [
      { id: "nettle", g: 1.5 },
      { id: "dandelion-leaf", g: 1.0 },
      { id: "lemonbalm", g: 0.5 },
    ],
    tempC: 100, timeS: 1800, ml: 500,
    mood: "comfort", flavor: "earthy",
    public: true,
    tradition: "European folk / Wise Woman",
    effects: [["soothing", 3], ["digestive", 3], ["grounding", 2]],
  },
  {
    id: "mycelium-morning",
    name: "Mycelium Morning",
    subtitle: "lion's mane for the mind; reishi for the ground",
    ingredients: [
      { id: "lions-mane", g: 1.5 },
      { id: "reishi", g: 0.5 },
      { id: "cinnamon", g: 0.3 },
      { id: "ashwagandha", g: 0.5 },
    ],
    tempC: 100, timeS: 1800, ml: 500,
    mood: "focus", flavor: "earthy",
    public: true,
    tradition: "modern adaptogen",
    effects: [["focus", 3], ["grounding", 4], ["calm", 3]],
  },
  {
    id: "tulsi-doorstep",
    name: "Tulsi at the Doorstep",
    subtitle: "Vishnu's plant — clove-pepper warmth and ursolic acid",
    ingredients: [
      { id: "tulsi", g: 1.5 },
      { id: "cardamom", g: 0.3 },
      { id: "ginger", g: 0.2 },
    ],
    tempC: 95, timeS: 360, ml: 250,
    mood: "focus", flavor: "spiced",
    public: true,
    tradition: "Ayurvedic",
    effects: [["focus", 3], ["calm", 3], ["warming", 2]],
  },
  {
    id: "pissenlit-cafe",
    name: "Pissenlit Café",
    subtitle: "the war-rationed coffee — caramel, bittersweet, root",
    ingredients: [
      { id: "dandelion-root", g: 2.0 },
      { id: "cinnamon", g: 0.3 },
      { id: "cardamom", g: 0.2 },
      { id: "vanilla", g: 0.2 },
    ],
    tempC: 100, timeS: 1200, ml: 250,
    mood: "comfort", flavor: "earthy",
    public: true,
    tradition: "European wartime",
    effects: [["digestive", 3], ["warming", 2], ["grounding", 2]],
  },
  {
    id: "holunder-care",
    name: "Holunder Care",
    subtitle: "elderflower and echinacea — Commission E for the season",
    ingredients: [
      { id: "elderflower", g: 1.0 },
      { id: "echinacea", g: 1.0 },
      { id: "ginger", g: 0.5 },
      { id: "peppermint", g: 0.3 },
    ],
    tempC: 90, timeS: 600, ml: 250,
    mood: "comfort", flavor: "floral",
    public: true,
    tradition: "European cold-care",
    effects: [["soothing", 3], ["warming", 2], ["uplifting", 2]],
  },

  // ── Customs (Herbanium house blends) ──────────────────────

  {
    id: "dusk",
    name: "Dusk Lullaby",
    subtitle: "the apigenin and linalool hour",
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
    subtitle: "British black with a Silk Road bite",
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
    subtitle: "Cederberg red, Persian petals",
    ingredients: [
      { id: "rooibos", g: 2.0 },
      { id: "rose", g: 0.5 },
    ],
    tempC: 100, timeS: 360, ml: 250,
    mood: "comfort", flavor: "sweet",
    public: false,
    effects: [["soothing", 4], ["calm", 2]],
  },
  {
    id: "study",
    name: "Scriptorium",
    subtitle: "L-theanine plus a menthol exhale",
    ingredients: [
      { id: "sencha", g: 1.5 },
      { id: "peppermint", g: 0.5 },
    ],
    tempC: 75, timeS: 90, ml: 200,
    mood: "focus", flavor: "minty",
    public: true,
    effects: [["focus", 4], ["uplifting", 3]],
  },
];

/* ── Per-mood blend recipes ────────────────────────────────── */

// Used when user selects a single mood. Keys are user-facing
// mood names; effects use internal vocabulary v1.

const MOOD_BLENDS = {
  calm: {
    ings: [["chamomile", 1.5], ["lemonbalm", 0.8], ["lavender", 0.2]],
    temp: 95, time: 300,
    effects: [["calm", 4], ["sleepy", 2]],
  },
  focus: {
    ings: [["sencha", 1.2], ["peppermint", 0.4]],
    temp: 75, time: 90,
    effects: [["focus", 4], ["uplifting", 3]],
  },
  energy: {
    ings: [["assam", 1.5], ["ginger", 0.3], ["cardamom", 0.2], ["cinnamon", 0.2]],
    temp: 95, time: 240,
    effects: [["energy", 4], ["warming", 4]],
  },
  comfort: {
    ings: [["rooibos", 1.8], ["rose", 0.3]],
    temp: 100, time: 360,
    effects: [["soothing", 4], ["digestive", 3]],
  },
  sleepy: {
    ings: [["chamomile", 2.0], ["lavender", 0.4]],
    temp: 95, time: 360,
    effects: [["sleepy", 4], ["calm", 4]],
  },
  settle: {
    ings: [["lemonbalm", 1.2], ["fennel", 0.5], ["chamomile", 0.6]],
    temp: 95, time: 300,
    effects: [["digestive", 4], ["calm", 3]],
  },
};

/* ── Curated mood-pair recipes ─────────────────────────────── */

// Key is alphabetical "a+b". Names and subtitles follow the
// apothecary-poet voice — short, one image, one mechanism.

const PAIR_BLENDS = {
  "calm+focus": {
    name: "Stillwater Study",
    subtitle: "L-theanine plus the lemon-balm exhale",
    ings: [["lemonbalm", 1.2], ["sencha", 0.5], ["rose", 0.2]],
    temp: 80, time: 180,
    effects: [["calm", 3], ["focus", 3]],
  },
  "calm+comfort": {
    name: "Evensong",
    subtitle: "honey-floral over Cederberg red",
    ings: [["chamomile", 1.2], ["rooibos", 1.0], ["rose", 0.3]],
    temp: 95, time: 300,
    effects: [["calm", 3], ["soothing", 4]],
  },
  "calm+sleepy": {
    name: "Deepening",
    subtitle: "the GABA stack, gently",
    ings: [["chamomile", 2.0], ["passionflower", 0.5], ["lavender", 0.3], ["lemonbalm", 0.4]],
    temp: 95, time: 420,
    effects: [["calm", 4], ["sleepy", 4]],
  },
  "calm+settle": {
    name: "Threshold",
    subtitle: "lemon balm catches both ends",
    ings: [["lemonbalm", 1.4], ["chamomile", 0.8], ["rose", 0.2]],
    temp: 95, time: 300,
    effects: [["calm", 4], ["digestive", 4]],
  },
  "energy+focus": {
    name: "First Light",
    subtitle: "matcha-caffeine math, two greens deep",
    ings: [["sencha", 1.5], ["assam", 0.6], ["peppermint", 0.3]],
    temp: 80, time: 120,
    effects: [["energy", 3], ["focus", 4]],
  },
  "comfort+energy": {
    name: "Hearth Kindler",
    subtitle: "rooibos and Assam, chai-adjacent",
    ings: [["rooibos", 1.2], ["assam", 0.5], ["cinnamon", 0.3], ["cardamom", 0.2]],
    temp: 100, time: 300,
    effects: [["energy", 3], ["soothing", 3], ["warming", 4]],
  },
  "comfort+focus": {
    name: "Long Desk",
    subtitle: "rooibos with a peppermint exhale",
    ings: [["rooibos", 1.4], ["peppermint", 0.4], ["sencha", 0.3]],
    temp: 85, time: 180,
    effects: [["focus", 3], ["soothing", 3]],
  },
  "comfort+sleepy": {
    name: "Wool & Wick",
    subtitle: "vanilla, lavender, bundled under covers",
    ings: [["rooibos", 1.0], ["chamomile", 1.0], ["vanilla", 0.2], ["lavender", 0.2]],
    temp: 100, time: 360,
    effects: [["sleepy", 3], ["soothing", 4], ["warming", 2]],
  },
  "focus+settle": {
    name: "Clear Channel",
    subtitle: "tulsi at the desk; lemon balm at the gut",
    ings: [["tulsi", 1.0], ["lemonbalm", 1.0], ["sencha", 0.3]],
    temp: 85, time: 180,
    effects: [["focus", 3], ["digestive", 3], ["uplifting", 3]],
  },
  "settle+sleepy": {
    name: "Soft Landing",
    subtitle: "fennel-anethole and apigenin",
    ings: [["chamomile", 1.4], ["fennel", 0.4], ["lemonbalm", 0.8], ["lavender", 0.3]],
    temp: 95, time: 360,
    effects: [["sleepy", 3], ["digestive", 4], ["calm", 3]],
  },
  "comfort+settle": {
    name: "Lamplight",
    subtitle: "rooibos and lemon balm — the slow return",
    ings: [["rooibos", 1.4], ["lemonbalm", 0.8], ["rose", 0.2]],
    temp: 100, time: 300,
    effects: [["digestive", 3], ["soothing", 4], ["calm", 2]],
  },
  "energy+settle": {
    name: "Steady Footing",
    subtitle: "Assam grounded with ginger and lemon balm",
    ings: [["assam", 1.2], ["lemonbalm", 0.6], ["ginger", 0.2]],
    temp: 95, time: 240,
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

// Flavor pairs that don't typically play well in a single cup.
const FLAVOR_CONFLICTS = [
  ["minty",  "spiced"],   // menthol cold vs warming spice cancel
  ["earthy", "citrus"],   // bright acid muddies deep grounding
  ["smoky",  "floral"],   // Lapsang's signature buries delicate aromatics
];

// Names used when a single mood is selected — each mood has a canonical
// "signature" blend name/subtitle pair. Voice: apothecary-poet.
const MOOD_SINGLE_NAMES = {
  calm:    ["Stillwater",          "GABA-tuned, the exhale cluster"],
  focus:   ["Scriptorium",         "L-theanine plus caffeine — alert without jitter"],
  energy:  ["Morning Vestment",    "Silk-Road spice on a British black"],
  comfort: ["Hearth Cup",          "Cederberg red, Persian petals — no leaf to over-steep"],
  sleepy:  ["Threshold of Sleep",  "apigenin and linalool, covered cup"],
  settle:  ["The Settling",        "anethole-GABA, the post-meal cup"],
};

// Dead exports kept for API stability — the live copies live in
// src/algo/compose.js.
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
  umami:   ["grassy", "mineral"],
  woody:   ["earthy", "spiced", "smoky"],
  roasted: ["sweet", "earthy", "spiced"],
};

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

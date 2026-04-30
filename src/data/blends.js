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

const MOODS = [
  "calm", "focus", "energy", "sleepy", "comfort",
  // Effect-axis moods — alongside the original five, the candidate
  // resolver also matches blends whose effects contain them, and
  // MOOD_BLENDS gives each a signature single-mood recipe.
  "soothing", "warming", "cooling", "digestive", "grounding", "uplifting",
];

// Vocabulary for the LogScreen "unexpected moods" prompt — what showed
// up that you weren't aiming for. Distinct from MOODS (the brewing-intent
// vocabulary) because outcomes include things you'd never aim for: a tea
// can leave you anxious, wired, or foggy, and that signal is worth
// capturing. Trimmed of overlap (soothing≈calm, uplifting carries the
// brightness side) and physical-effect moods (warming, cooling, digestive)
// that aren't really unexpected emotional outcomes.
export const UNEXPECTED_MOODS = [
  // positives that can genuinely surprise
  "calm", "focus", "energy", "sleepy", "uplifting",
  // negatives — paradoxical or backfire outcomes
  "anxious", "jittery", "restless", "wired", "foggy", "queasy",
];
const FLAVORS = [
  "floral", "earthy", "citrus", "spiced", "minty", "fruity", "sweet",
  // Sensory-register flavors — blends opt in via blend.flavor, and the
  // candidate resolver also matches when an ingredient lists the flavor.
  "grassy", "smoky", "mineral", "honeyed", "umami", "woody", "roasted",
  // Distinct descriptive registers from the ingredient catalog —
  // each one resolves to a different family of leaves than the
  // categories above.
  "bitter", "tart", "vegetal", "nutty", "savory",
];

// User-facing flavor chip list aligned to the master flavor-family
// hierarchy in components/FlavorMap.jsx (FAMILY_BY_FLAVOR). One chip
// per family so cup logs and journal entries select at the same
// register the strip groups by. Each chip carries `family` (the
// internal id used for engine matching) and `label` (user-facing).
//
// Used by:
//   - LogScreen "anything else come through?" picker
//   - JournalComposer flavor row
//   - OnboardingScreen step 4 (flavors you reach for)
export const FLAVOR_FAMILY_CHIPS = [
  { key: "fruity",  family: "fruit",   label: "Fruity"  },
  { key: "floral",  family: "floral",  label: "Floral"  },
  { key: "sweet",   family: "sweet",   label: "Sweet"   },
  { key: "spiced",  family: "spiced",  label: "Spiced"  },
  { key: "smoky",   family: "smoky",   label: "Smoky"   },
  { key: "earthy",  family: "earthy",  label: "Earthy"  },
  { key: "fresh",   family: "fresh",   label: "Fresh"   },
  { key: "vegetal", family: "vegetal", label: "Vegetal" },
  { key: "marine",  family: "marine",  label: "Marine"  },
  { key: "creamy",  family: "body",    label: "Creamy"  },
];

/* ── Curated named blends ──────────────────────────────────── */

// Optional fields that explain why a recipe doesn't fit a Western steep:
//
//   style: "low-temp"  — Japanese-style cool brew; lead ingredient is a
//                        green tea (sencha/gyokuro/matcha/gunpowder) or
//                        yerba-mate gourd cup. Other ingredients are
//                        accepted as under-extracted on purpose.
//   style: "decoction" — long boil/simmer (15-30 min); usually root- or
//                        mushroom-led. Spices and aromatics steeped this
//                        long are flavoring a broth, not being abused.
//
// Per-ingredient `role` (default "lead"):
//   role: "lead"     — ingredient drives the cup; range warnings apply.
//   role: "accent"   — supporting flavor/aroma at trace weight; warning
//                      math is suppressed (the recipe accepts the stretch).
//   role: "catalyst" — bioavailability adjunct (e.g. black pepper for
//                      turmeric); warning math is suppressed.
//
// The style + role pair lets the warning system stay strict on what the
// curator considers "the leaf that defines this cup" while staying quiet
// on stylistic adjuncts the curator deliberately stretched.

const BLENDS = [
  // ── Traditional teas ────────────────────────────────────────

  {
    id: "chai",  // mood: warming — cinnamon/cardamom/ginger/clove/pepper define the cup more than caffeine
    name: "Masala Chai",
    subtitle: "the morning's full house — black tea, milk, and warm spice",
    ingredients: [
      { id: "assam", g: 2.0 },
      { id: "ginger", g: 0.3 },
      { id: "cardamom", g: 0.3 },
      { id: "cinnamon", g: 0.3 },
      { id: "cloves", g: 0.1 },
      { id: "black-pepper", g: 0.05 },
    ],
    tempC: 100, timeS: 300, ml: 250,
    mood: "warming", flavor: "spiced",
    public: true,
    tradition: "South Asian",
    effects: [["energy", 4], ["warming", 5], ["digestive", 3]],
  },
  {
    id: "moroccan",
    name: "Moroccan Mint",
    subtitle: "Maghrebi gunpowder — sweet, green, the gentler mint",
    ingredients: [
      { id: "gunpowder", g: 1.5 },
      { id: "spearmint", g: 1.0, role: "accent" },
    ],
    tempC: 90, timeS: 180, ml: 200,
    mood: "cooling", flavor: "minty",
    public: true,
    tradition: "Maghrebi",
    style: "low-temp",
    effects: [["focus", 3], ["cooling", 3], ["uplifting", 3]],
  },
  {
    id: "darj-neat",
    name: "Darjeeling, neat",
    subtitle: "first-flush Darjeeling — muscatel grape, neat",
    ingredients: [
      { id: "darjeeling", g: 2.5 },
    ],
    tempC: 85, timeS: 180, ml: 200,
    mood: "uplifting", flavor: "floral",
    public: true,
    tradition: "Indian / Himalayan",
    effects: [["uplifting", 4], ["energy", 3], ["focus", 3]],
  },
  {
    id: "sencha-properly",
    name: "Sencha, properly",
    subtitle: "steamed Japanese green — vegetal, sweet, briefly steeped",
    ingredients: [
      { id: "sencha", g: 3.0 },
    ],
    tempC: 75, timeS: 60, ml: 180,
    mood: "focus", flavor: "grassy",
    public: true,
    tradition: "Japanese",
    style: "low-temp",
    effects: [["focus", 4], ["energy", 3], ["calm", 3]],
  },
  {
    id: "usucha",
    name: "Usucha",
    subtitle: "thin matcha — the everyday cup, whisked",
    ingredients: [
      { id: "matcha", g: 2.0 },
    ],
    tempC: 75, timeS: 30, ml: 80,
    mood: "focus", flavor: "umami",
    public: true,
    tradition: "Japanese / chanoyu",
    style: "low-temp",
    effects: [["focus", 5], ["energy", 4], ["calm", 3]],
  },
  {
    id: "hojicha-evening",
    name: "Hojicha at Dusk",
    subtitle: "Kyoto roast — caramel-toasted green, almost no caffeine",
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
    mood: "digestive", flavor: "earthy",
    public: true,
    tradition: "Chinese / Tibetan",
    effects: [["digestive", 4], ["grounding", 3], ["warming", 3]],
  },
  {
    id: "wuyi-smoke",
    name: "Wuyi Pine Smoke",
    subtitle: "the soldier's tea — dark, smoky, pine-fire deep",
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
    style: "low-temp",
    effects: [["energy", 4], ["focus", 3], ["uplifting", 2]],
  },

  // ── Apothecary classics (herbal traditionals) ─────────────

  {
    id: "golden-milk",
    name: "Golden Milk",
    subtitle: "haldi doodh — golden, warming, gently spiced",
    ingredients: [
      { id: "turmeric", g: 0.5 },
      { id: "ginger", g: 0.3, role: "accent" },
      { id: "black-pepper", g: 0.05, role: "catalyst" },
      { id: "cinnamon", g: 0.2, role: "accent" },
      { id: "cardamom", g: 0.2, role: "accent" },
    ],
    tempC: 95, timeS: 600, ml: 250,
    mood: "warming", flavor: "spiced",
    public: true,
    tradition: "Ayurvedic",
    style: "decoction",
    effects: [["warming", 4], ["soothing", 3], ["digestive", 3]],
  },
  {
    id: "all-heal",
    name: "All-Heal",
    subtitle: "valerian and lemon balm — a classical sleep pairing",
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
      { id: "fennel", g: 0.3, role: "accent" },
      { id: "peppermint", g: 0.3, role: "accent" },
    ],
    tempC: 100, timeS: 600, ml: 250,
    mood: "soothing", flavor: "sweet",
    public: true,
    tradition: "Western herbal / TCM",
    style: "decoction",
    effects: [["soothing", 4], ["digestive", 3], ["warming", 2]],
  },
  {
    id: "spring-tonic",
    name: "Spring Tonic",
    subtitle: "a nourishing infusion — long, covered, mineral",
    ingredients: [
      { id: "nettle", g: 1.5 },
      { id: "dandelion-leaf", g: 1.0 },
      { id: "lemonbalm", g: 0.5, role: "accent" },
    ],
    tempC: 100, timeS: 1800, ml: 500,
    mood: "digestive", flavor: "earthy",
    public: true,
    tradition: "European folk / Wise Woman",
    style: "decoction",
    effects: [["soothing", 3], ["digestive", 3], ["grounding", 2]],
  },
  {
    id: "mycelium-morning",
    name: "Mycelium Morning",
    subtitle: "lion's mane for the mind; reishi for the ground",
    ingredients: [
      { id: "lions-mane", g: 1.5 },
      { id: "reishi", g: 0.5 },
      { id: "cinnamon", g: 0.3, role: "accent" },
      { id: "ashwagandha", g: 0.5 },
    ],
    tempC: 100, timeS: 1800, ml: 500,
    mood: "grounding", flavor: "earthy",
    public: true,
    tradition: "modern adaptogen",
    style: "decoction",
    effects: [["focus", 3], ["grounding", 4], ["calm", 3]],
  },
  {
    id: "tulsi-doorstep",
    name: "Tulsi at the Doorstep",
    subtitle: "the threshold plant — clove-pepper warmth, lifts and steadies",
    ingredients: [
      { id: "tulsi", g: 1.5 },
      { id: "cardamom", g: 0.3 },
      { id: "ginger", g: 0.2 },
    ],
    tempC: 95, timeS: 360, ml: 250,
    mood: "uplifting", flavor: "spiced",
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
      { id: "cinnamon", g: 0.3, role: "accent" },
      { id: "cardamom", g: 0.2, role: "accent" },
      { id: "vanilla", g: 0.2, role: "accent" },
    ],
    tempC: 100, timeS: 1200, ml: 250,
    mood: "digestive", flavor: "earthy",
    public: true,
    tradition: "European wartime",
    style: "decoction",
    effects: [["digestive", 3], ["warming", 2], ["grounding", 2]],
  },
  {
    id: "holunder-care",
    name: "Holunder Care",
    subtitle: "elderflower and echinacea — bright and floral for cold-and-flu season",
    ingredients: [
      { id: "elderflower", g: 1.0 },
      { id: "echinacea", g: 1.0 },
      { id: "ginger", g: 0.5 },
      { id: "peppermint", g: 0.3 },
    ],
    tempC: 90, timeS: 600, ml: 250,
    mood: "soothing", flavor: "floral",
    public: true,
    tradition: "European cold-care",
    effects: [["soothing", 3], ["warming", 2], ["uplifting", 2]],
  },
  {
    id: "earl-grey",
    name: "Earl Grey",
    subtitle: "Calabrian bergamot over Ceylon — the British perfume cup",
    ingredients: [
      { id: "ceylon",   g: 2.2 },
      { id: "bergamot", g: 0.25, role: "accent" },
    ],
    tempC: 95, timeS: 240, ml: 250,
    mood: "uplifting", flavor: "citrus",
    public: true,
    tradition: "British",
    effects: [["uplifting", 4], ["energy", 3], ["focus", 3], ["calm", 2]],
  },
  {
    id: "lady-grey",
    name: "Lady Grey",
    subtitle: "bergamot softened with lemon and orange — Earl Grey, lighter on its feet",
    ingredients: [
      { id: "ceylon",      g: 2.0 },
      { id: "bergamot",    g: 0.15, role: "accent" },
      { id: "lemon-peel",  g: 0.2, role: "accent" },
      { id: "orange-peel", g: 0.2, role: "accent" },
    ],
    tempC: 95, timeS: 240, ml: 250,
    mood: "uplifting", flavor: "citrus",
    public: true,
    tradition: "British (Twinings, 1992)",
    effects: [["uplifting", 4], ["energy", 3], ["focus", 2], ["digestive", 2]],
  },
  {
    id: "russian-lemon",
    name: "Russian Tea with Lemon",
    subtitle: "chai s limonom — strong black tea cut with citrus, samovar-style",
    ingredients: [
      { id: "ceylon",     g: 2.5 },
      { id: "lemon-peel", g: 0.4, role: "accent" },
    ],
    tempC: 100, timeS: 300, ml: 250,
    mood: "energy", flavor: "citrus",
    public: true,
    tradition: "Russian",
    effects: [["energy", 4], ["uplifting", 3], ["digestive", 2], ["warming", 2]],
  },
  {
    id: "canarino",
    name: "Canarino",
    subtitle: "the Italian after-dinner cup — lemon peel, hot water, that's the whole thing",
    ingredients: [
      { id: "lemon-peel", g: 1.5 },
    ],
    tempC: 95, timeS: 240, ml: 200,
    mood: "digestive", flavor: "citrus",
    public: true,
    tradition: "Italian household",
    effects: [["digestive", 3], ["uplifting", 3], ["cooling", 2]],
  },
  {
    id: "apfeltee",
    name: "Apfeltee",
    subtitle: "Bavarian winter staple — dried apple, orange peel, cinnamon, clove",
    ingredients: [
      { id: "dried-apple", g: 1.5 },
      { id: "orange-peel", g: 0.5, role: "accent" },
      { id: "cinnamon",    g: 0.3, role: "accent" },
      { id: "cloves",      g: 0.05, role: "accent" },
    ],
    tempC: 97, timeS: 360, ml: 250,
    mood: "comfort", flavor: "sweet",
    public: true,
    tradition: "Bavarian / Austrian",
    effects: [["comfort", 4], ["warming", 3], ["soothing", 3]],
  },

  // ── Experimental house customs ─────────────────────────────
  // Not traditional — recipes the catalog's chemistry suggests but
  // no culture has codified. Marked `experimental: true` so the UI
  // can surface them with the appropriate "we made this up" badge.

  {
    id: "exp-tom-foolery",
    name: "Tom Foolery",
    subtitle: "The maker's sneaky cup",
    ingredients: [
      { id: "gunpowder", g: 1.5 },
      { id: "spearmint", g: 0.5, role: "accent" },
      { id: "tulsi", g: 0.8, role: "accent" },
    ],
    tempC: 80, timeS: 150, ml: 250,
    mood: "focus", flavor: "minty",
    public: true,
    experimental: true,
    house: true,
    twist: true,
    twistOf: "moroccan",
    twistNote: "A pinch of tulsi turns the gentler-mint cup into a sustained-focus one — same gunpowder-and-mint backbone, holy basil's adaptogen lift riding underneath.",
    style: "low-temp",
    effects: [["focus", 4], ["uplifting", 4], ["calm", 3], ["energy", 2]],
  },

  // ── House experimentals — research-driven combinations the
  //    catalog suggests would taste good and serve a purpose, but
  //    don't appear in any traditional preparation. Each is hand-
  //    tuned to a clean sweet spot. Marked house: true so they
  //    can't be deleted from the Catalogue. ────────────────────

  {
    id: "exp-quiet-apple",
    name: "Quiet Apple",
    subtitle: "chamomile and dried apple — soft sweetness, no sugar required",
    ingredients: [
      { id: "chamomile",   g: 1.2 },
      { id: "dried-apple", g: 0.5 },
      { id: "vanilla",     g: 0.2, role: "accent" },
      { id: "cardamom",    g: 0.2, role: "accent" },
    ],
    tempC: 97, timeS: 360, ml: 250,
    mood: "calm", flavor: "sweet",
    public: true, experimental: true, house: true,
    effects: [["calm", 4], ["comfort", 4], ["soothing", 3]],
  },

  {
    id: "exp-mint-fennel-settle",
    name: "Mint & Fennel Settle",
    subtitle: "fennel and mint — the cool cup after a heavy meal",
    ingredients: [
      { id: "peppermint", g: 1.0 },
      { id: "fennel",     g: 0.5 },
      { id: "lemongrass", g: 0.3, role: "accent" },
    ],
    tempC: 97, timeS: 360, ml: 250,
    mood: "digestive", flavor: "minty",
    public: true, experimental: true, house: true,
    effects: [["digestive", 5], ["cooling", 3], ["calm", 2]],
  },

  {
    id: "exp-suns-roots",
    name: "The Sun's Roots",
    subtitle: "golden milk's spice frame — every root warming, milk left at the door",
    ingredients: [
      { id: "turmeric",     g: 0.5 },
      { id: "ginger",       g: 0.5, role: "accent" },
      { id: "cinnamon",     g: 0.3, role: "accent" },
      { id: "black-pepper", g: 0.05, role: "catalyst" },
    ],
    tempC: 100, timeS: 600, ml: 250,
    mood: "warming", flavor: "spiced",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "golden-milk",
    twistNote: "Golden Milk's warming spice profile without the milk fat — keeps the curcumin-piperine pairing intact, lets the cup read sharper and brighter on its own terms.",
    style: "decoction",
    effects: [["warming", 5], ["digestive", 5], ["soothing", 3]],
  },

  {
    id: "exp-crimson-glow",
    name: "Crimson Glow",
    subtitle: "hibiscus ruby with cranberry and red bush — caffeine-free brightness",
    ingredients: [
      { id: "hibiscus",  g: 1.2 },
      { id: "cranberry", g: 0.5 },
      { id: "rooibos",   g: 0.8 },
      { id: "ginger",    g: 0.3, role: "accent" },
    ],
    tempC: 100, timeS: 360, ml: 250,
    mood: "cooling", flavor: "tart",
    public: true, experimental: true, house: true,
    effects: [["cooling", 4], ["uplifting", 3], ["digestive", 3]],
  },

  {
    id: "exp-garden-court",
    name: "Garden Court",
    subtitle: "muscatel Darjeeling with bergamot and rose — Earl Grey, gone botanical",
    ingredients: [
      { id: "darjeeling", g: 1.8 },
      { id: "bergamot",   g: 0.2, role: "accent" },
      { id: "rose",       g: 0.2, role: "accent" },
    ],
    tempC: 90, timeS: 180, ml: 200,
    mood: "uplifting", flavor: "floral",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "earl-grey",
    twistNote: "Earl Grey's perfume on a Darjeeling base instead of Ceylon — muscatel grape meets Calabrian bergamot, with rose lifting the floral side. Drier and brighter than the British classic.",
    effects: [["uplifting", 5], ["focus", 3], ["energy", 3]],
  },

  {
    id: "exp-dawn-petal",
    name: "Dawn Petal",
    subtitle: "Silver-needle white with night-picked jasmine — the lightest cup",
    ingredients: [
      { id: "white",   g: 2.0 },
      { id: "jasmine", g: 0.3, role: "accent" },
    ],
    tempC: 80, timeS: 150, ml: 200,
    mood: "focus", flavor: "floral",
    public: true, experimental: true, house: true,
    style: "low-temp",
    effects: [["focus", 3], ["calm", 3], ["uplifting", 2]],
  },

  {
    id: "exp-steady-state",
    name: "Steady State",
    subtitle: "slow-building calm — a daily cup, not a quick fix",
    ingredients: [
      { id: "ashwagandha", g: 0.7 },
      { id: "cinnamon",    g: 0.3, role: "accent" },
    ],
    tempC: 95, timeS: 600, ml: 250,
    mood: "grounding", flavor: "spiced",
    public: true, experimental: true, house: true,
    style: "decoction",
    effects: [["grounding", 4], ["calm", 3], ["warming", 3]],
  },

  {
    id: "exp-tulsi-mountain",
    name: "Tulsi Mountain",
    subtitle: "Holy basil under cardamom and ginger — the doorstep cup with altitude",
    ingredients: [
      { id: "tulsi",    g: 1.5 },
      { id: "cardamom", g: 0.3, role: "accent" },
      { id: "ginger",   g: 0.3, role: "accent" },
    ],
    tempC: 100, timeS: 360, ml: 250,
    mood: "uplifting", flavor: "spiced",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "tulsi-doorstep",
    twistNote: "Tulsi at the Doorstep with cardamom turned up and a clearer ginger note — pulls the cup toward a brisk-warming register without losing the holy-basil center.",
    effects: [["uplifting", 4], ["focus", 3], ["warming", 3]],
  },

  {
    id: "exp-calabrian-dawn",
    name: "Calabrian Dawn",
    subtitle: "bergamot and lavender over chamomile — Earl Grey's calm without the tea",
    ingredients: [
      { id: "chamomile", g: 1.2 },
      { id: "bergamot",  g: 0.2, role: "accent" },
      { id: "lavender",  g: 0.2, role: "accent" },
    ],
    tempC: 95, timeS: 300, ml: 250,
    mood: "calm", flavor: "floral",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "earl-grey",
    twistNote: "Earl Grey's bergamot register lifted onto a chamomile base — same Calabrian perfume, no caffeine, lavender's linalool layering a deeper calm onto the cup.",
    effects: [["calm", 4], ["uplifting", 3], ["soothing", 3]],
  },

  {
    id: "exp-cranberry-hearth",
    name: "Cranberry Hearth",
    subtitle: "tart cranberry with rose and orange peel — drier than hibiscus alone",
    ingredients: [
      { id: "cranberry",   g: 1.0 },
      { id: "hibiscus",    g: 0.8 },
      { id: "orange-peel", g: 0.3, role: "accent" },
      { id: "rose",        g: 0.2, role: "accent" },
    ],
    tempC: 95, timeS: 300, ml: 250,
    mood: "uplifting", flavor: "tart",
    public: true, experimental: true, house: true,
    effects: [["uplifting", 3], ["cooling", 3], ["digestive", 2]],
  },

  {
    id: "exp-sage-throat",
    name: "Sage & Lemon",
    subtitle: "Mediterranean throat cup — sage, lemon peel, a spoon of honey",
    ingredients: [
      { id: "sage",       g: 0.8 },
      { id: "lemon-peel", g: 0.4, role: "accent" },
      { id: "ginger",     g: 0.2, role: "accent" },
    ],
    tempC: 95, timeS: 300, ml: 250,
    mood: "soothing", flavor: "savory",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "canarino",
    twistNote: "Canarino's lemon-peel framework with sage stepping in — the rosmarinic-acid astringency tightens the throat-coating effect that's the whole point of an Italian after-dinner cup.",
    effects: [["soothing", 3], ["digestive", 3], ["cooling", 2]],
  },

  {
    id: "exp-smoky-grey",
    name: "Smoky Grey",
    subtitle: "Earl Grey over pine smoke — Calabrian bergamot meets Wuyi fire",
    ingredients: [
      { id: "lapsang",  g: 1.5 },
      { id: "ceylon",   g: 0.8, role: "accent" },
      { id: "bergamot", g: 0.2, role: "accent" },
    ],
    tempC: 95, timeS: 240, ml: 250,
    mood: "energy", flavor: "smoky",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "earl-grey",
    twistNote: "Earl Grey's bergamot perfume layered over a smoky pine-smoke base — the lapsang carries the citrus oils unexpectedly well, the way smoke holds a candle's scent.",
    effects: [["energy", 4], ["warming", 4], ["grounding", 3], ["focus", 3]],
  },

  {
    id: "exp-vanilla-chai",
    name: "Vanilla Chai",
    subtitle: "Masala Chai with vanilla — softer pepper, deeper cup",
    ingredients: [
      { id: "assam",    g: 2.0 },
      { id: "ginger",   g: 0.3, role: "accent" },
      { id: "cardamom", g: 0.3, role: "accent" },
      { id: "cinnamon", g: 0.3, role: "accent" },
      { id: "vanilla",  g: 0.2, role: "accent" },
    ],
    tempC: 100, timeS: 240, ml: 250,
    mood: "comfort", flavor: "spiced",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "chai",
    twistNote: "Masala Chai with the pepper dropped and a quiet vanilla pod taking its place — same warming spice spine, sweeter on the finish, friendlier without milk.",
    effects: [["energy", 4], ["warming", 4], ["comfort", 3], ["soothing", 3]],
  },

  {
    id: "exp-honeyed-throat",
    name: "Honeyed Throat",
    subtitle: "Throat Coat with vanilla and apple — softer on the swallow",
    ingredients: [
      { id: "licorice-root", g: 0.4 },
      { id: "ginger",        g: 0.4, role: "accent" },
      { id: "fennel",        g: 0.3, role: "accent" },
      { id: "vanilla",       g: 0.2, role: "accent" },
      { id: "dried-apple",   g: 0.4, role: "accent" },
    ],
    tempC: 100, timeS: 600, ml: 250,
    mood: "soothing", flavor: "sweet",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "throat-coat",
    twistNote: "Throat Coat softened with vanilla and dried apple — the licorice-and-fennel demulcent backbone gains a sweeter, rounder mouthfeel without giving up the throat-coating mechanism.",
    style: "decoction",
    effects: [["soothing", 4], ["digestive", 3], ["comfort", 2]],
  },

  {
    id: "exp-four-thieves",
    name: "Four Thieves",
    subtitle: "sage and rosemary's quieter cousins — the plague-doctor's tea, gentled",
    ingredients: [
      { id: "sage",       g: 0.6 },
      { id: "lemonbalm",  g: 0.6, role: "accent" },
      { id: "lavender",   g: 0.2, role: "accent" },
      { id: "lemon-peel", g: 0.3, role: "accent" },
    ],
    tempC: 95, timeS: 300, ml: 250,
    mood: "focus", flavor: "aromatic",
    public: true, experimental: true, house: true,
    effects: [["focus", 3], ["soothing", 2], ["calm", 2]],
  },

  {
    id: "exp-lemon-ginger-settle",
    name: "Lemon-Ginger Settle",
    subtitle: "the cross-cultural digestive — citrus brightness over warming root",
    ingredients: [
      { id: "lemon-peel", g: 0.8 },
      { id: "ginger",     g: 0.5, role: "accent" },
      { id: "lemongrass", g: 0.5, role: "accent" },
    ],
    tempC: 100, timeS: 240, ml: 250,
    mood: "digestive", flavor: "citrus",
    public: true, experimental: true, house: true,
    twist: true,
    twistOf: "canarino",
    twistNote: "Canarino with ginger and lemongrass riding the citral chain — Italian after-dinner brightness gains a warming root and a longer-lingering aromatic finish.",
    effects: [["digestive", 4], ["warming", 3], ["uplifting", 3]],
  },

  // ── Customs (Herbanium house blends) ──────────────────────


  // ── Sweet-spot customs ────────────────────────────────────
  // Hand-tuned so every lead's preferred temp AND time ranges
  // intersect cleanly. The brewing card opens at the center of the
  // shared window; no warnings should fire on first paint.

  {
    id: "gyokuro-properly",
    name: "Gyokuro, properly",
    subtitle: "Uji's shaded leaves at 55°C — the slowest, sweetest green",
    ingredients: [
      { id: "gyokuro", g: 3.0 },
    ],
    tempC: 55, timeS: 120, ml: 100,
    mood: "focus", flavor: "umami",
    public: true,
    tradition: "Japanese",
    style: "low-temp",
    effects: [["focus", 5], ["calm", 4], ["energy", 3]],
  },
];

/* ── Per-mood blend recipes ────────────────────────────────── */

// Used when user selects a single mood. Keys are user-facing
// mood names; effects use internal vocabulary v1.

const MOOD_BLENDS = {
  calm: {
    ings: [
      { id: "chamomile", g: 1.5 },
      { id: "lemonbalm", g: 0.8, role: "accent" },
      { id: "lavender",  g: 0.2, role: "accent" },
    ],
    temp: 95, time: 300,
    effects: [["calm", 4], ["sleepy", 2]],
  },
  focus: {
    ings: [
      { id: "sencha", g: 1.2 },
      { id: "peppermint", g: 0.4, role: "accent" },
    ],
    temp: 75, time: 90,
    style: "low-temp",
    effects: [["focus", 4], ["uplifting", 3]],
  },
  energy: {
    ings: [
      { id: "assam",    g: 1.5 },
      { id: "ginger",   g: 0.3, role: "accent" },
      { id: "cardamom", g: 0.2, role: "accent" },
      { id: "cinnamon", g: 0.2, role: "accent" },
    ],
    temp: 95, time: 240,
    effects: [["energy", 4], ["warming", 4]],
  },
  comfort: {
    ings: [
      { id: "rooibos", g: 1.8 },
      { id: "rose",    g: 0.3, role: "accent" },
    ],
    temp: 100, time: 360,
    effects: [["soothing", 4], ["digestive", 3]],
  },
  sleepy: {
    ings: [
      { id: "chamomile", g: 2.0 },
      { id: "lavender",  g: 0.3, role: "accent" },
    ],
    temp: 95, time: 330,
    effects: [["sleepy", 4], ["calm", 4]],
  },

  // Effect-axis moods. Each is a single-mood signature recipe; the
  // resolver uses these when the user picks one of the new moods alone.
  soothing: {
    ings: [{ id: "rooibos", g: 1.8 }, { id: "chamomile", g: 0.6 }],
    temp: 100, time: 360,
    effects: [["soothing", 5], ["calm", 3]],
  },
  warming: {
    ings: [
      { id: "ginger", g: 0.5 },
      { id: "cinnamon", g: 0.3, role: "accent" },
      { id: "cardamom", g: 0.2, role: "accent" },
    ],
    temp: 100, time: 420,
    style: "decoction",
    effects: [["warming", 5], ["digestive", 3]],
  },
  cooling: {
    ings: [{ id: "peppermint", g: 1.0 }, { id: "spearmint", g: 0.5 }, { id: "lemongrass", g: 0.5 }],
    temp: 95, time: 300,
    effects: [["cooling", 4], ["digestive", 3], ["uplifting", 2]],
  },
  digestive: {
    ings: [{ id: "fennel", g: 0.8 }, { id: "peppermint", g: 0.5 }, { id: "chamomile", g: 0.5 }],
    temp: 95, time: 360,
    effects: [["digestive", 5], ["calm", 3], ["soothing", 2]],
  },
  grounding: {
    ings: [{ id: "puerh", g: 3.0 }],
    temp: 100, time: 90,
    effects: [["grounding", 4], ["digestive", 3], ["warming", 3]],
  },
  uplifting: {
    ings: [
      { id: "lemongrass", g: 1.2 },
      { id: "lemonbalm",  g: 0.4, role: "accent" },
      { id: "rose",       g: 0.2, role: "accent" },
    ],
    temp: 95, time: 300,
    effects: [["uplifting", 4], ["calm", 3], ["cooling", 2]],
  },
};

/* ── Curated mood-pair recipes ─────────────────────────────── */

// Key is alphabetical "a+b". Names and subtitles follow the
// apothecary-poet voice — short, one image, one mechanism.

const PAIR_BLENDS = {
  "calm+focus": {
    name: "Stillwater Study",
    subtitle: "matcha's quiet alertness with a lemon-balm exhale",
    ings: [
      { id: "lemonbalm", g: 1.2, role: "accent" },
      { id: "sencha", g: 0.5 },
      { id: "rose", g: 0.2, role: "accent" },
    ],
    temp: 80, time: 90,
    style: "low-temp",
    effects: [["calm", 3], ["focus", 3]],
  },
  "calm+comfort": {
    name: "Evensong",
    subtitle: "honey-floral over Cederberg red",
    ings: [
      { id: "chamomile", g: 1.2 },
      { id: "rooibos",   g: 1.0, role: "accent" },
      { id: "rose",      g: 0.3, role: "accent" },
    ],
    temp: 95, time: 300,
    effects: [["calm", 3], ["soothing", 4]],
  },
  "calm+sleepy": {
    name: "Deepening",
    subtitle: "three quiet herbs, no edge",
    ings: [
      { id: "chamomile",     g: 2.0 },
      { id: "passionflower", g: 0.5, role: "accent" },
      { id: "lavender",      g: 0.3, role: "accent" },
      { id: "lemonbalm",     g: 0.4, role: "accent" },
    ],
    temp: 95, time: 360,
    effects: [["calm", 4], ["sleepy", 4]],
  },
  "calm+digestive": {
    name: "Threshold",
    subtitle: "lemon balm catches both ends",
    ings: [
      { id: "chamomile", g: 1.2 },
      { id: "lemonbalm", g: 0.6, role: "accent" },
      { id: "fennel",    g: 0.3, role: "accent" },
      { id: "rose",      g: 0.2, role: "accent" },
    ],
    temp: 95, time: 300,
    effects: [["calm", 4], ["digestive", 4]],
  },
  "energy+focus": {
    name: "First Light",
    subtitle: "two greens deep — bright, vegetal, awake",
    ings: [
      { id: "sencha", g: 1.5 },
      { id: "assam", g: 0.6, role: "accent" },
      { id: "peppermint", g: 0.3, role: "accent" },
    ],
    temp: 80, time: 90,
    style: "low-temp",
    effects: [["energy", 3], ["focus", 4]],
  },
  "comfort+energy": {
    name: "Hearth Kindler",
    subtitle: "rooibos and Assam, chai-adjacent",
    ings: [
      { id: "rooibos",  g: 1.2 },
      { id: "assam",    g: 0.5, role: "accent" },
      { id: "cinnamon", g: 0.3, role: "accent" },
      { id: "cardamom", g: 0.2, role: "accent" },
    ],
    temp: 100, time: 300,
    effects: [["energy", 3], ["soothing", 3], ["warming", 4]],
  },
  "comfort+focus": {
    name: "Long Desk",
    subtitle: "rooibos with a peppermint exhale",
    ings: [
      { id: "rooibos",    g: 1.4 },
      { id: "peppermint", g: 0.4, role: "accent" },
      { id: "sencha",     g: 0.3, role: "accent" },
    ],
    temp: 100, time: 300,
    effects: [["focus", 3], ["soothing", 3]],
  },
  "comfort+sleepy": {
    name: "Wool & Wick",
    subtitle: "vanilla, lavender, bundled under covers",
    ings: [
      { id: "rooibos",   g: 1.0 },
      { id: "chamomile", g: 1.0, role: "accent" },
      { id: "vanilla",   g: 0.2, role: "accent" },
      { id: "lavender",  g: 0.2, role: "accent" },
    ],
    temp: 100, time: 360,
    effects: [["sleepy", 3], ["soothing", 4], ["warming", 2]],
  },
  "focus+digestive": {
    name: "Clear Channel",
    subtitle: "tulsi at the desk; lemon balm at the gut",
    ings: [
      { id: "tulsi",     g: 1.0, role: "accent" },
      { id: "lemonbalm", g: 1.0 },
      { id: "sencha",    g: 0.3, role: "accent" },
    ],
    temp: 90, time: 240,
    effects: [["focus", 3], ["digestive", 3], ["uplifting", 3]],
  },
  "digestive+sleepy": {
    name: "Soft Landing",
    subtitle: "fennel and chamomile — sweet, softly settling",
    ings: [
      { id: "chamomile", g: 1.4 },
      { id: "fennel",    g: 0.4, role: "accent" },
      { id: "lemonbalm", g: 0.5, role: "accent" },
      { id: "lavender",  g: 0.2, role: "accent" },
    ],
    temp: 95, time: 330,
    effects: [["sleepy", 3], ["digestive", 4], ["calm", 3]],
  },
  "comfort+digestive": {
    name: "Lamplight",
    subtitle: "rooibos and lemon balm — the slow return",
    ings: [
      { id: "rooibos",   g: 1.6 },
      { id: "lemonbalm", g: 0.5, role: "accent" },
      { id: "rose",      g: 0.2, role: "accent" },
    ],
    temp: 100, time: 300,
    effects: [["digestive", 3], ["soothing", 4], ["calm", 2]],
  },
  "energy+digestive": {
    name: "Steady Footing",
    subtitle: "Assam grounded with ginger and lemon balm",
    ings: [
      { id: "assam",     g: 1.2 },
      { id: "lemonbalm", g: 0.6, role: "accent" },
      { id: "ginger",    g: 0.2, role: "accent" },
    ],
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
  // Warming and cooling pull opposite directions thermally; the cup
  // would walk both sides, but it's a tension worth flagging.
  ["warming", "cooling"],
  // Grounding is a settled-down register; uplifting is a gentle lift.
  ["grounding", "uplifting"],
  // Energy directly contradicts soothing's quiet-down character.
  ["energy", "soothing"],
];

// Flavor pairs that don't typically play well in a single cup.
const FLAVOR_CONFLICTS = [
  ["minty",  "spiced"],    // menthol cold vs warming spice cancel
  ["earthy", "citrus"],    // bright acid muddies deep grounding
  ["smoky",  "floral"],    // Lapsang's signature buries delicate aromatics
  ["smoky",  "citrus"],    // smoke buries bright/citrus the same way
  ["umami",  "sweet"],     // savory broth and dessert sweet pull apart
  ["roasted", "floral"],   // toasted depth covers delicate florals
  ["bitter", "sweet"],     // direct opposition on the basic-taste axis
  ["bitter", "honeyed"],   // bitter erases honey's gentleness
  ["bitter", "fruity"],    // bitter crushes fruit brightness
  ["tart",   "savory"],    // sharp acid and broth read as a kitchen mistake
  ["tart",   "umami"],     // same — fruit-acid and umami don't braid
  ["nutty",  "tart"],      // nutty depth and acid don't reconcile in a cup
  ["vegetal", "smoky"],    // smoke buries fresh vegetal notes
  ["savory", "fruity"],    // savory broth and fruit pull apart
];

// Per-pair masking strength (0–1). Used by selectionScore in compose.js
// to grade the conflict-aware tiebreaker — bitter and mint mask much
// more aggressively than sweet does, so flat 0.5 across all pairs would
// over-penalize gentle conflicts and under-penalize hard ones. Derived
// from the literature review in docs/masking.md (Drewnowski 2001 on
// bitter dominance, Eccles 1994 on TRPM8 cold sensation, and the
// general phenol-adsorption work that underwrites smoky's persistence).
//
// Symmetric: the higher-masking partner sets the value for the pair.
// Pairs not listed default to 0.5 (matches the previous behavior).
const FLAVOR_MASK_STRENGTH = {
  "bitter|sweet":     0.85,
  "bitter|honeyed":   0.85,
  "bitter|fruity":    0.85,
  "minty|spiced":     0.85,  // menthol's TRPM8 hijack overrides palate
  "smoky|floral":     0.85,  // phenol adsorption is near-total over delicate volatiles
  "smoky|citrus":     0.85,
  "vegetal|smoky":    0.80,
  "roasted|floral":   0.70,  // Maillard pyrazines bury delicate volatiles, slightly less totally than smoke
  "umami|sweet":      0.40,  // mild — Japanese cooking shows they often complement
  "tart|umami":       0.55,
  "tart|savory":      0.55,
  "nutty|tart":       0.45,
  "earthy|citrus":    0.55,
  "savory|fruity":    0.50,
};

// Per-pair masking strength for moods (0–1). Energy/sleepy and
// focus/sleepy are clinically strong oppositions; warming/cooling
// and grounding/uplifting read as sensational/abstract tensions
// rather than pharmacological cancellations.
const MOOD_MASK_STRENGTH = {
  "energy|sleepy":     0.75,
  "focus|sleepy":      0.75,
  "energy|soothing":   0.55,
  "warming|cooling":   0.40,  // sensational rather than pharmacological
  "grounding|uplifting": 0.40,
};

function maskKey(a, b) {
  return [a, b].sort().join("|");
}

export function flavorMaskStrength(a, b) {
  return FLAVOR_MASK_STRENGTH[maskKey(a, b)] ?? 0.5;
}

export function moodMaskStrength(a, b) {
  return MOOD_MASK_STRENGTH[maskKey(a, b)] ?? 0.5;
}

// Word banks for naming synthesized blends. The synthetic-blend builder
// pulls one word from each selected mood's bank and one from each
// selected flavor's bank, then composes the picks into a name. Roughly
// 10 words per profile, all in the apothecary-poet register.
const MOOD_WORDS = {
  calm:      ["Stillwater", "Hush", "Evensong", "Easeful", "Lull", "Quietude", "Breath", "Soft", "Sigh", "Settled"],
  focus:     ["Scriptorium", "Lucid", "Channel", "Study", "Ledger", "Signal", "Clarity", "Sharpen", "Thread", "Compass"],
  energy:    ["Dawn", "Kindling", "Spark", "Current", "Vigor", "Pulse", "Rouse", "Ember", "Wake", "Lift"],
  sleepy:    ["Dusk", "Lullaby", "Drift", "Twilight", "Embers", "Fold", "Slumber", "Veil", "Hush", "Shroud"],
  comfort:   ["Hearth", "Blanket", "Mantle", "Alcove", "Refuge", "Harbor", "Nest", "Well", "Hollow", "Cottage"],
  soothing:  ["Balm", "Salve", "Hush", "Mend", "Lullaby", "Sigh", "Softening", "Calm", "Comfort", "Gentling"],
  warming:   ["Ember", "Hearth", "Kindle", "Blaze", "Glow", "Bask", "Banked", "Warmth", "Sundown", "Mantle"],
  cooling:   ["Shade", "Breeze", "Stream", "Glade", "Frost", "Brisk", "Dew", "Mountain", "Current", "Exhale"],
  digestive: ["Ease", "Flow", "Mend", "Clear", "Gentle", "Harmony", "Smooth", "Anchor", "Repose", "Supper"],
  grounding: ["Anchor", "Root", "Stone", "Foundation", "Depth", "Settled", "Weight", "Hold", "Earth", "Low"],
  uplifting: ["Dawn", "Lift", "Sparkle", "Brighten", "Ascend", "Gleam", "Rise", "Lighten", "Kindle", "Soar"],
};

const FLAVOR_WORDS = {
  floral:  ["Petal", "Blossom", "Garden", "Bouquet", "Perfume", "Attar", "Rosegarden", "Meadow", "Bloom", "Posy"],
  earthy:  ["Loam", "Woodland", "Root", "Moss", "Peat", "Depth", "Hollow", "Undergrowth", "Soil", "Humus"],
  citrus:  ["Zest", "Peel", "Brightness", "Citrine", "Sour", "Sun", "Golden", "Dawn", "Lift", "Lemonwater"],
  spiced:  ["Bazaar", "Caravan", "Kindling", "Ember", "Warmth", "Hearth", "Mantle", "Kettle", "Spice-Road", "Simmer"],
  minty:   ["Breeze", "Cool", "Exhale", "Frost", "Brisk", "Glade", "Moroccan", "Mint", "Fresh", "Peppergrass"],
  fruity:  ["Orchard", "Harvest", "Plum", "Summer", "Ripe", "Basket", "Pluck", "Compote", "Jam", "Blush"],
  sweet:   ["Honey", "Cordial", "Treacle", "Amber", "Comfort", "Syrup", "Harvest", "Comb", "Gild", "Candied"],
  grassy:  ["Meadow", "Lawn", "Field", "Vernal", "Blade", "Paddock", "Fresh-Cut", "Sprout", "Dawn", "Green"],
  smoky:   ["Campfire", "Ember", "Kiln", "Peat", "Ash", "Char", "Lapsang", "Scotch", "Signal", "Hearth"],
  mineral: ["Stone", "Slate", "Rock", "Spring", "Well", "Salt", "Mountain", "Gravel", "Marble", "Dew"],
  honeyed: ["Amber", "Gold", "Hive", "Comb", "Mead", "Harvest", "Posy", "Mantle", "Gild", "Dewdrop"],
  umami:   ["Brothy", "Savory", "Oceanic", "Marine", "Kelp", "Dashi", "Kombu", "Deep", "Foundation", "Broth"],
  woody:   ["Bough", "Oak", "Cedar", "Plank", "Branch", "Grain", "Pith", "Beam", "Mantle", "Timber"],
  roasted: ["Kiln", "Ember", "Char", "Walnut", "Kettle", "Fired", "Browned", "Toasted", "Hearth", "Kindled"],
  bitter:  ["Gentian", "Draught", "Well", "Depth", "Ledger", "Decoction", "Tincture", "Tinge", "Marrow", "Gravity"],
  tart:    ["Cranberry", "Sharp", "Brightness", "Tang", "Pluck", "Sour", "Edge", "Prick", "Bite", "Citrine"],
  vegetal: ["Garden", "Leaf", "Sprout", "Plot", "Sprig", "Kale", "Fresh", "Green", "Harvest", "Meadow"],
  nutty:   ["Chestnut", "Walnut", "Almond", "Kernel", "Hazel", "Husk", "Harvest", "Hearth", "Kettle", "Pith"],
  savory:  ["Broth", "Kitchen", "Salt", "Kelp", "Dashi", "Kettle", "Saucepan", "Marine", "Mantle", "Hearth"],
};

// Names used when a single mood is selected — each mood has a canonical
// "signature" blend name/subtitle pair. Voice: apothecary-poet.
const MOOD_SINGLE_NAMES = {
  calm:      ["Stillwater",         "GABA-tuned, the exhale cluster"],
  focus:     ["Scriptorium",        "L-theanine plus caffeine — alert without jitter"],
  energy:    ["Morning Vestment",   "Silk-Road spice on a British black"],
  comfort:   ["Hearth Cup",         "Cederberg red, Persian petals — no leaf to over-steep"],
  sleepy:    ["Threshold of Sleep", "apigenin and linalool, covered cup"],
  // Effect-axis signatures
  soothing:  ["The Quiet Hour",     "Cederberg honey under chamomile — nothing to argue with"],
  warming:   ["Hearth Spice",       "ginger and cinnamon, the kettle's slow heat"],
  cooling:   ["Cool Hour",          "peppermint and spearmint, summer's exhale"],
  digestive: ["The Settling",       "anethole-GABA, the post-meal cup of fennel and peppermint"],
  grounding: ["Anchor",             "Yunnan road tea — short pours, deep root"],
  uplifting: ["Brightness",         "citral and Melissa, no caffeine to crash"],
};

/* ── Brewing directions ──────────────────────────────────────
   Tradition-specific steps for curated traditional blends. Keys
   are blend ids. Non-traditional blends fall back to a generic
   templated steep in BlendDetail. Steps are short and ordered.
   ──────────────────────────────────────────────────────────── */
const BLEND_DIRECTIONS = {
  "chai": [
    "Crush the spices lightly with a mortar or the flat of a knife.",
    "Bring 1 cup water to a boil with the spices; simmer 3–4 minutes.",
    "Add black tea; simmer 2 more minutes.",
    "Add 1 cup whole milk and a pinch of sugar; bring just back to a low simmer.",
    "Strain into a warmed cup.",
  ],
  "moroccan": [
    "Rinse the gunpowder: pour 90°C water over the leaves, swirl, and discard within 30 seconds.",
    "Pile a generous handful of fresh spearmint and a heaped spoon of sugar on the leaves.",
    "Pour 90°C water and steep 3 minutes.",
    "Pour from a height into a glass and back into the pot three times to oxygenate before the final pour.",
  ],
  "darj-neat": [
    "Heat water to ~90°C.",
    "Steep 2.5–3 minutes — no longer.",
    "Take it neat. Milk masks the muscatel character.",
  ],
  "sencha-properly": [
    "Heat water to 70°C (let a boiled kettle rest about 4 minutes).",
    "Steep 60 seconds. Pour completely; never leave leaves wet.",
    "Re-steep with slightly hotter water for 30 seconds, then again for a third infusion.",
  ],
  "usucha": [
    "Sift 2g (one heaped chashaku) of matcha through a fine strainer into a warmed bowl.",
    "Add 70ml of 80°C water.",
    "Whisk briskly with a chasen in zigzag M-strokes until a fine foam covers the surface.",
    "Drink in three measured sips.",
  ],
  "hojicha-evening": [
    "Heat water to 90°C.",
    "Steep 30 seconds — short, the leaves are already roasted.",
    "Forgiving of slight over-steep; bitterness is naturally low.",
  ],
  "shou-puerh": [
    "Rinse: pour boiling water over the leaf and discard immediately to wake it.",
    "Steep 90 seconds for the first proper infusion.",
    "Re-steep 5 or more times, adding ~30 seconds to each round.",
  ],
  "wuyi-smoke": [
    "Heat water to a full boil.",
    "Steep 3–4 minutes.",
    "Best in a heavy mug — neat, or with a splash of milk if the smoke is too forward.",
  ],
  "cimarron": [
    "Fill a gourd 2/3 with yerba; tilt to keep dry leaf piled on one side.",
    "Pour cool water (~75°C) onto the dry slope; insert a bombilla into the wet trough.",
    "Sip until empty, refill with water for the next round (cebada), and pass clockwise around the circle.",
  ],
  "golden-milk": [
    "Whisk 1 tsp turmeric, ½ tsp ginger powder, and a pinch of black pepper into 1 cup milk.",
    "Simmer gently for 5 minutes until aromatic.",
    "Sweeten with honey off the heat — heat destroys honey's enzymes.",
  ],
  "all-heal": [
    "Heat water to ~95°C.",
    "Pour over the herbs; cover the cup or pot to trap the volatile aromatics.",
    "Steep covered for 8–10 minutes.",
  ],
  "throat-coat": [
    "Bring water just below boiling.",
    "Pour over and cover — the mucilage in slippery elm and marshmallow needs a long covered steep.",
    "Steep 8 minutes. Sip warm; the mouth-coating effect is the point.",
  ],
  "spring-tonic": [
    "Heat water to 95°C.",
    "Pour over the bitter herbs; cover and steep 8–10 minutes.",
    "Drink 20 minutes before a meal to prime digestion.",
  ],
  "mycelium-morning": [
    "Simmer the mushroom blend gently in 1 cup water for 15–30 minutes.",
    "Strain; the broth keeps overnight in the fridge.",
    "Stir into hot water, milk, or fresh coffee. Daily use is the tradition — one cup won't tell you much.",
  ],
  "tulsi-doorstep": [
    "Bring water to ~95°C.",
    "Pour over fresh or dried tulsi; cover to trap aromatics.",
    "Steep 6 minutes.",
  ],
  "pissenlit-cafe": [
    "Roast the dandelion root pieces in a dry pan or 180°C oven until fragrant and dark.",
    "Simmer the roasted root in water for 10 minutes — this one wants the boil.",
    "Strain. Add milk for a café-au-lait register if you want it.",
  ],
  "holunder-care": [
    "Heat water just to boiling.",
    "Pour over the elderflowers and cover immediately — the volatiles escape fast.",
    "Steep covered for 8 minutes.",
    "Drink warm at the first sign of a cold.",
  ],
  "gyokuro-properly": [
    "Heat water to 50°C — warm, well below a sip-temp coffee.",
    "Use 4g leaf in a small kyusu with only 60ml of water.",
    "Steep 90–120 seconds.",
    "Pour completely, last drop included. Re-steep three or more times with progressively hotter water.",
  ],

  // ── House experimentals — the maker's curated steps ────────
  "exp-tom-foolery": [
    "Heat water to 80°C — let a boiled kettle rest about 2 minutes.",
    "Pour over the gunpowder, spearmint, and tulsi.",
    "Steep 2½ minutes — short, the leaves are pellets and unfurl fast.",
    "Pour completely; re-steep with slightly hotter water for 60 seconds.",
  ],
  "exp-quiet-apple": [
    "Heat water just under boiling (~95°C).",
    "Pour over the chamomile, vanilla, and cardamom; cover the cup or pot.",
    "Steep covered for 6 minutes — apigenin extracts slowly, and the cover keeps the cardamom aromatics in.",
    "Strain. Take warm before bed.",
  ],
  "exp-mint-fennel-settle": [
    "Bruise the fennel seeds lightly with the flat of a knife to release anethole.",
    "Pour 95°C water over the peppermint, fennel, and lemongrass; cover.",
    "Steep covered for 6 minutes.",
    "Drink after a heavy meal — the cooling exhale is the cue that it's working.",
  ],
  "exp-suns-roots": [
    "Combine turmeric, ginger, cinnamon, and a pinch of cracked black pepper in a small pot with 1 cup water.",
    "Bring to a simmer and decoct gently for 10 minutes — the slow heat is what extracts curcumin into water.",
    "Strain into a warm mug. The black pepper raises curcumin's bioavailability — don't skip it.",
    "Sweeten with honey off the heat if you'd like.",
  ],
  "exp-crimson-glow": [
    "Bring water to a full boil.",
    "Pour over the hibiscus, rooibos, and ginger.",
    "Steep 7 minutes — both the calyx and the red bush are forgiving of long steeps.",
    "Strain. Drink hot, or pour over ice for a ruby-red cooler.",
  ],
  "exp-garden-court": [
    "Heat water to 90°C.",
    "Pour over the darjeeling and rose petals.",
    "Steep 4 minutes — long enough for muscatel notes, short enough not to bitter the rose.",
    "Take it neat. Milk masks the floral lift.",
  ],
  "exp-dawn-petal": [
    "Heat water to 80°C — silver-needle white scorches above 85°C.",
    "Pour over the white tea and jasmine.",
    "Steep 2½ minutes; the jasmine releases quickly, the white needs gentle warmth.",
    "Pour completely. Re-steep two or three times — the cup deepens with each round.",
  ],
  "exp-steady-state": [
    "Bring water to a low simmer with the ashwagandha and cinnamon.",
    "Simmer covered for 10 minutes — withanolides are fat-soluble, and the long heat coaxes them out.",
    "Strain into a warmed mug. Daily use is the tradition; one cup won't tell you much.",
    "A splash of milk smooths the musty note if it's too forward.",
  ],
  "exp-tulsi-mountain": [
    "Bring water just to a boil.",
    "Pour over the tulsi, cardamom, and ginger; cover to keep the volatile aromatics.",
    "Steep covered for 7 minutes.",
    "Strain. The clove-pepper warmth and ginger's heat read like a doorstep cup with altitude.",
  ],
};

// Per-blend source attributions — listed at the bottom of a blend's
// page when the preparation, brew window, or pairing is drawn from a
// specific named source. Removed from subtitles and preparation copy
// so the user-facing language stays evocative; the credit lives in
// its proper place at the foot of the page.
const BLEND_SOURCES = {
  "sencha-properly": [
    "Soen Nagatani's 1738 sencha-steaming method — the Japanese green-tea innovation that displaced earlier pan-fired styles.",
  ],
  "usucha": [
    "Eisai (12th c.), the traveler-scholar who introduced whisked powdered green tea (matcha) from China to Japan.",
  ],
  "all-heal": [
    "Cerny A, Schmid K. 1999. Tolerability and efficacy of a valerian/lemon balm fixed-combination preparation in healthy volunteers. Fitoterapia 70:221–228.",
  ],
  "spring-tonic": [
    "Susun Weed's Wise Woman tradition — the long, covered, four-hour infusion approach to mineral-rich herbal nourishment.",
  ],
};

// At-the-table accents — kitchen additions that aren't part of the
// brewed-leaf recipe but show up in the preparation: milk, sugar,
// honey, lemon. Surface as a quiet italic hint on BlendDetail so the
// user has a packing list, without polluting the herbal catalog with
// pantry staples.
const BLEND_TABLE_ACCENTS = {
  "chai":              ["milk", "sugar"],
  "moroccan":          ["sugar"],
  "golden-milk":       ["milk", "honey"],
  "mycelium-morning":  ["milk (optional)"],
  "wuyi-smoke":        ["milk (optional)"],
  "pissenlit-cafe":    ["milk (optional)"],
  "exp-suns-roots":    ["honey (optional)"],
  "exp-steady-state":  ["milk (optional)"],
};

export {
  MOODS,
  FLAVORS,
  BLENDS,
  BLEND_DIRECTIONS,
  BLEND_SOURCES,
  BLEND_TABLE_ACCENTS,
  MOOD_BLENDS,
  PAIR_BLENDS,
  MOOD_CONFLICTS,
  FLAVOR_CONFLICTS,
  MOOD_SINGLE_NAMES,
  MOOD_WORDS,
  FLAVOR_WORDS,
};

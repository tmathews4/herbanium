import { hashString } from "../helpers/misc.js";
/* ──────────────────────────────────────────────────────────────
   data/elementalAdjectives.js — random qualifier for earned elementals.

   Every earned elemental gets a name in the form "The {adjective}
   {creature}" where the noun (creature) is fixed for the trigger
   and the adjective is randomly drawn from a pool, deterministic
   per (user, attribute) so the same user always sees the same
   adjective for the same elemental but different users get
   different ones.

   Adjectives are pulled from the element and gemstone pools that
   name the unique creation elemental, so the whole system reads
   as one mythic vocabulary.

   CREATURE_OVERRIDES keeps the mapping from attribute id → creature
   noun. Anything not overridden falls back to the attribute's own
   name with "The " stripped.
   ────────────────────────────────────────────────────────────── */

export const ELEMENT_ADJECTIVES = [
  "Mist", "Dew", "Vapor", "Fog", "Drizzle",
  "Light", "Sunfire", "Ember", "Aurora", "Bloom",
  "Wind", "Sky", "Cloud", "Lightning", "Daybreak",
  "Fire", "Sun", "Stone", "Glare", "Blaze",
  "Earth", "Wood", "Tide", "Meadow", "River",
  "Twilight", "Sunset", "Dusk", "Rain", "Glow",
  "Shadow", "Moon", "Frost", "Smoke", "Midnight",
  "Void", "Nightshade", "Star", "Ash", "Crescent",
  "Storm", "Hush", "Brume", "Cinder", "Bramble",
  // Plant-side element words. Sage joins the existing botanicals
  // (Bramble, Bloom, Meadow) so it can surface as a wild adjective
  // — required for the calm-family crystal name to actually appear
  // in wild rolls biased on calm activity (see data/wildElementals.js
  // and data/moodCrystal.js's CRYSTAL_EFFECT_COLORS / EFFECT_ADJECTIVES).
  "Sage",
];

export const GEM_ADJECTIVES = [
  "Pearl", "Rose-Quartz", "Opal", "Moonstone",
  "Amber", "Topaz", "Citrine", "Sunstone",
  "Garnet", "Ruby", "Carnelian", "Coral",
  "Goldstone", "Mookaite", "Imperial-Topaz", "Beryl", "Honeycalcite",
  "Gold", "Tigereye", "Sandstone",
  "Copper", "Cinnabar", "Jasper", "Bloodstone",
  "Jade", "Aquamarine", "Turquoise", "Emerald",
  "Onyx", "Slate", "Granite", "Obsidian",
  "Smoky-Quartz", "Hematite", "Pyrite", "Coal",
  "Diamond", "Crystal", "Quartz", "Marble", "Agate",
];

const POOLS = {
  element: ELEMENT_ADJECTIVES,
  gem: GEM_ADJECTIVES,
};


// Per-attribute creature override. Only listed where the existing
// attribute name was a deity, an abstract concept, or otherwise not
// strictly a creature/spirit/cryptid. Anything missing falls back to
// the attribute's own name (minus "The "), so existing creature
// names like "The Sparrow", "The Sphinx", "The Phoenix" carry over.
//
// Pool key marks which adjective pool to draw from for that elemental.
export const CREATURE_OVERRIDES = {
  // Lifetime milestones
  "year-walker":              { creature: "Stag",        pool: "element" },
  "decade-of-cups":           { creature: "Lindworm",    pool: "gem" },
  "apothecary-master":        { creature: "Hare",        pool: "element" },
  "polyglot-life":            { creature: "Spider",      pool: "element" },
  "tradition-completionist":  { creature: "Banyan",      pool: "element" },

  // Recent: time-of-day
  "dawn-steeper":             { creature: "Phoenix",     pool: "element" },
  "midnight-pourer":          { creature: "Bat",         pool: "element" },
  "afternoon-constant":       { creature: "Falcon",      pool: "element" },
  "evening-familiar":         { creature: "Cat",         pool: "element" },

  // Recent: seasonal
  "snowqueen":                { creature: "Ermine",      pool: "element" },
  "summer-forager":           { creature: "Faun",        pool: "element" },
  "autumn-hearth":            { creature: "Bear",        pool: "element" },
  "spring-riser":             { creature: "Lark",        pool: "element" },

  // Recent: mood-family
  "soft-hand":                { creature: "Dove",        pool: "element" },
  "restless-one":             { creature: "Hawk",        pool: "element" },
  "hearth-keeper":            { creature: "Marmot",      pool: "element" },
  "sun-chaser":               { creature: "Hummingbird", pool: "element" },
  "convalescent":             { creature: "Tortoise",    pool: "element" },
  "grounded-one":             { creature: "Auroch",      pool: "element" },
  "cooler-headed":            { creature: "Otter",       pool: "element" },
  "the-whitespace":           { creature: "Crane",       pool: "element" },

  // Recent: flavor patterns
  "petal-drinker":            { creature: "Dryad",       pool: "element" },
  "the-mineralist":           { creature: "Gnome",       pool: "gem" },
  "sweet-tooth":              { creature: "Bee",         pool: "gem" },
  "bitter-adept":             { creature: "Mantis",      pool: "element" },
  "smokesworn":               { creature: "Wolf",        pool: "element" },
  "umami-initiate":           { creature: "Tanuki",      pool: "element" },
  "citrus-hand":              { creature: "Oriole",      pool: "element" },
  "spice-hand":               { creature: "Salamander",  pool: "element" },
  "roast-devotee":            { creature: "Pyralis",     pool: "element" },
  "five-tongues-recent":      { creature: "Chimera",     pool: "gem" },

  // Recent: ingredient patterns
  "rose-companion":           { creature: "Beetle",      pool: "gem" },
  "mint-devotee":             { creature: "Frog",        pool: "element" },
  "chamomile-friend":         { creature: "Hedgehog",    pool: "element" },
  "lavender-calm":            { creature: "Moth",        pool: "element" },
  "tea-faithful":             { creature: "Cricket",     pool: "element" },
  "herb-lover":               { creature: "Doe",         pool: "element" },
  "mushroom-whisperer":       { creature: "Hobgoblin",   pool: "element" },
  "adaptogen-initiate":       { creature: "Ent",         pool: "element" },
  "ginger-hand":              { creature: "Salamander",  pool: "element" },

  // Caffeine
  "the-buzzed":               { creature: "Squirrel",    pool: "element" },
  "decaf-devotee":            { creature: "Sloth",       pool: "element" },
  "the-switcher":             { creature: "Magpie",      pool: "element" },

  // Tradition
  "way-of-tea":               { creature: "Crane",       pool: "element" },
  "south-born":               { creature: "Mongoose",    pool: "element" },
  "old-continent":            { creature: "Badger",      pool: "element" },
  "andean-path":              { creature: "Condor",      pool: "element" },
  "chinese-mountain":         { creature: "Tiger",       pool: "element" },

  // Rhythm
  "the-steady":               { creature: "Ox",          pool: "element" },
  "binge-watcher":            { creature: "Hydra",       pool: "gem" },
  "the-loyal":                { creature: "Hound",       pool: "element" },
  "the-wanderer":             { creature: "Pooka",       pool: "element" },

  // Rating
  "the-approver":             { creature: "Robin",       pool: "element" },
  "honest-critic":            { creature: "Jackal",      pool: "element" },
  "steady-marker":            { creature: "Beaver",      pool: "element" },

  // Multi-condition rare
  "morning-mountain":         { creature: "Tianlong",    pool: "gem" },
  "sleepy-bee":               { creature: "Moth",        pool: "element" },
  "post-meal-settler":        { creature: "Tortoise",    pool: "element" },
  "diurnal-pendulum":         { creature: "Bat",         pool: "element" },
  "solstice-soul":            { creature: "Stag",        pool: "gem" },
  "the-twin-cups":            { creature: "Magpie",      pool: "gem" },

  // Lifetime
  "lifelong-steeper":         { creature: "Tortoise",    pool: "gem" },
  "tea-veteran":              { creature: "Heron",       pool: "element" },
  "all-the-flowers":          { creature: "Bee",         pool: "gem" },
  "favorite-five":            { creature: "Otter",       pool: "element" },
  "favorite-twenty":          { creature: "Magpie",      pool: "gem" },

  // Vibe archetypes
  "the-druid":                { creature: "Owl",         pool: "element" },
  "garden-walker":            { creature: "Doe",         pool: "element" },
  "cooling-hand":             { creature: "Heron",       pool: "element" },
  "mountain-scribe":          { creature: "Hare",        pool: "element" },
  "smoke-sage":               { creature: "Raven",       pool: "element" },
  "the-sharpener":            { creature: "Lynx",        pool: "element" },
  "bright-mind":              { creature: "Hummingbird", pool: "element" },
  "sun-sailor":               { creature: "Falcon",      pool: "element" },
  "forge-hand":               { creature: "Boar",        pool: "element" },
  "the-caravan":              { creature: "Camel",       pool: "element" },
  "frost-runner":             { creature: "Lynx",        pool: "element" },
  "the-moonflower":           { creature: "Moth",        pool: "element" },
  "the-lullaby":              { creature: "Owl",         pool: "element" },
  "the-rootbed":              { creature: "Mole",        pool: "element" },
  "hearth-witch":             { creature: "Cat",         pool: "element" },
  "the-honeycake":            { creature: "Bee",         pool: "gem" },
  "the-wood-stove":           { creature: "Bear",        pool: "element" },
  "the-bittersmith":          { creature: "Mantis",      pool: "element" },
  "the-apothecary-self":      { creature: "Crow",        pool: "element" },
  "after-supper":             { creature: "Hare",        pool: "element" },
  "the-specialist":           { creature: "Heron",       pool: "element" },
  "the-single-note":          { creature: "Newt",        pool: "element" },
  "dawn-voyager":             { creature: "Lark",        pool: "element" },
  "lamp-watcher":             { creature: "Moth",        pool: "element" },
  "afternoon-scholar":        { creature: "Cat",         pool: "element" },
  "the-all-hours":            { creature: "Magpie",      pool: "element" },

  // Habit triggers
  "clockwork-cup":            { creature: "Cricket",     pool: "element" },
  "course-corrector":         { creature: "Hare",        pool: "element" },
  "true-believer":            { creature: "Hound",       pool: "element" },
  "weather-vane":             { creature: "Stork",       pool: "element" },
  "day-knowing":              { creature: "Owl",         pool: "element" },
  "versatile-hand":           { creature: "Octopus",     pool: "element" },
  "the-steadier":             { creature: "Ox",          pool: "element" },
  "self-reader":              { creature: "Crow",        pool: "element" },
  "the-recorder":             { creature: "Magpie",      pool: "element" },
  "witching-hour":            { creature: "Bat",         pool: "gem" },
  "unrepeating":              { creature: "Fox",         pool: "element" },
  "weekend-steeper":          { creature: "Otter",       pool: "element" },
  "working-steeper":          { creature: "Beaver",      pool: "element" },
  "long-steeper":             { creature: "Tortoise",    pool: "element" },
  "quick-cup":                { creature: "Hare",        pool: "element" },
  "multi-ingredient-mind":    { creature: "Octopus",     pool: "element" },
  "pure-steeper":             { creature: "Newt",        pool: "element" },
  "daily-practice":           { creature: "Cricket",     pool: "element" },
  "connoisseur":              { creature: "Cat",         pool: "gem" },
  "self-repeater":            { creature: "Ouroboros",   pool: "gem" },

  // Workflow spirits
  "odin":                     { creature: "Wyrm",        pool: "gem" },
  "feng-huang":               { creature: "Phoenix",     pool: "gem" },
  "kitsune":                  { creature: "Fox",         pool: "element" },
  "xuanwu":                   { creature: "Tortoise",    pool: "gem" },
  "hoopoe":                   { creature: "Hoopoe",      pool: "element" },
  "zaratan":                  { creature: "Zaratan",     pool: "gem" },
  "cu-sith":                  { creature: "Hound",       pool: "element" },
  "cetus":                    { creature: "Cetus",       pool: "element" },

  // Data-flow spirits
  "caladrius":                { creature: "Caladrius",   pool: "gem" },
  "bennu":                    { creature: "Bennu",       pool: "gem" },

  // Journal triggers (added below in attributes.js)
  "first-entry":              { creature: "Inkling",     pool: "element" },
  "ten-entries":              { creature: "Scrivener",   pool: "element" },
  "fifty-entries":            { creature: "Annal",       pool: "gem" },
  "first-haiku":              { creature: "Cicada",      pool: "element" },
  "first-limerick":           { creature: "Wagtail",     pool: "element" },
  "five-haiku":               { creature: "Cricket",     pool: "element" },
  "five-limerick":            { creature: "Linnet",      pool: "element" },
  "verse-virtuoso":           { creature: "Octopus",     pool: "gem" },
  "night-owl-scribe":         { creature: "Owl",         pool: "element" },
  "verse-with-note":          { creature: "Margin-Cat",  pool: "element" },
  "journal-streak":           { creature: "Lapwing",     pool: "gem" },
  "morning-scribe":           { creature: "Lark",        pool: "element" },

  // Tab-visit triggers — basic exploration elementals. Creature noun
  // stays fixed per trigger; the random adjective comes from the
  // standard element/gem pools so each user sees their own variant.
  "first-apothecary":         { creature: "Stoat",       pool: "element" },
  "apothecary-regular":       { creature: "Mole",        pool: "element" },
  "first-shelf":              { creature: "Magpie",      pool: "element" },
  "shelf-regular":            { creature: "Squirrel",    pool: "gem" },
  "first-profile":            { creature: "Hare",        pool: "gem" },
  "four-corners":             { creature: "Fox",         pool: "gem" },
};

// Strip a leading "The " from a name. Used to derive a creature
// noun from an attribute's existing display name when no override
// is registered.
function stripThe(name) {
  return (name || "").replace(/^The\s+/i, "").trim();
}

// Wild-elemental creature pool — drawn from when an attribute is
// flagged `random: true`. Both the creature noun AND the adjective
// are randomized for these triggers so the resulting elemental has
// no controlled aspect: a Storm Bear one user, a Pearl Mantis the
// next. Deterministic per (profileSeed, attr.id), so the same user
// keeps the same surprise.
export const RANDOM_CREATURE_POOL = [
  "Wolf", "Hare", "Owl", "Stag", "Otter", "Hawk", "Phoenix",
  "Bee", "Moth", "Cricket", "Salamander", "Crow", "Fox", "Tortoise",
  "Heron", "Lark", "Bat", "Cat", "Squirrel", "Mole", "Bear",
  "Hummingbird", "Magpie", "Robin", "Boar", "Beaver", "Crane",
  "Dove", "Falcon", "Lynx", "Doe", "Hedgehog", "Frog", "Beetle",
  "Spider", "Octopus", "Newt", "Camel", "Stork", "Mongoose",
  "Mantis", "Tanuki", "Tiger", "Hound", "Marmot", "Ermine",
  "Pyralis", "Hobgoblin", "Dryad", "Sprite", "Wisp",
];

// Combined pool used for the adjective on random elementals. Mixes
// element + gem so the variety reads as broad as possible.
export const ALL_ADJECTIVES = [...ELEMENT_ADJECTIVES, ...GEM_ADJECTIVES];

/* ─── Rarity-tiered pools for wild rolls ──────────────────────────
   Wild elementals roll across three rarity tiers so the rare,
   cosmic, or true-mythic adjective+creature combinations feel
   genuinely earned. Probability split: 75% rare, 20% legendary,
   5% mythic. The wild roller picks tier first, then pulls
   adjective + creature from the tier-matched pool below.

   Adjectives:
     RARE_TIER_*  — workmanlike stones, weather, common gems.
                    What "wild elemental" defaults to.
     MYTHIC_TIER_* — celestial, cosmic, fire, precious gems.
                    Reserved for the rarer top-tier rolls.

   Creatures:
     RARE_TIER_CREATURES   — real animals (drawn from existing
                              RANDOM_CREATURE_POOL).
     LEGENDARY_TIER_CREATURES — minor folk-spirits and small fae.
     MYTHIC_TIER_CREATURES — true mythical beasts (drawn from
                              creationTitle.js MYTHICAL pools).
   ──────────────────────────────────────────────────────────────── */

// Default tier — broad, grounded register. The bulk of wild rolls
// land here.
export const RARE_TIER_ADJECTIVES = [
  // Atmospheric / soft
  "Mist", "Dew", "Vapor", "Fog", "Drizzle", "Brume", "Hush", "Cloud",
  "Wind", "Frost", "Smoke", "Cinder", "Ash",
  // Grounded — wood / earth / botanicals
  "Stone", "Wood", "Earth", "Sage", "Bramble", "Meadow", "Tide", "River",
  "Sky", "Sandstone", "Jasper", "Hematite", "Pyrite", "Coal",
  "Slate", "Granite", "Marble", "Agate", "Quartz",
  "Smoky-Quartz",
  // Common gems / semi-precious
  "Pearl", "Onyx", "Opal", "Moonstone", "Aquamarine", "Jade",
  "Turquoise", "Coral", "Carnelian", "Amber", "Citrine", "Topaz",
  "Garnet", "Ruby", "Rose-Quartz", "Cinnabar", "Bloodstone",
  "Copper", "Gold", "Bloom", "Glow",
];

// Top tier — celestial, fire, luminous, the precious or rarely
// mined. Reserved for legendary / mythic rolls.
export const MYTHIC_TIER_ADJECTIVES = [
  // Celestial / cosmic
  "Sun", "Sunfire", "Daybreak", "Sunset", "Lightning", "Storm",
  "Star", "Moon", "Crescent", "Light", "Aurora",
  "Twilight", "Dusk", "Midnight", "Shadow", "Void", "Nightshade",
  // Fire / blaze
  "Blaze", "Fire", "Glare",
  // Precious / rare gems
  "Sunstone", "Diamond", "Imperial-Topaz", "Honeycalcite", "Goldstone",
  "Mookaite", "Beryl", "Tigereye", "Emerald",
];

// Common-tier creatures: real animals. The bulk of wild rolls
// produce one of these. Drawn from RANDOM_CREATURE_POOL above,
// minus the few minor-spirit entries that move up to the next
// tier.
export const RARE_TIER_CREATURES = [
  "Wolf", "Hare", "Owl", "Stag", "Otter", "Hawk",
  "Bee", "Moth", "Cricket", "Salamander", "Crow", "Fox", "Tortoise",
  "Heron", "Lark", "Bat", "Cat", "Squirrel", "Mole", "Bear",
  "Hummingbird", "Magpie", "Robin", "Boar", "Beaver", "Crane",
  "Dove", "Falcon", "Lynx", "Doe", "Hedgehog", "Frog", "Beetle",
  "Spider", "Octopus", "Newt", "Camel", "Stork", "Mongoose",
  "Mantis", "Tanuki", "Tiger", "Hound", "Marmot", "Ermine",
];

// Legendary-tier creatures: small folk-spirits. A step up from
// "real animal" but not yet a great mythic beast.
export const LEGENDARY_TIER_CREATURES = [
  "Phoenix", "Pyralis", "Hobgoblin", "Dryad", "Sprite", "Wisp",
  "Halcyon", "Caladrius", "Jackalope", "Bakeneko", "Salamander",
  "Bicorn", "Bunyip",
];

// Mythic-tier creatures: the great beasts. Drawn from the same
// pool the unique creation title pulls from, so a mythic wild
// roll feels of a piece with the user's signature elemental.
export const MYTHIC_TIER_CREATURES = [
  "Sphinx", "Yale", "Cockatrice", "Pegasus", "Griffon", "Garuda",
  "Eight-Legged Steed", "Hippogriff", "Winged-Steed", "Ouroboros", "Yeti", "Behemoth",
  "Kirin", "Bonnacon", "Sasquatch", "Wyvern", "Bennu", "Catoblepas",
  "Tarasque", "Simurgh", "Hippocampus", "Wyrm", "Manticore",
  "Chimera", "Kelpie", "Cetus", "Knucker", "Cerberus", "Doom-Wolf",
  "Basilisk", "Unicorn", "Amphithere",
];

// Returns the creature noun for an attribute. Pre-resolved
// `attr.creature` first (set by ProfileScreen for random attrs so
// downstream consumers like ElementalArrivalCard don't need a seed),
// then CREATURE_OVERRIDES, then the attribute's own name.
export function creatureFor(attr) {
  if (!attr) return "Spirit";
  if (attr.creature) return attr.creature;
  const ov = CREATURE_OVERRIDES[attr.id];
  if (ov && ov.creature) return ov.creature;
  return stripThe(attr.name) || "Spirit";
}

// Returns the adjective pool key for an attribute. Default: "element".
export function poolFor(attr) {
  if (!attr) return "element";
  const ov = CREATURE_OVERRIDES[attr.id];
  return (ov && ov.pool) || "element";
}

// Pick an adjective from a named pool by hashing the seed.
export function pickAdjective(seed, poolKey = "element") {
  const pool = POOLS[poolKey] || ELEMENT_ADJECTIVES;
  return pool[hashString(String(seed)) % pool.length];
}

// Picks a random creature from the wild pool for a fully-random
// elemental — deterministic per (profileSeed, attr.id) so the same
// user always sees the same rolled creature for the same trigger.
export function pickRandomCreature(attr, profileSeed) {
  const seed = `${profileSeed || "anon"}|creature|${attr?.id || ""}`;
  return RANDOM_CREATURE_POOL[hashString(String(seed)) % RANDOM_CREATURE_POOL.length];
}

// Per-attribute fixed adjective. When set, the creature is rolled
// at random from the wild pool (the inverse of CREATURE_OVERRIDES,
// which fixes the creature and randomizes the adjective). This
// gives some elementals a thematic adjective signature with a
// per-user creature surprise — half-controlled, half-not — so
// each user's elementals reads with mixed schemas.
export const ADJECTIVE_OVERRIDES = {
  // Time-of-day & seasonal triggers feel naturally adjective-led.
  "dawn-steeper":     "Daybreak",
  "midnight-pourer":  "Midnight",
  "afternoon-constant": "Sun",
  "evening-familiar": "Twilight",
  "snowqueen":        "Frost",
  "summer-forager":   "Bloom",
  "autumn-hearth":    "Ember",
  "spring-riser":     "Meadow",
  // Mood / flavor anchors with an obvious thematic word.
  "smokesworn":       "Smoke",
  "the-mineralist":   "Stone",
  "the-whitespace":   "Hush",
  "ginger-hand":      "Cinder",
  // Multi-condition rares that benefit from a thematic tag.
  "morning-mountain": "Daybreak",
  "solstice-soul":    "Star",
  "witching-hour":    "Midnight",
};

// Deterministic seeded shuffle (Fisher-Yates with a linear
// congruential RNG). Returns a fresh array; input is not mutated.
function shuffleSeeded(arr, seed) {
  const out = [...arr];
  let h = hashString(String(seed)) | 0;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────
   buildElementalNaming(attrs, profileSeed)

   Pre-computes a per-user naming map for a list of attributes.
   Replaces the previous per-attr `hash mod poolSize` approach with
   a per-user *permutation* so that:
     - The first poolSize attrs in any pool are guaranteed unique
       adjectives (or creatures, for the random-creature schemas).
     - Subsequent attrs cycle through the permutation again, so
       the worst-case duplicates are minimized and well-spread.

   Three schemas, in priority order:
     A) attr.random === true       → both adjective AND creature
        random; both drawn from a per-user permutation of the
        combined adjective pool / wild creature pool.
     B) ADJECTIVE_OVERRIDES[id]    → adjective fixed; creature is
        rolled from a per-user permutation of the wild pool.
     C) default                    → creature fixed via
        CREATURE_OVERRIDES (or attr.name fallback); adjective is
        drawn from a per-user permutation of the appropriate
        element/gem pool.

   Returns a Map: attr.id → { adjective, creature, displayName,
   adjectivePoolKey }.
   ────────────────────────────────────────────────────────────── */
export function buildElementalNaming(attrs, profileSeed) {
  const seed = profileSeed || "anon";
  const out = new Map();

  // Group attrs into the three buckets above with stable ordering
  // (sorted by id) so each user gets the same permutation slot for
  // the same attr id.
  const byElement = [];
  const byGem     = [];
  const byAllAdj  = [];   // schema A (random) — uses combined pool
  const fixedAdj  = [];   // schema B — adjective fixed, creature random
  const allRandom = [];   // schema A — both random

  attrs.forEach(attr => {
    if (!attr || !attr.id) return;
    if (attr.random) {
      allRandom.push(attr);
      byAllAdj.push(attr);
    } else if (ADJECTIVE_OVERRIDES[attr.id]) {
      fixedAdj.push(attr);
    } else {
      const poolKey = poolFor(attr);
      if (poolKey === "gem") byGem.push(attr);
      else                   byElement.push(attr);
    }
  });
  byElement.sort((a, b) => a.id.localeCompare(b.id));
  byGem    .sort((a, b) => a.id.localeCompare(b.id));
  byAllAdj .sort((a, b) => a.id.localeCompare(b.id));
  allRandom.sort((a, b) => a.id.localeCompare(b.id));
  fixedAdj .sort((a, b) => a.id.localeCompare(b.id));

  const elementPerm = shuffleSeeded(ELEMENT_ADJECTIVES, `${seed}|elementAdj`);
  const gemPerm     = shuffleSeeded(GEM_ADJECTIVES,     `${seed}|gemAdj`);
  const allAdjPerm  = shuffleSeeded(ALL_ADJECTIVES,     `${seed}|allAdj`);
  const wildPerm    = shuffleSeeded(RANDOM_CREATURE_POOL, `${seed}|wildCreature`);
  const wildPermAlt = shuffleSeeded(RANDOM_CREATURE_POOL, `${seed}|wildCreature|alt`);

  // Default schema C — fixed creature, permuted adjective.
  byElement.forEach((attr, i) => {
    out.set(attr.id, {
      adjective: elementPerm[i % elementPerm.length],
      creature:  creatureFor(attr),
    });
  });
  byGem.forEach((attr, i) => {
    out.set(attr.id, {
      adjective: gemPerm[i % gemPerm.length],
      creature:  creatureFor(attr),
    });
  });

  // Schema A — both random. Draw adjective from combined pool,
  // creature from wild pool. Two independent permutations means a
  // user gets unique adjectives and unique creatures within their
  // first ~50 random attrs.
  allRandom.forEach((attr, i) => {
    out.set(attr.id, {
      adjective: allAdjPerm[i % allAdjPerm.length],
      creature:  wildPerm[i % wildPerm.length],
    });
  });

  // Schema B — fixed adjective, random creature from wild pool.
  fixedAdj.forEach((attr, i) => {
    out.set(attr.id, {
      adjective: ADJECTIVE_OVERRIDES[attr.id],
      creature:  wildPermAlt[i % wildPermAlt.length],
    });
  });

  return out;
}

// Compose the user-facing display name for an elemental:
// "The {randomAdjective} {creatureNoun}". Deterministic per
// (profileSeed, attr.id) so the same user keeps the same name for
// the same elemental but different users get different prefixes.
//
// For attributes flagged `random: true`, both the adjective and the
// creature noun come from random pools — no controlled aspect.
export function getElementalDisplayName(attr, profileSeed) {
  if (!attr) return "";
  const creature = attr.random
    ? pickRandomCreature(attr, profileSeed)
    : creatureFor(attr);
  const seed = `${profileSeed || "anon"}|${attr.id || ""}`;
  const adj = attr.random
    ? ALL_ADJECTIVES[hashString(seed) % ALL_ADJECTIVES.length]
    : pickAdjective(seed, poolFor(attr));
  return `The ${adj} ${creature}`;
}

// Returns just the random adjective for an attribute (the same one
// used in getElementalDisplayName), useful when other code needs to
// compose something with the adjective separately.
export function getElementalAdjective(attr, profileSeed) {
  if (!attr) return "";
  const seed = `${profileSeed || "anon"}|${attr.id || ""}`;
  if (attr.random) return ALL_ADJECTIVES[hashString(seed) % ALL_ADJECTIVES.length];
  return pickAdjective(seed, poolFor(attr));
}

// Atmospheric one-liner per adjective — keyed by the same pools
// used to name elementals. Prepended to each elemental's stock
// description so a user's personal variant ("The Storm Wolf") gets
// a quick line of flavor unique to that adjective ("Coat charged
// with cloud.") before the standard creature description.
const ADJECTIVE_FLAVOR = {
  // Element pool
  Mist:        "Veiled in soft fog at the meadow's edge.",
  Dew:         "Beaded in early-morning light.",
  Vapor:       "Trailing a curl of warm steam.",
  Fog:         "Half-lost in low cloud.",
  Drizzle:     "Coat damp from a slow rain.",
  Light:       "Pale-edged where the shadow ends.",
  Sunfire:     "Warm-eyed, sun-touched.",
  Ember:       "Coal-warm at the heart.",
  Aurora:      "Trailing pale ribbons of color.",
  Bloom:       "Garlanded in fresh blossom.",
  Wind:        "Riding the open air.",
  Sky:         "Drawn from the blue overhead.",
  Cloud:       "Soft-edged, slow-moving.",
  Lightning:   "A flash crackles past.",
  Daybreak:    "Brightening the still hour.",
  Fire:        "Coat shot through with warm light.",
  Sun:         "Standing in clear noon light.",
  Stone:       "Steady as the old hill.",
  Glare:       "Bright-eyed, hard to look at.",
  Blaze:       "Marked by a quick fire.",
  Earth:       "Smelling of warm soil.",
  Wood:        "Bark-skinned and patient.",
  Tide:        "Moves with the slow water.",
  Meadow:      "Stepping through tall grass.",
  River:       "Trailing river-smell.",
  Twilight:    "At home in the lowering light.",
  Sunset:      "Edged in orange and rust.",
  Dusk:        "Slipping in at the blue hour.",
  Rain:        "Wet from a passing shower.",
  Glow:        "Faintly luminous in the dim.",
  Shadow:      "Half in shadow, half in light.",
  Moon:        "Silvered by the moon.",
  Frost:       "Breath visible in the cold.",
  Smoke:       "Trailing a thread of smoke.",
  Midnight:    "Walking out of the late dark.",
  Void:        "Stepping in from open dark.",
  Nightshade:  "Berry-dark, quiet.",
  Star:        "A small light at the brow.",
  Ash:         "Pale grey, soft underfoot.",
  Crescent:    "Crescent-marked at the temple.",
  Storm:       "Coat charged with cloud.",
  Hush:        "Steps softer than sound.",
  Brume:       "Wreathed in low mist.",
  Cinder:      "Coal-edges still warm.",
  Bramble:     "Barbed and patient.",
  // Gem pool
  Pearl:           "Smooth and pale at the edges.",
  "Rose-Quartz":   "Pink-flushed, gentle.",
  Opal:            "Iridescent in the right light.",
  Moonstone:       "Cool, milk-glow at the temple.",
  Amber:           "Coat the color of trapped sunlight.",
  Topaz:           "Honey-gold in the eye.",
  Citrine:         "Bright-yellow, lemon-sharp.",
  Sunstone:        "A warm coppery flicker.",
  Garnet:          "Deep-red, ember-bright.",
  Ruby:            "Marked with deep red.",
  Carnelian:       "Fire-orange at the heart.",
  Coral:           "Sea-pink, branching.",
  Goldstone:       "Flecked with shimmering gold sparks.",
  Mookaite:        "Banded ochre and rust, ancient stone.",
  "Imperial-Topaz": "Sun-bright, the warmest yellow gem.",
  Beryl:           "Honey-amber, lit from within.",
  Honeycalcite:    "Translucent gold, slow as syrup.",
  Gold:            "Edged in soft metal-light.",
  Tigereye:        "Striped gold and brown.",
  Sandstone:       "Coat the color of warm rock.",
  Copper:          "Sun-burnished, warm.",
  Cinnabar:        "Vermilion-red, watchful.",
  Jasper:          "Streaked dark and warm.",
  Bloodstone:      "Green flecked with red.",
  Jade:            "Soft green at the eye.",
  Aquamarine:      "Pale blue-green like clear water.",
  Turquoise:       "Sky-blue, faintly veined.",
  Emerald:         "Deep-green at the heart of the wood.",
  Onyx:            "Black-polished, watchful.",
  Slate:           "Grey, even, weather-worn.",
  Granite:         "Speckled grey, immovable.",
  Obsidian:        "Black-glassed, sharp.",
  "Smoky-Quartz":  "Smoke-grey, half-clear.",
  Hematite:        "Iron-dark, heavy.",
  Pyrite:          "Catching false-gold light.",
  Coal:            "Soot-marked from the fire.",
  Diamond:         "Hard-edged, refracting.",
  Crystal:         "Clear-cut, light bending past.",
  Quartz:          "Cloud-clear at the heart.",
  Marble:          "Veined white and grey.",
  Agate:           "Banded in soft layers.",
};

const FLAVOR_FALLBACK = "Marked by something unsaid.";

// Returns the atmospheric one-liner for an adjective.
export function flavorLineFor(adjective) {
  return ADJECTIVE_FLAVOR[adjective] || FLAVOR_FALLBACK;
}

// Compose the user-facing description for an elemental: prepends a
// short flavor line keyed to the adjective so each user's variant
// gets unique character before the shared body of the desc.
export function getElementalDisplayDesc(attr, profileSeed) {
  if (!attr) return "";
  const adj = getElementalAdjective(attr, profileSeed);
  const flavor = flavorLineFor(adj);
  const base = (attr.desc || "").trim();
  if (!base) return flavor;
  return `${flavor} ${base}`;
}

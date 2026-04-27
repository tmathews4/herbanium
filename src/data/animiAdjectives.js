/* ──────────────────────────────────────────────────────────────
   data/animiAdjectives.js — random qualifier for earned animis.

   Every earned animi gets a name in the form "The {adjective}
   {creature}" where the noun (creature) is fixed for the trigger
   and the adjective is randomly drawn from a pool, deterministic
   per (user, attribute) so the same user always sees the same
   adjective for the same animi but different users get different
   ones.

   Adjectives are pulled from the same elemental and gemstone pools
   that name the unique creation animi, so the whole system reads
   as one mythic vocabulary.

   CREATURE_OVERRIDES keeps the mapping from attribute id → creature
   noun. Anything not overridden falls back to the attribute's own
   name with "The " stripped.
   ────────────────────────────────────────────────────────────── */

const ELEMENT_ADJECTIVES = [
  "Mist", "Dew", "Vapor", "Fog", "Drizzle",
  "Light", "Sunfire", "Ember", "Aurora", "Bloom",
  "Wind", "Sky", "Cloud", "Lightning", "Daybreak",
  "Fire", "Sun", "Stone", "Glare", "Blaze",
  "Earth", "Wood", "Tide", "Meadow", "River",
  "Twilight", "Sunset", "Dusk", "Rain", "Glow",
  "Shadow", "Moon", "Frost", "Smoke", "Midnight",
  "Void", "Nightshade", "Star", "Ash", "Crescent",
  "Storm", "Hush", "Brume", "Cinder", "Bramble",
];

const GEM_ADJECTIVES = [
  "Pearl", "Rose-Quartz", "Opal", "Moonstone",
  "Amber", "Topaz", "Citrine", "Sunstone",
  "Garnet", "Ruby", "Carnelian", "Coral",
  "Heliodor", "Gold", "Tigereye", "Sandstone",
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

function hash(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Per-attribute creature override. Only listed where the existing
// attribute name was a deity, an abstract concept, or otherwise not
// strictly a creature/spirit/cryptid. Anything missing falls back to
// the attribute's own name (minus "The "), so existing creature
// names like "The Sparrow", "The Sphinx", "The Phoenix" carry over.
//
// Pool key marks which adjective pool to draw from for that animi.
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

// Returns the creature noun for an attribute. Override first, fall
// back to the existing name.
export function creatureFor(attr) {
  if (!attr) return "Spirit";
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
  return pool[hash(String(seed)) % pool.length];
}

// Compose the user-facing display name for an animi:
// "The {randomAdjective} {creatureNoun}". Deterministic per
// (profileSeed, attr.id) so the same user keeps the same name for
// the same animi but different users get different prefixes.
export function getAnimiDisplayName(attr, profileSeed) {
  if (!attr) return "";
  const creature = creatureFor(attr);
  const pool = poolFor(attr);
  const seed = `${profileSeed || "anon"}|${attr.id || ""}`;
  const adj = pickAdjective(seed, pool);
  return `The ${adj} ${creature}`;
}

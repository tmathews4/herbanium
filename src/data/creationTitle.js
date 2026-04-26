/* ──────────────────────────────────────────────────────────────
   data/creationTitle.js — generate the user's unique creation title.

   Format: "The [Element] [Gem] [Creature]"

   - Element: from the hour the profile was created, pick within a
     time-window pool. Hash-driven so users created at the same time
     get variety.
   - Gem: from the user's flavor picks (or a neutral pool if none).
   - Creature: from the user's mood picks (or flavor fallback).

   The title is generated once at onboarding and stored on profile.title
   so it never shifts. The function below is also safe to call on the
   fly for legacy profiles missing the field.
   ────────────────────────────────────────────────────────────── */

// Cheap deterministic hash — stable across reloads and platforms.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const pick = (arr, seed) => arr[hash(seed) % arr.length];

// Element pools by 3-hour windows of the day. Each window has its own
// flavor of mythic vocabulary so the element feels tied to the time.
const ELEMENT_POOLS = {
  // pre-dawn (2-5)
  predawn:   ["Dream", "Mist", "Crystal", "Whisper", "Quiet"],
  // dawn (5-8)
  dawn:      ["Light", "Sunfire", "Ember", "Aurora", "Bloom"],
  // morning (8-11)
  morning:   ["Wind", "Sky", "Cloud", "Lightning", "Lark"],
  // midday (11-14)
  midday:    ["Fire", "Sun", "Stone", "Iron", "Forge"],
  // afternoon (14-17)
  afternoon: ["Earth", "Wood", "Tide", "Bronze", "River"],
  // evening (17-20)
  evening:   ["Twilight", "Amber", "Copper", "Rain", "Hearth"],
  // night (20-23)
  night:     ["Shadow", "Moon", "Frost", "Smoke", "Velvet"],
  // late-night (23-2)
  latenight: ["Void", "Nightshade", "Star", "Ash", "Owlfall"],
};

function elementWindow(hour) {
  if (hour >= 2  && hour <  5)  return "predawn";
  if (hour >= 5  && hour <  8)  return "dawn";
  if (hour >= 8  && hour < 11)  return "morning";
  if (hour >= 11 && hour < 14)  return "midday";
  if (hour >= 14 && hour < 17)  return "afternoon";
  if (hour >= 17 && hour < 20)  return "evening";
  if (hour >= 20 && hour < 23)  return "night";
  return "latenight";
}

// Gem / material pool per flavor family. If user picked multiple
// flavors, hash picks one flavor first, then a gem from its pool.
const GEMS_BY_FLAVOR = {
  floral:  ["Pearl", "Rose-Quartz", "Opal", "Moonstone"],
  citrus:  ["Amber", "Topaz", "Citrine", "Sunstone"],
  fruity:  ["Garnet", "Ruby", "Carnelian", "Coral"],
  sweet:   ["Honey", "Gold", "Tigereye", "Sandstone"],
  spiced:  ["Copper", "Cinnabar", "Jasper", "Bloodstone"],
  minty:   ["Jade", "Aquamarine", "Turquoise", "Emerald"],
  earthy:  ["Onyx", "Slate", "Granite", "Obsidian"],
  smoky:   ["Smoky-Quartz", "Hematite", "Pyrite", "Coal"],
  // Fallback when no flavor was picked at onboarding.
  _none:   ["Diamond", "Crystal", "Pearl", "Quartz", "Marble", "Bone"],
};

// Creature pool per mood family. Hash picks within the user's chosen
// mood's pool. Fallback to flavor-based creatures when no moods picked.
const CREATURES_BY_MOOD = {
  calm:      ["Heron", "Dove", "Doe", "Owl"],
  focus:     ["Fox", "Falcon", "Cat", "Mantis"],
  energy:    ["Tiger", "Hawk", "Stag", "Wolf"],
  sleepy:    ["Bear", "Otter", "Sloth", "Mole"],
  comfort:   ["Bear", "Beaver", "Hedgehog", "Marmot"],
  digestive: ["Tortoise", "Crane", "Goat", "Ox"],
};

const CREATURES_BY_FLAVOR = {
  floral:  ["Stag", "Doe", "Crane", "Lark"],
  citrus:  ["Lark", "Robin", "Hummingbird", "Oriole"],
  fruity:  ["Robin", "Otter", "Squirrel", "Bee"],
  sweet:   ["Bee", "Hummingbird", "Fawn", "Mouse"],
  spiced:  ["Tiger", "Phoenix", "Salamander", "Boar"],
  minty:   ["Fox", "Hare", "Trout", "Otter"],
  earthy:  ["Bear", "Mole", "Badger", "Bull"],
  smoky:   ["Wolf", "Raven", "Lynx", "Falcon"],
  _none:   ["Heron", "Stag", "Wolf", "Owl", "Hare", "Fox"],
};

export function generateCreationTitle(profile) {
  if (!profile) return null;
  const createdAt = profile.createdAt || Date.now();
  const seedBase = `${profile.name || "friend"}|${createdAt}`;
  const hour = new Date(createdAt).getHours();

  // Element — time-window pool, hash for variety within window.
  const ePool = ELEMENT_POOLS[elementWindow(hour)] || ELEMENT_POOLS.midday;
  const element = pick(ePool, seedBase + "|element");

  // Gem — pick a flavor first (if any), then a gem from its pool.
  const flavors = profile.flavors || [];
  let gem;
  if (flavors.length > 0) {
    const f = flavors[hash(seedBase + "|flavorPick") % flavors.length];
    const pool = GEMS_BY_FLAVOR[f] || GEMS_BY_FLAVOR._none;
    gem = pick(pool, seedBase + "|gem");
  } else {
    gem = pick(GEMS_BY_FLAVOR._none, seedBase + "|gem");
  }

  // Creature — pick a mood first (if any), then a creature. Fallback
  // to flavor-derived creatures when no moods were chosen at onboarding.
  const moods = profile.draw || [];
  let creature;
  if (moods.length > 0) {
    const m = moods[hash(seedBase + "|moodPick") % moods.length];
    const pool = CREATURES_BY_MOOD[m] || CREATURES_BY_FLAVOR._none;
    creature = pick(pool, seedBase + "|creature");
  } else if (flavors.length > 0) {
    const f = flavors[hash(seedBase + "|creatureFlavorPick") % flavors.length];
    const pool = CREATURES_BY_FLAVOR[f] || CREATURES_BY_FLAVOR._none;
    creature = pick(pool, seedBase + "|creature");
  } else {
    creature = pick(CREATURES_BY_FLAVOR._none, seedBase + "|creature");
  }

  return `The ${element} ${gem} ${creature}`;
}

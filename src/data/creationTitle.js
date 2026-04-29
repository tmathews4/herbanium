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

// Element pools by 3-hour windows of the day. Strictly elemental /
// nature words — sky, water, light, soil, fire, time-of-day phenomena.
// No concepts (Dream, Whisper, Quiet), no human-made objects (Forge,
// Hearth), no fabrics (Velvet). Materials that are really gemstones
// (Crystal, Amber, Copper, Bronze) live in the gem pool instead.
const ELEMENT_POOLS = {
  // pre-dawn (2-5)
  predawn:   ["Mist", "Dew", "Vapor", "Fog", "Drizzle"],
  // dawn (5-8)
  dawn:      ["Light", "Sunfire", "Ember", "Aurora", "Bloom"],
  // morning (8-11)
  morning:   ["Wind", "Sky", "Cloud", "Lightning", "Daybreak"],
  // midday (11-14)
  midday:    ["Fire", "Sun", "Stone", "Glare", "Blaze"],
  // afternoon (14-17)
  afternoon: ["Earth", "Wood", "Tide", "Meadow", "River"],
  // evening (17-20)
  evening:   ["Twilight", "Sunset", "Dusk", "Rain", "Glow"],
  // night (20-23)
  night:     ["Shadow", "Moon", "Frost", "Smoke", "Midnight"],
  // late-night (23-2)
  latenight: ["Void", "Nightshade", "Star", "Ash", "Crescent"],
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

// Gem / ore / crystal pool per flavor family. Strictly gemstones,
// ores, and minerals — no organics like Bone or sweeteners like Honey.
// If the user picked multiple flavors, hash picks one flavor first,
// then a gem from its pool.
const GEMS_BY_FLAVOR = {
  floral:  ["Pearl", "Rose-Quartz", "Opal", "Moonstone"],
  citrus:  ["Amber", "Topaz", "Citrine", "Sunstone"],
  fruity:  ["Garnet", "Ruby", "Carnelian", "Coral"],
  sweet:   ["Heliodor", "Gold", "Tigereye", "Sandstone"],
  spiced:  ["Copper", "Cinnabar", "Jasper", "Bloodstone"],
  minty:   ["Jade", "Aquamarine", "Turquoise", "Emerald"],
  earthy:  ["Onyx", "Slate", "Granite", "Obsidian"],
  smoky:   ["Smoky-Quartz", "Hematite", "Pyrite", "Coal"],
  // Fallback when no flavor was picked at onboarding.
  _none:   ["Diamond", "Crystal", "Pearl", "Quartz", "Marble", "Agate"],
};

// Two creature tiers per category. The picker rolls into the mythical
// pool only ~15% of the time, so common animals dominate while a rarer
// mythical beast remains possible. Mythical entries are strictly
// animal-esque: dragons, hybrids, beasts — never deities or humanoid
// spirits.
const COMMON_BY_MOOD = {
  calm:      ["Heron", "Dove", "Doe", "Owl", "Swan", "Rabbit"],
  focus:     ["Fox", "Falcon", "Cat", "Mantis", "Raven", "Lynx"],
  energy:    ["Tiger", "Hawk", "Stag", "Wolf", "Cheetah", "Horse"],
  sleepy:    ["Bear", "Otter", "Sloth", "Mole", "Badger", "Dormouse"],
  comfort:   ["Bear", "Beaver", "Hedgehog", "Marmot", "Capybara", "Quokka"],
  digestive: ["Tortoise", "Crane", "Goat", "Ox", "Hare", "Pelican"],
};

const MYTHICAL_BY_MOOD = {
  calm:      ["Halcyon", "Caladrius", "Unicorn", "Amphithere"],
  focus:     ["Sphinx", "Yale", "Bakeneko", "Cockatrice"],
  energy:    ["Pegasus", "Griffon", "Garuda", "Sleipnir", "Hippogriff", "Buraq"],
  sleepy:    ["Ouroboros", "Bunyip", "Yeti", "Behemoth"],
  comfort:   ["Kirin", "Jackalope", "Bonnacon", "Sasquatch"],
  digestive: ["Wyvern", "Bennu", "Catoblepas", "Tarasque"],
};

const COMMON_BY_FLAVOR = {
  floral:  ["Stag", "Doe", "Crane", "Lark", "Swan", "Mockingbird"],
  citrus:  ["Lark", "Robin", "Hummingbird", "Oriole", "Goldfinch", "Canary"],
  fruity:  ["Robin", "Otter", "Squirrel", "Bee", "Chipmunk", "Marten"],
  sweet:   ["Bee", "Hummingbird", "Fawn", "Mouse", "Dormouse", "Vole"],
  spiced:  ["Tiger", "Boar", "Lynx", "Jaguar", "Camel", "Cougar"],
  minty:   ["Fox", "Hare", "Trout", "Otter", "Mink", "Stoat"],
  earthy:  ["Bear", "Mole", "Badger", "Bull", "Wombat", "Capybara"],
  smoky:   ["Wolf", "Raven", "Lynx", "Falcon", "Wolverine", "Coyote"],
  _none:   ["Heron", "Stag", "Wolf", "Owl", "Hare", "Fox"],
};

const MYTHICAL_BY_FLAVOR = {
  floral:  ["Unicorn", "Caladrius", "Pegasus", "Kirin"],
  citrus:  ["Phoenix", "Bennu", "Simurgh", "Halcyon"],
  fruity:  ["Jackalope", "Bakeneko", "Caladrius", "Bicorn"],
  sweet:   ["Halcyon", "Caladrius", "Hippocampus", "Phoenix"],
  spiced:  ["Phoenix", "Salamander", "Wyrm", "Manticore", "Chimera", "Garuda"],
  minty:   ["Kelpie", "Hippocampus", "Cetus", "Knucker"],
  earthy:  ["Catoblepas", "Bonnacon", "Yale", "Behemoth", "Tarasque"],
  smoky:   ["Cerberus", "Fenrir", "Wyvern", "Cockatrice", "Basilisk"],
  _none:   ["Sphinx", "Phoenix", "Pegasus", "Wyrm", "Kirin", "Griffon"],
};

// Roll for the rarer mythical pool. ~15% chance keeps mythical beasts
// the exception, not the default.
const MYTHICAL_RATE = 15;
function pickCreature(commonPool, mythicalPool, seed) {
  const roll = hash(seed + "|tier") % 100;
  if (roll < MYTHICAL_RATE && mythicalPool && mythicalPool.length > 0) {
    return pick(mythicalPool, seed + "|mythical");
  }
  return pick(commonPool, seed + "|common");
}

// English "royal order" adjective categories, lowest rank first.
// Two modifiers in front of a noun should appear in ascending rank,
// so a word in category 1 (origin/phenomenon) precedes a word in
// category 2 (material) — "Mist Pearl Heron", not "Pearl Mist Heron."
//
// Most element-pool words are phenomena (mist, storm, frost, light,
// dusk); most gem-pool words are materials. A few element words name
// substances (Stone, Wood, Ash, Earth, Cinder, Ember, Bramble,
// Nightshade) and tie with the gem on category — in a tie we keep
// the input order, since the gem is the more specific material and
// the rule of specificity puts it closer to the noun.
const ADJECTIVE_RANK = {
  // 1 — origin / phenomenon / time / state
  Mist: 1, Dew: 1, Vapor: 1, Fog: 1, Drizzle: 1, Brume: 1, Hush: 1,
  Light: 1, Sunfire: 1, Aurora: 1, Bloom: 1, Glow: 1, Glare: 1, Blaze: 1, Fire: 1,
  Wind: 1, Sky: 1, Cloud: 1, Lightning: 1, Storm: 1,
  Daybreak: 1, Sun: 1, Sunset: 1, Twilight: 1, Dusk: 1, Midnight: 1, Crescent: 1, Moon: 1,
  Tide: 1, River: 1, Rain: 1, Frost: 1, Smoke: 1, Shadow: 1, Void: 1, Star: 1, Meadow: 1,
  // 2 — material / substance
  Stone: 2, Wood: 2, Earth: 2, Ash: 2, Cinder: 2, Ember: 2, Bramble: 2, Nightshade: 2,
};

// Returns the adjective category rank for ordering. Unknown words
// default to material (2) — newer pool entries tend to be specific
// nouns, and forcing them later in the chain is the safer side to
// fail on if a phenomenon word is accidentally typed in.
function adjectiveRank(word) {
  return ADJECTIVE_RANK[word] ?? 2;
}

// Sort a pair of modifiers into English adjective order. Stable —
// when ranks tie, the original (a, b) order is preserved so the
// element-then-gem convention still controls equal-rank cases.
function orderModifiers(a, b) {
  const rA = adjectiveRank(a);
  const rB = adjectiveRank(b);
  return rA <= rB ? [a, b] : [b, a];
}

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
  // The picker rolls against MYTHICAL_RATE so a mythical beast appears
  // only occasionally, regardless of which category is sourced.
  const moods = profile.draw || [];
  let creature;
  if (moods.length > 0) {
    const m = moods[hash(seedBase + "|moodPick") % moods.length];
    const common = COMMON_BY_MOOD[m] || COMMON_BY_FLAVOR._none;
    const mythical = MYTHICAL_BY_MOOD[m] || MYTHICAL_BY_FLAVOR._none;
    creature = pickCreature(common, mythical, seedBase + "|creature");
  } else if (flavors.length > 0) {
    const f = flavors[hash(seedBase + "|creatureFlavorPick") % flavors.length];
    const common = COMMON_BY_FLAVOR[f] || COMMON_BY_FLAVOR._none;
    const mythical = MYTHICAL_BY_FLAVOR[f] || MYTHICAL_BY_FLAVOR._none;
    creature = pickCreature(common, mythical, seedBase + "|creature");
  } else {
    creature = pickCreature(COMMON_BY_FLAVOR._none, MYTHICAL_BY_FLAVOR._none, seedBase + "|creature");
  }

  // Sort the two modifiers into English adjective order before
  // assembly so the title always reads "phenomenon → material →
  // noun" (e.g., "Mist Pearl Heron"), not the inverse.
  const [first, second] = orderModifiers(element, gem);
  return `The ${first} ${second} ${creature}`;
}

// Brief, plain-language descriptions of each creature so users meeting
// an unfamiliar mythical beast (Caladrius, Tarasque, Buraq, etc.) get
// a one-liner of context rather than a name with no anchor.
const CREATURE_DESCRIPTIONS = {
  // Common animals
  Heron: "Long-legged wading bird, motionless in the shallows until it strikes.",
  Dove: "Soft grey peace-bird with wings folded close.",
  Doe: "Female deer — alert, light-footed, attuned to the wood.",
  Owl: "Round-eyed night hunter on soundless wings.",
  Swan: "White long-necked water-bird, unhurried and proud.",
  Rabbit: "Quick brown forager with watching ears.",
  Fox: "Russet-coated, sharp-eared, clever on small white paws.",
  Falcon: "Sharp-beaked raptor that strikes from a high stoop.",
  Cat: "Slow-blinking, self-contained hunter of small things.",
  Mantis: "Green stalker holding still on a leaf, hands raised.",
  Raven: "Black-feathered watcher with a slow, considered eye.",
  Lynx: "Tufted-eared cat moving wide-pawed across snow.",
  Tiger: "Striped predator carrying weight and quiet through tall grass.",
  Hawk: "Sharp-eyed raptor circling over the open field.",
  Stag: "Antlered noble of the forest's quiet edge.",
  Wolf: "Grey pack-runner with steady amber eyes.",
  Cheetah: "Spotted sprinter built around one explosive run.",
  Horse: "Long-maned runner whose strength is patient, not rushed.",
  Bear: "Heavy-shouldered den-keeper, slow-breathing in the dark.",
  Otter: "River-roller floating on its back with a small stone on its belly.",
  Sloth: "Long-armed tree-dweller measuring each move in seconds.",
  Mole: "Velvet-coated digger turning the soil in the dark.",
  Badger: "Striped, low-slung, stubborn at the burrow's mouth.",
  Dormouse: "Tiny tail-curled sleeper in a cup of moss.",
  Beaver: "Flat-tailed builder gnawing logs in a slow brown river.",
  Hedgehog: "Spined small forager rolling tight at the sound of footsteps.",
  Marmot: "Whistling burrow-keeper of the high mountain meadow.",
  Capybara: "Calm-eyed giant rodent in warm shallow water.",
  Quokka: "Small smiling marsupial of island scrub.",
  Tortoise: "Carapaced traveler that outwalks the rush.",
  Crane: "White long-legged dancer in shallow pools.",
  Goat: "Surefooted clamberer at home on the steepest stone.",
  Ox: "Heavy worker pulling slow loads under a low sun.",
  Hare: "Long-legged sprinter of the moonlit field.",
  Pelican: "Big-billed water-bird patient on a low piling.",
  Lark: "Brown bird climbing the morning sky on its own song.",
  Mockingbird: "Grey trickster singing in a dozen borrowed voices.",
  Robin: "Red-breasted small bird singing in the rain's last breath.",
  Hummingbird: "Iridescent flicker on a thousand wingbeats per second.",
  Oriole: "Bright orange weaver of pendulous nests.",
  Goldfinch: "Yellow-and-black seed-eater swinging on a thistle head.",
  Canary: "Small song-bird the colour of a bright window.",
  Squirrel: "Bushy-tailed scampering hoarder of nuts and quiet.",
  Bee: "Striped messenger between blossom and warm hive.",
  Chipmunk: "Cheek-pouched striped rodent, busy at the woodpile.",
  Marten: "Quick, slender tree-hunter with a pale throat.",
  Fawn: "Spotted young deer testing its first legs.",
  Mouse: "Small, quick, gentle of foot, attentive to crumbs.",
  Vole: "Round-bodied burrower in the winter grass.",
  Boar: "Tusked, low-shouldered, rooted in the warm wallow.",
  Jaguar: "Spotted big cat that hunts the river's edge alone.",
  Camel: "Long-legged desert traveler that stores its own water.",
  Cougar: "Tan mountain lion crossing high country in silence.",
  Trout: "Speckled cold-water fish holding still against the current.",
  Mink: "Slim brown predator of stream and bank.",
  Stoat: "White-bellied weasel changing coat with the season.",
  Bull: "Heavy-headed worker, calm at the trough, dangerous if pressed.",
  Wombat: "Round burrowing marsupial of the Australian scrub.",
  Wolverine: "Stocky northern hunter, fierce far beyond its size.",
  Coyote: "Lean trickster-canid threading the desert at dusk.",

  // Mythical beasts — explained for the unfamiliar reader
  Halcyon: "Mythic kingfisher whose nest on the winter sea was said to calm the storm — a bird of stilled weather.",
  Caladrius: "White Roman bird said to draw sickness from the patient and carry it away into the sun.",
  Unicorn: "Single-horned white horse of medieval legend, gentle only to the pure.",
  Amphithere: "Feathered serpent gliding above southern jungles in the older bestiaries.",
  Sphinx: "Lion-bodied, woman-faced, wing-shouldered riddle-keeper of Greek and Egyptian myth.",
  Yale: "Goat-sized antelope of medieval legend whose horns swivel to face any angle of attack.",
  Bakeneko: "Japanese cat-spirit said to grow long-tailed and clever with age.",
  Cockatrice: "Two-legged dragon hatched from a rooster's egg, killing with a glance.",
  Pegasus: "Winged white horse of Greek myth, born of sea-foam and sprung from a hero's wound.",
  Griffon: "Eagle-headed, lion-bodied guardian of treasure in northern bestiaries.",
  Garuda: "Eagle-king of South Asian myth, sky-rider and slayer of serpents.",
  Sleipnir: "Eight-legged grey horse of Norse legend, fastest mount between worlds.",
  Hippogriff: "Half-eagle, half-horse hybrid born to the unlikeliest pair of parents.",
  Buraq: "White winged steed of Persian and Arabian legend with a peacock's tail.",
  Ouroboros: "Serpent swallowing its own tail — the world-circle that closes on itself.",
  Bunyip: "Australian water-beast of swamps and billabongs, more often heard than seen.",
  Yeti: "Snow-coated mountain ape of the high Himalayan passes.",
  Behemoth: "Hippopotamus-large beast of old legend, paired with a great sea-serpent counterpart.",
  Kirin: "Scaled chimera of East Asian myth with a flame mane and gentle hooves — appears only in just kingdoms.",
  Jackalope: "American campfire-myth: a hare wearing a small set of antelope antlers.",
  Bonnacon: "Medieval bull whose horns curl uselessly inward; defended itself by spraying flaming dung.",
  Sasquatch: "Tall, dark-furred forest-walker of Pacific Northwest stories.",
  Wyvern: "Two-legged dragon with leathery wings and a barbed tail, smaller cousin of the great wyrm.",
  Bennu: "Egyptian heron-formed phoenix said to have risen at the world's first sunrise.",
  Catoblepas: "Heavy-headed African beast of the bestiaries, head so heavy it can only look at the ground.",
  Tarasque: "Six-legged dragon-turtle hybrid of Provençal legend, tamed in old stories with a single ribbon.",
  Phoenix: "Long-lived bird that burns to ash and rises again from its own embers.",
  Simurgh: "Vast Persian bird with a peacock's tail and a dog's head, said to live a thousand years.",
  Bicorn: "Two-horned beast of medieval fable, rumored to grow fat on faithful husbands.",
  Hippocampus: "Sea-horse of Greek myth — front of a stallion, tail of a long fish.",
  Salamander: "Lizard of medieval legend said to live unburned inside an open flame.",
  Wyrm: "Wingless Old-English dragon, long and serpentine, dwelling in barrows and rivers.",
  Manticore: "Persian beast: lion-bodied, human-faced, scorpion-tailed.",
  Chimera: "Greek monster grafted from a lion, a goat, and a serpent — fire-breathing at the front.",
  Kelpie: "Scottish water-horse that lures riders into the loch and never lets them surface.",
  Cetus: "Great Greek sea-monster the constellation Cetus is named for.",
  Knucker: "English water-dragon dwelling in deep round pools the locals call knuckerholes.",
  Cerberus: "Three-headed dog of Greek myth that guards the gates of the underworld.",
  Fenrir: "Gigantic Norse wolf prophesied to swallow the sun at the world's end.",
  Basilisk: "Crowned serpent of Mediterranean legend whose gaze turns living things to stone.",

  // Legacy entries — older profiles may still hold creature names from
  // the prior pool. Kept here so their creation card still resolves.
  Selkie: "Celtic seal-folk who shed their skin to walk the shore as gentle strangers.",
  Naiad: "Greek freshwater nymph dwelling in springs and quiet rivers.",
  Lilith: "Night-spirit of older Mesopotamian legend, taking many forms.",
  Brownie: "Small Scottish house-spirit doing quiet work overnight at the hearth.",
  Hestia: "Greek goddess of the hearth-fire, veiled and silent at the home's center.",
  Kobold: "Small Germanic mine-spirit, mischievous and territorial.",
  Mandrake: "Forked-root spirit-plant said to scream when pulled from the ground.",
  Dryad: "Tree-nymph of Greek myth bound to a particular oak.",
  Faerie: "Bright, wing-borne fae of British folklore, often invisible by day.",
  Faun: "Goat-legged woodland reveler of Roman myth.",
  Sprite: "Quick flicker of a spirit appearing in firelight or moving water.",
  Melissa: "Honey-keeper nymph of Greek myth, attended by bees.",
  Pixie: "Small Cornish fairy, quick to dance and quick to vanish.",
  "Yuki-Onna": "Japanese snow-spirit appearing in the high mountain pass as a pale woman in white.",
  Greenman: "Leaf-faced spirit of British folk carvings, presiding over the green wood.",
  Leshy: "Slavic forest-lord with bark skin and mossy beard.",
  Tengu: "Long-nosed mountain spirit of Japanese myth, half-bird and martial.",
  Pyralis: "Ancient Greek 'fire-fly' said to live inside the flame itself.",
};

// Returns a one-line description for the creature inside a creation
// title. Falls back to null when the creature isn't in the map, so the
// caller can supply its own default copy.
export function describeCreationTitle(title) {
  if (!title) return null;
  const parts = title.trim().split(/\s+/);
  const creature = parts[parts.length - 1];
  return CREATURE_DESCRIPTIONS[creature] || null;
}

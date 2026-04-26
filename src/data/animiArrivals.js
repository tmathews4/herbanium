/* ──────────────────────────────────────────────────────────────
   data/animiArrivals.js — arrival verb-phrases for animi pop-ups.

   When a new animi is earned, the pop-up reads:
     "{animi.name} {arrival verb}."

   Each entry maps a creature/spirit name (the last word of the
   animi title, or the full stripped name for compound spirits) to a
   short verb-phrase tuned to its register: birds alight, rodents
   scamper, dragons coil, fae wisp, household spirits settle. The
   fallback line covers anything not explicitly mapped.

   The mapping tries the full name first, then the last word, so
   "The Banyan Spirit" matches "Banyan Spirit" before falling back
   to "Spirit", and "The Caladrius" matches "Caladrius" directly.
   ────────────────────────────────────────────────────────────── */

const ARRIVAL_VERBS = {
  // ── Birds & winged things ─────────────────────────────────
  Bat:           "wings past in the dim",
  Bee:           "hums by",
  Bennu:         "rises from sun-warmed sand",
  Caladrius:     "looks at you, then turns toward the sun",
  Canary:        "perches at the bright window",
  Cardinal:      "flashes red across the cold",
  Crane:         "alights with wings folded slow",
  Dove:          "flutters down to a low branch",
  Falcon:        "stoops past in a sharp dive",
  "Feng-Huang":  "five-coloured plumage settles a moment",
  Garuda:        "wheels overhead, eagle-king",
  Goldfinch:     "flickers between thistles",
  Halcyon:       "settles on the calm winter sea",
  Hawk:          "wheels once overhead",
  Heron:         "alights at the still water's edge",
  Hummingbird:   "hovers a moment, then is gone",
  Lampad:        "glides in carrying a low torch",
  Lark:          "spirals down still singing",
  Magpie:        "flares black-and-white into view",
  Mockingbird:   "calls in three borrowed voices",
  Mantis:        "freezes a moment, then is gone",
  Newt:          "blinks once and slips into the moss",
  Oriole:        "flits past in orange",
  Owl:           "glides in on soundless wings",
  Pegasus:       "wings down out of the clouds",
  Pelican:       "wings overhead",
  Phoenix:       "burns once and is whole again",
  Quetzal:       "flashes green between the leaves",
  Raven:         "drops to a fence-post",
  Robin:         "lands on a wet branch",
  Roc:           "shadows the whole valley",
  Simurgh:       "sweeps past, vast and ancient",
  Sparrow:       "lights on the windowsill",
  Swan:          "glides past on still water",

  // ── Small creatures, rodents, insects ─────────────────────
  Capybara:      "wades in slowly",
  Chipmunk:      "scampers between stones",
  Dormouse:      "tail-curled, half-asleep, pads in",
  Hare:          "leaps once, twice, and is past",
  Hedgehog:      "trundles into the leaves",
  Marmot:        "whistles down from the ridge",
  Mouse:         "scampers across the floorboards",
  Quokka:        "trots up grinning",
  Rabbit:        "lopes into view",
  Squirrel:      "darts up the bark",
  Trout:         "rises to the surface, then back down",
  Vole:          "scurries through the grass",
  Wombat:        "trundles past",

  // ── Felines ───────────────────────────────────────────────
  "Bai-Hu":      "the white tiger crosses the grove",
  Bakeneko:      "pads past with an unusually long tail",
  Cat:           "slow-blinks at you from the doorway",
  Cheetah:       "runs by in a single blur",
  Cougar:        "crosses high country quietly",
  Jaguar:        "watches from the river-bank",
  Lynx:          "ghosts past in the snow",
  Tiger:         "pads through tall grass",

  // ── Canines ───────────────────────────────────────────────
  Cerberus:      "all three heads turn to watch you",
  Coyote:        "trots through at dusk",
  "Cu Sith":     "pads silent across the moor",
  Fenrir:        "the great wolf prowls past",
  Fox:           "darts across the path",
  Wolf:          "pads past on steady amber eyes",
  Wolverine:     "lumbers past without a glance",

  // ── Hooved & equine ───────────────────────────────────────
  Bicorn:        "rumbles into view, twin-horned",
  Boar:          "lowers tusks and rumbles past",
  Bonnacon:      "runs by, smoke at its tail",
  Buraq:         "alights with a peacock's tail spread",
  Bull:          "snorts and walks on",
  Camel:         "saunters past unhurried",
  Catoblepas:    "lifts its heavy head once, then drops it",
  Doe:           "steps lightly through the wood",
  Fawn:          "tests its first legs nearby",
  Goat:          "perches above on a stone",
  Hippocampus:   "surges through the shallows",
  Hippogriff:    "glides down, wings folding",
  Horse:         "gallops past, mane streaming",
  Jackalope:     "lopes past, antlered",
  Kelpie:        "rises dripping from the loch",
  Kirin:         "steps softly, hooves not bending grass",
  Ox:            "plods through, slow as time",
  Sleipnir:      "gallops past on eight thundering hooves",
  Stag:          "lifts antlered head, then is past",
  Tarasque:      "lumbers past on six green legs",
  Unicorn:       "steps from the trees, alone",
  Yale:          "swings its swivelled horns and is past",

  // ── Bears, mustelids, large mammals ───────────────────────
  Badger:        "scuttles past low to the ground",
  Bear:          "lumbers past, slow-breathing",
  Beaver:        "slaps the water and dives",
  Behemoth:      "shakes the ground as it passes",
  Bunyip:        "stirs once in the still water",
  Elephant:      "walks slow as memory",
  Marten:        "leaps tree to tree",
  Mink:          "darts along the bank",
  Mole:          "pushes up a mound and disappears",
  "Mokele-Mbembe":"surfaces in the river-bend",
  Otter:         "rolls out of the river and is gone",
  Sasquatch:     "passes between the cedars",
  Sloth:         "is here. Will be here a while.",
  Stoat:         "flickers across the field",
  Tanuki:        "ambles up shaking a sake gourd",
  Yeti:          "fades back into the snow",

  // ── Reptiles, dragons, serpents ───────────────────────────
  Amphithere:    "glides feathered through the canopy",
  Basilisk:      "passes; you keep your eyes down",
  Cockatrice:    "fixes you with a single eye",
  Knucker:       "ripples in the deep round pool",
  Naga:          "rises hooded from the spring",
  Ouroboros:     "the circle closes once, then opens",
  Salamander:    "curls inside the ember",
  Tianlong:      "coils once across the dawn sky",
  Tortoise:      "ambles past on stone-old legs",
  Wyrm:          "slithers through the long grass",
  Wyvern:        "lands once, then beats away",
  Xuanwu:        "the black tortoise pauses, serpent twined",

  // ── Hybrids, chimerics, monsters ──────────────────────────
  Cetus:         "the deep stirs",
  Chimera:       "all three heads notice at once",
  Griffon:       "settles on a high stone",
  Hydra:         "many heads turn",
  Manticore:     "watches with an unsettling grin",
  Sphinx:        "considers you in silence",
  Pyralis:       "circles inside a small flame",

  // ── Fae & wisps ───────────────────────────────────────────
  Brownie:       "leaves a small thing tidied",
  Dryad:         "steps from inside the oak",
  Faerie:        "winks into firelight",
  Faun:          "pipes a few notes from the wood",
  Greenman:      "gathers from leaves and stands",
  Hob:           "warms a tile by the stove",
  Hobgoblin:     "tips a red cap from the leaf-pile",
  Kitsune:       "nine tails flicker once and settle",
  Leshy:         "the forest shifts a step closer",
  Naiad:         "ripples to the surface of the spring",
  Nymph:         "steps from the dappled green",
  Pixie:         "dances a brief circle and is gone",
  Pooka:         "appears as a black horse, then a hare",
  Rusalka:       "rises from the stream, hair wet",
  Selkie:        "slips out of her sealskin onto the shore",
  Sidhe:         "fades in from the hollow hill",
  Sprite:        "flickers between embers",
  Tengu:         "lands on the high pine",
  Wisp:          "glimmers once on the moor",
  "Yuki-Onna":   "the snow stills around her",

  // ── Household spirits & local deities ─────────────────────
  Domovoi:       "settles behind the pantry",
  Hestia:        "tends a low flame at your hearth",
  Lar:           "watches at the doorway",
  Lares:         "five small statues turn at once",
  Penates:       "appear at the threshold",
  Vesta:         "kindles a small steady fire",

  // ── Greek / Roman titans, gods, mythic figures ────────────
  Aeolus:        "loosens a small wind",
  Aion:          "the zodiac wheel turns once",
  Anthousai:     "petal-skinned, bloom past",
  Aphrodite:     "appears in a wake of rose petals",
  Apollo:        "tunes a lyre at distance",
  Argonaut:      "an old wooden ship slides past",
  Argus:         "many eyes open at once",
  Asclepius:     "appears with a serpent-twined staff",
  Athena:        "steps in helmed, owl on shoulder",
  Atlas:         "shoulders a sky and walks past slow",
  Augur:         "watches the birds with a curved staff",
  Bacchus:       "lifts a vine-crowned cup",
  Caryatid:      "stands very still under a small temple",
  Cernunnos:     "ringed by quiet beasts, walks past",
  Cherub:        "wide eyes and small wings appear",
  Comus:         "raises a honey-cup in greeting",
  Cynthia:       "the moon brightens a moment",
  Demeter:       "passes carrying sheaves of grain",
  Dionysus:      "lifts a vine-crowned cup",
  Dioscuri:      "twin riders pass on one saddle",
  Eos:           "opens dawn at the eastern edge",
  Galene:        "calms the surface of the water",
  Helios:        "drives his bronze chariot mid-arc",
  Hemera:        "lifts the bright day",
  Hephaestus:    "anvils sparks at distance",
  Hespera:       "lights a low evening lantern",
  Hesperide:     "passes carrying golden apples",
  Hekate:        "appears with three faces turning",
  Horae:         "three sisters pass hand in hand",
  Hygieia:       "lifts a serpent-bowl in greeting",
  Hypnos:        "scatters poppy seed at your feet",
  Iris:          "leaves a faint rainbow at the rim",
  Janus:         "looks at you with both faces",
  Lethe:         "flows past dark and slow",
  Melissa:       "honeybees crown her head a moment",
  Menthe:        "leaves a sprig of mint where she stood",
  Mneme:         "remembers you precisely",
  Mnemosyne:     "the river of memory pauses",
  Monad:         "a single point of light steadies",
  Morpheus:      "drifts in carrying dreams",
  Nemesis:       "weighs a measuring rod",
  Persephone:    "steps from a green doorway",
  Polestar:      "fixes itself above you",
  Proteus:       "shifts shape and is something else",
  Pythia:        "speaks once from above the vapor",
  Saturnalia:    "masked revelers pass laughing",
  Selene:        "draws her silver chariot across",
  "Sol Invictus":"burns crowned and undefeated",
  Themis:        "weighs scales in silence",
  Wormwood:      "silver leaves rustle dry",

  // ── Norse / Germanic ──────────────────────────────────────
  Boreas:        "frost-rimmed wings spread cold",
  Heimdall:      "sounds a single horn-note",
  Loki:          "winks once and is somewhere else",
  Odin:          "appears one-eyed, two ravens at his shoulder",
  Skadi:         "snowshoes pass leaving no trail",

  // ── Celtic / Slavic / Germanic spirits ────────────────────
  "Baba Yaga":   "her hut settles on chicken legs nearby",
  Brigid:        "fire briefly warms her open palms",
  Druid:         "steps from the oak grove",
  Kupala:        "passes flower-crowned by a bonfire",
  Strega:        "sweeps past on a low broom",

  // ── East/South Asian, African, Mesoamerican ───────────────
  Anansi:        "spins a single line and waits",
  "Banyan Spirit":"the tree's roots shift a step closer",
  Bodhisattva:   "raises a hand in promise",
  Brahman:       "stands at the river-bank",
  Chajin:        "sets a kettle without a word",
  Condor:        "wheels overhead, immense",
  Daemon:        "an inner voice steadies into shape",
  Dervish:       "begins a slow turning",
  Hierophant:    "raises a key in welcome",
  Hesychast:     "sits silent in his cell",
  Hermes:        "winged sandals touch down briefly",
  Mandragora:    "uproots itself and shrieks once",
  Nabu:          "scribes a single line and looks up",
  Saraswati:     "tunes a vina across her lap",
  Sennin:        "wakes from a long mountain meditation",
  Tezcatlipoca:  "an obsidian mirror tilts toward you",
  Thoth:         "sets a reed against a scroll",
  Yggdrasil:     "the world-tree's roots stir once",

  // ── Misc ──────────────────────────────────────────────────
  Alchemist:     "uncorks a small bright bottle",
  Bard:          "tunes a small harp",
  Camellia:      "the leaf-flowering tree lifts a single bud",
  Daimon:        "an inner voice steadies into shape",
  Ent:           "creaks closer one century at a time",
  Flora:         "a meadow's bloom turns toward you",
  Methuselah:    "his beard reaches the floor and beyond",
  Sage:          "steps in slowly, with a steady gaze",
  Zaratan:       "the island-turtle surfaces under the world",
};

const FALLBACK_VERB = "drifts in like a half-seen memory";

// Returns the arrival verb-phrase for a given animi name. Tries the
// full stripped name first ("Banyan Spirit", "Yuki-Onna"), then falls
// back to the last word ("The Caladrius" → "Caladrius"). Anything not
// in the map gets the gentle FALLBACK_VERB.
export function arrivalVerbFor(name) {
  if (!name) return FALLBACK_VERB;
  const stripped = name.replace(/^The\s+/i, "").trim();
  if (ARRIVAL_VERBS[stripped]) return ARRIVAL_VERBS[stripped];
  const lastWord = stripped.split(/\s+/).pop();
  return ARRIVAL_VERBS[lastWord] || FALLBACK_VERB;
}

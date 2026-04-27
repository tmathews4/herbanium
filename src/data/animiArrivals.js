/* ──────────────────────────────────────────────────────────────
   data/animiArrivals.js — arrival verb-phrases for animi pop-ups.

   When a new elemental is summoned, the pop-up reads:
     "{animi.name} {arrival verb}."

   Each entry maps a creature/spirit name (the last word of the
   animi title, or the full stripped name for compound spirits) to a
   short phrase describing the small corner of the grove it picks
   out as its own. The voice is consistent: each elemental finds a
   patch that suits its nature and settles in.

   The mapping tries the full name first, then the last word, so
   "The Banyan Spirit" matches "Banyan Spirit" before falling back
   to "Spirit", and "The Caladrius" matches "Caladrius" directly.
   ────────────────────────────────────────────────────────────── */

const ARRIVAL_VERBS = {
  // ── Birds & winged things ─────────────────────────────────
  Bat:           "settles upside-down beneath the grove's lantern-eaves",
  Bee:           "claims the grove's busiest blossom",
  Bennu:         "settles on a sun-warmed stone at the grove's edge",
  Caladrius:     "alights on a white branch where the grove takes the sun",
  Canary:        "claims a bright window-corner of the grove",
  Cardinal:      "finds the grove's reddest winter branch and stays",
  Crane:         "folds its wings into the grove's still pool",
  Dove:          "settles on the grove's lowest quiet bough",
  Falcon:        "claims the grove's highest crag and watches",
  "Feng-Huang":  "settles among the grove's most colored leaves",
  Garuda:        "circles down to the grove's highest peak",
  Goldfinch:     "claims a thistle-edge at the grove's verge",
  Halcyon:       "finds the grove's calmest pool and floats",
  Hawk:          "claims a wind-thermal above the grove and circles",
  Heron:         "settles at the grove's reed-edged shallows",
  Hummingbird:   "finds the brightest blossom in the grove",
  Lampad:        "settles beneath the grove's dimmest lantern",
  Lark:          "claims the bright sky over the grove and sings",
  Magpie:        "stakes out the grove's brightest hoard-tree",
  Mockingbird:   "settles at a grove edge, borrowing voices",
  Mantis:        "holds still on the grove's driest stem",
  Newt:          "slips into a wet corner of the grove's moss",
  Oriole:        "claims an orange flash among the grove's high leaves",
  Owl:           "settles in the grove's tallest hollow tree",
  Hoopoe:        "claims a crown-leafed corner of the grove",
  Stork:         "claims a long-bill perch at the grove's reed-edge",
  Octopus:       "settles into a tide-pool corner of the grove",
  Pegasus:       "lands in the grove's open meadow, wings folding",
  Pelican:       "claims the grove's quiet shore",
  Phoenix:       "settles in the grove's sun-warmed clearing",
  Quetzal:       "claims the grove's deepest green canopy",
  Raven:         "claims the grove's highest fence-post",
  Robin:         "settles on a wet branch in the grove's spring corner",
  Roc:           "shadows half the grove and settles on its highest ridge",
  Simurgh:       "alights on the grove's most ancient bough",
  Sparrow:       "claims the grove's eaves",
  Swan:          "settles on the grove's still pond",

  // ── Small creatures, rodents, insects ─────────────────────
  Beetle:        "claims an open petal in the grove",
  Capybara:      "settles into the grove's shallow pool",
  Chipmunk:      "stakes out a stone-stack in the grove",
  Dormouse:      "curls into a warm grove-hollow, half-asleep",
  Hare:          "settles in a meadow corner of the grove",
  Hedgehog:      "burrows into a leaf-pile at the grove's edge",
  Marmot:        "claims a stone perch at the grove's ridge",
  Mouse:         "tucks into a small grove-burrow",
  Quokka:        "settles at the grove's grass-edge, grinning",
  Rabbit:        "settles in the grove's clover patch",
  Spider:        "drops a fresh web into the grove's quiet corner",
  Squirrel:      "stakes out the grove's tallest oak",
  Trout:         "claims a slow eddy in the grove's stream",
  Vole:          "tucks into a grove-grass tunnel",
  Wombat:        "settles in a grove burrow it has dug itself",

  // ── Felines ───────────────────────────────────────────────
  "Bai-Hu":      "claims the grove's western ridge",
  Bakeneko:      "claims a moonlit grove corner, tail unusually long",
  Cat:           "claims a sunbeam at the grove's threshold",
  Cheetah:       "settles on the grove's open savannah patch",
  Cougar:        "claims the grove's high cliffside",
  Jaguar:        "claims the river-bank corner of the grove",
  Lynx:          "claims a snowed corner of the grove",
  Tiger:         "settles in the grove's tall-grass corner",

  // ── Canines ───────────────────────────────────────────────
  Cerberus:      "settles at the grove's deepest gate",
  Coyote:        "claims the grove's dusk-corner",
  Crow:          "claims the grove's high fence-post",
  "Cu Sith":     "claims a heath corner of the grove",
  Fenrir:        "claims the grove's deepest pine",
  Fox:           "settles in a sunlit hollow of the grove",
  Wolf:          "circles the grove's pine line and beds down",
  Wolverine:     "claims a stony corner of the grove",

  // ── Hooved & equine ───────────────────────────────────────
  Auroch:        "claims the grove's open plain",
  Bicorn:        "settles in the grove's stone-circle",
  Boar:          "settles in the grove's warm wallow",
  Bonnacon:      "claims a smoke-edged corner of the grove",
  Buraq:         "alights with a peacock's tail in the grove's bright clearing",
  Bull:          "settles in the grove's open meadow",
  Camel:         "claims a sun-warmed corner of the grove's road",
  Catoblepas:    "settles in the grove's lowest valley",
  Doe:           "settles in a soft-stepped corner of the grove",
  Fawn:          "settles in a young patch of the grove's wood",
  Goat:          "claims the grove's tallest stone perch",
  Hippocampus:   "settles in the grove's seafoam shallows",
  Hippogriff:    "lands in the grove's open clearing, wings folding",
  Horse:         "claims the grove's open run",
  Jackalope:     "settles antlered in the grove's hare-meadow",
  Kelpie:        "claims the grove's loch-edge, dripping",
  Kirin:         "settles softly in the grove, no grass bent",
  Ox:            "settles in the grove's worn furrow, slow as time",
  Sleipnir:      "claims the grove's wide trail",
  Stag:          "stands antlered at the grove's quiet edge",
  Tarasque:      "settles in the grove's mossiest corner",
  Unicorn:       "claims an apple-tree clearing in the grove",
  Yale:          "claims a horned corner of the grove",

  // ── Bears, mustelids, large mammals ───────────────────────
  Badger:        "claims a low burrow at the grove's hedge",
  Bear:          "settles into a den-corner of the grove",
  Beaver:        "claims a dam-corner of the grove's stream",
  Behemoth:      "claims the grove's broadest meadow",
  Bunyip:        "claims the grove's deepest still pool",
  Elephant:      "settles in the grove's wide grass, slow as memory",
  Marten:        "claims a high-branch corner of the grove",
  Mink:          "claims the grove's bank-edge",
  Mole:          "tunnels into a soft patch of the grove and disappears",
  "Mokele-Mbembe":"claims the grove's river-bend",
  Mongoose:      "settles ready at the grove's spice-tree",
  Otter:         "claims a quiet stream-bank in the grove",
  Sasquatch:     "settles between the grove's cedars",
  Sloth:         "settles in the grove's slowest tree. Will be there a while.",
  Stoat:         "claims a meadow-corner of the grove",
  Tanuki:        "settles at the grove's edge with a sake gourd",
  Yeti:          "claims the grove's snowed corner",

  // ── Reptiles, dragons, serpents ───────────────────────────
  Amphithere:    "claims a feathered branch in the grove's canopy",
  Basilisk:      "settles in the grove's shaded stones, eyes averted",
  Cockatrice:    "settles in the grove's nest-corner",
  Frog:          "claims a wet leaf at the grove's pond",
  Knucker:       "claims the grove's deep round pool",
  Lindworm:      "coils itself into the grove's deepest root",
  Naga:          "claims the grove's spring-mouth",
  Ouroboros:     "claims a circular corner of the grove",
  Salamander:    "curls into a warm coal at the grove's hearth-stone",
  Tianlong:      "settles above the grove at dawn",
  Tortoise:      "finds a flat stone in the grove and stays",
  Wyrm:          "tunnels through the grove's longest grass",
  Wyvern:        "claims a high crag in the grove and folds its wings",
  Xuanwu:        "claims a still pool of the grove",

  // ── Hybrids, chimerics, monsters ──────────────────────────
  Cetus:         "claims the grove's deepest pool",
  Chimera:       "settles in a many-headed corner of the grove",
  Griffon:       "claims a high-stone perch in the grove",
  Hydra:         "claims the grove's swamp-corner",
  Manticore:     "claims a watchful corner of the grove",
  Sphinx:        "settles at the grove's riddle-stone",
  Pyralis:       "claims the heart of the grove's small fire",

  // ── Fae & wisps ───────────────────────────────────────────
  Brownie:       "settles in a tidy corner of the grove",
  Dryad:         "claims a particular oak in the grove",
  Faerie:        "settles by the grove's smallest firelight",
  Faun:          "claims a piping corner of the grove's wood",
  Greenman:      "gathers from leaves and stands at the grove's heart",
  Hob:           "settles by the grove's hearth-tile",
  Hobgoblin:     "claims a leaf-pile in the grove and tips a red cap",
  Kitsune:       "claims a sunlit corner of the grove, nine tails settling",
  Leshy:         "the forest shifts a step closer at the grove's edge",
  Naiad:         "claims the spring-mouth of the grove",
  Nymph:         "settles into a dappled corner of the grove",
  Pixie:         "claims a flowerbed corner of the grove",
  Pooka:         "claims a shape-shifting corner of the grove",
  Rusalka:       "claims the grove's stream, hair still wet",
  Selkie:        "claims the grove's seal-shore",
  Sidhe:         "claims the grove's hollow hill",
  Sprite:        "claims a flicker-corner of the grove's coals",
  Tengu:         "claims the grove's high pine",
  Wisp:          "claims a moor-corner of the grove",
  "Yuki-Onna":   "the snow stills around her in a quiet grove corner",

  // ── Household spirits & local deities ─────────────────────
  Domovoi:       "claims the grove's pantry-shadow",
  Hestia:        "tends a low flame at the grove's hearth",
  Lar:           "claims the grove's doorway",
  Lares:         "claim a small-statue corner of the grove",
  Penates:       "claim the grove's threshold",
  Vesta:         "kindles a small steady fire at the grove's center",

  // ── Greek / Roman titans, gods, mythic figures ────────────
  Aeolus:        "loosens a small wind across the grove",
  Aion:          "claims the grove's still center",
  Anthousai:     "claim a petal-edge of the grove",
  Aphrodite:     "claims a rose-corner of the grove",
  Apollo:        "tunes a lyre at the grove's far edge",
  Argonaut:      "claims a far shore of the grove",
  Argus:         "claims a watchful clearing in the grove",
  Asclepius:     "settles at the grove's healing-spring",
  Athena:        "claims an olive corner of the grove",
  Atlas:         "shoulders the grove's stone arch",
  Augur:         "claims a watching-stone of the grove",
  Bacchus:       "claims a vine-crowned corner of the grove",
  Caryatid:      "stands very still under the grove's stone arch",
  Cernunnos:     "claims a beast-ringed clearing in the grove",
  Cherub:        "claims a sky-corner of the grove",
  Comus:         "claims a honeycomb corner of the grove",
  Cynthia:       "claims a moon-bright clearing of the grove",
  Demeter:       "claims a grain-field edge of the grove",
  Dionysus:      "claims a vine-crowned corner of the grove",
  Dioscuri:      "claim a twin-stone clearing in the grove",
  Eos:           "claims the grove's eastern dawn-edge",
  Galene:        "claims the grove's calmest water",
  Helios:        "claims the grove's noon arc",
  Hemera:        "lifts the bright day above the grove",
  Hephaestus:    "claims a forge-edge of the grove",
  Hespera:       "lights a low lantern at the grove's evening edge",
  Hesperide:     "claims an apple-tree corner of the grove",
  Hekate:        "claims a triple-crossroad corner of the grove",
  Horae:         "claim a season-edge of the grove",
  Hygieia:       "settles at the grove's healing pool",
  Hypnos:        "scatters poppy seed in the grove's quiet hollow",
  Iris:          "leaves a faint rainbow at the grove's rim",
  Janus:         "claims the grove's gate, looking both ways",
  Lethe:         "claims the grove's dark-water stream",
  Melissa:       "claims a hive-corner of the grove",
  Menthe:        "claims a mint-edge of the grove",
  Mneme:         "claims a memory-stone of the grove",
  Mnemosyne:     "the river of memory pauses through the grove",
  Monad:         "claims a single still center of the grove",
  Morpheus:      "settles in a dream-corner of the grove",
  Nemesis:       "claims a balance-stone of the grove",
  Persephone:    "claims a spring-doorway of the grove",
  Polestar:      "fixes itself above the grove",
  Proteus:       "claims a shifting tide-pool of the grove",
  Pythia:        "claims an oracle-edge of the grove",
  Saturnalia:    "claim a feast-corner of the grove",
  Selene:        "draws her silver chariot across the grove",
  "Sol Invictus":"claims the grove's high noon",
  Themis:        "claims a balance-stone of the grove",
  Wormwood:      "claims a dry-stem corner of the grove",

  // ── Norse / Germanic ──────────────────────────────────────
  Boreas:        "claims the grove's north wind",
  Heimdall:      "claims the grove's bridge",
  Loki:          "claims an unpredictable corner of the grove",
  Odin:          "claims the grove's high seat, two ravens nearby",
  Skadi:         "claims the grove's snowed pass",

  // ── Celtic / Slavic / Germanic spirits ────────────────────
  "Baba Yaga":   "her hut settles on chicken legs at the grove's edge",
  Brigid:        "warms her open palms at the grove's hearth",
  Druid:         "settles in the grove's old oak",
  Kupala:        "claims a bonfire corner of the grove",
  Strega:        "claims a hearth-corner of the grove",

  // ── East/South Asian, African, Mesoamerican ───────────────
  Anansi:        "spins a thread in the grove's corner and waits",
  "Banyan Spirit":"settles among many-rooted trunks in the grove",
  Banyan:        "settles among many-rooted trunks in the grove",
  Bodhisattva:   "settles cross-legged at the grove's still center",
  Brahman:       "claims a river-bank corner of the grove",
  Chajin:        "claims a tea-bench corner of the grove",
  Condor:        "claims a high-peak corner of the grove",
  Daemon:        "settles into a quiet inner corner of the grove",
  Dervish:       "claims a turning circle of the grove",
  Hierophant:    "claims a temple-stone of the grove",
  Hesychast:     "claims a still cell-corner of the grove",
  Hermes:        "claims a crossroads corner of the grove",
  Mandragora:    "settles in a root-corner of the grove",
  Nabu:          "claims a writing-stone of the grove",
  Saraswati:     "tunes a vina at the grove's library-edge",
  Sennin:        "claims a high-mountain ledge of the grove",
  Tezcatlipoca:  "claims a smoke-mirror corner of the grove",
  Thoth:         "claims a scroll-bench of the grove",
  Yggdrasil:     "the world-tree's roots find a deep corner of the grove",

  // ── Journal-spirit creatures ──────────────────────────────
  Inkling:       "claims a thought-edge of the grove",
  Scrivener:     "claims a desk-corner of the grove with a candle",
  Annal:         "claims a marked-page corner of the grove",
  Cicada:        "claims a high-tree corner of the grove",
  Wagtail:       "claims a riverbank corner of the grove",
  Cricket:       "settles into the grove's long grass",
  Linnet:        "claims a hedgerow corner of the grove",
  "Owl-Scribe":  "claims a quill-perch of the grove",
  "Lark-Scribe": "claims a sunrise-edge of the grove",
  "Margin-Cat":  "curls along the grove's page-edge",
  Lapwing:       "claims a familiar field of the grove",

  // ── Misc ──────────────────────────────────────────────────
  Alchemist:     "claims a bottle-cluttered corner of the grove",
  Bard:          "claims a harp-corner of the grove",
  Camellia:      "the leaf-flowering tree finds a corner of the grove",
  Daimon:        "settles into a quiet inner corner of the grove",
  Ent:           "settles in the grove's oldest tree-circle",
  Flora:         "claims a meadow-bloom of the grove",
  Methuselah:    "claims a long-beard corner of the grove",
  Sage:          "claims a quiet hut at the grove's edge",
  Zaratan:       "the island-turtle surfaces under a corner of the grove",
};

const FALLBACK_VERB = "drifts to a corner of the grove and settles in";

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

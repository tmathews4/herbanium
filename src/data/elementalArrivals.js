/* ──────────────────────────────────────────────────────────────
   data/elementalArrivals.js — arrival verb-phrases for elemental pop-ups.

   When a new elemental is summoned, the pop-up reads:
     "{elemental.name} {arrival verb}."

   Each entry maps a creature/spirit name (the last word of the
   elemental title, or the full stripped name for compound spirits)
   to a short observed-behavior phrase — the kind of line a
   naturalist would jot in a field notebook. The voice is
   consistent: each elemental is described as the user might note
   them down on a bestiary page.

   The mapping tries the full name first, then the last word, so
   "The Banyan Spirit" matches "Banyan Spirit" before falling back
   to "Spirit", and "The Caladrius" matches "Caladrius" directly.
   ────────────────────────────────────────────────────────────── */

const ARRIVAL_VERBS = {
  // ── Birds & winged things ─────────────────────────────────
  Bat:           "settles upside-down beneath the lantern-eaves",
  Bee:           "claims the busiest blossom",
  Bennu:         "settles on a sun-warmed stone at the edge",
  Caladrius:     "alights on a white branch where the wood takes the sun",
  Canary:        "claims a bright window-corner of the wood",
  Cardinal:      "finds the reddest winter branch and stays",
  Crane:         "folds its wings into the still pool",
  Dove:          "settles on the lowest quiet bough",
  Falcon:        "claims the highest crag and watches",
  "Feng-Huang":  "settles among the most colored leaves",
  Garuda:        "circles down to the highest peak",
  Goldfinch:     "claims a thistle-edge at the verge",
  Halcyon:       "finds the calmest pool and floats",
  Hawk:          "claims a wind-thermal above the wood and circles",
  Heron:         "settles at the reed-edged shallows",
  Hummingbird:   "finds the brightest blossom in the wood",
  Lampad:        "settles beneath the dimmest lantern",
  Lark:          "claims the bright sky over the wood and sings",
  Magpie:        "stakes out the brightest hoard-tree",
  Mockingbird:   "settles at a wood edge, borrowing voices",
  Mantis:        "holds still on the driest stem",
  Newt:          "slips into a wet corner of the moss",
  Oriole:        "claims an orange flash among the high leaves",
  Owl:           "settles in the tallest hollow tree",
  Hoopoe:        "claims a crown-leafed corner of the wood",
  Stork:         "claims a long-bill perch at the reed-edge",
  Octopus:       "settles into a tide-pool corner of the wood",
  Pegasus:       "lands in the open meadow, wings folding",
  Pelican:       "claims the quiet shore",
  Phoenix:       "settles in the sun-warmed clearing",
  Quetzal:       "claims the deepest green canopy",
  Raven:         "claims the highest fence-post",
  Robin:         "settles on a wet branch in the spring corner",
  Roc:           "shadows half the wood and settles on its highest ridge",
  Simurgh:       "alights on the most ancient bough",
  Sparrow:       "claims the eaves",
  Swan:          "settles on the still pond",

  // ── Small creatures, rodents, insects ─────────────────────
  Beetle:        "claims an open petal in the wood",
  Capybara:      "settles into the shallow pool",
  Chipmunk:      "stakes out a stone-stack in the wood",
  Dormouse:      "curls into a warm wood-hollow, half-asleep",
  Hare:          "settles in a meadow corner of the wood",
  Hedgehog:      "burrows into a leaf-pile at the edge",
  Marmot:        "claims a stone perch at the ridge",
  Mouse:         "tucks into a small wood-burrow",
  Quokka:        "settles at the grass-edge, grinning",
  Rabbit:        "settles in the clover patch",
  Spider:        "drops a fresh web into the quiet corner",
  Squirrel:      "stakes out the tallest oak",
  Trout:         "claims a slow eddy in the stream",
  Vole:          "tucks into a wood-grass tunnel",
  Wombat:        "settles in a wood burrow it has dug itself",

  // ── Felines ───────────────────────────────────────────────
  "Bai-Hu":      "claims the western ridge",
  Bakeneko:      "claims a moonlit wood corner, tail unusually long",
  Cat:           "claims a sunbeam at the threshold",
  Cheetah:       "settles on the open savannah patch",
  Cougar:        "claims the high cliffside",
  Jaguar:        "claims the river-bank corner of the wood",
  Lynx:          "claims a snowed corner of the wood",
  Tiger:         "settles in the tall-grass corner",

  // ── Canines ───────────────────────────────────────────────
  Cerberus:      "settles at the deepest gate",
  Coyote:        "claims the dusk-corner",
  Crow:          "claims the high fence-post",
  "Cu Sith":     "claims a heath corner of the wood",
  Fenrir:        "claims the deepest pine",
  Fox:           "settles in a sunlit hollow of the wood",
  Wolf:          "circles the pine line and beds down",
  Wolverine:     "claims a stony corner of the wood",

  // ── Hooved & equine ───────────────────────────────────────
  Auroch:        "claims the open plain",
  Bicorn:        "settles in the stone-circle",
  Boar:          "settles in the warm wallow",
  Bonnacon:      "claims a smoke-edged corner of the wood",
  Buraq:         "alights with a peacock's tail in the bright clearing",
  Bull:          "settles in the open meadow",
  Camel:         "claims a sun-warmed corner of the road",
  Catoblepas:    "settles in the lowest valley",
  Doe:           "settles in a soft-stepped corner of the wood",
  Fawn:          "settles in a young patch of the wood",
  Goat:          "claims the tallest stone perch",
  Hippocampus:   "settles in the seafoam shallows",
  Hippogriff:    "lands in the open clearing, wings folding",
  Horse:         "claims the open run",
  Jackalope:     "settles antlered in the hare-meadow",
  Kelpie:        "claims the loch-edge, dripping",
  Kirin:         "settles softly in the wood, no grass bent",
  Ox:            "settles in the worn furrow, slow as time",
  Sleipnir:      "claims the wide trail",
  Stag:          "stands antlered at the quiet edge",
  Tarasque:      "settles in the mossiest corner",
  Unicorn:       "claims an apple-tree clearing in the wood",
  Yale:          "claims a horned corner of the wood",

  // ── Bears, mustelids, large mammals ───────────────────────
  Badger:        "claims a low burrow at the hedge",
  Bear:          "settles into a den-corner of the wood",
  Beaver:        "claims a dam-corner of the stream",
  Behemoth:      "claims the broadest meadow",
  Bunyip:        "claims the deepest still pool",
  Elephant:      "settles in the wide grass, slow as memory",
  Marten:        "claims a high-branch corner of the wood",
  Mink:          "claims the bank-edge",
  Mole:          "tunnels into a soft patch of the wood and disappears",
  "Mokele-Mbembe":"claims the river-bend",
  Mongoose:      "settles ready at the spice-tree",
  Otter:         "claims a quiet stream-bank in the wood",
  Sasquatch:     "settles between the cedars",
  Sloth:         "settles in the slowest tree. Will be there a while.",
  Stoat:         "claims a meadow-corner of the wood",
  Tanuki:        "settles at the edge with a sake gourd",
  Yeti:          "claims the snowed corner",

  // ── Reptiles, dragons, serpents ───────────────────────────
  Amphithere:    "claims a feathered branch in the canopy",
  Basilisk:      "settles in the shaded stones, eyes averted",
  Cockatrice:    "settles in the nest-corner",
  Frog:          "claims a wet leaf at the pond",
  Knucker:       "claims the deep round pool",
  Lindworm:      "coils itself into the deepest root",
  Naga:          "claims the spring-mouth",
  Ouroboros:     "claims a circular corner of the wood",
  Salamander:    "curls into a warm coal at the hearth-stone",
  Tianlong:      "settles above the wood at dawn",
  Tortoise:      "finds a flat stone in the wood and stays",
  Wyrm:          "tunnels through the longest grass",
  Wyvern:        "claims a high crag in the wood and folds its wings",
  Xuanwu:        "claims a still pool of the wood",

  // ── Hybrids, chimerics, monsters ──────────────────────────
  Cetus:         "claims the deepest pool",
  Chimera:       "settles in a many-headed corner of the wood",
  Griffon:       "claims a high-stone perch in the wood",
  Hydra:         "claims the swamp-corner",
  Manticore:     "claims a watchful corner of the wood",
  Sphinx:        "settles at the riddle-stone",
  Pyralis:       "claims the heart of the small fire",

  // ── Fae & wisps ───────────────────────────────────────────
  Brownie:       "settles in a tidy corner of the wood",
  Dryad:         "claims a particular oak in the wood",
  Faerie:        "settles by the smallest firelight",
  Faun:          "claims a piping corner of the wood",
  Greenman:      "gathers from leaves and stands at the heart",
  Hob:           "settles by the hearth-tile",
  Hobgoblin:     "claims a leaf-pile in the wood and tips a red cap",
  Kitsune:       "claims a sunlit corner of the wood, nine tails settling",
  Leshy:         "the forest shifts a step closer at the edge",
  Naiad:         "claims the spring-mouth of the wood",
  Nymph:         "settles into a dappled corner of the wood",
  Pixie:         "claims a flowerbed corner of the wood",
  Pooka:         "claims a shape-shifting corner of the wood",
  Rusalka:       "claims the stream, hair still wet",
  Selkie:        "claims the seal-shore",
  Sidhe:         "claims the hollow hill",
  Sprite:        "claims a flicker-corner of the coals",
  Tengu:         "claims the high pine",
  Wisp:          "claims a moor-corner of the wood",
  "Yuki-Onna":   "the snow stills around her in a quiet wood corner",

  // ── Household spirits & local deities ─────────────────────
  Domovoi:       "claims the pantry-shadow",
  Hestia:        "tends a low flame at the hearth",
  Lar:           "claims the doorway",
  Lares:         "claim a small-statue corner of the wood",
  Penates:       "claim the threshold",
  Vesta:         "kindles a small steady fire at the center",

  // ── Greek / Roman titans, gods, mythic figures ────────────
  Aeolus:        "loosens a small wind across the wood",
  Aion:          "claims the still center",
  Anthousai:     "claim a petal-edge of the wood",
  Aphrodite:     "claims a rose-corner of the wood",
  Apollo:        "tunes a lyre at the far edge",
  Argonaut:      "claims a far shore of the wood",
  Argus:         "claims a watchful clearing in the wood",
  Asclepius:     "settles at the healing-spring",
  Athena:        "claims an olive corner of the wood",
  Atlas:         "shoulders the stone arch",
  Augur:         "claims a watching-stone of the wood",
  Bacchus:       "claims a vine-crowned corner of the wood",
  Caryatid:      "stands very still under the stone arch",
  Cernunnos:     "claims a beast-ringed clearing in the wood",
  Cherub:        "claims a sky-corner of the wood",
  Comus:         "claims a honeycomb corner of the wood",
  Cynthia:       "claims a moon-bright clearing of the wood",
  Demeter:       "claims a grain-field edge of the wood",
  Dionysus:      "claims a vine-crowned corner of the wood",
  Dioscuri:      "claim a twin-stone clearing in the wood",
  Eos:           "claims the eastern dawn-edge",
  Galene:        "claims the calmest water",
  Helios:        "claims the noon arc",
  Hemera:        "lifts the bright day above the wood",
  Hephaestus:    "claims a forge-edge of the wood",
  Hespera:       "lights a low lantern at the evening edge",
  Hesperide:     "claims an apple-tree corner of the wood",
  Hekate:        "claims a triple-crossroad corner of the wood",
  Horae:         "claim a season-edge of the wood",
  Hygieia:       "settles at the healing pool",
  Hypnos:        "scatters poppy seed in the quiet hollow",
  Iris:          "leaves a faint rainbow at the rim",
  Janus:         "claims the gate, looking both ways",
  Lethe:         "claims the dark-water stream",
  Melissa:       "claims a hive-corner of the wood",
  Menthe:        "claims a mint-edge of the wood",
  Mneme:         "claims a memory-stone of the wood",
  Mnemosyne:     "the river of memory pauses through the wood",
  Monad:         "claims a single still center of the wood",
  Morpheus:      "settles in a dream-corner of the wood",
  Nemesis:       "claims a balance-stone of the wood",
  Persephone:    "claims a spring-doorway of the wood",
  Polestar:      "fixes itself above the wood",
  Proteus:       "claims a shifting tide-pool of the wood",
  Pythia:        "claims an oracle-edge of the wood",
  Saturnalia:    "claim a feast-corner of the wood",
  Selene:        "draws her silver chariot across the wood",
  "Sol Invictus":"claims the high noon",
  Themis:        "claims a balance-stone of the wood",
  Wormwood:      "claims a dry-stem corner of the wood",

  // ── Norse / Germanic ──────────────────────────────────────
  Boreas:        "claims the north wind",
  Heimdall:      "claims the bridge",
  Loki:          "claims an unpredictable corner of the wood",
  Odin:          "claims the high seat, two ravens nearby",
  Skadi:         "claims the snowed pass",

  // ── Celtic / Slavic / Germanic spirits ────────────────────
  "Baba Yaga":   "her hut settles on chicken legs at the edge",
  Brigid:        "warms her open palms at the hearth",
  Druid:         "settles in the old oak",
  Kupala:        "claims a bonfire corner of the wood",
  Strega:        "claims a hearth-corner of the wood",

  // ── East/South Asian, African, Mesoamerican ───────────────
  Anansi:        "spins a thread in the corner and waits",
  "Banyan Spirit":"settles among many-rooted trunks in the wood",
  Banyan:        "settles among many-rooted trunks in the wood",
  Bodhisattva:   "settles cross-legged at the still center",
  Brahman:       "claims a river-bank corner of the wood",
  Chajin:        "claims a tea-bench corner of the wood",
  Condor:        "claims a high-peak corner of the wood",
  Daemon:        "settles into a quiet inner corner of the wood",
  Dervish:       "claims a turning circle of the wood",
  Hierophant:    "claims a temple-stone of the wood",
  Hesychast:     "claims a still cell-corner of the wood",
  Hermes:        "claims a crossroads corner of the wood",
  Mandragora:    "settles in a root-corner of the wood",
  Nabu:          "claims a writing-stone of the wood",
  Saraswati:     "tunes a vina at the library-edge",
  Sennin:        "claims a high-mountain ledge of the wood",
  Tezcatlipoca:  "claims a smoke-mirror corner of the wood",
  Thoth:         "claims a scroll-bench of the wood",
  Yggdrasil:     "the world-tree's roots find a deep corner of the wood",

  // ── Journal-spirit creatures ──────────────────────────────
  Inkling:       "claims a thought-edge of the wood",
  Scrivener:     "claims a desk-corner of the wood with a candle",
  Annal:         "claims a marked-page corner of the wood",
  Cicada:        "claims a high-tree corner of the wood",
  Wagtail:       "claims a riverbank corner of the wood",
  Cricket:       "settles into the long grass",
  Linnet:        "claims a hedgerow corner of the wood",
  "Owl-Scribe":  "claims a quill-perch of the wood",
  "Lark-Scribe": "claims a sunrise-edge of the wood",
  "Margin-Cat":  "curls along the page-edge",
  Lapwing:       "claims a familiar field of the wood",

  // ── Misc ──────────────────────────────────────────────────
  Alchemist:     "claims a bottle-cluttered corner of the wood",
  Bard:          "claims a harp-corner of the wood",
  Camellia:      "the leaf-flowering tree finds a corner of the wood",
  Daimon:        "settles into a quiet inner corner of the wood",
  Ent:           "settles in the oldest tree-circle",
  Flora:         "claims a meadow-bloom of the wood",
  Methuselah:    "claims a long-beard corner of the wood",
  Sage:          "claims a quiet hut at the edge",
  Zaratan:       "the island-turtle surfaces under a corner of the wood",
};

const FALLBACK_VERB = "drifts to a corner of the wood and settles in";

// Returns the arrival verb-phrase for a given elemental name. Tries the
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

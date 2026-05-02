/* ──────────────────────────────────────────────────────────────
   data/elementalArrivals.js — arrival verb-phrases for elemental pop-ups.

   When a new elemental is summoned, the pop-up reads:
     "{elemental.name} {arrival verb}."

   Voice is field-notebook naturalist: each line is a short
   observation of *behavior* — how the creature moves, holds itself,
   feeds, watches. We avoid the territorial-claim template ("claims
   a corner of the wood") in favor of specific habits and postures
   so the bestiary reads as a record of beings, not slots.

   Patterns to favor:
     • Movement verbs: hovers, perches, circles, treads, slips,
       tucks, drifts, balances.
     • Sensory detail: ears flicking, throat pulsing, color shifting,
       eyes half-closed.
     • A single telling habit that anchors the creature.

   The mapping tries the full name first, then the last word, so
   "The Banyan Spirit" matches "Banyan Spirit" before falling back
   to "Spirit", and "The Caladrius" matches "Caladrius" directly.
   ────────────────────────────────────────────────────────────── */

const ARRIVAL_VERBS = {
  // ── Birds & winged things ─────────────────────────────────
  Bat:           "tucks upside-down beneath the lantern-eaves, wings folded close",
  Bee:           "works the busiest blossom, legs powdered with pollen",
  Bennu:         "lifts its wings once, then settles on a sun-warmed stone",
  Caladrius:     "alights on a white branch, head turned toward the light",
  Canary:        "perches at a bright window-corner, throat trembling",
  Cardinal:      "lands on the reddest winter branch and stays",
  Crane:         "folds long legs into the still pool, motionless",
  Dove:          "settles on the lowest quiet bough, breast pulsing soft",
  Falcon:        "perches on the highest crag, eyes never moving",
  "Feng-Huang":  "stirs the most colored leaves, then settles among them",
  Garuda:        "spirals down to the highest peak, wings sweeping",
  Goldfinch:     "balances on a thistle-edge, picking at the seed-head",
  Halcyon:       "drifts onto the calmest pool, ripples easing around it",
  Hawk:          "rides a wind-thermal in tightening circles",
  Heron:         "stalks the reed-edged shallows, one leg lifted",
  Hummingbird:   "hovers at the brightest blossom, wings invisible",
  Lampad:        "ducks beneath the dimmest lantern, flame-light pooling",
  Lark:          "climbs the bright sky in a vertical spiral, singing",
  Magpie:        "circles a bright object, picks it up, sets it down again",
  Mockingbird:   "borrows three voices in quick succession from the wood-edge",
  Mantis:        "holds the driest stem, forelegs raised, perfectly still",
  Newt:          "slips through wet moss, leaving the smallest trail",
  Oriole:        "flashes orange through high leaves, gone again",
  Owl:           "rotates its head once, then disappears into a tall hollow",
  Hoopoe:        "flicks its crown of feathers up, then back down",
  Stork:         "stands tall at the reed-edge, bill clattering once",
  Octopus:       "fills a tide-pool, color shifting through three shades",
  Pegasus:       "lands in the open meadow, wings folding with one soft beat",
  Pelican:       "scoops the quiet shore, then sits with bill on chest",
  Phoenix:       "alights in the sun-warmed clearing, feathers smoking faintly",
  Quetzal:       "settles in the deepest green canopy, long tail trailing",
  Raven:         "watches from the highest fence-post, head cocked",
  Robin:         "perches on a wet branch, throat warming",
  Roc:           "shadows half the wood, then folds onto its highest ridge",
  Simurgh:       "alights on the most ancient bough, plumage shimmering",
  Sparrow:       "darts under the eaves and tucks in",
  Swan:          "drifts onto the still pond and folds its long neck back",

  // ── Small creatures, rodents, insects ─────────────────────
  Beetle:        "trundles onto an open petal, wing-cases clicking shut",
  Capybara:      "wades into the shallow pool, half-submerged, eyes closing",
  Chipmunk:      "darts onto a stone-stack, cheeks already full",
  Dormouse:      "curls into a warm wood-hollow, half-asleep already",
  Hare:          "freezes in the meadow, ears swiveling",
  Hedgehog:      "burrows into a leaf-pile, only spines showing",
  Marmot:        "whistles once from the ridge-stone and stays",
  Mouse:         "vanishes into a wood-burrow with a flick of tail",
  Quokka:        "settles at the grass-edge, mouth in a small grin",
  Rabbit:        "freezes in the clover, then resumes nibbling",
  Spider:        "drops a fresh web into the quiet corner, legs folded",
  Squirrel:      "spirals up the tallest oak, scolding as it goes",
  Trout:         "holds in the slow eddy, fins barely moving",
  Vole:          "tunnels through a wood-grass run, whiskers first",
  Wombat:        "shoulders into a self-dug burrow, dirt scattering behind",

  // ── Felines ───────────────────────────────────────────────
  "Bai-Hu":      "paces the western ridge once, then sits and watches",
  Bakeneko:      "settles in moonlit shadow, tail unusually long",
  Cat:           "claims a sunbeam at the threshold, eyes half-closed",
  Cheetah:       "settles on the open savannah patch, tail-tip twitching",
  Cougar:        "watches from the high cliffside, motionless",
  Jaguar:        "drinks from the river-bank, then disappears upstream",
  Lynx:          "treads softly through snow, leaving no print",
  Tiger:         "moves through tall grass — only the stripes giving it away",

  // ── Canines ───────────────────────────────────────────────
  Cerberus:      "settles at the deepest gate, three heads alert in turn",
  Coyote:        "trots the dusk-edge, looks back once, gone",
  Crow:          "watches from the high fence-post, head cocked at every sound",
  "Cu Sith":     "moves through the heath, green coat blending in",
  "Doom-Wolf":   "circles the deepest pine three times, then beds down",
  Fox:           "curls in a sunlit hollow, eyes half-closed",
  Wolf:          "circles the pine line and beds down",
  Wolverine:     "scrabbles up a stony outcrop and settles, watching",

  // ── Hooved & equine ───────────────────────────────────────
  Auroch:        "stands on the open plain, head lowered, breath misting",
  Bicorn:        "settles in the stone-circle, two horns catching light",
  Boar:          "wallows in warm mud, eyes closing slowly",
  Bonnacon:      "snorts a smoke-edged warning, then settles",
  "Winged-Steed": "alights with a peacock-tail spread, then folded",
  Bull:          "stands in the open meadow, hooves planted",
  Camel:         "kneels onto sun-warmed sand, eyes blinking slowly",
  Catoblepas:    "settles in the lowest valley, head heavy on the ground",
  Doe:           "steps soft-hoofed across the wood, ears flicking back",
  Fawn:          "wobbles into the wood, finding its legs",
  Goat:          "balances on the tallest stone, surveying",
  Hippocampus:   "rises in the seafoam, mane streaming",
  Hippogriff:    "lands in the open clearing, wings folding",
  Horse:         "canters the open run, then walks back, head high",
  Jackalope:     "freezes antlered in the hare-meadow, then bounds away",
  Kelpie:        "rises from the loch-edge, water sluicing off",
  Kirin:         "treads softly through the wood, leaving no grass bent",
  Ox:            "leans into the worn furrow, slow as time",
  "Eight-Legged Steed": "moves the wide trail at impossible speed, then stops",
  Stag:          "lifts its antlered head at the quiet edge, then steps back",
  Tarasque:      "settles into the mossiest corner, six legs tucked under",
  Unicorn:       "appears in an apple-tree clearing — gone if looked for twice",
  Yale:          "swivels both horns to face every direction at once",

  // ── Bears, mustelids, large mammals ───────────────────────
  Badger:        "shoulders into a low burrow at the hedge",
  Bear:          "ambles into a den-corner and lowers itself in",
  Beaver:        "patrols a dam-corner, slapping the water once in warning",
  Behemoth:      "stands in the broadest meadow, weight settling the ground",
  Bunyip:        "rises from the deepest still pool, then sinks again",
  Elephant:      "moves through the wide grass at the pace of memory",
  Marten:        "balances along a high branch, gone behind the leaves",
  Mink:          "slips along the bank-edge, soaked and silent",
  Mole:          "tunnels through soft earth and disappears beneath the wood",
  "Mokele-Mbembe":"rises from the river-bend, water beading off scales",
  Mongoose:      "stalks the spice-tree's base, body low, eyes bright",
  Otter:         "rolls in the quiet stream-bank, paws to the sky",
  Sasquatch:     "steps between the cedars, then waits",
  Sloth:         "moves into the slowest tree. Will be there a while.",
  Stoat:         "darts through the meadow, white-bellied",
  Tanuki:        "settles at the edge with a sake gourd, eyes mischievous",
  Yeti:          "steps from the snowed corner, fur white on white",

  // ── Reptiles, dragons, serpents ───────────────────────────
  Amphithere:    "drapes a feathered length along a high branch",
  Basilisk:      "curls in the shaded stones, eyes carefully averted from yours",
  Cockatrice:    "settles into its nest-corner, eye fixed on the moss",
  Frog:          "balances on a wet leaf, throat pulsing",
  Knucker:       "fills the deep round pool, only ripples giving it away",
  Lindworm:      "coils itself into the deepest root, slow breath cycling",
  Naga:          "rises from the spring-mouth, hood spreading",
  Ouroboros:     "loops back on its own tail in one slow turn",
  Salamander:    "curls into a warm coal at the hearth-stone, tail sparking",
  Tianlong:      "drifts above the wood at dawn, scales catching first light",
  Tortoise:      "finds a flat stone and settles for the duration",
  Wyrm:          "tunnels through the longest grass, only the wake visible",
  Wyvern:        "lands on a high crag, wings folding twice before stilling",
  Xuanwu:        "sinks into a still pool, only the dark shell showing",

  // ── Hybrids, chimerics, monsters ──────────────────────────
  Cetus:         "rises from the deepest pool, then sinks back",
  Chimera:       "settles with three heads turning in three directions",
  Griffon:       "lands on a high stone perch, talons flexing on the rock",
  Hydra:         "settles into the swamp-corner, heads counting one another",
  Manticore:     "watches from a corner of the wood, tail arched",
  Sphinx:        "settles at the riddle-stone, voice held back",
  Pyralis:       "lives inside the heart of the small fire, unburned",

  // ── Fae & wisps ───────────────────────────────────────────
  Brownie:       "tidies a corner of the wood, smaller than you remember",
  Dryad:         "leans into a particular oak, becoming part of it",
  Faerie:        "settles by the smallest firelight, wings still",
  Faun:          "pipes a single note from a corner of the wood",
  Greenman:      "gathers from the leaves until he stands at the heart",
  Hob:           "settles by the hearth-tile, knees drawn up",
  Hobgoblin:     "tips a red cap from a leaf-pile and grins",
  Kitsune:       "settles with nine tails fanning out one by one",
  Leshy:         "the forest shifts a step closer at the edge",
  Naiad:         "rises from the spring-mouth, hair still wet",
  Nymph:         "settles into a dappled corner — half-light, half-leaf",
  Pixie:         "darts into a flowerbed, then stillness",
  Pooka:         "shifts shape three times before settling on a black horse",
  Rusalka:       "rises from the stream, hair clinging to her arms",
  Selkie:        "lifts from the seal-shore, sloughs off the seal-skin",
  Sidhe:         "appears at the hollow hill — gone the moment you turn",
  Sprite:        "flickers among the coals, never the same color twice",
  Tengu:         "watches from the high pine, long-nosed, arms folded",
  Wisp:          "drifts the moor at knee-height, then disappears",
  "Yuki-Onna":   "steps from the snow, the air around her stilling",

  // ── Household spirits & local deities ─────────────────────
  Domovoi:       "settles into the pantry-shadow, only the eyes catching light",
  Hestia:        "tends a low flame at the hearth, hands cupped around it",
  "Threshold-Spirit":           "stands at the doorway, neither in nor out",
  Lares:         "gather around a small-statue corner, hands clasped",
  Penates:       "stand at the threshold, watching both sides",
  Vesta:         "kindles a small steady fire at the center, never flickering",

  // ── Greek / Roman titans, gods, mythic figures ────────────
  Aeolus:        "loosens a small wind across the wood, leaves turning",
  "Aeon-Spirit":          "stands at the still center, time holding around him",
  "Flower-Nymphs":     "gather at a petal-edge, weaving small chains",
  Aphrodite:     "settles among the roses, the wood quieter for it",
  "Lyrebird":        "tunes a lyre at the far edge — three notes, no song",
  Argonaut:      "comes ashore at a far edge, oar still in hand",
  Argus:         "watches from a clearing, every eye opening in turn",
  Asclepius:     "kneels at the healing-spring, staff laid at the rim",
  "Mind-Owl":        "perches on an olive branch, watching the dim hours",
  Atlas:         "shoulders the stone arch, knees just bent",
  Augur:         "watches from a watching-stone, reading the high birds",
  Bacchus:       "settles vine-crowned, a half-emptied cup nearby",
  Caryatid:      "stands very still under the stone arch, weight balanced",
  "Antlered Spirit":     "steps into a beast-ringed clearing, antlers settling",
  Cherub:        "hovers at a sky-corner, wings small and steady",
  Comus:         "settles in a honeycomb corner, sticky-fingered",
  Cynthia:       "steps into a moon-bright clearing, pale and slow",
  "Field-Doe":       "grazes a grain-field edge, ears flicking",
  "Vine-Reveler":      "winds vines around a corner, laughing softly",
  Dioscuri:      "stand at a twin-stone clearing, never apart",
  Eos:           "lifts the eastern dawn-edge with both hands",
  Galene:        "calms the water around her, ripples easing",
  Helios:        "stands at the noon arc, casting no shadow",
  Hemera:        "lifts the bright day above the wood, palms open",
  Hephaestus:    "settles at a forge-edge, hammer at rest beside him",
  "Evening-Lamp Spirit":       "lights a low lantern at the evening edge, wick first",
  Hesperide:     "tends an apple-tree corner, gold among the leaves",
  Hekate:        "stands at a triple-crossroad, three torches lit",
  Horae:         "rotate at a season-edge, one stepping forward",
  Hygieia:       "settles at the healing pool, palm laid on the surface",
  Hypnos:        "scatters poppy seed in the quiet hollow, eyes lowered",
  Iris:          "leaves a faint rainbow at the rim, then is gone",
  Janus:         "stands at the gate, looking both ways at once",
  "Forgetting-Spirit":         "trails fingertips through the dark-water stream",
  Melissa:       "tends a hive-corner, hands honey-slick",
  "Mint-Nymph":        "settles among mint-stems, breath cool",
  "Memory-Spirit":         "rests her hand on a memory-stone, listening",
  Mnemosyne:     "the river of memory pauses around her",
  Monad:         "stands at a single still center, indivisible",
  "Dream-Spirit":      "settles in a dream-corner, eyes closed but seeing",
  "Reckoner":       "weighs a balance-stone, neither side falling",
  Persephone:    "steps through a spring-doorway — half here, half away",
  Polestar:      "fixes itself above the wood, never moving",
  "Shape-Shifter Spirit":       "ripples through three forms in a tide-pool",
  Pythia:        "settles at an oracle-edge, breath rising as fume",
  Saturnalia:    "set a feast-corner, laughter spilling over",
  Selene:        "draws her silver chariot across the wood, slow",
  "Sol Invictus":"stands at the high noon, unconquered",
  Themis:        "weighs a balance-stone, eyes covered",
  Wormwood:      "stands brittle in a dry-stem corner, scent rising",

  // ── Norse / Germanic ──────────────────────────────────────
  Boreas:        "draws the north wind across the wood, cold-handed",
  Heimdall:      "stands at the bridge, horn at the lip",
  Loki:          "settles in an unpredictable corner, smile not quite right",
  "Wanderer-Raven":          "claims the high seat, two ravens settling nearby",
  Skadi:         "treads the snowed pass on bone skis",

  // ── Celtic / Slavic / Germanic spirits ────────────────────
  "Wood-Crone":   "her hut settles on chicken legs at the edge",
  Brigid:        "warms her open palms at the hearth",
  Druid:         "settles in the old oak, becoming part of the bark",
  Kupala:        "tends a bonfire corner, sparks rising into the wood",
  Strega:        "stirs a hearth-corner pot, tasting from a wooden spoon",

  // ── East/South Asian, African, Mesoamerican ───────────────
  Anansi:        "spins a thread in the corner and waits, eight legs perfectly still",
  "Banyan Spirit":"settles among many-rooted trunks, hands resting on bark",
  Banyan:        "settles among many-rooted trunks, slow as the tree itself",
  Bodhisattva:   "settles cross-legged at the still center, palms open",
  Brahman:       "kneels at a river-bank, hands cupped to the water",
  Chajin:        "settles at a tea-bench, the kettle already at temperature",
  Condor:        "rides a high-peak thermal in slow circles",
  Daemon:        "settles into a quiet inner corner, watching from within",
  Dervish:       "turns a slow circle, robes sweeping outward",
  Hierophant:    "stands at a temple-stone, hand raised in silent benediction",
  Hesychast:     "settles in a still cell-corner, breath the only sound",
  Hermes:        "appears at a crossroads, a finger lifted in greeting",
  Mandragora:    "roots into a dark-soil corner, leaves quivering",
  Nabu:          "settles at a writing-stone, stylus poised",
  "Vina-Tuner Spirit":     "tunes a vina at the library-edge, one string at a time",
  Sennin:        "settles on a high-mountain ledge, gourd at his side",
  "Smoke-Jaguar":  "settles in a smoke-mirror corner, spotted shadow shifting",
  Thoth:         "settles at a scroll-bench, ibis-head bent in writing",
  Yggdrasil:     "the world-tree's roots reach a deep corner of the wood",

  // ── Journal-spirit creatures ──────────────────────────────
  Inkling:       "settles at a thought-edge, just out of focus",
  Scrivener:     "settles at a desk-corner with a lit candle",
  Annal:         "settles at a marked-page corner, ribbon between the leaves",
  Cicada:        "calls from a high-tree corner, then silence",
  Wagtail:       "bobs along the riverbank, tail flicking with each step",
  Cricket:       "settles into the long grass, song starting",
  Linnet:        "perches at a hedgerow edge, pinkish-breasted",
  "Owl-Scribe":  "settles at a quill-perch, eye on the page below",
  "Lark-Scribe": "claims a sunrise-edge, dipping a quill into morning",
  "Margin-Cat":  "curls along the page-edge, tail cradling the words",
  Lapwing:       "flies a familiar field, calling its own name",

  // ── Misc ──────────────────────────────────────────────────
  Alchemist:     "settles at a bottle-cluttered corner, a small flame burning",
  Bard:          "tunes a harp at the edge — three strings only",
  Camellia:      "the leaf-flowering tree sets down at a corner, blossoms opening",
  Daimon:        "settles into a quiet inner corner, watching from inside",
  Ent:           "moves into the oldest tree-circle, slow as bark",
  Flora:         "scatters small blooms across a meadow corner",
  Methuselah:    "settles in a long-beard corner, slow with years",
  Sage:          "settles in a quiet hut at the edge, kettle on the fire",
  Zaratan:       "the island-turtle surfaces under a corner of the wood",
};

const FALLBACK_VERB = "moves into a quiet corner of the wood, watchful";

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

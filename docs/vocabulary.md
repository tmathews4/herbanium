# Herbanium Vocabulary

> Canonical reference for the words Herbanium uses to describe
> flavor, mouthfeel, and effect. All research files, ingredient
> data, and UI copy should align with this vocabulary.

## Principle

We use tea-community-standard vocabulary — the words that sommeliers,
tea journalists, cha qi practitioners, and the established flavor-wheel
traditions (International Tea Masters Association, Taiwanese Tea Flavor
Wheel, Twinings, Open Door Tea) actually use. The goal is to be
accessible (a reader doesn't need a sommelier glossary to parse it) and
accurate (terms match how serious tea people actually talk).

Why this matters: the ingredients themselves came from centuries-old
traditions with their own vocabularies. Using those vocabularies
respects how the material is actually discussed. Inventing our own
terms would make the app feel idiosyncratic in a way that undermines
the authority-through-humility posture the rest of the design is
building.

## The three dimensions

Serious tea tasting separates three distinct dimensions:

1. **Flavor** — what the tongue + nose detects (floral, grassy, malty)
2. **Mouthfeel** — how it feels on the palate (astringent, smooth, creamy, body)
3. **Effect** — what it does to the body and mind after drinking (calm, warming, focus)

Currently Herbanium's data model has two: flavor and effect. Mouthfeel
properties (`crisp`, `cooling`, `astringent`) are stored as flavors.
This is a known simplification — a future architectural change may
split mouthfeel out as its own dimension. For now, mouthfeel terms
live alongside flavor terms and this file lists them together.

---

## Effects (what the drink does to the body/mind)

Each effect takes a 0-5 strength rating. The complete set is organized
as pairs and singletons.

### Core TCM pair: Cooling ↔ Warming

**`cooling`** — Yin energy, TCM. Reduces internal heat, clarifies,
refreshes. Use for: green tea, young sheng pu-erh, white tea,
hibiscus, mint, light oolongs. Different from mouthfeel cooling
(TRPM8 activation from menthol), though the two can co-occur.

**`warming`** — Yang energy, TCM. Generates internal heat, nourishes
digestion, circulates. Use for: black tea, roasted oolongs, shou/ripe
pu-erh, aged sheng, ginger, cinnamon, cardamom, clove, chai, turmeric
(to an extent).

> The TCM warming/cooling axis is one of the most fundamental
> concepts in global tea culture. Representing it accurately is
> required, not optional.

### Activity axis: Calm ↔ Energy

**`calm`** — relaxing effect on the nervous system. Use for:
chamomile, lavender, rose, passionflower, lemon balm.

**`energy`** — stimulating, awakening. Use for: caffeinated teas;
mildly activating herbs. Note: "energy" in tea context is rarely
stimulant-like — more often it's the smoother caffeine-plus-L-theanine
profile or the bright refreshment from acidic/aromatic herbs.

### Alertness axis: Sleepy ↔ Focus

**`sleepy`** — sedating, restful, drowsiness-adjacent. Use for:
passionflower, strong chamomile, valerian, strong lavender.

**`focus`** — meditative clarity, attention-supporting. Use for:
green tea, matcha, gyokuro, some oolongs. This is the
L-theanine-plus-caffeine "alert calm" profile, not pure stimulation.

### Orientation axis: Grounding ↔ Uplifting

**`grounding`** — settling, centering, earthy. Use for: ripe pu-erh,
aged oolongs, ashwagandha, tulsi, some darker black teas.

**`uplifting`** — lightening, mood-lifting, bright. Use for: jasmine,
bergamot, citrus-forward teas, light oolongs, some green teas.

### Singletons (no direct opposite)

**`digestive`** — settles the stomach, aids digestion. Use for:
peppermint, ginger, fennel, chamomile (secondary). Previously called
`settle` — migration pending.

**`soothing`** — general comfort, nervous-system-settling,
warmth-of-spirit. Use for: chamomile, lemon balm, chai, passionflower.
Previously called `comfort` — migration pending.

---

## Flavors (what the drink tastes like)

Organized by core families from the tea flavor wheel tradition. Each
family has sub-descriptors. Use the most specific accurate term —
"chestnut" beats "nutty" if the tea actually tastes of chestnut.

### Floral
- `floral` — general family header
- `jasmine`, `rose`, `honeysuckle`, `orchid`, `lilac`, `violet`,
  `chrysanthemum` — specific flower references
- `perfumed` — intensely fragrant floral
- `heady` — rich, complex, slightly animalic floral depth.
  **Use this in place of the more technical "indolic."**
- `sweet-floral`

### Fruity
- `fruity` — general family header
- Citrus: `lemon`, `orange`, `bergamot`, `yuzu`
- Stone fruit: `peach`, `apricot`, `plum`
- Berry: `cranberry`, `blackberry`, `blueberry`, `raspberry`
- Tropical: `mango`, `pineapple`, `lychee`
- Dried fruit: `raisin`, `fig`, `date`
- `muscatel` — grape-like, Darjeeling signature (use specifically
  for Darjeeling and Darjeeling-adjacent teas)
- `tart` — fruity-acidic character (hibiscus, rosehip)
- `bright` — lively acidic character (prefer to "acidic")

### Vegetal
- `vegetal` — general family header
- `grassy` — fresh-cut grass
- `leafy` — spinach, kale, greens
- `marine`, `briny` — seaweed, oceanic (Japanese greens specifically)
- `cooked vegetable` — steamed greens

### Nutty
- `nutty` — general family header
- `almond`, `chestnut`, `hazelnut`, `walnut`, `peanut`

### Sweet (descriptive, not the tongue taste)
- `sweet` — general header (also a tongue taste; context clarifies)
- `honey`, `caramel`, `malt`, `vanilla`
- `brown sugar`, `molasses`, `toffee`
- `malty` — malt-forward, Assam signature

### Roasted
- `roasted`, `toasted`, `toasty` — general
- `coffee`, `cocoa`, `chocolate`
- `charcoal`
- `smoky` — pine-smoke character, Lapsang Souchong signature

### Earthy
- `earthy` — general family header
- `mineral` — stone, wet rock, high-mountain oolong
- `forest floor`, `mushroom`, `loam`
- `wood`, `woody` — aged teas, roasted oolongs
- `petrichor` — wet-earth-after-rain

### Spicy
- `spicy` — general family header
- `warm spice` — cinnamon, clove, cardamom, allspice
- `pungent` — ginger, black pepper, long pepper
- Specific: `cinnamon`, `clove`, `cardamom`, `ginger`, `pepper`,
  `turmeric`

### Herbaceous / Medicinal
- `herbaceous` — general
- `hay`, `dried grass` — cured-herbal character
- `camphor`, `menthol`, `minty`, `cooling` (mouthfeel-adjacent)
- `resinous` — use sparingly; `woody` often more accessible
- `eucalyptus`

### Umami / Brothy
- `umami` — savory, Japanese greens (L-theanine + glutamic acid)
- `brothy`, `savory`
- `seaweed`-adjacent flavors

### Basic tastes (the five tongue tastes)

These are real flavor attributes, distinct from the aromatic families
above:

- `sweet` — mild sweetness from amino acids, polysaccharides
- `salty` — rare in tea; sometimes in seaweed-adjacent Japanese greens
- `sour`, `acidic` — prefer `tart` or `bright` (more evocative)
- **`bitter`, `bitterness`** — catechins in over-extracted green tea,
  gentian, wormwood. **This is a flavor, NOT an effect.** Previously
  miscategorized as effect in Herbanium's data model.
- `umami` — see above

---

## Mouthfeel (currently stored alongside flavor)

These are real mouthfeel properties distinct from flavor, but we
currently store them in the flavors list for data-model simplicity:

- **`astringent`** / **astringency** — the drying, puckering sensation
  from tannins. **Different from bitterness.** Astringent is the
  tongue-and-mouth dryness; bitter is the back-of-tongue taste.
- `brisk` — lively, refreshing (common in black teas, green teas)
- `smooth`, `silky`, `creamy`, `buttery` — body qualities
- `crisp` — clean, refreshing finish
- `cooling` — TRPM8 activation from menthol (also can appear as effect)
- `oily`, `thick` — body qualities
- `light`, `medium`, `full` — body intensity
- `long finish`, `lingering` — aftertaste duration
- `hui gan` — the sweet returning aftertaste (Chinese term, use when
  genuinely present; not for general mild sweetness)

---

## Usage rules

1. **One descriptor per rating.** `heady-sweet` is two flavors, not
   one. List each separately with its own rating if both apply.

2. **Prefer specific to generic.** `chestnut` beats `nutty` when
   accurate. `jasmine` beats `floral` when describing jasmine tea
   itself. Specific descriptors are more evocative and more useful
   for the algorithm.

3. **Prefer tea-community terms to perfumery or academic terms.**
   `heady` over `indolic`. `bright` over `acidic`. `malty` over
   `grain-like`. Accessibility and accuracy converge when we stay
   in the vocabulary the ingredient's own tradition uses.

4. **Effects are body experiences, not emotions.** `cooling` yes;
   `happy` no. The body-mind distinction matters — the app's effects
   track felt physiological-emotional states, not mood attributions.

5. **Use `warming` when it applies.** For black teas, roasted oolongs,
   spices, chai, ripe pu-erh, ginger, cinnamon. The TCM warming/
   cooling axis is real tea vocabulary and ignoring it breaks half
   the catalog's honest representation.

6. **Don't invent new descriptors when standard ones fit.** Before
   adding a new flavor word, check this file and the major tea
   flavor wheels. If none of them have a word for what you're
   describing, reconsider whether you're describing the actual tea
   or describing a personal impression.

7. **Be precise about mouthfeel vs. flavor vs. effect.** `bitter` is
   a flavor (tongue taste). `astringent` is mouthfeel (tannin
   dryness). `cooling` can be mouthfeel (menthol TRPM8 activation)
   or effect (TCM Yin energy) — sometimes both.

---

## Migration status (for existing research files)

When the vocabulary changed, existing files need patching. Status:

- [x] `warming` added as an effect
- [x] `grounding`, `uplifting` added as effects
- [x] `bitterness` classified as flavor, not effect — files patched
- [x] `indolic` → `heady` in jasmine file
- [ ] `settle` → `digestive` (app data migration, not research files — deferred)
- [ ] `comfort` → `soothing` (app data migration, not research files — deferred)
- [ ] Mouthfeel as a separate data dimension — future architectural change

---

## Appendix: Sources

Tea flavor wheels consulted:
- International Tea Masters Association (ITMA) aroma wheel
- Taiwanese Tea Flavor Wheel (Living Roots USA)
- Twinings flavor wheel
- Open Door Tea flavor wheel
- Herbs & Kettles tea flavor wheel (three-tier)
- World Tea Academy sommelier vocabulary
- Kevin Gascoyne, *Tea: History, Terroirs, Varieties*
- Specialty Coffee Association flavor wheel (for cross-reference)

TCM warming/cooling framework:
- Lu Yu, *Cha Jing* (Classic of Tea, ~760 CE) — historical foundation
- Contemporary tea vendor taxonomies (Rishi Tea, Path of Cha,
  Orientaleaf) — modern cha qi framings
- Traditional Chinese Medicine texts on food energetics

Community practice:
- Steepster community tasting notes (most-frequent-descriptor
  analysis by Peter Lista)
- Rishi Tea's mood taxonomy (Energizing & Awakening, Calming &
  Restful, Detox & Digestif, Focus & Meditative, Fortify & Revive)

/* ──────────────────────────────────────────────────────────────
   Herbanium — INGREDIENTS data

   Vocabulary: v1 (see docs/vocabulary.md).
   Catalog: 46 ingredients (Phase 0 + Phase A + Phase B).
   Research files: docs/research/ingredients/<name>.md

   Schema (all fields except `name` are optional):

   - name              display label
   - latin             botanical binomial
   - aliases           array of cultural/common names
   - category          true tea | herbal | flower | spice | adaptogen
   - subcategory       black | green | white | oolong | pu-erh |
                       leaf | root | flower | rhizome | fungus | …
   - caffeine          mg per typical cup (8oz / 250ml unless noted)
   - tempC             [min, max] in Celsius
   - timeS             [min, max] in seconds
   - dose              short user-facing dosing string
   - effects           [[effect, 0–5], …] vocabulary v1
   - flavors           array of sensory descriptors
   - basicTastes       { sweet, bitter, astringent, … : 0–5 }
   - pairs             array of catalog keys
   - blurb             short user-facing description
   - headsUp           short user-facing safety summary (string|null)
   - safetyFlags       structured safety data (object)
   - confidenceMarkers evidence levels per claim (object)
   - variants          [{ intent, tempC, timeS, note }]
   - preparationPattern  steep | whisk | decoction | gourd | long-infusion-optional
   - relatedIngredient   key linking same-plant different-prep entries
   - harmonizerFlag      true for blend-harmonizer ingredients (TCM 君臣佐使)
   - bioenhancer         true for pharmacokinetic-synergy ingredients
   - gradeMatters        true where grade variation is fundamental
   - childrenFriendly    true for traditionally pediatric-safe entries
   - petSafe             true for non-toxic-to-common-pets entries
   - effectTimeframe     "chronic-build-not-acute" for slow-acting ingredients
   ────────────────────────────────────────────────────────────── */

const INGREDIENTS = {
  /* ── florals & calming herbs ──────────────────────────────── */

  chamomile: {
    name: "Chamomile", latin: "Matricaria chamomilla", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["calm", 4], ["sleepy", 3], ["soothing", 3]],
    flavors: ["honey", "apple", "floral", "hay"],
    pairs: ["lavender", "lemonbalm", "rose", "passionflower", "fennel", "linden"],
    dose: "1 tsp · 200ml",
    headsUp: "Ragweed family — uncommon cross-allergy.",
    blurb: "A small daisy that closes its petals at dusk — and asks the cup to do the same. The apigenin in its honey-apple flowers slips into the same receptors as evening's first long breath.",
    variants: [
      { intent: "sleep",     tempC: 100, timeS: 420, note: "Full-boil, long steep releases apigenin." },
      { intent: "calm",      tempC: 95,  timeS: 300, note: "Slightly cooler for a lighter, floral cup." },
      { intent: "digestion", tempC: 100, timeS: 240, note: "Brisk steep — take after a heavy meal." },
    ],
  },
  lavender: {
    name: "Lavender", latin: "Lavandula angustifolia", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [180, 240],
    effects: [["calm", 3], ["sleepy", 2], ["soothing", 2]],
    flavors: ["floral", "pine", "camphor"],
    pairs: ["chamomile", "rose", "lemonbalm", "passionflower", "linden"],
    dose: "½ tsp · 200ml",
    headsUp: null,
    blurb: "Named for the Latin lavare — to wash. Linen chests, sleep pillows, and now your cup. The linalool inside reaches the brain through breath as much as through liquid; pour the kettle and the perfume is already half the work.",
  },
  rose: {
    name: "Rose Petal", latin: "Rosa × damascena", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calm", 3], ["soothing", 3], ["sleepy", 2]],
    flavors: ["floral", "sweet", "fruity"],
    pairs: ["chamomile", "lavender", "hibiscus", "cardamom", "tulsi", "vanilla", "white", "oolong", "linden", "elderflower"],
    dose: "1 tsp · 200ml",
    headsUp: "Source food-grade petals — ornamental roses may carry pesticide residue.",
    blurb: "Persian distillers chasing the soul of the flower invented attar of rose; what's left in the petal is gentler — a quiet calming and a memory of the garden. Pour gently; the cup forgives nothing about hard water.",
  },
  jasmine: {
    name: "Jasmine", latin: "Jasminum sambac", category: "flower",
    caffeine: 0, tempC: [75, 85], timeS: [120, 180],
    effects: [["calm", 3], ["energy", 2], ["focus", 2]],
    flavors: ["floral", "sweet", "honeyed", "heady"],
    pairs: ["sencha", "white", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Picked at dusk and laid against tea leaves through the night — the flower opens after dark, and its perfume opens with it. The same scent that quiets the nerves can also wake the mind; both are real, both at once. Boiling water erases either gift.",
  },
  passionflower: {
    name: "Passionflower", latin: "Passiflora incarnata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["calm", 3], ["sleepy", 3], ["soothing", 2]],
    flavors: ["grassy", "hay", "mild"],
    pairs: ["chamomile", "lemonbalm", "lavender", "linden", "valerian"],
    dose: "1 tsp · 200ml",
    headsUp: "Sedative — avoid combining with other sedatives or alcohol, and don't drive after. Not for pregnancy.",
    blurb: "Spanish missionaries read the Passion in its anatomy — the corona for the crown of thorns, the three styles for the nails. The cup is quieter than the imagery: a slow drift toward sleep, GABA-tuned, reliably drowsy.",
  },
  lemonbalm: {
    name: "Lemon Balm", latin: "Melissa officinalis", category: "herbal",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calm", 4], ["sleepy", 3], ["cooling", 2], ["uplifting", 2], ["soothing", 2]],
    flavors: ["citrus", "mint", "grassy"],
    pairs: ["chamomile", "peppermint", "rose", "spearmint", "lemongrass", "tulsi", "valerian", "linden", "nettle", "dandelion-leaf"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "The Greeks named her Melissa — honeybee — for the way the plant draws hives to the garden. Paracelsus called her the elixir of life. The lemon comes through clean, the lift quiet — the kind that doesn't need caffeine to find.",
  },

  /* ── cooling & digestive herbs ────────────────────────────── */

  peppermint: {
    name: "Peppermint", latin: "Mentha × piperita", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 4], ["digestive", 4], ["calm", 2], ["focus", 2]],
    flavors: ["minty", "cool", "grassy"],
    pairs: ["lemonbalm", "ginger", "rooibos", "fennel", "lemongrass", "yerba-mate", "elderflower", "linden", "nettle", "dandelion-leaf", "licorice-root"],
    dose: "1 tsp · 200ml",
    headsUp: "Can worsen acid reflux for some.",
    blurb: "Greek and Roman tables ended with mint long before anyone knew about TRPM8 — the cold-sensing receptor that menthol hijacks. The cool isn't temperature; it's a lie the tongue happily believes. The gut, separately, is grateful.",
  },
  spearmint: {
    name: "Spearmint", latin: "Mentha spicata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 3], ["digestive", 3], ["uplifting", 2], ["calm", 2]],
    flavors: ["minty", "sweet", "grassy", "cool"],
    pairs: ["lemonbalm", "sencha", "rose", "chamomile", "gunpowder"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Where peppermint borrows menthol, spearmint goes with carvone — softer, sweeter, the cool pulled back a step. Mediterranean kitchens have always treated it as the more polite cousin: the one you serve to anyone, anytime.",
  },
  lemongrass: {
    name: "Lemongrass", latin: "Cymbopogon citratus", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 3], ["uplifting", 3], ["digestive", 2], ["calm", 2]],
    flavors: ["citrus", "grassy", "bright"],
    pairs: ["ginger", "peppermint", "lemonbalm", "rose", "rooibos", "hibiscus", "yerba-mate"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Thai cooks crush the stalk before they cut it — the bruising releases citral, the same molecule that lifts the cup and keeps the mosquitoes down. Lemon's voice without lemon's bite.",
  },
  fennel: {
    name: "Fennel Seed", latin: "Foeniculum vulgare", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["digestive", 4], ["cooling", 2], ["soothing", 2], ["calm", 1]],
    flavors: ["licorice", "sweet", "aromatic"],
    pairs: ["peppermint", "ginger", "chamomile", "lemonbalm", "rooibos", "licorice-root"],
    dose: "1 tsp crushed · 200ml",
    headsUp: "Heavy doses cautioned in pregnancy — verify.",
    blurb: "Indian restaurants set a small bowl by the door; medieval congregations chewed it through long sermons. The seed's anise note is anethole, which finds GABA receptors in the gut — anxiety quiets where you didn't know it was hiding.",
  },
  hibiscus: {
    name: "Hibiscus", latin: "Hibiscus sabdariffa", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 3], ["energy", 2], ["digestive", 2]],
    flavors: ["tart", "fruity", "cranberry"],
    pairs: ["rose", "rooibos", "ginger", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "May lower blood pressure — sip modestly if relevant.",
    blurb: "Karkadé in Cairo, sorrel in the Caribbean, agua de jamaica at a Mexican lunch — the red flower travels under many names. The ruby is anthocyanin, the same pigment that colors dark berries; the tartness is the cup announcing itself.",
  },
  rooibos: {
    name: "Rooibos", latin: "Aspalathus linearis", category: "herbal",
    caffeine: 0, tempC: [100, 100], timeS: [300, 420],
    effects: [["soothing", 4], ["digestive", 2], ["grounding", 2]],
    flavors: ["honey", "woody", "vanilla"],
    pairs: ["cinnamon", "ginger", "vanilla", "cloves", "rose", "lemongrass", "ashwagandha", "nettle", "lemonbalm"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "The red bush grows nowhere outside the Cederberg mountains, where the Khoisan brewed it long before Europe noticed. Aspalathin lives only in this plant — sweetness without sugar, alertness without caffeine.",
  },

  /* ── adaptogens ───────────────────────────────────────────── */

  tulsi: {
    name: "Tulsi", latin: "Ocimum tenuiflorum", category: "adaptogen",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["calm", 3], ["soothing", 3], ["grounding", 3], ["uplifting", 2], ["digestive", 2], ["warming", 2]],
    flavors: ["spiced", "clove", "peppery", "sweet"],
    pairs: ["rose", "cardamom", "lemonbalm", "ginger", "peppermint", "ashwagandha"],
    dose: "1 tsp · 200ml",
    headsUp: "May affect blood sugar and thyroid function — verify interactions if relevant.",
    blurb: "Indian households grow it at the front step — Vishnu's plant, the threshold guardian. The clove-pepper warmth is what the tongue notices; what the body notices is ursolic acid, which softens the day's cortisol rise. Sacred botany doing patient work.",
  },
  ashwagandha: {
    name: "Ashwagandha", latin: "Withania somnifera", category: "adaptogen",
    subcategory: "root",
    aliases: ["asgandh", "asvagandha", "winter cherry"],
    caffeine: 0, tempC: [95, 100], timeS: [600, 1200],
    effects: [["grounding", 4], ["calm", 3], ["sleepy", 3], ["soothing", 3], ["warming", 2]],
    flavors: ["earthy", "musty", "bitter", "woody"],
    basicTastes: { bitter: 3, astringent: 3, earthy: 5, sweet: 1, umami: 1 },
    pairs: ["cinnamon", "cardamom", "ginger", "rooibos", "tulsi", "reishi"],
    dose: "½–1 tsp powder · 250ml",
    headsUp: "Avoid in pregnancy. Interacts with thyroid medication and sedatives. Caution with autoimmune conditions.",
    blurb: "Ashva-gandha in Sanskrit — the smell of horse, because the root smells musky and was thought to grant a horse's strength. The withanolides inside don't promise that, but they do measurably blunt cortisol over weeks. Strength, in this telling, is patience.",
    safetyFlags: {
      pregnancy: "avoid",
      thyroidMedication: "interaction",
      sedativeMedication: "additive",
      autoimmune: "caution",
    },
    confidenceMarkers: {
      stress: "established",
      sleep: "established",
      cortisolModulation: "established",
      grounding: "verified",
    },
    effectTimeframe: "chronic-build-not-acute",
  },

  /* ── spices (warming, digestive, chai-adjacent) ────────────── */

  ginger: {
    name: "Ginger", latin: "Zingiber officinale", category: "spice",
    caffeine: 0, tempC: [100, 100], timeS: [420, 600],
    effects: [["warming", 5], ["digestive", 4], ["energy", 2], ["soothing", 2], ["grounding", 1]],
    flavors: ["spiced", "warm", "citrus"],
    pairs: ["assam", "rooibos", "peppermint", "cinnamon", "cardamom", "cloves", "lemongrass", "turmeric", "black-pepper", "tulsi", "lemonbalm", "echinacea", "yerba-mate", "elderflower", "licorice-root"],
    dose: "2 coins · 250ml",
    headsUp: null,
    blurb: "The Silk Road carried it before nutmeg, before pepper. Roman cooks knew it; Chinese sailors chewed it against the swell. Drying turns gingerol into shogaol — sharper, more warming — which is why dried and fresh taste like cousins, not twins.",
  },
  turmeric: {
    name: "Turmeric", latin: "Curcuma longa", category: "spice",
    subcategory: "rhizome",
    aliases: ["haridra", "haldi", "golden spice"],
    caffeine: 0, tempC: [95, 100], timeS: [600, 900],
    effects: [["warming", 3], ["soothing", 2], ["grounding", 2], ["digestive", 2]],
    flavors: ["earthy", "bitter", "musky", "woody"],
    basicTastes: { bitter: 3, astringent: 3, sweet: 1, pungent: 1 },
    pairs: ["ginger", "cinnamon", "cardamom", "black-pepper"],
    dose: "¼–½ tsp · 250ml",
    headsUp: "Strong staining. Bioavailability needs fat and black pepper. Concentrated curcumin extracts can interact with anticoagulants.",
    blurb: "Indian brides are anointed with turmeric paste the night before the wedding — auspiciousness rubbed into skin. The cup is quieter: curcumin alone is barely absorbed, which is why the old recipe pairs it with milk fat and black pepper. The science arrives at the kitchen's conclusion.",
    safetyFlags: {
      anticoagulants: "concentrated-extracts-only",
      gallbladderObstruction: "avoid",
      pregnancyMedicinalDoses: "avoid",
    },
    confidenceMarkers: {
      antiInflammatory: "attested",
      digestive: "attested",
      warming: "verified",
    },
  },
  cinnamon: {
    name: "Cinnamon", latin: "Cinnamomum verum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["warming", 4], ["digestive", 3], ["uplifting", 2], ["soothing", 2], ["grounding", 1]],
    flavors: ["spiced", "sweet", "woody", "warm"],
    pairs: ["assam", "rooibos", "ginger", "cardamom", "cloves", "vanilla", "turmeric", "black-pepper", "ashwagandha", "lions-mane", "dandelion-root", "reishi", "licorice-root", "elderflower"],
    dose: "½ stick or ½ tsp · 250ml",
    headsUp: "Cassia (most common) has higher coumarin — heavy daily use is cautioned. Ceylon (C. verum) is safer for frequent use.",
    blurb: "Worth more than gold to the Romans, who never saw the tree it came from — Pliny invented birds that nested in cliffs to explain the supply chain. Today the choice is simpler: Ceylon (verum) or cassia, the second cheaper but heavier in coumarin. Both warm; one is gentler with daily use.",
  },
  cardamom: {
    name: "Cardamom", latin: "Elettaria cardamomum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 480],
    effects: [["digestive", 3], ["warming", 3], ["uplifting", 3], ["cooling", 2], ["soothing", 2]],
    flavors: ["spiced", "floral", "citrus", "complex"],
    pairs: ["assam", "rose", "ginger", "cinnamon", "cloves", "vanilla", "tulsi", "ashwagandha", "turmeric", "black-pepper", "dandelion-root"],
    dose: "3–4 crushed pods · 250ml",
    headsUp: null,
    blurb: "Bedouin coffee passes through cardamom-stuffed spouts; ancient Roman perfumers folded the pods into unguents. Inside the green husk: 1,8-cineole, the eucalyptol that lets a cup feel warming and cooling at once — a paradox the chemistry resolves cleanly.",
  },
  cloves: {
    name: "Cloves", latin: "Syzygium aromaticum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["warming", 4], ["digestive", 3], ["grounding", 2], ["soothing", 2]],
    flavors: ["spiced", "pungent", "warm", "numbing"],
    pairs: ["assam", "cinnamon", "cardamom", "ginger", "rooibos", "black-pepper"],
    dose: "2–3 cloves · 250ml",
    headsUp: "Very strong — can numb the tongue. One or two cloves, not a handful.",
    blurb: "Han dynasty officials chewed cloves before addressing the emperor — eugenol is a topical anesthetic, and the breath it scrubbed clean is the same molecule a dentist uses today. The Dutch and Portuguese fought wars in the Maluku for the bud.",
  },
  vanilla: {
    name: "Vanilla Bean", latin: "Vanilla planifolia", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["soothing", 3], ["calm", 2], ["uplifting", 2], ["warming", 1], ["sleepy", 1]],
    flavors: ["sweet", "creamy", "floral", "warm"],
    pairs: ["rooibos", "assam", "cinnamon", "cardamom", "rose", "lions-mane", "dandelion-root"],
    dose: "½ bean split · 250ml",
    headsUp: null,
    blurb: "The orchid that bears vanilla pods has exactly one wild pollinator, a Mexican bee that lives nowhere else. The world drinks vanilla anyway because in 1841, a twelve-year-old boy named Edmond Albius worked out how to pollinate the flower by hand. Sweetness is older than its method.",
  },
  "black-pepper": {
    name: "Black Pepper", latin: "Piper nigrum", category: "spice",
    aliases: ["peppercorn", "Maricha", "Kali Mirch", "King of spices"],
    caffeine: 0, tempC: [95, 100], timeS: [300, 900],
    effects: [["warming", 3], ["digestive", 3], ["focus", 1], ["energy", 1], ["uplifting", 1]],
    flavors: ["pungent", "hot", "earthy", "woody", "citrus", "pine"],
    basicTastes: { pungent: 4, bitter: 2, astringent: 2, sweet: 1, sour: 1, umami: 1 },
    pairs: ["turmeric", "cinnamon", "cardamom", "ginger", "cloves", "assam"],
    dose: "1–3 cracked peppercorns · 250ml (5–10 in chai)",
    headsUp: "Tea-strength is below interaction threshold. Concentrated piperine supplements affect drug metabolism (CYP3A4, P-gp); discontinue 2 weeks pre-surgery.",
    blurb: "Roman empresses paid in peppercorns; Vasco da Gama crossed an ocean for them. The bite the tongue feels is piperine, the same molecule that quietly slows the liver's enzymes — which is why turmeric travels in pepper's company.",
    safetyFlags: {
      cyp3a4Inhibition: "concentrated-doses-only",
      pgpInhibition: "concentrated-doses-only",
      medicationsCaution: ["phenytoin", "propranolol", "statins", "benzodiazepines", "cyclosporine"],
      surgery: "discontinue-concentrated-piperine-2-weeks-prior",
      pregnancy: "culinary-acceptable-supplements-avoid",
      activeGIInflammation: "may-aggravate",
    },
    confidenceMarkers: {
      cyp3a4Inhibition: "established",
      pgpInhibition: "established",
      ugtInhibition: "established",
      curcuminBioavailability: "attested",
      yogavahiClassification: "verified",
    },
    bioenhancer: true,
  },

  /* ── true teas ────────────────────────────────────────────── */

  white: {
    name: "White Tea", latin: "Camellia sinensis", category: "true tea", subcategory: "white",
    caffeine: 18, tempC: [75, 85], timeS: [120, 240],
    effects: [["calm", 3], ["uplifting", 3], ["focus", 3], ["cooling", 2]],
    flavors: ["sweet", "hay", "honey", "delicate", "melon"],
    pairs: ["jasmine", "rose"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Imperial Chinese tea makers picked the youngest leaves, withered them in the sun, and called the work done. No firing, no rolling — what the cup tastes is the leaf almost as the bush gave it. The catechins survive because nothing touched them.",
  },
  sencha: {
    name: "Sencha Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 25, tempC: [70, 80], timeS: [60, 120],
    effects: [["focus", 4], ["energy", 3], ["calm", 3], ["cooling", 2]],
    flavors: ["grassy", "marine", "umami"],
    pairs: ["peppermint", "lemonbalm", "jasmine", "spearmint"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "In 1738 a tea master named Soen Nagatani steamed leaves instead of pan-firing them, and Japan's everyday cup was reinvented overnight. Steam stops oxidation faster than fire — chlorophyll stays green, theanine stays sweet, and the leaf burns at a boil.",
  },
  gyokuro: {
    name: "Gyokuro", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 45, tempC: [50, 60], timeS: [90, 120],
    effects: [["focus", 5], ["calm", 4], ["uplifting", 2], ["cooling", 2], ["energy", 2], ["soothing", 2], ["grounding", 1]],
    flavors: ["umami", "marine", "sweet", "buttery", "seaweed"],
    pairs: ["rose"],
    dose: "1 tbsp (~4 g) · 100ml",
    headsUp: "Treat like a delicate wine. The unusually cool water is not a typo — near-boiling water destroys the profile this tea is prized for.",
    blurb: "Jade dew, in translation. For the last three weeks before picking, the bushes are shrouded with reed mats; deprived of sun, the leaf hoards theanine and chlorophyll instead of catechins. Sweetness is what darkness leaves behind.",
    variants: [
      { intent: "classic",    tempC: 55, timeS: 90,  note: "The traditional cool, short brew. Multiple steeps." },
      { intent: "refreshing", tempC: 50, timeS: 180, note: "Cold brew — even sweeter, zero astringency." },
    ],
  },
  matcha: {
    name: "Matcha", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    aliases: ["抹茶", "tencha (pre-ground)", "usucha", "koicha"],
    caffeine: 60, tempC: [70, 80], timeS: [15, 30],
    effects: [["focus", 5], ["energy", 4], ["calm", 3], ["uplifting", 2], ["soothing", 1]],
    flavors: ["umami", "vegetal", "grassy", "sweet", "oceanic"],
    basicTastes: { umami: 5, sweet: 2, bitter: 2, astringent: 1 },
    pairs: [],
    dose: "1–2g powder · 60–80ml (whisk)",
    headsUp: "Whole-leaf consumption — verify low-lead source. High caffeine at ceremonial grade. Significant Vitamin K (warfarin interaction).",
    blurb: "Brought from Song China to Japanese monasteries in the twelfth century by the monk Eisai — a powdered tea for keeping zazen. Drinking the leaf instead of straining it changes the math: every catechin, every theanine, all the way down.",
    safetyFlags: {
      caffeine: "high",
      leadTesting: "verify-source",
      pregnancyModerate: "limit-200mg-caffeine-daily",
      warfarin: "interaction",
    },
    confidenceMarkers: {
      cognitiveEnhancement: "established",
      antioxidant: "established",
      sustainedEnergy: "attested",
      metabolismBoost: "attested",
    },
    preparationPattern: "whisk",
    gradeMatters: true,
    variants: [
      { intent: "usucha", tempC: 75, timeS: 20, note: "Thin — 1g whisked into 80ml until frothy." },
      { intent: "koicha", tempC: 75, timeS: 30, note: "Thick — 4g kneaded into 30ml; ceremonial intensity." },
    ],
  },
  genmaicha: {
    name: "Genmaicha", latin: "Camellia sinensis + Oryza sativa", category: "true tea", subcategory: "green",
    aliases: ["玄米茶", "popcorn tea", "people's tea", "brown rice tea"],
    caffeine: 20, tempC: [70, 85], timeS: [60, 150],
    effects: [["soothing", 3], ["calm", 3], ["focus", 2], ["warming", 2], ["uplifting", 2], ["digestive", 2]],
    flavors: ["toasty", "nutty", "grassy", "mildly sweet", "savory"],
    basicTastes: { umami: 3, sweet: 2, bitter: 1, astringent: 1, aromatic: 3 },
    pairs: [],
    dose: "1½ tsp · 250ml",
    headsUp: "Lowest-caffeine catalog true tea — fine for evening. Tannins soften iron absorption.",
    blurb: "Peasant tea, in origin — Japanese households stretched scarce leaves with toasted brown rice, the rice's tannins softening the leaf's edge. The frugality became style. Half the caffeine, twice the welcome at the end of a meal.",
    confidenceMarkers: {
      lowerCaffeineThanSencha: "verified",
      comfortingTexture: "verified",
      afterMealJapaneseTradition: "verified",
    },
    variants: [
      { intent: "tea-forward",  tempC: 70, timeS: 90,  note: "Cooler steep emphasizes the sencha." },
      { intent: "rice-forward", tempC: 85, timeS: 180, note: "Hotter steep brings out the toasted rice." },
    ],
  },
  gunpowder: {
    name: "Gunpowder Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 30, tempC: [80, 90], timeS: [90, 180],
    effects: [["focus", 3], ["energy", 3], ["cooling", 2], ["uplifting", 2], ["digestive", 2]],
    flavors: ["smoky", "toasted", "vegetal", "brisk"],
    pairs: ["spearmint", "peppermint", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Rolled into pellets for the long sea voyage from Zhejiang to Europe — what looked like gunpowder kept the leaf fresh through months at sea. The pellets unfurl in hot water like time-release capsules; in Morocco they meet sugar and mint and refuse to be drowned.",
  },
  hojicha: {
    name: "Hojicha", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 8, tempC: [95, 100], timeS: [30, 60],
    effects: [["soothing", 4], ["calm", 3], ["warming", 3], ["digestive", 2], ["grounding", 2]],
    flavors: ["roasted", "woody", "caramel", "nutty", "toasted"],
    pairs: ["rooibos", "ginger", "vanilla"],
    dose: "1 tbsp · 250ml",
    headsUp: null,
    blurb: "A Kyoto invention from the 1920s — tea merchants roasted stems and late-season leaves to redeem them. Fire above two hundred Celsius burns off most of the caffeine and caramelizes what's left. An evening tea that isn't an herbal.",
  },
  dragonwell: {
    name: "Dragonwell", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 28, tempC: [75, 85], timeS: [75, 150],
    effects: [["focus", 4], ["uplifting", 3], ["energy", 3], ["cooling", 2], ["calm", 2]],
    flavors: ["nutty", "chestnut", "sweet", "vegetal", "bean"],
    pairs: ["rose", "jasmine"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "West Lake legend says the Qianlong emperor pressed the leaves against his palms while the wok was hot — and the flat shape was born. The chestnut sweetness isn't the leaf alone; it's the Maillard reaction, the same chemistry that browns bread crusts.",
  },
  oolong: {
    name: "Oolong", latin: "Camellia sinensis", category: "true tea", subcategory: "oolong",
    caffeine: 37, tempC: [85, 95], timeS: [90, 180],
    effects: [["focus", 4], ["uplifting", 3], ["energy", 3], ["warming", 2], ["calm", 2], ["soothing", 2]],
    flavors: ["floral", "fruit", "toasted", "honey"],
    pairs: ["rose", "jasmine"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Black dragon, in translation — though the same word covers everything from a green-leaning Taiwanese high-mountain to a roasted Wuyi rock that drinks like a black tea. Partial oxidation is the secret; how partial decides the cup.",
  },
  assam: {
    name: "Assam Black", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 60, tempC: [95, 100], timeS: [180, 300],
    effects: [["energy", 5], ["focus", 3], ["warming", 4]],
    flavors: ["malty", "woody", "cocoa"],
    pairs: ["ginger", "cinnamon", "cardamom", "cloves", "vanilla", "black-pepper"],
    dose: "1 tsp · 200ml",
    headsUp: "High caffeine — not for late afternoons.",
    blurb: "When the British found tea growing wild in Assam in 1823, the colonial industry was born overnight. The local variety is bigger-leafed and stronger than its Chinese cousin — more caffeine, more malt, the cup that demands milk and gets it.",
  },
  darjeeling: {
    name: "Darjeeling", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 40, tempC: [85, 90], timeS: [180, 240],
    effects: [["uplifting", 4], ["energy", 3], ["focus", 3], ["warming", 3], ["calm", 2]],
    flavors: ["muscatel", "floral", "fruit", "bright"],
    pairs: ["rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese cuttings planted in Himalayan foothills produced something neither parent had — the muscatel grape note nobody can replicate elsewhere. The aroma comes from a small insect called the tea jassid, whose bite triggers the leaf's defensive chemistry. Beauty as injury, healed.",
    variants: [
      { intent: "first flush",  tempC: 85, timeS: 180, note: "Light, muscatel — spring harvest, most delicate." },
      { intent: "second flush", tempC: 90, timeS: 240, note: "Fuller body, rounder fruit — summer harvest." },
    ],
  },
  ceylon: {
    name: "Ceylon Black", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 45, tempC: [95, 100], timeS: [180, 240],
    effects: [["energy", 3], ["uplifting", 3], ["warming", 3], ["focus", 2], ["digestive", 2]],
    flavors: ["citrus", "bright", "brisk", "woody"],
    pairs: ["ginger", "lemongrass", "cinnamon", "cardamom", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "A coffee blight in the 1860s burned through Ceylon's plantations; the planters switched crops, and an island became famous for tea instead. The bright citrus character is altitude — the cooler the leaves grow, the higher the aromatic notes climb.",
  },
  lapsang: {
    name: "Lapsang Souchong", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 30, tempC: [95, 100], timeS: [180, 240],
    effects: [["warming", 4], ["grounding", 3], ["energy", 3], ["digestive", 2], ["focus", 2], ["soothing", 2]],
    flavors: ["smoked", "pine", "tar", "campfire", "woody"],
    pairs: ["rooibos"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Legend says soldiers passing through the Wuyi mountains forced tea farmers to dry their leaves over pinewood fires to free the camp; the smoke became the tea. Guaiacol and syringol are the same compounds in good Scotch — campfire, peat, deliberate provocation.",
  },
  puerh: {
    name: "Shou Pu-erh", latin: "Camellia sinensis", category: "true tea", subcategory: "pu-erh",
    caffeine: 35, tempC: [95, 100], timeS: [60, 180],
    effects: [["digestive", 4], ["grounding", 3], ["warming", 3], ["energy", 2], ["focus", 2], ["soothing", 2]],
    flavors: ["earthy", "woody", "dark", "leather", "mineral"],
    pairs: [],
    dose: "1 tsp · 200ml · multi-steep",
    headsUp: null,
    blurb: "On the old horse-and-tea road that crossed from Yunnan to Tibet, the leaves fermented in their packs from the journey alone — and aged tea became its own category. Today's pu-erh ages on purpose: fungi work the polyphenols, and a five-year cake tastes nothing like the leaf it was.",
    variants: [
      { intent: "rinse",   tempC: 100, timeS: 15,  note: "Brief rinse first — rouses the leaves, discard the liquid." },
      { intent: "early",   tempC: 100, timeS: 30,  note: "First real steep — short, to honor the leaves." },
      { intent: "middle",  tempC: 100, timeS: 90,  note: "Steeps 3–5 — the tea's sweet spot." },
      { intent: "late",    tempC: 100, timeS: 300, note: "Later steeps — longer, still rewarding." },
    ],
  },

  /* ── caffeinated herbals ──────────────────────────────────── */

  "yerba-mate": {
    name: "Yerba Mate", latin: "Ilex paraguariensis", category: "herbal",
    subcategory: "leaf",
    aliases: ["mate", "chimarrão", "cimarrón", "ka'ay", "erva-mate", "Paraguay tea"],
    caffeine: 40, tempC: [70, 85], timeS: [60, 300],
    effects: [["energy", 4], ["focus", 3], ["digestive", 2], ["uplifting", 2], ["warming", 1]],
    flavors: ["earthy", "grassy", "herbaceous", "bitter", "smoky"],
    basicTastes: { bitter: 4, astringent: 3, earthy: 3, sweet: 0, umami: 1 },
    pairs: ["lemongrass", "peppermint", "ginger"],
    dose: "1–2g · 200ml or 30–50g for gourd session",
    headsUp: "Drink at 70–85°C — very hot temperature carries esophageal cancer risk (IARC 2A). Moderate caffeine; cumulative across refills.",
    blurb: "The Guaraní drank it long before the Jesuits arrived to cultivate it; the gourd passed counterclockwise around a circle is older than any country in South America. Three molecules — caffeine, theobromine, theophylline — share the lift; coffee has only one.",
    safetyFlags: {
      caffeine: "moderate",
      veryHotTemperature: "esophageal-cancer-risk",
      pregnancy: "limit-caffeine",
      smokeDried: "PAH-concern",
    },
    confidenceMarkers: {
      sustainedEnergy: "established",
      antioxidant: "established",
      cardiovascularSupport: "attested",
      weightManagement: "attested",
    },
    preparationPattern: "gourd-or-steep",
    variants: [
      { intent: "gourd",  tempC: 75, timeS: 60,  note: "Multi-refill social session — first fill short, refills extend." },
      { intent: "single", tempC: 85, timeS: 240, note: "Single tea-bag style cup — 4 min steep." },
    ],
  },

  /* ── sleep specialists ────────────────────────────────────── */

  valerian: {
    name: "Valerian", latin: "Valeriana officinalis", category: "herbal",
    subcategory: "root",
    aliases: ["all-heal", "garden heliotrope", "setwall"],
    caffeine: 0, tempC: [85, 95], timeS: [600, 900],
    effects: [["sleepy", 5], ["calm", 4], ["soothing", 3], ["grounding", 2]],
    flavors: ["earthy", "musky", "pungent", "bitter", "woody"],
    basicTastes: { bitter: 4, astringent: 3, earthy: 4, pungent: 3, sweet: 0 },
    pairs: ["lemonbalm", "chamomile", "lavender", "passionflower"],
    dose: "1–2 tsp root · 250ml",
    headsUp: "Sedating — do not drive or combine with alcohol or benzodiazepines. ~5–10% feel paradoxically stimulated. Limit continuous use to 4–6 weeks. Avoid in pregnancy.",
    blurb: "Medieval herbalists called it All-Heal; cats roll in it; trench veterans of the First World War were prescribed it for nerves. The cheese-funk smell is valerenic acid, which finds the same receptor pocket as benzodiazepines — without the prescription, and without the safety net.",
    safetyFlags: {
      sedation: "DO-NOT-DRIVE",
      alcohol: "additive-do-not-combine",
      benzodiazepines: "additive-do-not-combine",
      pregnancy: "avoid-insufficient-data",
      paradoxicalStimulation: "5-10-percent-of-users",
      longTermUse: "limit-4-6-weeks",
    },
    confidenceMarkers: {
      insomnia: "established",
      anxiety: "established",
      gabaAModulation: "established",
    },
  },

  /* ── immune-support florals ───────────────────────────────── */

  echinacea: {
    name: "Echinacea", latin: "Echinacea purpurea", category: "herbal",
    subcategory: "flower",
    aliases: ["purple coneflower", "Black Sampson"],
    caffeine: 0, tempC: [90, 100], timeS: [300, 900],
    effects: [["soothing", 2], ["warming", 1], ["uplifting", 1], ["digestive", 1]],
    flavors: ["earthy", "grassy", "slightly bitter", "subtly floral", "tongue-tingling"],
    basicTastes: { bitter: 2, astringent: 2, aromatic: 2, sweet: 1, tingling: 2 },
    pairs: ["elderflower", "ginger"],
    dose: "1–2 tsp · 250ml",
    headsUp: "Ragweed/asteraceae cross-allergy possible. Caution with autoimmune conditions and immunosuppressants. Limit to 8–10 weeks traditional.",
    blurb: "Plains tribes — Lakota, Cheyenne, Comanche — pressed the root against snakebite and chewed it for sore throat. The tongue tingle is real chemistry: alkamides binding the same receptor family the body uses for cannabinoids, on the surface of the mouth where you can feel them work.",
    safetyFlags: {
      asteraceaeAllergy: "cross-react",
      autoimmune: "caution-traditional",
      pregnancy: "avoid-insufficient-data",
      immunosuppressants: "interaction",
      durationLimit: "8-10-weeks-traditional",
    },
    confidenceMarkers: {
      coldDuration: "attested",
      coldPrevention: "attested",
      cb2AlkamideBinding: "established",
      antiviralInVitro: "established",
    },
  },
  elderflower: {
    name: "Elderflower", latin: "Sambucus nigra", category: "flower",
    aliases: ["black elder", "Holunder", "Sureau", "Sambuco", "Saúco"],
    caffeine: 0, tempC: [85, 95], timeS: [300, 600],
    effects: [["soothing", 3], ["uplifting", 2], ["warming", 1], ["cooling", 1], ["calm", 1], ["digestive", 1]],
    flavors: ["floral", "muscat-grape", "lychee", "gently sweet", "delicate"],
    basicTastes: { aromatic: 4, sweet: 2, bitter: 1, astringent: 1, sour: 1 },
    pairs: ["echinacea", "peppermint", "ginger", "linden", "rose"],
    dose: "1–2 tsp · 250ml",
    headsUp: "Use only the flowers — leaves, bark, and raw berries contain cyanogenic glycosides. Avoid S. racemosa.",
    blurb: "Northern European folk wouldn't cut an elder without asking the Elder Mother first; midsummer's flowers were a turn of the year. Modern virology found the asking made sense — quercetin and its kin block certain viruses from entering cells. Steep covered to keep the perfume in the cup.",
    safetyFlags: {
      cyanogenicGlycosidesOtherParts: "leaves-bark-raw-berries-NOT-flowers",
      diuretics: "mild-additive",
      diabetesMedications: "theoretical-additive",
      immunosuppressants: "caution-theoretical",
      pregnancy: "tea-strength-acceptable",
      speciesNote: "S-nigra-or-canadensis-only",
    },
    confidenceMarkers: {
      antiviralFlavonoidMechanism: "established",
      coldFluSymptomSupport: "attested",
      germanCommissionEApproval: "verified",
      diaphoretic: "verified",
    },
  },
  linden: {
    name: "Linden", latin: "Tilia cordata", category: "flower",
    aliases: ["lime flower", "Tilleul", "Tila", "Lipa", "Linde"],
    caffeine: 0, tempC: [85, 95], timeS: [300, 600],
    effects: [["calm", 4], ["sleepy", 3], ["soothing", 3], ["uplifting", 2], ["warming", 1], ["cooling", 1], ["digestive", 1]],
    flavors: ["honey-sweet", "citrusy", "floral", "delicate", "slightly green"],
    basicTastes: { sweet: 3, aromatic: 3, bitter: 0, astringent: 0 },
    pairs: ["chamomile", "lemonbalm", "lavender", "passionflower", "peppermint", "rose", "elderflower"],
    dose: "1–2 tsp · 250ml",
    headsUp: null,
    blurb: "The lime tree of Proust's madeleine; the Slavic lipa shading every village square. The mucilage in the flowers coats a sore throat, and the flavonoids inside dock at the same receptors a small dose of clonazepam would. Proust didn't know; the cup did its work anyway.",
    safetyFlags: {
      pregnancy: "tea-strength-acceptable",
      sedatives: "theoretical-additive",
      cardiacGlycosides: "very-high-doses-only",
    },
    confidenceMarkers: {
      benzodiazepineReceptorBinding: "established",
      gabaMimetic: "attested",
      anxiolytic: "attested",
      diaphoretic: "verified",
    },
    childrenFriendly: true,
    petSafe: true,
  },

  /* ── harmonizers & specialty roots ────────────────────────── */

  "licorice-root": {
    name: "Licorice Root", latin: "Glycyrrhiza glabra", category: "herbal",
    subcategory: "root",
    aliases: ["sweet root", "Gan Cao 甘草", "Mulethi", "Yashtimadhu", "liquorice"],
    caffeine: 0, tempC: [95, 100], timeS: [300, 900],
    effects: [["soothing", 4], ["digestive", 2], ["warming", 1], ["calm", 1], ["uplifting", 1]],
    flavors: ["intensely sweet", "anise", "woody", "earthy", "slightly bitter"],
    basicTastes: { sweet: 5, aromatic: 3, bitter: 1, astringent: 1, umami: 1 },
    pairs: ["ginger", "cinnamon", "fennel", "peppermint"],
    dose: "½–1 tsp · 250ml — less is more",
    headsUp: "Real risk of pseudoaldosteronism (BP↑, K+↓) above 3g/day or 4–6 weeks continuous. Avoid if hypertensive, pregnant, or on diuretics/digoxin.",
    blurb: "Found in sixty percent of Chinese herbal formulas as the harmonizer — Gan Cao, the diplomat that smooths the rough edges of stronger herbs. Glycyrrhizin is fifty times sweeter than sugar, and the same molecule that makes the cup confectionary slows the liver's clearance of cortisol. Treat it as you'd treat any sweet thing — fondly, in moderation.",
    safetyFlags: {
      pseudoaldosteronism: "REAL-RISK",
      doseLimit: "max-3g-day",
      durationLimit: "max-4-6-weeks-continuous",
      hypertension: "AVOID",
      heartDisease: "AVOID",
      kidneyDisease: "AVOID",
      pregnancy: "AVOID",
      breastfeeding: "AVOID",
      diuretics: "DANGEROUS",
      digoxin: "DANGEROUS",
      corticosteroids: "extends-half-life",
      dglAlternative: "removes-pseudoaldosteronism-risk",
    },
    confidenceMarkers: {
      ulcerDgl: "established",
      throatSoothing: "established",
      pseudoaldosteronism: "established",
      "11BetaHsd2Inhibition": "established",
      antiviral: "established",
      harmonizer: "verified",
    },
    harmonizerFlag: true,
  },

  /* ── mineral-rich Western herbals ─────────────────────────── */

  nettle: {
    name: "Nettle", latin: "Urtica dioica", category: "herbal",
    subcategory: "leaf",
    aliases: ["stinging nettle", "common nettle", "Bichu butti"],
    caffeine: 0, tempC: [95, 100], timeS: [300, 900],
    effects: [["soothing", 3], ["grounding", 2], ["digestive", 2], ["uplifting", 1], ["calm", 1], ["warming", 1]],
    flavors: ["earthy", "grassy", "mineral", "spinach-like", "subtly sweet"],
    basicTastes: { earthy: 3, mineral: 3, umami: 2, bitter: 1, sweet: 1 },
    pairs: ["lemonbalm", "peppermint", "rooibos", "dandelion-leaf", "dandelion-root"],
    dose: "1–2 tsp · 250ml",
    headsUp: "Significant Vitamin K — warfarin interaction. Mild diuretic; modest glucose lowering.",
    blurb: "Roman legionaries slapped their legs with fresh stalks against the cold; Scottish boys passed a rite by grasping a fistful unflinching. The sting is real chemistry — histamine, formic acid, serotonin in the leaf hairs — and a quick steep dismantles every one of them. Spring's reproach turned tonic.",
    safetyFlags: {
      warfarin: "vitamin-K-significant",
      diuretics: "mild-additive",
      diabetesMedications: "modest-glucose-lowering",
      pregnancy: "tea-strength-acceptable",
    },
    confidenceMarkers: {
      allergicRhinitis: "attested",
      h1ReceptorAntagonism: "established",
      bphSymptomSupport: "attested",
      bloodGlucoseLowering: "attested",
      nutritional: "verified",
    },
    preparationPattern: "long-infusion-optional",
    variants: [
      { intent: "standard",   tempC: 100, timeS: 600,    note: "10-min steep — daily mineral cup." },
      { intent: "nourishing", tempC: 100, timeS: 14400,  note: "Susun Weed 4-hour covered infusion — maximum mineral extraction." },
    ],
  },
  "dandelion-root": {
    name: "Dandelion Root", latin: "Taraxacum officinale (radix)", category: "herbal",
    subcategory: "root",
    aliases: ["roasted dandelion root", "dandelion coffee", "Pissenlit", "lion's tooth", "Pu Gong Ying 蒲公英"],
    relatedIngredient: "dandelion-leaf",
    caffeine: 0, tempC: [95, 100], timeS: [600, 1800],
    effects: [["digestive", 3], ["warming", 2], ["grounding", 2], ["soothing", 1], ["energy", 1], ["focus", 1]],
    flavors: ["caramel-roasted", "bittersweet", "nutty", "earthy", "coffee-adjacent"],
    basicTastes: { bitter: 4, astringent: 3, earthy: 3, umami: 1, sweet: 2 },
    pairs: ["cinnamon", "cardamom", "vanilla", "dandelion-leaf"],
    dose: "1–2 tsp roasted · 250ml",
    headsUp: "Avoid with active gallbladder disease, ulcer, or gastritis. Asteraceae/ragweed cross-allergy possible.",
    blurb: "Roasted as coffee through both World Wars when the real bean was rationed — bittersweet, caramel, almost convincing. The bitter is sesquiterpene lactones, which provoke the bile and digestive juices; the sweetness is inulin, a prebiotic the gut bacteria treat as a long meal.",
    safetyFlags: {
      activeGallbladder: "contraindicated",
      activeGastritisOrUlcer: "may-aggravate",
      asteraceaeAllergy: "cross-reactivity",
      diabetesMedications: "modest-glucose-lowering",
      ciprofloxacin: "documented-interaction",
      pregnancy: "tea-strength-acceptable",
    },
    confidenceMarkers: {
      digestiveBitter: "established",
      hepatoprotective: "attested",
      bifidogenicInulin: "established",
      cholagogue: "attested",
      escopDyspepsiaApproval: "verified",
      coffeeSubstituteTradition: "verified",
    },
    preparationPattern: "decoction",
  },
  "dandelion-leaf": {
    name: "Dandelion Leaf", latin: "Taraxacum officinale (folium)", category: "herbal",
    subcategory: "leaf",
    aliases: ["dandelion greens", "Pissenlit", "lion's tooth", "Taraxaci folium"],
    relatedIngredient: "dandelion-root",
    caffeine: 0, tempC: [90, 100], timeS: [300, 900],
    effects: [["digestive", 3], ["cooling", 2], ["soothing", 2], ["grounding", 1], ["uplifting", 1]],
    flavors: ["bitter", "grassy", "fresh-green", "mineral", "vegetal"],
    basicTastes: { bitter: 3, astringent: 2, mineral: 3, umami: 1, sweet: 1, sour: 1 },
    pairs: ["nettle", "lemonbalm", "peppermint", "dandelion-root"],
    dose: "1–2 tsp · 250ml",
    headsUp: "Significant Vitamin K — warfarin interaction. Mild diuretic; high in potassium (potassium-sparing, unique).",
    blurb: "Italian and Greek spring foragers fill bags with the bitter leaves before the flowers open. The French name pissenlit is honest reporting — the cup is reliably diuretic — but the leaf is itself rich in potassium, so you don't lose what most diuretics take with them.",
    safetyFlags: {
      warfarinVitaminK: "significant-interaction",
      pharmaceuticalDiuretics: "additive-but-potassium-rich",
      lithium: "may-affect-clearance",
      asteraceaeAllergy: "cross-reactivity",
      activeGallbladder: "less-than-root-but-caution",
      ciprofloxacin: "documented-interaction",
      pregnancy: "tea-strength-acceptable",
    },
    confidenceMarkers: {
      diureticHumanTrial: "attested",
      highPotassiumContent: "verified",
      potassiumSparingProperty: "attested",
      digestiveBitter: "established",
      pissenlitFrenchNaming: "verified",
    },
    preparationPattern: "long-infusion-optional",
    variants: [
      { intent: "standard",   tempC: 95,  timeS: 600,    note: "10-min steep — daily digestive cup." },
      { intent: "nourishing", tempC: 100, timeS: 14400,  note: "4-hour covered infusion — maximum mineral and bitter extraction." },
    ],
  },

  /* ── medicinal mushrooms (subcategory: fungus) ────────────── */

  reishi: {
    name: "Reishi", latin: "Ganoderma lucidum", category: "herbal",
    subcategory: "fungus",
    aliases: ["Lingzhi 灵芝", "Mannentake 万年茸", "mushroom of immortality"],
    caffeine: 0, tempC: [95, 100], timeS: [1800, 7200],
    effects: [["grounding", 5], ["sleepy", 4], ["calm", 4], ["soothing", 3], ["warming", 1]],
    flavors: ["bitter", "earthy", "woody", "mushroomy", "tannic"],
    basicTastes: { bitter: 5, astringent: 3, earthy: 4, umami: 1, sweet: 0 },
    pairs: ["ashwagandha", "cinnamon", "lions-mane"],
    dose: "3–9g sliced · 500ml decoction",
    headsUp: "Anticoagulant and antiplatelet effects — caution with blood thinners. Long decoction required; not casual sipping.",
    blurb: "Taoist painters drew it in the hands of immortals; Chinese emperors hoarded wild specimens, and reliable cultivation only began in the 1970s. The bitter is triterpene, the same family found in licorice and ginseng — and the same reason the cup needs a long decoction, sweetened with jujube and goji.",
    safetyFlags: {
      anticoagulants: "antiplatelet-additive",
      diabetesMedications: "monitor-glucose",
      bloodPressure: "modest-hypotensive",
      immunosuppressants: "caution-immunomodulator",
      pregnancy: "avoid-insufficient-data",
      qualityVariation: "fruiting-body-vs-mycelium-significant",
    },
    confidenceMarkers: {
      sleep: "established",
      immunomodulation: "established",
      hpaAxis: "attested",
      hepatoprotection: "attested",
      anShenTradition: "verified",
    },
    preparationPattern: "decoction",
  },
  "lions-mane": {
    name: "Lion's Mane", latin: "Hericium erinaceus", category: "herbal",
    subcategory: "fungus",
    aliases: ["Yamabushitake 山伏茸", "Hou Tou Gu 猴頭菇", "monkey head mushroom", "bearded tooth fungus"],
    caffeine: 0, tempC: [90, 100], timeS: [600, 1800],
    effects: [["focus", 3], ["calm", 2], ["soothing", 2], ["uplifting", 2], ["grounding", 2], ["digestive", 2]],
    flavors: ["mild", "sweet", "seafood-like", "earthy", "nutty"],
    basicTastes: { umami: 3, sweet: 2, bitter: 1, astringent: 1, earthy: 2 },
    pairs: ["cinnamon", "vanilla", "reishi"],
    dose: "2–3g · 250ml",
    headsUp: "Mushroom allergy is absolute contraindication. Mild antiplatelet; effects build over weeks, not acute.",
    blurb: "Japan's yamabushi mountain ascetics saw the white cascading tufts and named it for themselves — yamabushitake, mountain-priest's mushroom. Inside it: hericenones, which prompt the brain to make more nerve growth factor. The most palatable mushroom in the cabinet, with the longest tail of effect.",
    safetyFlags: {
      anticoagulants: "mild-antiplatelet",
      diabetesMedications: "modest-glucose-lowering",
      pregnancy: "limited-data-conservative",
      mushroomAllergy: "absolute-contraindication",
    },
    confidenceMarkers: {
      ngfStimulation: "established",
      bdnfPathway: "established",
      cognitiveSupport: "attested",
      neurogenesis: "established",
      moodSupport: "attested",
    },
    effectTimeframe: "chronic-build-not-acute",
  },
};

export default INGREDIENTS;
export { INGREDIENTS };

/* ── User-facing mood and flavor chips ─────────────────────── */

// The user-facing chip labels on the Compose screen.
// Distinct from internal effect names — effect keys in blends use
// the vocabulary per docs/vocabulary.md (calm, soothing, digestive,
// uplifting, warming, etc.). These stay warm-sounding for UI.
const MOODS   = ["calm", "focus", "energy", "sleepy", "comfort", "settle"];
const FLAVORS = ["floral", "earthy", "citrus", "spiced", "minty", "fruity", "sweet"];

export { MOODS, FLAVORS };

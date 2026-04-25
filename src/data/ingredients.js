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
    blurb: "Small daisy-like flowers with a rounded, honey-apple sweetness. Long used at the end of the day to soften the edges of a wound evening.",
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
    blurb: "Use sparingly — culinary lavender is a strong voice in any blend, bright and slightly cooling.",
  },
  rose: {
    name: "Rose Petal", latin: "Rosa × damascena", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calm", 3], ["soothing", 3], ["sleepy", 2]],
    flavors: ["floral", "sweet", "fruity"],
    pairs: ["chamomile", "lavender", "hibiscus", "cardamom", "tulsi", "vanilla", "white", "oolong", "linden", "elderflower"],
    dose: "1 tsp · 200ml",
    headsUp: "Source food-grade petals — ornamental roses may carry pesticide residue.",
    blurb: "Subtle, powdery, and romantic. Lifts a blend into something hand-written.",
  },
  jasmine: {
    name: "Jasmine", latin: "Jasminum sambac", category: "flower",
    caffeine: 0, tempC: [75, 85], timeS: [120, 180],
    effects: [["calm", 3], ["energy", 2], ["focus", 2]],
    flavors: ["floral", "sweet", "honeyed", "heady"],
    pairs: ["sencha", "white", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Small star-shaped flowers, traditionally layered at night with green or white tea to scent the leaves. Too-hot water kills the perfume.",
  },
  passionflower: {
    name: "Passionflower", latin: "Passiflora incarnata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["calm", 3], ["sleepy", 3], ["soothing", 2]],
    flavors: ["grassy", "hay", "mild"],
    pairs: ["chamomile", "lemonbalm", "lavender", "linden", "valerian"],
    dose: "1 tsp · 200ml",
    headsUp: "Sedative — avoid combining with other sedatives or alcohol, and don't drive after. Not for pregnancy.",
    blurb: "Mild and hay-like in flavor. Reliably drowsy — pair with stronger-tasting herbs to carry a blend.",
  },
  lemonbalm: {
    name: "Lemon Balm", latin: "Melissa officinalis", category: "herbal",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calm", 4], ["sleepy", 3], ["cooling", 2], ["uplifting", 2], ["soothing", 2]],
    flavors: ["citrus", "mint", "grassy"],
    pairs: ["chamomile", "peppermint", "rose", "spearmint", "lemongrass", "tulsi", "valerian", "linden", "nettle", "dandelion-leaf"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "A lemony mint relative, historically called the 'gladdening herb'. Quiet lift without caffeine. GABA-T inhibitor mechanism (Awad 2007, 2009) joins it to chamomile's calm cluster.",
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
    blurb: "Bracing and clean. A post-meal standard across many traditions. Strongest IBS evidence in the catalog (NNT≈4).",
  },
  spearmint: {
    name: "Spearmint", latin: "Mentha spicata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 3], ["digestive", 3], ["uplifting", 2], ["calm", 2]],
    flavors: ["minty", "sweet", "grassy", "cool"],
    pairs: ["lemonbalm", "sencha", "rose", "chamomile", "gunpowder"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Gentler than peppermint — sweeter, less camphor. Carvone-driven cooling rather than menthol. RCT evidence for anti-androgenic effect in PCOS (Akdogan 2007).",
  },
  lemongrass: {
    name: "Lemongrass", latin: "Cymbopogon citratus", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 3], ["uplifting", 3], ["digestive", 2], ["calm", 2]],
    flavors: ["citrus", "grassy", "bright"],
    pairs: ["ginger", "peppermint", "lemonbalm", "rose", "rooibos", "hibiscus", "yerba-mate"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Long grassy stalks bringing a bright, clean lemon note without citrus acidity. A staple of Southeast Asian beverages.",
  },
  fennel: {
    name: "Fennel Seed", latin: "Foeniculum vulgare", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["digestive", 4], ["cooling", 2], ["soothing", 2], ["calm", 1]],
    flavors: ["licorice", "sweet", "aromatic"],
    pairs: ["peppermint", "ginger", "chamomile", "lemonbalm", "rooibos", "licorice-root"],
    dose: "1 tsp crushed · 200ml",
    headsUp: "Heavy doses cautioned in pregnancy — verify.",
    blurb: "Bright anise-like seeds — a digestive classic across Mediterranean and Indian traditions. Often served after a heavy meal. Anethole-GABA gut receptor mechanism documented.",
  },
  hibiscus: {
    name: "Hibiscus", latin: "Hibiscus sabdariffa", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["cooling", 3], ["energy", 2], ["digestive", 2]],
    flavors: ["tart", "fruity", "cranberry"],
    pairs: ["rose", "rooibos", "ginger", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "May lower blood pressure — sip modestly if relevant.",
    blurb: "Ruby-red, tart, and refreshing. Tastes like the idea of cranberries.",
  },
  rooibos: {
    name: "Rooibos", latin: "Aspalathus linearis", category: "herbal",
    caffeine: 0, tempC: [100, 100], timeS: [300, 420],
    effects: [["soothing", 4], ["digestive", 2], ["grounding", 2]],
    flavors: ["honey", "woody", "vanilla"],
    pairs: ["cinnamon", "ginger", "vanilla", "cloves", "rose", "lemongrass", "ashwagandha", "nettle", "lemonbalm"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "South African red bush — naturally sweet, round, and forgiving to over-steep.",
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
    blurb: "Holy basil — sacred in Ayurvedic tradition, where it's called the 'incomparable one.' Clove-like and peppery, with the characteristic adaptogenic quality of lifting both ends of the day. GABAergic mechanism via ursolic acid.",
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
    blurb: "Indian winter cherry — earthy, musty, bitter. The most-studied adaptogen for stress and sleep. Traditionally a milk-based ksheer, not tea. Effects build over weeks. First non-tea ingredient at grounding 4.",
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
    blurb: "Dried or fresh — a foundation for warming blends and a digestive ally. Sets the catalog warming ceiling at 5.",
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
    blurb: "Curcumin's most concentrated source — earthy, musky, faintly bitter. Tea form is sub-medicinal next to capsules; the cup's gift is warmth and color. Canonical preparation is golden milk (haldi doodh) with fat and black pepper.",
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
    blurb: "True Ceylon cinnamon is delicate and sweet; cassia is stronger and more common. Both warm a cup and lean it toward dessert.",
  },
  cardamom: {
    name: "Cardamom", latin: "Elettaria cardamomum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 480],
    effects: [["digestive", 3], ["warming", 3], ["uplifting", 3], ["cooling", 2], ["soothing", 2]],
    flavors: ["spiced", "floral", "citrus", "complex"],
    pairs: ["assam", "rose", "ginger", "cinnamon", "cloves", "vanilla", "tulsi", "ashwagandha", "turmeric", "black-pepper", "dandelion-root"],
    dose: "3–4 crushed pods · 250ml",
    headsUp: null,
    blurb: "The 'queen of spices' — bright, aromatic, and complex. Crush pods just before brewing. First catalog ingredient carrying both warming and cooling (eucalyptol/1,8-cineole).",
  },
  cloves: {
    name: "Cloves", latin: "Syzygium aromaticum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["warming", 4], ["digestive", 3], ["grounding", 2], ["soothing", 2]],
    flavors: ["spiced", "pungent", "warm", "numbing"],
    pairs: ["assam", "cinnamon", "cardamom", "ginger", "rooibos", "black-pepper"],
    dose: "2–3 cloves · 250ml",
    headsUp: "Very strong — can numb the tongue. One or two cloves, not a handful.",
    blurb: "Intensely warming, with a characteristic numbing quality from eugenol. A little goes a long way.",
  },
  vanilla: {
    name: "Vanilla Bean", latin: "Vanilla planifolia", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["soothing", 3], ["calm", 2], ["uplifting", 2], ["warming", 1], ["sleepy", 1]],
    flavors: ["sweet", "creamy", "floral", "warm"],
    pairs: ["rooibos", "assam", "cinnamon", "cardamom", "rose", "lions-mane", "dandelion-root"],
    dose: "½ bean split · 250ml",
    headsUp: null,
    blurb: "The dried seed pod of a climbing orchid. Rich, sweet, and creamy — lifts any blend toward dessert without actual sugar. First ingredient where effects are aromatic-psychological rather than pharmacological.",
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
    blurb: "The world's most-traded spice. Tea form is uncommon solo, but the bioenhancer in chai and golden milk — piperine multiplies absorption of curcumin and other compounds. Bright, pine-resinous, hot.",
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
    caffeine: 18, tempC: [75, 85], timeS: [180, 300],
    effects: [["calm", 3], ["uplifting", 3], ["focus", 3], ["cooling", 2]],
    flavors: ["sweet", "hay", "honey", "delicate", "melon"],
    pairs: ["jasmine", "rose"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The least-processed tea — freshly-plucked leaves allowed to wither. Delicate, naturally sweet, with honey and melon notes. Rewards patience and soft water.",
  },
  sencha: {
    name: "Sencha Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 25, tempC: [70, 80], timeS: [60, 120],
    effects: [["focus", 4], ["energy", 3], ["calm", 3], ["cooling", 2]],
    flavors: ["grassy", "marine", "umami"],
    pairs: ["peppermint", "lemonbalm", "jasmine", "spearmint"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Steamed Japanese green, vegetal and oceanic. Burns easily — keep the water well under a boil.",
  },
  gyokuro: {
    name: "Gyokuro", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 45, tempC: [50, 60], timeS: [90, 120],
    effects: [["focus", 5], ["calm", 4], ["uplifting", 2], ["cooling", 2], ["energy", 2], ["soothing", 2], ["grounding", 1]],
    flavors: ["umami", "marine", "sweet", "buttery", "seaweed"],
    pairs: ["rose"],
    dose: "1 tbsp (~4 g) · 100ml",
    headsUp: "Treat like a delicate wine. The unusually cool water is not a typo — near-boiling water destroys the profile this tea is prized for.",
    blurb: "Shade-grown for three weeks before harvest, which multiplies the L-theanine and deepens the leaves. Intensely sweet and savory at once, brewed cool and brief. Japan's most prestigious everyday tea.",
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
    blurb: "Stone-ground shaded green tea, whole leaf consumed — not steeped, whisked. Intensely umami, vegetal, and lasting. The 'calm focus' prototype: L-theanine + caffeine synergy. Cool water only.",
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
    caffeine: 20, tempC: [70, 85], timeS: [60, 180],
    effects: [["soothing", 3], ["calm", 3], ["focus", 2], ["warming", 2], ["uplifting", 2], ["digestive", 2]],
    flavors: ["toasty", "nutty", "grassy", "mildly sweet", "savory"],
    basicTastes: { umami: 3, sweet: 2, bitter: 1, astringent: 1, aromatic: 3 },
    pairs: [],
    dose: "1½ tsp · 250ml",
    headsUp: "Lowest-caffeine catalog true tea — fine for evening. Tannins soften iron absorption.",
    blurb: "Sencha tossed with roasted brown rice — toasty, nutty, gently sweet. Half the caffeine of pure sencha. Japan's everyday after-meal cup; forgiving of water temperature. Validates same-plant-different-prep splitting.",
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
    caffeine: 30, tempC: [80, 90], timeS: [120, 240],
    effects: [["focus", 3], ["energy", 3], ["cooling", 2], ["uplifting", 2], ["digestive", 2]],
    flavors: ["smoky", "toasted", "vegetal", "brisk"],
    pairs: ["spearmint", "peppermint", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese pan-fired green rolled into tight pellets — the 'gunpowder'. Unfurls during brewing. Stands up to bold treatments like mint and sugar; the backbone of Maghrebi tea culture.",
  },
  hojicha: {
    name: "Hojicha", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 8, tempC: [95, 100], timeS: [30, 60],
    effects: [["soothing", 4], ["calm", 3], ["warming", 3], ["digestive", 2], ["grounding", 2]],
    flavors: ["roasted", "woody", "caramel", "nutty", "toasted"],
    pairs: ["rooibos", "ginger", "vanilla"],
    dose: "1 tbsp · 250ml",
    headsUp: null,
    blurb: "Japanese green tea roasted over charcoal until the leaves turn reddish-brown. The roasting strips most of the caffeine and brings up warm, toasty, caramel notes. An evening tea that isn't an herbal.",
  },
  dragonwell: {
    name: "Dragonwell", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 28, tempC: [75, 85], timeS: [90, 180],
    effects: [["focus", 4], ["uplifting", 3], ["energy", 3], ["cooling", 2], ["calm", 2]],
    flavors: ["nutty", "chestnut", "sweet", "vegetal", "bean"],
    pairs: ["rose", "jasmine"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Longjing — pan-fired Chinese green from Hangzhou's West Lake, hand-pressed flat against hot woks. Sweet, faintly chestnut-like, and among the most prized teas in China. A cup that rewards attention.",
  },
  oolong: {
    name: "Oolong", latin: "Camellia sinensis", category: "true tea", subcategory: "oolong",
    caffeine: 37, tempC: [85, 95], timeS: [120, 240],
    effects: [["focus", 4], ["uplifting", 3], ["energy", 3], ["warming", 2], ["calm", 2], ["soothing", 2]],
    flavors: ["floral", "fruit", "toasted", "honey"],
    pairs: ["rose", "jasmine"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The middle path between green and black — partially oxidized, spectacularly varied by origin. Taiwanese high-mountain leans floral; Wuyi rock leans toasted and mineral.",
  },
  assam: {
    name: "Assam Black", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 60, tempC: [95, 100], timeS: [180, 300],
    effects: [["energy", 5], ["focus", 3], ["warming", 4]],
    flavors: ["malty", "woody", "cocoa"],
    pairs: ["ginger", "cinnamon", "cardamom", "cloves", "vanilla", "black-pepper"],
    dose: "1 tsp · 200ml",
    headsUp: "High caffeine — not for late afternoons.",
    blurb: "Robust, malty Indian black. The backbone of a proper morning cup.",
  },
  darjeeling: {
    name: "Darjeeling", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 40, tempC: [85, 90], timeS: [180, 240],
    effects: [["uplifting", 4], ["energy", 3], ["focus", 3], ["warming", 3], ["calm", 2]],
    flavors: ["muscatel", "floral", "fruit", "bright"],
    pairs: ["rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Grown in the Himalayan foothills of West Bengal — unusually light for a black tea, with a distinctive muscatel-grape note. Called 'the champagne of teas'; first flush (spring harvest) is the most prized. Best served without milk.",
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
    blurb: "Sri Lankan black tea — brisk and bright, with a characteristic citrus lift. The backbone of most breakfast blends and the base for most commercial Earl Grey. Forgiving of milk and sugar.",
  },
  lapsang: {
    name: "Lapsang Souchong", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 30, tempC: [95, 100], timeS: [180, 240],
    effects: [["warming", 4], ["grounding", 3], ["energy", 3], ["digestive", 2], ["focus", 2], ["soothing", 2]],
    flavors: ["smoked", "pine", "tar", "campfire", "woody"],
    pairs: ["rooibos"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese black tea from Fujian, dried over pine fires. Famously smoky — campfire and tar on first sip. The tea you either love immediately or never drink again; in either case, unmistakable.",
  },
  puerh: {
    name: "Shou Pu-erh", latin: "Camellia sinensis", category: "true tea", subcategory: "pu-erh",
    caffeine: 35, tempC: [95, 100], timeS: [60, 180],
    effects: [["digestive", 4], ["grounding", 3], ["warming", 3], ["energy", 2], ["focus", 2], ["soothing", 2]],
    flavors: ["earthy", "woody", "dark", "leather", "mineral"],
    pairs: [],
    dose: "1 tsp · 200ml · multi-steep",
    headsUp: null,
    blurb: "Post-fermented dark tea from Yunnan, aged for months or decades. Shou (ripe) is pile-fermented over weeks; sheng (raw) ages naturally over years. Deep, earthy, long-lived — good pu-erh gives five or more distinct steeps from the same leaves.",
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
    blurb: "Holly-family caffeinated leaf from South America — grassy, earthy, slightly bitter. The traditional gourd-and-bombilla session is social and durative. First caffeinated herbal in the catalog (Principle #16). Xanthine triad: caffeine + theobromine + theophylline.",
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
    blurb: "Western root with a famously funky-cheesy aroma — the smell is a feature, not a bug. The deepest sleep specialist in the catalog (sleepy 5 ceiling). GABA-A receptor binding similar to benzodiazepines. Often paired with lemon balm (Cerny 1999).",
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
    blurb: "North American purple coneflower — gently tongue-tingling from alkamides. Best at the first sign of a cold; tea-strength is mild compared to tinctures. Mechanistically real (CB2 binding); clinical effects modest.",
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
    blurb: "Sambucus flowers — muscat-grape and lychee aromatics. Classic European cold-care, German Commission E approved. Steep covered to keep the volatile aromatics. Documented antiviral activity (Roschek 2009).",
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
    blurb: "Tilia flowers — honey-sweet, lightly citrus, delicate. Europe's gentlest calming flower; safe for children in traditional pediatric use. Steep covered to keep the perfume. Joins calm 4 cluster via documented benzodiazepine receptor ligands (Viola 1994).",
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
    blurb: "Sweetness ceiling — fifty times sucrose by weight (glycyrrhizin). The TCM harmonizer that joins flavors in a blend — typically 5–15% of a mix, rarely solo. Most significant safety profile in the catalog: respect the dose. DGL form removes the cardiovascular risk.",
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
    blurb: "Mineral-rich Western leaf — spinach-like, faintly grassy. Long-infused for hours, this is the classic 'spring tonic'. Documented anti-allergic action via H1 binding (Mittman 1990). Drying or steeping destroys the sting.",
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
    blurb: "Roasted root — caramel, bittersweet, coffee-adjacent. The catalog's standout caffeine-free coffee substitute. Decoct, not steep. Hepatoprotective tradition strong; ESCOP-approved for dyspepsia. Validates Principle #18 split with dandelion leaf.",
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
    blurb: "Bitter spring greens — grassy and mineral. Single best-evidenced human herbal diuretic (Clare 2009 RCT). Potassium-sparing, unlike pharmaceutical diuretics. The French call it 'pissenlit' for a reason.",
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
    blurb: "Lingzhi — the 'mushroom of immortality' in TCM. Bitter, woody, deeply earthy. Sets the catalog's grounding ceiling at 5. Long decoction (30 min – 2 hr) required to extract polysaccharides and triterpenes; classically balanced with jujube and goji.",
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
    blurb: "Mild, faintly sweet, almost seafood-like — the most palatable mushroom in the catalog. The brain mushroom: NGF and BDNF pathway stimulation documented. Effects build over weeks of daily use, not acutely. Surfaces neurotrophic vocabulary v2 gap.",
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

# App Data Updates — Consolidated Pending Changes

> **Purpose:** Single source of truth for effect array changes to
> `src/data/ingredients.js` that have been proposed during
> ingredient research but not yet pushed to the live app.
>
> **Status at creation:** April 2026. **Phase A COMPLETE; Phase
> B in progress** — 13 new ingredients researched (turmeric,
> ashwagandha, matcha, yerba-mate, valerian, echinacea,
> licorice-root, genmaicha, reishi, lions-mane, nettle, linden,
> elderflower) alongside the 30 original catalog entries.
>
> **Catalog at this snapshot:** 43 ingredients
>
> **Phase B remaining:** 2 ingredients (black pepper, dandelion
> root + leaf split per Principle #18)
>
> **How to use:** Work through sections 1-3 in order. Section 1 is
> the quickest wins (simple effect array swaps). Section 2 requires
> vocabulary migration (v0 → v1 conversion). Section 3 is new
> ingredients that need full objects added.

---

## The situation

Across ~7 research sessions, 23 ingredients have been researched,
producing proposed effect arrays calibrated against vocabulary v1.
The live app has NOT been updated with these changes. Three
categories of work are needed:

1. **Effect array swaps** (15 ingredients) — research pass
   produced new effect arrays using vocabulary v1. Current app
   entries need their `effects` field replaced.

2. **Effect array swaps WITH vocabulary migration** (7 ingredients)
   — research was done before the v0 → v1 vocabulary migration,
   and research files still contain deprecated terms (`settle`,
   `comfort`, `bitterness` in effects). Proposed v1 effects
   provided here.

3. **New ingredient addition** (1 ingredient) — turmeric was
   researched as a catalog candidate and recommended for
   inclusion. Needs a full ingredient object added to INGREDIENTS
   plus any sourcing, brewing, and sensory fields the schema
   requires.

---

## Vocabulary v0 → v1 reference

For the seven older research files that use deprecated effect
names, here's the mapping that was applied:

| v0 term | v1 term | Notes |
|---------|---------|-------|
| `settle` | `calm` OR `digestive` | Context-dependent: for sedative herbs (chamomile, passionflower), `calm`; for stomach-settling (peppermint), `digestive` |
| `comfort` | `soothing` | Direct swap |
| `clear` | `focus` | Direct swap |
| `lifting` | `uplifting` | Direct swap |
| `bitterness` | (removed from effects) | Was miscategorized as effect; belongs in flavor/taste, not effects |
| `calming` | `calm` | Direct swap |

---

## Section 1 — Effect array swaps (no vocabulary migration)

These ingredients were researched using vocabulary v1 directly.
Replace the existing `effects` array in each ingredient object.

### 1.1 True teas

```js
// Blacks
assam: {
  // ... (keep all other fields as-is)
  effects: [["energy", 5], ["focus", 3], ["warming", 4]],
  // NOTE: This may already match the live app. Verify before applying.
},

darjeeling: {
  // ...
  effects: [["uplifting", 4], ["energy", 3], ["focus", 3], ["warming", 3], ["calm", 2]],
},

ceylon: {
  // ...
  effects: [["energy", 3], ["uplifting", 3], ["warming", 3], ["focus", 2], ["digestive", 2]],
},

lapsang: {
  // ...
  effects: [["warming", 4], ["grounding", 3], ["energy", 3], ["digestive", 2], ["focus", 2], ["soothing", 2]],
},

// White
white: {
  // ...
  effects: [["calm", 3], ["uplifting", 3], ["focus", 3], ["cooling", 2]],
},

// Oolong & post-fermented
oolong: {
  // ...
  effects: [["focus", 4], ["uplifting", 3], ["energy", 3], ["warming", 2], ["calm", 2], ["soothing", 2]],
},

puerh: {
  // ...
  effects: [["digestive", 4], ["grounding", 3], ["warming", 3], ["energy", 2], ["focus", 2], ["soothing", 2]],
},

// Greens
gyokuro: {
  // ...
  effects: [["focus", 5], ["calm", 4], ["uplifting", 2], ["cooling", 2], ["energy", 2], ["soothing", 2], ["grounding", 1]],
},

gunpowder: {
  // ...
  effects: [["focus", 3], ["energy", 3], ["cooling", 2], ["uplifting", 2], ["digestive", 2]],
},

hojicha: {
  // ...
  effects: [["soothing", 4], ["calm", 3], ["warming", 3], ["digestive", 2], ["grounding", 2]],
},

dragonwell: {
  // ...
  effects: [["focus", 4], ["uplifting", 3], ["energy", 3], ["cooling", 2], ["calm", 2]],
},
```

### 1.2 Herbals (researched post-migration)

```js
rooibos: {
  // ...
  effects: [["soothing", 4], ["digestive", 2], ["grounding", 2]],
},

tulsi: {
  // ...
  effects: [["calm", 3], ["soothing", 3], ["grounding", 3], ["uplifting", 2], ["digestive", 2], ["warming", 2]],
  // NOTE: Adaptogen profile — broad coverage (6 effects at 2-3
  // strength) rather than focused peak. Pattern matches ashwagandha.
  // GABAergic mechanism via ursolic acid (shared with lemon balm).
},

"lemon-balm": {  // verify exact key name in app
  // ...
  effects: [["calm", 4], ["sleepy", 3], ["cooling", 2], ["uplifting", 2], ["soothing", 2]],
  // NOTE: First herbal at calm=4 (joins gyokuro and chamomile).
  // GABA-T inhibitor mechanism well-evidenced (Awad 2007, 2009).
},

lemongrass: {
  // ...
  effects: [["cooling", 3], ["uplifting", 3], ["digestive", 2], ["calm", 2]],
  // NOTE: Joins spearmint, gunpowder, hibiscus at cooling=3.
  // Citral mechanism distinct from menthol/carvone/anthocyanin.
},

fennel: {
  // ...
  effects: [["digestive", 4], ["cooling", 2], ["soothing", 2], ["calm", 1]],
  // NOTE: Joins ginger, peppermint, puerh at digestive=4.
  // Anethole-GABA gut receptor mechanism documented.
},

spearmint: {
  // ...
  effects: [["cooling", 3], ["digestive", 3], ["uplifting", 2], ["calm", 2]],
  // NOTE: Sits intentionally below peppermint (4) — carvone
  // produces gentler cooling than menthol. Has uniquely strong
  // RCT evidence for anti-androgenic effect in PCOS (Akdogan 2007,
  // Grant 2010), worth surfacing in user-facing copy though
  // doesn't map to vocabulary effect.
},
```

### 1.3 Spices

```js
ginger: {
  // ...
  effects: [["warming", 5], ["digestive", 4], ["energy", 2], ["soothing", 2], ["grounding", 1]],
  // NOTE: First catalog ingredient at warming=5 — this is the new ceiling
},

cinnamon: {
  // ...
  effects: [["warming", 4], ["digestive", 3], ["uplifting", 2], ["soothing", 2], ["grounding", 1]],
},

cardamom: {
  // ...
  effects: [["digestive", 3], ["warming", 3], ["uplifting", 3], ["cooling", 2], ["soothing", 2]],
  // NOTE: First catalog ingredient carrying BOTH warming and cooling
  // (the paired-effects vocabulary test — passed). Warming from spice
  // character; cooling from eucalyptol/1,8-cineole.
},

cloves: {
  // ...
  effects: [["warming", 4], ["digestive", 3], ["grounding", 2], ["soothing", 2]],
  // NOTE: Joins cinnamon at warming=4. Different character (clove
  // warms "sharper", cinnamon warms "broader"). Both legitimate.
},

vanilla: {
  // ...
  effects: [["soothing", 3], ["calm", 2], ["uplifting", 2], ["warming", 1], ["sleepy", 1]],
  // NOTE: First ingredient where effects are driven primarily by
  // aromatic/psychological response rather than pharmacology. All
  // effect claims marked `attested` in research file. Vocabulary v2
  // might benefit from explicit aromatic-vs-pharmacological
  // distinction.
},
```

---

## Section 2 — Effect array swaps WITH vocabulary migration

These ingredients were researched using vocabulary v0. The research
files contain deprecated terms (`settle`, `comfort`, `bitterness`).
The values below have been migrated to vocabulary v1 following the
mapping table above.

> **Double-check context:** When doing the migration, re-read each
> research file's Section 5 ("Effects — felt") to confirm the
> context. The `settle` → `calm`/`digestive` mapping is
> context-dependent and was applied based on the dominant effect
> each herb is known for.

### 2.1 Florals and calming herbs

```js
chamomile: {
  // ...
  // v0: [["calm", 4], ["sleepy", 3], ["settle", 3]]
  effects: [["calm", 4], ["sleepy", 3], ["soothing", 3]],
  // Rationale: chamomile's "settle" is more about relaxation than
  // digestion in the canonical cup; maps to soothing (tea-quality
  // comfort) rather than digestive (GI-specific).
  // Alternative interpretation: soothing here could be [["calm", 4],
  // ["sleepy", 3], ["digestive", 2]] if we emphasize the traditional
  // stomach-calming use. Flagged for decision.
},

lavender: {
  // ...
  // v0: [["calm", 3], ["sleepy", 2], ["comfort", 2]]
  effects: [["calm", 3], ["sleepy", 2], ["soothing", 2]],
},

rose: {
  // ...
  // v0: [["calm", 3], ["sleepy", 2], ["comfort", 3]]
  effects: [["calm", 3], ["sleepy", 2], ["soothing", 3]],
},

jasmine: {
  // ...
  // v0: [["calm", 3], ["energy", 2], ["focus", 2]]
  effects: [["calm", 3], ["energy", 2], ["focus", 2]],
  // No v0 deprecated terms in this one — just verify against app
},

passionflower: {
  // ...
  // v0: [["calm", 3], ["sleepy", 3], ["settle", 2]]
  effects: [["calm", 3], ["sleepy", 3], ["soothing", 2]],
  // Rationale: passionflower is a sedative not a digestive;
  // "settle" maps to soothing (general relaxation support).
},
```

### 2.2 Cooling and digestive herbs

```js
peppermint: {
  // ...
  // v0: [["cooling", 4], ["settle", 4], ["calm", 2], ["focus", 2]]
  effects: [["cooling", 4], ["digestive", 4], ["calm", 2], ["focus", 2]],
  // Rationale: peppermint's "settle" is specifically GI-settling,
  // mapping cleanly to digestive.
},

hibiscus: {
  // ...
  // v0: [["energy", 2], ["cooling", 3], ["settle", 2]]
  effects: [["energy", 2], ["cooling", 3], ["digestive", 2]],
  // Rationale: hibiscus's "settle" is more digestive/refreshing
  // than calming; maps to digestive.
},
```

### 2.3 Green tea (sencha) — file is named green-tea.md

```js
sencha: {
  // ...
  // v0: [["focus", 4], ["energy", 3], ["calm", 3]]
  // Note: v0 file had "bitterness" in STRONG profile; removing
  // as that's a flavor/taste, not an effect
  effects: [["focus", 4], ["energy", 3], ["calm", 3], ["cooling", 2]],
  // Added cooling=2 for TCM consistency with other greens in the
  // catalog (gyokuro, gunpowder, dragonwell all carry cooling=2)
},
```

---

## Section 3 — New ingredient additions

### 3.1 Turmeric

**Decision required:** Add to catalog? Recommended yes, with
caveats documented in `docs/research/ingredients/turmeric.md`
Section 11.

If approved, add this entry to INGREDIENTS:

```js
turmeric: {
  id: "turmeric",
  displayName: "Turmeric",
  latin: "Curcuma longa",
  category: "spice",
  subcategory: "rhizome",
  aliases: ["haridra", "haldi", "golden spice"],

  // Sensory
  flavors: ["earthy", "bitter", "musky", "woody"],
  basicTastes: {
    bitter: 3,
    astringent: 3,
    sweet: 1,
    pungent: 1,
  },

  // Brewing
  tempRange: [95, 100],
  timeRange: [600, 900], // 10-15 min; longer than most
  caffeine: 0,
  doseGuidance: "1/4 - 1/2 tsp dried per 250ml (small — bitterness sets practical limit)",

  // Effects (vocabulary v1)
  effects: [["warming", 3], ["soothing", 2], ["grounding", 2], ["digestive", 2]],

  // Pairing notes
  idealPairings: ["ginger", "cinnamon", "cardamom", "black-pepper-conceptual"],
  canonicalPreparation: "golden milk (haldi doodh) — with black pepper and fat for bioavailability",

  // Flags
  confidenceMarkers: {
    antiInflammatory: "attested", // mixed clinical evidence, bioavailability-dependent
    digestive: "attested",
    warming: "verified",
  },
},
```

### 3.2 Ashwagandha

**Decision required:** Add to catalog? Recommended yes, with
strong caveats documented in `docs/research/ingredients/ashwagandha.md`
Section 11.

If approved, add this entry to INGREDIENTS:

```js
ashwagandha: {
  id: "ashwagandha",
  displayName: "Ashwagandha",
  latin: "Withania somnifera",
  category: "herbal",  // possibly "adaptogen" if subcategory exists
  subcategory: "root",
  aliases: ["asgandh", "asvagandha", "Indian ginseng (deprecated, misleading)", "winter cherry"],

  // Sensory
  flavors: ["earthy", "musty", "bitter", "woody"],
  basicTastes: {
    bitter: 3,
    astringent: 3,
    earthy: 5,
    sweet: 1,
    umami: 1,
  },

  // Brewing
  tempRange: [95, 100],
  timeRange: [600, 1200], // 10-20 min; root extracts slowly
  caffeine: 0,
  doseGuidance: "1/2 - 1 tsp dried powdered root per 250ml (challenging flavor; less is often better)",

  // Effects (vocabulary v1)
  effects: [["grounding", 4], ["calm", 3], ["sleepy", 3], ["soothing", 3], ["warming", 2]],
  // NOTE: First non-tea ingredient at grounding=4 in STANDARD profile.
  // Calibration test passed — exceeds previous tea ceiling of 3.

  // Pairing notes
  idealPairings: ["cinnamon", "cardamom", "ginger", "rooibos", "milk-preparation"],
  canonicalPreparation: "ashwagandha kshir — milk + spices + sweetener; tea is modern Western adaptation",

  // Safety flags (CRITICAL)
  safetyFlags: {
    pregnancy: "avoid", // conservative consensus
    thyroidMedication: "interaction", // documented antithyrotropic effects
    sedativeMedication: "additive",
    autoimmune: "caution", // immune-stimulating; consult provider
  },

  // Flags
  confidenceMarkers: {
    stress: "established",
    sleep: "established",
    cortisolModulation: "established",
    grounding: "verified",
  },
},
```

### 3.3 Matcha

**Decision required:** Add to catalog. Strong recommendation —
matcha was the biggest single gap in the original catalog.

If approved, add this entry to INGREDIENTS:

```js
matcha: {
  id: "matcha",
  displayName: "Matcha",
  latin: "Camellia sinensis (shaded, powdered)",
  category: "tea",
  subcategory: "green-shaded-powdered",  // distinguishes from gyokuro per Principle #18
  aliases: ["抹茶", "tencha (pre-ground)", "usucha (thin)", "koicha (thick)"],

  // Sensory
  flavors: ["umami", "vegetal", "grassy", "sweet", "oceanic"],
  basicTastes: {
    umami: 5,
    sweet: 2,
    bitter: 2,
    astringent: 1,
  },

  // Brewing — DIFFERENT MECHANIC than steeped tea
  tempRange: [70, 80],  // CRITICAL: never use boiling water
  timeRange: [15, 30],  // whisk time, not infusion time
  caffeine: 60,  // standard usucha; ceremonial 2g serving up to 140mg
  doseGuidance: "1-2g powder per 60-80ml water; whisked, not steeped; entire leaf consumed",
  preparationPattern: "whisk",  // NEW field type — distinguishes from "steep"

  // Effects (vocabulary v1)
  effects: [["focus", 5], ["energy", 4], ["calm", 3], ["uplifting", 2], ["soothing", 1]],
  // NOTE: Joins gyokuro at focus=5 ceiling. Joins assam at energy=4.
  // The "calm focus" prototype — L-theanine + caffeine synergy.

  // Pairing notes
  idealPairings: ["typically standalone", "milk (latte preparation)"],
  canonicalPreparation: "usucha (thin) — 1-2g whisked into 60-80ml water at 70-80°C until frothy",
  gradeMatters: true,  // ceremonial / premium / culinary; significant quality variation

  // Safety flags
  safetyFlags: {
    caffeine: "high",  // catalog ceiling at ceremonial grade
    leadTesting: "verify-source",  // whole-leaf consumption increases lead exposure
    pregnancyModerate: "limit-200mg-caffeine-daily",
    warfarin: "interaction",  // significant Vitamin K from chlorophyll
  },

  // Flags
  confidenceMarkers: {
    cognitiveEnhancement: "established",
    antioxidant: "established",
    sustainedEnergy: "attested",
    metabolismBoost: "attested",
  },
},
```

### 3.4 Yerba Mate

**Decision required:** Add to catalog. First caffeinated herbal.
Tests Principle #16.

If approved, add this entry to INGREDIENTS:

```js
"yerba-mate": {
  id: "yerba-mate",
  displayName: "Yerba Mate",
  latin: "Ilex paraguariensis",
  category: "herbal",  // Per Principle #16: not Camellia sinensis = herbal
  subcategory: "leaf",
  aliases: ["mate", "chimarrão", "cimarrón", "ka'ay", "erva-mate", "Paraguay tea"],

  // Sensory
  flavors: ["earthy", "grassy", "herbaceous", "bitter", "slightly-smoky"],
  basicTastes: {
    bitter: 4,
    astringent: 3,
    earthy: 3,
    sweet: 0,
    umami: 1,
  },

  // Brewing
  tempRange: [70, 85],  // CRITICAL: never boiling (cancer association at very hot temps)
  timeRange: [60, 300],  // single fill; multi-refill sessions extend
  caffeine: 40,  // single cup; cumulative across refills 80-120mg
  doseGuidance: "Gourd 2/3 full of dried mate (~30-50g leaves) per multi-refill session OR 1-2g per single tea-bag cup",
  preparationPattern: "gourd-multi-refill OR steep-single-cup",

  // Effects (vocabulary v1)
  effects: [["energy", 4], ["focus", 3], ["digestive", 2], ["uplifting", 2], ["warming", 1]],
  // NOTE: First caffeinated herbal in catalog. Joins assam and matcha at energy=4
  // via different mechanism (xanthine triad: caffeine + theobromine + theophylline).

  // Pairing notes
  idealPairings: ["lemongrass", "mint", "citrus-peel", "ginger"],
  canonicalPreparation: "Traditional gourd + bombilla + multi-refill social session",

  // Safety flags
  safetyFlags: {
    caffeine: "moderate",
    veryHotTemperature: "esophageal-cancer-risk",  // IARC Group 2A; drink at 70-80°C not above
    pregnancy: "limit-caffeine",
    smokeDried: "PAH-concern",  // for barbacuá-processed varieties
  },

  // Flags
  confidenceMarkers: {
    sustainedEnergy: "established",
    antioxidant: "established",
    cardiovascularSupport: "attested",
    weightManagement: "attested",
  },
},
```

### 3.5 Valerian

**Decision required:** Add to catalog. Sets sleepy=5 ceiling.
The classic Western sleep specialist.

If approved, add this entry to INGREDIENTS:

```js
valerian: {
  id: "valerian",
  displayName: "Valerian",
  latin: "Valeriana officinalis",
  category: "herbal",
  subcategory: "root",
  aliases: ["all-heal", "garden heliotrope", "setwall", "phu (historical Greek)"],

  // Sensory
  flavors: ["earthy", "musky", "pungent", "bitter", "woody"],
  basicTastes: {
    bitter: 4,
    astringent: 3,
    earthy: 4,
    pungent: 3,
    sweet: 0,
  },

  // Brewing
  tempRange: [85, 95],
  timeRange: [600, 900],  // 10-15 min for therapeutic effect
  caffeine: 0,
  doseGuidance: "1-2 tsp dried root per 250ml; 2-3g for therapeutic strength",

  // Effects (vocabulary v1)
  effects: [["sleepy", 5], ["calm", 4], ["soothing", 3], ["grounding", 2]],
  // NOTE: Sets catalog sleepy=5 ceiling. First ingredient at this level.
  // GABA-A receptor binding (beta subunit) similar to benzodiazepines (gamma subunit).
  // ALSO: explicit driving/operating-machinery warning required.

  // Pairing notes
  idealPairings: ["lemon-balm", "chamomile", "lavender", "passionflower"],
  canonicalPreparation: "Often combined with lemon balm (Cerny 1999 validated combination)",

  // Safety flags (CRITICAL)
  safetyFlags: {
    sedation: "DO-NOT-DRIVE",  // explicit functional warning required
    alcohol: "additive-do-not-combine",
    benzodiazepines: "additive-do-not-combine",
    pregnancy: "avoid-insufficient-data",
    paradoxicalStimulation: "5-10-percent-of-users",
    longTermUse: "limit-4-6-weeks-without-medical-evaluation",
  },

  // Flags
  confidenceMarkers: {
    insomnia: "established",
    anxiety: "established",
    GABA_A_modulation: "established",
    smell: "verified",  // funky-cheesy is a feature not a bug
  },
},
```

### 3.6 Echinacea

**Decision required:** Add to catalog. Tests immune-support
vocabulary gap; classic North American indigenous medicine.

If approved, add this entry to INGREDIENTS:

```js
echinacea: {
  id: "echinacea",
  displayName: "Echinacea",
  latin: "Echinacea purpurea (most common; also E. angustifolia, E. pallida)",
  category: "herbal",
  subcategory: "flower",  // aerial parts most common in tea; roots traditional
  aliases: ["purple coneflower", "purple Kansas coneflower", "Black Sampson"],

  // Sensory
  flavors: ["earthy", "grassy", "slightly-bitter", "subtly-floral", "tongue-tingling"],
  basicTastes: {
    bitter: 2,
    astringent: 2,
    aromatic: 2,
    sweet: 1,
    tingling: 2,  // alkamide-driven; species-dependent
  },

  // Brewing
  tempRange: [90, 100],
  timeRange: [300, 900],  // 5-15 min
  caffeine: 0,
  doseGuidance: "1-2 tsp dried herb per 250ml; clinical extracts use 300-500mg standardized",

  // Effects (vocabulary v1)
  effects: [["soothing", 2], ["warming", 1], ["uplifting", 1], ["digestive", 1]],
  // NOTE: "Immune support" effect doesn't map cleanly to vocabulary v1.
  // Captured as soothing=2 with copy-driven framing for the immune role.
  // Mechanistically real (alkamide-CB2 binding); clinical effects modest.

  // Pairing notes
  idealPairings: ["elderberry", "ginger", "lemon", "honey", "thyme"],
  canonicalPreparation: "Best at first sign of cold; tea-strength is sub-medicinal vs. tinctures",

  // Safety flags (IMPORTANT)
  safetyFlags: {
    asteraceaeAllergy: "cross-react",  // ragweed/chamomile/marigold allergy
    autoimmune: "caution-traditional",  // immune-stimulating; modern evidence evolving
    pregnancy: "avoid-insufficient-data",
    immunosuppressants: "interaction",
    durationLimit: "8-10-weeks-traditional",  // conservative; Eccles 2012 4-month trial showed safety
  },

  // Flags
  confidenceMarkers: {
    coldDuration: "attested",
    coldPrevention: "attested",
    CB2_alkamide_binding: "established",
    immunomodulation: "attested",
    "antiviral-in-vitro": "established",
  },
},
```

### 3.7 Licorice Root

**Decision required:** Add to catalog. The TCM harmonizer with
the most significant safety profile in the catalog.

If approved, add this entry to INGREDIENTS:

```js
"licorice-root": {
  id: "licorice-root",
  displayName: "Licorice Root",
  latin: "Glycyrrhiza glabra (Western) / G. uralensis (Chinese, Gan Cao)",
  category: "herbal",
  subcategory: "root",
  aliases: ["sweet root", "Gan Cao (甘草)", "Mulethi", "Yashtimadhu", "liquorice"],

  // Sensory
  flavors: ["intensely-sweet", "anise", "woody", "earthy", "slightly-bitter"],
  basicTastes: {
    sweet: 5,  // CATALOG CEILING — 50x sucrose by weight (glycyrrhizin)
    aromatic: 3,
    bitter: 1,
    astringent: 1,
    umami: 1,
  },

  // Brewing
  tempRange: [95, 100],
  timeRange: [300, 900],
  caffeine: 0,
  doseGuidance: "1/2-1 tsp per 250ml. CRITICAL: less is more; 2+ tsp approaches dose ceiling",

  // Effects (vocabulary v1)
  effects: [["soothing", 4], ["digestive", 2], ["warming", 1], ["calm", 1], ["uplifting", 1]],
  // NOTE: Joins rooibos and hojicha at soothing=4 via demulcent + cortisol-extending mechanism.
  // The catalog's sweetness ceiling at 5.

  // Pairing notes
  idealPairings: ["marshmallow-root", "ginger", "cinnamon", "star-anise", "fennel", "peppermint"],
  canonicalPreparation: "Typically 5-15% of a blend (TCM harmonizer pattern); rarely consumed solo",
  harmonizerFlag: true,  // unique blend-recommendation property

  // Safety flags (CRITICAL — most significant in catalog)
  safetyFlags: {
    pseudoaldosteronism: "REAL-RISK",  // dose-dependent BP elevation, K+ depletion
    doseLimit: "max-3g-day-OR-100mg-glycyrrhizin",
    durationLimit: "max-4-6-weeks-continuous",
    hypertension: "AVOID",
    heartDisease: "AVOID",
    kidneyDisease: "AVOID",
    pregnancy: "AVOID",  // Finnish cohort studies on preterm birth, child cognition
    breastfeeding: "AVOID",
    diuretics: "DANGEROUS-additive-K-depletion",
    digoxin: "DANGEROUS-via-hypokalemia",
    corticosteroids: "extends-half-life",
    spironolactone: "blunts-effect",
    DGL_alternative: "deglycyrrhizinated-licorice-removes-pseudoaldosteronism-risk",
  },

  // Flags
  confidenceMarkers: {
    "ulcer-DGL": "established",
    "throat-soothing": "established",
    pseudoaldosteronism: "established",
    "11_beta_HSD2_inhibition": "established",
    antiviral: "established",
    harmonizer: "verified",  // TCM cultural-functional role
  },
},
```

### 3.8 Genmaicha

**Decision required:** Add to catalog. Tests Principle #18
(same plant different prep). Easiest Phase A addition; safest
profile.

If approved, add this entry to INGREDIENTS:

```js
genmaicha: {
  id: "genmaicha",
  displayName: "Genmaicha",
  latin: "Camellia sinensis (sencha) + Oryza sativa (roasted brown rice)",
  category: "tea",
  subcategory: "green-with-rice",  // distinguishes from pure sencha per Principle #18
  aliases: ["玄米茶", "popcorn tea", "people's tea (民の茶)", "brown rice tea"],

  // Sensory
  flavors: ["toasty", "nutty", "grassy", "mildly-sweet", "slightly-savory"],
  basicTastes: {
    umami: 3,
    sweet: 2,
    bitter: 1,
    astringent: 1,
    aromatic: 3,  // toasty register
  },

  // Brewing
  tempRange: [70, 85],  // wider tolerance than pure sencha
  timeRange: [60, 180],  // 1-3 min; quick like other Japanese greens
  caffeine: 20,  // ~half of pure sencha
  doseGuidance: "5g (~1.5 tsp) per 250ml; slightly more than pure sencha because rice takes volume",

  // Effects (vocabulary v1)
  effects: [["soothing", 3], ["calm", 3], ["focus", 2], ["warming", 2], ["uplifting", 2], ["digestive", 2]],
  // NOTE: Validates Principle #18. Substantially different effect profile from sencha
  // (focus 4, energy 3, calm 3, cooling 2). Trades focus/energy for soothing/warming/digestive.

  // Pairing notes
  idealPairings: ["typically-standalone", "Japanese-confectionery (wagashi)"],
  canonicalPreparation: "Standard 80°C / 2 min for balanced cup; 70°C emphasizes tea, 85°C emphasizes rice",
  variants: ["bancha-genmaicha", "matcha-iri-genmaicha", "hoji-genmaicha", "gyokuro-genmaicha"],

  // Safety flags (LOWEST in Phase A)
  safetyFlags: {
    caffeine: "low",  // ~20mg/cup; suitable for evening
    ironAbsorption: "tannin-buffered",  // rice softens tea's iron-absorption effect
    pregnancyModerate: "well-within-200mg-daily-caffeine-guideline",
  },

  // Flags
  confidenceMarkers: {
    lowerCaffeineThanSencha: "verified",
    comfortingTexture: "verified",
    afterMealJapaneseTradition: "verified",
    mottainai: "verified",  // cultural framing
  },
},
```

### 3.9 Reishi Mushroom

**Decision required:** Add to catalog. Establishes mushroom
subcategory per Principle #17; sets `grounding` 5 ceiling.

```js
reishi: {
  id: "reishi",
  displayName: "Reishi",
  latin: "Ganoderma lucidum",
  category: "herbal",  // Per Principle #17
  subcategory: "fungus",  // NEW SUBCATEGORY
  aliases: ["Lingzhi (灵芝)", "Mannentake (万年茸)", "mushroom of immortality"],

  flavors: ["bitter", "earthy", "woody", "mushroomy", "tannic"],
  basicTastes: { bitter: 5, astringent: 3, earthy: 4, umami: 1, sweet: 0 },

  tempRange: [95, 100],
  timeRange: [1800, 7200],  // 30 min - 2 hr decoction
  caffeine: 0,
  doseGuidance: "3-9g dried sliced reishi per 500-1000ml water for traditional decoction",
  preparationPattern: "decoction",  // NEW PATTERN VALUE

  effects: [["grounding", 5], ["sleepy", 4], ["calm", 4], ["soothing", 3], ["warming", 1]],
  // NOTE: Sets grounding=5 ceiling. First mushroom in catalog establishes subcategory.

  idealPairings: ["jujube", "goji", "ashwagandha", "cinnamon", "honey"],
  canonicalPreparation: "Long decoction with jujube and goji to balance bitterness; not casual sipping tea",

  safetyFlags: {
    anticoagulants: "antiplatelet-additive",
    diabetesMedications: "monitor-glucose",
    bloodPressure: "modest-additive-hypotensive",
    immunosuppressants: "caution-immunomodulator",
    pregnancy: "avoid-insufficient-data",
    qualityVariation: "fruiting-body-vs-mycelium-vs-spore-significant",
  },

  confidenceMarkers: {
    sleep: "established",  // Chu 2023 meta-analysis
    immunomodulation: "established",
    HPA_axis: "attested",
    hepatoprotection: "attested",
    "an_shen_tradition": "verified",  // TCM cultural-functional role
  },
},
```

### 3.10 Lion's Mane Mushroom

**Decision required:** Add to catalog. Joins reishi in mushroom
subcategory; surfaces neurotrophic vocabulary v2 gap.

```js
"lions-mane": {
  id: "lions-mane",
  displayName: "Lion's Mane",
  latin: "Hericium erinaceus",
  category: "herbal",
  subcategory: "fungus",  // Second mushroom; subcategory established
  aliases: ["Yamabushitake (山伏茸)", "Hou Tou Gu (猴頭菇)", "monkey head mushroom", "bearded tooth fungus"],

  flavors: ["mild", "sweet", "seafood-like", "earthy", "nutty"],
  basicTastes: { umami: 3, sweet: 2, bitter: 1, astringent: 1, earthy: 2 },

  tempRange: [90, 100],
  timeRange: [600, 1800],  // 10-30 min
  caffeine: 0,
  doseGuidance: "2-3g dried lion's mane per 250ml; clinical extracts use 500-3000mg",

  effects: [["focus", 3], ["calm", 2], ["soothing", 2], ["uplifting", 2], ["grounding", 2], ["digestive", 2]],
  // NOTE: Adds vocabulary v2 gap #7 (neurotrophic NGF-BDNF).
  // Effects build over weeks, not acute. The most palatable mushroom in catalog.

  idealPairings: ["cocoa", "cinnamon", "vanilla", "reishi", "honey"],
  canonicalPreparation: "Daily-practice ingredient; effects build over weeks",
  effectTimeframe: "chronic-build-not-acute",  // NEW field type to surface

  safetyFlags: {
    anticoagulants: "mild-antiplatelet",
    diabetesMedications: "modest-glucose-lowering",
    pregnancy: "limited-data-conservative",
    mushroomAllergy: "absolute-contraindication",
    rare_ARDS_case: "single-case-report-Nakatsugawa-2003",
  },

  confidenceMarkers: {
    NGF_stimulation: "established",
    BDNF_pathway: "established",
    cognitiveSupport: "attested",  // Mori 2009 in MCI
    neurogenesis: "established",  // hippocampal
    moodSupport: "attested",
  },
},
```

### 3.11 Stinging Nettle

**Decision required:** Add to catalog. Mineral-rich Western
herbal; allergy-support documented mechanism; surfaces v2 gap #8.

```js
nettle: {
  id: "nettle",
  displayName: "Nettle",
  latin: "Urtica dioica",
  category: "herbal",
  subcategory: "leaf",
  aliases: ["stinging nettle", "common nettle", "Bichu butti (Hindi)", "Vrishchhiyaa-shaaka (Sanskrit)"],

  flavors: ["earthy", "grassy", "mineral", "spinach-like", "subtly-sweet"],
  basicTastes: { earthy: 3, mineral: 3, umami: 2, bitter: 1, sweet: 1 },

  tempRange: [95, 100],
  timeRange: [300, 900],  // 5-15 min standard; 4-8 hr for nourishing infusion
  caffeine: 0,
  doseGuidance: "1-2 tsp dried nettle per 250ml; long infusion (4-8 hr) for maximum mineral extraction",

  effects: [["soothing", 3], ["grounding", 2], ["digestive", 2], ["uplifting", 1], ["calm", 1], ["warming", 1]],
  // NOTE: Adds vocabulary v2 gap #8 (anti-allergic / antihistaminic).
  // The "spring tonic" mineral-nourishment register.

  idealPairings: ["lemon-balm", "dandelion", "mint", "rooibos", "honey", "lemon"],
  canonicalPreparation: "Standard 10-min steep OR Susun Weed nourishing infusion (4-8 hours covered)",
  preparationPattern: "long-infusion-optional",

  safetyFlags: {
    freshPlantSting: "processing-destroys",
    warfarin: "vitamin-K-significant",  // genuine concern
    diuretics: "mild-additive",
    diabetesMedications: "modest-glucose-lowering",
    pregnancy: "tea-strength-acceptable-traditional-use",
    mushroomAllergy: "no-cross-react",
  },

  confidenceMarkers: {
    "allergic-rhinitis": "attested",  // Mittman 1990; 2017 Iranian RCT
    "H1-receptor-antagonism": "established",
    "BPH-symptom-support": "attested",
    "blood-glucose-lowering": "attested",  // Kianbakht 2013
    nutritional: "verified",  // iron, calcium, magnesium, vitamins
    spring_tonic_tradition: "verified",
  },
},
```

### 3.12 Linden (Tilia)

**Decision required:** Add to catalog. Completes floral-calming
trio (chamomile + lavender + linden); joins `calm` 4 cluster
via documented benzodiazepine receptor ligands.

```js
linden: {
  id: "linden",
  displayName: "Linden",
  latin: "Tilia cordata (small-leaved lime)",
  category: "herbal",
  subcategory: "flower",
  aliases: ["lime flower", "Tilleul (French)", "Tila/Tilo (Spanish)", "Lipa (Slavic)", "Linde (German)", "basswood (T. americana)"],

  flavors: ["honey-sweet", "citrusy", "floral", "delicate", "slightly-green"],
  basicTastes: { sweet: 3, aromatic: 3, bitter: 0, astringent: 0 },

  tempRange: [85, 95],
  timeRange: [300, 600],  // 5-10 min
  caffeine: 0,
  doseGuidance: "1-2 tsp dried flowers per 250ml; covered cup preserves volatile aromatics",

  effects: [["calm", 4], ["sleepy", 3], ["soothing", 3], ["uplifting", 2], ["warming", 1], ["cooling", 1], ["digestive", 1]],
  // NOTE: Joins calm=4 cluster via Viola 1994 benzodiazepine receptor ligands mechanism.
  // The lightest "calming flower" in floral-calming trio with chamomile and lavender.

  idealPairings: ["chamomile", "lemon-balm", "lavender", "passionflower", "mint", "honey", "rose"],
  canonicalPreparation: "Covered-cup steep at 85-90°C for 5-10 min",
  childrenFriendly: true,  // gentle enough for kids in traditional European pediatric use

  safetyFlags: {
    pregnancy: "tea-strength-acceptable-traditional-use",
    sedatives: "theoretical-additive",
    cardiacGlycosides: "very-high-doses-only-folk-caution",
    petSafe: true,  // not toxic to dogs/cats per ASPCA
  },

  confidenceMarkers: {
    "benzodiazepine-receptor-binding": "established",  // Viola 1994
    "GABA-mimetic": "attested",
    anxiolytic: "attested",
    diaphoretic: "verified",
    "Proust-tilleul-cultural-depth": "verified",
    "European-Latin-American-tradition": "verified",
  },
},
```

### 3.13 Elderflower

**Decision required:** Add to catalog. European immune-support
flower; surfaces v2 gap #6 (immune support); validates
Principle #18 elderflower/elderberry split.

```js
elderflower: {
  id: "elderflower",
  displayName: "Elderflower",
  latin: "Sambucus nigra",
  category: "herbal",
  subcategory: "flower",
  aliases: ["black elder", "Holunder (German)", "Sureau (French)", "Sambuco (Italian)", "Saúco (Spanish)"],

  flavors: ["floral", "muscat-grape", "lychee-tropical", "gently-sweet", "delicate"],
  basicTastes: { aromatic: 4, sweet: 2, bitter: 1, astringent: 1, sour: 1 },

  tempRange: [85, 95],
  timeRange: [300, 600],  // 5-10 min
  caffeine: 0,
  doseGuidance: "1-2 tsp dried elderflowers per 250ml; covered cup preserves volatile aromatics",

  effects: [["soothing", 3], ["uplifting", 2], ["warming", 1], ["cooling", 1], ["calm", 1], ["digestive", 1]],
  // NOTE: Surfaces vocabulary v2 gap #6 (immune support) - third instance with echinacea and nettle.
  // Documented antiviral activity (Roschek 2009); German Commission E approved for cold/flu.

  idealPairings: ["echinacea", "peppermint", "ginger", "lemon", "honey", "linden", "rose"],
  canonicalPreparation: "Covered-cup steep at 85-90°C for 5-10 min; classic European cold-care",

  safetyFlags: {
    cyanogenicGlycosides_otherParts: "leaves-bark-raw-berries-NOT-flowers",
    diuretics: "mild-additive",
    diabetesMedications: "theoretical-additive",
    immunosuppressants: "caution-theoretical",
    pregnancy: "tea-strength-acceptable-traditional-use",
    speciesNote: "S-nigra-or-canadensis-acceptable-S-racemosa-avoid",
  },

  confidenceMarkers: {
    "antiviral-flavonoid-mechanism": "established",  // Roschek 2009
    "cold-flu-symptom-support": "attested",  // mostly elderberry data; family evidence
    "German-Commission-E-approval": "verified",
    diaphoretic: "verified",
    "Elder-Mother-folklore": "verified",
    "muscat-lychee-aroma": "verified",
  },
},
```

**Schema caveats apply to all Section 3 entries.** Will need
to reconcile with actual `src/data/ingredients.js` schema before
applying.

**New schema patterns introduced:**
- `preparationPattern`: distinguishes "steep" / "whisk" /
  "gourd-multi-refill" / "milk-preparation" / **"decoction"**
  (added by reishi) / **"long-infusion-optional"** (added by
  nettle) — needed for matcha, yerba-mate, ashwagandha,
  turmeric, reishi, lion's mane, nettle
- `gradeMatters`: flag for ingredients where grade variation
  is fundamental to UX (currently just matcha)
- `harmonizerFlag`: blend-recommendation property (currently
  just licorice-root)
- `variants`: array of named cultural variations within an
  ingredient (genmaicha-iri patterns; could apply to oolong
  cultivars in future)
- **`subcategory: fungus`** — new subcategory value (reishi,
  lion's mane); per Principle #17 mushrooms get subcategory
  not separate top-level category
- **`childrenFriendly: true`** — flag for ingredients
  traditionally safe for pediatric use (currently just linden)
- **`effectTimeframe: "chronic-build-not-acute"`** — new
  field type to surface lion's mane's weeks-scale timeline
  (most catalog ingredients work acutely)
- **`petSafe: true`** — flag for ingredients not toxic to
  common pets (currently just linden)
- Expanded `safetyFlags`: more nuanced than original schema
  likely supports; needs review during integration

---

## Summary table — all 23 ingredients at a glance

| Ingredient | Category | Status | Effects (v1) |
|-----------|----------|--------|--------------|
| chamomile | herbal | migrate | `calm 4, sleepy 3, soothing 3` |
| fennel | herbal | swap | `digestive 4, cooling 2, soothing 2, calm 1` |
| hibiscus | herbal | migrate | `energy 2, cooling 3, digestive 2` |
| lavender | herbal | migrate | `calm 3, sleepy 2, soothing 2` |
| lemon-balm | herbal | swap | `calm 4, sleepy 3, cooling 2, uplifting 2, soothing 2` |
| lemongrass | herbal | swap | `cooling 3, uplifting 3, digestive 2, calm 2` |
| rose | floral | migrate | `calm 3, sleepy 2, soothing 3` |
| jasmine | floral | verify | `calm 3, energy 2, focus 2` |
| passionflower | herbal | migrate | `calm 3, sleepy 3, soothing 2` |
| peppermint | herbal | migrate | `cooling 4, digestive 4, calm 2, focus 2` |
| rooibos | herbal | swap | `soothing 4, digestive 2, grounding 2` |
| sencha | green tea | migrate | `focus 4, energy 3, calm 3, cooling 2` |
| spearmint | herbal | swap | `cooling 3, digestive 3, uplifting 2, calm 2` |
| tulsi | herbal | swap | `calm 3, soothing 3, grounding 3, uplifting 2, digestive 2, warming 2` |
| assam | black | swap (verify unchanged) | `energy 5, focus 3, warming 4` |
| white | white | swap | `calm 3, uplifting 3, focus 3, cooling 2` |
| darjeeling | black | swap | `uplifting 4, energy 3, focus 3, warming 3, calm 2` |
| ceylon | black | swap | `energy 3, uplifting 3, warming 3, focus 2, digestive 2` |
| lapsang | black | swap | `warming 4, grounding 3, energy 3, digestive 2, focus 2, soothing 2` |
| puerh | post-fermented | swap | `digestive 4, grounding 3, warming 3, energy 2, focus 2, soothing 2` |
| oolong | oolong | swap | `focus 4, uplifting 3, energy 3, warming 2, calm 2, soothing 2` |
| gyokuro | green tea (shaded) | swap | `focus 5, calm 4, uplifting 2, cooling 2, energy 2, soothing 2, grounding 1` |
| gunpowder | green tea | swap | `focus 3, energy 3, cooling 2, uplifting 2, digestive 2` |
| hojicha | green tea (roasted) | swap | `soothing 4, calm 3, warming 3, digestive 2, grounding 2` |
| dragonwell | green tea | swap | `focus 4, uplifting 3, energy 3, cooling 2, calm 2` |
| ginger | spice | swap | `warming 5, digestive 4, energy 2, soothing 2, grounding 1` |
| cinnamon | spice | swap | `warming 4, digestive 3, uplifting 2, soothing 2, grounding 1` |
| cardamom | spice | swap | `digestive 3, warming 3, uplifting 3, cooling 2, soothing 2` |
| cloves | spice | swap | `warming 4, digestive 3, grounding 2, soothing 2` |
| vanilla | spice | swap | `soothing 3, calm 2, uplifting 2, warming 1, sleepy 1` |
| **turmeric** | **spice (NEW)** | **add** | `warming 3, soothing 2, grounding 2, digestive 2` |
| **ashwagandha** | **herbal (NEW)** | **add** | `grounding 4, calm 3, sleepy 3, soothing 3, warming 2` |
| **matcha** | **tea (NEW)** | **add** | `focus 5, energy 4, calm 3, uplifting 2, soothing 1` |
| **yerba-mate** | **herbal (NEW, caffeinated)** | **add** | `energy 4, focus 3, digestive 2, uplifting 2, warming 1` |
| **valerian** | **herbal (NEW)** | **add** | `sleepy 5, calm 4, soothing 3, grounding 2` |
| **echinacea** | **herbal (NEW)** | **add** | `soothing 2, warming 1, uplifting 1, digestive 1` |
| **licorice-root** | **herbal (NEW)** | **add** | `soothing 4, digestive 2, warming 1, calm 1, uplifting 1` |
| **genmaicha** | **tea (NEW)** | **add** | `soothing 3, calm 3, focus 2, warming 2, uplifting 2, digestive 2` |
| **reishi** | **herbal/fungus (NEW)** | **add** | `grounding 5, sleepy 4, calm 4, soothing 3, warming 1` |
| **lions-mane** | **herbal/fungus (NEW)** | **add** | `focus 3, calm 2, soothing 2, uplifting 2, grounding 2, digestive 2` |
| **nettle** | **herbal (NEW)** | **add** | `soothing 3, grounding 2, digestive 2, uplifting 1, calm 1, warming 1` |
| **linden** | **herbal (NEW)** | **add** | `calm 4, sleepy 3, soothing 3, uplifting 2, warming 1, cooling 1, digestive 1` |
| **elderflower** | **herbal (NEW)** | **add** | `soothing 3, uplifting 2, warming 1, cooling 1, calm 1, digestive 1` |

**Status legend:**
- `swap`: replace `effects` array directly (already vocab v1)
- `migrate`: replace `effects` array with v0→v1 conversion
- `verify`: likely unchanged or no deprecated terms, but confirm
- `add`: new ingredient, needs full object

---

## Suggested rollout order

1. **Batch 1 — True teas** (swap, low risk): assam verify, white, darjeeling, ceylon, lapsang, oolong, puerh, gyokuro, gunpowder, hojicha, dragonwell
2. **Batch 2 — Post-migration herbals** (swap): rooibos, ginger, cinnamon
3. **Batch 3 — V0 vocabulary migration** (higher risk, requires vocab decisions): chamomile, hibiscus, lavender, rose, jasmine (verify), peppermint, passionflower, sencha
4. **Batch 4 — New ingredient** (requires schema reconciliation): turmeric

Batches 1 and 2 could ship as a single commit. Batch 3 deserves
its own PR/commit for clearer diff review. Batch 4 is independent
and can ship whenever the schema work is ready.

---

## Vocabulary gaps flagged for v2 consideration

From this research pass, one vocabulary gap has been identified
and deferred for v2:

- **"anti-inflammatory"** has no clean mapping in v1. Currently
  mapped approximately to `soothing` (gentle reducing). Turmeric
  is the clearest case. Three v2 options are documented in
  `docs/research/ingredients/turmeric.md` Section 11. Recommended
  path: keep current mapping until adaptogens (ashwagandha, reishi)
  and other anti-inflammatory candidates accumulate enough pressure
  to justify vocabulary expansion.

---

## Maintenance

This file should be updated after each new ingredient research
trio. When updates are batch-applied to the live app, move the
corresponding entries to a "Completed" section below (or delete
them) so the remaining pending list stays accurate.

### Completed

*(empty — no app data updates have been applied yet)*

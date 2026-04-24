# App Data Updates — Consolidated Pending Changes

> **Purpose:** Single source of truth for effect array changes to
> `src/data/ingredients.js` that have been proposed during
> ingredient research but not yet pushed to the live app.
>
> **Status at creation:** April 24, 2026. Covers all 29 ingredients
> researched to date (including turmeric and ashwagandha as new
> catalog additions).
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

**Schema caveat:** Both turmeric and ashwagandha entries above
are best-guess schemas. Will need to reconcile with actual
`src/data/ingredients.js` schema before applying. The research
files themselves are schema-agnostic and capture everything that
matters.

---

## Summary table — all 23 ingredients at a glance

| Ingredient | Category | Status | Effects (v1) |
|-----------|----------|--------|--------------|
| chamomile | herbal | migrate | `calm 4, sleepy 3, soothing 3` |
| hibiscus | herbal | migrate | `energy 2, cooling 3, digestive 2` |
| lavender | herbal | migrate | `calm 3, sleepy 2, soothing 2` |
| rose | floral | migrate | `calm 3, sleepy 2, soothing 3` |
| jasmine | floral | verify | `calm 3, energy 2, focus 2` |
| peppermint | herbal | migrate | `cooling 4, digestive 4, calm 2, focus 2` |
| sencha | green tea | migrate | `focus 4, energy 3, calm 3, cooling 2` |
| passionflower | herbal | migrate | `calm 3, sleepy 3, soothing 2` |
| rooibos | herbal | swap | `soothing 4, digestive 2, grounding 2` |
| tulsi | herbal | swap | `calm 3, soothing 3, grounding 3, uplifting 2, digestive 2, warming 2` |
| lemon-balm | herbal | swap | `calm 4, sleepy 3, cooling 2, uplifting 2, soothing 2` |
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

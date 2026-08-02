/* ──────────────────────────────────────────────────────────────
   data/extractionProfiles.js — MOCK DATA for extraction profile
   exploration UI (temp/time sliders on ingredient pages).

   Hand-authored mock data for all 30 ingredients, created to make
   the temp/time slider UI populated consistently across the
   ingredient catalog during the exploration/demo phase.

   ⚠️ IMPORTANT: THIS IS NOT RESEARCH DATA.
   Values are plausible-feeling approximations based on general tea
   knowledge, authored to give the slider UI internally coherent
   behavior across all ingredients. Real values will replace these
   during the research phase — at which point some ingredients will
   gain 4-5 profile points, character descriptions will be revised,
   and effect magnitudes will reflect actual compound extraction
   curves rather than my best-guess scaling.

   The data has these properties by design:
   - "Gentle" profiles are consistently milder (fewer flavor notes,
     lower primary effect, no bitterness)
   - "Strong" profiles show typical over-extraction character
     (added tannic/earthy notes, slight bitterness)
   - Caffeine-bearing ingredients (true teas) reflect higher caffeine
     extraction at higher temps in the character descriptions
   - Character strings are one-line editorial notes — should feel
     evocative but not overblown

   Shape per profile:
     tempC        — canonical temp for this profile (°C)
     timeS        — canonical steep time for this profile (seconds)
     flavors      — which flavor notes are present at this extraction
     effects      — [effect, strength(0-5)] tuples
     character    — one-line editorial summary
   ────────────────────────────────────────────────────────────── */

export const EXTRACTION_PROFILES = {
  // ─── Flowers ──────────────────────────────────────────────────
  chamomile: [
    { tempC: 75,  timeS: 180, flavors: ["floral", "hay"],
      effects: [["calm", 2], ["sleepy", 1], ["soothing", 2], ["digestive", 1]],
      character: "A morning chamomile — delicate, barely sedative. Hay water with floral lift." },
    { tempC: 95,  timeS: 300, flavors: ["honey", "apple", "floral", "hay"],
      effects: [["calm", 4], ["sleepy", 3], ["soothing", 3], ["digestive", 3]],
      character: "The standard cup. Full honey-floral body, clear calming effect." },
    { tempC: 100, timeS: 420, flavors: ["honey", "apple", "floral", "hay", "earthy", "astringent"],
      effects: [["calm", 4], ["sleepy", 5], ["soothing", 3], ["digestive", 3], ["bitterness", 2]],
      character: "Past the sleepy-time mark. Apigenin maxes out but tannins follow — the cup turns astringent." },
  ],

  lavender: [
    { tempC: 85,  timeS: 120, flavors: ["floral"],
      effects: [["calm", 2], ["sleepy", 1], ["cooling", 2], ["comfort", 1]],
      character: "Light lavender — a soft perfume, nothing intense." },
    { tempC: 92,  timeS: 200, flavors: ["floral", "pine"],
      effects: [["calm", 4], ["sleepy", 2], ["comfort", 2]],
      character: "The culinary cup. Floral and balanced, solid calm." },
    { tempC: 95,  timeS: 240, flavors: ["floral", "pine", "camphor", "soapy"],
      effects: [["calm", 4], ["sleepy", 3], ["bitterness", 2], ["cooling", 3]],
      character: "Over-extracted — camphor and soap notes take the perfume's place. Pull back." },
  ],

  hibiscus: [
    { tempC: 90,  timeS: 240, flavors: ["tart", "fruity", "bright", "cranberry"],
      effects: [["cooling", 2], ["energy", 2], ["digestive", 2]],
      character: "Light hibiscus — a pink tang, gentle brightness." },
    { tempC: 98,  timeS: 360, flavors: ["tart", "fruity", "cranberry", "berry", "bright"],
      effects: [["cooling", 3], ["digestive", 2], ["energy", 2]],
      character: "The standard cup. Ruby color, tart and lively." },
    { tempC: 100, timeS: 420, flavors: ["tart", "fruity", "cranberry", "berry", "astringent", "bright", "mineral"],
      effects: [["cooling", 3], ["digestive", 3], ["bitterness", 2], ["energy", 2]],
      character: "Full extraction — tart pushes into sour, tannins evident." },
  ],

  // energy removed 2026-08-02 — the evidence is squarely the other
  // way. Damask rose's flavonoids bind GABA-A and central
  // benzodiazepine receptors; a meta-analysis of aromatherapy trials
  // reports anxiolytic and sleep-quality effects. calm and sleepy
  // already carry that. See docs/research/ingredients/rose.md.
  rose: [
    { tempC: 85,  timeS: 180, flavors: ["floral"],
      effects: [["calm", 2], ["comfort", 2]],
      character: "Light rose — delicate, powdery, barely there." },
    { tempC: 92,  timeS: 270, flavors: ["floral", "sweet", "fruity"],
      effects: [["calm", 3], ["sleepy", 2], ["comfort", 3]],
      character: "The standard cup. Full rose perfume with a honeyed lift." },
    { tempC: 95,  timeS: 300, flavors: ["floral", "sweet", "fruity", "earthy", "astringent"],
      effects: [["calm", 3], ["bitterness", 2], ["sleepy", 3], ["comfort", 3]],
      character: "Over-steeped — rose picks up muskiness and a tannic edge. Pull back." },
  ],

  jasmine: [
    { tempC: 75,  timeS: 120, flavors: ["floral", "sweet"],
      effects: [["calm", 2], ["uplifting", 1], ["comfort", 1]],
      character: "Light jasmine — heady perfume, soft and quick." },
    { tempC: 80,  timeS: 150, flavors: ["floral", "sweet", "honeyed", "heady"],
      effects: [["calm", 3], ["uplifting", 2], ["energy", 2], ["focus", 2]],
      character: "The standard cup. Full jasmine bloom, balanced lift." },
    { tempC: 85,  timeS: 180, flavors: ["floral", "sweet", "honeyed", "heady", "vegetal", "astringent"],
      effects: [["calm", 3], ["uplifting", 2], ["bitterness", 2], ["energy", 2], ["sleepy", 2]],
      character: "Pushed past the perfume's range — green-tea base pulls tannin, the heady note fades." },
    { tempC: 95,  timeS: 240,
      flavorStrengths: [
        ["astringent", 4.0], ["vegetal", 3.0], ["bitter", 2.5],
        ["grassy", 2.0], ["floral", 0.8],
      ],
      effects: [["energy", 3], ["focus", 2], ["bitterness", 3], ["calm", 3], ["sleepy", 2]],
      character: "Perfume boiled off; what's left is over-extracted green tea base — astringent and bitter, the jasmine signature gone." },
  ],

  // ─── Herbals ──────────────────────────────────────────────────
  // energy and focus removed 2026-08-02 after checking the literature:
  // Kennedy et al. found self-rated ALERTNESS significantly REDUCED at
  // the highest dose, and lemon balm is characterised as a mild
  // sedative rather than a stimulant. The app was claiming the
  // opposite of the evidence. See docs/research/ingredients/lemonbalm.md.
  lemonbalm: [
    { tempC: 85,  timeS: 180, flavors: ["citrus", "grassy", "bright"],
      effects: [["calm", 2], ["soothing", 1.5], ["uplifting", 2], ["cooling", 2]],
      character: "Gentle lemon balm — bright and soft, a light wash." },
    { tempC: 92,  timeS: 270, flavors: ["citrus", "mint", "grassy", "bright", "fresh"],
      effects: [["calm", 3], ["soothing", 2], ["sleepy", 3], ["cooling", 2], ["uplifting", 2]],
      character: "The standard cup. Lemon-mint with gentle lift and focus." },
    { tempC: 95,  timeS: 300, flavors: ["citrus", "mint", "grassy", "fresh", "astringent", "bright"],
      effects: [["calm", 3], ["soothing", 2], ["bitterness", 2], ["sleepy", 4]],
      character: "Pushed past the sweet spot — citrus dulls, grass turns hay-bitter." },
  ],

  peppermint: [
    { tempC: 90,  timeS: 240, flavors: ["minty", "cool"],
      effects: [["cooling", 3], ["focus", 2], ["digestive", 3]],
      character: "Gentle peppermint — cool and clean, less aggressive." },
    { tempC: 98,  timeS: 360, flavors: ["minty", "cool", "grassy"],
      effects: [["cooling", 4], ["focus", 3], ["digestive", 4], ["calm", 2]],
      character: "The standard cup. Full menthol, clears the head." },
    { tempC: 100, timeS: 420, flavors: ["minty", "cool", "grassy", "sharp", "harsh"],
      effects: [["cooling", 4], ["focus", 3], ["digestive", 4], ["bitterness", 2], ["calm", 2]],
      character: "Past the sweet spot. Menthol tips harsh, tannins follow." },
  ],

  rooibos: [
    { tempC: 95,  timeS: 240, flavors: ["honey", "woody", "warm"],
      effects: [["comfort", 3], ["soothing", 2], ["digestive", 2]],
      character: "Light rooibos — warm honeywater, no tannins to speak of." },
    { tempC: 98,  timeS: 360, flavors: ["honey", "woody", "vanilla", "warm"],
      effects: [["comfort", 4], ["soothing", 3], ["digestive", 3], ["grounding", 3], ["warming", 2]],
      character: "The standard cup. Round, sweet, forgiving — can't over-steep." },
    { tempC: 100, timeS: 420, flavors: ["honey", "woody", "vanilla", "earthy", "warm", "rich"],
      effects: [["comfort", 4], ["soothing", 3], ["digestive", 3], ["grounding", 2]],
      character: "Fuller body. Rooibos stays sweet even pushed — one of its charms." },
  ],

  // energy -> focus, 2026-08-02. The research supports a real
  // cognitive effect but explicitly a STIMULANT-FREE one: attention
  // and working memory, not a lift. Same values, correct register.
  // See docs/research/ingredients/spearmint.md.
  spearmint: [
    { tempC: 88,  timeS: 240, flavors: ["minty", "sweet"],
      effects: [["cooling", 2], ["digestive", 2], ["focus", 1], ["uplifting", 2], ["calm", 2]],
      character: "Gentle spearmint — rounder and sweeter than peppermint." },
    { tempC: 95,  timeS: 360, flavors: ["minty", "sweet", "grassy", "cool"],
      effects: [["cooling", 3], ["digestive", 3], ["focus", 2], ["calm", 2]],
      character: "The standard cup. Sweet mint, mellow cooling effect." },
    { tempC: 100, timeS: 420, flavors: ["minty", "sweet", "grassy", "cool", "herbal", "harsh"],
      effects: [["cooling", 3], ["digestive", 3], ["focus", 2], ["bitterness", 2], ["calm", 2]],
      character: "Pushed too far. Carvone goes lawn-clipping, herbal turns hay-bitter." },
  ],

  passionflower: [
    { tempC: 95,  timeS: 300, flavors: ["grassy"],
      effects: [["calm", 3], ["sleepy", 2], ["soothing", 2], ["digestive", 2]],
      character: "Light passionflower — grassy and quiet, subtle drowse." },
    { tempC: 98,  timeS: 480, flavors: ["grassy", "hay"],
      effects: [["calm", 4], ["sleepy", 4], ["soothing", 3], ["digestive", 3]],
      character: "The sleepy cup. Hay and soft sedation, the classic use." },
    { tempC: 100, timeS: 600, flavors: ["grassy", "hay", "earthy"],
      effects: [["calm", 4], ["sleepy", 5], ["soothing", 3], ["digestive", 3], ["bitterness", 1]],
      character: "Maximum extraction — deepest sedative pull, slight bitter edge." },
  ],

  // energy removed 2026-08-02 — no evidence found. The literature on
  // lemongrass is sedative/anxiolytic, and the one human trial found
  // no hypnotic effect either. Nothing supports a lift.
  // See docs/research/ingredients/lemongrass.md.
  lemongrass: [
    { tempC: 95,  timeS: 240, flavors: ["citrus", "bright"],
      effects: [["cooling", 2], ["digestive", 2], ["uplifting", 3], ["calm", 2]],
      character: "Light lemongrass — clean citrus wash, refreshing." },
    { tempC: 98,  timeS: 360, flavors: ["citrus", "grassy", "bright"],
      effects: [["cooling", 3], ["digestive", 2], ["uplifting", 3], ["calm", 2]],
      character: "The standard cup. Bright, herbal, uplifting." },
    { tempC: 100, timeS: 420, flavors: ["citrus", "grassy", "bright", "woody", "acrid"],
      effects: [["cooling", 3], ["digestive", 2], ["bitterness", 2], ["uplifting", 3]],
      character: "Past the bright window — citral pushes acrid; the lift dulls." },
  ],

  // ─── Spices ───────────────────────────────────────────────────
  ginger: [
    { tempC: 100, timeS: 300, flavors: ["spiced", "warm"],
      effects: [["warming", 4], ["comfort", 3], ["digestive", 3], ["energy", 1]],
      character: "Light ginger — warm, gentle bite. Good for a mild stomach." },
    { tempC: 100, timeS: 480, flavors: ["spiced", "warm", "citrus"],
      effects: [["warming", 5], ["comfort", 4], ["digestive", 4], ["energy", 2], ["soothing", 2]],
      character: "The standard cup. Full ginger heat, digestive and warming." },
    { tempC: 100, timeS: 600, flavors: ["spiced", "warm", "citrus", "sharp", "harsh"],
      effects: [["warming", 5], ["comfort", 5], ["digestive", 4], ["energy", 2], ["bitterness", 2], ["grounding", 2]],
      character: "Long simmer. Heat sharpens past pleasant — almost peppery-harsh." },
  ],

  cinnamon: [
    { tempC: 95,  timeS: 300, flavors: ["spiced", "sweet"],
      effects: [["warming", 3], ["comfort", 3], ["digestive", 2], ["uplifting", 2]],
      character: "Light cinnamon — sweet warmth, a gentle touch." },
    { tempC: 98,  timeS: 480, flavors: ["spiced", "sweet", "woody", "warm"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3], ["uplifting", 2], ["soothing", 2]],
      character: "The standard cup. Full cinnamon bark, round and warming." },
    { tempC: 100, timeS: 600, flavors: ["spiced", "sweet", "woody", "warm", "earthy", "astringent"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3], ["bitterness", 2], ["grounding", 2]],
      character: "Long pull. Coumarin pushes astringent — cassia gets harsh, Ceylon stays gentler." },
  ],

  cardamom: [
    // Cardamom's 1,8-cineole (eucalyptol) gives a surface-cooling
    // sensation while the spice register reads warming in the gut —
    // the paradox the engine's warming+cooling rule recognizes.
    // Both registers ride in the same cup; the perception is a real
    // 'cool surface, warm body' split. Eucalyptol is volatile, so
    // cooling fades at the pushed knot where the aromatics escape.
    { tempC: 95,  timeS: 240, flavors: ["spiced", "floral"],
      effects: [["warming", 2], ["cooling", 1.5], ["comfort", 3], ["digestive", 2], ["energy", 2], ["uplifting", 1], ["soothing", 2]],
      character: "Light cardamom — aromatic and floral, the upper register." },
    { tempC: 98,  timeS: 360, flavors: ["spiced", "floral", "citrus"],
      effects: [["warming", 3], ["cooling", 2], ["comfort", 4], ["digestive", 3], ["energy", 3], ["uplifting", 2], ["soothing", 2]],
      character: "The standard cup. Full cardamom character — complex, lifting." },
    { tempC: 100, timeS: 480, flavors: ["spiced", "floral", "citrus", "camphor"],
      effects: [["warming", 3], ["cooling", 1], ["comfort", 4], ["digestive", 3], ["energy", 3], ["uplifting", 2], ["bitterness", 2], ["grounding", 1]],
      character: "Pushed too far. Volatile aromatics escape; camphor takes their place." },
  ],

  cloves: [
    { tempC: 95,  timeS: 240, flavors: ["spiced", "warm"],
      effects: [["warming", 3], ["comfort", 3], ["digestive", 2], ["grounding", 2], ["soothing", 2]],
      character: "Light cloves — sweet spice, gentle. A pinch goes far." },
    { tempC: 98,  timeS: 360, flavors: ["spiced", "pungent", "warm", "numbing"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3], ["grounding", 2], ["soothing", 2]],
      character: "The standard cup. Full clove — warm, slightly numbing, medicinal." },
    { tempC: 100, timeS: 420, flavors: ["spiced", "pungent", "warm", "numbing", "medicinal"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3], ["bitterness", 3], ["grounding", 3], ["soothing", 2]],
      character: "Eugenol overdose. The cup goes medicinal-numbing." },
  ],

  // Vanilla's doc (sections 6a-6c) prescribes uplifting at 1 then 2,
  // and it was the one straggler the transcription tool couldn't pair:
  // the doc brews at 85-95C over 10-20 min while the shipped samples
  // run 95-100C over 4-7 min, which is outside the tool's matching
  // distance. Carried into the third sample too — extraction
  // accumulates, and the doc simply stops listing it rather than
  // claiming it disappears.
  //
  // That temperature/time divergence is itself worth a look: the
  // shipped curve is hotter and far shorter than the research. Left
  // alone here, since changing brew windows is a calibration decision.
  vanilla: [
    { tempC: 95,  timeS: 240, flavors: ["sweet", "creamy"],
      effects: [["comfort", 3], ["digestive", 2], ["soothing", 4], ["warming", 1], ["calm", 1], ["sleepy", 2], ["uplifting", 1]],
      character: "Light vanilla — soft sweetness, a gentle comfort." },
    { tempC: 98,  timeS: 360, flavors: ["sweet", "creamy", "floral", "warm"],
      effects: [["comfort", 4], ["digestive", 3], ["soothing", 3], ["calm", 3], ["sleepy", 2], ["warming", 1], ["uplifting", 2]],
      character: "The standard cup. Full vanilla bloom, warm and rounded." },
    { tempC: 100, timeS: 420, flavors: ["sweet", "creamy", "floral", "warm", "woody"],
      effects: [["comfort", 4], ["digestive", 3], ["soothing", 3], ["calm", 3], ["sleepy", 2], ["warming", 1], ["uplifting", 2]],
      character: "Fuller extraction. Vanilla's woodier side emerges, still sweet." },
  ],

  fennel: [
    { tempC: 95,  timeS: 240, flavors: ["licorice", "sweet"],
      effects: [["digestive", 3], ["calm", 1], ["warming", 1], ["cooling", 2], ["soothing", 2]],
      character: "Light fennel — sweet anise, clean and gentle." },
    { tempC: 98,  timeS: 360, flavors: ["licorice", "sweet", "aromatic"],
      effects: [["digestive", 4], ["calm", 2], ["warming", 2], ["cooling", 2], ["soothing", 2]],
      character: "The standard cup. Full fennel character — digestive and soothing." },
    { tempC: 100, timeS: 420, flavors: ["licorice", "sweet", "aromatic", "bitter"],
      effects: [["digestive", 4], ["calm", 2], ["warming", 2], ["bitterness", 2], ["cooling", 2], ["soothing", 2]],
      character: "Pushed hard — fennel turns bitter behind the sweetness." },
  ],

  // ─── Adaptogens ───────────────────────────────────────────────
  // Tulsi was the proof-of-concept for the multi-zone brewing
  // model and carries an unusually wide envelope (50-100°C). The
  // five points below cover the full span so the FlavorMap and
  // MoodMap show real gradients across the cool register, not
  // flat extrapolation off the hot end.
  // energy removed 2026-08-02 — unsourced. Tulsi's cognitive evidence
  // is about attention and working memory, not stimulation, and it is
  // caffeine-free; `focus` carries that claim and is now sourced. See
  // docs/research/ingredients/tulsi.md.
  tulsi: [
    { tempC: 60,  timeS: 240, flavors: ["aromatic", "fresh", "sweet"],
      effects: [["calm", 2], ["soothing", 2]],
      character: "Cool-brewed tulsi — green basil top, almost no spice." },
    { tempC: 78,  timeS: 300, flavors: ["aromatic", "spiced", "sweet", "fresh"],
      effects: [["calm", 3], ["focus", 2], ["soothing", 2]],
      character: "Warm steep — aromatic balance, the spice quietly arriving." },
    { tempC: 92,  timeS: 300, flavors: ["spiced", "sweet", "aromatic"],
      effects: [["focus", 2], ["calm", 2], ["digestive", 2], ["soothing", 3], ["grounding", 3], ["uplifting", 2], ["warming", 2]],
      character: "Light tulsi — gently aromatic, balanced lift." },
    { tempC: 98,  timeS: 360, flavors: ["spiced", "clove", "peppery", "sweet", "warm"],
      effects: [["focus", 3], ["calm", 3], ["digestive", 3], ["soothing", 3], ["grounding", 4], ["warming", 2]],
      character: "The standard cup. Full holy basil — the adaptogen balance." },
    { tempC: 100, timeS: 420, flavors: ["spiced", "clove", "peppery", "sweet", "earthy", "astringent"],
      effects: [["focus", 3], ["calm", 3], ["digestive", 3], ["bitterness", 2], ["soothing", 3], ["grounding", 4], ["warming", 2]],
      character: "Past the standard. Earthy depth surfaces; bitter follows." },
  ],

  // ─── True teas: Green ─────────────────────────────────────────
  sencha: [
    { tempC: 70,  timeS: 60,  flavors: ["grassy", "sweet", "fresh"],
      effects: [["focus", 2], ["calm", 2], ["energy", 2], ["cooling", 2]],
      character: "Gentle sencha — sweet grass, fresh top, low astringency, morning-soft." },
    { tempC: 78,  timeS: 90,  flavors: ["grassy", "umami", "marine", "vegetal", "sweet", "fresh"],
      effects: [["focus", 4], ["calm", 1], ["energy", 3]],
      character: "The canonical cup. Fresh-cut grass and marine umami, balanced and focused." },
    { tempC: 85,  timeS: 120, flavors: ["grassy", "umami", "marine", "vegetal", "astringent"],
      effects: [["focus", 4], ["energy", 4], ["bitterness", 2], ["calm", 2]],
      character: "Strong sencha — tannic edge, maximum caffeine pull." },
    { tempC: 95,  timeS: 150,
      flavorStrengths: [
        ["astringent", 4.0], ["vegetal", 3.5], ["bitter", 3.0],
        ["grassy", 2.5], ["marine", 1.5], ["umami", 1.0],
      ],
      effects: [["energy", 4], ["focus", 2], ["bitterness", 3.5], ["calm", 2]],
      character: "Past the leaf's tolerance — sencha's umami window collapsed, the cup reads spinach-bitter with caffeine grip." },
  ],

  gyokuro: [
    // Gyokuro is shade-grown for 3+ weeks before harvest so theanine
    // and chlorophyll outpace catechins — the sweet/umami signature
    // depends on extracting at near-coffee-creamer temperatures.
    // Above 65°C the catechin pool starts to outrun theanine; above
    // 80°C the cup falls apart into spinach-water territory. The
    // past-peak knots aren't a stylistic choice — they're what
    // actually happens to the leaf when brewed wrong.
    { tempC: 50,  timeS: 60,  flavors: ["umami", "sweet"],
      effects: [["focus", 3], ["calm", 3], ["energy", 2], ["uplifting", 2]],
      character: "Ultra-gentle gyokuro — pure sweet umami, a delicate brew." },
    { tempC: 55,  timeS: 100, flavors: ["umami", "marine", "sweet", "buttery"],
      effects: [["focus", 5], ["calm", 4], ["energy", 3], ["uplifting", 2]],
      character: "The classic cup. Dense umami, deep focus, meditative." },
    { tempC: 60,  timeS: 120, flavors: ["umami", "marine", "sweet", "buttery", "seaweed"],
      effects: [["focus", 5], ["calm", 3], ["energy", 3], ["bitterness", 1], ["cooling", 2]],
      character: "Fuller body. Seaweed notes deepen; slight brisk edge." },
    { tempC: 70,  timeS: 120,
      flavorStrengths: [
        ["umami", 3.0], ["marine", 3.0], ["vegetal", 2.0], ["seaweed", 2.0],
        ["sweet", 1.5], ["buttery", 1.0], ["brisk", 1.5],
      ],
      effects: [["focus", 4], ["calm", 1], ["energy", 3], ["bitterness", 1.5], ["cooling", 2]],
      character: "Past the shaded-leaf optimum — theanine sweetness fading, vegetal-marine climbing into the foreground." },
    { tempC: 80,  timeS: 120,
      flavorStrengths: [
        ["vegetal", 3.5], ["marine", 3.0], ["seaweed", 2.5], ["astringent", 2.2],
        ["umami", 2.0], ["brisk", 1.8], ["sweet", 0.6],
      ],
      effects: [["focus", 3], ["energy", 3.5], ["bitterness", 2.5], ["cooling", 2]],
      character: "The shaded leaf can't handle this heat — sweetness and umami collapse, vegetal-bitter takes the cup." },
    { tempC: 95,  timeS: 120,
      flavorStrengths: [
        ["vegetal", 4.0], ["astringent", 4.0], ["seaweed", 3.5], ["brisk", 2.5],
        ["marine", 2.0], ["bitter", 2.0],
      ],
      effects: [["focus", 1.5], ["energy", 4], ["bitterness", 3.5], ["cooling", 2]],
      character: "Gyokuro destroyed — the cup reads spinach water with caffeine, theanine and L-glutamate gone." },
  ],

  gunpowder: [
    // Tightly-rolled leaf — releases gradually. The cooler/shorter
    // anchor was previously the floor and read as "barely there"
    // because position-based strengths gave only toasted 4/vegetal 3.
    // Bumped to explicit strengths and added a 75°C anchor so even
    // Maghrebi-style cool first pours carry recognizable gunpowder
    // identity (toasted-mineral with brisk edge), not whisper-light
    // background. Real gunpowder does extract at 75-80°C — it just
    // needs the time to unfurl.
    { tempC: 75,  timeS: 90,
      flavorStrengths: [
        ["toasted", 2.0], ["vegetal", 1.4], ["brisk", 1.0],
        ["bold", 0.8], ["mineral", 0.6],
      ],
      effects: [["focus", 2], ["calm", 2], ["energy", 2], ["uplifting", 3], ["cooling", 2]],
      character: "Cool first pour — gunpowder unfurling, toasted-mineral lead with a quiet brisk edge." },
    { tempC: 80,  timeS: 120,
      flavorStrengths: [
        ["toasted", 2.6], ["bold", 2.0], ["vegetal", 1.8],
        ["mineral", 1.4], ["brisk", 1.2],
      ],
      effects: [["focus", 2.5], ["calm", 2], ["energy", 2.5], ["cooling", 2], ["uplifting", 2], ["digestive", 2]],
      character: "Light gunpowder — toasted and clean, approachable." },
    { tempC: 85,  timeS: 150,
      flavorStrengths: [
        ["toasted", 3.0], ["bold", 2.8], ["vegetal", 2.0],
        ["mineral", 1.8], ["brisk", 1.6],
      ],
      effects: [["focus", 3], ["calm", 1.5], ["energy", 3], ["comfort", 2], ["warming", 1], ["digestive", 2]],
      character: "The standard cup. Full toasted-mineral character, bold body, brisk finish." },
    { tempC: 90,  timeS: 180,
      flavorStrengths: [
        ["bold", 3.2], ["toasted", 3.0], ["astringent", 2.4],
        ["vegetal", 2.0], ["mineral", 1.8], ["brisk", 1.6],
      ],
      effects: [["focus", 3], ["energy", 4], ["comfort", 2], ["bitterness", 2], ["warming", 1], ["digestive", 2]],
      character: "Strong and tannic. Toast deepens; drinks more assertive." },
    { tempC: 95,  timeS: 240,
      flavorStrengths: [
        ["astringent", 3.4], ["bold", 3.4], ["toasted", 2.8],
        ["vegetal", 2.4], ["bitter", 2.0], ["mineral", 1.6],
      ],
      effects: [["focus", 2.5], ["energy", 4], ["bitterness", 3], ["warming", 1], ["digestive", 2]],
      character: "Past peak — astringency leads, vegetal-burnt edge, brisk freshness gone." },
  ],

  hojicha: [
    // Already-roasted leaf — character is largely baked-in, not
    // pulled by water. Hotter brewing barely intensifies (the
    // roast did the work in the kiln), so the profile pins
    // explicit strengths and PLATEAUS at the top end rather than
    // letting extrapolation amplify roast/caramel/nutty into
    // unrealistic 5.0/4.0/2.0 readings at 105°C+. The previous
    // profile used auto-position strengths and ran away because
    // there was nothing past 100°C × 60s holding the curve flat.
    { tempC: 90,  timeS: 30,
      flavorStrengths: [
        ["roasted", 2.6], ["warm", 1.6], ["woody", 0.8],
      ],
      effects: [["comfort", 2], ["calm", 2], ["digestive", 2], ["soothing", 4], ["warming", 3], ["grounding", 2]],
      character: "Quick hojicha — roasted warmth, minimal caffeine." },
    { tempC: 95,  timeS: 45,
      flavorStrengths: [
        ["roasted", 3.4], ["caramel", 2.2], ["warm", 1.8],
        ["nutty", 1.4], ["toasted", 1.2], ["sweet", 0.9],
        ["woody", 0.8],
      ],
      effects: [["comfort", 2.6], ["calm", 2.5], ["digestive", 2.6], ["soothing", 4], ["warming", 3], ["grounding", 2]],
      character: "Approaching the standard cup — caramel-toast leading, body filling in." },
    { tempC: 98,  timeS: 60,
      flavorStrengths: [
        ["roasted", 3.8], ["caramel", 2.6], ["warm", 2.0],
        ["nutty", 1.6], ["toasted", 1.4], ["sweet", 1.0],
        ["woody", 0.9],
      ],
      effects: [["comfort", 3], ["calm", 3], ["digestive", 3], ["soothing", 4], ["warming", 4], ["grounding", 3]],
      character: "The standard cup. Full hojicha — caramel-toasted, warm and sweet, the evening-safe green tea." },
    { tempC: 105, timeS: 120,
      flavorStrengths: [
        ["roasted", 4.0], ["caramel", 2.8], ["warm", 2.1],
        ["nutty", 1.7], ["toasted", 1.5], ["sweet", 1.0],
        ["woody", 1.0],
      ],
      effects: [["comfort", 3], ["calm", 3], ["digestive", 3], ["soothing", 4], ["warming", 4], ["grounding", 3]],
      character: "Pushed brew — character barely moves, the roast already did the work in the kiln." },
  ],

  // Dragonwell — non-monotonic Maillard peak. Pan-fired chestnut /
  // toasted-bean sweetness PEAKS at ~80°C (idx 1) and recedes by 85°C
  // as catechin grip climbs at the receptor level (not via volatile
  // loss; these are non-volatile Maillard polymers). Explicit
  // flavorStrengths on idx 1, 2, 3 let chestnut crest at 80–82°C
  // then fall back at 85°C — a peak-then-fade arc that linear
  // interpolation between three monotonically-rising points can't
  // express. Light (idx 0) keeps auto-annotation.
  dragonwell: [
    { tempC: 75,  timeS: 75,  flavors: ["nutty", "sweet", "fresh"],
      effects: [["focus", 3], ["calm", 2], ["energy", 2], ["uplifting", 2], ["cooling", 2]],
      character: "Light dragonwell — sweet chestnut, delicate sweetness, fresh top." },
    { tempC: 80,  timeS: 110,
      flavorStrengths: [
        ["chestnut", 4.2], ["nutty", 3.3], ["toasted", 2.5],
        ["sweet", 2.0], ["vegetal", 1.4], ["fresh", 1.2],
      ],
      effects: [["focus", 4], ["calm", 2], ["energy", 3], ["uplifting", 3], ["cooling", 2]],
      character: "The classic cup. Pan-fired chestnut and toasted-bean character, bright focus." },
    { tempC: 82,  timeS: 125,
      flavorStrengths: [
        ["chestnut", 4.5], ["nutty", 3.5], ["toasted", 2.8],
        ["sweet", 2.2], ["vegetal", 1.5], ["fresh", 1.0],
      ],
      effects: [["focus", 4], ["calm", 1.5], ["energy", 3], ["uplifting", 3], ["cooling", 2]],
      character: "The peak window — chestnut fullest, sweetness still leading, tannin not yet up." },
    { tempC: 85,  timeS: 150,
      flavorStrengths: [
        ["chestnut", 3.5], ["nutty", 2.8], ["toasted", 2.3],
        ["sweet", 1.0], ["vegetal", 1.4], ["bean", 1.5],
        ["astringent", 2.5],
      ],
      effects: [["focus", 4], ["energy", 3], ["bitterness", 2], ["uplifting", 3], ["cooling", 1]],
      character: "Hotter than the leaf wants. Chestnut sweetness fades; tannins climb." },
    { tempC: 95,  timeS: 180,
      flavorStrengths: [
        ["astringent", 4.0], ["vegetal", 3.0], ["bitter", 2.5],
        ["chestnut", 2.0], ["nutty", 1.5], ["bean", 1.5],
      ],
      effects: [["energy", 4], ["focus", 2], ["bitterness", 3], ["uplifting", 4], ["cooling", 1]],
      character: "Pan-fired sweetness gone — catechin grip dominates, the chestnut signature lost behind tannin." },
  ],

  // ─── True teas: White ─────────────────────────────────────────
  // Silver-needle white tea — honey/floral Maillard sweetness peaks
  // around 80°C and thins as catechins climb at 85°C. Note: apricot,
  // melon, floral, and delicate are already volatile-faded above
  // ~85°C via FLAVOR_VOLATILES; the 4-point shape captures the
  // separate non-volatile fade of HONEY (Maillard polymer suppressed
  // by tannin grip, not boil-off). Light (idx 0) keeps auto.
  white: [
    { tempC: 75,  timeS: 120, flavors: ["sweet", "delicate", "floral"],
      effects: [["calm", 2], ["energy", 2]],
      character: "Light white tea — ghost-sweet, barely extracted, floral whispers." },
    { tempC: 80,  timeS: 180,
      flavorStrengths: [
        ["honey", 4.2], ["hay", 3.3], ["sweet", 2.5],
        ["floral", 2.0], ["apricot", 1.6], ["melon", 1.3],
        ["delicate", 1.1],
      ],
      effects: [["calm", 3], ["energy", 3], ["focus", 3]],
      character: "The standard cup. Full silver-needle — honeyed top, hay body, soft stone-fruit and floral edges." },
    { tempC: 82,  timeS: 210,
      flavorStrengths: [
        ["honey", 4.5], ["hay", 3.4], ["sweet", 2.6],
        ["floral", 2.0], ["apricot", 1.6], ["melon", 1.3],
        ["delicate", 0.9],
      ],
      effects: [["calm", 3], ["energy", 3], ["focus", 3]],
      character: "The sweet peak. Full honeyed silver-needle — the leaf's gentlest window before tannins tighten." },
    { tempC: 85,  timeS: 240,
      flavorStrengths: [
        ["honey", 3.0], ["hay", 3.0], ["apricot", 1.4], ["melon", 1.2],
        ["woody", 1.5], ["delicate", 0.7], ["astringent", 2.5],
      ],
      effects: [["calm", 3], ["energy", 3], ["focus", 3], ["bitterness", 2]],
      character: "Past the leaf's tolerance. Honey thins; hay turns tannic." },
    { tempC: 95,  timeS: 270,
      flavorStrengths: [
        ["astringent", 4.0], ["hay", 2.5], ["bitter", 2.5],
        ["woody", 2.0], ["honey", 1.0],
      ],
      effects: [["energy", 3.5], ["focus", 2], ["bitterness", 3]],
      character: "Delicate leaf overrun — catechins outpace the Maillard sweetness, the cup turns tannic and hay-flat." },
  ],

  // ─── True teas: Oolong ────────────────────────────────────────
  oolong: [
    { tempC: 85,  timeS: 90,  flavors: ["floral", "fruit", "orchid", "sweet", "delicate"],
      effects: [["focus", 2], ["calm", 2], ["energy", 2], ["uplifting", 3]],
      character: "Light oolong — floral top with orchid edge, gentle lift, early extraction." },
    { tempC: 90,  timeS: 135, flavors: ["floral", "honey", "fruit", "orchid", "peach", "creamy", "toasted"],
      effects: [["focus", 3], ["calm", 2], ["energy", 3], ["comfort", 2], ["uplifting", 3], ["warming", 2]],
      character: "The standard cup. Full oolong spectrum — orchid, stone fruit, honey-creamy body, toasted edge." },
    { tempC: 95,  timeS: 180, flavors: ["floral", "honey", "fruit", "peach", "toasted", "mineral", "astringent"],
      effects: [["focus", 3], ["calm", 1], ["energy", 3], ["comfort", 3], ["bitterness", 2], ["warming", 4], ["grounding", 2]],
      character: "Long pull. Floral notes thin, mineral and tannin take the stage." },
  ],

  // ─── True teas: Black ─────────────────────────────────────────
  assam: [
    { tempC: 95,  timeS: 120, flavors: ["malty", "bold", "warm"],
      effects: [["energy", 3], ["focus", 2], ["comfort", 2], ["warming", 4]],
      character: "Light assam — malty warmth, gentle caffeine pull." },
    { tempC: 98,  timeS: 240, flavors: ["malty", "bold", "robust", "brisk", "cocoa", "woody"],
      effects: [["energy", 5], ["focus", 3], ["comfort", 4], ["warming", 4]],
      character: "The classic cup. Bold and robust — full malt, cocoa depth, brisk tannic body that takes milk." },
    { tempC: 100, timeS: 300, flavors: ["malty", "bold", "robust", "brisk", "cocoa", "woody", "astringent"],
      effects: [["energy", 5], ["focus", 3], ["comfort", 4], ["bitterness", 2], ["warming", 5]],
      character: "Strong assam — maximum caffeine, brisk tannic backbone." },
  ],

  darjeeling: [
    { tempC: 85,  timeS: 120, flavors: ["muscatel", "bright", "brisk"],
      effects: [["energy", 2], ["focus", 2], ["calm", 1], ["uplifting", 3]],
      character: "Light darjeeling — muscatel top, restrained and bright." },
    { tempC: 88,  timeS: 200, flavors: ["muscatel", "floral", "fruit", "bright", "earthy", "rich"],
      effects: [["energy", 4], ["focus", 3], ["uplifting", 4], ["warming", 3]],
      character: "The standard cup. Full 'champagne of teas' — floral, grape-like, with the granite-mineral body underneath." },
    { tempC: 90,  timeS: 240, flavors: ["muscatel", "floral", "fruit", "bright", "earthy", "rich", "astringent"],
      effects: [["energy", 4], ["focus", 3], ["bitterness", 2], ["uplifting", 4], ["warming", 3]],
      character: "Pushed — floral holds but tannins sharpen. Still distinctive." },
    { tempC: 95,  timeS: 300,
      flavorStrengths: [
        ["astringent", 4.0], ["earthy", 3.0], ["bitter", 2.5],
        ["rich", 2.0], ["bright", 1.5], ["muscatel", 1.0],
      ],
      effects: [["energy", 4], ["focus", 2], ["bitterness", 3], ["uplifting", 3], ["warming", 4]],
      character: "Muscatel volatile gone — what's left is a standard tannic black tea, the Darjeeling signature buried under catechin grip." },
  ],

  ceylon: [
    { tempC: 95,  timeS: 120, flavors: ["citrus", "bright", "honey"],
      effects: [["energy", 2], ["focus", 2], ["comfort", 2], ["uplifting", 3], ["warming", 3]],
      character: "Light ceylon — citrus-honey top, gentle lift, quick brew." },
    { tempC: 98,  timeS: 200, flavors: ["citrus", "bright", "brisk", "honey", "woody", "spiced"],
      effects: [["energy", 3], ["focus", 3], ["comfort", 3], ["uplifting", 3], ["warming", 3]],
      character: "The standard cup. Full ceylon — crisp citrus, honeyed body, faint cinnamon edge, takes milk well." },
    { tempC: 100, timeS: 240, flavors: ["citrus", "bright", "brisk", "honey", "woody", "spiced", "astringent"],
      effects: [["energy", 3], ["focus", 2], ["comfort", 3], ["bitterness", 2], ["uplifting", 3], ["warming", 4]],
      character: "Stronger pull. Tannins assert; classic English-breakfast strength." },
  ],

  lapsang: [
    // Pine-smoke phenolics (guaiacol, syringol, 4-methylguaiacol) sit
    // on the leaf surface from the pinewood drying step and need both
    // heat and time to migrate into the water. A cold pour barely
    // touches them; the canonical Lapsang cup wants real boil to pull
    // the full campfire character. Five knots so the slider produces
    // a real journey: barely-smoky cold pour, warming, canonical,
    // pushed-with-tannin, full over-pull.
    { tempC: 70,  timeS: 90,
      flavorStrengths: [
        ["smoked", 1.5], ["pine", 0.8], ["woody", 0.5],
      ],
      effects: [["warming", 1.5], ["comfort", 1.5]],
      character: "Barely lapsang — water carrying a smoke hint, the phenolics still locked to the leaf." },
    { tempC: 85,  timeS: 150,
      flavorStrengths: [
        ["smoked", 3.0], ["pine", 1.8], ["campfire", 1.2], ["woody", 1.0],
      ],
      effects: [["energy", 2], ["warming", 3], ["comfort", 2.5], ["digestive", 1], ["grounding", 2]],
      character: "Warming pour — smoke emerging cleanly, no tannin grip yet, the gentler register." },
    { tempC: 95,  timeS: 200,
      flavorStrengths: [
        ["smoked", 4.0], ["pine", 2.5], ["campfire", 2.0], ["leather", 1.2],
        ["tar", 0.8], ["woody", 0.6],
      ],
      effects: [["energy", 3], ["warming", 4], ["comfort", 4], ["digestive", 2], ["grounding", 3]],
      character: "The canonical cup. Full campfire — pine smoke, leather, soft tar — singular and warming." },
    { tempC: 100, timeS: 240,
      flavorStrengths: [
        ["smoked", 4.5], ["pine", 3.0], ["campfire", 2.5], ["leather", 2.0],
        ["tar", 1.8], ["astringent", 2.5], ["woody", 0.5],
      ],
      effects: [["energy", 3], ["warming", 4], ["comfort", 4], ["digestive", 2], ["bitterness", 2], ["grounding", 4]],
      character: "Pushed — smoke holds strong but black-tea catechins surface underneath, tannin grip emerging." },
    { tempC: 100, timeS: 360,
      flavorStrengths: [
        ["smoked", 4.5], ["astringent", 4.0], ["tar", 2.8], ["bitter", 2.5],
        ["pine", 2.5], ["leather", 2.0],
      ],
      effects: [["energy", 3], ["warming", 4], ["bitterness", 3.5], ["grounding", 4], ["digestive", 2]],
      character: "Over-pulled — smoke saturated, tannin and tar dominate the back palate, comfort recedes behind the grip." },
  ],

  // ─── True teas: Pu-erh ────────────────────────────────────────
  puerh: [
    { tempC: 95,  timeS: 30,  flavors: ["earthy", "woody", "mushroom"],
      effects: [["comfort", 3], ["digestive", 2], ["grounding", 2], ["warming", 1.5], ["soothing", 2]],
      character: "Light puerh — earthy wash, mushroom-damp, quick and mild. Traditional first-pour." },
    { tempC: 98,  timeS: 90,  flavors: ["earthy", "woody", "mushroom", "dark", "leather"],
      effects: [["comfort", 4], ["digestive", 3], ["grounding", 3], ["warming", 2], ["soothing", 2]],
      character: "The standard cup. Full puerh — earth, damp wood, mushroom depth, leather warmth." },
    { tempC: 100, timeS: 180, flavors: ["earthy", "woody", "mushroom", "dark", "leather", "mineral", "astringent"],
      effects: [["comfort", 4], ["digestive", 3], ["grounding", 3], ["warming", 2], ["bitterness", 2], ["energy", 2]],
      character: "Deep extraction. Mineral depth at maximum; tannins climb behind it." },
  ],

  // ─── Adaptogens & roots ─────────────────────────────────────
  ashwagandha: [
    { tempC: 60,  timeS: 120,
      flavorStrengths: [["earthy", 0.6], ["musty", 0.4]],
      effects: [["grounding", 0.5]],
      character: "Cold-pour ashwagandha — barely tinted water, the withanolides locked in the root." },
    // Transcribed from docs/research/ingredients/ashwagandha.md 6a-6c.
    // The shipped values had drifted from the researched ones: soothing
    // was absent from all three points and warming from the standard
    // cup, so the ingredient page promised a stress-buffering, warming
    // root and the brew view showed neither. Grounding at the gentle
    // point and the standard cup's temperature were also off.
    { tempC: 95,  timeS: 600,  flavors: ["earthy", "musty"],
      effects: [["grounding", 3], ["calm", 2], ["soothing", 2]],
      character: "Light ashwagandha — gentle root warmth, faint musk." },
    { tempC: 100, timeS: 900,  flavors: ["earthy", "musty", "bitter", "woody"],
      effects: [["grounding", 4], ["calm", 3], ["sleepy", 3], ["soothing", 3], ["warming", 2]],
      character: "The standard kshir-style cup. Full root depth, the classic adaptogenic digestive." },
    { tempC: 100, timeS: 1200, flavors: ["earthy", "musty", "bitter", "woody"],
      effects: [["grounding", 4], ["calm", 3], ["sleepy", 4], ["soothing", 3], ["bitterness", 2]],
      character: "Long decoction. Maximum withanolide pull — deep grounding, distinctly bitter." },
  ],

  turmeric: [
    { tempC: 60,  timeS: 120,
      flavorStrengths: [["earthy", 0.5], ["musky", 0.3]],
      effects: [["warming", 0.4]],
      character: "Cold-pour turmeric — pale yellow water, curcumin still locked in the rhizome's fat-soluble fraction." },
    { tempC: 95,  timeS: 600, flavors: ["earthy", "musky"],
      effects: [["warming", 2], ["comfort", 1], ["grounding", 1]],
      character: "Light turmeric — golden color, gentle warmth, mild musk." },
    { tempC: 98,  timeS: 750, flavors: ["earthy", "bitter", "musky", "woody"],
      effects: [["warming", 3], ["comfort", 2], ["digestive", 2], ["soothing", 2], ["grounding", 3]],
      character: "The standard cup. Full curcumin extraction — pair with fat and pepper for absorption." },
    { tempC: 100, timeS: 900, flavors: ["earthy", "bitter", "musky", "woody"],
      effects: [["warming", 3], ["comfort", 2], ["digestive", 2], ["bitterness", 2], ["soothing", 2], ["grounding", 2]],
      character: "Long simmer. Color deepens; the bitter side surfaces." },
  ],

  "black-pepper": [
    { tempC: 95,  timeS: 300, flavors: ["pungent", "warm"],
      effects: [["warming", 2], ["digestive", 2]],
      character: "Quick pepper — sharp aromatic, faint heat." },
    { tempC: 98,  timeS: 600, flavors: ["pungent", "warm", "earthy", "woody"],
      effects: [["warming", 3], ["digestive", 3], ["focus", 1], ["energy", 1], ["uplifting", 1]],
      character: "The chai cup. Full piperine — bright pungent edge, the absorption-multiplier role." },
    { tempC: 100, timeS: 900, flavors: ["pungent", "warm", "earthy", "woody", "harsh"],
      effects: [["warming", 3], ["digestive", 3], ["bitterness", 2], ["focus", 1]],
      character: "Long extraction. Heat lingers; piperine pushes into raw bite." },
  ],

  "licorice-root": [
    { tempC: 95,  timeS: 300, flavors: ["sweet", "anise"],
      effects: [["comfort", 2], ["soothing", 3], ["digestive", 1]],
      character: "Light licorice — sweet root water, anise on the lift." },
    { tempC: 98,  timeS: 600, flavors: ["sweet", "anise", "woody", "earthy"],
      effects: [["comfort", 3], ["digestive", 2], ["soothing", 3], ["uplifting", 1], ["calm", 1], ["warming", 1]],
      character: "The standard cup. Full glycyrrhizin sweetness — the harmonizer's work." },
    { tempC: 100, timeS: 900, flavors: ["sweet", "anise", "woody", "earthy", "bitter"],
      effects: [["warming", 3], ["comfort", 4], ["digestive", 2], ["bitterness", 1], ["soothing", 4]],
      character: "Long extraction. Sweetness deepens — respect the dose ceiling." },
  ],

  // ─── True teas (new) ────────────────────────────────────────
  matcha: [
    // Matcha is whisked, not steeped — the powder goes into
    // suspension, so 'time' on the slider means 'whisk-to-sip
    // window,' not 'water-on-leaf duration.' All knots stay
    // within matcha's natural 15-30s range; the engine never
    // sees a longer time because matcha.timeS clamps the slider
    // to that window. High-temp 90/95°C knots model real over-
    // extraction (scorched / destroyed when the water is too hot
    // for the chlorophyll-rich shaded leaf).
    { tempC: 70, timeS: 15, flavors: ["umami", "sweet", "creamy"],
      effects: [["focus", 3], ["calm", 2], ["uplifting", 2]],
      character: "Light usucha — frothy and gentle, the morning bowl." },
    { tempC: 75, timeS: 20, flavors: ["umami", "vegetal", "grassy", "creamy", "sweet"],
      effects: [["focus", 4], ["energy", 3], ["calm", 3], ["uplifting", 2]],
      character: "The standard whisk. Full umami body, creamy and grass-sweet, balanced focus." },
    { tempC: 80, timeS: 30, flavors: ["umami", "vegetal", "creamy", "grassy", "marine", "oceanic", "astringent", "sweet"],
      effects: [["focus", 5], ["energy", 4], ["calm", 3], ["bitterness", 2], ["uplifting", 2]],
      character: "Pushed thick — koicha territory. Dense umami and marine depth; catechins climb behind it." },
    { tempC: 90, timeS: 30,
      flavorStrengths: [
        ["astringent", 3.5], ["vegetal", 3.0], ["bitter", 2.5],
        ["grassy", 2.0], ["marine", 1.5], ["umami", 1.5], ["sweet", 0.5],
      ],
      effects: [["energy", 4], ["focus", 2.5], ["bitterness", 3]],
      character: "Scorched — water too hot for the powder. Catechins surge ahead of theanine; the cup goes harsh-grassy." },
    { tempC: 95, timeS: 30,
      flavorStrengths: [
        ["astringent", 4.5], ["bitter", 3.5], ["vegetal", 3.0],
        ["grassy", 2.0], ["marine", 1.0],
      ],
      effects: [["energy", 4], ["bitterness", 4]],
      character: "Matcha destroyed. The chlorophyll burns into harsh-bitter; theanine modulation gone." },
  ],

  genmaicha: [
    { tempC: 70, timeS: 60,  flavors: ["toasted", "nutty", "rice"],
      effects: [["comfort", 2], ["calm", 2], ["focus", 2]],
      character: "Tea-forward genmaicha — sencha leads, the toasted rice whispers." },
    { tempC: 78, timeS: 105, flavors: ["toasted", "rice", "nutty", "warm", "grassy", "sweet"],
      effects: [["comfort", 3], ["calm", 3], ["focus", 3], ["digestive", 2], ["energy", 2]],
      character: "The standard cup. Toasted rice forward, sencha grass underneath, warm and comforting." },
    { tempC: 85, timeS: 150, flavors: ["toasted", "rice", "nutty", "warm", "grassy", "astringent", "sweet"],
      effects: [["comfort", 3], ["calm", 3], ["focus", 2], ["digestive", 2], ["bitterness", 2], ["energy", 3]],
      character: "Past the rice's range. Tea base pulls tannin; the toast dulls." },
    { tempC: 95, timeS: 180,
      flavorStrengths: [
        ["astringent", 3.5], ["vegetal", 2.5], ["bitter", 2.0],
        ["toasted", 2.0], ["rice", 1.5], ["grassy", 2.0],
      ],
      effects: [["comfort", 2], ["energy", 3], ["bitterness", 2.5], ["focus", 3], ["calm", 2]],
      character: "Even the rice can't soften it now — sencha base over-extracted, toast pushed past its register into harsh-bitter." },
  ],

  // ─── Caffeinated herbal ─────────────────────────────────────
  "yerba-mate": [
    { tempC: 70, timeS: 60,  flavors: ["earthy", "grassy"],
      effects: [["energy", 3], ["focus", 2], ["uplifting", 1]],
      character: "First fill — bright and herbal, the gentle wake." },
    { tempC: 78, timeS: 180, flavors: ["earthy", "grassy", "herbaceous", "bitter"],
      effects: [["energy", 4], ["focus", 3], ["digestive", 2], ["uplifting", 2]],
      character: "The classic gourd cup. Full mate — the durative caffeine pull." },
    { tempC: 85, timeS: 300, flavors: ["earthy", "grassy", "herbaceous", "bitter", "smoky"],
      effects: [["energy", 4], ["focus", 3], ["bitterness", 2], ["uplifting", 2]],
      character: "Pushed long. Saponins surface — tongue-coating bitter." },
    { tempC: 95, timeS: 360,
      flavorStrengths: [
        ["bitter", 4.0], ["astringent", 3.5], ["harsh", 3.0],
        ["earthy", 2.5], ["herbaceous", 2.0], ["smoky", 1.8],
      ],
      effects: [["energy", 4], ["focus", 2], ["bitterness", 3.5], ["uplifting", 2]],
      character: "The 'quemado' cup — water too hot for the gourd. Saponins and chlorogenic acids strip the herb of its bright top, leaving harsh-bitter under-tongue." },
  ],

  // ─── Sleep & calming herbs (new) ────────────────────────────
  valerian: [
    { tempC: 60, timeS: 120,
      flavorStrengths: [["earthy", 0.5], ["musky", 0.4]],
      effects: [["calm", 0.6]],
      character: "Cold-pour valerian — barely any funk, the valerenic acid waiting for heat." },
    { tempC: 85, timeS: 600, flavors: ["earthy", "musky"],
      effects: [["calm", 3], ["sleepy", 2], ["soothing", 2]],
      character: "Light valerian — the funk shows but stays gentle." },
    { tempC: 90, timeS: 750, flavors: ["earthy", "musky", "pungent", "bitter"],
      effects: [["calm", 4], ["sleepy", 4], ["soothing", 3], ["grounding", 2]],
      character: "The standard cup. Full valerenic acid — the deep sedation register." },
    { tempC: 95, timeS: 900, flavors: ["earthy", "musky", "pungent", "bitter", "woody"],
      effects: [["calm", 4], ["sleepy", 5], ["bitterness", 2], ["soothing", 3]],
      character: "Maximum extraction. The cheese-funk register — do not drive." },
  ],

  linden: [
    { tempC: 85, timeS: 300, flavors: ["honey", "floral"],
      effects: [["calm", 2], ["sleepy", 1], ["soothing", 2], ["uplifting", 2]],
      character: "Light linden — soft honey-floral, just the perfume." },
    { tempC: 90, timeS: 450, flavors: ["honey", "citrus", "floral", "sweet"],
      effects: [["calm", 3], ["sleepy", 2], ["comfort", 2], ["soothing", 3], ["uplifting", 2], ["warming", 1], ["cooling", 1], ["digestive", 1]],
      character: "The standard tisane. Full honey-citrus body, the European pediatric cup." },
    { tempC: 95, timeS: 600, flavors: ["honey", "citrus", "floral", "sweet", "astringent"],
      effects: [["calm", 4], ["sleepy", 3], ["comfort", 3], ["bitterness", 2], ["soothing", 3], ["warming", 1]],
      character: "Pushed too long. Honey-floral fades; the green-leaf side turns tannic." },
  ],

  // ─── Immune-support florals ─────────────────────────────────
  echinacea: [
    { tempC: 90,  timeS: 300, flavors: ["earthy", "grassy", "herbal"],
      effects: [["comfort", 1], ["soothing", 1], ["uplifting", 1]],
      character: "Light echinacea — a gentle herbal wash." },
    { tempC: 95,  timeS: 600, flavors: ["earthy", "grassy", "herbal", "tingling", "musky"],
      effects: [["comfort", 2], ["digestive", 1], ["soothing", 2], ["warming", 1], ["uplifting", 1]],
      character: "The standard cup. Alkamides surface — that distinctive tongue tingle." },
    { tempC: 100, timeS: 900, flavors: ["earthy", "grassy", "herbal", "tingling", "musky", "bitter"],
      effects: [["comfort", 2], ["bitterness", 1], ["soothing", 2], ["warming", 1], ["digestive", 1]],
      character: "Pushed. Tingling intensifies; faint bitter edge." },
  ],

  elderflower: [
    { tempC: 85, timeS: 300, flavors: ["floral", "fruity"],
      effects: [["comfort", 2], ["calm", 2], ["soothing", 2], ["uplifting", 2], ["warming", 1]],
      character: "Light elderflower — delicate muscat aromatics." },
    { tempC: 90, timeS: 450, flavors: ["floral", "muscatel", "fruity", "sweet"],
      effects: [["comfort", 3], ["calm", 3], ["uplifting", 2], ["soothing", 3], ["warming", 1], ["cooling", 1], ["digestive", 1]],
      character: "The standard cup. Full lychee-muscat lift — the European cold-care." },
    { tempC: 95, timeS: 600, flavors: ["floral", "muscatel", "fruity", "sweet", "astringent"],
      effects: [["comfort", 3], ["calm", 2], ["uplifting", 2], ["bitterness", 2], ["soothing", 3], ["warming", 2], ["cooling", 1], ["digestive", 1]],
      character: "Pushed past the muscat. Aromatic thins; bitter follows." },
  ],

  // ─── Mineral-rich Western herbals ───────────────────────────
  nettle: [
    { tempC: 95,  timeS: 300, flavors: ["earthy", "grassy"],
      effects: [["comfort", 2], ["soothing", 2], ["grounding", 1], ["digestive", 1]],
      character: "Light nettle — green and mineral, a quiet spring tonic." },
    { tempC: 98,  timeS: 600, flavors: ["earthy", "grassy", "mineral", "vegetal", "spinach-like"],
      effects: [["comfort", 3], ["digestive", 2], ["soothing", 3], ["calm", 3], ["warming", 1], ["grounding", 2], ["uplifting", 1]],
      character: "The standard cup. Full mineral pull, the daily green." },
    { tempC: 100, timeS: 900, flavors: ["earthy", "grassy", "mineral", "vegetal", "sweet", "astringent"],
      effects: [["comfort", 3], ["digestive", 2], ["bitterness", 2], ["soothing", 3], ["grounding", 2], ["uplifting", 1], ["calm", 1], ["warming", 1]],
      character: "Long-infused. Mineral depth maxes out; the cup tightens with tannin." },
  ],

  "dandelion-root": [
    { tempC: 60,  timeS: 120,
      flavorStrengths: [["caramel", 0.5], ["nutty", 0.3]],
      effects: [["digestive", 0.5]],
      character: "Cold-pour dandelion root — barely tinted water, the roasted compounds need real heat to release." },
    { tempC: 95,  timeS: 600,  flavors: ["caramel", "nutty"],
      effects: [["digestive", 2], ["comfort", 1], ["warming", 1], ["grounding", 1]],
      character: "Light dandelion — toasted root warmth, gentle bittersweet." },
    { tempC: 98,  timeS: 1200, flavors: ["caramel", "nutty", "bittersweet", "earthy"],
      effects: [["digestive", 3], ["comfort", 2], ["warming", 2], ["grounding", 2], ["soothing", 1], ["energy", 1], ["focus", 1]],
      character: "The standard cup. The caffeine-free coffee — full roasted depth." },
    { tempC: 100, timeS: 1800, flavors: ["caramel", "nutty", "bittersweet", "earthy", "astringent"],
      effects: [["digestive", 3], ["comfort", 2], ["bitterness", 2], ["warming", 2], ["grounding", 2]],
      character: "Long decoction. Coffee territory; bitter and tannic together." },
  ],

  "dandelion-leaf": [
    { tempC: 90,  timeS: 300, flavors: ["grassy", "fresh"],
      effects: [["digestive", 2], ["cooling", 1], ["soothing", 1]],
      character: "Light dandelion leaf — bright green, mild bitter." },
    { tempC: 95,  timeS: 600, flavors: ["grassy", "fresh", "mineral", "vegetal"],
      effects: [["digestive", 3], ["cooling", 2], ["soothing", 2], ["grounding", 1], ["uplifting", 1]],
      character: "The standard cup. Full bitter-green tonic, the catalog's potassium-sparing diuretic." },
    { tempC: 100, timeS: 900, flavors: ["bitter", "grassy", "mineral", "vegetal"],
      effects: [["digestive", 3], ["cooling", 2], ["bitterness", 2], ["soothing", 2], ["grounding", 1], ["uplifting", 1]],
      character: "Pushed long. Bitter dominates; the spring greens turn medicinal." },
  ],

  // ─── Mushrooms ──────────────────────────────────────────────
  reishi: [
    { tempC: 60,  timeS: 600,
      flavorStrengths: [["woody", 0.4], ["earthy", 0.3]],
      effects: [["calm", 0.4]],
      character: "Cold-pour reishi — water with a wisp of wood; triterpenes need a real decoction to surrender." },
    { tempC: 95,  timeS: 1800, flavors: ["earthy", "woody"],
      effects: [["calm", 2], ["sleepy", 1], ["grounding", 2], ["soothing", 2]],
      character: "Short reishi — woody-earthy infusion, the bitter held back." },
    { tempC: 98,  timeS: 3600, flavors: ["earthy", "woody", "bitter", "mushroomy"],
      effects: [["calm", 3], ["sleepy", 3], ["comfort", 2], ["grounding", 4], ["soothing", 3]],
      character: "The standard decoction. Full Lingzhi — the An Shen tradition." },
    { tempC: 100, timeS: 7200, flavors: ["earthy", "woody", "bitter", "mushroomy"],
      effects: [["calm", 4], ["sleepy", 4], ["comfort", 3], ["bitterness", 3], ["grounding", 4], ["soothing", 4]],
      character: "Two-hour decoction. Maximum triterpene pull — deeply bitter and grounding." },
  ],

  "lions-mane": [
    { tempC: 60,  timeS: 120,
      flavorStrengths: [["sweet", 0.4], ["umami", 0.3]],
      effects: [["focus", 0.4]],
      character: "Cold-pour lion's mane — pale broth-water, hericenones still locked in the fruiting body." },
    { tempC: 90,  timeS: 600,  flavors: ["sweet", "umami"],
      effects: [["focus", 2]],
      character: "Light lion's mane — gentle, almost broth-like." },
    { tempC: 95,  timeS: 1200, flavors: ["sweet", "umami", "earthy", "nutty"],
      effects: [["focus", 3], ["calm", 1], ["grounding", 1]],
      character: "The standard cup. The most palatable mushroom — umami and quietly nourishing." },
    { tempC: 100, timeS: 1800, flavors: ["sweet", "umami", "earthy", "nutty", "muddy"],
      effects: [["focus", 3], ["bitterness", 2], ["grounding", 3], ["calm", 2], ["soothing", 2]],
      character: "Long-extracted. Earthy depth surfaces; the cup tips muddy." },
  ],

  // ─── Herbs (added for TrackMap gradient coverage) ─────────────
  sage: [
    { tempC: 92,  timeS: 240, flavors: ["herbaceous", "sage", "savory"],
      effects: [["digestive", 2], ["soothing", 2], ["focus", 1]],
      character: "Light sage — savory herb top, gentle aromatic lift." },
    { tempC: 96,  timeS: 360, flavors: ["herbaceous", "sage", "savory", "camphor", "woody"],
      effects: [["digestive", 3], ["soothing", 3], ["focus", 2], ["cooling", 2]],
      character: "The standard cup. Full sage character — eucalyptus edge, clearing." },
    { tempC: 100, timeS: 480, flavors: ["herbaceous", "sage", "camphor", "woody", "medicinal", "bitter"],
      effects: [["digestive", 3], ["soothing", 3], ["focus", 2], ["bitterness", 2], ["cooling", 2]],
      character: "Pushed long. The medicinal note climbs, edge into bitter." },
  ],

  // ─── Citrus peels ─────────────────────────────────────────────
  bergamot: [
    { tempC: 88,  timeS: 180, flavors: ["citrus", "bergamot", "floral"],
      effects: [["uplifting", 2], ["calm", 1], ["cooling", 1]],
      character: "Light bergamot — perfumed citrus top, only just lifting." },
    { tempC: 95,  timeS: 300, flavors: ["citrus", "bergamot", "floral", "bright", "aromatic"],
      effects: [["uplifting", 3], ["calm", 2], ["cooling", 1]],
      character: "The Earl Grey signature — fragrant citrus and floral oil." },
    { tempC: 100, timeS: 420, flavors: ["citrus", "bergamot", "bright", "aromatic", "pith", "bitter"],
      effects: [["uplifting", 3], ["bitterness", 2], ["calm", 2], ["cooling", 1]],
      character: "Past optimal — the perfume thins, pith bitterness surfaces." },
  ],
  "orange-peel": [
    { tempC: 92,  timeS: 240, flavors: ["citrus", "orange", "sweet"],
      effects: [["uplifting", 2], ["warming", 2], ["digestive", 1]],
      character: "Light orange peel — bright citrus top, faint sweetness." },
    { tempC: 96,  timeS: 360, flavors: ["citrus", "orange", "sweet", "aromatic", "warm"],
      effects: [["uplifting", 3], ["warming", 3], ["digestive", 2], ["comfort", 1]],
      character: "The standard cup. Full orange character — sun-warm and rounded." },
    { tempC: 100, timeS: 480, flavors: ["citrus", "orange", "aromatic", "warm", "pith", "bitter"],
      effects: [["uplifting", 3], ["warming", 3], ["bitterness", 2], ["digestive", 2], ["comfort", 1]],
      character: "Long extraction — the sweet edge thins, pith carries bitter." },
  ],
  "lemon-peel": [
    { tempC: 88,  timeS: 180, flavors: ["citrus", "lemon", "bright"],
      effects: [["uplifting", 2], ["cooling", 2], ["digestive", 1]],
      character: "Light lemon peel — sharp clean top, only the brightness." },
    { tempC: 95,  timeS: 300, flavors: ["citrus", "lemon", "bright", "fresh", "aromatic"],
      effects: [["uplifting", 3], ["cooling", 3], ["digestive", 2]],
      character: "The standard cup. Full lemon — citrus oil, clean and lively." },
    { tempC: 100, timeS: 420, flavors: ["citrus", "lemon", "bright", "aromatic", "pith", "bitter"],
      effects: [["uplifting", 3], ["cooling", 3], ["bitterness", 2], ["digestive", 2]],
      character: "Past optimal — the lemon edge sharpens, pith goes bitter." },
  ],

  // ─── Dried fruit ──────────────────────────────────────────────
  "dried-apple": [
    { tempC: 92,  timeS: 360, flavors: ["sweet", "fruity", "apple"],
      effects: [["comfort", 2], ["soothing", 1]],
      character: "Light apple — soft sweetness, faint orchard fruit." },
    { tempC: 96,  timeS: 480, flavors: ["sweet", "fruity", "apple", "honeyed", "hay"],
      effects: [["comfort", 3], ["calm", 2], ["soothing", 1]],
      character: "The standard cup. Full dried-apple — honey-sweet, compote depth." },
    { tempC: 100, timeS: 600, flavors: ["sweet", "fruity", "apple", "honeyed", "hay", "tart"],
      effects: [["comfort", 3], ["calm", 2], ["soothing", 1]],
      character: "Long-steeped. Fruit deepens, a faint tart edge surfaces." },
  ],
  cranberry: [
    { tempC: 92,  timeS: 240, flavors: ["tart", "fruity", "berry"],
      effects: [["uplifting", 2], ["cooling", 2]],
      character: "Light cranberry — bright tart top, gentle berry." },
    { tempC: 96,  timeS: 360, flavors: ["tart", "fruity", "berry", "bright", "cranberry"],
      effects: [["uplifting", 3], ["cooling", 3]],
      character: "The standard cup. Full cranberry — ruby color, tart-sweet bite." },
    { tempC: 100, timeS: 480, flavors: ["tart", "fruity", "berry", "cranberry", "astringent"],
      effects: [["uplifting", 3], ["cooling", 3], ["bitterness", 2]],
      character: "Pushed long — tart pushes into sour, astringency climbs." },
  ],
};

/* ──────────────────────────────────────────────────────────────
   Interpolation helpers

   Given a target (tempC, timeS) and a list of profiles, find the
   two profiles to interpolate between (or exact match) and blend
   their flavor/effect data.

   Strategy for v1 (simple):
   - Profiles are sorted by tempC. Find the bracketing pair.
   - Interpolate effects linearly.
   - Flavors: union of both bracketing profiles' flavor lists.
   - Character: pick the nearer profile's character line.
   ────────────────────────────────────────────────────────────── */

function bracket(profiles, target, axis) {
  const sorted = [...profiles].sort((a, b) => a[axis] - b[axis]);
  if (target <= sorted[0][axis]) return [sorted[0], sorted[0], 0];
  if (target >= sorted[sorted.length - 1][axis]) {
    return [sorted[sorted.length - 1], sorted[sorted.length - 1], 0];
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i][axis] && target <= sorted[i + 1][axis]) {
      const span = sorted[i + 1][axis] - sorted[i][axis];
      const t = span === 0 ? 0 : (target - sorted[i][axis]) / span;
      return [sorted[i], sorted[i + 1], t];
    }
  }
  return [sorted[0], sorted[0], 0];
}

function blendEffects(lower, upper, t) {
  const tags = new Set([
    ...lower.effects.map(([tag]) => tag),
    ...upper.effects.map(([tag]) => tag),
  ]);
  const out = [];
  for (const tag of tags) {
    const lo = lower.effects.find(([tg]) => tg === tag)?.[1] ?? 0;
    const hi = upper.effects.find(([tg]) => tg === tag)?.[1] ?? 0;
    const value = lo * (1 - t) + hi * t;
    out.push([tag, Math.round(value * 10) / 10]);
  }
  return out.sort((a, b) => {
    if (a[0] === "bitterness") return 1;
    if (b[0] === "bitterness") return -1;
    return b[1] - a[1];
  });
}

// Annotate a string-array of flavors with strengths in [1, 5].
//   - profileIndex 0 (light)    caps at 3
//   - profileIndex 1 (standard) caps at 4
//   - profileIndex 2 (strong)   caps at 5
// The 1-5 range is now used in full: a strong-profile leading flavor
// fills all five segments on the EffectBar, matching the assumption
// the perception-layer thresholds were calibrated against.
//
// bitter / bitterness / astringent are diagnostic — strength rises
// with profile index regardless of array position.
// other flavors descend from the cap by array position (top note
// leads, accents follow).
// Pure function so the result is stable per (flavors, profileIndex).
const DIAGNOSTIC_FLAVORS = new Set([
  "bitter", "bitterness", "astringent",
  "harsh", "sharp", "acrid", "burnt", "tannic",
  "soapy", "camphor", "muddy", "medicinal",
]);

function annotateFlavorStrengths(flavors, profileIndex) {
  const peakStrength = profileIndex === 0 ? 3 : profileIndex === 1 ? 4 : 5;
  return flavors.map((f, i) => {
    if (DIAGNOSTIC_FLAVORS.has(f)) {
      return [f, Math.min(3, profileIndex + 1)];
    }
    return [f, Math.max(1, peakStrength - i)];
  });
}

// Augment EXTRACTION_PROFILES with flavorStrengths once at module load.
// Each point gains a `flavorStrengths: [[name, strength], ...]` field.
// Points can pre-declare flavorStrengths to opt out of the standard
// "leading flavor at peakStrength, descending by array position"
// formula — necessary for ingredients with non-monotonic curves
// (Maillard sweet peaking at 80°C in dragonwell then receding under
// catechin grip at 85°C, e.g.). When pre-declared, also auto-derive
// the `flavors` string array from the strengths so the rest of the
// engine sees a consistent shape.
for (const id in EXTRACTION_PROFILES) {
  EXTRACTION_PROFILES[id].forEach((point, idx) => {
    if (Array.isArray(point.flavorStrengths)) {
      // Curator-authored peak/fade — keep as-is; sync flavors list.
      if (!Array.isArray(point.flavors)) {
        point.flavors = point.flavorStrengths.map(([name]) => name);
      }
      return;
    }
    point.flavorStrengths = annotateFlavorStrengths(point.flavors, idx);
  });
}

// Blend two profile points' flavor-strength tuples by lerp factor t.
// Flavors present in only one point lerp from 0; the result drops any
// final strength below 0.5 (effectively absent).
function blendFlavorsWithStrength(lower, upper, t) {
  const all = new Set([
    ...lower.flavorStrengths.map(([n]) => n),
    ...upper.flavorStrengths.map(([n]) => n),
  ]);
  const out = [];
  for (const name of all) {
    const lo = lower.flavorStrengths.find(([n]) => n === name)?.[1] ?? 0;
    const hi = upper.flavorStrengths.find(([n]) => n === name)?.[1] ?? 0;
    const v = lo * (1 - t) + hi * t;
    if (v >= 0.5) out.push([name, Math.round(v * 10) / 10]);
  }
  return out.sort((a, b) => b[1] - a[1]);
}

// Legacy string-array helper, retained for any callers not yet migrated.
function blendFlavors(lower, upper) {
  return Array.from(new Set([...lower.flavors, ...upper.flavors]));
}

function blendCharacter(lower, upper, t) {
  return t < 0.5 ? lower.character : upper.character;
}

/**
 * 2D bracketing — temp and time both contribute. The 3 profile points
 * are ordered light → standard → strong; both axes co-vary across them
 * (light = lower temp + shorter time, strong = higher temp + longer time).
 *
 * Compute "intensity progress" by averaging the user's normalized
 * position along temp and time, then locate that on the [0, n−1] index
 * line and lerp between the two adjacent profile points.
 *
 * Result: temp and time both visibly drive the cup. Pulling the time
 * slider longer at constant temp now actually pushes toward the strong
 * profile, instead of being computed and discarded.
 */
function bracketByIntensity(profiles, tempC, timeS) {
  const sorted = [...profiles].sort((a, b) => a.tempC - b.tempC);
  const n = sorted.length;
  if (n === 1) return [sorted[0], sorted[0], 0];

  const minTemp = sorted[0].tempC;
  const maxTemp = sorted[n - 1].tempC;
  const times   = sorted.map(p => p.timeS);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  // Map (temp, time) to a single 0–1 intensity coordinate. Temp gets
  // a heavier weight than time because in real brewing chemistry it
  // dominates: caffeine doubles per ~10°C rise vs ~30 minutes of
  // additional steep, and catechin / tannin extraction has a similar
  // temp-sensitivity profile. A 50/50 mix made a 15°C temp swing
  // (e.g. Moroccan Mint at 80°C vs 95°C at fixed 180s) feel like
  // the same cup; 0.7/0.3 lets the temp slider actually shift the
  // bracket the user lands in.
  function intensityOf(t, s) {
    const tp = maxTemp === minTemp ? 0 : (t - minTemp) / (maxTemp - minTemp);
    const sp = maxTime === minTime ? 0 : (s - minTime) / (maxTime - minTime);
    return Math.max(0, Math.min(1, 0.55 * tp + 0.45 * sp));
  }

  const userIntensity   = intensityOf(tempC, timeS);
  const pointIntensities = sorted.map(p => intensityOf(p.tempC, p.timeS));

  // Bracket using actual point intensities — respects non-uniform spacing
  // so a profile point at (92, 200) reads as exactly that point when the
  // user lands there, even if 92 is 70% along the temp axis.
  if (userIntensity <= pointIntensities[0]) return [sorted[0], sorted[0], 0];
  if (userIntensity >= pointIntensities[n - 1]) return [sorted[n - 1], sorted[n - 1], 0];
  for (let i = 0; i < n - 1; i++) {
    if (userIntensity >= pointIntensities[i] && userIntensity <= pointIntensities[i + 1]) {
      const span = pointIntensities[i + 1] - pointIntensities[i];
      const t = span === 0 ? 0 : (userIntensity - pointIntensities[i]) / span;
      return [sorted[i], sorted[i + 1], t];
    }
  }
  return [sorted[0], sorted[0], 0];
}

// Volatile-aromatic fade. The 3-point profiles can express that a
// flavor exists across light/standard/strong, but they can't model
// the real chemistry of volatile thiols and terpenes — compounds
// that PEAK at moderate temps then evaporate above ~85°C. Stone
// fruit esters (peach, apricot, muscatel), floral terpenes (rose,
// jasmine, orchid), and the fresh / delicate / citrus aromatics
// all fall off at higher temperatures and longer steeps.
//
// Without this, fruity and floral bands rendered monotonically up
// the temp axis even though a real cup at 95°C × 6min has lost
// most of its peach character. The fade scales each affected
// flavor by an exponential factor in temp above its threshold and
// in time above 240s, modeling Arrhenius-style aromatic loss.
//
// Calibration choice: fadeAboveC is the rough boil-off threshold
// for the compound family. tempK and timeK control fade rate.
// Ranges (peach 0.5, rose 0.4, honey 0.25) reflect that stone
// fruit esters are the most fragile, citrus citral and floral
// terpenes are moderate, Maillard sweetness is most stable.
const FLAVOR_VOLATILES = {
  // Stone fruit / fragile esters — boil off fastest
  peach:    { fadeAboveC: 85, tempK: 0.05, timeK: 0.0010 },
  apricot:  { fadeAboveC: 85, tempK: 0.05, timeK: 0.0010 },
  lychee:   { fadeAboveC: 85, tempK: 0.05, timeK: 0.0010 },
  melon:    { fadeAboveC: 85, tempK: 0.05, timeK: 0.0010 },
  // Generic fruit register — partly volatile esters, partly stable
  // pigment / acid chemistry. Gentle fade so the volatile share
  // recedes at high heat without zeroing out the stable part.
  fruit:    { fadeAboveC: 90, tempK: 0.025, timeK: 0.0005 },
  fruity:   { fadeAboveC: 90, tempK: 0.025, timeK: 0.0005 },
  // berry, cranberry, tart removed from the volatile list — these
  // tokens primarily reflect anthocyanin / citric-acid character
  // which is water-stable. Fading them produced the wrong reading
  // (e.g., All-Heal's bright fading away, hibiscus tart drifting
  // down at oversteep when it should plateau or rise).
  // Muscatel — Darjeeling's signature, fairly fragile
  muscatel: { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  // Floral terpenes — moderately volatile
  floral:   { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  rose:     { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  jasmine:  { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  orchid:   { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  delicate: { fadeAboveC: 82, tempK: 0.06, timeK: 0.0012 },
  heady:    { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  aromatic: { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  // Citrus — citral evaporates, but citric acid is stable. Gentle
  // fade only so the bright lift recedes a bit without erasing
  // the citrus register entirely. 'bright' removed — it's the
  // acidic-lift perception, not a volatile aromatic on its own.
  citrus:   { fadeAboveC: 90, tempK: 0.025, timeK: 0.0005 },
  citrusy:  { fadeAboveC: 90, tempK: 0.025, timeK: 0.0005 },
  bergamot: { fadeAboveC: 88, tempK: 0.04, timeK: 0.0008 },
  // Fresh / the cut-grass register — fragile and quick to fade
  fresh:    { fadeAboveC: 82, tempK: 0.06, timeK: 0.0012 },
  grassy:   { fadeAboveC: 85, tempK: 0.04, timeK: 0.0010 },
  // Honey / Maillard-adjacent — relatively stable, mild fade only
  honey:       { fadeAboveC: 92, tempK: 0.025, timeK: 0.0005 },
  honeyed:     { fadeAboveC: 92, tempK: 0.025, timeK: 0.0005 },
  "honey-sweet":{ fadeAboveC: 92, tempK: 0.025, timeK: 0.0005 },
};

const VOLATILE_TIME_THRESHOLD_S = 240;

// Compute the multiplicative fade for a flavor at the user's
// (tempC, timeS). Returns 1 when the flavor isn't volatile or the
// brew is below both thresholds. Bounded at 0.15 so a flavor never
// completely vanishes — there's always SOME residual signal even
// in heavily over-pulled cups.
function volatileFadeFor(flavorName, tempC, timeS) {
  const cfg = FLAVOR_VOLATILES[flavorName];
  if (!cfg) return 1;
  let factor = 1;
  if (tempC > cfg.fadeAboveC) {
    factor *= Math.exp(-cfg.tempK * (tempC - cfg.fadeAboveC));
  }
  if (timeS > VOLATILE_TIME_THRESHOLD_S) {
    factor *= Math.exp(-cfg.timeK * (timeS - VOLATILE_TIME_THRESHOLD_S));
  }
  return Math.max(0.15, factor);
}

function applyVolatileFade(flavorTuples, tempC, timeS) {
  return flavorTuples.map(([name, v]) => {
    const factor = volatileFadeFor(name, tempC, timeS);
    if (factor === 1) return [name, v];
    return [name, Math.round(v * factor * 10) / 10];
  });
}

// When the user's brew sits BELOW the lightest authored profile's
// timeS (e.g. time slider pulled toward 0 on Wuyi, where the lightest
// profile is at ~200s), the bracket clamps to the lightest profile
// and would return its full flavor strengths as-is. That makes the
// bands re-darken at the very bottom of the time slider after
// appearing to fade as the user approached it — the engine has no
// "barely extracted" state of its own. This factor scales the
// resolver's output toward zero based on how far below the lightest
// profile's time we are. Temp is intentionally NOT scaled here:
// authored profiles' lightest tempC is usually the ingredient's own
// minimum, and tea brewed at its lower temp bound is still a real
// (lighter) cup — not "barely extracted" the way 0s of steep is.
function underFloorScale(profiles, timeS) {
  if (!profiles || profiles.length < 2) return 1;
  const minProfileTime = Math.min(...profiles.map(p => p.timeS));
  if (minProfileTime <= 0) return 1;
  if (timeS >= minProfileTime) return 1;
  // Soft-floor at 0.30. The strip's cup-strength factor still gives
  // a meaningful visual fade as time drops (low cupPeak dampens the
  // band alpha), so we don't need the chemistry to literally zero
  // out. And a 15-second flash of any tea isn't actually no-cup —
  // the strongest extracted notes are still present, just dilute.
  // Without this floor the scale was pulling a flavor that peaks at
  // 3.0 down to 0.6 (barely above the engine's 0.5 visibility
  // filter); anything weaker dropped out entirely, leaving the
  // strip empty for the user. 0.30 floors the strongest flavors at
  // ~0.9 strength so they stay visible but read as a faint trace.
  return Math.max(0.30, timeS / minProfileTime);
}

function scaleFlavors(flavors, scale) {
  if (scale === 1) return flavors;
  return flavors.map(([n, v]) => [n, Math.round(v * scale * 10) / 10]);
}

function scaleEffects(effects, scale) {
  if (scale === 1) return effects;
  return effects.map(([tag, v]) => [tag, Math.round(v * scale * 10) / 10]);
}

export function resolveExtractionProfile(ingredientId, tempC, timeS) {
  const profiles = EXTRACTION_PROFILES[ingredientId];
  if (!profiles || profiles.length === 0) return null;

  const [lo, hi, t] = bracketByIntensity(profiles, tempC, timeS);
  const scale = underFloorScale(profiles, timeS);

  // Volatile-aromatic fade applies LAST — on top of the bracket
  // interpolation and the under-floor scaling — so peak-and-fade
  // arcs (peach rising 70→85°C then dropping 90→100°C) emerge from
  // the engine instead of monotonic strength climbs the user can't
  // see ringing through.
  if (lo === hi) {
    const flavorsScaled = scaleFlavors(lo.flavorStrengths, scale);
    return {
      flavors:  applyVolatileFade(flavorsScaled, tempC, timeS),
      effects:  scaleEffects(lo.effects, scale),
      character: lo.character,
    };
  }

  const flavorsBlended = blendFlavorsWithStrength(lo, hi, t);
  const flavorsScaled  = scaleFlavors(flavorsBlended, scale);
  return {
    flavors:  applyVolatileFade(flavorsScaled, tempC, timeS),
    effects:  scaleEffects(blendEffects(lo, hi, t), scale),
    character: blendCharacter(lo, hi, t),
  };
}

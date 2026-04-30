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
      effects: [["calm", 2], ["sleepy", 1], ["digestive", 1]],
      character: "A morning chamomile — delicate, barely sedative. Hay water with floral lift." },
    { tempC: 95,  timeS: 300, flavors: ["honey", "apple", "floral", "hay"],
      effects: [["calm", 4], ["sleepy", 3], ["digestive", 3]],
      character: "The standard cup. Full honey-floral body, clear calming effect." },
    { tempC: 100, timeS: 420, flavors: ["honey", "apple", "floral", "hay", "earthy", "astringent"],
      effects: [["calm", 4], ["sleepy", 5], ["digestive", 3], ["bitterness", 2]],
      character: "Past the sleepy-time mark. Apigenin maxes out but tannins follow — the cup turns astringent." },
  ],

  lavender: [
    { tempC: 85,  timeS: 120, flavors: ["floral"],
      effects: [["calm", 2], ["sleepy", 1]],
      character: "Light lavender — a soft perfume, nothing intense." },
    { tempC: 92,  timeS: 200, flavors: ["floral", "pine"],
      effects: [["calm", 4], ["sleepy", 2]],
      character: "The culinary cup. Floral and balanced, solid calm." },
    { tempC: 95,  timeS: 240, flavors: ["floral", "pine", "camphor", "soapy"],
      effects: [["calm", 4], ["sleepy", 3], ["bitterness", 2]],
      character: "Over-extracted — camphor and soap notes take the perfume's place. Pull back." },
  ],

  hibiscus: [
    { tempC: 90,  timeS: 240, flavors: ["tart", "fruity", "bright"],
      effects: [["cooling", 2], ["energy", 2]],
      character: "Light hibiscus — a pink tang, gentle brightness." },
    { tempC: 98,  timeS: 360, flavors: ["tart", "fruity", "cranberry", "berry", "bright"],
      effects: [["cooling", 3], ["energy", 3]],
      character: "The standard cup. Ruby color, tart and lively." },
    { tempC: 100, timeS: 420, flavors: ["tart", "fruity", "cranberry", "berry", "astringent"],
      effects: [["cooling", 3], ["energy", 3], ["bitterness", 2]],
      character: "Full extraction — tart pushes into sour, tannins evident." },
  ],

  rose: [
    { tempC: 85,  timeS: 180, flavors: ["floral"],
      effects: [["calm", 2]],
      character: "Light rose — delicate, powdery, barely there." },
    { tempC: 92,  timeS: 270, flavors: ["floral", "sweet", "fruity"],
      effects: [["calm", 3], ["energy", 3]],
      character: "The standard cup. Full rose perfume with a honeyed lift." },
    { tempC: 95,  timeS: 300, flavors: ["floral", "sweet", "fruity", "earthy", "astringent"],
      effects: [["calm", 3], ["energy", 3], ["bitterness", 2]],
      character: "Over-steeped — rose picks up muskiness and a tannic edge. Pull back." },
  ],

  jasmine: [
    { tempC: 75,  timeS: 120, flavors: ["floral", "sweet"],
      effects: [["calm", 2], ["energy", 2]],
      character: "Light jasmine — heady perfume, soft and quick." },
    { tempC: 80,  timeS: 150, flavors: ["floral", "sweet", "honeyed", "heady"],
      effects: [["calm", 3], ["energy", 3]],
      character: "The standard cup. Full jasmine bloom, balanced lift." },
    { tempC: 85,  timeS: 180, flavors: ["floral", "sweet", "honeyed", "heady", "vegetal", "astringent"],
      effects: [["calm", 3], ["energy", 3], ["bitterness", 2]],
      character: "Pushed past the perfume's range — green-tea base pulls tannin, the heady note fades." },
  ],

  // ─── Herbals ──────────────────────────────────────────────────
  lemonbalm: [
    { tempC: 85,  timeS: 180, flavors: ["citrus", "grassy", "bright"],
      effects: [["calm", 2], ["energy", 2]],
      character: "Gentle lemon balm — bright and soft, a light wash." },
    { tempC: 92,  timeS: 270, flavors: ["citrus", "mint", "grassy", "bright", "fresh"],
      effects: [["calm", 3], ["focus", 2], ["energy", 3]],
      character: "The standard cup. Lemon-mint with gentle lift and focus." },
    { tempC: 95,  timeS: 300, flavors: ["citrus", "mint", "grassy", "fresh", "astringent"],
      effects: [["calm", 3], ["focus", 2], ["energy", 3], ["bitterness", 2]],
      character: "Pushed past the sweet spot — citrus dulls, grass turns hay-bitter." },
  ],

  peppermint: [
    { tempC: 90,  timeS: 240, flavors: ["minty", "cool"],
      effects: [["cooling", 3], ["focus", 2], ["digestive", 3]],
      character: "Gentle peppermint — cool and clean, less aggressive." },
    { tempC: 98,  timeS: 360, flavors: ["minty", "cool", "grassy"],
      effects: [["cooling", 4], ["focus", 3], ["digestive", 4]],
      character: "The standard cup. Full menthol, clears the head." },
    { tempC: 100, timeS: 420, flavors: ["minty", "cool", "grassy", "sharp", "harsh"],
      effects: [["cooling", 4], ["focus", 3], ["digestive", 4], ["bitterness", 2]],
      character: "Past the sweet spot. Menthol tips harsh, tannins follow." },
  ],

  rooibos: [
    { tempC: 95,  timeS: 240, flavors: ["honey", "woody", "warm"],
      effects: [["comfort", 3], ["digestive", 2]],
      character: "Light rooibos — warm honeywater, no tannins to speak of." },
    { tempC: 98,  timeS: 360, flavors: ["honey", "woody", "vanilla", "warm", "smooth"],
      effects: [["comfort", 4], ["digestive", 3]],
      character: "The standard cup. Round, sweet, forgiving — can't over-steep." },
    { tempC: 100, timeS: 420, flavors: ["honey", "woody", "vanilla", "earthy", "warm", "rich"],
      effects: [["comfort", 4], ["digestive", 3]],
      character: "Fuller body. Rooibos stays sweet even pushed — one of its charms." },
  ],

  spearmint: [
    { tempC: 88,  timeS: 240, flavors: ["minty", "sweet"],
      effects: [["cooling", 2], ["digestive", 2], ["energy", 1]],
      character: "Gentle spearmint — rounder and sweeter than peppermint." },
    { tempC: 95,  timeS: 360, flavors: ["minty", "sweet", "grassy", "cool"],
      effects: [["cooling", 3], ["digestive", 3], ["energy", 2]],
      character: "The standard cup. Sweet mint, mellow cooling effect." },
    { tempC: 100, timeS: 420, flavors: ["minty", "sweet", "grassy", "cool", "herbal", "harsh"],
      effects: [["cooling", 3], ["digestive", 3], ["energy", 2], ["bitterness", 2]],
      character: "Pushed too far. Carvone goes lawn-clipping, herbal turns hay-bitter." },
  ],

  passionflower: [
    { tempC: 95,  timeS: 300, flavors: ["grassy", "mild"],
      effects: [["calm", 3], ["sleepy", 2], ["digestive", 2]],
      character: "Light passionflower — grassy and quiet, subtle drowse." },
    { tempC: 98,  timeS: 480, flavors: ["grassy", "hay", "mild"],
      effects: [["calm", 4], ["sleepy", 4], ["digestive", 3]],
      character: "The sleepy cup. Hay and soft sedation, the classic use." },
    { tempC: 100, timeS: 600, flavors: ["grassy", "hay", "mild", "earthy"],
      effects: [["calm", 4], ["sleepy", 5], ["digestive", 3], ["bitterness", 1]],
      character: "Maximum extraction — deepest sedative pull, slight bitter edge." },
  ],

  lemongrass: [
    { tempC: 95,  timeS: 240, flavors: ["citrus", "bright"],
      effects: [["energy", 2], ["cooling", 2], ["digestive", 2]],
      character: "Light lemongrass — clean citrus wash, refreshing." },
    { tempC: 98,  timeS: 360, flavors: ["citrus", "grassy", "bright"],
      effects: [["energy", 3], ["cooling", 3], ["digestive", 2]],
      character: "The standard cup. Bright, herbal, uplifting." },
    { tempC: 100, timeS: 420, flavors: ["citrus", "grassy", "bright", "woody", "acrid"],
      effects: [["energy", 3], ["cooling", 3], ["digestive", 2], ["bitterness", 2]],
      character: "Past the bright window — citral pushes acrid; the lift dulls." },
  ],

  // ─── Spices ───────────────────────────────────────────────────
  ginger: [
    { tempC: 100, timeS: 300, flavors: ["spiced", "warm"],
      effects: [["warming", 4], ["comfort", 3], ["digestive", 3], ["energy", 1]],
      character: "Light ginger — warm, gentle bite. Good for a mild stomach." },
    { tempC: 100, timeS: 480, flavors: ["spiced", "warm", "citrus"],
      effects: [["warming", 5], ["comfort", 4], ["digestive", 4], ["energy", 2]],
      character: "The standard cup. Full ginger heat, digestive and warming." },
    { tempC: 100, timeS: 600, flavors: ["spiced", "warm", "citrus", "sharp", "harsh"],
      effects: [["warming", 5], ["comfort", 5], ["digestive", 4], ["energy", 2], ["bitterness", 2]],
      character: "Long simmer. Heat sharpens past pleasant — almost peppery-harsh." },
  ],

  cinnamon: [
    { tempC: 95,  timeS: 300, flavors: ["spiced", "sweet"],
      effects: [["warming", 3], ["comfort", 3], ["digestive", 2]],
      character: "Light cinnamon — sweet warmth, a gentle touch." },
    { tempC: 98,  timeS: 480, flavors: ["spiced", "sweet", "woody", "warm"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3]],
      character: "The standard cup. Full cinnamon bark, round and warming." },
    { tempC: 100, timeS: 600, flavors: ["spiced", "sweet", "woody", "warm", "earthy", "astringent"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3], ["bitterness", 2]],
      character: "Long pull. Coumarin pushes astringent — cassia gets harsh, Ceylon stays gentler." },
  ],

  cardamom: [
    { tempC: 95,  timeS: 240, flavors: ["spiced", "floral"],
      effects: [["warming", 2], ["comfort", 3], ["digestive", 2], ["energy", 2]],
      character: "Light cardamom — aromatic and floral, the upper register." },
    { tempC: 98,  timeS: 360, flavors: ["spiced", "floral", "citrus", "complex"],
      effects: [["warming", 3], ["comfort", 4], ["digestive", 3], ["energy", 3]],
      character: "The standard cup. Full cardamom character — complex, lifting." },
    { tempC: 100, timeS: 480, flavors: ["spiced", "floral", "citrus", "complex", "camphor"],
      effects: [["warming", 3], ["comfort", 4], ["digestive", 3], ["energy", 3], ["bitterness", 2]],
      character: "Pushed too far. Volatile aromatics escape; camphor takes their place." },
  ],

  cloves: [
    { tempC: 95,  timeS: 240, flavors: ["spiced", "warm"],
      effects: [["warming", 3], ["comfort", 3], ["digestive", 2]],
      character: "Light cloves — sweet spice, gentle. A pinch goes far." },
    { tempC: 98,  timeS: 360, flavors: ["spiced", "pungent", "warm", "numbing"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3]],
      character: "The standard cup. Full clove — warm, slightly numbing, medicinal." },
    { tempC: 100, timeS: 420, flavors: ["spiced", "pungent", "warm", "numbing", "medicinal"],
      effects: [["warming", 4], ["comfort", 5], ["digestive", 3], ["bitterness", 3]],
      character: "Eugenol overdose. The cup goes medicinal-numbing." },
  ],

  vanilla: [
    { tempC: 95,  timeS: 240, flavors: ["sweet", "creamy"],
      effects: [["comfort", 3], ["digestive", 2]],
      character: "Light vanilla — soft sweetness, a gentle comfort." },
    { tempC: 98,  timeS: 360, flavors: ["sweet", "creamy", "floral", "warm"],
      effects: [["comfort", 4], ["digestive", 3]],
      character: "The standard cup. Full vanilla bloom, warm and rounded." },
    { tempC: 100, timeS: 420, flavors: ["sweet", "creamy", "floral", "warm", "woody"],
      effects: [["comfort", 4], ["digestive", 3]],
      character: "Fuller extraction. Vanilla's woodier side emerges, still sweet." },
  ],

  fennel: [
    { tempC: 95,  timeS: 240, flavors: ["licorice", "sweet"],
      effects: [["digestive", 3], ["calm", 1]],
      character: "Light fennel — sweet anise, clean and gentle." },
    { tempC: 98,  timeS: 360, flavors: ["licorice", "sweet", "aromatic"],
      effects: [["digestive", 4], ["calm", 2]],
      character: "The standard cup. Full fennel character — digestive and soothing." },
    { tempC: 100, timeS: 420, flavors: ["licorice", "sweet", "aromatic", "bitter"],
      effects: [["digestive", 4], ["calm", 2], ["bitterness", 2]],
      character: "Pushed hard — fennel turns bitter behind the sweetness." },
  ],

  // ─── Adaptogens ───────────────────────────────────────────────
  // Tulsi was the proof-of-concept for the multi-zone brewing
  // model and carries an unusually wide envelope (50-100°C). The
  // five points below cover the full span so the FlavorMap and
  // MoodMap show real gradients across the cool register, not
  // flat extrapolation off the hot end.
  tulsi: [
    { tempC: 60,  timeS: 240, flavors: ["aromatic", "fresh", "sweet"],
      effects: [["calm", 2], ["soothing", 2]],
      character: "Cool-brewed tulsi — green basil top, almost no spice." },
    { tempC: 78,  timeS: 300, flavors: ["aromatic", "spiced", "sweet", "fresh"],
      effects: [["calm", 3], ["focus", 2], ["soothing", 2]],
      character: "Warm steep — aromatic balance, the spice quietly arriving." },
    { tempC: 92,  timeS: 300, flavors: ["spiced", "sweet", "aromatic"],
      effects: [["focus", 2], ["calm", 2], ["energy", 2], ["digestive", 2]],
      character: "Light tulsi — gently aromatic, balanced lift." },
    { tempC: 98,  timeS: 360, flavors: ["spiced", "clove", "peppery", "sweet", "warm"],
      effects: [["focus", 3], ["calm", 3], ["energy", 3], ["digestive", 3]],
      character: "The standard cup. Full holy basil — the adaptogen balance." },
    { tempC: 100, timeS: 420, flavors: ["spiced", "clove", "peppery", "sweet", "earthy", "astringent"],
      effects: [["focus", 3], ["calm", 3], ["energy", 3], ["digestive", 3], ["bitterness", 2]],
      character: "Past the standard. Earthy depth surfaces; bitter follows." },
  ],

  // ─── True teas: Green ─────────────────────────────────────────
  sencha: [
    { tempC: 70,  timeS: 60,  flavors: ["grassy", "sweet", "fresh"],
      effects: [["focus", 2], ["energy", 2]],
      character: "Gentle sencha — sweet grass, fresh top, low astringency, morning-soft." },
    { tempC: 78,  timeS: 90,  flavors: ["grassy", "umami", "marine", "vegetal", "sweet", "fresh"],
      effects: [["focus", 4], ["energy", 3]],
      character: "The canonical cup. Fresh-cut grass and marine umami, balanced and focused." },
    { tempC: 85,  timeS: 120, flavors: ["grassy", "umami", "marine", "vegetal", "astringent"],
      effects: [["focus", 4], ["energy", 4], ["bitterness", 2]],
      character: "Strong sencha — tannic edge, maximum caffeine pull." },
  ],

  gyokuro: [
    { tempC: 50,  timeS: 60,  flavors: ["umami", "sweet"],
      effects: [["focus", 3], ["energy", 2]],
      character: "Ultra-gentle gyokuro — pure sweet umami, a delicate brew." },
    { tempC: 55,  timeS: 100, flavors: ["umami", "marine", "sweet", "buttery"],
      effects: [["focus", 5], ["energy", 3]],
      character: "The classic cup. Dense umami, deep focus, meditative." },
    { tempC: 60,  timeS: 120, flavors: ["umami", "marine", "sweet", "buttery", "seaweed"],
      effects: [["focus", 5], ["energy", 3], ["bitterness", 1]],
      character: "Fuller body. Seaweed notes deepen; slight brisk edge." },
  ],

  gunpowder: [
    { tempC: 80,  timeS: 90,  flavors: ["toasted", "vegetal", "brisk"],
      effects: [["focus", 2], ["energy", 2]],
      character: "Light gunpowder — toasted and clean, approachable." },
    { tempC: 85,  timeS: 135, flavors: ["smoky", "toasted", "bold", "vegetal", "mineral", "brisk"],
      effects: [["focus", 3], ["energy", 3], ["comfort", 2]],
      character: "The standard cup. Full smoky-toasted character, bold mineral body, brisk finish." },
    { tempC: 90,  timeS: 180, flavors: ["smoky", "bold", "toasted", "vegetal", "mineral", "brisk", "astringent"],
      effects: [["focus", 3], ["energy", 4], ["comfort", 2], ["bitterness", 2]],
      character: "Strong and tannic. Smoke intensifies; drinks more assertive." },
  ],

  hojicha: [
    { tempC: 95,  timeS: 30,  flavors: ["roasted", "warm", "woody"],
      effects: [["comfort", 2], ["digestive", 2]],
      character: "Quick hojicha — roasted warmth, minimal caffeine." },
    { tempC: 98,  timeS: 45,  flavors: ["roasted", "caramel", "warm", "nutty", "toasted", "sweet", "woody"],
      effects: [["comfort", 3], ["digestive", 3]],
      character: "The standard cup. Full hojicha — caramel-toasted, warm and sweet, the evening-safe green tea." },
    { tempC: 100, timeS: 60,  flavors: ["roasted", "caramel", "warm", "nutty", "toasted", "sweet", "woody"],
      effects: [["comfort", 3], ["digestive", 3]],
      character: "Fuller extraction. Toast notes deepen; stays gentle." },
  ],

  dragonwell: [
    { tempC: 75,  timeS: 75,  flavors: ["nutty", "sweet", "fresh"],
      effects: [["focus", 3], ["energy", 2]],
      character: "Light dragonwell — sweet chestnut, delicate sweetness, fresh top." },
    { tempC: 80,  timeS: 110, flavors: ["chestnut", "nutty", "toasted", "sweet", "vegetal", "fresh"],
      effects: [["focus", 4], ["energy", 3]],
      character: "The classic cup. Pan-fired chestnut and toasted-bean character, bright focus." },
    { tempC: 85,  timeS: 150, flavors: ["chestnut", "nutty", "toasted", "sweet", "vegetal", "bean", "astringent"],
      effects: [["focus", 4], ["energy", 3], ["bitterness", 2]],
      character: "Hotter than the leaf wants. Chestnut sweetness fades; tannins climb." },
  ],

  // ─── True teas: White ─────────────────────────────────────────
  white: [
    { tempC: 75,  timeS: 120, flavors: ["sweet", "delicate", "floral"],
      effects: [["calm", 2], ["energy", 2]],
      character: "Light white tea — ghost-sweet, barely extracted, floral whispers." },
    { tempC: 80,  timeS: 180, flavors: ["honey", "hay", "sweet", "floral", "apricot", "melon", "delicate"],
      effects: [["calm", 3], ["energy", 3], ["focus", 3]],
      character: "The standard cup. Full silver-needle — honeyed top, hay body, soft stone-fruit and floral edges." },
    { tempC: 85,  timeS: 240, flavors: ["honey", "hay", "apricot", "melon", "wood", "delicate", "astringent"],
      effects: [["calm", 3], ["energy", 3], ["focus", 3], ["bitterness", 2]],
      character: "Past the leaf's tolerance. Honey thins; hay turns tannic." },
  ],

  // ─── True teas: Oolong ────────────────────────────────────────
  oolong: [
    { tempC: 85,  timeS: 90,  flavors: ["floral", "fruit", "orchid"],
      effects: [["focus", 2], ["energy", 2]],
      character: "Light oolong — floral top with orchid edge, gentle lift, early extraction." },
    { tempC: 90,  timeS: 135, flavors: ["floral", "honey", "fruit", "orchid", "peach", "creamy", "toasted"],
      effects: [["focus", 3], ["energy", 3], ["comfort", 2]],
      character: "The standard cup. Full oolong spectrum — orchid, stone fruit, honey-creamy body, toasted edge." },
    { tempC: 95,  timeS: 180, flavors: ["floral", "honey", "fruit", "peach", "toasted", "mineral", "astringent"],
      effects: [["focus", 3], ["energy", 3], ["comfort", 3], ["bitterness", 2]],
      character: "Long pull. Floral notes thin, mineral and tannin take the stage." },
  ],

  // ─── True teas: Black ─────────────────────────────────────────
  assam: [
    { tempC: 95,  timeS: 120, flavors: ["malty", "bold", "warm"],
      effects: [["energy", 3], ["focus", 2], ["comfort", 2]],
      character: "Light assam — malty warmth, gentle caffeine pull." },
    { tempC: 98,  timeS: 240, flavors: ["malty", "bold", "robust", "brisk", "cocoa", "woody"],
      effects: [["energy", 5], ["focus", 3], ["comfort", 4]],
      character: "The classic cup. Bold and robust — full malt, cocoa depth, brisk tannic body that takes milk." },
    { tempC: 100, timeS: 300, flavors: ["malty", "bold", "robust", "brisk", "cocoa", "woody", "astringent"],
      effects: [["energy", 5], ["focus", 3], ["comfort", 4], ["bitterness", 2]],
      character: "Strong assam — maximum caffeine, brisk tannic backbone." },
  ],

  darjeeling: [
    { tempC: 85,  timeS: 120, flavors: ["muscatel", "bright", "brisk"],
      effects: [["energy", 2], ["focus", 2]],
      character: "Light darjeeling — muscatel top, restrained and bright." },
    { tempC: 88,  timeS: 200, flavors: ["muscatel", "floral", "fruit", "bright", "earthy", "rich"],
      effects: [["energy", 4], ["focus", 3]],
      character: "The standard cup. Full 'champagne of teas' — floral, grape-like, with the granite-mineral body underneath." },
    { tempC: 90,  timeS: 240, flavors: ["muscatel", "floral", "fruit", "bright", "earthy", "rich", "astringent"],
      effects: [["energy", 4], ["focus", 3], ["bitterness", 2]],
      character: "Pushed — floral holds but tannins sharpen. Still distinctive." },
  ],

  ceylon: [
    { tempC: 95,  timeS: 120, flavors: ["citrus", "bright", "honey"],
      effects: [["energy", 2], ["comfort", 2]],
      character: "Light ceylon — citrus-honey top, gentle lift, quick brew." },
    { tempC: 98,  timeS: 200, flavors: ["citrus", "bright", "brisk", "honey", "woody", "spiced"],
      effects: [["energy", 3], ["comfort", 3]],
      character: "The standard cup. Full ceylon — crisp citrus, honeyed body, faint cinnamon edge, takes milk well." },
    { tempC: 100, timeS: 240, flavors: ["citrus", "bright", "brisk", "honey", "woody", "spiced", "astringent"],
      effects: [["energy", 3], ["comfort", 3], ["bitterness", 2]],
      character: "Stronger pull. Tannins assert; classic English-breakfast strength." },
  ],

  lapsang: [
    { tempC: 95,  timeS: 120, flavors: ["smoked", "pine", "campfire"],
      effects: [["energy", 2], ["warming", 3], ["comfort", 3], ["digestive", 1]],
      character: "Light lapsang — pine smoke on the surface, gentler than expected." },
    { tempC: 98,  timeS: 200, flavors: ["smoked", "pine", "campfire", "leather", "tar", "woody"],
      effects: [["energy", 3], ["warming", 4], ["comfort", 4], ["digestive", 2]],
      character: "The standard cup. Full campfire — pine smoke, leather, tar — singular, divisive, warming." },
    { tempC: 100, timeS: 240, flavors: ["smoked", "pine", "campfire", "leather", "tar", "woody", "astringent"],
      effects: [["energy", 3], ["warming", 4], ["comfort", 4], ["digestive", 2], ["bitterness", 2]],
      character: "Pushed long. Smoke holds but the body tightens with tannin." },
  ],

  // ─── True teas: Pu-erh ────────────────────────────────────────
  puerh: [
    { tempC: 95,  timeS: 30,  flavors: ["earthy", "woody", "mushroom"],
      effects: [["comfort", 3], ["digestive", 2]],
      character: "Light puerh — earthy wash, mushroom-damp, quick and mild. Traditional first-pour." },
    { tempC: 98,  timeS: 90,  flavors: ["earthy", "woody", "mushroom", "dark", "leather"],
      effects: [["comfort", 4], ["digestive", 3]],
      character: "The standard cup. Full puerh — earth, damp wood, mushroom depth, leather warmth." },
    { tempC: 100, timeS: 180, flavors: ["earthy", "woody", "mushroom", "dark", "leather", "mineral", "astringent"],
      effects: [["comfort", 4], ["digestive", 3], ["bitterness", 2]],
      character: "Deep extraction. Mineral depth at maximum; tannins climb behind it." },
  ],

  // ─── Adaptogens & roots ─────────────────────────────────────
  ashwagandha: [
    { tempC: 95,  timeS: 600,  flavors: ["earthy", "musty"],
      effects: [["grounding", 2], ["calm", 2]],
      character: "Light ashwagandha — gentle root warmth, faint musk." },
    { tempC: 98,  timeS: 900,  flavors: ["earthy", "musty", "bitter", "woody"],
      effects: [["grounding", 3], ["calm", 3], ["sleepy", 2]],
      character: "The standard kshir-style cup. Full root depth, the classic adaptogenic digestive." },
    { tempC: 100, timeS: 1200, flavors: ["earthy", "musty", "bitter", "woody"],
      effects: [["grounding", 4], ["calm", 3], ["sleepy", 3], ["bitterness", 2]],
      character: "Long decoction. Maximum withanolide pull — deep grounding, distinctly bitter." },
  ],

  turmeric: [
    { tempC: 95,  timeS: 600, flavors: ["earthy", "musky"],
      effects: [["warming", 2], ["comfort", 1]],
      character: "Light turmeric — golden color, gentle warmth, mild musk." },
    { tempC: 98,  timeS: 750, flavors: ["earthy", "bitter", "musky", "woody"],
      effects: [["warming", 3], ["comfort", 2], ["digestive", 2]],
      character: "The standard cup. Full curcumin extraction — pair with fat and pepper for absorption." },
    { tempC: 100, timeS: 900, flavors: ["earthy", "bitter", "musky", "woody"],
      effects: [["warming", 3], ["comfort", 2], ["digestive", 2], ["bitterness", 2]],
      character: "Long simmer. Color deepens; the bitter side surfaces." },
  ],

  "black-pepper": [
    { tempC: 95,  timeS: 300, flavors: ["pungent", "warm"],
      effects: [["warming", 2], ["digestive", 2]],
      character: "Quick pepper — sharp aromatic, faint heat." },
    { tempC: 98,  timeS: 600, flavors: ["pungent", "warm", "earthy", "woody"],
      effects: [["warming", 3], ["digestive", 3]],
      character: "The chai cup. Full piperine — bright pungent edge, the absorption-multiplier role." },
    { tempC: 100, timeS: 900, flavors: ["pungent", "warm", "earthy", "woody", "harsh"],
      effects: [["warming", 3], ["digestive", 3], ["bitterness", 2]],
      character: "Long extraction. Heat lingers; piperine pushes into raw bite." },
  ],

  "licorice-root": [
    { tempC: 95,  timeS: 300, flavors: ["sweet", "anise"],
      effects: [["comfort", 2]],
      character: "Light licorice — sweet root water, anise on the lift." },
    { tempC: 98,  timeS: 600, flavors: ["sweet", "anise", "woody", "earthy"],
      effects: [["comfort", 3], ["digestive", 2]],
      character: "The standard cup. Full glycyrrhizin sweetness — the harmonizer's work." },
    { tempC: 100, timeS: 900, flavors: ["sweet", "anise", "woody", "earthy", "bitter"],
      effects: [["comfort", 4], ["digestive", 2], ["bitterness", 1]],
      character: "Long extraction. Sweetness deepens — respect the dose ceiling." },
  ],

  // ─── True teas (new) ────────────────────────────────────────
  matcha: [
    { tempC: 70, timeS: 15, flavors: ["umami", "sweet", "creamy"],
      effects: [["focus", 3], ["calm", 2]],
      character: "Light usucha — frothy and gentle, the morning bowl." },
    { tempC: 75, timeS: 20, flavors: ["umami", "vegetal", "grassy", "creamy", "sweet"],
      effects: [["focus", 4], ["energy", 3], ["calm", 3]],
      character: "The standard whisk. Full umami body, creamy and grass-sweet, balanced focus." },
    { tempC: 80, timeS: 30, flavors: ["umami", "vegetal", "creamy", "grassy", "marine", "oceanic", "astringent"],
      effects: [["focus", 5], ["energy", 4], ["calm", 3], ["bitterness", 2]],
      character: "Pushed thick — koicha territory. Dense umami and marine depth; catechins climb behind it." },
  ],

  genmaicha: [
    { tempC: 70, timeS: 60,  flavors: ["toasted", "nutty", "rice"],
      effects: [["comfort", 2], ["calm", 2]],
      character: "Tea-forward genmaicha — sencha leads, the toasted rice whispers." },
    { tempC: 78, timeS: 105, flavors: ["toasted", "rice", "nutty", "warm", "grassy", "sweet"],
      effects: [["comfort", 3], ["calm", 3], ["digestive", 2]],
      character: "The standard cup. Toasted rice forward, sencha grass underneath, warm and comforting." },
    { tempC: 85, timeS: 150, flavors: ["toasted", "rice", "nutty", "warm", "grassy", "astringent"],
      effects: [["comfort", 3], ["calm", 3], ["digestive", 2], ["bitterness", 2]],
      character: "Past the rice's range. Tea base pulls tannin; the toast dulls." },
  ],

  // ─── Caffeinated herbal ─────────────────────────────────────
  "yerba-mate": [
    { tempC: 70, timeS: 60,  flavors: ["earthy", "grassy"],
      effects: [["energy", 3], ["focus", 2]],
      character: "First fill — bright and herbal, the gentle wake." },
    { tempC: 78, timeS: 180, flavors: ["earthy", "grassy", "herbaceous", "bitter"],
      effects: [["energy", 4], ["focus", 3], ["digestive", 2]],
      character: "The classic gourd cup. Full mate — the durative caffeine pull." },
    { tempC: 85, timeS: 300, flavors: ["earthy", "grassy", "herbaceous", "bitter", "smoky"],
      effects: [["energy", 4], ["focus", 3], ["bitterness", 2]],
      character: "Pushed long. Saponins surface — tongue-coating bitter." },
  ],

  // ─── Sleep & calming herbs (new) ────────────────────────────
  valerian: [
    { tempC: 85, timeS: 600, flavors: ["earthy", "musky"],
      effects: [["calm", 3], ["sleepy", 2]],
      character: "Light valerian — the funk shows but stays gentle." },
    { tempC: 90, timeS: 750, flavors: ["earthy", "musky", "pungent", "bitter"],
      effects: [["calm", 4], ["sleepy", 4]],
      character: "The standard cup. Full valerenic acid — the deep sedation register." },
    { tempC: 95, timeS: 900, flavors: ["earthy", "musky", "pungent", "bitter", "woody"],
      effects: [["calm", 4], ["sleepy", 5], ["bitterness", 2]],
      character: "Maximum extraction. The cheese-funk register — do not drive." },
  ],

  linden: [
    { tempC: 85, timeS: 300, flavors: ["honey", "floral"],
      effects: [["calm", 2], ["sleepy", 1]],
      character: "Light linden — soft honey-floral, just the perfume." },
    { tempC: 90, timeS: 450, flavors: ["honey", "citrus", "floral", "sweet"],
      effects: [["calm", 3], ["sleepy", 2], ["comfort", 2]],
      character: "The standard tisane. Full honey-citrus body, the European pediatric cup." },
    { tempC: 95, timeS: 600, flavors: ["honey", "citrus", "floral", "sweet", "astringent"],
      effects: [["calm", 4], ["sleepy", 3], ["comfort", 3], ["bitterness", 2]],
      character: "Pushed too long. Honey-floral fades; the green-leaf side turns tannic." },
  ],

  // ─── Immune-support florals ─────────────────────────────────
  echinacea: [
    { tempC: 90,  timeS: 300, flavors: ["earthy", "grassy", "herbal"],
      effects: [["comfort", 1]],
      character: "Light echinacea — a gentle herbal wash." },
    { tempC: 95,  timeS: 600, flavors: ["earthy", "grassy", "herbal", "tingling", "musky"],
      effects: [["comfort", 2], ["digestive", 1]],
      character: "The standard cup. Alkamides surface — that distinctive tongue tingle." },
    { tempC: 100, timeS: 900, flavors: ["earthy", "grassy", "herbal", "tingling", "musky", "bitter"],
      effects: [["comfort", 2], ["bitterness", 1]],
      character: "Pushed. Tingling intensifies; faint bitter edge." },
  ],

  elderflower: [
    { tempC: 85, timeS: 300, flavors: ["floral", "fruity"],
      effects: [["comfort", 2]],
      character: "Light elderflower — delicate muscat aromatics." },
    { tempC: 90, timeS: 450, flavors: ["floral", "muscatel", "fruity", "sweet"],
      effects: [["comfort", 3], ["uplifting", 2]],
      character: "The standard cup. Full lychee-muscat lift — the European cold-care." },
    { tempC: 95, timeS: 600, flavors: ["floral", "muscatel", "fruity", "sweet", "astringent"],
      effects: [["comfort", 3], ["uplifting", 2], ["bitterness", 2]],
      character: "Pushed past the muscat. Aromatic thins; bitter follows." },
  ],

  // ─── Mineral-rich Western herbals ───────────────────────────
  nettle: [
    { tempC: 95,  timeS: 300, flavors: ["earthy", "grassy"],
      effects: [["comfort", 2]],
      character: "Light nettle — green and mineral, a quiet spring tonic." },
    { tempC: 98,  timeS: 600, flavors: ["earthy", "grassy", "mineral", "vegetal"],
      effects: [["comfort", 3], ["digestive", 2]],
      character: "The standard cup. Full mineral pull, the daily green." },
    { tempC: 100, timeS: 900, flavors: ["earthy", "grassy", "mineral", "vegetal", "sweet", "astringent"],
      effects: [["comfort", 3], ["digestive", 2], ["bitterness", 2]],
      character: "Long-infused. Mineral depth maxes out; the cup tightens with tannin." },
  ],

  "dandelion-root": [
    { tempC: 95,  timeS: 600,  flavors: ["caramel", "nutty"],
      effects: [["digestive", 2], ["comfort", 1]],
      character: "Light dandelion — toasted root warmth, gentle bittersweet." },
    { tempC: 98,  timeS: 1200, flavors: ["caramel", "nutty", "bittersweet", "earthy"],
      effects: [["digestive", 3], ["comfort", 2]],
      character: "The standard cup. The caffeine-free coffee — full roasted depth." },
    { tempC: 100, timeS: 1800, flavors: ["caramel", "nutty", "bittersweet", "earthy", "astringent"],
      effects: [["digestive", 3], ["comfort", 2], ["bitterness", 2]],
      character: "Long decoction. Coffee territory; bitter and tannic together." },
  ],

  "dandelion-leaf": [
    { tempC: 90,  timeS: 300, flavors: ["grassy", "fresh"],
      effects: [["digestive", 2]],
      character: "Light dandelion leaf — bright green, mild bitter." },
    { tempC: 95,  timeS: 600, flavors: ["grassy", "fresh", "mineral", "vegetal"],
      effects: [["digestive", 3], ["cooling", 2]],
      character: "The standard cup. Full bitter-green tonic, the catalog's potassium-sparing diuretic." },
    { tempC: 100, timeS: 900, flavors: ["bitter", "grassy", "mineral", "vegetal"],
      effects: [["digestive", 3], ["cooling", 2], ["bitterness", 2]],
      character: "Pushed long. Bitter dominates; the spring greens turn medicinal." },
  ],

  // ─── Mushrooms ──────────────────────────────────────────────
  reishi: [
    { tempC: 95,  timeS: 1800, flavors: ["earthy", "woody"],
      effects: [["calm", 2], ["sleepy", 1]],
      character: "Short reishi — woody-earthy infusion, the bitter held back." },
    { tempC: 98,  timeS: 3600, flavors: ["earthy", "woody", "bitter", "mushroomy"],
      effects: [["calm", 3], ["sleepy", 3], ["comfort", 2]],
      character: "The standard decoction. Full Lingzhi — the An Shen tradition." },
    { tempC: 100, timeS: 7200, flavors: ["earthy", "woody", "bitter", "mushroomy"],
      effects: [["calm", 4], ["sleepy", 4], ["comfort", 3], ["bitterness", 3]],
      character: "Two-hour decoction. Maximum triterpene pull — deeply bitter and grounding." },
  ],

  "lions-mane": [
    { tempC: 90,  timeS: 600,  flavors: ["sweet", "umami"],
      effects: [["focus", 2]],
      character: "Light lion's mane — gentle, almost broth-like." },
    { tempC: 95,  timeS: 1200, flavors: ["sweet", "umami", "earthy", "nutty"],
      effects: [["focus", 3], ["comfort", 2]],
      character: "The standard cup. The most palatable mushroom — umami and quietly nourishing." },
    { tempC: 100, timeS: 1800, flavors: ["sweet", "umami", "earthy", "nutty", "muddy"],
      effects: [["focus", 3], ["comfort", 2], ["bitterness", 2]],
      character: "Long-extracted. Earthy depth surfaces; the cup tips muddy." },
  ],

  // ─── Herbs (added for TrackMap gradient coverage) ─────────────
  sage: [
    { tempC: 92,  timeS: 240, flavors: ["herbaceous", "sage", "savory"],
      effects: [["digestive", 2], ["soothing", 2]],
      character: "Light sage — savory herb top, gentle aromatic lift." },
    { tempC: 96,  timeS: 360, flavors: ["herbaceous", "sage", "savory", "camphor", "woody"],
      effects: [["digestive", 3], ["soothing", 3], ["focus", 2]],
      character: "The standard cup. Full sage character — eucalyptus edge, clearing." },
    { tempC: 100, timeS: 480, flavors: ["herbaceous", "sage", "camphor", "woody", "medicinal", "bitter"],
      effects: [["digestive", 3], ["soothing", 3], ["focus", 2], ["bitterness", 2]],
      character: "Pushed long. The medicinal note climbs, edge into bitter." },
  ],

  // ─── Citrus peels ─────────────────────────────────────────────
  bergamot: [
    { tempC: 88,  timeS: 180, flavors: ["citrus", "bergamot", "floral"],
      effects: [["uplifting", 2], ["focus", 2]],
      character: "Light bergamot — perfumed citrus top, only just lifting." },
    { tempC: 95,  timeS: 300, flavors: ["citrus", "bergamot", "floral", "bright", "aromatic"],
      effects: [["uplifting", 3], ["focus", 3], ["calm", 2]],
      character: "The Earl Grey signature — fragrant citrus and floral oil." },
    { tempC: 100, timeS: 420, flavors: ["citrus", "bergamot", "bright", "aromatic", "pith", "bitter"],
      effects: [["uplifting", 3], ["focus", 3], ["bitterness", 2]],
      character: "Past optimal — the perfume thins, pith bitterness surfaces." },
  ],
  "orange-peel": [
    { tempC: 92,  timeS: 240, flavors: ["citrus", "orange", "sweet"],
      effects: [["uplifting", 2], ["warming", 2]],
      character: "Light orange peel — bright citrus top, faint sweetness." },
    { tempC: 96,  timeS: 360, flavors: ["citrus", "orange", "sweet", "aromatic", "warm"],
      effects: [["uplifting", 3], ["warming", 3], ["digestive", 2]],
      character: "The standard cup. Full orange character — sun-warm and rounded." },
    { tempC: 100, timeS: 480, flavors: ["citrus", "orange", "aromatic", "warm", "pith", "bitter"],
      effects: [["uplifting", 3], ["warming", 3], ["bitterness", 2]],
      character: "Long extraction — the sweet edge thins, pith carries bitter." },
  ],
  "lemon-peel": [
    { tempC: 88,  timeS: 180, flavors: ["citrus", "lemon", "bright"],
      effects: [["uplifting", 2], ["cooling", 2]],
      character: "Light lemon peel — sharp clean top, only the brightness." },
    { tempC: 95,  timeS: 300, flavors: ["citrus", "lemon", "bright", "fresh", "aromatic"],
      effects: [["uplifting", 3], ["cooling", 3], ["focus", 2]],
      character: "The standard cup. Full lemon — citrus oil, clean and lively." },
    { tempC: 100, timeS: 420, flavors: ["citrus", "lemon", "bright", "aromatic", "pith", "bitter"],
      effects: [["uplifting", 3], ["cooling", 3], ["bitterness", 2]],
      character: "Past optimal — the lemon edge sharpens, pith goes bitter." },
  ],

  // ─── Dried fruit ──────────────────────────────────────────────
  "dried-apple": [
    { tempC: 92,  timeS: 360, flavors: ["sweet", "fruity", "apple"],
      effects: [["comfort", 2], ["uplifting", 2]],
      character: "Light apple — soft sweetness, faint orchard fruit." },
    { tempC: 96,  timeS: 480, flavors: ["sweet", "fruity", "apple", "honeyed", "hay"],
      effects: [["comfort", 3], ["uplifting", 3], ["calm", 2]],
      character: "The standard cup. Full dried-apple — honey-sweet, compote depth." },
    { tempC: 100, timeS: 600, flavors: ["sweet", "fruity", "apple", "honeyed", "hay", "tart"],
      effects: [["comfort", 3], ["uplifting", 3], ["calm", 2]],
      character: "Long-steeped. Fruit deepens, a faint tart edge surfaces." },
  ],
  cranberry: [
    { tempC: 92,  timeS: 240, flavors: ["tart", "fruity", "berry"],
      effects: [["uplifting", 2], ["cooling", 2]],
      character: "Light cranberry — bright tart top, gentle berry." },
    { tempC: 96,  timeS: 360, flavors: ["tart", "fruity", "berry", "bright", "cranberry"],
      effects: [["uplifting", 3], ["cooling", 3], ["energy", 2]],
      character: "The standard cup. Full cranberry — ruby color, tart-sweet bite." },
    { tempC: 100, timeS: 480, flavors: ["tart", "fruity", "berry", "cranberry", "astringent"],
      effects: [["uplifting", 3], ["cooling", 3], ["energy", 2], ["bitterness", 2]],
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
for (const id in EXTRACTION_PROFILES) {
  EXTRACTION_PROFILES[id].forEach((point, idx) => {
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

  // Map (temp, time) to a single 0–1 intensity coordinate.
  function intensityOf(t, s) {
    const tp = maxTemp === minTemp ? 0 : (t - minTemp) / (maxTemp - minTemp);
    const sp = maxTime === minTime ? 0 : (s - minTime) / (maxTime - minTime);
    return Math.max(0, Math.min(1, (tp + sp) / 2));
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
  return Math.max(0, timeS / minProfileTime);
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

  if (lo === hi) {
    return {
      flavors:  scaleFlavors(lo.flavorStrengths, scale),
      effects:  scaleEffects(lo.effects, scale),
      character: lo.character,
    };
  }

  return {
    flavors:  scaleFlavors(blendFlavorsWithStrength(lo, hi, t), scale),
    effects:  scaleEffects(blendEffects(lo, hi, t), scale),
    character: blendCharacter(lo, hi, t),
  };
}

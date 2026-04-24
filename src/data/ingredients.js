/* ──────────────────────────────────────────────────────────────
   Herbanium — INGREDIENTS data
   Updated for vocabulary v1 (see docs/vocabulary.md)

   Changes from previous version:
   - calming → calm  (normalize)
   - settling → digestive  (normalize)
   - comfort → soothing  (normalize, ingredient-side)
   - lifting → uplifting  (normalize)
   - clear → uplifting  (or merged into focus where redundant)
   - bitterness → REMOVED from effects (now a flavor only)

   Research-backed effect profiles for the 8 ingredients with
   completed research files: chamomile, lavender, peppermint,
   sencha (green tea), hibiscus, rose, passionflower, jasmine.

   Bug fixes applied:
   - hibiscus: removed unsupported `lifting`, added research-backed `digestive`
   - rose: corrected from `lifting` to `soothing` per literature
   ────────────────────────────────────────────────────────────── */

const INGREDIENTS = {
  chamomile: {
    name: "Chamomile", latin: "Matricaria chamomilla", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // RESEARCH-BACKED: was [["calming", 4], ["sleepy", 3], ["digestive", 3]]
    effects: [["calm", 4], ["sleepy", 3], ["digestive", 3], ["soothing", 2]],
    flavors: ["honey", "apple", "floral", "hay"],
    pairs: ["lavender", "lemonbalm", "rose", "passionflower", "fennel"],
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
    // RESEARCH-BACKED: was [["calming", 4], ["sleepy", 2]]
    // Note: research recommends `calm` 3 (not 4) — clinical evidence is
    // strong for Silexan oral oil, more uncertain for tea at typical doses
    effects: [["calm", 3], ["sleepy", 2], ["cooling", 2]],
    flavors: ["floral", "pine", "camphor"],
    pairs: ["chamomile", "rose", "lemonbalm", "passionflower"],
    dose: "½ tsp · 200ml",
    headsUp: null,
    blurb: "Use sparingly — culinary lavender is a strong voice in any blend, bright and slightly cooling.",
  },
  lemonbalm: {
    name: "Lemon Balm", latin: "Melissa officinalis", category: "herbal",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    // VOCAB ONLY: was [["calming", 3], ["focus", 2], ["lifting", 3]]
    effects: [["calm", 3], ["focus", 2], ["uplifting", 3]],
    flavors: ["citrus", "mint", "grassy"],
    pairs: ["chamomile", "peppermint", "rose", "spearmint", "lemongrass", "tulsi"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "A lemony mint relative, historically called the 'gladdening herb'. Quiet lift without caffeine.",
  },
  peppermint: {
    name: "Peppermint", latin: "Mentha × piperita", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // RESEARCH-BACKED: was [["focus", 3], ["digestive", 4], ["cooling", 4]]
    // digestive moved to primary (NNT=4 IBS evidence is strongest in catalog)
    effects: [["digestive", 4], ["cooling", 4], ["focus", 2], ["energy", 2]],
    flavors: ["minty", "cool", "grassy"],
    pairs: ["lemonbalm", "ginger", "rooibos", "fennel", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "Can worsen acid reflux for some.",
    blurb: "Bracing and clean. A post-meal standard across many traditions.",
  },
  rooibos: {
    name: "Rooibos", latin: "Aspalathus linearis", category: "herbal",
    caffeine: 0, tempC: [100, 100], timeS: [300, 420],
    // VOCAB ONLY: was [["comfort", 4], ["settling", 3]]
    effects: [["soothing", 4], ["digestive", 3]],
    flavors: ["honey", "woody", "vanilla"],
    pairs: ["cinnamon", "ginger", "vanilla", "cloves", "rose", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "South African red bush — naturally sweet, round, and forgiving to over-steep.",
  },
  sencha: {
    name: "Sencha Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 25, tempC: [70, 80], timeS: [60, 120],
    // RESEARCH-BACKED: was [["focus", 4], ["energy", 3], ["clear", 4]]
    // `clear` was redundant with focus; expanded to show full L-theanine + caffeine profile
    effects: [["focus", 4], ["energy", 3], ["calm", 3], ["cooling", 2]],
    flavors: ["grassy", "marine", "umami"],
    pairs: ["peppermint", "lemonbalm", "jasmine", "spearmint"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Steamed Japanese green, vegetal and oceanic. Burns easily — keep the water well under a boil.",
  },
  assam: {
    name: "Assam Black", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 60, tempC: [95, 100], timeS: [180, 300],
    effects: [["energy", 5], ["focus", 3], ["warming", 4]],
    flavors: ["malty", "woody", "cocoa"],
    pairs: ["ginger", "cinnamon", "cardamom", "cloves", "vanilla"],
    dose: "1 tsp · 200ml",
    headsUp: "High caffeine — not for late afternoons.",
    blurb: "Robust, malty Indian black. The backbone of a proper morning cup.",
  },
  ginger: {
    name: "Ginger", latin: "Zingiber officinale", category: "spice",
    caffeine: 0, tempC: [100, 100], timeS: [420, 600],
    effects: [["warming", 5], ["digestive", 4], ["energy", 2]],
    flavors: ["spiced", "warm", "citrus"],
    pairs: ["assam", "rooibos", "peppermint", "cinnamon", "cardamom", "cloves", "lemongrass"],
    dose: "2 coins · 250ml",
    headsUp: null,
    blurb: "Dried or fresh — a foundation for warming blends and a digestive ally.",
  },
  hibiscus: {
    name: "Hibiscus", latin: "Hibiscus sabdariffa", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // RESEARCH-BACKED + BUG FIX: was [["energy", 2], ["cooling", 3], ["lifting", 3]]
    // Earlier bug had energy duplicated; lifting wasn't supported by research
    effects: [["cooling", 3], ["energy", 2], ["digestive", 2]],
    flavors: ["tart", "fruity", "cranberry"],
    pairs: ["rose", "rooibos", "ginger", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "May lower blood pressure — sip modestly if relevant.",
    blurb: "Ruby-red, tart, and refreshing. Tastes like the idea of cranberries.",
  },
  rose: {
    name: "Rose Petal", latin: "Rosa × damascena", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    // RESEARCH-BACKED + BUG FIX: was [["calming", 3], ["lifting", 3]]
    // Earlier bug had `energy 3`; literature is consistently relaxing not energizing
    effects: [["calm", 3], ["soothing", 3], ["sleepy", 2]],
    flavors: ["floral", "sweet", "fruity"],
    pairs: ["chamomile", "lavender", "hibiscus", "cardamom", "tulsi", "vanilla", "white", "oolong"],
    dose: "1 tsp · 200ml",
    headsUp: "Source food-grade petals — ornamental roses may carry pesticide residue.",
    blurb: "Subtle, powdery, and romantic. Lifts a blend into something hand-written.",
  },

  /* ── spices (warming, digestive, chai-adjacent) ────────────── */

  cinnamon: {
    name: "Cinnamon", latin: "Cinnamomum verum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    // VOCAB ONLY: was [["warming", 5], ["comfort", 3], ["digestive", 3]]
    effects: [["warming", 5], ["soothing", 3], ["digestive", 3]],
    flavors: ["spiced", "sweet", "woody", "warm"],
    pairs: ["assam", "rooibos", "ginger", "cardamom", "cloves", "vanilla"],
    dose: "½ stick or ½ tsp · 250ml",
    headsUp: "Cassia (most common) has higher coumarin — heavy daily use is cautioned. Ceylon (C. verum) is safer for frequent use.",
    blurb: "True Ceylon cinnamon is delicate and sweet; cassia is stronger and more common. Both warm a cup and lean it toward dessert.",
  },
  cardamom: {
    name: "Cardamom", latin: "Elettaria cardamomum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 480],
    // VOCAB ONLY: was [["warming", 4], ["digestive", 3], ["lifting", 3]]
    effects: [["warming", 4], ["digestive", 3], ["uplifting", 3]],
    flavors: ["spiced", "floral", "citrus", "complex"],
    pairs: ["assam", "rose", "ginger", "cinnamon", "cloves", "vanilla", "tulsi"],
    dose: "3–4 crushed pods · 250ml",
    headsUp: null,
    blurb: "The 'queen of spices' — bright, aromatic, and complex. Crush pods just before brewing. Essential to masala chai.",
  },
  cloves: {
    name: "Cloves", latin: "Syzygium aromaticum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["warming", 5], ["digestive", 3]],
    flavors: ["spiced", "pungent", "warm", "numbing"],
    pairs: ["assam", "cinnamon", "cardamom", "ginger", "rooibos"],
    dose: "2–3 cloves · 250ml",
    headsUp: "Very strong — can numb the tongue. One or two cloves, not a handful.",
    blurb: "Intensely warming, with a characteristic numbing quality. A little goes a long way.",
  },
  vanilla: {
    name: "Vanilla Bean", latin: "Vanilla planifolia", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // VOCAB ONLY: was [["comfort", 4], ["settling", 3]]
    effects: [["soothing", 4], ["digestive", 3]],
    flavors: ["sweet", "creamy", "floral", "warm"],
    pairs: ["rooibos", "assam", "cinnamon", "cardamom", "rose"],
    dose: "½ bean split · 250ml",
    headsUp: null,
    blurb: "The dried seed pod of a climbing orchid. Rich, sweet, and creamy — lifts any blend toward dessert without actual sugar.",
  },

  /* ── herbals ──────────────────────────────────────────────── */

  spearmint: {
    name: "Spearmint", latin: "Mentha spicata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // VOCAB ONLY: was [["digestive", 3], ["cooling", 3], ["lifting", 2]]
    effects: [["digestive", 3], ["cooling", 3], ["uplifting", 2]],
    flavors: ["minty", "sweet", "grassy", "cool"],
    pairs: ["lemonbalm", "sencha", "rose", "chamomile", "gunpowder"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Gentler than peppermint — sweeter, less camphor. A safer choice in delicate floral or green-tea blends.",
  },
  passionflower: {
    name: "Passionflower", latin: "Passiflora incarnata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    // RESEARCH-BACKED: was [["calming", 4], ["sleepy", 4], ["settling", 3]]
    // More conservative ratings — clinical evidence is "modest but consistent"
    effects: [["calm", 3], ["sleepy", 3], ["digestive", 2], ["soothing", 2]],
    flavors: ["grassy", "hay", "mild"],
    pairs: ["chamomile", "lemonbalm", "lavender"],
    dose: "1 tsp · 200ml",
    headsUp: "Sedative — avoid combining with other sedatives or alcohol, and don't drive after. Not for pregnancy.",
    blurb: "Mild and hay-like in flavor. Reliably drowsy — pair with stronger-tasting herbs to carry a blend.",
  },
  lemongrass: {
    name: "Lemongrass", latin: "Cymbopogon citratus", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // VOCAB ONLY: was [["lifting", 3], ["cooling", 3], ["digestive", 2]]
    effects: [["uplifting", 3], ["cooling", 3], ["digestive", 2]],
    flavors: ["citrus", "grassy", "bright"],
    pairs: ["ginger", "peppermint", "lemonbalm", "rose", "rooibos", "hibiscus"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Long grassy stalks bringing a bright, clean lemon note without citrus acidity. A staple of Southeast Asian beverages.",
  },
  fennel: {
    name: "Fennel Seed", latin: "Foeniculum vulgare", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // VOCAB ONLY: was [["digestive", 4], ["calming", 2]]
    effects: [["digestive", 4], ["calm", 2]],
    flavors: ["licorice", "sweet", "aromatic"],
    pairs: ["peppermint", "ginger", "chamomile", "lemonbalm", "rooibos"],
    dose: "1 tsp crushed · 200ml",
    headsUp: "Heavy doses cautioned in pregnancy — verify.",
    blurb: "Bright anise-like seeds — a digestive classic across Mediterranean and Indian traditions. Often served after a heavy meal.",
  },

  /* ── flower ───────────────────────────────────────────────── */

  jasmine: {
    name: "Jasmine", latin: "Jasminum sambac", category: "flower",
    caffeine: 0, tempC: [75, 85], timeS: [120, 180],
    // RESEARCH-BACKED: was [["calming", 3], ["lifting", 3]]
    // Biphasic effect documented — both calming AND mildly arousing
    effects: [["calm", 3], ["uplifting", 3], ["focus", 2], ["energy", 2]],
    flavors: ["floral", "sweet", "honeyed", "heady"],
    pairs: ["sencha", "white", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Small star-shaped flowers, traditionally layered at night with green or white tea to scent the leaves. Too-hot water kills the perfume.",
  },

  /* ── adaptogen ────────────────────────────────────────────── */

  tulsi: {
    name: "Tulsi", latin: "Ocimum tenuiflorum", category: "adaptogen",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    // VOCAB ONLY: was [["focus", 3], ["calming", 3], ["lifting", 3], ["settling", 3]]
    effects: [["focus", 3], ["calm", 3], ["uplifting", 3], ["digestive", 3]],
    flavors: ["spiced", "clove", "peppery", "sweet"],
    pairs: ["rose", "cardamom", "lemonbalm", "ginger", "peppermint"],
    dose: "1 tsp · 200ml",
    headsUp: "May affect blood sugar and thyroid function — verify interactions if relevant.",
    blurb: "Holy basil — sacred in Ayurvedic tradition, where it's called the 'incomparable one.' Clove-like and peppery, with the characteristic adaptogenic quality of lifting both ends of the day.",
  },

  /* ── true teas ────────────────────────────────────────────── */

  white: {
    name: "White Tea", latin: "Camellia sinensis", category: "true tea", subcategory: "white",
    caffeine: 18, tempC: [75, 85], timeS: [180, 300],
    // VOCAB ONLY: was [["calming", 3], ["lifting", 3], ["clear", 3]]
    // `clear` mapped to `focus` here (mental clarity, not mood-lift)
    effects: [["calm", 3], ["uplifting", 3], ["focus", 3]],
    flavors: ["sweet", "hay", "honey", "delicate", "melon"],
    pairs: ["jasmine", "rose"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The least-processed tea — freshly-plucked leaves allowed to wither. Delicate, naturally sweet, with honey and melon notes. Rewards patience and soft water.",
  },
  oolong: {
    name: "Oolong", latin: "Camellia sinensis", category: "true tea", subcategory: "oolong",
    caffeine: 37, tempC: [85, 95], timeS: [120, 240],
    // VOCAB ONLY: was [["focus", 3], ["lifting", 3], ["warming", 2]]
    effects: [["focus", 3], ["uplifting", 3], ["warming", 2]],
    flavors: ["floral", "fruit", "toasted", "honey"],
    pairs: ["rose", "jasmine"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The middle path between green and black — partially oxidized, spectacularly varied by origin. Taiwanese high-mountain leans floral; Wuyi rock leans toasted and mineral.",
  },
  gyokuro: {
    name: "Gyokuro", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 45, tempC: [50, 60], timeS: [90, 120],
    // VOCAB ONLY: was [["focus", 5], ["clear", 5], ["lifting", 3]]
    // `clear` redundant with focus 5; replaced with `calm` (high L-theanine signature)
    effects: [["focus", 5], ["calm", 4], ["uplifting", 3]],
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
  gunpowder: {
    name: "Gunpowder Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 30, tempC: [80, 90], timeS: [120, 240],
    effects: [["focus", 3], ["energy", 3], ["warming", 2]],
    flavors: ["smoky", "toasted", "vegetal", "brisk"],
    pairs: ["spearmint", "peppermint", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese pan-fired green rolled into tight pellets — the 'gunpowder'. Unfurls during brewing. Stands up to bold treatments like mint and sugar; the backbone of Maghrebi tea culture.",
  },
  hojicha: {
    name: "Hojicha", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 8, tempC: [95, 100], timeS: [30, 60],
    // VOCAB ONLY: was [["warming", 3], ["settling", 3], ["comfort", 3]]
    effects: [["warming", 3], ["digestive", 3], ["soothing", 3]],
    flavors: ["roasted", "woody", "caramel", "nutty", "toasted"],
    pairs: ["rooibos", "ginger", "vanilla"],
    dose: "1 tbsp · 250ml",
    headsUp: null,
    blurb: "Japanese green tea roasted over charcoal until the leaves turn reddish-brown. The roasting strips most of the caffeine and brings up warm, toasty, caramel notes. An evening tea that isn't an herbal.",
  },
  dragonwell: {
    name: "Dragonwell", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 28, tempC: [75, 85], timeS: [90, 180],
    // VOCAB ONLY: was [["focus", 4], ["lifting", 3], ["clear", 3]]
    // `clear` redundant with focus; merged
    effects: [["focus", 4], ["uplifting", 3], ["calm", 2]],
    flavors: ["nutty", "chestnut", "sweet", "vegetal", "bean"],
    pairs: ["rose", "jasmine"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Longjing — pan-fired Chinese green from Hangzhou's West Lake, hand-pressed flat against hot woks. Sweet, faintly chestnut-like, and among the most prized teas in China. A cup that rewards attention.",
  },
  darjeeling: {
    name: "Darjeeling", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 40, tempC: [85, 90], timeS: [180, 240],
    // VOCAB ONLY: was [["energy", 3], ["lifting", 4], ["focus", 3]]
    effects: [["energy", 3], ["uplifting", 4], ["focus", 3]],
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
    // VOCAB ONLY: was [["energy", 3], ["lifting", 3], ["warming", 3]]
    effects: [["energy", 3], ["uplifting", 3], ["warming", 3]],
    flavors: ["citrus", "bright", "brisk", "woody"],
    pairs: ["ginger", "lemongrass", "cinnamon", "cardamom", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Sri Lankan black tea — brisk and bright, with a characteristic citrus lift. The backbone of most breakfast blends and the base for most commercial Earl Grey. Forgiving of milk and sugar.",
  },
  lapsang: {
    name: "Lapsang Souchong", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 30, tempC: [95, 100], timeS: [180, 240],
    // VOCAB ONLY: was [["warming", 4], ["settling", 2]]
    effects: [["warming", 4], ["digestive", 2]],
    flavors: ["smoked", "pine", "tar", "campfire", "woody"],
    pairs: ["rooibos"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese black tea from Fujian, dried over pine fires. Famously smoky — campfire and tar on first sip. The tea you either love immediately or never drink again; in either case, unmistakable.",
  },
  puerh: {
    name: "Shou Pu-erh", latin: "Camellia sinensis", category: "true tea", subcategory: "pu-erh",
    caffeine: 35, tempC: [95, 100], timeS: [60, 180],
    // VOCAB + STRUCTURE: was [["warming", 4], ["settling", 3], ["digestive", 3]]
    // `settling` and `digestive` would have merged to digestive; added `grounding`
    // (proper for pu-erh per cha qi tradition)
    effects: [["warming", 4], ["digestive", 3], ["grounding", 3]],
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

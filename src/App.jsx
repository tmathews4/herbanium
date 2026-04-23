import React, { useState, useEffect, useRef } from "react";

/* ──────────────────────────────────────────────────────────────
   Herbanium — interactive mock
   Aesthetic: warm paper / apothecary journal
   ────────────────────────────────────────────────────────────── */

const theme = {
  ivory:    "#F3ECDC",
  paper:    "#EAE0C7",
  cream:    "#FAF4E4",
  ink:      "#1E1812",
  inkSoft:  "#453A2C",
  ash:      "#796E5B",
  rule:     "#D2C4A3",
  ruleSoft: "#E3D7B8",
  sage:     "#6D7E55",
  sageDeep: "#4A573A",
  ochre:    "#A57836",
  terra:    "#B0542F",
  rose:     "#C37959",
  sky:      "#7F9AA0",
  plum:     "#7B4A5A",
};

const ff = {
  serif:    `"Fraunces", "Cormorant Garamond", Georgia, serif`,
  sans:     `"Instrument Sans", "Inter", system-ui, sans-serif`,
  mono:     `"JetBrains Mono", ui-monospace, monospace`,
};

/* ──────────────────────────────────────────────────────────────
   Unit system (Celsius / Fahrenheit)
   ────────────────────────────────────────────────────────────── */

const UnitContext = React.createContext({
  unit: "C", setUnit: () => {},          // temperature — "C" | "F"
  weightUnit: "tsp", setWeightUnit: () => {}, // weight — "tsp" | "g"
});
const useUnit = () => React.useContext(UnitContext);

const cToF = (c) => Math.round(c * 9 / 5 + 32);

const formatTemp = (c, unit = "C") => unit === "F" ? `${cToF(c)}°F` : `${c}°C`;

const formatTempRange = (minC, maxC, unit = "C") => {
  if (minC === maxC) return formatTemp(minC, unit);
  if (unit === "F") return `${cToF(minC)}–${cToF(maxC)}°F`;
  return `${minC}–${maxC}°C`;
};

// short form for compact chips (no °F/°C suffix, just the numbers and a degree)
const formatTempShort = (minC, maxC, unit = "C") => {
  if (unit === "F") {
    return minC === maxC ? `${cToF(minC)}°` : `${cToF(minC)}–${cToF(maxC)}°`;
  }
  return minC === maxC ? `${minC}°` : `${minC}–${maxC}°`;
};

// Grams-per-teaspoon by ingredient category. Folk-tea convention, not lab-precise —
// densities vary wildly by how packed the spoon is, but this gets "1 tsp per cup"
// feeling right for the common cases.
const TSP_BY_CATEGORY = {
  "flower":     1.0,  // chamomile, lavender, rose — light and fluffy
  "herbal":     1.2,  // lemon balm, mint, nettle — leafy but denser than flowers
  "true tea":   2.0,  // sencha, assam, darjeeling, oolong — standard tea-leaf convention
  "spice":      2.5,  // ginger, cinnamon, cardamom — dense chips/pieces
  "adaptogen":  3.0,  // ashwagandha, reishi, turmeric — typically powdered
};

const gramsToTsp = (g, category) => {
  const perTsp = TSP_BY_CATEGORY[category] || 1.5;
  return g / perTsp;
};

// Format a tsp amount with ¼-tsp rounding, rolling up to tablespoons at 3+ tsp.
// Small amounts fall back to "pinch."
const formatTsp = (tsp) => {
  if (tsp < 0.15) return "pinch";
  // Round to nearest quarter
  const q = Math.round(tsp * 4) / 4;
  if (q >= 3) {
    // Roll up to tablespoons (1 tbsp = 3 tsp)
    const tbsp = q / 3;
    const tbspQ = Math.round(tbsp * 4) / 4;
    return `${prettyFraction(tbspQ)} tbsp`;
  }
  return `${prettyFraction(q)} tsp`;
};

// Turn a quarter-rounded decimal into "1½", "¼", "2¾" etc. using unicode fractions.
const prettyFraction = (n) => {
  const whole = Math.floor(n);
  const frac = n - whole;
  const fracStr = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  if (whole === 0 && fracStr) return fracStr;
  if (fracStr) return `${whole}${fracStr}`;
  return `${whole}`;
};

// The one-stop formatter that respects user weightUnit preference.
// Category is required because tsp conversion is density-aware.
const formatAmount = (g, category, weightUnit = "tsp") => {
  if (weightUnit === "g") {
    return `${g.toFixed(1)} g`;
  }
  return formatTsp(gramsToTsp(g, category));
};

/* ──────────────────────────────────────────────────────────────
   Seed data
   ────────────────────────────────────────────────────────────── */

const INGREDIENTS = {
  chamomile: {
    name: "Chamomile", latin: "Matricaria chamomilla", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["calming", 4], ["sleepy", 3], ["digestive", 3]],
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
    effects: [["calming", 4], ["sleepy", 2]],
    flavors: ["floral", "pine", "camphor"],
    pairs: ["chamomile", "rose", "lemonbalm", "passionflower"],
    dose: "½ tsp · 200ml",
    headsUp: null,
    blurb: "Use sparingly — culinary lavender is a strong voice in any blend, bright and slightly cooling.",
  },
  lemonbalm: {
    name: "Lemon Balm", latin: "Melissa officinalis", category: "herbal",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calming", 3], ["focus", 2], ["lifting", 3]],
    flavors: ["citrus", "mint", "grassy"],
    pairs: ["chamomile", "peppermint", "rose", "spearmint", "lemongrass", "tulsi"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "A lemony mint relative, historically called the 'gladdening herb'. Quiet lift without caffeine.",
  },
  peppermint: {
    name: "Peppermint", latin: "Mentha × piperita", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["focus", 3], ["digestive", 4], ["cooling", 4]],
    flavors: ["minty", "cool", "grassy"],
    pairs: ["lemonbalm", "ginger", "rooibos", "fennel", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "Can worsen acid reflux for some.",
    blurb: "Bracing and clean. A post-meal standard across many traditions.",
  },
  rooibos: {
    name: "Rooibos", latin: "Aspalathus linearis", category: "herbal",
    caffeine: 0, tempC: [100, 100], timeS: [300, 420],
    effects: [["comfort", 4], ["settling", 3]],
    flavors: ["honey", "woody", "vanilla"],
    pairs: ["cinnamon", "ginger", "vanilla", "cloves", "rose", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "South African red bush — naturally sweet, round, and forgiving to over-steep.",
  },
  sencha: {
    name: "Sencha Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 25, tempC: [70, 80], timeS: [60, 120],
    effects: [["focus", 4], ["energy", 3], ["clear", 4]],
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
    effects: [["energy", 2], ["cooling", 3], ["lifting", 3]],
    flavors: ["tart", "fruity", "cranberry"],
    pairs: ["rose", "rooibos", "ginger", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "May lower blood pressure — sip modestly if relevant.",
    blurb: "Ruby-red, tart, and refreshing. Tastes like the idea of cranberries.",
  },
  rose: {
    name: "Rose Petal", latin: "Rosa × damascena", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calming", 3], ["lifting", 3]],
    flavors: ["floral", "sweet", "fruity"],
    pairs: ["chamomile", "lavender", "hibiscus", "cardamom", "tulsi", "vanilla", "white", "oolong"],
    dose: "1 tsp · 200ml",
    headsUp: "Source food-grade petals — ornamental roses may carry pesticide residue.",
    blurb: "Subtle, powdery, and romantic. Lifts a blend into something hand-written.",
  },

  /* ── new: spices (warming, digestive, chai-adjacent) ────────────── */

  cinnamon: {
    name: "Cinnamon", latin: "Cinnamomum verum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["warming", 5], ["comfort", 3], ["digestive", 3]],
    flavors: ["spiced", "sweet", "woody", "warm"],
    pairs: ["assam", "rooibos", "ginger", "cardamom", "cloves", "vanilla"],
    dose: "½ stick or ½ tsp · 250ml",
    headsUp: "Cassia (most common) has higher coumarin — heavy daily use is cautioned. Ceylon (C. verum) is safer for frequent use.",
    blurb: "True Ceylon cinnamon is delicate and sweet; cassia is stronger and more common. Both warm a cup and lean it toward dessert.",
  },
  cardamom: {
    name: "Cardamom", latin: "Elettaria cardamomum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 480],
    effects: [["warming", 4], ["digestive", 3], ["lifting", 3]],
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
    effects: [["comfort", 4], ["settling", 3]],
    flavors: ["sweet", "creamy", "floral", "warm"],
    pairs: ["rooibos", "assam", "cinnamon", "cardamom", "rose"],
    dose: "½ bean split · 250ml",
    headsUp: null,
    blurb: "The dried seed pod of a climbing orchid. Rich, sweet, and creamy — lifts any blend toward dessert without actual sugar.",
  },

  /* ── new: herbals ──────────────────────────────────────────────── */

  spearmint: {
    name: "Spearmint", latin: "Mentha spicata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["digestive", 3], ["cooling", 3], ["lifting", 2]],
    flavors: ["minty", "sweet", "grassy", "cool"],
    pairs: ["lemonbalm", "sencha", "rose", "chamomile", "gunpowder"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Gentler than peppermint — sweeter, less camphor. A safer choice in delicate floral or green-tea blends.",
  },
  passionflower: {
    name: "Passionflower", latin: "Passiflora incarnata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["calming", 4], ["sleepy", 4], ["settling", 3]],
    flavors: ["grassy", "hay", "mild"],
    pairs: ["chamomile", "lemonbalm", "lavender"],
    dose: "1 tsp · 200ml",
    headsUp: "Sedative — avoid combining with other sedatives or alcohol, and don't drive after. Not for pregnancy.",
    blurb: "Mild and hay-like in flavor. Reliably drowsy — pair with stronger-tasting herbs to carry a blend.",
  },
  lemongrass: {
    name: "Lemongrass", latin: "Cymbopogon citratus", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["lifting", 3], ["cooling", 3], ["digestive", 2]],
    flavors: ["citrus", "grassy", "bright"],
    pairs: ["ginger", "peppermint", "lemonbalm", "rose", "rooibos", "hibiscus"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Long grassy stalks bringing a bright, clean lemon note without citrus acidity. A staple of Southeast Asian beverages.",
  },
  fennel: {
    name: "Fennel Seed", latin: "Foeniculum vulgare", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["digestive", 4], ["calming", 2]],
    flavors: ["licorice", "sweet", "aromatic"],
    pairs: ["peppermint", "ginger", "chamomile", "lemonbalm", "rooibos"],
    dose: "1 tsp crushed · 200ml",
    headsUp: "Heavy doses cautioned in pregnancy — verify.",
    blurb: "Bright anise-like seeds — a digestive classic across Mediterranean and Indian traditions. Often served after a heavy meal.",
  },

  /* ── new: flower ───────────────────────────────────────────────── */

  jasmine: {
    name: "Jasmine", latin: "Jasminum sambac", category: "flower",
    caffeine: 0, tempC: [75, 85], timeS: [120, 180],
    effects: [["calming", 3], ["lifting", 3]],
    flavors: ["floral", "sweet", "honeyed", "heady"],
    pairs: ["sencha", "white", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Small star-shaped flowers, traditionally layered at night with green or white tea to scent the leaves. Too-hot water kills the perfume.",
  },

  /* ── new: adaptogen ────────────────────────────────────────────── */

  tulsi: {
    name: "Tulsi", latin: "Ocimum tenuiflorum", category: "adaptogen",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["focus", 3], ["calming", 3], ["lifting", 3], ["settling", 3]],
    flavors: ["spiced", "clove", "peppery", "sweet"],
    pairs: ["rose", "cardamom", "lemonbalm", "ginger", "peppermint"],
    dose: "1 tsp · 200ml",
    headsUp: "May affect blood sugar and thyroid function — verify interactions if relevant.",
    blurb: "Holy basil — sacred in Ayurvedic tradition, where it's called the 'incomparable one.' Clove-like and peppery, with the characteristic adaptogenic quality of lifting both ends of the day.",
  },

  /* ── new: true teas ────────────────────────────────────────────── */

  white: {
    name: "White Tea", latin: "Camellia sinensis", category: "true tea", subcategory: "white",
    caffeine: 18, tempC: [75, 85], timeS: [180, 300],
    effects: [["calming", 3], ["lifting", 3], ["clear", 3]],
    flavors: ["sweet", "hay", "honey", "delicate", "melon"],
    pairs: ["jasmine", "rose"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The least-processed tea — freshly-plucked leaves allowed to wither. Delicate, naturally sweet, with honey and melon notes. Rewards patience and soft water.",
  },
  oolong: {
    name: "Oolong", latin: "Camellia sinensis", category: "true tea", subcategory: "oolong",
    caffeine: 37, tempC: [85, 95], timeS: [120, 240],
    effects: [["focus", 3], ["lifting", 3], ["warming", 2]],
    flavors: ["floral", "fruit", "toasted", "honey"],
    pairs: ["rose", "jasmine"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The middle path between green and black — partially oxidized, spectacularly varied by origin. Taiwanese high-mountain leans floral; Wuyi rock leans toasted and mineral.",
  },
  gyokuro: {
    name: "Gyokuro", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 45, tempC: [50, 60], timeS: [90, 120],
    effects: [["focus", 5], ["clear", 5], ["lifting", 3]],
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
    effects: [["warming", 3], ["settling", 3], ["comfort", 3]],
    flavors: ["roasted", "woody", "caramel", "nutty", "toasted"],
    pairs: ["rooibos", "ginger", "vanilla"],
    dose: "1 tbsp · 250ml",
    headsUp: null,
    blurb: "Japanese green tea roasted over charcoal until the leaves turn reddish-brown. The roasting strips most of the caffeine and brings up warm, toasty, caramel notes. An evening tea that isn't an herbal.",
  },
  dragonwell: {
    name: "Dragonwell", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 28, tempC: [75, 85], timeS: [90, 180],
    effects: [["focus", 4], ["lifting", 3], ["clear", 3]],
    flavors: ["nutty", "chestnut", "sweet", "vegetal", "bean"],
    pairs: ["rose", "jasmine"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Longjing — pan-fired Chinese green from Hangzhou's West Lake, hand-pressed flat against hot woks. Sweet, faintly chestnut-like, and among the most prized teas in China. A cup that rewards attention.",
  },
  darjeeling: {
    name: "Darjeeling", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 40, tempC: [85, 90], timeS: [180, 240],
    effects: [["energy", 3], ["lifting", 4], ["focus", 3]],
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
    effects: [["energy", 3], ["lifting", 3], ["warming", 3]],
    flavors: ["citrus", "bright", "brisk", "woody"],
    pairs: ["ginger", "lemongrass", "cinnamon", "cardamom", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Sri Lankan black tea — brisk and bright, with a characteristic citrus lift. The backbone of most breakfast blends and the base for most commercial Earl Grey. Forgiving of milk and sugar.",
  },
  lapsang: {
    name: "Lapsang Souchong", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 30, tempC: [95, 100], timeS: [180, 240],
    effects: [["warming", 4], ["settling", 2]],
    flavors: ["smoked", "pine", "tar", "campfire", "woody"],
    pairs: ["rooibos"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese black tea from Fujian, dried over pine fires. Famously smoky — campfire and tar on first sip. The tea you either love immediately or never drink again; in either case, unmistakable.",
  },
  puerh: {
    name: "Shou Pu-erh", latin: "Camellia sinensis", category: "true tea", subcategory: "pu-erh",
    caffeine: 35, tempC: [95, 100], timeS: [60, 180],
    effects: [["warming", 4], ["settling", 3], ["digestive", 3]],
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

const BLENDS = [
  {
    id: "dusk",
    name: "Dusk Lullaby",
    subtitle: "for wound evenings",
    ingredients: [
      { id: "chamomile", g: 2.0 },
      { id: "lavender", g: 0.3 },
      { id: "lemonbalm", g: 1.0 },
    ],
    tempC: 95, timeS: 360, ml: 250,
    mood: "calm", flavor: "floral",
    public: false,
    effects: [["calming", 4], ["sleepy", 3]],
  },
  {
    id: "morning",
    name: "Morning Vestment",
    subtitle: "a quiet start with teeth",
    ingredients: [
      { id: "assam", g: 2.0 },
      { id: "ginger", g: 0.5 },
    ],
    tempC: 95, timeS: 240, ml: 250,
    mood: "energy", flavor: "spiced",
    public: true,
    effects: [["energy", 4], ["warming", 4]],
  },
  {
    id: "hearth",
    name: "Hearth & Quiet",
    subtitle: "rainy-afternoon default",
    ingredients: [
      { id: "rooibos", g: 2.0 },
      { id: "rose", g: 0.5 },
    ],
    tempC: 100, timeS: 360, ml: 250,
    mood: "comfort", flavor: "sweet",
    public: false,
    effects: [["comfort", 4], ["calming", 2]],
  },
  {
    id: "study",
    name: "Scriptorium",
    subtitle: "for the hour before dinner",
    ingredients: [
      { id: "sencha", g: 1.5 },
      { id: "peppermint", g: 0.5 },
    ],
    tempC: 75, timeS: 90, ml: 200,
    mood: "focus", flavor: "minty",
    public: true,
    effects: [["focus", 4], ["clear", 3]],
  },
  {
    id: "moroccan",
    name: "Moroccan Mint",
    subtitle: "traditional · gunpowder, mint, sugar",
    ingredients: [
      { id: "gunpowder", g: 1.5 },
      { id: "spearmint", g: 1.0 },
    ],
    tempC: 90, timeS: 180, ml: 200,
    mood: "focus", flavor: "minty",
    public: true,
    tradition: "Maghrebi",
    effects: [["focus", 3], ["cooling", 3], ["lifting", 3]],
  },
  {
    id: "darj-neat",
    name: "Darjeeling, neat",
    subtitle: "first flush · as it wants to be",
    ingredients: [
      { id: "darjeeling", g: 2.5 },
    ],
    tempC: 85, timeS: 180, ml: 200,
    mood: "focus", flavor: "floral",
    public: true,
    tradition: "Indian / Himalayan",
    effects: [["focus", 3], ["lifting", 3]],
  },
  {
    id: "chai",
    name: "Masala Chai",
    subtitle: "traditional · the morning's full house",
    ingredients: [
      { id: "assam", g: 2.0 },
      { id: "ginger", g: 0.3 },
      { id: "cardamom", g: 0.3 },
      { id: "cinnamon", g: 0.3 },
      { id: "cloves", g: 0.1 },
    ],
    tempC: 100, timeS: 300, ml: 250,
    mood: "energy", flavor: "spiced",
    public: true,
    tradition: "South Asian",
    effects: [["energy", 4], ["warming", 5]],
  },
  {
    id: "sencha-properly",
    name: "Sencha, properly",
    subtitle: "a short steep · the Japanese way",
    ingredients: [
      { id: "sencha", g: 3.0 },
    ],
    tempC: 75, timeS: 60, ml: 180,
    mood: "focus", flavor: "grassy",
    public: true,
    tradition: "Japanese",
    effects: [["focus", 4], ["lifting", 3]],
  },
];

// Seed modes drive the whole-app state for testing. Real app has a single
// source of truth (the backing store); this swaps between three realistic
// snapshots so UX can be evaluated at different stages of use.
const SEED_MODES = {
  power: {
    label: "power user",
    description: "established journal — several weeks in",
    sessions: [
      // Your cups, most recent first
      { id: "y1", who: "you", blendId: "dusk",    ago: "2h",    intent: "wound up",   actual: "calm",    taste: 4, note: "Honeyed. Slept within 40 min." },
      { id: "y2", who: "you", blendId: "hearth",  ago: "yest.", intent: "rained-on",  actual: "settled", taste: 4, note: "" },
      { id: "y3", who: "you", blendId: "morning", ago: "2d",    intent: "slow",       actual: "energy",  taste: 5, note: "" },
      { id: "y4", who: "you", blendId: "study",   ago: "3d",    intent: "scattered",  actual: "focused", taste: 4, note: "Good clarity." },
      { id: "y5", who: "you", blendId: "dusk",    ago: "4d",    intent: "keyed up",   actual: "calm",    taste: 5, note: "" },
      { id: "y6", who: "you", blendId: "morning", ago: "5d",    intent: "flat",       actual: "energy",  taste: 3, note: "Under-steeped." },
      { id: "y7", who: "you", blendId: "hearth",  ago: "6d",    intent: "cold",       actual: "warm",    taste: 4, note: "" },
      { id: "y8", who: "you", blendId: "dusk",    ago: "1w",    intent: "wired",      actual: "calm",    taste: 4, note: "" },
      { id: "y9", who: "you", blendId: "moroccan", ago: "1w",   intent: "thirsty",    actual: "refreshed", taste: 5, note: "Three rounds." },
    ],
    savedBlendIds: ["dusk", "morning", "hearth", "study"],
    pantryIds: [
      "chamomile", "lavender", "lemonbalm", "peppermint", "rooibos",
      "sencha", "assam", "ginger", "hibiscus", "rose",
      "cinnamon", "cardamom", "vanilla", "spearmint", "jasmine",
    ],
  },

  mid: {
    label: "mid journey",
    description: "a couple weeks in — a handful of cups and one saved blend",
    sessions: [
      { id: "my1", who: "you", blendId: "dusk",   ago: "3h",    intent: "wound up", actual: "calm",    taste: 4, note: "Honeyed." },
      { id: "my2", who: "you", blendId: "dusk",   ago: "yest.", intent: "keyed up", actual: "settled", taste: 5, note: "" },
      { id: "my3", who: "you", blendId: "hearth", ago: "3d",    intent: "cold",     actual: "warm",    taste: 3, note: "" },
    ],
    savedBlendIds: ["dusk"],
    pantryIds: ["chamomile", "lemonbalm", "lavender", "peppermint", "rooibos", "ginger", "rose"],
  },

  new: {
    label: "new user",
    description: "just opened the app — nothing on any shelf",
    sessions: [],
    savedBlendIds: [],
    pantryIds: [],
  },
};

// Alias kept during transition; no active consumers.
const SESSIONS = SEED_MODES.power.sessions;

const MOODS  = ["calm", "focus", "energy", "sleepy", "comfort", "settle"];
const FLAVORS= ["floral", "earthy", "citrus", "spiced", "minty", "fruity", "sweet"];

/* ──────────────────────────────────────────────────────────────
   "While you wait" content — facts, traditions, and poems that
   cycle through the Steep screen during a brew. Facts and traditions
   are keyed to ingredient ids. Poems are tagged with any combination
   of ingredient names, moods, and themes for flexible matching.

   NOTE: Facts marked PLACEHOLDER are sketches to demonstrate the
   mechanism — they should be replaced with properly-sourced content
   during the ingredient research pass. Poems are genuine public-domain
   works (Bashō, Buson, Issa, Rumi — all pre-1930, out of copyright).
   ────────────────────────────────────────────────────────────── */

const WAIT_FACTS = {
  chamomile: [
    { type: "fact",      text: "Chamomile's calming compound, apigenin, releases most in the final two minutes. The last minutes of the steep are where most of it arrives." },
    { type: "tradition", text: "In parts of Eastern Europe, chamomile was strewn across floors before gatherings — walking on it released the scent, perfuming the room." },
    { type: "fact",      text: "PLACEHOLDER · Chamomile has been cultivated for at least 2,000 years, with records of its use in ancient Egyptian temple rituals." },
  ],
  lavender: [
    { type: "fact",      text: "The word lavender comes from the Latin lavare — to wash. Romans added it to bathwater." },
    { type: "fact",      text: "PLACEHOLDER · Lavender's essential oil contains linalool, a compound studies have linked to reduced cortisol levels." },
    { type: "tradition", text: "PLACEHOLDER · In Provence, lavender harvest begins at dawn, when the oils are most concentrated and the heat hasn't yet driven them off." },
  ],
  lemonbalm: [
    { type: "fact",      text: "Lemon balm (Melissa officinalis) takes its botanical name from the Greek melissa — honeybee. Bees are drawn to it reliably." },
    { type: "tradition", text: "PLACEHOLDER · Medieval monks brewed lemon balm for what they called 'gladness of spirit' — an early recognition of its mild mood-lifting effect." },
  ],
  peppermint: [
    { type: "fact",      text: "Peppermint is a natural hybrid of spearmint and water mint. Most of what sells as 'mint' in tea is actually peppermint." },
    { type: "fact",      text: "PLACEHOLDER · Menthol, peppermint's cooling compound, triggers the same cold-receptors that respond to actual cold — your mouth 'feels' the chill that isn't there." },
  ],
  spearmint: [
    { type: "tradition", text: "Moroccan tea service traditionally uses three pours: the first bitter as life, the second sweet as love, the third gentle as death." },
    { type: "fact",      text: "PLACEHOLDER · Spearmint has less menthol than peppermint — which is why it reads 'softer' and pairs better with green tea." },
  ],
  rooibos: [
    { type: "fact",      text: "PLACEHOLDER · Rooibos grows only in the Cederberg region of South Africa. Attempts to cultivate it elsewhere have largely failed." },
    { type: "tradition", text: "PLACEHOLDER · The Khoi people of the Cederberg have used rooibos for centuries; it entered European consciousness only in the early 1900s." },
  ],
  sencha: [
    { type: "fact",      text: "PLACEHOLDER · Sencha is made by steaming fresh tea leaves within hours of harvest — a Japanese innovation that preserves grassy green notes Chinese methods don't." },
    { type: "tradition", text: "PLACEHOLDER · Japanese tea masters consider the first pour of sencha almost ceremonial — water at the wrong temperature can ruin months of the farmer's work." },
  ],
  assam: [
    { type: "fact",      text: "PLACEHOLDER · Assam was discovered growing wild by British botanists in 1823, disproving the assumption that tea was exclusively Chinese." },
  ],
  darjeeling: [
    { type: "fact",      text: "PLACEHOLDER · Darjeeling's character comes from elevation — gardens sit at 600-2000m in the Himalayan foothills, producing slow-growing, intensely flavored leaves." },
    { type: "tradition", text: "PLACEHOLDER · The 'first flush' — leaves picked in spring after dormancy — is considered Darjeeling's finest, sometimes called the 'champagne of teas.'" },
  ],
  ginger: [
    { type: "fact",      text: "PLACEHOLDER · Ginger's heat comes from gingerol, which converts to shogaol when heated — shogaol is nearly twice as pungent." },
    { type: "tradition", text: "PLACEHOLDER · In Ayurvedic tradition, ginger is considered a universal medicine — warming to the digestive fire and circulation both." },
  ],
  hibiscus: [
    { type: "fact",      text: "PLACEHOLDER · Hibiscus's ruby color comes from anthocyanins, the same family of pigments that make blueberries blue and red cabbage red." },
    { type: "tradition", text: "PLACEHOLDER · Known as karkadé in Egypt and agua de jamaica in Mexico, hibiscus tea has traveled widely with different names and almost identical preparations." },
  ],
  rose: [
    { type: "fact",      text: "PLACEHOLDER · Rose petals used in tea are typically Rosa × damascena, cultivated for oil and aroma rather than for the rose gardens most people imagine." },
  ],
  cinnamon: [
    { type: "fact",      text: "PLACEHOLDER · What most Western markets sell as 'cinnamon' is usually cassia — a close relative. True cinnamon (Ceylon) is lighter in color and more delicate in flavor." },
  ],
  cardamom: [
    { type: "fact",      text: "PLACEHOLDER · Green cardamom pods keep their aromatic oils far longer than the seeds alone. Opening a pod releases the scent, but cracks the preservation." },
  ],
  ashwagandha: [
    { type: "fact",      text: "PLACEHOLDER · Ashwagandha's Sanskrit name means 'smell of horse' — referring both to the root's earthy scent and, traditionally, the strength it was said to convey." },
  ],
};

// Public-domain poems and fragments. Tags drive which brews they surface in.
// Classical Japanese haiku and Rumi are both safely out of copyright.
const WAIT_POEMS = [
  {
    text: "An autumn evening:\nmy shadow goes\nto drink tea.",
    attribution: "— Issa (1800s)",
    tags: ["evening", "autumn", "solitude", "calm", "sleepy", "comfort"],
  },
  {
    text: "First autumn morning:\nthe mirror I stare into\nshows my father's face.",
    attribution: "— Murakami Kijō",
    tags: ["morning", "autumn", "reflection", "focus"],
  },
  {
    text: "The old pond —\na frog leaps in,\nsound of the water.",
    attribution: "— Bashō (1686)",
    tags: ["stillness", "calm", "settle", "focus"],
  },
  {
    text: "Over the wintry\nforest, winds howl in rage\nwith no leaves to blow.",
    attribution: "— Sōseki",
    tags: ["winter", "storm", "solitude"],
  },
  {
    text: "Light of the moon\nmoves west — flowers' shadows\ncreep eastward.",
    attribution: "— Buson (1700s)",
    tags: ["night", "moon", "sleepy", "calm", "lavender", "rose", "chamomile"],
  },
  {
    text: "On a withered branch\na crow has alighted —\nnightfall in autumn.",
    attribution: "— Bashō",
    tags: ["autumn", "evening", "settle", "solitude"],
  },
  {
    text: "From time to time\nthe clouds give rest\nto the moon-beholders.",
    attribution: "— Bashō",
    tags: ["moon", "calm", "sleepy", "night", "stillness"],
  },
  {
    text: "A caterpillar,\nthis deep in fall —\nstill not a butterfly.",
    attribution: "— Bashō",
    tags: ["patience", "autumn", "comfort", "settle"],
  },
  {
    text: "The wild geese take flight\nlow along the railroad tracks\nin the moonlit night.",
    attribution: "— Shiki",
    tags: ["night", "moon", "travel", "focus"],
  },
  {
    text: "Just enough of rain\nto bring the moss a richer green —\na spring afternoon.",
    attribution: "— Boncho",
    tags: ["spring", "rain", "calm", "green", "sencha"],
  },
  {
    text: "The breeze of dawn has secrets to tell you.\nDon't go back to sleep.",
    attribution: "— Rumi",
    tags: ["morning", "energy", "focus"],
  },
  {
    text: "Silence is the language of God.\nAll else is poor translation.",
    attribution: "— Rumi",
    tags: ["stillness", "calm", "settle", "reflection"],
  },
  {
    text: "Be melting snow.\nWash yourself of yourself.",
    attribution: "— Rumi",
    tags: ["calm", "stillness", "winter", "reflection"],
  },

  // — English-language public domain (all pre-1930, safely out of copyright) —

  {
    text: "To make a prairie it takes a clover and one bee,\nOne clover, and a bee,\nAnd revery.\nThe revery alone will do,\nIf bees are few.",
    attribution: "— Emily Dickinson",
    tags: ["reflection", "calm", "settle", "solitude", "summer", "chamomile", "rose"],
  },
  {
    text: "I'll tell you how the sun rose, —\nA ribbon at a time.",
    attribution: "— Emily Dickinson",
    tags: ["morning", "energy", "focus", "sencha", "assam"],
  },
  {
    text: "The soul selects her own society,\nThen shuts the door;\nOn her divine majority\nObtrude no more.",
    attribution: "— Emily Dickinson",
    tags: ["solitude", "settle", "stillness", "focus", "reflection"],
  },
  {
    text: "Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all.",
    attribution: "— Emily Dickinson",
    tags: ["comfort", "hope", "calm", "settle"],
  },
  {
    text: "A light exists in spring\nNot present on the year\nAt any other period.\nWhen March is scarcely here",
    attribution: "— Emily Dickinson",
    tags: ["spring", "morning", "energy", "green", "sencha"],
  },

  {
    text: "Remember me when I am gone away,\nGone far away into the silent land;\nWhen you can no more hold me by the hand,\nNor I half turn to go, yet turning stay.",
    attribution: "— Christina Rossetti",
    tags: ["reflection", "evening", "settle", "solitude"],
  },
  {
    text: "Silent noon: the fields are fair —\nNoontide's silent everywhere.",
    attribution: "— Christina Rossetti",
    tags: ["stillness", "summer", "calm", "noon"],
  },
  {
    text: "What are heavy? sea-sand and sorrow:\nWhat are brief? today and tomorrow:\nWhat are frail? spring blossoms and youth:\nWhat are deep? the ocean and truth.",
    attribution: "— Christina Rossetti",
    tags: ["reflection", "comfort", "settle"],
  },

  {
    text: "To see a World in a Grain of Sand,\nAnd a Heaven in a Wild Flower,\nHold Infinity in the palm of your hand,\nAnd Eternity in an hour.",
    attribution: "— William Blake",
    tags: ["reflection", "stillness", "focus", "flower", "chamomile", "rose", "lavender"],
  },
  {
    text: "He who binds to himself a joy\nDoes the winged life destroy;\nHe who kisses the joy as it flies\nLives in eternity's sunrise.",
    attribution: "— William Blake",
    tags: ["morning", "reflection", "calm", "comfort"],
  },

  {
    text: "I wandered lonely as a cloud\nThat floats on high o'er vales and hills,\nWhen all at once I saw a crowd,\nA host, of golden daffodils.",
    attribution: "— William Wordsworth",
    tags: ["solitude", "spring", "reflection", "calm", "flower"],
  },

  {
    text: "When I heard the learn'd astronomer,\nHow soon unaccountable I became tired and sick,\nTill rising and gliding out I wander'd off by myself,\nIn the mystical moist night-air, and from time to time,\nLook'd up in perfect silence at the stars.",
    attribution: "— Walt Whitman",
    tags: ["night", "solitude", "settle", "reflection", "stillness"],
  },

  {
    text: "The world is too much with us; late and soon,\nGetting and spending, we lay waste our powers;\nLittle we see in Nature that is ours;\nWe have given our hearts away, a sordid boon!",
    attribution: "— William Wordsworth",
    tags: ["reflection", "settle", "calm"],
  },

  {
    text: "The rain is falling all around,\nIt falls on field and tree,\nIt rains on the umbrellas here,\nAnd on the ships at sea.",
    attribution: "— Robert Louis Stevenson",
    tags: ["rain", "comfort", "calm", "settle"],
  },
  {
    text: "The world is so full of a number of things,\nI'm sure we should all be as happy as kings.",
    attribution: "— Robert Louis Stevenson",
    tags: ["comfort", "energy", "morning"],
  },

  {
    text: "Tea! thou soft, thou sober, sage, and venerable liquid —\nthou female tongue-running, smile-smoothing, heart-opening, wink-tipping cordial!",
    attribution: "— Colley Cibber (1720)",
    tags: ["comfort", "calm", "tea", "sencha", "assam", "darjeeling"],
  },

  // — Limericks: public domain (Edward Lear, traditional, anonymous) —

  {
    text: "There was an Old Person of Ware,\nWho rode on the back of a bear;\n  When they asked, \"Does it trot?\"\n  He said, \"Certainly not!\n— He's a Moppsikon-Floppsikon bear!\"",
    attribution: "— Edward Lear",
    tags: ["comfort", "whimsy", "energy"],
  },
  {
    text: "There was an Old Man with a beard,\nWho said, \"It is just as I feared! —\n  Two Owls and a Hen,\n  Four Larks and a Wren,\nHave all built their nests in my beard!\"",
    attribution: "— Edward Lear",
    tags: ["whimsy", "comfort", "energy", "morning"],
  },
  {
    text: "There was a young lady of Niger\nWho smiled as she rode on a tiger;\n  They came back from the ride\n  With the lady inside,\nAnd the smile on the face of the tiger.",
    attribution: "— Anonymous (traditional)",
    tags: ["whimsy", "energy", "focus"],
  },
  {
    text: "A flea and a fly in a flue\nWere imprisoned, so what could they do?\n  Said the fly, \"Let us flee!\"\n  \"Let us fly!\" said the flea.\nSo they flew through a flaw in the flue.",
    attribution: "— Anonymous (traditional)",
    tags: ["whimsy", "focus", "energy"],
  },
  {
    text: "There once was a man from Peru\nWho dreamed he was eating his shoe.\n  He awoke in the night\n  With a terrible fright\nAnd found that his dream had come true!",
    attribution: "— Anonymous (traditional)",
    tags: ["whimsy", "sleepy", "comfort"],
  },
  {
    text: "A kettle that lived in Lahore\nWould whistle and pace on the floor;\n  It ran through the house\n  And frightened the mouse,\nAnd the tea was forever no more.",
    attribution: "— Anonymous (app-original, in the traditional style)",
    tags: ["whimsy", "comfort", "kettle", "tea"],
  },
];

// Build the content pool for a given blend. Pulls ingredient-specific facts
// from WAIT_FACTS, matching poems from WAIT_POEMS, and interleaves them.
function buildWaitCards(blend, targetMoods) {
  const ingredientIds = (blend?.ingredients || []).map(i =>
    typeof i === "string" ? i : i.id
  );
  const moods = targetMoods || [];

  // 1. Gather ingredient-specific facts/traditions. These are the backbone
  //    of the pool — the app's identity is about what's in your cup.
  const facts = [];
  ingredientIds.forEach(id => {
    const entries = WAIT_FACTS[id];
    if (entries) entries.forEach(f => facts.push({ ...f, ingredientId: id }));
  });

  // 2. Gather matching poems. Filtered to those whose tags intersect with
  //    the brew's ingredients or moods.
  const matchPool = new Set([...ingredientIds, ...moods]);
  const poems = WAIT_POEMS
    .filter(p => p.tags.some(t => matchPool.has(t)))
    .map(p => ({ type: "poem", text: p.text, attribution: p.attribution }));

  // 3. Rotate each list by a time-based seed so a given brew doesn't always
  //    start with the same content. Rotation, not shuffle — cards should
  //    still feel curated, not random.
  const rotate = (arr) => {
    if (arr.length < 2) return arr;
    const n = Date.now() % arr.length;
    return [...arr.slice(n), ...arr.slice(0, n)];
  };
  const rotatedFacts = rotate(facts);
  const rotatedPoems = rotate(poems);

  // 4. Cap poems at ~1 per 5 facts, minimum 1 if any match, maximum 4.
  //    This keeps the pool fact-dominant — the app is about ingredients,
  //    poems are punctuation, not half the content.
  const poemCap = Math.min(4, Math.max(rotatedPoems.length > 0 ? 1 : 0, Math.floor(rotatedFacts.length / 5)));
  const selectedPoems = rotatedPoems.slice(0, poemCap);

  // 5. Interleave: place poems at roughly-even intervals through the facts,
  //    never as the first card (open with ingredient grounding) and never
  //    as the last (close with the cup, not literature).
  if (rotatedFacts.length === 0) {
    // Edge case: no facts (shouldn't happen if ingredients are in corpus).
    // Fall back to a universal poem so the user sees *something*.
    return selectedPoems.length > 0 ? selectedPoems : [{
      type: "poem",
      text: "The old pond —\na frog leaps in,\nsound of the water.",
      attribution: "— Bashō",
    }];
  }

  const cards = [...rotatedFacts];
  if (selectedPoems.length > 0 && cards.length >= 3) {
    // Valid insertion range: positions 1 through length-1 (exclusive of first
    // and last). Spread poems evenly through that range.
    const insertRange = cards.length - 1;
    selectedPoems.forEach((poem, i) => {
      // Evenly distributed positions within the valid range
      const pos = 1 + Math.floor((i + 1) * insertRange / (selectedPoems.length + 1));
      cards.splice(pos + i, 0, poem); // +i accounts for prior insertions
    });
  }

  return cards;
}

/* ──────────────────────────────────────────────────────────────
   Tiny botanical line-art SVGs
   ────────────────────────────────────────────────────────────── */

const Sprig = ({ size = 20, c = theme.sage }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22 V4" />
    <path d="M12 9 C8 9 6 6 6 5" />
    <path d="M12 13 C8.5 13 7 11 7 10" />
    <path d="M12 17 C9 17 7.5 15 7.5 14" />
    <path d="M12 8 C15.5 8 17.5 6 18 5" />
    <path d="M12 12 C16 12 18 10 18 9" />
    <path d="M12 16 C15.5 16 17 14 17 13" />
  </svg>
);

const Flower = ({ size = 22, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 3 V7" />
    <path d="M12 17 V21" />
    <path d="M3 12 H7" />
    <path d="M17 12 H21" />
    <path d="M5.5 5.5 L8.3 8.3" />
    <path d="M15.7 15.7 L18.5 18.5" />
    <path d="M5.5 18.5 L8.3 15.7" />
    <path d="M15.7 8.3 L18.5 5.5" />
  </svg>
);

const Leaf = ({ size = 20, c = theme.sageDeep }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20 C4 10 10 4 20 4 C20 14 14 20 4 20 Z" />
    <path d="M4 20 L20 4" />
  </svg>
);

const Kettle = ({ size = 22, c = theme.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11 H19 L18 19 C17.8 20 17 20.5 16 20.5 H8 C7 20.5 6.2 20 6 19 Z" />
    <path d="M9 11 C9 8 10.5 6.5 12 6.5 C13.5 6.5 15 8 15 11" />
    <path d="M19 13 L22 11 L22 15 Z" />
    <path d="M11 4 Q11 2 13 2" />
    <path d="M4 20 L20 20" />
  </svg>
);

const Ornament = ({ w = 120, c = theme.rule }) => (
  <svg width={w} height="12" viewBox="0 0 120 12" fill="none" stroke={c} strokeWidth="0.8" strokeLinecap="round">
    <path d="M0 6 H44" />
    <path d="M76 6 H120" />
    <circle cx="60" cy="6" r="2.2" fill={c} stroke="none" />
    <path d="M50 6 Q55 2 60 6 Q65 10 70 6" />
  </svg>
);

/* ──────────────────────────────────────────────────────────────
   Small primitives
   ────────────────────────────────────────────────────────────── */

// Section eyebrow — small uppercase label above each block of content.
// The `n` prop used to render roman numerals + a short rule; it's still
// accepted for backward compatibility with existing call sites, but now
// ignored. The label alone (slightly bolder) carries the hierarchy.
const SectionLabel = ({ n, children, color = theme.ash }) => (
  <div style={{
    fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
    textTransform: "uppercase", color, fontWeight: 600,
  }}>
    {children}
  </div>
);

// FitText — renders children in one line; if the line overflows its container,
// the text scales down (via transform) until it fits. Keeps the font crisp
// (integer sizes would cause visible steps) and never reflows the layout.
// Pass `style` for the text's intrinsic styling (fontFamily, fontSize, etc.)
// and `minScale` if you want a floor below which it should stop shrinking.
const FitText = ({ children, style, minScale = 0.55 }) => {
  const outerRef = React.useRef(null);
  const innerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const fit = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      // Reset to 1 before measuring so we read natural width.
      inner.style.transform = "scale(1)";
      const outerW = outer.clientWidth;
      const innerW = inner.scrollWidth;
      if (outerW === 0 || innerW === 0) return;
      const next = innerW > outerW ? Math.max(minScale, outerW / innerW) : 1;
      setScale(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [children, minScale]);

  return (
    <div
      ref={outerRef}
      style={{ width: "100%", overflow: "hidden" }}
    >
      <div
        ref={innerRef}
        style={{
          ...style,
          whiteSpace: "nowrap",
          transform: `scale(${scale})`,
          transformOrigin: "left center",
          display: "inline-block",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children, tone = "default", caution = false }) => {
  const toneMap = {
    default:  { bg: active ? theme.ink : "transparent",     fg: active ? theme.cream : theme.inkSoft, bd: active ? theme.ink : theme.rule },
    sage:     { bg: active ? theme.sageDeep : "transparent", fg: active ? theme.cream : theme.sageDeep, bd: active ? theme.sageDeep : theme.rule },
    terra:    { bg: active ? theme.terra : "transparent",    fg: active ? theme.cream : theme.terra,   bd: active ? theme.terra : theme.rule },
  }[tone];

  // Caution overrides only when not active — selected chips keep their full tone.
  // Dashed amber border + muted text is the "this would create tension" signal.
  const isCaution = caution && !active;

  return (
    <button onClick={onClick} style={{
      fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.02em",
      padding: "6px 12px", borderRadius: 999,
      border: isCaution ? `1px dashed ${theme.terra}` : `1px solid ${toneMap.bd}`,
      background: toneMap.bg,
      color: isCaution ? theme.terra : toneMap.fg,
      opacity: isCaution ? 0.7 : 1,
      cursor: "pointer",
      transition: "all .15s ease", whiteSpace: "nowrap",
    }}>{children}</button>
  );
};

const Rule = ({ dashed, soft }) => (
  <div style={{
    height: 1, width: "100%",
    background: dashed ? "transparent" : (soft ? theme.ruleSoft : theme.rule),
    borderTop: dashed ? `1px dashed ${theme.rule}` : "none",
  }} />
);

const EffectBar = ({ label, value, color = theme.sage }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: ff.sans }}>
    <div style={{ fontSize: 11.5, color: theme.inkSoft, width: 72, letterSpacing: "0.04em" }}>{label}</div>
    <div style={{ display: "flex", gap: 3, flex: 1 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          flex: 1, height: 5, borderRadius: 2,
          background: i <= value ? color : theme.ruleSoft,
        }} />
      ))}
    </div>
    <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink, width: 22, textAlign: "right" }}>{value}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Blend helpers
   ────────────────────────────────────────────────────────────── */

// LOCAL_BLENDS: mock-only in-memory store for blends that didn't exist
// at boot — e.g. a user's newly-posted blend. Real app would persist these
// to the backing store instead. Lives at module scope so getBlend() can
// find them regardless of which component is looking.
const LOCAL_BLENDS = {};

const getBlend = (id) => LOCAL_BLENDS[id] || BLENDS.find(b => b.id === id);
const mmss = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

/* ──────────────────────────────────────────────────────────────
   Screen: HOME
   ────────────────────────────────────────────────────────────── */

const TempToggle = () => {
  const { unit, setUnit } = useUnit();
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: `1px solid ${theme.rule}`, borderRadius: 999,
      padding: 2, background: theme.cream,
    }}>
      {["C", "F"].map(u => (
        <button key={u} onClick={() => setUnit(u)} style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.08em",
          padding: "3px 9px", borderRadius: 999, border: "none",
          background: unit === u ? theme.ink : "transparent",
          color: unit === u ? theme.cream : theme.ash,
          cursor: "pointer",
        }}>°{u}</button>
      ))}
    </div>
  );
};

const WeightToggle = () => {
  const { weightUnit, setWeightUnit } = useUnit();
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: `1px solid ${theme.rule}`, borderRadius: 999,
      padding: 2, background: theme.cream,
    }}>
      {["tsp", "g"].map(u => (
        <button key={u} onClick={() => setWeightUnit(u)} style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.08em",
          padding: "3px 9px", borderRadius: 999, border: "none",
          background: weightUnit === u ? theme.ink : "transparent",
          color: weightUnit === u ? theme.cream : theme.ash,
          cursor: "pointer",
        }}>{u}</button>
      ))}
    </div>
  );
};

const HomeScreen = ({ go, openBlend, openInCompose, sessions, savedBlendIds }) => {
  const yourSessions = sessions.filter(s => s.who === "you");
  const favoriteBlends = BLENDS.filter(b => savedBlendIds.has(b.id));
  const isEmpty = yourSessions.length === 0 && favoriteBlends.length === 0;

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash }}>
            {isEmpty ? "a fresh start" : "Tuesday evening"}
          </div>
          <FitText style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, lineHeight: 1.05, marginTop: 2 }}>
            {isEmpty
              ? <>Welcome, <em style={{ color: theme.terra }}>Tommy</em>.</>
              : <>What's the tea, <em style={{ color: theme.terra }}>Tommy</em>?</>
            }
          </FitText>
        </div>
        <Flower size={24} c={theme.ochre} />
      </div>

      {/* CTA */}
      <button onClick={() => go("compose")} style={{
        width: "100%", textAlign: "left",
        background: theme.ink, color: theme.cream,
        border: "none", borderRadius: 14, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", marginBottom: 24,
        boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
      }}>
        <div>
          {isEmpty && (
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, opacity: 0.7 }}>
              to begin your journal
            </div>
          )}
          <div style={{ fontFamily: ff.serif, fontSize: 20 }}>
            {isEmpty ? "Brew your first cup →" : "Brew a cup →"}
          </div>
        </div>
        <Kettle size={24} c={theme.cream} />
      </button>

      {/* New-user onboarding card */}
      {isEmpty && (
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          marginBottom: 22, textAlign: "center",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Ornament w={120} c={theme.ochre} />
          </div>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: theme.ash,
            marginBottom: 6,
          }}>
            your journal begins here
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 14.5,
            color: theme.inkSoft, lineHeight: 1.55,
          }}>
            Set a cup out. Brew it with intent. Log how it landed.<br />
            The app learns you cup by cup.
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <Ornament w={120} c={theme.ochre} />
          </div>
        </div>
      )}

      {/* Favorites — horizontal scrollable row */}
      {favoriteBlends.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <SectionLabel n="i">Favorites</SectionLabel>
            <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash }}>
              {favoriteBlends.length} saved
            </span>
          </div>
          <div style={{
            display: "flex", gap: 10, overflowX: "auto", marginBottom: 22,
            paddingBottom: 4, marginLeft: -2, paddingLeft: 2,
          }}>
            {favoriteBlends.map(b => (
              <FavoriteCard key={b.id} b={b} onTap={() => openInCompose(b.id)} />
            ))}
          </div>
        </>
      )}

      {/* Your recent cups */}
      {yourSessions.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <SectionLabel n={favoriteBlends.length > 0 ? "ii" : "i"}>Recent brews</SectionLabel>
            <button onClick={() => go("library")} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
              cursor: "pointer",
            }}>see all →</button>
          </div>
          <div>
            {yourSessions.slice(0, 5).map((s, i) => (
              <CompactSessionRow key={s.id} s={s} openBlend={openBlend} first={i === 0} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Favorite cards — compact snapshots of saved blends in the Home's favorites row.
// One tap opens Compose with the blend pre-selected so intent capture happens.
const FavoriteCard = ({ b, onTap }) => {
  const { unit, weightUnit } = useUnit();
  return (
    <button onClick={onTap} style={{
      flex: "0 0 auto", width: 150,
      textAlign: "left",
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 10, padding: "10px 12px", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {b.mood === "calm"    && <Flower size={16} c={theme.plum} />}
        {b.mood === "energy"  && <Leaf   size={16} c={theme.sageDeep} />}
        {b.mood === "comfort" && <Sprig  size={16} c={theme.ochre} />}
        {b.mood === "focus"   && <Leaf   size={16} c={theme.sage} />}
        {b.mood === "sleepy"  && <Flower size={16} c={theme.plum} />}
        {b.mood === "settle"  && <Sprig  size={16} c={theme.sage} />}
        <span style={{
          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
          color: theme.ash,
        }}>{b.mood}</span>
      </div>
      <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, lineHeight: 1.15 }}>
        {b.name}
      </div>
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, lineHeight: 1.3 }}>
        {b.subtitle}
      </div>
      <div style={{ fontFamily: ff.mono, fontSize: 10, color: theme.inkSoft, marginTop: 2 }}>
        {formatTempShort(b.tempC, b.tempC, unit)} · {mmss(b.timeS)}
      </div>
    </button>
  );
};

const CompactSessionRow = ({ s, openBlend, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  return (
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "10px 2px", cursor: "pointer",
      display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <span style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {b.name}
        </span>
        <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, whiteSpace: "nowrap" }}>
          {s.intent} → {s.actual}
        </span>
      </div>
      <span style={{ fontSize: 11, color: theme.terra, letterSpacing: "0.1em" }}>
        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
      </span>
      <span style={{ fontSize: 10.5, color: theme.ash, letterSpacing: "0.08em" }}>{s.ago}</span>
    </button>
  );
};

// Legacy SessionRow — still used in Library history tab.
const SessionRow = ({ s, openBlend, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  return (
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "14px 2px", cursor: "pointer",
      display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 12, alignItems: "start",
    }}>
      <div style={{ marginTop: 2 }}>
        {b.mood === "calm"    && <Flower size={22} c={theme.plum} />}
        {b.mood === "energy"  && <Leaf   size={22} c={theme.sageDeep} />}
        {b.mood === "comfort" && <Sprig  size={22} c={theme.ochre} />}
        {b.mood === "focus"   && <Leaf   size={22} c={theme.sage} />}
      </div>
      <div>
        <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2 }}>
          {b.name}
          {s.who !== "you" && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash, marginLeft: 6 }}>· {s.who}</span>}
        </div>
        <div style={{ fontSize: 11.5, color: theme.ash, marginTop: 3, letterSpacing: "0.03em" }}>
          <span style={{ fontStyle: "italic", fontFamily: ff.serif }}>{s.intent}</span>
          <span style={{ margin: "0 6px", color: theme.rule }}>→</span>
          <span style={{ color: theme.sageDeep }}>{s.actual}</span>
          <span style={{ margin: "0 8px", color: theme.rule }}>·</span>
          <span>{"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span></span>
        </div>
        {s.note && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft, marginTop: 5 }}>
            "{s.note}"
          </div>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: theme.ash, letterSpacing: "0.08em", marginTop: 4 }}>{s.ago}</div>
    </button>
  );
};

/* ──────────────────────────────────────────────────────────────
   Blend resolver — deterministic mood → blend
   Handles single moods, curated pairs, and n-way fallbacks.
   ────────────────────────────────────────────────────────────── */

// Per-mood recipes, used for single-select and as the fallback
// ingredient pool for un-curated combinations.
const MOOD_BLENDS = {
  calm:    { ings: [["chamomile", 1.5], ["lemonbalm", 0.8], ["lavender", 0.2]], temp: 95,  time: 300, effects: [["calm", 4], ["sleepy", 2], ["bitterness", 1]] },
  focus:   { ings: [["sencha", 1.2], ["peppermint", 0.4]],                      temp: 75,  time: 90,  effects: [["focus", 4], ["clear", 3], ["bitterness", 2]] },
  energy:  { ings: [["assam", 1.5], ["ginger", 0.3], ["cardamom", 0.2], ["cinnamon", 0.2]], temp: 95,  time: 240, effects: [["energy", 4], ["warming", 4], ["bitterness", 2]] },
  comfort: { ings: [["rooibos", 1.8], ["rose", 0.3]],                           temp: 100, time: 360, effects: [["comfort", 4], ["settling", 3], ["bitterness", 1]] },
  sleepy:  { ings: [["chamomile", 2.0], ["lavender", 0.4]],                     temp: 100, time: 420, effects: [["sleepy", 4], ["calm", 4], ["bitterness", 1]] },
  settle:  { ings: [["lemonbalm", 1.2], ["chamomile", 0.8]],                    temp: 95,  time: 300, effects: [["settling", 4], ["calm", 3], ["bitterness", 1]] },
};

// Named recipes for the pairings that have a clear traditional character.
// Key is alphabetical "a+b". Not every pair is curated — uncurated pairs
// fall back to the composition function below.
const PAIR_BLENDS = {
  "calm+focus": {
    name: "Stillwater Study", subtitle: "alert rest",
    ings: [["lemonbalm", 1.2], ["sencha", 0.5], ["rose", 0.2]],
    temp: 80, time: 180,
    effects: [["calm", 3], ["focus", 3], ["bitterness", 1]],
  },
  "calm+comfort": {
    name: "Evensong", subtitle: "a soft ending",
    ings: [["chamomile", 1.2], ["rooibos", 1.0], ["rose", 0.3]],
    temp: 95, time: 300,
    effects: [["calm", 3], ["comfort", 4], ["bitterness", 1]],
  },
  "calm+sleepy": {
    name: "Deepening", subtitle: "for very late hours",
    ings: [["chamomile", 2.0], ["passionflower", 0.5], ["lavender", 0.3], ["lemonbalm", 0.4]],
    temp: 100, time: 420,
    effects: [["calm", 4], ["sleepy", 4], ["bitterness", 1]],
  },
  "calm+settle": {
    name: "Threshold", subtitle: "arriving home",
    ings: [["lemonbalm", 1.4], ["chamomile", 0.8], ["rose", 0.2]],
    temp: 95, time: 300,
    effects: [["calm", 4], ["settling", 4], ["bitterness", 1]],
  },
  "energy+focus": {
    name: "First Light", subtitle: "morning, sharpened",
    ings: [["sencha", 1.5], ["assam", 0.6], ["peppermint", 0.3]],
    temp: 80, time: 120,
    effects: [["energy", 3], ["focus", 4], ["bitterness", 2]],
  },
  "comfort+energy": {
    name: "Hearth Kindler", subtitle: "warmth with a spark",
    ings: [["rooibos", 1.2], ["assam", 0.5], ["cinnamon", 0.3], ["cardamom", 0.2]],
    temp: 100, time: 300,
    effects: [["energy", 3], ["comfort", 3], ["warming", 4]],
  },
  "comfort+focus": {
    name: "Long Desk", subtitle: "the afternoon stretch",
    ings: [["rooibos", 1.4], ["peppermint", 0.4], ["sencha", 0.3]],
    temp: 85, time: 180,
    effects: [["focus", 3], ["comfort", 3], ["bitterness", 1]],
  },
  "comfort+sleepy": {
    name: "Wool & Wick", subtitle: "bundled under covers",
    ings: [["rooibos", 1.0], ["chamomile", 1.0], ["vanilla", 0.2], ["lavender", 0.2]],
    temp: 100, time: 420,
    effects: [["sleepy", 3], ["comfort", 4], ["warming", 2]],
  },
  "focus+settle": {
    name: "Clear Channel", subtitle: "unscattered attention",
    ings: [["tulsi", 1.0], ["lemonbalm", 1.0], ["sencha", 0.3]],
    temp: 85, time: 180,
    effects: [["focus", 3], ["settling", 3], ["clear", 3]],
  },
  "settle+sleepy": {
    name: "Soft Landing", subtitle: "for unwinding",
    ings: [["chamomile", 1.6], ["lemonbalm", 0.8], ["lavender", 0.3]],
    temp: 100, time: 360,
    effects: [["sleepy", 3], ["settling", 4], ["calm", 3]],
  },
  "comfort+settle": {
    name: "Lamplight", subtitle: "a slow return",
    ings: [["rooibos", 1.4], ["lemonbalm", 0.8], ["rose", 0.2]],
    temp: 100, time: 300,
    effects: [["settling", 3], ["comfort", 4], ["calm", 2]],
  },
  "energy+settle": {
    name: "Steady Footing", subtitle: "a grounded wake-up",
    ings: [["assam", 1.2], ["lemonbalm", 0.6], ["ginger", 0.2]],
    temp: 95, time: 240,
    effects: [["energy", 3], ["settling", 3], ["warming", 3]],
  },
};

// Moods that work against each other. Selected anyway? We'll render
// a blend but flag the tension with a gentle note.
const MOOD_CONFLICTS = [
  ["energy", "sleepy"],
  ["focus",  "sleepy"],
];

// Flavor pairs that don't typically play well in a single cup. Won't block
// the user — the app is permissive — but surfaces a soft warning when both
// are selected. Not exhaustive; these are the most reliably-fighting ones.
const FLAVOR_CONFLICTS = [
  ["minty",  "spiced"],  // menthol cold vs warming spices cancel each other
  ["earthy", "citrus"],  // bright acid muddies deep grounding notes
];

const MOOD_SINGLE_NAMES = {
  calm:    ["Dusk Lullaby",        "for wound evenings"],
  focus:   ["Scriptorium",         "for the hour before dinner"],
  energy:  ["Morning Vestment",    "a quiet start with teeth"],
  comfort: ["Hearth & Quiet",      "rainy-afternoon default"],
  sleepy:  ["Threshold of Sleep",  "for very late nights"],
  settle:  ["The Settling",        "a long exhale"],
};

/* ──────────────────────────────────────────────────────────────
   Brewing profile — derive temp/time from constituent ingredients.

   The spec's prescription: "temperature as range intersection."
   - First try the intersection of all ingredient tempC ranges.
     If it's non-empty, brew at its midpoint — everyone is happy.
   - If empty, fall back to grams-weighted dominance: the most-present
     ingredient's midpoint wins, and we note which ingredients fall
     outside the chosen window. That's the "dominant compromise" case
     (sencha + a dash of peppermint → brew at sencha's temp, accept
     the peppermint extracts lightly).
   Time is grams-weighted from each ingredient's timeS range.
   ────────────────────────────────────────────────────────────── */
function computeBrewProfile(ingredients) {
  if (!ingredients || !ingredients.length) {
    return { tempC: 95, tempRange: null, timeS: 300, compatible: true, outsiders: [] };
  }

  const totalG = ingredients.reduce((s, { g }) => s + g, 0);

  const intMin = Math.max(...ingredients.map(({ id }) => INGREDIENTS[id].tempC[0]));
  const intMax = Math.min(...ingredients.map(({ id }) => INGREDIENTS[id].tempC[1]));

  // grams-weighted time, rounded to the nearest 30s
  const wTime = ingredients.reduce((s, { id, g }) => {
    const [t1, t2] = INGREDIENTS[id].timeS;
    return s + ((t1 + t2) / 2) * (g / totalG);
  }, 0);
  const timeS = Math.round(wTime / 30) * 30;

  if (intMin <= intMax) {
    // Clean intersection — everyone brews in the same window.
    return {
      tempC: Math.round((intMin + intMax) / 2 / 5) * 5,
      tempRange: [intMin, intMax],
      timeS,
      compatible: true,
      outsiders: [],
    };
  }

  // No overlap — weighted-grams dominance. Find the ingredients that
  // fall outside the chosen brewing window (the "cost" of this blend).
  const wTemp = ingredients.reduce((s, { id, g }) => {
    const [t1, t2] = INGREDIENTS[id].tempC;
    return s + ((t1 + t2) / 2) * (g / totalG);
  }, 0);
  const tempC = Math.round(wTemp / 5) * 5;

  const outsiders = ingredients
    .filter(({ id }) => {
      const [lo, hi] = INGREDIENTS[id].tempC;
      return tempC < lo - 2 || tempC > hi + 2;
    })
    .map(({ id }) => id);

  return { tempC, tempRange: null, timeS, compatible: false, outsiders };
}

// The base resolver. Deterministic — same moods + flavor always → same blend.
// Now genuinely uses flavor to influence composition (it didn't before —
// this was a real bug).
function resolveBlend(moods, flavor) {
  const conflict = MOOD_CONFLICTS.find(([a, b]) => moods.includes(a) && moods.includes(b)) || null;

  if (moods.length === 0) {
    return {
      name: "—", subtitle: "pick a mood to begin",
      ingredients: [], tempC: 95, timeS: 300, effects: [],
      empty: true, conflict: null, moods: [],
    };
  }

  let base;
  if (moods.length === 1) {
    const m = moods[0];
    const b = MOOD_BLENDS[m];
    const [name, subtitle] = MOOD_SINGLE_NAMES[m];
    base = {
      name, subtitle,
      ingredients: b.ings.map(([id, g]) => ({ id, g })),
      tempC: b.temp, timeS: b.time, effects: b.effects,
      conflict, moods,
    };
  } else if (moods.length === 2) {
    const key = [...moods].sort().join("+");
    const curated = PAIR_BLENDS[key];
    if (curated) {
      base = {
        name: curated.name, subtitle: curated.subtitle,
        ingredients: curated.ings.map(([id, g]) => ({ id, g })),
        tempC: curated.temp, timeS: curated.time, effects: curated.effects,
        conflict, moods,
      };
    }
  }

  if (!base) {
    // Fallback composition: merge ingredient pools by summed grams,
    // average temperature, average time.
    const mergedG = {};
    let tempSum = 0, timeSum = 0;
    moods.forEach(m => {
      const b = MOOD_BLENDS[m];
      b.ings.forEach(([id, g]) => { mergedG[id] = (mergedG[id] || 0) + g / moods.length; });
      tempSum += b.temp;
      timeSum += b.time;
    });
    const ingredients = Object.entries(mergedG)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, g]) => ({ id, g: Math.round(g * 10) / 10 }));

    const effTable = {};
    moods.forEach(m => {
      MOOD_BLENDS[m].effects.slice(0, 2).forEach(([tag, n]) => {
        effTable[tag] = Math.max(effTable[tag] || 0, Math.round(n * 0.85));
      });
    });
    const effects = Object.entries(effTable).sort((a, b) => b[1] - a[1]).slice(0, 3);

    base = {
      name: conflict ? "Uneasy Blend" : "Composition",
      subtitle: conflict ? "these moods pull apart" : `for ${moods.join(" · ")}`,
      ingredients, tempC: Math.round(tempSum / moods.length / 5) * 5,
      timeS: Math.round(timeSum / moods.length / 30) * 30,
      effects, conflict, moods,
    };
  }

  // If flavor is selected, re-weight the ingredient pool to emphasize matching flavors.
  // Keeps the same ingredients but adjusts their grams — heavier on flavor-matches.
  if (flavor && base.ingredients.length > 0) {
    base = {
      ...base,
      ingredients: base.ingredients.map(ing => {
        const meta = INGREDIENTS[ing.id];
        const matches = meta?.flavors?.includes(flavor);
        return { ...ing, g: matches ? Math.round(ing.g * 1.25 * 10) / 10 : ing.g };
      }),
    };
  }

  return base;
}

// Simple complementary-flavor map: each flavor has a short list of flavors
// that pair well as accents. Drives axis-aware candidate generation.
const FLAVOR_COMPLEMENTS = {
  floral:  ["citrus", "honeyed", "grassy"],
  earthy:  ["spiced", "smoky", "mineral"],
  citrus:  ["floral", "spiced", "grassy"],
  spiced:  ["earthy", "sweet", "citrus"],
  minty:   ["citrus", "floral", "sweet"],
  fruity:  ["floral", "spiced", "honeyed"],
  sweet:   ["spiced", "floral", "earthy"],
  grassy:  ["citrus", "floral", "mineral"],
  smoky:   ["earthy", "spiced", "sweet"],
  mineral: ["earthy", "grassy"],
  honeyed: ["floral", "fruity"],
};

// Simple mood-neighbor map: when flavor is primary, we can suggest an
// alternate mood that shares a natural affinity with the user's pick.
const MOOD_NEIGHBORS = {
  calm:    ["sleepy", "settle"],
  focus:   ["energy", "calm"],
  energy:  ["focus"],
  sleepy:  ["calm", "settle"],
  comfort: ["settle", "calm"],
  settle:  ["comfort", "calm"],
};

// Build a flavor-accent variant — holds mood constant, swaps in an ingredient
// carrying a specified ACCENT flavor. Reduces base grams slightly to make room.
function buildAccentVariantByFlavor(primary, accentFlavor) {
  if (!accentFlavor || !primary.ingredients?.length) return null;

  const existingIds = primary.ingredients.map(i => i.id);
  const carriers = Object.entries(INGREDIENTS).filter(
    ([id, ing]) => ing.flavors?.includes(accentFlavor) && !existingIds.includes(id)
  );
  if (carriers.length === 0) return null;

  // Prefer one that pairs well with any existing ingredient
  const paired = carriers.find(([id, ing]) =>
    existingIds.some(eid =>
      (INGREDIENTS[eid].pairs || []).includes(id) ||
      (ing.pairs || []).includes(eid)
    )
  );
  const [pickedId, pickedIng] = paired || carriers[0];

  return {
    name: `${primary.name} · ${accentFlavor} accent`,
    subtitle: `lifted with ${pickedIng.name.toLowerCase()}`,
    ingredients: [
      ...primary.ingredients.map(i => ({ ...i, g: Math.round(i.g * 0.85 * 10) / 10 })),
      { id: pickedId, g: 0.5 },
    ],
    tempC: primary.tempC,
    timeS: primary.timeS,
    effects: primary.effects,
    conflict: primary.conflict,
    moods: primary.moods,
  };
}

// Build a mood-shift variant — holds flavor roughly constant, nudges the
// blend toward a neighboring mood by recomputing against that mood's recipe.
function buildAccentVariantByMood(primaryMood, neighborMood, flavor) {
  const neighborBase = resolveBlend([neighborMood], flavor);
  if (neighborBase.empty) return null;

  return {
    name: `${neighborBase.name} · for ${primaryMood}-leaning days`,
    subtitle: `a ${neighborMood} take on the same palate`,
    ingredients: neighborBase.ingredients,
    tempC: neighborBase.tempC,
    timeS: neighborBase.timeS,
    effects: neighborBase.effects,
    conflict: null,
    moods: [neighborMood],
  };
}

// Multi-candidate resolver, axis-aware. Returns 1–3 blends.
// Always leads with the primary match. Accent candidates vary along the
// NON-primary axis: when primaryAxis is "feel", accents explore flavor
// variations; when "taste", accents explore mood variations.
function resolveCandidates(moods, flavor, primaryAxis = "feel") {
  if (moods.length === 0) return [];

  const primary = resolveBlend(moods, flavor);
  const candidates = [{ ...primary, kind: "primary", kindLabel: "closest match" }];

  if (primaryAxis === "feel") {
    // User cares about mood — vary across flavor axis.
    // If flavor is selected, try a COMPLEMENTARY flavor accent first.
    // If no flavor, or complement generation fails, try the user's chosen
    // flavor as a doubled-down accent.
    const complements = flavor ? (FLAVOR_COMPLEMENTS[flavor] || []) : [];
    for (const comp of complements) {
      const v = buildAccentVariantByFlavor(primary, comp);
      if (v) {
        candidates.push({ ...v, kind: "accent", kindLabel: `${comp} accent` });
        break;
      }
    }
    // If we still haven't added an accent and user picked a flavor,
    // try doubling down on that flavor as a fallback
    if (candidates.length === 1 && flavor) {
      const v = buildAccentVariantByFlavor(primary, flavor);
      if (v) candidates.push({ ...v, kind: "accent", kindLabel: `${flavor}-forward` });
    }

    // Tradition fits a mood-led view — add if one matches
    const tradition = BLENDS.find(b =>
      b.tradition && moods.includes(b.mood) &&
      !candidates.some(c => c.name === b.name)
    );
    if (tradition) {
      candidates.push({
        ...tradition, kind: "tradition",
        kindLabel: `traditional · ${tradition.tradition}`,
      });
    }
  } else {
    // User cares about taste — vary across mood axis.
    // Try mood-neighbor first: same flavor, different mood emphasis.
    const primaryMood = moods[0];
    const neighbors = MOOD_NEIGHBORS[primaryMood] || [];
    for (const nb of neighbors) {
      if (moods.includes(nb)) continue;
      const v = buildAccentVariantByMood(primaryMood, nb, flavor);
      if (v) {
        candidates.push({ ...v, kind: "accent", kindLabel: `${nb}-leaning` });
        break;
      }
    }

    // Traditions that share the selected flavor fit a taste-led view
    if (flavor) {
      const flavorTradition = BLENDS.find(b =>
        b.tradition && b.flavor === flavor &&
        !candidates.some(c => c.name === b.name)
      );
      if (flavorTradition) {
        candidates.push({
          ...flavorTradition, kind: "tradition",
          kindLabel: `traditional · ${flavorTradition.tradition}`,
        });
      }
    }
  }

  return candidates.slice(0, 3);
}

/* ──────────────────────────────────────────────────────────────
   Screen: COMPOSE
   ────────────────────────────────────────────────────────────── */

const ComposeScreen = ({ go, startBrew, savedBlendIds, openBlend, composePreselect, openInCompose, pantryIds }) => {
  const { unit, weightUnit } = useUnit();
  const [mode, setMode] = useState("forward"); // forward | reverse | library | traditions
  const [moods, setMoods] = useState([]);        // start empty — user sets their intent
  const [flavors, setFlavors] = useState([]);    // multi-select, same pattern as moods
  const [onlyPantry, setOnlyPantry] = useState(false);
  const [intent, setIntent] = useState("");   // current feeling ("how you feel right now")
  const [reverseIngs, setReverseIngs] = useState(["chamomile", "lemonbalm"]);
  // Which axis leads: "feel" (mood-primary) or "taste" (flavor-primary).
  // Changes which side shows as the prominent row and which axis the
  // resolver varies across for alternate candidates.
  const [primaryAxis, setPrimaryAxis] = useState("feel");

  // When a favorite is tapped on Home (or a saved blend in Apothecary),
  // composePreselect arrives here. Switch to the Apothecary sub-tab so the
  // user sees their saved recipe highlighted, ready to set intent and brew.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("library");
  }, [composePreselect?.at]);

  const toggleMood = (m) => {
    setMoods(prev => {
      if (prev.includes(m)) return prev.filter(x => x !== m);
      if (prev.length >= 3) return [...prev.slice(1), m];
      return [...prev, m];
    });
  };

  const toggleFlavor = (f) => {
    setFlavors(prev => {
      if (prev.includes(f)) return prev.filter(x => x !== f);
      if (prev.length >= 3) return [...prev.slice(1), f];
      return [...prev, f];
    });
  };

  const moodInTension = (m) =>
    MOOD_CONFLICTS.some(([a, b]) =>
      (moods.includes(a) && m === b) ||
      (moods.includes(b) && m === a)
    );

  const flavorInTension = (f) =>
    FLAVOR_CONFLICTS.some(([a, b]) =>
      (flavors.includes(a) && f === b) ||
      (flavors.includes(b) && f === a)
    );

  // Resolver still takes a single flavor (for now) — we pass the first
  // selected flavor as the primary driver. Additional flavors will be used
  // for accent/variant generation downstream.
  const primaryFlavor = flavors[0] || null;
  const rawCandidates = resolveCandidates(moods, primaryFlavor, primaryAxis);

  // When "only use what's in my pantry" is toggled on, drop any candidate
  // that contains an ingredient the user doesn't have. Empty pantry + toggle
  // on = empty candidate list, rendered as a dedicated empty state below.
  const candidates = onlyPantry && pantryIds
    ? rawCandidates.filter(c =>
        (c.ingredients || []).every(({ id }) => pantryIds.has(id))
      )
    : rawCandidates;

  const [selectedIdx, setSelectedIdx] = useState(0);

  // When the candidate list changes (moods/flavors changed), snap selection
  // back to 0 so the user always sees the "best match" first.
  const candidateKey = candidates.map(c => c.name).join("|");
  React.useEffect(() => {
    setSelectedIdx(0);
  }, [candidateKey]);

  const blend = candidates[selectedIdx] || {
    name: "—",
    subtitle: onlyPantry
      ? (pantryIds && pantryIds.size === 0
          ? "add ingredients to your pantry first"
          : "no blends from what you have on hand")
      : "pick a mood to begin",
    ingredients: [], tempC: 95, timeS: 300, effects: [],
    empty: true, conflict: null, moods: [],
  };

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 5 }}>
          <TempToggle />
          <WeightToggle />
        </div>
      </div>

      {/* Segmented control */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
        border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
        marginBottom: 20, background: theme.cream,
      }}>
        {[
          ["forward",    "Compose"],
          ["reverse",    "Blend"],
          ["library",    "Apothecary"],
          ["traditions", "Traditions"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
            padding: "9px 4px", cursor: "pointer",
            background: mode === k ? theme.ink : "transparent",
            color: mode === k ? theme.cream : theme.inkSoft,
            border: "none",
          }}>{label}</button>
        ))}
      </div>

      {mode === "forward" && (
        <>
          {/* Primary-axis toggle — "by feel" (mood leads) vs "by taste" (flavor leads).
              Reorders the page and changes how alternate candidates are generated. */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
            marginBottom: 16, background: theme.cream,
          }}>
            {[
              ["feel",  "by feel"],
              ["taste", "by taste"],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setPrimaryAxis(k)} style={{
                fontFamily: ff.serif, fontSize: 13, fontStyle: "italic",
                padding: "9px 4px", cursor: "pointer",
                background: primaryAxis === k ? theme.terra : "transparent",
                color: primaryAxis === k ? theme.cream : theme.inkSoft,
                border: "none",
              }}>{label}</button>
            ))}
          </div>

          <SectionLabel>Current feeling</SectionLabel>
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="wound up · scattered · tired…"
              style={{
                width: "100%", background: theme.cream,
                border: `1px solid ${theme.rule}`, borderRadius: 8,
                fontFamily: ff.serif, fontStyle: intent ? "normal" : "italic",
                fontSize: 17, color: intent ? theme.ink : theme.ash,
                padding: "10px 34px 10px 14px", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              color: theme.ash, fontSize: 13, pointerEvents: "none",
            }}>✎</span>
          </div>
          {(() => {
            const moodRow = (
              <div key="mood-row" style={{ opacity: primaryAxis === "feel" ? 1 : 0.72 }}>
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <SectionLabel n={primaryAxis === "feel" ? "ii" : "iii"}>
                    {primaryAxis === "feel" ? "Desired mood" : "Mood, lightly"}
                  </SectionLabel>
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
                  }}>
                    {primaryAxis === "taste" && moods.length === 0 ? "optional" :
                     moods.length === 0 ? "pick one or two" :
                     moods.length === 1 ? "add a second to combine" :
                     moods.length === 2 ? "2 selected · pairs well" :
                     "3 selected · at the limit"}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {MOODS.map(m => (
                    <Chip
                      key={m}
                      active={moods.includes(m)}
                      caution={moodInTension(m)}
                      onClick={() => toggleMood(m)}
                      tone="sage"
                    >{m}</Chip>
                  ))}
                </div>

                {blend.conflict && (
                  <div style={{
                    marginTop: 12, padding: "10px 12px", borderRadius: 8,
                    background: "rgba(176, 84, 47, 0.07)",
                    border: `1px solid rgba(176, 84, 47, 0.22)`,
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <Flower size={16} c={theme.terra} />
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.inkSoft, lineHeight: 1.45 }}>
                      <em style={{ color: theme.terra, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>at odds</em>
                      <em style={{ color: theme.terra }}>{blend.conflict[0]}</em> and <em style={{ color: theme.terra }}>{blend.conflict[1]}</em> pull in opposite directions. The blend will try to thread the needle, but usually better to pick one.
                    </div>
                  </div>
                )}
              </div>
            );

            const flavorRow = (
              <div key="flavor-row" style={{ opacity: primaryAxis === "taste" ? 1 : 0.72 }}>
                <div style={{ marginTop: 20 }}>
                  <SectionLabel n={primaryAxis === "taste" ? "ii" : "iii"}>
                    {primaryAxis === "taste" ? "Flavor you're after" : "Flavor direction"}
                  </SectionLabel>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {FLAVORS.map(f => {
                    const active = flavors.includes(f);
                    const tension = !active && flavorInTension(f);
                    return (
                      <Chip
                        key={f}
                        active={active}
                        onClick={() => toggleFlavor(f)}
                        tone="terra"
                        caution={tension}
                      >{f}</Chip>
                    );
                  })}
                </div>
                {/* Soft warning when user has selected flavors that typically fight each other */}
                {flavors.length >= 2 && (() => {
                  const conflict = FLAVOR_CONFLICTS.find(([a, b]) =>
                    flavors.includes(a) && flavors.includes(b)
                  );
                  return conflict ? (
                    <div style={{
                      marginTop: 10, padding: "8px 10px", borderRadius: 6,
                      background: "rgba(165, 120, 54, 0.08)",
                      border: `1px solid rgba(165, 120, 54, 0.22)`,
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                      color: theme.inkSoft, lineHeight: 1.45,
                    }}>
                      <em style={{ color: theme.terra, fontStyle: "normal" }}>{conflict[0]}</em>
                      {" "}and{" "}
                      <em style={{ color: theme.terra, fontStyle: "normal" }}>{conflict[1]}</em>
                      {" "}can work against each other in a cup. The blend will try to balance them; often better to pick one.
                    </div>
                  ) : null;
                })()}
              </div>
            );

            // Render the primary axis first (gets "ii"), secondary second (gets "iii")
            return primaryAxis === "feel" ? [moodRow, flavorRow] : [flavorRow, moodRow];
          })()}

          <label style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 18,
            fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft, cursor: "pointer",
          }}>
            <span style={{
              width: 30, height: 18, borderRadius: 999,
              background: onlyPantry ? theme.sageDeep : theme.rule,
              position: "relative", transition: "background .2s",
            }} onClick={() => setOnlyPantry(!onlyPantry)}>
              <span style={{
                position: "absolute", top: 2, left: onlyPantry ? 14 : 2,
                width: 14, height: 14, borderRadius: "50%", background: theme.cream,
                transition: "left .2s",
              }} />
            </span>
            only use what's in my pantry
          </label>

          {/* Candidate selector — only shown when there are multiple suggestions */}
          {candidates.length > 1 && (
            <div style={{ marginTop: 22 }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: theme.ash, fontFamily: ff.sans, marginBottom: 8,
              }}>
                {candidates.length} suggestions
              </div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                {candidates.map((c, i) => {
                  const isSelected = i === selectedIdx;
                  return (
                    <button key={i} onClick={() => setSelectedIdx(i)} style={{
                      flex: "0 0 auto", minWidth: 130, maxWidth: 170,
                      textAlign: "left",
                      padding: "8px 10px", borderRadius: 10,
                      border: `1px solid ${isSelected ? theme.ink : theme.rule}`,
                      background: isSelected ? theme.ink : "transparent",
                      color: isSelected ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      <div style={{
                        fontFamily: ff.sans, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isSelected ? "rgba(243,236,220,0.6)" : theme.ash,
                      }}>{c.kindLabel}</div>
                      <div style={{
                        fontFamily: ff.serif, fontSize: 13, lineHeight: 1.15,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{c.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Generated blend card */}
          <div style={{
            marginTop: candidates.length > 1 ? 12 : 22, padding: 18, borderRadius: 14,
            border: `1px solid ${theme.rule}`, background: theme.cream,
            position: "relative", overflow: "hidden",
            opacity: blend.empty ? 0.55 : 1,
          }}>
            <div style={{
              position: "absolute", top: 10, right: 12,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash,
            }}>
              suggestion · unsaved
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Flower size={18} c={theme.ochre} />
              <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
                {moods.length === 0   ? "no mood yet"
                 : moods.length === 1 ? `a blend for ${moods[0]}`
                 : moods.length === 2 ? `for ${moods[0]} & ${moods[1]}`
                 : `for ${moods.slice(0, -1).join(", ")} & ${moods[moods.length - 1]}`}
              </div>
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 26, color: theme.ink, lineHeight: 1.1 }}>
              {blend.name}
            </div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {blend.subtitle}
            </div>

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            {blend.ingredients.length === 0 ? (
              <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "6px 0" }}>
                Tap a mood chip above to compose a cup.
              </div>
            ) : (
              blend.ingredients.map(({ id, g }) => {
                const ing = INGREDIENTS[id];
                return (
                  <div key={id} onClick={() => go("ingredient", id)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "6px 0", cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                        {ing.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                      </div>
                      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>{ing.latin}</div>
                    </div>
                    <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft }}>
                      {formatAmount(g, ing.category, weightUnit)}
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            <div style={{ display: "flex", gap: 16, fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Water</div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink }}>{formatTemp(blend.tempC, unit)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Steep</div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink }}>{mmss(blend.timeS)}</div>
              </div>
              <div style={{ flex: 1 }} />
              <button style={{
                fontFamily: ff.sans, fontSize: 11, color: theme.ash,
                background: "transparent", border: `1px solid ${theme.rule}`,
                borderRadius: 999, padding: "4px 10px", cursor: "pointer",
              }}>why this temp?</button>
            </div>

            {blend.effects.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <SectionLabel>Predicted effect</SectionLabel>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {blend.effects.map(([tag, n], i) => (
                    <EffectBar
                      key={tag}
                      label={tag}
                      value={n}
                      color={
                        tag === "bitterness" ? theme.terra
                        : i === 0           ? theme.sage
                        : i === 1           ? theme.ochre
                        : theme.sky
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={iconBtn()}>↻ shuffle</button>
            <button style={iconBtn()}>✎ tweak</button>
            <button
              disabled={blend.empty}
              onClick={() => startBrew(blend, intent, moods)}
              style={{
                flex: 1, fontFamily: ff.serif, fontSize: 16,
                padding: "14px 16px", borderRadius: 10,
                background: blend.empty ? theme.rule : theme.terra,
                color: theme.cream, border: "none",
                cursor: blend.empty ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Kettle size={18} c={theme.cream} />
              start brewing
            </button>
          </div>
        </>
      )}

      {mode === "reverse" && (
        <ReverseCompose reverseIngs={reverseIngs} setReverseIngs={setReverseIngs} go={go} startBrew={startBrew} />
      )}

      {mode === "library" && (
        <LibraryList
          blends={BLENDS.filter(b => savedBlendIds.has(b.id))}
          highlightId={composePreselect?.blendId}
          compact go={go} startBrew={startBrew}
        />
      )}

      {mode === "traditions" && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, marginBottom: 14,
          }}>
            Classic preparations, taught the way they're traditionally made.
            Tap any to open its recipe or start brewing.
          </div>
          {BLENDS.filter(b => b.tradition).map((b, i) => (
            <BlendListRow key={b.id} b={b} author={b.tradition} first={i === 0} go={go} startBrew={startBrew} />
          ))}
        </div>
      )}
    </div>
  );
};

const iconBtn = () => ({
  fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft,
  background: "transparent", border: `1px solid ${theme.rule}`,
  borderRadius: 10, padding: "12px 12px", cursor: "pointer",
});

const ReverseCompose = ({ reverseIngs, setReverseIngs, go, startBrew }) => {
  const { unit, weightUnit } = useUnit();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const available = Object.keys(INGREDIENTS).filter(id => !reverseIngs.includes(id));
  const filteredAvailable = available.filter(id => {
    const ing = INGREDIENTS[id];
    if (filter !== "all" && ing.category !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
        .join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  // derive predicted effects as weighted sum
  const totals = {};
  reverseIngs.forEach(id => {
    INGREDIENTS[id].effects.forEach(([tag, n]) => { totals[tag] = (totals[tag] || 0) + n; });
  });
  const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]).slice(0,3);
  const maxT = Math.max(1, ...sorted.map(x => x[1]));

  // Derive temperature and time from the actual ingredients rather than hardcoding.
  // Uses range intersection when possible, weighted-grams dominance when not.
  const ingsForProfile = reverseIngs.map(id => ({ id, g: 1.0 }));
  const profile = computeBrewProfile(ingsForProfile);

  return (
    <>
      <SectionLabel n="i">What's in the pot?</SectionLabel>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {reverseIngs.map(id => (
          <div key={id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0",
          }}>
            <button
              onClick={() => go("ingredient", id)}
              style={{
                background: "transparent", border: "none", padding: 0,
                textAlign: "left", cursor: "pointer",
                fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                display: "flex", alignItems: "baseline", gap: 4,
              }}
            >
              {INGREDIENTS[id].name}
              <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
              <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginLeft: 6 }}>
                {formatTempShort(INGREDIENTS[id].tempC[0], INGREDIENTS[id].tempC[1], unit)}
              </span>
            </button>
            <button onClick={() => setReverseIngs(reverseIngs.filter(x => x !== id))} style={{
              background: "transparent", border: "none", color: theme.ash, fontSize: 14, cursor: "pointer",
            }}>×</button>
          </div>
        ))}
        <Rule soft />
        <div style={{
          marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, fontFamily: ff.sans,
        }}>
          <span>add ingredient</span>
          <span style={{ letterSpacing: 0, textTransform: "none", fontStyle: "italic", fontFamily: ff.serif, fontSize: 11 }}>
            {filteredAvailable.length} on the shelf
          </span>
        </div>

        {/* Search input */}
        <div style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 8,
          background: theme.ivory, border: `1px solid ${theme.ruleSoft}`,
        }}>
          <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search the shelf…"
            style={{
              flex: 1, background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: search ? "normal" : "italic",
              fontSize: 14, color: theme.ink, outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "transparent", border: "none", color: theme.ash,
              fontSize: 12, cursor: "pointer",
            }}>×</button>
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
          {[
            ["all",       "all"],
            ["true tea",  "teas"],
            ["herbal",    "herbals"],
            ["flower",    "flowers"],
            ["spice",     "spices"],
            ["adaptogen", "adaptogens"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
              padding: "3px 9px", borderRadius: 999,
              border: `1px solid ${filter === key ? theme.ink : theme.ruleSoft}`,
              background: filter === key ? theme.ink : "transparent",
              color: filter === key ? theme.cream : theme.ash,
              cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {/* Scrollable results */}
        <div style={{
          marginTop: 10, maxHeight: 180, overflowY: "auto",
          paddingRight: 4,
        }}>
          {filteredAvailable.length === 0 ? (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.ash, padding: "12px 0", textAlign: "center",
            }}>
              no match on your shelf.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filteredAvailable.map(id => {
                const ing = INGREDIENTS[id];
                const catColor =
                  ing.category === "flower"    ? theme.ochre
                  : ing.category === "herbal"  ? theme.sage
                  : ing.category === "true tea" ? theme.sageDeep
                  : ing.category === "spice"    ? theme.terra
                  : ing.category === "adaptogen" ? theme.plum
                  : theme.ash;
                return (
                  <button key={id} onClick={() => setReverseIngs([...reverseIngs, id])} style={{
                    fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.02em",
                    padding: "5px 10px 5px 8px", borderRadius: 999,
                    border: `1px solid ${theme.rule}`,
                    background: "transparent", color: theme.inkSoft,
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: catColor, flexShrink: 0,
                    }} />
                    {ing.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Temperature-compatibility banner — only shows when ingredients disagree */}
      {reverseIngs.length > 1 && !profile.compatible && (
        <div style={{
          marginTop: 12, padding: "10px 12px", borderRadius: 8,
          background: "rgba(165, 120, 54, 0.08)",
          border: `1px solid rgba(165, 120, 54, 0.28)`,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Kettle size={16} c={theme.ochre} />
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.inkSoft, lineHeight: 1.45 }}>
            <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
            These ingredients don't share a brewing window.
            {profile.outsiders.length > 0 && (
              <> At <em style={{ fontStyle: "normal" }}>{formatTemp(profile.tempC, unit)}</em>,{" "}
                <em>
                  {profile.outsiders.map((id, i) => (
                    <React.Fragment key={id}>
                      {i > 0 && " and "}
                      <button
                        onClick={() => go("ingredient", id)}
                        style={{
                          background: "transparent", border: "none", padding: 0, cursor: "pointer",
                          color: theme.ochre, fontStyle: "italic", textDecoration: "underline",
                          textDecorationStyle: "dotted", textUnderlineOffset: 3,
                          fontFamily: "inherit", fontSize: "inherit",
                        }}
                      >{INGREDIENTS[id].name}</button>
                    </React.Fragment>
                  ))}
                </em>
                {" "}will extract weakly — fine if they're accents, worth rethinking if they're the point.
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}><SectionLabel n="ii">This will likely be…</SectionLabel></div>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {sorted.length === 0 ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "6px 0" }}>
            Add a few ingredients to see a prediction.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map(([tag, n], i) => (
              <EffectBar key={tag} label={tag} value={Math.round((n / maxT) * 5)} color={i === 0 ? theme.sage : i === 1 ? theme.ochre : theme.terra} />
            ))}
          </div>
        )}
        <Rule soft />
        <div style={{ marginTop: 10, display: "flex", gap: 14, fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Water</div>
            <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
              {formatTemp(profile.tempC, unit)}
              {profile.tempRange && profile.tempRange[0] !== profile.tempRange[1] && (
                <span style={{ fontSize: 11, fontStyle: "italic", color: theme.ash, marginLeft: 4 }}>
                  (range {formatTempRange(profile.tempRange[0], profile.tempRange[1], unit)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Steep</div>
            <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>{mmss(profile.timeS)}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: profile.compatible ? theme.sageDeep : theme.ochre,
          }}>
            {reverseIngs.length <= 1 ? "" : profile.compatible ? "✓ compatible" : "⚠ compromise"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={iconBtn()}>save as recipe</button>
        <button onClick={() => startBrew({ name: "Untitled blend", ingredients: ingsForProfile, tempC: profile.tempC, timeS: profile.timeS }, "curious", ["calm"])} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 16,
          padding: "12px 16px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
        }}>start brewing</button>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: STEEP (takeover)
   ────────────────────────────────────────────────────────────── */

const SteepScreen = ({ blend, intent, targetMoods, onDone, onCancel, pantryIds, togglePantry }) => {
  const total = blend.timeS || 360;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState(null);

  // Build the "while you wait" pool once per brew. Memoized to avoid
  // rebuilding (and re-shuffling) on every render.
  const waitCards = React.useMemo(
    () => buildWaitCards(blend, targetMoods),
    [blend, targetMoods]
  );
  const [waitIdx, setWaitIdx] = useState(0);
  // Fade state — briefly hides the card during transitions for a gentle feel
  const [waitFading, setWaitFading] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, remaining]);

  // Auto-dismiss the ingredient tile when the brew completes — the user's
  // attention should snap back to the timer at the finish moment.
  useEffect(() => {
    if (remaining === 0 && activeIngredient) {
      setActiveIngredient(null);
    }
  }, [remaining, activeIngredient]);

  // Manual advance to the next card — shared by the click handler and
  // the auto-cycle interval. Bumps `lastAdvance` which resets the interval.
  const CARD_CYCLE_S = 30;
  const [lastAdvance, setLastAdvance] = useState(Date.now());
  // Seconds remaining until the next auto-advance. Drives the small
  // progress ring in the card's corner. Resets to CARD_CYCLE_S on advance.
  const [cardRemaining, setCardRemaining] = useState(CARD_CYCLE_S);

  const advanceWaitCard = React.useCallback(() => {
    if (waitCards.length <= 1) return;
    setWaitFading(true);
    setTimeout(() => {
      setWaitIdx(i => (i + 1) % waitCards.length);
      setWaitFading(false);
      setLastAdvance(Date.now());
      setCardRemaining(CARD_CYCLE_S);
    }, 400);
  }, [waitCards.length]);

  // Auto-cycle every CARD_CYCLE_S seconds. Clicking a card triggers
  // advanceWaitCard which updates lastAdvance, which re-runs this effect
  // with a fresh timer (so you never get a manual-then-auto double advance).
  // Auto-cycle every CARD_CYCLE_S seconds. Clicking a card triggers
  // advanceWaitCard which updates lastAdvance, which re-runs this effect
  // with a fresh timer (so you never get a manual-then-auto double advance).
  // Keeps cycling even after the brew completes — the user might still
  // be sitting with the cup, reading along.
  useEffect(() => {
    if (paused || waitCards.length <= 1) return;
    const cycle = setTimeout(advanceWaitCard, CARD_CYCLE_S * 1000);
    return () => clearTimeout(cycle);
  }, [paused, waitCards.length, lastAdvance, advanceWaitCard]);

  // Tick the card's countdown every second. Critically, this effect does
  // NOT depend on `paused` — otherwise it would tear down and reset every
  // time you pause/resume. Instead we read paused through a ref inside
  // the interval body.
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (waitCards.length <= 1) return;
    setCardRemaining(CARD_CYCLE_S);
    const tick = setInterval(() => {
      if (pausedRef.current) return;
      setCardRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [waitCards.length, lastAdvance]);

  const pct = 1 - remaining / total;
  const R = 92;
  const C = 2 * Math.PI * R;

  // brewing landmarks
  const landmarks = [
    { t: 0, label: "pour" },
    { t: Math.round(total * 0.35), label: "inhale" },
    { t: Math.round(total * 0.7), label: "taste" },
    { t: total, label: "done" },
  ];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: `radial-gradient(ellipse at 50% 20%, ${theme.cream} 0%, ${theme.paper} 60%, ${theme.ivory} 100%)`,
      display: "flex", flexDirection: "column",
      padding: "22px 22px 26px",
    }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← cancel</button>
        <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
          Steeping
        </div>
        <button style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>notes</button>
      </div>

      {/* countdown ring */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, position: "relative" }}>
        <svg width="240" height="240" viewBox="-120 -120 240 240" style={{
          animation: paused ? "none" : "breathe 4.5s ease-in-out infinite",
        }}>
          <circle cx="0" cy="0" r={R} stroke={theme.ruleSoft} strokeWidth="1.5" fill="none" />
          <circle
            cx="0" cy="0" r={R}
            stroke={theme.terra} strokeWidth="2.5" fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90)"
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .8s linear" }}
          />
          {/* landmark ticks */}
          {landmarks.map((lm, i) => {
            const a = (lm.t / total) * 2 * Math.PI - Math.PI / 2;
            const x1 = Math.cos(a) * (R - 4), y1 = Math.sin(a) * (R - 4);
            const x2 = Math.cos(a) * (R + 4), y2 = Math.sin(a) * (R + 4);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.ink} strokeWidth="1" />;
          })}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{ fontFamily: ff.serif, fontSize: 11, fontStyle: "italic", color: theme.ash }}>remaining</div>
          <div style={{ fontFamily: ff.serif, fontSize: 48, fontWeight: 400, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {mmss(remaining)}
          </div>
          <div style={{ marginTop: 4, fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            of {mmss(total)}
          </div>
        </div>
      </div>

      {/* blend details */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink }}>{blend.name}</div>
        {targetMoods && targetMoods.length > 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.ash, marginTop: 4 }}>
            brewing for {targetMoods.join(" + ")}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 }}>
          {(blend.ingredients || []).map(item => {
            const id = typeof item === "string" ? item : item.id;
            const ing = INGREDIENTS[id];
            return ing ? (
              <button
                key={id}
                onClick={() => setActiveIngredient(id)}
                style={{
                  fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
                  padding: "3px 10px", border: `1px solid ${theme.rule}`, borderRadius: 999,
                  background: "transparent", cursor: "pointer",
                }}
              >{ing.name}</button>
            ) : null;
          })}
        </div>
      </div>

      {/* while you wait — cycling fact/tradition/poem pool keyed to this blend
          Tap the card to advance to the next one; the auto-cycle interval resets. */}
      <div
        onClick={advanceWaitCard}
        style={{
          marginTop: 18, padding: 14, border: `1px dashed ${theme.rule}`, borderRadius: 10,
          background: "rgba(255,255,255,0.35)",
          minHeight: 90,
          cursor: waitCards.length > 1 ? "pointer" : "default",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Leaf size={16} c={theme.sageDeep} />
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
              {waitCards[waitIdx]?.type === "poem"      ? "a verse" :
               waitCards[waitIdx]?.type === "tradition" ? "tradition" :
               "while you wait"}
            </div>
          </div>
          {waitCards.length > 1 && (
            /* Tiny countdown ring — shrinks as the time to next card runs down */
            <svg width="18" height="18" viewBox="-11 -11 22 22" style={{ display: "block" }}>
              <circle
                cx="0" cy="0" r="9"
                stroke={theme.ruleSoft} strokeWidth="1.5" fill="none"
              />
              <circle
                cx="0" cy="0" r="9"
                stroke={theme.ash} strokeWidth="1.5" fill="none"
                strokeDasharray={2 * Math.PI * 9}
                strokeDashoffset={(2 * Math.PI * 9) * (1 - cardRemaining / CARD_CYCLE_S)}
                transform="rotate(-90)"
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
          )}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: waitCards[waitIdx]?.type === "poem" ? "normal" : "italic",
          fontSize: 13.5, color: theme.inkSoft, marginTop: 6, lineHeight: 1.55,
          opacity: waitFading ? 0 : 1,
          transition: "opacity 0.4s ease",
          whiteSpace: waitCards[waitIdx]?.type === "poem" ? "pre-line" : "normal",
        }}>
          {waitCards[waitIdx]?.text}
        </div>
        {waitCards[waitIdx]?.attribution && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            marginTop: 8, textAlign: "right", paddingRight: 18,
            opacity: waitFading ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}>
            {waitCards[waitIdx].attribution}
          </div>
        )}
        {/* Tap-to-advance affordance: a small right-pointing triangle
            in the bottom-right corner of the card */}
        {waitCards.length > 1 && (
          <svg
            width="10" height="10" viewBox="0 0 10 10"
            style={{
              position: "absolute", right: 10, bottom: 10,
              opacity: 0.55,
            }}
          >
            <polygon points="2,1 9,5 2,9" fill={theme.ash} />
          </svg>
        )}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setPaused(!paused)} style={iconBtn()}>
          {paused ? "▶ resume" : "❚❚ pause"}
        </button>
        <button onClick={() => setRemaining(total)} style={iconBtn()}>↺ reset</button>
        <button onClick={() => onDone(blend, intent, targetMoods)} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 15,
          padding: "12px 14px", borderRadius: 10,
          background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
        }}>
          {remaining === 0 ? "log this cup →" : "done early →"}
        </button>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.012); }
        }
      `}</style>

      {/* Ingredient mini-tile — overlays the timer as a bottom sheet */}
      {activeIngredient && (
        <IngredientSheet
          id={activeIngredient}
          onClose={() => setActiveIngredient(null)}
          inPantry={pantryIds?.has(activeIngredient)}
          onTogglePantry={() => togglePantry && togglePantry(activeIngredient)}
        />
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Component: INGREDIENT SHEET
   Bottom-sheet mini-tile showing quick-reference info about an
   ingredient, overlaid on the Steep timer. Used when a user wants
   to quickly recall what an ingredient is doing in their current
   brew without navigating away from the timer.
   ────────────────────────────────────────────────────────────── */

const IngredientSheet = ({ id, onClose, inPantry, onTogglePantry }) => {
  const ing = INGREDIENTS[id];
  if (!ing) return null;

  return (
    <>
      {/* Backdrop — tap anywhere outside the sheet to dismiss */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0, zIndex: 40,
          background: "rgba(30, 24, 18, 0.35)",
          animation: "sheetFadeIn 0.2s ease-out",
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
        background: theme.ivory,
        borderRadius: "20px 20px 0 0",
        padding: "16px 22px 22px",
        maxHeight: "60%", overflowY: "auto",
        boxShadow: "0 -8px 32px -12px rgba(30,24,18,0.3)",
        animation: "sheetSlideUp 0.25s ease-out",
      }}>
        {/* Grab-handle + exit row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: theme.rule, margin: "0 auto",
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            top: 8,
          }} />
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            a quick look
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "0 4px",
          }}>×</button>
        </div>

        {/* Ingredient header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: theme.cream, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {ing.category === "flower"    && <Flower size={22} c={theme.ochre} />}
            {ing.category === "herbal"    && <Sprig  size={22} c={theme.sage} />}
            {ing.category === "true tea"  && <Leaf   size={22} c={theme.sageDeep} />}
            {ing.category === "spice"     && <Flower size={22} c={theme.terra} />}
            {ing.category === "adaptogen" && <Sprig  size={22} c={theme.plum} />}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
              {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1.1, marginTop: 1 }}>
              {ing.name}
            </div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 1 }}>
              {ing.latin}
            </div>
          </div>
        </div>

        {/* Blurb — one-line essence */}
        <div style={{
          fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
          lineHeight: 1.5, marginBottom: 14,
        }}>
          {ing.blurb}
        </div>

        {/* Effects — top 3 */}
        {ing.effects && ing.effects.length > 0 && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            display: "flex", flexDirection: "column", gap: 6, marginBottom: 10,
          }}>
            {ing.effects.slice(0, 3).map(([tag, n], i) => (
              <EffectBar
                key={tag}
                label={tag}
                value={n}
                color={
                  tag === "bitterness" ? theme.terra
                  : i === 0           ? theme.sage
                  : i === 1           ? theme.ochre
                  : theme.sky
                }
              />
            ))}
          </div>
        )}

        {/* Flavor tags */}
        {ing.flavors && ing.flavors.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {ing.flavors.slice(0, 4).map(f => (
              <span key={f} style={{
                fontFamily: ff.sans, fontSize: 10, color: theme.terra, letterSpacing: "0.04em",
                padding: "2px 8px", border: `1px solid ${theme.terra}`, borderRadius: 999,
                opacity: 0.85,
              }}>{f}</span>
            ))}
          </div>
        )}

        {/* Heads-up note — only if present */}
        {ing.headsUp && (
          <div style={{
            padding: "9px 12px", borderRadius: 8, marginBottom: 12,
            background: "rgba(176, 84, 47, 0.07)",
            border: `1px solid rgba(176, 84, 47, 0.22)`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ color: theme.terra, fontSize: 14, lineHeight: 1.2 }}>⚠</span>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.inkSoft, lineHeight: 1.45 }}>
              {ing.headsUp}
            </div>
          </div>
        )}

        {/* Pantry toggle */}
        {onTogglePantry && (
          <button onClick={onTogglePantry} style={{
            width: "100%",
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.04em",
            padding: "11px", borderRadius: 10,
            background: inPantry ? "transparent" : theme.cream,
            border: `1px solid ${inPantry ? theme.sageDeep : theme.rule}`,
            color: inPantry ? theme.sageDeep : theme.inkSoft,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {inPantry ? "✓ in your pantry" : "+ add to pantry"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes sheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: LOG
   ────────────────────────────────────────────────────────────── */

const LogScreen = ({ blend, intent, targetMoods, onSubmit, onCancel }) => {
  const safeMoods = targetMoods && targetMoods.length ? targetMoods : [];
  // Per-dimension "did it land?" — default each target mood to "landed".
  const [landed, setLanded] = useState(() =>
    Object.fromEntries(safeMoods.map(m => [m, true]))
  );
  // Allow the user to add moods they didn't set out for (e.g. unintended sleepy).
  const [extra, setExtra] = useState([]);
  const [taste, setTaste] = useState(4);
  const [note, setNote] = useState("");
  const [save, setSave] = useState(true);
  // Rename: only relevant for user-composed blends (no curated id). Empty
  // string means "keep the auto-generated name"; any non-empty string
  // overrides it when saving to the library.
  const [rename, setRename] = useState("");
  const isComposed = !blend?.id;

  const toggleExtra = (m) => {
    if (safeMoods.includes(m)) return; // don't let extras collide with targets
    setExtra(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
      padding: "22px 22px 26px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
          Check-in
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Flower size={28} c={theme.ochre} />
        <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, marginTop: 8 }}>
          how's the cup?
        </div>
        <h2 style={{ fontFamily: ff.serif, fontSize: 24, fontWeight: 400, color: theme.ink, margin: "4px 0 0" }}>
          {blend.name}
        </h2>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel>Set out feeling</SectionLabel>
        <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 18, color: theme.inkSoft, marginTop: 6 }}>
          {intent ? `"${intent}"` : <span style={{ color: theme.ash, fontStyle: "normal" }}>—</span>}
        </div>
      </div>

      {/* Per-mood confirmation — "you aimed for calm + focus; did they land?" */}
      {safeMoods.length > 0 && (
        <div style={{ margin: "20px 0" }}>
          <SectionLabel n="ii">Did each one land?</SectionLabel>
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 4 }}>
            you aimed for {safeMoods.join(" + ")}
          </div>
          <div style={{
            marginTop: 10, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
            background: theme.cream, overflow: "hidden",
          }}>
            {safeMoods.map((m, i) => (
              <div key={m} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
              }}>
                <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink }}>
                  <em style={{ color: theme.terra, fontStyle: "normal" }}>{m}</em>?
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    ["landed",  true],
                    ["missed",  false],
                  ].map(([label, v]) => (
                    <button key={label} onClick={() => setLanded({ ...landed, [m]: v })} style={{
                      fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.02em",
                      padding: "5px 11px", borderRadius: 999,
                      border: `1px solid ${landed[m] === v ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                      background: landed[m] === v ? (v ? theme.sageDeep : theme.terra) : "transparent",
                      color: landed[m] === v ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "iii" : "ii"}>
          {safeMoods.length > 0 ? "Anything else showed up?" : "Feeling now"}
        </SectionLabel>
        {safeMoods.length > 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 4 }}>
            unexpected moods from the cup
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {MOODS.filter(m => !safeMoods.includes(m)).map(m => (
            <Chip key={m} active={extra.includes(m)} onClick={() => toggleExtra(m)} tone="sage">{m}</Chip>
          ))}
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "iv" : "iii"}>Taste</SectionLabel>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setTaste(i)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 2, fontSize: 22, color: i <= taste ? theme.terra : theme.rule,
            }}>●</button>
          ))}
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "v" : "iv"}>Marginalia</SectionLabel>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="a line or two, just for you"
          style={{
            marginTop: 8, width: "100%", minHeight: 60,
            background: "transparent", border: `1px solid ${theme.rule}`, borderRadius: 8,
            padding: 10, fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            resize: "vertical", outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
        <Toggle label="Save blend to library as favorite" value={save} onChange={setSave} />

        {/* Rename input — only when saving a user-composed blend.
            Curated blends (Dusk Lullaby, Moroccan Mint, etc.) keep their
            original names; only on-the-fly compositions get renamed. */}
        {save && isComposed && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
              textTransform: "uppercase", color: theme.ash,
            }}>
              name this blend
            </div>
            <input
              value={rename}
              onChange={(e) => setRename(e.target.value)}
              placeholder={blend?.name || "untitled blend"}
              style={{
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                outline: "none", padding: 0,
                fontStyle: rename ? "normal" : "italic",
              }}
            />
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
              color: theme.ash, lineHeight: 1.4,
            }}>
              {rename
                ? `will save as "${rename}"`
                : `will save as "${blend?.name}" — tap above to rename`}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => onSubmit({ landed, extra, taste, note, save, rename: rename.trim() })} style={{
        width: "100%", fontFamily: ff.serif, fontSize: 17,
        padding: "14px", borderRadius: 10,
        background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
      }}>
        log it →
      </button>
    </div>
  );
};

const Toggle = ({ label, value, onChange }) => (
  <label style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
    fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft, cursor: "pointer",
  }}>
    <span>{label}</span>
    <span onClick={() => onChange(!value)} style={{
      width: 34, height: 20, borderRadius: 999,
      background: value ? theme.sageDeep : theme.rule,
      position: "relative", transition: "background .2s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 16 : 2,
        width: 16, height: 16, borderRadius: "50%", background: theme.cream,
        transition: "left .2s",
      }} />
    </span>
  </label>
);

/* ──────────────────────────────────────────────────────────────
   Screen: LIBRARY
   ────────────────────────────────────────────────────────────── */

const LibraryList = ({ blends, compact, go, startBrew, highlightId }) => {
  if (!blends || blends.length === 0) {
    return (
      <EmptyState
        icon={<Leaf size={24} c={theme.sage} />}
        title="No saved blends yet"
        body="The blends you save or adopt from friends will live here."
        cta={{ label: "compose your first cup →", onClick: () => go("compose") }}
      />
    );
  }
  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      {!compact && <SectionLabel n="i">Your saved blends</SectionLabel>}
      <div style={{ marginTop: compact ? 0 : 10 }}>
        {blends.map((b, i) => (
          <BlendListRow
            key={b.id} b={b} first={i === 0}
            highlighted={highlightId === b.id}
            go={go} startBrew={startBrew}
          />
        ))}
      </div>
    </div>
  );
};

const BlendListRow = ({ b, first, author, go, startBrew, highlighted }) => {
  const { unit, weightUnit } = useUnit();
  return (
  <button onClick={() => startBrew(b, "curious", [b.mood])} style={{
    width: "100%", textAlign: "left",
    background: highlighted ? "rgba(181,130,89,0.08)" : "transparent",
    border: "none",
    borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
    borderLeft: highlighted ? `3px solid ${theme.terra}` : "3px solid transparent",
    padding: "14px 12px 14px 9px", cursor: "pointer",
    display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
  }}>
    <div>
      <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2 }}>
        {b.name}
        {author && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash, marginLeft: 6 }}>· {author}</span>}
      </div>
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.ash, marginTop: 2 }}>
        {b.subtitle}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {b.ingredients.map(ing => INGREDIENTS[ing.id] && (
          <span
            key={ing.id}
            onClick={(e) => {
              e.stopPropagation();
              go("ingredient", ing.id);
            }}
            style={{
              fontFamily: ff.sans, fontSize: 10.5, color: theme.inkSoft, letterSpacing: "0.02em",
              padding: "2px 7px", background: theme.cream, borderRadius: 999, border: `1px solid ${theme.ruleSoft}`,
              cursor: "pointer",
            }}
          >{INGREDIENTS[ing.id].name}</span>
        ))}
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink }}>{formatTempShort(b.tempC, b.tempC, unit)}</div>
      <div style={{ fontFamily: ff.mono, fontSize: 10.5, color: theme.ash }}>{mmss(b.timeS)}</div>
    </div>
  </button>
  );
};

// Shared empty-state component used across library sub-tabs, profile stats,
// and anywhere else content might be genuinely absent. Keeps the "nothing
// here yet" voice consistent — quiet, inviting, never scolding.
const EmptyState = ({ icon, title, body, cta }) => (
  <div style={{
    padding: "22px 20px", borderRadius: 12,
    background: theme.cream, border: `1px dashed ${theme.rule}`,
    textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  }}>
    {icon && <div style={{ marginBottom: 2 }}>{icon}</div>}
    <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink, lineHeight: 1.2 }}>
      {title}
    </div>
    {body && (
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, lineHeight: 1.5, maxWidth: 280 }}>
        {body}
      </div>
    )}
    {cta && (
      <button onClick={cta.onClick} style={{
        marginTop: 6,
        fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.04em",
        padding: "8px 14px", borderRadius: 999,
        background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
      }}>{cta.label}</button>
    )}
  </div>
);

const LibraryScreen = ({ go, startBrew, openBlend, sessions, savedBlendIds, pantryIds, togglePantry }) => {
  const [tab, setTab] = useState("blends"); // blends | history | shelf
  const [filter, setFilter] = useState("all");

  // "The Shelf" — ingredient catalog browser state
  const [shelfSearch, setShelfSearch] = useState("");
  const [shelfCategory, setShelfCategory] = useState("all");
  const [pantryOnly, setPantryOnly] = useState(false);

  // Filter saved blends (power user's four, mid user's one, new user's none).
  const savedBlends = BLENDS.filter(b => savedBlendIds.has(b.id));
  const yourSessions = sessions.filter(s => s.who === "you");

  // All ingredients, filtered by search / category / pantry-toggle.
  const shelfItems = Object.entries(INGREDIENTS).filter(([id, ing]) => {
    if (pantryOnly && !pantryIds.has(id)) return false;
    if (shelfCategory !== "all" && ing.category !== shelfCategory) return false;
    if (shelfSearch.trim()) {
      const q = shelfSearch.trim().toLowerCase();
      const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
        .join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, borderBottom: `1px solid ${theme.ruleSoft}` }}>
        {[
          ["blends",  "Blends",    savedBlends.length],
          ["history", "Check-ins", yourSessions.length],
          ["shelf",   "Ingredients", Object.keys(INGREDIENTS).length],
        ].map(([k, label, count]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: "transparent", border: "none",
            fontFamily: ff.serif, fontSize: 15, color: tab === k ? theme.ink : theme.ash,
            padding: "6px 0 10px", cursor: "pointer",
            borderBottom: tab === k ? `2px solid ${theme.terra}` : "2px solid transparent",
            marginBottom: -1,
            display: "flex", alignItems: "baseline", gap: 5,
          }}>
            {label}
            {count > 0 && (
              <span style={{
                fontFamily: ff.mono, fontSize: 10, color: tab === k ? theme.terra : theme.ash, opacity: 0.75,
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "blends" && (
        <>
          {savedBlends.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {["all", "calm", "focus", "energy", "comfort", "what worked"].map(f => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
              ))}
            </div>
          )}
          <LibraryList blends={savedBlends} compact go={go} startBrew={startBrew} />
        </>
      )}

      {tab === "history" && (
        <>
          {yourSessions.length === 0 ? (
            <EmptyState
              icon={<Kettle size={26} c={theme.terra} />}
              title="Your journal starts with your first cup"
              body="Every cup you brew and log lands here, with intent, taste, and effect side-by-side."
              cta={{ label: "set a cup out →", onClick: () => go("compose") }}
            />
          ) : (
            <>
              <SectionLabel n="i">Every cup you've logged</SectionLabel>
              <div style={{ marginTop: 12 }}>
                {yourSessions.map((s, i) => (
                  <SessionRow key={s.id} s={s} openBlend={openBlend} first={i === 0} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "shelf" && (
        <>
          {/* Search input */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            marginBottom: 10,
          }}>
            <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
            <input
              value={shelfSearch}
              onChange={(e) => setShelfSearch(e.target.value)}
              placeholder="search the shelf…"
              style={{
                flex: 1, background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: shelfSearch ? "normal" : "italic",
                fontSize: 14, color: theme.ink, outline: "none",
              }}
            />
            {shelfSearch && (
              <button onClick={() => setShelfSearch("")} style={{
                background: "transparent", border: "none", color: theme.ash,
                fontSize: 12, cursor: "pointer",
              }}>×</button>
            )}
          </div>

          {/* Category filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {[
              ["all",       "all"],
              ["true tea",  "teas"],
              ["herbal",    "herbals"],
              ["flower",    "flowers"],
              ["spice",     "spices"],
              ["adaptogen", "adaptogens"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setShelfCategory(key)} style={{
                fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                padding: "3px 9px", borderRadius: 999,
                border: `1px solid ${shelfCategory === key ? theme.ink : theme.ruleSoft}`,
                background: shelfCategory === key ? theme.ink : "transparent",
                color: shelfCategory === key ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>

          {/* Pantry-only toggle + count */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, padding: "2px 0",
          }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: ff.sans, fontSize: 11.5, color: theme.inkSoft, cursor: "pointer",
            }}>
              <span style={{
                width: 28, height: 16, borderRadius: 999,
                background: pantryOnly ? theme.sageDeep : theme.rule,
                position: "relative", transition: "background .2s",
                flexShrink: 0,
              }} onClick={() => setPantryOnly(!pantryOnly)}>
                <span style={{
                  position: "absolute", top: 2, left: pantryOnly ? 14 : 2,
                  width: 12, height: 12, borderRadius: "50%", background: theme.cream,
                  transition: "left .2s",
                }} />
              </span>
              <span onClick={() => setPantryOnly(!pantryOnly)}>only what's in my pantry</span>
            </label>
            <span style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            }}>
              {shelfItems.length} of {Object.keys(INGREDIENTS).length}
            </span>
          </div>

          {/* The catalog grid */}
          {shelfItems.length === 0 ? (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.ash, padding: "18px 0", textAlign: "center",
            }}>
              no ingredients match your filters.
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
            }}>
              {shelfItems.map(([id, ing]) => {
                const inPantry = pantryIds.has(id);
                return (
                  <button key={id} onClick={() => go("ingredient", id)} style={{
                    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                    borderRadius: 10, padding: "12px 12px", textAlign: "left", cursor: "pointer",
                    display: "flex", flexDirection: "column", gap: 4,
                    opacity: inPantry ? 1 : 0.6,
                    position: "relative",
                  }}>
                    {/* Pantry badge — only shown for items you own */}
                    {inPantry && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        width: 18, height: 18, borderRadius: "50%",
                        background: theme.sage,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: theme.cream, fontSize: 10, fontWeight: "bold",
                      }}>✓</div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: inPantry ? 22 : 0 }}>
                      {ing.category === "flower" && <Flower size={18} c={theme.ochre} />}
                      {ing.category === "herbal" && <Sprig size={18} c={theme.sage} />}
                      {ing.category === "true tea" && <Leaf size={18} c={theme.sageDeep} />}
                      {ing.category === "spice" && <Flower size={18} c={theme.terra} />}
                      {ing.category === "adaptogen" && <Sprig size={18} c={theme.plum} />}
                      <span style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>
                        {ing.subcategory || ing.category}
                      </span>
                    </div>
                    <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, marginTop: 6 }}>
                      {ing.name}
                    </div>
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>
                      {ing.latin}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: INGREDIENT DETAIL
   ────────────────────────────────────────────────────────────── */

const IngredientDetail = ({ id, onClose, pantryIds, togglePantry, onOpenIngredient }) => {
  const { unit, weightUnit } = useUnit();
  const ing = INGREDIENTS[id] || INGREDIENTS.chamomile;
  const [tab, setTab] = useState("overview");

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
    }}>
      {/* hero */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.cream} 0%, ${theme.paper} 100%)`,
        padding: "22px 22px 18px",
        borderBottom: `1px solid ${theme.rule}`,
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>← back</button>
          <div style={{ flex: 1 }} />
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {ing.category === "flower"    && <Flower size={34} c={theme.ochre} />}
            {ing.category === "herbal"    && <Sprig  size={34} c={theme.sage} />}
            {ing.category === "true tea"  && <Leaf   size={34} c={theme.sageDeep} />}
            {ing.category === "spice"     && <Flower size={34} c={theme.terra} />}
            {ing.category === "adaptogen" && <Sprig  size={34} c={theme.plum} />}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
              {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
            </div>
            <h1 style={{ fontFamily: ff.serif, fontSize: 32, fontWeight: 400, color: theme.ink, margin: "2px 0 0", lineHeight: 1.05 }}>
              {ing.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {ing.latin}
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 16, marginTop: 18, borderBottom: `1px solid ${theme.ruleSoft}` }}>
          {[
            ["overview", "Overview"],
            ["brewing",  "Brewing"],
            ["pairings", "Pairings"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontSize: 14, color: tab === k ? theme.ink : theme.ash,
              padding: "6px 0 10px", cursor: "pointer",
              borderBottom: tab === k ? `2px solid ${theme.terra}` : "2px solid transparent",
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 22px 130px" }}>
        {tab === "overview" && (
          <>
            <p style={{ fontFamily: ff.serif, fontSize: 15.5, color: theme.inkSoft, lineHeight: 1.6, margin: 0 }}>
              {ing.blurb}
            </p>

            <div style={{ margin: "22px 0 14px" }}><SectionLabel n="i">Effect</SectionLabel></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ing.effects.map(([tag, n]) => (
                <EffectBar key={tag} label={tag} value={n} color={theme.sage} />
              ))}
            </div>

            <div style={{ margin: "22px 0 10px" }}><SectionLabel n="ii">Flavor notes</SectionLabel></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ing.flavors.map(f => (
                <span key={f} style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.terra,
                  padding: "4px 10px", border: `1px solid ${theme.rule}`, borderRadius: 999,
                  background: theme.cream,
                }}>{f}</span>
              ))}
            </div>

            {ing.headsUp && (
              <div style={{
                marginTop: 22, padding: 12, borderRadius: 10,
                background: "rgba(176, 84, 47, 0.07)",
                border: `1px solid rgba(176, 84, 47, 0.2)`,
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: theme.terra, color: theme.cream,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: ff.serif, fontSize: 12, fontStyle: "italic", flexShrink: 0,
                }}>!</div>
                <div>
                  <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.terra }}>
                    Heads up
                  </div>
                  <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft, marginTop: 3, lineHeight: 1.5 }}>
                    {ing.headsUp}
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginTop: 4 }}>
                    (not medical advice)
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
              <button
                onClick={() => togglePantry && togglePantry(id)}
                style={{
                  ...iconBtn(),
                  flex: 1,
                  background: pantryIds && pantryIds.has(id) ? theme.cream : "transparent",
                  borderColor: pantryIds && pantryIds.has(id) ? theme.sageDeep : theme.rule,
                  color: pantryIds && pantryIds.has(id) ? theme.sageDeep : theme.inkSoft,
                }}
              >
                {pantryIds && pantryIds.has(id) ? "✓ in pantry" : "+ pantry"}
              </button>
              <button style={{
                flex: 2, fontFamily: ff.serif, fontSize: 15,
                padding: "12px 14px", borderRadius: 10,
                background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
              }}>use in a blend →</button>
            </div>
          </>
        )}

        {tab === "brewing" && (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <StatCard label="Water" value={formatTempRange(ing.tempC[0], ing.tempC[1], unit)} />
              <StatCard label="Steep" value={`${Math.round(ing.timeS[0]/60)}–${Math.round(ing.timeS[1]/60)} min`} />
              <StatCard label="Caffeine" value={ing.caffeine > 0 ? `${ing.caffeine} mg` : "none"} />
            </div>

            <SectionLabel n="i">Brew for a different effect</SectionLabel>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {(ing.variants || [
                { intent: "calm",       tempC: ing.tempC[0], timeS: ing.timeS[0], note: "Light steep for a softer cup." },
                { intent: "everyday",   tempC: ing.tempC[1], timeS: Math.round((ing.timeS[0]+ing.timeS[1])/2), note: "Balanced standard." },
                { intent: "full",       tempC: ing.tempC[1], timeS: ing.timeS[1], note: "Fuller effect, slightly more bitter." },
              ]).map((v, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 10,
                  background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
                      for <em style={{ color: theme.terra }}>{v.intent}</em>
                    </div>
                    <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.ash }}>
                      {formatTempShort(v.tempC, v.tempC, unit)} · {mmss(v.timeS)}
                    </div>
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft, marginTop: 4 }}>
                    {v.note}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22 }}><SectionLabel n="ii">Dose</SectionLabel></div>
            <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink, marginTop: 6 }}>{ing.dose}</div>
          </>
        )}

        {tab === "pairings" && (
          <>
            <SectionLabel n="i">Pairs well with</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {(ing.pairs || []).map(pid => INGREDIENTS[pid] && (
                <button key={pid} onClick={() => onOpenIngredient && onOpenIngredient(pid)} style={{
                  fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft,
                  padding: "8px 14px", borderRadius: 999,
                  background: theme.cream, border: `1px solid ${theme.rule}`, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {INGREDIENTS[pid].category === "flower"    && <Flower size={14} c={theme.ochre} />}
                  {INGREDIENTS[pid].category === "herbal"    && <Sprig  size={14} c={theme.sage} />}
                  {INGREDIENTS[pid].category === "true tea"  && <Leaf   size={14} c={theme.sageDeep} />}
                  {INGREDIENTS[pid].category === "spice"     && <Flower size={14} c={theme.terra} />}
                  {INGREDIENTS[pid].category === "adaptogen" && <Sprig  size={14} c={theme.plum} />}
                  {INGREDIENTS[pid].name} ↗
                </button>
              ))}
            </div>

            <div style={{ marginTop: 22 }}><SectionLabel n="ii">Traditional pairings</SectionLabel></div>
            <div style={{
              marginTop: 10, padding: 14,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.inkSoft, lineHeight: 1.6,
            }}>
              Honey, warm milk, a thin sliver of fresh ginger. Paired most historically with lavender
              and lemon balm in European evening tisanes.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div style={{
    flex: 1, padding: 12, borderRadius: 10,
    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
  }}>
    <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>{label}</div>
    <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, marginTop: 3 }}>{value}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Screen: BLEND DETAIL (overlay)
   Opens when a session card or blend link is tapped. Shows the
   recipe, brewing params, effect prediction, and — if opened from
   a friend's session — their review in a pull-quote up top.
   ────────────────────────────────────────────────────────────── */

const BlendDetail = ({ blendId, onClose, onOpenIngredient, onBrew, isFavorite, onToggleFavorite, sessions, go }) => {
  const { unit, weightUnit } = useUnit();
  const b = getBlend(blendId);
  if (!b) return null;

  // Filter the user's sessions for this specific blend. These become
  // the "Your log with this blend" section — aggregate stats + recent notes.
  const mySessions = (sessions || []).filter(s => s.who === "you" && s.blendId === blendId);
  const brewCount = mySessions.length;
  const avgTaste = brewCount > 0
    ? Math.round((mySessions.reduce((a, s) => a + (s.taste || 0), 0) / brewCount) * 10) / 10
    : 0;

  // Find the most common "actual" outcome across your brews. For single-mood
  // actuals this is easy; for comma-joined actuals we split and tally.
  const actualTally = {};
  mySessions.forEach(s => {
    (s.actual || "").split(",").map(x => x.trim()).filter(Boolean).forEach(a => {
      actualTally[a] = (actualTally[a] || 0) + 1;
    });
  });
  const topActual = Object.entries(actualTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  const intentTally = {};
  mySessions.forEach(s => {
    if (s.intent) intentTally[s.intent] = (intentTally[s.intent] || 0) + 1;
  });
  const topIntent = Object.entries(intentTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
    }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.cream} 0%, ${theme.paper} 100%)`,
        padding: "22px 22px 20px",
        borderBottom: `1px solid ${theme.rule}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>← back</button>
          <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            The Blend
          </div>
          {onToggleFavorite ? (
            <button onClick={onToggleFavorite} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "4px 6px",
              fontSize: 20, lineHeight: 1,
              color: isFavorite ? theme.ochre : theme.ash,
            }} title={isFavorite ? "remove from favorites" : "add to favorites"}>
              {isFavorite ? "★" : "☆"}
            </button>
          ) : <div style={{ width: 40 }} />}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Flower size={28} c={theme.ochre} />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
                for {b.mood}
              </span>
              {b.tradition && (
                <span style={{
                  fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: theme.ochre, border: `1px solid ${theme.ochre}`, borderRadius: 3,
                  padding: "1px 6px",
                }}>{b.tradition}</span>
              )}
            </div>
            <h1 style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, margin: "2px 0 0", lineHeight: 1.05 }}>
              {b.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 3 }}>
              {b.subtitle}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px 32px" }}>
        {/* Ingredients */}
        <SectionLabel n="i">The recipe</SectionLabel>
        <div style={{
          marginTop: 10, padding: "4px 14px", borderRadius: 10,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
        }}>
          {b.ingredients.map((ing, i) => {
            const meta = INGREDIENTS[ing.id];
            if (!meta) return null;
            return (
              <button key={ing.id} onClick={() => onOpenIngredient(ing.id)} style={{
                width: "100%", textAlign: "left", background: "transparent",
                border: "none", borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                padding: "10px 0", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <div>
                  <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                    {meta.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>
                    {meta.latin}
                  </div>
                </div>
                <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft }}>
                  {formatAmount(ing.g, meta.category, weightUnit)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Brewing */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="ii">Brewing</SectionLabel>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard label="Water" value={formatTemp(b.tempC, unit)} />
          <StatCard label="Steep" value={mmss(b.timeS)} />
          {b.ml && <StatCard label="Volume" value={`${b.ml} ml`} />}
        </div>

        {/* Effects */}
        {b.effects && b.effects.length > 0 && (
          <>
            <div style={{ margin: "22px 0 10px" }}>
              <SectionLabel n="iii">Predicted effect</SectionLabel>
            </div>
            <div style={{
              padding: 14, borderRadius: 10,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {b.effects.map(([tag, n], i) => (
                <EffectBar
                  key={tag}
                  label={tag}
                  value={n}
                  color={
                    tag === "bitterness" ? theme.terra
                    : i === 0           ? theme.sage
                    : i === 1           ? theme.ochre
                    : theme.sky
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Your log with this blend — aggregates + recent sessions */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="iv">Your log with this blend</SectionLabel>
        </div>
        {brewCount === 0 ? (
          <div style={{
            padding: "16px 18px", borderRadius: 10,
            background: theme.cream, border: `1px dashed ${theme.ruleSoft}`,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, textAlign: "center",
          }}>
            No log for this blend yet.<br />
            Brew it and your notes will live here.
          </div>
        ) : (
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          }}>
            {/* Aggregate stats — one quiet line */}
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.inkSoft, lineHeight: 1.5,
              paddingBottom: brewCount > 1 ? 10 : 0,
              borderBottom: brewCount > 1 ? `1px solid ${theme.ruleSoft}` : "none",
              marginBottom: brewCount > 1 ? 10 : 0,
            }}>
              {brewCount === 1 ? (
                <>Brewed once.</>
              ) : (
                <>
                  Brewed {brewCount} times · average{" "}
                  <span style={{ color: theme.terra, letterSpacing: "0.1em" }}>
                    {"●".repeat(Math.round(avgTaste))}
                    <span style={{ color: theme.rule }}>{"●".repeat(5 - Math.round(avgTaste))}</span>
                  </span>
                  {topIntent && topActual && (
                    <>
                      {" "}· usually lands <span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{topActual}</span>
                      {" "}after <span style={{ color: theme.plum, fontStyle: "normal" }}>"{topIntent}"</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Recent sessions — up to 3 most recent */}
            <div>
              {mySessions.slice(0, 3).map((s, i) => (
                <div key={s.id} style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                  display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
                  }}>
                    <div style={{ fontSize: 11.5, color: theme.ash, letterSpacing: "0.03em", minWidth: 0 }}>
                      <span style={{ fontStyle: "italic", fontFamily: ff.serif }}>{s.intent}</span>
                      <span style={{ margin: "0 5px", color: theme.rule }}>→</span>
                      <span style={{ color: theme.sageDeep }}>{s.actual}</span>
                      <span style={{ margin: "0 8px", color: theme.rule }}>·</span>
                      <span style={{ color: theme.terra, letterSpacing: "0.1em" }}>
                        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5 - s.taste)}</span>
                      </span>
                    </div>
                    <span style={{ fontFamily: ff.sans, fontSize: 10, color: theme.ash, letterSpacing: "0.08em", flexShrink: 0 }}>
                      {s.ago}
                    </span>
                  </div>
                  {s.note && (
                    <div style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                      color: theme.inkSoft, lineHeight: 1.4,
                      paddingLeft: 8, borderLeft: `2px solid ${theme.ruleSoft}`,
                    }}>
                      "{s.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* See all link — only if there are more than 3 */}
            {mySessions.length > 3 && go && (
              <button onClick={() => { onClose(); go("library"); }} style={{
                marginTop: 4, width: "100%",
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                cursor: "pointer", padding: "8px 0 0",
                textAlign: "right",
              }}>
                see all {mySessions.length} in Apothecary →
              </button>
            )}
          </div>
        )}

        <button onClick={onBrew} style={{
          marginTop: 22, width: "100%",
          fontFamily: ff.serif, fontSize: 17,
          padding: "14px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
        }}>
          <Kettle size={20} c={theme.cream} />
          Brew this cup →
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Screen: PROFILE
   ────────────────────────────────────────────────────────────── */

const ProfileScreen = ({ go, sessions, savedBlendIds, pantryIds, seedMode, setSeedMode }) => {
  const { unit, setUnit, weightUnit, setWeightUnit } = useUnit();

  const yourSessions = sessions.filter(s => s.who === "you");
  const cupCount = yourSessions.length;
  const blendCount = savedBlendIds.size;
  const shelfCount = pantryIds.size;

  // Compute a simple prediction-match rate: did the target mood land?
  // Here we fake it by checking actual ≈ intent — good enough for the
  // mock and correctly degrades to 0 when no sessions exist.
  const matched = yourSessions.filter(s => {
    const hit = (s.actual || "").toLowerCase();
    return ["calm", "settled", "focused", "ready", "lifted", "energy", "warm", "refreshed"].includes(hit);
  }).length;
  const matchPct = cupCount > 0 ? Math.round((matched / cupCount) * 100) : 0;

  // Badges earned by simple thresholds. Falls clean to zero for new users.
  const distinctIngredients = new Set();
  yourSessions.forEach(s => {
    const b = getBlend(s.blendId);
    if (b) b.ingredients.forEach(ing => distinctIngredients.add(ing.id));
  });

  const badges = [
    { name: "First Brewing",    earned: cupCount >= 1,  desc: "The first recorded cup." },
    { name: "Sworn Evening",    earned: cupCount >= 7,  desc: "Seven calming cups before bed." },
    { name: "The Cartographer", earned: distinctIngredients.size >= 12, desc: "Logged twelve distinct ingredients." },
    { name: "Self-Knower",      earned: matched >= 10,  desc: "Prediction matched truth ten times." },
    { name: "The Lavandière",   earned: false,          desc: "Try every flower in the catalog." },
    { name: "Dawn Watcher",     earned: false,          desc: "Five cups before 7am." },
  ];
  const earnedCount = badges.filter(b => b.earned).length;

  const isEmptyUser = cupCount === 0 && blendCount === 0;

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Identity card */}
      <div style={{
        border: `1px solid ${theme.rule}`, borderRadius: 14,
        padding: 20, background: theme.cream,
        position: "relative", overflow: "hidden",
      }}>
        {/* faux stamp — only appears once they've earned it */}
        {cupCount >= 1 && (
          <div style={{
            position: "absolute", top: 14, right: 14,
            width: 60, height: 60, borderRadius: "50%",
            border: `2px dashed ${theme.terra}`, opacity: 0.35,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: "rotate(-8deg)",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.terra,
            textAlign: "center", lineHeight: 1.1,
          }}>kept<br/>since<br/>'24</div>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: ff.serif, fontSize: 26, color: theme.terra,
          }}>J</div>
          <div>
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
              {isEmptyUser ? "a new keeper" : "Keeper of the shelf"}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 24, color: theme.ink, lineHeight: 1.1 }}>Tommy M.</div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {isEmptyUser
                ? "private · journal is still empty"
                : `private · ${cupCount} cup${cupCount !== 1 ? "s" : ""} · ${blendCount} blend${blendCount !== 1 ? "s" : ""}`
              }
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 16 }}>
          <Stat label="Cups"     value={cupCount} />
          <Stat label="Blends"   value={blendCount} />
          <Stat label="On shelf" value={shelfCount} />
          <Stat label="Badges"   value={earnedCount} />
        </div>
      </div>

      {/* self-knowledge */}
      <div style={{ margin: "24px 0 12px" }}><SectionLabel n="i">What you've learned about yourself</SectionLabel></div>
      <div style={{
        padding: 14, borderRadius: 10,
        border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
      }}>
        {cupCount === 0 ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55 }}>
            Self-knowledge grows from a few cups in. Log three or four
            brews with real intent and the patterns start showing up here.
          </div>
        ) : cupCount < 3 ? (
          <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft, lineHeight: 1.55 }}>
            You've logged {cupCount} cup{cupCount !== 1 ? "s" : ""}. Keep going — a few more brews
            and patterns about what lands for you will start to emerge.
          </div>
        ) : (
          <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.inkSoft, lineHeight: 1.55 }}>
            Across {cupCount} logged cups, your predicted-to-actual match rate is
            {" "}<em style={{ color: theme.terra }}>{matchPct}%</em>. You've explored
            {" "}<em style={{ color: theme.sageDeep }}>{distinctIngredients.size}</em> distinct ingredients so far.
          </div>
        )}
      </div>

      <div style={{ margin: "22px 0 12px" }}><SectionLabel n="ii">Badges</SectionLabel></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {badges.map(b => (
          <div key={b.name} style={{
            padding: 12, borderRadius: 10,
            background: b.earned ? theme.cream : "transparent",
            border: `1px ${b.earned ? "solid" : "dashed"} ${theme.rule}`,
            opacity: b.earned ? 1 : 0.55,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              {b.earned ? <Flower size={18} c={theme.ochre} /> : <Flower size={18} c={theme.ash} />}
              {b.earned && <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10, color: theme.terra }}>sealed</span>}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.ink, lineHeight: 1.2 }}>{b.name}</div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.ash, marginTop: 3 }}>{b.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "22px 0 10px" }}><SectionLabel n="iii">Preferences</SectionLabel></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Temperature</span>
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${theme.rule}`, borderRadius: 999,
            padding: 2, background: theme.cream,
          }}>
            {["C", "F"].map(u => (
              <button key={u} onClick={() => setUnit(u)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: unit === u ? theme.ink : "transparent",
                color: unit === u ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>°{u}</button>
            ))}
          </div>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Weight</span>
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${theme.rule}`, borderRadius: 999,
            padding: 2, background: theme.cream,
          }}>
            {[
              ["tsp", "tsp"],
              ["g",   "g"  ],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setWeightUnit(val)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: weightUnit === val ? theme.ink : "transparent",
                color: weightUnit === val ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <Toggle label="Notify when timer completes" value={true} onChange={() => {}} />
        <Toggle label="Quiet hours (10pm–7am)" value={true} onChange={() => {}} />
      </div>

      {/* Dev toolbar — seed-mode selector for testing empty/mid/power states */}
      <div style={{ margin: "26px 0 10px" }}>
        <SectionLabel n="iv">Dev — seed data</SectionLabel>
      </div>
      <div style={{
        padding: 12, borderRadius: 10,
        border: `1px dashed ${theme.rule}`, background: "rgba(181,130,89,0.04)",
      }}>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
          marginBottom: 10, lineHeight: 1.45,
        }}>
          Swap the app's state between snapshots to test empty-user,
          mid-journey, and power-user flows. Real app removes this.
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(SEED_MODES).map(([key, m]) => (
            <button key={key} onClick={() => setSeedMode(key)} style={{
              fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.03em",
              padding: "6px 12px", borderRadius: 999,
              border: `1px solid ${seedMode === key ? theme.ink : theme.rule}`,
              background: seedMode === key ? theme.ink : "transparent",
              color: seedMode === key ? theme.cream : theme.inkSoft,
              cursor: "pointer",
              flex: 1, minWidth: 80,
            }}>{m.label}</button>
          ))}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.ash,
          marginTop: 10, lineHeight: 1.45,
        }}>
          {SEED_MODES[seedMode].description}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, marginTop: 3 }}>{label}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Tab bar
   ────────────────────────────────────────────────────────────── */

const TabBar = ({ tab, setTab }) => {
  const tabs = [
    { k: "home",     label: "Home",     icon: <Kettle size={18} /> },
    { k: "compose",  label: "Compose",  icon: <Flower size={18} /> },
    { k: "library",  label: "Shelf",  icon: <Leaf size={18} /> },
    { k: "profile",  label: "Profile",  icon: <Sprig size={18} /> },
  ];

  return (
    <div style={{
      flexShrink: 0,
      padding: "10px 12px 22px",
      background: "rgba(243,236,220,0.94)",
      backdropFilter: "blur(8px)",
      borderTop: `1px solid ${theme.rule}`,
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4,
    }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 3,
          padding: "4px 2px",
          color: tab === t.k ? theme.terra : theme.ash,
          minWidth: 0,
        }}>
          {React.cloneElement(t.icon, { c: tab === t.k ? theme.terra : theme.ash })}
          <span style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Phone frame
   ────────────────────────────────────────────────────────────── */

const PhoneFrame = ({ children, label }) => {
  // On narrow screens (real mobile devices), skip the fake-phone frame
  // and render the app full-screen. Otherwise, show the frame (desktop preview).
  const [isNarrow, setIsNarrow] = React.useState(
    typeof window !== "undefined" && window.innerWidth < 500
  );
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 500);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isNarrow) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: theme.ivory,
        overflowX: "hidden",
        overflowY: "hidden",
        display: "flex", flexDirection: "column",
        // Use dynamic viewport height on modern browsers to handle mobile
        // browser chrome (address bar) gracefully; falls back to 100vh.
        height: "100dvh",
        width: "100vw",
      }}>
        {children}
      </div>
    );
  }

  return (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div style={{
      width: 380, height: 780,
      background: theme.ink,
      borderRadius: 44,
      padding: 10,
      boxShadow: "0 30px 60px -20px rgba(30,24,18,0.35), 0 10px 20px -10px rgba(30,24,18,0.2)",
    }}>
      <div style={{
        width: "100%", height: "100%",
        background: theme.ivory,
        borderRadius: 36,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* status bar */}
        <div style={{
          height: 44, display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0 24px",
          fontFamily: ff.sans, fontSize: 12.5, color: theme.ink, fontWeight: 600,
          position: "relative", zIndex: 20,
        }}>
          <span>9:41</span>
          <div style={{
            position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)",
            width: 100, height: 26, background: theme.ink, borderRadius: 20,
          }} />
          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 10 }}>●●●</span>
            <span>􀛨</span>
          </span>
        </div>
        {/* content area (scrollable) */}
        <div style={{
          position: "absolute", top: 44, left: 0, right: 0, bottom: 0,
          overflow: "hidden",
        }}>
          {children}
        </div>
      </div>
    </div>
    {label && (
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash,
      }}>{label}</div>
    )}
  </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Root app
   ────────────────────────────────────────────────────────────── */

export default function App() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // null | "steep" | "log" | "ingredient" | "blend"
  const [ingredientId, setIngredientId] = useState("chamomile");
  const [blendOverlayId, setBlendOverlayId] = useState(null);
  const [session, setSession] = useState(null);
  const [unit, setUnit] = useState("C");
  const [weightUnit, setWeightUnit] = useState("tsp");

  // Seed-mode system: swap between "new" / "mid" / "power" snapshots for
  // evaluating the UI at different stages of use.
  const [seedMode, setSeedMode] = useState("power");

  const [sessions, setSessions] = useState(SEED_MODES.power.sessions);
  const [savedBlendIds, setSavedBlendIds] = useState(new Set(SEED_MODES.power.savedBlendIds));
  const [pantryIds, setPantryIds] = useState(new Set(SEED_MODES.power.pantryIds));

  // When a saved blend is tapped from Home or elsewhere, we route through
  // Compose so the user can set intent before brewing. composePreselect tells
  // Compose which blend to show and which sub-tab to land on.
  const [composePreselect, setComposePreselect] = useState(null);

  // When seed mode changes, reset the varying state to that mode's snapshot.
  React.useEffect(() => {
    const mode = SEED_MODES[seedMode];
    if (!mode) return;
    setSessions(mode.sessions);
    setSavedBlendIds(new Set(mode.savedBlendIds));
    setPantryIds(new Set(mode.pantryIds));
  }, [seedMode]);

  const go = (to, arg) => {
    if (to === "ingredient") {
      if (arg) setIngredientId(arg);
      setOverlay("ingredient");
      return;
    }
    setTab(to);
  };

  const openBlend = (blendId) => {
    setBlendOverlayId(blendId);
    setOverlay("blend");
  };

  const startBrew = (blend, intent, targetMoods) => {
    setSession({ blend, intent, targetMoods });
    setOverlay("steep");
  };

  const togglePantry = (ingId) => {
    const next = new Set(pantryIds);
    if (next.has(ingId)) next.delete(ingId);
    else next.add(ingId);
    setPantryIds(next);
  };

  // Append a newly-logged cup to the sessions list. Called when the user
  // completes a brew+log cycle. This is what makes newly-brewed cups show
  // up in Home's "Your cups, lately" and Apothecary's history.
  const addSession = ({ blend, intent, targetMoods, landed, extra, taste, note, save, rename }) => {
    // A blend composed via forward-compose won't have an id; stash it under
    // a synthetic id so the session can reference it via getBlend().
    let blendId = blend.id;
    if (!blendId) {
      blendId = `local-${Date.now()}`;
      // If the user renamed the blend at log time, use their name. Otherwise
      // fall back to the auto-generated one. Composed blends can be awkward
      // ("Dusk Lullaby · spiced accent"), so the rename field exists to let
      // them give it a name they'll recognize in Apothecary later.
      const finalName = (rename && rename.length > 0) ? rename : blend.name;
      LOCAL_BLENDS[blendId] = { ...blend, id: blendId, name: finalName };
    }

    // Derive "actual" from what landed: prefer target moods that landed,
    // fall back to any unintended moods the user noted, then to "brewed".
    const landedMoods = (targetMoods || []).filter(m => landed?.[m]);
    const extraMoods = extra || [];
    const actual = landedMoods.length > 0 ? landedMoods.join(", ")
                 : extraMoods.length > 0 ? extraMoods.join(", ")
                 : "brewed";

    const newSession = {
      id: `sess-${Date.now()}`,
      who: "you",
      blendId,
      ago: "just now",
      intent: intent || "curious",
      actual,
      taste: taste ?? 4,
      note: note || "",
    };

    setSessions(prev => [newSession, ...prev]);

    // Honor the "save blend to library" toggle in Log.
    if (save && !savedBlendIds.has(blendId)) {
      const next = new Set(savedBlendIds);
      next.add(blendId);
      setSavedBlendIds(next);
    }
  };

  // Open Compose with a blend pre-selected — used when user taps a favorite
  // on Home or a saved blend in Apothecary. Ensures intent-capture happens
  // before brewing, per the spec's principle.
  const openInCompose = (blendId) => {
    setComposePreselect({ blendId, at: Date.now() });
    setTab("compose");
    setOverlay(null);
  };

  // Favorite/unfavorite a blend. Uses the same savedBlendIds set — a saved
  // blend IS a favorite. No second list.
  const toggleFavorite = (blendId) => {
    const next = new Set(savedBlendIds);
    if (next.has(blendId)) next.delete(blendId);
    else next.add(blendId);
    setSavedBlendIds(next);
  };

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  // Detect narrow (mobile-width) viewport so we can skip the desktop-preview
  // masthead/demo-hints/footer and render just the app at viewport size.
  const [isNarrow, setIsNarrow] = React.useState(
    typeof window !== "undefined" && window.innerWidth < 500
  );
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 500);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Extract the actual app tree (scroll region + tab bar + overlays) so we can
  // render it directly on mobile or wrap it in the desktop-preview chrome.
  const appContent = (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <div ref={scrollRef} style={{
        flex: "1 1 auto", minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}>
        {tab === "home"    && <HomeScreen    go={go} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} />}
        {tab === "compose" && <ComposeScreen go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} openBlend={openBlend} composePreselect={composePreselect} openInCompose={openInCompose} pantryIds={pantryIds} />}
        {tab === "library" && <LibraryScreen go={go} startBrew={startBrew} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} togglePantry={togglePantry} />}
        {tab === "profile" && <ProfileScreen go={go} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} seedMode={seedMode} setSeedMode={setSeedMode} />}
      </div>

      <TabBar tab={tab} setTab={(k) => { setOverlay(null); setTab(k); }} />

      {overlay === "steep" && session && (
        <SteepScreen
          blend={session.blend}
          intent={session.intent}
          targetMoods={session.targetMoods}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onDone={() => setOverlay("log")}
          onCancel={() => { setOverlay(null); setSession(null); }}
        />
      )}
      {overlay === "log" && session && (
        <LogScreen
          blend={session.blend}
          intent={session.intent}
          targetMoods={session.targetMoods}
          onSubmit={(logData) => {
            addSession({
              blend: session.blend,
              intent: session.intent,
              targetMoods: session.targetMoods,
              ...logData,
            });
            setOverlay(null);
            setSession(null);
            setTab("home");
          }}
          onCancel={() => setOverlay(null)}
        />
      )}
      {overlay === "ingredient" && (
        <IngredientDetail
          id={ingredientId}
          onClose={() => setOverlay(null)}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onOpenIngredient={(newId) => setIngredientId(newId)}
        />
      )}
      {overlay === "blend" && blendOverlayId && (
        <BlendDetail
          blendId={blendOverlayId}
          isFavorite={savedBlendIds.has(blendOverlayId)}
          onToggleFavorite={() => toggleFavorite(blendOverlayId)}
          sessions={sessions}
          go={go}
          onClose={() => setOverlay(null)}
          onOpenIngredient={(ingId) => {
            setIngredientId(ingId);
            setOverlay("ingredient");
          }}
          onBrew={() => {
            const b = getBlend(blendOverlayId);
            if (!b) return;
            startBrew(b, "curious", [b.mood]);
          }}
        />
      )}
    </div>
  );

  // Mobile: render app full-screen with no masthead/demo-hints/footer chrome.
  if (isNarrow) {
    return (
      <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
        <div style={{
          position: "fixed", inset: 0,
          background: theme.ivory,
          display: "flex", flexDirection: "column",
          height: "100dvh", width: "100vw",
          overflow: "hidden",
          fontFamily: ff.sans,
        }}>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          {appContent}
        </div>
      </UnitContext.Provider>
    );
  }

  return (
    <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
    <div style={{
      minHeight: "100vh", width: "100%",
      background: `
        radial-gradient(ellipse at 20% 0%, rgba(181,130,89,0.1) 0%, transparent 45%),
        radial-gradient(ellipse at 80% 100%, rgba(109,126,85,0.12) 0%, transparent 45%),
        linear-gradient(180deg, #E8DCC0 0%, #D6C6A4 100%)
      `,
      padding: "40px 20px",
      fontFamily: ff.sans,
    }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Masthead */}
      <div style={{ maxWidth: 1400, margin: "0 auto 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Flower size={22} c={theme.terra} />
          <div style={{
            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.32em",
            textTransform: "uppercase", color: theme.inkSoft,
          }}>
            An Apothecary's Journal — for the Quiet Cup
          </div>
          <Flower size={22} c={theme.terra} />
        </div>
        <h1 style={{
          fontFamily: ff.serif, fontSize: 54, fontWeight: 300, color: theme.ink,
          letterSpacing: "-0.02em", margin: "6px 0 4px", lineHeight: 1,
        }}>
          Herbanium
        </h1>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 15, color: theme.inkSoft,
        }}>
          Blend by mood · brew with intent · log the effect
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <Ornament w={180} c={theme.ochre} />
        </div>
      </div>

      {/* Demo hint */}
      <div style={{
        maxWidth: 1400, margin: "0 auto 24px",
        display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap",
      }}>
        <DemoHint label="Combine moods" detail="try calm + focus on Compose" />
        <DemoHint label="Traditions tab" detail="Moroccan Mint, Masala Chai, Sencha" />
        <DemoHint label="Flip seed mode" detail="Profile → Dev → try 'new user'" />
      </div>

      {/* Phones */}
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 32,
      }}>
        <PhoneFrame label="the app">
          {appContent}
        </PhoneFrame>
      </div>

      {/* Footer notes */}
      <div style={{
        maxWidth: 900, margin: "40px auto 0", textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5, color: theme.inkSoft, lineHeight: 1.6,
      }}>
        Placeholder name. "What's the tea?" reserved for the social surface.
        <br />
        Deterministic, local engine — no AI in the loop.
      </div>
    </div>
    </UnitContext.Provider>
  );
}

const DemoHint = ({ label, detail }) => (
  <div style={{
    padding: "8px 14px",
    background: "rgba(250,244,228,0.5)",
    border: `1px solid ${theme.rule}`,
    borderRadius: 999,
    fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
    display: "flex", alignItems: "center", gap: 8,
  }}>
    <span style={{ color: theme.terra, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 9.5 }}>{label}</span>
    <span style={{ color: theme.rule }}>·</span>
    <span style={{ fontFamily: ff.serif, fontStyle: "italic", color: theme.ash }}>{detail}</span>
  </div>
);

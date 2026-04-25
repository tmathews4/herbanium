/* ──────────────────────────────────────────────────────────────
   Herbanium — vocabulary descriptions

   User-facing definitions for the effect and flavor vocabulary.
   Surfaced as click-to-expand cards on ingredient and blend
   detail pages. Voice: gentle, observational, serif-friendly.

   See docs/vocabulary.md for the canonical reference. Anything
   missing here is just non-clickable in the UI; safe to extend.
   ────────────────────────────────────────────────────────────── */

export const EFFECT_DESCRIPTIONS = {
  calm: {
    summary: "A slow exhale. Quieting the chatter without dulling presence.",
    body: "GABAergic relaxation; not sedation. Lemon balm, chamomile, linden, lavender, tulsi, passionflower live here.",
  },
  soothing: {
    summary: "General comfort, warmth-of-spirit. Sweetness without sugar.",
    body: "The wrapped-blanket register — rooibos, vanilla, hojicha, licorice root. Different from calm: this is the body's cup, not the mind's.",
  },
  digestive: {
    summary: "Settles the stomach. The post-meal cup across cultures.",
    body: "Peppermint has the catalog's strongest IBS evidence (NNT≈4). Fennel, ginger, dandelion root, pu-erh all reliable here.",
  },
  uplifting: {
    summary: "Lightening, brightening, mood-lifting.",
    body: "Jasmine, bergamot, light oolongs, citrus-forward herbs. Darjeeling's muscatel character lifts this way.",
  },
  warming: {
    summary: "TCM Yang energy. Generates internal heat.",
    body: "Black teas, roasted oolongs, ripe pu-erh, ginger, cinnamon, cardamom, cloves. Ginger sets the catalog ceiling at 5.",
  },
  focus: {
    summary: "Meditative clarity. Alert without jitter.",
    body: "The L-theanine + caffeine prototype — gyokuro and matcha join at 5; sencha, dragonwell, oolong below them. Lion's mane on a longer timescale.",
  },
  energy: {
    summary: "Stimulating, awakening — the wake-up cup.",
    body: "Often the smoother caffeine + L-theanine profile, not stimulant edge. Assam at 5; matcha and yerba-mate at 4 by different mechanisms.",
  },
  sleepy: {
    summary: "Sedating, drowsiness-adjacent.",
    body: "Heavier than calm — a downward drift. Valerian sets the ceiling at 5; reishi at 4; passionflower, chamomile, ashwagandha all in this register.",
  },
  cooling: {
    summary: "TCM Yin energy. Refreshes, clarifies, reduces internal heat.",
    body: "Green tea, white tea, hibiscus, mints, light oolongs. Distinct from menthol's mouthfeel cool, though the two can co-occur.",
  },
  grounding: {
    summary: "Settling, centering, earthy.",
    body: "Reishi sets the ceiling at 5; ashwagandha at 4; ripe pu-erh, lapsang's smoke, dandelion root all pull here.",
  },

  // ── User-facing mood aliases (mapped to effects above) ──
  comfort: {
    summary: "A wrapped-blanket feeling — soothing without sedating.",
    body: "Maps to the soothing effect. Rooibos and hojicha are the prototypes; vanilla and licorice root round any blend toward this register.",
  },
  digestive: {
    summary: "Easing the body, especially the gut.",
    body: "Maps to the digestive effect. Peppermint, fennel, ginger, dandelion root, pu-erh — the post-meal cup across cultures.",
  },

  // ── Brewing-intent aliases (used by IngredientDetail Brewing tab) ──
  sleep: {
    summary: "Sedating brew — the cup pulled toward rest.",
    body: "Same register as the sleepy effect: longer steep at higher temperature pulls more apigenin (chamomile) or valerenic acid (valerian) out of the leaf.",
  },
  digestion: {
    summary: "After-the-meal brew — settling the gut.",
    body: "Same register as the digestive effect. Brisk steeps tend to favor this; long ones can tip into bitter.",
  },
  everyday: {
    summary: "The balanced standard — neither hot nor brisk.",
    body: "The middle of the recommended range, where the cup is most legible and least surprising.",
  },
  full: {
    summary: "Maximum extraction — fuller body, slightly more bitter.",
    body: "Top of the range on both temperature and time. Stronger effect, but less forgiving of leaf quality.",
  },

  // ── Bitterness (flavor by vocabulary, but extraction profiles render it as an effect bar) ──
  bitterness: {
    summary: "Tongue-back bitter taste from over-extraction.",
    body: "Catechins and tannins released past their balance point. A signal you've gone too long or too hot. Vocabulary-wise this is a flavor, not an effect — listed here only because the brewing explorer surfaces it on a strength bar.",
  },
};

export const FLAVOR_DESCRIPTIONS = {
  // ── Floral family ──
  floral: {
    summary: "Petals, perfume, soft aromatics.",
    body: "Volatile compounds that lift on first sip. Rose, jasmine, lavender, chamomile, elderflower, linden.",
  },
  heady: {
    summary: "Rich, complex, animalic-floral depth.",
    body: "The full-bloom register — jasmine's signature. Tea-community word for what perfumery calls 'indolic'.",
  },
  honeyed: { summary: "Soft amber sweetness — the dried-flower-and-honey register.", body: "Linden, chamomile, white tea, rooibos all touch this." },
  "honey-sweet": { summary: "Honey-leaning sweetness — flower nectar more than sugar.", body: "Linden's signature; soft amber sweetness that sits forward without cloying." },

  // ── Fruity family ──
  fruity: {
    summary: "Berry, stone fruit, tropical aromatics.",
    body: "Hibiscus's cranberry, elderflower's lychee, darjeeling's muscatel grape, white tea's melon.",
  },
  citrus: {
    summary: "Bright, lifting, lemon-adjacent without being sour.",
    body: "Lemongrass, lemon balm, hibiscus's tartness, ceylon's lift, darjeeling's muscatel.",
  },
  citrusy: { summary: "Citrus-leaning lift — lemon-and-rind brightness.", body: "Adjective form of citrus; lemongrass, lemon balm, linden, bergamot." },
  muscatel: { summary: "Grape-like aromatics — Darjeeling's signature.", body: "Use specifically for Darjeeling and Darjeeling-adjacent teas." },
  tart: { summary: "Fruity-acidic character.", body: "Hibiscus, rosehip — the cranberry-edge register." },
  bright: { summary: "Lively, refreshing acidity.", body: "Tea-community preference over 'acidic'. Ceylon, darjeeling, lemongrass." },
  cranberry: { summary: "Hibiscus's defining fruit-tartness.", body: "Bright sourness rounded by anthocyanins." },
  fruit: { summary: "General fruit register — most often stone fruit or berry.", body: "Oolong's peach edge, darjeeling's grape, white tea's melon." },

  // ── Vegetal family ──
  vegetal: {
    summary: "Fresh-cut greens, steamed leaves.",
    body: "Sencha's grass, gyokuro's seaweed, matcha's deep umami-vegetal, dragonwell's chestnut-bean.",
  },
  grassy: { summary: "Fresh-cut grass, green-leaf register.", body: "Sencha, dragonwell, lemongrass, lemon balm, matcha's lighter side." },
  marine: { summary: "Seaweed, oceanic notes.", body: "Distinctive to Japanese shaded greens — gyokuro especially." },
  seaweed: { summary: "Oceanic-vegetal — the kelp register.", body: "Shaded Japanese greens; matcha, gyokuro." },
  umami: { summary: "Savory, brothy depth.", body: "L-theanine + glutamate — the shaded-green signature. Matcha, gyokuro, lion's mane." },

  // ── Nutty family ──
  nutty: { summary: "Almond, chestnut, toasted-grain register.", body: "Dragonwell's chestnut, genmaicha's roasted rice, hojicha's depth." },
  chestnut: { summary: "The pan-fired Chinese green signature.", body: "Specifically Dragonwell — sweet, faintly buttery." },
  bean: { summary: "Cooked-bean vegetal register.", body: "Dragonwell and some Chinese greens." },
  malty: { summary: "Cocoa-grain depth.", body: "Assam's signature; some Ceylon and Yunnan blacks." },
  cocoa: { summary: "Chocolate-without-sugar register.", body: "Assam, ripe pu-erh, some roasted oolongs." },

  // ── Sweet family ──
  sweet: {
    summary: "Natural sugar-without-sugar, from amino acids and polysaccharides.",
    body: "Licorice root sets the ceiling at 5 (50× sucrose by weight); rooibos, vanilla, white tea hold the gentler middle.",
  },
  honey: { summary: "Soft amber sweetness — flower and dried-grass.", body: "White tea, chamomile, linden, rooibos." },
  caramel: { summary: "Browned-sugar warmth.", body: "Hojicha's roast, dandelion root, rooibos." },
  vanilla: { summary: "Creamy floral-sweet — the dessert lean.", body: "Vanilla bean's signature; lifts any blend toward dessert without sugar." },
  creamy: { summary: "Body quality, not flavor — milk-like roundness.", body: "Vanilla, gyokuro's broth, oat-base lattes." },

  // ── Roasted family ──
  roasted: { summary: "Pan-fired or oven-roasted depth.", body: "Hojicha, dark oolongs, dandelion root, gunpowder." },
  toasted: { summary: "The lighter end of roasted — pan-fired character.", body: "Hojicha, gunpowder, genmaicha's rice." },
  toasty: { summary: "Genmaicha and hojicha's signature register.", body: "Gentle browning, not char." },
  smoky: { summary: "Pine-smoke, campfire.", body: "Lapsang Souchong's signature — dried over pine fires in Fujian." },
  smoked: { summary: "Same as smoky — pine-smoke register.", body: "Lapsang Souchong; some yerba mate via barbacuá processing." },
  pine: { summary: "Resinous coniferous note.", body: "Lapsang's pine-smoke; lavender's camphor edge." },
  charcoal: { summary: "Deep-roasted register.", body: "Heavier roasts; dark oolongs, charcoal-fired teas." },
  campfire: { summary: "Lapsang's full-throat smoke note.", body: "The 'love or never again' register." },
  tar: { summary: "Heaviest-end smoke note.", body: "Old-style Lapsang — pitch-and-pine." },

  // ── Earthy family ──
  earthy: {
    summary: "Forest floor, root cellar, deep loam.",
    body: "The grounded register — pu-erh's leather, reishi's bitter wood, ashwagandha's musk, dandelion root.",
  },
  woody: { summary: "Aged-tea, roasted-oolong character.", body: "Pu-erh, hojicha, lapsang, valerian, vanilla bean." },
  wood: { summary: "Direct timber-and-bark register.", body: "Aged teas, root-based herbals." },
  mineral: { summary: "Stone, wet rock, high-mountain register.", body: "Wuyi rock oolong, gyokuro's depth, nettle, dandelion leaf." },
  mushroom: { summary: "Funghi register — the umami-earthy crossover.", body: "Reishi, lion's mane, aged pu-erh." },
  mushroomy: { summary: "Same as mushroom — funghi-vegetal earthy.", body: "Reishi's bitter side; lion's mane's seafood-mushroom." },
  loam: { summary: "Wet-soil register.", body: "Fermented teas, mushroom decoctions." },
  leather: { summary: "Animalic-aged register.", body: "Old shou pu-erh, well-aged sheng." },
  dark: { summary: "Heavy, low-pitched register.", body: "Pu-erh, deeply roasted oolongs." },

  // ── Spicy family ──
  spicy: { summary: "Pantry warmth — peppery, woody, aromatic.", body: "Cinnamon, cardamom, ginger, cloves, black pepper, tulsi." },
  spiced: { summary: "The chai cluster — warm-spice register.", body: "Cinnamon, cardamom, ginger, cloves, black pepper." },
  pungent: { summary: "Sharp aromatic heat.", body: "Black pepper, ginger, clove, valerian." },
  warm: { summary: "Pantry-warm aromatics — the cinnamon-cardamom register.", body: "Spice family; also rooibos, vanilla." },
  numbing: { summary: "Eugenol's tongue-tingling anesthetic.", body: "Cloves' signature; small amounts of black pepper." },

  // ── Herbaceous family ──
  herbaceous: { summary: "General herbal-green register.", body: "Cured leaves, garden herbs." },
  hay: { summary: "Cured-grass, dried-herbal register.", body: "Chamomile, passionflower, white tea." },
  camphor: { summary: "Cool resinous note.", body: "Lavender's signature; some old-style oolongs." },
  minty: {
    summary: "Cool exhale through the back of the throat.",
    body: "Two different cools: peppermint's menthol is direct and sharp; spearmint's carvone is sweeter and gentler.",
  },
  mint: { summary: "Same as minty — cool aromatic register.", body: "Peppermint, spearmint, lemon balm's mint family edge." },
  cool: { summary: "Mouthfeel cooling — TRPM8 activation from menthol.", body: "Peppermint, lavender, eucalyptus." },
  cooling: { summary: "Refreshing, clarifying register.", body: "Both mouthfeel (menthol) and effect (TCM Yin) — they often co-occur." },
  fresh: { summary: "Just-picked-greens register.", body: "Sencha, lemongrass, dandelion leaf." },

  // ── Mouthfeel ──
  brisk: { summary: "Lively, refreshing finish.", body: "Black teas (Assam, Ceylon) and well-made greens." },
  astringent: { summary: "Tongue-drying tannin sensation.", body: "Different from bitter. Strong black teas, over-steeped greens." },
  bitter: { summary: "Back-of-tongue taste.", body: "Catechins, gentian, dandelion, reishi, valerian. A flavor, not an effect." },
  bittersweet: { summary: "The coffee-adjacent register.", body: "Dandelion root, dark roasted oolongs." },

  // ── Other ──
  apple: { summary: "Chamomile's defining note.", body: "Soft, rounded, faintly tart-sweet." },
  aromatic: { summary: "Volatile, perfumed lift — what hits the nose before the tongue.", body: "Cardamom, lavender, jasmine, lemon balm. Often the first impression of a cup." },
  buttery: { summary: "Cream-and-butter mouthfeel — the rich vegetal register.", body: "Gyokuro, dragonwell, well-shaded greens. Comes from lipid-soluble compounds and high amino acids." },
  "caramel-roasted": { summary: "Browned-sugar plus pan-fired depth.", body: "Hojicha's signature register — caramel sweetness layered with toast." },
  clove: { summary: "Eugenol-driven warmth — sweet, woody, slightly numbing.", body: "Clove buds; trace amounts in tulsi and some allspice-touched chai blends." },
  "coffee-adjacent": { summary: "Roasted-bitter register that drinks like coffee without the bean.", body: "Dandelion root, deeply roasted hojicha, ripe pu-erh." },
  hot: { summary: "Capsaicin or zingerone heat — the throat-and-chest warmth.", body: "Ginger, black pepper, chili. Different from 'warm' aromatics." },
  licorice: { summary: "Glycyrrhizin sweetness — anise-adjacent, dense, lingering.", body: "Licorice root and star anise; touches fennel seed." },
  melon: { summary: "Honeydew-soft fruit register.", body: "White tea's signature; some shaded greens and high-altitude oolongs." },
  peppery: { summary: "Sharp aromatic bite — black pepper register.", body: "Black pepper, fresh ginger, tulsi's sharper side, watercress-adjacent greens." },
  savory: { summary: "Umami-and-broth register — the not-sweet, not-bitter axis.", body: "Matcha, gyokuro, mushroom decoctions, lion's mane." },
  "seafood-like": { summary: "Marine-mushroom register — lion's mane's signature.", body: "Crab-and-kelp aromatic that comes through in long decoctions." },
  "spinach-like": { summary: "Cooked-greens vegetal register.", body: "Matcha, gyokuro, deep-shaded sencha — the steamed-leaf cluster." },
  tannic: { summary: "Tea-tannin mouthfeel — drying without sourness.", body: "Black teas, over-steeped greens, persimmon-adjacent. Adjacent to astringent but with more grip." },
  musky: { summary: "Deep mature aromatic register.", body: "Ashwagandha, valerian, turmeric." },
  musty: { summary: "Damp-attic register — root and fungus character.", body: "Ashwagandha, reishi, aged sheng." },
  delicate: { summary: "Light-bodied, faint-aromatic register.", body: "White tea, linden, elderflower." },
  oceanic: { summary: "Marine, salt-air register.", body: "Matcha, gyokuro, kelp-adjacent greens." },
  lychee: { summary: "Tropical-floral fruit register.", body: "Elderflower's signature aromatic." },
  anise: { summary: "Fennel and licorice family register.", body: "Fennel seed, licorice root, star anise." },
  complex: { summary: "Multi-layered, hard to pin to one note.", body: "Cardamom, well-made oolong, aged pu-erh." },
};

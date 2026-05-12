/* ──────────────────────────────────────────────────────────────
   Herbanium — vocabulary descriptions

   User-facing definitions for the effect and flavor vocabulary.
   Surfaced as click-to-expand cards on ingredient, blend, and
   brewing-explorer screens. Voice: gentle, observational, serif-
   friendly.

   Shape per entry:
     - summary: one short sentence on what the register feels or
       tastes like.
     - body: ingredients that carry it, and (where the chemistry is
       well-established) the compound class responsible. Stays
       hedged where the science is uncertain — never invent a
       compound link just to fill the slot.

   See docs/vocabulary.md for the canonical reference. Anything
   missing here is just non-clickable in the UI; safe to extend.
   ────────────────────────────────────────────────────────────── */

export const EFFECT_DESCRIPTIONS = {
  calm: {
    summary: "A slow exhale. Quieting the chatter without dulling presence.",
    body: "Chamomile's apigenin and lemon balm's rosmarinic acid carry this most directly through GABAergic relaxation; linden, lavender, tulsi, and passionflower live in the same register. Not sedation — the mind quiets but stays present.",
  },
  soothing: {
    summary: "General comfort, warmth-of-spirit. Sweetness without sugar.",
    body: "The wrapped-blanket register — rooibos, vanilla, hojicha, licorice root. Licorice's glycyrrhizin and vanilla's vanillin lift any blend toward this feel. Different from calm: this is the body's cup, not the mind's.",
  },
  digestive: {
    summary: "Settles the stomach. The post-meal cup across cultures.",
    body: "Peppermint's menthol is the most studied for easing the gut; fennel's anethole, ginger's gingerol, and dandelion root's bitter compounds all pull in the same direction. Pu-erh rounds the after-meal cup through its fermented character.",
  },
  uplifting: {
    summary: "Lightening, brightening, mood-lifting.",
    body: "Jasmine, bergamot, light oolongs, and citrus-forward herbs. Linalool (lavender, bergamot) and limonene (citrus peels) are the volatile aromatics that read on the nose before the tongue; Darjeeling's muscatel character lifts the same way through its terpene-rich first flush.",
  },
  warming: {
    summary: "Generates internal heat — pantry-warm spice that reads as physical warmth.",
    body: "Black teas, roasted oolongs, and ripe pu-erh hold a steady warmth; the spice cabinet ramps it. Cinnamon and cardamom ride a calmer line, while ginger's gingerol triggers a real thermogenic response — the loudest warmer in the catalog. Cloves add eugenol's woody heat in support.",
  },
  focus: {
    summary: "Meditative clarity. Alert without jitter.",
    body: "L-theanine paired with caffeine — the shaded-green signature. Gyokuro and matcha hold the top of this register, with sencha, dragonwell, and oolong following the same chemistry at lower amplitude. Lion's mane works on a longer arc through nerve-growth-factor support.",
  },
  energy: {
    summary: "Stimulating, awakening — the wake-up cup.",
    body: "Caffeine, smoothed by L-theanine in true teas so the lift reads cleaner than coffee. Assam carries the most caffeine of the catalog; matcha lands close behind through its shaded-tea chemistry, and yerba mate adds theobromine alongside caffeine for a sustained-arc rather than peak-and-crash.",
  },
  sleepy: {
    summary: "Sedating, drowsiness-adjacent.",
    body: "Heavier than calm — a downward drift. Valerian's valerenic acid is the strongest sedative in the kitchen, with reishi's triterpenes close behind. Passionflower, chamomile (apigenin), and ashwagandha pull in the same direction more gently.",
  },
  cooling: {
    summary: "Refreshes and clarifies. The settling-down register opposite warming.",
    body: "Green tea and white tea sit here through their lighter chemistry and lower oxidation; hibiscus through its anthocyanin tartness; mints through menthol. Distinct from menthol's mouthfeel cool, though the two can co-occur.",
  },
  grounding: {
    summary: "Settling, centering, earthy.",
    body: "Reishi's triterpenes carry this most strongly, with ashwagandha's withanolides and ripe pu-erh's aged-fermentation chemistry close behind. Lapsang's pine smoke and dandelion root pull here too — the deeper, low-pitched register.",
  },

  // ── User-facing mood aliases (mapped to effects above) ──
  comfort: {
    summary: "A wrapped-blanket feeling — soothing without sedating.",
    body: "Maps to the soothing effect. Rooibos and hojicha are the prototypes; vanilla's vanillin and licorice's glycyrrhizin round any blend toward this register.",
  },

  // ── Brewing-intent aliases (used by IngredientDetail Brewing tab) ──
  // These describe brew PRESETS, not vocabulary registers.
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

  // ── Balance axes — taste-structure dimensions surfaced as gradient
  // bars in the brewing explorer. Distinct from mood/effect. ──
  bitterness: {
    summary: "Tongue-back bitter taste — total tannin pressure.",
    body: "Catechins and tannins released past their balance point — too long or too hot. Strong in black teas pulled hard, over-steeped greens, gentian, and reishi.",
  },
  sweetness: {
    summary: "Natural sugar-without-sugar — amino acids and polysaccharides.",
    body: "Licorice's glycyrrhizin (50× sucrose by weight) sets the ceiling; rooibos' aspalathin, white tea's L-theanine, and vanilla's vanillin hold the gentler middle. Balances bitterness; a sweetness-low / bitterness-high cup is the over-pull register.",
  },
  astringency: {
    summary: "Tongue-drying tannin grip — different from bitter.",
    body: "Catechins binding to mouth proteins. Strong black teas (Assam, Ceylon), over-steeped greens, persimmon-adjacent. Closely tracks bitterness but the sensation lands on the cheeks and tongue surface, not the back of the throat.",
  },
  tartness: {
    summary: "Fruity-acidic lift — bright, lemon-and-cranberry register.",
    body: "Hibiscus's anthocyanins and citric acid drive the cleanest example; rosehip and citrus-leaning herbs sit here too. Not the same as bitter — tartness is up-front and lifting, where bitterness is back-of-tongue and lingering.",
  },
  menthol: {
    summary: "Mouth-cooling sensation — TRPM8 activation.",
    body: "Peppermint's menthol is sharp and direct; spearmint's carvone is gentler and sweeter. Distinct from the cooling mood (felt-temperature register); menthol is the physical mouthfeel.",
  },
};

export const FLAVOR_DESCRIPTIONS = {
  // ── Floral family ──
  floral: {
    summary: "Petals, perfume, soft aromatics.",
    body: "Volatile terpenes that lift on first sip. Rose's geraniol, jasmine's benzyl acetate, lavender's linalool; chamomile, elderflower, and linden round out the family.",
  },
  heady: {
    summary: "Rich, complex, animalic-floral depth.",
    body: "The full-bloom register — jasmine's signature, driven by indole at trace levels (the same compound perfumery calls 'indolic').",
  },
  honeyed: {
    summary: "Soft amber sweetness — the dried-flower-and-honey register.",
    body: "Linden, chamomile, white tea, rooibos. Sits between floral perfume and pure sugar — sweetness softened by aromatic compounds rather than concentrated.",
  },
  "honey-sweet": {
    summary: "Honey-leaning sweetness — flower nectar more than sugar.",
    body: "Linden's signature; soft amber sweetness that sits forward without cloying.",
  },

  // ── Fruity family ──
  fruity: {
    summary: "Berry, stone fruit, tropical aromatics.",
    body: "Hibiscus's cranberry-tart anthocyanins, elderflower's lychee-floral, Darjeeling's muscatel grape (terpene-driven), white tea's melon. Volatile fruit esters drive most of the register.",
  },
  citrus: {
    summary: "Bright, lifting, lemon-adjacent without being sour.",
    body: "Lemongrass's citral, lemon balm's citronellal, bergamot's linalool. Hibiscus's tartness and Ceylon's lift sit at the edges of the family.",
  },
  citrusy: {
    summary: "Citrus-leaning lift — lemon-and-rind brightness.",
    body: "Adjective form of citrus; lemongrass, lemon balm, linden, bergamot. Driven by limonene and citral.",
  },
  muscatel: {
    summary: "Grape-like aromatics — Darjeeling's signature.",
    body: "First- and second-flush Darjeeling teas pulled in this terpene-rich character through their specific cultivar chemistry and high-elevation oxidation.",
  },
  tart: {
    summary: "Fruity-acidic character.",
    body: "Hibiscus and rosehip — the cranberry-edge register, anthocyanin- and ascorbic-acid driven.",
  },
  bright: {
    summary: "Lively, refreshing acidity.",
    body: "Tea-community preference over 'acidic'. Ceylon and Darjeeling carry this through their oxidation profile; lemongrass and lemon balm through citral.",
  },
  cranberry: {
    summary: "Hibiscus's defining fruit-tartness.",
    body: "Bright sourness rounded by anthocyanins (the same red pigments that give the cup its color).",
  },
  fruit: {
    summary: "General fruit register — most often stone fruit or berry.",
    body: "Oolong's peach edge (fruity esters from partial oxidation), Darjeeling's grape (muscatel terpenes), white tea's melon.",
  },

  // ── Vegetal family ──
  vegetal: {
    summary: "Fresh-cut greens, steamed leaves.",
    body: "High amino acids (chiefly L-theanine and glutamate) plus chlorophyll-adjacent compounds give shaded greens their depth. Sencha's grass, gyokuro's seaweed, matcha's umami-vegetal, dragonwell's chestnut-bean.",
  },
  grassy: {
    summary: "Fresh-cut grass, green-leaf register.",
    body: "Sencha, dragonwell, lemongrass, lemon balm, matcha's lighter side. Cis-3-hexenol — the same compound your nose reads in cut grass — drives the signal.",
  },
  marine: {
    summary: "Seaweed, oceanic notes.",
    body: "Distinctive to Japanese shaded greens (gyokuro especially) where shading boosts chlorophyll and amino acids. Sulfur-containing volatiles add the kelp edge.",
  },
  seaweed: {
    summary: "Oceanic-vegetal — the kelp register.",
    body: "Shaded Japanese greens; matcha and gyokuro carry the strongest signal through their high amino acid load.",
  },
  umami: {
    summary: "Savory, brothy depth.",
    body: "L-theanine plus glutamate — the shaded-green signature. Matcha, gyokuro, and lion's mane decoctions all pull this register.",
  },

  // ── Nutty family ──
  nutty: {
    summary: "Almond, chestnut, toasted-grain register.",
    body: "Dragonwell's chestnut from pan-firing, genmaicha's roasted rice, hojicha's deep toast. Maillard reaction products drive the family.",
  },
  chestnut: {
    summary: "The pan-fired Chinese green signature.",
    body: "Specifically Dragonwell — sweet, faintly buttery, generated by the pan-firing step that defines the style.",
  },
  bean: {
    summary: "Cooked-bean vegetal register.",
    body: "Dragonwell and some Chinese greens; produced as amino acids react during firing.",
  },
  malty: {
    summary: "Cocoa-grain depth.",
    body: "Assam's signature; some Ceylon and Yunnan blacks. Comes from Maillard products formed during full oxidation of high-tannin leaves.",
  },
  cocoa: {
    summary: "Chocolate-without-sugar register.",
    body: "Assam, ripe pu-erh, some roasted oolongs. Pyrazines and other roasted-cocoa volatiles emerge under deep oxidation or fermentation.",
  },

  // ── Sweet family ──
  sweet: {
    summary: "Natural sugar-without-sugar, from amino acids and polysaccharides.",
    body: "Licorice's glycyrrhizin sets the ceiling at 5 (50× sucrose by weight); rooibos' aspalathin, vanilla's vanillin, and white tea's L-theanine hold the gentler middle.",
  },
  honey: {
    summary: "Soft amber sweetness — flower and dried-grass.",
    body: "White tea, chamomile, linden, rooibos. Sits between floral and pure sugar; aromatic compounds soften the sweetness.",
  },
  caramel: {
    summary: "Browned-sugar warmth.",
    body: "Hojicha's roast, dandelion root, rooibos. Maillard products generated during high-heat processing.",
  },
  vanilla: {
    summary: "Creamy floral-sweet — the dessert lean.",
    body: "Vanilla bean's vanillin; lifts any blend toward dessert without sugar.",
  },
  creamy: {
    summary: "Body quality, not flavor — milk-like roundness.",
    body: "Vanilla, gyokuro's broth, high-amino shaded greens. Driven by lipid-soluble compounds and the mouth-coating effect of polysaccharides.",
  },

  // ── Roasted family ──
  roasted: {
    summary: "Pan-fired or oven-roasted depth.",
    body: "Hojicha, dark oolongs, dandelion root, gunpowder. Maillard browning and caramelization of sugars during processing.",
  },
  toasted: {
    summary: "The lighter end of roasted — pan-fired character.",
    body: "Hojicha, gunpowder, genmaicha's rice. Same Maillard chemistry as roasted, applied with a lighter hand.",
  },
  toasty: {
    summary: "Genmaicha and hojicha's signature register.",
    body: "Gentle browning of grain and leaf, not char. Pyrazines and furans dominate the aromatic profile.",
  },
  smoky: {
    summary: "Pine-smoke, campfire.",
    body: "Lapsang Souchong's signature — leaves dried over pine fires in Fujian. Guaiacol and syringol are the phenolic compounds responsible.",
  },
  smoked: {
    summary: "Same as smoky — pine-smoke register.",
    body: "Lapsang Souchong; some yerba mate via barbacuá processing. Phenolic compounds from wood smoke bond to the leaf during drying.",
  },
  pine: {
    summary: "Resinous coniferous note.",
    body: "Lapsang's pine-smoke (alpha-pinene from the burning wood); lavender's camphor edge sits adjacent.",
  },
  charcoal: {
    summary: "Deep-roasted register.",
    body: "Heavier roasts; dark oolongs, charcoal-fired teas. Push Maillard products further toward pyrolysis.",
  },
  campfire: {
    summary: "Lapsang's full-throat smoke note.",
    body: "The 'love or never again' register. Guaiacol-rich pine smoke at strength.",
  },
  tar: {
    summary: "Heaviest-end smoke note.",
    body: "Old-style Lapsang — pitch-and-pine. Phenolic compounds at their most concentrated.",
  },

  // ── Earthy family ──
  earthy: {
    summary: "Forest floor, root cellar, deep loam.",
    body: "The grounded register — pu-erh's leather (geosmin and microbial fermentation products), reishi's bitter wood (triterpenes), ashwagandha's musk, dandelion root.",
  },
  bold: {
    summary: "Robust, full-bodied register — the heavy-cup edge of earthy.",
    body: "Strong black teas, dark roasts, and rich decoctions — assertively-flavored cups that don't whisper. High catechin and Maillard-product loads.",
  },
  woody: {
    summary: "Aged-tea, roasted-oolong character.",
    body: "Pu-erh, hojicha, lapsang, valerian, vanilla bean. Lignin-derived compounds and aged-tea chemistry.",
  },
  wood: {
    summary: "Direct timber-and-bark register.",
    body: "Aged teas, root-based herbals. Lignin and tannin-bound aromatic compounds.",
  },
  mineral: {
    summary: "Stone, wet rock, high-mountain register.",
    body: "Wuyi rock oolong's terroir character, gyokuro's depth, nettle, dandelion leaf. Trace minerals and the soil-bound compounds the plant takes up.",
  },
  mushroom: {
    summary: "Funghi register — the umami-earthy crossover.",
    body: "Reishi (triterpenes), lion's mane (hericenones), aged pu-erh. The same compounds drive both flavor and the family's grounding/focus effects.",
  },
  mushroomy: {
    summary: "Same as mushroom — funghi-vegetal earthy.",
    body: "Reishi's bitter triterpene side; lion's mane's seafood-mushroom register.",
  },
  loam: {
    summary: "Wet-soil register.",
    body: "Fermented teas and mushroom decoctions. Geosmin — the same compound that drives rain-on-dry-earth smell — is the prototypical loam molecule.",
  },
  leather: {
    summary: "Animalic-aged register.",
    body: "Old shou pu-erh, well-aged sheng. Aged-tea polyphenols and microbial fermentation products.",
  },
  dark: {
    summary: "Heavy, low-pitched register.",
    body: "Pu-erh, deeply roasted oolongs. High oxidation plus heat-driven Maillard products.",
  },

  // ── Spicy family ──
  spicy: {
    summary: "Pantry warmth — peppery, woody, aromatic.",
    body: "Cinnamon (cinnamaldehyde), cardamom (terpinyl acetate), ginger (gingerol), cloves (eugenol), black pepper (piperine), tulsi (eugenol). The chai cluster.",
  },
  spiced: {
    summary: "The chai cluster — warm-spice register.",
    body: "Cinnamon's cinnamaldehyde, cardamom's terpinyl acetate and cineole, ginger's gingerol, cloves' eugenol. Each spice adds a different facet to the same family.",
  },
  pungent: {
    summary: "Sharp aromatic heat.",
    body: "Black pepper's piperine, ginger's gingerol, clove's eugenol, valerian's volatile valerenic compounds. The biting, throat-warming edge of the spice family.",
  },
  warm: {
    summary: "Pantry-warm aromatics — the cinnamon-cardamom register.",
    body: "Spice family; also rooibos, vanilla. Driven by warming aromatic compounds (cinnamaldehyde, eugenol) rather than thermogenic heat.",
  },
  numbing: {
    summary: "Eugenol's tongue-tingling anesthetic.",
    body: "Cloves' signature; small amounts in black pepper and tulsi. Eugenol acts as a mild topical anesthetic.",
  },

  // ── Herbaceous family ──
  herbaceous: {
    summary: "General herbal-green register.",
    body: "Cured leaves and garden herbs. A catchall for dried-plant aromatics that don't fall into floral, fruit, or vegetal.",
  },
  hay: {
    summary: "Cured-grass, dried-herbal register.",
    body: "Chamomile, passionflower, white tea. Coumarin and related lactones drive the cut-grass-going-to-hay aroma.",
  },
  camphor: {
    summary: "Cool resinous note.",
    body: "Lavender's signature (camphor + cineole); some old-style oolongs through aging.",
  },
  minty: {
    summary: "Cool exhale through the back of the throat.",
    body: "Peppermint's menthol is direct and sharp; spearmint's carvone is sweeter and gentler. Both trigger the same TRPM8 cold receptor.",
  },
  mint: {
    summary: "Same as minty — cool aromatic register.",
    body: "Peppermint (menthol), spearmint (carvone), lemon balm's mint-family edge.",
  },
  cool: {
    summary: "Mouthfeel cooling — TRPM8 activation from menthol.",
    body: "Peppermint, lavender, eucalyptus. The same receptor that signals cold temperature is triggered chemically.",
  },
  cooling: {
    summary: "Refreshing, clarifying register.",
    body: "Both mouthfeel (menthol-driven, TRPM8) and felt-temperature effect (green/white tea chemistry) — they often co-occur.",
  },
  fresh: {
    summary: "Just-picked-greens register; cool, clarifying, citrus-or-mint forward.",
    body: "Sencha, lemongrass, dandelion leaf, peppermint, citrus peels. The lifting/clarifying cluster — usually volatile terpenes and aldehydes that read on the nose before the tongue.",
  },

  // ── Mouthfeel ──
  brisk: {
    summary: "Lively, refreshing finish.",
    body: "Black teas (Assam, Ceylon) and well-made greens. Theaflavins and catechins give the cup its lift without tipping into harsh.",
  },
  astringent: {
    summary: "Tongue-drying tannin sensation.",
    body: "Catechins binding to mouth proteins. Different from bitter. Strong black teas, over-steeped greens.",
  },
  bitter: {
    summary: "Back-of-tongue taste.",
    body: "Catechins and other polyphenols in tea; secoiridoid bitter compounds in gentian and dandelion; triterpenes in reishi; valerenic acid in valerian. A flavor, not an effect.",
  },
  bittersweet: {
    summary: "The coffee-adjacent register.",
    body: "Dandelion root, dark roasted oolongs. Roast-driven bitterness alongside Maillard sweetness.",
  },

  // ── Other ──
  apple: {
    summary: "Chamomile's defining note.",
    body: "Soft, rounded, faintly tart-sweet. Driven by chamomile's ester profile (the genus name Chamaemelum means 'earth apple').",
  },
  aromatic: {
    summary: "Volatile, perfumed lift — what hits the nose before the tongue.",
    body: "Cardamom, lavender, jasmine, lemon balm. Lipophilic volatile compounds (terpenes, esters, alcohols) that escape with the steam.",
  },
  buttery: {
    summary: "Cream-and-butter mouthfeel — the rich vegetal register.",
    body: "Gyokuro, dragonwell, well-shaded greens. Diacetyl-adjacent compounds plus the mouth-coating effect of high amino acids and lipids.",
  },
  "caramel-roasted": {
    summary: "Browned-sugar plus pan-fired depth.",
    body: "Hojicha's signature register — caramel sweetness from sugar caramelization, layered with Maillard toast.",
  },
  clove: {
    summary: "Eugenol-driven warmth — sweet, woody, slightly numbing.",
    body: "Clove buds; trace eugenol in tulsi and some allspice-touched chai blends.",
  },
  "coffee-adjacent": {
    summary: "Roasted-bitter register that drinks like coffee without the bean.",
    body: "Dandelion root, deeply roasted hojicha, ripe pu-erh. Pyrazines and roast-degraded chlorogenic-acid compounds.",
  },
  hot: {
    summary: "Capsaicin or zingerone heat — the throat-and-chest warmth.",
    body: "Ginger (gingerol → zingerone with heat), black pepper (piperine), chili. Different from 'warm' aromatics — these activate TRPV1 pain receptors directly.",
  },
  licorice: {
    summary: "Glycyrrhizin sweetness — anise-adjacent, dense, lingering.",
    body: "Licorice root (glycyrrhizin), star anise (anethole), fennel seed at the edges of the family.",
  },
  melon: {
    summary: "Honeydew-soft fruit register.",
    body: "White tea's signature; some shaded greens and high-altitude oolongs. Driven by C9 aldehydes and esters.",
  },
  peppery: {
    summary: "Sharp aromatic bite — black pepper register.",
    body: "Black pepper's piperine, fresh ginger's gingerol, tulsi's sharper eugenol side, watercress-adjacent greens.",
  },
  savory: {
    summary: "Umami-and-broth register — the not-sweet, not-bitter axis.",
    body: "Matcha, gyokuro, mushroom decoctions, lion's mane. L-theanine plus glutamate trigger the umami receptors directly.",
  },
  "seafood-like": {
    summary: "Marine-mushroom register — lion's mane's signature.",
    body: "Crab-and-kelp aromatic that comes through in long decoctions, driven by lion's mane's unique hericenone chemistry.",
  },
  "spinach-like": {
    summary: "Cooked-greens vegetal register.",
    body: "Matcha, gyokuro, deep-shaded sencha. Chlorophyll-adjacent compounds plus the steamed-leaf cluster.",
  },
  tannic: {
    summary: "Tea-tannin mouthfeel — drying without sourness.",
    body: "Theaflavins and thearubigins in black teas; condensed tannins in over-steeped greens and persimmon-adjacent. Closer to astringent than bitter, but with more grip.",
  },
  musky: {
    summary: "Deep mature aromatic register.",
    body: "Ashwagandha (withanolides), valerian (valerenic compounds), turmeric (turmerone). Heavy, low-pitched aromatics from root and rhizome chemistry.",
  },
  musty: {
    summary: "Damp-attic register — root and fungus character.",
    body: "Ashwagandha, reishi, aged sheng. Geosmin and microbial-fermentation products.",
  },
  delicate: {
    summary: "Light-bodied, faint-aromatic register.",
    body: "White tea, linden, elderflower. Low tannin load and gentle volatile aromatics rather than concentrated extraction.",
  },
  oceanic: {
    summary: "Marine, salt-air register.",
    body: "Matcha, gyokuro, kelp-adjacent greens. Sulfur-containing volatiles and high amino acids drive the kelp edge.",
  },
  lychee: {
    summary: "Tropical-floral fruit register.",
    body: "Elderflower's signature aromatic — driven by rose oxide and related floral-fruit terpenes.",
  },
  anise: {
    summary: "Fennel and licorice family register.",
    body: "Anethole — the same compound in fennel seed, star anise, and licorice root — is the through-line.",
  },
  complex: {
    summary: "Multi-layered, hard to pin to one note.",
    body: "Cardamom, well-made oolong, aged pu-erh. Cups carrying several flavor families speaking at once rather than a single dominant register.",
  },
};

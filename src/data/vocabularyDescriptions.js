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

import { MOOD_DESCRIPTIONS } from "./families.js";

/* The mood half of this file now lives in data/families.js, beside the
   parent/child tree it describes. It moved because the two disagreed:
   the family map called `soothing` "bodily comfort (demulcent — throat,
   gut)" while the definition here read "general comfort, warmth-of-
   spirit" — comfort's definition under soothing's name. Nothing could
   catch it while one file held the structure and another held the
   meaning.

   What remains below is the palate vocabulary (bitterness, sweetness,
   astringency, tartness, menthol) and a few legacy aliases, which have
   no family tree to sit beside. Mood entries are spread in from the
   canonical source and win over anything local. */
const PALATE_AND_LEGACY = {


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

export const EFFECT_DESCRIPTIONS = { ...PALATE_AND_LEGACY, ...MOOD_DESCRIPTIONS };

/* ── Synergies — what a pairing does, and on whose authority ───────

   Transcribed from docs/research/synergies.md, which grades all
   thirteen pairings by what actually backs them. The grades are the
   ingredient docs' own: MEASURED (a trial tested the combination, not
   just the parts), TRADITIONAL (a real documented preparation, named
   as tradition), DESCRIPTIVE (no mechanism claimed).

   An audit found the table had been written from pattern and carried
   no sources at all. Four pairings turned out to have real literature
   once anyone looked — the point of looking. The rest say plainly
   what they are, because an unsourced claim wearing a sourced one's
   authority is the thing the reader can't see through.

   Not transcribed: the bonus magnitudes. No study says an interaction
   is worth +0.4 rather than +0.2 on a 0-5 scale; those are a
   modelling choice and no description claims otherwise.
   ────────────────────────────────────────────────────────────── */
export const SYNERGY_DESCRIPTIONS = {
  "alert calm": {
    summary: "Awake without the edge \u2014 the cup that sharpens instead of jangling.",
    body: "The best-evidenced pairing in the app. L-theanine with caffeine improved reaction time, working memory and alertness ratings where neither did alone (Haskell et al. 2008) \u2014 a combination doing what its parts couldn't, which is what a synergy has to show.",
  },
  "calm focus": {
    summary: "Attention that doesn't feel like effort.",
    body: "The same L-theanine-and-caffeine chemistry as `alert calm`, read from the focus side: the amino acid smooths the stimulant's edge rather than opposing it. The combination improved attention where neither part did alone (Haskell et al. 2008).",
  },
  "deepens sedation": {
    summary: "Quiet mind, heavy eyes.",
    body: "Valerian with lemon balm is studied as a combination, not just as two sedatives \u2014 a double-blind placebo-controlled trial (Cerny & Schmid 1999) and later a triple-blind randomised trial where sleep quality improved for 36% on the pairing against 8% on placebo.",
  },
  "deep settle": {
    summary: "The body unwinding rather than the mind going quiet.",
    body: "The same valerian-and-lemon-balm evidence as `deepens sedation` (Cerny & Schmid 1999), read from the body's side. The trials don't separate the two registers; the cup does \u2014 this is the let-go one rather than the get-tired one.",
  },
  "Maghrebi refresh": {
    summary: "Cool and clear at once \u2014 the mint-and-gunpowder register.",
    body: "Menthol activates the cold receptor TRPM8 and acts on cholinergic signalling, so the cooling and the alerting share a compound. Peppermint aroma measurably improved memory, processing speed and alertness in a randomised trial of 144 people (Moss et al. 2008) \u2014 ylang-ylang, tested alongside, did the opposite.",
  },
  "warming digestive": {
    summary: "Heat that helps the meal along.",
    body: "Peppermint relaxes intestinal smooth muscle by blocking calcium channels, fennel's volatile oils work the same register, and ginger speeds gastric emptying by around a quarter. Warm liquid aids motility on its own \u2014 which is why these are drunk hot. The halves are measured; the combination hasn't been tested as one.",
  },
  "after-meal lift": {
    summary: "Bright and settling together \u2014 the end of a long meal.",
    body: "Tradition rather than trial. Italian canarino, Mexican agua de jamaica with lime, the French after-dinner tisane: cultures that eat late converge on a cup that lifts and settles at once. The convergence is the evidence, and it's the only evidence.",
  },
  "winter root": {
    summary: "Anchored and warmed \u2014 the cold-weather cup.",
    body: "Tradition rather than trial. The Yunnan-Tibetan decoction register, where fermented tea meets warming root. Documented as a practice; never measured as an interaction.",
  },
  "the holding cup": {
    summary: "Quieted and warmed at once \u2014 the feeling of being tucked in.",
    body: "No mechanism is claimed. Soothing is the body's ease and comfort is warmth of spirit; a cup carrying both reads as held rather than merely calm. A description of the register, not a finding about it.",
  },
  settled: {
    summary: "Calm with something warm underneath it.",
    body: "No mechanism is claimed. Calm alone can read thin; alongside comfort or soothing it reads settled instead. A note on how the two sit together, nothing more.",
  },
  rooted: {
    summary: "Steady rather than merely relaxed.",
    body: "No mechanism is claimed. Grounding gives calm a floor to rest on \u2014 the difference between a cup that loosens you and one that plants you.",
  },
  "morning lift": {
    summary: "Warmth arriving with the wake-up.",
    body: "No mechanism is claimed. Energy with warmth behind it reads gentler than energy alone \u2014 the chai register rather than the espresso one.",
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
  fruit: {
    summary: "General fruit register — most often stone fruit or berry.",
    body: "Oolong's peach edge (fruity esters from partial oxidation), Darjeeling's grape (muscatel terpenes), white tea's melon.",
  },
  peach: {
    summary: "Oolong's stone-fruit edge — soft, slightly creamy.",
    body: "Partial oxidation builds the lactones and fruity esters that read as peach; it sits alongside the orchid note in the same cup rather than replacing it.",
  },
  apricot: {
    summary: "White tea's dried stone fruit — quieter than peach, more sun-dried.",
    body: "Carotenoid breakdown during withering leaves the dried-fruit register; gentle because white tea is barely processed and never fired hard.",
  },
  berry: {
    summary: "Red-fruit tartness — hibiscus and cranberry's defining note.",
    body: "Bright sourness rounded by anthocyanins, the same red pigments that give the cup its colour.",
  },
  orchid: {
    summary: "Oolong's signature floral — creamy rather than perfumed.",
    body: "The Tieguanyin register. Softer and rounder than rose or jasmine — floral without the sharp top note.",
  },
  tingling: {
    summary: "A faint prickle on the tongue — sensation, not taste.",
    body: "Echinacea's alkylamides act on the trigeminal nerve, the same channel as pepper's pungency, so the cup is felt as much as tasted. Distinct from `menthol`, which cools rather than prickles.",
  },
  bergamot: {
    summary: "Earl Grey's perfumed citrus — floral where lemon is sharp.",
    body: "Bergamot peel oil, carried by linalyl acetate and linalool. Rounder and more floral than the lemon register, which is why it reads as a scent rather than a fruit.",
  },
  lemon: {
    summary: "Sharp citrus peel — the top of the bright register.",
    body: "Peel oils rather than juice: limonene with citral behind it. Lifting and volatile, so it arrives first and leaves first.",
  },
  orange: {
    summary: "Rounder, sweeter citrus than lemon.",
    body: "The same limonene backbone with less citral sharpness, so it reads warm where lemon reads bright — closer to peel than to juice either way.",
  },
  herbal: {
    summary: "Green-medicinal middle — the herb itself rather than a fruit or flower.",
    body: "Spearmint's softer carvone register and echinacea's root-and-flower character both land here. A catch-all for cups that taste of the plant they came from.",
  },
  rice: {
    summary: "Genmaicha's toasted grain — popcorn-adjacent, warm and dry.",
    body: "Roasted brown rice through Maillard browning. It's the one flavour in the catalogue that comes from something other than the leaf.",
  },
  sage: {
    summary: "Camphor-edged and savoury — a kitchen herb, not a tea note.",
    body: "Thujone and camphor give the drying, faintly medicinal lift that keeps sage from reading as simply green.",
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
  // The FAMILY, keyed by its display label. The flavour strip looks a
  // family up by what it shows, and this one shows "sweet aroma" — so
  // relabelling it away from the palate axis left the family bar with
  // no description at all until this entry existed.
  //
  // Deliberately not the same text as `sweet` above. That one is the
  // tongue register; this is the aromatic one, and the whole reason for
  // the rename is that they are different claims.
  "sweet aroma": {
    summary: "Smells sweet — honey, vanilla, caramel — whether or not it tastes it.",
    body: "Aromatic sweetness rather than the tongue's. Vanillin has essentially no sweet taste; the brain reads the odour as sweetness and the cup seems sweeter than its sugars. Descriptive sensory analysis calls this cluster \"sweet aromatics\" precisely to hold it apart from the basic taste.",
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

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
    ladder: [
      [1, "A slight settle — easy enough to ignore."],
      [3, "A clear quieting; the chatter's softer, you'd notice."],
      [5, "Deep stillness; the body unwinds and the day recedes."],
    ],
  },
  soothing: {
    summary: "General comfort, warmth-of-spirit. Sweetness without sugar.",
    body: "The wrapped-blanket register — rooibos, vanilla, hojicha, licorice root. Different from calm: this is the body's cup, not the mind's.",
    ladder: [
      [1, "A faint warmth-of-spirit; ambient, easy to overlook."],
      [3, "Wrapped-blanket cozy — the cup's clearly working."],
      [5, "Deep comfort; the day's edges round off entirely."],
    ],
  },
  digestive: {
    summary: "Settles the stomach. The post-meal cup across cultures.",
    body: "Peppermint's menthol is the most studied for easing the gut; fennel, ginger, dandelion root, and pu-erh all pull in the same direction.",
    ladder: [
      [1, "A hint of settling in the gut."],
      [3, "A clear easing; the post-meal cup doing its job."],
      [5, "A strong digestive push — peppermint, fennel, or ginger at strength."],
    ],
  },
  uplifting: {
    summary: "Lightening, brightening, mood-lifting.",
    body: "Jasmine, bergamot, light oolongs, and citrus-forward herbs. Darjeeling's muscatel character lifts the same way — aromatics that read on the nose before the tongue.",
    ladder: [
      [1, "A soft brightness on the nose; mood-neutral but not flat."],
      [3, "A noticeable lift; the cup smiles back."],
      [5, "Brisk and bright — jasmine or bergamot at peak."],
    ],
  },
  warming: {
    summary: "Generates internal heat — pantry-warm spice that reads as physical warmth.",
    body: "Black teas, roasted oolongs, and ripe pu-erh hold a steady warmth; the spice cabinet ramps it: cinnamon and cardamom ride a calmer line, while ginger's gingerol triggers a real thermogenic response — the loudest warmer in the catalog.",
    ladder: [
      [1, "A faint internal warmth; ambient, more felt than named."],
      [3, "A clear warmth in the chest; the cup heats from within."],
      [5, "A thermogenic push — ginger-driven; you feel it in the limbs."],
    ],
  },
  focus: {
    summary: "Meditative clarity. Alert without jitter.",
    body: "L-theanine paired with caffeine — the shaded-green signature. Gyokuro and matcha hold the top of this register, with sencha, dragonwell, and oolong following the same chemistry at lower amplitude. Lion's mane works on a longer arc through nerve-growth-factor support.",
    ladder: [
      [1, "A gentle steadying — you might or might not name it."],
      [3, "Clear attention; reading or writing flows."],
      [5, "Sharp, sustained focus — gyokuro and matcha territory."],
    ],
  },
  energy: {
    summary: "Stimulating, awakening — the wake-up cup.",
    body: "Usually the smoother caffeine + L-theanine register rather than a stimulant edge. Assam carries the most caffeine of the true teas; matcha lands close behind through its shaded-tea chemistry, and yerba-mate gets there a different way — caffeine with theobromine in support.",
    ladder: [
      [1, "A soft lift, barely above flat."],
      [3, "A clean wake-up cup; the morning starts."],
      [5, "Brisk and alert — assam or yerba-mate at strength."],
    ],
  },
  sleepy: {
    summary: "Sedating, drowsiness-adjacent.",
    body: "Heavier than calm — a downward drift. Valerian's valerenic acid is the strongest sedative in the kitchen, with reishi's triterpenes close behind; passionflower, chamomile, and ashwagandha all pull in the same direction more gently.",
    ladder: [
      [1, "Edge of drowsy — hard to name unless you're already tired."],
      [3, "A real downward pull; the cup wants to sit still."],
      [5, "Heavy sedation — valerian or reishi; pair with rest, not driving."],
    ],
  },
  cooling: {
    summary: "Refreshes and clarifies. The settling-down register opposite warming.",
    body: "Green tea, white tea, hibiscus, mints, light oolongs. Distinct from menthol's mouthfeel cool, though the two can co-occur.",
    ladder: [
      [1, "A slight refresh on first sip."],
      [3, "A clear cooling; the cup settles the body down."],
      [5, "Deeply cooling — green tea or hibiscus on a hot day."],
    ],
  },
  grounding: {
    summary: "Settling, centering, earthy.",
    body: "Reishi's triterpenes carry this most strongly, with ashwagandha and ripe pu-erh close behind. Lapsang's pine smoke and dandelion root pull here too — the deeper, low-pitched register.",
    ladder: [
      [1, "A faint settling, easy to overlook."],
      [3, "Noticeably centering; the body feels held."],
      [5, "Deeply rooted — reishi, pu-erh, ashwagandha territory."],
    ],
  },

  // ── User-facing mood aliases (mapped to effects above) ──
  comfort: {
    summary: "A wrapped-blanket feeling — soothing without sedating.",
    body: "Maps to the soothing effect. Rooibos and hojicha are the prototypes; vanilla and licorice root round any blend toward this register.",
    ladder: [
      [1, "A faint warmth-of-spirit; ambient, easy to overlook."],
      [3, "Wrapped-blanket cozy — the cup's clearly working."],
      [5, "Deep comfort; the day's edges round off entirely."],
    ],
  },
  // (Note: a previous "digestive" alias here shadowed the main
  // `digestive` entry above and dropped its 1/3/5 ladder. The main
  // entry's copy already covers the same ground; alias removed.)

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

  // ── Balance axes — taste-structure dimensions surfaced as gradient
  // bars in the brewing explorer. Distinct from mood/effect. ──
  bitterness: {
    summary: "Tongue-back bitter taste — total tannin pressure.",
    body: "Sums effect bitterness with flavor bitter and astringent signals, since the warning math treats them as one axis. Climbs when catechins and tannins release past their balance point — too long or too hot.",
    ladder: [
      [1, "Barely there — a clean cup with the faintest grip."],
      [3, "Clearly bitter — back-of-tongue lingering you'd notice."],
      [5, "Aggressive — over-pulled territory; pull the steep back."],
    ],
  },
  sweetness: {
    summary: "Natural sugar-without-sugar — amino acids and polysaccharides.",
    body: "Licorice, rooibos, white tea, vanilla, honey-rich herbs all touch this. Balances bitterness; a sweetness-low / bitterness-high cup is the over-pull register.",
    ladder: [
      [1, "A faint suggestion of sweet — easy to miss."],
      [3, "A clear natural sweetness; balances any bitter notes."],
      [5, "Full sweet body — rooibos, licorice root, or honey-rich herbs."],
    ],
  },
  astringency: {
    summary: "Tongue-drying tannin grip — different from bitter.",
    body: "Catechins binding to mouth proteins. Strong black teas, over-steeped greens, persimmon-adjacent. Closely tracks bitterness but the sensation lands on the cheeks and tongue surface, not the back of the throat.",
    ladder: [
      [1, "Barely drying — a clean finish."],
      [3, "Clearly drying — the cheeks and tongue feel it."],
      [5, "Mouth-grippy — over-extracted; pull the steep back."],
    ],
  },
  tartness: {
    summary: "Fruity-acidic lift — bright, lemon-and-cranberry register.",
    body: "Hibiscus, rosehip, citrus-leaning herbs. Not the same as bitter — tartness is up-front and lifting, where bitterness is back-of-tongue and lingering.",
    ladder: [
      [1, "A faint brightness — a subtle lift."],
      [3, "Clearly tart — the cup has zip."],
      [5, "Sharp acidic — hibiscus or rosehip in full force."],
    ],
  },
  menthol: {
    summary: "Mouth-cooling sensation — TRPM8 activation.",
    body: "Peppermint's menthol is sharp and direct; spearmint's carvone is gentler. Distinct from the cooling mood (felt-temperature register); menthol is the physical mouthfeel.",
    ladder: [
      [1, "A faint cool exhale at the finish."],
      [3, "Clearly cooling — peppermint's signature sensation."],
      [5, "Icy, almost burning — TRPM8 maxed, peppermint at strength."],
    ],
  },
};

export const FLAVOR_DESCRIPTIONS = {
  // ── Floral family ──
  floral: {
    summary: "Petals, perfume, soft aromatics.",
    body: "Volatile compounds that lift on first sip. Rose, jasmine, lavender, chamomile, elderflower, linden.",
    ladder: [
      [1, "A faint perfume on first sip."],
      [3, "Clearly perfumed; the cup carries flowers."],
      [5, "Fully in flower — jasmine or rose at peak."],
    ],
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
    ladder: [
      [1, "A faint fruit suggestion in the background."],
      [3, "Clearly fruity — the cup reads like its source berries or stone fruit."],
      [5, "Dominant fruit — hibiscus or rosehip in full lift."],
    ],
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
    ladder: [
      [1, "A hint of green — a leaf-edge in the cup."],
      [3, "Clearly green — sencha-style cut grass and steamed leaf."],
      [5, "Deep green wash — matcha or gyokuro at strength."],
    ],
  },
  grassy: { summary: "Fresh-cut grass, green-leaf register.", body: "Sencha, dragonwell, lemongrass, lemon balm, matcha's lighter side." },
  marine: {
    summary: "Seaweed, oceanic notes.",
    body: "Distinctive to Japanese shaded greens — gyokuro especially.",
    ladder: [
      [1, "A faint salt-edge — barely there."],
      [3, "Clearly oceanic — seaweed and kelp forward."],
      [5, "Kelp-front — full gyokuro or mushroom-decoction marine."],
    ],
  },
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
    ladder: [
      [1, "A faint suggestion of sweet — easy to miss."],
      [3, "Clearly sweet; balances the cup without sugar added."],
      [5, "Sugar-like — licorice root, rooibos, or vanilla at full strength."],
    ],
  },
  honey: { summary: "Soft amber sweetness — flower and dried-grass.", body: "White tea, chamomile, linden, rooibos." },
  caramel: { summary: "Browned-sugar warmth.", body: "Hojicha's roast, dandelion root, rooibos." },
  vanilla: { summary: "Creamy floral-sweet — the dessert lean.", body: "Vanilla bean's signature; lifts any blend toward dessert without sugar." },
  creamy: {
    summary: "Body quality, not flavor — milk-like roundness.",
    body: "Vanilla, gyokuro's broth, oat-base lattes.",
    ladder: [
      [1, "A faint round mouthfeel — light-bodied."],
      [3, "Clearly creamy — vanilla and high-amino tea body."],
      [5, "Cream-rich — gyokuro broth or vanilla in full body."],
    ],
  },

  // ── Roasted family ──
  roasted: { summary: "Pan-fired or oven-roasted depth.", body: "Hojicha, dark oolongs, dandelion root, gunpowder." },
  toasted: { summary: "The lighter end of roasted — pan-fired character.", body: "Hojicha, gunpowder, genmaicha's rice." },
  toasty: { summary: "Genmaicha and hojicha's signature register.", body: "Gentle browning, not char." },
  smoky: {
    summary: "Pine-smoke, campfire.",
    body: "Lapsang Souchong's signature — dried over pine fires in Fujian.",
    ladder: [
      [1, "A whisper of smoke — easy to overlook."],
      [3, "Clearly smoky — campfire on the breeze."],
      [5, "Heavy smoke — full Lapsang Souchong, love-or-never-again."],
    ],
  },
  smoked: { summary: "Same as smoky — pine-smoke register.", body: "Lapsang Souchong; some yerba mate via barbacuá processing." },
  pine: { summary: "Resinous coniferous note.", body: "Lapsang's pine-smoke; lavender's camphor edge." },
  charcoal: { summary: "Deep-roasted register.", body: "Heavier roasts; dark oolongs, charcoal-fired teas." },
  campfire: { summary: "Lapsang's full-throat smoke note.", body: "The 'love or never again' register." },
  tar: { summary: "Heaviest-end smoke note.", body: "Old-style Lapsang — pitch-and-pine." },

  // ── Earthy family ──
  earthy: {
    summary: "Forest floor, root cellar, deep loam.",
    body: "The grounded register — pu-erh's leather, reishi's bitter wood, ashwagandha's musk, dandelion root.",
    ladder: [
      [1, "A faint earth-edge underneath the cup."],
      [3, "Clearly grounded — root and bark forward."],
      [5, "Deep loam — aged pu-erh, reishi, or root-decoction territory."],
    ],
  },
  bold: {
    summary: "Robust, full-bodied register — the heavy-cup edge of earthy.",
    body: "Strong black teas, dark roasts, and rich decoctions — assertively-flavored cups that don't whisper. Lives in the earthy family.",
    ladder: [
      [1, "A faint robustness; the cup has presence but stays light."],
      [3, "Clearly bold — the cup doesn't whisper, it speaks."],
      [5, "Heavy and full — assam, dark oolongs, deep-roast at strength."],
    ],
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
  spicy: {
    summary: "Pantry warmth — peppery, woody, aromatic.",
    body: "Cinnamon, cardamom, ginger, cloves, black pepper, tulsi.",
    ladder: [
      [1, "A faint spice-edge — pantry-warm at the back."],
      [3, "Clearly spiced — cinnamon and cardamom forward."],
      [5, "Pantry-on-fire — full chai with ginger and clove at strength."],
    ],
  },
  spiced: {
    summary: "The chai cluster — warm-spice register.",
    body: "Cinnamon, cardamom, ginger, cloves, black pepper.",
    ladder: [
      [1, "A faint spice-edge — pantry-warm at the back."],
      [3, "Clearly spiced — cinnamon and cardamom forward."],
      [5, "Pantry-on-fire — full chai with ginger and clove at strength."],
    ],
  },
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
  cooling: { summary: "Refreshing, clarifying register.", body: "Both mouthfeel (menthol) and felt-temperature effect — they often co-occur." },
  fresh: {
    summary: "Just-picked-greens register; cool, clarifying, citrus-or-mint forward.",
    body: "Sencha, lemongrass, dandelion leaf, peppermint, citrus peels — the lifting/clarifying cluster.",
    ladder: [
      [1, "A faint cool-lift — easy to overlook."],
      [3, "Clearly fresh — citrus and mint forward."],
      [5, "Cooling sweep — peppermint or strong citrus at peak."],
    ],
  },

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

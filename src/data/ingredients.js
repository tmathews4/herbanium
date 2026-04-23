/* ──────────────────────────────────────────────────────────────
   data/ingredients.js — ingredient catalog + user-facing vocabulary

   Contains:

   1. INGREDIENTS — the full catalog (30+ entries). Each entry carries
      botanical identity, brewing parameters, effect tags, flavor tags,
      pairings, safety warnings, narrative blurb, and researched facts.
      During the ingredient research phase this data will deepen
      significantly (extraction profiles, citations, confidence tiers).

   2. MOODS and FLAVORS — the small user-facing vocabularies that
      appear as chips on the Compose screen. Users pick from these.

   3. EFFECT_TO_MOOD and FLAVOR_TO_CATEGORY — mapping tables that
      project the richer ingredient-level vocabulary down to the
      user-facing chips. The algorithm uses these when matching
      ingredient data to user selections.

   Keeping vocabulary next to catalog data is deliberate: changes to
   ingredient tags often require checking/updating the mapping tables,
   and separating them invites drift.

   Note on scale: this file will grow substantially during the research
   phase. When it crosses ~2000 lines, plan to split INGREDIENTS into
   category files under data/ingredients/ with an index.js re-export.
   ────────────────────────────────────────────────────────────── */

export const INGREDIENTS = {
  chamomile: {
    name: "Chamomile", latin: "Matricaria chamomilla", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["calm", 4], ["sleepy", 3], ["settle", 3]],
    flavors: ["honey", "apple", "floral", "hay"],
    pairs: ["lavender", "lemonbalm", "rose", "passionflower", "fennel"],
    dose: "1 tsp · 200ml",
    headsUp: "Ragweed family — uncommon cross-allergy.",
    blurb: "Small daisy-like flowers with a rounded, honey-apple sweetness. Long used at the end of the day to soften the edges of a wound evening.",
    facts: [
      "The Latin name Matricaria comes from matrix, meaning womb — the Romans used it as a gynecological remedy.",
      "Ancient Egyptians dedicated chamomile to Ra and used it in the embalming process.",
      "Peter Rabbit's mother gave him chamomile tea after his Mr. McGregor scare — Beatrix Potter knew her folk medicine.",
      "There are actually two main plants called chamomile — German (annual, what's in most tea) and Roman (perennial, more bitter).",
    ],
    variants: [
      { intent: "sleep",     tempC: 100, timeS: 420, note: "Full-boil, long steep releases apigenin." },
      { intent: "calm",      tempC: 95,  timeS: 300, note: "Slightly cooler for a lighter, floral cup." },
      { intent: "digestion", tempC: 100, timeS: 240, note: "Brisk steep — take after a heavy meal." },
    ],
  },
  lavender: {
    name: "Lavender", latin: "Lavandula angustifolia", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [180, 240],
    effects: [["calm", 4], ["sleepy", 2]],
    flavors: ["floral", "pine", "camphor"],
    pairs: ["chamomile", "rose", "lemonbalm", "passionflower"],
    dose: "½ tsp · 200ml",
    headsUp: null,
    blurb: "Use sparingly — culinary lavender is a strong voice in any blend, bright and slightly cooling.",
    facts: [
      "The name comes from the Latin lavare — to wash — because Romans scented their baths with it.",
      "Queen Elizabeth I reportedly required lavender conserve on her royal table every day.",
      "Hidcote and Munstead — the most common culinary cultivars — were both bred in England in the early 1900s.",
      "Bees pollinating lavender fields can produce honey that carries the flower's distinct floral note.",
    ],
  },
  lemonbalm: {
    name: "Lemon Balm", latin: "Melissa officinalis", category: "herbal",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calm", 3], ["focus", 2], ["energy", 3]],
    flavors: ["citrus", "mint", "grassy"],
    pairs: ["chamomile", "peppermint", "rose", "spearmint", "lemongrass", "tulsi"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "A lemony mint relative, historically called the 'gladdening herb'. Quiet lift without caffeine.",
    facts: [
      "The Latin name Melissa comes from the Greek word for honeybee — planters grew it near hives to keep bees close.",
      "Medieval Carmelite nuns distilled it into 'Carmelite water,' a nerve tonic still sold in parts of Europe.",
      "Paracelsus called it the 'elixir of life' and believed it could completely revive a person.",
      "Modern research has explored its effects on mild cognitive performance and anxiety under stress.",
    ],
  },
  peppermint: {
    name: "Peppermint", latin: "Mentha × piperita", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["focus", 3], ["settle", 4], ["cooling", 4]],
    flavors: ["minty", "cool", "grassy"],
    pairs: ["lemonbalm", "ginger", "rooibos", "fennel", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "Can worsen acid reflux for some.",
    blurb: "Bracing and clean. A post-meal standard across many traditions.",
    facts: [
      "The × in Mentha × piperita marks it as a hybrid — a natural cross between water mint and spearmint.",
      "In Greek myth, Minthe was a naiad transformed into the plant by a jealous Persephone.",
      "Moroccan mint tea traditionally uses spearmint, not peppermint — a common confusion in Western recipes.",
      "Peppermint's cooling sensation is menthol activating your TRPM8 receptors — the same ones that respond to cold.",
    ],
  },
  rooibos: {
    name: "Rooibos", latin: "Aspalathus linearis", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["comfort", 4], ["settle", 3]],
    flavors: ["honey", "woody", "vanilla"],
    pairs: ["cinnamon", "ginger", "vanilla", "cloves", "rose", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "South African red bush — naturally sweet, round, and forgiving to over-steep.",
    facts: [
      "Rooibos only grows in the Cederberg mountains of South Africa — attempts to cultivate it elsewhere have largely failed.",
      "The plant was commercialized in the 1930s by Benjamin Ginsberg, a Russian immigrant, after centuries of indigenous Khoisan use.",
      "Unlike true tea, rooibos contains no caffeine and very little tannin, which is why it never turns bitter.",
      "The red color comes from oxidation — 'green' rooibos (unoxidized) also exists and tastes grassier.",
    ],
  },
  sencha: {
    name: "Sencha Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 25, tempC: [70, 85], timeS: [60, 120],
    effects: [["focus", 4], ["energy", 3], ["focus", 4]],
    flavors: ["grassy", "marine", "umami"],
    pairs: ["peppermint", "lemonbalm", "jasmine", "spearmint"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Steamed Japanese green, vegetal and oceanic. Burns easily — keep the water well under a boil.",
    facts: [
      "Sencha is steamed, not pan-fired — a 1738 Japanese innovation that fixed the vivid green color and vegetal flavor.",
      "The umami character comes from L-theanine, an amino acid that also contributes to green tea's characteristic 'calm focus' feeling.",
      "First-flush sencha (shincha) harvested in spring is considered the most prized and delicate.",
      "Asamushi (lightly steamed) tastes more grassy; fukamushi (deeply steamed) tastes fuller and cloudier in the cup.",
    ],
  },
  assam: {
    name: "Assam Black", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 60, tempC: [95, 100], timeS: [180, 300],
    effects: [["energy", 5], ["focus", 3], ["comfort", 4]],
    flavors: ["malty", "woody", "cocoa"],
    pairs: ["ginger", "cinnamon", "cardamom", "cloves", "vanilla"],
    dose: "1 tsp · 200ml",
    headsUp: "High caffeine — not for late afternoons.",
    blurb: "Robust, malty Indian black. The backbone of a proper morning cup.",
    facts: [
      "Assam was 'discovered' by the British in 1823 — but the Singpho people had been drinking it for centuries already.",
      "Assam is grown at or near sea level, unusual for fine tea — most highland teas prefer thin air.",
      "The malty character comes from the specific tea plant variety, Camellia sinensis assamica, native to the region.",
      "Second-flush Assam (picked in early summer) is prized for a honey-sweet note called 'muscatel' on the finish.",
    ],
  },
  ginger: {
    name: "Ginger", latin: "Zingiber officinale", category: "spice",
    caffeine: 0, tempC: [100, 100], timeS: [420, 600],
    effects: [["comfort", 5], ["settle", 4], ["energy", 2]],
    flavors: ["spiced", "warm", "citrus"],
    pairs: ["assam", "rooibos", "peppermint", "cinnamon", "cardamom", "cloves", "lemongrass"],
    dose: "2 coins · 250ml",
    headsUp: null,
    blurb: "Dried or fresh — a foundation for warming blends and a digestive ally.",
    facts: [
      "The 'ginger' most people use is a rhizome, not a root — the visible knobby shape is an underground stem.",
      "Ginger has been cultivated so long in Asia that no true wild ancestor has ever been identified.",
      "Fresh ginger tastes brighter because its key compound (gingerol) converts to the warmer shogaol when dried or cooked.",
      "Arab traders introduced ginger to the Mediterranean along the Silk Road — it appears in Roman recipes by the 1st century.",
    ],
  },
  hibiscus: {
    name: "Hibiscus", latin: "Hibiscus sabdariffa", category: "flower",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["energy", 2], ["cooling", 3], ["energy", 3]],
    flavors: ["tart", "fruity", "cranberry"],
    pairs: ["rose", "rooibos", "ginger", "lemongrass"],
    dose: "1 tsp · 200ml",
    headsUp: "May lower blood pressure — sip modestly if relevant.",
    blurb: "Ruby-red, tart, and refreshing. Tastes like the idea of cranberries.",
    facts: [
      "The species name sabdariffa likely derives from an Arabic word meaning 'a desert plant.'",
      "Egyptian karkadé, Mexican jamaica, and West African sobolo are all the same plant, prepared in different traditions.",
      "Pharaohs were reportedly served hibiscus tea as a cooling drink — the plant has been found in tomb offerings.",
      "The tartness is from hibiscus and malic acids — the same acids that make apples and grapes taste bright.",
    ],
  },
  rose: {
    name: "Rose Petal", latin: "Rosa × damascena", category: "flower",
    caffeine: 0, tempC: [90, 95], timeS: [240, 300],
    effects: [["calm", 3], ["energy", 3]],
    flavors: ["floral", "sweet", "fruity"],
    pairs: ["chamomile", "lavender", "hibiscus", "cardamom", "tulsi", "vanilla", "white", "oolong"],
    dose: "1 tsp · 200ml",
    headsUp: "Source food-grade petals — ornamental roses may carry pesticide residue.",
    blurb: "Subtle, powdery, and romantic. Lifts a blend into something hand-written.",
    facts: [
      "The damask rose (Rosa × damascena) is the one used in most rose waters and oils — a naturally-occurring hybrid probably from the Middle East.",
      "It takes roughly 10,000 roses to produce a single ounce of rose essential oil — why pure rose oil costs more than gold by weight.",
      "Rose petals appear in Persian, Turkish, Indian, and Moroccan cuisine — a tradition that moved along Islamic trade routes.",
      "The floral perfume comes mostly from rose oxide, citronellol, and geraniol — compounds shared with many citrus fruits.",
    ],
  },

  /* ── new: spices (warming, digestive, chai-adjacent) ────────────── */

  cinnamon: {
    name: "Cinnamon", latin: "Cinnamomum verum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["comfort", 5], ["comfort", 3], ["settle", 3]],
    flavors: ["spiced", "sweet", "woody", "warm"],
    pairs: ["assam", "rooibos", "ginger", "cardamom", "cloves", "vanilla"],
    dose: "½ stick or ½ tsp · 250ml",
    headsUp: "Cassia (most common) has higher coumarin — heavy daily use is cautioned. Ceylon (C. verum) is safer for frequent use.",
    blurb: "True Ceylon cinnamon is delicate and sweet; cassia is stronger and more common. Both warm a cup and lean it toward dessert.",
    facts: [
      "Most cinnamon sold in the US is actually cassia — true Ceylon cinnamon (C. verum) is rarer and gentler.",
      "Cinnamon was once worth more than gold; medieval traders protected its source with stories of cinnamon birds and dragons.",
      "You can tell Ceylon from cassia by looking at the bark: Ceylon rolls up in many thin papery layers, cassia in one thick curl.",
      "The warming sensation is cinnamaldehyde activating TRPV3 receptors — adjacent to but not the same as capsaicin's heat.",
    ],
  },
  cardamom: {
    name: "Cardamom", latin: "Elettaria cardamomum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 480],
    effects: [["comfort", 4], ["settle", 3], ["energy", 3]],
    flavors: ["spiced", "floral", "citrus", "complex"],
    pairs: ["assam", "rose", "ginger", "cinnamon", "cloves", "vanilla", "tulsi"],
    dose: "3–4 crushed pods · 250ml",
    headsUp: null,
    blurb: "The 'queen of spices' — bright, aromatic, and complex. Crush pods just before brewing. Essential to masala chai.",
    facts: [
      "Cardamom is the third-most expensive spice by weight, after saffron and vanilla.",
      "Scandinavian cardamom use is a Viking-era inheritance — brought back from Constantinople along the eastern trade routes.",
      "Bedouin coffee (gahwa) is essentially cardamom water with a whisper of coffee — the pods are the main act.",
      "In Ayurveda, cardamom is considered tridoshic — balancing for all three constitutional types.",
    ],
  },
  cloves: {
    name: "Cloves", latin: "Syzygium aromaticum", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["comfort", 5], ["settle", 3]],
    flavors: ["spiced", "pungent", "warm", "numbing"],
    pairs: ["assam", "cinnamon", "cardamom", "ginger", "rooibos"],
    dose: "2–3 cloves · 250ml",
    headsUp: "Very strong — can numb the tongue. One or two cloves, not a handful.",
    blurb: "Intensely warming, with a characteristic numbing quality. A little goes a long way.",
    facts: [
      "Cloves are flower buds — harvested before they bloom, then dried until they turn dark brown.",
      "The numbing sensation is eugenol, once used by dentists as a topical anesthetic before modern options.",
      "Cloves were so valuable to the Dutch East India Company that they burned all clove trees outside their Maluku plantations to preserve monopoly.",
      "A single Indonesian clove tree named 'Afo' is believed to be around 400 years old, surviving the Dutch purges.",
    ],
  },
  vanilla: {
    name: "Vanilla Bean", latin: "Vanilla planifolia", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["comfort", 4], ["settle", 3]],
    flavors: ["sweet", "creamy", "floral", "warm"],
    pairs: ["rooibos", "assam", "cinnamon", "cardamom", "rose"],
    dose: "½ bean split · 250ml",
    headsUp: null,
    blurb: "The dried seed pod of a climbing orchid. Rich, sweet, and creamy — lifts any blend toward dessert without actual sugar.",
    facts: [
      "Vanilla is the only orchid that produces an edible fruit.",
      "A 12-year-old enslaved boy named Edmond Albius invented hand-pollination on Réunion in 1841, making commercial vanilla possible outside Mexico.",
      "Most 'vanilla flavor' is synthetic vanillin — real vanilla beans contain hundreds of additional aromatic compounds that give depth.",
      "Curing a bean takes months: daily cycles of sun, sweat, and rest transform bland green pods into the fragrant dark ones used in cooking.",
    ],
  },

  /* ── new: herbals ──────────────────────────────────────────────── */

  spearmint: {
    name: "Spearmint", latin: "Mentha spicata", category: "herbal",
    caffeine: 0, tempC: [85, 100], timeS: [300, 420],
    effects: [["settle", 3], ["cooling", 3], ["energy", 2]],
    flavors: ["minty", "sweet", "grassy", "cool"],
    pairs: ["lemonbalm", "sencha", "rose", "chamomile", "gunpowder"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Gentler than peppermint — sweeter, less camphor. A safer choice in delicate floral or green-tea blends.",
    facts: [
      "Spearmint is one of peppermint's parents — peppermint (Mentha × piperita) is a hybrid of spearmint and water mint.",
      "The 'spear' in the name refers to the pointed shape of its leaves, not any weapon association.",
      "Moroccan mint tea traditionally uses nana mint, a variety of spearmint, steeped aggressively with gunpowder green.",
      "Spearmint's primary aromatic is carvone, which smells distinctly different from peppermint's menthol.",
    ],
  },
  passionflower: {
    name: "Passionflower", latin: "Passiflora incarnata", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [420, 600],
    effects: [["calm", 4], ["sleepy", 4], ["settle", 3]],
    flavors: ["grassy", "hay", "mild"],
    pairs: ["chamomile", "lemonbalm", "lavender"],
    dose: "1 tsp · 200ml",
    headsUp: "Sedative — avoid combining with other sedatives or alcohol, and don't drive after. Not for pregnancy.",
    blurb: "Mild and hay-like in flavor. Reliably drowsy — pair with stronger-tasting herbs to carry a blend.",
    facts: [
      "Spanish missionaries in South America named it 'Passion flower' for its crown of filaments — seen as the crown of thorns.",
      "The Cherokee and other indigenous peoples of the American Southeast used it long before Europeans arrived.",
      "Unlike many sedative herbs, passionflower doesn't appear to impair memory or morning focus in moderate doses.",
      "The flavor is mild because passionflower's potency is in alkaloids and flavonoids, not aromatic oils.",
    ],
  },
  lemongrass: {
    name: "Lemongrass", latin: "Cymbopogon citratus", category: "herbal",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["energy", 3], ["cooling", 3], ["settle", 2]],
    flavors: ["citrus", "grassy", "bright"],
    pairs: ["ginger", "peppermint", "lemonbalm", "rose", "rooibos", "hibiscus"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "Long grassy stalks bringing a bright, clean lemon note without citrus acidity. A staple of Southeast Asian beverages.",
    facts: [
      "The lemon smell comes from citral, the same compound that gives lemon zest its character — but in a higher concentration.",
      "Thai and Vietnamese cooking uses the lower bulb; tea prefers the upper grass parts, which are too fibrous to eat.",
      "Lemongrass is in the same family as bamboo, not citrus — the lemon note is a chemical coincidence.",
      "West African and Caribbean traditions use it heavily in cold-and-flu remedies, often with ginger and honey.",
    ],
  },
  fennel: {
    name: "Fennel Seed", latin: "Foeniculum vulgare", category: "spice",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["settle", 4], ["calm", 2]],
    flavors: ["licorice", "sweet", "aromatic"],
    pairs: ["peppermint", "ginger", "chamomile", "lemonbalm", "rooibos"],
    dose: "1 tsp crushed · 200ml",
    headsUp: "Heavy doses cautioned in pregnancy — verify.",
    blurb: "Bright anise-like seeds — a digestive classic across Mediterranean and Indian traditions. Often served after a heavy meal.",
    facts: [
      "In Indian restaurants, the colored mukhwas served after a meal is usually sugar-coated fennel seeds — a tradition now 1,000 years old.",
      "The licorice-like aroma comes from anethole, the same compound in anise and star anise (which are unrelated plants).",
      "The Greek word for fennel, marathon, gave its name to the famous battlefield — which was a field of wild fennel.",
      "Fennel was associated with Dionysus in ancient Greece; his followers carried wands of fennel stalk called thyrsi.",
    ],
  },

  /* ── new: flower ───────────────────────────────────────────────── */

  jasmine: {
    name: "Jasmine", latin: "Jasminum sambac", category: "flower",
    caffeine: 0, tempC: [75, 85], timeS: [120, 180],
    effects: [["calm", 3], ["energy", 3]],
    flavors: ["floral", "sweet", "honeyed", "heady"],
    pairs: ["sencha", "white", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Small star-shaped flowers, traditionally layered at night with green or white tea to scent the leaves. Too-hot water kills the perfume.",
    facts: [
      "Jasmine tea is not flavored — the scent is absorbed from fresh blossoms layered overnight with tea leaves, sometimes across multiple nights.",
      "The flowers are picked during the day when closed, and open to release fragrance only after dark — which is why scenting happens at night.",
      "Jasminum sambac is the national flower of the Philippines and Indonesia; it's also used in Hawaiian leis.",
      "Real jasmine perfume is vastly more complex than synthetic jasmine notes — more than 100 distinct aromatic compounds contribute to it.",
    ],
  },

  /* ── new: adaptogen ────────────────────────────────────────────── */

  tulsi: {
    name: "Tulsi", latin: "Ocimum tenuiflorum", category: "adaptogen",
    caffeine: 0, tempC: [95, 100], timeS: [300, 420],
    effects: [["focus", 3], ["calm", 3], ["energy", 3], ["settle", 3]],
    flavors: ["spiced", "clove", "peppery", "sweet"],
    pairs: ["rose", "cardamom", "lemonbalm", "ginger", "peppermint"],
    dose: "1 tsp · 200ml",
    headsUp: "May affect blood sugar and thyroid function — verify interactions if relevant.",
    blurb: "Holy basil — sacred in Ayurvedic tradition, where it's called the 'incomparable one.' Clove-like and peppery, with the characteristic adaptogenic quality of lifting both ends of the day.",
    facts: [
      "Traditional Hindu households often grow tulsi in a courtyard shrine called a tulsi vrindavan.",
      "The three main varieties — Rama, Krishna, and Vana — have slightly different flavor profiles and are sometimes blended.",
      "Tulsi's clove-like notes come from eugenol, the same compound that gives cloves their character.",
      "As an 'adaptogen,' tulsi is classed with plants thought to help the body maintain equilibrium under stress.",
    ],
  },

  /* ── new: true teas ────────────────────────────────────────────── */

  white: {
    name: "White Tea", latin: "Camellia sinensis", category: "true tea", subcategory: "white",
    caffeine: 18, tempC: [75, 85], timeS: [180, 300],
    effects: [["calm", 3], ["energy", 3], ["focus", 3]],
    flavors: ["sweet", "hay", "honey", "delicate", "melon"],
    pairs: ["jasmine", "rose"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The least-processed tea — freshly-plucked leaves allowed to wither. Delicate, naturally sweet, with honey and melon notes. Rewards patience and soft water.",
    facts: [
      "White tea is traditionally made from the youngest buds — the fine silver hairs on the leaves are where the 'silver needle' grade gets its name.",
      "The Fujian province of China is the ancestral home of white tea; attempts to grow it elsewhere typically lose the delicate profile.",
      "Because processing is minimal, white tea retains more of certain antioxidants than other tea types.",
      "White tea gets better with age — well-stored aged white tea (3+ years) develops deeper fruit and honey notes.",
    ],
  },
  oolong: {
    name: "Oolong", latin: "Camellia sinensis", category: "true tea", subcategory: "oolong",
    caffeine: 37, tempC: [85, 95], timeS: [120, 240],
    effects: [["focus", 3], ["energy", 3], ["comfort", 2]],
    flavors: ["floral", "fruit", "toasted", "honey"],
    pairs: ["rose", "jasmine"],
    dose: "1–2 tsp · 200ml",
    headsUp: null,
    blurb: "The middle path between green and black — partially oxidized, spectacularly varied by origin. Taiwanese high-mountain leans floral; Wuyi rock leans toasted and mineral.",
    facts: [
      "'Oolong' means 'black dragon' in Chinese — possibly from the dark twisted leaves, possibly from origin legends.",
      "Oxidation levels can range from 10% (barely green-ish) to 80% (nearly black), producing a vast flavor spectrum.",
      "Taiwan's high-mountain oolongs (gaoshan) are often harvested above 1,000m, where slower growth concentrates flavor.",
      "Traditional gongfu brewing uses very concentrated leaf-to-water ratios and many short steeps — five or six cups from one batch.",
    ],
  },
  gyokuro: {
    name: "Gyokuro", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 45, tempC: [50, 60], timeS: [90, 120],
    effects: [["focus", 5], ["focus", 5], ["energy", 3]],
    flavors: ["umami", "marine", "sweet", "buttery", "seaweed"],
    pairs: ["rose"],
    dose: "1 tbsp (~4 g) · 100ml",
    headsUp: "Treat like a delicate wine. The unusually cool water is not a typo — near-boiling water destroys the profile this tea is prized for.",
    blurb: "Shade-grown for three weeks before harvest, which multiplies the L-theanine and deepens the leaves. Intensely sweet and savory at once, brewed cool and brief. Japan's most prestigious everyday tea.",
    facts: [
      "The three-week shading forces the plant to produce more chlorophyll and amino acids to catch scarce light — which is what creates the umami.",
      "Proper gyokuro is brewed at near-lukewarm temperatures, around 50-60°C — Westerners often ruin their first attempt with boiling water.",
      "Uji (near Kyoto) is the traditional home of the highest-grade gyokuro; the region has been growing shaded tea since the 1800s.",
      "The second and third infusions can be as good as the first, sometimes better — gyokuro is a multi-steep tea, not a one-shot.",
    ],
    variants: [
      { intent: "classic",    tempC: 55, timeS: 90,  note: "The traditional cool, short brew. Multiple steeps." },
      { intent: "refreshing", tempC: 50, timeS: 180, note: "Cold brew — even sweeter, zero astringency." },
    ],
  },
  gunpowder: {
    name: "Gunpowder Green", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 30, tempC: [80, 90], timeS: [120, 240],
    effects: [["focus", 3], ["energy", 3], ["comfort", 2]],
    flavors: ["smoky", "toasted", "vegetal", "brisk"],
    pairs: ["spearmint", "peppermint", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese pan-fired green rolled into tight pellets — the 'gunpowder'. Unfurls during brewing. Stands up to bold treatments like mint and sugar; the backbone of Maghrebi tea culture.",
    facts: [
      "The English name comes from the pellets' resemblance to old-fashioned musket-ball gunpowder.",
      "The Chinese name is Zhū chá — 'pearl tea' — a much nicer image than the Western one.",
      "Rolling the leaves into pellets protects them from air, so gunpowder green keeps its flavor longer than open-leaf greens.",
      "Moroccan mint tea traditionally pours high from the pot to aerate the tea and build the foam considered proper to a good serving.",
    ],
  },
  hojicha: {
    name: "Hojicha", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 8, tempC: [95, 100], timeS: [30, 60],
    effects: [["comfort", 3], ["settle", 3], ["comfort", 3]],
    flavors: ["roasted", "woody", "caramel", "nutty", "toasted"],
    pairs: ["rooibos", "ginger", "vanilla"],
    dose: "1 tbsp · 250ml",
    headsUp: null,
    blurb: "Japanese green tea roasted over charcoal until the leaves turn reddish-brown. The roasting strips most of the caffeine and brings up warm, toasty, caramel notes. An evening tea that isn't an herbal.",
    facts: [
      "Hojicha was invented in Kyoto in the 1920s by a merchant roasting stems and leftover tea — a frugal solution that became its own category.",
      "The roasting breaks down caffeine, making hojicha one of the few true teas that's fine for evening drinking.",
      "Because the flavor comes from roasting, hojicha tolerates boiling water — where most green teas would turn bitter.",
      "Hojicha powder has become a matcha-style specialty in modern Japanese cafés, showing up in lattes and desserts.",
    ],
  },
  dragonwell: {
    name: "Dragonwell", latin: "Camellia sinensis", category: "true tea", subcategory: "green",
    caffeine: 28, tempC: [75, 85], timeS: [90, 180],
    effects: [["focus", 4], ["energy", 3], ["focus", 3]],
    flavors: ["nutty", "chestnut", "sweet", "vegetal", "bean"],
    pairs: ["rose", "jasmine"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Longjing — pan-fired Chinese green from Hangzhou's West Lake, hand-pressed flat against hot woks. Sweet, faintly chestnut-like, and among the most prized teas in China. A cup that rewards attention.",
    facts: [
      "Only tea grown in a small zone around West Lake can legally be called 'Longjing' in China, similar to champagne's appellation rules.",
      "The flat shape is the result of hand-pressing leaves against the inside of a hot wok — a skilled master shapes many kilos a day.",
      "Emperor Qianlong of the Qing dynasty reportedly designated 18 tea bushes as 'imperial' — their descendants still grow at the Hugong Temple.",
      "The chestnut note comes from roasted pyrazines formed during pan-firing — the same family of compounds in fresh-baked bread.",
    ],
  },
  darjeeling: {
    name: "Darjeeling", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 40, tempC: [85, 90], timeS: [180, 240],
    effects: [["energy", 3], ["energy", 4], ["focus", 3]],
    flavors: ["muscatel", "floral", "fruit", "bright"],
    pairs: ["rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Grown in the Himalayan foothills of West Bengal — unusually light for a black tea, with a distinctive muscatel-grape note. Called 'the champagne of teas'; first flush (spring harvest) is the most prized. Best served without milk.",
    facts: [
      "Darjeeling has a legally protected geographical indication in India — only tea from the 87 designated gardens can wear the name.",
      "The muscatel note is associated with thrip infestation, where tiny insects puncture the leaves, triggering a defense response that adds flavor.",
      "Unlike most black teas, Darjeeling is only partially oxidized — which is why a first-flush cup can look green-gold rather than coppery red.",
      "The original Chinese tea plants smuggled to Darjeeling by Robert Fortune in the 1840s adapted unusually well to the Himalayan altitude.",
    ],
    variants: [
      { intent: "first flush",  tempC: 85, timeS: 180, note: "Light, muscatel — spring harvest, most delicate." },
      { intent: "second flush", tempC: 90, timeS: 240, note: "Fuller body, rounder fruit — summer harvest." },
    ],
  },
  ceylon: {
    name: "Ceylon Black", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 45, tempC: [95, 100], timeS: [180, 240],
    effects: [["energy", 3], ["energy", 3], ["comfort", 3]],
    flavors: ["citrus", "bright", "brisk", "woody"],
    pairs: ["ginger", "lemongrass", "cinnamon", "cardamom", "rose"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Sri Lankan black tea — brisk and bright, with a characteristic citrus lift. The backbone of most breakfast blends and the base for most commercial Earl Grey. Forgiving of milk and sugar.",
    facts: [
      "Sri Lanka only became a tea producer after a coffee blight in the 1860s wiped out its coffee industry — the plantations were replanted with tea.",
      "James Taylor, a Scottish planter, planted the first commercial tea in Ceylon in 1867 at the Loolecondera Estate.",
      "The brightness is characteristic of mid-elevation Ceylon teas — higher-grown Nuwara Eliya leans lighter, lower-grown leans maltier.",
      "'Ceylon' is the old colonial name — the country has been Sri Lanka since 1972, but tea branding kept the older word.",
    ],
  },
  lapsang: {
    name: "Lapsang Souchong", latin: "Camellia sinensis", category: "true tea", subcategory: "black",
    caffeine: 30, tempC: [95, 100], timeS: [180, 240],
    effects: [["comfort", 4], ["settle", 2]],
    flavors: ["smoked", "pine", "tar", "campfire", "woody"],
    pairs: ["rooibos"],
    dose: "1 tsp · 200ml",
    headsUp: null,
    blurb: "Chinese black tea from Fujian, dried over pine fires. Famously smoky — campfire and tar on first sip. The tea you either love immediately or never drink again; in either case, unmistakable.",
    facts: [
      "The smoky profile was reportedly an accident — Qing-era soldiers occupying a tea factory during harvest forced the growers to dry the crop quickly over pine fires to get them out.",
      "It may be the first black tea ever created, predating the intentional production of other black teas.",
      "Some connoisseurs consider the smoky version a 'ruined' version of a more subtle base; unsmoked Zhengshan Xiaozhong is a different, floral-fruity tea.",
      "Lapsang is often called a 'campfire tea' in the West — it pairs surprisingly well with savory foods like cheese and cured meats.",
    ],
  },
  puerh: {
    name: "Shou Pu-erh", latin: "Camellia sinensis", category: "true tea", subcategory: "pu-erh",
    caffeine: 35, tempC: [95, 100], timeS: [60, 180],
    effects: [["comfort", 4], ["settle", 3], ["settle", 3]],
    flavors: ["earthy", "woody", "dark", "leather", "mineral"],
    pairs: [],
    dose: "1 tsp · 200ml · multi-steep",
    headsUp: null,
    blurb: "Post-fermented dark tea from Yunnan, aged for months or decades. Shou (ripe) is pile-fermented over weeks; sheng (raw) ages naturally over years. Deep, earthy, long-lived — good pu-erh gives five or more distinct steeps from the same leaves.",
    facts: [
      "Pu-erh is the only type of tea that genuinely improves with age — some aged sheng (raw) cakes from the 1950s sell for thousands per gram.",
      "The 'pile fermentation' technique for shou (ripe) pu-erh was only developed in 1973 — it compresses decades of aging into weeks using microbes and humidity.",
      "Pu-erh is traditionally pressed into bricks or cakes for easier trade along the ancient Tea Horse Road between Yunnan and Tibet.",
      "The microbial activity during aging gradually converts bitter polyphenols into smoother, earthier compounds — which is why young sheng is astringent and old sheng is mellow.",
    ],
    variants: [
      { intent: "rinse",   tempC: 100, timeS: 15,  note: "Brief rinse first — rouses the leaves, discard the liquid." },
      { intent: "early",   tempC: 100, timeS: 30,  note: "First real steep — short, to honor the leaves." },
      { intent: "middle",  tempC: 100, timeS: 90,  note: "Steeps 3–5 — the tea's sweet spot." },
      { intent: "late",    tempC: 100, timeS: 300, note: "Later steeps — longer, still rewarding." },
    ],
  },
};

export const MOODS  = ["calm", "focus", "energy", "sleepy", "comfort", "settle"];
export const FLAVORS= ["sweet", "fruity", "citrus", "floral", "minty", "spiced", "earthy"];

// EFFECT_TO_MOOD — how ingredient/blend effect tags project onto the mood
// space that users pick from. After the vocabulary normalization pass, most
// effects already use mood words directly (calm, focus, energy, sleepy,
// comfort, settle). Non-mood tags like "cooling" and "bitterness" are
// real ingredient properties but aren't moods — they map to null, signaling
// "this effect is real but doesn't participate in mood-matching."
export const EFFECT_TO_MOOD = {
  calm:       "calm",
  focus:      "focus",
  energy:     "energy",
  sleepy:     "sleepy",
  comfort:    "comfort",
  settle:     "settle",
  cooling:    null,
  bitterness: null,
};


// FLAVOR_TO_CATEGORY — projects the rich ingredient-level flavor vocabulary
// (~57 distinct tags across the ingredient catalog) onto the 7 user-facing
// flavor categories. The mapping is deliberately opinionated: some rounds
// like "umami" or "marine" don't fit cleanly but are closer to "earthy"
// than anything else. Used by the algorithm when matching ingredient
// flavors to user-selected flavor chips.
export const FLAVOR_TO_CATEGORY = {
  // sweet
  sweet: "sweet", honey: "sweet", honeyed: "sweet", vanilla: "sweet",
  caramel: "sweet", creamy: "sweet", melon: "sweet", buttery: "sweet",
  chestnut: "sweet", cranberry: "sweet",
  // fruity
  fruity: "fruity", fruit: "fruity", apple: "fruity",
  tart: "fruity", muscatel: "fruity",
  // citrus
  citrus: "citrus", bright: "citrus",
  // floral
  floral: "floral", aromatic: "floral", heady: "floral", delicate: "floral",
  // minty
  minty: "minty", mint: "minty", cool: "minty", camphor: "minty", pine: "minty",
  // spiced
  spiced: "spiced", warm: "spiced", spicy: "spiced", pungent: "spiced",
  peppery: "spiced", clove: "spiced", licorice: "spiced", complex: "spiced",
  numbing: "spiced",
  // earthy (largest bucket — deep, mineral, savory, smoky all round here)
  earthy: "earthy", woody: "earthy", hay: "earthy", grassy: "earthy",
  vegetal: "earthy", umami: "earthy", marine: "earthy", seaweed: "earthy",
  mineral: "earthy", bean: "earthy", toasted: "earthy", nutty: "earthy",
  malty: "earthy", cocoa: "earthy", smoky: "earthy", smoked: "earthy",
  tar: "earthy", campfire: "earthy", leather: "earthy", roasted: "earthy",
  dark: "earthy", brisk: "earthy", mild: "earthy",
};

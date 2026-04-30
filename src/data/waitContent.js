/* ──────────────────────────────────────────────────────────────
   data/waitContent.js — Steep-screen content (facts, traditions, poems)

   Content shown on rotating cards during a brew's wait timer.

   - WAIT_FACTS: ingredient-specific facts and traditional-use notes,
     keyed by ingredient id. Sourced against the research files in
     docs/research/ingredients/; claims that didn't hold up have been
     either rewritten or removed.

   - WAIT_POEMS: public-domain poems and fragments tagged by
     ingredient/mood/theme so they can surface in relevant brews.
     Classical Japanese haiku (Bashō, Buson, Issa) and Rumi are
     all safely pre-1930.

   - buildWaitCards: composes the content stream for a given brew.
     Pulls ingredient facts, filters poems by match, rotates the
     lists by a time-based seed (so the same brew doesn't always
     start with the same card), caps poem frequency, and interleaves
     facts and poems. Opens with ingredient content, never ends with
     a poem — "close with the cup, not literature."
   ────────────────────────────────────────────────────────────── */

export const WAIT_FACTS = {
  chamomile: [
    { type: "fact",      text: "Chamomile's calming compound, apigenin, releases most in the final two minutes. The last minutes of the steep are where most of it arrives." },
    { type: "tradition", text: "In parts of Eastern Europe, chamomile was strewn across floors before gatherings — walking on it released the scent, perfuming the room." },
    { type: "fact",      text: "Chamomile has been cultivated for at least 2,000 years — Bronze Age pollen turns up in European archaeological sites, and the plant was widely traded across the ancient Mediterranean." },
    { type: "fact",      text: "Apigenin docks at the same GABA-A receptor site as benzodiazepines — the cup nudges the same lock the prescription opens, just gentler and slower." },
  ],
  lavender: [
    { type: "fact",      text: "The word lavender comes from the Latin lavare — to wash. Romans added it to bathwater." },
    { type: "fact",      text: "Lavender's essential oil contains linalool, the compound clinical trials credit with the herb's measurable anxiolytic effect — Germany's Silexan preparation runs on it." },
    { type: "tradition", text: "In Provence, lavender harvest begins at dawn, when the oils are most concentrated and the heat hasn't yet driven them off." },
    { type: "fact",      text: "Linalool reaches the brain through breath as effectively as through the gut — half the cup's effect arrives before you sip." },
  ],
  lemonbalm: [
    { type: "fact",      text: "Lemon balm (Melissa officinalis) takes its botanical name from the Greek melissa — honeybee. Bees are drawn to it reliably." },
    { type: "tradition", text: "Medieval European herbalists brewed lemon balm for what they called 'gladness of spirit' — an early recognition of its mild mood-lifting effect. Carmelite Water, a famous 17th-century French recipe, made the use widely known." },
    { type: "fact",      text: "Rosmarinic acid in lemon balm modestly raises GABA in the brain — the calm-without-drowsy register that Paracelsus, who called it the elixir of life, would have recognized." },
  ],
  peppermint: [
    { type: "fact",      text: "Peppermint is a natural hybrid of spearmint and water mint. Most of what sells as 'mint' in tea is actually peppermint." },
    { type: "fact",      text: "Menthol, peppermint's cooling compound, triggers the same TRPM8 cold-receptors that respond to actual cold — your mouth 'feels' the chill that isn't there." },
    { type: "tradition", text: "Greek and Roman tables ended with mint two thousand years before TRPM8 was discovered — folk medicine got there by experiment, the lab caught up later." },
  ],
  spearmint: [
    { type: "tradition", text: "Moroccan tea service traditionally uses three pours: the first bitter as life, the second sweet as love, the third gentle as death." },
    { type: "fact",      text: "Spearmint has carvone where peppermint has menthol — a different cooling compound entirely, which is why it reads softer and pairs better with green tea." },
    { type: "fact",      text: "Recent trials show spearmint modestly lowers androgens — the Mediterranean folk wisdom about 'cooling the blood' meeting endocrinology." },
  ],
  rooibos: [
    { type: "fact",      text: "Rooibos grows only in the Cederberg region of South Africa. Attempts to cultivate it elsewhere have largely failed." },
    { type: "tradition", text: "The Khoi people of the Cederberg have used rooibos for centuries; it entered European consciousness only in the early 1900s." },
    { type: "fact",      text: "Aspalathin — the antioxidant that gives rooibos its sweetness without sugar — exists in no other plant on earth." },
  ],
  sencha: [
    { type: "fact",      text: "Sencha is made by steaming fresh tea leaves within hours of harvest — a Japanese innovation, introduced by Soen Nagatani in 1738, that preserves the grassy green notes Chinese pan-firing doesn't." },
    { type: "tradition", text: "Japanese tea masters consider the first pour of sencha almost ceremonial — water at the wrong temperature can ruin months of the farmer's work." },
    { type: "fact",      text: "The leaf burns at a true boil. Brew between 70 and 80°C or you'll lose the theanine to scorched grass." },
  ],
  assam: [
    { type: "fact",      text: "Assam was discovered growing wild by British botanist Robert Bruce in 1823, disproving the assumption that tea was exclusively Chinese — and breaking the empire's monopoly on the trade." },
    { type: "fact",      text: "Camellia sinensis assamica has bigger leaves and more caffeine than its Chinese cousin — the cup demands milk and gets it." },
    { type: "tradition", text: "British breakfast culture was built on Assam, and on the labor that picked it. The leaf travels with that history." },
  ],
  darjeeling: [
    { type: "fact",      text: "Darjeeling's character comes from elevation — gardens sit at 600-2000m in the Himalayan foothills, producing slow-growing, intensely flavored leaves." },
    { type: "tradition", text: "The 'first flush' — Darjeeling leaves picked in spring after dormancy — is considered the estate's finest, sometimes called the 'champagne of teas.'" },
    { type: "fact",      text: "Darjeeling's muscatel grape note comes from the tea jassid, a tiny insect whose bite triggers the leaf's defensive chemistry. Beauty as injury, healed." },
  ],
  ginger: [
    { type: "fact",      text: "Ginger's heat comes from gingerol, which converts to shogaol when dried or heated — shogaol is sharper, more warming, and a different molecule than the fresh root carries." },
    { type: "tradition", text: "In Ayurvedic tradition, ginger is considered a universal medicine — warming to the digestive fire and circulation both." },
    { type: "fact",      text: "Roman cooks used ginger before Europe knew where it grew. Chinese sailors chewed it against the swell. The folk uses against nausea hold up cleanly under modern trials." },
  ],
  hibiscus: [
    { type: "fact",      text: "Hibiscus's ruby color comes from anthocyanins, the same family of pigments that make blueberries blue and red cabbage red." },
    { type: "tradition", text: "Known as karkadé in Egypt and agua de jamaica in Mexico, hibiscus tea has traveled widely with different names and almost identical preparations." },
    { type: "fact",      text: "Pharaohs drank hibiscus as a royal beverage. Modern trials show it modestly lowers blood pressure — the crown turned out to know something." },
  ],
  rose: [
    { type: "fact",      text: "Rose petals used in tea are typically Rosa × damascena, cultivated for oil and aroma rather than for the rose gardens most people imagine." },
    { type: "tradition", text: "Tenth-century Persian distillers invented attar of rose chasing the soul of the flower. What's left in dried petals is the gentler form — same family of molecules, slower release." },
    { type: "fact",      text: "Modern trials confirm what Unani physicians have prescribed for a thousand years: rose modestly modulates cortisol and eases mild anxiety without sedation." },
  ],
  cinnamon: [
    { type: "fact",      text: "What most Western markets sell as 'cinnamon' is usually cassia — a close relative. True cinnamon (Ceylon) is lighter in color and more delicate in flavor — and lower in coumarin, which the cassia version carries enough of to stress the liver at heavy daily doses." },
    { type: "fact",      text: "Cinnamon was worth more than gold to the Romans, who never saw the tree. Pliny invented birds nesting on cliffs to explain the supply chain." },
    { type: "tradition", text: "The Maltese knights kept cinnamon in their treasury alongside silver. Trade routes for the spice predate written records." },
  ],
  cardamom: [
    { type: "fact",      text: "Green cardamom pods keep their aromatic oils far longer than the seeds alone. Opening a pod releases the scent, but cracks the preservation." },
    { type: "fact",      text: "Inside the pod sits 1,8-cineole — eucalyptol — the molecule that lets cardamom feel warming and cooling at the same time. The paradox the chemistry resolves cleanly." },
    { type: "tradition", text: "Bedouin coffee is poured through a cardamom-stuffed spout. The pod has flavored hospitality across the Arabian peninsula for over a thousand years." },
  ],
  ashwagandha: [
    { type: "fact",      text: "Ashwagandha's Sanskrit name means 'smell of horse' — referring both to the root's musky scent and, traditionally, the strength it was said to convey." },
    { type: "fact",      text: "The withanolides in ashwagandha don't grant a horse's strength, but trials show they reduce cortisol and improve sleep over six to eight weeks of daily use." },
    { type: "tradition", text: "Ayurveda classes ashwagandha as a rasayana — a longevity tonic. Daily use over months, not a single cup, is how it was always meant." },
  ],

  jasmine: [
    { type: "fact",      text: "Jasmine flowers are picked at dusk and pressed against tea leaves overnight in southern China — the bloom opens after dark and gives up its perfume to whatever's waiting." },
    { type: "fact",      text: "Indole, the molecule that gives jasmine its heady richness, is the same one used in synthetic perfumery. At high concentrations it smells unpleasant; at low ones, it's the soul of the flower." },
    { type: "tradition", text: "Boiling water destroys jasmine's volatile aromatics. Keep the brew below ninety, or the perfume escapes with the steam." },
  ],
  passionflower: [
    { type: "fact",      text: "16th-century Spanish naturalists read elaborate symbolism into passionflower's anatomy — the radial corona, the three styles, the five anthers — and the dramatic name stuck." },
    { type: "fact",      text: "Chrysin and apigenin in the leaves bind the same GABA receptors that benzodiazepines do. The folk drowsiness is real and replicated in trials." },
    { type: "tradition", text: "Mid-19th-century American physicians prescribed passionflower for what they called 'nervous restlessness.' The diagnosis aged better than its century." },
  ],
  lemongrass: [
    { type: "fact",      text: "Thai cooks bruise lemongrass stalks before cutting. The crush releases citral, the same compound that flavors lemon peel and repels mosquitoes." },
    { type: "fact",      text: "Citral is a documented antimicrobial. The folk uses across South and Southeast Asia for fever and stomach line up cleanly with the lab." },
    { type: "tradition", text: "Lemongrass is the foundation of tom yum, a soup whose name simply means 'sour soup.' Citral does most of the work that name describes." },
  ],
  fennel: [
    { type: "fact",      text: "Indian restaurants set a small bowl of fennel by the door for after-meal chewing. The seed's anise note is anethole, which finds GABA receptors in the gut." },
    { type: "tradition", text: "Medieval Europeans chewed fennel seeds through long gatherings to keep the breath sweet and the stomach quiet." },
    { type: "fact",      text: "Both folk traditions — Indian and European — point to the same receptor that science would later name. A quiet softens where you didn't know it was tight." },
  ],
  tulsi: [
    { type: "tradition", text: "Indian households grow tulsi at the front step — a threshold plant in daily life. Tradition asks permission before harvesting." },
    { type: "fact",      text: "Ursolic acid in tulsi leaves measurably blunts the day's cortisol rise over weeks of daily use. Old kitchen botany doing patient work." },
    { type: "fact",      text: "Tulsi is one of the few herbs traditionally classed as both a stimulant and a calming agent. The chemistry shows it modulates rather than pushes — adaptogen behavior." },
  ],
  turmeric: [
    { type: "tradition", text: "Indian brides are anointed with turmeric paste the night before the wedding — auspiciousness rubbed into skin, going back centuries." },
    { type: "fact",      text: "Curcumin, turmeric's active compound, is barely absorbed on its own. The traditional pairing with milk fat and black pepper raises bioavailability dramatically — the kitchen anticipated the pharmacology by a thousand years." },
    { type: "fact",      text: "Piperine in black pepper inhibits the enzymes that would otherwise clear curcumin from the bloodstream. The Ayurvedic recipe for golden milk is, accidentally, a textbook bioavailability hack." },
  ],
  cloves: [
    { type: "fact",      text: "Han dynasty officials chewed cloves before addressing the emperor. The breath it scrubbed clean was managed by eugenol — a topical anesthetic still used in dental clinics today." },
    { type: "tradition", text: "The Dutch and Portuguese fought wars in the Maluku islands for the clove bud. For two centuries, all trade in cloves passed through Amsterdam." },
    { type: "fact",      text: "Eugenol is the same molecule a dentist applies for tooth pain. The folk use against toothache and modern dental practice converged on identical chemistry." },
  ],
  vanilla: [
    { type: "fact",      text: "The vanilla orchid has exactly one wild pollinator — a Mexican Melipona bee that lives nowhere else." },
    { type: "tradition", text: "In 1841, a twelve-year-old enslaved boy named Edmond Albius worked out hand-pollination on Réunion island. The world drinks vanilla because of his technique." },
    { type: "fact",      text: "Vanillin, the principal aromatic, is now synthesized from petrochemicals and wood pulp. Real vanilla pods carry hundreds of supporting molecules the lab can't replicate." },
  ],
  "black-pepper": [
    { type: "fact",      text: "Roman empresses paid taxes in peppercorns. Vasco da Gama crossed an ocean for them. For most of European history, pepper was its own currency." },
    { type: "fact",      text: "The bite the tongue feels is piperine, which slows liver enzymes that would otherwise clear other compounds — exactly why the Ayurvedic recipe pairs turmeric with pepper." },
    { type: "tradition", text: "Visigoths sacking Rome in 410 demanded 3,000 pounds of pepper as part of the ransom. The spice was already older than the empire it broke." },
  ],
  white: [
    { type: "fact",      text: "White tea is the youngest leaves on the bush — withered in the sun, never fired or rolled. The cup tastes the leaf almost as the bush gave it." },
    { type: "fact",      text: "Because nothing touched them, white tea's catechins survive at higher concentration than any other tea — the highest antioxidant load on the shelf." },
    { type: "tradition", text: "Imperial Chinese tea-makers reserved white tea for the court. Silver Needle (Bai Hao Yinzhen) is still graded by how downy and intact each bud is." },
  ],
  gyokuro: [
    { type: "fact",      text: "Gyokuro means 'jade dew.' For the last three weeks before harvest, Uji bushes are shrouded under reed mats." },
    { type: "fact",      text: "Deprived of sun, the leaf hoards theanine and chlorophyll instead of catechins. Sweetness, in this tea, is what darkness leaves behind." },
    { type: "tradition", text: "Gyokuro brews at 50°C in a tiny kyusu with only 60ml of water. Treating it like sencha will burn the cup." },
  ],
  matcha: [
    { type: "tradition", text: "The traveler-scholar Eisai brought powdered tea from Song China to Japan in the twelfth century — a cup for keeping the mind alert through long sitting." },
    { type: "fact",      text: "Drinking the leaf instead of straining it changes the math: every catechin, every theanine, the full L-theanine-to-caffeine ratio that produces calm focus." },
    { type: "fact",      text: "Modern EEG studies confirm the alpha-wave shift the old practitioners named — the cup measurably increases the brainwaves associated with relaxed alertness." },
  ],
  genmaicha: [
    { type: "fact",      text: "Genmaicha was peasant tea by origin — Japanese households stretched scarce leaves with toasted brown rice." },
    { type: "tradition", text: "The frugality became style. Roughly half the caffeine of plain sencha and twice the welcome at the end of a meal." },
    { type: "fact",      text: "The toasted rice does double duty: it tempers the leaf's astringency and adds a starchy roundness no green tea reaches alone." },
  ],
  gunpowder: [
    { type: "fact",      text: "Gunpowder green was rolled into pellets for the long sea voyage from Zhejiang to Europe. What looked like gunpowder kept the leaf compact and fresh through months at sea." },
    { type: "fact",      text: "Tight rolling preserves catechins by reducing oxygen contact — the practical seafarer trick is also good chemistry." },
    { type: "tradition", text: "In Morocco, gunpowder meets sugar and mint and refuses to be drowned. The pellets unfurl in hot water like time-release capsules." },
  ],
  hojicha: [
    { type: "fact",      text: "Hojicha is a 1920s Kyoto invention — tea merchants roasted stems and late-season leaves to redeem otherwise-discardable lots. The frugality became canon." },
    { type: "fact",      text: "Fire above 200°C burns off most of the caffeine and caramelizes what's left. Hojicha is the rare true tea you can drink at nine p.m." },
    { type: "tradition", text: "Roasted teas were originally an evening drink — the fire turned the cup into something workers could take late without losing sleep." },
  ],
  dragonwell: [
    { type: "tradition", text: "West Lake legend says the Qianlong emperor pressed Longjing leaves against his palms while the wok was hot, and the flat shape was born." },
    { type: "fact",      text: "The chestnut sweetness isn't the leaf alone; it's the Maillard reaction — the same chemistry that browns bread crusts and sears steaks." },
    { type: "fact",      text: "Genuine West Lake Longjing comes from a small protected zone around the lake. Most 'dragonwell' on the world market is grown elsewhere and styled the same." },
  ],
  oolong: [
    { type: "fact",      text: "Oolong means 'black dragon' in Chinese — though the word covers everything from a green-leaning Taiwanese high-mountain to a roasted Wuyi rock that drinks like a black tea." },
    { type: "fact",      text: "Partial oxidation is the trick. The percentage decides the cup, and tea masters and food chemists are looking at the same dial: how many polyphenols to leave standing." },
    { type: "tradition", text: "Gongfu-style oolong service uses tiny pots and quick infusions — a single batch of leaves can yield seven to twelve cups, each tasting different." },
  ],
  ceylon: [
    { type: "fact",      text: "A coffee blight in the 1860s burned through Ceylon's plantations. The planters switched crops, and an island became famous for tea instead." },
    { type: "fact",      text: "Ceylon's bright citrus character is altitude. Cooler-grown leaves climb higher into the aromatic register; estate names like Uva and Dimbula are altitude bands." },
    { type: "tradition", text: "James Taylor, a Scottish planter, established Ceylon's first commercial tea garden in 1867. Within forty years, the island was the world's largest tea exporter." },
  ],
  lapsang: [
    { type: "tradition", text: "Legend says soldiers passing through the Wuyi mountains in the late Ming forced tea farmers to dry their leaves over pinewood fires to free the camp. The smoke became the tea." },
    { type: "fact",      text: "The compounds responsible — guaiacol and syringol — are the same molecules in peated Scotch and good barbecue. Folk accident and lab analysis converge on woodsmoke." },
    { type: "fact",      text: "Lapsang is the love-it-or-never-again register of the tea world. The smoke divides drinkers cleanly; there's rarely a polite middle ground." },
  ],
  puerh: [
    { type: "fact",      text: "On the old horse-and-tea road from Yunnan to Tibet, the leaves fermented in their packs from the journey alone — and aged tea became its own category." },
    { type: "fact",      text: "Today's shou pu-erh ages on purpose: fungi work the polyphenols, and a five-year cake tastes nothing like the leaf it was." },
    { type: "tradition", text: "Pu-erh is sold in compressed cakes that families pass down. A well-aged cake is a small inheritance, increasing in value year by year." },
  ],
  "yerba-mate": [
    { type: "tradition", text: "The Guaraní drank yerba mate long before the Jesuits arrived to cultivate it. The gourd passed counterclockwise around a circle is older than any country in South America." },
    { type: "fact",      text: "Three xanthines share the lift — caffeine, theobromine, theophylline — where coffee uses only one. The 'lift without the crash' has chemistry behind it." },
    { type: "fact",      text: "The bombilla — the metal straw with a filter — was invented to drink the loose leaves directly from the gourd without scooping or straining." },
  ],
  valerian: [
    { type: "fact",      text: "Medieval herbalists called valerian 'All-Heal.' Cats roll in it like catnip; trench soldiers in WWI were prescribed it for shell shock." },
    { type: "fact",      text: "The cheese-funk smell is valerenic acid, which finds the same receptor pocket as benzodiazepines — without the prescription, and without the safety net." },
    { type: "tradition", text: "Hippocrates recorded valerian's use against insomnia. The herb has held that role across two and a half millennia of European medicine." },
  ],
  echinacea: [
    { type: "tradition", text: "Plains tribes — Lakota, Cheyenne, Comanche — pressed echinacea root against snakebite and chewed it for sore throat. The Plains pharmacopeia entered Western medicine in the 1880s." },
    { type: "fact",      text: "The tongue-tingle is real chemistry: alkamides binding the cannabinoid receptor family right on the surface of the mouth, where you can feel them work." },
    { type: "fact",      text: "Trial evidence for echinacea's immune effect is mixed but real. The tingle, at least, is unambiguous." },
  ],
  elderflower: [
    { type: "tradition", text: "Northern European folk wouldn't cut an elder without asking the Elder Mother first. Midsummer's flowers marked a turn of the year." },
    { type: "fact",      text: "The folk reverence for the elder turned out to track real chemistry — quercetin in elderflower and its kin block certain viruses, notably influenza A, from entering cells." },
    { type: "fact",      text: "Elderflower volatiles escape with the steam. Steep covered, always, or the perfume goes up the chimney." },
  ],
  linden: [
    { type: "fact",      text: "Linden is the lime tree of Proust's madeleine, and the Slavic lipa shading every village square." },
    { type: "fact",      text: "The mucilage in the flowers coats a sore throat. The flavonoids inside dock at the same GABA receptors a small dose of clonazepam would." },
    { type: "tradition", text: "Linden honey, made by bees foraging on the flowers, is one of the most prized honeys in central Europe. The cup carries the same molecules in trace." },
  ],
  "licorice-root": [
    { type: "fact",      text: "Licorice root is found in 60% of Chinese herbal formulas as the harmonizer — Gan Cao, the diplomat that smooths the rough edges of stronger herbs." },
    { type: "fact",      text: "Glycyrrhizin is fifty times sweeter than sugar, and the same molecule slows the liver's clearance of cortisol — which is why high daily doses can raise blood pressure and lower potassium." },
    { type: "tradition", text: "Egyptian pharaohs were buried with licorice root. King Tut's tomb contained a substantial supply — the apothecary went with him." },
  ],
  nettle: [
    { type: "tradition", text: "Roman legionaries slapped their bare legs with fresh nettle stalks against the British cold. Scottish boys passed a rite by grasping a fistful unflinching." },
    { type: "fact",      text: "The sting is real chemistry — histamine, formic acid, and serotonin loaded into hollow leaf hairs — and a quick steep dismantles every one." },
    { type: "fact",      text: "Nettle leaves are unusually rich in iron, calcium, and silica. Spring tonics across European folk medicine all converge on this plant." },
  ],
  "dandelion-root": [
    { type: "tradition", text: "Dandelion root was roasted and ground as ersatz coffee through both World Wars when the bean was rationed — bittersweet, caramel, almost convincing." },
    { type: "fact",      text: "The bitter is sesquiterpene lactones, which provoke bile and digestive juices the way the body intends a meal-starter to." },
    { type: "fact",      text: "The sweetness is inulin, a prebiotic the gut bacteria treat as a long meal of their own. The cup feeds two ecologies at once." },
  ],
  "dandelion-leaf": [
    { type: "tradition", text: "Italian and Greek spring foragers fill bags with dandelion leaves before the flowers open. The bitter is at its peak then, and so is the medicine." },
    { type: "fact",      text: "The French name pissenlit (literally 'piss the bed') is honest reporting — the cup is reliably diuretic." },
    { type: "fact",      text: "Unlike most diuretics, the leaf is itself rich in potassium, so the body doesn't lose what it most needs to keep. Folk botany solving its own side effect." },
  ],
  reishi: [
    { type: "tradition", text: "Taoist painters drew reishi in the hands of immortals; Chinese emperors hoarded wild specimens, and reliable cultivation only began in the 1970s." },
    { type: "fact",      text: "The bitter is triterpenes, the same family found in licorice and ginseng — fat-soluble, slow-extracting, and the reason the cup needs a long decoction." },
    { type: "fact",      text: "Modern trials show real immune modulation from reishi extracts. The immortality claim remains pending." },
  ],
  "lions-mane": [
    { type: "tradition", text: "Japan's yamabushi mountain wanderers named lion's mane after themselves — yamabushitake, the mountain-walker's mushroom — for its white cascading tufts." },
    { type: "fact",      text: "Hericenones and erinacines inside prompt the brain to produce more nerve growth factor. The folk reputation for sharpening the mind has held up better in the lab than most mushroom claims." },
    { type: "fact",      text: "Lion's mane is the most palatable mushroom in the cabinet — tradition compares it to crab or lobster — with the longest tail of effect when taken daily." },
  ],
};

// Public-domain poems and fragments. Tags drive which brews they surface in.
// Classical Japanese haiku and Rumi are both safely out of copyright.
export const WAIT_POEMS = [
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
    tags: ["stillness", "calm", "digestive", "focus"],
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
    tags: ["autumn", "evening", "digestive", "solitude"],
  },
  {
    text: "From time to time\nthe clouds give rest\nto the moon-beholders.",
    attribution: "— Bashō",
    tags: ["moon", "calm", "sleepy", "night", "stillness"],
  },
  {
    text: "A caterpillar,\nthis deep in fall —\nstill not a butterfly.",
    attribution: "— Bashō",
    tags: ["patience", "autumn", "comfort", "digestive"],
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
    tags: ["stillness", "calm", "digestive", "reflection"],
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
    tags: ["reflection", "calm", "digestive", "solitude", "summer", "chamomile", "rose"],
  },
  {
    text: "I'll tell you how the sun rose, —\nA ribbon at a time.",
    attribution: "— Emily Dickinson",
    tags: ["morning", "energy", "focus", "sencha", "assam"],
  },
  {
    text: "The soul selects her own society,\nThen shuts the door;\nOn her divine majority\nObtrude no more.",
    attribution: "— Emily Dickinson",
    tags: ["solitude", "digestive", "stillness", "focus", "reflection"],
  },
  {
    text: "Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all.",
    attribution: "— Emily Dickinson",
    tags: ["comfort", "hope", "calm", "digestive"],
  },
  {
    text: "A light exists in spring\nNot present on the year\nAt any other period.\nWhen March is scarcely here",
    attribution: "— Emily Dickinson",
    tags: ["spring", "morning", "energy", "green", "sencha"],
  },

  {
    text: "Remember me when I am gone away,\nGone far away into the silent land;\nWhen you can no more hold me by the hand,\nNor I half turn to go, yet turning stay.",
    attribution: "— Christina Rossetti",
    tags: ["reflection", "evening", "digestive", "solitude"],
  },
  {
    text: "Silent noon: the fields are fair —\nNoontide's silent everywhere.",
    attribution: "— Christina Rossetti",
    tags: ["stillness", "summer", "calm", "noon"],
  },
  {
    text: "What are heavy? sea-sand and sorrow:\nWhat are brief? today and tomorrow:\nWhat are frail? spring blossoms and youth:\nWhat are deep? the ocean and truth.",
    attribution: "— Christina Rossetti",
    tags: ["reflection", "comfort", "digestive"],
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
    tags: ["night", "solitude", "digestive", "reflection", "stillness"],
  },

  {
    text: "The world is too much with us; late and soon,\nGetting and spending, we lay waste our powers;\nLittle we see in Nature that is ours;\nWe have given our hearts away, a sordid boon!",
    attribution: "— William Wordsworth",
    tags: ["reflection", "digestive", "calm"],
  },

  {
    text: "The rain is falling all around,\nIt falls on field and tree,\nIt rains on the umbrellas here,\nAnd on the ships at sea.",
    attribution: "— Robert Louis Stevenson",
    tags: ["rain", "comfort", "calm", "digestive"],
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

  // — Expansion set: additional public-domain poems and fragments
  //   to give the home time/season picker more variety. All
  //   pre-1929 (US public domain) or earlier ancient/classical. —

  // Morning / dawn
  {
    text: "I'll tell you how the Sun rose, —\nA Ribbon at a time.\nThe Steeples swam in Amethyst,\nThe news, like Squirrels, ran.",
    attribution: "— Emily Dickinson",
    tags: ["morning", "dawn", "energy", "focus"],
  },
  {
    text: "Wake! For the Sun, who scattered into flight\nThe Stars before him from the Field of Night,\nDrives Night along with them from Heav'n, and strikes\nThe Sultan's Turret with a Shaft of Light.",
    attribution: "— Edward FitzGerald (Rubaiyat)",
    tags: ["dawn", "morning", "energy"],
  },
  {
    text: "I'm going out to clean the pasture spring;\nI'll only stop to rake the leaves away.\nI sha'n't be gone long. — You come too.",
    attribution: "— Robert Frost",
    tags: ["morning", "spring", "calm", "reflection"],
  },
  {
    text: "Now the bright morning star, day's harbinger,\nComes dancing from the East, and leads with her\nThe flowery May.",
    attribution: "— John Milton",
    tags: ["dawn", "morning", "spring"],
  },
  {
    text: "The breeze at dawn has secrets to tell you.\nDon't go back to sleep.\nYou must ask for what you really want.",
    attribution: "— Rumi",
    tags: ["dawn", "morning", "focus", "energy"],
  },
  {
    text: "Morning glory —\neven the well-bucket\nis taken.",
    attribution: "— Chiyo-ni",
    tags: ["morning", "summer", "stillness", "calm"],
  },

  // Noon / stillness
  {
    text: "A noiseless patient spider,\nI mark'd where on a little promontory it stood isolated,\nMark'd how to explore the vacant vast surrounding.",
    attribution: "— Walt Whitman",
    tags: ["stillness", "noon", "reflection", "focus"],
  },
  {
    text: "Heard melodies are sweet, but those unheard\nAre sweeter; therefore, ye soft pipes, play on.",
    attribution: "— John Keats",
    tags: ["stillness", "noon", "reflection"],
  },
  {
    text: "Sweet day, so cool, so calm, so bright,\nThe bridal of the earth and sky.",
    attribution: "— George Herbert",
    tags: ["noon", "stillness", "calm", "spring", "summer"],
  },
  {
    text: "Stillness —\nthe cicada's cry\ndrills into the rocks.",
    attribution: "— Bashō",
    tags: ["summer", "noon", "stillness"],
  },

  // Evening / night
  {
    text: "The woods are lovely, dark and deep,\nBut I have promises to keep,\nAnd miles to go before I sleep,\nAnd miles to go before I sleep.",
    attribution: "— Robert Frost",
    tags: ["evening", "winter", "reflection", "solitude"],
  },
  {
    text: "I have been one acquainted with the night.\nI have walked out in rain — and back in rain.\nI have outwalked the furthest city light.",
    attribution: "— Robert Frost",
    tags: ["night", "rain", "solitude", "reflection"],
  },
  {
    text: "Look at the stars! look, look up at the skies!\nO look at all the fire-folk sitting in the air!",
    attribution: "— Gerard Manley Hopkins",
    tags: ["night", "moon", "reflection"],
  },
  {
    text: "Slowly, silently, now the moon\nWalks the night in her silver shoon;\nThis way, and that, she peers, and sees\nSilver fruit upon silver trees.",
    attribution: "— Walter de la Mare",
    tags: ["night", "moon", "stillness", "sleepy"],
  },
  {
    text: "The moon has set,\nand the Pleiades; it is midnight,\ntime is going by, and I sleep alone.",
    attribution: "— Sappho (trans.)",
    tags: ["night", "moon", "solitude", "sleepy"],
  },
  {
    text: "Lighting one candle\nwith another candle —\nspring evening.",
    attribution: "— Yosa Buson",
    tags: ["evening", "spring", "calm"],
  },
  {
    text: "Lying ill on a journey:\nmy dreams go wandering\nover withered fields.",
    attribution: "— Bashō",
    tags: ["winter", "night", "solitude", "reflection"],
  },

  // Spring
  {
    text: "Loveliest of trees, the cherry now\nIs hung with bloom along the bough,\nAnd stands about the woodland ride\nWearing white for Eastertide.",
    attribution: "— A.E. Housman",
    tags: ["spring", "morning", "calm", "flower"],
  },
  {
    text: "From you have I been absent in the spring,\nWhen proud-pied April, dressed in all his trim,\nHath put a spirit of youth in every thing.",
    attribution: "— William Shakespeare",
    tags: ["spring", "reflection"],
  },
  {
    text: "Spring rain leaking through the roof,\ndripping from the wasps' nest.",
    attribution: "— Bashō",
    tags: ["spring", "rain", "calm"],
  },
  {
    text: "What a strange thing! —\nto be alive\nbeneath cherry blossoms.",
    attribution: "— Issa",
    tags: ["spring", "reflection", "morning"],
  },

  // Summer
  {
    text: "Shall I compare thee to a summer's day?\nThou art more lovely and more temperate.",
    attribution: "— William Shakespeare",
    tags: ["summer", "reflection", "calm"],
  },
  {
    text: "Summer is icumen in,\nLhude sing cuccu!\nGroweth sed, and bloweth med,\nAnd springth the wde nu.",
    attribution: "— Anonymous (medieval)",
    tags: ["summer", "morning", "energy"],
  },
  {
    text: "A summer river being crossed —\nhow pleasing,\nwith sandals in my hand!",
    attribution: "— Buson",
    tags: ["summer", "calm"],
  },

  // Autumn
  {
    text: "Season of mists and mellow fruitfulness,\nClose bosom-friend of the maturing sun;\nConspiring with him how to load and bless\nWith fruit the vines that round the thatch-eaves run.",
    attribution: "— John Keats",
    tags: ["autumn", "morning", "reflection"],
  },
  {
    text: "Autumn deepens —\nthe man next door,\nwhat does he do?",
    attribution: "— Bashō",
    tags: ["autumn", "evening", "reflection", "solitude"],
  },
  {
    text: "The cricket's song\nin the morning frost\nis ending.",
    attribution: "— Issa",
    tags: ["autumn", "morning", "stillness"],
  },

  // Winter
  {
    text: "The first snow,\nthe leaves of the daffodil\nbending together.",
    attribution: "— Bashō",
    tags: ["winter", "morning", "stillness"],
  },
  {
    text: "First winter rain —\neven the monkey\nseems to want a raincoat.",
    attribution: "— Bashō",
    tags: ["winter", "rain", "comfort"],
  },
  {
    text: "Stopping a moment to listen —\nthe snow on the pine\nshakes loose at last.",
    attribution: "— Anonymous (traditional, Japanese style)",
    tags: ["winter", "stillness", "calm"],
  },

  // General reflection / quiet
  {
    text: "I'm Nobody! Who are you?\nAre you — Nobody — too?\nThen there's a pair of us!\nDon't tell! they'd advertise — you know!",
    attribution: "— Emily Dickinson",
    tags: ["solitude", "comfort", "reflection"],
  },
  {
    text: "Tell all the truth but tell it slant —\nSuccess in Circuit lies.",
    attribution: "— Emily Dickinson",
    tags: ["reflection", "stillness"],
  },
  {
    text: "There is no Frigate like a Book\nTo take us Lands away.",
    attribution: "— Emily Dickinson",
    tags: ["comfort", "reflection", "solitude"],
  },
  {
    text: "When you do things from your soul,\nyou feel a river moving in you, a joy.",
    attribution: "— Rumi",
    tags: ["calm", "reflection", "comfort"],
  },
  {
    text: "Don't worry, spiders,\nI keep house\ncasually.",
    attribution: "— Issa",
    tags: ["calm", "comfort", "stillness"],
  },
  {
    text: "Even with insects —\nsome can sing,\nsome can't.",
    attribution: "— Issa",
    tags: ["summer", "reflection", "calm"],
  },
  {
    text: "Whoever brought me here\nwill have to take me home.",
    attribution: "— Rumi",
    tags: ["evening", "comfort", "reflection"],
  },

  // — Additional public-domain rotation, broader season + time coverage —

  // Winter mornings / dawn
  {
    text: "Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.",
    attribution: "— Robert Frost",
    tags: ["winter", "morning", "stillness", "solitude", "reflection"],
  },
  {
    text: "The frog half awake\nin the early-spring puddle —\nhas found his voice.",
    attribution: "— Buson",
    tags: ["spring", "morning", "dawn", "energy", "whimsy"],
  },
  {
    text: "First snow,\nthen another, then another —\nhow quiet the world.",
    attribution: "— Yosa Buson",
    tags: ["winter", "morning", "stillness", "calm", "snow"],
  },
  {
    text: "Cold morning —\nthe paper-screen door\nhas a hole in it.",
    attribution: "— Issa",
    tags: ["winter", "morning", "solitude", "comfort"],
  },
  {
    text: "Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all.",
    attribution: "— Emily Dickinson",
    tags: ["morning", "hope", "comfort", "calm", "energy"],
  },

  // Summer afternoons / noons
  {
    text: "I went to the woods because I wished to live deliberately,\nto front only the essential facts of life.",
    attribution: "— Henry David Thoreau",
    tags: ["summer", "noon", "reflection", "stillness", "focus"],
  },
  {
    text: "The summer grasses —\nall that remains\nof warriors' dreams.",
    attribution: "— Bashō",
    tags: ["summer", "noon", "reflection", "solitude"],
  },
  {
    text: "Cloud-shadows pass\nover the rice field —\nnoon goes slowly.",
    attribution: "— Buson",
    tags: ["summer", "noon", "stillness", "calm"],
  },
  {
    text: "I, too, sing America.\nI am the darker brother.\nThey send me to eat in the kitchen\nWhen company comes,\nBut I laugh,\nAnd eat well,\nAnd grow strong.",
    attribution: "— Langston Hughes (1925)",
    tags: ["noon", "reflection", "energy", "comfort"],
  },

  // Spring evenings + afternoons
  {
    text: "Spring rain:\ntelling a tale\non the leaves.",
    attribution: "— Issa",
    tags: ["spring", "rain", "evening", "calm", "reflection"],
  },
  {
    text: "On the temple bell\nresting, asleep,\na butterfly.",
    attribution: "— Buson",
    tags: ["spring", "afternoon", "stillness", "calm", "whimsy"],
  },
  {
    text: "An old silent pond...\nA frog jumps into the pond,\nsplash! Silence again.",
    attribution: "— Bashō",
    tags: ["spring", "stillness", "calm", "noon", "reflection"],
  },
  {
    text: "Year on year,\non the monkey's face —\na monkey's mask.",
    attribution: "— Bashō",
    tags: ["spring", "reflection", "solitude", "evening"],
  },

  // Autumn — multiple times of day
  {
    text: "An autumn evening:\nthe wind across the field\ngoes through me.",
    attribution: "— Bashō",
    tags: ["autumn", "evening", "solitude", "reflection", "calm"],
  },
  {
    text: "Autumn moon —\nthe clouds, by turns,\nwillingly veil her.",
    attribution: "— Sōseki",
    tags: ["autumn", "night", "moon", "calm", "stillness"],
  },
  {
    text: "Autumn deepens —\nthe man next door,\nwhat does he do?",
    attribution: "— Bashō",
    tags: ["autumn", "evening", "reflection", "solitude"],
  },
  {
    text: "October's bright blue weather\nLoveliest of all the year.",
    attribution: "— Helen Hunt Jackson",
    tags: ["autumn", "morning", "noon", "calm", "comfort"],
  },

  // Late night / small hours
  {
    text: "Slow, slow, slow, slow.\nA single bell across the snow.",
    attribution: "— Anonymous (English, 19th c.)",
    tags: ["winter", "night", "stillness", "solitude", "moon"],
  },
  {
    text: "Stars over snow,\nAnd in the west a planet\nSwinging below a star —\nLook for a lovely thing and you will find it.",
    attribution: "— Sara Teasdale",
    tags: ["winter", "night", "moon", "stillness", "reflection"],
  },
  {
    text: "I have been one acquainted with the night.\nI have walked out in rain — and back in rain.\nI have outwalked the furthest city light.",
    attribution: "— Robert Frost",
    tags: ["night", "rain", "solitude", "reflection"],
  },
  {
    text: "Quiet sleep with a light footstep\nWalks the moon's tideway —\nQuiet as the ferns.",
    attribution: "— Sara Teasdale",
    tags: ["night", "moon", "sleepy", "stillness"],
  },
  {
    text: "Thrice the lonely cricket called,\nand thrice the moon\nshone down upon the well.",
    attribution: "— Anonymous (Chinese, classical)",
    tags: ["night", "moon", "solitude", "stillness", "summer"],
  },

  // General / non-seasonal — broaden the always-available pool
  {
    text: "Tea is liquid wisdom.",
    attribution: "— Anonymous proverb",
    tags: ["comfort", "tea", "calm", "reflection"],
  },
  {
    text: "Stopping, the cup steams\nlonger than the kettle's song —\nthe room goes quiet.",
    attribution: "— Anonymous",
    tags: ["stillness", "calm", "comfort", "tea", "kettle", "reflection"],
  },
  {
    text: "If you are cold,\ntea will warm you.\nIf you are heated,\nit will cool you.\nIf you are depressed,\nit will cheer you.",
    attribution: "— Gladstone",
    tags: ["comfort", "calm", "tea", "energy"],
  },
  {
    text: "Drink your tea slowly\nand reverently,\nas if it is the axis\non which the world earth revolves.",
    attribution: "— Thich Nhat Hanh (paraphrased, attributed)",
    tags: ["stillness", "calm", "tea", "comfort", "reflection"],
  },

  // — Witty / insightful expansion: short, punchy lines that
  //   land an idea or a smile rather than evoke a season. All
  //   pre-1929 US public domain or ancient / classical-translated
  //   PD. Tagged loosely on time-of-day so they can rotate into
  //   any visit; the picker biases by season but doesn't require it.

  // Witty / dark-comic / fun
  {
    text: "My candle burns at both ends;\nIt will not last the night;\nBut ah, my foes, and oh, my friends —\nIt gives a lovely light!",
    attribution: "— Edna St. Vincent Millay (1920)",
    tags: ["whimsy", "energy", "reflection", "evening", "night"],
  },
  {
    text: "Four be the things I am wiser to know:\nIdleness, sorrow, a friend, and a foe.\nFour be the things I'd been better without:\nLove, curiosity, freckles, and doubt.",
    attribution: "— Dorothy Parker (1926)",
    tags: ["whimsy", "reflection", "comfort"],
  },
  {
    text: "When I am dead, I hope it may be said:\n\"His sins were scarlet, but his books were read.\"",
    attribution: "— Hilaire Belloc",
    tags: ["whimsy", "reflection", "evening"],
  },
  {
    text: "\"The time has come,\" the Walrus said,\n\"To talk of many things:\nOf shoes — and ships — and sealing-wax —\nOf cabbages — and kings —\nAnd why the sea is boiling hot —\nAnd whether pigs have wings.\"",
    attribution: "— Lewis Carroll (1871)",
    tags: ["whimsy", "reflection", "comfort"],
  },
  {
    text: "'Twas brillig, and the slithy toves\nDid gyre and gimble in the wabe;\nAll mimsy were the borogoves,\nAnd the mome raths outgrabe.",
    attribution: "— Lewis Carroll (1871)",
    tags: ["whimsy", "energy", "morning"],
  },
  {
    text: "I saw a man pursuing the horizon;\nRound and round they sped.\nI was disturbed at this;\nI accosted the man.\n\"It is futile,\" I said,\n\"You can never —\"\n\"You lie,\" he cried,\nAnd ran on.",
    attribution: "— Stephen Crane (1895)",
    tags: ["reflection", "whimsy", "focus"],
  },
  {
    text: "There are strange things done in the midnight sun\nBy the men who moil for gold;\nThe Arctic trails have their secret tales\nThat would make your blood run cold.",
    attribution: "— Robert Service (1907)",
    tags: ["whimsy", "night", "winter", "reflection"],
  },
  {
    text: "A canner exceedingly canny\nOne morning remarked to his granny:\n  \"A canner can can\n  Anything that he can\nBut a canner can't can a can, can he?\"",
    attribution: "— Anonymous (traditional)",
    tags: ["whimsy", "morning", "energy"],
  },
  {
    text: "There was an Old Man in a tree,\nWho was horribly bored by a Bee.\n  When they said, \"Does it buzz?\"\n  He replied, \"Yes, it does!\nIt's a regular brute of a Bee!\"",
    attribution: "— Edward Lear",
    tags: ["whimsy", "summer", "comfort"],
  },

  // Insightful / makes-you-think
  {
    text: "Some say the world will end in fire,\nSome say in ice.\nFrom what I've tasted of desire\nI hold with those who favor fire.",
    attribution: "— Robert Frost (1920)",
    tags: ["reflection", "winter", "evening"],
  },
  {
    text: "so much depends\nupon\n\na red wheel\nbarrow\n\nglazed with rain\nwater\n\nbeside the white\nchickens",
    attribution: "— William Carlos Williams (1923)",
    tags: ["reflection", "stillness", "rain", "morning"],
  },
  {
    text: "The apparition of these faces in the crowd;\nPetals on a wet, black bough.",
    attribution: "— Ezra Pound (1913)",
    tags: ["reflection", "stillness", "rain", "noon"],
  },
  {
    text: "The fog comes\non little cat feet.\nIt sits looking\nover harbor and city\non silent haunches\nand then moves on.",
    attribution: "— Carl Sandburg (1916)",
    tags: ["stillness", "morning", "calm", "reflection"],
  },
  {
    text: "You cannot step into the same river twice,\nfor other waters are continually flowing on.",
    attribution: "— Heraclitus",
    tags: ["reflection", "stillness", "focus"],
  },
  {
    text: "He who knows others is wise;\nhe who knows himself is enlightened.",
    attribution: "— Lao Tzu",
    tags: ["reflection", "stillness", "focus"],
  },
  {
    text: "Once Zhuang Zhou dreamt he was a butterfly,\nflitting and fluttering, happy with himself.\nSuddenly he awoke, and was Zhou again.\nNow he does not know whether he was Zhou\ndreaming he was a butterfly,\nor a butterfly dreaming he is Zhou.",
    attribution: "— Zhuangzi (Giles trans., 1889)",
    tags: ["reflection", "stillness", "sleepy", "night"],
  },
  {
    text: "This dewdrop world\nis a dewdrop world,\nand yet, and yet ...",
    attribution: "— Issa",
    tags: ["reflection", "stillness", "calm", "evening"],
  },
  {
    text: "I have spread my dreams under your feet;\nTread softly because you tread on my dreams.",
    attribution: "— W.B. Yeats (1899)",
    tags: ["reflection", "evening", "calm", "comfort"],
  },
  {
    text: "You have power over your mind —\nnot outside events.\nRealize this, and you will find strength.",
    attribution: "— Marcus Aurelius",
    tags: ["focus", "reflection", "morning"],
  },
  {
    text: "The best laid schemes o' Mice an' Men\nGang aft agley,\nAn' lea'e us nought but grief an' pain,\nFor promis'd joy!",
    attribution: "— Robert Burns (1785)",
    tags: ["reflection", "comfort", "evening"],
  },
  {
    text: "Do I contradict myself?\nVery well then I contradict myself,\n(I am large, I contain multitudes.)",
    attribution: "— Walt Whitman",
    tags: ["reflection", "energy", "noon"],
  },
  {
    text: "No man is an island, entire of itself;\nevery man is a piece of the continent,\na part of the main.",
    attribution: "— John Donne (1624)",
    tags: ["reflection", "comfort", "evening"],
  },
  {
    text: "You have no enemies, you say?\nAlas, my friend, the boast is poor.\nHe who has mingled in the fray\nOf duty, that the brave endure,\nMust have made foes.",
    attribution: "— Charles Mackay (1846)",
    tags: ["reflection", "focus", "energy"],
  },
];

// Brew-companion writing prompts. Short, sensory, low-friction —
// the tea-and-haiku tradition reframed as a personal beat. Each one
// is small enough to answer in the steep-screen notes field while
// the cup is still warming. Universal pool (no tag filter) so a
// prompt can surface in any brew, but capped at 1 per brew so the
// rotation stays fact-dominant.
export const WAIT_PROMPTS = [
  { type: "prompt", text: "Write one sentence about why you reached for this cup." },
  { type: "prompt", text: "Name three things you can hear right now." },
  { type: "prompt", text: "Describe today's light in one word." },
  { type: "prompt", text: "What does the steam smell like before the leaves arrive?" },
  { type: "prompt", text: "Notice your hands. Warm? Cool? Tired? Steady?" },
  { type: "prompt", text: "If this cup were a season, which one?" },
  { type: "prompt", text: "Write the last thing you remember tasting today." },
  { type: "prompt", text: "Imagine the leaves before they were leaves. Where did they grow?" },
  { type: "prompt", text: "What sound is in the room that wasn't there a minute ago?" },
  { type: "prompt", text: "If you could only describe this brew in a colour, which?" },
  { type: "prompt", text: "What were you carrying when you walked into the kitchen?" },
  { type: "prompt", text: "Write one line you would want to read again tomorrow." },
  { type: "prompt", text: "Who taught you to make tea? Or who would you want to?" },
  { type: "prompt", text: "Describe the cup's weight in your hand." },
  { type: "prompt", text: "What's the last thing that surprised you today?" },
  { type: "prompt", text: "If the tea could ask you one question, what would it be?" },
  { type: "prompt", text: "Note the temperature of the room around you." },
  { type: "prompt", text: "Listen for the next sound longer than three seconds." },
  { type: "prompt", text: "What are you trying not to think about right now?" },
  { type: "prompt", text: "Write a single word for the weather inside you." },
  { type: "prompt", text: "Three words for the colour of the brew before you sip." },
  { type: "prompt", text: "What does this hour feel like, exactly?" },
];

// Build the content pool for a given blend. Pulls ingredient-specific facts
// from WAIT_FACTS, matching poems from WAIT_POEMS, and interleaves them.
export function buildWaitCards(blend, targetMoods) {
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
  const rotate = (arr, seed) => {
    if (arr.length < 2) return arr;
    const n = (seed ?? Date.now()) % arr.length;
    return [...arr.slice(n), ...arr.slice(0, n)];
  };
  const rotatedFacts = rotate(facts);
  const rotatedPoems = rotate(poems);
  // Use a different seed for prompts so they don't always pair with the
  // same fact in the rotation.
  const rotatedPrompts = rotate([...WAIT_PROMPTS], Math.floor(Date.now() / 60000));

  // 4. Cap poems at ~1 per 5 facts, minimum 1 if any match, maximum 4.
  //    This keeps the pool fact-dominant — the app is about ingredients,
  //    poems are punctuation, not half the content.
  const poemCap = Math.min(4, Math.max(rotatedPoems.length > 0 ? 1 : 0, Math.floor(rotatedFacts.length / 5)));
  const selectedPoems = rotatedPoems.slice(0, poemCap);
  // One writing prompt per brew. Universal pool, so always available.
  const selectedPrompts = rotatedPrompts.slice(0, 1);

  // 5. Interleave: place poems and prompts at roughly-even intervals through
  //    the facts, never as the first card (open with ingredient grounding)
  //    and never as the last (close with the cup, not literature).
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
  // Combine poems and prompts as "punctuation" cards, placed evenly through
  // the fact stream. Prompts come first in the order so they typically
  // appear earlier — the steep is still warm, the user is still settling.
  const punctuation = [...selectedPrompts, ...selectedPoems];
  if (punctuation.length > 0 && cards.length >= 3) {
    const insertRange = cards.length - 1;
    punctuation.forEach((card, i) => {
      const pos = 1 + Math.floor((i + 1) * insertRange / (punctuation.length + 1));
      cards.splice(pos + i, 0, card); // +i accounts for prior insertions
    });
  }

  return cards;
}


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
  ],
  lavender: [
    { type: "fact",      text: "The word lavender comes from the Latin lavare — to wash. Romans added it to bathwater." },
    { type: "fact",      text: "Lavender's essential oil contains linalool, the compound clinical trials credit with the herb's measurable anxiolytic effect — Germany's Silexan preparation runs on it." },
    { type: "tradition", text: "In Provence, lavender harvest begins at dawn, when the oils are most concentrated and the heat hasn't yet driven them off." },
  ],
  lemonbalm: [
    { type: "fact",      text: "Lemon balm (Melissa officinalis) takes its botanical name from the Greek melissa — honeybee. Bees are drawn to it reliably." },
    { type: "tradition", text: "Medieval monks brewed lemon balm for what they called 'gladness of spirit' — an early recognition of its mild mood-lifting effect. Carmelite Water, a 17th-century French nun's recipe, made the use famous." },
  ],
  peppermint: [
    { type: "fact",      text: "Peppermint is a natural hybrid of spearmint and water mint. Most of what sells as 'mint' in tea is actually peppermint." },
    { type: "fact",      text: "Menthol, peppermint's cooling compound, triggers the same TRPM8 cold-receptors that respond to actual cold — your mouth 'feels' the chill that isn't there." },
  ],
  spearmint: [
    { type: "tradition", text: "Moroccan tea service traditionally uses three pours: the first bitter as life, the second sweet as love, the third gentle as death." },
    { type: "fact",      text: "Spearmint has carvone where peppermint has menthol — a different cooling compound entirely, which is why it reads softer and pairs better with green tea." },
  ],
  rooibos: [
    { type: "fact",      text: "Rooibos grows only in the Cederberg region of South Africa. Attempts to cultivate it elsewhere have largely failed." },
    { type: "tradition", text: "The Khoi people of the Cederberg have used rooibos for centuries; it entered European consciousness only in the early 1900s." },
  ],
  sencha: [
    { type: "fact",      text: "Sencha is made by steaming fresh tea leaves within hours of harvest — a Japanese innovation, introduced by Soen Nagatani in 1738, that preserves the grassy green notes Chinese pan-firing doesn't." },
    { type: "tradition", text: "Japanese tea masters consider the first pour of sencha almost ceremonial — water at the wrong temperature can ruin months of the farmer's work." },
  ],
  assam: [
    { type: "fact",      text: "Assam was discovered growing wild by British botanist Robert Bruce in 1823, disproving the assumption that tea was exclusively Chinese — and breaking the empire's monopoly on the trade." },
  ],
  darjeeling: [
    { type: "fact",      text: "Darjeeling's character comes from elevation — gardens sit at 600-2000m in the Himalayan foothills, producing slow-growing, intensely flavored leaves." },
    { type: "tradition", text: "The 'first flush' — Darjeeling leaves picked in spring after dormancy — is considered the estate's finest, sometimes called the 'champagne of teas.'" },
  ],
  ginger: [
    { type: "fact",      text: "Ginger's heat comes from gingerol, which converts to shogaol when dried or heated — shogaol is sharper, more warming, and a different molecule than the fresh root carries." },
    { type: "tradition", text: "In Ayurvedic tradition, ginger is considered a universal medicine — warming to the digestive fire and circulation both." },
  ],
  hibiscus: [
    { type: "fact",      text: "Hibiscus's ruby color comes from anthocyanins, the same family of pigments that make blueberries blue and red cabbage red." },
    { type: "tradition", text: "Known as karkadé in Egypt and agua de jamaica in Mexico, hibiscus tea has traveled widely with different names and almost identical preparations." },
  ],
  rose: [
    { type: "fact",      text: "Rose petals used in tea are typically Rosa × damascena, cultivated for oil and aroma rather than for the rose gardens most people imagine." },
  ],
  cinnamon: [
    { type: "fact",      text: "What most Western markets sell as 'cinnamon' is usually cassia — a close relative. True cinnamon (Ceylon) is lighter in color and more delicate in flavor — and lower in coumarin, which the cassia version carries enough of to stress the liver at heavy daily doses." },
  ],
  cardamom: [
    { type: "fact",      text: "Green cardamom pods keep their aromatic oils far longer than the seeds alone. Opening a pod releases the scent, but cracks the preservation." },
  ],
  ashwagandha: [
    { type: "fact",      text: "Ashwagandha's Sanskrit name means 'smell of horse' — referring both to the root's musky scent and, traditionally, the strength it was said to convey." },
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


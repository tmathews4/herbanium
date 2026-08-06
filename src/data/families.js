/* ──────────────────────────────────────────────────────────────
   data/families.js — raw flavour/effect word → family.

   Plain data, deliberately outside FlavorMap.jsx. Node can't import
   .jsx, so anything in a component file is invisible to the test suite
   and to tools/ — and these maps are exactly what a tool sweeping the
   catalogue needs. FlavorMap re-exports them so component imports are
   unchanged.
   ────────────────────────────────────────────────────────────── */

export const FAMILY_BY_FLAVOR = {
  // fruit
  muscatel: "fruit", fruit: "fruit", fruity: "fruit", peach: "fruit",
  apricot: "fruit", berry: "fruit", tart: "fruit", cranberry: "fruit",
  bright: "fruit", melon: "fruit",
  apple: "fruit", "dried-apple": "fruit", lychee: "fruit",
  // floral
  floral: "floral", rose: "floral", orchid: "floral", delicate: "floral",
  heady: "floral",
  // sweet — its own register (was lumped under floral). honey,
  // honeyed, "honey-sweet" sit here too because they're sweetness-
  // forward rather than perfume-forward.
  sweet: "sweet", honey: "sweet", honeyed: "sweet",
  "honey-sweet": "sweet", vanilla: "sweet", caramel: "sweet",
  bittersweet: "sweet", "caramel-roasted": "sweet",
  // earthy / dark / woody — caramel moved to sweet family above
  earthy: "earthy", woody: "earthy", mushroom: "earthy", leather: "earthy",
  dark: "earthy", mineral: "earthy", malty: "earthy", cocoa: "earthy",
  rich: "earthy", chestnut: "earthy", nutty: "earthy",
  toasted: "earthy", roasted: "earthy", warm: "earthy", bold: "earthy",
  robust: "earthy", brisk: "earthy", musky: "earthy", musty: "earthy",
  mushroomy: "earthy", toasty: "earthy", "coffee-adjacent": "earthy",
  // spiced / warming
  spiced: "spiced", clove: "spiced", peppery: "spiced", aromatic: "spiced",
  pungent: "spiced", numbing: "spiced", hot: "spiced",
  anise: "spiced", "black-pepper": "spiced", tingling: "spiced",
  // smoky
  smoky: "smoky", smoked: "smoky", campfire: "smoky", pine: "smoky",
  tar: "smoky", coal: "smoky",
  // fresh / cooling / mint / citrus
  citrus: "fresh", minty: "fresh", mint: "fresh", cool: "fresh",
  cooling: "fresh", fresh: "fresh", camphor: "fresh", licorice: "fresh",
  bergamot: "fresh", citrusy: "fresh",
  lemon: "fresh", "lemon-peel": "fresh",
  orange: "fresh", "orange-peel": "fresh",
  // vegetal / grassy
  grassy: "vegetal", umami: "vegetal", vegetal: "vegetal",
  buttery: "vegetal", savory: "vegetal",
  hay: "vegetal", bean: "vegetal",
  herbaceous: "vegetal", herbal: "vegetal",
  rice: "vegetal", sage: "vegetal", "spinach-like": "vegetal",
  // marine — kelp, oceanic, seafood register. Lives in shaded
  // Japanese greens (gyokuro, matcha) and a few mushroom decoctions.
  marine: "marine", oceanic: "marine", seaweed: "marine",
  "seafood-like": "marine",
  // body words
  creamy: "mouthfeel",
  // off / diagnostic
  bitter: "off", bitterness: "off", astringent: "off", tannic: "off",
  harsh: "off", acrid: "off", soapy: "off", muddy: "off", medicinal: "off",
  pith: "off", sharp: "off",
};

/* ──────────────────────────────────────────────────────────────
   THE MOOD VOCABULARY — one canonical tree.

   Family, display label, colour, order, and the DEFINITION of every
   word, in one place. It used to be spread across four files, and
   they disagreed: the comment on FAMILY_BY_EFFECT below called
   `soothing` "bodily comfort (demulcent — throat, gut)" while
   vocabularyDescriptions.js defined it as "general comfort,
   warmth-of-spirit" — which is `comfort`'s definition, not
   soothing's. Nothing could catch that, because no file held both.

   Every map the app uses is DERIVED from this array, so a word can't
   exist in one place and not another.

   `counterpart` is the established herbal action or TCM category the
   word answers to. Tea's own sensory lexicons (Lee 2007, CTSEM, QDA)
   are flavour-and-aroma vocabularies and never name effects, so
   materia medica is the reference frame. A leaf with a null
   counterpart carries no external definition and only our own
   research docs constrain it — worth knowing when judging whether a
   claim is real.
   ────────────────────────────────────────────────────────────── */
export const MOOD_VOCABULARY = [
  {
    family: "calm", label: "calm", category: "mind", color: "var(--effect-calm)",
    leaves: [{
      token: "calm",
      counterpart: "nervine / relaxant — acts on the nervous system without sedation",
      summary: "A slow exhale. Quieting the chatter without dulling presence.",
      body: "Chamomile's apigenin and lemon balm's rosmarinic acid carry this most directly through GABAergic relaxation; linden, lavender, tulsi, and passionflower live in the same register. Not sedation — the mind quiets but stays present.",
    }],
  },
  {
    family: "soothing", label: "soothing", category: "body", color: "var(--effect-soothing)",
    leaves: [{
      token: "soothing",
      counterpart: "demulcent (internal) / emollient (topical) — mucilage coating and "
        + "protecting irritated mucous membranes",
      // Rewritten. The old summary was "General comfort, warmth-of-spirit.
      // Sweetness without sugar" — which is comfort's definition wearing
      // soothing's name, and the reason the two words looked synonymous
      // for so long. Soothing is the BODY's register: throat and gut,
      // not mood.
      summary: "Bodily ease — the cup that settles the body rather than the mind.",
      body: "Licorice's glycyrrhizin and linden's mucilage coat and calm irritated tissue; sage's tannins tighten it. The demulcent register. Distinct from calm, which is the mind, and from comfort, which is warm relaxation with no bodily action at all.",
    }],
  },
  {
    family: "grounding", label: "grounding", category: "mind", color: "var(--effect-grounding)",
    leaves: [{
      token: "grounding",
      counterpart: null,   // adaptogen-adjacent; largely TCM and lay usage
      summary: "Settling, centering, earthy.",
      body: "Reishi's triterpenes carry this most strongly, with ashwagandha's withanolides and ripe pu-erh's aged-fermentation chemistry close behind. Lapsang's pine smoke and dandelion root pull here too — the deeper, low-pitched register.",
    }],
  },
  {
    family: "focus", label: "focus", category: "mind", color: "var(--effect-focus)",
    leaves: [{
      token: "focus",
      counterpart: "nootropic / cerebral stimulant",
      summary: "Meditative clarity. Alert without jitter.",
      body: "L-theanine paired with caffeine — the shaded-green signature. Gyokuro and matcha hold the top of this register, with sencha, dragonwell, and oolong following the same chemistry at lower amplitude. Lion's mane works on a longer arc through nerve-growth-factor support.",
    }],
  },
  {
    family: "energy", label: "energy", category: "mind", color: "var(--effect-energy)",
    leaves: [{
      token: "energy",
      counterpart: "stimulant",
      summary: "Stimulating, awakening — the wake-up cup.",
      body: "Caffeine, smoothed by L-theanine in true teas so the lift reads cleaner than coffee. Assam carries the most caffeine of the catalog; matcha lands close behind through its shaded-tea chemistry, and yerba mate adds theobromine alongside caffeine for a sustained-arc rather than peak-and-crash.",
    }],
  },
  {
    family: "uplifting", label: "uplifting", category: "mind", color: "var(--effect-uplifting)",
    leaves: [{
      token: "uplifting",
      counterpart: "thymoleptic — mood-elevating",
      summary: "Lightening, brightening, mood-lifting.",
      body: "Jasmine, bergamot, light oolongs, and citrus-forward herbs. Linalool (lavender, bergamot) and limonene (citrus peels) are the volatile aromatics that read on the nose before the tongue; Darjeeling's muscatel character lifts the same way through its terpene-rich first flush.",
    }],
  },
  {
    // `warm` and `heat` were one family until the Mind/Body split. They
    // had exactly two leaves and those leaves belong on opposite sides
    // — comfort is felt, heat is physical — so the family earned
    // nothing by existing and became two single-leaf parents.
    //
    // Self-named, like calm and focus — token, family and label are all
    // `comfort`, so there's no indirection to keep straight. It briefly
    // displayed as "warm", which was only ever a workaround for the
    // family swallowing its own leaf; once the family holds one leaf
    // that pressure is gone, and "comfort" reads better beside "heat"
    // than "warm" did.
    family: "comfort", label: "comfort", category: "mind", color: "var(--effect-comfort)",
    leaves: [{
      token: "comfort",
      counterpart: null,   // no counterpart in the herbal action vocabulary
      summary: "Warm relaxation — a wrapped-blanket ease that isn't about temperature.",
      body: "Rooibos, vanilla and hojicha are the archetypes: round, sweet, familiar. Distinct from heat, which is measurable body warmth, and from soothing, which acts on the body's tissues. This one is affective — it is how the cup feels to meet, not what it does.",
    }],
  },
  {
    // Physical warmth. Token stays `warming` — it's named in 25
    // research docs and persisted in journal entries — and displays as
    // "heat", which is what it means and doesn't collide with `warm`
    // one category over.
    family: "heat", label: "warming", category: "body", color: "var(--effect-heat)",
    leaves: [{
      token: "warming",
      counterpart: "thermogenic; TCM warm-natured, Ayurvedic ushna virya",
      summary: "Generates internal heat — pantry-warm spice that reads as physical warmth.",
      body: "Black teas, roasted oolongs, and ripe pu-erh hold a steady warmth; the spice cabinet ramps it. Cinnamon and cardamom ride a calmer line, while ginger's gingerol triggers a real thermogenic response — the loudest warmer in the catalog. Cloves add eugenol's woody heat in support.",
    }],
  },
  {
    family: "cool", label: "cooling", category: "body", color: "var(--effect-cool)",
    leaves: [{
      token: "cooling",
      counterpart: "refrigerant; TCM cool-natured / Yin",
      summary: "Refreshes and clarifies. The settling-down register opposite warming.",
      body: "Green tea and white tea sit here through their lighter chemistry and lower oxidation; hibiscus through its anthocyanin tartness; mints through menthol. Distinct from menthol's mouthfeel cool, though the two can co-occur.",
    }],
  },
  {
    family: "digestive", label: "digestion", category: "body", color: "var(--effect-digestive)",
    leaves: [{
      token: "digestive",
      label: "digestion",
      counterpart: "carminative — relieves gas and gastrointestinal spasm",
      summary: "Settles the stomach. The post-meal cup across cultures.",
      body: "Peppermint's menthol is the most studied for easing the gut; fennel's anethole, ginger's gingerol, and dandelion root's bitter compounds all pull in the same direction. Pu-erh rounds the after-meal cup through its fermented character.",
    }],
  },
  {
    // Added because three docs said outright they had no word for this
    // and were using `soothing` as a stand-in — echinacea's opens with
    // '"immune-support" effect gap in vocabulary v1', and its §5 rates
    // soothing as the "best vocabulary mapping for immune support".
    // Turmeric flagged the same gap for anti-inflammatory; that one is
    // a single ingredient and hasn't earned an axis yet.
    family: "immune", label: "immunity", category: "body", color: "var(--effect-immune)",
    leaves: [{
      token: "immune",
      label: "immunity",
      counterpart: "immunomodulant / immunostimulant — established Western herbal "
        + "actions; modulate innate and adaptive response rather than stimulate blindly",
      summary: "Steadying the body's defences — the cold-and-flu-season cup.",
      body: "Echinacea's alkylamides and polysaccharides, elderflower's flavonoids (which bind influenza neuraminidase and haemagglutinin, and carry German Commission E approval for cold and flu), and reishi's beta-glucans binding Dectin-1 and TLR2. Distinct from soothing, which acts on irritated tissue — this acts on the immune response itself, and is slower and less felt than anything else in the vocabulary.",
    }],
  },
  {
    family: "sleep", label: "sleep", category: "mind", color: "var(--effect-sleep)",
    leaves: [{
      token: "sleepy",
      label: "sleep",
      counterpart: "sedative / hypnotic — a separate materia medica category from nervine",
      summary: "Sedating, drowsiness-adjacent.",
      body: "Valerian's valerenic acid is the strongest in the catalog, with passionflower and reishi's triterpenes behind it. Distinct from calm on paper — nervine and sedative are different actions — though no ingredient here yet carries one without the other.",
    }],
  },
];

// ── Derived maps. Nothing below is hand-maintained. ──────────────

export const FAMILY_BY_EFFECT = Object.fromEntries(
  MOOD_VOCABULARY.flatMap(f => f.leaves.map(l => [l.token, f.family]))
);

// Order reads top-to-bottom as quiet -> alert -> warm -> cool -> body.
export const MOOD_FAMILY_ORDER = MOOD_VOCABULARY.map(f => f.family);

export const EFFECT_FAMILY_COLORS = Object.fromEntries(
  MOOD_VOCABULARY.map(f => [f.family, f.color])
);

// How a family is labelled when the strip draws it — the Simple-mode
// band and the Detail-mode parent above its indented leaves.
//
// THE RULE, enforced in tests/research-parity.test.mjs: a family's
// label must never be the name of one of its own leaves when it has
// more than one. Detail mode suppresses any leaf whose label matches
// its family's, which is right for a single self-named leaf
// (cool/cooling, sleep/sleepy) and swallows a real leaf otherwise.
export const MOOD_FAMILY_LABEL = Object.fromEntries(
  MOOD_VOCABULARY.map(f => [f.family, f.label])
);

/**
 * How a LEAF is labelled on screen, where that differs from its token.
 * Same purpose as MOOD_FAMILY_LABEL one level down: the token is the
 * stable key that data and journals use, the label is what a reader
 * sees. Tokens without an entry display as themselves.
 *
 * THE RULE, enforced in tests/research-parity.test.mjs: a leaf's label
 * must not equal its own family's label, for the same reason a family's
 * label must not equal one of its leaves' — Detail mode draws parent
 * and child together, and two rows reading the same word is unreadable
 * whichever direction the collision comes from.
 */
export const MOOD_LEAF_LABEL = Object.fromEntries(
  MOOD_VOCABULARY.flatMap(f => f.leaves.filter(l => l.label).map(l => [l.token, l.label]))
);

/** Definition for a leaf token or a family key — whichever is asked for. */
export const MOOD_DESCRIPTIONS = Object.fromEntries([
  // BY FAMILY KEY FIRST. The Mind and Body strips draw their rows from
  // family keys, not labels and not tokens — `heat`, `cool`, `sleep` —
  // so a family whose key differs from its leaf's token had nothing to
  // find. `heat` went mute exactly that way: it used to be rescued by
  // the warming leaf carrying `label: "heat"`, and aligning leaf labels
  // to their families removed the rescue without removing the need.
  //
  // Keyed off the family's first leaf, which is every family here. Laid
  // down first so anything more specific below overwrites it.
  ...MOOD_VOCABULARY.filter(f => f.leaves.length)
    .map(f => [f.family, { summary: f.leaves[0].summary, body: f.leaves[0].body }]),
  ...MOOD_VOCABULARY.flatMap(f => f.leaves.map(l =>
    [l.token, { summary: l.summary, body: l.body }])),
  // Family-level entries, keyed by the family's LABEL, which is what
  // the strip shows and therefore what it looks a description up by.
  ...MOOD_VOCABULARY.filter(f => f.summary)
    .map(f => [f.label, { summary: f.summary, body: f.body }]),
  // ...and under a leaf's display label, so a row reading "heat" can
  // find `warming`'s definition when it's tapped.
  ...MOOD_VOCABULARY.flatMap(f => f.leaves.filter(l => l.label)
    .map(l => [l.label, { summary: l.summary, body: l.body }])),
]);

/**
 * MIND or BODY — the top-level split. Mind is what you can notice in
 * yourself: calm, focus, a lift, warmth of feeling. Body is what the
 * cup does to your tissues whether you notice or not — demulcent
 * action, thermogenesis, digestion, immune modulation.
 *
 * The definitions were written in this language before the categories
 * were named. `soothing` reads "the cup that settles the body rather
 * than the mind"; `calm` reads "the mind quiets but stays present".
 *
 * It also replaces a hack: canon.js excluded digestive, nauseous and
 * immune from journal pickers via a hand-kept STOMACH_MOOD_KEYS set,
 * because "where it left me: digestive" doesn't parse. That set was
 * this taxonomy, found one ingredient at a time.
 */
export const MIND_FAMILIES = MOOD_VOCABULARY.filter(f => f.category === "mind").map(f => f.family);
export const BODY_FAMILIES = MOOD_VOCABULARY.filter(f => f.category === "body").map(f => f.family);
export const CATEGORY_OF_FAMILY = Object.fromEntries(
  MOOD_VOCABULARY.map(f => [f.family, f.category])
);

export const CATEGORY_OF_EFFECT = Object.fromEntries(
  MOOD_VOCABULARY.flatMap(f => f.leaves.map(l => [l.token, f.category]))
);

/** The established action a word answers to, or null. */
export const MOOD_COUNTERPARTS = Object.fromEntries(
  MOOD_VOCABULARY.flatMap(f => f.leaves.map(l => [l.token, l.counterpart]))
);

/* What the user reads on a family bar, where that differs from the key.
   `fruity` makes the key adjectival; `creamy` swaps a structural word
   for the thing actually tasted.

   `sweet aroma` is the odd one — the only two-word label, and the break
   is deliberate. The flavour family and the palate axis `sweetness`
   were drawing two bars from the same words on the same screen, and a
   reader had no way to tell why. They are not the same claim:

     sweet aroma  — honey, vanilla, caramel. Compounds that SMELL sweet.
                    Vanillin has essentially no sweet taste; the brain
                    reads the odour as sweetness.
     sweetness    — the tongue register, beside bitterness and
                    astringency. Sugars and amino acids.

   Descriptive sensory analysis calls that first cluster "sweet
   aromatics" precisely to hold it apart from the basic taste, and tea's
   own evaluation vocabulary makes the same cut natively (甜香 sweet
   aroma vs 甜味 sweet taste). docs/vocabulary.md had both senses under
   one token with the note "context clarifies" — it doesn't, when the
   app draws both bars at once, so the qualifier moved into the label.

   `honeyed` was the single-word candidate that would have kept the
   adjective pattern. Rejected on the data: `sweet` is 60% of the
   family's uses against honey's 25%, so the commonest member would
   have sat under a narrower parent. */
export const FLAVOR_FAMILY_LABEL = {
  fruit: "fruity", mouthfeel: "creamy", sweet: "sweet aroma",
};

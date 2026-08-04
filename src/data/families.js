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
  creamy: "body",
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
    family: "calm", label: "calm", color: "var(--effect-calm)",
    leaves: [{
      token: "calm",
      counterpart: "nervine / relaxant — acts on the nervous system without sedation",
      summary: "A slow exhale. Quieting the chatter without dulling presence.",
      body: "Chamomile's apigenin and lemon balm's rosmarinic acid carry this most directly through GABAergic relaxation; linden, lavender, tulsi, and passionflower live in the same register. Not sedation — the mind quiets but stays present.",
    }],
  },
  {
    family: "soothing", label: "soothing", color: "var(--effect-soothing)",
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
    family: "grounding", label: "grounding", color: "var(--effect-grounding)",
    leaves: [{
      token: "grounding",
      counterpart: null,   // adaptogen-adjacent; largely TCM and lay usage
      summary: "Settling, centering, earthy.",
      body: "Reishi's triterpenes carry this most strongly, with ashwagandha's withanolides and ripe pu-erh's aged-fermentation chemistry close behind. Lapsang's pine smoke and dandelion root pull here too — the deeper, low-pitched register.",
    }],
  },
  {
    family: "focus", label: "focus", color: "var(--effect-focus)",
    leaves: [{
      token: "focus",
      counterpart: "nootropic / cerebral stimulant",
      summary: "Meditative clarity. Alert without jitter.",
      body: "L-theanine paired with caffeine — the shaded-green signature. Gyokuro and matcha hold the top of this register, with sencha, dragonwell, and oolong following the same chemistry at lower amplitude. Lion's mane works on a longer arc through nerve-growth-factor support.",
    }],
  },
  {
    family: "energy", label: "energy", color: "var(--effect-energy)",
    leaves: [{
      token: "energy",
      counterpart: "stimulant",
      summary: "Stimulating, awakening — the wake-up cup.",
      body: "Caffeine, smoothed by L-theanine in true teas so the lift reads cleaner than coffee. Assam carries the most caffeine of the catalog; matcha lands close behind through its shaded-tea chemistry, and yerba mate adds theobromine alongside caffeine for a sustained-arc rather than peak-and-crash.",
    }],
  },
  {
    family: "uplifting", label: "uplifting", color: "var(--effect-uplifting)",
    leaves: [{
      token: "uplifting",
      counterpart: "thymoleptic — mood-elevating",
      summary: "Lightening, brightening, mood-lifting.",
      body: "Jasmine, bergamot, light oolongs, and citrus-forward herbs. Linalool (lavender, bergamot) and limonene (citrus peels) are the volatile aromatics that read on the nose before the tongue; Darjeeling's muscatel character lifts the same way through its terpene-rich first flush.",
    }],
  },
  {
    // The only family with more than one leaf, and the one that needed
    // a definition of its own — the parent used to borrow the name
    // "comfort" from its own child, so Detail mode drew the family
    // aggregate under a leaf's name and hid that leaf entirely.
    family: "warm", label: "warmth", color: "var(--effect-warm)",
    summary: "The warm register — physical heat and warm relaxation together.",
    body: "The family above two different claims. `warming` is thermogenic: gingerol and piperine act on TRPV1 heat receptors, so the cup raises real body heat. `comfort` is the wrapped-blanket feeling, which arrives with no temperature change at all. Most warming spices carry both, and a cup can carry either alone — rooibos comforts without heating, a black tea can heat without comforting.",
    leaves: [
      {
        token: "warming",
        // Displayed as "heat". The token stays `warming` — it's
        // persisted in journal targetMoods, named in 25 research docs,
        // and referenced across blends and attributes — but "warming"
        // sitting under a parent called "warmth" gave a reader two
        // near-identical words at different levels of the hierarchy,
        // exactly where the distinction needs to be sharp. "heat" and
        // "comfort" under "warmth" reads instantly.
        label: "heat",
        counterpart: "thermogenic; TCM warm-natured, Ayurvedic ushna virya",
        summary: "Generates internal heat — pantry-warm spice that reads as physical warmth.",
        body: "Black teas, roasted oolongs, and ripe pu-erh hold a steady warmth; the spice cabinet ramps it. Cinnamon and cardamom ride a calmer line, while ginger's gingerol triggers a real thermogenic response — the loudest warmer in the catalog. Cloves add eugenol's woody heat in support.",
      },
      {
        token: "comfort",
        counterpart: null,   // no counterpart in the herbal action vocabulary
        summary: "Warm relaxation — a wrapped-blanket ease that isn't about temperature.",
        body: "Rooibos, vanilla and hojicha are the archetypes: round, sweet, familiar. Distinct from warming, which is measurable body heat, and from soothing, which acts on the body's tissues. This one is affective — it is how the cup feels to meet, not what it does.",
      },
    ],
  },
  {
    family: "cool", label: "cooling", color: "var(--effect-cool)",
    leaves: [{
      token: "cooling",
      counterpart: "refrigerant; TCM cool-natured / Yin",
      summary: "Refreshes and clarifies. The settling-down register opposite warming.",
      body: "Green tea and white tea sit here through their lighter chemistry and lower oxidation; hibiscus through its anthocyanin tartness; mints through menthol. Distinct from menthol's mouthfeel cool, though the two can co-occur.",
    }],
  },
  {
    family: "body", label: "digestive", color: "var(--effect-body)",
    leaves: [{
      token: "digestive",
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
    family: "immune", label: "immune", color: "var(--effect-immune)",
    leaves: [{
      token: "immune",
      counterpart: "immunomodulant / immunostimulant — established Western herbal "
        + "actions; modulate innate and adaptive response rather than stimulate blindly",
      summary: "Steadying the body's defences — the cold-and-flu-season cup.",
      body: "Echinacea's alkylamides and polysaccharides, elderflower's flavonoids (which bind influenza neuraminidase and haemagglutinin, and carry German Commission E approval for cold and flu), and reishi's beta-glucans binding Dectin-1 and TLR2. Distinct from soothing, which acts on irritated tissue — this acts on the immune response itself, and is slower and less felt than anything else in the vocabulary.",
    }],
  },
  {
    family: "sleep", label: "sleepy", color: "var(--effect-sleep)",
    leaves: [{
      token: "sleepy",
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

/** The established action a word answers to, or null. */
export const MOOD_COUNTERPARTS = Object.fromEntries(
  MOOD_VOCABULARY.flatMap(f => f.leaves.map(l => [l.token, l.counterpart]))
);

export const FLAVOR_FAMILY_LABEL = {
  fruit: "fruity", body: "creamy",
};

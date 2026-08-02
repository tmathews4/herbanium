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

export const FAMILY_BY_EFFECT = {
  // calm register — settling, mind-quieting
  // soothing and grounding used to file under calm. They aren't the
  // same register: calm is mental settling (L-theanine, anxiolytic),
  // soothing is bodily comfort (demulcent — throat, gut), grounding is
  // adaptogenic steadying. Filed together they masked each other, so a
  // herb declaring all three showed one and the audit read the other
  // two as redundant data. They're distinct claims, not repetition.
  calm: "calm", soothing: "soothing", grounding: "grounding",
  // focus register — clarity, alertness
  focus: "focus",
  // energy register — lift, brightening
  // Likewise: energy is a caffeine lift, uplifting is mood brightening
  // without stimulation. Bergamot is uplifting and has no caffeine.
  energy: "energy", uplifting: "uplifting",
  // warm register — comfort, warmth-of-spirit
  warming: "warm", comfort: "warm",
  // cool register — felt-temperature cooling, opposite warm
  cooling: "cool",
  // body register — gut/stomach, after-meal
  digestive: "body",
  // sleep register — drowsiness, downward drift
  sleepy: "sleep",
};

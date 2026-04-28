// Reference generator — emits multi-axis block for each ingredient
// to paste into ingredients.js. Not run automatically; used as a
// drafting aid so the same shape applies consistently across the
// catalog. Each ingredient pulls from a small palette of phrases
// keyed to its character (calming-floral, bitter-tonic, citrus-bright,
// etc.) but each character + moodImpact is hand-tuned per ingredient.
//
// Run: node tools/zone-blocks.mjs <id>
// Or just read this file as a reference for the patterns.

export const PRESETS = {
  // Bands shared across most leaf-herbal-floral ingredients with
  // standard 5-min center-of-window. Times in seconds; temp in C.
  defaultLeafTimes: {
    under:  [0, 60],
    short:  [60, 180],
    medium: [180, 360],
    long:   [360, 600],
    over:   [600, 720],
  },
  defaultLeafTemps: {
    under: [50, 85],
    cool:  [85, 92],
    warm:  [92, 97],
    hot:   [97, 100],
  },
  // The standard register-mapping table — unless an ingredient has
  // a specific reason to deviate (rooibos forgives long steeps;
  // valerian needs long; matcha is whisked not steeped, etc.)
  defaultRegisterMapping: [
    { id: "faint", when: [
      "under+under", "under+short", "under+medium", "under+long", "under+over",
      "cool+under", "warm+under", "hot+under",
    ]},
    { id: "aromatic", when: ["cool+short", "cool+medium", "warm+short", "hot+short"] },
    { id: "balanced", when: ["cool+long", "warm+medium", "hot+medium"] },
    { id: "tonic", when: ["warm+long", "hot+long"] },
    { id: "overpulled", when: ["cool+over", "warm+over", "hot+over"] },
  ],
};

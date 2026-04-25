/* ──────────────────────────────────────────────────────────────
   algo/perception.js — perceptual transformation layer.

   Raw chemistry → felt cup. Three things happen here:
   1. Flavor masking. Bitter and astringent suppress floral, citrus,
      delicate. Smoky and earthy bury the same family, more brutally.
      Sweet partially masks bitter (the honey-and-ginger trick).
   2. Effect synergies. Caffeine + L-theanine multiplies into "calm
      focus" rather than summing. A stack of sedatives passes a
      ceiling rather than going above it.
   3. Allowed paradoxes. Warming and cooling can co-occur (cardamom).
      Surface both with a tag rather than averaging to zero.

   The matrices are hand-curated and live here so the catalog's
   voice on perception is one tunable file. See docs/vocabulary.md
   for the canonical effect/flavor lists these reference.
   ────────────────────────────────────────────────────────────── */

// Each row = a "loud" flavor or mouthfeel that suppresses gentler ones.
// Values 0–1: suppression coefficient at the masker's max strength of 5.
// At masker strength 2.5, suppression is half the listed value, etc.
export const MASKING_MATRIX = {
  bitter:     { floral: 0.7, citrus: 0.6, sweet: 0.4, umami: 0.5, minty: 0.5, fruity: 0.5, honey: 0.5, delicate: 0.7 },
  bitterness: { floral: 0.7, citrus: 0.6, sweet: 0.4, umami: 0.5, minty: 0.5, fruity: 0.5, honey: 0.5, delicate: 0.7 },
  astringent: { floral: 0.6, fruity: 0.5, sweet: 0.4, umami: 0.4, honey: 0.5, delicate: 0.6 },
  smoky:      { floral: 0.85, fruity: 0.6, citrus: 0.5, delicate: 0.9, honey: 0.5 },
  smoked:     { floral: 0.85, fruity: 0.6, citrus: 0.5, delicate: 0.9, honey: 0.5 },
  pungent:    { floral: 0.5, sweet: 0.4, citrus: 0.4, delicate: 0.6 },
  earthy:     { floral: 0.4, citrus: 0.3, fruity: 0.3, delicate: 0.5 },
};

// Amplifiers — small additive bonuses, capped by the soft ceiling later.
export const AMPLIFIERS = {
  sweet: { floral: 0.15, umami: 0.25, honey: 0.2 },
  umami: { sweet: 0.25 },
};

// Sweet partially neutralizes bitter — the honey-and-ginger trick.
// Special-cased because the masking matrix only goes one direction.
const BITTER_SUPPRESSION_BY_SWEET = 0.35;

// Effect synergies — non-linear bonuses when both effects co-present
// at meaningful strength. Trigger threshold: each component ≥ 1.5.
// Uses the ingredient-profile vocabulary (`comfort`, `settle`) — when
// a profile uses v1 names instead, the matching pair is also covered.
export const EFFECT_SYNERGIES = [
  { when: ["focus", "calm"],     bonus: { focus: 0.6, calm: 0.4 }, label: "calm focus" },
  { when: ["warming", "settle"], bonus: { settle: 0.5 },           label: "warming digestive" },
  { when: ["warming", "digestive"], bonus: { digestive: 0.5 },     label: "warming digestive" },
  { when: ["sleepy", "calm"],    bonus: { sleepy: 0.4 },           label: "deepens sedation" },
  { when: ["calm", "comfort"],   bonus: { comfort: 0.3 },          label: "settled" },
  { when: ["calm", "soothing"],  bonus: { soothing: 0.3 },         label: "settled" },
  { when: ["energy", "warming"], bonus: { energy: 0.3 },           label: "morning lift" },
  { when: ["grounding", "calm"], bonus: { grounding: 0.3 },        label: "rooted" },
];

// Effect pairs that co-exist legitimately rather than canceling.
// When both are present at meaningful strength, surface a paradox tag.
export const ALLOWED_PARADOXES = [
  ["warming", "cooling"],
];

/**
 * Hard cap at 5. The 0–5 range stays linear all the way up — a single
 * ingredient at its full strength still reads at its full strength,
 * and a synergy bonus from 3 → 3.6 reads honestly. The "this is at
 * the ceiling" signal lives in the warnings layer (sedative stack
 * pressure), not in a numeric squash of legitimate values.
 */
export function softCeiling(x) {
  return Math.min(5, Math.max(0, x));
}

/**
 * Hard 0–5 clamp for masked output where the masking math is bounded.
 * Used only after the smooth ceiling has been applied to summed effects.
 */
function clamp05(x) {
  return Math.max(0, Math.min(5, x));
}

/**
 * applyMasking(rawFlavors) → perceivedFlavors
 *
 * Input shape:  { malty: 3.2, floral: 2.1, bitter: 1.8, ... }
 * Output shape: same keys, masked strengths (0–5).
 *
 * For each maskee, every active masker reduces it multiplicatively
 * (1 - coef × maskerStrength/5). Amplifiers add small bonuses.
 * Sweet specifically dampens bitter via BITTER_SUPPRESSION_BY_SWEET.
 *
 * `maskingNotes` records which masker–maskee pairs caused notable
 * suppression (≥30% reduction); the warnings layer reads these.
 */
export function applyMasking(rawFlavors) {
  const out = {};
  const maskingNotes = [];

  for (const [flavor, raw] of Object.entries(rawFlavors)) {
    let perceived = raw;
    let totalSuppression = 0;
    const activeMaskers = [];

    for (const masker in MASKING_MATRIX) {
      const coef = MASKING_MATRIX[masker]?.[flavor];
      if (!coef) continue;
      const maskerStrength = (rawFlavors[masker] || 0) / 5;
      if (maskerStrength <= 0) continue;
      const factor = 1 - coef * maskerStrength;
      perceived *= factor;
      totalSuppression += coef * maskerStrength;
      if (coef * maskerStrength >= 0.3) activeMaskers.push(masker);
    }

    // Honey-and-ginger: sweet eases bitter
    if (flavor === "bitter" || flavor === "bitterness") {
      const sweetStrength = (rawFlavors.sweet || 0) / 5;
      if (sweetStrength > 0) perceived *= (1 - BITTER_SUPPRESSION_BY_SWEET * sweetStrength);
    }

    // Amplifiers
    for (const amp in AMPLIFIERS) {
      const bonus = AMPLIFIERS[amp]?.[flavor];
      if (!bonus) continue;
      perceived += bonus * (rawFlavors[amp] || 0) / 5 * 5;
    }

    out[flavor] = clamp05(perceived);
    if (raw >= 1.5 && activeMaskers.length > 0 && perceived < raw * 0.6) {
      maskingNotes.push({ flavor, maskers: activeMaskers, raw, perceived });
    }
  }

  return { perceived: out, maskingNotes };
}

/**
 * applyEffectSynergies(rawEffects) → { effects, synergyTags, paradoxTags }
 *
 * Input shape:  { calm: 3.2, focus: 4.0, ... }
 * Output:
 *   effects:     same keys with synergy bonuses applied + soft ceiling
 *   synergyTags: array of human labels ("calm focus", "rooted", ...)
 *   paradoxTags: array of `[a, b]` pairs that legitimately co-exist
 */
export function applyEffectSynergies(rawEffects) {
  const out = { ...rawEffects };
  const synergyTags = [];

  for (const rule of EFFECT_SYNERGIES) {
    const [a, b] = rule.when;
    if ((out[a] || 0) >= 1.5 && (out[b] || 0) >= 1.5) {
      for (const [k, v] of Object.entries(rule.bonus)) {
        out[k] = (out[k] || 0) + v;
      }
      if (!synergyTags.includes(rule.label)) synergyTags.push(rule.label);
    }
  }

  // Soft ceiling — squash anything above 5 with a smooth curve.
  for (const k in out) out[k] = softCeiling(out[k]);

  // Paradoxes — surface as info, not warnings
  const paradoxTags = [];
  for (const [a, b] of ALLOWED_PARADOXES) {
    if ((out[a] || 0) >= 1.5 && (out[b] || 0) >= 1.5) paradoxTags.push([a, b]);
  }

  return { effects: out, synergyTags, paradoxTags };
}

/**
 * buildWarnings — converts the various perception artifacts into
 * user-facing notes for the UI's confidence layer.
 *
 *   outsiders        — array of ingredient names brewed outside their range
 *   maskingNotes     — from applyMasking
 *   perceivedEffects — final effect map after synergies + ceiling
 *   synergyTags      — from applyEffectSynergies (passed through, not warned)
 *   paradoxTags      — from applyEffectSynergies
 */
export function buildWarnings({
  outsiders = [],
  maskingNotes = [],
  perceivedEffects = {},
  perceivedFlavors = {},
  paradoxTags = [],
} = {}) {
  const warnings = [];

  for (const name of outsiders) {
    warnings.push({ kind: "outsider", text: `${name} is outside its preferred temp — will extract unevenly.` });
  }

  // Coalesce masking notes by masker for cleaner copy
  for (const note of maskingNotes) {
    const maskerLabel = note.maskers.length === 1 ? note.maskers[0] : note.maskers.join(" + ");
    warnings.push({
      kind: "masking",
      text: `${maskerLabel} is muting the ${note.flavor} you'd expect to taste.`,
    });
  }

  // Tannin creep — bitter and astringent climbing past their gentler register.
  // Combines flavor-side bitter/bitterness/astringent with the bitterness
  // effect (some extraction profiles render bitterness as an effect bar).
  const bitterLevel = (perceivedFlavors.bitter || 0)
                    + (perceivedFlavors.bitterness || 0)
                    + (perceivedEffects.bitterness || 0);
  const astringentLevel = perceivedFlavors.astringent || 0;

  if (bitterLevel + astringentLevel >= 4) {
    warnings.push({
      kind: "tannin",
      text: "Tannins are taking over — drop a few degrees or shave the steep.",
    });
  } else if (astringentLevel >= 2) {
    warnings.push({
      kind: "tannin",
      text: "Astringent edge climbing — gentler heat or a shorter steep would soften it.",
    });
  } else if (bitterLevel >= 2.5) {
    warnings.push({
      kind: "tannin",
      text: "The bitter side is starting to dominate — pull back the steep or drop a few degrees.",
    });
  }

  // Off-aromatic over-pull. Different mechanism than tannins; same fix
  // (pull back). Each off-note has its own threshold and copy — soapy
  // and camphor for florals, harsh / acrid / burnt for spices and
  // greens, medicinal for clove- and menthol-driven cups.
  const offNotes = [
    { name: "soapy",     threshold: 0.5, text: "The aromatic register is tipping into soap — pull back the steep." },
    { name: "camphor",   threshold: 1.8, text: "Camphor is overtaking the perfume — gentler heat or shorter time." },
    { name: "muddy",     threshold: 1,   text: "The cup is going muddy — pull back to keep the notes distinct." },
    { name: "medicinal", threshold: 1.5, text: "The eugenol is tipping medicinal — fewer cloves or a shorter steep." },
    { name: "harsh",     threshold: 1.5, text: "Sharpness is turning harsh — drop a few degrees or shorten the pull." },
    { name: "acrid",     threshold: 1,   text: "An acrid edge is climbing — pull back temp or time." },
    { name: "burnt",     threshold: 1,   text: "The cup is heading burnt — drop the temperature." },
  ];
  for (const off of offNotes) {
    if ((perceivedFlavors[off.name] || 0) >= off.threshold) {
      warnings.push({ kind: "aromatic", text: off.text });
      break; // one aromatic note is enough; the user gets the message
    }
  }

  // Sedative ceiling — calm + sleepy summed pressure
  const sedativePressure = (perceivedEffects.sleepy || 0) + (perceivedEffects.calm || 0) * 0.5;
  if (sedativePressure >= 6) {
    warnings.push({ kind: "ceiling", text: "This stack of sedatives is at the ceiling — don't drive after." });
  }

  for (const [a, b] of paradoxTags) {
    warnings.push({ kind: "paradox", text: `${a} and ${b} will both register — the cup walks both sides.` });
  }

  return warnings;
}

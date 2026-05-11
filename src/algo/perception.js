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
//
// "Fresh" is treated as a negative-space register — it reads precisely
// because heavier registers aren't competing for the palate. So most
// of the heavy maskers also mask fresh, with strong coefficients that
// push it below the 0.5 visibility floor when those flavors are loud.
// Vegetal is intentionally NOT a fresh-masker: sencha and dragonwell
// hold both registers at once, and the green-tea fresh-vegetal pair
// is real — masking it there would misread the cup.
const MASKING_MATRIX = {
  bitter:     { floral: 0.7, citrus: 0.6, sweet: 0.4, umami: 0.5, minty: 0.5, fruity: 0.5, honey: 0.5, delicate: 0.7, fresh: 0.7 },
  bitterness: { floral: 0.7, citrus: 0.6, sweet: 0.4, umami: 0.5, minty: 0.5, fruity: 0.5, honey: 0.5, delicate: 0.7, fresh: 0.7 },
  // astringent now masks umami too — glutamate and catechin grip
  // compete for receptor attention, so a tannic cup partially
  // buries the umami amino-acid signal that gyokuro/matcha lean on.
  astringent: { floral: 0.6, fruity: 0.5, sweet: 0.4, umami: 0.4, honey: 0.5, delicate: 0.6, fresh: 0.6 },
  // smoky → fresh tuned down 0.95 → 0.88. 0.95 effectively
  // extinguished fresh on any moderate smoky cup; 0.88 still pushes
  // fresh decisively back without erasing it on lighter smoky brews
  // (matches "smoky with hints of fresh" tasting notes for lapsang).
  smoky:      { floral: 0.85, fruity: 0.6, citrus: 0.5, delicate: 0.9, honey: 0.5, fresh: 0.88 },
  smoked:     { floral: 0.85, fruity: 0.6, citrus: 0.5, delicate: 0.9, honey: 0.5, fresh: 0.88 },
  pungent:    { floral: 0.5, sweet: 0.4, citrus: 0.4, delicate: 0.6, fresh: 0.6 },
  // earthy → fruity raised 0.3 → 0.45. Forest-floor / dark cups
  // (puerh, reishi, ashwagandha) bury fruit harder than the prior
  // coefficient allowed; 0.45 reduces a fruit signal to ~64% in a
  // strongly earthy cup, matching how shou puerh hides berry notes
  // in real blind tasting.
  earthy:     { floral: 0.4, citrus: 0.3, fruity: 0.45, delicate: 0.5, fresh: 0.85 },
  // New rows — heavier non-tannic registers that drown out the
  // "fresh, just-picked" reading. These don't mask the lighter
  // aromatic family (floral / citrus / fruit), only fresh itself.
  malty:      { fresh: 0.9 },
  creamy:     { fresh: 0.85 },
  woody:      { fresh: 0.8 },
  leather:    { fresh: 0.9 },
  dark:       { fresh: 0.85 },
  caramel:    { fresh: 0.7 },
  roasted:    { fresh: 0.75 },
};

// Amplifiers — small additive bonuses, capped by the soft ceiling later.
const AMPLIFIERS = {
  sweet: { floral: 0.15, umami: 0.25, honey: 0.2 },
  umami: { sweet: 0.25 },
};

// Sweet partially neutralizes bitter — the honey-and-ginger trick.
// Special-cased because the masking matrix only goes one direction.
// Raised 0.35 → 0.45 so honey-forward / dessert-leaning blends
// suppress bitter to a degree closer to the real psychophysical
// curve. Individual variability in TAS2R38 / PROP genetics means
// any single coefficient is an average, but 0.45 fits the middle of
// the published range better than 0.35 did for sweet-led cups.
const BITTER_SUPPRESSION_BY_SWEET = 0.45;

// Perceptual loudness — how strongly a flavor reads in the cup
// relative to its grams contribution. Mint at 1g doesn't taste like
// 1g of grass; menthol's TRPM8 trigeminal hijack makes it dominant
// well above its mass ratio. Likewise smoky phenols and bitter
// alkaloids carry farther than sweet or floral volatiles. These
// multipliers are applied to the grams-weighted raw-flavor
// accumulation in resolveBlendAtBrew so a small dose of a loud
// flavor reads dominant the way it does in real life.
//
// Calibrated against the dominance hierarchy in docs/masking.md.
// Default for any flavor not listed is 1.0.
const FLAVOR_LOUDNESS = {
  // High — these dominate well above their grams ratio
  bitter: 1.8, bitterness: 1.8,
  smoky: 2.0, smoked: 2.0,
  minty: 2.0, mint: 2.0, cool: 1.8, cooling: 1.8,
  astringent: 1.6, pungent: 1.6, tannic: 1.5,
  tar: 1.5,
  // Mid — a touch louder than mass-ratio
  spiced: 1.2, peppery: 1.4, roasted: 1.1, earthy: 1.1,
  // Tart / acidic-bright register. Anthocyanins, citric/malic acid,
  // and tartaric character read more loudly on the palate than
  // their grams ratio suggests, and they're stable in water (acids
  // don't volatilize). Boosting loudness here keeps tart, bright,
  // cranberry from cliff-edging in and out of the visibility
  // threshold when contributed by small accent ingredients.
  tart: 1.2, bright: 1.2, cranberry: 1.1,
  // Low — easily dominated, read quieter than grams ratio
  sweet: 0.7, honey: 0.7, honeyed: 0.7, "honey-sweet": 0.7,
  floral: 0.7, delicate: 0.6,
  fruity: 0.85, vanilla: 0.85,
};

export function loudnessOf(flavor) {
  return FLAVOR_LOUDNESS[flavor] ?? 1.0;
}

// Flavors that should STACK across ingredients rather than dilute
// via dose-weighting. Two registers belong here:
//
//   - Heat / spice (capsaicin / piperine / eugenol) — independent
//     trigeminal grips that sum on the palate. Three 1/3-dose hot
//     ingredients read genuinely hotter than one full-dose source.
//   - Tannin grip (catechins / tannic acid / theaflavins) — every
//     tannic source adds to the dry-mouth accumulation rather than
//     averaging out. A multi-leaf chai cup is more astringent than
//     a single-leaf cup at equivalent total mass.
//
// Most aromatic flavors (citrus, floral, fruity, smoky, vegetal)
// genuinely saturate via dose dilution and stay outside this set —
// two citrus ingredients at 50/50 read as one citrus, not two.
//
// Calibration note: the tannin / overpull thresholds in this file
// are tuned against this stacking model. Removing items from this
// set without re-tuning would silently miss tannin warnings on
// multi-source blends.
export const ADDITIVE_FLAVORS = new Set([
  // Heat
  "peppery", "pungent", "spiced", "hot", "numbing",
  // Tannin grip — dry-mouth + bitter alkaloids accumulate, don't
  // dilute, when multiple tannic sources share a cup.
  "bitter", "bitterness", "astringent", "tannic",
]);

// Soft ceiling for additive flavors. Past 5 the palate saturates
// — a cup can't realistically read hotter / more bitter than this
// regardless of how many sources contribute. Caps a runaway sum.
const ADDITIVE_CAP = 5;

// Minimum per-contributor strength to count as a "real" stacking
// source. Stacking only kicks in for contributors that are
// individually meaningful at the noticeable-or-above level
// (strength ≥ 2 = "present, noticeable" on the catalog scale).
// Below this, the contribution stays on the dose-weighted path
// so background trace notes don't sum into phantom tannin or
// phantom heat. A multi-leaf cup with one trace-astringent
// contributor each won't stack; a cup with three honestly-tannic
// tea bases will.
export const STACKING_MIN_STRENGTH = 2.0;

// Stacking exponent. weight^0.85 sits between dose-weighted (1) and
// pure unweighted (0). Chosen so single-source full-weight ingredients
// read identically to the prior math, two-source 50/50 lifts ~1.11×,
// three-source 1/3 lifts ~1.21×, four-source 1/4 lifts ~1.27×, and
// the curve flattens past five sources — heat / tannin builds
// noticeably with stack count without runaway. Steeper exponents
// (0.5, 0.7) flagged accent-stretched curated blends as tannic at
// baseline; 0.85 keeps those blends clean while still surfacing
// honestly tannic multi-leaf cups. 1.0 would be no stacking at all.
export const STACK_EXPONENT = 0.85;

/**
 * Combine raw flavor contributions across ingredients. Two paths:
 *
 *   - Additive set (heat, bitter, astringent): if a flavor has 2+
 *     strong LEAD contributors (each at strength ≥ STACKING_MIN_STRENGTH
 *     and role !== "accent"/"catalyst"), ALL lead contributors of that
 *     flavor switch to weight^STACK_EXPONENT accumulation — multi-lead
 *     heat / tannin builds with stack count. Accents and catalysts
 *     always stay dose-weighted so curator-stretched accents don't
 *     pile onto the cup's tannin reading. Capped at ADDITIVE_CAP.
 *   - Everything else: dose-weighted × loudness (the existing
 *     behavior). Two citrus contributors at 50/50 still read as
 *     one citrus — most aromatic flavors saturate via dilution.
 *
 * Why leads only: accents are deliberate stylistic stretches by
 * the curator (e.g. rose past its overpull point to introduce a
 * tannic edge). Stacking them with another over-pulled accent
 * created false cup-level warnings on blends the curator considers
 * clean. Real multi-source heat / tannin from a chai-style recipe
 * comes from multiple LEAD spices, which is what we want to flag.
 *
 * Backward-compatible for single-source blends (any weight^k = same
 * when weight = 1), so the existing curated catalog's calibration
 * holds for one-leaf cups.
 */
export function combineFlavors(contributions) {
  // Lead-only filter for stacking. Accents (curator-stretched
  // stylistic stretches) and catalysts (trace bioavailability
  // helpers) don't participate in stacking — they always
  // dose-weight, even if their extraction profile flags strength
  // ≥ threshold.
  const isStackable = (c) => {
    const r = c.role || "lead";
    return r === "lead";
  };

  // First pass — count strong LEAD contributors per additive flavor.
  // A flavor only switches to stacking math when 2+ leads are
  // independently meaningful tannic / heat sources.
  const strongCount = {};
  for (const c of contributions) {
    if (!c.profile?.flavors || !isStackable(c)) continue;
    for (const [name, strength] of c.profile.flavors) {
      if (ADDITIVE_FLAVORS.has(name) && strength >= STACKING_MIN_STRENGTH) {
        strongCount[name] = (strongCount[name] || 0) + 1;
      }
    }
  }

  // Second pass — accumulate. Lead contributions to flavors with
  // ≥2 strong leads use the stacking path; everything else uses
  // dose-weighted.
  const out = {};
  for (const c of contributions) {
    if (!c.profile?.flavors) continue;
    const stackable = isStackable(c);
    for (const [name, strength] of c.profile.flavors) {
      const loud = loudnessOf(name);
      const stack = stackable
        && ADDITIVE_FLAVORS.has(name)
        && (strongCount[name] || 0) >= 2;
      const w = stack
        ? Math.pow(Math.max(0, c.weight), STACK_EXPONENT)
        : c.weight;
      out[name] = (out[name] || 0) + strength * w * loud;
    }
  }
  for (const name of Object.keys(out)) {
    if (ADDITIVE_FLAVORS.has(name)) {
      out[name] = Math.min(ADDITIVE_CAP, out[name]);
    }
  }
  return out;
}

// Effects that get blunted when a cup is overpulled — focus, calm,
// soothing, uplifting are the "fragile" registers that real overpull
// degrades along with the bitterness it adds. Warming, energy,
// digestive, smoky, grounding stay monotonic — they survive overpull
// (and in some cases intensify with it).
export const FRAGILE_EFFECTS = ["focus", "calm", "soothing", "uplifting"];

// Threshold above which astringent/bitter starts blunting fragile
// effects. Below this the cup is "honestly extracted" and fragile
// effects survive at full strength.
const OVERPULL_THRESHOLD = 2.0;

// Per-unit-overpull attenuation. At overpull = 3 (e.g. astringent 5),
// fragile effects get scaled by (1 - 0.15*3) = 0.55 — a clear cliff
// without zeroing out the underlying signal.
const ATTENUATION_K = 0.15;

/**
 * Scale fragile effects (focus, calm, soothing, uplifting) down when
 * the cup is overpulled. Real teas don't read sharper when burnt —
 * focus and calm degrade alongside the bitterness that signals the
 * overpull. This is the parabolic curve the monotonic extraction
 * profiles can't model on their own.
 *
 * Returns a new effects map; does not mutate the input.
 */
export function attenuateFragileEffects(effectsMap, flavorsMap) {
  const astringent = (flavorsMap.astringent || 0) + (flavorsMap.tannic || 0);
  const bitter     = (flavorsMap.bitter || 0) + (flavorsMap.bitterness || 0)
                   + (effectsMap.bitterness || 0);
  const overpull   = Math.max(0, astringent - OVERPULL_THRESHOLD)
                   + Math.max(0, bitter - OVERPULL_THRESHOLD);
  if (overpull <= 0) return effectsMap;
  const factor = Math.max(0, 1 - ATTENUATION_K * overpull);
  const out = { ...effectsMap };
  for (const tag of FRAGILE_EFFECTS) {
    if (out[tag]) out[tag] = out[tag] * factor;
  }
  return out;
}


// Effect synergies — non-linear bonuses when both effects co-present
// at meaningful strength. Trigger threshold: each component ≥ 1.5.
// Uses the ingredient-profile vocabulary (`comfort`, `digestive`) — when
// a profile uses v1 names instead, the matching pair is also covered.
export const EFFECT_SYNERGIES = [
  { when: ["focus", "calm"],     bonus: { focus: 0.6, calm: 0.4 }, label: "calm focus" },
  { when: ["warming", "digestive"], bonus: { digestive: 0.5 },     label: "warming digestive" },
  { when: ["sleepy", "calm"],    bonus: { sleepy: 0.4 },           label: "deepens sedation" },
  { when: ["calm", "comfort"],   bonus: { comfort: 0.3 },          label: "settled" },
  { when: ["calm", "soothing"],  bonus: { soothing: 0.3 },         label: "settled" },
  { when: ["energy", "warming"], bonus: { energy: 0.3 },           label: "morning lift" },
  { when: ["grounding", "calm"], bonus: { grounding: 0.3 },        label: "rooted" },
  // Cross-ingredient theanine-caffeine modulation: when a cup
  // carries BOTH calm and energy at meaningful strength, real
  // perception smooths the caffeine's jitter edge — the cup reads
  // alert rather than wired. Bonus enhances focus and gently
  // preserves calm; does NOT add to energy (preventing a runaway
  // 'more theanine = more energy' loop). Catches blends where one
  // ingredient brings theanine-style calm (matcha, gyokuro, sencha)
  // and another brings caffeine-driven energy (black tea, mate),
  // even when the chemistry doesn't come from one source.
  { when: ["calm", "energy"],    bonus: { focus: 0.5, calm: 0.3 }, label: "alert calm" },
];

// Effect pairs that co-exist legitimately rather than canceling.
// When both are present at meaningful strength, surface a paradox tag.
const ALLOWED_PARADOXES = [
  ["warming", "cooling"],
];

/**
 * Hard cap at 5. The 0–5 range stays linear all the way up — a single
 * ingredient at its full strength still reads at its full strength,
 * and a synergy bonus from 3 → 3.6 reads honestly. The "this is at
 * the ceiling" signal lives in the warnings layer (sedative stack
 * pressure), not in a numeric squash of legitimate values.
 */
function softCeiling(x) {
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
 *   outsiders        — array of either bare ingredient names (legacy)
 *                       or { name, reason: "temp"|"time"|"both" } records
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
  caffeineMg = 0,
} = {}) {
  const warnings = [];

  for (const o of outsiders) {
    const isObj = o && typeof o === "object";
    const name = isObj ? o.name : o;
    const role = isObj ? (o.role || "lead") : "lead";
    const tempDir = isObj ? o.tempDir : null;
    const timeDir = isObj ? o.timeDir : null;
    const tempPhrase =
      tempDir === "low" ? "below its preferred temperature"
      : tempDir === "high" ? "above its preferred temperature"
      : null;
    const timePhrase =
      timeDir === "under" ? "under-steeped"
      : timeDir === "over" ? "over-steeped"
      : null;
    let phrase;
    if (tempPhrase && timePhrase) phrase = `${tempPhrase} and ${timePhrase}`;
    else if (tempPhrase)          phrase = tempPhrase;
    else if (timePhrase)          phrase = timePhrase;
    else                          phrase = "outside its preferred range";  // legacy fallback
    warnings.push({
      kind: "outsider", role,
      tempDir, timeDir,
      text: `${name} is ${phrase} — will extract unevenly.`,
    });
  }

  // Coalesce masking notes by masker for cleaner copy
  for (const note of maskingNotes) {
    const maskerLabel = note.maskers.length === 1 ? note.maskers[0] : note.maskers.join(" + ");
    warnings.push({
      kind: "masking",
      text: `${maskerLabel} is muting the ${note.flavor} you'd expect to taste.`,
    });
  }

  // Tannin creep — bitter and astringent climbing past their gentler
  // register. The math here mirrors the bitterness / astringency
  // balance bars exactly so a user reading "3.4 bitter, 2.4 astringent"
  // off the bars never wonders why no warning fires:
  //   • bitterBar      = bitter + bitterness + astringent + effect:bitterness
  //   • astringencyBar = astringent + tannic
  // Earlier the warning math read raw perceivedFlavors[bitter,
  // bitterness] only, so a cup whose bar values came mostly from
  // astringent + tannic (e.g. an over-pulled gunpowder cup) showed
  // a loud bar but stayed silent on the warning side.
  const bitterBar = (perceivedFlavors.bitter || 0)
                  + (perceivedFlavors.bitterness || 0)
                  + (perceivedFlavors.astringent || 0)
                  + (perceivedEffects.bitterness || 0);
  const astringencyBar = (perceivedFlavors.astringent || 0)
                       + (perceivedFlavors.tannic || 0);

  if (bitterBar >= 4) {
    warnings.push({
      kind: "tannin",
      text: "Tannins are taking over — drop a few degrees or shave the steep.",
    });
  } else if (astringencyBar >= 2) {
    warnings.push({
      kind: "tannin",
      text: "Astringent edge climbing — gentler heat or a shorter steep would soften it.",
    });
  } else if (bitterBar >= 2.5) {
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

  // Caffeine-load warning — high-caffeine cups can read jittery for
  // sensitive bodies even when no axis is over-extracted. Fires when
  // total caffeine clears 130mg AND the cup also expresses energy or
  // focus strongly (the registers most associated with the adverse
  // mirror — "wired" instead of "alert"). 130mg is past a normal cup
  // of coffee or tea, into doubled-up / strong-second-cup territory;
  // healthy adults tolerate this fine, the warning is a heads-up for
  // caffeine sensitivity, not a contraindication.
  const energyHigh = (perceivedEffects.energy || 0) >= 4;
  const focusHigh = (perceivedEffects.focus || 0) >= 4;
  if (caffeineMg >= 130 && (energyHigh || focusHigh)) {
    warnings.push({
      kind: "caffeine",
      text: `High caffeine load (~${Math.round(caffeineMg)}mg) — may read wired or jittery for caffeine-sensitive bodies.`,
    });
  }

  for (const [a, b] of paradoxTags) {
    warnings.push({ kind: "paradox", text: `${a} and ${b} will both register — the cup walks both sides.` });
  }

  return warnings;
}

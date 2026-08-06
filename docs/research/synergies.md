# Effect synergies — what the pairings are, and on whose authority

The app models thirteen pairings where two co-present effects give each
other a bonus (`EFFECT_SYNERGIES` in `src/algo/perception.js`). They
were written from pattern and intuition and carried no sources, which
is the situation `CLAUDE.md` exists to prevent: an unsourced effect
presented with the authority of a sourced one, where the reader can't
tell which is which.

This is the audit. Each pairing is graded by what actually backs it,
and `SYNERGY_DESCRIPTIONS` in `src/data/vocabularyDescriptions.js` is
transcribed from here — not the other way round.

Three grades, the same ones the ingredient docs use:

- **measured** — a trial tested the COMBINATION, not just the parts.
- **traditional** — a real, documented preparation. The practice is the
  evidence and is named as such, never dressed up as clinical.
- **descriptive** — no mechanism claimed. The entry describes how two
  registers sit together in a cup, which is a description, not a
  finding.

---

## measured

### `alert calm` (calm + energy) and `calm focus` (focus + calm)

The strongest evidence in the table, and the only pairing where a study
isolated the combination against each component alone.

> Haskell CF, Kennedy DO, Milne AL, Wesnes KA, Scholey AB (2008). *The
> effects of L-theanine, caffeine and their combination on cognition
> and mood.* Biological Psychology 77(2):113–122.

Randomised, placebo-controlled, double-blind, balanced crossover. 250 mg
L-theanine with 150 mg caffeine significantly improved sentence
verification, simple reaction time, numeric working memory and delayed
word-recognition reaction time against placebo.

The load-bearing detail: improvements in simple and numeric working
memory reaction time, sentence-verification accuracy and **alertness
ratings were found for the combined treatment but not for either
treatment alone**. That is what a synergy claim requires — the pair
doing something neither part does.

Note against overclaiming: at least one later study
(*l-Theanine and caffeine improve task switching but not intersensory
attention or subjective alertness*) found the alertness effect did not
replicate on every measure. The app claims attention, not euphoria.

Both labels describe the same chemistry from different sides —
`alert calm` read from the energy side, `calm focus` from the focus one.

### `deepens sedation` (sleepy + calm) and `deep settle` (soothing + sleepy)

Valerian with lemon balm is one of the better-studied herbal
combinations, and it is tested AS a combination.

> Cerny A, Schmid K (1999). *Tolerability and efficacy of
> valerian/lemon balm in healthy volunteers (a double-blind,
> placebo-controlled, multicentre study).* Fitoterapia 70(3):221–228.

Well tolerated — 93% of the valerian/lemon balm group reported no
tolerability issues against 91% on placebo.

A later triple-blind randomised placebo-controlled trial in
postmenopausal women with sleep disorder (100 participants, 160 mg
valerian + 80 mg lemon balm daily for one month, Pittsburgh Sleep
Quality Index) found sleep quality improved in 36% of the treatment arm
against 8% of placebo.

The app's two labels split this register: `deepens sedation` is the
mind-quieting side, `deep settle` the body-unwinding one. The evidence
covers the combination without distinguishing the two, so neither
description claims more than "these are studied together".

### `Maghrebi refresh` (cooling + focus)

Mechanism and trial both exist, though on aroma rather than on the
mint-plus-green-tea pairing specifically.

> Moss M, Hewitt S, Moss L, Wesnes K (2008). *Modulation of cognitive
> performance and mood by aromas of peppermint and ylang-ylang.*
> International Journal of Neuroscience 118(1):59–77.

144 volunteers randomised to peppermint aroma, ylang-ylang aroma, or no
aroma. Peppermint enhanced memory, improved processing speed, and
increased subjective alertness — ylang-ylang did the opposite, which is
what makes the result a finding about peppermint rather than about
smelling something pleasant.

Mechanistically, menthol activates TRPM8 (the cold receptor) and acts
on cholinergic signalling — a positive allosteric modulator of
acetylcholine receptors and an acetylcholinesterase inhibitor. The
cooling sensation and the alerting effect share a compound.

A 2025 randomised placebo-controlled trial of peppermint *tea*
(Netzler et al., Human Psychopharmacology) reported cognitive and
cerebrovascular effects from the drink rather than the aroma alone.

What is NOT established: that the Maghrebi ritual's specific pairing of
gunpowder green with spearmint was selected for this effect. The
tradition is real; the causal story is ours, and the description says
cooling and alertness share a compound rather than claiming the culture
discovered it.

### `warming digestive` (warming + digestive)

Carminative action is well established per-herb, and warmth has a
plausible, documented role.

Peppermint relaxes intestinal smooth muscle through calcium-channel
blockade; fennel's volatile oils act on the same register; ginger
accelerates gastric emptying — a 2023 trial in Phytotherapy Research
reported a reduction of nearly 25% in healthy adults, consistent with
earlier ethnopharmacology work. Warm liquid itself aids motility, which
is why these preparations are traditionally drunk hot rather than cold.

Graded **measured** for the carminative half and the warmth-aids-
motility half separately. No trial has tested "warming plus carminative"
as a combination, and the description says so.

---

## traditional

The preparation is real and documented. What is not documented is that
the combination produces MORE of either effect — that inference is the
app's, and these entries name the tradition as their source.

- **`after-meal lift`** (uplifting + digestive) — Italian canarino,
  Mexican agua de jamaica with lime, the French after-dinner tisane.
  Cultures that eat late converge on a cup that lifts and settles.
- **`winter root`** (grounding + warming) — the Yunnan-Tibetan
  decoction register, fermented tea with warming root.

---

## descriptive

No mechanism is claimed and none is known. These describe how two
registers read together in a cup. They stay because a description is
honest as long as it doesn't dress as a finding.

- **`the holding cup`** (soothing + comfort)
- **`settled`** (calm + comfort, and calm + soothing)
- **`rooted`** (grounding + calm)
- **`morning lift`** (energy + warming)

---

## What this audit did not settle

The **bonus magnitudes** are unsourced across the board. Even where the
pairing is measured, no study says the interaction is worth +0.4 on a
0–5 scale rather than +0.2. The numbers are a modelling choice and
should be described as one if they are ever surfaced to users.

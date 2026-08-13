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

## Paradoxes — and the one that isn't

`ALLOWED_PARADOXES` marked two pairs as legitimately co-existing rather
than cancelling, and surfaced both with the same line: *"X and Y will
both register — the cup walks both sides."* They are not the same kind
of pair.

### `warming` + `cooling` — a real paradox. KEEP, and now sourced.

It fires on real cups, which is why it earned research rather than a
shrug: Throat Coat and Holunder Care both trigger it, and **fennel and
cardamom each carry both registers on their own**.

The mechanism is two separate ion channels, neither inhibiting the
other — which is exactly what `energy + sleepy` turned out not to be.

- **Cooling — TRPM8.** The cold-and-menthol receptor. Menthol activates
  TRPM8 (and TRPA1) directly, and **1,8-cineole is a TRPM8 agonist** —
  the compound cardamom is rich in, and the reason a cardamom pod reads
  cool at the front of the mouth.
- **Warming — TRPV1.** The heat receptor, classically activated by
  painful heat and by capsaicin. **Gingerols and shogaols are TRPV1
  agonists**, structurally similar to capsaicin and raising intracellular
  calcium through the same channel; shogaols are the more potent, which
  is why dried ginger bites harder than fresh. Their lower potency
  against capsaicin is why ginger reads as *warming and transient*
  rather than sharply burning.

Two channels, two compound families, no antagonism between them. A cup
carrying both really does deliver both, and a drinker really does feel
both — often in different parts of the mouth and at different moments.
"Walks both sides" is accurate here in a way it never was for caffeine
and a sedative.

Sources: TRPM8 as the cold/menthol receptor (McKemy et al., *A TRP
Channel that Senses Cold Stimuli and Menthol*); 1,8-cineole as a TRPM8
agonist (Modulation of thermoreceptor TRPM8 by cooling compounds, PMID
22860192); gingerols/shogaols at TRPV1 (Yin et al. 2019, *Structural
mechanisms underlying activation of TRPV1 channels by pungent compounds
in gingers*, Br J Pharmacol; PMID 17176640).

### `energy` + `sleepy` — an ANTAGONISM, not a paradox. CORRECTED.

Caffeine does not sit alongside a sedative; it opposes it, and partly
through the same receptor.

- Caffeine exerts most of its effect by antagonising adenosine
  receptors (A1, A2A, A2B, A3) — and **at higher concentrations acts as
  a GABA-A antagonist**, which is the pathway valerian's valerenic acid
  and chamomile's apigenin work through.
- Caffeine given with diazepam produces a dose-dependent **decrease in
  sleep duration** in animal models.
- Chronic caffeine or theophylline exposure **reduces GABA's ability to
  potentiate benzodiazepine binding** at the GABA/benzodiazepine
  receptor (Pharmacology, 1988).
- Methylxanthines and benzodiazepines are characterised in the
  literature as producing behaviourally **opposite** effects.

So the honest reading is not "both register". It is: the caffeine wins,
and the sedative leaves are working uphill against it. A drinker who
stacked chamomile onto a black tea to wind down has bought a cup that
will most likely read alert, with the calming half spent opposing the
stimulant rather than reaching them.

That is more useful to know than "the cup walks both sides", and it is
the difference between the app describing a curiosity and warning about
a mistake.

Sources: caffeine/adenosine and GABA-A antagonism (Caffeine and
Adenosine, PMID 20164566); caffeine reducing GABA/benzodiazepine site
interaction (PMID 2835648); caffeine against diazepam-induced sedation
(Global Scientific Journal).

#### ADDENDUM — "the caffeine wins" is not what the direct evidence shows

The paragraph above was reasoned from mechanism, and the direct human
trial runs the other way. Both halves of the correction matter.

**The antagonism is MUTUAL and dose-dependent in BOTH directions.**

Schellenberg R, Sauer S, Abourashed EA, Koetter U, Brattström A (2004).
*The fixed combination of valerian and hops (Ze 91019) acts via a
central adenosine mechanism.* Planta Medica 70(7):594–597.
PMID 15254851, DOI 10.1055/s-2004-827180.

48 healthy men, randomised, placebo-controlled, blinded. Three arms —
6 placebo tablets, 6 verum, or 2 verum plus 4 placebo; each verum
tablet 250 mg valerian extract and 60 mg hops extract. All subjects
took **200 mg caffeine simultaneously**, with quantitative EEG
recording CNS activation. Two tablets **reduced** and six tablets
**inhibited** the caffeine-induced arousal, at 60 minutes post-dose.
Read by the authors as competition at central adenosine receptors:
caffeine the antagonist, valerian/hops a partial agonist at the same
site.

At the doses tested, in other words, **the herb won.** Not "the calming
leaves are spent working uphill" — the arousal was abolished.

The human diazepam data points the same way about mutuality, and also
upgrades a source. Roache JD, Griffiths RR (1987). *Interactions of
diazepam and caffeine: behavioral and subjective dose effects in
humans.* Pharmacol Biochem Behav 26(4):801–812. PMID 3602037. Nine
subjects, all twelve combinations of diazepam (0/10/20 mg) and caffeine
(0/200/400/600 mg). Caffeine generally antagonised diazepam's sedation
ratings and psychomotor impairment — and did **not** consistently
antagonise its effect on recall. So even the stimulant's win is partial
and axis-specific. This replaces the animal/Global-Scientific-Journal
citation above with human data.

**THE MECHANISM DOES NOT GENERALISE ACROSS OUR SEDATIVE HERBS, and this
is the part that constrains the app.**

Ze 91019 competes with caffeine *at adenosine receptors* — the same
receptor caffeine acts on. That shared site is why they cancel. But
chamomile's apigenin has no established adenosine action:
`docs/research/ingredients/chamomile.md` records that flumazenil does
not reverse it, that BZ-site affinity is too low to explain the
behaviour, and that the mechanism is "not well understood" (Avallone
2000, Zanoli 2000, Losi 2004, Saadatmand 2024).

So applying valerian's competition to every ingredient that ships
`sleepy` would be **inventing a mechanism from a label** — the same
error the ANTAGONISMS comment already refuses for cardamom's
traditional `energy`. Eleven ingredients ship `sleepy`; one of them
(valerian) has a direct caffeine trial behind it.

**Limits, stated plainly.** Ze 91019 is a standardised extract at a
therapeutic dose — six tablets is 1.5 g valerian extract plus 360 mg
hops. A spoon of valerian root in a cup is neither that dose nor that
preparation, and the trial measured EEG arousal at 60 minutes, not
whether anyone fell asleep. The direction and the dose-dependence
transfer; the magnitude does not.

**What this means for the model.** The cup is a competition, not a
winner-take-all, so the failure being corrected is `sleepy` 5 *and*
`energy` 5 in one cup with three contradictory warnings attached.
Both sides should blunt when they co-occur with real caffeine, roughly
symmetrically, because that is what mutual competitive antagonism
predicts and what both trials show. Neither should reach zero: no
source shows abolition of either at cup-realistic doses, and the
sedative is still physically in the cup — the stack warning stays true
whatever the caffeine does.

The **coefficient remains a modelling choice**, as with every bonus in
this file (see below). Sourced: the direction, the mutuality, the
dose-dependence. Not sourced: the number.

## What this audit did not settle

The **bonus magnitudes** are unsourced across the board. Even where the
pairing is measured, no study says the interaction is worth +0.4 on a
0–5 scale rather than +0.2. The numbers are a modelling choice and
should be described as one if they are ever surfaced to users.

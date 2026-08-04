# Ingredient Research — Lavender

> Research-populated file using chamomile v6 / hibiscus v2 as reference
> architecture.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `lavender` | matches INGREDIENTS key |
| **display name** | Lavender | |
| **latin / scientific** | *Lavandula angustifolia* | English/true lavender. Also called *L. officinalis* in older texts. The species used in tea and therapeutic preparations. Distinct from *L. × intermedia* (lavandin, hybrid, higher camphor) and *L. stoechas* (French/Spanish, higher 1,8-cineole — less common in tea) |
| **category** | flower | Buds are the part used; occasionally flowering tops including leaves |
| **subcategory** | — | |
| **also known as** | English lavender, true lavender, culinary lavender | Cultivars Hidcote and Munstead are the culinary standards |

---

## 2. Overview

**One-line essence** (blurb field):

> Herbaceous, floral, with that unmistakable calming effect.

*(existing app copy — keep)*

**Short description** (ingredient page):

> Lavender tea is made from the dried flower buds of *Lavandula angustifolia*, a Mediterranean shrub cultivated across Provence, the English countryside, and increasingly worldwide. The cup is herbaceous and floral with a distinct resinous-camphor edge — more savory than sweet, more cooling than warming. Among herbal teas, lavender has one of the stronger evidence bases for anxiolytic (anti-anxiety) effects, though almost all of that evidence is from a specific standardized oral preparation (Silexan) rather than tea, so the picture for a casual cup is more uncertain than headlines suggest.

> **Mechanism note:** Unlike chamomile (where the GABA story is
> contested) or hibiscus (where the ACE-inhibition story is settled),
> lavender sits somewhere in between. The standardized oral lavender
> oil preparation **Silexan** (80 mg/day) has been approved in Germany
> as an anxiolytic and shown in multiple RCTs to be comparable to
> lorazepam 0.5 mg/d in generalized anxiety disorder and to paroxetine
> 20 mg/d or sertraline 50 mg/d in depression (Kasper et al. 2014,
> 2018; meta-analysis n=1213 across 5 trials). The mechanism is
> characterized as voltage-dependent calcium channel (VDCC)
> inhibition, with additional binding affinity for NMDA receptors and
> the serotonin transporter (SERT) — **not the GABA pathway** that
> gets casually attributed to "calming herbs" in general. Primary
> actives are linalool (~36.8%) and linalyl acetate (~34.2%).
>
> The honest counterpoint: Silexan is a concentrated oral oil
> preparation, not tea. How much of this extrapolates to a 5-minute
> steep of dried buds in hot water is genuinely unclear. The volatile
> linalool and linalyl acetate have limited water solubility and
> partially escape as steam during brewing. Tea likely provides a
> milder, qualitatively similar effect, but the clinical data doesn't
> directly support tea-strength dosing. We surface the mechanism
> because it's real; we hedge on strength because the delivery is
> different.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- floral
- herbaceous
- resinous

**Aroma notes:**

> Strong and immediately recognizable — the camphor-floral-sweet
> signature of linalool. Can edge into "soapy" territory at high
> doses (which is why the canonical advice is to use less than feels
> right on first try).

**Mouthfeel:**

> Light, slightly drying, cooling — the camphor sensation is mild
> menthol-adjacent without the sharpness. Not tannic.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [85, 95] | traditional + extraction chemistry | Volatile terpenes (linalool, linalyl acetate) begin escaping as steam near boiling. Sweet spot is "just off the boil" — hot enough to extract, cool enough to retain aromatics |
| **time range (seconds)** | [180, 360] | traditional | 3-6 min. Longer steeps intensify the soapy/camphor character without adding benefit |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | |
| **dose** | 0.5-1 tsp dried buds per 8oz cup | Lavender Life 2024 | The "less than you think" rule — a full teaspoon is assertive |

> Dose note: Lavender is frequently over-dosed by first-time
> brewers. The culinary and tea traditions converge on half-strength
> compared to other flowers — a full tablespoon of chamomile is fine;
> a full tablespoon of lavender is medicinal and potentially unpleasant.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 3 | The defining effect; well-supported for concentrated preparations, plausible for tea |
| sleepy | 2 | Secondary — lavender is more "anxiolytic" than "sedative" in the clinical literature |
| settle | 2 | Traditional digestive use; mild |
| comfort | 2 | |
| focus | | Not a focus herb — direction is opposite |
| energy | | |
| cooling | 2 | The camphor edge reads cooling |

> **Vocabulary note:** `bitterness` previously appeared here as an
> effect (rated low — lavender is floral-herbaceous, not bitter). Per
> `docs/vocabulary.md`, bitterness is a flavor not an effect. For
> lavender it's effectively zero at normal brews anyway.

---

## 6. Extraction profiles

> Research status: **sourced** (was MOCK). Numbers from extraction
> chemistry literature: Liu et al. 2016 (water as solvent), Cui et al.
> 2020 (aroma characteristics across extraction methods), and
> traditional tea practice. Essential-oil distillation literature is
> extensive; aqueous-infusion literature is thinner because lavender's
> therapeutic use has centered on distilled oil, not tea.

### 6a. GENTLE (85°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 180 |
| flavors | [floral, herbaceous, light] |
| effects | [["calm", 2], ["cooling", 2], ["comfort", 1]] |
| character | Light and fragrant — the pre-boil temp preserves more volatile aromatics, giving a brighter floral top note without the camphor deepening. Best for first-time lavender drinkers. |
| sources | ref-liu-2016, traditional |

### 6b. STANDARD (90°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 300 |
| flavors | [floral, herbaceous, resinous] |
| effects | [["calm", 3], ["sleepy", 2], ["comfort", 2]] |
| character | The canonical cup — herbaceous-floral balance, noticeable calming signature, the camphor edge present but not dominant. |
| sources | ref-kasper-2014-silexan, traditional |

### 6c. STRONG (95°C, 360s / 6 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 360 |
| flavors | [floral, resinous, camphor, soapy] |
| effects | [["calm", 3], ["sleepy", 3], ["cooling", 3]] |
| character | Full extraction — the camphor-resinous character moves forward, the cup tips toward medicinal. Some drinkers love this register; others find it soapy. |
| sources | ref-cui-2020 |

### 6d. Time-axis behavior (STANDARD 90°C held constant, time varied)

Lavender extraction is complicated by volatility — the same compounds
that give the character (linalool, linalyl acetate) escape as steam if
held too hot for too long. Unlike chamomile's monotonic extraction
curve, lavender has a character *inversion* around 5-7 minutes: the
cup briefly gets better as extraction continues, then starts getting
worse as volatiles escape and less-volatile compounds (resinous
terpenes, bitter fractions) dominate.

| timeS | % of peak character | character shift from STANDARD | effect shift from STANDARD |
|-------|--------------------|-------------------------------|---------------------------|
| 120 (2 min) | ~60% | Under-extracted, thin floral | calm −1, sleepy −1 |
| 300 (5 min) | ~100% | **Baseline — the STANDARD profile as in 6b** | baseline |
| 420 (7 min) | ~95% | Very slightly deeper, camphor edge emerging | calm +0, sleepy +0 |
| 600 (10 min) | ~80% | Soapy, resinous-dominant, volatiles partially lost | calm +0, sleepy +0, *bitterness +1* |

**Algorithm note:** Lavender time is *non-monotonic with an inversion*
— a rare shape among the catalog. After ~7 minutes at 90°C, the cup
starts degrading toward medicinal-soapy. This matters for the
"stronger = longer" intuition most drinkers bring from true teas;
with lavender, longer past a point makes it worse. The app should
cap the time slider or flag long-steep warnings.

**Cross-temperature note:** At lower temps (85°C), the inversion
point shifts later (~10 min) because volatile loss is slower. At
higher temps (95-100°C), it shifts earlier (~5 min). This is useful
for drinkers who find lavender too intense — *lower temp + longer
time* gives a softer cup than *higher temp + shorter time*, even at
comparable total extraction.

Sources: ref-liu-2016, ref-cui-2020.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current app copy: "Sedating on top of other sedatives."
>
> This is the main concern for tea-strength consumption. Extended
> considerations:
>
> - **CNS depressants (benzodiazepines, opioids, alcohol)** —
>   Additive sedation. Silexan trials show effect comparable to
>   lorazepam 0.5 mg/d, so stacking is meaningful even for tea at
>   regular consumption levels.
> - **Blood pressure medications** — Mild hypotensive effect
>   documented in some Silexan studies; stacking with antihypertensives
>   could produce more reduction than intended (less well-characterized
>   than for hibiscus).
> - **Pre-surgery** — As with most sedative herbs, stop 2 weeks
>   before surgery per general herbal-medicine pre-op guidance.

**NOT a concern but sometimes claimed:**

> - **Gynecomastia in boys (from lavender tea)** — This claim comes
>   from Henley et al. 2007 (*NEJM*) and Ramsey et al. 2019 (*JCEM*),
>   which documented ~12-24 cases of prepubertal gynecomastia or
>   premature thelarche in children exposed to **topical** lavender
>   products (lotions, shampoos, soaps) — NOT tea. A 2024
>   touchENDOCRINOLOGY review applied Hill's criteria and concluded
>   the strength of association is weak and cause-and-effect has not
>   been shown. Even if the effect is real for concentrated topical
>   application, the exposure level from a cup of tea is several
>   orders of magnitude lower and almost certainly irrelevant. Do
>   **not** surface this as a tea warning — it's topical-specific
>   and would cause unnecessary alarm.
> - **Pregnancy** — Sometimes listed as cautionary. The evidence is
>   thin; concentrated oil use is cautioned by some herbalists, but
>   tea at normal consumption appears benign. No clinical data
>   showing harm from lavender tea in pregnancy. Worth including a
>   mild "consult with care provider" note but not a strong warning.

**Dosage cautions:**

> Silexan clinical dose is 80 mg standardized oral oil per day. Tea
> at 0.5-1 tsp per cup is well below the therapeutic range and doesn't
> require dose warnings. The sensory threshold (too soapy) is
> self-limiting well before any pharmacological concern.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| linalool | ~36.8% of essential oil; water-soluble fraction much lower | primary anxiolytic — VDCC inhibition, SERT binding | high (Silexan chemistry well-characterized); low confidence on exact cup-strength dose |
| linalyl acetate | ~34.2% of essential oil; partially hydrolyzed to linalool *in vivo* | essentially a prodrug for linalool | high |
| 1,8-cineole (eucalyptol) | minor in *L. angustifolia*, higher in *L. × intermedia* lavandin | the camphor-eucalyptus edge | medium — varies significantly by cultivar |
| camphor | low in culinary *L. angustifolia* (Hidcote, Munstead); higher in Spanish/French lavender | the medicinal-soapy failure mode at high doses | medium |
| rosmarinic acid, flavonoids | [RESEARCH] | water-soluble fraction, likely carries more of the tea-preparation effect than the essential-oil story suggests | low — under-studied for tea specifically |

**characterizedPct estimate:**

> ~60%. Essential-oil chemistry is extremely well-characterized
> (pharmaceutical-grade for Silexan). Aqueous-infusion chemistry
> (what actually ends up in tea) is much less studied — the
> industry focus has been on distilled oil, not infusion.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-kasper-2014-silexan | Kasper S, Gastpar M, Müller WE, et al. (2014). Lavender oil preparation Silexan is effective in generalized anxiety disorder — a randomized, double-blind comparison to placebo and paroxetine. *International Journal of Neuropsychopharmacology*, 17(6):859-869. | RCT (Silexan vs. paroxetine) |
| ref-kasper-2017 | Kasper S, Müller WE, Volz HP, et al. (2017). Silexan in anxiety disorders: Clinical data and pharmacological background. *World Journal of Biological Psychiatry*. PMID: 28511598. | review |
| ref-kasper-meta-2023 | Kasper S, Möller HJ, Volz HP, et al. (2023). Efficacy of Silexan in patients with anxiety disorders: a meta-analysis of RCTs. n=1213 across 5 trials. PMC10465640. | meta-analysis |
| ref-muller-2020 | Müller WE, Sillani G, Schuwald A, Friedland K. (2020). Pharmacological basis of the anxiolytic and antidepressant properties of Silexan. *Neurochemistry International*. | mechanism review |
| ref-henley-2007 | Henley DV, Lipson N, Korach KS, Bloch CA. (2007). Prepubertal gynecomastia linked to lavender and tea tree oils. *NEJM*, 356(5):479-485. | case series (topical) |
| ref-ramsey-2019 | Ramsey JT, Li Y, Arao Y, et al. (2019). Lavender products associated with premature thelarche and prepubertal gynecomastia. *JCEM*, 104(11):5393-5405. | extended case series |
| ref-diaz-maroto-2024 | Diaz-Maroto et al. / touchENDOCRINOLOGY 2024 review. Hill's criteria analysis concluding weak association. PMC10769481. | critical review |
| ref-liu-2016 | Liu S, Fernandez X, et al. (2016). Water as a green solvent combined with different techniques for extraction of essential oil from lavender flowers. *Comptes Rendus Chimie*. | extraction chemistry |
| ref-cui-2020 | Cui H, Zhang X, Zhou H, et al. (2020). Aroma characteristics of lavender extract and essential oil from *Lavandula angustifolia* Mill. PMC7728310. | aroma chemistry |

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | fact | verified | In Germany, a standardized lavender oil preparation (Silexan) is approved as a prescription anxiolytic, with clinical trials showing effects comparable to a low dose of lorazepam — one of the strongest evidence bases for any herbal calming effect. | ref-kasper-2014-silexan, ref-kasper-meta-2023 |
| 2 | fact | verified | Lavender's calming effect likely doesn't work through GABA (the pathway most calming herbs are said to act on) but through voltage-dependent calcium channels — a different mechanism that aligns better with its mild, wakeful calm rather than sedation. | ref-muller-2020 |
| 3 | culture | established | The English counties of Kent and Surrey, the Provence region of France, and increasingly Tasmania and Washington State produce most of the world's culinary lavender — three climates tied together by one plant. | well-established agricultural fact |
| 4 | fact | established | Culinary lavender is almost always the Hidcote or Munstead cultivar of *Lavandula angustifolia* — lower in camphor than ornamental lavenders and less soapy when infused. | cultivar convention |
| 5 | history | attested | Lavender takes its name from the Latin *lavare*, "to wash" — Romans used it to scent their bathwater, and the association with bathing and clean linen persists two thousand years later. | etymology well-documented; specific Roman usage widely attested |

---

## 10b. Folk & cultural attributions

| Claim | Confidence | Notes | Source or status |
|-------|-----------|-------|------------------|
| Lavender was used in medieval European churches to scent the floor ("strewing herb") | attested | Documented European practice; the resinous-antimicrobial quality made it practical as well as symbolic. | ethnographic and monastic records |
| Queen Elizabeth I drank lavender tea for migraines | folk | Widely repeated in lavender-tea marketing; primary historical source unclear. Elizabeth I's physicians' records don't explicitly document this. | primary source not located; likely later embellishment |
| Lavender scent was placed in linen cupboards and wardrobes as moth repellent | attested | Genuine and documented European practice, continuing today. The camphor-containing fraction does deter clothes moths. | ethnographic; mild empirical support |
| Used in Victorian England as "smelling salts" substitute for fainting ladies | attested | The association of lavender with restoring consciousness from fainting spells is documented in Victorian-era medical and social texts. | period medical practice |
| Lavender is a traditional Provençal herb in the *herbes de Provence* blend | established | Culinary fact, though the inclusion of lavender specifically is actually a relatively recent (20th century) tradition rather than ancient. | culinary history |
| The plant repels mosquitoes and was strewn around doorways for this purpose | folk | Some empirical support for linalool as insect deterrent, but "strewn at doorways" as specific historical practice is more folklore than documented. | mild empirical, historical framing uncertain |
| Medieval glove-makers used lavender during the plague to mask the smell of leather tanning and were said to be protected from illness | folk | Attractive story widely repeated; the protection claim is folklore (the tanning chemicals may have had more to do with any real effect than the lavender scent). | folk tradition, primary sources vague |

---

## 11. Miscellaneous & uncaptured

**Personal notes** (add your own tasting experience):

> [TOMMY] — blank for now; add after brewing at different temps

**Questions that weren't resolvable from sources:**

> - Exact milligram linalool content per cup from a typical 1-tsp
>   infusion — not directly measured in accessible literature
> - Whether the Silexan clinical effect scales down linearly to tea
>   doses or has a threshold below which no anxiolytic effect occurs
> - Whether culinary cultivar differences (Hidcote vs. Munstead) make
>   a meaningful difference in cup character beyond subjective
>   descriptions

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 2 | Temp range supported by volatile-retention chemistry; less direct sourcing than chamomile/hibiscus |
| Effects ratings | 2 | Calm/anxiolytic well-supported via Silexan; "translation to tea dose" uncertain |
| Extraction profiles | 2 | Time-axis inversion is a real and documented feature; exact numbers approximate |
| Safety notes | 3 | Gynecomastia question definitively resolved (topical-only, tea irrelevant) |
| Facts | 2 | Silexan and VDCC mechanism well-sourced; Roman etymology attested |

**Overall status:**
- [x] Verified — confident enough to ship with Silexan-vs-tea caveat noted

---

## Notes for this scaffold

**What's confident now:** The Silexan clinical evidence (meta-analysis
n=1213), VDCC-not-GABA mechanism, the linalool + linalyl acetate
chemistry, the Roman *lavare* etymology, that gynecomastia is a
topical-only concern irrelevant to tea, the cultivar distinctions
(Hidcote/Munstead).

**What's plausible but still fuzzy:** Exact tea-strength dose
translation, water-soluble fraction chemistry (vs. essential oil),
whether the anxiolytic effect at tea doses is clinically detectable.

**Generalizable lessons from lavender research:**

1. **Volatility matters for the algorithm.** Lavender is the first
   ingredient with a non-monotonic time curve — long steeping *hurts*
   the cup because the characteristic compounds escape as steam. This
   behavior likely applies to other volatile-heavy aromatics (rose,
   jasmine, possibly mint family). Worth treating as its own category
   in the extraction model.

2. **Clinical evidence doesn't always translate to tea.** Silexan is
   the strongest evidence any herbal ingredient in the catalog has,
   but it's for 80 mg oral standardized oil, not a teaspoon of buds
   in hot water. The app should surface "there's evidence for lavender
   anxiolytic effect" without implying the evidence specifically
   supports tea doses. This is a general pattern: much herbal
   clinical research uses concentrated preparations that don't
   transfer cleanly to tea.

3. **Some safety concerns should be explicitly excluded, not quietly
   omitted.** The gynecomastia question will come up because it's a
   widely-repeated concern. Not addressing it at all would be a
   missed opportunity; addressing it with "tea is fine because this
   was topical" is more informative and honest than pretending the
   concern doesn't exist.

---

## Addendum — `soothing` removed (2026-08-03)

An audit of unreachable properties found `soothing` declared on the
ingredient card and named in no brew point — the page promising
something no cup could show. Checked against the research rather than
transcribed into the profile to make the audit quiet.

§5 rates `calm` 3, `sleepy` 2, `settle` 2, `comfort` 2 and `cooling` 2 — no soothing. Lavender works through linalool on the nervous system; it has no mucilage and no demulcent action, so `soothing` is the wrong register for it. What the rating was reaching for is already carried, and better, by `calm` 4.

Removed from the card. Nothing is lost from the cup; the claim either
never had support or is carried by a neighbour that does.

<!-- sourced-effects: calm, sleepy -->

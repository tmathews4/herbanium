# Ingredient Research — Chamomile

> Auto-populated with known facts as a starting point. Fields marked
> `[RESEARCH]` need verification with real sources before publishing.
> Don't trust anything here that doesn't have a source — this is a
> scaffold, not a finished record.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `chamomile` | matches INGREDIENTS key |
| **display name** | Chamomile | |
| **latin / scientific** | *Matricaria chamomilla* | German chamomile, the annual — what's in nearly all tea |
| **category** | flower | |
| **subcategory** | — | (flowers have no subcategory) |
| **also known as** | German chamomile, Hungarian chamomile, true chamomile | distinguished from Roman chamomile (*Chamaemelum nobile*), a different species |

---

## 2. Overview

**One-line essence** (blurb field):

> Small daisy-like flowers with a rounded, honey-apple sweetness. Long used at the end of the day to soften the edges of a wound evening.

*(current app copy — keep as-is unless research suggests refinement)*

**Short description** (2-3 sentences for ingredient page):

> Chamomile is one of the oldest medicinal plants in Western herbal tradition, valued since antiquity as a gentle calmative and sleep aid. The flower heads contain apigenin, a flavonoid that interacts with the brain's inhibitory neurotransmitter pathways — the exact mechanism is still being worked out, but clinical trials consistently show chamomile tea reduces mild anxiety and promotes sleep. Nearly all "chamomile tea" is made from German chamomile (*Matricaria chamomilla*), an annual; Roman chamomile (*Chamaemelum nobile*) is a different, more bitter species used more often in perfumery than cups.

> **Mechanism note (resolved):** The popular claim that "apigenin binds to the same brain receptors as benzodiazepines" traces to Viola et al. (1995), who found apigenin competitively inhibited flunitrazepam binding at the central benzodiazepine site (Ki = 4 μM) and produced anxiolytic effects in mice. Subsequent work complicated this picture: Avallone et al. (2000) and Zanoli et al. (2000) showed the sedative effect was NOT reversed by flumazenil (the benzodiazepine-site antagonist), and found apigenin's affinity for the BZ site too low (EC50 ~10⁻⁴ M) to explain behavioral effects. Apigenin also *reduces* GABA-evoked currents rather than enhancing them as benzodiazepines do. Losi et al. (2004) suggest sedation may come from effects on NMDA channels instead. Current consensus (e.g. Saadatmand et al. 2024 systematic review): clinical anxiolytic effect is well-established across 9 of 10 RCTs, but mechanism remains "not well understood" — possibly HPA axis modulation, possibly multiple neurotransmitter systems, not a clean benzodiazepine-site story. See refs `ref-viola-1995`, `ref-avallone-2000`, `ref-zanoli-2000`, `ref-losi-2004`, `ref-saadatmand-2024` in section 9.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- honey
- apple
- floral
- hay

*(existing `flavors` field — these are well-established descriptors, confident)*

**Aroma notes:**

> Tracks flavor closely — honey-sweet florality dominates both.

**Mouthfeel:**

> Clean, slightly coating. Not astringent at normal brewing strengths.
> At very long steeps, develops a mild tannic bite.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | [RESEARCH] | Current app value; confirm against German Commission E monograph or similar |
| **time range (seconds)** | [300, 420] | [RESEARCH] | 5-7 minutes is the canonical range — verify |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | Chamomile is caffeine-free, no tea plant content |
| **tsp-to-grams** | — | | Use category default for flowers |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 4 | Well-established in clinical trials; mechanism debated (see section 2). Anxiolytic effect confirmed in 9/10 RCTs per Saadatmand 2024 review |
| sleepy | 3 | Present but secondary to calm; stronger at longer steeps (high-temp apigenin extraction) |
| settle | 3 | Traditional digestive use; mild carminative effect |
| comfort | | [RESEARCH] — possibly 2, consider how users describe a chamomile cup |
| focus | | Not applicable |
| energy | | Not applicable (caffeine-free) |
| cooling | | Not applicable |
| bitterness | 1 | Low at standard brew; can rise to 2 at long hot steeps |

> Existing ratings preserved: [["calm", 4], ["sleepy", 3], ["settle", 3]].
> The `calm` rating has strong clinical trial support. The `sleepy` rating
> is reasonable given traditional use and the sedation observed in animal
> studies at higher apigenin doses (though Avallone 2000 found no
> anxiolytic-only effect — only dose-dependent sedation). `settle` should
> be verified against primary sources during a later digestive-focused
> research pass.

---

## 6. Extraction profiles — the three data points

> These are the MOCK values currently in `src/data/extractionProfiles.js`
> (copied here for the research pass to verify or replace). Do not treat
> as sourced until you've checked the numbers against primary research.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 180 |
| flavors | [RESEARCH] — likely [honey, apple, floral] |
| effects | [RESEARCH] — likely [["calm", 2], ["sleepy", 1]] |
| character | A lighter, more delicate cup — apple and honey up front, minimal bitterness |
| sources | [RESEARCH] |

> Key question: does low-temp chamomile extract meaningful apigenin, or is
> calm effect blunted? Apigenin solubility curves would settle this.

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 300 |
| flavors | [honey, apple, floral, hay] |
| effects | [["calm", 4], ["sleepy", 3], ["settle", 3]] |
| character | The canonical chamomile cup — honeyed sweetness, gentle calm, the one most people recognize |
| sources | [RESEARCH] |

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 420 |
| flavors | [RESEARCH] — likely [honey, hay, floral] with some bitterness creeping in |
| effects | [RESEARCH] — likely stronger sleepy, mild bitterness |
| character | Full extraction — pulls more apigenin but also more tannin; the cup for when you need the sedative effect to land |
| sources | [RESEARCH] |

> The existing `variants` field already captures this intuition:
> sleep-intent = 100°C / 420s, calm-intent = 95°C / 300s. That structure
> should inform the profile numbers — strong profile = sleep variant,
> standard = calm variant.

**Do you need a 4th or 5th data point?** Probably not. Chamomile has a narrow brewing window (85-100°C) and the 3 points cover it evenly. Flag if research suggests otherwise.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current app copy: "Ragweed family — uncommon cross-allergy."
>
> This is correct but incomplete. Commonly documented additional cautions:
>
> - **Blood thinners (warfarin, etc.)** — coumarin content, possible mild
>   additive effect. [RESEARCH] confirm magnitude from primary source;
>   this is widely claimed but often overstated in popular sources.
> - **Pregnancy** — [RESEARCH] mixed evidence; some sources flag higher
>   doses as emmenagogue risk. Traditional use during pregnancy is common
>   in some cultures. Err toward "consult a pharmacist" framing.
> - **Ragweed-family allergy** — genuine cross-reactivity (*Asteraceae*
>   family includes ragweed, daisy, marigold). Most users unaffected;
>   worth naming for the minority who are.

**Dosage cautions:**

> Not typically needed — chamomile is well-tolerated at normal intake.

**NOT a concern but sometimes claimed:**

> [RESEARCH] Check for overstated claims (e.g., any antibiotic
> interaction warnings that don't hold up, "causes drowsiness so don't
> drive" when the effect is mild). Document what to exclude.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| apigenin | [RESEARCH] — often cited 0.5-1.2 mg | calm (mechanism under investigation — possibly via GABA / NMDA / HPA axis, see section 2); ~65% of chamomile's total flavonoid content per McKay & Blumberg 2006 | high for presence and anxiolytic role, medium for mechanism |
| bisabolol | [RESEARCH] | settle, anti-inflammatory | [RESEARCH] |
| chamazulene | [RESEARCH] | anti-inflammatory (topical more than internal) | [RESEARCH] |
| matricin | [RESEARCH] — precursor to chamazulene | | |

> Chamomile is one of the better-studied herbals — compound data should
> be obtainable. Good candidate for populating all these fields with real
> citations. Target confidence: high for apigenin, medium for the rest.

**characterizedPct estimate:**

> [RESEARCH] — likely 60-75% once primary flavonoids and essential oil
> components are documented. The essential oil alone has ~120 identified
> compounds; most at trace levels.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-viola-1995 | Viola H, Wasowski C, Levi de Stein M, Wolfman C, Silveira R, Dajas F, Medina JH, Paladini AC. (1995). Apigenin, a component of *Matricaria recutita* flowers, is a central benzodiazepine receptors-ligand with anxiolytic effects. *Planta Medica*, 61(3):213-216. PMID: 7617761. | journal (primary, mechanism) |
| ref-avallone-2000 | Avallone R, Zanoli P, Puia G, Kleinschnitz M, Schreier P, Baraldi M. (2000). Pharmacological profile of apigenin, a flavonoid isolated from *Matricaria chamomilla*. *Biochemical Pharmacology*, 59(11):1387-1394. PMID: 10751547. | journal (primary, mechanism — contests Viola) |
| ref-zanoli-2000 | Zanoli P, Avallone R, Baraldi M. (2000). Behavioural characterisation of the flavonoids apigenin and chrysin. *Fitoterapia*, 71 Suppl 1:S117-S123. PMID: 10930722. | journal (behavior, mechanism) |
| ref-losi-2004 | Losi G, Puia G, Garzon G, de Vuono MC, Baraldi M. (2004). Apigenin modulates GABAergic and glutamatergic transmission in cultured cortical neurons. *European Journal of Pharmacology*, 502:41-46. | journal (mechanism — NMDA hypothesis) |
| ref-saadatmand-2024 | Saadatmand S, et al. (2024). The effect of oral chamomile on anxiety: A systematic review of clinical trials. *Clinical Nutrition Research*, 13(2):139-147. DOI: 10.7762/cnr.2024.13.2.139. | systematic review (clinical) |
| ref-mao-2016 | Mao JJ, Xie SX, Keefe JR, Soeller I, Li QS, Amsterdam JD. (2016). Long-term chamomile (*Matricaria chamomilla* L.) treatment for generalized anxiety disorder: a randomized clinical trial. *Phytomedicine*, 23:1735-1742. | clinical RCT (long-term GAD) |
| ref-mckay-2006 | McKay DL, Blumberg JB. (2006). A review of the bioactivity and potential health benefits of chamomile tea. *Phytotherapy Research*, 20(7):519-530. | review (apigenin content, flavonoid profile) |
| ref-msk-chamomile | Memorial Sloan Kettering "About Herbs" — Chamomile entry. Available at mskcc.org/cancer-care/integrative-medicine/herbs/chamomile | monograph (clinical, safety) |
| ref-1 | [RESEARCH] — German Commission E monograph on *Matricariae flos* | monograph (traditional use) |
| ref-2 | [RESEARCH] — Hobbs, *Chamomile: Medicinal, Cosmetic, and Agricultural Uses* or similar reference | book |

**Starting points for additional research:**

- PubMed: *Matricaria chamomilla* clinical trials (anxiety, GAD, insomnia) — many more RCTs exist beyond Mao 2016
- German Commission E monograph on *Matricariae flos* (flower) — authoritative for traditional medicinal use and safety
- WHO monograph on medicinal plants, volume 1 (if chamomile is included)
- Culpeper's *Complete Herbal* for historical use (freely available)
- NIH HerbList entry on chamomile — a well-curated summary of the evidence at nccih.nih.gov

---

## 10. Facts for the Steep screen

*(Existing facts preserved; these are pleasant and mostly well-sourced — verify attribution during research.)*

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | history | The Latin name *Matricaria* comes from *matrix*, meaning womb — the Romans used it as a gynecological remedy. | [RESEARCH] verify |
| 2 | history | Ancient Egyptians dedicated chamomile to Ra and used it in the embalming process. | [RESEARCH] verify — this is widely repeated but check primary source |
| 3 | culture | Peter Rabbit's mother gave him chamomile tea after his Mr. McGregor scare — Beatrix Potter knew her folk medicine. | Beatrix Potter, *The Tale of Peter Rabbit*, 1902 |
| 4 | fact | There are actually two main plants called chamomile — German (annual, what's in most tea) and Roman (perennial, more bitter). | well-established botanical fact |
| 5 | fact | Chamomile tea reduces anxiety in clinical trials, but the exact brain mechanism is still being worked out — early papers thought it acted like a mild benzodiazepine, later research found the picture more complicated. | ref-saadatmand-2024, ref-avallone-2000 |

> Fact #5 replaces the earlier "apigenin extracts better at higher temperatures" claim, which is plausible but unsourced. The mechanism-ambiguity fact is honestly more interesting AND properly sourced — it illustrates the "humility of knowledge" principle better than a fake precision claim would.

> Candidate additions to explore during research:
> - Chamomile's use as a "companion plant" in gardens (reportedly improves neighbor plant health; "the plant's physician")
> - Specific placement in European folk medicine for teething infants
> - The *chamaemelon* Greek etymology — "earth apple," for the scent of the crushed leaves

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> - Chamomile was sacred to the sun gods in several ancient pantheons (Ra in Egypt, possibly associated with Apollo-like figures in Greece via the solar-yellow center of the flower).
> - The name *chamaemelon* is Greek for "earth apple" — the scent of crushed chamomile leaves is genuinely apple-like, which is where the name comes from.
> - Traditional folk name "the plant's physician" in European gardening lore — reputed to improve the health of neighboring plants. [RESEARCH] verify; may be folk belief without empirical backing.
> - Chamomile has been found in archaeological sites dating back to the Bronze Age; cultivation is ancient.

**Personal notes** (add your own tasting experience if/when you brew):

> [TOMMY] — blank for now; add after next actual cup

**Questions that weren't resolvable from sources:**

> [RESEARCH] Document gaps here as they emerge. Expected candidates:
> - Precise apigenin mg/cup (varies by flower quality and extraction; may need a range rather than a point estimate)
> - Whether the "blood thinner interaction" warning is supported at normal tea-consumption doses or only at high supplement doses
> - Historical accuracy of the Egyptian embalming claim (widely repeated but primary source unclear)

---

## 12. Confidence self-assessment

> Fill in after research is complete. Starting-scaffold values left blank.

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters (temp/time) | 1 | app defaults, not independently verified against monograph |
| Effects ratings | 2 (calm, sleepy); 1 (settle) | `calm` and `sleepy` now supported by clinical literature via Saadatmand 2024 review and Viola/Avallone primary sources; `settle` still resting on traditional-use sourcing |
| Extraction profiles (3 points) | 0 | still MOCK |
| Safety notes | 1 | ragweed cross-allergy is solid; blood-thinner and pregnancy notes still need verification |
| Facts | 2 (botanical distinction, Peter Rabbit); 0-1 (Matricaria etymology, Egyptian); 2 (mechanism fact) | mixed — the new mechanism fact is well-sourced, others still need check |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified — confident enough to ship
- [ ] Flagged — specific issues noted in open questions

---

## Notes for this scaffold

- **What's confident now (post-mechanism-research):** Identity, caffeine = 0, ragweed cross-allergy, basic flavor tags, the clinical anxiolytic effect (backed by Saadatmand 2024 systematic review of 10 RCTs), the mechanism-is-debated narrative (backed by Viola 1995, Avallone 2000, Zanoli 2000, Losi 2004), the German/Roman species distinction, the Peter Rabbit reference.
- **What's plausible but still unsourced:** Specific temp/time values, the exact effect magnitudes (directionally right, numerically unverified), compound-level chemistry mg/cup numbers, Egyptian embalming claim, Matricaria/womb etymology.
- **What's outright missing:** Primary sources for the monograph-level claims (German Commission E, WHO), the historical facts beyond Peter Rabbit, the extraction-profile data points at 75/95/100°C.

**Generalizable lesson for other ingredients:** The apigenin research showed that when a popular claim is widely repeated with a single well-known source (Viola 1995), it often has a more complicated story hiding in the follow-up literature. Worth repeating this "find the follow-up papers" step for any other mechanism claim during research — especially lavender (linalool / GABA), passionflower (GABA-related), and lemon balm (GABA transaminase). A primary source being real doesn't mean the simple story it tells is still current consensus.

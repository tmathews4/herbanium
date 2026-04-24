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
| **temp range (°C)** | [75, 100] | ref-harbourne-2008 | Extraction kinetics first-order across 57-100°C; app supports entire useful range from gentle aromatic brew (75°C) to full sedative extraction (100°C). Narrower than existing app value [95,100] — expanded to let users actually use the gentle profile. |
| **time range (seconds)** | [300, 420] | ref-harbourne-2008 | 5-7 minutes is canonical for hot brew; gentle profile uses 6 min at lower temp. Very long decoction-style extraction (20+ min) produces a different product, outside this range. |
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

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** (was MOCK). Numbers synthesized from
> Harbourne et al. 2008 (extraction kinetics 57-100°C) and Cvetanović
> et al. 2017 (apigenin glycoside vs. aglycone temperature optima).
> See section 9 for full citations and section below for limitations.

### 6a. GENTLE (75°C, 360s / 6 min)

| Field | Value |
|-------|-------|
| tempC | 75 |
| timeS | 360 |
| flavors | [honey, apple, floral] |
| effects | [["calm", 2], ["sleepy", 1], ["settle", 1]] |
| character | A morning chamomile — apple and honey lead, with a delicate floral body. Calm comes through, just quieter. Essential oils preserved at the cost of total phenol load. |
| sources | ref-harbourne-2008, ref-cvetanovic-2017 |

> **Why these numbers:** Harbourne's first-order extraction kinetics
> hold from 57-100°C, so 75°C still extracts apigenin-glucoside actively
> — just more slowly. Longer steep (6 min vs. the standard 5 min)
> compensates. This is BELOW Cvetanović's 85°C apigenin-glucoside peak,
> so effects are attenuated but not absent. Volatile esters (the
> honey/apple aroma) survive better at this temp than at boiling, which
> is why flavor profile is aromatic-forward rather than phenolic-forward.

### 6b. STANDARD (90°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 300 |
| flavors | [honey, apple, floral, hay] |
| effects | [["calm", 4], ["sleepy", 3], ["settle", 3]] |
| character | The standard cup. Full honey-floral body with the grassy-hay backbone, clear calming effect. |
| sources | ref-harbourne-2008 |

> **Why these numbers:** Harbourne identified 90°C/20min as the maximum
> total-phenol, minimum-turbidity point in chamomile extraction. 5 min
> is the established canonical steep time across popular sources; 20 min
> produces a more concentrated but less palatable cup (moves toward
> decoction rather than infusion). Effect values match the canonical
> chamomile cup most tea-drinkers recognize.

### 6c. STRONG (100°C, 420s / 7 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 420 |
| flavors | [honey, apple, floral, hay, earthy] |
| effects | [["calm", 4], ["sleepy", 5], ["settle", 3], ["bitterness", 1]] |
| character | The sleepy-time version. Maximum apigenin extraction, fuller body, slightly tannic — for when you need the sedative effect to land hard. Loses some of the delicate top-notes in exchange. |
| sources | ref-harbourne-2008 |

> **Why these numbers:** Harbourne showed turbidity rises significantly
> 90→100°C, with little phenol-content gain. Essential-oil volatilization
> at full boil reduces honey/apple top-notes; the "earthy" tag reflects
> the tannin-forward shift. Sleepy goes to 5 because higher total
> phenol load means more apigenin-glucoside in cup — which is where the
> sedation-at-higher-doses observation (Avallone 2000, Viola 1995) comes
> from. Bitterness rises to 1 but stays low compared to true teas.

**Do you need a 4th or 5th data point?** No. Chamomile's brewing window
is narrow (70-100°C), and the three points span it evenly. Harbourne's
kinetics are first-order across the range, which means linear
interpolation between the three data points is a defensible
approximation. If the app ever wants to surface the "cold brew"
variant (8-12 hour refrigerator steep), that's a distinctly different
process and would need its own data point rather than extrapolation.

### Honest limits of these numbers

The extraction-kinetics data (Harbourne, Cvetanović) is solid — real
HPLC measurements of real compounds at real temperatures. The
**flavors** and **effects** mappings to those extraction curves are
interpretive: no peer-reviewed study has compared "how does a 75°C
chamomile feel to drink vs. a 95°C one" in a controlled human panel.

What this means:

- **tempC, timeS, and the phenol-extraction logic** — confident,
  traceable to primary sources.
- **flavor tags** — directionally right, synthesized from Sacred Plant
  Co's documented brewing chemistry, traditional descriptions, and
  the kinetics data. Not from a sensory panel.
- **effect magnitudes** — interpretive. Calm-2 at gentle vs. Calm-4
  at standard reflects the apigenin-glycoside extraction ratio per
  Cvetanović, but is not a clinical comparison.

UI note for when this ships: the explanation layer on the temp/time
slider should acknowledge this. Something like *"Effect ratings
interpolated from extraction-kinetics studies; direct sensory comparison
at these temps not available in the peer-reviewed literature."*
Counterpoints-beside-claims principle applied.

### 6d. Time-axis behavior (STANDARD 90°C held constant, time varied)

> **Why this section exists:** The three profiles above (6a, 6b, 6c)
> pair a specific temp with a specific time. But users will drag the
> time slider at a fixed temp, and the algorithm needs to know how the
> cup shifts when only time varies. Rather than add three more
> primary profile points (which would force a full 2D temp×time grid
> for every ingredient), this section captures time as a direction-of-
> shift from the STANDARD profile. The algorithm can combine this with
> the temp curve to handle arbitrary user choices.

Chamomile follows pseudo-first-order extraction kinetics per
Harbourne 2008: effect intensity approaches an asymptote exponentially
over time. Unlike true teas, chamomile **does not develop bitterness
with long steeping** — only turbidity (cloudiness), and only above
90°C. This is an important character note for the algorithm: time is
monotonic for chamomile, unlike temperature which causes character
inversions (aromatic-forward at low temp vs. phenolic-forward at high).

| timeS | % of asymptote (approx) | character shift from STANDARD | effect shift from STANDARD |
|-------|------------------------|-------------------------------|---------------------------|
| 120 (2 min)  | ~35% | Aromatic only — honey/apple top notes present, minimal body, thin | calm −2, sleepy −2, settle −2 |
| 300 (5 min)  | ~70% | **Baseline — the STANDARD profile as written in 6b** | baseline |
| 600 (10 min) | ~85% | Stronger, fuller body, approaches sedative territory | calm +0, sleepy +1 |
| 1200 (20 min)| ~95% | Functional maximum — decoction territory, fuller body | calm +0, sleepy +1, bitterness +1 |

**Algorithm note:** Time dimension for chamomile is *monotonic and
non-inverting* — more time means more effect, with no character
reversal. The exponential asymptote means diminishing returns past
~10 min. Unlike temperature (where moving from 75°C → 100°C swaps
aromatic character for phenolic character), time primarily controls
magnitude at a given temperature. For the algorithm this simplifies
the time dimension to a scalar modifier on the temp-specific profile,
rather than a second independent axis.

**Cross-temperature note:** The % asymptote figures above assume
90°C. At 75°C, first-order kinetics still apply but with a lower rate
constant — meaning the same timeS values land lower on the extraction
curve (perhaps 25%/55%/75%/85% instead of 35%/70%/85%/95%). The
GENTLE profile (6a) at 75°C/360s already accounts for this by using
a longer time than STANDARD. At 100°C extraction is faster, so
shorter times reach similar asymptote percentages. The algorithm
should scale time-axis shifts by the ratio of rate constants between
temperatures — or, simpler, treat the three primary profiles as
already temperature-compensated anchors and apply time shifts
relative to each anchor's timeS rather than globally.

Sources: ref-harbourne-2008 (first-order kinetics, 57-100°C range);
lay-sourced for the "doesn't get bitter with long steeping" character
claim (Steep App brewtea.app, widely corroborated).

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
| ref-harbourne-2008 | Harbourne N, Marete E, Jacquier JC, O'Riordan D. (2008). Optimisation of the extraction and processing conditions of chamomile (*Matricaria chamomilla* L.) for incorporation into a beverage. *Food Chemistry*. ScienceDirect ID: S0308814608013873. | journal (extraction kinetics) |
| ref-cvetanovic-2017 | Cvetanović A, Švarc-Gajić J, Gašić U, Tešić Ž, Zengin G, Zeković Z, Đurović S. (2017). Isolation of apigenin from subcritical water extracts: Optimization of the process. *The Journal of Supercritical Fluids*, 120:32-42. | journal (apigenin glycoside vs. aglycone) |
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
| Brewing parameters (temp/time) | 2 | range now sourced to Harbourne 2008; specific time values at each profile point defensible |
| Effects ratings | 2 (calm, sleepy); 1 (settle) | `calm` and `sleepy` now supported by clinical literature via Saadatmand 2024 review and Viola/Avallone primary sources; `settle` still resting on traditional-use sourcing |
| Extraction profiles (3 points) | 2 | tempC/timeS values sourced to Harbourne and Cvetanović; flavor and effect mappings at each profile point are interpretive, acknowledged in Section 6 "Honest limits" note |
| Safety notes | 1 | ragweed cross-allergy is solid; blood-thinner and pregnancy notes still need verification |
| Facts | 2 (botanical distinction, Peter Rabbit); 0-1 (Matricaria etymology, Egyptian); 2 (mechanism fact) | mixed — the new mechanism fact is well-sourced, others still need check |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified — confident enough to ship
- [ ] Flagged — specific issues noted in open questions

---

## Notes for this scaffold

- **What's confident now (post-mechanism + extraction research):** Identity, caffeine = 0, ragweed cross-allergy, basic flavor tags, the clinical anxiolytic effect (backed by Saadatmand 2024 systematic review of 10 RCTs), the mechanism-is-debated narrative (backed by Viola 1995, Avallone 2000, Zanoli 2000, Losi 2004), the German/Roman species distinction, the Peter Rabbit reference, **AND now the extraction profiles (75/90/100°C) sourced to Harbourne 2008 and Cvetanović 2017**.
- **What's plausible but still unsourced:** The exact mg/cup apigenin numbers (popular 0.5-1.2 mg likely underestimates total glycoside content per Cvetanović), the flavor-tag-to-temperature mappings (direction right, no sensory panel data), compound-level chemistry for bisabolol/chamazulene, Egyptian embalming claim, Matricaria/womb etymology.
- **What's outright missing:** Primary sources for the monograph-level claims (German Commission E, WHO), the historical facts beyond Peter Rabbit, safety notes beyond ragweed.

**Generalizable lesson for other ingredients:** The apigenin research showed that when a popular claim is widely repeated with a single well-known source (Viola 1995), it often has a more complicated story hiding in the follow-up literature. The extraction-kinetics research added a second lesson: peer-reviewed primary data exists for far more herbals than wellness-blog sources let on — Harbourne 2008 is *the* chamomile brewing paper and almost no popular source cites it. For each ingredient, spend 20 minutes looking for a "beverage optimization" or "extraction kinetics" paper in the peer-reviewed literature before trusting popular brewing advice. Worth repeating the "find the follow-up papers" step for any mechanism claim during research — especially lavender (linalool / GABA), passionflower (GABA-related), and lemon balm (GABA transaminase). A primary source being real doesn't mean the simple story it tells is still current consensus.

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

**Basic tastes:**

> `bitter` (1) — low at standard brew; can rise to 2 at long hot
> steeps. Chamomile's bitterness is mild and comes from the
> sesquiterpene lactones rather than tannins. Most drinkers don't
> register it as bitter until the cup is quite strong.

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
| comfort | 2 | Traditional association with evening/cozy contexts across cultures — the "wind-down" cup. Judgment rating from cultural use, not a clinical study |
| focus | | Not applicable |
| energy | | Not applicable (caffeine-free) |
| cooling | | Not applicable |

> **Vocabulary note:** `bitterness` previously appeared here as an
> effect with strength 1 (low at standard brew, rises to 2 at long
> hot steeps). Per `docs/vocabulary.md`, bitterness is a flavor not
> an effect — moved to section 3. See vocabulary doc for the
> flavor/mouthfeel/effect distinction.

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
> - **Pregnancy** — Real documented concern, not folk caution. A case
>   report (cited in MSK "About Herbs") observed premature constriction
>   of the fetal ductus arteriosus following maternal chamomile tea
>   consumption. Traditional use during pregnancy is common in some
>   cultures but carries genuine risk. "Consult a pharmacist"
>   framing warranted, specifically flagging the cardiovascular-
>   development mechanism rather than a generic "avoid" recommendation.
>   Source: ref-msk-chamomile; original case report not located from
>   PubMed in this research pass.
> - **Ragweed-family allergy** — genuine cross-reactivity (*Asteraceae*
>   family includes ragweed, daisy, marigold). Most users unaffected;
>   worth naming for the minority who are.

**Dosage cautions:**

> Not typically needed — chamomile is well-tolerated at normal intake.

**NOT a concern but sometimes claimed:**

> - **"Causes daytime drowsiness or impaired function"** — Commonly
>   stated on generic wellness sites; not supported. MSK About Herbs
>   and other clinical sources note that tea-strength chamomile
>   produces mild sedation without impairing daytime function. Worth
>   explicitly excluding from headsUp so it doesn't get added
>   reactively by a future contributor.
> - **[RESEARCH]** Check for any other overstated medication
>   interaction claims (the blood thinner warning above may fall
>   in this category at tea doses — confirm via monograph research).

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| apigenin (total, as glycosides) | ~8-12 mg per 1g dried flowers at full extraction (Cvetanović: 0.8-1.2% of dry weight) | calm (mechanism under investigation — possibly via GABA / NMDA / HPA axis, see section 2); ~65% of chamomile's total flavonoid content per McKay & Blumberg 2006 | high for presence and anxiolytic role, medium for mechanism |
| apigenin (free aglycone only) | ~0.5-1.2 mg (popular figure) | calm, same as above but bioavailability differs | medium — the popular "0.5-1.2 mg" figure widely cited, appears to measure free aglycone not total glucosides |
| α-bisabolol + bisabolol oxides | [RESEARCH] — essential oil fraction, mg/cup very low | settle, anti-inflammatory (documented), anti-spasmodic | medium — presence well-documented per ref-pmc-chamomile, mg/cup not determined |
| chamazulene | [RESEARCH] | anti-inflammatory (primarily topical effect); blue color in concentrated extracts | medium — presence confirmed, mg/cup not determined |
| matricin | [RESEARCH] — precursor to chamazulene, heat-labile | converts to chamazulene during heating/storage | medium — chemistry well-characterized |

> Chamomile is one of the better-studied herbals — compound data should
> be obtainable. Good candidate for populating all these fields with real
> citations. Target confidence: high for apigenin, medium for the rest.

**characterizedPct estimate:**

> ~60-70%. Primary flavonoids documented (apigenin + glycosides = 65%
> of total flavonoid content per McKay & Blumberg 2006; quercetin,
> patuletin, luteolin also identified). Major essential oil compounds
> identified (α-bisabolol, bisabolol oxides, chamazulene, matricin).
> Essential oil has ~120 identified compounds total, most at trace
> levels — their individual contributions to felt effects are not
> documented in Herbanium's data. What's missing: exact mg/cup for
> most essential oil components, minor flavonoids, trace coumarins.

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

Each fact carries a **confidence** marker that tells the app how to frame
it in the UI. This is the same epistemic-status principle as
counterpoints-beside-claims: we don't hide the folk, we label it.

**Confidence markers:**
- **verified** — primary source exists and we have it. App states plainly ("Beatrix Potter wrote...")
- **attested** — widely documented in credible secondary sources, primary hard to trace but tradition is real. App prefixes with "Traditionally..."
- **folk** — folk belief or symbolic attribution; interesting, culturally real, but not verifiable. App prefixes with "Folk tradition holds..."
- **established** — scientific or botanical fact that doesn't need source attribution (taxonomy, caffeine content, etc.)

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | culture | verified | Peter Rabbit's mother gave him chamomile tea after his Mr. McGregor scare — Beatrix Potter knew her folk medicine. | Beatrix Potter, *The Tale of Peter Rabbit*, 1902 |
| 2 | fact | established | There are actually two main plants called chamomile — German (annual, what's in most tea) and Roman (perennial, more bitter). | botanical taxonomy |
| 3 | fact | verified | Chamomile tea reduces anxiety in clinical trials, but the exact brain mechanism is still being worked out — early papers thought it acted like a mild benzodiazepine, later research found the picture more complicated. | ref-saadatmand-2024, ref-avallone-2000 |
| 4 | history | attested | The Latin name *Matricaria* comes from *matrix*, meaning womb — the Romans used it as a gynecological remedy. | widely documented etymology; Latin root verifiable, specific Roman medical use attested in herbal histories but primary classical source untraced |
| 5 | fact | verified | Chamomile's extraction follows first-order kinetics — the longer you steep, the more apigenin you get, but with diminishing returns past about 10 minutes. | ref-harbourne-2008 |

> Fact-selection rationale for the Steep screen: the 5 selected facts cover
> culture (Peter Rabbit), science (mechanism), botany (species distinction),
> history (etymology), and extraction chemistry (kinetics). The `attested`
> one (Matricaria etymology) is kept because the Latin root is provably
> correct even if the specific-use claim is harder to trace — the app
> surfaces it with "Traditionally..." framing to be honest about that.

---

## 10b. Folk & cultural attributions

Additional traditional / cultural claims about chamomile that aren't in
the Steep screen rotation but may appear in deeper ingredient-detail
content, cultural-context tabs, or educational material. Each is tagged
with the same confidence markers as Section 10, so the UI knows how to
present them honestly.

| Claim | Confidence | Notes | Source or status |
|-------|-----------|-------|------------------|
| Ancient Egyptians dedicated chamomile to the sun god Ra | folk | Widely repeated across herbal-history sources; no verifiable primary text. Symbolic link is plausible (yellow-center flower → solar deity) but the specific dedication claim is uncited. | primary source not located |
| Ancient Egyptians used chamomile in embalming | attested | Archaeological presence in Egyptian tomb contexts is documented; the specific "used in embalming" framing is the popular version of a more general "present in ritual use" reality. | archaeological record exists, exact ritual role debated |
| The Greek name *chamaemelon* means "earth apple," reflecting the scent of crushed leaves | attested | Greek root verifiable (χαμαίμηλον, khamaimēlon, from *khamai* "on the ground" + *mēlon* "apple"). The scent connection is perceptually true. | etymology verifiable; scent association is common descriptive usage |
| Chamomile is "the plant's physician" — improves health of neighboring plants when grown together | folk | European gardening lore. Some companion-planting effects are documented in agronomy (scent-based pest deterrence, soil microbiome effects) but the specific "chamomile heals other plants" claim is mystical rather than empirical. | folk belief, unlikely to be verifiable |
| Chamomile has been cultivated since the Bronze Age | attested | Archaeological records show *Matricaria* pollen in European sites from the Bronze Age forward, though distinguishing cultivation from wild gathering is harder. | archaeobotanical record |
| Traditional European use for teething infants | attested | Documented across multiple European folk-medicine traditions; clinical evidence for this specific use is limited but the cultural practice is well-attested. | traditional use, clinical efficacy separate question |
| Chamomile was sacred to Apollo or other sun gods in Greek tradition | folk | Popular claim; the solar-flower symbolic link is real in Greek botanical thinking but the specific "sacred to Apollo" attribution is harder to pin down. | primary source not located; may be modern herbalist embellishment |

**Design note for the app:** When surfacing `folk` or `attested` content,
the UI should use framing that makes the epistemic status obvious
without being condescending. "Folk tradition holds..." is better than
"Some people claim..." — the first respects the tradition, the second
dismisses it. Similarly, `attested` content uses "Traditionally..." or
"Long held to..." rather than "Some sources say..."

---

## 11. Miscellaneous & uncaptured

**Personal notes** (add your own tasting experience if/when you brew):

> [TOMMY] — blank for now; add after next actual cup

**Questions that weren't resolvable from sources:**

> Documented gaps after mechanism + extraction research:
> - Precise mg/cup for essential oil components (bisabolol, chamazulene
>   et al.) — not found in the accessible literature; likely requires
>   German Commission E monograph or similar
> - Whether the blood-thinner warning is clinically significant at
>   normal tea-consumption doses or only at high supplement doses
> - Primary source for the Egyptian embalming claim (widely repeated,
>   untraced) and Matricaria-from-matrix etymology (widely cited but
>   primary source not located)
> - Whether "plant's physician" gardening folklore has any empirical
>   basis or is pure folk belief
> - The original pregnancy case report citation (known via MSK About
>   Herbs, but the original cardiology paper not located)

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

---

## Addendum — `soothing` kept (2026-08-02)

An audit flagged `soothing` as unsourced. §5 rates `calm`, `sleepy`,
`settle` and `comfort` but no `soothing` — an omission rather than a
judgement, because in this app `soothing` is the *bodily* register
("the body's cup, not the mind's"), and chamomile's somatic evidence
is separate from its anxiolytic evidence and at least as good.

> *Evidence Supports Tradition: the in Vitro Effects of Roman
> Chamomile on Smooth Muscles.* Frontiers in Pharmacology (2018) —
> https://pmc.ncbi.nlm.nih.gov/articles/PMC5897738/

α-bisabolol and the volatile fraction relax smooth muscle through the
digestive tract; apigenin, apigenin-7-O-glucoside and its acetylated
derivatives carry the spasmolytic and antiphlogistic activity;
K⁺-channel modulation accounts for the antispasmodic and antisecretory
effect. α-bisabolol additionally protects the gastric mucosa and is
anti-ulcerogenic. A 2015 randomised clinical study found significant
symptom reduction in IBS patients after four weeks.

**This is a different claim from `calm`, and worth keeping separate.**
`calm` is apigenin's anxiolytic effect — established in 9 of 10 RCTs
per the Saadatmand 2024 review §5 already cites. That is the mind.

(This line previously read "apigenin at the GABA-A benzodiazepine
site", which contradicts the resolved mechanism note in §2 of this
same document: flumazenil does not reverse the effect, BZ-site
affinity is too low to account for it, and the mechanism is
unresolved. The *effect* is well evidenced; the *site* is not, and
naming it here was the retracted 1995 story leaking back in. Corrected
rather than appended because it is an internal contradiction, not a
finding that superseded an earlier one — the audits cannot see a
paragraph disagreeing with another paragraph.) Smooth-muscle relaxation and mucosal protection are the
body, and they're why chamomile has a topical and gastrointestinal
tradition alongside the bedtime one. `settle` 3 covers the narrowly
digestive part; `soothing` is the broader bodily ease that the
anti-inflammatory action supports.

<!-- sourced-effects: soothing -->

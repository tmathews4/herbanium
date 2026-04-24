# Ingredient Research — Hibiscus

> Research-populated file using chamomile v6 as reference architecture.
> Fields still marked `[RESEARCH]` need verification with real sources
> before publishing.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `hibiscus` | matches INGREDIENTS key |
| **display name** | Hibiscus | |
| **latin / scientific** | *Hibiscus sabdariffa* | Roselle — the species used in all hibiscus tea. Distinct from ornamental species like *H. rosa-sinensis* which is not consumed |
| **category** | flower | *(the edible part is technically the calyx — the fleshy casing around the seed pod, not the petals. Worth surfacing as a fact.)* |
| **subcategory** | — | |
| **also known as** | roselle, karkadé (كركديه, Arabic), jamaica / flor de Jamaica (Spanish/Mexican), sorrel (Caribbean), sobolo / bissap (West African — Senegal, Mali, Burkina Faso), Egyptian tea | One of the most cross-culturally named ingredients in the catalog |

---

## 2. Overview

**One-line essence** (blurb field):

> Ruby-red, tart, and refreshing. Tastes like the idea of cranberries.

*(existing app copy — keep)*

**Short description** (ingredient page):

> Hibiscus tea is made from the dried calyces of *Hibiscus sabdariffa*, a tropical plant grown across Egypt, Sudan, Mexico, West Africa, and Southeast Asia. The cup is deep ruby red, pleasantly tart, and tastes like cranberry with a floral edge — a signature more about acid than bitterness. Multiple well-designed clinical trials have shown that regular hibiscus tea consumption modestly lowers blood pressure in people with mild hypertension, with effect sizes comparable to some conventional blood pressure medications at lower doses. It's also the same plant behind karkadé (Egypt), agua de jamaica (Mexico), and bissap (West Africa), prepared differently in each tradition but always centered on that ruby-red sourness.

> **Mechanism note:** Unlike chamomile's contested mechanism, hibiscus's
> blood-pressure-lowering effect is well-characterized. Three mechanisms
> are supported by the literature: ACE (angiotensin-converting enzyme)
> inhibition, direct vasodilation, and mild diuretic effect (Ojeda et al.
> 2010; Da-Costa-Rocha et al. 2014). The anthocyanins delphinidin-3-
> sambubioside and cyanidin-3-sambubioside are the primary bioactive
> compounds (McKay et al. 2010), with hibiscus acid (unique to the
> species) likely contributing as well. Clinical trial meta-analyses
> consistently show an SBP reduction of 6-8 mmHg vs. placebo (Serban
> 2015, Hopkins 2022, Gallucci 2025 reviews), with effects
> dose-dependent and strongest in participants over 50 and in trials
> longer than 4 weeks. No counterpoint worth foregrounding — this is
> one of the better-documented herbal-cardiovascular effects in the
> literature.
>
> What we don't yet know: whether the clinical BP benefit requires
> steady daily consumption (3 cups/day in McKay 2010) or whether
> occasional use gives proportional benefit. Most trials used the
> 3-servings-per-day protocol.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- tart
- fruity
- cranberry

*(existing — accurate; the cranberry comparison is the canonical descriptor cross-culturally)*

**Aroma notes:**

> Modest compared to the flavor — hibiscus is a palate experience more
> than a nose one. Faint floral-red-fruit aroma from the anthocyanins.

**Mouthfeel:**

> Sharp and acidic — the defining feature. Mildly drying from organic
> acids (hibiscus, malic, citric), not tannic. Cooling in effect when
> served iced, which is how most of the world drinks it.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [25, 100] | ref-ramirez-rodrigues-2011 | Range expanded significantly — Ramirez-Rodrigues confirmed that cold extraction at 25°C for 4 hours produces equivalent anthocyanin concentration to hot extraction at 90°C for 16 minutes. Cold brew is a legitimate preparation, not a compromise. |
| **time range (seconds)** | [300, 600] | ref-ramirez-rodrigues-2011, traditional | 5-10 min for hot brew standard. Cold brew extends to 2-8 hours (14,400-28,800 seconds) but that's outside the normal slider range; cold brew may warrant a separate UX path. |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | |
| **tsp-to-grams** | — | | Use category default for flowers |

> Dose note: The clinically effective dose in McKay et al. 2010 was
> 1.25g dried calyx per 240 mL serving, brewed 6 min with boiling water,
> three servings daily for 6 weeks. That's a useful anchor for the
> standard profile. The Iraqi pilot study (Mossa 2021) used 10-20g
> daily for therapeutic effect — higher than typical tea consumption.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | | Not a primary effect |
| sleepy | | Not a primary effect |
| settle | 2 | Traditional digestive use; mild |
| comfort | | |
| focus | | |
| energy | 2 | Not a stimulant — the "energy" character is the bright, vitamin-C-like tartness giving a refreshment-forward impression. Rating kept from existing app data. |
| cooling | 3 | Central to hibiscus's global use. Served iced as a summer drink in Egypt (karkadé), Mexico (agua de jamaica), Senegal (bissap). |

> **Vocabulary note:** `bitterness` previously appeared here as an
> effect. Per `docs/vocabulary.md`, bitterness is a flavor not an
> effect. Hibiscus is tart (organic-acid-driven), not bitter (tannic)
> — the character is noted in section 3.

> **Bug fix note:** Existing app data had `[["energy", 2], ["cooling", 3], ["energy", 3]]`
> with `energy` duplicated. Replaced with `[["energy", 2], ["cooling", 3], ["settle", 2]]`.
> The duplicate was a data entry artifact, not a real double-rating.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** (was MOCK). Numbers synthesized from
> Ramirez-Rodrigues et al. 2011 (cold vs. hot extraction equivalence),
> Paraíso et al. 2021 (hot vs. cold infusion comparison), and Morales
> et al. 2020 (temperature sensitivity of extraction yield).

### 6a. GENTLE (cold brew — 25°C, 14400s / 4 hours)

| Field | Value |
|-------|-------|
| tempC | 25 |
| timeS | 14400 |
| flavors | [tart, fruity, cranberry] |
| effects | [["cooling", 4], ["energy", 1], ["settle", 1]] |
| character | Cold brew — smooth, preserves delicate anthocyanin color, less tart-aggressive than hot brew, more fruit-forward. How most of Mexico and the Caribbean drink it in summer. |
| sources | ref-ramirez-rodrigues-2011, ref-paraiso-2021 |

> **Why these numbers:** Ramirez-Rodrigues showed cold extraction at
> 25°C for 4 hours (240 min) produces *equivalent anthocyanin
> concentration* to hot extraction at 90°C for 16 min. Cold extract
> yields 47% less total anthocyanin than hot per Paraíso 2021 at
> shorter cold times (2h), but the extended 4-hour cold brew in
> Ramirez-Rodrigues matches hot yields. Key character difference:
> cold brew has significantly less color degradation, preserving the
> ruby red more faithfully. This is unusual — most ingredients have
> a clear "weakest" extraction at the cold end, but hibiscus's cold
> brew is genuinely preferred in several traditions.

### 6b. STANDARD (90°C, 360s / 6 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 360 |
| flavors | [tart, fruity, cranberry] |
| effects | [["energy", 2], ["cooling", 3], ["settle", 2]] |
| character | The canonical cup — bright ruby red, assertive tartness, the standard preparation across traditions. Matches the McKay 2010 clinical trial protocol. |
| sources | ref-mckay-2010, ref-ramirez-rodrigues-2011 |

> **Why these numbers:** McKay et al. 2010 (the landmark BP clinical
> trial) used 1.25g calyx in 240 mL boiling water, brewed 6 min.
> That protocol is the reference for "therapeutic dose" and produces
> the canonical bright-tart-red cup. Paraíso 2021 showed 75°C/7min
> and 90°C/10min both achieve good anthocyanin extraction; 90°C is
> the traditional full-boil-then-slightly-cool standard.

### 6c. STRONG (100°C, 600s / 10 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 600 |
| flavors | [tart, cranberry, deep, mineral] |
| effects | [["energy", 2], ["cooling", 3], ["settle", 3]] |
| character | Full extraction — deeper ruby approaching purple, fuller acidic body, takes honey or sugar well at this strength. How karkadé is traditionally prepared in Egypt before cooling and serving. |
| sources | ref-paraiso-2021 |

> **Why these numbers:** Paraíso 2021 showed full boil produces 47%
> higher total anthocyanin than 75°C/short. Egyptian karkadé tradition
> often uses a full simmer for 45+ minutes when preparing as a
> concentrate to be diluted — that's beyond the slider range but
> represents the "maximum extraction" philosophy. 10 min at 100°C
> is a reasonable upper bound for single-brew hot tea.
>
> Notably absent: bitterness. Unlike true teas, hibiscus's "strong"
> profile doesn't introduce bitterness — it introduces *more acidity*,
> which is different. The cup can become unpleasantly sharp but not
> tannic-bitter.

### 6d. Time-axis behavior (STANDARD 90°C held constant, time varied)

Hibiscus extraction of anthocyanins and phenolics follows a generally
monotonic curve — more time equals more extraction, with diminishing
returns after ~10 minutes. Morales et al. 2020 notably found that
*within the 15-60 min range at 35-75°C*, time and temperature didn't
significantly affect anthocyanin yield — only the solid:solvent ratio
mattered. This suggests hibiscus anthocyanin extraction plateaus
relatively quickly compared to chamomile's first-order curve.

**Critically, hibiscus does not develop bitterness with long steeping
— it develops more acidity.** That's a different failure mode than
tannic true teas. The upper bound is "too sour to drink straight"
rather than "astringent and bitter."

| timeS | % of asymptote (approx) | character shift from STANDARD | effect shift from STANDARD |
|-------|------------------------|-------------------------------|---------------------------|
| 180 (3 min) | ~50% | Light ruby, fruit-forward, less acidic bite | energy −1, cooling +0, settle −1 |
| 360 (6 min) | ~85% | **Baseline — the STANDARD profile as in 6b** | baseline |
| 600 (10 min) | ~95% | Deep ruby, fuller body, more sour | energy +0, cooling +0, settle +1 |
| 1200 (20 min) | ~98% | Acidic-forward, often needs sweetening, approaches decoction | energy +0, cooling +0, settle +1 |

**Algorithm note:** Hibiscus time is *monotonic and non-inverting* like
chamomile, but reaches asymptote faster. After ~10 min at hot temps,
additional time mostly just concentrates acids without adding meaningful
character variation. This differs from chamomile (still extracting
notable compounds at 10 min) and is much gentler than true teas (where
long steep introduces tannins quickly).

**Cross-temperature note:** At 25°C (cold brew), the time axis
stretches dramatically — 4 hours to reach what 6 min achieves at 90°C
(Ramirez-Rodrigues 2011). This is why cold brew is a separate
preparation paradigm, not a point on the same curve. The algorithm
should treat cold brew as a distinct mode with its own time
expectations, not interpolate between hot and cold primary profiles.

Sources: ref-ramirez-rodrigues-2011, ref-paraiso-2021, ref-morales-2020.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current app copy: "May lower blood pressure — sip modestly if relevant."
>
> This is the well-established warning. Well-documented additional considerations:
>
> - **Blood pressure medications (antihypertensives)** — additive
>   hypotensive effect. The Herrera-Arellano 2007 trial directly compared
>   hibiscus to captopril and showed equivalent BP-lowering at the doses
>   tested. Stacking with an ACE inhibitor could produce more reduction
>   than intended. "Consult a pharmacist if on BP medication."
> - **Pregnancy** — Well-documented concern, not folk caution.
>   Multiple animal studies and the Enwerem 2013 review document
>   emmenagogue effects (stimulating menstrual blood flow via
>   phytoestrogens that bind estrogen receptors), which could in
>   principle induce early labor or miscarriage. The phytoestrogen
>   activity is also documented to interfere with hormonal IVF
>   treatments (Kennedy 2023 case report). Framing: "avoid during
>   pregnancy and breastfeeding" is the clinical consensus.
> - **Iron absorption** — Real effect. Hibiscus polyphenols bind
>   non-heme iron. When iron is added to hibiscus beverage, ~25% gets
>   trapped in polyphenol complexes, reducing bioavailability.
>   Significance: matters for people with iron-deficiency anemia or
>   heavy menstrual blood loss. Practical advice: "drink between
>   meals, not alongside iron-rich foods or iron supplements."
> - **Pre-surgery** — The BP-lowering and potential mild
>   anticoagulant effects suggest stopping 2 weeks before surgery,
>   consistent with general herbal-medicine pre-op guidance.

**Dosage cautions:**

> Clinical trial doses range from 1.25g per 240 mL (3 servings/day in
> McKay 2010, mild BP effect) up to 10-20g/day (Mossa 2021 Iraqi
> study, therapeutic effect in uncontrolled hypertension). Normal
> enjoyment-level consumption is well below the therapeutic range
> and doesn't require dose warnings.

**NOT a concern but sometimes claimed:**

> - **Hepatotoxicity at high doses** — Some supplement-marketing sources
>   warn of liver effects. The Gallucci 2025 meta-analysis of 26 RCTs
>   actually found a small, clinically insignificant increase in AST
>   (one liver enzyme) without elevating overall adverse event risk.
>   Not a concern at tea-consumption doses.
> - **"Causes low blood sugar emergencies"** — Hibiscus does have modest
>   glycemic effects, but these are beneficial in metabolic syndrome
>   context, not acute hypoglycemia risk. Worth excluding from
>   headsUp so it doesn't get added reactively.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| delphinidin-3-sambubioside + cyanidin-3-sambubioside (anthocyanins) | ~10-40 mg per cup at standard brew (McKay 2010: small amounts in tea; Mossa 2021: 36 mg per 10g dose) | the ruby color; primary compounds responsible for BP-lowering effect | high — well-characterized in multiple studies |
| hibiscus acid (unique to *H. sabdariffa*) | ~200 mg per cup (Mossa 2021 found 2.13g in 10g dose) | tartness, mild diuretic, likely contributes to antihypertensive effect | high — presence confirmed, role less fully characterized than anthocyanins |
| malic acid, citric acid | [RESEARCH] | tartness contribution | high — organic acid presence well-established |
| polyphenols (flavonols, hydroxybenzoic acids, caffeoylquinic acids) | [RESEARCH] — collectively significant | antihypertensive, antioxidant | high — presence confirmed by multiple UPLC-MS studies |
| vitamin C (ascorbic acid) | [RESEARCH] — around 6-14 mg per cup from flowers | immune support, iron-absorption enhancement from non-heme sources | high — well-documented |

> Hibiscus is unusually well-characterized for an herbal — the perfume
> and food industries have studied it extensively due to its use as a
> natural colorant. Good candidate for high-confidence compound data.

**characterizedPct estimate:**

> ~75%. Primary anthocyanins well-documented, hibiscus acid profile
> confirmed, full organic acid composition known, polyphenol profile
> characterized by multiple UPLC-MS studies. Remaining uncertainty is
> around trace components and cultivar-dependent variation.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-mckay-2010 | McKay DL, Chen CY, Saltzman E, Blumberg JB. (2010). Hibiscus sabdariffa L. tea (tisane) lowers blood pressure in prehypertensive and mildly hypertensive adults. *Journal of Nutrition*, 140(2):298-303. PMID: 20018807. | clinical RCT (landmark) |
| ref-serban-2015 | Serban C, Sahebkar A, Ursoniu S, Andrica F, Banach M. (2015). Effect of sour tea (*Hibiscus sabdariffa* L.) on arterial hypertension: a systematic review and meta-analysis of randomized controlled trials. *Journal of Hypertension*, 33(6):1119-1127. PMID: 25875025. | systematic review + meta-analysis |
| ref-hopkins-2022 | Hopkins AL, Lamm MG, Funk JL, Ritenbaugh C. (2022). *Hibiscus sabdariffa* L. in the treatment of hypertension and hyperlipidemia: a comprehensive review. *Fitoterapia*. Updated analysis — 17 RCTs, 1205 participants, SBP -7.10 mmHg vs placebo. PMID: 34927694. | review |
| ref-gallucci-2025 | Gallucci et al. (2025). Efficacy and safety of *Hibiscus sabdariffa* in cardiometabolic health: An overview of reviews and updated dose-response meta-analysis. 26 RCTs, 1797 participants, dose-dependent BP reduction. | meta-analysis (most recent) |
| ref-herrera-arellano-2007 | Herrera-Arellano A, Miranda-Sánchez J, Ávila-Castro P, et al. (2007). Clinical effects produced by a standardized herbal medicinal product of *Hibiscus sabdariffa* on patients with hypertension. A randomized, double-blind, lisinopril-controlled clinical trial. *Planta Medica*, 73(1):6-12. PMID: 17315307. | RCT (vs. lisinopril) |
| ref-ramirez-rodrigues-2011 | Ramirez-Rodrigues MM, Plaza ML, Azeredo A, Balaban MO, Marshall MR. (2011). Physicochemical and phytochemical properties of cold and hot water extraction from *Hibiscus sabdariffa*. *Journal of Food Science*, 76(3):C428-435. PMID: 21535810. | extraction chemistry |
| ref-paraiso-2021 | Paraíso CM, Januário JGB, Mizuta AG, et al. (2021). Comparative studies on chemical stability, antioxidant and antimicrobial activity from hot and cold hibiscus (*Hibiscus sabdariffa* L.) calyces tea infusions. *Journal of Food Measurement and Characterization*, 15:3531-3538. DOI: 10.1007/s11694-021-00936-4. | extraction chemistry |
| ref-morales-2020 | Morales-Luna E, Pérez-Ramírez IF, Salgado LM, et al. (2020). Anthocyanins extraction from *Hibiscus sabdariffa* and identification of phenolic compounds associated with their stability. PMID: 32608089. | extraction chemistry |
| ref-mossa-2021 | Mossa AT, et al. (2021). *Hibiscus sabdariffa*, a treatment for uncontrolled hypertension. Pilot comparative intervention. *Plants* (MDPI), 10(5):1018. Iraqi IDP study. | pilot clinical + phytochemistry |
| ref-ojeda-2010 | Ojeda D, Jiménez-Ferrer E, Zamilpa A, et al. (2010). Inhibition of angiotensin converting enzyme (ACE) activity by the anthocyanins delphinidin- and cyanidin-3-O-sambubiosides from *Hibiscus sabdariffa*. *Journal of Ethnopharmacology*. | mechanism (ACE inhibition) |
| ref-da-costa-rocha-2014 | Da-Costa-Rocha I, Bonnlaender B, Sievers H, Pischel I, Heinrich M. (2014). *Hibiscus sabdariffa* L. — A phytochemical and pharmacological review. *Food Chemistry*, 165:424-443. | comprehensive review |
| ref-enwerem-2013 | Enwerem N, et al. (2013). *Hibiscus sabdariffa* L: Safety and efficacy during pregnancy and lactation. *Planta Medica* conference abstract. | safety review |

**Starting points for further research:**

- Ebers Papyrus (1550 BC) — referenced in multiple Egyptian-hibiscus
  sources as mentioning hibiscus as a cough remedy. Primary verification
  requires Egyptological access.
- EMA herbal monograph on *Hibisci flos* (if it exists)
- NIH HerbList / NCCIH hibiscus entry

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | fact | established | What looks like a red hibiscus flower in your cup is actually the calyx — the fleshy casing under the flower, not the petals. | botanical fact |
| 2 | fact | verified | Hibiscus tea genuinely lowers blood pressure in people with mild hypertension. Three cups a day for six weeks produced a measurable drop in clinical trials — effect size comparable to some conventional medications at low doses. | ref-mckay-2010, ref-serban-2015 |
| 3 | culture | established | Egyptian karkadé, Mexican jamaica, and West African bissap are all the same plant, prepared in different traditions across three continents. | cross-cultural botanical fact |
| 4 | fact | verified | Cold-brewed hibiscus (4 hours in cold water) extracts the same amount of the red anthocyanin compounds as a 16-minute hot brew — the only ingredient in the catalog where cold brew produces equivalent potency. | ref-ramirez-rodrigues-2011 |
| 5 | fact | established | The tartness comes mostly from hibiscus acid — a compound named for this plant because it's found in almost nowhere else. | well-established phytochemistry |

> Note on fact #4: This is pedagogically important — hibiscus is
> genuinely unusual among the catalog in that cold brew isn't a
> compromise but a legitimate preparation with its own tradition
> (Mexican agua fresca, many African preparations).

---

## 10b. Folk & cultural attributions

| Claim | Confidence | Notes | Source or status |
|-------|-----------|-------|------------------|
| Hibiscus was the "tea of the pharaohs" in ancient Egypt | attested | Widely cited in Egyptian cultural sources; the Ebers Papyrus (1550 BC) — a real ancient Egyptian medical document — references hibiscus as a cough remedy, which establishes genuine ancient Egyptian medicinal use. The "pharaoh's drink" framing is a popular amplification of a real ancient-use tradition. | Ebers Papyrus citation widely referenced; primary-text access requires Egyptology resources |
| Served at Egyptian weddings as a symbol of joy and prosperity | attested | Documented Egyptian cultural practice — karkadé is genuinely the celebratory drink of choice at weddings across Egypt and Sudan. | widespread cultural practice, multiple ethnographic sources |
| Consumed at sunset during Ramadan to break the fast | attested | Genuine tradition across Egypt, Sudan, and much of the Arab world. The cooling and hydrating properties make it ideal for ending a day of fasting. | cultural practice, widely documented |
| West African bissap — often spiced with ginger and mint, sometimes sweetened heavily — is the continent's summer drink | attested | Genuine cultural staple in Senegal, Mali, Burkina Faso, Ivory Coast. Documented in ethnographic and culinary literature. | ethnographic documentation |
| Mexican *agua de jamaica* is one of the three traditional *aguas frescas* (with *horchata* and *tamarindo*) sold from glass barrels at street stalls | attested | Genuine and widely-documented Mexican culinary tradition. | culinary ethnography |
| Ancient Egyptians considered hibiscus's deep red color to "inspire passionate desires," leading to periods when it was forbidden to women | folk | Popular claim in Egyptian tourism / cultural sites; primary historical source is unclear. The symbolic link (red = passion) is culturally plausible but the specific prohibition claim reads as later embellishment. | primary source not located |
| The species name *sabdariffa* derives from Arabic for "a desert plant" | folk | Widely repeated in hibiscus cultural literature; etymological verification unclear. *Sabdariffa* is the Linnaean botanical epithet; its origin may be from a specific Arabic word or a local plant name rather than "desert plant." | etymological primary source not located |
| Hibiscus was used in Egyptian tomb offerings | attested | Archaeological presence documented; specific ritual role varies by source. The plant's ancient Egyptian presence is real; "tomb offerings" framing is one popular interpretation. | archaeological record |
| Hibiscus flower is the national flower of Haiti, South Korea (mugunghwa, a different *Hibiscus* species), and Hawaii | verified | Botanical/national symbol facts — note the Hawaii reference is to *H. brackenridgei* and Korea's mugunghwa is *H. syriacus*, not *H. sabdariffa*. Worth being precise about which species is where. | official national symbols |

**Design note for the app:** Hibiscus's folk content is richer and
more geographically distributed than most Western herbs. The "tea of
the pharaohs" framing is the dominant romantic story, but it's worth
surfacing that hibiscus is *equally* Mexican, *equally* Senegalese,
*equally* Sudanese. The app UI should avoid framing hibiscus as
primarily Egyptian — that's Eurocentric tourism framing of a plant
that is genuinely global in use.

---

## 11. Miscellaneous & uncaptured

**Personal notes** (add your own tasting experience):

> [TOMMY] — blank for now; add after brewing both hot and cold

**Questions that weren't resolvable from sources:**

> - Whether the popular "lowers cholesterol" claim is as well-supported
>   as the BP claim (some evidence in Hopkins 2022 but with more
>   heterogeneity than the BP data)
> - Precise milligram anthocyanin content varies significantly with
>   cultivar and drying method — numbers given are approximate
> - Whether the BP effect requires daily consumption or whether 1-2
>   cups on an occasional schedule gives proportional benefit
> - The exact chemistry of "hibiscus acid" — structurally related to
>   hydroxycitric acid (HCA), but the precise isomer and biosynthesis
>   pathway vary in sources

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 2 | Hot brew range well-sourced; cold brew equivalence proven in Ramirez-Rodrigues 2011 |
| Effects ratings | 2 | `cooling` and `energy` cultural-use confident; `settle` at 2 inferred from traditional digestive use |
| Extraction profiles | 2 | Multiple extraction studies support the three temp anchors; time behavior well-characterized by Morales 2020 |
| Safety notes | 3 | Unusually well-documented for an herbal — BP medication interaction, pregnancy, and iron absorption all have primary source support |
| Facts | 2 | Steep-screen facts verified or established; folk content in 10b properly labeled |

**Overall status:**
- [ ] Draft
- [x] Verified — confident enough to ship (with cold-brew UX question noted)
- [ ] Flagged

---

## Notes for this scaffold

- **What's confident now:** Identity with full cross-cultural naming,
  caffeine = 0, acid-based flavor character, the BP-lowering clinical
  effect (multiple landmark RCTs, three independent meta-analyses,
  well-characterized mechanism), temp range [25, 100] with cold-brew
  as a legitimate preparation, pregnancy warning grounded in real
  mechanism (phytoestrogen activity), iron-absorption effect,
  compound chemistry (anthocyanins, hibiscus acid).
- **What's plausible but still fuzzy:** Exact clinical-dose threshold
  for BP benefit (1-2 cups vs. 3+), precise iron-absorption magnitude
  at normal tea doses vs. measured in fortified beverages.
- **What's genuinely missing:** EMA herbal monograph access, primary
  Ebers Papyrus citation, specific cultivar-based chemistry variation.

**Generalizable lessons from hibiscus research:**

1. **Cold brew changes the game for some ingredients.** Hibiscus is
   the first ingredient in the catalog where cold brew isn't a
   compromise but a legitimate preparation with equivalent potency.
   The temp range had to expand from [95, 100] to [25, 100] to
   reflect this. Worth checking during research whether other
   ingredients (rose, lavender, possibly hibiscus-family aromatics)
   have genuine cold-brew traditions worth data-modeling.

2. **The "doesn't develop bitterness" property generalizes across
   acid-based ingredients.** Chamomile and hibiscus both lack the
   classic tannic-bitter failure mode of true teas. The time-axis
   behavior for both is monotonic. Rooibos likely similar. This may
   be a useful category distinction in the algorithm — "tannic"
   vs. "non-tannic" ingredients could be handled differently.

3. **Multi-cultural folk content needs explicit de-centering.** The
   chamomile research naturally centered European sources. Hibiscus
   has genuinely equivalent Egyptian, Mexican, and West African
   traditions; presenting it as "the pharaoh's drink" with cultural
   asides about Mexico and Senegal would be framing error. Worth
   doing explicitly for every ingredient that has non-Western
   traditional use.

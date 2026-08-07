# Ingredient Research — Assam Black Tea

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> First true-tea research entry with `warming` as a top-level
> effect — stress-testing the TCM axis added in the vocabulary
> migration.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `assam` | matches existing INGREDIENTS key |
| **display name** | Assam Black | |
| **latin** | *Camellia sinensis var. assamica* | The large-leaf variety (Masters, 1844); distinct from *C. s. var. sinensis* used in Chinese teas |
| **category** | true tea | |
| **subcategory** | black | |
| **also known as** | Breakfast tea (as component), CTC Assam, orthodox Assam | |

---

## 2. Overview

**One-line essence:**

> The malty, robust black tea that became the global morning cup —
> backbone of breakfast blends from Dublin to Delhi.

**Short description:**

> Assam tea comes from the Brahmaputra Valley of northeastern India,
> where the large-leaf *C. sinensis var. assamica* grows natively in
> a hot, humid, monsoon-dominated climate. The leaves are withered,
> rolled (orthodox) or processed via CTC (Crush-Tear-Curl), fully
> oxidized, and fired to produce the characteristic dark amber
> liquor and brisk, malty flavor. Assam is the world's largest
> tea-producing region by volume and the foundation of most Western
> "breakfast" blends.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- malty
- brisk
- woody
- cocoa

**Aroma notes:**

> Deep, rich, slightly molasses-forward. Second-flush Assam develops
> a distinctive malt-and-honey bouquet — this is where the "malty"
> signature comes from. CTC Assam is earthier and less nuanced;
> orthodox whole-leaf preserves more complexity.

**Mouthfeel:**

> Full-bodied, brisk, pronounced astringency from theaflavins and
> thearubigins. Pairs naturally with milk because milk proteins bind
> the polyphenols and round off the astringent edge — this is why
> British-style milk tea evolved specifically around Indian black
> teas. Less astringent than over-brewed green tea; the astringency
> is woven into the flavor rather than standing apart from it.

**Basic tastes:**

> - `bitter` (2) — genuinely bitter at standard brew; rises to 3-4
>   at very long steeps. Comes from oxidized polyphenols and caffeine.
> - `astringent` (3) — drying, puckering sensation from tannins.
>   The "brisk" character. Distinct from bitterness.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | traditional, established | Full boil canonical for black tea. Lower temps under-extract the theaflavins that give Assam its character. |
| **time range (seconds)** | [180, 300] | traditional | 3-5 minutes orthodox; CTC is faster (90-180s) because smaller particle size |
| **caffeine (mg per ~8oz cup)** | 60 | Linus Pauling Institute, OSU; Hicks 1996 | Range 40-70 depending on cultivar, processing, and brew strength. Among the highest of any tea, higher than most coffees per gram of dry matter. |
| **dose** | 1 tsp (~2.5g) per 200ml | traditional | Strong enough to stand up to milk |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| energy | 5 | **Primary effect.** High caffeine (60mg+) is well-established. The "morning tea" for a reason |
| warming | 4 | TCM Yang energy — fully oxidized, heating in nature. Correct for post-winter, post-rain, morning contexts |
| focus | 3 | Caffeine + modest L-theanine (~5 mg/g, lower than green but present). Clearer and more sustained alertness than coffee at equivalent dose |
| uplifting | 2 | The brisk, bright character — especially in lighter-processed Assam and second-flush teas |
| calm | | Not applicable — this is a stimulant tea |
| sleepy | | Not applicable |
| cooling | | Opposite direction |
| digestive | | Mild but not the primary frame — milk-tea blends often claim this but data is thin for plain Assam |
| soothing | | Not the register — Assam is more "wake up" than "settle in" |
| grounding | | Slight, from the earthy second-flush character, but not primary |

> **Research note:** The 2014 meta-analysis of 11 black-tea RCTs (378
> subjects) showed modest but real blood-pressure reduction at 4-5
> cups/day: SBP -1.8 mmHg, DBP -1.3 mmHg (Greyling et al., PLOS One).
> This is a population-level effect, not a reason to drink Assam
> for BP. The 2014 cholesterol meta-analysis (15 RCTs) showed no
> significant effect on total cholesterol or HDL; marginal LDL
> reduction in healthy subjects only in fixed-effects analysis.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from black tea extraction
> literature (Astill 2001 on caffeine extraction kinetics; Yao 2006
> on theaflavin/thearubigin formation and brewing effects), combined
> with canonical Indian/British/South Asian practice.

### 6a. GENTLE (90°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 180 |
| flavors | [malty, brisk, woody] |
| effects | [["energy", 3], ["warming", 3], ["focus", 2]] |
| character | A restrained Assam — useful for first-flush teas or when blending with delicate floral accents that stronger brewing would overwhelm. The maltiness hasn't fully developed; the cup reads lighter than a proper Assam should. |
| sources | ref-astill-2001 |

### 6b. STANDARD (95°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 240 |
| flavors | [malty, brisk, woody, cocoa] |
| effects | [["energy", 5], ["warming", 4], ["focus", 3]] |
| character | The canonical breakfast Assam — full malty body, deep amber liquor, pronounced briskness. Stands up to milk without disappearing. The cup that made Indian black tea globally dominant. |
| sources | ref-astill-2001, traditional |

### 6c. STRONG (100°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 300 |
| flavors | [malty, cocoa, woody, deep, tannic] |
| effects | [["energy", 5], ["warming", 5], ["focus", 3]] |
| character | A strong cup — often what's made for workers' tea, chai base, or anywhere milk and sugar will mask potential over-extraction. The tannins assert themselves; without milk this can read harsh. |
| sources | traditional |

### 6d. OVER-PULL (100°C, 480s / 8 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 480 |
| flavors | [malty, woody, deep, tannic, astringent] |
| effects | [["energy", 5], ["warming", 5], ["focus", 3], ["bitterness", 3]] |
| character | Past the point the cup improves. The caffeine finished arriving minutes ago, so this is no stronger in the way people mean it — only harsher. Tannin dominates, the cocoa top-note is buried, and the finish grips. This is the cup milk was invented for. |
| sources | ref-alam-2015, ref-nakagawa-astringency |

> **Why these numbers, and why an over-pull point exists at all:**
>
> The app's steep slider reaches the end of a profile's MEASURED data,
> not the end of what we recommend — so an ingredient with no row past
> its recommended max simply can't be stretched. Assam's recommended
> max was 5 min, which meant the single most common brewing mistake in
> the world could not be shown in a cup that teaches extraction.
>
> The shape of this row is the divergence, and the divergence is the
> whole lesson. Alam 2015 tracked CTC black tea across ten time points
> to 20 minutes and found the compounds separate rather than rise
> together: caffeine has the FASTEST extraction rate constant of any
> component measured (4.1 x 10-3) and is essentially finished in the
> first two minutes, while total polyphenols and flavonoids peak at 6-8
> minutes, and individual catechins and gallic acid keep climbing
> slowly all the way to 20.
>
> So `energy` stays at 5 rather than rising — the caffeine stopped
> arriving long before this point, and a stronger-tasting cup that is
> not a stronger cup is exactly the misconception worth correcting.
> `bitterness` goes to 3 and `astringent` joins the flavours because
> the compounds still extracting at 8 minutes are the astringent ones:
> gallate-type catechins are the most astringent class (ECG > EGCG >
> GCG > CG > EGC > EC), with EGCG detectable at 0.086 mg/mL, and
> phenolic acids including gallic acid contribute a sour-astringent
> taste that rises with concentration.
>
> `cocoa` is dropped rather than reduced. The malty and cocoa notes are
> volatile aromatics; they don't survive eight minutes at a rolling
> boil, and what remains is read through a tannin load that has roughly
> doubled since the recommended point.
>
> **Honest limit:** Alam's kinetics are chemistry, not sensory — that
> paper records no tasting panel. The step from "gallate catechins and
> gallic acid are still extracting" to "the cup tastes astringent" is
> carried by the astringency literature cited separately, not by Alam.
> The specific intensities (3 rather than 2 or 4) are a judgement about
> where this sits against the other profiles in the app, not a measured
> quantity.

### 6e. Time-axis behavior

> Assam is genuinely sensitive to time. Black tea polyphenols
> continue extracting across the full brewing window, and unlike
> rooibos, they become bitter and astringent rather than deeper
> and sweeter. First-flush Assam is especially intolerant of long
> steeps — 5+ minutes can destroy the delicate muscatel-adjacent
> notes. Second-flush and CTC are more forgiving.
>
> Practical rule: for orthodox whole-leaf Assam, stick to 3-4
> minutes; for CTC in tea bags, 2-3 minutes. Milk-tea preparations
> (chai, British-style) traditionally brew stronger and longer
> because the milk buffers astringency.

---

## 7. Safety & heads-up

**Known interactions:**

> - **Caffeine (~60mg/cup)** — standard caffeine cautions apply:
>   avoid late afternoon, moderate during pregnancy (current
>   guidance: <200mg/day total caffeine), watch for interactions
>   with MAOIs and certain psychiatric medications. `established`
> - **Iron absorption** — tannins in black tea reduce non-heme iron
>   absorption significantly when consumed with meals. People with
>   iron-deficiency anemia should drink tea between meals, not with
>   them. Disler 1975 remains the canonical reference.
>   `established`
> - **Fluoride** — Camellia sinensis accumulates fluoride from soil;
>   heavy daily consumption (10+ cups) has been associated with
>   skeletal fluorosis in case reports. Not a concern at normal
>   intake. `attested`

**Dosage cautions:**

> Standard tea dosage for the caffeine-tolerant adult: 3-5 cups/day
> puts you in the dose range used in cardiovascular studies. Beyond
> that, caffeine toxicity and iron absorption become concerns before
> tea-specific effects do.

**NOT a concern but sometimes claimed:**

> - **"Black tea causes osteoporosis"** — Early studies suggested
>   concern from fluoride and caffeine. Recent meta-analyses show
>   no significant bone-density effect at normal consumption.
>   Possibly slightly protective. `attested`
> - **"Black tea dehydrates you"** — Myth. Caffeine is mildly
>   diuretic, but hydration from tea water more than compensates.
>   `established`

---

## 8. History & cultural context

**Plant origin:**

> *Camellia sinensis var. assamica* is native to the Brahmaputra
> Valley of northeast India, adjacent parts of Myanmar, and
> southern China (Yunnan). This is a different cultivar from
> *var. sinensis* — larger leaves, higher caffeine, suited to hot
> humid climates rather than high mountain conditions. `verified`

**Discovery — colonial flattening:**

> The standard narrative: "Robert Bruce discovered wild tea in
> Assam in 1823." The more accurate account: Bruce, a Scottish
> adventurer, was shown wild tea plants by the local Singpho chief
> Bessa Gam, introduced by the Ahom nobleman Maniram Dewan. The
> Singpho and Khamti tribes had been using the plant for centuries
> — including a smoked, bamboo-tube-fermented preparation called
> *phalap* that predated European contact. Bruce died in 1824
> before the plant was formally classified; his brother Charles
> sent samples to Calcutta Botanical Garden, where Nathaniel
> Wallich confirmed the species identity in the 1830s. `verified`
> (commercial history); `attested` (pre-colonial Singpho/Khamti use)

**Commercial development:**

> - **1834:** British East India Company establishes the Tea
>   Committee, motivated by the 1833 end of their China monopoly.
>   `verified`
> - **1838:** First consignment of 350 pounds of Assam tea auctioned
>   in London (January 10, 1839). `verified`
> - **1839:** Assam Tea Company founded — India's first commercial
>   plantation. `verified`
> - **1848:** Botanist Robert Fortune's covert mission into Chinese
>   tea districts, smuggling Chinese cultivation knowledge and
>   plants into British territories — sometimes called "the greatest
>   act of industrial espionage in history." `verified`
> - **1860s+:** Massive plantation expansion, driven by Inland
>   Emigration Act (1863) which effectively bound indentured workers
>   to estates. Conditions documented by historians as "virtual
>   slavery." By 1890, Assam produced 87 million pounds of tea
>   annually. `verified`
> - **1931:** William McKercher invents CTC (Crush-Tear-Curl)
>   processing at Borbam Tea Estate in Sivasagar district,
>   revolutionizing black tea manufacture by enabling mass
>   production of small-particle tea suited to tea bags. `verified`
> - **Today:** Assam produces 650-700 million kg annually, over 50%
>   of India's tea output. Employs 700,000+ workers; wage and
>   welfare issues persist. `verified`

**The colonial shadow:**

> Any honest history of Assam tea has to acknowledge that the
> industry was built on systematic coercion. The Workman's Breach
> of Contract Act and Inland Emigration Act legally bound migrant
> workers (largely from Bihar, Orissa, Central Provinces) to
> plantations; escapees could be forcibly returned by magistrates.
> Modern Assam tea gardens operate under different conditions, but
> labor issues continue — hence the rise of Fairtrade and Rainforest
> Alliance certifications for the industry. `verified`

**Flushes:**

> Assam is harvested in seasonal "flushes":
> - **First flush** (late March-May): Light, fresh, brisk — rare
>   style for Assam (more associated with Darjeeling).
> - **Second flush** (June): The defining Assam. Full-bodied,
>   malty, golden-tipped, often with honey notes. This is what most
>   premium loose-leaf Assam is.
> - **Monsoon flush** (July-September): High volume, lower quality;
>   often CTC for tea bags and strong blends.
> - **Autumnal flush** (October-November): Smooth and mellow; less
>   intense than second flush.
> `verified`

**Chemistry:**

> Black tea's defining compounds are theaflavins (2-6% of extracted
> solids) and thearubigins (>20%) — oxidation products formed when
> enzymes in the leaf act on catechins during controlled oxidation.
> Theaflavins contribute briskness and brightness; thearubigins
> give depth and fullness. Assamica-variety leaves are chemically
> predisposed to more aggressive oxidation and higher theaflavin
> yield than sinensis-variety leaves. L-theanine content is
> measurable (~5 mg/g dry weight, per Csupor 2016) but lower than
> green tea (~6.5 mg/g) because oxidation degrades some theanine.
> `established`

---

## 9. Sources

- `ref-alam-2015` — Alam M et al. 2015. *Extraction Kinetics of
  phytochemicals and antioxidant activity during black tea (Camellia
  sinensis L.) brewing*. Nutrition Journal 14:32.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4520228/
  — CTC black tea, boiling water, ten time points to 20 min. Caffeine
  fastest extraction rate constant (4.1 x 10-3), essentially complete
  in ~2 min; total polyphenols and flavonoids peak 6-8 min then
  plateau; individual catechins and gallic acid continue rising to 20
  min. No sensory panel — chemistry only.
- `ref-nakagawa-astringency` — Astringency of tea catechins and
  phenolic acids, collected evidence:
  Yu Z et al. 2022, *Effects of phenolic acids and
  quercetin-3-O-rutinoside on the bitterness and astringency of green
  tea infusion*, npj Science of Food 6:1
  https://www.nature.com/articles/s41538-022-00124-8 — phenolic acids
  including gallic acid impart sour/astringent taste rising with
  concentration; and
  Exploring the Relative Astringency of Tea Catechins, PMC9457659
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9457659/ — gallate-type
  catechins more astringent than non-gallate, ordered
  ECG > EGCG > GCG > CG > EGC > EC > GC > C; EGCG astringency
  threshold 0.086 mg/mL, EGC 0.16 mg/mL.

- `ref-greyling-2014` — Greyling A et al. 2014. *The Effect of Black
  Tea on Blood Pressure: A Systematic Review with Meta-Analysis of
  Randomized Controlled Trials*. PLOS One 9(7): e103247.
  https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0103247
  — 11 studies, 378 subjects, pooled effect: SBP -1.8 mmHg,
  DBP -1.3 mmHg.
- `ref-wang-2014` — Wang D et al. 2014. *Effect of Black Tea
  Consumption on Blood Cholesterol: A Meta-Analysis of 15 Randomized
  Controlled Trials*. PLOS One 9(9): e107711.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4169558/
  — No significant effect on TC/HDL; marginal LDL in healthy
  subjects only.
- `ref-csupor-2016` — Csupor D et al. 2016. *Theanine and Caffeine
  Content of Infusions Prepared from Commercial Tea Samples*.
  Pharmacognosy Magazine 12(45): S26-S29.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4787341/
  — L-theanine: white 6.26, green 6.56, oolong 6.09, black 5.13
  mg/g; caffeine ~16-19 mg/g across types.
- `ref-keller-2021` — Keller A, Wallace TC. 2021. *Tea intake and
  cardiovascular disease: an umbrella review*. Annals of Medicine
  53(1): 929-944.
- `ref-bruce-1823` — Historical record of Robert Bruce's 1823
  encounter with Singpho tea practice. Various secondary sources;
  primary correspondence held at British Library India Office
  Records.
- `ref-disler-1975` — Disler PB et al. 1975. *The effect of tea on
  iron absorption*. Gut 16(3): 193-200. — Canonical reference on
  tea-iron interaction.
- `ref-astill-2001` — Astill C et al. 2001. *Factors affecting the
  caffeine and polyphenol contents of black and green tea infusions*.
  J Agricultural and Food Chemistry 49(11): 5340-5347. — Brewing
  kinetics for black tea.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Robert Bruce discovered Assam tea in 1823" | `attested` | Colonial flattening — Singpho and Khamti had used wild tea for centuries; Bruce introduced it to European commerce |
| "The Singpho made *phalap* from wild tea" | `attested` | Oral tradition extending potentially to 12th century; not directly documented in pre-colonial texts |
| "Assam tea is warming (TCM)" | `attested` | Standard TCM framing; high oxidation = Yang energy |
| "CTC was invented in Assam in 1931" | `verified` | William McKercher at Borbam Tea Estate |
| "Breakfast blends are mostly Assam" | `verified` | Industry standard |
| "Milk rounds off Assam's astringency" | `established` | Casein protein binds polyphenols — demonstrated chemistry |
| "Black tea modestly lowers blood pressure" | `attested` | Greyling 2014 meta-analysis, small effect |
| "Tea has been a British tradition since forever" | `folk` | Actually a colonial artifact — tea became British-mass-market in the late 18th/19th centuries as Indian supply developed |

---

## 11. Research flags & open questions

1. **CTC vs. orthodox as same ingredient?** They're chemically and
   flavorwise distinct. Most grocery-store Assam is CTC (tea bags);
   premium loose-leaf is orthodox. Currently combined under `assam`
   — may want to split as future refinement.

2. **First flush vs. second flush.** Current data assumes second
   flush as the canonical Assam. First flush is rare for Assam and
   produces a lighter, brisker cup more like Darjeeling. Existing
   `variants` field in the app data already handles this; research
   supports that structure.

3. **L-theanine content in black tea is lower than commonly
   believed.** The Csupor 2016 study finds black tea at 5.13 mg/g
   vs. green at 6.56 mg/g — a 22% reduction, not the "basically
   none" that some tea literature suggests. This means Assam does
   carry some of the alert-calm L-theanine signature, just less
   than green tea. Relevant for the `focus 3` rating.

4. **Milk as a confound.** Most Assam outside India is consumed
   with milk, which significantly alters the bioactive profile —
   casein binds polyphenols, reducing both antioxidant effect and
   iron-inhibition. The clinical studies cited here use plain
   brewed tea; real-world consumption differs.

5. **Labor-ethics considerations.** Herbanium's app doesn't currently
   surface sourcing ethics. Worth considering whether to add a
   `sourcing_note` field for ingredients with significant
   supply-chain ethics issues (Assam labor; West African cocoa;
   Chinese green tea from Xinjiang; etc.) — parallel to `headsUp`
   but pointed at provenance rather than user-health.

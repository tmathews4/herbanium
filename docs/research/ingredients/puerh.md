# Ingredient Research — Pu-erh

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> The post-fermented tea — genuinely different category from the
> other five traditional Chinese tea types. Calibration test for
> `grounding` vs. lapsang (both at strength 3).

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `puerh` | matches existing INGREDIENTS key |
| **display name** | Pu-erh | |
| **latin** | *Camellia sinensis var. assamica* | Yunnan large-leaf variety — genetically related to Assam's plant, which is why pu-erh and Indian black teas share some chemistry |
| **category** | true tea | |
| **subcategory** | post-fermented (dark tea) | **Technically a 6th category** distinct from black; Chinese call it 黑茶 (hēichá, "dark tea") or specifically 普洱 (pǔ'ěr) |
| **also known as** | Bo-lei (Hong Kong); Pu'er, Puerh (variant romanizations); sheng pu-erh (raw/green); shou pu-erh (ripe/cooked); factory pu-erh (mass-produced); gushu (ancient-tree pu-erh) |

---

## 2. Overview

**One-line essence:**

> The only tea that improves with age — earthy, forest-floor, the
> rare case where microbial fermentation is the point, not a defect.

**Short description:**

> Pu-erh is a fermented tea from Yunnan Province, China. Unlike
> every other true tea (which halts enzymatic activity through heat),
> pu-erh is *intentionally fermented* by microbes — primarily
> *Aspergillus niger* and related fungi — either over decades
> (sheng/raw pu-erh aging naturally) or over 45-60 days in
> controlled piles (shou/ripe pu-erh, invented 1970s). The result
> is a tea that tastes nothing like green or black tea: deep,
> earthy, mellow, sometimes described as "forest floor after rain."
> Used for centuries in Chinese traditional medicine for digestion
> and cholesterol; modern research supports the cholesterol claim
> more strongly than most tea health claims.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- earthy
- woody
- sweet
- deep
- camphor

**Aroma notes:**

> Deeply earthy — the standard descriptor is "forest floor after
> rain." Notes of wet wood, damp leaves, sometimes mushroom, aged
> wood, sometimes a distinctive camphor or medicinal edge in older
> sheng. Shou pu-erh is darker and more uniform — always earthy,
> often with cocoa-and-date sweetness. Quality aged sheng pu-erh
> can develop surprisingly complex aromatics over decades —
> dried fruits, dates, aged leather, light camphor.
>
> The "earthiness" is literal: these aromas come from
> microbial-metabolism compounds (geosmin, methylisoborneol,
> various theabrownins) — the same compounds that give petrichor
> its character.

**Mouthfeel:**

> Full-bodied, thick, often described as "soupy" or "oily." Quality
> pu-erh has a distinctive long-lasting aftertaste (*hui gan* —
> "returning sweetness") where the initial earthy-depth gives way
> to a surprising sweetness in the back of the mouth. Low
> astringency, especially in ripe pu-erh and aged sheng; young
> sheng can be surprisingly astringent and bitter before aging.

**Basic tastes:**

> - `bitter` (1-3 depending on type) — ripe pu-erh: low. Young
>   sheng: moderate to high. Aged sheng: low, with "hui gan"
>   sweet return.
> - `sweet` (2) — the *hui gan* returning sweetness is
>   characteristic; cocoa-date sweetness in ripe.
> - `umami` (1) — mild but present; microbial metabolism produces
>   glutamate-adjacent compounds.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | traditional | Full boil canonical. Unlike green tea, pu-erh rewards aggressive extraction — microbial compounds are robust |
| **time range (seconds)** | [180, 300] | traditional Western-style | 3-5 min Western style. Gongfu-style: 10-20 seconds with multiple infusions (8-12+ easily) — strongly preferred by serious pu-erh drinkers |
| **caffeine (mg per ~8oz cup)** | 30 | Csupor 2016 (for ripe pu-erh); Zhou 2018 (Aspergillus degrades caffeine during fermentation) | Lower than most true teas because *A. niger* partially degrades caffeine during fermentation. Ripe pu-erh especially low. Young sheng closer to black tea levels (~40mg). |
| **dose** | 1 tsp (~3-5g) per 200ml | traditional | Heavier dose than other teas; the compressed cake form means leaves need more volume to express fully |

> **Rinse first:** Traditional practice is to "rinse" pu-erh with a
> brief (3-5 second) initial steep that is discarded. This awakens
> the leaves and removes dust from aging/compression. Skipping the
> rinse produces a muddy first cup.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| digestive | 4 | **Primary effect** — the strongest digestive rating in the catalog. Traditional Chinese use after rich/fatty meals (*xiao ni* — "dissolving grease"); modern research supports this via gut microbiota and bile acid mechanisms (Huang 2019, *Nature Communications*) |
| grounding | 3 | Deep, earthy, heavy — parallel to lapsang (also 3). Pu-erh's grounding comes from aged/microbial depth; lapsang's from smoke. Both genuinely earn 3 |
| warming | 3 | TCM Yang — especially shou pu-erh, which is warmer than sheng due to pile fermentation. Used in cold seasons and for cold-pattern conditions |
| soothing | 2 | The round, mellow, mature character soothes — especially aged versions |
| energy | 2 | Moderate caffeine (~30mg), lower than most true teas because *Aspergillus* partially degrades caffeine during fermentation |
| focus | 2 | Lower than other true teas. Pu-erh lacks the L-theanine + caffeine synergy that defines green tea focus — L-theanine is essentially zero in pu-erh (Csupor 2016) because fermentation degrades it |
| calm | | Not applicable in the L-theanine sense |
| sleepy | | Not applicable — caffeine present |
| cooling | | Opposite direction |
| uplifting | | Opposite — pu-erh grounds, doesn't lift |

> **Vocabulary stress test — calibration passed.** Pu-erh earns
> `grounding` 3 alongside lapsang. The catalog now has two teas
> at this grounding strength, which is correct: pu-erh and lapsang
> are the two most grounding teas for different reasons (aged
> earth vs. pine smoke). Future tea catalog expansion should
> probably reserve `grounding` 4-5 for non-tea grounding herbs
> (reishi mushroom, ashwagandha as potential candidates).

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from traditional Yunnan
> gongfu practice, Huang 2019 (*Nature Communications* theabrownin
> research), and established pu-erh brewing guides.

### 6a. GENTLE (90°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 180 |
| flavors | [earthy, sweet, woody] |
| effects | [["digestive", 3], ["grounding", 2], ["warming", 2]] |
| character | A restrained approach — useful for young sheng pu-erh where over-extraction pulls forward bitterness, or for aged sheng where the delicate dried-fruit notes deserve protection. The deep earthiness is still there but doesn't dominate. |
| sources | traditional |

### 6b. STANDARD (95°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 240 |
| flavors | [earthy, woody, sweet, deep] |
| effects | [["digestive", 4], ["grounding", 3], ["warming", 3], ["soothing", 2]] |
| character | The canonical pu-erh cup — deep mahogany liquor, earthy-sweet character, the *hui gan* returning sweetness clearly present. Stands up to rich food pairings (duck, dim sum, dark chocolate). This is how pu-erh is typically served in Guangdong and Hong Kong dim sum restaurants. |
| sources | traditional, ref-huang-2019 |

### 6c. STRONG (100°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 300 |
| flavors | [earthy, woody, deep, camphor, medicinal] |
| effects | [["digestive", 4], ["grounding", 4], ["warming", 4], ["energy", 2]] |
| character | Deep extraction pulls forward the more assertive character — the camphor/medicinal edge in older sheng, the cocoa-dates depth in ripe. Not everyone's preference but gives the fullest expression of the tea's age and microbial complexity. |
| sources | traditional |

### 6d. Time-axis behavior & gongfu note

> Pu-erh is the quintessential gongfu tea — brewing multiple short
> (10-30 second) infusions in a small pot or gaiwan with heavy leaf
> loading (5-8g per 100ml) yields 8-12+ cups from a single dose.
> The tea evolves meaningfully across infusions: early infusions
> lead with earthy depth and bitterness; middle infusions show
> sweetness and complexity; late infusions fade into a mellow
> brothiness. Serious pu-erh drinkers consider gongfu brewing the
> only way to properly appreciate aged pu-erh.
>
> Western-style brewing (single longer steep) works fine for
> ripe/shou pu-erh and for casual consumption, but misses the
> evolutionary-character aspect that makes pu-erh distinctive.

---

## 7. Safety & heads-up

**Known interactions:**

> - **Caffeine (~30mg/cup)** — lower than most true teas but still
>   stimulating. Standard caffeine cautions apply.
>   `established`
> - **Iron absorption** — tannin content lower than black tea but
>   non-zero; drink between meals if iron-deficient. `attested`
> - **Quality concerns** — cheap commercial pu-erh has historically
>   had pesticide and sometimes microbial contamination issues
>   (ochratoxin A in some factory-produced shou pu-erh). Modern
>   production standards in Yunnan have improved significantly;
>   choose reputable sources. `attested`

**Dosage cautions:**

> WebMD "possibly safe" at moderate consumption (4 cups/day).
> Pregnancy caution: pu-erh contains caffeine, keep below 3 cups/day
> to stay under 300mg total caffeine.

**NOT a concern but sometimes claimed:**

> - **"All pu-erh contains toxic mold"** — Media scare from
>   ochratoxin studies of poor-quality factory shou pu-erh.
>   Authentic, properly-produced pu-erh uses *Aspergillus niger*
>   and *luchuensis*, which do not produce harmful mycotoxins in
>   the tea context. Occasional contamination from poor production
>   hygiene exists but doesn't characterize the category. `attested`
> - **"Pu-erh melts fat"** — Overselling. Pu-erh modestly reduces
>   LDL cholesterol and may support slight weight loss at
>   clinical doses (Jensen 2016: ~1kg difference vs. placebo over
>   12 weeks with 1-3g/day extract). The "fat-burning tea"
>   marketing vastly overstates this. `folk`

---

## 8. History & cultural context

**Plant origin:**

> Pu-erh is made from *Camellia sinensis var. assamica*, the same
> large-leaf variety that grows natively across Yunnan, Myanmar,
> northeast India (Assam), and Laos. Yunnan's ancient tea trees
> (some 500-1000+ years old) are the prized source for *gushu*
> (ancient-tree) pu-erh. Genetic research suggests Yunnan is likely
> the original homeland of *C. sinensis* itself. `verified`

**Historical timeline:**

> - **Han Dynasty (25-220 AD):** Yunnan tea leaves used as currency;
>   compressed for transport along the Tea Horse Road. Some scholars
>   trace pu-erh's origins to this period, though "pu-erh" as a
>   named category came later. `attested`
> - **Tang Dynasty (618-907):** Yunnan's tea-horse trade flourishes;
>   tea compressed into bricks/cakes for long-distance transport to
>   Tibet and Central Asia. The aging that occurred during these
>   months-long journeys is thought to be how pu-erh's defining
>   post-fermentation was first discovered. `attested`
> - **Ming-Qing Dynasties:** Pu-erh becomes tribute tea to the
>   imperial court. Named after the Pu'er (普洱) tea trading town
>   in southern Yunnan. `verified`
> - **Early 20th century:** Yunnan tea trade declines with civil
>   war and Japanese invasion. `verified`
> - **1973:** Kunming Tea Factory develops the *wo dui* (pile
>   fermentation) process to create shou/ripe pu-erh, inspired by
>   Hong Kong demand for aged-tasting pu-erh at lower cost. The
>   process is adopted by Menghai Tea Factory shortly after and
>   refined there. `verified`
> - **1980s-90s:** Pu-erh becomes a collector's market in Hong
>   Kong, Taiwan, and mainland China. Aged vintage pu-erh cakes
>   fetch extraordinary prices. `verified`
> - **2008:** Chinese government grants pu-erh Protected
>   Designation of Origin status — only tea produced in specific
>   Yunnan counties using traditional methods can legally be called
>   "pu-erh." `verified`
> - **2007 bubble and crash:** Speculative investment in pu-erh
>   cakes created a price bubble that crashed in 2007, resetting
>   the market and washing out many speculators. The authentic
>   artisan segment recovered and has grown steadily since.
>   `verified`

**Sheng vs. Shou — the crucial distinction:**

> - **Sheng (生, "raw") pu-erh:** Traditional form. Leaves processed
>   similarly to green tea (withered, pan-fried briefly, rolled,
>   sun-dried), then compressed into cakes and aged naturally for
>   years to decades. Early-life sheng tastes green-tea-adjacent:
>   bitter, astringent, floral. Over 10-30 years, natural microbial
>   activity transforms it into the deep, complex tea collectors
>   prize. Well-stored 20+ year sheng can cost thousands of dollars
>   per cake.
> - **Shou (熟, "ripe") pu-erh:** Invented 1973. *Mao cha* (raw
>   material) is piled (*wo dui*), moistened, covered with cloth,
>   and kept at 50-65°C for 45-60 days. Thermophilic bacteria and
>   fungi — primarily *Aspergillus niger* — drive rapid
>   fermentation, producing pu-erh that tastes similar to aged
>   sheng in 2 months rather than 20 years. More uniform,
>   immediately drinkable, much cheaper. Sometimes considered
>   "fake" by sheng traditionalists, though modern tea scholars
>   generally accept shou as a legitimate tea style in its own
>   right. `verified`

**The microbiology:**

> Pu-erh fermentation is driven by a complex microbial community:
>
> - *Aspergillus niger* — dominant fungus in both aged sheng and
>   shou. Produces enzymes that break down complex polyphenols
>   into simpler compounds like gallic acid, theabrownins, and
>   biologically active secondary metabolites.
> - *Aspergillus luchuensis* — recent taxonomic reclassification
>   of some strains previously called *A. niger*. This reclassification
>   resolved concerns about ochratoxin production since *A. luchuensis*
>   doesn't produce these mycotoxins.
> - Other fungi: *Penicillium*, *Rhizopus*, *Aspergillus glaucus*,
>   *A. fumigatus* (minor).
> - Bacteria: *Bacillus*, *Pseudomonas*, *Lactobacillus*, and
>   various thermophiles during *wo dui*.
>
> The metabolites are the point. *Theabrownins* — the dark pigments
> unique to pu-erh — are produced by this microbial activity and
> are the primary driver of pu-erh's cholesterol-lowering effect
> (Huang et al. 2019, *Nature Communications*). `verified`

**Forms:**

> - **Bing (饼, "cake"):** Round flat cake, 357g standard, ~7 cakes
>   in a traditional bamboo-wrapped *tong*. The most common form.
> - **Zhuan (砖, "brick"):** Rectangular brick. Often for commercial/
>   export markets.
> - **Tuo (沱, "nest"):** Bowl-shaped, 100-250g typical. Convenient
>   for smaller households.
> - **Loose leaf:** Uncompressed; usually lower-grade or used for
>   blending.

**TCM framing:**

> Pu-erh is TCM-warming (Yang), especially shou. Traditionally
> recommended after heavy meals (*xiao ni*, "dissolving grease"),
> for those with cold-pattern digestive issues, and in winter. The
> digestive claim is the oldest and most consistent TCM use of
> pu-erh, now substantially supported by modern mechanistic
> research (Huang 2019). `attested` (TCM framing); `established`
> (cholesterol/metabolic mechanism)

---

## 9. Sources

- `ref-huang-2019` — Huang F et al. 2019. *Theabrownin from Pu-erh
  tea attenuates hypercholesterolemia via modulation of gut
  microbiota and bile acid metabolism*. Nature Communications
  10: 4971. https://www.nature.com/articles/s41467-019-12896-x
  — The primary mechanistic paper; theabrownin → gut microbiota →
  bile acid → cholesterol reduction. Strongest evidence base for
  pu-erh's traditional digestive/lipid claims.
- `ref-jensen-2016` — Jensen GS et al. 2016. *Reduction of body
  fat and improved lipid profile associated with daily consumption
  of a Puer tea extract in a hyperlipidemic population: a randomized
  placebo-controlled trial*. Clinical Interventions in Aging 11:
  367-376. https://pmc.ncbi.nlm.nih.gov/articles/PMC4818050/
  — Human RCT: ~1kg weight difference, improved lipid profile at
  12 weeks with 1-3g/day pu-erh extract.
- `ref-zheng-2024` — Zheng J et al. 2024. *Enhanced Fermentation
  of Pu-Erh Tea with Aspergillus niger: Quality and Microbial
  Community Analysis*. Molecules 29(23): 5647.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11643846/
  — Recent work on the microbial community and metabolite profile.
- `ref-csupor-2016` — Csupor D et al. 2016. *Theanine and Caffeine
  Content of Infusions Prepared from Commercial Tea Samples*.
  Pharmacognosy Magazine 12(45): S26-S29.
  — Pu-erh has practically zero L-theanine (unique among true teas)
  due to microbial degradation. Caffeine content ~17.7 mg/g dry
  weight, moderate.
- `ref-zhou-2018` — Zhou B et al. 2018. *Biodegradation of caffeine
  by whole cells of tea-derived fungi Aspergillus sydowii,
  Aspergillus niger and optimization for caffeine degradation*.
  BMC Microbiology 18: 53. — Documents that *A. niger* degrades
  caffeine during fermentation; explains pu-erh's lower caffeine
  relative to other true teas.
- `ref-gov-2008` — People's Republic of China. Protected
  Designation of Origin for Pu-erh Tea. 2008. — Legal geographic
  protection.
- `ref-shen-nong` — *Shennong's Classic of Materia Medica* (神农
  本草经). Han Dynasty. — Earliest Chinese materia medica reference
  to Yunnan tea; cited as historical basis for pu-erh's digestive
  tradition.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Pu-erh improves with age (like wine)" | `verified` | Demonstrated chemistry via microbial metabolism; not every pu-erh improves, but well-stored sheng genuinely transforms over decades |
| "Only tea made from microbial fermentation" | `verified` | Unique among the six Chinese tea categories |
| "Lowers cholesterol" | `established` | Huang 2019 *Nature Communications* mechanistic paper; multiple human trials |
| "Aids digestion after heavy meals" | `attested` | Traditional Chinese use spans centuries; modern mechanism via gut microbiota modulation |
| "Aspergillus niger drives fermentation" | `verified` | Multiple DNA sequencing studies confirm dominance |
| "Shou pu-erh invented 1973 at Kunming Tea Factory" | `verified` | Well-documented industrial history |
| "Named after Pu'er trading town in Yunnan" | `verified` | Historical record |
| "Used as currency along the Tea Horse Road" | `attested` | Han Dynasty through imperial period; well-attested but not continuous |
| "Contains probiotics" | `folk` | Overclaim — the microbes are dead after drying/storage; their metabolites persist but not live cultures |
| "Pu-erh is always contaminated with mold toxins" | `folk` | Cherry-picked from poor-quality samples; authentic production uses safe fungi |

---

## 11. Research flags & open questions

1. **Sheng vs. shou as separate ingredients?** The most important
   open question for pu-erh specifically. Young sheng, aged sheng,
   and ripe shou are meaningfully different teas — different
   caffeine, different effects, different brewing, different prices.
   Currently treated as one `puerh` ingredient in the Herbanium
   catalog; strong case for eventually splitting into at least
   `puerh-sheng` and `puerh-shou`. Aged sheng variants are a
   collector's field Herbanium doesn't need to represent granularly.

2. **Grounding calibration with lapsang.** Pu-erh and lapsang both
   earn `grounding` 3, from different mechanisms. Future catalog
   entries (ashwagandha, reishi) will need to fit into this
   calibration — those are candidates for `grounding` 4-5 if we
   want to preserve the tea-comparison scale.

3. **Caffeine variability is real and important.** Aged sheng can
   have 40mg+ caffeine; ripe shou often under 25mg. Current single
   number (30mg) is a middle estimate. Young sheng pu-erh behaves
   more like regular green tea caffeine-wise than the "pu-erh
   lower caffeine" general claim suggests.

4. **Storage quality is a huge variable not in the data model.**
   The same cake of sheng pu-erh stored in humid Hong Kong vs. dry
   Kunming will age very differently over 10 years. This isn't
   something Herbanium can surface dynamically; users need to
   learn this from drinking.

5. **Ochratoxin concern — mostly resolved but worth tracking.**
   Early 2010s papers raised concerns about *Aspergillus* strains
   in commercial shou producing ochratoxin A. Taxonomic
   reclassification of these strains as *A. luchuensis* (which
   doesn't produce ochratoxin) has largely resolved the concern,
   but production quality matters. Source carefully.

6. **Traditional-medicine-adjacent claims.** Pu-erh has more
   traditional Chinese medicine claims attached to it (anti-cancer,
   anti-aging, etc.) than Herbanium should reflect. Stuck to the
   well-supported digestive/cholesterol claims; other claims
   flagged as `folk` or omitted.

---

## Addendum — `calm` removed (2026-08-02)

An audit found `calm` shipped at all three brew points (1.5 / 2 / 1)
with nothing in this document behind it. §5 does better than stay
silent — it rules the claim out by name:

> **calm | | Not applicable in the L-theanine sense**

and gives the mechanism one row above, under `focus`: pu-erh "lacks the
L-theanine + caffeine synergy that defines green tea focus — L-theanine
is essentially zero in pu-erh (Csupor 2016) because fermentation
degrades it."

The measurement holds up.

> Csupor D et al. 2016. *Theanine and Caffeine Content of Infusions
> Prepared from Commercial Tea Samples.* Of 37 commercial white, green,
> oolong, black and pu-erh samples assayed by HPLC, **no theanine was
> detected in the pu-erh samples** — practically zero, unique among
> true teas —
> https://www.researchgate.net/publication/293799309_Theanine_and_Caffeine_Content_of_Infusions_Prepared_from_Commercial_Tea_Samples
>
> Solid-state fermentation by tea-derived *Aspergillus* measurably
> degrades pu-erh's alkaloid and amino-acid pool —
> https://pmc.ncbi.nlm.nih.gov/articles/PMC5987490/

This is the sharpest version of the pattern the catalogue keeps
producing: pu-erh is the one true tea where the compound responsible
for tea-calm has been fermented out of the leaf, and it was the tea
shipping `calm` at every brew point. `calm` was not declared on the
ingredient card either — it lived only in the extraction profile, so
the card and the brew view disagreed.

Removed. The sourced picture is `grounding`, `digestive`, `soothing`
and the warm register; §5 rates the mellow, aged character as
`soothing` 2, which is the real felt claim and is not the same claim as
theanine calm.

<!-- sourced-effects: digestive, grounding, soothing -->

---

## Addendum — the register is `comfort`, not `soothing` (2026-08-03)

§5 files this ingredient's affective claim under `soothing`, but the
gloss describes warm relaxation rather than any action on tissue:

> | soothing | 2 | The round, mellow, mature character soothes — especially aged versions |

`soothing` is the **demulcent** register here — mucilage or tannin
acting on irritated surfaces, as in licorice's throat coat, linden's
mucilage, sage's gargle tradition. Roundness and maturity are
character notes. Pu-erh has no demulcent constituent; what ages into
it is a mellower cup, which is a comfort claim.

Transcribed as `comfort` at the same strength. The evidence is
unchanged; the word is corrected.

<!-- sourced-effects: comfort -->

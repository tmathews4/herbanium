# Ingredient Research — Green Tea

> Research-populated file using chamomile v6 / hibiscus v2 as reference
> architecture. First *true tea* researched — introduces caffeine,
> L-theanine, catechin chemistry as a distinct ingredient family.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `green-tea` | matches INGREDIENTS key |
| **display name** | Green Tea | |
| **latin / scientific** | *Camellia sinensis* var. *sinensis* (China/Japan primary) or *C. sinensis* var. *assamica* (India) | Both varieties used; all true tea (green, black, white, oolong, pu-erh) comes from the same species. The difference is in processing, not species |
| **category** | true tea | First true tea in the catalog — introduces caffeine, L-theanine, and catechin chemistry |
| **subcategory** | green (unoxidized) | |
| **also known as** | 绿茶 (lǜchá, Chinese), 緑茶 / 緑色の茶 (ryokucha, Japanese), 녹차 (nokcha, Korean) | Most common named types: sencha, gyokuro, matcha, genmaicha, hojicha (Japanese); longjing (dragonwell), biluochun, gunpowder (Chinese) |

---

## 2. Overview

**One-line essence** (blurb field):

> Grassy, clean, and refreshing — the original focused-calm drink.

**Short description** (ingredient page):

> Green tea is the unoxidized leaf of *Camellia sinensis*. Unlike black tea (fully oxidized) or oolong (partially oxidized), green tea is processed quickly after picking — steamed (Japanese method) or pan-fired (Chinese method) to deactivate the polyphenol oxidase enzymes that would otherwise brown the leaf. This preserves the catechins, amino acids, and chlorophyll that give green tea its distinctive vegetal character. A cup contains moderate caffeine (20-45 mg), meaningful L-theanine, and a complex mix of catechins dominated by EGCG. The caffeine-plus-L-theanine combination produces green tea's signature "alert but calm" effect — different from coffee's pure stimulation.

> **Mechanism note:** Green tea's effects come from a genuine
> multi-compound interaction, not a single active ingredient. The
> three characters are: **caffeine** (stimulant, 20-45 mg per cup vs.
> ~95 mg in coffee), **L-theanine** (an amino acid that increases
> alpha brain wave activity and promotes "alert relaxation"; crosses
> blood-brain barrier; roughly 10-25 mg per cup), and **catechins**
> (primarily EGCG — epigallocatechin-3-gallate — the most-studied
> antioxidant in green tea, accounting for most of the health-claim
> literature on cardiovascular disease, metabolic syndrome, and
> cancer prevention). The caffeine-L-theanine synergy is the
> clinically interesting piece: multiple studies (Haskell et al.
> 2008; Einöther & Martens 2013) show the combination produces
> better focus and attention than caffeine alone, with less
> jitteriness.
>
> The honest counterpoint: the catechin-based health claims (cancer
> prevention, weight loss, cardiovascular protection) are based
> heavily on in vitro and animal studies, with human RCTs more
> equivocal. EGCG at tea-consumption doses is dramatically lower than
> the extract-capsule doses used in most positive trials. "Green tea
> is healthy" is directionally true but often over-claimed.
>
> What's clear: green tea delivers a meaningful dose of antioxidants,
> a distinctive pharmacological experience (caffeine + L-theanine),
> and a long cultural tradition of mindful consumption. What's less
> clear: whether most of the health benefits attributed to green tea
> require consumption levels well above typical enjoyment.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- grassy
- vegetal
- umami

**Aroma notes:**

> Varies dramatically by type. Japanese greens (sencha, gyokuro)
> lean marine/oceanic — "like warm seaweed." Chinese greens
> (longjing, biluochun) lean toasted/chestnut from pan-firing.
> Hojicha (roasted green tea) is nutty-caramel. Genmaicha (with
> roasted brown rice) is popcorn-like.

**Mouthfeel:**

> Light to medium body. Quality greens have pronounced umami
> (savory-sweet) from L-theanine and glutamic acid. Poor brewing
> introduces grassy astringency and catechin bitterness.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [60, 85] | ref-yilmaz-2015, ref-vuong-2011 | Much lower than herbal teas. Above 85°C, EGCG begins degrading and bitterness from catechin over-extraction dominates. Premium Japanese greens brewed as low as 60°C |
| **time range (seconds)** | [120, 300] | ref-yilmaz-2015 | 2-5 minutes. EGCG extraction peaks around 3 min at 85°C; past that, concentration actually *decreases* due to degradation and epimerization |
| **caffeine (mg per ~8oz cup)** | 20-45 | USDA database | Varies by type (gyokuro highest ~70 mg; genmaicha lowest ~15 mg); by brewing temp (higher temp extracts more); and by steep time |
| **dose** | 1 tsp (2-3 g) loose leaf per 6-8oz cup | traditional | Japanese preparation uses more leaf, shorter time; Chinese preparation less leaf, slightly longer |

> **The temperature rule:** Boiling water is actively harmful to
> green tea. Above 90°C, EGCG concentration decreases with time
> rather than increasing (Vuong et al. 2011), and the tea turns
> bitter. The herbal-tea intuition "just use boiling water" is
> specifically wrong here. This is the most common preparation
> mistake in the Western tea-drinking world.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 3 | L-theanine produces genuine calming effect independent of caffeine's stimulation |
| sleepy | | Caffeine content rules out significant sedation |
| settle | 1 | Traditional post-meal digestive use; mild |
| comfort | 2 | |
| focus | 4 | **Primary effect** — caffeine + L-theanine combination demonstrated to improve attention, alertness, and task performance (Haskell et al. 2008) |
| energy | 3 | Moderate, smoother than coffee due to L-theanine's moderating effect |
| cooling | 2 | Cultural "cooling" (especially in traditional Chinese medicine framing); mild cooling sensation from catechins |
| bitterness | 2 | Catechins are genuinely bitter; character ranges from 1 (well-brewed gyokuro) to 4 (over-steeped, over-heated) |

---

## 6. Extraction profiles

> Research status: **sourced**. Numbers from Yilmaz et al. 2015
> (optimal 85°C/3 min, max EGCG at 50.69 mg/100 mL), Vuong et al.
> 2011 (catechin time-temp interdependence), and traditional
> Japanese/Chinese brewing practice.

### 6a. GENTLE (65°C, 90s / 1.5 min)

| Field | Value |
|-------|-------|
| tempC | 65 |
| timeS | 90 |
| flavors | [grassy, sweet, umami, vegetal] |
| effects | [["calm", 2], ["focus", 2], ["energy", 1]] |
| character | Japanese premium-style brewing — favors L-theanine over catechins and caffeine, producing a sweet-umami cup with minimal bitterness. How gyokuro and high-grade sencha are traditionally brewed. |
| sources | ref-monobe-2018, traditional Japanese practice |

### 6b. STANDARD (80°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 80 |
| timeS | 180 |
| flavors | [grassy, vegetal, clean] |
| effects | [["focus", 4], ["energy", 3], ["calm", 3]] |
| character | The canonical cup — balanced catechin-caffeine-theanine extraction, the focus-alert-calm effect profile most commonly attributed to green tea. |
| sources | ref-yilmaz-2015, ref-vuong-2011 |

### 6c. STRONG (85°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 300 |
| flavors | [grassy, vegetal, bitter, astringent] |
| effects | [["energy", 3], ["focus", 4], ["bitterness", 3]] |
| character | Maximum EGCG extraction per Yilmaz 2015 (50.69 mg/100 mL at 85°C/3 min; 5 min pushes further but with more bitterness). Tips toward astringent and harsh. |
| sources | ref-yilmaz-2015 |

### 6d. Time-axis behavior (STANDARD 80°C held constant, time varied)

Green tea has the most complex time-axis behavior of any ingredient
researched so far. Different compound classes extract at different
rates and sometimes *degrade* over time, producing multi-stage
character evolution:

| timeS | % of peak character | character shift from STANDARD | effect shift from STANDARD |
|-------|--------------------|-------------------------------|---------------------------|
| 60 (1 min) | ~50% | Very light, sweet-umami forward, minimal caffeine | focus −2, energy −2 |
| 180 (3 min) | ~100% | **Baseline — the STANDARD profile as in 6b** | baseline |
| 300 (5 min) | ~105% | Fuller body, catechin-forward, more bitter and astringent | energy +0, focus +0, bitterness +2 |
| 600 (10 min) | ~95% | EGCG starts degrading; caffeine continues extracting; becomes astringent-bitter without character gain | energy +1, bitterness +3 |
| 1200 (20 min) | ~70% | Significantly degraded; bitter, dull, some compounds oxidized | bitterness +3 |

**Algorithm note:** Green tea time is *non-monotonic with degradation*
— unlike peppermint's forgiving monotonic curve, green tea actively
gets worse past 5 min at 80°C. EGCG peaks around 3 min and starts
degrading; caffeine continues extracting (more bitterness and
stimulation); epimerization shifts catechin balance. This is the
*most aggressive extraction management* of any ingredient researched,
which is why green tea brewing traditions emphasize precision.

**Cross-temperature note:** The degradation threshold shifts with
temperature. At 65°C, tea can be steeped 2-5 min with minimal
degradation and lots of L-theanine. At 85°C, 3 min is peak and past
4 min is diminishing. At 95°C (which is too hot for green tea but
common in Western preparation), EGCG degrades from the first minute.

**Multiple-infusion note:** Unlike most herbals, high-quality green
tea is traditionally infused multiple times (3-5 infusions), each
with different character. First infusion: L-theanine sweet/umami
dominant. Second: caffeine and catechin balance. Third+: tannins
and whatever remains. The app's current single-infusion model may
under-represent how good green tea is actually drunk.

Sources: ref-yilmaz-2015, ref-vuong-2011, ref-monobe-2018.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> - **Caffeine sensitivity** — Green tea contains 20-45 mg per cup;
>   sensitive individuals may experience jitter, insomnia, rapid
>   heart rate. Much less than coffee (~95 mg), but genuine. Evening
>   consumption can disrupt sleep.
> - **Iron absorption** — Tannins and catechins significantly
>   reduce non-heme iron absorption — more strongly than hibiscus's
>   polyphenol effect. People with iron-deficiency anemia should
>   avoid drinking green tea with iron-rich meals. Separate by at
>   least 1 hour.
> - **Pregnancy** — Caffeine is the concern. Guidelines vary, but
>   most recommend limiting total daily caffeine to 200 mg during
>   pregnancy; green tea fits within that but multiple cups plus
>   other sources can exceed it. Also contains EGCG, which has
>   some theoretical concern at high doses (it affects folate
>   metabolism), though clinical significance at tea-consumption
>   levels is unclear.
> - **Blood-thinning medications** — Vitamin K content is low in a
>   brewed cup but matters for high-volume consumption or extract
>   use. Warfarin patients should mention green tea consumption to
>   their care team.
> - **Liver toxicity (supplement doses only)** — High-dose green
>   tea *extract* supplements (>800 mg EGCG/day) have been
>   associated with rare cases of hepatotoxicity. This is an
>   extract-level concern, not a tea concern. A cup of tea contains
>   roughly 50 mg EGCG — orders of magnitude below the problematic
>   supplement doses.

**NOT a concern but sometimes claimed:**

> - **"Acid reflux from green tea"** — Unlike peppermint's LES
>   relaxation concern, green tea's acidity (pH ~5.5-6) is
>   relatively mild and doesn't typically trigger reflux. Some
>   caffeine-sensitive GERD patients may react to the caffeine
>   component, but green tea itself isn't a major reflux trigger.
> - **"Green tea stains teeth as much as coffee"** — Staining is
>   much less than coffee or black tea; the tannin content is
>   significantly lower than oxidized teas.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| caffeine | 20-45 mg | alertness, focus, mild jitter at high intake | high |
| L-theanine | 10-25 mg | "alert calm" — alpha brain wave increase, attention without anxiety | high |
| EGCG (epigallocatechin-3-gallate) | ~50 mg at optimal brew (Yilmaz 2015) | primary antioxidant; cardiovascular/metabolic benefit literature | high |
| EGC, ECG, EC, other catechins | collectively significant | antioxidant, astringency | high |
| theaflavins | low in green tea (higher in black) | | — |
| vitamin C | trace to ~5 mg | antioxidant | medium |

**characterizedPct estimate:**

> ~90%. True tea is the most-studied beverage in the chemistry
> literature — almost everything is characterized, including
> cultivar-level and processing-level variation.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-yilmaz-2015 | Yilmaz C, Vural AB, Gokmen V. (2015). Effects of different brewing conditions on catechin content and sensory acceptance in Turkish green tea infusions. *Journal of Food Science and Technology*. Optimal 85°C/3 min, EGCG max 50.69 mg/100 mL. PMC4573099. | extraction chemistry |
| ref-vuong-2011 | Vuong QV, Stathopoulos CE, Golding JB, Roach PD. (2011). Effect of brewing temperature and duration on green tea catechin solubilization: Basis for production of EGC and EGCG-enriched fractions. *Separation and Purification Technology*. Temperature/time interdependence. | extraction chemistry |
| ref-monobe-2018 | Monobe M, Ema K, Tokuda Y, Maeda-Yamamoto M. (2018). Low-temperature green tea extraction preserves L-theanine. | extraction (low-temp L-theanine) |
| ref-haskell-2008 | Haskell CF, Kennedy DO, Milne AL, Wesnes KA, Scholey AB. (2008). The effects of L-theanine, caffeine and their combination on cognition and mood. *Biological Psychology*, 77(2):113-122. | clinical (L-theanine + caffeine) |
| ref-einother-2013 | Einöther SJ, Martens VE. (2013). Acute effects of tea consumption on attention and mood. *American Journal of Clinical Nutrition*, 98(6):1700S-1708S. | review (cognition) |
| ref-hu-2018 | Hu J, Webster D, Cao J, Shao A. (2018). The safety of green tea and green tea extract consumption in adults — Results of a systematic review. *Regulatory Toxicology and Pharmacology*. | safety review |
| ref-khokhar-2002 | Khokhar S, Magnusdottir SGM. (2002). Total phenol, catechin, and caffeine contents of teas commonly consumed in the UK. *Journal of Agricultural and Food Chemistry*. | composition analysis |
| ref-cabrera-2006 | Cabrera C, Artacho R, Giménez R. (2006). Beneficial effects of green tea — a review. *Journal of the American College of Nutrition*. | review |

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | fact | established | All "true tea" — green, black, white, oolong, pu-erh — comes from the same plant, *Camellia sinensis*. The differences come entirely from how the leaves are processed, not from different species. | well-established botanical fact |
| 2 | fact | verified | Green tea is the only common drink containing L-theanine, an amino acid that crosses the blood-brain barrier and increases alpha wave activity — the brain pattern associated with relaxed wakefulness. Combined with caffeine, it produces the "alert calm" profile that sets green tea apart from coffee. | ref-haskell-2008, ref-einother-2013 |
| 3 | fact | verified | Boiling water actively damages green tea — above 85°C, the antioxidant EGCG begins degrading, and above 90°C the tea turns bitter. The ideal temperature is 70-85°C, which is a common Western brewing mistake. | ref-yilmaz-2015, ref-vuong-2011 |
| 4 | culture | established | Japanese green tea is steamed immediately after picking (producing marine/oceanic notes); Chinese green tea is pan-fired (producing toasted/chestnut notes). Same plant, same category, genuinely different cups. | tea-production convention |
| 5 | fact | established | High-quality green tea is traditionally infused three to five times, each infusion producing a different character — the first is sweet and umami-rich from L-theanine; later infusions are more astringent and caffeinated. | traditional tea practice |

---

## 10b. Folk & cultural attributions

| Claim | Confidence | Notes | Source or status |
|-------|-----------|-------|------------------|
| Green tea's use in China dates to the Tang Dynasty (618-907 CE), when Lu Yu wrote the *Cha Jing* (Classic of Tea) around 760 CE | verified | The *Cha Jing* is a real primary text, still in print and translated; Lu Yu is a documented historical figure. | primary text exists |
| The Japanese tea ceremony (*chanoyu* / way of tea) was codified by Sen no Rikyū in the 16th century | verified | Historical figure, documented development of the ceremony. | historical record |
| Buddhist monks introduced tea to Japan from China in the 9th century (Kūkai, Saichō, later Eisai) | attested | Documented historical tradition; Eisai's role in 1191 bringing seeds from China is particularly well-documented in *Kissa Yōjōki* (Drink Tea and Prolong Life). | historical record, primary texts exist |
| Matcha was developed when powdered green tea, originally used in Song Dynasty China, was preserved in Japan after its Chinese tradition faded | attested | Historically accurate; the powdered-tea tradition shifted from the Song Dynasty context to Japanese ceremonial use. | tea-history consensus |
| The East India Company's monopoly on Chinese tea led directly to the Boston Tea Party (1773) and eventually to British colonization of India for tea cultivation | attested | Historical chain of events well-documented in colonial history; specific causal links appropriately complex. | historical record |
| Gyokuro ("jade dew") tea is shaded from sunlight for 20+ days before harvest, which boosts L-theanine content | verified | Real agricultural practice with measurable chemistry effect — shading reduces photosynthesis, altering amino acid/catechin ratio toward more L-theanine. | agricultural chemistry |
| Green tea was traditionally used in Chinese medicine for "cooling" internal heat, especially in summer | attested | Traditional Chinese medicine framing is real and well-documented; the "cooling" attribution is systematic within TCM categorization. | TCM literature |
| The *Book of Tea* (1906) by Okakura Kakuzō introduced Japanese tea philosophy to Western readers | verified | Real book, translated widely, still in print. | primary text exists |

---

## 11. Miscellaneous & uncaptured

**Personal notes:**

> [TOMMY] — blank for now

**Questions that weren't resolvable from sources:**

> - Whether the caffeine-L-theanine synergy holds at typical tea
>   consumption levels or whether the clinical studies used higher
>   L-theanine doses than a cup delivers (some used 100-200 mg
>   L-theanine supplements vs. ~15 mg in a cup)
> - Whether most of the catechin-based health benefits (cardiovascular,
>   cancer prevention) require extract-level doses or manifest at
>   normal tea consumption
> - Practical L-theanine content variation across cultivars and
>   processing methods — documented to vary significantly but
>   cup-level numbers are hard to pin down

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 3 | Extensively studied; temp/time relationships well-characterized |
| Effects ratings | 3 | Focus-as-primary strongly supported; calm from L-theanine well-documented |
| Extraction profiles | 3 | Most-studied extraction chemistry of any ingredient researched |
| Safety notes | 3 | Well-characterized; caffeine and iron absorption are the real concerns |
| Facts | 3 | Strong blend of verified chemistry + verified cultural history |

**Overall status:**
- [x] Verified — confident enough to ship with multi-infusion UX noted as future work

---

## Notes for this scaffold

**Generalizable lessons from green tea research:**

1. **True tea is a different ingredient class.** First ingredient
   with caffeine, first with a "stimulant + relaxant" dual profile,
   first where boiling water is actively harmful. The extraction
   sensitivity is on a different order than herbals — chamomile
   tolerates 10 minutes at 100°C; green tea degrades past 3 min at
   85°C. The UI should probably distinguish "true tea" brewing
   parameters from "herbal" parameters more clearly.

2. **Multiple infusions is a gap in the data model.** Green tea
   (and oolong, and pu-erh) are traditionally brewed multiple times
   from the same leaf, with meaningfully different character each
   time. The current single-infusion model is correct for herbals
   but under-represents the true-tea experience. Worth thinking
   about eventually, probably a v2 feature.

3. **Caffeine content adds a safety dimension.** First ingredient
   where pregnancy guidance is caffeine-based rather than
   mechanism-based, first where "evening consumption" genuinely
   affects sleep, first where iron absorption is a more significant
   concern than hibiscus's mild effect. These translate to real
   user-facing differences in how the ingredient gets surfaced.

4. **Health-claim literature is stratified.** Clinical evidence for
   green tea splits sharply: caffeine + L-theanine cognitive effects
   have decent human RCT support at modest doses, while catechin-
   based disease-prevention claims largely rely on in vitro/animal
   studies or high-dose extract trials. The app should surface the
   cognitive effects confidently and hedge on the disease-prevention
   claims, which is the opposite of most marketing framings.

5. **Cultural-history depth is different from herbals.** Green tea
   has verified primary-source history (Lu Yu's *Cha Jing*, Eisai's
   *Kissa Yōjōki*, Rikyū's codification of *chanoyu*, Okakura's
   *Book of Tea*) spanning 1,200+ years. Section 10b's confidence
   levels skew significantly higher than for florals because real
   texts exist. This will likely hold for other true teas and for
   some highly-documented herbals (chamomile's Ebers Papyrus
   reference) but not for most of the catalog.

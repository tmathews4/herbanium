# Ingredient Research — Rooibos

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `rooibos` | matches existing INGREDIENTS key |
| **display name** | Rooibos | |
| **latin** | *Aspalathus linearis* | Fabaceae family (legume) — NOT a Camellia |
| **category** | herbal | |
| **subcategory** | | |
| **also known as** | red bush, redbush, rooibostee, bush tea | Afrikaans *rooi bos* = "red bush" |

---

## 2. Overview

**One-line essence:**

> Sweet, red, forgiving — the evening tea from South Africa's Cederberg
> that forgives over-steeping and welcomes a second cup.

**Short description:**

> Rooibos is a needle-leafed shrub that grows only in the Cederberg
> mountains of South Africa's Western Cape — cultivation elsewhere has
> repeatedly failed. The harvested leaves are bruised, oxidized, and
> sun-dried to produce the signature red-brown color and honey-sweet
> flavor. Caffeine-free and low in tannins, rooibos became a global
> wellness drink in the 20th century, though its "traditional tea"
> status is more colonial invention than indigenous practice.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- honey
- woody
- vanilla
- sweet

**Aroma notes:**

> Distinctive honey-and-dried-wood character with faint caramel and
> a vanillic sweetness. The aroma is immediately identifiable — no
> other common tea smells like rooibos.

**Mouthfeel:**

> Round, full-bodied, almost syrupy at strong concentrations. Low in
> tannins so minimally astringent. Forgives long steeping without
> turning bitter — a feature that distinguishes it from Camellia
> sinensis teas.

**Basic tastes:**

> `bitter` (0-1) — essentially absent at any reasonable brewing. This
> is one of rooibos's defining features. The natural sweetness comes
> through without the tannic bite of true teas.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | traditional, established | Full boil is canonical; unlike delicate greens/whites, rooibos benefits from aggressive extraction |
| **time range (seconds)** | [300, 600] | traditional | 5-10 min. Longer steeps continue to sweeten the cup rather than ruin it — there's essentially no "over-steeped" rooibos |
| **caffeine (mg per ~8oz cup)** | 0 | established | Zero caffeine; suitable for evening and pregnancy |
| **dose** | 1 tsp per 200ml | traditional | Generous; hard to overdose |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| soothing | 4 | The defining mood — warm, sweet, round. Century of global positioning as "comfort in a cup" |
| digestive | 2 | Mild. Some clinical support for gastrointestinal benefits but evidence is limited |
| grounding | 2 | The sweet, earthy character and full body read as grounding rather than uplifting |
| calm | 2 | Caffeine-free and traditionally evening-associated |
| warming | 1 | Oxidized and served hot but not strongly warming in TCM terms — closer to neutral |
| focus | | Not applicable |
| energy | | Not applicable (caffeine-free) |
| cooling | | Not applicable |
| sleepy | | Not a sedative herb — doesn't induce sleepiness directly |

> **Vocabulary note:** Previous app data had
> `[["comfort", 4], ["settling", 3]]`. Per `docs/vocabulary.md`:
> `comfort` → `soothing`, `settling` → `digestive`. Digestive rating
> lowered from 3 to 2 given the modest clinical evidence.

> Effect ratings are conservative. The 2024 systematic review
> (Speer et al., *Beverages*) of 8 human trials (175 participants)
> concluded "insufficient evidence to definitively support the
> potential health benefits." Traditional claims for sleep aid,
> colic relief, and blood pressure remain largely folk or
> modest-RCT territory.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced**. Parameters from South African traditional
> practice and commercial brewing guidance. Academic extraction chemistry
> literature for rooibos is thinner than for Camellia sinensis but
> consistent on one point: rooibos is remarkably forgiving.

### 6a. GENTLE (90°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 240 |
| flavors | [honey, sweet, light] |
| effects | [["soothing", 2], ["digestive", 1]] |
| character | A gentler rooibos — the honeyed top notes lead, the deeper wood-vanilla notes stay quiet. Useful as a base when blending with delicate florals (rose, chamomile) that full-strength rooibos would dominate. |

### 6b. STANDARD (100°C, 360s / 6 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 360 |
| flavors | [honey, woody, vanilla, sweet] |
| effects | [["soothing", 4], ["digestive", 2], ["grounding", 2]] |
| character | The canonical rooibos cup — deep amber-red, honey-and-wood sweetness, the full round body that made this tea a global comfort drink. |

### 6c. STRONG (100°C, 600s / 10 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 600 |
| flavors | [honey, woody, vanilla, caramel, deep] |
| effects | [["soothing", 5], ["digestive", 3], ["grounding", 3], ["warming", 2]] |
| character | A deep, almost syrupy extraction. The caramel-molasses notes emerge. Some drinkers prefer this for blending with spices (chai-style) where the rooibos needs to stand up to ginger/cardamom. |

### 6d. Time-axis behavior

> Unlike true teas where strong = bitter, rooibos strong = sweeter
> and deeper. The phenolic compounds in rooibos don't include the
> astringent tannins of Camellia sinensis; they're dihydrochalcones
> and flavonols that stay soluble and palatable across long extraction.
>
> Practical implication: forget a rooibos cup on your desk for an
> hour, come back, and it's still drinkable — often better than when
> you walked away. This is why rooibos is the traditional base for
> "cold brew" iced teas in South Africa and increasingly elsewhere.

---

## 7. Safety & heads-up

**Known interactions:**

> Rooibos is one of the safest teas studied — no major interactions
> reported in the clinical literature. Caffeine-free makes it
> pregnancy-compatible per most obstetric guidance, though heavy
> daily use (6+ cups) hasn't been systematically studied in pregnancy.
> `established`

**Dosage cautions:**

> Essentially none at normal consumption. One case report of liver
> enzyme elevation with very heavy daily use exists but is not a
> population-level concern.

**NOT a concern but sometimes claimed:**

> - **"Rooibos cures colic"** — The 1968 Theron book popularized this
>   claim and drove much of the 20th-century commercialization.
>   No controlled trials. `folk`
> - **"Rooibos lowers blood pressure significantly"** — ACE inhibition
>   is demonstrated in vitro (Persson 2010), but the two human trials
>   on blood pressure showed no significant effect. The effect, if
>   real, is modest. `attested`

---

## 8. History & cultural context

**Origin and cultivation:**

> Rooibos grows naturally only in the Cederberg mountain range of
> South Africa's Western Cape province — a 100-km strip of
> Mediterranean climate where decades of attempted cultivation
> elsewhere (Australia, California, China) have failed. The EU
> granted rooibos PDO (Protected Designation of Origin) status in
> May 2021, legally restricting the name to South African product.
> `verified`

**Indigenous history — contested:**

> The standard commercial narrative credits the Khoisan people with
> "centuries" of rooibos tea tradition. The ethnobotanical evidence
> is thinner than this narrative suggests. Gorelik's 2017
> ethnographic review (*Rooibos: An Ethnographic Perspective*)
> found that while Khoisan people knew the plant, no documented
> evidence supports pre-colonial tea preparation from it, and no
> Khoi or San vernacular names exist — all rooibos names are
> Afrikaans, Dutch, or English. The "tea tradition" may be largely
> a colonial-era innovation by Dutch settlers looking for a local
> substitute for expensive imported Chinese tea. `attested`
>
> This matters because in 2018, after a decade of negotiation, the
> Khoisan people were formally recognized as traditional knowledge
> holders and receive 1.5% of industry profits as compensation.
> Whether this recognition reflects historical reality or modern
> justice-oriented revision is genuinely contested in the
> ethnographic literature — the Herbanium position is that both
> framings deserve acknowledgment.

**Commercial history — verifiable:**

> - **1772:** Swedish botanist Carl Thunberg documents wild rooibos
>   plants and Khoisan use of them during his Cape expedition —
>   earliest verifiable European record. `verified`
> - **1904:** Benjamin Ginsberg, a Russian immigrant, begins
>   commercial marketing of "Mountain Tea" from the Cederberg.
>   `verified`
> - **1930:** Dr Le Fras Nortier (local doctor) develops the seed
>   germination method that enabled agricultural cultivation.
>   Received honorary doctorate from Stellenbosch 1948 for this
>   work. `verified`
> - **1931 (CTC for Camellia sinensis, for comparison):** William
>   McKercher invents Crush-Tear-Curl at Borbam Tea Estate in
>   Assam — rooibos doesn't use this process but benefited from
>   parallel industrialization of tea drying.
> - **1968:** Dr Annetjie Theron publishes *Allergies: An Amazing
>   Discovery* claiming rooibos soothed her infant's colic. The
>   book catalyzed rooibos's rise as a "wellness beverage."
>   `attested` (the book exists; the medical claims are folk)
> - **World War II:** Asian tea imports to Europe disrupted; rooibos
>   demand surged as a substitute. `verified`
> - **2013:** South African government issues PDO protection.
>   `verified`
> - **2021 (May):** EU grants PDO status. `verified`

**Green vs. red rooibos:**

> "Red" rooibos is oxidized (fermented) in piles before drying.
> "Green" rooibos is dried without oxidation, similar to how green
> tea differs from black tea. Green rooibos was developed in 1995
> by the Agricultural Research Council (Infruitec) in South Africa
> and has a grassier, less sweet profile with higher aspalathin
> content. Red is the global standard. `verified`

---

## 9. Sources (reference-id, URL, confidence)

- `ref-marnewick-2011` — Marnewick JL et al. 2011. *Effects of rooibos
  (Aspalathus linearis) on oxidative stress and biochemical parameters
  in adults at risk for cardiovascular disease*. J Ethnopharmacol
  133(1): 46-52. https://pubmed.ncbi.nlm.nih.gov/20833235/
  — 40 participants, 6 weeks, 6 cups/day: significant LDL reduction,
  improved redox status. Primary clinical support.
- `ref-speer-2024` — Speer K et al. 2024. *The Effect of Rooibos Tea
  Consumption on Human Health Outcomes: A Systematic Literature
  Review*. Beverages 10(4): 113. https://www.mdpi.com/2306-5710/10/4/113
  — 8 studies, 175 participants total, mixed findings; "insufficient
  evidence to definitively support benefits."
- `ref-persson-2010` — Persson IA et al. 2010. *Tea flavanols inhibit
  angiotensin-converting enzyme activity and increase nitric oxide
  production in human endothelial cells*. J Pharm Pharmacol 62(1):
  102-109. — ACE inhibition mechanism.
- `ref-gorelik-2017` — Gorelik B. 2017. *Rooibos: An Ethnographic
  Perspective*. Stellenbosch University. — Ethnographic revision of
  indigenous-tradition narrative.
- `ref-thunberg-1772` — Thunberg CP. Travels in Europe, Africa, and
  Asia, 1770-1779. — Earliest European documentation.
- `ref-eu-pdo-2021` — European Union. Commission Implementing
  Regulation (EU) 2021/1166 of 15 July 2021. — PDO designation.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Khoisan have made rooibos tea for centuries" | `folk` | Contested — no pre-colonial evidence per Gorelik 2017; marketing-driven narrative |
| "Rooibos cures infant colic" | `folk` | Popularized by Theron 1968 book; no controlled trials |
| "Rooibos is a sleep tea" | `folk` | Commercial framing; caffeine-free but not sedating |
| "Only grows in the Cederberg" | `verified` | Repeatedly confirmed; EU PDO status |
| "Contains unique aspalathin and nothofagin" | `verified` | C-glucosyl dihydrochalcones unique to this species |
| "Caffeine-free and low tannin" | `established` | Chemistry well-documented |
| "Lowers cholesterol at 6 cups/day" | `attested` | Marnewick 2011 RCT supports; not replicated in larger trials |
| "Lowers blood pressure" | `attested` | In vitro ACE inhibition confirmed; human BP trials not significant |
| "Benjamin Ginsberg commercialized it in 1904" | `verified` | Historical record |
| "Le Fras Nortier solved seed germination in 1930" | `verified` | Historical record |

---

## 11. Research flags & open questions

1. **Indigenous-tradition claim is contested.** The standard "centuries
   of Khoisan use" narrative doesn't hold up to ethnographic review.
   Herbanium's copy should probably use "traditionally prepared in
   the Cederberg" rather than "used by the Khoisan for centuries" —
   the former is defensible, the latter is folk.

2. **Clinical evidence base is modest.** The 2024 systematic review
   covered only 8 human trials totaling 175 participants. Commercial
   claims routinely exceed what's supported. Effect ratings here
   lean conservative.

3. **Green vs. red as separate ingredients?** Green rooibos has
   meaningfully different chemistry (higher aspalathin, less oxidation)
   and flavor (grassier, less sweet). Future consideration: split
   into `rooibos-red` and `rooibos-green` as separate catalog entries.
   Currently combined under `rooibos` referring to the common red/
   fermented version.

4. **Pregnancy safety data is thinner than commonly stated.** While
   caffeine-free makes rooibos generally pregnancy-friendly, no large
   RCTs have specifically studied heavy daily use in pregnancy. Most
   obstetric "safe" designations are by caffeine-absence inference
   rather than direct study.

---

## Addendum — the register is `comfort`, not `soothing` (2026-08-03)

§5 rates this ingredient's primary affective claim under `soothing`,
but its own gloss describes something else:

> | soothing | 4 | The defining mood — warm, sweet, round. Century of global positioning as "comfort in a cup" |

`soothing` in this catalogue is the **demulcent** register — the
materia medica action where mucilage or tannin acts on irritated
tissue. Licorice's throat coat, linden's mucilage, sage's gargle
tradition. It is a claim about the body's surfaces.

The gloss quotes the phrase directly: "comfort in a cup". Rooibos has
low tannin and a full sweet body, and that is the whole basis — a
cup that feels good to meet, not one that acts on the throat.

Transcribed as `comfort` at the same strength. Nothing about the
evidence changes; the word does.

<!-- sourced-effects: comfort -->

<!-- superseded-effects: soothing -->


---

## Addendum — prose claim audit (2026-08-23)

**"Protected by a South African geographic indication in 2014 — only
Cederberg-grown rooibos can carry the name internationally."** The
INTERNATIONAL protection is the EU Protected Designation of Origin,
granted in 2021, which made rooibos the first African product to hold
one. South African domestic standards predate that, but they are not
what stops the name being used abroad, and 2014 is not the year of
either. Corrected to the PDO. `verified` (2021 PDO)

<!-- retracted: geographic indication in 2014 -->

# Ingredient Research — Gunpowder Tea

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> Zhejiang Pingshui pellet-rolled green tea — the ancestor of
> Moroccan mint tea and one of the earliest Chinese green teas
> exported to Europe.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `gunpowder` | matches existing INGREDIENTS key |
| **display name** | Gunpowder | |
| **latin** | *Camellia sinensis var. sinensis* | Uses mature leaves (unlike most greens which use buds/young leaves) — more similar to lapsang souchong's leaf selection principle |
| **category** | true tea | |
| **subcategory** | green (rolled) | |
| **also known as** | Zhū chá (珠茶, "pearl tea"); Pingshui gunpowder (authentic Zhejiang); Pinhead gunpowder (premium smaller-pellet grade); Temple of Heaven (brand name); Formosa gunpowder (Taiwanese variant, often oolong-processed); Hyson / Green Pearl Bohea (historical European names) |

---

## 2. Overview

**One-line essence:**

> The pellet-rolled green tea — one of the earliest Chinese teas
> to reach Europe, the enduring base of Moroccan mint tea, and
> surprisingly stronger than its grade suggests.

**Short description:**

> Gunpowder is a Chinese green tea where each leaf is individually
> rolled into a small pellet, giving the category its English name
> (from British observers who thought the pellets resembled
> firearm gunpowder). Originated in Zhejiang Province's Pingshui
> region during the Tang Dynasty (618-907 AD). The rolling preserves
> flavor and extends shelf life, which made it one of the earliest
> Chinese teas exported to Europe — and, later, the universal base
> for Maghrebi mint tea across North Africa. Bolder and more
> assertive than most other Chinese greens.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- vegetal
- smoky
- nutty
- brisk
- grassy

**Aroma notes:**

> Forward, vegetal, sometimes described as "peppery-grass." Unlike
> delicate Japanese greens, gunpowder has an assertive aromatic
> profile — the mature-leaf plucking and higher processing
> temperatures produce a thicker, smokier register. Quality
> Pingshui gunpowder has a honeyed note beneath the vegetal/smoky
> top; cheap gunpowder is mostly vegetal-smoky with less
> complexity.

**Mouthfeel:**

> Full-bodied for a green tea — noticeably thicker than sencha or
> Longjing. Moderate astringency. The rolled pellets unfurl slowly,
> which means extraction happens gradually across the steeping
> window — this is part of why gunpowder handles high leaf-to-water
> ratios (Moroccan mint tea style) without becoming harsh.

**Basic tastes:**

> - `bitter` (2) — present but integrated; higher than Longjing or
>   Japanese greens, lower than over-brewed sencha
> - `astringent` (2) — modest; the rolled form moderates extraction
> - `sweet` (1-2) — subtle; quality Pingshui has honeyed notes

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [75, 85] | traditional | Forgiving compared to delicate greens — tolerates up to 85°C without turning unpleasant, unlike gyokuro which breaks down above 70°C |
| **time range (seconds)** | [60, 180] | traditional | 1-3 min Western style. Pellets unfurl gradually, extending effective steep time. Can infuse 3-5 times. |
| **caffeine (mg per ~8oz cup)** | 35 | Hicks 1996; gunpowder trade data | Higher than most green teas — mature-leaf plucking + tight rolling = more caffeine per dry gram extracted. "Some of the highest caffeine in green tea" per Stories About Tea |
| **dose** | 1 tsp (~2-3g) per 200ml | traditional | Pellets are dense — use less than you'd expect from visual volume |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| focus | 3 | The classic green-tea focus signature — caffeine + L-theanine — but less refined than Longjing or sencha. More "alert" than "clear" |
| energy | 3 | Higher caffeine than typical green tea (~35mg). The tea that kept soldiers and sailors awake on long voyages |
| cooling | 2 | TCM Yin; unoxidized green tea character |
| uplifting | 2 | The smoky-bright character lifts in a less floral way than Longjing |
| digestive | 2 | Central to Maghrebi tradition — gunpowder mint tea is the standard after-meal digestive across North Africa |
| warming | | Opposite direction |
| calm | 1 | L-theanine contribution present but not primary |
| soothing | | Not the register — gunpowder is too assertive |
| grounding | | Not applicable |
| sleepy | | Opposite direction |

> **Vocabulary stress test — passed.** Gunpowder fits comfortably
> in the vocabulary without stretching any effect. The `digestive`
> 2 captures the Maghrebi post-meal tradition; `energy` 3 reflects
> the caffeine advantage over other greens.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from Zhejiang traditional
> practice, Moroccan mint tea preparation standards, and general
> Chinese green-tea brewing literature.

### 6a. GENTLE (75°C, 60s / 1 min)

| Field | Value |
|-------|-------|
| tempC | 75 |
| timeS | 60 |
| flavors | [vegetal, grassy, bright] |
| effects | [["focus", 2], ["energy", 2], ["cooling", 2]] |
| character | A lighter approach suited for premium Pinhead gunpowder where the honeyed notes deserve preservation. Pellets haven't fully unfurled; the cup is pale and clean. Works for multi-infusion brewing — first infusion quick, subsequent infusions longer. |

### 6b. STANDARD (80°C, 120s / 2 min)

| Field | Value |
|-------|-------|
| tempC | 80 |
| timeS | 120 |
| flavors | [vegetal, smoky, nutty, brisk] |
| effects | [["focus", 3], ["energy", 3], ["cooling", 2], ["uplifting", 2], ["digestive", 2]] |
| character | The canonical gunpowder cup — full vegetal-smoky character, olive-to-yellow-green liquor, assertive but not harsh. The style most Western drinkers encounter. |

### 6c. STRONG (85°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 180 |
| flavors | [vegetal, smoky, brisk, deep] |
| effects | [["focus", 3], ["energy", 4], ["warming", 1], ["digestive", 2]] |
| character | Deeper extraction — useful as the base for Maghrebi mint tea (where mint and sugar will mask sharper extraction) or for iced/cold brewing. Pushes the caffeine forward. |

### 6d. Maghrebi mint tea — a special case

> The canonical preparation of gunpowder in North Africa is
> Moroccan/Maghrebi mint tea, which uses gunpowder as the
> assertive base for a high-leaf, heavy-mint, heavily-sweetened
> preparation. Standard recipe:
>
> - Rinse pellets briefly with boiling water (discard)
> - Add back boiling water with generous fresh mint and sugar
> - Steep 3-5 minutes, often kept hot for multiple servings
>
> This tradition dates to the 18th-19th century introduction of
> Chinese gunpowder tea along the trans-Saharan trade routes. The
> standard serving at Maghrebi gatherings is three glasses in
> succession, progressively sweeter — each with different
> symbolic meaning in the traditional proverb: "bitter like life,
> strong like love, gentle like death."
>
> The Maghrebi ritual is UNESCO-recognized intangible cultural
> heritage (inscribed 2022 for Algeria) and remains the primary
> use-context for gunpowder tea outside China. `verified`

### 6e. Time-axis behavior

> Gunpowder is more forgiving of over-steeping than most green teas
> due to the rolled-pellet form — extraction happens gradually as
> pellets unfurl, which means longer steeps continue to extract
> without suddenly turning bitter. 5+ minute steeps are possible
> without ruining the cup, unlike sencha or gyokuro which punish
> long steeps severely. This forgiveness is part of why gunpowder
> became the traveling/trade tea of choice historically.

---

## 7. Safety & heads-up

**Known interactions:**

> Standard green tea cautions — caffeine (~35mg/cup), iron
> absorption interference at meals, fluoride at very heavy
> consumption. No gunpowder-specific concerns. `established`

**Dosage cautions:**

> Higher caffeine than most greens means evening consumption
> warrants more care than with hojicha or kabusecha. Moroccan mint
> tea tradition typically serves small glasses multiple times —
> the per-serving dose is moderate but cumulative caffeine adds up
> across a gathering.

**NOT a concern but sometimes claimed:**

> - **"Gunpowder is smoky because it's smoked"** — Misconception.
>   The smoky character comes from high-temperature pan-firing
>   of mature leaves, not any added smoke process like lapsang
>   souchong uses. `folk`
> - **"Name comes from the tea's smoky flavor being like gunpowder
>   smoke"** — One of four competing etymologies; visual-resemblance
>   to pelleted gunpowder is more historically supported. `folk`
> - **"Gunpowder predates actual gunpowder"** — True and notable:
>   gunpowder tea originated Tang Dynasty (~650 AD), actual
>   gunpowder was invented in China ~900 AD. `verified`

---

## 8. History & cultural context

**Plant origin and early history:**

> Gunpowder tea originated during the Tang Dynasty (618-907 AD) in
> the Pingshui region of Zhejiang Province, near Shaoxing City
> southwest of Shanghai. The Chinese name *zhū chá* (珠茶, "pearl
> tea") describes the spherical rolled form. For centuries it was
> produced by hand-rolling each individual leaf into a tight pellet
> — a labor-intensive process now mechanized except for the highest
> grades. `verified`

**Imperial recognition:**

> Gunpowder became a tribute tea during the Qing Dynasty under
> Emperor Kang Xi (reigned 1661-1722). The imperial tribute status
> elevated gunpowder from a regional specialty to a nationally-
> recognized tea. `attested`

**European export — one of the earliest:**

> - **Early 17th century:** Gunpowder becomes one of the first
>   Chinese teas exported to Europe via Dutch East India Company.
>   The rolled form preserved quality during months-long sea
>   voyages — a practical advantage over less-processed greens.
>   `verified`
> - **1700s:** Extremely popular in Europe and the American
>   colonies, marketed under names like "Green Pearl Bohea" and
>   "Hyson." `verified`
> - **Boston Tea Party context:** Green teas (including some
>   gunpowder-style pearl teas) were among the teas affected by
>   the 1773 events, though souchong black teas were the larger
>   portion of the destroyed shipment. `attested`

**The English name — four competing theories:**

> - **Visual resemblance** (most commonly cited): British clerks
>   in the 17th-19th century noted the tea's pellets resembled
>   pelleted firearm gunpowder. `attested`
> - **"Explosion" on brewing:** The pellets "unfurl" dramatically
>   when hit with hot water. `attested`
> - **Smoky flavor:** Some point to the vegetal-smoky flavor
>   register. `attested`
> - **Phonetic coincidence:** The Mandarin *gāng pào de* (剛泡的,
>   "freshly brewed") sounds similar to "gunpowder." `attested`
>
> All four explanations circulate; no single one is definitively
> proven as the origin. The actual naming is probably some
> combination of visual + phonetic. `attested`

**Chronological note — gunpowder tea predates gunpowder:**

> Gunpowder tea (650-700 AD) predates the invention of actual
> gunpowder in China (ca. 900 AD) by about 200 years. The weapon
> was named after the visual similarity to existing tea pellets —
> not vice versa. `verified`

**The Maghrebi connection:**

> Gunpowder tea's transformation into Moroccan mint tea begins in
> the 18th century along trans-Saharan trade routes. The tea
> arrived in North Africa through British merchants who found
> receptive markets in Morocco, Algeria, and Tunisia. Combined
> with local mint (*Mentha spicata* — spearmint) and generous
> sugar, it became the defining social beverage of the region.
> The Maghrebi tea ritual is now UNESCO intangible cultural
> heritage (Algeria 2022), and gunpowder's primary global
> consumption is through this tradition rather than as standalone
> Chinese green tea. `verified`

**Regional production today:**

> While Pingshui (Zhejiang) remains the authentic source, gunpowder
> tea is now produced in:
>
> - **Pingshui (Zhejiang, original):** Traditional form, typically
>   steamed-then-rolled.
> - **Other Chinese provinces:** Guangdong, Anhui, Hunan, Fujian
>   produce variants.
> - **Taiwan (Formosa gunpowder):** Often processed more like
>   oolong than green tea — darker, smokier, distinct from
>   mainland gunpowder.
> - **Sri Lanka (Ceylon gunpowder):** Processed from Ceylon tea
>   bushes; less common but exists.
> `verified`

**Grading:**

> Gunpowder is graded alphanumerically, with 3505AAA being the
> highest grade and 9375 among the lowest. Key quality markers:
>
> - **Pellet size:** Smaller, tighter pellets = higher quality
>   (Pinhead grade)
> - **Pellet shine:** Shiny = fresh; dull = stale
> - **Color:** Silvery green to olive green; yellow = lower
>   quality or stale
> - **Uniformity:** Consistent pellet size = higher grade
> - **Liquor:** Bright, clear copper to olive-green = quality;
>   cloudy yellow = lower quality
> `verified`

**TCM framing:**

> Like all unoxidized green teas, gunpowder is TCM-cooling (Yin).
> The higher processing temperatures push it slightly warmer than
> Longjing or Japanese greens — some tea traditions classify
> gunpowder as "neutral-cooling" rather than fully cooling. The
> Maghrebi tradition of drinking it heavily sweetened with mint in
> hot climates aligns with the cooling framing. `attested`

---

## 9. Sources

- `ref-gunpowder-wiki` — *Gunpowder tea*. Wikipedia.
  https://en.wikipedia.org/wiki/Gunpowder_tea
  — Comprehensive reference; etymology, production, grading, Maghrebi
  tradition.
- `ref-stories-about-tea` — Stories About Tea. *Gunpowder Tea: A
  Rich History*. 2024.
  https://www.storiesabouttea.com/the-story-of-gunpowder-tea/
  — Reference for historical naming, Emperor Kang Xi tribute tea
  status, European export history.
- `ref-green-tea-health-news` — Green Tea Health News. *Gunpowder
  Green Tea Information*.
  — Reference for Pingshui origin, grading, Emperor Kang Xi
  tribute connection.
- `ref-unesco-maghrebi-2022` — UNESCO. *Algerian Rai, Maghrebi tea
  ritual inscribed on Intangible Cultural Heritage list*. 2022.
- `ref-hicks-1996` — Hicks MB et al. 1996. *Caffeine content of
  commercially available tea products*. J Food Science 61(1):
  185-187.
- `ref-greyling-2014` — Greyling A et al. 2014. PLOS One. — General
  tea cardiovascular meta-analysis applies to gunpowder.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Originated Tang Dynasty (618-907 AD)" | `verified` | Historical record; Zhejiang Pingshui |
| "Chinese name means 'pearl tea'" | `verified` | Direct translation of 珠茶 |
| "Named by British clerk for resemblance to firearm gunpowder" | `attested` | Most-cited etymology; one of several theories |
| "Predates actual gunpowder by 200+ years" | `verified` | Historical chronology |
| "Made from older, mature leaves" | `verified` | Processing standard, unlike bud-prized greens |
| "Imperial tribute under Emperor Kang Xi (Qing)" | `attested` | Historical record |
| "Base of Moroccan mint tea" | `verified` | Cultural tradition; UNESCO heritage 2022 |
| "Predominant tea in Maghreb since 18th-19th century" | `verified` | Trade route history |
| "The rolled form extends shelf life" | `established` | Processing chemistry; less oxidation surface area |
| "Pellets 'explode' when brewed" | `attested` | Sensory observation; one of four name etymologies |
| "Contains more caffeine than Longjing" | `attested` | Mature-leaf sourcing; not always true |
| "Authentic only from Pingshui, Zhejiang" | `attested` | Strict definition; commercial reality is broader |

---

## 11. Research flags & open questions

1. **Formosa gunpowder is really oolong.** Taiwan's gunpowder
   shares the rolled-pellet form but uses oolong-style processing
   (partial oxidation). Should probably be a separate ingredient
   or variant if Herbanium's catalog gets granular enough. Current
   `gunpowder` entry implicitly refers to Chinese-style (Pingshui)
   product.

2. **The Maghrebi tradition overshadows Chinese consumption.**
   Outside China, most gunpowder is consumed as Moroccan mint tea
   rather than standalone green tea. Herbanium's pairing
   recommendations should surface spearmint + sugar combination
   prominently for gunpowder.

3. **Quality variance is extreme.** Pinhead AAA-grade and bottom-
   grade commercial gunpowder are dramatically different teas.
   Current Herbanium data represents a middle estimate; worth
   flagging for users who want premium.

4. **Caffeine 35mg is a middle estimate.** Actual caffeine ranges
   25-50mg depending on grade, processing, and brewing. Mature-leaf
   plucking + tight rolling = more caffeine extraction per gram,
   but the quality variance is large.

5. **Etymology genuinely uncertain.** The four naming theories
   (visual, explosive unfurling, smoky flavor, phonetic coincidence)
   all have support. Herbanium copy should probably use "the name
   comes from multiple possible sources, including..." rather than
   committing to one theory.

---

## Addendum — `calm` kept (sourced) (2026-08-02)

An audit flagged `calm` as shipped without a prescribing brew-point
row. It was researched all along: §5 rates it **1 — "L-theanine
contribution present but not primary"**. The claim lives in the
effects-rating table rather than a §6 row, which is the only reason
the parity guard couldn't see it.

> Csupor D et al. 2016. *Theanine and Caffeine Content of Infusions
> Prepared from Commercial Tea Samples.* Green tea mean L-theanine
> 6.56 mg/g — the highest of the five categories assayed —
> https://www.researchgate.net/publication/293799309_Theanine_and_Caffeine_Content_of_Infusions_Prepared_from_Commercial_Tea_Samples
>
> *Effects of L-Theanine on the Release of α-Brain Waves in Human
> Volunteers* —
> https://www.jstage.jst.go.jp/article/nogeikagaku1924/72/2/72_2_153/_article

**§5's "not primary" is the whole point of the rating.** Gunpowder is
a rolled, relatively assertive green with higher caffeine (~35mg) than
a typical green tea, so the theanine signature is present but sits
behind `focus` and `energy` rather than leading. Shipping `calm` at 2
where the research says 1 is a separate matter from whether the claim
is sourced — the strength guard tracks that.

<!-- sourced-effects: calm -->

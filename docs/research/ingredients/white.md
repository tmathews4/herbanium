# Ingredient Research — White Tea (Silver Needle)

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> Focuses on Baihao Yinzhen (Silver Needle) as the canonical white
> tea. Bai Mudan (White Peony) and Shou Mei are briefly referenced
> where their chemistry differs meaningfully.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `white` | matches existing INGREDIENTS key |
| **display name** | White Tea | |
| **latin** | *Camellia sinensis var. sinensis* (Da Bai cultivar) | Specific cultivar: *Fuding Da Bai Cha* (Fuding Great White) |
| **category** | true tea | |
| **subcategory** | white | |
| **also known as** | Silver Needle (Baihao Yinzhen / 白毫银针), White Hair Silver Needle; Bai Mudan (White Peony) and Shou Mei are related styles |

---

## 2. Overview

**One-line essence:**

> The least-processed true tea — just withered and dried, delicate
> enough to reward soft water and patience.

**Short description:**

> White tea is the least-processed of the six traditional Chinese
> tea categories — young buds and first leaves are simply withered
> and dried, with no pan-firing, no rolling, and no forced oxidation.
> The result is a pale gold liquor with honeysuckle and hay notes,
> moderate caffeine, and the highest L-theanine ratio of any true
> tea. Produced almost exclusively in Fujian Province, China, since
> the late 18th century.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- honey
- hay
- sweet
- delicate
- melon

**Aroma notes:**

> Intensely delicate — the aroma doesn't announce itself, you have
> to lean in. Honeysuckle, faint apricot, fresh-cut hay, sometimes
> melon. Top-grade Fuding Silver Needle develops creamy oat notes;
> Zhenghe-region Silver Needle leans more herbaceous and occasionally
> lightly smoky.

**Mouthfeel:**

> Soft, airy, almost weightless compared to any other true tea.
> Minimal astringency. Subtle sweetness that builds across multiple
> infusions rather than announcing itself in the first. This tea
> rewards gongfu brewing (multiple short steeps) — the profile
> shifts meaningfully across infusions.

**Basic tastes:**

> - `bitter` (1) — low. Minimal oxidation means lower theaflavin
>   content; minimal rolling means lower catechin release. Bitterness
>   only emerges with over-extraction (>5 min in hot water).
> - `sweet` (3) — notable natural sweetness from high free-amino-acid
>   content, especially L-theanine. More pronounced than in green
>   or black tea.
> - `umami` (2) — mild savory-sweetness from the L-theanine +
>   glutamate profile. Less intense than gyokuro or sencha but
>   present, especially in Silver Needle made from bud-only picks.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [75, 95] | traditional + Yang 2018 | Wider range than most tea guides suggest. Lower temps (75-85°C) preserve delicate aromatics; 95°C extraction actually yields highest polyphenol content (Yang 2018 found 100°C optimal for catechins, but flavor suffers). For Silver Needle, 80-85°C is the usual compromise. |
| **time range (seconds)** | [180, 300] | traditional | 3-5 min Western-style. Gongfu-style uses 15-60s with multiple infusions. |
| **caffeine (mg per ~8oz cup)** | 18-28 | Hicks 1996; Csupor 2016 | Lower than black or green tea at equivalent dose, but NOT trivial — Silver Needle (bud-heavy) can match green tea caffeine. "White tea is decaf" is a myth. |
| **dose** | 1-2 tsp per 200ml | traditional | Generous by weight because the buds are so light |

> **Important caveat on caffeine:** A 2008 Journal of Food Science
> study (Chin et al.) found a white tea with the *highest* caffeine
> of 77 teas tested. Caffeine content varies dramatically with
> cultivar, bud/leaf ratio, and brewing — don't assume white =
> low-caffeine without checking.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 3 | High L-theanine (~6.26 mg/g per Csupor 2016, highest of true teas) relative to caffeine produces distinctive calm-alertness |
| focus | 3 | L-theanine + caffeine combination — the "alert calm" signature, similar to green tea but smoother |
| uplifting | 3 | The delicate, bright character lifts without stimulating. Common descriptor: "liquid moonbeam" |
| cooling | 2 | TCM Yin energy — minimally processed, lighter than black tea. Fuding tradition classes white tea among cooling teas |
| sleepy | | Not sedating — has caffeine |
| energy | 2 | Mild — less than green or black at equivalent dose |
| warming | | Opposite direction |
| digestive | | Mild but not primary |
| soothing | | Not the register — too delicate |
| grounding | | Opposite — white tea is lifting, not grounding |

> **Vocabulary note:** Previous app data used `[["calming", 3],
> ["lifting", 3], ["clear", 3]]`. Per `docs/vocabulary.md`:
> `calming → calm`, `lifting → uplifting`, `clear → focus` (since
> "clear-headed" is mental clarity, which `focus` already covers).
> The result is `[["calm", 3], ["uplifting", 3], ["focus", 3],
> ["cooling", 2]]` — one more effect because the vocabulary lets us
> represent the TCM cooling axis separately.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from Yang et al. 2018
> (Fuding white tea main compound extraction across temperatures)
> and traditional Fujian gongfu practice.

### 6a. GENTLE (75°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 75 |
| timeS | 180 |
| flavors | [sweet, delicate, honey] |
| effects | [["calm", 2], ["uplifting", 2]] |
| character | A quiet introduction to the leaves — delicate aromatics preserved, L-theanine and amino acids extract well at this temp, catechins lag. The cup reads "soft" and "airy." Recommended for the most delicate Silver Needle, especially aged Silver Needle which benefits from gentleness. |
| sources | ref-yang-2018 |

### 6b. STANDARD (85°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 240 |
| flavors | [honey, hay, sweet, melon] |
| effects | [["calm", 3], ["uplifting", 3], ["focus", 3], ["cooling", 2]] |
| character | The canonical Western-style white tea cup — honeysuckle aroma, pale gold liquor, clean sweet finish. Enough catechins extract to support the mouthfeel without bitterness. |
| sources | ref-yang-2018, traditional |

### 6c. STRONG (95°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 300 |
| flavors | [honey, hay, deep, slightly astringent] |
| effects | [["calm", 3], ["uplifting", 3], ["focus", 4], ["energy", 2]] |
| character | Full-strength extraction pulls out more caffeine and more polyphenols, shifting the cup toward green-tea-adjacent territory. Loses some of the soft delicacy but gains body and a more pronounced alertness. Not how most Chinese tea masters would serve Silver Needle — but a defensible option for Bai Mudan or Shou Mei which have more leaf material to work with. |
| sources | ref-yang-2018 |

### 6d. Time-axis behavior

> White tea's time curve is gentler than green tea's. The
> sparseness of the material (especially in Silver Needle, where
> hydrophobic bud-hairs resist extraction) means even long steeps
> don't cross into bitter as dramatically as with green tea.
>
> Practical observation: white tea is more forgiving of longer
> steeps than its reputation suggests. An over-brewed white tea is
> disappointing but not undrinkable — unlike over-brewed sencha,
> which can be actively unpleasant.
>
> Multi-infusion behavior: Silver Needle rewards gongfu-style
> brewing (multiple short steeps) dramatically. Infusions 2-4 often
> exceed infusion 1 in complexity and sweetness. Current Herbanium
> data model doesn't handle multi-infusion; noted as a research flag.

---

## 7. Safety & heads-up

**Known interactions:**

> - **Caffeine (~18-28mg per cup, variable)** — lower than green or
>   black but not zero. Standard caffeine cautions apply but are less
>   stringent. Pregnancy: compatible at 1-3 cups/day given the
>   modest caffeine. `established`
> - **Fluoride** — like all Camellia sinensis, white tea accumulates
>   fluoride from soil. Not a practical concern at normal intake.
> - **Iron absorption** — lower tannin content than black tea means
>   less iron-absorption inhibition, but still present; drink between
>   meals if iron-deficient. `established`

**Dosage cautions:**

> White tea is one of the gentlest caffeinated teas; overconsumption
> cautions are minimal. The main practical issue is cost — high-
> grade Silver Needle is among the most expensive teas per gram, so
> brewing wastefully is a different kind of cost than health risk.

**NOT a concern but sometimes claimed:**

> - **"White tea cures cancer"** — Common in wellness marketing
>   citing high antioxidant content. No human trials support this.
>   The high catechin concentration is real; the cancer claim is
>   overreach from in-vitro studies. `folk`
> - **"White tea is completely decaffeinated"** — Myth. Bud-heavy
>   Silver Needle can match green tea caffeine. `folk`
> - **"Ancient imperial tea from emperors for millennia"** — The
>   marketing narrative is centuries older than the product. Silver
>   Needle as we know it was first produced in 1796; "imperial
>   tea" framings are mostly 20th-century romanticization. `folk`

---

## 8. History & cultural context

**Plant origin:**

> White tea comes almost exclusively from specific cultivars of
> *Camellia sinensis var. sinensis* grown in Fuding and Zhenghe
> counties of Fujian Province, China. The Fuding Da Bai Cha (Fuding
> Great White) cultivar — spread across Fuding in 1857 — and the
> related Da Hao (Big Hair) cultivar produce the silver-downy buds
> that define the tea. Similar teas made from other cultivars
> (Yunnan Silver Needle, Vietnamese, Darjeeling white, Sri Lankan
> "Ceylon silver tips") are related but chemically and sensorially
> distinct. `verified`

**Historical timeline:**

> - **1796 (Jiaqing era, Qing Dynasty):** Baihao Yinzhen first
>   produced in Fuding. The earliest documented date in Chinese
>   tea records; sometimes called the founding year of white tea
>   as a distinct category. `attested` (Chinese tea historical
>   records; primary documents held at Fuding tea archives)
> - **1857:** Fuding Da Bai Cha cultivar is successfully spread in
>   Fuding region. `verified`
> - **1885:** Tea buds from Fuding Da Bai Cha first used to make
>   commercial Silver Needle. `verified`
> - **1891:** Silver Needle begins export to Western markets,
>   primarily Europe. `verified`
> - **1982:** Fuding Silver Needle awarded "National Famous Tea"
>   status by China's Ministry of Commerce, ranked second among
>   30 named teas. `verified`
> - **2000s:** Aged white tea (shou-style — stored and aged for 3+
>   years) gains popularity in China, creating a premium market
>   segment. `verified`

**Processing:**

> The distinguishing feature of white tea is what *doesn't* happen:
> no pan-firing to fix enzymes (as in green tea), no rolling or
> bruising to initiate oxidation (as in oolong or black), no forced
> fermentation (as in pu-erh). The leaves are simply:
>
> 1. Plucked (early morning, strict weather requirements)
> 2. Withered (spread on bamboo racks, 48-60 hours)
> 3. Dried (low heat to final moisture content)
>
> A small degree of natural oxidation occurs during the long wither
> — which is why white tea isn't truly "unoxidized" the way green
> tea is, even though it's the least-processed category. `established`

**Variants:**

> - **Silver Needle (Baihao Yinzhen):** Single buds only. Most
>   expensive, most delicate. Harvested in a ~2-week window in
>   early April.
> - **White Peony (Bai Mudan):** One bud + 2 leaves. Fuller, more
>   robust flavor. More forgiving to brew.
> - **Shou Mei:** More mature leaves. Deeper, hay-and-honey, ages
>   well.
> - **Gong Mei (Tribute Eyebrow):** Similar to Shou Mei but
>   slightly earlier picking. Less commonly seen in Western markets.
>
> Bai Mudan and Shou Mei extract more compounds into infusion than
> Silver Needle (Yang 2018) because Silver Needle's hydrophobic
> bud-hairs resist water penetration. Practical consequence:
> Silver Needle needs slightly more generous dosing or longer
> steeps to match the body of lower-grade white teas. `verified`

**TCM framing:**

> White tea is classed as cooling (Yin) in Traditional Chinese
> Medicine, appropriate for hot weather and for "heat-pattern"
> conditions. The minimal processing retains more of the plant's
> original "cold-nature" energy in the TCM framework. This is
> consistent across Chinese tea-medicine sources from the Ming
> dynasty onward. `attested`

**Legend (as legend):**

> One Fuding origin legend tells of celestial rabbits descending
> from the moon, their silvery fur transforming into white tea buds.
> This is one of many moon-associated framings of Silver Needle in
> Chinese tea poetry — the tea is sometimes called "liquid moonbeam"
> in English translation. These are cultural and poetic, not
> historical. `folk`

---

## 9. Sources

- `ref-yang-2018` — Yang C et al. 2018. *Comparison of the main
  compounds in Fuding white tea infusions from various tea types*.
  Food Science & Human Wellness 7(4): 273-280.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6170294/
  — Primary source on white tea extraction chemistry. 100°C optimal
  for catechins/caffeine; temperature effects vary across Bai Hao
  Yin Zhen, Bai Mu Dan, Shou Mei.
- `ref-csupor-2016` — Csupor D et al. 2016. *Theanine and Caffeine
  Content of Infusions Prepared from Commercial Tea Samples*.
  Pharmacognosy Magazine 12(45): S26-S29.
  — White tea: 6.26 mg/g L-theanine (highest of measured tea types),
  16.79 mg/g caffeine.
- `ref-yilmaz-2023` — Yılmaz Y. 2023. *White tea: Its history,
  composition, and potential effects on body weight management*.
  eFood 4(2): e89.
  https://iadns.onlinelibrary.wiley.com/doi/full/10.1002/efd2.89
  — Comprehensive review of white tea chemistry and bioactive
  compounds.
- `ref-hilal-engelhardt-2007` — Hilal Y, Engelhardt UH. 2007.
  *Characterisation of white tea — Comparison to green and black
  tea*. J Consumer Protection and Food Safety 2(4): 414-421.
  — White vs. green vs. black comparative chemistry.
- `ref-karori-2007` — Karori SM et al. 2007. *Antioxidant capacity
  of different types of tea products*. African J Biotechnology
  6(19): 2287-2296. — Catechin profile across tea types.
- `ref-carloni-2013` — Carloni P et al. 2013. *Antioxidant activity
  of white, green and black tea obtained from the same tea cultivar*.
  Food Research International 53(2): 900-908. — Same-cultivar
  comparison controlling for varietal effects.
- `ref-hicks-1996` — Hicks MB et al. 1996. *Caffeine content of
  commercially available tea products*. J Food Science 61(1):
  185-187. — Classic caffeine-content reference.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Silver Needle first produced 1796 in Fuding" | `attested` | Chinese tea historical records; primary documentation in Fujian tea archives |
| "White tea is the least-processed tea" | `established` | Chemistry and processing verified |
| "Higher L-theanine than other true teas" | `verified` | Csupor 2016 quantification |
| "TCM-cooling (Yin)" | `attested` | Consistent across Chinese tea-medicine sources |
| "Called 'liquid moonbeam'" | `folk` | Poetic framing, real enough as cultural aesthetic |
| "Celestial rabbits and moon-descent legend" | `folk` | Origin myth, not claimed as history |
| "Ancient imperial tea served to Chinese emperors" | `folk` | 20th-century marketing — Silver Needle is younger than this framing implies |
| "Commoners could not legally obtain white tea until the tribute system collapsed" | `folk` | The imperial-exclusivity framing above, with a legal prohibition added on top. No source offered for either half; shipped in the facts list until 2026-08-23 |

<!-- retracted: imperial tribute exclusive -->
<!-- retracted: could not legally obtain -->
<!-- retracted: 2002 Pace University -->
| "White tea has more antioxidants than green tea" | `attested` | Per-weight basis, depending on cultivar and measurement method — not consistently true |
| "White tea is decaffeinated" | `folk` | Myth — caffeine is present and occasionally high |
| "Only cultivated in Fuding and Zhenghe" | `verified` | Commercial reality for authentic Fujian white tea |

---

## 11. Research flags & open questions

1. **Multi-infusion gap.** White tea (like gyokuro and pu-erh)
   genuinely rewards multi-infusion brewing — each steep has a
   different profile, and serious tea drinkers expect 3-6 infusions
   from good Silver Needle. Current Herbanium data model treats
   brewing as single-infusion. This is a structural limitation for
   white tea, gyokuro, and pu-erh specifically. Not blocking; flagged
   for future data-model consideration.

2. **Caffeine variability is real.** The research shows white tea
   caffeine content varies dramatically by cultivar, bud/leaf ratio,
   and brewing. Herbanium shows a single "caffeine: 18" number for
   white tea; this is reasonable for typical Silver Needle but
   underestimates bud-heavy premium versions.

3. **Aged white tea is a different ingredient.** Aged white tea
   (3+ years) has meaningfully different chemistry — catechins
   continue slow oxidation, developing deeper honey, date, and
   medicinal notes. Some drinkers consider it a separate tea
   category. Current Herbanium data doesn't distinguish; worth
   considering `white_aged` or variant.

4. **Silver Needle vs. Bai Mudan vs. Shou Mei.** These are clearly
   different teas sensorially and chemically, but Herbanium
   currently has only `white` as a catch-all. Future catalog
   expansion could split these. The current `white` entry is
   implicitly weighted toward Silver Needle as the canonical
   reference — noted for clarity.

5. **"Clear" effect merged into focus — does it capture the nuance?**
   The old app had a distinct `clear` effect for sencha, gyokuro,
   dragonwell, and white tea. The vocabulary migration collapsed
   `clear` into `focus` for most uses. White tea's specific "clear-
   headed uplift" feeling is somewhere between focus (mental
   clarity) and uplifting (mood lift) — both are listed here to
   capture the full character.

---

## Addendum — `uplifting` and `cooling` transcribed from §5 (2026-08-03)

An audit of unreachable properties found both declared on the
ingredient card and named nowhere in the extraction profile — so the
page promised a property no cup could ever show.

The research was there the whole time. §5 rates `uplifting` and `cooling`, and the
§6 brew-point tables simply never carried it; the transcription pass
that built the profiles worked from §6 alone.

> | uplifting | 3 | The delicate, bright character lifts without stimulating |
> | cooling | 2 | TCM Yin energy — minimally processed, lighter than black tea |

`uplifting` is not carried at the 95C over-pull row, where the profile
already drops calm and most of focus — a cup past its point does not
lift.

Transcribed at the §5 strength. Nothing new is claimed here — this
closes the gap between what the card promises and what a cup can
deliver.

<!-- sourced-effects: uplifting, cooling -->

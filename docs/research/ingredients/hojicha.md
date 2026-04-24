# Ingredient Research — Hojicha

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> Roasted Japanese green tea — 1920s Kyoto invention, evening tea
> for children and adults, first ingredient where `soothing` 4 and
> `roasted` flavor both feel canonical.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `hojicha` | matches existing INGREDIENTS key |
| **display name** | Hojicha | |
| **latin** | *Camellia sinensis var. sinensis* | Same plant as sencha/gyokuro; what differs is processing. Typically made from bancha (older leaves), kukicha (stems/twigs), or sometimes sencha |
| **category** | true tea | |
| **subcategory** | green (roasted) | Technically still green tea — steamed to halt oxidation before roasting, so enzymatic oxidation never occurs |
| **also known as** | ほうじ茶, 焙じ茶 (*hōjicha*, "roasted tea"); Kaga Bocha (premium stem-only roasted variant from Ishikawa); Houjicha; bancha houjicha |

---

## 2. Overview

**One-line essence:**

> The roasted green tea — caramelized, nutty, low-caffeine, the
> Japanese tea that children and elders drink together.

**Short description:**

> Hojicha is a Japanese green tea that has been roasted at high
> temperature (150-200°C) over charcoal after the standard steaming
> step. The roasting transforms bright-vegetal green tea leaves
> into brown, nutty, caramelized tea with dramatically reduced
> caffeine (7-20mg/cup vs. 30-50 for sencha) and minimal
> bitterness. Invented by accident in 1920s Kyoto by a tea merchant
> trying to use unsold bancha, hojicha is now one of Japan's most
> popular everyday teas — served after meals, given to children
> and elderly, and increasingly popular internationally for its
> warmth and low-stimulation character.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- roasted
- nutty
- caramel
- toasty
- sweet

**Aroma notes:**

> Warm, inviting, distinctly "roasted" — the defining Japanese
> comfort-tea aroma. Notes of toasted nuts (especially hazelnut
> and almond), caramelized sugar, roasted grain, sometimes chestnut
> or light cocoa. Kaga Bocha (stem-only variant) has a sweeter,
> almost butterscotch character due to caramelized stalk sugars.
> Hojicha lattes — now internationally popular — build on this
> base with milk's natural compatibility with the nutty-caramel
> register.

**Mouthfeel:**

> Smooth, mellow, notably light-bodied for a tea this dark in
> color. Very low astringency — the roasting degrades the
> catechins responsible for astringency in other greens. Hojicha
> feels almost "rounded" on the palate, without the edge that
> sencha or gunpowder have.

**Basic tastes:**

> - `bitter` (0-1) — minimal; the defining feature. Roasting
>   degrades 40-60% of catechins that cause bitterness in other
>   greens.
> - `sweet` (2) — notable; Maillard-reaction products from roasting
>   contribute caramel-sweet notes.
> - `astringent` (1) — very low; roasting modifies catechins to be
>   less water-soluble.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [85, 100] | traditional | **Counterintuitively high for a green tea.** Hojicha is the most forgiving of Japanese greens — full boil works fine, unlike sencha or gyokuro which need careful temperature control |
| **time range (seconds)** | [30, 90] | traditional | 30 seconds to 1.5 minutes. Quick extraction because the roasted leaves give up flavor rapidly. Can re-steep 2-3 times. |
| **caffeine (mg per ~8oz cup)** | 12 | Senbird Tea; Yedoensis; Tea Trade | Range 7-20mg; lowest of true teas. Roasting at 200°C sublimes caffeine (178°C sublimation point); mature bancha leaves start with less caffeine than young leaves |
| **dose** | 1 tsp (~3g) per 200ml | traditional | Generous dose works because of low astringency |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| soothing | 4 | **Primary effect.** The defining comfort-tea register — warm, mellow, nostalgic for many Japanese drinkers. Kaga Bocha's rise to luxury status (post-1983 Emperor Hirohito endorsement) built on this character |
| calm | 3 | Low caffeine + roasting-derived pyrazines (notably 2,3,5-trimethylpyrazine) which research suggests increase parasympathetic nervous activity. The "calming without sedating" profile |
| warming | 3 | Counterintuitive for a green tea — roasted character and toasty notes read as warming despite not being TCM Yang. The evening/winter tea in Japanese households |
| digestive | 2 | Traditional after-meal use in Japan; the roasted character + low acidity make it gentle on the stomach |
| grounding | 2 | The earthy-nutty character has grounding quality, though not at lapsang/pu-erh levels |
| focus | 2 | Some L-theanine preserved through roasting; gentle alertness rather than sharp focus |
| energy | 1 | Very low — this is the tea you reach for when you don't want caffeine |
| sleepy | | Not sedating but not sleep-disruptive either — the "anytime tea" |
| cooling | | Opposite direction; roasting transforms green-tea's cooling register |
| uplifting | | Not primary — hojicha is more "settle in" than "lift" |

> **Vocabulary stress test:** `soothing` 4 matches rooibos — both
> are "comfort teas" earning the same strength from different
> mechanisms (rooibos: sweet-round body; hojicha: roasted-nutty
> warmth). Calibration holding.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from Japanese Tea Central
> Association, Kyoto producer traditional practice, and recent
> research (All Day I Eat 2026) on pyrazine chemistry and
> parasympathetic activity.

### 6a. GENTLE (85°C, 30s)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 30 |
| flavors | [roasted, nutty, sweet] |
| effects | [["soothing", 3], ["calm", 2], ["warming", 2]] |
| character | A lighter first infusion — preserves the most delicate toasty aromatics, pale amber liquor. Useful as an introductory cup or for premium kukicha-based hojicha where stem sweetness is the highlight. |
| sources | traditional |

### 6b. STANDARD (90°C, 45s)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 45 |
| flavors | [roasted, nutty, caramel, toasty, sweet] |
| effects | [["soothing", 4], ["calm", 3], ["warming", 3], ["digestive", 2], ["grounding", 2]] |
| character | The canonical hojicha cup — reddish-brown liquor, full roasted-nutty aroma, characteristic low-bitterness finish. The cup most Japanese households drink daily after dinner. |
| sources | traditional, ref-senbird |

### 6c. STRONG (100°C, 90s)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 90 |
| flavors | [roasted, smoky, deep, caramel] |
| effects | [["soothing", 4], ["warming", 4], ["grounding", 3], ["digestive", 2]] |
| character | Deeper extraction — pulls forward smokier, more assertive roasted character. Useful as the base for hojicha lattes (where dairy will soften the intensity) or for cold winter evenings. Kaga Bocha made this way takes on a butterscotch-and-dark-caramel character. |
| sources | traditional |

### 6d. Time-axis behavior

> Hojicha is forgiving of both high temperatures and long steeps —
> the opposite of gyokuro. The roasting has already extracted the
> delicate volatile aromatics from the leaf during production; what
> remains is robust roasted-Maillard compounds that handle
> aggressive brewing. Over-steeping hojicha makes it fuller and
> sweeter rather than bitter.
>
> **Hojicha latte technique:** brew at high strength (strong
> profile above) with minimal water, then dilute with steamed
> milk at a 1:3 or 1:4 tea:milk ratio. The roasted-caramel base
> carries dairy well without the grassy-vegetal character that
> sencha lattes struggle with.

---

## 7. Safety & heads-up

**Known interactions:**

> - **Caffeine (7-20mg)** — lowest of true teas. Suitable for
>   evening consumption and for caffeine-sensitive drinkers.
>   Pregnancy-compatible at normal intake. `established`
> - **In Japan given to children** — the very low caffeine and
>   gentle character make hojicha one of the first teas Japanese
>   children are introduced to. `established`
> - **Low catechin/EGCG content** — about 40-60% reduction from
>   unroasted bancha. Replaced with melanoidins (Maillard compounds)
>   that have their own antioxidant activity, so net antioxidant
>   effect isn't zero — just different. `established`

**Dosage cautions:**

> Essentially none at normal consumption. The low caffeine means
> hojicha is one of the easiest true teas to drink in quantity
> without overconsumption concerns.

**NOT a concern but sometimes claimed:**

> - **"Hojicha is decaf"** — Not zero. 7-20mg is low but present;
>   very caffeine-sensitive drinkers may still notice. `folk`
> - **"Hojicha lost all its antioxidants"** — Exaggerated. Catechin
>   levels drop, melanoidin levels rise — total antioxidant
>   activity is different but not zero. Research (J. Ag. Food
>   Chemistry) shows meaningful epicatechin/epigallocatechin
>   retention. `folk`
> - **"Hojicha is black tea"** — No. Steaming halts oxidation
>   before roasting; hojicha is chemically a green tea that's
>   been roasted, not an oxidized tea. `folk`

---

## 8. History & cultural context

**Origin — 1920s Kyoto accident:**

> Hojicha was invented around 1920 in the Gion district of Kyoto
> by a tea merchant whose unsold bancha had accumulated beyond
> sellable freshness. Following *mottainai* (勿体無い) philosophy —
> the cultural imperative against waste — the merchant roasted
> the leftover leaves, stems, and twigs over charcoal. The
> resulting tea had a warm roasted aroma that drew customers into
> shops; the technique spread quickly through Kyoto and Japan.
> `verified`

**Historical timeline:**

> - **1920:** Hojicha invented by Kyoto tea merchant in Gion
>   district; use of unsaleable bancha leaves. Classified as the
>   "youngest" of major Japanese tea categories. `verified`
> - **1920s-1930s:** Spreads across Japan as an economical
>   household tea, suited to economic hardship of the interwar
>   period. `verified`
> - **Post-WWII:** Becomes a staple everyday tea in Japanese
>   households. Low caffeine makes it the "family tea" — shared
>   across generations. `verified`
> - **1983:** Emperor Hirohito is served Kaga Bocha (premium stem-
>   roasted variant) during a visit to Ishikawa Prefecture and
>   becomes enamored with it. He brings it back to the Imperial
>   Household, birthing the "Kenjo Kaga Bocha" luxury market and
>   transforming hojicha from "poor man's tea" to gourmet product.
>   `verified`
> - **2010s:** Hojicha powder (ground like matcha) and hojicha
>   lattes become internationally popular, especially in cafes
>   adjacent to the matcha-latte wave. `verified`
> - **Modern:** Japan's most-consumed everyday tea at restaurants;
>   served free at countless Japanese restaurants as *o-cha*.
>   `verified`

**Processing — what roasting does:**

> After standard Japanese green tea processing (steaming, rolling,
> drying), hojicha leaves undergo an additional roasting step at
> 150-200°C — typically in a porcelain pot over charcoal, or
> industrial roasting drums for commercial production. The heat
> causes multiple chemistry changes:
>
> - **Color:** Green chlorophyll degrades → leaves turn reddish-
>   brown. The brewed liquor is golden to amber, nothing like
>   standard green tea.
> - **Caffeine:** Caffeine sublimes at 178°C; roasting above this
>   temperature physically removes ~60-70% of caffeine from the
>   leaf.
> - **Catechins:** ~40-60% degrade under heat; remaining catechins
>   become less water-soluble, reducing astringency in the cup.
> - **Maillard reactions:** Amino acids and sugars in the leaf
>   react to form melanoidins (brown pigments with their own
>   antioxidant activity) and pyrazines (the aromatic compounds
>   responsible for "roasted" smell in coffee, baked bread, and
>   hojicha).
> - **Pyrazines and parasympathetic activity:** 2,3,5-trimethyl-
>   pyrazine, one of the specific compounds formed during roasting,
>   has been shown in Japanese research to increase parasympathetic
>   nervous activity — which may explain the subjective calming
>   effect of hojicha beyond just low caffeine. `verified` (Maillard
>   chemistry); `attested` (pyrazine/parasympathetic connection,
>   active research area)

**Base-tea variants:**

> Hojicha is an umbrella term for roasted Japanese green tea,
> with meaningful variants by base material:
>
> - **Bancha-based hojicha** (most common): Made from older bancha
>   leaves harvested later in the season. Light, mellow, moderate
>   roast character.
> - **Sencha-based hojicha**: Made from sencha leaves instead of
>   bancha. More complex, slightly more caffeine, richer character.
>   Premium.
> - **Kukicha-based hojicha (Kuki Hojicha or Kaga Bocha)**: Made
>   from stems and twigs instead of leaves. Sweeter (stems have
>   more residual sugars), less caffeine, lighter body.
> - **Kaga Bocha specifically**: A premium stem-roast from Ishikawa
>   Prefecture, popularized by Emperor Hirohito in 1983. Now a
>   protected regional specialty with "Kenjo" (imperial-offering)
>   branding.
> `verified`

**The Japanese cultural position:**

> Hojicha occupies a specific cultural niche in Japan:
>
> - **After-meal tea:** Served free at most Japanese restaurants,
>   especially kaiseki and washoku restaurants. The post-meal
>   default.
> - **Children's tea:** Low caffeine makes it appropriate for
>   children, often first tea Japanese children are introduced to.
> - **Elderly tea:** Same low-caffeine logic; gentler on elderly
>   digestive systems than stronger teas.
> - **Evening tea:** The "sleep-compatible tea" — most Japanese
>   households would reach for hojicha after 6 PM rather than
>   sencha or matcha.
> - **Hospital tea:** Often served in Japanese hospitals where
>   caffeine is restricted.
>
> This family-wide accessibility is a huge part of hojicha's
> cultural identity — it's the one tea that doesn't segregate
> households by age or caffeine tolerance. `verified`

**TCM framing:**

> Unlike most green teas (which are TCM-cooling), hojicha's
> extensive roasting shifts it toward neutral or mildly warming.
> Traditional Chinese tea masters don't typically classify
> hojicha in their frameworks (it's a Japanese invention), but
> Japanese tea culture positions hojicha as appropriate for cold
> seasons and cold-pattern conditions in ways that align with a
> "neutral-warming" framing. `attested`

---

## 9. Sources

- `ref-hojicha-wiki` — *Hōjicha*. Wikipedia.
  https://en.wikipedia.org/wiki/H%C5%8Djicha
  — Comprehensive reference; 1920 origin, processing, variants.
- `ref-senbird-2024` — Senbird Tea. *Hojicha Roasted Green Tea:
  Complete Guide*. 2024.
  https://senbirdtea.com/blogs/green-tea/everything-you-need-to-know-about-hojicha-roasted-green-tea
  — Detailed chemistry, brewing, and caffeine-sublimation mechanics.
- `ref-tea-trade-2026` — Tea Trade. *What is Hojicha?* 2026.
  https://teatrade.co.uk/learning/what-is-hojicha.html
  — Reference for Kaga Bocha history, Emperor Hirohito 1983
  endorsement, luxury-market origin.
- `ref-all-day-i-eat-2026` — All Day I Eat. *Hojicha Tea: The
  Complete Guide to Japanese Roasted Green Tea*. 2026.
  https://www.alldayieat.com/hojicha-tea-the-complete-guide-to-japanese-roasted-green-tea/
  — Pyrazine + parasympathetic activity research summary; melanoidin
  antioxidant properties.
- `ref-yedoensis` — Yedoensis. *Hojicha History: The Origins of
  Japanese Roasted Tea*.
  https://yedoensis.com/blogs/news/hojicha-a-journey-through-the-history-of-japans-roasted-tea
  — Historical context; mottainai philosophy; post-war popularity.
- `ref-naokimatcha` — Naoki Matcha. *The Ultimate Japanese Hojicha
  Tea Guide*. 2024.
  — Caffeine comparison (7.7mg hojicha vs. 30mg typical green);
  processing variations.
- `ref-csupor-2016` — Csupor D et al. 2016. Pharmacognosy Magazine.
  — Baseline L-theanine for green tea category applies modified by
  roasting degradation.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Invented 1920 in Kyoto's Gion district" | `verified` | Historical record; specific merchant unknown but date and location documented |
| "Origin in mottainai philosophy" | `verified` | Cultural context for using unsold tea |
| "Roasting degrades 40-60% of caffeine" | `verified` | Sublimation chemistry above 178°C |
| "Pyrazines increase parasympathetic activity" | `attested` | Japanese research; active area, replication ongoing |
| "Kaga Bocha popularized by Emperor Hirohito 1983" | `verified` | Imperial Household historical record |
| "Japan's everyday/restaurant tea" | `verified` | Cultural fact |
| "Appropriate for children in Japan" | `established` | Cultural practice; low caffeine justifies |
| "Japanese hospital tea" | `attested` | Common practice in many Japanese hospitals |
| "Roasted green tea, not black tea" | `verified` | Chemistry — steaming precedes roasting, no oxidation |
| "Youngest of major Japanese tea categories" | `verified` | Historical fact |
| "Can be brewed at full boil unlike other greens" | `verified` | Roasting eliminates temperature sensitivity |

---

## 11. Research flags & open questions

1. **Base-tea variants are meaningfully different.** Bancha-based,
   sencha-based, and kukicha-based hojicha are distinct teas.
   Kaga Bocha (kukicha-based) especially so. Current `hojicha`
   entry implicitly refers to bancha-based as the canonical form;
   worth flagging for quality-conscious users.

2. **Pyrazine/parasympathetic research is promising but early.**
   The 2,3,5-trimethylpyrazine → calming mechanism has Japanese
   research support but is not yet replicated in large Western
   trials. Herbanium's copy should use "research suggests" rather
   than definitive claims.

3. **Freshness matters more than for most teas.** Roasted aromatics
   are volatile — they fade within 2-3 months of roasting. A
   "roast date" is more useful than a "best-by date" for hojicha.
   Herbanium doesn't currently handle freshness windows; worth
   considering.

4. **Hojicha latte is a major consumption vector.** Increasingly,
   hojicha is encountered as a latte rather than as plain tea.
   This affects effect profile (dairy adds caloric load, reduces
   bioavailability of some compounds) and flavor expectations.
   Worth surfacing as a pairing recommendation.

5. **Caffeine variance is real.** The 7-20mg range is wide;
   individual hojicha products can be near zero (if heavily roasted
   kukicha) or around 25mg (if mildly roasted sencha-based).
   Single 12mg estimate is a useful middle but lossy.

6. **Soothing 4 calibration check.** Rooibos and hojicha both
   earn `soothing` 4. Rooibos's soothing comes from sweet-round
   body; hojicha's from roasted-nutty warmth. Both feel
   canonical at this strength. Future non-tea comfort teas
   (chicory root?) would need to fit into this calibration.

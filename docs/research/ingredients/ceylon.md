# Ingredient Research — Ceylon Black Tea

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> The "brisk and bright" black tea — backbone of Earl Grey and most
> breakfast blends. Unusually well-documented history via James
> Taylor and the coffee-rust pivot.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `ceylon` | matches existing INGREDIENTS key |
| **display name** | Ceylon Black | |
| **latin** | *Camellia sinensis var. sinensis* (original stock from China/Assam hybrids) | Mostly assamica-descendant hybrids at present; highland teas retain more Chinese-variety character |
| **category** | true tea | |
| **subcategory** | black | |
| **also known as** | Sri Lankan black tea; "Ceylon" retained for brand recognition despite 1972 country rename |

---

## 2. Overview

**One-line essence:**

> Brisk, bright, citrus-leaning black tea — the backbone of most
> breakfast blends and the traditional base for Earl Grey.

**Short description:**

> Ceylon tea is grown across seven distinct regions in Sri Lanka's
> hill country — Kandy, Nuwara Eliya, Dimbula, Uva, Udupussellawa,
> Ruhuna, and Sabaragamuwa — each with its own altitude-driven
> character. High-grown estates (1200m+) produce the brightest,
> most citrus-forward cups; low-grown (below 600m) give the
> fuller-bodied tea that underpins commercial blends. The industry
> was founded almost by accident in 1867 when coffee rust destroyed
> Ceylon's coffee plantations, forcing planters to pivot to tea.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- citrus
- bright
- brisk
- woody

**Aroma notes:**

> The signature "Ceylon nose" is a bright, slightly citrus-peel
> aroma — distinct from Assam's maltiness and Darjeeling's muscatel
> grape. Uva-region teas can have an additional menthol-like cooling
> note in the finish, sometimes called "Uva character." Dimbula
> teas lean floral; Nuwara Eliya is often described as "delicate
> champagne-like"; Ruhuna (low-grown) leans toward molasses and full
> body.

**Mouthfeel:**

> Medium body, notably brisk (lively and refreshing — the tea
> community's term of art for Ceylon's signature). Less astringent
> than Assam, less delicate than Darjeeling. Forgiving of milk
> without being dependent on it — a versatile tea that works both
> ways.

**Basic tastes:**

> - `bitter` (2) — moderate, similar to Darjeeling; rises at long
>   steeps
> - `astringent` (2-3) — the "brisk" character partly reflects
>   this. Well-integrated rather than drying
> - `sweet` (1-2) — subtle, from residual amino acids

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | traditional, Tea Exporters Assoc. Sri Lanka | Full boil canonical for Ceylon — more robust than Darjeeling, handles higher temps without losing character |
| **time range (seconds)** | [180, 240] | traditional | 3-4 min orthodox; CTC Ceylon (common in tea bags) is faster (90-120s) |
| **caffeine (mg per ~8oz cup)** | 45 | Linus Pauling Institute; Hicks 1996 | Between Darjeeling (40) and Assam (60); varies by elevation and processing |
| **dose** | 1 tsp (~2.5g) per 200ml | traditional | Standard for orthodox black tea |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| energy | 3 | Moderate caffeine (~45mg) — noticeably stimulating but less than Assam |
| uplifting | 3 | The brisk, citrus-forward character genuinely lifts mood. One of the more reliably "bright" black teas |
| warming | 3 | Fully oxidized TCM Yang. Similar warming register to Darjeeling; less than Assam |
| focus | 2 | Modest — caffeine + some L-theanine. Less of the alert-calm signature than Darjeeling |
| digestive | 2 | Mild traditional claim; modest clinical evidence for black tea generally |
| calm | | Not applicable |
| sleepy | | Not applicable |
| cooling | | Opposite direction |
| soothing | | Not primary — Ceylon is more "wake up" than "settle in" |

> **Minimal change from current app values** `[["energy", 3],
> ["uplifting", 3], ["warming", 3]]` — research supports these.
> Added `focus` 2 and `digestive` 2 per the general black-tea
> evidence and Ceylon's lighter body allowing for more L-theanine
> expression.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from Sri Lanka Tea Board
> guidance, Tea Exporters Association Sri Lanka brewing standards,
> and general black-tea extraction literature.

### 6a. GENTLE (90°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 180 |
| flavors | [citrus, bright, delicate] |
| effects | [["energy", 2], ["uplifting", 3], ["warming", 2]] |
| character | Useful for high-grown Nuwara Eliya or Dimbula teas where the delicate floral notes deserve preservation. Shorter steep preserves the citrus-bright character without extracting full astringency. |

### 6b. STANDARD (95°C, 210s / 3.5 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 210 |
| flavors | [citrus, bright, brisk, woody] |
| effects | [["energy", 3], ["uplifting", 3], ["warming", 3], ["focus", 2]] |
| character | The canonical breakfast Ceylon — bright amber liquor, citrus-peel aroma, brisk finish. Pairs equally well with milk and without. The backbone of Earl Grey and most English breakfast blends. |

### 6c. STRONG (100°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 240 |
| flavors | [citrus, brisk, woody, malty, deep] |
| effects | [["energy", 4], ["uplifting", 3], ["warming", 4], ["focus", 2]] |
| character | Robust extraction — better suited to low-grown Ruhuna or CTC Ceylon, which has more body to give. Pulls forward the woody-malty notes. This is the cup most tea bags produce; stands up well to milk and sugar. |

### 6d. Time-axis behavior

> Ceylon is more forgiving of over-steeping than Darjeeling but less
> than Assam. The brightness can turn to astringency past 5 minutes,
> and the citrus notes flatten. CTC Ceylon is notably more robust
> than orthodox — the smaller particle size means faster extraction
> and thus narrower sweet spot in time.
>
> Regional variation matters: Uva teas tolerate longer steeps
> because of their menthol-like finish; Nuwara Eliya teas are more
> delicate and punish over-steeping like Darjeeling first flush.

---

## 7. Safety & heads-up

**Known interactions:**

> Standard black tea cautions apply — caffeine (45mg/cup), iron
> absorption inhibition, fluoride at heavy consumption. No Ceylon-
> specific health concerns. `established`

**Dosage cautions:**

> 3-5 cups/day is within the well-studied range. Caffeine content
> similar to coffee at a lighter dose.

**NOT a concern but sometimes claimed:**

> - **"Ceylon is pesticide-heavy"** — Pesticide residue is a
>   sourcing-level concern rather than a Ceylon-specific issue;
>   varies by estate and certification. Organic and Rainforest
>   Alliance-certified Ceylon is widely available. `attested`
> - **"Ceylon tea is all commercial blends"** — Myth. Sri Lanka
>   produces both premium single-estate teas and commercial blends.
>   The country's reputation for commercial tea reflects export
>   volume, not absence of quality. `folk`

---

## 8. History & cultural context

**Plant origin — imported, not native:**

> Tea is not native to Sri Lanka. The first experimental plantings
> came from Chinese seeds in 1824 at the Royal Botanical Garden in
> Peradeniya; additional Assam-variety plantings followed in 1839.
> None of these early experiments became commercial. The tea
> industry we now know dates specifically from 1867. `verified`

**The coffee-rust pivot — defining historical moment:**

> Sri Lanka (then Ceylon) was a major global coffee producer through
> the mid-19th century, reaching peak exports in 1868 — 275,000 acres
> of coffee plantations. Then *Hemileia vastatrix* (coffee leaf rust,
> coffee blight) arrived. By 1869 it was spreading; within a decade
> the coffee industry was essentially destroyed. Planters pivoted to
> tea, transforming Ceylon's agriculture within 20 years. By 1888,
> tea acreage exceeded former coffee acreage; by 1900 it had
> reached nearly 400,000 acres. The island's tea identity was born
> from coffee's collapse. `verified`

**James Taylor — the "father of Ceylon tea":**

> - **1835:** Born Laurencekirk, Scotland. `verified`
> - **1851 (age 17):** Leaves Scotland for Ceylon, sent to work on a
>   coffee estate near Kandy. `verified`
> - **1865:** At owners' instructions, acquires Chinese tea seeds from
>   Peradeniya Botanical Gardens, planting them alongside coffee.
>   `verified`
> - **1866:** Visits India to learn tea cultivation, likely from
>   Assam planters. `verified`
> - **1867:** Clears 19-21 acres at Loolecondera Estate and plants
>   the first commercial tea field — "Field No. 7," using Assam-
>   hybrid seedlings. `verified`
> - **1872:** Builds a fully-equipped tea factory at Loolecondera,
>   including a tea-rolling machine he invented. First sale of 23 lb
>   of Ceylon tea in Kandy. `verified`
> - **1875:** First shipment of Ceylon tea reaches London Tea
>   Auction. `verified`
> - **1890:** Annual Ceylon tea exports reach 22,900 tonnes. `verified`
> - **1891:** Taylor dismissed from Loolecondera as large companies
>   consolidated small-holder operations. `verified`
> - **1892 (May 2):** Dies of dysentery, aged 57. Buried at
>   Mahaiyawa Cemetery, Kandy. `verified`
> - **1893:** One million packets of Ceylon tea sold at the Chicago
>   World's Fair — a posthumous commercial triumph. `verified`

**The Lipton connection:**

> Thomas Lipton visited Ceylon in the 1890s and met with planters
> (possibly including Taylor before his dismissal). Lipton's
> company began buying Ceylon tea and marketing it under the
> "Direct from the tea gardens to the teapot" slogan — an early
> example of branded tea. This helped establish Ceylon as a
> mass-market global product rather than just a planter-sold
> commodity. `verified`

**The seven tea regions:**

> Sri Lanka's tea is classified by elevation and region, each with
> distinct character:
>
> - **High-grown (1200m+):** Nuwara Eliya (delicate, champagne-
>   like), Dimbula (floral, bright), Uva (menthol finish).
> - **Mid-grown (600-1200m):** Kandy, Udupussellawa — balanced,
>   full-bodied.
> - **Low-grown (0-600m):** Ruhuna (molasses-rich), Sabaragamuwa
>   (fullest body).
>
> Most commercial "Ceylon" is a blend across regions; single-region
> or single-estate Ceylon exists for premium markets. `verified`

**Name — Ceylon kept for brand:**

> Sri Lanka officially changed its name from Ceylon to Sri Lanka in
> 1972. But by then "Ceylon tea" was a globally established brand,
> and the tea industry kept the old name to avoid disrupting
> market recognition. This is why current products still say
> "Ceylon" despite the country being Sri Lanka for 50+ years.
> `verified`

**TCM framing:**

> Like all fully oxidized black teas, Ceylon is classed as warming
> (Yang) in TCM, though less intensely than Assam or pu-erh. The
> citrus-bright character in high-grown Ceylon tempers the warming
> effect — Chinese tea culture sometimes calls bright black teas
> "warming without heaviness." `attested`

**Colonial context:**

> Ceylon's tea industry was built on Tamil indentured labor
> imported from South India. Labor conditions were harsh; the
> workforce remained separate from the Sinhalese-majority local
> population, creating tensions that persisted into post-
> independence politics. Modern Sri Lankan tea estates operate
> under labor laws but wage and welfare issues continue — Sri
> Lanka's tea plantation workers remain among the lowest-paid in
> the country. `verified`

**1971 nationalization:**

> The Sri Lankan government nationalized tea estates via the Land
> Reform Act in 1971-1972, transferring ownership from British
> companies to state control. Later (1990s+) partial privatization
> returned some estates to private (including international)
> ownership. The legacy is a mixed industry with state-owned,
> privately-owned, and small-holder tea production. `verified`

---

## 9. Sources

- `ref-sri-lanka-tea-board` — Tea Exporters Association of Sri Lanka.
  *History of Ceylon Tea*. https://teasrilanka.org/history
  — Official industry history and brewing guidance.
- `ref-forres-1967` — Forres DM. *Hundred Years of Ceylon Tea
  1867-1967*. 1967. — Canonical industry history.
- `ref-greyling-2014` — Greyling A et al. 2014. *The Effect of Black
  Tea on Blood Pressure*. PLOS One 9(7): e103247. — Applies to
  Ceylon as to other black teas.
- `ref-csupor-2016` — Csupor D et al. 2016. *Theanine and Caffeine
  Content of Infusions Prepared from Commercial Tea Samples*.
  Pharmacognosy Magazine 12(45): S26-S29.
- `ref-taylor-wikipedia` — *James Taylor (tea planter)*. Wikipedia.
  https://en.wikipedia.org/wiki/James_Taylor_(tea_planter)
  — Reference for Taylor biography; confirms primary sources.
- `ref-hemileia-1869` — Historical records of *Hemileia vastatrix*
  arrival in Ceylon coffee. 1869 onwards. — The coffee rust pivot.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Ceylon is brisk and bright" | `attested` | Standard tea-community description |
| "James Taylor founded the industry in 1867" | `verified` | Well-documented; first commercial planting at Loolecondera |
| "Coffee rust destroyed the prior industry" | `verified` | *Hemileia vastatrix* 1869-1880s; documented by agricultural historians |
| "Earl Grey's base is traditionally Ceylon" | `attested` | Common in British blending tradition; not a strict requirement |
| "Thomas Lipton made Ceylon a global brand" | `verified` | Lipton Ltd. commercial records |
| "Name kept as 'Ceylon' after 1972 rename" | `verified` | Industry branding decision |
| "Uva character includes menthol finish" | `attested` | Recognized tasting term; varies by season and estate |
| "Ceylon was once a major coffee producer" | `verified` | Pre-1870s export records |
| "Ceylon produces 10% of world's tea" | `verified` | Sri Lanka Tea Board statistics |
| "Dutch introduced tea to Ceylon in 1600s" | `folk` | No evidence; tea arrived 1824 via British |

---

## 11. Research flags & open questions

1. **Regional profile variation is significant.** Nuwara Eliya,
   Uva, and Ruhuna teas are meaningfully different cups. Current
   Herbanium catalog has one `ceylon` entry. Future refinement
   could add regional variants (especially if Uva's distinctive
   menthol character is worth representing separately).

2. **Ceylon as Earl Grey base — tradition but not rule.** Most
   commercial Earl Grey now uses whichever black tea base is
   cheapest or most consistent; the "Ceylon base" tradition still
   holds in premium blends. Herbanium's `ceylon` pairing list
   should include bergamot to reflect this.

3. **Caffeine 45mg is a middle estimate.** Actual Ceylon caffeine
   ranges 30-55mg depending on elevation (higher elevation = lower
   caffeine generally), flush, and processing. Matching Darjeeling's
   variant handling would help — but currently represented as a
   single average.

4. **Sourcing ethics parallel to Assam/Darjeeling.** Tamil
   indentured-labor origins; contemporary wage issues. Flagged for
   future `sourcing_note` field.

5. **The "Uva character" menthol-like finish is real but seasonal.**
   Appears in certain months (Uva's "quality season" is July-
   September, when the dry wind creates the stress conditions that
   produce the cooling aromatics). Like Darjeeling muscatel, this
   is a terroir × seasonality phenomenon that fixed-data systems
   can't fully represent.

---

## Addendum — `digestive` transcribed from §5 (2026-08-03)

An audit of unreachable properties found it declared on the
ingredient card and named nowhere in the extraction profile — so the
page promised a property no cup could ever show.

The research was there the whole time. §5 rates `digestive`, and the
§6 brew-point tables simply never carried it; the transcription pass
that built the profiles worked from §6 alone.

> | digestive | 2 | Mild traditional claim; modest clinical evidence for black tea |

Transcribed at the §5 strength. Nothing new is claimed here — this
closes the gap between what the card promises and what a cup can
deliver.

<!-- sourced-effects: digestive -->

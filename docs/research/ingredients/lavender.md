# Ingredient Research — Lavender

> Auto-populated scaffold. Fields marked `[RESEARCH]` need verification
> with real sources before publishing.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `lavender` | matches INGREDIENTS key |
| **display name** | Lavender | |
| **latin / scientific** | *Lavandula angustifolia* | English / true lavender — the culinary species. *L. × intermedia* (lavandin) and *L. stoechas* (Spanish lavender) are related but harsher and usually not used in tea. |
| **category** | flower | |
| **subcategory** | — | |
| **also known as** | English lavender, true lavender, common lavender | |

---

## 2. Overview

**One-line essence** (blurb field):

> Use sparingly — culinary lavender is a strong voice in any blend, bright and slightly cooling.

*(existing app copy — keep as-is unless research suggests refinement)*

**Short description** (2-3 sentences for ingredient page):

> Lavender is a Mediterranean shrub whose flower spikes are harvested for their intense aromatic oil. In tea, it shows up as a high-register floral note with a cooling, almost menthol-adjacent quality from linalool and other terpenes. Culinary cultivars — particularly Hidcote and Munstead — are bred to be less resinous than ornamental varieties, which can taste soapy or medicinal.

> **[RESEARCH]** Verify the Hidcote/Munstead cultivar claim about being bred for culinary use — this is widely stated but check source.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- floral
- pine
- camphor

*(existing `flavors` — these capture the character well; "pine" and "camphor" are the resin/terpene side that makes lavender divisive in tea)*

**Aroma notes:**

> Stronger than the flavor in a finished cup — lavender's essential oil content is higher than most tea flowers.

**Mouthfeel:**

> Slightly cooling (linalool), can feel drying at high doses.
> Well-brewed it's light; over-brewed it's soapy.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [90, 95] | [RESEARCH] | Current app value |
| **time range (seconds)** | [180, 240] | [RESEARCH] | Short — lavender over-extracts quickly into soap territory |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | |
| **tsp-to-grams** | — | | Use category default; lavender buds are light, may need override during research |

> Dose note: current app lists "½ tsp · 200ml" — half the standard flower
> dose. This reflects lavender's intensity and is a good reminder that
> dose matters as much as brewing params for strong aromatics.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 4 | Well-established traditional use; linalool has anxiolytic effect in multiple studies |
| sleepy | 2 | Secondary — lavender is more "relaxing" than "sedating" |
| settle | | [RESEARCH] — some traditional digestive use in Mediterranean folk medicine, check magnitude |
| comfort | | [RESEARCH] |
| focus | | [RESEARCH] — some paradoxical reports of mental clarity, but likely confounded with placebo / aromatherapy expectancy |
| energy | | Not typical |
| cooling | 2 | Linalool gives a slight cooling register |
| bitterness | 1 | Low at standard brew, can rise sharply at long steeps |

> Existing ratings: [["calm", 4], ["sleepy", 2]]. Reasonable.

---

## 6. Extraction profiles — the three data points

> Mock values currently in `extractionProfiles.js` — verify during research.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 120 |
| flavors | [RESEARCH] — likely [floral] only (delicate side) |
| effects | [RESEARCH] — likely [["calm", 2]] |
| character | A softer lavender — just the honey-floral top notes, before the pine/camphor volatiles extract |
| sources | [RESEARCH] |

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 180 |
| flavors | [floral, pine, camphor] |
| effects | [["calm", 4], ["sleepy", 2]] |
| character | The canonical lavender cup — bright, clean, unmistakably itself |
| sources | [RESEARCH] |

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 240 |
| flavors | [RESEARCH] — likely [pine, camphor, bitter] — the soap register |
| effects | [RESEARCH] — calm effect plateaus; bitterness rises |
| character | Over-extracted lavender — medicinal, soapy. Worth documenting as the failure mode to avoid |
| sources | [RESEARCH] |

> Lavender has perhaps the narrowest useful brewing window of any
> herbal in the catalog. The "strong" profile is genuinely worse
> than standard, not just different — document that honestly.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current app: `null`. Likely additions after research:
>
> - **[RESEARCH]** Large doses / essential oil internally: possible
>   sedative additive effects with CNS depressants. Tea-strength
>   exposure is very low; may not warrant a warning.
> - **[RESEARCH]** Pregnancy: some sources caution against high doses
>   of lavender essential oil; culinary tea doses likely fine but worth
>   confirming.
> - **[RESEARCH]** Young boys + topical lavender oil: widely-cited case
>   reports of gynecomastia, but this is topical oil (high dose) not
>   tea. Likely not relevant to Herbanium but worth noting as something
>   NOT to include in headsUp.

**Dosage cautions:**

> Half-teaspoon dose noted above. "Less is more" is the real rule with
> lavender in tea.

**NOT a concern but sometimes claimed:**

> **[RESEARCH]** The lavender-gynecomastia claim has been widely
> repeated from topical oil exposure and is often misapplied to tea.
> Worth explicitly excluding from headsUp so future maintainers don't
> add it reactively.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| linalool | [RESEARCH] | calm, cooling | [RESEARCH] |
| linalyl acetate | [RESEARCH] | calm | [RESEARCH] |
| camphor | [RESEARCH] | cooling, the "medicinal" register | [RESEARCH] |
| 1,8-cineole | [RESEARCH] | | [RESEARCH] |

> Lavender essential oil is one of the most well-studied herbal oils;
> compound data should be highly obtainable. Target high confidence.

**characterizedPct estimate:**

> [RESEARCH] — likely 70%+ given how well-studied lavender oil is.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-1 | [RESEARCH] — likely Cavanagh & Wilkinson (2002), "Biological activities of lavender essential oil" | journal review |
| ref-2 | [RESEARCH] — Silexan / Lasea anxiolytic clinical trials (German, 2000s-2010s) | clinical |
| ref-3 | [RESEARCH] — European Medicines Agency herbal monograph on *Lavandulae flos* | monograph |
| ref-4 | Mrs. Grieve, *A Modern Herbal* (1931) — public domain, good for traditional use and etymology | book |

---

## 10. Facts for the Steep screen

*(Existing facts preserved.)*

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | history | The name comes from the Latin *lavare* — to wash — because Romans scented their baths with it. | well-established etymology |
| 2 | history | Queen Elizabeth I reportedly required lavender conserve on her royal table every day. | [RESEARCH] verify — widely repeated but primary source unclear |
| 3 | fact | Hidcote and Munstead — the most common culinary cultivars — were both bred in England in the early 1900s. | [RESEARCH] verify dates and breeder |
| 4 | culture | Bees pollinating lavender fields can produce honey that carries the flower's distinct floral note. | well-established (terroir-of-honey concept) |
| 5 | fact | *(candidate)* Lavender's calming compounds extract even at low temperatures — why a cooler steep still works. | [RESEARCH] — add if confirmed |

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> - The Mediterranean hillsides that lavender comes from give it a
>   distinct "garrigue" association — the same landscape character as
>   thyme, rosemary, wild oregano. Tea context is usually severed from
>   this, but lavender grown in Provence vs. Bulgaria vs. Tasmania
>   produces meaningfully different oil profiles.
> - Lavender is one of the few aromatics whose tea use is historically
>   recent (mainly 20th century) despite the plant being in culinary /
>   medicinal use for millennia. Most of its tradition is in sachets,
>   baths, oils — not cups.

**Personal notes:**

> [TOMMY] — blank for now

**Questions that weren't resolvable from sources:**

> [RESEARCH] gaps:
> - Whether cultivars genuinely differ enough that Herbanium should
>   recommend specific ones (Hidcote vs. Munstead vs. Provence)
> - Whether pregnancy warning applies to tea doses or only essential oil

---

## 12. Confidence self-assessment

> Fill in after research.

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | | |
| Effects ratings | | |
| Extraction profiles | | current values are MOCK |
| Safety notes | | |
| Facts | | |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified
- [ ] Flagged

---

## Notes for this scaffold

- **Confident:** Identity, caffeine=0, flavor tags, general brewing window shape, Elizabethan / Roman etymology.
- **Plausible but unsourced:** Specific temp/time, effect magnitudes, cultivar history details, bee-honey claim.
- **Missing:** Primary sources for everything — particularly the linalool / anxiolytic mechanism and clinical trials.

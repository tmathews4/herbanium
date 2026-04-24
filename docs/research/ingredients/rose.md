# Ingredient Research — Rose Petal

> Auto-populated scaffold. Fields marked `[RESEARCH]` need verification
> with real sources before publishing.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `rose` | |
| **display name** | Rose Petal | |
| **latin / scientific** | *Rosa × damascena* | Damask rose — the most common species in tea and rose water. *R. centifolia* (Provence rose) is the second-most common, more perfumed. |
| **category** | flower | |
| **subcategory** | — | |
| **also known as** | damask rose, Bulgarian rose, Persian rose | Named for Damascus but likely originated further east; now grown commercially in Bulgaria, Turkey, Iran, Morocco |

---

## 2. Overview

**One-line essence** (blurb field):

> Subtle, powdery, and romantic. Lifts a blend into something hand-written.

*(existing — keep)*

**Short description** (2-3 sentences for ingredient page):

> Dried rose petals — overwhelmingly from *Rosa × damascena*, a naturally-occurring hybrid that likely originated in the Middle East — have been used across Persian, Turkish, Moroccan, and Indian cuisines for at least a thousand years. In tea they contribute a gentle floral sweetness rather than a dominant flavor; more often a supporting voice than a lead. Rose pairs especially well with cardamom, green tea, and black tea — combinations that recur across traditions from Kashmiri *noon chai* to Persian black tea.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- floral
- sweet
- fruity

*(existing; accurate)*

**Aroma notes:**

> Higher than the flavor — rose is an aromatic-forward ingredient.
> A "honey-raspberry-violet" compound character.

**Mouthfeel:**

> Light, slightly coating. Never astringent in normal use.
> Over-brewed rose can turn perfumy or "cosmetic-tasting" — the soap failure mode.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [90, 95] | [RESEARCH] | Current app; below boiling to preserve delicate aromatics |
| **time range (seconds)** | [240, 300] | [RESEARCH] | Moderate |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | |
| **tsp-to-grams** | — | | Rose petals are very light; category default may be too heavy — [RESEARCH] |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 3 | Traditional use in Ayurveda and Persian medicine as emotional heart-opener / mild calmative |
| sleepy | | Not a primary effect |
| settle | | [RESEARCH] — some traditional digestive use |
| comfort | | [RESEARCH] — the "warmth" of rose is more emotional than physical |
| focus | | |
| energy | 3 | Current value — [RESEARCH] whether this is right or a data-entry artifact; rose isn't typically considered energizing |
| cooling | | |
| bitterness | 1 | Very low; rose petals are one of the least tannic flowers |

> Existing: [["calm", 3], ["energy", 3]]. The `energy` rating is
> questionable — rose is not typically classified as energizing in any
> tradition. May be legacy data; verify and likely adjust during research.

---

## 6. Extraction profiles — the three data points

> Mock values — verify.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 120 |
| flavors | [RESEARCH] — likely [floral, sweet] |
| effects | [RESEARCH] |
| character | Delicate — just the top-note rose perfume, before anything deeper extracts |
| sources | [RESEARCH] |

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 240 |
| flavors | [floral, sweet, fruity] |
| effects | [["calm", 3]] |
| character | The canonical rose — romantic, honeyed, visually and aromatically distinctive |
| sources | [RESEARCH] |

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 300 |
| flavors | [RESEARCH] — likely [floral, fruity, slightly perfumy] |
| effects | [RESEARCH] |
| character | Pushes into "cosmetic" — rose at its most assertive. Good as a feature, overwhelming as a base |
| sources | [RESEARCH] |

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current: "Source food-grade petals — ornamental roses may carry pesticide residue."
>
> This is the most important real-world caution for rose. Unlike most
> ingredients, where sourcing doesn't matter much, dried rose for tea
> must be food-grade because ornamental roses from florists / gardens
> are heavily treated with pesticides and fungicides not meant for
> ingestion. Keep as-is.
>
> Additional considerations:
>
> - **[RESEARCH]** Pregnancy: likely safe at tea doses; traditional
>   Persian and Ayurvedic use during pregnancy is common. Confirm.
> - **Allergies**: rare but possible, particularly for those with
>   sensitivity to roses topically or via perfume.

**Dosage cautions:**

> None at normal intake.

**NOT a concern:**

> [RESEARCH] Check for any specific medication warnings that may be
> overstated — rose has a very clean safety profile in the tea context.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| citronellol | [RESEARCH] | the floral-citrus perfume | [RESEARCH] |
| geraniol | [RESEARCH] | floral-rose scent | [RESEARCH] |
| nerol | [RESEARCH] | rose-petal aroma | [RESEARCH] |
| phenylethyl alcohol | [RESEARCH] | signature rose note | [RESEARCH] |
| rose oxide | [RESEARCH] | distinctive "rose" perception at very low concentrations | [RESEARCH] |

> Rose oil chemistry is one of the best-characterized in the aromatics
> world (because of the perfume industry). Compound data should be
> readily available. Target high confidence.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-1 | [RESEARCH] — Boskabady et al. (2011), "Pharmacological effects of *Rosa damascena*" | journal review |
| ref-2 | [RESEARCH] — Ulusoy et al. or similar on rose essential oil composition | journal |
| ref-3 | [RESEARCH] — cultural / ethnobotany source for rose in Persian / Ayurvedic medicine | book |

---

## 10. Facts for the Steep screen

*(Existing facts preserved.)*

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | fact | The damask rose (*Rosa × damascena*) is the one used in most rose waters and oils — a naturally-occurring hybrid probably from the Middle East. | well-established botanical fact |
| 2 | fact | It takes roughly 10,000 roses to produce a single ounce of rose essential oil — why pure rose oil costs more than gold by weight. | [RESEARCH] verify the ratio; widely cited |
| 3 | culture | Rose petals appear in Persian, Turkish, Indian, and Moroccan cuisine — a tradition that moved along Islamic trade routes. | well-established |
| 4 | fact | The floral perfume comes mostly from rose oxide, citronellol, and geraniol — compounds shared with many citrus fruits. | [RESEARCH] verify compound list |
| 5 | history | *(candidate)* Rose water was one of the most-traded commodities of the medieval Islamic world — Damascus rose bred there gave the whole category its name. | [RESEARCH] — if confirmed |

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> - Rose and cardamom together is possibly the single most recurring
>   pairing in Middle Eastern / South Asian tea culture — worth
>   highlighting in the pairs field and in traditional preparations.
> - Bulgaria's "Rose Valley" (around Kazanlak) is the single largest
>   commercial source of rose oil. The harvest happens at dawn in May /
>   June when oil concentration is highest.
> - Rose petals in tea are usually used whole or in large pieces, not
>   ground — partly for visual, partly because grinding releases oils
>   prematurely.

**Personal notes:**

> [TOMMY] — blank for now

**Questions that weren't resolvable from sources:**

> [RESEARCH] gaps:
> - Whether the "energy" effect in the existing data is supported
>   anywhere or is a data entry error
> - Whether damascena petals vs. centifolia petals produce meaningfully
>   different cups (perfume industry distinguishes them sharply; tea
>   industry less so)

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | | |
| Effects ratings | | `energy` rating needs sanity check |
| Extraction profiles | | MOCK |
| Safety notes | | pesticide warning solid; others need checking |
| Facts | | |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified
- [ ] Flagged

---

## Notes for this scaffold

- **Confident:** Identity, caffeine=0, flavor character, pesticide-
  sourcing warning, general cross-cultural use.
- **Plausible but unsourced:** Temp/time specifics, the "10,000 roses
  per ounce" ratio, damask rose etymology details, compound list.
- **Suspect:** The `energy` effect rating. Worth questioning during
  research — may be legacy copy-paste artifact.

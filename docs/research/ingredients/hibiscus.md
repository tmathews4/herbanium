# Ingredient Research — Hibiscus

> Auto-populated scaffold. Fields marked `[RESEARCH]` need verification
> with real sources before publishing.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `hibiscus` | |
| **display name** | Hibiscus | |
| **latin / scientific** | *Hibiscus sabdariffa* | Roselle — the species used in tea. Distinct from the ornamental hibiscus species (*H. rosa-sinensis* etc.). |
| **category** | flower | *(technically the calyx, not the petals — note for fact #? below)* |
| **subcategory** | — | |
| **also known as** | roselle, karkadé (Arabic), jamaica (Spanish/Mexican), sorrel (Caribbean), sobolo / bissap (West African), flor de Jamaica | One of the most cross-culturally named ingredients in the catalog |

---

## 2. Overview

**One-line essence** (blurb field):

> Ruby-red, tart, and refreshing. Tastes like the idea of cranberries.

*(existing — keep)*

**Short description** (2-3 sentences for ingredient page):

> Hibiscus tea is made from the dried calyces (not the petals) of *Hibiscus sabdariffa*, a tropical plant grown across West Africa, Egypt, Mexico, and Southeast Asia. The cup is a deep ruby red, pleasantly tart, and tastes like cranberry with a floral edge — a signature more about acid than bitterness. It's the same plant behind karkadé, agua de jamaica, and sorrel, prepared differently in each tradition but always centered on that ruby-red sourness.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- tart
- fruity
- cranberry

*(existing; solid)*

**Aroma notes:**

> Mild compared to the flavor — hibiscus is more about palate than nose.
> A slight floral-red-fruit scent if anything.

**Mouthfeel:**

> Sharp and acidic — the defining feature. Mildly drying from the acids.
> Cooling in effect when served iced, which is how most of the world drinks it.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | [RESEARCH] | Herbal — tolerates full boil |
| **time range (seconds)** | [300, 420] | [RESEARCH] | Long steep is fine; tannin content is lower than true teas |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | |
| **tsp-to-grams** | — | | Category default likely fine |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | | [RESEARCH] — not traditionally a calmer, but some anxiolytic claims in modern literature |
| sleepy | | Not a typical effect |
| settle | | [RESEARCH] — traditional use includes mild digestive |
| comfort | | |
| focus | | |
| energy | 2-3 | Current value 3 — reasonable for the bright, tart, vitamin-C-like quality |
| cooling | 3 | Especially when served iced — central to its global use as a summer drink |
| bitterness | | Low — the cup is tart (acid), not bitter (tannin) |

> Existing ratings show a likely copy-paste duplication:
> `[["energy", 2], ["cooling", 3], ["energy", 3]]` has `energy` twice.
> Probably should be `[["energy", 2], ["cooling", 3], ["settle", 2]]`
> or similar. [RESEARCH] — decide during the effects review.

---

## 6. Extraction profiles — the three data points

> Mock values — verify.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 180 |
| flavors | [RESEARCH] — likely [fruity, floral] — tartness milder |
| effects | [RESEARCH] |
| character | A lighter ruby cup, fruit-forward, less sharp |
| sources | [RESEARCH] |

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 300 |
| flavors | [tart, fruity, cranberry] |
| effects | [["energy", 2], ["cooling", 3]] |
| character | Bright ruby, assertive tartness, the cup that says "hibiscus" |
| sources | [RESEARCH] |

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 420 |
| flavors | [RESEARCH] — likely [tart, cranberry, drying] — more pucker, possibly mineral edge |
| effects | [RESEARCH] |
| character | Full tannin and acid extraction — intense. Sweetens well at this strength which is why iced hibiscus is often brewed strong and cut with sugar |
| sources | [RESEARCH] |

> Hibiscus is forgiving of long brewing because its character is acid
> rather than tannin — it doesn't turn bitter the way true teas do.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current: "May lower blood pressure — sip modestly if relevant."
>
> This is the well-established one and is backed by actual clinical data.
> Additional considerations:
>
> - **Blood pressure medications** — additive hypotensive effect; worth
>   being explicit. "Consult a pharmacist if on BP medication."
> - **Pregnancy** — [RESEARCH] some sources flag high doses as
>   emmenagogue. Traditional use is mixed across cultures. Cautious
>   framing warranted.
> - **Iron absorption** — [RESEARCH] some claims that hibiscus interferes
>   with iron absorption via tannin/acid content. Check magnitude.

**Dosage cautions:**

> Strongly brewed hibiscus is intense — typical servings stay around
> 1 tsp per 200ml. Not a concern in normal use.

**NOT a concern:**

> [RESEARCH] Check for overstated liver warnings — some sources claim
> hepatotoxicity at high doses but the evidence is weak.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| hibiscus acid | [RESEARCH] | tartness, mild diuretic | [RESEARCH] |
| malic acid | [RESEARCH] | tartness | [RESEARCH] |
| anthocyanins (delphinidin, cyanidin glycosides) | [RESEARCH] | the ruby color | [RESEARCH] |
| polyphenols | [RESEARCH] | antioxidant, BP-lowering mechanism | [RESEARCH] |

> The BP-lowering mechanism is well-documented in clinical literature —
> good candidate for a well-sourced compound entry.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-1 | [RESEARCH] — likely McKay et al. (2010), *Journal of Nutrition*, hibiscus and blood pressure | journal |
| ref-2 | [RESEARCH] — Cochrane or similar review on hibiscus for hypertension | review |
| ref-3 | [RESEARCH] — cultural / ethnobotany source for karkadé, jamaica, bissap traditions | book / ethnography |

---

## 10. Facts for the Steep screen

*(Existing facts preserved.)*

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | fact | The species name *sabdariffa* likely derives from an Arabic word meaning "a desert plant." | [RESEARCH] verify etymology |
| 2 | culture | Egyptian karkadé, Mexican jamaica, and West African sobolo are all the same plant, prepared in different traditions. | well-established |
| 3 | history | Pharaohs were reportedly served hibiscus tea as a cooling drink — the plant has been found in tomb offerings. | [RESEARCH] verify; widely repeated |
| 4 | fact | The tartness is from hibiscus and malic acids — the same acids that make apples and grapes taste bright. | [RESEARCH] verify the specific acid-identity claim |
| 5 | fact | *(candidate)* What looks like a red hibiscus flower in your cup is actually the calyx — the part under the flower, not the petals. | solid botanical fact worth adding |

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> - In Mexico, agua de jamaica is often the third flavor in the
>   agua-fresca rotation alongside horchata and tamarindo.
> - Sudan and Egypt produce much of the commercial hibiscus supply;
>   the best quality is often graded by calyx size and color intensity.
> - West African "bissap" is often sweetened with ginger and mint,
>   turning it into a very different cup from the European/American
>   hibiscus-alone version.
> - The deep ruby color is the defining visual; anthocyanin color is
>   pH-sensitive (sharper red in acid, purpler in neutral).

**Personal notes:**

> [TOMMY] — blank for now

**Questions that weren't resolvable from sources:**

> [RESEARCH] gaps:
> - Precise BP-lowering magnitude at realistic tea consumption (many
>   trials use concentrated extracts, not tea)
> - Whether iron-absorption interference is clinically significant or
>   only measurable in lab conditions

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | | |
| Effects ratings | | existing list has duplicate `energy` — fix in pass |
| Extraction profiles | | MOCK |
| Safety notes | | BP note is solid; others need checking |
| Facts | | |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified
- [ ] Flagged

---

## Notes for this scaffold

- **Confident:** Identity (all the cross-cultural names), caffeine=0, flavor
  character, BP warning, basic brewing shape, the calyx-not-petal fact.
- **Plausible but unsourced:** Temp/time specifics, effect magnitudes,
  compound chemistry, Pharaoh and Arabic etymology claims.
- **Known bug:** Existing `effects` array has a duplicate `energy` entry
  — must be fixed when shipping real data.

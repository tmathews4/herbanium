# Ingredient Research — Chamomile

> Auto-populated with known facts as a starting point. Fields marked
> `[RESEARCH]` need verification with real sources before publishing.
> Don't trust anything here that doesn't have a source — this is a
> scaffold, not a finished record.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `chamomile` | matches INGREDIENTS key |
| **display name** | Chamomile | |
| **latin / scientific** | *Matricaria chamomilla* | German chamomile, the annual — what's in nearly all tea |
| **category** | flower | |
| **subcategory** | — | (flowers have no subcategory) |
| **also known as** | German chamomile, Hungarian chamomile, true chamomile | distinguished from Roman chamomile (*Chamaemelum nobile*), a different species |

---

## 2. Overview

**One-line essence** (blurb field):

> Small daisy-like flowers with a rounded, honey-apple sweetness. Long used at the end of the day to soften the edges of a wound evening.

*(current app copy — keep as-is unless research suggests refinement)*

**Short description** (2-3 sentences for ingredient page):

> Chamomile is one of the oldest medicinal plants in Western herbal tradition, valued since antiquity as a gentle calmative and sleep aid. The flower heads contain apigenin, a flavonoid that binds weakly to the same brain receptors as benzodiazepines — the likely mechanism behind its reliable calming effect. Nearly all "chamomile tea" is made from German chamomile (*Matricaria chamomilla*), an annual; Roman chamomile (*Chamaemelum nobile*) is a different, more bitter species used more often in perfumery than cups.

> **[RESEARCH]** Verify the apigenin / GABA-receptor mechanism claim. This is widely repeated in popular sources and appears in multiple peer-reviewed studies, but the specific wording ("binds weakly to the same brain receptors as benzodiazepines") should be checked against a primary source.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- honey
- apple
- floral
- hay

*(existing `flavors` field — these are well-established descriptors, confident)*

**Aroma notes:**

> Tracks flavor closely — honey-sweet florality dominates both.

**Mouthfeel:**

> Clean, slightly coating. Not astringent at normal brewing strengths.
> At very long steeps, develops a mild tannic bite.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | [RESEARCH] | Current app value; confirm against German Commission E monograph or similar |
| **time range (seconds)** | [300, 420] | [RESEARCH] | 5-7 minutes is the canonical range — verify |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | Chamomile is caffeine-free, no tea plant content |
| **tsp-to-grams** | — | | Use category default for flowers |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 4 | Well-established; apigenin mechanism |
| sleepy | 3 | Present but secondary to calm; stronger at longer steeps (high-temp apigenin extraction) |
| settle | 3 | Traditional digestive use; mild carminative effect |
| comfort | | [RESEARCH] — possibly 2, consider how users describe a chamomile cup |
| focus | | Not applicable |
| energy | | Not applicable (caffeine-free) |
| cooling | | Not applicable |
| bitterness | 1 | Low at standard brew; can rise to 2 at long hot steeps |

> Existing ratings preserved: [["calm", 4], ["sleepy", 3], ["settle", 3]].
> These feel reasonable. Verify during research that intensity scales match
> documented traditional use — particularly `sleepy`, where some sources
> claim stronger, others more modest, sedation.

---

## 6. Extraction profiles — the three data points

> These are the MOCK values currently in `src/data/extractionProfiles.js`
> (copied here for the research pass to verify or replace). Do not treat
> as sourced until you've checked the numbers against primary research.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 180 |
| flavors | [RESEARCH] — likely [honey, apple, floral] |
| effects | [RESEARCH] — likely [["calm", 2], ["sleepy", 1]] |
| character | A lighter, more delicate cup — apple and honey up front, minimal bitterness |
| sources | [RESEARCH] |

> Key question: does low-temp chamomile extract meaningful apigenin, or is
> calm effect blunted? Apigenin solubility curves would settle this.

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 300 |
| flavors | [honey, apple, floral, hay] |
| effects | [["calm", 4], ["sleepy", 3], ["settle", 3]] |
| character | The canonical chamomile cup — honeyed sweetness, gentle calm, the one most people recognize |
| sources | [RESEARCH] |

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 420 |
| flavors | [RESEARCH] — likely [honey, hay, floral] with some bitterness creeping in |
| effects | [RESEARCH] — likely stronger sleepy, mild bitterness |
| character | Full extraction — pulls more apigenin but also more tannin; the cup for when you need the sedative effect to land |
| sources | [RESEARCH] |

> The existing `variants` field already captures this intuition:
> sleep-intent = 100°C / 420s, calm-intent = 95°C / 300s. That structure
> should inform the profile numbers — strong profile = sleep variant,
> standard = calm variant.

**Do you need a 4th or 5th data point?** Probably not. Chamomile has a narrow brewing window (85-100°C) and the 3 points cover it evenly. Flag if research suggests otherwise.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current app copy: "Ragweed family — uncommon cross-allergy."
>
> This is correct but incomplete. Commonly documented additional cautions:
>
> - **Blood thinners (warfarin, etc.)** — coumarin content, possible mild
>   additive effect. [RESEARCH] confirm magnitude from primary source;
>   this is widely claimed but often overstated in popular sources.
> - **Pregnancy** — [RESEARCH] mixed evidence; some sources flag higher
>   doses as emmenagogue risk. Traditional use during pregnancy is common
>   in some cultures. Err toward "consult a pharmacist" framing.
> - **Ragweed-family allergy** — genuine cross-reactivity (*Asteraceae*
>   family includes ragweed, daisy, marigold). Most users unaffected;
>   worth naming for the minority who are.

**Dosage cautions:**

> Not typically needed — chamomile is well-tolerated at normal intake.

**NOT a concern but sometimes claimed:**

> [RESEARCH] Check for overstated claims (e.g., any antibiotic
> interaction warnings that don't hold up, "causes drowsiness so don't
> drive" when the effect is mild). Document what to exclude.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| apigenin | [RESEARCH] — often cited 0.5-1.2 mg | calm, sleepy | [RESEARCH] |
| bisabolol | [RESEARCH] | settle, anti-inflammatory | [RESEARCH] |
| chamazulene | [RESEARCH] | anti-inflammatory (topical more than internal) | [RESEARCH] |
| matricin | [RESEARCH] — precursor to chamazulene | | |

> Chamomile is one of the better-studied herbals — compound data should
> be obtainable. Good candidate for populating all these fields with real
> citations. Target confidence: high for apigenin, medium for the rest.

**characterizedPct estimate:**

> [RESEARCH] — likely 60-75% once primary flavonoids and essential oil
> components are documented. The essential oil alone has ~120 identified
> compounds; most at trace levels.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-1 | [RESEARCH] — likely German Commission E monograph on *Matricariae flos* | monograph |
| ref-2 | [RESEARCH] — probable apigenin / GABA receptor paper (Viola et al., 1995 or similar) | journal |
| ref-3 | [RESEARCH] — Hobbs, *Chamomile: Medicinal, Cosmetic, and Agricultural Uses* or similar reference | book |

**Starting points to investigate:**

- Google Scholar search: "apigenin GABA chamomile" — the mechanism literature
- PubMed: *Matricaria chamomilla* clinical trials (anxiety, GAD, insomnia)
- German Commission E monograph on *Matricariae flos* (flower) — authoritative for traditional medicinal use
- WHO monograph on medicinal plants, volume 1 (if chamomile is included)
- Culpeper's *Complete Herbal* for historical use (freely available)

---

## 10. Facts for the Steep screen

*(Existing facts preserved; these are pleasant and mostly well-sourced — verify attribution during research.)*

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | history | The Latin name *Matricaria* comes from *matrix*, meaning womb — the Romans used it as a gynecological remedy. | [RESEARCH] verify |
| 2 | history | Ancient Egyptians dedicated chamomile to Ra and used it in the embalming process. | [RESEARCH] verify — this is widely repeated but check primary source |
| 3 | culture | Peter Rabbit's mother gave him chamomile tea after his Mr. McGregor scare — Beatrix Potter knew her folk medicine. | Beatrix Potter, *The Tale of Peter Rabbit*, 1902 |
| 4 | fact | There are actually two main plants called chamomile — German (annual, what's in most tea) and Roman (perennial, more bitter). | well-established botanical fact |
| 5 | fact | Apigenin, the calm-producing compound in chamomile, extracts better at higher temperatures — why sleep-blends want a full boil. | [RESEARCH] — confirm apigenin solubility-by-temp curve |

> Candidate additions to explore during research:
> - Chamomile's use as a "companion plant" in gardens (reportedly improves neighbor plant health; "the plant's physician")
> - Specific placement in European folk medicine for teething infants
> - The *chamaemelon* Greek etymology — "earth apple," for the scent of the crushed leaves

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> - Chamomile was sacred to the sun gods in several ancient pantheons (Ra in Egypt, possibly associated with Apollo-like figures in Greece via the solar-yellow center of the flower).
> - The name *chamaemelon* is Greek for "earth apple" — the scent of crushed chamomile leaves is genuinely apple-like, which is where the name comes from.
> - Traditional folk name "the plant's physician" in European gardening lore — reputed to improve the health of neighboring plants. [RESEARCH] verify; may be folk belief without empirical backing.
> - Chamomile has been found in archaeological sites dating back to the Bronze Age; cultivation is ancient.

**Personal notes** (add your own tasting experience if/when you brew):

> [TOMMY] — blank for now; add after next actual cup

**Questions that weren't resolvable from sources:**

> [RESEARCH] Document gaps here as they emerge. Expected candidates:
> - Precise apigenin mg/cup (varies by flower quality and extraction; may need a range rather than a point estimate)
> - Whether the "blood thinner interaction" warning is supported at normal tea-consumption doses or only at high supplement doses
> - Historical accuracy of the Egyptian embalming claim (widely repeated but primary source unclear)

---

## 12. Confidence self-assessment

> Fill in after research is complete. Starting-scaffold values left blank.

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters (temp/time) | | existing values are app defaults, not independently verified |
| Effects ratings | | existing values are reasoned but unsourced |
| Extraction profiles (3 points) | | current data is MOCK |
| Safety notes | | partial — ragweed allergy is solid, others need checking |
| Facts | | mixed — some well-known, others ("embalming") widely repeated without clear source |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified — confident enough to ship
- [ ] Flagged — specific issues noted in open questions

---

## Notes for this starting scaffold

- **What's confident here:** Identity (latin, category, alt names), caffeine content, the ragweed cross-allergy note, basic flavor tags, the general shape of the brewing window, the two-species fact, and the Peter Rabbit reference.
- **What's plausible but unsourced:** The specific temp/time values, the exact effect magnitudes, the Egyptian embalming claim, the compound-level chemistry numbers, the blood-thinner warning.
- **What's outright missing:** Primary sources. Every `[RESEARCH]` tag marks something that needs citation before it's ship-ready.

The goal of this scaffold is to save you 30-45 minutes of typing the boilerplate and let the research time go toward actual sourcing. Don't treat any of the `[RESEARCH]`-flagged numbers as committed — they're placeholders to be verified or replaced.

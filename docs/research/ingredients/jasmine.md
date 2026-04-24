# Ingredient Research — Jasmine

> Auto-populated scaffold. Fields marked `[RESEARCH]` need verification
> with real sources before publishing.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `jasmine` | |
| **display name** | Jasmine | |
| **latin / scientific** | *Jasminum sambac* | Arabian jasmine / Sampaguita — the species used in tea scenting. *J. officinale* (common jasmine) is more of a perfume species. |
| **category** | flower | |
| **subcategory** | — | |
| **also known as** | sambac jasmine, Arabian jasmine, Sampaguita (Philippines), mogra (Hindi) | |

---

## 2. Overview

**One-line essence** (blurb field):

> Small star-shaped flowers, traditionally layered at night with green or white tea to scent the leaves. Too-hot water kills the perfume.

*(existing — keep)*

**Short description** (2-3 sentences for ingredient page):

> Jasmine in tea is almost never brewed on its own — the tradition is to use fresh jasmine blossoms to scent green or white tea leaves by layering them together overnight, often for several nights in succession. The tea absorbs the flower's aromatic oils, and the flowers are discarded or blended back in. Brewing jasmine flowers directly produces a paler, less complex cup than drinking the tea that's been scented with them. Either way, high temperatures destroy the delicate aromatics — jasmine wants cool water.

> Note: in Herbanium's catalog, `jasmine` refers to the dried flower
> itself used in blends. The scented-green-tea preparation ("jasmine
> green", "jasmine dragon pearls") shows up as a blend combining
> jasmine + a green tea ingredient.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- floral
- sweet
- honeyed
- heady

*(existing; accurate)*

**Aroma notes:**

> The aroma is the whole point of jasmine — dramatically more prominent
> than the flavor. The characteristic "heady" note comes from indole,
> a compound that at high concentrations smells unpleasant but at
> jasmine-cup concentrations reads as intoxicatingly floral.

**Mouthfeel:**

> Very light, clean. The cup's body comes from the tea it's paired with;
> jasmine alone is ethereal.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [75, 85] | [RESEARCH] | Cool — boiling water genuinely damages jasmine aromatics |
| **time range (seconds)** | [120, 180] | [RESEARCH] | Short; jasmine extracts fast |
| **caffeine (mg per ~8oz cup)** | 0 | well-established | (For the flower itself; jasmine-scented green tea obviously contains the green tea's caffeine) |
| **tsp-to-grams** | — | | Dried jasmine flowers are very light — may need override; [RESEARCH] |

> This is one of the only ingredients in the catalog where temperature
> genuinely matters for quality, not just extraction rate. Above ~85°C,
> the delicate esters and volatile compounds that give jasmine its
> perfume actually break down. Worth surfacing pedagogically.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | 3 | Traditional Chinese medicine associates jasmine with calming "heart fire"; supported by some aromatherapy research |
| sleepy | | Not primary |
| settle | | [RESEARCH] — mild traditional digestive use |
| comfort | | |
| focus | | [RESEARCH] — paradoxically, some aromatherapy research suggests jasmine aroma improves alertness / mood; may explain the "energy" rating in existing data |
| energy | 3 | Current value; may be real (via aromatherapy mood-lift) or may be a data artifact — [RESEARCH] |
| cooling | | |
| bitterness | | Very low |

> Existing: [["calm", 3], ["energy", 3]]. Interestingly similar to rose.
> For jasmine there's actually some aromatherapy literature on mood
> effects that might support "energy" as a real property, unlike the
> rose case where it's probably just data entry. [RESEARCH] to confirm.

---

## 6. Extraction profiles — the three data points

> Mock values — verify.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | 75 |
| timeS | 60 |
| flavors | [RESEARCH] — likely [floral, sweet] — the aromatic top |
| effects | [RESEARCH] |
| character | The most perfumed extraction — light, ethereal, aromatic top notes intact |
| sources | [RESEARCH] |

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | 80 |
| timeS | 120 |
| flavors | [floral, sweet, honeyed] |
| effects | [["calm", 3]] |
| character | Canonical jasmine — floral, slightly honeyed, unmistakable |
| sources | [RESEARCH] |

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 180 |
| flavors | [RESEARCH] — likely [floral, heady, slightly flat] — approaching the damage-temp |
| effects | [RESEARCH] |
| character | The far edge of good jasmine — past here, water's too hot and the perfume breaks down. Document this as a quality cliff, not a natural progression |
| sources | [RESEARCH] |

> Unusual profile shape: for most ingredients, "strong" is just more
> extraction. For jasmine, "strong" is approaching the point where the
> thing you brewed for is being destroyed. Worth documenting honestly.

---

## 7. Safety & heads-up

**Known interactions or contraindications:**

> Current: `null`. Possible additions:
>
> - **[RESEARCH]** Pregnancy: some traditional cautions around jasmine
>   essential oil in pregnancy (high doses). Tea-strength exposure is
>   very low. Likely fine but worth confirming.
> - **[RESEARCH]** Species confusion: some *Jasminum* species are not
>   culinary — ensure users know they want *sambac* or a known culinary
>   variety, not random garden jasmine.

**Dosage cautions:**

> None at normal intake.

**NOT a concern:**

> [RESEARCH] Check for any other popular warnings worth excluding.

---

## 8. Compounds (optional)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| benzyl acetate | [RESEARCH] | the "pear-drop" fruity-floral note | [RESEARCH] |
| linalool | [RESEARCH] | calm; shared with lavender | [RESEARCH] |
| indole | [RESEARCH] | the "heady" quality at low concentration | [RESEARCH] |
| jasmone | [RESEARCH] | signature jasmine-perfume character | [RESEARCH] |
| methyl jasmonate | [RESEARCH] | flora-identity compound | [RESEARCH] |

> Jasmine absolute (the perfume industry's concentrated extract) is
> among the most-studied aromatic oils in the world. Compound data
> should be highly accessible.

---

## 9. Sources

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-1 | [RESEARCH] — Hongratanaworakit (2010) on jasmine aromatherapy / mood effects | journal |
| ref-2 | [RESEARCH] — *Jasminum sambac* essential oil composition studies (multiple available) | journal |
| ref-3 | Heiss & Heiss, *The Story of Tea* — good for jasmine-scenting tradition | book |

---

## 10. Facts for the Steep screen

*(Existing facts preserved.)*

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | tradition | Jasmine tea is not flavored — the scent is absorbed from fresh blossoms layered overnight with tea leaves, sometimes across multiple nights. | well-established (Chinese tea tradition) |
| 2 | fact | The flowers are picked during the day when closed, and open to release fragrance only after dark — which is why scenting happens at night. | well-established botanical behavior |
| 3 | culture | *Jasminum sambac* is the national flower of the Philippines and Indonesia; it's also used in Hawaiian leis. | well-established |
| 4 | fact | Real jasmine perfume is vastly more complex than synthetic jasmine notes — more than 100 distinct aromatic compounds contribute to it. | [RESEARCH] verify specific compound count |
| 5 | fact | *(candidate)* Jasmine loses its perfume above about 85°C — the compounds that give it its signature scent actually break down. Cool water, always. | [RESEARCH] — confirm thermal stability claims |

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> - Highest-grade jasmine green teas (e.g., "Jasmine Silver Needle,"
>   "Jasmine Dragon Pearls") can go through 5-7 rounds of overnight
>   scenting with fresh flowers. This is craft-scale — most commercial
>   jasmine green is scented once, sometimes with synthetic oil.
> - The jasmine-sambac variety used for tea has smaller, more intensely
>   scented flowers than the ornamental *J. officinale* most people
>   know from gardens.
> - Jasmine scenting happens at the Fuzhou / Guangxi region of China
>   primarily; Hengxian is sometimes called "the jasmine capital."
> - Chemically, indole is the same compound that at higher concentration
>   contributes to the smell of feces. The jasmine paradox — a tiny
>   amount of "bad" smell is what makes the whole thing work.

**Personal notes:**

> [TOMMY] — blank for now

**Questions that weren't resolvable from sources:**

> [RESEARCH] gaps:
> - Precise thermal stability curve for jasmine aromatics
> - Whether the "energy" effect has real evidence or is a data artifact
>   (more research available for jasmine aromatherapy than for rose,
>   so may actually pan out)
> - Whether dried jasmine alone (what's in most blends) retains enough
>   aromatic character to matter vs. always being used as a scent for tea

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | | temp ceiling important, confirm it |
| Effects ratings | | `energy` plausible but verify |
| Extraction profiles | | MOCK |
| Safety notes | | currently null; confirm that's correct |
| Facts | | |

**Overall status:**
- [x] Draft — needs verification pass
- [ ] Verified
- [ ] Flagged

---

## Notes for this scaffold

- **Confident:** Identity (species matters here), caffeine=0, flavor
  character, the scenting-tradition facts, the botanical-opening-at-night
  fact, national-flower status.
- **Plausible but unsourced:** Temp/time specifics (though the thermal-
  damage claim is important to verify), compound list, "100+ compounds"
  figure.
- **Pedagogically important:** The temperature ceiling. Jasmine is the
  clearest teaching example of "temperature matters for quality, not
  just strength" — pair nicely with gyokuro (60°C) and sencha (75°C)
  in the teaching narrative for the Apothecary catalog.

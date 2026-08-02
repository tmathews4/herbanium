# Ingredient Research — Sencha

> Backfill scaffold to match the depth of the other true-tea research
> files. Numbers verifiable through standard tea-industry references;
> the production-detail material is well-documented. Update with
> primary sources when picked up for a deeper pass.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `sencha` | matches INGREDIENTS key |
| **display name** | Sencha Green | |
| **latin / scientific** | *Camellia sinensis* var. *sinensis* | the "Chinese" variety, Japan-grown |
| **category** | true tea | |
| **subcategory** | green | |
| **also known as** | Japanese sencha | the unqualified word "sencha" almost always means Japanese; Chinese sencha exists but is regional and not exported broadly |

---

## 2. Overview

**One-line essence** (blurb field):

> In 1738 a tea master named Soen Nagatani steamed leaves instead of pan-firing them, and Japan's everyday cup was reinvented overnight. Steam stops oxidation faster than fire — chlorophyll stays green, theanine stays sweet, and the leaf burns at a boil.

*(current app copy — consistent with research)*

**Short description**:

> Sencha is the everyday Japanese green tea, accounting for roughly 80% of all tea consumed in Japan. Unlike Chinese greens (which are pan-fired), sencha is steamed within hours of harvest — a method introduced by Soen Nagatani in 1738 and standardized over the following century. The steaming halts oxidation while preserving the leaf's L-theanine and chlorophyll, producing the green-vegetal, marine, slightly umami character that distinguishes Japanese green tea from any other category. Brewing temperature is critical: above 80°C the cup turns aggressively bitter and grassy, with no return; the 70-80°C window is non-negotiable for a good cup.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- grassy
- marine / seaweed
- umami
- vegetal
- mineral

**Aroma notes:**

> Cut grass, faint sea salt, hay, slight steamed-broccoli register at higher temperatures. The aroma is more vegetal-forward than fruit- or honey-forward.

**Mouthfeel:**

> Light to medium body. Slight astringency at correct temperature; aggressive astringency if brewed too hot. The umami of L-theanine produces a characteristic "dry-savory" mouthfeel similar to a light dashi.

**Basic tastes:**

> `bitter` (1-2 at correct brew, rises to 3+ if over-brewed). Bitterness primarily from catechins — over-extraction at high temp pulls more of these.
>
> `umami` is genuinely present as a felt sensation, not just a flavor metaphor. L-theanine + glutamate co-occur in shaded greens and well-made sencha.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [70, 80] | well-established Japanese tea convention | Below 70°C, extraction is too slow for a balanced cup; above 80°C, bitter catechins dominate over theanine |
| **time range (seconds)** | [60, 120] | well-established | First infusion 60-90s; later infusions can be 30s and still produce. Shorter than most Western teas. |
| **caffeine (mg per ~8oz cup)** | 25-35 | varies by leaf grade | Higher grades (gyokuro-adjacent) carry more |
| **tsp-to-grams** | 1 tsp ≈ 2g | Japanese tea convention | Heavier leaves than Chinese; volume converts differently |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| focus | 4 | The classic "alert calm" — caffeine + L-theanine in roughly 1:2 ratio |
| energy | 3 | Caffeine present but moderated by theanine |
| calm | 3 | L-theanine produces measurable alpha-wave activity in EEG studies |
| uplifting | 2 | Combined with energy, but mild |

---

## 6. Extraction profiles — three temp anchors

### 6a. GENTLE (70°C, 60s / 1 min)

| Field | Value |
|-------|-------|
| tempC | 70 |
| timeS | 60 |
| flavors | [grassy, umami, mineral] |
| effects | [["focus", 3], ["calm", 3], ["energy", 2]] |
| character | Light, sweet, marine. The umami leads; grass plays soft. |

### 6b. STANDARD (75°C, 90s / 1:30)

| Field | Value |
|-------|-------|
| tempC | 75 |
| timeS | 90 |
| flavors | [grassy, marine, umami, vegetal] |
| effects | [["focus", 4], ["energy", 3], ["calm", 3]] |
| character | The canonical Japanese cup. Vegetal-marine body, full umami, mild astringency, the alertness fully present. |

### 6c. STRONG (80°C, 120s / 2 min)

| Field | Value |
|-------|-------|
| tempC | 80 |
| timeS | 120 |
| flavors | [grassy, vegetal, astringent, mineral] |
| effects | [["focus", 4], ["energy", 3], ["calm", 2], ["bitterness", 2]] |
| character | At the edge — astringency starting to climb, theanine masked by catechin extraction. Push past this and the cup turns harsh. |

### 6d. Time-axis behavior

Sencha is the most temperature-sensitive tea in the catalog. Time at 75°C is fairly forgiving (60-180s gives a usable cup), but a 5°C jump above 80°C can render the leaves unusable. The leaves can be re-infused 3-4 times — second cup is deeper and slightly more astringent; third more grassy.

---

## 7. Safety & heads-up

> No major contraindications at typical doses. Caffeine sensitivity for evening drinkers; otherwise gentle.

> Iron absorption modestly impaired when consumed with iron-rich meals (catechin chelation). Drink between meals if iron status is a concern.

---

## 8. Compounds (selected)

| Compound | Approx mg per cup | Effects contributed | Confidence |
|----------|------------------|--------------------|------------|
| L-theanine | 25-50 mg | calm, focus (alpha-wave activity, attention) | high |
| Caffeine | 25-35 mg | energy, focus | high |
| Catechins (EGCG, EGC, ECG) | 100-200 mg total | antioxidant, contributes to astringency at high temp | high |
| Chlorophyll | trace | green color, faint metallic-mineral note | established |

---

## 9. Sources (starting points)

- Goto, T., et al. "Distribution of catechins in Japanese green tea (sencha)." *Food Chemistry* (1996).
- Yilmaz, Y., et al. "Effect of brewing parameters on EGCG content of green tea." (2015).
- Vuong, Q.V. "Optimum conditions for the water extraction of L-theanine from green tea." *Journal of Separation Science* (2011).
- Haskell, C.F., et al. "L-theanine and caffeine in combination affect cognition." (2008).
- Einother, S.J.L., et al. "L-theanine, a unique amino acid of tea and its metabolic effects." (2013).
- Japanese Tea Production Association statistics on sencha consumption ratios.

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | history | verified | In 1738 a tea master named Soen Nagatani steamed leaves instead of pan-firing them, and Japan's everyday cup was reinvented overnight. | well-documented Japanese tea history |
| 2 | fact | established | Sencha makes up roughly 80% of all tea consumed in Japan. | Japanese Tea Association statistics |
| 3 | fact | verified | Brewing temperature for sencha is 70-80°C; boiling water turns the cup bitter and grassy in a way nothing recovers from. | tea-industry convention |
| 4 | fact | verified | Steam stops oxidation faster than fire — chlorophyll stays green, theanine stays sweet, and the leaf burns at a boil. | well-established processing fact |
| 5 | fact | established | Shizuoka prefecture grows about 40% of Japan's sencha — volcanic soil and Pacific air. | Japanese tea-region statistics |
| 6 | fact | verified | First-flush sencha (shincha, picked late April) is the prized version — sweeter, more theanine-rich. | Japanese tea convention |
| 7 | fact | verified | The leaves are steamed within hours of picking — Japanese green tea factories are still mostly built next to the fields. | production reality |
| 8 | fact | established | Sencha contains a high concentration of L-theanine, the amino acid responsible for green tea's "calm focus" character. | ref-haskell-2008 |

---

## 11. Open questions

- Steaming time variations (asamushi vs. fukamushi) — how do they affect L-theanine vs. catechin extraction quantitatively?
- Single-cultivar sencha (Yabukita, Saemidori, Asatsuyu) — chemistry differences worth surfacing in app?

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 2 | Well-established |
| Effects ratings | 2 | L-theanine + caffeine well-studied |
| Extraction profiles | 1 | Three-anchor structure consistent with documented behavior; specific values interpretive |
| Facts | 2 | History + chemistry well-sourced |

**Overall status:** Draft — adequate baseline, deeper sources welcome on cultivar-level chemistry.

---

## Addendum — `cooling` kept, sourced as tradition (2026-08-02)

An audit found `cooling` 2 shipped at the 70°C brew point with nothing
in this document behind it. Kept, because the claim is well documented
— but as **tradition, not as a clinical finding**, on the same footing
as the catalogue's other `sources: traditional` entries.

> In TCM the thermal nature of tea tracks oxidation: minimally
> oxidised white and green teas are cooling (Yin), while black tea,
> dark oolong and shou pu-erh are warming (Yang). Less processing
> keeps the leaf closer to its raw state and therefore cooler; heat
> and oxidation convert that cooling property toward neutral or warm.
> https://pathofcha.com/blogs/all-about-tea/hot-gong-fu-cha-in-the-summer-cooling-chinese-teas
> https://acupuncturetoday.com/article/28505-camellia-sinensis-cha-use-in-traditional-chinese-medicine

Sencha is unoxidised, and its Japanese steam-fixing is the *least*
heat-transforming fixation method in use — steaming halts oxidation
within hours of harvest and preserves the chlorophyll and theanine
that §2 describes, where Chinese pan-firing imparts a toastier,
warmer character. So sencha sits at the cooling end even among greens.

**No controlled trial tests sencha for felt temperature**, and this
should not be presented as though one did. Two other docs in this
catalogue already carry the identical attestation in their §5 tables —
dragonwell ("TCM Yin; unoxidized green tea") and gunpowder ("TCM Yin;
unoxidized green tea character") — so recording it here brings sencha
in line with its own category rather than adding a new kind of claim.

Shipping it at the 70°C point only is consistent: that is the cup the
§6a table describes as the delicate, marine, theanine-forward one,
before catechin extraction takes the cup somewhere else.

<!-- sourced-effects: cooling -->

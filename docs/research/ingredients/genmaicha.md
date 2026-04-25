# Ingredient Research — Genmaicha

> Backfill scaffold to match the depth of the other true-tea research
> files. Production and history well-documented in Japanese tea
> literature; chemistry of the rice contribution less studied.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `genmaicha` | matches INGREDIENTS key |
| **display name** | Genmaicha | |
| **latin / scientific** | *Camellia sinensis* + *Oryza sativa* | tea blended with toasted brown rice |
| **category** | true tea | |
| **subcategory** | green | despite the rice, classified as a green-tea blend |
| **also known as** | "popcorn tea" (English colloquial); 玄米茶 (genmai-cha = "brown-rice tea") | |

---

## 2. Overview

**One-line essence** (blurb field):

> Peasant tea, in origin — Japanese households stretched scarce leaves with toasted brown rice, the rice's tannins softening the leaf's edge. The frugality became style. Half the caffeine, twice the welcome at the end of a meal.

*(current app copy — consistent with research)*

**Short description**:

> Genmaicha is a blend of Japanese green tea (typically bancha or sencha) with roasted, sometimes popped, brown rice. The pairing originated as wartime and post-war frugality — rice was cheaper than tea, and the blend stretched scarce leaves. The toasted-rice character softens the green tea's astringency through Maillard-reaction compounds, and the lower tea-leaf concentration roughly halves the caffeine. Modern premium genmaicha sometimes adds matcha powder, producing a brighter, more umami-forward cup. Brewed slightly hotter than plain sencha (80-85°C) because the toasted rice tolerates heat better.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- toasted (rice)
- nutty
- grassy
- savory / umami
- popcorn (literal — popped grains contribute)

**Aroma notes:**

> Toasty-warm and grassy — the rice gives a faint popcorn-and-grain character on top of the green-tea base. The aroma is more inviting than plain sencha; the warmth reads comforting rather than sharp.

**Mouthfeel:**

> Lighter than plain sencha because of the rice dilution. Slightly thicker body from the rice starch contribution.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [70, 85] | Japanese tea convention | More forgiving than sencha because the rice carries less catechin to over-extract |
| **time range (seconds)** | [60, 150] | well-established | Slightly longer than sencha; the rice releases sweetness slowly |
| **caffeine (mg per ~8oz cup)** | 18-25 | half of plain sencha | Because half the cup is rice, not tea |
| **tsp-to-grams** | 1 tsp ≈ 2g | | |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| comfort | 3 | Toasty, grain-warm character; emotionally welcoming |
| focus | 3 | Lower than plain sencha because tea concentration is lower |
| calm | 3 | L-theanine present but at half-dose |
| energy | 2 | Caffeine present but moderate |

---

## 6. Extraction profiles — three temp anchors

### 6a. GENTLE (75°C, 90s)

| Field | Value |
|-------|-------|
| tempC | 75 |
| timeS | 90 |
| flavors | [grassy, toasted, nutty] |
| effects | [["calm", 2], ["focus", 2], ["comfort", 2]] |
| character | Light, sweet, the rice plays comma to the leaf's quiet vegetal note. |

### 6b. STANDARD (80°C, 120s / 2 min)

| Field | Value |
|-------|-------|
| tempC | 80 |
| timeS | 120 |
| flavors | [grassy, toasted, nutty, savory, popcorn] |
| effects | [["focus", 3], ["calm", 3], ["comfort", 3], ["energy", 2]] |
| character | The everyday cup. Toasty and grassy in balance, gentle umami, the rice and leaf in equal voice. |

### 6c. STRONG (85°C, 150s / 2:30)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 150 |
| flavors | [grassy, toasted, nutty, vegetal, astringent] |
| effects | [["focus", 3], ["energy", 3], ["calm", 2], ["bitterness", 1]] |
| character | The leaf takes over here; rice still present but the catechins climb. |

---

## 7. Safety & heads-up

> No major concerns. Mildly stimulating; consider caffeine timing.

---

## 8. Compounds (notable)

| Compound | Source | Effects contributed | Confidence |
|----------|--------|--------------------|------------|
| L-theanine | tea half | calm, focus | high (tea-side) |
| Caffeine | tea half | energy, focus | high |
| Maillard products (rice roasting) | rice half | aroma compounds, flavor depth | established |
| Pyrazines (rice) | rice half | toasty character | established |

---

## 9. Sources (starting points)

- Japanese Tea Production Association: production statistics for genmaicha as a category.
- Standard Japanese tea references for cultural history (Sasaki, Aoki, etc.).
- Maillard-chemistry references for the rice-roasting contribution: Hodge 1953 and successor literature.
- Most Western tea literature treats genmaicha as a footnote; deeper sources are in Japanese.

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | history | attested | Genmaicha was originally a wartime and post-war frugality drink — rice was cheaper than tea, and the blend stretched scarce leaves. | Japanese tea-history sources |
| 2 | fact | established | The rice's tannins soften the green tea's edge — an accidental blending that became a style. | well-established |
| 3 | fact | verified | Half the caffeine of plain sencha because half the cup is rice, not tea. | content composition |
| 4 | fact | established | The popping rice grains in some genmaicha are added on purpose — a textural and visual flourish. | tea-industry convention |
| 5 | fact | verified | Genmaicha's roasted-rice character comes from the Maillard reaction during the toasting — same browning chemistry as bread crusts. | well-established food chemistry |
| 6 | culture | established | Frequently the recommended cup for sushi pairings — its toasty depth complements the rice in the food. | Japanese culinary convention |
| 7 | fact | established | Modern premium genmaicha sometimes uses matcha-blended sencha — the green is brighter, the umami fuller. | tea-industry convention |
| 8 | fact | verified | Despite tasting roasted, genmaicha's tea base is unfired green tea — the rice carries all the toasted character. | processing reality |

---

## 11. Open questions

- Quantitative caffeine reduction — is "half" rigorous, or does it depend on tea-to-rice ratio?
- Specific Maillard compounds in roasted brown rice and their flavor contributions.
- Rice-tea ratios across grades — premium vs. budget genmaicha may use significantly different proportions.

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 2 | Well-established in Japanese tea tradition |
| Effects ratings | 1-2 | L-theanine/caffeine reduced from plain sencha; "comfort" rating is judgment from cultural use |
| Extraction profiles | 1 | Three-anchor structure consistent with category; specific values interpretive |
| Facts | 1-2 | History well-attested; rice chemistry less rigorously sourced for this exact application |

**Overall status:** Draft — solid baseline, primary-source citations on the rice-chemistry side would strengthen.

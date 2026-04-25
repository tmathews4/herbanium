# Ingredient Research — Lion's Mane

> Backfill scaffold to match the depth of the other research files.
> Lion's mane has growing clinical literature on cognitive effects;
> this file uses what's available with the same epistemic-status
> markers as the other research files.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `lions-mane` | matches INGREDIENTS key |
| **display name** | Lion's Mane | |
| **latin / scientific** | *Hericium erinaceus* | |
| **category** | herbal | functional mushroom; the catalog groups it as herbal rather than its own category |
| **subcategory** | mushroom | optional tagging |
| **also known as** | Yamabushitake (Japanese); Pom Pom Mushroom; Monkey Head; Bearded Tooth | |

---

## 2. Overview

**One-line essence** (blurb field):

> Japan's yamabushi mountain ascetics saw the white cascading tufts and named it for themselves — yamabushitake, mountain-priest's mushroom. Inside it: hericenones, which prompt the brain to make more nerve growth factor. The most palatable mushroom in the cabinet, with the longest tail of effect.

*(current app copy — consistent with research)*

**Short description**:

> Lion's mane is an edible and medicinal mushroom native to temperate forests across the Northern Hemisphere, growing on hardwood trees (beech, oak, maple). It has both a culinary tradition (sautéed, it tastes remarkably like crab or lobster) and a medicinal one — particularly in Buddhist meditation traditions in China and Japan, where it was associated with mental clarity. Modern research has identified two compound families unique or near-unique to the mushroom: hericenones (in the fruiting body) and erinacines (in the mycelium), both of which stimulate nerve growth factor (NGF) production in vitro and in animal models. Clinical trials in humans show modest cognitive improvement at 8-16 weeks of daily use, particularly in mild cognitive impairment.

> **Mechanism note:** Hericenones cross the blood-brain barrier (small molecules, lipophilic) and have been shown to stimulate NGF synthesis in cultured astrocytes. Erinacines are even more potent NGF stimulants but are produced only by the mycelium, not the fruiting body. Most commercial lion's mane supplements emphasize one or the other; whole-mushroom and dual-extract products attempt to capture both.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- savory / umami
- mushroom (mild)
- seafood-like (when sautéed)
- mild

**Aroma notes:**

> Faintly mushroomy, faintly sweet. Less assertive than reishi or shiitake; the most palatable medicinal mushroom by a wide margin.

**Mouthfeel:**

> Thicker body when brewed than green teas. Some texture from polysaccharide content. Not astringent.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [90, 100] | mushroom-decoction tradition | Below 90°C, polysaccharide extraction is too slow |
| **time range (seconds)** | [600, 1800] | medicinal-mushroom convention | 10-30 min decoction; longer for stronger extract |
| **caffeine (mg per ~8oz cup)** | 0 | mushroom, no caffeine source | |
| **tsp-to-grams** | 1 tsp ≈ 1g dried | varies by cut | |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| focus | 3 | Subtle, builds over weeks; not an acute alertness hit |
| grounding | 2 | The mushroom's body and quietness |
| calm | 2 | Background, not pronounced |

> Effects mostly emerge with sustained daily use over 8-16 weeks rather than within a single cup. Acute effects are subtle.

---

## 6. Extraction profiles — three anchors

### 6a. GENTLE (95°C, 600s / 10 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 600 |
| flavors | [savory, mild] |
| effects | [["focus", 1], ["calm", 1], ["grounding", 1]] |
| character | Light decoction — water turns faintly amber, mushroom note delicate. |

### 6b. STANDARD (100°C, 1200s / 20 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 1200 |
| flavors | [savory, umami, mushroom] |
| effects | [["focus", 3], ["grounding", 2], ["calm", 2]] |
| character | The standard medicinal cup — fuller body, mushroom-savory base, mild but real cognitive support over time. |

### 6c. STRONG (100°C, 1800s / 30 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 1800 |
| flavors | [savory, umami, mushroom, earthy] |
| effects | [["focus", 3], ["grounding", 3], ["calm", 2], ["soothing", 2]] |
| character | Long decoction — the polysaccharides and triterpenes fully extracted. |

---

## 7. Safety & heads-up

- Generally well-tolerated. Some users report mild gastrointestinal effects; rare allergic reactions.
- May interact with anticoagulants (mild antithrombotic effect in some lab studies); caution if on blood thinners.
- Not enough pregnancy-safety data; precautionary avoidance recommended.

---

## 8. Compounds (selected)

| Compound | Source | Effects contributed | Confidence |
|----------|--------|--------------------|------------|
| Hericenones | fruiting body | NGF synthesis stimulation, cognitive | high (lab) — medium (clinical relevance) |
| Erinacines | mycelium | NGF synthesis stimulation, more potent than hericenones | high (lab) — medium (clinical relevance) |
| Beta-glucans | fruiting body + mycelium | immune modulation | high |
| Polysaccharides | full mushroom | immune modulation, body/mouthfeel in cup | high |

---

## 9. Sources (starting points)

- Mori, K., et al. "Improving effects of the mushroom Yamabushitake (*Hericium erinaceus*) on mild cognitive impairment: a double-blind placebo-controlled clinical trial." *Phytotherapy Research* (2009). PMID: 18844328.
- Nagano, M., et al. "Reduction of depression and anxiety by 4 weeks Hericium erinaceus intake." *Biomedical Research* (2010).
- Lai, P-L., et al. "Neurotrophic properties of the lion's mane medicinal mushroom." (2013).
- Ratto, D., et al. "Hericium erinaceus improves recognition memory in aging mice." *Nutrients* (2019).
- Wang, M., et al. "Effects of Hericium erinaceus on age-related cognitive decline." (multiple, 2010s).

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | culture | attested | Japan's yamabushi mountain ascetics named the mushroom for themselves — yamabushitake, mountain-priest's mushroom — for the cascading white tufts. | Japanese ethnobotany |
| 2 | fact | verified | Lion's mane contains hericenones, compounds that stimulate nerve growth factor (NGF) production in lab studies. | ref-lai-2013 and others |
| 3 | fact | verified | Clinical trials in mild cognitive impairment show modest but measurable improvement at 8-16 weeks of daily use. | ref-mori-2009 |
| 4 | fact | established | The mushroom genuinely tastes like crab or lobster when sautéed — texture and umami profile closer to seafood than to other mushrooms. | culinary convention |
| 5 | fact | established | Hericenones (in the fruiting body) and erinacines (in the mycelium) are different compounds with similar effects. | ref-lai-2013 |
| 6 | culture | attested | Buddhist meditation traditions in China and Japan associate lion's mane with mental clarity. | Buddhist medical tradition |
| 7 | fact | established | The cascading-icicle look is unique among mushrooms — hard to confuse with toxic look-alikes. | mycology |
| 8 | fact | established | Modern cultivation began in the 1990s — until then lion's mane was nearly always wild-foraged. | mushroom-cultivation history |

---

## 11. Open questions

- Effect size in clinical trials varies widely — methodological inconsistencies (extraction method, dose, duration).
- Hericenone vs. erinacine clinical relevance — most studies use whole-mushroom or fruiting-body extract; mycelium-only products are common but less studied.
- Long-term safety beyond 16 weeks — most trials are short.

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 1-2 | Decoction tradition standard; precise optimal points not well-studied |
| Effects ratings | 1-2 | Acute effects modest; long-term cognitive support has clinical evidence |
| Extraction profiles | 1 | Three-anchor structure consistent with mushroom decoction; specific values interpretive |
| Facts | 2 | History + mechanism well-sourced for the major claims |

**Overall status:** Draft — solid baseline. Mechanism research is active; expect updates as more clinical trials publish.

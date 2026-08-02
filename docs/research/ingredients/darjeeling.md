# Ingredient Research — Darjeeling

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> The "champagne of teas" — focuses on the signature muscatel
> character and its documented insect-mediated origin.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `darjeeling` | matches existing INGREDIENTS key |
| **display name** | Darjeeling | |
| **latin** | *Camellia sinensis var. sinensis* (various cultivars; some assamica hybrids at lower elevations) | **Chinese-variety** — distinct from Assam's assamica. Most tea bushes descended from seeds Robert Fortune smuggled from China in the 1840s-50s |
| **category** | true tea | |
| **subcategory** | black | |
| **also known as** | Champagne of teas; first-flush Darjeeling, second-flush Darjeeling (by season) |

---

## 2. Overview

**One-line essence:**

> The Himalayan black tea with a grape-like "muscatel" character —
> light-bodied, floral, best without milk.

**Short description:**

> Darjeeling is grown on steep slopes of the Himalayan foothills in
> West Bengal, India, at elevations from 600 to 2000 meters. The
> tea bushes are mostly Chinese-variety *Camellia sinensis*, not the
> larger-leafed assamica used in Assam, giving Darjeeling a lighter
> body, floral aroma, and the signature muscatel flavor of the
> second flush. India's first GI-tagged product (2003); only tea
> grown in the 87 designated estates within Darjeeling district can
> legally carry the name.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- muscatel
- floral
- fruity
- bright

**Aroma notes:**

> First flush: fresh, green, faintly floral. Second flush: the
> defining Darjeeling aroma — honeyed, grape-like, sometimes
> compared to wine. Autumnal flush: mellow, with hints of nuts and
> dried fruit. Monsoon flush: workhorse quality, less nuanced.
>
> "Muscatel" is the signature tasting term, coined in the 19th
> century by British buyers who found the flavor reminiscent of
> muscat grapes. It's not hyperbole — the comparison is chemically
> grounded (see §8).

**Mouthfeel:**

> Lighter-bodied than Assam; drinks more like a light oolong at times.
> Moderate astringency. The "thin" feel compared to Assam is why
> Darjeeling is traditionally served without milk — milk overwhelms
> the delicate muscatel character that justifies the price.

**Basic tastes:**

> - `bitter` (1-2) — moderate, lighter than Assam
> - `astringent` (2) — present but restrained; drying without
>   harshness
> - `sweet` (2) — notable especially in second flush; the muscatel
>   character reads sweet in the mouth

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [85, 90] | traditional, Goodricke 2024 | Lower than Assam — Chinese-variety tea is more delicate. Boiling water scalds the leaves and destroys the muscatel. |
| **time range (seconds)** | [180, 240] | traditional | 3-4 min orthodox. First flush shorter (2-3 min); second flush can go 4 min. |
| **caffeine (mg per ~8oz cup)** | 40 | Linus Pauling Institute; Hicks 1996 | Range 35-50; lower than Assam despite being fully oxidized because Chinese-variety bushes have lower caffeine content than assamica |
| **dose** | 1 tsp (~2.5g) per 200ml | traditional | Standard for orthodox black tea |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| uplifting | 4 | **Primary effect** — the bright, muscatel-forward character lifts in a way that Assam doesn't. Darjeeling is the "lighter" black tea in mood terms |
| energy | 3 | Moderate caffeine (40mg) + some L-theanine. Less stimulant-forward than Assam; more alert-calm |
| focus | 3 | Good L-theanine ratio for a black tea (Chinese-variety bushes retain more than assamica). Caffeine + theanine combination supports sustained attention |
| warming | 3 | Fully oxidized black tea = TCM Yang. Less warming than Assam because the lighter body doesn't produce the same body-heat sensation |
| cooling | | Not applicable — oxidized tea |
| calm | 2 | Mild, through the L-theanine angle |
| digestive | | Mild; not primary |
| sleepy | | Not applicable |

> **No change from current app values** `[["energy", 3], ["uplifting", 4],
> ["focus", 3]]` — research confirms these. Adding `warming` 3 to
> represent the TCM axis for black teas (wasn't possible in the old
> vocabulary); minor addition of `calm` 2 for the L-theanine signature.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from Darjeeling Tea
> Association guidance, Goodricke 2024 brewing advice, and standard
> black-tea extraction literature (Astill 2001).

### 6a. GENTLE (85°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 85 |
| timeS | 180 |
| flavors | [floral, bright, fresh] |
| effects | [["uplifting", 3], ["energy", 2], ["focus", 2]] |
| character | First-flush style — light, grassy-floral, almost oolong-like. Pale amber liquor. This is the way premium first-flush Darjeeling is traditionally brewed; anything hotter loses the delicate spring character. |

### 6b. STANDARD (88°C, 210s / 3.5 min)

| Field | Value |
|-------|-------|
| tempC | 88 |
| timeS | 210 |
| flavors | [muscatel, floral, fruity, bright] |
| effects | [["uplifting", 4], ["energy", 3], ["focus", 3], ["warming", 3]] |
| character | The canonical second-flush cup — golden amber liquor, honeyed aroma, unmistakable muscatel. Full body without being heavy. Serve without milk. |

### 6c. STRONG (95°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 240 |
| flavors | [muscatel, fruity, deep, tannic] |
| effects | [["uplifting", 4], ["energy", 4], ["focus", 3], ["warming", 4]] |
| character | Pushes further extraction — useful for CTC-style Darjeeling or autumn flush, both more forgiving than first/second flush. Some loss of the delicate muscatel; gain in body and astringency. |

### 6d. Time-axis behavior

> Darjeeling is more sensitive to over-steeping than Assam. The
> delicate muscatel aromatics are fragile; by 5 minutes in hot water
> they flatten into generic-black-tea character. First flush is
> especially intolerant — 4+ minutes can actively ruin a premium
> cup. Second flush is more forgiving but still benefits from
> attention.
>
> Multi-infusion potential: Chinese-variety Darjeeling can support
> 2-3 gentle infusions gongfu-style, especially with higher-grade
> teas. This is rare in Western practice but increasingly common
> among serious Darjeeling drinkers.

---

## 7. Safety & heads-up

**Known interactions:**

> Standard black tea cautions — caffeine (40mg/cup), iron
> absorption interference when consumed with meals, fluoride at
> heavy consumption. No Darjeeling-specific concerns beyond these.
> `established`

**Dosage cautions:**

> Lower caffeine than Assam makes Darjeeling more flexible — 3-5
> cups/day is reasonable for the caffeine-tolerant adult.

**NOT a concern but sometimes claimed:**

> - **"First flush is decaffeinated"** — Myth. First flush is lighter
>   in body but not significantly lower in caffeine than second
>   flush. `folk`
> - **"Muscatel-flavored Darjeelings have added flavors"** — The
>   muscatel character is 100% natural, produced by the jassid-
>   terpene interaction documented in §8. Commercial flavorings do
>   exist for cheap Darjeeling blends but proper muscatel is
>   unadorned. `established`

---

## 8. History & cultural context

**Plant origin:**

> Most Darjeeling tea is from *Camellia sinensis var. sinensis*
> (Chinese variety). The original seeds came from China in the
> 1840s and 1850s, with Robert Fortune's 1848 covert expedition
> being a major source. The British East India Company planted them
> in the Himalayan foothills because the high-altitude, cool-climate
> terroir suited the Chinese variety better than the tropical
> assamica. Lower-elevation Darjeeling estates sometimes use
> assamica or hybrids. `verified`

**Historical timeline:**

> - **1840s:** First experimental plantings in the Darjeeling hills.
>   `verified`
> - **1850s:** Commercial cultivation begins, using mostly Chinese
>   seeds from Fortune's expedition and other sources. `verified`
> - **1856:** First commercial Darjeeling tea estate established
>   (Alubari). `verified`
> - **Late 19th century:** "Muscatel" character recognized and
>   named by British buyers. Darjeeling establishes premium price
>   position. `verified`
> - **2003:** India grants Darjeeling tea its first Geographical
>   Indication (GI) registration — the country's first GI-protected
>   product. `verified`
> - **2011:** EU grants Darjeeling Protected Geographical Indication
>   (PGI) status. `verified`

**The muscatel story — documented biochemistry:**

> The signature "muscatel" flavor of second-flush Darjeeling comes
> from a specific insect-plant interaction. The tea jassid
> (*Empoasca flavescens* or *Empoasca formosana*, also locally
> called *kakro paat* or "tea green fly") and thrips feed on tender
> tea leaves during May-June, puncturing the leaf surface and
> sucking sap. The leaves respond with defensive secondary
> metabolites — terpenes and phytoalexins, including hotrienol and
> 2,6-dimethyl-3,7-octadiene-2,6-diol. When these compounds are
> moderately oxidized during black-tea processing, they produce the
> grape-like muscatel aroma. `verified` (plant biochemistry);
> `attested` (exact mechanism of flavor generation still being
> refined in the academic literature)
>
> The same insect-mediated biochemistry produces Taiwan's Oriental
> Beauty (Dongfang Meiren, *东方美人*) oolong. This is one of the
> few examples where plant stress from insect feeding produces a
> prized flavor rather than a defect — a fortunate quirk of tea
> biochemistry.

**Flushes:**

> - **First flush** (late March-mid April): Light, fresh, grassy-
>   floral. Pale liquor. Called "in-between" or "spring flush."
>   Delicate and premium; ships directly to Japan and Germany as
>   soon as it's ready. Limited muscatel — the jassids haven't
>   arrived yet.
> - **Second flush** (mid May-June): The muscatel flush. Richer,
>   amber liquor, honey-and-grape aroma. Most prized for the
>   classic Darjeeling character. "Queen of Darjeeling."
> - **Monsoon flush** (July-September): High-volume, lower quality.
>   Heavy rain dilutes flavor; often used for tea bags and
>   commercial blends.
> - **Autumnal flush** (October-November): Smooth, mellow, nuttier.
>   Less intense than second flush but has its own following — some
>   drinkers prefer its balance.
> `verified`

**The 87 tea estates:**

> Darjeeling tea is produced only from 87 designated "tea gardens"
> (a specific administrative term) within the Darjeeling district.
> Estates include Castleton, Puttabong, Margaret's Hope, Makaibari
> (the oldest, 1859), Goomtee, and others. Annual production is
> around 7-10 million kg — tiny compared to Assam's 650+ million,
> which is part of why Darjeeling commands 5-10x the price per kg.
> `verified`

**TCM framing:**

> Darjeeling is classed as warming (Yang) in TCM, though less
> strongly than Assam or pu-erh. The high-altitude, lighter
> oxidation profile puts it at the "gentler Yang" end of the
> spectrum — Chinese tea culture sometimes calls it "neutral-
> warming" rather than fully warming. `attested`

**Colonial context:**

> Like Assam, Darjeeling's industry was built through British
> colonial plantation agriculture with indentured labor. Workers
> were primarily Nepali-origin migrants. Modern Darjeeling tea
> gardens operate under labor laws and certification schemes, but
> wage and welfare issues persist — a 2017-2018 tea-estate strike
> highlighted ongoing tensions. `verified`

---

## 9. Sources

- `ref-muscatel-wiki` — *Muscatel (tea)*. Wikipedia.
  https://en.wikipedia.org/wiki/Muscatel_(tea)
  — Standard reference on muscatel tea flavor and the jassid-
  terpene mechanism.
- `ref-california-teahouse-2026` — "What is a bug-bitten tea?"
  California Tea House.
  https://www.californiateahouse.com/tea-blog/what-is-bug-bitten-tea
  — Accessible explanation of the jassid-terpene biochemistry,
  citing primary research on *Empoasca flavescens* and
  *Jacobiasca formosana*.
- `ref-greyling-2014` — Greyling A et al. 2014. *The Effect of Black
  Tea on Blood Pressure: A Systematic Review with Meta-Analysis of
  Randomized Controlled Trials*. PLOS One 9(7): e103247.
  — Pooled black tea BP data applies to Darjeeling.
- `ref-csupor-2016` — Csupor D et al. 2016. *Theanine and Caffeine
  Content of Infusions Prepared from Commercial Tea Samples*.
  Pharmacognosy Magazine 12(45): S26-S29.
  — Chinese-variety black tea (which Darjeeling is) has higher
  L-theanine than assamica black tea.
- `ref-di-2017` — Di T, Yang Y, Fu J et al. 2017. *Identification
  of a piperonyl-like, sap-sucking hemipteran (Homoptera:
  Cicadellidae) to Darjeeling tea*. J Applied Entomology 142(3).
  — Entomological confirmation of *Empoasca* species in Darjeeling
  tea gardens.
- `ref-gi-darjeeling-2003` — Government of India. Geographical
  Indications Registry registration of Darjeeling tea. 2003.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Darjeeling is the champagne of teas" | `attested` | 19th-century British trade coinage; well-established tasting vocabulary |
| "Muscatel flavor comes from insect-induced terpene production" | `verified` | Documented biochemistry; active research area |
| "India's first GI-tagged product (2003)" | `verified` | Government of India GI registry |
| "Only 87 estates can legally produce Darjeeling" | `verified` | GI registration defines the producing area |
| "Chinese-variety plants, not assamica" | `attested` | True for most but not all — lower elevations use assamica or hybrids |
| "Robert Fortune smuggled the first seeds from China" | `attested` | Historical record; Fortune's 1848-1851 expeditions well-documented |
| "Best without milk" | `attested` | Tea-community consensus; milk overwhelms the muscatel |
| "Second flush is the 'real' Darjeeling" | `attested` | Tea-community preference; not all drinkers agree |

---

## 11. Research flags & open questions

1. **Flush as variant, not separate ingredient.** First flush and
   second flush are meaningfully different cups but probably belong
   under one `darjeeling` entry with variants (as the existing
   app data already handles — `variants` field with intent: "first
   flush" / "second flush"). Consider whether to add autumn flush
   as a third variant.

2. **Muscatel chemistry is active research.** The exact pathway from
   jassid feeding → terpene production → muscatel flavor is still
   being refined. Recent papers (Di 2017, Zeng 2019) continue to
   add detail. The core mechanism is settled; specific compound
   attributions are evolving.

3. **Chinese-variety L-theanine advantage.** Chinese-variety black
   teas like Darjeeling and Keemun retain slightly more L-theanine
   than assamica-variety black teas like Assam. The Csupor 2016 data
   supports this. May justify separate `focus` ratings for Chinese-
   vs assamica-variety black teas if we get more data.

4. **Second-flush availability varies by year.** Jassid populations
   fluctuate; some years produce more muscatel than others. This
   is built into Darjeeling pricing (muscatel-dominant years command
   premiums) but isn't something Herbanium can surface dynamically.

5. **Darjeeling labor ethics** — parallel concern to Assam. Nepali-
   origin worker welfare, 2017-2018 strike, ongoing wage disputes.
   Flagged for future `sourcing_note` field consideration.

---

## Addendum — `calm` kept (sourced), `cooling` removed (2026-08-02)

An audit flagged both as shipped without a prescribing extraction-table
row. They needed opposite answers, and the same axis explains both.

### `calm` — kept

Already researched: §5 rates `calm` 2, "mild, through the L-theanine
angle", and §7's `ref-csupor-2016` is the measurement behind it. It was
only ever invisible to the parity guard because it lives in the
effects-rating table rather than in a §6 brew-point row.

> Csupor D et al. 2016. *Theanine and Caffeine Content of Infusions
> Prepared from Commercial Tea Samples.* 37 commercial samples by HPLC;
> black tea mean L-theanine 5.13 mg/g (white 6.26, green 6.56, oolong
> 6.09) —
> https://www.researchgate.net/publication/293799309_Theanine_and_Caffeine_Content_of_Infusions_Prepared_from_Commercial_Tea_Samples
>
> *Varietal Differences in the Total and Enantiomeric Composition of
> Theanine in Tea*, J. Agric. Food Chem. —
> https://pubs.acs.org/doi/abs/10.1021/jf960432m
>
> *Effects of L-Theanine on the Release of α-Brain Waves in Human
> Volunteers* —
> https://www.jstage.jst.go.jp/article/nogeikagaku1924/72/2/72_2_153/_article

Black tea retains most of the leaf's theanine — less than green, but
nowhere near zero — and Chinese-variety bushes carry more of it than
assamica, which is the Darjeeling case specifically. The felt claim is
alpha-wave "wakeful relaxation," not sedation; `sleepy` stays absent.

**Shipping it at the gentle point only is correct, not an oversight.**
`calm` 1 sits at 85°C/180s and nowhere hotter. Theanine is the
water-soluble amino acid that comes out early; push the cup and
catechin and caffeine extraction climbs past it. Sencha's §6c records
the same mechanism in its own words — "theanine masked by catechin
extraction." The gentle Darjeeling is the theanine cup; the 95°C one
is not.

### `cooling` — removed

§5 of this document already answers it: **"cooling | | Not applicable —
oxidized tea."** The app shipped `cooling` 1 anyway, and shipped it at
95°C — the *most* extracted, hardest-pushed brew point, in the same
`effects` row as `warming` 4. One cup asserting both directions of the
thermal axis at once.

> TCM thermal nature tracks oxidation: the most warming teas are the
> most oxidized — black, dark oolong, shou pu-erh — while minimally
> oxidized white and green teas are the cooling ones.
> https://pathofcha.com/blogs/all-about-tea/traditional-chinese-medicine-heating-chinese-teas

Darjeeling is a fully oxidized black tea. `warming` already carries the
sourced thermal picture, and it climbs with extraction exactly as the
tradition describes. `cooling` was never declared on the ingredient
card either — it existed only in this one profile row. Removed.

<!-- sourced-effects: calm -->

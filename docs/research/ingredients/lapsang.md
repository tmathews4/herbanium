# Ingredient Research — Lapsang Souchong

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> The ancestor of all black tea — first true black tea in history.
> Pine-smoked tradition from Tongmu Village, Wuyi Mountains, Fujian.
> Polarizing flavor; first ingredient to use `grounding` at strength 3.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `lapsang` | matches existing INGREDIENTS key |
| **display name** | Lapsang Souchong | |
| **latin** | *Camellia sinensis var. sinensis* (Xiao Cai Cha cultivar / Qi Zhong) | Native Wuyi small-leaf cultivar; about 50% of Tongmu plantings |
| **category** | true tea | |
| **subcategory** | black (smoked) | |
| **also known as** | Zheng Shan Xiao Zhong (正山小种, "true mountain small type"); historically Bohea tea (European trade name); Yan Xiao Zhong (烟小种) for smoked souchong; Tarry Lapsang (Taiwanese heavy-smoke version) |

---

## 2. Overview

**One-line essence:**

> Pine-smoked black tea from the Wuyi Mountains — the world's first
> black tea, and the rare cup that smells like a campfire by design.

**Short description:**

> Lapsang Souchong is the ancestor of all black tea. Created in the
> late Ming or early Qing dynasty in Tongmu Village, Wuyi Mountains,
> Fujian Province, the leaves are withered, rolled, oxidized, and
> dried over pine wood fires in multi-story smokehouses (*qinglou*).
> The pine smoke produces the tea's signature smoky-resinous aroma.
> Authentic Tongmu lapsang (the only kind that legally bears the
> *Zheng Shan Xiao Zhong* name) is far more nuanced than the
> commercial "smoke bomb" image suggests — beneath the smoke sits
> a fruity, longan-sweet base that the smoke is meant to complement,
> not obliterate.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- smoky
- pine
- woody
- resinous
- longan

**Aroma notes:**

> Unmistakable. Pine smoke leads — campfire, resin, sometimes
> compared to peppered bacon or smoked paprika. Beneath that, a
> sweet fruity base of dried longan (the canonical Chinese
> descriptor) and sometimes cranberry, raisin, or baked stone fruit.
> Quality lapsang has the smoke woven through the fruit; cheap
> lapsang has the smoke standing alone. Heavily smoked Taiwanese
> ("tarry") lapsang pushes the smoke further, often at the expense
> of the underlying tea character.

**Mouthfeel:**

> Full-bodied but not heavy. The smoke creates a perceived weight
> that's distinct from astringency. Surprisingly low in bitterness
> for a black tea — quality Tongmu lapsang is described as smooth
> and almost sweet on the finish. The smoke lingers in the
> exhale-aftertaste rather than dominating the palate.

**Basic tastes:**

> - `bitter` (1) — surprisingly low; the smoke compensates and the
>   long oxidation produces sweet finish
> - `astringent` (2) — moderate, gentler than Assam
> - `sweet` (2) — the longan-and-fruit base; comes through more in
>   later infusions
> - `umami` (1) — subtle smoky-savory note from the pine resin

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [90, 100] | traditional | Full boil works; quality teas reward 90-95°C to preserve the longan-fruit character that hotter water can muddle |
| **time range (seconds)** | [180, 300] | traditional | 3-5 min Western style. Gongfu-style: 10-30s with multiple short infusions reveals the layered character better |
| **caffeine (mg per ~8oz cup)** | 35 | Hicks 1996; tea-industry estimates | Range 30-40; lower than Assam because the small-leaf Xiao Cai Cha cultivar has lower caffeine than assamica varieties |
| **dose** | 1 tsp (~2.5g) per 200ml | traditional | Standard for orthodox black tea; smoked teas don't need more |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| warming | 4 | **Primary effect.** Fully oxidized + smoked = strongly TCM Yang. The most warming of the black teas alongside aged pu-erh |
| grounding | 3 | The deep, smoky, earthy character reads as grounding more than any other true tea. First lapsang use of `grounding` at this strength |
| energy | 3 | Moderate caffeine (~35mg); less stimulating than Assam or Ceylon at equivalent dose |
| digestive | 2 | Traditional claim for smoked teas; modest evidence; the smoke creates a perceived "settling" sensation |
| focus | 2 | Caffeine + some L-theanine; not the primary register for this tea |
| soothing | 2 | The deep, slightly sweet base has a comforting quality once you're past the smoke |
| calm | | Not applicable |
| sleepy | | Not applicable |
| cooling | | Opposite direction |
| uplifting | | Not the register — lapsang is more "settle in" than "lift" |

> **Vocabulary stress test:** Current app data is `[["warming", 4],
> ["digestive", 2]]`. Adding `grounding` 3, `energy` 3, and
> `soothing` 2 captures the tea's character better. The `grounding`
> rating is intentionally one less than `warming` to represent
> warming as the dominant register; grounding plays second voice.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from In Pursuit of Tea
> (2017 firsthand Tongmu reporting), traditional Wuyi practice, and
> general black-tea extraction principles applied to smoked tea.

### 6a. GENTLE (90°C, 180s / 3 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 180 |
| flavors | [smoky, woody, longan] |
| effects | [["warming", 3], ["grounding", 2], ["energy", 2]] |
| character | Restrained extraction — the longan-fruit base comes through more clearly, the smoke sits as a complement rather than the headline. Recommended for premium Tongmu Reserve lapsangs where the smoke is subtle by design. |
| sources | ref-in-pursuit-2017 |

### 6b. STANDARD (95°C, 240s / 4 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 240 |
| flavors | [smoky, pine, woody, resinous, longan] |
| effects | [["warming", 4], ["grounding", 3], ["energy", 3], ["digestive", 2]] |
| character | The canonical lapsang cup — smoky-pine aroma, full body, longan-and-cranberry base. The flavor most drinkers think of when they think "Lapsang Souchong." Pairs well with savory food (especially smoked fish, dark meats) and rich desserts. |
| sources | traditional, ref-trident-cafe |

### 6c. STRONG (100°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 300 |
| flavors | [smoky, pine, resinous, deep, tarry] |
| effects | [["warming", 5], ["grounding", 4], ["energy", 3], ["digestive", 2]] |
| character | Aggressive extraction pulls forward the resinous-tarry register. Useful for less-premium lapsang where there's more raw smoke than nuance to extract. The cup most drinkers complain about when they say lapsang is "too smoky" — usually means the tea was over-extracted, not that the tea is at fault. |
| sources | traditional |

### 6d. Time-axis behavior

> Lapsang is genuinely forgiving in time — the smoke doesn't
> "over-extract" the way bitterness does in other black teas. What
> changes with time is the *ratio* of smoke to underlying fruit:
> longer steeps push smoke forward, shorter steeps preserve the
> longan-fruit character. This makes lapsang a tea where personal
> preference matters more than orthodox brewing rules.
>
> Multi-infusion behavior: Tongmu Reserve lapsang rewards 4-6
> gongfu-style infusions with progressively less smoke and more
> fruit. The tea evolves visibly across the session — many tea
> drinkers consider this the proper way to drink premium lapsang.

---

## 7. Safety & heads-up

**Known interactions:**

> Standard black tea cautions apply — caffeine (~35mg/cup), iron
> absorption inhibition, fluoride at heavy consumption. No lapsang-
> specific health concerns at normal consumption. `established`

> **Smoke compounds — the modest concern:** Pine-smoked teas contain
> trace amounts of polycyclic aromatic hydrocarbons (PAHs) from the
> smoking process, similar to smoked foods. The 2008-2014 EU
> regulatory review concluded that lapsang and other smoked teas
> remain safe at normal consumption (multiple cups daily for years).
> The PAH levels in smoked tea are lower than in grilled meat or
> smoked fish, and significant lifetime daily exposure would be
> required for measurable health effects. `attested`

**Dosage cautions:**

> The PAH consideration is real but minor. Most lapsang drinkers
> consume 1-3 cups occasionally rather than daily. Heavy daily
> consumption (5+ cups, decades) hasn't been studied; conservative
> guidance is to enjoy lapsang as a special-occasion or weekly tea
> rather than a daily staple.

**NOT a concern but sometimes claimed:**

> - **"Lapsang causes cancer"** — Misreading of PAH chemistry.
>   No epidemiological evidence; the per-cup PAH dose is too low
>   to support causal claims. `folk`
> - **"All lapsang is harshly smoky"** — Misconception. Authentic
>   Tongmu lapsang is balanced and nuanced; commercial Taiwanese
>   "tarry" lapsang is heavily smoked because the underlying tea
>   isn't as good. The smoke-bomb reputation comes from low-grade
>   product, not the tradition. `folk`
> - **"Pregnancy risk from smoke compounds"** — No evidence beyond
>   normal caffeine considerations; the PAH dose from occasional
>   tea consumption is negligible compared to other dietary
>   sources. `folk`

---

## 8. History & cultural context

**The first black tea — provenance matters:**

> Lapsang Souchong is widely considered the world's first true black
> tea. The processing techniques — full oxidation, withering,
> rolling, drying — that define all modern black teas (Keemun,
> Assam, Ceylon, Darjeeling, etc.) trace their ancestry to lapsang's
> innovation in the late 16th or mid-17th century. Without
> lapsang, "black tea" as a category wouldn't exist. `verified`

**Origin legends — two versions:**

> The most-told origin story has two competing dates:
>
> - **Late Ming Dynasty (~1568, Longqing era):** Tea farmers in
>   Tongmu Village were processing fresh green tea when an army
>   from Jiangxi Province arrived and occupied their tea factory.
>   The Jiang family farmer, with batches of green tea unprocessed
>   and the army on his property, hurriedly dried the leaves over
>   pine fires to prevent spoilage and stored the rest in sacks.
>   The leaves oxidized in the sacks; combined with the pine smoke,
>   they produced a new style of tea. When the family returned and
>   sold the "ruined" leaves, Dutch traders bought them and came
>   back asking for more. `attested`
>
> - **Mid-Qing transition (~1646):** Civilians fled Wuyi as Qing
>   Manchu soldiers advanced during the unification war against
>   Southern Ming. Same basic story: rushed pine-fire drying,
>   accidentally created smoked black tea. `attested`
>
> The 1568 version has more specific detail (named family, named
> location); the 1646 version aligns with documented Dutch East
> India Company trade records. Both may reflect related real
> events at different scales; modern Chinese tea historians are
> divided. The earliest Dutch trade records of "Bohea" tea
> (lapsang's European name) are from the early 17th century,
> consistent with either origin date. `attested`

**Tongmu Village and Zheng Shan:**

> - **Tongmu Village (桐木村):** Located in Wuyi Mountains National
>   Nature Reserve, Fujian Province. Average altitude 3,937 ft;
>   average temperature 51.8-64.4°F; 2,000mm annual precipitation;
>   80% humidity; soil pH 4.5-5; topsoil 11.8-35.4 inches deep.
>   Foggy ~120 days per year. The village is foreign-access-
>   restricted; the tea industry there operates under tight
>   geographic protection. `verified`
> - **Zheng Shan vs. Waishan:** *Zheng Shan* (正山, "authentic
>   mountain") refers to tea from the protected Tongmu area —
>   centered on Miaowan and Jiangdun villages within a 565-square-
>   km radius. *Waishan* (外山, "outer mountain") refers to teas
>   produced outside this region using similar techniques. National
>   standard GB/T 13738 legally restricts the *Zheng Shan Xiao
>   Zhong* name to authentic Tongmu tea. `verified`

**The Qinglou — multi-story smokehouse:**

> Traditional lapsang is processed in *qinglou* (青楼, sometimes
> 清楼) — three- or four-story wooden buildings with slotted bamboo
> floors. A pine-wood fire burns at the bottom; smoke rises through
> the floors. Tea leaves wither on the upper levels, oxidize on
> middle levels, and dry on the bottom — slowly absorbing pine
> aromatics throughout the process. This isn't a quick smoke-flavoring
> step; it's smoke-integrated processing. The qinglou architecture
> and the dedicated pine-burning process are what produce
> authentic lapsang character. `verified`

**The cultivar — Xiao Cai Cha:**

> Tongmu lapsang is made primarily from *Xiao Cai Cha* (小菜茶,
> "small vegetable tea"), also called *Qi Zhong* (奇种, "exceptional
> variety"). This is a heterogeneous, seed-propagated heirloom
> cultivar — not a standardized clone. The genetic diversity
> contributes to the complexity of the resulting tea. About 50% of
> Tongmu plantings are Xiao Cai Cha; the remainder are other
> Wuyi varieties. `verified`

**The European story — Bohea and the Dutch:**

> Dutch East India Company traders bought lapsang/black tea from
> Fujian merchants in the early 17th century, exporting it to
> Europe. The Europeans called it *Bohea* (a Min-dialect rendering
> of *Wuyi*) — for over a century, "Bohea" was the European trade
> name for any Chinese black tea. Lapsang was particularly suited
> to long ocean voyages because full oxidation made it more
> shelf-stable than green tea. `verified`

**Boston Tea Party connection:**

> The 35 chests of "Souchong" tea destroyed at the Boston Tea Party
> in 1773 included Lapsang Souchong (under its Bohea/Souchong
> trade names). This is the most famous moment in lapsang's
> Western history — the tea that helped trigger the American
> Revolution was, in part, this pine-smoked Fujian black tea.
> `verified`

**Name etymology:**

> "Lapsang Souchong" comes from the Fuzhou (Min) dialect, not
> Mandarin:
> - **La** (拉 / 立) — pine
> - **Sang** (山) — wood
> - **Souchong** (小种, *Xiao Zhong* in Mandarin) — "small sort,"
>   referring to the leaf grade (the smaller, more mature leaves
>   used for this tea, as opposed to bud-only premium grades)
>
> So "Lapsang Souchong" literally translates to something like
> "pinewood small-sort." Mandarin speakers know the same tea as
> *Zheng Shan Xiao Zhong* (正山小种). Both names are correct,
> describing the tea from different angles: one emphasizing
> processing (smoke), one emphasizing origin (authentic mountain).
> `verified`

**Modern variants:**

> - **Smoked Tongmu Lapsang** — Authentic, balanced, premium.
> - **Smoked Waishan Lapsang** — Made outside Tongmu, often more
>   heavily smoked.
> - **Tarry Lapsang (Taiwanese)** — Heavy-smoke version produced in
>   Taiwan; targets Western buyers who want maximum smoke.
> - **Unsmoked Lapsang** — A 21st-century innovation. Made from the
>   same Wuyi cultivars without the pine-smoking step. Reveals the
>   underlying terroir character — fruity, mineral, longan-sweet.
>   Increasingly popular in Chinese domestic markets.
> - **Jin Jun Mei (金骏眉)** — A premium black tea developed in
>   Tongmu in 2005, made from bud-only Xiao Cai Cha. Not smoked.
>   Often classified separately from lapsang but shares the
>   ancestry. `verified`

**TCM framing:**

> Lapsang is among the most strongly warming (Yang) teas in TCM —
> the combination of full oxidation and pine-smoke processing
> intensifies the warming character. Recommended for cold weather,
> post-rain conditions, and "cold pattern" symptoms. Not for hot
> summer days; not for "heat pattern" conditions. `attested`

---

## 9. Sources

- `ref-lapsang-wikipedia` — *Lapsang souchong*. Wikipedia.
  https://en.wikipedia.org/wiki/Lapsang_souchong
  — Reference for naming, origin legends, Boston Tea Party
  connection.
- `ref-in-pursuit-2017` — In Pursuit of Tea. *Lapsang Souchong:
  History, Production, Brewing*.
  https://inpursuitoftea.com/blogs/the-ipot-journal/lapsang-souchong-history-production-brewing
  — Firsthand 2017 Tongmu reporting; describes the qinglou and
  the balance of authentic vs. cheap lapsang.
- `ref-trident-cafe` — Trident Booksellers & Cafe.
  *Smoked Lapsang Souchong (正山小种) Black Tea*.
  https://www.tridentcafe.com/black-tea/smokey-lapsang
  — Detailed cultivar and Tongmu Guan information; processing
  details.
- `ref-china-tea-guru` — ChinaTeaGuru. *What is Lapsang Souchong?*
  https://www.chinateaguru.com/tea-knowledge/what-is-lapsang-souchong-the-ancestor-of-world-black-teas.html
  — Chinese-source perspective on origin legends and processing.
- `ref-gb-13738` — National Standard GB/T 13738. *Black Tea — Part
  2: Souchong Tea*. People's Republic of China. — Legal definition
  of *Zheng Shan Xiao Zhong* and the protected geography.
- `ref-greyling-2014` — Greyling A et al. 2014. *The Effect of Black
  Tea on Blood Pressure*. PLOS One 9(7): e103247. — General black
  tea cardiovascular evidence applies.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "First black tea in history" | `verified` | Tea-historian consensus; processing innovations trace to Tongmu |
| "Created in Ming dynasty (~1568)" | `attested` | One of two competing legends |
| "Created in Qing transition (~1646)" | `attested` | Other competing legend; Wikipedia primary |
| "Origin involved fleeing soldiers" | `attested` | Both legends share this element |
| "Pine-smoked in qinglou smokehouses" | `verified` | Documented architectural and processing detail |
| "Tongmu Village is the only authentic origin" | `verified` | Protected by Chinese national standard GB/T 13738 |
| "Xiao Cai Cha is the traditional cultivar" | `verified` | Botanical/agricultural records |
| "Bohea was the European trade name" | `verified` | Dutch East India Company records |
| "Boston Tea Party included Souchong" | `verified` | Historical inventory of destroyed tea |
| "Strongly warming (TCM Yang)" | `attested` | Standard TCM framing for smoked black teas |
| "Pine-smoked teas cause cancer" | `folk` | Misreading of PAH chemistry; no epidemiology |
| "Real lapsang shouldn't be very smoky" | `attested` | Tea-community consensus on Tongmu vs. tarry-Taiwanese styles |

---

## 11. Research flags & open questions

1. **Origin-date legend is genuinely contested.** 1568 vs. 1646
   matters for tea history. The Herbanium copy uses both dates as
   "late Ming or early Qing" with appropriate `attested` confidence
   markers. Future tea historians may resolve this; for now it's
   honestly ambiguous.

2. **Smoked vs. unsmoked lapsang as separate ingredients?**
   Unsmoked lapsang has emerged as a distinct product since 2005
   (driven partly by Jin Jun Mei's success). Chemically and
   sensorially it's a different tea — same cultivar, same terroir,
   but no smoke means no resinous-pine character. Currently treated
   as one ingredient; consider future split or variant.

3. **PAH safety considerations.** Polycyclic aromatic hydrocarbons
   from the smoke process are real but at low levels in finished
   tea. The EU regulatory review (2008-2014) found smoked tea
   acceptable for normal consumption. Heavy-daily-consumption
   lifetime studies don't exist; conservative guidance is
   "occasional rather than daily" for those concerned.

4. **The polarizing-flavor problem.** Lapsang is genuinely a
   love-or-hate tea. Herbanium's recommendation logic should
   probably weight lapsang less heavily for newcomers and more
   for users who've already engaged with smoky/intense flavors.
   Worth considering an `acquired_taste` flag or similar in the
   data model.

5. **Jin Jun Mei is a related but distinct tea.** Made in Tongmu
   from the same cultivar, but bud-only and unsmoked. Should
   probably be a separate Herbanium ingredient if the catalog
   expands beyond the current 30; sharing some of lapsang's
   ancestry but a fundamentally different cup.

6. **`grounding` at strength 3.** This is the highest grounding
   rating in the catalog so far. The deep, smoky, earthy character
   genuinely earns it — but worth checking against future
   ingredients (pu-erh especially) to ensure relative calibration
   stays consistent.

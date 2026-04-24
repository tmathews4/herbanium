# Ingredient Research — Cloves

> Research pass following `docs/ingredient-research-template.md` v4.
> Vocabulary per `docs/vocabulary.md` v1.
>
> The dental-famous spice — eugenol-rich flower buds from the
> Spice Islands. One of the historically most valuable spices;
> the original driver of European colonial expansion into
> Southeast Asia.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** | `cloves` | matches existing INGREDIENTS key |
| **display name** | Cloves | |
| **latin** | *Syzygium aromaticum* | Formerly *Eugenia caryophyllata* — the older name survives in the word "eugenol" (the tree's defining compound). Myrtaceae family (same as eucalyptus, myrtle, guava) |
| **category** | spice | |
| **subcategory** | flower bud | Dried unopened flower buds, not seeds or bark |
| **also known as** | *Laung* (Hindi); *Qaranful* (Arabic); *Ding Xiang* (丁香, Chinese, "nail aromatic"); *Nagel* (Dutch), *Clavo* (Spanish), *Cravo* (Portuguese) — all meaning "nail" for the characteristic shape |

---

## 2. Overview

**One-line essence:**

> The eugenol flower buds — intensely warming, literally numbing,
> historically among the most valuable spices on earth, and
> still the active ingredient in 85% of modern dental cements.

**Short description:**

> Cloves are the dried unopened flower buds of *Syzygium
> aromaticum*, an evergreen tree native only to the Maluku
> Islands ("Spice Islands") of eastern Indonesia. The buds
> contain extraordinary concentrations of eugenol — 70-90% of
> the essential oil — which is simultaneously a powerful
> antimicrobial, a topical anesthetic, and an aromatic with
> distinctive warming-medicinal character. Historically among
> the most valuable commodities on earth: the clove trade was a
> primary driver of Portuguese, Dutch, and British colonial
> expansion into Southeast Asia from the 15th century onward.
> Today cultivated in Indonesia, Madagascar, Tanzania, and Sri
> Lanka, though the native Maluku cloves still command premium
> prices for their superior eugenol content.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- spicy
- warm
- sweet
- woody
- medicinal

**Aroma notes:**

> Intensely aromatic — cloves announce themselves more
> assertively than any other catalog spice. Dominant character
> from eugenol (sweet-spicy-medicinal, the compound also
> responsible for clove's dental-office smell), β-caryophyllene
> (woody-peppery), and eugenol acetate (softer floral-spicy).
> Quality Maluku cloves register 15-20% higher eugenol than
> Madagascar/Tanzania cloves — a real sensory difference, not
> marketing. Fresh whole cloves smell vividly spicy when
> crushed; stale cloves are dusty and flat.

**Mouthfeel:**

> Distinctive numbing/tingling sensation on the tongue — the
> same eugenol anesthetic effect that makes cloves useful in
> dentistry. Warming heat builds more slowly than ginger but
> sustains longer. Slight astringency. Can be described as
> simultaneously "bright" (aromatic) and "dense" (full-bodied)
> — unusual combination.

**Basic tastes:**

> - `bitter` (2) — mild but present
> - `sweet` (2) — natural sweet register from eugenol's
>   complex aromatic structure
> - `pungent` (4) — strong; close to ginger in heat intensity,
>   different in character (ginger is broader, clove is sharper)
> - `astringent` (2) — moderate
> - `numbing` (2-3) — a genuine physical sensation, not a flavor
>   but worth noting

**Important: dosing matters enormously.** Cloves are probably
the most potent ingredient per gram in the spice catalog —
2-3 cloves transforms a cup; 10 cloves makes it nearly
undrinkable. Small amounts go a long way.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | traditional | Full boil; eugenol and other oils extract well |
| **time range (seconds)** | [300, 600] | traditional | 5-10 min for whole cloves; 3-5 min for ground. Whole cloves extract slowly but produce cleaner flavor |
| **caffeine (mg per ~8oz cup)** | 0 | universal | Caffeine-free |
| **dose** | 2-3 whole cloves per 250ml | traditional | Or ~1/8 tsp ground. **Less is more** — cloves dominate other flavors at higher dose |

> **Whole vs. ground:** Whole cloves are the standard for tea
> and chai preparations; ground cloves are better for baking but
> can turn tea muddy and dusty. Whole cloves also age better —
> ground cloves lose volatiles within 3-6 months.

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| warming | 4 | **Primary effect.** Close to cinnamon's warming level, slightly different character — cloves warm "sharper" while cinnamon warms "broader." Both sit below ginger's 5. Traditional cold-weather spice |
| digestive | 3 | Traditional carminative; eugenol stimulates digestion. Central to chai/masala preparations specifically for this reason |
| grounding | 2 | The deep spicy-woody register has genuine grounding quality |
| soothing | 2 | The eugenol numbing effect provides physical relief (historically why cloves are used for toothache); at tea-strength translates to mild soothing quality |
| energy | 1 | Minor stimulating quality |
| focus | | Not primary |
| calm | | Not primary |
| uplifting | 1 | Mild — cloves are more "grounded" than "lifted" |
| sleepy | | Opposite direction |
| cooling | | Opposite direction |

> **Vocabulary observation:** Cloves provide a genuine physical
> anesthetic/numbing sensation that doesn't map cleanly to any
> vocabulary effect. The `soothing` mapping captures the
> "relief-providing" aspect but not the specific numbing
> mechanism. Similar to turmeric's "anti-inflammatory" gap —
> noting for vocabulary v2 consideration whether pharmacological
> sensations like this deserve more precise representation.

---

## 6. Extraction profiles — three temp anchors + time behavior

> Research status: **sourced** — parameters from traditional
> masala chai preparation, Indonesian kretek cigarette eugenol
> research, and clove essential oil extraction studies.

### 6a. GENTLE (90°C, 300s / 5 min)

| Field | Value |
|-------|-------|
| tempC | 90 |
| timeS | 300 |
| flavors | [spicy, warm, mild, aromatic] |
| effects | [["warming", 3], ["digestive", 2], ["soothing", 1]] |
| character | Lighter clove expression — useful when cloves are one spice among several (chai context) and shouldn't dominate. Preserves some of the brighter aromatic notes; less of the deep medicinal register. |
| sources | traditional |

### 6b. STANDARD (95°C, 480s / 8 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 480 |
| flavors | [spicy, warm, sweet, woody, medicinal] |
| effects | [["warming", 4], ["digestive", 3], ["grounding", 2], ["soothing", 2]] |
| character | The canonical clove preparation — full warming character, pronounced eugenol presence, slight numbing register. Forms the "spicy backbone" of robust chai blends and traditional Chinese Buddhist meditation incense (where clove is historically significant). |
| sources | traditional |

### 6c. STRONG (100°C, 600s / 10 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 600 |
| flavors | [spicy, medicinal, deep, woody] |
| effects | [["warming", 4], ["digestive", 3], ["grounding", 3], ["soothing", 2]] |
| character | Deeper extraction — the medicinal-eugenol register comes forward, the cup takes on almost "dental office" aromatic intensity. Useful for mulled wine, Indonesian *kopi jahe* (ginger-clove coffee), or winter warming preparations where assertive spice is the point. |
| sources | traditional |

### 6d. Dosing caution and blend context

> Cloves are the most dominance-prone spice in the catalog.
> Three cloves per cup is generous; five is getting intense;
> seven overwhelms almost any other flavor. Most traditional
> preparations use cloves as a supporting note rather than the
> primary flavor:
>
> - **Masala chai:** Usually 1-2 cloves per cup among 4-6
>   other spices
> - **Chinese five-spice:** Clove is one of five, used sparingly
> - **Mulled wine:** 3-5 cloves per bottle, balanced with
>   cinnamon, orange, and red wine body
> - **Pomanders (historical):** Cloves stuck into oranges for
>   room fragrance (non-culinary)
>
> The one exception where cloves can dominate: Indonesian
> *kretek* cigarettes, which are essentially clove-infused
> tobacco (though declining due to health concerns).

---

## 7. Safety & heads-up

**Known interactions:**

> - **Anticoagulants:** Eugenol has antiplatelet effects;
>   theoretical additive bleeding risk at high doses. Relevant
>   at supplement/essential-oil doses, not typical tea use.
>   `attested`
> - **Dental procedures:** Eugenol-based dental products can
>   interact with some anesthetics; not a concern for tea.
>   `established`
> - **Liver concerns:** Very high-dose eugenol (typically from
>   essential oil, not tea) has been associated with liver
>   injury in case reports. Tea-strength use is not associated
>   with hepatotoxicity. `attested`

**Pregnancy:**

> Culinary cloves in chai and cooking are safe in pregnancy
> across all traditions. Clove essential oil (concentrated
> eugenol) should be avoided in pregnancy due to theoretical
> uterine effects and lack of safety data. Tea-strength sits
> firmly in the safe culinary range. `attested`

**Eugenol topical considerations:**

> Clove essential oil applied topically can cause skin
> irritation/sensitization; historically used as a toothache
> remedy but even traditional practice cautions against
> prolonged exposure. Not a concern for tea consumption but
> worth knowing if users also use clove essential oil.
> `established`

**NOT a concern but sometimes claimed:**

> - **"Cloves can abort pregnancy"** — Folk belief around
>   culinary clove use; no evidence at normal doses. Essential
>   oil caution is legitimate but different. `folk`
> - **"Cloves cure diabetes"** — Some pre-clinical antihyperglycemic
>   signals; not clinical evidence for cure. `folk`

---

## 8. History & cultural context

**Plant origin — uniquely restricted:**

> *Syzygium aromaticum* is native exclusively to a handful of
> small volcanic islands in the Maluku archipelago of eastern
> Indonesia — specifically Ternate, Tidore, Moti, Makian, and
> Bacan. For centuries (3rd-4th century CE until the 18th
> century), these were the *only* places on earth where clove
> trees grew. This geographic restriction made cloves
> extraordinarily valuable and drove much of the history of
> European colonial expansion into Southeast Asia. The volcanic
> minerals of these specific islands produce cloves with higher
> eugenol content (15-20% higher) than cloves grown elsewhere
> since. `verified`

**Historical timeline — 2,000+ years of trade:**

> - **~2nd century BCE (Han Dynasty China):** Court officials
>   required to chew cloves (*ji-she-xiang*, "chicken-tongue
>   aromatic") to sweeten breath before addressing the
>   Emperor. Among the earliest documented uses outside the
>   Maluku Islands. `verified`
> - **1st century CE:** Cloves reach Rome via Indian Ocean
>   trade routes. Pliny the Elder describes them, but accurate
>   knowledge of origin remains with Arab middlemen who
>   protected the trade. `attested`
> - **~8th-12th century:** Arab traders establish clove trade
>   monopoly through Malacca. Cloves appear in medieval
>   European medicine and cuisine but remain expensive luxury
>   goods. `verified`
> - **14th century:** Clove trade becomes major European
>   commerce driver. Marco Polo describes clove production.
>   `verified`
> - **1511:** Portuguese conquest of Malacca opens direct
>   European access to clove trade. Portuguese establish
>   presence in Maluku Islands 1512, attempting monopoly.
>   `verified`
> - **1605-1663:** Dutch East India Company (VOC) displaces
>   Portuguese; establishes brutal clove monopoly in Maluku,
>   including destruction of clove trees on all islands except
>   Ambon to control supply. The "clove extermination"
>   policies killed thousands of indigenous Moluccans and
>   created one of history's more extreme commodity
>   monopolies. `verified`
> - **1770:** Pierre Poivre (French botanist whose surname means
>   "pepper") smuggles clove seedlings out of Maluku; France
>   establishes clove production on Mauritius, Réunion, and
>   eventually Zanzibar. The Dutch monopoly finally breaks.
>   `verified`
> - **19th century:** Zanzibar (under Omani rule, then British
>   protectorate) becomes a major clove producer; at peak, the
>   island's economy is almost entirely clove-based. `verified`
> - **20th century:** Indonesia re-establishes as major
>   producer; Madagascar, Tanzania, Sri Lanka add supply.
>   `verified`
> - **Modern:** Indonesia remains largest producer (~75%),
>   followed by Madagascar, Tanzania, Sri Lanka. Clove
>   cigarettes (*kretek*) become Indonesia's national smoking
>   style, peaking at 67 billion produced in 1982, since
>   declining. `verified`

**Dental medicine — the eugenol story:**

> Eugenol's anesthetic and antiseptic properties have been used
> in dentistry for at least 200 years. Modern dental uses:
>
> - **Zinc oxide eugenol (ZOE) cement:** Still used for
>   temporary fillings, pulp capping, cavity liners —
>   approximately 85% of temporary dental cements contain
>   eugenol (per Journal of Dentistry 2023).
> - **Topical anesthetic:** Clove oil dabbed on toothache is
>   still a recommended at-home remedy; clinical trials show
>   comparable efficacy to benzocaine for topical dental
>   anesthesia.
> - **Periodontal applications:** Eugenol-containing dressings
>   used post-extraction.
>
> This is one of the most direct translations of a traditional
> remedy to modern medical practice — clove oil has been used
> for toothache in traditional practice for thousands of years,
> and the underlying mechanism (eugenol sodium-channel blockade
> similar to local anesthetics) is now well-understood.
> `established`

**Cultural roles:**

> - **Indonesian:** National symbol; centerpiece of *kretek*
>   cigarette tradition; flavoring in *rendang*, *nasi kebuli*.
> - **Indian:** Component of garam masala; essential in chai;
>   stuffed into meat for roasting; *laung* in Ayurvedic oral
>   health preparations.
> - **Chinese:** Fifth component of five-spice powder; used in
>   red-braised dishes (*hongshao*); Buddhist temple incense
>   historically.
> - **Middle Eastern:** Component in *baharat* spice blends;
>   flavors rice and meat dishes.
> - **European:** Medieval "*cloves of garlic*" is an anglicized
>   term — real cloves were used in mulled wine (*hippocras*),
>   gingerbread, pomanders for room fragrance, ham studding.
> - **African (Zanzibar/East African):** Central to Swahili
>   cuisine; Zanzibar was historically "Spice Island" of East
>   Africa primarily for cloves.
> - **Modern Western:** Apple pie, pumpkin spice, mulled drinks,
>   holiday baking.
> `verified`

**TCM framing:**

> *Ding Xiang* (丁香) translates literally as "nail aromatic."
> TCM classification:
>
> - Warming, pungent, sweet
> - Enters Spleen, Stomach, Lung, and Kidney meridians
> - Warms the middle (digestive center); stops hiccups;
>   warms the kidneys
> - Particularly used for cold-pattern nausea, cold-stomach
>   indigestion, and impotence from kidney yang deficiency
>
> One of the warmer herbs in the TCM materia medica. `verified`

**Ayurvedic framing:**

> *Lavanga* (cloves) in Ayurveda:
>
> - **Rasa:** *Katu* (pungent) + *Tikta* (bitter)
> - **Virya:** *Ushna* (hot/warming)
> - **Vipaka:** *Katu* (pungent)
> - Pacifies *Kapha* and *Vata*; can aggravate *Pitta* in excess
> - Used for digestion, respiratory conditions, dental health,
>   nausea
> `verified`

---

## 9. Sources

- `ref-clove-wiki` — *Clove*. Wikipedia.
  https://en.wikipedia.org/wiki/Clove
  — Comprehensive reference; etymology, production, historical
  trade.
- `ref-kamatou-2012` — Kamatou GP et al. 2012. *Eugenol — From
  the Remote Maluku Islands to the International Market Place:
  A Review of a Remarkable and Versatile Molecule*. Molecules
  17(6): 6953-6981. — Comprehensive eugenol pharmacology and
  historical review.
- `ref-cortes-rojas-2014` — Cortés-Rojas DF et al. 2014. *Clove
  (Syzygium aromaticum): a precious spice*. Asian Pacific
  Journal of Tropical Biomedicine 4(2): 90-96.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3819475/
  — Clove biology, chemistry, and medicinal properties review.
- `ref-syzygium-eo-2025` — *Evaluating the multifaceted
  bioactivity of Syzygium aromaticum essential oil: the central
  role of eugenol*. 2025.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11913364/
  — Recent comprehensive review of clove essential oil
  bioactivity.
- `ref-dentalcare-clove` — *Clove (Syzygium aromaticum) -
  Powerful Therapeutic Spices in Medicine*. Dentalcare.
  — Reference for modern dental applications; ZOE cement
  prevalence.
- `ref-boxer-1965` — Boxer CR. 1965. *The Dutch Seaborne
  Empire 1600-1800*. — Historical reference for VOC clove
  monopoly and Maluku colonial history.
- `ref-pollan-2001` — Pollan M. 2001. *The Botany of Desire*.
  — Historical framing of spice trade and colonial expansion.
- `ref-pliny-natural-history` — Pliny the Elder. *Natural
  History*. ~77 CE. — Earliest Roman reference to cloves.
- `ref-han-court-records` — Various Han Dynasty court records,
  ~2nd century BCE. — Earliest documented extra-Maluku use.

---

## 10. Folk & cultural attributions

| Claim | Confidence | Source/notes |
|-------|------------|-------------|
| "Native exclusively to Maluku Islands" | `verified` | Botanical consensus; origin restriction drove centuries of trade history |
| "Han Dynasty officials chewed for breath" | `verified` | Court records |
| "Relieves toothache" | `established` | Eugenol's anesthetic action; still used in dentistry |
| "Key ingredient in dental cements" | `verified` | ZOE cement ubiquitous in modern dentistry |
| "Dutch VOC destroyed clove trees on all islands except Ambon" | `verified` | Colonial history |
| "Pierre Poivre smuggled seedlings in 1770" | `verified` | Documented French botanical history |
| "Powerful antimicrobial" | `established` | Multiple in vitro and some in vivo studies |
| "Strong warming spice" | `verified` | TCM, Ayurveda, and felt experience align |
| "Aids digestion" | `attested` | Traditional carminative; some clinical support |
| "Cures cancer" | `folk` | Pre-clinical only |
| "Can induce abortion" | `folk` | At essential-oil doses possibly; not at culinary/tea doses |
| "Aphrodisiac" | `folk` | Long-standing cross-cultural claim without clinical support |

---

## 11. Research flags & open questions

1. **Maluku vs. non-Maluku clove quality.** Maluku-origin cloves
   have 15-20% higher eugenol content than Madagascar/Tanzania
   cloves. For premium tea applications, sourcing matters. Most
   commercial cloves are Madagascar or Indonesian (non-Maluku).
   The difference is real but doesn't rise to the level of Ceylon-
   vs-cassia safety concern — just quality.

2. **The numbing/anesthetic sensation doesn't map to vocabulary.**
   Cloves produce a genuine physical sensation (tongue numbness
   from eugenol) that isn't captured by any current effect or
   flavor term. Similar gap to turmeric's "anti-inflammatory."
   Flagged for vocabulary v2.

3. **Dose sensitivity is extreme.** Cloves are the ingredient
   most likely to dominate and ruin a blend if over-dosed.
   User-facing dose guidance needs to be specific: 2-3 cloves
   per cup, not "add cloves to taste." Worth surfacing
   prominently.

4. **Colonial history is morally complicated.** The clove
   trade story includes significant violence (Dutch VOC
   destruction of competing clove trees; slavery in Zanzibar
   plantations) that Herbanium's history copy could engage
   with or soft-pedal. Default inclination: include the
   historical facts without editorializing; let users decide
   how to hold the complexity.

5. **Kretek cigarettes context.** Indonesian *kretek* cigarettes
   are a culturally significant clove product with serious
   health concerns. Probably not relevant for Herbanium's tea-
   focused context, but worth knowing as cultural context.

6. **Chai cluster crystallizing.** With cinnamon, cardamom, and
   cloves all researched, the masala chai spice cluster is
   nearly complete. Ginger also in the cluster. Once turmeric
   (golden milk context) is added, Herbanium will have a
   coherent "warming spice" family. Future blend-recommendation
   logic should recognize this clustering.

# Ingredient Research — Reishi

> Backfill scaffold to match the depth of the other research files.
> Reishi has one of the largest medical-mushroom literature bodies;
> this file uses what's standard, with same epistemic markers as
> the other research files.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `reishi` | matches INGREDIENTS key |
| **display name** | Reishi | |
| **latin / scientific** | *Ganoderma lucidum* (and *G. sinense*, *G. lingzhi*) | "Lingzhi" in Chinese; species taxonomy refined in 2010s |
| **category** | herbal | functional mushroom |
| **subcategory** | mushroom | |
| **also known as** | Lingzhi (灵芝, China); Mannentake (Japan, "10,000 year mushroom"); "Mushroom of Immortality" | |

---

## 2. Overview

**One-line essence** (blurb field):

> Taoist painters drew it in the hands of immortals; Chinese emperors hoarded wild specimens, and reliable cultivation only began in the 1970s. The bitter is triterpene, the same family found in licorice and ginseng — and the same reason the cup needs a long decoction, sweetened with jujube and goji.

*(current app copy — consistent with research)*

**Short description**:

> Reishi is a medicinal mushroom with one of the longest documented use histories of any herbal — appearing in the Shen Nong Ben Cao Jing (~100 BCE) where it's listed as a "superior" herb for long life. The wild mushroom grows on hardwood logs (especially plum and oak) in mountainous East Asia, but reliable cultivation only began in the 1970s. The fan-shaped fruiting body is woody, intensely bitter, and traditionally prepared as a long decoction (hours in water, sometimes double-decocted) — sweetened with jujube and goji to make the bitter palatable. Modern research has identified beta-glucan polysaccharides and triterpenes (ganoderic acids) as the principal active compounds, with the largest body of clinical evidence focused on immune modulation in cancer adjunct treatment.

> **Mechanism note:** Beta-glucans bind to specific receptors (Dectin-1, TLR2) on immune cells and modulate their activity. Triterpenes have shown anti-inflammatory and hepatoprotective effects in lab and animal studies. Modern clinical trials in cancer-adjunct contexts show modest improvements in quality-of-life markers and immune function, though effects on tumor outcomes themselves remain less clear and more variable across studies.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes:**

- bitter (pronounced)
- woody
- earthy
- mushroom
- faintly sweet (after long decoction)

**Aroma notes:**

> Earthy, woody, faintly bitter. The dried mushroom smells like old wood and wet leaves.

**Mouthfeel:**

> Slick from polysaccharides; the bitter is felt at the back of the throat. Decoction sweetens the texture but the bitterness persists.

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [95, 100] | TCM decoction tradition | Traditional decoction is at full boil |
| **time range (seconds)** | [1800, 7200] | TCM convention | 30 min minimum; classical preparation is 2+ hours, sometimes double-decocted |
| **caffeine (mg per ~8oz cup)** | 0 | mushroom, no caffeine source | |
| **tsp-to-grams** | 1 tsp ≈ 1g dried slices | sliced reishi varies; whole pieces broken up | |

---

## 5. Effects — felt

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| grounding | 4 | The mushroom's classical character — settled, slow, substantial |
| calm | 3 | Background calming, traditional sleep support |
| soothing | 3 | Particularly tied to immune-modulation framing in TCM |
| comfort | 2 | The body of the cup is comforting once the bitter is accepted |

> Effects build over weeks of daily use; acute effects from a single cup are modest.

---

## 6. Extraction profiles — three anchors

### 6a. GENTLE (95°C, 1800s / 30 min)

| Field | Value |
|-------|-------|
| tempC | 95 |
| timeS | 1800 |
| flavors | [woody, mushroom, mild bitter] |
| effects | [["grounding", 2], ["calm", 1], ["soothing", 2]] |
| character | Light reishi decoction — bitter present but manageable. Polysaccharides extracted, fewer triterpenes. |

### 6b. STANDARD (100°C, 3600s / 60 min)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 3600 |
| flavors | [woody, mushroom, bitter, earthy] |
| effects | [["grounding", 4], ["calm", 3], ["soothing", 3]] |
| character | The classical TCM cup. One-hour decoction, full bitter, full body. Sweeten with jujube/goji to drink. |

### 6c. STRONG (100°C, 7200s / 2 hr)

| Field | Value |
|-------|-------|
| tempC | 100 |
| timeS | 7200 |
| flavors | [woody, mushroom, bitter, earthy, deep] |
| effects | [["grounding", 4], ["calm", 4], ["soothing", 4], ["comfort", 2], ["bitterness", 3]] |
| character | The double-decoction or extended cup. Maximum extraction, hard to drink without sweetener. |

---

## 7. Safety & heads-up

- Generally well-tolerated at typical doses. Long-term use occasionally produces mild gastrointestinal effects.
- Anticoagulant effect — caution with blood thinners. Stop reishi 2 weeks before surgery.
- Pregnancy/lactation safety not well-established; precautionary avoidance.
- Some users report dizziness, dry mouth, or skin reactions at high doses.

---

## 8. Compounds (selected)

| Compound | Approx role | Effects contributed | Confidence |
|----------|------------|--------------------|------------|
| Beta-glucans | polysaccharide | immune modulation, body | high |
| Ganoderic acids (triterpenes) | bitter-active | hepatoprotective, anti-inflammatory, bitter taste | high |
| Sterols (ergosterol etc.) | lipid fraction | immune adjacent | medium |
| Adenosine derivatives | minor | mild relaxant | medium |

---

## 9. Sources (starting points)

- Wachtel-Galor, S., et al. "*Ganoderma lucidum* (Lingzhi or Reishi): A Medicinal Mushroom." *Herbal Medicine: Biomolecular and Clinical Aspects* (2nd ed., 2011). NCBI Bookshelf NBK92757.
- Jin, X., et al. "*Ganoderma lucidum* (Reishi mushroom) for cancer treatment." *Cochrane Database of Systematic Reviews* (2016).
- Sliva, D. "*Ganoderma lucidum* (Reishi) in cancer treatment." *Integrative Cancer Therapies* (2003).
- Shen Nong Ben Cao Jing (~100 BCE; Han dynasty pharmacopoeia) — historical reference for original Chinese medicinal classification.
- Klupp, N.L., et al. "*Ganoderma lucidum* mushroom for the treatment of cardiovascular risk factors." *Cochrane Database of Systematic Reviews* (2015).

---

## 10. Facts for the Steep screen

| # | Type | Confidence | Fact | Source |
|---|------|------------|------|--------|
| 1 | culture | attested | Taoist painters drew reishi in the hands of immortals; Chinese emperors hoarded wild specimens. | Chinese cultural-art history |
| 2 | history | verified | Reliable cultivation of reishi only began in the 1970s — before that, it was almost entirely wild-foraged. | mushroom-cultivation history |
| 3 | fact | verified | Reishi appears in the Shen Nong Ben Cao Jing — China's earliest pharmacopoeia, around 100 BCE — as a "superior" herb for long life. | classical TCM text |
| 4 | fact | established | The bitter is triterpene, the same family found in licorice and ginseng — and the reason the cup needs a long decoction. | well-established phytochemistry |
| 5 | fact | verified | Reishi is one of the most-studied medicinal mushrooms — over 400 papers per year, mostly on immune-modulating polysaccharides. | bibliometric standard |
| 6 | fact | attested | Six color varieties of reishi were classified in TCM — red, black, blue-green, white, yellow, purple. Red is what's commercial today. | classical TCM classification |
| 7 | culture | established | The traditional preparation is double-decoction: hours in water, then again, sweetened with jujube and goji. | TCM preparation tradition |
| 8 | fact | verified | Modern clinical trials show modest immune effects in cancer adjunct treatment — improving quality of life and recovery markers. | ref-jin-2016 |

---

## 11. Open questions

- Beta-glucan structure-activity relationships — different processing methods produce dramatically different polysaccharide profiles.
- Bioavailability of triterpenes via decoction vs. alcohol extraction — most clinical studies use specific extracts, not whole-mushroom tea.
- Long-term safety beyond clinical trial windows.

---

## 12. Confidence self-assessment

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters | 2 | TCM decoction tradition well-documented; long times are non-negotiable for full extraction |
| Effects ratings | 1-2 | Grounding well-established traditionally; immune modulation has clinical literature; acute felt effects modest |
| Extraction profiles | 1 | Three-anchor structure consistent with TCM tradition; specific values interpretive |
| Facts | 2 | History and chemistry well-documented |

**Overall status:** Draft — solid baseline. The mushroom has the largest research literature of any in the catalog; deep-source pass would yield significantly more nuance.

---

## Addendum — `sleepy` kept (2026-08-02)

An audit flagged `sleepy` as shipped without a prescribing row. §5
rates no `sleepy` line, but it does describe `calm` 3 as "background
calming, **traditional sleep support**" — the claim was there, filed
under a neighbouring name. It holds up on both tradition and
mechanism.

**Tradition.** Reishi is classically a *shen* tonic — *shen* meaning
spirit — used to calm the spirit and induce sleep. The *an shen*
(calm-spirit) framing is the herb's oldest documented indication, and
it is the reason the mushroom carries a sleep association at all.

**Mechanism and animal evidence.**

> *Ganoderma lucidum promotes sleep through a gut microbiota-dependent
> and serotonin-involved pathway in mice.* Scientific Reports (2021).
> 28 days of the acidic alcohol-extract fraction shortened sleep
> latency and prolonged sleep duration; the effect raised
> 5-hydroxytryptamine in the hypothalamic serotonergic synapse pathway
> and depended on the gut microbiota —
> https://www.nature.com/articles/s41598-021-92913-6
>
> *Ganoderma lucidum spore extract improves sleep disturbances in a rat
> model of sporadic Alzheimer's disease* —
> https://pmc.ncbi.nlm.nih.gov/articles/PMC11076761/

Ganoderic acids — the triterpene fraction, 130–140 distinct acids in
ethanol extract — cross the blood-brain barrier and modulate GABAergic
transmission, which is the proposed route.

**The limit, stated plainly: the sleep evidence is animal.** There is
no human RCT showing reishi shortens sleep latency. Human reports are
observational. So this sits above cardamom's purely traditional
`energy` and below chamomile's trial-backed `calm` — mechanism plus
animal models plus long tradition, and it should not be described as
clinically proven.

That the claim climbs with extraction is consistent: triterpenes are
the slow, hot fraction, which is why §6's long decoction is where
`sleepy` reaches its full value and the 60°C cold pour shows almost
nothing.

<!-- sourced-effects: sleepy -->

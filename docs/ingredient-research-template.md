# Ingredient Research — [INGREDIENT NAME]

> One file per ingredient. Save as `docs/research/ingredients/[id].md`.
> Fill in what you can source. "Unknown" or "couldn't find" is a valid
> answer — leave it blank or mark `?` if you hit a gap. Don't invent.
>
> Target: 1-2 hours per ingredient. If you're spending longer, the
> information probably isn't reliably sourced and you should flag
> the gap rather than keep digging.

---

## 1. Identity

| Field | Value | Notes |
|-------|-------|-------|
| **id** (code slug) | `example_id` | lowercase, no spaces, matches INGREDIENTS key |
| **display name** | Example | Title case, how users see it |
| **latin / scientific** | *Genus species* | Italics in app; leave blank if not a single species |
| **category** | herbal / true tea / spice / flower / adaptogen | choose one |
| **subcategory** | e.g. green / black / oolong / white / pu-erh | for true teas only, blank otherwise |
| **also known as** | common alt names | comma-separated, optional |

---

## 2. Overview

**One-line essence** — the app's `blurb` field, used on cards and quick views.
What's the defining character in 10-15 words?

> Example: "The evening herb — honeyed, floral, and reliably calming."

**Short description** — a paragraph of 2-3 sentences for the ingredient page.
What does a reasonable person need to know about this ingredient?

> Write 2-3 sentences here.

---

## 3. Sensory — flavor & aroma

**Primary flavor notes** (3-6 tags that describe the cup):

- tag 1
- tag 2
- tag 3

> Prefer existing vocabulary from other ingredients when possible
> (grep `flavors:` in src/data/ingredients.js for what's already used).
> If a new flavor tag is genuinely needed, note it here so it can be
> added to the FLAVORS catalog.

**Aroma notes** (optional, if distinct from flavor):

> Blank if aroma tracks flavor closely.

**Mouthfeel** (optional):

> e.g. astringent, cooling, warming, coating, clean

---

## 4. Brewing — baseline parameters

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| **temp range (°C)** | [lo, hi] | | ingredient's canonical brewing window |
| **time range (seconds)** | [lo, hi] | | seconds, not minutes |
| **caffeine (mg per ~8oz cup)** | 0 or ~N | | 0 for herbals; approximate for true teas |
| **tsp-to-grams** | N grams | | only if category default is inaccurate (see `TSP_BY_CATEGORY`) |

---

## 5. Effects — felt

The app uses the following effect vocabulary. Rate each relevant effect
on a 0-5 scale for the **standard** brew. Leave blank if not applicable.

| Effect | Strength (0-5) | Notes |
|--------|---------------|-------|
| calm | | mental calm, anxiolytic |
| sleepy | | sedative, sleep-promoting |
| settle | | digestive / grounding |
| comfort | | warming, body-feel, cozy |
| focus | | mental clarity, attention |
| energy | | stimulant, lifting, alert |
| cooling | | menthol-like, temperature-feel |
| bitterness | | astringency / tannic bite (not always "bad") |

> Effects should be what a reasonable person brewing this ingredient
> would actually feel. If an effect is commonly attributed but
> poorly-sourced, flag it in Notes and rate conservatively.

---

## 6. Extraction profiles — three temp anchors + time behavior

This section feeds the temp/time slider UI and the blending algorithm.
We use three **primary profiles** spanning the ingredient's brewing
window (each pairs a specific temp with a specific time), plus a
**time-axis behavior** section that describes how the cup shifts when
only time varies at a fixed temp. The four-part structure captures
both dimensions without requiring a full 2D temp×time grid per
ingredient.

### 6a. GENTLE (low temp / short time)

| Field | Value |
|-------|-------|
| tempC | |
| timeS | |
| flavors | [tag, tag, tag] |
| effects | [["effect", N], ["effect", N]] |
| character | One-line editorial note — what is this cup like? |
| sources | [ref-id-1, ref-id-2] |

> Goal: what does it taste/feel like at the lowest reasonable
> extraction for this ingredient? Usually fewer flavor tags (just the
> delicate ones), weaker effects, no bitterness.

### 6b. STANDARD (middle)

| Field | Value |
|-------|-------|
| tempC | |
| timeS | |
| flavors | [tag, tag, tag] |
| effects | [["effect", N], ["effect", N]] |
| character | |
| sources | |

> Goal: the canonical cup. The one most tea-drinkers recognize as
> "the way this ingredient is supposed to taste." Time-axis behavior
> in 6d is measured as shifts from this profile.

### 6c. STRONG (high temp / long time)

| Field | Value |
|-------|-------|
| tempC | |
| timeS | |
| flavors | [tag, tag, tag] |
| effects | [["effect", N], ["effect", N]] |
| character | |
| sources | |

> Goal: peak extraction. Often introduces astringency/bitterness,
> reveals deeper character notes (earthy, mineral, tannic). For
> some ingredients (rooibos) there's no real "bad" strong version;
> say so.

**Do you need a 4th or 5th primary profile?** If the profile shifts
dramatically between two of your points, add more here. Document why.

### 6d. Time-axis behavior (STANDARD temp held constant, time varied)

This section describes what happens when the user holds temperature at
the STANDARD value (from 6b) and varies time only. It captures the
time axis as a direction-of-shift from the canonical cup, rather than
adding three more primary profile points (which would force a full
2D grid for every ingredient).

Answer two questions:
1. **Is time monotonic for this ingredient?** (more time = more effect,
   no character inversion — true for chamomile, rooibos, hibiscus)
   Or does it invert? (green tea gets bitter past a point; lavender
   turns soapy.)
2. **Does extraction follow first-order kinetics?** (exponential
   approach to asymptote — true for most ingredients with published
   data). If no published data, make a conservative assumption and
   flag it.

| timeS | % of asymptote (approx) | character shift from STANDARD | effect shift from STANDARD |
|-------|------------------------|-------------------------------|---------------------------|
| [short timeS]  | ~35% | | calm ?, sleepy ? |
| [STANDARD timeS]  | ~70% | **Baseline — the STANDARD profile as in 6b** | baseline |
| [long timeS] | ~85% | | |
| [very long timeS]| ~95% | | |

**Algorithm note:** Describe whether time is monotonic (just scales
magnitude) or inverting (flips character past a threshold). This
matters for how the blending algorithm handles user-chosen long/short
steeps.

**Cross-temperature note:** Does the time asymptote shift meaningfully
at GENTLE or STRONG temps? First-order kinetics say yes — the rate
constant changes with temp. If relevant, describe how. Often the
three primary profiles already bake this in (GENTLE has a longer time
than STANDARD to compensate for lower temp), in which case just note
that the primary profiles are temperature-compensated anchors and
time shifts should apply relative to each anchor's timeS rather than
a global value.

sources: [ref-id-1, ref-id-2]

---

## 7. Safety & heads-up

**Known interactions or contraindications** (feeds the `headsUp` field):

> e.g. "Not recommended during pregnancy (emmenagogue)"
> e.g. "May interact with blood thinners — consult a pharmacist"
> Short, actionable. "Consult a doctor if X" not "may affect Y pathway."

**Dosage cautions** (optional):

> e.g. "Strong tea, moderate intake; more than 3 cups may cause jitters"

**NOT a concern but sometimes claimed**:

> If you find popular-but-unsupported warnings (e.g. "ginger thins the blood
> so don't take with aspirin" — overstated), note here. Helps us decide
> whether to include or exclude from `headsUp`.

---

## 8. Compounds (optional)

Only fill in if you find well-sourced compound data. Skip for ingredients
where primary chemistry isn't well-characterized in accessible literature.

| Compound | Approx mg per cup | Effects contributed | Confidence (high/med/low) |
|----------|------------------|--------------------|--------------------------|
| e.g. apigenin | 0.5-1.2 | calm, sleepy | high |
| | | | |
| | | | |

**characterizedPct** (your best estimate):
> e.g. "~60% — primary flavonoids documented, minor constituents not"

---

## 9. Sources

List every source that informed this research. Use short ref-ids
(`ref-1`, `ref-2`) that match back to citations in specific fields above.

| Ref ID | Citation | Source type |
|--------|----------|-------------|
| ref-1 | Author (Year). Title. Journal Vol(Issue). DOI/URL. | journal / book / monograph / traditional-use text |
| ref-2 | | |
| ref-3 | | |

**Preferred source hierarchy:**
1. Peer-reviewed research (PubMed, Google Scholar) — gold standard for
   specific claims about chemistry, extraction, mechanism
2. Monographs (German Commission E, WHO, EMA) — good for traditional
   medicinal use + safety summaries
3. Tea/herbal reference books from known authors (Hobbs, Heiss, etc.) —
   good for flavor, brewing, cultural context
4. Traditional-use texts (Ayurvedic pharmacopoeias, TCM references) —
   good for cultural lineage, traditional indications

**Avoid:**
- Blog posts without citations
- Supplement marketing pages
- Wikipedia as the sole source (fine as a starting point / pointer)

---

## 10. Facts for the Steep screen

3-5 facts, mix of types. These appear in the rotating wait-cards during
brewing. Aim for things a tea-drinker would find pleasantly surprising
rather than textbook-dry.

| # | Type | Fact | Source |
|---|------|------|--------|
| 1 | fact | Scientific / chemistry — "X compound extracts at Y°C" | ref-? |
| 2 | tradition | Traditional or ceremonial use | ref-? |
| 3 | history | Historical note — origin, famous user, old practice | ref-? |
| 4 | culture | Cultural — how it's drunk somewhere, what it means | ref-? |
| 5 | fact | Weird delightful detail | ref-? |

> Types: `fact` (scientific/chemistry), `tradition` (how it's used),
> `history` (origin/old use), `culture` (how it appears in life).
> Same types we use in WAIT_FACTS code.

---

## 11. Miscellaneous & uncaptured

**Interesting things that didn't fit other sections:**

> e.g. etymology of the name, notable cultivars, famous people who drank
> it, literary references, synesthetic associations, pairs well with
> seasonal moments, reminds you of X.

**Personal notes** (your own tasting experience if you have it):

> Optional. Don't make things up, but if you've actually had this
> ingredient and have observations, write them — helps calibrate the
> character descriptions above.

**Questions that weren't resolvable from sources:**

> Be honest. "Couldn't find clear data on X" is valuable. Preserves
> knowledge-of-gaps for later passes.

---

## 12. Confidence self-assessment

On a 0-3 scale:

| Area | Confidence | Note |
|------|-----------|------|
| Brewing parameters (temp/time) | 0-3 | |
| Effects ratings | 0-3 | |
| Extraction profiles (3 points) | 0-3 | |
| Safety notes | 0-3 | |
| Facts | 0-3 | |

> 0 = speculation / unsourced
> 1 = sourced but single weak source
> 2 = sourced, multiple corroborating sources
> 3 = well-established, textbook-level

**Overall status** (check one):
- [ ] Draft — needs verification pass
- [ ] Verified — confident enough to ship
- [ ] Flagged — specific issues noted in open questions

---

## Translation to code

When this research is complete, these fields map to code as follows:

- **INGREDIENTS[id]** — identity, overview, sensory, brewing baseline,
  safety (headsUp), caffeine, flavor tags, top-level effects
- **EXTRACTION_PROFILES[id]** — the three profile tables from section 6
- **WAIT_FACTS[id]** — facts from section 10, with their types
- **compounds** (optional) — section 8, nested under INGREDIENTS[id]
- **SOURCES** — the ref-ids and citations from section 9, merged into a
  central bibliography

A small script will convert completed markdown files into the JS data
structures. Until that script exists, translate manually.

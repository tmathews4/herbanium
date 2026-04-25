# Herbanium NOTES — Design Principles

> Version 6 (April 2026). Bumped from v5 to add design principles
> #16-#18 covering category structure decisions made during the
> post-30-ingredient catalog audit.
>
> This document captures the canonical design principles guiding
> Herbanium's data model, user-facing copy, and product decisions.
> Principles are numbered and stable — once added, a principle
> isn't renumbered. Principles can be deprecated but not deleted
> (so cross-references remain valid).
>
> Previous version: NOTES_v5.md (15 principles).

---

## Existing principles (1-15) — unchanged from v5

> [Carried forward from v5 unchanged. Full text in NOTES_v5.md.
> Numbered list reproduced here for reference; consult v5 file
> for full reasoning.]

1. **Effects ratings are functional, not pharmacological.**
2. **Vocabulary is fixed; ingredients are extensible.**
3. **Confidence markers are honest, not aspirational.**
4. **Brewing parameters are anchors, not prescriptions.**
5. **Cultural context belongs in copy, not in data structure.**
6. **Safety flags are surfaced, never hidden.**
7. **Latin binomials are canonical; common names are aliases.**
8. **Bitterness is a basic taste, not an effect.**
9. **The user's cup is the unit; clinical doses are reference.**
10. **Convergent traditional use is meaningful evidence.**
11. **Label folk, don't hide it.**
12. **Single-ingredient research is foundation; blends emerge from data.**
13. **Tea-community-standard vocabulary over invented terms.**
14. **Store in canonical units (Celsius, seconds, grams).**
15. **The journal entry is the canonical user data; suggestions
    are guidance, not commandments.**

---

## #16: Caffeine is a property, not a category boundary

**Established:** April 2026 (post-catalog-audit).

**Statement:**

The `category: herbal` value means "not *Camellia sinensis*." It
does **not** mean "caffeine-free." The `caffeine` field on each
ingredient is the canonical source of truth for caffeine content.
User-facing copy, filters, and recommendation logic must treat
caffeine as an orthogonal property to plant-family category.

**Why this matters:**

The catalog originally accumulated under an implicit assumption
that caffeinated = true tea (Camellia sinensis), caffeine-free =
herbal/floral/spice. This held while the catalog was 30
ingredients all fitting that pattern. Adding yerba mate
(*Ilex paraguariensis*, a holly), guayusa (*Ilex guayusa*, also
holly), and similar caffeinated herbals breaks the assumption.

Two options were considered:
1. Add a new top-level category like `caffeinated_herbal`
2. Treat caffeine as a property, keep yerba mate in `herbal`

Option 2 wins because:
- The `caffeine` field already does this work; the schema
  already supports the distinction
- Adding category complexity for a small handful of ingredients
  is taxonomic bloat
- "Herbal" as a botanical descriptor (= not Camellia sinensis)
  is the natural meaning of the word; reading "caffeine-free"
  into it is an inference, not a definition

**Implementation:**

- Yerba mate: `category: herbal`, `subcategory: leaf`,
  `caffeine: 30-50` (per typical 8oz prep — verify in research)
- Future caffeinated herbals (guayusa, kola nut, etc.):
  same pattern
- User-facing filters: caffeine is its own filter dimension,
  orthogonal to category
- User-facing copy: when discussing "herbal teas," do not
  imply caffeine-free unless the specific ingredient is
  caffeine-free

**Cross-references:** Principle #1 (functional ratings),
Principle #14 (canonical units).

---

## #17: Mushrooms get subcategory, not separate category

**Established:** April 2026 (post-catalog-audit).

**Statement:**

Mushrooms used in beverages (reishi, lion's mane, chaga,
cordyceps) are categorized as `category: herbal` with
`subcategory: fungus`. This recognizes the botanical reality
(fungi are not plants) without proliferating top-level
categories for a small ingredient class.

**Why this matters:**

Botanically, fungi are a separate kingdom from plants — calling
a mushroom "herbal" is technically incorrect. However:
- The catalog's purpose is functional (what people drink, how
  it tastes, what it does), not botanical taxonomy
- "Herbal" in beverage context already means "non-tea wellness
  ingredient" rather than "of plant origin"
- Subcategories already track plant-part distinctions (leaf,
  root, rhizome, seed, bark, flower); `fungus` extends this
  pattern naturally
- A separate `mushroom` top-level category would only ever
  contain 4-6 ingredients, which is taxonomic bloat

**Implementation:**

- Reishi (*Ganoderma lucidum*): `category: herbal`,
  `subcategory: fungus`
- Lion's mane (*Hericium erinaceus*): same pattern
- Future additions (chaga, cordyceps): same pattern
- Subcategory enables type-specific UI/copy without forcing a
  category split
- Mushroom-specific concerns (longer extraction times,
  dual-extraction with alcohol commonly used in supplements)
  are handled in ingredient-level brewing parameters and
  copy, not in category structure

**Cross-references:** Principle #4 (brewing anchors),
Principle #11 (label folk).

---

## #18: Same plant, different preparation = different ingredient

**Established:** April 2026 (post-catalog-audit).

**Statement:**

When the same botanical material produces meaningfully different
cups via different processing or preparation, treat as separate
catalog ingredients. The test is **user perception**: would
typical drinkers experience these as different things they'd
order, blend, or describe differently? If yes, separate; if no,
lump.

**Why this matters:**

Strict botanical splitting would explode the catalog (every
*Camellia sinensis* cultivar would be separate); strict
botanical lumping would erase culturally and sensorily distinct
products (matcha and gyokuro would be one ingredient because
they come from the same shaded tea bushes). The right answer
is functional: split where users perceive difference, lump
where they don't.

**Examples:**

| Pair | Same plant? | Decision | Why |
|------|-------------|----------|-----|
| Matcha vs. gyokuro | Yes (shaded *C. sinensis*) | **Separate** | Different processing (powder vs. leaf), different brewing mechanic (whisk vs. steep), different cultural framing (ceremonial vs. premium-daily), different effect profile (whole-leaf vs. extracted) |
| Hojicha vs. sencha | Yes (*C. sinensis*) | **Separate** (existing) | Roasting transforms sensory and effect profile fundamentally |
| Genmaicha vs. sencha | Mostly (sencha + brown rice) | **Separate** | Roasted-grain addition transforms cup; users order them differently |
| Sencha vs. dragonwell | Both *C. sinensis* | **Separate** (existing) | Different cultivars, different processing, different cultures (Japanese pan-steamed vs. Chinese pan-fired) |
| Tieguanyin vs. Da Hong Pao | Both oolong | **Same** (existing single "oolong" entry) | Most users experience both as "oolong"; specialty subdivision is for connoisseurs |
| Rama Tulsi vs. Krishna Tulsi | Both *Ocimum tenuiflorum/sanctum* | **Same** (existing single "tulsi" entry) | Most commercial tulsi tea is blends; variety distinction is enthusiast-level |
| Dandelion root vs. dandelion leaf | Same plant, different parts | **Separate** | Used differently (root roasted as coffee substitute; leaf as mineral tonic), different effects, different cups |
| Elderflower vs. elderberry | Same plant, different parts | **Separate** | Used differently (flower for immune-support, berry for syrups/cold remedies), different sensory profiles |

**The threshold question:**

When in doubt, ask: "Would a thoughtful tea drinker who knows both
A and B be surprised if Herbanium listed them as the same
ingredient?" If yes, separate them. If they'd shrug and say "yeah,
that's basically the same thing," lump them.

**Implementation:**

- Future "tulsi varieties" or "oolong cultivars" expansion would
  require deliberate decision; default is current lumped approach
- New ingredients evaluate against this principle during research
- Splitting an existing entry (e.g., breaking white tea into
  Silver Needle / Bai Mu Dan) requires migration logic for any
  user data referencing the old entry

**Cross-references:** Principle #2 (vocabulary fixed, ingredients
extensible), Principle #5 (cultural context in copy).

---

## Vocabulary v2 consideration list (consolidated from research)

> Documented gaps in vocabulary v1 surfaced through 30-ingredient
> research. Not urgent. Revisit when more ingredients accumulate
> or product needs surface.

1. **"Anti-inflammatory"** — turmeric, partially cloves and
   ginger. Currently maps to `soothing`.
2. **"Aromatic/psychological mechanism"** — vanilla, partially
   tulsi. Currently handled via reduced confidence markers.
3. **"Physical anesthetic/numbing"** — cloves (eugenol). Maps
   to `soothing` imperfectly.
4. **"Stress-buffering / HPA modulation"** — tulsi, ashwagandha
   (provisional). Captured as `calm + soothing + grounding`
   combination.
5. **"Hormonal regulation / anti-androgenic"** — spearmint
   specifically. No clean mapping; surfaced through copy.

When vocabulary v2 is designed, these gaps are the primary
candidates for new effect axes or modifier system. Until then,
each is captured through current vocabulary combinations plus
careful copy.

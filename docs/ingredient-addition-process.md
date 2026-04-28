# Ingredient Addition Process

> Canonical sequence for adding a new ingredient to the Herbanium catalog.
> Designed to keep voice, calibration, and safety claims consistent as the
> catalog grows. Every step except the optional ones should be considered
> mandatory.

---

## The 10-step sequence

### 1. Research file first
Path: `docs/research/ingredients/<id>.md`
Template: `docs/ingredient-research-template.md`

Write the research file *before* touching code. The file locks:
- identity (latin name, category, subcategory, aliases)
- brewing window (`tempC`, `timeS`)
- effects (each axis at 0–5, calibrated against the anchors)
- 3 extraction profiles (gentle / standard / strong)
- safety notes
- 5–10 facts for the steep screen
- sources (4+ peer-reviewed where possible; 2+ acceptable for flavor-driven)

Target ~200–300 lines. The file is the source of truth — everything else
is generated from it.

### 2. Catalog entry
File: `src/data/ingredients.js`

Slot the entry in the appropriate section, or create one with a header
comment if introducing a new family. Use the simpler **flavor-driven schema**
(name/latin/category/subcategory/caffeine/temp/time/effects/flavors/pairs/dose
/headsUp/blurb/facts) for fruits, peels, and herbs whose value is sensory.
Reach for the **deeper schema** (safetyFlags/confidenceMarkers/
preparationPattern/variants) only for medicinal-mushroom or root-decoction
ingredients where evidence levels matter.

**Voice & tone guardrails** — match the existing catalog:
- `headsUp`: short, plain English. "Talk to your doctor if…" beats "Consult
  a clinician regarding…". Name the practical risk first, the mechanism
  second (and only if it adds clarity).
- `blurb`: 2–4 sentences, one cultural image plus one mechanism. No
  bullet points, no headings, no medical-claim language ("treats X",
  "cures Y"). Lean on "may," "traditionally," "studies have measured."
- `facts`: each fact is a single sentence or two. Lead with the fact;
  trail with the why or the cultural context. Mix history, culture,
  chemistry, and lore — don't stack 10 chemistry facts.

**Effect numbers** — calibrate against the anchors in `src/data/ingredientFit.js`:
- `chamomile=5 calm`, `matcha=5 focus`, `peppermint=5 cooling`,
  `ginger=5 warming`, `valerian=5 sleepy`, `assam=5 energy`,
  `darjeeling=5 uplifting`, `reishi=5 grounding`, `fennel=5 digestive`,
  `rooibos=5 soothing`.
- Flavor-driven ingredients should top out at 2–3 on any axis. Save 4–5
  for ingredients that genuinely define an effect.

### 3. KNOWN_FLAVORS update
File: `src/data/ingredientFit.js`

Only add a new flavor descriptor word if no existing one fits. Default to
reusing `citrus`, `aromatic`, `sweet`, `floral`, etc. New words should be
distinct enough to carry their own register — e.g., `bergamot` is its own
register, not just "citrus."

### 4. Sources panel
File: `src/screens/ProfileScreen.jsx` (`SOURCES` array)

Add an entry under the closest-matching heading if any new primary source
is unique to the new ingredient. **Don't bloat** — amend an existing item if
the new citation is a single-line addition (e.g., adding cranberry/warfarin
to the existing pharmacovigilance entry instead of creating a new item).

The five headings:
1. Pharmacopoeia & monographs (EMA, WHO, German Commission E)
2. Traditional texts (Cha Jing, Bencao, Ayurvedic primary sources)
3. Brewing & extraction chemistry (volatile-compound papers)
4. Clinical evidence base (RCTs, mechanism papers, pharmacovigilance)
5. Cultural & culinary references

### 5. Calibration audit (NEW — required)
Before running the full test suite, run the per-ingredient placement
check on every new id:

```
npm run check-ingredient -- <id> [<id> ...]
```

For each ingredient, this prints:
- **Effect placement**: each declared tag's anchor, how many ingredients
  sit above, and the peers at the same strength rung. Lets you sanity-check
  that "calm 3" feels right relative to the existing cohort.
- **Anchor gaps**: a tag declared with no anchor in `EFFECT_ANCHORS`. If
  this fires, you're either declaring a tag you shouldn't (drop it) or
  introducing a new axis that needs a new anchor (add one — see below).
- **Anchor-promotion candidates**: this ingredient ties or exceeds the
  current anchor. Either lower the strength or promote it to anchor —
  don't ignore.
- **Flavor whitelist coverage**: every flavor word resolved against
  `KNOWN_FLAVORS`.
- **Pair resolution**: every id in `pairs[]` resolves to a real entry.
- **Catalog-wide saturation creep** at the end — multiple 5s on one tag.

The script exits non-zero if any issue surfaces. Treat it as part of the
build gate, not optional reading.

#### When to declare a new anchor
If your ingredient introduces an effect axis that has no current anchor,
or if it genuinely defines the top of a register (clearly stronger than
any existing entry on that axis), you may need to add to `EFFECT_ANCHORS`
in `src/data/ingredientFit.js`. Anchors don't have to be at strength 5 —
if the catalog's strongest expression of a tag honestly sits at 4, anchor
at 4 (this is intentional; honesty beats convention).

Example: when `comfort` was first declared on orange-peel and dried-apple
(both at 1), no anchor existed and `check-ingredient` flagged it. The fix
was to declare `comfort: { id: "hojicha", strength: 4 }` — hojicha's
roasted-cozy register is the catalog's clearest comfort archetype, and
4 reflects the actual ceiling rather than inflating to 5.

### 6. Run the full test suite
```
npm test
```

All 7 suites must pass:
- `literature.test.mjs` — directional effect checks
- `curated-blends.test.mjs` — clean-default audit on every blend (custom
  blends must pass strict, traditionals get baseline suppression)
- `ingredient-fit.test.mjs` — catalog audit + helper sanity
- `blend-perception.test.mjs` — perception pipeline literature checks
- `calibration.test.mjs` — anchor + ceiling + flavor whitelist
- `perception-extras.test.mjs` — loudness, fragile decay, effect floor
- `tone-guardrails.test.mjs` — voice consistency (no medical-claim
  verbs, no clinical jargon, length caps, etc.)

If `calibration.test.mjs` fails on an anchor invariant, the new ingredient's
effect numbers are inconsistent with the rubric — don't widen the test
bounds, lower the ingredient's number.

### 7. In-app audit
Use the standard checklist:

**Per-ingredient detail page** (Compose → Ingredients → tap):
- [ ] Name, latin name, subcategory display correctly
- [ ] Aliases render
- [ ] `headsUp` shows where present
- [ ] Brewing window slider opens at sensible default
- [ ] Effects pills render at declared strengths
- [ ] Flavor pills render without unknown-flavor warnings
- [ ] Pairs row shows other ingredients as tappable
- [ ] Steep screen rotates through facts without crashing

**Compose flow**:
- [ ] Searchable by name and each alias
- [ ] Adding to a draft produces a sensible predicted profile
- [ ] At least one obvious blend (the canonical use) reads correctly

**Profile → Sources panel**:
- [ ] Any new source items are visible under the right heading

### 8. Suggest blend follow-ups (automated)
Once the ingredient lands, run:

```
npm run suggest-blends -- <id>
```

Three reports come back:
- **REWRITE candidates** — existing curated blends whose ingredient
  list overlaps with the new entry's `pairs[]`. Adding the new
  ingredient to one of these often improves the cup (Garden Court +
  bergamot for Earl Grey character; Quiet Apple + dried apple for body).
- **NEW 2-INGREDIENT combinations** — every pair-mate × the new id
  not already curated together. The cleanest first-blend candidates,
  annotated with shared effect axes and a likely mood guess.
- **NEW 3-INGREDIENT combinations** — triplets from `pairs[]` not
  yet curated, sorted by 3-way shared effect axis (so the strongest
  mood-coherent triplets surface first).

Pick 2–4 of the surfaced candidates and wire them as
`experimental: true, house: true` in `src/data/blends.js`. The tool
won't pick *for* you — it surfaces the obvious moves so you can decide
which fit the catalog's voice.

After wiring, run `npm test` again. The strict experimental rule
(custom blends pass without baseline suppression) will catch any
combination that needs ingredient-role tweaks (mark partners as
`role: "accent"`) or temp/time adjustment.

This step is what turns a single ingredient into a catalog improvement
rather than a lone entry.

### 9. Optional: extraction profiles
File: `src/data/extractionProfiles.js`

Add only if the ingredient has a meaningfully different gentle/standard/
strong character. Most flavor-driven ingredients can skip this — the
single brewing window covers them. Reach for profiles when the cup
genuinely changes shape across the temp/time grid (chamomile, matcha,
puerh).

### 10. Optional: wait content
File: `src/data/waitContent.js`

Add per-ingredient steep-screen rotating cards if the ingredient has rich
cultural material worth spotlighting beyond the 5–10 facts already in the
catalog entry. Skip for most flavor-driven additions.

---

## Voice & calibration guardrails (recurring patterns)

### Health-claim language
- ❌ "treats anxiety", "reduces inflammation", "boosts immunity"
- ✅ "traditionally used for…", "studies have measured…", "may help with…"
- ❌ "Consult a clinician before consuming"
- ✅ "Talk to your doctor first if…"

If the research file's source is a single small study, the language should
be conditional. If it's a Cochrane review with consistent findings, it can
be more confident — but still framed as an effect, not a treatment.

### Compound names in user-facing copy
- Name a compound only when it adds clarity (e.g., "L-theanine," "limonene,"
  "anthocyanins"). Don't name enzymes (CYP3A4 → "how the body processes
  some medications").
- If the compound is the *story* of the ingredient (rooibos's aspalathin,
  lion's mane's hericenones), name it. Otherwise, describe the effect.

### Subcategory conventions
- `peel` for citrus rinds
- `fruit` for dried whole fruits
- `flower` for dried blooms
- `leaf` for dried herb leaves
- `root` for dried roots
- `rhizome` for ginger/turmeric/galangal
- `fungus` for medicinal mushrooms
- `green`/`black`/`white`/`oolong`/`pu-erh` for *Camellia sinensis*

### Pairs field
List 4–8 other catalog keys. Aim for the "obvious pairings" that a tea
person would reach for — not exhaustive. Pairs drives the `pairs with…`
suggestions in the detail page and the resolver's blend candidates.

### Aliases
Include cultural names the ingredient is known by (chen pi, atoca,
karkadé, yamabushitake), not just translation variants. Aliases drive
search.

### Facts ratio (target)
A balanced 10-fact list looks like:
- 2–3 cultural/historical
- 2–3 chemistry/mechanism
- 2 traditional-use
- 1 botanical/agricultural
- 1 surprising / "you didn't know"
- 1 self-correcting (debunks an overstated claim)

---

## Off-note flavor gotcha (read before declaring flavors)

When an ingredient's `flavors` array uses bare strings (`["aromatic",
"savory", ...]`), `compose.js:normalizeFlavors` assigns positional
strengths: position 0 → 4, 1 → 3, 2 → 2, 3+ → 1.

This collides with off-note thresholds in `perception.js:buildWarnings`:
- `camphor` ≥ 1.8 → warning
- `soapy` ≥ 0.5 → warning
- `muddy`, `harsh`, `acrid`, `burnt`, `medicinal` ≥ 1–1.5 → warning

If any off-note word appears at position 0, 1, or 2 in your bare-string
flavor list, the ingredient will trip an over-pull warning *every time
it is a lead in a blend*, regardless of brew window.

**Two ways to handle off-notes:**

1. **Reorder them later in the bare-string array** — put the off-note
   at position 3 or later (which gives it default strength 1, below
   every threshold). Lightest touch; works when the off-note is
   genuinely a tertiary flavor at tea strength.
2. **Declare flavors as tuples**: `flavors: [["aromatic", 3],
   ["camphor", 1]]`. Required when the off-note is structurally
   important to the ingredient's character but you need explicit
   strength control.

`npm run check-ingredient -- <id>` catches this automatically — it
simulates the default normalizer and flags any off-note that would
land above its threshold.

## Common mistakes to avoid

1. **Inflated effect numbers.** Flavor ingredients shouldn't claim 4 or 5
   on any axis. The anchors hold the top of the scale; everything else
   is calibrated relative.
2. **Adding flavor words that already exist.** "Lemony" when "citrus" is
   already there. "Earthy-sweet" when "earthy" + "sweet" already cover it.
3. **Medical-claim language slipping through.** Re-read the blurb and
   facts with the eye of someone reviewing for FDA/UK MHRA compliance.
   "Treats" → "traditionally used for"; "cures" → never.
4. **Copy-pasted research without verification.** If the research file
   says "limonene is 70%," verify against at least two sources before
   it ends up in the steep-screen facts.
5. **Subtitle inconsistency on new blends.** All-lowercase, em-dash with
   spaces, one image plus mechanism. Match the existing blend voice.
6. **Skipping the in-app audit.** Tests pass != app works. Open the
   detail page, search the alias, build a draft blend.

---

## Reference: most recent batch (2026-04-28)

Added 5 ingredients: `bergamot`, `orange-peel`, `lemon-peel`, `dried-apple`,
`cranberry`. Closed the catalog gap around dried fruit and flavoring peels.
Wired 8 blends total (5 new, 3 rewrites). All 6 test suites passed; 368
tests, 0 failures.

Research files: `docs/research/ingredients/{bergamot,orange-peel,lemon-peel,
dried-apple,cranberry}.md`.

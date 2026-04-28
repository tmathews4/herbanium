# Ingredient Addition Process

> Canonical sequence for adding a new ingredient to the Herbanium catalog.
> Designed to keep voice, calibration, and safety claims consistent as the
> catalog grows. Every step except the optional ones should be considered
> mandatory.

---

## The 9-step sequence

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

### 5. Run tests
```
npm test
```

All 6 suites must pass:
- `literature.test.mjs` — directional effect checks
- `curated-blends.test.mjs` — clean-default audit on ~50 blends
- `ingredient-fit.test.mjs` — catalog audit + helper sanity
- `blend-perception.test.mjs` — perception pipeline literature checks
- `calibration.test.mjs` — anchor + ceiling + flavor whitelist
- `perception-extras.test.mjs` — loudness, fragile decay, effect floor

If `calibration.test.mjs` fails on an anchor invariant, the new ingredient's
effect numbers are inconsistent with the rubric — don't widen the test
bounds, lower the ingredient's number.

### 6. In-app audit
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

### 7. Suggest blend follow-ups
Once the ingredient lands, propose:
- **Existing-blend rewrites** — does any current curated blend
  improve by adding this ingredient? (Garden Court → add bergamot for
  Earl Grey character; Quiet Apple → add dried apple for body.)
- **New experimentals** — what 2–4 obvious-pairing blends does this
  ingredient unlock? Wire as `experimental: true, house: true` in
  `src/data/blends.js`.

This step is what turns a single ingredient into a catalog improvement
rather than a lone entry.

### 8. Optional: extraction profiles
File: `src/data/extractionProfiles.js`

Add only if the ingredient has a meaningfully different gentle/standard/
strong character. Most flavor-driven ingredients can skip this — the
single brewing window covers them. Reach for profiles when the cup
genuinely changes shape across the temp/time grid (chamomile, matcha,
puerh).

### 9. Optional: wait content
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

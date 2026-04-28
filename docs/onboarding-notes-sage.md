# Onboarding notes — Sage (process feedback)

> Working notes captured while running the 10-step ingredient-addition
> process on sage (2026-04-28). Captures friction, gaps, and ideas
> for tightening the process so the next batch is faster and more
> precise without losing calibration discipline.

---

## Friction points (filled as I work)

### Step 1 — Research file

- **Template numbering anomaly.** The research-template numbering jumps
  from section 10 ("Facts for the Steep screen") to section 12
  ("Confidence self-assessment"). There's no section 11. Either renumber
  to 1–11 or document why 11 is reserved.
- **No "Tier" field in the template.** I'm noting "Tier 2" in the
  pre-amble freehand. Should be a structured field at the top
  (`tier: 1 | 2 | 3`) so the research files can be batch-filtered.
- **The research file template doesn't list known-flavor coverage.**
  Authors have to know to cross-check `KNOWN_FLAVORS` separately. Could
  add a "flavors mapped" checkbox to the identity table.
- **Section 6d ("Time-axis behavior") is freeform prose.** Useful but
  non-uniform across files. Consider replacing with a structured
  monotonic/inverted/parabolic enum + one-line note — that would feed
  the perception layer's `FRAGILE_EFFECTS` decisions automatically.

### Step 4 — Sources panel

- **No clear rule for "amend vs. add a new entry."** The current
  process doc says "amend an existing item if the new citation is a
  single-line addition" but offers no rubric for *which* category to
  amend. For sage I had Commission E (covered by the existing general
  monograph entry) and Tildesley cognitive trial (could amend
  "Clinical evidence base / Systematic reviews" but it's a single small
  trial, not a review). Decided to skip both — but a clearer "skip if
  the existing categories already imply this source" rule would help.
- **Could surface this from check-ingredient.** When run on a new id,
  the tool could grep the research file's source list against the
  known categories in ProfileScreen.jsx and tell the author "your
  Commission E and clinical-trial sources are already covered" or
  "you have a primary source in category X — consider amending."

### Step 5 — Calibration audit

- **Worked first try, no findings.** Big improvement over the comfort
  gap I missed last batch — that audit caught my error retroactively;
  this one ran preemptively.
- **"Zero peers at this strength" is interesting context, not an
  error.** Sage's `soothing 2` and `cooling 2` have no peers at
  exactly 2 (the closest are at 3 above and at 1 below). Currently
  this just shows in the report as `0 peer(s)`. Could be worth
  flagging as a soft signal: "this ingredient is the only one at
  level X on tag Y — confirm the level is right." Not an error,
  but useful.
- **Tool exits 0 on clean.** Good — works as a build gate.

### Step 6 — Full test suite

- **Tone guardrails caught a noun/verb false positive.** "Throat
  remedies" tripped the `\bremedies\b/i` regex which is meant to
  catch the verb sense ("sage remedies the throat"). The noun plural
  is a perfectly fine herbalism word. Two ways to fix:
  - Reword (what I did): "throat remedies" → "throat treatments"
  - Refine the regex: `/\bremedies\b/i` → `/\bremedies\s+\w+/i` (verb
    needs an object) or add allowlist for "throat remedies",
    "household remedies", "folk remedies", etc.
  - I think the regex is worth tightening — herbalism prose has many
    legitimate noun uses ("herbal remedies," "folk remedies"). Adding
    a noun-phrase allowlist would prevent future authors hitting the
    same friction.
- **Tone guardrails currently runs last in the chain.** When it
  fails, you've already paid the cost of the slower suites. Cheap to
  reorder it earlier — fast and tells the author about a copy issue
  before they invest in calibration debugging.

### Step 7 — In-app audit

- **No automated harness for this step.** The doc lists checkboxes
  but there's no tooling, so this step relies on the author manually
  opening the app. For a single-ingredient batch that's fine; for a
  multi-ingredient pass, easy to forget. Could build a smoke test
  that imports each new id, calls the same resolution paths the UI
  does, and asserts no exceptions. Wouldn't catch visual layout
  issues but would catch broken pair refs, missing fields, etc. that
  manifest as runtime errors.

### Step 8 — Blend follow-ups

- **No tool surfaces "obvious pairings."** The author has to scan
  the catalog manually to find blends where the new ingredient
  fits. A `npm run suggest-blends -- <id>` tool could:
  - List blends whose mood/flavor matches the new ingredient's
    profile and where it would fit ratio-wise
  - Suggest new blend templates based on `pairs[]` — every
    ingredient lists its natural pairings, so 2-3 ingredient
    combinations from those pairs are obvious blend candidates
  - Cross-check against existing curated blends so duplicates
    aren't proposed
- **For sage specifically, the obvious blends are:**
  - sage + lemon-peel (Mediterranean throat-cup, a real folk remedy)
  - sage + chamomile (gentle evening throat / sore-throat cup)
  - sage + ginger + lemon-peel (a "thieves vinegar" inspired tea)
  - sage as accent in Earl Grey-adjacent blends (savory bergamot)

### Gotcha discovered: default flavor-strength normalizer is brittle

When an ingredient's `flavors` array doesn't use explicit `[name, strength]`
tuples, `compose.js:normalizeFlavors` assigns positional strengths:
`Math.max(1, 4 - i)` — so position 0 gets 4, 1 gets 3, 2 gets 2,
3+ gets 1.

This collides with the off-note thresholds in
`perception.js:buildWarnings`:
- camphor threshold: 1.8
- soapy: 0.5
- harsh: 1.5
- acrid: 1
- burnt: 1
- muddy: 1
- medicinal: 1.5

If any of these words appears at position 0, 1, or 2 in an
ingredient's flavor list, that ingredient will trip an
"is being over-pulled" warning *every time it's a lead*, regardless
of brew window.

I hit this with sage. Initial flavor order was
`["aromatic", "savory", "camphor", ...]` — camphor at position 2
got strength 2, exceeded the 1.8 threshold, and tripped the
aromatic warning on Sage & Lemon and Four Thieves at their
baselines. Fix was to reorder camphor to position 4 (strength 1).

**Recommendations for the process:**
1. **Document the gotcha** in `ingredient-addition-process.md`: when
   an ingredient genuinely has off-note flavors (camphor, soapy,
   harsh, acrid, burnt, muddy, medicinal), declare flavors as
   tuples — `[["aromatic", 3], ["camphor", 1]]` — rather than bare
   strings. The bare-string form is fine when no off-notes are
   in play; tuple form is required when they are.
2. **Add to `check-ingredient`**: when run on an id, simulate the
   standalone profile and warn if any off-note word would land at a
   position that exceeds its threshold.
3. **Consider a smarter default**: the current 4-3-2-1-1 distribution
   is naive. A future iteration could lower the default for known
   off-notes specifically — e.g., camphor always defaults to 1 unless
   explicitly tupled higher.

---

## Synthesis — process improvements ranked by leverage

### Done in this pass

- ✅ Added off-note hazard detection to `check-ingredient` (caught
  the camphor-at-position-2 mistake automatically).
- ✅ Documented the off-note gotcha in
  `docs/ingredient-addition-process.md`.

### High leverage, recommended next

1. **Add a noun-phrase allowlist to the tone-guardrails regex for
   "remedies."** Single-line fix; prevents the same false-positive
   recurring on every herbalism-flavored ingredient.
2. **Reorder npm test chain to run tone-guardrails earlier** — fail
   fast on cheap copy issues before paying for slow calibration runs.
3. **Build `npm run suggest-blends -- <id>`** that lists existing
   blends where the new ingredient would slot ratio-wise plus
   2–3-ingredient combinations from the new entry's `pairs[]`.
   Replaces the manual "look at the catalog and think" step 8.
4. **Restructure the research file template**: renumber 12 → 11,
   add `tier: 1 | 2 | 3` field, replace section 6d's freeform prose
   with a structured `time-axis: monotonic | inverted | parabolic`
   enum so it can feed `FRAGILE_EFFECTS` decisions automatically.

### Medium leverage

5. **Add a flavor-coverage check** to the research-file template
   itself — "all flavor words must appear in `KNOWN_FLAVORS`; new
   words must be added in the same PR." Currently this only
   surfaces in `check-ingredient`; catching at research-file time
   would be cheaper.
6. **Source-amend rubric** in the process doc: clearer guidance on
   when a new ingredient warrants a SOURCES entry vs. when the
   existing categories implicitly cover it (Commission E, broad
   reviews, etc.). Could be a short flowchart.

### Low leverage / nice to have

7. **In-app smoke test** that imports each new id and runs a
   resolution against the same paths the UI uses (catches missing
   fields, broken pair refs at runtime). Wouldn't catch visual
   issues but would replace the "open the app and tap around"
   manual step for non-visual regressions.
8. **Document subcategory taxonomy** in one place — currently
   listed in the process doc but inferred from the catalog
   schema. Would help authors who don't already know that "fungus"
   is the convention for medicinal mushrooms.

### Not worth doing

- A schema validator (`auditIngredient` already exists; tests cover
  the rest).
- A full DSL for ingredient declaration (the JS object form is
  already lean).

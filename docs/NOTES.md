# Herbanium Notes

Living document of design principles, pending work, key decisions,
and rejected ideas. Grows organically. Search with grep. Commit
alongside code changes.

Sections:
- Design Principles — how the product is supposed to feel and behave
- Pending Work — features and improvements deferred to specific phases
- Key Decisions — choices made and why, worth remembering later
- Rejected Ideas — paths considered and deliberately not taken

---

## Design Principles

### Order communicates meaning
Alphabetize when meaning is "find it." Preserve semantic order when
sequence carries meaning. Moods arc (calm → settle → sleepy → comfort → focus
→ energy) stays in narrative order; ingredient catalog sorts alphabetically.

### Humility of knowledge
Surface uncertainty. Admit limits. Let the user decide. Warning systems
acknowledge when they might be wrong. Confidence tiers are explicit
rather than hidden. Temperature compromise warning is the canonical
example — the app tells the user what the math says, then lets them
choose whether to brew anyway.

### Don't duplicate nav hierarchy
If bottom nav says "Compose," no h1 "Compose" needed on that screen.
The user knows where they are.

### Don't put words in the user's mouth
"Curious" as a fake default intent violated this. Empty string is the
right default. If we don't know what the user wanted, we say so (or show "—").

### Order of the fold
Primary action reachable without scrolling. Optional refinement lives
below. Brew button goes above the blend card, not below it.

### Integrity as political practice
Shaping one corner of the product landscape against the cultural slide
toward extractive design. Applied consistently: paywalling information
would violate it; gating pantry size would violate it; hiding warnings
on curated blends would violate it. Integrity is not asserted — it's
performed through the specific choices about what the product does
and doesn't do.

### Honest humility vs false humility
Honest humility: specific about the edges of knowledge. "We haven't
seen this combination before." False humility: abdication of designer
responsibility. "Who are we to say?" The first is useful to users;
the second is cowardice dressed as virtue.

### Store in canonical units, convert at render
Data persists in Celsius and grams. Display layer converts to the
user's preferred unit (F, tsp). New units can be added without data
migration. Same principle applies to timestamps (UTC) and any other
unit systems we add.

### Self-understanding through reflected behavior, not assigned categories
When the app speaks to a user's patterns, it draws from their actual
logged behavior, not archetypal frameworks. Surfaces observations
("you tend to reach for comfort blends during stressful weeks"); does
not assign identities ("you are an X type").

### Give users explicit permission to explore
Separately from the "get the right answer" flow. Compose optimizes for
"what should I drink right now." An explore/surprise mode would optimize
for "what haven't I tried yet." Different user goals, different UI paths.

### Curated content and algorithmic generation coexist
Not alternatives. Curated blends (BLENDS, MOOD_BLENDS, PAIR_BLENDS) are
authored expressions — named, intentional, carrying editorial voice.
Algorithm generates responsive compositions for inputs curation can't
anticipate. The architecture puts curation first (algorithm consults
curated matches before generating new), which is an inversion of the
big-tech default.

### Prefer smaller batches when changes can fail at build time
Regression tests don't run if the app won't compile. This applies to
any structural refactor (module moves, import changes, renames) where
a single missing piece breaks the whole build. Feature work where a
bug means "one thing renders weird" is the opposite case — big batches
fine there. Stage 10 of modularization used one big commit and hit
three rounds of missing-file debugging; three sub-stages would have
produced three clean test cycles. Not a mistake, but worth remembering:
the "fast path" has a specific failure mode.

### Ingredients as temperature-dependent functions, not fixed properties
A plant's flavor and effect profile varies with how you extract it.
Chamomile at 75°C for 2 min is not chamomile at 95°C for 7 min — different
compounds extract at different rates, producing different characters and
different effect intensities. Data model and UI should reflect this — no
"chamomile is X" statements, instead "chamomile brewed at X°C for Y min
gives Z." Honors the humility-of-knowledge principle and teaches real tea.
Current flat `effects` and `flavors` lists are the v1 approximation;
v2 is extraction profiles (2-3 per ingredient) with UI interpolation.

### Build UI before collecting research data
When the data model is uncertain, build the UI with mock data first.
Playing with the interaction exposes what the data actually needs to carry,
so the research phase collects the right shape on the first pass instead
of discovering gaps later. Applied to extraction profiles: built temp/time
slider UI with chamomile mock data before doing any ingredient research.
Revealed specific questions about interpolation, flavor blending, and
temp/time interaction that would have been invisible from the data side.

### Self-verifying scripts beat manual verification steps
When there's a "make sure you also do X" dependency, automating X as
part of the main action is better than documenting that you should do X.
Applied to pullall: the file-coverage check (check_pullall_deep.sh) runs
automatically at the end of every pullall, so the class of bug "I added
a file and forgot to update pullall" gets caught at copy time instead
of later at deploy time. The noisier output is worth the safety net.
Pattern applies broadly: any manual check that's documented but optional
will eventually be forgotten — build it into the automation instead.

### Science-informed, not scientific advice
Herbanium draws on real botanical and pharmacological knowledge, but
operates in the register of "here's what people who know tea say this
tends to feel like" — not "here's a clinical recommendation." Neither
wellness pseudoscience nor medical guidance. The middle position is a
deliberate choice and carries real consequences:

- Content says "may help you wind down," not "treats insomnia"
- Data model uses felt effects (calm, sleepy, focus) not clinical
  endpoints or pharmacological doses
- Safety warnings focus on interactions and cautions users can act on,
  not dosage recommendations
- Source citations during research signal "this claim comes from
  somewhere credible" — not "this claim is clinically proven"
- When a user has a medical question ("is this safe with my SSRI?"),
  the app's answer should be "consult a pharmacist" — never a
  confident yes/no

This posture also excludes certain features: no dose calculators, no
"treat X condition" flows, no symptom-input recommendation. Those
would imply clinical authority the app doesn't have.

---

## Pending Work

### Research and data

**[PENDING — real ingredient research phase]** Verify all ingredient
facts (currently drafts from training data with specific date/person/
chemistry claims flagged as needing verification). Replace placeholder
content with properly-sourced entries. Maintain per-ingredient citation
list referencing a central bibliography in SOURCES constant.

**[PENDING — during research]** Add extraction profiles to ingredient
data. Each ingredient carries 2-3 profiles spanning its temp range,
each with its own flavor and effect vectors. Data shape:
```
ingredient.extractionProfiles = [
  { tempC: 75, timeS: 180, flavors: [...], effects: [...], character: "..." },
  { tempC: 90, timeS: 300, flavors: [...], effects: [...], character: "..." },
  { tempC: 100, timeS: 420, flavors: [...], effects: [...], character: "..." },
]
```
Replaces the current flat `flavors` and `effects` fields. UI interpolates
between data points for intermediate temp slider positions. Minimum 3
points per ingredient (low/mid/high); some may need 4-5 if profiles shift
unevenly. Research effort gets deeper but produces a much richer product.

**[PENDING — during research]** Ingredient-level measurement overrides.
Add optional `tspGrams` field to ingredient records where the category
default is inaccurate. Gunpowder, matcha, vanilla, cloves are candidates.
`gramsToTsp` function signature changes from `(g, category)` to `(g, ing)`
and checks the override first.

**[PENDING — during research]** Per-ingredient source list + central
SOURCES bibliography. Each ingredient carries `sources: ["ref-id-1", ...]`
pointing to a top-level constant with full citations (title, authors,
publisher/journal, year, url, doi). Display as a Sources section at the
bottom of each ingredient's Overview tab.

**[PENDING — during research]** Per-profile source tracking. Each extraction
profile data point may reference different sources (a paper on apigenin
extraction might inform chamomile's high-temp profile; a flavor guide
might inform the low-temp character). Each profile carries its own
`sources` array referencing the central bibliography. Enables honest
per-data-point confidence and targeted verification later.

**[PENDING — during research, optional] `characterizedPct` per ingredient.**
Honest label of how much of the ingredient's chemistry is represented
in the app's data. Shown as "~65% characterized" with tooltip explaining
what compounds aren't documented. Integrity move: tells the user what
the app doesn't know. Only populated for ingredients where compound data
was collected — ingredients without compound research leave the field
unset rather than defaulting to a number.

**[PENDING — during research, opportunistic] Compound annotations.**
Optional `compounds` array per ingredient with `{name, approxMg,
effects, confidence}`. Added only for ingredients where compound data
is readily available and well-sourced. Not a blanket requirement; skip
for ingredients where data is thin. Displayed to users as explanation
layer ("why this cup is calming: ~0.5mg apigenin from chamomile") —
not used by the blending algorithm in v1.

### Algorithm

**[PENDING — post-research]** Real blending algorithm. Use normalized
effect vocabulary + FLAVOR_TO_CATEGORY map. Design via spec document
before code. Include:
- Clear input/output contract
- Scoring/ranking logic with worked examples
- Constraint checking (temp compatibility, exclusions)
- Confidence tiers (canonical / thoughtful / exploratory)
- Explanation layer (every recommendation has a human-readable why)

Design sessions happen in prose + worked examples first, code comes
after the scoring logic matches product intuition.

### Product features

**[V1 — post-algorithm] Onboarding quiz + stored preferences.** 5-7
questions on first launch that seed user preferences (caffeine tolerance,
time-of-day patterns, flavor preferences, sensitivities). Output feeds
the recommendation engine so the first Compose interaction is personalized
instead of generic.

**[V2 — after V1 has usage data] Behavior-pattern reflection.** "You tend
to reach for X on stressful weeks." Surfaced observations based on actual
logged behavior. Requires session history over time.

**[PENDING — post-algorithm] Exploratory/surprise mode.** Algorithm-first
composition bypassing the curated-blend check. Explicit confidence tier
messaging. Start with basic generative, add confidence-aware messaging
once the algorithm has a real confidence model. Pantry-constrained variant
("surprise me with what I have") as a good first implementation.

**[PENDING — post-algorithm] Tradition toggle V1.** Filter curated blends
by `tradition` field. Add explicit lineage (Maghrebi/Ayurvedic/Song-dynasty
not just "traditional"). Users can opt into "show only tradition-backed"
recommendations.

**[PENDING — post-algorithm] Tradition toggle V2+V3.** Algorithm tier
switch (experimental vs traditional generation modes). UI confidence
messaging that changes with the mode.

**[PENDING — post-research, V2 ingredient page] Temp slider on ingredient
pages.** Interactive horizontal control that remaps flavor tags, effect
bars, brew time, and character description as the user drags across the
ingredient's temp range. Primary discoverable feature for understanding
how extraction works. Requires extraction profile data model. Teaches
real tea through interaction instead of static content — no existing
tea app does this to our knowledge.

**[PENDING — post-research, V2 blend page] Temp slider on blend pages.**
Same mechanism as ingredient version, applied to composite blend profile.
Shows which ingredients "work" at which temp within a multi-ingredient
blend (since blend temps are often compromises). Makes temperature
trade-offs visible and educational rather than arbitrary.

**[PENDING — V3 brew flow] Slider-driven brew.** Once extraction profiles
are understood, Compose/Steep might let users explicitly choose
"gentle / standard / strong" before brewing. Algorithm picks a default;
slider lets user override. Empowers users who know what they want
(lower caffeine via cooler sencha, stronger sleep aid via hotter
chamomile) without requiring ingredient-level expertise.

### Infrastructure

**[PENDING — when data file crosses ~2000 lines]** Split INGREDIENTS into
category files under `src/data/ingredients/` with an `index.js` that
re-exports the combined map. Consumer API stays identical.

**[PENDING — before public launch]** Persistence layer. Start with
localStorage via `usePersistedState` hook. Later consideration: backend
for cross-device sync if that friction matters.

**[PENDING — future]** Profile v2 / palate inference. Name "Tommy"
currently hardcoded; becomes user read when multi-user.

**[PENDING — if shipping to app stores]** Capacitor wrap of web app for
iOS/Android. Phone-backup-based persistence is the intended strategy
(no backend unless cross-device sync specifically needed). One-time paid
app ($3-5), not freemium.

**[PENDING — when algorithm work begins]** Set up `dev.herbanium.app`
via Vercel + dev branch. Do risky algorithm changes on dev, merge to
main when stable. Enables A/B compare of recommendations across
versions. Setup: create `dev` branch, add domain in Vercel pointing to
that branch, add CNAME record at Porkbun (`dev` → `cname.vercel-dns.com`).

**[PENDING — when real users exist]** Clear Vercel cache / force
refresh workflow. Currently relying on manual Ctrl+Shift+R after
deploys; pre-launch we should figure out cache invalidation strategy
so users don't see stale assets after updates.

---

## Key Decisions

### Career & monetization

**Not pursuing QA Lead W2 path.** Going indie builder + contract work.
Driven by dread of corporate culture, disagreement with market structure,
and alignment between the work that energizes and what indie/contract
actually is. Herbanium shifts from "portfolio for hiring managers" to
"product demonstration for clients + writing source material + small
optional revenue."

**Herbanium monetization if shipped: one-time paid app ($3-5), not
freemium, not ingredient-gating.** Web version stays free forever.
Freemium would violate integrity posture (knowledge as paywall) and is
wrong for the scale of what this is (portfolio piece with optional revenue,
not a business). One-time paid is transparent, honest, matches the
"couple bucks incidentally" goal.

**Moroccan Mint temp warning false-positive: accepted as minor
imperfection.** No tradition-aware suppression built yet. "Getting into
algo territory, staying in GUI for now."

### Data & algorithm

**Effect tags normalized to mood vocabulary across ingredients and blends.**
`calming → calm`, `settling → settle`, `lifting → energy`, `clear → focus`,
`digestive → settle`, `warming → comfort`. Mood chips and ingredient
effect bars now share vocabulary. Slight grammatical informality on
ingredient pages ("this herb is calm" reads oddly) accepted in exchange
for algorithm-readiness.

**EFFECT_TO_MOOD and FLAVOR_TO_CATEGORY mapping constants added** as
translation layer between ingredient-level and user-facing vocabulary.
Most entries are identity post-normalization; structure preserved so
richer ingredient-level vocabulary can be reintroduced later without
breaking the algorithm.

**Curated blends fixed to pass their own temp compatibility checks.**
Scriptorium: peppermint → jasmine. Hearth & Quiet: rose → cinnamon.
Temp ranges widened where overly strict: rooibos [100,100]→[95,100],
sencha [70,80]→[70,85], spearmint [95,100]→[85,100]. App no longer
recommends blends it simultaneously warns about.

**Default temperature unit: F (American).** Weight default: tsp.
Users can change in Profile → Preferences.

**3 extraction profile data points per ingredient as the starting target.**
Covers most cases well; add a 4th-5th point to specific ingredients
(likely true teas with dramatic profile shifts) during research if linear
interpolation between 3 points misses meaningful character shifts.
Don't over-collect speculatively — adjust per-ingredient based on what
the data shape actually needs.

**Algorithm blends by grams-weighted average of temp-adjusted profiles.**
For each ingredient in a blend, the algorithm looks up its profile at the
blend's chosen compromise temp (not its ideal temp), then averages those
temp-adjusted profiles weighted by grams. Simple enough to explain; honest
about the limitation that interaction effects (peppermint sharpening
chamomile, ginger amplifying cardamom) aren't captured at this level.

**Research model: effects-first with optional compound annotations.**
Primary data for each ingredient is the 3-point extraction profile
(flavors, effects, character). A `compounds` field is optional — added
opportunistically during research when well-documented data exists,
skipped when not. Algorithm blends effects directly (simpler, reliable).
Compounds exist as user-facing transparency and explanation, not as
algorithm inputs in v1. Door remains open for a compound-level algorithm
later if data becomes complete enough to warrant it.

**Research workflow: depth-first, one ingredient at a time.** Complete
each ingredient fully before starting the next; plug into the UI explorer
immediately as validation. Finds problems after 1 ingredient instead
of after 7. Start with one category (e.g., herbals) to develop the
template before expanding.

### Product scope & structure

**No tradition-aware warning suppression.** All temp warnings fire when
triggered, for curated and user-composed blends alike. The fix for false
positives was correcting the data (curated blends temp-compatible),
not hiding the warning. Integrity rule: "we are honest with the user
AND honest with ourselves."

**Always show temp warnings, for any blend type.** User-composed blends
don't get a pass from the warning system. Information should be available
whether or not we chose the composition.

**Research depth target:** Level 2 sourcing (per-ingredient source lists
referencing central bibliography). Not Level 1 (bibliographic footer,
too vague) and not Level 3 (per-claim citation, overkill for journaling
app). Architecture allows future upgrade to Level 3 if desired.

### Technical

**Modularization complete (stages 1-10 of 12 shipped; 11-12 minor cleanup).**
App.jsx went from ~5,320 lines to 481. Structure now:
- `src/theme.js` — design tokens
- `src/units/units.js` — unit system + conversion helpers
- `src/data/` — ingredients.js, blends.js, seeds.js, waitContent.js,
  extractionProfiles.js (mock data for temp/time slider UI)
- `src/components/` — icons.jsx, layout.jsx (includes Toggle/EmptyState/StatCard/Stat),
  EffectBar.jsx, FactsCard.jsx, DemoHint.jsx, ExtractionExplorer.jsx
- `src/screens/` — one file per screen (HomeScreen, ComposeScreen including
  ReverseCompose, SteepScreen, LogScreen, LibraryScreen including LibraryList
  and BlendListRow, IngredientSheet, IngredientDetail, BlendDetail, ProfileScreen)
- `src/algo/compose.js` — blend composition and ranking (placeholder;
  algorithm phase will rewrite in place)
- `src/helpers/misc.js` — LOCAL_BLENDS, getBlend, mmss, iconBtn

**Stage 10 modularization used one big commit rather than three sub-stages.**
Tradeoff explicitly taken: faster iteration when successful, harder recovery
when failed. Three `git revert`-worthy sub-stages would have produced three
clean test cycles instead of three rounds of missing-file debugging. Not a
mistake, but worth remembering that the "fast path" has a specific failure
mode when changes can fail at build time.

**Built extraction profile UI BEFORE collecting research data.** Mock data
for one ingredient (chamomile) powers a temp/time slider UI on IngredientDetail
→ Brewing tab. Purpose: validate the interaction and discover what the data
model actually needs to carry before committing to a full research pass.
Prevents research-phase from collecting the wrong shape of information.
Worked as intended — exposed that flavor tag interpolation should probably
blend (not union) and that time/temp have real interaction effects that
linear interpolation may miss.

**Production-as-test-environment workflow.** No local dev server
testing during current phase; deploy to Vercel, test on live site,
fix forward or `git revert` if broken. Reasonable only because there
are no real users yet.

**Vercel case-sensitive Linux build catches issues Windows/WSL misses.**
File naming errors (case mismatches, missing extensions from
`present_files` downloads) fail the build before the app ever runs.
This is a feature, not a bug — saves us from issues that would appear
later in unexpected contexts.

---

## Rejected Ideas (and why)

**Personality-type tea mapping (MBTI, Enneagram).** Pseudoscience.
Incompatible with integrity posture and the self-understanding principle
(behavior reflection, not assigned categories). Would compromise
credibility for an entertainment feature.

**BuzzFeed-style "what tea are you" quiz inside the product.** Diverts
from core journaling purpose. Could potentially exist as standalone
marketing piece (separate mini-site) driving traffic to herbanium.app,
but not as an in-product feature.

**Freemium with limited ingredient access.** Paywalling information
would structurally conflict with the app's teaching posture. Attracts
impulse-upgrade users (wrong audience) and produces churn. The things
that compound value for committed users (retention, personalization,
export) are the right candidates for monetization if any — but given
the "portfolio first" framing, none of it is needed.

**Suppress temp warning on curated blends (Option B from the warning-
integrity discussion).** Would mean the app hides tradeoffs on content
we endorse. Correct fix was data correction, not warning suppression.

**Suppress temp warning on user-composed blends (Option C).** "Experts
get to hide problems, users don't" inverts the integrity rule.
Information should be available equally for all blend types.

**Per-claim citation for ingredient data (Research Level 3).** Overkill
for a journaling app. Per-ingredient source lists (Level 2) give honest
attribution without drowning in per-field citations.

**Algorithm design before ingredient research.** Algorithm quality is
parameterized by data quality. Designing recommendations for phantom
knowledge produces shallow output. Sequence: research → data → algorithm
design → algorithm implementation.

**Application to W2 jobs as comparison during indie pivot decision.**
Interviewing at companies you don't want to work for just to confirm
is a time sink and psychological drain. Skip.

**Compound-level primary data model.** Considered making ingredient data
compound-first (chamomile contains apigenin, bisabolol, etc. with
extraction curves per compound) with effects derived from compound
presence. Rejected for v1 because: (1) compound data quality varies
enormously across ingredients — well-studied ones have good data,
obscure ones have almost none; (2) compound-to-effect mapping is itself
speculative in many cases, so you're pushing approximation down one
layer not removing it; (3) research burden is multiplicative and would
bog down the entire project. Effect-first with optional compound
annotations captures the transparency value without taking on the
complexity cost. Revisit for v3+ if data coverage ever becomes complete
enough to warrant it.

**Clinical or medical-advice framing.** Rejected on the "science-informed,
not scientific advice" principle. No symptom-input recommendations, no
dose calculators, no "treat X condition" flows, no authoritative claims
about specific drug interactions. When users have medical questions,
the app should direct them to pharmacists or doctors — never give a
confident answer. The app occupies the honest middle ground between
wellness pseudoscience and medical guidance, and that requires
deliberately NOT building features that would imply clinical authority.

---

## Conventions

- `[PENDING — phase]` items are deferred to a specific phase, not
  indefinitely.
- Principles are written as imperatives when possible ("store in
  canonical units") rather than descriptions ("data is stored in
  canonical units").
- Decisions include *why*, not just *what*. The reasoning is the
  more valuable artifact.
- When a decision is reversed, the old entry stays with a note about
  the reversal. History is useful.

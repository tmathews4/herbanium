# Plan — Flavors / Balance / Mind / Body

Status: **phases 1-3 done.** See the git log; phases 4-5 remain. Written before touching code because
the refactor moves family keys and I'd rather not discover a third
`body` halfway through.

## The shape

```
┌ Flavors ─────────┐   what it tastes of
│ Balance          │   bitterness · sweetness · astringency · tartness · menthol
├ Temp / Steep ────┤   the thing you change
│ Mind             │   calm · grounding · focus · energy · uplifting · warm · sleepy
└ Body ────────────┘   soothing · heat · cooling · digestive · immune
```

Seven and five. (An earlier draft of this list said six and five and
dropped `grounding` — "settling, centering, settled in yourself" is a
felt state, so Mind.) The order matters: the cup is described above the
controls, what it does to you below them.

## Why mind/body rather than a rename

`MOODS` → `EFFECTS` alone buys little — the code is already mostly
`EFFECT_*` (`FAMILY_BY_EFFECT`, `EFFECT_DESCRIPTIONS`,
`CANONICAL_EFFECTS`). What's called "mood" is specifically the
user-facing chip vocabulary. The line already exists; it's just not
clean.

The real cut is mind vs body, and **the definitions were written in
that language before anyone named the categories**:

- `soothing` — "Bodily ease — the cup that settles the body rather
  than the mind."
- `calm` — "the mind quiets but stays present."
- `comfort` — "…from soothing, which acts on the body's tissues. This
  one is affective."
- `immune` — "Steadying the body's defences."

Those sentences were reaching for the distinction one ingredient at a
time.

Two things fall out for free:

**It dissolves comfort vs soothing.** The question that took three
passes to settle — are these the same register? — stops being askable
once one is Mind and the other is Body. Warm relaxation is felt;
demulcent action on irritated tissue is done to you.

**It replaces a hack.** `canon.js` has `STOMACH_MOOD_KEYS =
{digestive, nauseous, immune}`, excluded from journal pickers because
"where it left me: digestive" doesn't parse. That set is this taxonomy,
discovered piecemeal. The rule becomes *journal pickers offer Mind* and
the list goes away.

## What's safe, and why

**Nothing persists a family name.** Journals and sessions store leaf
tokens only — `currentMoods`, `targetMoods`, `extraMoods`, `actual`.
Families are display-only. So families can be restructured, renamed or
regrouped with no migration, as long as the eleven leaf tokens keep
their spelling.

That is the whole reason this is tractable. `CURRENT_SCHEMA` wipes
rather than migrates, so anything touching persisted keys would be
off the table.

## The `body` collision

`body` is already two internal keys and would become a third:

| where | holds | fix |
|---|---|---|
| effect family `body` | `digestive` only | becomes family `digestive` — a single-leaf family named after its leaf, like `calm`. Redundant once Body is a category above it. |
| flavour family `body` | `creamy` | rename to `mouthfeel` — which is what tasters mean by "body" anyway |
| new top-level | the five bodily registers | keeps the name |

Both internal renames are display-only per the note above.

## Phases

Each ends green and is independently revertable.

**1. Rename the flavour family `body` → `mouthfeel`.**
Touches `FAMILY_BY_FLAVOR`, `FLAVOR_FAMILY_ORDER`, `FAMILY_COLORS`,
`FLAVOR_FAMILY_LABEL`. Smallest, least entangled, and clears the name
before anything wants it.

**2. Collapse the effect family `body` → `digestive`.**
Touches `MOOD_VOCABULARY` and the derived maps. The
`--effect-body` CSS var renames with it. Watch: `MOOD_FAMILY_LABEL`
loses its `body: "digestive"` entry, which is the alias that made the
strip read correctly — after this the family is self-named and needs
no alias, same as `calm`.

**3. Add the category layer.**
A `category: "mind" | "body"` field on each entry in
`MOOD_VOCABULARY`, plus derived `MIND_FAMILIES` / `BODY_FAMILIES`.
Nothing consumes it yet. Guard: every family declares a category.

**4. Split the pickers.**
`PARENT_MOODS` becomes two lists derived from the category field.
Journal pickers offer Mind; `STOMACH_MOOD_KEYS` is deleted. Target
pickers offer both — you can brew *for* digestion. Watch:
`CURRENT_FEEL_PARENTS` is already a hand-filtered subset of four
(`calm`, `focus`, `energy`, `sleepy`); it should derive from Mind too,
but not all Mind members are plausible pre-cup states, so that filter
stays.

**5. Split the strip.**
Two mood strips instead of one, or one strip with a divider. This is
the visible change and the one worth doing last, when everything under
it is stable.

## Decisions taken (2026-08-03)

**`warm` splits into two single-leaf parents** rather than straddling
the categories. It only ever had two children and they belong on
opposite sides, so the family earned nothing by existing.

  Mind  ->  family `warm`, leaf `comfort`, shown as "warm"
  Body  ->  family `heat`, leaf `warming`, shown as "heat"

Both self-named and single-leaf, so each renders as one row — the
collision guard only fires on families with more than one leaf.

**`comfort` displays as "warm"; the TOKEN does not change.** Renaming
it would orphan real data: `comfort` is persisted in journal entries
as `actual`, `targetMoods` and `extraMoods`, and three curated blends
carry `mood: "comfort"`. Same treatment `warming` already gets — it
displays as "heat" while the token stays put. MOOD_LEAF_LABEL exists
for exactly this.

**Balance stays nested under Flavors**, as its own window the way it
is now.

### Consequence: the split needs a new colour

`warm` and `heat` currently share `--effect-warm`. Two parents need
two colours, and the new one has to clear ΔE 12 from all eleven
others — the palette is getting crowded and the greens are already
ratcheted as too-close. Budget for this in phase 3; it is the kind of
thing that looks free and isn't.

## The old note on straddling, kept for the reasoning

`warm` holds `comfort` (Mind) and `heat` (Body). Under Mood/Body that
looked like a problem. Under Mind/Body it's the point: one register,
one half felt and one half physical, which is exactly the distinction
that took three passes to establish.

Practically it means **category lives on the LEAF, not the family** —
or `warm` splits into two single-leaf families. Leaf-level is less
disruptive and keeps the strip's parent/child rollup intact. Decide at
phase 3.

## Open question

**Is Balance a peer of Flavors, or nested under it?** Today the palate
axes have their own strip, their own colours (`PALATE_COLORS`) and
their own warning thresholds in `perception.js`, which argues peer.
But both answer "what does it taste like", which argues nested. Not
blocking — phases 1–4 don't touch it.

## What could go wrong

- **A third `body` appears mid-refactor.** Mitigated by phase order:
  both existing ones are renamed before the category exists.
- **The strip's parent/child rollup breaks.** It suppresses a leaf
  whose label matches its family's; phase 2 changes exactly that
  relationship for `digestive`. Guard already exists in both
  directions.
- **A tool goes stale.** Four tools read `FAMILY_BY_EFFECT`
  (`audit-vocabulary`, `audit-unreachable`, `audit-tour-blend`,
  `apply-research-effects`). All derive rather than hardcode, so they
  should follow — but `CANONICAL_EFFECTS` deriving from the tree was a
  fix made *because* a hand-copy went stale, so this is the failure
  mode to watch.

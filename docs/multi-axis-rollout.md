# Multi-axis brewing model — catalog rollout tracking

> Status doc for the per-ingredient migration to the multi-axis
> brewing model (`tempZones` / `timeZones` / `registerZones` /
> `overPull`). Started 2026-04-28. Each ingredient gets quality
> band descriptions in apothecary-poet voice — no chemistry
> compound names, just the felt result on each axis.

The reference implementation is **tulsi** in `src/data/ingredients.js`.
Process and voice rules live in `docs/ingredient-addition-process.md`
section 2 ("Multi-axis brewing model"). The research-file template
includes a 6e section for the data.

---

## Architecture invariant — envelope vs. zones

The outer `tempC` / `timeS` envelope is the **canonical brewing
window** (used by `computeBrewProfile` for centroid math, by the
curated-blends test for in-range checks, etc). Zones can extend
**beyond** the envelope to describe what's happening at any
reachable slider point. The compose.js resolver suppresses
outsider warnings when both axis zones resolve, so the in-zones
description path takes over without double-reporting.

**Don't widen envelopes** to accommodate zones — that breaks
centroid math and curated-blend warnings. Let zones extend below
and above the envelope; the resolver handles the gap.

---

## Status

### ✅ Complete — anchors all done (15 / 47)

| ingredient | anchor? | overPull |
|---|---|---|
| tulsi | adaptogen / uplifting 3 | 720s |
| chamomile | **calm 5** | 720s |
| lavender | calm 4 | 360s |
| peppermint | **cooling 5** | 540s |
| ginger | **warming 5** | 720s |
| rooibos | **soothing 5** | 900s |
| hibiscus | cooling 4 | 720s |
| fennel | **digestive 5** | 660s |
| lemonbalm | calm 4 | 420s |
| spearmint | cooling 3 | 540s |
| matcha | **focus 5** | 120s |
| assam | **energy 5** | 420s |
| darjeeling | **uplifting 5** | 360s |
| valerian | **sleepy 5** | 1500s |
| reishi | **grounding 5** | 10800s |

All 10 catalog anchors now have full multi-axis coverage. Every
register/temp/steep band carries a hand-tuned character +
moodImpact in apothecary-poet voice; full register-coverage maps
all 4×5 = 20 axis pairings to one of {faint, aromatic, balanced,
tonic, overpulled}.

### ✅ Second tier complete

### ✅ Recently migrated (second-tier batch 1)

- [x] rose
- [x] jasmine
- [x] passionflower
- [x] lemongrass
- [x] cinnamon
- [x] cardamom

### ⏳ Pending — third tier (8)

Less frequent or niche.

- [ ] black-pepper (catalyst — may skip)
- [ ] genmaicha, dragonwell, lapsang, puerh (specialty teas)
- [ ] yerba-mate
- [ ] lions-mane (long-decoction mushroom)
- [ ] bergamot, orange-peel, lemon-peel, dried-apple, cranberry, sage (recent additions)

---

## Authoring pattern (for the next pass)

Each ingredient takes ~30 lines of new data. The authoring loop:

1. Look up the ingredient's existing `tempC` / `timeS` envelope —
   keep it unchanged.
2. Write 4 `tempZones`: `under` (typically [50, envMin]),
   `cool` / `warm` / `hot` carving up the envelope.
3. Write 5 `timeZones`: `under` (typically [0, ~half-envMin]),
   `short` / `medium` / `long` carving up the envelope, `over`
   (typically [envMax, overPull-threshold]).
4. Write 5 `registerZones` using the default mapping table from
   `docs/ingredient-addition-process.md` unless the ingredient
   has a specific reason to deviate (rooibos forgives long
   steeps → tonic extends; lavender goes soapy fast → tonic
   shrinks; etc).
5. Set `overPull.timeS` past the over zone's max, with a one-line
   `reason` describing what unpleasant means for this ingredient.
6. Each `character` is a single short lowercase sentence. Each
   `moodImpact` is a single phrase using catalog mood vocabulary.
   Skip `pulls` arrays — the UI doesn't surface them.
7. Run `npm test` — should pass without retuning anything if
   envelope stayed unchanged.

---

## Open questions / decisions

- **Should ingredients without zones display anything in the
  per-axis cascade?** Currently they fall back to "Perfect" /
  "out of range" with the legacy directional warnings. The
  detail box is functional but doesn't match the new voice. We
  could backfill a default envelope-derived zone set automatically,
  but that loses ingredient-specific voice. Decision: keep the
  legacy display for un-migrated ingredients; complete the
  migration to remove it.

- **Anchor-strength ingredients (chamomile=5 calm, etc) carry
  more weight in catalog math.** Their multi-axis content should
  be more carefully voiced since users will read it most often.
  The tier-1 priority list above reflects this.

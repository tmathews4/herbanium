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

### ✅ Complete (3 / 47)

| ingredient | tempZones | timeZones | registerZones | overPull |
|---|---|---|---|---|
| tulsi | ✓ 4 bands | ✓ 5 bands | ✓ 5 (full coverage) | ✓ 720s |
| chamomile | ✓ 4 bands | ✓ 5 bands | ✓ 5 (full coverage) | ✓ 720s |
| lavender | ✓ 4 bands | ✓ 5 bands | ✓ 5 (full coverage) | ✓ 360s |

### ⏳ Pending — high priority (12)

These get the next pass. Ordered by user-impact (anchors first,
then most-used herbs in curated blends).

- [ ] peppermint — cooling anchor (5)
- [ ] ginger — warming anchor (5)
- [ ] rooibos — soothing anchor (5)
- [ ] fennel — digestive anchor (5)
- [ ] matcha — focus anchor (5)
- [ ] valerian — sleepy anchor (5)
- [ ] assam — energy anchor (5)
- [ ] darjeeling — uplifting anchor (5)
- [ ] reishi — grounding anchor (5)
- [ ] hibiscus — high-traffic herbal
- [ ] spearmint — Moroccan Mint backbone
- [ ] lemonbalm — frequent calm/digestive accent

### ⏳ Pending — second tier (15)

Common ingredients in curated blends, less frequent than tier-1.

- [ ] rose
- [ ] jasmine
- [ ] passionflower
- [ ] lemongrass
- [ ] cinnamon
- [ ] cardamom
- [ ] vanilla
- [ ] cloves
- [ ] sencha
- [ ] gyokuro
- [ ] white
- [ ] gunpowder
- [ ] hojicha
- [ ] oolong
- [ ] ceylon

### ⏳ Pending — third tier (17)

Less frequent or niche.

- [ ] turmeric, black-pepper (decoction adjuncts)
- [ ] genmaicha, dragonwell, lapsang, puerh (specialty teas)
- [ ] yerba-mate
- [ ] echinacea, elderflower, linden, nettle (cold-care + tonic)
- [ ] dandelion-leaf, dandelion-root, licorice-root
- [ ] ashwagandha, lions-mane (long-decoction adaptogens)
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

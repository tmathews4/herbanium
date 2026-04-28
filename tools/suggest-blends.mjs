/* ──────────────────────────────────────────────────────────────
   tools/suggest-blends.mjs

   Step 8 of the ingredient-addition process: given a new ingredient
   id, surface the obvious blend opportunities so authoring blends
   stops being a "scan the catalog and think" task.

   Three reports per ingredient:

     1. REWRITE candidates — existing curated blends whose ingredient
        list overlaps with the new entry's pairs[]. Adding the new
        ingredient to one of these often improves the cup (e.g. add
        bergamot to a darjeeling-based blend, or sage to a chamomile-
        based throat blend).

     2. NEW 2-INGREDIENT combinations — every pair-mate from the new
        entry's pairs[], paired with the new id itself, that doesn't
        already appear as a curated 2-leaf blend. These are the
        cleanest first-blend candidates.

     3. NEW 3-INGREDIENT combinations — triplets drawn from pairs[]
        that don't already appear as a curated blend. Optional layer;
        useful when the 2-leaf field is exhausted.

   Each candidate is annotated with mood/flavor compatibility — does
   the partner share an effect axis with the new entry, and does its
   flavor profile complement?

   Usage:
     npm run suggest-blends -- bergamot
     npm run suggest-blends -- sage cranberry
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import { BLENDS, MOOD_BLENDS, PAIR_BLENDS } from "../src/data/blends.js";

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Usage: npm run suggest-blends -- <id> [<id> ...]");
  console.error("Pass one or more ingredient ids that already exist in src/data/ingredients.js.");
  process.exit(1);
}

// Flatten every blend into a normalized record so the matcher
// doesn't have to care which store the blend came from.
function gatherBlends() {
  const all = [];
  for (const b of BLENDS) {
    all.push({
      label: "BLEND",
      id: b.id,
      name: b.name,
      mood: b.mood,
      flavor: b.flavor,
      tradition: b.tradition,
      experimental: !!b.experimental,
      ingIds: (b.ingredients || []).map(i => i.id),
    });
  }
  for (const [mood, b] of Object.entries(MOOD_BLENDS)) {
    all.push({
      label: `MOOD:${mood}`,
      id: `mood-${mood}`,
      name: `${mood} (single-mood)`,
      mood,
      flavor: null,
      tradition: null,
      experimental: false,
      ingIds: (b.ings || []).map(i => i.id),
    });
  }
  for (const [key, b] of Object.entries(PAIR_BLENDS)) {
    all.push({
      label: `PAIR:${key}`,
      id: `pair-${key}`,
      name: b.name,
      mood: null,
      flavor: null,
      tradition: null,
      experimental: false,
      ingIds: (b.ings || []).map(i => i.id),
    });
  }
  return all;
}

const allBlends = gatherBlends();

// Set of every pair of ids that *coexist* in any curated blend, used
// for "is this combination novel?" checks. Stored as sorted "a||b"
// keys so order doesn't matter.
function buildPairwisePresenceSet() {
  const set = new Set();
  for (const b of allBlends) {
    for (let i = 0; i < b.ingIds.length; i++) {
      for (let j = i + 1; j < b.ingIds.length; j++) {
        const k = [b.ingIds[i], b.ingIds[j]].sort().join("||");
        set.add(k);
      }
    }
  }
  return set;
}
const pairwise = buildPairwisePresenceSet();

function blendContainsTriplet(triplet) {
  const t = new Set(triplet);
  return allBlends.some(b => {
    if (b.ingIds.length < 3) return false;
    let hits = 0;
    for (const id of b.ingIds) if (t.has(id)) hits++;
    return hits >= 3;
  });
}

function combosOf(arr, k) {
  const out = [];
  function recur(start, path) {
    if (path.length === k) { out.push([...path]); return; }
    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]);
      recur(i + 1, path);
      path.pop();
    }
  }
  recur(0, []);
  return out;
}

function topEffects(ing) {
  return (ing.effects || [])
    .map(([t, s]) => `${t}:${s}`)
    .slice(0, 3)
    .join(" ");
}

function sharedEffect(a, b) {
  const aTags = new Set((a.effects || []).map(([t]) => t));
  const overlap = (b.effects || []).filter(([t]) => aTags.has(t));
  return overlap.map(([t, s]) => t).slice(0, 3);
}

function moodSuggestionForCombo(combo) {
  // Tally effect strengths across the ingredients; the dominant tag
  // (after summing) is a reasonable mood guess.
  const tally = {};
  for (const id of combo) {
    for (const [t, s] of (INGREDIENTS[id]?.effects || [])) {
      tally[t] = (tally[t] || 0) + s;
    }
  }
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 2).map(([t]) => t);
}

for (const id of ids) {
  const ing = INGREDIENTS[id];
  if (!ing) {
    console.error(`\nUNKNOWN: ${id} — not in INGREDIENTS catalog\n`);
    continue;
  }
  const pairs = ing.pairs || [];
  console.log(`\n══ ${id} (${ing.name}) ══════════════════════════════════════════════`);
  console.log(`  effects: ${topEffects(ing) || "—"}`);
  console.log(`  flavors: ${(ing.flavors || []).slice(0, 4).join(", ")}`);
  console.log(`  pairs: ${pairs.length} entries → ${pairs.join(", ")}`);

  if (pairs.length === 0) {
    console.log(`\n  No pairs[] declared; nothing to suggest. Add pair candidates to ingredients.js first.\n`);
    continue;
  }

  // ── Report 1: rewrite candidates ─────────────────────────────
  const rewriteCandidates = allBlends
    .filter(b => !b.ingIds.includes(id))
    .map(b => {
      const overlap = b.ingIds.filter(iid => pairs.includes(iid));
      return { b, overlap };
    })
    .filter(x => x.overlap.length > 0)
    .sort((a, b) => b.overlap.length - a.overlap.length);

  console.log(`\n  REWRITE candidates — existing blends sharing pair-mates with ${id} (${rewriteCandidates.length}):`);
  if (rewriteCandidates.length === 0) {
    console.log(`    (none)`);
  } else {
    for (const { b, overlap } of rewriteCandidates.slice(0, 10)) {
      const tag = b.tradition ? "tradition" : (b.experimental ? "experimental" : "curated");
      const moodFlavor = [b.mood, b.flavor].filter(Boolean).join(" / ");
      console.log(`    [${tag}] ${b.name}${moodFlavor ? "  (" + moodFlavor + ")" : ""}`);
      console.log(`        shares: ${overlap.join(", ")}`);
    }
    if (rewriteCandidates.length > 10) {
      console.log(`    … + ${rewriteCandidates.length - 10} more`);
    }
  }

  // ── Report 2: novel 2-ingredient combos ──────────────────────
  console.log(`\n  NEW 2-INGREDIENT combinations (with ${id} + pair-mate, not already in any curated blend):`);
  const novel2 = [];
  for (const mate of pairs) {
    const mateIng = INGREDIENTS[mate];
    if (!mateIng) continue;
    const k = [id, mate].sort().join("||");
    if (pairwise.has(k)) continue;
    novel2.push({
      mate,
      mateIng,
      shared: sharedEffect(ing, mateIng),
      mood: moodSuggestionForCombo([id, mate]),
    });
  }
  if (novel2.length === 0) {
    console.log(`    (none — every pair already appears together in a curated blend)`);
  } else {
    for (const c of novel2) {
      const sharedStr = c.shared.length ? `shared: ${c.shared.join(", ")}` : `no shared effect axis (complementary?)`;
      console.log(`    + ${id} + ${c.mate}`);
      console.log(`        ${sharedStr}  |  likely mood: ${c.mood.join(" / ") || "—"}`);
    }
  }

  // ── Report 3: novel 3-ingredient combos (capped) ─────────────
  console.log(`\n  NEW 3-INGREDIENT combinations (with ${id} + 2 pair-mates, not yet curated):`);
  const triplets = combosOf(pairs, 2)
    .map(([a, b]) => [id, a, b])
    .filter(t => INGREDIENTS[t[1]] && INGREDIENTS[t[2]])
    .filter(t => !blendContainsTriplet(t))
    .map(t => {
      const overlapAB = sharedEffect(INGREDIENTS[t[1]], INGREDIENTS[t[2]]);
      const overlapAll = sharedEffect(ing, INGREDIENTS[t[1]])
        .filter(e => sharedEffect(ing, INGREDIENTS[t[2]]).includes(e));
      return {
        triplet: t,
        sharedAll: overlapAll,
        mood: moodSuggestionForCombo(t),
      };
    })
    .sort((a, b) => b.sharedAll.length - a.sharedAll.length)
    .slice(0, 8);

  if (triplets.length === 0) {
    console.log(`    (none — pairs[] too sparse to form novel triplets, or all curated)`);
  } else {
    for (const c of triplets) {
      const tag = c.sharedAll.length ? `all share: ${c.sharedAll.join(", ")}` : `no 3-way shared axis`;
      console.log(`    + ${c.triplet.join(" + ")}`);
      console.log(`        ${tag}  |  likely mood: ${c.mood.join(" / ") || "—"}`);
    }
  }

  console.log("");
}

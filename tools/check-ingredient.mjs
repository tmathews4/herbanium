/* ──────────────────────────────────────────────────────────────
   tools/check-ingredient.mjs

   Post-add audit: pass an ingredient id already in the catalog and
   see how it sits relative to anchors and peers on every declared
   axis. Surfaces:

     - Effect placement (peers at the same strength, ingredients above)
     - Anchor gaps (a tag declared with no anchor in EFFECT_ANCHORS)
     - Anchor-promotion candidates (this ingredient ties or exceeds
       the current anchor on a tag)
     - Saturation creep (multiple 5s on the same axis)
     - Flavor whitelist coverage
     - Pair resolution
     - Subcategory consistency

   Usage:
     node tools/check-ingredient.mjs bergamot
     node tools/check-ingredient.mjs orange-peel lemon-peel cranberry

   Run this for every new ingredient before committing — it's the
   onboarding step that confirms the new entry slots correctly into
   the existing rubric instead of silently bending it.
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import {
  EFFECT_ANCHORS, FLAVOR_ANCHORS, KNOWN_FLAVORS,
  CANONICAL_EFFECTS, findEffectSaturation,
} from "../src/data/ingredientFit.js";

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Usage: node tools/check-ingredient.mjs <id> [<id> ...]");
  console.error("Pass one or more ingredient ids that already exist in src/data/ingredients.js.");
  process.exit(1);
}

const TIER = { 5: "signature", 4: "strong", 3: "pronounced", 2: "present", 1: "trace" };

let totalIssues = 0;

for (const id of ids) {
  const ing = INGREDIENTS[id];
  if (!ing) {
    console.error(`\nUNKNOWN: ${id} — not in INGREDIENTS catalog`);
    totalIssues++;
    continue;
  }

  console.log(`\n══ ${id} (${ing.name}) ══════════════════════════════════════════════`);

  const issues = [];
  const notes = [];

  // ── Effect placement ─────────────────────────────────────────
  console.log(`\n  effects:`);
  for (const [tag, s] of (ing.effects || [])) {
    if (!CANONICAL_EFFECTS.has(tag)) {
      issues.push(`unknown effect tag "${tag}" — not in CANONICAL_EFFECTS`);
      continue;
    }
    const anchor = EFFECT_ANCHORS[tag];
    const peers = Object.entries(INGREDIENTS)
      .filter(([oid, oing]) => oid !== id &&
        (oing.effects || []).some(([t, ss]) => t === tag && ss === s))
      .map(([oid]) => oid);
    const above = Object.entries(INGREDIENTS)
      .filter(([oid, oing]) => oid !== id &&
        (oing.effects || []).some(([t, ss]) => t === tag && ss > s))
      .map(([oid]) => oid);

    const anchorStr = anchor ? `${anchor.id}@${anchor.strength}` : "NO ANCHOR";
    console.log(`    ${tag} = ${s} (${TIER[s]})`);
    console.log(`      anchor: ${anchorStr}`);
    console.log(`      ${above.length} ingredient(s) above; ${peers.length} peer(s) at ${s}${peers.length ? ": " + peers.slice(0, 8).join(", ") + (peers.length > 8 ? ", …" : "") : ""}`);

    if (!anchor) {
      issues.push(`tag "${tag}" has no anchor — declare one in EFFECT_ANCHORS or remove the tag`);
    } else if (s > anchor.strength) {
      issues.push(`tag "${tag}" strength ${s} EXCEEDS anchor (${anchor.id}@${anchor.strength}) — promote this as new anchor or lower the strength`);
    } else if (s === anchor.strength && id !== anchor.id) {
      notes.push(`tag "${tag}" ties anchor (${anchor.id}@${anchor.strength}) — co-anchor is allowed but worth confirming`);
    }
  }

  // ── Flavor whitelist ─────────────────────────────────────────
  console.log(`\n  flavors:`);
  const unknownFlavors = [];
  for (const f of (ing.flavors || [])) {
    if (KNOWN_FLAVORS.has(f)) {
      console.log(`    ✓ ${f}`);
    } else {
      console.log(`    ✗ ${f}  (NOT in KNOWN_FLAVORS)`);
      unknownFlavors.push(f);
    }
  }
  if (unknownFlavors.length > 0) {
    issues.push(`unknown flavors: ${unknownFlavors.join(", ")} — add to KNOWN_FLAVORS or fix typo`);
  }

  // ── Standalone profile off-note check ────────────────────────
  // Simulate the default normalizer used in compose.js when no
  // extraction profile is declared — positional strength is
  // max(1, 4 - i). If any of these flavor words land above their
  // off-note threshold, this ingredient will trip an over-pull
  // warning every time it's a lead in a blend.
  const OFF_NOTE_THRESHOLDS = {
    camphor: 1.8, soapy: 0.5, muddy: 1, medicinal: 1.5,
    harsh: 1.5, acrid: 1, burnt: 1,
  };
  const flavorList = (ing.flavors || []).map(f => Array.isArray(f) ? f : null);
  const usingTuples = flavorList.every(f => f !== null) && flavorList.length > 0;
  if (!usingTuples) {
    const offNoteHazards = [];
    for (let i = 0; i < (ing.flavors || []).length; i++) {
      const f = ing.flavors[i];
      if (Array.isArray(f)) continue;
      const defaultStrength = Math.max(1, 4 - i);
      if (OFF_NOTE_THRESHOLDS[f] !== undefined && defaultStrength >= OFF_NOTE_THRESHOLDS[f]) {
        offNoteHazards.push(
          `"${f}" at position ${i} → default strength ${defaultStrength} >= threshold ${OFF_NOTE_THRESHOLDS[f]}`
        );
      }
    }
    if (offNoteHazards.length > 0) {
      issues.push(
        `off-note flavor would over-pull at default strength — reorder later in the array, or declare flavors as [name, strength] tuples:\n        ` +
        offNoteHazards.join("\n        ")
      );
    }
  }

  // ── Zone validation (multi-register brewing model) ───────────
  // For ingredients that declare zones[], confirm:
  //   - Each zone fits inside the outer envelope (tempC/timeS).
  //   - Zones don't overlap (the zone resolver uses first-match;
  //     overlapping zones make the resolution non-deterministic).
  //   - overPull (if declared) sits *outside* every zone.
  if (Array.isArray(ing.zones) && ing.zones.length > 0) {
    console.log(`\n  zones (${ing.zones.length}):`);
    const [eT0, eT1] = ing.tempC || [];
    const [eS0, eS1] = ing.timeS || [];
    for (const z of ing.zones) {
      const [zT0, zT1] = z.tempC || [];
      const [zS0, zS1] = z.timeS || [];
      console.log(`    ${z.id || "?"}: ${zT0}–${zT1}°C · ${zS0}–${zS1}s`);
      if (z.character) console.log(`      → ${z.character}`);
      if (Array.isArray(z.pulls)) console.log(`      pulls: ${z.pulls.join(", ")}`);
      if (eT0 != null && (zT0 < eT0 || zT1 > eT1)) {
        issues.push(`zone "${z.id}" tempC [${zT0}, ${zT1}] outside envelope [${eT0}, ${eT1}]`);
      }
      if (eS0 != null && (zS0 < eS0 || zS1 > eS1)) {
        issues.push(`zone "${z.id}" timeS [${zS0}, ${zS1}] outside envelope [${eS0}, ${eS1}]`);
      }
    }
    // Pairwise overlap check — zones may share boundaries (touching)
    // but should not overlap on both axes simultaneously by more than a
    // single boundary point.
    for (let i = 0; i < ing.zones.length; i++) {
      for (let j = i + 1; j < ing.zones.length; j++) {
        const a = ing.zones[i], b = ing.zones[j];
        const [aT0, aT1] = a.tempC, [aS0, aS1] = a.timeS;
        const [bT0, bT1] = b.tempC, [bS0, bS1] = b.timeS;
        const tempOverlap = Math.min(aT1, bT1) - Math.max(aT0, bT0);
        const timeOverlap = Math.min(aS1, bS1) - Math.max(aS0, bS0);
        if (tempOverlap > 0 && timeOverlap > 0) {
          notes.push(`zones "${a.id}" and "${b.id}" overlap in both temp and time — first-match resolver may behave ambiguously`);
        }
      }
    }
    if (ing.overPull) {
      const op = ing.overPull;
      for (const z of ing.zones) {
        const [zT0, zT1] = z.tempC || [];
        const [zS0, zS1] = z.timeS || [];
        if (op.tempC != null && op.tempC <= zT1 && op.tempC >= zT0 &&
            op.timeS != null && op.timeS <= zS1 && op.timeS >= zS0) {
          issues.push(`overPull threshold sits inside zone "${z.id}" — assertive warning would fire on a valid register`);
        }
      }
    }
  }

  // ── Pair resolution ──────────────────────────────────────────
  console.log(`\n  pairs:`);
  const badPairs = [];
  for (const p of (ing.pairs || [])) {
    if (INGREDIENTS[p]) {
      console.log(`    ✓ ${p}`);
    } else {
      console.log(`    ✗ ${p}  (NOT in catalog)`);
      badPairs.push(p);
    }
  }
  if (badPairs.length > 0) {
    issues.push(`broken pair refs: ${badPairs.join(", ")} — these ids don't resolve`);
  }

  // ── Issues + notes ───────────────────────────────────────────
  if (issues.length > 0) {
    console.log(`\n  ⚠ issues (${issues.length}):`);
    for (const w of issues) console.log(`    - ${w}`);
    totalIssues += issues.length;
  }
  if (notes.length > 0) {
    console.log(`\n  • notes (${notes.length}):`);
    for (const n of notes) console.log(`    - ${n}`);
  }
  if (issues.length === 0 && notes.length === 0) {
    console.log(`\n  ✓ clean — slots correctly into the rubric`);
  }
}

// ── Catalog-wide saturation check ─────────────────────────────
const sat = findEffectSaturation();
if (Object.keys(sat).length > 0) {
  console.log(`\n══ catalog-wide saturation ══════════════════════════════════════`);
  console.log(`  Effect tags with multiple strength-5 ingredients (allowed but worth reviewing):`);
  for (const [tag, peers] of Object.entries(sat)) {
    console.log(`    ${tag}: ${peers.join(", ")}`);
  }
}

console.log("");
process.exit(totalIssues > 0 ? 1 : 0);

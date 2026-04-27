/* ──────────────────────────────────────────────────────────────
   tools/preview-ingredient.mjs

   Authoring aid: pass a qualitative effect spec and see where the
   resulting strengths would slot you in alongside existing catalog
   ingredients. Useful when adding a new ingredient and you're
   trying to decide whether your "strong calm" feels like a 4 or a 3.

   Usage:
     node tools/preview-ingredient.mjs '{"calm":"strong","sleepy":"pronounced"}'
     node tools/preview-ingredient.mjs '{"focus":4,"energy":3}'

   Tier names: signature(5), strong(4), pronounced(3), present(2), trace(1).
   Bare numbers also accepted.

   Output: the resolved tuples (drop these straight into ingredients.js)
   plus, for each tag, the anchor and every existing ingredient on every
   strength rung — so you can compare your candidate against the cohort
   it would join.
   ────────────────────────────────────────────────────────────── */

import { previewPlacement } from "../src/data/ingredientFit.js";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node tools/preview-ingredient.mjs '{\"calm\":\"strong\"}'");
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(arg);
} catch (e) {
  console.error(`Couldn't parse JSON spec: ${e.message}`);
  process.exit(1);
}

let result;
try {
  result = previewPlacement(spec);
} catch (e) {
  console.error(`Placement failed: ${e.message}`);
  process.exit(1);
}

const { tuples, report } = result;

console.log("\nResolved effects tuple (paste into ingredients.js):");
console.log("  effects: " + JSON.stringify(tuples) + ",");
console.log();

const TIER_LABEL = {
  5: "signature",
  4: "strong",
  3: "pronounced",
  2: "present",
  1: "trace",
};

for (const r of report) {
  console.log(`${r.tag}  →  ${r.suggested} (${r.tierName})`);
  if (r.anchor) {
    console.log(`  anchor: ${r.anchor.id} at strength ${r.anchor.strength}`);
  } else {
    console.log(`  no anchor declared for "${r.tag}" — consider adding one to EFFECT_ANCHORS`);
  }
  console.log();
  for (let level = 5; level >= 1; level--) {
    const peers = r.rungs[level] || [];
    const marker = level === r.suggested ? "→" : " ";
    const tier = TIER_LABEL[level];
    if (peers.length === 0) {
      console.log(`  ${marker} ${level} (${tier}): —`);
    } else {
      console.log(`  ${marker} ${level} (${tier}): ${peers.join(", ")}`);
    }
  }
  console.log();
}

/* ──────────────────────────────────────────────────────────────
   tests/profile-keys.test.mjs

   Lints extraction-profile flavor and effect tokens against the
   FAMILY_BY_FLAVOR / FAMILY_BY_EFFECT mappings that drive the
   FlavorMap visualization. An unmapped token falls through to
   become its own phantom family bar — the bug pattern that
   produced 'Wood' as a top-level family on Wuyi Pine Smoke
   because the profile used "wood" while the mapping only knew
   about "woody."

   What's checked:
     1. Every flavor token used in EXTRACTION_PROFILES has a
        FAMILY_BY_FLAVOR mapping. Quality descriptors (mild,
        complex, smooth) get caught because they're not real
        flavors and shouldn't be in profiles to begin with.
     2. Every effect token has a FAMILY_BY_EFFECT mapping. The
        diagnostic 'bitterness' is the only exception — it lives
        on the palate axis, not the mood axis.
     3. Near-duplicate flavor pairs (sing/plural, y/no-y) map to
        the same family — catches woody/wood-style splits before
        they ship.

   Run: node tests/profile-keys.test.mjs
   ────────────────────────────────────────────────────────────── */

import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// FAMILY_BY_FLAVOR and FAMILY_BY_EFFECT live in a .jsx file that
// node can't import directly. Parse them out of the source text
// with a regex — the mappings are simple flat objects with no
// computed values, so a string match is enough.
function loadFamilyMap(label) {
  const src = readFileSync(resolve(__dirname, "../src/components/FlavorMap.jsx"), "utf8");
  const re = new RegExp(`export const ${label} = \\{([\\s\\S]*?)\\};`);
  const m = src.match(re);
  if (!m) throw new Error(`couldn't find ${label} in FlavorMap.jsx`);
  const out = {};
  for (const line of m[1].split("\n")) {
    for (const entry of line.matchAll(/(?:"([^"]+)"|([a-z][a-z0-9-]*)):\s*"([^"]+)"/g)) {
      const key = entry[1] || entry[2];
      out[key] = entry[3];
    }
  }
  return out;
}

const FAMILY_BY_FLAVOR = loadFamilyMap("FAMILY_BY_FLAVOR");
const FAMILY_BY_EFFECT = loadFamilyMap("FAMILY_BY_EFFECT");

// Bitterness is intentional — diagnostic effect, surfaces on the
// palate strip not the mood strip. Other effects must be mapped.
const EFFECT_EXEMPT = new Set(["bitterness"]);

let pass = 0, fail = 0;
const failures = [];

function test(desc, fn) {
  try {
    fn();
    pass++;
    process.stdout.write(".");
  } catch (e) {
    fail++;
    failures.push({ desc, message: e.message });
    process.stdout.write("F");
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ─── Collect all keys used across the catalog ─────────────────

const flavorKeys = new Map();  // key → Set of ingredient ids
const effectKeys = new Map();

for (const [id, profile] of Object.entries(EXTRACTION_PROFILES)) {
  for (const knot of profile) {
    const flavs = knot.flavorStrengths || (knot.flavors || []).map(f => [f]);
    for (const entry of flavs) {
      const name = Array.isArray(entry) ? entry[0] : entry;
      if (!flavorKeys.has(name)) flavorKeys.set(name, new Set());
      flavorKeys.get(name).add(id);
    }
    for (const [name] of (knot.effects || [])) {
      if (!effectKeys.has(name)) effectKeys.set(name, new Set());
      effectKeys.get(name).add(id);
    }
  }
}

console.log("Extraction-profile key audit\n");

// ─── 1. No orphan flavor keys ───────────────────────────────────

test("every flavor token in EXTRACTION_PROFILES has a family mapping", () => {
  const orphans = [];
  for (const [name, ings] of flavorKeys) {
    if (!FAMILY_BY_FLAVOR[name]) {
      orphans.push(`${name} (used in ${[...ings].join(", ")})`);
    }
  }
  assert(orphans.length === 0,
    `flavor tokens without FAMILY_BY_FLAVOR mapping (they'd render as phantom families):\n        - ` +
    orphans.join("\n        - "));
});

// ─── 2. No orphan effect keys ───────────────────────────────────

test("every effect token in EXTRACTION_PROFILES has a family mapping", () => {
  const orphans = [];
  for (const [name, ings] of effectKeys) {
    if (EFFECT_EXEMPT.has(name)) continue;
    if (!FAMILY_BY_EFFECT[name]) {
      orphans.push(`${name} (used in ${[...ings].join(", ")})`);
    }
  }
  assert(orphans.length === 0,
    `effect tokens without FAMILY_BY_EFFECT mapping:\n        - ` +
    orphans.join("\n        - "));
});

// ─── 3. Near-duplicate flavors map to the same family ───────────

test("near-duplicate flavor pairs share a family", () => {
  const list = [...flavorKeys.keys()].sort();
  const splits = [];
  for (const a of list) {
    for (const b of list) {
      if (a >= b) continue;
      const isNearDup =
        b === a + "y" || b === a + "s" || b === a + "ed"
        || (a.endsWith("y") && b === a.slice(0, -1))
        || (a.endsWith("s") && b === a.slice(0, -1));
      if (!isNearDup) continue;
      const fa = FAMILY_BY_FLAVOR[a];
      const fb = FAMILY_BY_FLAVOR[b];
      if (fa && fb && fa !== fb) {
        splits.push(`${a} (→${fa}) ~ ${b} (→${fb})`);
      }
    }
  }
  assert(splits.length === 0,
    `near-duplicate flavor tokens with different families (likely a typo / inconsistency):\n        - ` +
    splits.join("\n        - "));
});

// ─── SUMMARY ────────────────────────────────────────────────────

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\n  Failures:");
  for (const f of failures) console.log(`    ✗ ${f.desc}\n        ${f.message}`);
  process.exit(1);
}
process.exit(0);

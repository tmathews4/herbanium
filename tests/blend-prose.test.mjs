/* ──────────────────────────────────────────────────────────────
   tests/blend-prose.test.mjs

   A blend must not describe an ingredient it does not contain.

   Two shipped for a long time and nothing could have noticed:

     all-heal    "chamomile and valerian for the descent, lemon balm
                  to soften anxiety, passionflower ..."
                 — the blend held valerian, lemonbalm, passionflower.
                 No chamomile.

     throat-coat "Licorice and marshmallow coat the irritated tissue"
                 and, in the BREWING DIRECTIONS, "the mucilage in
                 slippery elm and marshmallow needs a long covered
                 steep" — the blend holds licorice, ginger, fennel and
                 peppermint, and slippery elm was never in the catalog
                 at all. Brewing advice justified by two absent herbs.

   Every audit in this repo checks a claim against the RESEARCH. This
   checks prose against the blend's own ingredient list, which is a
   fact the app already knows and was contradicting.

   FULL NAMES ONLY, and that is a deliberate limit rather than an
   oversight. Matching head nouns instead was tried and is unusable:
   "Dried Apple" and "Dried Cranberry" both reduce to "dried" and hit
   any blend whose prose says the word, while legitimate COMPARISONS
   ("Milk is for breakfast Assam down on the plains", "half the
   caffeine of plain sencha") read identically to a false claim. That
   version reported 14 hits and every one was noise. This one reports
   only exact catalog names and had zero false positives — it would
   have caught all-heal, and it would NOT have caught throat-coat's
   "marshmallow", because the catalog name was "Marshmallow Root".
   A guard that is right about everything it says beats one nobody
   trusts.
   ────────────────────────────────────────────────────────────── */

import { BLENDS, BLEND_DIRECTIONS } from "../src/data/blends.js";
import { INGREDIENTS } from "../src/data/ingredients.js";

let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; console.error(`\n  FAIL ${name}\n  ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const catalog = Object.entries(INGREDIENTS)
  .map(([id, m]) => ({ id, name: String(m.name || "").toLowerCase() }))
  .filter(x => x.name.length >= 4);

const proseOf = (b) => [
  b.culturalNote, b.subtitle, b.description,
  ...(BLEND_DIRECTIONS?.[b.id] || []),
].filter(t => typeof t === "string").join("  ").toLowerCase();

test("there is prose and a catalog to check", () => {
  assert(catalog.length > 10, "catalog looks empty — this guard would pass vacuously");
  assert(BLENDS.some(b => proseOf(b).length > 0), "no blend prose found at all");
});

test("no blend names a catalog ingredient it does not contain", () => {
  const bad = [];
  for (const b of BLENDS) {
    const prose = proseOf(b);
    if (!prose) continue;
    const has = new Set((b.ingredients || []).map(i => i.id));
    for (const { id, name } of catalog) {
      if (has.has(id) || !prose.includes(name)) continue;
      bad.push(`  ${b.id}: prose names "${name}" — holds ${[...has].join(", ") || "(nothing)"}`);
    }
  }
  assert(bad.length === 0,
    `a blend describing an ingredient it does not hold is the app ` +
    `contradicting a fact it already knows:\n${bad.join("\n")}`);
});

test("every ingredient a blend lists actually exists", () => {
  // The other direction, and it is how a removed ingredient would show
  // up: marshmallow-root left the catalog and any blend still holding
  // it would render a leaf with no name, no profile and no research.
  const bad = [];
  for (const b of BLENDS) {
    for (const i of b.ingredients || []) {
      if (!INGREDIENTS[i.id]) bad.push(`  ${b.id} -> ${i.id}`);
    }
  }
  assert(bad.length === 0, `blends referencing ingredients that do not exist:\n${bad.join("\n")}`);
});

test("no ingredient's pairs point at something removed", () => {
  const bad = [];
  for (const [id, m] of Object.entries(INGREDIENTS)) {
    for (const p of m.pairs || []) {
      if (!INGREDIENTS[p]) bad.push(`  ${id}.pairs -> ${p}`);
    }
  }
  assert(bad.length === 0,
    `a dangling pair recommends a leaf the app cannot show:\n${bad.join("\n")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
console.log(`  (${BLENDS.length} blends, ${catalog.length} catalog names)`);
if (fail) process.exit(1);

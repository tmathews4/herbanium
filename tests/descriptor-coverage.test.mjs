/* ──────────────────────────────────────────────────────────────
   tests/descriptor-coverage.test.mjs

   Every word the app SHOWS can be tapped for what it means. This
   checks that the tap has something to say.

   The app's whole claim is that it teaches extraction chemistry, and
   a bar labelled `bergamot` that opens an empty panel teaches
   nothing while looking exactly like one that does. That failure is
   invisible from the data side — the token is valid, the family
   mapping is right, the bar renders — so nothing else here catches
   it.

   IT ALREADY HAPPENED, twice, and both were self-inflicted:
   relabelling the `sweet` family to `sweet aroma` moved the key the
   flavor strip looks a family up by, leaving that bar with no
   description at all; and the mood relabel would have done the same
   to three more if the leaf labels hadn't been carried across with
   their families.

   WHAT COUNTS AS "SHOWN", which is the whole subtlety here:

     - flavor LEAVES that are both reachable and used. A token
       stripped by EXCLUDED_FROM_FLAVOR never renders as a flavor
       row (bitter and friends live on the palate strip instead), and
       a token no extraction profile uses can't appear in any cup.
       Describing either is writing content nobody can reach.
     - flavor FAMILY labels, by the label rather than the key — that
       distinction is exactly what broke `sweet aroma`.
     - palate axes and mood labels, which are small, always visible,
       and currently complete.

   Run: node tests/descriptor-coverage.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { FAMILY_BY_FLAVOR, FLAVOR_FAMILY_LABEL, MOOD_VOCABULARY } from "../src/data/families.js";
import { FLAVOR_DESCRIPTIONS, EFFECT_DESCRIPTIONS } from "../src/data/vocabularyDescriptions.js";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Descriptor coverage — every visible word explains itself\n");

// Read the exclusion set from the component rather than restating it,
// so a word moved onto the palate strip stops being required here
// automatically.
const mapSrc = readFileSync(resolve(__dirname, "../src/components/FlavorMap.jsx"), "utf8");
const EXCLUDED = new Set(
  [...(mapSrc.match(/EXCLUDED_FROM_FLAVOR = new Set\(\[([\s\S]*?)\]\)/)?.[1] || "")
    .matchAll(/"([^"]+)"/g)].map(m => m[1]),
);

const USED = new Set();
for (const p of Object.values(EXTRACTION_PROFILES)) {
  if (!Array.isArray(p)) continue;
  for (const row of p) for (const f of (row.flavors || [])) USED.add(f);
}

const composeSrc = readFileSync(resolve(__dirname, "../src/algo/compose.js"), "utf8");
const PALATE_AXES = [...(composeSrc.match(/const BALANCE_AXES = \[([\s\S]*?)\];/)?.[1] || "")
  .matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

/* ── Recorded gaps, with their reason ────────────────────────────
   Not an exemption list. Each of these is a vocabulary question
   that a paragraph of prose would paper over rather than answer, so
   the honest move is to name the question and leave the word
   undescribed until it's settled. Delete the entry when it is, and
   this test asks for the description again.
   ────────────────────────────────────────────────────────────── */
const NO_DESCRIPTION_YET = {
  rich:
    "A quality descriptor, not a flavor — the same category "
    + "profile-keys.test.mjs already calls out (\"mild, complex, smooth ... "
    + "not real flavors and shouldn't be in profiles to begin with\"). It "
    + "says a cup has body, which is a judgement about every note at once "
    + "rather than a note. Carried by rooibos and darjeeling. Wants "
    + "removing or remapping, not describing.",
  robust:
    "Same as `rich`. Assam only, and it means strong — which the "
    + "bitterness and astringency axes already measure.",
};

test("the exclusion set and profiles were actually read", () => {
  assert(EXCLUDED.size > 5, `parsed ${EXCLUDED.size} excluded tokens — the regex has drifted`);
  assert(USED.size > 40, `only ${USED.size} flavors used across all profiles — parse looks wrong`);
  assert(PALATE_AXES.length >= 4, `parsed ${PALATE_AXES.length} palate axes`);
});

test("every flavor a cup can actually show has a description", () => {
  const missing = Object.keys(FAMILY_BY_FLAVOR)
    .filter(t => !EXCLUDED.has(t))          // shown on the flavor strip at all
    .filter(t => USED.has(t))               // reachable in some cup
    .filter(t => !FLAVOR_DESCRIPTIONS[t]?.summary)
    .filter(t => !(t in NO_DESCRIPTION_YET));
  assert(missing.length === 0,
    `these render as flavor rows and open an empty panel:\n  ${missing.join(", ")}`);
});

test("every flavor family explains itself, by the label it displays", () => {
  // BY LABEL, not by key. `sweet` the key has a description; `sweet
  // aroma` the label is what the strip looks up, and renaming one
  // without the other is what silently emptied that panel.
  const INTERNAL = {
    off: "A diagnostic bucket whose members are all stripped from the flavor "
       + "strip by EXCLUDED_FROM_FLAVOR, so the label never reaches a user.",
  };
  const missing = [...new Set(Object.values(FAMILY_BY_FLAVOR))]
    .filter(f => !(f in INTERNAL))
    .map(f => FLAVOR_FAMILY_LABEL[f] || f)
    .filter(l => !FLAVOR_DESCRIPTIONS[l]?.summary);
  assert(missing.length === 0,
    `family bars with no description: ${missing.join(", ")}`);
});

test("every palate axis explains itself", () => {
  const missing = PALATE_AXES.filter(a => !EFFECT_DESCRIPTIONS[a]?.summary);
  assert(missing.length === 0, `palate axes with no description: ${missing.join(", ")}`);
});

test("every mood explains itself — by label, token AND family key", () => {
  // ALL THREE, because the strips don't agree on which they draw. The
  // Mind and Body strips render family KEYS (`heat`, `cool`, `sleep`),
  // the flavor strip renders labels, and Detailed rows render tokens.
  // Checking labels alone is what let `heat` go mute: the key had no
  // entry, the label did, and the guard was looking at the label.
  const missing = [];
  for (const f of MOOD_VOCABULARY) {
    for (const key of [f.label, f.family, ...f.leaves.map(l => l.token)]) {
      if (!EFFECT_DESCRIPTIONS[key]?.summary) missing.push(`${f.family} -> "${key}"`);
    }
  }
  assert(missing.length === 0,
    `these render somewhere and open nothing:\n  ${missing.join("\n  ")}`);
});

test("every recorded gap is still a real, reachable word", () => {
  // A stale entry quietly excuses a word that no longer exists, and
  // would excuse a NEW word that happened to reuse the name.
  for (const token of Object.keys(NO_DESCRIPTION_YET)) {
    assert(token in FAMILY_BY_FLAVOR,
      `NO_DESCRIPTION_YET names "${token}", which is no longer a flavor — delete it`);
    assert(USED.has(token),
      `NO_DESCRIPTION_YET names "${token}", which no profile uses any more — delete it`);
    assert(!FLAVOR_DESCRIPTIONS[token]?.summary,
      `"${token}" HAS a description now — delete its NO_DESCRIPTION_YET entry so the `
      + `guard covers it properly`);
  }
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

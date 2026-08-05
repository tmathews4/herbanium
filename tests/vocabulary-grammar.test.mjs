/* ──────────────────────────────────────────────────────────────
   tests/vocabulary-grammar.test.mjs

   Every strip in the app is a list of words in a column, and a
   column of words reads as a set. When one entry is a different
   part of speech from its neighbours it stops reading as a member
   and starts reading as a mistake — `bitterness, sweetness,
   astringency, tartness, menthol` has one word that plainly isn't
   the same kind of thing as the other four.

   So each register gets a grammatical form, and NEW WORDS MUST
   MATCH IT. That's the point of this file: not to relitigate the
   vocabulary that exists, but to stop the next addition drifting.

     palate axes      abstract sensation nouns  -ness / -ency / -ity
     flavour families single-word adjectives    fruity, floral, smoky
     mood families    UNDECIDED — baseline-locked, see below

   THE MOOD REGISTER HAS NO RULE YET, and that is the honest state
   rather than an oversight. Audited across all twelve:

     nouns        focus, energy, comfort, heat
     participles  soothing, grounding, uplifting, cooling
     adjectives   calm, sleepy, digestive, immune

   Four, four and four. There is no dominant form to enforce, and
   the split doesn't track mind/body either — both categories carry
   all three. Choosing one means renaming tokens that are cited by
   research docs, matched by the audit tools, and written into
   users' saved journals, so it is a decision, not a tidy-up.

   Until that decision is made the mood set is LOCKED to a snapshot.
   Adding a mood fails this test on purpose, with a message pointing
   at the choice — which is exactly when the question should be
   asked, rather than after a thirteenth word has quietly picked a
   fourth form.

   Run: node tests/vocabulary-grammar.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import {
  FAMILY_BY_FLAVOR, FLAVOR_FAMILY_LABEL, MOOD_VOCABULARY,
} from "../src/data/families.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Vocabulary grammar — one part of speech per strip\n");

/* ── Palate ──────────────────────────────────────────────────── */

const composeSrc = readFileSync(resolve(__dirname, "../src/algo/compose.js"), "utf8");
const PALATE_AXES = [...(composeSrc.match(/const BALANCE_AXES = \[([\s\S]*?)\];/)?.[1] || "")
  .matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

// Recorded decisions, with their reason — not an exemption list. An
// entry that stops matching gets reported again, which is correct if
// the intent changes.
const PALATE_EXCEPTIONS = {
  menthol:
    "Names the compound rather than the sensation, deliberately. The "
    + "sensation word is `coolness`, which normalises to the same stem as "
    + "the `cooling` MOOD — and those are two different claims the app "
    + "works hard to keep apart (mouthfeel via TRPM8 vs felt temperature). "
    + "Given a choice between breaking the grammar and reintroducing the "
    + "collision, the grammar loses.",
};

test("the palate axes were found", () => {
  assert(PALATE_AXES.length >= 4, `parsed ${PALATE_AXES.length} — the regex has drifted`);
});

test("every palate axis is an abstract sensation noun", () => {
  const bad = PALATE_AXES
    .filter(a => !/(ness|ency|ancy|ity)$/.test(a))
    .filter(a => !(a in PALATE_EXCEPTIONS));
  assert(bad.length === 0,
    `palate axes should read as sensations (-ness/-ency/-ity): ${bad.join(", ")}`);
});

/* ── Flavour families ────────────────────────────────────────── */

const FLAVOUR_EXCEPTIONS = {
  "sweet aroma":
    "The only two-word label, and the qualifier IS the fix. Bare `sweet` "
    + "collided with the palate axis `sweetness` — same words, two strips, "
    + "no way for a reader to tell the claims apart. Sensory analysis calls "
    + "this cluster `sweet aromatics` precisely to hold it apart from the "
    + "basic taste. See tests/register-collision.test.mjs.",
  off:
    "A diagnostic bucket, not a flavour a drinker would name. Its members "
    + "(bitter, astringent, tannic...) are stripped from the flavour strip "
    + "by EXCLUDED_FROM_FLAVOR, so the label is effectively internal.",
};

const shownFlavourFamilies = [...new Set(Object.values(FAMILY_BY_FLAVOR))]
  .map(f => FLAVOR_FAMILY_LABEL[f] || f);

test("every flavour family reads as a single-word adjective", () => {
  const bad = shownFlavourFamilies
    .filter(l => !(l in FLAVOUR_EXCEPTIONS))
    .filter(l => l.includes(" ") || !/^[a-z]+$/.test(l));
  assert(bad.length === 0,
    `flavour families should be one adjective (fruity, floral, smoky): ${bad.join(", ")}`);
});

test("every recorded exception still applies", () => {
  // A stale reason is worse than none — it silently widens the rule.
  for (const label of Object.keys(FLAVOUR_EXCEPTIONS)) {
    assert(shownFlavourFamilies.includes(label),
      `FLAVOUR_EXCEPTIONS excuses "${label}", which is no longer a family label — delete it`);
  }
  for (const axis of Object.keys(PALATE_EXCEPTIONS)) {
    assert(PALATE_AXES.includes(axis),
      `PALATE_EXCEPTIONS excuses "${axis}", which is no longer an axis — delete it`);
  }
});

/* ── Moods — locked pending a decision ───────────────────────── */

// The snapshot. Sorted so the diff on a failure reads cleanly.
const MOOD_BASELINE = [
  "calm", "comfort", "cooling", "digestive", "energy", "focus",
  "grounding", "heat", "immune", "sleepy", "soothing", "uplifting",
].sort();

test("the mood register hasn't grown a thirteenth form", () => {
  const now = MOOD_VOCABULARY.map(f => f.label).sort();
  const added = now.filter(l => !MOOD_BASELINE.includes(l));
  const removed = MOOD_BASELINE.filter(l => !now.includes(l));
  assert(added.length === 0 && removed.length === 0,
    `the mood vocabulary changed (added: ${added.join(", ") || "none"}; `
    + `removed: ${removed.join(", ") || "none"}).\n`
    + `    The mood register currently mixes THREE parts of speech — nouns\n`
    + `    (focus, energy, comfort, heat), participles (soothing, grounding,\n`
    + `    uplifting, cooling) and adjectives (calm, sleepy, digestive,\n`
    + `    immune) — so there is no form for a new word to match.\n`
    + `    Decide the register's form before adding to it, then update this\n`
    + `    baseline. That decision is the point of this failure.`);
});

test("a mood family's label and its leaf agree in form", () => {
  // `heat` (noun) whose only leaf is `warming` (participle) is the one
  // place a single concept changes part of speech between the family bar
  // and the row underneath it — the two are stacked, so the mismatch is
  // visible in one glance.
  const KNOWN = { heat: "warming" };
  const mismatched = [];
  for (const f of MOOD_VOCABULARY) {
    if (f.leaves.length !== 1) continue;          // multi-leaf families needn't echo
    const leaf = f.leaves[0].token;
    if (leaf === f.label) continue;
    if (KNOWN[f.family] === leaf) continue;       // recorded below, not blessed
    mismatched.push(`${f.label} -> ${leaf}`);
  }
  assert(mismatched.length === 0,
    `family label and its single leaf disagree: ${mismatched.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

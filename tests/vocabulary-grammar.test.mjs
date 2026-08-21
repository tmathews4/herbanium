/* ──────────────────────────────────────────────────────────────
   tests/vocabulary-grammar.test.mjs

   Every strip in the app is a list of words in a column, and a
   column of words reads as a set. When one entry is a different
   part of speech from its neighbors it stops reading as a member
   and starts reading as a mistake — `bitterness, sweetness,
   astringency, tartness, menthol` has one word that plainly isn't
   the same kind of thing as the other four.

   So each register gets a grammatical form, and NEW WORDS MUST
   MATCH IT. That's the point of this file: not to relitigate the
   vocabulary that exists, but to stop the next addition drifting.

     palate axes      abstract sensation nouns  -ness / -ency / -ity
     flavor families single-word adjectives    fruity, floral, smoky
     mood families    nouns — the STATE, not the adjective

   THE MOOD REGISTER USED TO MIX THREE FORMS, four words each:
   nouns (focus, energy, comfort, heat), participles (soothing,
   grounding, uplifting, cooling), adjectives (calm, sleepy,
   digestive, immune). The split didn't track mind/body either —
   both categories carried all three — so it was drift, not signal.

   Settled on nouns: the strip answers "what does this cup give
   you", and a list of states answers that where a list of
   adjectives describes the cup instead. Gerunds count and stay
   (soothing, grounding, uplifting, cooling, warming are all nouns
   in this use), which is why only four words moved:

     digestive -> digestion    immune -> immunity
     sleepy    -> sleep        heat   -> warming

   DISPLAY LABELS ONLY. `label` is separate from the family key and
   from the leaf `token`, so nothing changed in the research docs,
   the audit tools, extraction profiles, or anyone's saved journal.
   The earlier version of this comment claimed the opposite and was
   wrong; it's what made the decision look expensive.

   Each leaf's display label moved with its family, and that part
   is load-bearing rather than tidiness. Detail mode suppresses a
   leaf row whose label equals its family's — the value is already
   in the parent — so leaving `digestive` under a family relabelled
   `digestion` would have drawn the same effect twice, once per
   level. Descriptions are keyed by display label too, so three of
   the four would otherwise have opened an empty info panel.

   The set stays LOCKED. A thirteenth mood fails this test on
   purpose: it should be named in the register above, and the
   failure is where that gets noticed.

   Run: node tests/vocabulary-grammar.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import {
  FAMILY_BY_FLAVOR, FLAVOR_FAMILY_LABEL, MOOD_VOCABULARY,
  MOOD_LEAF_LABEL, MOOD_DESCRIPTIONS,
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
    + "sensation word is `coolness`, which normalizes to the same stem as "
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

/* ── Flavor families ────────────────────────────────────────── */

const FLAVOUR_EXCEPTIONS = {
  "sweet aroma":
    "The only two-word label, and the qualifier IS the fix. Bare `sweet` "
    + "collided with the palate axis `sweetness` — same words, two strips, "
    + "no way for a reader to tell the claims apart. Sensory analysis calls "
    + "this cluster `sweet aromatics` precisely to hold it apart from the "
    + "basic taste. See tests/register-collision.test.mjs.",
  off:
    "A diagnostic bucket, not a flavor a drinker would name. Its members "
    + "(bitter, astringent, tannic...) are stripped from the flavor strip "
    + "by EXCLUDED_FROM_FLAVOR, so the label is effectively internal.",
};

const shownFlavorFamilies = [...new Set(Object.values(FAMILY_BY_FLAVOR))]
  .map(f => FLAVOR_FAMILY_LABEL[f] || f);

test("every flavor family reads as a single-word adjective", () => {
  const bad = shownFlavorFamilies
    .filter(l => !(l in FLAVOUR_EXCEPTIONS))
    .filter(l => l.includes(" ") || !/^[a-z]+$/.test(l));
  assert(bad.length === 0,
    `flavor families should be one adjective (fruity, floral, smoky): ${bad.join(", ")}`);
});

test("every recorded exception still applies", () => {
  // A stale reason is worse than none — it silently widens the rule.
  for (const label of Object.keys(FLAVOUR_EXCEPTIONS)) {
    assert(shownFlavorFamilies.includes(label),
      `FLAVOUR_EXCEPTIONS excuses "${label}", which is no longer a family label — delete it`);
  }
  for (const axis of Object.keys(PALATE_EXCEPTIONS)) {
    assert(PALATE_AXES.includes(axis),
      `PALATE_EXCEPTIONS excuses "${axis}", which is no longer an axis — delete it`);
  }
});

/* ── Moods — nouns, and the set is locked ────────────────────── */

// The snapshot. Sorted so the diff on a failure reads cleanly.
const MOOD_BASELINE = [
  "calm", "comfort", "cooling", "digestion", "energy", "focus",
  "grounding", "immunity", "sleep", "soothing", "uplifting", "warming",
].sort();

test("the mood register hasn't grown a thirteenth word", () => {
  const now = MOOD_VOCABULARY.map(f => f.label).sort();
  const added = now.filter(l => !MOOD_BASELINE.includes(l));
  const removed = MOOD_BASELINE.filter(l => !now.includes(l));
  assert(added.length === 0 && removed.length === 0,
    `the mood vocabulary changed (added: ${added.join(", ") || "none"}; `
    + `removed: ${removed.join(", ") || "none"}).\n`
    + `    The register is NOUNS — the state the cup leaves you in, not an\n`
    + `    adjective describing the cup. Gerunds count (soothing, warming).\n`
    + `    So: "digestion" not "digestive", "sleep" not "sleepy".\n`
    + `    Add the word here once it's named that way — and give its LEAF\n`
    + `    the same display label, or Detail mode draws the effect twice.`);
});

test("every mood family's leaf shows the family's own label", () => {
  // Not cosmetic. Detail mode suppresses a leaf row whose label matches
  // its family's, because the parent already aggregates it. A leaf left
  // behind when its family is relabelled stops matching, the suppression
  // lapses, and one effect draws two rows at two levels under two names.
  // All four relabelled families would have done exactly that.
  const mismatched = [];
  for (const f of MOOD_VOCABULARY) {
    if (f.leaves.length !== 1) continue;   // multi-leaf families are a different shape
    const shown = MOOD_LEAF_LABEL[f.leaves[0].token] || f.leaves[0].token;
    if (shown !== f.label) mismatched.push(`${f.label} would draw a second row reading "${shown}"`);
  }
  assert(mismatched.length === 0, mismatched.join("; "));
});

test("every mood label resolves to a description", () => {
  // Descriptions are keyed by DISPLAY label, so relabelling a family
  // without carrying its description across opens an empty info panel.
  // Three of the four did before their leaf labels were moved too.
  const missing = MOOD_VOCABULARY
    .filter(f => !MOOD_DESCRIPTIONS[f.label]?.summary)
    .map(f => f.label);
  assert(missing.length === 0,
    `these would open an empty info panel: ${missing.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

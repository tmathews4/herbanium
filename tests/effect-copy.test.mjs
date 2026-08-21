/* ──────────────────────────────────────────────────────────────
   tests/effect-copy.test.mjs — the words under an effect bar.

   Every effect carries a one-line `summary` — the thing a reader gets
   when they tap a bar, before any of the chemistry. It is the shortest
   and most-read copy in the app, and until this audit nobody had
   checked it as a set. Three of twelve were wrong, each differently:

     cooling   "The settling-down REGISTER opposite warming" — `register`
               is this codebase's own term of art, used a dozen times a
               day in comments and audits. In a science paragraph it
               reads as ordinary English; as a category noun in a
               one-line gloss it is internal vocabulary shipped to a
               user.

     sleep     "Sedating, drowsiness-adjacent." Clinical hedging, where
               every neighbouring summary paints something: "a slow
               exhale", "a wrapped-blanket ease".

     grounding "Settling, centering, EARTHY." A bare adjective list, and
               `earthy` is a FLAVOR FAMILY in this app — a word the
               reader may have just picked on the onboarding flavor
               step. An effect described in a taste word invites exactly
               the confusion the flavor/palate guard was written to
               prevent, one register over.

   That last one is why this file exists next to
   register-collision.test.mjs rather than inside it. That guard covers
   the LABELS on two strips drawn together. This covers the PROSE, which
   is a different surface and was uncovered.
   ────────────────────────────────────────────────────────────── */

import { MOOD_VOCABULARY } from "../src/data/families.js";
import { PARENT_FLAVORS } from "../src/data/canon.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const leaves = MOOD_VOCABULARY.flatMap(f =>
  f.leaves.map(l => ({ ...l, name: l.label || l.token })));

test("every effect has a summary", () => {
  for (const l of leaves) {
    assert(typeof l.summary === "string" && l.summary.trim().length > 0,
      `${l.name} has no summary — the bar would open onto nothing`);
  }
});

test("no summary ships our own vocabulary to the reader", () => {
  /* Deliberately narrow. `register` is checked in SUMMARIES only: the
     science bodies use it as ordinary English ("holds the top of this
     register") and that reads fine in a paragraph. It is the one-line
     gloss where a term of art has nowhere to be understood from. */
  const OURS = /\b(register|axis|axes)\b/i;
  for (const l of leaves) {
    const hit = l.summary.match(OURS);
    assert(!hit,
      `${l.name}'s summary uses "${hit?.[0]}", which is our word and not the reader's: ` +
      `"${l.summary}"`);
  }
});

test("no summary describes an effect in a flavor word", () => {
  /* The onboarding flavor step offers Earthy, Fresh, Sweet and the
     rest as tastes. An effect whose summary calls itself earthy is
     asking the reader to hold one word in two registers, which is the
     confusion register-collision.test.mjs exists to prevent on the two
     strips. Same rule, different surface. */
  const flavorWords = PARENT_FLAVORS.map(f => f.label.toLowerCase());
  for (const l of leaves) {
    for (const w of flavorWords) {
      const asWord = new RegExp(`\\b${w}\\b`, "i");
      assert(!asWord.test(l.summary),
        `${l.name}'s summary calls it "${w}", which is a flavor family: "${l.summary}"`);
    }
  }
});

test("a summary says something, rather than listing adjectives", () => {
  /* "Settling, centering, earthy." was three words and no claim.
     
     The first version of this test asked for a verb or an em-dash, and
     failed `focus` — "Meditative clarity. Alert without jitter." — which
     has neither and is one of the sharpest lines in the set. The
     heuristic was proxying for the wrong thing, so it got narrowed to
     the shape actually complained of: three or more comma-separated
     SINGLE WORDS, which is a list of adjectives and not a description.
     A summary with any phrase in it passes, because a phrase is already
     doing more than naming. */
  for (const l of leaves) {
    const parts = l.summary.replace(/[.!]$/, "").split(",").map(x => x.trim());
    const isBareList = parts.length >= 3 && parts.every(x => /^\w+$/.test(x));
    assert(!isBareList,
      `${l.name}'s summary is a list of adjectives — say what it does: "${l.summary}"`);
  }
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

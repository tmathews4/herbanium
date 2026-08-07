/* ──────────────────────────────────────────────────────────────
   tests/draw-vocabulary.test.mjs — what onboarding may ask you to want.

   Step 3 asks "What pulls you to a cup?", so every option has to
   complete "I want ___". Two ways that breaks, and both had shipped:

   WORDS YOU CAN'T FEEL. `immune` was offered as an answer, while our
   own research says the opposite in two places — families.js calls
   immunity "slower and less felt than any other effect here", and
   canon.js says "you cannot notice your own immune response over a cup
   at all". A felt question was inviting a report nobody can make, and
   landing a health claim one word wide on the first screen of the app.

   WORDS IN THE WRONG GRAMMATICAL ROLE. The canon's labels serve the
   journal too, where the same value is an OUTCOME — "where it left me:
   Grounded". As a pull, "Grounded" and "Sleepy" are wrong in a way
   that reads as the opposite of the intent: "Sleepy" names the state
   you are already in, not the one you're reaching for.

   The first is enforced structurally, because a hand-kept exclusion is
   the shape canon.js already regretted once ("grown an entry at a time
   as each new body word was added and someone noticed it reading
   strangely in a picker"). The second is enforced by list, because
   grammar isn't derivable — but the list is short and the failure is
   loud.
   ────────────────────────────────────────────────────────────── */

import { PARENT_MOODS, DRAW_PARENT_MOODS, JOURNAL_PARENT_MOODS } from "../src/data/canon.js";
import { PERCEPTIBLE_EFFECT, CATEGORY_OF_EFFECT } from "../src/data/families.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

test("onboarding never offers a word for something you can't feel", () => {
  for (const m of DRAW_PARENT_MOODS) {
    assert(PERCEPTIBLE_EFFECT[m.key] !== false,
      `${m.key} is declared imperceptible but is offered as a thing to want`);
  }
});

test("the exclusion is real — something is actually held back", () => {
  /* Guards the wiring. If `perceptible` were dropped from families.js,
     or the derivation silently returned everything, every assertion
     above would still pass and the rule would be gone. */
  assert(DRAW_PARENT_MOODS.length < PARENT_MOODS.length,
    "the draw list matches the full canon — nothing is being excluded");
  const held = PARENT_MOODS.filter(m => !DRAW_PARENT_MOODS.some(d => d.key === m.key));
  assert(held.every(m => PERCEPTIBLE_EFFECT[m.key] === false),
    `held back for a reason other than perceptibility: ${held.map(m => m.key).join(", ")}`);
});

test("a body register you CAN feel is still offered", () => {
  /* The journal drops every body word, because you don't reflect on
     digestion afterwards. Onboarding must not copy that cut: wanting
     something cooling, or something settling after a meal, is an
     ordinary reason to put the kettle on. If this ever fails, the two
     rules have been collapsed into one. */
  for (const key of ["digestive", "cooling"]) {
    assert(CATEGORY_OF_EFFECT[key] === "body", `${key} is no longer a body register`);
    assert(DRAW_PARENT_MOODS.some(m => m.key === key),
      `${key} is a felt body register and should still be offerable as a pull`);
    assert(!JOURNAL_PARENT_MOODS.some(m => m.key === key),
      `${key} should still be out of the journal's pool`);
  }
});

test("no option answers the question in the wrong grammatical role", () => {
  /* These are the canon labels that describe an OUTCOME rather than a
     pull. They're correct in the journal and wrong here, so onboarding
     overrides them. This fails if an override is dropped, or if a new
     canon label arrives in the same shape.

     Checked against the labels onboarding actually renders, which is
     why the map is duplicated from the screen rather than imported —
     importing it would let both drift together and still pass. */
  const WRONG_AS_A_PULL = new Set(["Sleepy", "Grounded", "Soothing", "Uplifting", "Digestive"]);
  const rendered = new Set(DRAW_LABELS_AS_RENDERED());
  for (const bad of WRONG_AS_A_PULL) {
    assert(!rendered.has(bad),
      `"${bad}" is offered as an answer to "what pulls you to a cup?" — ` +
      "it names an outcome or a state, not something you want");
  }
});

/* Mirrors OnboardingScreen's DRAW_LABELS override. Deliberately a copy:
   if this imported the screen's map, renaming a label there would
   change both sides at once and the test would agree with whatever it
   found. */
function DRAW_LABELS_AS_RENDERED() {
  const OVERRIDES = {
    soothing: "Ease", grounding: "Grounding", uplifting: "Brightness",
    digestive: "Digestion", sleepy: "Sleep",
  };
  return DRAW_PARENT_MOODS.map(m => OVERRIDES[m.key] || m.label);
}

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

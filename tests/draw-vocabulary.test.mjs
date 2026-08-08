/* ──────────────────────────────────────────────────────────────
   tests/draw-vocabulary.test.mjs — what onboarding may ask you to want.

   Step 3 asks "What pulls you to a cup?". Three separate things have
   to be true of the answers, and all three had shipped broken.

   1. WORDS YOU CAN'T FEEL. `immune` was offered, while our own research
      says the opposite in two places — families.js calls immunity
      "slower and less felt than any other effect here", and canon.js
      says "you cannot notice your own immune response over a cup at
      all". A felt question was inviting a report nobody can make, and
      landing a health claim one word wide on the first screen.

   2. WORDS IN THE WRONG GRAMMATICAL ROLE. The canon's labels serve the
      journal too, where the same value is an OUTCOME: "where it left
      me: Grounded". As a pull, "Grounded" and "Sleepy" are wrong —
      "Sleepy" names the state you're already in rather than the one
      you're reaching for, which is the opposite of the intent.

   3. DISTINCTIONS A STRANGER CAN'T MAKE. The canon separates calm,
      soothing and grounding, and energy from uplifting, correctly — but
      on the third screen a person has ever seen, "Calm" and "Ease" are
      the same question. Someone choosing between them is guessing, and
      a guess is worse signal than a coarse answer. The cards are
      clusters now, and a pick records the whole cluster.

   (1) is enforced structurally, because canon.js already regretted a
   hand-kept exclusion once — its mind/body split "grown an entry at a
   time as each new body word was added and someone noticed it reading
   strangely in a picker". (2) and (3) are editorial and can't be
   derived, so what's checked is that the collapse stays a partition and
   that no excluded word creeps back in through a cluster.
   ────────────────────────────────────────────────────────────── */

import {
  PARENT_MOODS, DRAW_PARENT_MOODS, JOURNAL_PARENT_MOODS,
  JOURNAL_CURRENT_MOOD_CHIPS, CURRENT_MOOD_CHIPS,
  PERCEPTIBLE_MOOD_KEYS, expandDraw, feltChips,
} from "../src/data/canon.js";
import { PERCEPTIBLE_EFFECT, CATEGORY_OF_EFFECT } from "../src/data/families.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const covered = () => new Set(DRAW_PARENT_MOODS.flatMap(c => c.covers));

test("no card offers a word for something you can't feel", () => {
  for (const c of DRAW_PARENT_MOODS) {
    for (const k of c.covers) {
      assert(PERCEPTIBLE_EFFECT[k] !== false,
        `card "${c.label}" covers ${k}, which is declared imperceptible`);
    }
  }
});

test("immune specifically is not offered", () => {
  /* Named, because it is the case that shipped. Two assertions rather
     than one: the second alone would still pass if someone deleted the
     `perceptible` flag, which is the change that would quietly make the
     exclusion baseless. */
  assert(PERCEPTIBLE_EFFECT.immune === false,
    "immune is no longer declared imperceptible — the exclusion has no basis now");
  assert(!covered().has("immune"), "immune is back on the onboarding step");
});

test("the exclusion is real, and only perceptibility does the excluding", () => {
  const held = PARENT_MOODS.filter(m => !covered().has(m.key));
  assert(held.length > 0, "every canon mood is offered — nothing is being excluded");
  assert(held.every(m => PERCEPTIBLE_EFFECT[m.key] === false),
    `held back for a reason other than perceptibility: ${held.map(m => m.key).join(", ")}`);
});

test("a body register you CAN feel is still offered", () => {
  /* The journal drops every body word, because you don't reflect on
     digestion afterwards. Onboarding must not copy that cut: wanting
     something cooling, or something settling after a meal, is an
     ordinary reason to put the kettle on. If this fails, the two rules
     have been collapsed into one. */
  for (const key of ["digestive", "cooling"]) {
    assert(CATEGORY_OF_EFFECT[key] === "body", `${key} is no longer a body register`);
    assert(covered().has(key),
      `${key} is a felt body register and should still be offerable as a pull`);
    assert(!JOURNAL_PARENT_MOODS.some(m => m.key === key),
      `${key} should still be out of the journal's pool`);
  }
});

test("no card answers the question in the wrong grammatical role", () => {
  const WRONG_AS_A_PULL = new Set(["Sleepy", "Grounded", "Soothing", "Uplifting", "Digestive"]);
  for (const c of DRAW_PARENT_MOODS) {
    assert(!WRONG_AS_A_PULL.has(c.label),
      `"${c.label}" is offered as an answer to "what pulls you to a cup?" — ` +
      "it names an outcome or a state, not something you want");
  }
});

test("every perceptible family is covered by exactly one card", () => {
  /* The clusters only work if the collapse is a partition. A family in
     no cluster is a register the recommender can never be told about;
     a family in two makes one tap mean two things. */
  const seen = new Map();
  for (const c of DRAW_PARENT_MOODS) {
    for (const k of c.covers) {
      assert(!seen.has(k), `${k} is covered by both ${seen.get(k)} and ${c.key}`);
      seen.set(k, c.key);
    }
  }
  for (const k of PERCEPTIBLE_MOOD_KEYS) {
    assert(seen.has(k), `${k} is a perceptible family that no card covers`);
  }
});

test("the collapse is real, and a pick expands to what it stood for", () => {
  assert(DRAW_PARENT_MOODS.length < PERCEPTIBLE_MOOD_KEYS.length,
    "the cards match the families one-to-one — nothing was collapsed");
  const calm = expandDraw(["calm"]);
  assert(calm.length > 1,
    `picking Calm stored only ${JSON.stringify(calm)} — the cluster didn't expand`);
  assert(calm.includes("calm") && calm.includes("soothing"),
    `Calm should stand for the settling register, got ${JSON.stringify(calm)}`);
  assert(expandDraw([]).length === 0, "an empty pick should expand to nothing");
  assert(expandDraw(["nonsense"]).length === 0, "an unknown card should expand to nothing");
});

/* ── the felt register ──────────────────────────────────────────
   Three grammatical roles, one canon. The cup DOES it (an uplifting
   blend — the filter and the effect bars), you WANT it (the draw
   cards), you FELT it (every question the journal and the steep ask).
   The third had no labels of its own, so the journal read "Right now I
   feel… Energy" and "Where it left me: Comfort".
   ────────────────────────────────────────────────────────────── */

test("felt questions use predicate adjectives, not nouns", () => {
  /* The test is what can follow "I feel ___" and "it left me ___".
     These five are the nouns and attributives that were showing up
     there; each has a felt form now. */
  const NOT_A_FELT_STATE = new Set(["Focus", "Energy", "Uplifting", "Comfort", "Soothing"]);
  for (const list of [JOURNAL_PARENT_MOODS, JOURNAL_CURRENT_MOOD_CHIPS, CURRENT_MOOD_CHIPS]) {
    for (const c of feltChips(list)) {
      assert(!NOT_A_FELT_STATE.has(c.label),
        `"${c.label}" answers "right now I feel…" — it names what a cup does, not a state`);
    }
  }
});

test("the felt re-label changes labels and nothing else", () => {
  /* Keys are what get persisted in journal entries; only the wording
     may differ. If this ever fails, a re-label has quietly become a
     data migration. */
  const before = JOURNAL_PARENT_MOODS;
  const after = feltChips(before);
  assert(after.length === before.length, "feltChips changed the number of options");
  before.forEach((c, i) => {
    assert(after[i].key === c.key, `feltChips moved ${c.key} to ${after[i].key}`);
    assert(after[i].family === c.family, `feltChips changed ${c.key}'s family`);
  });
});

test("the words already in the felt register are left alone", () => {
  // Calm, Grounded and Sleepy are predicate adjectives already, which
  // is why the old labels read fine often enough to survive this long.
  const felt = new Map(feltChips(PARENT_MOODS).map(c => [c.key, c.label]));
  for (const key of ["calm", "sleepy"]) {
    const canon = PARENT_MOODS.find(m => m.key === key);
    assert(felt.get(key) === canon.label,
      `${key} was re-labelled to "${felt.get(key)}" but "${canon.label}" was already right`);
  }
});

test("the cup's own register is untouched", () => {
  /* The filter and the effect bars describe the BLEND — "an uplifting
     tea" — and the canon labels are written for exactly that. If the
     felt labels ever leak into PARENT_MOODS, the filter starts
     offering "Lifted" as a property of a herb. */
  const canonLabels = PARENT_MOODS.map(m => m.label);
  assert(canonLabels.includes("Uplifting") && canonLabels.includes("Soothing"),
    "the canon's attributive labels have been overwritten with felt ones");
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

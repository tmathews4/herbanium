/* ──────────────────────────────────────────────────────────────
   tests/crystal-naming.test.mjs — the lodestone can't be called
   "undefined".

   REPORTED: "A Jade and undefined Swirling Crystal".

   The crystal takes one colour word from each of its two winning axes,
   looked up by FAMILY. Both maps had drifted from the families they
   key on:

     EFFECT_ADJECTIVES carried `warm` and `body`. Neither is a family.
     `heat` is (its label is "warming"), and `body` predates the body
     register being split into comfort, digestive and immune. Four
     families with no colour.

     FLAVOR_ADJECTIVES carried `body` where the family is `mouthfeel`.

   So any cup whose winning axis landed on one of those five named
   itself with an `undefined` in the middle. The description path had a
   `|| "Quiet"` fallback for exactly this case; the name path did not,
   so the defence existed and covered the quieter of the two strings.

   THE FIX IS THE TEST, not the fallback. A default hides the next gap
   the same way the description's default hid this one — the app would
   have gone on saying "A Quiet and Jade Crystal" and nobody would have
   filed anything. So the maps are held exhaustive here, and the
   fallback is kept only as belt-and-braces on the most visible string
   in the app.

   Also checks the two maps don't share a word. `vegetal` was "Jade" and
   so is `soothing`, and a crystal draws one colour from each axis —
   which meant a soothing, vegetal cup could be "A Jade and Jade
   Swirling Crystal". The euphony pass cannot save that: it rejects the
   root echo, tries the swap, gets the identical pair back, and accepts
   it.
   ────────────────────────────────────────────────────────────── */

import { readFileSync } from "node:fs";
import { MOOD_VOCABULARY, FAMILY_BY_FLAVOR } from "../src/data/families.js";

/* Read the maps out of the source rather than importing moodCrystal.js,
   which pulls in a .jsx module node can't load. Brittle in a way that
   is acceptable for a data-shape guard: if the parse ever finds nothing
   the test fails loudly rather than passing on an empty set. */
const SRC = readFileSync(new URL("../src/data/moodCrystal.js", import.meta.url), "utf8");
function parseMap(name) {
  const m = SRC.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`));
  if (!m) return null;
  const out = {};
  for (const line of m[1].split("\n")) {
    const hit = line.match(/^\s*["']?([a-zA-Z-]+)["']?\s*:\s*"([^"]+)"/);
    if (hit) out[hit[1]] = hit[2];
  }
  return out;
}

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const EFFECT = parseMap("EFFECT_ADJECTIVES");
const FLAVOR = parseMap("FLAVOR_ADJECTIVES");
/* The colour map had the identical drift and was missed by the first
   fix, because it sits forty lines from the adjectives and looks
   nothing like them. Guarded here so the pair can't diverge again. */
const COLORS = parseMap("CRYSTAL_EFFECT_COLORS");

test("the colour maps are readable at all", () => {
  assert(EFFECT && Object.keys(EFFECT).length >= 8,
    "couldn't parse EFFECT_ADJECTIVES — this guard is asleep, fix the parser");
  assert(FLAVOR && Object.keys(FLAVOR).length >= 8,
    "couldn't parse FLAVOR_ADJECTIVES — this guard is asleep, fix the parser");
});

test("every effect family has a render colour too", () => {
  for (const f of MOOD_VOCABULARY) {
    assert(COLORS[f.family],
      `effect family "${f.family}" has no CRYSTAL_EFFECT_COLORS entry — ` +
      `the crystal would render with an undefined fill`);
  }
  for (const key of Object.keys(COLORS)) {
    assert(MOOD_VOCABULARY.some(f => f.family === key),
      `CRYSTAL_EFFECT_COLORS has "${key}", which is not an effect family`);
  }
});

test("every effect family has a colour word", () => {
  for (const f of MOOD_VOCABULARY) {
    assert(EFFECT[f.family],
      `effect family "${f.family}" has no colour — a crystal winning on it ` +
      `would be named "A ... and undefined ... Crystal"`);
  }
});

test("every flavour family a crystal can land on has a colour word", () => {
  /* `off` is the exception and it is excluded at the source rather than
     here. It collects bitter, astringent, tannic, harsh, acrid, soapy,
     muddy, medicinal, pith and sharp — the words for a cup that went
     wrong. FlavorMap already strips them from the flavour strip so a
     reader doesn't file them as tastes, and a crystal is a portrait of
     what you reach for: "you mostly brew things astringent" is a
     brewing note, not an identity.

     This guard found it. The first version asserted every family had a
     colour, `off` failed, and the honest answer turned out to be that
     the crystal should never have been able to land there — the missing
     colour was the symptom, not the bug. */
  for (const fam of new Set(Object.values(FAMILY_BY_FLAVOR))) {
    if (fam === "off") continue;
    assert(FLAVOR[fam],
      `flavour family "${fam}" has no colour — same undefined in the name`);
  }
});

test("the defect register is excluded where the crystal is built", () => {
  // Skipping `off` above is only safe if the source really filters it.
  // Read for the filter rather than trusting the comment.
  assert(/NOT_A_PALATE/.test(SRC) && /NOT_A_PALATE\.has\(FAMILY_BY_FLAVOR\[/.test(SRC),
    "moodCrystal.js no longer filters the `off` register out of its flavour " +
    "tally — either restore the filter or give `off` a colour word");
});

test("no colour word is keyed to something that isn't a family", () => {
  /* The other half, and the half that let this rot quietly: `warm` and
     `body` sat in these maps looking like coverage while the families
     they were meant to cover went unnamed. An extra key is not
     harmless — it is a gap wearing a disguise. */
  const effectFamilies = new Set(MOOD_VOCABULARY.map(f => f.family));
  for (const key of Object.keys(EFFECT)) {
    assert(effectFamilies.has(key),
      `EFFECT_ADJECTIVES has "${key}", which is not an effect family — ` +
      `stale keys hide missing ones`);
  }
  const flavourFamilies = new Set(Object.values(FAMILY_BY_FLAVOR));
  for (const key of Object.keys(FLAVOR)) {
    assert(flavourFamilies.has(key),
      `FLAVOR_ADJECTIVES has "${key}", which is not a flavour family`);
  }
});

test("the two maps never offer the same word", () => {
  // A crystal takes one colour from each axis, so a word in both maps
  // can pair with itself: "A Jade and Jade Swirling Crystal".
  for (const [ek, ev] of Object.entries(EFFECT)) {
    for (const [fk, fv] of Object.entries(FLAVOR)) {
      assert(ev !== fv,
        `effect "${ek}" and flavour "${fk}" are both "${ev}" — a cup with ` +
        `both would name itself "${ev} and ${ev}"`);
    }
  }
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

/* ──────────────────────────────────────────────────────────────
   tests/retracted-claims.test.mjs

   A claim that was researched and found wrong must not come back.

   This exists because the pepper claim — "Roman empresses paid
   taxes in peppercorns" — shipped in THREE places at once: the
   blurb, the facts list and the steep-timer content. Correcting
   the copy fixes today. Nothing stopped a later edit reaching for
   the same nice-sounding line again, and nothing would have
   noticed if it had: no audit reads prose, and no test asserts on
   ingredient blurbs.

   The retraction is DECLARED IN THE RESEARCH DOC, next to the
   evidence that killed it:

       <!-- retracted: Roman empresses paid taxes -->

   and this test walks whatever markers exist. It holds no list of
   its own — that would be a second copy of the fact, which is the
   failure mode `e2e/tour-contract.spec.ts` was written against.
   Retracting a new claim means adding a marker beside the reason,
   in the file a future reader is already looking at. Deleting the
   marker un-guards it, deliberately.

   Match is case-insensitive and whitespace-normalised, so a
   reflowed line still trips it. Keep marker phrases SHORT and
   distinctive — the fragment that carries the error, not the whole
   sentence, because the sentence is what gets reworded.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "node:fs";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { BLENDS } from "../src/data/blends.js";
import { WAIT_FACTS, WAIT_POEMS, WAIT_PROMPTS } from "../src/data/waitContent.js";

const norm = (s) => s.replace(/\s+/g, " ").toLowerCase();

/* ── what the docs declare retracted ───────────────────────── */
const DIR = "docs/research/ingredients";
const retractions = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
  const text = readFileSync(`${DIR}/${file}`, "utf8");
  for (const m of text.matchAll(/<!--\s*retracted:\s*(.+?)\s*-->/g)) {
    retractions.push({ file, phrase: m[1] });
  }
}

/* ── every string the app shows a reader ───────────────────── */
const prose = [];
const say = (where, text) => {
  if (typeof text === "string" && text.trim()) prose.push({ where, text });
};
for (const [id, m] of Object.entries(INGREDIENTS)) {
  say(`ingredients.${id}.blurb`, m.blurb);
  (m.facts || []).forEach((f, i) => say(`ingredients.${id}.facts[${i}]`, f));
}
for (const b of BLENDS) say(`blends.${b.id}.culturalNote`, b.culturalNote);
for (const [ing, list] of Object.entries(WAIT_FACTS || {})) {
  (list || []).forEach((w, i) => say(`waitFacts.${ing}[${i}]`, w?.text));
}
for (const bank of [WAIT_POEMS, WAIT_PROMPTS]) {
  for (const [k, list] of Object.entries(bank || {})) {
    const items = Array.isArray(list) ? list : [list];
    items.forEach((w, i) => say(`wait.${k}[${i}]`, typeof w === "string" ? w : w?.text));
  }
}

/* ── the guard ─────────────────────────────────────────────── */
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("the docs declare at least one retraction", () => {
  if (!retractions.length) {
    throw new Error(
      `no <!-- retracted: ... --> markers found in ${DIR}. If every ` +
      `retraction was genuinely un-declared, this guard is inert and ` +
      `should be deleted rather than left passing vacuously.`
    );
  }
});

test("no retracted claim appears in shipped prose", () => {
  const hits = [];
  for (const { file, phrase } of retractions) {
    const needle = norm(phrase);
    for (const { where, text } of prose) {
      if (norm(text).includes(needle)) hits.push({ file, phrase, where, text });
    }
  }
  if (hits.length) {
    throw new Error(
      `${hits.length} retracted claim(s) back in shipped prose:\n` +
      hits.map((h) =>
        `  ${h.where}\n    retracted in ${h.file}: "${h.phrase}"\n` +
        `    text: ${h.text.replace(/\s+/g, " ").slice(0, 160)}`
      ).join("\n")
    );
  }
});

let pass = 0, fail = 0;
for (const [name, fn] of tests) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; console.error(`\n  FAIL ${name}\n  ${e.message}`); }
}
console.log(`\n\n  ${pass} passed, ${fail} failed`);
console.log(`  (${retractions.length} retractions declared, ${prose.length} prose items scanned)`);
if (fail) process.exit(1);

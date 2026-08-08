#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   tools/audit-vocabulary-coverage.mjs — find the maps that have
   drifted away from the vocabulary they key on.

   THE BUG CLASS, seen twice in one day:

     "A Jade and undefined Swirling Crystal" — EFFECT_ADJECTIVES was
     keyed by effect family and still carried `warm` and `body`. The
     families had become `heat`, `comfort`, `digestive` and `immune`.
     Four families with no colour, and the map looked full.

     Four dead hint flags — persisted, seeded, threaded to screens, and
     read by nothing, because the thing that read them was deleted and
     the flags weren't.

   Both are the same shape: a lookup table written against a list that
   later moved. Neither is a type error, neither throws, and both
   produce output a user sees before a developer does.

   WHAT THIS CHECKS, in both directions:

     MISSING  a canonical key with no entry. The visible half —
              undefined in a name, a blank in a strip.
     EXTRA    an entry keyed to something that is not in the vocabulary
              any more. The half that matters more, because a stale key
              is what makes a map LOOK covered. Every gap found today
              had a stale key sitting next to it.

   HOW IT FINDS THEM. Any object literal in src/ whose keys overlap a
   known vocabulary by three or more is assumed to be keyed by it.
   Three is deliberate: two is coincidence (`sweet`, `fresh` show up in
   all sorts of unrelated maps), and anything genuinely keyed by a
   vocabulary covers most of it. Maps that overlap but aren't meant to
   be exhaustive will show up as noise — say so in a comment on the map
   and move on, the same way brewIntent.js records deliberate
   departures rather than carrying an exemption list.

   Reports, never fails. Like the other audits here, the point is to be
   readable on demand rather than to gate a push.

   Run: node tools/audit-vocabulary-coverage.mjs
   ────────────────────────────────────────────────────────────── */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MOOD_VOCABULARY, FAMILY_BY_FLAVOR } from "../src/data/families.js";
import { PARENT_MOODS, PARENT_FLAVORS } from "../src/data/canon.js";

const VOCABULARIES = [
  {
    name: "effect families",
    keys: new Set(MOOD_VOCABULARY.map(f => f.family)),
    where: "src/data/families.js — MOOD_VOCABULARY[].family",
  },
  {
    /* Leaf tokens, not families. Several maps key on `sleepy`,
       `warming`, `cooling` rather than `sleep`, `heat`, `cool`, and
       that is correct — the leaf is the word the profiles carry. The
       first version of this audit didn't know the difference and
       reported every one of them as drift, which is the fastest way to
       make a report nobody reads. */
    name: "effect leaf tokens",
    keys: new Set(MOOD_VOCABULARY.flatMap(f => f.leaves.map(l => l.token))),
    where: "src/data/families.js — MOOD_VOCABULARY[].leaves[].token",
  },
  {
    name: "flavour families",
    keys: new Set(Object.values(FAMILY_BY_FLAVOR)),
    where: "src/data/families.js — FAMILY_BY_FLAVOR values",
  },
  {
    name: "parent moods",
    keys: new Set(PARENT_MOODS.map(m => m.key)),
    where: "src/data/canon.js — PARENT_MOODS[].key",
  },
  {
    /* Individual flavour WORDS — the third spelling. `bitter`, `minty`,
       `tar` and `tart` are tokens the profiles carry; they roll up into
       families, which roll up into chips. A map keyed by tokens is
       neither drifted nor exhaustive-by-nature, since no map lists all
       ~200 of them, so this vocabulary exists mainly to stop
       token-keyed maps being misread as broken family maps. */
    name: "flavour tokens",
    keys: new Set(Object.keys(FAMILY_BY_FLAVOR)),
    where: "src/data/families.js — FAMILY_BY_FLAVOR keys",
    partialByNature: true,
  },
  {
    /* Chip keys, not families: the flavour chips are `fruity` and
       `creamy` where the families are `fruit` and `mouthfeel`. Both
       spellings are load-bearing — the chip is what a user picks, the
       family is what the model groups by — so a map keyed either way is
       correct and the audit has to know both. Found by running this on
       a map written the same afternoon. */
    name: "flavour chip keys",
    keys: new Set(PARENT_FLAVORS.map(f => f.key)),
    where: "src/data/canon.js — PARENT_FLAVORS[].key",
  },
];

/* A map may be partial on purpose — FELT_LABEL lists only the words
   whose wording changes, and completing it would mean writing the same
   word twice for nine of twelve entries. The header of this file
   promises that saying so in a comment is how you record that, so it
   has to actually read the comment. Deleting the note makes the map
   report again, which is the property that keeps this honest: there is
   no exemption list to go stale. */
const DELIBERATELY_PARTIAL =
  /deliberately partial|partial on purpose|only the (words|keys|entries)|not exhaustive/i;

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) { yield* sourceFiles(path); continue; }
    if (/\.(js|jsx)$/.test(entry)) yield path;
  }
}

/* Object literals assigned to a CONST with a shouty name. Narrower than
   "every object literal" on purpose: the maps this is about are
   module-level lookup tables, and scanning every inline object turns
   the report into noise nobody reads. */
const LITERAL = /const ([A-Z][A-Z0-9_]{2,}) = \{([\s\S]*?)\n\};/g;
/* Top-level keys only — two spaces of indent, no more. Without this the
   scan walks into nested objects and, in a .jsx file, into style props:
   the first run of this audit reported `borderRadius` and `fontFamily`
   as stale vocabulary keys, which is noise that buries the three real
   findings underneath it. */
const KEY = /^ {2}["']?([a-zA-Z][a-zA-Z0-9_-]*)["']?\s*:/gm;

const findings = [];
for (const file of sourceFiles("src")) {
  const src = readFileSync(file, "utf8");
  for (const match of src.matchAll(LITERAL)) {
    const [, name, body] = match;
    const keys = [...body.matchAll(KEY)].map(m => m[1]);
    if (keys.length < 3) continue;
    // The 400 characters before the declaration — enough for the
    // comment block that usually sits directly above it.
    const preamble = src.slice(Math.max(0, match.index - 400), match.index);
    if (DELIBERATELY_PARTIAL.test(preamble)) continue;
    /* ONE VERDICT PER MAP, against its best-matching vocabulary.

       A map keyed by leaf tokens also overlaps the family list and the
       parent-mood list, so reporting every match meant MOOD_NEIGHBORS
       appeared three times — twice complaining it wasn't keyed the way
       it was never keyed. Forty-six findings became fifteen the moment
       each map was allowed one answer. */
    let best = null;
    for (const vocab of VOCABULARIES) {
      const overlap = keys.filter(k => vocab.keys.has(k));
      /* Overlap has to be substantial in BOTH directions before this
         claims a map is keyed by a vocabulary: most of the vocabulary
         present, and most of the map's keys accounted for. A map that
         merely happens to mention `sweet` and `fresh` is not a
         vocabulary table, and treating it as one is how the first run
         produced fifty findings and three of them mattered. */
      if (overlap.length < 3) continue;
      // Token vocabularies are far larger than any map that uses them,
      // so they're matched on the map's side only.
      if (!vocab.partialByNature && overlap.length / vocab.keys.size < 0.5) continue;
      if (overlap.length / keys.length < 0.5) continue;
      const missing = [...vocab.keys].filter(k => !keys.includes(k));
      const extra = keys.filter(k => !vocab.keys.has(k));
      const score = vocab.partialByNature
        ? overlap.length / keys.length    // how much of the MAP it explains
        : overlap.length / vocab.keys.size;
      if (!best || score > best.score) {
        best = {
          score, partialByNature: !!vocab.partialByNature,
          file: file.replace(/\\/g, "/"), name, vocab: vocab.name,
          covered: overlap.length, total: vocab.keys.size, missing, extra,
        };
      }
    }
    /* Judged only AFTER the best vocabulary is known. Skipping the
       healthy case inside the loop — which is where it started — meant
       a map that matched one vocabulary perfectly was passed over and
       then reported against a worse-fitting one. CRYSTAL_EFFECT_COLORS
       covers all twelve effect families exactly and was still being
       listed as an incomplete parent-mood map. */
    // A token-keyed map has nothing to be missing — the vocabulary is
    // an open list, so only its EXTRA keys (words that aren't flavours
    // at all any more) are worth saying out loud.
    if (best?.partialByNature) {
      if (best.extra.length) findings.push({ ...best, missing: [] });
    } else if (best && (best.missing.length || best.extra.length)) {
      findings.push(best);
    }
  }
}
findings.sort((a, b) => (b.missing.length + b.extra.length) - (a.missing.length + a.extra.length));

if (!findings.length) {
  console.log("Every vocabulary-keyed map in src/ covers its list exactly.");
  process.exit(0);
}

console.log(`${findings.length} map(s) out of step with the vocabulary they key on:\n`);
for (const f of findings) {
  console.log(`  ${f.file} — ${f.name}`);
  console.log(`    keyed by ${f.vocab} (${f.covered}/${f.total} covered)`);
  if (f.missing.length) console.log(`    MISSING: ${f.missing.join(", ")}`);
  if (f.extra.length)   console.log(`    EXTRA:   ${f.extra.join(", ")}  <- stale keys hide missing ones`);
  console.log("");
}
console.log("Not every hit is a bug — a map that is deliberately partial will");
console.log("show up here. Say so in a comment on the map rather than adding an");
console.log("exemption list, so removing the comment makes it report again.");

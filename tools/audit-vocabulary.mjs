/* ──────────────────────────────────────────────────────────────
   tools/audit-vocabulary.mjs

   Are any of our effect words secretly the same word?

   The `comfort` case is why this exists. It shipped on 27 ingredients
   while only 7 research docs ever prescribed it, its own description
   said "maps to the soothing effect", and no ingredient anchored it
   above 3. It was an app-invented term sitting on top of two
   researched ones — and nothing measured that, because every guard we
   had worked ingredient-by-ingredient rather than word-by-word.

   Three lenses here, because no single one is decisive:

   1. CENSUS — how many ingredients ship a token vs how many research
      docs prescribe it. A token the app uses far more than the
      research does is app-invented vocabulary. This is the number
      that would have caught comfort (27 ships / 7 docs = 3.9x) while
      every other token sat near 1.

   2. CONTAINMENT — of the ingredients carrying A, what fraction also
      carry B. High containment plus NO discriminating case means the
      data never once distinguishes the two, whatever the vocabulary
      claims. Discriminating cases are printed by name, because one
      real counterexample settles the question and a percentage never
      does.

   3. LITERATURE COUNTERPART — whether the word maps onto an
      established herbal action or TCM category. Tea's own sensory
      lexicons are no help: the Lee 2007 green-tea lexicon, the
      Chinese CTSEM method and QDA are vocabularies for FLAVOUR,
      AROMA and MOUTHFEEL. None of them name effects. Effect
      vocabulary comes from materia medica and TCM instead, and a
      word with no counterpart there is doing lay work.

   Run: node tools/audit-vocabulary.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { FAMILY_BY_EFFECT } from "../src/data/families.js";
import { DOCS } from "./lib/strength-drift.mjs";

// Where each of our words sits in established practice. A token with
// no counterpart isn't automatically wrong — but it is carrying no
// external definition, so only our own docs constrain it.
const COUNTERPART = {
  calm:      "nervine / relaxant — herbs acting on the nervous system without sedation",
  sleepy:    "sedative / hypnotic — materia medica category, distinct from nervine",
  soothing:  "demulcent (internal) / emollient (topical) — mucilage coats and protects "
             + "irritated mucous membranes; described in the literature as cooling, "
             + "soothing, healing, relaxing",
  digestive: "carminative — relieves gas and gastrointestinal spasm",
  warming:   "thermogenic; TCM warm-natured, Ayurvedic ushna virya",
  cooling:   "refrigerant; TCM cool-natured / Yin",
  energy:    "stimulant",
  focus:     "nootropic / cerebral stimulant",
  uplifting: "thymoleptic — mood-elevating",
  grounding: "no direct materia medica action; adaptogen-adjacent, largely TCM/lay",
  comfort:   null,   // no counterpart in herbal action vocabulary at all
};

const tokens = [...new Set(Object.keys(FAMILY_BY_EFFECT))];

// ── 1. Census ────────────────────────────────────────────────────
const shipsOn = Object.fromEntries(tokens.map(t => [t, new Set()]));
for (const [id, samples] of Object.entries(EXTRACTION_PROFILES)) {
  for (const s of samples) {
    for (const e of s.effects || []) {
      const n = Array.isArray(e) ? e[0] : e.name;
      if (shipsOn[n]) shipsOn[n].add(id);
    }
  }
}

const docUse = Object.fromEntries(tokens.map(t => [t, 0]));
for (const f of readdirSync(DOCS).filter(x => x.endsWith(".md"))) {
  const src = readFileSync(resolve(DOCS, f), "utf8");
  const eff = [...src.matchAll(/\|\s*effects\s*\|\s*(\[\[.*?\]\])\s*\|/g)].map(m => m[1]).join(" ");
  for (const t of tokens) if (new RegExp(`"${t}"`).test(eff)) docUse[t]++;
}

export const census = tokens.map(t => ({
  token: t,
  ships: shipsOn[t].size,
  docs: docUse[t],
  ratio: docUse[t] ? shipsOn[t].size / docUse[t] : Infinity,
})).sort((a, b) => b.ratio - a.ratio);

// A token the app asserts far more often than the research does is
// vocabulary we invented. comfort sat at 3.9 before it was cleaned up.
export const INVENTION_RATIO = 1.5;

// ── 2. Containment ───────────────────────────────────────────────
export function containment(threshold = 0.85) {
  const out = [];
  for (const a of tokens) {
    for (const b of tokens) {
      if (a === b) continue;
      const A = shipsOn[a], B = shipsOn[b];
      if (A.size < 3) continue;
      const withoutB = [...A].filter(x => !B.has(x));
      const frac = ([...A].length - withoutB.length) / A.size;
      if (frac >= threshold) out.push({ a, b, frac, discriminators: withoutB });
    }
  }
  return out.sort((x, y) => y.frac - x.frac);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("\nCENSUS — ingredients shipping a word vs docs prescribing it\n");
  console.log("  token        ships  docs   ratio");
  for (const c of census) {
    const flag = c.ratio > INVENTION_RATIO ? "   <-- app asserts it more than the research does" : "";
    console.log(`  ${c.token.padEnd(12)} ${String(c.ships).padEnd(6)} ${String(c.docs).padEnd(6)} `
      + `${c.ratio.toFixed(2)}${flag}`);
  }

  console.log("\n\nCONTAINMENT — of ingredients carrying A, how many also carry B\n");
  const hits = containment();
  if (!hits.length) console.log("  (none above threshold)");
  for (const h of hits) {
    console.log(`  ${h.a} -> ${h.b}   ${(h.frac * 100).toFixed(0)}%`);
    console.log(`      ${h.discriminators.length
      ? `distinguished by: ${h.discriminators.join(", ")}`
      : "NO DISCRIMINATING CASE — the data never once separates these two"}`);
  }

  console.log("\n\nLITERATURE COUNTERPART — established action, or none\n");
  for (const t of tokens) {
    const c = COUNTERPART[t];
    console.log(`  ${t.padEnd(11)} ${c || "** no counterpart in herbal action vocabulary **"}`);
  }
  console.log("\n  Tea's own sensory lexicons (Lee 2007 green tea, CTSEM, QDA) cover");
  console.log("  flavour, aroma and mouthfeel only — none of them name effects, so");
  console.log("  materia medica and TCM are the reference frames available.\n");
}

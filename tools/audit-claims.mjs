/* ──────────────────────────────────────────────────────────────
   tools/audit-claims.mjs — an inventory of every factual claim the
   app makes in prose, and which of them are checkable.

   Every other audit here checks EFFECTS, moods and flavours against
   the research docs. Nothing checked prose, and prose is where the
   app does most of its talking: 53 blurbs, 600+ facts, 32 cultural
   notes and 140 steep-timer facts. A blurb could assert any history
   it liked and no tool would notice.

   One did. "Roman empresses paid taxes in peppercorns" shipped in
   three places — the blurb, the facts list and the steep timer — and
   is wrong on both halves: pepper as rent and tribute is a MEDIEVAL
   European practice, and nothing ties it to empresses. Its own
   research doc had the medieval framing, correctly, all along. The
   copy had drifted from the source. It took a reader asking.

   THIS TOOL DOES NOT KNOW WHETHER ANYTHING IS TRUE. It cannot; that
   is a question for sources, not a regex. What it does is sort the
   corpus by how badly a claim would fail if it were wrong, so the
   verification effort goes where invented history actually lives:
   named people, dates, institutions, superlatives, and numbers.

   A sentence with no proper noun, no date and no number is usually
   description or chemistry that the extraction docs already cover.
   A sentence naming a monarch and a century is a checkable assertion
   about the world, and is exactly the shape the pepper claim had.
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import { BLENDS } from "../src/data/blends.js";
import { WAIT_FACTS } from "../src/data/waitContent.js";

/* Each rule earns a claim a point and a tag. Ranked, not judged. */
const SIGNALS = [
  ["person",      /\b(?:Queen|King|Emperor|Empress|Pope|Dr|Saint|St\.?|Sir|Lord|Lady)\b|\b[A-Z][a-z]+ (?:da |de |von |van )?[A-Z][a-z]+\b(?= (?:was|is|invented|discovered|wrote|named|crossed|demanded|introduced|brought))/],
  ["date",        /\b\d{3,4}\s?(?:BCE|CE|BC|AD)\b|\b(?:1[0-9]|20)\d{2}\b|\b\d{1,2}(?:st|nd|rd|th)[- ]century\b/i],
  ["institution", /\b(?:law|legal|tax|taxes|tariff|currency|patent|banned|illegal|prohibit|monopol|parliament|court|treaty|empire|dynasty)\w*/i],
  ["superlative", /\b(?:first|oldest|only|largest|smallest|most|never|always|every|earliest|invented|world's)\b/i],
  ["quantity",    /\b\d+(?:\.\d+)?\s?(?:mg|g|kg|ml|l|%|percent|pounds?|lb|tons?|times|fold|patients?|trials?|years?|centuries)\b/i],
  ["clinical",    /\b(?:trial|meta-analysis|randomi[sz]ed|placebo|double-blind|study|studies|researchers|clinically)\b/i],
];

const claims = [];
const add = (where, id, text) => {
  if (!text || typeof text !== "string") return;
  const tags = SIGNALS.filter(([, re]) => re.test(text)).map(([t]) => t);
  claims.push({ where, id, text, tags, score: tags.length });
};

for (const [id, m] of Object.entries(INGREDIENTS)) {
  add("blurb", id, m.blurb);
  for (const f of m.facts || []) add("fact", id, f);
}
for (const b of BLENDS) add("culturalNote", b.id, b.culturalNote);
for (const [ing, list] of Object.entries(WAIT_FACTS || {})) {
  for (const w of list || []) {
    if (w?.type === "fact" || w?.type === "tradition") add(`wait:${w.type}`, ing, w.text);
  }
}

const only = process.argv.find(a => a.startsWith("--tag="))?.slice(6);
const min = Number(process.argv.find(a => a.startsWith("--min="))?.slice(6) || 0);
const list = process.argv.includes("--list");

const selected = claims
  .filter(c => (!only || c.tags.includes(only)) && c.score >= min)
  .sort((a, b) => b.score - a.score);

console.log(`\nClaims in prose: ${claims.length}`);
const byTag = {};
for (const c of claims) for (const t of c.tags) byTag[t] = (byTag[t] || 0) + 1;
console.log("By signal:");
for (const [t, n] of Object.entries(byTag).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(12)} ${String(n).padStart(4)}`);
}
const scored = claims.filter(c => c.score > 0).length;
console.log(`\nCarrying at least one signal: ${scored}  (${Math.round(100 * scored / claims.length)}%)`);
console.log(`Two or more:                  ${claims.filter(c => c.score >= 2).length}`);
console.log(`Three or more:                ${claims.filter(c => c.score >= 3).length}`);

if (list) {
  console.log(`\n--- ${selected.length} shown ---`);
  for (const c of selected) {
    console.log(`\n[${c.score}] ${c.where}${c.id ? " " + c.id : ""}  {${c.tags.join(",")}}`);
    console.log(`    ${c.text.replace(/\s+/g, " ").slice(0, 300)}`);
  }
}

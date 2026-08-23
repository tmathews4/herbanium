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

   --anchor answers the SECOND question, and it is the mechanical one:
   does the ingredient's own research doc mention this claim's hard
   particulars at all? Not "is it true" — "did anyone write it down".

   That distinction is what the first pass through the top 50 needed
   and did not have. Nine claims were wrong, and they were wrong in
   three different ways: the copy drifted from a doc that was right
   (assam, white), the doc itself was wrong (sage's 812 CE), or NO DOC
   COVERED IT — ceylon's tonnage and export history were written
   straight into the app. Only the third kind is findable without a
   source in hand, and it is findable exactly, by asking whether the
   1965 and the 300,000 appear anywhere in ceylon.md. They did not.

   Particulars are years, quantities and proper nouns — the tokens a
   claim can be wrong ABOUT. Prose is reworded freely, so matching
   sentences would report nothing but noise; matching particulars
   survives rewording and is what a fact-check would look up anyway.

   UNANCHORED IS NOT WRONG. A doc may cover a claim in words the
   regex cannot see, and plenty of true things are simply undocumented
   here. What it is, is unchecked-by-anything — the state the pepper
   claim lived in for as long as it shipped.

   THE COMMON FALSE POSITIVE is worth knowing before you act on a hit:
   the doc covers the SUBSTANCE and omits the ATTRIBUTION. Cinnamon's
   coumarin fact reported unanchored on "German Federal Institute for
   Risk Assessment" while the doc had four paragraphs on cassia's ~1%
   coumarin and the 25 mg teaspoon — everything except the name of the
   body issuing the limit. That is still worth fixing, because a named
   institution is precisely the kind of particular a reader would
   check, but it is a citation gap and not an invented claim. Read the
   hit before deciding which you have.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { BLENDS } from "../src/data/blends.js";
import { WAIT_FACTS } from "../src/data/waitContent.js";

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/research/ingredients");

/* id -> doc text. Same resolution rule as tests/research-parity.test.mjs:
   the slug, or the slug with its dashes removed (lemon-balm -> lemonbalm). */
const docFor = {};
for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const id = [slug, slug.replace(/-/g, "")].find(c => INGREDIENTS[c]);
  if (id) docFor[id] = readFileSync(resolve(DOCS, file), "utf8").toLowerCase();
}

/* Telling a NAME from a word that merely starts a sentence.
   
   A hand-kept stop list is the obvious approach and it goes stale the
   first time someone writes a sentence beginning "Pickled". The corpus
   calibrates itself instead: any word that appears LOWERCASE anywhere
   in these 849 items is an ordinary English word, whatever case a
   particular sentence gives it. "Powdered", "Today's", "Cheap" and
   "Despite" all fail that test; "Tutankhamun", "Mojitos" and "Sicilian"
   pass it, because nothing writes them in lower case.
   
   Filled after the corpus is assembled — see below. */
const COMMON = new Set();
const bare = w => w.toLowerCase().replace(/[’']s$/, "");

/* The tokens a claim can be WRONG about: years, quantities, proper nouns. */
function particulars(text) {
  const out = new Set();
  for (const m of text.matchAll(/\b\d{3,4}\b(?:\s?(?:BCE|CE|BC|AD))?/g)) out.add(m[0].trim());
  for (const m of text.matchAll(/\b\d+(?:[.,]\d+)?\s?(?:mg|g|kg|ml|l|%|percent|pounds?|lb|tonnes?|tons?|acres?)\b/gi)) out.add(m[0].trim());
  for (const m of text.matchAll(/\b[A-Z][a-zA-Z'’-]{3,}\b/g)) {
    if (!COMMON.has(bare(m[0]))) out.add(m[0].replace(/[’']s$/, ""));
  }
  return [...out];
}

/* Blend cultural notes have no per-ingredient doc and were skipped
   entirely — the tool printed "blends (no doc to check): 45" and that
   line read as a fact of life rather than a hole. It was a hole: 32
   notes asserting real places, real practices and real dates, with
   nothing to compare them to. docs/research/blends.md is the one file
   they all answer to, and the first pass through it found four wrong. */
const BLEND_DOC = (() => {
  try { return readFileSync(resolve(DOCS, "../blends.md"), "utf8").toLowerCase(); }
  catch { return null; }
})();

/* A particular is anchored if the doc contains it. Numbers are matched
   with separators stripped, so "300,000" finds "300000" and vice versa. */
const loose = t => t.toLowerCase().replace(/[\s,]/g, "");
function unanchored(id, text, doc) {
  if (doc === undefined) doc = docFor[id];
  if (!doc) return null;                       // no doc at all — reported separately
  const flat = loose(doc);
  return particulars(text).filter(p => !doc.includes(p.toLowerCase()) && !flat.includes(loose(p)));
}

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

/* Every word seen in lower case anywhere in the corpus is an ordinary
   word, not a name. Built from the prose itself so it never goes stale. */
for (const c of claims) {
  for (const m of c.text.matchAll(/\b[a-z][a-z'’-]{2,}\b/g)) COMMON.add(bare(m[0]));
}

/* Blend cultural notes anchor against docs/research/blends.md; every
   other claim against its own ingredient's doc. */
for (const c of claims) {
  c.loose = c.where === "culturalNote"
    ? unanchored(c.id, c.text, BLEND_DOC)
    : unanchored(c.id, c.text);
}

/* ── --conflict: the same fact, told twice, differently ────────────
   The shape that has bitten four times in this corpus and was caught
   by hand every time:

     ingredients.js  "...Alaric demanded 3,000 pounds ... in 408 CE"
     waitContent.js  "Visigoths sacking Rome in 410 demanded 3,000..."

   Both surfaces talk about the same event, one of them is wrong, and
   nothing compares them because they live in different files and no
   test reads prose. Assam had it (blurb correct, steep timer calling
   Bruce a botanist), Ceylon had it (facts list and timer wrong in two
   DIFFERENT ways), pepper had it twice over.

   Detection is deliberately narrow, because the cheap version of this
   is unusable: flag two claims about the SAME INGREDIENT that share a
   distinctive proper noun but disagree on a year. Sharing "Alaric"
   and differing on 408/410 is a contradiction. Sharing nothing but
   "Chinese" is a coincidence, which is why the shared token must be a
   proper noun the corpus does not use elsewhere in lower case — the
   same calibration the anchor check uses.

   IT REPORTS PAIRS, NOT VERDICTS. Two dates can legitimately differ
   (a plant described in one year and cultivated in another). The tool
   cannot tell those apart and does not try; it puts the pair in front
   of a reader, which is all that was ever missing. */
const NEAR_YEARS = 25;   // see below
/* A name appearing in more than a few of ONE ingredient's claims is that
   ingredient's background vocabulary, not a marker of a single event.
   Measured: "Hangzhou" is in 4 of dragonwell's 16 claims and produced the
   last false positive; "Alaric" is in exactly 2 of black pepper's 16 and
   names precisely the contradicting pair. "Vasco" is in 3 — the same
   voyage told three times, which is worth SEEING, not suppressing.
   The threshold is picked from those observations, not derived. A wrong
   call here costs one line of reading, which is the right way round. */
const BACKGROUND_AT = 4;

function conflicts(all) {
  /* A YEAR, not any three-digit number. "600-2,000m" is an elevation and
     was the first thing this reported. Four digits, or three with an era
     marker, and never one carrying a unit. */
  /* Pulling a YEAR out of prose is fiddlier than it looks, and the first
     two attempts each failed on a case this tool exists for:

       "600-2,000m elevation"  -> 600 is not a year (unit follows a range)
       "3,000 pounds of pepper" -> the 000 is a thousands separator
       "264 million kg"        -> a magnitude, not a year
       "sacking Rome in 410"   -> IS a year, and carries no era marker

     The second attempt fixed the elevation by demanding BCE/CE on any
     three-digit number, which silently dropped that last line — the
     exact contradiction the detector was built to find. So: take three-
     and four-digit numbers, reject a thousands fragment by what precedes
     it, and reject a measurement by what follows. */
  const years = t => [...t.matchAll(/(?<![\d,.])\b(\d{3,4})\b/g)]
    .filter(m => !/^\s*[-–]?\s*[\d,]*\s*(?:m|km|cm|ml|l|g|kg|°|%|million|billion|thousand)\b/
      .test(t.slice(m.index + m[1].length)))
    .map(m => +m[1]);

  /* The ingredient naming ITSELF is not evidence that two claims describe
     one event — every darjeeling fact says "Darjeeling". Drop the id and
     its word-parts from the shared set. */
  const nouns = (t, id) => {
    const own = new Set(String(id).toLowerCase().split(/[-_]/));
    return particulars(t).filter(x => /^[A-Z]/.test(x) && !own.has(x.toLowerCase()));
  };

  const byId = {};
  for (const c of all) (byId[c.id] = byId[c.id] || []).push(c);

  const out = [];
  for (const group of Object.values(byId)) {
    const seen = {};
    for (const c of group) for (const n of new Set(nouns(c.text, c.id))) seen[n] = (seen[n] || 0) + 1;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        const shared = nouns(a.text, a.id)
          .filter(n => nouns(b.text, b.id).includes(n) && seen[n] < BACKGROUND_AT);
        if (!shared.length) continue;
        const ya = years(a.text), yb = years(b.text);
        if (!ya.length || !yb.length) continue;
        if (ya.some(y => yb.includes(y))) continue;    // they agree on a year — fine

        /* NEAR years are the tell. Two tellings of ONE event disagree by a
           little — Alaric at 408 against 410. Two DIFFERENT events about
           one ingredient sit decades apart: rooibos's 2021 trade protection
           and its 1968 folk remedy share "African" and contradict nothing.
           Distance is what separates a contradiction from a coincidence. */
        const gap = Math.min(...ya.flatMap(x => yb.map(y => Math.abs(x - y))));
        if (gap > NEAR_YEARS) continue;
        out.push({ a, b, shared, ya, yb, gap });
      }
    }
  }
  return out;
}

const only = process.argv.find(a => a.startsWith("--tag="))?.slice(6);
const min = Number(process.argv.find(a => a.startsWith("--min="))?.slice(6) || 0);
const list = process.argv.includes("--list");
const anchor = process.argv.includes("--anchor");

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

/* ── anchoring ─────────────────────────────────────────────────── */
const checkable = claims.filter(c => c.loose !== null && particulars(c.text).length);
const floating = checkable.filter(c => c.loose.length === particulars(c.text).length);
console.log(`\nParticulars (years, quantities, proper nouns):`);
console.log(`  claims carrying any:        ${checkable.length}`);
console.log(`  with NONE in their doc:     ${floating.length}  <- nothing wrote these down`);
console.log(`  no doc at all to check:     ${claims.filter(c => c.loose === null).length}`);

if (anchor) {
  const shown = selected.filter(c => c.loose && c.loose.length);
  console.log(`\n--- ${shown.length} claims with particulars absent from their doc ---`);
  for (const c of shown) {
    const all = particulars(c.text).length;
    const flag = c.loose.length === all ? "  ** NOTHING anchored **" : "";
    console.log(`\n[${c.score}] ${c.where} ${c.id}  {${c.tags.join(",")}}${flag}`);
    console.log(`    missing from doc (${c.loose.length}/${all}): ${c.loose.join(", ")}`);
    console.log(`    ${c.text.replace(/\s+/g, " ").slice(0, 220)}`);
  }
}

if (process.argv.includes("--conflict")) {
  const pairs = conflicts(claims);
  console.log(`\n--- ${pairs.length} same-ingredient pair(s) sharing a name but disagreeing on a year ---`);
  for (const { a, b, shared, ya, yb, gap } of pairs) {
    console.log(`\n${a.id}  shares: ${shared.join(", ")}  (years ${gap} apart)`);
    console.log(`  [${a.where}] years ${ya.join("/")}: ${a.text.replace(/\s+/g, " ").slice(0, 150)}`);
    console.log(`  [${b.where}] years ${yb.join("/")}: ${b.text.replace(/\s+/g, " ").slice(0, 150)}`);
  }
}

if (list) {
  console.log(`\n--- ${selected.length} shown ---`);
  for (const c of selected) {
    const a = c.loose === null ? "no doc"
      : c.loose.length ? `${c.loose.length} unanchored: ${c.loose.join(", ")}`
      : "anchored";
    console.log(`\n[${c.score}] ${c.where}${c.id ? " " + c.id : ""}  {${c.tags.join(",")}}  (${a})`);
    console.log(`    ${c.text.replace(/\s+/g, " ").slice(0, 300)}`);
  }
}

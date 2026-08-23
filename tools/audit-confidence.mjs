/* ──────────────────────────────────────────────────────────────
   tools/audit-confidence.mjs — is a `verified` marker EARNED?

   Every audit here asks whether a claim is present in the research.
   None asks whether the research can carry it. The docs mark 608
   claims `verified`, and the marker is self-assigned: nothing has ever
   checked one.

   IT HAS BEEN WRONG. Sage's facts table said Charlemagne ordered sage
   planted "in his 812 CE Capitulare de villis", marked `verified`, and
   cited ref-1. The scholarly consensus dates the capitulary to
   771-800 and no proposal has won the field. So the marker was wrong —
   but look at WHY it survived, because that is the mechanical part:

     ref-1 = Hamidpour M et al. "Chemistry, pharmacology, and medicinal
             property of sage ... to prevent and cure illnesses such as
             obesity, diabetes, depression, dementia ..."  type: review

   A pharmacology review of sage cannot date a Carolingian capitulary.
   The row cited a real, resolvable, respectable source that was
   incapable of supporting the claim attached to it. Nothing noticed,
   because "has a ref" was as far as anyone looked.

   So this tool asks three questions, hardest last:

     1. Does a `verified` claim cite anything at all?
     2. Does the ref it cites resolve to a definition in §9 Sources?
     3. CAN that source bear that claim? A history or culture claim
        backed only by clinical, analytical or pharmacological refs is
        a category mismatch — the sage shape exactly.

   (3) IS A SMELL, NOT A VERDICT. A pharmacology review can perfectly
   well carry an etymology if its introduction happens to cover one.
   The tool cannot read the paper; it can only say that the types do
   not line up and a human should look. Every hit needs reading —
   which is still 608 claims narrowed to a handful.

   Blockquote claims (`> ... \`verified\``) carry no source column at
   all, so questions 2 and 3 cannot be asked of them. They are counted
   and reported separately rather than silently passed, because the
   count itself is the finding: most of the corpus's confidence markers
   sit outside the only structure that records a citation.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/research/ingredients");

/* Ref types that speak to chemistry, dose and physiology — and cannot,
   on their own, settle a date, an etymology or who did what in 812. */
const EMPIRICAL = /clinical|trial|analytical|pharmacolog|safety|meta-analysis|in vitro|review/i;
/* Claim types that ask a question about the world rather than the plant. */
const HISTORICAL = /^(history|culture|tradition|etymology)$/i;

const cells = (line) => line.split("|").slice(1, -1).map(c => c.trim());

const findings = { uncited: [], unidd: [], unresolved: [], mismatch: [] };
let tableVerified = 0, quoteVerified = 0, docs = 0;

for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
  const text = readFileSync(resolve(DOCS, file), "utf8");
  docs++;

  /* §9 Sources comes in TWO shapes and the first version of this only
     knew one. Most docs use a table — "| ref-1 | citation | type |" —
     but lions-mane and reishi write a bullet list of full citations
     and refer to them by author-year (`ref-lai-2013`). Reading only
     the table made those look like dangling references, which was a
     tidy, alarming and completely wrong finding. */
  const refs = {};
  for (const line of text.split("\n")) {
    const c = cells(line);
    if (c.length >= 2 && /^ref-[\w-]+$/i.test(c[0])) {
      refs[c[0].toLowerCase()] = { citation: c[1], type: (c[2] || "").toLowerCase() };
    }
  }

  /* Bullet-list sources: resolve `ref-<name>-<year>` if the sources
     section names that author and that year. */
  const sourcesSection = (text.split(/^##\s.*[Ss]ources.*$/m)[1] || "").split(/^##\s/m)[0] || "";
  const bullets = sourcesSection.toLowerCase();
  const resolveLoose = (ref) => {
    const m = ref.match(/^ref-([a-z]+)-((?:1[0-9]|20)\d{2})$/i);
    if (!m) return null;
    const [, name, year] = m;
    if (!bullets.includes(name.toLowerCase()) || !bullets.includes(year)) return null;
    // Type is unknown from a bullet; treat as untyped rather than empirical.
    return { citation: `${name} ${year} (bullet list)`, type: "" };
  };

  /* Claims tables — "| # | Type | Confidence | Fact | Source |" */
  for (const line of text.split("\n")) {
    const c = cells(line);
    if (c.length < 5) continue;
    const [n, claimType, confidence, fact, source] = c;
    if (!/^\d+$/.test(n) || confidence.toLowerCase() !== "verified") continue;
    tableVerified++;

    const cited = [...source.matchAll(/ref-[\w-]+/gi)].map(m => m[0].toLowerCase());
    const where = `${file} #${n} (${claimType})`;
    const brief = fact.replace(/\s+/g, " ").slice(0, 95);

    if (!cited.length) {
      /* TWO DIFFERENT THINGS, and lumping them was misleading. A row
         with no ref in a doc that HAS a ref table is a real gap —
         someone could have cited and didn't. A row with no ref in a
         doc whose sources are a bullet list has nothing to cite BY ID:
         sencha, reishi and genmaicha all carry real "Sources (starting
         points)" sections with no ref ids at all, so every row in them
         reports empty. That is a doc-format difference, not 11
         unsourced claims, and reporting it as the latter would be the
         same overstatement this tool exists to catch. */
      (Object.keys(refs).length ? findings.uncited : findings.unidd)
        .push({ where, brief, source });
      continue;
    }

    for (const r of cited) if (!refs[r]) { const l = resolveLoose(r); if (l) refs[r] = l; }
    const missing = cited.filter(r => !refs[r]);
    if (missing.length) { findings.unresolved.push({ where, brief, missing }); continue; }

    if (HISTORICAL.test(claimType)) {
      const types = cited.map(r => refs[r].type);
      if (types.length && types.every(t => EMPIRICAL.test(t) || !t)) {
        findings.mismatch.push({
          where, brief,
          refs: cited.map(r => `${r} (${refs[r].type || "untyped"})`),
        });
      }
    }
  }

  /* Blockquote claims carry no source column. Counted only when the
     marker sits on a BLOCKQUOTE line, which is the shape a claim
     actually takes — "> ... `verified`".

     Not merely "anything that is not a table row": prose ABOUT the
     markers then counts as a claim, and this tool's own addenda
     ("rows marked `verified` are now `attested`") inflated the figure
     by 14 the first time these docs were edited. A measurement that
     moves when you write about it is not measuring the corpus. */
  for (const m of text.matchAll(/`verified`/g)) {
    const line = text.slice(text.lastIndexOf("\n", m.index) + 1, m.index).trimStart();
    if (line.startsWith(">")) quoteVerified++;
  }
}

const show = (title, rows, fmt) => {
  console.log(`\n${title}: ${rows.length}`);
  for (const r of rows.slice(0, 25)) console.log(fmt(r));
  if (rows.length > 25) console.log(`  ... and ${rows.length - 25} more`);
};

/* HOW MANY SOURCE CELLS ARE ACTUALLY CITATIONS.
   The column is headed "Source" and 43% of it once held prose — "tea-
   industry convention", "well-established", "processing reality",
   "content composition". A category name is not a source, and a cell
   that names one reads as cited to anybody skimming. This counts the
   difference rather than trusting the column. */
let cellsTotal = 0, cellsCited = 0, cellsProse = 0;
for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
  for (const line of readFileSync(resolve(DOCS, file), "utf8").split("\n")) {
    const c = cells(line);
    if (c.length < 5 || !/^\d+$/.test(c[0])) continue;
    cellsTotal++;
    if (/ref-[\w-]+/i.test(c[4] || "")) cellsCited++;
    else if ((c[4] || "").trim()) cellsProse++;
  }
}

console.log(`\nConfidence audit over ${docs} ingredient docs`);
console.log(`Claim rows: ${cellsTotal} — ${cellsCited} cite a ref id, ` +
  `${cellsProse} hold prose instead (${Math.round(100 * cellsProse / (cellsTotal || 1))}%)`);
console.log(`\`verified\` in claims tables (citable):   ${tableVerified}`);
console.log(`\`verified\` in prose blockquotes (no source column): ${quoteVerified}`);

show("A. `verified` with no ref, in a doc that HAS a ref table — a real gap",
  findings.uncited, r => `  ${r.where}\n      ${r.brief}`);
show("A2. `verified` in a doc whose sources are a bullet list with no ids — cannot cite by id",
  findings.unidd, r => `  ${r.where}\n      ${r.brief}`);
show("B. cites a ref that does not resolve in §9", findings.unresolved,
  r => `  ${r.where}  -> ${r.missing.join(", ")}\n      ${r.brief}`);
show("C. history/culture claim backed only by empirical refs — CAN the source bear it?",
  findings.mismatch,
  r => `  ${r.where}  <- ${r.refs.join(", ")}\n      ${r.brief}`);

const total = findings.uncited.length + findings.unresolved.length + findings.mismatch.length;
console.log(`\n(A2 is ${findings.unidd.length} rows across docs with no ref ids — a format gap, not a sourcing one.)`);
console.log(`\n${total} of ${tableVerified} table claims want a human look.`);
console.log(`C is a SMELL, not a verdict — a review can carry an etymology if it happens to cover one.`);

/* ──────────────────────────────────────────────────────────────
   tools/audit-research-drift.mjs

   Does the shipped extraction data match its own research notes?

   Every ingredient has a doc under docs/research/ingredients/, and
   those docs contain prescribed extraction tables — rows of the form

     | effects | [["grounding", 4], ["calm", 3], ["soothing", 3]] |

   which are the researched answer for what a cup shows at that brew
   point. src/data/extractionProfiles.js is supposed to be those tables,
   transcribed.

   Mostly it is. Where it isn't, the ingredient page ends up promising
   a property the brew view can never show — Ashwagandha's research
   prescribes soothing and warming at multiple brew points and the
   shipped profile mentions neither, which is why the audit of
   unreachable properties found 124 of them with no perception-layer
   cause. They were never transcribed.

   This diffs the two, so the gap can be worked through rather than
   rediscovered one ingredient at a time.

   Run: node tools/audit-research-drift.mjs [--ing <id>]
   ────────────────────────────────────────────────────────────── */

import { readFileSync, existsSync, readdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname, "../docs/research/ingredients");

const only = process.argv.includes("--ing")
  ? process.argv[process.argv.indexOf("--ing") + 1]
  : null;

/** Effect names prescribed anywhere in an ingredient's research doc. */
function researchEffects(file) {
  const src = readFileSync(file, "utf8");
  const names = new Set();
  // Table rows: | effects | [["name", n], ...] |
  for (const row of src.matchAll(/\|\s*effects\s*\|\s*(\[\[.*?\]\])\s*\|/g)) {
    for (const hit of row[1].matchAll(/\[\s*"([^"]+)"\s*,\s*[\d.]+\s*\]/g)) {
      // The docs' "settle" is the app's "digestive" — same claim, and
      // every gloss in the docs says so. Without the alias this audit
      // reports four ingredients as un-transcribed that are in fact
      // done, which is worse than useless: it makes a finished job
      // look unfinished and hides the ones that genuinely aren't.
      // Canonical-word aliases. The docs and the app sometimes use
      // different words for one claim, and the app's word wins where
      // it's the one the user meets:
      //   settle  -> digestive  (docs' own glosses all say digestive)
      //   warming -> comfort    (comfort is what onboarding offers as
      //                          the warm register; carrying both made
      //                          21 ingredients assert it twice)
      const ALIAS = { settle: "digestive", warming: "comfort" };
      names.add(ALIAS[hit[1]] || hit[1]);
    }
  }
  return names;
}

/** Effect names the shipped extraction profile actually produces. */
function shippedEffects(id) {
  const p = EXTRACTION_PROFILES[id];
  const names = new Set();
  for (const key of Object.keys(p || {})) {
    const sample = p[key];
    if (!sample || typeof sample !== "object") continue;
    for (const e of sample.effects || []) {
      names.add(Array.isArray(e) ? e[0] : e.name);
    }
  }
  return names;
}

const rows = [];
for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  // Doc filenames don't always match ingredient ids (assam.md ->
  // "assam"); try the slug, then a few obvious variants, and report
  // the ones that can't be matched rather than dropping them.
  const candidates = [slug, slug.replace(/-/g, ""), `${slug}-black`, `${slug}-green`];
  const id = candidates.find(c => EXTRACTION_PROFILES[c]);
  if (!id) { rows.push({ slug, unmatched: true }); continue; }
  if (only && id !== only) continue;

  const research = researchEffects(resolve(DOCS, file));
  if (research.size === 0) { rows.push({ slug, id, noTable: true }); continue; }
  const shipped = shippedEffects(id);
  const missing = [...research].filter(n => !shipped.has(n)).sort();
  const extra = [...shipped].filter(n => !research.has(n) && n !== "bitterness").sort();
  rows.push({ slug, id, missing, extra, research: research.size });
}

const drifted = rows.filter(r => r.missing?.length);
const extras = rows.filter(r => r.extra?.length);
const unmatched = rows.filter(r => r.unmatched);
const noTable = rows.filter(r => r.noTable);

console.log(`\nCompared ${rows.length - unmatched.length - noTable.length} ingredients `
  + `against their research docs.\n`);

console.log(`PRESCRIBED BUT NOT SHIPPED (${drifted.length} ingredients):\n`);
for (const r of drifted.sort((a, b) => b.missing.length - a.missing.length)) {
  console.log(`  ${r.id.padEnd(20)} missing: ${r.missing.join(", ")}`);
}

if (extras.length) {
  console.log(`\nSHIPPED BUT NOT PRESCRIBED (${extras.length}) — may be fine, `
    + `but worth an eye:\n`);
  for (const r of extras) console.log(`  ${r.id.padEnd(20)} extra: ${r.extra.join(", ")}`);
}

if (noTable.length) {
  console.log(`\nNO EXTRACTION TABLE IN DOC (${noTable.length}): `
    + noTable.map(r => r.slug).join(", "));
}
if (unmatched.length) {
  console.log(`\nDOC WITHOUT A MATCHING PROFILE ID (${unmatched.length}): `
    + unmatched.map(r => r.slug).join(", "));
}

const totalMissing = drifted.reduce((n, r) => n + r.missing.length, 0);
console.log(`\n${totalMissing} prescribed effect names are absent from the shipped `
  + `profiles, across ${drifted.length} ingredients.\n`);

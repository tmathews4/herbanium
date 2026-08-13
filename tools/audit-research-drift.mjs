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
import { strengthDrift, SEVERE, UNPAIRABLE_CLASS } from "./lib/strength-drift.mjs";
import { flavourFamilyGaps } from "./lib/flavour-parity.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname, "../docs/research/ingredients");

const only = process.argv.includes("--ing")
  ? process.argv[process.argv.indexOf("--ing") + 1]
  : null;

// Canonical-word aliases. The docs and the app sometimes use different
// words for one claim, and the app's word wins where it's the one the
// user meets:
//   settle  -> digestive  (docs' own glosses all say digestive)
//
// `warming -> comfort` was here and is RETIRED. They are two claims:
// ginger's doc rates warming 5 as "genuine TRPV1-agonist warming,
// distinct from caffeine-driven warming or simply hot-drink warmth"
// and rates its soothing consequence separately. Physical heat versus
// warm relaxation. While the alias stood, a doc prescribing the first
// was satisfied by the app shipping the second.
//
// Applied to BOTH sides — it's a canonicalisation, not a one-way
// mapping, and tests/research-parity.test.mjs already learned this the
// hard way. Aliasing only the docs made every ingredient that ships
// "warming" report as `extra: warming` AND `missing: comfort` at the
// same time: one claim counted as both a gap and a surplus, on ~15
// ingredients. That's not noise around the signal, it IS most of the
// output, and it sends you off transcribing work that's already done.
const ALIAS = { settle: "digestive" };
const canon = n => ALIAS[n] || n;

/** Effect names prescribed anywhere in an ingredient's research doc. */
function researchEffects(file) {
  const src = readFileSync(file, "utf8");
  const names = new Set();
  // Table rows: | effects | [["name", n], ...] |
  for (const row of src.matchAll(/\|\s*effects\s*\|\s*(\[\[.*?\]\])\s*\|/g)) {
    for (const hit of row[1].matchAll(/\[\s*"([^"]+)"\s*,\s*[\d.]+\s*\]/g)) {
      names.add(canon(hit[1]));
    }
  }
  // Addenda. A brew-point table is the normal place to prescribe an
  // effect, but a finding often applies across every brew point rather
  // than to one — darjeeling's L-theanine calm, say, which its §5
  // effects-rating table has carried all along. Those carry the same
  // machine-readable line the parity guard reads, so the two tools
  // agree on what "sourced" means. Without it this audit reports
  // freshly-researched ingredients as drift the moment they're done.
  //
  //   <!-- sourced-effects: focus, calm -->
  for (const row of src.matchAll(/<!--\s*sourced-effects:\s*([^>]+?)\s*-->/g)) {
    for (const n of row[1].split(",").map(x => x.trim()).filter(Boolean)) {
      names.add(canon(n));
    }
  }
  return names;
}

/**
 * Effects a doc prescribes ONLY inside a preparation the shipped
 * profile has no way to represent.
 *
 * Most docs model a temperature/time gradient, which is what a profile
 * is. A few model PREPARATIONS instead — matcha's §6 is usucha, koicha
 * and latte, and says outright that "the standard GENTLE/STANDARD/
 * STRONG extraction model doesn't fit matcha because there's no
 * extraction in the standard sense." Yerba-mate's is gourd, tea bag
 * and tereré.
 *
 * Where such an effect is general across the preparations it can still
 * be transcribed — mate is uplifting however you make it. Where it
 * belongs to one preparation the temperature axis cannot express, it
 * cannot: yerba-mate's `cooling` is prescribed only for tereré, served
 * at 5-10C, and the profile's coldest sample is 70C. Transcribing it
 * would assert that HOT mate is cooling, which the doc denies in §5
 * ("not primary; slight in tereré").
 *
 * Marked in the doc so this reads as a known structural limit rather
 * than as un-transcribed work the audit nags about forever:
 *
 *   <!-- preparation-only: cooling -->
 */
/**
 * Effects an EARLIER part of the doc prescribes that a later addendum
 * has re-registered under a different word.
 *
 * The §6 brew tables are a transcription made at a point in time. When
 * research later shows the register was misnamed — the seven
 * ingredients whose "soothing" gloss actually described comfort — the
 * addendum records the correction, but the original tables still say
 * the old word, and this audit reported it as prescribed-but-shipped.
 *
 * Rewriting the old tables would erase the record of what was
 * originally concluded, which is the opposite of how these docs work:
 * they append. So the addendum carries a marker instead.
 *
 *   <!-- superseded-effects: soothing -->
 */
function supersededEffects(file) {
  const names = new Set();
  for (const row of readFileSync(file, "utf8")
    .matchAll(/<!--\s*superseded-effects:\s*([^>]+?)\s*-->/g)) {
    for (const n of row[1].split(",").map(x => x.trim()).filter(Boolean)) names.add(canon(n));
  }
  return names;
}

function preparationOnly(file) {
  const names = new Set();
  for (const row of readFileSync(file, "utf8")
    .matchAll(/<!--\s*preparation-only:\s*([^>]+?)\s*-->/g)) {
    for (const n of row[1].split(",").map(x => x.trim()).filter(Boolean)) names.add(canon(n));
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
      names.add(canon(Array.isArray(e) ? e[0] : e.name));
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
  const prepOnly = preparationOnly(resolve(DOCS, file));
  const superseded = supersededEffects(resolve(DOCS, file));
  const missing = [...research]
    .filter(n => !shipped.has(n) && !prepOnly.has(n) && !superseded.has(n)).sort();
  const extra = [...shipped].filter(n => !research.has(n) && n !== "bitterness").sort();
  rows.push({ slug, id, missing, extra, research: research.size, prepOnly: [...prepOnly] });
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

const { diffs: strengthDiffs, unpairable, paired, unpaired, unpairableBy } =
  strengthDrift(EXTRACTION_PROFILES);
if (strengthDiffs.length) {
  const severe = strengthDiffs.filter(d => d.delta >= SEVERE);
  console.log(`\nSTRENGTH DRIFT — right effect, wrong magnitude `
    + `(${strengthDiffs.length} across paired brew points):\n`);
  console.log(`  ${severe.length} differ by ${SEVERE}+ points — these are the ones worth `
    + `an argument:\n`);
  for (const d of severe) {
    console.log(`  ${d.id.padEnd(18)} ${String(d.tempC).padStart(3)}C  `
      + `${d.name.padEnd(11)} doc ${String(d.doc).padStart(4)} -> app ${d.app}`);
  }
  const minor = strengthDiffs.length - severe.length;
  if (minor) console.log(`\n  (+${minor} differing by under ${SEVERE} — `
    + `transcription rounding and perception tuning, mostly fine)`);
}

// Coverage prints unconditionally, OUTSIDE the block above. It used to be
// nested inside it, so a run with no drift at all would have reported
// nothing here — a clean bill of health over an unknown fraction of the
// corpus, which is the one thing this audit is not allowed to imply.
{
  const total = paired + unpairable;
  const pct = total ? Math.round((paired / total) * 100) : 0;
  console.log(`\nSTRENGTH COVERAGE — ${paired}/${total} doc brew points compared (${pct}%)\n`);

  // A doc point goes uncompared for two different reasons, and only one
  // is a defect. WORKLIST entries are missing data: write the timeS into
  // the doc table, or sample the profile at the temperature the research
  // describes, and the point becomes comparable. EXCLUDED entries are
  // correct and permanent — a gongfu rinse and a western steep share a
  // temperature and are not the same cup.
  const show = (title, kind) => {
    const rows = Object.keys(unpairableBy)
      .filter(r => UNPAIRABLE_CLASS[r]?.kind === kind);
    if (!rows.length) return;
    console.log(`  ${title}`);
    for (const r of rows) {
      console.log(`    ${String(unpairableBy[r]).padStart(3)}  ${r.padEnd(20)} `
        + UNPAIRABLE_CLASS[r].note);
    }
    console.log();
  };
  show("FIXABLE — missing data, not disagreement:", "worklist");
  show("EXCLUDED — comparing these would manufacture drift:", "excluded");

  // A reason with no disposition would otherwise print nowhere. The guard in
  // research-parity.test.mjs makes that a failure, but say so here too — the
  // audit is read on its own, and a silent omission is the failure mode.
  const unclassified = Object.keys(unpairableBy).filter(r => !UNPAIRABLE_CLASS[r]);
  if (unclassified.length) {
    console.log(`  ** UNCLASSIFIED REASONS (${unclassified.length}) — not counted above: `
      + `${unclassified.join(", ")}\n`);
  }

  // Which ingredients carry the fixable ones, so the worklist has names.
  const fixable = unpaired.filter(u => UNPAIRABLE_CLASS[u.reason]?.kind === "worklist");
  if (fixable.length) {
    const byId = {};
    for (const u of fixable) byId[u.id] = (byId[u.id] || 0) + 1;
    const worst = Object.entries(byId).sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(`  Most uncompared points, by ingredient:`);
    for (const [id, n] of worst) console.log(`    ${String(n).padStart(3)}  ${id}`);
  }
}

const prepAll = rows.filter(r => r.prepOnly?.length);
if (prepAll.length) {
  console.log(`\nPRESCRIBED ONLY IN A PREPARATION THE PROFILE CAN'T MODEL `
    + `(${prepAll.length}) — not drift, a structural limit:\n`);
  for (const r of prepAll) console.log(`  ${r.id.padEnd(20)} ${r.prepOnly.join(", ")}`);
}

const flavGaps = flavourFamilyGaps(EXTRACTION_PROFILES);
if (flavGaps.length) {
  console.log(`\nFLAVOUR FAMILIES THE RESEARCH NAMES AND NO CUP SHOWS (${flavGaps.length}):\n`);
  console.log(`  Family-level, because the docs and the app use different words`);
  console.log(`  for the same register — lapsang's doc says smoky, its profile`);
  console.log(`  says smoked. The question is whether the register reaches the cup.\n`);
  for (const g of flavGaps) {
    console.log(`  ${g.id.padEnd(15)} ${g.family.padEnd(9)} asked for by: ${g.words.join(", ")}`);
  }
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

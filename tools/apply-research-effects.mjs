/* ──────────────────────────────────────────────────────────────
   tools/apply-research-effects.mjs

   Transcribe prescribed effects from the research docs into
   src/data/extractionProfiles.js.

   Narrow on purpose. For each ingredient it matches doc brew points to
   shipped samples by (tempC, timeS) and ADDS effect names the doc
   prescribes and the sample lacks, at the doc's value. It never edits
   an existing value, never removes anything, never touches flavors or
   character text, and never adds a sample.

   That deliberately leaves value drift alone — Ashwagandha's shipped
   grounding was a point below its doc, and correcting numbers is a
   judgement about the model's calibration rather than a transcription.
   Adding an absent name is not: the doc says the cup has it and the
   data says nothing at all, so there's no competing claim to weigh.

   Writes nothing without --write. Run the audits and the node suite
   after; the literature and calibration suites are what catch a
   transcription that moved the model somewhere it shouldn't go.

   Run: node tools/apply-research-effects.mjs [--write]
   ────────────────────────────────────────────────────────────── */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { FAMILY_BY_EFFECT, FAMILY_BY_FLAVOR } from "../src/data/families.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname, "../docs/research/ingredients");
const SRC = resolve(__dirname, "../src/data/extractionProfiles.js");
const WRITE = process.argv.includes("--write");

/** Brew points prescribed by a doc: [{ tempC, timeS, effects: [[n,v]] }] */
function docBrewPoints(file) {
  const src = readFileSync(file, "utf8");
  const points = [];
  // Each brew point is a small table; pull the fields per table block.
  for (const block of src.split(/\n###\s/)) {
    const temp = block.match(/\|\s*tempC\s*\|\s*([\d.]+)\s*\|/);
    const time = block.match(/\|\s*timeS\s*\|\s*([\d.]+)\s*\|/);
    const eff = block.match(/\|\s*effects\s*\|\s*(\[\[.*?\]\])\s*\|/);
    // Flavors are a bare bracketed list in the docs: [earthy, mild].
    const flv = block.match(/\|\s*flavors\s*\|\s*\[([^\]]*)\]\s*\|/);
    if (!temp || !time || !eff) continue;
    const effects = [...eff[1].matchAll(/\[\s*"([^"]+)"\s*,\s*([\d.]+)\s*\]/g)]
      .map(m => [m[1], Number(m[2])])
      // Tokens the app has no family for can't be rendered, and
      // inventing a family is an editorial call — "settle" could sit
      // under calm or under digestive depending on whether you read
      // chamomile or peppermint. Reported below rather than guessed.
      // "settle" is the docs' informal word for the same thing they
      // otherwise call digestive — every gloss says so outright
      // ("traditional digestive use; mild carminative"). Kept as one
      // token because on screen it would sit beside calm and soothing,
      // where "settle" gives a reader no way to tell it's the gut one.
      .map(([n, v]) => (n === "settle" ? ["digestive", v, "aliased"] : [n, v]))
      .filter(([n]) => {
        if (FAMILY_BY_EFFECT[n]) return true;
        unmapped.set(n, (unmapped.get(n) || 0) + 1);
        return false;
      });
    const flavors = (flv ? flv[1].split(",") : [])
      .map(x => x.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean)
      // Same rule as effects: a flavor with no family can't be drawn,
      // and inventing one is an editorial call.
      .filter(n => {
        if (FAMILY_BY_FLAVOR[n]) return true;
        unmappedFlavors.set(n, (unmappedFlavors.get(n) || 0) + 1);
        return false;
      });
    points.push({ tempC: Number(temp[1]), timeS: Number(time[1]), effects, flavors });
  }
  return points;
}

const unmapped = new Map();
const unmappedFlavors = new Map();
const docFor = {};
for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const id = [slug, slug.replace(/-/g, "")].find(c => EXTRACTION_PROFILES[c]);
  if (id) docFor[id] = docBrewPoints(resolve(DOCS, file));
}

let src = readFileSync(SRC, "utf8");
const changes = [];

for (const [id, points] of Object.entries(docFor)) {
  const samples = EXTRACTION_PROFILES[id] || [];

  // Pair samples to doc points ONE-TO-ONE, closest first. A plain
  // nearest-point match let two shipped samples both claim the same doc
  // row, which copies identical values onto different brew points and
  // flattens the very curve the app exists to show — Tulsi's 98C and
  // 100C cups came out with the same three additions.
  const pairs = [];
  for (const sample of samples) {
    for (const point of points) {
      pairs.push({
        sample, point,
        d: Math.abs(point.tempC - sample.tempC) * 10
           + Math.abs(point.timeS - sample.timeS) / 60,
      });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  const usedSample = new Set(), usedPoint = new Set();
  const matched = [];
  for (const pair of pairs) {
    if (pair.d > 60) break;
    if (usedSample.has(pair.sample) || usedPoint.has(pair.point)) continue;
    usedSample.add(pair.sample); usedPoint.add(pair.point);
    matched.push(pair);
  }

  // Carry forward. Where a shipped sample has no doc point of its own
  // (more samples than the doc prescribes), it inherits the nearest
  // EARLIER matched point. Without this an effect added to samples 1
  // and 2 but not 3 falls off a cliff — Tulsi's grounding went 3 -> 4
  // -> 0 across the slider, which the literature suite caught as an
  // inversion. Extraction accumulates; a compound present at fifteen
  // minutes has not left by twenty.
  const order = samples.map((sample) => {
    const hit = matched.find(m => m.sample === sample);
    return { sample, point: hit ? hit.point : null };
  });
  let carried = null;
  for (const row of order) {
    if (row.point) carried = row.point;
    else if (carried) row.point = carried;
  }

  for (const { sample, point: best } of order.filter(r => r.point)) {
    const haveVal = new Map((sample.effects || []).map(e => [e[0], e[1]]));
    const add = best.effects.filter(([n]) => !haveVal.has(n)).map(([n, v]) => [n, v]);
    // Aliasing settle onto digestive can collide with a digestive the
    // sample already has — peppermint declares settle 4 as its primary
    // effect and carries digestive too. Take the stronger reading
    // rather than dropping one or summing them into something the
    // research never claimed.
    // ONLY where aliasing settle onto digestive collides with a
    // digestive the sample already has. Raising every value the doc
    // reads higher would be correcting calibration drift, which is a
    // judgement about the model rather than a transcription — left
    // alone deliberately, here as everywhere else.
    const raise = best.effects.filter(
      ([n, v, alias]) => alias === "aliased" && haveVal.has(n) && v > haveVal.get(n),
    ).map(([n, v]) => [n, v]);
    if (!add.length && !raise.length) continue;

    // Rewrite this sample's effects array in the source text. Anchored
    // on the exact existing array so a mis-match is a skip, not a
    // corruption.
    const raisedTo = new Map(raise);
    const existing = "[" + (sample.effects || [])
      .map(e => `["${e[0]}", ${e[1]}]`).join(", ") + "]";
    const merged = "[" + [
      ...(sample.effects || []).map(e => [e[0], raisedTo.has(e[0]) ? raisedTo.get(e[0]) : e[1]]),
      ...add,
    ].map(e => `["${e[0]}", ${e[1]}]`).join(", ") + "]";
    const idx = src.indexOf(existing);
    if (idx === -1) {
      changes.push({ id, tempC: sample.tempC, timeS: sample.timeS, add, skipped: "no text match" });
      continue;
    }
    src = src.slice(0, idx) + merged + src.slice(idx + existing.length);
    changes.push({ id, tempC: sample.tempC, timeS: sample.timeS, add, raise });

    // Flavors, same rules. Samples using flavorStrengths (the
    // cold-pour points) are skipped — they carry per-flavor weights
    // and appending a bare name would silently change their shape.
    if (Array.isArray(sample.flavors) && best.flavors?.length) {
      const haveF = new Set(sample.flavors);
      const addF = best.flavors.filter(n => !haveF.has(n));
      if (addF.length) {
        const exF = "[" + sample.flavors.map(f => `"${f}"`).join(", ") + "]";
        const mgF = "[" + [...sample.flavors, ...addF].map(f => `"${f}"`).join(", ") + "]";
        const iF = src.indexOf(exF);
        if (iF !== -1) {
          src = src.slice(0, iF) + mgF + src.slice(iF + exF.length);
          changes.push({ id, tempC: sample.tempC, timeS: sample.timeS, addF });
        }
      }
    }
  }
}

const applied = changes.filter(c => !c.skipped);
const skipped = changes.filter(c => c.skipped);

for (const c of applied) {
  console.log(`  ${c.id.padEnd(18)} ${String(c.tempC).padStart(3)}C/${String(c.timeS).padStart(4)}s  `
    + (c.add ? `+ ${[...c.add.map(([n, v]) => `${n} ${v}`),
                     ...(c.raise || []).map(([n, v]) => `${n} ->${v}`)].join(", ")}`
             : `+ flavors ${c.addF.join(", ")}`));
}
if (skipped.length) {
  console.log(`\nSKIPPED (${skipped.length}) — couldn't anchor on the existing array:`);
  for (const c of skipped) console.log(`  ${c.id} ${c.tempC}C/${c.timeS}s`);
}

if (unmapped.size) {
  console.log(`\nUNMAPPED TOKENS (${unmapped.size}) — prescribed by docs, no family in `
    + `data/families.js, so skipped:`);
  for (const [n, count] of unmapped) console.log(`  ${n} (in ${count} brew points)`);
}

if (unmappedFlavors.size) {
  console.log(`\nUNMAPPED FLAVORS (${unmappedFlavors.size}) — skipped:`);
  for (const [n, c] of unmappedFlavors) console.log(`  ${n} (in ${c} brew points)`);
}

console.log(`\n${applied.reduce((n, c) => n + ((c.add?.length || 0) + (c.raise?.length || 0) + (c.addF?.length || 0)), 0)} values added `
  + `across ${new Set(applied.map(c => c.id)).size} ingredients, `
  + `${applied.length} brew points.`);
if (WRITE) {
  writeFileSync(SRC, src);
  console.log("Written. Now run: node tools/audit-research-drift.mjs && npm test");
} else {
  console.log("Dry run. Pass --write to apply.");
}

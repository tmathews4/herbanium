/* ──────────────────────────────────────────────────────────────
   tools/audit-opposition.mjs

   Uses single ingredients as natural experiments against our own
   opposition rules.

   The idea: if one herb's research prescribes two properties we treat
   as pulling against each other, AND prescribes them at the SAME brew
   point, then they aren't really opposed — one cup demonstrably holds
   both, and our model is the thing that's wrong. If the same herb
   shows them at DIFFERENT brew points, that's not evidence of
   anything: the cup genuinely changes register as it extracts, and
   the opposition can stand.

   That same-cup / different-cup split is the whole test. Without it
   every ingredient with a wide extraction arc looks like a
   contradiction.

   Two halves, and they are not symmetric:

   1. EFFECTS — nothing cancels. ALLOWED_PARADOXES is consumed in
      exactly one place, to surface an informational tag when both
      sides exceed 1.5. Effects are summed, synergy-bonused, clamped.
      So a co-occurring opposed pair is never destroyed here, only
      unmentioned. What this half finds is missing VOCABULARY, not
      lost data.

   2. FLAVORS — masking is real and multiplicative, so this half can
      find genuine loss. A pair listed here has the doc saying both
      are in the cup while MASKING_MATRIX attenuates one by the given
      coefficient. Attenuated is not erased: audit-unreachable.mjs is
      what reports a property suppressed all the way to invisible.

   Run: node tools/audit-opposition.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { DOCS } from "./lib/strength-drift.mjs";
import { OPPOSED, pairKey, coveredPairs, sameCupOppositions } from "./lib/opposition.mjs";

const idFor = slug => [slug, slug.replace(/-/g, "")].find(c => EXTRACTION_PROFILES[c]);
const docFiles = readdirSync(DOCS).filter(f => f.endsWith(".md"));

/** Flavour lists per doc brew point — docs give names, not strengths. */
function flavorPoints(file) {
  const out = [];
  for (const b of readFileSync(file, "utf8").split(/^###\s+/m)) {
    const t = b.match(/\|\s*tempC\s*\|\s*([\d.]+)\s*\|/);
    const f = b.match(/\|\s*flavors\s*\|\s*\[([^\]]*)\]\s*\|/);
    if (!t || !f) continue;
    out.push({ tempC: +t[1], flavors: f[1].split(",").map(x => x.trim().replace(/["']/g, "")).filter(Boolean) });
  }
  return out;
}

/** MASKING_MATRIX isn't exported; read it out of the source. */
function maskingMatrix() {
  const src = readFileSync(resolve(DOCS, "../../../src/algo/perception.js"), "utf8");
  const body = src.slice(src.indexOf("const MASKING_MATRIX"));
  return eval("(" + body.slice(body.indexOf("{"), body.indexOf("\n};") + 2).replace(/\/\/.*/g, "") + ")");
}

// ── 1. Effects ───────────────────────────────────────────────────
const covered = coveredPairs();
const { sameCup, splitCup } = sameCupOppositions(EXTRACTION_PROFILES);

console.log("\nEFFECTS — opposed pairs the research puts in ONE cup\n"
  + "(nothing cancels effects; a hit here means missing vocabulary, not lost data)\n");
for (const [a, b] of OPPOSED) {
  const key = pairKey(a, b), lang = covered.get(key);
  const same = sameCup.get(key) || [], split = splitCup.get(key) || [];
  console.log(`  ${a} + ${b}   ${lang ? `[covered: ${lang}]` : "[NO synergy or paradox — user never told]"}`);
  if (same.length) {
    for (const h of same) {
      console.log(`      same cup:  ${h.id} — `
        + h.points.map(p => `${p.tempC}C ${a} ${p[a]}/${b} ${p[b]}`).join("; "));
    }
  } else console.log("      same cup:  none");
  if (split.length) console.log(`      different brew points only (opposition stands): ${split.join(", ")}`);
  console.log();
}

// ── 2. Flavours ──────────────────────────────────────────────────
const M = maskingMatrix();
const THRESHOLD = 0.4;
const masked = [];
for (const f of docFiles) {
  const id = idFor(f.replace(/\.md$/, ""));
  if (!id) continue;
  for (const p of flavorPoints(resolve(DOCS, f))) {
    for (const masker of p.flavors) for (const maskee of p.flavors) {
      const coef = M[masker]?.[maskee];
      if (coef >= THRESHOLD) masked.push({ id, tempC: p.tempC, masker, maskee, coef });
    }
  }
}
masked.sort((a, b) => b.coef - a.coef);

console.log(`FLAVOURS — doc puts both in one cup, matrix attenuates one by ${THRESHOLD}+\n`);
for (const m of masked) {
  console.log(`  ${m.id.padEnd(15)}${String(m.tempC).padStart(3)}C  `
    + `${m.masker.padEnd(11)} masks ${m.maskee.padEnd(11)} coef ${m.coef}`);
}
console.log(`\n  ${masked.length} pairs. Attenuated, not erased — `
  + `audit-unreachable.mjs reports anything masked to invisibility.\n`);

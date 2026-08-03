/* ──────────────────────────────────────────────────────────────
   tools/lib/strength-drift.mjs

   Shared by the audit (tools/audit-research-drift.mjs) and the guard
   (tests/research-parity.test.mjs), so the number the tool prints and
   the number the build enforces can never disagree. They did once —
   the alias was applied to the docs in one and to both sides in the
   other, and the two tools reported different worlds.

   What this finds: the RIGHT effect at the WRONG magnitude. Every
   other check here compares names, so a claim can be off by 6x with
   the suite green — ashwagandha's doc prescribes grounding 3 against
   a shipped 0.5.

   Pairing a doc brew point to a shipped sample is the fiddly part.
   Docs carry three anchors (gentle/standard/strong); profiles often
   carry four or five, and temperatures don't always line up. Exact
   (tempC, timeS) is unambiguous, a unique tempC is safe enough, and
   anything else is guesswork — those are counted and reported, never
   guessed at. An earlier attempt paired by NEAREST temperature and
   matched a 60C sample to a doc row 35 degrees away.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DOCS = resolve(__dirname, "../../docs/research/ingredients");

// Canonical-word aliases; see CLAUDE.md. Applied to BOTH sides — it's a
// canonicalisation, not a one-way mapping.
//
// NOTE this deliberately omits the name-audit's `warming -> comfort`.
// Strength comparison keys effects by name, and 24 samples now carry
// BOTH warming and comfort — collapsing them would put two different
// values on one key and silently keep whichever came last. They're
// distinct claims since the warming fold was reverted (a34a7e2): one
// thermogenic, one affective.
//
// The name audit still carries that alias, which is now questionable
// for the same reason. Retiring it there surfaces 23 unsourced pairs
// (20 comfort, 3 warming) — a real worklist, and its own decision.
export const ALIAS = { settle: "digestive" };
export const canon = n => ALIAS[n] || n;

/** Brew points prescribed by a doc: [{ tempC, timeS, eff: {name: n} }] */
export function researchBrewPoints(file) {
  const out = [];
  for (const block of readFileSync(file, "utf8").split(/^###\s+/m)) {
    const t = block.match(/\|\s*tempC\s*\|\s*([\d.]+)\s*\|/);
    const e = block.match(/\|\s*effects\s*\|\s*(\[\[.*?\]\])\s*\|/);
    if (!t || !e) continue;
    const s = block.match(/\|\s*timeS\s*\|\s*([\d.]+)\s*\|/);
    const eff = {};
    for (const m of e[1].matchAll(/\[\s*"([^"]+)"\s*,\s*([\d.]+)\s*\]/g)) eff[canon(m[1])] = +m[2];
    out.push({ tempC: +t[1], timeS: s ? +s[1] : null, eff });
  }
  return out;
}

/**
 * Pair a doc brew point to one shipped sample, or null if ambiguous.
 *
 * TEMPERATURE ALONE IS NOT A CUP. The first version of this fell back
 * to "the only sample at that temperature" and compared it regardless
 * of steep time, which paired pu-erh's 30-second gongfu first pour
 * against the doc's 4-minute western steep and called the difference
 * drift. 8 of the 13 severe drifts it reported were that — different
 * cups, not wrong numbers. Acting on them would have corrupted the
 * data: setting a 30-second rinse to digestive 4 because a 4-minute
 * decoction earns it.
 *
 * So the fallback now requires the times to be within TIME_TOLERANCE.
 * Anything further apart is genuinely unpairable and gets counted as
 * such rather than compared.
 */
export const TIME_TOLERANCE = 0.25;   // ±25% of the doc's steep time

export function pairSample(samples, pt) {
  const exact = samples.find(s => s.tempC === pt.tempC && s.timeS === pt.timeS);
  if (exact) return exact;
  const byTemp = samples.filter(s => s.tempC === pt.tempC);
  if (byTemp.length !== 1) return null;
  const s = byTemp[0];
  if (!pt.timeS || !s.timeS) return null;      // can't judge; don't guess
  return Math.abs(s.timeS / pt.timeS - 1) <= TIME_TOLERANCE ? s : null;
}

/**
 * Compare prescribed vs shipped strengths across every pairable brew
 * point. Returns { diffs, unpairable }, diffs sorted worst-first.
 */
export function strengthDrift(EXTRACTION_PROFILES) {
  const diffs = [];
  let unpairable = 0;

  for (const f of readdirSync(DOCS).filter(x => x.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const id = [slug, slug.replace(/-/g, ""), `${slug}-black`, `${slug}-green`]
      .find(c => EXTRACTION_PROFILES[c]);
    if (!id) continue;
    const samples = EXTRACTION_PROFILES[id] || [];

    for (const pt of researchBrewPoints(resolve(DOCS, f))) {
      const sample = pairSample(samples, pt);
      if (!sample) { unpairable++; continue; }
      const app = {};
      for (const e of sample.effects || []) {
        const [n, v] = Array.isArray(e) ? e : [e.name, e.value];
        app[canon(n)] = v;
      }
      for (const [name, doc] of Object.entries(pt.eff)) {
        // Presence is the other audit's job; only compare what both have.
        if (app[name] === undefined || app[name] === doc) continue;
        diffs.push({ id, tempC: pt.tempC, name, doc, app: app[name],
                     delta: Math.abs(doc - app[name]) });
      }
    }
  }
  diffs.sort((a, b) => b.delta - a.delta);
  return { diffs, unpairable };
}

/** Drift big enough to be a disagreement rather than rounding. */
export const SEVERE = 2;
export const severeDrift = EXTRACTION_PROFILES =>
  strengthDrift(EXTRACTION_PROFILES).diffs.filter(d => d.delta >= SEVERE);

/** Stable identity for a severe diff, for the ratchet list. */
export const driftKey = d => `${d.id}@${d.tempC}:${d.name}`;

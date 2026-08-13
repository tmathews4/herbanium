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

/**
 * Why a doc point went uncompared. The bare count these replace read as
 * one fact and is at least two: some of these are FIXABLE BY WRITING
 * DATA (a doc row with no timeS, a temperature the profile never
 * samples) and some must never be compared at all (a gongfu rinse and a
 * western steep at the same temperature). Reporting them as one number
 * makes the fixable ones invisible, which is the same shape as a stale
 * key making a map look complete.
 */
export const UNPAIRABLE = {
  TEMP_UNSAMPLED:    "temp-unsampled",      // inside the grid, no row at this temp
  TEMP_BELOW_GRID:   "temp-below-grid",     // cooler brew than the profile models
  TEMP_ABOVE_GRID:   "temp-above-grid",     // hotter brew than the profile models
  AMBIGUOUS_TEMP:    "ambiguous-temp",      // several samples share it, none exact
  DOC_MISSING_TIME:  "doc-missing-time",    // doc row has no timeS to judge by
  SAMPLE_MISSING_TIME: "sample-missing-time",
  TIME_MISMATCH:     "time-mismatch",       // same temp, different cup
};

/**
 * What to DO about each reason, kept beside the codes rather than in the
 * audit's printer. A reason and its disposition are one fact; splitting
 * them means adding a code without a disposition drops it silently from
 * the coverage report, and the report still reads as complete. That is
 * the drifted-map shape audit-vocabulary-coverage.mjs exists to catch,
 * and there is no reason to reproduce it here.
 *
 * `worklist` — missing data. Write it and the point becomes comparable.
 * `excluded` — correctly uncompared, permanently. Comparing these would
 *   manufacture drift out of a scope decision or a different cup.
 */
export const UNPAIRABLE_CLASS = {
  [UNPAIRABLE.TEMP_UNSAMPLED]: { kind: "worklist",
    note: "inside the profile's grid — a sample here would pair" },
  [UNPAIRABLE.DOC_MISSING_TIME]: { kind: "worklist",
    note: "doc row has no timeS — add it and the point pairs exactly" },
  [UNPAIRABLE.AMBIGUOUS_TEMP]: { kind: "worklist",
    note: "several samples at that temp — a doc timeS disambiguates" },
  [UNPAIRABLE.SAMPLE_MISSING_TIME]: { kind: "worklist",
    note: "shipped sample has no timeS" },
  [UNPAIRABLE.TIME_MISMATCH]: { kind: "excluded",
    note: "same temp, different cup — correctly never compared" },
  [UNPAIRABLE.TEMP_BELOW_GRID]: { kind: "excluded",
    note: "cooler brew than the profile models — a scope decision, not drift" },
  [UNPAIRABLE.TEMP_ABOVE_GRID]: { kind: "excluded",
    note: "hotter brew than the profile models — a scope decision, not drift" },
};

/** Pair, with the reason when it declines. `reason` is null on success. */
export function pairWithReason(samples, pt) {
  const exact = samples.find(s => s.tempC === pt.tempC && s.timeS === pt.timeS);
  if (exact) return { sample: exact, reason: null };

  const byTemp = samples.filter(s => s.tempC === pt.tempC);
  if (byTemp.length === 0) {
    // Outside the grid vs inside it are different problems with different
    // fixes: a doc row below every sampled temperature describes a cooler
    // brew than the app models at all (hibiscus cold-brews at 25C for four
    // hours), which is a scope decision. A row INSIDE the envelope is just
    // a sample the profile hasn't taken yet.
    const temps = samples.map(s => s.tempC);
    const reason = !temps.length ? UNPAIRABLE.TEMP_UNSAMPLED
      : pt.tempC < Math.min(...temps) ? UNPAIRABLE.TEMP_BELOW_GRID
      : pt.tempC > Math.max(...temps) ? UNPAIRABLE.TEMP_ABOVE_GRID
      : UNPAIRABLE.TEMP_UNSAMPLED;
    return { sample: null, reason };
  }
  if (byTemp.length > 1)   return { sample: null, reason: UNPAIRABLE.AMBIGUOUS_TEMP };

  const s = byTemp[0];
  if (!pt.timeS) return { sample: null, reason: UNPAIRABLE.DOC_MISSING_TIME };
  if (!s.timeS)  return { sample: null, reason: UNPAIRABLE.SAMPLE_MISSING_TIME };

  const ratio = s.timeS / pt.timeS;
  if (Math.abs(ratio - 1) > TIME_TOLERANCE) {
    return { sample: null, reason: UNPAIRABLE.TIME_MISMATCH,
             detail: { docTimeS: pt.timeS, sampleTimeS: s.timeS } };
  }
  return { sample: s, reason: null };
}

export function pairSample(samples, pt) {
  return pairWithReason(samples, pt).sample;
}

/**
 * Compare prescribed vs shipped strengths across every pairable brew
 * point. Returns { diffs, unpairable, paired, unpaired, unpairableBy },
 * diffs sorted worst-first.
 *
 * `paired` / `unpairable` are what COVERAGE is computed from: a tool
 * that reports one severe drift is only reassuring if you also know
 * what fraction of the corpus it was able to look at.
 */
export function strengthDrift(EXTRACTION_PROFILES) {
  const diffs = [];
  const unpaired = [];
  let paired = 0;

  for (const f of readdirSync(DOCS).filter(x => x.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const id = [slug, slug.replace(/-/g, ""), `${slug}-black`, `${slug}-green`]
      .find(c => EXTRACTION_PROFILES[c]);
    if (!id) continue;
    const samples = EXTRACTION_PROFILES[id] || [];

    for (const pt of researchBrewPoints(resolve(DOCS, f))) {
      const { sample, reason, detail } = pairWithReason(samples, pt);
      if (!sample) {
        unpaired.push({ id, tempC: pt.tempC, timeS: pt.timeS, reason, ...detail && { detail } });
        continue;
      }
      paired++;
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

  const unpairableBy = {};
  for (const u of unpaired) unpairableBy[u.reason] = (unpairableBy[u.reason] || 0) + 1;

  return { diffs, unpairable: unpaired.length, paired, unpaired, unpairableBy };
}

/** Drift big enough to be a disagreement rather than rounding. */
export const SEVERE = 2;
export const severeDrift = EXTRACTION_PROFILES =>
  strengthDrift(EXTRACTION_PROFILES).diffs.filter(d => d.delta >= SEVERE);

/** Stable identity for a severe diff, for the ratchet list. */
export const driftKey = d => `${d.id}@${d.tempC}:${d.name}`;

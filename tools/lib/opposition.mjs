/* ──────────────────────────────────────────────────────────────
   tools/lib/opposition.mjs

   Single ingredients as natural experiments against our own opposition
   rules. If one herb's research prescribes two properties we treat as
   pulling against each other, at the SAME brew point, then one cup
   demonstrably holds both and the opposition is ours, not nature's. If
   the herb shows them at DIFFERENT brew points that proves nothing —
   the cup genuinely changes register as it extracts.

   That same-cup / different-cup split is the entire test. Without it
   any ingredient with a wide extraction arc looks contradictory.

   Coverage is DERIVED from perception.js rather than listed here. An
   earlier draft kept a hand-copied map of which pairs the engine had
   language for, which is precisely the thing that goes stale — and
   this session already lost time to two tools disagreeing because one
   copy of a rule drifted from the other.

   Shared by tools/audit-opposition.mjs and the guard in
   tests/research-parity.test.mjs.
   ────────────────────────────────────────────────────────────── */

import { readdirSync } from "fs";
import { resolve } from "path";
import { EFFECT_SYNERGIES, ALLOWED_PARADOXES, ANTAGONISMS } from "../../src/algo/perception.js";
import { researchBrewPoints, DOCS } from "./strength-drift.mjs";

/* Pairs worth ASKING about — "if a cup holds both of these, can the app
   say anything?" — not a claim that they cancel.

   The distinction matters because one entry here is the app's
   best-evidenced positive pairing. `energy + calm` reads as opposed to
   intuition, and the L-theanine literature is precisely the finding
   that it isn't: the combination improves attention where neither part
   does alone (Haskell et al. 2008, see docs/research/synergies.md).
   Its answer below is the `alert calm` synergy, and that is the right
   answer rather than a gap being papered over.

   `cooling` is defined in the vocabulary as "the settling-down register
   opposite warming". uplifting/grounding is here because pu-erh's doc
   calls uplifting "Opposite — pu-erh grounds, doesn't lift" — this is
   the test of whether that gloss generalises beyond pu-erh. It doesn't. */
export const OPPOSED = [
  ["warming", "cooling"], ["energy", "sleepy"], ["energy", "calm"],
  ["focus", "sleepy"], ["uplifting", "grounding"], ["energy", "soothing"],
];

export const pairKey = (a, b) => [a, b].sort().join("|");

/** Pairs the engine can already describe, read off the real rules. */
export function coveredPairs() {
  const covered = new Map();
  for (const [a, b] of ALLOWED_PARADOXES) covered.set(pairKey(a, b), "paradox tag");
  /* An antagonism is language too — stronger language, in fact. The
     question this audit asks is whether the app can SAY something when
     a cup holds two opposed effects, and "these are cancelling each
     other" is a better answer than "both will register". energy+sleepy
     moved from the paradox list to the antagonism one when the
     receptor evidence came in; without this line the audit would read
     that correction as a regression. */
  for (const { when: [a, b] } of ANTAGONISMS) covered.set(pairKey(a, b), "antagonism warning");
  for (const s of EFFECT_SYNERGIES) {
    const [a, b] = s.when;
    covered.set(pairKey(a, b), `synergy "${s.label}"`);
  }
  return covered;
}

/**
 * Opposed pairs a single ingredient's research puts in one cup.
 * Returns { sameCup, splitCup } keyed by pairKey; sameCup entries carry
 * the brew points so a reader can check the claim without re-deriving it.
 */
export function sameCupOppositions(EXTRACTION_PROFILES) {
  const sameCup = new Map(), splitCup = new Map();
  for (const f of readdirSync(DOCS).filter(x => x.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const id = [slug, slug.replace(/-/g, "")].find(c => EXTRACTION_PROFILES[c]);
    if (!id) continue;
    const pts = researchBrewPoints(resolve(DOCS, f));

    for (const [a, b] of OPPOSED) {
      const key = pairKey(a, b);
      const both = pts.filter(p => p.eff[a] > 0 && p.eff[b] > 0);
      if (both.length) {
        if (!sameCup.has(key)) sameCup.set(key, []);
        sameCup.get(key).push({
          id, a, b,
          points: both.map(p => ({ tempC: p.tempC, [a]: p.eff[a], [b]: p.eff[b] })),
        });
      } else if (pts.some(p => p.eff[a] > 0) && pts.some(p => p.eff[b] > 0)) {
        if (!splitCup.has(key)) splitCup.set(key, []);
        splitCup.get(key).push(id);
      }
    }
  }
  return { sameCup, splitCup };
}

/**
 * Same-cup oppositions the engine has NO language for — no synergy, no
 * paradox tag. These aren't lost data (nothing cancels effects; the
 * paradox list only drives an informational tag), they're cups whose
 * genuine tension the app never mentions.
 */
export function undescribedOppositions(EXTRACTION_PROFILES) {
  const covered = coveredPairs();
  const { sameCup } = sameCupOppositions(EXTRACTION_PROFILES);
  const out = [];
  for (const [key, hits] of sameCup) {
    if (covered.has(key)) continue;
    for (const h of hits) out.push({ key, ...h });
  }
  return out.sort((x, y) => (x.key + x.id).localeCompare(y.key + y.id));
}

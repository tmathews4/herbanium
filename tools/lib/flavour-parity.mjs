/* ──────────────────────────────────────────────────────────────
   tools/lib/flavour-parity.mjs

   Does the cup taste of what the research says it tastes of?

   The drift audit has compared EFFECTS in both directions since it was
   written, and never looked at flavours at all. That blind spot cost
   real work: sixteen flavours sat prescribed in §6 rows and absent
   from every profile, and they were found by hand through the
   unreachable audit rather than reported.

   TWO THINGS MAKE THIS DIFFERENT FROM THE EFFECTS CHECK.

   First, the docs don't use a controlled vocabulary for flavour the
   way they do for effects. A §6 flavours row reads
   [muscat-grape, gently sweet, deeper floral] — descriptive prose,
   not tokens. Comparing those literally reports ~95 findings that are
   almost all vocabulary mismatch. So only words the app's own flavour
   vocabulary knows are compared; the rest are prose and ignored.

   Second, flavour leaf words are near-synonyms in a way effect words
   aren't. Lapsang's doc says `smoky` and its profile says `smoked`;
   linden's doc says `honey-sweet` and its profile says `honey`. Those
   are the same claim, and a leaf-level comparison reports them as
   gaps. So the check runs at FAMILY level: the question is whether
   the cup expresses the register the research names, not whether it
   picked the same word for it.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { FAMILY_BY_FLAVOR } from "../../src/data/families.js";
import { DOCS } from "./strength-drift.mjs";

/** Flavour families a doc's §6 rows name, and those a profile shows. */
export function flavourFamilyGaps(EXTRACTION_PROFILES) {
  const gaps = [];
  for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    const id = [slug, slug.replace(/-/g, "")].find(c => EXTRACTION_PROFILES[c]);
    if (!id) continue;

    const src = readFileSync(resolve(DOCS, file), "utf8");
    const docWords = [...src.matchAll(/\|\s*flavors\s*\|\s*\[([^\]]*)\]/g)]
      .flatMap(m => m[1].split(",").map(x => x.trim().replace(/["']/g, "")))
      .filter(w => FAMILY_BY_FLAVOR[w]);
    if (!docWords.length) continue;

    const shown = new Set();
    for (const s of EXTRACTION_PROFILES[id]) {
      for (const f of s.flavors || []) if (FAMILY_BY_FLAVOR[f]) shown.add(FAMILY_BY_FLAVOR[f]);
      for (const f of s.flavorStrengths || []) if (FAMILY_BY_FLAVOR[f[0]]) shown.add(FAMILY_BY_FLAVOR[f[0]]);
    }

    const wanted = new Map();   // family -> the doc words asking for it
    for (const w of docWords) {
      const fam = FAMILY_BY_FLAVOR[w];
      if (shown.has(fam)) continue;
      if (!wanted.has(fam)) wanted.set(fam, new Set());
      wanted.get(fam).add(w);
    }
    for (const [family, words] of wanted) {
      gaps.push({ id, family, words: [...words] });
    }
  }
  return gaps.sort((a, b) => (a.id + a.family).localeCompare(b.id + b.family));
}

export const flavourGapKey = g => `${g.id}:${g.family}`;

/* tools/derive-blend-shares.mjs — what share of a blend each leaf takes.
 *
 * WHY THIS IS DERIVED AND NOT WRITTEN. "How much peppermint goes in a
 * blend" is a convention, and the app already owns 72 worked examples of
 * it. Guessing defaults when the shelf can be measured is the same
 * mistake as writing an expected-value table into a contract test: it
 * looks authoritative and drifts silently.
 *
 * Measured in CUP-DOSES, not grams. A teaspoon of chamomile is 1.0g and
 * a teaspoon of ginger is 2.5g, so a gram share would report the spice
 * as three times more present than the drinker experiences.
 *
 * Solo cups are skipped: a single-ingredient recipe says nothing about
 * ratio, and including them would drag every base toward 100%.
 *
 * Run it after changing curated blends:
 *   node tools/derive-blend-shares.mjs
 */
import { BLENDS, MOOD_BLENDS, PAIR_BLENDS } from "../src/data/blends.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { TSP_BY_CATEGORY } from "../src/units/units.js";

const MIN_APPEARANCES = 3;   // below this a median is one recipe's opinion

export function shelfShares() {
  const all = [
    ...BLENDS.map(b => b.ingredients),
    ...Object.values(MOOD_BLENDS).map(b => b.ings),
    ...Object.values(PAIR_BLENDS).map(b => b.ings),
  ].filter(Boolean);

  const seen = {};
  for (const ings of all) {
    const rows = ings.map(i => {
      const meta = INGREDIENTS[i.id];
      return meta
        ? { id: i.id, d: (i.g ?? 1) / (TSP_BY_CATEGORY[meta.category] || 1.5) }
        : null;
    }).filter(Boolean);
    if (rows.length < 2) continue;                 // solo says nothing about ratio
    const total = rows.reduce((s, r) => s + r.d, 0);
    if (!total) continue;
    for (const r of rows) (seen[r.id] ||= []).push(r.d / total);
  }

  const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  };
  return Object.entries(seen)
    .filter(([, v]) => v.length >= MIN_APPEARANCES)
    .map(([id, v]) => ({ id, n: v.length, share: median(v) }))
    .sort((a, b) => b.share - a.share);
}

/* Share -> a whole number of parts.
 *
 * Anchored so the shelf's typical BASE lands on 4, which leaves room
 * both under it (accents at 1-2) and over it (a deliberate 9-part lead)
 * inside the stepper's 1..9.
 *
 * THE FLOOR IS REAL AND WORTH KNOWING. One part against a 9-part lead
 * is 10% of the pot, and the shelf puts cloves at 3% and cardamom at 8%.
 * Whole parts simply cannot express a spice trim, so those land at 1 and
 * read heavier than the catalogue brews them. That is a limit of the
 * ratio language, not a bad measurement — weight mode is the answer for
 * spice work, and this tool prints which ingredients hit the floor so
 * the gap stays visible rather than looking like data.
 */
export const BASE_SHARE = 0.69;   // assam / rooibos — the shelf's typical base
export const BASE_PARTS = 4;

export const shareToParts = (share) =>
  Math.max(1, Math.min(9, Math.round(share * (BASE_PARTS / BASE_SHARE))));

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = shelfShares();
  console.log(`Derived from ${rows.length} ingredients appearing in ${MIN_APPEARANCES}+ curated blends\n`);
  console.log("  share   parts   n   ingredient");
  const atFloor = [];
  for (const r of rows) {
    const parts = shareToParts(r.share);
    const wanted = r.share * (BASE_PARTS / BASE_SHARE);
    if (parts === 1 && wanted < 0.75) atFloor.push({ ...r, wanted });
    console.log(`  ${(100 * r.share).toFixed(0).padStart(4)}%   ${parts}       ${String(r.n).padStart(2)}   ${r.id}`);
  }
  if (atFloor.length) {
    console.log(`\n  AT THE FLOOR — the shelf brews these lighter than one whole part can say:`);
    for (const r of atFloor) {
      console.log(`    ${r.id.padEnd(16)} shelf ${(100 * r.share).toFixed(0)}%, `
        + `wants ${r.wanted.toFixed(2)} parts, gets 1`);
    }
    console.log(`  Weight mode is the answer for these; the ratio language has a 10% floor.`);
  }
  console.log(`\n  Ingredients with fewer than ${MIN_APPEARANCES} appearances are not derived —`);
  console.log(`  see src/data/blendShares.js for how those are assigned.`);
}

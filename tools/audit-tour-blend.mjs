/* ──────────────────────────────────────────────────────────────
   tools/audit-tour-blend.mjs

   Which two-ingredient blend best teaches extraction?

   The Blend tour's example pot exists to make one thing visible: move
   the steep slider, watch the prediction change. That only lands if
   the blend actually MOVES across its steep window. Chamomile +
   peppermint was chosen by hand; this checks whether anything in the
   catalog teaches it better, and scores the current pair alongside
   the candidates so "keep what we have" is a real possible answer.

   Two things are scored, matching what the step is trying to show:

     swing   — the largest change in any single bar from the short end
               of the steep window to the long end. This is the "watch
               it move" signal. One bar moving a lot beats five bars
               drifting slightly; a user tracks one thing.

     arrival — a flavor or effect that is BELOW the visibility
               threshold early in the steep and above it later. That's
               the "something new appears" moment, which is the part
               that reads as chemistry rather than as a slider nudging
               a number.

   And two constraints, both learned the hard way:

     bars    — the number of family rows in Simple mode. The tour's
               prediction and slider steps have to fit the bars AND the
               temp/steep sliders on a phone pane (~490px); every extra
               row pushes that over. Candidates above MAX_BARS are
               rejected outright however well they score.

     safety  — no candidate that trips a safety note. The tour is a
               user's first blend; it should not be a caution.

   Run: node tools/audit-tour-blend.mjs [--top 12] [--all]
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import { resolveBlendAtBrew, computeBrewProfile } from "../src/algo/compose.js";
import { FAMILY_BY_FLAVOR, FAMILY_BY_EFFECT } from "../src/data/families.js";
import { checkIngredientInteractions } from "../src/data/safety.js";

// Matches SECONDARY_THRESHOLD in components/FlavorMap — the level a
// track has to reach to earn a row. Below it, nothing is drawn, which
// is exactly what makes a late crossing read as an arrival.
const VISIBLE = 0.3;
// The tour seeds 2 parts lead / 1 part accent (see ReverseCompose).
const LEAD_G = 2.0;
const ACCENT_G = 1.0;
// Row budget, calibrated against reality rather than guessed. This
// counts every flavor AND effect family over threshold at a single
// point in the sweep, which is not what the UI draws — the strips sort
// and cap. Chamomile + peppermint scores 12 here and renders as a
// 292px graph that we measured fitting beside the sliders, so 12 is
// the known-good ceiling. A guessed 6 rejected the very pair the app
// ships, which is how the miscalibration surfaced.
const MAX_BARS = 12;
// Sample count across the steep window. Nine is enough to catch a
// mid-steep crossing without the sweep taking minutes over ~10k pairs.
const SAMPLES = 9;
// "off" is the over-steep spoilage track. It has the biggest swings in
// the catalog by far, and scoring it would hand the tour a blend
// whose lesson is "steep longer and your tea goes bad". True, but not
// the first thing a new user should be taught, and not what the step's
// copy says. Still counted as a ROW — it takes up space on the phone.
const NOT_TEACHABLE = new Set(["off"]);

const args = process.argv.slice(2);
const TOP = Number((args.find(a => a.startsWith("--top")) || "").split("=")[1] || 12);
const SHOW_ALL = args.includes("--all");

const familyOf = (name, kind) =>
  (kind === "flavor" ? FAMILY_BY_FLAVOR : FAMILY_BY_EFFECT)[name] || null;

/** Roll a [[name, value]] list up into family → strongest value. */
function rollUp(pairs, kind) {
  const out = new Map();
  for (const [name, value] of pairs || []) {
    const fam = familyOf(name, kind);
    if (!fam) continue;
    out.set(fam, Math.max(out.get(fam) || 0, Number(value) || 0));
  }
  return out;
}

/** Predicted families at one point in the steep window. */
function sampleAt(ings, tempC, timeS) {
  const r = resolveBlendAtBrew(ings, tempC, timeS, tempC, timeS, false, false);
  return {
    flavor: rollUp(r.flavors, "flavor"),
    effect: rollUp((r.effects || []).map(e => [e.name ?? e[0], e.value ?? e[1]]), "effect"),
  };
}

function scorePair(aId, bId) {
  const meta = { a: INGREDIENTS[aId], b: INGREDIENTS[bId] };
  if (!meta.a || !meta.b) return null;
  // A first blend shouldn't come with a caution attached.
  if ((checkIngredientInteractions([aId, bId]) || []).length) return null;

  const ings = [
    { id: aId, g: LEAD_G, role: "lead" },
    { id: bId, g: ACCENT_G, role: "accent" },
  ];
  const profile = computeBrewProfile(ings);
  const tempC = profile.tempC;
  const [tMin, tMax] = profile.timeRange || [profile.timeS * 0.6, profile.timeS * 1.6];
  if (!(tMax > tMin)) return null;

  const series = [];
  for (let i = 0; i < SAMPLES; i++) {
    const timeS = tMin + ((tMax - tMin) * i) / (SAMPLES - 1);
    series.push(sampleAt(ings, tempC, timeS));
  }

  // Every family either axis ever shows, and the row count at the
  // busiest point — that's what has to fit on the phone.
  const seen = new Set();
  let peakRows = 0;
  for (const s of series) {
    let rows = 0;
    for (const kind of ["flavor", "effect"]) {
      for (const [fam, v] of s[kind]) {
        if (v >= VISIBLE) { seen.add(`${kind}:${fam}`); rows++; }
      }
    }
    peakRows = Math.max(peakRows, rows);
  }
  const reject = peakRows > MAX_BARS ? `too many bars (${peakRows} > ${MAX_BARS})`
    : peakRows < 2 ? "fewer than two visible bars — nothing to compare"
    : null;

  let swing = 0, swingOf = null;
  const arrivals = [];
  for (const key of seen) {
    const [kind, fam] = key.split(":");
    if (NOT_TEACHABLE.has(fam)) continue;
    const vals = series.map(s => s[kind].get(fam) || 0);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo > swing) { swing = hi - lo; swingOf = `${fam} (${kind})`; }
    // An arrival: invisible over the first third, visible by the last.
    const early = vals.slice(0, Math.ceil(SAMPLES / 3));
    const late = vals.slice(-Math.ceil(SAMPLES / 3));
    if (Math.max(...early) < VISIBLE && Math.max(...late) >= VISIBLE) {
      arrivals.push(`${fam} (${kind})`);
    }
  }

  return {
    pair: `${meta.a.name} + ${meta.b.name}`,
    ids: [aId, bId],
    reject,
    swing, swingOf, arrivals, peakRows,
    // An arrival is the rarer and more teachable event, so it carries
    // more than raw movement — but a pair with neither is useless.
    score: swing + arrivals.length * 1.5,
  };
}

const ids = Object.keys(INGREDIENTS);
const results = [];
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    let r = null;
    try { r = scorePair(ids[i], ids[j]); } catch { /* skip unresolvable pairs */ }
    if (r) results.push(r);
  }
}
const viable = results.filter(r => !r.reject);
viable.sort((x, y) => y.score - x.score);

const CURRENT = ["chamomile", "peppermint"];
const currentRow = results.find(r =>
  r.ids.includes(CURRENT[0]) && r.ids.includes(CURRENT[1]));

const fmt = (r, rank) =>
  `${String(rank).padStart(3)}. ${r.pair.padEnd(34)} `
  + `swing ${r.swing.toFixed(2)} on ${String(r.swingOf).padEnd(22)} `
  + `arrivals ${r.arrivals.length ? r.arrivals.join(", ") : "—"} `
  + `[${r.peakRows} bars]`;

console.log(`\nScored ${viable.length} viable pairs `
  + `(<= ${MAX_BARS} bars, no safety notes, ${SAMPLES} samples across the steep window)\n`);
console.log((SHOW_ALL ? viable : viable.slice(0, TOP))
  .map((r, i) => fmt(r, i + 1)).join("\n"));

console.log("\n— current tour blend —");
if (currentRow) {
  const rank = viable.indexOf(currentRow) + 1;
  console.log(fmt(currentRow, rank || "—"));
  console.log(currentRow.reject
    ? `\nRejected: ${currentRow.reject}. That's the constraint talking, not the blend — `
      + "if the current pair fails it, the constraint is probably wrong."
    : `\n${currentRow.pair} ranks ${rank} of ${viable.length}.`);
} else {
  console.log(`${CURRENT.join(" + ")} produced no result at all — check the ids.`);
}

/* ──────────────────────────────────────────────────────────────
   tools/audit-unreachable.mjs

   Which declared properties can a cup never actually show?

   An ingredient's page lists what the herb IS — its raw declared
   effects and flavours. The brewing view shows what a cup of it would
   PERCEPTUALLY be, after masking and fragile-effect attenuation. Those
   are different numbers on purpose, and mostly that's the point of the
   perception layer.

   It stops being the point when a listed property is unreachable at
   every temperature and time in the ingredient's OWN window. Then the
   two screens simply contradict each other: the profile promises
   something the app will never deliver. Ashwagandha lists soothing and
   warming and produces neither anywhere in 95–100°C / 10–20 min.

   This sweeps the whole catalogue and reports every such case, so the
   fix can be sized before it's chosen. It deliberately reports
   BORDERLINE properties too — ones that only just surface — because a
   property that peaks at 0.31 is technically reachable and practically
   invisible.

   Run: node tools/audit-unreachable.mjs [--all]
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { FAMILY_BY_EFFECT, FAMILY_BY_FLAVOR } from "../src/data/families.js";

// Matches SECONDARY_THRESHOLD in components/FlavorMap: below this a
// track earns no row, so the user never sees it.
const VISIBLE = 0.3;
const BORDERLINE = 0.6;
const STEPS = 5;          // 5 x 5 grid over the ingredient's own window
const SOLO_G = 3.0;

const SHOW_ALL = process.argv.includes("--all");
const nameOf = (e) => (Array.isArray(e) ? e[0] : e.name);
const valOf = (e) => Number(Array.isArray(e) ? e[1] : e.value) || 0;

function sweep(id) {
  const meta = INGREDIENTS[id];
  if (!meta || !meta.tempC || !meta.timeS) return null;
  const [t0, t1] = meta.tempC;
  const [s0, s1] = meta.timeS;
  const ings = [{ id, g: SOLO_G, role: "lead" }];

  // Best value each declared property reaches anywhere in the window.
  const peak = new Map();
  for (let a = 0; a < STEPS; a++) {
    for (let b = 0; b < STEPS; b++) {
      const tempC = t0 + ((t1 - t0) * a) / (STEPS - 1 || 1);
      const timeS = s0 + ((s1 - s0) * b) / (STEPS - 1 || 1);
      let r;
      try {
        r = resolveBlendAtBrew(ings, tempC, timeS, tempC, timeS, false, false);
      } catch { continue; }
      for (const e of r.effects || []) {
        const k = `effect:${nameOf(e)}`;
        peak.set(k, Math.max(peak.get(k) || 0, valOf(e)));
      }
      for (const f of r.flavors || []) {
        const k = `flavor:${nameOf(f)}`;
        peak.set(k, Math.max(peak.get(k) || 0, valOf(f)));
      }
    }
  }

  const declared = [
    ...(meta.effects || []).map(e => ({ kind: "effect", name: nameOf(e), declared: valOf(e) })),
    ...(meta.flavors || []).map(f => ({ kind: "flavor", name: f, declared: null })),
  ];

  const famOf = (d) =>
    (d.kind === "effect" ? FAMILY_BY_EFFECT : FAMILY_BY_FLAVOR)[d.name] || null;

  // Which families DID surface, and under which name. This is the
  // split that decides the fix: a suppressed property whose family is
  // already on screen under a sibling name isn't lost information, it's
  // the same idea declared twice — masking doing its job on redundant
  // data. A suppressed property whose whole family vanished is real
  // information the user never sees.
  const surfacedFamily = new Map();
  for (const d of declared) {
    const got = peak.get(`${d.kind}:${d.name}`) || 0;
    const fam = famOf(d);
    if (got >= VISIBLE && fam) surfacedFamily.set(`${d.kind}:${fam}`, d.name);
  }

  const unreachable = [];
  const borderline = [];
  for (const d of declared) {
    const got = peak.get(`${d.kind}:${d.name}`) || 0;
    const fam = famOf(d);
    const sibling = fam ? surfacedFamily.get(`${d.kind}:${fam}`) : null;
    if (got < VISIBLE) unreachable.push({ ...d, got, fam, sibling });
    else if (got < BORDERLINE) borderline.push({ ...d, got, fam, sibling });
  }
  return { id, name: meta.name, declared: declared.length, unreachable, borderline };
}

const rows = Object.keys(INGREDIENTS).map(sweep).filter(Boolean);
const withGaps = rows.filter(r => r.unreachable.length);
const withBorderline = rows.filter(r => r.borderline.length);

console.log(`\nSwept ${rows.length} ingredients over their own temp/time windows `
  + `(${STEPS}x${STEPS} grid, visible >= ${VISIBLE}).\n`);

console.log(`UNREACHABLE — declared but never visible at any brew (${withGaps.length} ingredients):\n`);
for (const r of withGaps.sort((a, b) => b.unreachable.length - a.unreachable.length)) {
  const list = r.unreachable
    .map(u => `${u.name}${u.declared != null ? ` (declared ${u.declared})` : ""} peaks ${u.got.toFixed(2)}`)
    .join(", ");
  console.log(`  ${r.name.padEnd(20)} ${r.unreachable.length}/${r.declared}  ${list}`);
}

if (SHOW_ALL) {
  console.log(`\nBORDERLINE — visible but never above ${BORDERLINE} (${withBorderline.length} ingredients):\n`);
  for (const r of withBorderline) {
    console.log(`  ${r.name.padEnd(20)} `
      + r.borderline.map(u => `${u.name} peaks ${u.got.toFixed(2)}`).join(", "));
  }
}

const allGaps = withGaps.flatMap(r => r.unreachable.map(u => ({ ...u, ing: r.name })));
const redundant = allGaps.filter(u => u.sibling);
const lost = allGaps.filter(u => !u.sibling);

console.log(`\n── REDUNDANT (${redundant.length}) — family already on screen under a sibling name`);
console.log("   Masking is working; the DATA says the same thing twice.\n");
for (const u of redundant.slice(0, 14)) {
  console.log(`  ${u.ing.padEnd(18)} ${u.name.padEnd(12)} suppressed, but "${u.sibling}" carries ${u.fam}`);
}
if (redundant.length > 14) console.log(`  ... and ${redundant.length - 14} more`);

console.log(`\n── LOST (${lost.length}) — the whole family vanished`);
console.log("   Real information the user can never see. This is the masking bug.\n");
for (const u of lost.slice(0, 20)) {
  console.log(`  ${u.ing.padEnd(18)} ${u.name.padEnd(12)}`
    + `${u.declared != null ? `declared ${u.declared}` : ""}  (family: ${u.fam || "unmapped"})`);
}
if (lost.length > 20) console.log(`  ... and ${lost.length - 20} more`);

const totalDeclared = rows.reduce((n, r) => n + r.declared, 0);
const totalGap = rows.reduce((n, r) => n + r.unreachable.length, 0);
console.log(`\n${totalGap} of ${totalDeclared} declared properties `
  + `(${((totalGap / totalDeclared) * 100).toFixed(1)}%) are unreachable across `
  + `${withGaps.length} of ${rows.length} ingredients.`);
console.log("Re-run with --all to include borderline cases.\n");

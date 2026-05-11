/* tests/range-sweep.audit.mjs

   Sample each curated traditional blend at five points across its
   brewing range — default, cooler+shorter, hotter+shorter,
   cooler+longer, hotter+longer — and print top moods + flavors at
   each. Lets the developer eyeball whether the cup's character
   holds across the envelope (or shifts the way the tradition would
   predict — gyokuro getting bitter when brewed too hot, etc.).

   Run: node tests/range-sweep.audit.mjs
*/

import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { BLENDS } from "../src/data/blends.js";

const traditions = BLENDS.filter(b => b.tradition);

const fmt = (arr, n = 3) => (arr || []).slice(0, n).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(", ");

for (const b of traditions) {
  const ings = b.ingredients;
  const baseT = b.tempC, baseS = b.timeS;
  const coolT = baseT - 10, hotT = baseT + 5;
  const shortS = Math.max(30, baseS - 60), longS = baseS + 60;

  console.log(`\n══ ${b.name} (${b.tradition})`);
  console.log(`   default: ${baseT}°C · ${baseS}s     declared moods: ${(b.effects || []).map(([k, v]) => `${k}:${v}`).join(", ")}`);
  console.log(`                                         declared flavor: ${b.flavor || "(none)"} / mood: ${b.mood || "(none)"}`);

  const points = [
    ["default",    baseT,  baseS],
    ["cooler",     coolT,  shortS],
    ["hotter",     hotT,   shortS],
    ["long+cool",  coolT,  longS],
    ["long+hot",   hotT,   longS],
  ];

  for (const [label, t, s] of points) {
    const r = resolveBlendAtBrew(ings, t, s, baseT, baseS, true, true);
    const moods = fmt(r.effects, 4);
    const flavors = fmt(r.flavors, 4);
    const balance = fmt(r.balance, 3);
    const warns = (r.warnings || [])
      .filter(w => w.kind !== "outsider" && !/is being over-pulled/.test(w.text || ""))
      .map(w => w.kind)
      .join(",");
    console.log(`   [${label.padEnd(10)}] ${String(t).padStart(3)}°C · ${String(s).padStart(3)}s  moods: ${moods}`);
    console.log(`                                  flavors: ${flavors}`);
    console.log(`                                  balance: ${balance}${warns ? `   ⚠ ${warns}` : ""}`);
  }
}
console.log();

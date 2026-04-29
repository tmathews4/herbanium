// Walk every traditional blend at its declared baseline and print
// the model's verdict — register, moods, flavors, per-axis bands —
// so we can compare against what literature/reviewers actually say
// about that cup. Useful for auditing voice + calibration on the
// blends users will most often drink.
//
// Run: node tools/check-traditionals.mjs

import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { BLENDS } from "../src/data/blends.js";

const traditionals = BLENDS.filter(b => b.tradition);

const BAR = "─".repeat(72);

for (const b of traditionals) {
  const brew = resolveBlendAtBrew(
    b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, true, b.effects,
  );
  console.log(`\n${BAR}`);
  console.log(`  ${b.name}  (${b.tradition})`);
  console.log(`  ${b.tempC}°C / ${Math.round(b.timeS / 60)}m${b.timeS % 60 ? ` ${b.timeS % 60}s` : ""}`);
  if (b.subtitle) console.log(`  → ${b.subtitle}`);
  console.log(BAR);
  for (const c of brew.perIngredient) {
    if (c.role === "catalyst") continue;
    const tz = c.tempZone?.id ?? "—";
    const sz = c.timeZone?.id ?? "—";
    const rz = c.registerZone?.id ?? "—";
    const sev = c.severity ?? "—";
    console.log(`    ${c.name.padEnd(18)} t:${tz.padEnd(6)} s:${sz.padEnd(7)} register:${rz.padEnd(12)} sev:${sev}`);
  }
  if (brew.moodSummary?.length)   console.log(`    moods:   ${brew.moodSummary.join(" · ")}`);
  if (brew.flavorSummary?.length) console.log(`    flavors: ${brew.flavorSummary.join(" · ")}`);
  if (brew.synergyTags?.length)   console.log(`    synergy: ${brew.synergyTags.join(", ")}`);
  const reds    = brew.perIngredient.filter(p => p.severity === "red").map(p => p.name);
  const yellows = brew.perIngredient.filter(p => p.severity === "yellow").map(p => p.name);
  if (reds.length)    console.log(`    >>> RED: ${reds.join(", ")}`);
  if (yellows.length) console.log(`    >>> YELLOW: ${yellows.join(", ")}`);
}

console.log(`\n${BAR}\nChecked ${traditionals.length} traditionals.\n`);

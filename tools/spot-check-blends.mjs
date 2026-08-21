// Spot-check the multi-axis model against literature/expectations
// at known brew points for representative blends. Prints per-axis
// register/temp/steep states for each ingredient + the blend
// summary, so we can read whether the resolver lands where the
// chemistry says it should.
//
// Run: node tools/spot-check-blends.mjs

import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { BLENDS } from "../src/data/blends.js";
import { INGREDIENTS } from "../src/data/ingredients.js";

const BAR = "─".repeat(72);

function checkBrew(label, blendId, tempC, timeS, expectation) {
  const b = BLENDS.find(x => x.id === blendId);
  if (!b) { console.log(`✗ ${label}: blend ${blendId} not found`); return; }
  const brew = resolveBlendAtBrew(
    b.ingredients, tempC, timeS, b.tempC, b.timeS, true, !!b.tradition
  );
  console.log(`\n${BAR}`);
  console.log(`  ${label}`);
  console.log(`  ${b.name}  ·  ${tempC}°C / ${Math.round(timeS / 60)}m${timeS % 60 ? ` ${timeS % 60}s` : ""}`);
  console.log(`  expect: ${expectation}`);
  console.log(BAR);
  for (const c of brew.perIngredient) {
    if (c.role === "catalyst") continue;
    const tz = c.tempZone?.id ?? "—";
    const sz = c.timeZone?.id ?? "—";
    const rz = c.registerZone?.id ?? "—";
    const sev = c.severity ?? "—";
    console.log(`    ${c.name.padEnd(18)} temp:${tz.padEnd(6)} steep:${sz.padEnd(7)} register:${rz.padEnd(12)} sev:${sev}`);
  }
  // Aggregate signal
  const reds = brew.perIngredient.filter(p => p.severity === "red").map(p => p.name);
  const yellows = brew.perIngredient.filter(p => p.severity === "yellow").map(p => p.name);
  if (reds.length)    console.log(`    >>> RED: ${reds.join(", ")}`);
  if (yellows.length) console.log(`    >>> YELLOW: ${yellows.join(", ")}`);
  if (!reds.length && !yellows.length) console.log(`    >>> all green`);
  if (brew.moodSummary?.length)   console.log(`    moods: ${brew.moodSummary.join(" · ")}`);
  if (brew.flavorSummary?.length) console.log(`    flavors: ${brew.flavorSummary.join(" · ")}`);
}

// Earl Grey — Ceylon + bergamot. The 1830s British canonical brew
// is 95°C / 4 min. Hot + long should over-pull both leaf and peel.
checkBrew(
  "Earl Grey, canonical British brew",
  "earl-grey", 95, 240,
  "Ceylon balanced (warm+medium), bergamot balanced. Cup reads as uplifting + energy + calm in balance. No reds.",
);
checkBrew(
  "Earl Grey, pushed past comfortable",
  "earl-grey", 100, 480,
  "Ceylon over-steeped (hot+over → overpulled), bergamot likely past its 240s window too. Cup tannic and pith-bitter.",
);
checkBrew(
  "Earl Grey, cool + short",
  "earl-grey", 88, 90,
  "Ceylon cool/short → aromatic, bergamot cool/short → aromatic. Cup reads as a light Earl Grey — uplifting forward, calm gentle.",
);

// Moroccan Mint — gunpowder + spearmint. Maghrebi tradition: 90°C / 3 min.
// Spearmint floor was lowered to 85°C for carvone preservation.
checkBrew(
  "Moroccan Mint, Maghrebi tradition",
  "moroccan", 90, 180,
  "Gunpowder warm/medium → balanced, spearmint cool/short → aromatic. Cup reads as Maghrebi-bright minty cooling.",
);
checkBrew(
  "Moroccan Mint, full-boil long-pull",
  "moroccan", 100, 360,
  "Gunpowder hot+over (overpulled tannin), spearmint hot+long → tonic. Cup reads tannic.",
);

// Tom Foolery — gunpowder + spearmint + tulsi. Maker-special at 80°C / 2:30.
checkBrew(
  "Tom Foolery, declared default",
  "exp-tom-foolery", 80, 150,
  "Gunpowder cool/short, spearmint cool/short, tulsi cool/short. All aromatic. Cup is bright + focus-leaning.",
);

// Apfeltee — Bavarian winter cup. Dried apple + orange peel + cinnamon + cloves.
checkBrew(
  "Apfeltee, Bavarian standard",
  "apfeltee", 97, 360,
  "Apple warm/medium → balanced, orange-peel warm/medium → balanced. Comfort + warming + soothing.",
);
checkBrew(
  "Apfeltee, way over",
  "apfeltee", 100, 720,
  "Apple long but forgiving, orange-peel over (pith bitter), cinnamon over. Cup tightens.",
);

// Lemon-Ginger Settle — citrus + warming digestive
checkBrew(
  "Lemon-Ginger Settle, baseline",
  "exp-lemon-ginger-settle", 100, 360,
  "Lemon-peel warm/medium → balanced, ginger hot/medium → balanced. Cup digestive + uplifting.",
);

// Single-ingredient at meaningful inflection — confirm tulsi's
// new short-steep cup reads as aromatic, not under.
checkBrew(
  "Tulsi-only, 95°C / 3 min (new short-cup territory)",
  "tulsi-doorstep", 95, 180,
  "Tulsi warm/short → aromatic. Cup reads bright top-spice; calm and uplifting both gentle.",
);
checkBrew(
  "Tulsi-only, 100°C / 12 min (deep tonic)",
  "tulsi-doorstep", 100, 720,
  "Tulsi over-pull (past its 720 threshold). Should read RED. Cup tannic-medicinal.",
);
checkBrew(
  "Tulsi-only, 75°C / 90 sec (cold-and-quick)",
  "tulsi-doorstep", 75, 90,
  "Tulsi temp under (75°C below its 85°C floor). Should read RED on temp axis. Cup faint.",
);

// Garden Court — Darjeeling-based "Earl Grey gone botanical"
checkBrew(
  "Garden Court, Darjeeling base",
  "exp-garden-court", 90, 180,
  "Darjeeling warm/short → aromatic, bergamot warm/short → aromatic, rose warm/short → aromatic. Cup reads as a light, fragrant Earl-Gray-meets-Darjeeling.",
);

console.log("\n" + BAR);
console.log("Spot-check complete.\n");

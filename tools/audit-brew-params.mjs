/* Does the app's brewing advice match its own research?
   See tools/lib/brew-params.mjs for what counts as a difference.
   Run: node tools/audit-brew-params.mjs */
import { INGREDIENTS } from "../src/data/ingredients.js";
import { outsideResearchedRange } from "./lib/brew-params.mjs";

const rows = outsideResearchedRange(INGREDIENTS);
const above = rows.filter(r => r.direction === "above");
const below = rows.filter(r => r.direction === "below");

console.log(`\nBREW PARAMETERS — app range vs researched range\n`);
console.log(`ABOVE the researched ceiling (${above.length}) — the app recommends a`);
console.log(`brew its own research doesn't support:\n`);
for (const r of above) {
  console.log(`  ${r.id.padEnd(14)} ${r.axis.padEnd(5)} doc [${r.doc}]  app [${r.app}]`);
}
console.log(`\nBELOW the researched floor (${below.length}) — a lighter option than the`);
console.log(`research documents; usually harmless, listed for completeness:\n`);
for (const r of below) {
  console.log(`  ${r.id.padEnd(14)} ${r.axis.padEnd(5)} doc [${r.doc}]  app [${r.app}]`);
}
console.log(`\nRanges narrower than the research are editorial and not reported.\n`);

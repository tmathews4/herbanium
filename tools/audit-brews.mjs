/* ──────────────────────────────────────────────────────────────
   tools/audit-brews.mjs

   Smoke-tests resolveBlendAtBrew at varied (tempC, timeS) points
   for a handful of catalog-known blends, then prints the algorithm
   output alongside literature-derived expectations so we can eyeball
   whether the readings track real-world brew behavior.

   This is not a CI test (qualitative, not pass/fail). Re-run with:
     node tools/audit-brews.mjs
   ────────────────────────────────────────────────────────────── */

import { BLENDS } from "../src/data/blends.js";
import { resolveBlendAtBrew } from "../src/algo/compose.js";

const findBlend = (id) => BLENDS.find(b => b.id === id);

// Each case: { blendId, tempC, timeS, expectations: [string, ...] }
// Expectations are literature-derived predictions, not implementation
// details — what a tea person would expect to feel/taste.
const CASES = [
  {
    label: "Sencha at 70°C / 60s — proper Japanese low-temp brew",
    blendId: "sencha-properly", tempC: 70, timeS: 60,
    expect: [
      "amino-acid forward: focus and calm should both register",
      "minimal bitterness — low temp keeps catechins out",
      "vegetal/grassy/umami flavors lead",
    ],
  },
  {
    label: "Sencha at 85°C / 90s — slightly hot, slightly long",
    blendId: "sencha-properly", tempC: 85, timeS: 90,
    expect: [
      "bitterness creeps in (catechin extraction)",
      "focus still registers but reading should soften",
      "vegetal still present, edge of astringency",
    ],
  },
  {
    label: "Sencha at 100°C / 240s — pushed past the cliff",
    blendId: "sencha-properly", tempC: 100, timeS: 240,
    expect: [
      "high bitterness — EGCG/tannin pull heavy",
      "focus blunted, calm reduced",
      "amino sweetness should have collapsed",
    ],
  },
  {
    label: "Hojicha at 95°C / 30s — proper roasted-green prep",
    blendId: "hojicha-evening", tempC: 95, timeS: 30,
    expect: [
      "low caffeine, soothing/comfort register",
      "roasted/caramel/nutty flavors lead",
      "essentially zero bitterness — roasting destroyed catechins",
    ],
  },
  {
    label: "Hojicha at 100°C / 240s — long boil, the forgiving overpull",
    blendId: "hojicha-evening", tempC: 100, timeS: 240,
    expect: [
      "still soothing — hojicha is famously non-bitter even overpulled",
      "roasted notes intensify",
      "balance shouldn't show much bitter even now",
    ],
  },
  {
    label: "Shou Pu-erh at 100°C / 30s — short pour (gongfu first infusion)",
    blendId: "shou-puerh", tempC: 100, timeS: 30,
    expect: [
      "digestive and grounding clean and led",
      "earthy/woody/dark flavors dominant",
      "low bitterness — short pour is the point",
    ],
  },
  {
    label: "Shou Pu-erh at 100°C / 300s — over-pulled long western brew",
    blendId: "shou-puerh", tempC: 100, timeS: 300,
    expect: [
      "bitterness should creep up materially",
      "earthy still leads, but with astringent edge",
      "digestive read can survive but with caveats",
    ],
  },
  {
    label: "Wuyi Pine Smoke at 100°C / 240s — full lapsang prep",
    blendId: "wuyi-smoke", tempC: 100, timeS: 240,
    expect: [
      "smoky dominates — phenols extract aggressively",
      "warming/energy register on the effect side",
      "moderate bitterness from black-tea catechins",
    ],
  },
  {
    label: "Wuyi Pine Smoke at 90°C / 90s — low and short",
    blendId: "wuyi-smoke", tempC: 90, timeS: 90,
    expect: [
      "smoky still leads (phenols extract easy at any temp)",
      "less warming dominance, lower bitterness",
      "leaf may register as out-of-range (lapsang baseline 100°C)",
    ],
  },
  {
    label: "Moroccan Mint (gunpowder + spearmint) at 90°C / 180s",
    blendId: "moroccan", tempC: 90, timeS: 180,
    expect: [
      "menthol-driven cooling and digestive both lead",
      "minty + grassy flavors; sweetness traditional but not in our recipe",
      "low bitterness if the gunpowder is rinsed (we don't model rinsing)",
    ],
  },
  // ── New random blends added for the second audit ──
  {
    label: "Masala Chai at default 100°C / 240s — full-boil simmer prep",
    blendId: "chai", tempC: 100, timeS: 240,
    expect: [
      "warming and energy both lead — black tea + spice synergy",
      "spiced flavors dominant (cinnamon/cardamom/clove/ginger)",
      "moderate bitter from long-boiled assam, partially masked by sweet/spice",
    ],
  },
  {
    label: "All-Heal (chamomile + valerian + lemon balm) at 95°C / 600s — long-steep sleep blend",
    blendId: "all-heal", tempC: 95, timeS: 600,
    expect: [
      "sleepy and calm both leading — sedative stack",
      "soothing should register; floral + honey on flavors",
      "low bitterness — herbal stack, no catechins",
      "synergy tag possible (calm + sleepy → deepens sedation)",
    ],
  },
  {
    label: "All-Heal at 95°C / 240s — short-steeped, less sedative",
    blendId: "all-heal", tempC: 95, timeS: 240,
    expect: [
      "sleepy reduced relative to long steep, calm still present",
      "valerian under-extracts at short time (root, slow release)",
      "still no bitter (herbal stack)",
    ],
  },
  {
    label: "Golden Milk at 100°C / 480s — turmeric + spice slow simmer",
    blendId: "golden-milk", tempC: 100, timeS: 480,
    expect: [
      "warming dominant; grounding and digestive supporting",
      "spiced/earthy/peppery flavors",
      "no bitter from herbs; turmeric contributes earthy depth",
    ],
  },
];

function fmtList(pairs) {
  if (!pairs || pairs.length === 0) return "—";
  return pairs.map(([k, v]) => `${k} ${v}`).join("  ");
}

function fmtBalance(balance) {
  if (!balance || balance.length === 0) return "—";
  return balance
    .filter(b => b.value > 0)
    .map(b => `${b.tag} ${b.value}`)
    .join("  ");
}

console.log("\nBrew audit — algorithm output vs literature expectations\n");

for (const c of CASES) {
  const blend = findBlend(c.blendId);
  if (!blend) {
    console.log(`(missing blend "${c.blendId}", skipping)\n`);
    continue;
  }

  const baseline = blend.tempC;
  const baseTime = blend.timeS;
  const out = resolveBlendAtBrew(
    blend.ingredients, c.tempC, c.timeS,
    baseline, baseTime, true, !!blend.tradition,
    blend.effects
  );

  console.log("─".repeat(74));
  console.log(c.label);
  console.log(`  blend: ${blend.name}  (baseline ${baseline}°C / ${baseTime}s)`);
  console.log();
  console.log(`  algorithm:`);
  console.log(`    effects:  ${fmtList(out.effects)}`);
  console.log(`    flavors:  ${fmtList(out.flavors)}`);
  console.log(`    balance:  ${fmtBalance(out.balance)}`);
  if (out.warnings && out.warnings.length > 0) {
    console.log(`    warnings: ${out.warnings.map(w => w.kind || w.tag || w.msg || JSON.stringify(w)).join("; ")}`);
  }
  if (out.outsiders && out.outsiders.length > 0) {
    console.log(`    out-of-range leaf(s): ${out.outsiders.join(", ")}`);
  }
  console.log();
  console.log(`  literature expects:`);
  for (const e of c.expect) console.log(`    • ${e}`);
  console.log();
}

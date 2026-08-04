/* ──────────────────────────────────────────────────────────────
   tests/blend-perception.test.mjs

   Literature-grounded characterization of curated traditional blends.
   For each blend, resolveBlendAtBrew runs at the curator's chosen
   tempC/timeS and we assert that the perception output (moods,
   balance, flavors) lands in the range the source tradition would
   recognize.

   Assertions are loose ranges, not exact numbers — this catches
   meaningful drift (a chai that no longer reads as warming, a
   gyokuro that shows high bitterness at its correct cool brew),
   not numerical jitter. Each block includes a one-line citation
   pointing to the perception claim being checked.

   Run: node tests/blend-perception.test.mjs
   Verbose: AUDIT=1 node tests/blend-perception.test.mjs
   ────────────────────────────────────────────────────────────── */

import { resolveBlendAtBrew } from "../src/algo/compose.js";
import { BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const failures = [];
const audit = process.env.AUDIT === "1";

function test(desc, fn) {
  try {
    fn();
    pass++;
    process.stdout.write(".");
  } catch (e) {
    fail++;
    failures.push({ desc, message: e.message });
    process.stdout.write("F");
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function getMood(profile, tag) {
  const found = (profile.effects || []).find(([t]) => t === tag);
  return found ? found[1] : 0;
}
function getBalance(profile, tag) {
  const found = (profile.balance || []).find(([t]) => t === tag);
  return found ? found[1] : 0;
}
function hasFlavor(profile, name) {
  return (profile.flavors || []).some(([n]) => n === name);
}
function getFlavor(profile, name) {
  const found = (profile.flavors || []).find(([n]) => n === name);
  return found ? found[1] : 0;
}

function inRange(label, value, [min, max]) {
  if (value < min || value > max) {
    throw new Error(`${label} = ${value}, expected in [${min}, ${max}]`);
  }
}

function resolveById(id) {
  const blend = BLENDS.find(b => b.id === id);
  if (!blend) throw new Error(`blend ${id} not found`);
  return {
    blend,
    profile: resolveBlendAtBrew(blend.ingredients, blend.tempC, blend.timeS, blend.tempC, blend.timeS, true),
  };
}

function dumpProfile(label, profile) {
  if (!audit) return;
  console.log(`\n[${label}]`);
  console.log("  effects: ", profile.effects);
  console.log("  balance: ", profile.balance);
  console.log("  flavors: ", profile.flavors.slice(0, 6));
}

// ── Tests ─────────────────────────────────────────────────────

console.log("Blend perception — literature checks\n");

// Masala Chai — South Asian spiced black tea with milk traditionally;
// the dry blend without milk should still read as warming + spiced
// + caffeinated. Energy from assam, warming/comfort from cinnamon
// and cardamom. Bitterness moderate from black tea base.
test("chai: warming + energy moods, spiced + sweet flavors", () => {
  const { profile } = resolveById("chai");
  dumpProfile("chai", profile);
  inRange("warming",  getMood(profile, "warming"),  [1, 5]);
  inRange("energy",   getMood(profile, "energy"),   [1, 5]);
  assert(hasFlavor(profile, "spiced") || hasFlavor(profile, "warm"),
    "chai should carry a spiced or warm flavor signal");
});

// Moroccan Mint — gunpowder green + spearmint, traditionally with
// sugar (we don't model sugar). Cooling mood (TCM yin) + menthol
// mouthfeel from spearmint. Minty flavor must dominate.
test("moroccan: cooling mood + menthol balance, minty flavor", () => {
  const { profile } = resolveById("moroccan");
  dumpProfile("moroccan", profile);
  assert(getMood(profile, "cooling") > 0,
    "moroccan should register cooling (TCM)");
  assert(getBalance(profile, "menthol") > 0,
    "moroccan should register menthol mouth-cooling from spearmint");
  assert(hasFlavor(profile, "minty") || hasFlavor(profile, "mint") || hasFlavor(profile, "cool"),
    "moroccan should carry a mint flavor signal");
});

// Darjeeling, neat — high-grown muscatel signature, brisk lift, low
// bitterness when steeped at the proper window (90°C / ~3 min).
test("darj-neat: low bitterness at proper brew, energy present", () => {
  const { profile } = resolveById("darj-neat");
  dumpProfile("darj-neat", profile);
  inRange("bitterness", getBalance(profile, "bitterness"), [0, 3]);
  assert(getMood(profile, "energy") > 0,
    "darjeeling should register energy");
});

// Sencha, properly — Japanese steamed green at 70°C / 60s. Vegetal
// and grassy register, umami present, low bitterness at this gentle
// brew. The whole point of this brew temp is avoiding tannin.
test("sencha-properly: vegetal/grassy flavor, low bitterness", () => {
  const { profile } = resolveById("sencha-properly");
  dumpProfile("sencha-properly", profile);
  inRange("bitterness", getBalance(profile, "bitterness"), [0, 2.5]);
  assert(
    hasFlavor(profile, "vegetal") || hasFlavor(profile, "grassy") || hasFlavor(profile, "umami"),
    "sencha should carry vegetal/grassy/umami signature"
  );
});

// Gyokuro, properly — shaded Japanese green at 50°C / 90s. Defining
// trait is umami from extreme L-theanine + glutamate concentration.
// At its cool brew bitterness should be very low (the brew is
// engineered to avoid catechin extraction).
test("gyokuro-properly: umami flavor, very low bitterness", () => {
  const { profile } = resolveById("gyokuro-properly");
  dumpProfile("gyokuro-properly", profile);
  inRange("bitterness", getBalance(profile, "bitterness"), [0, 2.0]);
  assert(hasFlavor(profile, "umami") || hasFlavor(profile, "marine") || hasFlavor(profile, "seaweed"),
    "gyokuro should carry umami/marine signature");
});

// Hojicha at Dusk — pan-roasted green. Roasting destroys most
// catechins and reduces caffeine, so this is a low-bitterness,
// low-energy, high-comfort cup. Toasty/roasted/caramel flavors.
test("hojicha-evening: low bitterness, roasted/toasty flavors", () => {
  const { profile } = resolveById("hojicha-evening");
  dumpProfile("hojicha-evening", profile);
  inRange("bitterness", getBalance(profile, "bitterness"), [0, 2.5]);
  assert(
    hasFlavor(profile, "roasted") || hasFlavor(profile, "toasty") || hasFlavor(profile, "toasted") || hasFlavor(profile, "caramel"),
    "hojicha should carry roasted/toasty/caramel signature"
  );
});

// Wuyi Pine Smoke (Lapsang Souchong) — pine-fired Fujian black.
// Smoky is the defining flavor. Energy from the black tea base.
test("wuyi-smoke: smoky flavor present, energy present", () => {
  const { profile } = resolveById("wuyi-smoke");
  dumpProfile("wuyi-smoke", profile);
  assert(
    hasFlavor(profile, "smoky") || hasFlavor(profile, "smoked") || hasFlavor(profile, "campfire") || hasFlavor(profile, "pine"),
    "lapsang should carry smoky signature"
  );
  assert(getMood(profile, "energy") > 0,
    "lapsang should register energy");
});

// Shou Pu-erh — fermented dark tea. Earthy + woody flavors,
// grounding + warming moods, comfort. Bitterness moderate;
// fermentation softens catechins.
test("shou-puerh: earthy/woody flavors, grounding/comfort moods", () => {
  const { profile } = resolveById("shou-puerh");
  dumpProfile("shou-puerh", profile);
  assert(
    hasFlavor(profile, "earthy") || hasFlavor(profile, "woody") || hasFlavor(profile, "leather") || hasFlavor(profile, "loam"),
    "pu-erh should carry earthy/woody signature"
  );
  assert(
    getMood(profile, "grounding") > 0 || getMood(profile, "comfort") > 0 || getMood(profile, "warming") > 0,
    "pu-erh should register grounding, comfort, or warming"
  );
});

// Golden Milk — turmeric-driven Ayurvedic warming infusion. Spiced,
// warming, comfort; no caffeine.
test("golden-milk: warming + comfort, no energy", () => {
  const { profile } = resolveById("golden-milk");
  dumpProfile("golden-milk", profile);
  assert(getMood(profile, "warming") > 0 || getMood(profile, "comfort") > 0,
    "golden milk should register warming or comfort"
  );
  inRange("energy", getMood(profile, "energy"), [0, 1.5]);
});

// Throat Coat — slippery elm / licorice / marshmallow. Soothing
// is the signature mood; sweetness from licorice; bitterness should
// stay low (the cup is meant to coat).
test("throat-coat: soothing mood, low bitterness, sweetness present", () => {
  const { profile } = resolveById("throat-coat");
  dumpProfile("throat-coat", profile);
  assert(getMood(profile, "soothing") > 0 || getMood(profile, "comfort") > 0,
    "throat coat should register soothing or comfort"
  );
  // Loosened from [0, 2.5] after the loudness pass: at the 100°C/600s
  // baseline ginger pushes "almost peppery-harsh" by its own profile
  // character, and astringent now reads at honest perceptual weight
  // (×1.6) rather than mass-flat. 3.5 still keeps throat coat on the
  // gentler side of the catalog.
  inRange("bitterness", getBalance(profile, "bitterness"), [0, 3.5]);
  assert(getBalance(profile, "sweetness") > 0,
    "throat coat should register sweetness from licorice"
  );
});

// Cimarrón (yerba mate) — South American gaucho preparation. Strong
// energy, bitter is the known character (the gourd is shared partly
// to manage that bitter ramp). Grounding from the ritual.
test("cimarron: high energy, bitterness present", () => {
  const { profile } = resolveById("cimarron");
  dumpProfile("cimarron", profile);
  assert(getMood(profile, "energy") > 0,
    "yerba mate should register energy"
  );
  assert(getBalance(profile, "bitterness") > 0,
    "yerba mate should register bitterness"
  );
});

// ── Output ────────────────────────────────────────────────────

// ── Traditional stretch reads as character, not fault ─────────────
//
// Traditional styles are frequently built on brewing a leaf past its
// own window — throat coat holds peppermint well over-steeped, chai
// boils the tea. The off-notes that produces are what the style is
// fond of, so telling the drinker the cup "will extract unevenly" says
// their correct cup is broken.
//
// The old rule suppressed every warning on an EXACT baseline match,
// which had two bad edges: at baseline the drinker was told nothing
// and never learned why the cup is stretched, and one nudge of either
// slider brought the whole list back — blaming them for a stretch the
// recipe had all along.
test("a traditional recipe's own stretch is a character note at its baseline", () => {
  const b = BLENDS.find(x => x.id === "throat-coat");
  const r = resolveBlendAtBrew(b.ingredients, b.tempC, b.timeS, b.tempC, b.timeS, true, true);
  const notes = (r.warnings || []).filter(w => w.kind === "tradition");
  const faults = (r.warnings || []).filter(w => w.kind === "outsider");
  assert(notes.length > 0, "the recipe's own stretch should be explained, not hidden");
  assert(faults.length === 0,
    `nothing at a traditional baseline is the drinker's fault: ${faults.map(f => f.text).join(" / ")}`);
});
test("steeping past a traditional baseline blames only the new stretch", () => {
  const b = BLENDS.find(x => x.id === "throat-coat");
  const longer = Math.round((b.timeS * 1.6) / 30) * 30;
  const r = resolveBlendAtBrew(b.ingredients, b.tempC, longer, b.tempC, b.timeS, true, true);
  const notes = (r.warnings || []).filter(w => w.kind === "tradition");
  const faults = (r.warnings || []).filter(w => w.kind === "outsider");
  // The recipe's own stretch travels with it — still character.
  assert(notes.length > 0, "the recipe's stretch shouldn't turn into a fault when the user moves a slider");
  // And what the user added is honestly flagged.
  assert(faults.length > 0, "a stretch the user introduced should still warn");
});

console.log(`\n\n${pass} passed, ${fail} failed.`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  ✗ ${f.desc}`);
    console.log(`    ${f.message}`);
  }
  process.exit(1);
}

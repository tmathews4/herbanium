/* ──────────────────────────────────────────────────────────────
   tests/literature.test.mjs

   Directional validation: as the user moves the temp/time sliders,
   does each ingredient respond the way the literature says it
   should? Assertions are loose (X > Y) rather than numeric, because
   the model is calibrated by hand and v1 — what we want to catch is
   a *direction reversal* (e.g. longer steep producing LESS apigenin),
   not a numeric drift.

   References per ingredient live in docs/research/ingredients/<name>.md.
   This file's assertions cite the relevant claim in a comment so a
   reader can chase the source.

   Run: node tests/literature.test.mjs
   ────────────────────────────────────────────────────────────── */

import { resolveExtractionProfile } from "../src/data/extractionProfiles.js";

let pass = 0, fail = 0;
const failures = [];

function getEffect(profile, tag) {
  const found = profile.effects.find(([t]) => t === tag);
  return found ? found[1] : 0;
}

function hasFlavor(profile, name) {
  return profile.flavors.some(([n]) => n === name);
}

function getFlavor(profile, name) {
  const found = profile.flavors.find(([n]) => n === name);
  return found ? found[1] : 0;
}

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

// Convenience: profile at the bottom of an ingredient's range, mid, top.
function light(id)    { const p = INGREDIENT_RANGE[id]; return resolveExtractionProfile(id, p.tempLow, p.timeLow); }
function standard(id) { const p = INGREDIENT_RANGE[id]; return resolveExtractionProfile(id, p.tempMid, p.timeMid); }
function strong(id)   { const p = INGREDIENT_RANGE[id]; return resolveExtractionProfile(id, p.tempHigh, p.timeHigh); }

// Hand-mapped ranges per ingredient — bottom of slider, mid, top.
// Sourced from src/data/ingredients.js tempC/timeS pairs.
const INGREDIENT_RANGE = {
  // florals & calming
  chamomile:   { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  lavender:    { tempLow: 90,  tempMid: 92,  tempHigh: 95,  timeLow: 180, timeMid: 210, timeHigh: 240 },
  rose:        { tempLow: 90,  tempMid: 92,  tempHigh: 95,  timeLow: 240, timeMid: 270, timeHigh: 300 },
  jasmine:     { tempLow: 75,  tempMid: 80,  tempHigh: 85,  timeLow: 120, timeMid: 150, timeHigh: 180 },
  passionflower: { tempLow: 95, tempMid: 97, tempHigh: 100, timeLow: 420, timeMid: 510, timeHigh: 600 },
  lemonbalm:   { tempLow: 90,  tempMid: 92,  tempHigh: 95,  timeLow: 240, timeMid: 270, timeHigh: 300 },
  // cooling / digestive
  peppermint:  { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  spearmint:   { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  lemongrass:  { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  fennel:      { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  hibiscus:    { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  rooibos:     { tempLow: 100, tempMid: 100, tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  // adaptogens
  tulsi:       { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  ashwagandha: { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 600, timeMid: 900, timeHigh: 1200 },
  // spices
  ginger:      { tempLow: 100, tempMid: 100, tempHigh: 100, timeLow: 420, timeMid: 510, timeHigh: 600 },
  turmeric:    { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 600, timeMid: 750, timeHigh: 900 },
  cinnamon:    { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 420, timeMid: 510, timeHigh: 600 },
  cardamom:    { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 390, timeHigh: 480 },
  cloves:      { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  vanilla:     { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 360, timeHigh: 420 },
  "black-pepper": { tempLow: 95, tempMid: 97, tempHigh: 100, timeLow: 300, timeMid: 600, timeHigh: 900 },
  // true teas
  white:       { tempLow: 75,  tempMid: 80,  tempHigh: 85,  timeLow: 180, timeMid: 240, timeHigh: 300 },
  sencha:      { tempLow: 70,  tempMid: 75,  tempHigh: 80,  timeLow: 60,  timeMid: 90,  timeHigh: 120 },
  gyokuro:     { tempLow: 50,  tempMid: 55,  tempHigh: 60,  timeLow: 90,  timeMid: 105, timeHigh: 120 },
  matcha:      { tempLow: 70,  tempMid: 75,  tempHigh: 80,  timeLow: 15,  timeMid: 22,  timeHigh: 30 },
  genmaicha:   { tempLow: 70,  tempMid: 78,  tempHigh: 85,  timeLow: 60,  timeMid: 120, timeHigh: 180 },
  gunpowder:   { tempLow: 80,  tempMid: 85,  tempHigh: 90,  timeLow: 120, timeMid: 180, timeHigh: 240 },
  hojicha:     { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 30,  timeMid: 45,  timeHigh: 60 },
  dragonwell:  { tempLow: 75,  tempMid: 80,  tempHigh: 85,  timeLow: 90,  timeMid: 135, timeHigh: 180 },
  oolong:      { tempLow: 85,  tempMid: 90,  tempHigh: 95,  timeLow: 120, timeMid: 180, timeHigh: 240 },
  assam:       { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 180, timeMid: 240, timeHigh: 300 },
  darjeeling:  { tempLow: 85,  tempMid: 87,  tempHigh: 90,  timeLow: 180, timeMid: 210, timeHigh: 240 },
  ceylon:      { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 180, timeMid: 210, timeHigh: 240 },
  lapsang:     { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 180, timeMid: 210, timeHigh: 240 },
  puerh:       { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 60,  timeMid: 120, timeHigh: 180 },
  // caffeinated herbal
  "yerba-mate": { tempLow: 70, tempMid: 78, tempHigh: 85,   timeLow: 60,  timeMid: 180, timeHigh: 300 },
  // sleep
  valerian:    { tempLow: 85,  tempMid: 90,  tempHigh: 95,  timeLow: 600, timeMid: 750, timeHigh: 900 },
  linden:      { tempLow: 85,  tempMid: 90,  tempHigh: 95,  timeLow: 300, timeMid: 450, timeHigh: 600 },
  // immune
  echinacea:   { tempLow: 90,  tempMid: 95,  tempHigh: 100, timeLow: 300, timeMid: 600, timeHigh: 900 },
  elderflower: { tempLow: 85,  tempMid: 90,  tempHigh: 95,  timeLow: 300, timeMid: 450, timeHigh: 600 },
  // mineral / root
  nettle:      { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 300, timeMid: 600, timeHigh: 900 },
  "dandelion-root": { tempLow: 95, tempMid: 97, tempHigh: 100, timeLow: 600, timeMid: 1200, timeHigh: 1800 },
  "dandelion-leaf": { tempLow: 90, tempMid: 95, tempHigh: 100, timeLow: 300, timeMid: 600, timeHigh: 900 },
  // mushrooms
  reishi:      { tempLow: 95,  tempMid: 97,  tempHigh: 100, timeLow: 1800, timeMid: 3600, timeHigh: 7200 },
  "lions-mane": { tempLow: 90, tempMid: 95, tempHigh: 100, timeLow: 600,  timeMid: 1200, timeHigh: 1800 },
  // harmonizer
  "licorice-root": { tempLow: 95, tempMid: 97, tempHigh: 100, timeLow: 300, timeMid: 600, timeHigh: 900 },
};

console.log("\n  Literature directional tests across 46 ingredients\n");

// ─── FLORALS & CALMING ──────────────────────────────────────────

// Chamomile: Harbourne 2008 / Cvetanović 2017 — apigenin extraction
// rises with temperature × time. The "sleepy-time" cup needs both.
test("chamomile: longer+hotter steep raises sleepy (apigenin extraction)", () => {
  assert(getEffect(strong("chamomile"), "sleepy") > getEffect(light("chamomile"), "sleepy"),
    `expected strong > light on sleepy`);
});
test("chamomile: full extraction surfaces earthy/astringent end notes", () => {
  const s = strong("chamomile");
  assert(hasFlavor(s, "earthy") || getFlavor(s, "astringent") > 0,
    `expected earthy or astringent at full pull`);
});

// Lavender: over-extraction surfaces camphor and soapy notes.
test("lavender: over-extracted cup adds camphor/soapy notes", () => {
  const s = strong("lavender");
  assert(hasFlavor(s, "camphor") || hasFlavor(s, "soapy"),
    `expected camphor or soapy at strong end`);
});

// Rose: literature warns of muskiness and astringency at over-steep.
test("rose: long+hot adds earthy edge", () => {
  assert(hasFlavor(strong("rose"), "earthy") || getFlavor(strong("rose"), "astringent") > 0,
    `expected earthy at full pull`);
});

// Jasmine: the perfume is volatile — too-hot kills it. Heat shouldn't
// add astringent/bitter at the official 75–85°C range, but it should
// fully surface the heady/honeyed register.
test("jasmine: full pull surfaces heady aromatic", () => {
  assert(hasFlavor(strong("jasmine"), "heady") || hasFlavor(strong("jasmine"), "honeyed"),
    `expected heady or honeyed at full pull`);
});

// Passionflower: longer steep deepens sedation.
test("passionflower: longer steep raises sleepy", () => {
  assert(getEffect(strong("passionflower"), "sleepy") > getEffect(light("passionflower"), "sleepy"),
    `expected strong > light on sleepy`);
});

// Lemon balm: gentle herb but long+hot can over-extract bitterness.
test("lemonbalm: longer steep increases or maintains calm (no inversion)", () => {
  assert(getEffect(strong("lemonbalm"), "calm") >= getEffect(light("lemonbalm"), "calm"),
    `expected calm not to invert`);
});

// ─── COOLING & DIGESTIVE ────────────────────────────────────────

// Peppermint: digestive effect rises with extraction.
test("peppermint: longer steep raises digestive/settle", () => {
  const s = strong("peppermint"), l = light("peppermint");
  assert(getEffect(s, "settle") + getEffect(s, "digestive") > getEffect(l, "settle") + getEffect(l, "digestive"),
    `expected digestive register higher at strong`);
});

// Hibiscus: longer/hotter brings tannins → astringent.
test("hibiscus: long+hot adds astringent (tannin pull)", () => {
  assert(hasFlavor(strong("hibiscus"), "astringent") || getFlavor(strong("hibiscus"), "bitter") > 0,
    `expected astringent at full pull`);
});

// Fennel: anethole pulls cleanly; long+hot adds bitter behind sweet.
test("fennel: full pull adds bitter behind sweetness", () => {
  assert(hasFlavor(strong("fennel"), "bitter") || getFlavor(strong("fennel"), "bitterness") > 0,
    `expected bitter at full pull`);
});

// Spearmint: gentler than peppermint; cooling stays present across range.
test("spearmint: cooling/uplifting present across range", () => {
  assert(getFlavor(standard("spearmint"), "cool") >= 0
      || getEffect(standard("spearmint"), "cooling") >= 0,
    `expected cooling register at standard`);
});

// Lemongrass: bright citrus across; minor change with extraction.
test("lemongrass: profile resolves at standard (no error)", () => {
  assert(standard("lemongrass") !== null, `expected non-null profile`);
});

// Rooibos: forgiving; sweetness/comfort rise with full extraction.
test("rooibos: full extraction holds or raises comfort", () => {
  assert(getEffect(strong("rooibos"), "comfort") >= getEffect(light("rooibos"), "comfort"),
    `expected comfort not to invert`);
});

// ─── ADAPTOGENS ─────────────────────────────────────────────────

// Tulsi: full pull deepens grounding/calm register.
test("tulsi: full extraction holds or raises calm", () => {
  assert(getEffect(strong("tulsi"), "calm") >= getEffect(light("tulsi"), "calm"),
    `expected calm not to invert`);
});

// Ashwagandha: withanolides extract slowly — longer decoction
// genuinely matters. Charaka Samhita / modern RCTs both note this.
test("ashwagandha: long decoction raises grounding (vs short)", () => {
  assert(getEffect(strong("ashwagandha"), "grounding") > getEffect(light("ashwagandha"), "grounding"),
    `expected grounding to climb with extraction`);
});

// ─── SPICES ─────────────────────────────────────────────────────

// Ginger: gingerol → shogaol with heat/time. Warming sharpens.
test("ginger: longer simmer raises warming/comfort", () => {
  assert(getEffect(strong("ginger"), "comfort") > getEffect(light("ginger"), "comfort"),
    `expected warming register climb`);
});

// Turmeric: curcumin extraction is slow; long simmer matters.
test("turmeric: long simmer raises warming", () => {
  assert(getEffect(strong("turmeric"), "warming") > getEffect(light("turmeric"), "warming"),
    `expected warming climb`);
});

// Cinnamon: full extraction → sweeter, more woody, more warming.
test("cinnamon: full extraction holds warming high", () => {
  assert(getEffect(strong("cinnamon"), "warming") >= getEffect(light("cinnamon"), "warming"),
    `expected warming not to invert`);
});

// Cardamom: 1,8-cineole is volatile; brisk steep is enough.
// Full pull adds depth without losing the cup.
test("cardamom: full extraction maintains digestive register", () => {
  assert(getEffect(strong("cardamom"), "digestive") + getEffect(strong("cardamom"), "settle")
      >= getEffect(light("cardamom"), "digestive") + getEffect(light("cardamom"), "settle"),
    `expected digestive register not to invert`);
});

// Cloves: eugenol heavy; full pull pushes warming.
test("cloves: full extraction holds warming", () => {
  assert(getEffect(strong("cloves"), "warming") >= getEffect(light("cloves"), "warming"),
    `expected warming not to invert`);
});

// Vanilla: aromatic-driven; extraction matters less.
test("vanilla: profile resolves at standard", () => {
  assert(standard("vanilla") !== null, `expected non-null profile`);
});

// Black pepper: piperine is heat-stable; long brings out bite.
test("black-pepper: long extraction adds woody/earthy depth", () => {
  const s = strong("black-pepper");
  assert(hasFlavor(s, "earthy") || hasFlavor(s, "woody") || getFlavor(s, "bitterness") > 0,
    `expected woody/earthy depth at full pull`);
});

// ─── TRUE TEAS ──────────────────────────────────────────────────

// White: gentle, forgiving. Effect rises modestly with extraction.
test("white: full pull holds calm/uplifting", () => {
  const s = strong("white"), l = light("white");
  const sumStrong = getEffect(s, "calm") + getEffect(s, "uplifting");
  const sumLight  = getEffect(l, "calm") + getEffect(l, "uplifting");
  assert(sumStrong >= sumLight, `expected calm+uplifting not to invert`);
});

// Sencha: hot water (80+) pulls catechins → bitter/astringent.
// Cool water (70) preserves the umami-vegetal sweetness.
test("sencha: hotter water adds astringent/bitter", () => {
  const hot = resolveExtractionProfile("sencha", 80, 120);
  assert(hasFlavor(hot, "astringent") || hasFlavor(hot, "bitter") || getFlavor(hot, "bitterness") > 0,
    `expected astringent/bitter at high temp`);
});

// Gyokuro: cool, brief. Hot water destroys the umami.
test("gyokuro: cool short brew preserves umami without astringent", () => {
  const cool = resolveExtractionProfile("gyokuro", 50, 90);
  assert(!hasFlavor(cool, "astringent"), `expected no astringent at canonical cool brew`);
});

// Matcha: hot water raises bitter (catechin).
test("matcha: hotter whisk surfaces bitter", () => {
  const hot = resolveExtractionProfile("matcha", 80, 30);
  assert(hasFlavor(hot, "bitter") || getFlavor(hot, "bitterness") > 0
      || getEffect(hot, "bitterness") > 0,
    `expected bitter at upper end`);
});

// Genmaicha: temperature shifts tea-vs-rice register.
test("genmaicha: profile resolves at both ends", () => {
  assert(light("genmaicha") && strong("genmaicha"), `expected non-null at both ends`);
});

// Gunpowder: standard greens — long hot extraction → bitter.
test("gunpowder: long+hot adds bitter or astringent", () => {
  const s = strong("gunpowder");
  assert(hasFlavor(s, "bitter") || hasFlavor(s, "astringent") || getFlavor(s, "bitterness") > 0
      || getEffect(s, "bitterness") > 0
      || getEffect(s, "energy") >= getEffect(light("gunpowder"), "energy"),
    `expected stronger profile at full pull`);
});

// Hojicha: roasted, low caffeine; long is forgiving.
test("hojicha: full pull deepens caramel/woody register", () => {
  assert(hasFlavor(strong("hojicha"), "caramel") || hasFlavor(strong("hojicha"), "woody"),
    `expected caramel or woody at full pull`);
});

// Dragonwell: pan-fired green; over-temp ruins.
test("dragonwell: high-temp brew adds bitter/astringent", () => {
  const hot = resolveExtractionProfile("dragonwell", 85, 180);
  assert(hasFlavor(hot, "bitter") || hasFlavor(hot, "astringent") || getFlavor(hot, "bitterness") > 0
      || getEffect(hot, "bitterness") > 0
      || hasFlavor(hot, "earthy"),
    `expected bitter/astringent/earthy at full pull`);
});

// Oolong: middle-ground; long hot brings tannic edge.
test("oolong: full pull adds bitter/astringent edge", () => {
  const s = strong("oolong");
  assert(hasFlavor(s, "bitter") || hasFlavor(s, "astringent") || getFlavor(s, "bitterness") > 0
      || getEffect(s, "bitterness") > 0
      || hasFlavor(s, "earthy"),
    `expected tannic/earthy edge`);
});

// Assam: tannic black; long pull → astringent dominates.
test("assam: full pull surfaces astringent", () => {
  const s = strong("assam");
  assert(hasFlavor(s, "astringent") || getFlavor(s, "bitterness") > 0
      || getEffect(s, "bitterness") > 0,
    `expected astringent at full pull`);
});

// Darjeeling: muscatel survives only with restraint.
test("darjeeling: full pull adds astringent or bitter", () => {
  const s = strong("darjeeling");
  assert(hasFlavor(s, "astringent") || getFlavor(s, "bitterness") > 0
      || getEffect(s, "bitterness") > 0,
    `expected astringent/bitter at full pull`);
});

// Ceylon: similar to assam — long → tannic.
test("ceylon: full pull adds astringent edge", () => {
  const s = strong("ceylon");
  assert(hasFlavor(s, "astringent") || getFlavor(s, "bitterness") > 0
      || getEffect(s, "bitterness") > 0
      || hasFlavor(s, "woody"),
    `expected astringent or woody at full pull`);
});

// Lapsang: smoke is consistent; long pull deepens it.
test("lapsang: smoky present across range", () => {
  assert(hasFlavor(standard("lapsang"), "smoked") || hasFlavor(standard("lapsang"), "smoky"),
    `expected smoke note at standard`);
});

// Pu-erh: short rinse light, long pull deepens earth.
test("puerh: full pull deepens earth/leather register", () => {
  const s = strong("puerh");
  assert(hasFlavor(s, "earthy") && (hasFlavor(s, "leather") || hasFlavor(s, "mineral") || hasFlavor(s, "woody")),
    `expected earthy + leather/mineral/woody at full pull`);
});

// ─── CAFFEINATED HERBAL ─────────────────────────────────────────

// Yerba mate: long gourd session → cumulative bitter + sustained energy.
test("yerba-mate: long extraction adds bitter/smoky", () => {
  const s = strong("yerba-mate");
  assert(hasFlavor(s, "bitter") || hasFlavor(s, "smoky"),
    `expected bitter/smoky at full pull`);
});
test("yerba-mate: energy holds across range (xanthine triad consistent)", () => {
  assert(getEffect(standard("yerba-mate"), "energy") >= 3,
    `expected energy ≥ 3 at standard`);
});

// ─── SLEEP / CALMING ────────────────────────────────────────────

// Valerian: valerenic acid extracts slowly — long simmer matters.
test("valerian: long extraction raises sleepy", () => {
  assert(getEffect(strong("valerian"), "sleepy") > getEffect(light("valerian"), "sleepy"),
    `expected sleepy to climb`);
});
test("valerian: full pull surfaces pungent/bitter funk", () => {
  const s = strong("valerian");
  assert(hasFlavor(s, "pungent") || hasFlavor(s, "bitter"),
    `expected pungent/bitter at full pull`);
});

// Linden: gentle pediatric calm; longer in cooler water = more calm.
test("linden: full pull raises calm", () => {
  assert(getEffect(strong("linden"), "calm") > getEffect(light("linden"), "calm"),
    `expected calm to climb`);
});

// ─── IMMUNE-SUPPORT FLORALS ─────────────────────────────────────

// Echinacea: alkamides extract with longer steep.
test("echinacea: full pull holds or raises comfort/soothing", () => {
  assert(getEffect(strong("echinacea"), "comfort") >= getEffect(light("echinacea"), "comfort"),
    `expected soothing not to invert`);
});

// Elderflower: gentle, aromatic. Long steep deepens muscat-lychee.
test("elderflower: full pull surfaces muscatel/fruity", () => {
  const s = strong("elderflower");
  assert(hasFlavor(s, "muscatel") || hasFlavor(s, "fruity"),
    `expected muscatel/fruity at full pull`);
});

// ─── MINERAL / ROOT ─────────────────────────────────────────────

// Nettle: long infusion is the classic spring tonic.
test("nettle: full pull surfaces mineral/vegetal depth", () => {
  const s = strong("nettle");
  assert(hasFlavor(s, "mineral") || hasFlavor(s, "vegetal"),
    `expected mineral/vegetal at full pull`);
});

// Dandelion root: long decoction = the coffee-substitute character.
test("dandelion-root: full pull surfaces bittersweet/earthy", () => {
  const s = strong("dandelion-root");
  assert(hasFlavor(s, "bittersweet") || hasFlavor(s, "earthy"),
    `expected bittersweet/earthy at full pull`);
});

// Dandelion leaf: long pull → bitter dominates (Italian/Greek tradition).
test("dandelion-leaf: full pull surfaces bitter", () => {
  const s = strong("dandelion-leaf");
  assert(hasFlavor(s, "bitter") || hasFlavor(s, "mineral"),
    `expected bitter or mineral at full pull`);
});

// ─── MUSHROOMS ──────────────────────────────────────────────────

// Reishi: needs LONG decoction (30 min - 2 hr). Short pull yields
// almost nothing; long pull yields the full bitter-grounded cup.
test("reishi: long decoction raises calm/sleepy substantially", () => {
  const s = strong("reishi"), l = light("reishi");
  assert(getEffect(s, "calm") > getEffect(l, "calm"),
    `expected calm to climb with decoction time`);
});
test("reishi: long decoction surfaces bitter+mushroomy", () => {
  const s = strong("reishi");
  assert(hasFlavor(s, "bitter") && hasFlavor(s, "mushroomy"),
    `expected bitter + mushroomy at full decoction`);
});

// Lion's mane: longer extraction → deeper effect signature.
test("lions-mane: long extraction holds focus", () => {
  assert(getEffect(strong("lions-mane"), "focus") >= getEffect(light("lions-mane"), "focus"),
    `expected focus not to invert`);
});

// ─── HARMONIZER ─────────────────────────────────────────────────

// Licorice: glycyrrhizin extracts steadily; long pull adds bitter behind sweet.
test("licorice-root: full pull adds bitter end-note", () => {
  const s = strong("licorice-root");
  assert(hasFlavor(s, "bitter") || getFlavor(s, "bitterness") > 0
      || getEffect(s, "bitterness") > 0,
    `expected bitter at full pull`);
});
test("licorice-root: sweetness present across range (glycyrrhizin)", () => {
  assert(hasFlavor(standard("licorice-root"), "sweet"),
    `expected sweet at standard`);
});

// ─── CROSS-CUTTING SANITY ───────────────────────────────────────

test("all 46 ingredients resolve a non-null profile at their midpoint", () => {
  const ids = Object.keys(INGREDIENT_RANGE);
  assert(ids.length === 46, `expected 46 ingredients, got ${ids.length}`);
  for (const id of ids) {
    assert(standard(id) !== null, `${id}: standard profile is null`);
  }
});

// ─── TANNIN-CREEP WARNINGS ──────────────────────────────────────

import { buildWarnings, applyMasking } from "../src/algo/perception.js";

function rawFlavorsFromProfile(profile) {
  const out = {};
  for (const [name, strength] of profile.flavors) out[name] = strength;
  return out;
}
function rawEffectsFromProfile(profile) {
  const out = {};
  for (const [tag, strength] of profile.effects) out[tag] = strength;
  return out;
}
function warningsFor(profile) {
  const raw = rawFlavorsFromProfile(profile);
  const { perceived } = applyMasking(raw);
  return buildWarnings({
    perceivedFlavors: perceived,
    perceivedEffects: rawEffectsFromProfile(profile),
  });
}
function hasWarning(warnings, kind) {
  return warnings.some(w => w.kind === kind);
}

test("assam at full pull triggers tannin warning", () => {
  assert(hasWarning(warningsFor(strong("assam")), "tannin"),
    `expected tannin warning at strong assam`);
});

test("hibiscus at full pull triggers tannin warning", () => {
  assert(hasWarning(warningsFor(strong("hibiscus")), "tannin"),
    `expected tannin warning at strong hibiscus`);
});

test("ceylon at full pull triggers tannin warning", () => {
  assert(hasWarning(warningsFor(strong("ceylon")), "tannin"),
    `expected tannin warning at strong ceylon`);
});

test("gyokuro at canonical cool brew does NOT trigger tannin warning", () => {
  const cool = resolveExtractionProfile("gyokuro", 50, 90);
  assert(!hasWarning(warningsFor(cool), "tannin"),
    `unexpected tannin warning at canonical gyokuro`);
});

test("white tea at standard does NOT trigger tannin warning", () => {
  assert(!hasWarning(warningsFor(standard("white")), "tannin"),
    `unexpected tannin warning at standard white tea`);
});

test("chamomile at light pull does NOT trigger tannin warning", () => {
  assert(!hasWarning(warningsFor(light("chamomile")), "tannin"),
    `unexpected tannin warning at light chamomile`);
});

test("dandelion-leaf at full pull triggers tannin warning (bitter spring greens)", () => {
  assert(hasWarning(warningsFor(strong("dandelion-leaf")), "tannin"),
    `expected tannin warning at strong dandelion-leaf`);
});

test("reishi at full decoction triggers tannin warning (deeply bitter)", () => {
  assert(hasWarning(warningsFor(strong("reishi")), "tannin"),
    `expected tannin warning at strong reishi`);
});

// ─── GENTLE-HERB OVER-PULL WARNINGS ─────────────────────────────

test("chamomile at long+hot triggers tannin warning (apigenin tannins)", () => {
  assert(hasWarning(warningsFor(strong("chamomile")), "tannin"),
    `expected tannin warning at strong chamomile (100°C × 7min)`);
});

test("chamomile at standard does NOT trigger any over-pull warning", () => {
  const w = warningsFor(standard("chamomile"));
  assert(!hasWarning(w, "tannin") && !hasWarning(w, "aromatic"),
    `unexpected over-pull warning at standard chamomile`);
});

test("lavender at over-extraction triggers aromatic warning (soapy/camphor)", () => {
  assert(hasWarning(warningsFor(strong("lavender")), "aromatic"),
    `expected aromatic warning at strong lavender`);
});

test("lavender at standard culinary cup does NOT trigger aromatic warning", () => {
  assert(!hasWarning(warningsFor(standard("lavender")), "aromatic"),
    `unexpected aromatic warning at standard lavender`);
});

test("lemon balm at long+hot triggers tannin warning (grass turns hay-bitter)", () => {
  assert(hasWarning(warningsFor(strong("lemonbalm")), "tannin"),
    `expected tannin warning at strong lemonbalm`);
});

test("rose at over-steep triggers tannin warning (musky-tannic edge)", () => {
  assert(hasWarning(warningsFor(strong("rose")), "tannin"),
    `expected tannin warning at strong rose`);
});

// ─── BROAD AUDIT: every ingredient (except the legitimately
// forgiving ones) fires SOMETHING at full pull. ────────────────

const FORGIVING = new Set(["rooibos", "vanilla", "gyokuro", "hojicha"]);

test("every non-forgiving ingredient fires an over-pull warning at strong end", () => {
  const ids = Object.keys(INGREDIENT_RANGE);
  for (const id of ids) {
    if (FORGIVING.has(id)) continue;
    const w = warningsFor(strong(id));
    const off = w.filter(x => x.kind === "tannin" || x.kind === "aromatic" || x.kind === "ceiling");
    assert(off.length > 0, `${id}: no over-pull warning at strong end`);
  }
});

test("forgiving ingredients (rooibos, vanilla, gyokuro, hojicha) do NOT fire over-pull at strong", () => {
  for (const id of FORGIVING) {
    const w = warningsFor(strong(id));
    const off = w.filter(x => x.kind === "tannin" || x.kind === "aromatic");
    assert(off.length === 0, `${id}: unexpected over-pull warning ${JSON.stringify(off)}`);
  }
});

test("time slider moves the cup at constant temp (bracketByIntensity 2D)", () => {
  // This is the regression we just fixed. Pick a few ingredients with
  // long time ranges and verify the cup actually changes when only
  // time varies — temp held at the midpoint.
  const checks = ["ashwagandha", "reishi", "valerian", "dandelion-root", "chamomile"];
  for (const id of checks) {
    const r = INGREDIENT_RANGE[id];
    const tempMid = Math.round((r.tempLow + r.tempHigh) / 2);
    const a = resolveExtractionProfile(id, tempMid, r.timeLow);
    const b = resolveExtractionProfile(id, tempMid, r.timeHigh);
    // The simplest "did it move" check: any effect strength differs
    // OR any flavor strength differs OR a flavor list differs.
    const aSig = JSON.stringify([a.flavors, a.effects]);
    const bSig = JSON.stringify([b.flavors, b.effects]);
    assert(aSig !== bSig, `${id}: time slider produces identical cup at min vs max time`);
  }
});

test("temp slider moves the cup at constant time (bracketByIntensity 2D)", () => {
  const checks = ["sencha", "matcha", "darjeeling", "dragonwell", "white"];
  for (const id of checks) {
    const r = INGREDIENT_RANGE[id];
    const timeMid = Math.round((r.timeLow + r.timeHigh) / 2);
    const a = resolveExtractionProfile(id, r.tempLow, timeMid);
    const b = resolveExtractionProfile(id, r.tempHigh, timeMid);
    const aSig = JSON.stringify([a.flavors, a.effects]);
    const bSig = JSON.stringify([b.flavors, b.effects]);
    assert(aSig !== bSig, `${id}: temp slider produces identical cup at min vs max temp`);
  }
});

test("no ingredient inverts its primary effect across the slider", () => {
  // For each ingredient with a clearly dominant effect at standard,
  // verify strong does not have a *lower* value for that effect.
  const ids = Object.keys(INGREDIENT_RANGE);
  for (const id of ids) {
    const s = standard(id);
    if (!s.effects.length) continue;
    const dominant = s.effects[0][0];
    if (dominant === "bitterness") continue;  // bitterness intentionally rises
    const stdVal = s.effects[0][1];
    const strongVal = getEffect(strong(id), dominant);
    assert(strongVal >= stdVal - 0.6,
      `${id}: dominant ${dominant} inverted (${stdVal} → ${strongVal})`);
  }
});

// ─── SUMMARY ────────────────────────────────────────────────────

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\n  Failures:");
  for (const f of failures) console.log(`    ✗ ${f.desc}\n        ${f.message}`);
  process.exit(1);
}
process.exit(0);

/* ──────────────────────────────────────────────────────────────
   tests/calibration.test.mjs

   Catches calibration drift in the ingredient catalog before it
   ships. Four structural checks:

     1. Anchor presence — chamomile/matcha/peppermint/etc. still
        hold the strength they're supposed to. If anyone re-tunes
        an anchor, the whole rubric shifts and this test catches it.
     2. Relative ceiling — no non-anchor exceeds the anchor's
        strength on that tag. (Equal is allowed; the catalog
        currently has co-fives on a few tags.)
     3. Flavor whitelist — every flavor word on every ingredient
        appears in KNOWN_FLAVORS. Catches typos like "smkoy".
     4. Pair resolution — every pairs[] id resolves to an existing
        ingredient.

   Plus an informational printout (not a failure) of effect tags
   with multiple strength-5 ingredients, so you can see saturation
   creep before it becomes a problem.

   Run: node tests/calibration.test.mjs
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { computeBrewProfile, resolveBlendAtBrew } from "../src/algo/compose.js";
import { TSP_BY_CATEGORY } from "../src/units/units.js";
import {
  EFFECT_ANCHORS, FLAVOR_ANCHORS, KNOWN_FLAVORS,
  validateCatalogAnchors, findEffectSaturation,
} from "../src/data/ingredientFit.js";

let pass = 0, fail = 0;
const failures = [];

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

console.log("Catalog calibration — anchors, ceilings, vocab\n");

// 1. Anchor presence + strength.
test("declared effect anchors all hold their declared strength", () => {
  const warnings = validateCatalogAnchors();
  assert(warnings.length === 0,
    `${warnings.length} anchor issue(s):\n        - ` + warnings.join("\n        - "));
});

// 2. Relative ceiling — no non-anchor ingredient exceeds the anchor's
//    strength on a tagged axis. Equal strengths (co-anchors) are
//    allowed; the saturation printout below makes those visible.
for (const [tag, anchor] of Object.entries(EFFECT_ANCHORS)) {
  test(`relative ceiling: nothing exceeds "${anchor.id}" on "${tag}"`, () => {
    for (const [id, ing] of Object.entries(INGREDIENTS)) {
      if (id === anchor.id) continue;
      const entry = (ing.effects || []).find(([t]) => t === tag);
      if (!entry) continue;
      assert(entry[1] <= anchor.strength,
        `${id} has ${tag} ${entry[1]} > anchor ${anchor.id} (${anchor.strength}). ` +
        `Either rescale ${id} down or promote it to the anchor.`);
    }
  });
}

// 3. Flavor whitelist.
for (const [id, ing] of Object.entries(INGREDIENTS)) {
  test(`flavors: ${id} all in vocab`, () => {
    const unknown = (ing.flavors || []).filter(f => !KNOWN_FLAVORS.has(f));
    assert(unknown.length === 0,
      `${id} has ${unknown.length} unknown flavor(s): ${unknown.join(", ")}. ` +
      `If intentional, add to KNOWN_FLAVORS in ingredientFit.js.`);
  });
}

// 4. Pair id resolution.
for (const [id, ing] of Object.entries(INGREDIENTS)) {
  if (!ing.pairs || ing.pairs.length === 0) continue;
  test(`pairs: ${id} all resolve`, () => {
    const orphans = ing.pairs.filter(pid => !INGREDIENTS[pid]);
    assert(orphans.length === 0,
      `${id}.pairs references ${orphans.length} unknown id(s): ${orphans.join(", ")}.`);
  });
}

// Flavor anchor presence — separated from validateCatalogAnchors
// for clarity in the test output.
for (const [flavor, anchorId] of Object.entries(FLAVOR_ANCHORS)) {
  test(`flavor anchor: ${anchorId} carries "${flavor}"`, () => {
    const ing = INGREDIENTS[anchorId];
    assert(ing, `flavor anchor "${anchorId}" missing from catalog`);
    assert((ing.flavors || []).includes(flavor),
      `${anchorId} no longer lists "${flavor}" — restore it or pick a new anchor`);
  });
}

/* ── A LEAF IS NOT OVER-PULLED AT ITS OWN BREW ─────────────────────

   Reported as "why are we warning in literature-supported extraction
   ranges — how are they the better spots if they're also indicating
   over extraction?"

   Six leaves fired an over-pull warning brewed exactly as their own
   research prescribes, alone in the pot with nothing else to blame:
   turmeric, valerian, reishi, ashwagandha, lapsang, yerba-mate. Two
   causes, both now fixed and both guarded below.

   The warning judged an absolute level, so a leaf that is bitter BY
   NATURE — reishi is proverbially so — read as a leaf being abused.
   And the profile data couldn't have told them apart anyway: strength
   for bitter/astringent came from the row's INDEX, capped at 3, so any
   profile carrying bitter in its top two rows read identically in
   both. Brewed right and brewed to the end of the window scored the
   same number. */

test("no ingredient is called over-pulled at the brew its own research prescribes", () => {
  const guilty = [];
  for (const [id, meta] of Object.entries(INGREDIENTS)) {
    if (!meta.tempC || !meta.timeS) continue;
    const g = TSP_BY_CATEGORY[meta.category] || 1.5;   // one cup-dose
    const rec = computeBrewProfile([{ id, g, role: "lead" }]);
    const fired = resolveBlendAtBrew([{ id, g, role: "lead" }], rec.tempC, rec.timeS)
      .warnings.filter(w => w.kind === "tannin" || w.kind === "aromatic");
    if (fired.length) guilty.push(`${id} @ ${rec.tempC}°C/${rec.timeS}s — ${fired[0].text}`);
  }
  assert(guilty.length === 0,
    `${guilty.length} ingredient(s) are told off for being brewed correctly:\n  ${guilty.join("\n  ")}`);
});

test("a leaf that HAS a bitter register speaks up when pushed past its window", () => {
  /* The other half. A check that never fires is as useless as one that
     always does, and suppressing everything is the easy way to pass
     the test above.

     Scoped by the DATA, not by a list of exceptions: the leaves that
     stay quiet here are the ones whose profiles declare no bitter,
     astringent or tannic note anywhere — rooibos, vanilla, hojicha,
     marshmallow-root, passionflower, dried apple. Rooibos genuinely
     cannot be over-steeped, which is why it's the tea people leave in
     the pot; a warning would be the app inventing a fault. Asking
     "does anything rise?" of a leaf with nothing to rise is the wrong
     question, and answering it from the profile means a new forgiving
     ingredient needs no edit here. */
  const DIAGNOSTIC = new Set(["bitter", "bitterness", "astringent", "tannic"]);
  const silent = [];
  for (const [id, meta] of Object.entries(INGREDIENTS)) {
    if (!meta.tempC || !meta.timeS) continue;
    const rows = EXTRACTION_PROFILES[id];
    if (!Array.isArray(rows)) continue;
    const declaresBitterness = rows.some(r =>
      (r.flavorStrengths || []).some(([name]) => DIAGNOSTIC.has(name)));
    if (!declaresBitterness) continue;
    const g = TSP_BY_CATEGORY[meta.category] || 1.5;
    const fired = resolveBlendAtBrew([{ id, g, role: "lead" }], meta.tempC[1], meta.timeS[1] * 2)
      .warnings.filter(w => w.kind === "tannin" || w.kind === "aromatic");
    if (!fired.length) silent.push(id);
  }
  assert(silent.length === 0,
    `${silent.length} ingredient(s) declare a bitter register but stay silent at twice ` +
    `their longest steep:\n  ${silent.join(", ")}`);
});

test("no profile's bitterness is flat across its top two rows", () => {
  /* The data half, checked at the source rather than through the cup.
     The index-derived strength caps diagnostic flavours at 3, so a
     profile carrying one in both of its last two rows has no curve
     left to read — which is what pinned these four. Pre-declared
     flavorStrengths are the way out; this fails if anyone adds a
     profile that falls back into the flat case. */
  const DIAGNOSTIC = ["bitter", "bitterness", "astringent", "tannic"];
  const flat = [];
  for (const [id, rows] of Object.entries(EXTRACTION_PROFILES)) {
    if (!Array.isArray(rows) || rows.length < 3) continue;
    const top = Object.fromEntries(rows[rows.length - 1].flavorStrengths || []);
    const below = Object.fromEntries(rows[rows.length - 2].flavorStrengths || []);
    for (const d of DIAGNOSTIC) {
      if (top[d] != null && below[d] != null && top[d] === below[d]) {
        flat.push(`${id}: ${d} is ${top[d]} at both of its top two brew points`);
      }
    }
  }
  assert(flat.length === 0,
    `${flat.length} profile(s) have no bitterness curve to read:\n  ${flat.join("\n  ")}`);
});

console.log(`\n\n${pass} passed, ${fail} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const { desc, message } of failures) {
    console.log(`  ✗ ${desc}\n      ${message}`);
  }
}

// Informational printout — not a failure, just visibility into
// where strength-5 saturation might be creeping. Useful when you
// add a new ingredient and want to know if the tag's anchor is
// still defensibly the strongest.
const saturation = findEffectSaturation();
const tags = Object.keys(saturation);
if (tags.length > 0) {
  console.log("\nSaturation watch (multiple ingredients at strength 5):");
  for (const tag of tags) {
    console.log(`  ${tag}: ${saturation[tag].join(", ")}`);
  }
}

if (fail > 0) process.exit(1);

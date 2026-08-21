/* ──────────────────────────────────────────────────────────────
   tests/seed-elementals.test.mjs — a dev seed may only claim a state
   the app can reach.

   `seenElementalIds` is written by dismissing an arrival card, so in
   the running app it is always a subset of what has ARRIVED — you
   cannot observe an elemental that never came. A seed is the one
   writer that can break that, and the power seed did, in two ways at
   once:

   - Eight of its ten welcomed ids were never rolled. Both surfaces
     count `rolled AND seen`, so the seed's ten specimens rendered as
     THREE, and the difference was invisible because three is a
     perfectly plausible number.

   - It also made the count movable by chance. Those eight sat waiting
     for a random roll to land on one of them, at which point the
     number went up with no arrival and nothing on screen. That is what
     failed `elemental-counts.spec.ts` in CI — the arrivals log read 3,
     and Profile read 4 four hundred milliseconds later.

   - And one of the ten, `first-favorite`, is not an id at all. Nothing
     in ATTRIBUTES has ever been called that and nothing else in the
     repo mentions it, so it cost the seed a specimen silently. An id
     that names nothing renders nothing, which is the same shape every
     other audit in this repo exists to catch.

   The app now grants a seed's welcomed ids when it applies the seed,
   which is what makes the claim true rather than aspirational. What is
   held here is the half a grant cannot fix: that the ids are real, and
   that everything the seed says is welcomed is everything the app
   would then show.
   ────────────────────────────────────────────────────────────── */

import { SEED_MODES } from "../src/data/seeds.js";
import { ATTRIBUTES } from "../src/data/attributes.js";
import { summonedElementalIds, CREATION_ELEMENTAL_ID } from "../src/data/summonedElementals.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const KNOWN = new Set(ATTRIBUTES.map(a => a.id));
const seeds = Object.entries(SEED_MODES || {});

test("there are seeds to check at all", () => {
  assert(seeds.length > 0, "SEED_MODES came back empty — this file would pass vacuously");
});

test("every welcomed id is a real elemental", () => {
  const bad = [];
  for (const [name, mode] of seeds) {
    for (const id of (mode?.seenElementalIds || [])) {
      if (!KNOWN.has(id)) bad.push(`${name}: "${id}"`);
    }
  }
  assert(bad.length === 0,
    `these seeds welcome ids that are not in ATTRIBUTES, so they render ` +
    `nowhere and cost the seed a specimen silently:\n    ${bad.join("\n    ")}`);
});

test("every pinned id is one the same seed has welcomed", () => {
  /* A pin is filtered out unless its elemental is revealed, so a seed
     that pins something it never welcomed shows an empty featured row
     and falls back to top-by-rarity — which looks like a design
     choice rather than a broken fixture. */
  const bad = [];
  for (const [name, mode] of seeds) {
    const seen = new Set(mode?.seenElementalIds || []);
    for (const id of (mode?.featuredElementals || [])) {
      if (!seen.has(id)) bad.push(`${name}: pins "${id}", which it never welcomed`);
    }
  }
  assert(bad.length === 0, bad.join("\n    "));
});

test("a seed's welcomed list is exactly what both surfaces would show", () => {
  /* The app grants the seen ids when it applies a seed, so rolled is a
     superset of seen. Under that, the shared helper must return the
     seed's whole list and nothing else — plus the creation elemental
     where the seed has dismissed its omen. Anything missing here is a
     specimen the seed claims and the user never sees. */
  for (const [name, mode] of seeds) {
    const seen = mode?.seenElementalIds || [];
    if (seen.length === 0) continue;
    const shown = summonedElementalIds({
      rolledIds: new Set(seen),          // what applySeedMode guarantees
      wild: mode?.wildElementals || [],
      seenIds: new Set(seen),
      hasCreationTitle: true,
      omenShown: !!mode?.omenShown,
    });
    const expected = new Set(seen);
    if (mode?.omenShown) expected.add(CREATION_ELEMENTAL_ID);
    const missing = [...expected].filter(id => !shown.includes(id));
    assert(missing.length === 0,
      `seed "${name}" welcomes ${seen.length} but ${missing.length} would ` +
      `not appear on either surface: ${missing.join(", ")}`);
    assert(shown.length === expected.size,
      `seed "${name}" would show ${shown.length} against ${expected.size} claimed`);
  }
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

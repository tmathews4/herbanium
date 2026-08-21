/* ──────────────────────────────────────────────────────────────
   tests/catalog-filter.test.mjs — the Recipes shelf opens somewhere
   real.

   The landing collection was written out four times: App's initial
   state, App's reset when Recipes is entered, ComposeScreen's merge
   fallback for older cached state, and the Home-favorite deep link.
   Three of those are one decision; the fourth is a different one on
   purpose. That is the arrangement where a literal drifts — "change
   the default" means finding three and knowing to leave one — so the
   decision now lives in data/catalogFilter.js and the callers read it.

   What this file holds is the half a constant can't:

     - the default names a collection the chip strip can actually
       show. Set it to "favourites" (or to a bucket that was renamed)
       and the shelf renders an empty list with every chip unselected,
       which looks like a broken screen rather than a bad constant.
     - nothing in src/ has quietly gone back to writing its own.

   The chip list is read from ComposeScreen as TEXT rather than copied
   here. A list of collections written into this file would be one more
   copy to drift, which is the failure it exists to catch.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_COLLECTION, defaultCatalogFilter } from "../src/data/catalogFilter.js";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const SRC = new URL("../src/", import.meta.url).pathname;
const COMPOSE = readFileSync(join(SRC, "screens/ComposeScreen.jsx"), "utf8");

/** Every value the collection FilterRow offers, read from its items. */
const chipValues = () => {
  const row = COMPOSE.slice(COMPOSE.indexOf('label="collection"'));
  const items = row.slice(row.indexOf("items={["), row.indexOf("]}"));
  return [...items.matchAll(/\[\s*"([^"]+)"\s*,/g)].map(m => m[1]);
};

test("the default collection is one the chip strip can show", () => {
  const chips = chipValues();
  assert(chips.length >= 2,
    `read ${chips.length} collection chips out of ComposeScreen — the ` +
    `FilterRow was probably restructured and this test is now reading ` +
    `nothing, which would let any default pass`);
  assert(chips.includes(DEFAULT_COLLECTION),
    `DEFAULT_COLLECTION is "${DEFAULT_COLLECTION}" but the chips offer ` +
    `${chips.map(c => `"${c}"`).join(", ")} — the shelf would open on a ` +
    `bucket with no chip selected and, depending on the value, no rows`);
});

test("the default is also a bucket the pool logic handles", () => {
  /* The chips and the `cf.collection === ...` ladder are two lists in
     one file and could disagree. A default that no branch matches
     falls through to the legacy string fallback, which silently
     reinterprets it as a MOOD. */
  assert(COMPOSE.includes(`cf.collection === "${DEFAULT_COLLECTION}"`),
    `nothing in ComposeScreen branches on collection "${DEFAULT_COLLECTION}" ` +
    `— it would fall through to the legacy mood fallback`);
});

test("a fresh filter is a fresh object, not one shared reference", () => {
  const a = defaultCatalogFilter();
  const b = defaultCatalogFilter();
  assert(a !== b, "defaultCatalogFilter returned the same object twice");
  assert(a.moods !== b.moods && a.flavors !== b.flavors,
    "the sub-filter arrays are shared between calls — pushing to one " +
    "would mutate every future default, and React would not re-render");
  a.moods.push("calm");
  assert(defaultCatalogFilter().moods.length === 0,
    "mutating a returned filter changed the next default");
});

test("no screen writes its own landing collection any more", () => {
  /* The Home-favorite deep link is the one deliberate exception and it
     is EXCLUDED BY POSITION, not by an exemption list: it is the only
     `collection:` literal allowed, and only inside the composePreselect
     effect. Anything else is a fourth copy coming back. */
  const walk = (dir) => readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full)
      : (/\.jsx?$/.test(name) ? [full] : []);
  });

  const offenders = [];
  for (const file of walk(SRC)) {
    if (file.endsWith("data/catalogFilter.js")) continue;
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/collection:\s*"([^"]+)"/g)) {
      const before = src.slice(0, m.index);
      const inPreselect = before.lastIndexOf("composePreselect") >
                          before.lastIndexOf("const ");
      if (inPreselect) continue;
      offenders.push(`${file.slice(SRC.length)} → collection: "${m[1]}"`);
    }
  }
  assert(offenders.length === 0,
    `these write a landing collection instead of reading ` +
    `defaultCatalogFilter():\n    ${offenders.join("\n    ")}`);
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);

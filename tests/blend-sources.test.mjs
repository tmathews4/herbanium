/* ──────────────────────────────────────────────────────────────
   tests/blend-sources.test.mjs

   The four source lines the app shows a reader used to render as
   identical italic serif inside one box labelled "Sources":

     Cerny A, Schmid K. 1999 ... Fitoterapia 70:221-228.   (an RCT)
     Soen Nagatani's 1738 sencha-steaming method            (history)
     Eisai (12th c.) ...                                    (history)
     Susun Weed's Wise Woman tradition ...                  (a teaching)

   Nothing told a reader which was which, and the journal citation
   lends its authority sideways to whatever is printed beside it. That
   is the same failure as a `verified` marker nobody checks, except
   this is the version users actually see.

   So the register is DATA and this holds it there. DERIVED, NOT
   RESTATED: it walks whatever is in BLEND_SOURCES and checks each
   entry against the SOURCE_REGISTERS vocabulary the renderer reads.
   It does not name which blend is a trial — that would be a second
   copy of the answer, and adding a source would not be covered by it.
   ────────────────────────────────────────────────────────────── */

import { BLEND_SOURCES, SOURCE_REGISTERS, BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; console.error(`\n  FAIL ${name}\n  ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const entries = Object.entries(BLEND_SOURCES)
  .flatMap(([id, list]) => list.map((src, i) => ({ id, i, src })));

test("there is something to check", () => {
  assert(entries.length > 0, "BLEND_SOURCES is empty — this guard would pass vacuously");
});

test("every source names a register from the shared vocabulary", () => {
  const bad = entries.filter(({ src }) =>
    !src || typeof src !== "object" || !SOURCE_REGISTERS[src.register]);
  assert(bad.length === 0,
    `every user-visible source must declare a register in SOURCE_REGISTERS ` +
    `(${Object.keys(SOURCE_REGISTERS).join(", ")}):\n` +
    bad.map(b => `  ${b.id}[${b.i}]: ${JSON.stringify(b.src).slice(0, 90)}`).join("\n"));
});

test("every source carries text a reader can actually read", () => {
  const bad = entries.filter(({ src }) => typeof src?.text !== "string" || src.text.trim().length < 20);
  assert(bad.length === 0,
    `a source with no text renders an empty row under a register label:\n` +
    bad.map(b => `  ${b.id}[${b.i}]`).join("\n"));
});

test("a source marked `trial` names a year, so it can be looked up", () => {
  // The point of separating registers is that the clinical one is
  // checkable. A trial citation with no year is not.
  const bad = entries.filter(({ src }) => src.register === "trial" && !/\b(19|20)\d{2}\b/.test(src.text));
  assert(bad.length === 0,
    `a clinical citation must carry a year:\n` + bad.map(b => `  ${b.id}[${b.i}]: ${b.src.text.slice(0, 80)}`).join("\n"));
});

test("sources attach to blends that exist", () => {
  const known = new Set(BLENDS.map(b => b.id));
  const orphans = Object.keys(BLEND_SOURCES).filter(id => !known.has(id));
  assert(orphans.length === 0,
    `sources keyed to no blend never render and nothing would say so: ${orphans.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
console.log(`  (${entries.length} user-visible sources across ${Object.keys(BLEND_SOURCES).length} blends)`);
if (fail) process.exit(1);

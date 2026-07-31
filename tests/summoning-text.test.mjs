/* ──────────────────────────────────────────────────────────────
   tests/summoning-text.test.mjs

   Reader-experience guardrail for everything a user reads when an
   elemental is summoned/observed: the assembled name, the flavor +
   base description, the raw adjective/creature pools, and the arrival
   verbs. Catches text that would read badly — empty fields, missing
   sentence punctuation, double spaces, leftover template braces,
   "undefined"/"null" strings, un-capitalized starts, and (post pantry
   removal) any stray "pantry"/"cabinet" wording in elemental text.

   Run: node tests/summoning-text.test.mjs   (part of `npm test`)
   ────────────────────────────────────────────────────────────── */

import { ATTRIBUTES } from "../src/data/attributes.js";
import {
  ALL_ADJECTIVES, RANDOM_CREATURE_POOL,
  flavorLineFor, getElementalDisplayName, getElementalDisplayDesc,
} from "../src/data/elementalAdjectives.js";
import { arrivalVerbFor } from "../src/data/elementalArrivals.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Shared quality checks for a "sentence" string (name/desc/flavor).
function assertClean(label, s, { sentence = false } = {}) {
  assert(typeof s === "string" && s.trim().length > 0, `${label}: empty or non-string`);
  assert(s === s.trim(), `${label}: leading/trailing whitespace — "${s}"`);
  assert(!/ {2,}/.test(s), `${label}: double space — "${s}"`);
  assert(!/[{}]/.test(s), `${label}: template brace leftover — "${s}"`);
  assert(!/\b(undefined|null|NaN)\b/.test(s), `${label}: contains undefined/null/NaN — "${s}"`);
  assert(!/pantry|cabinet/i.test(s), `${label}: stray pantry/cabinet wording — "${s}"`);
  if (sentence) {
    assert(/^[A-Z"“]/.test(s.trim()), `${label}: doesn't start capitalized — "${s}"`);
    assert(/[.!?"”]$/.test(s.trim()), `${label}: no terminal punctuation — "${s}"`);
  }
}

console.log("\n  Summoning text — reader-experience audit\n");

// ─── Raw attribute name + desc ──────────────────────────────────
test("every ATTRIBUTE has a clean name", () => {
  for (const a of ATTRIBUTES) {
    assert(a.id, `attribute missing id`);
    assertClean(`${a.id} name`, a.name);
    assert(/^[A-Z"“]/.test(a.name.trim()), `${a.id} name not capitalized — "${a.name}"`);
  }
});

test("every ATTRIBUTE desc reads as a sentence", () => {
  for (const a of ATTRIBUTES) {
    assertClean(`${a.id} desc`, a.desc, { sentence: true });
  }
});

test("no duplicate ATTRIBUTE ids", () => {
  const seen = new Set();
  for (const a of ATTRIBUTES) {
    assert(!seen.has(a.id), `duplicate attribute id: ${a.id}`);
    seen.add(a.id);
  }
});

// ─── Adjective + creature pools ─────────────────────────────────
test("every adjective is clean + capitalized", () => {
  for (const adj of ALL_ADJECTIVES) {
    assertClean(`adjective "${adj}"`, adj);
    assert(/^[A-Z]/.test(adj), `adjective not capitalized — "${adj}"`);
    assert(adj.length <= 24, `adjective suspiciously long — "${adj}"`);
  }
});

test("every creature is clean + capitalized", () => {
  for (const c of RANDOM_CREATURE_POOL) {
    assertClean(`creature "${c}"`, c);
    assert(/^[A-Z]/.test(c), `creature not capitalized — "${c}"`);
    assert(c.length <= 32, `creature suspiciously long — "${c}"`);
  }
});

// ─── Flavor line for every adjective ────────────────────────────
test("flavorLineFor returns a clean sentence for every adjective", () => {
  for (const adj of ALL_ADJECTIVES) {
    assertClean(`flavorLineFor(${adj})`, flavorLineFor(adj), { sentence: true });
  }
});

// ─── Assembled summon output for every attribute (multiple seeds) ─
const SEEDS = ["alpha", "bravo", "charlie", "delta", "echo"];
test("assembled elemental name reads well for every attribute", () => {
  for (const a of ATTRIBUTES) {
    for (const seed of SEEDS) {
      const name = getElementalDisplayName(a, seed);
      assertClean(`${a.id} name @${seed}`, name);
      assert(/^[A-Z"“]/.test(name.trim()), `${a.id} name not capitalized @${seed} — "${name}"`);
    }
  }
});

test("assembled elemental desc reads as a sentence for every attribute", () => {
  for (const a of ATTRIBUTES) {
    for (const seed of SEEDS) {
      const d = getElementalDisplayDesc(a, seed);
      assertClean(`${a.id} desc @${seed}`, d, { sentence: true });
    }
  }
});

// ─── Arrival verbs ──────────────────────────────────────────────
test("arrivalVerbFor returns a clean lowercase-start phrase for pool creatures", () => {
  for (const c of RANDOM_CREATURE_POOL) {
    const v = arrivalVerbFor(c);
    assert(typeof v === "string" && v.trim().length > 0, `arrivalVerbFor(${c}): empty`);
    assert(!/ {2,}/.test(v), `arrivalVerbFor(${c}): double space — "${v}"`);
    assert(!/[{}]/.test(v), `arrivalVerbFor(${c}): brace leftover — "${v}"`);
    assert(!/\b(undefined|null)\b/.test(v), `arrivalVerbFor(${c}): undefined/null — "${v}"`);
    // Reads as "<Name> <verb>." — so the verb starts lowercase.
    assert(/^[a-z]/.test(v.trim()), `arrivalVerbFor(${c}): should start lowercase — "${v}"`);
  }
});

test("arrivalVerbFor falls back gracefully for an unknown creature", () => {
  const v = arrivalVerbFor("NotARealCreatureXYZ");
  assert(typeof v === "string" && v.trim().length > 0, "fallback verb empty");
  assert(!/[{}]/.test(v), `fallback verb has braces — "${v}"`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\n  Failures:");
  for (const f of failures) console.log(`    ✗ ${f.desc}\n        ${f.message}`);
  process.exit(1);
}
process.exit(0);

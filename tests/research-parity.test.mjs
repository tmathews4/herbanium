/* ──────────────────────────────────────────────────────────────
   tests/research-parity.test.mjs

   Two guards, both turning audits that were run by hand today into
   things the build enforces.

   1. NOTHING UNSOURCED. Every effect an ingredient's extraction
      profile claims must appear in that ingredient's research doc.
      The app's whole claim is that it teaches real extraction
      chemistry, so an invented effect is the app making something up
      and presenting it with the authority of the sourced ones — a
      user cannot tell the two apart.

      Enforced as a RATCHET, not a clean bill of health. There are
      30 known unsourced pairs today, listed by name below so
      they can be worked off deliberately while any NEW one fails
      immediately. A bare count would let one be fixed and another
      introduced with the suite still green.

   2. THE FAMILY TREE IS WHOLE. Every effect and flavour token maps to
      a family, and every family a token maps to has a colour and a
      slot in the display order. This is what "simple rolls up into
      detailed" depends on: Simple mode draws one bar per family and
      Detailed opens the leaves underneath, so a token with no family
      is invisible in one mode and a family with no colour is drawn in
      fallback grey.

      Both halves have already failed in real life — "settle" had no
      family, and splitting soothing/grounding/uplifting out needed
      three new colours and three order slots that nothing would have
      caught.

   Run: node tests/research-parity.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import {
  FAMILY_BY_EFFECT, FAMILY_BY_FLAVOR, EFFECT_FAMILY_COLORS, MOOD_FAMILY_ORDER,
  MOOD_FAMILY_LABEL,
} from "../src/data/families.js";
import { EFFECT_DESCRIPTIONS } from "../src/data/vocabularyDescriptions.js";
import { severeDrift, driftKey } from "../tools/lib/strength-drift.mjs";
import { undescribedOppositions } from "../tools/lib/opposition.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname, "../docs/research/ingredients");

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Research parity + family-tree integrity\n");

// Where the docs and the app use different words for one claim. The
// app's word wins because it's the one the user meets; see CLAUDE.md.
const ALIAS = { settle: "digestive", warming: "comfort" };

// Unsourced effects that exist today, listed so they can be worked off
// one at a time. Removing a line here after fixing the data is the
// point; ADDING one should be a deliberate act with a reason.
const KNOWN_UNSOURCED = {
  bergamot: ["focus"],
  chamomile: ["soothing"],
  cranberry: ["energy"],
  dragonwell: ["comfort"],
  "dried-apple": ["calm", "uplifting"],
  fennel: ["comfort"],
  genmaicha: ["digestive"],
  gunpowder: ["calm"],
  hibiscus: ["uplifting"],
  jasmine: ["uplifting"],
  "licorice-root": ["grounding", "uplifting"],
  "lions-mane": ["comfort"],
  nettle: ["sleepy"],
  passionflower: ["soothing"],
  reishi: ["sleepy"],
  sencha: ["cooling"],
  vanilla: ["digestive"],
};

const docIdFor = {};
for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const id = [slug, slug.replace(/-/g, "")].find(c => EXTRACTION_PROFILES[c]);
  if (id) docIdFor[id] = resolve(DOCS, file);
}

function prescribed(id) {
  const src = readFileSync(docIdFor[id], "utf8");
  const names = new Set();
  for (const row of src.matchAll(/\|\s*effects\s*\|\s*(\[\[.*?\]\])\s*\|/g)) {
    for (const hit of row[1].matchAll(/\[\s*"([^"]+)"\s*,\s*[\d.]+\s*\]/g)) {
      names.add(ALIAS[hit[1]] || hit[1]);
    }
  }
  // Addenda. A brew-point table is the normal place to prescribe an
  // effect, but a later finding often applies across every brew point
  // rather than to one — spearmint's attention evidence, say. Those
  // carry a machine-readable line so writing the research properly
  // CLEARS the guard. Without it, documenting a source correctly still
  // failed the build, which teaches people to edit the exemption list
  // instead of the docs.
  //
  //   <!-- sourced-effects: focus, calm -->
  for (const row of src.matchAll(/<!--\s*sourced-effects:\s*([^>]+?)\s*-->/g)) {
    for (const n of row[1].split(",").map(x => x.trim()).filter(Boolean)) {
      names.add(ALIAS[n] || n);
    }
  }
  return names;
}

function shipped(id) {
  const names = new Set();
  for (const sample of EXTRACTION_PROFILES[id] || []) {
    for (const e of sample.effects || []) {
      const n = Array.isArray(e) ? e[0] : e.name;
      // Alias applied to BOTH sides — it's a canonicalisation, not a
      // one-way mapping. Applying it only to the docs left shipped
      // "warming" reading as unsourced everywhere the doc said warming.
      names.add(ALIAS[n] || n);
    }
  }
  return names;
}

// ── 1. Nothing unsourced ─────────────────────────────────────────

test("no ingredient ships an effect its research doesn't prescribe", () => {
  const offenders = [];
  for (const id of Object.keys(docIdFor)) {
    const want = prescribed(id);
    if (want.size === 0) continue;            // doc has no extraction table
    const allowed = new Set(KNOWN_UNSOURCED[id] || []);
    for (const name of shipped(id)) {
      // bitterness is an over-steep artefact the model adds, not a
      // claim about the herb, so it's never prescribed.
      if (name === "bitterness") continue;
      if (want.has(name) || allowed.has(name)) continue;
      offenders.push(`${id}: ${name}`);
    }
  }
  assert(offenders.length === 0,
    `unsourced effects — add the research first, then transcribe:\n    ${offenders.join("\n    ")}`);
});

test("the known-unsourced list has no stale entries", () => {
  // A cleaned-up ingredient should drop off the list, not linger as a
  // permanent exemption that quietly re-permits the same mistake.
  const stale = [];
  for (const [id, names] of Object.entries(KNOWN_UNSOURCED)) {
    if (!docIdFor[id]) { stale.push(`${id} (no doc)`); continue; }
    const want = prescribed(id), have = shipped(id);
    for (const n of names) {
      if (!have.has(n) || want.has(n)) stale.push(`${id}: ${n}`);
    }
  }
  assert(stale.length === 0,
    `these are no longer unsourced — remove them from KNOWN_UNSOURCED:\n    ${stale.join("\n    ")}`);
});

// ── 2. The family tree is whole ──────────────────────────────────

test("every effect token in the extraction data has a family", () => {
  const orphans = new Set();
  for (const [id, samples] of Object.entries(EXTRACTION_PROFILES)) {
    for (const sample of samples) {
      for (const e of sample.effects || []) {
        const name = Array.isArray(e) ? e[0] : e.name;
        if (name === "bitterness") continue;   // palate axis, not an effect family
        if (!FAMILY_BY_EFFECT[name]) orphans.add(`${name} (${id})`);
      }
    }
  }
  assert(orphans.size === 0,
    `effect tokens with no family — Simple mode can't draw them:\n    ${[...orphans].join("\n    ")}`);
});

test("every flavour token in the extraction data has a family", () => {
  const orphans = new Set();
  for (const [id, samples] of Object.entries(EXTRACTION_PROFILES)) {
    for (const sample of samples) {
      const names = [
        ...(sample.flavors || []),
        ...(sample.flavorStrengths || []).map(f => f[0]),
      ];
      for (const n of names) if (!FAMILY_BY_FLAVOR[n]) orphans.add(`${n} (${id})`);
    }
  }
  assert(orphans.size === 0,
    `flavour tokens with no family:\n    ${[...orphans].join("\n    ")}`);
});

test("every declared ingredient effect has a family", () => {
  // The ingredient page reads these directly, so an orphan here shows
  // as an uncoloured row rather than as nothing.
  const orphans = new Set();
  for (const [id, meta] of Object.entries(INGREDIENTS)) {
    for (const e of meta.effects || []) {
      const name = Array.isArray(e) ? e[0] : e.name;
      if (!FAMILY_BY_EFFECT[name]) orphans.add(`${name} (${id})`);
    }
  }
  assert(orphans.size === 0, `declared effects with no family:\n    ${[...orphans].join("\n    ")}`);
});

// ── 1c. Cups whose tension the app never names ───────────────────

// A single ingredient prescribing two opposed effects at the SAME brew
// point is evidence the opposition isn't real — one cup demonstrably
// holds both. (Different brew points prove nothing; the cup changes
// register as it extracts.) Where the engine already has language, that
// is the system working: energy + calm fires the "alert calm" synergy
// across seven true teas, which is the L-theanine signature.
//
// These are the ones with NO synergy and NO paradox tag, so the app
// stays silent about a tension its own research documents. NOT lost
// data — nothing cancels effects; the paradox list only drives an
// informational tag. Ratcheted so a new one has to be a decision.
//
// Clearing an entry means writing the synergy or paradox with a source
// behind it, the same rule as any other claim here. Do not just delete
// the line.
const KNOWN_UNDESCRIBED = new Set([
  "energy|soothing::dandelion-root",
  "energy|soothing::ginger",
  "energy|soothing::matcha",
  "grounding|uplifting::cardamom",
  "grounding|uplifting::dandelion-leaf",
  "grounding|uplifting::nettle",
  "grounding|uplifting::tulsi",
]);

test("no new cup holds an opposed pair the app can't describe", () => {
  const fresh = undescribedOppositions(EXTRACTION_PROFILES)
    .map(o => `${o.key}::${o.id}`)
    .filter(k => !KNOWN_UNDESCRIBED.has(k));
  assert(fresh.length === 0,
    `opposed pairs in one cup with no synergy or paradox:\n    ${fresh.join("\n    ")}`);
});

test("the known-undescribed list has no stale entries", () => {
  const live = new Set(undescribedOppositions(EXTRACTION_PROFILES).map(o => `${o.key}::${o.id}`));
  const stale = [...KNOWN_UNDESCRIBED].filter(k => !live.has(k));
  assert(stale.length === 0,
    `no longer undescribed — remove from KNOWN_UNDESCRIBED:\n    ${stale.join("\n    ")}`);
});

// ── 1b. Right effect, wrong magnitude ────────────────────────────

// Strength drift that exists today, keyed `id@tempC:effect`. Same
// ratchet discipline as KNOWN_UNSOURCED: work these off and delete the
// line; a NEW one fails immediately. Until this guard existed nothing
// compared magnitudes at all, so a claim could sit at 6x its researched
// strength with the whole suite green.
const KNOWN_STRENGTH_DRIFT = new Set([
  "assam@95:energy",             // doc 5 -> app 3
  "cardamom@95:uplifting",       // doc 3 -> app 1
  "cranberry@100:uplifting",     // doc 1 -> app 3
  "cranberry@100:cooling",       // doc 1 -> app 3
  "dried-apple@100:comfort",     // doc 1 -> app 3
  "elderflower@90:calm",         // doc 1 -> app 3
  "gyokuro@50:focus",            // doc 5 -> app 3
  "lemon-peel@95:cooling",       // doc 1 -> app 3
  "lemon-peel@100:cooling",      // doc 1 -> app 3
  "licorice-root@100:warming",   // doc 1 -> app 3
  "lions-mane@95:focus",         // doc 1 -> app 3
  "puerh@95:digestive",          // doc 4 -> app 2
  "puerh@100:warming",           // doc 4 -> app 2
  "rooibos@100:soothing",        // doc 5 -> app 3
  "vanilla@95:calm",             // doc 3 -> app 1
]);

test("no new claim drifts 2+ points from its researched strength", () => {
  const fresh = severeDrift(EXTRACTION_PROFILES)
    .filter(d => !KNOWN_STRENGTH_DRIFT.has(driftKey(d)))
    .map(d => `${driftKey(d)}  doc ${d.doc} -> app ${d.app}`);
  assert(fresh.length === 0,
    `strengths that no longer match the research:\n    ${fresh.join("\n    ")}`);
});

test("the known-strength-drift list has no stale entries", () => {
  const live = new Set(severeDrift(EXTRACTION_PROFILES).map(driftKey));
  const stale = [...KNOWN_STRENGTH_DRIFT].filter(k => !live.has(k));
  assert(stale.length === 0,
    `these no longer drift — remove them from KNOWN_STRENGTH_DRIFT:\n    ${stale.join("\n    ")}`);
});

test("no family's display label is the name of one of its own leaves", () => {
  // Detail mode draws a parent row per family with its leaves indented
  // underneath, and suppresses any leaf whose label equals the family's
  // label — its value is already in the parent aggregate. That's right
  // for a family whose single leaf is self-named (cool/cooling,
  // sleep/sleepy). It goes wrong the moment a family has TWO leaves and
  // is labelled after one of them: the named leaf is swallowed, and the
  // parent shows max-of-children under that leaf's name.
  //
  // `warm` shipped exactly that. Labelled "comfort" while holding both
  // `comfort` and `warming`, orange-peel drew one row reading
  // "comfort 3" — which was warming's 3 — and comfort's own 1 was
  // rendered nowhere. Invisible to every other guard here, because the
  // family tree itself was perfectly well-formed.
  const leavesOf = {};
  for (const [leaf, fam] of Object.entries(FAMILY_BY_EFFECT)) {
    (leavesOf[fam] = leavesOf[fam] || []).push(leaf);
  }
  const collisions = [];
  for (const [fam, label] of Object.entries(MOOD_FAMILY_LABEL)) {
    const leaves = leavesOf[fam] || [];
    if (leaves.length > 1 && leaves.includes(label)) {
      collisions.push(`${fam} labelled "${label}" but holds ${leaves.join(", ")}`);
    }
  }
  assert(collisions.length === 0,
    `family label swallows one of its own leaves:\n    ${collisions.join("\n    ")}`);
});

test("every family label resolves to a vocabulary description", () => {
  // The parent row is tappable; a label with no entry opens an empty
  // panel. `warm` pointed at "warming" while reading "comfort", so the
  // blurb described thermogenic spice on a row that said comfort.
  const missing = Object.values(MOOD_FAMILY_LABEL)
    .filter(l => !EFFECT_DESCRIPTIONS[l]);
  assert(missing.length === 0,
    `family labels with no description entry: ${missing.join(", ")}`);
});

test("every effect family has a colour", () => {
  const families = new Set(Object.values(FAMILY_BY_EFFECT));
  const missing = [...families].filter(f => !EFFECT_FAMILY_COLORS[f]);
  assert(missing.length === 0,
    `families drawn in fallback grey: ${missing.join(", ")}`);
});

test("every effect family has a slot in the display order", () => {
  // Without one the strip sorts it to the end, which reads as a
  // rogue bar rather than part of the palette.
  const families = new Set(Object.values(FAMILY_BY_EFFECT));
  const missing = [...families].filter(f => !MOOD_FAMILY_ORDER.includes(f));
  assert(missing.length === 0, `families with no order slot: ${missing.join(", ")}`);
});

test("the display order has no families that don't exist", () => {
  const families = new Set(Object.values(FAMILY_BY_EFFECT));
  const ghosts = MOOD_FAMILY_ORDER.filter(f => !families.has(f));
  assert(ghosts.length === 0, `ordered but unreachable: ${ghosts.join(", ")}`);
});

test("every family colour resolves to a defined CSS variable", () => {
  // The colours are var(--effect-x) strings; a var with no definition
  // silently renders as nothing at all.
  const css = readFileSync(resolve(__dirname, "../src/index.css"), "utf8");
  const missing = [];
  for (const [fam, value] of Object.entries(EFFECT_FAMILY_COLORS)) {
    const v = /var\((--[a-z0-9-]+)\)/.exec(value);
    if (!v) continue;
    if (!css.includes(`${v[1]}:`)) missing.push(`${fam} -> ${v[1]}`);
  }
  assert(missing.length === 0, `undefined CSS variables:\n    ${missing.join("\n    ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

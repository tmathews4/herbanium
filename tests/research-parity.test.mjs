/* ──────────────────────────────────────────────────────────────
   tests/research-parity.test.mjs

   Audits that were run by hand once, turned into things the build
   enforces. Four families of guard now, each added the day something
   got past the previous ones.

   1. NOTHING UNSOURCED. Every effect an ingredient's extraction
      profile claims must appear in that ingredient's research doc.
      The app's whole claim is that it teaches real extraction
      chemistry, so an invented effect is the app making something up
      and presenting it with the authority of the sourced ones — a
      user cannot tell the two apart.

      Enforced as a RATCHET. KNOWN_UNSOURCED is now EMPTY — every one
      of the 30 pairs the first audit found has been researched and
      either sourced, corrected to the right register, or removed. The
      map stays because the discipline is the point: an entry may be
      added, but only deliberately and with a reason, and it comes back
      out by writing the research rather than by deleting the line.

      A doc must also be REACHABLE to be checked. Two files resolving
      to one ingredient silently exempted lemon balm from this guard
      for four cycles, so that's checked too.

   1b. RIGHT EFFECT, WRONG MAGNITUDE. Presence is not enough — a claim
      can sit at 6x its researched strength with every name matching.
      Ratcheted the same way.

   1c. CUPS WHOSE TENSION ISN'T NAMED. Where one ingredient's research
      puts two opposed effects at the SAME brew point, the opposition
      isn't real and the app should have language for it.

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
  MOOD_FAMILY_LABEL, MOOD_VOCABULARY,
} from "../src/data/families.js";
import { EFFECT_DESCRIPTIONS } from "../src/data/vocabularyDescriptions.js";
import { severeDrift, driftKey } from "../tools/lib/strength-drift.mjs";
import { undescribedOppositions } from "../tools/lib/opposition.mjs";
import { flavourFamilyGaps, flavourGapKey } from "../tools/lib/flavour-parity.mjs";
import { census, INVENTION_RATIO } from "../tools/audit-vocabulary.mjs";
import { outsideResearchedRange, paramKey, isDeliberate } from "../tools/lib/brew-params.mjs";
import { DELIBERATE_RANGE_DEPARTURES, DELIBERATE_GRIDS } from "../src/data/brewIntent.js";

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
//
// `warming -> comfort` USED TO BE HERE and has been retired. They are
// two different claims, and the catalogue's own research says so most
// clearly under ginger: warming 5 is "genuine TRPV1-agonist warming,
// distinct from caffeine-driven warming or simply hot-drink warmth",
// and soothing is rated SEPARATELY as its consequence ("the warming
// character soothes"). One is measurable body heat — the spice makes
// you physically warm. The other is warm relaxation, which arrives
// with no temperature change at all.
//
// While the alias stood, a doc prescribing thermogenic warming was
// satisfied by the app shipping affective comfort, and 21 pairs went
// unexamined behind it. tools/lib/strength-drift.mjs already refused
// this alias for the same reason.
const ALIAS = { settle: "digestive" };

// Unsourced effects that exist today, listed so they can be worked off
// one at a time. Removing a line here after fixing the data is the
// point; ADDING one should be a deliberate act with a reason.
// Reopened deliberately (see the ALIAS note above). Retiring
// `warming -> comfort` revealed 21 pairs the alias had been covering.
//
// These are NOT mislabelled data: every one of the 20 comfort entries
// ships alongside a `warming` its doc does prescribe, so the
// thermogenic claim is present and sourced. What is unsourced is the
// SECOND, affective claim sitting next to it — "warm relaxation" as
// distinct from "physically warm". Each comes off the list by either
// finding a genuine comfort claim in the literature or removing it.
const KNOWN_UNSOURCED = {
  // EMPTY again. Every unsourced effect pair the audits have found has
  // been researched and then sourced, corrected, or removed — the 30
  // from the original audit, and the 21 that surfaced when the
  // warming -> comfort alias was retired. The map stays because the
  // discipline is: an entry may be added, but deliberately and with a
  // reason, and it leaves by writing research rather than by deletion.
};const docIdFor = {};
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

// Docs that deliberately describe a CATEGORY rather than one shipped
// ingredient. green-tea.md covers green tea as a class; the catalogue
// ships sencha, dragonwell, gunpowder and the rest individually.
const CATEGORY_DOCS = new Set(["green-tea"]);

test("no research doc is orphaned from the ingredient it describes", () => {
  // white tea's 397-line doc sat in white-tea.md while the profile id
  // is `white`, so the resolver matched neither "white-tea" nor
  // "whitetea" and the doc was never checked against anything. The
  // drift audit had been printing it under "DOC WITHOUT A MATCHING
  // PROFILE ID" the whole time, which reads as a filing note rather
  // than an ingredient with no oversight. Renaming it to white.md
  // immediately surfaced a real strength disagreement.
  //
  // Same shape as the lemon-balm hole: a doc that isn't reachable
  // can't guard anything.
  const orphans = readdirSync(DOCS).filter(f => f.endsWith(".md"))
    .map(f => f.replace(/\.md$/, ""))
    .filter(slug => !CATEGORY_DOCS.has(slug))
    .filter(slug => ![slug, slug.replace(/-/g, "")].some(c => EXTRACTION_PROFILES[c]));
  assert(orphans.length === 0,
    `research docs matching no ingredient — nothing checks these:\n    ${orphans.join("\n    ")}`);
});

test("no two research docs claim the same ingredient", () => {
  // Doc -> id resolution tries the slug and the slug without dashes, so
  // lemon-balm.md and lemonbalm.md BOTH resolved to `lemonbalm` and the
  // later filename won. The winner was a 1KB addendum with no extraction
  // table, so prescribed() came back empty and the unsourced-effects
  // guard above skipped lemon balm entirely — an ingredient silently
  // exempt from the project's central rule from cycle 1 until it was
  // spotted by hand. The drift audit had been printing "NO EXTRACTION
  // TABLE IN DOC: lemonbalm" the whole time, which reads as a note
  // rather than a hole.
  //
  // An addendum belongs at the bottom of the ingredient's doc, not in a
  // new file beside it.
  const claims = {};
  for (const file of readdirSync(DOCS).filter(f => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    const id = [slug, slug.replace(/-/g, "")].find(c => EXTRACTION_PROFILES[c]);
    if (!id) continue;
    (claims[id] = claims[id] || []).push(file);
  }
  const dupes = Object.entries(claims).filter(([, files]) => files.length > 1)
    .map(([id, files]) => `${id} <- ${files.join(", ")}`);
  assert(dupes.length === 0,
    `two docs resolve to one ingredient; the later one silently wins:\n    ${dupes.join("\n    ")}`);
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

// ── 1e. Brewing advice the research doesn't support ──────────────

// Every other guard here checks what a cup CLAIMS. This one checks the
// numbers the app tells you to brew at, which is the most directly
// user-facing data in the catalogue and the only place where being
// wrong makes a worse cup rather than a wrong label. Nothing checked
// it until the unpairable-brew-point count made the grids visible.
//
// Only ABOVE the researched ceiling is ratcheted. A range narrower
// than the research is editorial — the docs may record a 25-100C span
// for hibiscus because cold brew exists, and the app can reasonably
// offer the hot band. Starting below the researched floor is a lighter
// option, usually harmless. Exceeding the ceiling is the app
// recommending a brew its own research argues against.
// Only dragonwell now. The other four over-ceiling ranges are
// deliberate and live in data/brewIntent.js with their reasons — they
// are fitted to a blend that is brewed hotter and longer than any of
// those leaves would be taken alone, and holding them to the
// researched ceiling would fire over-pull warnings on a cup that is
// made on purpose and tastes right.
//
// That distinction is the point of splitting them out. An exemption
// list reads as "not yet fixed"; those four are finished.
// EMPTY. dragonwell was the last one — its card ran [75,150]s against a
// documented [60,120], and it's been pulled back to the research and
// re-gridded onto the doc's brew points. The four that remain outside
// the researched ceiling are deliberate and live in data/brewIntent.js
// with their reasons, which is a different thing from an exemption.
const KNOWN_OVER_CEILING = new Set([]);

test("no new brew range exceeds what the research supports", () => {
  const fresh = outsideResearchedRange(INGREDIENTS)
    .filter(r => r.direction === "above")
    .filter(r => !isDeliberate(r))
    .filter(r => !KNOWN_OVER_CEILING.has(paramKey(r)))
    .map(r => `${r.id} ${r.axis}: doc [${r.doc}] but app [${r.app}]`);
  assert(fresh.length === 0,
    `brew advice beyond the research:\n    ${fresh.join("\n    ")}`);
});

test("every recorded brew-intent departure still exists", () => {
  // brewIntent.js explains departures that are real. If one stops
  // being a departure — the doc widens, or the card is pulled back —
  // the explanation becomes a lie about the data and should go.
  const live = new Set(outsideResearchedRange(INGREDIENTS)
    .filter(r => r.direction === "above").map(r => `${r.id}:${r.axis}`));
  const stale = Object.keys(DELIBERATE_RANGE_DEPARTURES).filter(k => !live.has(k));
  assert(stale.length === 0,
    `brewIntent explains departures that no longer exist:\n    ${stale.join("\n    ")}`);
});

test("every recorded deliberate grid names a real ingredient", () => {
  const unknown = Object.keys(DELIBERATE_GRIDS).filter(id => !EXTRACTION_PROFILES[id]);
  assert(unknown.length === 0, `brewIntent grids for unknown ingredients: ${unknown.join(", ")}`);
});

test("the known-over-ceiling list has no stale entries", () => {
  const live = new Set(outsideResearchedRange(INGREDIENTS)
    .filter(r => r.direction === "above" && !isDeliberate(r)).map(paramKey));
  const stale = [...KNOWN_OVER_CEILING].filter(k => !live.has(k));
  assert(stale.length === 0,
    `no longer over the ceiling — remove from KNOWN_OVER_CEILING:\n    ${stale.join("\n    ")}`);
});

// ── 1f. Flavour the research names and the cup doesn't show ──────

// The drift audit compared EFFECTS in both directions from the day it
// was written and never looked at flavours. Sixteen sat prescribed in
// §6 rows and absent from every profile, and were found by hand
// through the unreachable audit rather than reported. This is that
// blind spot closed.
//
// Family-level on purpose: flavour leaf words are near-synonyms in a
// way effect words aren't. Lapsang's doc says `smoky` and its profile
// says `smoked`; linden's doc says `honey-sweet` and its profile says
// `honey`. Those are the same claim, and comparing leaves reports them
// as gaps. What matters is whether the register reaches the cup.
const KNOWN_FLAVOUR_GAPS = new Set([
  "black-pepper:fruit", "cardamom:fruit", "cardamom:sweet", "ceylon:floral",
  "cloves:sweet", "darjeeling:fresh", "dragonwell:floral", "ginger:fruit",
  "gunpowder:fruit", "gunpowder:smoky", "hojicha:smoky", "gyokuro:body", 
  "lavender:vegetal", "lemonbalm:floral", "matcha:fresh", "nettle:fresh",
  "puerh:fresh", "puerh:sweet", "sencha:earthy", "spearmint:fruit",
  "tulsi:fruit", "tulsi:vegetal", "yerba-mate:fresh",
]);

test("no new flavour family goes missing from the cup", () => {
  const fresh = flavourFamilyGaps(EXTRACTION_PROFILES)
    .filter(g => !KNOWN_FLAVOUR_GAPS.has(flavourGapKey(g)))
    .map(g => `${g.id}: research names ${g.family} (${g.words.join(", ")}), no cup shows it`);
  assert(fresh.length === 0,
    `flavour families the research names and the cup doesn't:\n    ${fresh.join("\n    ")}`);
});

test("the known-flavour-gap list has no stale entries", () => {
  const live = new Set(flavourFamilyGaps(EXTRACTION_PROFILES).map(flavourGapKey));
  const stale = [...KNOWN_FLAVOUR_GAPS].filter(k => !live.has(k));
  assert(stale.length === 0,
    `these flavour families now reach the cup — remove from KNOWN_FLAVOUR_GAPS:\n    ${stale.join("\n    ")}`);
});

// ── 1d. Vocabulary the app invented ──────────────────────────────

test("no effect word is asserted far more often than the research uses it", () => {
  // Every other guard here works ingredient-by-ingredient, which is
  // why `comfort` survived so long: no single ingredient looked
  // egregious, but the WORD shipped on 27 ingredients while only 7
  // research docs ever prescribed it — a ratio of 3.9 while every
  // other token sat near 1. It was app-invented vocabulary layered on
  // top of `warming` and `soothing`, and it took a hand audit to see.
  //
  // This is the word-level view. A token drifting above the threshold
  // means the app is asserting a claim the research doesn't make, at
  // a scale no per-ingredient check will flag.
  const offenders = census
    .filter(c => c.ships >= 3 && c.ratio > INVENTION_RATIO)
    .map(c => `${c.token}: ships on ${c.ships}, only ${c.docs} docs prescribe it `
      + `(${c.ratio.toFixed(1)}x)`);
  assert(offenders.length === 0,
    `effect words the app asserts beyond its research:\n    ${offenders.join("\n    ")}`);
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
  // white@95:focus — doc 4, app 2, and this one is a genuine
  // disagreement rather than a transcription slip. The doc rates focus
  // 4 at 95C on compound grounds: its own range note says 95C "yields
  // highest polyphenol content (Yang 2018)... but flavor suffers". The
  // app models the FELT cup, where focus drops as catechins mask
  // theanine — which is how sencha, gyokuro and dragonwell are all
  // modelled at their top temperatures.
  //
  // Surfaced only now because white tea's research lived in
  // white-tea.md, which bound to no profile id, so nothing had ever
  // compared the two. Left for a human call on which reading wins.
  "white@95:focus",
  // EMPTY. Of the 13 that sat here, five were real and were transcribed
  // to their researched values — cranberry's uplifting and cooling,
  // lemon-peel's cooling, licorice-root's warming, all cases of the app
  // ramping a mild flat claim up to 3.
  //
  // The other eight were never drift at all. The pairing fell back to
  // "the only sample at that temperature" and compared it whatever the
  // steep time, so pu-erh's 30-second gongfu first pour was measured
  // against the doc's 4-minute western steep (x0.13) and vanilla's
  // 240s against 1200s (x0.20). Acting on those would have corrupted
  // the data. pairSample now requires the times to match within 25%
  // and counts the rest as unpairable, which is what they are.
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

test("every mood word carries its own definition", () => {
  // The tree in data/families.js is the single source: a leaf can't be
  // added without a definition, because they're written in the same
  // object literal. This asserts the derivation actually reaches the
  // map the UI reads, so the click-to-describe panel can never open
  // empty on a word the app is willing to display.
  const undefinedWords = Object.keys(FAMILY_BY_EFFECT)
    .filter(t => !EFFECT_DESCRIPTIONS[t]?.summary);
  assert(undefinedWords.length === 0,
    `mood words with no definition: ${undefinedWords.join(", ")}`);
});

test("no two mood words share a definition", () => {
  // `soothing` and `comfort` had the same one for a long time — the
  // family map called soothing "bodily comfort (demulcent — throat,
  // gut)" while its user-facing summary read "general comfort,
  // warmth-of-spirit", which is comfort's meaning under soothing's
  // name. Two files, one holding the structure and one the meaning,
  // and nothing comparing them. They're co-located now; this checks
  // they stay distinct.
  const seen = new Map(), clashes = [];
  for (const token of Object.keys(FAMILY_BY_EFFECT)) {
    const s = EFFECT_DESCRIPTIONS[token]?.summary;
    if (!s) continue;
    if (seen.has(s)) clashes.push(`${seen.get(s)} and ${token}: "${s}"`);
    else seen.set(s, token);
  }
  assert(clashes.length === 0,
    `mood words sharing one definition:\n    ${clashes.join("\n    ")}`);
});

test("a multi-leaf family defines itself, not just its children", () => {
  // A family with two leaves is drawn as a parent row of its own and
  // is tappable, so it needs a definition that isn't either child's.
  // `warm` is the only one today; the check is for the next one.
  const missing = [];
  for (const fam of MOOD_VOCABULARY) {
    if (fam.leaves.length < 2) continue;
    if (!fam.summary) { missing.push(`${fam.family} (no family-level summary)`); continue; }
    for (const leaf of fam.leaves) {
      if (leaf.summary === fam.summary) missing.push(`${fam.family} reuses ${leaf.token}'s definition`);
    }
  }
  assert(missing.length === 0, `family definitions:\n    ${missing.join("\n    ")}`);
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

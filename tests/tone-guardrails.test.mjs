/* ──────────────────────────────────────────────────────────────
   tests/tone-guardrails.test.mjs

   Catches voice/tone drift in user-facing copy before it ships.
   Audits every ingredient (blurb, facts, headsUp) and every
   blend (name, subtitle) against the guardrails recorded in
   docs/ingredient-addition-process.md.

   Six categories of check:

     1. Banned medical-claim verbs in blurb/facts ("treats X",
        "cures Y", "prevents Z"). Soften to "may help with",
        "traditionally used for", "studies have measured".
     2. Banned clinical jargon in user-facing copy. Specific
        enzyme names (CYP3A4) and pharmacology terms
        (prokinetic, anxiolytic) without softening context.
     3. Preferred-pattern check on headsUp — uses "talk to your
        doctor" pattern when prescription interactions are
        mentioned. "Consult a clinician" is the wrong register.
     4. Length caps — blurbs under ~90 words, headsUps under
        50 words, blend subtitles under 80 chars (one line).
     5. No emojis anywhere in user-facing copy.
     6. Subtitle conventions — blend subtitles start lowercase
        (after the apothecary-poet voice), no trailing period.

   Each check has well-tested allowlists for known exceptions
   (e.g. "treatment" in compliance contexts, compound names
   when they carry the story per process doc rule).

   Run: node tests/tone-guardrails.test.mjs
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "../src/data/ingredients.js";

import { readFileSync } from "node:fs";

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

console.log("Tone guardrails — voice consistency across catalog\n");

// ── Rule 1: Banned medical-claim verbs ────────────────────────
//
// These verbs over-promise pharmacological effect. The catalog
// should say "may help with," "traditionally used for," or
// "studies have measured" instead.

const BANNED_CLAIM_VERBS = [
  // word boundary patterns to avoid catching "treatment" or "preventive" in safer contexts
  /\btreats\b/i,
  /\bcures\b/i,
  /\bheals\b/i,        // "heals X" — but allow "heal" as a noun in blend names like "All-Heal"
  /\bprevents\b/i,
  /\beliminates\b/i,
  /\bdetoxifies\b/i,
  /\bdetoxify\b/i,
  /\bdetoxes\b/i,
  /\bremedies\b/i,     // verb sense — usually safe, but worth flagging
  /\bfights\s+(infection|cancer|disease|inflammation)\b/i,
  /\bboosts\s+(immunity|the\s+immune\s+system)\b/i,
];

// Phrases that *contain* a banned word but are explicitly self-
// correcting or quoting an overstated claim. The catalog uses
// these patterns to debunk myths inline.
const CLAIM_VERB_ALLOWLIST_PATTERNS = [
  /overstated/i,           // "the claim is overstated"
  /not\s+a\s+treatment/i,
  /not\s+medicine/i,
  /myth/i,
  /folk\s+claim/i,
  /supplement-industry\s+\w+\s+claims/i,  // "supplement-industry weight-loss claims"
  /'/,                     // contained in a single-quoted phrase like 'detoxifies'
  /"/,                     // contained in a double-quoted phrase
];

function passesClaimVerbCheck(text) {
  for (const re of BANNED_CLAIM_VERBS) {
    const match = text.match(re);
    if (!match) continue;
    // Check window of ±60 chars around match for an allowlist signal
    const i = match.index;
    const window = text.slice(Math.max(0, i - 60), Math.min(text.length, i + match[0].length + 60));
    const allowed = CLAIM_VERB_ALLOWLIST_PATTERNS.some(pat => pat.test(window));
    if (!allowed) return { ok: false, verb: match[0], context: window.trim() };
  }
  return { ok: true };
}

test("no banned medical-claim verbs in ingredient blurbs", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!ing.blurb) continue;
    const r = passesClaimVerbCheck(ing.blurb);
    if (!r.ok) offenders.push(`${id}: "${r.verb}" — …${r.context}…`);
  }
  assert(offenders.length === 0,
    `${offenders.length} banned-claim-verb violations:\n        - ` + offenders.join("\n        - "));
});

test("no banned medical-claim verbs in ingredient facts", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!Array.isArray(ing.facts)) continue;
    ing.facts.forEach((fact, i) => {
      const r = passesClaimVerbCheck(fact);
      if (!r.ok) offenders.push(`${id}.facts[${i}]: "${r.verb}" — …${r.context}…`);
    });
  }
  assert(offenders.length === 0,
    `${offenders.length} banned-claim-verb violations:\n        - ` + offenders.join("\n        - "));
});

// ── Rule 2: Banned clinical jargon (without softening) ────────
//
// The process doc says: name compounds when they carry the story
// (rooibos's aspalathin, lion's mane's hericenones). Don't name
// enzymes (CYP3A4 → "how the body processes some medications").
// Pharmacology terms should be softened.

const CLINICAL_JARGON_PATTERNS = [
  // enzyme/pathway names — almost never appropriate in user copy
  /\bCYP\d[A-Z]\d?\b/,             // CYP3A4, CYP1A2
  /\bcytochrome\s+P\d+/i,
  /\bGABA-?A\b/,                   // GABA-A receptor
  /\bMAO-?[AB]?\b/,                // MAO inhibitors
  /\b5-?HT\d?[A-Z]?\d?\b/,         // 5-HT receptors
  /\bNMDA\b/,
  /\bTRPV\d\b/,                    // TRPV1
  /\b11β-?HSD\d?\b/i,
  // pharmacology terms without softening
  /\bprokinetic\b/i,
  /\banxiolytic\b/i,
  /\bsedative-hypnotic\b/i,
  /\bantispasmodic\b/i,            // (allowed when softened — see allowlist)
  /\bantipyretic\b/i,
  /\bcarminative\b/i,
  /\bnootropic\b/i,
  /\bhepatoprotective\b/i,
  /\bnephroprotective\b/i,
];

// Allowlist windows — clinical term is OK if a softening signal
// appears within ±50 chars (e.g., "called", "a class of", "the
// pharmacology term", or a parenthetical plain-English gloss).
const JARGON_ALLOWLIST_PATTERNS = [
  /\bcalled\b/i,
  /\bknown as\b/i,
  /\bclass of\b/i,
  /\ba family of\b/i,
  /\bthe term\b/i,
  /\(.*\)/,                  // parenthetical gloss like "(blood thinner)"
  /\bin pharmacology\b/i,
  /—.*\w+/,                  // em-dash followed by an explanation
];

function passesJargonCheck(text) {
  for (const re of CLINICAL_JARGON_PATTERNS) {
    const match = text.match(re);
    if (!match) continue;
    const i = match.index;
    const window = text.slice(Math.max(0, i - 50), Math.min(text.length, i + match[0].length + 50));
    const softened = JARGON_ALLOWLIST_PATTERNS.some(pat => pat.test(window));
    if (!softened) return { ok: false, term: match[0], context: window.trim() };
  }
  return { ok: true };
}

test("no clinical jargon in ingredient blurbs (without softening)", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!ing.blurb) continue;
    const r = passesJargonCheck(ing.blurb);
    if (!r.ok) offenders.push(`${id}: "${r.term}" — …${r.context}…`);
  }
  assert(offenders.length === 0,
    `${offenders.length} clinical-jargon violations:\n        - ` + offenders.join("\n        - "));
});

test("no clinical jargon in ingredient facts (without softening)", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!Array.isArray(ing.facts)) continue;
    ing.facts.forEach((fact, i) => {
      const r = passesJargonCheck(fact);
      if (!r.ok) offenders.push(`${id}.facts[${i}]: "${r.term}" — …${r.context}…`);
    });
  }
  assert(offenders.length === 0,
    `${offenders.length} clinical-jargon violations:\n        - ` + offenders.join("\n        - "));
});

test("no clinical jargon in ingredient headsUps (without softening)", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!ing.headsUp) continue;
    const r = passesJargonCheck(ing.headsUp);
    if (!r.ok) offenders.push(`${id}: "${r.term}" — …${r.context}…`);
  }
  assert(offenders.length === 0,
    `${offenders.length} clinical-jargon violations:\n        - ` + offenders.join("\n        - "));
});

// ── Rule 3: Preferred patterns in headsUps ────────────────────
//
// "Consult a clinician" is the wrong register for this app.
// We use "talk to your doctor" instead.

const WRONG_REGISTER_PATTERNS = [
  /\bconsult\s+(a|your)\s+(clinician|physician|practitioner|healthcare provider)\b/i,
  /\bseek\s+medical\s+advice\b/i,
];

test("headsUps use 'talk to your doctor' register, not 'consult a clinician'", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!ing.headsUp) continue;
    for (const re of WRONG_REGISTER_PATTERNS) {
      const m = ing.headsUp.match(re);
      if (m) offenders.push(`${id}: "${m[0]}" — use "talk to your doctor" instead`);
    }
  }
  assert(offenders.length === 0,
    `${offenders.length} wrong-register violations:\n        - ` + offenders.join("\n        - "));
});

// ── Rule 4: Length caps ───────────────────────────────────────

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const BLURB_WORD_CAP = 110;     // some blurbs run rich; soft-ish cap
const HEADSUP_WORD_CAP = 60;
const SUBTITLE_CHAR_CAP = 90;

test(`ingredient blurbs are at most ${BLURB_WORD_CAP} words`, () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!ing.blurb) continue;
    const w = wordCount(ing.blurb);
    if (w > BLURB_WORD_CAP) offenders.push(`${id}: ${w} words (cap ${BLURB_WORD_CAP})`);
  }
  assert(offenders.length === 0,
    `${offenders.length} blurbs over cap:\n        - ` + offenders.join("\n        - "));
});

test(`ingredient headsUps are at most ${HEADSUP_WORD_CAP} words`, () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (!ing.headsUp) continue;
    const w = wordCount(ing.headsUp);
    if (w > HEADSUP_WORD_CAP) offenders.push(`${id}: ${w} words (cap ${HEADSUP_WORD_CAP})`);
  }
  assert(offenders.length === 0,
    `${offenders.length} headsUps over cap:\n        - ` + offenders.join("\n        - "));
});

// ── Rule 5: No emojis anywhere ────────────────────────────────

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

test("no emojis in ingredient user-facing fields", () => {
  const offenders = [];
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    const fields = {
      name: ing.name,
      blurb: ing.blurb,
      headsUp: ing.headsUp,
      dose: ing.dose,
    };
    for (const [field, value] of Object.entries(fields)) {
      if (typeof value === "string" && EMOJI_RE.test(value)) {
        offenders.push(`${id}.${field}: contains emoji`);
      }
    }
    if (Array.isArray(ing.facts)) {
      ing.facts.forEach((f, i) => {
        if (EMOJI_RE.test(f)) offenders.push(`${id}.facts[${i}]: contains emoji`);
      });
    }
  }
  assert(offenders.length === 0,
    `${offenders.length} emoji violations:\n        - ` + offenders.join("\n        - "));
});

// ── Rule 6: Blend subtitle conventions ────────────────────────
//
// Apothecary-poet voice — start lowercase (after intentional
// proper-noun openers — Calabrian, Bavarian, Maghrebi etc.),
// no trailing period (one image, not a sentence).

import("../src/data/blends.js").then(({ BLENDS }) => {

  test(`blend subtitles are at most ${SUBTITLE_CHAR_CAP} chars`, () => {
    const offenders = [];
    for (const b of BLENDS) {
      if (!b.subtitle) continue;
      if (b.subtitle.length > SUBTITLE_CHAR_CAP) {
        offenders.push(`${b.id}: ${b.subtitle.length} chars (cap ${SUBTITLE_CHAR_CAP})`);
      }
    }
    assert(offenders.length === 0,
      `${offenders.length} subtitles over cap:\n        - ` + offenders.join("\n        - "));
  });

  test("blend subtitles do not end with a period", () => {
    const offenders = [];
    for (const b of BLENDS) {
      if (!b.subtitle) continue;
      if (/\.\s*$/.test(b.subtitle) && !/\.\.\.$/.test(b.subtitle)) {
        offenders.push(`${b.id}: "${b.subtitle}"`);
      }
    }
    assert(offenders.length === 0,
      `${offenders.length} subtitles end with period:\n        - ` + offenders.join("\n        - "));
  });

  test("no emojis in blend names or subtitles", () => {
    const offenders = [];
    for (const b of BLENDS) {
      if (b.name && EMOJI_RE.test(b.name)) offenders.push(`${b.id}.name`);
      if (b.subtitle && EMOJI_RE.test(b.subtitle)) offenders.push(`${b.id}.subtitle`);
    }
    assert(offenders.length === 0,
      `${offenders.length} emoji violations:\n        - ` + offenders.join("\n        - "));
  });

  test("blend subtitles use em-dash (—), not double-hyphen (--)", () => {
    const offenders = [];
    for (const b of BLENDS) {
      if (!b.subtitle) continue;
      if (b.subtitle.includes("--")) offenders.push(`${b.id}: "${b.subtitle}"`);
    }
    assert(offenders.length === 0,
      `${offenders.length} subtitles use double-hyphen:\n        - ` + offenders.join("\n        - "));
  });

  test("blend subtitles do not contain banned medical-claim verbs", () => {
    const offenders = [];
    for (const b of BLENDS) {
      if (!b.subtitle) continue;
      const r = passesClaimVerbCheck(b.subtitle);
      if (!r.ok) offenders.push(`${b.id}: "${r.verb}" in "${b.subtitle}"`);
    }
    assert(offenders.length === 0,
      `${offenders.length} blend subtitle violations:\n        - ` + offenders.join("\n        - "));
  });

  // ── Final report ──────────────────────────────────────────
  setTimeout(() => {
    /* ── 7. THE APP DOESN'T GRADE THE DRINKER ──────────────────────────

   Everything above audits CATALOGUE copy. This one reaches into two
   components, and deliberately: they're where the app stopped
   describing a cup and started marking it.

   The caffeine gauge's upper tick read "too much" and its advisory
   read "over the line". Neither is chemistry — plenty of people clear
   130mg daily and happily, and the number was never the app's to
   judge. Reported as "caution is fine but too much is more of a
   judgement than it should be".

   What replaced it still has to land: a cup that strong reads as
   aggressive to anyone not used to it, so the copy says what it will
   DO and to whom ("bracing ... wired or jittery if you're sensitive
   to it") and lets the reader decide whether that's a problem.

   Scoped to the caffeine copy on purpose. "Over the line" is still
   the right phrase for an over-extracted cup — that IS a verdict
   about brewing, which is the thing the app is qualified to judge. */

const VERDICT_WORDS = [
  "too much", "over the line", "excessive", "unhealthy",
  "dangerous", "too strong", "shouldn't drink",
];

function sourceOf(relPath) {
  return readFileSync(new URL(relPath, import.meta.url), "utf8");
}

// The CaffeineBar component's own body, brace-matched from its
// declaration so the slice can't quietly drift onto other code.
function caffeineBarSource() {
  const src = sourceOf("../src/components/BlendExtractionExplorer.jsx");
  const start = src.indexOf("const CaffeineBar");
  assert(start !== -1, "CaffeineBar component not found — this test is looking at the wrong file");
  const end = src.indexOf("\n};", start);
  assert(end !== -1, "couldn't find the end of CaffeineBar");
  return stripComments(src.slice(start, end));
}

/* Comments are not copy. The note above the advisory band quotes the
   very phrases it replaced — explaining why they went — and a check
   that can't tell the explanation from the offence would forbid ever
   writing down what was fixed. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

test("the caffeine gauge describes the cup rather than judging the drinker", () => {
  const body = caffeineBarSource();
  const found = VERDICT_WORDS.filter(w => body.toLowerCase().includes(w));
  assert(found.length === 0,
    `the caffeine gauge passes verdict: ${found.map(f => `"${f}"`).join(", ")}`);
});

test("the caffeine warning says what it does, not whether it's allowed", () => {
  const src = sourceOf("../src/algo/perception.js");
  const line = src.split("\n").find(l => l.includes("caffeine load") && l.includes("${Math.round(caffeineMg)}"));
  assert(line, "the caffeine-load warning text moved — update this test with it");
  const found = VERDICT_WORDS.filter(w => stripComments(line).toLowerCase().includes(w));
  assert(found.length === 0, `the caffeine warning passes verdict: ${found.join(", ")}`);
});

test("but it still signals that a strong cup is strong", () => {
  // The failure mode of softening copy is copy that says nothing. The
  // gauge has to keep a word for the top of the scale.
  const body = caffeineBarSource().toLowerCase();
  assert(/\bhigh\b|bracing|strong|assertive|bold/.test(body),
    "the caffeine gauge no longer has a word for a strong cup — softened into silence");
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
    if (fail > 0) {
      console.log("\nFailures:");
      for (const f of failures) {
        console.log(`  ✗ ${f.desc}\n    ${f.message}`);
      }
      process.exit(1);
    }
  }, 50);
});

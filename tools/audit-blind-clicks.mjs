/* ──────────────────────────────────────────────────────────────
   tools/audit-blind-clicks.mjs — acting on a locator nobody checked
   was there.

   CLAUDE.md has said this since the elemental-notices investigation:

     "A bare .click() has no timeout of its own. It waits out the whole
      test budget and reports 'timeout in beforeEach', which names the
      hook and never the thing that was missing. Assert visibility
      BEFORE clicking and the message changes from 'the hook timed out'
      to 'this locator never appeared'."

   It is written down, it is correct, and it kept happening anyway —
   twice in one session, costing 24 failing tests at 90 seconds each,
   both times reporting nothing more useful than "Test timeout of
   90000ms exceeded".

   Every other recurring failure in this repo got a machine check and
   this one had a paragraph. That is the whole reason this file exists:
   the fix for something people keep forgetting is not asking them to
   remember harder.

   WHY NOT AN ESLINT RULE. e2e/ is TypeScript and ESLint here is
   configured for JS and JSX files only, so the specs are unlinted. Adding
   `typescript-eslint` means a parser dependency resolved against
   typescript@^7, which is the same trap docs/capacitor-config.md
   already records. typescript@7 ships the native compiler and its ESM
   export has no createSourceFile, so there is no AST to borrow either.

   SO THIS IS A SCANNER, NOT A PARSER, and its limits are real:
   it reads statements, not scope. It matches a receiver by its source
   TEXT, so `card.click()` is satisfied by any earlier `expect(card...`
   in the same test — including one guarding a different card with the
   same variable name. It will not see an assertion made inside a
   helper the test calls. It is deliberately generous in both
   directions: a hit is worth reading, and a clean run is not a proof.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/* Actions that DO something to the page. Reads (textContent, count,
   boundingBox) are excluded — asserting a locator exists before
   reading it is good practice, but a read that finds nothing fails
   fast and says so. It is the interactions that hang. */
const ACTIONS = ["click", "fill", "press", "tap", "check", "uncheck",
  "selectOption", "hover", "dblclick", "setInputFiles", "focus", "clear"];

/* THE RECEIVER, found by walking backwards and balancing delimiters.

   Two earlier versions got this wrong in opposite directions and both
   reported a confident number while doing it. A character class left
   `/` out, so a regex-literal selector — the exact dynamic shape this
   hunts — silently failed to parse and was skipped. Slicing the whole
   line prefix instead swept in `.first()` from a previous clause and
   quadrupled the risky tier.

   Walking back from the action and balancing ()[]{} finds the actual
   chained expression. It still cannot read a regex containing an
   unbalanced bracket, which is rare here and is the sort of limit
   worth stating rather than discovering later. */
function receiverBefore(text, dotIndex) {
  let depth = 0, j = dotIndex - 1;
  for (; j >= 0; j--) {
    const c = text[j];
    if (c === '"' || c === "'" || c === "`") {          // skip a string literal
      const q = c; j--;
      while (j >= 0 && !(text[j] === q && text[j - 1] !== "\\")) j--;
      continue;
    }
    if (c === ")" || c === "]" || c === "}") { depth++; continue; }
    if (c === "(" || c === "[" || c === "{") {
      if (depth === 0) break;                            // an enclosing opener
      depth--; continue;
    }
    if (depth === 0 && (c === ";" || c === "," || c === "=" || c === " ")) break;
  }
  return text.slice(j + 1, dotIndex).trim();
}

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".ts")) files.push(p);
  }
})("e2e");

const hits = [];
let actions = 0;

for (const file of files) {
  const raw = readFileSync(file, "utf8").split("\n");

  /* Join continued lines into statements, keeping the line number of
     the line the action appears on. */
  const stmts = [];
  let buf = "", start = 0;
  raw.forEach((line, i) => {
    if (!buf) start = i + 1;
    buf += (buf ? " " : "") + line.trim();
    if (/[;{}]$/.test(line.trim()) || line.trim() === "") {
      stmts.push({ line: start, text: buf }); buf = "";
    }
  });
  if (buf) stmts.push({ line: start, text: buf });

  /* Test boundaries — an assertion in a previous test does not count. */
  let testStart = 0;
  stmts.forEach((s, idx) => {
    if (/\b(test|test\.\w+)\s*\(/.test(s.text)) testStart = idx;

    for (const act of ACTIONS) {
      const re = new RegExp(`\\.${act}\\s*\\(`, "g");
      let m;
      while ((m = re.exec(s.text))) {
        const recv = receiverBefore(s.text, m.index);
        if (!recv) continue;
        if (!/(^page\b|getBy|locator\(|^[A-Za-z_$][\w$]*$)/.test(recv)) continue;
        if (/^(page|browser|context)$/.test(recv) && act !== "click") continue;
        actions++;

        const key = recv.replace(/\s+/g, "");
        const guarded = stmts.slice(testStart, idx).some(prev =>
          /\bexpect\s*\(/.test(prev.text) &&
          prev.text.replace(/\s+/g, "").includes(key));
        if (!guarded) {
          const picks = /\.(first|last|nth)\s*\(/.test(recv);
          const built = /\$\{|new RegExp|`/.test(recv);
          hits.push({ file, line: s.line, act, recv: recv.slice(0, 78), risky: picks || built });
        }
      }
    }
  });
}

/* ── Tiering, and why there is a ratchet instead of a zero ─────────
   The first version of this reported every unguarded action: 287 of
   325, or 88%. That is not a gate, it is a wall — and most of it is
   fine. Clicking the "Profile" tab without asserting it exists is not
   the bug this is chasing; that button is always on screen and its
   absence would be a different failure entirely.

   The two that actually cost a session share a narrower shape: the
   locator PICKS from several matches, or is built from data, so
   whether it exists at all depends on earlier state having worked.

     page.getByRole("button", { name: new RegExp(name, "i") }).first()
     page.getByRole("button", { name: /lavender/i }).first()

   The first was a card that only appears after a search; the second a
   leaf that was never listed because the search box still held the
   previous query. Both reported nothing but "Test timeout of 90000ms
   exceeded". Both are in the RISKY tier below; neither is a plain
   literal.

   Measured, not reasoned: 97 risky against 300 plain. So the risky
   tier gets a ratchet — it may not grow — and the plain tier is
   reported for information. A ratchet is what this repo already does
   with KNOWN_UNSOURCED, and for the same reason: the existing ones are
   a worklist, the next one is a regression. */
const RISKY_BASELINE = 97;   /* Measured, and set to exactly the measured
   number: a baseline with slack is not a ratchet, it is a queue of free
   passes for the next bug.

   It read 23 until the receiver scanner was fixed. That is worth
   remembering — the low number came from a parser that could not read
   regex-literal selectors and skipped them, which is to say it was
   blindest to precisely the locators most likely to be missing. Lower
   was not better; it was wrong. */

const risky = hits.filter(h => h.risky);
const plain = hits.filter(h => !h.risky);

console.log(`\nActions on a locator, across ${files.length} spec files: ${actions}`);
console.log(`Not preceded by an expect() naming the same locator: ${hits.length}`);
console.log(`  RISKY  (.first()/.nth(), or a selector built from data): ${risky.length}`);
console.log(`  plain  (a literal selector for something always present): ${plain.length}\n`);

for (const h of risky) {
  console.log(`  ${h.file}:${h.line}  .${h.act}()  <- ${h.recv}`);
}

if (risky.length > RISKY_BASELINE) {
  console.log(`\n${risky.length} risky blind actions against a baseline of ${RISKY_BASELINE}.`);
  console.log(`A locator that picks from several matches, or is built from data, may not`);
  console.log(`exist at all — and a bare action on it waits out the whole test budget and`);
  console.log(`reports "Test timeout", naming the hook instead of the thing that was`);
  console.log(`missing. Assert it is visible first and the message names the locator.`);
  process.exit(1);
}
console.log(`\nRisky tier at ${risky.length}/${RISKY_BASELINE} — not grown.`);
console.log(`The plain tier is informational: a literal selector for stable chrome fails`);
console.log(`fast and legibly on its own. This tool is a scanner, not a parser — see the`);
console.log(`header for what it cannot see.`);

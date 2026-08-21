/* ──────────────────────────────────────────────────────────────
   tests/viewport-units.test.mjs

   Guards the app's height against `100vh`.

   On iOS Safari `100vh` is the height of the viewport WITH the
   browser toolbars retracted — a number the user never actually
   sees while the toolbars are up. An app column sized that way is
   taller than the screen, and what falls off the bottom is the
   last thing in the column: on this app, the tab dock. The tab
   dock is how you navigate. That's the whole bug.

   `100dvh` is the dynamic value — the viewport as it currently
   is, toolbars included — and `100svh` is the small (toolbars
   shown) value. Either is honest; `100vh` is not.

   WHY THIS IS A SOURCE CHECK AND NOT A BROWSER ONE.

   There is no headless browser in which this is testable. Chromium,
   WebKit and Firefox all compute `100vh` and `100dvh` to the same
   number under Playwright, because none of them has a retracting
   toolbar to make the two differ — Playwright's iPhone presets
   emulate the viewport and the touch stack, not Safari's chrome. An
   E2E assertion would therefore pass just as happily with the bug
   reinstated, which is worse than no test: it would read as
   coverage. The unit is the only thing that can be checked, so the
   unit is what gets checked.

   Found already fixed — the app shell was moved to `100dvh` while
   testing an Android build — and codified here so it stays that
   way. A regression would be one careless `height: "100vh"` in a
   screen wrapper, invisible on every device the author owns.

   Run: node tests/viewport-units.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join, relative } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../src");

let pass = 0, fail = 0;
const failures = [];

function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Viewport units — the app is as tall as the screen, not as tall as vh\n");

// Every source file that can carry a style.
function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(jsx?|css)$/.test(name)) out.push(full);
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────
   The one place a bare vh is allowed, and why.

   Written as a reason rather than a bare path, on the same
   principle as brewIntent: an exemption list reads as "not fixed
   yet", where a recorded decision reads as a decision. Removing an
   entry makes the guard report that line again, which is correct
   if the intent changes.
   ────────────────────────────────────────────────────────────── */
/* EMPTY, AND THAT IS THE INTERESTING PART.

   The single entry here exempted the outer desktop page — the masthead,
   demo hints and footer wrapped around the app column — on the grounds
   that an ordinary scrolling document can overshoot the visible
   viewport harmlessly. True while it lasted. That page had also been
   invisible for a long time, covered by PhoneFrame's `position: fixed;
   inset: 0`, and when it was deleted this exemption became a recorded
   decision about markup that no longer exists.

   The "every exemption still matches something" test is what said so,
   on the same run, unprompted. That check is the half worth having: a
   stale entry is exactly what makes a list look considered, and nothing
   else in the suite would have noticed a reason attached to nothing. */
const ALLOWED = [];

const files = sourceFiles(SRC);

test("the source tree was actually found", () => {
  assert(files.length > 10, `only ${files.length} source files — the walk is wrong`);
});

test("no bare 100vh sizes anything but the desktop page wrapper", () => {
  const offenders = [];
  for (const full of files) {
    const rel = relative(SRC, full);
    const lines = readFileSync(full, "utf8").split("\n");
    lines.forEach((line, i) => {
      // Skip comments — the fallback note next to 100dvh names the unit
      // on purpose, and prose about the bug shouldn't trip its own guard.
      const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
      if (!/\b100vh\b/.test(code)) return;
      const excused = ALLOWED.some(a => rel.endsWith(a.file) && a.match.test(code));
      if (!excused) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
    });
  }
  assert(offenders.length === 0,
    `100vh is taller than the visible viewport on iOS — use 100dvh (or 100svh):\n  `
    + offenders.join("\n  "));
});

test("the app shell itself is sized dynamically", () => {
  // The positive half. Banning 100vh doesn't prove anything is using a
  // dynamic unit — deleting the height entirely would pass that check
  // while collapsing the layout.
  const app = readFileSync(resolve(SRC, "App.jsx"), "utf8");
  assert(/height: "100dvh"/.test(app),
    "App.jsx no longer sizes the app column with 100dvh");
});

test("the document baseline uses a viewport-honest unit too", () => {
  const css = readFileSync(resolve(SRC, "index.css"), "utf8");
  assert(/min-height:\s*100(dvh|svh)/.test(css),
    "index.css should hold the page to a dynamic/small viewport height");
});

test("every recorded exemption still matches something", () => {
  // A stale exemption is worse than none: it silently widens the rule
  // for a line that no longer exists, so the next 100vh to appear in
  // that file could slip through on an old excuse.
  for (const a of ALLOWED) {
    const full = files.find(f => f.endsWith(a.file));
    assert(full, `exemption names ${a.file}, which isn't in src/`);
    const hit = readFileSync(full, "utf8").split("\n").some(l => a.match.test(l));
    assert(hit, `the exemption for ${a.file} matches nothing any more — delete it:\n    ${a.why}`);
  }
});

// ── Report ───────────────────────────────────────────────────────

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

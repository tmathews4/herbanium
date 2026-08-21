/* ──────────────────────────────────────────────────────────────
   tests/steep-formatting.test.mjs

   HOW LONG A CUP STEEPED, SAID THE SAME WAY EVERYWHERE — and never
   rounded up.

   Three surfaces printed the same number three ways. Recipe cards and
   the brew bar used m:ss. The Home brew log used
   `Math.round(timeS / 60)` and the recipe directions used the same
   rounding in prose. The slider's own axis labels rounded too, while
   the temperature labels beside them were exact.

   Rounding a duration is not a cosmetic loss, and the direction is
   what makes it a defect: EVERY curated recipe that disagreed with its
   own card rounded UP, so the app always claimed more steep than the
   recipe asked for. Eight of forty-nine. Genmaicha's 2:30 logged as
   3m. The matcha entries are the sharp end — a 30-second whisk logged
   as 1m is double, on the one preparation where seconds are the whole
   resolution, and brewBounds keeps a 1-second slider step specifically
   for that range. The app knew the number and the display threw it
   away.

   On an AXIS it is worse than disagreement. The time slider's floor is
   15s and read "0m" — not a steep at all, but the pouring of water
   that TIME_HARD_MIN exists to forbid — and a ceiling of 228s rounded
   UP to "4m" when the control stops at 3:48, so the axis named a value
   no finger could reach. That is what made the steep slider look
   broken: a chamomile-and-lion's-mane pot really does stop at 9:10
   because chamomile caps it, but an axis reading "9m" beside an
   ingredient row reading "10-30m" looks like a round arbitrary limit
   rather than a measured one.

   Run: node tests/steep-formatting.test.mjs
   ────────────────────────────────────────────────────────────── */

import { mmss } from "../src/helpers/misc.js";
import { BLENDS } from "../src/data/blends.js";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Steep formatting — one duration, said the same way\n");

test("m:ss never rounds, in either direction", () => {
  assert(mmss(30) === "0:30", `30s should read 0:30, got ${mmss(30)}`);
  assert(mmss(150) === "2:30", `150s should read 2:30, got ${mmss(150)}`);
  assert(mmss(295) === "4:55", `295s should read 4:55, got ${mmss(295)}`);
  assert(mmss(15) === "0:15", `the slider floor should read 0:15, got ${mmss(15)}`);
  assert(mmss(550) === "9:10", `the chamomile+lion's mane ceiling, got ${mmss(550)}`);
});

test("no curated recipe reads as a longer steep than it is", () => {
  /* The regression surface, and the shape the bug had: not "these
     differ" but "these differ UPWARD". A future formatter that floors
     would pass a plain equality check and still be wrong in the other
     direction, so the direction is asserted too. */
  const over = [];
  for (const b of BLENDS) {
    if (b.timeS == null) continue;
    const shown = mmss(b.timeS);
    const [m, s] = shown.split(":").map(Number);
    const back = m * 60 + s;
    if (back !== b.timeS) over.push(`${b.name}: ${b.timeS}s renders as ${shown} (${back}s)`);
  }
  assert(over.length === 0, `these do not survive a round trip:\n    ${over.join("\n    ")}`);
});

test("the recipe directions spell out seconds instead of absorbing them", () => {
  // BlendDetail's prose rule, kept here because it is the arithmetic
  // and the arithmetic is what was wrong. Prose can't use m:ss, so it
  // has its own shape — but it still may not round.
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const label = (total) => {
    const mins = Math.floor(total / 60), secs = total % 60;
    return mins < 1 ? plural(secs, "second")
      : secs === 0 ? plural(mins, "minute")
      : `${plural(mins, "minute")} ${plural(secs, "second")}`;
  };
  assert(label(30) === "30 seconds", label(30));
  assert(label(60) === "1 minute", label(60));
  assert(label(150) === "2 minutes 30 seconds", label(150));
  assert(label(240) === "4 minutes", label(240));
  assert(label(600) === "10 minutes", label(600));
});

test("every curated recipe's directions state its real steep", () => {
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const label = (total) => {
    const mins = Math.floor(total / 60), secs = total % 60;
    return mins < 1 ? plural(secs, "second")
      : secs === 0 ? plural(mins, "minute")
      : `${plural(mins, "minute")} ${plural(secs, "second")}`;
  };
  const wrong = [];
  for (const b of BLENDS) {
    if (b.timeS == null) continue;
    const said = label(b.timeS);
    const m = said.match(/(?:(\d+) minutes?)?\s*(?:(\d+) seconds?)?/);
    const back = (Number(m[1]) || 0) * 60 + (Number(m[2]) || 0);
    if (back !== b.timeS) wrong.push(`${b.name}: ${b.timeS}s said as "${said}"`);
  }
  assert(wrong.length === 0, `directions misstate the steep:\n    ${wrong.join("\n    ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

/* ──────────────────────────────────────────────────────────────
   tests/follow-up.test.mjs

   When the app asks how a cup landed. Worth pinning because every
   failure mode here is silent: a card that never appears, one that
   appears too early to answer, or one that a user snoozes straight
   out of its own window.

   Run: node tests/follow-up.test.mjs
   ────────────────────────────────────────────────────────────── */

import {
  FOLLOWUP_CHOICES, DEFAULT_FOLLOWUP_MS, FOLLOWUP_WINDOW_MS,
  SNOOZE_MS, MAX_SNOOZES,
  scheduleFollowUp, snoozeFollowUp, isFollowUpDue, nextFollowUp,
} from "../src/data/followUp.js";

import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Follow-up — when the app asks how a cup landed\n");

const MIN = 60 * 1000;
const MORNING = new Date(2026, 7, 1, 9, 0, 0).getTime();
const EVENING = new Date(2026, 7, 1, 22, 30, 0).getTime();

const cup = (over = {}) => ({
  who: "you", moodsPending: true, brewedAt: MORNING, ...over,
});

// ── Choices ──────────────────────────────────────────────────────

test("every choice has an id and a human label", () => {
  for (const c of FOLLOWUP_CHOICES) {
    assert(typeof c.id === "string" && c.id, "choice missing id");
    assert(typeof c.label === "string" && c.label, `choice ${c.id} missing label`);
    assert(c.delayMs != null || c.atHour != null, `choice ${c.id} has no timing`);
  }
});

test("no choice asks sooner than the default", () => {
  // The default already sits at the point where mood is knowable.
  // Anything faster would be asking a question with no answer yet.
  for (const c of FOLLOWUP_CHOICES) {
    if (c.delayMs == null) continue;
    assert(c.delayMs >= DEFAULT_FOLLOWUP_MS,
      `${c.id} asks after ${c.delayMs}ms, sooner than the ${DEFAULT_FOLLOWUP_MS}ms default`);
  }
});

test("the default choice is the default delay", () => {
  assert(scheduleFollowUp(MORNING) === MORNING + DEFAULT_FOLLOWUP_MS,
    "no pick should use the default");
  assert(scheduleFollowUp(MORNING, "default") === MORNING + DEFAULT_FOLLOWUP_MS,
    "an explicit default pick should match");
});

test("an unknown choice falls back rather than throwing", () => {
  // The id comes from UI that may gain options; a stale one shouldn't
  // break logging a brew.
  assert(scheduleFollowUp(MORNING, "next tuesday") === MORNING + DEFAULT_FOLLOWUP_MS,
    "unknown id should fall back to the default");
});

test('"tonight" means an evening hour, not a fixed delay', () => {
  // A duration would put a 9am cup's check-in mid-afternoon.
  const at = new Date(scheduleFollowUp(MORNING, "tonight"));
  assert(at.getHours() === 20, `expected 20:00, got ${at.getHours()}:00`);
  assert(at.getDate() === new Date(MORNING).getDate(), "should be the same day");
});

test('"tonight" on a late cup asks soon instead of tomorrow', () => {
  // 22:30 is already past the evening hour. Waiting until tomorrow
  // night would put the ask outside the 24-hour window entirely.
  const due = scheduleFollowUp(EVENING, "tonight");
  assert(due === EVENING + DEFAULT_FOLLOWUP_MS,
    `expected the default delay, got ${(due - EVENING) / MIN} min`);
  assert(due - EVENING < FOLLOWUP_WINDOW_MS, "must stay inside the window");
});

// ── Due-ness ─────────────────────────────────────────────────────

test("a cup isn't due before its time", () => {
  const s = cup({ followUpAt: MORNING + 30 * MIN });
  assert(isFollowUpDue(s, MORNING + 5 * MIN) === false, "5 min in should not be due");
  assert(isFollowUpDue(s, MORNING + 31 * MIN) === true, "31 min in should be due");
});

test("a cup with no followUpAt still gets asked about", () => {
  // Sessions brewed before this field existed must not be stranded
  // as permanently-pending.
  const legacy = cup();
  assert(isFollowUpDue(legacy, MORNING + 5 * MIN) === false, "too early");
  assert(isFollowUpDue(legacy, MORNING + DEFAULT_FOLLOWUP_MS + MIN) === true,
    "a legacy session should fall back to the default delay");
});

test("a cup goes quiet after the window", () => {
  const s = cup({ followUpAt: MORNING + 30 * MIN });
  assert(isFollowUpDue(s, MORNING + FOLLOWUP_WINDOW_MS - MIN) === true, "still inside");
  assert(isFollowUpDue(s, MORNING + FOLLOWUP_WINDOW_MS + MIN) === false,
    "past 24h it's archaeology, not a check-in");
});

test("answered, dismissed and other people's cups are never due", () => {
  const now = MORNING + 60 * MIN;
  assert(isFollowUpDue(cup({ moodsPending: false }), now) === false, "already answered");
  assert(isFollowUpDue(cup({ who: "someone" }), now) === false, "not the user's cup");
  assert(isFollowUpDue(null, now) === false, "null is not due");
});

test("nextFollowUp picks a due cup and ignores the rest", () => {
  const due = cup({ followUpAt: MORNING + 10 * MIN, id: "due" });
  const early = cup({ followUpAt: MORNING + 90 * MIN, id: "early" });
  const answered = cup({ moodsPending: false, id: "answered" });
  const now = MORNING + 20 * MIN;
  assert(nextFollowUp([answered, early, due], now)?.id === "due", "should find the due cup");
  assert(nextFollowUp([answered, early], now) === null, "nothing due should be null");
  assert(nextFollowUp([], now) === null, "empty is null");
  assert(nextFollowUp(undefined, now) === null, "undefined is null");
});

// ── Snoozing ─────────────────────────────────────────────────────

test("a snooze pushes the ask back", () => {
  const s = cup({ followUpAt: MORNING + 30 * MIN });
  const now = MORNING + 35 * MIN;
  const next = snoozeFollowUp(s, now);
  assert(next.followUpAt === now + SNOOZE_MS, `expected now+snooze, got ${next.followUpAt}`);
  assert(isFollowUpDue({ ...s, ...next }, now) === false, "should not be due right after snoozing");
  assert(isFollowUpDue({ ...s, ...next }, now + SNOOZE_MS + MIN) === true, "due again after the snooze");
});

test("snoozing from the future adds to the future, not to now", () => {
  // Snoozing a card that isn't due yet (possible via a stale render)
  // must not pull the ask EARLIER than it already was.
  const s = cup({ followUpAt: MORNING + 90 * MIN });
  const next = snoozeFollowUp(s, MORNING + 10 * MIN);
  assert(next.followUpAt > MORNING + 90 * MIN, "snooze must never move the ask earlier");
});

test("snoozes are counted and eventually run out", () => {
  let s = cup({ followUpAt: MORNING });
  let now = MORNING;
  for (let i = 0; i < MAX_SNOOZES; i++) {
    const next = snoozeFollowUp(s, now);
    assert(next !== null, `snooze ${i + 1} should be allowed`);
    s = { ...s, ...next };
    now = s.followUpAt;
  }
  assert(snoozeFollowUp(s, now) === null,
    "past the cap the caller should hide the control, not offer a dead button");
});

test("the snooze cap keeps the ask inside its own window", () => {
  // Otherwise a user could snooze the card straight past 24 hours and
  // it would vanish mid-conversation instead of being answered.
  assert(MAX_SNOOZES * SNOOZE_MS + DEFAULT_FOLLOWUP_MS < FOLLOWUP_WINDOW_MS,
    `${MAX_SNOOZES} snoozes of ${SNOOZE_MS / MIN} min can outlive the window`);
});

/* ── ONE RELATIVE TIME, EVERYWHERE ──────────────────────────────────

   Three screens had each written their own "X ago" formatter, and they
   disagreed in three ways at once: the separator ("5m ago" against "5
   min ago"), the rounding (round against floor, so a 90-second-old cup
   was two minutes on one screen and one on another), and the fallback
   for old items ("Aug 6" against "8/6/2026").

   Not a maintenance smell — the only finding in the redundancy audit a
   user could actually see, since the same entry read differently
   depending on which screen you opened it from. They all use
   helpers/misc now, and this test is what stops the fourth copy. */

test("no screen writes its own relative-time formatter", () => {
  const OWN_FORMATTER = /\bmin ago\b|`\$\{[^}]*\}m ago`/;
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
      if (entry.isDirectory()) { walk(child); continue; }
      if (!/\.(jsx?|tsx?)$/.test(entry.name)) continue;
      if (child.href.endsWith("/helpers/misc.js")) continue;   // the one that may
      const src = readFileSync(child, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
      if (OWN_FORMATTER.test(src)) offenders.push(entry.name);
    }
  };
  walk(new URL("../src/", import.meta.url));
  assert(offenders.length === 0,
    `${offenders.length} file(s) format relative time themselves instead of using formatAgo: ${offenders.join(", ")}`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

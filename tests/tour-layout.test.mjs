/* ──────────────────────────────────────────────────────────────
   tests/tour-layout.test.mjs

   Covers the guided tour's two hard-to-eyeball parts:

     1. Callout geometry (helpers/tourLayout.js) — where the callout
        lands relative to the highlighted target and to anything the
        step declares it must keep visible. Verifying this by hand
        means opening the tour on ten device sizes and squinting; here
        it's arithmetic.

     2. Tour content (data/tours.js) — the Blend tour's step order,
        keepClear pairing, and the two-step Simple/Detailed walkthrough.
        These are load-bearing: the prediction and slider steps only fit
        on a phone with the strips on Simple, and that's carried by the
        steps' `familyMode` — easy to break while editing copy.

   The device numbers below are measured, not guessed — see the
   comment above DEVICES.

   Run: node tests/tour-layout.test.mjs
   ────────────────────────────────────────────────────────────── */

import {
  unionSpan, unionRect, groupScrollDelta, calloutPlacement, calloutBox, overlapHeight,
  GAP, MARGIN,
} from "../src/helpers/tourLayout.js";
import { SCREEN_TOURS } from "../src/data/tours.js";

let pass = 0, fail = 0;
const failures = [];

function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Guided tour — callout geometry and tour content\n");

// ── 1. unionSpan ─────────────────────────────────────────────────

test("unionSpan covers every box", () => {
  const u = unionSpan([{ top: 100, bottom: 200 }, { top: 320, bottom: 400 }]);
  assert(u.top === 100 && u.bottom === 400, `got ${JSON.stringify(u)}`);
});

test("unionSpan ignores missing elements and returns null when empty", () => {
  assert(unionSpan([]) === null, "empty list should be null");
  assert(unionSpan([null, undefined]) === null, "all-missing should be null");
  const u = unionSpan([null, { top: 10, bottom: 20 }]);
  assert(u.top === 10 && u.bottom === 20, "should skip the missing one");
});

test("unionRect covers every box on both axes", () => {
  const u = unionRect([
    { top: 100, left: 20, bottom: 140, right: 90 },
    { top: 160, left: 8,  bottom: 400, right: 300 },
  ]);
  assert(u.top === 100 && u.left === 8 && u.bottom === 400 && u.right === 300, JSON.stringify(u));
  assert(u.width === 292 && u.height === 300, `size wrong: ${JSON.stringify(u)}`);
});

test("unionRect of a single box is that box", () => {
  const one = { top: 10, left: 5, bottom: 30, right: 55 };
  const u = unionRect([one]);
  assert(u.top === 10 && u.left === 5 && u.bottom === 30 && u.right === 55, JSON.stringify(u));
  assert(unionRect([]) === null, "empty should be null");
});

test("a spotlight group swallows a child element's box", () => {
  // The Simple/Detailed step lights the toggle plus the graph, and the
  // toggle lives INSIDE the graph — the union must be the graph.
  const graph  = { top: 100, left: 0,  bottom: 400, right: 380 };
  const toggle = { top: 108, left: 300, bottom: 128, right: 372 };
  const u = unionRect([toggle, graph]);
  assert(u.top === graph.top && u.bottom === graph.bottom
      && u.left === graph.left && u.right === graph.right,
    `expected the graph box, got ${JSON.stringify(u)}`);
});

// ── 2. groupScrollDelta ──────────────────────────────────────────

// A pane that fills a 700px window, and a realistic phone pane: a
// 658px window with a header and tab dock taking 165px between them.
const FULL = { top: 0, bottom: 700 };
const PHONE_PANE = { top: 92, bottom: 585 };

test("groupScrollDelta parks the group flush to the pane's bottom margin", () => {
  const delta = groupScrollDelta({ top: 100, bottom: 500 }, FULL);
  assert(delta === 500 - (700 - MARGIN), `got ${delta}`);
  assert(500 - delta === 700 - MARGIN, "post-scroll bottom should sit on the margin");
});

test("groupScrollDelta measures against the PANE, not the window", () => {
  // The bug this guards: measuring against window.innerHeight parks the
  // group ~57px too low on a phone, tucking the bars under the header.
  // This group (538) is taller than the phone pane (493), so it centres
  // — and either way it must be positioned relative to the pane.
  const group = { top: 47, bottom: 585 };
  const delta = groupScrollDelta(group, PHONE_PANE);
  const top = 47 - delta, bottom = 585 - delta;
  const paneMid = (PHONE_PANE.top + PHONE_PANE.bottom) / 2;
  assert(Math.abs((top + bottom) / 2 - paneMid) <= 1,
    `group should centre on the pane (mid ${paneMid}), got ${(top + bottom) / 2}`);
  // Sanity: the same group measured against the window would sit lower.
  const wrong = groupScrollDelta(group, { top: 0, bottom: 658 });
  assert(585 - wrong > bottom, "window-relative placement should sit lower than pane-relative");
});

test("groupScrollDelta pulls a group back up when it hangs below the pane", () => {
  const delta = groupScrollDelta({ top: 300, bottom: 900 }, FULL);
  assert(delta > 0, `should scroll down, got ${delta}`);
  assert(900 - delta === 700 - MARGIN, "bottom should end on the margin");
});

test("an oversized group centres, splitting the overflow evenly", () => {
  // Taller than the pane: the overflow has to go somewhere, and half at
  // each end beats clipping one element in two.
  const group = { top: 0, bottom: 900 };   // 900 tall in a 700 region
  const delta = groupScrollDelta(group, FULL);
  const top = 0 - delta, bottom = 900 - delta;
  assert(Math.abs((FULL.top - top) - (bottom - FULL.bottom)) <= 1,
    `overflow should be even, got ${FULL.top - top} above and ${bottom - FULL.bottom} below`);
});

test("a group that only just fits still parks flush", () => {
  const group = { top: 0, bottom: 690 };   // 690 in a 700 pane — fits
  const delta = groupScrollDelta(group, FULL);
  assert(690 - delta === FULL.bottom - MARGIN, `should park flush, got ${690 - delta}`);
});

test("groupScrollDelta ignores sub-pixel noise and missing inputs", () => {
  assert(groupScrollDelta(null, FULL) === 0, "null group is a no-op");
  assert(groupScrollDelta({ top: 100, bottom: 500 }, null) === 0, "null region is a no-op");
  assert(groupScrollDelta({ top: 100, bottom: 684.4 }, FULL) === 0, "0.4px is noise");
});

// ── 3. calloutPlacement — the plain (no keepClear) cases ─────────

test("callout sits below a target with room beneath it", () => {
  const pos = calloutPlacement({ rect: { top: 100, bottom: 200 }, vh: 700 });
  assert(pos.top === 200 + GAP, `got ${JSON.stringify(pos)}`);
  assert(pos.bottom === undefined, "should not also pin the bottom");
});

test("callout flips above when that's the roomier side", () => {
  const pos = calloutPlacement({ rect: { top: 400, bottom: 660 }, vh: 700 });
  assert(pos.bottom === 700 - 400 + GAP, `got ${JSON.stringify(pos)}`);
  assert(pos.top === undefined, "should not also pin the top");
});

test("a target too tall for either side pins the callout to the bottom", () => {
  // No keepClear: overlaying the highlighted target is the acceptable
  // outcome — an off-screen callout is not, since the overlay blocks
  // page scroll and it would be unreachable.
  const pos = calloutPlacement({ rect: { top: 60, bottom: 640 }, vh: 700 });
  assert(pos.bottom === MARGIN, `expected bottom-pinned, got ${JSON.stringify(pos)}`);
  const box = calloutBox(pos, 192, 700);
  assert(box.top >= 0 && box.bottom <= 700, `callout must stay on screen: ${JSON.stringify(box)}`);
});

test("maxHeight always keeps the callout inside the viewport", () => {
  for (const vh of [658, 667, 700, 720, 732, 764, 900]) {
    for (const rect of [{ top: 40, bottom: 120 }, { top: 300, bottom: 620 }, { top: 20, bottom: vh - 20 }]) {
      const pos = calloutPlacement({ rect, vh });
      const box = calloutBox(pos, 400, vh);   // absurdly tall natural height
      assert(box.top >= -1 && box.bottom <= vh + 1,
        `vh=${vh} rect=${JSON.stringify(rect)} -> ${JSON.stringify(box)}`);
    }
  }
});

// ── 4. calloutPlacement — keepClear ──────────────────────────────

test("keepClear anchors against the whole group, not just the target", () => {
  // Target on top, keep-clear block below it, plenty of room above.
  const pos = calloutPlacement({
    rect: { top: 300, bottom: 400 },
    clearRect: { top: 420, bottom: 500 },
    vh: 900,
  });
  // Below the GROUP (500), not below the target (400).
  assert(pos.top === 500 + GAP, `got ${JSON.stringify(pos)}`);
});

test("keepClear pins to the TOP when nothing fits, never the bottom", () => {
  // This is the invariant that protects the temp/steep sliders: when
  // the callout must overlay something, it overlays the target's upper
  // edge, not the element the step needs the user to keep watching.
  const pos = calloutPlacement({
    rect: { top: 103, bottom: 395 },
    clearRect: { top: 410, bottom: 642 },
    vh: 658,
  });
  assert(pos.top === MARGIN, `expected top-pinned, got ${JSON.stringify(pos)}`);
  assert(pos.bottom === undefined, "must not pin to the bottom — that's where the sliders are");
});

test("the same cramped case WITHOUT keepClear still pins to the bottom", () => {
  // Guards against the keepClear branch quietly becoming the default.
  const pos = calloutPlacement({ rect: { top: 103, bottom: 642 }, vh: 658 });
  assert(pos.bottom === MARGIN, `got ${JSON.stringify(pos)}`);
});

// ── 5. The real device matrix ────────────────────────────────────

// Viewports are Playwright's device presets (playwright.config.ts).
// The element heights are measured from the built app on the Blend
// tour's prediction step, after the Simple/Detailed step has left the
// strips on family rows: graph ~292px, sliders ~232px, 14px apart.
// Desktop Chrome renders slightly larger at its wider width.
const DEVICES = [
  { name: "galaxy-s9",        vh: 658, graphH: 292, slidersH: 232 },
  { name: "iphone-se",        vh: 667, graphH: 292, slidersH: 232 },
  { name: "desktop-chrome",   vh: 720, graphH: 298, slidersH: 250 },
  { name: "pixel-9",          vh: 732, graphH: 292, slidersH: 232 },
  { name: "pixel-fold-cover", vh: 764, graphH: 292, slidersH: 232 },
];
const CALLOUT_H = 192;      // measured natural height of a tour callout
const MIN_BARS_CLEAR = 0.6; // must match e2e/tours.spec.ts

// Reproduce what the component does: park the group flush to the
// bottom, then place the callout against it.
function layoutBlendStep({ vh, graphH, slidersH }) {
  const groupH = graphH + GAP + slidersH;
  const groupTop = vh - MARGIN - groupH;
  const rect = { top: groupTop, bottom: groupTop + graphH };
  const clearRect = { top: groupTop + graphH + GAP, bottom: vh - MARGIN };
  const pos = calloutPlacement({ rect, clearRect, vh });
  return { rect, clearRect, box: calloutBox(pos, CALLOUT_H, vh) };
}

for (const device of DEVICES) {
  test(`${device.name}: bars and sliders both fit on screen`, () => {
    const { rect, clearRect } = layoutBlendStep(device);
    assert(rect.top >= 0, `bars start off the top edge (${rect.top})`);
    assert(clearRect.bottom <= device.vh, `sliders run past the bottom (${clearRect.bottom})`);
  });

  test(`${device.name}: callout never covers the brew sliders`, () => {
    const { clearRect, box } = layoutBlendStep(device);
    const covered = overlapHeight(box, clearRect);
    assert(covered === 0,
      `callout ${JSON.stringify(box)} covers ${covered}px of the sliders ${JSON.stringify(clearRect)}`);
  });

  test(`${device.name}: enough of the bars stay visible to watch them move`, () => {
    const { rect, box } = layoutBlendStep(device);
    const covered = overlapHeight(box, rect);
    const clearFrac = 1 - covered / (rect.bottom - rect.top);
    assert(clearFrac >= MIN_BARS_CLEAR,
      `only ${Math.round(clearFrac * 100)}% of the bars left clear (covered ${Math.round(covered)}px)`);
  });
}

test("the tall phones get a callout that clears the bars entirely", () => {
  // Sanity that the cramped path isn't silently taken everywhere: with
  // 764px there IS room above the group, so nothing should be covered.
  const { rect, box } = layoutBlendStep(DEVICES.find(d => d.name === "pixel-fold-cover"));
  assert(overlapHeight(box, rect) === 0, `expected no overlap, got ${JSON.stringify(box)}`);
});

// ── 6. Blend tour content ────────────────────────────────────────

const blend = SCREEN_TOURS.blend;
const stepIndex = (target) => blend.findIndex(s => s.target === target);

test("every tour step names a target and a title", () => {
  for (const [screen, steps] of Object.entries(SCREEN_TOURS)) {
    steps.forEach((s, i) => {
      assert(typeof s.target === "string" && s.target.length > 0, `${screen}[${i}] has no target`);
      assert(typeof s.title === "string" && s.title.length > 0, `${screen}[${i}] has no title`);
      assert(typeof s.body === "string", `${screen}[${i}] body should be a string`);
    });
  }
});

test("the Simple/Detailed steps run BEFORE the prediction and slider steps", () => {
  // Order is load-bearing, not cosmetic: the user should meet the
  // toggle before the steps whose layout depends on where it's left.
  const lastMode = blend.map(s => s.target).lastIndexOf("blend-mode");
  assert(lastMode !== -1, "blend tour lost its Simple/Detailed steps");
  assert(lastMode < stepIndex("blend-graph"), "toggle steps must precede the prediction step");
  assert(lastMode < stepIndex("blend-sliders"), "toggle steps must precede the slider step");
});

test("the prediction and slider steps each keep the other on screen", () => {
  const graph = blend[stepIndex("blend-graph")];
  const sliders = blend[stepIndex("blend-sliders")];
  assert(graph.keepClear?.includes("blend-sliders"),
    "prediction step must keep the sliders visible — that's the lesson");
  assert(sliders.keepClear?.includes("blend-graph"),
    "slider step must keep the bars visible — that's the lesson");
});

test("every keepClear id is a real step target somewhere", () => {
  const targets = new Set(Object.values(SCREEN_TOURS).flat().map(s => s.target));
  for (const [screen, steps] of Object.entries(SCREEN_TOURS)) {
    for (const s of steps) {
      for (const id of s.keepClear || []) {
        assert(targets.has(id), `${screen}: keepClear "${id}" isn't any step's target — likely a typo`);
      }
    }
  }
});

test("the parts step no longer redirects users to the Herbanium", () => {
  // Removed on purpose: it read as a caveat mid-lesson.
  const parts = blend[stepIndex("blend-quantity")];
  assert(!/Herbanium/i.test(parts.body), `parts step still mentions the Herbanium: ${parts.body}`);
});

// ── 7. The Simple/Detailed walkthrough ───────────────────────────

const modeSteps = blend.filter(s => s.target === "blend-mode");

test("the toggle is walked across two steps, one per mode", () => {
  // Two steps, not one timed flip: the strips change when the user taps
  // Next, so a fast reader can't move past the shift without seeing it.
  assert(modeSteps.length === 2, `expected 2 toggle steps, found ${modeSteps.length}`);
  assert(modeSteps[0].familyMode === true, "should open on Simple");
  assert(modeSteps[1].familyMode === false, "the second step should show Detailed");
});

test("the toggle steps are adjacent", () => {
  const first = blend.indexOf(modeSteps[0]);
  const second = blend.indexOf(modeSteps[1]);
  assert(second === first + 1, `steps are ${second - first} apart — something got inserted between them`);
});

test("the first toggle step tells the reader something will change", () => {
  // The whole reason this is two steps: without the nudge, a quick
  // reader taps Next without knowing the bars were the point.
  assert(/next/i.test(modeSteps[0].body),
    `first toggle step should point at Next: ${modeSteps[0].body}`);
});

test("the copy names the mode its step is showing", () => {
  assert(/^Simple reads/.test(modeSteps[0].body), `simple copy off: ${modeSteps[0].body}`);
  assert(/^Detailed opens/.test(modeSteps[1].body), `detailed copy off: ${modeSteps[1].body}`);
});

test("only the last toggle step signs off with where we're leaving it", () => {
  assert(/leave it on Simple/i.test(modeSteps[1].body), "lost the sign-off");
  assert(!/leave it on Simple/i.test(modeSteps[0].body),
    "the Simple step shouldn't claim we're done — Detailed hasn't been shown yet");
});

test("both toggle steps light up the bars", () => {
  for (const [i, s] of modeSteps.entries()) {
    assert(s.spotlight?.includes("blend-graph"),
      `toggle step ${i} must spotlight the graph — the bars changing IS the lesson`);
  }
});

test("every step after the toggle walkthrough holds the strips on Simple", () => {
  // The prediction and slider steps only fit on a phone with family
  // rows. If either loses familyMode they silently get the user's own
  // preference back, which defaults to Detailed and overflows.
  for (const target of ["blend-graph", "blend-sliders"]) {
    const step = blend[stepIndex(target)];
    assert(step.familyMode === true, `${target} step must pin the strips to Simple`);
  }
});

test("no step outside the Blend tour carries familyMode", () => {
  // It only means anything to the extraction explorer; elsewhere it
  // would be a quiet no-op that reads as intent.
  for (const [screen, steps] of Object.entries(SCREEN_TOURS)) {
    if (screen === "blend") continue;
    for (const s of steps) {
      assert(s.familyMode === undefined, `${screen} step "${s.target}" sets familyMode`);
    }
  }
});

// ── Report ───────────────────────────────────────────────────────

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}

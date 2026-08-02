// e2e/tours.spec.ts — walk every guided tour end to end and assert the
// callout stays fully on-screen at each step.
//
// This is the regression net for the bug where the callout anchored
// below a tall target (the Blend graph with several ingredients' bars)
// and fell off the bottom of a fixed, scroll-blocking overlay — i.e.
// unreachable. The load-bearing assertion is `expectWithinViewport`:
// if the callout's box ever pokes past a viewport edge, the step fails.
//
// Setup uses ?dev (loads the populated "power" seed so every tour's
// targets exist — recipes rows, recent brews, etc.) plus a seeded
// toursSeen map so each test fires exactly ONE tour in isolation.
import { test, expect, type Page, type Locator } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const ALL_SCREENS = ["home", "blend", "herbanium", "recipes", "reflections", "fieldnotes"];

// Fire exactly one tour in isolation: mark every screen seen except
// `target`, enable tours, and set a valid schema key so the app doesn't
// wipe storage on load. addInitScript serializes its function into the
// browser, so the values are passed as an argument (no outer closure).
async function armTour(page: Page, target: string) {
  // Emulate prefers-reduced-motion so the app skips the tour fade-in and
  // the steep-slider demo loop — faster walks, and no animation-timing
  // flake (we're testing layout, not racing animations).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    ([seenList, tgt, schema]) => {
      localStorage.setItem("herbanium.schemaVersion", schema as string);
      localStorage.setItem("herbanium.toursEnabled", "true");
      const seen: Record<string, boolean> = {};
      for (const s of seenList as string[]) if (s !== tgt) seen[s] = true;
      localStorage.setItem("herbanium.toursSeen", JSON.stringify(seen));
    },
    [ALL_SCREENS, target, CURRENT_SCHEMA] as const,
  );
  await page.goto("/?dev");
}

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

// Assert two boxes don't overlap (±1px rounding), so the callout can't
// be sitting on top of the thing the step is talking about.
async function expectNoOverlap(a: Locator, b: Locator, labelA: string, labelB: string) {
  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();
  expect(boxA, `${labelA}: should have a box`).not.toBeNull();
  expect(boxB, `${labelB}: should have a box`).not.toBeNull();
  const t = 1;
  const disjoint =
    boxA!.x + boxA!.width  <= boxB!.x + t ||
    boxB!.x + boxB!.width  <= boxA!.x + t ||
    boxA!.y + boxA!.height <= boxB!.y + t ||
    boxB!.y + boxB!.height <= boxA!.y + t;
  expect(
    disjoint,
    `${labelA} ${JSON.stringify(boxA)} overlaps ${labelB} ${JSON.stringify(boxB)}`,
  ).toBe(true);
}

// Assert a locator's box sits fully inside the viewport (±1px rounding).
async function expectWithinViewport(page: Page, locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label}: should have a box`).not.toBeNull();
  const vp = page.viewportSize();
  expect(vp, "viewport size should be set").not.toBeNull();
  const t = 1;
  expect(box!.y, `${label}: top off the top edge`).toBeGreaterThanOrEqual(-t);
  expect(box!.x, `${label}: left off the left edge`).toBeGreaterThanOrEqual(-t);
  expect(box!.y + box!.height, `${label}: bottom past the viewport (h=${box!.height}, vh=${vp!.height})`).toBeLessThanOrEqual(vp!.height + t);
  expect(box!.x + box!.width, `${label}: right past the viewport`).toBeLessThanOrEqual(vp!.width + t);
}

// Step through the whole active tour, asserting on-screen at each step.
async function walkTour(page: Page, tourName: string) {
  const callout = page.getByTestId("tour-callout");
  const progress = page.getByTestId("tour-progress");
  await expect(callout, `${tourName}: tour should start`).toBeVisible();

  const first = (await progress.innerText()).trim(); // e.g. "1 / 5"
  const total = parseInt(first.split("/")[1].trim(), 10);
  expect(total, `${tourName}: parsed a step count`).toBeGreaterThan(0);

  for (let i = 1; i <= total; i++) {
    // Wait until the step counter reads step i, so we never measure the
    // callout mid-transition between steps.
    await expect(progress).toHaveText(new RegExp(`^\\s*${i}\\s*/\\s*${total}\\s*$`));
    await expectWithinViewport(page, callout, `${tourName} step ${i}/${total}`);

    if (i < total) {
      await callout.getByRole("button", { name: "Next", exact: true }).click();
    } else {
      await callout.getByRole("button", { name: "Done", exact: true }).click();
    }
  }

  await expect(callout, `${tourName}: tour should close after Done`).toBeHidden();
}

test.describe("guided tours stay on-screen, end to end", () => {
  test("Home tour", async ({ page }) => {
    await armTour(page, "home");
    // Home is the default tab — its tour fires on load.
    await walkTour(page, "home");
  });

  test("Blend tour (the tall-graph regression)", async ({ page }) => {
    await armTour(page, "blend");
    await openTab(page, "Apothecarium"); // reverse/Blend is the default sub-mode
    await walkTour(page, "blend");
  });

  test("Herbanium tour", async ({ page }) => {
    await armTour(page, "herbanium");
    await openTab(page, "Apothecarium");
    await openSubTab(page, "Herbanium");
    await walkTour(page, "herbanium");
  });

  test("Recipes tour", async ({ page }) => {
    await armTour(page, "recipes");
    await openTab(page, "Journal"); // Recipes is the default sub-mode
    await walkTour(page, "recipes");
  });

  test("Reflections tour", async ({ page }) => {
    await armTour(page, "reflections");
    await openTab(page, "Journal");
    await openSubTab(page, "Reflections");
    await walkTour(page, "reflections");
  });

  test("Field Notes tour", async ({ page }) => {
    await armTour(page, "fieldnotes");
    await openTab(page, "Journal");
    await openSubTab(page, "Field Notes");
    await walkTour(page, "fieldnotes");
  });
});

/* ──────────────────────────────────────────────────────────────
   The teaching moment the Blend tour is built around: on BOTH the
   "prediction" step and the "dial in the brew" step, the user has to
   be able to see the prediction bars AND the temp/steep sliders at
   the same time — that's how they learn the sliders drive the bars.
   The callout mustn't cover either one, and neither may be off-screen.

   This is what caps the tour's seeded example blend at two
   ingredients (see ReverseCompose): a third ingredient's bars make
   the graph tall enough that something gets pushed off or covered.
   ────────────────────────────────────────────────────────────── */
test.describe("Blend tour — bars and sliders visible together", () => {
  // Click Next until the callout shows `title`, so the walk is keyed to
  // the step's content rather than a step index that shifts if the tour
  // gains or loses a step.
  async function advanceTo(page: Page, title: string) {
    const callout = page.getByTestId("tour-callout");
    await expect(callout, "blend tour should start").toBeVisible();
    for (let guard = 0; guard < 12; guard++) {
      if ((await callout.innerText()).includes(title)) return;
      await callout.getByRole("button", { name: "Next", exact: true }).click();
    }
    throw new Error(`Blend tour never reached the "${title}" step`);
  }

  // What the layout can actually promise on every device in the matrix,
  // and why it isn't "both fully visible, callout touching neither":
  //
  // The app scrolls an inner pane between a header and the tab dock, so
  // the space available is the PANE, not the window — on Galaxy S9+
  // that's 493px against a 658px window. The bars (~292) plus the
  // sliders (~232) plus the gap is ~538, which simply doesn't fit 493.
  // So the smallest phones clip something no matter what.
  //
  // The guarantees that DO hold everywhere: the sliders stay essentially
  // whole and never sit under the callout (they're the control the step
  // is teaching), and enough of the bars stay both unclipped and
  // uncovered to watch them move.
  // What this step can actually promise, measured across all three
  // engines rather than inferred from Chromium:
  //
  //   roomy pane (>= group height):  bars 62–100% clear, sliders 100%
  //   cramped pane (487–502px):      bars 32–70% clear, sliders 96–100%
  //
  // The group is ~540px; a phone pane is ~490px. On those devices the
  // layout cannot show both whole, and how much of the BARS survives
  // depends on how tall the engine renders the callout — WebKit's is
  // ~35% taller than Chromium's for identical copy. So the bars only
  // carry a hard floor where the pane can hold them; on cramped panes
  // the percentage is logged and guarded against collapse, not pinned
  // to a number that means "whichever engine I happened to measure".
  //
  // The sliders promise is the real one and holds everywhere: never
  // under the callout, never meaningfully clipped. That's the control
  // the step is teaching.
  const MIN_BARS_CLEAR = 0.6;
  const MIN_BARS_NOT_COLLAPSED = 0.25;
  const MIN_SLIDERS_CLEAR = 0.9;

  // Fraction of an element inside its scroll pane AND not under the
  // callout. Measured in one page evaluation so the boxes can't be read
  // at different moments.
  const measure = (page: Page) => page.evaluate(() => {
    const read = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement;
      const box = el.getBoundingClientRect();
      let pane: { top: number; bottom: number } = { top: 0, bottom: window.innerHeight };
      for (let n = el.parentElement; n; n = n.parentElement) {
        const oy = getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) {
          pane = n.getBoundingClientRect();
          break;
        }
      }
      const visTop = Math.max(box.top, pane.top);
      const visBottom = Math.min(box.bottom, pane.bottom);
      const visible = Math.max(0, visBottom - visTop);
      const c = document.querySelector('[data-testid="tour-callout"]')!.getBoundingClientRect();
      const covered = Math.max(0, Math.min(visBottom, c.bottom) - Math.max(visTop, c.top));
      return {
        fraction: box.height > 0 ? (visible - covered) / box.height : 0,
        paneHeight: Math.round(pane.bottom - pane.top),
        height: Math.round(box.height),
        covered: Math.round(covered),
      };
    };
    return { bars: read('[data-tour="blend-graph"]'), sliders: read('[data-tour="blend-sliders"]') };
  });

  async function expectBothClear(page: Page, stepLabel: string) {
    // Poll rather than read once. GuidedTour positions, waits a frame
    // for the layout to settle, then positions again — so a single read
    // taken the moment the step's text appears can catch the callout
    // against stale geometry. That produced both a spurious "callout is
    // sitting on the sliders" and a 15-point spread in the bars number
    // across retries of the same device.
    let last = await measure(page);
    await expect.poll(async () => {
      last = await measure(page);
      const cramped = last.bars.paneHeight < last.bars.height + 14 + last.sliders.height;
      const barsFloor = cramped ? MIN_BARS_NOT_COLLAPSED : MIN_BARS_CLEAR;
      return last.sliders.covered === 0
        && last.sliders.fraction >= MIN_SLIDERS_CLEAR
        && last.bars.fraction >= barsFloor;
    }, {
      message: `${stepLabel}: layout should settle with the sliders clear`,
      timeout: 8_000,
    }).toBe(true);

    const cramped = last.bars.paneHeight < last.bars.height + 14 + last.sliders.height;
    // eslint-disable-next-line no-console
    console.log(`  [${test.info().project.name}] ${stepLabel}: pane ${last.bars.paneHeight}px, `
      + `bars ${Math.round(last.bars.fraction * 100)}% clear, `
      + `sliders ${Math.round(last.sliders.fraction * 100)}%`
      + `${cramped ? " (cramped pane — bars logged, not pinned)" : ""}`);
  }

  test("the Simple/Detailed steps walk the toggle and change the bars", async ({ page }) => {
    await armTour(page, "blend");
    await openTab(page, "Apothecarium");
    const callout = page.getByTestId("tour-callout");
    const graph = page.locator('[data-tour="blend-graph"]');

    await advanceTo(page, "Simple reads the blend by family");
    const simpleH = (await graph.boundingBox())!.height;

    // The step has to tell the reader something is about to change,
    // otherwise a quick reader taps past the demonstration.
    await expect(callout).toContainText(/tap next/i);

    // The spotlight has to include the bars, not just the toggle —
    // otherwise the change happens in the dimmed region and the user's
    // eye never goes there.
    //
    // Polled, because the cutout eases to its new position over 250ms
    // (see the transition on the spotlight in GuidedTour). Reading it
    // once catches it mid-move and fails for a reason that has nothing
    // to do with what's being tested.
    await expect.poll(async () => {
      const spot = await page.getByTestId("tour-spotlight").boundingBox();
      const bars = await graph.boundingBox();
      if (!spot || !bars) return null;
      return {
        coversTop: spot.y <= bars.y + 1,
        coversBottom: spot.y + spot.height >= bars.y + bars.height - 1,
      };
    }, {
      message: "spotlight should settle over the whole bars block",
    }).toEqual({ coversTop: true, coversBottom: true });

    // The toggle itself pulses in terra while these steps are up. The
    // spotlight lights the whole strip block, which is right — what the
    // toggle DOES is the lesson — but that leaves the control as one
    // more thing inside a large bright area, so it gets a second,
    // smaller signal of its own.
    const toggle = page.locator('[data-tour="blend-mode"]');
    await expect(toggle).toHaveCSS("animation-name", "tourTogglePulse");
    await expect(toggle).toHaveCSS("border-color", /rgb\(176, ?84, ?47\)/);

    await callout.getByRole("button", { name: "Next", exact: true }).click();
    await expect(callout).toContainText("Detailed opens every family");
    await expect(toggle, "the pulse should hold across both toggle steps")
      .toHaveCSS("animation-name", "tourTogglePulse");
    await expect(callout).toContainText("We'll leave it on Simple");
    const detailedH = (await graph.boundingBox())!.height;
    expect(detailedH, `Detailed should grow the graph (simple=${simpleH}, detailed=${detailedH})`)
      .toBeGreaterThan(simpleH + 40);

    // And advancing out of the walkthrough returns to the short layout
    // the prediction/slider steps depend on.
    await callout.getByRole("button", { name: "Next", exact: true }).click();
    await expect(callout).toContainText("The prediction");
    await expect(toggle, "and stop once the tour moves past them")
      .not.toHaveCSS("animation-name", "tourTogglePulse");
    // Tolerance in pixels, not toBeCloseTo. WebKit re-lays this SVG out
    // with sub-pixel differences between renders of identical content —
    // CI saw 309.375 against 310.375 — and toBeCloseTo(x, 0) demands
    // agreement within half a pixel. The claim is "back to the short
    // Simple layout", not "identical to the float".
    const settledH = (await graph.boundingBox())!.height;
    expect(Math.abs(settledH - simpleH),
      `should settle back to Simple's height (${settledH} vs ${simpleH})`).toBeLessThan(4);
  });

  test("both the prediction bars and the brew sliders stay clear", async ({ page }) => {
    await armTour(page, "blend");
    await openTab(page, "Apothecarium");

    await advanceTo(page, "The prediction");
    await expectBothClear(page, "prediction step");

    await advanceTo(page, "Dial in the brew");
    await expectBothClear(page, "slider step");
  });
});

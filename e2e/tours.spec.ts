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
    ([seenList, tgt]) => {
      localStorage.setItem("herbanium.schemaVersion", "6");
      localStorage.setItem("herbanium.toursEnabled", "true");
      const seen: Record<string, boolean> = {};
      for (const s of seenList as string[]) if (s !== tgt) seen[s] = true;
      localStorage.setItem("herbanium.toursSeen", JSON.stringify(seen));
    },
    [ALL_SCREENS, target] as const,
  );
  await page.goto("/?dev");
}

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

// Assert a locator's box sits fully inside the viewport (±1px rounding).
async function expectWithinViewport(page: Page, locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label}: callout should have a box`).not.toBeNull();
  const vp = page.viewportSize();
  expect(vp, "viewport size should be set").not.toBeNull();
  const t = 1;
  expect(box!.y, `${label}: callout top off the top edge`).toBeGreaterThanOrEqual(-t);
  expect(box!.x, `${label}: callout left off the left edge`).toBeGreaterThanOrEqual(-t);
  expect(box!.y + box!.height, `${label}: callout bottom past the viewport`).toBeLessThanOrEqual(vp!.height + t);
  expect(box!.x + box!.width, `${label}: callout right past the viewport`).toBeLessThanOrEqual(vp!.width + t);
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

// e2e/dock-height-after-onboarding.spec.ts — the app shell must know how
// tall its own dock is, however it got there.
//
// `--app-dock-h` is what keeps the bottom of every page reachable: the
// scroll pane runs UNDER the dock (that's what makes the dock read as
// glass) and pads itself by exactly the dock's height so the last thing
// on the page can still be scrolled clear of it.
//
// It is measured once, from a ref, in a mount-only effect. Onboarding
// takes an early return that renders no TabBar at all — so on a first
// visit the effect ran, found no node, and never ran again. Every screen
// then lost its last 73-152px for the whole session, with nothing left
// to scroll, and a reload "fixed" it because by then a profile existed
// on the first render.
//
// Asserted on the published variable rather than on any one screen's
// last element: the variable IS the contract, and a screen-specific
// assertion would pass the moment that screen's copy changed length.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const dockVar = (page: Page) => page.evaluate(() => {
  const root = Array.from(document.querySelectorAll("div"))
    .find(d => d.style && d.style.getPropertyValue("--app-dock-h")) as HTMLElement | undefined;
  if (!root) return { published: null, measured: null };
  const dock = document.getElementById("brew-dock")?.parentElement;
  return {
    published: getComputedStyle(root).getPropertyValue("--app-dock-h").trim(),
    measured: dock ? Math.round(dock.getBoundingClientRect().height) : null,
  };
});

test("the dock's height is published after onboarding, not only after a reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // No ?dev and no seeded profile: the real first-run path, which is the
  // one that takes the early return.
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/");

  // Walk the four steps.
  await page.getByRole("button", { name: /next →/ }).click();          // welcome
  await page.getByRole("textbox").first().fill("Tom");
  await page.getByRole("button", { name: /next →/ }).click();          // name
  await page.getByRole("button", { name: /calm/i }).first().click();   // a draw
  await page.getByRole("button", { name: /next →/ }).click();
  await page.getByRole("button", { name: /begin →/ }).click();         // flavors, optional

  await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600);

  const { published, measured } = await dockVar(page);
  expect(measured, "the dock should have a real height").toBeGreaterThan(40);
  expect(
    published,
    "the pane pads by this; 0px strands the foot of every page under the dock",
  ).toBe(`${measured}px`);
});

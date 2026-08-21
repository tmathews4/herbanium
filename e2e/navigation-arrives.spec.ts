// e2e/navigation-arrives.spec.ts — going somewhere means arriving there.
//
// REPORTED: tapping the elemental banner navigated to the lodestone and
// left the user looking at the check-in screen. The navigation worked;
// the destination mounted; an overlay sat on top of it.
//
// That is the failure this file exists for, and it is invisible to the
// usual assertion. `toBeAttached` passes — the page IS in the DOM.
// `toHaveCount(1)` passes. Even `toBeVisible` on the destination can
// pass, because an element covered by a full-screen absolute layer is
// still "visible" to CSS: it has a box, it isn't display:none, nothing
// about it is hidden.
//
// So the check has to be about what the USER can reach: the destination
// must be the topmost thing at its own center point. document
// .elementFromPoint answers exactly that question and nothing else does.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.slow();

async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
}

/**
 * Is this element the thing under the finger, or is something over it?
 *
 * Returns the tag/testid of whatever is actually on top at the target's
 * center, so a failure names the culprit instead of just saying "no".
 */
async function whatIsOnTopOf(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { reached: false, why: "the destination never mounted" };
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { reached: false, why: "it has no box" };
    const x = Math.round(r.left + r.width / 2);
    const y = Math.round(r.top + Math.min(r.height / 2, 120));
    const top = document.elementFromPoint(x, y);
    if (!top) return { reached: false, why: "nothing at its center point" };
    if (el.contains(top) || top.contains(el)) return { reached: true, why: "" };
    // Name the blocker as helpfully as we can.
    let node: Element | null = top;
    let label = top.tagName.toLowerCase();
    while (node) {
      const id = node.getAttribute?.("data-testid") || node.getAttribute?.("data-tour");
      if (id) { label = id; break; }
      node = node.parentElement;
    }
    return { reached: false, why: `covered by "${label}"` };
  }, selector);
}

const TABS = [
  { name: "Home", marker: '[data-tour="home-brew"], main, body' },
  { name: "Apothecary", marker: '[data-tour="blend-search"]' },
  { name: "Journal", marker: '[data-tour="recipes-row"]' },
  { name: "Profile", marker: 'text=lodestone charge' },
];

test.describe("a tab you tap is a tab you can see", () => {
  test("every tab arrives on top, with nothing left covering it", async ({ page }) => {
    await boot(page);
    for (const { name } of TABS) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.waitForTimeout(400);
      const state = await whatIsOnTopOf(page, '[data-tour="subtabs"], #root');
      expect(state.reached, `${name}: ${state.why}`).toBe(true);
    }
  });

  test("a tab tapped from inside an overlay leaves the overlay behind", async ({ page }) => {
    /* THE REPORTED BUG, generalised. Detail screens are absolute layers
       above the tab content, so a navigation that doesn't dismiss them
       changes the page underneath and shows you the same overlay.

       The tab bar knew to clear them; the elemental banner called
       navigateTab directly and didn't. The rule lives in navigateTab
       now, so this holds for any caller — including ones not written
       yet, which is the point. */
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await expect(page.getByTestId("blend-detail")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("blend-detail"),
      "the recipe overlay should not follow you to another tab").toHaveCount(0);
  });

  test("the minimized brew is the one thing allowed to follow you", async ({ page }) => {
    // The deliberate exception, asserted so the fix above can't be
    // "over-corrected" into dropping the timer when someone navigates.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    const quick = page.locator('[data-testid^="quick-brew-"]').first();
    await expect(quick).toBeVisible({ timeout: 30_000 });
    await quick.click();

    const banner = page.getByRole("button", { name: /return to your steeping brew/i });
    await expect(banner, "a quick brew minimizes into the banner")
      .toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.waitForTimeout(400);
    await expect(banner, "and the banner follows you across tabs").toBeVisible();
  });
});

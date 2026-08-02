// e2e/brew-minimized.spec.ts — the app stays usable while a brew runs.
//
// Minimizing a steep is the one state where a modal overlay is
// deliberately still "open" underneath the whole app: `overlay` stays
// "steep" and only the visual collapses to a banner. That makes it the
// state most likely to break navigation — an overlay that swallows
// clicks, or a tab switch that quietly discards the running timer.
//
// So: start a real brew, minimize it, then walk every tab and sub-tab
// checking both that the screen works AND that the brew survived.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const banner = (page: Page) => page.getByTestId("brew-banner");

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

test.describe("a minimized brew survives the whole app", () => {
  test.beforeEach(async ({ page }) => {
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

    // Start a real brew from a saved recipe rather than faking the
    // state — the point is that the actual flow leaves the app usable.
    await openTab(page, "Journal");
    await page.locator('[data-tour="recipes-row"]').first().click();
    await page.getByRole("button", { name: /Brew this cup/i }).click();

    const minimize = page.getByRole("button", { name: /minimize/i });
    await expect(minimize, "the steep screen should be up").toBeVisible();
    await minimize.click();
    await expect(banner(page), "minimizing should leave a banner").toBeVisible();
  });

  test("every tab works with a brew running, and the brew survives", async ({ page }) => {
    // Landmark per destination: something that only exists when that
    // screen has actually rendered, so a silently blank tab fails.
    const stops: Array<[string, string | null, string]> = [
      ["Home",         null,           '[data-tour="home-experiment"]'],
      ["Apothecarium", null,           '[data-tour="blend-search"]'],
      ["Apothecarium", "Herbanium",    '[data-tour="herb-search"]'],
      ["Journal",      "Recipes",      '[data-tour="recipes-filter"]'],
      ["Journal",      "Reflections",  '[data-tour="reflections-log"]'],
      ["Journal",      "Field Notes",  '[data-tour="fieldnotes-lodestone"]'],
    ];

    for (const [tab, subTab, landmark] of stops) {
      const where = subTab ? `${tab} › ${subTab}` : tab;
      await openTab(page, tab);
      if (subTab) await openSubTab(page, subTab);
      await expect(page.locator(landmark), `${where} should render`).toBeVisible();
      await expect(banner(page), `${where} should not drop the running brew`).toBeVisible();
    }

    // Profile has no data-tour anchor; its replay control is stable.
    await openTab(page, "Profile");
    await expect(page.getByRole("button", { name: /replay tour/i })).toBeVisible();
    await expect(banner(page), "Profile should not drop the running brew").toBeVisible();
  });

  test("the banner takes you back to the steep, and the timer kept running",
    async ({ page }) => {
      const before = (await banner(page).innerText()).trim();

      await openTab(page, "Apothecarium");
      await openTab(page, "Home");
      await expect(banner(page)).toBeVisible();

      // The countdown has to still be counting — a banner that survives
      // navigation but freezes is arguably worse than losing the brew,
      // because it lies about the tea.
      await expect.poll(async () => (await banner(page).innerText()).trim(), {
        message: "the countdown should still be moving after navigating",
        timeout: 8_000,
      }).not.toBe(before);

      await banner(page).click();
      await expect(
        page.getByRole("button", { name: /minimize/i }),
        "tapping the banner should restore the steep screen",
      ).toBeVisible();
      await expect(banner(page), "the banner should go once the steep is back").toBeHidden();
    });

  test("a minimized brew doesn't block interaction underneath it", async ({ page }) => {
    // The steep overlay is technically still open while minimized. If
    // it were still capturing pointer events, everything below would be
    // dead — so exercise a real control, not just visibility.
    await openTab(page, "Apothecarium");
    await openSubTab(page, "Herbanium");
    const search = page.locator('[data-tour="herb-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await expect(search).toHaveValue("chamomile");
    await expect(banner(page)).toBeVisible();
  });
});

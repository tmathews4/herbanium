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
import { brewFromDetail } from "./helpers/brew";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const banner = (page: Page) => page.getByTestId("brew-banner");

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

/* The setup here brews before its first assertion, and carries
   test.slow() for it — but not for the reason it once claimed. The old
   note blamed a loaded machine; the truth was a notice card covering
   the steep's minimize button, which is fixed and has a test of its own
   below.

   The allowance stays because removing it failed twice in two full
   runs. helpers/brew.ts waits up to 30s for the explorer to mount,
   which IS the config budget, so one helper call can consume a whole
   test. A hook that brews needs more than the default regardless of
   load. */
test.describe("a minimized brew survives the whole app", () => {
  test.slow();
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
    await brewFromDetail(page);

    const minimize = page.getByRole("button", { name: /minimize/i });
    await expect(minimize, "the steep screen should be up").toBeVisible();
    await minimize.click();
    await expect(banner(page), "minimizing should leave a banner").toBeVisible();
  });

  test("a notice never lands on the steep's own controls", async ({ page }) => {
    /* THE BUG THIS FILE KEPT HITTING WITHOUT NAMING.

       Both top-of-screen notices are position:fixed at top:12px. The
       steep header's minimize sits at y=35 and is fifteen pixels tall,
       so a notice card lands on it rather than beside it. And the brew
       CAUSES one: brewing earns lodestone charge, so a cup that tips
       the stone full raises the charged banner over the timer it just
       started. Tap minimize, nothing happens.

       Drives the collision deliberately — fill the stone, then brew —
       rather than waiting for the seed to drift across the threshold,
       which is what made it an intermittent hang instead of a bug
       report. Asserts reachability, not absence: what matters is that
       the control can be tapped, however the notices are laid out. */
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByRole("button", { name: "full", exact: true }).click();
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await brewFromDetail(page);

    const minimize = page.getByRole("button", { name: /minimize/i });
    await expect(minimize).toBeVisible();

    const blocker = await page.evaluate(() => {
      const el = [...document.querySelectorAll("button")]
        .find(b => /minimize/i.test(b.textContent || b.getAttribute("aria-label") || ""));
      if (!el) return "no minimize button";
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(
        Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      if (!top) return "nothing at its centre";
      return (el.contains(top) || top === el) ? null : (top.textContent || top.tagName).slice(0, 60);
    });
    expect(blocker, `minimize was covered by "${blocker}"`).toBeNull();

    // And it actually works, which is the whole point.
    await minimize.click({ timeout: 15_000 });
    await expect(page.getByTestId("brew-banner")).toBeVisible();
  });

  test("every tab works with a brew running, and the brew survives", async ({ page }) => {
    // Landmark per destination: something that only exists when that
    // screen has actually rendered, so a silently blank tab fails.
    const stops: Array<[string, string | null, string]> = [
      ["Home",         null,           '[data-tour="home-experiment"]'],
      ["Apothecary", null,           '[data-tour="blend-search"]'],
      ["Apothecary", "Herbanium",    '[data-tour="herb-search"]'],
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

      await openTab(page, "Apothecary");
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
    await openTab(page, "Apothecary");
    await openSubTab(page, "Herbanium");
    const search = page.locator('[data-tour="herb-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await expect(search).toHaveValue("chamomile");
    await expect(banner(page)).toBeVisible();
  });
});

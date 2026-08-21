// e2e/steep-survives-nav.spec.ts — leaving a brew minimizes it.
//
// Reported from real use: start a brew, tap a tab in the bottom nav,
// and the cup is gone. Not paused — gone, with no way back to it.
//
// The navigation helper kept a steep only when it was ALREADY
// minimized, and cleared the overlay otherwise. So the one case where
// the steep is unambiguously the thing you care about — the brew you
// are watching — was the one a tab tap threw away. The session survived
// in memory with nothing rendering it: the full screen went with the
// overlay, and the banner never appeared because the minimized flag was
// still false.
//
// The route already existed. An already-minimized steep survives a tab
// tap by taking an early return that leaves the overlay set while the
// banner stands in for the screen. This puts an un-minimized one on the
// same path.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot, brewFromDetail } from "./helpers/brew";

test.beforeEach(() => test.slow());

async function startABrew(page: Page) {
  await boot(page);
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="recipes-row"]').first().click();
  await brewFromDetail(page);
  await expect(page.getByRole("button", { name: /done early|log this cup/i }).first(),
    "a steep should be running").toBeVisible({ timeout: 30_000 });
}

test.describe("a running steep", () => {
  test("survives a tab tap as the minimized banner", async ({ page }) => {
    await startABrew(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();

    /* The banner IS the claim. "The session still exists" would pass
       against the bug — it always did; what was missing was anything on
       screen pointing at it. */
    const banner = page.getByTestId("brew-banner");
    await expect(banner, "the brew should hand itself to the banner, not vanish")
      .toBeVisible({ timeout: 15_000 });
  });

  test("can be reopened from the banner after navigating away", async ({ page }) => {
    // Minimizing is only a rescue if it leads back. Without this the
    // banner could be decoration over a cup nobody can reach.
    await startABrew(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await page.getByTestId("brew-banner").click();
    await expect(page.getByRole("button", { name: /done early|log this cup/i }).first(),
      "tapping the banner should return to the steep").toBeVisible({ timeout: 15_000 });
  });
});

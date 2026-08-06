// e2e/helpers/brew.ts — how a test starts a cup.
//
// Not a .spec file, so Playwright doesn't collect it.
//
// This exists because eleven call sites across four spec files each
// knew how to brew, and all eleven knew it the same way: click the
// recipe page's full-width "Brew this cup" CTA. When that CTA became a
// duplicate of the brew panel's own corner Brew and was hidden, twenty
// tests went down at once — not because the app broke, but because the
// knowledge was copied eleven times instead of named once.
//
// The same shape this session kept finding: behaviour defined at the
// call site rather than in the thing being called. Naming it here means
// the next change to how brewing starts is one edit.
import { expect, type Page } from "@playwright/test";

/**
 * Start a brew from an open recipe/blend detail screen.
 *
 * Goes through the brew panel's corner Brew — the control every brew
 * window carries — and answers the confirmation, which every corner
 * Brew now asks. Leaves the app on whatever the brew opens (the steep
 * screen, unless something minimised it).
 *
 * Assumes a detail screen is already open; navigating there is the
 * caller's business, since they differ on how they got there.
 */
export async function brewFromDetail(page: Page) {
  const row = page.locator('[data-tour="blend-controls"]').first();
  await expect(row, "the detail screen should have a brew panel").toBeVisible({ timeout: 15_000 });
  // The panel folds; the corner only exists while it's open.
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();

  await page.locator('[data-tour="blend-brew"]').first().click();

  // Brewing asks first — a saved recipe already has a name, so this
  // prompt carries no name field, just the confirmation.
  const go = page.getByTestId("brew-confirm-go");
  await expect(go, "the corner Brew should ask before starting a timer").toBeVisible();
  await go.click();
}

/** The control a detail screen offers for brewing, for visibility assertions. */
export const detailBrewControl = (page: Page) => page.locator('[data-tour="blend-brew"]').first();

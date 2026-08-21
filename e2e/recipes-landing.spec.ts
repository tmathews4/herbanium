// e2e/recipes-landing.spec.ts — what the Recipes shelf opens on.
//
// It used to open on Favorites, on the reasoning that a brew-now visit
// most often wants a cup you already trust. That is the wrong bet for a
// shelf: Recipes is where browsing happens, and landing on the narrowest
// slice hides the catalogue behind a chip the user has to know to press
// — completely, for anyone who has starred nothing.
//
// tests/catalog-filter.test.mjs holds the declaration side (the default
// names a real bucket, and nothing writes its own copy). This holds the
// half only a browser can answer: the shelf you actually land on is the
// wide one.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

async function openRecipes(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.profile", JSON.stringify({ name: "Test Brewer", onboarded: true }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Recipes", exact: true }).click();
  await expect(page.locator('[data-tour="recipes-filter"]')).toBeVisible({ timeout: 15_000 });
}

test.describe("the recipes shelf", () => {
  test("opens on the whole catalogue, not on favorites", async ({ page }) => {
    await openRecipes(page);

    const rows = page.locator('[data-testid="blend-row"]');
    await expect(rows.first(), "the shelf should land with recipes on it")
      .toBeVisible({ timeout: 15_000 });
    const landed = await rows.count();

    /* THE CLAIM IS COMPARATIVE, so it is measured comparatively rather
       than against a number typed in here. Whatever the catalogue holds
       and whatever this profile has starred, the list you land on must
       be wider than the favorites slice — which is exactly what fails
       if the default goes back. */
    await page.locator('[data-tour="recipes-filter"]')
      .getByRole("button", { name: "Favorites", exact: true }).click();
    const favorites = await rows.count();

    expect(landed, `landed on ${landed} rows, favorites holds ${favorites}`)
      .toBeGreaterThan(favorites);
  });

  test("leaving and coming back lands on it again", async ({ page }) => {
    /* Entering Recipes RESETS the filter — a second, separate write of
       the same decision, and the one a change to the initial state
       alone would miss. Narrow the shelf by hand, walk away, come
       back: it should be wide again. */
    await openRecipes(page);
    const strip = page.locator('[data-tour="recipes-filter"]');
    await strip.getByRole("button", { name: "Favorites", exact: true }).click();

    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Reflections", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Recipes", exact: true }).click();

    const rows = page.locator('[data-testid="blend-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    const back = await rows.count();

    await strip.getByRole("button", { name: "Favorites", exact: true }).click();
    expect(back, "coming back should reset the shelf to the wide default")
      .toBeGreaterThan(await rows.count());
  });
});

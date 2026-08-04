// e2e/navigation.spec.ts — "does every surface still render" regression.
//
// Cheap, high-value safety net: click into each main tab and each
// sub-tab and assert a stable element renders. Catches a broken import,
// a render crash, or a blank screen on ANY surface — the kind of
// regression a unit test can't see.
//
// We assert on the app's own data-tour="..." anchors (added for the
// guided tour) as locators — they're stable, semantic hooks that only
// change when we intend them to, exactly like a data-testid.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

// A ready-to-use account seeded straight into localStorage so the app
// skips onboarding and lands in the tabbed UI. Two gotchas encoded here:
//  - herbanium.schemaVersion MUST equal the app's CURRENT_SCHEMA, or the
//    app wipes every herbanium.* key on load and we'd bounce to onboarding.
//  - toursEnabled:false stops the "quick tour?" offer card and the
//    spotlight overlay from covering the tab bar and eating our clicks.
const seedAccount = (schema: string) => {
  localStorage.setItem("herbanium.schemaVersion", schema);
  localStorage.setItem("herbanium.toursEnabled", "false");
  localStorage.setItem(
    "herbanium.profile",
    JSON.stringify({
      name: "Test Brewer",
      title: "The Test Brewer",
      timeOfDay: ["morning", "afternoon", "evening"],
      draw: ["calm", "focus", "energy", "comfort"],
      flavors: ["floral", "herbal"],
      createdAt: 1700000000000,
      synthsVersion: "3",
    }),
  );
};

// Click a main tab by its accessible name (the bottom dock buttons).
const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();

// Click a sub-tab — scoped to the sub-tab strip so a label can't
// collide with a same-named control elsewhere on the screen.
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

test.describe("tab + sub-tab render regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(seedAccount, CURRENT_SCHEMA);
    await page.goto("/");
  });

  test("Home", async ({ page }) => {
    // Home is the default tab — its CTA grid should be present.
    await expect(page.locator('[data-tour="home-experiment"]')).toBeVisible();
  });

  test("Apothecary · Blend", async ({ page }) => {
    await openTab(page, "Apothecary");
    await expect(page.locator('[data-tour="subtabs"]')).toBeVisible();
    await expect(page.locator('[data-tour="blend-search"]')).toBeVisible();
  });

  test("Apothecary · Herbanium", async ({ page }) => {
    await openTab(page, "Apothecary");
    await openSubTab(page, "Herbanium");
    await expect(page.locator('[data-tour="herb-search"]')).toBeVisible();
  });

  test("Journal · Recipes", async ({ page }) => {
    await openTab(page, "Journal");
    await expect(page.locator('[data-tour="subtabs"]')).toBeVisible();
    await expect(page.locator('[data-tour="recipes-filter"]')).toBeVisible();
  });

  test("Journal · Reflections", async ({ page }) => {
    await openTab(page, "Journal");
    await openSubTab(page, "Reflections");
    await expect(page.locator('[data-tour="reflections-log"]')).toBeVisible();
  });

  test("Journal · Field Notes", async ({ page }) => {
    await openTab(page, "Journal");
    await openSubTab(page, "Field Notes");
    await expect(page.locator('[data-tour="fieldnotes-lodestone"]')).toBeVisible();
  });

  test("Profile", async ({ page }) => {
    await openTab(page, "Profile");
    // The replay-tour control is Profile-specific and stable.
    await expect(page.getByRole("button", { name: /replay tour/i })).toBeVisible();
  });
});

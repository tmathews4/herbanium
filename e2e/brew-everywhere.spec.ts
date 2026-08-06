// e2e/brew-everywhere.spec.ts — every brew window can be brewed from.
//
// REPORTED: "missing brew button on the saved/favorited window again."
// The "again" is the important word. BlendExtractionExplorer renders
// whatever `brewAction` it is handed and nothing more, and the button's
// styling lived at the one call site that passed one — so every panel
// added since had to remember to rebuild it from scratch, and two
// didn't. A saved blend and an ingredient profile both showed a brew
// window with a temperature, a timer and no way to commit.
//
// The fix was one shared BrewCornerButton, but a shared component only
// stops the styling drifting; it doesn't stop the NEXT panel forgetting
// to pass it. That's what this spec is for. It walks to each place a
// brew panel appears and asserts the button is in it.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

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

const brewButton = (page: Page) => page.locator('[data-tour="blend-brew"]');

// Get to a rendered, open brew panel on whichever screen we're on.
//
// Two independent collapses, and they are NOT the same control. Detail
// screens wrap the explorer in a "Brewing" section that may be shut, and
// the brew row inside the panel folds on its own. Only expand either one
// if it's actually closed — an unconditional click on the section header
// SHUTS an already-open one, which is what the first version of this
// spec did while reporting "the brew panel should be on screen".
async function ensureBrewPanel(page: Page) {
  const row = page.locator('[data-tour="blend-controls"]').first();
  if (!(await row.count())) {
    const section = page.getByRole("button", { name: /Brewing/i }).first();
    if (await section.count()) await section.click();
  }
  await expect(row, "the brew panel should be on screen").toBeVisible({ timeout: 15_000 });
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
  await expect(page.locator('[data-tour="blend-sliders"]').first()).toBeVisible();
}

test.describe("every brew window has a Brew button", () => {
  test("composing a blend", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);
    await expect(brewButton(page), "the compose panel should offer Brew").toBeVisible();
    await expect(brewButton(page)).toBeEnabled();
  });

  test("a saved blend's Brewing panel", async ({ page }) => {
    // The one that was reported. The screen already had a full-width
    // CTA further down the page; the panel itself had nothing, so
    // anyone dialling in a temperature had to scroll away from the
    // controls to act on it.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();

    await ensureBrewPanel(page);
    await expect(brewButton(page), "a saved blend's panel should offer Brew").toBeVisible();
  });

  test("a single ingredient's profile", async ({ page }) => {
    // "Even single ingredient it's no harm to allow it." One leaf is a
    // perfectly good cup, and this panel shows its temperature.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Herbanium", exact: true }).click();
    // A NAMED ingredient, not just the first row. The explorer only
    // renders for ingredients that have an extraction profile, so
    // whatever happens to sort first is not a safe target.
    await page.locator('[data-tour="herb-search"]').getByRole("textbox").first().fill("chamomile");
    await page.locator('[data-tour="herb-ingredient"]').first().click();
    // The panel lives in this screen's own Brewing tab; Overview is default.
    await page.getByRole("button", { name: "Brewing", exact: true }).first().click();

    await ensureBrewPanel(page);
    await expect(brewButton(page), "an ingredient profile should offer Brew").toBeVisible();
  });

  test("brewing one leaf actually starts a steep", async ({ page }) => {
    // Present isn't the same as wired. This screen had no brew path at
    // all before — the button would have been decoration.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Herbanium", exact: true }).click();
    // A NAMED ingredient, not just the first row. The explorer only
    // renders for ingredients that have an extraction profile, so
    // whatever happens to sort first is not a safe target.
    await page.locator('[data-tour="herb-search"]').getByRole("textbox").first().fill("chamomile");
    await page.locator('[data-tour="herb-ingredient"]').first().click();
    // The panel lives in this screen's own Brewing tab; Overview is default.
    await page.getByRole("button", { name: "Brewing", exact: true }).first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();

    await expect(page.getByTestId("steep-screen").or(page.getByText(/steep/i).first()),
      "brewing a single ingredient should open the timer").toBeVisible({ timeout: 15_000 });
  });
});

// e2e/blend-save.spec.ts — keeping a composed pot.
//
// A composed blend COULD NOT BE SAVED. The naming prompt was fully
// built in ComposeScreen and nothing ever opened it —
// `setRcSavePromptOpen(true)` appeared nowhere in src/ — so the block
// was unreachable and the only way to keep a pot was to BREW it,
// because brewing saves as a side effect (App.jsx). Reported as
// wanting "a quicker way to save these recipes"; there was no way.
//
// The dock's right corner is the way in now, mirroring Brew on the
// left. Two claims are worth holding, and they are separate:
//
//   1. It KEEPS the pot — the blend reaches the catalogue under the
//      name given, which is the whole point of the feature.
//   2. It completes IN THE CHROME it was offered in. The first version
//      reused the orphaned inline panel and so a control in a fixed
//      dock sent you to the bottom of a long scrolling page to finish.
//      Reported immediately: "I don't want it to scroll to the save
//      button at bottom, that shouldn't exist at all". Asserting the
//      scroll position doesn't move is what stops that coming back —
//      a test that only checked the blend got saved would pass on the
//      version that was wrong.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

async function openComposer(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.profile", JSON.stringify({
      name: "Test Brewer", onboarded: true, createdAt: 1700000000000,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/");
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Blend", exact: true }).click();
}

// Two leaves, so the pot is a blend rather than a single ingredient.
async function fillThePot(page: Page) {
  for (const leaf of ["Chamomile", "Lavender"]) {
    await page.getByRole("button", { name: leaf, exact: true }).first().click();
  }
  // The corner is disabled while the pot is empty, so its being enabled
  // is also the signal that the ingredients landed.
  const save = page.getByTestId("blend-save");
  await expect(save, "the dock should offer a save once there's a pot")
    .toBeEnabled({ timeout: 30_000 });
}

// Whichever pane is actually scrolling. Read rather than assumed — the
// composer's scroll parent is not the document.
const scrollTop = (page: Page) => page.evaluate(() => {
  const pane = Array.from(document.querySelectorAll("div")).find(
    d => d.scrollHeight > d.clientHeight + 4 && d.clientHeight > 200,
  );
  return pane ? Math.round(pane.scrollTop) : null;
});

test.describe("keeping a composed blend", () => {
  test("the dock's corner names and keeps it, without leaving the dock", async ({ page }) => {
    await openComposer(page);
    await fillThePot(page);

    const before = await scrollTop(page);
    await page.getByTestId("blend-save").click();

    const dialog = page.getByTestId("blend-save-dialog");
    await expect(dialog, "saving should ask in a dialog, not down the page")
      .toBeVisible();
    expect(await scrollTop(page),
      "opening the prompt must not scroll the page out from under the reader")
      .toBe(before);

    await page.getByTestId("blend-save-name").fill("Evening Calm");
    await page.getByTestId("blend-save-confirm").click();

    // Reported inside the dialog, where the eye already is — the old
    // inline flow wrote its confirmation into a page the user may have
    // scrolled away from.
    await expect(page.getByTestId("blend-save-status"),
      "the outcome should be said where it was asked").toContainText(/Evening Calm/);
    await expect(dialog, "and the dialog should let go on its own").toBeHidden({ timeout: 10_000 });

    // The claim that matters: it is actually in the catalogue.
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Recipes", exact: true }).click();
    await page.getByRole("button", { name: "All", exact: true }).first().click();
    await expect(page.getByText("Evening Calm").first(),
      "a kept blend should appear among the recipes").toBeVisible({ timeout: 30_000 });
  });

  test("backing out keeps nothing", async ({ page }) => {
    await openComposer(page);
    await fillThePot(page);

    await page.getByTestId("blend-save").click();
    await page.getByTestId("blend-save-name").fill("Never Saved");
    await page.getByRole("button", { name: "not yet", exact: true }).click();
    await expect(page.getByTestId("blend-save-dialog")).toBeHidden();

    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Recipes", exact: true }).click();
    await page.getByRole("button", { name: "All", exact: true }).first().click();
    await expect(page.getByText("Never Saved"),
      "declining the prompt should not have kept anything").toHaveCount(0);
  });
});

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

/* IT REFUSES TO SAVE AS "UNTITLED".

   That string was the fallback on every save path, so the easiest
   possible action — open the prompt, press keep — produced a catalogue
   row indistinguishable from every other one made that way. Asked for
   as "don't let it save as untitled, make the user enter a text and
   prompt them to if they try to save with untitled".

   Both halves are asserted: the refusal SAYS something (a dialog that
   just does nothing reads as broken), and nothing reaches the
   catalogue. Checking only the message would pass on a version that
   complained and saved anyway. */
test.describe("a blend has to be given a name", () => {
  test("keeping with an empty name asks for one instead of inventing it", async ({ page }) => {
    await openComposer(page);
    await fillThePot(page);

    await page.getByTestId("blend-save").click();
    await expect(page.getByTestId("blend-save-name"),
      "the field starts empty — a prefilled name is a name nobody chose")
      .toHaveValue("");

    await page.getByTestId("blend-save-confirm").click();
    await expect(page.getByTestId("blend-save-status"),
      "an empty name should be refused out loud").toContainText(/give it a name/i);
    await expect(page.getByTestId("blend-save-dialog"),
      "and the prompt should stay up so it can be answered").toBeVisible();

    // Typing the old fallback by hand is refused too, or the rule is one
    // copy-paste from being undone.
    await page.getByTestId("blend-save-name").fill("Untitled blend");
    await page.getByTestId("blend-save-confirm").click();
    await expect(page.getByTestId("blend-save-status")).toContainText(/give it a name/i);

    await page.getByRole("button", { name: "not yet", exact: true }).click();
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Recipes", exact: true }).click();
    await page.getByRole("button", { name: "All", exact: true }).first().click();
    await expect(page.getByText(/untitled/i),
      "nothing should have been kept under a placeholder name").toHaveCount(0);
  });
});

/* EVERY BREW BAR OFFERS IT, which is the same argument BrewSurface's
   header already makes about Brew: the corner went missing from two
   panels when its styling lived at the call site, and "every brew
   window gets one" is the rule that fixed it. A cup you have found the
   temperature for is worth writing down wherever you found it.

   Walked through the real screens rather than asserted on props — the
   bug that motivated the rule was a panel rendering without the corner,
   which only a walk can see. */
test.describe("the save corner is on every brew bar", () => {
  test("a saved recipe's brew bar offers it", async ({ page }) => {
    await openComposer(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Recipes", exact: true }).click();
    // Through the catalogue rather than a saved row: this profile has
    // saved nothing yet, and the claim is about the recipe SCREEN, which
    // a curated blend reaches just as well.
    await page.getByRole("button", { name: "All", exact: true }).first().click();
    await page.getByText("Spring Tonic", { exact: false }).first().click();
    await expect(page.getByTestId("blend-save"),
      "a recipe screen should let you keep your version of it")
      .toBeVisible({ timeout: 30_000 });
  });

  test("an ingredient's brew bar offers it", async ({ page }) => {
    await openComposer(page);
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Herbanium", exact: true }).click();
    await page.locator('[data-tour="herb-search"]').getByRole("textbox").first().fill("chamomile");
    await page.locator('[data-tour="herb-ingredient"]').first().click();
    await page.getByRole("button", { name: "Brewing", exact: true }).first().click();
    await expect(page.getByTestId("blend-save"),
      "a single leaf is a recipe you can keep").toBeVisible({ timeout: 30_000 });
  });
});

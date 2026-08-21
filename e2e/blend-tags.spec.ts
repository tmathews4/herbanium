// e2e/blend-tags.spec.ts — the little dashed pills under a blend's
// header, and the card they open.
//
// Each pill carries a `summary` and a `body`, and VocabInfoCard used to
// join them with `" " + body`. Every description table in the app holds
// strings, so that worked everywhere it was looked at — and BlendDetail
// builds the heads-up body as JSX, one line per flagged ingredient with
// its name in terra. String-concatenating a React element gave the user
//
//     One ingredient in this blend has interactions worth knowing
//     about. [object Object]
//
// which is what this file exists to keep out. The guard is deliberately
// written as "no pill on this blend renders [object Object]" rather than
// "the heads-up pill doesn't", because the defect belongs to the shared
// card, not to the one caller that happened to expose it: a future tag
// with a rich body would break exactly the same way.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

/* Masala Chai carries the heads-up tag — assam, cinnamon, cloves and
   black pepper all declare one. If that ever stops being true the
   first assertion below says so by name, rather than the file quietly
   passing while testing nothing. */
const BLEND = "Masala Chai";

async function openBlend(page: Page, name: string) {
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
  /* Pick the collection explicitly rather than relying on whatever the
     strip lands on — this spec is about the card, not the default. */
  await page.locator('[data-tour="recipes-filter"]')
    .getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
}

test.describe("a blend's tags", () => {
  test("open a card that reads as prose, not as an object", async ({ page }) => {
    await openBlend(page, BLEND);

    const headsUp = page.getByRole("button", { name: "heads-up", exact: true });
    await expect(headsUp, `${BLEND} should still carry the heads-up tag`)
      .toBeVisible({ timeout: 15_000 });

    await headsUp.click();

    /* The summary is the half that always worked; the body is the half
       that stringified. Assert the flagged ingredient actually reached
       the card, so a body that renders NOTHING can't pass this. */
    await expect(page.getByText(/interactions worth knowing about/i)).toBeVisible();
    await expect(page.getByText(/\[object Object\]/),
      "the body must be rendered, not concatenated onto the summary")
      .toHaveCount(0);
    await expect(page.getByText(/Black Pepper/i).first(),
      "the heads-up body names the ingredients it is about").toBeVisible();
  });

  test("every tag on the blend opens something readable", async ({ page }) => {
    await openBlend(page, BLEND);

    /* Walk whatever tags this blend actually has rather than a list
       written down here — the tags are derived from the blend's own
       data, so a new one gets covered by existing, and a stale name
       can't rot. */
    const pills = page.locator('[data-testid="blend-tag"]');
    await expect(pills.first(), "the blend should show at least one tag")
      .toBeVisible({ timeout: 15_000 });
    const count = await pills.count();

    for (let i = 0; i < count; i++) {
      const label = (await pills.nth(i).innerText()).trim();
      await pills.nth(i).click();
      /* Assert the card OPENED before asserting what isn't in it — a
         "no [object Object]" check against a card that never rendered
         passes for the wrong reason. */
      await expect(page.getByTestId("vocab-info-card"),
        `the "${label}" tag opened no card`).toBeVisible();
      await expect(page.getByText(/\[object Object\]/),
        `the "${label}" card rendered an object instead of its body`)
        .toHaveCount(0);
      await pills.nth(i).click();   // close, so the next one opens clean
    }
  });
});

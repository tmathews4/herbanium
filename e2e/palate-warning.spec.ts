// e2e/palate-warning.spec.ts — the cup says it once.
//
// A palate overload was announced twice: a ⚠ on the palate row whose
// bar you can watch cross its threshold, and a prose band below saying
// the same thing in a sentence. Same event, same numbers — bitterness
// at 2.5 and astringency at 2.0 are hardcoded identically in
// PALATE_WARNINGS and in buildWarnings — and on a blend pushing both
// axes the near-identical bands stacked up and buried the one
// leaf-specific line worth reading.
//
// The mark now stays where the evidence is, and carries the sentence
// when you tap it.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.beforeEach(() => test.slow());

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

// A cup pushed hard enough to cross a palate threshold: assam, hot and
// long. The point is to reach the warning state, not to be drinkable.
async function overPulledCup(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill("assam");
  await page.getByRole("button", { name: /assam/i }).first().click();

  const row = page.locator('[data-tour="blend-controls"]').first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();

  // Push the steep to the end of what the slider allows.
  await page.getByTestId("brew-axis-timeS").click();
  const steep = page.getByLabel("Steep time");
  await steep.fill((await steep.getAttribute("max"))!);
}

test.describe("a palate overload is announced once", () => {
  test("the mark carries the sentence, and the band below doesn't repeat it", async ({ page }) => {
    await boot(page);
    await overPulledCup(page);

    const mark = page.getByTestId(/^palate-warn-/).first();
    await expect(mark, "an over-pulled cup should flag a palate axis")
      .toBeVisible({ timeout: 15_000 });

    // Nothing is saying it in prose yet.
    await expect(page.getByTestId("palate-warn-detail"),
      "the explanation should be behind the mark, not printed beside it")
      .toHaveCount(0);

    await mark.click();
    const detail = page.getByTestId("palate-warn-detail");
    await expect(detail, "tapping the mark should explain it").toBeVisible();
    await expect(detail, "and it should say something worth reading")
      .toContainText(/steep|degrees|tannin|bitter|astringent/i);

    // Tapping again puts it away.
    await mark.click();
    await expect(detail).toHaveCount(0);
  });

});

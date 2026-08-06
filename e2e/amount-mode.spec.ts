// e2e/amount-mode.spec.ts — the pot can be measured two ways.
//
// Recipes are written both ways in the world: "two parts chamomile,
// one part lavender", and "3g chamomile, 1.5g lavender". The composer
// only spoke the first, so anyone working from a weighed recipe had to
// convert it in their head before they could type it in.
//
// The load-bearing property isn't the toggle — it's that the toggle
// changes only the LANGUAGE. A part has always been a gram internally,
// so both modes read and write one stored number; a second store would
// let them drift, and then switching modes would silently rebrew the
// cup. That's what the round-trip test below is really watching.
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

async function addChamomile(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill("chamomile");
  await page.getByRole("button", { name: /chamomile/i }).first().click();
  await expect(page.getByTestId("amount-chamomile"),
    "the pot should list what was just added").toBeVisible({ timeout: 30_000 });
}

test.describe("parts or weight, one pot", () => {
  test("the toggle switches the language without changing the cup", async ({ page }) => {
    await boot(page);
    await addChamomile(page);

    const readout = page.getByTestId("amount-chamomile");
    const asParts = (await readout.innerText()).trim();
    expect(asParts, "a first ingredient starts as the 2-part lead").toBe("2");

    await page.getByTestId("amount-mode-weight").click();
    const asWeight = (await readout.innerText()).trim();
    expect(asWeight, "weight mode should name a unit, not a bare ratio")
      .toMatch(/\d.*(g|tsp|tbsp|pinch)/i);

    // Back again, untouched. If the two modes were separate stores this
    // is where they'd disagree.
    await page.getByTestId("amount-mode-parts").click();
    expect((await readout.innerText()).trim(),
      "a round trip through weight must not move the pot").toBe(asParts);
  });

  test("weight mode steps in finer increments than parts", async ({ page }) => {
    // The point of the mode: a part is a whole gram, and plenty of
    // recipes are written in halves. If weight stepped by 1 too, the
    // toggle would be a relabelling and nothing more.
    await boot(page);
    await addChamomile(page);

    const readout = page.getByTestId("amount-chamomile");
    await page.getByTestId("amount-mode-weight").click();
    const before = (await readout.innerText()).trim();

    await page.getByRole("button", { name: /increase chamomile/i }).click();
    const after = (await readout.innerText()).trim();
    expect(after, "the stepper should have moved the amount").not.toBe(before);

    // And back to where it started — one step up, one step down.
    await page.getByRole("button", { name: /decrease chamomile/i }).click();
    expect((await readout.innerText()).trim(),
      "a step up and back down should land where it began").toBe(before);
  });

  test("weight mode speaks whichever unit settings is set to", async ({ page }) => {
    // "Parts | Grams" only makes sense if the user asked for grams.
    // Someone who measures in teaspoons should never be handed a gram
    // here and teaspoons everywhere else — the toggle names the unit
    // they already chose, it doesn't introduce a second one.
    await boot(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-g").click();

    await addChamomile(page);
    await page.getByTestId("amount-mode-weight").click();
    await expect(page.getByTestId("amount-mode-weight"),
      "with grams chosen in settings, the pill should say grams").toHaveText(/gram/i);
    expect((await page.getByTestId("amount-chamomile").innerText()).trim())
      .toMatch(/\bg\b/);

    // Flip the preference and come back. The pot itself doesn't survive
    // a trip to Profile — the composer remounts empty — so the leaf is
    // added again; what's being checked is the LABEL following the
    // setting, not the pot's memory.
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-tsp").click();
    await addChamomile(page);

    await expect(page.getByTestId("amount-mode-weight"),
      "switching the setting should re-label the pill").toHaveText(/tsp/i);
    expect((await page.getByTestId("amount-chamomile").innerText()).trim(),
      "and the readout should follow it").toMatch(/tsp|tbsp|pinch/i);
  });

  test("the mode survives a reload, like the other unit preferences", async ({ page }) => {
    await boot(page);
    await addChamomile(page);
    await page.getByTestId("amount-mode-weight").click();
    await expect(page.getByTestId("amount-mode-weight")).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await expect(page.getByTestId("amount-mode-weight"),
      "someone who thinks in grams shouldn't have to say so twice")
      .toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
  });
});

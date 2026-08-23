// e2e/pour-size.spec.ts — the vessel you're actually pouring into.
//
// REPORTED as a question, not a bug: "is 2 tsp of black assam really
// 249 mg of caffeine?" The caffeine was a separate unit error, but the
// question underneath it survived the fix — the searching that produced
// the 3–4 g figure was for a 12 OZ MUG, and our 2 g is for a 200 ml
// cup, which is the volume every extraction profile in the catalog
// is written against. Both numbers were right about different vessels,
// and the app only offered the one nobody drinks from.
//
// So "a mug · 350 ml" sits between the cup and the pot, and it is the
// default, because the measurement is not the thing on the desk.
//
// WHAT THIS SPEC HOLDS, and the reason it reads POUR_SIZES rather than
// naming grams: the pour scales what you MEASURE OUT and nothing else.
// The ratio, the concentration and therefore every prediction are
// identical across all three — a mug is more of the same cup. The node
// suite holds that arithmetic (tests/pour-parts.test.mjs); this holds
// that a user can reach it and that the screen says which vessel it
// just costed.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";
import { POUR_SIZES } from "../src/units/units";

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

// The line under the ingredient list: "a mug · 3.5 g total".
const potTotal = (page: Page) => page.getByTestId("pot-total");

const gramsIn = async (page: Page) => {
  const text = (await potTotal(page).innerText()).trim();
  /* \s+ between the unit and "total", not a literal space: the total
     line is several elements now (the amount is an editable control),
     so innerText comes back as "A CUP\n1.0 g\nTOTAL". */
  const match = text.match(/([\d.]+)\s*g\s+total/i);
  expect(match,
    `the total should name a weight in GRAMS, got "${text}" — if this says ` +
    `tsp, the test forgot to select grams in Profile`).not.toBeNull();
  return Number(match![1]);
};

test.describe("how much you're making", () => {
  test("the mug is the default, and it says so in millilitres", async ({ page }) => {
    // "A cup" is a measurement and "a mug" is a vessel. Starting at the
    // measurement is what sent someone to a search engine, so the app
    // starts at the mug — and the volume is on the row, because the
    // ambiguity was never about the leaf.
    await boot(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();

    await expect(page.getByTestId("pour-mug"),
      "a mug should be offered").toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pour-detail"),
      "and the row should name the volume, not only the leaf")
      .toHaveText(new RegExp(`${POUR_SIZES.mug.ml}\\s*ml`));

    await addChamomile(page);
    await expect(potTotal(page), "the pot should be costed for a mug by default")
      .toContainText(POUR_SIZES.mug.name);
  });

  test("every size in the table is reachable, and each scales the shopping list", async ({ page }) => {
    /* DERIVED, NOT RESTATED. This walks POUR_SIZES and holds the app to
       whatever is in it — add a size, change a volume, and the ratio
       expected here moves with the table. A hand-typed "3.5 g" would be
       a second copy of the answer, and a second copy is the drift every
       contract spec in this repo exists to catch. */
    await boot(page);

    /* ASK FOR GRAMS. This test compares totals numerically against
       POUR_SIZES.doses within 0.15g, and only the gram readout carries
       that precision — the teaspoon ladder rounds to a quarter and
       rolls up to tablespoons above 3, so "1½ tsp" cannot express the
       difference between a cup and a mug's worth of chamomile.
       
       It used to pass without this because the total was hardcoded to
       grams no matter what the user had chosen, which was the bug
       fixed alongside this line. The test was reading a readout no
       teaspoon user ever saw. */
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-g").click();

    await addChamomile(page);

    const totals: Record<string, number> = {};
    for (const [id, size] of Object.entries(POUR_SIZES)) {
      await page.getByRole("button", { name: "Profile", exact: true }).click();
      await page.getByTestId(`pour-${id}`).click();
      await expect(page.getByTestId("pour-detail"),
        `choosing ${size.name} should update the volume shown`)
        .toHaveText(new RegExp(`${size.ml}\\s*ml`));

      // The composer remounts empty on the way back, as amount-mode.spec
      // documents — the leaf is re-added rather than remembered.
      await addChamomile(page);
      await expect(potTotal(page), `the total should say which vessel it costed`)
        .toContainText(size.name, { timeout: 30_000 });
      totals[id] = await gramsIn(page);
    }

    for (const [id, size] of Object.entries(POUR_SIZES)) {
      const expected = totals.cup * size.doses;
      expect(Math.abs(totals[id] - expected),
        `${size.name} should measure out ${size.doses}× a cup: expected ~${expected.toFixed(1)} g, got ${totals[id]} g`)
        .toBeLessThanOrEqual(0.15);   // the readout rounds to 0.1 g
    }
  });
});

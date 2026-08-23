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
import { defaultPartsFor } from "../src/data/blendShares";

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

/* Adding a SECOND leaf needs the search refilled — the box still holds
   the first leaf's name, so the second is simply not on screen. The
   first version of the dictated-total test skipped that and spent 90
   seconds in a bare .click() waiting for a button that could never
   appear, reporting only "test timeout". Assert, then click. */
async function addLeaf(page: Page, name: string) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill(name);
  const card = page.getByRole("button", { name: new RegExp(name, "i") }).first();
  await expect(card, `"${name}" should be listed once searched for`)
    .toBeVisible({ timeout: 30_000 });
  await card.click();
  await expect(page.getByTestId(`amount-${name.toLowerCase()}`),
    "the pot should list what was just added").toBeVisible({ timeout: 30_000 });
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
    // Derived, not restated. A leaf's starting parts come from the share
    // the curated blends give it (chamomile is a base at 61%, so it
    // opens heavy), and hardcoding a number here would make this spec a
    // second copy of that answer — the drift blendShares.js exists to
    // avoid. It used to read "2" because every first ingredient did,
    // regardless of what it was.
    expect(asParts, "a leaf should open at its own shelf share")
      .toBe(String(defaultPartsFor("chamomile")));

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

  test("the pot total speaks the chosen unit too, not just the rows", async ({ page }) => {
    // REPORTED: "we list grams for the parts total qty when parts are
    // selected. Should be tsp if using that in our settings."
    //
    // The rows already followed the setting; the TOTAL did not, and the
    // total is the one line that says what to measure out. So a
    // teaspoon user read teaspoons everywhere and a gram figure on the
    // only line they'd act on.
    //
    // Asserted in PARTS mode deliberately — weight mode hides this line
    // entirely, so the bug lived where the test wasn't looking.
    await boot(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-tsp").click();
    await addChamomile(page);

    /* CASE-INSENSITIVE, and that is not incidental. The label is
       uppercased in CSS, so innerText hands back "A MUG · 1.8 G TOTAL".
       A case-sensitive /\d\s*g\b/ misses that "G" — which means the
       NEGATIVE assertion below would have passed happily while grams
       were on screen. The first version of this test did exactly that
       and only caught the bug through the positive tsp assertion. */
    const GRAMS = /\d[\d.,]*\s*g\b/i;
    const SPOONS = /\b(tsp|tbsp|pinch)\b/i;

    const total = page.getByTestId("pot-total");
    await expect(total, "the total sits under the ingredient list in parts mode")
      .toBeVisible({ timeout: 30_000 });
    expect((await total.innerText()).trim(),
      "with teaspoons chosen, the total must not be handed over in grams")
      .not.toMatch(GRAMS);
    expect((await total.innerText()).trim(),
      "and it should speak the teaspoon ladder the rows already speak")
      .toMatch(SPOONS);

    // The other direction, so this can't pass by the label going blank.
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-g").click();
    await addChamomile(page);
    expect((await page.getByTestId("pot-total").innerText()).trim(),
      "with grams chosen it should still say grams").toMatch(GRAMS);
  });

  test("you can dictate the pot's weight, and the ratio scales to meet it", async ({ page }) => {
    // REQUESTED: "let the user edit that field so they can dictate the
    // weight of the proportions and feed that weight into our calc,
    // but default to a standard serving."
    //
    // The load-bearing claim is not that the number changes — it is
    // that the RATIO SURVIVES. Parts are volumetric, so dictating a
    // total multiplies every leaf by one factor; if the mix moved, the
    // blend you built is not the blend you brew.
    await boot(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-g").click();
    await addChamomile(page);

    // A second leaf, so there is a ratio to preserve at all.
    await addLeaf(page, "Lavender");

    const ratioBefore = [
      (await page.getByTestId("amount-chamomile").innerText()).trim(),
      (await page.getByTestId("amount-lavender").innerText()).trim(),
    ];

    await page.getByTestId("pot-total-edit").click();
    const box = page.getByTestId("pot-total-input");
    await expect(box, "tapping the total should open an editable field").toBeVisible();
    await box.fill("7");
    await box.press("Enter");

    await expect(page.getByTestId("pot-total"),
      "the total should now read what was asked for").toContainText(/7(\.0)?\s*g/i);
    expect([
      (await page.getByTestId("amount-chamomile").innerText()).trim(),
      (await page.getByTestId("amount-lavender").innerText()).trim(),
    ], "the PARTS are a ratio and must not move when the pot is rescaled")
      .toEqual(ratioBefore);
  });

  test("a dictated pot reaches the PREDICTION, not just the shopping list", async ({ page }) => {
    /* "feed that weight into our calc" is the half that could have been
       faked. Scaling only what you measure out would look identical on
       the total line and change nothing about the cup.

       The distinction the app already draws, and this had to respect:
       choosing a bigger VESSEL scales water and leaf together, so the
       concentration is unchanged and the prediction must NOT move — a
       pot is more of the same cup. Dictating a weight holds the vessel
       still and changes the leaf, which is a real concentration change,
       so it must.

       Asserted through the palate warnings because they are the
       model's own output: a standard chamomile cup raises none, and a
       four-times pot raises them. Measured, not assumed — a probe run
       gave 0 and 2. */
    await boot(page);
    await addChamomile(page);

    const warnings = page.locator('[data-testid^="palate-warn-"]');
    const before = await warnings.count();

    await page.getByTestId("pot-total-edit").click();
    const box = page.getByTestId("pot-total-input");
    await box.fill("99");                 // clamps to the 4x ceiling
    await box.press("Enter");
    await expect(page.getByTestId("pot-total-reset"),
      "the pot should now be running above standard").toBeVisible();

    await expect.poll(() => warnings.count(), {
      message: "a four-times pot must reach the prediction — if this stays " +
        "equal, the dictated weight is only scaling the shopping list",
      timeout: 10_000,
    }).toBeGreaterThan(before);
  });

  test("reset puts the pot back to the vessel's standard serving", async ({ page }) => {
    // The default has to survive the feature — "default to a standard
    // serving" is half the request, and a dial with no way back is a
    // setting the user is stuck inside.
    await boot(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByTestId("weight-unit-g").click();
    await addChamomile(page);

    const standard = (await page.getByTestId("pot-total").innerText()).trim();
    await expect(page.getByTestId("pot-total-reset"),
      "nothing to reset before anything is dictated").toHaveCount(0);

    await page.getByTestId("pot-total-edit").click();
    await page.getByTestId("pot-total-input").fill("6");
    await page.getByTestId("pot-total-input").press("Enter");
    expect((await page.getByTestId("pot-total").innerText()).trim(),
      "the dictated total should differ from the standard one").not.toBe(standard);

    await page.getByTestId("pot-total-reset").click();
    expect((await page.getByTestId("pot-total").innerText()).trim(),
      "reset should restore the vessel's standard serving exactly").toBe(standard);
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

// e2e/write-dock.spec.ts — writing is a dock, like brewing is.
//
// The journal's writing control used to be a full-width button and a
// drop-down at the top of the reflections page, which put the least-used
// thing on the screen above the thing the screen is for. It's now the
// same shape as the brew controls: a row in the bottom dock that opens
// upward onto the whole writing surface, and folds away again.
//
// What's worth asserting is the arc, not the markup: the timeline is
// what you see, writing covers it, saving is reachable the whole time,
// and putting it away gives the timeline back. Each of those was a
// separate decision and each can regress on its own.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.slow();

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

async function openReflections(page: Page) {
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Reflections", exact: true }).click();
  await expect(page.getByTestId("write-dock-toggle")).toBeVisible({ timeout: 30_000 });
}

test.describe("the writing dock", () => {
  test("folds away by default, so the journal is what you land on", async ({ page }) => {
    await boot(page);
    await openReflections(page);

    const toggle = page.getByTestId("write-dock-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    /* HIDDEN, not unmounted — and the difference is deliberate. The
       panel keeps a draft in local state, so folding the dock to glance
       at the timeline has to leave that draft alone (see the minimize
       test below). toBeHidden is therefore the correct assertion, and
       toBeVisible's inverse: it passes for display:none and fails for
       anything the user could actually see. */
    await expect(page.getByTestId("write-dock-panel"),
      "the writing surface should be out of sight while folded").toBeHidden();

    /* The whole point of moving it: the timeline gets the page. If the
       dock ever grew back into the scroll area this would still pass on
       "is it visible" alone, so measure — the folded row is chrome, and
       chrome that eats a third of the screen isn't chrome. */
    const dock = page.locator("#write-dock");
    const dockH = (await dock.boundingBox())?.height ?? 0;
    const viewport = page.viewportSize()?.height ?? 1;
    expect(dockH, `folded dock took ${Math.round(dockH)}px of ${viewport}`)
      .toBeLessThan(viewport * 0.12);
  });

  test("opens onto the writing surface, saves, and gives the timeline back", async ({ page }) => {
    await boot(page);
    await openReflections(page);

    const before = await page.locator('[data-testid^="journal-entry"], [data-tour="reflections-log"]').count();
    const toggle = page.getByTestId("write-dock-toggle");
    await toggle.click();

    const panel = page.getByTestId("write-dock-panel");
    await expect(panel, "the whole composer lives in the dock now").toBeVisible();
    await expect(page.getByTestId("write-dock-forms"),
      "with the four forms as a strip inside it").toBeVisible();

    /* SAVE IS IN THE HEADER, not at the foot of the form. That's the
       reason the composer portals it out: the haiku form is taller than
       the panel, so a footer button leaves the screen exactly when the
       form is longest. Asserting it's on screen while the panel is open
       is asserting the reason it moved. */
    const save = page.getByTestId("journal-save");
    await expect(save, "Save should be in the dock header").toBeVisible();
    await expect(save, "and disabled until there's something to save").toBeDisabled();

    await page.locator("textarea").first().fill("The kettle ticks as it cools.");
    await expect(save).toBeEnabled();

    const box = await save.boundingBox();
    const vh = page.viewportSize()?.height ?? 0;
    expect(box, "Save must have a box").not.toBeNull();
    expect((box!.y + box!.height) < vh,
      `Save sat at y=${Math.round(box!.y)} in a ${vh}px viewport`).toBe(true);

    await save.click();
    const bar = page.getByTestId("journal-save-bar");
    await expect(bar, "the naming step arrives with its own action bar").toBeVisible();
    await page.getByTestId("journal-save-commit").click();

    // Saving puts the writing away — you're back on the journal, which
    // is where the thing you just wrote now lives.
    await expect(panel, "saving should fold the dock").toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("The kettle ticks as it cools.").first(),
      "and the entry should be in the timeline").toBeVisible({ timeout: 15_000 });
    expect(before).toBeGreaterThan(0); // the log was there to begin with
  });

  test("minimize puts the writing away without discarding it", async ({ page }) => {
    /* There is no Cancel any more — the chevron is the only way out, so
       it had better not be a destructive one. A user who folds the dock
       to check what they wrote last week and unfolds it again should
       find their draft where they left it. */
    await boot(page);
    await openReflections(page);

    const toggle = page.getByTestId("write-dock-toggle");
    await toggle.click();
    await page.locator("textarea").first().fill("half a thought");

    await toggle.click();
    await expect(page.getByTestId("write-dock-panel")).toBeHidden();

    await toggle.click();
    await expect(page.locator("textarea").first(),
      "folding is not discarding").toHaveValue("half a thought");
  });

  test("the naming step's action bar rides along when the card scrolls", async ({ page }) => {
    /* The card has a title field and two mood rows whose chips wrap, so
       on a short screen both buttons used to scroll off the bottom of
       the one thing you opened the card to do. A short viewport is the
       point of this test, not an accident of it — at phone height the
       card doesn't scroll and the bug is invisible. */
    await boot(page);
    await page.setViewportSize({ width: 360, height: 400 });
    await openReflections(page);

    await page.getByTestId("write-dock-toggle").click();
    await page.locator("textarea").first().fill("steam on the window");
    await page.getByTestId("journal-save").click();

    const bar = page.getByTestId("journal-save-bar");
    await expect(bar).toBeVisible();

    const card = page.locator('[data-testid="journal-save-bar"]').locator("xpath=..");
    const scrollable = await card.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrollable, "the card must actually scroll or this proves nothing").toBe(true);

    const top = (await bar.boundingBox())!.y;
    await card.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(300);
    const bottom = (await bar.boundingBox())!.y;

    expect(Math.abs(bottom - top),
      `the bar moved from y=${Math.round(top)} to y=${Math.round(bottom)} as the card scrolled`)
      .toBeLessThanOrEqual(2);
    await expect(page.getByTestId("journal-save-commit")).toBeVisible();
  });
});

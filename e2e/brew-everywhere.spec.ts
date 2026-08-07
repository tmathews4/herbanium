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
import { brewFromDetail } from "./helpers/brew";

// Opening a detail overlay pulls a lazy-loaded screen chunk and then
// waits for the explorer to mount and settle. Under four workers that
// outruns the config's 30s budget — measured as "element(s) not found"
// after a 15s wait, not a pointer interception. Same call the tour specs
// already make, for the same reason.
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

const brewButton = (page: Page) => page.locator('[data-tour="blend-brew"]');

// Get to a rendered, open brew panel on whichever screen we're on.
//
// Two independent collapses, and they are NOT the same control. Detail
// screens wrap the explorer in a "Brewing" section that may be shut, and
// the brew row inside the panel folds on its own. Only expand either one
// if it's actually closed — an unconditional click on the section header
// SHUTS an already-open one, which is what the first version of this
// spec did while reporting "the brew panel should be on screen".
//
// Both are asked directly now, via aria-expanded. Inferring "shut" from
// "its contents aren't here yet" is the same bug wearing a condition.
async function ensureBrewPanel(page: Page) {
  // Say WHICH stage is missing. "no brew panel" covered three different
  // failures — the detail overlay never opened, its lazy chunk never
  // arrived, or the panel never portalled into the slot — and under
  // contention they are not the same bug.
  const detail = page.locator('[data-testid="blend-detail"]');
  if (await detail.count()) {
    await expect(detail, "the detail overlay should be open").toBeVisible({ timeout: 30_000 });
  }
  // ASK THE SECTION, don't guess from its contents. This used to read
  // "if the brew row isn't in the DOM, the section must be shut" — and
  // on a cold lazy chunk the row simply hasn't rendered yet, so the
  // click SHUT a section that was already open and the panel never
  // came back. It failed two or three tests a run, never the same
  // ones, which is what sent this looking like load rather than logic.
  const section = page.getByTestId("brewing-section");
  if (await section.count()) {
    await expect(section, "the Brewing section should say whether it's open")
      .toHaveAttribute("aria-expanded", /true|false/, { timeout: 30_000 });
    if ((await section.getAttribute("aria-expanded")) !== "true") await section.click();
  }
  const row = page.locator('[data-tour="blend-controls"]').first();
  // 45s. This waits on a lazy screen chunk, an explorer mount and a
  // portal into the host's dock; under four workers it has measured
  // past 30s. It is a load-tolerance number, not a correctness one —
  // the same walk takes ~2s run alone.
  await expect(row, "the brew panel should be on screen").toBeVisible({ timeout: 45_000 });
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
    // Every corner Brew asks first now. A leaf is already named, so this
    // prompt carries no name field.
    await expect(page.getByTestId("brew-confirm")).toBeVisible();
    await expect(page.getByTestId("brew-confirm-name"),
      "an already-named thing shouldn't ask for a rename").toHaveCount(0);
    await page.getByTestId("brew-confirm-go").click();

    await expect(page.getByTestId("steep-screen").or(page.getByText(/steep/i).first()),
      "brewing a single ingredient should open the timer").toBeVisible({ timeout: 15_000 });
  });
});

test.describe("brewing asks first", () => {
  test("the composer's Brew confirms, and takes the name", async ({ page }) => {
    // Brewing starts a timer and commits the cup — the one irreversible
    // thing this screen does. The name is asked for here because this is
    // the moment you know what to call it.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();

    const dialog = page.getByTestId("brew-confirm");
    await expect(dialog, "Brew should ask before starting a timer").toBeVisible();
    await page.getByTestId("brew-confirm-name").fill("Evening Chamomile");
    await page.getByTestId("brew-confirm-go").click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Evening Chamomile").first(),
      "the name given at the prompt should follow the cup").toBeVisible({ timeout: 15_000 });
  });

  test("backing out of the prompt brews nothing", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();
    await page.getByTestId("brew-confirm-cancel").click();

    await expect(page.getByTestId("brew-confirm")).toBeHidden();
    // Still on the composer, still holding the pot — nothing committed.
    await expect(page.locator('[data-tour="blend-quantity"]'),
      "cancelling should leave the pot exactly as it was").toBeVisible();
  });
});

test.describe("a named cup isn't asked to be renamed", () => {
  test("a saved recipe's corner Brew asks, without a name field", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();

    await expect(page.getByTestId("brew-confirm"),
      "a saved recipe should still confirm — it starts a timer").toBeVisible();
    await expect(page.getByTestId("brew-confirm-name"),
      "but the recipe already has a name").toHaveCount(0);
  });
});

test.describe("quick brew — the deliberate exception", () => {
  test("a recipe row brews on the spot, minimized, without asking", async ({ page }) => {
    // Everything else confirms. This doesn't, and that IS the feature:
    // the prompt exists to catch an accidental commit while you're
    // dialling something in, and a saved recipe is a cup you already
    // keep. It also stays out of your way — the timer folds into the
    // banner instead of taking the screen.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();

    const quick = page.locator('[data-testid^="quick-brew-"]').first();
    await expect(quick, "a saved recipe should offer a one-tap brew").toBeVisible();
    await quick.click();

    await expect(page.getByTestId("brew-confirm"),
      "quick brew must not ask — that's the whole point of it").toHaveCount(0);

    // AND IT ACTUALLY BREWED. Asserting only that nothing was asked
    // would pass just as happily for a button wired to nothing.
    await expect(page.getByRole("button", { name: /return to your steeping brew/i }),
      "the cup should be running, folded into the banner")
      .toBeVisible({ timeout: 15_000 });

    // Still on the list rather than staring at a full-screen timer.
    await expect(page.locator('[data-tour="recipes-row"]').first(),
      "quick brew should leave you where you were").toBeVisible();
  });

  test("tapping the row itself still opens the recipe, not a brew", async ({ page }) => {
    // The quick-brew control sits ON the row, and the row's own tap
    // opens the detail page. A stray tap must not start a cup — this is
    // the "traditional-rows-auto-brewing incident" the row's own comment
    // warns about, now with a control that really does brew sitting
    // inside it.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();

    await expect(page.getByRole("button", { name: /Brewing/i }).first(),
      "the row should open the recipe").toBeVisible({ timeout: 15_000 });
  });
});

test.describe("a recipe page offers exactly one brew", () => {
  test("the full-width CTA stands down while the panel is open", async ({ page }) => {
    // The page used to carry both, and they didn't agree: the panel's
    // corner asks for confirmation, the CTA didn't. One page, two
    // brews, two behaviours.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);

    await expect(brewButton(page), "the panel's corner Brew is the control")
      .toBeVisible();
    await expect(page.getByRole("button", { name: /Brew this cup|Brew your twist/i }),
      "and the full-width CTA should stand down while it's there")
      .toHaveCount(0);
  });

  test("folding the section brings the CTA back", async ({ page }) => {
    // Why it isn't simply deleted: fold the section and the panel goes
    // with it, which would leave a recipe page with no way to brew.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);

    await page.getByRole("button", { name: /Brewing/i }).first().click();
    await expect(page.getByRole("button", { name: /Brew this cup|Brew your twist/i }),
      "a folded recipe page must still be brewable")
      .toBeVisible({ timeout: 15_000 });
  });
});

test.describe("an empty dock slot draws nothing", () => {
  test("folding the panel leaves no band behind", async ({ page }) => {
    // The slot carries the dock's chrome — a rule line and a strip of
    // ivory — because the controls themselves are transparent. Reported
    // from a saved recipe as a bare band above the sub-tabs where the
    // brew row belonged: the slot drawn, the panel not in it.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);

    // Fold the Brewing section: the explorer unmounts and the slot is
    // left with nothing to hold.
    await page.getByRole("button", { name: /Brewing/i }).first().click();
    await page.waitForTimeout(600);

    const slot = await page.evaluate(() => {
      const el = document.getElementById("brew-dock-blend-detail");
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        children: el.childElementCount,
        height: Math.round(el.getBoundingClientRect().height),
        borderTop: cs.borderTopWidth,
      };
    });
    expect(slot, "the detail screen should still render its slot").not.toBeNull();
    expect(slot!.children, "nothing should be portalled in").toBe(0);
    expect(slot!.height, "an empty slot must take no space").toBeLessThanOrEqual(1);
    expect(parseFloat(slot!.borderTop), "and draw no rule line").toBe(0);
  });
});

test.describe("the steep controls are a dock", () => {
  test("pause, reset and done sit in one bottom menu", async ({ page }) => {
    // They were a pill, a pill and a filled slab floating in the scroll
    // flow. Now one menu pinned to the bottom, in the same language as
    // the brew row and the tab dock: equal cells, hairline dividers,
    // square, transparent.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await brewFromDetail(page);

    const done = page.getByTestId("steep-done");
    await expect(done, "the steep screen should be up").toBeVisible({ timeout: 30_000 });

    const shape = await page.evaluate(() => {
      const cells = ["steep-pause", "steep-reset", "steep-done"]
        .map(id => document.querySelector(`[data-testid="${id}"]`))
        .filter(Boolean) as HTMLElement[];
      const bar = cells[0]?.parentElement;
      const cs = bar ? getComputedStyle(bar) : null;
      return {
        cells: cells.length,
        radii: cells.map(c => getComputedStyle(c).borderRadius),
        // Same row, so same top edge.
        tops: cells.map(c => Math.round(c.getBoundingClientRect().top)),
        sticky: cs?.position,
        translucent: cs?.backgroundColor ?? "",
      };
    });

    expect(shape.cells, "pause, reset and done should all be present while steeping").toBe(3);
    expect(new Set(shape.tops).size, "they should share one row").toBe(1);
    expect(shape.radii.every(r => r === "0px"), `square cells, got ${shape.radii}`).toBe(true);
    expect(shape.sticky, "the menu should stay at the bottom rather than scroll away")
      .toBe("sticky");
    // rgba with an alpha below 1 — the page reads through it, like the
    // brew row and the tab dock.
    expect(shape.translucent, `expected a translucent surface, got ${shape.translucent}`)
      .toMatch(/rgba\(.*0\.\d+\)/);
  });
});

test.describe("the recommended word puts you in it", () => {
  test("tapping it moves that slider, and only that slider", async ({ page }) => {
    // The word was a caption that opened prose. Once it was flanked to
    // read as a control, the obvious next question was why tapping the
    // thing labelled RECOMMENDED didn't take you there — reported as
    // "when I hit recommended it's still showing tooltip, not placing
    // on recommended spot." The explanation panel is gone entirely:
    // one tap, one thing, and the thing is the one the word names.
    //
    // The second half of the assertion is the load-bearing one. The two
    // sliders are coupled, so a tap that helpfully fixed both would
    // silently throw away a steep time you'd already dialled in.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);

    // Note the steep time before touching temperature at all.
    await page.getByTestId("brew-axis-timeS").click();
    const timeSlider = page.getByLabel("Steep time");
    await expect(timeSlider).toBeVisible();
    const timeBefore = await timeSlider.inputValue();

    // Park the temperature at the cold end, well outside any band.
    await page.getByTestId("brew-axis-tempC").click();
    const tempSlider = page.getByLabel("Water temperature");
    await expect(tempSlider).toBeVisible();
    const coldest = await tempSlider.getAttribute("min");
    await tempSlider.fill(coldest!);

    const word = page.getByTestId("range-word");
    await expect(word, "a single leaf still has a recommendation").toBeVisible();
    await word.click();

    expect(await tempSlider.inputValue(),
      "tapping the recommendation should move the temperature off the cold end")
      .not.toBe(coldest);

    // And nothing else happened: no panel opened under the slider.
    const placed = await tempSlider.inputValue();
    await expect(page.getByText(/Sweet spot|Compromise zone/),
      "the explanation panel should be gone, not merely quiet").toHaveCount(0);

    // Tapping it again is idempotent — same tap, same answer, so a
    // second press can't nudge the brew somewhere new.
    await word.click();
    expect(await tempSlider.inputValue(), "a second tap should land on the same spot")
      .toBe(placed);

    await page.getByTestId("brew-axis-timeS").click();
    expect(await page.getByLabel("Steep time").inputValue(),
      "the temperature's recommendation must not rewrite the steep")
      .toBe(timeBefore);
  });
});

test.describe("the steep slider reaches past the recommendation", () => {
  test("a stretched cup is draggable, not just describable", async ({ page }) => {
    /* The card's timeS is what we RECOMMEND; the profile is measured
       past it, and those over-pull rows are what the warnings read. The
       slider used to stop at the recommendation, so the rows describing
       a stretched cup were unreachable by the person stretching it.

       The rule itself is covered in tests/brew-reach.test.mjs, where it
       can be checked against all 52 profiles. What that test cannot say
       is whether a finger can get there — the bound could be computed
       correctly and never reach the input. So this asserts the one
       thing only a browser can: the control the user drags actually
       carries the wider maximum.

       Lavender: recommended to 240s, measured to 360s. The number below
       is deliberately well under its new bound and well over its old
       one, so it survives a change to the padding constants and still
       fails if the reach is dropped. */
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("lavender");
    await page.getByRole("button", { name: /lavender/i }).first().click();

    const row = page.locator('[data-tour="blend-controls"]').first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();

    await page.getByTestId("brew-axis-timeS").click();
    const timeSlider = page.getByLabel("Steep time");
    await expect(timeSlider).toBeVisible();

    const max = Number(await timeSlider.getAttribute("max"));
    expect(max, `the steep slider stopped at ${max}s`).toBeGreaterThan(300);

    // And it is genuinely landable, not just a larger attribute.
    await timeSlider.fill(String(max));
    await expect(timeSlider).toHaveValue(String(max));
  });
});

test.describe("the folded brew row is a readout and a chevron", () => {
  test("no instruction words, and the reading sits with the arrow", async ({ page }) => {
    /* ADJUST and MINIMIZE used to occupy a slot here. They were added
       because a folded row was quiet — a temperature readout that
       happened to be a button — and they said the same thing the
       chevron says, permanently, to a reader who learned it on their
       first cup.

       Removing them is a decision to trust the chevron, so this test
       enforces the decision rather than mourning it: the words must
       stay gone, and the two things left must read as one control at
       one end of the row instead of two ends of an empty gap. */
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    const row = page.locator('[data-tour="blend-controls"]').first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    if ((await row.getAttribute("aria-expanded")) === "true") await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "false");

    await expect(page.getByTestId("brew-adjust-hint"),
      "the folded row should carry no instruction word").toHaveCount(0);
    await expect(page.getByTestId("brew-minimize-hint"),
      "and neither should the open one").toHaveCount(0);

    // The reading is still there — that's the half of the row that was
    // never in question, and the reason a bare chevron is enough.
    const reading = row.locator("span").filter({ hasText: /·/ }).first();
    await expect(reading).toBeVisible();

    /* CENTRED ON THE WHOLE BAR, not on what the Brew corner left over.
       Brew is absolutely positioned so the toggle spans the full width,
       which is what makes this row and the writing dock the same shape.
       If Brew ever goes back to being a flex sibling the reading slides
       right by half its width and this fails — which is the point. */
    const rowBox = (await row.boundingBox())!;
    const readBox = (await reading.boundingBox())!;
    const rowMid = rowBox.x + rowBox.width / 2;
    const readMid = readBox.x + readBox.width / 2;
    expect(Math.abs(readMid - rowMid),
      `the reading centred at ${Math.round(readMid)} against a row centre of ` +
      `${Math.round(rowMid)} — it should centre on the bar, not beside Brew`)
      .toBeLessThan(rowBox.width * 0.06);

    // And it still does the one thing it's for.
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "false");
  });
});

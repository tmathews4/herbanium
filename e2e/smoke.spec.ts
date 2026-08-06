// e2e/smoke.spec.ts — core functionality on every page.
//
// Deliberately shallow and wide: one meaningful interaction per screen,
// no edge cases. The job is to catch a screen that renders but doesn't
// WORK — a filter that no longer filters, a search that returns
// nothing, a tab whose content never mounts.
//
// The whole suite runs twice: once normally, and once with a brew
// minimized. That second pass is the interesting one. A minimized
// steep leaves a modal overlay open underneath the entire app, so it's
// the state where a stray pointer-events or z-index change would break
// everything at once while every screen still LOOKS fine.
import { test, expect, type Page } from "@playwright/test";
import { brewFromDetail, detailBrewControl } from "./helpers/brew";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

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

// Start a brew and collapse it to the banner, so the rest of the app
// is exercised with an overlay live underneath.
async function brewAndMinimize(page: Page) {
  await openTab(page, "Journal");
  await page.locator('[data-tour="recipes-row"]').first().click();
  await brewFromDetail(page);
  await page.getByRole("button", { name: /minimize/i }).click();
  await expect(page.getByTestId("brew-banner")).toBeVisible();
}

for (const withBrew of [false, true]) {
  const suffix = withBrew ? " (brew minimized)" : "";

  test.describe(`core functionality${suffix}`, () => {
    test.beforeEach(async ({ page }) => {
      await boot(page);
      if (withBrew) await brewAndMinimize(page);
    });

    test.afterEach(async ({ page }) => {
      // Whatever the screen did, the brew must still be alive — as the
      // banner, or as the steep screen itself.
      //
      // Both forms are accepted because opening another overlay (a
      // recipe detail, an ingredient) replaces `overlay`, and the
      // banner only renders while `overlay === "steep"`. So the running
      // brew goes invisible for as long as that detail is open. It
      // isn't lost — the session survives and the banner returns when
      // the overlay stack pops back — but there IS a window where a
      // user has tea steeping and no indication of it anywhere.
      // Flagged rather than papered over; if that gets fixed, tighten
      // this back to the banner alone.
      if (!withBrew) return;
      // This caught two real bugs. The popstate handler cleared the
      // session unconditionally, so system-back out of any overlay
      // binned a steeping cup. And the recipe detail a brew was started
      // FROM stayed on the overlay stack underneath the steep, so
      // closing a later detail popped back to that stale recipe instead
      // of the running brew — the session survived, but nothing on
      // screen pointed at it, which a user can't tell apart from having
      // lost it. Every screen is held to the same promise now.
      const alive = page.getByTestId("brew-banner")
        .or(page.getByRole("button", { name: /minimize/i }));
      await expect(alive, "the brew should still be running somewhere").toBeVisible();
    });

    test("Home — the three actions navigate", async ({ page }) => {
      await openTab(page, "Home");
      await page.locator('[data-tour="home-experiment"]').click();
      await expect(page.locator('[data-tour="blend-search"]'),
        "Experiment should land in the blend composer").toBeVisible();

      await openTab(page, "Home");
      await page.locator('[data-tour="home-herbanium"]').click();
      await expect(page.locator('[data-tour="herb-search"]'),
        "Herbanium should land in the compendium").toBeVisible();
    });

    test("Blend — adding an ingredient builds a pot", async ({ page }) => {
      await openTab(page, "Apothecary");
      const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
      await search.fill("chamomile");
      const hit = page.getByRole("button", { name: /chamomile/i }).first();
      await expect(hit, "search should surface a match").toBeVisible();
      await hit.click();
      await expect(page.locator('[data-tour="blend-quantity"]'),
        "adding an ingredient should produce a parts row").toBeVisible();
      await expect(page.locator('[data-tour="blend-graph"]'),
        "and a live prediction").toBeVisible();
    });

    test("Blend — the ingredient picker stays small without going useless", async ({ page }) => {
      // The results list was halved (180px -> 90px) because the selector
      // card was eating 56% of the pane on a Pixel 9 — most of the first
      // screen spent on the thing you fill the pot WITH rather than on
      // the pot. Halving it is only worth anything if the list is still
      // browsable, so both halves of that trade get asserted.
      //
      // Counts, not pixels. The maxHeight is a fixed 90px on every
      // engine, so a pixel assertion would only ever restate the
      // constant; what actually varies is how many chips FIT in it, and
      // WebKit renders this text taller. The floor is deliberately low
      // (2 rows) because iPhone is CI-only and can't be checked from
      // here — the real numbers are logged so the CI output says what
      // Safari actually gets.
      await openTab(page, "Apothecary");
      const results = page.getByTestId("ingredient-results");
      await expect(results, "the picker should be on screen").toBeVisible();

      const shape = await results.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const chips = [...el.querySelectorAll("button")];
        const tops = [...new Set(chips.map(c =>
          Math.round(c.getBoundingClientRect().top - box.top)))].sort((a, b) => a - b);
        return {
          scrollable: el.scrollHeight > el.clientHeight + 1,
          total: chips.length,
          reachable: chips.filter(c =>
            c.getBoundingClientRect().top - box.top < box.height).length,
          rows: tops.filter(t => t < box.height).length,
          height: Math.round(box.height),
        };
      });

      // eslint-disable-next-line no-console
      console.log(`  [${test.info().project.name}] picker ${shape.height}px: `
        + `${shape.rows} rows, ${shape.reachable} of ${shape.total} ingredients reachable without scrolling`);

      expect(shape.scrollable,
        `a ${shape.height}px window over ${shape.total} ingredients should scroll`).toBe(true);
      expect(shape.rows,
        `the picker should still open on more than one row (got ${shape.rows})`)
        .toBeGreaterThanOrEqual(2);
      expect(shape.reachable,
        `enough ingredients should be reachable without scrolling (got ${shape.reachable})`)
        .toBeGreaterThanOrEqual(4);

      // Still functional at the smaller size — the point of shrinking it
      // is that it costs nothing, so prove the picker still picks.
      await results.getByRole("button").first().click();
      await expect(page.locator('[data-tour="blend-controls"]'),
        "picking from the shrunk list should still build a pot").toBeVisible();
    });

    test("Blend — a composed pot offers a brew", async ({ page }) => {
      // Deliberately not asserting on the slider value: the range's
      // bounds come from the blend's own extraction window and the
      // component re-syncs to the profile, so poking it is an edge case
      // rather than a smoke check. The tour spec covers the bars-and-
      // sliders relationship properly.
      await openTab(page, "Apothecary");
      const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
      await search.fill("chamomile");
      await page.getByRole("button", { name: /chamomile/i }).first().click();
      // The brew controls are a row in the tab dock, above Blend /
      // Herbanium, and they arrive OPEN. That's the deliberate part: a
      // first-time user who never taps the row never learns the cup is
      // adjustable, so the sliders are on screen from the start.
      const controls = page.locator('[data-tour="blend-controls"]');
      const sliders = page.locator('[data-tour="blend-sliders"]');
      await expect(controls, "a pot should expose the brew row").toBeVisible();
      await expect(sliders, "and it should arrive open, not hidden behind a tap")
        .toBeVisible();
      // The chevron is what says the row folds — open it points down
      // (close), shut it points up (expand). Asserted as a rotation
      // matrix because that's what getComputedStyle resolves a transform
      // to: rotate(180deg) is (-1,0,0,-1).
      const chevron = controls.locator("svg");
      await expect(chevron, "open, the arrow points down")
        .toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

      // How much of the page the controls cost. They live in the dock,
      // which is a flex sibling of the scroll pane rather than an
      // overlay, so every pixel they take comes straight off the pane —
      // that's the whole reason the block is condensed, and why opening
      // by default was only affordable once it was. Measured as a ratio,
      // not a pixel budget: WebKit renders this text ~35% taller than
      // Chromium and a hardcoded height would only ever describe
      // whichever engine happened to be measured.
      const paneHeight = () => page.evaluate(() => {
        const pane = [...document.querySelectorAll("*")].find(n => {
          const s = getComputedStyle(n as HTMLElement);
          return (s.overflowY === "auto" || s.overflowY === "scroll")
            && (n as HTMLElement).scrollHeight > (n as HTMLElement).clientHeight;
        });
        return pane ? pane.getBoundingClientRect().height : 0;
      });
      const openPane = await paneHeight();
      expect(openPane, "the page should be scrolling to begin with").toBeGreaterThan(0);

      // Folding it away has to work and has to give the page back.
      await controls.click();
      await expect(sliders, "tapping the row should fold the controls away").toBeHidden();
      // M:SS, not "4 min". Folded, this row is the ONLY readout, and a
      // minute-rounded one would report 3:47 as "4 min" — undoing the
      // second-level step as soon as anyone used it.
      await expect(controls, "shut, it still reads the brew — to the second")
        .toContainText(/\d+\s*°[CF].*\d+:\d{2}/s);
      await expect(chevron, "and the arrow flips to point up")
        .toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");

      const shutPane = await paneHeight();
      expect(openPane / shutPane,
        `open controls should leave most of the page (${Math.round(openPane)}px of ${Math.round(shutPane)}px)`)
        .toBeGreaterThan(0.6);

      await controls.click();
      await expect(sliders, "and tapping again brings them back").toBeVisible();

      // One slider at a time, swapped by the pills — which is what buys
      // the width back. The point of the whole arrangement is that the
      // slider on screen spans the full row, so assert that rather than
      // just that the pills toggle something.
      //
      // It opens on TIME: its own step rule against temperature's, so
      // a first drag moves the prediction bars as a gradient instead of
      // in six jumps. Asserted, not assumed — "which slider you meet
      // first" is a deliberate choice and silently flipping it would
      // undo it.
      const slider = page.locator('[data-tour="blend-sliders"] input[type=range]');
      await expect(slider, "exactly one slider should be on screen").toHaveCount(1);
      await expect(page.getByTestId("brew-axis-timeS"),
        "a fresh pot should open on Time").toHaveAttribute("aria-pressed", "true");
      const timeWidth = (await slider.boundingBox())!.width;
      const timeMax = await slider.getAttribute("max");

      // Time's step is chosen from its RANGE, not fixed: 5s on an
      // ordinary blend, 1s on windows short enough that seconds are the
      // whole resolution (matcha is 15-39s — five positions at 5s).
      // Asserted as "one of the two" rather than a literal, so the rule
      // can be re-tuned in brewBounds without a test that only ever
      // restated the constant back to itself.
      //
      // TEMPERATURE IS CONTINUOUS NOW, and this comment used to argue
      // the opposite: 5°C notches because it's a value you have to
      // REPRODUCE at a kettle with no thermostat, and because the
      // rest-time advice was "only sayable against round numbers".
      //
      // The second half was simply wrong — restHintForCelsius bands on
      // `>=`, so 97°C answers "about 20 seconds off the boil" exactly
      // as 95°C does. There were never gaps to avoid.
      //
      // The first half is true and is the reason the notches were
      // right for a long time, but it argues for imprecision in the
      // INSTRUCTION, not in the control. Cinnamon settled it: its
      // recommended window is 95-100°C, which at a 5°C step contained
      // exactly two reachable values — a sweet spot with no interior,
      // reported as "you can only move to the beginning and end, so it
      // feels pointless". The hint carries the vagueness a kettle
      // imposes; the slider doesn't have to.
      const timeStep = await slider.getAttribute("step");
      expect(["1", "5"], `time step should be range-appropriate, got ${timeStep}`)
        .toContain(timeStep);

      await page.getByTestId("brew-axis-tempC").click();
      await expect(slider, "still exactly one after swapping").toHaveCount(1);
      await expect(slider, "temperature should be continuous, not notched")
        .toHaveAttribute("step", "1");
      expect(await slider.getAttribute("max"),
        "the pills should swap which axis is bound").not.toBe(timeMax);
      expect((await slider.boundingBox())!.width,
        "and the temp slider should get the same full width time had")
        .toBeCloseTo(timeWidth, 0);

      await expect(page.locator('[data-tour="blend-brew"]'),
        "and a way to brew or save it").toBeVisible();
    });

    // Both detail screens paint over the tab bar, so their brew controls
    // can't live in the tab dock — each provides its own. These two
    // tests exist because the bug they guard was invisible to every
    // check we had: the controls WERE in the DOM, WERE `visible` to
    // Playwright, and were painted under a full-screen overlay where no
    // user could touch them. So the assertion is hit-testing, not
    // visibility. `toBeVisible` would have passed throughout the two
    // commits the recipe page was unusable.
    const assertReachable = async (page: Page, what: string) => {
      const hit = await page.locator('[data-tour="blend-controls"]').evaluate((el) => {
        const r = el.getBoundingClientRect();
        if (r.height === 0) return "zero height";
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!top) return "nothing at that point";
        return el.contains(top) || el === top
          ? "reachable"
          : `covered by <${top.tagName}${top.id ? "#" + top.id : ""}>`;
      });
      expect(hit, `${what}: the brew row must be touchable, not just present`).toBe("reachable");
    };

    test("Recipes — a pre-made recipe's brew is adjustable, not read-only", async ({ page }) => {
      await openTab(page, "Journal");
      await openSubTab(page, "Recipes");
      await page.locator('[data-tour="recipes-row"]').first().click();

      const controls = page.locator('[data-tour="blend-controls"]');
      await expect(controls, "a recipe should offer the brew row").toBeVisible();
      await assertReachable(page, "recipe detail");

      // Same control as the compose screen, not a second design: the
      // axis pills swap which slider is bound, one at a time.
      const slider = page.locator('[data-tour="blend-sliders"] input[type=range]');
      await expect(slider, "exactly one slider, as everywhere else").toHaveCount(1);
      const timeMax = await slider.getAttribute("max");
      await page.getByTestId("brew-axis-tempC").click();
      expect(await slider.getAttribute("max"),
        "the pills should swap the bound axis here too").not.toBe(timeMax);
      // Continuous here too — see the note on the compose screen's
      // slider above for why the notches went.
      await expect(slider, "and temperature is continuous here too")
        .toHaveAttribute("step", "1");

      // And it folds, same as the dock version.
      await controls.click();
      await expect(page.locator('[data-tour="blend-sliders"]'),
        "the row should fold on a recipe too").toBeHidden();
      await expect(controls, "and still read the brew while folded")
        .toContainText(/\d+\s*°[CF].*\d+:\d{2}/s);

      // Back out before the test ends. A detail overlay replaces
      // `overlay`, and the brew banner only renders while that's the
      // steep — so leaving one open trips the afterEach that guards a
      // running brew. Same reason the recipe-detail smoke test does it.
      await page.getByRole("button", { name: "← back", exact: true }).click();
    });

    test("Herbanium — an ingredient's brew is adjustable too", async ({ page }) => {
      await openTab(page, "Apothecary");
      await openSubTab(page, "Herbanium");
      // Chamomile rather than whatever sorts first: the explorer only
      // renders for ingredients that HAVE an extraction profile, so the
      // test needs one it knows does.
      await page.getByRole("button", { name: /Chamomile/i }).first().click();
      // The explorer only mounts on the Brewing tab, which is also the
      // only tab whose dock takes chrome.
      await page.getByRole("button", { name: "Brewing", exact: true }).click();

      const controls = page.locator('[data-tour="blend-controls"]');
      await expect(controls, "an ingredient should offer the brew row").toBeVisible();
      await assertReachable(page, "ingredient detail");
      await expect(page.locator('[data-tour="blend-sliders"] input[type=range]'),
        "one slider here as well").toHaveCount(1);

      await page.getByRole("button", { name: "← back", exact: true }).click();
    });

    test("Brewing — Brew is in the dock, Save is on the steep screen", async ({ page }) => {
      // The two actions used to sit together at the foot of the compose
      // page, which meant scrolling past every graph to commit the cup
      // you'd just dialled in. Brew moved into the brew panel, under the
      // slider; Save moved to the steep screen, where you've already
      // committed. Neither is on the page any more.
      await openTab(page, "Apothecary");
      const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
      await search.fill("chamomile");
      await page.getByRole("button", { name: /chamomile/i }).first().click();

      const brew = page.locator('[data-tour="blend-brew"]');
      await expect(brew, "Brew should live in the brew panel").toBeVisible();
      const dockHoldsBrew = await brew.evaluate((el) => {
        const bar = document.getElementById("brew-dock")?.parentElement;
        return !!bar && bar.contains(el);
      });
      expect(dockHoldsBrew, "and it should be inside the dock, not on the page").toBe(true);

      // And it SURVIVES folding — that's the whole reason it sits in the
      // row's header rather than under the slider. Committing the cup
      // shouldn't require unfolding anything.
      await page.locator('[data-tour="blend-controls"]').click();
      await expect(page.locator('[data-tour="blend-sliders"]'),
        "folding should put the sliders away").toBeHidden();
      await expect(brew, "but Brew should stay reachable while folded").toBeVisible();
    });

    test("Brewing — Save is disabled for a recipe that's already saved", async ({ page }) => {
      // Not in the minimized-brew pass: that variant starts with a steep
      // already collapsed to the top row, so the steep screen renders
      // display:none and there's nothing to look at. The claim is about
      // the button's state, which doesn't vary with that setup.
      test.skip(withBrew, "steep screen is collapsed in the minimized-brew pass");
      // Arriving from a saved recipe, there's nothing to save. Shown
      // disabled rather than hidden, so the answer to "can I keep this?"
      // is on screen either way — a missing button reads as a missing
      // feature.
      await openTab(page, "Journal");
      await openSubTab(page, "Recipes");
      await page.locator('[data-tour="recipes-row"]').first().click();
      await brewFromDetail(page);

      const save = page.getByTestId("steep-save");
      await expect(save, "the steep screen should offer Save").toBeVisible();
      await expect(save, "a curated recipe is already saved").toBeDisabled();
      await expect(save).toHaveText(/saved/i);
    });

    test("Brewing — the blend can be renamed from the timer", async ({ page }) => {
      // With the save-or-brew prompt gone, nothing asks what to call a
      // composed blend — it would save as "Untitled blend" and be
      // unfindable. Naming moved to the timer, where the cup is already
      // going and nothing is blocking on the answer.
      test.skip(withBrew, "steep screen is collapsed in the minimized-brew pass");
      await openTab(page, "Journal");
      await openSubTab(page, "Recipes");
      await page.locator('[data-tour="recipes-row"]').first().click();
      await brewFromDetail(page);

      await page.getByTestId("steep-rename").click();
      const input = page.getByTestId("steep-name-input");
      await expect(input, "renaming should open an inline field").toBeVisible();
      await input.fill("Evening cup");
      await input.press("Enter");

      await expect(page.getByText("Evening cup"),
        "the new name should show on the timer").toBeVisible();
      await expect(page.getByTestId("steep-name-input"),
        "and the field should close").toHaveCount(0);
    });

    test("Herbanium — search and filters narrow the list", async ({ page }) => {
      await openTab(page, "Apothecary");
      await openSubTab(page, "Herbanium");
      // Only the first row carries the tour anchor, so filtering is
      // checked by what's on screen rather than by a row count: one
      // known match stays, one known non-match goes.
      const ashwagandha = page.getByRole("button", { name: /Ashwagandha/i });
      await expect(ashwagandha, "the compendium should list ingredients").toBeVisible();

      const search = page.locator('[data-tour="herb-search"]').getByRole("textbox").first();
      await search.fill("mint");
      await expect(page.getByRole("button", { name: /mint/i }).first(),
        "a match should survive the filter").toBeVisible();
      await expect(ashwagandha, "a non-match should be filtered out").toBeHidden();
    });

    test("Recipes — a recipe opens its detail", async ({ page }) => {
      await openTab(page, "Journal");
      await openSubTab(page, "Recipes");
      await page.locator('[data-tour="recipes-row"]').first().click();
      await expect(detailBrewControl(page),
        "a recipe should open somewhere you can brew from").toBeVisible();
      await page.getByRole("button", { name: "← back", exact: true }).click();
      await expect(page.locator('[data-tour="recipes-filter"]'),
        "back should return to the list").toBeVisible();
    });

    test("Reflections — the composer takes an entry", async ({ page }) => {
      await openTab(page, "Journal");
      await openSubTab(page, "Reflections");
      // The composer opens with a kind picker (free-form / haiku /
      // limerick / poem) rather than a bare textarea, so the core
      // interaction to smoke is that the picker opens.
      const composer = page.locator('[data-tour="reflections-write"]');
      await expect(composer).toBeVisible();
      const picker = composer.getByRole("button").first();
      await expect(picker).toHaveAttribute("aria-expanded", "false");
      await picker.click();
      await expect(picker, "the entry-kind picker should open").toHaveAttribute("aria-expanded", "true");
    });

    test("Field Notes — the lodestone is there and expands", async ({ page }) => {
      await openTab(page, "Journal");
      await openSubTab(page, "Field Notes");
      const stone = page.locator('[data-tour="fieldnotes-lodestone"]');
      await expect(stone).toBeVisible();
      await page.locator('[data-tour="lodestone-details"]').click();
      await expect(page.locator('[data-tour="lodestone-lock"]'),
        "details should expose the lock control").toBeVisible();
    });

    test("Profile — settings render and respond", async ({ page }) => {
      await openTab(page, "Profile");
      await expect(page.getByRole("button", { name: /replay tour/i })).toBeVisible();
      // The dev charge control is a real state change with visible effect.
      await page.getByRole("button", { name: "full", exact: true }).click();
      await openTab(page, "Journal");
      await openSubTab(page, "Field Notes");
      await expect(page.locator('[data-tour="fieldnotes-lodestone"]')).toBeVisible();
    });
  });
}

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
  await page.getByRole("button", { name: /Brew this cup/i }).click();
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
      await openTab(page, "Apothecarium");
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

    test("Blend — a composed pot offers a brew", async ({ page }) => {
      // Deliberately not asserting on the slider value: the range's
      // bounds come from the blend's own extraction window and the
      // component re-syncs to the profile, so poking it is an edge case
      // rather than a smoke check. The tour spec covers the bars-and-
      // sliders relationship properly.
      await openTab(page, "Apothecarium");
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
      await expect(controls, "shut, it still reads the brew")
        .toContainText(/\d+\s*°[CF].*\d+\s*min/s);
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
      // It opens on TIME: 36 steps against temperature's 6, so a first
      // drag moves the prediction bars as a gradient instead of in six
      // jumps. Asserted, not assumed — "which slider you meet first" is
      // a deliberate choice and silently flipping it would undo it.
      const slider = page.locator('[data-tour="blend-sliders"] input[type=range]');
      await expect(slider, "exactly one slider should be on screen").toHaveCount(1);
      await expect(page.getByTestId("brew-axis-timeS"),
        "a fresh pot should open on Time").toHaveAttribute("aria-pressed", "true");
      const timeWidth = (await slider.boundingBox())!.width;
      const timeMax = await slider.getAttribute("max");

      await page.getByTestId("brew-axis-tempC").click();
      await expect(slider, "still exactly one after swapping").toHaveCount(1);
      expect(await slider.getAttribute("max"),
        "the pills should swap which axis is bound").not.toBe(timeMax);
      expect((await slider.boundingBox())!.width,
        "and the temp slider should get the same full width time had")
        .toBeCloseTo(timeWidth, 0);

      await expect(page.locator('[data-tour="blend-brew"]'),
        "and a way to brew or save it").toBeVisible();
    });

    test("Herbanium — search and filters narrow the list", async ({ page }) => {
      await openTab(page, "Apothecarium");
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
      await expect(page.getByRole("button", { name: /Brew this cup/i }),
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

// e2e/brew-dock-reachable.spec.ts — the brew dock is not behind the menu.
//
// REPORTED: "ingredient page -> brewing, the brew tab is hiding behind
// the main menu."
//
// WHY NOTHING CAUGHT IT. e2e/brew-everywhere.spec.ts already walks to
// every brew window and asserts the panel and its Brew button are
// visible — and `toBeVisible` is not the question being asked here. It
// checks the DOM: mounted, non-empty box, no display:none, no
// visibility:hidden, no zero opacity. An element covered by an opaque
// bar on top of it satisfies every one of those. So does one positioned
// past the bottom of the viewport. "Visible" in Playwright means
// "rendered", not "the user can see it", and the gap between those two
// is exactly the shape of this bug.
//
// The main menu sits at z-index 40, ABOVE the detail overlays at 30.
// That ordering is deliberate — the menu must never disappear — and it
// means the menu wins every collision. Anything that strays under it is
// not dimmed or half-covered; it is simply gone, while still reporting
// itself visible.
//
// So this spec asks the two questions that catch it:
//
//   1. GEOMETRY — the dock's rect must not intersect the menu's rect,
//      and must sit inside the viewport. Overlap is the failure being
//      reported, and naming both rects makes the failure legible
//      instead of "something wasn't clickable".
//   2. HIT TESTING — document.elementFromPoint at seven points across
//      each control must land on that control or inside it. This is the
//      one that survives a layout change: it doesn't care WHAT is on
//      top, only that something is.
//
// Both, not either. Hit testing alone would pass a dock pushed just
// below the fold on a short viewport (nothing covers it — there is
// nothing there at all), and the geometry check alone would pass a
// modal, a tour scrim or a sticky header lying over the panel.
//
// Run across the full device matrix on purpose. This is a layout bug,
// and the layout is what differs between a Pixel, an iPhone SE and a
// folded Galaxy.
import { test, expect, type Page, type Locator } from "@playwright/test";
import { BREW_WINDOWS, bootApp, walkToIngredient } from "./helpers/brew";

// Opening a detail overlay pulls a lazy-loaded screen chunk and then
// waits for the explorer to mount and portal itself. Under four workers
// that outruns the config's 30s budget.
test.beforeEach(() => test.slow());

type Obstruction = {
  point: string;
  by: string;
  at: { x: number; y: number };
};

/**
 * Every point on `locator` that something else answers for.
 *
 * Sampled at fractions rather than at corners: a rounded corner
 * legitimately belongs to the parent, and a bar covering only the
 * bottom edge of a control is a real failure that a centre-only probe
 * would miss. The vertical extremes (10% and 90%) are the ones that
 * catch a dock sliding under the menu, since it goes under bottom-first.
 */
async function obstructionsOf(locator: Locator, dockId: string): Promise<{
  rect: { x: number; y: number; w: number; h: number; top: number; bottom: number };
  viewport: { w: number; h: number };
  blocked: Obstruction[];
}> {
  return locator.evaluate((el, id) => {
    const r = el.getBoundingClientRect();
    /* WITHIN THE DOCK, OVERLAP IS THE DESIGN. The corner Brew is
       absolutely positioned across the toggle row on purpose, so that
       the row's readout can centre on the whole bar rather than on
       what Brew leaves over — e2e/brew-everywhere.spec.ts asserts
       exactly that. A first version of this check sampled the toggle
       row, found Brew sitting on its left, and reported the app
       broken.

       The bug being guarded is a control lost to a DIFFERENT layer:
       the menu, a modal, a scrim. So the dock's own subtree is the
       boundary — anything inside it may overlap anything else inside
       it, and anything from outside it may not. */
    const dock = document.getElementById(id);
    const describe = (n: Element | null): string => {
      if (!n) return "nothing (outside the viewport)";
      const id = n.getAttribute("data-testid") || n.getAttribute("data-tour") || n.id;
      const text = (n.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `<${n.tagName.toLowerCase()}${id ? ` "${id}"` : ""}>${text ? ` — "${text}"` : ""}`;
    };
    const points: Array<[string, number, number]> = [
      ["centre", 0.5, 0.5],
      ["top edge", 0.5, 0.1],
      ["bottom edge", 0.5, 0.9],
      ["left", 0.15, 0.5],
      ["right", 0.85, 0.5],
      ["lower left", 0.25, 0.85],
      ["lower right", 0.75, 0.85],
    ];
    const blocked: Obstruction[] = [];
    for (const [point, fx, fy] of points) {
      const x = r.x + r.width * fx;
      const y = r.y + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      // A descendant answering is the normal case; an ancestor is
      // padding, not a cover; a sibling inside the same dock is a
      // deliberate overlap. Anything else is a different layer.
      const ownLayer = hit && (
        el.contains(hit) || hit.contains(el) ||
        (dock ? dock.contains(hit) || hit.contains(dock) : false)
      );
      if (ownLayer) continue;
      blocked.push({ point, by: describe(hit), at: { x: Math.round(x), y: Math.round(y) } });
    }
    return {
      rect: {
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        top: Math.round(r.top), bottom: Math.round(r.bottom),
      },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      blocked,
    };
  }, dockId);
}

/** Asserts a control is on screen and that no OTHER layer is on top of it. */
async function expectReachable(locator: Locator, dockId: string, what: string) {
  await expect(locator, `${what} should be rendered`).toBeVisible();
  const { rect, viewport, blocked } = await obstructionsOf(locator, dockId);

  expect(rect.h, `${what} has no height`).toBeGreaterThan(0);
  expect(
    rect.bottom,
    `${what} runs to y=${rect.bottom} on a ${viewport.h}px-tall viewport — ` +
    `its bottom ${rect.bottom - viewport.h}px are off screen`,
  ).toBeLessThanOrEqual(viewport.h + 1);
  expect(rect.top, `${what} starts above the top of the viewport (y=${rect.top})`)
    .toBeGreaterThanOrEqual(-1);

  expect(
    blocked,
    `${what} is covered. Its box is ${rect.w}x${rect.h} at (${rect.x}, ${rect.y}); ` +
    `these points answer to something else: ` +
    blocked.map(b => `${b.point} (${b.at.x},${b.at.y}) → ${b.by}`).join("; "),
  ).toEqual([]);
}

/** The two rects must not touch — the menu is opaque and outranks everything. */
async function expectClearOfMenu(page: Page, dockId: string, what: string) {
  const overlap = await page.evaluate((id) => {
    const dock = document.getElementById(id);
    const menu = document.querySelector('[data-testid="main-menu"]');
    if (!dock || !menu) return { missing: !dock ? "dock" : "menu" };
    const d = dock.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    // The composer's controls live INSIDE the menu bar by design, so a
    // containment is not a collision. Only a partial overlap is.
    if (menu.contains(dock)) return { nested: true };
    const y = Math.min(d.bottom, m.bottom) - Math.max(d.top, m.top);
    const x = Math.min(d.right, m.right) - Math.max(d.left, m.left);
    return {
      overlapPx: Math.round(Math.min(y, x)),
      dock: { top: Math.round(d.top), bottom: Math.round(d.bottom) },
      menu: { top: Math.round(m.top), bottom: Math.round(m.bottom) },
    };
  }, dockId);

  expect(overlap.missing, `${what}: no ${overlap.missing} in the document`).toBeUndefined();
  if (overlap.nested) return; // the composer — its dock IS part of the bar
  expect(
    overlap.overlapPx!,
    `${what}: the brew dock (y ${overlap.dock!.top}–${overlap.dock!.bottom}) runs ` +
    `${overlap.overlapPx}px into the main menu (y ${overlap.menu!.top}–${overlap.menu!.bottom}). ` +
    `The menu is at z-40 and the dock's screen at z-30, so that overlap is hidden, not shared.`,
  ).toBeLessThanOrEqual(0);
}

for (const window of BREW_WINDOWS) {
  test.describe(`the brew dock on ${window.name}`, () => {
    test("sits clear of the main menu and takes a tap", async ({ page }) => {
      await bootApp(page);
      await window.walk(page);

      await expectClearOfMenu(page, window.dockId, window.name);

      // The row that folds the panel — the "brew toggle" itself. If this
      // is under the menu the panel cannot even be opened.
      await expectReachable(page.locator('[data-tour="blend-controls"]').first(),
        window.dockId, `${window.name}: the brew toggle`);
      // The corner that commits the cup.
      await expectReachable(page.locator('[data-tour="blend-brew"]').first(),
        window.dockId, `${window.name}: the Brew button`);
      // The open panel, which is the tallest the dock ever gets and so
      // the state most likely to run into the menu.
      await expectReachable(page.locator('[data-tour="blend-sliders"]').first(),
        window.dockId, `${window.name}: the open brew panel`);
    });

    test("the slider under the finger is the slider on screen", async ({ page }) => {
      // Reachable isn't the same as draggable. Playwright's trial click
      // runs the full actionability chain — visible, stable, and
      // RECEIVES EVENTS, which is a real hit test at the click point —
      // without firing the event. It is the closest thing to asking the
      // browser "would a tap land here?"
      await bootApp(page);
      await window.walk(page);

      for (const [axis, label] of [["timeS", "Steep time"], ["tempC", "Water temperature"]] as const) {
        await page.getByTestId(`brew-axis-${axis}`).click();
        const slider = page.getByLabel(label);
        await expectReachable(slider, window.dockId, `${window.name}: the ${label} slider`);
        await slider.click({ trial: true, timeout: 5_000 });
      }
    });

    test("folding and unfolding never puts it under the menu", async ({ page }) => {
      // The dock changes height as the panel folds, and the overlay
      // screens inset themselves against a MEASURED menu height. A
      // measurement that lags its layout shows up here and nowhere
      // else: at rest everything lines up, and it is the transition
      // that leaves the dock a row too low.
      await bootApp(page);
      await window.walk(page);

      const row = page.locator('[data-tour="blend-controls"]').first();
      for (let i = 0; i < 2; i++) {
        await row.click();
        await expect(row).toHaveAttribute("aria-expanded", "false");
        await expectClearOfMenu(page, window.dockId, `${window.name}, folded`);
        await expectReachable(row, window.dockId, `${window.name}: the folded brew toggle`);

        await row.click();
        await expect(row).toHaveAttribute("aria-expanded", "true");
        await expectClearOfMenu(page, window.dockId, `${window.name}, unfolded`);
        await expectReachable(page.locator('[data-tour="blend-sliders"]').first(),
          window.dockId, `${window.name}: the reopened brew panel`);
      }
    });
  });
}

test.describe("a short screen is where the dock runs out of room", () => {
  // The device matrix is ten portrait phones and tablets, and they all
  // have plenty of height. The states this misses are the ones a real
  // user gets into for free: a phone turned sideways, a desktop window
  // dragged short, a mobile browser whose address bar has just slid
  // back in and taken 60px with it.
  //
  // A sweep rather than one chosen height. The dock, the sub-tabs and
  // the menu are three stacked bars with a scroll region wedged between
  // them, and the height at which that arithmetic first goes wrong is
  // precisely what nobody knows in advance — picking a number would
  // only test the number.
  for (const height of [380, 430, 520, 640, 740]) {
    test(`the ingredient dock stays clear at ${height}px tall`, async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "setViewportSize fights WebKit's device emulation");
      await page.setViewportSize({ width: 412, height });
      await bootApp(page);
      await walkToIngredient(page);

      await expectClearOfMenu(page, "brew-dock-ingredient-detail",
        `an ingredient at ${412}x${height}`);
      await expectReachable(page.locator('[data-tour="blend-controls"]').first(),
        "brew-dock-ingredient-detail", `the brew toggle at ${412}x${height}`);
      await expectReachable(page.locator('[data-tour="blend-brew"]').first(),
        "brew-dock-ingredient-detail", `the Brew button at ${412}x${height}`);
    });
  }
});

test.describe("the menu outranks the dock, so the dock must stay out of it", () => {
  test("the stacking this all rests on is what the code says it is", async ({ page }) => {
    // Every assertion above is only worth making because of this
    // ordering. If the menu ever dropped below the overlays, an
    // overlap would stop being fatal — and these tests would keep
    // failing for a reason that no longer existed. State the premise
    // so it fails on its own terms if it changes.
    await bootApp(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();

    const z = await page.evaluate(() => {
      const menu = document.querySelector('[data-testid="main-menu"]');
      return menu ? getComputedStyle(menu).zIndex : null;
    });
    expect(Number(z), "the main menu should sit above the detail overlays (z-30)")
      .toBeGreaterThan(30);
  });
});

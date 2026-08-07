// e2e/collapse-animation.spec.ts — a menu that closes stays closed.
//
// REPORTED: collapsing the brew row flickered the full menu back into
// view at the end of the animation.
//
// The cause was a web-animation default. `el.animate()` uses
// `fill: "none"` unless told otherwise, so the closing run stopped
// applying its own values the moment it finished — handing the element
// its natural height back while React had not yet re-rendered to
// unmount it, because that unmount is a state update a frame behind.
//
// Nothing about this is visible to a normal assertion. Before and after
// the fix the row ends up closed, the sliders end up gone, and every
// existing spec passes either way. The bug lives entirely in the frames
// between, so the test has to look at the frames between: sample the
// panel's height on every rAF tick through the collapse and assert it
// never goes back up.
//
// Deliberately NOT reduced-motion — that path skips the animation
// entirely and would make this spec assert nothing.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.slow();

async function boot(page: Page) {
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

/** Height of the collapsing panel on every frame, until it unmounts. */
async function heightsDuring(page: Page, act: () => Promise<void>) {
  await page.evaluate(() => {
    (window as any).__frames = [];
    const tick = () => {
      const el = document.querySelector('[data-tour="blend-sliders"]')?.parentElement;
      (window as any).__frames.push(el ? Math.round(el.getBoundingClientRect().height) : -1);
      if ((window as any).__frames.length < 60) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await act();
  await page.waitForTimeout(1600);
  const raw: number[] = await page.evaluate(() => (window as any).__frames);
  return raw.filter((v) => v >= 0); // -1 means unmounted; stop caring there
}

test.describe("closing a dock doesn't flash it back open", () => {
  test("the brew row's height only ever goes down as it collapses", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();

    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    const row = page.locator('[data-tour="blend-controls"]').first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
    await expect(page.locator('[data-tour="blend-sliders"]')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(600); // let the opening animation settle

    const frames = await heightsDuring(page, () => row.click());
    const resting = frames[0];

    /* The panel must actually travel. Without this the spec would pass
       trivially if the animation were removed and the row just vanished
       — two frames, no rebound, nothing asserted. Requiring intermediate
       heights is what makes the check above mean something. */
    const midway = frames.filter((h) => h > 2 && h < resting - 2);
    expect(midway.length,
      `expected a visible collapse, got frames: ${frames.join(" ")}`).toBeGreaterThan(0);

    /* THE ACTUAL BUG. The rebound measured 91 against a resting 83 —
       taller than the row ever sits, because the borrowed border-box
       sizing re-admitted the padding the keyframes had collapsed. A
       couple of px of tolerance for sub-pixel rounding; 8px of rebound
       is the flicker. */
    const peak = Math.max(...frames.slice(3));
    expect(peak,
      `the panel grew back to ${peak}px after starting to collapse from ${resting}px — ` +
      `frames: ${frames.join(" ")}`).toBeLessThanOrEqual(resting + 2);
  });

  test("and it still opens back up to its full height", async ({ page }) => {
    // The other half: `fill: forwards` on the closing run must not leak
    // into the opening one, or the panel would open pinned to a stale
    // height and stop reflowing with its content.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();

    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    const row = page.locator('[data-tour="blend-controls"]').first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
    const sliders = page.locator('[data-tour="blend-sliders"]');
    await expect(sliders).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(600);
    const opened = (await sliders.boundingBox())?.height ?? 0;
    expect(opened).toBeGreaterThan(0);

    await row.click();
    await expect(sliders).toBeHidden({ timeout: 15_000 });
    await row.click();
    await expect(sliders).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(700);

    const reopened = (await sliders.boundingBox())?.height ?? 0;
    expect(Math.abs(reopened - opened),
      `reopened at ${reopened}px against ${opened}px first time`).toBeLessThanOrEqual(4);
  });
});

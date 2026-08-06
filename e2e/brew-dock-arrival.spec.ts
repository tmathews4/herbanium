// e2e/brew-dock-arrival.spec.ts — the brew controls arrive, they don't appear.
//
// Adding a first ingredient used to conjure a whole row of chrome under
// the page in a single frame, which the eye reads as the layout breaking
// rather than a control showing up.
//
// HOW THIS IS TESTED, and why it isn't a screenshot: a 380ms animation
// raced against Playwright's polling is a flaky test waiting to happen.
// Instead every animation is PAUSED at creation, then stepped by hand —
// so the assertions are about rendered geometry at a known point in the
// travel, which is the actual claim, and no timing is involved at all.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.beforeEach(() => test.slow());

const DURATION = 380;

// Seed storage AND freeze the dock's arrival so it can be inspected.
// Every animate() call is recorded; the dock's is held at time 0.
async function boot(page: Page, { reducedMotion = false } = {}) {
  if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(([schema, duration]) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
    (window as any).__dockAnims = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args: any[]) {
      const anim = original.apply(this, args as any);
      if (args[1] && args[1].duration === duration) {
        (window as any).__dockAnims.push(anim);
        anim.pause();
      }
      return anim;
    };
  }, [CURRENT_SCHEMA, DURATION]);
  await page.goto("/?dev");
}

async function addLeaf(page: Page, name: string) {
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill(name);
  await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
}

// The dock's own wrapper — the element the arrival animates.
const dockRow = (page: Page) => page.locator('[id^="brew-dock"] > div').first();

const heightAt = (page: Page, fraction: number) => page.evaluate(([f, d]) => {
  const anim = (window as any).__dockAnims[0];
  if (!anim) return null;
  anim.currentTime = (d as number) * (f as number);
  const el = document.querySelector('[id^="brew-dock"] > div');
  return el ? Math.round(el.getBoundingClientRect().height) : null;
}, [fraction, DURATION]);

test.describe("the brew dock grows into place", () => {
  test("it travels from nothing to its own height", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addLeaf(page, "chamomile");
    await expect(dockRow(page)).toBeAttached({ timeout: 30_000 });

    const start = await heightAt(page, 0);
    const middle = await heightAt(page, 0.5);
    const end = await heightAt(page, 1);

    expect(start, "an arrival that starts at full height isn't an arrival").toBeLessThanOrEqual(2);
    expect(end, "and it has to end somewhere real").toBeGreaterThan(40);
    // The middle is what stops the curve being front-loaded. An earlier
    // easing spent 64% of the travel in the first 15% of the time and
    // still read as a pop, which is the failure this number guards.
    expect(middle, `halfway should look halfway — got ${middle} of ${end}`)
      .toBeGreaterThan(end! * 0.2);
    expect(middle, `halfway shouldn't be all but done — got ${middle} of ${end}`)
      .toBeLessThan(end! * 0.9);
  });

  test("it happens once, not on every re-render", async ({ page }) => {
    // The dock re-renders on every slider frame. A row that re-grew each
    // time you dragged the temperature would be unusable, so the effect
    // is keyed to the element's first appearance and nothing else.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addLeaf(page, "chamomile");
    await expect(dockRow(page)).toBeAttached({ timeout: 30_000 });
    await heightAt(page, 1);        // let the first one finish

    await addLeaf(page, "lavender");
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => (window as any).__dockAnims.length),
      "a second ingredient must not re-grow the dock").toBe(1);
  });

  test("reduced motion gets the controls immediately, not a styled-away animation", async ({ page }) => {
    // The row is chrome the user needs. The honest fallback is for it to
    // be there — not to animate invisibly, and not to be withheld.
    await boot(page, { reducedMotion: true });
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addLeaf(page, "chamomile");
    await expect(dockRow(page)).toBeVisible({ timeout: 30_000 });

    expect(await page.evaluate(() => (window as any).__dockAnims.length),
      "no arrival animation should be created under reduced motion").toBe(0);
    const box = await dockRow(page).boundingBox();
    expect(box!.height, "the controls should simply be there").toBeGreaterThan(40);
  });
});

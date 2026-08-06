// e2e/brew-dock-arrival.spec.ts — things arrive, they don't appear.
//
// Covers the shared Arrival component (components/Arrival.jsx) at each
// of its call sites: the brew dock, rows in the pot, advisory bands,
// and the detail overlay.
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

// Each call site is identified by its duration, which is how the
// harness below picks the right animation out of the page.
const DURATION = 380;       // the brew dock
const ROW_DURATION = 260;   // a row joining the pot
const OVERLAY_DURATION = 280;

// Seed storage AND freeze the dock's arrival so it can be inspected.
// Every animate() call is recorded; the dock's is held at time 0.
async function boot(page: Page, { reducedMotion = false } = {}) {
  if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(([schema]) => {
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
      if (args[1] && typeof args[1].duration === "number") {
        (window as any).__dockAnims.push({ anim, duration: args[1].duration, el: this });
        anim.pause();
      }
      return anim;
    };
  }, [CURRENT_SCHEMA]);
  await page.goto("/?dev");
}

async function addLeaf(page: Page, name: string) {
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill(name);
  await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
}

// The dock's own wrapper — the element the arrival animates.
const dockRow = (page: Page) => page.locator('[id^="brew-dock"] > div').first();

// Step the animation belonging to one call site, then measure whatever
// the caller cares about. No timing involved: the animation is paused at
// creation, so every reading is taken at a known point in the travel.
const stepped = (page: Page, wanted: number, fraction: number) =>
  page.evaluate(([d, f]) => {
    const rec = (window as any).__dockAnims.find((a: any) => a.duration === d);
    if (!rec) return null;
    rec.anim.currentTime = (d as number) * (f as number);
    return Math.round(rec.el.getBoundingClientRect().height);
  }, [wanted, fraction]);

const countOf = (page: Page, wanted: number) =>
  page.evaluate((d) => (window as any).__dockAnims
    .filter((a: any) => a.duration === d).length, wanted);

const heightAt = (page: Page, fraction: number) => stepped(page, DURATION, fraction);

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

    expect(await countOf(page, DURATION),
      "a second ingredient must not re-grow the dock").toBe(1);
  });

  test("a row grows into the pot rather than shoving the list down", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addLeaf(page, "chamomile");
    await expect(dockRow(page)).toBeAttached({ timeout: 30_000 });

    expect(await stepped(page, ROW_DURATION, 0),
      "a row that starts at full height displaces the list in one frame")
      .toBeLessThanOrEqual(2);
    const landed = await stepped(page, ROW_DURATION, 1);
    expect(landed, "and it has to end at a real row height").toBeGreaterThan(20);
  });

  test("the detail overlay opens from the middle without moving anything", async ({ page }) => {
    /* THE REASON IT REVEALS INSTEAD OF GROWING. This layer covers the
       screen rather than pushing it, so its content must sit at its
       final position for the entire travel — only the clip moves. If
       it ever went back to animating height, the heading would slide
       during the open and this assertion is what would catch it. */
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await expect(page.getByTestId("blend-detail")).toBeAttached({ timeout: 30_000 });

    const boxAt = (f: number) => page.evaluate((frac) => {
      const rec = (window as any).__dockAnims.find((a: any) => a.duration === 280);
      if (!rec) return null;
      rec.anim.currentTime = 280 * (frac as number);
      const el = document.querySelector('[data-testid="blend-detail"]');
      const inner = el?.querySelector("h1, h2, button");
      const r = inner?.getBoundingClientRect();
      return r ? { top: Math.round(r.top), height: Math.round(r.height) } : null;
    }, f);

    const early = await boxAt(0.1);
    const done = await boxAt(1);
    expect(early, "the overlay should be mid-open, with content already placed").not.toBeNull();
    expect(early!.top, "content must not travel while the overlay opens").toBe(done!.top);
    expect(early!.height, "and must not be squashed on the way in").toBe(done!.height);
  });

  test("reduced motion gets the controls immediately, not a styled-away animation", async ({ page }) => {
    // The row is chrome the user needs. The honest fallback is for it to
    // be there — not to animate invisibly, and not to be withheld.
    await boot(page, { reducedMotion: true });
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addLeaf(page, "chamomile");
    await expect(dockRow(page)).toBeVisible({ timeout: 30_000 });

    expect(await countOf(page, DURATION),
      "no arrival animation should be created under reduced motion").toBe(0);
    const box = await dockRow(page).boundingBox();
    expect(box!.height, "the controls should simply be there").toBeGreaterThan(40);
  });
});

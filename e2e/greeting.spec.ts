// e2e/greeting.spec.ts — the Home greeting's arrival animation.
//
// Two things worth pinning, both invisible in a screenshot:
//   1. Both flourishes (the poem card's and the greeting's) draw with
//      the SAME delay and duration. They're a matched pair in the
//      layout; if they drift apart in time the symmetry is gone.
//   2. The arrival plays once per session, not once per mount. Home
//      remounts on every tab return, and a welcome that re-performs
//      each visit becomes a toll.
import { test, expect, type Page } from "@playwright/test";

async function openHome(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("herbanium.schemaVersion", "6");
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true, recipes: true, reflections: true, fieldnotes: true,
    }));
  });
  await page.goto("/?dev");
}

const tab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();

test.describe("Home greeting arrival", () => {
  // WCAG 2.2.2 (Level A): moving content that starts automatically and
  // runs longer than five seconds needs a pause/stop/hide control. This
  // sequence has no such control, so it must finish inside the window.
  // An earlier cut ran 4.7s, which is closer than anyone should be
  // comfortable with — hence a test rather than a comment.
  test("the whole arrival finishes inside the WCAG five-second window", async ({ page }) => {
    await openHome(page);
    const endsAt = await page.evaluate(() => {
      const ms = (v: string) => v.split(",").map(x => parseFloat(x) * (x.includes("ms") ? 1 : 1000));
      let latest = 0;
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const cs = getComputedStyle(el);
        if (cs.animationName === "none") continue;
        const delays = ms(cs.animationDelay);
        const durs = ms(cs.animationDuration);
        durs.forEach((d, i) => {
          latest = Math.max(latest, (delays[i] ?? delays[0] ?? 0) + d);
        });
      }
      return latest;
    });
    // eslint-disable-next-line no-console
    console.log(`  arrival sequence ends at ${Math.round(endsAt)}ms`);
    expect(endsAt, "arrival must stay under 5s or it needs a pause control").toBeLessThan(5000);
  });

  test("both flourishes draw on the same clock", async ({ page }) => {
    await openHome(page);
    const timings = await page.locator(".greet-orn-anim").evaluateAll(nodes =>
      nodes.map(n => {
        const cs = getComputedStyle(n.querySelector("path")!);
        return `${cs.animationName} ${cs.animationDelay} ${cs.animationDuration}`;
      }));

    expect(timings.length, "expected the card's flourish and the greeting's").toBe(2);
    expect(timings[0]).toContain("ornDraw");
    expect(new Set(timings).size, `flourishes are out of step: ${JSON.stringify(timings)}`).toBe(1);
  });

  test("the arrival plays once per session, not on every return to Home", async ({ page }) => {
    await openHome(page);
    await expect(page.locator("[data-arriving]")).toHaveAttribute("data-arriving", "1");

    await tab(page, "Journal");
    await expect(page.locator("[data-arriving]")).toHaveCount(0);

    await tab(page, "Home");
    await expect(page.locator("[data-arriving]"),
      "coming back to Home must not replay the welcome").toHaveAttribute("data-arriving", "0");
    await expect(page.locator(".greet-orn-anim"),
      "flourishes should not redraw on return").toHaveCount(0);
  });
});

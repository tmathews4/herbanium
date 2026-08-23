// e2e/tap-targets.spec.ts — the parts steppers are reachable with a
// finger.
//
// REPORTED: "toggling the tsp amount with the + and - on pixel chrome
// is not working all the time, have to keep clicking", then the detail
// that named it — "with fingers mind you, that might be the problem too
// big".
//
// The steppers draw a 22x22 circle. That is half the 44px both mobile
// platforms ask for and under WCAG 2.5.8's 24px floor, and a finger pad
// is roughly 45px across. Missing a control that often reads as the
// control being broken.
//
// The circle stays 22px — growing the button would grow the drawn ring
// and push the row around. What grew is the area that RESPONDS, via a
// transparent ::after that occupies no space. So this spec measures
// what a tap actually hits rather than what the element's box says,
// which is the only version of it that can tell the two apart: the
// bounding box is 22x22 either way.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

/* HOW BIG CAN IT HONESTLY BE, and this took three goes to state.
   
   Both platforms ask for 44. The horizontal axis nearly gets there —
   the buttons sit 48px apart edge to edge. The vertical cannot: on the
   tight layouts the stepper rows are on a 43px pitch, so reaching past
   that puts two neighbouring controls in a fight over the same tap.
   The ceiling is the row rhythm, not the guideline.

   v1 asserted a flat 40 on both axes, computed from the CSS insets. It
   passed on pixel-9 at 42x40 and failed in CI on pixel-fold-open,
   iphone-15 and ipad-pro at 42x39 — subpixel rounding differs per
   device by a pixel or three.

   v2 derived the vertical bound from the row pitch the page renders,
   which sounded principled and was wrong: the inset is a constant, so
   the reach does NOT grow with a taller row. galaxy-s9 lays the rows
   out on a 55px pitch and still reaches 40, so the derived expectation
   of 47 failed a control that is exactly as big as it is everywhere
   else.

   So: a floor, set from what the design delivers rather than from what
   the arithmetic predicts or what a guideline wishes for. Measured
   42x39 to 42x40 across five Chromium projects and three WebKit ones.
   36 leaves room for a device that rounds differently and still fails
   the 22x22 this replaced, which is the only comparison that matters. */
const MIN_REACH = 36;

async function twoIngredients(page: Page) {
  await boot(page);
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Blend", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  for (const name of ["peppermint", "rooibos"]) {
    await search.fill(name);
    await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
  }
  await expect(page.locator('button[aria-label^="increase"]').first())
    .toBeVisible({ timeout: 30_000 });
  /* BRING IT OUT FROM UNDER THE DOCK FIRST. The page runs beneath the
     brew dock by design — that is what makes the dock read as glass —
     so a stepper can be half-covered until you scroll, and at 320px
     with two ingredients every one of them is. That is a reachability
     question of its own; this file is about how big the target is once
     you can see it, so scroll to it the way a user would. */
  /* scrollIntoViewIfNeeded is NOT dock-aware — the brew dock overlays
     the page rather than displacing it, so the browser calls a row
     under it perfectly visible and does nothing. Scroll by the actual
     overlap instead. */
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label^="increase"]') as HTMLElement;
    const dock = document.querySelector('[data-tour="blend-controls"]')
      ?.closest("div[style]") as HTMLElement;
    if (!btn || !dock) return;
    const overlap = btn.getBoundingClientRect().bottom - dock.getBoundingClientRect().top;
    if (overlap <= 0) return;
    const els = Array.from(document.querySelectorAll("div")) as HTMLElement[];
    const sc = els.find(d => getComputedStyle(d).overflowY === "auto" && d.clientHeight > 200);
    if (sc) sc.scrollTop += overlap + 12;
  });
  await page.waitForTimeout(250);
}

test.describe("the parts steppers", () => {
  test("answer to a finger, not just to a cursor", async ({ page }) => {
    await twoIngredients(page);

    const measured = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(
        'button[aria-label^="decrease"], button[aria-label^="increase"]')) as HTMLElement[];
      return btns.map(b => {
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const owns = (el: Element | null) => el === b || b.contains(el as Node);
        /* Walk outward from the centre until a tap stops landing on
           this button. That is the real target, ::after included. */
        const run = (dx: number, dy: number) => {
          let n = 0;
          for (; n < 60; n++) {
            if (!owns(document.elementFromPoint(cx + dx * (n + 1), cy + dy * (n + 1)))) break;
          }
          return n;
        };
        return {
          label: (b.getAttribute("aria-label") || "").slice(0, 30),
          disabled: (b as HTMLButtonElement).disabled,
          drawn: Math.round(r.height),
          /* A row scrolled under the brew dock reports nothing, which
             is the dock working, not the button failing. */
          covered: !owns(document.elementFromPoint(cx, cy)),
          w: run(-1, 0) + run(1, 0) + 1,
          h: run(0, -1) + run(0, 1) + 1,
        };
      });
    });

    const live = measured.filter(m => !m.covered && !m.disabled);
    expect(live.length, "at least one stepper should be clear of the dock")
      .toBeGreaterThan(0);

    const small = live.filter(m => m.w < MIN_REACH || m.h < MIN_REACH);
    expect(small,
      `these steppers are smaller than a fingertip (drawn ${live[0].drawn}px, ` +
      `so at least ${MIN_REACH}px of reach is expected): ` +
      small.map(m => `${m.label} ${m.w}x${m.h}`).join(", "))
      .toEqual([]);
  });

  test("without the circle itself growing", async ({ page }) => {
    /* The reach is invisible on purpose. If the drawn control grows,
       the row's layout moves and the reason for doing it this way is
       gone — so the visible box is pinned too. */
    await twoIngredients(page);
    const boxes = await page.locator('button[aria-label^="increase"]')
      .evaluateAll(els => els.map(e => {
        const r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }));
    for (const b of boxes) {
      expect(b.w, `the drawn control is ${b.w}x${b.h}, not 22x22`).toBe(22);
      expect(b.h).toBe(22);
    }
  });
});

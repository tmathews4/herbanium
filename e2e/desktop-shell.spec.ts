// e2e/desktop-shell.spec.ts — nothing renders behind the app frame.
//
// The desktop branch used to draw a full-width masthead (a 54px
// <h1>Herbanium</h1>, an eyebrow line, the tagline "Blend by mood ·
// brew with intent · log the effect", three hint chips) and a footer,
// then paint PhoneFrame over the lot: `position: fixed; inset: 0` at
// 100vw x 100dvh on an opaque ivory. None of it had been visible since
// the phone-bezel preview was removed, and the chrome that framed the
// bezel was never removed with it.
//
// Invisible is not harmless. The markup still went to screen readers
// and crawlers, so the page announced a heading, a tagline and three
// onboarding hints no sighted user could reach — and the hints named
// surfaces wrongly ("Compose" for the Blend tab, a Dev section that
// does not exist until you tap the version seven times). It was also
// the entire second scrollbar: the document ran ~80px past the window,
// and those 80px were the buried masthead.
//
// This guards the shape rather than the absence of particular words,
// so re-adding a desktop landing page deliberately is a change to make
// on purpose — with the app column no longer nailed over it — rather
// than something that creeps back a div at a time.
import { test, expect } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

test.describe("the desktop shell", () => {
  test("does not scroll a document taller than the window", async ({ page }) => {
    await boot(page);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollHeight - window.innerHeight);
    // The app column scrolls INSIDE the fixed frame. Any overflow on the
    // document itself is content nailed over — which is what the second
    // scrollbar was made of.
    expect(overflow,
      `the document runs ${overflow}px past the window, so something is `
      + `rendering outside the app frame`).toBeLessThanOrEqual(0);
  });

  test("renders no text outside the app frame", async ({ page }) => {
    await boot(page);
    /* OUTSIDE THE FRAME, not below the fold. The first cut asked whether
       a box sat past the viewport, which flags the whole lower half of a
       scrolling column — content a user reaches by scrolling is not
       buried. What made the masthead unreachable was structural: it
       lived OUTSIDE the opaque full-viewport frame that is painted over
       everything, so no amount of scrolling could bring it back. That is
       the property worth asserting, and it is indifferent to scroll
       position. */
    const stray = await page.evaluate(() => {
      const spans = (el: Element) => {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed") return false;
        const r = el.getBoundingClientRect();
        return r.width >= window.innerWidth - 1 && r.height >= window.innerHeight - 1;
      };
      const frames = Array.from(document.body.querySelectorAll("*")).filter(spans);
      if (frames.length === 0) return ["__no full-viewport frame found__"];
      const out: string[] = [];
      for (const el of Array.from(document.body.querySelectorAll("*"))) {
        if (el.children.length) continue;                  // leaves only
        const text = (el.textContent || "").trim();
        if (!text) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;      // not laid out
        if (!frames.some(f => f.contains(el))) out.push(text.slice(0, 60));
      }
      return out;
    });
    expect(stray, `these render outside the app frame, so the frame is painted `
      + `over them and no scroll reaches them — but screen readers and crawlers `
      + `still get them: ${stray.join(" | ")}`).toEqual([]);
  });
});

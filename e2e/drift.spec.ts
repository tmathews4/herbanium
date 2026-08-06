// e2e/drift.spec.ts — does the app look the same shape on an iPhone as
// it does on the Pixel it was designed on?
//
// The rest of the suite asks whether things WORK. This asks whether they
// look like what was approved, which is a different question and the one
// that goes unanswered when you develop on one device and ship to
// several. Everything here is built on one idea:
//
//   MEASURE FRACTIONS OF THE VIEWPORT, NOT PIXELS.
//
// A Pixel 9 is 732px tall and an iPhone SE is 667px. Comparing raw
// heights across them says nothing — of course the numbers differ. What
// carries meaning is proportion: a block that takes 18% of the screen on
// the Pixel and 26% on the iPhone has genuinely drifted, and that shows
// up identically no matter which device you hold.
//
// Two kinds of output, deliberately separated:
//
//   ASSERTIONS — engine-independent things that are simply wrong on any
//   device: sideways scroll, a control off screen, a dock eating the
//   page. These fail the build.
//
//   MEASUREMENTS — the proportion table, logged rather than asserted.
//   Pinning a number here would just encode whichever engine happened to
//   be measured first, which is the trap the existing tour specs already
//   document. The table is for reading across a CI run: the Chromium
//   projects are the reference, the WebKit ones are the question.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    // Tours off: this spec is about the app's own layout, and a tour
    // overlay would measure the tour instead.
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
}

// Build a real pot, because an empty apothecary has nothing to chart and
// the strips — the densest, most drift-prone layout in the app — read as
// absent. Two ingredients is what the tour seeds, and what the callout
// geometry was tuned around.
async function buildBlend(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  for (const name of ["chamomile", "lavender"]) {
    await search.fill(name);
    const hit = page.getByRole("button", { name: new RegExp(name, "i") }).first();
    await expect(hit, `search should surface ${name}`).toBeVisible();
    await hit.click();
  }
  await expect(page.locator('[data-tour="blend-graph"]'),
    "two ingredients should produce a live prediction").toBeVisible();
}

// One page evaluation, so every number describes the same moment.
const survey = (page: Page) => page.evaluate(() => {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const doc = document.documentElement;

  // Height of a named element as a fraction of the viewport, or null if
  // it isn't on this screen. Null is a real answer — screens differ —
  // and is reported rather than silently read as zero.
  const frac = (sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    const h = el.getBoundingClientRect().height;
    return h > 0 ? Math.round((h / vh) * 1000) / 10 : null;
  };

  // The bottom bar, found the way the tour finds it: by the brew slot it
  // contains, rather than by a class that could be renamed out from
  // under this.
  const dock = document.getElementById("brew-dock")?.parentElement || null;

  // Did the intended typeface actually arrive? If it didn't, every
  // proportion below is describing a fallback font and the comparison is
  // measuring the wrong thing. Reported alongside the numbers so a
  // surprising table can be explained rather than puzzled over.
  const fonts = {
    sans: document.fonts.check('16px "Instrument Sans"'),
    serif: document.fonts.check('16px "Fraunces"'),
    // Added when the fonts were bundled. Mono was the family that
    // proved the point: it was only ever requested by <link> tags on
    // branches that unmount, so every monospace readout in the running
    // app fell back to ui-monospace and nothing noticed.
    mono: document.fonts.check('16px "JetBrains Mono"'),
  };

  // Anything poking out sideways. Horizontal scroll on a phone is the
  // single most obvious "this app is broken" signal, and it's the one a
  // developer on a wider device never sees.
  const overflowX = Math.max(0, doc.scrollWidth - doc.clientWidth);

  // Every element whose box starts left of the screen or ends right of
  // it — the specific culprits behind an overflowX, named so a failure
  // is actionable instead of a number.
  const culprits: string[] = [];
  if (overflowX > 0) {
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const t = el.tagName.toLowerCase();
        const hook = el.getAttribute("data-tour") || el.getAttribute("data-testid");
        culprits.push(hook ? `${t}[${hook}]` : t);
        if (culprits.length >= 6) break;
      }
    }
  }

  return {
    vw, vh, overflowX, culprits, fonts,
    dockPct: dock ? Math.round((dock.getBoundingClientRect().height / vh) * 1000) / 10 : null,
    flavoursPct: frac('[data-tour="blend-flavors"]'),
    graphPct: frac('[data-tour="blend-graph"]'),
    slidersPct: frac('[data-tour="blend-sliders"]'),
  };
});

function report(label: string, s: Awaited<ReturnType<typeof survey>>) {
  const pct = (v: number | null) => (v == null ? "  — " : `${v.toFixed(1)}%`);
  // eslint-disable-next-line no-console
  console.log(
    `  [${test.info().project.name}] ${label}: ${s.vw}x${s.vh}`
    + `  dock ${pct(s.dockPct)}`
    + `  flavours ${pct(s.flavoursPct)}`
    + `  graph ${pct(s.graphPct)}`
    + `  sliders ${pct(s.slidersPct)}`
    + `  fonts ${s.fonts.sans ? "sans✓" : "sans✗"}/${s.fonts.serif ? "serif✓" : "serif✗"}/${s.fonts.mono ? "mono✓" : "mono✗"}`,
  );
}

/* ──────────────────────────────────────────────────────────────
   Hard invariants. Nothing engine-specific here — these are wrong
   on any device, and they are the failures that read as "broken"
   rather than "different".
   ────────────────────────────────────────────────────────────── */
test.describe("nothing overflows sideways", () => {
  for (const [label, go] of [
    ["home", async (_p: Page) => {}],
    ["apothecary", async (p: Page) => p.getByRole("button", { name: "Apothecary", exact: true }).click()],
    ["journal", async (p: Page) => p.getByRole("button", { name: "Journal", exact: true }).click()],
    ["profile", async (p: Page) => p.getByRole("button", { name: "Profile", exact: true }).click()],
  ] as const) {
    test(`${label} fits its width`, async ({ page }) => {
      await boot(page);
      await go(page);
      // Let the screen settle — Home's arrival animates, and a mid-flight
      // transform can transiently overhang.
      await page.waitForTimeout(1200);

      const s = await survey(page);
      report(label, s);
      expect(s.overflowX,
        `${label} scrolls sideways by ${s.overflowX}px — likely: ${s.culprits.join(", ") || "unknown"}`)
        .toBeLessThanOrEqual(1);
    });
  }
});

test.describe("the dock leaves the page room to exist", () => {
  // The failure this catches: taller text inflates the bottom bar, the
  // scroll pane is a flex sibling so every pixel comes off its height,
  // and the screen the user came to read gets squeezed. It's the most
  // likely way a WebKit text-metric difference turns into a layout one,
  // and it's invisible if you only ever look at Chromium.
  //
  // TWO STATES, TWO BOUNDS, because the dock has two legitimate sizes
  // and conflating them makes the check meaningless.
  //
  // Collapsed it's just the tab bar. Open it also holds the brew panel —
  // pills, slider, range band — and is SUPPOSED to be about a third of
  // the screen. Measured on Chromium: 15.3–17.0% collapsed, 30.3–35.1%
  // open. An earlier draft of this file asserted "< 33%" while only ever
  // visiting the collapsed screen; pointed at a real blend it would have
  // failed Galaxy S9 at 35.1% for doing exactly what it's designed to do.
  //
  // Both bounds are structural — "something has gone wrong" lines with
  // room for an engine that lays text out taller — not design specs. A
  // tight number here would pin whichever engine happened to be measured.
  test("the collapsed bottom bar stays a bar", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await page.waitForTimeout(1200);

    const s = await survey(page);
    report("apothecary (empty)", s);
    expect(s.dockPct, "no dock found — the survey is measuring nothing").not.toBeNull();
    expect(s.dockPct!, `the collapsed dock is taking ${s.dockPct}% of the viewport`)
      .toBeLessThan(25);
  });

  test("the open brew panel leaves the prediction room to breathe", async ({ page }) => {
    // The failure worth catching: text metrics inflate the panel, the
    // scroll pane is a flex sibling so every pixel comes off its height,
    // and the strips the user came to read get squeezed. This is the
    // most plausible route from "WebKit lays text out taller" to "the
    // app looks wrong on an iPhone".
    await boot(page);
    await buildBlend(page);
    await page.waitForTimeout(1200);

    const s = await survey(page);
    report("apothecary (blend)", s);
    expect(s.dockPct!, `the open dock is taking ${s.dockPct}% of the viewport`)
      .toBeLessThan(45);
    expect(s.graphPct, "the prediction should be on screen to measure").not.toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────
   The proportion table. Logged, never asserted — see the header.
   Read it ACROSS projects in a CI run: the Chromium rows are what
   was designed and approved, the WebKit rows are the question.
   ────────────────────────────────────────────────────────────── */
test("proportions, for reading across the matrix", async ({ page }) => {
  await boot(page);
  // A POPULATED blend, not an empty one. The strips are where text
  // metrics turn into layout — every family row is a line of type with a
  // bar beside it — so an empty apothecary would survey the one screen
  // least able to drift.
  await buildBlend(page);
  await page.waitForTimeout(1500);

  const s = await survey(page);
  report("SURVEY", s);

  // The one thing worth asserting here, because it invalidates every
  // other number rather than merely differing from them: if the webfont
  // didn't arrive, the table describes a fallback face and any drift it
  // shows is the fallback's, not the app's.
  //
  // Soft on purpose — a runner with no network isn't a product bug, and
  // failing the build for it would train everyone to ignore this file.
  if (!s.fonts.sans || !s.fonts.serif || !s.fonts.mono) {
    // eslint-disable-next-line no-console
    console.log(`  [${test.info().project.name}] WARNING: webfonts did not load `
      + `(sans=${s.fonts.sans}, serif=${s.fonts.serif}, mono=${s.fonts.mono}) — proportions above describe fallback faces. `
      + `The fonts are bundled now (see the @font-face block in src/index.css), so this should not happen.`);
  }
  expect(s.vh, "a viewport height is the basis of every number here").toBeGreaterThan(0);
});

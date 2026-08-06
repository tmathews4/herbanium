// e2e/bar-descriptors.spec.ts — every bar the app draws can be tapped
// for what it means.
//
// tests/descriptor-coverage.test.mjs asks the same question of the DATA:
// does every word that could be shown have an entry. This asks it of the
// screen, and the two catch different things. The data test can't see a
// row whose label is computed at render time, or a strip that looks its
// description up by a key it doesn't have, or a child row that only
// exists in Detailed mode. This walks what actually rendered.
//
// The failure it exists for is quiet by design. FlavorMap wires
// `onClick` only when a description resolves — no handler, and no "tap
// for definition" tooltip either — so an unexplained row looks exactly
// like an explained one and simply does nothing when you tap it.
// Reported from the app as: "warming under body doesn't have a click-in
// descriptor like flavors and moods do."
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.beforeEach(() => test.slow());

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

// A DELIBERATELY BROAD POT. The sweep can only judge rows that render,
// and rows only render for families the blend actually produces — so the
// ingredients here are chosen to light up as many as possible rather
// than to make a sensible cup.
//
// That gap is not hypothetical. An earlier version used chamomile,
// lavender and hibiscus, reported "all bars explained", and never once
// drew the `heat`/warming row — which is the exact row reported as
// having no click-in descriptor. Ginger and cinnamon are here to force
// it, and the count assertion below fails if the pot ever stops being
// broad enough to be worth sweeping.
async function buildBlend(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  for (const name of ["chamomile", "lavender", "hibiscus", "ginger", "cinnamon", "peppermint"]) {
    await search.fill(name);
    const hit = page.getByRole("button", { name: new RegExp(name, "i") }).first();
    if (await hit.count()) await hit.click();
  }
  await expect(page.locator('[data-tour="blend-graph"]')).toBeVisible();
}

// Every rendered row, with the label it shows and whether it resolved a
// description. Read in one pass so a re-render can't split the answer.
const rows = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll('[data-testid="bar-row"]')].map(el => ({
    label: el.getAttribute("data-bar") || "",
    describable: el.getAttribute("data-describable") === "1",
  })));

async function expectAllExplained(page: Page, mode: string) {
  const all = await rows(page);
  expect(all.length, `${mode}: no bars rendered — the walk is measuring nothing`)
    .toBeGreaterThan(4);
  const mute = all.filter(r => !r.describable).map(r => r.label);
  expect(mute,
    `${mode}: these bars render but open nothing when tapped — `
    + `no handler, no tooltip, indistinguishable from a working row`)
    .toEqual([]);
  // eslint-disable-next-line no-console
  console.log(`  [${test.info().project.name}] ${mode}: ${all.length} bars, all explained`);
}

test.describe("every bar explains itself", () => {
  test("Simple mode — family rows across all four strips", async ({ page }) => {
    await boot(page);
    await buildBlend(page);
    await page.getByTestId("blend-mode-simple").click();
    await page.waitForTimeout(600);
    await expectAllExplained(page, "Simple");
  });

  test("Detailed mode — including the child rows", async ({ page }) => {
    // The half the data test is weakest on: children only exist here,
    // and they resolve their descriptions by leaf label rather than by
    // family, which is a different lookup with its own way to miss.
    await boot(page);
    await buildBlend(page);
    await page.getByTestId("blend-mode-detailed").click();
    await page.waitForTimeout(600);

    const all = await rows(page);
    const simple = await (async () => {
      await page.getByTestId("blend-mode-simple").click();
      await page.waitForTimeout(400);
      return rows(page);
    })();
    expect(all.length,
      `Detailed should open child rows (simple ${simple.length}, detailed ${all.length})`)
      .toBeGreaterThan(simple.length);

    await page.getByTestId("blend-mode-detailed").click();
    await page.waitForTimeout(600);
    await expectAllExplained(page, "Detailed");
  });

  test("tapping a bar actually opens its definition", async ({ page }) => {
    // `describable` says a description RESOLVED. This says the tap does
    // something with it — the attribute would still read 1 if the panel
    // were broken.
    await boot(page);
    await buildBlend(page);
    await page.getByTestId("blend-mode-detailed").click();
    await page.waitForTimeout(600);

    const first = page.locator('[data-testid="bar-row"]').first();
    const label = await first.getAttribute("data-bar");
    const before = (await page.locator('[data-tour="blend-flavors"]').innerText()).length;
    await first.click();
    await page.waitForTimeout(400);
    const after = (await page.locator('[data-tour="blend-flavors"]').innerText()).length;

    expect(after,
      `tapping "${label}" should reveal its definition (text ${before} -> ${after} chars)`)
      .toBeGreaterThan(before);
  });

  test("the Body strip's rows explain themselves too", async ({ page }) => {
    // Called out specifically. Body was the strip reported as having no
    // click-in descriptor, and it's the one whose labels went through a
    // rename — so it's the likeliest to have a label the lookup no
    // longer knows.
    await boot(page);
    await buildBlend(page);
    await page.waitForTimeout(600);

    const body = await page.evaluate(() => {
      const strip = document.querySelector('[data-tour="blend-effects"]');
      if (!strip) return null;
      return [...strip.querySelectorAll('[data-testid="bar-row"]')].map(el => ({
        label: el.getAttribute("data-bar") || "",
        describable: el.getAttribute("data-describable") === "1",
      }));
    });
    expect(body, "the effects strip should be on screen").not.toBeNull();
    expect(body!.length, "and should have drawn some rows").toBeGreaterThan(0);
    expect(body!.filter(r => !r.describable).map(r => r.label),
      "mind/body rows that open nothing").toEqual([]);
  });
});

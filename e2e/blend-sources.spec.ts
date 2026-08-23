// e2e/blend-sources.spec.ts — a source has to say what KIND of source it is.
//
// The four source lines the app shows used to render as identical
// italic serif inside one box labelled "Sources":
//
//   Cerny A, Schmid K. 1999 ... Fitoterapia 70:221-228.   an RCT
//   Soen Nagatani's 1738 sencha-steaming method            history
//   Eisai (12th c.) ...                                    history
//   Susun Weed's Wise Woman tradition ...                  a teaching
//
// Nothing on screen told a reader which was which, so a journal
// citation lent its authority sideways to the folk teaching printed
// beside it. That is the same failure as a `verified` marker nobody
// audits, except this is the version users actually see.
//
// DERIVED, NOT RESTATED. This walks BLEND_SOURCES and holds the page
// to whatever register each entry declares. It never says "all-heal is
// the trial" — add a source, change a register, and the expectation
// moves with the data. A hand-written table here would be a second
// copy of the answer, which is the drift every contract spec in this
// repo exists to catch.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";
import { BLEND_SOURCES, SOURCE_REGISTERS, BLENDS } from "../src/data/blends";

/* Types come from src/data/blends.d.ts, the convention this repo
   already uses for JS modules the specs import (see blendShares.d.ts).
   No casts here — a cast would let the spec disagree with the data. */
const SOURCES = BLEND_SOURCES;
const REGISTERS = SOURCE_REGISTERS;
const ALL_BLENDS = BLENDS;

test.beforeEach(() => test.slow());

/* Journal -> Recipes -> the "All" collection, the same route
   e2e/blend-tags.spec.ts uses. The first version of this went to the
   Apothecary's ingredient search instead and every test sat there for
   90 seconds waiting for a button that was never going to exist. */
async function openBlend(page: Page, name: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.profile", JSON.stringify({
      name: "Test Brewer", onboarded: true, createdAt: 1700000000000,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Recipes", exact: true }).click();
  await page.locator('[data-tour="recipes-filter"]')
    .getByRole("button", { name: "All", exact: true }).click();

  /* ASSERT BEFORE CLICKING. A bare .click() has no timeout of its own —
     it waits out the whole test budget and reports "the hook timed
     out", which names nothing. This says which blend went missing. */
  const card = page.getByRole("button", { name: new RegExp(name, "i") }).first();
  await expect(card, `"${name}" should be listed under Recipes -> All`)
    .toBeVisible({ timeout: 30_000 });
  await card.click();
}

test.describe("a cited source names its register", () => {
  for (const [id, sources] of Object.entries(SOURCES)) {
    const blend = ALL_BLENDS.find(b => b.id === id);
    test(`${id} labels its source as "${REGISTERS[sources[0].register]}"`, async ({ page }) => {
      test.skip(!blend, `no blend named ${id}`);
      await openBlend(page, blend!.name);

      const rows = page.getByTestId("blend-source");
      await expect(rows.first(), "the sources block should be on the blend's page")
        .toBeVisible({ timeout: 30_000 });
      await expect(rows).toHaveCount(sources.length);

      for (const [i, src] of sources.entries()) {
        const expected = REGISTERS[src.register];
        await expect(
          page.getByTestId("blend-source-register").nth(i),
          `source ${i} declares register "${src.register}", so the page must say so — ` +
          `an unlabelled citation is the bug this spec exists for`,
        ).toHaveText(new RegExp(expected, "i"));
      }
    });
  }

  test("the register is not the citation, so a reader can tell them apart", async ({ page }) => {
    // Guards against a "simplification" that drops the label and leaves
    // the citation alone — which is exactly the state before this work.
    const [id, sources] = Object.entries(SOURCES)[0];
    const blend = ALL_BLENDS.find(b => b.id === id)!;
    await openBlend(page, blend.name);

    const label = page.getByTestId("blend-source-register").first();
    await expect(label).toBeVisible({ timeout: 30_000 });
    const labelText = (await label.innerText()).trim();
    expect(labelText.length, "the register label must not be empty").toBeGreaterThan(0);
    expect(sources[0].text.toLowerCase(),
      "the register is a separate line, not a prefix baked into the citation")
      .not.toContain(labelText.toLowerCase());
  });
});

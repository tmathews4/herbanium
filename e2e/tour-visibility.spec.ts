// e2e/tour-visibility.spec.ts — nothing a tour points at may be off
// screen or behind the app's chrome.
//
// Walks EVERY step of EVERY tour and checks the highlighted element
// against the band the user can actually see: below the top bar, above
// the bottom dock. Not "is it in the DOM", not "is it in the viewport" —
// the failure this exists for is an element that is both, and covered.
//
// The blend tour's last step is why. The page scrolls UNDER the glass dock now, so
// `scrollIntoView({ block: "center" })` centers a target within a pane
// whose lower third is behind the menu. The last step of the blend tour
// was highlighted, scrolled to, and sitting underneath the tab bar.
//
// Deliberately generic. A per-step assertion would have to be written
// again for every step anyone adds, and the one that breaks is always
// the one nobody thought about — so this derives the step list from the
// tour data and holds all of them to the same rule.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";
import { SCREEN_TOURS } from "../src/data/tours";

const TOUR_TABS: Record<string, { tab: string; sub?: string }> = {
  home:        { tab: "Home" },
  blend:       { tab: "Apothecary" },
  herbanium:   { tab: "Apothecary", sub: "Herbanium" },
  recipes:     { tab: "Journal", sub: "Recipes" },
  reflections: { tab: "Journal", sub: "Reflections" },
  fieldnotes:  { tab: "Journal", sub: "Field Notes" },
};

async function armTour(page: Page, key: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(([schema, tour]) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "true");
    const seen: Record<string, boolean> = {
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    };
    seen[tour as string] = false;
    localStorage.setItem("herbanium.toursSeen", JSON.stringify(seen));
  }, [CURRENT_SCHEMA, key]);
  await page.goto("/?dev");
}

/**
 * Judge one step's target.
 *
 * "Behind the menu" is not the same as "below the menu's top edge". Four
 * blend steps point at the dock itself — the brew row, the axis pills,
 * the sliders, the sub-tabs — and those are on screen precisely because
 * the dock is. So the rule is: the target must be inside the viewport,
 * and anything reaching below the dock's top edge must BE dock, not page
 * content that has slid underneath it.
 */
async function judgeTarget(page: Page, tourTarget: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(`[data-tour="${sel}"]`);
    if (!el) return "no such target on screen";
    const r = el.getBoundingClientRect();
    if (r.height < 1) return "target has no height";
    const bar = document.getElementById("brew-dock")?.parentElement;
    const inDock = !!bar && bar.contains(el);
    const dockTop = bar ? bar.getBoundingClientRect().top : window.innerHeight;
    if (r.top < -1) return `above the viewport (top ${Math.round(r.top)})`;
    if (r.bottom > window.innerHeight + 1) {
      return `below the viewport (ends ${Math.round(r.bottom)}, screen ${window.innerHeight})`;
    }
    if (!inDock && r.bottom > dockTop + 1) {
      return `behind the menu (ends ${Math.round(r.bottom)}, menu starts ${Math.round(dockTop)})`;
    }
    return "ok";
  }, tourTarget);
}

for (const [key, steps] of Object.entries(SCREEN_TOURS)) {
  test(`${key} tour — every highlighted element stays on screen`, async ({ page }) => {
    // Walking a whole tour with a settle window per step outruns the
    // 30s default on the longer ones.
    test.setTimeout(120_000);
    await armTour(page, key);
    const dest = TOUR_TABS[key];
    test.skip(!dest, `no navigation known for the ${key} tour`);

    await page.getByRole("button", { name: dest.tab, exact: true }).click();
    if (dest.sub) {
      await page.locator('[data-tour="subtabs"]')
        .getByRole("button", { name: dest.sub, exact: true }).click();
    }

    const callout = page.getByTestId("tour-callout");
    await expect(callout, `the ${key} tour should start`).toBeVisible();

    const problems: string[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const label = `step ${i + 1}/${steps.length} "${step.title}" (${step.target})`;

      // Settle before judging: the tour scrolls and the cutout eases, so
      // an immediate read describes a frame mid-flight. Recorded rather
      // than thrown, so one bad step doesn't hide the ones behind it —
      // the whole point of walking every step is seeing all the damage
      // at once.
      let verdict = "never settled";
      for (let attempt = 0; attempt < 25; attempt++) {
        verdict = await judgeTarget(page, step.target);
        if (verdict === "ok") break;
        await page.waitForTimeout(200);
      }
      if (verdict !== "ok") problems.push(`  ${label} — ${verdict}`);

      const next = callout.getByRole("button", { name: "Next", exact: true });
      if (!(await next.count())) break;
      await next.click();
      await page.waitForTimeout(150);
    }

    expect(problems, `steps whose highlight left the visible band:\n${problems.join("\n")}`)
      .toEqual([]);
  });
}

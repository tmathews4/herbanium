/* ──────────────────────────────────────────────────────────────
   tools/lib/brew-params.mjs

   Does the app's BREWING ADVICE match its own research?

   Every audit so far has checked what a cup CLAIMS — effects, their
   strengths, the words used. None checked the numbers the app tells
   you to actually brew at, which is the most directly user-facing
   data in the catalogue and the one place being wrong makes a worse
   cup rather than a wrong label.

   The docs carry sourced ranges:

     | **temp range (°C)**    | [85, 95]   | traditional | ... |
     | **time range (seconds)** | [600, 900] | traditional | ... |

   The ingredient cards carry `tempC: [lo, hi]` and `timeS: [lo, hi]`,
   which is what the brew controls are bounded by.

   TWO KINDS OF DIFFERENCE, and only one is a defect:

   - NARROWER, inside the researched range. Editorial. The research may
     document a 25-100C span for hibiscus because cold brew exists;
     the app can reasonably offer the hot-brew band. Not reported.

   - OUTSIDE the researched range. The app is recommending a brew its
     own research doesn't support. Above the temperature ceiling is
     the sharp end — vanilla's doc says its aromatics are volatile and
     "high heat pushes them off", and the app's entire band sits above
     the doc's ceiling.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { DOCS } from "./strength-drift.mjs";
import { DELIBERATE_RANGE_DEPARTURES } from "../../src/data/brewIntent.js";

const range = (src, label) => {
  const m = src.match(new RegExp(`\\|\\s*\\*\\*${label}[^|]*\\|\\s*\\[\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*\\]`));
  return m ? [+m[1], +m[2]] : null;
};

/**
 * Ingredients whose card range falls outside the researched one.
 * Returns [{ id, axis, doc, app, direction }] — direction is "above"
 * when the app exceeds the researched ceiling, "below" when it starts
 * under the researched floor.
 */
export function outsideResearchedRange(INGREDIENTS) {
  const out = [];
  for (const f of readdirSync(DOCS).filter(x => x.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const id = [slug, slug.replace(/-/g, "")].find(c => INGREDIENTS[c]);
    if (!id) continue;
    const card = INGREDIENTS[id];
    if (!Array.isArray(card.tempC) || !Array.isArray(card.timeS)) continue;
    const src = readFileSync(resolve(DOCS, f), "utf8");

    for (const [axis, label, app] of [
      ["temp", "temp range", card.tempC],
      ["time", "time range", card.timeS],
    ]) {
      const doc = range(src, label);
      if (!doc) continue;
      if (app[1] > doc[1]) out.push({ id, axis, doc, app, direction: "above" });
      else if (app[0] < doc[0]) out.push({ id, axis, doc, app, direction: "below" });
    }
  }
  return out;
}

export const paramKey = r => `${r.id}:${r.axis}:${r.direction}`;

/** The `<id>:<axis>` key brewIntent records departures under. */
export const intentKey = r => `${r.id}:${r.axis}`;

/** Departures the catalogue has deliberately chosen — see brewIntent.js. */
export const isDeliberate = r =>
  Object.prototype.hasOwnProperty.call(DELIBERATE_RANGE_DEPARTURES, intentKey(r));

export const departureReason = r => DELIBERATE_RANGE_DEPARTURES[intentKey(r)];

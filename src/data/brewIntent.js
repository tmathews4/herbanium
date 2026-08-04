/* ──────────────────────────────────────────────────────────────
   data/brewIntent.js — where the app departs from its research on
   purpose, and why.

   Everything else in this catalogue is answerable to the docs: an
   effect the research doesn't prescribe is a bug, a strength that
   doesn't match is a bug. Brew PARAMETERS are the one place that
   isn't quite true, because the research documents how an ingredient
   is conventionally brewed and the app also has to serve the blends
   it actually ships.

   Without this file those departures look identical to drift, and the
   audits kept re-reporting them as work to be done. They aren't work.
   They're decisions, and the reason belongs next to them — a future
   reader finding gunpowder brewed hotter than its own research
   recommends deserves better than an unexplained number.

   Recorded here rather than as an exemption list in the test, because
   an exemption reads as "not yet fixed" and these are finished.

   Read by tools/lib/brew-params.mjs and the guard in
   tests/research-parity.test.mjs. Removing an entry makes the audit
   report that ingredient again, which is the correct behaviour if the
   intent ever changes.
   ────────────────────────────────────────────────────────────── */

/**
 * Card brew ranges that deliberately exceed the researched ceiling.
 * Keyed `<ingredient>:<axis>`.
 */
export const DELIBERATE_RANGE_DEPARTURES = {
  // Tom's signature blend is brewed hotter and longer than any of these
  // three would be taken alone. Held to the researched ceiling, the app
  // would fire over-pull warnings on a cup that is made on purpose and
  // tastes right — the warning would be wrong about the cup, not the
  // cup wrong about the warning. The ranges are fitted to that blend.
  "gunpowder:temp": "signature blend — fitted to a deliberately hotter brew than "
    + "gunpowder alone would take (doc 75-85C)",
  "spearmint:temp": "signature blend — same fitting as gunpowder (doc 85-95C)",
  "tulsi:temp": "signature blend — same fitting (doc 85-95C)",
  "tulsi:time": "signature blend — same fitting (doc 300-600s)",
};

/**
 * Extraction grids that deliberately sit off the researched brew
 * points. These are why some doc rows can never be strength-checked:
 * the app is modelling a different, defensible way of making the cup.
 */
export const DELIBERATE_GRIDS = {
  puerh: "Gongfu, not western. The profile runs 30s / 90s / 180s against a doc "
    + "prescribing 180 / 240 / 300 — short repeated infusions are how pu-erh is "
    + "actually drunk, and re-gridding to the doc's western times would make the "
    + "app worse rather than more accurate.",
  tulsi: "Deliberately wide — 50-100C across five points where the research "
    + "documents 85-95C. Tulsi is served everywhere from a cool steep to a hard "
    + "boil, and the range is also fitted to the signature blend.",
  hojicha: "Carries a 105C row above the doc's 100C ceiling. Hojicha is roasted "
    + "and forgiving, and the row exists to show what happens past boiling rather "
    + "than to recommend it.",
};

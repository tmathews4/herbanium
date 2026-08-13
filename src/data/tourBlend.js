/* The example pot the Blend tour drops into an empty composer.
 *
 * ONE PLACE, because it is one decision made of two literals. The ids
 * and the parts used to sit as separate object literals inside the
 * effect that seeds them; nothing held them together, so adding an
 * ingredient to one and forgetting the other would have seeded a pot
 * with a part-less leaf. Same shape as every other cluster CLAUDE.md
 * names — every copy correct, nothing keeping them so.
 *
 * WHY THIS BLEND, and it is not arbitrary. The tour teaches with it, so
 * the constraints come from the teaching:
 *
 *   TWO ingredients, at 2:1. The prediction bars and the brew sliders
 *   both have to fit on a phone screen beside the tour callout, and the
 *   uneven parts are what make it read as blending rather than mixing.
 *
 *   THE BARS HAVE TO MOVE. The tour oscillates the steep time across
 *   three steps (see tourDemoActive in ComposeScreen) and the whole
 *   lesson is that the sliders drive the graph. A pair whose curves are
 *   flat teaches the opposite of what the step is saying.
 *
 *   MIND AND BODY BOTH SAY SOMETHING. A step introduces each strip by
 *   name; one of them empty makes that step describe a blank.
 *
 *   NO WARNING ON ARRIVAL. This one is why the blend changed. The tour
 *   seeded chamomile 2 : peppermint 1, which resolves to `sleepy` 5 and
 *   trips the sedative ceiling — so the tutorial opened on "this stack
 *   of sedatives is at the ceiling, don't drive after". A first cup is
 *   the wrong place to meet a safety warning, and it was teaching the
 *   app's caution before it had taught the app.
 *
 * Tulsi and peppermint clear all four: no `sleepy` at all, no warnings,
 * four effects on each strip, and the bars move MORE across the steep
 * window than the old pair's did. `tests/tour-blend.test.mjs` holds
 * every one of those properties, so this can be re-picked freely and
 * the guard says whether the new choice still teaches.
 */
export const TOUR_BLEND = {
  ids: ["tulsi", "peppermint"],
  parts: { tulsi: 2, peppermint: 1 },
};

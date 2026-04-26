/* ──────────────────────────────────────────────────────────────
   data/limerickAdlibs.js — limerick-shaped journal entries.

   Asks the user for five small inputs (a name, a place, an -ing
   verb, a small object, a feeling word), then weaves them into a
   five-line AABBA piece.

   End-of-line rhymes are fixed in each template — the user's words
   only fill interior slots — so rhyme always works regardless of
   what they type. A given template uses some subset of the five
   slots; unused inputs go quietly. Shuffle reseeds to a different
   template for a re-roll.
   ────────────────────────────────────────────────────────────── */

export const LIMERICK_PROMPTS = [
  { key: "name",    label: "A name (or 'a stranger')", placeholder: "Otis" },
  { key: "place",   label: "A place",                  placeholder: "Lisbon" },
  { key: "action",  label: "A small action (-ing)",    placeholder: "humming" },
  { key: "object",  label: "A small object",           placeholder: "teacup" },
  { key: "feeling", label: "A feeling word",           placeholder: "gentle" },
];

const TEMPLATES = [
  ({ action, feeling, object, place }) =>
    `A traveler once ${action} away,\n` +
    `And ended up ${feeling} that day.\n` +
    `   With a ${object} and song,\n` +
    `   They wandered along,\n` +
    `Past ${place}, where the kettles all play.`,

  ({ name, object, feeling }) =>
    `There once was a ${object} on a shelf,\n` +
    `That whispered its ${feeling} to itself.\n` +
    `   Then ${name} came by,\n` +
    `   Gave a polite sigh,\n` +
    `And carried it off without stealth.`,

  ({ feeling, place, name, action, object }) =>
    `In the ${feeling} morning of ${place},\n` +
    `${name} was ${action} apace.\n` +
    `   With a ${object} in hand,\n` +
    `   On the cold cobbled land,\n` +
    `They smiled a most luminous trace.`,

  ({ name, action, feeling }) =>
    `Said ${name}, in a ${feeling} delight,\n` +
    `"I think I shall ${action} all night.\n` +
    `   With a kettle of cheer,\n` +
    `   And the moon pearled and clear,\n` +
    `I'll be steeped in the lemon-pale light."`,

  ({ object, place, name, feeling }) =>
    `There was once a fine ${object} from ${place},\n` +
    `That ${name} kept inside of a case.\n` +
    `   It was ${feeling} and bright,\n` +
    `   A peculiar sight,\n` +
    `That gleamed from its hidden hidey-place.`,

  ({ name, action, object }) =>
    `${name} sat down for some tea,\n` +
    `${action}, contemplating the sea.\n` +
    `   They lifted their ${object},\n` +
    `   And found it quite perfect,\n` +
    `Then sailed off to the eastern lee.`,

  ({ feeling, place, action, object }) =>
    `A kettle once whistled in ${place},\n` +
    `At a ${feeling} and deliberate pace.\n` +
    `   It would not stop ${action},\n` +
    `   The poor little thing,\n` +
    `Till a ${object} was placed on its face.`,

  ({ name, feeling, place, object }) =>
    `${name} reached for a cup that was ${feeling},\n` +
    `In a corner of ${place} most appealing.\n` +
    `   With a ${object} in tow,\n` +
    `   And a steady hand's flow,\n` +
    `They sipped till the moon hit the ceiling.`,
];

// Weave the user's slots into a limerick. `seed` selects a template;
// bumping it lets the user shuffle without re-typing.
export function assembleLimerick(slots, seed = 0) {
  const safe = {
    name:    (slots.name    || "a stranger").trim(),
    place:   (slots.place   || "town").trim(),
    action:  (slots.action  || "wandering").trim(),
    object:  (slots.object  || "teacup").trim(),
    feeling: (slots.feeling || "gentle").trim(),
  };
  const idx = ((seed % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length;
  return TEMPLATES[idx](safe);
}

export const LIMERICK_TEMPLATE_COUNT = TEMPLATES.length;

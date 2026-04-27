/* ──────────────────────────────────────────────────────────────
   data/haikuAdlibs.js — haiku-shaped journal entries from prompts.

   Ask the user for four small observations from their immediate
   surroundings; weave them into a 3-line piece. Not strict 5-7-5
   syllabic haiku — there's no syllable counter and arbitrary input
   wouldn't fit one anyway — but haiku-shaped: three lines, sensory,
   present-tense, small.

   The user can shuffle through templates if a particular weave
   doesn't land. Each template uses every slot so no input goes to
   waste.
   ────────────────────────────────────────────────────────────── */

export const HAIKU_PROMPTS = [
  { key: "thing",   label: "A small thing nearby",       placeholder: "candle" },
  { key: "sound",   label: "A sound you can hear",       placeholder: "kettle" },
  { key: "color",   label: "A colour or texture",        placeholder: "amber" },
  { key: "feeling", label: "A feeling word",             placeholder: "warm" },
];

const TEMPLATES = [
  ({ thing, sound, color, feeling }) =>
    `${color} ${thing}, still.\n${sound} from somewhere —\n${feeling} arrives.`,

  ({ thing, sound, color, feeling }) =>
    `A ${thing}, ${color}.\nOutside, the ${sound}.\n${feeling}, and quiet.`,

  ({ thing, sound, color, feeling }) =>
    `Edges of the ${color} ${thing} —\n${sound} settles.\n${feeling} in the cup.`,

  ({ thing, sound, color, feeling }) =>
    `The ${color} ${thing} on the table.\n${sound}, then ${sound} again.\nStill ${feeling}.`,

  ({ thing, sound, color, feeling }) =>
    `${color}, just ${color}.\nA ${thing} catches it.\nThe ${sound} keeps ${feeling} time.`,

  ({ thing, sound, color, feeling }) =>
    `The ${color} ${thing} doesn't move.\n${sound} fills the room.\n${feeling}.`,

  ({ thing, sound, color, feeling }) =>
    `Inside: ${thing}, ${color}.\nOutside: ${sound}.\nIn between: ${feeling}.`,

  ({ thing, sound, color, feeling }) =>
    `${feeling} morning —\n${sound}, ${thing}, ${color}.\nNothing to add.`,

  ({ thing, sound, color, feeling }) =>
    `One ${thing}.\nOne ${sound}.\nOne ${color} hour, ${feeling}.`,

  ({ thing, sound, color, feeling }) =>
    `The kettle remembers ${color}.\nA ${thing} listens to the ${sound}.\n${feeling} stays.`,
];

// Weave the user's slots into a haiku-shaped 3-line piece. `seed`
// selects a template; bumping it lets the user shuffle for a different
// weave without re-typing their words.
export function assembleHaiku(slots, seed = 0) {
  const safe = {
    thing:   (slots.thing   || "thing").trim(),
    sound:   (slots.sound   || "sound").trim(),
    color:   (slots.color   || "colour").trim(),
    feeling: (slots.feeling || "feeling").trim(),
  };
  const idx = ((seed % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length;
  return TEMPLATES[idx](safe);
}

export const HAIKU_TEMPLATE_COUNT = TEMPLATES.length;

/* ──────────────────────────────────────────────────────────────
   data/tours.js — guided-tour content.

   Kept out of App.jsx so it's plain data: the node suite imports it
   directly (tests/tour-layout.test.mjs) to check step ordering, the
   keepClear pairing the Blend tour depends on, and the Simple/Detailed
   demo schedule — none of which need a browser.
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   Guided tours — per-screen coach-mark walkthroughs. Each fires the
   first time you enter a screen. Each step targets a data-tour="<id>"
   anchor somewhere in the UI; GuidedTour spotlights it and the
   callout explains it. Keyed by screen (see currentTourScreen).
   ────────────────────────────────────────────────────────────── */
export const SCREEN_TOURS = {
  home: [
    { target: "home-experiment", title: "Experiment",
      body: "Start a blend from scratch — pick ingredients and design a recipe in the apothecary." },
    { target: "home-brew", title: "Brew",
      body: "Jump to your saved recipes and steep one you've kept." },
    { target: "home-write", title: "Write",
      body: "Open your journal to jot a thought or note how a cup left you." },
    { target: "home-herbanium", title: "Herbanium",
      body: "The compendium — a glossary of every tea and herb the app knows." },
    { target: "home-recent", title: "Recent brews", pad: 10,
      body: "Your recently brewed cups gather here. Tap one to revisit its notes." },
  ],
  blend: [
    { target: "blend-search", title: "Add ingredients", pad: 6,
      body: "Search or filter the apothecarium, then tap an ingredient to drop it in your pot." },
    { target: "blend-quantity", title: "Set the parts", pad: 8,
      body: "We've dropped in an example blend. Use − / + to set each ingredient's “parts” — its share of the cup. The most parts leads; the others accent it." },
    // The toggle gets demonstrated rather than described — one step per
    // mode, so the strips change when the USER taps Next instead of on
    // a timer. A timed flip meant a quick reader moved on before the
    // shift happened and never saw the thing the step is about.
    //
    // `familyMode` on a step forces what the strips show while it's up
    // (see blendTourFamilyMode in App.jsx); both steps light the bars
    // alongside the toggle, because what the toggle DOES is the lesson.
    { target: "blend-mode", title: "Simple or detailed", pad: 8,
      spotlight: ["blend-graph"], familyMode: true,
      body: "Simple reads the taste by family — floral, fruity, smoky. One bar each. Tap Next and watch the bars change." },
    { target: "blend-mode", title: "Simple or detailed", pad: 8,
      spotlight: ["blend-graph"], familyMode: false,
      body: "Detailed opens every family into the notes underneath it — apple and pear inside fruity, not just “fruity.” Same cup, finer read. We'll leave it on Simple." },
    // These two steps teach one thing between them — the sliders drive
    // the bars — so each keeps the other's element on screen and out
    // from under the callout. See GuidedTour's keepClear handling.
    // They hold familyMode too: the short family rows are the only way
    // the bars and the sliders both fit on a phone screen.
    // `compact` shrinks the callout for these two: they're asking the
    // user to watch the bars and the sliders at the same time, so the
    // callout has to give up room rather than take it. Copy is kept
    // short for the same reason.
    { target: "blend-graph", title: "The prediction", pad: 6, keepClear: ["blend-sliders"],
      familyMode: true, compact: true,
      body: "What the cup tastes like — its flavours, and the palate underneath them." },
    { target: "blend-sliders", title: "Dial in the brew", pad: 6, keepClear: ["blend-graph"],
      familyMode: true, compact: true,
      body: "Drag temperature or steep time — watch the bars move." },
    // Added when the mood strip split into Mind and Body and moved
    // BELOW the sliders. Without a step the user has no reason to
    // scroll past the controls, and the two windows saying what the cup
    // actually DOES — the app's whole claim — sit unseen under the
    // fold. Reading order is taste, controls, effect; the tour walks
    // all three now.
    { target: "blend-effects", title: "What it does", pad: 8,
      body: "Below the controls: what the cup does to you. Mind is what you'd notice — calm, focus, a lift. Body is what it works on — the throat, the gut, warmth." },
    { target: "blend-brew", title: "Brew or save", pad: 6,
      body: "Happy with it? Brew it now, or save the recipe to keep it in your journal." },
    { target: "subtabs", title: "Two sides", pad: 4,
      body: "The Apothecarium has two sides — Blend (where you are) and the Herbanium, a glossary of every tea and herb. Switch between them here." },
  ],
  herbanium: [
    { target: "herb-search", title: "The compendium", pad: 6,
      body: "A glossary of every tea and herb the app knows. Search by name to find one fast." },
    { target: "herb-filters", title: "Narrow it down", pad: 6,
      body: "Filter by category — teas, herbals, flowers, fruits, spices — to browse a family at a time." },
    { target: "herb-ingredient", title: "Read its profile", pad: 6,
      body: "Tap any ingredient to open its full profile — flavor, effects, how to brew it, and what it pairs with." },
  ],
  recipes: [
    { target: "recipes-filter", title: "Your recipes", pad: 6,
      body: "Your saved and curated blends live here. Filter by collection, mood, or flavor to find one." },
    { target: "recipes-row", title: "Brew again", pad: 6,
      body: "Tap any recipe to open it — then brew it, or tweak it into something new." },
    { target: "subtabs", title: "Three parts", pad: 4,
      body: "Your notebook has three parts — Recipes (here), Reflections (your tea log), and Field Notes (the spirits you draw in). Switch between them here." },
  ],
  reflections: [
    { target: "reflections-log", title: "Your tea log", pad: 6,
      body: "Every cup you brew and every note you write gathers here as a timeline. Filter by cups or entries." },
    { target: "reflections-write", title: "Write it down", pad: 6,
      body: "Jot a reflection or a little verse about a cup — free-form, haiku, limerick, or a short poem." },
  ],
  fieldnotes: [
    { target: "fieldnotes-lodestone", title: "The lodestone", pad: 8,
      body: "Spirits are drawn in by how you brew and write. The stone fills as you go, and a full stone always draws one in — tap it to summon what's waiting." },
    { target: "lodestone-details", title: "Look closer", pad: 8,
      body: "The stone's colour is your own — mixed from the moods and flavours of your recent cups. Open this to see what it's made of." },
    // Targets a control that only exists inside the expanded panel;
    // MoodCrystal opens the panel for this step (the overlay swallows
    // taps, so the user can't do it themselves mid-tour).
    { target: "lodestone-lock", title: "Keep this one", pad: 8,
      body: "Fond of the colour you've got? Lock it here and the stone holds that composition instead of drifting with your next few cups. Unlock any time to let it track again." },
  ],
};

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
      body: "Search or filter the apothecary, then tap an ingredient to drop it in your pot." },
    { target: "blend-quantity", title: "Set the parts", pad: 8,
      body: "We've dropped in an example blend. Use \u2212 / + to set each ingredient's \u201cparts\u201d \u2014 its share of the cup. The most parts leads; the others accent it." },
    // ORDER: what you built, what it predicts, how to read that, how to
    // change it, how to keep it.
    //
    // The prediction comes before the controls now. Showing the brew row
    // first meant explaining a control before the user had seen the
    // thing it changes — and the tour then had to say "watch the bars"
    // twice, once to introduce them and again to make them move.
    //
    // These two steps introduce the four windows. Held on Simple: family
    // rows are short enough to take in at a glance, and the next two
    // steps are what explain the other mode.
    { target: "blend-graph", title: "The prediction", pad: 6,
      familyMode: true,
      body: "What the cup tastes like \u2014 its flavours, and the palate underneath them." },
    { target: "blend-effects", title: "What it does", pad: 8,
      familyMode: true,
      body: "And what it does to you. Mind is what you'd notice \u2014 calm, focus, a lift. Body is what it works on \u2014 the throat, the gut, warmth." },
    // The toggle gets demonstrated rather than described \u2014 one step per
    // mode, so the strips change when the USER taps Next instead of on
    // a timer. A timed flip meant a quick reader moved on before the
    // shift happened and never saw the thing the step is about.
    //
    // `familyMode` on a step forces what the strips show while it's up
    // (see blendTourFamilyMode in App.jsx); both steps light the bars
    // alongside the toggle, because what the toggle DOES is the lesson.
    //
    // Neither says "watch the bars change" any more. That phrase belongs
    // to the slider step, which is the one actually asking you to watch
    // something move; here the change is a re-read of the same cup.
    { target: "blend-mode", title: "Simple or detailed", pad: 8,
      spotlight: ["blend-graph"], familyMode: true,
      body: "Simple reads the taste by family \u2014 floral, fruity, smoky. One bar each. Tap Next for the other way." },
    { target: "blend-mode", title: "Simple or detailed", pad: 8,
      spotlight: ["blend-graph"], familyMode: false,
      body: "Detailed opens every family into the notes underneath it \u2014 apple and pear inside fruity, not just \u201cfruity.\u201d Same cup, finer read. We'll leave it on Simple." },
    // Now the cup MOVES. keepClear holds the bars on screen while the
    // callout sits off them, because the whole instruction is to watch
    // one thing while dragging another. `compact` shrinks the callout
    // for the same reason: this step is competing with its own subject
    // for room, so it gives some up. Copy is short to match.
    //
    // openControls because the sliders must be there to drag; the two
    // steps after this one are what explain the row they live in.
    { target: "blend-sliders", title: "Dial in the brew", pad: 6, keepClear: ["blend-graph"],
      familyMode: true, compact: true, openControls: true,
      body: "Drag the slider \u2014 watch the bars move." },
    // Only now the mechanics of the row itself, once the user has seen
    // what it's for. Shown SHUT \u2014 a step explaining that the row folds
    // while showing it unfolded explains nothing \u2014 which is what
    // `openControls: false` is for. `false` rather than null: null hands
    // the row back to the user's own state, which is open.
    { target: "blend-controls", title: "The brew row", pad: 6, openControls: false,
      body: "The sliders live in this row. Tap it to fold them away \u2014 folded, it still reads the time and temperature you've set." },
    // The axis pills. A control that REPLACES what's on screen rather
    // than adding to it is invisible until someone says it's there.
    //
    // Lights the whole brew window, not just the pills: what the pills
    // DO is swap what that window contains, so the window is the lesson
    // and the pills are the control. They take a terra outline and pulse
    // of their own to say which part to look at (tourTogglePulse in
    // BlendExtractionExplorer).
    { target: "blend-axis", title: "Time or temperature", pad: 8, openControls: true,
      spotlight: ["blend-controls", "blend-sliders"],
      body: "One slider at a time. Tap Time or Temp to choose which \u2014 how long it steeps, or how hot the water is." },
    // Brew lives in the panel now, under the slider — so this step has
    // to hold the row OPEN or it would point at a button that isn't
    // rendered. It's the last step that steers the row; past here it's
    // the user's again.
    //
    // Saving is no longer mentioned: it moved to the steep screen, and
    // naming it here would send the user looking for a button that isn't
    // on this screen.
    { target: "blend-brew", title: "Brew it", pad: 6, openControls: true,
      body: "Happy with it? Start the timer — the cup you've dialled in is the one you'll get." },
    { target: "subtabs", title: "Two sides", pad: 4,
      body: "The Apothecary has two sides \u2014 Blend (where you are) and the Herbanium, a glossary of every tea and herb. Switch between them here." },
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

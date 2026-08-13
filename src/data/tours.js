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
    /* THESE TWO MOVE, AND THEY ARE THE ONLY STEPS THAT SHOW THE BARS
       MOVING WHILE THE BARS ARE THE LIT SUBJECT. That is the whole
       reason they carry `demo`, and it is worth stating because it was
       briefly removed and the loss is easy to miss from the code.

       The slider step demos too, but its spotlight is on the SLIDERS \u2014
       the strips sit dimmed behind the cutout while they change, so a
       reader watching the highlight never sees them move. Reported
       exactly that way: "we never show that behaviour directly now,
       they're greyed out changing in back."

       AND THE ROW STAYS FOLDED HERE, which was got wrong once in each
       direction and is worth writing down properly.

       These steps briefly had `demo` removed, on the reasoning that
       oscillating the brew while the row is folded is motion with an
       off-screen cause. That reasoning was wrong on its facts: the
       folded row is not hidden, it is CONDENSED \u2014 it still reads
       "203\u00b0F \u00b7 6:00" and that clock ticks along with the bars. The
       cause is on screen the whole time; it is a readout rather than a
       slider. Step 7 then names the thing the reader has been watching
       tick, which is a better arc than explaining it cold.

       They were then briefly given `openControls: true` instead, to put
       an actual slider under the moving bars. That is worse, and
       tests/tour-layout.test.mjs catches it: opening the row here means
       step 7 folds it again with five steps still to come, which is the
       "it toggles to condense in the middle and it's not clear what
       it's showing" defect the reordering note below already fixed
       once. The row opens exactly once, at step 8, and folds exactly
       once, at the end.

       No `axisMode` either, for the same reason: the pills live inside
       the row and there is nothing to bind while it is shut. The slider
       step declares Time, which is where it can actually take effect. */
    { target: "blend-graph", title: "The prediction", pad: 6,
      familyMode: true, demo: true,
      body: "What the cup tastes like \u2014 its flavours, and the palate underneath them." },
    { target: "blend-effects", title: "What it does", pad: 8,
      familyMode: true, demo: true,
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
    // The FLAVOUR strip only, not the whole graph. The toggle drives
    // FlavorMap alone — PalateMap takes no familyMode, and its rows read
    // the same in both modes — so lighting the palate too promised a
    // change in a strip that never changes.
    //
    // Neither says "watch the bars change" any more. That phrase belongs
    // to the slider step, which is the one actually asking you to watch
    // something move; here the change is a re-read of the same cup.
    /* NOT demoing, deliberately, and these are the two steps where
       stillness is right. They ARE a change to the strips: the toggle
       re-reads the same cup by family or by note. Oscillating the brew
       underneath that means two things move at once and neither reads
       as the consequence of the control being taught. */
    { target: "blend-mode", title: "Simple or detailed", pad: 8,
      spotlight: ["blend-flavors"], familyMode: true,
      body: "Simple reads the taste by family \u2014 floral, fruity, smoky. One bar each. Tap Next for the other way." },
    { target: "blend-mode", title: "Simple or detailed", pad: 8,
      spotlight: ["blend-flavors"], familyMode: false,
      body: "Detailed opens every family into the notes underneath it \u2014 apple and pear inside fruity, not just \u201cfruity.\u201d Same cup, finer read. We'll leave it on Simple." },
    /* THE ROW BEFORE ITS CONTENTS — shut, then open, then the parts.

       These two steps used to run the other way round: the sliders were
       shown first with the row forced OPEN, and the next step folded it
       shut to explain the row itself. So the tour opened a panel, taught
       inside it, then closed the panel mid-lesson and opened it again
       for the three steps after. Reported as "it toggles it to condense
       in the middle and it's not clear what it's showing" — which is
       exactly right: a thing that collapses while you're being taught
       about it reads as the app undoing itself, not as a demonstration.

       Introduce the container, then open it, then go inside. The fold
       is now the FIRST thing said about the row, while it is folded,
       which is the only state in which "this folds away" is a
       demonstration rather than a claim. */
    /* Brew is lit WITH the row. It sits in the row's header and does
       not fold with it, so a spotlight on `blend-controls` alone cut it
       out of a highlight it visually belongs to — the window looked
       cropped at the very step introducing it. */
    { target: "blend-controls", title: "The brew row", pad: 6, openControls: false,
      spotlight: ["blend-brew"],
      body: "Your brew lives down here. Folded like this it still reads the time and temperature, and Brew stays where it is \u2014 tap the row to open it." },
    // Opened, and now the cup MOVES. keepClear holds the bars on screen
    // while the callout sits off them, because the whole instruction is
    // to watch one thing while dragging another. `compact` shrinks the
    // callout for the same reason: this step competes with its own
    // subject for room, so it gives some up. Copy is short to match.
    // `demo` oscillates the steep time while this step is up, so the
    // bars answer a slider the reader can see. THE ONLY STEP THAT GETS
    // IT, and the flag lives here rather than in a list inside
    // ComposeScreen because the screen's list drifted from this file the
    // moment the brew row started folded \u2014 it went on driving the
    // prediction and effects steps, which no longer show a slider at
    // all. A step declares its own demo state; nothing else keeps a
    // second copy of which steps those are.
    { target: "blend-sliders", title: "Dial in the brew", pad: 6,
      keepClear: ["blend-graph", "blend-effects"],
      familyMode: true, compact: true, openControls: true, demo: true,
      axisMode: "timeS",
      body: "Open. Drag the slider \u2014 watch all four windows move." },
    // The axis pills. A control that REPLACES what's on screen rather
    // than adding to it is invisible until someone says it's there.
    //
    // Lights the whole brew window, not just the pills: what the pills
    // DO is swap what that window contains, so the window is the lesson
    // and the pills are the control. They take a terra outline and pulse
    // of their own to say which part to look at (tourTogglePulse in
    // BlendExtractionExplorer).
    // DEMONSTRATED, not described — one step per axis, the same shape as
    // the Simple/Detailed pair above and for the same reason. A timed
    // flip was the obvious alternative and is the worse one: a quick
    // reader moves on before it happens and never sees the swap, and a
    // slow one watches it cycle while trying to read. Tying it to Next
    // means the change happens when the user is looking at it.
    //
    // `axisMode` forces which slider is bound while the step is up (see
    // blendTourAxis in App.jsx) — the same demo-state mechanism as
    // familyMode and openControls.
    { target: "blend-axis", title: "Time or temperature", pad: 8, openControls: true,
      spotlight: ["blend-controls", "blend-sliders"], axisMode: "timeS",
      body: "One slider at a time. This is Time \u2014 how long the leaf sits in the water. Tap Next to see the other." },
    { target: "blend-axis", title: "Time or temperature", pad: 8, openControls: true,
      spotlight: ["blend-controls", "blend-sliders"], axisMode: "tempC",
      body: "And Temp \u2014 how hot the water is. The slider swaps with the pill; whichever you're not holding keeps its value." },
    // The recommended band. It sits right under the track and reads as
    // decoration until someone says otherwise — a coloured stripe among
    // coloured stripes. Placed straight after the drag, while the user
    // is still looking at the slider they just moved.
    //
    // openControls because the band only renders inside the open panel.
    // No spotlight list: the band alone is the subject. Folding the
    // whole slider block in made the union tall enough that the callout
    // had nowhere to sit but on top of it — covering the very thing the
    // step is describing.
    // The recommendation is painted INTO the track now — a coloured
    // stretch of the rail rather than a band beneath it — so the copy
    // points at the rail. The step lights the slider and the word under
    // it together: the highlight used to trace an invisible box laid
    // over the coloured span, which drew the outline of the band widget
    // this design had already removed. It read as a control, because
    // that is what it used to be.
    //
    // "Tap it" belongs to the word, not the rail — the rail has to stay
    // draggable — and the word MOVES the brew now rather than
    // explaining itself, which is what this copy has to say.
    { target: "blend-ranges", title: "The recommended range", pad: 6, openControls: true,
      familyMode: true,
      body: "The coloured stretch of the slider is where these leaves agree \u2014 brew inside it and every ingredient is working. It shifts as you change the other dial. Tap the word beneath to go straight there." },
    // Lights the WHOLE brew window and pulses the button inside it —
    // the same shape as the pills step. The window is what you've been
    // setting up across the last four steps; Brew is what you do with
    // it, so showing the button alone would cut it loose from everything
    // it commits.
    //
    // openControls for that reason only. Brew itself sits in the row's
    // header and survives folding — but the window can't be shown whole
    // while it's folded.
    //
    // Saving isn't mentioned: it moved to the steep screen, and naming
    // it here would send the user hunting for a button that isn't on
    // this screen.
    { target: "blend-brew", title: "Brew it", pad: 6, openControls: true,
      spotlight: ["blend-controls", "blend-sliders"],
      body: "Happy with it? Start the timer — the cup you've dialled in is the one you'll get." },
    /* PUT IT AWAY AGAIN, and say so.

       The tour opens the row at the slider step and leaves it open for
       five more, so the last thing anyone saw was a panel taking a
       third of the screen with no demonstration that it goes back. The
       fold IS taught, at step 7 — but that step runs before the panel
       has ever been open, so nobody has yet felt the want of closing
       it, and a fold explained before you want one is a fact rather
       than a skill.

       Ending here closes the loop: the row folds on the final step,
       which demonstrates the tap at the moment it's wanted and hands
       the screen back the way the user will actually leave it. */
    { target: "blend-controls", title: "And away", pad: 6, openControls: false,
      body: "Tap the row to fold it back down — your brew stays set, and the graphs get the screen. It's there whenever you want it." },
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

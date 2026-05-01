/* ──────────────────────────────────────────────────────────────
   data/seeds.js — seed data for testing UX at different user stages

   SEED_MODES defines three snapshots of app state that can be
   toggled between in the Dev section of Profile. Each represents
   a realistic point in a user's journey with the app:

   - power: established journal with several weeks of cups,
     saved blends, and a well-stocked pantry. The "what does
     the app look like for someone who's really using it" view.

   - mid: a couple weeks in, a handful of cups logged, one saved
     blend. The "getting-into-it but not deep yet" view.

   - new: fresh app launch, nothing logged or saved. The "first
     impression" view — tests that empty states work gracefully.

   The real app will have a single source of truth (persistence layer).
   This module is for development and UX evaluation only, and can
   remain in place as test fixtures even after persistence is added.
   ────────────────────────────────────────────────────────────── */

// Materialize seed journal entries: same idea as sessions — each
// carries an hoursAgo offset which resolves to a fresh ts +
// entry-<ts> id at apply time so the entries stay "recent" on
// every reset.
export function materializeSeedJournalEntries(rawEntries) {
  const now = Date.now();
  return (rawEntries || []).map(e => {
    const hoursAgo = typeof e.hoursAgo === "number" ? e.hoursAgo : 1;
    const ts = now - hoursAgo * 3600000;
    return {
      id: `entry-${ts}`,
      ts,
      kind: e.kind || "entry",
      text: e.text || "",
      note: e.note || "",
      currentMoods: e.currentMoods || [],
      landedMoods:  e.landedMoods  || [],
    };
  });
}

// Materialize seed planner items: hoursAgo → ts so each item's
// timestamp shifts forward on reset and the row order stays sane.
export function materializeSeedPlannerItems(rawItems) {
  const now = Date.now();
  return (rawItems || []).map((p, i) => {
    const hoursAgo = typeof p.hoursAgo === "number" ? p.hoursAgo : (i + 1);
    const ts = now - hoursAgo * 3600000;
    return {
      id: p.id || `plan-${ts}`,
      text: p.text || "",
      done: !!p.done,
      ts,
    };
  });
}

// Materialize seed sessions: each carries an `hoursAgo` offset (or
// `minutesAgo` for fine-grained "just brewed" seeds) which resolves
// to a fresh sess-<ms> id at apply time. Otherwise stored timestamps
// would drift further into the past on every reset and break the
// "recent 20 cups" window predicates.
//
// Pending-mood seeds (moodsPending=true) also need a fresh brewedAt
// stamp so the Home mood follow-up card's elapsed-time gate resolves
// correctly on every apply — without it, a seed brewed "11 minutes
// ago" would slowly age past the 24-hour window between resets.
export function materializeSeedSessions(rawSessions) {
  const now = Date.now();
  return (rawSessions || []).map((s, i) => {
    const offsetMs = typeof s.minutesAgo === "number"
      ? s.minutesAgo * 60000
      : (typeof s.hoursAgo === "number" ? s.hoursAgo : (i + 1)) * 3600000;
    const ts = now - offsetMs;
    const hoursAgo = offsetMs / 3600000;
    const ago = hoursAgo < 1  ? `${Math.max(1, Math.round(hoursAgo * 60))}m`
              : hoursAgo < 24 ? `${Math.round(hoursAgo)}h`
              : hoursAgo < 48 ? "yesterday"
              : `${Math.round(hoursAgo / 24)}d`;
    return {
      id: s.id || `sess-${ts}`,
      who: "you",
      blendId: s.blendId,
      ago,
      intent: s.intent || "",
      actual: s.actual || "",
      taste: s.taste ?? 4,
      note: s.note || "",
      currentMoods: s.currentMoods || [],
      targetMoods: s.targetMoods || [],
      // Pass-through fields for the post-brew flavor / pending-mood
      // shape introduced when the log split into "flavor at first
      // sip, mood on next return." Defaults keep older seeds working.
      moodsPending: !!s.moodsPending,
      brewedAt:    s.moodsPending ? ts : (s.brewedAt || ts),
      flavorsTasted: s.flavorsTasted || {},
      flavorsExtra:  s.flavorsExtra  || [],
      flavorsTarget: s.flavorsTarget || [],
    };
  });
}

export const SEED_MODES = {
  power: {
    label: "power user",
    description: "established journal — several weeks in, many titles unlocked",
    profile: {
      name: "Tommy",
      timeOfDay: ["morning", "afternoon", "evening"],
      draw: ["calm", "focus", "energy", "comfort"],
      flavors: ["floral", "earthy", "spiced", "smoky", "minty"],
    },
    // Sessions stored with hoursAgo so timestamps materialize fresh on
    // each apply (otherwise they'd drift further into the past every
    // reset). Newest first. Curated to trigger many titles at once.
    sessions: [
      // ── Today ──
      { hoursAgo: 1,    blendId: "dusk",            actual: "calm",      taste: 5, note: "Honeyed. Slept within 40 min.", currentMoods: ["anxious"], targetMoods: ["calm"] },
      { hoursAgo: 6,    blendId: "morning",         actual: "energy",    taste: 5, note: "Sharp morning lift.",          currentMoods: ["tired"],   targetMoods: ["energy", "focus"] },
      // ── Yesterday — multiple cups across times of day ──
      { hoursAgo: 22,   blendId: "wuyi-smoke",      actual: "energy",    taste: 4, note: "Pine fire afternoon.",                                     targetMoods: ["energy", "warming"] },
      { hoursAgo: 26,   blendId: "study",           actual: "focus",     taste: 4, note: "Good clarity at the desk.",     currentMoods: ["scattered"], targetMoods: ["focus"] },
      { hoursAgo: 31,   blendId: "all-heal",        actual: "sleepy",    taste: 5, note: "Slept by ten.",                                            targetMoods: ["sleepy"] },
      // ── 2 days ago ──
      { hoursAgo: 47,   blendId: "shou-puerh",      actual: "digestive", taste: 4, note: "Post-supper settled.",                                     targetMoods: ["digestive"] },
      { hoursAgo: 51,   blendId: "dusk",            actual: "calm",      taste: 5, note: "",                              currentMoods: ["wired"],    targetMoods: ["calm"] },
      // ── 3 days ago — Course-Corrector pattern ──
      { hoursAgo: 71,   blendId: "morning",         actual: "energy",    taste: 5, note: "Recovered the morning.",                                    targetMoods: ["energy"] },
      { hoursAgo: 75,   blendId: "morning",         actual: "energy",    taste: 2, note: "Under-steeped, harsh.",                                    targetMoods: ["energy"] },
      // ── 4 days ago ──
      { hoursAgo: 95,   blendId: "moroccan",        actual: "cooling",   taste: 5, note: "Three glasses, mint loud.",                                targetMoods: ["cooling"] },
      { hoursAgo: 101,  blendId: "chai",            actual: "warming",   taste: 4, note: "",                              currentMoods: ["cold"],     targetMoods: ["warming", "comfort"] },
      // ── 5 days ago — Witching Hour ──
      { hoursAgo: 117,  blendId: "dusk",            actual: "calm",      taste: 4, note: "23:00, the lamps were low.",                              targetMoods: ["calm"] },
      { hoursAgo: 124,  blendId: "study",           actual: "focus",     taste: 5, note: "Strong work session.",                                     targetMoods: ["focus"] },
      // ── 6 days ago ──
      { hoursAgo: 142,  blendId: "hearth",          actual: "comfort",   taste: 4, note: "",                              currentMoods: ["sad"],      targetMoods: ["comfort"] },
      { hoursAgo: 148,  blendId: "dusk",            actual: "calm",      taste: 5, note: "True Believer rotation.",                                  targetMoods: ["calm"] },
      // ── 7 days ago ──
      { hoursAgo: 168,  blendId: "morning",         actual: "energy",    taste: 4, note: "",                                                          targetMoods: ["energy"] },
      // ── 8-10 days ago ──
      { hoursAgo: 192,  blendId: "spring-tonic",    actual: "digestive", taste: 3, note: "Bitter — a lot of bitter today.",                          targetMoods: ["digestive"] },
      { hoursAgo: 218,  blendId: "tulsi-doorstep",  actual: "uplifting", taste: 5, note: "",                                                          targetMoods: ["uplifting"] },
      { hoursAgo: 240,  blendId: "dusk",            actual: "calm",      taste: 4, note: "",                                                          targetMoods: ["calm"] },
      // ── 11-14 days ago ──
      { hoursAgo: 270,  blendId: "darj-neat",       actual: "uplifting", taste: 5, note: "Muscatel, no milk.",                                       targetMoods: ["uplifting"] },
      { hoursAgo: 291,  blendId: "sencha-properly", actual: "focus",     taste: 4, note: "70°C, vegetal.",                                            targetMoods: ["focus"] },
      { hoursAgo: 313,  blendId: "throat-coat",     actual: "soothing",  taste: 4, note: "Sore throat day.",                                          targetMoods: ["soothing"] },
      { hoursAgo: 335,  blendId: "local-tomscalm",  actual: "calm",      taste: 5, note: "Self-Repeater #1.",                                         targetMoods: ["calm"] },
      // ── 15-21 days ago ──
      { hoursAgo: 360,  blendId: "local-tomscalm",  actual: "calm",      taste: 4, note: "Self-Repeater #2.",                                         targetMoods: ["calm"] },
      { hoursAgo: 384,  blendId: "hojicha-evening", actual: "comfort",   taste: 5, note: "",                                                          targetMoods: ["comfort"] },
      { hoursAgo: 410,  blendId: "wuyi-smoke",      actual: "warming",   taste: 4, note: "Smokesworn marker.",                                       targetMoods: ["warming"] },
      { hoursAgo: 432,  blendId: "golden-milk",     actual: "warming",   taste: 5, note: "Turmeric.",                                                 targetMoods: ["warming"] },
      { hoursAgo: 458,  blendId: "moroccan",        actual: "cooling",   taste: 4, note: "",                                                          targetMoods: ["cooling"] },
    ],
    savedBlendIds: [
      "dusk", "morning", "hearth", "study",
      "chai", "moroccan", "wuyi-smoke", "shou-puerh",
      "all-heal", "darj-neat", "sencha-properly",
      "local-tomscalm", "local-bright",
    ],
    favoriteBlendIds: [
      "dusk", "morning", "study", "wuyi-smoke", "moroccan", "local-tomscalm",
    ],
    pantryIds: [
      "chamomile", "lavender", "lemonbalm", "peppermint", "rooibos",
      "sencha", "assam", "ginger", "hibiscus", "rose",
      "cinnamon", "cardamom", "vanilla", "spearmint", "jasmine",
      "passionflower", "valerian", "tulsi", "fennel", "lapsang",
      "puerh", "matcha", "hojicha", "darjeeling",
    ],
    // Free-form journal entries with the mood-arc shape introduced
    // when the journal became a tea-meets-mood log. hoursAgo maps
    // to fresh ts at apply time the same way sessions do.
    journalEntries: [
      { hoursAgo: 4,   kind: "entry",
        text: "Quiet morning at the window. Read for an hour, didn't reach for the phone.",
        currentMoods: ["tired", "stressed"], landedMoods: ["calm"] },
      { hoursAgo: 28,  kind: "haiku",
        text: "amber afternoon —\nthe kettle's slow exhale,\na long, kept thought.",
        currentMoods: ["scattered", "anxious"], landedMoods: ["focus", "calm"] },
      { hoursAgo: 72,  kind: "limerick",
        text: "There once was a kettle in Maine\nWho whistled with each summer rain.\n   It hummed through the dusk\n   And smelled faintly of musk\nAnd softened the longest of days.",
        currentMoods: ["restless"], landedMoods: ["comfort"], note: "for the porch evening" },
      { hoursAgo: 192, kind: "entry",
        text: "Tried the Sencha cold-brewed. Won't go back to hot for July.",
        currentMoods: [], landedMoods: ["uplifting"] },
    ],
    // Planner — a few intentions for the day, mixed done/open so the
    // counter and clear-done flow have something to show.
    plannerItems: [
      { id: "plan-seed-1", text: "Brew a pot of Dusk Lullaby tonight",        done: false, hoursAgo: 1 },
      { id: "plan-seed-2", text: "Refill the chamomile jar",                  done: true,  hoursAgo: 8 },
      { id: "plan-seed-3", text: "Note how the morning Assam landed",         done: false, hoursAgo: 12 },
    ],
    // Tab-visit counts feed the first-visit / regular-visit
    // elemental triggers. Power user has logged plenty of laps.
    tabVisits: { home: 64, apothecary: 38, shelf: 27, profile: 9 },
    // Bestiary state — power user has welcomed (logged) a handful
    // of specimens and pinned three to the front page.
    seenElementalIds: ["first-brew", "ten-cups", "first-favorite", "first-apothecary", "first-shelf", "first-profile", "four-corners", "the-buzzed", "smokesworn", "the-druid"],
    featuredElementals: ["the-druid", "smokesworn", "the-buzzed"],
    // Flow flags — power user has seen and dismissed every
    // tutorial, summoned their unique elemental, and so on.
    omenShown: true,
    elementalsDisabled: false,
    favoritesMigrated: true,
    hints: {
      firstCupHintShown: true,
      composeHintShown:  true,
      journalHintShown:  true,
      profileHintShown:  true,
      pantryHintShown:   true,
      bestiaryHintShown: true,
      ingredientHintShown: true,
    },
    // User-composed blends — make Composer + Self-Repeater fire and
    // give the Catalogue a couple of "your composition" entries.
    generatedBlends: [
      {
        id: "local-tomscalm",
        name: "Tom's Calm Hour",
        subtitle: "tuned to your picks; brewed where each leaf is at its best",
        ingredients: [
          { id: "chamomile", g: 1.5 },
          { id: "lemonbalm", g: 1.0 },
          { id: "lavender",  g: 0.3, role: "accent" },
        ],
        tempC: 95, timeS: 480,
        mood: "calm", flavor: "floral",
        experimental: true, synthetic: false,
      },
      {
        id: "local-bright",
        name: "Bright Desk",
        subtitle: "tuned to your picks; brewed where each leaf is at its best",
        ingredients: [
          { id: "sencha",     g: 2.5 },
          { id: "lemonbalm",  g: 0.5, role: "accent" },
        ],
        tempC: 75, timeS: 90,
        mood: "focus", flavor: "grassy",
        style: "low-temp",
        experimental: true, synthetic: false,
      },
      // Legacy blendIds the power seed's session log references —
      // narrative names ("dusk", "morning", etc.) carried over from
      // earlier app versions when these were curated catalog blends.
      // They no longer live in BLENDS, so without these synthetic
      // hydrations, half the power-user's sessions would contribute
      // no flavor data to the mood-crystal aggregation. Each mirrors
      // the cup the seed's note implies: calm-evening / energy-morning
      // / focus-desk / comfort-roasted / sencha low-temp / throat
      // soothing / hojicha quiet / golden-milk warming.
      {
        id: "dusk", name: "Dusk",
        subtitle: "the evening calm cup",
        ingredients: [
          { id: "chamomile", g: 1.5 },
          { id: "lavender",  g: 0.5, role: "accent" },
          { id: "rose",      g: 0.3, role: "accent" },
        ],
        tempC: 95, timeS: 480,
        mood: "calm", flavor: "floral",
        experimental: true, synthetic: false,
      },
      {
        id: "morning", name: "Morning Lift",
        subtitle: "the first cup of the day",
        ingredients: [
          { id: "assam", g: 2.5 },
        ],
        tempC: 100, timeS: 240,
        mood: "energy", flavor: "earthy",
        experimental: true, synthetic: false,
      },
      {
        id: "study", name: "Desk Hours",
        subtitle: "the long focus cup",
        ingredients: [
          { id: "sencha", g: 2.0 },
          { id: "lemonbalm", g: 0.5, role: "accent" },
        ],
        tempC: 75, timeS: 90,
        mood: "focus", flavor: "grassy",
        experimental: true, synthetic: false,
      },
      {
        id: "hearth", name: "Hearth",
        subtitle: "the comfort cup, soft and round",
        ingredients: [
          { id: "rooibos", g: 2.0 },
          { id: "vanilla", g: 0.3, role: "accent" },
          { id: "cinnamon", g: 0.2, role: "accent" },
        ],
        tempC: 95, timeS: 360,
        mood: "comfort", flavor: "sweet",
        experimental: true, synthetic: false,
      },
      {
        id: "sencha-properly", name: "Sencha, Properly",
        subtitle: "70°C; the way the cup wants to read",
        ingredients: [
          { id: "sencha", g: 2.5 },
        ],
        tempC: 70, timeS: 60,
        mood: "focus", flavor: "umami",
        experimental: true, synthetic: false,
      },
      {
        id: "throat-coat", name: "Throat Coat",
        subtitle: "soothing for a sore throat",
        ingredients: [
          { id: "licorice-root", g: 1.0 },
          { id: "ginger",        g: 0.5, role: "accent" },
          { id: "lemon-peel",    g: 0.3, role: "accent" },
        ],
        tempC: 100, timeS: 600,
        mood: "soothing", flavor: "sweet",
        experimental: true, synthetic: false,
      },
      {
        id: "hojicha-evening", name: "Hojicha Evening",
        subtitle: "roasted leaves, low caffeine",
        ingredients: [
          { id: "hojicha", g: 2.5 },
        ],
        tempC: 95, timeS: 60,
        mood: "comfort", flavor: "roasted",
        experimental: true, synthetic: false,
      },
      {
        id: "golden-milk", name: "Golden Milk",
        subtitle: "turmeric warmed through",
        ingredients: [
          { id: "turmeric", g: 1.0 },
          { id: "ginger",   g: 0.5, role: "accent" },
          { id: "black-pepper", g: 0.05, role: "catalyst" },
          { id: "cinnamon", g: 0.3, role: "accent" },
        ],
        tempC: 95, timeS: 600,
        mood: "warming", flavor: "spiced",
        experimental: true, synthetic: false,
      },
    ],
  },

  mid: {
    label: "mid journey",
    description: "a couple weeks in — a handful of cups and one saved blend",
    sessions: [
      // Fresh pending-mood cup, just past the 10-minute gate so the
      // Home follow-up card surfaces immediately on apply. Lets the
      // dev profile demo the post-brew mood reflection flow without
      // having to actually brew and wait.
      { minutesAgo: 11, blendId: "all-heal", actual: "brewed", taste: 4,
        note: "First sip: honeyed and quiet.",
        currentMoods: ["wound up"], targetMoods: ["calm"],
        moodsPending: true,
        flavorsTarget: ["floral", "honeyed", "sweet"],
        flavorsTasted: { floral: true, honeyed: true, sweet: true },
        flavorsExtra: [] },
      { hoursAgo: 3,  blendId: "all-heal",        intent: "wound up", actual: "calm",      taste: 4, note: "Honeyed.", targetMoods: ["calm"] },
      { hoursAgo: 24, blendId: "all-heal",        intent: "keyed up", actual: "digestive", taste: 5, note: "",          targetMoods: ["calm"] },
      { hoursAgo: 72, blendId: "hojicha-evening", intent: "cold",     actual: "comfort",   taste: 3, note: "",          targetMoods: ["comfort"] },
    ],
    savedBlendIds: ["all-heal", "hojicha-evening"],
    favoriteBlendIds: ["all-heal"],
    pantryIds: ["chamomile", "lemonbalm", "lavender", "peppermint", "rooibos", "ginger", "rose"],
    journalEntries: [
      { hoursAgo: 6, kind: "entry",
        text: "First quiet evening of the week. Tried the all-heal blend and watched the light go.",
        currentMoods: ["tired"], landedMoods: ["calm"] },
    ],
    plannerItems: [],
    tabVisits: { home: 14, apothecary: 6, shelf: 4, profile: 2 },
    seenElementalIds: ["first-brew", "first-apothecary"],
    featuredElementals: [],
    omenShown: true,
    elementalsDisabled: false,
    favoritesMigrated: true,
    hints: {
      firstCupHintShown: true,
      composeHintShown:  true,
      journalHintShown:  true,
      profileHintShown:  false,
      pantryHintShown:   false,
      bestiaryHintShown: false,
      ingredientHintShown: false,
    },
  },

  new: {
    label: "new user",
    description: "just onboarded — favorites seeded, nothing logged yet",
    // freshlyOnboarded tells applySeedMode to materialize savedBlendIds,
    // favoriteBlendIds, and pantryIds via the same helpers handleOnboardingComplete
    // uses (pickSeedBlends + ONBOARDING_PANTRY), so this mode stays a faithful
    // mirror of what a real user sees the moment they finish onboarding.
    freshlyOnboarded: true,
    profile: {
      name: "Tommy",
      timeOfDay: ["evening"],
      draw: ["calm"],
      flavors: ["floral"],
    },
    sessions: [],
    journalEntries: [],
    plannerItems: [],
    tabVisits: {},
    seenElementalIds: [],
    featuredElementals: [],
    generatedBlends: [],
    omenShown: false,
    elementalsDisabled: false,
    hints: {
      firstCupHintShown: false,
      composeHintShown:  false,
      journalHintShown:  false,
      profileHintShown:  false,
      pantryHintShown:   false,
      bestiaryHintShown: false,
      ingredientHintShown: false,
    },
  },
};

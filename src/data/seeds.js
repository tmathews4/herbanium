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

export const SEED_MODES = {
  power: {
    label: "power user",
    description: "established journal — several weeks in",
    sessions: [
      // Your cups, most recent first
      { id: "y1", who: "you", blendId: "dusk",    ago: "2h",    intent: "wound up",   actual: "calm",    taste: 4, note: "Honeyed. Slept within 40 min." },
      { id: "y2", who: "you", blendId: "hearth",  ago: "yest.", intent: "rained-on",  actual: "settle",  taste: 4, note: "" },
      { id: "y3", who: "you", blendId: "morning", ago: "2d",    intent: "slow",       actual: "energy",  taste: 5, note: "" },
      { id: "y4", who: "you", blendId: "study",   ago: "3d",    intent: "scattered",  actual: "focus",   taste: 4, note: "Good clarity." },
      { id: "y5", who: "you", blendId: "dusk",    ago: "4d",    intent: "keyed up",   actual: "calm",    taste: 5, note: "" },
      { id: "y6", who: "you", blendId: "morning", ago: "5d",    intent: "flat",       actual: "energy",  taste: 3, note: "Under-steeped." },
      { id: "y7", who: "you", blendId: "hearth",  ago: "6d",    intent: "cold",       actual: "comfort", taste: 4, note: "" },
      { id: "y8", who: "you", blendId: "dusk",    ago: "1w",    intent: "wired",      actual: "calm",    taste: 4, note: "" },
      { id: "y9", who: "you", blendId: "moroccan", ago: "1w",   intent: "thirsty",    actual: "energy",  taste: 5, note: "Three rounds." },
    ],
    savedBlendIds: ["dusk", "morning", "hearth", "study"],
    pantryIds: [
      "chamomile", "lavender", "lemonbalm", "peppermint", "rooibos",
      "sencha", "assam", "ginger", "hibiscus", "rose",
      "cinnamon", "cardamom", "vanilla", "spearmint", "jasmine",
    ],
  },

  mid: {
    label: "mid journey",
    description: "a couple weeks in — a handful of cups and one saved blend",
    sessions: [
      { id: "my1", who: "you", blendId: "dusk",   ago: "3h",    intent: "wound up", actual: "calm",    taste: 4, note: "Honeyed." },
      { id: "my2", who: "you", blendId: "dusk",   ago: "yest.", intent: "keyed up", actual: "settle",  taste: 5, note: "" },
      { id: "my3", who: "you", blendId: "hearth", ago: "3d",    intent: "cold",     actual: "comfort", taste: 3, note: "" },
    ],
    savedBlendIds: ["dusk"],
    pantryIds: ["chamomile", "lemonbalm", "lavender", "peppermint", "rooibos", "ginger", "rose"],
  },

  new: {
    label: "new user",
    description: "just opened the app — nothing on any shelf",
    sessions: [],
    savedBlendIds: [],
    pantryIds: [],
  },
};

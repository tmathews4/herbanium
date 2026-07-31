/* ──────────────────────────────────────────────────────────────
   data/elementalRoller.js — chance-based elemental earning.

   Replaces the old deterministic predicate model where each
   elemental had an `earned: ctx => bool` and fired the moment its
   condition was met. New model: every action the user takes in the
   app (tab visits, brews, journal entries, recipe
   favorites, composed blends) has a small chance to roll an
   elemental from a pool tagged with that action. First-time users
   get a boost so the early elementals feels rewarding; once a few
   elementals are landed, the rate settles to a base level so the
   elementals stays a slow-accruing collection rather than a flood.

   The original predicates are still useful for one purpose: a
   one-time MIGRATION pass on first run with this new system, so
   any user (including the developer) who already had attribute-
   based earnings doesn't lose them when the model flips. After
   migration, predicates aren't consulted for new earns.

   Each elemental's display data (name, desc, glyph, frame, accent,
   tint, rarity) still comes from attributes.js — only the *when*
   has changed. The desc still hints at the action that earned it
   ("Drawn by your first step into the apothecarium"); now those
   hints describe the action *category* the roll fired on, not a
   specific milestone count.
   ────────────────────────────────────────────────────────────── */

// Action vocabulary. Each value is a string the action sites pass to
// rollOnAction; matched against an elemental's TRIGGER pool.
//   visit:apothecary  — opening the apothecarium tab
//   visit:shelf       — opening the notebook tab
//   visit:profile     — opening the profile tab
//   visit:home        — opening home (or arriving on it)
//   brew              — completing a brew log
//   journal           — saving a journal entry
//   favorite          — saving a blend to favorites
//   compose           — saving a user-composed blend
//   any               — generic pool, eligible on any action
export const ELEMENTAL_ACTIONS = [
  "visit:home", "visit:apothecary", "visit:shelf", "visit:profile",
  "brew", "journal", "favorite", "compose",
];

// Per-rarity weights for pool sampling. Lower-rarity elementals are
// more likely to be picked when a roll lands; rare/legendary/mythic
// stay scarce. Weights mirror the "75% rare / 20% legendary / 5%
// mythic" curve already used by the wild-elemental tier table, but
// here the roles are inverse (common most likely).
const RARITY_WEIGHT = {
  common:    50,
  uncommon:  25,
  rare:      14,
  legendary:  8,
  mythic:     3,
};

// Base chance per applicable action — small enough that no single
// session feels like elemental-grinding. With ~1-2 actions per
// minute of active use, this lands ~1 elemental every ~20 minutes
// of engagement on a fresh account, dropping to ~1 every 1-2 hours
// once the elementals has filled in.
const BASE_CHANCE = 0.045;  // 4.5%

// First-time boost. Users with 0 elementals earned roll at 4× base
// chance so the very first action they take has a reasonable shot
// at landing something. Tapers down as the elementals fills so the
// rate settles into the long-tail collecting rhythm.
function chanceMultiplier(earnedCount) {
  if (earnedCount === 0) return 4.0;
  if (earnedCount <= 2)  return 2.5;
  if (earnedCount <= 5)  return 1.6;
  return 1.0;
}

// Pity-timer multiplier. Once a user goes 12+ actions without a
// roll landing, the chance ramps up linearly so they don't sit in
// silence for weeks. Caps at 3× by ~24 dry actions. Resets to 0
// every time a roll lands. The intent isn't to rig the rate — it's
// to round off the long-tail droughts that the small base chance
// produces by accident.
const PITY_START = 12;
const PITY_FULL  = 24;
function pityMultiplier(dryStreak) {
  if (!dryStreak || dryStreak < PITY_START) return 1.0;
  const t = Math.min(1, (dryStreak - PITY_START) / (PITY_FULL - PITY_START));
  return 1.0 + 2.0 * t;  // 1.0 → 3.0 across the ramp
}

// Cooldown between rolls. Without this a user mashing tabs in
// quick succession (a real pattern when navigating around) could
// land 4 elementals in 10 seconds, which feels like a slot-machine
// payout rather than a quiet observation. 25 seconds keeps the
// pacing slow without making an active user feel locked out.
const ROLL_COOLDOWN_MS = 25 * 1000;

// Default action pool an elemental belongs to when no explicit
// trigger map is provided. The tab-visit elementals were the only
// ones with explicit visit predicates in the legacy file; everything
// else was brew-derived (mood/flavor/blend patterns) or journal-
// derived. So unspecified ids default to "brew" — matches the
// thematic origin of most elementals in the catalog.
const DEFAULT_TRIGGERS = ["brew"];

// Trigger overrides. Manually-curated mapping for ids whose action
// category isn't "brew." Anything not listed here defaults to brew.
// Comments name the predicate semantics so future editors can keep
// the categorization consistent.
const TRIGGER_OVERRIDES = {
  // ─── Tab-visit pool ────────────────────────────────────────
  "first-apothecary":   ["visit:apothecary"],
  "apothecary-regular": ["visit:apothecary"],
  "apothecary-walker":  ["visit:apothecary"],   // walks every aisle
  "apothecary-master":  ["visit:apothecary"],   // master of the aisles
  "first-shelf":        ["visit:shelf"],
  "shelf-regular":      ["visit:shelf"],
  "first-profile":      ["visit:profile"],
  "self-knower":        ["visit:profile"],      // mirror-spirit
  "four-corners":       ["any"],                // earned by app-wide use

  // ─── Compose / blend-design pool ──────────────────────────
  "compose-initiate":   ["compose"],
  "compose-master":     ["compose"],
  "lavandiere-life":    ["compose"],            // experiments

  // ─── Brew-flavor pool (formerly pantry-triggered) ─────────
  "hearth-keeper":      ["brew"],               // kettle kept lit for comfort
  "the-mineralist":     ["brew"],               // cups of root and rock
  "petal-drinker":      ["brew"],               // petals leading the kettle

  // ─── Favorites / library pool ─────────────────────────────
  "all-leaves":         ["favorite"],           // collected the catalog
  "polyglot-life":      ["favorite"],           // many traditions tasted
  "tradition-completionist": ["favorite"],

  // ─── Journal pool ─────────────────────────────────────────
  "morning-bird":       ["journal"],
  "verse-with-note":    ["journal"],
  "journal-streak":     ["journal"],
  "first-journal":      ["journal"],
  "free-writer":        ["journal"],
  "haikuist":           ["journal"],
  "limericker":         ["journal"],
  "poet":               ["journal"],

  // ─── Wild / cross-pool (any-action) ───────────────────────
  "wild-rated":         ["brew"],
  "wild-noted":         ["brew", "journal"],
  "wild-composed":      ["compose"],
  "wild-tradition":     ["favorite"],
};

// Resolve the trigger list for a given elemental.
export function triggersForId(id) {
  return TRIGGER_OVERRIDES[id] || DEFAULT_TRIGGERS;
}

// Eligible-elementals filter: those whose trigger pool covers the
// action AND that haven't already been rolled. Rarity-weighted pick
// runs against this list. The "any" pool is always eligible — it
// represents elementals that can land from any action.
function eligibleFor(action, allAttrs, earnedIds) {
  return allAttrs.filter(a => {
    if (earnedIds.has(a.id)) return false;
    const triggers = triggersForId(a.id);
    return triggers.includes(action) || triggers.includes("any");
  });
}

// Weighted random pick by rarity. Common-tier elementals dominate
// the pool so first-roll luck typically lands a low-rarity creature;
// rare/legendary/mythic surface with their natural scarcity. RNG
// passed in so tests can stub deterministic values.
function pickByRarity(pool, rng = Math.random) {
  if (pool.length === 0) return null;
  const totalWeight = pool.reduce(
    (s, a) => s + (RARITY_WEIGHT[a.rarity] || 1), 0);
  let r = rng() * totalWeight;
  for (const a of pool) {
    r -= RARITY_WEIGHT[a.rarity] || 1;
    if (r <= 0) return a;
  }
  return pool[pool.length - 1];
}

/**
 * Try to roll an elemental for the given action.
 *
 * @param {string} action       — one of ELEMENTAL_ACTIONS
 * @param {array}  allAttrs     — full attribute catalog (ATTRIBUTES from attributes.js)
 * @param {Set}    earnedIds    — ids already in the user's elementals
 * @param {number} lastRollAt   — ms timestamp of the previous roll, or 0
 * @param {number} now          — ms timestamp of this attempt (default Date.now())
 * @param {fn}     rng          — random source (default Math.random) — stub for tests
 * @returns {object|null}       — { id, action, ts } on hit, null otherwise
 */
export function rollOnAction(action, allAttrs, earnedIds, lastRollAt, now = Date.now(), rng = Math.random, dryStreak = 0) {
  if (!ELEMENTAL_ACTIONS.includes(action)) return null;
  if (now - (lastRollAt || 0) < ROLL_COOLDOWN_MS) return null;
  const pool = eligibleFor(action, allAttrs || [], earnedIds || new Set());
  if (pool.length === 0) return null;
  const earnedCount = (earnedIds && earnedIds.size) || 0;
  const chance = Math.min(
    1,
    BASE_CHANCE * chanceMultiplier(earnedCount) * pityMultiplier(dryStreak),
  );
  if (rng() >= chance) return null;
  const picked = pickByRarity(pool, rng);
  if (!picked) return null;
  return { id: picked.id, action, ts: now };
}

// Exposed for the migration path in App.jsx — evaluates the legacy
// predicates against current ctx and returns the set of ids that
// would have been earned under the old deterministic model. Called
// once on first run with this version, then never again.
export function legacyEarnedIds(allAttrs, ctx) {
  const ids = new Set();
  for (const a of allAttrs || []) {
    try {
      if (typeof a.earned === "function" && a.earned(ctx)) ids.add(a.id);
    } catch {
      // Predicate threw on missing field — skip it. Migration is
      // best-effort and shouldn't fail the app on a stale ctx shape.
    }
  }
  return ids;
}

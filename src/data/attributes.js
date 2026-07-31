/* ──────────────────────────────────────────────────────────────
   data/attributes.js — personality traits earned through cup patterns.

   Replaces the old simple badges system. Two windows are evaluated:
     - recent  (last 20 logged sessions) — patterns you're currently in
     - lifetime (all sessions) — milestones and long-arc traits

   Each attribute has:
     id      — stable string
     name    — display name (apothecary-poet voice)
     desc    — what your pattern reveals; shown in the detail card
     rarity  — common | uncommon | rare | legendary | mythic
     window  — "recent" | "lifetime"
     glyph   — key into ATTRIBUTE_GLYPHS for the icon
     tint    — color tone: sage | ochre | terra | plum | sky | ash
     frame   — circle | square | hex | diamond
     accent  — none | dot | star | crescent | rays
     earned  — predicate over evaluated context

   Visual identity per attribute is a procedural combination of glyph
   + frame + tint + accent (≈880 permutations) so the eye picks each
   out without us hand-drawing 80+ unique SVGs.
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "./ingredients.js";
import { getBlend } from "../helpers/misc.js";

const RECENT_WINDOW = 20;

function tsFromSession(s) {
  const n = parseInt(String(s?.id || "").replace("sess-", ""), 10);
  return Number.isFinite(n) ? new Date(n) : null;
}

function season(date) {
  const m = date.getMonth();
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  return "fall";
}

function timeOfDay(date) {
  const h = date.getHours();
  if (h < 5)  return "late-night";
  if (h < 11) return "morning";
  if (h < 14) return "midday";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "late-night";
}

function bump(map, key) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}

function buildWindow(sessions) {
  const ctx = {
    sessions, n: sessions.length,
    byMood: new Map(), byFlavor: new Map(), byTradition: new Map(),
    byStyle: new Map(), byIngredient: new Map(), byBlendId: new Map(),
    bySeason: new Map(), byTimeOfDay: new Map(),
    caffeinated: 0, caffeineFree: 0,
    ratings: [], distinctDays: new Set(),
  };
  sessions.forEach(s => {
    const ts = tsFromSession(s);
    if (ts) {
      ctx.distinctDays.add(ts.toISOString().slice(0, 10));
      bump(ctx.bySeason, season(ts));
      bump(ctx.byTimeOfDay, timeOfDay(ts));
    }
    if (typeof s.taste === "number") ctx.ratings.push(s.taste);
    const b = getBlend(s.blendId);
    if (!b) return;
    bump(ctx.byBlendId, b.id);
    if (b.mood) bump(ctx.byMood, b.mood);
    if (b.flavor) bump(ctx.byFlavor, b.flavor);
    if (b.tradition) bump(ctx.byTradition, b.tradition);
    if (b.style) bump(ctx.byStyle, b.style);
    (b.ingredients || []).forEach(i => bump(ctx.byIngredient, i.id));
    const caffeineMg = (b.ingredients || []).reduce((sum, i) => {
      const meta = INGREDIENTS[i.id];
      return sum + (meta?.caffeine || 0) * (i.g || 0);
    }, 0);
    if (caffeineMg > 0) ctx.caffeinated += 1;
    else ctx.caffeineFree += 1;
  });
  ctx.maxRepeat = ctx.byBlendId.size > 0 ? Math.max(...ctx.byBlendId.values()) : 0;
  ctx.distinctMoods = ctx.byMood.size;
  ctx.distinctFlavors = ctx.byFlavor.size;
  ctx.distinctTraditions = ctx.byTradition.size;
  ctx.distinctIngredients = ctx.byIngredient.size;
  return ctx;
}

export function buildAttributeContext({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, profile, journalEntries, tabVisits }) {
  const yourSessions = (sessions || []).filter(s => s.who === "you");
  const recentSessions = yourSessions.slice(0, RECENT_WINDOW);

  const lifetime = buildWindow(yourSessions);
  const recent = buildWindow(recentSessions);

  // Onboarding signals — used by archetype attributes that fire from
  // the user's first day. Normalize defaults so predicates stay terse.
  const onboarding = {
    moods:    new Set(profile?.draw    || []),
    flavors:  new Set(profile?.flavors || []),
    times:    new Set(profile?.timeOfDay || []),
    moodCount:   (profile?.draw    || []).length,
    flavorCount: (profile?.flavors || []).length,
  };

  // Earliest session → "lifelong" predicates compute days-since.
  let earliestTs = null;
  yourSessions.forEach(s => {
    const ts = tsFromSession(s);
    if (ts && (!earliestTs || ts < earliestTs)) earliestTs = ts;
  });
  const daysSinceFirst = earliestTs
    ? Math.floor((Date.now() - earliestTs.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const flowerIngsAll = Object.entries(INGREDIENTS)
    .filter(([, ing]) => ing.category === "flower").map(([id]) => id);
  const teaIngsAll = Object.entries(INGREDIENTS)
    .filter(([, ing]) => ing.category === "true tea").map(([id]) => id);
  const allIngs = Object.keys(INGREDIENTS);

  const composedCount = (generatedBlends || [])
    .filter(b => String(b.id || "").startsWith("local-")).length;

  // Journal-entry analysis. Free entries, haiku, limerick are all
  // counted; days, hours-of-day, and notes attached are tracked too.
  const entries = journalEntries || [];
  const entryByKind = (k) => entries.filter(e => e.kind === k);
  const journal = {
    total:      entries.length,
    free:       entryByKind("entry").length,
    haiku:      entryByKind("haiku").length,
    limerick:   entryByKind("limerick").length,
    withNote:   entries.filter(e => (e.note || "").trim().length > 0).length,
    daysSet:    new Set(entries.map(e =>
                  e.ts ? new Date(e.ts).toISOString().slice(0, 10) : null
                ).filter(Boolean)),
    nightHours: entries.filter(e => {
                  if (!e.ts) return false;
                  const h = new Date(e.ts).getHours();
                  return h >= 22 || h < 5;
                }).length,
    morningHours: entries.filter(e => {
                  if (!e.ts) return false;
                  const h = new Date(e.ts).getHours();
                  return h >= 5 && h < 9;
                }).length,
  };

  return {
    lifetime, recent, onboarding, daysSinceFirst,
    flowerIngsAll, teaIngsAll, allIngs,
    composedCount,
    favoriteBlendIds: favoriteBlendIds || new Set(),
    savedBlendIds:   savedBlendIds   || new Set(),
    journal,
    // Lifetime tab-visit counts — fuels the four-corners and
    // first-tab-visit elemental triggers. tabVisits comes in as a
    // plain object keyed by tab id; we expose handy aggregates.
    tabVisits: tabVisits || {},
    // Data-flow milestones — stamped on profile by the Export and
    // Import handlers in ProfileScreen.
    exportedAt: profile?.exportedAt || null,
    importedAt: profile?.importedAt || null,
  };
}

// Tab-visit predicate helper — returns true when the named tab has
// been opened at least `n` times. Defaults to `n=1` (first visit).
const tabVisitedAtLeast = (ctx, tabId, n = 1) =>
  (ctx.tabVisits?.[tabId] || 0) >= n;

// Use-based pick — fires when the user has actually brewed `threshold`
// or more recent cups whose blend matches the given mood and (optionally)
// one of the given flavors. Replaces the old onboarding-pick predicate
// so all archetypes/spirit-animals are earned through behavior, not the
// onboarding form. The unique creation title (Element-Gem-Creature) is
// the only thing the onboarding form grants directly.
const usePick = (ctx, mood, flavors, threshold = 3) =>
  ctx.recent.sessions.filter(s => {
    const b = getBlend(s.blendId);
    if (!b || b.mood !== mood) return false;
    if (flavors && flavors.length > 0 && !flavors.includes(b.flavor)) return false;
    return true;
  }).length >= threshold;

// Same as usePick but additionally requires the cup's hour fall in the
// given time-of-day bucket. Used by Lark / Bat / Dawn-Voyager type traits.
const usePickAtTime = (ctx, mood, flavors, todKey, threshold = 3) =>
  ctx.recent.sessions.filter(s => {
    const b = getBlend(s.blendId);
    if (!b || b.mood !== mood) return false;
    if (flavors && flavors.length > 0 && !flavors.includes(b.flavor)) return false;
    const ts = tsFromSession(s);
    return ts && timeOfDay(ts) === todKey;
  }).length >= threshold;

// Adjective prefix for colorable titles. Derives from the user's
// recent mood profile, with prestige overrides for rare patterns.
// Returns null when there's not enough recent data to characterize.
const MOOD_ADJECTIVES = {
  calm:      "Quiet",
  sleepy:    "Drowsy",
  soothing:  "Tender",
  cooling:   "Cool",
  focus:     "Clever",
  grounding: "Steady",
  energy:    "Feisty",
  warming:   "Burning",
  uplifting: "Joyful",
  comfort:   "Cozy",
  digestive: "Particular",
};

const MOODS_FOR_MATCH = ["calm","focus","energy","sleepy","comfort","soothing","warming","cooling","digestive","grounding","uplifting"];

export function getUserPrefix(ctx) {
  // Prestige overrides — checked first, rarest first.
  // Silver: high self-knowledge match rate over a meaningful sample.
  if (ctx.lifetime.n >= 10) {
    const matched = ctx.lifetime.sessions.filter(s => {
      const hit = (s.actual || "").toLowerCase();
      return MOODS_FOR_MATCH.includes(hit);
    }).length;
    if (matched / ctx.lifetime.n > 0.7) return "Silver";
  }
  // Wild: high range — many distinct ingredients in recent rotation.
  if (ctx.recent.distinctIngredients >= 18) return "Wild";
  // Silly: lots of self-composed blends (you play with the kettle).
  if (ctx.composedCount >= 5) return "Silly";
  // Stubborn: bitter cups dominate the recent rotation.
  if ((ctx.recent.byFlavor.get("bitter") || 0) >= 4) return "Stubborn";
  // Curious: many distinct blends in recent rotation.
  if (ctx.recent.byBlendId.size >= 12) return "Curious";

  // Base prefix — adjective for the dominant recent mood.
  if (ctx.recent.n < 5) return null;
  let topMood = null, topCount = 0;
  for (const [m, c] of ctx.recent.byMood) {
    if (c > topCount) { topMood = m; topCount = c; }
  }
  return MOOD_ADJECTIVES[topMood] || null;
}

export function applyPrefix(name, prefix) {
  if (!prefix) return name;
  return name.startsWith("The ") ? name.replace(/^The /, `The ${prefix} `) : `${prefix} ${name}`;
}

// Which titles accept a prefix. Spirit animals + rare/legendary/mythic
// titles get the adjective; common/uncommon non-animal titles stay
// neutral so the system doesn't bolt prefixes onto every label.
export function isColorable(attr) {
  if (attr.id.startsWith("spirit-")) return true;
  return attr.rarity === "rare" || attr.rarity === "legendary" || attr.rarity === "mythic";
}

// Predicate helpers — terse access to window data
const moodCount       = (w, m) => w.byMood.get(m) || 0;
const moodFamily      = (w, ms) => ms.reduce((s, m) => s + (w.byMood.get(m) || 0), 0);
const flavorCount     = (w, f) => w.byFlavor.get(f) || 0;
const flavorFamily    = (w, fs) => fs.reduce((s, f) => s + (w.byFlavor.get(f) || 0), 0);
const ingCount        = (w, id) => w.byIngredient.get(id) || 0;
const ingFamily       = (w, ids) => ids.reduce((s, id) => s + (w.byIngredient.get(id) || 0), 0);
const traditionMatches = (w, regex) => {
  let n = 0; for (const [k, v] of w.byTradition) if (regex.test(k)) n += v; return n;
};

const containsCategory = (sessions, category) =>
  sessions.every(s => {
    const b = getBlend(s.blendId);
    return b && (b.ingredients || []).some(i => INGREDIENTS[i.id]?.category === category);
  });

const noCategory = (sessions, category) =>
  sessions.every(s => {
    const b = getBlend(s.blendId);
    return b && !(b.ingredients || []).some(i => INGREDIENTS[i.id]?.category === category);
  });

// All attributes. Order roughly: common → mythic. Each has a unique
// glyph/tint/frame/accent combo so it reads distinct in the grid.
export const ATTRIBUTES = [
  // ─── Lifetime milestones ──────────────────────────────────
  { id: "first-brew", name: "The Newt", rarity: "common", window: "lifetime",
    glyph: "kettle", tint: "ochre", frame: "circle", accent: "none",
    desc: "Small spotted amphibian with eyes like dim coals. Drawn by the first kettle you ever lit.",
    earned: ctx => ctx.lifetime.n >= 1 },
  { id: "ten-cups", name: "The Sparrow", rarity: "common", window: "lifetime",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Plain brown bird, restless, watching from the eaves. Drawn by the steady habit of a kettle.",
    earned: ctx => ctx.lifetime.n >= 10 },
  { id: "half-centurion", name: "The Hippogriff", rarity: "rare", window: "lifetime",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "star",
    desc: "Eagle-headed, horse-bodied, half-tamed under a worn bridle. Drawn by patient handling, cup after cup.",
    earned: ctx => ctx.lifetime.n >= 50 },
  { id: "centurion", name: "The Roc", rarity: "rare", window: "lifetime",
    glyph: "comfort", tint: "terra", frame: "hex", accent: "star",
    desc: "Vast wings shadowing whole valleys. Drawn by cups stacked into a landscape over time.",
    earned: ctx => ctx.lifetime.n >= 100 },
  { id: "year-walker", name: "The Antlered Spirit", rarity: "legendary", window: "lifetime",
    glyph: "compass", tint: "plum", frame: "circle", accent: "rays",
    desc: "Antlered noble at the forest's quiet edge, ringed by the still beasts of the season-turn. Drawn by a year of seasons turned beside your kettle.",
    earned: ctx => ctx.daysSinceFirst >= 365 && ctx.lifetime.n >= 50 },
  { id: "decade-of-cups", name: "The World-Tree", rarity: "legendary", window: "lifetime",
    glyph: "scroll", tint: "plum", frame: "diamond", accent: "star",
    desc: "Vast wingless dragon coiled around the world's deep root. Drawn by cups grown into a single trunk over the seasons.",
    earned: ctx => ctx.lifetime.n >= 500 },
  { id: "compose-initiate", name: "The Sprite", rarity: "common", window: "lifetime",
    glyph: "focus", tint: "sage", frame: "square", accent: "none",
    desc: "Flicker of pale light at the leaf's edge. Drawn the moment your hand chose its own blend.",
    earned: ctx => ctx.composedCount >= 1 },
  { id: "compose-master", name: "The Daemon", rarity: "rare", window: "lifetime",
    glyph: "focus", tint: "plum", frame: "diamond", accent: "star",
    desc: "Robed silhouette, an inner voice given shape. Drawn by brewing again and again in your own grammar.",
    earned: ctx => ctx.composedCount >= 10 },
  { id: "apothecary-walker", name: "The Leshy", rarity: "uncommon", window: "lifetime",
    glyph: "leaf", tint: "sageDeep", frame: "hex", accent: "none",
    desc: "Bark-skinned forest-lord with a mossy beard, eyes deep as a forest pool. Drawn by long wandering through the leaf catalog.",
    earned: ctx => ctx.lifetime.distinctIngredients >= Math.floor(ctx.allIngs.length * 0.25) },
  { id: "apothecary-master", name: "The Wayfarer-Hare", rarity: "legendary", window: "lifetime",
    glyph: "leaf", tint: "plum", frame: "diamond", accent: "rays",
    desc: "White hare with knowing eyes, a small bundle of bound herbs at its paws. Drawn by a journey through half the apothecarium.",
    earned: ctx => ctx.lifetime.distinctIngredients >= Math.floor(ctx.allIngs.length * 0.5) },
  { id: "lavandiere-life", name: "The Naiad", rarity: "rare", window: "lifetime",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "star",
    desc: "River-nymph with water-dark hair, garlanded in wild blossom. Drawn by every blossom the catalog holds passing through your cup.",
    earned: ctx => ctx.flowerIngsAll.length > 0
      && ctx.flowerIngsAll.every(id => ctx.lifetime.byIngredient.has(id)) },
  { id: "all-leaves", name: "The Kirin", rarity: "legendary", window: "lifetime",
    glyph: "leaf", tint: "sageDeep", frame: "hex", accent: "rays",
    desc: "Scaled chimera with a flame mane and gentle hooves. Drawn by every true tea steeped in your kettle.",
    earned: ctx => ctx.teaIngsAll.length > 0
      && ctx.teaIngsAll.every(id => ctx.lifetime.byIngredient.has(id)) },
  { id: "polyglot-life", name: "The Trickster-Spider", rarity: "rare", window: "lifetime",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Patient weaver spinning stories on eight slow legs. Drawn by cups borrowed from many traditions.",
    earned: ctx => ctx.lifetime.distinctTraditions >= 3 },
  { id: "tradition-completionist", name: "The World-Tree Spirit", rarity: "mythic", window: "lifetime",
    glyph: "scroll", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Ancient banyan with hanging roots, each one its own trunk. Drawn by every traditional preparation rooted in your journal.",
    earned: ctx => {
      const traditions = new Set();
      ctx.lifetime.sessions.forEach(s => {
        const b = getBlend(s.blendId);
        if (b && b.tradition) traditions.add(b.tradition);
      });
      return traditions.size >= 14;
    } },
  { id: "self-knower", name: "The Sphinx", rarity: "legendary", window: "lifetime",
    glyph: "focus", tint: "sageDeep", frame: "circle", accent: "rays",
    desc: "Lion-bodied, wing-shouldered, riddle in the curl of her mouth. Drawn by your knack for naming what you need before the cup arrives.",
    earned: ctx => {
      const matched = ctx.lifetime.sessions.filter(s => {
        const hit = (s.actual || "").toLowerCase();
        return ["calm","focus","energy","sleepy","comfort","soothing","warming","cooling","digestive","grounding","uplifting"].includes(hit);
      }).length;
      return matched >= 25;
    } },

  // ─── Recent: time-of-day patterns ─────────────────────────
  { id: "dawn-steeper", name: "The Dawn-Lark", rarity: "common", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Long-lived bird that burns to ash and rises again from its own embers. Drawn by your kettle in the half-lit hour.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s); return ts && ts.getHours() < 7;
    }).length >= 4 },
  { id: "midnight-pourer", name: "The Lampad", rarity: "uncommon", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "crescent",
    desc: "Soundless wing emerging at the edge of a low candle. Drawn by your cup in the small hours.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s); return ts && ts.getHours() >= 22;
    }).length >= 3 },
  { id: "afternoon-constant", name: "The Day-Hawk", rarity: "uncommon", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "square", accent: "none",
    desc: "Hooded raptor circling the open hour at its highest arc. Drawn by your unfailing afternoon kettle.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s); return ts && ts.getHours() >= 13 && ts.getHours() < 16;
    }).length >= 5 },
  { id: "evening-familiar", name: "The Domovoi", rarity: "common", window: "recent",
    glyph: "soothing", tint: "plum", frame: "square", accent: "dot",
    desc: "Slow-blinking shape curled at the warm hearth-stone. Drawn by your cup at dusk, every dusk.",
    earned: ctx => (ctx.recent.byTimeOfDay.get("evening") || 0) >= 5 },

  // ─── Recent: seasonal × pattern ───────────────────────────
  { id: "snowqueen", name: "The Yuki-Onna", rarity: "rare", window: "recent",
    glyph: "cooling", tint: "sky", frame: "diamond", accent: "crescent",
    desc: "White-coated weasel slipping unseen across fresh frost. Drawn by menthol cups against winter dark.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "winter") return false;
      const tod = timeOfDay(ts);
      if (tod !== "evening" && tod !== "late-night") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "minty" || b.mood === "cooling");
    }).length >= 2 },
  { id: "summer-forager", name: "The Faun", rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Goat-legged dancer crowned in vine and citrus peel. Drawn by summer cups of petal, lemon, and chill.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "summer") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "floral" || b.flavor === "citrus" || b.flavor === "minty" || b.mood === "cooling");
    }).length >= 4 },
  { id: "autumn-hearth", name: "The Hearth-Cat", rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "none",
    desc: "Heavy-shouldered den-keeper warming itself at the year's last fire. Drawn by autumn cups of spice and quiet warmth.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "fall") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "spiced" || b.mood === "warming" || b.mood === "comfort");
    }).length >= 4 },
  { id: "spring-riser", name: "The Spring-Doe", rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "sage", frame: "circle", accent: "rays",
    desc: "Brown bird climbing the green sky on its own bright song. Drawn by the bright cups of a stretching year.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "spring") return false;
      const b = getBlend(s.blendId);
      return b && (b.mood === "uplifting" || b.flavor === "citrus");
    }).length >= 4 },

  // ─── Recent: mood-family patterns ─────────────────────────
  { id: "soft-hand", name: "The Moon-Doe", rarity: "common", window: "recent",
    glyph: "calm", tint: "sage", frame: "circle", accent: "none",
    desc: "Small grey bird with wings folded close along its sides. Drawn by your reach for the quiet cup.",
    earned: ctx => moodFamily(ctx.recent, ["calm","sleepy","soothing"]) >= 5 },
  { id: "restless-one", name: "The Wind-Spirit", rarity: "common", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Sharp-eyed raptor never long on the same branch. Drawn by a cup that keeps the hands moving.",
    earned: ctx => moodFamily(ctx.recent, ["focus","energy"]) >= 5 },
  { id: "hearth-keeper", name: "The Hearth-Spirit", rarity: "common", window: "recent",
    glyph: "warming", tint: "terra", frame: "square", accent: "none",
    desc: "Round-bellied burrower asleep by the warm hearth of the den. Drawn by a kettle kept lit for the home's comfort.",
    earned: ctx => moodFamily(ctx.recent, ["warming","comfort"]) >= 5 },
  { id: "sun-chaser", name: "The Sun-Spirit", rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Iridescent flicker following the brightest blossom across the day. Drawn by a cup that always reaches for the light.",
    earned: ctx => moodFamily(ctx.recent, ["uplifting","energy"]) >= 5 },
  { id: "convalescent", name: "The Healer-Serpent", rarity: "uncommon", window: "recent",
    glyph: "soothing", tint: "sage", frame: "square", accent: "dot",
    desc: "Carapaced traveler that outwalks the rush, patient as healing. Drawn by cups poured as gentle medicine.",
    earned: ctx => moodFamily(ctx.recent, ["soothing","digestive"]) >= 5 },
  { id: "grounded-one", name: "The Burden-Bear", rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "none",
    desc: "Vast-shouldered ancestor-bull rooted to the open plain. Drawn by a kettle that answers gravity.",
    earned: ctx => moodCount(ctx.recent, "grounding") >= 3 },
  { id: "cooler-headed", name: "The Halcyon", rarity: "uncommon", window: "recent",
    glyph: "cooling", tint: "sky", frame: "circle", accent: "crescent",
    desc: "River-roller floating on its back where the water runs cool. Drawn by cups that cool the room.",
    earned: ctx => moodCount(ctx.recent, "cooling") >= 3 },
  { id: "the-whitespace", name: "The Wisp", rarity: "rare", window: "recent",
    glyph: "calm", tint: "ash", frame: "diamond", accent: "none",
    desc: "White-bodied long-leg standing motionless in shallow water. Drawn by cups that leave space around themselves.",
    earned: ctx => moodCount(ctx.recent, "calm") >= 8 },

  // ─── Recent: flavor patterns ──────────────────────────────
  { id: "petal-drinker", name: "The Dryad", rarity: "common", window: "recent",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Tree-nymph with hair of leaves and pale bark skin. Drawn by petals leading the kettle.",
    earned: ctx => flavorCount(ctx.recent, "floral") >= 4 },
  { id: "the-mineralist", name: "The Gnome", rarity: "common", window: "recent",
    glyph: "grounding", tint: "ash", frame: "hex", accent: "none",
    desc: "Stooped earth-spirit with a small lantern in stone tunnels. Drawn by cups that taste of root and rock.",
    earned: ctx => flavorFamily(ctx.recent, ["earthy","woody","mineral"]) >= 4 },
  { id: "sweet-tooth", name: "The Melissa", rarity: "common", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Striped messenger with pollen on the legs and honey on the breath. Drawn by a kettle that always leans toward gold.",
    earned: ctx => flavorFamily(ctx.recent, ["sweet","honeyed"]) >= 4 },
  { id: "bitter-adept", name: "The Wormwood", rarity: "uncommon", window: "recent",
    glyph: "digestive", tint: "terra", frame: "hex", accent: "none",
    desc: "Pale-green hunter holding still on a dry stem. Drawn by cups taken honest, bitter and all.",
    earned: ctx => flavorCount(ctx.recent, "bitter") >= 3 },
  { id: "smokesworn", name: "The Tengu", rarity: "rare", window: "recent",
    glyph: "warming", tint: "ash", frame: "diamond", accent: "none",
    desc: "Grey shadow padding through pine smoke at the timberline. Drawn by the smell of woodsmoke in your cup.",
    earned: ctx => flavorCount(ctx.recent, "smoky") >= 2 },
  { id: "umami-initiate", name: "The Tanuki", rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "dot",
    desc: "Round-bellied trickster fox-dog with a clay sake gourd. Drawn by savory cups — broth without bone.",
    earned: ctx => flavorCount(ctx.recent, "umami") >= 3 },
  { id: "citrus-hand", name: "The Rainbow-Bird", rarity: "common", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Bright orange flash among the high green leaves. Drawn by the bright peel waiting at the cup's rim.",
    earned: ctx => flavorCount(ctx.recent, "citrus") >= 4 },
  { id: "spice-hand", name: "The Salamander", rarity: "common", window: "recent",
    glyph: "warming", tint: "terra", frame: "square", accent: "dot",
    desc: "Lizard curled inside a sleeping flame. Drawn by chai and the spice-road kettle.",
    earned: ctx => flavorCount(ctx.recent, "spiced") >= 4 },
  { id: "roast-devotee", name: "The Pyralis", rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "dot",
    desc: "Tiny moth that lives in the heart of an open fire. Drawn by cups pan-fired, sweet without honey.",
    earned: ctx => flavorCount(ctx.recent, "roasted") >= 3 },
  { id: "five-tongues-recent", name: "The Chimera", rarity: "legendary", window: "recent",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Lion, goat, and serpent grafted into a single beast. Drawn by a palate hungry for many tongues.",
    earned: ctx => ctx.recent.distinctFlavors >= 5 },

  // ─── Recent: ingredient patterns ──────────────────────────
  { id: "rose-companion", name: "The Rose-Nymph", rarity: "rare", window: "recent",
    glyph: "flower", tint: "terra", frame: "circle", accent: "star",
    desc: "Iridescent shell asleep at the heart of the open rose. Drawn by a kettle that keeps a garden inside it.",
    earned: ctx => ingCount(ctx.recent, "rose") >= 3 },
  { id: "mint-devotee", name: "The Mint-Nymph", rarity: "uncommon", window: "recent",
    glyph: "cooling", tint: "sage", frame: "circle", accent: "rays",
    desc: "Cold-skinned green sitter on a wet leaf. Drawn by cups of cool exhale.",
    earned: ctx => ingCount(ctx.recent, "peppermint") + ingCount(ctx.recent, "spearmint") >= 4 },
  { id: "chamomile-friend", name: "The Calm-Nymph", rarity: "common", window: "recent",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "none",
    desc: "Small hedgerow walker curled close in dry meadow flowers. Drawn by the small bedside flower returning to your cup.",
    earned: ctx => ingCount(ctx.recent, "chamomile") >= 3 },
  { id: "lavender-calm", name: "The Garden-Nymph", rarity: "uncommon", window: "recent",
    glyph: "calm", tint: "plum", frame: "circle", accent: "dot",
    desc: "Pale-winged drifter circling a candle in dusk-blue air. Drawn by camphor and quiet in the cup.",
    earned: ctx => ingCount(ctx.recent, "lavender") >= 3 },
  { id: "tea-faithful", name: "The Camellia", rarity: "uncommon", window: "recent",
    glyph: "leaf", tint: "sageDeep", frame: "hex", accent: "none",
    desc: "Slim singer hidden in the leaf, kept tuned to the camellia. Drawn by a kettle loyal to true tea.",
    earned: ctx => ctx.recent.n >= 5 && containsCategory(ctx.recent.sessions, "true tea") },
  { id: "herb-lover", name: "The Flora", rarity: "uncommon", window: "recent",
    glyph: "sprig", tint: "sage", frame: "circle", accent: "none",
    desc: "Brown-coated, soft-stepping, ear turned to the meadow. Drawn by cups built from herb alone.",
    earned: ctx => ctx.recent.n >= 5 && noCategory(ctx.recent.sessions, "true tea") },
  { id: "mushroom-whisperer", name: "The Hobgoblin", rarity: "rare", window: "recent",
    glyph: "grounding", tint: "plum", frame: "hex", accent: "dot",
    desc: "Squat woodland imp with a red-capped mushroom hat. Drawn by the slow medicine of mycelium.",
    earned: ctx => ingFamily(ctx.recent, ["reishi","lions-mane"]) >= 3 },
  { id: "adaptogen-initiate", name: "The Ent", rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "plum", frame: "square", accent: "none",
    desc: "Walking tree-shepherd that thinks in centuries. Drawn by the slow allies in your rotation.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const b = getBlend(s.blendId);
      return b && (b.ingredients || []).some(i => INGREDIENTS[i.id]?.category === "adaptogen");
    }).length >= 3 },
  { id: "ginger-hand", name: "The Hearth-Spirit", rarity: "common", window: "recent",
    glyph: "warming", tint: "terra", frame: "circle", accent: "rays",
    desc: "Lizard curled inside a sleeping flame, the warming root at its tail. Drawn by the warming root in the cold.",
    earned: ctx => ingCount(ctx.recent, "ginger") >= 4 },

  // ─── Recent: caffeine patterns ────────────────────────────
  { id: "the-buzzed", name: "The Trickster-Fox", rarity: "common", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Bushy-tailed scampering hoarder, never still on the bough. Drawn by a kettle that runs on tea-leaf adrenaline.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.caffeineFree === 0 },
  { id: "decaf-devotee", name: "The Hesychast", rarity: "common", window: "recent",
    glyph: "calm", tint: "sage", frame: "circle", accent: "none",
    desc: "Slow-armed climber dozing through the long green hours. Drawn by cups that carry no buzz.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.caffeinated === 0 },
  { id: "the-switcher", name: "The Two-Faced Spirit", rarity: "uncommon", window: "recent",
    glyph: "compass", tint: "ash", frame: "circle", accent: "dot",
    desc: "Black-and-white bird with one eye on dawn and one on dusk. Drawn by a kettle that matches the hour.",
    earned: ctx => ctx.recent.caffeinated >= 4 && ctx.recent.caffeineFree >= 4 },

  // ─── Recent: tradition patterns ───────────────────────────
  { id: "way-of-tea", name: "The Chajin", rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "none",
    desc: "White-bodied long-leg folding its slow ceremony in shallow water. Drawn by cups taken with stillness in the steam.",
    earned: ctx => traditionMatches(ctx.recent, /Japanese/i) >= 3 },
  { id: "south-born", name: "The Naga", rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "dot",
    desc: "Sharp-eyed coiled fighter at the foot of the warm spice tree. Drawn by the South-born cup of spice and slow heat.",
    earned: ctx => traditionMatches(ctx.recent, /South Asian|Ayurvedic/i) >= 3 },
  { id: "old-continent", name: "The Sidhe", rarity: "uncommon", window: "recent",
    glyph: "scroll", tint: "ochre", frame: "square", accent: "none",
    desc: "Striped grey digger keeping its slow burrow under the hedgerow. Drawn by an Old-Continent kettle still tending herbs.",
    earned: ctx => traditionMatches(ctx.recent, /European|Western/i) >= 3 },
  { id: "andean-path", name: "The Condor", rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "hex", accent: "rays",
    desc: "Vast-winged sentinel circling the high peaks. Drawn by yerba and the shared gourd.",
    earned: ctx => traditionMatches(ctx.recent, /South American/i) >= 1 },
  { id: "chinese-mountain", name: "The White-Tiger Spirit", rarity: "rare", window: "recent",
    glyph: "grounding", tint: "terra", frame: "diamond", accent: "none",
    desc: "White tiger of the West, guardian of the autumn mountain. Drawn by pu-erh, oolong, and the older patience.",
    earned: ctx => traditionMatches(ctx.recent, /Chinese/i) >= 2 },

  // ─── Recent: rhythm patterns ──────────────────────────────
  { id: "the-steady", name: "The Polestar", rarity: "common", window: "recent",
    glyph: "comfort", tint: "sage", frame: "square", accent: "dot",
    desc: "Heavy-yoked walker keeping the same furrow day after day. Drawn by a kettle that keeps showing up on its own days.",
    earned: ctx => ctx.recent.distinctDays.size >= 7 },
  { id: "binge-watcher", name: "The Hydra", rarity: "legendary", window: "recent",
    glyph: "kettle", tint: "ash", frame: "diamond", accent: "rays",
    desc: "Many-headed water serpent — cut one, two return. Drawn by a single day spent fully inside the cup.",
    earned: ctx => ctx.recent.n === 10 && ctx.recent.distinctDays.size === 1 },
  { id: "the-loyal", name: "The Many-Eyed Watcher", rarity: "uncommon", window: "recent",
    glyph: "heart", tint: "terra", frame: "circle", accent: "dot",
    desc: "Long-eared dog asleep across the doorway, never far from the kettle. Drawn by your steady return to the same well.",
    earned: ctx => ctx.recent.maxRepeat >= 5 },
  { id: "the-wanderer", name: "The Pooka", rarity: "rare", window: "recent",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Shape-shifting fae appearing as black horse, hare, and goat by turn. Drawn by a kettle never visiting the same shore twice.",
    earned: ctx => ctx.recent.n >= 10 && ctx.recent.byBlendId.size >= 10 },

  // ─── Recent: rating patterns ──────────────────────────────
  { id: "the-approver", name: "The Cherub", rarity: "common", window: "recent",
    glyph: "heart", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Red-breasted bird singing yes from a wet branch at the rain's end. Drawn by a string of cups you picked well.",
    earned: ctx => ctx.recent.ratings.filter(r => r >= 4).length >= 8 },
  { id: "honest-critic", name: "The Scale-Crane", rarity: "rare", window: "recent",
    glyph: "feather", tint: "terra", frame: "diamond", accent: "none",
    desc: "Lean desert dog at the hour of weighing, eyes level. Drawn by your truthful kettle.",
    earned: ctx => ctx.recent.ratings.filter(r => r <= 3).length >= 5 },
  { id: "steady-marker", name: "The Memory-Spirit", rarity: "rare", window: "recent",
    glyph: "compass", tint: "ash", frame: "square", accent: "dot",
    desc: "Flat-tailed builder placing every log at the same careful angle. Drawn by every cup the same shape of yes.",
    earned: ctx => ctx.recent.n >= 8 && ctx.recent.ratings.length === ctx.recent.n
      && ctx.recent.ratings.every(r => r === 4) },

  // ─── Recent: multi-condition rare ─────────────────────────
  { id: "morning-mountain", name: "The Sky-Dragon", rarity: "legendary", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "rays",
    desc: "Celestial sky-dragon coiled above the mountain at dawn. Drawn by aged leaf before the world wakes.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || ts.getHours() >= 9) return false;
      const b = getBlend(s.blendId);
      return b && (b.ingredients || []).some(i => /puerh|oolong|wuyi|lapsang/i.test(i.id));
    }).length >= 3 },
  { id: "sleepy-bee", name: "The Dream-Spirit", rarity: "rare", window: "recent",
    glyph: "bee", tint: "ochre", frame: "circle", accent: "crescent",
    desc: "Pale-winged drifter trailing pollen toward a dim candle. Drawn by honey at the rim before sleep.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const tod = timeOfDay(ts);
      if (tod !== "evening" && tod !== "late-night") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "honeyed" || b.flavor === "sweet");
    }).length >= 3 },
  { id: "post-meal-settler", name: "The Wholesome-Hare", rarity: "uncommon", window: "recent",
    glyph: "digestive", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Carapaced walker at the table's edge, in no hurry to move on. Drawn by the cup that settles the meal.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const h = ts.getHours();
      if (h < 13 || h > 16) return false;
      const b = getBlend(s.blendId);
      return b && (b.mood === "digestive" || b.flavor === "spiced");
    }).length >= 3 },
  { id: "diurnal-pendulum", name: "The Aeon-Spirit", rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Soundless wing taking the morning out and the evening in. Drawn by a kettle that swings between morning lift and evening rest.",
    earned: ctx => {
      let morning = 0, evening = 0;
      ctx.recent.sessions.forEach(s => {
        const ts = tsFromSession(s);
        const b = getBlend(s.blendId);
        if (!ts || !b) return;
        const h = ts.getHours();
        if (h < 12 && (b.mood === "energy" || b.mood === "focus" || b.mood === "uplifting")) morning++;
        if (h >= 19 && (b.mood === "calm" || b.mood === "sleepy" || b.mood === "soothing")) evening++;
      });
      return morning >= 3 && evening >= 3;
    } },
  { id: "solstice-soul", name: "The Solstice-Spirit", rarity: "mythic", window: "recent",
    glyph: "star", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Antlered noble standing at the year's hinge, breath rising in the still air. Drawn by a cup brewed close to the turn of the year.",
    earned: ctx => ctx.recent.sessions.some(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const m = ts.getMonth(), d = ts.getDate();
      const within = (mm, dd) => m === mm && Math.abs(d - dd) <= 7;
      return within(11, 21) || within(2, 20) || within(5, 21) || within(8, 23);
    }) },
  { id: "the-twin-cups", name: "The Twin-Spirits", rarity: "rare", window: "recent",
    glyph: "heart", tint: "plum", frame: "diamond", accent: "dot",
    desc: "Black-and-white pair flying the same hedge twice in one day. Drawn by twice the same cup at the same hour.",
    earned: ctx => {
      const byKey = new Map();
      ctx.recent.sessions.forEach(s => {
        const ts = tsFromSession(s);
        if (!ts) return;
        const key = `${s.blendId}|${ts.getHours()}|${ts.toISOString().slice(0, 10)}`;
        const dayKey = `${s.blendId}|${ts.getHours()}`;
        const days = byKey.get(dayKey) || new Set();
        days.add(ts.toISOString().slice(0, 10));
        byKey.set(dayKey, days);
      });
      for (const days of byKey.values()) if (days.size >= 2) return true;
      return false;
    } },

  // ─── Lifetime: rhythm and time ────────────────────────────
  { id: "lifelong-steeper", name: "The Memory-Crane", rarity: "legendary", window: "lifetime",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Ancient carapaced walker that has outwaited many seasons. Drawn by years of the same kettle.",
    earned: ctx => ctx.daysSinceFirst >= 730 },
  { id: "tea-veteran", name: "The Bodhisattva", rarity: "rare", window: "lifetime",
    glyph: "scroll", tint: "ochre", frame: "hex", accent: "star",
    desc: "One foot raised in the shallows, neck still as a tall reed across long evenings. Drawn by long stretches of days that ended in a cup.",
    earned: ctx => ctx.lifetime.distinctDays.size >= 60 },
  { id: "all-the-flowers", name: "The Flower-Nymphs", rarity: "legendary", window: "lifetime",
    glyph: "flower", tint: "ochre", frame: "diamond", accent: "rays",
    desc: "Striped traveler whose route has touched every blossom in the catalog. Drawn by every flower the catalog holds, fully visited.",
    earned: ctx => ctx.flowerIngsAll.length > 0
      && ctx.flowerIngsAll.every(id => ctx.lifetime.byIngredient.has(id)) },
  { id: "favorite-five", name: "The Household-Spirit", rarity: "common", window: "lifetime",
    glyph: "heart", tint: "terra", frame: "circle", accent: "dot",
    desc: "River-roller floating with small stones held against its belly. Drawn by the cups you keep close.",
    earned: ctx => ctx.favoriteBlendIds.size >= 5 },
  { id: "favorite-twenty", name: "The Scribe-Ibis", rarity: "rare", window: "lifetime",
    glyph: "heart", tint: "plum", frame: "hex", accent: "star",
    desc: "Black-and-white collector with a hoard of bright baubles in its hollow tree. Drawn by a well-stocked library of yes.",
    earned: ctx => ctx.favoriteBlendIds.size >= 20 },
  // ─── Vibe archetypes — earned through cup-logging behavior. The
  //     onboarding form no longer grants any of these directly; only
  //     the unique creation title (Element-Gem-Creature) is given on
  //     creation. These fire when your recent rotation matches the
  //     mood × flavor combo. ────────────────────────────────────────
  { id: "the-druid",         name: "The Druid",          rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "none",
    desc: "Round-eyed night hunter on soundless wings, watcher of the deep grove. Drawn by a kettle taken like a long sit on a moss bed.",
    earned: ctx => usePick(ctx, "calm", ["earthy", "smoky"]) },
  { id: "garden-walker",     name: "The Nymph",  rarity: "common", window: "recent",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Brown-coated soft-step among petals at first afternoon light. Drawn by slow afternoons in the garden.",
    earned: ctx => usePick(ctx, "calm", ["floral", "fruity"]) },
  { id: "cooling-hand",      name: "The Rusalka",   rarity: "uncommon", window: "recent",
    glyph: "cooling", tint: "sky", frame: "circle", accent: "crescent",
    desc: "One foot raised in the cool shallows, neck still as a reed. Drawn by yin in the cup.",
    earned: ctx => usePick(ctx, "calm", ["minty"]) },
  { id: "mountain-scribe",   name: "The Sennin", rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "ash", frame: "diamond", accent: "none",
    desc: "Long-eared mountain runner with a small ink pot at the cliff's edge. Drawn by a desk steady and leaves dark.",
    earned: ctx => usePick(ctx, "focus", ["earthy"]) },
  { id: "smoke-sage",        name: "The Smoke-Jaguar",     rarity: "legendary", window: "recent",
    glyph: "warming", tint: "ash", frame: "diamond", accent: "rays",
    desc: "Black-winged thinker on a fire-blackened branch above woodsmoke. Drawn by a mind that thinks best near woodsmoke.",
    earned: ctx => usePick(ctx, "focus", ["smoky"]) },
  { id: "the-sharpener",     name: "The Mind-Owl",      rarity: "rare", window: "recent",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "rays",
    desc: "Tufted-eared cat with gold eyes catching the smallest movement. Drawn by a cup taken to sharpen the mind.",
    earned: ctx => usePick(ctx, "focus", ["minty"]) },
  { id: "bright-mind",       name: "The Lyrebird",    rarity: "rare", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Iridescent flicker at the brightest blossom of the morning. Drawn by clean cognition — the morning of the mind.",
    earned: ctx => usePick(ctx, "focus", ["citrus", "fruity"]) },
  { id: "sun-sailor",        name: "The Sun-Hawk",     rarity: "rare", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Sharp-winged raptor riding the high-noon thermal. Drawn by lift taken like a sail takes wind.",
    earned: ctx => usePick(ctx, "energy", ["citrus", "fruity"]) },
  { id: "forge-hand",        name: "The Forge-Salamander",     rarity: "rare", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "star",
    desc: "Tusked, low-shouldered, throwing dust at the iron-shod root. Drawn by hot iron and steady force in your kettle.",
    earned: ctx => usePick(ctx, "energy", ["smoky"]) },
  { id: "the-caravan",       name: "The Wayfarer-Crane",        rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "circle", accent: "dot",
    desc: "Long-legged spice-walker pacing the warm road to the kettle. Drawn by chai cups smelling of long roads.",
    earned: ctx => usePick(ctx, "energy", ["spiced"]) },
  { id: "frost-runner",      name: "The Snow-Lynx",   rarity: "legendary", window: "recent",
    glyph: "cooling", tint: "sky", frame: "diamond", accent: "rays",
    desc: "Tufted-eared cat with wide paws on fresh snow, breath cold and quick. Drawn by cool kinetic — lift without heat.",
    earned: ctx => usePick(ctx, "energy", ["minty"]) },
  { id: "the-moonflower",    name: "The Moonflower-Nymph",     rarity: "uncommon", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "crescent",
    desc: "Pale-winged drifter at the open jasmine in lamplight. Drawn by bedside petals.",
    earned: ctx => usePick(ctx, "sleepy", ["floral"]) },
  { id: "the-lullaby",       name: "The Drowse-Bat",        rarity: "common", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "dot",
    desc: "Round-eyed watcher on soundless wings above a sleeping room. Drawn by sugared dusk in the cup.",
    earned: ctx => usePick(ctx, "sleepy", ["sweet"]) },
  { id: "the-rootbed",       name: "The Field-Doe",        rarity: "legendary", window: "recent",
    glyph: "grounding", tint: "plum", frame: "diamond", accent: "none",
    desc: "Velvet-coated burrower navigating the warm dark by feel alone. Drawn by a kettle that goes down to rise.",
    earned: ctx => usePick(ctx, "sleepy", ["earthy"]) },
  { id: "hearth-witch",      name: "The Wood-Crone",   rarity: "rare", window: "recent",
    glyph: "warming", tint: "terra", frame: "square", accent: "dot",
    desc: "Slim shape with green eyes asleep on the warm kitchen tile. Drawn by kitchen warmth and a cup as slow embrace.",
    earned: ctx => usePick(ctx, "comfort", ["spiced"]) },
  { id: "the-honeycake",     name: "The Reveler",      rarity: "common", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Striped messenger with a comb of gold at its center. Drawn by a kettle where honey lives in everything.",
    earned: ctx => usePick(ctx, "comfort", ["sweet"]) },
  { id: "the-wood-stove",    name: "The Ember-Keeper",     rarity: "rare", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "rays",
    desc: "Heavy-shouldered den-keeper drowsing beside the smoldering log. Drawn by smoldering ease — the cup smelling of home in winter.",
    earned: ctx => usePick(ctx, "comfort", ["smoky"]) },
  { id: "the-bittersmith",   name: "The Mandragora",    rarity: "uncommon", window: "recent",
    glyph: "digestive", tint: "ochre", frame: "hex", accent: "dot",
    desc: "Pale-green hunter holding still after the meal is cleared. Drawn by a cup taken as the meal's punctuation.",
    earned: ctx => usePick(ctx, "digestive", ["spiced"]) },
  { id: "the-apothecary-self", name: "The Crossroads-Wisp",   rarity: "rare", window: "recent",
    glyph: "mortar", tint: "terra", frame: "hex", accent: "star",
    desc: "Black-coated keeper with a bone needle, seed, and pebble lined up in the moss. Drawn by a cup taken like medicine.",
    earned: ctx => usePick(ctx, "digestive", ["earthy"]) },
  { id: "after-supper",      name: "The Hob",   rarity: "common", window: "recent",
    glyph: "digestive", tint: "sage", frame: "circle", accent: "dot",
    desc: "Long-eared dusk-walker with fennel between its paws. Drawn by fennel-and-mint clarity after the meal.",
    earned: ctx => usePick(ctx, "digestive", ["minty"]) },
  { id: "the-specialist",    name: "The Augur",     rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "dot",
    desc: "One foot raised in the shallows, eyes fixed on a single fish. Drawn by narrow and deep beating wide and thin.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.distinctFlavors > 0 && ctx.recent.distinctFlavors <= 2 },
  { id: "the-single-note",   name: "The Monad",    rarity: "rare", window: "recent",
    glyph: "key", tint: "sageDeep", frame: "diamond", accent: "none",
    desc: "Small spotted amphibian holding the still center of a single pond. Drawn by a cup for one thing, exactly.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.distinctMoods === 1 && ctx.recent.distinctFlavors === 1 },
  { id: "dawn-voyager",      name: "The Daylight-Lark",   rarity: "uncommon", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Brown bird climbing the dawn sky on its own bright song. Drawn by a kettle that meets the sun first.",
    earned: ctx => usePickAtTime(ctx, "energy", null, "morning", 3)
      || usePickAtTime(ctx, "focus", null, "morning", 3) },
  { id: "lamp-watcher",      name: "The Evening-Lamp Spirit",   rarity: "uncommon", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "crescent",
    desc: "Pale-winged drifter circling a low lantern in the violet hour. Drawn by a cup at the lowering light.",
    earned: ctx => usePickAtTime(ctx, "calm", null, "evening", 3)
      || usePickAtTime(ctx, "sleepy", null, "evening", 3) },
  { id: "afternoon-scholar", name: "The Scholar-Swan", rarity: "rare", window: "recent",
    glyph: "scroll", tint: "ochre", frame: "square", accent: "none",
    desc: "Slim shape asleep across an open book in the long afternoon. Drawn by a kettle that keeps the page open past three.",
    earned: ctx => usePickAtTime(ctx, "focus", null, "afternoon", 3) },
  { id: "the-all-hours",     name: "The Horae",      rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "star",
    desc: "Black-and-white collector at every hour of the day on a different bough. Drawn by a cup never kept in one drawer.",
    earned: ctx => ctx.recent.byTimeOfDay.size >= 3 && ctx.recent.n >= 5 },

  // ─── Spirit animals — totem creatures earned through your recent
  //     rotation's mood × flavor pattern. ───────────────────────────
  { id: "spirit-bear",        name: "The Bear",           rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "none",
    desc: "Heavy-shouldered den-keeper, root-fed, slow-breathing in the dark. Drawn by a cup taken like a long sleep.",
    earned: ctx => usePick(ctx, "comfort", ["earthy"]) },
  { id: "spirit-otter",       name: "The Otter",          rarity: "common", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "River-roller floating on its back with a small stone on its belly. Drawn by playful warmth — the cup as a summer swim.",
    earned: ctx => usePick(ctx, "comfort", ["fruity"]) },
  { id: "spirit-cardinal",    name: "The Cardinal",       rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "terra", frame: "circle", accent: "rays",
    desc: "Crested red flash on a bare winter branch, bold in the cold. Drawn by brightness held against the snow.",
    earned: ctx => usePick(ctx, "comfort", ["citrus"]) },
  { id: "spirit-salmon",      name: "The Salmon",         rarity: "rare", window: "recent",
    glyph: "warming", tint: "terra", frame: "diamond", accent: "rays",
    desc: "Silver-sided fish bending hard upstream against the current. Drawn by cups smelling of woodsmoke and home.",
    earned: ctx => usePick(ctx, "comfort", ["smoky"]) },
  { id: "spirit-owl",         name: "The Owl",            rarity: "rare", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "hex", accent: "crescent",
    desc: "Round eyes, soundless wings, head turned in the dark. Drawn by twilight wisdom — sight when the lamps are out.",
    earned: ctx => usePick(ctx, "sleepy", ["smoky"]) },
  { id: "spirit-whale",       name: "The Whale",          rarity: "legendary", window: "recent",
    glyph: "grounding", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Great body in slow drift, song threading the darkest water. Drawn by ancient cups — long song under deep dark.",
    earned: ctx => usePick(ctx, "sleepy", ["earthy"]) },
  { id: "spirit-lynx",        name: "The Lynx",           rarity: "legendary", window: "recent",
    glyph: "cooling", tint: "sky", frame: "diamond", accent: "crescent",
    desc: "Tufted ears, wide paws on snow, gold eyes catching low light. Drawn by solitary cups walked quiet in cold air.",
    earned: ctx => usePick(ctx, "sleepy", ["minty"]) },
  { id: "spirit-bee",         name: "The Bee",            rarity: "common", window: "recent",
    glyph: "bee", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Striped messenger humming between blossom and warm hive. Drawn by a kettle that is your daily honey.",
    earned: ctx => usePick(ctx, "energy", ["sweet"]) },
  { id: "spirit-hummingbird", name: "The Hummingbird",    rarity: "rare", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Iridescent flicker, wings a thousand a second above each blossom. Drawn by quick joy taken in petals.",
    earned: ctx => usePick(ctx, "energy", ["floral"]) },
  { id: "spirit-robin",       name: "The Robin",          rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "terra", frame: "circle", accent: "dot",
    desc: "Red-breasted bird singing on a wet branch at the rain's end. Drawn by cups that taste like spring.",
    earned: ctx => usePick(ctx, "energy", ["fruity"]) },
  { id: "spirit-boar",        name: "The Boar",           rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "none",
    desc: "Tusked, low-shouldered, rooted in the warm wallow. Drawn by forward force kept on the ground.",
    earned: ctx => usePick(ctx, "energy", ["earthy"]) },
  { id: "spirit-fox",         name: "The Fox",            rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Russet-coated, sharp-eared, light on its small white paws. Drawn by clever cups that sharpen the eye.",
    earned: ctx => usePick(ctx, "focus", ["citrus"]) },
  { id: "spirit-hawk",        name: "The Hawk",           rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "terra", frame: "diamond", accent: "rays",
    desc: "Sharp-eyed raptor circling on a thermal above the open field. Drawn by warm cups that steady the hand.",
    earned: ctx => usePick(ctx, "focus", ["spiced"]) },
  { id: "spirit-beaver",      name: "The Beaver",         rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "ochre", frame: "square", accent: "dot",
    desc: "Flat-tailed builder gnawing at logs in a slow brown river. Drawn by patient cups that finish what they start.",
    earned: ctx => usePick(ctx, "focus", ["sweet"]) },
  { id: "spirit-crane",       name: "The Crane",          rarity: "rare", window: "recent",
    glyph: "calm", tint: "ochre", frame: "diamond", accent: "rays",
    desc: "White-bodied long-leg standing motionless in shallow water. Drawn by patient ceremony folding time like paper.",
    earned: ctx => usePick(ctx, "calm", ["sweet"]) },
  { id: "spirit-stag",        name: "The Stag",           rarity: "rare", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "star",
    desc: "Antlered noble at the forest's quiet edge, breath visible. Drawn by cups carved by every season.",
    earned: ctx => usePick(ctx, "calm", ["spiced"]) },
  { id: "spirit-dove",        name: "The Dove",           rarity: "common", window: "recent",
    glyph: "calm", tint: "sage", frame: "circle", accent: "none",
    desc: "Small grey bird with wings folded close along its sides. Drawn by peace — the cup unhurried.",
    earned: ctx => usePick(ctx, "calm", ["floral"]) },
  { id: "spirit-magpie",      name: "The Magpie",         rarity: "rare", window: "recent",
    glyph: "digestive", tint: "ochre", frame: "diamond", accent: "dot",
    desc: "Black-and-white collector with a bright bauble caught in beak. Drawn by the strange bittersweet cups others discard.",
    earned: ctx => usePick(ctx, "digestive", ["sweet"]) },
  { id: "spirit-tortoise",    name: "The Tortoise",       rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "ash", frame: "hex", accent: "none",
    desc: "Carapaced traveler placing one foot, then the next, on stone. Drawn by ancient slow cups that outlive the rush.",
    earned: ctx => usePick(ctx, "digestive", ["earthy"]) },
  { id: "spirit-heron",       name: "The Heron",          rarity: "rare", window: "recent",
    glyph: "calm", tint: "sky", frame: "diamond", accent: "crescent",
    desc: "One foot raised in the shallows, neck still as a tall reed. Drawn by cups you wait beside.",
    earned: ctx => usePick(ctx, "calm", ["minty"]) },
  { id: "spirit-lark",        name: "The Lark",           rarity: "rare", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Brown bird climbing the morning sky on its own bright song. Drawn by cups that meet the sun.",
    earned: ctx => usePickAtTime(ctx, "energy", ["citrus"], "morning", 3) },
  { id: "spirit-bat",         name: "The Bat",            rarity: "legendary", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "diamond", accent: "crescent",
    desc: "Small dark wing emerging at the dusk's blue edge. Drawn by petals at the wing-tip and the dim light.",
    earned: ctx => usePickAtTime(ctx, "sleepy", ["floral"], "evening", 2) },
  { id: "spirit-elephant",    name: "The Elephant",       rarity: "rare", window: "recent",
    glyph: "comfort", tint: "ash", frame: "hex", accent: "none",
    desc: "Great-eared, long-trunked, slow-walking memory through warm grass. Drawn by warm cups carrying many flavors at once.",
    earned: ctx => usePick(ctx, "comfort", ["spiced"]) && ctx.recent.distinctFlavors >= 3 },

  // ─── Habit triggers — titles earned through patterns of when, how,
  //     and what the user brews. Reward rhythm, not volume. ─────────
  { id: "clockwork-cup", name: "The Time-Spirit", rarity: "rare", window: "recent",
    glyph: "compass", tint: "ash", frame: "diamond", accent: "dot",
    desc: "Slim singer keeping perfect time in the warm grass. Drawn by a kettle that keeps appointments.",
    earned: ctx => {
      const hours = new Map();
      ctx.recent.sessions.forEach(s => {
        const ts = tsFromSession(s);
        if (!ts) return;
        const h = ts.getHours();
        hours.set(h, (hours.get(h) || 0) + 1);
      });
      return [...hours.values()].some(v => v >= 5);
    } },
  { id: "course-corrector", name: "The Reckoner", rarity: "uncommon", window: "recent",
    glyph: "compass", tint: "sageDeep", frame: "circle", accent: "dot",
    desc: "Long-eared runner that turns clean off a wrong path. Drawn by a bad cup quickly answered with a better.",
    earned: ctx => {
      // Sessions are newest-first; pair[i] is newer than pair[i+1].
      for (let i = 0; i < ctx.recent.sessions.length - 1; i++) {
        const newer = ctx.recent.sessions[i];
        const older = ctx.recent.sessions[i + 1];
        if ((newer.taste ?? 0) >= 4 && (older.taste ?? 5) <= 2) return true;
      }
      return false;
    } },
  { id: "true-believer", name: "The Hierophant", rarity: "uncommon", window: "recent",
    glyph: "heart", tint: "terra", frame: "circle", accent: "star",
    desc: "Long-eared dog asleep at a single doorway it has chosen for life. Drawn by a cup that doesn't disappoint.",
    earned: ctx => {
      const byBlend = new Map();
      ctx.recent.sessions.forEach(s => {
        if (!s.blendId) return;
        const arr = byBlend.get(s.blendId) || [];
        arr.push(s.taste ?? 0);
        byBlend.set(s.blendId, arr);
      });
      for (const ratings of byBlend.values()) {
        if (ratings.length < 5) continue;
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        if (avg >= 4) return true;
      }
      return false;
    } },
  { id: "weather-vane", name: "The North-Wind", rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Long-billed bird turning its tall body to every shifting wind. Drawn by a kettle that meets each shifting day.",
    earned: ctx => {
      const recent7 = ctx.recent.sessions.slice(0, 7);
      const moods = new Set();
      recent7.forEach(s => (s.targetMoods || []).forEach(m => moods.add(m)));
      return moods.size >= 5;
    } },
  { id: "day-knowing", name: "The Oracle-Spirit", rarity: "rare", window: "recent",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Round-eyed watcher with a feather for every hour of the dim. Drawn by a cup for every hour.",
    earned: ctx => ctx.recent.byTimeOfDay.size >= 5 },
  { id: "versatile-hand", name: "The Shape-Shifter Spirit", rarity: "rare", window: "recent",
    glyph: "key", tint: "sageDeep", frame: "square", accent: "rays",
    desc: "Eight slow arms, each shaping the same cup a different way. Drawn by one cup that answers differently as the light shifts.",
    earned: ctx => {
      const blendTimes = new Map();
      ctx.recent.sessions.forEach(s => {
        const ts = tsFromSession(s);
        if (!ts || !s.blendId) return;
        const set = blendTimes.get(s.blendId) || new Set();
        set.add(timeOfDay(ts));
        blendTimes.set(s.blendId, set);
      });
      for (const set of blendTimes.values()) if (set.size >= 3) return true;
      return false;
    } },
  { id: "the-steadier", name: "The Caryatid", rarity: "uncommon", window: "recent",
    glyph: "calm", tint: "sage", frame: "circle", accent: "none",
    desc: "Heavy-yoked walker keeping the cart upright through the rough place in the road. Drawn by a cup held when the day turns jagged.",
    earned: ctx => ctx.recent.sessions.filter(s =>
      (s.currentMoods || []).some(m => ["anxious","stressed","restless","tired"].includes(m))
    ).length >= 3 },
  { id: "self-reader", name: "The Watcher", rarity: "rare", window: "recent",
    glyph: "feather", tint: "plum", frame: "square", accent: "dot",
    desc: "Black-eyed watcher counting the cards already laid. Drawn by your arrival at the cup already knowing where you stand.",
    earned: ctx => ctx.recent.sessions.filter(s =>
      (s.currentMoods || []).length >= 1
    ).length >= 5 },
  { id: "the-recorder", name: "The Scribe-Spirit", rarity: "uncommon", window: "recent",
    glyph: "scroll", tint: "ochre", frame: "square", accent: "dot",
    desc: "Black-and-white collector with a small bauble for every cup taken. Drawn by every cup leaving a small line behind it.",
    earned: ctx => ctx.recent.sessions.filter(s =>
      (s.note || "").trim().length > 0
    ).length >= 5 },
  { id: "witching-hour", name: "The Strega", rarity: "legendary", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "diamond", accent: "crescent",
    desc: "Soundless wing crossing the doorway of the day at midnight. Drawn by a cup at the seam between days.",
    earned: ctx => ctx.recent.sessions.some(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const h = ts.getHours();
      return h === 23 || h === 0;
    }) },
  { id: "unrepeating", name: "The Forgetting-Spirit", rarity: "uncommon", window: "recent",
    glyph: "compass", tint: "sageDeep", frame: "diamond", accent: "rays",
    desc: "Russet-coated wanderer never bedding down in the same hollow twice. Drawn by a kettle never visiting the same well twice.",
    earned: ctx => {
      const last5 = ctx.recent.sessions.slice(0, 5);
      const ids = new Set(last5.map(s => s.blendId).filter(Boolean));
      return last5.length === 5 && ids.size === 5;
    } },
  { id: "weekend-steeper", name: "The Kupala", rarity: "uncommon", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "River-roller floating on its back through unhurried days. Drawn by slow days that belong to the cup.",
    earned: ctx => {
      const last5 = ctx.recent.sessions.slice(0, 5);
      if (last5.length < 5) return false;
      return last5.every(s => {
        const ts = tsFromSession(s);
        if (!ts) return false;
        const d = ts.getDay();
        return d === 0 || d === 6;
      });
    } },
  { id: "working-steeper", name: "The Threshold-Spirit", rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "ash", frame: "square", accent: "none",
    desc: "Flat-tailed builder fitting one log a day, weekday after weekday. Drawn by a desk and a kettle keeping the same hours.",
    earned: ctx => {
      const last5 = ctx.recent.sessions.slice(0, 5);
      if (last5.length < 5) return false;
      return last5.every(s => {
        const ts = tsFromSession(s);
        if (!ts) return false;
        const d = ts.getDay();
        return d >= 1 && d <= 5;
      });
    } },
  { id: "long-steeper", name: "The Long-Lived", rarity: "rare", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "none",
    desc: "Carapaced walker waiting out the slow extraction. Drawn by slow extraction — leaves let to talk all the way.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.sessions.every(s => {
      const b = getBlend(s.blendId);
      return b && (b.timeS || 0) >= 360;
    }) },
  { id: "quick-cup", name: "The Eight-Legged Steed", rarity: "rare", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Long-eared runner whose flash through the meadow is already past. Drawn by a brisk hand — the leaf giving quickly.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.sessions.every(s => {
      const b = getBlend(s.blendId);
      return b && (b.timeS || 9999) < 180;
    }) },
  { id: "multi-ingredient-mind", name: "The Alchemist", rarity: "uncommon", window: "recent",
    glyph: "compass", tint: "ochre", frame: "diamond", accent: "dot",
    desc: "Eight slow arms each holding a different jar at the cluttered bench. Drawn by a kettle composed, not solo.",
    earned: ctx => {
      if (ctx.recent.n < 5) return false;
      let sum = 0, count = 0;
      ctx.recent.sessions.forEach(s => {
        const b = getBlend(s.blendId);
        if (!b) return;
        sum += (b.ingredients || []).length;
        count++;
      });
      return count > 0 && sum / count >= 4;
    } },
  { id: "pure-steeper", name: "The Brahman", rarity: "uncommon", window: "recent",
    glyph: "leaf", tint: "sageDeep", frame: "circle", accent: "none",
    desc: "Small spotted amphibian whole and singular in the still pool. Drawn by one leaf taken with full attention.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.sessions.every(s => {
      const b = getBlend(s.blendId);
      return b && (b.ingredients || []).length === 1;
    }) },
  { id: "daily-practice", name: "The Dervish", rarity: "rare", window: "recent",
    glyph: "comfort", tint: "terra", frame: "hex", accent: "star",
    desc: "Slim singer marking each day at exactly the same hour. Drawn by a kettle that is the calendar.",
    earned: ctx => {
      const today = new Date();
      const lastWeekDays = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        lastWeekDays.push(d.toISOString().slice(0, 10));
      }
      const cupDays = new Set();
      ctx.recent.sessions.forEach(s => {
        const ts = tsFromSession(s);
        if (ts) cupDays.add(ts.toISOString().slice(0, 10));
      });
      return lastWeekDays.every(d => cupDays.has(d));
    } },
  { id: "connoisseur", name: "The Vine-Reveler", rarity: "rare", window: "recent",
    glyph: "star", tint: "ochre", frame: "diamond", accent: "star",
    desc: "Slim shape with green eyes that have seen the best cups several times over. Drawn by several cups that earned the highest mark.",
    earned: ctx => {
      const fiveStarBlends = new Set();
      ctx.recent.sessions.forEach(s => {
        if ((s.taste ?? 0) === 5 && s.blendId) fiveStarBlends.add(s.blendId);
      });
      return fiveStarBlends.size >= 3;
    } },
  { id: "self-repeater", name: "The Ouroboros", rarity: "rare", window: "lifetime",
    glyph: "heart", tint: "plum", frame: "circle", accent: "dot",
    desc: "Serpent swallowing its own tail, the unbroken circle closed. Drawn by your hand returning to its own brew.",
    earned: ctx => {
      const localCounts = new Map();
      ctx.lifetime.sessions.forEach(s => {
        if (s.blendId && String(s.blendId).startsWith("local-")) {
          localCounts.set(s.blendId, (localCounts.get(s.blendId) || 0) + 1);
        }
      });
      for (const c of localCounts.values()) if (c >= 2) return true;
      return false;
    } },

  // ─── Workflow spirits — earned by exploring app paths users may
  //     overlook: catalogue-curation, pantry-curation, mood/flavor
  //     completionism, true-tea breadth, decoction patience. Each is
  //     tied to a specific UI flow so the spirit becomes a reason to
  //     try something the user hasn't done yet. ─────────────────────
  { id: "odin", name: "The Wanderer-Raven", rarity: "legendary", window: "lifetime",
    glyph: "scroll", tint: "plum", frame: "diamond", accent: "star",
    desc: "Long wingless dragon resting on a hoard of kept brews. Drawn by your own composed blends gathering in your catalogue.",
    earned: ctx => {
      let n = 0;
      for (const id of ctx.savedBlendIds) if (String(id).startsWith("local-")) n++;
      return n >= 15;
    } },
  { id: "feng-huang", name: "The Phoenix-Crane", rarity: "legendary", window: "lifetime",
    glyph: "leaf", tint: "ochre", frame: "hex", accent: "rays",
    desc: "Five-coloured phoenix of Chinese myth, plumage holding every direction. Drawn by a kettle that has brewed white, green, oolong, black, and pu-erh — every face of the leaf.",
    earned: ctx => {
      const byI = ctx.lifetime.byIngredient;
      const has = ids => ids.some(id => byI.has(id));
      return has(["white"])
        && has(["sencha","gyokuro","matcha","genmaicha","gunpowder","hojicha","dragonwell"])
        && has(["oolong"])
        && has(["assam","darjeeling","ceylon","lapsang"])
        && has(["puerh"]);
    } },
  { id: "kitsune", name: "The Kitsune", rarity: "rare", window: "lifetime",
    glyph: "sprig", tint: "terra", frame: "circle", accent: "dot",
    desc: "Nine-tailed fox of Japanese myth, guardian of the inari rice-stores and a thousand small kept gifts. Drawn by a deep library of blends kept close to the heart.",
    earned: ctx => (ctx.favoriteBlendIds?.size || 0) >= 15 },
  { id: "xuanwu", name: "The Black-Tortoise Spirit", rarity: "legendary", window: "lifetime",
    glyph: "compass", tint: "ash", frame: "hex", accent: "none",
    desc: "Black Tortoise of Chinese myth, intertwined with serpent, guardian of the north and of completed cycles. Drawn by a kettle that has answered most of the moods the leaf can name.",
    earned: ctx => ctx.lifetime.byMood.size >= 9 },
  { id: "hoopoe", name: "The Hoopoe", rarity: "uncommon", window: "lifetime",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Crowned multicoloured bird of Persian and Egyptian myth, leader of all birds in flight. Drawn by a kettle that has tasted every flavour family the catalogue holds.",
    earned: ctx => ctx.lifetime.distinctFlavors >= 8 },
  { id: "zaratan", name: "The Zaratan", rarity: "rare", window: "lifetime",
    glyph: "heart", tint: "plum", frame: "diamond", accent: "dot",
    desc: "Vast island-turtle of medieval bestiaries, an entire small world resting on its back. Drawn by a deep catalogue of cups kept close.",
    earned: ctx => ctx.savedBlendIds.size >= 30 },
  { id: "cu-sith", name: "The Cu Sith", rarity: "uncommon", window: "lifetime",
    glyph: "heart", tint: "sage", frame: "circle", accent: "star",
    desc: "Green-furred fairy hound of Scottish folklore, silent on the moor at dusk. Drawn by your own composed blend earning the highest mark from your own hand.",
    earned: ctx => ctx.lifetime.sessions.some(s =>
      s.taste === 5 && String(s.blendId || "").startsWith("local-")) },
  { id: "cetus", name: "The Cetus", rarity: "rare", window: "lifetime",
    glyph: "grounding", tint: "sky", frame: "diamond", accent: "none",
    desc: "Great Greek sea-monster the constellation is named for, slow as deep water. Drawn by long decoctions taken with the patience root and bark require.",
    earned: ctx => ctx.lifetime.sessions.filter(s => {
      const b = getBlend(s.blendId);
      return b && (b.timeS || 0) >= 900;
    }).length >= 5 },

  // ─── Data-flow spirits — earned by exporting or importing your
  //     journal, so the backup workflow becomes its own discovery. ──
  { id: "caladrius", name: "The Caladrius", rarity: "uncommon", window: "lifetime",
    glyph: "feather", tint: "sky", frame: "circle", accent: "rays",
    desc: "White bird of Roman lore, said to draw away what ails the patient and carry it skyward into the sun. Drawn by exporting your journal — the cup's record carried out to safekeeping.",
    earned: ctx => !!ctx.exportedAt },
  { id: "bennu", name: "The Bennu", rarity: "rare", window: "lifetime",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "star",
    desc: "Egyptian heron-form phoenix said to have risen at the world's first sunrise. Drawn by importing a saved journal — the kettle restored to its full memory.",
    earned: ctx => !!ctx.importedAt },

  // ─── Journal spirits — earned through the journal itself, the
  //     surface that holds cups, free entries, and verses in time. ──
  { id: "first-entry", name: "The Inkling", rarity: "common", window: "lifetime",
    glyph: "feather", tint: "ochre", frame: "circle", accent: "none",
    desc: "Small bright spark at the edge of a thought. Drawn by writing the first entry in your journal.",
    earned: ctx => (ctx.journal?.total || 0) >= 1 },
  { id: "ten-entries", name: "The Scrivener", rarity: "uncommon", window: "lifetime",
    glyph: "scroll", tint: "ochre", frame: "square", accent: "dot",
    desc: "Cloaked figure bent at a desk with a pale candle. Drawn by entries put down in your journal, one after another.",
    earned: ctx => (ctx.journal?.total || 0) >= 10 },
  { id: "fifty-entries", name: "The Annal", rarity: "rare", window: "lifetime",
    glyph: "scroll", tint: "plum", frame: "diamond", accent: "star",
    desc: "Long bound book whose pages have started to dog-ear. Drawn by entries piling into a real record.",
    earned: ctx => (ctx.journal?.total || 0) >= 50 },
  { id: "first-haiku", name: "The Cicada", rarity: "common", window: "lifetime",
    glyph: "leaf", tint: "sage", frame: "circle", accent: "rays",
    desc: "Pale-shelled singer in the high summer trees. Drawn by your first haiku ad-lib.",
    earned: ctx => (ctx.journal?.haiku || 0) >= 1 },
  { id: "first-limerick", name: "The Wagtail", rarity: "common", window: "lifetime",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Long-tailed bird that walks the riverbank in jaunty rhythm. Drawn by your first limerick ad-lib.",
    earned: ctx => (ctx.journal?.limerick || 0) >= 1 },
  { id: "five-haiku", name: "The Cricket", rarity: "uncommon", window: "lifetime",
    glyph: "leaf", tint: "sageDeep", frame: "circle", accent: "none",
    desc: "Hidden-in-the-grass musician, only the chirp visible. Drawn by haiku ad-libs woven from your prompts, again and again.",
    earned: ctx => (ctx.journal?.haiku || 0) >= 5 },
  { id: "five-limerick", name: "The Linnet", rarity: "uncommon", window: "lifetime",
    glyph: "uplifting", tint: "terra", frame: "circle", accent: "rays",
    desc: "Small finch that chains rhyme into rhyme through hedgerow afternoons. Drawn by limericks woven from your prompts, again and again.",
    earned: ctx => (ctx.journal?.limerick || 0) >= 5 },
  { id: "verse-virtuoso", name: "The Octopus", rarity: "rare", window: "lifetime",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Eight arms, each writing in a different hand. Drawn by composing in both haiku and limerick modes.",
    earned: ctx => (ctx.journal?.haiku || 0) >= 1 && (ctx.journal?.limerick || 0) >= 1 },
  { id: "night-owl-scribe", name: "The Owl-Scribe", rarity: "uncommon", window: "lifetime",
    glyph: "sleepy", tint: "plum", frame: "diamond", accent: "crescent",
    desc: "Round-eyed watcher with a quill, awake in the dim. Drawn by writing a journal entry between 10pm and 5am.",
    earned: ctx => (ctx.journal?.nightHours || 0) >= 1 },
  { id: "morning-scribe", name: "The Lark-Scribe", rarity: "uncommon", window: "lifetime",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Brown bird climbing the morning sky on its own song. Drawn by writing a journal entry before nine in the morning.",
    earned: ctx => (ctx.journal?.morningHours || 0) >= 1 },
  { id: "verse-with-note", name: "The Margin-Cat", rarity: "uncommon", window: "lifetime",
    glyph: "feather", tint: "sage", frame: "square", accent: "dot",
    desc: "Sleek visitor that curls along the edge of the page where annotations live. Drawn by attaching a note to one of your verses.",
    earned: ctx => (ctx.journal?.withNote || 0) >= 1 },
  { id: "journal-streak", name: "The Lapwing", rarity: "rare", window: "lifetime",
    glyph: "compass", tint: "sageDeep", frame: "diamond", accent: "rays",
    desc: "Crested wading bird that returns to the same field each evening. Drawn by returning to the journal day after day.",
    earned: ctx => (ctx.journal?.daysSet?.size || 0) >= 7 },

  // ─── Tab-visit elementals — basic introductory triggers earned just
  //     by exploring the four surfaces of the app. Names are mapped to
  //     creatures via CREATURE_OVERRIDES and surface as
  //     "The {adjective} {creature}" for each user. ──────────────────
  { id: "first-apothecary", name: "The Stoat", rarity: "common", window: "lifetime",
    glyph: "leaf", tint: "ochre", frame: "circle", accent: "none",
    desc: "Sleek hunter that pokes its head into every burrow at the meadow's edge. Drawn by your first step into the apothecarium.",
    earned: ctx => tabVisitedAtLeast(ctx, "apothecary", 1) },
  { id: "apothecary-regular", name: "The Mole", rarity: "uncommon", window: "lifetime",
    glyph: "leaf", tint: "sage", frame: "hex", accent: "dot",
    desc: "Velvet-coated burrower keeping a dozen tunnels in the same dark soil. Drawn by returning to the apothecarium, again and again.",
    earned: ctx => tabVisitedAtLeast(ctx, "apothecary", 10) },
  // Internal tab id stays "shelf" — that's the long-lived visit-counter
  // key from before the rename. User-facing copy uses the new name
  // "notebook" so the description matches the bottom-tab label.
  { id: "first-shelf", name: "The Magpie-Visitor", rarity: "common", window: "lifetime",
    glyph: "scroll", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Black-and-white collector turning the pages of an open book left in the rain. Drawn by your first visit to the notebook.",
    earned: ctx => tabVisitedAtLeast(ctx, "shelf", 1) },
  { id: "shelf-regular", name: "The Squirrel-Keeper", rarity: "uncommon", window: "lifetime",
    glyph: "scroll", tint: "terra", frame: "square", accent: "dot",
    desc: "Bushy-tailed hoarder thumbing the same handful of pages, again and again. Drawn by returning to the notebook to take stock.",
    earned: ctx => tabVisitedAtLeast(ctx, "shelf", 10) },
  { id: "first-profile", name: "The Mirror-Hare", rarity: "common", window: "lifetime",
    glyph: "feather", tint: "plum", frame: "circle", accent: "rays",
    desc: "Long-eared figure pausing at the still pool to read its own reflection. Drawn by your first step into your own profile.",
    earned: ctx => tabVisitedAtLeast(ctx, "profile", 1) },
  { id: "four-corners", name: "The Wandering-Fox", rarity: "uncommon", window: "lifetime",
    glyph: "compass", tint: "ochre", frame: "diamond", accent: "rays",
    desc: "Russet-coated walker who has set foot in every corner of the wood. Drawn by visiting all four surfaces — home, apothecarium, notebook, profile.",
    earned: ctx =>
         tabVisitedAtLeast(ctx, "home", 1)
      && tabVisitedAtLeast(ctx, "apothecary", 1)
      && tabVisitedAtLeast(ctx, "shelf", 1)
      && tabVisitedAtLeast(ctx, "profile", 1) },

  // ─── Wild-pool elementals — `random: true` means BOTH the
  //     adjective and the creature noun are drawn from the wild
  //     pools (no controlled aspect). The user gets a different
  //     surprise per trigger; same user always sees the same
  //     surprise for the same trigger. Predicates fire on first-
  //     time small actions distributed across the app. ─────────────
  { id: "wild-rated", name: "Wild-Rated", rarity: "uncommon", window: "lifetime",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "star",
    random: true,
    desc: "An elemental from the wild pool — neither chosen nor named beforehand. Drawn by the first rating you set on a cup.",
    earned: ctx => (ctx.lifetime?.ratings || []).length >= 1 },
  { id: "wild-noted", name: "Wild-Noted", rarity: "uncommon", window: "lifetime",
    glyph: "feather", tint: "sage", frame: "circle", accent: "star",
    random: true,
    desc: "An elemental drawn from no roster — only what the kettle's edge offered. Drawn by the first note you tied to a cup.",
    earned: ctx => ctx.lifetime?.sessions?.some?.(s => (s.note || "").trim().length > 0) || false },
  { id: "wild-composed", name: "Wild-Composed", rarity: "rare", window: "lifetime",
    glyph: "focus", tint: "plum", frame: "diamond", accent: "star",
    random: true,
    desc: "An elemental of unknown bearing — the kettle's surprise return for your own blend. Drawn by your first composed cup.",
    earned: ctx => (ctx.composedCount || 0) >= 1 },
  { id: "wild-tradition", name: "Wild-Tradition", rarity: "uncommon", window: "lifetime",
    glyph: "scroll", tint: "ochre", frame: "diamond", accent: "star",
    random: true,
    desc: "An elemental from elsewhere — neither named nor chosen, only met. Drawn by your first cup from a tradition's lineage.",
    earned: ctx => (ctx.lifetime?.distinctTraditions || 0) >= 1 },
];

export function evaluateAttributes(ctx) {
  return ATTRIBUTES.map(a => ({ ...a, earned: !!a.earned(ctx) }));
}

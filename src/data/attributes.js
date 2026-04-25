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

import { INGREDIENTS } from "./ingredients";
import { getBlend } from "../helpers/misc";

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

export function buildAttributeContext({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, pantryIds, profile }) {
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

  return {
    lifetime, recent, onboarding, daysSinceFirst,
    flowerIngsAll, teaIngsAll, allIngs,
    composedCount,
    favoriteBlendIds: favoriteBlendIds || new Set(),
    savedBlendIds:   savedBlendIds   || new Set(),
    pantryIds:       pantryIds       || new Set(),
  };
}

// Onboarding helper — predicate that fires when the user picked the
// given mood AND any of the given flavors during onboarding.
const onPick = (ctx, mood, flavors) =>
  ctx.onboarding.moods.has(mood) &&
  flavors.some(f => ctx.onboarding.flavors.has(f));

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
  { id: "first-brew", name: "First Brewing", rarity: "common", window: "lifetime",
    glyph: "kettle", tint: "ochre", frame: "circle", accent: "none",
    desc: "The first cup recorded. The journal began.",
    earned: ctx => ctx.lifetime.n >= 1 },
  { id: "ten-cups", name: "Ten Cups", rarity: "common", window: "lifetime",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Ten logged cups. The habit shows up.",
    earned: ctx => ctx.lifetime.n >= 10 },
  { id: "half-centurion", name: "Half-Centurion", rarity: "uncommon", window: "lifetime",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "star",
    desc: "Fifty cups in. You know your kettle.",
    earned: ctx => ctx.lifetime.n >= 50 },
  { id: "centurion", name: "The Centurion", rarity: "rare", window: "lifetime",
    glyph: "comfort", tint: "terra", frame: "hex", accent: "star",
    desc: "One hundred cups logged. A small tea life.",
    earned: ctx => ctx.lifetime.n >= 100 },
  { id: "year-walker", name: "Year-Walker", rarity: "rare", window: "lifetime",
    glyph: "compass", tint: "plum", frame: "circle", accent: "rays",
    desc: "Your first cup was at least a year ago. The seasons turned beneath the kettle.",
    earned: ctx => ctx.daysSinceFirst >= 365 && ctx.lifetime.n >= 50 },
  { id: "decade-of-cups", name: "Decade of Cups", rarity: "legendary", window: "lifetime",
    glyph: "scroll", tint: "plum", frame: "diamond", accent: "star",
    desc: "Five hundred cups. A practice, not a habit.",
    earned: ctx => ctx.lifetime.n >= 500 },
  { id: "compose-initiate", name: "Compose Initiate", rarity: "common", window: "lifetime",
    glyph: "focus", tint: "sage", frame: "square", accent: "none",
    desc: "First blend composed in Vibe or Blend. The hand picked the leaves.",
    earned: ctx => ctx.composedCount >= 1 },
  { id: "compose-master", name: "Compose Master", rarity: "rare", window: "lifetime",
    glyph: "focus", tint: "plum", frame: "diamond", accent: "star",
    desc: "Ten user-composed blends. A vocabulary of your own.",
    earned: ctx => ctx.composedCount >= 10 },
  { id: "apothecary-walker", name: "Apothecary Walker", rarity: "uncommon", window: "lifetime",
    glyph: "leaf", tint: "sageDeep", frame: "hex", accent: "none",
    desc: "Tried at least a quarter of the catalog's ingredients.",
    earned: ctx => ctx.lifetime.distinctIngredients >= Math.floor(ctx.allIngs.length * 0.25) },
  { id: "apothecary-master", name: "Apothecary Master", rarity: "legendary", window: "lifetime",
    glyph: "leaf", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Tried half the entire catalog. Few stranger cups remain.",
    earned: ctx => ctx.lifetime.distinctIngredients >= Math.floor(ctx.allIngs.length * 0.5) },
  { id: "lavandiere-life", name: "The Lavandière", rarity: "rare", window: "lifetime",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "star",
    desc: "Tried every flower the catalog holds.",
    earned: ctx => ctx.flowerIngsAll.length > 0
      && ctx.flowerIngsAll.every(id => ctx.lifetime.byIngredient.has(id) || ctx.pantryIds.has(id)) },
  { id: "all-leaves", name: "All Leaves", rarity: "legendary", window: "lifetime",
    glyph: "leaf", tint: "sageDeep", frame: "hex", accent: "rays",
    desc: "Brewed every true-tea variant in the catalog.",
    earned: ctx => ctx.teaIngsAll.length > 0
      && ctx.teaIngsAll.every(id => ctx.lifetime.byIngredient.has(id)) },
  { id: "polyglot-life", name: "The Polyglot", rarity: "uncommon", window: "lifetime",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Cups across at least three different traditions.",
    earned: ctx => ctx.lifetime.distinctTraditions >= 3 },
  { id: "tradition-completionist", name: "Tradition Completionist", rarity: "mythic", window: "lifetime",
    glyph: "scroll", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Brewed from every traditional preparation in the Catalogue. A pilgrim of the cup.",
    earned: ctx => {
      const traditions = new Set();
      ctx.lifetime.sessions.forEach(s => {
        const b = getBlend(s.blendId);
        if (b && b.tradition) traditions.add(b.tradition);
      });
      return traditions.size >= 14;
    } },
  { id: "self-knower", name: "Self-Knower", rarity: "rare", window: "lifetime",
    glyph: "focus", tint: "sageDeep", frame: "circle", accent: "rays",
    desc: "Twenty-five cups where the predicted mood landed.",
    earned: ctx => {
      const matched = ctx.lifetime.sessions.filter(s => {
        const hit = (s.actual || "").toLowerCase();
        return ["calm","focus","energy","sleepy","comfort","soothing","warming","cooling","digestive","grounding","uplifting"].includes(hit);
      }).length;
      return matched >= 25;
    } },

  // ─── Recent: time-of-day patterns ─────────────────────────
  { id: "dawn-steeper", name: "The Dawn Steeper", rarity: "common", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Four or more recent cups before seven a.m. You wake with the kettle.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s); return ts && ts.getHours() < 7;
    }).length >= 4 },
  { id: "midnight-pourer", name: "The Midnight Pourer", rarity: "uncommon", window: "recent",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "crescent",
    desc: "Three or more recent cups after ten p.m. The lamps stay low for you.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s); return ts && ts.getHours() >= 22;
    }).length >= 3 },
  { id: "afternoon-constant", name: "Afternoon Constant", rarity: "common", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "square", accent: "none",
    desc: "Five or more recent cups between one and four p.m.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s); return ts && ts.getHours() >= 13 && ts.getHours() < 16;
    }).length >= 5 },
  { id: "evening-familiar", name: "Evening Familiar", rarity: "common", window: "recent",
    glyph: "soothing", tint: "plum", frame: "square", accent: "dot",
    desc: "Five or more recent cups in the evening hours.",
    earned: ctx => (ctx.recent.byTimeOfDay.get("evening") || 0) >= 5 },

  // ─── Recent: seasonal × pattern ───────────────────────────
  { id: "snowqueen", name: "The Snowqueen", rarity: "rare", window: "recent",
    glyph: "cooling", tint: "sky", frame: "diamond", accent: "crescent",
    desc: "Menthol cups, at night, in winter — the cool exhale answering cold air.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "winter") return false;
      const tod = timeOfDay(ts);
      if (tod !== "evening" && tod !== "late-night") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "minty" || b.mood === "cooling");
    }).length >= 2 },
  { id: "summer-forager", name: "The Summer Forager", rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Floral, citrus, or cooling cups under summer light — four or more.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "summer") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "floral" || b.flavor === "citrus" || b.flavor === "minty" || b.mood === "cooling");
    }).length >= 4 },
  { id: "autumn-hearth", name: "Autumn Hearth", rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "none",
    desc: "Warming or spiced cups as the days shorten — four or more.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "fall") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "spiced" || b.mood === "warming" || b.mood === "comfort");
    }).length >= 4 },
  { id: "spring-riser", name: "Spring Riser", rarity: "uncommon", window: "recent",
    glyph: "uplifting", tint: "sage", frame: "circle", accent: "rays",
    desc: "Uplifting or citrus cups in spring — four or more.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || season(ts) !== "spring") return false;
      const b = getBlend(s.blendId);
      return b && (b.mood === "uplifting" || b.flavor === "citrus");
    }).length >= 4 },

  // ─── Recent: mood-family patterns ─────────────────────────
  { id: "soft-hand", name: "The Soft Hand", rarity: "common", window: "recent",
    glyph: "calm", tint: "sage", frame: "circle", accent: "none",
    desc: "Most recent cups aim for calm, sleepy, or soothing.",
    earned: ctx => moodFamily(ctx.recent, ["calm","sleepy","soothing"]) >= 5 },
  { id: "restless-one", name: "The Restless One", rarity: "common", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Most recent cups aim for focus or energy.",
    earned: ctx => moodFamily(ctx.recent, ["focus","energy"]) >= 5 },
  { id: "hearth-keeper", name: "The Hearth-Keeper", rarity: "common", window: "recent",
    glyph: "warming", tint: "terra", frame: "square", accent: "none",
    desc: "Most recent cups skew warming or comfort.",
    earned: ctx => moodFamily(ctx.recent, ["warming","comfort"]) >= 5 },
  { id: "sun-chaser", name: "The Sun-Chaser", rarity: "common", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Most recent cups aim for uplifting or energy.",
    earned: ctx => moodFamily(ctx.recent, ["uplifting","energy"]) >= 5 },
  { id: "convalescent", name: "The Convalescent", rarity: "uncommon", window: "recent",
    glyph: "soothing", tint: "sage", frame: "square", accent: "dot",
    desc: "Soothing or digestive cups dominate. Healing, or tending someone who is.",
    earned: ctx => moodFamily(ctx.recent, ["soothing","digestive"]) >= 5 },
  { id: "grounded-one", name: "The Grounded One", rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "none",
    desc: "Three or more recent cups in the grounding register.",
    earned: ctx => moodCount(ctx.recent, "grounding") >= 3 },
  { id: "cooler-headed", name: "The Cooler-Headed", rarity: "uncommon", window: "recent",
    glyph: "cooling", tint: "sky", frame: "circle", accent: "crescent",
    desc: "Three or more recent cups in the cooling register.",
    earned: ctx => moodCount(ctx.recent, "cooling") >= 3 },
  { id: "the-whitespace", name: "The Whitespace", rarity: "rare", window: "recent",
    glyph: "calm", tint: "ash", frame: "diamond", accent: "none",
    desc: "Eight or more recent cups in calm. Quiet, spacious, kept.",
    earned: ctx => moodCount(ctx.recent, "calm") >= 8 },

  // ─── Recent: flavor patterns ──────────────────────────────
  { id: "petal-drinker", name: "Petal-Drinker", rarity: "common", window: "recent",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Floral cups dominate your recent rotation.",
    earned: ctx => flavorCount(ctx.recent, "floral") >= 4 },
  { id: "the-mineralist", name: "The Mineralist", rarity: "common", window: "recent",
    glyph: "grounding", tint: "ash", frame: "hex", accent: "none",
    desc: "Earthy, woody, mineral — your cups speak of stone and root.",
    earned: ctx => flavorFamily(ctx.recent, ["earthy","woody","mineral"]) >= 4 },
  { id: "sweet-tooth", name: "Sweet Tooth", rarity: "common", window: "recent",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Sweet and honeyed cups lead your recent rotation.",
    earned: ctx => flavorFamily(ctx.recent, ["sweet","honeyed"]) >= 4 },
  { id: "bitter-adept", name: "The Bitter Adept", rarity: "uncommon", window: "recent",
    glyph: "digestive", tint: "terra", frame: "hex", accent: "none",
    desc: "Bitter cups in your recent rotation. You take the cup honest.",
    earned: ctx => flavorCount(ctx.recent, "bitter") >= 3 },
  { id: "smokesworn", name: "Smokesworn", rarity: "rare", window: "recent",
    glyph: "warming", tint: "ash", frame: "diamond", accent: "none",
    desc: "The pine fire calls. Smoky cups in your recent rotation.",
    earned: ctx => flavorCount(ctx.recent, "smoky") >= 2 },
  { id: "umami-initiate", name: "Umami Initiate", rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "dot",
    desc: "Umami cups in your recent rotation — gyokuro country.",
    earned: ctx => flavorCount(ctx.recent, "umami") >= 3 },
  { id: "citrus-hand", name: "The Citrus Hand", rarity: "common", window: "recent",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Citrus cups dominate your recent rotation.",
    earned: ctx => flavorCount(ctx.recent, "citrus") >= 4 },
  { id: "spice-hand", name: "The Spice Hand", rarity: "common", window: "recent",
    glyph: "warming", tint: "terra", frame: "square", accent: "dot",
    desc: "Spiced cups in your recent rotation — chai country.",
    earned: ctx => flavorCount(ctx.recent, "spiced") >= 4 },
  { id: "roast-devotee", name: "Roast Devotee", rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "dot",
    desc: "Roasted cups in your recent rotation — hojicha country.",
    earned: ctx => flavorCount(ctx.recent, "roasted") >= 3 },
  { id: "five-tongues-recent", name: "Five Tongues", rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Five different flavor families in your recent rotation. Wide palate.",
    earned: ctx => ctx.recent.distinctFlavors >= 5 },

  // ─── Recent: ingredient patterns ──────────────────────────
  { id: "rose-companion", name: "Rose-Companion", rarity: "rare", window: "recent",
    glyph: "flower", tint: "terra", frame: "circle", accent: "star",
    desc: "Rose appears in three or more recent cups. The cup remembers a garden.",
    earned: ctx => ingCount(ctx.recent, "rose") >= 3 },
  { id: "mint-devotee", name: "Mint Devotee", rarity: "uncommon", window: "recent",
    glyph: "cooling", tint: "sage", frame: "circle", accent: "rays",
    desc: "Mint of any kind in four or more recent cups.",
    earned: ctx => ingCount(ctx.recent, "peppermint") + ingCount(ctx.recent, "spearmint") >= 4 },
  { id: "chamomile-friend", name: "Chamomile Friend", rarity: "common", window: "recent",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "none",
    desc: "Chamomile in three or more recent cups. The familiar bedtime apple.",
    earned: ctx => ingCount(ctx.recent, "chamomile") >= 3 },
  { id: "lavender-calm", name: "Lavender Calm", rarity: "uncommon", window: "recent",
    glyph: "calm", tint: "plum", frame: "circle", accent: "dot",
    desc: "Lavender in three or more recent cups. Camphor and quiet.",
    earned: ctx => ingCount(ctx.recent, "lavender") >= 3 },
  { id: "tea-faithful", name: "Tea-Faithful", rarity: "uncommon", window: "recent",
    glyph: "leaf", tint: "sageDeep", frame: "hex", accent: "none",
    desc: "Every recent cup contains a true tea. The leaf is loyal.",
    earned: ctx => ctx.recent.n >= 5 && containsCategory(ctx.recent.sessions, "true tea") },
  { id: "herb-lover", name: "Herb-Lover", rarity: "uncommon", window: "recent",
    glyph: "sprig", tint: "sage", frame: "circle", accent: "none",
    desc: "Every recent cup is herbal — no true tea anywhere.",
    earned: ctx => ctx.recent.n >= 5 && noCategory(ctx.recent.sessions, "true tea") },
  { id: "mushroom-whisperer", name: "Mushroom Whisperer", rarity: "rare", window: "recent",
    glyph: "grounding", tint: "plum", frame: "hex", accent: "dot",
    desc: "Reishi or lion's mane in three or more recent cups. The slow medicine.",
    earned: ctx => ingFamily(ctx.recent, ["reishi","lions-mane"]) >= 3 },
  { id: "adaptogen-initiate", name: "Adaptogen Initiate", rarity: "uncommon", window: "recent",
    glyph: "grounding", tint: "plum", frame: "square", accent: "none",
    desc: "Adaptogen-category ingredients in three or more recent cups.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const b = getBlend(s.blendId);
      return b && (b.ingredients || []).some(i => INGREDIENTS[i.id]?.category === "adaptogen");
    }).length >= 3 },
  { id: "ginger-hand", name: "Ginger Hand", rarity: "common", window: "recent",
    glyph: "warming", tint: "terra", frame: "circle", accent: "rays",
    desc: "Ginger in four or more recent cups. The warming root.",
    earned: ctx => ingCount(ctx.recent, "ginger") >= 4 },

  // ─── Recent: caffeine patterns ────────────────────────────
  { id: "the-buzzed", name: "The Buzzed", rarity: "common", window: "recent",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Every recent cup carried caffeine. Tea-leaf adrenaline.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.caffeineFree === 0 },
  { id: "decaf-devotee", name: "Decaf Devotee", rarity: "common", window: "recent",
    glyph: "calm", tint: "sage", frame: "circle", accent: "none",
    desc: "Caffeine-free, every recent cup. The herbal route.",
    earned: ctx => ctx.recent.n >= 5 && ctx.recent.caffeinated === 0 },
  { id: "the-switcher", name: "The Switcher", rarity: "uncommon", window: "recent",
    glyph: "compass", tint: "ash", frame: "circle", accent: "dot",
    desc: "Recent cups split between caffeinated and herbal. You read the hour.",
    earned: ctx => ctx.recent.caffeinated >= 4 && ctx.recent.caffeineFree >= 4 },

  // ─── Recent: tradition patterns ───────────────────────────
  { id: "way-of-tea", name: "Way of Tea", rarity: "uncommon", window: "recent",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "none",
    desc: "Three or more recent cups follow a Japanese tradition.",
    earned: ctx => traditionMatches(ctx.recent, /Japanese/i) >= 3 },
  { id: "south-born", name: "The South-Born", rarity: "uncommon", window: "recent",
    glyph: "warming", tint: "terra", frame: "hex", accent: "dot",
    desc: "Recent cups lean South Asian or Ayurvedic.",
    earned: ctx => traditionMatches(ctx.recent, /South Asian|Ayurvedic/i) >= 3 },
  { id: "old-continent", name: "Old Continent", rarity: "uncommon", window: "recent",
    glyph: "scroll", tint: "ochre", frame: "square", accent: "none",
    desc: "European-folk preparations in your recent rotation.",
    earned: ctx => traditionMatches(ctx.recent, /European|Western/i) >= 3 },
  { id: "andean-path", name: "Andean Path", rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "hex", accent: "rays",
    desc: "South American gaucho preparation in your recent cups.",
    earned: ctx => traditionMatches(ctx.recent, /South American/i) >= 1 },
  { id: "chinese-mountain", name: "Chinese Mountain", rarity: "rare", window: "recent",
    glyph: "grounding", tint: "terra", frame: "diamond", accent: "none",
    desc: "Two or more recent cups from Chinese traditions.",
    earned: ctx => traditionMatches(ctx.recent, /Chinese/i) >= 2 },

  // ─── Recent: rhythm patterns ──────────────────────────────
  { id: "the-steady", name: "The Steady", rarity: "common", window: "recent",
    glyph: "comfort", tint: "sage", frame: "square", accent: "dot",
    desc: "Cups across at least seven different days. A ritual, not a binge.",
    earned: ctx => ctx.recent.distinctDays.size >= 7 },
  { id: "binge-watcher", name: "The Binge-Watcher", rarity: "rare", window: "recent",
    glyph: "kettle", tint: "ash", frame: "diamond", accent: "rays",
    desc: "Ten cups in a single day. The kettle never cooled.",
    earned: ctx => ctx.recent.n === 10 && ctx.recent.distinctDays.size === 1 },
  { id: "the-loyal", name: "The Loyal", rarity: "uncommon", window: "recent",
    glyph: "heart", tint: "terra", frame: "circle", accent: "dot",
    desc: "One blend brewed five times in your recent cups.",
    earned: ctx => ctx.recent.maxRepeat >= 5 },
  { id: "the-wanderer", name: "The Wanderer", rarity: "rare", window: "recent",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Ten distinct blends in ten cups. Never the same twice.",
    earned: ctx => ctx.recent.n >= 10 && ctx.recent.byBlendId.size >= 10 },

  // ─── Recent: rating patterns ──────────────────────────────
  { id: "the-approver", name: "The Approver", rarity: "common", window: "recent",
    glyph: "heart", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Most recent cups rated four stars or higher.",
    earned: ctx => ctx.recent.ratings.filter(r => r >= 4).length >= 8 },
  { id: "honest-critic", name: "The Honest Critic", rarity: "uncommon", window: "recent",
    glyph: "feather", tint: "terra", frame: "diamond", accent: "none",
    desc: "Five or more recent cups rated three stars or fewer. You tell the truth.",
    earned: ctx => ctx.recent.ratings.filter(r => r <= 3).length >= 5 },
  { id: "steady-marker", name: "Steady Marker", rarity: "rare", window: "recent",
    glyph: "compass", tint: "ash", frame: "square", accent: "dot",
    desc: "Every recent rating is exactly four. Calibrated, predictable.",
    earned: ctx => ctx.recent.n >= 8 && ctx.recent.ratings.length === ctx.recent.n
      && ctx.recent.ratings.every(r => r === 4) },

  // ─── Recent: multi-condition rare ─────────────────────────
  { id: "morning-mountain", name: "Morning Mountain", rarity: "rare", window: "recent",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "rays",
    desc: "Pu-erh or oolong before nine a.m. — three or more.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts || ts.getHours() >= 9) return false;
      const b = getBlend(s.blendId);
      return b && (b.ingredients || []).some(i => /puerh|oolong|wuyi|lapsang/i.test(i.id));
    }).length >= 3 },
  { id: "sleepy-bee", name: "Sleepy Bee", rarity: "rare", window: "recent",
    glyph: "bee", tint: "ochre", frame: "circle", accent: "crescent",
    desc: "Honey-sweet cups before bed — three or more.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const tod = timeOfDay(ts);
      if (tod !== "evening" && tod !== "late-night") return false;
      const b = getBlend(s.blendId);
      return b && (b.flavor === "honeyed" || b.flavor === "sweet");
    }).length >= 3 },
  { id: "post-meal-settler", name: "Post-Meal Settler", rarity: "uncommon", window: "recent",
    glyph: "digestive", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Digestive cups after lunch hours — three or more.",
    earned: ctx => ctx.recent.sessions.filter(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const h = ts.getHours();
      if (h < 13 || h > 16) return false;
      const b = getBlend(s.blendId);
      return b && (b.mood === "digestive" || b.flavor === "spiced");
    }).length >= 3 },
  { id: "diurnal-pendulum", name: "Diurnal Pendulum", rarity: "rare", window: "recent",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "Energetic cups before noon, restful cups after dark — both, repeatedly.",
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
  { id: "solstice-soul", name: "Solstice Soul", rarity: "mythic", window: "recent",
    glyph: "star", tint: "plum", frame: "diamond", accent: "rays",
    desc: "A cup brewed within a week of solstice or equinox. The sky was watching.",
    earned: ctx => ctx.recent.sessions.some(s => {
      const ts = tsFromSession(s);
      if (!ts) return false;
      const m = ts.getMonth(), d = ts.getDate();
      const within = (mm, dd) => m === mm && Math.abs(d - dd) <= 7;
      return within(11, 21) || within(2, 20) || within(5, 21) || within(8, 23);
    }) },
  { id: "the-twin-cups", name: "The Twin Cups", rarity: "rare", window: "recent",
    glyph: "heart", tint: "plum", frame: "diamond", accent: "dot",
    desc: "Same blend, same hour, two days running.",
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
  { id: "lifelong-steeper", name: "Lifelong Steeper", rarity: "legendary", window: "lifetime",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "More than two years between your first cup and now.",
    earned: ctx => ctx.daysSinceFirst >= 730 },
  { id: "tea-veteran", name: "Tea Veteran", rarity: "rare", window: "lifetime",
    glyph: "scroll", tint: "ochre", frame: "hex", accent: "star",
    desc: "Cups across at least sixty different days.",
    earned: ctx => ctx.lifetime.distinctDays.size >= 60 },
  { id: "all-the-flowers", name: "All the Flowers", rarity: "legendary", window: "lifetime",
    glyph: "flower", tint: "ochre", frame: "diamond", accent: "rays",
    desc: "Every flower in the catalog has been brewed at least once.",
    earned: ctx => ctx.flowerIngsAll.length > 0
      && ctx.flowerIngsAll.every(id => ctx.lifetime.byIngredient.has(id)) },
  { id: "favorite-five", name: "Favorite Five", rarity: "common", window: "lifetime",
    glyph: "heart", tint: "terra", frame: "circle", accent: "dot",
    desc: "Five blends marked as favorites.",
    earned: ctx => ctx.favoriteBlendIds.size >= 5 },
  { id: "favorite-twenty", name: "The Curator", rarity: "rare", window: "lifetime",
    glyph: "heart", tint: "plum", frame: "hex", accent: "star",
    desc: "Twenty favorited blends. A library of yes.",
    earned: ctx => ctx.favoriteBlendIds.size >= 20 },
  // ─── Onboarding archetypes — fire from the user's very first day,
  //     based on what mood/flavor combinations they picked. Each user
  //     should land 1-2 of these. Color-coordinated by rarity. ─────
  { id: "the-druid",         name: "The Druid",          rarity: "uncommon", window: "onboarding",
    glyph: "grounding", tint: "terra", frame: "hex", accent: "none",
    desc: "You came in for calm and reached for earthy cups. Rooted, slow, deep — the forest is your kettle.",
    earned: ctx => onPick(ctx, "calm", ["earthy", "smoky"]) },
  { id: "garden-walker",     name: "The Garden Walker",  rarity: "common", window: "onboarding",
    glyph: "flower", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Calm and floral — petals and quiet, the cup as a slow afternoon in the garden.",
    earned: ctx => onPick(ctx, "calm", ["floral", "fruity"]) },
  { id: "cooling-hand",      name: "The Cooling Hand",   rarity: "uncommon", window: "onboarding",
    glyph: "cooling", tint: "sky", frame: "circle", accent: "crescent",
    desc: "Calm and minty — cool exhale, soft mind. Yin energy, taken as tea.",
    earned: ctx => onPick(ctx, "calm", ["minty"]) },
  { id: "mountain-scribe",   name: "The Mountain Scribe", rarity: "uncommon", window: "onboarding",
    glyph: "grounding", tint: "ash", frame: "diamond", accent: "none",
    desc: "Focus and earthy — grounded attention. The desk steady, the leaves dark.",
    earned: ctx => onPick(ctx, "focus", ["earthy"]) },
  { id: "smoke-sage",        name: "The Smoke Sage",     rarity: "rare", window: "onboarding",
    glyph: "warming", tint: "ash", frame: "diamond", accent: "rays",
    desc: "Focus and smoky — pine fire and concentration. Rare and contemplative.",
    earned: ctx => onPick(ctx, "focus", ["smoky"]) },
  { id: "the-sharpener",     name: "The Sharpener",      rarity: "uncommon", window: "onboarding",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "rays",
    desc: "Focus and minty — clean cut, clarity through cold. The mind as a knife.",
    earned: ctx => onPick(ctx, "focus", ["minty"]) },
  { id: "bright-mind",       name: "The Bright Mind",    rarity: "common", window: "onboarding",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Focus and citrus — clean cognition, the morning of the mind.",
    earned: ctx => onPick(ctx, "focus", ["citrus", "fruity"]) },
  { id: "sun-sailor",        name: "The Sun Sailor",     rarity: "common", window: "onboarding",
    glyph: "uplifting", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Energy and citrus — bright lift. You take the cup like a sail takes wind.",
    earned: ctx => onPick(ctx, "energy", ["citrus", "fruity"]) },
  { id: "forge-hand",        name: "The Forge-Hand",     rarity: "rare", window: "onboarding",
    glyph: "warming", tint: "terra", frame: "hex", accent: "star",
    desc: "Energy and smoky — hot iron, steady force. The cup is a hammer.",
    earned: ctx => onPick(ctx, "energy", ["smoky"]) },
  { id: "the-caravan",       name: "The Caravan",        rarity: "uncommon", window: "onboarding",
    glyph: "warming", tint: "terra", frame: "circle", accent: "dot",
    desc: "Energy and spiced — chai and movement. Your cup smells of roads.",
    earned: ctx => onPick(ctx, "energy", ["spiced"]) },
  { id: "frost-runner",      name: "The Frost Runner",   rarity: "rare", window: "onboarding",
    glyph: "cooling", tint: "sky", frame: "diamond", accent: "rays",
    desc: "Energy and minty — cool kinetic. Lift without heat, motion without sweat.",
    earned: ctx => onPick(ctx, "energy", ["minty"]) },
  { id: "the-moonflower",    name: "The Moonflower",     rarity: "uncommon", window: "onboarding",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "crescent",
    desc: "Sleepy and floral — bedside petals. The cup is your lullaby.",
    earned: ctx => onPick(ctx, "sleepy", ["floral"]) },
  { id: "the-lullaby",       name: "The Lullaby",        rarity: "common", window: "onboarding",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "dot",
    desc: "Sleepy and sweet — sugared dusk. The cup is your bedtime story.",
    earned: ctx => onPick(ctx, "sleepy", ["sweet"]) },
  { id: "the-rootbed",       name: "The Rootbed",        rarity: "rare", window: "onboarding",
    glyph: "grounding", tint: "plum", frame: "diamond", accent: "none",
    desc: "Sleepy and earthy — the soil at night. You go down to rise.",
    earned: ctx => onPick(ctx, "sleepy", ["earthy"]) },
  { id: "hearth-witch",      name: "The Hearth Witch",   rarity: "uncommon", window: "onboarding",
    glyph: "warming", tint: "terra", frame: "square", accent: "dot",
    desc: "Comfort and spiced — kitchen warmth, the cup as a slow embrace.",
    earned: ctx => onPick(ctx, "comfort", ["spiced"]) },
  { id: "the-honeycake",     name: "The Honeycake",      rarity: "common", window: "onboarding",
    glyph: "comfort", tint: "ochre", frame: "circle", accent: "dot",
    desc: "Comfort and sweet — the cup as a soft seat. Honey in everything.",
    earned: ctx => onPick(ctx, "comfort", ["sweet"]) },
  { id: "the-wood-stove",    name: "The Wood Stove",     rarity: "rare", window: "onboarding",
    glyph: "warming", tint: "terra", frame: "hex", accent: "rays",
    desc: "Comfort and smoky — smoldering ease. The cup smells like home in winter.",
    earned: ctx => onPick(ctx, "comfort", ["smoky"]) },
  { id: "the-bittersmith",   name: "The Bittersmith",    rarity: "uncommon", window: "onboarding",
    glyph: "digestive", tint: "ochre", frame: "hex", accent: "dot",
    desc: "Digestive and spiced — chai-after-meal, fennel-and-pepper. You know what bitters do.",
    earned: ctx => onPick(ctx, "digestive", ["spiced"]) },
  { id: "the-apothecary-self", name: "The Apothecary",   rarity: "rare", window: "onboarding",
    glyph: "mortar", tint: "terra", frame: "hex", accent: "star",
    desc: "Digestive and earthy — bitter roots, dandelion café. You take the cup like medicine.",
    earned: ctx => onPick(ctx, "digestive", ["earthy"]) },
  { id: "after-supper",      name: "The After-Supper",   rarity: "common", window: "onboarding",
    glyph: "digestive", tint: "sage", frame: "circle", accent: "dot",
    desc: "Digestive and minty — fennel-and-mint clarity. The cup as the meal's last sentence.",
    earned: ctx => onPick(ctx, "digestive", ["minty"]) },
  { id: "the-polyglot-mouth", name: "The Polyglot Mouth", rarity: "rare", window: "onboarding",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "rays",
    desc: "You picked five or more flavors at onboarding. A wide palate, hungry for range.",
    earned: ctx => ctx.onboarding.flavorCount >= 5 },
  { id: "the-specialist",    name: "The Specialist",     rarity: "uncommon", window: "onboarding",
    glyph: "focus", tint: "sageDeep", frame: "square", accent: "dot",
    desc: "One or two flavors — you know what you like. Narrow and deep beats wide and thin.",
    earned: ctx => ctx.onboarding.flavorCount > 0 && ctx.onboarding.flavorCount <= 2 },
  { id: "the-mood-reader",   name: "The Mood-Reader",    rarity: "uncommon", window: "onboarding",
    glyph: "compass", tint: "ochre", frame: "circle", accent: "rays",
    desc: "You came in led by feeling, not flavor — three or more moods, no flavor picks.",
    earned: ctx => ctx.onboarding.moodCount >= 3 && ctx.onboarding.flavorCount === 0 },
  { id: "the-single-note",   name: "The Single Note",    rarity: "uncommon", window: "onboarding",
    glyph: "key", tint: "sageDeep", frame: "diamond", accent: "none",
    desc: "One mood, one flavor — the cup is for one thing, and that thing exactly.",
    earned: ctx => ctx.onboarding.moodCount === 1 && ctx.onboarding.flavorCount === 1 },
  { id: "dawn-voyager",      name: "The Dawn Voyager",   rarity: "common", window: "onboarding",
    glyph: "energy", tint: "ochre", frame: "circle", accent: "rays",
    desc: "Mornings and energy. You meet the day with the kettle.",
    earned: ctx => ctx.onboarding.times.has("morning") &&
      (ctx.onboarding.moods.has("energy") || ctx.onboarding.moods.has("focus")) },
  { id: "lamp-watcher",      name: "The Lamp-Watcher",   rarity: "common", window: "onboarding",
    glyph: "sleepy", tint: "plum", frame: "circle", accent: "crescent",
    desc: "Evenings and calm. The cup is the lowering light.",
    earned: ctx => ctx.onboarding.times.has("evening") &&
      (ctx.onboarding.moods.has("calm") || ctx.onboarding.moods.has("sleepy")) },
  { id: "afternoon-scholar", name: "The Afternoon Scholar", rarity: "uncommon", window: "onboarding",
    glyph: "scroll", tint: "ochre", frame: "square", accent: "none",
    desc: "Afternoons and focus. The cup keeps the page open past three.",
    earned: ctx => ctx.onboarding.times.has("afternoon") && ctx.onboarding.moods.has("focus") },
  { id: "the-all-hours",     name: "The All-Hours",      rarity: "rare", window: "onboarding",
    glyph: "compass", tint: "plum", frame: "diamond", accent: "star",
    desc: "Morning, afternoon, and evening all picked. You don't keep the kettle in one drawer.",
    earned: ctx => ctx.onboarding.times.size >= 3 },
];

export function evaluateAttributes(ctx) {
  return ATTRIBUTES.map(a => ({ ...a, earned: !!a.earned(ctx) }));
}

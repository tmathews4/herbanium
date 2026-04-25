/* ──────────────────────────────────────────────────────────────
   data/badges.js — earned-state badges keyed off the user's flow.

   Each badge has:
     id     — stable string for keys / persistence
     name   — display name (apothecary-poet voice)
     desc   — one-liner explaining the bar
     icon   — which mood icon to render ("calm", "focus", etc.)
     earned — predicate over a derived context

   Context is built by buildBadgeContext({ sessions, ... }) which walks
   the user's logged sessions once and pre-computes the lookups every
   predicate needs (distinct ingredients, traditions, moods, etc.).
   ────────────────────────────────────────────────────────────── */

import { INGREDIENTS } from "./ingredients";
import { MOODS } from "./blends";
import { getBlend } from "../helpers/misc";

export function buildBadgeContext({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, pantryIds }) {
  const yourSessions = (sessions || []).filter(s => s.who === "you");

  const distinctIngredients = new Set();
  const distinctTraditions = new Set();
  const distinctMoods = new Set();
  const distinctFlavors = new Set();
  const blendCounts = {};

  yourSessions.forEach(s => {
    const b = getBlend(s.blendId);
    if (!b) return;
    (b.ingredients || []).forEach(i => distinctIngredients.add(i.id));
    if (b.tradition) distinctTraditions.add(b.tradition);
    if (b.mood) distinctMoods.add(b.mood);
    if (b.flavor) distinctFlavors.add(b.flavor);
    blendCounts[b.id] = (blendCounts[b.id] || 0) + 1;
  });

  const matched = yourSessions.filter(s => {
    const hit = (s.actual || "").toLowerCase();
    return MOODS.includes(hit);
  }).length;

  const lowRated = yourSessions.filter(s => (s.taste ?? 5) <= 2).length;

  // Sessions before 7am — pull timestamp out of the synthetic id (sess-<ms>)
  const morningCups = yourSessions.filter(s => {
    const ts = parseInt(String(s.id || "").replace("sess-", ""), 10);
    if (!Number.isFinite(ts)) return false;
    return new Date(ts).getHours() < 7;
  }).length;

  const composedBlends = (generatedBlends || [])
    .filter(b => String(b.id || "").startsWith("local-")).length;

  const flowerIngsAll = Object.entries(INGREDIENTS)
    .filter(([, ing]) => ing.category === "flower")
    .map(([id]) => id);
  const flowerIngsTried = flowerIngsAll.filter(id =>
    distinctIngredients.has(id) || (pantryIds && pantryIds.has(id))
  );

  const refinerCount = Object.values(blendCounts).length > 0
    ? Math.max(...Object.values(blendCounts))
    : 0;

  // Restful-cup family — calm + sleepy + soothing
  const restfulCups = yourSessions.filter(s => {
    const b = getBlend(s.blendId);
    return b && ["calm", "sleepy", "soothing"].includes(b.mood);
  }).length;

  return {
    yourSessions,
    distinctIngredients,
    distinctTraditions,
    distinctMoods,
    distinctFlavors,
    blendCounts,
    matched,
    lowRated,
    morningCups,
    composedBlends,
    flowerIngsAll,
    flowerIngsTried,
    refinerCount,
    restfulCups,
    favoriteBlendIds: favoriteBlendIds || new Set(),
    savedBlendIds: savedBlendIds || new Set(),
  };
}

export const BADGES = [
  // Beginnings
  { id: "first-brew",   name: "First Brewing",   icon: "energy",
    desc: "The first recorded cup.",
    earned: ctx => ctx.yourSessions.length >= 1 },
  { id: "composer",     name: "The Composer",    icon: "focus",
    desc: "Compose your first blend in Vibe or Blend.",
    earned: ctx => ctx.composedBlends >= 1 },
  { id: "keeper",       name: "The Keeper",      icon: "comfort",
    desc: "Mark five blends as favorites.",
    earned: ctx => ctx.favoriteBlendIds.size >= 5 },

  // Range
  { id: "cartographer", name: "The Cartographer", icon: "grounding",
    desc: "Log twelve distinct ingredients.",
    earned: ctx => ctx.distinctIngredients.size >= 12 },
  { id: "polyglot",     name: "The Polyglot",    icon: "uplifting",
    desc: "Brew across three different traditions.",
    earned: ctx => ctx.distinctTraditions.size >= 3 },
  { id: "wandering",    name: "The Wandering Cup", icon: "uplifting",
    desc: "Brew across four different moods.",
    earned: ctx => ctx.distinctMoods.size >= 4 },
  { id: "five-tongues", name: "Five Tongues",    icon: "warming",
    desc: "Brew across five flavor families.",
    earned: ctx => ctx.distinctFlavors.size >= 5 },

  // Ritual & rhythm
  { id: "sworn-evening", name: "Sworn Evening",  icon: "sleepy",
    desc: "Seven cups for calm, sleepy, or soothing.",
    earned: ctx => ctx.restfulCups >= 7 },
  { id: "dawn-watcher", name: "Dawn Watcher",    icon: "energy",
    desc: "Five cups logged before seven a.m.",
    earned: ctx => ctx.morningCups >= 5 },
  { id: "steady-cup",   name: "Steady Cup",      icon: "comfort",
    desc: "Thirty cups in the journal.",
    earned: ctx => ctx.yourSessions.length >= 30 },

  // Self-knowledge
  { id: "self-knower",  name: "Self-Knower",     icon: "focus",
    desc: "Ten predicted moods that landed.",
    earned: ctx => ctx.matched >= 10 },
  { id: "honest-critic", name: "The Honest Critic", icon: "digestive",
    desc: "Log five cups rated two stars or fewer.",
    earned: ctx => ctx.lowRated >= 5 },
  { id: "refiner",      name: "The Refiner",     icon: "warming",
    desc: "Brew the same blend five times.",
    earned: ctx => ctx.refinerCount >= 5 },

  // Curation
  { id: "lavandiere",   name: "The Lavandière",  icon: "calm",
    desc: "Try every flower in the catalog.",
    earned: ctx => ctx.flowerIngsAll.length > 0 && ctx.flowerIngsTried.length === ctx.flowerIngsAll.length },
];

export function evaluateBadges(ctx) {
  return BADGES.map(b => ({ ...b, earned: !!b.earned(ctx) }));
}

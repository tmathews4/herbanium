/* ──────────────────────────────────────────────────────────────
   data/wildElementals.js — chance-based ad-hoc elementals.

   Most elementals are deterministic — earned by hitting a specific
   condition (ten cups, smokesworn, four-corners, etc.). Wild
   elementals are the exception: a 1/15 roll on every brew or
   journal entry, throttled to one per week so the surprise stays
   a surprise.

   The adjective and creature pools are weighted by the user's
   mood/flavor trends so the wandering spirit feels related to how
   they've been brewing — biased items get triple weight, everything
   else stays in the pool at single weight.
   ────────────────────────────────────────────────────────────── */

import {
  ALL_ADJECTIVES, RANDOM_CREATURE_POOL,
} from "./elementalAdjectives";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ROLL_DENOMINATOR = 15;

// Adjective pools that lean toward a given mood. A user brewing a
// lot of "calm" cups gets a higher chance of meeting a Hush Otter
// or a Mist Heron. Items must be drawn from ALL_ADJECTIVES — any
// term not present is silently ignored by the weighting pass.
const MOOD_ADJECTIVES = {
  calm:      ["Hush", "Mist", "Moonstone", "Pearl", "Dew", "Twilight", "Aquamarine", "Glow", "Cloud", "Drizzle"],
  focus:     ["Stone", "Slate", "Quartz", "Crystal", "Lightning", "Sunfire", "Granite", "Star", "Sky"],
  energy:    ["Sunfire", "Sun", "Sunstone", "Topaz", "Citrine", "Daybreak", "Blaze", "Fire", "Lightning"],
  comfort:   ["Ember", "Amber", "Gold", "Glow", "Sunset", "Carnelian", "Coral", "Hush"],
  sleepy:    ["Dusk", "Twilight", "Midnight", "Moonstone", "Moon", "Shadow", "Fog"],
  soothing:  ["Hush", "Pearl", "Moonstone", "Dew", "Aquamarine", "Glow", "Mist", "Drizzle"],
  warming:   ["Ember", "Amber", "Cinder", "Carnelian", "Sunset", "Gold", "Blaze"],
  cooling:   ["Frost", "Mist", "Aquamarine", "Dew", "Drizzle", "Crystal", "Tide", "River"],
  digestive: ["Earth", "Wood", "Stone", "Bramble", "Jade", "Sandstone"],
  grounding: ["Stone", "Earth", "Onyx", "Slate", "Granite", "Obsidian", "Wood", "Hematite"],
  uplifting: ["Daybreak", "Sun", "Sunfire", "Citrine", "Topaz", "Bloom", "Aurora", "Light"],
};

const FLAVOR_ADJECTIVES = {
  floral:  ["Bloom", "Pearl", "Rose-Quartz", "Aurora", "Glow", "Meadow", "Dew"],
  earthy:  ["Earth", "Stone", "Onyx", "Wood", "Bramble", "Jasper", "Hematite"],
  citrus:  ["Citrine", "Sunstone", "Daybreak", "Sun", "Topaz", "Heliodor"],
  spiced:  ["Cinder", "Ember", "Carnelian", "Cinnabar", "Amber", "Fire"],
  minty:   ["Frost", "Aquamarine", "Mist", "Tide", "Crystal"],
  fruity:  ["Carnelian", "Coral", "Garnet", "Amber", "Bloom"],
  sweet:   ["Amber", "Gold", "Topaz", "Carnelian"],
  grassy:  ["Meadow", "Wood", "Bramble", "Jade", "Bloom"],
  smoky:   ["Smoke", "Ash", "Cinder", "Coal", "Smoky-Quartz", "Shadow"],
  mineral: ["Stone", "Slate", "Quartz", "Granite", "Marble", "Pyrite"],
  honeyed: ["Amber", "Gold", "Topaz", "Citrine"],
  umami:   ["Tide", "River", "Onyx", "Hematite"],
  woody:   ["Wood", "Bramble", "Earth", "Bloodstone"],
  roasted: ["Cinder", "Ember", "Coal", "Smoky-Quartz", "Carnelian"],
  bitter:  ["Onyx", "Coal", "Hematite", "Slate"],
  tart:    ["Citrine", "Topaz", "Heliodor", "Sun"],
  vegetal: ["Meadow", "Wood", "Jade", "Bloom"],
  nutty:   ["Amber", "Sandstone", "Cinder", "Carnelian"],
  savory:  ["Tide", "River", "Stone", "Jade"],
};

// Creatures that lean toward a given mood register. Energy moods
// bring fast/bright animals, calm moods bring soft/quiet ones,
// grounding moods bring earthbound ones.
const MOOD_CREATURES = {
  calm:      ["Owl", "Heron", "Dove", "Doe", "Cat", "Tortoise", "Hummingbird"],
  focus:     ["Owl", "Spider", "Mantis", "Crow", "Magpie", "Heron"],
  energy:    ["Hawk", "Falcon", "Phoenix", "Tiger", "Lark", "Hummingbird", "Magpie"],
  comfort:   ["Bear", "Hare", "Otter", "Cat", "Hedgehog", "Tanuki", "Marmot"],
  sleepy:    ["Bat", "Owl", "Mole", "Doe", "Hedgehog", "Cat", "Tortoise"],
  soothing:  ["Dove", "Heron", "Doe", "Otter", "Hare", "Cat"],
  warming:   ["Phoenix", "Bear", "Salamander", "Tiger", "Hound", "Pyralis"],
  cooling:   ["Otter", "Heron", "Frog", "Newt", "Crane"],
  digestive: ["Tortoise", "Hare", "Beaver", "Hedgehog", "Marmot"],
  grounding: ["Bear", "Stag", "Tortoise", "Boar", "Mole", "Beaver", "Mongoose"],
  uplifting: ["Lark", "Robin", "Hummingbird", "Phoenix", "Magpie", "Dove"],
};

function tally(arr) {
  const out = {};
  for (const x of arr || []) {
    if (!x) continue;
    out[x] = (out[x] || 0) + 1;
  }
  return out;
}

function topKeys(counts, n = 3) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

// Weighted sampler. Items present in `biased` get triple weight;
// every other pool member stays at single weight so unusual rolls
// still happen.
function weightedPick(pool, biased, rng) {
  const biasSet = new Set(biased || []);
  const weights = pool.map(item => biasSet.has(item) ? 3 : 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function extractMoodTrends(sessions, journalEntries) {
  const moods = [];
  for (const s of sessions || []) {
    if (Array.isArray(s.currentMoods)) moods.push(...s.currentMoods);
    if (Array.isArray(s.targetMoods))  moods.push(...s.targetMoods);
    if (typeof s.actual === "string") {
      for (const m of s.actual.split(",").map(x => x.trim()).filter(Boolean)) {
        moods.push(m);
      }
    }
  }
  for (const e of journalEntries || []) {
    if (Array.isArray(e.currentMoods)) moods.push(...e.currentMoods);
    if (Array.isArray(e.landedMoods))  moods.push(...e.landedMoods);
  }
  return tally(moods);
}

function extractFlavorTrends(sessions, getBlend) {
  const flavors = [];
  for (const s of sessions || []) {
    const blend = getBlend ? getBlend(s.blendId) : null;
    if (!blend) continue;
    if (typeof blend.flavor === "string") flavors.push(blend.flavor);
    if (Array.isArray(blend.flavors))    flavors.push(...blend.flavors);
  }
  return tally(flavors);
}

/**
 * Try to roll a wild elemental for the given event.
 *   null   — rate-limited (last roll within 7 days) or 1/15 missed
 *   object — a wild elemental, ready to merge into the bestiary
 *
 * The caller is responsible for persisting the returned object and
 * updating `lastWildAt` to the current time.
 */
export function maybeRollWild({
  lastWildAt = 0,
  sessions = [],
  journalEntries = [],
  getBlend,
  rng = Math.random,
  now = Date.now(),
}) {
  if (lastWildAt && now - lastWildAt < WEEK_MS) return null;
  if (rng() >= 1 / ROLL_DENOMINATOR) return null;

  const moodCounts   = extractMoodTrends(sessions, journalEntries);
  const flavorCounts = extractFlavorTrends(sessions, getBlend);
  const topMoods     = topKeys(moodCounts, 2);
  const topFlavors   = topKeys(flavorCounts, 2);

  const biasedAdj = [
    ...topMoods.flatMap(m => MOOD_ADJECTIVES[m] || []),
    ...topFlavors.flatMap(f => FLAVOR_ADJECTIVES[f] || []),
  ];
  const biasedCre = topMoods.flatMap(m => MOOD_CREATURES[m] || []);

  const adjective = weightedPick(ALL_ADJECTIVES, biasedAdj, rng);
  const creature  = weightedPick(RANDOM_CREATURE_POOL, biasedCre, rng);

  const trendBits = [];
  if (topMoods[0])   trendBits.push(`a steady draw toward ${topMoods[0]}`);
  if (topFlavors[0]) trendBits.push(`the ${topFlavors[0]} note in your kettle`);
  const trail = trendBits.length > 0
    ? `Drawn here by ${trendBits.join(" and ")}.`
    : `Drawn here by the rhythm of your week.`;

  const desc = `A wild elemental that wandered into the steam between cups. ${trail}`;
  const ts = now;
  return {
    id: `wild-${ts}`,
    name: `The ${adjective} ${creature}`,
    displayName: `The ${adjective} ${creature}`,
    adjective,
    creature,
    rarity: "rare",
    desc,
    earned: true,
    wild: true,
    ts,
  };
}

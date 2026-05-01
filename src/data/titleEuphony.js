/* ──────────────────────────────────────────────────────────────
   data/titleEuphony.js — shared "sounds good" logic.

   Two layers, used by both the unique creation title (a fixed
   gem-name assembled at signup) and the mood crystal (a dynamic
   name regenerated as the user's activity shifts):

     - ADJECTIVE_RANK  → English-order modifier sorting. Color
                         words sit in front of origin/phenomenon
                         words sit in front of material words.
     - euphonyOK       → phonetic sanity. Alliteration, stutter
                         (consonant tail meets same consonant
                         head), and root echo (one word's stem
                         appears inside another) all trip false.

   Centralizing means the two title surfaces stay phonetically
   aligned — a name that fails euphony on one would fail on the
   other, and the same retry / fallback policy applies to both.
   ────────────────────────────────────────────────────────────── */

// English "royal order" adjective categories, lowest rank first.
// Two modifiers in front of a noun should appear in ascending rank:
//
//   color (0) → origin/phenomenon (1) → material (2) → noun
//
// The gem pool is mixed — half its entries (Onyx, Ruby, Jade,
// Topaz, Pearl, Coal, Gold) read as colors first and only secondarily
// as substances; the rest (Marble, Granite, Quartz, Crystal, Diamond,
// Agate, Moonstone, Opal) read as materials. A color-reading gem
// belongs in front of an origin word: "Onyx Drizzle Moose," not
// "Drizzle Onyx Moose," because the ear hears Onyx as black before
// it hears Onyx as a stone.
export const ADJECTIVE_RANK = {
  // 0 — color (gems whose color reading dominates over their
  // material reading; pure color words would also live here)
  Onyx: 0, Ruby: 0, Garnet: 0, Emerald: 0, Jade: 0, Topaz: 0, Citrine: 0,
  Aquamarine: 0, Turquoise: 0, Coral: 0, Amber: 0, Carnelian: 0,
  Cinnabar: 0, Bloodstone: 0, Hematite: 0, Pyrite: 0, Coal: 0, Gold: 0,
  Copper: 0, Sunstone: 0, Tigereye: 0, "Smoky-Quartz": 0, "Rose-Quartz": 0,
  Sandstone: 0, Jasper: 0, Slate: 0, Obsidian: 0, Pearl: 0,
  Goldstone: 0, Mookaite: 0, "Imperial-Topaz": 0, Beryl: 0, Honeycalcite: 0,
  // 1 — origin / phenomenon / time / state
  Mist: 1, Dew: 1, Vapor: 1, Fog: 1, Drizzle: 1, Brume: 1, Hush: 1,
  Light: 1, Sunfire: 1, Aurora: 1, Bloom: 1, Glow: 1, Glare: 1, Blaze: 1, Fire: 1,
  Wind: 1, Sky: 1, Cloud: 1, Lightning: 1, Storm: 1,
  Daybreak: 1, Sun: 1, Sunset: 1, Twilight: 1, Dusk: 1, Midnight: 1, Crescent: 1, Moon: 1,
  Tide: 1, River: 1, Rain: 1, Frost: 1, Smoke: 1, Shadow: 1, Void: 1, Star: 1, Meadow: 1,
  // 2 — material / substance (read as substance first, color second)
  Stone: 2, Wood: 2, Earth: 2, Ash: 2, Cinder: 2, Ember: 2, Bramble: 2, Nightshade: 2,
  Marble: 2, Granite: 2, Quartz: 2, Crystal: 2, Diamond: 2, Agate: 2,
  Moonstone: 2, Opal: 2,
  // Plant-side material — botanicals read like Bramble (substance
  // first, the herb's namesake green is a quieter secondary).
  Sage: 2,
};

// Returns the adjective category rank for ordering. Unknown words
// default to material (2) — newer pool entries tend to be specific
// nouns, and forcing them later in the chain is the safer side to
// fail on if a phenomenon word is accidentally typed in.
export function adjectiveRank(word) {
  return ADJECTIVE_RANK[word] ?? 2;
}

// Sort a pair of modifiers into English adjective order. Stable —
// when ranks tie, the original (a, b) order is preserved so any
// upstream convention (element-then-gem, primary-then-secondary)
// still controls equal-rank cases.
export function orderModifiers(a, b) {
  const rA = adjectiveRank(a);
  const rB = adjectiveRank(b);
  return rA <= rB ? [a, b] : [b, a];
}

// Phonetic sanity check. Catches the patterns that make a title sound
// like a tongue-twister regardless of grammatical correctness:
//
//   - Alliteration: adjacent words start with the same consonant
//     ("Storm Stone Stoat" — three s-words in a row reads as a
//     mistake, not a name).
//   - Stutter: a word ends in the same consonant the next begins
//     with ("Mist Stone" — st-st clamps the boundary).
//   - Root echo: one modifier contains the stem of the other
//     ("Sun Sunstone", "Stone Sandstone") — feels redundant.
//
// Vowel-vs-vowel boundaries are fine ("Aurora Onyx") so we don't
// penalize those. Returns false when any rule trips.
export function euphonyOK(words) {
  const norm = (w) => (w || "").toLowerCase().replace(/[^a-z]/g, "");
  const isConsonant = (ch) => /[bcdfghjklmnpqrstvwxz]/.test(ch);
  for (let i = 0; i < words.length - 1; i++) {
    const a = norm(words[i]);
    const b = norm(words[i + 1]);
    if (!a || !b) continue;
    if (a[0] === b[0] && isConsonant(a[0])) return false;
    const tail = a[a.length - 1];
    const head = b[0];
    if (tail === head && isConsonant(tail)) return false;
    if (a.length >= 4 && b.length >= 4) {
      const stemA = a.slice(0, 4);
      const stemB = b.slice(0, 4);
      if (a.includes(stemB) || b.includes(stemA)) return false;
    }
  }
  return true;
}

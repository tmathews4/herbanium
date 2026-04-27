/* ──────────────────────────────────────────────────────────────
   helpers/misc.js — small shared utilities (mmss time format, getBlend lookup, iconBtn style)
   ────────────────────────────────────────────────────────────── */

import { BLENDS } from "../data/blends";
import { INGREDIENTS } from "../data/ingredients";
import {
  ff, theme,
} from "../theme";

// LOCAL_BLENDS: mock-only in-memory store for blends that didn't exist
// at boot — e.g. a user's newly-posted blend. Real app would persist these
// to the backing store instead. Lives at module scope so getBlend() can
// find them regardless of which component is looking.
export const LOCAL_BLENDS = {};

export const getBlend = (id) => LOCAL_BLENDS[id] || BLENDS.find(b => b.id === id);

export const mmss = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

export const iconBtn = () => ({
  fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft,
  background: "transparent", border: `1px solid ${theme.rule}`,
  borderRadius: 10, padding: "12px 12px", cursor: "pointer",
});

// Title-case a single ingredient name for display in a suggested
// blend title. "lemon balm" → "Lemon Balm", "pu-erh" → "Pu-Erh".
function titleCaseIng(s) {
  return (s || "")
    .split(/(\s+|-)/)
    .map(part => /^[\s-]+$/.test(part) ? part : (part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join("");
}

// Suggest a blend name from its ingredient list. Picks the top two
// by grams (the heaviest ingredients carry the cup), falling back
// to first two by position when grams are missing or equal. Joins
// with an ampersand for a clean two-word title; one-ingredient
// blends drop the ampersand. Trailing accent ingredients are
// summarised with "+ accents" rather than listed exhaustively.
export function suggestBlendName(ingredients) {
  if (!ingredients || ingredients.length === 0) return "Untitled blend";
  const sorted = [...ingredients].sort((a, b) => (b.g || 0) - (a.g || 0));
  const named = sorted.map(i => {
    const meta = INGREDIENTS[i.id];
    return titleCaseIng(meta?.name || i.id || "");
  }).filter(Boolean);
  if (named.length === 0) return "Untitled blend";
  if (named.length === 1) return named[0];
  if (named.length === 2) return `${named[0]} & ${named[1]}`;
  return `${named[0]} & ${named[1]} + accents`;
}

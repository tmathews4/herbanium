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

// Representative ingredients for a vocab term (effect or flavor).
// Used to surface "found in: chamomile, lemon balm, tulsi…" alongside
// the abstract description, so users can map a vocabulary term to
// ingredients they already know. Derives from INGREDIENTS data so
// the example list stays self-maintaining as ingredients are added
// or recalibrated. For effects, ranks by strength on the ingredient
// (top 5). For flavors, lists any ingredient that includes the
// flavor in its top-level flavors array.
export function ingredientsForVocab(tag, kind) {
  if (!tag) return [];
  const out = [];
  for (const [id, meta] of Object.entries(INGREDIENTS)) {
    if (kind === "effect") {
      const e = (meta.effects || []).find(([n]) => n === tag);
      if (e && e[1] >= 3) out.push({ id, name: meta.name, weight: e[1] });
    } else if (kind === "flavor") {
      if ((meta.flavors || []).includes(tag)) {
        out.push({ id, name: meta.name, weight: 0 });
      }
    }
  }
  return out
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 5);
}

// How long off a rolling boil water needs to rest to reach the
// target. Returns null at full boil (no rest needed). The mapping
// is the same scale used in BlendDetail's brewing directions so a
// user sees the same vocabulary in both surfaces.
export function restHintForCelsius(celsius) {
  if (celsius >= 100) return null;
  if (celsius >= 95) return "about 20 seconds off the boil";
  if (celsius >= 90) return "about 1 minute off the boil";
  if (celsius >= 85) return "about 2 minutes off the boil";
  if (celsius >= 80) return "3–4 minutes off the boil";
  if (celsius >= 75) return "4–5 minutes off the boil";
  if (celsius >= 70) return "5–6 minutes off the boil, or boiling into an open cup and back";
  if (celsius >= 65) return "equal parts boiling and room-temperature water";
  if (celsius >= 60) return "two parts room-temperature, one part boiling";
  return "boil, rest 5–8 minutes, then add a splash of cold water";
}

// Parse the timestamp baked into a session id ("sess-<ms>"). Returns
// a Date or null when the id is missing or malformed.
export function sessionDate(session) {
  const n = parseInt(String(session?.id || "").replace("sess-", ""), 10);
  return Number.isFinite(n) ? new Date(n) : null;
}

// Relative "X ago" string from a Date. Stable formatting: "just now",
// "5m ago", "3h ago", "2d ago", or a short month-day for older items.
// Used for both cup sessions and journal entries.
export function formatAgo(date) {
  if (!date) return "";
  const now = Date.now();
  const diffMin = Math.round((now - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Convenience: relative time for a brewed-cup session, derived from
// its id timestamp so the row stays accurate across reloads instead
// of being frozen at the "just now" string set at create time.
export function sessionAgo(session) {
  return formatAgo(sessionDate(session));
}

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

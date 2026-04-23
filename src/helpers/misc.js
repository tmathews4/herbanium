/* ──────────────────────────────────────────────────────────────
   helpers/misc.js — small shared utilities (mmss time format, getBlend lookup, iconBtn style)
   ────────────────────────────────────────────────────────────── */

import { BLENDS } from "../data/blends";
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

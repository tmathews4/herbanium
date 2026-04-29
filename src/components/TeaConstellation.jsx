/* ──────────────────────────────────────────────────────────────
   components/TeaConstellation.jsx — your tea life as a star map.

   Every cup the user has logged plots as a small dot in a 2D
   sensory space:

     X axis:  cool ←————→ warm
              (cooling/citrus/grassy on the left,
               spiced/smoky/warm on the right)

     Y axis:  bright ↑————↓ deep
              (citrus/floral/honey at top,
               earthy/woody/malty at bottom)

   Each dot:
     - color   = blend's mood register (calm/sage, energy/ochre,
                                         comfort/rose, etc.)
     - size    = the user's taste rating for that cup
     - opacity = freshness — recent cups vivid, old cups fade
                  to ghost-like, so the eye reads current
                  habits while the full history breathes
                  underneath.

   Tap a dot to open the cup detail. A short personality readout
   under the map names the quadrant the user gravitates toward —
   "the hearth-keeper", "the dawn drinker" — so the constellation
   doubles as a quiet identity reflection.

   Implementation note: positions are computed from the blend's
   static flavor list (with an ingredient-list fallback). A more
   accurate version would run the brew engine at the user's
   actual session temp/time, but the static read is cheap and
   close enough for the panoramic view this is meant to be.
   ────────────────────────────────────────────────────────────── */

import React, { useMemo, useState } from "react";
import { INGREDIENTS } from "../data/ingredients";
import { getBlend } from "../helpers/misc";
import { ff, theme } from "../theme";

// Each known flavor maps to a 2D vector contribution. Empty entries
// (flavors not in the table) contribute nothing — they don't pull
// the cup in any direction. Tuning is by ear; the goal is for cups
// to land roughly where a thoughtful drinker would expect them
// (sencha cool-bright, lapsang warm-deep, dusk lullaby cool-bright,
// chai warm-mid, etc.).
const FLAVOR_VEC = {
  // cool side
  cool: [-1, -0.4],   cooling: [-1, -0.3], menthol: [-1, 0],
  minty: [-0.85, -0.2], mint: [-0.85, -0.2], camphor: [-0.9, 0.1],
  citrus: [-0.55, -0.8], bright: [-0.25, -0.85], fresh: [-0.4, -0.55],
  marine: [-0.7, 0.35], grassy: [-0.4, 0.2], vegetal: [-0.3, 0.1],
  umami: [-0.55, 0.4], oceanic: [-0.65, 0.35], seaweed: [-0.75, 0.45],
  buttery: [-0.3, 0.2], savory: [-0.35, 0.4],
  // floral / honeyed / sweet — bright, neutral warmth
  floral: [-0.05, -0.7], rose: [0, -0.6], orchid: [-0.05, -0.55],
  honey: [0.15, -0.4], honeyed: [0.15, -0.4], sweet: [0, -0.35],
  delicate: [-0.1, -0.55], melon: [-0.05, -0.6], hay: [0.1, -0.2],
  apricot: [0.05, -0.45], peach: [0.05, -0.45],
  // muscatel / fruit — slight warm, mid bright
  muscatel: [0.1, -0.3], fruit: [0.1, -0.3], fruity: [0.1, -0.4],
  tart: [-0.2, -0.3], berry: [0.1, -0.3], cranberry: [0.1, -0.3],
  // spiced / warm
  spiced: [0.75, 0.2], cinnamon: [0.7, 0.25], ginger: [0.75, 0.1],
  pepper: [0.85, 0.25], peppery: [0.85, 0.25], clove: [0.6, 0.3],
  cardamom: [0.55, 0.1], aromatic: [0.4, 0.1], licorice: [-0.1, 0.2],
  warm: [0.6, 0.25], pungent: [0.55, 0.25], hot: [0.7, 0.25],
  numbing: [0.5, 0.2],
  // earthy / deep / dark
  earthy: [0.35, 0.8], woody: [0.35, 0.7], wood: [0.35, 0.7],
  dark: [0.45, 0.9], leather: [0.45, 0.7], mineral: [0.2, 0.6],
  mushroom: [0.25, 0.75], musty: [0.35, 0.7], musky: [0.35, 0.6],
  bramble: [0.3, 0.5], bean: [0.1, 0.4],
  // malty / bold / chocolate
  malty: [0.55, 0.7], bold: [0.45, 0.6], robust: [0.45, 0.7],
  brisk: [0.25, 0.4], cocoa: [0.45, 0.6], chestnut: [0.3, 0.45],
  nutty: [0.3, 0.5], rich: [0.35, 0.5], creamy: [0.2, 0.3],
  // smoky
  smoky: [0.65, 0.55], smoked: [0.65, 0.55], campfire: [0.75, 0.5],
  pine: [0.45, 0.45], tar: [0.55, 0.65], coal: [0.5, 0.7],
  // roasted / toasted
  roasted: [0.45, 0.55], toasted: [0.3, 0.4], caramel: [0.3, 0.25],
  // off-notes don't define identity but slightly nudge depth
  bitter: [0.15, 0.35], astringent: [0.2, 0.35], tannic: [0.3, 0.4],
};

// Each mood register gets a tone-matched dot color. Same family
// palette the TrackMap uses, so the constellation feels native to
// the app's existing visual vocabulary.
const MOOD_COLOR = {
  calm:      "#6D7E55",  // sage
  soothing:  "#6D7E55",
  cooling:   "#7F9AA0",  // sky
  focus:     "#7F9AA0",
  energy:    "#A57836",  // ochre
  uplifting: "#A57836",
  comfort:   "#C37959",  // rose
  warming:   "#C37959",
  digestive: "#4A573A",  // sageDeep
  grounding: "#4A573A",
  sleepy:    "#7B4A5A",  // plum
};

// Quadrant readouts keyed (warmSign, deepSign). The strings are
// deliberately short and evocative — read as a small horoscope
// rather than a hard taxonomy.
const QUADRANT_READOUTS = {
  "cool-bright":  { name: "the dawn drinker",  body: "you reach for cups that lift before they land — clean tops, light bodies, mornings made of glass." },
  "warm-bright":  { name: "the lifted hearth", body: "your cups warm without weighing down — bright spice and floral lift, comfort without heaviness." },
  "cool-deep":    { name: "the still pool",    body: "you favor depth that doesn't push back — quiet earth, marine umami, cups that settle slowly." },
  "warm-deep":    { name: "the hearth-keeper", body: "your cups carry weight — malty depth, smoke, the kind of warmth that holds a long evening." },
  "balanced":     { name: "the open ear",      body: "your tea life ranges across registers — no fixed home, every cup its own thing." },
};

// Map a blend to a (x, y) position in [-1, +1]² space. Averages the
// flavor vectors with equal weight; flavors not in the table just
// don't contribute. Falls back to ingredient flavors when the blend
// itself doesn't carry a flavor list.
function positionFor(blend) {
  if (!blend) return null;
  let flavors = Array.isArray(blend.flavors) ? [...blend.flavors] : [];
  if (flavors.length === 0 && Array.isArray(blend.ingredients)) {
    const set = new Set();
    for (const ing of blend.ingredients) {
      const meta = INGREDIENTS[ing.id];
      if (meta?.flavors) meta.flavors.forEach(f => set.add(f));
    }
    flavors = [...set];
  }
  if (flavors.length === 0) return { x: 0, y: 0 };
  let sx = 0, sy = 0, n = 0;
  for (const f of flavors) {
    const v = FLAVOR_VEC[String(f).toLowerCase()];
    if (v) { sx += v[0]; sy += v[1]; n++; }
  }
  if (n === 0) return { x: 0, y: 0 };
  // Slight gentle clamp so single-axis-extreme blends don't push
  // dots off the edge of the visible plot.
  const x = Math.max(-0.95, Math.min(0.95, sx / n));
  const y = Math.max(-0.95, Math.min(0.95, sy / n));
  return { x, y };
}

// Pull a timestamp out of a session by any available field.
const tsOf = (s) => {
  if (typeof s.brewedAt === "number") return s.brewedAt;
  const m = String(s.id || "").match(/sess-(\d+)/);
  return m ? Number(m[1]) : 0;
};

export const TeaConstellation = ({ sessions, openCup }) => {
  const [hoverId, setHoverId] = useState(null);

  // Compute every cup's plot position once per session-list change.
  // Sessions without resolvable blends drop out silently.
  const dots = useMemo(() => {
    const cupSessions = (sessions || []).filter(s => s.who === "you" && s.blendId);
    return cupSessions.map(s => {
      const blend = getBlend(s.blendId);
      if (!blend) return null;
      const pos = positionFor(blend);
      if (!pos) return null;
      return {
        s, blend, pos,
        ts: tsOf(s),
      };
    }).filter(Boolean);
  }, [sessions]);

  if (dots.length === 0) return null;

  // Quadrant density tally for the personality readout. A modest
  // central neutral zone gets its own bucket so a user with a
  // truly broad palate doesn't get pinned to whichever quadrant
  // happens to lead by one cup.
  const density = useMemo(() => {
    const counts = { "cool-bright": 0, "warm-bright": 0, "cool-deep": 0, "warm-deep": 0, neutral: 0 };
    const NEUTRAL = 0.18;  // |x| or |y| under this counts as central
    for (const d of dots) {
      const { x, y } = d.pos;
      if (Math.abs(x) < NEUTRAL && Math.abs(y) < NEUTRAL) {
        counts.neutral++;
      } else {
        const xKey = x < 0 ? "cool" : "warm";
        const yKey = y < 0 ? "bright" : "deep";
        counts[`${xKey}-${yKey}`]++;
      }
    }
    return counts;
  }, [dots]);

  // Pick the dominant quadrant. If neutral leads or no quadrant
  // has a clear majority, fall back to the "balanced" reading.
  const readoutKey = useMemo(() => {
    const total = dots.length;
    const sorted = Object.entries(density)
      .filter(([k]) => k !== "neutral")
      .sort((a, b) => b[1] - a[1]);
    const [topKey, topCount] = sorted[0] || [];
    const neutralShare = density.neutral / total;
    if (neutralShare >= 0.45) return "balanced";
    if (topCount / total < 0.32) return "balanced";
    return topKey || "balanced";
  }, [density, dots.length]);

  const readout = QUADRANT_READOUTS[readoutKey] || QUADRANT_READOUTS.balanced;

  // SVG dimensions. Square aspect ratio so the X and Y axes carry
  // equal visual weight — the map is a sensory plane, not a graph.
  const W = 320, H = 320;
  const PADDING = 28;
  const innerW = W - PADDING * 2;
  const innerH = H - PADDING * 2;
  const toX = (x) => PADDING + ((x + 1) / 2) * innerW;
  const toY = (y) => PADDING + ((y + 1) / 2) * innerH;

  // Age-based fade. The freshest week stays at full opacity; cups
  // fade toward 0.30 as they age past 60 days. Floor of 0.25 so
  // even ancient cups still show up as ghost dots — the full life
  // of the journal is the point.
  const now = Date.now();
  const opacityFor = (ts) => {
    const days = (now - ts) / 86400000;
    if (days < 7) return 1;
    if (days < 30) return 0.78;
    if (days < 90) return 0.50;
    return 0.30;
  };

  // Taste rating drives dot size. Median (3) = baseline 4.5px;
  // a 5-star cup is a noticeably larger dot, a 1-star one is
  // visibly smaller. Caps so the chart never gets blown out.
  const radiusFor = (taste) => {
    const t = Math.max(1, Math.min(5, taste || 3));
    return 3 + (t - 1) * 0.9;
  };

  return (
    <div style={{
      padding: "14px 14px 12px",
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 12,
      boxShadow: "0 1px 2px rgba(30,24,18,0.04)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 4,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.2em",
          textTransform: "uppercase", color: theme.inkSoft,
        }}>
          your tea constellation
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
          color: theme.ash,
        }}>
          {dots.length} {dots.length === 1 ? "cup" : "cups"}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Quadrant tints — barely-there washes so each corner has
            its own ambient temperature without making the chart
            busy. Reads as "the room is warmer here." */}
        <rect x={PADDING}    y={PADDING}    width={innerW/2} height={innerH/2}
              fill="rgba(127,154,160,0.04)" />
        <rect x={W/2}        y={PADDING}    width={innerW/2} height={innerH/2}
              fill="rgba(189,148,76,0.04)" />
        <rect x={PADDING}    y={H/2}        width={innerW/2} height={innerH/2}
              fill="rgba(74,87,58,0.04)" />
        <rect x={W/2}        y={H/2}        width={innerW/2} height={innerH/2}
              fill="rgba(176,84,47,0.04)" />

        {/* Crosshair axes — soft dashed so they read as guides, not
            content. The reader's eye should land on the dots. */}
        <line x1={PADDING} y1={H/2} x2={W-PADDING} y2={H/2}
              stroke={theme.rule} strokeWidth="1" strokeDasharray="2 4" />
        <line x1={W/2} y1={PADDING} x2={W/2} y2={H-PADDING}
              stroke={theme.rule} strokeWidth="1" strokeDasharray="2 4" />

        {/* Axis labels at the four cardinal points. */}
        <text x={PADDING - 2} y={H/2 + 3.5}
              fontSize="9" fill={theme.ash} textAnchor="end"
              fontFamily="sans-serif" letterSpacing="0.16em">
          COOL
        </text>
        <text x={W - PADDING + 2} y={H/2 + 3.5}
              fontSize="9" fill={theme.ash} textAnchor="start"
              fontFamily="sans-serif" letterSpacing="0.16em">
          WARM
        </text>
        <text x={W/2} y={PADDING - 8}
              fontSize="9" fill={theme.ash} textAnchor="middle"
              fontFamily="sans-serif" letterSpacing="0.16em">
          BRIGHT
        </text>
        <text x={W/2} y={H - PADDING + 14}
              fontSize="9" fill={theme.ash} textAnchor="middle"
              fontFamily="sans-serif" letterSpacing="0.16em">
          DEEP
        </text>

        {/* Cup dots. Older first so newer dots sit on top — recent
            cups visually dominate, which matches how the user
            actually thinks about their tea life. */}
        {[...dots].sort((a, b) => a.ts - b.ts).map(d => {
          const { s, blend, pos, ts } = d;
          const cx = toX(pos.x);
          const cy = toY(pos.y);
          const op = opacityFor(ts);
          const r = radiusFor(s.taste);
          const color = MOOD_COLOR[blend.mood] || theme.ash;
          const isHovered = hoverId === s.id;
          return (
            <g key={s.id}>
              {isHovered && (
                <circle
                  cx={cx} cy={cy} r={r + 4}
                  fill="none"
                  stroke={color} strokeWidth="1" strokeOpacity="0.55"
                />
              )}
              <circle
                cx={cx} cy={cy} r={r}
                fill={color}
                fillOpacity={op}
                stroke={theme.cream} strokeWidth="0.75"
                style={{ cursor: openCup ? "pointer" : "default" }}
                onClick={openCup ? () => openCup(s.id) : undefined}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <title>{blend.name}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Personality readout — short horoscope-style identity line
          for the dominant quadrant. The italic tone keeps it
          reflective rather than diagnostic. */}
      <div style={{
        marginTop: 10, padding: "8px 10px",
        background: "rgba(176,84,47,0.04)",
        border: `1px solid ${theme.ruleSoft}`,
        borderRadius: 8,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: ff.serif, fontSize: 14, color: theme.ink,
          fontStyle: "italic",
          letterSpacing: "0.01em",
        }}>
          You are <span style={{ color: theme.terra, fontStyle: "normal", fontWeight: 500 }}>{readout.name}</span>.
        </div>
        <div style={{
          marginTop: 4,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.45,
        }}>
          {readout.body}
        </div>
      </div>
    </div>
  );
};
